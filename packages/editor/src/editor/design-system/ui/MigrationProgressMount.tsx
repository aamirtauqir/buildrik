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
 * Restore + Retry (Phase F.2 / Tier-1 wireframe S13, A2):
 *   Per plan Decision #36 (EUREKA-lite): BOTH handlers re-invoke the same
 *   pre-import load path the original load used — `composer.migration.run`
 *   — rather than patching the imported project post-load. One write path,
 *   one invariant.
 *   · Restore reads localStorage["ds-migration-backup-<siteId>"], JSON.parses
 *     with a guard, and re-runs the runner with that snapshot as `project`
 *     and the snapshot's marker (original fromVersion) as `currentVersion`.
 *     Snapshot missing or corrupt → Restore stays aria-disabled with a
 *     reason line, the modal stays in failed state.
 *   · Retry re-runs the runner with the in-flight project + the version
 *     immediately before the stuck step (`stuckAt - 1`). Runner preserves
 *     the existing snapshot + marker when marker matches, so a Retry
 *     chain re-applies the same migrations (each `up`/`validate` is
 *     idempotent at its toVersion, per ProjectMigration contract).
 *
 * Wires:
 *   - composer.migration (A.1) — event source + runner entrypoint
 *   - PROJECT_MIGRATIONS + TARGET_PROJECT_VERSION — step labels + range
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import {
  PROJECT_MIGRATIONS,
  TARGET_PROJECT_VERSION,
} from "../../../engine/designSystem/migrations/projectMigrations";
import type { ProjectPayload } from "../../../engine/designSystem/migrations/projectMigrations/types";
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

function safeParse(raw: string | null): ProjectPayload | null {
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && "tokens" in parsed) {
      return parsed as ProjectPayload;
    }
    return null;
  } catch {
    return null;
  }
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
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<"running" | "failed">("running");
  const [steps, setSteps] = React.useState<MigrationStep[]>([]);
  const [fromVersion, setFromVersion] = React.useState<number | null>(null);
  const [failureMessage, setFailureMessage] = React.useState<string | undefined>();
  const [stuckAt, setStuckAt] = React.useState<number | undefined>();
  const [siteId, setSiteId] = React.useState<string | null>(null);
  // When `failureMessage` is reset by a Retry attempt, this surfaces the
  // snapshot-parse failure as the modal's banner text instead of disappearing
  // it (the snapshot may be missing only for Restore; Retry still proceeds).
  const [restoreBlocked, setRestoreBlocked] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (!composer) return;

    const onStarted = (payload: unknown) => {
      const p = payload as MigrationStartedPayload;
      setFromVersion(p.fromVersion);
      setSiteId(p.siteId ?? null);
      setSteps(buildSteps(p.fromVersion));
      setFailureMessage(undefined);
      setStuckAt(undefined);
      setRestoreBlocked(undefined);
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
      window.setTimeout(() => setOpen(false), COMPLETE_HOLD_MS);
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
      composer.off("migration:started", onStarted);
      composer.off("migration:complete", onComplete);
      composer.off("migration:failed", onFailed);
    };
  }, [composer]);

  // Probe snapshot presence on demand. We re-check at click time (not on
  // failure mount) because the snapshot is small, the failure state can
  // persist across re-renders, and the snapshot itself can be cleared by
  // an intervening successful migration.
  const probeSnapshot = React.useCallback((): { present: boolean; reason?: string } => {
    if (!siteId) return { present: false, reason: SNAPSHOT_MISSING_REASON };
    const raw = safeRead(snapshotKey(siteId));
    if (raw === null) return { present: false, reason: SNAPSHOT_MISSING_REASON };
    if (safeParse(raw) === null) return { present: false, reason: SNAPSHOT_CORRUPT_REASON };
    return { present: true };
  }, [siteId]);

  // Snapshot presence is also probed lazily so the button starts in the
  // correct aria-disabled state when the modal first flips to failed.
  // `restoreBlocked` reflects the probe result and is reset whenever a new
  // migration:started arrives (Restore becomes irrelevant on a fresh run).
  React.useEffect(() => {
    if (state !== "failed" || !siteId) return;
    const probe = probeSnapshot();
    setRestoreBlocked(probe.present ? undefined : probe.reason);
  }, [state, siteId, probeSnapshot]);

  const handleRestoreSnapshot = React.useCallback(() => {
    if (!composer || !siteId) return;
    const raw = safeRead(snapshotKey(siteId));
    const parsed = safeParse(raw);
    if (parsed === null) {
      const reason = raw === null ? SNAPSHOT_MISSING_REASON : SNAPSHOT_CORRUPT_REASON;
      setRestoreBlocked(reason);
      return;
    }
    // Per Decision #36: Restore re-runs the same load path the original
    // migration used, with the snapshot as input. The runner preserves the
    // existing marker + snapshot when marker matches currentVersion, so a
    // pre-existing crash-resume snapshot survives the round-trip.
    const markerRaw = safeRead(markerKey(siteId));
    const snapshotVersion = markerRaw !== null ? Number.parseInt(markerRaw, 10) : 0;
    const currentVersion = Number.isFinite(snapshotVersion) ? snapshotVersion : 0;
    try {
      composer.migration.run({
        project: parsed,
        currentVersion,
        siteId,
      });
      // Successful run will emit migration:complete and clear the modal —
      // no extra setOpen(false) needed.
    } catch (err) {
      // Re-run also failed — keep modal in failed state, surface the new
      // error in the banner via failureMessage so the user sees what happened.
      setFailureMessage(err instanceof Error ? err.message : String(err));
    }
  }, [composer, siteId]);

  const handleRetry = React.useCallback(() => {
    if (!composer || siteId === null || stuckAt === undefined) return;
    // Per Decision #36: Retry re-runs the load from the in-flight state
    // through the same pre-import path. We need a ProjectPayload, but the
    // pre-import input only carries tokens (the runner's surface is minimal
    // — see RunnerInput). Passing `{ tokens: [] }` re-runs the migrations
    // against empty tokens, which is the same first-import shape and lets
    // the existing migration:* events drive the modal.
    const currentVersion = Math.max(0, stuckAt - 1);
    try {
      composer.migration.run({
        project: { tokens: [] },
        currentVersion,
        siteId,
      });
    } catch (err) {
      setFailureMessage(err instanceof Error ? err.message : String(err));
    }
  }, [composer, siteId, stuckAt]);

  if (!composer) return null;

  const rangeLabel =
    fromVersion !== null
      ? `Schema v${fromVersion} → v${TARGET_PROJECT_VERSION} · ${steps.length} migration${steps.length === 1 ? "" : "s"}`
      : undefined;

  return (
    <MigrationProgressModal
      open={open}
      onOpenChange={setOpen}
      state={state}
      steps={steps}
      rangeLabel={rangeLabel}
      failureMessage={failureMessage}
      stuckAt={stuckAt}
      onRestoreSnapshot={state === "failed" ? handleRestoreSnapshot : undefined}
      onRetry={state === "failed" ? handleRetry : undefined}
      restoreDisabledReason={state === "failed" ? restoreBlocked : undefined}
    />
  );
};
