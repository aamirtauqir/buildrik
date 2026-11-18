/** assign-tiers.mjs: the owner's 2026-10-27 priority order for boards-2l9.json. */
import { describe, it, expect } from "vitest";
import { tierOf } from "../design-2l9/assign-tiers.mjs";

describe("tierOf", () => {
  it("puts every-day editing first", () => {
    expect(tierOf({ family: "shell-components", name: "Shell/Topbar" })).toBe("P1");
    expect(tierOf({ family: "editor", name: "B3-P12 · Pages / manager" })).toBe("P1");
    expect(tierOf({ family: "site-delivery", name: "B8-PB01 · Publish tray" })).toBe("P1");
    expect(tierOf({ family: "cms", name: "B5-D03 · Binding detail" })).toBe("P1");
  });
  it("pushes guides, trash, state grids and the approval code to P3", () => {
    expect(tierOf({ family: "editor", name: "B3-C21 · Ruler guide locked" })).toBe("P3");
    expect(tierOf({ family: "editor", name: "Return · Pages / About deleted, Work kept" })).toBe("P3");
    expect(tierOf({ family: "site-delivery", name: "GAP-FMC12 · Submissions bulk" })).toBe("P3");
    expect(tierOf({ family: "play", name: "PLAY · F5.24 Approval code" })).toBe("P3");
    expect(tierOf({ family: "inspector", name: "CF12 · Class combo" })).toBe("P3");
  });
  it("keeps the rest of the product in P2", () => {
    expect(tierOf({ family: "brand", name: "B6-B01 · Colors" })).toBe("P2");
    expect(tierOf({ family: "editor", name: "B3-N02 · Command palette" })).toBe("P2");
    expect(tierOf({ family: "site-delivery", name: "B8-S01 · Overview" })).toBe("P2");
  });
});
