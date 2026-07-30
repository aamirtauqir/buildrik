/**
 * Select → flowbite-react theme overrides.
 *
 * flowbite's `Select` renders the consumer's `className` on an OUTER wrapper
 * `<div>` (`theme.base`), never on the actual `<select>` element — verified
 * by reading `flowbite-react/dist/components/Select/Select.js`: `className`
 * is destructured and applied only to the wrapping div; the `<select>` only
 * ever receives classes resolved from `theme.field.select.*`. That means the
 * ONLY way to change the select's own border/background/focus-ring/padding
 * is the per-instance `theme` prop (same mechanism `avatarTone.ts` already
 * established for `Avatar`) — `className` cannot reach it at all.
 *
 * BK_SELECT_BASE_THEME — every plain form-row `<Select>` in the app needs
 * the identical correction: flowbite's default `color="gray"` background
 * (`bg-gray-50`) is one ramp step off `--bk-bg-card` (#FFFFFF), and its
 * default focus ring/border (`primary-500` / #3F83F8) is not the exact
 * `--bk-accent` (#1A56DB = `primary-700`/`blue-700`). `SelectColors` has no
 * "blue" entry the way Checkbox/Radio do (`Pick<FlowbiteColors, "gray" |
 * "info" | "failure" | "warning" | "success">`), so the fix has to be a
 * `colors.gray` override, not a `color` prop swap. Verified empirically
 * (throwaway render + className probe, not just spec-read) that overriding
 * only `field.select.colors.gray` correctly drops the conflicting
 * `bg-gray-50`/`focus:border-primary-500`/`focus:ring-primary-500` classes
 * via flowbite's own `twMerge`-based theme resolution — same identical fix,
 * same identical reason, at every default-styled call site (CLAUDE.md rule
 * 3: same intent, same rules → one shared source, not inlined N times).
 *
 * BK_SELECT_BARE_UNIT_THEME / BK_SELECT_BARE_VALUE_THEME — the 2
 * `InputControls.tsx` sites (`.bdi-u` unit select, `.bdi-ddn .bdi-v` type
 * select) embed the select inside custom pill/chip chrome that supplies its
 * own border/background/padding via a CSS class landing on that same outer
 * div (still works — `.bdi-fld .bdi-u` / `.bdi-ddn .bdi-v` are descendant
 * selectors, indifferent to element type). Both need the actual `<select>`
 * stripped down to fully invisible chrome (no border, no background, no
 * drawn arrow image, no padding) so it doesn't render its own boxed control
 * nested inside the pill — verified empirically that `colors.gray` +
 * `sizes.md` overrides are both required: `sizes.md`'s `p-2.5` only loses
 * to a `p-0` supplied from the *same or later* theme leaf in flowbite's own
 * internal `twMerge(base, colors[c], sizes[s], ...)` call order, so the
 * padding reset has to live in `sizes.md` itself, not `colors.gray`.
 * Residual `border-gray-300` / `focus:border-primary-500` /
 * `focus:ring-primary-500` classes survive in the resolved string (they're
 * *color* utilities; `border-0` / `ring-0` are separate *width* utilities
 * in a different tailwind-merge group) but are inert once width is zeroed —
 * confirmed by reading the merge output, not assumed.
 *
 * Fix round 1 (reviewer finding): `sizes.md`'s own default string is
 * `"p-2.5 text-sm"` (`Select/theme.js`) — the ORIGINAL single bare theme's
 * `sizes.md` override only supplied `tw:p-0`, which knocks out `p-2.5`
 * (same padding conflict-group) but does nothing to `text-sm`, because
 * `text-inherit` (the color-reset class living in `colors.gray`) is a
 * *text-color* utility, not a *font-size* utility — they only share the
 * `text-` prefix cosmetically, tailwind-merge treats them as unrelated
 * conflict groups, so `text-sm` survives the merge untouched and renders
 * directly on the `<select>` at 14px. Because `className`/`theme` land on
 * flowbite's OUTER wrapper div while `field.select.*` classes land on the
 * real `<select>` (the same structural gap `BK_SELECT_BASE_THEME` documents
 * above), the ambient 9.5px-mono / 11px-UI typography carried by
 * `.bdi-fld .bdi-u` / `.bdi-ddn .bdi-v` only reaches the actual `<select>`
 * via ordinary CSS *inheritance* from that wrapper div — and an element's
 * own directly-declared value for a property (`text-sm`'s `font-size`)
 * always wins over an inherited one, independent of selector specificity or
 * cascade-layer order. Also: `preflight` is intentionally absent from this
 * package's Tailwind build (`tw.css:1`, spec §4.1 canvas-collision reason),
 * so there is no `font-family: inherit` form-control reset either — the
 * real `<select>` would otherwise fall back to the browser's native form
 * font, not the page's. Both properties need an explicit value in the SAME
 * `sizes.md` merge call, in the site's own font, so they participate in
 * tailwind-merge's real conflict resolution instead of relying on
 * inheritance reaching an element that already declares its own value:
 * `tw:text-[9.5px] tw:[font-family:var(--bk-font-mono)]` (unit select,
 * matching `.bdi-fld .bdi-u`'s `font: 500 9.5px var(--bk-font-mono)`
 * exactly) and `tw:text-[11px] tw:[font-family:var(--bk-font-ui)]` (value
 * select, matching `.bdi-ddn`'s `font: 500 11px var(--bk-font-ui)`, which
 * `.bdi-ddn .bdi-v` itself only reaches via `font: inherit` — same
 * ambient-inheritance intent, now made explicit at the actual `<select>`).
 * Font-*weight* needs no fix: flowbite's Select theme (`base`/`sizes`/
 * `colors`) never declares a `font-weight` utility anywhere, so the ambient
 * 500 continues to reach the select by ordinary inheritance, undisturbed —
 * confirmed by reading `Select/theme.js` in full, not assumed from the
 * font-size finding. Two distinct themes, not one shared bare theme, because
 * the two sites need two different, non-interchangeable font specs — this
 * is CLAUDE.md rule 3 territory in the *other* direction: reusing one
 * theme for both would be forcing a fake shared rule onto two different
 * intents.
 *
 * @license BSD-3-Clause
 */
import type { CustomFlowbiteTheme } from "flowbite-react/types";

export const BK_SELECT_BASE_THEME: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: {
    select: {
      colors: {
        gray: "tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700",
      },
    },
  },
};

const BK_SELECT_BARE_COLORS = "tw:border-0 tw:bg-transparent tw:bg-none tw:shadow-none tw:text-inherit tw:focus:outline-none tw:focus:ring-0 tw:focus:border-0";

/** `.bdi-fld .bdi-u` unit select (e.g. `InputWithUnit`'s "px"/"rem" picker) — 9.5px mono. */
export const BK_SELECT_BARE_UNIT_THEME: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: {
    select: {
      colors: {
        gray: BK_SELECT_BARE_COLORS,
      },
      sizes: {
        md: "tw:p-0 tw:text-[9.5px] tw:[font-family:var(--bk-font-mono)]",
      },
    },
  },
};

/** `.bdi-ddn .bdi-v` value select (e.g. `SelectRow`'s dropdown pill) — 11px UI. */
export const BK_SELECT_BARE_VALUE_THEME: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: {
    select: {
      colors: {
        gray: BK_SELECT_BARE_COLORS,
      },
      sizes: {
        md: "tw:p-0 tw:text-[11px] tw:[font-family:var(--bk-font-ui)]",
      },
    },
  },
};
