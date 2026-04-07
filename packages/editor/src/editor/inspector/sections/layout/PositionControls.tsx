/**
 * Position Controls - Position mode selection and offset inputs
 * @license BSD-3-Clause
 */

import * as React from "react";
import { HelpTooltip } from "../../../../shared/ui/HelpTooltip";
import { InputRow } from "../../shared/controls";
import { baseStyles, INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { PositionPreview } from "./previews";
import { cardBtn, positionOffsetContainerStyle, positionOffsetBoxStyle } from "./styles";

// ============================================================================
// TYPES
// ============================================================================

export interface PositionControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  propertyStates?: Record<
    string,
    { hidden?: boolean; disabled?: boolean; reason?: string; isOverridden?: boolean }
  >;
}

// ============================================================================
// POSITION OPTIONS
// ============================================================================

const POSITION_OPTIONS = [
  { value: "static", label: "Auto", tooltip: "Default — follows normal flow" },
  { value: "relative", label: "Rel", tooltip: "Offset relative to its normal position" },
  { value: "absolute", label: "Abs", tooltip: "Positioned relative to nearest parent" },
  { value: "fixed", label: "Fixed", tooltip: "Pinned to the viewport — stays on scroll" },
  { value: "sticky", label: "Sticky", tooltip: "Sticks to edge when you scroll past it" },
] as const;

// ============================================================================
// SHARED STYLES
// ============================================================================

const { input: inputStyle } = baseStyles;

// ============================================================================
// COMPONENT
// ============================================================================

export const PositionControls: React.FC<PositionControlsProps> = ({
  styles,
  onChange,
  propertyStates = {},
}) => {
  const hasPosition = styles.position && styles.position !== "static";
  const disabled = (prop: string) => propertyStates[prop]?.disabled;
  const reason = (prop: string) => propertyStates[prop]?.reason;

  return (
    <>
      {/* Section label with help tooltip */}
      <div
        style={{
          fontSize: 12,
          color: INSPECTOR_TOKENS.textTertiary,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
        }}
      >
        Position
        <HelpTooltip
          content="Static: normal flow. Relative: offset from normal position. Absolute: positioned relative to nearest positioned parent. Fixed: stays in viewport. Sticky: sticks when scrolling past."
          position="right"
        />
      </div>

      {/* Position mode buttons */}
      <div
        role="group"
        aria-label="Position type"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 3,
          marginBottom: 8,
        }}
      >
        {POSITION_OPTIONS.map((option) => (
          <button
            key={option.value}
            style={{
              ...cardBtn(styles.position === option.value),
              minHeight: 30,
              padding: "4px 3px",
            }}
            onClick={() => onChange("position", option.value)}
            title={option.tooltip}
            aria-pressed={styles.position === option.value}
            aria-label={option.tooltip}
          >
            <PositionPreview type={option.value} />
            <span style={{ fontSize: 9 }}>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Position offset controls */}
      {hasPosition && (
        <PositionOffsetControls
          styles={styles}
          onChange={onChange}
          inputStyle={inputStyle}
          disabled={disabled}
          reason={reason}
          propertyStates={propertyStates}
        />
      )}
    </>
  );
};

// ============================================================================
// POSITION OFFSET CONTROLS (sub-component)
// ============================================================================

interface PositionOffsetControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  inputStyle: React.CSSProperties;
  disabled: (prop: string) => boolean | undefined;
  reason: (prop: string) => string | undefined;
  propertyStates?: Record<
    string,
    { hidden?: boolean; disabled?: boolean; reason?: string; isOverridden?: boolean }
  >;
}

const PositionOffsetControls: React.FC<PositionOffsetControlsProps> = ({
  styles,
  onChange,
  inputStyle,
  disabled,
  reason,
  propertyStates = {},
}) => {
  const offsetInputStyle = (prop: string): React.CSSProperties => ({
    ...inputStyle,
    width: 50,
    textAlign: "center" as const,
    padding: "4px",
    opacity: disabled(prop) ? 0.5 : 1,
  });

  return (
    <div style={positionOffsetContainerStyle}>
      <div style={{ fontSize: 12, color: INSPECTOR_TOKENS.textMuted, marginBottom: 6 }}>
        Position Offset
      </div>

      {/* Visual position box */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gridTemplateRows: "auto auto auto",
          gap: 4,
          alignItems: "center",
          justifyItems: "center",
          marginBottom: 8,
        }}
      >
        {/* Top */}
        <div />
        <input
          type="text"
          value={styles.top || ""}
          onChange={(e) => onChange("top", e.target.value)}
          placeholder="top"
          style={offsetInputStyle("top")}
          disabled={disabled("top")}
          title={reason("top")}
        />
        <div />

        {/* Left - Box - Right */}
        <input
          type="text"
          value={styles.left || ""}
          onChange={(e) => onChange("left", e.target.value)}
          placeholder="left"
          style={offsetInputStyle("left")}
          disabled={disabled("left")}
          title={reason("left")}
        />
        <div style={positionOffsetBoxStyle} />
        <input
          type="text"
          value={styles.right || ""}
          onChange={(e) => onChange("right", e.target.value)}
          placeholder="right"
          style={offsetInputStyle("right")}
          disabled={disabled("right")}
          title={reason("right")}
        />

        {/* Bottom */}
        <div />
        <input
          type="text"
          value={styles.bottom || ""}
          onChange={(e) => onChange("bottom", e.target.value)}
          placeholder="bottom"
          style={offsetInputStyle("bottom")}
          disabled={disabled("bottom")}
          title={reason("bottom")}
        />
        <div />
      </div>

      {/* Z-Index */}
      <div style={{ marginTop: 8 }}>
        <InputRow
          label="Z-Index"
          value={styles["z-index"] || ""}
          onChange={(v) => onChange("z-index", v)}
          type="number"
          placeholder="auto"
          helperText="Controls the vertical stack order"
          isOverridden={propertyStates["z-index"]?.isOverridden}
        />
      </div>
    </div>
  );
};

export default PositionControls;
