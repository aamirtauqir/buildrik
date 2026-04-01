/**
 * Contrast auto-fix utility — suggests adjusted foreground colors that meet WCAG AA.
 * Pure math, no side effects, no JSX.
 * @license BSD-3-Clause
 */

import { hexToHsb, hsbToHex, calcContrastRatio } from "./colorUtils";

/** Target contrast ratio for WCAG AA normal text */
const AA_TARGET = 4.5;

/**
 * Suggest a foreground color adjusted to meet a target contrast ratio against the given background.
 * Lightens or darkens the foreground while preserving hue and saturation.
 * Returns null if already meeting the target.
 */
export function suggestContrastFix(
  foreground: string,
  background: string,
  targetRatio: number = AA_TARGET
): string | null {
  const current = calcContrastRatio(foreground, background);
  if (current >= targetRatio) return null;

  const hsb = hexToHsb(foreground);
  const bgHsb = hexToHsb(background);
  const bgIsDark = bgHsb.b < 0.5;

  // Binary search for the minimum brightness adjustment that meets the target
  let lo = bgIsDark ? hsb.b : 0;
  let hi = bgIsDark ? 1 : hsb.b;

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const candidate = hsbToHex({ ...hsb, b: mid });
    const ratio = calcContrastRatio(candidate, background);
    if (ratio >= targetRatio) {
      if (bgIsDark) hi = mid;
      else lo = mid;
    } else {
      if (bgIsDark) lo = mid;
      else hi = mid;
    }
  }

  const result = hsbToHex({ ...hsb, b: bgIsDark ? hi : lo });
  // Verify fix actually works
  if (calcContrastRatio(result, background) < targetRatio) return null;
  return result;
}
