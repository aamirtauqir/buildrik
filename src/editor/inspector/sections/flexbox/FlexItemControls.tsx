/**
 * FlexItemControls - Flex item (child) properties: grow, shrink, basis, order
 * @license BSD-3-Clause
 */

import * as React from "react";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";

// ============================================================================
// TYPES
// ============================================================================

export interface FlexItemControlsProps {
  styles: Record<string, string>;
  onChange: (prop: string, val: string) => void;
  disabled: (prop: string) => boolean | undefined;
  reason: (prop: string) => string | undefined;
  inputStyle: React.CSSProperties;
  rowStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  compactBtn: (active: boolean) => React.CSSProperties;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FlexItemControls: React.FC<FlexItemControlsProps> = ({
  styles,
  onChange,
  disabled,
  reason,
  inputStyle,
  rowStyle,
  labelStyle,
  compactBtn,
}) => (
  <div
    style={{
      marginTop: 10,
      paddingTop: 10,
      borderTop: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: INSPECTOR_TOKENS.textMuted,
        fontWeight: 600,
        marginBottom: 8,
        textTransform: "uppercase",
      }}
    >
      Flex Item (Self)
    </div>

    {/* Grow, Shrink, Basis */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 4,
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            fontSize: 12,
            color: INSPECTOR_TOKENS.textMuted,
            width: 30,
          }}
        >
          Grow
        </span>
        <input
          type="number"
          value={styles["flex-grow"] || ""}
          onChange={(e) => onChange("flex-grow", e.target.value)}
          placeholder="0"
          min="0"
          style={{
            ...inputStyle,
            padding: "4px 5px",
            opacity: disabled("flex-grow") ? 0.5 : 1,
          }}
          title={reason("flex-grow")}
          disabled={disabled("flex-grow")}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            fontSize: 12,
            color: INSPECTOR_TOKENS.textMuted,
            width: 30,
          }}
        >
          Shrink
        </span>
        <input
          type="number"
          value={styles["flex-shrink"] || ""}
          onChange={(e) => onChange("flex-shrink", e.target.value)}
          placeholder="1"
          min="0"
          style={{
            ...inputStyle,
            padding: "4px 5px",
            opacity: disabled("flex-shrink") ? 0.5 : 1,
          }}
          title={reason("flex-shrink")}
          disabled={disabled("flex-shrink")}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            fontSize: 12,
            color: INSPECTOR_TOKENS.textMuted,
            width: 30,
          }}
        >
          Basis
        </span>
        <input
          type="text"
          value={styles["flex-basis"] || ""}
          onChange={(e) => onChange("flex-basis", e.target.value)}
          placeholder="auto"
          style={{
            ...inputStyle,
            padding: "4px 5px",
            opacity: disabled("flex-basis") ? 0.5 : 1,
          }}
          title={reason("flex-basis")}
          disabled={disabled("flex-basis")}
        />
      </div>
    </div>

    {/* Align Self */}
    <div style={rowStyle}>
      <label style={labelStyle}>A-Self</label>
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {["auto", "start", "center", "end", "stretch", "base"].map((val) => {
          const actualVal =
            val === "start"
              ? "flex-start"
              : val === "end"
                ? "flex-end"
                : val === "base"
                  ? "baseline"
                  : val;
          return (
            <button
              key={val}
              style={compactBtn(styles["align-self"] === actualVal)}
              onClick={() => onChange("align-self", actualVal)}
              disabled={disabled("align-self")}
              title={reason("align-self")}
            >
              {val.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </div>

    {/* Order */}
    <div style={rowStyle}>
      <label style={labelStyle}>Order</label>
      <input
        type="number"
        value={styles.order || ""}
        onChange={(e) => onChange("order", e.target.value)}
        placeholder="0"
        style={{
          ...inputStyle,
          opacity: disabled("order") ? 0.5 : 1,
        }}
        disabled={disabled("order")}
        title={reason("order")}
      />
    </div>
  </div>
);

export default FlexItemControls;
