/**
 * ComparePicker (B8, code-gap plan) — one picker, four baselines.
 *
 * `approved · published · saved · current` (plan row 47). `current` is the
 * working draft and is always present, so the picker treats it as the
 * constant peer of whichever historical baseline the user picks. Each
 * non-current option is disabled with a reason when its version does not
 * exist (Decision 31, board 4418:115592 shape) — picked versions that are
 * identical to current render "No differences" in the Compare body, NOT a
 * disabled picker chip.
 *
 * Mirrors the chip styling from ActivityLogView / HistoryTab's filter row
 * so a chip reads the same across the History panel.
 *
 * Gate 24: chips route through chrome-ui Button — zero raw HTML controls.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { CompareBaseline, ComparePickerProps } from "../types";

const BASELINE_LABEL: Record<CompareBaseline, string> = {
  approved: "Approved",
  published: "Published",
  saved: "Saved",
  current: "Current",
};

const ROW =
  "tw:flex tw:gap-[var(--bk-space-4)] tw:pt-[var(--bk-space-8)] tw:px-[var(--bk-space-12)] tw:flex-wrap";
const CHIP =
  "tw:px-[var(--bk-space-8)] tw:py-[var(--bk-space-4)] tw:text-[12px] " +
  "tw:h-6 tw:leading-4 tw:font-normal tw:[font-family:inherit] tw:text-[var(--bk-ink-soft)] " +
  "tw:bg-transparent tw:border tw:border-[var(--bk-border)] tw:rounded-full " +
  "tw:cursor-pointer tw:[transition:color_150ms_ease-out,background-color_150ms_ease-out,border-color_150ms_ease-out] " +
  "tw:hover:text-[var(--bk-ink)] tw:focus-visible:outline-none " +
  "tw:focus-visible:shadow-[var(--bk-shadow-focus)] " +
  "tw:disabled:cursor-not-allowed tw:disabled:opacity-50 tw:disabled:hover:text-[var(--bk-ink-soft)]";
const CHIP_ACTIVE =
  "tw:font-medium tw:text-[var(--bk-accent-on)] tw:bg-[var(--bk-accent)] tw:border-[var(--bk-accent)] tw:disabled:opacity-100";

/* Order matters — the picker renders left to right; `current` last so the
   historical baselines sit on the left, the constant peer on the right
   (board 6930:79853's "v3 · approved · v5 · published · v6 · live · Current
   draft" row). */
const BASELINE_ORDER: CompareBaseline[] = ["approved", "published", "saved", "current"];

export const ComparePicker: React.FC<ComparePickerProps> = ({
  availability,
  value,
  onChange,
}) => {
  return (
    <div className={ROW} role="group" aria-label="Compare baseline">
      {BASELINE_ORDER.map((baseline) => {
        const info = availability[baseline];
        const isActive = value === baseline;
        const disabled = !info.available;
        const reason = info.reason;
        return (
          <Button
            key={baseline}
            type="button"
            aria-pressed={isActive}
            aria-disabled={disabled || undefined}
            disabled={disabled}
            data-testid={`compare-picker-${baseline}`}
            className={`${CHIP}${isActive ? ` ${CHIP_ACTIVE}` : ""}`}
            onClick={() => {
              if (!disabled) onChange(baseline);
            }}
            title={disabled ? reason : undefined}
          >
            {BASELINE_LABEL[baseline]}
          </Button>
        );
      })}
    </div>
  );
};

export default ComparePicker;
