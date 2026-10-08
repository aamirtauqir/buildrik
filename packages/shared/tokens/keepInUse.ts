// packages/shared/tokens/keepInUse.ts
/**
 * Theme push vs in-use tokens (spec §4). A push writes the workspace theme, but
 * a site-only token that the site still uses — or whose usage cannot be counted
 * — stays, with every site-only token it aliases or is replaced by, so no
 * element is left with an undefined var(). The theme owns its ids and var
 * names: a site token that would shadow either is never kept.
 */
import type { DesignToken } from "../schemas/design-tokens";
import type { TokenUsageIndex } from "./usage";

export function keepInUseSiteTokens(
  theme: readonly DesignToken[],
  site: readonly DesignToken[],
  usage: Pick<TokenUsageIndex, "count">,
): { tokens: DesignToken[]; kept: string[] } {
  const themeIds = new Set(theme.map((t) => t.id));
  const themeVars = new Set(theme.flatMap((t) => [t.cssVar, ...(t.legacyNames ?? [])]));
  const siteById = new Map(site.map((t) => [t.id, t]));
  const keep = new Set<string>();
  const visit = (id: string) => {
    const t = siteById.get(id);
    if (!t || themeIds.has(id) || keep.has(id) || themeVars.has(t.cssVar)) return;
    keep.add(id);
    for (const ref of [t.modes.light, t.modes.dark]) if (ref && "alias" in ref) visit(ref.alias);
    if (t.replacedBy) visit(t.replacedBy);
  };
  for (const t of site) if (usage.count(t.id) !== 0) visit(t.id);
  const kept = site.filter((t) => keep.has(t.id));
  return { tokens: [...theme, ...kept], kept: kept.map((t) => t.id) };
}
