/**
 * The one per-page URL builder (canonical, og:url, sitemap, editor preview).
 * Moved from lib/publish-urls.ts so the editor can use the same function.
 */
import { describe, it, expect } from "vitest";
import { normalizeCanonicalOrigin, pageCanonicalUrl, pageLinkUrl } from "../urls";

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
  /* REA #26: the deploy serves clean URLs (vercel.json `cleanUrls`, see
     lib/publish-files.ts) — `/about.html` 308s to `/about` — so every
     absolute URL names the clean path, never one that redirects. */
  it("gives each page its OWN clean url, not the site's", () => {
    expect(pageCanonicalUrl("https://example.com", "index.html")).toBe("https://example.com/");
    expect(pageCanonicalUrl("https://example.com", "about.html")).toBe("https://example.com/about");
    expect(pageCanonicalUrl("https://example.com", "blog/post.html")).toBe("https://example.com/blog/post");
  });

  it("names a directory's index page by the directory (CMS record pages)", () => {
    expect(pageCanonicalUrl("https://example.com", "blog/my-post/index.html")).toBe("https://example.com/blog/my-post");
  });

  it("does not double the slash when the export path has a leading one", () => {
    expect(pageCanonicalUrl("https://example.com", "/about.html")).toBe("https://example.com/about");
  });

  it("is null when no canonical domain is configured, or it is not a URL", () => {
    expect(pageCanonicalUrl(null, "about.html")).toBeNull();
    // Better no canonical than one pointing at a host that cannot exist.
    expect(pageCanonicalUrl("not a url at all", "about.html")).toBeNull();
  });
});

describe("pageLinkUrl", () => {
  /* BD-39 (4): a link the user copies must open on the deploy that is live
     today. Until the site has been published with cleanUrls, `/about` is a
     404 there, so the link names the file the deploy serves. */
  it("names the .html file while the live deploy predates cleanUrls", () => {
    expect(pageLinkUrl("https://example.com", "about.html", false)).toBe("https://example.com/about.html");
    expect(pageLinkUrl("https://example.com", "blog/my-post/index.html", false)).toBe(
      "https://example.com/blog/my-post/index.html",
    );
  });

  it("home stays the bare origin either way", () => {
    expect(pageLinkUrl("https://example.com", "index.html", false)).toBe("https://example.com/");
    expect(pageLinkUrl("https://example.com", "index.html", true)).toBe("https://example.com/");
  });

  it("is the canonical (clean) url once the live deploy serves clean URLs", () => {
    expect(pageLinkUrl("https://example.com", "about.html", true)).toBe("https://example.com/about");
  });

  it("is null without a usable domain", () => {
    expect(pageLinkUrl(null, "about.html", false)).toBeNull();
    expect(pageLinkUrl("not a url at all", "about.html", false)).toBeNull();
  });
});
