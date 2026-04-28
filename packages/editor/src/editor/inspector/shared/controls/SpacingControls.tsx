import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * Spacing Controls — nested Webflow box (margin + padding) + CornerRadiusInput.
 * Ported to .bdi-box / .bdi-mbox / .bdi-pbox / .bdi-ax per comp-inspector.html v2.
 *
 * SpacingBox replaces the old FourSideInput quad grid: both margin and padding
 * render in a single nested visualization with axis inputs at the dashed-box
 * edges (top/right/bottom/left).
 *
 * @license BSD-3-Clause
 */

import { Link, Unlink } from "lucide-react";
import * as React from "react";
import { Stack } from "@/editor/shared/vibcoder";

// ============================================================================
// AXIS INPUT — absolutely positioned input inside a box edge
// ============================================================================

type Side = "top" | "right" | "bottom" | "left";

const SIDE_POS: Record<Side, string> = {
  top: "t",
  right: "r",
  bottom: "b",
  left: "l",
};

const parseValue = (val: string): { num: string; unit: string; isKeyword: boolean } => {
  if (!val) return { num: "", unit: "", isKeyword: false };
  if (val === "auto" || val === "inherit" || val === "initial") {
    return { num: val, unit: "", isKeyword: true };
  }
  const m = val.match(/^(-?[\d.]+)(.*)$/);
  return m ? { num: m[1], unit: m[2] || "px", isKeyword: false } : { num: val, unit: "", isKeyword: false };
};

interface AxisInputProps {
  side: Side;
  value: string;
  onChange: (value: string) => void;
  accent?: "margin" | "padding";
  disabled?: boolean;
}

const AxisInput: React.FC<AxisInputProps> = ({ side, value, onChange, disabled }) => {
  const [local, setLocal] = React.useState(() => parseValue(value));

  React.useEffect(() => {
    setLocal(parseValue(value));
  }, [value]);

  const commit = (raw: string) => {
    if (raw === "") {
      onChange("");
      return;
    }
    if (raw === "auto" || raw === "inherit") {
      onChange(raw);
      return;
    }
    if (/^-?[\d.]+$/.test(raw)) {
      onChange(`${raw}px`);
    }
  };

  const display = local.isKeyword ? local.num : local.num;

  return (
    <Input
      type="text"
      className={`bdi-ax ${SIDE_POS[side]}${local.isKeyword ? " muted" : ""}`}
      value={display}
      disabled={disabled}
      aria-label={`${side}`}
      onChange={(e) => {
        const next = e.target.value;
        setLocal({ num: next, unit: local.unit, isKeyword: /^[a-z]+$/i.test(next) });
        if (next === "" || /^-?[\d.]+$/.test(next) || next === "auto" || next === "inherit") {
          commit(next);
        }
      }}
      onBlur={() => {
        if (display !== local.num) setLocal(parseValue(value));
      }}
      placeholder="0"
    />
  );
};

// ============================================================================
// SPACING BOX — margin + padding nested dashed boxes
// ============================================================================

export interface SpacingBoxProps {
  margin: { top: string; right: string; bottom: string; left: string };
  padding: { top: string; right: string; bottom: string; left: string };
  onMarginChange: (side: Side, value: string) => void;
  onPaddingChange: (side: Side, value: string) => void;
  disabledMargin?: Partial<Record<Side, boolean | undefined>>;
  disabledPadding?: Partial<Record<Side, boolean | undefined>>;
}

