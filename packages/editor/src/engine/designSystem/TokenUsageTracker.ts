/**
 * TokenUsageTracker
 *
 * Tracks every element style binding that references a design-system token
 * across the current element tree. Stores `UsageRef` source records
 * (`{elementId, styleProp}`) per token so consumers can either read a scalar
 * count via `getUsage()` or drill into the per-element breakdown via
 * `getBreakdown()`. Output drives the usage chip on `TokenKindCard` rows, the
 * blast-radius confirm in the delete-token flow, and the "Used by" drill-in
 * row on `TokenDetailView`.
 *
 * Token reference syntax: `{{token.<dotted.id>}}` inside any style value.
 * Multiple refs in a single value (e.g. gradients) each generate a separate
 * `UsageRef` entry — count-equivalence with the old scalar map is preserved.
 *
 * Recompute is O(N · S · L) where N=elements, S=avg style props per element,
 * L=avg value length. Cheap enough to run on every element change.
 *
 * @module engine/designSystem/TokenUsageTracker
 * @license BSD-3-Clause
 */

import type { Element } from "../elements/Element";
import { EventEmitter } from "../EventEmitter";

const TOKEN_REF_RE = /\{\{token\.([a-zA-Z0-9._-]+)\}\}/g;

/**
 * Source record for a single token reference. Emitted by `getBreakdown()` so
 * UI surfaces can show *which* element / property is bound to a token, not
 * just the aggregate count.
 */
export interface UsageRef {
  readonly elementId: string;
  readonly styleProp: string;
}

/**
 * Emits `"tokenUsage:changed"` after every `recompute()` completes so
 * consumers (e.g. TokensSection) can re-snapshot AFTER the new refs are
 * written. Subscribing directly to Composer's `element:*` events would race
 * the microtask-coalesced recompute (Composer.ts:225-236) and read stale
 * data in the same tick the mutation fired.
 */
export class TokenUsageTracker extends EventEmitter {
  private refs = new Map<string, UsageRef[]>();

  /**
   * Replace the usage map by walking `elements` and recording every
   * `{{token.X.Y}}` ref found in style values. Emits `"tokenUsage:changed"`
   * on completion.
   */
  recompute(elements: readonly Element[]): void {
    this.refs.clear();
    for (const el of elements) {
      const elementId = el.getId();
      const styles = el.getStyles();
      for (const [prop, value] of Object.entries(styles)) {
        if (typeof value !== "string") continue;
        if (value.indexOf("{{token.") === -1) continue;
        for (const match of value.matchAll(TOKEN_REF_RE)) {
          const tokenId = match[1];
          const bucket = this.refs.get(tokenId);
          const entry: UsageRef = { elementId, styleProp: prop };
          if (bucket) {
            bucket.push(entry);
          } else {
            this.refs.set(tokenId, [entry]);
          }
        }
      }
    }
    this.emit("tokenUsage:changed");
  }

  /** Returns the count for `tokenId` (0 if unused). */
  getUsage(tokenId: string): number {
    return this.refs.get(tokenId)?.length ?? 0;
  }

  /**
   * Returns the per-element ref list for `tokenId` (empty array if unused).
   * Each entry identifies a single binding: which element + which style
   * property references this token. Two distinct gradient stops on the same
   * element produce two entries with identical `{elementId, styleProp}` —
   * count parity with `getUsage` is preserved.
   */
  getBreakdown(tokenId: string): readonly UsageRef[] {
    return this.refs.get(tokenId) ?? [];
  }

  /**
   * Read-only scalar view of all counts — back-compat shape for callers that
   * only need aggregates (e.g. `TokensSection` usage map snapshot). Each
   * entry is derived from `refs.get(id).length`.
   */
  getAllUsage(): ReadonlyMap<string, number> {
    const counts = new Map<string, number>();
    for (const [id, list] of this.refs) {
      counts.set(id, list.length);
    }
    return counts;
  }
}
