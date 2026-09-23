/**
 * Input → flowbite-react TextInput theme overrides.
 *
 * Same structural gap Select already documented: flowbite's `TextInput`
 * destructures `className` and applies it only to an OUTER wrapper `<div>`
 * (`theme.base = "flex"`) — verified by reading
 * `flowbite-react/dist/components/TextInput/TextInput.js`. The real
 * `<input>` only ever receives classes resolved from
 * `theme.field.input.*`. `className` cannot restyle the input's own
 * border/background/focus-ring; only the per-instance `theme` prop can
 * (same mechanism `selectTheme.ts` / `avatarTone.ts` already established).
 *
 * BK_TEXT_INPUT_THEME — every plain `<Input>` call site in the app needs
 * the identical correction: flowbite's default `color="gray"` background
 * (`bg-gray-50`) is one ramp step off `--bk-bg-card` (`var(--bk-bg-panel)`), and its
 * default focus ring/border (`primary-500` / `var(--bk-blue-500)`) is not the exact
 * `--bk-accent` (`var(--bk-blue-700)` = `primary-700`). `TextInputColors` has no
 * `"blue"` entry the way Checkbox/Radio do (`Pick<FlowbiteColors, "gray" |
 * "info" | "failure" | "warning" | "success">`), so the fix is a
 * `colors.gray` override, not a `color` prop swap — consistent with the
 * BK_SELECT_BASE_THEME / Textarea precedent, which deliberately fixes only
 * color (not `sizes`/geometry) and accepts flowbite's own `p-2.5 text-sm`
 * box as the shape difference for plain form-row controls.
 *
 * The deleted `.bk-input[aria-invalid="true"]` rule only changed
 * `border-color` (no full red-tint background the way flowbite's own
 * `color="failure"` does) — reproduced with Tailwind's built-in
 * `aria-invalid:` variant instead of a `color` prop swap, so every plain
 * call site gets correct error styling for free just by passing
 * `aria-invalid` through (no per-site branching needed). The old CSS had
 * `.bk-input:focus` *before* `.bk-input[aria-invalid="true"]` in source
 * order, so on equal specificity the invalid-state border won even while
 * focused — reproduced exactly with an explicit `aria-invalid:focus:`
 * compound variant (same specificity boost, doesn't depend on Tailwind's
 * internal utility declaration order the way two independent same-specificity
 * classes would).
 *
 * @license BSD-3-Clause
 */
import type { CustomFlowbiteTheme } from "flowbite-react/types";

/*
 * GEOMETRY, added 2026-09-08 (founder call, closing `authority=open:input-fill`).
 *
 * The hold existed because three sources gave three answers: board 149:108 says
 * 32 tall / radius 6 / `--color/border-input`, board 1170:4713 says 42 / radius
 * 4, and this theme shipped 42 / radius 8 (flowbite's own `p-2.5` + `rounded-lg`).
 * 149:108 wins — it draws inputs in their densest real context — which makes
 * this a 10px height change on EVERY text input in the product, not a Content
 * fix. 1170:4713 is now the board that is wrong and needs redrawing.
 *
 * Height is set explicitly rather than derived from padding: flowbite's `p-2.5`
 * is what produced 42, and leaving padding to fight a height is how the
 * `min-h-6`-versus-`h-10` traps in this codebase happen. `py-0` lets the
 * input's own vertical centring place the text inside the 32.
 */
export const BK_TEXT_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: {
    input: {
      /* Split deliberately, and the reason is worth keeping.
         `colors.gray` is REPLACED by this theme, so flowbite's own classes in
         it are gone and anything put here simply wins — which is why the radius
         and the edge colour live in the colour string rather than beside the
         height. `sizes` is only ADDED to, so flowbite's `rounded-lg` in its
         `base` survives and beat a radius set there. Measured, not assumed:
         border-color from `sizes` won while border-radius from the very same
         string lost. */
      sizes: {
        md: "tw:h-8 tw:py-0 tw:text-[13px]",
      },
      colors: {
        gray: "tw:bg-white tw:rounded-md! tw:border-[var(--bk-border-input)] tw:focus:border-primary-700 tw:focus:ring-primary-700 tw:aria-invalid:border-[var(--bk-error)] tw:aria-invalid:focus:border-[var(--bk-error)] tw:aria-invalid:focus:ring-[var(--bk-error)]",
      },
    },
  },
};
