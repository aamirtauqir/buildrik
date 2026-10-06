// packages/shared/tokens/usage.ts
/**
 * One pass over every source (pages, project styles, components, CMS
 * templates): count each token's direct references, then let callers ask for
 * totals through alias chains. Same two syntaxes as TokenUsageTracker.
 */
import type { DesignToken } from "../schemas/design-tokens";

const VAR_RE = /var\(\s*--buildrick-design-([a-z0-9-]+)\s*\)/gi;
const TPL_RE = /\{\{token\.([a-z0-9._-]+)\}\}/gi;

export function buildTokenUsageIndex(sources: readonly unknown[], tokens: readonly DesignToken[]) {
  const direct = new Map<string, number>();
  let unknown = false;
  for (const src of sources) {
    let text: string;
    try {
      text = JSON.stringify(src) ?? "";
    } catch {
      unknown = true;
      continue;
    }
    for (const re of [VAR_RE, TPL_RE]) {
      for (const m of text.matchAll(re)) {
        const id = m[1].toLowerCase();
        direct.set(id, (direct.get(id) ?? 0) + 1);
      }
    }
  }
  const aliasedBy = new Map<string, string[]>();
  for (const t of tokens) {
    for (const ref of [t.modes.light, t.modes.dark]) {
      if (ref && "alias" in ref) aliasedBy.set(ref.alias, [...(aliasedBy.get(ref.alias) ?? []), t.id]);
    }
  }
  const total = (id: string, seen = new Set<string>()): number => {
    if (seen.has(id)) return 0;
    seen.add(id);
    return (direct.get(id) ?? 0) + (aliasedBy.get(id) ?? []).reduce((n, child) => n + total(child, seen), 0);
  };
  return { direct, total: (id: string) => total(id), unknown };
}
