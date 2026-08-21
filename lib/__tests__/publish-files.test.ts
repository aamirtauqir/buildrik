/**
 * What a publish actually uploads.
 *
 * This assembly lived inside the worker route where no test could run it, which
 * is how five pages came to ship five identical canonicals, and how a site
 * shipped no sitemap for months while a tested generator sat in the editor.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { buildDeployFiles, type DeployInputs } from "../publish-files";

const page = (title: string) =>
  `<!doctype html><html><head><title>${title}</title></head><body><h1>${title}</h1></body></html>`;

const base: DeployInputs = {
  siteId: "site-1",
  pages: [
    { path: "index.html", html: page("Home") },
    { path: "about.html", html: page("About") },
    { path: "pricing.html", html: page("Pricing") },
  ],
  origin: "https://example.com",
  icons: { favicon: null, touchIcon: null, ogImage: null },
  canonicalUrl: "https://example.com",
  allowIndexing: true,
  robotsTxt: null,
  appScripts: "",
  showBadge: false,
  now: "2026-08-21T00:00:00.000Z",
};

const build = (over: Partial<DeployInputs> = {}) => buildDeployFiles({ ...base, ...over });
const byName = (files: ReturnType<typeof build>, name: string) =>
  files.find((f) => f.file === name)?.data ?? "";

describe("buildDeployFiles", () => {
  it("uploads every page plus robots.txt and sitemap.xml", () => {
    expect(build().map((f) => f.file)).toEqual([
      "index.html",
      "about.html",
      "pricing.html",
      "robots.txt",
      "sitemap.xml",
    ]);
  });

  it("gives each page its own canonical and og:url", () => {
    const files = build();
    expect(byName(files, "index.html")).toContain('<link rel="canonical" href="https://example.com/">');
    expect(byName(files, "about.html")).toContain('<link rel="canonical" href="https://example.com/about.html">');
    expect(byName(files, "about.html")).toContain('<meta property="og:url" content="https://example.com/about.html">');
    const canonicals = files
      .filter((f) => f.file.endsWith(".html"))
      .map((f) => f.data.match(/rel="canonical" href="([^"]+)"/)?.[1]);
    expect(new Set(canonicals).size).toBe(3);
  });

  it("points robots.txt at the sitemap, and lists the served filenames in it", () => {
    const files = build();
    expect(byName(files, "robots.txt")).toContain("Sitemap: https://example.com/sitemap.xml");
    const xml = byName(files, "sitemap.xml");
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<loc>https://example.com/about.html</loc>");
    expect(xml).not.toContain("<loc>https://example.com/about</loc>");
  });

  it("ships no sitemap and disallows crawling when indexing is off", () => {
    const files = build({ allowIndexing: false });
    expect(files.map((f) => f.file)).not.toContain("sitemap.xml");
    expect(byName(files, "robots.txt")).toContain("Disallow: /");
    expect(byName(files, "robots.txt")).not.toContain("Sitemap:");
    expect(byName(files, "index.html")).toContain('content="noindex,nofollow"');
  });

  it("keeps a custom robots.txt, only adding the pointer it lacks", () => {
    const custom = build({ robotsTxt: "User-agent: Googlebot\nDisallow: /private\n" });
    const txt = byName(custom, "robots.txt");
    expect(txt).toContain("Disallow: /private");
    expect(txt).toContain("Sitemap: https://example.com/sitemap.xml");

    const authored = build({ robotsTxt: "User-agent: *\nSitemap: https://cdn.example/sm.xml\n" });
    expect(byName(authored, "robots.txt")).not.toContain("example.com/sitemap.xml");
  });

  it("ships icons and the free-plan badge only when they are given", () => {
    const plain = build();
    expect(byName(plain, "index.html")).not.toContain("Made with Buildrick");
    expect(byName(plain, "index.html")).not.toContain('rel="icon"');

    const dressed = build({
      showBadge: true,
      icons: { favicon: "/f.ico", touchIcon: "/t.png", ogImage: "https://cdn/og.png" },
    });
    expect(byName(dressed, "index.html")).toContain('<link rel="icon" href="/f.ico">');
    expect(byName(dressed, "index.html")).toContain("Made with Buildrick");
  });

  it("emits no canonical, and no sitemap, when there is no origin at all", () => {
    const files = build({ origin: null, canonicalUrl: null });
    expect(files.map((f) => f.file)).not.toContain("sitemap.xml");
    expect(byName(files, "index.html")).not.toContain("canonical");
  });
});
