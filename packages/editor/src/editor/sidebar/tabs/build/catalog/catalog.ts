/**
 * Build Tab — element catalog, spec-aligned to §10.1
 * Every entry has a blockId that exists in blockRegistry.
 * No disabled entries in production.
 * @license BSD-3-Clause
 */

import type { CatEntry, FlatElEntry } from "./types";

export const CATALOG: CatEntry[] = [
  {
    id: "basic",
    name: "Basic",
    sub: "Heading, Text, Button, Icon, Divider, Spacer, Label",
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
        name: "Text",
        iconHtml:
          '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="14" y2="18"/>',
        blockId: "paragraph",
        description: "Multi-line body text block",
        tags: ["text", "body", "content", "copy", "prose", "paragraph"],
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
        name: "List",
        iconHtml:
          '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
        blockId: "list",
        description: "Bulleted or numbered list of items",
        tags: ["bullet", "numbered", "ul", "ol", "items"],
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
        name: "Icon",
        iconHtml:
          '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
        blockId: "icon",
        description: "Inline icon from the icon library",
        tags: ["icon", "symbol", "glyph", "lucide", "pictogram"],
      },
      {
        name: "Divider",
        iconHtml: '<line x1="3" y1="12" x2="21" y2="12"/>',
        blockId: "divider",
        description: "Horizontal rule to separate sections",
        tags: ["hr", "separator", "line", "rule", "break"],
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
        blockId: "label",
        description: "Tag-style label for categorizing content",
        tags: ["tag", "category", "metadata", "chip"],
      },
      {
        name: "Progress",
        iconHtml:
          '<rect x="3" y="10" width="18" height="4" rx="2"/><rect x="3" y="10" width="12" height="4" rx="2" fill="currentColor" stroke="none"/>',
        blockId: "progress",
        description: "Progress bar showing completion percentage",
        tags: ["progress", "bar", "percentage", "loading", "status"],
      },
      {
        name: "Countdown",
        iconHtml:
          '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>',
        blockId: "countdown",
        description: "Countdown timer to a target date",
        tags: ["timer", "countdown", "clock", "deadline", "urgency"],
      },
    ],
  },
  {
    id: "layout",
    name: "Layout",
    sub: "Container, Section, Grid, Columns, Flex, Stack",
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
        name: "Columns",
        iconHtml:
          '<rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>',
        blockId: "columns",
        description: "Two or more columns arranged side by side",
        tags: ["two column", "split", "multi-column", "side by side"],
      },
      {
        name: "Flex",
        iconHtml:
          '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>',
        blockId: "flex",
        description: "Flexible row or column container with alignment controls",
        tags: ["flexbox", "row", "column", "horizontal", "vertical"],
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
        name: "Card",
        iconHtml:
          '<rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>',
        blockId: "card",
        description: "Content card with title, body, and optional image",
        tags: ["card", "panel", "tile", "container"],
      },
      {
        name: "Table",
        iconHtml:
          '<rect x="3" y="5" width="18" height="14" rx="1"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="9" y1="5" x2="9" y2="19"/><line x1="15" y1="5" x2="15" y2="19"/>',
        blockId: "table",
        description: "Tabular data display with rows and columns",
        tags: ["table", "grid", "data", "rows", "columns", "spreadsheet"],
      },
    ],
  },
  {
    id: "forms",
    name: "Forms",
    sub: "Input, Select, Checkbox, Radio, Switch, Slider, Upload, Submit",
    iconHtml:
      '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/>',
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
        iconHtml: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>',
        blockId: "radio",
        description: "Radio button group for single-select options",
        tags: ["radio", "option", "single select", "choice"],
      },
      {
        name: "Switch",
        iconHtml: '<rect x="2" y="8" width="20" height="8" rx="4"/><circle cx="16" cy="12" r="3"/>',
        blockId: "switch",
        description: "On/off toggle switch",
        tags: ["switch", "toggle", "on off", "enable", "disable", "boolean"],
      },
      {
        name: "Slider",
        iconHtml: '<line x1="3" y1="12" x2="21" y2="12"/><circle cx="9" cy="12" r="3"/>',
        blockId: "range",
        description: "Range slider input for numeric values",
        tags: ["range", "slider", "number input", "volume"],
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
        name: "Submit",
        iconHtml:
          '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
        blockId: "submit",
        description: "Submit button for sending form data",
        tags: ["submit", "send", "form submit", "post"],
      },
      {
        name: "Email",
        iconHtml:
          '<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
        blockId: "email",
        description: "Email address input field with validation",
        tags: ["email", "mail", "input", "contact"],
      },
      {
        name: "Password",
        iconHtml:
          '<circle cx="7" cy="12" r="3"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="18" y1="12" x2="18" y2="15"/>',
        blockId: "password",
        description: "Password input field (masked)",
        tags: ["password", "secret", "login", "auth", "masked"],
      },
      {
        name: "Number",
        iconHtml:
          '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
        blockId: "number",
        description: "Numeric input with optional min/max",
        tags: ["number", "numeric", "input", "quantity"],
      },
      {
        name: "Date",
        iconHtml:
          '<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/>',
        blockId: "date",
        description: "Date picker input",
        tags: ["date", "calendar", "picker", "birthday"],
      },
      {
        name: "Time",
        iconHtml:
          '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
        blockId: "time",
        description: "Time picker input",
        tags: ["time", "clock", "picker", "hour"],
      },
      {
        name: "Color",
        iconHtml:
          '<circle cx="12" cy="12" r="9"/><path d="M12 3 L12 21 M3 12 L21 12" stroke-dasharray="2 2"/>',
        blockId: "color",
        description: "Color picker input swatch",
        tags: ["color", "picker", "swatch", "hex"],
      },
      {
        name: "Form",
        iconHtml:
          '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/>',
        blockId: "form",
        description: "Contact form container with submit handling",
        tags: ["contact form", "signup form", "newsletter", "compound"],
      },
    ],
  },
  {
    id: "media",
    name: "Media",
    sub: "Image, Video, Audio, Gallery, SVG, Lottie, Embed, Map",
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
        name: "SVG",
        iconHtml:
          '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
        blockId: "svg",
        description: "Inline SVG vector graphic element",
        tags: ["vector", "graphic", "scalable", "illustration"],
      },
      {
        name: "Lottie",
        iconHtml: '<circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/>',
        blockId: "lottie",
        description: "Lottie JSON animation player",
        tags: ["animation", "json animation", "motion", "aftereffects"],
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
        name: "Map",
        iconHtml:
          '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>',
        blockId: "map-embed",
        description: "Google Maps or Mapbox embed",
        tags: ["google maps", "location", "directions", "mapbox", "address"],
      },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    sub: "Navbar, Footer, CTA",
    iconHtml:
      '<rect x="3" y="5" width="18" height="4" rx="1"/><circle cx="6" cy="7" r="1"/><line x1="10" y1="7" x2="16" y2="7"/>',
    elements: [
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
        name: "CTA",
        iconHtml:
          '<rect x="3" y="8" width="18" height="8" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/>',
        blockId: "cta",
        description: "Call-to-action banner with headline and button",
        tags: ["call to action", "banner", "signup", "convert", "get started"],
      },
    ],
  },
  {
    id: "interactive",
    name: "Interactive",
    sub: "Accordion, Tabs, Modal, Carousel",
    iconHtml:
      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    elements: [
      {
        name: "Accordion",
        iconHtml:
          '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        blockId: "accordion",
        description: "Collapsible accordion / FAQ section",
        tags: ["questions", "accordion", "help", "faq", "collapse", "expandable"],
      },
      {
        name: "Tabs",
        iconHtml:
          '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 8h4V5H3v3zm5 0h4V5H8v3zm5 0h4V5h-4v3z"/>',
        blockId: "tabs",
        description: "Tabbed content panel with switchable sections",
        tags: ["tabs", "tabbed", "panels", "content switcher"],
      },
      {
        name: "Modal",
        iconHtml:
          '<rect x="5" y="5" width="14" height="14" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="12" x2="15" y2="12"/>',
        blockId: "modal",
        description: "Dialog/modal overlay trigger",
        tags: ["dialog", "popup", "overlay", "lightbox"],
      },
      {
        name: "Testimonials",
        iconHtml:
          '<path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>',
        blockId: "testimonials",
        description: "Customer testimonial cards or quote display",
        tags: ["testimonial", "review", "quote", "social proof", "customer"],
      },
      {
        name: "Pricing",
        iconHtml:
          '<path d="M20 12l-8 8-9-9V4h7z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
        blockId: "pricing",
        description: "Pricing plans comparison table",
        tags: ["pricing", "plans", "tiers", "cost", "comparison"],
      },
      {
        name: "Social Icons",
        iconHtml:
          '<circle cx="6" cy="12" r="3"/><circle cx="12" cy="12" r="3"/><circle cx="18" cy="12" r="3"/>',
        blockId: "social-icons",
        description: "Row of social media platform icons",
        tags: ["social", "icons", "links", "twitter", "facebook", "linkedin"],
      },
      {
        name: "Carousel",
        iconHtml:
          '<rect x="5" y="5" width="14" height="14" rx="2"/><polyline points="3 12 5 12"/><polyline points="19 12 21 12"/>',
        blockId: "slider",
        description: "Swipeable image or content carousel",
        tags: ["slider", "slideshow", "swipe", "banner", "hero slider"],
      },
    ],
  },
];

/** Flat list of all elements — computed once at module load, never in render */
export const flatCatalog: FlatElEntry[] = CATALOG.flatMap((cat) =>
  cat.elements.map((el) => ({ ...el, catId: cat.id, catName: cat.name }))
);

/**
 * Pre-grouped catalog by category id — module-level so CatAccordion can read
 * `flatCatalogByCatId[cat.id]` in O(1) instead of re-filtering flatCatalog on
 * every render (6 categories × 53 elements = 318 comparisons per render was
 * the hot path).
 */
export const flatCatalogByCatId: Record<string, FlatElEntry[]> = flatCatalog.reduce(
  (acc, el) => {
    (acc[el.catId] ??= []).push(el);
    return acc;
  },
  {} as Record<string, FlatElEntry[]>
);
