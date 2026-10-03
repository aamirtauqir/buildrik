/**
 * Settings Phase B, BE-1 — `projectSettingsPatchSchema`: the three JSON-only
 * keys and nothing else; injection-shaped analytics ids refused at their path,
 * legacy-shaped safe ids accepted (and flagged by `legacyAnalyticsIds`).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { legacyAnalyticsIds, projectSettingsPatchSchema, updateProjectSettingsSchema } from "../project-settings";

const issuePaths = (result: { success: boolean; error?: { issues: Array<{ path: Array<string | number> }> } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((i) => i.path.join("."));

describe("projectSettingsPatchSchema (BE-1)", () => {
  it("accepts the three JSON-only keys", () => {
    const patch = {
      analytics: {
        googleAnalytics: { enabled: true, measurementId: "G-ABCD123456", verifiedAt: "2026-09-01T00:00:00.000Z" },
        cookieConsent: { enabled: false },
      },
      customCode: { globalCss: "body { margin: 0 }" },
      redirects: { suggestFrom404s: false },
    };
    expect(projectSettingsPatchSchema.parse(patch)).toEqual(patch);
  });

  it("refuses any other key — this path writes analytics, global CSS, the 404 switch and seo.author only", () => {
    const seo = projectSettingsPatchSchema.safeParse({ seo: { author: "Ada", metaTitle: "x" } });
    expect(seo.success).toBe(false);
    expect(seo.error?.issues[0]).toMatchObject({ code: "unrecognized_keys", keys: ["metaTitle"], path: ["seo"] });
    expect(projectSettingsPatchSchema.safeParse({ menus: [] }).success).toBe(false);
    expect(projectSettingsPatchSchema.safeParse({ designTokens: [] }).success).toBe(false);
    expect(projectSettingsPatchSchema.safeParse({}).success).toBe(false);
  });

  it("refuses an injection-shaped id at the id's own path", () => {
    const result = updateProjectSettingsSchema.safeParse({
      siteId: "s1",
      patch: { analytics: { googleAnalytics: { enabled: true, measurementId: "G-1');alert(1)//" } } },
    });
    expect(issuePaths(result)).toEqual(["patch.analytics.googleAnalytics.measurementId"]);
  });

  it("accepts a safe id of an older shape, and flags it as legacy", () => {
    const analytics = { googleTagManager: { enabled: true, containerId: "GTM-AB" }, microsoftClarity: { enabled: true, projectId: "abcdefghij" } };
    expect(projectSettingsPatchSchema.safeParse({ analytics }).success).toBe(true);
    expect(legacyAnalyticsIds(analytics)).toEqual(["googleTagManager"]);
    expect(legacyAnalyticsIds({ googleAnalytics: { enabled: false, measurementId: "" } })).toEqual([]);
  });

  it("takes General's Author as seo.author, trimmed and capped like the site name", () => {
    expect(projectSettingsPatchSchema.parse({ seo: { author: "  Elena Rossi " } })).toEqual({ seo: { author: "Elena Rossi" } });
    expect(projectSettingsPatchSchema.safeParse({ seo: { author: "" } }).success).toBe(true);
    expect(issuePaths(projectSettingsPatchSchema.safeParse({ seo: { author: "a".repeat(101) } }))).toEqual(["seo.author"]);
  });

  it("caps global CSS at the head/body limit", () => {
    expect(projectSettingsPatchSchema.safeParse({ customCode: { globalCss: "a".repeat(10240) } }).success).toBe(true);
    expect(issuePaths(projectSettingsPatchSchema.safeParse({ customCode: { globalCss: "a".repeat(10241) } }))).toEqual([
      "customCode.globalCss",
    ]);
  });
});
