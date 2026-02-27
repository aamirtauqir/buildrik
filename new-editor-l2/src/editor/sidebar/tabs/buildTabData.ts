/**
 * Build Tab v6 — element catalog, category definitions, pro tips
 * 7 categories, 52 elements, block ID mappings for canvas integration
 * @license BSD-3-Clause
 */

export interface CatDef {
  id: string;
  name: string;
  sub: string;
  iconHtml: string;
}

export interface ElDef {
  /** Display name */
  n: string;
  /** SVG inner HTML (rendered inside <svg viewBox="0 0 24 24">) */
  icon: string;
  /** Block registry ID for canvas insertion */
  blockId: string;
}

export const CATS: CatDef[] = [
  {
    id: "basic",
    name: "Basic",
    sub: "Heading, Paragraph, Button, Link",
    iconHtml:
      '<text x="3" y="17" font-size="15" stroke="none" fill="currentColor" font-family="serif" font-weight="700">H</text>',
  },
  {
    id: "layout",
    name: "Layout",
    sub: "Container, Grid, Flexbox, Section",
    iconHtml:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  },
  {
    id: "forms",
    name: "Forms & Inputs",
    sub: "Input, Select, Checkbox, Toggle",
    iconHtml:
      '<rect x="3" y="5" width="18" height="4" rx="1"/><rect x="3" y="11" width="18" height="4" rx="1"/><rect x="3" y="17" width="9" height="4" rx="1"/>',
  },
  {
    id: "media",
    name: "Media",
    sub: "Image, Video, Gallery, Lottie",
    iconHtml:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  },
  {
    id: "sections",
    name: "Sections",
    sub: "Hero, Navbar, Footer, CTA",
    iconHtml:
      '<rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="7" rx="1"/><rect x="3" y="20" width="18" height="1" rx="0.5"/>',
  },
  {
    id: "ecom",
    name: "E-Commerce",
    sub: "Product, Cart, Checkout, Reviews",
    iconHtml:
      '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>',
  },
  {
    id: "advanced",
    name: "Advanced",
    sub: "Custom Code, Embed, iFrame",
    iconHtml: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  },
];

