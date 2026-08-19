/**
 * Export Engine Helpers
 * HTML/CSS generation utilities
 * @license BSD-3-Clause
 */

import { THEME } from "../../shared/constants/defaultStyles";

// ============================================================================
// RESET CSS
// ============================================================================

/**
 * The site's own font rules, from its three font tokens.
 *
 * RESET_CSS names one hardcoded family for every site ever exported. The Brand
 * panel offers a display / body / mono slot per site and the export ignored all
 * three, so a site whose heading font was changed published in the default one —
 * silently, the same way animation keyframes used to be dropped from exports.
 *
 * The body text colour rides along for the same reason: the canvas painted it
 * from a token and the export named none, so unstyled text was slate in the
 * editor and browser-default black on the published page.
 *
 * Only emitted for slots the site actually carries; a missing token leaves the
 * reset's family in place rather than naming an empty family.
 */
export function siteFontCSS(fonts: {
  heading?: string;
  body?: string;
  mono?: string;
  text?: string;
}): string {
  const family = (v?: string) => (v ?? "").trim().replace(/;/g, "");
  const rules: string[] = [];
  const body: string[] = [];
  if (family(fonts.body)) body.push(`font-family:${family(fonts.body)},sans-serif`);
  if (family(fonts.text)) body.push(`color:${family(fonts.text)}`);
  if (body.length) rules.push(`body{${body.join(";")}}`);
  if (family(fonts.heading))
    rules.push(`h1,h2,h3,h4,h5,h6{font-family:${family(fonts.heading)},sans-serif}`);
  if (family(fonts.mono)) rules.push(`code,pre,kbd,samp{font-family:${family(fonts.mono)},monospace}`);
  return rules.length ? `\n${rules.join("\n")}\n` : "";
}

export const RESET_CSS = `
*,*::before,*::after{box-sizing:border-box}
*{margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{line-height:1.5;-webkit-font-smoothing:antialiased;font-family:${THEME.fontFamily}}
img,picture,video,canvas,svg{display:block;max-width:100%}
input,button,textarea,select{font:inherit}
p,h1,h2,h3,h4,h5,h6{overflow-wrap:break-word}
`;

// ============================================================================
// TAG MAPPING
// ============================================================================

const TAG_MAP: Record<string, string> = {
  div: "div",
  section: "section",
  header: "header",
  footer: "footer",
  nav: "nav",
  article: "article",
  aside: "aside",
  main: "main",
  heading: "h2",
  paragraph: "p",
  text: "span",
  link: "a",
  button: "button",
  image: "img",
  video: "video",
  input: "input",
  form: "form",
  list: "ul",
  "list-item": "li",
};

/**
 * Map element type to HTML tag
 */
export function getTagForType(type: string): string {
  return TAG_MAP[type] || "div";
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================================
// STYLE UTILITIES
// ============================================================================

/**
 * Convert styles object to inline style string
 */
export function stylesToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, value]) => `${camelToKebab(key)}:${value}`)
    .join(";");
}

/**
 * Convert styles object to CSS block
 */
export function stylesToCSS(styles: Record<string, string>, minify: boolean): string {
  const indent = minify ? "" : "  ";
  const nl = minify ? "" : "\n";

  return Object.entries(styles)
    .map(([key, value]) => `${indent}${camelToKebab(key)}: ${value};${nl}`)
    .join("");
}

/**
 * Minify CSS
 */
export function minifyCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .trim();
}

// ============================================================================
// DOWNLOAD UTILITIES
// ============================================================================

/**
 * Download content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download HTML content
 */
export function downloadHTML(html: string, filename = "export.html"): void {
  downloadFile(html, filename, "text/html");
}

/**
 * Download CSS content
 */
export function downloadCSS(css: string, filename = "styles.css"): void {
  downloadFile(css, filename, "text/css");
}
