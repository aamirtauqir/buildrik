/**
 * tokenValueGuard — the AI-write trust boundary for design-token values.
 * Every value the model writes is validated per token type before landing
 * in projectSettings.designTokens / CSS custom properties.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { AI_EDITABLE_TOKEN_TYPES, isAiEditableTokenValue } from "../tokenValueGuard";

describe("AI_EDITABLE_TOKEN_TYPES", () => {
  it("covers exactly the v1 editable set (shadow/select excluded)", () => {
    expect([...AI_EDITABLE_TOKEN_TYPES].sort()).toEqual([
      "color",
      "font-family",
      "font-size",
      "length",
      "number",
      "string",
    ]);
    expect(AI_EDITABLE_TOKEN_TYPES.has("shadow")).toBe(false);
    expect(AI_EDITABLE_TOKEN_TYPES.has("select")).toBe(false);
  });
});

describe("universal rejections (any type)", () => {
  it("rejects non-string, empty, and over-length values", () => {
    expect(isAiEditableTokenValue("color", 42 as unknown as string)).toBe(false);
    expect(isAiEditableTokenValue("color", "")).toBe(false);
    expect(isAiEditableTokenValue("string", "a".repeat(121))).toBe(false);
    expect(isAiEditableTokenValue("string", "a".repeat(120))).toBe(true);
  });

  it.each([
    ["url() loader", "url(https://evil.example/x)"],
    ["expression()", "expression(alert(1))"],
    ["javascript: scheme", "javascript:alert(1)"],
    ["@import", "@import 'x.css'"],
    ["angle bracket", "<script>"],
    ["closing bracket", "a>b"],
    ["brace open", "{color:red"],
    ["brace close", "red}"],
    ["semicolon breakout", "red;background:url(x)"],
  ])("rejects unsafe pattern: %s", (_label, value) => {
    // Unsafe check runs before per-type validation — reject for every type.
    expect(isAiEditableTokenValue("string", value)).toBe(false);
    expect(isAiEditableTokenValue("color", value)).toBe(false);
  });
});

describe("color", () => {
  it.each(["#fff", "#2D6DFF", "#2d6dff80", "rgb(45, 109, 255)", "rgba(0,0,0,.5)", "hsl(220, 100%, 60%)", "hsla(220, 100%, 60%, 0.4)", "cobalt", "transparent"])(
    "accepts %s",
    (v) => expect(isAiEditableTokenValue("color", v)).toBe(true),
  );

  it.each(["#gg1122", "rgb(45px, 1, 1)", "linear-gradient(90deg, #fff, #000)", "1px solid red"])(
    "rejects %s",
    (v) => expect(isAiEditableTokenValue("color", v)).toBe(false),
  );
});

describe("length / font-size", () => {
  it.each(["16px", "1.5rem", "-4px", ".5em", "100%", "10vh", "2ch", "3fr", "12pt", "42"])(
    "accepts %s for both length and font-size",
    (v) => {
      expect(isAiEditableTokenValue("length", v)).toBe(true);
      expect(isAiEditableTokenValue("font-size", v)).toBe(true);
    },
  );

  it.each(["16 px", "px", "calc(100% - 8px)", "1,5rem", "10deg"])("rejects %s", (v) => {
    expect(isAiEditableTokenValue("length", v)).toBe(false);
    expect(isAiEditableTokenValue("font-size", v)).toBe(false);
  });
});

describe("number", () => {
  it.each(["0", "42", "-1.25", ".75"])("accepts %s", (v) =>
    expect(isAiEditableTokenValue("number", v)).toBe(true),
  );

  it.each(["42px", "1e3", "one", "1.2.3"])("rejects %s", (v) =>
    expect(isAiEditableTokenValue("number", v)).toBe(false),
  );
});

describe("font-family / string", () => {
  it.each(["Inter", "Inter Tight, sans-serif", "'General Sans'", '"Geist Mono", monospace', "Font-Name 2"])(
    "accepts %s",
    (v) => {
      expect(isAiEditableTokenValue("font-family", v)).toBe(true);
      expect(isAiEditableTokenValue("string", v)).toBe(true);
    },
  );

  it.each(["Inter!", "font/family", "va(--x)"])("rejects %s", (v) => {
    expect(isAiEditableTokenValue("font-family", v)).toBe(false);
    expect(isAiEditableTokenValue("string", v)).toBe(false);
  });
});

describe("unknown / non-editable types", () => {
  it.each(["shadow", "select", "gradient", undefined])("returns false for type %s", (type) => {
    expect(isAiEditableTokenValue(type as string | undefined, "value")).toBe(false);
  });
});
