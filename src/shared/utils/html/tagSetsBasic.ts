/**
 * Basic HTML Tag Sets
 * Primary tag categorization sets
 *
 * @module utils/html/tagSetsBasic
 * @license BSD-3-Clause
 */

/**
 * Self-closing HTML tags (void elements)
 * These tags cannot have children and don't need closing tags
 */
export const SELF_CLOSING_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/**
 * Block-level elements
 */
export const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "canvas",
  "dd",
  "div",
  "dl",
  "dt",
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
  "hgroup",
  "hr",
  "li",
  "main",
  "nav",
  "noscript",
  "ol",
  "output",
  "p",
  "pre",
  "section",
  "table",
  "tfoot",
  "ul",
  "video",
]);

/**
 * Inline elements
 */
export const INLINE_TAGS = new Set([
  "a",
  "abbr",
  "acronym",
  "b",
  "bdo",
  "big",
  "br",
  "button",
  "cite",
  "code",
  "dfn",
  "em",
  "i",
  "img",
  "input",
  "kbd",
  "label",
  "map",
  "object",
  "q",
  "samp",
  "script",
  "select",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "textarea",
  "time",
  "tt",
  "var",
]);

/**
 * Form-related elements
 */
export const FORM_TAGS = new Set([
  "button",
  "datalist",
  "fieldset",
  "form",
  "input",
  "label",
  "legend",
  "meter",
  "optgroup",
  "option",
  "output",
  "progress",
  "select",
  "textarea",
]);

/**
 * Media elements
 */
export const MEDIA_TAGS = new Set([
  "audio",
  "canvas",
  "embed",
  "iframe",
  "img",
  "object",
  "picture",
  "source",
  "svg",
  "track",
  "video",
]);

/**
 * Semantic elements (HTML5)
 */
export const SEMANTIC_TAGS = new Set([
  "article",
  "aside",
  "details",
  "figcaption",
  "figure",
  "footer",
  "header",
  "main",
  "mark",
  "nav",
  "section",
  "summary",
  "time",
]);

/**
 * Table elements
 */
export const TABLE_TAGS = new Set([
  "caption",
  "col",
  "colgroup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
]);

/**
 * List elements
 */
export const LIST_TAGS = new Set(["dd", "dl", "dt", "li", "ol", "ul", "menu"]);
