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
/**
 * `designTokens` arrives from a server payload, so it is whatever that payload
 * says — and a default parameter only fires on `undefined`. A `null` or an
 * object reached `.find` / `for…of` and threw, which is why the Brand panel's
 * load-error board had no producer: the throw happened here, on the preview
 * path, before `DesignSystemTab`'s own catch could render it (blocker A12).
 */
function tokenList<T>(tokens: ReadonlyArray<T> | null | undefined): ReadonlyArray<T> {
  return Array.isArray(tokens) ? tokens : [];
}

export function siteFontsFromTokens(
  tokens: ReadonlyArray<{ id?: string; value?: string }> | null = []
): { heading?: string; body?: string; mono?: string; text?: string } {
  const value = (id: string) => tokenList(tokens).find((t) => t.id === id)?.value;
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
 * The site's design tokens, as the custom properties a published page needs.
 *
 * The Brand panel writes every token into the project ("Apply Changes to go
 * live") and the canvas paints from them — but nothing emitted their
 * DEFINITIONS into an export. Measured on a site whose Text Primary token was
 * changed: the value reached project settings and the canvas custom property,
 * while the exported document contained no `--buildrick-design-*` declaration
 * at all. Any style bound to a token — every Brand preset and class binding —
 * therefore resolved to nothing once the page left the editor.
 *
 * A token value is user data, so it is stripped of the characters that could
 * leave its declaration: `;` and `}` end the declaration or the rule, `{`
 * opens a block, and `<` could close the surrounding `</style>`.
 */
export function siteTokensCSS(
  tokens: ReadonlyArray<{ cssVar?: string; value?: string }> = []
): string {
  const decls: string[] = [];
  const seen = new Set<string>();
  for (const t of tokens) {
    const name = (t.cssVar ?? "").trim();
    const value = (t.value ?? "").trim().replace(/[;{}<]/g, "");
    if (!name.startsWith("--") || !value || seen.has(name)) continue;
    seen.add(name);
    decls.push(`${name}:${value}`);
  }
  return decls.length ? `\n:root{${decls.join(";")}}\n` : "";
}

/**
 * The families the page uses: the FIRST family of every `font-family` stack
 * the CSS names, plus the site's own slots — lower-cased, unquoted. What both
 * font emitters below decide from. Only the first family, because the picker
 * writes `'Inter Var', sans-serif` and the fallback is not a use of a second
 * face.
 */
function usedFontFamilies(css: string, extraFamilies: readonly string[]): Set<string> {
  const used = new Set<string>();
  const first = (stack: string) => stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
  /* The preview document names families INLINE (`style="font-family: &quot;Inter
     Var&quot;, …"`) — the entity's own `;` ended the declaration at `&`, so a
     quoted family was never found. An entity-escaped quote is a quote here. */
  const text = css.replace(/&quot;|&#34;/g, '"').replace(/&#39;/g, "'");
  for (const decl of text.matchAll(/font-family\s*:\s*([^;}]+)/g)) {
    const family = first(decl[1]);
    if (family) used.add(family.toLowerCase());
  }
  for (const f of extraFamilies) {
    const family = first(String(f ?? ""));
    if (family) used.add(family.toLowerCase());
  }
  return used;
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
  extraFamilies: readonly string[] = [],
  /** Families the site's OWN fonts declare (`siteFontFaceCSS`) — never asked of
   *  Google: `@font-face` is last-wins, so a Google link for the same name would
   *  silently override the file the site uploaded (3721:43423: an uploaded
   *  source "does not replace the built-in family" — nor the other way). */
  siteProvided: readonly string[] = []
): string {
  const used = usedFontFamilies(css, extraFamilies);
  for (const family of siteProvided) used.delete(family.toLowerCase());

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

/** The `format()` hint by file extension — the four the Asset library accepts. */
const FONT_FORMAT_BY_EXT: Record<string, string> = {
  woff2: "woff2",
  woff: "woff",
  ttf: "truetype",
  otf: "opentype",
};

/** What a site font needs to be declared: its family and its files' urls. */
export interface SiteFontFaceSource {
  family: string;
  variants: ReadonlyArray<{ url?: string }>;
}

/**
 * The `@font-face` rules for the ADDED site fonts the page uses.
 *
 * The other half of the Google links above: a family the user uploaded has
 * no Google to fetch it from, so the export declares the face itself, from
 * the file's own url. Without this the picker half of BLOCKERS C4 stopped at
 * the canvas — a heading set in "Inter Var" rendered it in the editor and the
 * published page named a family the visitor's browser had never heard of.
 *
 * One rule per used family, from the first variant url that is on the
 * server. A font whose only url is a session `blob:` / `data:` never reached
 * the server — the page would name a url that dies with the tab — so it is
 * left out and returned in `skipped` for the caller to report. The family
 * and url are user data (a filename, a server path) and are stripped of the
 * characters that could leave the rule: `"` ends the string, `;` `{` `}` the
 * declaration or block, `<` the surrounding `</style>`, `)` the `url()`.
 */
export function siteFontFaceCSS(
  css: string,
  extraFamilies: readonly string[],
  fonts: ReadonlyArray<SiteFontFaceSource>
): { css: string; skipped: string[] } {
  const used = usedFontFamilies(css, extraFamilies);
  const rules: string[] = [];
  const skipped: string[] = [];
  const declared = new Set<string>();
  for (const font of fonts) {
    const key = font.family.toLowerCase();
    if (!used.has(key) || declared.has(key)) continue;
    declared.add(key);
    const url = font.variants
      .map((v) => (v.url ?? "").trim())
      .find((u) => u && !/^(blob|data):/i.test(u));
    if (!url) {
      skipped.push(font.family);
      continue;
    }
    const family = font.family.replace(/["\\;{}<\r\n]/g, "");
    const safeUrl = url.replace(/["'\\;{}<>()\s]/g, "");
    const ext = safeUrl.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    const format = ext ? FONT_FORMAT_BY_EXT[ext] : undefined;
    rules.push(
      `@font-face{font-family:"${family}";src:url("${safeUrl}")` +
        `${format ? ` format("${format}")` : ""};font-display:swap}`
    );
  }
  return { css: rules.join("\n"), skipped };
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

/* The type→tag map lived here as a second, smaller copy of the shared one — it
   had no email, no submit, no checkbox, so the export disagreed with the engine
   about what a form field even is, and it alone knew about list-item/article/
   aside/main. Both are merged into shared/utils/html's TYPE_TO_TAG_MAP, and the
   local `getTagForType` wrapper went with them: it added nothing, which the
   SSOT gate says out loud. Callers import getDefaultTagName directly. */

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Convert camelCase to kebab-case
 */
/**
 * Clone 3397:32376 `Auto-redirect by browser`: on a visitor's FIRST page of
 * the session, a default-locale page sends them to `/<their language>/…`
 * when the site has that locale — once per session, never off a prefixed
 * path, never for the default language itself. Inline and self-contained
 * so a published page needs nothing else; `null` when the setting is off or
 * the site has only its default locale.
 */
export function localeRedirectSnippet(
  localization: { defaultLocale: string; enabledLocales: string[]; autoRedirect: boolean } | undefined,
): string | null {
  if (!localization?.autoRedirect) return null;
  const others = localization.enabledLocales.filter((code) => code && code !== localization.defaultLocale);
  if (others.length === 0) return null;
  const langs = JSON.stringify(others.map((c) => c.toLowerCase()));
  return (
    `<script>(function(){try{if(sessionStorage.getItem("brk-locale-redirect"))return;` +
    `var langs=${langs};var want=(navigator.language||"").toLowerCase();` +
    `var pick=langs.indexOf(want)>=0?want:langs.indexOf(want.split("-")[0])>=0?want.split("-")[0]:null;` +
    `if(!pick)return;var p=location.pathname;` +
    `if(langs.some(function(l){return p===("/"+l)||p.indexOf("/"+l+"/")===0}))return;` +
    `sessionStorage.setItem("brk-locale-redirect","1");location.replace("/"+pick+(p==="/"?"/":p));}catch(e){}})();</script>`
  );
}

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

// ─── Linked containers ─────────────────────────────────────────────────────

/** Tags for which `href` is their own, valid attribute. */
const HREF_TAGS = new Set(["a", "area", "link", "base"]);
/** The link's attributes: on a linked container they belong to the <a>, not
 *  to the <section>/<div> that holds them in the element data. */
const BLOCK_LINK_ATTRS = new Set(["href", "target", "rel"]);
/** Interactive content, which the HTML content model forbids inside an <a>. */
const INTERACTIVE_TAGS = new Set([
  "a", "button", "input", "select", "textarea", "label", "form",
  "iframe", "embed", "object", "details", "audio", "video",
]);

/** How a writer reads one of its nodes — the live-Element writer and the
 *  publish writer walk different shapes. */
export interface LinkNodeView<T> {
  tag: string;
  href: unknown;
  children: readonly T[];
}

function hasInteractiveDescendant<T>(children: readonly T[], read: (node: T) => LinkNodeView<T>): boolean {
  return children.some((child) => {
    const view = read(child);
    const linked = typeof view.href === "string" && view.href !== "";
    return INTERACTIVE_TAGS.has(view.tag) || linked || hasInteractiveDescendant(view.children, read);
  });
}

/**
 * A container (section, div, card…) with a LINK set in the inspector.
 * `href` on a <section> does nothing, and that is what export used to write.
 *
 * Strategy, both writers:
 *  - The element keeps its own tag, classes and attributes; `href`, `target`
 *    and `rel` move onto an <a> that WRAPS it, styled
 *    `display:contents; color:inherit; text-decoration:inherit` so the
 *    wrapper generates no box — the section stays the flex/grid item it was,
 *    every block-level style still lands on it, and its text is not recoloured
 *    or underlined by the UA's link styles. Clicks anywhere inside reach the
 *    <a> through the DOM, which is what follows the link.
 *  - Nested links: an <a> may not contain interactive content (another link,
 *    a button, a form control…). If the container holds any — including a
 *    linked container further down — its OWN link is dropped and the inner
 *    ones win: the innermost link is the one a visitor can actually aim at, and
 *    `<a>` inside `<a>` is invalid HTML that browsers repair by splitting the
 *    outer link apart. The link attributes are dropped from the element either
 *    way, since on a non-link tag they are invalid.
 *
 * Returns `null` when the element is not a linked container (an <a> itself,
 * or no href) — the writer then emits it unchanged. Otherwise `wrap` is true
 * only when the wrapper is valid here.
 */
export function blockLinkPlan<T>(
  tag: string,
  attrs: Record<string, string>,
  children: readonly T[],
  read: (node: T) => LinkNodeView<T>,
): { wrap: boolean; isLinkAttr: (key: string) => boolean } | null {
  if (HREF_TAGS.has(tag) || typeof attrs.href !== "string" || attrs.href === "") return null;
  return {
    wrap: !hasInteractiveDescendant(children, read),
    isLinkAttr: (key) => BLOCK_LINK_ATTRS.has(key),
  };
}

/** Inline so the wrapper holds without a stylesheet (a single-file export
 *  with inline CSS has none). */
export const BLOCK_LINK_STYLE = "display:contents;color:inherit;text-decoration:inherit";
