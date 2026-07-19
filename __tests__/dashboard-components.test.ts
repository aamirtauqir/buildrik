import { describe, it, expect } from "vitest";

describe("Dashboard Components", () => {
  describe("StatCard", () => {
    it("exports StatCard component", async () => {
      const mod = await import("@/components/dashboard/primitives/stat-card");
      expect(mod.StatCard).toBeDefined();
      expect(typeof mod.StatCard).toBe("function");
    });
  });

  describe("QuickActions", () => {
    // Was asserting a QUICK_ACTION_ICONS map. The component was rewritten and no
    // longer exports one; only the component itself is public now.
    it("exports QuickActions component", async () => {
      const mod = await import("@/components/dashboard/quick-actions");
      expect(mod.QuickActions).toBeDefined();
      expect(typeof mod.QuickActions).toBe("function");
    });
  });

  describe("AvatarDropdown", () => {
    // Profile entry removed — Settings doubles as the profile page.
    // Update + alignment confirmed against the canonical export.
    it("exports AVATAR_MENU_ITEMS with 4 items (no separate Profile entry)", async () => {
      const mod = await import("@/components/dashboard/avatar-dropdown");
      expect(mod.AVATAR_MENU_ITEMS).toHaveLength(4);
      const labels = mod.AVATAR_MENU_ITEMS.map((i: { label: string }) => i.label);
      expect(labels).toEqual(["Settings", "Billing", "Help", "Logout"]);
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
    it("exports WorkspaceHealth component", async () => {
      const mod = await import("@/components/dashboard/workspace-health");
      expect(mod.WorkspaceHealth).toBeDefined();
    });
  });

  describe("DunningBanner", () => {
    it("exports DunningBanner component", async () => {
      const mod = await import("@/components/dashboard/dunning-banner");
      expect(mod.DunningBanner).toBeDefined();
    });
  });
});
