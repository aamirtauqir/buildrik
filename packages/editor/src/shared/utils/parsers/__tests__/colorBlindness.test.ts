/**
 * colorBlindness tests — simulation matrices, achromatopsia grayscale,
 * partial mixes, and input handling.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { simulateColorBlindness, type ColorBlindnessType } from "../colorBlindness";

const RED = { r: 255, g: 0, b: 0 };
const BLUE = { r: 0, g: 0, b: 255 };

describe("simulateColorBlindness — input handling", () => {
  it("returns mid-gray for unparseable color strings", () => {
    expect(simulateColorBlindness("junk", "protanopia")).toEqual({ r: 128, g: 128, b: 128 });
  });

  it("accepts color strings", () => {
    expect(simulateColorBlindness("#ff0000", "protanopia")).toEqual(
      simulateColorBlindness(RED, "protanopia")
    );
  });

  it("preserves alpha", () => {
    expect(simulateColorBlindness({ ...RED, a: 0.5 }, "deuteranopia").a).toBe(0.5);
  });

  it("returns the input unchanged for an unknown matrix type", () => {
    expect(simulateColorBlindness(RED, "unknown" as ColorBlindnessType)).toEqual(RED);
  });
});

describe("achromatopsia / achromatomaly", () => {
  it("achromatopsia converts to perceptual grayscale (r=g=b)", () => {
    const gray = simulateColorBlindness(RED, "achromatopsia");
    // 255 * 0.299 = 76.245 → 76
    expect(gray).toEqual({ r: 76, g: 76, b: 76, a: undefined });
  });

  it("achromatomaly mixes 50/50 with the grayscale version", () => {
    const partial = simulateColorBlindness(RED, "achromatomaly");
    // r: round(255*0.5 + 76*0.5) = round(165.5) = 166; g/b: round(38) = 38
    expect(partial).toEqual({ r: 166, g: 38, b: 38, a: undefined });
  });
});

describe("dichromacy matrices — pinned outputs for pure channels", () => {
  it("protanopia collapses pure red toward yellow-brown", () => {
    // [0.567, 0.433, 0] rows applied to (1, 0, 0)
    expect(simulateColorBlindness(RED, "protanopia")).toEqual({
      r: Math.round(0.567 * 255),
      g: Math.round(0.558 * 255),
      b: 0,
      a: undefined,
    });
  });

  it("deuteranopia shifts pure red", () => {
    expect(simulateColorBlindness(RED, "deuteranopia")).toEqual({
      r: Math.round(0.625 * 255),
      g: Math.round(0.7 * 255),
      b: 0,
      a: undefined,
    });
  });

  it("tritanopia shifts pure blue toward cyan", () => {
    expect(simulateColorBlindness(BLUE, "tritanopia")).toEqual({
      r: 0,
      g: Math.round(0.567 * 255),
      b: Math.round(0.525 * 255),
      a: undefined,
    });
  });

  it("anomalous trichromacy variants are milder than the -opia forms", () => {
    const opia = simulateColorBlindness(RED, "protanopia");
    const omaly = simulateColorBlindness(RED, "protanomaly");
    // protanomaly keeps more of the red channel than protanopia
    expect(omaly.r).toBeGreaterThan(opia.r);
  });

  it("white is invariant under every matrix (rows sum to 1)", () => {
    const white = { r: 255, g: 255, b: 255 };
    const types: ColorBlindnessType[] = [
      "protanopia",
      "protanomaly",
      "deuteranopia",
      "deuteranomaly",
      "tritanopia",
      "tritanomaly",
    ];
    for (const t of types) {
      expect(simulateColorBlindness(white, t)).toMatchObject(white);
    }
  });
});
