/**
 * Aquibra Color Field Component
 * Premium styled color picker with presets
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface ColorFieldProps {
  label?: string;
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  showInput?: boolean;
  presets?: string[];
  id?: string;
}

const defaultPresets = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "transparent",
];

export const ColorField: React.FC<ColorFieldProps> = ({
  label,
  value = "#000000",
  onChange,
  disabled = false,
  showInput = true,
  presets = defaultPresets,
  id,
}) => {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleColorChange = (color: string) => {
    setLocalValue(color);
    onChange?.(color);
  };

  const isTransparent = localValue === "transparent";
  const checkerPattern =
    "repeating-conic-gradient(rgba(128,128,128,0.2) 0% 25%, transparent 0% 50%) 50% / 8px 8px";

  return (
    <div className="aqb-field aqb-color-field">
      {label && (
        <label htmlFor={fieldId} className="aqb-field-label">
          {label}
        </label>
      )}
      <div className="aqb-color-input-row">
        <div className="aqb-color-swatch-wrapper">
          <input
            type="color"
            id={fieldId}
            value={isTransparent ? "#ffffff" : localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            className="aqb-color-native"
            aria-label={label || "Color picker"}
          />
          <div
            className="aqb-color-swatch"
            style={{
              background: isTransparent ? checkerPattern : localValue,
            }}
          />
        </div>
        {showInput && (
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            placeholder="#000000"
            className="aqb-input"
            aria-label="Color value"
          />
        )}
      </div>
      {presets.length > 0 && (
        <div className="aqb-color-presets">
          {presets.map((color) => {
            const isSelected = localValue === color;
            const isTransparentPreset = color === "transparent";
            return (
              <button
                key={color}
                type="button"
                onClick={() => handleColorChange(color)}
                disabled={disabled}
                title={color}
                className={`aqb-color-preset ${isSelected ? "is-selected" : ""}`}
                style={{
                  background: isTransparentPreset ? checkerPattern : color,
                }}
                aria-label={`Select color ${color}`}
                aria-pressed={isSelected}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ColorField;
