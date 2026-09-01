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
 * Position: fixed bottom-right, above the canvas toolbar.
 * Behaviour:
 *   - Collapsed: thin header pill showing progress
 *   - Expanded: full accordion checklist, one active step at a time
 *   - Each step: click to expand → description + optional CTA button
 *   - Completed steps: green check, muted, collapses automatically
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
      >
        <span className={`${PILL_DOT} ${allDone ? "tw:bg-[var(--bk-success)]" : "tw:bg-[var(--bk-accent)]"}`} />
        <span className={PILL_TEXT}>
          {allDone ? "All done!" : `${completedCount} / ${totalCount} done`}
        </span>
        <ChevronUp size={12} className="tw:text-[var(--bk-ink-muted)] tw:flex-none" />
      </div>
    );
  }

  // ── Full panel ──────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={PANEL} role="region" aria-label="Getting started checklist">
      {/* Header */}
      <div className={HEADER}>
        {/* Boards 296:1999 / 296:2030 put the title and the counter on ONE
            row — "Get started" left, "4/7" right-aligned in the same 300-wide
            frame — and read "You're all set" when everything is done. This
            stacked them as two lines and spelled the count out as
            "4 of 7 complete". The spoken form stays on the aria-label above,
            where it belongs; the visible one follows the board. */}
        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-1 tw:min-w-0">
          <span className={`${HEADER_TITLE} tw:flex-1 tw:min-w-0 tw:truncate`}>
            {allDone ? "You’re all set" : "Get started"}
          </span>
          <span className={`${HEADER_COUNT} tw:flex-none`}>
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
          >
            <Minus size={13} />
          </Button>

          {/* Close / Confirm */}
          {confirmingDismiss ? (
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:pl-1">
              <span className={CONFIRM_TEXT}>Hide this?</span>
              <Button type="button" size="xs" className="tw:border-0 tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)] tw:text-[11px] tw:font-semibold" onClick={onDismiss}>
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
        {steps.map((step) => {
          const isActive = activeStepId === step.id;
          const isCompleted = step.completed;

          return (
            <li
              key={step.id}
              className={[
                "tw:[transition:var(--bk-transition-fast)] tw:border-l-2",
                isCompleted ? "tw:opacity-55" : "tw:opacity-100",
                isActive && !isCompleted
                  ? "tw:bg-[var(--bk-accent-subtle)] tw:border-l-blue-700"
                  : "tw:bg-transparent tw:border-l-transparent",
              ].join(" ")}
            >
              {/* Step header row */}
              <Button
                type="button"
                className={STEP_ROW}
                onClick={() => onSetActiveStepId(isActive ? null : step.id)}
                aria-expanded={isActive}
              >
                {/* Circle indicator */}
                <span
                  className={`${CIRCLE} ${
                    isCompleted
                      ? "tw:bg-[var(--bk-success)] tw:border-[var(--bk-success)]"
                      : isActive
                        ? "tw:bg-[var(--bk-accent)] tw:border-[var(--bk-accent)]"
                        : "tw:bg-transparent tw:border-[var(--bk-gray-300)]"
                  }`}
                  aria-hidden="true"
                >
                  {isCompleted && <Check size={10} strokeWidth={3} color="var(--bk-accent-on)" />}
                </span>

                {/* Label */}
                <span
                  className={`${STEP_LABEL} ${isCompleted ? "tw:text-[var(--bk-ink-muted)] tw:line-through" : "tw:text-[var(--bk-ink)] tw:no-underline"}`}
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
          <p className={FOOTER_TEXT}>
            You have completed all the getting started steps. Go build something great.
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
/* IN THE STATUS BAR, NOT ON TOP OF THE WORK (2026-08-27).

   `right-6 bottom-20` put the pill on the inspector: measured live at
   1440x900 with an element selected, it sat on the "Background" row and held
   it for the whole first session. Two further placements were measured and
   both failed, which is the finding:

     left of the inspector  → landed on the canvas toolbar's "X-Ray" button.
                              That toolbar is NOT bottom-centred the way its
                              floating-pill look suggests — it spans the full
                              canvas width, x 380→1140 at y 796→836.
     above the toolbar      → landed on the canvas breadcrumb's
                              "← Parent / → Child".

   There is no free bottom corner in this shell. Every bottom-anchored float
   covers a control somewhere. The footer is the one band with room: 32 tall,
   full width, and empty from x 105 to x 1328 — the selection readout on the
   left, the device/zoom readout on the right, 1223px of nothing between.

   So the collapsed chip lives in the footer band and covers only that gap, and
   the panel opens upward from it. It is still `fixed` rather than a child of
   StudioFooter — the orchestrator's state lives here, and a second mount point
   would mean a second copy of it — but it occupies status-bar space and
   nothing else. Right offset clears the device/zoom readout with room for its
   longest label ("Tablet · 150%").

   Underscores become spaces in a Tailwind arbitrary value, and `calc()` needs
   them around the `+` or the declaration is invalid and silently drops. */
const CHIP_RIGHT = "tw:right-[160px]";

const PANEL =
  `tw:fixed ${CHIP_RIGHT} tw:bottom-10 tw:w-80 tw:max-h-[540px] tw:bg-white ` +
  "tw:border tw:border-[var(--bk-gray-200)] " +
  "tw:rounded-xl tw:[box-shadow:var(--bk-shadow-overlay)] tw:[z-index:var(--bk-z-drawer)] tw:overflow-hidden tw:flex " +
  "tw:flex-col tw:[font-family:var(--bk-font-ui)]";
/* One above the footer, which is `--bk-z-topbar` (LayoutShell.css). At drawer
   height the chip was in the DOM at the right place and simply never painted —
   `elementFromPoint` at its centre returned the FOOTER. Still below popovers
   (40), overlays (50) and modals (60), so the original rule holds: a dismissible
   progress helper does not outrank an open menu. */
const PILL =
  `tw:fixed ${CHIP_RIGHT} tw:bottom-0.5 tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-0.5 tw:bg-white ` +
  "tw:border tw:border-[var(--bk-gray-200)] tw:rounded-full tw:[box-shadow:var(--bk-shadow-overlay)] " +
  "tw:[z-index:calc(var(--bk-z-topbar)_+_1)] " +
  "tw:cursor-pointer tw:[font-family:var(--bk-font-ui)] tw:select-none";
const PILL_DOT = "tw:size-2 tw:rounded-full tw:flex-none";
const PILL_TEXT = "tw:text-xs tw:font-semibold tw:text-[var(--bk-ink)] tw:whitespace-nowrap";
const HEADER = "tw:flex tw:items-start tw:gap-2.5 tw:px-3.5 tw:pt-3.5 tw:pb-3";
const HEADER_TITLE = "tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)] tw:tracking-[-0.1px]";
const HEADER_COUNT = "tw:text-[11px] tw:text-[var(--bk-ink-muted)] tw:font-medium";
const ICON_BTN =
  "tw:flex tw:items-center tw:justify-center tw:size-6.5 tw:bg-transparent tw:border-0 tw:rounded-md " +
  "tw:text-[var(--bk-ink-muted)] tw:p-0 tw:[transition:var(--bk-transition-fast)]";
const CONFIRM_TEXT = "tw:text-[11px] tw:text-[var(--bk-ink-soft)] tw:whitespace-nowrap";
const PROGRESS_TRACK = "tw:h-0.5 tw:bg-[var(--bk-gray-100)] tw:flex-none";
const LIST = "tw:list-none tw:m-0 tw:py-1.5 tw:overflow-y-auto tw:flex-1";
const STEP_ROW =
  "tw:flex tw:items-center tw:gap-2.5 tw:w-full tw:px-3.5 tw:py-2 tw:bg-transparent tw:border-0 " +
  "tw:text-left tw:text-inherit";
const CIRCLE =
  "tw:size-4.5 tw:rounded-full tw:border-[1.5px] tw:flex-none tw:flex tw:items-center tw:justify-center " +
  "tw:[transition:var(--bk-transition-fast)]";
const STEP_LABEL = "tw:text-[13px] tw:font-medium tw:flex-1 tw:min-w-0 tw:leading-[1.35]";
const STEP_BODY = "tw:pt-0.5 tw:pr-3.5 tw:pb-3 tw:pl-[42px] tw:flex tw:flex-col tw:gap-2.5";
const STEP_DESC = "tw:m-0 tw:text-xs tw:leading-relaxed tw:text-[var(--bk-ink-muted)]";
const FOOTER = "tw:px-4 tw:pt-3 tw:pb-4 tw:border-t tw:border-[var(--bk-gray-200)] tw:flex tw:flex-col tw:gap-2.5";
const FOOTER_TEXT = "tw:m-0 tw:text-xs tw:text-[var(--bk-ink-muted)] tw:leading-normal";

export default OnboardingChecklist;
