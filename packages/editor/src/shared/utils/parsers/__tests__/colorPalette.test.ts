/**
 * parsers/colorPalette — scheme generation, gradients, and shades.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  generatePalette,
  generateGradientColors,
  generateShades,
} from "../colorPalette";

describe("generatePalette", () => {
  it("returns the expected count per scheme", () => {
    expect(generatePalette("#ff0000", "complementary")).toHaveLength(2);
    expect(generatePalette("#ff0000", "analogous")).toHaveLength(3);
    expect(generatePalette("#ff0000", "triadic")).toHaveLength(3);
    expect(generatePalette("#ff0000", "tetradic")).toHaveLength(4);
    expect(generatePalette("#ff0000", "split-complementary")).toHaveLength(3);
    expect(generatePalette("#ff0000", "double-complementary")).toHaveLength(4);
  });

  it("monochromatic honours the step count", () => {
    expect(generatePalette("#ff0000", "monochromatic")).toHaveLength(5); // default
    expect(generatePalette("#ff0000", "monochromatic", 7)).toHaveLength(7);
  });

  it("the first swatch is (approximately) the base color", () => {
    const [base] = generatePalette("#ff0000", "complementary");
    expect(base.r).toBeGreaterThan(200);
    expect(base.g).toBeLessThan(50);
  });

  it("returns [] for an invalid base color", () => {
    expect(generatePalette("nope", "triadic")).toEqual([]);
  });
});

describe("generateGradientColors", () => {
  it("returns the requested number of steps ending at the endpoints", () => {
    const colors = generateGradientColors("#000000", "#ffffff", 3, false);
    expect(colors).toHaveLength(3);
    // i=0 → weight 0 → the 'start' endpoint (black); i=last → 'end' (white)
    expect(colors[0]).toMatchObject({ r: 0, g: 0, b: 0 });
    expect(colors[2]).toMatchObject({ r: 255, g: 255, b: 255 });
  });

  it("perceptual (LAB) path also returns the right length", () => {
    expect(generateGradientColors("#ff0000", "#0000ff", 4, true)).toHaveLength(4);
  });
});

describe("generateShades", () => {
  it("returns count shades from light to dark", () => {
    const shades = generateShades("#ff0000", 9);
    expect(shades).toHaveLength(9);
    // first shade is lighter than the last
    expect(shades[0].r + shades[0].g + shades[0].b).toBeGreaterThan(
      shades[8].r + shades[8].g + shades[8].b
    );
  });

  it("returns [] for an invalid color", () => {
    expect(generateShades("nope")).toEqual([]);
  });
});
