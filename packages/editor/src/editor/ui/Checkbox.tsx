/**
 * Checkbox — Figma component set 12:26 (State).
 * indeterminate is a DOM property, not an attribute, so it is applied via ref.
 * @license BSD-3-Clause
 */
import React from "react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { indeterminate = false, className, ...rest },
  ref,
) {
  const inner = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={(node) => {
        inner.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      type="checkbox"
      className={["bk-checkbox", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
});
