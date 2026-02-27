/**
 * Default Styles for Elements
 *
 * Provides default styling values for all element types.
 * These are applied when elements are created AND used as
 * fallback in the Inspector when element.styles is empty.
 *
 * @module constants/defaultStyles
 */

// Theme constants - use actual values (not CSS vars) so they display properly in Inspector
const THEME = {
  primary: "#8B5CF6",
  textPrimary: "#1a1a1a",
  textSecondary: "#333333",
  fontFamily: "Inter, sans-serif",
};

/**
 * Default styles per element type
 * Keys are element types (heading, paragraph, button, etc.)
 * or specific tag names (h1, h2, h3, etc.)
 */
export const DEFAULT_ELEMENT_STYLES: Record<string, Record<string, string>> = {
  // ═══════════════════════════════════════════════════════════
  // HEADINGS (H1-H6 with proper typography scale)
  // ═══════════════════════════════════════════════════════════

  h1: {
    "font-family": THEME.fontFamily,
    "font-size": "48px",
    "font-weight": "700",
    "line-height": "1.1",
    color: THEME.textPrimary,
    "margin-bottom": "24px",
  },

  h2: {
    "font-family": THEME.fontFamily,
    "font-size": "36px",
    "font-weight": "700",
    "line-height": "1.2",
    color: THEME.textPrimary,
    "margin-bottom": "20px",
  },

  h3: {
    "font-family": THEME.fontFamily,
    "font-size": "28px",
    "font-weight": "600",
    "line-height": "1.25",
    color: THEME.textPrimary,
    "margin-bottom": "16px",
  },

  h4: {
    "font-family": THEME.fontFamily,
    "font-size": "24px",
    "font-weight": "600",
    "line-height": "1.3",
    color: THEME.textPrimary,
    "margin-bottom": "14px",
  },

  h5: {
    "font-family": THEME.fontFamily,
    "font-size": "20px",
    "font-weight": "500",
    "line-height": "1.4",
    color: THEME.textPrimary,
    "margin-bottom": "12px",
  },

  h6: {
    "font-family": THEME.fontFamily,
    "font-size": "18px",
    "font-weight": "500",
    "line-height": "1.4",
    color: THEME.textPrimary,
    "margin-bottom": "10px",
  },

  // Default heading (when level not specified)
  heading: {
    "font-family": THEME.fontFamily,
    "font-size": "32px",
    "font-weight": "700",
    "line-height": "1.2",
    color: THEME.textPrimary,
    "margin-bottom": "16px",
  },

  // ═══════════════════════════════════════════════════════════
  // TEXT ELEMENTS
  // ═══════════════════════════════════════════════════════════

  paragraph: {
    "font-family": THEME.fontFamily,
    "font-size": "16px",
    "font-weight": "400",
    "line-height": "1.6",
    color: THEME.textSecondary,
    "margin-bottom": "12px",
  },

  text: {
    "font-family": THEME.fontFamily,
    "font-size": "16px",
    "font-weight": "400",
    "line-height": "1.5",
    color: THEME.textSecondary,
  },

  span: {
    "font-family": "inherit",
    "font-size": "inherit",
    "font-weight": "inherit",
    color: "inherit",
  },

  label: {
    "font-family": THEME.fontFamily,
    "font-size": "14px",
    "font-weight": "500",
    color: THEME.textSecondary,
    "margin-bottom": "4px",
  },

  blockquote: {
    "font-family": THEME.fontFamily,
    "font-size": "18px",
    "font-style": "italic",
    "line-height": "1.6",
    color: THEME.textSecondary,
    "padding-left": "20px",
    "border-left": `4px solid ${THEME.primary}`,
    margin: "16px 0",
  },

  code: {
    "font-family": "monospace",
    "font-size": "14px",
    "background-color": "#f3f4f6",
    padding: "2px 6px",
    "border-radius": "4px",
    color: THEME.textPrimary,
  },

  // ═══════════════════════════════════════════════════════════
  // CONTAINER ELEMENTS
  // ═══════════════════════════════════════════════════════════

  container: {
    display: "block",
    padding: "20px",
    "background-color": "transparent",
  },

  div: {
    display: "block",
  },

  section: {
    display: "block",
    padding: "60px 20px",
    "background-color": "transparent",
  },

  flex: {
    display: "flex",
    gap: "16px",
    "align-items": "stretch",
  },

  grid: {
    display: "grid",
    gap: "16px",
    "grid-template-columns": "repeat(3, 1fr)",
  },

  row: {
    display: "flex",
    "flex-direction": "row",
    gap: "16px",
  },

  column: {
    display: "flex",
    "flex-direction": "column",
    gap: "12px",
  },

  spacer: {
    display: "block",
    height: "40px",
  },

  // ═══════════════════════════════════════════════════════════
  // INTERACTIVE ELEMENTS
  // ═══════════════════════════════════════════════════════════

  button: {
    "font-family": THEME.fontFamily,
    "font-size": "var(--aqb-btn-font-size)",
    "font-weight": "var(--aqb-btn-font-weight)",
    height: "var(--aqb-btn-height-md)",
    "padding-left": "var(--aqb-btn-padding-x)",
    "padding-right": "var(--aqb-btn-padding-x)",
    "background-color": THEME.primary,
    color: "#ffffff",
    "border-radius": "var(--aqb-btn-radius)",
    border: "none",
    cursor: "pointer",
    "text-align": "center",
  },

  link: {
    "font-family": "inherit",
    "font-size": "inherit",
    color: THEME.primary,
    "text-decoration": "underline",
    cursor: "pointer",
  },

  nav: {
    display: "flex",
    gap: "24px",
    "align-items": "center",
  },

  accordion: {
    display: "block",
    "border-radius": "8px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },

  tabs: {
    display: "flex",
    "flex-direction": "column",
    gap: "0",
  },

  dropdown: {
    position: "relative",
    display: "inline-block",
  },

  // ═══════════════════════════════════════════════════════════
  // MEDIA ELEMENTS
  // ═══════════════════════════════════════════════════════════

  image: {
    display: "block",
    "max-width": "100%",
    height: "auto",
    "border-radius": "0px",
  },

  video: {
    display: "block",
    "max-width": "100%",
    height: "auto",
    "border-radius": "0px",
  },

  audio: {
    display: "block",
    width: "100%",
  },

  icon: {
    display: "inline-block",
    width: "24px",
    height: "24px",
    color: "currentColor",
  },

  embed: {
    display: "block",
    width: "100%",
    "aspect-ratio": "16/9",
  },

  iframe: {
    display: "block",
    width: "100%",
    height: "400px",
    border: "none",
  },

  // ═══════════════════════════════════════════════════════════
  // FORM ELEMENTS
  // ═══════════════════════════════════════════════════════════

  form: {
    display: "flex",
    "flex-direction": "column",
    gap: "16px",
  },

  input: {
    "font-family": THEME.fontFamily,
    "font-size": "var(--aqb-label-font-size)",
    height: "var(--aqb-input-height)",
    "padding-left": "var(--aqb-input-padding-x)",
    "padding-right": "var(--aqb-input-padding-x)",
    border: "1px solid var(--aqb-input-border)",
    "border-radius": "var(--aqb-input-radius)",
    "background-color": "#ffffff",
    color: THEME.textPrimary,
  },

  textarea: {
    "font-family": THEME.fontFamily,
    "font-size": "var(--aqb-label-font-size)",
    "padding-left": "var(--aqb-input-padding-x)",
    "padding-right": "var(--aqb-input-padding-x)",
    "padding-top": "10px",
    "padding-bottom": "10px",
    border: "1px solid var(--aqb-input-border)",
    "border-radius": "var(--aqb-input-radius)",
    "background-color": "#ffffff",
    color: THEME.textPrimary,
    "min-height": "100px",
    resize: "vertical",
  },

  select: {
    "font-family": THEME.fontFamily,
    "font-size": "var(--aqb-label-font-size)",
    height: "var(--aqb-input-height)",
    "padding-left": "var(--aqb-input-padding-x)",
    "padding-right": "var(--aqb-input-padding-x)",
    border: "1px solid var(--aqb-input-border)",
    "border-radius": "var(--aqb-input-radius)",
    "background-color": "#ffffff",
    color: THEME.textPrimary,
  },

  checkbox: {
    width: "18px",
    height: "18px",
    "accent-color": THEME.primary,
  },

  radio: {
    width: "18px",
    height: "18px",
    "accent-color": THEME.primary,
  },

  "file-upload": {
    padding: "20px",
    border: "2px dashed #d1d5db",
    "border-radius": "8px",
    "text-align": "center",
    cursor: "pointer",
  },

  // ═══════════════════════════════════════════════════════════
  // LIST ELEMENTS
  // ═══════════════════════════════════════════════════════════

  list: {
    "font-family": THEME.fontFamily,
    "font-size": "16px",
    "line-height": "1.6",
    color: THEME.textSecondary,
    "padding-left": "24px",
    "margin-bottom": "12px",
  },

  "list-item": {
    "margin-bottom": "8px",
  },

  // ═══════════════════════════════════════════════════════════
  // CARD & COMPONENT ELEMENTS
  // ═══════════════════════════════════════════════════════════

  card: {
    display: "block",
    padding: "24px",
    "background-color": "#ffffff",
    "border-radius": "12px",
    "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
  },

  badge: {
    display: "inline-block",
    padding: "4px 8px",
    "font-size": "12px",
    "font-weight": "500",
    "border-radius": "9999px",
    "background-color": THEME.primary,
    color: "#ffffff",
  },

  avatar: {
    display: "block",
    width: "48px",
    height: "48px",
    "border-radius": "50%",
    "object-fit": "cover",
  },

  // ═══════════════════════════════════════════════════════════
  // DIVIDER & SPACER
  // ═══════════════════════════════════════════════════════════

  divider: {
    display: "block",
    height: "1px",
    "background-color": "#e5e7eb",
    margin: "24px 0",
  },

  hr: {
    display: "block",
    height: "1px",
    "background-color": "#e5e7eb",
    margin: "24px 0",
    border: "none",
  },

  // ═══════════════════════════════════════════════════════════
  // SOCIAL & SPECIAL
  // ═══════════════════════════════════════════════════════════

  social: {
    display: "flex",
    gap: "12px",
    "align-items": "center",
  },

  map: {
    display: "block",
    width: "100%",
    height: "300px",
    "border-radius": "8px",
  },

  countdown: {
    display: "flex",
    gap: "16px",
    "font-family": THEME.fontFamily,
    "font-size": "24px",
    "font-weight": "700",
  },

  progress: {
    display: "block",
    width: "100%",
    height: "8px",
    "border-radius": "4px",
    "background-color": "#e5e7eb",
  },

  slider: {
    display: "block",
    width: "100%",
  },

  rating: {
    display: "flex",
    gap: "4px",
  },

  testimonial: {
    display: "block",
    padding: "24px",
    "background-color": "#f9fafb",
    "border-radius": "12px",
  },

  pricing: {
    display: "block",
    padding: "32px",
    "background-color": "#ffffff",
    "border-radius": "16px",
    "text-align": "center",
    border: "1px solid #e5e7eb",
  },
};

/**
 * Get default styles for an element
 *
 * @param type - The element type (e.g., 'heading', 'button')
 * @param tagName - Optional HTML tag name (e.g., 'h1', 'h2')
 * @returns Default styles object or empty object
 */
export function getDefaultStyles(type: string, tagName?: string): Record<string, string> {
  // First check for specific tag (h1, h2, etc.)
  if (tagName && DEFAULT_ELEMENT_STYLES[tagName.toLowerCase()]) {
    return { ...DEFAULT_ELEMENT_STYLES[tagName.toLowerCase()] };
  }
  // Then fall back to element type
  const typeStyles = DEFAULT_ELEMENT_STYLES[type];
  return typeStyles ? { ...typeStyles } : {};
}

/**
 * Check if an element type has default styles defined
 */
export function hasDefaultStyles(type: string, tagName?: string): boolean {
  if (tagName && DEFAULT_ELEMENT_STYLES[tagName.toLowerCase()]) {
    return true;
  }
  return !!DEFAULT_ELEMENT_STYLES[type];
}
