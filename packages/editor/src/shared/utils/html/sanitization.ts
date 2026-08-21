/**
 * HTML Sanitization
 * DOMPurify-backed HTML sanitizer plus URL / attribute safety helpers.
 *
 * `sanitizeHTML` is the single canonical sanitizer for the editor. DOMPurify
 * (already a dependency, used for SVG upload, head code, AI output, and
 * template tokens) does the dangerous-markup stripping: it always removes
 * `on*` event handlers, blocks `javascript:`/`vbscript:`, and only permits
 * `data:` URLs on media tags. We layer an editor-aware allowance on top so the
 * canvas keeps the attributes it depends on (`data-buildrick-*`, `class`,
 * `style`, `target`).
 *
 * `isSafeUrl` / `isSafeAttrValue` remain standalone helpers — the HTML
 * generator uses them to make attribute serialization safe by construction.
 *
 * @module utils/html/sanitization
 * @license BSD-3-Clause
 */

import DOMPurify from "dompurify";
import type { ElementData } from "../../types";
import {
  ALLOWED_URL_SCHEMES,
  ALLOWED_SRC_SCHEMES,
  DANGEROUS_PATTERNS,
  type SanitizeOptions,
} from "./sanitizationConfig";

// Re-export config for convenience
export {
  DEFAULT_ALLOWED_TAGS,
  DEFAULT_ALLOWED_ATTRS,
  ALLOWED_URL_SCHEMES,
  ALLOWED_SRC_SCHEMES,
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

  // URL attributes need special validation. `src` additionally allows blob:,
  // which is how a just-uploaded image is previewed before it reaches a server.
  if (attr === "src") {
    return isSafeUrl(value, ALLOWED_SRC_SCHEMES);
  }
  if (attr === "href" || attr === "action") {
    return isSafeUrl(value);
  }

  // Event handlers are always dangerous
  if (attr.startsWith("on")) {
    return false;
  }

  return true;
}

// =============================================================================
// SANITIZATION FUNCTIONS
// =============================================================================

/**
 * Attributes DOMPurify strips by default that the editor canvas needs.
 * `data-*` and `aria-*` are kept via ALLOW_DATA_ATTR / ALLOW_ARIA_ATTR;
 * these are the named exceptions DOMPurify does not allow out of the box.
 */
const EDITOR_ADD_ATTR = ["target", "data-buildrick-id", "data-buildrick-type"];

/**
 * Sanitize an HTML string, removing dangerous elements and attributes while
 * preserving the editor's structural attributes.
 */
export function sanitizeHTML(html: string, options: SanitizeOptions = {}): string {
  const {
    stripTags = false,
    allowedTags,
    allowDataAttrs = true,
    allowAriaAttrs = true,
  } = options;

  if (stripTags) {
    return stripAllTags(html);
  }

  // DOMPurify requires a DOM. In any non-browser context (SSR, worker without
  // DOM) fall back to a conservative text-only strip rather than returning
  // unsanitized markup.
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return stripAllTags(html);
  }

  const config: Parameters<typeof DOMPurify.sanitize>[1] = {
    ADD_ATTR: EDITOR_ADD_ATTR,
    ALLOW_DATA_ATTR: allowDataAttrs,
    ALLOW_ARIA_ATTR: allowAriaAttrs,
  };
  if (allowedTags) {
    config.ALLOWED_TAGS = Array.from(allowedTags);
  }

  return DOMPurify.sanitize(html, config) as unknown as string;
}

/**
 * Sanitize the rich-text `content` of every node in an ElementData tree,
 * in place. This is the ingest trust boundary: external project JSON
 * (localStorage, dashboard blocks, templates) flows into the element tree
 * through importProject without otherwise passing the HTML sanitizer, and
 * `content` is later emitted raw into the canvas. Run it once per load.
 *
 * Attributes are dropped here too. This used to say attribute safety was
 * "handled separately by the serializer (buildAttributeString)" — true of that
 * serializer, but the editor has three HTML writers and ExportEngine's two had
 * no such guard until 2026-08-13, so `onerror` in imported project JSON went
 * straight onto a published page. All three now filter on the way out; this
 * keeps it from being stored and re-saved in the first place, and means a
 * fourth writer cannot reintroduce the hole by forgetting.
 *
 * Only unsafe attributes go — the same `isSafeAttrValue` test the serializers
 * use, so nothing legitimate is lost.
 */
export function sanitizeElementTreeContent(data: ElementData): void {
  if (typeof data.content === "string" && data.content.length > 0) {
    data.content = sanitizeHTML(data.content);
  }
  if (data.attributes) {
    for (const [name, value] of Object.entries(data.attributes)) {
      if (!isSafeAttrValue(name, value, data.tagName ?? "")) {
        delete data.attributes[name];
      }
    }
  }
  data.children?.forEach((child) => sanitizeElementTreeContent(child));
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
