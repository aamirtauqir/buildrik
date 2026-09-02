/**
 * BK_BUTTON_THEME — the chrome Button vocabulary (design-debt arc 2026-08-28).
 *
 * Flowbite's own primary scale is Flowbite blue, so a bare `<Button>` was
 * ALREADY the brand accent (--bk-accent) — the audits' "no hierarchy" finding was about
 * vocabulary, not the fill: a 6-class ghost-link incantation copy-pasted 48
 * times, and `red`, `failure` and a banned accent tone all in play. Two NEW color keys carry
 * the missing roles; every existing key renders exactly as before.
 *
 *   link  — the accent text-link Button (was the hand-rolled incantation)
 *   ghost — quiet ink-soft action on a transparent fill
 *
 * `variant` sugar on the Button wrapper maps to these (see Button.tsx).
 */
import type { CustomFlowbiteTheme } from "flowbite-react/types";

export const BK_BUTTON_THEME: NonNullable<CustomFlowbiteTheme["button"]> = {
  /* DESIGN.md: disabled is `--bk-ink-disabled`, "visibly inert", and tints are
     "never frame/alpha opacity". Flowbite's own key is `pointer-events-none
     opacity-50`, which left every disabled primary as the brand blue at half
     strength — a dead control still dressed as the primary action (boards
     781:4526 / 784:4287 draw a grey chip). twMerge lets these token utilities
     beat the colour variant's `bg-primary-700 text-white`; the matching global
     `button:disabled { opacity: .5 }` in themes/ux-fixes.css is gone with it. */
  disabled:
    "tw:pointer-events-none tw:cursor-not-allowed tw:opacity-100 " +
    /* `disabled:` variants, not bare utilities: flowbite merges the colour
       variant AFTER this key, so a bare `tw:bg-*` here loses to
       `bg-primary-700` (measured — the CTA stayed brand blue). The pseudo-class
       form wins on specificity whatever the merge order. */
    "tw:disabled:bg-[var(--bk-bg-subtle)] tw:disabled:text-[var(--bk-ink-muted)] tw:disabled:border-transparent tw:disabled:shadow-none",
  color: {
    link:
      "tw:min-h-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 " +
      "tw:text-[var(--bk-accent-text)] tw:shadow-none tw:enabled:hover:bg-transparent tw:enabled:hover:underline " +
      "tw:focus:ring-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]",
    ghost:
      "tw:border tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] " +
      "tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:enabled:hover:text-[var(--bk-ink)] " +
      "tw:focus:ring-0 tw:focus:[box-shadow:var(--bk-shadow-focus)]",
  },
};
