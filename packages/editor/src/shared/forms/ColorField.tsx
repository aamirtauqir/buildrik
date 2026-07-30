/**
 * ColorField — color picker with optional hex input + presets.
 * Internal: uses flowbite's <TextInput> for hex text + native
 * <input type=color> for the swatch picker.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextInput } from "flowbite-react";
import { BK_TEXT_INPUT_THEME } from "@/editor/ui/textInputTheme";

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

const checkerPattern =
  "repeating-conic-gradient(rgba(128,128,128,0.2) 0% 25%, transparent 0% 50%) 50% / 8px 8px";

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

  return (
    <div style={fieldStyle}>
      {label && (
        <label htmlFor={fieldId} style={labelStyle}>
          {label}
        </label>
      )}
      <div style={rowStyle}>
        <div style={swatchWrapperStyle}>
          <input
            type="color"
            id={fieldId}
            value={isTransparent ? "#ffffff" : localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            style={nativePickerStyle}
            aria-label={label || "Color picker"}
          />
          <div
            style={{
              ...swatchStyle,
              background: isTransparent ? checkerPattern : localValue,
            }}
          />
        </div>
        {showInput && (
          <TextInput
            theme={BK_TEXT_INPUT_THEME}
            type="text"
            value={localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            disabled={disabled}
            placeholder="#000000"
            aria-label="Color value"
          />
        )}
      </div>
      {presets.length > 0 && (
        <div style={presetsStyle}>
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
                style={{
                  ...presetButtonStyle,
                  background: isTransparentPreset ? checkerPattern : color,
                  outline: isSelected ? "2px solid var(--bk-accent)" : "none",
                  outlineOffset: 2,
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

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: "var(--bk-text-12)",
  fontWeight: 500,
  color: "var(--bk-ink-soft)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const swatchWrapperStyle: React.CSSProperties = {
  position: "relative",
  width: 32,
  height: 32,
  flexShrink: 0,
};

const nativePickerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0,
  cursor: "pointer",
};

const swatchStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  pointerEvents: "none",
};

const presetsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(11, 1fr)",
  gap: 4,
  marginTop: 4,
};

const presetButtonStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  border: "1px solid var(--bk-border)",
  borderRadius: 4,
  cursor: "pointer",
  padding: 0,
};

export default ColorField;
