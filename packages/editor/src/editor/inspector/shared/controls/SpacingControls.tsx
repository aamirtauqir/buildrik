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
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { DSBindingChip } from "../../sections/DSBindingChip";
import { isTokenVar, extractVarName, cssVarToTokenId } from "../tokenBindingDetection";

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
  composer?: Composer | null;
}

const AxisInput: React.FC<AxisInputProps> = ({ side, value, onChange, disabled, composer }) => {
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

  const tokenId = isTokenVar(value)
    ? cssVarToTokenId(extractVarName(value) ?? "")
    : null;

  const handleChipClick = React.useCallback(() => {
    composer?.emit(EVENTS.UI_OPEN_DESIGN_PANEL, {});
  }, [composer]);

  return (
    <>
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
      {tokenId ? (
        <DSBindingChip
          state="token"
          label={tokenId}
          onClick={composer ? handleChipClick : undefined}
        />
      ) : null}
    </>
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
  composer?: Composer | null;
}

export const SpacingBox: React.FC<SpacingBoxProps> = ({
  margin,
  padding,
  onMarginChange,
  onPaddingChange,
  disabledMargin,
  disabledPadding,
  composer,
}) => (
  <div className="bdi-box">
    <div className="bdi-mbox">
      <span className="bdi-tag">Margin</span>
      <AxisInput side="top" value={margin.top} onChange={(v) => onMarginChange("top", v)} accent="margin" disabled={disabledMargin?.top} composer={composer} />
      <AxisInput side="right" value={margin.right} onChange={(v) => onMarginChange("right", v)} accent="margin" disabled={disabledMargin?.right} composer={composer} />
      <AxisInput side="bottom" value={margin.bottom} onChange={(v) => onMarginChange("bottom", v)} accent="margin" disabled={disabledMargin?.bottom} composer={composer} />
      <AxisInput side="left" value={margin.left} onChange={(v) => onMarginChange("left", v)} accent="margin" disabled={disabledMargin?.left} composer={composer} />

      <div className="bdi-pbox">
        <span className="bdi-tag">Padding</span>
        <AxisInput side="top" value={padding.top} onChange={(v) => onPaddingChange("top", v)} accent="padding" disabled={disabledPadding?.top} composer={composer} />
        <AxisInput side="right" value={padding.right} onChange={(v) => onPaddingChange("right", v)} accent="padding" disabled={disabledPadding?.right} composer={composer} />
        <AxisInput side="bottom" value={padding.bottom} onChange={(v) => onPaddingChange("bottom", v)} accent="padding" disabled={disabledPadding?.bottom} composer={composer} />
        <AxisInput side="left" value={padding.left} onChange={(v) => onPaddingChange("left", v)} accent="padding" disabled={disabledPadding?.left} composer={composer} />
        <div className="bdi-center-rect">Content</div>
      </div>
    </div>
  </div>
);

// ============================================================================
// CORNER RADIUS INPUT
// ============================================================================
// Note: legacy FourSideInput (single-quad spacing control) removed
// 2026-05-24. Had zero production callers since DS Phase D.1; the
// canonical control is SpacingBox above.

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
            color: linked ? "var(--bk-accent)" : "var(--bk-ink-muted)",
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
