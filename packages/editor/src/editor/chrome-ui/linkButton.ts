/**
 * The accent text-link Button recipe, as class constants (design-debt arc,
 * 2026-08-29).
 *
 * Two independent audits found this 8-class incantation copy-pasted across 22
 * files. `variant="link"` on the Button wrapper is the home for a NEW link;
 * these constants exist for the existing call sites, which each append their
 * own layout extras (`tw:mt-1.5`, `tw:self-start`, `tw:gap-1.5`…). A constant
 * plus extras produces the byte-identical class string those sites ship today
 * — no utility ever competes with itself — which is why the migration is a
 * rename rather than a restyle.
 *
 * Two forms, because the chrome genuinely has two: the row link (24px min
 * height, horizontal padding stripped) and the tight inline link (no min
 * height, all padding stripped, explicit leading).
 */

/** Row link — the drawer/panel form. */
export const BK_LINK_BUTTON_CLASS =
  "tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] " +
  "tw:text-[var(--bk-accent-text)] tw:enabled:hover:bg-transparent tw:enabled:hover:underline";

/** Tight inline link — sits inside a sentence or a dense footer row. */
export const BK_LINK_BUTTON_TIGHT_CLASS =
  "tw:min-h-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[13px] tw:leading-5 " +
  "tw:text-[var(--bk-accent-text)] tw:shadow-none tw:enabled:hover:bg-transparent tw:enabled:hover:underline";

/** Small link — 12px, for metadata rows and dense overlays. */
export const BK_LINK_BUTTON_SM_CLASS =
  "tw:min-h-5 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] " +
  "tw:text-[var(--bk-accent-text)] tw:enabled:hover:bg-transparent tw:enabled:hover:underline";

/** Small link on a DARK surface (stock/icon overlay headers) — ink is white
 *  there by necessity, not by preference. */
export const BK_LINK_BUTTON_ON_DARK_CLASS =
  "tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[12px] tw:text-white " +
  "tw:enabled:hover:bg-transparent tw:enabled:hover:underline";

/** Inline link with no min-height — used where the row's own line-height sets
 *  the box (export rows, colour-mode rows). */
export const BK_LINK_BUTTON_INLINE_CLASS =
  "tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:font-normal " +
  "tw:text-[var(--bk-accent-text)] tw:enabled:hover:bg-transparent tw:enabled:hover:underline";
