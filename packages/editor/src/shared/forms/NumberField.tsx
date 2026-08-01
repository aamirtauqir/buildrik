/**
 * NumberField — labelled numeric input.
 * Internal: composes ui <FormField> + flowbite's <TextInput type="number">.
 *
 * The vibcoder-era −/+ stepper buttons are gone (the Figma design has no
 * stepper); the native number input keeps ArrowUp/ArrowDown stepping.
 * `unit` renders as a display-only suffix.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { FormField, TextInput } from "@/editor/chrome-ui";

export interface NumberFieldProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value = 0,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false,
  error,
  hint,
  id,
}) => {
  const clamp = (n: number) => {
    if (min !== undefined && n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
  };

  const renderInput = (extra?: {
    id: string;
    "aria-describedby": string | undefined;
    "aria-invalid": true | undefined;
  }) => {
    const input = (
      <TextInput
        id={id}
        {...extra}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange?.(clamp(n));
        }}
      />
    );
    if (!unit) return input;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        {input}
        <span style={{ fontSize: 12, color: "var(--bk-ink-muted)" }} aria-hidden="true">
          {unit}
        </span>
      </span>
    );
  };

  if (!label && !error && !hint) {
    return renderInput();
  }

  return (
    <FormField label={label ?? ""} hint={hint} error={error}>
      {(wiring) => renderInput(wiring)}
    </FormField>
  );
};

export default NumberField;
