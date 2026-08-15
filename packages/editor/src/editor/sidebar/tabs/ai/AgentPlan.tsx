import * as React from "react";
import { DiffRows } from "./DiffRows";
import type { RunStep, RunPhase } from "./hooks/useAgentRunner";
import { Button, Checkbox } from "@/editor/chrome-ui";

/* Utilities, not a stylesheet: this panel's CSS file is on the styling
   ratchet and new chrome belongs inline (DS SSOT §3). */
const BAND =
  "tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:py-2 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-[var(--bk-ink-muted)]";
const STEP_ROW = "tw:flex tw:items-baseline tw:gap-2 tw:px-4 tw:py-1 tw:text-[13px] tw:text-[var(--bk-ink)]";
const PANEL = "tw:flex tw:flex-col tw:gap-2 tw:px-4 tw:py-3";
const PANEL_TITLE = "tw:m-0 tw:text-[13px] tw:font-medium";
const PANEL_BODY = "tw:m-0 tw:text-[12px] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const PANEL_ACTIONS = "tw:flex tw:justify-between tw:gap-2";

/**
 * The agent run — boards 170:41 (planning), 170:70 (running), 170:97
 * (step-gate), 171:67 (done), 171:36 (stopped), 171:2 (step-failed).
 *
 * Board shape: a band that names the run's state and position ("RUNNING · 2 OF
 * 3", "PAUSED AT STEP 3", "DONE · 3 OF 3"), the steps as numbered rows whose
 * glyph carries their status, Stop under them, and — when the run pauses — an
 * amber panel saying what is about to happen with Skip and Approve.
 *
 * Two places where the boards' words are not used, because they are not true
 * of this code:
 *  - Board 171:67 ends with "Apply lands as ONE undo step — ⌘Z takes back all
 *    three." Each approved step applies in its own transaction
 *    (`applySetStyle` opens one per edit), so a three-step run is three undo
 *    entries. The line here says that instead. The idle state's version of the
 *    promise IS true, because a chat edit is a single apply.
 *  - Board 170:97's footnote ends "…the line between an assistant and
 *    something that edits a client's site unattended", which the auto-apply
 *    checkbox below contradicts. The first half is kept, and the contradiction
 *    is named in the ledger for the founder rather than settled here.
 *
 * @license BSD-3-Clause
 */
export interface AgentPlanProps {
  phase: RunPhase;
  steps: RunStep[];
  currentIndex: number;
  error: string | null;
  autoApply: boolean;
  onAutoApplyChange: (on: boolean) => void;
  onApprove: () => void;
  onSkip: () => void;
  onStop: () => void;
  /** Board 171:36 — a run the user stopped, told apart from one that finished. */
  stoppedByUser?: boolean;
  /** Board 171:2 — re-run the same brief after a step failed. */
  onRetry?: () => void;
  /** Board 171:2 — take back the steps that did land. */
  onUndoAll?: () => void;
}

/** Board glyphs: done, in flight, waiting. Never colour alone — every row also
 *  carries its number and, when it is not simply pending, a word. */
const STEP_GLYPH: Record<RunStep["status"], string> = {
  pending: "○",
  running: "●",
  awaiting: "●",
  applied: "✓",
  skipped: "–",
  nochange: "–",
  failed: "✕",
};

const STEP_WORD: Partial<Record<RunStep["status"], string>> = {
  skipped: "skipped",
  nochange: "no change",
  failed: "failed",
};

const STEP_COLOR: Record<RunStep["status"], string> = {
  pending: "var(--bk-ink-disabled)",
  running: "var(--bk-accent)",
  awaiting: "var(--bk-accent)",
  applied: "var(--bk-success)",
  skipped: "var(--bk-ink-muted)",
  nochange: "var(--bk-ink-muted)",
  failed: "var(--bk-error)",
};

function bandLabel(
  phase: RunPhase,
  steps: RunStep[],
  currentIndex: number,
  stoppedByUser?: boolean,
): string {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.status === "applied").length;
  const failedAt = steps.findIndex((s) => s.status === "failed");
  if (failedAt >= 0) return `Stopped at step ${failedAt + 1}`;
  if (stoppedByUser) return "Stopped by you";
  if (phase === "planning") return "Planning";
  if (steps[currentIndex]?.status === "awaiting") return `Paused at step ${currentIndex + 1}`;
  if (phase === "running") return `Running · ${Math.min(currentIndex + 1, total)} of ${total}`;
  if (phase === "done") return `Done · ${doneCount} of ${total}`;
  return "";
}

