/**
 * SliderField — labelled range slider wrapper.
 * Internal: composes vibcoder <Slider> directly.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Slider } from "@/editor/shared/vibcoder";

export interface SliderFieldProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  unit?: string;
  id?: string;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  label,
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  unit,
  id,
}) => (
  <Slider
    id={id}
    label={label}
    value={value}
    onChange={onChange ?? (() => {})}
    min={min}
    max={max}
    step={step}
    disabled={disabled}
    unit={unit}
  />
);

export default SliderField;
