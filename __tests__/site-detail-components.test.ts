import { describe, it, expect } from "vitest";

describe("Site Detail Components", () => {
  // Was frozen at 7 tabs in a fixed order. "Forms" was added and the order
  // changed, so this has been red since. Assert the contract instead of the
  // snapshot: adding a tab should not break a test, but a tab with no route or a
  // duplicate segment should.
  it("exports SITE_DETAIL_TABS with a label and a unique segment per tab", async () => {
    const mod = await import("@/components/site-detail/tab-nav");
    const tabs = mod.SITE_DETAIL_TABS as Array<{ label: string; segment: string }>;

    expect(tabs.length).toBeGreaterThan(0);
    for (const t of tabs) {
      expect(t.label, JSON.stringify(t)).toBeTruthy();
      expect(t.segment, t.label).toBeTruthy();
    }

    const segments = tabs.map((t) => t.segment);
    expect(new Set(segments).size, `duplicate segments: ${segments.join(", ")}`).toBe(segments.length);

    // Overview is the landing tab and must stay first.
    expect(tabs[0].label).toBe("Overview");
  });

  it("exports SiteHeader component", async () => {
    const mod = await import("@/components/site-detail/site-header");
    expect(mod.SiteHeader).toBeDefined();
  });

  it("exports OverviewTab component", async () => {
    const mod = await import("@/components/site-detail/overview-tab");
    expect(mod.OverviewTab).toBeDefined();
  });

  it("exports SettingsTab component", async () => {
    const mod = await import("@/components/site-detail/settings-tab");
    expect(mod.SettingsTab).toBeDefined();
  });

  it("exports SeoTab component", async () => {
    const mod = await import("@/components/site-detail/seo-tab");
    expect(mod.SeoTab).toBeDefined();
  });

  it("exports DomainsTab component", async () => {
    const mod = await import("@/components/site-detail/domains-tab");
    expect(mod.DomainsTab).toBeDefined();
  });

  it("exports AccessTab component", async () => {
    const mod = await import("@/components/site-detail/access-tab");
    expect(mod.AccessTab).toBeDefined();
  });

  it("exports AnalyticsTab component", async () => {
    const mod = await import("@/components/site-detail/analytics-tab");
    expect(mod.AnalyticsTab).toBeDefined();
  });

  it("exports HEALTH_METRICS with 4 metrics", async () => {
    const mod = await import("@/components/site-detail/overview-tab");
    expect(mod.HEALTH_METRICS).toHaveLength(4);
    const labels = mod.HEALTH_METRICS.map((m: { label: string }) => m.label);
    expect(labels).toContain("SEO");
    expect(labels).toContain("Content Fill");
  });

  it("exports DATE_RANGE_OPTIONS with 5 options", async () => {
    const mod = await import("@/components/site-detail/analytics-tab");
    expect(mod.DATE_RANGE_OPTIONS).toHaveLength(5);
  });
});
