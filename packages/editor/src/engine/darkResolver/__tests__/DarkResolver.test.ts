import { describe, it, expect } from "vitest";
import { DarkResolver } from "../DarkResolver";
import { v6Token, type V6TokenSpec } from "@/engine/__tests__/test-utils/v6Token";

const tok = (over: Partial<V6TokenSpec>) =>
  v6Token({ id: "color-primary", name: "Primary", value: "#1A56DB", cssVar: "--bd-p", ...over });

describe("DarkResolver.resolve", () => {
  it("returns the light literal for resolved='light'", () => {
    const t = tok({ dark: "#000" });
    expect(new DarkResolver().resolve(t, [t], "light")).toBe("#1A56DB");
  });

  it("returns the dark literal for resolved='dark' when present", () => {
    const t = tok({ dark: "#000" });
    expect(new DarkResolver().resolve(t, [t], "dark")).toBe("#000");
  });

  it("falls back to the light literal for resolved='dark' when there is no dark mode (D16)", () => {
    const t = tok({});
    expect(new DarkResolver().resolve(t, [t], "dark")).toBe("#1A56DB");
  });

  it("treats an empty dark literal as explicit", () => {
    const t = tok({ dark: "" });
    expect(new DarkResolver().resolve(t, [t], "dark")).toBe("");
  });

  it("follows an alias to its primitive's literal", () => {
    const p = v6Token({ id: "brand", value: "#1A56DB" });
    const s = tok({ alias: "brand" });
    expect(new DarkResolver().resolve(s, [p, s], "dark")).toBe("#1A56DB");
  });
});

describe("DarkResolver.resolveAll", () => {
  it("returns map of tokenId → resolved value across all input tokens", () => {
    const map = new DarkResolver().resolveAll(
      [tok({ id: "a", value: "#fff", dark: "#000" }), tok({ id: "b", value: "#eee" })],
      "dark",
    );
    expect(map.get("a")).toBe("#000");
    expect(map.get("b")).toBe("#eee");
  });
});
