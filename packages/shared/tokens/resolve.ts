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

/** The id a token's light mode aliases, or undefined when it holds a literal. */
export function lightAliasOf(token: DesignToken): string | undefined {
  return "alias" in token.modes.light ? token.modes.light.alias : undefined;
}

/** Writes a literal for a token in a mode. A semantic token gets its own
 *  literal in that mode (replacing any alias there), so tokens that alias the
 *  same primitive do not change. A primitive has exactly one (light) literal,
 *  so a dark write to one is a no-op rather than an overwrite of its light
 *  value. */
export function setTokenLiteral(
  tokens: readonly DesignToken[],
  id: string,
  mode: "light" | "dark",
  value: string,
): DesignToken[] {
  const t = tokens.find((x) => x.id === id);
  if (!t) return [...tokens];
  if (t.layer === "primitive") {
    if (mode === "dark") return [...tokens];
    return tokens.map((x) => (x.id === id ? { ...x, modes: { light: { value } } } : x));
  }
  return tokens.map((x) => (x.id === id ? { ...x, modes: { ...x.modes, [mode]: { value } } } : x));
}
