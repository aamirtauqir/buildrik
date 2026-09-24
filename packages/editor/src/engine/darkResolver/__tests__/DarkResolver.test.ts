import { describe, it, expect } from "vitest";
import { DarkResolver } from "../DarkResolver";
import type { DesignToken } from "../../designSystem/types";

const tok = (over: Partial<DesignToken>): DesignToken =>
  ({ id: "color-primary", name: "Primary", value: "#1A56DB", category: "colors", cssVar: "--bd-p", type: "color", ...over }) as DesignToken;

describe("DarkResolver.resolve", () => {
  it("returns token.value for resolved='light'", () => {
    expect(new DarkResolver().resolve(tok({ darkValue: "#000" }), "light")).toBe("#1A56DB");
  });

  it("returns token.darkValue for resolved='dark' when present", () => {
    expect(new DarkResolver().resolve(tok({ darkValue: "#000" }), "dark")).toBe("#000");
  });

  it("falls back to token.value for resolved='dark' when darkValue is absent (D16)", () => {
    expect(new DarkResolver().resolve(tok({}), "dark")).toBe("#1A56DB");
  });

  it("treats an empty darkValue as explicit", () => {
    expect(new DarkResolver().resolve(tok({ darkValue: "" }), "dark")).toBe("");
  });
});

describe("DarkResolver.resolveAll", () => {
  it("returns map of tokenId → resolved value across all input tokens", () => {
    const map = new DarkResolver().resolveAll(
      [tok({ id: "a", value: "#fff", darkValue: "#000" }), tok({ id: "b", value: "#eee" })],
      "dark",
    );
    expect(map.get("a")).toBe("#000");
    expect(map.get("b")).toBe("#eee");
  });
});
