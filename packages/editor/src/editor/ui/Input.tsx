/**
 * Input — Figma component set 10:16 (State).
 * error is a prop; focus is a CSS state.
 * @license BSD-3-Clause
 */
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
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