export const BLD_ELEMENTS: Record<string, ElDef[]> = {
  basic: [
    {
      n: "Heading",
      icon: '<text x="3" y="17" font-size="15" stroke="none" fill="currentColor" font-family="serif" font-weight="700">H</text>',
      blockId: "heading",
    },
    {
      n: "Paragraph",
      icon: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="14" y2="18"/>',
      blockId: "paragraph",
    },
    {
      n: "Button",
      icon: '<rect x="3" y="8" width="18" height="8" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/>',
      blockId: "button",
    },
    {
      n: "Link",
      icon: '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>',
      blockId: "link",
    },
    { n: "Divider", icon: '<line x1="3" y1="12" x2="21" y2="12"/>', blockId: "divider" },
    {
      n: "Badge",
      icon: '<circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      blockId: "text",
    },
    {
      n: "Spacer",
      icon: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="5" x2="19" y2="5"/><line x1="5" y1="19" x2="19" y2="19"/>',
      blockId: "spacer",
    },
    {
      n: "Label",
      icon: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
      blockId: "text",
    },
    {
      n: "Quote",
      icon: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>',
      blockId: "text",
    },
  ],
  layout: [
    {
      n: "Container",
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
      blockId: "container",
    },
    {
      n: "Section",
      icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>',
      blockId: "section",
    },
    {
      n: "Grid",
      icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      blockId: "grid",
    },
    {
      n: "Flexbox",
      icon: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>',
      blockId: "flex",
    },
    {
      n: "Columns",
      icon: '<rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>',
      blockId: "columns",
    },
    {
      n: "Stack",
      icon: '<rect x="3" y="3" width="18" height="5" rx="1"/><rect x="3" y="10" width="18" height="5" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/>',
      blockId: "stack",
    },
    { n: "Div", icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>', blockId: "container" },
    {
      n: "Wrapper",
      icon: '<rect x="2" y="2" width="20" height="20" rx="3"/><rect x="6" y="6" width="12" height="12" rx="1"/>',
      blockId: "container",
    },
  ],
  forms: [
    {
      n: "Input",
      icon: '<rect x="3" y="8" width="18" height="8" rx="1"/><line x1="6" y1="12" x2="10" y2="12"/>',
      blockId: "input",
    },
    {
      n: "Textarea",
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/>',
      blockId: "textarea",
    },
    {
      n: "Select",
      icon: '<rect x="3" y="7" width="18" height="10" rx="1"/><polyline points="15 11 18 11"/>',
      blockId: "select",
    },
    {
      n: "Checkbox",
      icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><polyline points="9 12 11 14 15 10"/>',
      blockId: "checkbox",
    },
    {
      n: "Radio",
      icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
      blockId: "radio",
    },
    {
      n: "Toggle",
      icon: '<rect x="2" y="8" width="20" height="8" rx="4"/><circle cx="16" cy="12" r="3"/>',
      blockId: "switch",
    },
    {
      n: "Slider",
      icon: '<line x1="3" y1="12" x2="21" y2="12"/><circle cx="15" cy="12" r="3"/>',
      blockId: "range",
    },
    {
      n: "Upload",
      icon: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
      blockId: "file",
    },
    {
      n: "Form",
      icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/>',
      blockId: "form",
    },
  ],
  media: [
    {
      n: "Image",
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
      blockId: "image",
    },
    {
      n: "Video",
      icon: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
      blockId: "video",
    },
    {
      n: "Audio",
      icon: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/>',
      blockId: "audio",
    },
    {
      n: "Gallery",
      icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="10" width="7" height="5" rx="1"/><rect x="3" y="12" width="7" height="9" rx="1"/>',
      blockId: "gallery",
    },
    {
      n: "Carousel",
      icon: '<rect x="5" y="5" width="14" height="14" rx="2"/><polyline points="3 12 5 12"/><polyline points="19 12 21 12"/>',
      blockId: "slider",
    },
    {
      n: "SVG",
      icon: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
      blockId: "svg",
    },
    {
      n: "Lottie",
      icon: '<circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/>',
      blockId: "lottie",
    },
  ],
  sections: [
    {
      n: "Hero",
      icon: '<rect x="3" y="3" width="18" height="9" rx="1"/><line x1="7" y1="7" x2="14" y2="7"/><line x1="7" y1="9.5" x2="11" y2="9.5"/>',
      blockId: "hero",
    },
    {
      n: "Navbar",
      icon: '<rect x="3" y="5" width="18" height="4" rx="1"/><circle cx="6" cy="7" r="1"/><line x1="10" y1="7" x2="16" y2="7"/>',
      blockId: "navbar",
    },
    {
      n: "Footer",
      icon: '<rect x="3" y="15" width="18" height="6" rx="1"/><line x1="7" y1="18" x2="17" y2="18"/>',
      blockId: "footer",
    },
    {
      n: "Features",
      icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      blockId: "features",
    },
    {
      n: "Pricing",
      icon: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/>',
      blockId: "pricing",
    },
    {
      n: "CTA",
      icon: '<rect x="3" y="8" width="18" height="8" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/>',
      blockId: "cta",
    },
    {
      n: "Testimonial",
      icon: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
      blockId: "testimonials",
    },
    {
      n: "FAQ",
      icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      blockId: "accordion",
    },
  ],
  ecom: [
    {
      n: "Product",
      icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/>',
      blockId: "product-card",
    },
    {
      n: "Cart",
      icon: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>',
      blockId: "cart-button",
    },
    {
      n: "Checkout",
      icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
      blockId: "product-detail",
    },
    {
      n: "Price Tag",
      icon: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
      blockId: "pricing",
    },
    {
      n: "Reviews",
      icon: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
      blockId: "testimonials",
    },
    {
      n: "Wishlist",
      icon: '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
      blockId: "social-icons",
    },
  ],
  advanced: [
    {
      n: "Custom Code",
      icon: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      blockId: "text",
    },
    {
      n: "Embed",
      icon: '<rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="8" x2="22" y2="8"/>',
      blockId: "video-embed",
    },
    {
      n: "iFrame",
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/>',
      blockId: "video-embed",
    },
    {
      n: "Map",
      icon: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>',
      blockId: "map-embed",
    },
    {
      n: "Analytics",
      icon: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
      blockId: "text",
    },
  ],
};

export const TIPS: string[] = [
  "<strong>Drag to canvas</strong> — element card grab karo (cursor change hoga) aur canvas pe drop karo. Yahi primary interaction hai.",
  "<strong>⭐ My Favorites</strong> — element hover karo → star click karo → My Favorites zone mein save hota hai. Wahan se seedha drag bhi kar sakte ho.",
  "<strong>⌘F shortcut</strong> — search bar focus karta hai instantly. Type karo, sab elements search ho jaate hain. Clear karne ke liye Esc ya ✕.",
  '<strong>My Components</strong> — canvas pe element select → Properties → "Save as Component" → reusable chip ban jaata hai panel mein.',
  "<strong>Categories browse karo</strong> — Basic se start karo, Advanced tak explore karo. Har category click se in-place expand hoti hai.",
];

/** Flat list of all elements for search */
export function getAllElements(): Array<ElDef & { catId: string; catName: string }> {
  return CATS.flatMap((cat) =>
    (BLD_ELEMENTS[cat.id] ?? []).map((el) => ({ ...el, catId: cat.id, catName: cat.name }))
  );
}
