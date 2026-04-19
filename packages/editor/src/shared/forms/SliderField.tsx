/**
 * Aquibra Slider Field Component
 * Premium styled range slider
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface SliderFieldProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  disabled?: boolean;
  marks?: { value: number; label: string }[];
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
  showValue = true,
  disabled = false,
  marks,
  unit = "",
  id,
}) => {
  const generatedId = React.useId();
  const sliderId = id || generatedId;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="buildrick-slider-field" style={{ opacity: disabled ? 0.5 : 1 }}>
      {(label || showValue) && (
        <div className="buildrick-slider-header">
          {label && (
            <label htmlFor={sliderId} className="buildrick-field-label">
              {label}
            </label>
          )}
          {showValue && (
            <span className="buildrick-slider-value">
              {value}
              {unit}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        id={sliderId}
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="buildrick-slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value}${unit}`}
        style={{
          background: `linear-gradient(to right, var(--buildrick-accent) 0%, var(--buildrick-accent) ${percentage}%, var(--buildrick-bg-input) ${percentage}%, var(--buildrick-bg-input) 100%)`,
        }}
      />
      {marks && marks.length > 0 && (
        <div className="buildrick-slider-marks">
          {marks.map((mark) => (
            <button
              key={mark.value}
              type="button"
              className="buildrick-slider-mark"
              onClick={() => !disabled && onChange?.(mark.value)}
              disabled={disabled}
            >
              {mark.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SliderField;
