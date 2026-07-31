/**
 * Label / HelperText → flowbite-react className overrides.
 *
 * Both apply `className` directly to the real `<label>`/`<p>` (verified by
 * reading `Label.js`/`HelperText.js` — `twMerge(theme.root.base, ...,
 * className)`, no wrapper-div gap the way `TextInput`/`Select` have), so a
 * plain className string is enough — no `theme` prop adapter needed.
 *
 * This package's Tailwind build intentionally omits Preflight (canvas-
 * collision reason, spec §4.1) and — unlike other apps — nothing in this
 * codebase sets a global `body`/`:root` font-family either (every text-
 * bearing rule in `ui.css` sets `font-family: var(--bk-font-ui)` itself,
 * with zero exceptions, confirmed by grep); without an explicit override
 * here, `<label>`/`<p>` would inherit the browser's UA-default font, not
 * ours — a real regression, not a shape difference to accept.
 *
 * BK_LABEL_CLASS — the deleted `.bk-label` was 12px / `--bk-ink-soft`
 * (#4B5563). flowbite's own default is `text-sm font-medium text-gray-900`
 * (14px / #111827 — an exact match to `--bk-ink`, one step darker than what
 * labels here have always used). `font-medium` (500) already matches
 * `--bk-weight-medium` so it's left alone; only size, color, and family are
 * overridden. `text-xs` = 12px = `--bk-text-12` exactly, `gray-600` =
 * #4B5563 = `--bk-ink-soft` exactly — no arbitrary-value needed for either.
 *
 * BK_HELPER_CLASS — the deleted `.bk-helper` was 11px / `--bk-ink-muted`
 * (#6B7280), no margin. flowbite's default `color="gray"` is `mt-2 text-sm
 * text-gray-500` — `gray-500` (#6B7280) already matches `--bk-ink-muted`
 * exactly (no color override needed for the non-error case), but `mt-2`
 * (8px top margin) is new — every real call site already sits inside a
 * `Stack`/flex column that supplies its own gap, so the extra margin would
 * double-space it; neutralized via `mt-0`. `--bk-text-11` (11px) has no
 * default Tailwind step, hence the arbitrary `text-[11px]`.
 *
 * BK_HELPER_ERROR_CLASS — flowbite's `color="failure"` gives `text-red-600`
 * (#DC2626), one step off `--bk-error-text` (#C81E1E) — same
 * arbitrary-value-CSS-var pattern `textInputTheme.ts` already uses for
 * `--bk-error`.
 *
 * @license BSD-3-Clause
 */

export const BK_LABEL_CLASS = "tw:text-xs tw:text-gray-600 tw:[font-family:var(--bk-font-ui)]";

export const BK_HELPER_CLASS = "tw:mt-0 tw:text-[11px] tw:[font-family:var(--bk-font-ui)]";

export const BK_HELPER_ERROR_CLASS = `${BK_HELPER_CLASS} tw:text-[var(--bk-error-text)]`;
