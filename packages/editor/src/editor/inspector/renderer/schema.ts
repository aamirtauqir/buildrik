/**
 * Inspector Schema — data-driven section definitions.
 *
 * Week 5-6 foundation (editor-chrome DS rollout, Survivor #4).
 *
 * A SectionSchema is a pure data description of what controls a section
 * renders. The InspectorRenderer + control registry turn that data into
 * React. This replaces hand-written section components with declarative
 * schema files once sections are migrated.
 *
 * Session 1 scope:
 *   - Field union for the canonical control types (length, number, select,
 *     toggle, color, spacing4).
 *   - Schema shape (id, label, density, columns, fields).
 *   - Renderer + control types carried here so the registry and the
 *     renderer share one source of truth.
 *
 * Not in scope yet (future sessions):
 *   - link, shadow, gradient, length-with-chain (token binding)
 *   - Conditional visibility with cross-field dependencies
 *   - Advanced-disclosure grouping
 *
 * @license BSD-3-Clause
 */

import type * as React from "react";

// ============================================================================
// SHARED FIELD SHAPE
// ============================================================================

/** Common attributes every simple (single-property) field carries. */
export interface FieldBase {
  /** The CSS property key this field reads/writes. */
  prop: string;
  /** Visible label. */
  label: string;
  /** Optional tooltip / help text. */
  help?: string;
  /**
   * Pre-render predicate. Receives the section's styles slice and returns
   * false to hide this field. Kept pure so the renderer can memoize.
   */
  conditional?: (styles: Readonly<Record<string, string>>) => boolean;
}

// ============================================================================
// FIELD TYPES
// ============================================================================

export interface LengthField extends FieldBase {
  type: "length";
  /** Allowed units. Defaults to ["px","%","em","rem","vw","vh","auto"]. */
  units?: readonly string[];
  /** Fallback unit applied when the user types a bare number. */
  defaultUnit?: string;
}

export interface NumberField extends FieldBase {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectField extends FieldBase {
  type: "select";
  options: readonly SelectOption[];
}

export interface ToggleField extends FieldBase {
  type: "toggle";
  /** Value written when toggled on. */
  on: string;
  /** Value written when toggled off. */
  off: string;
}

export interface ColorField extends FieldBase {
  type: "color";
}

/**
 * Free-form single-line text input. Used for shorthand values (e.g. the
 * individual `border-top` / `border-right` strings in BorderSection) where
 * a structured control doesn't fit.
 */
export interface TextField extends FieldBase {
  type: "text";
  placeholder?: string;
}

/**
 * Compound field: four-sided spacing (margin or padding). Writes to the four
 * side properties ({group}-top|right|bottom|left) via onBatchChange.
 * `prop` on the base is ignored — kept optional to satisfy the shape while
 * making compounds explicit.
 */
export interface Spacing4Field extends Omit<FieldBase, "prop"> {
  type: "spacing4";
  /** Which CSS property group this controls — drives the four side props. */
  group: "margin" | "padding";
  /** When true, show a link button to apply one value to all four sides. */
  linkable?: boolean;
}

/**
 * Compound field: four-corner border radius. Writes the four long-form
 * properties: border-{top-left,top-right,bottom-right,bottom-left}-radius.
 * When linked, writes the `border-radius` shorthand instead.
 *
 * Separate from Spacing4Field because the prop-name shape is different
 * (prefix/suffix ordering) — collapsing them would push axis logic into
 * the control, which is exactly what the schema is trying to avoid.
 */
export interface Corners4Field extends Omit<FieldBase, "prop"> {
  type: "corners4";
  /** When true, show a link button to write the shorthand instead. Default true. */
  linkable?: boolean;
}

/**
 * Non-editing structural field: a small heading row with a divider, used to
 * group a run of fields under a label ("Individual Borders", "Outline", ...).
 * Reads and writes nothing.
 */
export interface GroupHeadingField {
  type: "group-heading";
  label: string;
  /** When true, render a top divider line above the heading. Default false. */
  divider?: boolean;
}

/** Union of all supported field types. Discriminated on `type`. */
export type Field =
  | LengthField
  | NumberField
  | SelectField
  | ToggleField
  | ColorField
  | TextField
  | Spacing4Field
  | Corners4Field
  | GroupHeadingField;

// ============================================================================
// SECTION SCHEMA
// ============================================================================

export type SectionDensity = "compact" | "standard";

export interface SectionSchema {
  /** Stable id. Matches the existing SectionId union once migrated. */
  id: string;
  /** Visible section title. */
  label: string;
  /** Optional icon — emoji or IconName passed through to the Section header. */
  icon?: string;
  /** Row density. Maps to PanelShell Content density. */
  density?: SectionDensity;
  /** Column layout inside the section. 1 = stacked, 2 = grid. Default: 1. */
  columns?: 1 | 2;
  /** Ordered list of fields. */
  fields: readonly Field[];
}

// ============================================================================
// RENDERER CONTRACT
// ============================================================================

/**
 * Props every registered control receives. The renderer builds this per
 * field from the schema + the section's current styles + the caller's
 * change handlers.
 */
export interface ControlProps<F extends Field = Field> {
  field: F;
  /** Current value for simple fields. For compounds, the empty string. */
  value: string;
  /** Simple single-property change. */
  onChange: (value: string) => void;
  /** Multi-property change. Required for compound fields (spacing4). */
  onBatchChange: (changes: Record<string, string>) => void;
  /** Full styles slice — compounds read multiple keys from here. */
  styles: Readonly<Record<string, string>>;
}

/**
 * Registry shape. One React component per discriminator. Renderer looks up
 * field.type here to resolve the control.
 */
export type ControlRegistry = {
  [K in Field["type"]]: React.FC<ControlProps<Extract<Field, { type: K }>>>;
};
