import * as React from "react";
import type { RunStep, RunPhase } from "./hooks/useAgentRunner";
import { Button, TextInput } from "@/editor/chrome-ui";

/* Utilities, not a stylesheet: this panel's CSS file is on the styling
   ratchet and new chrome belongs inline (DS SSOT §3). */
/* The shared "Section header" instance the run boards use (220:947 planning,
   220:967 done): 28 tall, 16 gutters, an 8 gap before whatever the row's
   trailing slot holds. */
const BAND =
  "tw:flex tw:h-7 tw:items-center tw:gap-2 tw:bg-[var(--bk-bg-subtle)] tw:px-4 tw:text-[11px] tw:leading-4 tw:font-medium tw:uppercase tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]";
/* 12/18 on the row (boards 170:54-56, 171:80-82); the mono index inside it is
   11/16 (170:55, 171:81). The row inherited `line-height: normal` from
   `.bd-ai-agent`'s font shorthand, so every step row sat ~3px short of the
   board's leading. */
const STEP_ROW =
  "tw:flex tw:h-10 tw:items-center tw:gap-2 tw:px-4 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]";
const PANEL = "tw:flex tw:flex-col tw:gap-1 tw:px-4 tw:py-3";
/* The run boards set every card in 11/16 under a 12/18 title (4418:105118,
   105261, 105401, 104976); it was 13 over 12/20. */
const PANEL_TITLE = "tw:m-0 tw:text-[12px] tw:leading-[18px]";
const PANEL_BODY = "tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* A diff line in a result card: 11px on a 20 pitch (4418:105401 / 106400). */
const DIFF_ROW = "tw:m-0 tw:text-[11px] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const PANEL_ACTIONS = "tw:flex tw:justify-between tw:gap-2 tw:pt-1";
/** Bare 12px accent text (4418:105261's "Undo all · Keep 1 change"). */
const DISMISS_LINK =
  "tw:h-4 tw:self-start tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[12px] tw:leading-4 tw:font-normal tw:text-[var(--bk-accent)] tw:focus:ring-0";
/** The note under a card (4418:105401 "Each approved step was applied…"). */
const FOOTNOTE = "tw:m-0 tw:px-4 tw:py-3 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/**
 * The agent run — boards 170:41 (planning), 170:70 (running), 170:97
 * (step-gate), 171:67 (done), 171:36 (stopped), 171:2 (step-failed).
 *
 * Board shape: a band that names the run's state and position ("RUNNING · 2 OF
 * 3", "PAUSED AT STEP 3", "DONE · 3 OF 3"), the steps as numbered rows whose
 * glyph carries their status, Stop under them, and — when the run pauses — an
 * amber panel saying what is about to happen with Skip and Approve.
 *
 * What 171:67 closes on is a `data-name="note"` block — a designer annotation,
 * not UI (founder ruling 2026-09-03) — so its sentence is neither copy to
 * render nor a control to grow. The panel's own line is the one that has to be
 * true, and it is: each approved step applies in its own transaction
 * (`applySetStyle` opens one per edit), so a three-step run is three undo
 * entries. `onUndoAll` exists for the two states where a run did NOT finish
 * cleanly — stopped, and failed mid-run — and stays there.
 *
 * One place where a board's words are still not used:
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
  onApprove: () => void;
  onSkip: () => void;
  onStop: () => void;
  /** Board 4418:104698 — review: rewrite a step before the run starts. */
  onEditStep: (index: number, instruction: string) => void;
  /** Board 4418:104698 — "Run N steps". */
  onRunPlan: () => void;
  /** Board 171:36 — a run the user stopped, told apart from one that finished. */
  stoppedByUser?: boolean;
  /** Boards 4418:105118 / 105261 / 105401 — take back the steps that landed. */
  onUndoAll?: () => void;
  /** Board 4418:105118 — back to the prompt (it is still in the field). */
  onEditPrompt?: () => void;
  /** "Keep N changes" / "Done": leave what applied and hand the panel back. */
  onDismiss?: () => void;
  /** Board 4418:105548 — Undo all has taken the run back. */
  undone?: boolean;
  /** What the run's copy calls its scope: "Hero", "the selected heading",
   *  "the page" (4418:105401 "3 changes applied to Hero"). */
  target?: string;
}

