# DS Arc · Phase A.2 — Alias Graph + Cycle Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Composer-owned `AliasResolver` that walks `DesignToken.aliasOf` pointers to a canonical token, enforces depth-1 only (Phase 1 rule from spec §16.3 D4), and detects cycles via DFS visit-set with `AliasCycleError` carrying the offending chain. Validation runs at project load (after A.1 migration) and on every alias-touching token mutation.

**Architecture:**
- `AliasResolver` lives at `engine/aliasResolver/` and is wired into `Composer` alongside the shipped `MigrationManager` (Phase A.1). It is a pure-data resolver — no DOM writes, no side effects beyond throwing on cycle / depth violations.
- API surface: `validate(tokens)` (throws or returns), `resolve(tokenId, tokens)` (returns canonical token or null), `getChain(tokenId, tokens)` (returns the alias chain for diagnostics).
- Cycle algorithm: DFS with a per-call `Set<string>` visit-set keyed by token id. On re-visit during traversal, capture chain (the path from start to the repeating id) and throw `AliasCycleError` with `chain: string[]`.
- Depth-1 rule: a token T1 may have `aliasOf = T2`, but T2 itself MUST NOT have `aliasOf` set. Phase 1 limitation per D4 — multi-hop chains are deferred to a future phase. Violation throws `AliasDepthError`.
- Integration: `useComposerInit` calls `composer.aliasResolver.validate(...)` AFTER `composer.migration.run(...)` and BEFORE `composer.importProject(...)`. Validation failure is a load-blocking warning (toast) but does NOT halt import — un-validated tokens load as-is and the user sees a banner in the Design tab (banner integration deferred to a UI sub-phase).
- Per spec D15: validation also runs on every alias-touching mutation. Phase A.2 only emits the `tokens:alias-changed` event hook (no UI listener yet) — listener wiring lands when the Design tab token editor ships in a later DS arc phase.

**Tech Stack:** TypeScript 5.3 (strict) · Vitest · React 18.3 · Buildrik EventEmitter

---

## File Structure

| Path | Responsibility | Status |
|---|---|---|
| `packages/editor/src/editor/design-system/types.ts` | `DesignToken.aliasOf?: string` field | EXISTS (Phase A.0 line 105) |
| `packages/editor/src/engine/aliasResolver/errors.ts` | `AliasCycleError`, `AliasDepthError` extending `DSError`-style base | NEW |
| `packages/editor/src/engine/aliasResolver/AliasResolver.ts` | Composer-owned resolver: `validate`, `resolve`, `getChain` | NEW |
| `packages/editor/src/engine/aliasResolver/index.ts` | Barrel: `AliasResolver`, `AliasCycleError`, `AliasDepthError` | NEW |
| `packages/editor/src/engine/aliasResolver/__tests__/errors.test.ts` | Error class shape + chain serialization | NEW |
| `packages/editor/src/engine/aliasResolver/__tests__/AliasResolver.test.ts` | Validate + resolve + cycle + depth + edge cases (≥10 cases) | NEW |
| `packages/editor/src/engine/Composer.ts` | Wire `aliasResolver` field + constructor init | MODIFY |
| `packages/editor/src/engine/__tests__/Composer.aliasResolver.test.ts` | Composer wiring smoke (mirrors `Composer.migration.test.ts`) | NEW |
| `packages/editor/src/editor/shell/hooks/useComposerInit.ts` | Call `composer.aliasResolver.validate()` after migration, before import | MODIFY |
| `packages/editor/src/editor/shell/hooks/__tests__/useComposerInit.test.ts` | Add 3 cases: validate-success / validate-throw / order-invariant | MODIFY |
| `scripts/check-alias-fixtures.mjs` | CI gate: `__fixtures__` cycle/depth fixtures match latest spec | NEW |
| `package.json` (root) | Add `gate:ds-alias` script | MODIFY |
| `.github/workflows/editor-ci.yml` | Run `gate:ds-alias` | MODIFY |
| `packages/editor/src/engine/aliasResolver/__fixtures__/cycle-2-node.json` | Two-node cycle: A→B→A | NEW |
| `packages/editor/src/engine/aliasResolver/__fixtures__/cycle-3-node.json` | Three-node cycle: A→B→C→A | NEW |
| `packages/editor/src/engine/aliasResolver/__fixtures__/depth-2.json` | Depth-2 chain: A→B→C (B has aliasOf=C, violates depth-1) | NEW |
| `packages/editor/src/engine/aliasResolver/__fixtures__/valid-alias.json` | Valid depth-1: A→B (B has no aliasOf) | NEW |

---

## Pre-flight verification

Before executing tasks, confirm baseline state:

- [ ] **Step P.1: Confirm Phase A.1 completion**

Run: `git log --oneline | grep -E "ds-phase-a1.*MigrationManager wired"`
Expected: at least one match (commit `625aadc3` or successor) — confirms `composer.migration` exists.

- [ ] **Step P.2: Confirm `aliasOf` field exists on DesignToken**

Run: `grep -n "aliasOf?:" packages/editor/src/editor/design-system/types.ts`
Expected: a single match showing `aliasOf?: string;` near line 105.

- [ ] **Step P.3: Confirm engine integration step shipped (Step 2 of this session)**

