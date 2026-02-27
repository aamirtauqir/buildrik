/**
 * HTML Sanitization
 * Functions for sanitizing HTML content
 *
 * @module utils/html/sanitization
 * @license BSD-3-Clause
 */

import {
  DEFAULT_ALLOWED_TAGS,
  DEFAULT_ALLOWED_ATTRS,
  ALLOWED_URL_SCHEMES,
  DANGEROUS_PATTERNS,
  type SanitizeOptions,
} from "./sanitizationConfig";
import { isSelfClosing } from "./tagCategories";

// Re-export config for convenience
export {
  DEFAULT_ALLOWED_TAGS,
  DEFAULT_ALLOWED_ATTRS,
  ALLOWED_URL_SCHEMES,
  type SanitizeOptions,
} from "./sanitizationConfig";

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a URL is safe
 */
export function isSafeUrl(url: string, allowedSchemes: Set<string> = ALLOWED_URL_SCHEMES): boolean {
  const trimmed = url.trim().toLowerCase();

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Check if it starts with allowed scheme
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) {
    return true;
  }

  try {
    const parsed = new URL(url, "https://example.com");
    return allowedSchemes.has(parsed.protocol);
  } catch {
    // Relative URL
    return !trimmed.includes(":");
  }
}

/**
 * Check if an attribute value is safe
 */
export function isSafeAttrValue(attr: string, value: string, _tag: string): boolean {
  const lower = value.toLowerCase().trim();

  // Check dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(lower)) {
      return false;
    }
  }

  // URL attributes need special validation
  if (attr === "href" || attr === "src" || attr === "action") {
    return isSafeUrl(value);
  }

  // Event handlers are always dangerous
  if (attr.startsWith("on")) {
    return false;
  }

  return true;
}

/**
 * Check if attribute is allowed
 */
function isAllowedAttr(tag: string, attr: string, options: SanitizeOptions): boolean {
  const {
    allowedAttrs = DEFAULT_ALLOWED_ATTRS,
    allowDataAttrs = true,
    allowAriaAttrs = true,
  } = options;

  // Check data-* attributes
  if (attr.startsWith("data-") && allowDataAttrs) {
    return true;
  }

  // Check aria-* attributes
  if (attr.startsWith("aria-") && allowAriaAttrs) {
    return true;
  }

  // Check global attributes
  const global = allowedAttrs["*"];
  if (global?.has(attr)) {
    return true;
  }

  // Check tag-specific attributes
  const tagAttrs = allowedAttrs[tag];
  if (tagAttrs?.has(attr)) {
    return true;
  }

  return false;
}

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Sanitize HTML string (removes dangerous elements and attributes)
 */
export function sanitizeHTML(html: string, options: SanitizeOptions = {}): string {
  const { allowedTags = DEFAULT_ALLOWED_TAGS, stripTags = false, removeEmpty = false } = options;

  if (stripTags) {
    return stripAllTags(html);
  }

  // Use DOMParser for proper HTML parsing
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    sanitizeNode(doc.body, allowedTags, options, removeEmpty);
    return doc.body.innerHTML;
  }

  // Fallback: basic regex sanitization (less safe)
  return sanitizeHTMLRegex(html, allowedTags);
}

/**
 * Recursively sanitize a DOM node
 */
function sanitizeNode(
  node: Node,
  allowedTags: Set<string>,
  options: SanitizeOptions,
  removeEmpty: boolean
): void {
  const nodesToRemove: Node[] = [];

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      // Remove disallowed tags
      if (!allowedTags.has(tag)) {
        // Keep text content, remove the tag
        const text = document.createTextNode(el.textContent || "");
        node.replaceChild(text, child);
        return;
      }

      // Sanitize attributes
      const attrsToRemove: string[] = [];
      for (const attr of Array.from(el.attributes)) {
        if (!isAllowedAttr(tag, attr.name, options)) {
          attrsToRemove.push(attr.name);
        } else if (!isSafeAttrValue(attr.name, attr.value, tag)) {
          attrsToRemove.push(attr.name);
        }
      }
      attrsToRemove.forEach((attr) => el.removeAttribute(attr));

      // Recursively sanitize children
      sanitizeNode(el, allowedTags, options, removeEmpty);

      // Remove empty elements if option is set
      if (removeEmpty && !el.hasChildNodes() && !isSelfClosing(tag)) {
        nodesToRemove.push(el);
      }
    } else if (child.nodeType === Node.COMMENT_NODE) {
      // Remove comments
      nodesToRemove.push(child);
    }
  });

  nodesToRemove.forEach((n) => node.removeChild(n));
}

/**
 * Fallback regex-based sanitization (less thorough)
 */
function sanitizeHTMLRegex(html: string, allowedTags: Set<string>): string {
  // Remove script tags and content
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove style tags and content
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove event handlers
  result = result.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: URLs
  result = result.replace(/javascript:/gi, "");

  // Remove disallowed tags (keep content)
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  result = result.replace(tagPattern, (match, tag) => {
    return allowedTags.has(tag.toLowerCase()) ? match : "";
  });

  return result;
}

/**
 * Strip all HTML tags, keep text only
 */
export function stripAllTags(html: string): string {
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Remove specific tags (keep their content)
 */
export function removeTags(html: string, tags: string[]): string {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  const pattern = new RegExp(`</?(?:${Array.from(tagSet).join("|")})[^>]*>`, "gi");
  return html.replace(pattern, "");
}
