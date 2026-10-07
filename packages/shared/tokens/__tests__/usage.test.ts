import { describe, it, expect } from "vitest";
import { buildTokenUsageIndex } from "../usage";
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
