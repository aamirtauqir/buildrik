// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled TextInput.
/**
 * Adapter shim — translates legacy TextInput API to vibcoder Input.
 *
 * Filename preserved as `TextInput.tsx` (not `Input.tsx`) so existing
 * consumers and barrel re-exports keep importing from the same path.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   invalid: maps to error={invalid} (vibcoder uses `error` for the
 *            same-meaning state modifier)
 *   inputSize (sm | md | lg): silently dropped — vibcoder Input has no
 *            size variants in vendored CSS. Tracked in plan as a known
 *            visual delta (no production consumer outside legacy tests
 *            sets this prop). Phase 5 cleanup: drop the prop entirely.
 *   className: passthrough
 *   type / value / onChange / placeholder / disabled / readOnly /
 *     name / autoFocus / etc.: native InputHTMLAttributes pass through
 *     via {...rest}
 *
 * Untranslatable: none in active use. Throws-at-render strategy (Phase 4
 * Q4) applies if a future legacy-only prop arrives without a vibcoder
 * mapping.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type InputHTMLAttributes } from "react";
import { Input as VibcoderInput } from "@/editor/shared/vibcoder";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visual size — legacy prop, currently a no-op (vibcoder Input is single-size). */
  inputSize?: "sm" | "md" | "lg";
  /** Show focus ring even without focus (validation error state). */
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ invalid = false, inputSize: _inputSize, type = "text", ...rest }, ref) => {
    return <VibcoderInput ref={ref} type={type} error={invalid} {...rest} />;
  },
);
TextInput.displayName = "TextInput";

export default TextInput;
