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
  it("a semantic edit keeps the alias form: it gets its own custom primitive", () => {
    const out = setTokenLiteral([p, s1, s2], "s1", "light", "#FFF");
    expect(out.find((t) => t.id === "s1")!.modes.light).toEqual({ alias: "custom-s1" });
    const own = out.find((t) => t.id === "custom-s1")!;
    expect(own).toMatchObject({ layer: "primitive", cssVar: "--buildrick-design-custom-s1", modes: { light: { value: "#FFF" } } });
    expect(out.find((t) => t.id === "s2")).toEqual(s2);
    expect(out.find((t) => t.id === "b")).toEqual(p);
  });
  it("a semantic that is its primitive's only aliaser writes that primitive", () => {
    const out = setTokenLiteral([p, s1], "s1", "light", "#FFF");
    expect(out.find((t) => t.id === "s1")!.modes.light).toEqual({ alias: "b" });
    expect(out.find((t) => t.id === "b")!.modes.light).toEqual({ value: "#FFF" });
    expect(out).toHaveLength(2);
  });
  it("reuses the semantic's own custom primitive on a second edit", () => {
    const once = setTokenLiteral([p, s1, s2], "s1", "light", "#FFF");
    const twice = setTokenLiteral(once, "s1", "light", "#EEE");
    expect(twice).toHaveLength(once.length);
    expect(resolveTokenLiteral(twice, "s1", "light")).toBe("#EEE");
  });
  it("a semantic holding a literal is moved onto a custom primitive", () => {
    const lit: DesignToken = { ...s1, modes: { light: { value: "#111" } } };
    const out = setTokenLiteral([lit], "s1", "light", "#222");
    expect(out.find((t) => t.id === "s1")!.modes.light).toEqual({ alias: "custom-s1" });
    expect(resolveTokenLiteral(out, "s1", "light")).toBe("#222");
  });
  it("a new id never collides with an existing id or css var", () => {
    const taken: DesignToken = { ...p, id: "custom-s1", cssVar: "--buildrick-design-custom-s1" };
    const takenAliaser: DesignToken = { ...s2, id: "s3", cssVar: "--buildrick-design-s3", modes: { light: { alias: "custom-s1" } } };
    const out = setTokenLiteral([p, s1, s2, taken, takenAliaser], "s1", "light", "#FFF");
    const ids = out.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(resolveTokenLiteral(out, "s3", "light")).toBe("#000");
    expect(resolveTokenLiteral(out, "s1", "light")).toBe("#FFF");
  });
  it("a dark edit creates custom-<id>-dark and leaves light alone", () => {
    const out = setTokenLiteral([p, s1, s2], "s1", "dark", "#FFF");
    expect(out.find((t) => t.id === "s1")!.modes).toEqual({ light: { alias: "b" }, dark: { alias: "custom-s1-dark" } });
    expect(resolveTokenLiteral(out, "s1", "dark")).toBe("#FFF");
    expect(resolveTokenLiteral(out, "s2", "dark")).toBe("#000");
  });
  it("a primitive edit cascades to every token aliasing it (v6 design)", () => {
    const out = setTokenLiteral([p, s1, s2], "b", "light", "#ABC");
    expect(resolveTokenLiteral(out, "s1", "light")).toBe("#ABC");
    expect(resolveTokenLiteral(out, "s2", "light")).toBe("#ABC");
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
