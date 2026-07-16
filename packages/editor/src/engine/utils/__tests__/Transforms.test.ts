/**
 * Transforms — full branch coverage for the unified data-binding
 * transform registry: built-in transform groups, lookup, application
 * (incl. failure fallback), and custom registration.
 *
 * Locale-sensitive transforms (number, date, datetime, time) are asserted
 * against the same Intl call computed in the test so results stay stable
 * across machines/locales.
 *
 * @license BSD-3-Clause
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  applyTransform,
  attributeTransforms,
  builtInTransforms,
  dateTransforms,
  getTransformFunction,
  hasTransform,
  numberTransforms,
  registerTransform,
  stringTransforms,
  utilityTransforms,
} from "../Transforms";

describe("stringTransforms", () => {
  it("uppercase / lowercase coerce non-strings via String()", () => {
    expect(stringTransforms.uppercase("hello")).toBe("HELLO");
    expect(stringTransforms.uppercase(42)).toBe("42");
    expect(stringTransforms.uppercase(null)).toBe("NULL");
    expect(stringTransforms.lowercase("HeLLo")).toBe("hello");
    expect(stringTransforms.lowercase(true)).toBe("true");
  });

  it("capitalize uppercases first char and lowercases the rest", () => {
    expect(stringTransforms.capitalize("hELLO wORLD")).toBe("Hello world");
    expect(stringTransforms.capitalize("a")).toBe("A");
  });

  it("capitalize handles the empty string", () => {
    expect(stringTransforms.capitalize("")).toBe("");
  });

  it("trim strips surrounding whitespace", () => {
    expect(stringTransforms.trim("  padded\t\n")).toBe("padded");
    expect(stringTransforms.trim(7)).toBe("7");
  });

  it("slug collapses non-alphanumerics into single dashes and trims edge dashes", () => {
    expect(stringTransforms.slug("Hello, World!")).toBe("hello-world");
    expect(stringTransforms.slug("  --Already--Slugged--  ")).toBe("already-slugged");
    expect(stringTransforms.slug("a  b   c")).toBe("a-b-c");
  });

  it("slug drops unicode letters (ASCII-only, current behavior)", () => {
    // é/ö are outside [a-z0-9] so they become separators, not letters.
    expect(stringTransforms.slug("Héllo Wörld")).toBe("h-llo-w-rld");
    expect(stringTransforms.slug("日本語")).toBe("");
  });

  it("slug of only-symbols input yields the empty string", () => {
    expect(stringTransforms.slug("!!! ???")).toBe("");
  });
});

describe("numberTransforms", () => {
  it("number formats via toLocaleString", () => {
    expect(numberTransforms.number(1234567.5)).toBe((1234567.5).toLocaleString());
    expect(numberTransforms.number("42")).toBe((42).toLocaleString());
  });

  it("round / floor / ceil / abs coerce and compute", () => {
    expect(numberTransforms.round("2.5")).toBe(3);
    expect(numberTransforms.round(2.4)).toBe(2);
    expect(numberTransforms.floor(2.9)).toBe(2);
    expect(numberTransforms.floor(-2.1)).toBe(-3);
    expect(numberTransforms.ceil(2.1)).toBe(3);
    expect(numberTransforms.ceil(-2.9)).toBe(-2);
    expect(numberTransforms.abs(-5)).toBe(5);
    expect(numberTransforms.abs("-3.5")).toBe(3.5);
  });

  it("currency formats to two decimals with $ prefix", () => {
    expect(numberTransforms.currency(1234.567)).toBe("$1234.57");
    expect(numberTransforms.currency("3")).toBe("$3.00");
    expect(numberTransforms.currency(0)).toBe("$0.00");
  });

  it("currency of a non-numeric value produces $NaN (current behavior, no guard)", () => {
    expect(numberTransforms.currency("not a number")).toBe("$NaN");
  });
});

describe("dateTransforms", () => {
  const ts = Date.UTC(2026, 0, 15, 12, 30, 45); // fixed instant

  it("date / datetime / time format via the corresponding locale method", () => {
    expect(dateTransforms.date(ts)).toBe(new Date(ts).toLocaleDateString());
    expect(dateTransforms.datetime(ts)).toBe(new Date(ts).toLocaleString());
    expect(dateTransforms.time(ts)).toBe(new Date(ts).toLocaleTimeString());
  });

  it("iso produces a stable ISO-8601 string and accepts string input", () => {
    expect(dateTransforms.iso(0)).toBe("1970-01-01T00:00:00.000Z");
    expect(dateTransforms.iso("2026-01-15T12:30:45.000Z")).toBe("2026-01-15T12:30:45.000Z");
  });

  it("iso throws on an invalid date (raw call), which applyTransform turns into the fallback", () => {
    expect(() => dateTransforms.iso("definitely not a date")).toThrow(RangeError);
    expect(applyTransform("definitely not a date", "iso", "FALLBACK")).toBe("FALLBACK");
  });
});

describe("attributeTransforms", () => {
  it("boolean maps truthiness to 'true'/'false' strings", () => {
    expect(attributeTransforms.boolean(1)).toBe("true");
    expect(attributeTransforms.boolean("yes")).toBe("true");
    expect(attributeTransforms.boolean(0)).toBe("false");
    expect(attributeTransforms.boolean("")).toBe("false");
    expect(attributeTransforms.boolean(null)).toBe("false");
  });

  it("url prefixes https:// only when no protocol is present", () => {
    expect(attributeTransforms.url("example.com")).toBe("https://example.com");
    expect(attributeTransforms.url("https://example.com")).toBe("https://example.com");
    expect(attributeTransforms.url("http://example.com")).toBe("http://example.com");
  });

  it("email prefixes mailto:", () => {
    expect(attributeTransforms.email("a@b.co")).toBe("mailto:a@b.co");
  });

  it("tel strips all whitespace and prefixes tel:", () => {
    expect(attributeTransforms.tel("+1 234 567\t890")).toBe("tel:+1234567890");
    expect(attributeTransforms.tel(123)).toBe("tel:123");
  });

  it("alt strips only angle brackets", () => {
    expect(attributeTransforms.alt("a<script>b</script>")).toBe("ascriptb/script");
    expect(attributeTransforms.alt("plain")).toBe("plain");
  });

  it("className lowercases and collapses whitespace runs to single dashes", () => {
    expect(attributeTransforms.className("My  Fancy\tClass")).toBe("my-fancy-class");
    expect(attributeTransforms.className("solo")).toBe("solo");
  });
});

describe("utilityTransforms", () => {
  it("length returns array length for arrays and string length otherwise", () => {
    expect(utilityTransforms.length([1, 2, 3])).toBe(3);
    expect(utilityTransforms.length("abcd")).toBe(4);
    expect(utilityTransforms.length(1234)).toBe(4); // String(1234).length
    expect(utilityTransforms.length([])).toBe(0);
    expect(utilityTransforms.length("")).toBe(0);
  });

  it("json stringifies values", () => {
    expect(utilityTransforms.json({ a: 1 })).toBe('{"a":1}');
    expect(utilityTransforms.json([1, "x"])).toBe('[1,"x"]');
    // JSON.stringify(undefined) === undefined — passed through as-is.
    expect(utilityTransforms.json(undefined)).toBeUndefined();
  });

  it("keys / values work on objects and return [] for null and primitives", () => {
    expect(utilityTransforms.keys({ a: 1, b: 2 })).toEqual(["a", "b"]);
    expect(utilityTransforms.values({ a: 1, b: 2 })).toEqual([1, 2]);
    expect(utilityTransforms.keys(null)).toEqual([]);
    expect(utilityTransforms.values(null)).toEqual([]);
    expect(utilityTransforms.keys("string")).toEqual([]);
    expect(utilityTransforms.values(42)).toEqual([]);
    // Arrays are typeof "object": keys are stringified indices.
    expect(utilityTransforms.keys(["x", "y"])).toEqual(["0", "1"]);
    expect(utilityTransforms.values(["x", "y"])).toEqual(["x", "y"]);
  });
});

describe("builtInTransforms registry", () => {
  it("merges every group", () => {
    for (const key of [
      ...Object.keys(stringTransforms),
      ...Object.keys(numberTransforms),
      ...Object.keys(dateTransforms),
      ...Object.keys(attributeTransforms),
      ...Object.keys(utilityTransforms),
    ]) {
      expect(builtInTransforms[key], `missing built-in: ${key}`).toBeTypeOf("function");
    }
  });
});

describe("getTransformFunction", () => {
  it("returns a custom function unchanged", () => {
    const fn = (v: unknown) => v;
    expect(getTransformFunction(fn)).toBe(fn);
  });

  it("resolves a built-in by name", () => {
    expect(getTransformFunction("uppercase")).toBe(builtInTransforms.uppercase);
  });

  it("returns undefined for an unknown name", () => {
    expect(getTransformFunction("no-such-transform")).toBeUndefined();
  });

  it("returns undefined when no transform is given", () => {
    expect(getTransformFunction()).toBeUndefined();
    expect(getTransformFunction(undefined)).toBeUndefined();
  });
});

describe("applyTransform", () => {
  it("returns the value untouched when transform is omitted", () => {
    expect(applyTransform("v")).toBe("v");
    expect(applyTransform("v", undefined, "fallback")).toBe("v");
  });

  it("returns the value untouched for the empty-string transform name (falsy guard)", () => {
    expect(applyTransform("v", "")).toBe("v");
  });

  it("returns the value untouched for an unknown transform name", () => {
    expect(applyTransform("v", "nope", "fallback")).toBe("v");
  });

  it("applies a built-in by name", () => {
    expect(applyTransform("hello", "uppercase")).toBe("HELLO");
  });

  it("applies a custom function", () => {
    expect(applyTransform(3, (v) => (v as number) * 2)).toBe(6);
  });

  it("returns the fallback when the transform throws", () => {
    const boom = () => {
      throw new Error("boom");
    };
    expect(applyTransform("v", boom, "fb")).toBe("fb");
  });

  it("falsy-but-defined fallbacks are honored (0, '', null, false)", () => {
    const boom = () => {
      throw new Error("boom");
    };
    expect(applyTransform("v", boom, 0)).toBe(0);
    expect(applyTransform("v", boom, "")).toBe("");
    expect(applyTransform("v", boom, null)).toBeNull();
    expect(applyTransform("v", boom, false)).toBe(false);
  });

  it("returns the original value when the transform throws and no fallback is given", () => {
    const boom = () => {
      throw new Error("boom");
    };
    expect(applyTransform("original", boom)).toBe("original");
    expect(applyTransform("original", boom, undefined)).toBe("original");
  });
});

describe("registerTransform / hasTransform", () => {
  const added: string[] = [];

  afterEach(() => {
    // registerTransform mutates the shared builtInTransforms map —
    // remove test additions so state doesn't leak between tests.
    for (const name of added.splice(0)) {
      delete builtInTransforms[name];
    }
  });

  it("hasTransform reports built-ins and rejects unknowns", () => {
    expect(hasTransform("slug")).toBe(true);
    expect(hasTransform("currency")).toBe(true);
    expect(hasTransform("nope")).toBe(false);
    expect(hasTransform("")).toBe(false);
  });

  it("a registered custom transform becomes resolvable and applicable", () => {
    added.push("shout");
    registerTransform("shout", (v) => `${String(v).toUpperCase()}!`);

    expect(hasTransform("shout")).toBe(true);
    expect(getTransformFunction("shout")).toBeTypeOf("function");
    expect(applyTransform("hey", "shout")).toBe("HEY!");
  });

  it("registering over a built-in name overrides the combined registry but not the group export", () => {
    const original = builtInTransforms.uppercase;
    registerTransform("uppercase", () => "OVERRIDDEN");
    try {
      expect(applyTransform("x", "uppercase")).toBe("OVERRIDDEN");
      // The per-group export is a separate object — untouched.
      expect(stringTransforms.uppercase("x")).toBe("X");
    } finally {
      builtInTransforms.uppercase = original;
    }
  });
});
