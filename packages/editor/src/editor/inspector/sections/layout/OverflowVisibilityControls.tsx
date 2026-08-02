/**
 * Overflow & Visibility Controls - Overflow, visibility, float, and clear controls
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  CONTROL_BTN_GROUP,
  CONTROL_LABEL,
  CONTROL_ROW,
  CONTROL_SELECT_WRAP,
  compactBtnClass,
} from "../../shared/controls/controlClasses";
import { MixedValueBadge } from "../../shared/MixedValueBadge";
import { Button, Select } from "@/editor/chrome-ui";
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

/** The X/Y axis glyph, sized to line up with the label gutter's baseline. */
const AXIS_LABEL = "tw:w-3.5 tw:text-xs tw:text-gray-500";

const VISIBILITY_OPTIONS = ["visible", "hidden", "collapse"] as const;
const FLOAT_OPTIONS = ["none", "left", "right"] as const;
const CLEAR_OPTIONS = ["none", "left", "right", "both"] as const;

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
      <div className={CONTROL_ROW}>
        {mixedKeys?.has("overflow") && <MixedValueBadge compact />}
        <div className={CONTROL_BTN_GROUP}>
          {OVERFLOW_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="xs"
              className={compactBtnClass(styles.overflow === option.value)}
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
      <OverflowXYControls styles={styles} onChange={onChange} />
      {/* Box sizing */}
      <div className={CONTROL_ROW}>
        {mixedKeys?.has("box-sizing") && <MixedValueBadge compact />}
        <div className={CONTROL_BTN_GROUP}>
          {BOX_SIZING_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="xs"
              className={compactBtnClass((styles["box-sizing"] || "content-box") === option.value)}
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
}

const OverflowXYControls: React.FC<OverflowXYControlsProps> = ({ styles, onChange }) => (
  <div className="tw:grid tw:grid-cols-2 tw:gap-1.5 tw:mb-2">
    <div className="tw:flex tw:items-center tw:gap-1">
      <span className={AXIS_LABEL}>X</span>
      <div className={CONTROL_SELECT_WRAP}>
        <Select value={styles["overflow-x"] || ""} onChange={(e) => onChange("overflow-x", e.target.value)}>
          <option value="">Default</option>
          <option value="visible">visible</option>
          <option value="hidden">hidden</option>
          <option value="scroll">scroll</option>
          <option value="auto">auto</option>
        </Select>
      </div>
    </div>
    <div className="tw:flex tw:items-center tw:gap-1">
      <span className={AXIS_LABEL}>Y</span>
      <div className={CONTROL_SELECT_WRAP}>
        <Select value={styles["overflow-y"] || ""} onChange={(e) => onChange("overflow-y", e.target.value)}>
          <option value="">Default</option>
          <option value="visible">visible</option>
          <option value="hidden">hidden</option>
          <option value="scroll">scroll</option>
          <option value="auto">auto</option>
        </Select>
      </div>
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
      <div className={CONTROL_ROW}>
        {mixedKeys?.has("visibility") && <MixedValueBadge compact />}
        <label className={CONTROL_LABEL}>Visible</label>
        <div className={CONTROL_BTN_GROUP}>
          {VISIBILITY_OPTIONS.map((val) => (
            <Button
              key={val}
              size="xs"
              className={compactBtnClass(styles.visibility === val)}
              onClick={() => onChange("visibility", val)}
            >
              {val.slice(0, 3)}
            </Button>
          ))}
        </div>
      </div>
      {/* Float */}
      <div className={CONTROL_ROW}>
        {mixedKeys?.has("float") && <MixedValueBadge compact />}
        <label className={CONTROL_LABEL}>Float</label>
        <div className={CONTROL_BTN_GROUP}>
          {FLOAT_OPTIONS.map((val) => (
            <Button
              key={val}
              size="xs"
              className={compactBtnClass(styles.float === val)}
              onClick={() => onChange("float", val)}
            >
              {val}
            </Button>
          ))}
        </div>
      </div>
      {/* Clear */}
      <div className={CONTROL_ROW}>
        {mixedKeys?.has("clear") && <MixedValueBadge compact />}
        <label className={CONTROL_LABEL}>Clear</label>
        <div className={CONTROL_BTN_GROUP}>
          {CLEAR_OPTIONS.map((val) => (
            <Button
              key={val}
              size="xs"
              className={compactBtnClass(styles.clear === val)}
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
