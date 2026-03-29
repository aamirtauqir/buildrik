/**
 * Constraint Control - Fixed / Fill / Hug size controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { constraintBtnStyle, fixedInputStyle } from "./styles";

// ============================================================================
// TYPES
// ============================================================================

type ConstraintType = "fixed" | "fill" | "hug";

export interface ConstraintControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ConstraintControl: React.FC<ConstraintControlProps> = ({ label, value, onChange }) => {
  // Determine current constraint type based on CSS value
  const getConstraintType = (): ConstraintType => {
    if (value === "100%" || value === "-webkit-fill-available") return "fill";
    if (value === "auto" || value === "fit-content" || value === "max-content") return "hug";
    return "fixed";
  };

  const currentType = getConstraintType();
  const isWidth = label.toLowerCase() === "width";

  const handleConstraintChange = (type: ConstraintType) => {
    switch (type) {
      case "fixed":
        // Set to a reasonable default or keep current numeric value
        onChange(value && value !== "auto" && value !== "100%" ? value : "200px");
        break;
      case "fill":
        onChange("100%");
        break;
      case "hug":
        onChange("fit-content");
        break;
    }
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: INSPECTOR_TOKENS.textTertiary, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {/* Fixed */}
        <button
          style={constraintBtnStyle(currentType === "fixed")}
          onClick={() => handleConstraintChange("fixed")}
          title="Fixed size - element has a specific pixel or unit value"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="10" height="10" rx="1" />
            <line x1="1" y1="8" x2="3" y2="8" />
            <line x1="13" y1="8" x2="15" y2="8" />
          </svg>
          <span>Fixed</span>
        </button>

        {/* Fill */}
        <button
          style={constraintBtnStyle(currentType === "fill")}
          onClick={() => handleConstraintChange("fill")}
          title="Fill - element expands to fill available space (100%)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="4" width="12" height="8" rx="1" />
            <line x1="4" y1="8" x2="1" y2="8" strokeLinecap="round" />
            <line x1="12" y1="8" x2="15" y2="8" strokeLinecap="round" />
            <path d="M3 8L5 6.5V9.5L3 8Z" fill="currentColor" />
            <path d="M13 8L11 6.5V9.5L13 8Z" fill="currentColor" />
          </svg>
          <span>Fill</span>
        </button>

        {/* Hug */}
        <button
          style={constraintBtnStyle(currentType === "hug")}
          onClick={() => handleConstraintChange("hug")}
          title="Hug content - element shrinks to fit its content (fit-content)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="5" y="4" width="6" height="8" rx="1" />
            <path d="M3 8L1 6.5V9.5L3 8Z" fill="currentColor" />
            <path d="M13 8L15 6.5V9.5L13 8Z" fill="currentColor" />
            <line x1="3" y1="8" x2="5" y2="8" strokeLinecap="round" />
            <line x1="11" y1="8" x2="13" y2="8" strokeLinecap="round" />
          </svg>
          <span>Hug</span>
        </button>
      </div>

      {/* Fixed value input - only show when in fixed mode */}
      {currentType === "fixed" && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 12, color: INSPECTOR_TOKENS.textMuted, width: 32 }}>
            {isWidth ? "W" : "H"}
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isWidth ? "200px" : "auto"}
            style={fixedInputStyle}
          />
        </div>
      )}
    </div>
  );
};

export default ConstraintControl;
