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
  redirects: [],
  domains: [],
  headers: { cspPolicy: null, hstsMaxAge: null, xFrameOptions: null, referrerPolicy: null, permissionsPolicy: null },
  now: "2026-08-21T00:00:00.000Z",
};

const build = (over: Partial<DeployInputs> = {}) => buildDeployFiles({ ...base, ...over });
const byName = (files: ReturnType<typeof build>, name: string) =>
  files.find((f) => f.file === name)?.data ?? "";
const vercelJson = (over: Partial<DeployInputs> = {}) => {
  const data = byName(build(over), "vercel.json");
  return data ? (JSON.parse(data) as Record<string, unknown>) : null;
};

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

/**
 * Settings S3: redirects and headers reach the deploy through vercel.json —
 * Vercel's file-based configuration, honoured on every deployment. Before
 * this, a redirect saved in Settings redirected nothing and a CSP set in
 * Headers was never sent.
 */
describe("buildDeployFiles — vercel.json", () => {
  const headers = (over: Partial<DeployInputs["headers"]>) => ({ ...base.headers, ...over });
  const rule = (fromPath: string, toUrl: string, type = "301", matchQuery = false) => ({ fromPath, toUrl, type, matchQuery });

  it("ships no vercel.json when the site has no redirects, no redirect domains and no headers", () => {
    expect(build().map((f) => f.file)).not.toContain("vercel.json");
    expect(vercelJson({ domains: [{ domain: "bellacucina.com", kind: "PRIMARY", isPrimary: true }] })).toBeNull();
    expect(vercelJson({ headers: headers({ cspPolicy: "   ", hstsMaxAge: 0, xFrameOptions: "" }) })).toBeNull();
  });

  it("turns each redirect row into a rule with its literal code: 301 or 302", () => {
    const json = vercelJson({ redirects: [rule("/old-menu", "/menu"), rule("/reservations", "https://book.example/x", "302")] });
    expect(json).toEqual({
      redirects: [
        { source: "/old-menu", destination: "/menu", statusCode: 301 },
        { source: "/reservations", destination: "https://book.example/x", statusCode: 302 },
      ],
    });
  });

  it("matchQuery changes nothing on the wire — Vercel forwards the query string on every rule", () => {
    const off = vercelJson({ redirects: [rule("/old-menu", "/menu", "301", false)] });
    const on = vercelJson({ redirects: [rule("/old-menu", "/menu", "301", true)] });
    expect(on).toEqual(off);
    expect(JSON.stringify(on)).not.toContain("matchQuery");
  });

  it("sends a REDIRECT-kind domain to the primary with a host rule, carrying the path", () => {
    const json = vercelJson({
      domains: [
        { domain: "bellacucina.com", kind: "PRIMARY", isPrimary: true },
        { domain: "bella-cucina.co.uk", kind: "REDIRECT", isPrimary: false },
        { domain: "menu.bellacucina.com", kind: "SUBDOMAIN", isPrimary: false },
      ],
    });
    expect(json).toEqual({
      redirects: [
        {
          source: "/(.*)",
          has: [{ type: "host", value: "bella-cucina.co.uk" }],
          destination: "https://bellacucina.com/$1",
          permanent: true,
        },
      ],
    });
  });

  it("writes no host rule without a primary, and never one that points the primary at itself", () => {
    expect(vercelJson({ domains: [{ domain: "bella-cucina.co.uk", kind: "REDIRECT", isPrimary: false }] })).toBeNull();
    expect(vercelJson({ domains: [{ domain: "bellacucina.com", kind: "REDIRECT", isPrimary: true }] })).toBeNull();
  });

  it("lists the row rules before the host rules", () => {
    const json = vercelJson({
      redirects: [rule("/old-menu", "/menu")],
      domains: [
        { domain: "bellacucina.com", kind: "PRIMARY", isPrimary: true },
        { domain: "bella-cucina.co.uk", kind: "REDIRECT", isPrimary: false },
      ],
    });
    expect((json?.redirects as Array<{ source: string }>).map((r) => r.source)).toEqual(["/old-menu", "/(.*)"]);
  });

  it("sends every header that is set, on every path, and only those", () => {
    const json = vercelJson({
      headers: headers({
        cspPolicy: "default-src 'self'",
        hstsMaxAge: 63072000,
        xFrameOptions: "SAMEORIGIN",
        referrerPolicy: "strict-origin-when-cross-origin",
        permissionsPolicy: "camera=(), microphone=()",
      }),
    });
    expect(json).toEqual({
      headers: [
        {
          source: "/(.*)",
          headers: [
            { key: "Content-Security-Policy", value: "default-src 'self'" },
            { key: "Strict-Transport-Security", value: "max-age=63072000" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=()" },
          ],
        },
      ],
    });
  });

  it("sends a single header alone, trimmed, and treats a zero HSTS age as off", () => {
    expect(vercelJson({ headers: headers({ xFrameOptions: " DENY " }) })).toEqual({
      headers: [{ source: "/(.*)", headers: [{ key: "X-Frame-Options", value: "DENY" }] }],
    });
    expect(vercelJson({ headers: headers({ hstsMaxAge: 0, cspPolicy: "default-src 'self'" }) })).toEqual({
      headers: [{ source: "/(.*)", headers: [{ key: "Content-Security-Policy", value: "default-src 'self'" }] }],
    });
  });

  it("puts redirects and headers in one file, after the pages, robots.txt and sitemap.xml", () => {
    const files = build({ redirects: [rule("/a", "/b")], headers: headers({ xFrameOptions: "DENY" }) });
    expect(files.map((f) => f.file)).toEqual(["index.html", "about.html", "pricing.html", "robots.txt", "sitemap.xml", "vercel.json"]);
    expect(JSON.parse(byName(files, "vercel.json"))).toEqual({
      redirects: [{ source: "/a", destination: "/b", statusCode: 301 }],
      headers: [{ source: "/(.*)", headers: [{ key: "X-Frame-Options", value: "DENY" }] }],
    });
  });
});
