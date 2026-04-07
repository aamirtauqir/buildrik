/**
 * Aquibra Type Mappings
 * Maps between HTML tags and Aquibra element types
 *
 * @module utils/html/typeMapping
 * @license BSD-3-Clause
 */

// =============================================================================
// AQUIBRA TYPE MAPPINGS
// =============================================================================

/**
 * Valid Aquibra element types
 */
export const VALID_ELEMENT_TYPES = new Set([
  "container",
  "text",
  "heading",
  "paragraph",
  "link",
  "image",
  "video",
  "button",
  "form",
  "input",
  "textarea",
  "select",
  "list",
  "table",
  "section",
  "hero",
  "features",
  "cta",
  "columns",
  "grid",
  "flex",
  "navbar",
  "card",
  "pricing",
  "slider",
  "testimonials",
  "countdown",
  "gallery",
  "progress",
  "social",
  "icon",
  "spacer",
  "divider",
  "header",
  "footer",
  "nav",
  "custom",
  "audio",
  "svg",
  "lottie",
]);

/**
 * Map HTML tags to Aquibra element types
 */
export const TAG_TO_TYPE_MAP: Record<string, string> = {
  p: "paragraph",
  hr: "divider",
  a: "link",
  img: "image",
  video: "video",
  button: "button",
  form: "form",
  input: "input",
  textarea: "textarea",
  select: "select",
  ul: "list",
  ol: "list",
  table: "table",
  section: "section",
  div: "container",
  header: "header",
  footer: "footer",
  nav: "nav",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  span: "text",
  audio: "audio",
  svg: "svg",
  article: "section",
  aside: "container",
  main: "container",
  figure: "container",
  figcaption: "text",
  blockquote: "container",
  pre: "text",
  code: "text",
};

/**
 * Map Aquibra element types to default HTML tags
 */
export const TYPE_TO_TAG_MAP: Record<string, string> = {
  container: "div",
  columns: "div",
  grid: "div",
  flex: "div",
  card: "div",
  pricing: "div",
  social: "div",
  hero: "section",
  features: "section",
  cta: "section",
  text: "span",
  heading: "h2",
  paragraph: "p",
  link: "a",
  image: "img",
  video: "video",
  button: "button",
  form: "form",
  input: "input",
  textarea: "textarea",
  select: "select",
  list: "ul",
  divider: "hr",
  table: "table",
  section: "section",
  header: "header",
  footer: "footer",
  nav: "nav",
  navbar: "nav",
  spacer: "div",
  icon: "span",
  audio: "audio",
  svg: "svg",
  gallery: "div",
  slider: "div",
  testimonials: "div",
  countdown: "div",
  progress: "div",
};

/**
 * Container types that can accept children
 */
export const CONTAINER_TYPES = new Set([
  "container",
  "section",
  "columns",
  "grid",
  "flex",
  "card",
  "pricing",
  "social",
  "hero",
  "features",
  "cta",
  "form",
  "list",
  "table",
  "header",
  "footer",
  "nav",
  "navbar",
  "gallery",
  "slider",
  "testimonials",
]);

// =============================================================================
// TYPE MAPPING FUNCTIONS
// =============================================================================

/**
 * Get default tag name for an element type
 */
export function getDefaultTagName(type: string): string {
  return TYPE_TO_TAG_MAP[type] || "div";
}

/**
 * Map a DOM element to an Aquibra element type
 */
export function getElementTypeFromTag(tag: string, dataType?: string | null): string {
  if (dataType && VALID_ELEMENT_TYPES.has(dataType)) {
    return dataType;
  }
  return TAG_TO_TYPE_MAP[tag.toLowerCase()] || "container";
}

/**
 * Check if element type is a container
 */
export function isContainerType(type: string): boolean {
  return CONTAINER_TYPES.has(type);
}
