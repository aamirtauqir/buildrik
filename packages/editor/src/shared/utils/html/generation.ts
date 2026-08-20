/**
 * HTML Generation
 * Functions for generating HTML strings
 *
 * @module utils/html/generation
 * @license BSD-3-Clause
 */

import type { ElementData } from "../../types";
import { camelToKebab } from "../helpers";
import { escapeAttr } from "./encoding";
import { isSafeAttrValue } from "./sanitization";
import { isSelfClosing } from "./tagCategories";

// =============================================================================
// GENERATION OPTIONS
// =============================================================================

/**
 * Options for HTML generation
 */
export interface HTMLGenerationOptions {
  /** Include data-buildrick-* attributes (for editor mode) */
  includeDataAttributes?: boolean;
  /** Pretty print with indentation */
  prettyPrint?: boolean;
  /** Indent string (default: 2 spaces) */
  indentString?: string;
  /** Current indentation level (internal use) */
  indentLevel?: number;
  /** Include comments */
  includeComments?: boolean;
  /** Self-close void elements (<br /> vs <br>) */
  xhtml?: boolean;
}

// =============================================================================
// GENERATION FUNCTIONS
// =============================================================================

/**
 * Build HTML attributes string from ElementData
 */
export function buildAttributeString(
  data: {
    id?: string;
    type?: string;
    classes?: string[];
    attributes?: Record<string, string>;
    styles?: Record<string, string>;
    /** Interactions live here, not in `attributes` — see below. */
    data?: Record<string, unknown>;
  },
  options: HTMLGenerationOptions = {}
): string {
  const parts: string[] = [];
  const { includeDataAttributes = false } = options;

  // Aquibra data attributes (for editor mode)
  if (includeDataAttributes) {
    if (data.id) {
      parts.push(`data-buildrick-id="${escapeAttr(data.id)}"`);
    }
    if (data.type) {
      parts.push(`data-buildrick-type="${escapeAttr(data.type)}"`);
    }
  }

  // User-defined ID attribute
  if (data.attributes?.id) {
    parts.push(`id="${escapeAttr(data.attributes.id)}"`);
  }

  // Classes
  if (data.classes && data.classes.length > 0) {
    parts.push(`class="${escapeAttr(data.classes.join(" "))}"`);
  }

  // Other attributes (except id, already handled). Drop anything unsafe by
  // construction: on* handlers, dangerous values, and bad href/src/action
  // schemes never reach the serialized HTML, even if the ElementData bypassed
  // the import-time sanitizer.
  if (data.attributes) {
    Object.entries(data.attributes).forEach(([key, value]) => {
      if (key === "id") return;
      if (!isSafeAttrValue(key, value, "")) return;
      if (value === "" || value === "true") {
        // Boolean attribute
        parts.push(key);
      } else if (value !== "false") {
        parts.push(`${key}="${escapeAttr(value)}"`);
      }
    });
  }

  /* Interactions are stored on `data.data.interactions`, and only the LIVE
     element's `getAttributes()` folds them into an attribute — so anything
     serialized from ElementData lost them. That is the path the in-shell
     preview takes (`HTMLParser.toHTML`), which is why a click animation
     configured in the inspector did nothing in Preview while working on the
     published page (the export emits this itself, ExportEngine:985). */
  const interactions = data.data?.interactions;
  if (Array.isArray(interactions) && interactions.length > 0) {
    parts.push(`data-buildrick-interactions="${escapeAttr(JSON.stringify(interactions))}"`);
  }

  // Inline styles — drop the whole declaration block if it carries a dangerous
  // CSS pattern (expression(), -moz-binding, behavior:).
  if (data.styles && Object.keys(data.styles).length > 0) {
    const styleStr = Object.entries(data.styles)
      .map(([k, v]) => `${camelToKebab(k)}: ${v}`)
      .join("; ");
    if (isSafeAttrValue("style", styleStr, "")) {
      parts.push(`style="${escapeAttr(styleStr)}"`);
    }
  }

  return parts.length > 0 ? " " + parts.join(" ") : "";
}

/**
 * Convert ElementData to HTML string
 */
export function elementDataToHTML(data: ElementData, options: HTMLGenerationOptions = {}): string {
  const { prettyPrint = false, indentString = "  ", indentLevel = 0, xhtml = false } = options;

  const tag = data.tagName || "div";
  const attrs = buildAttributeString(data, options);
  const content = data.content || "";
  const indent = prettyPrint ? indentString.repeat(indentLevel) : "";
  const newline = prettyPrint ? "\n" : "";

  // Self-closing tags
  if (isSelfClosing(tag)) {
    const closing = xhtml ? " />" : ">";
    return `${indent}<${tag}${attrs}${closing}`;
  }

  // Build children HTML
  const childOptions = { ...options, indentLevel: indentLevel + 1 };
  const childrenHTML =
    data.children?.map((child) => elementDataToHTML(child, childOptions)).join(newline) || "";

  const hasChildren = childrenHTML.length > 0;
  const hasContent = content.length > 0;

  if (!hasChildren && !hasContent) {
    return `${indent}<${tag}${attrs}></${tag}>`;
  }

  if (prettyPrint && hasChildren) {
    return `${indent}<${tag}${attrs}>${newline}${childrenHTML}${newline}${indent}</${tag}>`;
  }

  return `${indent}<${tag}${attrs}>${content}${childrenHTML}</${tag}>`;
}

/**
 * Create an HTML element string
 */
export function createElement(
  tag: string,
  attrs: Record<string, string> = {},
  content: string = ""
): string {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => {
      if (v === "" || v === "true") return k;
      if (v === "false") return "";
      return `${k}="${escapeAttr(v)}"`;
    })
    .filter(Boolean)
    .join(" ");

  const attrPart = attrStr ? ` ${attrStr}` : "";

  if (isSelfClosing(tag)) {
    return `<${tag}${attrPart}>`;
  }

  return `<${tag}${attrPart}>${content}</${tag}>`;
}

/**
 * Wrap content in an HTML tag
 */
export function wrapInTag(
  content: string,
  tag: string,
  attrs: Record<string, string> = {}
): string {
  return createElement(tag, attrs, content);
}

/**
 * Create an HTML comment
 */
export function createComment(text: string): string {
  // Prevent XSS via comments
  const safe = text.replace(/-->/g, "-- >").replace(/<!--/g, "< !--");
  return `<!-- ${safe} -->`;
}
