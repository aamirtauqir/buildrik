import { describe, it, expect } from "vitest";
import {
  GROUPED_TABS_CONFIG,
  RAIL_FIGMA,
  RAIL_FIGMA_IDS,
  getFigmaRailGroups,
} from "../tabsConfig";

/**
 * Figma-contract rail (F1) lock. The 02 · Editor design supersedes the E3 4-tool
 * rail: five rail tools in two zones, everything else off-rail. This test guards
 * the "re-route, never delete" rule — the six off-rail panels must still exist in
 * GROUPED_TABS_CONFIG (their engine + panel are intact; only the rail button is
 * gone), and the rail must be exactly the five contract tools in order.
 */
describe("tabsConfig — Figma rail", () => {
  it("rail is exactly Add · Assets · Components · Layers · Pages, in order", () => {
    const ordered = getFigmaRailGroups().flatMap((g) => g.tabs.map((t) => t.id));
    expect(ordered).toEqual(["add", "assets", "components", "layers", "pages"]);
  });

  it("groups creation (Add/Assets/Components) then structure (Layers/Pages)", () => {
    const groups = getFigmaRailGroups();
    expect(groups.map((g) => g.zone)).toEqual(["creation", "structure"]);
    expect(groups[0].tabs.map((t) => t.id)).toEqual(["add", "assets", "components"]);
    expect(groups[1].tabs.map((t) => t.id)).toEqual(["layers", "pages"]);
  });

  it("every rail id resolves to a real tab config (no typos, no crashes)", () => {
    for (const id of RAIL_FIGMA_IDS) {
      expect(GROUPED_TABS_CONFIG.find((t) => t.id === id), `rail id "${id}" missing`).toBeTruthy();
    }
    // RAIL_FIGMA declares 5 ids; getFigmaRailGroups resolved all 5 (none dropped)
    expect(RAIL_FIGMA.flatMap((g) => g.ids)).toHaveLength(5);
    expect(getFigmaRailGroups().flatMap((g) => g.tabs)).toHaveLength(5);
  });

  it("the off-rail panels still exist in config (re-route, never delete)", () => {
    // +review: the P0 wedge loop, an agency-gated surface below a divider (§6.5)
    const offRail = ["ai", "templates", "design", "settings", "publish", "history", "review"] as const;
    for (const id of offRail) {
      expect(RAIL_FIGMA_IDS.has(id), `"${id}" must NOT be in the rail`).toBe(false);
      expect(
        GROUPED_TABS_CONFIG.find((t) => t.id === id),
        `"${id}" panel must still exist off-rail`,
      ).toBeTruthy();
    }
  });

  it("rail + off-rail partition every tab (nothing stranded, nothing invented)", () => {
    const offRail = ["ai", "templates", "design", "settings", "publish", "history", "review"];
    const all = GROUPED_TABS_CONFIG.map((t) => t.id).sort();
    const accounted = [...RAIL_FIGMA_IDS, ...offRail].sort();
    expect(accounted).toEqual(all);
  });
});
