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
 * (`bg-gray-50`) is one ramp step off `--bk-bg-card` (#FFFFFF), and its
 * default focus ring/border (`primary-500` / #3F83F8) is not the exact
 * `--bk-accent` (#1A56DB = `primary-700`). `TextInputColors` has no
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

export const BK_TEXT_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: {
    input: {
      colors: {
        gray: "tw:bg-white tw:focus:border-primary-700 tw:focus:ring-primary-700 tw:aria-invalid:border-[var(--bk-error)] tw:aria-invalid:focus:border-[var(--bk-error)] tw:aria-invalid:focus:ring-[var(--bk-error)]",
      },
    },
  },
};
