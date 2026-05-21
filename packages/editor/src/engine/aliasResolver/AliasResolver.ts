import type { DesignToken } from "../designSystem/types";
import type { EventEmitter } from "../EventEmitter";
import { AliasCycleError, AliasDepthError, MAX_ALIAS_DEPTH } from "./errors";

/**
 * Composer-owned alias resolver. Validates the alias graph and resolves
 * `aliasOf` pointers to a canonical (non-alias) token.
 *
 * B2 upgrade (2026-05-16): max depth raised from 1 to MAX_ALIAS_DEPTH (3).
 * Chains up to length 4 (entry + 3 hops) accepted, longer rejected. See
 * token-design-decisions.md §B2 and errors.ts MAX_ALIAS_DEPTH.
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

  // B1 follow-up (2026-05-17): per-tokens-array forward + reverse caches.
  // Keyed by the tokens array identity (WeakMap) so a stable registry
  // snapshot resolves O(1) per lookup after the first call. When the
  // registry mutates the array identity changes and the cache invalidates
  // implicitly. Three caches:
  //   - forwardIndex: id → token (validate/resolve/getChain hot paths)
  //   - replacedByIndex: targetId → source token (findReplacedBy O(1))
  //   - aliasOfIndex: targetId → source tokens[] (findAliasesOf O(1))
  private readonly forwardIndex = new WeakMap<readonly DesignToken[], Map<string, DesignToken>>();
  private readonly replacedByIndex = new WeakMap<readonly DesignToken[], Map<string, DesignToken>>();
  private readonly aliasOfIndex = new WeakMap<readonly DesignToken[], Map<string, DesignToken[]>>();

  private getForwardIndex(tokens: readonly DesignToken[]): Map<string, DesignToken> {
    let m = this.forwardIndex.get(tokens);
    if (!m) {
      m = new Map<string, DesignToken>();
      for (const t of tokens) m.set(t.id, t);
      this.forwardIndex.set(tokens, m);
    }
    return m;
  }

  private getReplacedByIndex(tokens: readonly DesignToken[]): Map<string, DesignToken> {
    let m = this.replacedByIndex.get(tokens);
    if (!m) {
      m = new Map<string, DesignToken>();
      for (const t of tokens) if (t.replacedBy) m.set(t.replacedBy, t);
      this.replacedByIndex.set(tokens, m);
    }
    return m;
  }

  private getAliasOfIndex(tokens: readonly DesignToken[]): Map<string, DesignToken[]> {
    let m = this.aliasOfIndex.get(tokens);
    if (!m) {
      m = new Map<string, DesignToken[]>();
      for (const t of tokens) {
        if (!t.aliasOf) continue;
        const list = m.get(t.aliasOf);
        if (list) list.push(t);
        else m.set(t.aliasOf, [t]);
      }
      this.aliasOfIndex.set(tokens, m);
    }
    return m;
  }

  /**
   * Validate the alias graph. Throws on first violation found.
   *   - AliasCycleError(chain)   on any cycle (depth >= 2 cycles included)
   *   - AliasDepthError(chain)   when chain length exceeds MAX_ALIAS_DEPTH + 1
   */
  validate(tokens: readonly DesignToken[]): void {
    const byId = this.getForwardIndex(tokens);

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

      // chain.length === depth + 1 (entry token + N alias hops).
      // MAX_ALIAS_DEPTH=3 → chain.length up to 4 allowed, 5+ rejected.
      if (chain.length > MAX_ALIAS_DEPTH + 1) {
        throw new AliasDepthError(chain);
      }
    }
  }

  /**
   * Resolve a token id to its canonical (non-alias) token by walking
   * `replacedBy` (rename bridges) then `aliasOf` chains. Returns undefined
   * if the id is unknown OR a chain leads to an unknown id OR a cycle exists.
   *
   * Resolution order per hop: check `replacedBy` first (renamed → follow to
   * new id), then `aliasOf` (semantic → follow to primitive). Either hop
   * adds to the visited set so cycles short-circuit to undefined.
   */
  resolve(tokenId: string, tokens: readonly DesignToken[]): DesignToken | undefined {
    const byId = this.getForwardIndex(tokens);

    const visited = new Set<string>();
    let cursor = byId.get(tokenId);
    while (cursor) {
      if (visited.has(cursor.id)) return undefined;
      visited.add(cursor.id);
      // B1 (2026-05-16): rename bridge takes priority — follow to canonical id.
      if (cursor.replacedBy) {
        cursor = byId.get(cursor.replacedBy);
        continue;
      }
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
    const byId = this.getForwardIndex(tokens);

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
    return this.getAliasOfIndex(tokens).get(targetId) ?? [];
  }

  /**
   * Reverse lookup for B1 rename bridge — return the (unique) source token
   * whose `replacedBy` equals `targetId`, or undefined when none exists.
   * O(1) per call after first lookup against a given tokens array thanks to
   * the per-array WeakMap index built in getReplacedByIndex.
   *
   * Bridge writes are 1:1 by construction (rename writes replacedBy on the
   * single old id pointing at the canonical new id), so the return type is
   * a single token rather than an array. If multiple sources accidentally
   * point at the same target the last-built entry wins — that case is a
   * data bug, not a resolver bug.
   */
  findReplacedBy(targetId: string, tokens: readonly DesignToken[]): DesignToken | undefined {
    return this.getReplacedByIndex(tokens).get(targetId);
  }
}
