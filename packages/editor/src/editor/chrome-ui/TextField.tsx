/**
 * TextField — the one sanctioned raw-`<input>` owner outside flowbite.
 *
 * flowbite-react's `TextInput` structurally cannot route a consumer
 * `className` to the real `<input>` (it lands on an outer wrapper `<div>`
 * only — see `src/editor/ui/textInputTheme.ts`'s header for the full
 * finding). A real slice of call sites in this codebase supply a bespoke,
 * fully self-sufficient local CSS class for a control that doesn't look
 * like a form text field at all (search bars, inline-rename fields, range
 * sliders drawn as flat tracks, hex swatches) — `TextInput`'s wrapper-div
 * gap would strand that class on the wrong element. Gate 24 (zero inline
 * `<button>/<input>/<select>/<textarea>` in chrome) still applies to every
 * other file in `editor/`; this is the one component that's allowed to
 * render the raw element so nobody else has to. Ported verbatim from the
 * deleted `editor/ui/Input.tsx` (same className-merge + aria-invalid +
 * ref-forwarding contract) — this is a relocation, not a redesign.
 *
 * BASE recreates the deleted `editor/ui/ui.css` `.bk-input` block (base
 * box + `::placeholder` + `:focus` ring + `[aria-invalid="true"]` +
 * `:disabled`) as `tw:*` utilities — that CSS was dropped at Task 13 and
 * never ported, which left every plain TextField rendering as an unstyled
 * browser-default `<input>`. Token resolution follows the mapping table in
 * `docs/plans/flowbite-bigbang-inventory.md`: `--bk-border-medium`/
 * `--bk-ink-disabled` → `gray-300` (both `#D1D5DB`), `--bk-bg-card` →
 * `white`, `--bk-ink` → `gray-900`, `--bk-ink-muted` → `gray-500`,
 * `--bk-bg-subtle` → `gray-100`, `--bk-accent` → `primary-700` (exact hex
 * match, same step `textInputTheme.ts` uses); `--bk-error`,
 * `--bk-font-ui`, `--bk-shadow-focus` and the 13px type size have no exact
 * Tailwind/flowbite ramp step so they stay `tw:[var(--bk-*)]`/`tw:[...]`
 * arbitrary values, matching every other T6 port. The old CSS's
 * `.bk-input:focus` rule preceded `.bk-input[aria-invalid="true"]` in
 * source order, so on equal specificity the invalid-state border won even
 * while focused — reproduced with an explicit `aria-invalid:focus:`
 * compound variant (genuinely higher specificity, not source-order
 * dependent), the same technique `textInputTheme.ts` already used for the
 * sibling flowbite `TextInput`. `bk-input` itself stays as a marker
 * className with no CSS rule of its own backing it — same "vestigial
 * hook" precedent `Skeleton.tsx` cites for `bk-skeleton`.
 *
 * @license BSD-3-Clause
 */
import React from "react";

const BASE =
  "tw:h-9 tw:w-full tw:px-3 tw:py-0 tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white " +
  "tw:text-gray-900 tw:[font-family:var(--bk-font-ui)] tw:text-[13px] " +
  "tw:[transition:var(--bk-transition-fast)] tw:placeholder:text-gray-500 " +
  "tw:focus:outline-none tw:focus:border-primary-700 tw:focus:[box-shadow:var(--bk-shadow-focus)] " +
  "tw:aria-invalid:border-[var(--bk-error)] tw:aria-invalid:focus:border-[var(--bk-error)] " +
  "tw:disabled:bg-gray-100 tw:disabled:text-gray-300 tw:disabled:cursor-not-allowed";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { error, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={["bk-input", BASE, className].filter(Boolean).join(" ")}
      aria-invalid={error || undefined}
      {...rest}
    />
  );
});
