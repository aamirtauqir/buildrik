/**
 * HTML Parsing
 * Functions for parsing HTML strings
 *
 * @module utils/html/parsing
 * @license BSD-3-Clause
 */

import type { ElementData } from "../../types";
import { generateId, kebabToCamel } from "../helpers";
import { unescapeHTML } from "./encoding";
import { getElementTypeFromTag } from "./typeMapping";

// =============================================================================
// PARSED NODE TYPES
// =============================================================================

/**
 * Parsed HTML node
 */
export interface ParsedNode {
  type: "element" | "text" | "comment";
  tag?: string;
  attrs?: Record<string, string>;
  children?: ParsedNode[];
  content?: string;
}

// =============================================================================
// PARSING FUNCTIONS
// =============================================================================

/**
 * Parse HTML string to structured nodes
 */
export function parseHTML(html: string): ParsedNode[] {
  if (typeof DOMParser === "undefined") {
    return parseHTMLRegex(html);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return Array.from(doc.body.childNodes).map(domNodeToParsedNode);
}

/**
 * Convert DOM node to parsed node
 */
function domNodeToParsedNode(node: Node): ParsedNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return {
      type: "text",
      content: node.textContent || "",
    };
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    return {
      type: "comment",
      content: node.textContent || "",
    };
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const attrs: Record<string, string> = {};

    for (const attr of Array.from(el.attributes)) {
      attrs[attr.name] = attr.value;
    }

    return {
      type: "element",
      tag: el.tagName.toLowerCase(),
      attrs,
      children: Array.from(el.childNodes).map(domNodeToParsedNode),
    };
  }

  return { type: "text", content: "" };
}

/**
 * Fallback regex-based HTML parsing
 */
function parseHTMLRegex(html: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];
  const tagPattern =
    /<([a-z][a-z0-9]*)\b([^>]*)>([\s\S]*?)<\/\1>|<([a-z][a-z0-9]*)\b([^>]*)\s*\/?>|([^<]+)/gi;

  let match;
  while ((match = tagPattern.exec(html)) !== null) {
    if (match[1]) {
      // Opening and closing tag
      nodes.push({
        type: "element",
        tag: match[1].toLowerCase(),
        attrs: parseAttrsString(match[2]),
        children: parseHTMLRegex(match[3]),
      });
    } else if (match[4]) {
      // Self-closing or void tag
      nodes.push({
        type: "element",
        tag: match[4].toLowerCase(),
        attrs: parseAttrsString(match[5]),
      });
    } else if (match[6]) {
      // Text content
      const text = match[6].trim();
      if (text) {
        nodes.push({
          type: "text",
          content: text,
        });
      }
    }
  }

  return nodes;
}

/**
 * Parse attributes string to object
 */
function parseAttrsString(str: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([a-z][a-z0-9-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gi;

  let match;
  while ((match = pattern.exec(str)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attrs[name] = unescapeHTML(value);
  }

  return attrs;
}

/**
 * Parse HTML to ElementData
 */
export function parseHTMLToElementData(html: string): ElementData[] {
  const nodes = parseHTML(html);
  return nodes.filter((n) => n.type === "element").map(parsedNodeToElementData);
}

/**
 * Convert parsed node to ElementData
 */
function parsedNodeToElementData(node: ParsedNode): ElementData {
  const type = getElementTypeFromTag(node.tag || "div", node.attrs?.["data-aqb-type"]);

  const data: ElementData = {
    id: node.attrs?.["data-aqb-id"] || generateId("el"),
    type: type as ElementData["type"],
    tagName: node.tag,
  };

  // Extract classes
  if (node.attrs?.class) {
    data.classes = node.attrs.class.split(/\s+/).filter(Boolean);
  }

  // Extract styles
  if (node.attrs?.style) {
    data.styles = parseStyleString(node.attrs.style);
  }

  // Extract other attributes
  const skipAttrs = new Set(["class", "style", "data-aqb-id", "data-aqb-type"]);
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(node.attrs || {})) {
    if (!skipAttrs.has(key)) {
      attrs[key] = value;
    }
  }
  if (Object.keys(attrs).length > 0) {
    data.attributes = attrs;
  }

  // Process children
  if (node.children && node.children.length > 0) {
    const textChildren = node.children.filter((c) => c.type === "text");
    const elementChildren = node.children.filter((c) => c.type === "element");

    // If only text children, set as content
    if (elementChildren.length === 0 && textChildren.length > 0) {
      data.content = textChildren.map((c) => c.content || "").join("");
    } else if (elementChildren.length > 0) {
      data.children = elementChildren.map(parsedNodeToElementData);
    }
  }

  return data;
}

/**
 * Parse inline style string to object
 */
export function parseStyleString(style: string): Record<string, string> {
  const styles: Record<string, string> = {};
  const parts = style.split(";");

  for (const part of parts) {
    const colonIndex = part.indexOf(":");
    if (colonIndex > 0) {
      const prop = part.slice(0, colonIndex).trim();
      const value = part.slice(colonIndex + 1).trim();
      if (prop && value) {
        styles[kebabToCamel(prop)] = value;
      }
    }
  }

  return styles;
}
