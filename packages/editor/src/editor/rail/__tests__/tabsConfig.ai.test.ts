import { describe, it, expect } from "vitest";
import { GROUPED_TABS_CONFIG } from "../tabsConfig";

describe("tabsConfig — AI tab entry", () => {
  const ai = GROUPED_TABS_CONFIG.find((t) => t.id === "ai");

  it("registers an ai tab", () => {
    expect(ai).toBeDefined();
  });

  it("uses authoring panel mode and 320px width", () => {
    expect(ai?.mode).toBe("panel");
    expect(ai?.panelWidth).toBe(320);
  });

  it("appears in the creation rail zone", () => {
    expect(ai?.zone).toBe("creation");
  });

  it("uses sparkle icon and shortcut I", () => {
    expect(ai?.iconName).toBe("Sparkles");
    expect(ai?.shortcut).toBe("I");
  });
});
