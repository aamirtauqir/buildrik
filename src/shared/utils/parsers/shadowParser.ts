/**
 * CSS Box Shadow Parsing
 * Parse and serialize CSS box shadows
 *
 * @module utils/parsers/shadowParser
 * @license BSD-3-Clause
 */

import { rgbToString } from "./colorFormat";
import { parseColor } from "./colorParser";
import { RGBColor } from "./colorTypes";
import { splitCSSProperties } from "./cssParser";

// =============================================================================
// CSS BOX SHADOW PARSING
// =============================================================================

export interface BoxShadow {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spreadRadius: number;
  color: RGBColor;
  inset: boolean;
}

/**
 * Parse CSS box-shadow value
 */
export function parseBoxShadow(shadow: string): BoxShadow[] {
  const shadows: BoxShadow[] = [];
  const parts = splitCSSProperties(shadow.replace(/,(?![^(]*\))/g, ";"));

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const isInset = trimmed.toLowerCase().startsWith("inset");
    const values = trimmed.replace(/^inset\s*/i, "").trim();

    // Extract color (can be at start or end)
    let color: RGBColor = { r: 0, g: 0, b: 0 };
    let remaining = values;

    // Try to find color at the end
    const colorPatterns = [
      /\s+(rgba?\([^)]+\))\s*$/i,
      /\s+(hsla?\([^)]+\))\s*$/i,
      /\s+(#[0-9a-f]{3,8})\s*$/i,
      /\s+([a-z]+)\s*$/i,
    ];

    for (const pattern of colorPatterns) {
      const match = remaining.match(pattern);
      if (match) {
        const parsed = parseColor(match[1]);
        if (parsed) {
          color = parsed;
          remaining = remaining.slice(0, -match[0].length).trim();
          break;
        }
      }
    }

    // Parse numeric values
    const nums = remaining.match(/[-\d.]+(?:px)?/g) || [];
    const values2 = nums.map((n) => parseFloat(n));

    if (values2.length >= 2) {
      shadows.push({
        offsetX: values2[0] || 0,
        offsetY: values2[1] || 0,
        blurRadius: values2[2] || 0,
        spreadRadius: values2[3] || 0,
        color,
        inset: isInset,
      });
    }
  }

  return shadows;
}

/**
 * Serialize box shadows to CSS string
 */
export function serializeBoxShadow(shadows: BoxShadow[]): string {
  return shadows
    .map((s) => {
      const parts = [
        s.inset ? "inset" : "",
        `${s.offsetX}px`,
        `${s.offsetY}px`,
        `${s.blurRadius}px`,
        `${s.spreadRadius}px`,
        rgbToString(s.color),
      ].filter(Boolean);
      return parts.join(" ");
    })
    .join(", ");
}
