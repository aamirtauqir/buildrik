/**
 * parsers/cssParser — CSS rule/variable/inline-style parsing + serialization.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  parseCSS,
  resolveCSSVariables,
  extractCSSVariables,
  splitCSSProperties,
  serializeCSS,
  parseInlineStyles,
  serializeInlineStyles,
  type CSSRule,
} from "../cssParser";

describe("parseCSS (regex path)", () => {
  it("parses basic rules into selector/properties", () => {
    const rules = parseCSS(".a{color:red;margin:0}");
    expect(rules).toEqual([{ selector: ".a", properties: { color: "red", margin: "0" } }]);
  });

  it("strips comments before parsing", () => {
    const rules = parseCSS("/* c */ .a{color:red}");
    expect(rules[0].properties.color).toBe("red");
  });

  it("skips @-rules in simple mode", () => {
    const rules = parseCSS("@font-face{font-family:x} .a{color:red}");
    expect(rules.map((r) => r.selector)).toEqual([".a"]);
  });

  it("resolves variables when a map is supplied", () => {
    const rules = parseCSS(".a{color:var(--brand)}", { variables: { "--brand": "#2D6DFF" } });
    expect(rules[0].properties.color).toBe("#2D6DFF");
  });

  it("finds the rule via the includeAtRules (browser) path too", () => {
    const rules = parseCSS(".a{color:red}", { includeAtRules: true });
    expect(rules.some((r) => r.selector === ".a")).toBe(true);
  });
});

describe("resolveCSSVariables", () => {
  it("substitutes known variables", () => {
    expect(resolveCSSVariables("color: var(--x)", { "--x": "red" })).toBe("color: red");
  });
  it("uses the fallback when the variable is unknown", () => {
    expect(resolveCSSVariables("color: var(--y, blue)", {})).toBe("color: blue");
  });
  it("resolves to empty string when neither var nor fallback exist", () => {
    expect(resolveCSSVariables("color: var(--z)", {})).toBe("color: ");
  });
});

describe("extractCSSVariables", () => {
  it("collects --var definitions", () => {
    expect(extractCSSVariables(":root{--x: red; --y: 10px;}")).toEqual({
      "--x": "red",
      "--y": "10px",
    });
  });
});

describe("splitCSSProperties", () => {
  it("splits on top-level semicolons only", () => {
    expect(splitCSSProperties("color:red; margin:0")).toEqual(["color:red", "margin:0"]);
  });
  it("keeps semicolons inside parentheses", () => {
    expect(splitCSSProperties("background:url(a;b); color:red")).toEqual([
      "background:url(a;b)",
      "color:red",
    ]);
  });
  it("keeps semicolons inside quotes", () => {
    expect(splitCSSProperties(`content:";"; color:red`)).toEqual([`content:";"`, "color:red"]);
  });
});

describe("serializeCSS", () => {
  const rules: CSSRule[] = [{ selector: ".a", properties: { color: "red", margin: "0" } }];
  it("pretty-prints by default", () => {
    expect(serializeCSS(rules)).toBe(".a {\n  color: red;\n  margin: 0;\n}");
  });
  it("minifies when requested", () => {
    expect(serializeCSS(rules, true)).toBe(".a{color:red;margin:0}");
  });
});

describe("parseInlineStyles / serializeInlineStyles", () => {
  it("parses an inline style string (URLs with colons preserved)", () => {
    expect(parseInlineStyles("color:red; background:url(http://x)")).toEqual({
      color: "red",
      background: "url(http://x)",
    });
  });
  it("returns {} for empty input", () => {
    expect(parseInlineStyles("")).toEqual({});
    expect(parseInlineStyles("   ")).toEqual({});
  });
  it("serializes camelCase keys to kebab-case, dropping empties", () => {
    expect(serializeInlineStyles({ color: "red", marginTop: "0", border: "" })).toBe(
      "color: red; margin-top: 0"
    );
  });
});
