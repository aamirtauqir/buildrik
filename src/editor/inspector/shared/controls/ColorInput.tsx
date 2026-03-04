/**
 * ColorInput - Color picker with text input
 * Handles both hex colors and CSS keywords (inherit, transparent, currentColor)
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ColorSwatch, ColorSwatchGroup } from "../../../../shared/ui/ColorSwatch";
import { Popover } from "../../../../shared/ui/Popover";
import { baseStyles } from "./controlStyles";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if value is a valid hex color that can be used in <input type="color">
 */
const isValidHexColor = (val: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val);
};

// Premium Selection Palette (Tailwind-ish + Brand)
const PRESET_COLORS = [
  "#000000",
  "#FFFFFF",
  "#3b82f6",
  "#2563eb", // Blues
  "#ef4444",
  "#dc2626", // Reds
  "#22c55e",
  "#16a34a", // Greens
  "#eab308",
  "#d97706", // Yellows
  "#8b5cf6",
  "#7c3aed", // Purples
  "#ec4899",
  "#db2777", // Pinks
  "#64748b",
  "#94a3b8", // Greys/Slates
];

// ============================================================================
// COLOR INPUT
// ============================================================================

export interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export const ColorInput: React.FC<ColorInputProps> = ({ label, value, onChange }) => {
  const isKeyword = value && !isValidHexColor(value);
  const nativeInputRef = React.useRef<HTMLInputElement>(null);

  const displayValue = isValidHexColor(value) ? value : "#000000";

  return (
    <div style={baseStyles.row}>
      <label style={baseStyles.label}>{label}</label>
      <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
        {/* Instant Popover Picker */}
        <Popover
          triggerOn="click"
          position="bottom"
          trigger={
            <div style={{ position: "relative" }}>
              <ColorSwatch
                color={displayValue}
                size="sm"
                onClick={() => {}} /* Trigger handled by Popover */
                style={{
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  opacity: isKeyword ? 0.5 : 1,
                }}
              />
              {/* Native picker hidden but accessible for 'Custom' fallback */}
              <input
                ref={nativeInputRef}
                type="color"
                value={isValidHexColor(value) ? value : "#000000"}
                onChange={(e) => onChange(e.target.value)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 0,
                  height: 0,
                  opacity: 0,
                  visibility: "hidden",
                }}
              />
            </div>
          }
          content={
            <div style={{ width: 232, padding: 4 }}>
              <div
                style={{
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--aqb-border)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--aqb-text-secondary)",
                    marginBottom: 8,
                    paddingLeft: 4,
                  }}
                >
                  QUICK COLORS
                </div>
                <ColorSwatchGroup
                  colors={PRESET_COLORS}
                  selectedColor={value}
                  onSelect={onChange}
                  size="sm"
                  style={{ gap: 8, justifyContent: "flex-start" }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  onClick={() => nativeInputRef.current?.click()}
                  style={{
                    flex: 1,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--aqb-text-primary)",
                    background: "var(--aqb-surface-3, rgba(255,255,255,0.05))",
                    borderRadius: "var(--aqb-radius-sm)",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--aqb-surface-4, rgba(255,255,255,0.1))")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "var(--aqb-surface-3, rgba(255,255,255,0.05))")
                  }
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background:
                        "conic-gradient(red, orange, yellow, green, blue, indigo, violet, red)",
                    }}
                  />
                  Custom...
                </div>
              </div>
            </div>
          }
        />

        {/* Text Input for direct editing */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          style={{ ...baseStyles.input, flex: 1 }}
        />

        {isKeyword && (
          <span style={keywordBadgeStyles} title="CSS keyword">
            {value}
          </span>
        )}
      </div>
    </div>
  );
};

/** Style for CSS keyword badge */
const keywordBadgeStyles: React.CSSProperties = {
  fontSize: 12,
  color: "#6c7086",
  background: "rgba(108, 112, 134, 0.15)",
  padding: "2px 6px",
  borderRadius: 3,
  whiteSpace: "nowrap",
  maxWidth: 80,
  overflow: "hidden",
  textOverflow: "ellipsis",
  cursor: "help",
};

export default ColorInput;