Run: `git log --oneline | grep -E "wire composer.migration.run"`
Expected: commit `e7e7b19f` — confirms migration runs at project load. A.2 validation hooks attach AFTER this point.

- [ ] **Step P.4: Confirm path-scoped baseline green**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/migrations/projectMigrations src/engine/migration src/editor/shell/hooks/__tests__/useComposerInit.test.ts --reporter=dot 2>&1 | tail -5`
Expected: all path-scoped tests pass (32+ tests including A.1 + integration).

If any pre-flight fails, STOP — Phase A.1 is not actually green. Investigate before continuing.

---

## Task 1: Define error classes — `AliasCycleError`, `AliasDepthError`

**Files:**
- Create: `packages/editor/src/engine/aliasResolver/errors.ts`
- Test: `packages/editor/src/engine/aliasResolver/__tests__/errors.test.ts`

- [ ] **Step 1.1: Write failing tests**

Create `packages/editor/src/engine/aliasResolver/__tests__/errors.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { AliasCycleError, AliasDepthError } from "../errors";

describe("AliasCycleError", () => {
  it("extends Error with chain field", () => {
    const err = new AliasCycleError(["color-primary", "color-brand", "color-primary"]);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AliasCycleError");
    expect(err.chain).toEqual(["color-primary", "color-brand", "color-primary"]);
  });

  it("message includes the chain joined by arrows", () => {
    const err = new AliasCycleError(["a", "b", "a"]);
    expect(err.message).toContain("a → b → a");
  });

  it("preserves chain across .toJSON for transport", () => {
    const err = new AliasCycleError(["x", "y", "x"]);
    const json = err.toJSON();
    expect(json).toMatchObject({ name: "AliasCycleError", chain: ["x", "y", "x"] });
  });
});

describe("AliasDepthError", () => {
  it("extends Error with sourceId + targetId", () => {
    const err = new AliasDepthError("color-primary", "color-brand");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AliasDepthError");
    expect(err.sourceId).toBe("color-primary");
    expect(err.targetId).toBe("color-brand");
  });

  it("message indicates depth-1 violation with both ids", () => {
    const err = new AliasDepthError("a", "b");
    expect(err.message).toContain("depth-1");
    expect(err.message).toContain("a");
    expect(err.message).toContain("b");
  });
});
```

- [ ] **Step 1.2: Run test to confirm FAIL**

Run: `cd packages/editor && pnpm vitest run src/engine/aliasResolver/__tests__/errors.test.ts`
Expected: FAIL — module `../errors` does not exist.

- [ ] **Step 1.3: Implement error classes**

Create `packages/editor/src/engine/aliasResolver/errors.ts`:

```typescript
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
```

- [ ] **Step 1.4: Run test to confirm PASS**

Run: `cd packages/editor && pnpm vitest run src/engine/aliasResolver/__tests__/errors.test.ts`
Expected: PASS · 5 tests.

- [ ] **Step 1.5: Commit**

```bash
git add packages/editor/src/engine/aliasResolver/errors.ts \
  packages/editor/src/engine/aliasResolver/__tests__/errors.test.ts
