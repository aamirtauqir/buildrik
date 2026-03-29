/**
 * CSS Gradient Parsing
 * Parse and serialize CSS gradients
 *
 * @module utils/parsers/gradientParser
 * @license BSD-3-Clause
 */

import { rgbToString } from "./colorFormat";
import { parseColor } from "./colorParser";
import { RGBColor } from "./colorTypes";

// =============================================================================
// CSS GRADIENT PARSING
// =============================================================================

export interface GradientStop {
  color: RGBColor;
  position?: number; // 0-100
}

export interface LinearGradient {
  type: "linear";
  angle: number; // degrees
  stops: GradientStop[];
}

export interface RadialGradient {
  type: "radial";
  shape: "circle" | "ellipse";
  position: { x: number; y: number };
  stops: GradientStop[];
}

export interface ConicGradient {
  type: "conic";
  angle: number;
  position: { x: number; y: number };
  stops: GradientStop[];
}

export type CSSGradient = LinearGradient | RadialGradient | ConicGradient;

/**
 * Parse CSS gradient string
 */
export function parseGradient(gradient: string): CSSGradient | null {
  const trimmed = gradient.trim().toLowerCase();

  // Linear gradient
  const linearMatch = trimmed.match(/^linear-gradient\((.+)\)$/);
  if (linearMatch) {
    return parseLinearGradient(linearMatch[1]);
  }

  // Radial gradient
  const radialMatch = trimmed.match(/^radial-gradient\((.+)\)$/);
  if (radialMatch) {
    return parseRadialGradient(radialMatch[1]);
  }

  // Conic gradient
  const conicMatch = trimmed.match(/^conic-gradient\((.+)\)$/);
  if (conicMatch) {
    return parseConicGradient(conicMatch[1]);
  }

  return null;
}

function parseLinearGradient(content: string): LinearGradient | null {
  const parts = splitGradientParts(content);
  if (parts.length === 0) return null;

  let angle = 180; // default: to bottom
  let startIndex = 0;

  // Parse angle or direction
  const first = parts[0].trim();
  if (first.endsWith("deg")) {
    angle = parseFloat(first);
    startIndex = 1;
  } else if (first.startsWith("to ")) {
    angle = parseDirection(first.slice(3));
    startIndex = 1;
  }

  const stops = parseGradientStops(parts.slice(startIndex));
  if (stops.length < 2) return null;

  return { type: "linear", angle, stops };
}

function parseRadialGradient(content: string): RadialGradient | null {
  const parts = splitGradientParts(content);
  if (parts.length === 0) return null;

  let shape: "circle" | "ellipse" = "ellipse";
  let position = { x: 50, y: 50 };
  let startIndex = 0;

  // Check for shape/position
  const first = parts[0].trim().toLowerCase();
  if (first.includes("circle") || first.includes("ellipse") || first.includes("at")) {
    if (first.includes("circle")) shape = "circle";
    const atMatch = first.match(/at\s+(.+)/);
    if (atMatch) {
      position = parsePosition(atMatch[1]);
    }
    startIndex = 1;
  }

  const stops = parseGradientStops(parts.slice(startIndex));
  if (stops.length < 2) return null;

  return { type: "radial", shape, position, stops };
}

function parseConicGradient(content: string): ConicGradient | null {
  const parts = splitGradientParts(content);
  if (parts.length === 0) return null;

  let angle = 0;
  let position = { x: 50, y: 50 };
  let startIndex = 0;

  // Check for angle/position
  const first = parts[0].trim().toLowerCase();
  if (first.includes("from") || first.includes("at")) {
    const fromMatch = first.match(/from\s+([\d.]+)deg/);
    if (fromMatch) angle = parseFloat(fromMatch[1]);
    const atMatch = first.match(/at\s+(.+)/);
    if (atMatch) position = parsePosition(atMatch[1]);
    startIndex = 1;
  }

  const stops = parseGradientStops(parts.slice(startIndex));
  if (stops.length < 2) return null;

  return { type: "conic", angle, position, stops };
}

function splitGradientParts(content: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (const char of content) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseDirection(dir: string): number {
  const directions: Record<string, number> = {
    top: 0,
    right: 90,
    bottom: 180,
    left: 270,
    "top right": 45,
    "right top": 45,
    "bottom right": 135,
    "right bottom": 135,
    "bottom left": 225,
    "left bottom": 225,
    "top left": 315,
    "left top": 315,
  };
  return directions[dir.trim()] ?? 180;
}

function parsePosition(pos: string): { x: number; y: number } {
  const parts = pos.trim().split(/\s+/);
  const keywords: Record<string, number> = {
    left: 0,
    center: 50,
    right: 100,
    top: 0,
    bottom: 100,
  };

  let x = 50,
    y = 50;

  if (parts.length >= 1) {
    x = keywords[parts[0]] ?? (parseFloat(parts[0]) || 50);
  }
  if (parts.length >= 2) {
    y = keywords[parts[1]] ?? (parseFloat(parts[1]) || 50);
  }

  return { x, y };
}

function parseGradientStops(parts: string[]): GradientStop[] {
  const stops: GradientStop[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    const posMatch = trimmed.match(/([\d.]+)%\s*$/);
    const colorStr = posMatch ? trimmed.slice(0, -posMatch[0].length).trim() : trimmed;
    const color = parseColor(colorStr);

    if (color) {
      stops.push({
        color,
        position: posMatch ? parseFloat(posMatch[1]) : undefined,
      });
    }
  }

  // Fill in missing positions
  if (stops.length >= 2) {
    if (stops[0].position === undefined) stops[0].position = 0;
    if (stops[stops.length - 1].position === undefined) {
      stops[stops.length - 1].position = 100;
    }

    // Interpolate middle positions
    let lastPos = 0;
    for (let i = 1; i < stops.length; i++) {
      if (stops[i].position === undefined) {
        // Find next defined position
        let nextPos = 100;
        let nextIdx = stops.length - 1;
        for (let j = i + 1; j < stops.length; j++) {
          if (stops[j].position !== undefined) {
            nextPos = stops[j].position!;
            nextIdx = j;
            break;
          }
        }
        // Interpolate
        const step = (nextPos - lastPos) / (nextIdx - i + 1);
        stops[i].position = lastPos + step;
      }
      lastPos = stops[i].position!;
    }
  }

  return stops;
}

/**
 * Serialize gradient to CSS string
 */
export function serializeGradient(gradient: CSSGradient): string {
  const stopsStr = gradient.stops
    .map((s) => `${rgbToString(s.color)}${s.position !== undefined ? ` ${s.position}%` : ""}`)
    .join(", ");

  switch (gradient.type) {
    case "linear":
      return `linear-gradient(${gradient.angle}deg, ${stopsStr})`;
    case "radial":
      return `radial-gradient(${gradient.shape} at ${gradient.position.x}% ${gradient.position.y}%, ${stopsStr})`;
    case "conic":
      return `conic-gradient(from ${gradient.angle}deg at ${gradient.position.x}% ${gradient.position.y}%, ${stopsStr})`;
  }
}
