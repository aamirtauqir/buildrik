/**
 * ColorInput - Color picker with text input
 * Handles both hex colors and CSS keywords (inherit, transparent, currentColor)
 * Swatch click opens TokenPickerPopover — shows design-system color tokens +
 * a "Custom" tab for raw hex/CSS value entry.
 * @license BSD-3-Clause
 */

import { X } from "lucide-react";
import * as React from "react";
import { ColorSwatch } from "../../../../shared/ui/ColorSwatch";
import { Popover } from "../../../../shared/ui/Popover";
import { useColorTokens } from "../../../../features/design-system/state/useColorTokens";
import { DEFAULT_TOKENS } from "../../../../features/design-system/constants";
import { TokenPickerPopover } from "../TokenPickerPopover";
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
  const [isRowHovered, setIsRowHovered] = React.useState(false);

  const displayValue = isValidHexColor(value) ? value : "#000000";
  const showReset = !!value && isRowHovered;

  // Pull color tokens from the design-system. DEFAULT_TOKENS is the SSOT for
  // the initial seed — same source the Design tab uses.
  const { tokens: colorTokens } = useColorTokens(DEFAULT_TOKENS);
  const tokenEntries = colorTokens.map((t) => ({ id: t.id, name: t.name, value: t.value }));

  return (
    <div
      style={{ ...baseStyles.row, position: "relative" }}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
      <label style={baseStyles.label}>{label}</label>
      <div style={{ display: "flex", gap: 8, flex: 1, alignItems: "center" }}>
        {/* Swatch opens TokenPickerPopover — token list + custom tab */}
        <Popover
          triggerOn="click"
          position="bottom"
          trigger={
            <ColorSwatch
              color={displayValue}
              size="sm"
              onClick={() => {}}
              style={{
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                opacity: isKeyword ? 0.5 : 1,
              }}
            />
          }
          content={
            <TokenPickerPopover
              tokens={tokenEntries}
              currentValue={value}
              onSelect={(_tokenId, tokenValue) => onChange(tokenValue)}
              onCustomValue={onChange}
            />
          }
        />

        {/* Text Input for direct editing — wrapped so the reset × can sit
            inside its right edge without overlapping the keyword badge. */}
        <div style={{ position: "relative", flex: 1, display: "flex" }}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            style={{
              ...baseStyles.input,
              flex: 1,
              // Leave room for the reset × so it doesn't sit on top of text.
              paddingRight: showReset ? 22 : undefined,
            }}
          />
          {showReset && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              aria-label={`Reset ${label}`}
              title={`Reset ${label}`}
              style={{
                position: "absolute",
                right: 4,
                top: "50%",
                transform: "translateY(-50%)",
                width: 18,
                height: 18,
                padding: 0,
                background: "rgba(0,0,0,0.3)",
                border: "none",
                borderRadius: 4,
                color: "var(--aqb-text-tertiary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={11} aria-hidden="true" />
            </button>
          )}
        </div>

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
