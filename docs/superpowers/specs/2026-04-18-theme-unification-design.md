# Theme Unification — Migration Design

**Date:** 2026-04-18
**Branch:** `main`
**Status:** Spec — awaiting user review
**Driver:** End the recurring CSS churn. 20+ symptom-level fixes in 60 days traced to architectural debt.

---

## 1. Context

The Buildrik editor's theme system is mid-flip between two canonical states, causing every CSS edit to produce regressions. This spec completes the flip.

### Evidence of Architectural Debt

Investigation on 2026-04-18 surfaced four compounding problems:

1. **Dual token system coexistence.** 524 `var(--ls-*)` references and 3939 `var(--aqb-*)` references in `packages/editor/src`. Both prefixes defined in `themes/default.css`. No enforcement of which to use.
2. **Direction flip mid-migration.** `DESIGN.md` (2026-04-18) flipped canonical from dark-chrome to light-chrome. `CLAUDE.md` still says "Editor chrome is dark-only, desktop-only." Two root docs contradict.
3. **Unused scope wrapper.** `themes/default.css` defines 100+ rules under `.aqb-editor` (focus rings, scrollbars, layout, panel). No React component applies `className="aqb-editor"` anywhere in `packages/editor/src`. The rules never fire.
4. **5000-line theme file.** `themes/default.css` is 5000 lines of `:root` + `.aqb-editor` + `.aqb-layout` + `.aqb-sidebar` + per-component rules. Legacy and canonical intermixed.

### Why Every CSS Edit Hurts

A developer reads `CLAUDE.md`, assumes dark theme. Writes `var(--aqb-surface-1)` expecting a dark value. The token was re-aliased during the light flip to resolve to `var(--aqb-bg-card)` = `#FFFFFF`. The component renders white inside a dark panel. Developer patches with a fallback hex. Next component repeats the mistake.

The mismatch is systemic: mental model (dark) and token resolution (light) disagree. Patches treat symptoms, not the dual-system root.

### Success Criterion

End the cycle. One canonical token system (`--aqb-*` per DESIGN.md light-chrome). Zero `--ls-*` references in source. Docs agree. `themes/default.css` shrinks. Every future CSS edit becomes predictable.

---

## 2. Decisions Captured from Brainstorming

| # | Question | Decision |
|---|---|---|
| 1 | Migration phasing | **Phased-by-tab** — each tab migrates in its own commit, verified in browser before next phase |
| 2 | `.aqb-editor` scope wrapper | **Delete** the rules. Wrapper was never applied; rules were dead weight. |
| 3 | Definition of "done" | **Standard**: 0 `--ls-*` refs + delete wrapper rules + delete `--ls-*` definitions + fix `CLAUDE.md` contradiction. Does NOT include deleting legacy `--aqb-surface-1..5` dark tokens or splitting theme file. |

---

## 3. Token Mapping Strategy

Canonical source of truth: `--aqb-*` per `DESIGN.md` 2026-04-18 light-chrome. Every `--ls-*` reference is replaced with its canonical `--aqb-*` equivalent per a mapping table built in Phase 0.

### Expected Mapping (derived, not final)

The final mapping table is produced in Phase 0 by reading `themes/default.css` for each `--ls-*` definition and matching to the nearest canonical `--aqb-*`. Examples based on naming convention:

| Legacy `--ls-*` | Canonical `--aqb-*` |
|---|---|
| `--ls-bg-card` | `--aqb-bg-card` |
| `--ls-bg-panel` | `--aqb-bg-panel` |
| `--ls-bg-subtle` | `--aqb-bg-subtle` |
| `--ls-text-primary` | `--aqb-text-primary` |
| `--ls-text-muted` | `--aqb-text-muted` |
| `--ls-text-lighter` | `--aqb-text-muted` (likely merge) |
| `--ls-text-subtle` | `--aqb-text-secondary` |
| `--ls-accent` | `--aqb-accent` |
| `--ls-accent-bg` | `--aqb-accent-bg` |
| `--ls-border-soft` | `--aqb-border` |
| `--ls-border-light` | `--aqb-border` |
| `--ls-border-card` | `--aqb-border-medium` |

### Handling Mapping Gaps

If a `--ls-*` token has no existing `--aqb-*` equivalent:
1. Verify by reading `DESIGN.md` and `themes/default.css` that no canonical exists under a different name
2. Add the missing canonical token to `DESIGN.md` + `themes/default.css` as part of Phase 0
3. Then map the `--ls-*` to the new canonical

Phase 0 produces the full mapping as a committed table inside this spec's follow-up doc (`DESIGN.md` additions).

---

## 4. Phase Breakdown

9 phases, one commit each. Ordered by risk (low first) and dependency (P0 prerequisite, P8 cleanup last).

### File Scope Per Phase

