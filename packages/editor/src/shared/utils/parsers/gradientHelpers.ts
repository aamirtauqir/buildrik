/**
 * Gradient UI Helpers
 * Bridge between gradientParser's internal types and the 2-stop inspector UI.
 *
 * @module utils/parsers/gradientHelpers
 * @license BSD-3-Clause
 */

import { parseGradient, serializeGradient, type CSSGradient } from "./gradientParser";
import { rgbToHex } from "./colorConversionBasic";

export interface GradientUI {
  type: "color" | "gradient" | "image";
  gradientType?: "linear" | "radial";
  angle?: number;
  color1?: string;
  color2?: string;
  color1WasVar?: boolean;
  color2WasVar?: boolean;
  isOpaque?: boolean;
}

/**
 * Derive the background type and extract simple gradient info for the 2-stop UI.
 */
export function extractGradientUI(background: string | undefined): GradientUI {
  if (!background) return { type: "color" };

  const bg = background.trim();

  if (bg.includes("url(")) return { type: "image" };

  if (bg.startsWith("var(")) return { type: "color" };

  const gradient = parseGradient(bg);
  if (!gradient) return { type: "color" };

  // More than 2 stops is opaque for the simple UI
  if (gradient.stops.length > 2) {
    return { type: "gradient", gradientType: gradient.type === "radial" ? "radial" : "linear", isOpaque: true };
  }

  const angle = gradient.type === "linear" ? gradient.angle : 0;
  const color1 = gradient.stops[0]?.color ? rgbToHex(gradient.stops[0].color) : undefined;
  const color2 = gradient.stops[1]?.color ? rgbToHex(gradient.stops[1].color) : undefined;

  return {
    type: "gradient",
    gradientType: gradient.type === "radial" ? "radial" : "linear",
    angle,
    color1,
    color2,
    color1WasVar: false,
    color2WasVar: false,
    isOpaque: false,
  };
}

/**
 * Compose a gradient string from 2-stop UI values.
 */
export function composeGradient(opts: {
  type: "linear" | "radial";
  angle: number;
  color1: string;
  color2: string;
}): string {
  if (opts.type === "radial") {
    return `radial-gradient(circle, ${opts.color1}, ${opts.color2})`;
  }
  return `linear-gradient(${opts.angle}deg, ${opts.color1}, ${opts.color2})`;
}

/**
 * Derive bgType from the current background style values.
 */
export function deriveBgType(styles: Record<string, string>): "color" | "gradient" | "image" {
  const bg = styles.background || styles["background-image"] || "";
  if (bg.includes("linear-gradient") || bg.includes("radial-gradient")) return "gradient";
  if (bg.includes("url(") || (styles["background-image"] || "").includes("url(")) return "image";
  return "color";
}
