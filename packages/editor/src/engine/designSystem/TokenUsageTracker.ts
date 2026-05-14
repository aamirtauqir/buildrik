/**
 * TokenUsageTracker
 *
 * Counts how many element style bindings reference each design-system token
 * across the current element tree. Output drives the usage chip on
 * `TokenKindCard` rows and the blast-radius confirm in the delete-token flow.
 *
 * Token reference syntax: `{{token.<dotted.id>}}` inside any style value.
 * Multiple refs in a single value (e.g. gradients) are each counted.
 *
 * Recompute is O(N · S · L) where N=elements, S=avg style props per element,
 * L=avg value length. Cheap enough to run on every element change.
 *
 * @module engine/designSystem/TokenUsageTracker
 * @license BSD-3-Clause
 */

import type { Element } from "../elements/Element";

const TOKEN_REF_RE = /\{\{token\.([a-zA-Z0-9._-]+)\}\}/g;

export class TokenUsageTracker {
  private counts = new Map<string, number>();

  /**
   * Replace the usage map by walking `elements` and counting every
   * `{{token.X.Y}}` ref found in style values.
   */
  recompute(elements: readonly Element[]): void {
    this.counts.clear();
    for (const el of elements) {
      const styles = el.getStyles();
      for (const value of Object.values(styles)) {
        if (typeof value !== "string") continue;
        if (value.indexOf("{{token.") === -1) continue;
        for (const match of value.matchAll(TOKEN_REF_RE)) {
          const tokenId = match[1];
          this.counts.set(tokenId, (this.counts.get(tokenId) ?? 0) + 1);
        }
      }
    }
  }

  /** Returns the count for `tokenId` (0 if unused). */
  getUsage(tokenId: string): number {
    return this.counts.get(tokenId) ?? 0;
  }

  /** Read-only view of all counts — for callers that need to iterate. */
  getAllUsage(): ReadonlyMap<string, number> {
    return this.counts;
  }
}