Based on `grep -rc "var(--ls-"` across source:

| # | Phase | Files (refs count) | Risk | Rationale |
|---|---|---|---|---|
| **P0** | **Mapping + docs** | `DESIGN.md` (add missing tokens if discovered), `CLAUDE.md` (remove "dark-only") | Low | Doc-only. Resolves contradiction. SSOT for mapping. |
| **P1** | **Components tab** | `ComponentsTab.css` (10) | Low | Smallest blast radius. Warm-up. |
| **P2** | **Left sidebar shell** | `LeftSidebar.css` (25) | Low | Shell styles. Visible across tabs but non-functional. |
| **P3** | **PanelHeader shared primitive** | `shared/ui/PanelHeader.tsx` (7) | Medium | Shared across every tab. Migrate now so later phases inherit clean primitive. |
| **P4** | **Build tab** | `BuildTab.css` (64) | Medium | Recently refactored — fresh context. |
| **P5** | **Media cluster (bundled)** | `LibraryManager.css` (127), `MediaTab.css` (71), `ImageEditorModal.css` (45), `LibraryManager.tsx` (13), `MediaQuickActions.tsx` (15) — **271 refs total** | High | Biggest cluster. Bundle because they share patterns. |
| **P6** | **Templates tab** | `TemplatesTab.css` (99) | Medium | Large single file. Recent audit commit context (`131997c`). |
| **P7** | **Remaining scattered + sweep** | Any file with residual `var(--ls-` (grep-based) | Low | Cleanup pass. Catches anything P1-P6 missed. |
| **P8** | **`themes/default.css` purge** | `themes/default.css` | Low | Delete `--ls-*` definitions + `.aqb-editor` scope rules. Only after P7 grep proves zero source refs. |

### Dependencies

```
P0 ──▶ P1 ──▶ P2 ──▶ P3 ──▶ P4 ──▶ P5 ──▶ P6 ──▶ P7 ──▶ P8
(strict prerequisite)     (independent, can reorder P1-P6 if needed)    (strict final)
```

**P0 is strict prerequisite** — the mapping table and any added canonical tokens are needed by P1-P7.

**P8 is strict final** — must only start after P7's grep sweep returns zero `var(--ls-` matches in source.

### Time Estimate (CC-assisted)

| Phase | Effort |
|---|---|
| P0 | 20 min |
| P1 | 10 min |
| P2 | 15 min |
| P3 | 15 min |
| P4 | 20 min |
| P5 | 45 min |
| P6 | 25 min |
| P7 | 15 min |
| P8 | 15 min |
| **Total** | **~3 hours** |

---

## 5. Per-Phase Verification Protocol

Migration runs without Playwright / automated visual regression. All verification is manual browser inspection per phase. Protocol below makes that rigorous.

### 7-Step Workflow (P1-P7)

**Step 1 — Pre-change baseline.** Before editing any files in the phase:
1. Hard-refresh `localhost:5050`
2. Navigate to the tab being migrated
3. Screenshot the tab in default state + one interactive state (e.g., accordion open, item selected)
4. Save to `/tmp/theme-migration/P<N>-<tab>-baseline.png`

**Step 2 — Apply token replacements.** Edit each file per mapping table. Rule: replace only `var(--ls-*)` tokens. Do not touch hex values, calc expressions, or tokens from other prefixes. Surgical only.

**Step 3 — HMR verify.** Vite HMR picks up changes instantly. Don't restart Vite.

**Step 4 — Post-change comparison.**
1. Hard-refresh (`Cmd + Shift + R`)
2. Navigate to same tab, same states as Step 1
3. Screenshot → save as `P<N>-<tab>-after.png`
4. Side-by-side compare. Expected: pixel-near-identical (both tokens aliased to same canonical light value).

**Step 5 — On mismatch.** Stop. Don't commit. Inspect via DevTools which element changed, which CSS rule. Re-check mapping table entry. Fix mapping + retry Step 4.

**Step 6 — Type check + tests.**
```bash
cd packages/editor && npx tsc --noEmit 2>&1 | grep -i "theme\|ls-" | head -5   # expected: empty
npx vitest run src/editor/sidebar/tabs/<tab>/                                   # expected: pass
```

