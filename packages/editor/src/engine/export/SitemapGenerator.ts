/**
 * SitemapGenerator - Generate XML sitemap for multi-page exports
 * Respects noIndex pages and generates valid XML sitemap format
 * @license BSD-3-Clause
 */

import type { PageData } from "../../shared/types";

/**
 * Generates XML sitemaps for multi-page projects
 * Follows the Sitemap Protocol (sitemaps.org)
 */
export class SitemapGenerator {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // Remove trailing slash to normalize URL construction
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Generate XML sitemap from pages array
   * Excludes pages marked with noIndex in their SEO settings
   *
   * `hrefs` maps page id → the file the export actually wrote (index.html,
   * about.html, terms-2.html). Without it this built `${base}/${slug}`, so the
   * sitemap advertised /about while the deploy served /about.html and there is
   * no vercel.json asking for clean URLs — a sitemap of 404s. The export knows
   * the real names; it just wasn't telling.
   */
  generate(pages: PageData[], hrefs?: ReadonlyMap<string, string>): string {
    const urls = pages
      .filter((page) => !page.settings?.seo?.noIndex)
      .map((page) => this.buildUrlEntry(page, hrefs?.get(page.id)))
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  /**
   * Build a single URL entry for the sitemap
   */
  private buildUrlEntry(page: PageData, href?: string): string {
    // index.html is the site root, so it advertises the bare origin.
    const path = href ? (href === "index.html" ? "" : href) : page.isHome || !page.slug ? "" : page.slug;
    const loc = `${this.baseUrl}/${path}`;
    const priority = (href ? href === "index.html" : page.isHome) ? "1.0" : "0.8";
    const lastmod = new Date().toISOString().split("T")[0];

    return `  <url>
    <loc>${this.escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </url>`;
  }

  /**
   * Escape special XML characters to ensure valid XML output
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
