/**
 * Properties Registry
 * Loads and provides access to property definitions from properties.json spec.
 * Each property defines its type, CSS mapping, units, and behavior flags.
 *
 * @license BSD-3-Clause
 */

// ============================================================================
// TYPES
// ============================================================================

export type PropertyType =
  | "text"
  | "number"
  | "dimension"
  | "select"
  | "segmented"
  | "toggle"
  | "color"
  | "tokenColor"
  | "tokenNumber"
  | "tokenSelect"
  | "box"
  | "border"
  | "borderSide"
  | "outline"
  | "shadow"
  | "shadowPreset"
  | "filter"
  | "transform"
  | "transformPreset"
  | "transformRotateOnly"
  | "transition"
  | "transitionPreset"
  | "animation"
  | "backgroundImage"
  | "gradientPreset"
  | "gridTemplate"
  | "gridItemPlacement"
  | "anchor"
  | "textDecoration"
  | "linkPicker"
  | "assetPicker"
  | "iconPicker"
  | "triggerPicker"
  | "collectionPicker"
  | "fieldPicker"
  | "slotPicker"
  | "classList"
  | "classPicker"
  | "reorderList"
  | "keyValueList"
  | "interactionList"
  | "conditionGroups"
  | "simpleCondition"
  | "timingControls"
  | "varsEditor"
  | "mappingBuilder"
  | "filterBuilder"
  | "sortBuilder"
  | "previewData"
  | "action"
  | "cssAdd"
  | "cssList"
  | "itemsEditor"
  | "slidesEditor"
  | "menuEditor"
  | "fieldsEditor"
  | "stateEditor"
  | "toggleList"
  | "toggleWithNumber";

export interface PropertyDefinition {
  /** The CSS property this maps to (undefined for uiOnly) */
  css?: string;
  /** Whether this is a UI-only property (not a CSS property) */
  uiOnly?: boolean;
  /** The control type to render */
  type: PropertyType;
  /** Design token category (for tokenColor, tokenNumber, tokenSelect) */
  token?: string;
  /** Available units for number/dimension types */
  units?: string[];
  /** Options for select/segmented types */
  options?: string[];
  /** Min value for number types */
  min?: number;
  /** Max value for number types */
  max?: number;
  /** Step value for number types */
  step?: number;
  /** Whether this property supports responsive (per-breakpoint) values */
  responsive: boolean;
  /** Whether this property supports pseudo-state values (hover, focus, etc.) */
  states: boolean;
  /** "basic" = shown by default. "advanced" = hidden behind More settings toggle. */
  tier: "basic" | "advanced";
}

// ============================================================================
// PROPERTY REGISTRY
// ============================================================================

