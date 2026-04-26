/**
 * Vibcoder HelperText wrapper.
 * Renders the `bd-helper-text` atom from
 * src/themes/components/atoms/helper-text.css.
 *
 * Tone union from `vibcoder-variants.mjs atoms/helper-text`:
 *   tones: error, success, warning  (default = virtual muted — omit class)
 *
 * No states, no sizes, no animation — purely presentational. Renders as
 * `<p>` per the upstream HTML demo (helper-text.html lines 19-26).
 *
 * A11y: no `aria-live` by default. Validation messages that appear in
 * response to user action benefit from an `aria-live="polite"` region —
 * caller passes it via ...rest when the helper text is asynchronously
 * inserted. For statically-rendered hints below inputs, no live region
 * is needed (screen readers pick it up via field association).
 *
 * forwardRef targets the `<p>`.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type HelperTextTone = "error" | "success" | "warning";

export interface HelperTextProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: HelperTextTone;
}

export const HelperText = forwardRef<HTMLParagraphElement, HelperTextProps>(
  ({ tone, className, children, ...rest }, ref) => {
    const classes = [
      "bd-helper-text",
      // default (muted) tone has no modifier class
      tone && `bd-helper-text--${tone}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <p ref={ref} className={classes} {...rest}>
        {children}
      </p>
    );
  },
);
HelperText.displayName = "HelperText";
