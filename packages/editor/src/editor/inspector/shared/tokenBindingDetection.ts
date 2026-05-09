/**
 * Token Binding Detection
 *
 * Pure helpers for detecting whether an Inspector control's value is bound to
 * a design-system token (rendered as `var(--buildrick-design-<id>)` in the
 * style payload) and recovering the token id. Mirrors the forward conversion
 * `tokenToCssVar(id)` in `editor/design-system/types.ts`.
 *
 * Used by `ColorInput`, `SpacingControls`, and any future inspector control
 * that participates in token binding (spec §6.4).
 *
 * @license BSD-3-Clause
 */

const TOKEN_VAR_PATTERN = /^var\((--buildrick-design-[^)]+)\)$/;
const TOKEN_VAR_PREFIX = "--buildrick-design-";

/** True when the value is a `var(--buildrick-design-...)` reference. */
export function isTokenVar(value: string): boolean {
  return TOKEN_VAR_PATTERN.test(value);
}

/**
 * Pull the CSS variable name out of a token `var()` expression.
 * Returns null when the input is not a token var().
 */
export function extractVarName(value: string): string | null {
  const m = value.match(TOKEN_VAR_PATTERN);
  return m ? m[1] : null;
}

/**
 * Convert a CSS variable name (e.g. `--buildrick-design-color-primary`) to
 * the token id (`color-primary`). Returns null when the prefix is missing.
 */
export function cssVarToTokenId(cssVar: string): string | null {
  if (!cssVar.startsWith(TOKEN_VAR_PREFIX)) return null;
  return cssVar.slice(TOKEN_VAR_PREFIX.length);
}
