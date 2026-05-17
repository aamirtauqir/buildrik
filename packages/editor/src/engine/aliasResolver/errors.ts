/**
 * Thrown when DFS finds a cycle in the alias graph during validate.
 * `chain` lists the offending path from the entry token to the repeated token.
 */
export class AliasCycleError extends Error {
  readonly chain: readonly string[];

  constructor(chain: readonly string[]) {
    super(`[alias-resolver] cycle detected: ${chain.join(" → ")}`);
    this.name = "AliasCycleError";
    this.chain = chain;
  }

  toJSON(): { name: string; message: string; chain: readonly string[] } {
    return { name: this.name, message: this.message, chain: this.chain };
  }
}

/**
 * Thrown when an alias chain exceeds the configured max depth.
 *
 * B2 upgrade (2026-05-16): max depth raised from 1 to 3. Chains up to length
 * 4 (entry + 3 hops, e.g. `button.bg → action.default → brand.primary → blue.500`)
 * accepted. Length 5+ rejected. See token-design-decisions.md §B2.
 *
 * `chain` carries the full violating path. `sourceId`/`targetId` kept for
 * back-compat with depth-1 era callers.
 */
export class AliasDepthError extends Error {
  readonly sourceId: string;
  readonly targetId: string;
  readonly chain: readonly string[];

  constructor(chain: readonly string[]) {
    super(`[alias-resolver] depth violation: chain length ${chain.length - 1} exceeds max depth 3 — ${chain.join(" → ")}`);
    this.name = "AliasDepthError";
    this.chain = chain;
    this.sourceId = chain[0];
    this.targetId = chain[chain.length - 1];
  }
}

/** Max alias chain depth allowed per B2 lock (2026-05-16). */
export const MAX_ALIAS_DEPTH = 3;
