/**
 * Number helper tests — clamping, interpolation, rounding, random bounds,
 * formatting, and aggregation.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  clamp,
  parseNumericValue,
  inRange,
  lerp,
  inverseLerp,
  mapRange,
  round,
  random,
  randomInt,
  percentage,
  formatNumber,
  formatBytes,
  parseNumber,
  sum,
  average,
  min,
  max,
} from "../number";

describe("clamp / inRange", () => {
  it("clamps below, inside, and above the range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("inRange is inclusive on both bounds", () => {
    expect(inRange(0, 0, 10)).toBe(true);
    expect(inRange(10, 0, 10)).toBe(true);
    expect(inRange(10.001, 0, 10)).toBe(false);
    expect(inRange(-0.001, 0, 10)).toBe(false);
  });
});

describe("parseNumericValue", () => {
  it("parses leading numbers out of CSS values", () => {
    expect(parseNumericValue("10px")).toBe(10);
    expect(parseNumericValue("-2.5rem")).toBe(-2.5);
  });

  it("returns 0 for non-numeric input", () => {
    expect(parseNumericValue("auto")).toBe(0);
    expect(parseNumericValue("")).toBe(0);
  });
});

describe("interpolation", () => {
  it("lerp interpolates linearly (incl. extrapolation)", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 1.5)).toBe(15);
  });

  it("inverseLerp recovers t from a value", () => {
    expect(inverseLerp(0, 10, 5)).toBe(0.5);
    expect(inverseLerp(10, 20, 10)).toBe(0);
  });

  it("mapRange remaps between ranges", () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    expect(mapRange(0, 0, 10, 100, 200)).toBe(100);
    expect(mapRange(10, 0, 10, 100, 200)).toBe(200);
  });
});

describe("round", () => {
  it("rounds to integer by default", () => {
    expect(round(2.4)).toBe(2);
    expect(round(2.5)).toBe(3);
  });

  it("rounds to N decimal places", () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.2355, 3)).toBe(1.236);
  });
});

describe("random / randomInt", () => {
  it("random stays within [min, max)", () => {
    for (let i = 0; i < 50; i++) {
      const v = random(5, 6);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(6);
    }
  });

  it("random defaults to [0, 1)", () => {
    const v = random();
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThan(1);
  });

  it("randomInt is an inclusive integer range", () => {
    const seen = new Set<number>();
    for (let i = 0; i < 200; i++) {
      const v = randomInt(1, 3);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    // With 200 draws over {1,2,3} all values should appear.
    expect(seen).toEqual(new Set([1, 2, 3]));
  });
});

describe("percentage", () => {
  it("computes value/total * 100", () => {
    expect(percentage(25, 100)).toBe(25);
    expect(percentage(1, 3)).toBeCloseTo(33.333, 3);
  });

  it("returns 0 when total is 0 (no division by zero)", () => {
    expect(percentage(5, 0)).toBe(0);
  });
});

describe("formatNumber / formatBytes / parseNumber", () => {
  it("formatNumber uses locale grouping", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(0.5, { style: "percent" })).toBe("50%");
  });

  it("formatBytes picks the right unit and trims decimals", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(512)).toBe("512 Bytes");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1073741824)).toBe("1 GB");
  });

  it("formatBytes respects the decimals parameter", () => {
    expect(formatBytes(1234, 0)).toBe("1 KB");
    expect(formatBytes(1234, 3)).toBe("1.205 KB");
  });

  it("parseNumber strips formatting characters", () => {
    expect(parseNumber("$1,234.56")).toBe(1234.56);
    expect(parseNumber("-42px")).toBe(-42);
  });
});

describe("aggregation", () => {
  it("sum adds all values (0 for empty)", () => {
    expect(sum([1, 2, 3])).toBe(6);
    expect(sum([])).toBe(0);
  });

  it("average divides by length (0 for empty — no NaN)", () => {
    expect(average([2, 4, 6])).toBe(4);
    expect(average([])).toBe(0);
  });

  it("min/max delegate to Math over the array", () => {
    expect(min([3, 1, 2])).toBe(1);
    expect(max([3, 1, 2])).toBe(3);
  });
});
