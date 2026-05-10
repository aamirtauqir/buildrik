/**
 * cssPropertyKinds — pure routing function for the binding editor (S2.1).
 *
 * Given a CSS property name, returns the list of TokenKinds whose tokens are
 * type-compatible with that property's value. Caller filters its full token
 * set by these kinds before passing into TokenPickerPopover, so users only
 * see tokens that make sense for the binding they're editing.
 *
 * Conservative on purpose: when a property could plausibly take multiple
 * kinds (e.g. height could be a fixed sizing token OR a spacing scale value),
 * return both. When a property is genuinely single-kind (border-radius is
 * never anything but a radius token), return one.
 *
 * @license BSD-3-Clause
 */

import type { TokenKind } from "../types";

/**
 * Suggested CSS properties shown in the BindingEditor's "Add binding" menu.
 * Curated to common chrome/layout patterns — not exhaustive. Users can still
 * add bindings for unlisted properties via the binding-row's edit affordance
 * (handled at a higher layer; this list only powers the suggestion menu).
 */
export const COMMON_CSS_PROPERTIES: string[] = [
  "background-color", "color", "border-color",
  "padding", "padding-inline", "padding-block",
  "margin", "margin-inline", "margin-block",
  "gap",
  "height", "width", "max-width",
  "border", "border-radius",
  "box-shadow",
  "font-size", "font-family", "font-weight", "line-height",
  "z-index",
  "opacity",
  "transition-duration",
];

const COLOR_PROPS = new Set([
  "color", "background-color", "border-color",
  "outline-color", "fill", "stroke",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
]);

const LENGTH_PROPS = new Set([
  "padding", "padding-inline", "padding-block",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "padding-inline-start", "padding-inline-end",
  "margin", "margin-inline", "margin-block",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "margin-inline-start", "margin-inline-end",
  "gap", "row-gap", "column-gap",
  "height", "width",
  "min-height",
  "top", "right", "bottom", "left",
]);

const WIDTH_BREAKPOINT_PROPS = new Set([
  "max-width", "min-width",
]);

const FONT_SIZE_PROPS = new Set([
  "font-size", "line-height", "letter-spacing",
]);

const FONT_FAMILY_PROPS = new Set([
  "font-family",
]);

const FONT_WEIGHT_PROPS = new Set([
  "font-weight",
]);

const MOTION_PROPS = new Set([
  "transition-duration", "animation-duration",
  "transition-delay", "animation-delay",
  "transition-timing-function", "animation-timing-function",
]);

const BORDER_COMPOSITE_PROPS = new Set([
  "border", "border-top", "border-right", "border-bottom", "border-left",
  "border-inline", "border-block",
]);

export function cssPropertyKinds(cssProperty: string): TokenKind[] {
  if (COLOR_PROPS.has(cssProperty)) return ["color"];
  if (cssProperty === "border-radius") return ["radius"];
  if (cssProperty === "box-shadow") return ["shadow"];
  if (cssProperty === "z-index") return ["zindex"];
  if (cssProperty === "opacity") return ["opacity"];
  if (WIDTH_BREAKPOINT_PROPS.has(cssProperty)) return ["sizing", "breakpoint"];
  if (LENGTH_PROPS.has(cssProperty)) return ["spacing", "sizing"];
  if (FONT_SIZE_PROPS.has(cssProperty)) return ["type", "spacing"];
  if (FONT_FAMILY_PROPS.has(cssProperty)) return ["type"];
  if (FONT_WEIGHT_PROPS.has(cssProperty)) return ["type"];
  if (MOTION_PROPS.has(cssProperty)) return ["motion"];
  if (BORDER_COMPOSITE_PROPS.has(cssProperty)) return ["border"];
  return [];
}
