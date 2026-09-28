/**
 * Spacing Controls — the SpacingBox (margin outside, padding inside) and
 * CornerRadiusInput.
 *
 * SpacingBox, board 1: a grey margin box holding a white padding box, each
 * with its label top-left and its four numbers on the edges (top centred,
 * left / right beside the inner box, bottom centred), the content chip in the
 * middle. Every number is an input named "Padding top" etc. and carries its
 * CSS property, so the field context draws read-only, "Mixed" and the
 * override dot (board 26: "● 32" on Padding top) — never the section.
 *
 * @license BSD-3-Clause
 */

import { Link, Unlink } from "lucide-react";
import * as React from "react";
import { FieldDot } from "./FieldDot";
import { useInspectorField, mixedName } from "./InspectorFieldContext";
import { unitWords } from "./InputControls";
import { TextField, Button, TextInput, IconButton } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import { requestBrandToken } from "@/editor/design-system/ui/brandOpenRequest";
import { isTokenVar, extractVarName, cssVarToTokenId, resolveTokenVar } from "../tokenBindingDetection";

// ============================================================================
// AXIS INPUT — one side's number
// ============================================================================

type Side = "top" | "right" | "bottom" | "left";
type Box = "margin" | "padding";

const parseValue = (val: string): { num: string; unit: string; isKeyword: boolean } => {
  if (!val) return { num: "", unit: "", isKeyword: false };
  if (val === "auto" || val === "inherit" || val === "initial") {
    return { num: val, unit: "", isKeyword: true };
  }
  /* A token-bound side or corner shows its resolved number (the chip still
     names the token) — not the raw site-token `var(…)` string (6894:74644). */
  if (isTokenVar(val)) {
    const r = resolveTokenVar(val).match(/^(-?[\d.]+)(.*)$/);
    if (r) return { num: r[1], unit: r[2] || "px", isKeyword: false };
  }
  const m = val.match(/^(-?[\d.]+)(.*)$/);
  return m ? { num: m[1], unit: m[2] || "px", isKeyword: false } : { num: val, unit: "", isKeyword: false };
};

/* At least 28 wide, and as wide as its number: "56.2" (board 9) did not fit
   a fixed 28. */
const CELL = "tw:relative tw:inline-flex tw:items-center tw:justify-center tw:h-4 tw:min-w-7 tw:shrink-0";
/* The number itself: Geist Mono 12, no frame until hovered / focused.
   TextField's base classes are not merged away, so the conflicting ones win
   by `!`, not by stylesheet order. */
const AXIS_INPUT =
  "tw:h-4! tw:min-w-7! tw:max-w-14! tw:w-auto! tw:[field-sizing:content] tw:px-0! tw:py-0! tw:rounded-[2px]! tw:border-transparent! tw:bg-transparent! tw:text-center " +
  "tw:[font-family:var(--bk-font-mono)]! tw:text-[12px]! tw:leading-4 tw:tabular-nums tw:text-[var(--bk-ink-soft)]! " +
  "tw:hover:border-[var(--bk-border)]! tw:focus:border-[var(--bk-accent)]! tw:focus:bg-[var(--bk-bg-panel)]! " +
  "tw:read-only:hover:border-transparent!";

interface AxisInputProps {
  box: Box;
  side: Side;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  composer?: Composer | null;
}

const AxisInput: React.FC<AxisInputProps> = ({ box, side, value, onChange, disabled, composer }) => {
  const property = `${box}-${side}`;
  const field = useInspectorField(property);
  const [local, setLocal] = React.useState(() => parseValue(value));

  React.useEffect(() => {
    setLocal(parseValue(value));
  }, [value]);

  const commit = (raw: string) => {
    if (raw === "") onChange("");
    else if (raw === "auto" || raw === "inherit") onChange(raw);
    else if (/^-?[\d.]+$/.test(raw)) onChange(`${raw}px`);
  };

  const tokenId = isTokenVar(value) ? cssVarToTokenId(extractVarName(value) ?? "") : null;
  const handleChipClick = React.useCallback(() => {
    /* G3-156: open Brand ON the token, not its landing page. */
    if (composer && tokenId) requestBrandToken(composer, tokenId);
  }, [composer, tokenId]);
  const name = `${box === "margin" ? "Margin" : "Padding"} ${side}`;
  /* §16: the name carries the unit ("Padding top in pixels"). */
  const nameId = React.useId();
  const suffixId = React.useId();
  const suffix = field.mixed ? "Mixed values" : local.isKeyword || local.num === "" ? "" : unitWords(local.unit || "px");

  return (
    <span className={CELL} data-testid={`inspector-spacing-${property}`}>
      {field.overrides.length > 0 || tokenId ? (
        /* In front of the number, its 24px target reaching into the cell's
           own blank edge — so the dot sits beside "32", clear of the ring's
           "Padding" tag (board 26). */
        <span className="tw:absolute tw:right-full tw:-mr-2 tw:top-1/2 tw:-translate-y-1/2 tw:inline-flex tw:items-center">
          <FieldDot field={field} />
          {tokenId ? (
            /* The box has no room for the token chip's name: a 24px marker
               carries it (and its jump to Brand) instead. */
            <IconButton
              label={composer ? `Jump to token ${tokenId} in Brand` : `Bound to token ${tokenId}`}
              title={tokenId}
              size="sm"
              data-testid={`inspector-spacing-token-${property}`}
              className="tw:size-6 tw:shrink-0"
              onClick={composer ? handleChipClick : undefined}
            >
              <span aria-hidden="true" className="tw:block tw:size-1.5 tw:rotate-45 tw:bg-[var(--bk-success)]" />
            </IconButton>
          ) : null}
        </span>
      ) : null}
      <span id={nameId} hidden>
        {name}
      </span>
      {suffix ? (
        <span id={suffixId} hidden>
          {suffix}
        </span>
      ) : null}
      <TextField
        type="text"
        className={AXIS_INPUT}
        value={field.mixed ? "" : local.num}
        disabled={disabled}
        readOnly={field.readOnly}
        aria-readonly={field.readOnly || undefined}
        aria-labelledby={suffix ? `${nameId} ${suffixId}` : nameId}
        placeholder={field.mixed ? "Mixed" : "0"}
        onChange={(e) => {
          const next = e.target.value;
          setLocal({ num: next, unit: local.unit, isKeyword: /^[a-z]+$/i.test(next) });
          if (next === "" || /^-?[\d.]+$/.test(next) || next === "auto" || next === "inherit") commit(next);
        }}
        onKeyDown={(e) => {
          /* §16: ↑/↓ step 1, Shift 10; Esc puts the value back. */
          if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !field.readOnly && !local.isKeyword) {
            const base = Number(local.num || 0);
            if (!Number.isFinite(base)) return;
            e.preventDefault();
            const next = String(Math.round((base + (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1)) * 100) / 100);
            setLocal({ num: next, unit: local.unit || "px", isKeyword: false });
            commit(next);
          } else if (e.key === "Escape") {
            setLocal(parseValue(value));
          }
        }}
        onBlur={() => setLocal(parseValue(value))}
      />
    </span>
  );
};

