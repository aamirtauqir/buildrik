/**
 * Vibcoder Input wrapper.
 * Renders the `bd-input` class from src/themes/components/atoms/input.css
 * with `--error` BEM modifier.
 *
 * Variant + state union sourced from `vibcoder-variants.mjs atoms/input`,
 * which reports a single `error` modifier and no size variants. Treated
 * here as a state (boolean prop), matching Tag.tsx's pattern of demoting
 * misclassified-variant tokens that semantically act as states.
 *
 * Native HTML attrs (`type`, `name`, `value`, `placeholder`, `onChange`,
 * `disabled`, etc.) pass through via `...rest` per Plan 3 convention 5.
 *
 * Note: input.css ALSO defines `.bd-field` + `.bd-stepper` (deprecated
 * field wrapper + numeric stepper composite). Those are out of scope for
 * this atom — they re-port as separate primitives or molecules later.
 *
 * @license BSD-3-Clause
 */
import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className, ...rest }, ref) => {
    const classes = [
      "bd-input",
      error && "bd-input--error",
      className,
    ].filter(Boolean).join(" ");
    return (
      <input
        ref={ref}
        className={classes}
        aria-invalid={error || undefined}
        {...rest}
      />
    );
  }
);
Input.displayName = "Input";
