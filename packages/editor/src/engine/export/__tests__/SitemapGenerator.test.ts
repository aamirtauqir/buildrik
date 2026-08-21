/**
 * SitemapGenerator — sitemap.xml generation for multi-page exports.
 * Contract: home priority 1.0, others 0.8, noIndex excluded, XML-escaped locs.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { SitemapGenerator } from "../SitemapGenerator";
import type { PageData } from "../../../shared/types";

function makePage(overrides: Partial<PageData>): PageData {
  return {
    id: "p1",
    name: "Page",
    root: { id: "root", type: "container" },
    ...overrides,
  };
}

const today = new Date().toISOString().split("T")[0];

describe("SitemapGenerator", () => {
  it("emits the XML declaration and sitemaps.org urlset namespace", () => {
    const xml = new SitemapGenerator("https://example.com").generate([makePage({ isHome: true })]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.trim().endsWith("</urlset>")).toBe(true);
  });

  it("gives the home page priority 1.0 and the root loc", () => {
    const xml = new SitemapGenerator("https://example.com").generate([
      makePage({ isHome: true, slug: "home" }),
    ]);
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<priority>1.0</priority>");
    // Home ignores its slug — always the site root.
    expect(xml).not.toContain("https://example.com/home");
  });

  it("gives non-home pages priority 0.8 with their slug in the loc", () => {
    const xml = new SitemapGenerator("https://example.com").generate([
      makePage({ slug: "about" }),
    ]);
    expect(xml).toContain("<loc>https://example.com/about</loc>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("falls back to the root loc for a non-home page without a slug", () => {
    const xml = new SitemapGenerator("https://example.com").generate([makePage({})]);
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("normalizes a trailing slash on the base URL", () => {
    const xml = new SitemapGenerator("https://example.com/").generate([
      makePage({ slug: "pricing" }),
    ]);
    expect(xml).toContain("<loc>https://example.com/pricing</loc>");
    expect(xml).not.toContain("example.com//");
  });

  it("excludes pages marked noIndex", () => {
    const xml = new SitemapGenerator("https://example.com").generate([
      makePage({ id: "p1", isHome: true }),
      makePage({ id: "p2", slug: "secret", settings: { seo: { noIndex: true } } }),
      makePage({ id: "p3", slug: "public" }),
    ]);
    expect(xml).not.toContain("secret");
    expect(xml).toContain("https://example.com/public");
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it("stamps lastmod with today's ISO date (YYYY-MM-DD)", () => {
    const xml = new SitemapGenerator("https://example.com").generate([makePage({ isHome: true })]);
    expect(xml).toContain(`<lastmod>${today}</lastmod>`);
  });

  it("escapes XML special characters in the loc (escapeXml)", () => {
    const xml = new SitemapGenerator("https://example.com").generate([
      makePage({ slug: `a&b<c>"d'e` }),
    ]);
    expect(xml).toContain("<loc>https://example.com/a&amp;b&lt;c&gt;&quot;d&apos;e</loc>");
    // No raw ampersand or angle bracket survives inside the loc value.
    expect(xml).not.toContain("a&b");
    expect(xml).not.toContain("<c>");
  });

  it("emits one <url> entry per page in input order, newline-joined", () => {
    const xml = new SitemapGenerator("https://example.com").generate([
      makePage({ id: "p1", isHome: true }),
      makePage({ id: "p2", slug: "about" }),
      makePage({ id: "p3", slug: "contact" }),
    ]);
    expect(xml.match(/<url>/g)).toHaveLength(3);
    expect(xml.indexOf("example.com/</loc>")).toBeLessThan(xml.indexOf("example.com/about"));
    expect(xml.indexOf("example.com/about")).toBeLessThan(xml.indexOf("example.com/contact"));
  });

  it("produces an empty urlset when every page is noIndex", () => {
    const xml = new SitemapGenerator("https://example.com").generate([
      makePage({ settings: { seo: { noIndex: true } } }),
    ]);
    expect(xml).not.toContain("<url>");
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
  });
});

/**
 * The sitemap has to name files the deploy actually serves.
 *
 * It built `${base}/${slug}` — /about — while the export writes about.html and
 * the deploy uploads that name with no vercel.json asking for clean URLs. Every
 * non-home entry was a 404 waiting to be crawled.
 */
describe("SitemapGenerator — urls match the exported filenames", () => {
  const pages = [
    makePage({ id: "p1", slug: "home", isHome: true }),
    makePage({ id: "p2", slug: "about" }),
    makePage({ id: "p3", slug: "terms" }),
  ];
  const hrefs = new Map([
    ["p1", "index.html"],
    ["p2", "about.html"],
    ["p3", "terms-2.html"],
  ]);

  it("uses the export's own filenames, including a de-duplicated one", () => {
    const xml = new SitemapGenerator("https://example.com").generate(pages, hrefs);
    expect(xml).toContain("<loc>https://example.com/about.html</loc>");
    expect(xml).toContain("<loc>https://example.com/terms-2.html</loc>");
    expect(xml).not.toContain("<loc>https://example.com/about</loc>");
  });

  it("advertises index.html as the bare origin, at priority 1.0", () => {
    const xml = new SitemapGenerator("https://example.com").generate(pages, hrefs);
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).not.toContain("index.html");
    const home = xml.slice(xml.indexOf("https://example.com/</loc>"));
    expect(home).toContain("<priority>1.0</priority>");
  });

  it("gives the home priority to whichever page became index.html, not to isHome", () => {
    // After the index.html fix, a site with no isHome page still has a root.
    const noHome = [makePage({ id: "a", slug: "one" }), makePage({ id: "b", slug: "two" })];
    const xml = new SitemapGenerator("https://example.com").generate(
      noHome,
      new Map([["a", "index.html"], ["b", "two.html"]]),
    );
    expect(xml.slice(xml.indexOf("<loc>https://example.com/</loc>"))).toContain("1.0");
    expect(xml).toContain("<loc>https://example.com/two.html</loc>");
  });
});
