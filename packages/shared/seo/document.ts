/**
 * The flat view of one page the SEO and readability checks read
 * (`SeoDocument`), and the walk that builds its blocks from a stored or live
 * element tree (`ContentElement` — the editor's `exportPages()` and the
 * server's `pages.blocks` both satisfy it, as for the content-issue
 * detectors). Pure: no DOM, no Composer.
 */
import type { ContentElement } from "../content/contentIssues";
import type { TitleSource } from "./titles";
import { plainText } from "./text";

export type SeoBlockKind = "heading" | "paragraph" | "image" | "link" | "button";

export interface SeoBlock {
  elementId: string;
  kind: SeoBlockKind;
  /** Heading level 1–6. */
  level?: number;
  text?: string;
  alt?: string;
  /** The image is marked decorative (`alt=""` or `data.decorative`). */
  decorative?: boolean;
  href?: string;
  /** A link to another page of this site. */
  internal?: boolean;
  /** The text comes from a CMS binding — placeholder copy in the editor. */
  cmsBound?: boolean;
  /** Raw HTML holding structure (images, headings, links) the checks cannot see as elements. */
  uncheckedHtml?: boolean;
}

export interface SeoDocument {
  /** The EMITTED title (`resolveEmittedTitle`). */
  title: string;
  titleSource: TitleSource;
  description: string;
  /** The file the export writes for the page (`about.html`). */
  slugFile: string;
  keyphrase?: string;
  /** BCP-47-ish language of the page (the site's language today). */
  locale: string;
  noIndex: boolean;
  blocks: SeoBlock[];
}

const TEXT_TYPES = new Set(["text", "paragraph", "label", "list-item", "list"]);
/* Headings inside raw markup cannot be placed in the outline; links and
   images inside it are read below. */
const HEADING_IN_HTML = /<h[1-6]\b/i;
const attr = (tag: string, name: string) => new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1];

function headingLevel(el: ContentElement): number {
  const m = /^h([1-6])$/i.exec(el.tagName ?? "");
  return m ? Number(m[1]) : 2;
}

function isInternalHref(href: string): boolean {
  const h = href.trim();
  if (h.startsWith("#page:")) return true;
  if (/^[a-z][a-z0-9+.-]*:/i.test(h) || h.startsWith("//") || h.startsWith("#")) return false;
  return h !== "";
}

/**
 * Blocks in document order. `boundIds` are the element ids a CMS binding
 * fills; `resolveText` lets the caller substitute `{{site.x}}` variables.
 */
export function seoBlocksFromContent(
  root: ContentElement | undefined,
  opts: { boundIds?: ReadonlySet<string>; resolveText?: (s: string) => string } = {},
): SeoBlock[] {
  const out: SeoBlock[] = [];
  const resolve = opts.resolveText ?? ((s: string) => s);
  const walk = (el: ContentElement) => {
    const tag = el.tagName?.toLowerCase() ?? "";
    const raw = el.content ?? "";
    const html = (el as { contentFormat?: string }).contentFormat === "html" || /<[a-z]/i.test(raw);
    const text = resolve(plainText(raw));
    const cmsBound = opts.boundIds?.has(el.id) || undefined;
    const base = { elementId: el.id, ...(cmsBound ? { cmsBound } : {}) };

    if (el.type === "image" || tag === "img") {
      const decorative = (el.data as { decorative?: boolean } | undefined)?.decorative === true || el.attributes?.alt === "";
      out.push({ ...base, kind: "image", alt: el.attributes?.alt, ...(decorative ? { decorative } : {}) });
    } else if (el.type === "heading" || /^h[1-6]$/.test(tag)) {
      out.push({ ...base, kind: "heading", level: headingLevel(el), text });
    } else if (el.type === "link" || tag === "a" || (el.type === "button" && el.attributes?.href)) {
      const href = el.attributes?.href ?? "";
      out.push({ ...base, kind: el.type === "button" ? "button" : "link", text, href, internal: isInternalHref(href) });
    } else if (el.type === "button") {
      out.push({ ...base, kind: "button", text });
    } else if (text && (TEXT_TYPES.has(el.type) || tag === "p" || !el.children?.length)) {
      out.push({ ...base, kind: "paragraph", text });
    }
    if (html) {
      for (const tagText of raw.match(/<a\b[^>]*>/gi) ?? []) {
        const href = attr(tagText, "href") ?? "";
        out.push({ elementId: el.id, kind: "link", href, internal: isInternalHref(href) });
      }
      for (const tagText of raw.match(/<img\b[^>]*>/gi) ?? []) {
        const alt = attr(tagText, "alt");
        out.push({ elementId: el.id, kind: "image", alt, ...(alt === "" ? { decorative: true } : {}) });
      }
      if (HEADING_IN_HTML.test(raw)) out.push({ elementId: el.id, kind: "paragraph", uncheckedHtml: true });
    }
    for (const child of el.children ?? []) walk(child);
  };
  if (root) walk(root);
  return out;
}
