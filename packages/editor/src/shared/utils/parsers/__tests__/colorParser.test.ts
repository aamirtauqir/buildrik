/**
 * colorParser tests — pins parsing across hex, rgb(a), hsl(a), hwb, lab,
 * lch, oklch, named colors, and value clamping.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  parseColor,
  parseHexColor,
  parseColorValue,
  clampColor,
  ensureRgb,
  isValidColor,
} from "../colorParser";

describe("parseColor — hex", () => {
  it("parses #rgb shorthand", () => {
    expect(parseColor("#f00")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor("#abc")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("parses #rgba shorthand with alpha", () => {
    const c = parseColor("#f008");
    expect(c).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(c!.a).toBeCloseTo(0x88 / 255, 5);
  });

  it("parses #rrggbb and #rrggbbaa", () => {
    expect(parseColor("#2D6DFF")).toEqual({ r: 45, g: 109, b: 255 });
    const c = parseColor("#ff000080");
    expect(c).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(c!.a).toBeCloseTo(128 / 255, 5);
  });

  it("rejects 5- and 7-digit hex", () => {
    expect(parseColor("#abcde")).toBeNull();
    expect(parseColor("#abcdeff")).toBeNull();
  });
});

describe("parseColor — named colors", () => {
  it("resolves CSS named colors case-insensitively", () => {
    expect(parseColor("red")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor("WHITE")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("black")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("returns null for currentcolor (not resolvable statically)", () => {
    expect(parseColor("currentColor")).toBeNull();
  });
});

describe("parseColor — rgb()", () => {
  it("parses modern space syntax with optional / alpha", () => {
    expect(parseColor("rgb(255 0 0)")).toEqual({ r: 255, g: 0, b: 0, a: undefined });
    expect(parseColor("rgb(255 0 0 / 50%)")).toMatchObject({ r: 255, a: 0.5 });
    expect(parseColor("rgb(100% 0% 50%)")).toMatchObject({ r: 255, g: 0, b: 127.5 });
  });

  it("parses legacy comma syntax with optional alpha", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30, a: undefined });
    expect(parseColor("rgba(10, 20, 30, 0.5)")).toEqual({ r: 10, g: 20, b: 30, a: 0.5 });
  });

  it("clamps out-of-range channel values", () => {
    expect(parseColor("rgb(300, 20, 30)")).toMatchObject({ r: 255 });
  });
});

describe("parseColor — hsl()", () => {
  it("parses legacy comma syntax", () => {
    expect(parseColor("hsl(120, 100%, 50%)")).toMatchObject({ r: 0, g: 255, b: 0 });
    expect(parseColor("hsla(0, 100%, 50%, 0.5)")).toMatchObject({ r: 255, g: 0, b: 0, a: 0.5 });
  });

  it("parses modern space syntax", () => {
    expect(parseColor("hsl(240 100% 50%)")).toMatchObject({ r: 0, g: 0, b: 255 });
    expect(parseColor("hsl(0 0% 100% / 25%)")).toMatchObject({ r: 255, g: 255, b: 255, a: 0.25 });
  });
});

describe("parseColor — hwb / lab / lch / oklch", () => {
  it("parses hwb()", () => {
    expect(parseColor("hwb(0 0% 0%)")).toMatchObject({ r: 255, g: 0, b: 0 });
    // full whiteness + blackness normalizes to gray
    const gray = parseColor("hwb(120 100% 100%)")!;
    expect(gray.r).toBe(gray.g);
    expect(gray.g).toBe(gray.b);
  });

  it("parses lab() endpoints to white/black", () => {
    expect(parseColor("lab(100% 0 0)")).toMatchObject({ r: 255, g: 255, b: 255 });
    expect(parseColor("lab(0% 0 0)")).toMatchObject({ r: 0, g: 0, b: 0 });
  });

  it("parses lch() achromatic to gray", () => {
    const gray = parseColor("lch(50% 0 0)")!;
    expect(gray.r).toBe(gray.g);
    expect(gray.g).toBe(gray.b);
    expect(gray.r).toBeGreaterThan(100);
    expect(gray.r).toBeLessThan(140);
  });

  // BUG (audit): the lch() regex is UNANCHORED, so "oklch(...)" matches the
  // "lch(" substring and every oklch() color is parsed by the LCH branch —
  // the dedicated oklch branch below it is unreachable via parseColor.
  // Effect: oklch lightness (0-1 scale) is read as LAB L (0-100 scale);
  // oklch(1 0 0) yields near-black {r:4,g:4,b:4} instead of white.
  it.todo("BUG: parseColor routes oklch() through the lch() parser (unanchored /lch\\(/ regex) — oklch(1 0 0) parses near-black");

  it("percent and >1 raw oklch lightness normalize identically", () => {
    // Stable under both the current (lch-routed) behavior and a future fix.
    const pct = parseColor("oklch(70% 0.1 180)")!;
    const raw = parseColor("oklch(70 0.1 180)")!;
    expect(raw).toEqual(pct);
  });

  it("carries / alpha through the exotic spaces", () => {
    expect(parseColor("lab(50% 40 59.5 / 50%)")!.a).toBe(0.5);
    expect(parseColor("oklch(0.7 0.15 180 / 0.25)")!.a).toBe(0.25);
  });
});

describe("parseColor — invalid input", () => {
  it("returns null for garbage / empty strings", () => {
    expect(parseColor("")).toBeNull();
    expect(parseColor("not-a-color")).toBeNull();
    expect(parseColor("#gg0000")).toBeNull();
  });
});

describe("parseHexColor", () => {
  it("handles 3/4/6/8-length digit strings and rejects others", () => {
    expect(parseHexColor("fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor("ffff")!.a).toBe(1);
    expect(parseHexColor("102030")).toEqual({ r: 16, g: 32, b: 48 });
    expect(parseHexColor("10203040")!.a).toBeCloseTo(64 / 255, 5);
    expect(parseHexColor("12345")).toBeNull();
  });
});

describe("parseColorValue / clampColor", () => {
  it("scales percentages against max and clamps", () => {
    expect(parseColorValue("50%", 255)).toBe(127.5);
    expect(parseColorValue("150%", 255)).toBe(255);
    expect(parseColorValue("50%", 1)).toBe(0.5);
  });

  it("clamps raw values into [0, max]", () => {
    expect(parseColorValue("300", 255)).toBe(255);
    expect(parseColorValue("-4", 255)).toBe(0);
  });

  it("clampColor rounds and clamps", () => {
    expect(clampColor(-5)).toBe(0);
    expect(clampColor(260)).toBe(255);
    expect(clampColor(127.6)).toBe(128);
    expect(clampColor(0.7, 1)).toBe(1);
  });
});

describe("ensureRgb / isValidColor", () => {
  it("ensureRgb parses strings and passes RGB objects through", () => {
    const obj = { r: 1, g: 2, b: 3 };
    expect(ensureRgb(obj)).toBe(obj);
    expect(ensureRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(ensureRgb("junk")).toBeNull();
  });

  it("isValidColor mirrors parseColor success", () => {
    expect(isValidColor("#2D6DFF")).toBe(true);
    expect(isValidColor("rgb(0 0 0)")).toBe(true);
    expect(isValidColor("junk")).toBe(false);
  });
});
