// packages/shared/tokens/resolve.ts
import type { DesignToken, TokenRef } from "../schemas/design-tokens";

/** The literal a token resolves to in a mode, following aliases. Dark falls
 *  back to light at every hop. Returns null for a missing id or a cycle. */
export function resolveTokenLiteral(
  tokens: readonly DesignToken[],
  id: string,
  mode: "light" | "dark",
): string | null {
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const seen = new Set<string>();
  let cur = byId.get(id);
  while (cur) {
    if (seen.has(cur.id)) return null;
    seen.add(cur.id);
    const ref: TokenRef = (mode === "dark" && cur.modes.dark) || cur.modes.light;
    if ("value" in ref) return ref.value;
    cur = byId.get(ref.alias);
  }
  return null;
}

/** Writes a literal for a token in a mode. A semantic token aliasing a
 *  primitive writes through to that primitive only if no other token aliases
 *  it; otherwise it gets its own literal so siblings do not change. */
export function setTokenLiteral(
  tokens: readonly DesignToken[],
  id: string,
  mode: "light" | "dark",
  value: string,
): DesignToken[] {
  const t = tokens.find((x) => x.id === id);
  if (!t) return [...tokens];
  if (t.layer === "primitive") {
    return tokens.map((x) => (x.id === id ? { ...x, modes: { light: { value } } } : x));
  }
  return tokens.map((x) => (x.id === id ? { ...x, modes: { ...x.modes, [mode]: { value } } } : x));
}
