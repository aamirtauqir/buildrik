# Editor Cleanup — Remaining Phases

**Predecessor:** `EDITOR_AUDIT_PLAN.md` (22-issue audit, 2026-05-06)
**Status:** Active execution plan
**Owner:** solo / direct-to-main
**Updated:** 2026-05-07

This plan sequences the remaining audit issues into 4 phases by risk and dependency. Phase A executes first (quick wins, no risk). Phase D is gated on test infrastructure that doesn't exist yet.

---

## Closed already (8 of 22)

| ID | Closed in | Commit |
|---|---|---|
| E-001 Publish fake | Phase 0 + Phase 1 | `a7a5dbe9` + `9712be22` + `ca385773` + `36235dd0` |
| E-002 Cmd Palette duplicate | Phase 0 | `a7a5dbe9` |
| E-003 AccountModal mock | Phase 0 | `a7a5dbe9` |
| E-004 BREAKPOINT_CHANGED dual emit | Standalone | `71a2ea0c` |
| E-005 Event names | 6 batches | `05e3537e` → `82227d21` |
| E-011 Custom-width fake | Phase 0 | `a7a5dbe9` |
| E-013 InviteModal hardcoded URL | Phase 0 | `a7a5dbe9` |
| E-016 Composer getters | retired | (audit error: getter conversion unsafe) |

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

### B4. E-015 — Unify TabRouter + FullPageRouter
- **Scope:** Replace `editor/sidebar/TabRouter.tsx` + `FullPageRouter.tsx` with single `editor/sidebar/RouteResolver.tsx` returning `{ component, layoutMode }`. Caller picks layout based on result.
- **Risk:** Medium (touches sidebar routing, all 11 tabs).
- **Validation:** manual smoke — every tab opens, layout mode correct.
- **Effort:** 2-3 hours.

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

### D2. E-006 — Split `AquibraStudio.tsx` (609 lines)
- **Scope:** Extract:
  - `useEditorShortcuts()` — keyboard handlers
  - `useSaveCallback()` — save flow + autosave
  - `useEditorModals()` — modal state aggregator
  - Keep `AquibraStudio` as slim provider tree + `LayoutShell` host
- **Risk:** High — central orchestrator.
- **Effort:** 4-6 hours.

### D3. E-014 — Composer manager grouping
- **Scope:** Group 30 managers in `Composer` constructor under domain facades:
  - `composer.media.{manager, commandLayer, optimizer, storage}`
  - `composer.data.{manager, bindings: {style, trait, text}}`
  - `composer.collab.{manager, sync, ot}`
- **Risk:** High — every call site changes (`composer.mediaManager` → `composer.media.manager`).
- **Pre-req:** All Phase D depends on this; codemod required.
- **Effort:** 8-12 hours including codemod + verification.

**Phase D total: ~16-24 hours, 3+ commits.**

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

- Phase A start: 2026-05-07
- … (filled per commit)