**Step 7 — Commit.**
```bash
git add <phase's files>
git commit -m "fix(theme): migrate <tab> to canonical --aqb-* tokens (P<N>)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

### Screenshot Storage

Scratch screenshots at `/tmp/theme-migration/` — not committed. Deleted after P8.

### Hard Gates

| Gate | Trigger | Action |
|---|---|---|
| Visual mismatch | Post-change screenshot differs unexpectedly | STOP phase, investigate mapping |
| Type check fails | `tsc --noEmit` errors in phase files | STOP phase, fix types |
| Tests break | `vitest` regression in phase's tests | STOP phase, investigate |
| Manual "looks wrong" | Any browser inspection reveals regression | STOP phase, investigate |

No gate accepts "acceptable loss." If any triggers, the phase does not commit until resolved. This is the discipline that ends the CSS churn.

### P8 Extra Verification

Before deleting `--ls-*` definitions from `themes/default.css`:
1. `git grep "var(--ls-" -- packages/editor/src/` must return empty. If not, those files missed their phase — add to P7 sweep, do not proceed.
2. Delete `--ls-*` definitions.
3. Delete `.aqb-editor` scope rules.
4. Hard-refresh each tab once (~3 min), visually verify no dead styles.
5. Type check + tests + commit.

---

## 6. Risk Register + Rollback

### Risk Register (ordered by likelihood × impact)

| # | Risk | Likelihood | Impact | Detection | Response |
|---|---|---|---|---|---|
| **R1** | Wrong token mapping (e.g., `--ls-text-lighter` → wrong canonical) | Medium | Medium | Post-phase screenshot diff (Step 4) | Revert phase, fix mapping entry, redo phase |
| **R2** | `--ls-*` has no clean canonical equivalent | Medium | Low | P0 mapping table build | Add missing canonical to `DESIGN.md` + `themes/default.css` during P0 |
| **R3** | Regression only visible in specific state (hover, disabled, dragging) | Medium | Medium | User browser testing post-migration | Add state to Step 1/4 screenshot protocol. Backfill earlier phases if caught late. |
| **R4** | Phase breaks unrelated tab (cross-tab shared class leakage) | Low | High | Full 7-tab sweep after P7 | Bisect with git. Fix the shared class. |
| **R5** | `--aqb-*` canonical token itself is wrong | Low | High | Visual regression across all tabs simultaneously | Standalone fix commit outside phase workflow |
| **R6** | HMR doesn't pick up CSS change, browser serves stale | Low | Low | Visual diff appears wrong despite correct code | Hard-refresh + DevTools disable-cache (standard in protocol) |
| **R7** | `git revert` on phase N leaves callsite pointing at definition deleted in P8 | Low | Medium | Build failure | Revert P8 first, then phase N |
| **R8** | Stray `--ls-*` in a file I missed counting | Medium | Low | P7 grep sweep | P7 exists for this |
| **R9** | Mid-migration, a new commit (another developer / other task) adds fresh `--ls-*` | Low | Low | Final P8 grep catches | Add to P7 sweep; don't start P8 until grep = 0 |

### Rollback Strategy

**Single-phase rollback** (most common):
```bash
git revert <phase-N-sha>
# Reverts one commit. That tab returns to pre-migration state.
# Other phases remain migrated. Files don't overlap → no cascade.
```

**Multi-phase rollback** (rare, architectural failure):
```bash
git revert <P8-sha>..<P0-sha> --no-commit
git commit -m "revert: abandon theme migration — root cause: <issue>"
```

**Fix-forward** (when you discover a mistake post-commit):
```bash
git commit -m "fix(theme): correct mapping in <tab> (follow-up to P<N>)"
# Preferred over --amend once commits are pushed
```

### Dry-Run Rollback Test

Before P1, verify the workflow end-to-end:
1. Make a trivial test commit touching a theme token in an unused file
2. Verify in browser — looks identical
3. `git revert HEAD` — tab returns to pre-change state
4. `git revert HEAD` again — re-applies the change
5. Final state matches forward-migration state

5 minutes. Confirms revert works in this repo with Vite HMR before relying on it.

### Blast Radius Summary

| Scenario | Affected | Recovery |
|---|---|---|
| Phase N breaks its own tab | 1 tab, 1 commit | ~10 min |
| Phase N breaks OTHER tab (R4) | 2 tabs, investigation | ~30 min |
| P8 delete breaks everything | All tabs | ~15 min (revert P8) |
| Canonical token itself wrong (R5) | All tabs | ~10 min (standalone fix) |

Worst realistic case: ~30 min recovery. Every phase reversible.

### Git Hygiene

- One commit per phase. No "WIP" / "squash later."
- Message format: `fix(theme): migrate <tab> to canonical --aqb-* tokens (P<N>)` for grepability.
- `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer on every commit.
- No `git add -A`. Add specific files per phase. Prevents sweeping stray changes.

---

## 7. Acceptance Criteria

### Programmatic Gate

Migration is "done" when all 7 checks return clean:

