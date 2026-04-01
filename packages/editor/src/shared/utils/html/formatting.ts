/**
 * HTML Formatting
 * Minification and beautification utilities
 *
 * @module utils/html/formatting
 * @license BSD-3-Clause
 */

import { isSelfClosing } from "./tagCategories";

// =============================================================================
// MINIFICATION OPTIONS
// =============================================================================

/**
 * Minification options
 */
export interface MinifyOptions {
  /** Remove HTML comments */
  removeComments?: boolean;
  /** Collapse whitespace */
  collapseWhitespace?: boolean;
  /** Remove optional tags (</p>, </li>, etc.) */
  removeOptionalTags?: boolean;
  /** Remove attribute quotes when safe */
  removeAttributeQuotes?: boolean;
  /** Remove redundant attributes */
  removeRedundantAttributes?: boolean;
  /** Minify inline CSS */
  minifyCSS?: boolean;
  /** Minify inline JS */
  minifyJS?: boolean;
  /** Preserve line breaks */
  preserveLineBreaks?: boolean;
}

// =============================================================================
// MINIFICATION
// =============================================================================

/**
 * Minify HTML
 */
export function minifyHTML(html: string, options: MinifyOptions = {}): string {
  const {
    removeComments = true,
    collapseWhitespace = true,
    removeOptionalTags = false,
    preserveLineBreaks = false,
  } = options;

  let result = html;

  // Remove comments
  if (removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, "");
  }

  // Collapse whitespace
  if (collapseWhitespace) {
    // Replace multiple whitespace with single space
    result = result.replace(/\s+/g, " ");

    // Remove whitespace around tags
    result = result.replace(/>\s+</g, "><");

    // Trim
    result = result.trim();
  }

  // Preserve line breaks if needed
  if (preserveLineBreaks) {
    result = result.replace(/>\s*\n\s*</g, ">\n<");
  }

  // Remove optional closing tags
  if (removeOptionalTags) {
    result = result.replace(/<\/(li|dt|dd|p|tr|td|th|option|thead|tbody|tfoot)>/gi, "");
  }

  return result;
}

// =============================================================================
// BEAUTIFICATION
// =============================================================================

/**
 * HTML token
 */
interface HTMLToken {
  type: "open" | "close" | "selfClose" | "text" | "comment" | "doctype";
  text: string;
  tag?: string;
}

/**
 * Tokenize HTML for beautification
 */
function tokenizeHTML(html: string): HTMLToken[] {
  const tokens: HTMLToken[] = [];
  const pattern =
    /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/([a-z][a-z0-9]*)\s*>|<([a-z][a-z0-9]*)\b[^>]*\/\s*>|<([a-z][a-z0-9]*)\b[^>]*>|[^<]+/gi;

  let match;
  while ((match = pattern.exec(html)) !== null) {
    const text = match[0];

    if (text.startsWith("<!--")) {
      tokens.push({ type: "comment", text });
    } else if (text.startsWith("<!DOCTYPE")) {
      tokens.push({ type: "doctype", text });
    } else if (match[1]) {
      tokens.push({ type: "close", text, tag: match[1].toLowerCase() });
    } else if (match[2]) {
      tokens.push({ type: "selfClose", text, tag: match[2].toLowerCase() });
    } else if (match[3]) {
      const tag = match[3].toLowerCase();
      if (isSelfClosing(tag)) {
        tokens.push({ type: "selfClose", text, tag });
      } else {
        tokens.push({ type: "open", text, tag });
      }
    } else if (text.trim()) {
      tokens.push({ type: "text", text });
    }
  }

  return tokens;
}

/**
 * Beautify/format HTML
 */
export function beautifyHTML(html: string, indentSize = 2): string {
  const indent = " ".repeat(indentSize);
  let result = "";
  let level = 0;

  // Parse and reformat
  const tokens = tokenizeHTML(html);

  for (const token of tokens) {
    if (token.type === "close" || token.type === "selfClose") {
      if (token.type === "close") {
        level = Math.max(0, level - 1);
      }
      result += indent.repeat(level) + token.text + "\n";
    } else if (token.type === "open") {
      result += indent.repeat(level) + token.text + "\n";
      if (!isSelfClosing(token.tag || "")) {
        level++;
      }
    } else if (token.type === "text") {
      const trimmed = token.text.trim();
      if (trimmed) {
        result += indent.repeat(level) + trimmed + "\n";
      }
    } else if (token.type === "comment") {
      result += indent.repeat(level) + token.text + "\n";
    }
  }

  return result.trim();
}
