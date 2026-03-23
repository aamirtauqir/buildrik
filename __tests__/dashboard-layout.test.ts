import { describe, it, expect } from "vitest";

describe("Sidebar Navigation", () => {
  it("SIDEBAR_NAV_ITEMS has exactly 5 items", async () => {
    const { SIDEBAR_NAV_ITEMS } = await import("@/components/dashboard/sidebar");
    expect(SIDEBAR_NAV_ITEMS).toHaveLength(5);
  });
  it("nav items match PRD Section 3.1", async () => {
    const { SIDEBAR_NAV_ITEMS } = await import("@/components/dashboard/sidebar");
    const labels = SIDEBAR_NAV_ITEMS.map((item: { label: string }) => item.label);
    expect(labels).toEqual(["Dashboard", "My Sites", "Team", "Billing", "Settings"]);
  });
  it("nav items have correct href paths", async () => {
    const { SIDEBAR_NAV_ITEMS } = await import("@/components/dashboard/sidebar");
    const hrefs = SIDEBAR_NAV_ITEMS.map((item: { href: string }) => item.href);
    expect(hrefs).toEqual(["/dashboard", "/dashboard/sites", "/dashboard/team", "/dashboard/billing", "/dashboard/settings"]);
  });
  it("each nav item has an icon name", async () => {
    const { SIDEBAR_NAV_ITEMS } = await import("@/components/dashboard/sidebar");
    for (const item of SIDEBAR_NAV_ITEMS) {
      expect(item.icon).toBeDefined();
      expect(typeof item.icon).toBe("string");
    }
  });
});
