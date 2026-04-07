/**
 * HTML Encoding & Escaping
 * Functions for escaping and encoding HTML content
 *
 * @module utils/html/encoding
 * @license BSD-3-Clause
 */

// =============================================================================
// HTML ENTITIES
// =============================================================================

/**
 * HTML entities for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
  "/": "&#47;",
};

const ENTITY_DECODE_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&#96;": "`",
  "&#47;": "/",
  "&nbsp;": "\u00A0",
  "&copy;": "\u00A9",
  "&reg;": "\u00AE",
  "&trade;": "\u2122",
  "&mdash;": "\u2014",
  "&ndash;": "\u2013",
  "&hellip;": "\u2026",
  "&laquo;": "\u00AB",
  "&raquo;": "\u00BB",
  "&ldquo;": "\u201C",
  "&rdquo;": "\u201D",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&bull;": "\u2022",
  "&middot;": "\u00B7",
  "&deg;": "\u00B0",
  "&plusmn;": "\u00B1",
  "&times;": "\u00D7",
  "&divide;": "\u00F7",
  "&euro;": "\u20AC",
  "&pound;": "\u00A3",
  "&yen;": "\u00A5",
  "&cent;": "\u00A2",
};

// =============================================================================
// ENCODING FUNCTIONS
// =============================================================================

/**
 * Escape HTML attribute value
 */
export function escapeAttr(value: string): string {
  return value.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Escape HTML content
 */
export function escapeHTML(value: string): string {
  return value.replace(/[&<>]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Unescape HTML entities
 */
export function unescapeHTML(html: string): string {
  // First handle named entities
  let result = html;
  for (const [entity, char] of Object.entries(ENTITY_DECODE_MAP)) {
    result = result.replace(new RegExp(entity, "g"), char);
  }

  // Handle numeric entities (decimal)
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));

  // Handle numeric entities (hex)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

  return result;
}

/**
 * Encode text for use in HTML
 */
export function encodeHTML(text: string): string {
  return escapeHTML(text);
}

/**
 * Decode HTML entities
 */
export function decodeHTML(html: string): string {
  return unescapeHTML(html);
}
