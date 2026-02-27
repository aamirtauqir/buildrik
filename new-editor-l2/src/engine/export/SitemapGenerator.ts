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
   */
  generate(pages: PageData[]): string {
    const urls = pages
      .filter((page) => !page.settings?.seo?.noIndex)
      .map((page) => this.buildUrlEntry(page))
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
  }

  /**
   * Build a single URL entry for the sitemap
   */
  private buildUrlEntry(page: PageData): string {
    const path = page.isHome || !page.slug ? "" : page.slug;
    const loc = `${this.baseUrl}/${path}`;
    const priority = page.isHome ? "1.0" : "0.8";
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
