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
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "dd",
  "del",
  "details",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "footer",
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
  "ins",
  "kbd",
  "li",
  "main",
  "mark",
  "nav",
  "ol",
  "p",
  "picture",
  "pre",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "section",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
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
