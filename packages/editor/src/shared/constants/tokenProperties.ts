/**
 * Which style properties are token-bound, and by which token kind (spec §3).
 * One map for two readers: the insert test (no raw value may remain in these
 * properties) and Connect to tokens (a raw value is matched only against
 * tokens of the property's kind — colour to colour, spacing to spacing).
 * font-weight and line-height stay raw in 1b (owner, OQ-3).
 *
 * @license BSD-3-Clause
 */
import type { TokenKind } from "@buildrik/shared/schemas/designToken";

const sides = (base: string) => [base, `${base}-top`, `${base}-right`, `${base}-bottom`, `${base}-left`];

export const TOKENIZED_PROPERTIES: Readonly<Record<string, TokenKind>> = Object.freeze({
  ...Object.fromEntries(
    ["color", "background-color", "outline-color", "fill", "stroke", "text-decoration-color", ...sides("border").map((p) => `${p}-color`)]
      .map((p) => [p, "color" as const]),
  ),
  "font-family": "type",
  "font-size": "type",
  ...Object.fromEntries([...sides("padding"), ...sides("margin"), "gap", "row-gap", "column-gap"].map((p) => [p, "spacing" as const])),
  ...Object.fromEntries(
    ["border-radius", "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius"]
      .map((p) => [p, "radius" as const]),
  ),
  "box-shadow": "shadow",
});

/** Literals that are not brand decisions and stay raw. */
export const RAW_VALUE_ALLOWED: ReadonlySet<string> = new Set([
  "0", "0px", "auto", "100%", "inherit", "initial", "unset", "none", "transparent", "currentcolor",
]);

/** A colour literal anywhere in a value (shorthands included). */
export const COLOR_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(|\b(?:white|black)\b/;
