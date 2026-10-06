import { describe, it, expect } from "vitest";
import { toDTCG, fromDTCG, type DesignToken } from "../design-tokens";

const tokens: DesignToken[] = [
  { id: "blue-600", name: "Blue 600", kind: "color", layer: "primitive", modes: { light: { value: "#1A56DB" } },
    category: "colors", cssVar: "--buildrick-design-blue-600", type: "color" },
  { id: "blue-400", name: "Blue 400", kind: "color", layer: "primitive", modes: { light: { value: "#76A9FA" } },
    category: "colors", cssVar: "--buildrick-design-blue-400", type: "color" },
  { id: "color-primary", name: "Primary", kind: "color", layer: "semantic",
    modes: { light: { alias: "blue-600" }, dark: { alias: "blue-400" } }, category: "colors",
    cssVar: "--buildrick-design-color-primary", type: "color", group: "brand", description: "Primary brand color",
    legacyNames: ["--buildrick-design-color-action"] },
  { id: "motion-fast", name: "Fast", kind: "motion", layer: "semantic", modes: { light: { value: "150ms ease-out" } },
    category: "effects", cssVar: "--buildrick-design-motion-fast", type: "string" },
];

describe("DTCG round trip", () => {
  it("is lossless for primitives, aliases, modes and extensions", () => {
    expect(fromDTCG(toDTCG(tokens))).toEqual(tokens);
  });

  it("writes standard $type/$value and {alias} references", () => {
    const doc = toDTCG(tokens);
    expect(doc["blue-600"]).toMatchObject({ $type: "color", $value: "#1A56DB" });
    expect(doc["color-primary"]).toMatchObject({ $type: "color", $value: "{blue-600}" });
    expect(doc["color-primary"].$extensions["com.buildrik"].modes.dark).toBe("{blue-400}");
  });

  it("maps kinds without a DTCG type to a namespaced extension type", () => {
    expect(toDTCG(tokens)["motion-fast"].$type).toBe("com.buildrik.motion");
  });
});
