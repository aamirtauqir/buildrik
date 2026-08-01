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

/** FormatRow never went through the Row component — it borrowed `.bk-row` +
 *  `.bk-format-row` as two CSS classes on its own <label>. Now that
 *  `.bk-row`'s CSS is gone (dissolved into Row.tsx's own tw:* composition,
 *  this same commit), this is one self-contained class list recreating
 *  both former rules' combined effect — no Row-BASE-vs-override composition
 *  ambiguity here since there's only one static string. */
const BASE =
  "tw:flex tw:items-center tw:gap-3 tw:h-16 tw:px-4 tw:w-full tw:text-left tw:border tw:border-gray-200 " +
  "tw:rounded-lg tw:bg-white tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-gray-900 " +
  "tw:[transition:var(--bk-transition-fast)] " +
  "tw:aria-[checked=true]:border-blue-700 tw:aria-[checked=true]:bg-blue-50";

export function FormatRow({
  name, value, title, description, checked, onChange, trailing, className, ...rest
}: FormatRowProps) {
  return (
    <label
      className={[BASE, className].filter(Boolean).join(" ")}
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
      <span className="tw:flex-1 tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
        <span>{title}</span>
        {description ? <span className="tw:text-gray-500 tw:text-xs">{description}</span> : null}
      </span>
      {trailing}
    </label>
  );
}
