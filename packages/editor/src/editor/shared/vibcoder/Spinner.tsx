/**
 * Vibcoder Spinner + StatusDot wrappers.
 * Both atoms ship in the same vendored CSS file:
 *   src/themes/components/atoms/spinner.css → `.bd-spinner`, `.bd-status-dot`
 *
 * Two atoms, one file (mirrors vendor source). Same convention you'd use
 * for sibling atoms that share a CSS file (e.g., `<Form>` + `<Form.Item>`).
 *
 * SPINNER
 *   Variant + size union from `vibcoder-variants.mjs atoms/spinner` (bd-spinner row):
 *     sizes:  sm, lg  (default md = no modifier — base 14px spinner)
 *     no tone variants — color comes from the `border` rule (accent token)
 *
 *   A11y: spinners convey "loading in progress". Defaults to
 *   `role="status"` + `aria-label="Loading"`. Caller can override either
 *   via ...rest.
 *
 * STATUS DOT
 *   Variant union from `vibcoder-variants.mjs atoms/spinner` (bd-status-dot row):
 *     variants: pulse  (state boolean — exposed as `pulse` prop)
 *
 *   Color is owned by the parent — `background: currentColor` in the CSS.
 *   Same compose-don't-repaint convention as `Icon`. Set color on a wrapping
 *   element via inline `style={{ color }}` or a class.
 *
 *   A11y: status dots are decorative companions to text labels (e.g.,
 *   "Connected" with green pulse). Defaults to `aria-hidden="true"`. The
 *   accessible label belongs on the surrounding text.
 *
 * forwardRef on each — caller may want to attach a ref for measurement
 * (tooltip anchoring, presence-pulse coordination).
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type SpinnerSize = "sm" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size, className, ...rest }, ref) => {
    const classes = [
      "bd-spinner",
      // default md (14px) has no modifier class in vendored CSS
      size && `bd-spinner--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <span
        ref={ref}
        role="status"
        aria-label="Loading"
        className={classes}
        {...rest}
      />
    );
  },
);
Spinner.displayName = "Spinner";

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  pulse?: boolean;
}

export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ pulse = false, className, ...rest }, ref) => {
    const classes = [
      "bd-status-dot",
      pulse && "bd-status-dot--pulse",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return <span ref={ref} aria-hidden="true" className={classes} {...rest} />;
  },
);
StatusDot.displayName = "StatusDot";
