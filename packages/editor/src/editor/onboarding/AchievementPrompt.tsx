/**
 * AchievementPrompt — the step-completion overlay (boards 430:2348 · step
 * complete, 430:2375 · final step; both drawn FROM this file, which is why
 * boards.json records them `authority=code:state-exists`).
 *
 * Shown when a checklist step is completed via a composer event. Dims the
 * background, shows the completed step + next step preview. Auto-dismisses
 * after 4 seconds (orchestrator owns the timer).
 *
 * WHAT THE BOARD MOVED (conformance pass 2026-09-08)
 *   · card radius 8 -> 12; the countdown bar gained the TRACK the board draws
 *     under it — without one, a 62%-wide blue line reads as a stray rule
 *     rather than as time running out.
 *   · badge glyph 20 -> 16 (the board says 18; see BADGE); the all-done glyph
 *     🎉 -> ★, because a colour emoji
 *     ignores `color` and painted a multicolour confetti on a green disc where
 *     the board draws a white star.
 *   · title weight 700 -> 600, CTA radius 10 -> 8, next-up arrow 16 -> 14.
 *   · body / head-text / next-text are real flex columns with the board's
 *     gaps (20 / 4 / 2) instead of per-child margins that summed to the same
 *     thing but measured 0.
 *   · copy: "All done!" -> "All done", "You're all set!" -> "You're all set",
 *     and the all-done sentence is the board's.
 *
 * WHAT THE BOARD DOES NOT GET (both refusals are computed, not opinion)
 *   · The badge, the CTA and the countdown fill are `--flowbite/blue/500` on
 *     the step-complete board. They stay `--bk-accent`. DESIGN.md §Color makes
 *     the blue-700 accent "the single accent for CTAs, links, active states and
 *     focus rings", and the numbers agree — white 14px on blue-500 is 3.61:1
 *     (AA wants 4.5), and that fill on its own `--bk-border` track is 2.92:1
 *     (1.4.11 wants 3). On `--bk-accent` those are 6.18:1 and 4.99:1.
 *   · The all-done board says `--color/success`. White on it is 3.39:1 and it
 *     is 2.73:1 against the track, so the all-done fill is
 *     `--bk-success-text` — the token set's own readable green — at 5.36:1
 *     and 4.33:1. This one was already shipping broken; the board only copied
 *     it.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ACHIEVEMENT_AUTO_DISMISS_MS, type AchievementPromptState } from "./useOnboardingOrchestrator";
import { Button } from "@/editor/chrome-ui";

export interface AchievementPromptProps extends AchievementPromptState {
  onDismiss: () => void;
}

/* The two accent-bearing surfaces (badge disc, CTA fill, countdown fill) —
   one place, so "which green / which blue" is answered once. */
const FILL_STEP = "tw:bg-[var(--bk-accent)]";
const FILL_DONE = "tw:bg-[var(--bk-success-text)]";

const SCRIM =
  "tw:fixed tw:inset-0 tw:cursor-pointer tw:bg-[var(--bk-alpha-ink-40)] tw:[z-index:10000]";
const CARD =
  "tw:fixed tw:top-1/2 tw:left-1/2 tw:-translate-x-1/2 tw:-translate-y-1/2 tw:[z-index:10001] " +
  "tw:w-[380px] tw:max-w-[calc(100vw-48px)] tw:overflow-hidden tw:flex tw:flex-col " +
  "tw:bg-[var(--bk-bg-card)] tw:border tw:border-[var(--bk-border)] tw:rounded-xl " +
  "tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)]";
const TRACK = "tw:h-[3px] tw:w-full tw:flex-none tw:bg-[var(--bk-border)]";
const BODY = "tw:flex tw:flex-col tw:gap-5 tw:pt-6 tw:px-6 tw:pb-5";
const HEAD = "tw:flex tw:items-start tw:gap-[14px]";
/* The board sizes the disc's glyph 18. There is no 18 on the DS type scale
   (11/12/13/14/16/20/24) and `gate:design-debt-ratchet` locks off-scale sizes
   at zero, so it snaps to 16 — the same call InspectorEmptyState made when
   board 1175:4847 asked for 10 against the scale's 11 floor. It still travels
   in the board's direction: 20 was what shipped. */
const BADGE =
  "tw:size-10 tw:flex-none tw:rounded-full tw:flex tw:items-center tw:justify-center " +
  "tw:text-[length:var(--bk-text-16)] tw:font-bold tw:text-[var(--bk-accent-on)]";
const HEAD_TEXT = "tw:flex tw:flex-col tw:gap-1 tw:flex-1 tw:min-w-0";
/* 11/600/uppercase/0.88 tracking is the board's kicker on BOTH states, in
   `--bk-success-text` either way — it names the fact that a step landed, not
   which step. */
const KICKER =
  "tw:m-0 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.88px] tw:text-[var(--bk-success-text)]";
const TITLE = "tw:m-0 tw:text-[16px] tw:font-semibold tw:text-[var(--bk-ink)]";
const DONE_DESC = "tw:m-0 tw:text-[13px] tw:leading-[1.5] tw:text-[var(--bk-ink-soft)]";
const NEXT_UP =
  "tw:flex tw:items-start tw:gap-2.5 tw:px-[14px] tw:py-3 tw:rounded-lg " +
  "tw:bg-[var(--bk-bg-app)] tw:border tw:border-[var(--bk-border)]";
