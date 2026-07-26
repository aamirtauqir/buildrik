/**
 * Select — Figma component set 14:37 (State).
 * @license BSD-3-Clause
 */
import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={["bk-select", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </select>
  );
});
