/**
 * Slider Controls — SliderInput, RangeSlider. Ported to .bdi-row-ctrl with
 * numeric value display on the right.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Input } from "@/editor/ui";

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
}) => (
  <div className="bdi-row-ctrl">
    <label className="bdi-lb">{label}</label>
    <div className="bdi-row-content">
      <Input
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
}) => (
  <div className="bdi-row-ctrl">
    <label className="bdi-lb">{label}</label>
    <div className="bdi-row-content">
      <Input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
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
