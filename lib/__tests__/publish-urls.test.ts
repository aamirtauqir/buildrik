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
