/**
 * AI design-token value guard (W4 set-token).
 *
 * A token value written by the AI lands in `projectSettings.designTokens` and is
 * applied as a CSS custom property. This is the trust boundary: the model output
 * is untrusted, so every value is validated by the token's `type` (the
 * value-format axis) before it can be written.
 *
 * Shared by the engine write (`composer.designSystem.setDesignToken`) and the
 * client-side command re-validation (`applySetToken`). The server has its own
 * mirror of these rules (cross-package boundary; same pattern as set-page-setting).
 */

/**
 * The TokenTypes the AI may edit (v1). `shadow` (composite multi-part value) and
 * `select` (enumerated, needs the token's `options`) are excluded — they can't be
 * value-validated from a free string alone.
 */
export const AI_EDITABLE_TOKEN_TYPES: ReadonlySet<string> = new Set([
  "color",
  "length",
  "font-size",
  "font-family",
  "number",
  "string",
]);

// CSS custom-property values are substituted via var() (no declaration breakout),
// but url()/@import can still load attacker resources and markup/braces/semicolons
// have no place in a single token value — reject them outright.
const UNSAFE_TOKEN_VALUE = /url\(|expression\(|javascript:|@import|[<>{};]/i;

const COLOR_RE = /^(?:#[0-9a-fA-F]{3,8}|rgba?\([\d.,\s%]+\)|hsla?\([\d.,\s%]+\)|[a-zA-Z]+)$/;
const LENGTH_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|%|vh|vw|vmin|vmax|ch|ex|fr|pt)?$/;
const NUMBER_RE = /^-?(?:\d+\.?\d*|\.\d+)$/;
const FONT_RE = /^[a-zA-Z0-9 ,'"\-]+$/;

const MAX_TOKEN_VALUE_LEN = 120;

/**
 * True when `value` is a safe, well-formed value for a token of the given
 * `type`. Unknown / non-editable types return false.
 */
export function isAiEditableTokenValue(type: string | undefined, value: string): boolean {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > MAX_TOKEN_VALUE_LEN) return false;
  if (UNSAFE_TOKEN_VALUE.test(value)) return false;
  switch (type) {
    case "color":
      return COLOR_RE.test(value);
    case "length":
    case "font-size":
      return LENGTH_RE.test(value);
    case "number":
      return NUMBER_RE.test(value);
    case "font-family":
    case "string":
      return FONT_RE.test(value);
    default:
      return false;
  }
}
