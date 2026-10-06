import { describe, it, expect } from "vitest";
import { validateTokens, type DesignToken } from "../design-tokens";

const prim = (id: string, value: string, kind: DesignToken["kind"] = "color"): DesignToken => ({
  id, name: id, kind, layer: "primitive", modes: { light: { value } },
  category: kind === "color" ? "colors" : "spacing", cssVar: `--buildrick-design-${id}`, type: kind === "color" ? "color" : "length",
});
const sem = (id: string, light: DesignToken["modes"]["light"], dark?: DesignToken["modes"]["light"], kind: DesignToken["kind"] = "color"): DesignToken => ({
  id, name: id, kind, layer: "semantic", modes: dark ? { light, dark } : { light },
  category: kind === "color" ? "colors" : "spacing", cssVar: `--buildrick-design-${id}`, type: kind === "color" ? "color" : "length",
});

describe("validateTokens (v6)", () => {
  it("accepts primitives and semantic aliases of the same kind", () => {
    const r = validateTokens([prim("blue-600", "#1A56DB"), prim("blue-400", "#76A9FA"),
      sem("color-primary", { alias: "blue-600" }, { alias: "blue-400" })]);
    expect(r.ok).toBe(true);
  });

  it("refuses a primitive with a dark mode", () => {
    const bad = { ...prim("blue-600", "#1A56DB"), modes: { light: { value: "#1A56DB" }, dark: { value: "#000" } } };
    expect(validateTokens([bad])).toEqual({ ok: false, reason: expect.stringContaining("primitive blue-600") });
  });

  it("refuses a primitive that aliases", () => {
    const bad = { ...prim("a", "#000"), modes: { light: { alias: "b" } } };
    expect(validateTokens([bad, prim("b", "#111")]).ok).toBe(false);
  });

  it("refuses an alias to a missing token", () => {
    expect(validateTokens([sem("color-primary", { alias: "nope" })])).toEqual({ ok: false, reason: expect.stringContaining("nope") });
  });

  it("refuses an alias across kinds", () => {
    const r = validateTokens([prim("space-4", "16px", "spacing"), sem("color-primary", { alias: "space-4" })]);
    expect(r).toEqual({ ok: false, reason: expect.stringContaining("kind") });
  });

  it("refuses an alias cycle", () => {
    const r = validateTokens([sem("a", { alias: "b" }), sem("b", { alias: "a" })]);
    expect(r).toEqual({ ok: false, reason: expect.stringContaining("cycle") });
  });

  it("refuses duplicate ids", () => {
    expect(validateTokens([prim("x", "#000"), prim("x", "#111")]).ok).toBe(false);
  });

  it("refuses replacedBy pointing at a missing token", () => {
    const t = { ...prim("x", "#000"), replacedBy: "gone" };
    expect(validateTokens([t]).ok).toBe(false);
  });

  it("refuses non-array and null entries with a reason", () => {
    expect(validateTokens(null)).toEqual({ ok: false, reason: expect.any(String) });
    expect(validateTokens([null]).ok).toBe(false);
  });
});
