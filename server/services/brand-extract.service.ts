import { fetchPublicText } from "@/lib/url-guard";

/**
 * Brand from a website URL (spec §9, D13). Deterministic: fetch the page and
 * up to four of its stylesheets through the SSRF-guarded fetch, then count the
 * colour literals and font families their CSS names. Returns RAW strings —
 * the editor parses colours with the picker's own parser and picks roles
 * (engine/designSystem/brandColors.ts), so nothing here duplicates colour math.
 * No AI (OQ-9); nothing from the fetched page is logged.
 */

export class BrandExtractError extends Error {
  constructor(public code: "BLOCKED" | "TIMEOUT", message: string) {
    super(message);
    this.name = "BrandExtractError";
  }
}

type Generic = "serif" | "sans-serif" | "monospace";
export interface ExtractedBrand {
  colors: Array<{ value: string; count: number }>;
  fonts: Array<{ family: string; generic?: Generic; heading: number; body: number; count: number }>;
}

const PAGE_BYTES = 2_000_000;
const CSS_BYTES = 1_000_000;
const MAX_STYLESHEETS = 4;
const BUDGET_MS = 10_000;

const STYLE_BLOCK_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTR_RE = /\sstyle\s*=\s*"([^"]*)"/gi;
const LINK_RE = /<link\b[^>]*>/gi;
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|hsl)a?\([^()]{1,60}\)/g;
const RULE_RE = /([^{}]+)\{([^{}]*)\}/g;
const FONT_DECL_RE = /font-family\s*:\s*([^;}]+)/gi;
const GENERICS: Record<string, Generic | undefined> = { serif: "serif", "sans-serif": "sans-serif", monospace: "monospace" };
const IGNORED = new Set(["inherit", "initial", "unset", "system-ui", "cursive", "fantasy", "emoji", "math", "fangsong", "ui-sans-serif", "ui-serif", "ui-monospace", "-apple-system"]);

const attr = (tag: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1];

/** A plain family name or null (spec D17: font names are sanitized). */
function cleanFamily(raw: string): string | null {
  const name = raw.trim().replace(/^['"]|['"]$/g, "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9 _-]{0,63}$/.test(name)) return null;
  const lower = name.toLowerCase();
  return GENERICS[lower] || IGNORED.has(lower) ? null : name;
}

export function readBrandFromHtml(html: string): { css: string[]; stylesheets: string[]; googleFamilies: string[] } {
  const css = [...html.matchAll(STYLE_BLOCK_RE)].map((m) => m[1]);
  for (const m of html.matchAll(STYLE_ATTR_RE)) css.push(m[1]);
  const stylesheets: string[] = [];
  const googleFamilies: string[] = [];
  for (const [tag] of html.matchAll(LINK_RE)) {
    if (!/\brel\s*=\s*["'][^"']*stylesheet/i.test(tag)) continue;
    const href = attr(tag, "href");
    if (!href) continue;
    stylesheets.push(href);
    if (/fonts\.googleapis\.com\/css/i.test(href)) {
      for (const fam of new URL(href, "https://x.invalid").searchParams.getAll("family")) {
        const clean = cleanFamily(fam.split(":")[0].replace(/\+/g, " "));
        if (clean) googleFamilies.push(clean);
      }
    }
  }
  return { css, stylesheets, googleFamilies };
}

export function tallyBrandCss(css: readonly string[], googleFamilies: readonly string[]): ExtractedBrand {
  const colors = new Map<string, number>();
  const fonts = new Map<string, { family: string; generic?: Generic; heading: number; body: number; count: number }>();
  const addFont = (family: string, generic: Generic | undefined, selector: string) => {
    const f = fonts.get(family) ?? { family, generic, heading: 0, body: 0, count: 0 };
    f.count += 1;
    if (/(^|[\s,>+~])h[1-3]\b/i.test(selector)) f.heading += 1;
    if (/(^|[\s,])(body|html)\b/i.test(selector)) f.body += 1;
    if (!f.generic && generic) f.generic = generic;
    fonts.set(family, f);
  };
  for (const text of css) {
    for (const m of text.matchAll(COLOR_RE)) {
      const v = m[0].toLowerCase().replace(/\s+/g, "");
      colors.set(v, (colors.get(v) ?? 0) + 1);
    }
    const rules = text.includes("{") ? [...text.matchAll(RULE_RE)].map((r) => [r[1], r[2]]) : [["", text]];
    for (const [selector, body] of rules) {
      for (const d of body.matchAll(FONT_DECL_RE)) {
        const parts = d[1].split(",");
        const generic = parts.map((p) => GENERICS[p.trim().toLowerCase()]).find(Boolean);
        const first = cleanFamily(parts[0]);
        if (first) addFont(first, generic, selector.trim());
      }
    }
  }
  for (const fam of googleFamilies) if (!fonts.has(fam)) fonts.set(fam, { family: fam, heading: 0, body: 0, count: 1 });
  return {
    colors: [...colors.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || (a.value < b.value ? -1 : 1)).slice(0, 40),
    fonts: [...fonts.values()].sort((a, b) => b.count - a.count || (a.family < b.family ? -1 : 1)).slice(0, 6),
  };
}

function toExtractError(e: unknown): BrandExtractError {
  const code = e instanceof Error ? e.message : "";
  return code === "TIMEOUT" || code === "TOO_LARGE"
    ? new BrandExtractError("TIMEOUT", "That site took too long to answer")
    : new BrandExtractError("BLOCKED", "This address can't be used");
}

export async function extractBrandFromUrl(url: string): Promise<ExtractedBrand> {
  const deadline = Date.now() + BUDGET_MS;
  let page: { url: URL; text: string };
  try {
    page = await fetchPublicText(url, { maxBytes: PAGE_BYTES, deadline, accept: /^(text\/html|application\/xhtml\+xml)/i });
  } catch (e) {
    throw toExtractError(e);
  }
  const { css, stylesheets, googleFamilies } = readBrandFromHtml(page.text);
  for (const href of stylesheets.filter((h) => !/fonts\.googleapis\.com/i.test(h)).slice(0, MAX_STYLESHEETS)) {
    try {
      css.push((await fetchPublicText(new URL(href, page.url).toString(), { maxBytes: CSS_BYTES, deadline, accept: /^text\/css/i })).text);
    } catch (e) {
      if (e instanceof Error && e.message === "TIMEOUT") break; // the shared budget is spent
      /* a refused or failing stylesheet is skipped; the page's own CSS still counts */
    }
  }
  return tallyBrandCss(css, googleFamilies);
}
