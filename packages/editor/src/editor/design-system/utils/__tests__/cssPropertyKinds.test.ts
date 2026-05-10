import { describe, it, expect } from "vitest";
import { cssPropertyKinds, COMMON_CSS_PROPERTIES } from "../cssPropertyKinds";

describe("cssPropertyKinds", () => {
  it("color-family CSS properties → color kind", () => {
    expect(cssPropertyKinds("color")).toContain("color");
    expect(cssPropertyKinds("background-color")).toContain("color");
    expect(cssPropertyKinds("border-color")).toContain("color");
  });

  it("length-family CSS properties → spacing + sizing kinds", () => {
    expect(cssPropertyKinds("padding")).toEqual(expect.arrayContaining(["spacing", "sizing"]));
    expect(cssPropertyKinds("padding-inline")).toEqual(expect.arrayContaining(["spacing", "sizing"]));
    expect(cssPropertyKinds("margin")).toEqual(expect.arrayContaining(["spacing", "sizing"]));
    expect(cssPropertyKinds("gap")).toEqual(expect.arrayContaining(["spacing", "sizing"]));
    expect(cssPropertyKinds("height")).toEqual(expect.arrayContaining(["spacing", "sizing"]));
    expect(cssPropertyKinds("width")).toEqual(expect.arrayContaining(["spacing", "sizing"]));
  });

  it("border-radius → radius kind", () => {
    expect(cssPropertyKinds("border-radius")).toEqual(["radius"]);
  });

  it("box-shadow → shadow kind", () => {
    expect(cssPropertyKinds("box-shadow")).toEqual(["shadow"]);
  });

  it("font-size → type kind", () => {
    expect(cssPropertyKinds("font-size")).toContain("type");
  });

  it("z-index → zindex kind", () => {
    expect(cssPropertyKinds("z-index")).toEqual(["zindex"]);
  });

  it("opacity → opacity kind", () => {
    expect(cssPropertyKinds("opacity")).toEqual(["opacity"]);
  });

  it("max-width → sizing + breakpoint kinds", () => {
    expect(cssPropertyKinds("max-width")).toEqual(expect.arrayContaining(["sizing", "breakpoint"]));
  });

  it("transition-duration → motion kind", () => {
    expect(cssPropertyKinds("transition-duration")).toContain("motion");
  });

  it("border (composite) → border kind", () => {
    expect(cssPropertyKinds("border")).toContain("border");
  });

  it("unknown property → empty list (caller must whitelist)", () => {
    expect(cssPropertyKinds("nonsense-property-xyz")).toEqual([]);
  });

  it("COMMON_CSS_PROPERTIES is a usable suggestion list", () => {
    expect(COMMON_CSS_PROPERTIES.length).toBeGreaterThan(15);
    expect(COMMON_CSS_PROPERTIES).toContain("background-color");
    expect(COMMON_CSS_PROPERTIES).toContain("border-radius");
    // Every entry must resolve via cssPropertyKinds (no orphans).
    for (const p of COMMON_CSS_PROPERTIES) {
      expect(cssPropertyKinds(p).length, `"${p}" routes to no kind`).toBeGreaterThan(0);
    }
  });
});
