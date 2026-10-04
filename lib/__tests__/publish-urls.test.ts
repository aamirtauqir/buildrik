/**
 * Every page used to declare the same canonical — see publish-urls.ts.
 */
import { describe, it, expect } from "vitest";
import { resolveSiteOrigin, resolveSiteOrigins, buildSitemapXml, withSitemapDirective } from "../publish-urls";

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

describe("resolveSiteOrigins", () => {
  it("lists every known origin, not just the preferred one", () => {
    const origins = resolveSiteOrigins({
      canonicalUrl: "https://example.com",
      verifiedDomain: "other.example.com",
      vercelProjectName: "buildrik-site-abc",
    });
    expect(origins).toContain("https://example.com");
    expect(origins).toContain("https://other.example.com");
    expect(origins).toContain("https://buildrik-site-abc.vercel.app");
  });

  it("includes the apex+www counterpart of a custom domain", () => {
    const origins = resolveSiteOrigins({ canonicalUrl: "https://www.example.com", verifiedDomain: null });
    expect(origins).toContain("https://www.example.com");
    expect(origins).toContain("https://example.com");
  });

  it("returns an empty list when nothing is configured", () => {
    expect(resolveSiteOrigins({ canonicalUrl: null, verifiedDomain: null })).toEqual([]);
  });

  it("never includes an attacker-controlled origin", () => {
    const origins = resolveSiteOrigins({
      canonicalUrl: "https://mysite.example.com",
      verifiedDomain: null,
      vercelProjectName: "my-site",
    });
    expect(origins).not.toContain("https://evil.example.com");
  });
});
