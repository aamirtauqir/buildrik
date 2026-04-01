/**
 * Slider Controls for Pro Inspector
 * SliderInput, RangeSlider
 * @license BSD-3-Clause
 */

import * as React from "react";
import { baseStyles } from "./controlStyles";

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

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
}) => {
  return (
    <div style={baseStyles.row}>
      <label style={baseStyles.label}>{label}</label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        style={baseStyles.slider}
      />
      <span
        style={{
          fontSize: 12,
          color: "#71717a",
          minWidth: 40,
          textAlign: "right" as const,
        }}
      >
        {value}
        {unit}
      </span>
    </div>
  );
};

// ============================================================================
// RANGE SLIDER (inline slider with label and value display)
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
  labelWidth = 70,
  valueWidth = 35,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 12, color: "#71717a", minWidth: labelWidth }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1 }}
      />
      <span style={{ fontSize: 12, color: "#71717a", minWidth: valueWidth }}>
        {value}
        {unit}
      </span>
    </div>
  );
};
