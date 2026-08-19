/**
 * Slider Controls — SliderInput, RangeSlider. Ported to .bdi-row-ctrl with
 * numeric value display on the right.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextInput } from "@/editor/chrome-ui";
// ============================================================================
// SLIDER INPUT
// ============================================================================

export interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const sliderStyle: React.CSSProperties = {
  flex: 1,
  height: 4,
  background: "var(--bk-border-medium, var(--bk-border-medium))",
  borderRadius: 2,
  appearance: "none",
  cursor: "pointer",
};

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
}) => {
  /* The row printed its label and never tied it to the control, so every
     slider in the inspector announced itself as an unnamed "slider" — 8 of
     them, measured in the running editor. `htmlFor` also makes the visible
     label a click target, which a bare <label> never was. */
  const id = React.useId();
  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb" htmlFor={id}>{label}</label>
      <div className="bdi-row-content">
        <TextInput
          id={id}
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          style={sliderStyle}
        />
        <span
          style={{
            font: "500 11px var(--bk-font-ui)",
            color: "var(--bk-ink-muted)",
            minWidth: 32,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
          {unit}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// RANGE SLIDER
// ============================================================================

export interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  labelWidth?: number;
  valueWidth?: number;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
}) => {
  /* The row printed its label and never tied it to the control, so every
     slider in the inspector announced itself as an unnamed "slider" — 8 of
     them, measured in the running editor. `htmlFor` also makes the visible
     label a click target, which a bare <label> never was. */
  const id = React.useId();
  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb" htmlFor={id}>{label}</label>
      <div className="bdi-row-content">
        <TextInput
          id={id}
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          style={sliderStyle}
        />
        <span
          style={{
            font: "500 11px var(--bk-font-ui)",
            color: "var(--bk-ink-muted)",
            minWidth: 32,
            textAlign: "right",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
          {unit}
        </span>
      </div>
    </div>
  );
};
