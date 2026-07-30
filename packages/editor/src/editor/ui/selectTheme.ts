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
 * BK_SELECT_BARE_THEME — the 2 `InputControls.tsx` sites (`.bdi-u` unit
 * select, `.bdi-ddn .bdi-v` type select) embed the select inside custom
 * pill/chip chrome that supplies its own border/background/padding via a
 * CSS class landing on that same outer div (still works — `.bdi-fld .bdi-u`
 * / `.bdi-ddn .bdi-v` are descendant selectors, indifferent to element
 * type). Both need the actual `<select>` stripped down to fully invisible
 * chrome (no border, no background, no drawn arrow image, no padding) so it
 * doesn't render its own boxed control nested inside the pill — verified
 * empirically that `colors.gray` + `sizes.md` overrides are both required:
 * `sizes.md`'s `p-2.5` only loses to a `p-0` supplied from the *same or
 * later* theme leaf in flowbite's own internal `twMerge(base, colors[c],
 * sizes[s], ...)` call order, so the padding reset has to live in
 * `sizes.md` itself, not `colors.gray`. Residual `border-gray-300` /
 * `focus:border-primary-500` / `focus:ring-primary-500` classes survive in
 * the resolved string (they're *color* utilities; `border-0` / `ring-0` are
 * separate *width* utilities in a different tailwind-merge group) but are
 * inert once width is zeroed — confirmed by reading the merge output, not
 * assumed.
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

export const BK_SELECT_BARE_THEME: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: {
    select: {
      colors: {
        gray: "tw:border-0 tw:bg-transparent tw:bg-none tw:shadow-none tw:text-inherit tw:focus:outline-none tw:focus:ring-0 tw:focus:border-0",
      },
      sizes: {
        md: "tw:p-0",
      },
    },
  },
};