git commit -m "feat(ds-phase-a2): AliasCycleError + AliasDepthError classes"
```

---

## Task 2: Test fixtures — valid + cycle-2 + cycle-3 + depth-2

**Files:**
- Create: `packages/editor/src/engine/aliasResolver/__fixtures__/valid-alias.json`
- Create: `packages/editor/src/engine/aliasResolver/__fixtures__/cycle-2-node.json`
- Create: `packages/editor/src/engine/aliasResolver/__fixtures__/cycle-3-node.json`
- Create: `packages/editor/src/engine/aliasResolver/__fixtures__/depth-2.json`

- [ ] **Step 2.1: Create valid-alias fixture**

Create `packages/editor/src/engine/aliasResolver/__fixtures__/valid-alias.json`:

```json
{
  "tokens": [
    {
      "id": "color-primary",
      "name": "Primary",
      "value": "",
      "category": "colors",
      "cssVar": "--bd-color-primary",
      "type": "color",
      "kind": "color",
      "friendlyName": "Primary",
      "aliasOf": "color-blue-500"
    },
    {
      "id": "color-blue-500",
      "name": "Blue 500",
      "value": "#2D6DFF",
      "category": "colors",
      "cssVar": "--bd-color-blue-500",
      "type": "color",
      "kind": "color",
      "friendlyName": "Blue 500"
    }
  ]
}
```

- [ ] **Step 2.2: Create cycle-2-node fixture**

Create `packages/editor/src/engine/aliasResolver/__fixtures__/cycle-2-node.json`:

```json
{
  "tokens": [
    {
      "id": "a",
      "name": "A",
      "value": "",
      "category": "colors",
      "cssVar": "--bd-a",
      "type": "color",
      "kind": "color",
      "friendlyName": "A",
      "aliasOf": "b"
    },
    {
      "id": "b",
      "name": "B",
      "value": "",
      "category": "colors",
      "cssVar": "--bd-b",
      "type": "color",
      "kind": "color",
      "friendlyName": "B",
      "aliasOf": "a"
    }
  ]
}
```

- [ ] **Step 2.3: Create cycle-3-node fixture**

Create `packages/editor/src/engine/aliasResolver/__fixtures__/cycle-3-node.json`:

```json
{
  "tokens": [
    {
      "id": "a",
      "name": "A",
      "value": "",
      "category": "colors",
      "cssVar": "--bd-a",
      "type": "color",
      "kind": "color",
      "friendlyName": "A",
      "aliasOf": "b"
    },
    {
      "id": "b",
      "name": "B",
      "value": "",
      "category": "colors",
      "cssVar": "--bd-b",
      "type": "color",
      "kind": "color",
      "friendlyName": "B",
      "aliasOf": "c"
    },
    {
      "id": "c",
      "name": "C",
      "value": "",
      "category": "colors",
      "cssVar": "--bd-c",
      "type": "color",
      "kind": "color",
      "friendlyName": "C",
      "aliasOf": "a"
    }
  ]
}
```

- [ ] **Step 2.4: Create depth-2 fixture**

Create `packages/editor/src/engine/aliasResolver/__fixtures__/depth-2.json`:

```json
{
  "tokens": [
    {
      "id": "a",
      "name": "A",
      "value": "",
      "category": "colors",
      "cssVar": "--bd-a",
      "type": "color",
      "kind": "color",
      "friendlyName": "A",
      "aliasOf": "b"
    },
    {
      "id": "b",
      "name": "B",
      "value": "",
      "category": "colors",
      "cssVar": "--bd-b",
      "type": "color",
      "kind": "color",
      "friendlyName": "B",
      "aliasOf": "c"
    },
    {
      "id": "c",
      "name": "C",
      "value": "#2D6DFF",
      "category": "colors",
      "cssVar": "--bd-c",
      "type": "color",
      "kind": "color",
      "friendlyName": "C"
    }
  ]
}
```

- [ ] **Step 2.5: Commit**

```bash
git add packages/editor/src/engine/aliasResolver/__fixtures__/
git commit -m "test(ds-phase-a2): alias fixtures (valid + cycle-2 + cycle-3 + depth-2)"
```

---

## Task 3: AliasResolver skeleton + barrel

**Files:**
- Create: `packages/editor/src/engine/aliasResolver/AliasResolver.ts`
- Create: `packages/editor/src/engine/aliasResolver/index.ts`

- [ ] **Step 3.1: Implement skeleton**

Create `packages/editor/src/engine/aliasResolver/AliasResolver.ts`:

```typescript
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

      const visited = new Set<string>();
      visited.add(start.id);
      const chain: string[] = [start.id];

      let cursor: DesignToken | undefined = byId.get(start.aliasOf);
      while (cursor) {
        chain.push(cursor.id);
        if (visited.has(cursor.id)) {
          // chain currently includes the repeated id at the end, which is
          // exactly the format AliasCycleError expects.
          throw new AliasCycleError(chain);
        }
        visited.add(cursor.id);

        if (cursor.aliasOf) {
          // Depth-1 rule: target of an alias MUST be a leaf.
          throw new AliasDepthError(start.id, cursor.id);
        }
        cursor = undefined; // depth-1 valid leaf reached
      }
    }
  }

  /**
   * Resolve a token id to its canonical (non-alias) token by walking aliasOf.
   * Returns undefined if the id is unknown OR the chain leads to an unknown id.
   * Caller is expected to have called validate() already; if not, this method
   * still terminates safely thanks to the per-call visit-set.
   */
  resolve(tokenId: string, tokens: readonly DesignToken[]): DesignToken | undefined {
    const byId = new Map<string, DesignToken>();
    for (const t of tokens) byId.set(t.id, t);

    const visited = new Set<string>();
    let cursor = byId.get(tokenId);
    while (cursor) {
      if (visited.has(cursor.id)) return undefined; // safety: cycle short-circuit
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
}
```

- [ ] **Step 3.2: Create barrel**

Create `packages/editor/src/engine/aliasResolver/index.ts`:

```typescript
export { AliasResolver } from "./AliasResolver";
export { AliasCycleError, AliasDepthError } from "./errors";
```

- [ ] **Step 3.3: TSC check**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "aliasResolver|AliasResolver" | head`
Expected: empty output (no errors in new files).

- [ ] **Step 3.4: Commit**

```bash
git add packages/editor/src/engine/aliasResolver/AliasResolver.ts \
  packages/editor/src/engine/aliasResolver/index.ts
git commit -m "feat(ds-phase-a2): AliasResolver skeleton with validate/resolve/getChain"
```

---

## Task 4: AliasResolver — full validate + resolve test coverage

**Files:**
- Create: `packages/editor/src/engine/aliasResolver/__tests__/AliasResolver.test.ts`

- [ ] **Step 4.1: Write the failing test suite**

Create `packages/editor/src/engine/aliasResolver/__tests__/AliasResolver.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { AliasResolver } from "../AliasResolver";
import { AliasCycleError, AliasDepthError } from "../errors";
import type { DesignToken } from "../../../editor/design-system";
import type { EventEmitter } from "../../EventEmitter";
import validFixture from "../__fixtures__/valid-alias.json";
import cycle2Fixture from "../__fixtures__/cycle-2-node.json";
import cycle3Fixture from "../__fixtures__/cycle-3-node.json";
import depth2Fixture from "../__fixtures__/depth-2.json";

function makeEvents(): EventEmitter {
  return { emit: () => {}, on: () => {}, off: () => {} } as unknown as EventEmitter;
}

describe("AliasResolver.validate", () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver(makeEvents());
  });

  it("accepts an empty token list", () => {
    expect(() => resolver.validate([])).not.toThrow();
  });

  it("accepts tokens without any aliasOf", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "#000", category: "colors", cssVar: "--bd-a", type: "color" },
      { id: "b", name: "B", value: "#fff", category: "colors", cssVar: "--bd-b", type: "color" },
    ];
    expect(() => resolver.validate(tokens)).not.toThrow();
  });

  it("accepts a valid depth-1 alias", () => {
    expect(() => resolver.validate(validFixture.tokens as DesignToken[])).not.toThrow();
  });

  it("throws AliasCycleError on a 2-node cycle (a → b → a)", () => {
    let thrown: unknown;
    try { resolver.validate(cycle2Fixture.tokens as DesignToken[]); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(AliasCycleError);
    expect((thrown as AliasCycleError).chain).toEqual(["a", "b", "a"]);
  });

  it("throws AliasCycleError on a 3-node cycle (a → b → c → a)", () => {
    let thrown: unknown;
    try { resolver.validate(cycle3Fixture.tokens as DesignToken[]); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(AliasCycleError);
    // First chain found has the start token at both ends.
    const chain = (thrown as AliasCycleError).chain;
    expect(chain[0]).toBe(chain[chain.length - 1]);
    expect(chain.length).toBeGreaterThanOrEqual(3);
  });

  it("throws AliasDepthError on a depth-2 chain (a → b → c)", () => {
    let thrown: unknown;
    try { resolver.validate(depth2Fixture.tokens as DesignToken[]); } catch (e) { thrown = e; }
    expect(thrown).toBeInstanceOf(AliasDepthError);
    expect((thrown as AliasDepthError).sourceId).toBe("a");
    expect((thrown as AliasDepthError).targetId).toBe("b");
  });

  it("does NOT throw when alias points to a non-existent id (treated as leaf, validated by registry separately)", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", aliasOf: "ghost" },
    ];
    expect(() => resolver.validate(tokens)).not.toThrow();
  });
});

describe("AliasResolver.resolve", () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver(makeEvents());
  });

  it("returns undefined for unknown id", () => {
    expect(resolver.resolve("ghost", [])).toBeUndefined();
  });

  it("returns the same token when no aliasOf", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "#000", category: "colors", cssVar: "--bd-a", type: "color" },
    ];
    expect(resolver.resolve("a", tokens)?.id).toBe("a");
  });

  it("walks aliasOf to canonical leaf", () => {
    const tokens = validFixture.tokens as DesignToken[];
    const result = resolver.resolve("color-primary", tokens);
    expect(result?.id).toBe("color-blue-500");
    expect(result?.value).toBe("#2D6DFF");
  });

  it("safely short-circuits on cycle (returns undefined)", () => {
    const tokens = cycle2Fixture.tokens as DesignToken[];
    expect(resolver.resolve("a", tokens)).toBeUndefined();
  });

  it("returns undefined when alias target is unknown", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color", aliasOf: "ghost" },
    ];
    expect(resolver.resolve("a", tokens)).toBeUndefined();
  });
});

describe("AliasResolver.getChain", () => {
  let resolver: AliasResolver;

  beforeEach(() => {
    resolver = new AliasResolver(makeEvents());
  });

  it("returns [] for unknown id", () => {
    expect(resolver.getChain("ghost", [])).toEqual([]);
  });

  it("returns [tokenId] when no aliasOf", () => {
    const tokens: DesignToken[] = [
      { id: "a", name: "A", value: "", category: "colors", cssVar: "--bd-a", type: "color" },
    ];
    expect(resolver.getChain("a", tokens)).toEqual(["a"]);
  });

  it("returns full chain for valid alias", () => {
    const tokens = validFixture.tokens as DesignToken[];
    expect(resolver.getChain("color-primary", tokens)).toEqual(["color-primary", "color-blue-500"]);
  });

  it("returns chain ending at the cycle node for a cyclic input", () => {
    const tokens = cycle2Fixture.tokens as DesignToken[];
    const chain = resolver.getChain("a", tokens);
    expect(chain[0]).toBe("a");
    expect(chain[chain.length - 1]).toBe("a");
  });
});
```

- [ ] **Step 4.2: Run tests, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/engine/aliasResolver/__tests__/AliasResolver.test.ts`
Expected: PASS · 14 tests (3 + 5 + 4 + 2 = wait, recount: validate 7 + resolve 5 + getChain 4 = 16). Should be 16 PASS.

- [ ] **Step 4.3: Commit**

```bash
git add packages/editor/src/engine/aliasResolver/__tests__/AliasResolver.test.ts
git commit -m "test(ds-phase-a2): AliasResolver validate/resolve/getChain coverage"
```

---

## Task 5: Wire AliasResolver into Composer

**Files:**
- Modify: `packages/editor/src/engine/Composer.ts`
- Create: `packages/editor/src/engine/__tests__/Composer.aliasResolver.test.ts`

- [ ] **Step 5.1: Write the failing wiring test**

Create `packages/editor/src/engine/__tests__/Composer.aliasResolver.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Composer } from "../Composer";
import { AliasResolver } from "../aliasResolver";