```bash
# 1. Zero --ls-* source references
cd /Users/shahg/Desktop/pencil/buildrik
git grep -l "var(--ls-" -- packages/editor/src/
# Expected: empty

git grep -c "var(--ls-" -- packages/editor/src/ | grep -v ":0$"
# Expected: empty

# 2. Zero --ls-* definitions in themes/default.css
grep -c "^\s*--ls-" packages/editor/src/themes/default.css
# Expected: 0

# 3. Zero .aqb-editor scope rules
grep -cE "^\.aqb-editor" packages/editor/src/themes/default.css
# Expected: 0

# 4. CLAUDE.md "dark-only" removed
grep -i "dark.only" /Users/shahg/Desktop/pencil/buildrik/CLAUDE.md
# Expected: empty

# 5. TypeScript clean
cd packages/editor && npx tsc --noEmit 2>&1 | grep -iE "theme|ls-" | head -5
# Expected: empty

# 6. Full test suite passes
npx vitest run 2>&1 | grep -E "Test Files|Tests" | tail -3
# Expected: all passed

# 7. themes/default.css shrunk
wc -l packages/editor/src/themes/default.css
# Expected: < 3500 lines (was ~5000)
```

### Visual Gate

After P8, walk through every tab at `localhost:5050`:

| Tab | States |
|---|---|
| Build | Elements idle, Elements search, Sections idle, Sections search, accordion open, tips-collapsed |
| Pages | List default, settings drawer open, search, bulk-select toolbar |
| Templates | Grid, detail modal, apply progress |
| Media | Library, upload, image editor |
| Layers | Collapsed, expanded, element selected |
| Inspector | All sections rendered, token picker, dev mode toggle |
| History | Activity view, version panel, time-travel |

Each state should look **identical** to pre-migration. Spot-check 2-3 states per tab. ~10 min total.

---

## 8. Documentation Updates

### P0 — `DESIGN.md`
- Add the full mapping table under a new "## Legacy Token Migration (2026-04-18)" section
- Kept as reference after migration so future devs understand what was removed
- Verify canonical token list is complete — add any tokens discovered during mapping

### P0 — `CLAUDE.md`
Locate: `- Editor chrome is dark-only, desktop-only.`

Replace with:
```
- Editor chrome uses the canonical light theme per DESIGN.md (see Color section).
  Desktop-only. The previous "dark-only" direction was flipped 2026-04-18;
  see DESIGN.md changelog for rationale.
```

### P8 — `CHANGELOG.md`
Append:
```
### Changed
- Theme system: completed 2026-04-18 light-flip migration. All --ls-* legacy
  tokens replaced with canonical --aqb-* per DESIGN.md. Deleted never-applied
  .aqb-editor scope rules. themes/default.css shrunk from ~5000 to ~3500 lines.
  No visual changes intended — migration is value-neutral since --ls-* was
  already aliased to correct values.
```

---

## 9. NOT in Scope

Explicit exclusions to prevent scope creep:

- ❌ Any engine/composer code
- ❌ Canvas rendering styles (canvas is user content, separate concern)
- ❌ Dashboard (Next.js) package styles
- ❌ Adding Playwright or visual regression infrastructure
- ❌ Restructuring `themes/default.css` into multiple files (future)
- ❌ Deleting legacy `--aqb-surface-1..5` dark tokens (future — DESIGN.md Deep scope)
- ❌ Inspector token registry changes
- ❌ Component restructuring or JSX changes (token swaps only; exception: `PanelHeader.tsx` in P3 because it carries `--ls-*` in styles)
- ❌ Touching `.env`, build config, `package.json`
- ❌ Refactoring hooks, contexts, state management

Every commit in this migration is **purely token-replacement, doc-update, or definition-deletion**. If a commit wants to touch anything else, it is out of scope.

---

## 10. Post-Migration State (6-month outlook)

**What's different:**
- New components always use `--aqb-*`. No choice paralysis.
- CSS edits predictable: token = canonical light value, no surprise re-routing.
- `themes/default.css` shrunk from ~5000 to ~3500 lines. Easier to hold in head.
- No scope wrapper ghosts.
- `CLAUDE.md` and `DESIGN.md` agree.
- Future CSS debugging starts with known-good state.

**What remains for future phases (out of this spec):**
- Delete legacy `--aqb-surface-1..5` dark tokens (DESIGN.md Deep goal)
- Split `themes/default.css` into layered files (base / reset / chrome / canvas)
- Add Playwright visual regression tests as a safety net for future migrations
- Audit Inspector token picker for consistency
- Dashboard package theme alignment (separate concern)

---

## 11. References

- Investigation report: this spec (section 1 captures the findings)
- Build Tab v4 prior work: `2026-04-18-build-tab-v4-implementation-design-v2.md`
- Design system canonical: `DESIGN.md` (2026-04-18 changelog entry)
- Project conventions: `CLAUDE.md`, `packages/editor/CLAUDE.md`
- Legacy decisions being overturned: `CLAUDE.md` "Editor chrome is dark-only"
- Token registry: `packages/editor/src/themes/default.css`
- Investigation learning: `theme-dual-token-mid-flip` (logged 2026-04-18)
