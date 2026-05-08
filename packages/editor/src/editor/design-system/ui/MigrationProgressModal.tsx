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
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@/editor/shared/vibcoder";

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
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" aria-labelledby="migration-modal-title">
        <div style={{ padding: "20px 24px" }}>
          <ModalTitle id="migration-modal-title" style={{ fontSize: 16, fontWeight: 600 }}>
            {state === "failed" ? "Migration failed" : "Updating your project"}
          </ModalTitle>
          {rangeLabel && (
            <ModalDescription
              style={{ fontSize: 11, color: "var(--bd-text-muted, #64748b)", marginTop: 4 }}
            >
              {rangeLabel}
            </ModalDescription>
          )}

          {state === "failed" && failureMessage && (
            <div
              role="alert"
              style={{
                background: "var(--bd-error-tint, #fee2e2)",
                borderLeft: "3px solid var(--bd-error, #dc2626)",
                padding: "10px 12px",
                borderRadius: "0 6px 6px 0",
                margin: "16px 0",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--bd-error, #dc2626)" }}>
                Migration v{stuckAt ?? "?"} failed
              </div>
              <div
                style={{
                  fontSize: 11,
                  marginTop: 4,
                  fontFamily: "ui-monospace, monospace",
                  color: "var(--bd-text, #0f172a)",
                }}
              >
                {failureMessage}
              </div>
            </div>
          )}

          <ul style={{ listStyle: "none", margin: "16px 0 0 0", padding: 0 }}>
            {steps.map((step) => (
              <li
                key={step.version}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 0",
                  borderBottom: "1px solid var(--bd-border, #e2e8f0)",
                  fontSize: 13,
                }}
              >
                <span style={{ flex: 1, color: "var(--bd-text, #0f172a)" }}>
                  v{step.version} · {step.label}
                </span>
                <span style={{ fontSize: 11 }}>{statusLabel(step.status)}</span>
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
                style={{
                  marginTop: 12,
                  height: 4,
                  background: "var(--bd-surface-2, #f1f5f9)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "var(--bd-accent, #2D6DFF)",
                    transition: "width 200ms ease-out",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--bd-text-muted, #64748b)",
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {completedCount} of {total}
              </div>
            </>
          )}

          {state === "failed" && (
            <>
              <div style={{ marginTop: 16, display: "grid", gap: 4 }}>
                {snapshotLabel && (
                  <Row label="Snapshot saved" value={snapshotLabel} valueColor="var(--bd-success, #16a34a)" />
                )}
                <Row
                  label="Migrations applied"
                  value={`${completedCount} of ${total}`}
                />
                {stuckAt !== undefined && <Row label="Stuck at" value={`v${stuckAt}`} />}
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                {onRestoreSnapshot && (
                  <button
                    type="button"
                    className="bd-btn bd-btn--primary"
                    onClick={onRestoreSnapshot}
                  >
                    Restore snapshot
                  </button>
                )}
                {onRetry && stuckAt !== undefined && (
                  <button type="button" className="bd-btn" onClick={onRetry}>
                    Retry v{stuckAt}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
};

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        padding: "4px 0",
      }}
    >
      <span style={{ color: "var(--bd-text-muted, #64748b)" }}>{label}</span>
      <span style={{ color: valueColor ?? "var(--bd-text, #0f172a)" }}>{value}</span>
    </div>
  );
}

function statusLabel(status: MigrationStep["status"]): React.ReactNode {
  switch (status) {
    case "done":
      return <span style={{ color: "var(--bd-success, #16a34a)" }}>✓</span>;
    case "running":
      return <span style={{ color: "var(--bd-accent, #2D6DFF)" }}>running…</span>;
    case "failed":
      return <span style={{ color: "var(--bd-error, #dc2626)" }}>failed</span>;
    case "queued":
    default:
      return <span style={{ color: "var(--bd-text-subtle, #94a3b8)" }}>queued</span>;
  }
}
