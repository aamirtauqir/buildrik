/**
 * SEO Injector
 * Generates meta tags for SEO and social sharing
 *
 * @module engine/export/SEOInjector
 * @license BSD-3-Clause
 */

import type { PageSEO, SiteSEO, PageData } from "../../shared/types";
import { slugify } from "../../shared/utils/helpers/string";
import { sanitizeHeadCode } from "./sanitizeHeadCode";

// ============================================================================
// TYPES
// ============================================================================

export interface SEOInjectorOptions {
  /** Base URL for the site (e.g., "https://example.com") */
  baseUrl?: string;
}

// ============================================================================
// SEO INJECTOR
// ============================================================================

/**
 * The title a page ships with, in the order the exporter has always resolved
 * it. Exported because the single-file export path had no access to it: the
 * download modal seeded `pageTitle` from a constant, so every customer's
 * exported HTML was titled "Buildrick Export" until they noticed the field and
 * typed over it. One precedence, both paths.
 */
export function resolvePageTitle(
  page: PageData,
  pageSEO?: PageSEO,
  pageSettings?: { title?: string },
  siteSEO?: SiteSEO
): string {
  const own = pageSEO?.metaTitle || pageSettings?.title || page.name || "Untitled";
  return applyTitleTemplate(own, siteSEO);
}

/**
 * Wrap a page's own title in the site's title template.
 *
 * The template is stored (`sites.metaTitleTemplate`), shown on the dashboard's
 * SEO tab, and graded by the pre-publish "SEO configured" check — and until
 * now it was applied by nothing, so a site that set "Acme — {page_title}"
 * published pages titled just "Home". A template with no `{page_title}` in it
 * would replace every page title with the same string, which is never what the
 * field is for, so it is ignored.
 */
function applyTitleTemplate(title: string, siteSEO?: SiteSEO): string {
  const template = siteSEO?.metaTitleTemplate?.trim();
  if (!template || !template.includes("{page_title}")) return title;
  return template
    .replace(/\{page_title\}/g, title)
    .replace(/\{site_name\}/g, siteSEO?.siteName ?? "")
    .trim();
}

/**
 * The robots directives a page asks for, from its "Allow indexing" and "Follow
 * links" toggles.
 *
 * Kept as its own function because both export paths run through `inject()`
 * and a page excluded from search must ship excluded from BOTH — the single
 * file and the published site.
 */
function robotsDirectives(pageSEO?: PageSEO): string {
  const directives: string[] = [];
  if (pageSEO?.noIndex) directives.push("noindex");
  if (pageSEO?.noFollow) directives.push("nofollow");
  return directives.join(", ");
}

export class SEOInjector {
  private options: SEOInjectorOptions;

  constructor(options: SEOInjectorOptions = {}) {
    this.options = options;
  }

