# Vibcoder-Finish Migration — Design Spec

**Date:** 2026-05-07
**Author:** Brainstorm session (Saqib + Claude)
**Status:** Draft, pending implementation plan
**Arc estimate:** ~11–17 PRs over 2–3 weeks at Q2 daily-ship cadence

---

## 1. Goal

Finish the vibcoder design system migration in `packages/editor/`. Eliminate the legacy `.buildrick-*` JSX class namespace from editor chrome by routing every consumer to one of three canonical homes (vibcoder primitives, `shared/ui/` Buildrik extensions, or pure-CSS tier files). Lock the result behind a CI gate so the namespace cannot return.

### Done criteria (verifiable, all-or-nothing)

| # | Bar | How verified |
|---|-----|-------------|
| 1 | Zero `.buildrick-*` className refs in `src/editor/**/*.tsx \| .ts` | `grep -rn "buildrick-" src/editor/ --include="*.tsx" --include="*.ts" \| wc -l` returns 0 |
| 2 | `themes/components.css` <50 LOC, renamed `legacy-components.css` | `wc -l src/themes/legacy-components.css` < 50 |
| 3 | All replacements live in vibcoder, `shared/ui/`, or `themes/components/<tier>/` + `a11y.css` | Phase 0 audit map matches final state |
| 4 | CI gate ERROR on any new `.buildrick-*` className in editor JSX | `scripts/check-buildrick-baseline.mjs` mode = ERROR, baseline = 0 |
| 5 | All net-new vibcoder primitives ship with `.test.tsx` pair | vitest run green, paired files exist |
| 6 | All `.buildrick-*` CSS selectors live ONLY in tier CSS (`themes/components/<tier>/*.css`) or `a11y.css` — none in `legacy-components.css` after Phase Final | grep `legacy-components.css` for `.buildrick-` returns 0 hits (canonical primitive selectors at `themes/components/<tier>/*.css` are correct + retained — they're the canonical names that `_aliases.css` maps `.bd-*` to) |

### Starting numbers (2026-05-07)

- 1622 `.buildrick-*` className refs in editor JSX/TS files (verified)
- 2977 `.bd-*` refs (already migrated)
- 300 LOC in `themes/components.css` (target <50)
- ~50 distinct legacy class names across the 1622 refs (audit confirms exact)

---

## 2. Three-Home Contract

Every legacy `.buildrick-*` ref migrates to **one** of three homes via the admission test below.

### Home 1 — vibcoder primitive

- **Path:** `src/editor/shared/vibcoder/<Name>.tsx` + `src/themes/components/<tier>/<name>.css` + `<Name>.test.tsx`
- **Tiers:** `atoms/` · `molecules/` · `organisms/` · `layouts/`
- **Class namespace:** `.bd-<name>` in JSX, `.buildrick-<name>` canonical mapped via `themes/components/_aliases.css`
- **What lives here:** Reusable visual controls with shape/state/variants. Could plausibly ship in upstream library.
- **Examples already shipped:** Button, Modal, NumericStepper, CommandPalette, Drawer, ColorPicker (60+ files).

### Home 2 — Buildrik UI extension

- **Path:** `src/shared/ui/<Name>.tsx` (primitives) OR `src/shared/extensions/<Name>.tsx` (compositions on multiple vibcoder primitives)
- **What lives here:** Buildrik-specific UI logic that vibcoder will never absorb. Carries domain dependencies (Sentry, your services, your icon set, panel conventions).
- **Currently shipping:** Badge, ErrorState (Sentry-wired), HelpTooltip, Icons (885 LOC), panel/PanelShell. Compositions: PanelHeader, ConfirmDialog, CopyButton, PremiumBadge, Skeleton, UpgradeModal.

### Home 3 — pure CSS pattern

- **Path:** `src/themes/design-system/a11y.css` (a11y helpers, prefers-* queries, focus rings, sr-only, skip-links) OR `src/themes/components/<tier>/<name>.css`
- **What lives here:** Pure declarative CSS. No JSX. No React component.
- **Currently shipping:** `a11y.css` (170 LOC) holds `.sr-only`, `.skip-link`, `:focus-visible`, all `prefers-*` media queries (Gate 7 enforces a11y.css as only home).

### Admission test

```
For each .buildrick-X ref being removed:

Q1: Reusable visual control with shape/state/variants?
    YES → Home 1 (vibcoder)
    NO  → Q2

Q2: Carries Buildrik-domain logic (Sentry, services, icon set, panel
     layout conventions, business rules)?
    YES → Home 2 (shared/ui/ for primitives, shared/extensions/ for compositions)
    NO  → Q3

Q3: Pure CSS pattern (a11y, utility class, prefers-* query)?
    YES → Home 3 (a11y.css or tier CSS)
    NO  → ESCALATE — boundary case, ask in PR
```

### Forbidden moves

| Move | Why rejected |
|------|--------------|
| New file in `src/components/` | Folder deleted 2026-05-02. |
| New `.buildrick-*` className in editor JSX | Phase 4 baseline gate WARN, ERROR after Phase Final. |
| Component duplicating existing vibcoder primitive in `shared/ui/` | Audit forces deletion. |
| Hex literal in chrome CSS | Gate 24 zero-tolerance (separate arc). |
| New `prefers-*` media query outside `a11y.css` | Gate 7 enforces. |

---

## 3. Phase Plan

### Phase 0 — Audit (1 day, 1 PR)

**Output:** `docs/audits/2026-05-07-vibcoder-finish-audit.md`

**Scope:**
1. Scan `src/editor/**/*.tsx` + `*.ts` for every `.buildrick-*` className occurrence
2. Group by class name → count → list owning panels
3. Group by panel → list distinct classes used
4. Classify each distinct class via three-home admission test → Home 1/2/3
5. For Home 1 hits with no existing vibcoder primitive: list as "missing primitive" with proposed name, tier, props
6. Sort drain order: smallest panel first

**Exit gate:** audit doc committed; counts sum to 1622 ± reconcile note; Codex review signs off; nothing below this line starts until signed.

### Phase 1 — Missing Primitives (~3–5 PRs, ~3 days, parallel)

**Per-primitive PR:**
1. New `editor/shared/vibcoder/<Name>.tsx`
2. New `themes/components/<tier>/<name>.css`
3. New `editor/shared/vibcoder/<Name>.test.tsx`
4. `@import` in `themes/default.css`
5. Optional gallery preview at `src/preview/vibcoder-<name>.html`

**Constraint:** zero consumer migration in these PRs. Drain happens in Phase 2-N.

**Exit gate per PR:** vitest green, Gate 22 (portal discipline) green, Gate 24 unchanged or improved.

**Phase exit:** all audit-listed primitives shipping on `main`. Drain phases unblocked.

### Phase 2-N — Panel Drains (1 panel/PR, ~6–10 PRs, ~1–2 weeks)

**Order (smallest first):**

| Phase | Panel | Approx ref count |
|-------|-------|------------------|
| 2 | `editor/footer/` | low |
| 3 | `editor/rail/` | low |
| 4 | `editor/shell/` (incl. Topbar) | medium |
| 5 | `editor/inspector/` | medium-high |
| 6 | `editor/sidebar/` (each tab as sub-PR if needed) | highest |
| 7 | `editor/canvas/` + remaining domains (`media/`, `animation/`, `onboarding/`, etc.) | tail |

**Per-panel PR shape:**
1. Read audit map for this panel — confirm class list
2. For each class with ≥10 uniform sites: write codemod in `scripts/codemods/vibcoder-finish/<class>.mjs`
3. For each class with <10 sites OR variant shapes OR conditional className: hand-edit
4. Run codemods, manual review diff, fix any AST blind spots manually
5. Update CSS — drain matching `.buildrick-*` selectors from `themes/components.css` if dead after migration
6. Run vitest — green
7. Run baseline gate — confirm count drops by expected delta
8. Delete codemod scripts via `git rm` in same PR (throwaway)
9. Commit: `chore(vibcoder): drain editor/<panel>/ — N → 0 .buildrick-* refs`

**Exit gate per panel PR:**
- `grep -rn "buildrick-" src/editor/<panel>/ --include="*.tsx" --include="*.ts" \| wc -l` returns 0
- vitest green
- baseline gate count decreased by expected amount (no regression elsewhere)
- per-panel lock added: `perPanel.<panel>: 0` in `scripts/baselines/buildrick.json`

**Phase exit:** all panels at 0 refs.

### Phase Final — Lock (1 PR, 1 session)

**Scope:**
1. Drain remaining `.buildrick-*` selectors from `themes/components.css`
2. Confirm `themes/components.css` <50 LOC
3. `git mv themes/components.css themes/legacy-components.css`
4. Update `themes/default.css` `@import` path
5. Flip `scripts/check-buildrick-baseline.mjs` mode `WARN` → `ERROR`, baseline `0`
6. Add CLAUDE.md cleanup-history entry (date + commit SHA)
7. Update memory: `project_vibcoder_finish_arc_<date>.md` + index entry

**Exit gate:**
- Build green
- All 6 done criteria from §1 verified
- CI gate flipped, tested with deliberate `.buildrick-foo` PR (rejected as expected, then revert)
- Memory written

### Dependency graph

```
Phase 0 ──┬─→ Phase 1 (missing primitives, parallel)
          │
          └─→ Phase 2 (footer drain) ──→ Phase 3 (rail) ──→ Phase 4 (shell)
                                                           ──→ Phase 5 (inspector)
                                                           ──→ Phase 6 (sidebar)
                                                           ──→ Phase 7 (canvas + tail)
                                                                  ↓
                                                           Phase Final (lock)
```

Phase 1 must complete BEFORE any Phase 2-N PR depending on a missing primitive. Audit doc maps panel → required primitives so dependencies are explicit.

### PR estimate

Phase 0: 1 PR · Phase 1: 3-5 PRs · Phase 2-N: 6-10 PRs · Phase Final: 1 PR
**= ~11-17 PRs over ~2-3 weeks.**

---

## 4. CI Gate

### Identity

- **Name:** `check-buildrick-baseline`
- **Script:** `scripts/check-buildrick-baseline.mjs`
- **Trigger:** every PR via existing CI pipeline (same hook as `check-hex-baseline.mjs` + ESLint baseline)
- **Baseline file:** `scripts/baselines/buildrick.json`

### Logic

```
1. Read baseline:
   { "count": <N>, "mode": "WARN" | "ERROR", "perPanel": { "footer": 0, ... } }

2. Scan:
   grep -rn -P "\bbuildrick-[a-z][a-z0-9-]*\b" src/editor/ \
     --include="*.tsx" --include="*.ts" | wc -l
   → currentCount

3. Compare:
   IF mode === "ERROR":
     IF currentCount > 0: FAIL "Zero-tolerance violation: N legacy refs found, expected 0"
   ELSE (WARN):
     IF currentCount > baseline.count: FAIL "Baseline regression: was N, now M (+delta)"
     IF currentCount < baseline.count: AUTO-UPDATE baseline file in same PR
     IF currentCount === baseline.count: PASS silently

4. Per-panel sub-checks:
   FOR each panel in baseline.perPanel WHERE count === 0:
     scoped grep src/editor/<panel>/
     IF any hit: FAIL "Panel <panel> drained, no new .buildrick-* allowed"
```

### Lifecycle

| Phase | Mode | Baseline count | perPanel locks |
|-------|------|----------------|----------------|
| Pre-Phase 0 | (gate not deployed yet) | — | — |
| Phase 0 PR | WARN | 1622 (set from audit) | none |
| Phase 1 PRs | WARN | 1622 (no consumer drain) | none |
| Phase 2 done | WARN | ~1500 | `footer: 0` |
| ...as panels close... | WARN | shrinks | adds locks |
| Phase Final | **ERROR** | 0 | all panels: 0 |

### Why baseline auto-decrease

Hex gate today (DS V1 baseline 1498) auto-ratchets when a PR shrinks the count. Forces baseline file to commit alongside drain. No separate "update baseline" PR needed; no risk of drift from reality.

### Why per-panel locks

Single counter alone permits moving refs between panels. Per-panel locks (`perPanel.footer: 0` ⇒ scoped grep on `editor/footer/` must return 0) prevent silent regressions in already-drained panels.

### Out of scope for gate

- CSS selector drift (`.buildrick-X` in `themes/components/<tier>/*.css`) — separate scan, manual cleanup in Phase Final
- `_aliases.css` mappings — gate scans JSX only, not CSS
- Site-builder DS at `editor/design-system/` — out of scope per §1

---

## 5. Codemod Policy

### Decision rule (per legacy class during panel drain)

```
For each .buildrick-X class with N occurrences in the panel being drained:

IF N >= 10 AND occurrences share identical JSX shape:
  → Codemod track

IF N < 10 OR shapes vary OR conditional className OR runtime concat:
  → Manual track

IF cross-prop logic (className from multiple sources, ternary on prop):
  → Manual track regardless of N
```

### Codemod track

- **Tools:** `ts-morph` for full-AST surgery, `jscodeshift` for simpler className → component rewrites. Pick whichever fits the transform.
- **Location:** `scripts/codemods/vibcoder-finish/<class-name>.mjs`
- **PR shape:** write → dry-run → eyeball samples → run → manual diff review → vitest → gate → fix AST blind spots → commit script + migrated consumers + CSS drain in same PR → `git rm` script in same PR

### Manual track

- <10 occurrences (codemod overhead exceeds manual time)
- Variant JSX shapes
- `className={cn('buildrick-btn', condition && 'buildrick-btn-primary')}` conditionals
- Runtime string concat or template literal

### Hygiene rules

| Rule | Reason |
|------|--------|
| Codemod lives in `scripts/codemods/vibcoder-finish/` | Arc-scoped, deletable as a unit |
| Codemod committed in PR that uses it | History preserves intent |
| Codemod DELETED in same PR via `git rm` | No graveyard accumulation |
| Codemod header MUST contain arc name, target class, expected delta | Future archaeologist can grok purpose |
| Never reuse codemod across panels | Copy + tweak instead. Reuse = creeping abstraction. |
| No tests for codemods | Throwaway. Manual diff review IS the test. |

### Header template

```js
/**
 * Vibcoder-finish arc — drain .buildrick-btn from editor/footer/
 *
 * Target: <button className="buildrick-btn"> → <Button>
 * Expected sites: 14
 * Expected baseline delta: -14
 * Throwaway: deleted in the same PR after run.
 */
```

### Estimate

- ~5-10 codemods total across Phases 2-N
- Each amortizes 10-50 site edits
- Combined: ~70-80% of 1622 refs migrate via codemods, ~20-30% manual

---

## 6. Testing

### Test bar by phase

| Phase | What gets tested | Test type |
|-------|------------------|-----------|
| 0 (audit) | Audit doc structure | Manual review only |
| 1 (missing primitives) | Each new vibcoder primitive | New `.test.tsx` pair (vitest + RTL) |
| 2-N (panel drains) | Existing consumer behavior unchanged | Existing tests must remain green |
| Final (lock) | Gate flips correctly, deliberate regression rejected | Manual smoke + 1 throwaway test commit |

### Phase 1 — new primitive tests (mandatory)

Required coverage per new primitive:
- Renders without crash (default props)
- Each variant prop produces expected class
- Each state prop reflected in className (disabled, loading, etc.)
- Keyboard interaction if applicable (Enter / Space / Esc)
- Forwarded ref / forwarded a11y attrs
- For overlay primitives: portal target, focus trap, esc-to-close (Gate 22)

**Reference:** `editor/shared/vibcoder/NumericStepper.test.tsx` (shipped Q2 day 2).

### Phase 2-N — drain PR test policy

**Mandatory:**
- Run full vitest suite — must stay green
- Existing consumer tests stay green
- Visual smoke on dev server

**NOT mandatory:**
- Adding new tests for migrated consumers (anti-pattern — duplicates vibcoder primitive tests)

**Trap to avoid:** Don't write snapshot tests for migrated panels. Snapshots break on every cosmetic class swap, generate noise, drown signal.

### Phase 1 codemod review test (optional, recommended)

If a codemod migrates ≥30 sites, write a one-off test in the SAME PR that:
1. Picks 3 random migrated files
2. Asserts they import expected vibcoder primitive
3. Asserts they no longer reference `.buildrick-X`

Delete this test in the same PR. Diff-shape verifier, not permanent.

### Phase Final — gate flip test

1. Add deliberate `.buildrick-test-class-DO-NOT-MERGE` ref to one editor file in a separate commit
2. Confirm CI fails on that commit
3. Revert the deliberate ref before merge
4. Document in PR description

### Test infrastructure changes

**None.** Vitest, RTL, runner all stay as-is.

---

## 7. Out of Scope + Risks

### Out of scope

| Item | Why excluded |
|------|--------------|
| Site-builder DS at `src/editor/design-system/` | Different domain (user output, not chrome). "Never merge with chrome DS." |
| Site-builder DS V1 hex baseline (1498 sites) | Separate gate, separate arc, runs in parallel |
| ESLint baseline 1033 | Separate gate, runs in parallel |
| Emotion `styled()` chrome usage | Stays unlayered, untouched |
| `themes/components/<tier>/*.css` rewrites | Existing primitive CSS stays |
| Token renames `--buildrick-*` → `--bd-*` | Alias layer absorbs both |
| Vibcoder primitive RE-writes | Q2 day 1-4 already shipped them. Not broken. |
| Test coverage improvements on consumer panels | Adds scope. Different arc. |
| Refactoring of large panel files | Adds risk. Stay surgical. |
| `shared/ui/` audit / consolidation | Already audited 2026-05-02 |
| New CI gate for CSS-side `.buildrick-*` selector drift | Tiny finite set, manual cleanup sufficient |
| Public API at `src/index.ts` changes | Already trimmed canonical-only 2026-05-02 |

### Risks + mitigations

**Risk 1 — Audit undercount.**
Memory: 4 documented inventory undercount lessons in vibcoder Phase 5.
*Mitigation:* Phase 0 grep is regex-based — catches static occurrences. Per-panel gate re-runs grep after each panel drain. Codex review of Phase 0 audit before proceeding.

**Risk 2 — Codemod AST blind spots.**
Codemod may transform some sites and skip others with same className but different JSX shape.
*Mitigation:* Per-panel gate count delta acts as automated check. Codemod header declares "Expected sites: N" — actual < N triggers manual fix.

**Risk 3 — Missing-primitive PR queue blocks drain phases.**
*Mitigation:* Phase 1 PRs ship in parallel. Cluster missing-primitive work into ~3-5 days at start. Audit map enforces dependency order.

**Risk 4 — Canvas overlays + dynamic class injection.**
Memory `project_canvas_render_path.md`: Canvas mounts engine HTML via React's escape hatch. Engine emits raw HTML strings with `.buildrick-*` classes.
*Mitigation:* Phase 0 audit MUST grep `src/engine/**/*.ts` for `.buildrick-` template literals separately. Engine-side refs are out-of-scope (chrome arc). Done criteria #1 explicitly limits scope to `src/editor/`, not `src/engine/`.

**Risk 5 — Visual regression.**
Class-namespace swap shouldn't change pixels (alias layer maps `.bd-*` → `.buildrick-*` tokens). But CSS specificity differences could shift layout.
*Mitigation:* Visual smoke per panel drain PR. Pixel diff = pause, diagnose, fix in same PR. No deferral.

**Risk 6 — Arc abandoned mid-flight.**
*Mitigation:* Q2 daily-ship cadence proven. Each panel close is durable progress. Per-panel locks prevent regression even if arc pauses at panel N of 7.

**Risk 7 — Codex disagrees with audit classification.**
*Mitigation:* Phase 0 audit doc passes Codex review BEFORE Phase 1 begins. Disagreements resolved in writing once, not 10× across PRs.

### Memory + CLAUDE.md updates required (Phase Final)

1. New memory file: `project_vibcoder_finish_arc_<YYYY-MM-DD>.md`
2. New `MEMORY.md` index entry
3. CLAUDE.md "Cleanup history" entry under "## DESIGN SYSTEM — SSOT CONTRACT"
4. CLAUDE.md "Forbidden moves" table: confirm `.buildrick-*` namespace addition row is explicit
