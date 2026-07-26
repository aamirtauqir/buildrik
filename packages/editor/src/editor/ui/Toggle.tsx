/**
 * Toggle — Figma component set 14:14 (44×24, State).
 * A checkbox under the hood: it is a two-state control, so screen readers and
 * keyboards get the behaviour for free.
 * @license BSD-3-Clause
 */
import React from "react";

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={["bk-toggle", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});
