/**
 * Server-side sanitizer for the Page.blocks element tree.
 *
 * Defense-in-depth at the write boundary: the editor already sanitizes on
 * import/serialize, but a direct API write (or a pre-fix client) could persist
 * hostile blocks. This walks the stored tree and removes the two things that
 * turn into XSS when blocks are rendered to HTML:
 *   - element rich-text `content` → sanitized with DOMPurify (isomorphic)
 *   - dangerous `attributes` → on* event-handler keys and javascript:/vbscript:/
 *     non-image data: URL values are dropped
 *
 * Mutates in place (the caller writes the tree straight to the DB, so cloning
 * would only add cost) and returns the same reference. Input is untrusted JSON
 * of unknown shape — every access is guarded.
 *
 * Import this file directly from server code only — it pulls in jsdom via
 * isomorphic-dompurify and must never reach the client bundle.
 */
import DOMPurify from "isomorphic-dompurify";

const EVENT_HANDLER_ATTR = /^on/i;
const URL_ATTRS = new Set(["href", "src", "action", "formaction", "poster", "xlink:href"]);
const DANGEROUS_SCHEME = /^\s*(?:javascript|vbscript):/i;
const DATA_SCHEME = /^\s*data:/i;
const SAFE_DATA_SCHEME = /^\s*data:image\//i;

function isUnsafeAttribute(name: string, value: string): boolean {
  if (EVENT_HANDLER_ATTR.test(name)) return true;
  if (URL_ATTRS.has(name.toLowerCase())) {
    if (DANGEROUS_SCHEME.test(value)) return true;
    if (DATA_SCHEME.test(value) && !SAFE_DATA_SCHEME.test(value)) return true;
  }
  return false;
}

function sanitizeNode(node: Record<string, unknown>): void {
  if (typeof node.content === "string" && node.content.length > 0) {
    node.content = String(DOMPurify.sanitize(node.content));
  }

  const attrs = node.attributes;
  if (attrs && typeof attrs === "object" && !Array.isArray(attrs)) {
    const map = attrs as Record<string, unknown>;
    for (const key of Object.keys(map)) {
      const raw = map[key];
      if (isUnsafeAttribute(key, typeof raw === "string" ? raw : "")) {
        delete map[key];
      }
    }
  }

  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      if (child && typeof child === "object") sanitizeNode(child as Record<string, unknown>);
    }
  }
}

/**
 * Sanitize a blocks tree (single root node or an array of nodes) in place.
 * Non-object input is returned untouched.
 */
export function sanitizeBlocks<T>(blocks: T): T {
  if (Array.isArray(blocks)) {
    for (const node of blocks) {
      if (node && typeof node === "object") sanitizeNode(node as Record<string, unknown>);
    }
  } else if (blocks && typeof blocks === "object") {
    sanitizeNode(blocks as Record<string, unknown>);
  }
  return blocks;
}
