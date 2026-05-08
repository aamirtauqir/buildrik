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
 * Wires:
 *   - composer.migration (A.1) — event source
 *   - PROJECT_MIGRATIONS + TARGET_PROJECT_VERSION — step labels + range
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import {
  PROJECT_MIGRATIONS,
  TARGET_PROJECT_VERSION,
} from "../migrations/projectMigrations";
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

  React.useEffect(() => {
    if (!composer) return;

    const onStarted = (payload: unknown) => {
      const p = payload as MigrationStartedPayload;
      setFromVersion(p.fromVersion);
      setSteps(buildSteps(p.fromVersion));
      setFailureMessage(undefined);
      setStuckAt(undefined);
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

  const handleRestoreSnapshot = React.useCallback(() => {
    if (!composer || fromVersion === null) return;
    // The runner stores the snapshot under
    // localStorage[ds-migration-backup-${siteId}]. Phase F.2 will wire
    // a real "restore" action that calls importProject with the snapshot
    // payload + bumps dsSchemaVersion back. For now we just close.
    setOpen(false);
  }, [composer, fromVersion]);

  const handleRetry = React.useCallback(() => {
    // Phase F.2 will re-invoke composer.migration.run with the
    // failed-step's fromVersion. For now we close — useComposerInit's
    // existing fail-soft warning toast remains the user-facing error.
    setOpen(false);
  }, []);

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
    />
  );
};