export const PROPERTIES: Record<string, PropertyDefinition> = {
  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT
  // ─────────────────────────────────────────────────────────────────────────
  "layout.display": {
    css: "display",
    type: "select",
    options: ["block", "inline", "inline-block", "flex", "grid", "none"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "layout.visibility": {
    css: "visibility",
    type: "select",
    options: ["visible", "hidden"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "layout.boxSizing": {
    css: "box-sizing",
    type: "select",
    options: ["border-box", "content-box"],
    responsive: false,
    states: false,
    tier: "advanced",
  },
  "layout.isolation": {
    css: "isolation",
    type: "select",
    options: ["auto", "isolate"],
    responsive: false,
    states: false,
    tier: "advanced",
  },
  "layout.contain": { css: "contain", type: "text", responsive: false, states: false, tier: "advanced" },

  // ─────────────────────────────────────────────────────────────────────────
  // SPACING
  // ─────────────────────────────────────────────────────────────────────────
  "spacing.margin": {
    css: "margin",
    type: "box",
    units: ["px", "rem", "%", "vh", "vw"],
    token: "space",
    responsive: true,
    states: false,
    tier: "basic",
  },
  "spacing.padding": {
    css: "padding",
    type: "box",
    units: ["px", "rem", "%", "vh", "vw"],
    token: "space",
    responsive: true,
    states: false,
    tier: "basic",
  },
  "spacing.negativeMargin": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "advanced" },
  "layout.gap": {
    css: "gap",
    type: "number",
    units: ["px", "rem"],
    token: "space",
    responsive: true,
    states: false,
    tier: "basic",
  },
  "spacing.rowGap": {
    css: "row-gap",
    type: "number",
    units: ["px", "rem"],
    token: "space",
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "spacing.columnGap": {
    css: "column-gap",
    type: "number",
    units: ["px", "rem"],
    token: "space",
    responsive: true,
    states: false,
    tier: "advanced",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SIZE
  // ─────────────────────────────────────────────────────────────────────────
  "size.width": {
    css: "width",
    type: "dimension",
    units: ["auto", "px", "%", "vw", "rem"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "size.height": {
    css: "height",
    type: "dimension",
    units: ["auto", "px", "%", "vh", "rem"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "size.minWidth": {
    css: "min-width",
    type: "dimension",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "size.maxWidth": {
    css: "max-width",
    type: "dimension",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "size.minHeight": {
    css: "min-height",
    type: "dimension",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "size.maxHeight": {
    css: "max-height",
    type: "dimension",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "size.aspectRatio": { css: "aspect-ratio", type: "text", responsive: true, states: false, tier: "advanced" },

  // ─────────────────────────────────────────────────────────────────────────
  // POSITION
  // ─────────────────────────────────────────────────────────────────────────
  "position.position": {
    css: "position",
    type: "select",
    options: ["static", "relative", "absolute", "fixed", "sticky"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "position.anchorUI": { uiOnly: true, type: "anchor", responsive: true, states: false, tier: "basic" },
  "position.inset": {
    css: "inset",
    type: "box",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "position.zIndex": { css: "z-index", type: "number", responsive: true, states: false, tier: "advanced" },

  // ─────────────────────────────────────────────────────────────────────────
  // OVERFLOW
  // ─────────────────────────────────────────────────────────────────────────
  "overflow.overflow": {
    css: "overflow",
    type: "select",
    options: ["visible", "hidden", "scroll", "auto"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "overflow.overflowX": {
    css: "overflow-x",
    type: "select",
    options: ["visible", "hidden", "scroll", "auto"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "overflow.overflowY": {
    css: "overflow-y",
    type: "select",
    options: ["visible", "hidden", "scroll", "auto"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "overflow.scrollBehavior": {
    css: "scroll-behavior",
    type: "select",
    options: ["auto", "smooth"],
    responsive: false,
    states: false,
    tier: "advanced",
  },
  "overflow.scrollSnapType": {
    css: "scroll-snap-type",
    type: "select",
    options: [
      "none",
      "x mandatory",
      "y mandatory",
      "both mandatory",
      "x proximity",
      "y proximity",
      "both proximity",
    ],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "overflow.scrollSnapAlign": {
    css: "scroll-snap-align",
    type: "select",
    options: ["none", "start", "center", "end"],
    responsive: true,
    states: false,
    tier: "advanced",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLEX
  // ─────────────────────────────────────────────────────────────────────────
  "flex.direction": {
    css: "flex-direction",
    type: "select",
    options: ["row", "column", "row-reverse", "column-reverse"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "flex.justify": {
    css: "justify-content",
    type: "select",
    options: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "flex.align": {
    css: "align-items",
    type: "select",
    options: ["stretch", "flex-start", "center", "flex-end", "baseline"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "flex.wrap": {
    css: "flex-wrap",
    type: "select",
    options: ["nowrap", "wrap", "wrap-reverse"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "flex.alignContent": {
    css: "align-content",
    type: "select",
    options: ["stretch", "flex-start", "center", "flex-end", "space-between", "space-around"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "flex.childGrow": { css: "flex-grow", type: "number", responsive: true, states: false, tier: "basic" },
  "flex.childShrink": { css: "flex-shrink", type: "number", responsive: true, states: false, tier: "advanced" },
  "flex.childBasis": {
    css: "flex-basis",
    type: "dimension",
    units: ["auto", "px", "%", "rem"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "flex.childOrder": { css: "order", type: "number", responsive: true, states: false, tier: "advanced" },
  "flex.childAlignSelf": {
    css: "align-self",
    type: "select",
    options: ["auto", "stretch", "flex-start", "center", "flex-end", "baseline"],
    responsive: true,
    states: false,
    tier: "advanced",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GRID
  // ─────────────────────────────────────────────────────────────────────────
  "grid.columns": {
    css: "grid-template-columns",
    type: "gridTemplate",
    responsive: true,
    states: false,
    tier: "basic",
  },
  "grid.rows": { css: "grid-template-rows", type: "gridTemplate", responsive: true, states: false, tier: "basic" },
  "grid.areas": { css: "grid-template-areas", type: "text", responsive: true, states: false, tier: "advanced" },
  "grid.autoFlow": {
    css: "grid-auto-flow",
    type: "select",
    options: ["row", "column", "dense", "row dense", "column dense"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "grid.autoRows": { css: "grid-auto-rows", type: "text", responsive: true, states: false, tier: "advanced" },
  "grid.autoCols": { css: "grid-auto-columns", type: "text", responsive: true, states: false, tier: "advanced" },
  "grid.placeItems": {
    css: "place-items",
    type: "select",
    options: ["start", "center", "end", "stretch"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "grid.placeContent": {
    css: "place-content",
    type: "select",
    options: ["start", "center", "end", "stretch", "space-between", "space-around", "space-evenly"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "grid.placeSelf": {
    css: "place-self",
    type: "select",
    options: ["auto", "start", "center", "end", "stretch"],
    responsive: true,
    states: false,
    tier: "advanced",
  },
  "grid.itemPlacement": {
    uiOnly: true,
    type: "gridItemPlacement",
    responsive: true,
    states: false,
    tier: "basic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TYPOGRAPHY
  // ─────────────────────────────────────────────────────────────────────────
  "typography.fontFamily": {
    css: "font-family",
    type: "tokenSelect",
    token: "fontFamily",
    responsive: true,
    states: true,
    tier: "basic",
  },
  "typography.fontSize": {
    css: "font-size",
    type: "tokenNumber",
    token: "fontSize",
    units: ["px", "rem"],
    responsive: true,
    states: true,
    tier: "basic",
  },
  "typography.fontWeight": {
    css: "font-weight",
    type: "select",
    options: ["300", "400", "500", "600", "700", "800"],
    responsive: true,
    states: true,
    tier: "basic",
  },
  "typography.lineHeight": {
    css: "line-height",
    type: "number",
    units: ["px", "em"],
    responsive: true,
    states: true,
    tier: "basic",
  },
  "typography.textAlign": {
    css: "text-align",
    type: "segmented",
    options: ["left", "center", "right", "justify"],
    responsive: true,
    states: true,
    tier: "basic",
  },
  "typography.letterSpacing": {
    css: "letter-spacing",
    type: "number",
    units: ["px", "em"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "typography.textTransform": {
    css: "text-transform",
    type: "select",
    options: ["none", "uppercase", "lowercase", "capitalize"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "typography.textDecoration": {
    css: "text-decoration",
    type: "textDecoration",
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "typography.whiteSpace": {
    css: "white-space",
    type: "select",
    options: ["normal", "nowrap", "pre", "pre-wrap", "pre-line"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "typography.wordBreak": {
    css: "word-break",
    type: "select",
    options: ["normal", "break-all", "keep-all", "break-word"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "typography.overflowWrap": {
    css: "overflow-wrap",
    type: "select",
    options: ["normal", "anywhere", "break-word"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "typography.textOverflow": {
    css: "text-overflow",
    type: "select",
    options: ["clip", "ellipsis"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "typography.textShadow": { css: "text-shadow", type: "shadow", responsive: true, states: true, tier: "advanced" },

  // ─────────────────────────────────────────────────────────────────────────
  // COLORS
  // ─────────────────────────────────────────────────────────────────────────
  "colors.textColor": {
    css: "color",
    type: "tokenColor",
    token: "color",
    responsive: true,
    states: true,
    tier: "basic",
  },
  "colors.borderColor": {
    css: "border-color",
    type: "tokenColor",
    token: "color",
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "colors.mixBlendMode": {
    css: "mix-blend-mode",
    type: "select",
    options: ["normal", "multiply", "screen", "overlay", "darken", "lighten"],
    responsive: false,
    states: true,
    tier: "advanced",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BACKGROUND
  // ─────────────────────────────────────────────────────────────────────────
  "background.backgroundColor": {
    css: "background-color",
    type: "tokenColor",
    token: "color",
    responsive: true,
    states: true,
    tier: "basic",
  },
  "background.backgroundImage": {
    css: "background-image",
    type: "backgroundImage",
    responsive: true,
    states: true,
    tier: "basic",
  },
  "background.gradientPreset": {
    uiOnly: true,
    type: "gradientPreset",
    responsive: true,
    states: true,
    tier: "basic",
  },
  "background.size": {
    css: "background-size",
    type: "select",
    options: ["auto", "cover", "contain"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "background.position": {
    css: "background-position",
    type: "select",
    options: [
      "left top",
      "center top",
      "right top",
      "left center",
      "center",
      "right center",
      "left bottom",
      "center bottom",
      "right bottom",
    ],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "background.repeat": {
    css: "background-repeat",
    type: "select",
    options: ["repeat", "no-repeat", "repeat-x", "repeat-y"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "background.attachment": {
    css: "background-attachment",
    type: "select",
    options: ["scroll", "fixed", "local"],
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "background.clip": {
    css: "background-clip",
    type: "select",
    options: ["border-box", "padding-box", "content-box", "text"],
    responsive: false,
    states: true,
    tier: "advanced",
  },
  "background.origin": {
    css: "background-origin",
    type: "select",
    options: ["border-box", "padding-box", "content-box"],
    responsive: false,
    states: true,
    tier: "advanced",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BORDER
  // ─────────────────────────────────────────────────────────────────────────
  "border.border": { uiOnly: true, type: "border", responsive: true, states: true, tier: "basic" },
  "border.radius": {
    css: "border-radius",
    type: "tokenNumber",
    token: "radius",
    units: ["px", "rem"],
    responsive: true,
    states: true,
    tier: "basic",
  },
  "border.borderTop": { css: "border-top", type: "borderSide", responsive: true, states: true, tier: "advanced" },
  "border.borderRight": { css: "border-right", type: "borderSide", responsive: true, states: true, tier: "advanced" },
  "border.borderBottom": {
    css: "border-bottom",
    type: "borderSide",
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "border.borderLeft": { css: "border-left", type: "borderSide", responsive: true, states: true, tier: "advanced" },
  "border.outline": { css: "outline", type: "outline", responsive: true, states: true, tier: "advanced" },
  "border.outlineOffset": {
    css: "outline-offset",
    type: "number",
    units: ["px"],
    responsive: true,
    states: true,
    tier: "advanced",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ─────────────────────────────────────────────────────────────────────────
  "effects.opacity": {
    css: "opacity",
    type: "number",
    min: 0,
    max: 1,
    step: 0.01,
    responsive: true,
    states: true,
    tier: "basic",
  },
  "effects.shadowPreset": {
    uiOnly: true,
    type: "shadowPreset",
    token: "shadow",
    responsive: true,
    states: true,
    tier: "basic",
  },
  "effects.boxShadow": { css: "box-shadow", type: "shadow", responsive: true, states: true, tier: "basic" },
  "effects.filter": { css: "filter", type: "filter", responsive: true, states: true, tier: "advanced" },
  "effects.backdropFilter": {
    css: "backdrop-filter",
    type: "filter",
    responsive: true,
    states: true,
    tier: "advanced",
  },
  "effects.transformPreset": {
    uiOnly: true,
    type: "transformPreset",
    responsive: true,
    states: true,
    tier: "basic",
  },
  "effects.transform": { css: "transform", type: "transform", responsive: true, states: true, tier: "advanced" },
  "effects.clipPath": { css: "clip-path", type: "text", responsive: true, states: true, tier: "advanced" },

  // ─────────────────────────────────────────────────────────────────────────
  // MOTION
  // ─────────────────────────────────────────────────────────────────────────
  "motion.transitionPreset": {
    uiOnly: true,
    type: "transitionPreset",
    responsive: false,
    states: false,
    tier: "basic",
  },
  "motion.transition": { css: "transition", type: "transition", responsive: false, states: false, tier: "basic" },
  "motion.animation": { css: "animation", type: "animation", responsive: false, states: true, tier: "advanced" },
  "motion.modalAnimationPreset": {
    uiOnly: true,
    type: "select",
    options: ["fade", "slideUp", "scale", "none"],
    responsive: false,
    states: false,
    tier: "advanced",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONTENT
  // ─────────────────────────────────────────────────────────────────────────
  "content.text": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },
  "content.label": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },
  "content.placeholder": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // LINK
  // ─────────────────────────────────────────────────────────────────────────
  "link.type": {
    uiOnly: true,
    type: "select",
    options: ["url", "page", "section", "email", "phone"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "link.href": { uiOnly: true, type: "linkPicker", responsive: false, states: false, tier: "basic" },
  "link.target": {
    uiOnly: true,
    type: "select",
    options: ["_self", "_blank"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "link.rel": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIA
  // ─────────────────────────────────────────────────────────────────────────
  "media.src": { uiOnly: true, type: "assetPicker", responsive: false, states: false, tier: "basic" },
  "media.alt": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },
  "media.objectFit": {
    css: "object-fit",
    type: "select",
    options: ["fill", "contain", "cover", "none", "scale-down"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "media.objectPosition": {
    css: "object-position",
    type: "select",
    options: ["center", "top", "bottom", "left", "right"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "media.loading": {
    uiOnly: true,
    type: "select",
    options: ["auto", "lazy", "eager"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "media.decoding": {
    uiOnly: true,
    type: "select",
    options: ["auto", "sync", "async"],
    responsive: false,
    states: false,
    tier: "basic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ATTRIBUTES
  // ─────────────────────────────────────────────────────────────────────────
  "attributes.id": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },
  "attributes.dataAttrs": { uiOnly: true, type: "keyValueList", responsive: false, states: false, tier: "basic" },
  "attributes.customAttrs": {
    uiOnly: true,
    type: "keyValueList",
    responsive: false,
    states: false,
    tier: "basic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY
  // ─────────────────────────────────────────────────────────────────────────
  "a11y.ariaLabel": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },
  "a11y.role": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },
  "a11y.tabIndex": { uiOnly: true, type: "number", responsive: false, states: false, tier: "basic" },
  "a11y.ariaControls": { uiOnly: true, type: "text", responsive: false, states: false, tier: "basic" },
  "a11y.ariaExpanded": {
    uiOnly: true,
    type: "select",
    options: ["true", "false"],
    responsive: false,
    states: false,
    tier: "basic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CLASSES
  // ─────────────────────────────────────────────────────────────────────────
  "classes.applied": { uiOnly: true, type: "classList", responsive: false, states: false, tier: "basic" },
  "classes.add": { uiOnly: true, type: "classPicker", responsive: false, states: false, tier: "basic" },
  "classes.reorder": { uiOnly: true, type: "reorderList", responsive: false, states: false, tier: "basic" },
  "classes.createFromStyles": { uiOnly: true, type: "action", responsive: false, states: false, tier: "basic" },
  "classes.convertInline": { uiOnly: true, type: "action", responsive: false, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // INTERACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  "interactions.add": { uiOnly: true, type: "action", responsive: false, states: false, tier: "basic" },
  "interactions.list": { uiOnly: true, type: "interactionList", responsive: false, states: false, tier: "basic" },
  "interactions.conditions": {
    uiOnly: true,
    type: "conditionGroups",
    responsive: false,
    states: false,
    tier: "basic",
  },
  "interactions.timing": { uiOnly: true, type: "timingControls", responsive: false, states: false, tier: "basic" },
  "interactions.variables": { uiOnly: true, type: "varsEditor", responsive: false, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // DATA / REPEATERS
  // ─────────────────────────────────────────────────────────────────────────
  "data.collection": { uiOnly: true, type: "collectionPicker", responsive: false, states: false, tier: "basic" },
  "data.bindField": { uiOnly: true, type: "fieldPicker", responsive: false, states: false, tier: "basic" },
  "data.repeaterEnabled": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "data.mapping": { uiOnly: true, type: "mappingBuilder", responsive: false, states: false, tier: "basic" },
  "data.filters": { uiOnly: true, type: "filterBuilder", responsive: false, states: false, tier: "basic" },
  "data.sort": { uiOnly: true, type: "sortBuilder", responsive: false, states: false, tier: "basic" },
  "data.limit": { uiOnly: true, type: "number", responsive: false, states: false, tier: "basic" },
  "data.emptyState": { uiOnly: true, type: "slotPicker", responsive: false, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // VISIBILITY RULES
  // ─────────────────────────────────────────────────────────────────────────
  "visibilityRules.enabled": { uiOnly: true, type: "toggle", responsive: true, states: false, tier: "basic" },
  "visibilityRules.simpleRule": {
    uiOnly: true,
    type: "simpleCondition",
    responsive: true,
    states: false,
    tier: "basic",
  },
  "visibilityRules.groups": {
    uiOnly: true,
    type: "conditionGroups",
    responsive: true,
    states: false,
    tier: "basic",
  },
  "visibilityRules.previewData": {
    uiOnly: true,
    type: "previewData",
    responsive: false,
    states: false,
    tier: "basic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ALL CSS (Dev Mode)
  // ─────────────────────────────────────────────────────────────────────────
  "allCss.addProperty": { uiOnly: true, type: "cssAdd", responsive: true, states: true, tier: "basic" },
  "allCss.list": { uiOnly: true, type: "cssList", responsive: true, states: true, tier: "basic" },
  "allCss.resetAll": { uiOnly: true, type: "action", responsive: true, states: true, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // ICON
  // ─────────────────────────────────────────────────────────────────────────
  "icon.pick": { uiOnly: true, type: "iconPicker", responsive: false, states: false, tier: "basic" },
  "icon.size": { uiOnly: true, type: "number", units: ["px"], responsive: true, states: true, tier: "basic" },
  "icon.strokeWidth": {
    uiOnly: true,
    type: "number",
    units: ["px"],
    responsive: true,
    states: true,
    tier: "basic",
  },
  "icon.fillMode": {
    uiOnly: true,
    type: "select",
    options: ["stroke", "filled"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "icon.rotation": { uiOnly: true, type: "transformRotateOnly", responsive: true, states: true, tier: "basic" },
  "icon.buttonIcon": { uiOnly: true, type: "iconPicker", responsive: false, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL
  // ─────────────────────────────────────────────────────────────────────────
  "modal.openTrigger": { uiOnly: true, type: "triggerPicker", responsive: false, states: false, tier: "basic" },
  "modal.closeBehavior": {
    uiOnly: true,
    type: "select",
    options: ["button", "outsideClick", "esc", "any"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "modal.overlay": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "modal.scrollLock": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "modal.focusTrap": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "modal.closeOnEsc": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "modal.closeOnOutsideClick": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "modal.zIndex": { css: "z-index", type: "number", responsive: true, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // TABS
  // ─────────────────────────────────────────────────────────────────────────
  "tabs.items": { uiOnly: true, type: "itemsEditor", responsive: false, states: false, tier: "basic" },
  "tabs.defaultTab": { uiOnly: true, type: "number", responsive: false, states: false, tier: "basic" },
  "tabs.behavior": {
    uiOnly: true,
    type: "select",
    options: ["manual", "auto"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "tabs.animate": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "tabs.urlSync": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "tabs.lazyMount": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // ACCORDION
  // ─────────────────────────────────────────────────────────────────────────
  "accordion.items": { uiOnly: true, type: "itemsEditor", responsive: false, states: false, tier: "basic" },
  "accordion.defaultOpen": { uiOnly: true, type: "number", responsive: false, states: false, tier: "basic" },
  "accordion.behavior": {
    uiOnly: true,
    type: "select",
    options: ["single", "multiple"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "accordion.multipleOpen": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "accordion.animate": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "accordion.iconPosition": {
    uiOnly: true,
    type: "select",
    options: ["left", "right"],
    responsive: false,
    states: false,
    tier: "basic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDER
  // ─────────────────────────────────────────────────────────────────────────
  "slider.slides": { uiOnly: true, type: "slidesEditor", responsive: false, states: false, tier: "basic" },
  "slider.autoplay": { uiOnly: true, type: "toggleWithNumber", responsive: false, states: false, tier: "basic" },
  "slider.navUI": {
    uiOnly: true,
    type: "select",
    options: ["arrows", "dots", "both", "none"],
    responsive: true,
    states: false,
    tier: "basic",
  },
  "slider.transitionPreset": {
    uiOnly: true,
    type: "select",
    options: ["smooth", "snappy", "fade"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "slider.loop": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "slider.drag": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "slider.pauseOnHover": { uiOnly: true, type: "toggle", responsive: false, states: false, tier: "basic" },
  "slider.easing": {
    uiOnly: true,
    type: "select",
    options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear"],
    responsive: false,
    states: false,
    tier: "basic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NAVBAR
  // ─────────────────────────────────────────────────────────────────────────
  "navbar.menuItems": { uiOnly: true, type: "menuEditor", responsive: false, states: false, tier: "basic" },
  "navbar.logo": { uiOnly: true, type: "assetPicker", responsive: false, states: false, tier: "basic" },
  "navbar.sticky": { uiOnly: true, type: "toggle", responsive: true, states: false, tier: "basic" },
  "navbar.mobileCollapse": { uiOnly: true, type: "toggle", responsive: true, states: false, tier: "basic" },
  "navbar.breakpoint": {
    uiOnly: true,
    type: "select",
    options: ["tablet", "mobile"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "navbar.activeLinkStyle": {
    uiOnly: true,
    type: "select",
    options: ["underline", "pill", "bold", "none"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "navbar.animation": {
    uiOnly: true,
    type: "select",
    options: ["none", "fade", "slide"],
    responsive: false,
    states: false,
    tier: "basic",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FORM
  // ─────────────────────────────────────────────────────────────────────────
  "form.fields": { uiOnly: true, type: "fieldsEditor", responsive: false, states: false, tier: "basic" },
  "form.validationBasics": { uiOnly: true, type: "toggleList", responsive: false, states: false, tier: "basic" },
  "form.submitAction": {
    uiOnly: true,
    type: "select",
    options: ["email", "webhook", "navigate", "custom"],
    responsive: false,
    states: false,
    tier: "basic",
  },
  "form.states": { uiOnly: true, type: "stateEditor", responsive: false, states: false, tier: "basic" },

  // ─────────────────────────────────────────────────────────────────────────
  // BUTTON
  // ─────────────────────────────────────────────────────────────────────────
  "button.variant": {
    uiOnly: true,
    type: "tokenSelect",
    token: "buttonVariant",
    responsive: true,
    states: true,
    tier: "basic",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get IDs of all advanced-tier properties within a group prefix.
 * Used by progressive disclosure controls to know which props to hide by default.
 *
 * @param groupPrefix - e.g. "size", "spacing", "flex"
 * @returns Array of property IDs where tier === "advanced"
 */
export function getAdvancedPropsForGroup(groupPrefix: string): string[] {
  return Object.entries(PROPERTIES)
    .filter(([id, def]) => id.startsWith(groupPrefix + ".") && def.tier === "advanced")
    .map(([id]) => id);
}
