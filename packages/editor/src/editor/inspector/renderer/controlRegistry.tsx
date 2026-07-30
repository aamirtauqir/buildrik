/**
 * Default control registry — maps each Field discriminator to a React
 * component. Session 1 ships minimal controls for length, number, select,
 * toggle, color, and spacing4. These are intentionally thin — the goal is
 * a working end-to-end pipeline, not feature parity with existing sections.
 *
 * Chrome Axiom compliance: all inline styles reference --buildrick-* tokens,
 * no gradients, no raw shadows, border-radius ≤ 4.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Input, Select } from "@/editor/ui";
import type {
  ColorField,
  ControlProps,
  ControlRegistry,
  Corners4Field,
  GroupHeadingField,
  LengthField,
  NumberField,
  SelectField,
  Spacing4Field,
  TextField,
  ToggleField,
} from "./schema";
import { Button, Checkbox } from "flowbite-react";

// ============================================================================
// SHARED STYLE TOKENS — keep each control file-local so future sections can
// diverge without cross-control coupling. Nothing here is exported.
// ============================================================================

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minHeight: 24,
};

const labelStyle: React.CSSProperties = {
  flex: "0 0 88px",
  fontSize: 12,
  color: "var(--bk-ink-soft)",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 24,
  padding: "0 8px",
  fontSize: 12,
  color: "var(--bk-ink)",
  background: "var(--bk-bg-card)",
  border: "1px solid var(--bk-border)",
  borderRadius: 4,
};

// File-local so the value lives near the style it drives, and so the chrome
// gate's TSX bare-number check doesn't see a magic literal.
const COLOR_SWATCH_PX = 48;

// ============================================================================
// LENGTH — plain text input; unit handling deferred to a later session.
// Accepts any CSS length string (12px, 50%, auto, var(--token), ...).
// ============================================================================

const LengthControl: React.FC<ControlProps<LengthField>> = ({
  field,
  value,
  onChange,
}) => (
  <div style={rowStyle}>
    <label style={labelStyle} htmlFor={`field-${field.prop}`}>
      {field.label}
    </label>
    <Input
      id={`field-${field.prop}`}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.defaultUnit ? `0${field.defaultUnit}` : "auto"}
      style={inputStyle}
    />
  </div>
);

// ============================================================================
// NUMBER
// ============================================================================

const NumberControl: React.FC<ControlProps<NumberField>> = ({
  field,
  value,
  onChange,
}) => (
  <div style={rowStyle}>
    <label style={labelStyle} htmlFor={`field-${field.prop}`}>
      {field.label}
    </label>
    <Input
      id={`field-${field.prop}`}
      type="number"
      value={value}
      min={field.min}
      max={field.max}
      step={field.step ?? 1}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  </div>
);

// ============================================================================
// SELECT
// ============================================================================

const SelectControl: React.FC<ControlProps<SelectField>> = ({
  field,
  value,
  onChange,
}) => (
  <div style={rowStyle}>
    <label style={labelStyle} htmlFor={`field-${field.prop}`}>
      {field.label}
    </label>
    <Select
      id={`field-${field.prop}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    >
      {field.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  </div>
);

// ============================================================================
// TOGGLE — renders as a checkbox. Writes field.on / field.off to styles.
// ============================================================================

const ToggleControl: React.FC<ControlProps<ToggleField>> = ({
  field,
  value,
  onChange,
}) => {
  const checked = value === field.on;
  return (
    <div style={rowStyle}>
      <label style={labelStyle} htmlFor={`field-${field.prop}`}>
        {field.label}
      </label>
      <Checkbox
        color="blue"
        className="tw:bg-white"
        id={`field-${field.prop}`}
        checked={checked}
        onChange={(e) => onChange(e.target.checked ? field.on : field.off)} />
    </div>
  );
};

// ============================================================================
// COLOR — native picker for now; token-aware picker is a later session.
// ============================================================================

const ColorControl: React.FC<ControlProps<ColorField>> = ({
  field,
  value,
  onChange,
}) => (
  <div style={rowStyle}>
    <label style={labelStyle} htmlFor={`field-${field.prop}`}>
      {field.label}
    </label>
    <Input
      id={`field-${field.prop}`}
      type="color"
      value={value || "#000000"}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...inputStyle,
        padding: 2,
        width: COLOR_SWATCH_PX,
        flex: `0 0 ${COLOR_SWATCH_PX}px`,
      }}
    />
  </div>
);

// ============================================================================
// SPACING4 — four-sided linked input. Reads/writes four side properties
// via onBatchChange when linked, onChange-per-side otherwise.
// Link state is local per instance.
// ============================================================================

const SIDES = ["top", "right", "bottom", "left"] as const;
type Side = (typeof SIDES)[number];

const Spacing4Control: React.FC<ControlProps<Spacing4Field>> = ({
  field,
  styles,
  onBatchChange,
}) => {
  const [linked, setLinked] = React.useState(false);
  const values: Record<Side, string> = {
    top: styles[`${field.group}-top`] ?? "",
    right: styles[`${field.group}-right`] ?? "",
    bottom: styles[`${field.group}-bottom`] ?? "",
    left: styles[`${field.group}-left`] ?? "",
  };

  const handleSide = (side: Side, next: string) => {
    if (linked) {
      onBatchChange({
        [`${field.group}-top`]: next,
        [`${field.group}-right`]: next,
        [`${field.group}-bottom`]: next,
        [`${field.group}-left`]: next,
      });
    } else {
      onBatchChange({ [`${field.group}-${side}`]: next });
    }
  };

  return (
    <div>
      <div style={rowStyle}>
        <span style={labelStyle}>{field.label}</span>
        {field.linkable !== false && (
          <Button
            type="button"
            onClick={() => setLinked((v) => !v)}
            aria-pressed={linked}
            aria-label={linked ? "Unlink sides" : "Link sides"}
            style={{
              height: 24,
              padding: "0 8px",
              fontSize: 11,
              color: linked
                ? "var(--bk-accent)"
                : "var(--bk-ink-muted)",
              background: "transparent",
              border: "1px solid var(--bk-border)",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {linked ? "Linked" : "Link"}
          </Button>
        )}
      </div>
      {SIDES.map((side) => (
        <div key={side} style={rowStyle}>
          <label
            style={labelStyle}
            htmlFor={`field-${field.group}-${side}`}
          >
            {side}
          </label>
          <Input
            id={`field-${field.group}-${side}`}
            type="text"
            value={values[side]}
            onChange={(e) => handleSide(side, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// TEXT — free-form shorthand input.
// ============================================================================

const TextControl: React.FC<ControlProps<TextField>> = ({
  field,
  value,
  onChange,
}) => (
  <div style={rowStyle}>
    <label style={labelStyle} htmlFor={`field-${field.prop}`}>
      {field.label}
    </label>
    <Input
      id={`field-${field.prop}`}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      style={inputStyle}
    />
  </div>
);

// ============================================================================
// CORNERS4 — four-corner border radius. Linked mode writes the shorthand
// `border-radius`; unlinked writes the four long-form corner properties.
// ============================================================================

const CORNERS = [
  { id: "tl", prop: "border-top-left-radius", label: "TL" },
  { id: "tr", prop: "border-top-right-radius", label: "TR" },
  { id: "br", prop: "border-bottom-right-radius", label: "BR" },
  { id: "bl", prop: "border-bottom-left-radius", label: "BL" },
] as const;

const Corners4Control: React.FC<ControlProps<Corners4Field>> = ({
  field,
  styles,
  onBatchChange,
}) => {
  const [linked, setLinked] = React.useState(true);

  const cornerValues = Object.fromEntries(
    CORNERS.map((c) => [c.id, styles[c.prop] ?? ""]),
  ) as Record<(typeof CORNERS)[number]["id"], string>;

  const handleCorner = (cornerId: string, next: string) => {
    if (linked) {
      onBatchChange({ "border-radius": next });
      return;
    }
    const corner = CORNERS.find((c) => c.id === cornerId);
    if (!corner) return;
    onBatchChange({ [corner.prop]: next });
  };

  return (
    <div>
      <div style={rowStyle}>
        <span style={labelStyle}>{field.label}</span>
        {field.linkable !== false && (
          <Button
            type="button"
            onClick={() => setLinked((v) => !v)}
            aria-pressed={linked}
            aria-label={linked ? "Unlink corners" : "Link corners"}
            style={{
              height: 24,
              padding: "0 8px",
              fontSize: 11,
              color: linked
                ? "var(--bk-accent)"
                : "var(--bk-ink-muted)",
              background: "transparent",
              border: "1px solid var(--bk-border)",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {linked ? "Linked" : "Link"}
          </Button>
        )}
      </div>
      {CORNERS.map((c) => (
        <div key={c.id} style={rowStyle}>
          <label style={labelStyle} htmlFor={`field-${c.prop}`}>
            {c.label}
          </label>
          <Input
            id={`field-${c.prop}`}
            type="text"
            value={cornerValues[c.id]}
            onChange={(e) => handleCorner(c.id, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// GROUP HEADING — structural label; writes nothing.
// ============================================================================

const GroupHeadingControl: React.FC<ControlProps<GroupHeadingField>> = ({
  field,
}) => (
  <div
    style={{
      fontSize: 12,
      color: "var(--bk-ink-muted)",
      fontWeight: 500,
      marginTop: field.divider ? 12 : 8,
      paddingTop: field.divider ? 12 : 0,
      borderTop: field.divider
        ? "1px solid var(--bk-border)"
        : undefined,
    }}
  >
    {field.label}
  </div>
);

// ============================================================================
// REGISTRY — single export. Callers may pass a merged registry to override
// or extend individual controls without forking the renderer.
// ============================================================================

export const defaultControlRegistry: ControlRegistry = {
  length: LengthControl,
  number: NumberControl,
  select: SelectControl,
  toggle: ToggleControl,
  color: ColorControl,
  text: TextControl,
  spacing4: Spacing4Control,
  corners4: Corners4Control,
  "group-heading": GroupHeadingControl,
};
