/**
 * DSModeToggle — segmented control for switching the Design System surface
 * between Beginner and Pro display modes (spec §4 row 2 + §6.2 + §7.11).
 *
 * Mode is display-only; engine state is identical in either mode. Beginner
 * hides token IDs and mutes empty foundation kinds; Pro exposes everything.
 *
 * Reads/writes `useDSMode()`. Board 1747:8395 draws the whole 40px row this
 * component owns: two 24px segments inset 12 from the panel edge, the selected
 * mode's own explanation beside them, and a 1px rule under it all.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useDSMode, type DSMode } from "../state/DSModeContext";
import { Button } from "@/editor/chrome-ui";
const SEGMENTS: ReadonlyArray<{ value: DSMode; label: string; hint: string }> = [
  { value: "beginner", label: "Beginner", hint: "Friendly · hides token IDs and empty foundations" },
  { value: "pro", label: "Pro", hint: "Full power · token IDs, every kind, off-DS allowed silently" },
];

export interface DSModeToggleProps {
  /** Optional className applied to the outer wrapper (e.g., for spacing in headers). */
  className?: string;
}

export const DSModeToggle: React.FC<DSModeToggleProps> = ({ className }) => {
  const { mode, setMode } = useDSMode();
  const active = SEGMENTS.find((s) => s.value === mode) ?? SEGMENTS[0];

  return (
    /* This div IS board node 1747:8395 — the 40px mode row, inset 12, on the
       panel's own white with a 1px `--color/border` rule under it. It used to
       be a `--bk-bg-subtle` band supplied by DesignSystemTab's STRIP, which
       painted a second grey header directly beneath the first one; the board
       draws no fill here at all. */
    <div
      data-testid="ds-mode-row"
      className={`tw:flex tw:h-10 tw:flex-none tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-gray-200)] tw:px-3 ${className ?? ""}`}
    >
      <div
        role="radiogroup"
        aria-label="Design system display mode"
        data-testid="ds-mode-toggle"
        className="tw:flex tw:flex-none tw:items-center tw:gap-1"
      >
        {SEGMENTS.map((seg) => {
          const on = mode === seg.value;
          return (
            <Button
              key={seg.value}
              type="button"
              color="light"
              size="xs"
              role="radio"
              aria-checked={on}
              data-testid={`ds-mode-seg-${seg.value}`}
              onClick={() => setMode(seg.value)}
              /* `h-6` and `text-[11px]`, not flowbite's own box: the board puts
                 both segments at 24 tall with an 11px label (1747:8397 /
                 1747:8399, and their labels 1747:8396 / 1747:8398). A `text-xs`
                 utility is 12 and does not set a height at all, so the pill
                 took whatever size="xs" gave it. */
              className={`tw:h-6 tw:px-2.5 tw:py-0 tw:text-[11px] tw:rounded tw:select-none tw:[transition:var(--bk-transition-fast)] ${
                on
                  /* `hover:bg-[var(--bk-accent-hover)]` is not polish. flowbite's
                     `color="light"` theme carries `hover:bg-gray-100`, and a
                     hover variant beats a plain `bg-*` utility whatever twMerge
                     does with the base — so hovering the SELECTED segment
                     repainted it gray-100 under `text-white` and the label
                     measured 1.1:1 and disappeared. Caught by measure.mjs's
                     contrast sweep on brand-dirty, whose click path happens to
                     park the pointer here. */
                  ? "tw:bg-[var(--bk-accent)] tw:hover:bg-[var(--bk-accent-hover)] tw:text-white tw:font-medium tw:border-0"
                  /* White on a `--bk-gray-300` edge — 1747:8399. Only the
                     UNSELECTED segment carries a stroke: 1747:8397 draws the
                     filled one with none, and a border on a fill of the same
                     colour is a 1px lie about the control's size. It shipped
                     transparent-on-transparent, which only read as a control
                     because the group behind it was tinted; with the board's
                     band gone there was nothing left to see. */
                  : "tw:bg-white tw:text-[var(--bk-ink-soft)] tw:font-medium tw:border-[var(--bk-gray-300)]"
              }`}
            >
              {seg.label}
            </Button>
          );
        })}
      </div>
      {/* 1747:8400. The mode's own explanation was a `title` attribute — a
          tooltip on a control whose whole job is to say what the panel will
          show you, invisible unless you hovered the thing you were trying to
          understand. `--bk-ink-muted` on white is 4.83:1; the board's #6b7280
          IS that token. */}
      <span
        data-testid="ds-mode-hint"
        className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[11px] tw:text-[var(--bk-ink-muted)]"
      >
        {active.hint}
      </span>
    </div>
  );
};
