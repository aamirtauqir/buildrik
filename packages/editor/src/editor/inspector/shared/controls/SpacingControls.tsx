/**
 * Spacing Controls — FourSideInput (margin/padding quad) + CornerRadiusInput.
 * Ported to .bdi-quad + .bdi-num.axis per comp-inspector.v1.
 *
 * @license BSD-3-Clause
 */

import { Link, Unlink } from "lucide-react";
import * as React from "react";

// ============================================================================
// FOUR-SIDE INPUT (margin / padding quad)
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

const SIDE_AXIS: Record<"top" | "right" | "bottom" | "left", string> = {
  top: "T",
  right: "R",
  bottom: "B",
  left: "L",
};

const AxisInput: React.FC<{
  side: "top" | "right" | "bottom" | "left";
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}> = ({ side, value, onChange, disabled }) => {
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => setLocal(value), [value]);

  const parseValue = (val: string): { num: string; unit: string } => {
    if (val === "auto" || val === "inherit" || val === "") return { num: val, unit: "" };
    const m = val.match(/^(-?[\d.]+)(.*)$/);
    return m ? { num: m[1], unit: m[2] || "px" } : { num: val, unit: "" };
  };

  const { num, unit } = parseValue(local);
  const commit = (raw: string) => {
    if (raw === "" || raw === "auto") {
      onChange(raw);
      return;
    }
    if (/^-?[\d.]+$/.test(raw)) onChange(`${raw}px`);
  };

  return (
    <div
      className="bdi-num axis"
      data-axis={SIDE_AXIS[side]}
      style={disabled ? { opacity: 0.5, pointerEvents: "none" } : undefined}
    >
      <input
        type="text"
        value={num}
        onChange={(e) => {
          setLocal(e.target.value);
          commit(e.target.value);
        }}
        placeholder="0"
        disabled={disabled}
        aria-label={`${side} ${SIDE_AXIS[side]}`}
        className={num === "auto" ? "muted" : ""}
      />
      {unit && num !== "auto" && <span className="bdi-u">{unit}</span>}
    </div>
  );
};

export const FourSideInput: React.FC<FourSideInputProps> = ({
  label,
  values,
  onChange,
  onLinkToggle,
  linked = false,
  disabledSides,
  disabledReason,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4,
      }}
    >
      <span className="bdi-sub-label" style={{ marginTop: 0 }} title={disabledReason}>
        {label}
      </span>
      {onLinkToggle && (
        <button
          type="button"
          onClick={onLinkToggle}
          title={linked ? "Unlink sides" : "Link all sides"}
          aria-label={linked ? "Unlink sides" : "Link all sides"}
          className="bdi-mini"
          style={{
            width: 18,
            height: 18,
            color: linked ? "var(--bd-accent)" : "var(--bd-fg-muted)",
          }}
        >
          {linked ? <Link size={11} aria-hidden="true" /> : <Unlink size={11} aria-hidden="true" />}
        </button>
      )}
    </div>
    <div className="bdi-quad">
      <AxisInput
        side="top"
        value={values.top}
        onChange={(v) => onChange("top", v)}
        disabled={disabledSides?.top}
      />
      <AxisInput
        side="right"
        value={values.right}
        onChange={(v) => onChange("right", v)}
        disabled={disabledSides?.right}
      />
      <AxisInput
        side="bottom"
        value={values.bottom}
        onChange={(v) => onChange("bottom", v)}
        disabled={disabledSides?.bottom}
      />
      <AxisInput
        side="left"
        value={values.left}
        onChange={(v) => onChange("left", v)}
        disabled={disabledSides?.left}
      />
    </div>
  </div>
);

// ============================================================================
// CORNER RADIUS INPUT (2x2 corners + link)
// ============================================================================

export interface CornerRadiusInputProps {
  values: { tl: string; tr: string; br: string; bl: string };
  onChange: (corner: "tl" | "tr" | "br" | "bl", value: string) => void;
  linked?: boolean;
  onLinkToggle?: () => void;
}

const CORNER_AXIS: Record<"tl" | "tr" | "br" | "bl", string> = {
  tl: "TL",
  tr: "TR",
  br: "BR",
  bl: "BL",
};

const CornerAxisInput: React.FC<{
  corner: "tl" | "tr" | "br" | "bl";
  value: string;
  onChange: (v: string) => void;
}> = ({ corner, value, onChange }) => {
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => setLocal(value), [value]);

  const parseValue = (val: string): { num: string; unit: string } => {
    const m = val.match(/^(-?[\d.]+)(.*)$/);
    return m ? { num: m[1], unit: m[2] || "px" } : { num: val, unit: "" };
  };
  const { num, unit } = parseValue(local);

  return (
    <div className="bdi-num axis" data-axis={CORNER_AXIS[corner]}>
      <input
        type="text"
        value={num}
        onChange={(e) => {
          setLocal(e.target.value);
          if (/^-?[\d.]+$/.test(e.target.value)) onChange(`${e.target.value}px`);
          else if (e.target.value === "") onChange("");
        }}
        placeholder="0"
        aria-label={`${corner} corner`}
      />
      {unit && <span className="bdi-u">{unit}</span>}
    </div>
  );
};

export const CornerRadiusInput: React.FC<CornerRadiusInputProps> = ({
  values,
  onChange,
  linked = false,
  onLinkToggle,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4,
      }}
    >
      <span className="bdi-sub-label" style={{ marginTop: 0 }}>
        Radius
      </span>
      {onLinkToggle && (
        <button
          type="button"
          onClick={onLinkToggle}
          title={linked ? "Unlink corners" : "Link all corners"}
          aria-label={linked ? "Unlink corners" : "Link all corners"}
          className="bdi-mini"
          style={{
            width: 18,
            height: 18,
            color: linked ? "var(--bd-accent)" : "var(--bd-fg-muted)",
          }}
        >
          {linked ? <Link size={11} aria-hidden="true" /> : <Unlink size={11} aria-hidden="true" />}
        </button>
      )}
    </div>
    <div className="bdi-quad">
      <CornerAxisInput corner="tl" value={values.tl} onChange={(v) => onChange("tl", v)} />
      <CornerAxisInput corner="tr" value={values.tr} onChange={(v) => onChange("tr", v)} />
      <CornerAxisInput corner="bl" value={values.bl} onChange={(v) => onChange("bl", v)} />
      <CornerAxisInput corner="br" value={values.br} onChange={(v) => onChange("br", v)} />
    </div>
  </div>
);
