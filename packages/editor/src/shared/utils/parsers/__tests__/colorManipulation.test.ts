/**
 * parsers/colorManipulation — lighten/darken/mix/blend and friends.
 * Invalid-input fallbacks are pinned per function.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  lighten,
  darken,
  saturate,
  desaturate,
  adjustHue,
  setOpacity,
  mixColors,
  mixColorsLab,
  invertColor,
  toGrayscale,
  adjustTemperature,
  tint,
  shade,
  tone,
  blendColors,
} from "../colorManipulation";

describe("lighten / darken", () => {
  it("lightens black toward gray", () => {
    const r = lighten("#000000", 50);
    expect(r.r).toBeGreaterThan(100);
  });
  it("darkens white toward gray", () => {
    const r = darken("#ffffff", 50);
    expect(r.r).toBeLessThan(200);
  });
  it("returns white/black on invalid input", () => {
    expect(lighten("nope", 10)).toEqual({ r: 255, g: 255, b: 255 });
    expect(darken("nope", 10)).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("saturate / desaturate / adjustHue", () => {
  it("adjustHue rotates red toward green at +120deg", () => {
    const r = adjustHue("#ff0000", 120);
    expect(r.g).toBeGreaterThan(r.r);
    expect(r.g).toBeGreaterThan(r.b);
  });
  it("hue wraps negative rotations back into 0..360", () => {
    const r = adjustHue("#ff0000", -120);
    expect(r.b).toBeGreaterThan(r.r); // -120 → 240 (blue)
  });
  it("fallbacks to mid-gray on invalid input", () => {
    expect(saturate("nope", 10)).toEqual({ r: 128, g: 128, b: 128 });
    expect(desaturate("nope", 10)).toEqual({ r: 128, g: 128, b: 128 });
    expect(adjustHue("nope", 10)).toEqual({ r: 128, g: 128, b: 128 });
  });
});

describe("setOpacity", () => {
  it("sets and clamps alpha", () => {
    expect(setOpacity("#ff0000", 0.5)).toMatchObject({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(setOpacity("#ff0000", 2).a).toBe(1);
    expect(setOpacity("#ff0000", -1).a).toBe(0);
  });
  it("returns black-with-alpha on invalid input", () => {
    expect(setOpacity("nope", 0.3)).toEqual({ r: 0, g: 0, b: 0, a: 0.3 });
  });
});

describe("mixColors / mixColorsLab", () => {
  it("mixes 50/50 in RGB space", () => {
    expect(mixColors({ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 })).toMatchObject({
      r: 128,
      g: 0,
      b: 128,
    });
  });
  it("returns the other color when one side is invalid", () => {
    expect(mixColors("nope", { r: 1, g: 2, b: 3 })).toEqual({ r: 1, g: 2, b: 3 });
    expect(mixColors({ r: 1, g: 2, b: 3 }, "nope")).toEqual({ r: 1, g: 2, b: 3 });
  });
  it("blends alpha when either side carries it", () => {
    const r = mixColors({ r: 0, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 0, a: 1 }, 0.5);
    expect(r.a).toBeCloseTo(0.5);
  });
  it("mixColorsLab returns a valid RGB triple", () => {
    const r = mixColorsLab("#ff0000", "#0000ff", 0.5);
    expect(typeof r.r).toBe("number");
    expect(r.r).toBeGreaterThanOrEqual(0);
    expect(r.r).toBeLessThanOrEqual(255);
  });
});

describe("invertColor / toGrayscale / adjustTemperature", () => {
  it("inverts channels", () => {
    expect(invertColor({ r: 0, g: 0, b: 0 })).toMatchObject({ r: 255, g: 255, b: 255 });
    expect(invertColor("nope")).toEqual({ r: 255, g: 255, b: 255 });
  });
  it("grayscales via luminance", () => {
    expect(toGrayscale({ r: 255, g: 0, b: 0 })).toMatchObject({ r: 76, g: 76, b: 76 });
    expect(toGrayscale("nope")).toEqual({ r: 128, g: 128, b: 128 });
  });
  it("warms and cools with temperature", () => {
    const warm = adjustTemperature({ r: 100, g: 100, b: 100 }, 100);
    expect(warm.r).toBeGreaterThan(100);
    expect(warm.b).toBeLessThan(100);
    expect(adjustTemperature("nope", 10)).toEqual({ r: 128, g: 128, b: 128 });
  });
});

describe("tint / shade / tone", () => {
  it("tint at 100% is white, shade at 100% is black, tone at 100% is gray", () => {
    expect(tint("#123456", 100)).toMatchObject({ r: 255, g: 255, b: 255 });
    expect(shade("#123456", 100)).toMatchObject({ r: 0, g: 0, b: 0 });
    expect(tone("#123456", 100)).toMatchObject({ r: 128, g: 128, b: 128 });
  });
});

describe("blendColors", () => {
  it("multiply of white over black is black", () => {
    expect(blendColors({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, "multiply")).toMatchObject(
      { r: 0, g: 0, b: 0 }
    );
  });
  it("screen of white over black is white", () => {
    expect(blendColors({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, "screen")).toMatchObject({
      r: 255,
      g: 255,
      b: 255,
    });
  });
  it("difference of white over black is white", () => {
    expect(
      blendColors({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, "difference")
    ).toMatchObject({ r: 255, g: 255, b: 255 });
  });
  it("normal mode with full opacity returns the base color", () => {
    expect(blendColors({ r: 10, g: 20, b: 30 }, { r: 200, g: 200, b: 200 }, "normal")).toMatchObject(
      { r: 10, g: 20, b: 30 }
    );
  });
  it("returns the present side when the other is invalid", () => {
    expect(blendColors("nope", { r: 1, g: 2, b: 3 })).toEqual({ r: 1, g: 2, b: 3 });
    expect(blendColors({ r: 1, g: 2, b: 3 }, "nope")).toEqual({ r: 1, g: 2, b: 3 });
  });
});
