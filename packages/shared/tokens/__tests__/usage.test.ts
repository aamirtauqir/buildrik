import { describe, it, expect, vi } from "vitest";
import { buildTokenUsageIndex, scanTokenRefs, tokenIdsByVarName } from "../usage";
import type { DesignToken } from "@buildrik/shared/schemas/design-tokens";

const tok = (id: string, light: DesignToken["modes"]["light"], layer: DesignToken["layer"] = "semantic"): DesignToken => ({
  id, name: id, kind: "color", layer, modes: { light }, category: "colors", cssVar: `--buildrick-design-${id}`, type: "color",
});
const tokens = [tok("blue-600", { value: "#1A56DB" }, "primitive"), tok("color-primary", { alias: "blue-600" })];

describe("buildTokenUsageIndex", () => {
  it("counts var() and {{token.x}} references across all sources in one pass", () => {
    const pages = [{ blocks: [{ styles: { color: "var(--buildrick-design-color-primary)", background: "{{token.color-primary}}" } }] }];
    const styles = [{ selector: ".btn", rules: { color: "var( --buildrick-design-color-primary )" } }];
    const idx = buildTokenUsageIndex([pages, styles], tokens);
    expect(idx.direct.get("color-primary")).toBe(3);
  });

  it("counts a primitive's usage through aliases", () => {
    const idx = buildTokenUsageIndex([[{ c: "var(--buildrick-design-color-primary)" }]], tokens);
    expect(idx.total("blue-600")).toBe(1);
  });

  it("reports unknown instead of zero when a source cannot be serialized", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(buildTokenUsageIndex([cyclic], tokens).unknown).toBe(true);
  });
});

const merged: DesignToken = {
  ...tok("color-primary-x", { value: "#1A56DB" }),
  legacyNames: ["--buildrick-design-color-action"],
};
const bdRadius: DesignToken = {
  id: "radius-sm", name: "Small radius", kind: "radius", layer: "semantic", modes: { light: { value: "4px" } },
  category: "layout", cssVar: "--bd-radius-sm", type: "length",
};

describe("buildTokenUsageIndex v2", () => {
  it("counts legacy names and non-prefixed vars by the token that answers to them", () => {
    const idx = buildTokenUsageIndex(
      [[{ a: "var(--buildrick-design-color-action)" }, { r: "var(--bd-radius-sm)" }]],
      [merged, bdRadius],
    );
    expect(idx.count("color-primary-x")).toBe(1);
    expect(idx.count("radius-sm")).toBe(1);
  });

  it("counts var() with a fallback", () => {
    const idx = buildTokenUsageIndex([[{ c: "var(--buildrick-design-color-primary, #1A56DB)" }]], tokens);
    expect(idx.count("color-primary")).toBe(1);
  });

  it("counts references to a token replaced by it", () => {
    const old = { ...tok("color-old", { value: "#000000" }), replacedBy: "color-primary" };
    const idx = buildTokenUsageIndex([[{ c: "var(--buildrick-design-color-old)" }]], [...tokens, old]);
    expect(idx.count("color-primary")).toBe(1);
    expect(idx.closure("color-primary").sort()).toEqual(["color-old", "color-primary"]);
  });

  it("is unknown for every token when a source is unavailable", () => {
    const idx = buildTokenUsageIndex([[]], tokens, { unavailable: ["components"] });
    expect(idx.unknown).toBe(true);
    expect(idx.count("blue-600")).toBe("unknown");
    expect(idx.total("blue-600")).toBe(0);
  });

  it("serializes each source exactly once (spec test 30)", () => {
    const spy = vi.spyOn(JSON, "stringify");
    const idx = buildTokenUsageIndex([[{ a: 1 }], [{ b: 2 }], [{ c: 3 }]], tokens);
    idx.count("color-primary");
    idx.count("blue-600");
    expect(spy).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });
});

describe("scanTokenRefs", () => {
  it("returns ids in order, repeats kept, unknown prefixed vars by suffix", () => {
    const byVar = tokenIdsByVarName(tokens);
    expect(scanTokenRefs("linear-gradient(var(--buildrick-design-color-primary), var(--buildrick-design-color-primary))", byVar))
      .toEqual(["color-primary", "color-primary"]);
    expect(scanTokenRefs("var(--buildrick-design-not-a-token)", byVar)).toEqual(["not-a-token"]);
    expect(scanTokenRefs("var(--some-other-lib)", byVar)).toEqual([]);
    expect(scanTokenRefs("{{token.color-primary}}", byVar)).toEqual(["color-primary"]);
  });
});
