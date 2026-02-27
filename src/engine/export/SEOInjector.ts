/**
 * SEO Injector
 * Generates meta tags for SEO and social sharing
 *
 * @module engine/export/SEOInjector
 * @license BSD-3-Clause
 */

import type { PageSEO, SiteSEO, PageData } from "../../shared/types";

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

export class SEOInjector {
  private options: SEOInjectorOptions;

  constructor(options: SEOInjectorOptions = {}) {
    this.options = options;
  }

  /**
   * Generate all SEO meta tags for a page
   */
  inject(page: PageData, siteSEO?: SiteSEO): string {
    const pageSEO = page.settings?.seo;
    const pageSettings = page.settings;

    // Resolve values with fallbacks
    const title = this.getTitle(page, pageSEO, pageSettings);
    const description = this.getDescription(pageSEO, pageSettings);
    const ogImage = pageSEO?.ogImage || siteSEO?.defaultOgImage || "";
    const ogTitle = pageSEO?.ogTitle || title;
    const ogDescription = pageSEO?.ogDescription || description;
    const twitterCard = pageSEO?.twitterCard || "summary_large_image";
    const canonicalUrl = pageSEO?.canonicalUrl || this.getPageUrl(page);
    const language = siteSEO?.language || "en";

    const tags: string[] = [];

    // Basic meta tags
    tags.push(`<title>${this.escape(title)}</title>`);

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
    const robotsDirectives: string[] = [];
    if (pageSEO?.noIndex) robotsDirectives.push("noindex");
    if (pageSEO?.noFollow) robotsDirectives.push("nofollow");

    if (robotsDirectives.length > 0) {
      tags.push(`<meta name="robots" content="${robotsDirectives.join(", ")}">`);
    }

    // Structured data (JSON-LD)
    if (pageSEO?.structuredData) {
      tags.push(
        `<script type="application/ld+json">${JSON.stringify(pageSEO.structuredData)}</script>`
      );
    }

    return tags.join("\n  ");
  }

  /**
   * Generate meta tags as an array (for programmatic use)
   */
  getMetaTags(
    page: PageData,
    siteSEO?: SiteSEO
  ): Array<{ name?: string; property?: string; content: string }> {
    const pageSEO = page.settings?.seo;
    const pageSettings = page.settings;

    const title = this.getTitle(page, pageSEO, pageSettings);
    const description = this.getDescription(pageSEO, pageSettings);
    const ogImage = pageSEO?.ogImage || siteSEO?.defaultOgImage;

    const tags: Array<{ name?: string; property?: string; content: string }> = [];

    if (description) {
      tags.push({ name: "description", content: description });
    }

    tags.push({ property: "og:title", content: title });

    if (description) {
      tags.push({ property: "og:description", content: description });
    }

    if (ogImage) {
      tags.push({ property: "og:image", content: ogImage });
    }

    tags.push({ name: "twitter:card", content: "summary_large_image" });
    tags.push({ name: "twitter:title", content: title });

    if (description) {
      tags.push({ name: "twitter:description", content: description });
    }

    if (ogImage) {
      tags.push({ name: "twitter:image", content: ogImage });
    }

    if (siteSEO?.twitterHandle) {
      tags.push({ name: "twitter:site", content: siteSEO.twitterHandle });
    }

    return tags;
  }

  // --------------------------------------------------------------------------
  // PRIVATE HELPERS
  // --------------------------------------------------------------------------

  private getTitle(page: PageData, pageSEO?: PageSEO, pageSettings?: { title?: string }): string {
    return pageSEO?.metaTitle || pageSettings?.title || page.name || "Untitled";
  }

  private getDescription(pageSEO?: PageSEO, pageSettings?: { description?: string }): string {
    return pageSEO?.metaDescription || pageSettings?.description || "";
  }

  private getPageUrl(page: PageData): string {
    if (!this.options.baseUrl) return "";

    const slug = page.slug || page.name.toLowerCase().replace(/\s+/g, "-");
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
