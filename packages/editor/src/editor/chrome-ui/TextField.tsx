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
 * @license BSD-3-Clause
 */
import React from "react";

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
      className={["bk-input", className].filter(Boolean).join(" ")}
      aria-invalid={error || undefined}
      {...rest}
    />
  );
});
