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
    const ref: TokenRef = cur.replacedBy
      ? { alias: cur.replacedBy }
      : (mode === "dark" && cur.modes.dark) || cur.modes.light;
    if ("value" in ref) return ref.value;
    cur = byId.get(ref.alias);
  }
  return null;
}

/** The id a token's light mode aliases, or undefined when it holds a literal. */
export function lightAliasOf(token: DesignToken): string | undefined {
  return "alias" in token.modes.light ? token.modes.light.alias : undefined;
}

/** Writes a literal for a token in a mode.
 *
 *  A primitive takes the literal itself (light only — it has no dark mode, so a
 *  dark write is a no-op). Changing a primitive cascades to every token that
 *  aliases it: that is the v6 design (spec §2).
 *
 *  A semantic token never holds a literal after an edit and never repaints a
 *  sibling. If its mode aliases a `custom-*` primitive nothing else aliases (in
 *  any mode, its own other mode included), that primitive takes the literal; a
 *  real palette primitive is never overwritten from a semantic edit. Otherwise
 *  the token gets its own `custom-<id>` primitive (`custom-<id>-dark` for dark,
 *  reused when it is an unaliased primitive under `--buildrick-design-<that id>`;
 *  suffixed when the id or css var is taken) and its mode aliases it. */
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

  const aliasCount = (target: string) =>
    tokens.reduce(
      (n, x) => n + [x.modes.light, x.modes.dark].filter((r) => r !== undefined && "alias" in r && r.alias === target).length,
      0,
    );
  const writePrimitive = (list: readonly DesignToken[], target: string) =>
    list.map((x) => (x.id === target ? { ...x, modes: { light: { value } } } : x));

  const ref = mode === "dark" ? t.modes.dark : t.modes.light;
  const current = ref && "alias" in ref ? tokens.find((x) => x.id === ref.alias) : undefined;
  if (current && current.layer === "primitive" && current.id.startsWith("custom-") && aliasCount(current.id) === 1) {
    return writePrimitive(tokens, current.id);
  }

  const base = `custom-${id}${mode === "dark" ? "-dark" : ""}`;
  const ids = new Set(tokens.map((x) => x.id));
  const vars = new Set(tokens.map((x) => x.cssVar));
  let ownId = base;
  for (let n = 2; ; n++) {
    const existing = tokens.find((x) => x.id === ownId);
    // Its own: a primitive under its own var that nothing aliases yet (the
    // alias being replaced here is the only other reference it could have had).
    const own = existing?.layer === "primitive" && existing.cssVar === `--buildrick-design-${ownId}`;
    if (own && aliasCount(ownId) === 0) break;
    if (!ids.has(ownId) && !vars.has(`--buildrick-design-${ownId}`)) break;
    ownId = `${base}-${n}`;
  }
  const pointed = tokens.map((x) =>
    x.id === id ? { ...x, modes: { ...x.modes, [mode]: { alias: ownId } } } : x,
  );
  if (ids.has(ownId)) return writePrimitive(pointed, ownId);
  const own: DesignToken = {
    id: ownId,
    name: `${t.name}${mode === "dark" ? " (dark)" : ""}`,
    kind: t.kind,
    layer: "primitive",
    modes: { light: { value } },
    category: t.category,
    cssVar: `--buildrick-design-${ownId}`,
    type: t.type,
  };
  const at = pointed.findIndex((x) => x.id === id);
  return [...pointed.slice(0, at), own, ...pointed.slice(at)];
}