  /**
   * Generate all SEO meta tags for a page
   */
  inject(
    page: PageData,
    siteSEO?: SiteSEO,
    /* The export modal's Options tab carries its own title and description
       fields. They used to be the ONLY thing the single-file export could say
       about SEO, because that path assembled its own head instead of calling
       this — which is how it shipped without canonical, without JSON-LD and
       without the page's robots directive. It calls this now; the two fields
       stay honoured as overrides. */
    overrides?: { title?: string | null; description?: string }
  ): string {
    const pageSEO = page.settings?.seo;
    const pageSettings = page.settings;

    // Resolve values with fallbacks
    // `null` means "the caller asked for no title at all" — the export config
    // documents an empty pageTitle as omitting the tag. `undefined` means the
    // caller has nothing to say, so the page's own title stands.
    const omitTitle = overrides?.title === null;
    /* An override is the export modal's own Title field — a literal the user
       typed for this one file, so the site template does not rewrite it. */
    const title =
      overrides?.title?.trim() || resolvePageTitle(page, pageSEO, pageSettings, siteSEO);
    const description =
      overrides?.description?.trim() || this.getDescription(pageSEO, pageSettings);
    const ogImage = pageSEO?.ogImage || siteSEO?.defaultOgImage || "";
    const ogTitle = pageSEO?.ogTitle || title;
    const ogDescription = pageSEO?.ogDescription || description;
    const twitterCard = pageSEO?.twitterCard || "summary_large_image";
    const canonicalUrl = pageSEO?.canonicalUrl || this.getPageUrl(page);
    const language = siteSEO?.language || "en";

    const tags: string[] = [];

    // Basic meta tags
    if (!omitTitle) tags.push(`<title>${this.escape(title)}</title>`);

    if (description) {
      tags.push(`<meta name="description" content="${this.escape(description)}">`);
    }

    // Canonical URL
    if (canonicalUrl) {
      tags.push(`<link rel="canonical" href="${this.escape(canonicalUrl)}">`);
    }

    // Language
    tags.push(`<meta property="og:locale" content="${language}">`);

    // Open Graph tags
    tags.push(`<meta property="og:type" content="website">`);
    tags.push(`<meta property="og:title" content="${this.escape(ogTitle)}">`);

    if (ogDescription) {
      tags.push(`<meta property="og:description" content="${this.escape(ogDescription)}">`);
    }

    if (ogImage) {
      tags.push(`<meta property="og:image" content="${this.escape(ogImage)}">`);
    }

    if (canonicalUrl) {
      tags.push(`<meta property="og:url" content="${this.escape(canonicalUrl)}">`);
    }

    if (siteSEO?.siteName) {
      tags.push(`<meta property="og:site_name" content="${this.escape(siteSEO.siteName)}">`);
    }

    // Twitter Card tags
    tags.push(`<meta name="twitter:card" content="${twitterCard}">`);
    tags.push(`<meta name="twitter:title" content="${this.escape(ogTitle)}">`);

    if (ogDescription) {
      tags.push(`<meta name="twitter:description" content="${this.escape(ogDescription)}">`);
    }

    if (ogImage) {
      tags.push(`<meta name="twitter:image" content="${this.escape(ogImage)}">`);
    }

    if (siteSEO?.twitterHandle) {
      tags.push(`<meta name="twitter:site" content="${this.escape(siteSEO.twitterHandle)}">`);
    }

    // Favicon
    if (siteSEO?.favicon) {
      tags.push(`<link rel="icon" href="${this.escape(siteSEO.favicon)}">`);
    }

    // Robots directives
    const robots = robotsDirectives(pageSEO);
    if (robots) {
      tags.push(`<meta name="robots" content="${robots}">`);
    }

    // Structured data (JSON-LD).
    // Escape </script> in the payload to prevent breaking out of the script tag.
    if (pageSEO?.structuredData) {
      const jsonLd = JSON.stringify(pageSEO.structuredData).replace(/<\/script/gi, "<\\/script");
      tags.push(`<script type="application/ld+json">${jsonLd}</script>`);
    }

    /* Settings → Site Settings → Social Links writes three URLs into project
       settings and, until now, NOTHING anywhere read them: not this injector,
       not the canvas, not the publish path. Filled in, they left the editor
       and reached no page. `sameAs` on an Organization is what a site-wide
       social profile means to a search engine, so that is what they emit. */
    const sameAs = this.socialProfiles(siteSEO);
    if (sameAs.length) {
      const org: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Organization",
        sameAs,
      };
      if (siteSEO?.siteName) org.name = siteSEO.siteName;
      if (canonicalUrl) org.url = this.options.baseUrl || canonicalUrl;
      const orgLd = JSON.stringify(org).replace(/<\/script/gi, "<\\/script");
      tags.push(`<script type="application/ld+json">${orgLd}</script>`);
    }

    // A2: Custom head code. Was previously persisted but NEVER injected —
    // the "runs on every page load" banner was a lie. Now sanitized via
    // DOMPurify allowlist (inline <script>, event handlers, unknown tags
    // all stripped) and appended last so user injections override defaults.
    const customHead = sanitizeHeadCode(page.settings?.head);
    if (customHead) tags.push(customHead);

    return tags.join("\n  ");
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------


  /** The site's social profile URLs, http(s) only — these are user input and
   *  land inside a <script>, so a `javascript:` value has no business here. */
  private socialProfiles(siteSEO?: SiteSEO): string[] {
    const links = siteSEO?.socialLinks;
    if (!links) return [];
    return [links.twitter, links.facebook, links.linkedin]
      .map((v) => (v ?? "").trim())
      .filter((v) => /^https?:\/\//i.test(v));
  }

  private getDescription(pageSEO?: PageSEO, pageSettings?: { description?: string }): string {
    return pageSEO?.metaDescription || pageSettings?.description || "";
  }

  private getPageUrl(page: PageData): string {
    if (!this.options.baseUrl) return "";

    // Reuse the shared slugify so the fallback strips non-URL-safe characters
    // (&, /, !, ?, …). The old inline `replace(/\s+/g, "-")` only collapsed
    // whitespace and leaked punctuation into an invalid canonical URL.
    const slug = page.slug || slugify(page.name);
    return page.isHome ? this.options.baseUrl : `${this.options.baseUrl}/${slug}`;
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

export default SEOInjector;
