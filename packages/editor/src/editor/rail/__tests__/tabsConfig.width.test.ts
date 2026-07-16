import { describe, it, expect } from "vitest";
import { GROUPED_TABS_CONFIG } from "../tabsConfig";

/**
 * Width-rule lock (gap-fill). The 2026-05-22 width rule (tabsConfig.ts,
 * GroupedTabConfig.panelWidth doc) allows exactly two drawer widths:
 *   280 → list/tree surfaces, 320 → browse/canvas-rich surfaces.
 * Existing suites assert widths for a handful of tabs (add/layers/pages/
 * components = 280, ai = 320) but never the universal invariant, and never
 * the six remaining tabs (templates/assets/design/settings/publish/history).
 * The 700px Settings outlier is the historical reason this rule exists —
 * this test is the regression guard for it.
 */
describe("tabsConfig — drawer width rule", () => {
  it("every panel tab's width is 280 or 320 — no other value allowed", () => {
    for (const tab of GROUPED_TABS_CONFIG.filter((t) => t.mode === "panel")) {
      expect(
        [280, 320],
        `tab "${tab.id}" has panelWidth ${tab.panelWidth} — must be 280 or 320`
      ).toContain(tab.panelWidth);
    }
  });

  it("assigns 280 to list/tree surfaces and 320 to browse surfaces, per tab", () => {
    const widths = Object.fromEntries(
      GROUPED_TABS_CONFIG.map((t) => [t.id, t.panelWidth])
    );
    expect(widths).toEqual({
      add: 280,
      layers: 280,
      pages: 280,
      components: 280,
      publish: 280,
      history: 280,
      ai: 320,
      templates: 320,
      assets: 320,
      design: 320,
      settings: 320, // normalized from the 700px outlier 2026-05-22 (D1)
    });
  });
});
