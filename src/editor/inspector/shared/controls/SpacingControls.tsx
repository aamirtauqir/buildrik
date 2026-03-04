/**
 * Spacing Controls for Pro Inspector
 * FourSideInput (margin/padding), CornerRadiusInput
 * @license BSD-3-Clause
 */

import * as React from "react";
import { baseStyles } from "./controlStyles";

// ============================================================================
// FOUR-SIDE INPUT (for margin/padding)
// ============================================================================

export interface FourSideInputProps {
  label: string;
  values: { top: string; right: string; bottom: string; left: string };
  onChange: (side: "top" | "right" | "bottom" | "left", value: string) => void;
  onLinkToggle?: () => void;
  linked?: boolean;
  disabledSides?: Partial<Record<"top" | "right" | "bottom" | "left", boolean | undefined>>;
  disabledReason?: string;
}

export const FourSideInput: React.FC<FourSideInputProps> = ({
  label,
  values,
  onChange,
  onLinkToggle,
  linked = false,
  disabledSides,
  disabledReason,
}) => {
  const boxStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 60px 1fr",
    gridTemplateRows: "auto auto auto",
    gap: 4,
    alignItems: "center",
    justifyItems: "center",
  };

  const sideInputStyle: React.CSSProperties = {
    width: 50,
    padding: "6px 4px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    color: "#e4e4e7",
    fontSize: 12,
    textAlign: "center",
    outline: "none",
  };

  const centerBoxStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    background: "rgba(0,115,230,0.1)",
    border: "1px dashed rgba(0,115,230,0.3)",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 12,
    color: linked ? "#0073E6" : "#71717a",
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...baseStyles.label, marginBottom: 8 }} title={disabledReason}>
        {label}
      </div>
      <div style={boxStyle}>
        {/* Top */}
        <div />
        <input
          type="text"
          value={values.top}
          onChange={(e) => onChange("top", e.target.value)}
          placeholder="0"
          style={{
            ...sideInputStyle,
            opacity: disabledSides?.top ? 0.5 : 1,
            cursor: disabledSides?.top ? "not-allowed" : "text",
          }}
          disabled={disabledSides?.top}
        />
        <div />

        {/* Left - Center - Right */}
        <input
          type="text"
          value={values.left}
          onChange={(e) => onChange("left", e.target.value)}
          placeholder="0"
          style={{
            ...sideInputStyle,
            opacity: disabledSides?.left ? 0.5 : 1,
            cursor: disabledSides?.left ? "not-allowed" : "text",
          }}
          disabled={disabledSides?.left}
        />
        <div style={centerBoxStyle} onClick={onLinkToggle} title="Link all sides">
          {linked ? "🔗" : "⛓️‍💥"}
        </div>
        <input
          type="text"
          value={values.right}
          onChange={(e) => onChange("right", e.target.value)}
          placeholder="0"
          style={{
            ...sideInputStyle,
            opacity: disabledSides?.right ? 0.5 : 1,
            cursor: disabledSides?.right ? "not-allowed" : "text",
          }}
          disabled={disabledSides?.right}
        />

        {/* Bottom */}
        <div />
        <input
          type="text"
          value={values.bottom}
          onChange={(e) => onChange("bottom", e.target.value)}
          placeholder="0"
          style={{
            ...sideInputStyle,
            opacity: disabledSides?.bottom ? 0.5 : 1,
            cursor: disabledSides?.bottom ? "not-allowed" : "text",
          }}
          disabled={disabledSides?.bottom}
        />
        <div />
      </div>
    </div>
  );
};

// ============================================================================
// CORNER RADIUS INPUT
// ============================================================================

export interface CornerRadiusInputProps {
  values: { tl: string; tr: string; br: string; bl: string };
  onChange: (corner: "tl" | "tr" | "br" | "bl", value: string) => void;
  linked?: boolean;
  onLinkToggle?: () => void;
}

export const CornerRadiusInput: React.FC<CornerRadiusInputProps> = ({
  values,
  onChange,
  linked = false,
  onLinkToggle,
}) => {
  const cornerStyle: React.CSSProperties = {
    width: 40,
    padding: "6px 4px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 4,
    color: "#e4e4e7",
    fontSize: 12,
    textAlign: "center",
    outline: "none",
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ ...baseStyles.label, marginBottom: 8 }}>Border Radius</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "40px 40px", gap: 4 }}>
          <input
            type="text"
            value={values.tl}
            onChange={(e) => onChange("tl", e.target.value)}
            placeholder="0"
            style={{ ...cornerStyle, borderRadius: "8px 0 0 0" }}
            title="Top Left"
          />
          <input
            type="text"
            value={values.tr}
            onChange={(e) => onChange("tr", e.target.value)}
            placeholder="0"
            style={{ ...cornerStyle, borderRadius: "0 8px 0 0" }}
            title="Top Right"
          />
          <input
            type="text"
            value={values.bl}
            onChange={(e) => onChange("bl", e.target.value)}
            placeholder="0"
            style={{ ...cornerStyle, borderRadius: "0 0 0 8px" }}
            title="Bottom Left"
          />
          <input
            type="text"
            value={values.br}
            onChange={(e) => onChange("br", e.target.value)}
            placeholder="0"
            style={{ ...cornerStyle, borderRadius: "0 0 8px 0" }}
            title="Bottom Right"
          />
        </div>
        <button
          onClick={onLinkToggle}
          style={{
            padding: "8px 12px",
            background: linked ? "rgba(0,115,230,0.2)" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: linked ? "#0073E6" : "#71717a",
            cursor: "pointer",
            fontSize: 12,
          }}
          title="Link all corners"
        >
          {linked ? "🔗" : "⛓️‍💥"}
        </button>
      </div>
    </div>
  );
};
