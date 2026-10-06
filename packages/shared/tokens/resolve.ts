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
