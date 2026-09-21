/**
 * Mount component for MigrationProgressModal — subscribes to
 * composer.migration events and drives the modal state.
 *
 * Lifecycle:
 *   migration:started  → open modal in 'running' state, build step list
 *                        from fromVersion+1..TARGET_PROJECT_VERSION, mark
 *                        first as running
 *   migration:complete → mark all steps done, close after a brief
 *                        flash so user sees the green checks
 *   migration:failed   → flip to 'failed' state, mark current step as
 *                        failed, populate error + stuck-at fields
 *   migration:skipped  → no-op (already at target version)
 *
 * Restore + Retry (A2, boards B1-14 `7564:185480` · B1-15 `7564:185497`;
 * plan decisions #22, #36, #44):
 *   Both go through `importMigratedProject` — the same run-then-import step
 *   the load uses — so the migrated tokens LAND in the engine. The runner is
 *   pure and only emits events; an earlier version called it and discarded
 *   the result, so the modal said "complete" while nothing changed.
 *   · Retry re-runs from the version the failed load started at
 *     (`fromVersion`), on the project the engine holds now. The failed load
 *     imported the payload as-is at that version, so every step must run
 *     again (they are idempotent by contract); starting at `stuckAt - 1`
 *     would skip the earlier steps AND make the runner overwrite the
 *     snapshot with a later marker. On failure nothing is imported and the
 *     events keep the modal in its failed view with the new error.
 *   · Restore reads localStorage["ds-migration-backup-<siteId>"] (+ the
 *     marker = the version it was taken at), and re-runs the load path with
 *     the snapshot as input — the board's Restore → running. If the update
 *     still fails, the snapshot is imported as-is, exactly the load's own
 *     fallback, so the project is back to the state from before the update.
 *     Missing snapshot → Restore is `aria-disabled` (focusable, per #19) with
 *     "No snapshot on this device"; corrupt JSON → its own reason, never a
 *     silent fall-through (#44).
 *
 * Wires:
 *   - composer.migration (A.1) — event source
 *   - importMigratedProject — the one write path into the engine
 *   - PROJECT_MIGRATIONS + TARGET_PROJECT_VERSION — step labels + range
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useToast } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import type { ProjectData } from "../../../shared/types";
import {
  PROJECT_MIGRATIONS,
  TARGET_PROJECT_VERSION,
} from "../../../engine/designSystem/migrations/projectMigrations";
import type { ProjectPayload } from "../../../engine/designSystem/migrations/projectMigrations/types";
import { importMigratedProject } from "../migrations/importMigratedProject";
import { MigrationProgressModal, type MigrationStep } from "./MigrationProgressModal";

interface MigrationStartedPayload {
  siteId: string;
  fromVersion: number;
}

interface MigrationCompletePayload {
  siteId: string;
  fromVersion: number;
  toVersion: number;
}

interface MigrationFailedPayload {
  siteId: string;
  fromVersion: number;
  error: string;
}

const COMPLETE_HOLD_MS = 600;
const SNAPSHOT_MISSING_REASON = "No snapshot on this device";
const SNAPSHOT_CORRUPT_REASON = "Snapshot not found — reload the site";
const RESTORED_TITLE = "Restored the snapshot from before the update";

/** Keys the runner writes (`projectMigrations/runner.ts`). */
function snapshotKey(siteId: string): string {
  return `ds-migration-backup-${siteId}`;
}

function markerKey(siteId: string): string {
  return `ds-migration-in-progress-${siteId}`;
}

function safeRead(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

type SnapshotProbe =
  | { payload: ProjectPayload; version: number }
  | { reason: string };

function readSnapshot(siteId: string): SnapshotProbe {
  const raw = safeRead(snapshotKey(siteId));
  if (raw === null) return { reason: SNAPSHOT_MISSING_REASON };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { reason: SNAPSHOT_CORRUPT_REASON };
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as ProjectPayload).tokens)) {
    return { reason: SNAPSHOT_CORRUPT_REASON };
  }
  // The marker is the version the snapshot was taken at. The runner writes
  // both together and clears both together; a snapshot without its marker
  // restores from v0, which is safe because every step is idempotent.
  const marker = Number.parseInt(safeRead(markerKey(siteId)) ?? "", 10);
  return { payload: parsed as ProjectPayload, version: Number.isFinite(marker) ? marker : 0 };
}

function buildSteps(fromVersion: number): MigrationStep[] {
  const steps: MigrationStep[] = [];
  for (let v = fromVersion + 1; v <= TARGET_PROJECT_VERSION; v++) {
    const migration = PROJECT_MIGRATIONS[v];
    steps.push({
      version: v,
      label: migration?.description ?? `Migration ${v}`,
      status: "queued",
    });
  }
  if (steps[0]) steps[0] = { ...steps[0], status: "running" };
  return steps;
}

export interface MigrationProgressMountProps {
  composer: Composer | null | undefined;
}

