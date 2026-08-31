import { describe, it, expect } from "vitest";
import { GROUPED_TABS_CONFIG } from "../tabsConfig";

describe("tabsConfig — AI tab entry", () => {
  const ai = GROUPED_TABS_CONFIG.find((t) => t.id === "ai");

  it("registers an ai tab", () => {
    expect(ai).toBeDefined();
  });

  it("uses authoring panel mode", () => {
    // Width is no longer a tab concern at all: `.ls-panel` sizes itself from
    // `--bk-size-drawer` (2026-08-31). The drawer-width lock lives in
    // tabsConfig.width.test.ts; this file only asserts AI is a panel.
    expect(ai?.mode).toBe("panel");
  });

  it("appears in the creation rail zone", () => {
    expect(ai?.zone).toBe("creation");
  });

  it("uses sparkle icon and shortcut I", () => {
    expect(ai?.iconName).toBe("Sparkles");
    expect(ai?.shortcut).toBe("I");
  });
});
