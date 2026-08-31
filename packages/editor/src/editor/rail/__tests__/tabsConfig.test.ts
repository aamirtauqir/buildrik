import { describe, it, expect } from "vitest";
import {
  GROUPED_TABS_CONFIG,
  getTabMode,
  getTabConfig,
  getTabsByZone,
} from "../tabsConfig";
// ONE width for every panel (founder-approved 2026-07-24). These assertions
// used to hardcode 280, which is how the superseded two-width rule survived
// its own removal from DESIGN.md — the test kept the defect alive.

describe("tabsConfig helpers", () => {
  describe("getTabMode", () => {
    it("returns 'panel' for Add tab", () => {
      expect(getTabMode("add")).toBe("panel");
    });

    it("returns 'panel' for Templates tab", () => {
      expect(getTabMode("templates")).toBe("panel");
    });

    it("returns 'fullpage' for Settings tab (P5 — graduated from the 320px drawer)", () => {
      expect(getTabMode("settings")).toBe("fullpage");
    });

    it("returns 'panel' for History tab", () => {
      expect(getTabMode("history")).toBe("panel");
    });

    it("returns 'panel' for unknown tab ID (fallback)", () => {
      expect(getTabMode("nonexistent" as any)).toBe("panel");
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
      // 2026-05-22 D2: Components moved from STRUCTURE → CREATION zone
      // (library/insert surface, matches Add + Templates mental class).
      expect(ids).toContain("components");
    });

    it("returns structure zone tabs", () => {
      const tabs = getTabsByZone("structure");
      const ids = tabs.map((t) => t.id);
      expect(ids).toContain("layers");
      expect(ids).toContain("pages");
    });

    it("returns config zone tabs", () => {
      const tabs = getTabsByZone("config");
      const ids = tabs.map((t) => t.id);
      expect(ids).toContain("settings");
      expect(ids).toContain("history");
    });
  });

  describe("GROUPED_TABS_CONFIG integrity", () => {
    it("has 13 tabs defined", () => {
      // 11 + review (P0 wedge, off-rail) + content (P4.2 data front-door, off-rail)
      expect(GROUPED_TABS_CONFIG).toHaveLength(13);
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

    it("no panel-mode tab carries its own width", () => {
      // Width left tabsConfig entirely on 2026-08-31 — `.ls-panel` reads
      // `--bk-size-drawer`. See tabsConfig.width.test.ts for the real lock.
      const panelTabs = GROUPED_TABS_CONFIG.filter((t) => t.mode === "panel");
      expect(panelTabs.length).toBeGreaterThan(0);
      for (const tab of panelTabs) {
        expect((tab as unknown as Record<string, unknown>).panelWidth).toBeUndefined();
      }
    });
  });
});