describe("Composer · alias resolver wiring", () => {
  let originalGetContext: any;

  beforeAll(() => {
    if (typeof globalThis.indexedDB === "undefined") {
      const fireOnSuccess = (req: any) => {
        Promise.resolve().then(() => req.onsuccess?.());
      };
      Object.defineProperty(globalThis, "indexedDB", {
        value: {
          open: () => {
            const req = {
              onsuccess: () => {},
              onerror: () => {},
              onupgradeneeded: () => {},
              result: {
                createObjectStore: () => ({ createIndex: () => {} }),
                transaction: () => ({
                  objectStore: () => ({
                    get: () => { const r = { result: undefined }; fireOnSuccess(r); return r; },
                    put: () => { const r = {}; fireOnSuccess(r); return r; },
                    getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; },
                    index: () => ({
                      getAll: () => { const r = { result: [] }; fireOnSuccess(r); return r; },
                    }),
                  }),
                }),
                close: () => {},
                objectStoreNames: { contains: () => false },
              },
            };
            fireOnSuccess(req);
            return req;
          },
          deleteDatabase: () => ({ onsuccess: () => {}, onerror: () => {} }),
        },
        writable: true,
        configurable: true,
      });
    }

    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId: string) {
      if (contextId === "2d") {
        return {
          fillStyle: "", strokeStyle: "", lineWidth: 1, canvas: this,
          getImageData: () => ({ data: new Uint8ClampedArray(4) }),
          putImageData: () => {}, drawImage: () => {}, fillRect: () => {},
          clearRect: () => {}, strokeRect: () => {}, beginPath: () => {},
          closePath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {},
          fill: () => {}, arc: () => {}, rect: () => {}, clip: () => {},
          save: () => {}, restore: () => {}, translate: () => {}, scale: () => {},
          rotate: () => {}, transform: () => {}, setTransform: () => {},
          createLinearGradient: () => ({ addColorStop: () => {} }),
          createRadialGradient: () => ({ addColorStop: () => {} }),
          createPattern: () => null, measureText: () => ({ width: 0 }),
          font: "", textAlign: "start", textBaseline: "alphabetic",
        } as any;
      }
      return originalGetContext.call(this, contextId);
    };
  });

  afterAll(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it("exposes composer.aliasResolver as an AliasResolver instance", () => {
    const c = new Composer({} as any);
    expect(c.aliasResolver).toBeInstanceOf(AliasResolver);
  });
});
```

- [ ] **Step 5.2: Run, expect FAIL**

Run: `cd packages/editor && pnpm vitest run src/engine/__tests__/Composer.aliasResolver.test.ts`
Expected: FAIL — `c.aliasResolver` is undefined.

- [ ] **Step 5.3: Add the field to Composer**

Modify `packages/editor/src/engine/Composer.ts`:

Add import near other engine imports:

```typescript
import { AliasResolver } from "./aliasResolver";
```

Add the field declaration near `migration` (around line 110):

```typescript
  readonly migration!: MigrationManager;
  readonly aliasResolver!: AliasResolver;
