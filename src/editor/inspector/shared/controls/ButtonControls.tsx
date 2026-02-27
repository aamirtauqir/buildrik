/**
 * Button Controls for Pro Inspector
 * ButtonGroup, CompactButtonGroup
 * @license BSD-3-Clause
 */

import * as React from "react";
import { baseStyles } from "./controlStyles";

// ============================================================================
// BUTTON GROUP
// ============================================================================

export interface ButtonGroupProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon?: string }[];
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ label, value, onChange, options }) => {
  return (
    <div style={baseStyles.row}>
      {label && <label style={baseStyles.label}>{label}</label>}
      <div style={{ ...baseStyles.buttonGroup, flex: label ? 1 : undefined }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            style={baseStyles.buttonGroupItem(value === opt.value)}
            onClick={() => onChange(opt.value)}
            title={opt.label}
          >
            {opt.icon || opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPACT BUTTON GROUP (small toggle buttons in a row)
// ============================================================================

export interface CompactButtonGroupProps {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  labelWidth?: number;
}

export const CompactButtonGroup: React.FC<CompactButtonGroupProps> = ({
  label,
  value,
  options,
  onChange,
  labelWidth = 50,
}) => {
  const compactBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "6px 4px",
    background: active ? "rgba(0,115,230,0.2)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid rgba(0,115,230,0.3)" : "1px solid transparent",
    borderRadius: 4,
    color: active ? "#0073E6" : "#71717a",
    fontSize: 9,
    fontWeight: 500,
    cursor: "pointer",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
      }}
    >
      {label && (
        <span
          style={{
            fontSize: 10,
            color: "#71717a",
            fontWeight: 500,
            minWidth: labelWidth,
          }}
        >
          {label}
        </span>
      )}
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            style={compactBtnStyle(value === opt.value)}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};
