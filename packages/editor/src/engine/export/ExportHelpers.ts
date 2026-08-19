/**
 * Export Engine Helpers
 * HTML/CSS generation utilities
 * @license BSD-3-Clause
 */

import { THEME } from "../../shared/constants/defaultStyles";
import { GOOGLE_FONT_CATALOGUE } from "../../shared/constants/googleFonts";

// ============================================================================
// RESET CSS
// ============================================================================

/**
 * The site's three font slots and its text colour, read off its design tokens.
 *
 * Three places need this — the export's CSS, the export's font links, and the
 * in-shell preview, which builds its own document. The preview is why this is
 * shared rather than inlined: it had its own head assembly with neither, so a
 * site set in Lora previewed in whatever serif the viewer's machine had while
 * the published page fetched the real face.
 */
export function siteFontsFromTokens(
  tokens: ReadonlyArray<{ id?: string; value?: string }> = []
): { heading?: string; body?: string; mono?: string; text?: string } {
  const value = (id: string) => tokens.find((t) => t.id === id)?.value;
  return {
    heading: value("font-heading"),
    body: value("font-body"),
    mono: value("font-mono"),
    text: value("color-text"),
  };
}

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

/**
 * The stylesheet link the published page needs for the Google families it uses.
 *
 * The font picker loads a family into the EDITOR (`GoogleFontsService` injects
 * a <link>) and the export named the family and loaded nothing, so a site set
 * in Poppins shipped in the visitor's generic sans. Verified on a generated
 * document: `font-family: 'Poppins', sans-serif` in the CSS, no font request
 * anywhere in the head.
 *
 * Only families in the catalogue the picker offers are named here — a local or
 * uploaded family must not be sent to Google as a lookup, and a family Google
 * does not have would 400 the request.
 */
export function googleFontsHeadLinks(
  css: string,
  extraFamilies: readonly string[] = []
): string {
  const used = new Set<string>();
  for (const decl of css.matchAll(/font-family\s*:\s*([^;}]+)/g)) {
    const first = decl[1].split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (first) used.add(first.toLowerCase());
  }
  for (const f of extraFamilies) {
    const first = String(f ?? "").split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (first) used.add(first.toLowerCase());
  }

  const wanted = GOOGLE_FONT_CATALOGUE.filter((f) => used.has(f.family.toLowerCase()));
  if (!wanted.length) return "";

  const families = wanted
    .map((f) => {
      const weights = [...new Set(f.variants.filter((v) => /^\d+$/.test(v)))].sort();
      const name = f.family.replace(/ /g, "+");
      return weights.length ? `family=${name}:wght@${weights.join(";")}` : `family=${name}`;
    })
    .join("&");

  return (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families}&display=swap">`
  );
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
