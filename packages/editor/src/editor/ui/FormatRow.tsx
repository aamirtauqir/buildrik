/**
 * FormatRow — Figma 249:6 (Selected).
 *
 * A pickable option with a description — export formats, publish targets.
 * It is a real radio so arrow keys move between options and the group is
 * announced as a group; the visual is the row, the semantics are the input.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Radio } from "flowbite-react";

export interface FormatRowProps extends Omit<React.HTMLAttributes<HTMLLabelElement>, "onChange"> {
  name: string;
  value: string;
  title: string;
  description?: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  trailing?: React.ReactNode;
}

export function FormatRow({
  name, value, title, description, checked, onChange, trailing, className, ...rest
}: FormatRowProps) {
  return (
    <label
      className={["bk-row", "bk-format-row", className].filter(Boolean).join(" ")}
      aria-checked={Boolean(checked)}
      {...rest}
    >
      <Radio
        color="blue"
        className="tw:bg-white"
        name={name}
        value={value}
        checked={Boolean(checked)}
        onChange={() => onChange?.(value)}
      />
      <span className="bk-format-row__body">
        <span>{title}</span>
        {description ? <span className="bk-format-row__desc">{description}</span> : null}
      </span>
      {trailing}
    </label>
  );
}
