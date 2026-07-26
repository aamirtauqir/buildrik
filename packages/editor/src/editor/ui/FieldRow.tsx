/**
 * FieldRow — no Figma component set.
 *
 * The Inspector's label+control pair. Border, Link, Effects and Grid sections
 * each hand-rolled their own version with different label widths, which is why
 * the Inspector never looked like one panel. One component, one width.
 *
 * `stacked` is for controls that need the full 300px inspector width (textarea,
 * segmented groups) — the label sits above instead of beside.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface FieldRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  stacked?: boolean;
  hint?: string;
}

export function FieldRow({ label, htmlFor, stacked, hint, className, children, ...rest }: FieldRowProps) {
  return (
    <div
      className={["bk-field-row", stacked && "bk-field-row--stacked", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <label className="bk-field-row__label" htmlFor={htmlFor} title={hint}>
        {label}
      </label>
      <div className="bk-field-row__control">{children}</div>
    </div>
  );
}
