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

/** One binding: which element / style property references a token. */
export interface UsageRef {
  readonly elementId: string;
  readonly styleProp: string;
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

  recompute(elements: readonly Element[]): void {
    this.refs.clear();
    const byVar = tokenIdsByVarName(this.readTokens());
    for (const el of elements) {
      const elementId = el.getId();
      for (const [styleProp, value] of Object.entries(el.getStyles())) {
        if (typeof value !== "string") continue;
        for (const id of scanTokenRefs(value, byVar)) {
          const bucket = this.refs.get(id);
          const entry: UsageRef = { elementId, styleProp };
          if (bucket) bucket.push(entry);
          else this.refs.set(id, [entry]);
        }
      }
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
