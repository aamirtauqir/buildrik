/**
 * Server-side sanitizer for stored element trees (Page.blocks, component
 * masters, version snapshots) and user-template markup.
 *
 * Defense-in-depth at the write boundary: the editor already sanitizes on
 * import/serialize, but a direct API write (or a pre-fix client) could persist
 * hostile blocks. This walks the stored tree and removes what turns into XSS
 * when blocks are rendered to HTML:
 *   - `tagName` not on the shared allowlist (or malformed, e.g.
 *     "img src=x onerror=… x") → "div", content kept
 *   - element rich-text `content` → sanitized with DOMPurify (isomorphic)
 *   - `attributes` → malformed names, `srcdoc`, on* event handlers, and
 *     javascript:/vbscript:/non-image data: URL values are dropped
 *     (`isDangerousUrl`, shared with the editor)
 *
 * The tag/attribute rules are `@buildrik/shared/schemas/element-markup`, the
 * same list the editor applies, so the two sides cannot drift.
 *
 * Mutates in place (the caller writes the tree straight to the DB, so cloning
 * would only add cost) and returns the same reference. Input is untrusted JSON
 * of unknown shape — every access is guarded.
 *
 * Import this file directly from server code only — it pulls in jsdom via
 * isomorphic-dompurify and must never reach the client bundle.
 */
import DOMPurify from "isomorphic-dompurify";
import {
  FORBIDDEN_ATTRIBUTES,
  URL_ATTRIBUTES,
  isAllowedElementTag,
  isDangerousUrl,
  isValidAttributeName,
  srcsetUrls,
} from "@buildrik/shared/schemas/element-markup";

/** Why a node was changed — reported to `onChange` for the dry-run count. */
export type SanitizeReason =
  | "tag"
  | "content"
  | "attr-name"
  | "attr-forbidden"
  | "attr-event-handler"
  | "attr-url";

export type OnSanitizeChange = (reason: SanitizeReason, detail: string) => void;

/** As the editor's sanitizeHTML: DOMPurify drops `target` by default, which
 *  stripped "open in new tab" from every stored rich-text link. */
const PURIFY_CONFIG = { ADD_ATTR: ["target"] };

const EVENT_HANDLER_ATTR = /^on/i;
function unsafeAttributeReason(name: string, value: string): SanitizeReason | null {
  if (!isValidAttributeName(name)) return "attr-name";
  const lower = name.toLowerCase();
  if (FORBIDDEN_ATTRIBUTES.has(lower)) return "attr-forbidden";
  if (EVENT_HANDLER_ATTR.test(name)) return "attr-event-handler";
  if (URL_ATTRIBUTES.has(lower)) {
    const urls = lower === "srcset" ? srcsetUrls(value) : [value];
    if (urls.some(isDangerousUrl)) return "attr-url";
  }
  return null;
}

/** Drop unsafe entries from an attribute map in place. */
function sanitizeAttributeMap(attrs: unknown, onChange?: OnSanitizeChange): void {
  if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return;
  const map = attrs as Record<string, unknown>;
  for (const key of Object.keys(map)) {
    const raw = map[key];
    const reason = unsafeAttributeReason(key, typeof raw === "string" ? raw : "");
    if (reason) {
      onChange?.(reason, key);
      delete map[key];
    }
  }
}

function sanitizeNode(node: Record<string, unknown>, onChange?: OnSanitizeChange): void {
  if (node.tagName != null && node.tagName !== "" && !isAllowedElementTag(node.tagName)) {
    onChange?.("tag", String(node.tagName));
    node.tagName = "div";
  }

  if (typeof node.content === "string" && node.content.length > 0) {
    const clean = String(DOMPurify.sanitize(node.content, PURIFY_CONFIG));
    if (onChange && clean !== node.content) onChange("content", node.content.slice(0, 80));
    node.content = clean;
  }

  sanitizeAttributeMap(node.attributes, onChange);

  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === "object") sanitizeNode(child as Record<string, unknown>, onChange);
    }
  }
}

/**
 * Sanitize a blocks tree (single root node or an array of nodes) in place.
 * Non-object input is returned untouched.
 */
export function sanitizeBlocks<T>(blocks: T, onChange?: OnSanitizeChange): T {
  if (Array.isArray(blocks)) {
    for (const node of blocks) {
      if (node && typeof node === "object") sanitizeNode(node as Record<string, unknown>, onChange);
    }
  } else if (blocks && typeof blocks === "object") {
    sanitizeNode(blocks as Record<string, unknown>, onChange);
  }
  return blocks;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/**
 * A component master (engine ComponentDefinition): its `masterTree`, and the
 * `attributeOverrides` each variant lays onto that tree's elements.
 */
export function sanitizeComponentPayload<T>(payload: T, onChange?: OnSanitizeChange): T {
  const def = asRecord(payload);
  if (!def) return payload;
  sanitizeBlocks(def.masterTree, onChange);
  if (Array.isArray(def.variants)) {
    for (const variant of def.variants) sanitizeAttributeMap(asRecord(variant)?.attributeOverrides, onChange);
  }
  return payload;
}

/** A version (engine NamedVersion): every page root in its project snapshot. */
export function sanitizeVersionPayload<T>(payload: T, onChange?: OnSanitizeChange): T {
  const pages = asRecord(asRecord(payload)?.snapshot)?.pages;
  if (Array.isArray(pages)) {
    for (const page of pages) sanitizeBlocks(asRecord(page)?.root, onChange);
  }
  return payload;
}

/** A saved user template's exported page markup. */
export function sanitizeTemplateHtml(html: string): string {
  return String(DOMPurify.sanitize(html, PURIFY_CONFIG));
}
