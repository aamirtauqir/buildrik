/**
 * PropertySearchResults — flat property-level search view.
 *
 * Replaces the per-section rendering whenever the search query is non-empty.
 * Instead of filtering which sections render (the old keyword-section match),
 * this scans a flat catalog of searchable properties and renders only the rows
 * that match the query. Labels, keywords, and CSS property names are all
 * searchable — typing "radius" shows border-radius; typing "center" surfaces
 * text-align, justify-content, and align-items in one view.
 *
 * Each result reuses an existing input primitive (InputWithUnit, ColorInput,
 * SelectRow) so the controls behave identically to their in-section versions.
 * Edits flow through the same `onChange` handler as the tabs, so there's no
 * parallel state to keep in sync.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ColorInput, InputWithUnit, SelectRow } from "../shared/controls";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import type { UseAdvancedSettingsReturn } from "../hooks/useAdvancedSettings";

// ============================================================================
// TYPES
// ============================================================================

type EntryType = "unit" | "color" | "select" | "number";

interface CatalogEntry {
  /** Human-facing label */
  label: string;
  /** CSS property name (the key used in styles object) */
  property: string;
  /** Extra keywords to match against the search query */
  keywords: string[];
  /** Which input primitive to render */
  type: EntryType;
  /** Category header shown above grouped results */
  category: "Layout" | "Size" | "Spacing" | "Typography" | "Background" | "Border" | "Effects";
  /** Options for `select` type */
  options?: { value: string; label: string }[];
  /** Units override for `unit` type */
  units?: string[];
  /** Whether this property is advanced (behind More settings toggle) */
  isAdvanced?: boolean;
  /** Which group this property belongs to (e.g., "layout", "size", "spacing") */
  groupId?: string;
}

export interface PropertySearchResultsProps {
  searchQuery: string;
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  advancedState?: UseAdvancedSettingsReturn;
}

// ============================================================================
// CSS PROPERTY TO GROUP MAPPING
// ============================================================================
// Maps CSS property names to their group IDs (from the properties registry).
// This allows search results to auto-expand advanced disclosure groups.
const CSS_TO_GROUP: Record<string, string> = {
  // Layout
  display: "layout",
  position: "layout",
  visibility: "layout",
  "box-sizing": "layout",
  isolation: "layout",
  contain: "layout",
  top: "layout",
  right: "layout",
  bottom: "layout",
  left: "layout",
  "z-index": "layout",
  overflow: "layout",
  "overflow-x": "layout",
  "overflow-y": "layout",
  float: "layout",
  clear: "layout",
  "scroll-behavior": "layout",
  "scroll-snap-type": "layout",
  "scroll-snap-align": "layout",

  // Size
  width: "size",
  height: "size",
  "min-width": "size",
  "max-width": "size",
  "min-height": "size",
  "max-height": "size",
  "aspect-ratio": "size",

  // Spacing
  padding: "spacing",
  "padding-top": "spacing",
  "padding-right": "spacing",
  "padding-bottom": "spacing",
  "padding-left": "spacing",
  margin: "spacing",
  "margin-top": "spacing",
  "margin-right": "spacing",
  "margin-bottom": "spacing",
  "margin-left": "spacing",
  gap: "spacing",
  "row-gap": "spacing",
  "column-gap": "spacing",

  // Flex
  "flex-direction": "flex",
  "justify-content": "flex",
  "align-items": "flex",
  "align-content": "flex",
  "flex-wrap": "flex",
  "flex-grow": "flex",
  "flex-shrink": "flex",
  "flex-basis": "flex",

  // Grid
  "grid-template-columns": "grid",
  "grid-template-rows": "grid",
  "grid-gap": "grid",
  "grid-column": "grid",
  "grid-row": "grid",
  "grid-auto-flow": "grid",

  // Typography
  "font-size": "typography",
  "font-weight": "typography",
  "line-height": "typography",
  "letter-spacing": "typography",
  color: "typography",
  "text-align": "typography",
  "text-transform": "typography",
  "white-space": "typography",
  "word-break": "typography",
  "text-decoration": "typography",

  // Background
  "background-color": "background",

  // Border
  "border-width": "border",
  "border-style": "border",
  "border-color": "border",
  "border-radius": "border",

  // Effects
  opacity: "effects",
  "box-shadow": "effects",
  transform: "effects",
  transition: "effects",
  filter: "effects",
  "backdrop-filter": "effects",
  "mix-blend-mode": "effects",
  cursor: "effects",
  "user-select": "effects",
  "pointer-events": "effects",
  "object-fit": "effects",
  "object-position": "effects",
};

