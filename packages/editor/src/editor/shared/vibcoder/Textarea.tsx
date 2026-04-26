/**
 * Vibcoder Textarea wrapper.
 * Renders the `bd-textarea` class from src/themes/components/atoms/textarea.css
 * with `--sm|--lg` size and `--error|--fixed` state BEM modifiers.
 *
 * Variant + size + state union sourced from `vibcoder-variants.mjs atoms/textarea`:
 *   sizes: sm, lg  (md is base default — no `bd-textarea--md` rule exists)
 *   variants: error, fixed  (both semantically states, demoted to boolean props
 *     per Tag pattern — variants script doesn't know `fixed` is `resize: none`)
 *
 * @license BSD-3-Clause
 */
import { type TextareaHTMLAttributes, forwardRef } from "react";

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: TextareaSize;
  error?: boolean;
  /** When true, applies `bd-textarea--fixed` (disables resize handle). */
  fixed?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ size = "md", error = false, fixed = false, className, ...rest }, ref) => {
    const classes = [
      "bd-textarea",
      // md is base default — no `bd-textarea--md` rule exists in vendored CSS
      size !== "md" && `bd-textarea--${size}`,
      error && "bd-textarea--error",
      fixed && "bd-textarea--fixed",
      className,
    ].filter(Boolean).join(" ");
    return (
      <textarea
        ref={ref}
        className={classes}
        aria-invalid={error || undefined}
        {...rest}
      />
    );
  }
);
Textarea.displayName = "Textarea";
