/**
 * Overflow & Visibility Controls - Overflow, visibility, float, and clear controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { sharedStyles, INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface OverflowVisibilityControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
}

// ============================================================================
// OVERFLOW OPTIONS
// ============================================================================

const OVERFLOW_OPTIONS = [
  { value: "visible", label: "vis", tooltip: "Content can overflow" },
  { value: "hidden", label: "hid", tooltip: "Clip overflow content" },
  { value: "scroll", label: "scr", tooltip: "Always show scrollbars" },
  { value: "auto", label: "aut", tooltip: "Scrollbars when needed" },
] as const;

const VISIBILITY_OPTIONS = ["visible", "hidden", "collapse"] as const;
const FLOAT_OPTIONS = ["none", "left", "right"] as const;
const CLEAR_OPTIONS = ["none", "left", "right", "both"] as const;

// ============================================================================
// SHARED STYLES
// ============================================================================

const { compactBtn, row: rowStyle, label: labelStyle, input: inputStyle } = sharedStyles;

// ============================================================================
// OVERFLOW CONTROLS COMPONENT
// ============================================================================

export const OverflowControls: React.FC<OverflowVisibilityControlsProps> = ({
  styles,
  onChange,
}) => {
  return (
    <>
      {/* Main overflow control */}
      <div style={rowStyle}>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {OVERFLOW_OPTIONS.map((option) => (
            <button
              key={option.value}
              style={compactBtn(styles.overflow === option.value)}
              onClick={() => onChange("overflow", option.value)}
              title={option.tooltip}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overflow X/Y */}
      <OverflowXYControls styles={styles} onChange={onChange} inputStyle={inputStyle} />
    </>
  );
};

// ============================================================================
// OVERFLOW XY CONTROLS (sub-component)
// ============================================================================

interface OverflowXYControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  inputStyle: React.CSSProperties;
}

const OverflowXYControls: React.FC<OverflowXYControlsProps> = ({
  styles,
  onChange,
  inputStyle,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6,
      marginBottom: 8,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, color: INSPECTOR_TOKENS.textMuted, width: 14 }}>X</span>
      <select
        value={styles["overflow-x"] || ""}
        onChange={(e) => onChange("overflow-x", e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        <option value="">—</option>
        <option value="visible">visible</option>
        <option value="hidden">hidden</option>
        <option value="scroll">scroll</option>
        <option value="auto">auto</option>
      </select>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, color: INSPECTOR_TOKENS.textMuted, width: 14 }}>Y</span>
      <select
        value={styles["overflow-y"] || ""}
        onChange={(e) => onChange("overflow-y", e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        <option value="">—</option>
        <option value="visible">visible</option>
        <option value="hidden">hidden</option>
        <option value="scroll">scroll</option>
        <option value="auto">auto</option>
      </select>
    </div>
  </div>
);

// ============================================================================
// VISIBILITY CONTROLS COMPONENT
// ============================================================================

export const VisibilityFloatControls: React.FC<OverflowVisibilityControlsProps> = ({
  styles,
  onChange,
}) => {
  return (
    <>
      {/* Visibility */}
      <div style={rowStyle}>
        <label style={labelStyle}>Visible</label>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {VISIBILITY_OPTIONS.map((val) => (
            <button
              key={val}
              style={compactBtn(styles.visibility === val)}
              onClick={() => onChange("visibility", val)}
            >
              {val.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Float */}
      <div style={rowStyle}>
        <label style={labelStyle}>Float</label>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {FLOAT_OPTIONS.map((val) => (
            <button
              key={val}
              style={compactBtn(styles.float === val)}
              onClick={() => onChange("float", val)}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      <div style={rowStyle}>
        <label style={labelStyle}>Clear</label>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {CLEAR_OPTIONS.map((val) => (
            <button
              key={val}
              style={compactBtn(styles.clear === val)}
              onClick={() => onChange("clear", val)}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default OverflowControls;
