import { describe, it, expect } from "vitest";

describe("Dashboard Components", () => {
  describe("StatCard", () => {
    it("exports StatCard component", async () => {
      const mod = await import("@/components/dashboard/stat-card");
      expect(mod.StatCard).toBeDefined();
      expect(typeof mod.StatCard).toBe("function");
    });
  });

  describe("QuickActions", () => {
    it("exports QUICK_ACTION_ICONS map", async () => {
      const mod = await import("@/components/dashboard/quick-actions");
      expect(mod.QUICK_ACTION_ICONS).toBeDefined();
    });
  });

  describe("AvatarDropdown", () => {
    it("exports AVATAR_MENU_ITEMS with 5 items", async () => {
      const mod = await import("@/components/dashboard/avatar-dropdown");
      expect(mod.AVATAR_MENU_ITEMS).toHaveLength(5);
      const labels = mod.AVATAR_MENU_ITEMS.map((i: { label: string }) => i.label);
      expect(labels).toEqual(["Profile", "Settings", "Billing", "Help", "Logout"]);
    });
  });

  describe("EmptyState", () => {
    it("exports EMPTY_STATE_CONFIGS with role-based content", async () => {
      const mod = await import("@/components/dashboard/empty-state");
      expect(mod.EMPTY_STATE_CONFIGS).toBeDefined();
      expect(mod.EMPTY_STATE_CONFIGS.owner_new).toBeDefined();
      expect(mod.EMPTY_STATE_CONFIGS.owner_empty).toBeDefined();
      expect(mod.EMPTY_STATE_CONFIGS.editor).toBeDefined();
      expect(mod.EMPTY_STATE_CONFIGS.viewer).toBeDefined();
    });
  });

  describe("WorkspaceHealth", () => {
    it("exports getHealthColor function", async () => {
      const mod = await import("@/components/dashboard/workspace-health");
      expect(mod.getHealthColor).toBeDefined();
      expect(mod.getHealthColor(30)).toBe("green");
      expect(mod.getHealthColor(70)).toBe("yellow");
      expect(mod.getHealthColor(90)).toBe("red");
    });
  });

  describe("DunningBanner", () => {
    it("exports DunningBanner component", async () => {
      const mod = await import("@/components/dashboard/dunning-banner");
      expect(mod.DunningBanner).toBeDefined();
    });
  });
});
