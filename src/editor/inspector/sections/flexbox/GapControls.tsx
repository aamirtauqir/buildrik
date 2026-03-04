/**
 * GapControls - Gap slider and row/column gap inputs
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { GapSlider } from "./controls";

// ============================================================================
// TYPES
// ============================================================================

export interface GapControlsProps {
  styles: Record<string, string>;
  onChange: (prop: string, val: string) => void;
  disabled: (prop: string) => boolean | undefined;
  inputStyle: React.CSSProperties;
  rowStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GapControls: React.FC<GapControlsProps> = ({
  styles,
  onChange,
  disabled,
  inputStyle,
  rowStyle,
  labelStyle,
}) => (
  <div
    style={{
      marginTop: 8,
      padding: 10,
      background: INSPECTOR_TOKENS.surfaceSubtle,
      borderRadius: 6,
      border: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: INSPECTOR_TOKENS.textTertiary,
        marginBottom: 8,
      }}
    >
      Gap
    </div>
    <div style={rowStyle}>
      <label style={{ ...labelStyle, minWidth: 30 }}>All</label>
      <GapSlider
        value={styles.gap || "0"}
        onChange={(val) => onChange("gap", val)}
        disabled={disabled("gap")}
      />
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginTop: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            fontSize: 12,
            color: INSPECTOR_TOKENS.textMuted,
            width: 24,
          }}
        >
          Row
        </span>
        <input
          type="text"
          value={styles["row-gap"] || ""}
          onChange={(e) => onChange("row-gap", e.target.value)}
          placeholder="0"
          style={{ ...inputStyle, padding: "4px 5px" }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            fontSize: 12,
            color: INSPECTOR_TOKENS.textMuted,
            width: 24,
          }}
        >
          Col
        </span>
        <input
          type="text"
          value={styles["column-gap"] || ""}
          onChange={(e) => onChange("column-gap", e.target.value)}
          placeholder="0"
          style={{ ...inputStyle, padding: "4px 5px" }}
        />
      </div>
    </div>
  </div>
);

export default GapControls;