export const AgentPlan: React.FC<AgentPlanProps> = ({
  phase,
  steps,
  currentIndex,
  error,
  autoApply,
  onAutoApplyChange,
  onApprove,
  onSkip,
  onStop,
  stoppedByUser,
  onRetry,
  onUndoAll,
}) => {
  const autoApplyToggle = (
    <label className="bd-ai-agent-autoapply">
      <Checkbox
        color="blue"
        className="tw:bg-white"
        checked={autoApply}
        onChange={(e) => onAutoApplyChange(e.target.checked)}
      />
      <span>Auto-apply steps (skip per-step approval)</span>
    </label>
  );

  if (phase === "idle") {
    return (
      <div className="bd-ai-agent-empty">
        {autoApplyToggle}
        Describe what to build. The agent will plan it, then walk each step
        {autoApply ? " and apply automatically" : " for your approval"}.
      </div>
    );
  }

  const gateStep = steps[currentIndex]?.status === "awaiting" ? steps[currentIndex] : null;
  const failedIndex = steps.findIndex((s) => s.status === "failed");
  const appliedCount = steps.filter((s) => s.status === "applied").length;
  const skippedCount = steps.filter((s) => s.status === "skipped").length;

  return (
    <div className="bd-ai-agent">
      <div className={BAND}>{bandLabel(phase, steps, currentIndex, stoppedByUser)}</div>

      <ol className="bd-ai-agent-steps">
        {steps.map((s, i) => (
          <li
            key={`${i}-${s.plan.title}`}
            className={STEP_ROW}
            data-step-status={s.status}
          >
            <span className="tw:w-3 tw:flex-none tw:text-center" style={{ color: STEP_COLOR[s.status] }} aria-hidden="true">
              {STEP_GLYPH[s.status]}
            </span>
            <span className="tw:min-w-2.5 tw:text-[var(--bk-ink-muted)]">{i + 1}</span>
            <span className="tw:flex-1">{s.plan.title}</span>
            {STEP_WORD[s.status] ? (
              <span className="tw:text-[11px] tw:text-[var(--bk-ink-muted)]">{STEP_WORD[s.status]}</span>
            ) : null}
          </li>
        ))}
      </ol>

      {(phase === "running" || phase === "planning") && (
        <Button
          type="button"
          color="light"
          className="tw:mx-4 tw:mb-3 tw:self-start"
          aria-label="Stop run"
          onClick={onStop}
        >
          Stop
        </Button>
      )}

      {/* Board 170:97 — the run stops and says what it is about to do. */}
      {gateStep ? (
        <div className={`${PANEL} tw:bg-[var(--bk-warning-tint)]`} role="alertdialog" aria-label="Step needs approval">
          <p className={`${PANEL_TITLE} tw:text-[var(--bk-warning-text)]`}>
            Step {currentIndex + 1}: {gateStep.plan.title}
          </p>
          <p className={PANEL_BODY}>
            {gateStep.plan.instruction} Approve it, or skip it and keep the rest.
          </p>
          {gateStep.edit ? <DiffRows edit={{ ...gateStep.edit, state: "pending" }} /> : null}
          <div className={PANEL_ACTIONS}>
            <Button type="button" color="light" aria-label="Skip step" onClick={onSkip}>
              Skip
            </Button>
            <Button type="button" aria-label="Apply step" onClick={onApprove}>
              Approve
            </Button>
          </div>
          <p className={PANEL_BODY}>The run waits rather than guessing.</p>
        </div>
      ) : null}

      {/* Board 171:2 — which step failed, what survived it, and the two ways
          on. "Nothing after step N ran" is the fact that makes the state safe
          to sit in. */}
      {error ? (
        <div className={`${PANEL} tw:bg-[var(--bk-warning-tint)]`} role="alert">
          <p className={`${PANEL_TITLE} tw:text-[var(--bk-error)]`}>
            {failedIndex >= 0 ? `Step ${failedIndex + 1} failed — ${error}` : error}
          </p>
          {failedIndex >= 0 ? (
            <p className={PANEL_BODY}>
              {appliedCount > 0
                ? `${appliedCount} step${appliedCount === 1 ? "" : "s"} kept.`
                : "Nothing was applied."}{" "}
              Nothing after step {failedIndex + 1} ran.
            </p>
          ) : null}
          {(onUndoAll || onRetry) && (
            <div className={PANEL_ACTIONS}>
              {onUndoAll ? (
                <Button type="button" color="light" onClick={onUndoAll} disabled={appliedCount === 0}>
                  Undo all
                </Button>
              ) : <span />}
              {onRetry ? (
                <Button type="button" onClick={onRetry}>
                  Retry
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* Board 171:36 — stopping is not finishing. What already ran is kept,
          and taking it back is offered here rather than left to ⌘Z. */}
      {phase === "done" && !error && stoppedByUser ? (
        <div className={`${PANEL} tw:bg-[var(--bk-bg-subtle)]`}>
          <p className="tw:m-0 tw:text-[13px] tw:text-[var(--bk-ink)]">
            Stopped after step {appliedCount + skippedCount}.
          </p>
          <p className={PANEL_BODY}>
            What already ran is kept.
            {appliedCount > 0
              ? ` Undo all takes back the ${appliedCount} step${appliedCount === 1 ? "" : "s"} that applied.`
              : ""}
          </p>
          {onUndoAll && appliedCount > 0 ? (
            <Button type="button" color="light" className="tw:self-start tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[var(--bk-accent)]" onClick={onUndoAll}>
              Undo all
            </Button>
          ) : null}
        </div>
      ) : phase === "done" && !error ? (
        <div className={`${PANEL} tw:mx-4 tw:my-2 tw:rounded tw:bg-[var(--bk-success-tint)]`}>
          <p className={`${PANEL_TITLE} tw:text-[var(--bk-success-text)]`}>
            {appliedCount} change{appliedCount === 1 ? "" : "s"} applied
            {skippedCount > 0 ? `, ${skippedCount} skipped` : ""}.
          </p>
          <p className={PANEL_BODY}>
            {appliedCount > 1
              ? `Each step is its own undo step — ⌘Z takes back the last of the ${appliedCount}.`
              : "⌘Z takes it back."}
          </p>
        </div>
      ) : null}

      {phase !== "done" ? autoApplyToggle : null}
    </div>
  );
};