```

Add the constructor init near `this.migration = new MigrationManager(this);` (around line 164):

```typescript
    this.migration = new MigrationManager(this);
    this.aliasResolver = new AliasResolver(this);
```

(`this` is an EventEmitter; `Composer extends EventEmitter` per line 59.)

- [ ] **Step 5.4: Run, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/engine/__tests__/Composer.aliasResolver.test.ts src/engine/__tests__/Composer.migration.test.ts`
Expected: PASS · 2 tests (new + existing wiring smoke).

- [ ] **Step 5.5: Commit**

```bash
git add packages/editor/src/engine/Composer.ts \
  packages/editor/src/engine/__tests__/Composer.aliasResolver.test.ts
git commit -m "feat(ds-phase-a2): wire composer.aliasResolver"
```

---

## Task 6: Hook validate() at project-load (after migration, before import)

**Files:**
- Modify: `packages/editor/src/editor/shell/hooks/useComposerInit.ts`
- Modify: `packages/editor/src/editor/shell/hooks/__tests__/useComposerInit.test.ts`

- [ ] **Step 6.1: Add validate() call after migration in useComposerInit**

Modify `packages/editor/src/editor/shell/hooks/useComposerInit.ts` — extend the existing `try` block that wraps `instance.migration.run(...)` to also call `instance.aliasResolver.validate(...)` on the migrated tokens.

Locate (just shipped in commit `e7e7b19f`):

```typescript
            try {
              const result = instance.migration.run({
                project: { tokens: (data.styles ?? []) as unknown as DesignToken[] },
                currentVersion: fromVersion,
                siteId,
              });
              if (result.newVersion !== fromVersion) {
                toImport = {
                  ...data,
                  styles: result.project.tokens as unknown as ProjectData["styles"],
                  dsSchemaVersion: result.newVersion,
                };
              }
            } catch (err) {
```