// ============================================================================
// SPACING BOX
// ============================================================================

type Sides = { top: string; right: string; bottom: string; left: string };

export interface SpacingBoxProps {
  margin: Sides;
  padding: Sides;
  onMarginChange: (side: Side, value: string) => void;
  onPaddingChange: (side: Side, value: string) => void;
  disabledMargin?: Partial<Record<Side, boolean | undefined>>;
  disabledPadding?: Partial<Record<Side, boolean | undefined>>;
  composer?: Composer | null;
}

const BOX_TAG = "tw:absolute tw:left-0 tw:top-0 tw:[font-family:var(--bk-font-mono)] tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/** One ring: its label, top number, [left · inner · right], bottom number. */
function Ring(p: {
  box: Box;
  label: string;
  values: Sides;
  onChange: (side: Side, value: string) => void;
  disabled?: Partial<Record<Side, boolean | undefined>>;
  composer?: Composer | null;
  className: string;
  children: React.ReactNode;
}) {
  const axis = (side: Side) => (
    <AxisInput box={p.box} side={side} value={p.values[side]} onChange={(v) => p.onChange(side, v)} disabled={p.disabled?.[side]} composer={p.composer} />
  );
  return (
    <div className={`tw:flex tw:flex-col tw:items-stretch tw:gap-[2px] tw:px-2 tw:py-1 tw:border tw:border-[var(--bk-border)] ${p.className}`} data-testid={`inspector-spacing-${p.box}`}>
      <div className="tw:relative tw:flex tw:h-4 tw:justify-center">
        <span className={BOX_TAG}>{p.label}</span>
        {axis("top")}
      </div>
      <div className="tw:flex tw:items-center tw:gap-1">
        {axis("left")}
        <div className="tw:flex-1 tw:min-w-0">{p.children}</div>
        {axis("right")}
      </div>
      <div className="tw:flex tw:h-4 tw:justify-center">{axis("bottom")}</div>
    </div>
  );
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
  /* Board 1: the diagram 16 in from the column edge — the section body
     already gives 12. */
  <div className="tw:px-1 tw:py-1" data-testid="inspector-spacing-box">
    <Ring box="margin" label="Margin" values={margin} onChange={onMarginChange} disabled={disabledMargin} composer={composer} className="tw:bg-[var(--bk-bg-subtle)]">
      <Ring box="padding" label="Padding" values={padding} onChange={onPaddingChange} disabled={disabledPadding} composer={composer} className="tw:bg-[var(--bk-bg-panel)]">
        <div className="tw:flex tw:h-4 tw:items-center tw:justify-center" aria-hidden="true">
          <span className="tw:block tw:h-3 tw:w-10 tw:rounded-[2px] tw:bg-[var(--bk-bg-subtle)]" />
        </div>
      </Ring>
    </Ring>
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
  <div className="tw:flex tw:flex-col tw:gap-1">
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
          className="tw:px-0 bdi-icon-btn"
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
      {(["tl", "tr", "bl", "br"] as const).map((corner) => (
        <CornerCell key={corner} corner={corner} value={values[corner]} onChange={(v) => onChange(corner, v)} />
      ))}
    </div>
  </div>
);

const CORNER_PROPERTY = {
  tl: "border-top-left-radius",
  tr: "border-top-right-radius",
  br: "border-bottom-right-radius",
  bl: "border-bottom-left-radius",
} as const;

const CornerCell: React.FC<{ corner: keyof typeof CORNER_PROPERTY; value: string; onChange: (value: string) => void }> = ({
  corner,
  value,
  onChange,
}) => {
  const field = useInspectorField(CORNER_PROPERTY[corner]);
  const { num, unit } = parseValue(value);
  return (
    <div className="bdi-num axis" data-axis={corner.toUpperCase()}>
      <TextInput
        type="text"
        value={field.mixed ? "" : num}
        readOnly={field.readOnly}
        onChange={(e) => {
          if (field.readOnly) return;
          const v = e.target.value;
          if (v === "") onChange("");
          else if (/^-?[\d.]+$/.test(v)) onChange(`${v}px`);
        }}
        placeholder={field.mixed ? "Mixed" : "0"}
        aria-label={field.mixed ? mixedName(`${corner} corner`) : `${corner} corner`}
      />
      {unit && !field.mixed && <span className="bdi-u">{unit}</span>}
    </div>
  );
};
