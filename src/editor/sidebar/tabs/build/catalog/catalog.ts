/**
 * Build Tab v7 — element catalog with descriptions and semantic tags
 * 7 categories, 52 elements
 * @license BSD-3-Clause
 */

import type { CatEntry, FlatElEntry } from "./types";

export const CATALOG: CatEntry[] = [
  {
    id: "basic",
    name: "Text & Buttons",
    sub: "Heading, Paragraph, Button, Link",
    iconHtml:
      '<text x="3" y="17" font-size="15" stroke="none" fill="currentColor" font-family="serif" font-weight="700">H</text>',
    elements: [
      {
        name: "Heading",
        iconHtml:
          '<text x="3" y="17" font-size="15" stroke="none" fill="currentColor" font-family="serif" font-weight="700">H</text>',
        blockId: "heading",
        description: "Title or section heading (H1–H6)",
        tags: ["title", "h1", "h2", "h3", "text", "headline", "header"],
      },
      {
        name: "Paragraph",
        iconHtml:
          '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="14" y2="18"/>',
        blockId: "paragraph",
        description: "Multi-line body text block",
        tags: ["text", "body", "content", "copy", "prose"],
      },
      {
        name: "Button",
        iconHtml:
          '<rect x="3" y="8" width="18" height="8" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/>',
        blockId: "button",
        description: "Clickable action button with label",
        tags: ["cta", "click", "action", "submit", "link button"],
      },
      {
        name: "Link",
        iconHtml:
          '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>',
        blockId: "link",
        description: "Inline hyperlink or anchor text",
        tags: ["anchor", "url", "href", "navigation", "hyperlink"],
      },
      {
        name: "Divider",
        iconHtml: '<line x1="3" y1="12" x2="21" y2="12"/>',
        blockId: "divider",
        description: "Horizontal rule to separate sections",
        tags: ["hr", "separator", "line", "rule", "break"],
      },
      {
        name: "Badge",
        iconHtml:
          '<circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
        // TODO(C2): badge block not in registry yet; "text" is a placeholder — tracked in Phase 3
        blockId: "text",
        description: "Small pill label for status or counts",
        tags: ["tag", "chip", "label", "pill", "status", "count"],
      },
      {
        name: "Spacer",
        iconHtml:
          '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="5" x2="19" y2="5"/><line x1="5" y1="19" x2="19" y2="19"/>',
        blockId: "spacer",
        description: "Empty space block for vertical/horizontal gaps",
        tags: ["gap", "space", "whitespace", "padding", "empty"],
      },
      {
        name: "Label",
        iconHtml:
          '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
        // labelBlockConfig exists in src/blocks/Forms/
        blockId: "label",
        description: "Tag-style label for categorizing content",
        tags: ["tag", "category", "metadata", "chip"],
      },
      {
        name: "Quote",
        iconHtml:
          '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>',
        blockId: "text",
        description: "Blockquote for pulled quotes and testimonials",
        tags: ["blockquote", "testimonial", "citation", "pullquote"],
      },
    ],
  },
  {
    id: "layout",
    name: "Structure & Grids",
    sub: "Container, Grid, Flexbox, Section",
    iconHtml:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    elements: [
      {
        name: "Container",
        iconHtml: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
        blockId: "container",
        description: "Generic wrapper box for grouping elements",
        tags: ["box", "wrapper", "div", "group", "block"],
      },
      {
        name: "Section",
        iconHtml:
          '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>',
        blockId: "section",
        description: "Full-width page section with header area",
        tags: ["page section", "row", "block", "area"],
      },
      {
        name: "Grid",
        iconHtml:
          '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        blockId: "grid",
        description: "CSS grid layout with configurable columns",
        tags: ["css grid", "columns", "layout", "gallery grid"],
      },
      {
        name: "Flexbox",
        iconHtml:
          '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>',
        blockId: "flex",
        description: "Flexible row/column container with alignment controls",
        tags: ["flex", "flexbox", "row", "column", "horizontal"],
      },
      {
        name: "Columns",
        iconHtml:
          '<rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>',
        blockId: "columns",
        description: "Side-by-side column layout",
        tags: ["two column", "sidebar", "split", "multi-column"],
      },
      {
        name: "Stack",
        iconHtml:
          '<rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>',
        blockId: "stack",
        description: "Vertical stack of equally-spaced children",
        tags: ["vertical", "list", "rows", "stacked"],
      },
      {
        name: "Div",
        iconHtml: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
        blockId: "container",
        description: "Raw div element for custom styling",
        tags: ["div", "container", "box", "generic"],
      },
      {
        name: "Wrapper",
        iconHtml:
          '<rect x="2" y="2" width="20" height="20" rx="3"/><rect x="6" y="6" width="12" height="12" rx="1"/>',
        blockId: "container",
        description: "Centered content wrapper with max-width constraint",
        tags: ["max-width", "centered", "constrained", "page wrapper"],
      },
    ],
  },
  {
    id: "forms",
    name: "Forms & Inputs",
    sub: "Input, Select, Checkbox, Toggle",
    iconHtml:
      '<rect x="3" y="5" width="18" height="4" rx="1"/><rect x="3" y="11" width="18" height="4" rx="1"/><rect x="3" y="17" width="9" height="4" rx="1"/>',
    elements: [
      {
        name: "Input",
        iconHtml:
          '<rect x="3" y="8" width="18" height="8" rx="1"/><line x1="6" y1="12" x2="10" y2="12"/>',
        blockId: "input",
        description: "Single-line text input field",
        tags: ["text field", "text box", "field", "email", "name", "search input"],
      },
      {
        name: "Textarea",
        iconHtml:
          '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/>',
        blockId: "textarea",
        description: "Multi-line text area for longer input",
        tags: ["text area", "comment", "message", "multiline", "notes"],
      },
      {
        name: "Select",
        iconHtml:
          '<rect x="3" y="7" width="18" height="10" rx="1"/><polyline points="15 11 18 11"/>',
        blockId: "select",
        description: "Dropdown select menu",
        tags: ["dropdown", "picker", "choose", "option", "combobox"],
      },
      {
        name: "Checkbox",
        iconHtml:
          '<rect x="4" y="4" width="16" height="16" rx="2"/><polyline points="9 12 11 14 15 10"/>',
        blockId: "checkbox",
        description: "Checkbox for boolean or multi-select options",
        tags: ["check", "tick", "agree", "terms", "multi select"],
      },
      {
        name: "Radio",
        iconHtml: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
        blockId: "radio",
        description: "Radio button for single-select from a group",
        tags: ["radio button", "option", "single select", "choice"],
      },
      {
        name: "Toggle",
        iconHtml: '<rect x="2" y="8" width="20" height="8" rx="4"/><circle cx="16" cy="12" r="3"/>',
        blockId: "switch",
        description: "On/off toggle switch",
        tags: ["switch", "on off", "enable", "disable", "boolean"],
      },
      {
        name: "Slider",
        iconHtml:
          '<line x1="3" y1="12" x2="21" y2="12"/><circle cx="15" cy="12" r="3"/>',
        blockId: "range",
        description: "Range slider for numeric value selection",
        tags: ["range", "scrubber", "volume", "price range", "numeric"],
      },
      {
        name: "Upload",
        iconHtml:
          '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
        blockId: "file",
        description: "File upload dropzone",
        tags: ["file upload", "drop zone", "attachment", "photo upload"],
      },
      {
        name: "Form",
        iconHtml:
          '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/>',
        blockId: "form",
        description: "Contact form container with submit handling",
        tags: ["contact form", "signup form", "submit", "newsletter"],
      },
    ],
  },
  {
    id: "media",
    name: "Media",
    sub: "Image, Video, Gallery, Lottie",
    iconHtml:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    elements: [
      {
        name: "Image",
        iconHtml:
          '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
        blockId: "image",
        description: "Responsive image with alt text support",
        tags: ["photo", "picture", "img", "figure", "illustration"],
      },
      {
        name: "Video",
        iconHtml:
          '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
        blockId: "video",
        description: "Video player with controls",
        tags: ["player", "youtube", "mp4", "media", "clip"],
      },
      {
        name: "Audio",
        iconHtml: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/>',
        blockId: "audio",
        description: "Audio player for music or podcasts",
        tags: ["sound", "music", "podcast", "mp3"],
      },
      {
        name: "Gallery",
        iconHtml:
          '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="10" width="7" height="5" rx="1"/><rect x="3" y="12" width="7" height="9" rx="1"/>',
        blockId: "gallery",
        description: "Masonry or grid photo gallery",
        tags: ["photos", "album", "portfolio", "lightbox", "images"],
      },
      {
        name: "Carousel",
        iconHtml:
          '<rect x="5" y="5" width="14" height="14" rx="2"/><polyline points="3 12 5 12"/><polyline points="19 12 21 12"/>',
        blockId: "slider",
        description: "Swipeable image or content carousel",
        tags: ["slider", "slideshow", "swipe", "banner", "hero slider"],
      },
      {
        name: "SVG",
        iconHtml:
          '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
        blockId: "svg",
        description: "Inline SVG vector graphic element",
        tags: ["vector", "icon", "graphic", "scalable", "illustration"],
      },
      {
        name: "Lottie",
        iconHtml: '<circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/>',
        blockId: "lottie",
        description: "Lottie JSON animation player",
        tags: ["animation", "json animation", "motion", "aftereffects"],
      },
    ],
  },
  {
    id: "sections",
    name: "Page Sections",
    sub: "Hero, Navbar, Footer, CTA",
    iconHtml:
      '<rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="7" rx="1"/><rect x="3" y="20" width="18" height="1" rx="0.5"/>',
    elements: [
      {
        name: "Hero",
        iconHtml:
          '<rect x="3" y="3" width="18" height="9" rx="1"/><line x1="7" y1="7" x2="14" y2="7"/><line x1="7" y1="9.5" x2="11" y2="9.5"/>',
        blockId: "hero",
        description: "Full-width hero banner with headline and CTA",
        tags: ["banner", "landing", "above the fold", "homepage hero", "header section"],
      },
      {
        name: "Navbar",
        iconHtml:
          '<rect x="3" y="5" width="18" height="4" rx="1"/><circle cx="6" cy="7" r="1"/><line x1="10" y1="7" x2="16" y2="7"/>',
        blockId: "navbar",
        description: "Top navigation bar with logo and links",
        tags: ["navigation", "menu", "header", "nav", "top bar"],
      },
      {
        name: "Footer",
        iconHtml:
          '<rect x="3" y="15" width="18" height="6" rx="1"/><line x1="7" y1="18" x2="17" y2="18"/>',
        blockId: "footer",
        description: "Site footer with links and copyright",
        tags: ["bottom", "site footer", "copyright", "contact links"],
      },
      {
        name: "Features",
        iconHtml:
          '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        blockId: "features",
        description: "Feature grid showcasing product benefits",
        tags: ["benefits", "services", "why us", "feature list", "icons grid"],
      },
      {
        name: "Pricing",
        iconHtml:
          '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>',
        blockId: "pricing",
        description: "Pricing plans comparison table",
        tags: ["price table", "plans", "subscription", "tiers", "billing"],
      },
      {
        name: "CTA",
        iconHtml:
          '<rect x="3" y="8" width="18" height="8" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/>',
        blockId: "cta",
        description: "Call-to-action banner with headline and button",
        tags: ["call to action", "banner", "signup", "convert", "get started"],
      },
      {
        name: "Testimonial",
        iconHtml:
          '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
        blockId: "testimonials",
        description: "Customer review or testimonial card",
        tags: ["review", "quote", "social proof", "customer", "feedback"],
      },
      {
        name: "FAQ",
        iconHtml:
          '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        blockId: "accordion",
        description: "Collapsible FAQ accordion section",
        tags: ["questions", "accordion", "help", "faq", "collapse"],
      },
    ],
  },
  {
    id: "ecom",
    name: "E-Commerce",
    sub: "Product, Cart, Checkout, Reviews",
    iconHtml:
      '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>',
    elements: [
      {
        name: "Product",
        iconHtml:
          '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/>',
        blockId: "product-card",
        description: "Product card with image, title and price",
        tags: ["product card", "shop", "buy", "item", "store"],
      },
      {
        name: "Cart",
        iconHtml:
          '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>',
        blockId: "cart-button",
        description: "Shopping cart icon and item count",
        tags: ["shopping cart", "basket", "buy", "checkout button"],
      },
      {
        name: "Checkout",
        iconHtml:
          '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
        blockId: "product-detail",
        description: "Checkout form with payment and shipping fields",
        tags: ["payment", "order", "purchase", "buy now", "checkout form"],
      },
      {
        name: "Price Tag",
        iconHtml:
          '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
        blockId: "pricing",
        description: "Price display with optional sale/discount badge",
        tags: ["price", "cost", "sale", "discount", "tag"],
      },
      {
        name: "Reviews",
        iconHtml:
          '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        blockId: "testimonials",
        description: "Star rating and customer review section",
        tags: ["ratings", "stars", "review", "feedback", "testimonials"],
      },
    ],
  },
  {
    id: "advanced",
    name: "Custom Code & Embeds",
    sub: "Custom Code, Embed, iFrame",
    iconHtml: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    elements: [
      {
        name: "Custom Code",
        iconHtml: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
        // TODO(C2): custom-code block not in registry yet — tracked in Phase 3
        blockId: "text",
        disabled: true,
        description: "Raw HTML, CSS or JavaScript code block",
        tags: ["html", "css", "javascript", "code", "script", "raw"],
      },
      {
        name: "Embed",
        iconHtml:
          '<rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/>',
        blockId: "video-embed",
        description: "Embed external content (YouTube, Spotify, Figma)",
        tags: ["youtube embed", "spotify", "figma", "iframe embed", "external"],
      },
      {
        name: "iFrame",
        iconHtml:
          '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/>',
        // Using video-embed as proxy for MVP. Create dedicated iframe block in Phase 3.
        blockId: "video-embed",
        description: "Inline frame to embed any external URL",
        tags: ["iframe", "embed url", "external page", "widget"],
      },
      {
        name: "Map",
        iconHtml:
          '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>',
        blockId: "map-embed",
        description: "Google Maps or Mapbox embed",
        tags: ["google maps", "location", "directions", "mapbox", "address"],
      },
      {
        name: "Analytics",
        iconHtml:
          '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
        // TODO(C2): analytics/custom-code block not in registry yet — tracked in Phase 3
        blockId: "text",
        disabled: true,
        description: "Analytics or tracking script snippet",
        tags: ["tracking", "google analytics", "metrics", "pixel", "tag"],
      },
    ],
  },
];

/** Flat list of all elements — computed once at module load, never in render */
export const flatCatalog: FlatElEntry[] = CATALOG.flatMap((cat) =>
  cat.elements.map((el) => ({ ...el, catId: cat.id, catName: cat.name }))
);

export const BUILD_TIP =
  "Drag any element onto the canvas, or click it to add below your current selection.";
