/**
 * Overflow & Visibility Controls - Overflow, visibility, float, and clear controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Select } from "@/editor/ui";
import { baseStyles } from "../../shared/controls/controlStyles";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { Button } from "flowbite-react";

// ============================================================================
// TYPES
// ============================================================================

export interface OverflowVisibilityControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  mixedKeys?: ReadonlySet<string>;
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

const { compactBtn, row: rowStyle, label: labelStyle, input: inputStyle } = baseStyles;

// ============================================================================
// OVERFLOW CONTROLS COMPONENT
// ============================================================================

export const OverflowControls: React.FC<OverflowVisibilityControlsProps> = ({
  styles,
  onChange,
  mixedKeys,
}) => {
  return (
    <>
      {/* Main overflow control */}
      <div style={rowStyle}>
        {mixedKeys?.has("overflow") && <MixedValueBadge compact />}
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {OVERFLOW_OPTIONS.map((option) => (
            <Button
              key={option.value}
              style={compactBtn(styles.overflow === option.value)}
              onClick={() => onChange("overflow", option.value)}
              title={option.tooltip}
              aria-label={option.tooltip}
              aria-pressed={styles.overflow === option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      {/* Overflow X/Y */}
      <OverflowXYControls styles={styles} onChange={onChange} inputStyle={inputStyle} />
      {/* Box sizing */}
      <div style={rowStyle}>
        {mixedKeys?.has("box-sizing") && <MixedValueBadge compact />}
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {BOX_SIZING_OPTIONS.map((option) => (
            <Button
              key={option.value}
              style={compactBtn((styles["box-sizing"] || "content-box") === option.value)}
              onClick={() => onChange("box-sizing", option.value)}
              title={option.tooltip}
              aria-label={option.tooltip}
              aria-pressed={(styles["box-sizing"] || "content-box") === option.value}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

const BOX_SIZING_OPTIONS = [
  { value: "content-box", label: "content", tooltip: "Size excludes padding + border (content-box)" },
  { value: "border-box", label: "border", tooltip: "Size includes padding + border (border-box)" },
];

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
      <span style={{ fontSize: 12, color: "var(--bk-ink-muted)", width: 14 }}>X</span>
      <Select
        value={styles["overflow-x"] || ""}
        onChange={(e) => onChange("overflow-x", e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        <option value="">Default</option>
        <option value="visible">visible</option>
        <option value="hidden">hidden</option>
        <option value="scroll">scroll</option>
        <option value="auto">auto</option>
      </Select>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12, color: "var(--bk-ink-muted)", width: 14 }}>Y</span>
      <Select
        value={styles["overflow-y"] || ""}
        onChange={(e) => onChange("overflow-y", e.target.value)}
        style={{ ...inputStyle, cursor: "pointer" }}
      >
        <option value="">Default</option>
        <option value="visible">visible</option>
        <option value="hidden">hidden</option>
        <option value="scroll">scroll</option>
        <option value="auto">auto</option>
      </Select>
    </div>
  </div>
);

// ============================================================================
// VISIBILITY CONTROLS COMPONENT
// ============================================================================

export const VisibilityFloatControls: React.FC<OverflowVisibilityControlsProps> = ({
  styles,
  onChange,
  mixedKeys,
}) => {
  return (
    <>
      {/* Visibility */}
      <div style={rowStyle}>
        {mixedKeys?.has("visibility") && <MixedValueBadge compact />}
        <label style={labelStyle}>Visible</label>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {VISIBILITY_OPTIONS.map((val) => (
            <Button
              key={val}
              style={compactBtn(styles.visibility === val)}
              onClick={() => onChange("visibility", val)}
            >
              {val.slice(0, 3)}
            </Button>
          ))}
        </div>
      </div>
      {/* Float */}
      <div style={rowStyle}>
        {mixedKeys?.has("float") && <MixedValueBadge compact />}
        <label style={labelStyle}>Float</label>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {FLOAT_OPTIONS.map((val) => (
            <Button
              key={val}
              style={compactBtn(styles.float === val)}
              onClick={() => onChange("float", val)}
            >
              {val}
            </Button>
          ))}
        </div>
      </div>
      {/* Clear */}
      <div style={rowStyle}>
        {mixedKeys?.has("clear") && <MixedValueBadge compact />}
        <label style={labelStyle}>Clear</label>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {CLEAR_OPTIONS.map((val) => (
            <Button
              key={val}
              style={compactBtn(styles.clear === val)}
              onClick={() => onChange("clear", val)}
            >
              {val}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
};

export default OverflowControls;