Insert validate() AFTER the assignment to `toImport` — INSIDE the same try, BEFORE the catch:

```typescript
            try {
              const result = instance.migration.run({
                project: { tokens: (data.styles ?? []) as unknown as DesignToken[] },
                currentVersion: fromVersion,
                siteId,
              });
              if (result.newVersion !== fromVersion) {
                toImport = {
                  ...data,
                  styles: result.project.tokens as unknown as ProjectData["styles"],
                  dsSchemaVersion: result.newVersion,
                };
              }
              // A.2 integration: validate the alias graph on the post-migration
              // payload. Failure throws AliasCycleError or AliasDepthError —
              // caught below alongside migration errors so the editor still
              // loads with a warning.
              instance.aliasResolver.validate(
                (toImport.styles ?? []) as unknown as DesignToken[]
              );
            } catch (err) {
              console.error("[BuildrikSync] DS migration failed:", err);
              addToast({
                title: "Project update failed",
                description: "Could not update design system schema. Loaded as-is.",
                tone: "warning",
              });
            }
```

(One key change: the catch block keeps a single message because both migration and alias validation errors map to the same UX surface in Phase A.2 — a more granular toast for alias errors lands when the Design tab UI ships.)

- [ ] **Step 6.2: Add migration mock extension**

Modify `packages/editor/src/editor/shell/hooks/__tests__/useComposerInit.test.ts` — add `aliasResolver` to `mockComposer`:

```typescript
  migration: {
    run: vi.fn(({ project, currentVersion }) => ({
      project,
      newVersion: currentVersion,
    })),
  },
  aliasResolver: {
    validate: vi.fn(),
    resolve: vi.fn(),
    getChain: vi.fn(),
  },
  destroy: vi.fn(),
```

- [ ] **Step 6.3: Add 3 alias-validation test cases**

Append to the bottom of `useComposerInit.test.ts`, AFTER the migration describe block:

```typescript
describe("useComposerInit — alias validation runs at load (A.2)", () => {
  beforeEach(() => {
    vi.useRealTimers();
    Object.keys(eventHandlers).forEach((k) => {
      delete eventHandlers[k];
    });
    vi.clearAllMocks();
    mockComposer.on.mockImplementation((event: string, handler: EventHandler) => {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
    });
    mockComposer.emit.mockImplementation((event: string, ...args: unknown[]) => {
      (eventHandlers[event] ?? []).forEach((h) => h(...args));
    });
    mockComposer.elements.getAllPages.mockReturnValue([{ id: "page-1" }]);
    mockComposer.history.canUndo.mockReturnValue(false);
    mockComposer.history.canRedo.mockReturnValue(false);
    mockComposer.migration.run.mockReset();
    mockComposer.aliasResolver.validate.mockReset();
  });

  async function flushMicrotasks() {
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
  }

  it("calls aliasResolver.validate on migrated tokens AFTER migration.run", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-A2");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [],
      assets: [],
      dsSchemaVersion: 0,
    });
    mockComposer.migration.run.mockReturnValue({
      project: { tokens: [{ id: "color-primary", aliasOf: "color-blue-500" }, { id: "color-blue-500" }] },
      newVersion: 1,
    });

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast: vi.fn(),
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowTemplates: vi.fn(),
        setShowExporter: vi.fn(),
        setShowAI: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(mockComposer.aliasResolver.validate).toHaveBeenCalledTimes(1);
    // validate runs against the migrated tokens.
    const validateArgs = mockComposer.aliasResolver.validate.mock.calls[0][0];
    expect(validateArgs).toEqual([
      { id: "color-primary", aliasOf: "color-blue-500" },
      { id: "color-blue-500" },
    ]);

    // Order invariant: migration.run BEFORE aliasResolver.validate BEFORE importProject.
    const migOrder = mockComposer.migration.run.mock.invocationCallOrder[0];
    const valOrder = mockComposer.aliasResolver.validate.mock.invocationCallOrder[0];
    const impOrder = mockComposer.importProject.mock.invocationCallOrder[0];
    expect(migOrder).toBeLessThan(valOrder);
    expect(valOrder).toBeLessThan(impOrder);
  });

  it("alias cycle throw → warning toast + still imports unmigrated data", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-A2-cycle");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [{ id: "a", aliasOf: "b" }, { id: "b", aliasOf: "a" }],
      assets: [],
      dsSchemaVersion: 1,
    });
    mockComposer.migration.run.mockReturnValue({
      project: { tokens: [{ id: "a", aliasOf: "b" }, { id: "b", aliasOf: "a" }] },
      newVersion: 1,
    });
    mockComposer.aliasResolver.validate.mockImplementation(() => {
      const err = new Error("[alias-resolver] cycle detected: a → b → a");
      err.name = "AliasCycleError";
      throw err;
    });
    const addToast = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast,
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowTemplates: vi.fn(),
        setShowExporter: vi.fn(),
        setShowAI: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "warning", title: "Project update failed" })
    );
    expect(mockComposer.importProject).toHaveBeenCalledTimes(1);
    consoleSpy.mockRestore();
  });

  it("validate success → no toast, importProject runs as normal", async () => {
    const { getSiteIdFromUrl, loadProject } = await import("@/services/BuildrikSyncProvider");
    (getSiteIdFromUrl as ReturnType<typeof vi.fn>).mockReturnValue("site-A2-ok");
    (loadProject as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: "1.0",
      pages: [],
      styles: [{ id: "a" }],
      assets: [],
      dsSchemaVersion: 1,
    });
    mockComposer.migration.run.mockReturnValue({
      project: { tokens: [{ id: "a" }] },
      newVersion: 1,
    });
    mockComposer.aliasResolver.validate.mockImplementation(() => { /* no throw */ });
    const addToast = vi.fn();

    renderHook(() =>
      useComposerInit({
        containerRef: makeContainerRef(),
        addToast,
        setCanUndo: vi.fn(),
        setCanRedo: vi.fn(),
        setDevice: vi.fn(),
        setZoom: vi.fn(),
        setShowTemplates: vi.fn(),
        setShowExporter: vi.fn(),
        setShowAI: vi.fn(),
        setShowComponentView: vi.fn(),
        setIsDirty: vi.fn(),
        setSaveState: vi.fn(),
      })
    );

    act(() => {
      mockComposer.emit("composer:ready");
    });
    await flushMicrotasks();

    expect(mockComposer.aliasResolver.validate).toHaveBeenCalledTimes(1);
    expect(addToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ tone: "warning", title: "Project update failed" })
    );
    expect(mockComposer.importProject).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6.4: Run path-scoped tests**

Run: `cd packages/editor && pnpm vitest run src/editor/shell/hooks/__tests__/useComposerInit.test.ts`
Expected: PASS · 9 tests (3 autosave + 3 migration + 3 alias-validation).

- [ ] **Step 6.5: Commit**

```bash
git add packages/editor/src/editor/shell/hooks/useComposerInit.ts \
  packages/editor/src/editor/shell/hooks/__tests__/useComposerInit.test.ts
