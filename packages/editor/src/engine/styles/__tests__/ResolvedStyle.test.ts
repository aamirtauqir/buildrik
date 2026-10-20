import { describe, it, expect } from "vitest";
import { resolveStyle, type StyleLayerSource } from "../ResolvedStyle";
import { elementSelector } from "@/shared/utils/elementSelector";

/* One element with a value at every layer the published CSS has. Each value
   names its layer, so the winner is readable straight off the assertion. */
const source: StyleLayerSource = {
  base: () => ({ color: "base", padding: "base", margin: "base", width: "base" }),
  breakpoint: (bp): Record<string, string> =>
    bp === "tablet" ? { color: "tablet", padding: "tablet" } : { color: "mobile" },
  state: (_state, bp): Record<string, string> =>
    bp === "desktop" ? { color: "base:hover", width: "base:hover" } : bp === "tablet" ? { margin: "tablet:hover" } : {},
};

describe("resolveStyle — the published desktop-first cascade (D10)", () => {
  it.each([
    // breakpoint, state, expected
    ["desktop", "normal", { color: "base", padding: "base", margin: "base", width: "base" }],
    ["tablet", "normal", { color: "tablet", padding: "tablet", margin: "base", width: "base" }],
    // a phone viewport also matches the tablet query: tablet padding survives on mobile
    ["mobile", "normal", { color: "mobile", padding: "tablet", margin: "base", width: "base" }],
    ["desktop", "hover", { color: "base:hover", padding: "base", margin: "base", width: "base:hover" }],
    // a state rule outranks every plain rule: desktop :hover beats tablet/mobile base values
    ["tablet", "hover", { color: "base:hover", padding: "tablet", margin: "tablet:hover", width: "base:hover" }],
    ["mobile", "hover", { color: "base:hover", padding: "tablet", margin: "tablet:hover", width: "base:hover" }],
  ] as const)("at %s / %s", (bp, state, expected) => {
    expect(resolveStyle(source, bp, state)).toEqual(expected);
  });

  it("a narrower state rule beats a wider one", () => {
    const s: StyleLayerSource = {
      base: () => ({}),
      breakpoint: () => ({}),
      state: (_st, bp) => ({ color: `${bp}:hover` }),
    };
    expect(resolveStyle(s, "mobile", "hover")).toEqual({ color: "mobile:hover" });
    expect(resolveStyle(s, "tablet", "hover")).toEqual({ color: "tablet:hover" });
  });
});

describe("elementSelector", () => {
  it("is byte-identical to the stored selector for a real id", () => {
    expect(elementSelector("el-mv8uxk0o-1lv3tih1k25")).toBe('[data-buildrick-id="el-mv8uxk0o-1lv3tih1k25"]');
  });

  it("escapes the two characters that break a quoted attribute value", () => {
    expect(elementSelector('a"b\\c')).toBe('[data-buildrick-id="a\\"b\\\\c"]');
  });
});
