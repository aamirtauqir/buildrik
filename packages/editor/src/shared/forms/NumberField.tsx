/**
 * NumberField — labelled numeric stepper.
 * Internal: composes vibcoder <NumericStepper> + <FormField>.
 *
 * Drops the legacy unit-select dropdown from the original L1 wrapper
 * (zero callers used non-empty `units` array — verified Day-1 inventory).
 * `unit` prop now renders as a display-only suffix via NumericStepper's
 * built-in unit cell.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { NumericStepper, FormField } from "@/editor/shared/vibcoder";

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
  const generatedId = React.useId();
  const fieldId = id || generatedId;

  const stepper = (
    <NumericStepper
      id={fieldId}
      value={value}
      onChange={(v) => onChange?.(v)}
      min={min}
      max={max}
      step={step}
      unit={unit && unit !== "" ? unit : undefined}
      disabled={disabled}
      error={!!error}
    />
  );

  if (!label && !error && !hint) {
    return stepper;
  }

  return (
    <FormField
      label={label ?? ""}
      htmlFor={fieldId}
      error={error}
      helper={hint}
      disabled={disabled}
    >
      {stepper}
    </FormField>
  );
};

export default NumberField;
