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
import {
  FORBIDDEN_ATTRIBUTES,
  URL_ATTRIBUTES,
  isDangerousUrl,
  isValidAttributeName,
  withSafeTargets,
  srcsetUrls,
  toAllowedElementTag,
} from "@buildrik/shared/schemas/element-markup";
import type { ElementData } from "../../types";
import {
  ALLOWED_URL_SCHEMES,
  ALLOWED_SRC_SCHEMES,
  DANGEROUS_PATTERNS,
  type SanitizeOptions,
} from "./sanitizationConfig";

// Re-export config for convenience
export {
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
  // The scheme as a browser reads it (controls/whitespace inside it ignored),
  // shared with the server sanitizer.
  if (isDangerousUrl(url)) return false;
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
 * Check if an attribute (name and value) is safe to emit.
 *
 * The name is emitted raw, so one that is not a plain attribute name
 * ("x onerror=alert(1) y") is refused. `srcdoc` is refused outright: it is a
 * whole document that runs in this origin. Every URL attribute in the shared
 * list is scheme-checked, not only href/src/action (A19-1).
 */
export function isSafeAttrValue(attr: string, value: string, _tag: string): boolean {
  if (!isValidAttributeName(attr)) return false;
  const name = attr.toLowerCase();
  if (FORBIDDEN_ATTRIBUTES.has(name)) return false;

  // Event handlers are always dangerous
  if (name.startsWith("on")) return false;

  const lower = value.toLowerCase().trim();
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(lower)) {
      return false;
    }
  }

  if (!URL_ATTRIBUTES.has(name)) return true;
  // Media sources additionally allow blob:, which is how a just-uploaded image
  // is previewed before it reaches a server. Never on a navigable URL.
  if (name === "srcset") return srcsetUrls(value).every((url) => isSafeUrl(url, ALLOWED_SRC_SCHEMES));
  if (name === "src" || name === "poster") return isSafeUrl(value, ALLOWED_SRC_SCHEMES);
  return isSafeUrl(value);
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

  // `target` is kept (EDITOR_ADD_ATTR), so every link that has it also gets
  // rel="noopener noreferrer" — the same rule the server applies.
  return withSafeTargets(DOMPurify.sanitize(html, config), (clean) =>
    DOMPurify.sanitize(clean, { ...config, RETURN_DOM_FRAGMENT: true })
  );
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
 *
 * A `tagName` off the shared allowlist (or malformed, e.g.
 * "img src=x onerror=… x") becomes "div": the tag is emitted raw into canvas
 * markup, so it is as much an injection point as any attribute.
 */
export function sanitizeElementTreeContent(data: ElementData): void {
  if (data.tagName) data.tagName = toAllowedElementTag(data.tagName);
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
 * Session object URLs (`blob:`) die with the window that made them, so a
 * stored one is a broken image on every later open (walk 2026-09-24: three
 * load errors per open). A persisted tree must carry none: a `src`/`poster`
 * that `remap` knows (a local asset re-created this session) is re-pointed,
 * any other is dropped, and a background image built on one is removed.
 * Mutates `data`; returns how many were dropped.
 */
const SESSION_URL_ATTRS = ["src", "poster"] as const;
const BG_KEYS = ["background-image", "backgroundImage"] as const;
export function dropSessionMediaUrls(data: ElementData, remap: Readonly<Record<string, string>> = {}): number {
  let dropped = 0;
  const attrs = data.attributes;
  if (attrs) {
    for (const name of SESSION_URL_ATTRS) {
      const v = attrs[name];
      if (typeof v !== "string" || !v.startsWith("blob:")) continue;
      if (remap[v]) attrs[name] = remap[v];
      else {
        delete attrs[name];
        dropped++;
      }
    }
  }
  const styles = data.styles;
  if (styles) {
    for (const key of BG_KEYS) {
      const v = styles[key];
      if (typeof v === "string" && v.includes("blob:")) {
        delete styles[key];
        dropped++;
      }
    }
  }
  for (const child of data.children ?? []) dropped += dropSessionMediaUrls(child, remap);
  return dropped;
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