/** Board glyphs: ✓ done, ▲ failed, ○ pending, ⊘ skipped. Never colour alone —
 *  a live or unfinished run also names each row's state. */
const STEP_GLYPH: Record<RunStep["status"], string> = {
  pending: "○",
  running: "●",
  /* 4418:104976: a step waiting on you is not running — an open ring. */
  awaiting: "○",
  applied: "✓",
  skipped: "⊘",
  nochange: "⊘",
  failed: "▲",
};

const STEP_WORD: Partial<Record<RunStep["status"], string>> = {
  applied: "Done",
  running: "Running",
  awaiting: "Needs approval",
  pending: "Pending",
  skipped: "Skipped",
  nochange: "No change",
  failed: "Failed",
};

const STEP_COLOR: Record<RunStep["status"], string> = {
  pending: "var(--bk-ink-disabled)",
  running: "var(--bk-accent)",
  awaiting: "var(--bk-ink-disabled)",
  applied: "var(--bk-success)",
  skipped: "var(--bk-ink-muted)",
  nochange: "var(--bk-ink-muted)",
  failed: "var(--bk-error)",
};

/** The row word's colour: Done green, Running accent, Needs approval amber,
 *  Failed red, the rest muted (4418:104837 / 104976 / 105118). */
const WORD_COLOR: Partial<Record<RunStep["status"], string>> = {
  applied: "var(--bk-success)",
  running: "var(--bk-accent)",
  awaiting: "var(--bk-warning-text)",
  failed: "var(--bk-error)",
};

