/**
 * Element Information Utilities
 * Shared utilities for getting element names, types, and box model info
 * @license BSD-3-Clause
 */
import { ELEMENT_TYPE_LABELS, elementTypeLabel } from "@/shared/constants/elementTypeLabels";

// Text elements that support inline editing
export const TEXT_ELEMENT_TAGS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "a",
  "label",
  "li",
  "td",
  "th",
  "caption",
  "blockquote",
  "cite",
  "q",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "small",
  "mark",
  "del",
  "ins",
  "sub",
  "sup",
  "abbr",
  "address",
]);

/**
 * Get friendly element name from HTML element
 */
export function getFriendlyName(element: HTMLElement): string {
  // Check for custom name attribute first
  const customName = element.getAttribute("data-buildrick-name");
  if (customName) return customName;

  // Its type, else its tag — both named by the one label map.
  const type = element.getAttribute("data-buildrick-type");
  if (type) return elementTypeLabel(type.toLowerCase());
  return elementTypeLabel(element.tagName.toLowerCase());
}

/**
 * Get friendly element name from type string
 */
export function getElementNameFromType(type: string, tagName?: string): string {
  const normalized = type.toLowerCase();
  /* The element's own type label before its DOM tag — a collection list read
     "Div" and an icon "Span" on the selection tag (L2-V3, 4428:151488). One
     map for both: shared/constants/elementTypeLabels. */
  if (ELEMENT_TYPE_LABELS[normalized]) return ELEMENT_TYPE_LABELS[normalized];
  return elementTypeLabel(tagName ? tagName.toLowerCase() : normalized);
}

/**
 * Get parent element name
 */
export function getParentName(element: HTMLElement): string | null {
  const parent = element.parentElement?.closest("[data-buildrick-id]") as HTMLElement | null;
  if (!parent) return null;
  return getFriendlyName(parent);
}

/** Box model spacing values */
export interface BoxSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Box model structure */
export interface BoxModel {
  margin: BoxSpacing;
  padding: BoxSpacing;
  border: BoxSpacing;
  content: { width: number; height: number };
}

/**
 * Get computed box model for an element
 */
export function getBoxModel(element: HTMLElement): BoxModel {
  const style = window.getComputedStyle(element);

  return {
    margin: {
      top: parseFloat(style.marginTop) || 0,
      right: parseFloat(style.marginRight) || 0,
      bottom: parseFloat(style.marginBottom) || 0,
      left: parseFloat(style.marginLeft) || 0,
    },
    padding: {
      top: parseFloat(style.paddingTop) || 0,
      right: parseFloat(style.paddingRight) || 0,
      bottom: parseFloat(style.paddingBottom) || 0,
      left: parseFloat(style.paddingLeft) || 0,
    },
    border: {
      top: parseFloat(style.borderTopWidth) || 0,
      right: parseFloat(style.borderRightWidth) || 0,
      bottom: parseFloat(style.borderBottomWidth) || 0,
      left: parseFloat(style.borderLeftWidth) || 0,
    },
    content: {
      width:
        element.clientWidth -
        (parseFloat(style.paddingLeft) || 0) -
        (parseFloat(style.paddingRight) || 0),
      height:
        element.clientHeight -
        (parseFloat(style.paddingTop) || 0) -
        (parseFloat(style.paddingBottom) || 0),
    },
  };
}

/** Element information for display */
export interface ElementInfo {
  tagName: string;
  id: string;
  classes: string[];
  dimensions: { width: number; height: number };
  display: string;
  position: string;
  flexDirection?: string;
  isFlexContainer: boolean;
  isGridContainer: boolean;
  isTextElement: boolean;
  friendlyName: string;
  parentName: string | null;
  hasLink: boolean;
}

/**
 * Get element info for badge display
 */
export function getElementInfo(element: HTMLElement): ElementInfo {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const tagName = element.tagName.toLowerCase();

  // Check for link
  const hasLink = tagName === "a" || Boolean(element.closest("a"));

  return {
    tagName,
    id: element.getAttribute("data-buildrick-id") || "",
    classes: Array.from(element.classList),
    dimensions: {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    },
    display: style.display,
    position: style.position,
    flexDirection: style.flexDirection,
    isFlexContainer: style.display === "flex" || style.display === "inline-flex",
    isGridContainer: style.display === "grid" || style.display === "inline-grid",
    isTextElement: TEXT_ELEMENT_TAGS.has(tagName),
    friendlyName: getFriendlyName(element),
    parentName: getParentName(element),
    hasLink,
  };
}

/**
 * Where an element lives, as the boards write it: "Home › Hero › Content" —
 * the active page, then the element's ancestors under the page root, each by
 * its layer name or type label. `includeSelf` adds the element itself.
 */
export function elementLocation(
  composer: {
    elements: {
      getElement(id: string): LocatedElement | undefined;
      getActivePage(): { name?: string } | undefined;
    };
  },
  elementId: string,
  includeSelf = false,
): string {
  const names: string[] = [];
  const self = composer.elements.getElement(elementId);
  let node = includeSelf ? self ?? null : self?.getParent() ?? null;
  while (node?.getParent()) {
    const layer = node.getCustomData?.("layerName");
    names.unshift(typeof layer === "string" && layer ? layer : getElementNameFromType(node.getType()));
    node = node.getParent();
  }
  const page = composer.elements.getActivePage()?.name;
  return [page, ...names].filter(Boolean).join(" › ");
}

interface LocatedElement {
  getParent(): LocatedElement | null;
  getType(): string;
  getCustomData?(key: string): unknown;
}

