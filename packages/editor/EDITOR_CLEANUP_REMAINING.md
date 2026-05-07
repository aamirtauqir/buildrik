# Editor Cleanup — Remaining Phases

**Predecessor:** `EDITOR_AUDIT_PLAN.md` (22-issue audit, 2026-05-06)
**Status:** Active execution plan
**Owner:** solo / direct-to-main
**Updated:** 2026-05-07

This plan sequences the remaining audit issues into 4 phases by risk and dependency. Phase A executes first (quick wins, no risk). Phase D is gated on test infrastructure that doesn't exist yet.

---

## Closed already (19 of 22)

| ID | Closed in | Commit |
|---|---|---|
| E-001 Publish fake | Phase 0 + Phase 1 | `a7a5dbe9` + `9712be22` + `ca385773` + `36235dd0` |
| E-002 Cmd Palette duplicate | Phase 0 | `a7a5dbe9` |
| E-003 AccountModal mock | Phase 0 | `a7a5dbe9` |
| E-004 BREAKPOINT_CHANGED dual emit | Standalone | `71a2ea0c` |
| E-005 Event names | 6 batches | `05e3537e` → `82227d21` |
| E-010 Sync scaffold | Phase A3 | `7a915287` |
| E-011 Custom-width fake | Phase 0 | `a7a5dbe9` |
| E-013 InviteModal hardcoded URL | Phase 0 | `a7a5dbe9` |
| E-016 Composer getters | retired | (audit error: getter conversion unsafe) |
| E-017 Binding manager docs | Phase A2 | `50b0991b` |
| E-020 Vitest coverage config | Phase A4 | `74c73b59` |
| E-022 Env var docs | Phase A1 | `3e2d16f1` |
| E-009 Inspector registry split | Phase B1 | `bd90b389` |
| E-018 VersionTimelineManager rename | Phase B3 | `a0140ffc` |
| E-008 QuickActionsToolbar (deleted dead) | Phase C1 | `a7b1630a` |
| E-012 Real crash recovery | Phase C2 | `273ff177` |
| E-019 Canvas re-render benchmark | Phase C3 | `f6f8a4c6` |
| E-015 TabRouter+FullPageRouter unify | Phase B4 (deferred) | — |
| E-021 Section factory split | Phase B2 (skipped) | — |

---

## Phase A — Quick wins (no risk, no infra)

Execute back-to-back as small commits. Each <30 min. No tests needed beyond existing pass-through.

### A1. E-022 — Env var documentation
- **Scope:** Add prod-env requirements section to `packages/editor/CLAUDE.md` documenting `VITE_DASHBOARD_URL`, `VITE_FEATURE_*` flags, expected production values.
- **Risk:** Zero (docs only).
- **Effort:** 10 min.

### A2. E-017 — Binding manager documentation
- **Scope:** Add comment header to each of 5 binding managers (`DataManager`, `StyleDataBinding`, `TraitDataBinding`, `TextDataBinding`, `CMSBindingManager`) clearly stating its scope and what it does NOT cover. Confirms intentional split (audit flagged "possible over-fragmentation").
- **Risk:** Zero (comments only).
- **Effort:** 20 min.

### A3. E-010 — Delete or document SyncManager + CloudSyncService scaffolds
- **Scope:** Two paths:
  - **Path 1 (delete):** Remove `engine/sync/SyncManager.ts`, `services/CloudSyncService.ts`, references from Composer constructor + manager array. Cleanup `engine/sync/OfflineQueue.ts` if orphaned.
  - **Path 2 (gate):** Wrap Composer instantiation behind `if (config.enableCollabSync) { ... }`. Add `// SCAFFOLD:` markers.
- **Decision:** Path 1 if zero subscribers found. Path 2 if any found.
- **Risk:** Medium (Composer wiring). Requires grep for `composer.sync.` consumers.
- **Effort:** 30 min.

