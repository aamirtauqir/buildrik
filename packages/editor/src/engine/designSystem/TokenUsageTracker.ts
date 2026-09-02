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
 * Two reference syntaxes count, inside any style value:
 *   `{{token.<dotted.id>}}`        — template placeholders, pre-import
 *   `var(--buildrick-design-<id>)` — what the UI actually writes
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
 * The OTHER binding syntax, and the one the product actually writes.
 *
 * `{{token.…}}` only ever appears in template HTML strings, and
 * `resolveTemplateTokens` substitutes those away before import — so a
 * placeholder survives only on a resolution *miss*. Everything a user binds
 * through the UI is written as `var(--buildrick-design-<id>)`:
 * `placeCatalogComponent.ts` writes it when a catalog component lands, and
 * `tokenBindingDetection.ts` is the Inspector's own contract for reading it
 * back (spec §6.4).
 *
 * Matching only the first form meant `getUsage()` returned 0 for every token
 * in real use, which in turn made the replace-on-delete modal unreachable in
 * the PRODUCT (not just the fixture): `TokenDetailView` hard-deletes whenever
 * `consumerCount === 0`. The "Used by N elements" row and every usage chip
 * read 0 for the same reason (blocker A14).
 *
 * Mirrors `tokenToCssVar(id)` in ./types.ts — keep the prefix in step.
 */
const TOKEN_VAR_RE = /var\(\s*--buildrick-design-([A-Za-z0-9_-]+)\s*\)/g;

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
        const hasRef = value.indexOf("{{token.") !== -1;
        const hasVar = value.indexOf("--buildrick-design-") !== -1;
        if (!hasRef && !hasVar) continue;
        const record = (tokenId: string) => {
          const bucket = this.refs.get(tokenId);
          const entry: UsageRef = { elementId, styleProp: prop };
          if (bucket) {
            bucket.push(entry);
          } else {
            this.refs.set(tokenId, [entry]);
          }
        };
        /* Both syntaxes count. A gradient naming the same token twice still
           yields two refs, which is the count-equivalence the module header
           promises. */
        if (hasRef) for (const m of value.matchAll(TOKEN_REF_RE)) record(m[1]);
        if (hasVar) for (const m of value.matchAll(TOKEN_VAR_RE)) record(m[1]);
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
