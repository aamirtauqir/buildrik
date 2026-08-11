/**
 * Phase F.1 / Tier-1 wireframe S13: Migration runner progress + failure modal.
 *
 * Two states:
 *   1. running   — list of migrations + per-step status (queued/running/done)
 *                  + linear progress bar + ETA-ish caption
 *   2. failed    — red banner with error + Restore snapshot / Retry / Email
 *                  export actions; resume hint when marker still set
 *
 * Wires to:
 *   - composer.migration emits 'migration:started/complete/failed/skipped' (A.1)
 *   - useComposerInit currently surfaces failures via toast (B.0). This modal
 *     supersedes the toast for in-flight + failure visibility.
 *
 * Out-of-scope:
 *   - Snapshot restore action wiring (consumer handles localStorage snapshot)
 *   - Email export of stuck project (Phase F.2)
 *   - Resume-on-reload prompt (Phase F.2)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ModalContent, ModalDescription, ModalRoot, ModalTitle, Button } from "@/editor/chrome-ui";

export interface MigrationStep {
  /** Migration toVersion. */
  version: number;
  /** Short description shown in the row. */
  label: string;
  /** queued · running · done · failed */
  status: "queued" | "running" | "done" | "failed";
}

export interface MigrationProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** State drives the visible body. */
  state: "running" | "failed";
  /** Step list — renders one row per migration. */
  steps: readonly MigrationStep[];
  /** Schema range — e.g. "v0 → v2". Optional caption above the steps. */
  rangeLabel?: string;
  /** Failure-only: error message line shown in red banner. */
  failureMessage?: string;
  /** Failure-only: snapshot id/timestamp shown next to "Snapshot saved". */
  snapshotLabel?: string;
  /** Failure-only: stuck migration version. */
  stuckAt?: number;

  /** Failure-only: Restore snapshot action (consumer wires localStorage rollback). */
  onRestoreSnapshot?: () => void;
  /** Failure-only: Retry stuck migration. */
  onRetry?: () => void;
}

export const MigrationProgressModal: React.FC<MigrationProgressModalProps> = ({
  open,
  onOpenChange,
  state,
  steps,
  rangeLabel,
  failureMessage,
  snapshotLabel,
  stuckAt,
  onRestoreSnapshot,
  onRetry,
}) => {
  const completedCount = steps.filter((s) => s.status === "done").length;
  const total = steps.length || 1;
  const progress = Math.round((completedCount / total) * 100);

  return (
    <ModalRoot open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" aria-labelledby="migration-modal-title">
        <div className="tw:px-6 tw:py-5">
          <ModalTitle inset={false} id="migration-modal-title" className="tw:text-base tw:font-semibold">
            {state === "failed" ? "Migration failed" : "Updating your project"}
          </ModalTitle>
          {rangeLabel && (
            <ModalDescription className="tw:mt-1 tw:text-[11px] tw:text-gray-500">
              {rangeLabel}
            </ModalDescription>
          )}

          {state === "failed" && failureMessage && (
            <div
              role="alert"
              className="tw:my-4 tw:px-3 tw:py-2.5 tw:rounded-r-md tw:border-l-[3px] tw:border-l-[var(--bk-error)] tw:bg-[var(--bk-error-tint)]"
            >
              <div className="tw:text-[13px] tw:font-semibold tw:text-[var(--bk-error)]">
                Migration v{stuckAt ?? "?"} failed
              </div>
              <div className="tw:mt-1 tw:text-[11px] tw:text-gray-900 tw:[font-family:var(--bk-font-mono)]">
                {failureMessage}
              </div>
            </div>
          )}

          <ul className="tw:list-none tw:mt-4 tw:p-0">
            {steps.map((step) => (
              <li
                key={step.version}
                className="tw:flex tw:items-center tw:gap-2 tw:py-2 tw:border-b tw:border-gray-200 tw:text-[13px]"
              >
                <span className="tw:flex-1 tw:text-gray-900">
                  v{step.version} · {step.label}
                </span>
                <span className="tw:text-[11px]">{statusLabel(step.status)}</span>
              </li>
            ))}
          </ul>

          {state === "running" && (
            <>
              <div
                aria-label="Migration progress"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                role="progressbar"
                className="tw:mt-3 tw:h-1 tw:rounded-sm tw:overflow-hidden tw:bg-[var(--bk-bg-subtle)]"
              >
                {/* width is the live value — the one thing here that is data */}
                <div className="tw:h-full tw:bg-blue-700 tw:transition-[width]" style={{ width: `${progress}%` }} />
              </div>
              <div className="tw:mt-1 tw:text-center tw:text-[10px] tw:text-gray-500">
                {completedCount} of {total}
              </div>
            </>
          )}

          {state === "failed" && (
            <>
              <div className="tw:grid tw:gap-1 tw:mt-4">
                {snapshotLabel && (
                  <Row label="Snapshot saved" value={snapshotLabel} tone="success" />
                )}
                <Row
                  label="Migrations applied"
                  value={`${completedCount} of ${total}`}
                />
                {stuckAt !== undefined && <Row label="Stuck at" value={`v${stuckAt}`} />}
              </div>

              <div className="tw:flex tw:gap-1.5 tw:mt-4">
                {onRestoreSnapshot && (
                  <Button
                    size="xs"
                    type="button"
                    onClick={onRestoreSnapshot}
                  >
                    Restore snapshot
                  </Button>
                )}
                {onRetry && stuckAt !== undefined && (
                  <Button color="light" size="xs" type="button" onClick={onRetry}>
                    Retry v{stuckAt}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </ModalContent>
    </ModalRoot>
  );
};

function Row({ label, value, tone }: { label: string; value: string; tone?: "success" }) {
  return (
    <div className="tw:flex tw:justify-between tw:py-1 tw:text-xs">
      <span className="tw:text-gray-500">{label}</span>
      <span className={tone === "success" ? "tw:text-[var(--bk-success)]" : "tw:text-gray-900"}>
        {value}
      </span>
    </div>
  );
}

function statusLabel(status: MigrationStep["status"]): React.ReactNode {
  switch (status) {
    case "done":
      return <span className="tw:text-[var(--bk-success)]">✓</span>;
    case "running":
      return <span className="tw:text-blue-700">running…</span>;
    case "failed":
      return <span className="tw:text-[var(--bk-error)]">failed</span>;
    case "queued":
    default:
      return <span className="tw:text-gray-500">queued</span>;
  }
}
