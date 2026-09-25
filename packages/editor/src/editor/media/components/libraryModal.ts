/**
 * The Asset library's modal shape — Clone "Dialog overlays · scrimmed"
 * (3708:20650, 3701:20385, 3701:20353, 3701:20400, 3701:20394), at the
 * founder's density-32 (32px buttons in an 8 gap). The v3 boards redraw the
 * frame to the dialog standard: 24 inset, 20/30 title, right-aligned actions
 * with a text-only Cancel (Move keeps its grey, left Cancel — 4418:149891).
 *
 * Class strings, not a component: chrome-ui's `Modal` is the primitive and
 * stays it — these only carry the numbers the Clone changes (its title is 16
 * where `MODAL_TITLE_CLASS` is 14, its buttons 32 where `MODAL_FOOT_CLASS`
 * caps every button at 28), written once so the four dialogs cannot drift
 * from each other. Inline `tw:` utilities rather than a CSS file because
 * `ConfirmDeleteModal` also mounts from the drawer, where
 * `LibraryManager.css` is not loaded — the orphan-class trap that left that
 * exact modal unstyled for four months.
 *
 * Buttons go through flowbite's twMerge, so `size="xs"` (h-8 px-3) supplies
 * the 32 and the utilities below replace the rest per property.
 *
 * @license BSD-3-Clause
 */

/* v3 (4418:157583 / 156160 / 155920 / 149891): the dialog standard — 24
   inset, a 20/30 semibold title, actions right-aligned inside the padding. */
export const LIBRARY_MODAL_TITLE =
  "tw:m-0 tw:px-6 tw:pt-6 tw:pb-4 tw:text-[length:var(--bk-text-20)] tw:leading-[var(--bk-leading-30)] tw:tracking-[-0.24px] tw:font-semibold tw:text-[var(--bk-ink)]";

/** Sits inside `ModalBody`, which already sets 14 / ink / px-6 pb-4. */
export const LIBRARY_MODAL_BODY = "tw:m-0 tw:leading-5";

export const LIBRARY_MODAL_FOOT = "tw:flex tw:items-center tw:justify-end tw:gap-2 tw:px-6 tw:pb-6";

const BTN =
  "tw:rounded-[var(--bk-radius-md)] tw:text-[length:var(--bk-text-13)] tw:font-medium " +
  "tw:focus:ring-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]";

/** flowbite's default colour IS the brand accent (buttonTheme.ts). */
export const LIBRARY_MODAL_BTN_PRIMARY = BTN;

/** The Clone's quiet grey fill, no border — flowbite `light` is white with a border. */
export const LIBRARY_MODAL_BTN_SECONDARY =
  `${BTN} tw:border-transparent tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-200)]`;

/** v3 Cancel — text only, no fill, no border (4418:157583). */
export const LIBRARY_MODAL_BTN_GHOST =
  `${BTN} tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`;

/** flowbite `light` as it comes — the Clone's white bordered button beside a
 *  grey Done or a blue primary (3720:43316 View versions, 3695:43903 Close). */
export const LIBRARY_MODAL_BTN_OUTLINE = BTN;

/* Board 1175:4838 draws Delete in --color/error WHILE the type-DELETE gate is
   up — that is the state the whole frame is about. flowbite swaps a disabled
   button to bg-subtle/ink-muted (BK_BUTTON_THEME.disabled), so the shipped
   modal went grey the moment the confirm word did not match and the board's
   own subject was unmeasurable. Held at the error fill and dimmed. */
export const LIBRARY_MODAL_BTN_DANGER =
  `${BTN} tw:border-0 tw:bg-[var(--bk-error)] tw:text-[var(--bk-accent-on)] tw:enabled:hover:bg-[var(--bk-error-text)] ` +
  "tw:disabled:bg-[var(--bk-error)] tw:disabled:text-[var(--bk-accent-on)] tw:disabled:opacity-60";
