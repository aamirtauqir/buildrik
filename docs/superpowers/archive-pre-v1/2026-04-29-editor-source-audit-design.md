# Editor Source Audit — Design Spec

**Date:** 2026-04-29
**Scope:** `packages/editor/src/` only (~2,505 files)
**Goal:** Catalog issues across 3 tracks per module. No fixes during audit phase.

---

## 1. Modules & Order

| # | Module | Files | Tracks | Skip? | Rationale |
|---|--------|-------|--------|-------|-----------|
| 1 | `react/` | 1 | BL | No | React bindings — small, fast warm-up |
| 2 | `styles/` | 3 | P, D | No | Global styles/tokens — foundational |
| 3 | `ai/` | 10 | P, D, BL | No | AI integration — bounded scope |
| 4 | `services/` | 12 | P, D, BL | No | Services — business logic heavy |
| 5 | `features/` | 29 | P, D, BL | No | Feature flags — config + runtime |
| 6 | `blocks/` | 76 | P, D, BL | No | Block registry — repeated patterns |
| 7 | `themes/` | 87 | P, D | No | Theme definitions — CSS/token duplication |
| 8 | `preview/` | 128 | P, D, BL | No | Preview rendering — perf critical |
| 9 | `engine/` | 146 | P, D, BL | No | Core engine — highest impact |
| 10 | `shared/` | 221 | P, D, BL | No | UI primitives/hooks — reused everywhere |
| 11 | `components/` | 223 | P, D, BL | No | Reusable React components — surface area |
| 12 | `project/` | 467 | P, D | No | Designer reference mirrors — mostly data |
| 13 | `editor/` | 758 | P, D, BL | No | Chrome UI — largest module, last |

**Skipped:** `assets/` (icons/images — no code to audit).

**Track legend:**
- **P** = Performance
- **D** = Duplication
- **BL** = Business Logic

---

## 2. Track Definitions

### Performance (P)

Look for patterns that degrade runtime performance:

- Unnecessary re-renders: inline objects/arrays/functions passed as props without `useMemo`/`useCallback`
- Missing memoization: `React.memo` not applied to expensive leaf components
- Oversized bundles: large imports where tree-shakeable alternatives exist
- Synchronous blocking: heavy computation in render or event handlers without `scheduler` or `requestIdleCallback`
- DOM thrashing: repeated read/write cycles without batching
- Inefficient loops: O(n²) operations where O(n) or lookup suffices
- Memory leaks: `addEventListener` without cleanup, `setInterval` without clear
- Large state updates: atomizing state that should be ref (e.g. mouse position)
- Debounce/throttle missing: on resize, scroll, input handlers

**Severity:**
- P0: Causes visible lag, dropped frames, or OOM in normal usage
- P1: Measurable overhead that compounds at scale
- P2: Micro-optimizations, cleanup debt

### Duplication (D)

Look for semantic duplication — same intent, same rules, different names or files:

- Duplicate logic: two functions doing the same transform/validation/calculation
- Duplicate types: parallel type definitions that should share a single source
- Copy-paste components: same JSX structure with only prop names changed
- Repeated validation: Zod/schema logic recreated inline instead of imported
- Duplicate hooks: custom hooks that differ only in variable names
- Duplicate CSS: same utility classes repeated across files where a class or token should exist
- Duplicate event handling: same listener pattern copy-pasted

**Severity:**
- P0: Duplicated business logic that risks divergence (e.g. auth check)
- P1: Duplicated UI/logic that should be centralized
- P2: Cosmetic duplication, near-identical utilities

### Business Logic (BL)

Look for logic errors, security gaps, and architectural violations:

- Auth gaps: missing permission checks, client-side auth decisions without server validation
- Race conditions: async state updates without cancellation or ordering guards
- Input validation bypasses: `as` casts, `any` types where validation is skipped
- Side effects in getters: `getX()` triggers network request or state mutation
- Direct imports across layers: component importing from engine internals instead of public API
- Missing error handling: async operations without catch, silent failures
- State inconsistency: multiple sources of truth for same data
- Leaked abstractions: engine details exposed to UI components
- Feature flag misuse: flags evaluated too late or cached incorrectly

**Severity:**
- P0: Security risk, data loss, or crash path
- P1: Bug risk under edge cases or future changes
- P2: Architectural drift, coupling debt

---

## 3. Audit Output Format

Each module produces a markdown file:

```
docs/superpowers/audits/YYYY-MM-DD-editor-[module]-audit.md
```

Each issue entry:

```
### [P0|P1|P2] [P|D|BL] — File:Line

**Description:** One sentence.
**Rule violated:** Which track definition applies.
**Impact:** Why it matters.
**Suggested fix (not doing now):** One-line direction.
```

---

## 4. Process Per Module

1. **Inventory:** List all files in module. Note file count per subdirectory.
2. **Performance pass:** Read files, flag patterns from Performance checklist.
3. **Duplication pass:** Cross-reference within module; flag semantic duplicates.
4. **Business Logic pass:** Read async flows, auth checks, state management.
5. **Compile:** Write audit markdown. Self-review for false positives.
6. **Commit:** `git add` audit file, commit to main.
7. **Next module.**

---

## 5. Boundaries

- **No fixes during audit.** Catalog only. Fixes happen in separate implementation plans.
- **No test files audited** unless they contain business logic (e.g. mock data that mirrors production rules).
- **No generated code audited** unless checked into source.
- **No external dependencies audited** — only first-party code.
- **Severity is conservative:** If unsure between P1 and P2, mark P2. User can escalate later.

---

## 6. Estimated Timeline

| Module | Files | Estimated Hours |
|--------|-------|-----------------|
| react + styles + ai | 14 | 2 |
| services + features | 41 | 4 |
| blocks + themes | 163 | 8 |
| preview + engine | 274 | 12 |
| shared + components | 444 | 16 |
| project + editor | 1225 | 24 |
| **Total** | **~2061** | **~66h** |

*Note: project/ contains designer reference mirrors — mostly data/config files, so actual code volume is lower than file count suggests.*
