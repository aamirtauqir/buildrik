/**
 * Radio — Figma component set 14:20 (State).
 * @license BSD-3-Clause
 */
import React from "react";

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} type="radio" className={["bk-radio", className].filter(Boolean).join(" ")} {...rest} />;
});
