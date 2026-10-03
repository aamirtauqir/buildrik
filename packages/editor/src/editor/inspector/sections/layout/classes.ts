/**
 * Layout-section `tw:` class strings — the Position offset cross's chrome.
 * Anything shared across inspector sections belongs in
 * `shared/controls/controlClasses.ts` instead.
 *
 * @license BSD-3-Clause
 */

/** Sub-panel holding the top/right/bottom/left offset inputs. */
export const OFFSET_PANEL =
  "tw:p-2 tw:mb-1.5 tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-subtle)]";

/** The element stand-in at the centre of the offset cross. */
export const OFFSET_ANCHOR =
  "tw:w-[30px] tw:h-[22px] tw:rounded-[3px] tw:bg-[var(--bk-accent-tint)] tw:border tw:border-[var(--bk-alpha-accent-30)]";

/** Small caption above a control cluster ("Position Offset"). */
export const CLUSTER_CAPTION = "tw:flex tw:items-center tw:mb-1.5 tw:text-xs tw:text-[var(--bk-ink-muted)]";
