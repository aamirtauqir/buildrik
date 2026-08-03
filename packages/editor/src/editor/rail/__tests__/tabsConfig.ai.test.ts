import { describe, it, expect } from "vitest";
import { GROUPED_TABS_CONFIG, getTabWidth } from "../tabsConfig";
import { SIDEBAR_WIDE } from "@/shared/constants/layout";

describe("tabsConfig — AI tab entry", () => {
  const ai = GROUPED_TABS_CONFIG.find((t) => t.id === "ai");

  it("registers an ai tab", () => {
    expect(ai).toBeDefined();
  });

  it("uses authoring panel mode at the canonical drawer width", () => {
    // Was `expect(ai?.panelWidth).toBe(320)`. The tab no longer declares its
    // own width — every panel inherits SIDEBAR_WIDE since the 2026-07-24
    // convergence. Asserting the RESOLVED width keeps the guarantee without
    // requiring a redundant local declaration.
    expect(ai?.mode).toBe("panel");
    expect(getTabWidth("ai")).toBe(SIDEBAR_WIDE);
  });

  it("appears in the creation rail zone", () => {
    expect(ai?.zone).toBe("creation");
  });

  it("uses sparkle icon and shortcut I", () => {
    expect(ai?.iconName).toBe("Sparkles");
    expect(ai?.shortcut).toBe("I");
  });
});