const NEXT_ARROW = "tw:flex-none tw:text-[14px] tw:font-medium tw:text-[var(--bk-ink-soft)]";
const NEXT_TEXT = "tw:flex tw:flex-col tw:gap-0.5 tw:flex-1 tw:min-w-0";
const NEXT_KICKER =
  "tw:m-0 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.88px] tw:text-[var(--bk-ink-soft)]";
const NEXT_LABEL = "tw:m-0 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink-soft)]";
const NEXT_DESC = "tw:m-0 tw:text-[12px] tw:leading-[1.4] tw:text-[var(--bk-ink-soft)]";
/* `tw:h-11` (44) beats flowbite's own height the way twMerge resolves it —
   same property wins. A `min-h` would not: it sets a DIFFERENT property, does
   not conflict, and the default height stands (CLAUDE.md §Chrome Routing). */
const CTA =
  "tw:w-full tw:h-11 tw:py-[11px] tw:rounded-lg tw:border-0 tw:text-[var(--bk-accent-on)]";
/* `leading-[normal]` is load-bearing, not decoration: flowbite's size-md
   `text-sm` puts a 20px line-height on the button and the label inherits
   it, where the board (430:2373) says `normal`. */
const CTA_LABEL = "tw:text-[14px] tw:font-semibold tw:leading-[normal] tw:text-[var(--bk-accent-on)]";

export const AchievementPrompt: React.FC<AchievementPromptProps> = ({
  completedStep,
  nextStep,
  isLastStep,
  onDismiss,
}) => {
  // Visual countdown bar — runs 100→0% over ACHIEVEMENT_AUTO_DISMISS_MS,
  // synced to the orchestrator's auto-dismiss setTimeout. Single source of
  // truth lives in useOnboardingOrchestrator (audit Pattern D fix).
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / ACHIEVEMENT_AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Screen reader announcement on mount
  React.useEffect(() => {
    const el = document.getElementById("bd-achievement-live");
    if (!el) return;
    el.textContent = isLastStep
      ? "Congratulations! You have completed all getting started steps."
      : `Step complete: ${completedStep.label}. Next: ${nextStep?.label ?? ""}`;
  }, [completedStep, nextStep, isLastStep]);

  const fill = isLastStep ? FILL_DONE : FILL_STEP;

  return (
    <>
      {/* Accessible live region — invisible, read by screen readers on mount */}
      <div
        id="bd-achievement-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tw:absolute tw:size-px tw:overflow-hidden tw:opacity-0 tw:pointer-events-none"
      />
      {/* Dim overlay — click to dismiss */}
      <div onClick={onDismiss} aria-hidden="true" className={SCRIM} />
      {/* Achievement card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-title"
        className={CARD}
        data-testid="achievement-card"
      >
        {/* Auto-dismiss countdown: the board's track, with the fill on top. */}
        <div aria-hidden="true" className={TRACK} data-testid="achievement-countdown-track">
          {/* width is the only genuinely computed value in this file. */}
          <div
            className={`tw:h-full ${fill}`}
            style={{ width: `${progress}%`, transition: "width 50ms linear" }}
            data-testid="achievement-countdown-fill"
          />
        </div>

        <div className={BODY} data-testid="achievement-body">
          {/* Completed step header */}
          <div className={HEAD} data-testid="achievement-head">
            <div
              aria-hidden="true"
              className={`${BADGE} ${fill}`}
              data-testid="achievement-badge"
            >
              {/* ★, not 🎉: a colour emoji ignores `color` and paints itself. */}
              <span data-testid="achievement-badge-glyph">{isLastStep ? "★" : "✓"}</span>
            </div>

            <div className={HEAD_TEXT} data-testid="achievement-head-text">
              <p className={KICKER} data-testid="achievement-kicker">
                {isLastStep ? "All done" : "Step complete"}
              </p>
              <h3 id="achievement-title" className={TITLE} data-testid="achievement-title">
                {isLastStep ? "You’re all set" : completedStep.label}
              </h3>
              {isLastStep && (
                <p className={DONE_DESC} data-testid="achievement-done-desc">
                  You’ve finished every getting-started step. Go build something great.
                </p>
              )}
            </div>
          </div>

          {/* Next step preview — only shown when not the last step */}
          {!isLastStep && nextStep && (
            <div className={NEXT_UP} data-testid="achievement-next-up">
              <span aria-hidden="true" className={NEXT_ARROW} data-testid="achievement-next-arrow">
                →
              </span>
              <div className={NEXT_TEXT} data-testid="achievement-next-text">
                <p className={NEXT_KICKER} data-testid="achievement-next-kicker">
                  Next up
                </p>
                <p className={NEXT_LABEL} data-testid="achievement-next-label">
                  {nextStep.label}
                </p>
                <p className={NEXT_DESC} data-testid="achievement-next-desc">
                  {nextStep.description}
                </p>
              </div>
            </div>
          )}

          {/* Primary action */}
          <Button
            type="button"
            onClick={onDismiss}
            autoFocus
            className={`${CTA} ${fill}`}
            data-testid="achievement-cta"
          >
            <span className={CTA_LABEL} data-testid="achievement-cta-label">
              {isLastStep ? "Done" : "Continue →"}
            </span>
          </Button>
        </div>
      </div>
    </>
  );
};

export default AchievementPrompt;
