/**
 * The page-07 recovery dialogs' one layout (2L9 B7-G03 `225:3353`, G14
 * `225:9180`, G15 `225:9715`, G16 `225:10249`): 24 in on every side, the title
 * 16/24 semibold, the body 13/20 in ink-soft 16 under it, the actions 32 tall
 * 16 under that, right-aligned — white with a hairline, or the accent fill for
 * the one primary. The shared ModalTitle / ModalBody / ModalFooter insets
 * (and the h2's own margin) made these 50 px taller than the boards.
 *
 * @license BSD-3-Clause
 */
export const DIALOG_FRAME = "tw:flex tw:flex-col tw:gap-4 tw:p-6";
export const DIALOG_TITLE = "tw:m-0 tw:text-[16px] tw:leading-6 tw:font-semibold";
export const DIALOG_BODY = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]";
export const DIALOG_ACTIONS = "tw:flex tw:justify-end tw:gap-2";
export const DIALOG_ACTION = "tw:h-8 tw:min-h-0 tw:px-4 tw:py-0 tw:text-[13px] tw:leading-5 tw:font-medium";
/** A confirm's two actions are wider — 24 in (G10 Cancel 98, G16 Overwrite 113). */
export const CONFIRM_ACTION = "tw:h-8 tw:min-h-0 tw:px-6 tw:py-0 tw:text-[13px] tw:leading-5 tw:font-medium";
