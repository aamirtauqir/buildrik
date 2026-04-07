/**
 * Element Information Utilities
 * Shared utilities for getting element names, types, and box model info
 * @license BSD-3-Clause
 */

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

/** Element type to friendly name mapping - SINGLE SOURCE OF TRUTH */
export const TYPE_NAME_MAP: Record<string, string> = {
  container: "Container",
  section: "Section",
  row: "Row",
  column: "Column",
  heading: "Heading",
  paragraph: "Paragraph",
  text: "Text",
  image: "Image",
  button: "Button",
  link: "Link",
  video: "Video",
  form: "Form",
  input: "Input",
  div: "Div",
  span: "Span",
  nav: "Navigation",
  header: "Header",
  footer: "Footer",
  main: "Main",
  aside: "Sidebar",
  article: "Article",
};

/** HTML tag to friendly name mapping */
const TAG_NAME_MAP: Record<string, string> = {
  div: "Div",
  section: "Section",
  article: "Article",
  nav: "Navigation",
  header: "Header",
  footer: "Footer",
  main: "Main",
  aside: "Sidebar",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  p: "Paragraph",
  span: "Span",
  a: "Link",
  img: "Image",
  button: "Button",
  input: "Input",
  form: "Form",
  ul: "List",
  ol: "Ordered List",
  li: "List Item",
  table: "Table",
  video: "Video",
  iframe: "Embed",
};

/** Element type to icon mapping - SINGLE SOURCE OF TRUTH */
export const TYPE_ICON_MAP: Record<string, string> = {
  container: "□",
  section: "▭",
  row: "⫿",
  column: "⫾",
  heading: "H",
  paragraph: "¶",
  text: "T",
  image: "🖼",
  button: "⬜",
  link: "🔗",
  video: "▶",
  form: "📋",
  input: "⬜",
  nav: "☰",
  header: "▤",
  footer: "▤",
  div: "□",
  span: "⟨⟩",
};

/**
 * Get friendly element name from HTML element
 */
export function getFriendlyName(element: HTMLElement): string {
  // Check for custom name attribute first
  const customName = element.getAttribute("data-aqb-name");
  if (customName) return customName;

  // Check for type attribute
  const type = element.getAttribute("data-aqb-type");
  if (type) {
    return TYPE_NAME_MAP[type.toLowerCase()] || type;
  }

  // Fall back to tag name
  const tagName = element.tagName.toLowerCase();
  return TAG_NAME_MAP[tagName] || tagName.charAt(0).toUpperCase() + tagName.slice(1);
}

/**
 * Get friendly element name from type string
 */
export function getElementNameFromType(type: string, tagName?: string): string {
  const normalized = type.toLowerCase();
  if (TYPE_NAME_MAP[normalized]) return TYPE_NAME_MAP[normalized];
  if (tagName) {
    const tagNormalized = tagName.toLowerCase();
    return TAG_NAME_MAP[tagNormalized] || tagName.charAt(0).toUpperCase() + tagName.slice(1);
  }
  return type;
}

/**
 * Get parent element name
 */
export function getParentName(element: HTMLElement): string | null {
  const parent = element.parentElement?.closest("[data-aqb-id]") as HTMLElement | null;
  if (!parent) return null;
  return getFriendlyName(parent);
}

/**
 * Get element type icon
 */
export function getTypeIcon(type: string): string {
  return TYPE_ICON_MAP[type.toLowerCase()] || "◇";
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
  hasCMSBinding: boolean;
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

  // Check for CMS binding (data attribute)
  const hasCMSBinding =
    element.hasAttribute("data-aqb-cms-bound") ||
    Boolean(element.querySelector("[data-aqb-cms-bound]"));

  return {
    tagName,
    id: element.getAttribute("data-aqb-id") || "",
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
    hasCMSBinding,
  };
}
