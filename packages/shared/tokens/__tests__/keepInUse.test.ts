import { describe, it, expect } from "vitest";
import type { DesignToken, TokenRef } from "@buildrik/shared/schemas/design-tokens";
import { keepInUseSiteTokens } from "../keepInUse";

const t = (id: string, light: TokenRef, layer: DesignToken["layer"] = "semantic", cssVar = `--buildrick-design-${id}`): DesignToken => ({
  id, name: id, kind: "color", layer, modes: { light }, category: "colors", cssVar, type: "color",
});
const uses = (ids: string[]) => ({ count: (id: string) => (ids.includes(id) ? 1 : 0) });

describe("keepInUseSiteTokens (spec §4, test 21)", () => {
  const theme = [t("color-primary", { value: "#1A56DB" })];

  it("keeps an in-use site-only token, drops an unused one", () => {
    const site = [t("color-brand-x", { value: "#0E7490" }), t("color-unused", { value: "#000000" })];
    const out = keepInUseSiteTokens(theme, site, uses(["color-brand-x"]));
    expect(out.kept).toEqual(["color-brand-x"]);
    expect(out.tokens.map((x) => x.id)).toEqual(["color-primary", "color-brand-x"]);
  });

  it("keeps the alias closure", () => {
    const site = [t("custom-color-brand-x", { value: "#0E7490" }, "primitive"), t("color-brand-x", { alias: "custom-color-brand-x" })];
    expect(keepInUseSiteTokens(theme, site, uses(["color-brand-x"])).kept.sort()).toEqual(["color-brand-x", "custom-color-brand-x"]);
  });

  it("keeps when usage is unknown", () => {
    const site = [t("color-brand-x", { value: "#0E7490" })];
    expect(keepInUseSiteTokens(theme, site, { count: () => "unknown" }).kept).toEqual(["color-brand-x"]);
  });

  it("never keeps a token whose var the theme owns", () => {
    const site = [t("color-dup", { value: "#000000" }, "semantic", "--buildrick-design-color-primary")];
    expect(keepInUseSiteTokens(theme, site, uses(["color-dup"])).kept).toEqual([]);
  });

  it("theme tokens always win over a site token of the same id", () => {
    const site = [t("color-primary", { value: "#FF0000" })];
    const out = keepInUseSiteTokens(theme, site, uses(["color-primary"]));
    expect(out.kept).toEqual([]);
    expect(out.tokens).toEqual(theme);
  });
});
