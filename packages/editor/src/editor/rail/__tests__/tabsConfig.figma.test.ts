import { describe, it, expect } from "vitest";
import {
  GROUPED_TABS_CONFIG,
  RAIL_FIGMA,
  RAIL_FIGMA_IDS,
  getFigmaRailGroups,
  getTabConfig,
} from "../tabsConfig";

/**
 * Figma-contract rail lock — P1 convergence 2026-07-25.
 *
 * Source of truth: board `S1 · Editor — ASSEMBLED` (g4GzQFqzNYz5sosz1QtZXC
 * node 52:2, rail frame 52:6): SIX rail items in ONE group, no divider,
 * in order Insert · Layers · Pages · Media · Content · Brand.
 *
 * This test guards the "re-route, never delete" rule — the off-rail panels
 * must still exist in GROUPED_TABS_CONFIG (their engine + panel are intact;
 * only the rail button is gone), and the rail must be exactly the six
 * contract items in board order.
 */
describe("tabsConfig — Figma rail", () => {
  it("rail is exactly Insert · Layers · Pages · Media · Content · Brand, in order", () => {
    const ordered = getFigmaRailGroups().flatMap((g) => g.tabs.map((t) => t.id));
    expect(ordered).toEqual(["add", "layers", "pages", "assets", "content", "design"]);
  });

  it("rail labels match the board (52:6 item names)", () => {
    const labels = getFigmaRailGroups().flatMap((g) => g.tabs.map((t) => t.label));
    expect(labels).toEqual(["Insert", "Layers", "Pages", "Media", "Content", "Brand"]);
  });

  it("renders as ONE group — the board draws no divider", () => {
    expect(getFigmaRailGroups()).toHaveLength(1);
  });

  it("every rail id resolves to a real tab config (no typos, no crashes)", () => {
    for (const id of RAIL_FIGMA_IDS) {
      expect(GROUPED_TABS_CONFIG.find((t) => t.id === id), `rail id "${id}" missing`).toBeTruthy();
    }
    expect(RAIL_FIGMA.flatMap((g) => g.ids)).toHaveLength(6);
    expect(getFigmaRailGroups().flatMap((g) => g.tabs)).toHaveLength(6);
  });

  it("the off-rail panels still exist in config (re-route, never delete)", () => {
    const offRail = ["ai", "templates", "components", "settings", "publish", "history", "review"] as const;
    for (const id of offRail) {
      expect(RAIL_FIGMA_IDS.has(id), `"${id}" must NOT be in the rail`).toBe(false);
      expect(
        GROUPED_TABS_CONFIG.find((t) => t.id === id),
        `"${id}" panel must still exist off-rail`,
      ).toBeTruthy();
    }
  });

  it("rail + off-rail partition every tab (nothing stranded, nothing invented)", () => {
    const offRail = ["ai", "templates", "components", "settings", "publish", "history", "review"];
    const all = GROUPED_TABS_CONFIG.map((t) => t.id).sort();
    const accounted = [...RAIL_FIGMA_IDS, ...offRail].sort();
    expect(accounted).toEqual(all);
  });

  it("every off-rail panel keeps a keyboard shortcut (⌘K nav commands derive from config)", () => {
    // Off-rail reachability contract: ⌘K lists "Open {label} panel" for every
    // tab in GROUPED_TABS_CONFIG, and each off-rail tab keeps its shortcut.
    for (const id of ["ai", "templates", "components", "settings", "publish", "history", "review"] as const) {
      expect(getTabConfig(id)?.shortcut, `"${id}" must keep its shortcut`).toBeTruthy();
    }
  });
});
