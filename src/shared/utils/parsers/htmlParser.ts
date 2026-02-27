/**
 * HTML Parsing Utilities
 * HTML parsing, serialization, and sanitization
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

/** Dangerous tags to remove during sanitization */
const DANGEROUS_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "meta",
  "link",
  "base",
  "noscript",
  "template",
]);

/** Dangerous attribute patterns */
const DANGEROUS_ATTRS = /^on|^formaction$|^xlink:href$|^data-on/i;

/** Dangerous URL protocols */
const DANGEROUS_PROTOCOLS = /^(javascript|vbscript|data):/i;

export interface SanitizeOptions {
  /** Set of allowed tag names (lowercase). If not provided, all non-dangerous tags allowed */
  allowedTags?: Set<string>;
  /** Set of allowed attribute names (lowercase). If not provided, all non-dangerous attrs allowed */
  allowedAttrs?: Set<string>;
  /** Allow data-* attributes (default: true) */
  allowDataAttrs?: boolean;
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 */
export function sanitizeHTML(html: string, options: SanitizeOptions = {}): string {
  const { allowedTags, allowedAttrs, allowDataAttrs = true } = options;

  const fragment = parseHTML(html);
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT);

  const nodesToRemove: Node[] = [];

  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    const tagName = el.tagName.toLowerCase();

    // Check if tag is allowed
    if (DANGEROUS_TAGS.has(tagName)) {
      nodesToRemove.push(el);
      continue;
    }

    if (allowedTags && !allowedTags.has(tagName)) {
      nodesToRemove.push(el);
      continue;
    }

    // Remove dangerous attributes
    const attrsToRemove: string[] = [];
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();

      // Check allowed attrs
      if (allowedAttrs && !allowedAttrs.has(name)) {
        attrsToRemove.push(attr.name);
        continue;
      }

      // Skip data attributes if allowed
      if (name.startsWith("data-") && allowDataAttrs) {
        continue;
      }

      // Remove event handlers
      if (DANGEROUS_ATTRS.test(name)) {
        attrsToRemove.push(attr.name);
        continue;
      }

      // Check for dangerous protocols in URLs
      if (
        (name === "href" || name === "src" || name === "action") &&
        DANGEROUS_PROTOCOLS.test(value)
      ) {
        attrsToRemove.push(attr.name);
      }
    }

    attrsToRemove.forEach((name) => el.removeAttribute(name));
  }

  nodesToRemove.forEach((node) => node.parentNode?.removeChild(node));

  return serializeHTML(fragment);
}
