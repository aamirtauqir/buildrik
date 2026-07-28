/**
 * SliderField — labelled range slider.
 * Internal: composes ui <Label> + <Slider>. The ui Slider's `label` prop is
 * aria-only, so the visible label the old vibcoder head row rendered is a
 * real <Label> here; the value readout is the Slider's numeric field.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Label, Slider } from "@/editor/ui";

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
}) => {
  const generatedId = React.useId();
  const sliderId = id || generatedId;

  const slider = (
    <Slider
      id={sliderId}
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

  if (!label) return slider;

  return (
    <div>
      <Label htmlFor={sliderId}>{label}</Label>
      {slider}
    </div>
  );
};

export default SliderField;