export const SpacingBox: React.FC<SpacingBoxProps> = ({
  margin,
  padding,
  onMarginChange,
  onPaddingChange,
  disabledMargin,
  disabledPadding,
}) => (
  <div className="bdi-box">
    <div className="bdi-mbox">
      <span className="bdi-tag">Margin</span>
      <AxisInput side="top" value={margin.top} onChange={(v) => onMarginChange("top", v)} accent="margin" disabled={disabledMargin?.top} />
      <AxisInput side="right" value={margin.right} onChange={(v) => onMarginChange("right", v)} accent="margin" disabled={disabledMargin?.right} />
      <AxisInput side="bottom" value={margin.bottom} onChange={(v) => onMarginChange("bottom", v)} accent="margin" disabled={disabledMargin?.bottom} />
      <AxisInput side="left" value={margin.left} onChange={(v) => onMarginChange("left", v)} accent="margin" disabled={disabledMargin?.left} />

      <div className="bdi-pbox">
        <span className="bdi-tag">Padding</span>
        <AxisInput side="top" value={padding.top} onChange={(v) => onPaddingChange("top", v)} accent="padding" disabled={disabledPadding?.top} />
        <AxisInput side="right" value={padding.right} onChange={(v) => onPaddingChange("right", v)} accent="padding" disabled={disabledPadding?.right} />
        <AxisInput side="bottom" value={padding.bottom} onChange={(v) => onPaddingChange("bottom", v)} accent="padding" disabled={disabledPadding?.bottom} />
        <AxisInput side="left" value={padding.left} onChange={(v) => onPaddingChange("left", v)} accent="padding" disabled={disabledPadding?.left} />
        <div className="bdi-center-rect">Content</div>
      </div>
    </div>
  </div>
);

// ============================================================================
// LEGACY FourSideInput — kept for back-compat (renders single quad).
// Consumers should migrate to SpacingBox for combined margin+padding.
// ============================================================================

export interface FourSideInputProps {
  label: string;
  values: { top: string; right: string; bottom: string; left: string };
  onChange: (side: Side, value: string) => void;
  onLinkToggle?: () => void;
  linked?: boolean;
  disabledSides?: Partial<Record<Side, boolean | undefined>>;
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
}) => (
  <Stack gap="xs">
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4,
      }}
    >
      <span className="bdi-sub-label" title={disabledReason}>
        {label}
      </span>
      {onLinkToggle && (
        <Button
          type="button"
          onClick={onLinkToggle}
          title={linked ? "Unlink sides" : "Link all sides"}
          aria-label={linked ? "Unlink sides" : "Link all sides"}
          className="bdi-icon-btn"
          style={{
            width: 18,
            height: 18,
            color: linked ? "var(--bd-accent)" : "var(--bd-fg-muted)",
          }}
        >
          {linked ? <Link size={11} aria-hidden="true" /> : <Unlink size={11} aria-hidden="true" />}
        </Button>
      )}
    </div>
    <div className="bdi-quad">
      {(["top", "right", "bottom", "left"] as const).map((side) => {
        const { num, unit, isKeyword } = parseValue(values[side]);
        return (
          <div
            key={side}
            className="bdi-num axis"
            data-axis={SIDE_POS[side].toUpperCase()}
            style={disabledSides?.[side] ? { opacity: 0.5, pointerEvents: "none" } : undefined}
          >
            <Input
              type="text"
              value={num}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || v === "auto" || v === "inherit") onChange(side, v);
                else if (/^-?[\d.]+$/.test(v)) onChange(side, `${v}px`);
              }}
              placeholder="0"
              className={isKeyword ? "muted" : ""}
              aria-label={side}
            />
            {unit && !isKeyword && <span className="bdi-u">{unit}</span>}
          </div>
        );
      })}
    </div>
  </Stack>
);

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
}) => (
  <Stack gap="xs">
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4,
      }}
    >
      <span className="bdi-sub-label">Radius</span>
      {onLinkToggle && (
        <Button
          type="button"
          onClick={onLinkToggle}
          title={linked ? "Unlink corners" : "Link all corners"}
          aria-label={linked ? "Unlink corners" : "Link all corners"}
          className="bdi-icon-btn"
          style={{
            width: 18,
            height: 18,
            color: linked ? "var(--bd-accent)" : "var(--bd-fg-muted)",
          }}
        >
          {linked ? <Link size={11} aria-hidden="true" /> : <Unlink size={11} aria-hidden="true" />}
        </Button>
      )}
    </div>
    <div className="bdi-quad">
      {(["tl", "tr", "bl", "br"] as const).map((corner) => {
        const { num, unit } = parseValue(values[corner]);
        return (
          <div key={corner} className="bdi-num axis" data-axis={corner.toUpperCase()}>
            <Input
              type="text"
              value={num}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") onChange(corner, "");
                else if (/^-?[\d.]+$/.test(v)) onChange(corner, `${v}px`);
              }}
              placeholder="0"
              aria-label={`${corner} corner`}
            />
            {unit && <span className="bdi-u">{unit}</span>}
          </div>
        );
      })}
    </div>
  </Stack>
);
