/**
 * Data Bind Resolver
 * Parses data-bind attributes in element HTML and creates CMSBindings
 * @license BSD-3-Clause
 */

import type { CMSElementBinding } from "./CMSBindingManager";

/**
 * Parsed data-bind information from an element
 */
export interface ParsedDataBind {
  /** Selector or element reference within the block */
  selector: string;
  /** Field slug to bind */
  fieldSlug: string;
  /** Property to bind (content, src, etc.) */
  property: "content" | "src" | "href" | "alt" | "title";
}

/**
 * Parse data-bind attributes from HTML and extract binding information
 * @param html - HTML string containing data-bind attributes
 * @returns Array of parsed data-bind information
 */
export function parseDataBindAttributes(html: string): ParsedDataBind[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const bindings: ParsedDataBind[] = [];

  doc.querySelectorAll("[data-bind]").forEach((el, index) => {
    const fieldSlug = el.getAttribute("data-bind");
    if (!fieldSlug) return;

    // Determine property based on element type
    let property: ParsedDataBind["property"] = "content";
    if (el.tagName === "IMG") {
      property = "src";
    } else if (el.tagName === "A") {
      property = "href";
    }

    // Generate a unique selector for this element
    const selector = `[data-bind="${fieldSlug}"]:nth-of-type(${index + 1})`;

    bindings.push({
      selector,
      fieldSlug,
      property,
    });
  });

  return bindings;
}

/**
 * Create CMS element bindings from parsed data-bind attributes
 * @param _elementId - The parent element ID containing the bindings (for context)
 * @param collectionId - The collection ID to bind to
 * @param parsedBindings - Array of parsed data-bind information
 * @param itemId - Optional specific item ID, or undefined for repeater context
 * @returns Array of CMS element bindings
 */
export function createBindingsFromDataBind(
  _elementId: string,
  collectionId: string,
  parsedBindings: ParsedDataBind[],
  itemId?: string
): CMSElementBinding[] {
  return parsedBindings.map((parsed) => ({
    binding: {
      sourceId: `cms:${collectionId}`,
      path: itemId ? `${itemId}.${parsed.fieldSlug}` : parsed.fieldSlug,
      type: "variable" as const,
    },
    collectionId,
    itemId,
    fieldSlug: parsed.fieldSlug,
    property: parsed.property,
  }));
}

/**
 * Resolve data-bind attributes in an element using provided data
 * Updates the element's child elements in place based on data-bind attributes
 * @param element - DOM element containing data-bind attributes
 * @param data - Data object with field values
 */
export function resolveDataBindings(element: Element, data: Record<string, unknown>): void {
  const bindElements = element.querySelectorAll("[data-bind]");

  for (const el of bindElements) {
    const field = el.getAttribute("data-bind");
    if (!field || !(field in data)) continue;

    const value = String(data[field] ?? "");

    if (el.tagName === "IMG") {
      el.setAttribute("src", value);
      // Also update alt if not already set
      if (!el.getAttribute("alt") && data["name"]) {
        el.setAttribute("alt", String(data["name"]));
      }
    } else if (el.tagName === "A") {
      el.setAttribute("href", value);
    } else {
      el.textContent = value;
    }
  }
}

/**
 * Get all data-bind field slugs from HTML
 * @param html - HTML string to parse
 * @returns Array of unique field slugs
 */
export function getDataBindFields(html: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const fields = new Set<string>();

  doc.querySelectorAll("[data-bind]").forEach((el) => {
    const field = el.getAttribute("data-bind");
    if (field) {
      fields.add(field);
    }
  });

  return Array.from(fields);
}

/**
 * Check if HTML contains any data-bind attributes
 * @param html - HTML string to check
 * @returns True if data-bind attributes are present
 */
export function hasDataBindAttributes(html: string): boolean {
  return html.includes("data-bind=");
}
