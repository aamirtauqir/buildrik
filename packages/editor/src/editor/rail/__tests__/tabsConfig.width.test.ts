import { describe, it, expect } from "vitest";
import { GROUPED_TABS_CONFIG, getTabWidth } from "../tabsConfig";
import { SIDEBAR_WIDE } from "@/shared/constants/layout";

/**
 * Drawer-width lock.
 *
 * REWRITTEN 2026-08-03. This file used to lock the two-width rule of
 * 2026-05-22 — 280 for list/tree surfaces, 320 for browse surfaces — with a
 * hardcoded per-tab map. That rule was superseded by the founder-approved
 * convergence of 2026-07-24 ("ONE width for every panel", `SIDEBAR_WIDE` in
 * shared/constants/layout.ts) and removed from DESIGN.md's §Sidebar table, but
 * tabsConfig.ts and these assertions kept enforcing it.
 *
 * That mattered, because `panelWidth` is written as an INLINE style on the
 * panel element, so it beat `--bk-size-drawer` (320, generated from Figma)
 * every time. The Insert drawer rendered 40px narrow and clipped its own
 * search field and the right column of its card grid. Figma board 20:6 is
 * named "GATE A — does 320 hold?" and its two 320-wide panels answer yes: the
 * Media grid is 16 + 136 + 16 + 136 + 16, exactly 320, which cannot fit in 280.
 *
 * The lock is kept rather than deleted — a width rule still needs a regression
 * guard. It now locks the rule actually in force, and asserts the RESOLVED
 * width rather than a declared one, so re-introducing a local override fails.
 */
describe("tabsConfig — drawer width rule", () => {
  it("every panel tab resolves to the one canonical drawer width", () => {
    const panels = GROUPED_TABS_CONFIG.filter((t) => t.mode === "panel");
    expect(panels.length).toBeGreaterThan(0); // a vacuous loop must not pass
    for (const tab of panels) {
      expect(
        getTabWidth(tab.id),
        `tab "${tab.id}" resolves to ${getTabWidth(tab.id)} — every panel is SIDEBAR_WIDE`
      ).toBe(SIDEBAR_WIDE);
    }
  });

  it("no panel tab declares its own width — an exception must be deliberate", () => {
    // An override is allowed, but it has to be a conscious act. Silently
    // re-adding one is how the two-width rule outlived its own removal.
    for (const tab of GROUPED_TABS_CONFIG.filter((t) => t.mode === "panel")) {
      expect(
        tab.panelWidth,
        `tab "${tab.id}" declares panelWidth ${tab.panelWidth}. If that is a genuine ` +
          `exception, say why in tabsConfig.ts and update this test.`
      ).toBeUndefined();
    }
  });

  it("tracks the generated token, not a local literal", () => {
    // SIDEBAR_WIDE mirrors --bk-size-drawer, which generate.mjs emits from
    // figma-tokens.json (size/drawer). If Figma moves the drawer, this moves.
    expect(SIDEBAR_WIDE).toBe(320);
  });

  it("an unknown tab still resolves to the canonical width", () => {
    expect(getTabWidth("nonexistent" as never)).toBe(SIDEBAR_WIDE);
  });
});
