/**
 * Layout-section `tw:` class strings — the class-based successor to this
 * folder's `styles.ts` inline-style objects.
 *
 * Drained per consumer (PositionControls, DisplayControls, ConstraintControl);
 * `styles.ts` is deleted when the last one moves. Anything shared across
 * inspector sections belongs in `shared/controls/controlClasses.ts` instead —
 * these are specific to the layout section's card/offset chrome.
 *
 * @license BSD-3-Clause
 */

/** Display/position mode card — icon over label, active = accent tint. */
export const cardBtnClass = (active: boolean): string =>
  [
    "tw:flex tw:flex-1 tw:flex-col tw:items-center tw:justify-center tw:gap-[3px]",
    "tw:px-1 tw:py-[7px] tw:rounded-[5px] tw:border tw:text-[9.5px] tw:font-medium",
    "tw:[font-family:var(--bk-font-ui)] tw:[transition:var(--bk-transition-fast)]",
    active
      ? "tw:bg-[var(--bk-accent-tint)] tw:border-[var(--bk-alpha-accent-30)] tw:text-blue-700 tw:hover:bg-[var(--bk-accent-tint)]"
      : "tw:bg-[var(--bk-bg-subtle)] tw:border-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-gray-100",
  ].join(" ");

/** Sub-panel holding the top/right/bottom/left offset inputs. */
export const OFFSET_PANEL =
  "tw:p-2 tw:mb-1.5 tw:rounded-md tw:border tw:border-gray-200 tw:bg-[var(--bk-bg-subtle)]";

/** The element stand-in at the centre of the offset cross. */
export const OFFSET_ANCHOR =
  "tw:w-[30px] tw:h-[22px] tw:rounded-[3px] tw:bg-[var(--bk-accent-tint)] tw:border tw:border-[var(--bk-alpha-accent-30)]";

/** Fixed / Fill / Hug segmented control — same card shape, one step denser. */
export const constraintBtnClass = (active: boolean): string =>
  `${cardBtnClass(active)} tw:py-1.5 tw:rounded tw:text-[10px]`;

/** Hint under the display-mode cards, pointing at the Flexbox/Grid section. */
export const TIP_BOX =
  "tw:mt-0.5 tw:px-2 tw:py-[5px] tw:rounded tw:bg-[var(--bk-accent-tint)] tw:text-[10.5px] " +
  "tw:font-medium tw:text-blue-700 tw:[font-family:var(--bk-font-ui)]";

/** Small caption above a control cluster ("Position", "Position Offset"). */
export const CLUSTER_CAPTION = "tw:flex tw:items-center tw:mb-1.5 tw:text-xs tw:text-gray-500";