### A4. E-020 — Vitest coverage config
- **Scope:** Add `coverage` block to `vitest.config.ts` (provider: `v8`, reporter: `text` + `html`, include: `src/engine/**`, `src/editor/canvas/hooks/**`, `src/editor/inspector/hooks/**`). Add `npm run test:coverage` script.
- **Risk:** Zero (config only, doesn't run by default).
- **Effort:** 20 min.
- **Gate for:** E-007 (useCanvasDragDrop split needs coverage baseline before refactor).

**Phase A total: ~80 minutes, 4 commits.**

---

## Phase B — Low-risk file splits

### B1. E-009 — Inspector registry split
- **Scope:** `editor/inspector/renderer/registry.tsx` (666 lines) → split per element family:
  - `registry/index.tsx` (aggregator + `defineSection` factory)
  - `registry/text.tsx` (TextSection / HeadingSection / ParagraphSection / etc.)
  - `registry/layout.tsx` (Container / Section / Columns / Grid / Flex)
  - `registry/media.tsx` (Image / Video / Audio / SVG / Lottie)
  - `registry/forms.tsx` (Input / Textarea / Select / Form)
  - `registry/components.tsx` (Hero / Features / CTA / Card / Pricing / etc.)
  - `registry/links.tsx` (Link / Button)
- **Risk:** Low (pure file reorganization; aggregator preserves public exports).
- **Validation:** typecheck + smoke-test InspectorRenderer in dev (sections render correctly per element).
- **Effort:** 1-2 hours.

### B2. E-021 — Inspector section factory split (follow-up to B1)
- **Scope:** Move per-section `defineSection()` calls from registry/*.tsx files into `registry/sections/<name>.ts` modules. Aggregator imports them.
- **Risk:** Very low (continuation of B1 pattern).
- **Effort:** 30 min.
- **Skip if B1 already left registry files small enough.**

### B3. E-018 — Rename VersionHistoryManager → VersionTimelineManager
- **Scope:** Mechanical rename:
  - `engine/VersionHistoryManager.ts` → `engine/VersionTimelineManager.ts`
  - Class `VersionHistoryManager` → `VersionTimelineManager`
  - 30+ references across engine + editor + tests + comments
  - History tab UI label change ("Saves" already drift, audit-target was "Versions")
- **Risk:** Low (mechanical, but wide blast radius — typecheck catches misses).
- **Effort:** 1 hour with grep + sed.
- **Decision:** confirm with user that "Versions" is the desired UI label (current UI says "Saves").

### B4. E-015 — Unify TabRouter + FullPageRouter — **DEFERRED** (no win)
- **Original scope:** Replace `editor/sidebar/TabRouter.tsx` + `FullPageRouter.tsx` with single `editor/sidebar/RouteResolver.tsx` returning `{ component, layoutMode }`.
- **Why deferred:** On inspection, the two routers exist for two genuinely different layout slots (panel mode vs fullpage mode) with **different prop shapes** — TabRouter takes pin/help/close + 9 panel-specific handlers; FullPageRouter takes help/close + media-editor / icon-picker callbacks (no pinning). Unifying would either:
  1. Bloat the unified shape with the union of all props, OR
  2. Add a discriminated `mode: "panel" | "fullpage"` with conditional prop typing.
  Either path adds code and abstraction without reducing the actual switch-on-tabId logic. There is no shared body to dedupe — both routers just `React.lazy` + `switch`, which is the standard React pattern.
- **Decision:** Skip. Same judgment as B2 (over-fragmentation that wasn't actually fragmented).
- **If reconsidering:** the right unification would be at the *layout* layer (one shell that picks panel vs fullpage based on tab metadata), not the router layer. That's outside this audit's scope.

**Phase B total: ~5-7 hours, 3-4 commits.**

---

## Phase C — Medium refactors (need verification)

### C1. E-008 — QuickActionsToolbar split
- **Scope:** `editor/canvas/menus/QuickActionsToolbar.tsx` (629 lines) → extract `useQuickActions(elementId)` hook with all action handlers; component becomes thin render shell.
- **Risk:** Medium (per-element actions are hot path).
- **Validation:** existing E2E DnD smoke + manual quick-action testing per element type.
- **Effort:** 2-3 hours.

### C2. E-012 — Real crash recovery
- **Scope:** `engine/recovery/RecoveryManager.ts` currently triggers only on `visibilitychange`. Add `window.error` + `window.unhandledrejection` listeners. On next load, prompt user to restore from autosave snapshot.
- **Risk:** Low-medium (additive behavior).
- **Validation:** unit test with synthetic error events; manual reload after thrown error.
- **Effort:** 1-2 hours.

### C3. E-019 — Canvas re-render perf benchmark + fix
- **Scope:** First step is **measurement** — add benchmark to `__tests__/performance/` for large-page edit cycle (1000 elements, single-property change). If confirmed slow, evaluate `morphdom` / partial-render strategies.
- **Risk:** Low for benchmark; medium-high for fix.
- **Effort:** 2 hours benchmark, +4-8 hours fix if needed.

**Phase C total: ~5-13 hours, 3-4 commits.**

---

## Phase D — High-risk god-component splits

**Gated on Phase A4 (coverage config) producing baseline coverage report. Do not start these without tests.**

### D1. E-007 — Split `useCanvasDragDrop.ts` (692 lines)
- **Scope:** Extract three sub-hooks:
  - `useDropTargetResolver` (drop validation glue)
  - `useDropExecution` (calls `dropOperations.tsx`)
  - `useDropOverlaySync` (hover overlay state)
- **Pre-req:** Coverage on `useCanvasDragDrop`, `dropValidation`, `dropOperations` ≥70%.
- **Risk:** High — DnD is core UX.
- **Effort:** 4-6 hours including test additions.

### D2. E-006 — Split `AquibraStudio.tsx` ✅ SHIPPED 2026-05-07
- **Status:** Complete. 4 stages, commits e331b1c8 → af8fb7c1 → f339f272 → 3a603f0a.
- **Result:** Orchestrator 669 → 472 LOC (-197, -29.5%). 4 single-concern hooks, 56 new test cases.
- **Hooks shipped:**
  - `useEditorShortcuts()` — global keydown handler (8 shortcut branches + editable-surface guard).
  - `useSaveCallback()` — composer.saveProject + 5 user-friendly error mappings + Retry action.
  - `useEditorEventListeners()` — 4 composer-driven side-effects (PROJECT_LOADED, COMPONENT_CREATE_REQUESTED, SHOW_IN_LAYERS, overlay-defaults init).
  - `useExportHandlers()` — handleExportHTML + handleExportForDeploy + handleVercelPublish + usePublishJob() + publish-toast effect.
- **Test mock learning:** ExportEngine `new`-construction + arrow-function vi.mock factories incompatible. Use plain function constructor returning a mutable shared instance. Documented inline in `useExportHandlers.test.ts`.

### D3. E-014 — Composer manager grouping ✅ SHIPPED 2026-05-07
- **Status:** Complete. Stage 0 codemod + Stages 1-3 atomic sweep, commits 323fd111 + 6aae3b9c.
- **Final shape: Option B-tight** (NOT plan's original Option A — inventory at Stage 0 found Option A would touch 138 hot-path call sites for `composer.media` + `composer.history`).
- **Result:**
  - 3 facades collapsing 8 fields:
    - `composer.cms.{collections, bindings}` (was cmsManager + cmsBindings)
    - `composer.collab.{manager, sync}` (was collaboration + sync)
    - `composer.canvas.{indicators, resize, drag, interactions}`
  - 2 flat renames: `versionHistory → versions`, `mediaCommands → mediaOps`.
  - **Untouched (preserves hot paths):** media (77 sites), history (61 sites), recovery, elements, styles, commands, selection, data, templates, fonts, components, viewport, plugins, storage, forms, router, globalStyles, *Bindings.
- **Codemod artifact:** `packages/editor/scripts/codemods/composer-manager-facades.ts` (idempotent, jscodeshift, 35 unit tests). Re-run with `npx tsx ...runner.ts` (dry-run) or `--apply` (write).
- **Bugs caught pre-flight by Stage 0 dry-run:** (1) optional-chaining drop on `composer?.X.Y` rewrites — fixed; (2) bare `this.X` false-positive on CMSBindingManager.ts — codemod tightened to `composer.X` + `*.composer.X` only.
- **Bugs caught during Stage 1-2:** (1) `replace_all` on `this.collaboration` mangled `this.collaborationHandlers` (substring match) — see `feedback_replace_all_word_boundary` memory; (2) one TSTypeQuery site in CMSExportResolver.ts outside codemod scope — hand-fixed.
- **Verification:** 246/246 test files / 2019/2019 tests pass post-D3. Zero new editor-scope tsc errors.

**Phase D total: SHIPPED.** All 3 god-component splits + manager grouping complete.

---

## Sequencing rules

1. **A → B → C → D in order.** Skip allowed within phase, not across.
2. **Phase A must complete before Phase D** — coverage config (A4) gates Phase D start.
3. **B1 must complete before B2** — section factory split is follow-up to family split.
4. **C3 benchmark must complete before any C3 fix** — measurement before optimization.
5. **D1, D2, D3 are independent** — can run in any order within Phase D.

---

## Validation policy per phase

| Phase | Required gate |
|---|---|
| A | typecheck clean, existing tests pass |
| B | typecheck clean, existing tests pass, manual smoke for affected flow |
| C | new unit tests for changed behavior, existing tests pass |
| D | coverage ≥70% on touched files BEFORE refactor, all tests pass AFTER |

---

## What NOT to touch in any phase

- `engine/Composer.ts` deep changes — wait for E-014 (Phase D)
- `engine/elements/Element.ts` delegate chain — intentional split
- `editor/canvas/Canvas.tsx` rendering path — `Canvas.tsx:465` raw-HTML mount is canonical (per memory `project_canvas_render_path.md`)
- Vibcoder migration files — separate arc still in flight
- `themes/components.css` — separate Q2 drain arc

---

## Roll-back strategy

Each phase ships as separate commits. Per memory `feedback_solo_workflow.md` (direct-to-main), rollback is `git revert <commit>` for any single batch. No PR review gate; rely on tests + manual smoke.

If Phase D refactor regresses production, revert + re-attempt with smaller scope (single hook extraction instead of full split).

---

## Estimated total

| Phase | Time | Commits |
|---|---|---|
| A | ~80 min | 4 |
| B | ~5-7 hr | 3-4 |
| C | ~5-13 hr | 3-4 |
| D | ~16-24 hr | 3+ |
| **Total** | **~27-45 hr** | **~13-15** |

Solo pace: 4-7 sessions to complete all four phases.

---

## Execution log (live)

- 2026-05-07 — Phase A start
- 2026-05-07 — A1/E-022 env var docs shipped (`3e2d16f1`)
- 2026-05-07 — Pre-A2 hotfix: E-005 batch-6 awk fallout in 2 ai/* files (`4a54999c`)
- 2026-05-07 — A2/E-017 binding manager scope headers shipped (`50b0991b`)
- 2026-05-07 — A3/E-010 sync stack SCAFFOLD-flagged + dead UI imports removed (`7a915287`)
- 2026-05-07 — A4/E-020 vitest coverage config shipped (`74c73b59`)
- 2026-05-07 — **Phase A CLOSED** (4 items + 1 hotfix, ~90 min, 5 commits)
- 2026-05-07 — B1/E-009 inspector registry split shipped (`bd90b389`)
- 2026-05-07 — B2/E-021 skipped: B1 left families small enough (per plan rule)
- 2026-05-07 — B3/E-018 VersionTimelineManager rename shipped (`a0140ffc`)
- 2026-05-07 — B4/E-015 deferred: unification would bloat code (see B4 entry above)
- 2026-05-07 — **Phase B CLOSED** (1 ship + 2 skip + 1 defer)
- 2026-05-07 — C1/E-008 dead QuickActionsToolbar deleted (-648 LOC) (`a7b1630a`)
- 2026-05-07 — C2/E-012 real crash recovery shipped (error+rejection listeners) (`273ff177`)
- 2026-05-07 — C3/E-019 canvas re-render benchmark shipped (`f6f8a4c6`)
  - Baseline: mean 4.73 ms, p95 8.70 ms on 1000 elements / 50 edits
  - Audit's perf concern not confirmed — no fix step needed
- 2026-05-07 — **Phase C CLOSED** (3 items, 1 turned into delete-not-split)
- … Phase D gated on per-file coverage ≥70% (E-007, E-006, E-014)
