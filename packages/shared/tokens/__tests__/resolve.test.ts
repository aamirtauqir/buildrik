import { describe, it, expect } from "vitest";
import { setTokenLiteral, resolveTokenLiteral, lightAliasOf } from "../resolve";
import type { DesignToken } from "../../schemas/design-tokens";

const p: DesignToken = { id: "b", name: "b", kind: "color", layer: "primitive", modes: { light: { value: "#000" } }, category: "colors", cssVar: "--buildrick-design-b", type: "color" };
const s1: DesignToken = { ...p, id: "s1", layer: "semantic", cssVar: "--buildrick-design-s1", modes: { light: { alias: "b" } } };
const s2: DesignToken = { ...s1, id: "s2", cssVar: "--buildrick-design-s2" };

describe("setTokenLiteral", () => {
  it("changing one semantic token does not repaint its alias siblings", () => {
    const out = setTokenLiteral([p, s1, s2], "s1", "light", "#FFF");
    expect(resolveTokenLiteral(out, "s1", "light")).toBe("#FFF");
    expect(resolveTokenLiteral(out, "s2", "light")).toBe("#000");
  });
  it("writes a primitive's single literal", () => {
    expect(resolveTokenLiteral(setTokenLiteral([p], "b", "light", "#123"), "b", "light")).toBe("#123");
  });
  it("a dark write never overwrites a primitive's light literal", () => {
    expect(resolveTokenLiteral(setTokenLiteral([p], "b", "dark", "#123"), "b", "light")).toBe("#000");
  });
  it("writes a semantic token's dark literal and leaves its light alias", () => {
    const out = setTokenLiteral([p, s1], "s1", "dark", "#FFF");
    expect(resolveTokenLiteral(out, "s1", "dark")).toBe("#FFF");
    expect(resolveTokenLiteral(out, "s1", "light")).toBe("#000");
  });
});

describe("lightAliasOf", () => {
  it("names the light alias, or nothing for a literal", () => {
    expect(lightAliasOf(s1)).toBe("b");
    expect(lightAliasOf(p)).toBeUndefined();
  });
});
