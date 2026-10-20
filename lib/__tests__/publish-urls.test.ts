/**
 * Every page used to declare the same canonical — see publish-urls.ts.
 */
import { describe, it, expect } from "vitest";
import { resolveSiteOrigin, resolveSiteOrigins } from "../publish-urls";

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
