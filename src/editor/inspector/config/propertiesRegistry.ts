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
  },
  "layout.visibility": {
    css: "visibility",
    type: "select",
    options: ["visible", "hidden"],
    responsive: true,
    states: false,
  },
  "layout.boxSizing": {
    css: "box-sizing",
    type: "select",
    options: ["border-box", "content-box"],
    responsive: false,
    states: false,
  },
  "layout.isolation": {
    css: "isolation",
    type: "select",
    options: ["auto", "isolate"],
    responsive: false,
    states: false,
  },
  "layout.contain": { css: "contain", type: "text", responsive: false, states: false },

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
  },
  "spacing.padding": {
    css: "padding",
    type: "box",
    units: ["px", "rem", "%", "vh", "vw"],
    token: "space",
    responsive: true,
    states: false,
  },
  "spacing.negativeMargin": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "layout.gap": {
    css: "gap",
    type: "number",
    units: ["px", "rem"],
    token: "space",
    responsive: true,
    states: false,
  },
  "spacing.rowGap": {
    css: "row-gap",
    type: "number",
    units: ["px", "rem"],
    token: "space",
    responsive: true,
    states: false,
  },
  "spacing.columnGap": {
    css: "column-gap",
    type: "number",
    units: ["px", "rem"],
    token: "space",
    responsive: true,
    states: false,
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
  },
  "size.height": {
    css: "height",
    type: "dimension",
    units: ["auto", "px", "%", "vh", "rem"],
    responsive: true,
    states: false,
  },
  "size.minWidth": {
    css: "min-width",
    type: "dimension",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
  },
  "size.maxWidth": {
    css: "max-width",
    type: "dimension",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
  },
  "size.minHeight": {
    css: "min-height",
    type: "dimension",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
  },
  "size.maxHeight": {
    css: "max-height",
    type: "dimension",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
  },
  "size.aspectRatio": { css: "aspect-ratio", type: "text", responsive: true, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // POSITION
  // ─────────────────────────────────────────────────────────────────────────
  "position.position": {
    css: "position",
    type: "select",
    options: ["static", "relative", "absolute", "fixed", "sticky"],
    responsive: true,
    states: false,
  },
  "position.anchorUI": { uiOnly: true, type: "anchor", responsive: true, states: false },
  "position.inset": {
    css: "inset",
    type: "box",
    units: ["px", "%", "rem"],
    responsive: true,
    states: false,
  },
  "position.zIndex": { css: "z-index", type: "number", responsive: true, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // OVERFLOW
  // ─────────────────────────────────────────────────────────────────────────
  "overflow.overflow": {
    css: "overflow",
    type: "select",
    options: ["visible", "hidden", "scroll", "auto"],
    responsive: true,
    states: false,
  },
  "overflow.overflowX": {
    css: "overflow-x",
    type: "select",
    options: ["visible", "hidden", "scroll", "auto"],
    responsive: true,
    states: false,
  },
  "overflow.overflowY": {
    css: "overflow-y",
    type: "select",
    options: ["visible", "hidden", "scroll", "auto"],
    responsive: true,
    states: false,
  },
  "overflow.scrollBehavior": {
    css: "scroll-behavior",
    type: "select",
    options: ["auto", "smooth"],
    responsive: false,
    states: false,
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
  },
  "overflow.scrollSnapAlign": {
    css: "scroll-snap-align",
    type: "select",
    options: ["none", "start", "center", "end"],
    responsive: true,
    states: false,
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
  },
  "flex.justify": {
    css: "justify-content",
    type: "select",
    options: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"],
    responsive: true,
    states: false,
  },
  "flex.align": {
    css: "align-items",
    type: "select",
    options: ["stretch", "flex-start", "center", "flex-end", "baseline"],
    responsive: true,
    states: false,
  },
  "flex.wrap": {
    css: "flex-wrap",
    type: "select",
    options: ["nowrap", "wrap", "wrap-reverse"],
    responsive: true,
    states: false,
  },
  "flex.alignContent": {
    css: "align-content",
    type: "select",
    options: ["stretch", "flex-start", "center", "flex-end", "space-between", "space-around"],
    responsive: true,
    states: false,
  },
  "flex.childGrow": { css: "flex-grow", type: "number", responsive: true, states: false },
  "flex.childShrink": { css: "flex-shrink", type: "number", responsive: true, states: false },
  "flex.childBasis": {
    css: "flex-basis",
    type: "dimension",
    units: ["auto", "px", "%", "rem"],
    responsive: true,
    states: false,
  },
  "flex.childOrder": { css: "order", type: "number", responsive: true, states: false },
  "flex.childAlignSelf": {
    css: "align-self",
    type: "select",
    options: ["auto", "stretch", "flex-start", "center", "flex-end", "baseline"],
    responsive: true,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GRID
  // ─────────────────────────────────────────────────────────────────────────
  "grid.columns": {
    css: "grid-template-columns",
    type: "gridTemplate",
    responsive: true,
    states: false,
  },
  "grid.rows": { css: "grid-template-rows", type: "gridTemplate", responsive: true, states: false },
  "grid.areas": { css: "grid-template-areas", type: "text", responsive: true, states: false },
  "grid.autoFlow": {
    css: "grid-auto-flow",
    type: "select",
    options: ["row", "column", "dense", "row dense", "column dense"],
    responsive: true,
    states: false,
  },
  "grid.autoRows": { css: "grid-auto-rows", type: "text", responsive: true, states: false },
  "grid.autoCols": { css: "grid-auto-columns", type: "text", responsive: true, states: false },
  "grid.placeItems": {
    css: "place-items",
    type: "select",
    options: ["start", "center", "end", "stretch"],
    responsive: true,
    states: false,
  },
  "grid.placeContent": {
    css: "place-content",
    type: "select",
    options: ["start", "center", "end", "stretch", "space-between", "space-around", "space-evenly"],
    responsive: true,
    states: false,
  },
  "grid.placeSelf": {
    css: "place-self",
    type: "select",
    options: ["auto", "start", "center", "end", "stretch"],
    responsive: true,
    states: false,
  },
  "grid.itemPlacement": {
    uiOnly: true,
    type: "gridItemPlacement",
    responsive: true,
    states: false,
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
  },
  "typography.fontSize": {
    css: "font-size",
    type: "tokenNumber",
    token: "fontSize",
    units: ["px", "rem"],
    responsive: true,
    states: true,
  },
  "typography.fontWeight": {
    css: "font-weight",
    type: "select",
    options: ["300", "400", "500", "600", "700", "800"],
    responsive: true,
    states: true,
  },
  "typography.lineHeight": {
    css: "line-height",
    type: "number",
    units: ["px", "em"],
    responsive: true,
    states: true,
  },
  "typography.textAlign": {
    css: "text-align",
    type: "segmented",
    options: ["left", "center", "right", "justify"],
    responsive: true,
    states: true,
  },
  "typography.letterSpacing": {
    css: "letter-spacing",
    type: "number",
    units: ["px", "em"],
    responsive: true,
    states: true,
  },
  "typography.textTransform": {
    css: "text-transform",
    type: "select",
    options: ["none", "uppercase", "lowercase", "capitalize"],
    responsive: true,
    states: true,
  },
  "typography.textDecoration": {
    css: "text-decoration",
    type: "textDecoration",
    responsive: true,
    states: true,
  },
  "typography.whiteSpace": {
    css: "white-space",
    type: "select",
    options: ["normal", "nowrap", "pre", "pre-wrap", "pre-line"],
    responsive: true,
    states: true,
  },
  "typography.wordBreak": {
    css: "word-break",
    type: "select",
    options: ["normal", "break-all", "keep-all", "break-word"],
    responsive: true,
    states: true,
  },
  "typography.overflowWrap": {
    css: "overflow-wrap",
    type: "select",
    options: ["normal", "anywhere", "break-word"],
    responsive: true,
    states: true,
  },
  "typography.textOverflow": {
    css: "text-overflow",
    type: "select",
    options: ["clip", "ellipsis"],
    responsive: true,
    states: true,
  },
  "typography.textShadow": { css: "text-shadow", type: "shadow", responsive: true, states: true },

  // ─────────────────────────────────────────────────────────────────────────
  // COLORS
  // ─────────────────────────────────────────────────────────────────────────
  "colors.textColor": {
    css: "color",
    type: "tokenColor",
    token: "color",
    responsive: true,
    states: true,
  },
  "colors.backgroundColor": {
    css: "background-color",
    type: "tokenColor",
    token: "color",
    responsive: true,
    states: true,
  },
  "colors.borderColor": {
    css: "border-color",
    type: "tokenColor",
    token: "color",
    responsive: true,
    states: true,
  },
  "colors.mixBlendMode": {
    css: "mix-blend-mode",
    type: "select",
    options: ["normal", "multiply", "screen", "overlay", "darken", "lighten"],
    responsive: false,
    states: true,
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
  },
  "background.backgroundImage": {
    css: "background-image",
    type: "backgroundImage",
    responsive: true,
    states: true,
  },
  "background.gradientPreset": {
    uiOnly: true,
    type: "gradientPreset",
    responsive: true,
    states: true,
  },
  "background.size": {
    css: "background-size",
    type: "select",
    options: ["auto", "cover", "contain"],
    responsive: true,
    states: true,
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
  },
  "background.repeat": {
    css: "background-repeat",
    type: "select",
    options: ["repeat", "no-repeat", "repeat-x", "repeat-y"],
    responsive: true,
    states: true,
  },
  "background.attachment": {
    css: "background-attachment",
    type: "select",
    options: ["scroll", "fixed", "local"],
    responsive: true,
    states: true,
  },
  "background.clip": {
    css: "background-clip",
    type: "select",
    options: ["border-box", "padding-box", "content-box", "text"],
    responsive: false,
    states: true,
  },
  "background.origin": {
    css: "background-origin",
    type: "select",
    options: ["border-box", "padding-box", "content-box"],
    responsive: false,
    states: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BORDER
  // ─────────────────────────────────────────────────────────────────────────
  "border.border": { uiOnly: true, type: "border", responsive: true, states: true },
  "border.radius": {
    css: "border-radius",
    type: "tokenNumber",
    token: "radius",
    units: ["px", "rem"],
    responsive: true,
    states: true,
  },
  "border.borderTop": { css: "border-top", type: "borderSide", responsive: true, states: true },
  "border.borderRight": { css: "border-right", type: "borderSide", responsive: true, states: true },
  "border.borderBottom": {
    css: "border-bottom",
    type: "borderSide",
    responsive: true,
    states: true,
  },
  "border.borderLeft": { css: "border-left", type: "borderSide", responsive: true, states: true },
  "border.outline": { css: "outline", type: "outline", responsive: true, states: true },
  "border.outlineOffset": {
    css: "outline-offset",
    type: "number",
    units: ["px"],
    responsive: true,
    states: true,
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
  },
  "effects.shadowPreset": {
    uiOnly: true,
    type: "shadowPreset",
    token: "shadow",
    responsive: true,
    states: true,
  },
  "effects.boxShadow": { css: "box-shadow", type: "shadow", responsive: true, states: true },
  "effects.filter": { css: "filter", type: "filter", responsive: true, states: true },
  "effects.backdropFilter": {
    css: "backdrop-filter",
    type: "filter",
    responsive: true,
    states: true,
  },
  "effects.transformPreset": {
    uiOnly: true,
    type: "transformPreset",
    responsive: true,
    states: true,
  },
  "effects.transform": { css: "transform", type: "transform", responsive: true, states: true },
  "effects.clipPath": { css: "clip-path", type: "text", responsive: true, states: true },

  // ─────────────────────────────────────────────────────────────────────────
  // MOTION
  // ─────────────────────────────────────────────────────────────────────────
  "motion.transitionPreset": {
    uiOnly: true,
    type: "transitionPreset",
    responsive: false,
    states: false,
  },
  "motion.transition": { css: "transition", type: "transition", responsive: false, states: false },
  "motion.animation": { css: "animation", type: "animation", responsive: false, states: true },
  "motion.modalAnimationPreset": {
    uiOnly: true,
    type: "select",
    options: ["fade", "slideUp", "scale", "none"],
    responsive: false,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONTENT
  // ─────────────────────────────────────────────────────────────────────────
  "content.text": { uiOnly: true, type: "text", responsive: false, states: false },
  "content.label": { uiOnly: true, type: "text", responsive: false, states: false },
  "content.placeholder": { uiOnly: true, type: "text", responsive: false, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // LINK
  // ─────────────────────────────────────────────────────────────────────────
  "link.type": {
    uiOnly: true,
    type: "select",
    options: ["url", "page", "section", "email", "phone"],
    responsive: false,
    states: false,
  },
  "link.href": { uiOnly: true, type: "linkPicker", responsive: false, states: false },
  "link.target": {
    uiOnly: true,
    type: "select",
    options: ["_self", "_blank"],
    responsive: false,
    states: false,
  },
  "link.rel": { uiOnly: true, type: "text", responsive: false, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // MEDIA
  // ─────────────────────────────────────────────────────────────────────────
  "media.src": { uiOnly: true, type: "assetPicker", responsive: false, states: false },
  "media.alt": { uiOnly: true, type: "text", responsive: false, states: false },
  "media.objectFit": {
    css: "object-fit",
    type: "select",
    options: ["fill", "contain", "cover", "none", "scale-down"],
    responsive: true,
    states: false,
  },
  "media.objectPosition": {
    css: "object-position",
    type: "select",
    options: ["center", "top", "bottom", "left", "right"],
    responsive: true,
    states: false,
  },
  "media.loading": {
    uiOnly: true,
    type: "select",
    options: ["auto", "lazy", "eager"],
    responsive: false,
    states: false,
  },
  "media.decoding": {
    uiOnly: true,
    type: "select",
    options: ["auto", "sync", "async"],
    responsive: false,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ATTRIBUTES
  // ─────────────────────────────────────────────────────────────────────────
  "attributes.id": { uiOnly: true, type: "text", responsive: false, states: false },
  "attributes.dataAttrs": { uiOnly: true, type: "keyValueList", responsive: false, states: false },
  "attributes.customAttrs": {
    uiOnly: true,
    type: "keyValueList",
    responsive: false,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY
  // ─────────────────────────────────────────────────────────────────────────
  "a11y.ariaLabel": { uiOnly: true, type: "text", responsive: false, states: false },
  "a11y.role": { uiOnly: true, type: "text", responsive: false, states: false },
  "a11y.tabIndex": { uiOnly: true, type: "number", responsive: false, states: false },
  "a11y.ariaControls": { uiOnly: true, type: "text", responsive: false, states: false },
  "a11y.ariaExpanded": {
    uiOnly: true,
    type: "select",
    options: ["true", "false"],
    responsive: false,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CLASSES
  // ─────────────────────────────────────────────────────────────────────────
  "classes.applied": { uiOnly: true, type: "classList", responsive: false, states: false },
  "classes.add": { uiOnly: true, type: "classPicker", responsive: false, states: false },
  "classes.reorder": { uiOnly: true, type: "reorderList", responsive: false, states: false },
  "classes.createFromStyles": { uiOnly: true, type: "action", responsive: false, states: false },
  "classes.convertInline": { uiOnly: true, type: "action", responsive: false, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // INTERACTIONS
  // ─────────────────────────────────────────────────────────────────────────
  "interactions.add": { uiOnly: true, type: "action", responsive: false, states: false },
  "interactions.list": { uiOnly: true, type: "interactionList", responsive: false, states: false },
  "interactions.conditions": {
    uiOnly: true,
    type: "conditionGroups",
    responsive: false,
    states: false,
  },
  "interactions.timing": { uiOnly: true, type: "timingControls", responsive: false, states: false },
  "interactions.variables": { uiOnly: true, type: "varsEditor", responsive: false, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // DATA / REPEATERS
  // ─────────────────────────────────────────────────────────────────────────
  "data.collection": { uiOnly: true, type: "collectionPicker", responsive: false, states: false },
  "data.bindField": { uiOnly: true, type: "fieldPicker", responsive: false, states: false },
  "data.repeaterEnabled": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "data.mapping": { uiOnly: true, type: "mappingBuilder", responsive: false, states: false },
  "data.filters": { uiOnly: true, type: "filterBuilder", responsive: false, states: false },
  "data.sort": { uiOnly: true, type: "sortBuilder", responsive: false, states: false },
  "data.limit": { uiOnly: true, type: "number", responsive: false, states: false },
  "data.emptyState": { uiOnly: true, type: "slotPicker", responsive: false, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // VISIBILITY RULES
  // ─────────────────────────────────────────────────────────────────────────
  "visibilityRules.enabled": { uiOnly: true, type: "toggle", responsive: true, states: false },
  "visibilityRules.simpleRule": {
    uiOnly: true,
    type: "simpleCondition",
    responsive: true,
    states: false,
  },
  "visibilityRules.groups": {
    uiOnly: true,
    type: "conditionGroups",
    responsive: true,
    states: false,
  },
  "visibilityRules.previewData": {
    uiOnly: true,
    type: "previewData",
    responsive: false,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ALL CSS (Dev Mode)
  // ─────────────────────────────────────────────────────────────────────────
  "allCss.addProperty": { uiOnly: true, type: "cssAdd", responsive: true, states: true },
  "allCss.list": { uiOnly: true, type: "cssList", responsive: true, states: true },
  "allCss.resetAll": { uiOnly: true, type: "action", responsive: true, states: true },

  // ─────────────────────────────────────────────────────────────────────────
  // ICON
  // ─────────────────────────────────────────────────────────────────────────
  "icon.pick": { uiOnly: true, type: "iconPicker", responsive: false, states: false },
  "icon.size": { uiOnly: true, type: "number", units: ["px"], responsive: true, states: true },
  "icon.strokeWidth": {
    uiOnly: true,
    type: "number",
    units: ["px"],
    responsive: true,
    states: true,
  },
  "icon.fillMode": {
    uiOnly: true,
    type: "select",
    options: ["stroke", "filled"],
    responsive: false,
    states: false,
  },
  "icon.rotation": { uiOnly: true, type: "transformRotateOnly", responsive: true, states: true },
  "icon.buttonIcon": { uiOnly: true, type: "iconPicker", responsive: false, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // MODAL
  // ─────────────────────────────────────────────────────────────────────────
  "modal.openTrigger": { uiOnly: true, type: "triggerPicker", responsive: false, states: false },
  "modal.closeBehavior": {
    uiOnly: true,
    type: "select",
    options: ["button", "outsideClick", "esc", "any"],
    responsive: false,
    states: false,
  },
  "modal.overlay": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "modal.scrollLock": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "modal.focusTrap": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "modal.closeOnEsc": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "modal.closeOnOutsideClick": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "modal.zIndex": { css: "z-index", type: "number", responsive: true, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // TABS
  // ─────────────────────────────────────────────────────────────────────────
  "tabs.items": { uiOnly: true, type: "itemsEditor", responsive: false, states: false },
  "tabs.defaultTab": { uiOnly: true, type: "number", responsive: false, states: false },
  "tabs.behavior": {
    uiOnly: true,
    type: "select",
    options: ["manual", "auto"],
    responsive: false,
    states: false,
  },
  "tabs.animate": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "tabs.urlSync": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "tabs.lazyMount": { uiOnly: true, type: "toggle", responsive: false, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // ACCORDION
  // ─────────────────────────────────────────────────────────────────────────
  "accordion.items": { uiOnly: true, type: "itemsEditor", responsive: false, states: false },
  "accordion.defaultOpen": { uiOnly: true, type: "number", responsive: false, states: false },
  "accordion.behavior": {
    uiOnly: true,
    type: "select",
    options: ["single", "multiple"],
    responsive: false,
    states: false,
  },
  "accordion.multipleOpen": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "accordion.animate": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "accordion.iconPosition": {
    uiOnly: true,
    type: "select",
    options: ["left", "right"],
    responsive: false,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SLIDER
  // ─────────────────────────────────────────────────────────────────────────
  "slider.slides": { uiOnly: true, type: "slidesEditor", responsive: false, states: false },
  "slider.autoplay": { uiOnly: true, type: "toggleWithNumber", responsive: false, states: false },
  "slider.navUI": {
    uiOnly: true,
    type: "select",
    options: ["arrows", "dots", "both", "none"],
    responsive: true,
    states: false,
  },
  "slider.transitionPreset": {
    uiOnly: true,
    type: "select",
    options: ["smooth", "snappy", "fade"],
    responsive: false,
    states: false,
  },
  "slider.loop": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "slider.drag": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "slider.pauseOnHover": { uiOnly: true, type: "toggle", responsive: false, states: false },
  "slider.easing": {
    uiOnly: true,
    type: "select",
    options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear"],
    responsive: false,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NAVBAR
  // ─────────────────────────────────────────────────────────────────────────
  "navbar.menuItems": { uiOnly: true, type: "menuEditor", responsive: false, states: false },
  "navbar.logo": { uiOnly: true, type: "assetPicker", responsive: false, states: false },
  "navbar.sticky": { uiOnly: true, type: "toggle", responsive: true, states: false },
  "navbar.mobileCollapse": { uiOnly: true, type: "toggle", responsive: true, states: false },
  "navbar.breakpoint": {
    uiOnly: true,
    type: "select",
    options: ["tablet", "mobile"],
    responsive: false,
    states: false,
  },
  "navbar.activeLinkStyle": {
    uiOnly: true,
    type: "select",
    options: ["underline", "pill", "bold", "none"],
    responsive: false,
    states: false,
  },
  "navbar.animation": {
    uiOnly: true,
    type: "select",
    options: ["none", "fade", "slide"],
    responsive: false,
    states: false,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FORM
  // ─────────────────────────────────────────────────────────────────────────
  "form.fields": { uiOnly: true, type: "fieldsEditor", responsive: false, states: false },
  "form.validationBasics": { uiOnly: true, type: "toggleList", responsive: false, states: false },
  "form.submitAction": {
    uiOnly: true,
    type: "select",
    options: ["email", "webhook", "navigate", "custom"],
    responsive: false,
    states: false,
  },
  "form.states": { uiOnly: true, type: "stateEditor", responsive: false, states: false },

  // ─────────────────────────────────────────────────────────────────────────
  // BUTTON
  // ─────────────────────────────────────────────────────────────────────────
  "button.variant": {
    uiOnly: true,
    type: "tokenSelect",
    token: "buttonVariant",
    responsive: true,
    states: true,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a property definition by its ID
 */
export function getProperty(propertyId: string): PropertyDefinition | undefined {
  return PROPERTIES[propertyId];
}

/**
 * Get the CSS property name for a property ID
 */
export function getCssProperty(propertyId: string): string | undefined {
  return PROPERTIES[propertyId]?.css;
}

/**
 * Check if a property is UI-only (not a CSS property)
 */
export function isUiOnlyProperty(propertyId: string): boolean {
  return PROPERTIES[propertyId]?.uiOnly === true;
}

/**
 * Check if a property supports responsive (per-breakpoint) values
 */
export function isResponsiveProperty(propertyId: string): boolean {
  return PROPERTIES[propertyId]?.responsive ?? false;
}

/**
 * Check if a property supports pseudo-state values
 */
export function supportsStates(propertyId: string): boolean {
  return PROPERTIES[propertyId]?.states ?? false;
}

/**
 * Get the control type for a property
 */
export function getPropertyType(propertyId: string): PropertyType | undefined {
  return PROPERTIES[propertyId]?.type;
}

/**
 * Get all property IDs
 */
export function getAllPropertyIds(): string[] {
  return Object.keys(PROPERTIES);
}

/**
 * Search for properties by keyword
 */
export function searchProperties(query: string): string[] {
  if (!query) return [];

  const q = query.toLowerCase().trim();
  return Object.entries(PROPERTIES)
    .filter(([id, def]) => {
      // Match property ID
      if (id.toLowerCase().includes(q)) return true;
      // Match CSS property
      if (def.css?.toLowerCase().includes(q)) return true;
      return false;
    })
    .map(([id]) => id);
}
