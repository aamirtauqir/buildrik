/**
 * Extended HTML Tag Sets
 * Additional tag categorization sets
 *
 * @module utils/html/tagSetsExtended
 * @license BSD-3-Clause
 */

/**
 * Text formatting elements
 */
export const TEXT_FORMATTING_TAGS = new Set([
  "abbr",
  "b",
  "bdi",
  "bdo",
  "br",
  "cite",
  "code",
  "data",
  "del",
  "dfn",
  "em",
  "i",
  "ins",
  "kbd",
  "mark",
  "pre",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "small",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
]);

/**
 * Tags that can only contain text (no element children)
 */
export const TEXT_ONLY_TAGS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
  "a",
  "button",
  "label",
  "li",
  "td",
  "th",
  "caption",
  "figcaption",
  "title",
  "option",
  "textarea",
  "script",
  "style",
]);

/**
 * Interactive elements
 */
export const INTERACTIVE_TAGS = new Set([
  "a",
  "button",
  "details",
  "embed",
  "iframe",
  "input",
  "label",
  "select",
  "textarea",
]);

/**
 * Metadata elements (usually in <head>)
 */
export const METADATA_TAGS = new Set([
  "base",
  "head",
  "link",
  "meta",
  "noscript",
  "script",
  "style",
  "template",
  "title",
]);

/**
 * Deprecated HTML elements (avoid using)
 */
export const DEPRECATED_TAGS = new Set([
  "acronym",
  "applet",
  "basefont",
  "bgsound",
  "big",
  "blink",
  "center",
  "dir",
  "font",
  "frame",
  "frameset",
  "isindex",
  "keygen",
  "listing",
  "marquee",
  "menuitem",
  "multicol",
  "nextid",
  "nobr",
  "noembed",
  "noframes",
  "plaintext",
  "rb",
  "rtc",
  "spacer",
  "strike",
  "tt",
  "xmp",
]);
