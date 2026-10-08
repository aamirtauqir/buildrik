/**
 * Connect to tokens (spec §3): find raw style values that EXACTLY equal a
 * token's resolved light value, for a property of the same kind. No near
 * matches. Semantic tokens win over primitives; several semantic tokens tied
 * leave the pick to the user (`target: null`). Whole values only — never the
 * colour part of a shorthand — on the base styles AND every breakpoint
 * override (owner, OQ-6). A tie that includes Primary preselects Primary
 * (owner default, 2026-10-08 — the seed's #1A56DB is both Primary and
 * Action); the user can still change it. Pure — the Composer applies.
 *
 * @license BSD-3-Clause
 */
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { TOKENIZED_PROPERTIES } from "@/shared/constants/tokenProperties";
import type { BreakpointId } from "@/shared/types/breakpoints";
import type { DesignToken, TokenKind } from "./types";

/** One raw value: an element's base style, or one of its breakpoint overrides. */
export interface ConnectRef {
  elementId: string;
  prop: string;
  breakpoint?: BreakpointId;
}
export interface ConnectSuggestion {
  key: string;
  value: string;
  kind: TokenKind;
  refs: ConnectRef[];
  elementCount: number;
  candidates: string[];
  target: string | null;
}
export interface StyledNode {
  id: string;
  styles?: Record<string, unknown>;
  breakpointStyles?: Partial<Record<BreakpointId, Record<string, unknown>>>;
  children?: StyledNode[];
}

const PREFERRED_ON_TIE = "color-primary";

const hex2 = (n: string) => Number(n).toString(16).padStart(2, "0");

export function normalizeTokenValue(kind: TokenKind, raw: string): string {
  const v = raw.trim().replace(/\s+/g, " ");
  if (kind !== "color") return v;
  const lower = v.toLowerCase();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(lower);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  if (/^#[0-9a-f]{8}$/.test(lower) && lower.endsWith("ff")) return lower.slice(0, 7);
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*1(?:\.0+)?\s*)?\)$/.exec(lower);
  if (rgb) return `#${hex2(rgb[1])}${hex2(rgb[2])}${hex2(rgb[3])}`;
  return lower;
}

export function findConnectSuggestions(
  roots: readonly StyledNode[],
  tokens: readonly DesignToken[],
  opts: { skip?: (elementId: string) => boolean } = {},
): ConnectSuggestion[] {
  const byKey = new Map<string, DesignToken[]>();
  for (const t of tokens) {
    if (t.replacedBy) continue;
    const literal = resolveTokenLiteral(tokens, t.id, "light");
    if (!literal) continue;
    const key = `${t.kind}|${normalizeTokenValue(t.kind, literal)}`;
    byKey.set(key, [...(byKey.get(key) ?? []), t]);
  }
  const groups = new Map<string, { value: string; kind: TokenKind; refs: ConnectRef[] }>();
  const scan = (elementId: string, styles: Record<string, unknown> | undefined, breakpoint?: BreakpointId) => {
    for (const [prop, raw] of Object.entries(styles ?? {})) {
      const kind = TOKENIZED_PROPERTIES[prop];
      if (!kind || typeof raw !== "string" || raw.includes("var(")) continue;
      const key = `${kind}|${normalizeTokenValue(kind, raw)}`;
      if (!byKey.has(key)) continue;
      const g = groups.get(key) ?? { value: raw.trim(), kind, refs: [] };
      g.refs.push(breakpoint ? { elementId, prop, breakpoint } : { elementId, prop });
      groups.set(key, g);
    }
  };
  const walk = (n: StyledNode) => {
    if (!opts.skip?.(n.id)) {
      scan(n.id, n.styles);
      for (const [bp, styles] of Object.entries(n.breakpointStyles ?? {})) {
        if (bp === "desktop" || bp === "tablet" || bp === "mobile") scan(n.id, styles, bp);
      }
    }
    for (const c of n.children ?? []) walk(c);
  };
  roots.forEach(walk);
  return [...groups]
    .map(([key, g]) => {
      const all = byKey.get(key) ?? [];
      const semantic = all.filter((t) => t.layer === "semantic");
      const candidates = (semantic.length > 0 ? semantic : all).map((t) => t.id).sort();
      return {
        key,
        ...g,
        elementCount: new Set(g.refs.map((r) => r.elementId)).size,
        candidates,
        target: candidates.length === 1 ? candidates[0] : candidates.includes(PREFERRED_ON_TIE) ? PREFERRED_ON_TIE : null,
      };
    })
    .sort((a, b) => b.elementCount - a.elementCount || a.key.localeCompare(b.key));
}
