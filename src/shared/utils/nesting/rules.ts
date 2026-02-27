/**
 * Element Rules Definitions
 * Complete element rules registry
 *
 * @module utils/nesting/rules
 * @license BSD-3-Clause
 */

import type { ElementType } from "../../types";
import { ElementCategory, LandmarkRole, type ElementRule } from "./types";

/**
 * Complete element rules registry
 */
export const ELEMENT_RULES: Record<ElementType, ElementRule> = {
  // Container Elements
  container: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    implicitRole: "generic",
    description: "Generic container element (div equivalent)",
  },
  columns: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    description: "Multi-column layout container",
  },
  grid: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    implicitRole: "grid",
    description: "CSS Grid layout container",
  },
  flex: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    description: "Flexbox layout container",
  },
  card: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    implicitRole: "article",
    description: "Card component container",
  },
  pricing: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.SECTION],
    allowChildren: true,
    description: "Pricing table/section container",
  },
  social: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK],
    allowChildren: true,
    description: "Social media links container",
  },

  // Section Elements (Landmarks)
  section: {
    categories: [
      ElementCategory.CONTAINER,
      ElementCategory.SECTION,
      ElementCategory.BLOCK,
      ElementCategory.SECTIONING,
      ElementCategory.FLOW,
    ],
    allowChildren: true,
    implicitRole: "region",
    isLandmark: true,
    landmarkRole: LandmarkRole.REGION,
    description: "Generic document section",
  },
  hero: {
    categories: [
      ElementCategory.CONTAINER,
      ElementCategory.SECTION,
      ElementCategory.BLOCK,
      ElementCategory.SECTIONING,
    ],
    allowChildren: true,
    description: "Hero/banner section",
  },
  features: {
    categories: [
      ElementCategory.CONTAINER,
      ElementCategory.SECTION,
      ElementCategory.BLOCK,
      ElementCategory.SECTIONING,
    ],
    allowChildren: true,
    description: "Features showcase section",
  },
  cta: {
    categories: [ElementCategory.CONTAINER, ElementCategory.SECTION, ElementCategory.BLOCK],
    allowChildren: true,
    description: "Call-to-action section",
  },
  header: {
    categories: [
      ElementCategory.CONTAINER,
      ElementCategory.SECTION,
      ElementCategory.BLOCK,
      ElementCategory.LANDMARK,
      ElementCategory.FLOW,
    ],
    allowChildren: true,
    forbiddenChildren: ["header", "footer"],
    implicitRole: "banner",
    isLandmark: true,
    landmarkRole: LandmarkRole.BANNER,
    shouldBeUnique: true,
    description: "Page or section header (banner landmark)",
  },
  footer: {
    categories: [
      ElementCategory.CONTAINER,
      ElementCategory.SECTION,
      ElementCategory.BLOCK,
      ElementCategory.LANDMARK,
      ElementCategory.FLOW,
    ],
    allowChildren: true,
    forbiddenChildren: ["header", "footer"],
    implicitRole: "contentinfo",
    isLandmark: true,
    landmarkRole: LandmarkRole.CONTENTINFO,
    shouldBeUnique: true,
    description: "Page or section footer (contentinfo landmark)",
  },
  navbar: {
    categories: [
      ElementCategory.CONTAINER,
      ElementCategory.SECTION,
      ElementCategory.BLOCK,
      ElementCategory.LANDMARK,
      ElementCategory.NAVIGATION,
    ],
    allowChildren: true,
    implicitRole: "navigation",
    isLandmark: true,
    landmarkRole: LandmarkRole.NAVIGATION,
    description: "Navigation bar component",
  },
  nav: {
    categories: [
      ElementCategory.CONTAINER,
      ElementCategory.SECTION,
      ElementCategory.BLOCK,
      ElementCategory.LANDMARK,
      ElementCategory.NAVIGATION,
      ElementCategory.SECTIONING,
    ],
    allowChildren: true,
    implicitRole: "navigation",
    isLandmark: true,
    landmarkRole: LandmarkRole.NAVIGATION,
    description: "Navigation section (navigation landmark)",
  },

  // Text Elements
  text: {
    categories: [ElementCategory.TEXT, ElementCategory.INLINE, ElementCategory.PHRASING],
    allowChildren: true,
    forbiddenChildren: [
      "section",
      "header",
      "footer",
      "nav",
      "form",
      "table",
      "list",
      "hero",
      "features",
      "cta",
    ],
    description: "Inline text element (span equivalent)",
  },
  heading: {
    categories: [
      ElementCategory.TEXT,
      ElementCategory.BLOCK,
      ElementCategory.HEADING,
      ElementCategory.FLOW,
    ],
    allowChildren: true,
    forbiddenChildren: [
      "section",
      "header",
      "footer",
      "nav",
      "form",
      "table",
      "list",
      "heading",
      "paragraph",
    ],
    implicitRole: "heading",
    description: "Heading element (h1-h6)",
  },
  paragraph: {
    categories: [ElementCategory.TEXT, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    forbiddenChildren: [
      "section",
      "header",
      "footer",
      "nav",
      "form",
      "table",
      "list",
      "heading",
      "paragraph",
      "container",
      "flex",
      "grid",
    ],
    description: "Paragraph text element",
  },

  // Interactive Elements
  link: {
    categories: [
      ElementCategory.INTERACTIVE,
      ElementCategory.INLINE,
      ElementCategory.PHRASING,
      ElementCategory.FLOW,
      ElementCategory.TRANSPARENT,
    ],
    allowChildren: true,
    forbiddenChildren: [
      "link",
      "button",
      "input",
      "textarea",
      "select",
      "form",
      "table",
      "list",
      "section",
      "header",
      "footer",
      "nav",
    ],
    implicitRole: "link",
    description: "Hyperlink element",
  },
  button: {
    categories: [
      ElementCategory.INTERACTIVE,
      ElementCategory.INLINE,
      ElementCategory.PHRASING,
      ElementCategory.FLOW,
    ],
    allowChildren: true,
    forbiddenChildren: [
      "link",
      "button",
      "form",
      "input",
      "textarea",
      "select",
      "table",
      "list",
      "section",
      "header",
      "footer",
      "nav",
      "hero",
      "features",
      "cta",
      "container",
      "flex",
      "grid",
      "columns",
      "card",
    ],
    implicitRole: "button",
    description: "Button element",
  },

  // Media Elements
  image: {
    categories: [
      ElementCategory.MEDIA,
      ElementCategory.INLINE,
      ElementCategory.EMBEDDED,
      ElementCategory.PHRASING,
      ElementCategory.VOID,
    ],
    allowChildren: false,
    implicitRole: "img",
    description: "Image element (self-closing)",
  },
  video: {
    categories: [
      ElementCategory.MEDIA,
      ElementCategory.INLINE,
      ElementCategory.EMBEDDED,
      ElementCategory.FLOW,
    ],
    allowChildren: true,
    description: "Video element",
  },
  audio: {
    categories: [ElementCategory.MEDIA, ElementCategory.INLINE, ElementCategory.EMBEDDED],
    allowChildren: false,
    description: "Audio element",
  },
  svg: {
    categories: [ElementCategory.MEDIA, ElementCategory.INLINE, ElementCategory.EMBEDDED],
    allowChildren: false,
    implicitRole: "img",
    description: "SVG graphic element",
  },
  lottie: {
    categories: [ElementCategory.MEDIA, ElementCategory.INLINE, ElementCategory.EMBEDDED],
    allowChildren: false,
    description: "Lottie animation element",
  },
  gallery: {
    categories: [ElementCategory.MEDIA, ElementCategory.BLOCK, ElementCategory.CONTAINER],
    allowChildren: true,
    allowedChildren: ["image", "video", "container"],
    description: "Image/media gallery container",
  },
  icon: {
    categories: [
      ElementCategory.MEDIA,
      ElementCategory.INLINE,
      ElementCategory.PHRASING,
      ElementCategory.VOID,
    ],
    allowChildren: false,
    implicitRole: "img",
    description: "Icon element",
  },

  // Form Elements
  form: {
    categories: [
      ElementCategory.CONTAINER,
      ElementCategory.FORM,
      ElementCategory.BLOCK,
      ElementCategory.FLOW,
      ElementCategory.LANDMARK,
    ],
    allowChildren: true,
    forbiddenChildren: ["form"],
    implicitRole: "form",
    isLandmark: true,
    landmarkRole: LandmarkRole.FORM,
    description: "Form container element",
  },
  input: {
    categories: [
      ElementCategory.FORM,
      ElementCategory.INLINE,
      ElementCategory.PHRASING,
      ElementCategory.VOID,
    ],
    allowChildren: false,
    recommendedParent: ["form"],
    description: "Form input element (self-closing)",
  },
  textarea: {
    categories: [ElementCategory.FORM, ElementCategory.INLINE, ElementCategory.PHRASING],
    allowChildren: false,
    recommendedParent: ["form"],
    description: "Multi-line text input element",
  },
  select: {
    categories: [ElementCategory.FORM, ElementCategory.INLINE, ElementCategory.PHRASING],
    allowChildren: false,
    recommendedParent: ["form"],
    implicitRole: "listbox",
    description: "Dropdown select element",
  },

  // List & Table Elements
  list: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    implicitRole: "list",
    description: "List element (ul/ol)",
  },
  table: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    implicitRole: "table",
    description: "Table element",
  },

  // Component Elements
  slider: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK],
    allowChildren: true,
    description: "Carousel/slider component",
  },
  testimonials: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.SECTION],
    allowChildren: true,
    description: "Testimonials section component",
  },
  progress: {
    categories: [ElementCategory.BLOCK, ElementCategory.INLINE],
    allowChildren: false,
    implicitRole: "progressbar",
    description: "Progress bar element",
  },
  countdown: {
    categories: [ElementCategory.BLOCK],
    allowChildren: false,
    description: "Countdown timer element",
  },
  accordion: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    description: "Accordion/FAQ component with collapsible sections",
  },

  // Ecommerce Elements
  "product-card": {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    implicitRole: "article",
    description: "Product card for e-commerce with image, name, price, and add to cart",
  },
  "product-grid": {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    allowedChildren: ["product-card", "container"],
    description: "Responsive grid for displaying product cards from CMS collection",
  },
  "product-detail": {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.SECTION],
    allowChildren: true,
    implicitRole: "article",
    description: "Full product detail page with image, description, and all product fields",
  },

  // Embed Elements
  "video-embed": {
    categories: [ElementCategory.MEDIA, ElementCategory.BLOCK, ElementCategory.EMBEDDED],
    allowChildren: false,
    description: "Video embed element (YouTube, Vimeo, etc.)",
  },
  "map-embed": {
    categories: [ElementCategory.MEDIA, ElementCategory.BLOCK, ElementCategory.EMBEDDED],
    allowChildren: false,
    description: "Map embed element (Google Maps, etc.)",
  },

  // Utility Elements
  custom: {
    categories: [ElementCategory.CONTAINER, ElementCategory.BLOCK, ElementCategory.FLOW],
    allowChildren: true,
    description: "Custom/generic element",
  },
  spacer: {
    categories: [ElementCategory.BLOCK, ElementCategory.VOID],
    allowChildren: false,
    description: "Spacing element",
  },
  divider: {
    categories: [ElementCategory.VOID, ElementCategory.BLOCK],
    allowChildren: false,
    implicitRole: "separator",
    description: "Horizontal divider/rule",
  },
};

/**
 * Strict nesting rules based on HTML5 spec
 */
export const STRICT_HTML5_RULES: Record<string, { forbidden: string[]; allowed?: string[] }> = {
  heading: {
    forbidden: [
      "heading",
      "section",
      "header",
      "footer",
      "nav",
      "form",
      "table",
      "list",
      "container",
      "flex",
      "grid",
      "columns",
    ],
  },
  paragraph: {
    forbidden: [
      "paragraph",
      "heading",
      "section",
      "header",
      "footer",
      "nav",
      "form",
      "table",
      "list",
      "container",
      "flex",
      "grid",
      "columns",
    ],
  },
  link: {
    forbidden: ["link", "button", "input", "select", "textarea"],
  },
  button: {
    forbidden: ["link", "button", "input", "select", "textarea", "form"],
  },
  form: {
    forbidden: ["form"],
  },
  header: {
    forbidden: ["header", "footer"],
  },
  footer: {
    forbidden: ["header", "footer"],
  },
};
