/**
 * HTML Sanitization Configuration
 * Constants and options for HTML sanitization
 *
 * @module utils/html/sanitizationConfig
 * @license BSD-3-Clause
 */

// =============================================================================
// SANITIZATION CONSTANTS
// =============================================================================

/**
 * Allowed tags for sanitization (whitelist)
 */
export const DEFAULT_ALLOWED_TAGS = new Set([
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "br",
  "button",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "i",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "mark",
  "meter",
  "nav",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "section",
  "select",
  "small",
  "source",
  "span",
  // SVG graphics — allow the top-level <svg> + nested shapes.
  "svg",
  "circle",
  "ellipse",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "g",
  "defs",
  "use",
  "symbol",
  "text",
  "tspan",
  "title",
  "desc",
  "linearGradient",
  "radialGradient",
  "stop",
  "mask",
  "clipPath",
  "filter",
  "feGaussianBlur",
  "feOffset",
  "feMerge",
  "feMergeNode",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
]);

/**
 * Allowed attributes per tag
 */
export const DEFAULT_ALLOWED_ATTRS: Record<string, Set<string>> = {
  "*": new Set(["class", "id", "style", "title", "lang", "dir", "data-*", "aria-*", "role"]),
  a: new Set(["href", "target", "rel", "download", "hreflang"]),
  img: new Set(["src", "alt", "width", "height", "loading", "srcset", "sizes"]),
  video: new Set([
    "src",
    "poster",
    "controls",
    "autoplay",
    "loop",
    "muted",
    "width",
    "height",
    "preload",
  ]),
  audio: new Set(["src", "controls", "autoplay", "loop", "muted", "preload"]),
  source: new Set(["src", "srcset", "type", "media", "sizes"]),
  iframe: new Set(["src", "width", "height", "frameborder", "allowfullscreen", "allow", "loading"]),
  table: new Set(["border", "cellpadding", "cellspacing"]),
  td: new Set(["colspan", "rowspan", "headers"]),
  th: new Set(["colspan", "rowspan", "headers", "scope"]),
  col: new Set(["span"]),
  colgroup: new Set(["span"]),
  ol: new Set(["start", "reversed", "type"]),
  li: new Set(["value"]),
  time: new Set(["datetime"]),
  data: new Set(["value"]),
  blockquote: new Set(["cite"]),
  q: new Set(["cite"]),
  del: new Set(["cite", "datetime"]),
  ins: new Set(["cite", "datetime"]),
  // Form controls — attributes needed for stock field blocks to survive
  // sanitizeHTML round-trip. Without these, the tag is allowed but all
  // props (type, placeholder, name, etc.) get stripped and the inserted
  // element is a bare <input /> with no default value/placeholder.
  input: new Set([
    "type",
    "name",
    "value",
    "placeholder",
    "required",
    "disabled",
    "readonly",
    "checked",
    "min",
    "max",
    "step",
    "minlength",
    "maxlength",
    "pattern",
    "autocomplete",
    "autofocus",
    "accept",
    "multiple",
  ]),
  textarea: new Set([
    "name",
    "placeholder",
    "required",
    "disabled",
    "readonly",
    "rows",
    "cols",
    "minlength",
    "maxlength",
    "autocomplete",
    "autofocus",
    "wrap",
  ]),
  select: new Set(["name", "required", "disabled", "multiple", "size", "autocomplete"]),
  option: new Set(["value", "selected", "disabled", "label"]),
  optgroup: new Set(["label", "disabled"]),
  button: new Set(["type", "name", "value", "disabled", "autofocus", "form", "formaction"]),
  form: new Set(["action", "method", "enctype", "target", "autocomplete", "novalidate", "name"]),
  label: new Set(["for", "form"]),
  fieldset: new Set(["disabled", "form", "name"]),
  output: new Set(["for", "form", "name"]),
  progress: new Set(["value", "max"]),
  meter: new Set(["value", "min", "max", "low", "high", "optimum"]),
  // SVG — full-surface attributes so stock SVG blocks survive sanitize
  // without losing their viewBox / geometry / style attrs.
  svg: new Set([
    "width",
    "height",
    "viewBox",
    "xmlns",
    "xmlns:xlink",
    "preserveAspectRatio",
    "fill",
    "stroke",
    "stroke-width",
  ]),
  circle: new Set(["cx", "cy", "r", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray"]),
  ellipse: new Set(["cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width"]),
  line: new Set(["x1", "y1", "x2", "y2", "stroke", "stroke-width", "stroke-linecap"]),
  path: new Set(["d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "fill-rule"]),
  polygon: new Set(["points", "fill", "stroke", "stroke-width"]),
  polyline: new Set(["points", "fill", "stroke", "stroke-width"]),
  rect: new Set(["x", "y", "width", "height", "rx", "ry", "fill", "stroke", "stroke-width"]),
  g: new Set(["fill", "stroke", "stroke-width", "transform", "opacity"]),
  use: new Set(["href", "xlink:href", "x", "y", "width", "height"]),
  symbol: new Set(["viewBox", "preserveAspectRatio"]),
  text: new Set(["x", "y", "dx", "dy", "text-anchor", "font-size", "font-family", "font-weight", "fill"]),
  tspan: new Set(["x", "y", "dx", "dy", "font-size", "fill"]),
  linearGradient: new Set(["id", "x1", "y1", "x2", "y2", "gradientUnits"]),
  radialGradient: new Set(["id", "cx", "cy", "r", "gradientUnits"]),
  stop: new Set(["offset", "stop-color", "stop-opacity"]),
  mask: new Set(["id", "x", "y", "width", "height", "maskUnits"]),
  clipPath: new Set(["id", "clipPathUnits"]),
  filter: new Set(["id", "x", "y", "width", "height"]),
};

/**
 * URL schemes allowed in href/src attributes
 */
export const ALLOWED_URL_SCHEMES = new Set([
  "http:",
  "https:",
  "mailto:",
  "tel:",
  "data:",
  "#",
  "/",
]);

/**
 * Dangerous attribute values (patterns to block)
 */
export const DANGEROUS_PATTERNS = [
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
  /expression\s*\(/i,
  /-moz-binding/i,
  /behavior\s*:/i,
];

// =============================================================================
// SANITIZATION OPTIONS
// =============================================================================

/**
 * Sanitization options
 */
export interface SanitizeOptions {
  /** Allowed HTML tags */
  allowedTags?: Set<string>;
  /** Allowed attributes per tag (* for global) */
  allowedAttrs?: Record<string, Set<string>>;
  /** Allowed URL schemes */
  allowedSchemes?: Set<string>;
  /** Remove empty elements */
  removeEmpty?: boolean;
  /** Strip all tags, keep text only */
  stripTags?: boolean;
  /** Allow data-* attributes */
  allowDataAttrs?: boolean;
  /** Allow aria-* attributes */
  allowAriaAttrs?: boolean;
  /** Custom URL validator */
  urlValidator?: (url: string) => boolean;
}
