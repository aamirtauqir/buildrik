/**
 * B5 semantic-kind utilities (lock 2026-05-16).
 *
 * Pure functions for classifying tokens by their semantic role and filtering
 * by editor mode (Beginner shows only semantics; Pro shows both). See
 * types.ts SemanticKind for the role axis definition + token-design spec §B5.
 */
import type { DesignToken } from "../types";

export type EditorMode = "beginner" | "pro";

/** A semantic token has `semanticKind` set. Otherwise it is a primitive. */
export function tokenIsSemantic(token: DesignToken): boolean {
  return token.semanticKind !== undefined;
}

/**
 * Filter tokens by editor mode.
 *
 *   - `"pro"` returns all tokens (primitives + semantics).
 *   - `"beginner"` returns only semantic tokens (those with `semanticKind` set).
 *
 * Beginner mode hides the raw primitive layer so novices see only intent-named
 * tokens like `action.default` and `surface.card`, not implementation-named
 * tokens like `color.brand.primary`.
 */
export function filterTokensByMode(
  tokens: readonly DesignToken[],
  mode: EditorMode,
): DesignToken[] {
  if (mode === "pro") return [...tokens];
  return tokens.filter(tokenIsSemantic);
}
