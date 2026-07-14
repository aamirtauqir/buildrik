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
    it("exports BULK_ACTIONS without the fake publish/unpublish flips or dead Export", async () => {
      const mod = await import("@/components/sites/bulk-action-bar");
      expect(mod.BULK_ACTIONS).toHaveLength(3);
      const labels = mod.BULK_ACTIONS.map((a: { label: string }) => a.label);
      // Removed — publish/unpublish only flipped status; Export had no backend.
      expect(labels).not.toContain("Publish All");
      expect(labels).not.toContain("Unpublish All");
      expect(labels).not.toContain("Export All");
      // Renamed "… All" → "… selected" (the bar acts on the selection, not on
      // every site — the old wording invited exactly the accident it describes).
      expect(labels).toContain("Delete selected");
      expect(labels).toContain("Archive selected");
      expect(labels).toContain("Move to Folder");
    });
  });

  describe("ContextMenu", () => {
    it("exports CONTEXT_MENU_ITEMS without dead Move-to-Folder / Export items", async () => {
      const mod = await import("@/components/sites/context-menu");
      expect(mod.CONTEXT_MENU_ITEMS).toHaveLength(9);
      const labels = mod.CONTEXT_MENU_ITEMS.map((i: { label: string }) => i.label);
      expect(labels).toContain("Edit");
      expect(labels).toContain("Manage");
      expect(labels).toContain("Rename");
      expect(labels).toContain("Duplicate");
      expect(labels).toContain("Delete");
      // Removed: no handler / no export backend.
      expect(labels).not.toContain("Move to Folder");
      expect(labels).not.toContain("Export Site");
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
