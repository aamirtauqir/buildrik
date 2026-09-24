/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette (error boundary / overlay / preview
 *   frame / warm neutral / onboarding theme). Chrome-hex lint rules do not apply.
 *
 * OnboardingChecklist — Single-layer "Get started" panel
 *
 * Replaces the old 3-component system (OnboardingModal + TourOverlay +
 * OnboardingProgress) with one cohesive, professional checklist widget.
 *
 * Position: fixed at the foot of the rail, above "? Help"; the panel opens to
 * the rail's right.
 * Behaviour:
 *   - Collapsed: thin header pill showing progress
 *   - Expanded: full accordion checklist, one active step at a time
 *   - Each step: click to expand → description + optional CTA button
 *   - Completed steps: accent-filled DS checkbox, muted, collapses automatically
 *   - Dismiss: inline "Are you sure?" confirmation (not permanent on first click)
 *   - Minimize: collapses to pill without confirming
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Check, ChevronUp, ChevronDown, Minus, X, ArrowRight } from "lucide-react";
import type { OnboardingStep } from "../../shared/constants/onboardingSteps";
import { Button } from "@/editor/chrome-ui";
// ── Props ───────────────────────────────────────────────────────────────────

export interface OnboardingChecklistProps {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  /** Which step id is currently expanded */
  activeStepId: string | null;
  onSetActiveStepId: (id: string | null) => void;
  /** Called when user clicks a step's CTA button */
  onAction: (actionKey: string) => void;
  /** Permanently close (with confirmation) */
  onDismiss: () => void;
  /** Collapse to pill */
  onMinimize: () => void;
  isMinimized: boolean;
  onRestore: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  steps,
  completedCount,
  totalCount,
  activeStepId,
  onSetActiveStepId,
  onAction,
  onDismiss,
  onMinimize,
  isMinimized,
  onRestore,
}) => {
  const [confirmingDismiss, setConfirmingDismiss] = React.useState(false);
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount === totalCount;

  // Auto-cancel dismiss confirmation if user clicks elsewhere
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!confirmingDismiss) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setConfirmingDismiss(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [confirmingDismiss]);

  // ── Minimized pill ──────────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div className={PILL} onClick={onRestore} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onRestore(); }}
        aria-label={`Get started — ${completedCount} of ${totalCount} complete. Click to expand.`}
        data-testid="setup-chip"
      >
        <span
          data-testid="setup-chip-dot"
          className={`${PILL_DOT} ${allDone ? "tw:bg-[var(--bk-success)]" : "tw:bg-[var(--bk-accent)]"}`}
        />
        {/* `2/7 done`, not `2 / 7 done` — board 1342:7169. The spoken form
            ("2 of 7 complete") stays on the aria-label above, where it reads
            correctly; the visible chip follows the board. */}
        <span className={PILL_TEXT} data-testid="setup-chip-text">
          {allDone ? "Done" : `${completedCount}/${totalCount}`}
        </span>
      </div>
    );
  }

  // ── Full panel ──────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={PANEL}
      role="region"
      aria-label="Getting started checklist"
      data-testid="checklist-panel"
    >
      {/* Header */}
      <div className={HEADER}>
        {/* Boards 296:1999 / 296:2030 put the title and the counter on ONE
            row — "Get started" left, "4/7" right-aligned in the same 300-wide
            frame — and read "You're all set" when everything is done. This
            stacked them as two lines and spelled the count out as
            "4 of 7 complete". The spoken form stays on the aria-label above,
            where it belongs; the visible one follows the board. */}
        <div
          className="tw:flex tw:items-center tw:gap-2 tw:flex-1 tw:min-w-0"
          data-testid="checklist-header-row"
        >
          <span className={`${HEADER_TITLE} tw:flex-1 tw:min-w-0 tw:truncate`} data-testid="checklist-title">
            {allDone ? "You’re all set" : "Get started"}
          </span>
          <span className={`${HEADER_COUNT} tw:flex-none`} data-testid="checklist-count">
            {completedCount}/{totalCount}
          </span>
        </div>

        <div className="tw:flex tw:items-center tw:gap-0.5 tw:flex-none">
          {/* Minimize */}
          <Button
            type="button"
            className={ICON_BTN}
            onClick={onMinimize}
            aria-label="Minimize checklist"
            title="Minimize"
            data-testid="checklist-minimize"
          >
            <Minus size={13} />
          </Button>

          {/* Close / Confirm */}
          {confirmingDismiss ? (
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:pl-1">
              <span className={CONFIRM_TEXT}>Hide this?</span>
              <Button type="button" size="xs" className="tw:border-0 tw:bg-[var(--bk-error-tint)] tw:hover:bg-[var(--bk-error)] tw:hover:text-[var(--bk-bg-panel)] tw:text-[var(--bk-error-text)] tw:text-[11px] tw:font-semibold" onClick={onDismiss}>
                Yes
              </Button>
              <Button type="button" size="xs" color="light" className="tw:border-0 tw:bg-transparent tw:text-[var(--bk-ink-muted)] tw:text-[11px]" onClick={() => setConfirmingDismiss(false)}>
                No
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className={ICON_BTN}
              onClick={() => setConfirmingDismiss(true)}
              aria-label="Close checklist"
              title="Close"
            >
              <X size={13} />
            </Button>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className={PROGRESS_TRACK}>
        {/* width is the only genuinely computed value in this file. */}
        <div
          className={`tw:h-full tw:rounded-[1px] tw:[transition:width_400ms_ease] ${allDone ? "tw:bg-[var(--bk-success)]" : "tw:bg-[var(--bk-accent)]"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Steps */}
      <ul className={LIST} aria-label="Onboarding steps">
        {steps.map((step, index) => {
          const isActive = activeStepId === step.id;
          const isCompleted = step.completed;

          return (
            <li
              key={step.id}
              className={[
                "tw:[transition:var(--bk-transition-fast)] tw:border-l-2",
                /* Was `opacity-55` on a completed row. The boards draw those
                   rows at FULL strength — the muted label and the filled box
                   carry "done" — and the fade was a contrast failure NO
                   instrument here can see: the sweep reads computed `color`,
                   which is still `--bk-ink-muted`, while the pixels were that
                   colour at 55% over white, i.e. 2.1:1. DESIGN.md: tints are never
                   frame/alpha opacity. */
                "tw:opacity-100",
                isActive && !isCompleted
                  ? "tw:bg-[var(--bk-accent-subtle)] tw:border-l-blue-700"
                  : "tw:bg-transparent tw:border-l-transparent",
              ].join(" ")}
            >
              {/* Step header row */}
              <Button
                type="button"
                className={`${STEP_ROW} ${isCompleted ? STEP_ROW_NO_HOVER : STEP_ROW_HOVER}`}
                onClick={() => onSetActiveStepId(isActive ? null : step.id)}
                aria-expanded={isActive}
                data-testid={`checklist-step-${index}`}
              >
                {/* Box indicator — boards 296:1999 / 296:2030 draw the DS
                    Checkbox: a 4px-radius square, accent-filled with a white
                    tick once done, white with a `--bk-border-medium` hairline
                    while pending. It was a green ROUND disc.
                    ACTIVE is the one state the board has no opinion on (it
                    draws a flat list, no accordion), and it must not read as
                    done — so it is the accent OUTLINE, not the accent fill. */}
                <span
                  className={`${BOX} ${
                    isCompleted
                      ? "tw:bg-[var(--bk-accent)] tw:border-[var(--bk-accent)]"
                      : isActive
                        ? "tw:bg-[var(--bk-bg-panel)] tw:border-[var(--bk-accent)]"
                        : "tw:bg-[var(--bk-bg-panel)] tw:border-[var(--bk-border-medium)]"
                  }`}
                  aria-hidden="true"
                  data-testid={`checklist-box-${index}`}
                >
                  {isCompleted && <Check size={10} strokeWidth={3} color="var(--bk-accent-on)" />}
                </span>

                {/* Label */}
                <span
                  className={`${STEP_LABEL} ${isCompleted ? "tw:text-[var(--bk-ink-muted)] tw:line-through" : "tw:text-[var(--bk-ink)] tw:no-underline"}`}
                  data-testid={`checklist-label-${index}`}
                >
                  {step.label}
                </span>

                {/* Chevron */}
                {!isCompleted && (
                  <span className="tw:text-[var(--bk-ink-disabled)] tw:flex-none tw:ml-auto">
                    {isActive
                      ? <ChevronUp size={12} />
                      : <ChevronDown size={12} />
                    }
                  </span>
                )}
              </Button>
              {/* Expanded body */}
              {isActive && !isCompleted && (
                <div className={STEP_BODY}>
                  <p className={STEP_DESC}>{step.description}</p>
                  {step.actionKey && step.actionLabel && (
                    <Button
                      type="button"
                      size="xs"
                      /* min-h-6 = 24: flowbite's xs renders this at 22px tall,
                         under WCAG 2.5.8's 24x24 target minimum. */
                      className="tw:self-start tw:font-semibold tw:min-h-6"
                      onClick={() => onAction(step.actionKey!)}
                    >
                      {step.actionLabel}
                      <ArrowRight size={12} className="tw:ml-1.5 tw:flex-none" />
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {/* All-done footer */}
      {allDone && (
        <div className={FOOTER}>
          {/* The same sentence board 430:2375 gives the achievement prompt, so
              the two surfaces that congratulate the same user one screen apart
              stop doing it in two different sets of words. */}
          <p className={FOOTER_TEXT}>
            You’ve finished every getting-started step. Go build something great.
          </p>
          <Button type="button" size="xs" color="light" className="tw:self-start tw:font-semibold" onClick={onDismiss}>
            Close checklist
          </Button>
        </div>
      )}
    </div>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

/* The only value here that is genuinely computed is the progress bar's width.
   Everything else was a static object, including the three-state step circle
   and label, which are now class ternaries. */
/* z on the token scale, not a raw 1200. At 1200 this floated over EVERY
   popover in the editor: the footer's zoom flyout opened underneath the pill,
   which covered its "Zoom in" row. A dismissible progress helper does not
   outrank an open menu — drawer height puts it above the canvas and below
   popovers (40), overlays (50) and modals (60). */
/* AT THE FOOT OF THE RAIL, NOT ON TOP OF THE WORK (2026-09-24).

   It lived in the 32px status footer, the one band with room; the footer is
   gone (the columns run to 900) and parked where it was, the chip floated on
   the inspector's foot. No board places it. The rail between Brand and
   "? Help" is empty on every screen, so the chip is a 44-wide rail plate
   directly above Help (Help spans y850–894 at 900, so 56 from the bottom
   leaves a 6px gap), and the
   panel opens to the rail's right, bottom-aligned. It covers nothing and sits
   beside the other "help me" door. The visible label is short ("3/7",
   "Done") to fit the rail; the full sentence stays on the aria-label.
   Logged in designer-notes.md. */
const CHIP_POS = "tw:left-2 tw:bottom-[56px]";

const PANEL =
  `tw:fixed tw:left-[68px] tw:bottom-2 tw:w-80 tw:max-h-[540px] tw:bg-white ` +
  "tw:border tw:border-[var(--bk-gray-200)] " +
  /* Above the drawer it now opens beside (it rendered UNDER the Add drawer
     at drawer height), still below popovers, overlays and modals. */
  "tw:rounded-xl tw:[box-shadow:var(--bk-shadow-overlay)] tw:[z-index:calc(var(--bk-z-topbar)_+_1)] tw:overflow-hidden tw:flex " +
  "tw:flex-col tw:[font-family:var(--bk-font-ui)]";
/* One above the footer, which is `--bk-z-topbar` (LayoutShell.css). At drawer
   height the chip was in the DOM at the right place and simply never painted —
   `elementFromPoint` at its centre returned the FOOTER. Still below popovers
   (40), overlays (50) and modals (60), so the original rule holds: a dismissible
   progress helper does not outrank an open menu. */
/* Board 1342:7167 draws the collapsed chip as a plate in the status bar, not a
   card floating over it: 96x24, radius 12, `--color/accent-tint` fill,
   `--color/accent-text` type at 12/medium, a 6px dot, and NO border and NO
   shadow. What shipped was white with a gray-200 hairline and
   `--bk-shadow-overlay`, i.e. a small floating card sitting in a band it is
   supposed to belong to, with `--bk-ink` type a weight heavier than the board's.
   The chevron went with it — the board draws dot + label only, and the
   affordance is already carried by role=button, the pointer cursor and the
   aria-label.
   The 96 is board-literal and safe: every string this component can render
   ("0/7 done" … "7/7 done", "All done!") measures under the 86px the padding
   leaves. */
const PILL =
  `tw:fixed ${CHIP_POS} tw:flex tw:h-6 tw:w-11 tw:items-center tw:justify-center tw:gap-1 tw:px-1 ` +
  "tw:bg-[var(--bk-accent-tint)] tw:rounded-[12px] " +
  "tw:[z-index:calc(var(--bk-z-topbar)_+_1)] " +
  "tw:cursor-pointer tw:[font-family:var(--bk-font-ui)] tw:select-none";
const PILL_DOT = "tw:size-1.5 tw:rounded-full tw:flex-none";
const PILL_TEXT =
  "tw:text-[11px] tw:leading-[normal] tw:font-medium tw:text-[var(--bk-accent-text)] tw:whitespace-nowrap";
const HEADER = "tw:flex tw:items-start tw:gap-2.5 tw:px-3.5 tw:pt-3.5 tw:pb-3";
/* 14 / 13, not 13 / 11 — boards 296:1999 and 296:2030 size the title and the
   counter one step up from what shipped. */
const HEADER_TITLE = "tw:text-[14px] tw:font-semibold tw:text-[var(--bk-ink)] tw:tracking-[-0.1px]";
const HEADER_COUNT = "tw:text-[13px] tw:text-[var(--bk-ink-muted)] tw:font-medium";
/* THE HOVER OVERRIDES ARE NOT DECORATION — see the block comment above
   STEP_ROW. Without them these icon buttons turned flowbite primary-800 on
   hover with `--bk-ink-muted` glyphs on top. */
const ICON_BTN =
  "tw:flex tw:items-center tw:justify-center tw:size-6.5 tw:bg-transparent tw:border-0 tw:rounded-md " +
  "tw:hover:bg-[var(--bk-bg-subtle)] tw:hover:text-[var(--bk-ink)] " +
  "tw:text-[var(--bk-ink-muted)] tw:p-0 tw:[transition:var(--bk-transition-fast)]";
const CONFIRM_TEXT = "tw:text-[11px] tw:text-[var(--bk-ink-soft)] tw:whitespace-nowrap";
const PROGRESS_TRACK = "tw:h-0.5 tw:bg-[var(--bk-gray-100)] tw:flex-none";
const LIST = "tw:list-none tw:m-0 tw:py-1.5 tw:overflow-y-auto tw:flex-1";
/* A HOVER OVERRIDE IS REQUIRED HERE, and the modifier has to be the bare
   `hover:` one. Measured 2026-09-08: flowbite's default colour is
   `bg-primary-700 text-white hover:bg-primary-800`, and `tw:bg-transparent`
   only conflicts with the FIRST of those — so every one of these rows painted
   itself flowbite primary-800 on hover while its label stayed
   `--bk-ink-muted`: 1.86:1,
   on the panel a first-run user is meant to read. `tw:enabled:hover:` would
   NOT have fixed it; twMerge only drops the flowbite class when the modifier
   chain matches too. */
const STEP_ROW =
  "tw:flex tw:items-center tw:gap-2.5 tw:w-full tw:px-3.5 tw:py-2 tw:bg-transparent tw:border-0 " +
  "tw:text-left tw:text-inherit";
/* The wash is 6% ink and it is NOT applied to completed rows, which is a
   contrast result rather than a preference: their label is the board's
   `--color/ink-muted`, 4.83:1 on white, and 6% of ink under it drops that to
   4.28 — under AA. Pending rows carry `--bk-ink` (15:1) and can afford it.
   Nothing between 0 and 6% exists in the alpha scale. */
const STEP_ROW_HOVER = "tw:hover:bg-[var(--bk-alpha-ink-06)]";
const STEP_ROW_NO_HOVER = "tw:hover:bg-transparent";
/* Was CIRCLE (`rounded-full`). The boards draw the DS Checkbox — square,
   `--radius/sm` (4px). */
const BOX =
  "tw:size-4.5 tw:rounded-[var(--bk-radius-sm)] tw:border-[1.5px] tw:flex-none tw:flex tw:items-center tw:justify-center " +
  "tw:[transition:var(--bk-transition-fast)]";
/* 14, and no explicit leading: the boards' label nodes are 14px on
   `leading-[normal]`, and 13/1.35 was 17.55px against normal's ~16.9. */
/* `leading-[normal]` is the board's value AND the only way to say it: the
   row is a flowbite Button, whose size-md `text-sm` puts 20px on it and the
   label inherits that. */
const STEP_LABEL = "tw:text-[14px] tw:font-medium tw:leading-[normal] tw:flex-1 tw:min-w-0";
const STEP_BODY = "tw:pt-0.5 tw:pr-3.5 tw:pb-3 tw:pl-[42px] tw:flex tw:flex-col tw:gap-2.5";
const STEP_DESC = "tw:m-0 tw:text-xs tw:leading-relaxed tw:text-[var(--bk-ink-muted)]";
const FOOTER = "tw:px-4 tw:pt-3 tw:pb-4 tw:border-t tw:border-[var(--bk-gray-200)] tw:flex tw:flex-col tw:gap-2.5";
const FOOTER_TEXT = "tw:m-0 tw:text-xs tw:text-[var(--bk-ink-muted)] tw:leading-normal";

export default OnboardingChecklist;