function bandLabel(
  phase: RunPhase,
  steps: RunStep[],
  currentIndex: number,
  stoppedByUser?: boolean,
  undone?: boolean,
): string {
  const total = steps.length;
  const doneCount = steps.filter((s) => s.status === "applied").length;
  const skippedCount = steps.filter((s) => s.status === "skipped").length;
  const failedAt = steps.findIndex((s) => s.status === "failed");
  /* 4418:105548 "UNDONE · 3 OF 3". */
  if (undone) return `Undone · ${doneCount} of ${total}`;
  if (failedAt >= 0) return `Stopped at step ${failedAt + 1}`;
  if (stoppedByUser) return "Stopped by you";
  if (phase === "planning" || phase === "review") return "Planning";
  if (steps[currentIndex]?.status === "awaiting") return `Paused at step ${currentIndex + 1}`;
  if (phase === "running") return `Running · ${Math.min(currentIndex + 1, total)} of ${total}`;
  /* 4418:106400 "DONE · 2 APPLIED / 1 SKIPPED". */
  if (phase === "done" && skippedCount > 0) return `Done · ${doneCount} applied / ${skippedCount} skipped`;
  if (phase === "done") return `Done · ${doneCount} of ${total}`;
  return "";
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** "restores the original Hero" for a named target, "restores the page as it
 *  was before this run" otherwise (4418:105261). */
const restores = (target: string) =>
  target.startsWith("the ") ? `restores ${target} as it was before this run` : `restores the original ${target}`;

/** "Step 1 is applied." / "Steps 1 and 3 are applied." / "Nothing was applied." */
function appliedSentence(steps: RunStep[]): string {
  const nums = steps.flatMap((s, i) => (s.status === "applied" ? [i + 1] : []));
  if (nums.length === 0) return "Nothing was applied.";
  if (nums.length === 1) return `Step ${nums[0]} is applied.`;
  return `Steps ${nums.slice(0, -1).join(", ")} and ${nums.at(-1)} are applied.`;
}

/** "Steps 2 and 3 did not run." for the rows that never ran. */
function notRunSentence(steps: RunStep[]): string {
  const nums = steps.flatMap((s, i) => (s.status === "pending" || s.status === "skipped" ? [i + 1] : []));
  if (nums.length === 0) return "";
  if (nums.length === 1) return ` Step ${nums[0]} did not run.`;
  return ` Steps ${nums.slice(0, -1).join(", ")} and ${nums.at(-1)} did not run.`;
}

/* 4418:104577 / 104837: Stop is a 120×32 outline button on the 16 gutter. */
const STOP_BTN =
  "tw:h-8 tw:w-[120px] tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)] tw:focus:ring-0";

const OUTLINE_BTN =
  "tw:h-8 tw:whitespace-nowrap tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:px-3 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)] tw:focus:ring-0";
const PRIMARY_BTN = "tw:h-8 tw:whitespace-nowrap tw:rounded-md tw:px-3 tw:text-[13px] tw:font-medium tw:focus:ring-0";

export const AgentPlan: React.FC<AgentPlanProps> = ({
  phase,
  steps,
  currentIndex,
  error,
  onApprove,
  onSkip,
  onStop,
  onEditStep,
  onRunPlan,
  stoppedByUser,
  onUndoAll,
  onEditPrompt,
  onDismiss,
  undone,
  target = "the page",
}) => {
  const [editing, setEditing] = React.useState(false);

  if (phase === "idle") {
    return (
      <div className="bd-ai-agent-empty">
        Describe what to build. The agent will plan it, show you the plan, then walk each step for your approval.
      </div>
    );
  }

  /* Board 4418:104577 — while nothing has come back yet (the plan call, or
     the one step of an element-scoped run) the panel is "Thinking…" and a
     Stop button: no run band, no step list. */
  const thinking =
    !error && (phase === "planning" || (phase === "running" && steps.length === 1 && steps[0].status === "running"));
  if (thinking) {
    return (
      <div className="bd-ai-agent">
        <p
          data-testid="ai-thinking"
          className="tw:m-0 tw:flex tw:h-14 tw:items-center tw:bg-[var(--bk-accent-tint)] tw:px-4 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-accent-text)]"
        >
          Thinking…
        </p>
        <div className="tw:flex tw:h-14 tw:items-center tw:px-4">
          <Button
            type="button"
            color="alternative"
            aria-label="Stop run"
            onClick={onStop}
            className={STOP_BTN}
          >
            Stop
          </Button>
        </div>
      </div>
    );
  }

  const gateStep = steps[currentIndex]?.status === "awaiting" ? steps[currentIndex] : null;
  const failedIndex = steps.findIndex((s) => s.status === "failed");
  const appliedCount = steps.filter((s) => s.status === "applied").length;
  const skippedSteps = steps.filter((s) => s.status === "skipped");
  const review = phase === "review";
  const finished = phase === "done";
  /* Row words: a live run names every row (4418:104837), a stopped or failed
     one too (105118 / 105261); a clean finish and an undone run do not. */
  const showWords = !undone && (phase === "running" || (finished && (!!error || !!stoppedByUser)));
  const scoped = target.startsWith("the ") ? "" : ` to ${target}`;

  return (
    <div className="bd-ai-agent">
      <div className={BAND} data-testid="ai-run-band">{bandLabel(phase, steps, currentIndex, stoppedByUser, undone)}</div>
      <ol className="bd-ai-agent-steps">
        {steps.map((s, i) => (
          <li
            key={i}
            className={STEP_ROW}
            data-step-status={s.status}
            data-testid={`ai-run-step-${i + 1}`}
          >
            {!review && (
              <span
                className="tw:w-3 tw:flex-none tw:text-center"
                style={{ color: STEP_COLOR[s.status] }}
                aria-hidden="true"
                data-testid={`ai-run-glyph-${i + 1}`}
              >
                {STEP_GLYPH[s.status]}
              </span>
            )}
            <span
              className={`tw:min-w-3 tw:text-[11px] tw:leading-4 tw:[font-family:var(--bk-font-mono)] tw:text-[var(--bk-ink-muted)] ${review ? "tw:ml-5" : ""}`}
              data-testid={`ai-run-index-${i + 1}`}
            >{i + 1}</span>
            {review && editing ? (
              <TextInput
                sizing="sm"
                aria-label={`Step ${i + 1}`}
                data-testid={`ai-plan-edit-${i + 1}`}
                value={s.plan.instruction}
                onChange={(e) => onEditStep(i, e.target.value)}
                className="tw:flex-1"
              />
            ) : (
              <span className="tw:flex-1" data-testid={`ai-run-title-${i + 1}`}>{s.plan.title}</span>
            )}
            {showWords && STEP_WORD[s.status] ? (
              <span
                className="tw:text-[11px] tw:leading-4"
                style={{ color: WORD_COLOR[s.status] ?? "var(--bk-ink-muted)" }}
                data-testid={`ai-run-word-${i + 1}`}
              >
                {STEP_WORD[s.status]}
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      {/* Board 4418:104698 — the plan waits: Edit plan · Run N steps. */}
      {review && (
        <div className="tw:flex tw:gap-2 tw:px-4 tw:py-3">
          <Button
            type="button"
            color="light"
            data-testid="ai-plan-edit"
            onClick={() => setEditing((v) => !v)}
            className={`${OUTLINE_BTN} tw:flex-1`}
          >
            {editing ? "Done editing" : "Edit plan"}
          </Button>
          <Button
            type="button"
            data-testid="ai-plan-run"
            disabled={steps.some((s) => !s.plan.instruction.trim())}
            onClick={() => {
              setEditing(false);
              onRunPlan();
            }}
            className={`${PRIMARY_BTN} tw:flex-1`}
          >
            Run {plural(steps.length, "step")}
          </Button>
        </div>
      )}

      {/* 4418:104976: a run paused on a step shows the step's card, not Stop. */}
      {phase === "running" && !gateStep && (
        <div className="tw:flex tw:px-4 tw:pt-2 tw:pb-3">
          <Button type="button" color="alternative" aria-label="Stop run" onClick={onStop} className={STOP_BTN}>
            Stop
          </Button>
        </div>
      )}

      {/* Boards 170:97 / 4418:104976 — the run stops and says what it is
          about to do; the note under the card says what has landed so far. */}
      {gateStep ? (
        <>
          <div className={`${PANEL} tw:bg-[var(--bk-warning-tint)]`} role="alertdialog" aria-label="Step needs approval">
            <p className={`${PANEL_TITLE} tw:text-[var(--bk-warning-text)]`}>
              Step {currentIndex + 1}: {gateStep.plan.title}
            </p>
            <p className={PANEL_BODY}>
              {gateStep.plan.instruction} Approve it, or skip it and keep the rest.
            </p>
            {/* The proposed change itself — the board states it in prose; the
                rows are what the server actually proposes. */}
            {(gateStep.edit?.rows ?? []).map((r, i) => (
              <p key={i} className={DIFF_ROW} data-testid="ai-gate-diff-row">
                {r.field} → {r.to}
              </p>
            ))}
            <div className={PANEL_ACTIONS}>
              <Button type="button" color="light" aria-label="Skip step" onClick={onSkip} className={`${OUTLINE_BTN} tw:h-7 tw:w-20`}>
                Skip
              </Button>
              <Button type="button" aria-label="Apply step" onClick={onApprove} className={`${PRIMARY_BTN} tw:h-7 tw:w-24`}>
                Approve
              </Button>
            </div>
          </div>
          <p className={FOOTNOTE} data-testid="ai-gate-note">
            {appliedCount > 0 ? `${plural(appliedCount, "change")} applied${scoped}. ` : ""}
            Step {currentIndex + 1} waits for your approval.
          </p>
        </>
      ) : null}

      {/* Board 4418:105118 — which step failed, what survived it, and the
          three ways on: Undo all · Keep N changes · Edit prompt. */}
      {undone ? null : error ? (
        <div className={`${PANEL} tw:bg-[var(--bk-warning-tint)]`} role="alert" data-testid="ai-run-failed">
          <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error)]">
            {failedIndex >= 0 ? `Step ${failedIndex + 1} failed — ${error}` : error}
          </p>
          {failedIndex >= 0 ? (
            <p className={PANEL_BODY}>{appliedSentence(steps)} Edit your request before starting another run.</p>
          ) : null}
          <div className="tw:flex tw:gap-0 tw:[&>button]:px-2.5">
            {onUndoAll && appliedCount > 0 ? (
              <Button type="button" color="light" data-testid="ai-run-undo-all" onClick={onUndoAll} className={OUTLINE_BTN}>
                Undo all
              </Button>
            ) : null}
            {onDismiss && appliedCount > 0 ? (
              <Button type="button" color="light" data-testid="ai-run-keep" onClick={onDismiss} className={OUTLINE_BTN}>
                Keep {plural(appliedCount, "change")}
              </Button>
            ) : null}
            {onEditPrompt ? (
              <Button type="button" data-testid="ai-run-edit-prompt" onClick={onEditPrompt} className={PRIMARY_BTN}>
                Edit prompt
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Board 4418:105261 — stopping is not finishing: what ran is kept,
          and both ways on are offered as links. */}
      {finished && !error && stoppedByUser ? (
        <div className={`${PANEL} tw:bg-[var(--bk-bg-subtle)]`} data-testid="ai-run-stopped">
          <p className={`${PANEL_TITLE} tw:text-[var(--bk-ink)]`}>
            Stopped after step {steps.reduce((n, s, i) => (s.status === "applied" || s.status === "nochange" ? i + 1 : n), 0)}.
          </p>
          <p className={PANEL_BODY}>
            {appliedSentence(steps)}
            {notRunSentence(steps)}
            {appliedCount > 0 ? ` Undo all ${restores(target)}.` : ""}
          </p>
          <div className="tw:flex tw:gap-4 tw:pt-1">
            {onUndoAll && appliedCount > 0 ? (
              <Button type="button" color="light" size="xs" data-testid="ai-run-undo-all" className={DISMISS_LINK} onClick={onUndoAll}>
                Undo all
              </Button>
            ) : null}
            {onDismiss ? (
              <Button type="button" color="light" size="xs" data-testid="ai-run-keep" className={DISMISS_LINK} onClick={onDismiss}>
                {appliedCount > 0 ? `Keep ${plural(appliedCount, "change")}` : "Ask something else"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : finished && !error && undone ? (
        <>
          {/* Board 4418:105548 — the run is taken back: what was restored,
              and Done. */}
          <div className={`${PANEL} tw:bg-[var(--bk-success-tint)]`} data-testid="ai-run-undone">
            <p className={`${PANEL_TITLE} tw:text-[var(--bk-success-text)]`}>All changes undone</p>
            {steps
              .filter((s) => s.status === "applied")
              .flatMap((s) => s.edit?.rows ?? [{ field: s.plan.title, from: "", to: "" }])
              .slice(0, 6)
              .map((r, i) => (
                <p key={i} className={DIFF_ROW}>
                  {r.field} → restored
                </p>
              ))}
            <div className="tw:flex tw:justify-end tw:pt-1">
              {onDismiss ? (
                <Button type="button" data-testid="ai-run-done" onClick={onDismiss} className={`${PRIMARY_BTN} tw:h-7 tw:w-24`}>
                  Done
                </Button>
              ) : null}
            </div>
          </div>
          <p className={FOOTNOTE}>{capitalize(target)} is back to its state before this run.</p>
        </>
      ) : finished && !error ? (
        <>
          {/* Boards 4418:105401 / 106400 — what changed (and what was
              skipped), Undo all · Done. */}
          <div className={`${PANEL} tw:bg-[var(--bk-success-tint)]`} data-testid="ai-run-applied">
            <p className={`${PANEL_TITLE} tw:text-[var(--bk-success-text)]`}>
              {skippedSteps.length > 0
                ? `${appliedCount} applied · ${skippedSteps.length} skipped`
                : `${plural(appliedCount, "change")} applied${scoped}`}
            </p>
            {[
              ...steps
                .filter((s) => s.status === "applied")
                .flatMap((s) => s.edit?.rows ?? [])
                .map((r) => `${r.field} → ${r.to}`),
              ...skippedSteps.flatMap((s) =>
                (s.edit?.rows ?? [{ field: s.plan.title }]).map((r) => `${r.field} → unchanged (skipped)`),
              ),
            ]
              .slice(0, 6)
              .map((line, i) => (
                <p key={i} className={DIFF_ROW}>
                  {line}
                </p>
              ))}
            <div className={PANEL_ACTIONS}>
              {onUndoAll && appliedCount > 0 ? (
                <Button type="button" color="light" data-testid="ai-run-undo-all" onClick={onUndoAll} className={`${OUTLINE_BTN} tw:h-7 tw:w-24`}>
                  Undo all
                </Button>
              ) : <span />}
              {onDismiss ? (
                <Button type="button" data-testid="ai-run-done" onClick={onDismiss} className={`${PRIMARY_BTN} tw:h-7 tw:w-24`}>
                  Done
                </Button>
              ) : null}
            </div>
          </div>
          <p className={FOOTNOTE}>
            Each approved step was applied. Undo all restores {target} to its state before this run.
          </p>
        </>
      ) : null}
    </div>
  );
};
