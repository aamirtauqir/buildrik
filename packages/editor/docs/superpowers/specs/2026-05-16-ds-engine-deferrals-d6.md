# DS Engine Deferrals — Arc D6 (+ folded #38 C2)

**Date:** 2026-05-16
**Status:** SPEC — pending dispatch
**Folds:** task #45 (Arc D6) + task #38 (Arc C2 history-aware Auto-fix). Both
deferred from the DS prototype-parity wave that shipped 2026-05-16 as commits
`1ac29a7c` (D1) → `6af9151f` (D4 test migration).

## Goal

Close three engine-side gaps the visual parity wave intentionally stubbed:

1. **Aliased by** reverse-lookup on a token — currently no API; TokenDetailView
   "Aliased by" row renders nothing.
2. **TokenUsage breakdown** per element — currently `getUsage(id): number`
   only; UI can't expand "Used by 7" into the actual element list.
3. **History-aware Auto-fix** — clicking Auto-fix in TokenDetailView mutates
   the token value; Cmd+Z should revert. Currently unverified — may already
   work via `setProjectSettings → PROJECT_CHANGED → HistoryManager`, or may
   need explicit transaction wrapping.

These are cross-engine work, not parity polish. Inventory ran 2026-05-16 per
memory `feedback_inventory_before_architecture`.

## Inventory — what exists today

### AliasResolver (`engine/aliasResolver/AliasResolver.ts`, 114 LOC)

```ts
class AliasResolver {
  validate(tokens): void                 // throws AliasCycleError / AliasDepthError
  validateAndEmit(tokens): void          // validate + emit `tokens:alias-changed`
  resolve(tokenId, tokens): token | u    // id → canonical (walks aliasOf chain)
  getChain(tokenId, tokens): readonly[]  // diagnostic chain
}
```

**Gap:** no reverse lookup. Need `findAliasesOf(targetId, tokens): readonly DesignToken[]`.

### TokenUsageTracker (`engine/designSystem/TokenUsageTracker.ts`, 63 LOC)

```ts
class TokenUsageTracker extends EventEmitter {
  private counts = new Map<string, number>()
  recompute(elements): void              // walks element styles, counts {{token.X}} refs
  getUsage(tokenId): number
  getAllUsage(): ReadonlyMap<string, number>
}
```

**Gap:** stores scalar count only. To expose element-level breakdown, must
switch counts map to ref map: `Map<tokenId, { elementId; styleProp }[]>`.
`getUsage` becomes a derived `.length` accessor.

### History pathway (Composer.ts, HistoryManager.ts)

- `Composer.beginTransaction()` / `endTransaction()` / `rollbackTransaction()` exist
- `setProjectSettings()` writes settings → fires `PROJECT_CHANGED` → caught by HistoryManager
- Auto-fix flow today: `onValueChange(id, newValue)` → registry update → setProjectSettings → PROJECT_CHANGED → likely history entry

**Gap:** unverified that auto-fix produces a single history entry (vs N
micro-entries) and that the entry is labeled "Auto-fix contrast" instead of a
generic "settings changed".

## Sub-arcs

### D6.a — AliasResolver.findAliasesOf

**Scope:** add reverse-lookup method + wire into TokenDetailView "Aliased by" row.

**Engine change:**
```ts
findAliasesOf(targetId: string, tokens: readonly DesignToken[]): readonly DesignToken[] {
  return tokens.filter((t) => t.aliasOf === targetId);
}
```

**UI wiring:** TokenDetailView reads `composer.aliasResolver.findAliasesOf(token.id, allTokens)`. Render row only when result non-empty. Click row → drill into list. Subscribe to `tokens:alias-changed` for re-render.

**Test plan:**
- AliasResolver: empty (no aliases), single alias, multiple aliases, cycle case (should still return refs without throwing — read path, not validate)
- TokenDetailView: row hidden when 0 aliases, row visible with count when N > 0
- Live-verify against proto s02

**LOC estimate:** +15 engine, +25 UI, +20 tests = ~60 LOC. **Risk:** low. Pure addition.

### D6.b — TokenUsage breakdown

**Scope:** extend TokenUsageTracker to store source refs, expose `getBreakdown(id)`.

