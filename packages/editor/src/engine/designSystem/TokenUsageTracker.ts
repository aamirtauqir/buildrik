/**
 * TokenUsageTracker — the editor's one view of token usage (spec §6).
 *
 * Two answers, two costs:
 *  - the element BREAKDOWN (which element / style property binds a token) is
 *    walked eagerly on every element change, as before — cheap, and what the
 *    canvas highlight and the "Used by" drill-in need;
 *  - the site-wide COUNT (every page incl. CMS templates, project and global
 *    styles, saved components, presets — through alias and replacedBy chains)
 *    comes from the shared index, built lazily on first read after a change,
 *    because it serializes the whole project.
 * Both parse var names with the shared `scanTokenRefs`, so the editor and the
 * server (theme push) agree on what "in use" means.
 *
 * Emits `"tokenUsage:changed"` after every `recompute()` / `invalidate()` so
 * consumers re-snapshot AFTER the new refs are written: subscribing to the
 * Composer's `element:*` events would race the microtask-coalesced recompute.
 *
 * @module engine/designSystem/TokenUsageTracker
 * @license BSD-3-Clause
 */
import {
  buildTokenUsageIndex,
  scanTokenRefs,
  tokenIdsByVarName,
  type TokenUsageCount,
  type TokenUsageIndex,
} from "@buildrik/shared/tokens";
import type { Element } from "../elements/Element";
import { EventEmitter } from "../EventEmitter";
import type { DesignToken } from "./types";
import type { StyleData } from "@/shared/types/style";
import { BREAKPOINT_QUERIES } from "@/shared/constants/breakpoints";

/** One binding: which element / style property references a token. */
export interface UsageRef {
  readonly elementId: string;
  readonly styleProp: string;
  /** Set when the binding lives in an element's breakpoint override or
   *  pseudo-state rule, not its own styles: "tablet", "hover",
   *  "mobile · hover". */
  readonly context?: string;
}

/** An element's own rule: `[data-buildrick-id="<id>"]`, optionally `:<pseudo>`. */
const ELEMENT_RULE_RE = /^\[data-buildrick-id="([^"]+)"\](?::{1,2}([A-Za-z-]+))?$/;
const BREAKPOINT_BY_QUERY = new Map(
  Object.entries(BREAKPOINT_QUERIES).flatMap(([id, query]) => (query ? [[query, id] as const] : [])),
);

/** "tablet", "hover", "mobile · hover" — or undefined for the element's base rule. */
function ruleContext(mediaQuery: string | undefined, pseudo: string | undefined): string | undefined {
  const parts = [mediaQuery ? (BREAKPOINT_BY_QUERY.get(mediaQuery) ?? mediaQuery) : null, pseudo ?? null].filter(
    (p): p is string => p !== null,
  );
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export class TokenUsageTracker extends EventEmitter {
  private refs = new Map<string, UsageRef[]>();
  private index: TokenUsageIndex | null = null;

  constructor(
    private readonly readTokens: () => readonly DesignToken[],
    private readonly readSources: () => { sources: readonly unknown[]; unavailable: readonly string[] },
  ) {
    super();
  }

  /** Rebuilds the element breakdown from each element's own styles and from
   *  the style rules that target one element (breakpoint overrides,
   *  pseudo-states). Rules for elements not in `elements` are skipped. */
  recompute(elements: readonly Element[], rules: readonly Pick<StyleData, "selector" | "properties" | "mediaQuery">[] = []): void {
    this.refs.clear();
    const byVar = tokenIdsByVarName(this.readTokens());
    const add = (styles: Record<string, unknown>, elementId: string, context?: string) => {
      for (const [styleProp, value] of Object.entries(styles)) {
        if (typeof value !== "string") continue;
        for (const id of scanTokenRefs(value, byVar)) {
          const entry: UsageRef = context ? { elementId, styleProp, context } : { elementId, styleProp };
          const bucket = this.refs.get(id);
          if (bucket) bucket.push(entry);
          else this.refs.set(id, [entry]);
        }
      }
    };
    const known = new Set<string>();
    for (const el of elements) {
      known.add(el.getId());
      add(el.getStyles(), el.getId());
    }
    for (const rule of rules) {
      const m = ELEMENT_RULE_RE.exec(rule.selector);
      if (!m || !known.has(m[1])) continue;
      add(rule.properties, m[1], ruleContext(rule.mediaQuery, m[2]));
    }
    this.invalidate();
  }

  invalidate(): void {
    this.index = null;
    this.emit("tokenUsage:changed");
  }

  private siteIndex(): TokenUsageIndex {
    if (!this.index) {
      const { sources, unavailable } = this.readSources();
      this.index = buildTokenUsageIndex(sources, this.readTokens(), { unavailable });
    }
    return this.index;
  }

  /** Site-wide references (the known part), through alias and replacedBy chains. */
  getUsage(tokenId: string): number {
    return this.siteIndex().total(tokenId);
  }

  /** Like `getUsage`, but "unknown" while any source (saved components) is unread. */
  getCount(tokenId: string): TokenUsageCount {
    return this.siteIndex().count(tokenId);
  }

  /** `getCount` as if the set were `tokens` (a pending write): the chain is
   *  walked through `tokens`' own aliases, so a token the write stops
   *  aliasing no longer carries that token's elements. */
  getCountIn(tokenId: string, tokens: readonly DesignToken[]): TokenUsageCount {
    const idx = this.siteIndex();
    if (idx.unknown) return "unknown";
    return buildTokenUsageIndex([], tokens)
      .closure(tokenId)
      .reduce((n, id) => n + (idx.direct.get(id) ?? 0), 0);
  }

  /** Element refs for `tokenId` and every token that resolves through it. */
  getBreakdown(tokenId: string): readonly UsageRef[] {
    return this.siteIndex().closure(tokenId).flatMap((id) => this.refs.get(id) ?? []);
  }

  /** `getUsage` for every token, plus any referenced id no token answers to. */
  getAllUsage(): ReadonlyMap<string, number> {
    const idx = this.siteIndex();
    const ids = new Set([...this.readTokens().map((t) => t.id), ...idx.direct.keys()]);
    return new Map([...ids].map((id) => [id, idx.total(id)]));
  }
}
