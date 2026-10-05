/**
 * The one sitemap builder (publish worker + editor ZIP export).
 */
import { describe, it, expect } from "vitest";
import { buildSitemapXml } from "../sitemap";

describe("buildSitemapXml", () => {
  const pages = [
    { path: "index.html", html: "<html></html>" },
    { path: "about.html", html: "<html></html>" },
    { path: "blog/post.html", html: "<html></html>" },
  ];

  it("lists the filenames the deploy serves, with the root as the bare origin", () => {
    const xml = buildSitemapXml("https://example.com", pages, "2026-08-21T10:00:00.000Z");
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<loc>https://example.com/about.html</loc>");
    expect(xml).toContain("<loc>https://example.com/blog/post.html</loc>");
    // NOT the clean-URL form: there is no vercel.json, so /about would 404.
    expect(xml).not.toContain("<loc>https://example.com/about</loc>");
    expect(xml).toContain("<lastmod>2026-08-21</lastmod>");
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });

  it("leaves out a page that carries its own noindex", () => {
    const xml = buildSitemapXml(
      "https://example.com",
      [
        { path: "index.html", html: "<html></html>" },
        { path: "secret.html", html: '<html><head><meta name="robots" content="noindex,nofollow"></head></html>' },
      ],
      "2026-08-21T00:00:00.000Z",
    );
    expect(xml).toContain("https://example.com/");
    expect(xml).not.toContain("secret.html");
  });

  it("gives the root priority 1.0 and the rest 0.8", () => {
    const xml = buildSitemapXml("https://example.com", pages, "2026-08-21T00:00:00.000Z");
    expect(xml.match(/<priority>1\.0<\/priority>/g)).toHaveLength(1);
    expect(xml.match(/<priority>0\.8<\/priority>/g)).toHaveLength(2);
  });

  it("escapes XML special characters in a loc", () => {
    const xml = buildSitemapXml("https://example.com", [{ path: `a&b<c>.html` }], "2026-08-21T00:00:00.000Z");
    expect(xml).toContain("<loc>https://example.com/a&amp;b&lt;c&gt;.html</loc>");
  });

  it("produces an empty urlset when every page is noindex", () => {
    const xml = buildSitemapXml(
      "https://example.com",
      [{ path: "index.html", html: '<meta name="robots" content="noindex">' }],
      "2026-08-21T00:00:00.000Z",
    );
    expect(xml).not.toContain("<url>");
    expect(xml).toContain("</urlset>");
  });
});