git commit -m "feat(ds-phase-a2): hook aliasResolver.validate() at project load"
```

---

## Task 7: Emit `tokens:alias-changed` event hook on alias-mutating updates

**Files:**
- Modify: `packages/editor/src/engine/aliasResolver/AliasResolver.ts`
- Modify: `packages/editor/src/engine/aliasResolver/__tests__/AliasResolver.test.ts`

- [ ] **Step 7.1: Add a `validateAndEmit` method that fires the event hook on success**

Append to `AliasResolver.ts`:

```typescript
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
```

- [ ] **Step 7.2: Add a test for `validateAndEmit`**

Append to the `AliasResolver.test.ts` describe block (after the `getChain` describe):

```typescript
describe("AliasResolver.validateAndEmit", () => {
  it("emits tokens:alias-changed on success", () => {
    const emit = vi.fn();
    const events = { emit, on: () => {}, off: () => {} } as unknown as EventEmitter;
    const resolver = new AliasResolver(events);
    const tokens = validFixture.tokens as DesignToken[];
    resolver.validateAndEmit(tokens);
    expect(emit).toHaveBeenCalledWith("tokens:alias-changed", { count: 1 });
  });

  it("does NOT emit on validation failure", () => {
    const emit = vi.fn();
    const events = { emit, on: () => {}, off: () => {} } as unknown as EventEmitter;
    const resolver = new AliasResolver(events);
    const tokens = cycle2Fixture.tokens as DesignToken[];
    expect(() => resolver.validateAndEmit(tokens)).toThrow(AliasCycleError);
    expect(emit).not.toHaveBeenCalled();
  });
});
```

(Add `import { vi } from "vitest";` to the existing import line if not present — Vitest's `vi` is already in the existing `import { describe, it, expect, beforeEach } from "vitest";` line, extend it.)

- [ ] **Step 7.3: Run tests, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/engine/aliasResolver/__tests__/AliasResolver.test.ts`
Expected: PASS · 18 tests (16 from Task 4 + 2 new).

- [ ] **Step 7.4: Commit**

```bash
git add packages/editor/src/engine/aliasResolver/AliasResolver.ts \
  packages/editor/src/engine/aliasResolver/__tests__/AliasResolver.test.ts
git commit -m "feat(ds-phase-a2): validateAndEmit fires tokens:alias-changed on success"
```

---

## Task 8: CI gate — `gate:ds-alias` enforces fixture pair completeness

**Files:**
- Create: `scripts/check-alias-fixtures.mjs`
- Modify: `package.json` (root)
- Modify: `.github/workflows/editor-ci.yml`

- [ ] **Step 8.1: Write the gate script**

Create `scripts/check-alias-fixtures.mjs`:

```javascript
#!/usr/bin/env node
/**
 * gate:ds-alias — enforce that every documented alias-error category
 * has a matching fixture under
 * packages/editor/src/engine/aliasResolver/__fixtures__/.
 *
 * Required fixtures (one per category):
 *   - valid-alias.json
 *   - cycle-2-node.json
 *   - cycle-3-node.json
 *   - depth-2.json
 *
 * Add a new category? Add the fixture file and append it here.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED = [
  "valid-alias.json",
  "cycle-2-node.json",
  "cycle-3-node.json",
  "depth-2.json",
];

const root = resolve(
  process.cwd(),
  "packages/editor/src/engine/aliasResolver/__fixtures__"
);

const missing = REQUIRED.filter((f) => !existsSync(resolve(root, f)));

if (missing.length > 0) {
  console.error(
    `[gate:ds-alias] missing alias fixtures in ${root}:\n  ${missing.join("\n  ")}`
  );
  process.exit(1);
}

console.log(`[gate:ds-alias] OK — ${REQUIRED.length} fixtures present`);
```