// ============================================================================
// TIER MAPPING (BASIC vs ADVANCED)
// ============================================================================
// Maps CSS property names to whether they are "advanced" (behind More settings).
// Based on the properties registry tier values.
const PROPERTY_TIERS: Record<string, "basic" | "advanced"> = {
  // Layout — advanced
  visibility: "advanced",
  "box-sizing": "advanced",
  isolation: "advanced",
  contain: "advanced",
  "overflow-x": "advanced",
  "overflow-y": "advanced",
  "scroll-behavior": "advanced",
  "scroll-snap-type": "advanced",
  "scroll-snap-align": "advanced",

  // Size — advanced
  "min-width": "advanced",
  "max-width": "advanced",
  "min-height": "advanced",
  "max-height": "advanced",
  "aspect-ratio": "advanced",

  // Spacing — advanced
  "row-gap": "advanced",
  "column-gap": "advanced",

  // Position — advanced
  "z-index": "advanced",

  // Flex — advanced (child properties)
  "flex-grow": "advanced",
  "flex-shrink": "advanced",
  "flex-basis": "advanced",

  // Effects — advanced
  "pointer-events": "advanced",
};

// ============================================================================
// CATALOG
// ============================================================================

const DISPLAY_OPTS = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "inline-flex", label: "Inline flex" },
  { value: "grid", label: "Grid" },
  { value: "inline", label: "Inline" },
  { value: "inline-block", label: "Inline block" },
  { value: "none", label: "None" },
];

const POSITION_OPTS = [
  { value: "static", label: "Static" },
  { value: "relative", label: "Relative" },
  { value: "absolute", label: "Absolute" },
  { value: "fixed", label: "Fixed" },
  { value: "sticky", label: "Sticky" },
];

const OVERFLOW_OPTS = [
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
  { value: "scroll", label: "Scroll" },
  { value: "auto", label: "Auto" },
];

const FONT_WEIGHT_OPTS = [
  { value: "300", label: "300 Light" },
  { value: "400", label: "400 Regular" },
  { value: "500", label: "500 Medium" },
  { value: "600", label: "600 Semibold" },
  { value: "700", label: "700 Bold" },
  { value: "800", label: "800 Extrabold" },
];

const TEXT_ALIGN_OPTS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
];

const TEXT_TRANSFORM_OPTS = [
  { value: "none", label: "None" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "capitalize", label: "Capitalize" },
];

const BORDER_STYLE_OPTS = [
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
  { value: "none", label: "None" },
];

const CURSOR_OPTS = [
  { value: "auto", label: "Auto" },
  { value: "default", label: "Default" },
  { value: "pointer", label: "Pointer" },
  { value: "text", label: "Text" },
  { value: "move", label: "Move" },
  { value: "grab", label: "Grab" },
  { value: "grabbing", label: "Grabbing" },
  { value: "not-allowed", label: "Not allowed" },
  { value: "wait", label: "Wait" },
  { value: "crosshair", label: "Crosshair" },
];

const USER_SELECT_OPTS = [
  { value: "auto", label: "Auto" },
  { value: "none", label: "None" },
  { value: "text", label: "Text" },
  { value: "all", label: "All" },
];

const OBJECT_FIT_OPTS = [
  { value: "fill", label: "Fill" },
  { value: "contain", label: "Contain" },
  { value: "cover", label: "Cover" },
  { value: "none", label: "None" },
  { value: "scale-down", label: "Scale down" },
];

const WHITE_SPACE_OPTS = [
  { value: "normal", label: "Normal" },
  { value: "nowrap", label: "No wrap" },
  { value: "pre", label: "Pre" },
  { value: "pre-wrap", label: "Pre wrap" },
  { value: "pre-line", label: "Pre line" },
];

const JUSTIFY_OPTS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Between" },
  { value: "space-around", label: "Around" },
  { value: "space-evenly", label: "Evenly" },
];

const ALIGN_OPTS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
  { value: "baseline", label: "Baseline" },
];

