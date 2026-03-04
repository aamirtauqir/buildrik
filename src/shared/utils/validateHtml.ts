/**
 * Lightweight HTML validator for custom head/body code injection.
 * Checks for unclosed tags, forbidden tags, and common mistakes.
 * @license BSD-3-Clause
 */

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
