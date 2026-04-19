/**
 * Aquibra Number Field Component
 * Premium styled number input with stepper controls
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface NumberFieldProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  units?: string[];
  onUnitChange?: (unit: string) => void;
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
  unit = "px",
  units = ["px", "%", "em", "rem", "vw", "vh", "auto"],
  onUnitChange,
  disabled = false,
  error,
  hint,
  id,
}) => {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const [localValue, setLocalValue] = React.useState(value.toString());

  React.useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange?.(num);
    }
  };

  const increment = () => {
    const newVal = Math.min(max ?? Infinity, value + step);
    onChange?.(newVal);
  };

  const decrement = (multiplier = 1) => {
    const delta = step * multiplier;
    const newVal = Math.max(min ?? -Infinity, value - delta);
    onChange?.(newVal);
  };

  const canDecrement = !(min !== undefined && value <= min);
  const canIncrement = !(max !== undefined && value >= max);

  // Handle keyboard arrow keys for increment/decrement
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (canIncrement && !disabled) {
        // Shift+Arrow = 10x step
        const multiplier = e.shiftKey ? 10 : 1;
        const delta = step * multiplier;
        const newVal = Math.min(max ?? Infinity, value + delta);
        onChange?.(newVal);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (canDecrement && !disabled) {
        const multiplier = e.shiftKey ? 10 : 1;
        decrement(multiplier);
      }
    }
  };

  return (
    <div className="buildrick-field buildrick-number-field">
      {label && (
        <label htmlFor={fieldId} className="buildrick-field-label">
          {label}
        </label>
      )}
      <div className="buildrick-number-row">
        <div className={`buildrick-number-stepper ${error ? "has-error" : ""}`}>
          <button
            type="button"
            onClick={() => decrement()}
            disabled={disabled || !canDecrement}
            className="buildrick-number-btn buildrick-number-btn-dec"
            aria-label="Decrease value"
            tabIndex={-1}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />
            </svg>
          </button>
          <input
            type="text"
            id={fieldId}
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="buildrick-number-input"
            aria-invalid={error ? "true" : undefined}
            inputMode="decimal"
          />
          <button
            type="button"
            onClick={increment}
            disabled={disabled || !canIncrement}
            className="buildrick-number-btn buildrick-number-btn-inc"
            aria-label="Increase value"
            tabIndex={-1}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        {units.length > 0 && (
          <select
            value={unit}
            onChange={(e) => onUnitChange?.(e.target.value)}
            disabled={disabled}
            className="buildrick-input buildrick-input-sm buildrick-number-unit"
            aria-label="Unit"
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && (
        <span className="buildrick-field-error" role="alert">
          {error}
        </span>
      )}
      {hint && !error && <span className="buildrick-field-hint">{hint}</span>}
    </div>
  );
};

export default NumberField;
