/**
 * The CMS workspace's form-tab recipe (Dynamic pages 4428:147857, Settings
 * 4428:148660): 12/18 labels over 32px controls, radius 6, on a 360px column.
 *
 * @license BSD-3-Clause
 */
export const PANE = "tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-4 tw:overflow-y-auto tw:px-5 tw:py-4";
export const LABEL = "tw:block tw:mb-1 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
export const CONTROL_W = "tw:w-[360px]";
export const CONTROL =
  "tw:[&_input]:h-8 tw:[&_input]:py-0 tw:[&_input]:pl-2.5 tw:[&_input]:text-[13px] tw:[&_input]:rounded-[6px] " +
  "tw:[&_select]:h-8 tw:[&_select]:py-0 tw:[&_select]:pl-2.5 tw:[&_select]:text-[13px] tw:[&_select]:rounded-[6px]";
export const NOTE = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
export const WARN = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text)]";
/** The small-caps section head ("PAGES TO GENERATE", "COLLECTION"). */
const SECTION_TYPE = "tw:m-0 tw:text-[11px] tw:font-medium tw:uppercase tw:leading-4 tw:tracking-[0.88px]";
export const SECTION = `${SECTION_TYPE} tw:text-[var(--bk-gray-500)]`;
/** Settings' "DANGER ZONE" head — its own colour, not a second colour class
 *  on SECTION (on a plain element the stylesheet order would decide). */
export const SECTION_DANGER = `${SECTION_TYPE} tw:text-[var(--bk-error-text)]`;
/** The 28px compact button both tabs end on. */
export const ACTION = "tw:h-7 tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
