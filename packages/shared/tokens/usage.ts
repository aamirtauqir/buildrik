// packages/shared/tokens/usage.ts
/**
 * Token usage (spec §6). One pass over every source (pages, project and global
 * styles, saved components, presets): each token's direct references, then
 * totals through alias chains AND soft-delete bridges (`replacedBy`), because a
 * reference to a replaced token resolves through its replacement.
 *
 * A var is matched by the names a token answers to — its `cssVar` and its
 * `legacyNames` — never by assuming `--buildrick-design-<id>`; the seed's
 * radius/shadow tokens live under `--bd-*`. A source the caller could not read
 * makes every count "unknown", never 0: delete must refuse rather than guess.
 * A breakpoint override counts once, though it is stored as a rule and on the
 * element (`withoutMirroredOverrides`).
 */
import type { DesignToken } from "../schemas/design-tokens";

const VAR_RE = /var\(\s*(--[A-Za-z0-9_-]+)\s*[,)]/g;
const TPL_RE = /\{\{token\.([A-Za-z0-9._-]+)\}\}/g;
const PREFIX = "--buildrick-design-";

export type TokenUsageCount = number | "unknown";

export interface TokenUsageIndex {
  direct: Map<string, number>;
  unknown: boolean;
  unavailable: readonly string[];
  total(id: string): number;
  count(id: string): TokenUsageCount;
  /** `id` plus every token whose references resolve through it. */
  closure(id: string): string[];
}

/** Var name → token id. A token's own `cssVar` beats another token's legacy name. */
export function tokenIdsByVarName(tokens: readonly DesignToken[]): Map<string, string> {
  const byVar = new Map<string, string>();
  for (const t of tokens) for (const n of t.legacyNames ?? []) if (!byVar.has(n)) byVar.set(n, t.id);
  for (const t of tokens) byVar.set(t.cssVar, t.id);
  return byVar;
}

/** Every token id one string references, in order, repeats kept. */
export function scanTokenRefs(text: string, byVar: ReadonlyMap<string, string>): string[] {
  const ids: string[] = [];
  if (text.includes("var(")) {
    for (const m of text.matchAll(VAR_RE)) {
      const id = byVar.get(m[1]) ?? (m[1].startsWith(PREFIX) ? m[1].slice(PREFIX.length).toLowerCase() : undefined);
      if (id) ids.push(id);
    }
  }
  if (text.includes("{{token.")) for (const m of text.matchAll(TPL_RE)) ids.push(m[1].toLowerCase());
  return ids;
}

/** An element's own rule (breakpoint overrides land here): `[data-buildrick-id="<id>"]`, no pseudo. */
const ELEMENT_RULE_RE = /^\[data-buildrick-id="([^"]+)"\]$/;

/** `id|prop|value` → how many element rules carry it, read from every source
 *  that is a list of style rules (`{ selector, properties }`). */
function elementRuleBindings(sources: readonly unknown[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const src of sources) {
    if (!Array.isArray(src)) continue;
    for (const rule of src) {
      const sel = (rule as { selector?: unknown })?.selector;
      const props = (rule as { properties?: unknown })?.properties;
      if (typeof sel !== "string" || typeof props !== "object" || props === null) continue;
      const id = ELEMENT_RULE_RE.exec(sel)?.[1];
      if (!id) continue;
      for (const [prop, value] of Object.entries(props)) {
        if (typeof value === "string") out.set(`${id}|${prop}|${value}`, (out.get(`${id}|${prop}|${value}`) ?? 0) + 1);
      }
    }
  }
  return out;
}

/**
 * A breakpoint override is stored twice: the element's style rule (what
 * renders) and the element's `breakpointStyles` mirror. The serializer drops
 * each mirror entry a rule already carries, one rule per entry, so the
 * binding counts once; a mirror no rule matches still counts.
 */
function withoutMirroredOverrides(rules: Map<string, number>) {
  return function (this: unknown, key: string, value: unknown): unknown {
    if (key !== "breakpointStyles" || rules.size === 0 || typeof value !== "object" || value === null) return value;
    const id = (this as { id?: unknown }).id;
    if (typeof id !== "string") return value;
    const kept: Record<string, Record<string, unknown>> = {};
    for (const [bp, styles] of Object.entries(value as Record<string, unknown>)) {
      if (typeof styles !== "object" || styles === null) continue;
      const left: Record<string, unknown> = {};
      for (const [prop, v] of Object.entries(styles)) {
        const k = `${id}|${prop}|${String(v)}`;
        const n = rules.get(k) ?? 0;
        if (typeof v === "string" && n > 0) rules.set(k, n - 1);
        else left[prop] = v;
      }
      kept[bp] = left;
    }
    return kept;
  };
}

export function buildTokenUsageIndex(
  sources: readonly unknown[],
  tokens: readonly DesignToken[],
  opts: { unavailable?: readonly string[] } = {},
): TokenUsageIndex {
  const byVar = tokenIdsByVarName(tokens);
  const direct = new Map<string, number>();
  const unavailable = [...(opts.unavailable ?? [])];
  const replacer = withoutMirroredOverrides(elementRuleBindings(sources));
  for (const [i, src] of sources.entries()) {
    let text: string;
    try {
      text = JSON.stringify(src, replacer) ?? "";
    } catch {
      unavailable.push(`source ${i}`);
      continue;
    }
    for (const id of scanTokenRefs(text, byVar)) direct.set(id, (direct.get(id) ?? 0) + 1);
  }
  const referrers = new Map<string, string[]>();
  const link = (target: string, from: string) => referrers.set(target, [...(referrers.get(target) ?? []), from]);
  for (const t of tokens) {
    for (const ref of [t.modes.light, t.modes.dark]) if (ref && "alias" in ref) link(ref.alias, t.id);
    if (t.replacedBy) link(t.replacedBy, t.id);
  }
  const closure = (id: string): string[] => {
    const seen = new Set<string>();
    const walk = (cur: string) => {
      if (seen.has(cur)) return;
      seen.add(cur);
      for (const child of referrers.get(cur) ?? []) walk(child);
    };
    walk(id);
    return [...seen];
  };
  const total = (id: string) => closure(id).reduce((n, cur) => n + (direct.get(cur) ?? 0), 0);
  const unknown = unavailable.length > 0;
  return { direct, unknown, unavailable, total, count: (id) => (unknown ? "unknown" : total(id)), closure };
}
