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
    elements: [
      {
        name: "Heading",
        blockId: "heading",
        description: "Title or section heading (H1–H6)",
        tags: ["title", "h1", "h2", "h3", "text", "headline", "header"],
      },
      {
        name: "Text",
        blockId: "paragraph",
        description: "Multi-line body text block",
        tags: ["text", "body", "content", "copy", "prose", "paragraph"],
      },
      {
        name: "Link",
        blockId: "link",
        description: "Inline hyperlink or anchor text",
        tags: ["anchor", "url", "href", "navigation", "hyperlink"],
      },
      {
        // G3-079 (board 4428:151488): repeats its card once per CMS record —
        // bind it under Settings › Collection.
        name: "Collection list",
        blockId: "collection-list",
        description: "Repeats its card for every item in a CMS collection",
        tags: ["cms", "collection", "repeater", "list", "dynamic", "loop", "items"],
      },
      {
        name: "List",
        blockId: "list",
        description: "Bulleted or numbered list of items",
        tags: ["bullet", "numbered", "ul", "ol", "items"],
      },
      {
        name: "Button",
        blockId: "button",
        description: "Clickable action button with label",
        tags: ["cta", "click", "action", "submit", "link button"],
      },
      {
        name: "Icon",
        blockId: "icon",
        description: "Inline icon from the icon library",
        tags: ["icon", "symbol", "glyph", "lucide", "pictogram"],
      },
      {
        name: "Divider",
        blockId: "divider",
        description: "Horizontal rule to separate sections",
        tags: ["hr", "separator", "line", "rule", "break"],
      },
      {
        name: "Spacer",
        blockId: "spacer",
        description: "Empty space block for vertical/horizontal gaps",
        tags: ["gap", "space", "whitespace", "padding", "empty"],
      },
      {
        name: "Label",
        blockId: "label",
        description: "Tag-style label for categorizing content",
        tags: ["tag", "category", "metadata", "chip"],
      },
      {
        name: "Progress",
        blockId: "progress",
        description: "Progress bar showing completion percentage",
        tags: ["progress", "bar", "percentage", "loading", "status"],
      },
      {
        name: "Countdown",
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
    elements: [
      {
        name: "Container",
        blockId: "container",
        description: "Generic wrapper box for grouping elements",
        tags: ["box", "wrapper", "div", "group", "block"],
      },
      {
        name: "Section",
        blockId: "section",
        description: "Full-width page section with header area",
        tags: ["page section", "row", "block", "area"],
      },
      {
        name: "Grid",
        blockId: "grid",
        description: "CSS grid layout with configurable columns",
        tags: ["css grid", "columns", "layout", "gallery grid"],
      },
      {
        name: "Columns",
        blockId: "columns",
        description: "Two or more columns arranged side by side",
        tags: ["two column", "split", "multi-column", "side by side"],
      },
      {
        name: "Flex",
        blockId: "flex",
        description: "Flexible row or column container with alignment controls",
        tags: ["flexbox", "row", "column", "horizontal", "vertical"],
      },
      {
        name: "Stack",
        blockId: "stack",
        description: "Vertical stack of equally-spaced children",
        tags: ["vertical", "list", "rows", "stacked"],
      },
      {
        name: "Card",
        blockId: "card",
        description: "Content card with title, body, and optional image",
        tags: ["card", "panel", "tile", "container"],
      },
      {
        name: "Table",
        blockId: "table",
        description: "Tabular data display with rows and columns",
        tags: ["table", "grid", "data", "rows", "columns", "spreadsheet"],
      },
    ],
  },
  {
    id: "forms",
    name: "Forms",
    sub: "Input, Select, Checkbox, Radio, Switch, Slider, Submit",
    elements: [
      {
        name: "Input",
        blockId: "input",
        description: "Single-line text input field",
        tags: ["text field", "text box", "field", "email", "name", "search input"],
      },
      {
        name: "Textarea",
        blockId: "textarea",
        description: "Multi-line text area for longer input",
        tags: ["text area", "comment", "message", "multiline", "notes"],
      },
      {
        name: "Select",
        blockId: "select",
        description: "Dropdown select menu",
        tags: ["dropdown", "picker", "choose", "option", "combobox"],
      },
      {
        name: "Checkbox",
        blockId: "checkbox",
        description: "Checkbox for boolean or multi-select options",
        tags: ["check", "tick", "agree", "terms", "multi select"],
      },
      {
        name: "Radio",
        blockId: "radio",
        description: "Radio button group for single-select options",
        tags: ["radio", "option", "single select", "choice"],
      },
      {
        name: "Switch",
        blockId: "switch",
        description: "On/off toggle switch",
        tags: ["switch", "toggle", "on off", "enable", "disable", "boolean"],
      },
      {
        name: "Slider",
        blockId: "range",
        description: "Range slider input for numeric values",
        tags: ["range", "slider", "number input", "volume"],
      },
      /* Upload is not offered (L3-025, owner default 2026-10-09): the public
         form endpoint takes JSON only, so a published upload field cannot
         submit a file. The "file" block stays registered for existing pages. */
      {
        name: "Submit",
        blockId: "submit",
        description: "Submit button for sending form data",
        tags: ["submit", "send", "form submit", "post"],
      },
      {
        name: "Email",
        blockId: "email",
        description: "Email address input field with validation",
        tags: ["email", "mail", "input", "contact"],
      },
      {
        name: "Password",
        blockId: "password",
        description: "Password input field (masked)",
        tags: ["password", "secret", "login", "auth", "masked"],
      },
      {
        name: "Number",
        blockId: "number",
        description: "Numeric input with optional min/max",
        tags: ["number", "numeric", "input", "quantity"],
      },
      {
        name: "Date",
        blockId: "date",
        description: "Date picker input",
        tags: ["date", "calendar", "picker", "birthday"],
      },
      {
        name: "Time",
        blockId: "time",
        description: "Time picker input",
        tags: ["time", "clock", "picker", "hour"],
      },
      {
        name: "Color",
        blockId: "color",
        description: "Color picker input swatch",
        tags: ["color", "picker", "swatch", "hex"],
      },
      {
        name: "Form",
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
    elements: [
      {
        name: "Image",
        blockId: "image",
        description: "Responsive image with alt text support",
        tags: ["photo", "picture", "img", "figure", "illustration"],
      },
      {
        name: "Video",
        blockId: "video",
        description: "Video player with controls",
        tags: ["player", "youtube", "mp4", "media", "clip"],
      },
      {
        name: "Audio",
        blockId: "audio",
        description: "Audio player for music or podcasts",
        tags: ["sound", "music", "podcast", "mp3"],
      },
      {
        name: "Gallery",
        blockId: "gallery",
        description: "Masonry or grid photo gallery",
        tags: ["photos", "album", "portfolio", "lightbox", "images"],
      },
      {
        name: "SVG",
        blockId: "svg",
        description: "Inline SVG vector graphic element",
        tags: ["vector", "graphic", "scalable", "illustration"],
      },
      {
        name: "Lottie",
        blockId: "lottie",
        description: "Lottie JSON animation player",
        tags: ["animation", "json animation", "motion", "aftereffects"],
      },
      {
        name: "Embed",
        blockId: "video-embed",
        description: "Embed external content (YouTube, Spotify, Figma)",
        tags: ["youtube embed", "spotify", "figma", "iframe embed", "external"],
      },
      {
        name: "Map",
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
    elements: [
      {
        name: "Navbar",
        blockId: "navbar",
        description: "Top navigation bar with logo and links",
        tags: ["navigation", "menu", "header", "nav", "top bar"],
      },
      {
        name: "Footer",
        blockId: "footer",
        description: "Site footer with links and copyright",
        tags: ["bottom", "site footer", "copyright", "contact links"],
      },
      {
        name: "CTA",
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
    elements: [
      {
        // BRP1-M12: offered only while the site's Dark mode is Auto (useBuildTab).
        name: "Theme toggle",
        blockId: "theme-toggle",
        description: "Light / Dark switch",
        tags: ["theme", "dark mode", "light mode", "switch", "toggle", "color scheme", "night"],
      },
      {
        name: "Accordion",
        blockId: "accordion",
        description: "Collapsible accordion / FAQ section",
        tags: ["questions", "accordion", "help", "faq", "collapse", "expandable"],
      },
      {
        name: "Tabs",
        blockId: "tabs",
        description: "Tabbed content panel with switchable sections",
        tags: ["tabs", "tabbed", "panels", "content switcher"],
      },
      {
        name: "Modal",
        blockId: "modal",
        description: "Dialog/modal overlay trigger",
        tags: ["dialog", "popup", "overlay", "lightbox"],
      },
      {
        name: "Testimonials",
        blockId: "testimonials",
        description: "Customer testimonial cards or quote display",
        tags: ["testimonial", "review", "quote", "social proof", "customer"],
      },
      {
        name: "Pricing",
        blockId: "pricing",
        description: "Pricing plans comparison table",
        tags: ["pricing", "plans", "tiers", "cost", "comparison"],
      },
      {
        name: "Social Icons",
        blockId: "social-icons",
        description: "Row of social media platform icons",
        tags: ["social", "icons", "links", "twitter", "facebook", "linkedin"],
      },
      {
        name: "Carousel",
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
const flatCatalogByCatId: Record<string, FlatElEntry[]> = flatCatalog.reduce(
  (acc, el) => {
    (acc[el.catId] ??= []).push(el);
    return acc;
  },
  {} as Record<string, FlatElEntry[]>
);