**Engine change:**
```ts
type UsageRef = { elementId: string; styleProp: string };

class TokenUsageTracker {
  private refs = new Map<string, UsageRef[]>();  // was: counts: Map<string, number>

  recompute(elements: readonly Element[]): void {
    this.refs.clear();
    for (const el of elements) {
      const styles = el.getStyles();
      for (const [prop, value] of Object.entries(styles)) {
        if (typeof value !== "string" || value.indexOf("{{token.") === -1) continue;
        for (const match of value.matchAll(TOKEN_REF_RE)) {
          const tokenId = match[1];
          const arr = this.refs.get(tokenId) ?? [];
          arr.push({ elementId: el.id, styleProp: prop });
          this.refs.set(tokenId, arr);
        }
      }
    }
    this.emit("tokenUsage:changed");
  }

  getUsage(tokenId: string): number {
    return this.refs.get(tokenId)?.length ?? 0;
  }

  getBreakdown(tokenId: string): readonly UsageRef[] {
    return this.refs.get(tokenId) ?? [];
  }

  getAllUsage(): ReadonlyMap<string, number> {
    // back-compat: derive scalar counts from refs
    const out = new Map<string, number>();
    for (const [id, arr] of this.refs) out.set(id, arr.length);
    return out;
  }
}
```

**UI wiring:** TokenDetailView "Used by N elements" row gains expand affordance → renders list of `(element name | style prop)` pairs. Click row → element selection in canvas.

**Test plan:**
- Refs map built correctly for: single ref, multi-prop same element, multi-element same token, gradient w/ 2 refs in one value
- getUsage still returns correct count (back-compat)
- getAllUsage back-compat shape preserved
- recompute clears prior refs

**LOC estimate:** +40 engine (refactor counts → refs), +50 UI (expansion + click-to-select), +60 tests = ~150 LOC. **Risk:** medium. Data structure change. Existing consumers: `TokensSection.tsx:84` calls `getAllUsage()` — back-compat shim preserves return shape, so no consumer break.

### D6.c — History-aware Auto-fix (folds task #38 C2)

**Scope:** verify Auto-fix click produces a single labeled history entry; Cmd+Z reverts.

**Step 1 — Verification phase (~30 min):**
- Read `Auto-fix` button onClick path in TokenDetailView
- Trace `onValueChange` upstream through `TokensSection` → `useColorRegistry` (or similar) → registry.setValue → setProjectSettings → PROJECT_CHANGED
- Check HistoryManager listener: does it batch micro-changes into one entry, or push N?
- Test in dev: click Auto-fix, then Cmd+Z. Does it revert?

**Step 2 — Conditional implementation:**
- **If Cmd+Z already reverts:** add explicit test only. ~20 LOC test, zero engine change.
- **If multiple history entries:** wrap Auto-fix in `composer.beginTransaction()` / `endTransaction()`. ~10 LOC engine, ~30 LOC test.
- **If entry label is generic "settings changed":** add label support to transaction API or HistoryFormatter. ~40 LOC engine, ~30 LOC test.

**Test plan:**
- Click Auto-fix → registry value mutates
- Cmd+Z → registry value reverts to pre-fix value
- History entry shows "Auto-fix contrast" label in version history UI
- Cmd+Z + Cmd+Y → re-applies fix

**LOC estimate:** 20-100 LOC depending on Step 1 findings. **Risk:** medium. Cross-system (registry + HistoryManager + Composer transaction).

## Sequencing

D6.a, D6.b, D6.c are independent at the engine level. UI wiring for D6.a and
D6.b touches the same file (TokenDetailView.tsx) so they should be serial OR
the second one rebases. D6.c touches a different surface.

**Recommended dispatch:**
1. D6.a + D6.c in parallel (different files entirely)
2. D6.b solo after D6.a lands (TokenDetailView.tsx serial)

OR all three solo if parallel-agent-overhead is a concern (D2/D5 wave showed
2/4 agents trip the git-stash reflex per memory `feedback_no_stash_mid_execution`).

## Risks

| Risk | Mitigation |
|------|------------|
| TokenUsageTracker refs map balloons memory on large projects | Cap or sample after 10k+ refs; document threshold |
| Existing `getAllUsage()` consumers expect specific Map identity | Tests cover existing TokensSection consumer; shim returns new Map each call |
| Auto-fix history label requires HistoryFormatter changes | Verification phase reveals scope before commit; can defer label-only polish |
| Cycle case in `findAliasesOf` returns refs from inside a cycle | Acceptable — read path, not validate. UI shows them as aliases even if graph is broken |

## Acceptance

- All 3 sub-arcs land as separate commits direct to main (solo workflow per
  memory `feedback_solo_workflow`)
- TS clean: `npx tsc --noEmit` zero new errors
- Tests: each sub-arc adds tests; existing 954-test DS+catalog suite stays green
- Live-verify against proto s02 (Aliased by row visible) + manual Cmd+Z test for D6.c

## Out of scope

- Multi-hop alias chains (depth > 1) — deferred per Phase A.2 §16.3 D4
- Token rename propagation through `{{token.X}}` refs — separate engine arc
- Used-by breakdown grouped by component/template — flat element list only