export const MigrationProgressMount: React.FC<MigrationProgressMountProps> = ({ composer }) => {
  const { addToast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<"running" | "failed">("running");
  const [steps, setSteps] = React.useState<MigrationStep[]>([]);
  const [fromVersion, setFromVersion] = React.useState<number | null>(null);
  const [failureMessage, setFailureMessage] = React.useState<string | undefined>();
  const [stuckAt, setStuckAt] = React.useState<number | undefined>();
  const [siteId, setSiteId] = React.useState<string | null>(null);
  const [snapshot, setSnapshot] = React.useState<SnapshotProbe | null>(null);
  // Counts `migration:started`. A Retry that fails again flips
  // running → failed inside one click, which React batches into "no change"
  // — the probe below keys on this so it re-reads for every run.
  const [runSeq, setRunSeq] = React.useState(0);
  // `migration:complete` fires before the import that follows it; if that
  // import throws, the close it scheduled must not hide the failed view.
  const closeTimer = React.useRef<number | null>(null);

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!composer) return;

    const onStarted = (payload: unknown) => {
      const p = payload as MigrationStartedPayload;
      cancelClose();
      setFromVersion(p.fromVersion);
      setSiteId(p.siteId);
      setSteps(buildSteps(p.fromVersion));
      setFailureMessage(undefined);
      setStuckAt(undefined);
      setSnapshot(null);
      setRunSeq((n) => n + 1);
      setState("running");
      setOpen(true);
    };

    const onComplete = (payload: unknown) => {
      const p = payload as MigrationCompletePayload;
      setSteps((prev) =>
        prev.map((s) =>
          s.version <= p.toVersion ? { ...s, status: "done" } : s
        )
      );
      // Brief hold so user sees the green checks before close.
      cancelClose();
      closeTimer.current = window.setTimeout(() => setOpen(false), COMPLETE_HOLD_MS);
    };

    const onFailed = (payload: unknown) => {
      const p = payload as MigrationFailedPayload;
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.status === "running");
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], status: "failed" };
        setStuckAt(next[idx].version);
        return next;
      });
      setFailureMessage(p.error);
      setState("failed");
    };

    composer.on("migration:started", onStarted);
    composer.on("migration:complete", onComplete);
    composer.on("migration:failed", onFailed);
    return () => {
      cancelClose();
      composer.off("migration:started", onStarted);
      composer.off("migration:complete", onComplete);
      composer.off("migration:failed", onFailed);
    };
  }, [composer, cancelClose]);

  // Probe the snapshot whenever the modal lands in its failed view, so
  // Restore opens in the right state (aria-disabled + reason, or the
  // "Snapshot saved" row with the version it restores to).
  React.useEffect(() => {
    if (state !== "failed" || !siteId) return;
    setSnapshot(readSnapshot(siteId));
  }, [state, siteId, runSeq]);

  const fail = React.useCallback(
    (err: unknown) => {
      cancelClose();
      setFailureMessage(err instanceof Error ? err.message : String(err));
      setState("failed");
    },
    [cancelClose]
  );

  const handleRestoreSnapshot = React.useCallback(() => {
    if (!composer || !siteId) return;
    // Re-read at click time: an intervening run may have cleared it.
    const probe = readSnapshot(siteId);
    if ("reason" in probe) {
      setSnapshot(probe);
      return;
    }
    const data: ProjectData = {
      ...composer.exportProject(),
      styles: probe.payload.tokens as unknown as ProjectData["styles"],
      dsSchemaVersion: probe.version,
    };
    try {
      importMigratedProject(composer, data, siteId);
      addToast({
        tone: "success",
        title: RESTORED_TITLE,
        description: "The project update then completed.",
      });
    } catch (err) {
      composer.importProject(data);
      fail(err);
      addToast({
        tone: "warning",
        title: RESTORED_TITLE,
        description: "The update still fails. The project is loaded as it was before it.",
      });
    }
  }, [composer, siteId, addToast, fail]);

  const handleRetry = React.useCallback(() => {
    if (!composer || !siteId || fromVersion === null) return;
    const data: ProjectData = { ...composer.exportProject(), dsSchemaVersion: fromVersion };
    try {
      importMigratedProject(composer, data, siteId);
    } catch (err) {
      fail(err);
    }
  }, [composer, siteId, fromVersion, fail]);

  if (!composer) return null;

  const rangeLabel =
    fromVersion !== null
      ? `Schema v${fromVersion} → v${TARGET_PROJECT_VERSION} · ${steps.length} migration${steps.length === 1 ? "" : "s"}`
      : undefined;
  const failed = state === "failed";

  return (
    <MigrationProgressModal
      open={open}
      onOpenChange={setOpen}
      state={state}
      steps={steps}
      rangeLabel={rangeLabel}
      failureMessage={failureMessage}
      snapshotLabel={failed && snapshot && "payload" in snapshot ? `Schema v${snapshot.version}` : undefined}
      stuckAt={stuckAt}
      onRestoreSnapshot={failed ? handleRestoreSnapshot : undefined}
      onRetry={failed ? handleRetry : undefined}
      restoreDisabledReason={failed && snapshot && "reason" in snapshot ? snapshot.reason : undefined}
    />
  );
};
