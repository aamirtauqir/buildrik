import { describe, it, expect } from "vitest";

describe("Site Detail Components", () => {
  it("exports SITE_DETAIL_TABS with 6 tabs", async () => {
    const mod = await import("@/components/site-detail/tab-nav");
    expect(mod.SITE_DETAIL_TABS).toHaveLength(6);
    const labels = mod.SITE_DETAIL_TABS.map((t: { label: string }) => t.label);
    expect(labels).toEqual(["Overview", "Settings", "SEO", "Domains", "Access", "Analytics"]);
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
