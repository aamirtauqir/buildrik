/**
 * SEO Injector
 * Generates meta tags for SEO and social sharing
 *
 * @module engine/export/SEOInjector
 * @license BSD-3-Clause
 */

import type { PageSEO, SiteSEO, PageData } from "@/shared/types";
import { sanitizeHeadCode } from "./sanitizeHeadCode";
import { SOCIAL_NETWORKS } from "@buildrik/shared/schemas/site-detail";
import { resolveEmittedTitle } from "@buildrik/shared/seo/titles";

// ============================================================================
// SEO INJECTOR
// ============================================================================

/**
 * The title a page ships with — `resolveEmittedTitle` (packages/shared/seo/
 * titles.ts), the one resolver the drawer and the pre-publish check use too.
 * Owner order L3-036: own SEO title verbatim → site template over the page
 * name → page name; the site default title is the home page's fallback.
 * Exported because the single-file export path and the drawer need it.
 */
export function resolvePageTitle(
  page: Pick<PageData, "name" | "isHome">,
  pageSEO?: PageSEO,
  pageSettings?: { title?: string },
  siteSEO?: SiteSEO
): string {
  return resolveEmittedTitle({
    pageName: page.name,
    isHome: page.isHome === true,
    seoTitle: pageSEO?.metaTitle,
    settingsTitle: pageSettings?.title,
    site: siteSEO ?? {},
  }).title;
}

/**
 * The description a page ships with: its own, else the site's default from
 * Settings › SEO › Defaults (owner decision Q4). A page without one used to
 * ship no description at all while the Defaults card held one.
 */
export function resolvePageDescription(
  pageSEO?: PageSEO,
  pageSettings?: { description?: string },
  siteSEO?: SiteSEO
): string {
  return pageSEO?.metaDescription || pageSettings?.description || siteSEO?.metaDescription?.trim() || "";
}

/**
 * The language a site declares, for `<html lang>` and og:locale.
 *
 * All three heads hardcoded `lang="en"` while the SEO block right under them
 * printed `og:locale` from this same field, so a French site announced itself
 * as English to screen readers and to anything that reads the document
 * language (WCAG 3.1.1) while telling Facebook the truth.
 */
export function resolveLanguage(siteSEO?: { language?: string }): string {
  return siteSEO?.language?.trim() || "en";
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
      overrides?.description?.trim() || resolvePageDescription(pageSEO, pageSettings, siteSEO);
    const ogImage = pageSEO?.ogImage || siteSEO?.defaultOgImage || "";
    const ogTitle = pageSEO?.ogTitle || title;
    const ogDescription = pageSEO?.ogDescription || description;
    const twitterCard = pageSEO?.twitterCard || "summary_large_image";
    /* FG-011: X uses the shared (Open Graph) values unless the page turned on
       "Customize for X". Custom values kept while it is off are ignored. */
    const xOwn = pageSEO?.xCustomized === true;
    const xTitle = (xOwn && pageSEO?.twitterTitle) || ogTitle;
    const xDescription = (xOwn && pageSEO?.twitterDescription) || ogDescription;
    const xImage = (xOwn && pageSEO?.twitterImage) || ogImage;
    /* Only the page's own override is emitted here. The default canonical is
       built on the server from the URL the deploy serves (`pageCanonicalUrl`,
       packages/shared/seo/urls.ts) — the editor does not know the domain. A
       second builder here produced `/<slug>` while the deploy serves
       `/<slug>.html`, and no export ever passed it a base URL. */
    const canonicalUrl = pageSEO?.canonicalUrl || "";
    const language = resolveLanguage(siteSEO);

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
    tags.push(`<meta name="twitter:title" content="${this.escape(xTitle)}">`);

    if (xDescription) {
      tags.push(`<meta name="twitter:description" content="${this.escape(xDescription)}">`);
    }

    if (xImage) {
      tags.push(`<meta name="twitter:image" content="${this.escape(xImage)}">`);
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

    /* Settings → SEO → Social profiles (six networks) — they once sat in
       project settings while NOTHING anywhere read them: not this injector,
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
      if (canonicalUrl) org.url = canonicalUrl;
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
    /* Every network the Settings screen offers (Q-B9): it read three of the
       six, so an Instagram, YouTube or GitHub profile never reached a page. */
    return SOCIAL_NETWORKS.map((network) => (links[network] ?? "").trim())
      .filter((v) => /^https?:\/\//i.test(v));
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
