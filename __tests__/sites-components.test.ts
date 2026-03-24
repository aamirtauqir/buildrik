import { describe, it, expect } from "vitest";

describe("Sites Components", () => {
  describe("ViewToggle", () => {
    it("exports VIEW_MODES with grid and list", async () => {
      const mod = await import("@/components/sites/view-toggle");
      expect(mod.VIEW_MODES).toHaveLength(2);
      expect(mod.VIEW_MODES[0].value).toBe("grid");
      expect(mod.VIEW_MODES[1].value).toBe("list");
    });
  });

  describe("SiteFilters", () => {
    it("exports SORT_OPTIONS with 6 options", async () => {
      const mod = await import("@/components/sites/site-filters");
      expect(mod.SORT_OPTIONS).toHaveLength(6);
      const values = mod.SORT_OPTIONS.map((o: { value: string }) => o.value);
      expect(values).toContain("lastEdited");
      expect(values).toContain("name");
      expect(values).toContain("created");
    });

    it("exports STATUS_FILTER_OPTIONS with 3 statuses", async () => {
      const mod = await import("@/components/sites/site-filters");
      expect(mod.STATUS_FILTER_OPTIONS).toHaveLength(3);
    });
  });

  describe("BulkActionBar", () => {
    it("exports BULK_ACTIONS with 6 actions", async () => {
      const mod = await import("@/components/sites/bulk-action-bar");
      expect(mod.BULK_ACTIONS).toHaveLength(6);
      const labels = mod.BULK_ACTIONS.map((a: { label: string }) => a.label);
      expect(labels).toContain("Publish All");
      expect(labels).toContain("Delete All");
      expect(labels).toContain("Archive All");
    });
  });

  describe("ContextMenu", () => {
    it("exports CONTEXT_MENU_ITEMS with 11 items", async () => {
      const mod = await import("@/components/sites/context-menu");
      expect(mod.CONTEXT_MENU_ITEMS).toHaveLength(11);
      const labels = mod.CONTEXT_MENU_ITEMS.map((i: { label: string }) => i.label);
      expect(labels).toContain("Edit");
      expect(labels).toContain("Manage");
      expect(labels).toContain("Rename");
      expect(labels).toContain("Duplicate");
      expect(labels).toContain("Delete");
    });
  });

  describe("CreateSiteModal", () => {
    it("exports CreateSiteModal component", async () => {
      const mod = await import("@/components/sites/create-site-modal");
      expect(mod.CreateSiteModal).toBeDefined();
    });
  });

  describe("FolderTabs", () => {
    it("exports FolderTabs component", async () => {
      const mod = await import("@/components/sites/folder-tabs");
      expect(mod.FolderTabs).toBeDefined();
    });
  });
});
