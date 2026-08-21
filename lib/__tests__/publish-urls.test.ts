/**
 * Every page used to declare the same canonical — see publish-urls.ts.
 */
import { describe, it, expect } from "vitest";
import { normalizeCanonicalOrigin, pageCanonicalUrl } from "../publish-urls";

describe("normalizeCanonicalOrigin", () => {
  it("accepts a bare domain and assumes https", () => {
    expect(normalizeCanonicalOrigin("www.example.com")).toBe("https://www.example.com");
  });

  it("drops a trailing slash so callers can join with one", () => {
    expect(normalizeCanonicalOrigin("https://example.com/")).toBe("https://example.com");
  });

  it("keeps a base path but discards query and hash", () => {
    expect(normalizeCanonicalOrigin("https://example.com/shop/?utm=x#top")).toBe(
      "https://example.com/shop",
    );
  });

  it("returns null for empty or unparseable input", () => {
    expect(normalizeCanonicalOrigin("   ")).toBeNull();
    expect(normalizeCanonicalOrigin("http://")).toBeNull();
  });
});

describe("pageCanonicalUrl", () => {
  it("gives each page its OWN url, not the site's", () => {
    expect(pageCanonicalUrl("https://example.com", "index.html")).toBe("https://example.com/");
    expect(pageCanonicalUrl("https://example.com", "about.html")).toBe(
      "https://example.com/about.html",
    );
    expect(pageCanonicalUrl("https://example.com", "blog/post.html")).toBe(
      "https://example.com/blog/post.html",
    );
  });

  it("does not double the slash when the export path has a leading one", () => {
    expect(pageCanonicalUrl("https://example.com", "/about.html")).toBe(
      "https://example.com/about.html",
    );
  });

  it("is null when no canonical domain is configured, or it is not a URL", () => {
    expect(pageCanonicalUrl(null, "about.html")).toBeNull();
    // Better no canonical than one pointing at a host that cannot exist.
    expect(pageCanonicalUrl("not a url at all", "about.html")).toBeNull();
  });
});

import { resolveSiteOrigin, buildSitemapXml, withSitemapDirective } from "../publish-urls";

describe("resolveSiteOrigin", () => {
  it("prefers the canonical domain the owner typed", () => {
    expect(
      resolveSiteOrigin({
        canonicalUrl: "https://www.example.com",
        verifiedDomain: "other.com",
        vercelProjectName: "proj",
      }),
    ).toBe("https://www.example.com");
  });

  it("falls back to a verified custom domain, then to the Vercel project", () => {
    expect(
      resolveSiteOrigin({ canonicalUrl: null, verifiedDomain: "shop.example", vercelProjectName: "proj" }),
    ).toBe("https://shop.example");
    expect(
      resolveSiteOrigin({ canonicalUrl: null, verifiedDomain: null, vercelProjectName: "proj" }),
    ).toBe("https://proj.vercel.app");
    expect(
      resolveSiteOrigin({ canonicalUrl: null, verifiedDomain: null, vercelProjectName: null }),
    ).toBeNull();
  });
});

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
});

describe("withSitemapDirective", () => {
  it("appends the pointer to a default robots.txt", () => {
    expect(withSitemapDirective("User-agent: *\nAllow: /\n", "https://example.com")).toContain(
      "Sitemap: https://example.com/sitemap.xml",
    );
  });

  it("does not touch a robots.txt that already names one", () => {
    const custom = "User-agent: *\nAllow: /\nSitemap: https://cdn.example/sm.xml\n";
    expect(withSitemapDirective(custom, "https://example.com")).toBe(custom);
  });

  it("adds nothing when there is no origin to point at", () => {
    expect(withSitemapDirective("User-agent: *\n", null)).toBe("User-agent: *\n");
  });
});
