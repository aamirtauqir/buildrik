/**
 * Settings Phase B, BE-4 — `updateSiteSettingsSchema`: icons, the OG image and
 * the canonical URL are https or a site path (no `javascript:` / `data:`), ""
 * clears; social links are the six networks (Q-B9), https only, Twitter also
 * as a handle (stored as its x.com link).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { updateSiteSettingsSchema } from "../site-detail";

const issuePaths = (result: { success: boolean; error?: { issues: Array<{ path: Array<string | number> }> } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((i) => i.path.join("."));

describe("updateSiteSettingsSchema — asset URLs (BE-4)", () => {
  const parse = (data: Record<string, unknown>) => updateSiteSettingsSchema.safeParse({ id: "s1", ...data });

  it.each(["favicon", "touchIcon", "ogImage", "canonicalUrl"])("%s refuses javascript: and data: URLs", (field) => {
    expect(issuePaths(parse({ [field]: "javascript:alert(1)" }))).toEqual([field]);
    expect(issuePaths(parse({ [field]: "data:image/svg+xml;base64,PHN2Zz4=" }))).toEqual([field]);
    expect(issuePaths(parse({ [field]: "//evil.example/x.png" }))).toEqual([field]);
    expect(issuePaths(parse({ [field]: "http://plain.example/x.png" }))).toEqual([field]);
  });

  it.each(["favicon", "touchIcon", "ogImage", "canonicalUrl"])("%s takes an https URL or a site path, and \"\" clears it", (field) => {
    expect(parse({ [field]: "https://cdn.example/icon.png" }).data).toMatchObject({ [field]: "https://cdn.example/icon.png" });
    expect(parse({ [field]: "/icon.png" }).data).toMatchObject({ [field]: "/icon.png" });
    expect(parse({ [field]: "" }).data).toMatchObject({ [field]: null });
    expect(parse({ [field]: null }).data).toMatchObject({ [field]: null });
  });
});

describe("updateSiteSettingsSchema — social links (BE-4, Q-B9)", () => {
  const parseLinks = (socialLinks: unknown) => updateSiteSettingsSchema.safeParse({ id: "s1", socialLinks });

  it("keeps all six networks", () => {
    const links = {
      twitter: "https://x.com/bella",
      facebook: "https://facebook.com/bella",
      linkedin: "https://linkedin.com/company/bella",
      instagram: "https://instagram.com/bella",
      youtube: "https://youtube.com/@bella",
      github: "https://github.com/bella",
    };
    expect(parseLinks(links).data?.socialLinks).toEqual(links);
  });

  it("normalises a Twitter handle to its link; drops cleared networks", () => {
    expect(parseLinks({ twitter: "@bella_cucina", facebook: "" }).data?.socialLinks).toEqual({ twitter: "https://x.com/bella_cucina" });
    expect(parseLinks({ twitter: "bella" }).data?.socialLinks).toEqual({ twitter: "https://x.com/bella" });
  });

  it("refuses non-https links, scripts, and unknown networks", () => {
    expect(issuePaths(parseLinks({ instagram: "javascript:alert(1)" }))).toEqual(["socialLinks.instagram"]);
    expect(issuePaths(parseLinks({ github: "http://github.com/x" }))).toEqual(["socialLinks.github"]);
    expect(parseLinks({ myspace: "https://myspace.com/x" }).success).toBe(false);
    // A handle is Twitter's alone.
    expect(issuePaths(parseLinks({ facebook: "@bella" }))).toEqual(["socialLinks.facebook"]);
  });
});
