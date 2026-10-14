/**
 * contrastFix — resolves a LintIssue `autoFixHint` into the next hex value.
 *
 * Two hints exist:
 *   - `contrast:<surface hex>` — search the token's colour to WCAG AA (4.5)
 *     against that surface (`suggestContrastFix`, the one contrast algorithm).
 *   - `set:<hex>` — replace the value outright (pure black → the ink scale).
 *
 * Until DQ-010 the hints were `darken-22` / `lighten-22`: a fixed ±22% HSL
 * lightness shift that never checked the result, so Fix › could report a token
 * fixed while it still failed AA. An unknown hint (including a stale one of
 * those) returns the value unchanged, which `applyAutoFix` reads as "nothing
 * to fix".
 *
 * @module engine/designSystem/contrastFix
 * @license BSD-3-Clause
 */

import { hexToRgb, suggestContrastFix } from "./colorMath";

const CONTRAST = "contrast:";
const SET = "set:";

/** The hint a contrast finding carries: fix against this surface. */
export function contrastHint(surfaceHex: string): string {
  return `${CONTRAST}${surfaceHex}`;
}

/** The hint that replaces a value outright. */
export function setHint(hex: string): string {
  return `${SET}${hex}`;
}

export function applyContrastFix(value: string, hint: string): string {
  if (!hexToRgb(value)) return value;
  if (hint.startsWith(CONTRAST)) {
    const surface = hint.slice(CONTRAST.length);
    if (!hexToRgb(surface)) return value;
    return suggestContrastFix(value, surface) ?? value;
  }
  if (hint.startsWith(SET)) {
    const next = hint.slice(SET.length);
    return hexToRgb(next) ? next.toUpperCase() : value;
  }
  return value;
}
