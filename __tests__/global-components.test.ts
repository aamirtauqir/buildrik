import { describe, it, expect } from "vitest";

describe("Global Components", () => {
  it("exports OfflineBanner component", async () => {
    const mod = await import("@/components/global/offline-banner");
    expect(mod.OfflineBanner).toBeDefined();
  });

  it("exports COOKIE_CATEGORIES with 2 categories", async () => {
    const mod = await import("@/components/global/cookie-consent");
    expect(mod.COOKIE_CATEGORIES).toHaveLength(2);
    expect(mod.COOKIE_CATEGORIES[0].key).toBe("essential");
    expect(mod.COOKIE_CATEGORIES[1].key).toBe("analytics");
  });

  it("exports CookieConsent component", async () => {
    const mod = await import("@/components/global/cookie-consent");
    expect(mod.CookieConsent).toBeDefined();
  });

  it("exports CONSENT_OPTIONS with 3 options", async () => {
    const mod = await import("@/components/global/cookie-consent");
    expect(mod.CONSENT_OPTIONS).toHaveLength(3);
  });

  it("exports GlobalProviders component", async () => {
    const mod = await import("@/components/global/global-providers");
    expect(mod.GlobalProviders).toBeDefined();
  });
});
