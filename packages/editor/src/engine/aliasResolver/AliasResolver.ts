import type { DesignToken } from "../../editor/design-system";
import type { EventEmitter } from "../EventEmitter";
import { AliasCycleError, AliasDepthError } from "./errors";

/**
 * Composer-owned alias resolver. Validates the alias graph and resolves
 * `aliasOf` pointers to a canonical (non-alias) token.
 *
 * Phase A.2 enforces depth-1 only: a token T1 may have aliasOf=T2, but T2
 * itself MUST NOT have aliasOf set. Multi-hop chains are deferred to a
 * future phase per spec §16.3 D4.
 *
 * Validation entry points:
 *   - validate(tokens): throws AliasCycleError or AliasDepthError on violation.
 *   - validate is called at project-load (after migration) and on every
 *     `tokens:alias-changed` event from the editor token editor.
 *
 * Pure with respect to DOM: this resolver does NOT call setProperty / write
 * to :root. CSS variable application stays the responsibility of
 * useTokensForKind's applyToRoot at registry mount time.
 */
export class AliasResolver {
  constructor(private readonly events: EventEmitter) {}

  /**
   * Validate the alias graph. Throws on first violation found.
   *   - AliasCycleError(chain)   on any cycle (depth >= 2 cycles included)
   *   - AliasDepthError(src, tgt) when an alias points to another alias
   */
  validate(tokens: readonly DesignToken[]): void {
    const byId = new Map<string, DesignToken>();
    for (const t of tokens) byId.set(t.id, t);

    for (const start of tokens) {
      if (!start.aliasOf) continue;

      const visited = new Set<string>([start.id]);
      const chain: string[] = [start.id];

      let cursor: DesignToken | undefined = byId.get(start.aliasOf);
      while (cursor) {
        chain.push(cursor.id);
        if (visited.has(cursor.id)) {
          throw new AliasCycleError(chain);
        }
        visited.add(cursor.id);
        if (!cursor.aliasOf) break;
        cursor = byId.get(cursor.aliasOf);
      }

      if (chain.length > 2) {
        throw new AliasDepthError(chain[0], chain[1]);
      }
    }
  }

  /**
   * Resolve a token id to its canonical (non-alias) token by walking aliasOf.
   * Returns undefined if the id is unknown OR the chain leads to an unknown id.
   */
  resolve(tokenId: string, tokens: readonly DesignToken[]): DesignToken | undefined {
    const byId = new Map<string, DesignToken>();
    for (const t of tokens) byId.set(t.id, t);

    const visited = new Set<string>();
    let cursor = byId.get(tokenId);
    while (cursor) {
      if (visited.has(cursor.id)) return undefined;
      visited.add(cursor.id);
      if (!cursor.aliasOf) return cursor;
      cursor = byId.get(cursor.aliasOf);
    }
    return undefined;
  }

  /**
   * Return the alias chain for diagnostics: [tokenId, ...intermediate, leafId].
   * Returns [tokenId] if the token has no aliasOf. Empty array if id unknown.
   */
  /**
   * Run validate() and, on success, emit `tokens:alias-changed` so downstream
   * listeners (Design tab editor, future preset/component recomputation) can
   * react. Failure throws — caller decides whether to surface UX.
   *
   * Phase A.2 ships the emission; UI listeners attach in a later DS arc phase.
   */
  validateAndEmit(tokens: readonly DesignToken[]): void {
    this.validate(tokens);
    this.events.emit("tokens:alias-changed", { count: tokens.filter((t) => t.aliasOf).length });
  }

  getChain(tokenId: string, tokens: readonly DesignToken[]): readonly string[] {
    const byId = new Map<string, DesignToken>();
    for (const t of tokens) byId.set(t.id, t);

    const start = byId.get(tokenId);
    if (!start) return [];

    const chain: string[] = [start.id];
    const visited = new Set<string>([start.id]);

    let cursor: DesignToken | undefined = start.aliasOf ? byId.get(start.aliasOf) : undefined;
    while (cursor) {
      if (visited.has(cursor.id)) {
        chain.push(cursor.id);
        return chain;
      }
      chain.push(cursor.id);
      visited.add(cursor.id);
      cursor = cursor.aliasOf ? byId.get(cursor.aliasOf) : undefined;
    }
    return chain;
  }

  /**
   * Reverse lookup — return every token in `tokens` whose `aliasOf` equals
   * `targetId`. Read path, not validate: returns refs even when the graph
   * contains cycles (UI shows aliases even on a broken graph). Used by
   * TokenDetailView's "Aliased by" row.
   *
   * D6.a (Arc 2026-05-16). Pure filter, no allocation beyond the filtered
   * array; tests cover empty / single / multiple / cycle cases.
   */
  findAliasesOf(targetId: string, tokens: readonly DesignToken[]): readonly DesignToken[] {
    return tokens.filter((t) => t.aliasOf === targetId);
  }
}