const CATALOG: CatalogEntry[] = [
  // Layout
  { label: "Display", property: "display", keywords: ["display", "block", "flex", "grid"], type: "select", category: "Layout", options: DISPLAY_OPTS, isAdvanced: false, groupId: "layout" },
  { label: "Position", property: "position", keywords: ["position", "absolute", "relative", "fixed"], type: "select", category: "Layout", options: POSITION_OPTS, isAdvanced: false, groupId: "layout" },
  { label: "Top", property: "top", keywords: ["top", "offset"], type: "unit", category: "Layout", isAdvanced: false, groupId: "layout" },
  { label: "Right", property: "right", keywords: ["right", "offset"], type: "unit", category: "Layout", isAdvanced: false, groupId: "layout" },
  { label: "Bottom", property: "bottom", keywords: ["bottom", "offset"], type: "unit", category: "Layout", isAdvanced: false, groupId: "layout" },
  { label: "Left", property: "left", keywords: ["left", "offset"], type: "unit", category: "Layout", isAdvanced: false, groupId: "layout" },
  { label: "Z-index", property: "z-index", keywords: ["z", "zindex", "z-index", "stack"], type: "number", category: "Layout", isAdvanced: true, groupId: "layout" },
  { label: "Overflow", property: "overflow", keywords: ["overflow", "scroll", "clip"], type: "select", category: "Layout", options: OVERFLOW_OPTS, isAdvanced: false, groupId: "layout" },

  // Size
  { label: "Width", property: "width", keywords: ["width", "w", "size"], type: "unit", category: "Size", isAdvanced: false, groupId: "size" },
  { label: "Height", property: "height", keywords: ["height", "h", "size"], type: "unit", category: "Size", isAdvanced: false, groupId: "size" },
  { label: "Min width", property: "min-width", keywords: ["min", "width"], type: "unit", category: "Size", isAdvanced: true, groupId: "size" },
  { label: "Max width", property: "max-width", keywords: ["max", "width"], type: "unit", category: "Size", isAdvanced: true, groupId: "size" },
  { label: "Min height", property: "min-height", keywords: ["min", "height"], type: "unit", category: "Size", isAdvanced: true, groupId: "size" },
  { label: "Max height", property: "max-height", keywords: ["max", "height"], type: "unit", category: "Size", isAdvanced: true, groupId: "size" },

  // Spacing
  { label: "Padding", property: "padding", keywords: ["padding", "p", "space", "inside"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Padding top", property: "padding-top", keywords: ["padding", "top"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Padding right", property: "padding-right", keywords: ["padding", "right"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Padding bottom", property: "padding-bottom", keywords: ["padding", "bottom"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Padding left", property: "padding-left", keywords: ["padding", "left"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Margin", property: "margin", keywords: ["margin", "m", "space", "outside"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Margin top", property: "margin-top", keywords: ["margin", "top"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Margin right", property: "margin-right", keywords: ["margin", "right"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Margin bottom", property: "margin-bottom", keywords: ["margin", "bottom"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Margin left", property: "margin-left", keywords: ["margin", "left"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },
  { label: "Gap", property: "gap", keywords: ["gap", "space", "between"], type: "unit", category: "Spacing", isAdvanced: false, groupId: "spacing" },

  // Typography
  { label: "Font size", property: "font-size", keywords: ["font", "size", "text"], type: "unit", category: "Typography", isAdvanced: false, groupId: "typography" },
  { label: "Font weight", property: "font-weight", keywords: ["font", "weight", "bold"], type: "select", category: "Typography", options: FONT_WEIGHT_OPTS, isAdvanced: false, groupId: "typography" },
  { label: "Line height", property: "line-height", keywords: ["line", "height", "leading"], type: "unit", category: "Typography", isAdvanced: false, groupId: "typography" },
  { label: "Letter spacing", property: "letter-spacing", keywords: ["letter", "spacing", "tracking", "kerning"], type: "unit", category: "Typography", isAdvanced: false, groupId: "typography" },
  { label: "Text color", property: "color", keywords: ["color", "text", "foreground"], type: "color", category: "Typography", isAdvanced: false, groupId: "typography" },
  { label: "Text align", property: "text-align", keywords: ["align", "center", "left", "right"], type: "select", category: "Typography", options: TEXT_ALIGN_OPTS, isAdvanced: false, groupId: "typography" },
  { label: "Text transform", property: "text-transform", keywords: ["transform", "uppercase", "lowercase", "capitalize"], type: "select", category: "Typography", options: TEXT_TRANSFORM_OPTS, isAdvanced: false, groupId: "typography" },

  // Background
  { label: "Background color", property: "background-color", keywords: ["background", "bg", "color", "fill"], type: "color", category: "Background", isAdvanced: false, groupId: "background" },

  // Border
  { label: "Border width", property: "border-width", keywords: ["border", "width", "stroke"], type: "unit", category: "Border", isAdvanced: false, groupId: "border" },
  { label: "Border style", property: "border-style", keywords: ["border", "style", "solid", "dashed"], type: "select", category: "Border", options: BORDER_STYLE_OPTS, isAdvanced: false, groupId: "border" },
  { label: "Border color", property: "border-color", keywords: ["border", "color", "stroke"], type: "color", category: "Border", isAdvanced: false, groupId: "border" },
  { label: "Border radius", property: "border-radius", keywords: ["border", "radius", "round", "corner"], type: "unit", category: "Border", isAdvanced: false, groupId: "border" },

  // Flex
  { label: "Flex grow", property: "flex-grow", keywords: ["flex", "grow"], type: "number", category: "Layout", isAdvanced: true, groupId: "flex" },
  { label: "Flex shrink", property: "flex-shrink", keywords: ["flex", "shrink"], type: "number", category: "Layout", isAdvanced: true, groupId: "flex" },
  { label: "Flex basis", property: "flex-basis", keywords: ["flex", "basis"], type: "unit", category: "Layout", isAdvanced: true, groupId: "flex" },
  { label: "Align self", property: "align-self", keywords: ["align", "self"], type: "select", category: "Layout", options: ALIGN_OPTS, isAdvanced: false, groupId: "flex" },
  { label: "Justify self", property: "justify-self", keywords: ["justify", "self"], type: "select", category: "Layout", options: ALIGN_OPTS, isAdvanced: false, groupId: "flex" },
  { label: "Justify content", property: "justify-content", keywords: ["justify", "content", "center", "space"], type: "select", category: "Layout", options: JUSTIFY_OPTS, isAdvanced: false, groupId: "flex" },
  { label: "Align items", property: "align-items", keywords: ["align", "items", "center"], type: "select", category: "Layout", options: ALIGN_OPTS, isAdvanced: false, groupId: "flex" },
  { label: "Order", property: "order", keywords: ["order", "flex"], type: "number", category: "Layout", isAdvanced: false, groupId: "flex" },

  // Size extras
  { label: "Object fit", property: "object-fit", keywords: ["object", "fit", "cover", "contain", "image"], type: "select", category: "Size", options: OBJECT_FIT_OPTS, isAdvanced: false, groupId: "size" },
  { label: "Object position", property: "object-position", keywords: ["object", "position"], type: "unit", category: "Size", isAdvanced: false, groupId: "size" },
  { label: "Aspect ratio", property: "aspect-ratio", keywords: ["aspect", "ratio"], type: "unit", category: "Size", units: ["auto"], isAdvanced: true, groupId: "size" },

  // Typography extras
  { label: "White space", property: "white-space", keywords: ["white", "space", "wrap", "nowrap"], type: "select", category: "Typography", options: WHITE_SPACE_OPTS, isAdvanced: false, groupId: "typography" },
  { label: "Word break", property: "word-break", keywords: ["word", "break"], type: "unit", category: "Typography", units: ["normal"], isAdvanced: false, groupId: "typography" },
  { label: "Text decoration", property: "text-decoration", keywords: ["text", "decoration", "underline", "strike"], type: "unit", category: "Typography", units: ["none"], isAdvanced: false, groupId: "typography" },

  // Effects
  { label: "Opacity", property: "opacity", keywords: ["opacity", "alpha", "transparent"], type: "number", category: "Effects", isAdvanced: false, groupId: "effects" },
  { label: "Box shadow", property: "box-shadow", keywords: ["shadow", "box", "drop"], type: "unit", category: "Effects", units: ["px"], isAdvanced: false, groupId: "effects" },
  { label: "Transform", property: "transform", keywords: ["transform", "rotate", "scale", "translate"], type: "unit", category: "Effects", units: ["deg"], isAdvanced: false, groupId: "effects" },
  { label: "Transition", property: "transition", keywords: ["transition", "duration", "animate", "ease"], type: "unit", category: "Effects", units: ["ms", "s"], isAdvanced: false, groupId: "effects" },
  { label: "Filter", property: "filter", keywords: ["filter", "blur", "brightness", "grayscale"], type: "unit", category: "Effects", units: ["px"], isAdvanced: false, groupId: "effects" },
  { label: "Backdrop filter", property: "backdrop-filter", keywords: ["backdrop", "blur", "glass"], type: "unit", category: "Effects", units: ["px"], isAdvanced: false, groupId: "effects" },
  { label: "Mix blend mode", property: "mix-blend-mode", keywords: ["blend", "mix", "multiply", "screen"], type: "unit", category: "Effects", units: ["normal"], isAdvanced: false, groupId: "effects" },
  { label: "Cursor", property: "cursor", keywords: ["cursor", "pointer", "hand", "grab"], type: "select", category: "Effects", options: CURSOR_OPTS, isAdvanced: false, groupId: "effects" },
  { label: "User select", property: "user-select", keywords: ["user", "select", "selectable"], type: "select", category: "Effects", options: USER_SELECT_OPTS, isAdvanced: true, groupId: "effects" },
  { label: "Pointer events", property: "pointer-events", keywords: ["pointer", "events", "click"], type: "unit", category: "Effects", units: ["auto"], isAdvanced: true, groupId: "effects" },
];

// ============================================================================
// MATCHING
// ============================================================================

function matches(entry: CatalogEntry, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;
  if (entry.label.toLowerCase().includes(q)) return true;
  if (entry.property.toLowerCase().includes(q)) return true;
  return entry.keywords.some((kw) => kw.toLowerCase().includes(q));
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    padding: "10px 14px",
  },
  empty: {
    padding: "24px 14px",
    textAlign: "center" as const,
    fontSize: 12,
    color: INSPECTOR_TOKENS.textMuted,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    color: INSPECTOR_TOKENS.textMuted,
    letterSpacing: "0.05em",
    marginTop: 14,
    marginBottom: 6,
  },
  firstCategoryLabel: {
    marginTop: 4,
  },
  resultCount: {
    fontSize: 11,
    color: INSPECTOR_TOKENS.textMuted,
    marginBottom: 8,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const PropertySearchResults: React.FC<PropertySearchResultsProps> = ({
  searchQuery,
  styles: elementStyles,
  onChange,
  advancedState,
}) => {
  const matched = React.useMemo(
    () => CATALOG.filter((entry) => matches(entry, searchQuery)),
    [searchQuery]
  );

  // Auto-expand groups for advanced matches
  React.useEffect(() => {
    if (!advancedState) return;

    // Find all unique group IDs that have advanced matches
    const groupsToExpand = new Set<string>();
    for (const entry of matched) {
      if (entry.isAdvanced && entry.groupId) {
        groupsToExpand.add(entry.groupId);
      }
    }

    // Expand each group
    for (const groupId of groupsToExpand) {
      advancedState.expand(groupId);
    }
  }, [matched, advancedState]);

  if (matched.length === 0) {
    return (
      <div style={styles.empty}>
        No properties match &ldquo;{searchQuery}&rdquo;.
        <br />
        Try &ldquo;radius&rdquo;, &ldquo;padding&rdquo;, or &ldquo;color&rdquo;.
      </div>
    );
  }

  // Group by category preserving CATALOG ordering so the list is stable.
  const grouped = new Map<CatalogEntry["category"], CatalogEntry[]>();
  for (const entry of matched) {
    const bucket = grouped.get(entry.category) ?? [];
    bucket.push(entry);
    grouped.set(entry.category, bucket);
  }

  let isFirst = true;
  return (
    <div style={styles.container}>
      <div style={styles.resultCount}>
        {matched.length} match{matched.length !== 1 ? "es" : ""}
      </div>
      {Array.from(grouped.entries()).map(([category, entries]) => {
        const labelStyle = isFirst
          ? { ...styles.categoryLabel, ...styles.firstCategoryLabel }
          : styles.categoryLabel;
        isFirst = false;
        return (
          <React.Fragment key={category}>
            <div style={labelStyle}>{category}</div>
            {entries.map((entry) => (
              <SearchResultRow
                key={entry.property}
                entry={entry}
                value={elementStyles[entry.property] || ""}
                onChange={(v) => onChange(entry.property, v)}
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================================
// RESULT ROW
// ============================================================================

const SearchResultRow: React.FC<{
  entry: CatalogEntry;
  value: string;
  onChange: (value: string) => void;
}> = ({ entry, value, onChange }) => {
  switch (entry.type) {
    case "color":
      return <ColorInput label={entry.label} value={value} onChange={onChange} />;
    case "select":
      return (
        <SelectRow
          label={entry.label}
          value={value}
          onChange={onChange}
          options={entry.options ?? []}
        />
      );
    case "number":
    case "unit":
      return (
        <InputWithUnit
          label={entry.label}
          value={value}
          onChange={onChange}
          units={entry.units}
        />
      );
    default:
      return null;
  }
};

export default PropertySearchResults;
