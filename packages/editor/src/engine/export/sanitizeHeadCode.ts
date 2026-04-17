/**
 * Sanitize user-provided <head> code via DOMPurify allowlist.
 *
 * Closes the LATENT STORED-XSS vector from the Phase 0 audit (L1): prior to
 * this fix, `settings.head` was persisted unsanitized and rendered into the
 * exported page <head>. `validateHeadCode` in usePageSettings only counted
 * matching tags — it did NOT strip `<script>alert(1)</script>`.
 *
 * Policy:
 * - ALLOW:  <meta>, <link>, <script src="...">, <noscript>, <style>, <base>, <title>
 * - BLOCK:  inline <script> (no src), event handlers, javascript: URIs,
 *           <iframe>, srcdoc, any unknown element, any unknown attribute
 * - NORMALIZE: lowercase tag names, collapse whitespace
 *
 * Runtime:
 * - Browser: direct use of DOMPurify with window.document.
 * - Node (tests, SSR export): caller must set a DOM global first. Vitest's
 *   `jsdom` environment does this automatically. Node-based export tooling
 *   should initialize a JSDOM window and attach it to globalThis.window
 *   before importing this module.
 *
 * @module engine/export/sanitizeHeadCode
 * @license BSD-3-Clause
 */

import createDOMPurify, { type DOMPurify } from "dompurify";

/**
 * Allowlisted tags for the custom <head> surface. Anything outside this list
 * is stripped. Policy leans restrictive: users explicitly opt into less-safe
 * tags in a future UI toggle; default posture is safe.
 */
const ALLOWED_HEAD_TAGS = [
  "meta",
  "link",
  "script",
  "noscript",
  "style",
  "base",
  "title",
];

/**
 * Attributes allowed on the tags above. Any attribute not on this list is
 * stripped. Note the absence of `onload`, `onerror`, `javascript:`-style URIs.
 */
const ALLOWED_HEAD_ATTRS = [
  "name",
  "content",
  "property",
  "charset",
  "http-equiv",
  "rel",
  "href",
  "hreflang",
  "type",
  "media",
  "sizes",
  "src",
  "integrity",
  "crossorigin",
  "referrerpolicy",
  "async",
  "defer",
  "nomodule",
  "as",
  "target",
  "id",
  "lang",
];

// Lazy singleton — only instantiate when sanitization is actually invoked.
let _purify: DOMPurify | null = null;

function getPurify(): DOMPurify {
  if (_purify) return _purify;

  if (typeof window === "undefined" || typeof window.document === "undefined") {
    throw new Error(
      "sanitizeHeadCode requires a DOM global (window + window.document). " +
        "In Node: configure a JSDOM window on globalThis before importing."
    );
  }

  _purify = createDOMPurify(window as unknown as Window & typeof globalThis);

  // Extra guard beyond the allowlist: drop any <script> without a src attribute
  // (inline JS), and any src that resolves to a javascript: URI. The DOMPurify
  // ALLOWED_URI_REGEXP already blocks javascript: on most src-bearing tags,
  // but defense-in-depth is cheap.
  _purify.addHook("uponSanitizeElement", (node: Node, data: { tagName: string }) => {
    if (data.tagName !== "script") return;
    const el = node as Element;
    const src = (el.getAttribute?.("src") ?? "").trim();
    if (!src || src.toLowerCase().startsWith("javascript:")) {
      el.remove?.();
    }
  });

  // DOMPurify's built-in attribute profile for <meta> is stricter than our
  // ALLOWED_ATTR list — it strips `property` (Open Graph) and `itemprop`
  // (Schema.org microdata) even when explicitly allowed. This hook whitelists
  // the attribute names we need on meta/link tags without weakening the
  // overall profile.
  const ATTR_FORCE_ALLOW = new Set([
    "property",
    "itemprop",
    "http-equiv",
    "charset",
    "content",
    "name",
    "rel",
    "href",
    "hreflang",
    "type",
    "media",
    "sizes",
    "src",
    "integrity",
    "crossorigin",
    "referrerpolicy",
    "async",
    "defer",
    "nomodule",
    "as",
    "target",
    "id",
    "lang",
  ]);
  _purify.addHook(
    "uponSanitizeAttribute",
    (_node: Node, data: { attrName: string; keepAttr: boolean }) => {
      if (ATTR_FORCE_ALLOW.has(data.attrName)) {
        data.keepAttr = true;
      }
    }
  );

  return _purify;
}

/**
 * Sanitize a raw HTML string intended for injection into an exported page's
 * <head>. Returns an empty string on empty input.
 *
 * Non-destructive: the user's raw input is still persisted as typed; only the
 * render/export path runs through this sanitizer. Users see what they typed
 * in the settings drawer; attackers can't ship what they typed to visitors.
 */
export function sanitizeHeadCode(raw: string | undefined | null): string {
  if (!raw || !raw.trim()) return "";

  try {
    const purify = getPurify();
    // WHOLE_DOCUMENT: true is REQUIRED to allow head-context tags (<meta>,
    // <link>, <script>, <base>). Without it, DOMPurify treats input as body
    // context and drops every tag typically found in <head>. We wrap the raw
    // input in a full document with the fragment placed in <head>, then
    // extract the sanitized <head> innerHTML.
    const wrapped = `<!DOCTYPE html><html><head>${raw}</head><body></body></html>`;
    const sanitizedDoc = purify.sanitize(wrapped, {
      ALLOWED_TAGS: ALLOWED_HEAD_TAGS,
      ALLOWED_ATTR: ALLOWED_HEAD_ATTRS,
      // ADD_ATTR force-includes attributes DOMPurify's default profile strips
      // from head tags even when they're in ALLOWED_ATTR. `property` on <meta>
      // is the canonical example (required for Open Graph tags).
      ADD_ATTR: ["property", "itemprop", "http-equiv"],
      WHOLE_DOCUMENT: true,
      // Use DOMPurify's default URI regex, which already blocks javascript:
      // and other dangerous schemes while allowing relative/absolute paths.
      // Strip unknown content rather than escape it.
      KEEP_CONTENT: false,
    });
    const out = typeof sanitizedDoc === "string" ? sanitizedDoc : String(sanitizedDoc);

    // Extract the sanitized <head> innerHTML. The DOCTYPE+html wrapper is
    // stripped — we only want what the user can safely inject.
    const match = out.match(/<head>([\s\S]*?)<\/head>/i);
    return match ? match[1].trim() : "";
  } catch (err) {
    // Fail CLOSED: a broken sanitizer must NOT pass raw content through.
    console.warn("[sanitizeHeadCode] sanitization failed; dropping content", err);
    return "";
  }
}
