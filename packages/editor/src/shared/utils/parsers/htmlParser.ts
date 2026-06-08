/**
 * HTML Parsing Utilities
 * HTML parsing and serialization.
 *
 * Sanitization lives in the single canonical sanitizer at
 * `shared/utils/html/sanitization.ts` (DOMPurify-backed). The previous
 * hand-rolled sanitizeHTML here was unused and was removed to keep one
 * sanitizer (SSOT).
 *
 * @module utils/parsers/htmlParser
 * @license BSD-3-Clause
 */

// =============================================================================
// HTML PARSING
// =============================================================================

/**
 * Parse HTML string to DOM DocumentFragment
 * Safe for inserting multiple elements
 *
 * NOTE: For structured node parsing, use parseHTML from htmlHelpers.ts
 * This function returns a DocumentFragment for direct DOM manipulation
 */
export function parseHTML(html: string): DocumentFragment {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content;
}

/** Alias for clarity - returns DocumentFragment */
export const parseHTMLToFragment = parseHTML;

/**
 * Serialize DOM node to HTML string
 */
export function serializeHTML(node: Node): string {
  if (node instanceof Element) {
    return node.outerHTML;
  }
  const div = document.createElement("div");
  div.appendChild(node.cloneNode(true));
  return div.innerHTML;
}

