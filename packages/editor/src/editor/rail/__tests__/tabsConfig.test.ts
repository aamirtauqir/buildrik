import { describe, it, expect } from "vitest";
import {
  GROUPED_TABS_CONFIG,
  getTabMode,
  getTabWidth,
  getTabConfig,
  getTabsByZone,
} from "../tabsConfig";

describe("tabsConfig helpers", () => {
  describe("getTabMode", () => {
    it("returns 'panel' for Add tab", () => {
      expect(getTabMode("add")).toBe("panel");
    });

    it("returns 'panel' for Templates tab", () => {
      expect(getTabMode("templates")).toBe("panel");
    });

    it("returns 'panel' for Settings tab", () => {
      expect(getTabMode("settings")).toBe("panel");
    });

    it("returns 'panel' for History tab", () => {
      expect(getTabMode("history")).toBe("panel");
    });

    it("returns 'panel' for unknown tab ID (fallback)", () => {
      expect(getTabMode("nonexistent" as any)).toBe("panel");
    });
  });

  describe("getTabWidth", () => {
    it("returns 280 for Add tab", () => {
      expect(getTabWidth("add")).toBe(280);
    });

    it("returns 280 for Layers tab", () => {
      expect(getTabWidth("layers")).toBe(280);
    });

    it("returns 280 for Pages tab", () => {
      expect(getTabWidth("pages")).toBe(280);
    });

    it("returns 280 for Components tab", () => {
      expect(getTabWidth("components")).toBe(280);
    });

    it("returns 280 for unknown tab (default)", () => {
      expect(getTabWidth("nonexistent" as any)).toBe(280);
    });
  });

  describe("getTabConfig", () => {
    it("returns config for a valid tab", () => {
      const config = getTabConfig("add");
      expect(config).toBeDefined();
      expect(config!.id).toBe("add");
      expect(config!.zone).toBe("creation");
    });

    it("returns undefined for invalid tab", () => {
      expect(getTabConfig("nonexistent" as any)).toBeUndefined();
    });
  });

  describe("getTabsByZone", () => {
    it("returns creation zone tabs", () => {
      const tabs = getTabsByZone("creation");
      const ids = tabs.map((t) => t.id);
      expect(ids).toContain("add");
      expect(ids).toContain("templates");
      expect(ids).toContain("assets");
    });

    it("returns structure zone tabs", () => {
      const tabs = getTabsByZone("structure");
      const ids = tabs.map((t) => t.id);
      expect(ids).toContain("layers");
      expect(ids).toContain("pages");
      expect(ids).toContain("components");
    });

    it("returns config zone tabs", () => {
      const tabs = getTabsByZone("config");
      const ids = tabs.map((t) => t.id);
      expect(ids).toContain("settings");
      expect(ids).toContain("history");
    });
  });

  describe("GROUPED_TABS_CONFIG integrity", () => {
    it("has 11 tabs defined", () => {
      expect(GROUPED_TABS_CONFIG).toHaveLength(11);
    });

    it("every tab has required fields", () => {
      for (const tab of GROUPED_TABS_CONFIG) {
        expect(tab.id).toBeTruthy();
        expect(tab.iconName).toBeTruthy();
        expect(tab.label).toBeTruthy();
        expect(tab.ariaLabel).toBeTruthy();
        expect(["top", "bottom"]).toContain(tab.section);
        expect(["panel", "fullpage"]).toContain(tab.mode);
      }
    });

    it("panel-mode tabs have panelWidth defined", () => {
      const panelTabs = GROUPED_TABS_CONFIG.filter((t) => t.mode === "panel");
      for (const tab of panelTabs) {
        expect(tab.panelWidth).toBeDefined();
        expect(tab.panelWidth).toBeGreaterThan(0);
      }
    });
  });
});
