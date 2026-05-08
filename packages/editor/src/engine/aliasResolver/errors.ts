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
 * Thrown when an alias chain exceeds depth 1 — i.e. token T1.aliasOf points
 * to T2 and T2.aliasOf is also set. Phase 1 only allows depth-1 aliases.
 */
export class AliasDepthError extends Error {
  readonly sourceId: string;
  readonly targetId: string;

  constructor(sourceId: string, targetId: string) {
    super(
      `[alias-resolver] depth-1 violation: token "${sourceId}" aliases "${targetId}", but "${targetId}" itself has aliasOf set`
    );
    this.name = "AliasDepthError";
    this.sourceId = sourceId;
    this.targetId = targetId;
  }
}
