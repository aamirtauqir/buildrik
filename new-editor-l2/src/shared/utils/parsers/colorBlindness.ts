/**
 * Color Blindness Simulation
 * Simulate how colors appear to people with various types of color blindness
 *
 * @module utils/parsers/colorBlindness
 * @license BSD-3-Clause
 */

import { toGrayscale, mixColors } from "./colorManipulation";
import { ensureRgb } from "./colorParser";
import { RGBColor } from "./colorTypes";

// =============================================================================
// COLOR BLINDNESS SIMULATION
// =============================================================================

export type ColorBlindnessType =
  | "protanopia"
  | "protanomaly" // Red-blind
  | "deuteranopia"
  | "deuteranomaly" // Green-blind
  | "tritanopia"
  | "tritanomaly" // Blue-blind
  | "achromatopsia"
  | "achromatomaly"; // Total/partial color blindness

// Color blindness simulation matrices
const CB_MATRICES: Record<string, number[][]> = {
  protanopia: [
    [0.567, 0.433, 0],
    [0.558, 0.442, 0],
    [0, 0.242, 0.758],
  ],
  protanomaly: [
    [0.817, 0.183, 0],
    [0.333, 0.667, 0],
    [0, 0.125, 0.875],
  ],
  deuteranopia: [
    [0.625, 0.375, 0],
    [0.7, 0.3, 0],
    [0, 0.3, 0.7],
  ],
  deuteranomaly: [
    [0.8, 0.2, 0],
    [0.258, 0.742, 0],
    [0, 0.142, 0.858],
  ],
  tritanopia: [
    [0.95, 0.05, 0],
    [0, 0.433, 0.567],
    [0, 0.475, 0.525],
  ],
  tritanomaly: [
    [0.967, 0.033, 0],
    [0, 0.733, 0.267],
    [0, 0.183, 0.817],
  ],
};

/**
 * Clamp and round color component
 */
function clampColor(value: number, max: number = 255): number {
  return Math.round(Math.max(0, Math.min(max, value)));
}

/**
 * Simulate how a color appears to someone with color blindness
 */
export function simulateColorBlindness(
  color: RGBColor | string,
  type: ColorBlindnessType
): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 128, g: 128, b: 128 };

  // Achromatopsia (total color blindness) - convert to grayscale
  if (type === "achromatopsia") {
    return toGrayscale(rgb);
  }

  // Achromatomaly (partial) - mix with grayscale
  if (type === "achromatomaly") {
    return mixColors(rgb, toGrayscale(rgb), 0.5);
  }

  const matrix = CB_MATRICES[type];
  if (!matrix) return rgb;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  return {
    r: clampColor((matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b) * 255),
    g: clampColor((matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b) * 255),
    b: clampColor((matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b) * 255),
    a: rgb.a,
  };
}
