/**
 * Parse CSS shorthand values (1-4 values) into individual sides.
 * Handles margin, padding, border-radius, etc.
 */

export interface ShorthandValues {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

export function parseCssShorthand(value: string): ShorthandValues {
  if (!value) return { top: "", right: "", bottom: "", left: "" };
  const parts = value.split(" ").filter(Boolean);
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  if (parts.length === 4) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
  return { top: "", right: "", bottom: "", left: "" };
}