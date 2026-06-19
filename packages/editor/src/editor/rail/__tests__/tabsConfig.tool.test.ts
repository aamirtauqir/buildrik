import { describe, it, expect } from "vitest";
import {
  GROUPED_TABS_CONFIG,
  RAIL_TOOLS,
  getTabsByTool,
  type RailTool,
} from "../tabsConfig";

/**
 * E3 IA mapping lock. The 11 panel tabs collapse to 4 rail tools + 2 non-rail
 * homes (assistant ✨, structure ⌗). This test is the guard for "map every tab to
 * its new home first; re-route UI, never delete engine features" — if a tab loses
 * its home or a new tab lands without one, the rail rebuild would silently drop a
 * capability. It locks the map BEFORE any rail surgery.
 */
describe("tabsConfig — E3 tool mapping", () => {
  it("every panel tab declares a tool (no orphan = no dropped feature)", () => {
    for (const tab of GROUPED_TABS_CONFIG) {
      expect(tab.tool, `tab "${tab.id}" has no tool home`).toBeTruthy();
    }
  });

  it("maps all 11 tabs exactly as designed", () => {
    const map = Object.fromEntries(GROUPED_TABS_CONFIG.map((t) => [t.id, t.tool]));
    expect(map).toEqual({
      add: "insert",
      templates: "insert",
      components: "insert",
      assets: "insert",
      pages: "pages",
      design: "styles",
      settings: "site",
      publish: "site",
      history: "site",
      ai: "assistant",
      layers: "structure",
    });
  });

  it("the 4 rail tools are insert/pages/styles/site, each non-empty", () => {
    expect(RAIL_TOOLS).toEqual(["insert", "pages", "styles", "site"]);
    for (const tool of RAIL_TOOLS) {
      expect(getTabsByTool(tool).length, `rail tool "${tool}" is empty`).toBeGreaterThan(0);
    }
  });

  it("AI and structure leave the rail (topbar ✨ / footer ⌗), nothing else does", () => {
    const offRail = GROUPED_TABS_CONFIG.filter(
      (t) => !(RAIL_TOOLS as readonly RailTool[]).includes(t.tool),
    ).map((t) => t.id);
    expect(offRail.sort()).toEqual(["ai", "layers"]);
  });

  it("Insert folds the four creation surfaces", () => {
    expect(getTabsByTool("insert").map((t) => t.id).sort()).toEqual([
      "add",
      "assets",
      "components",
      "templates",
    ]);
  });
});
