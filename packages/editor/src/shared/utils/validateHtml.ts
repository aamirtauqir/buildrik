/**
 * Lightweight HTML validator for custom head/body code injection.
 * Checks for unclosed tags, forbidden tags, and common mistakes.
 * @license BSD-3-Clause
 */

import { ALLOWED_HEAD_TAGS } from "../constants/headCode";

export interface HtmlValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/** Tags that are self-closing and don't need a closing tag */
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** Tags forbidden in <head> or custom injection contexts */
const FORBIDDEN_TAGS = new Set(["html", "body", "head", "iframe"]);

export function validateHtml(code: string): HtmlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!code.trim()) {
    return { valid: true, warnings: [], errors: [] };
  }

  // Check for forbidden tags
  const forbiddenMatch = code.match(/<(html|body|head|iframe)\b/gi);
  if (forbiddenMatch) {
    const tags = [...new Set(forbiddenMatch.map((m) => m.slice(1).toLowerCase()))];
    errors.push(`Forbidden tag${tags.length > 1 ? "s" : ""}: <${tags.join(">, <")}>`);
  }

  // Check for unclosed tags — simple stack-based approach
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
  const stack: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(code)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1].toLowerCase();

    if (FORBIDDEN_TAGS.has(tagName)) continue; // already reported

    // Self-closing syntax like <br/> or void elements
    if (fullMatch.endsWith("/>") || VOID_ELEMENTS.has(tagName)) continue;

    if (fullMatch.startsWith("</")) {
      // Closing tag
      if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
        errors.push(`Unexpected closing tag: </${tagName}>`);
      } else {
        stack.pop();
      }
    } else {
      // Opening tag
      stack.push(tagName);
    }
  }

  if (stack.length > 0) {
    errors.push(`Unclosed tag${stack.length > 1 ? "s" : ""}: <${stack.join(">, <")}>`);
  }

  /* The export sanitizer's allowlist, reported here instead of at publish
     time. This validator used to answer "✓ HTML looks good" for any tag
     outside the allowlist, all of which are dropped silently. Same list, one
     source: shared/constants/headCode.
     An inline <script> in the site's code ships to the published site and the
     ZIP (REA #27) but is kept inert inside the app, so a widget that does
     nothing in Preview is expected — said here, where it is typed. */
  const inlineScript = /<script(?![^>]*\bsrc\s*=)[^>]*>/i.test(code);
  if (inlineScript) {
    warnings.push(
      "Inline <script> runs on the published site and in the ZIP export — not in the editor or Preview"
    );
  }

  const used = [...code.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)\b/g)].map((m) => m[1].toLowerCase());
  const dropped = [...new Set(used)].filter(
    (t) => !ALLOWED_HEAD_TAGS.includes(t) && !FORBIDDEN_TAGS.has(t)
  );
  if (dropped.length) {
    warnings.push(
      `Removed when published: <${dropped.join(">, <")}> — only <${ALLOWED_HEAD_TAGS.join(">, <")}> survive`
    );
  }

  // Warn about inline event handlers (XSS risk)
  if (/\bon\w+\s*=/i.test(code)) {
    warnings.push("Inline event handlers detected (e.g., onclick) — consider external scripts instead");
  }

  // Warn about document.write
  if (/document\.write/i.test(code)) {
    warnings.push("document.write can break page rendering — avoid if possible");
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
