/**
 * SEO Helpers
 * Meta tags and structured data utilities
 *
 * @module utils/html/seo
 * @license BSD-3-Clause
 */

import { escapeAttr, escapeHTML } from "./encoding";

// =============================================================================
// META TAG TYPES
// =============================================================================

/**
 * Meta tag configuration
 */
export interface MetaTagConfig {
  charset?: string;
  viewport?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  robots?: string;
  canonical?: string;
  themeColor?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  ogSiteName?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  [key: string]: string | string[] | undefined;
}

// =============================================================================
// META TAG GENERATION
// =============================================================================

/**
 * Generate meta tags HTML
 */
export function generateMetaTags(config: MetaTagConfig): string {
  const tags: string[] = [];

  // Charset
  if (config.charset) {
    tags.push(`<meta charset="${escapeAttr(config.charset)}">`);
  }

  // Viewport
  if (config.viewport) {
    tags.push(`<meta name="viewport" content="${escapeAttr(config.viewport)}">`);
  }

  // Title (should be in <head> but not a meta tag)
  if (config.title) {
    tags.push(`<title>${escapeHTML(config.title)}</title>`);
  }

  // Description
  if (config.description) {
    tags.push(`<meta name="description" content="${escapeAttr(config.description)}">`);
  }

  // Keywords
  if (config.keywords && config.keywords.length > 0) {
    tags.push(`<meta name="keywords" content="${escapeAttr(config.keywords.join(", "))}">`);
  }

  // Author
  if (config.author) {
    tags.push(`<meta name="author" content="${escapeAttr(config.author)}">`);
  }

  // Robots
  if (config.robots) {
    tags.push(`<meta name="robots" content="${escapeAttr(config.robots)}">`);
  }

  // Canonical URL
  if (config.canonical) {
    tags.push(`<link rel="canonical" href="${escapeAttr(config.canonical)}">`);
  }

  // Theme color
  if (config.themeColor) {
    tags.push(`<meta name="theme-color" content="${escapeAttr(config.themeColor)}">`);
  }

  // Open Graph
  if (config.ogTitle) {
    tags.push(`<meta property="og:title" content="${escapeAttr(config.ogTitle)}">`);
  }
  if (config.ogDescription) {
    tags.push(`<meta property="og:description" content="${escapeAttr(config.ogDescription)}">`);
  }
  if (config.ogImage) {
    tags.push(`<meta property="og:image" content="${escapeAttr(config.ogImage)}">`);
  }
  if (config.ogUrl) {
    tags.push(`<meta property="og:url" content="${escapeAttr(config.ogUrl)}">`);
  }
  if (config.ogType) {
    tags.push(`<meta property="og:type" content="${escapeAttr(config.ogType)}">`);
  }
  if (config.ogSiteName) {
    tags.push(`<meta property="og:site_name" content="${escapeAttr(config.ogSiteName)}">`);
  }

  // Twitter Card
  if (config.twitterCard) {
    tags.push(`<meta name="twitter:card" content="${escapeAttr(config.twitterCard)}">`);
  }
  if (config.twitterTitle) {
    tags.push(`<meta name="twitter:title" content="${escapeAttr(config.twitterTitle)}">`);
  }
  if (config.twitterDescription) {
    tags.push(
      `<meta name="twitter:description" content="${escapeAttr(config.twitterDescription)}">`
    );
  }
  if (config.twitterImage) {
    tags.push(`<meta name="twitter:image" content="${escapeAttr(config.twitterImage)}">`);
  }
  if (config.twitterSite) {
    tags.push(`<meta name="twitter:site" content="${escapeAttr(config.twitterSite)}">`);
  }
  if (config.twitterCreator) {
    tags.push(`<meta name="twitter:creator" content="${escapeAttr(config.twitterCreator)}">`);
  }

  return tags.join("\n");
}

// =============================================================================
// STRUCTURED DATA
// =============================================================================

/**
 * JSON-LD structured data types
 */
export type StructuredDataType =
  | "Article"
  | "BreadcrumbList"
  | "Event"
  | "FAQPage"
  | "HowTo"
  | "LocalBusiness"
  | "Organization"
  | "Person"
  | "Product"
  | "Recipe"
  | "WebPage"
  | "WebSite";

/**
 * Generate JSON-LD script tag
 */
export function generateJsonLd(type: StructuredDataType, data: Record<string, unknown>): string {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}

/**
 * Generate breadcrumb JSON-LD
 */
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]): string {
  const itemList = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  }));

  return generateJsonLd("BreadcrumbList", { itemListElement: itemList });
}

/**
 * Generate FAQ JSON-LD
 */
export function generateFaqJsonLd(faqs: { question: string; answer: string }[]): string {
  const mainEntity = faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));

  return generateJsonLd("FAQPage", { mainEntity });
}
