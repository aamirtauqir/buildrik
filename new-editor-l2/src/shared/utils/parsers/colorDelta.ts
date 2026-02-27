/**
 * Color Delta E Calculations
 * Perceptual color difference algorithms
 *
 * @module utils/parsers/colorDelta
 * @license BSD-3-Clause
 */

import { rgbToLab } from "./colorConversion";
import { parseColor, ensureRgb } from "./colorParser";
import { RGBColor, NAMED_COLORS } from "./colorTypes";

// =============================================================================
// DELTA E (COLOR DIFFERENCE)
// =============================================================================

/**
 * Calculate Delta E (CIE76) - perceptual color difference
 * < 1.0: Not perceptible
 * 1-2: Perceptible through close observation
 * 2-10: Perceptible at a glance
 * 11-49: Colors are more similar than opposite
 * 100: Exact opposite
 */
export function deltaE(color1: RGBColor | string, color2: RGBColor | string): number {
  const rgb1 = ensureRgb(color1);
  const rgb2 = ensureRgb(color2);
  if (!rgb1 || !rgb2) return 100;

  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);

  const dL = lab1.l - lab2.l;
  const dA = lab1.a - lab2.a;
  const dB = lab1.b - lab2.b;

  return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

/**
 * Calculate Delta E 2000 (more accurate perceptual difference)
 */
export function deltaE2000(color1: RGBColor | string, color2: RGBColor | string): number {
  const rgb1 = ensureRgb(color1);
  const rgb2 = ensureRgb(color2);
  if (!rgb1 || !rgb2) return 100;

  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);

  // CIEDE2000 implementation
  const kL = 1,
    kC = 1,
    kH = 1;

  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const Cab = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cab, 7) / (Math.pow(Cab, 7) + Math.pow(25, 7))));

  const a1p = lab1.a * (1 + G);
  const a2p = lab2.a * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + lab1.b * lab1.b);
  const C2p = Math.sqrt(a2p * a2p + lab2.b * lab2.b);

  const h1p = Math.atan2(lab1.b, a1p) * (180 / Math.PI);
  const h2p = Math.atan2(lab2.b, a2p) * (180 / Math.PI);
  const h1pMod = h1p < 0 ? h1p + 360 : h1p;
  const h2pMod = h2p < 0 ? h2p + 360 : h2p;

  const dLp = lab2.l - lab1.l;
  const dCp = C2p - C1p;

  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2pMod - h1pMod) <= 180) {
    dhp = h2pMod - h1pMod;
  } else if (h2pMod - h1pMod > 180) {
    dhp = h2pMod - h1pMod - 360;
  } else {
    dhp = h2pMod - h1pMod + 360;
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);

  const Lp = (lab1.l + lab2.l) / 2;
  const Cp = (C1p + C2p) / 2;

  let Hp: number;
  if (C1p * C2p === 0) {
    Hp = h1pMod + h2pMod;
  } else if (Math.abs(h1pMod - h2pMod) <= 180) {
    Hp = (h1pMod + h2pMod) / 2;
  } else if (h1pMod + h2pMod < 360) {
    Hp = (h1pMod + h2pMod + 360) / 2;
  } else {
    Hp = (h1pMod + h2pMod - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos(((Hp - 30) * Math.PI) / 180) +
    0.24 * Math.cos((2 * Hp * Math.PI) / 180) +
    0.32 * Math.cos(((3 * Hp + 6) * Math.PI) / 180) -
    0.2 * Math.cos(((4 * Hp - 63) * Math.PI) / 180);

  const dTheta = 30 * Math.exp(-Math.pow((Hp - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(Cp, 7) / (Math.pow(Cp, 7) + Math.pow(25, 7)));
  const SL = 1 + (0.015 * Math.pow(Lp - 50, 2)) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
  const SC = 1 + 0.045 * Cp;
  const SH = 1 + 0.015 * Cp * T;
  const RT = -Math.sin((2 * dTheta * Math.PI) / 180) * RC;

  return Math.sqrt(
    Math.pow(dLp / (kL * SL), 2) +
      Math.pow(dCp / (kC * SC), 2) +
      Math.pow(dHp / (kH * SH), 2) +
      RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );
}

// =============================================================================
// NAMED COLOR MATCHING
// =============================================================================

/**
 * Find the closest named CSS color
 */
export function findClosestNamedColor(color: RGBColor | string): {
  name: string;
  color: string;
  distance: number;
} {
  const rgb = ensureRgb(color);
  if (!rgb) return { name: "black", color: "#000000", distance: 100 };

  let closest = { name: "black", color: "#000000", distance: Infinity };

  for (const [name, hex] of Object.entries(NAMED_COLORS)) {
    if (name === "transparent" || name === "currentcolor") continue;

    const namedRgb = parseColor(hex);
    if (!namedRgb) continue;

    const distance = deltaE(rgb, namedRgb);
    if (distance < closest.distance) {
      closest = { name, color: hex, distance };
    }
  }

  return closest;
}

// =============================================================================
// COLOR VALIDATION
// =============================================================================

/**
 * Check if two colors are equal (with optional tolerance)
 */
export function colorsEqual(
  color1: RGBColor | string,
  color2: RGBColor | string,
  tolerance: number = 0
): boolean {
  const rgb1 = ensureRgb(color1);
  const rgb2 = ensureRgb(color2);

  if (!rgb1 || !rgb2) return false;

  if (tolerance === 0) {
    return (
      rgb1.r === rgb2.r && rgb1.g === rgb2.g && rgb1.b === rgb2.b && (rgb1.a ?? 1) === (rgb2.a ?? 1)
    );
  }

  return deltaE(rgb1, rgb2) <= tolerance;
}