- [ ] **Step 8.2: Add npm script**

Modify root `package.json` — under `"scripts"`, add (alphabetical order with other `gate:ds-*`):

```json
"gate:ds-alias": "node scripts/check-alias-fixtures.mjs",
```

- [ ] **Step 8.3: Verify locally**

Run: `pnpm run gate:ds-alias`
Expected: `[gate:ds-alias] OK — 4 fixtures present` and exit 0.

- [ ] **Step 8.4: Wire into editor-ci**

Modify `.github/workflows/editor-ci.yml` — add a step alongside `gate:ds-migrations`:

```yaml
      - name: Run gate:ds-alias
        run: pnpm run gate:ds-alias
```

(Insert after the existing `gate:ds-migrations` step — keep grouping by domain.)

- [ ] **Step 8.5: Commit**

```bash
git add scripts/check-alias-fixtures.mjs package.json .github/workflows/editor-ci.yml
git commit -m "ci(ds-phase-a2): gate:ds-alias enforces fixture coverage"
```

---

## Task 9: Path-scoped baseline + commit closure

**Files:** none (verification only)

- [ ] **Step 9.1: Run all A.2 path-scoped tests**

Run: `cd packages/editor && pnpm vitest run src/engine/aliasResolver src/engine/__tests__/Composer.aliasResolver.test.ts src/engine/__tests__/Composer.migration.test.ts src/editor/shell/hooks/__tests__/useComposerInit.test.ts --reporter=dot 2>&1 | tail -10`
Expected: all pass · ≥30 tests (errors 5 + AliasResolver 18 + Composer wiring 2 + useComposerInit 9, plus prior A.1 baseline).

- [ ] **Step 9.2: Run the gate**

Run: `pnpm run gate:ds-alias`
Expected: `[gate:ds-alias] OK — 4 fixtures present`.

- [ ] **Step 9.3: Verify path-scoped TSC clean**

Run: `cd packages/editor && npx tsc --noEmit 2>&1 | grep -E "aliasResolver|Composer\.ts:|useComposerInit" | head`
Expected: empty output. (Pre-existing errors elsewhere in the editor are out-of-arc.)

- [ ] **Step 9.4: Tag the phase locally** (do NOT push without explicit user OK per `feedback_solo_workflow`)

Run:
```bash
git tag ds-phase-a2-complete
git tag --list 'ds-phase-a*'
```
Expected: tag list includes `ds-phase-a0-complete`, `ds-phase-a1-complete`, `ds-phase-a2-complete`.

- [ ] **Step 9.5: Final commit (no-op marker if needed)**

If all prior commits captured the work, no closure commit is required. Otherwise, commit any straggler files:

```bash
git status
# if working tree clean: skip
# if files remain: stage explicit paths and commit:
# git add <explicit paths>
# git commit -m "chore(ds-phase-a2): closure"
```

---

## Phase A.2 Closure Checklist

- [ ] All 9 tasks complete with passing tests
- [ ] `gate:ds-alias` green locally
- [ ] Composer wiring smoke test green (`composer.aliasResolver` is `AliasResolver` instance)
- [ ] `useComposerInit` end-to-end test passes 9/9 (autosave + migration + alias-validation)
- [ ] Tag `ds-phase-a2-complete` exists locally
- [ ] CLAUDE.md memory entry written for the phase (`project_ds_phase_a2_shipped_YYYYMMDD.md`)

## Out-of-Scope (deferred to later phases)

- Multi-hop alias chains (depth > 1) — Phase 1 explicitly limits to depth-1 per spec D4.
- `tokens:alias-changed` UI listener (Design tab token editor) — listener wires when Design tab ships in a later DS arc phase.
- Granular toast for cycle vs depth errors — both currently surface the same generic "Project update failed" toast. UI sub-phase ships the typed mapping.
- Inspector chip ARIA + accessibility per D6/Pass-6 — chip integration belongs to the Inspector binding-chip work in Phase B.
- Dark-mode resolver (`composer.darkResolver`) — D8 cherry-pick, sequenced for Phase B per CEO addendum §16.2.

---

## Notes for the Implementer

- **TDD is required.** Every task starts with a failing test, then minimal implementation, then green. Skipping the failing-test step is a process bug, not a shortcut.
- **Stage paths explicitly in `git add`.** Per memory `project_ds_phase_a1_shipped_20260508.md` finding 4: T7 of A.1 polluted a commit with 7 unrelated sibling-session files via `git add .`. List paths in every `git add`.
- **Path-scoped baselines only.** The full vitest suite has 346 unrelated failures from concurrent sibling-session work; do not chase them. Run the path-scoped commands listed in each task instead.
- **Phase A.2 fail-soft policy.** Both alias errors and migration errors fall through to the same warning toast in Phase A.2. Granular UX comes when the Design tab UI ships and can render a typed banner.
