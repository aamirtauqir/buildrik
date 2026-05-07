# Audit Remediation — Approach B (fold into existing arcs)

**Date:** 2026-05-07
**Source audit:** [`docs/audits/2026-05-07-codebase-audit.md`](../audits/2026-05-07-codebase-audit.md)
**Mode:** SELECTIVE EXPANSION (PR1 holds bug-fix scope; D3-D6 cherry-picked from audit findings; deferrals tracked)
**Decision:** Approach B selected — bugs ship as 1 PR, structural debt rides existing D-series + vibcoder-finish + boundary-lint rails. No new mega-arc spawned.

---

## Why Approach B

Memory pattern (5 architecture cleanups this quarter) says:
- Surgical arcs with concrete inventories ship — see `vibcoder-finish` (7 drain PRs against real 202 scope after Phase 0 audit caught broad-match overcount of 1622).
- Mega-arcs based on generic principles die at Codex review — see V1/V2 theme specs killed, editor-v2 paused.
- "Inventory before architecture" is the binding rule, and the audit doc IS the inventory. Approach B treats it as such.

D2 just closed (commit `3a603f0a` extracts `useExportHandlers` from AquibraStudio). Approach B = next D-stages on the same rail.

---

## PR1 — Bug Fixes (ship now, ~20min CC)

> **Eng-review correction (2026-05-07):** ProInspector:255 was originally listed as a bug. Eng review confirmed it is **NOT a bug** — variable `breakpointHasOverride` correctly returns `false` on desktop because desktop is the BASE breakpoint. Override detection is intentional non-desktop semantics (matched in `editor/inspector/config/cssContext.ts:61`). Removed from PR1.

Two real bugs from the audit. Independent; ship together for review atomicity.

### ~~1.1 ProInspector responsive override inert on default breakpoint~~ — REMOVED, NOT A BUG

### 1.2 engine/media → editor/sidebar boundary violation

**File:** `packages/editor/src/engine/media/MediaManager.ts:33`
**Bug:** Imports `StockService` from `editor/sidebar/tabs/media/api/StockService`. Forbidden direction: `engine/ → editor/`.
**Fix options:**
- (A) Move `StockService` to `services/stock/StockService.ts`. Both `engine/media` and `editor/sidebar/media` consume from `services/`.
- (B) Move to `shared/services/stock.ts`.
**Recommend A** — services/ is the established home for third-party API integrations (per CLAUDE.md).
**Test:** ESLint boundary rule (PR2) catches regression.

### 1.3 ModalSubmit type — silent error swallow

**Pattern:** Modal `onClose` callbacks return `void` but submit handlers (`onConfirm`, `onSave`, `onResolve`) are `async`. Errors are unhandled.
**Files affected:**
- `editor/shell/StudioModals.tsx` (collectionSetup, imageEditor)
- `editor/sync/ConflictModal.tsx:29, 64, 83`
- `editor/ecommerce/CollectionSetupModal.tsx:40-48`

**Fix:** Define in `shared/types/modals.ts` (eng-review-corrected — generic over args):

```ts
export type ModalSubmit<TArgs extends readonly unknown[] = [], TResult = void> =
  (...args: TArgs) => Promise<TResult>;

export interface AsyncModalProps<TArgs extends readonly unknown[] = [], TResult = void> {
  onClose: () => void;
  onSubmit: ModalSubmit<TArgs, TResult>;
  // toast adapter so modals don't import notification engine directly
  // CRITICAL: when omitted, default to Toast emit — never silently swallow
  onError?: (err: unknown) => void;
}
```

Concrete usage:
- `CollectionSetupModal` → `AsyncModalProps<[CollectionConfig], void>`
- `ConflictModal` → `AsyncModalProps<[ConflictResolution], void>`
- `ImageEditorModal` → `AsyncModalProps<[Asset], void>`

Codemod 3 modal call sites: wrap `onSubmit` call in `try/catch`. If `onError` provided, call it; else emit Toast via `Toast.emit()` directly. **No silent swallow path.**

**Acceptance criteria PR1:**
- `engine/media/MediaManager.ts:33` no longer imports from `editor/sidebar/`.
- `eslint-plugin-import/no-restricted-paths` rule (added in PR2) passes on engine/.
- 3 modals surface async errors via `onError` or Toast fallback — never silent.
- Unit tests: each modal site, sync throw + async throw, error reaches user.

---

## PR2 — ESLint Boundary Rule (~1hr)

Adds rule to prevent boundary regression. Closes audit's 11 boundary findings.

> **Eng-review correction:** Use `@typescript-eslint/no-restricted-imports` (with `allowTypeImports: true`), not `eslint-plugin-import/no-restricted-paths`. Latter doesn't distinguish `import type` from value imports — would false-positive on type-only imports the audit explicitly accepts (e.g., `HandlePosition`).

**Authoritative config file:** `packages/editor/eslint.config.mjs` (flat config, ESLint 9 standard). Legacy `.eslintrc.json` is shadowed but should be removed in same PR to avoid drift.

```js
// eslint.config.mjs (excerpt — flat config syntax)
import tseslint from "@typescript-eslint/eslint-plugin";

export default [
  // ... existing config ...
  {
    files: ["packages/editor/src/engine/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/editor/**", "@/editor/**"],
          message: "engine/ may not import from editor/",
          allowTypeImports: true,
        }],
      }],
    },
  },
  {
    files: ["packages/editor/src/shared/**/*.{ts,tsx}"],
    ignores: ["packages/editor/src/shared/extensions/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/editor/**", "@/editor/**"],
          message: "shared/ may not import from editor/ (use shared/extensions/)",
          allowTypeImports: true,
        }],
      }],
    },
  },
  {
    files: ["packages/editor/src/services/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/editor/**", "@/editor/**"],
          message: "services/ may not import from editor/",
          allowTypeImports: true,
        }],
      }],
    },
  },
];
```

**AlignmentHandler decision:** Surface as `composer.alignment.*` method (Approach A from audit). PR2 lint will fail on `editor/canvas/toolbars/AlignmentToolbar.tsx:10` — fix by adding `composer.alignment` facade and dropping the direct engine import. Type-only `HandlePosition` imports remain allowed via `allowTypeImports: true`.

**Self-tests required:** Add to `packages/editor/eslint-rules/__tests__/` (precedent: 5 custom rules already have tests there). Verify:
- engine/ → editor/ value import → error
- engine/ → editor/ `import type` → allowed
- shared/extensions/ → editor/shared/vibcoder → allowed (whitelist)
- shared/ui/ → editor/shared/vibcoder → error (the 10-violation case from audit)

---

## PR3 — Inline-Hex Drain (existing rule already shipped)

> **Eng-review correction:** Originally framed as "build new Gate 26." Real state: rule **already exists** at `packages/editor/eslint-rules/no-inline-hex.cjs`. Covers JSX `style`/`css` attributes + Emotion template literals + `@lint-hex-policy:` escape directive. PR3 collapses from "new gate + drain" to "drain + flip warn→error."

Audit Pattern B: ~15 inline-hex sites flagged across canvas/inspector/shell. Per-site fixes:
1. Drain known sites listed in audit:
   - `editor/canvas/overlays/TemplatePreviewPanel.tsx:375` — `#1a1a2e`
   - `editor/canvas/overlays/ElementHoverOverlaySubComponents.tsx:191, 227, 234, 238` — banned palette pinks/yellows
   - `editor/canvas/DeviceFramePreview.tsx:129, 150` — device frame chrome
   - `editor/inspector/components/InspectorErrorBoundary.tsx:62, 66, 76`
   - `editor/inspector/ProInspector.tsx:138`
   - `editor/panels/VersionHistoryPanel.tsx:457`
   - `editor/shell/AccountModal.tsx:383-387`
   - `editor/shell/PublishDropdown.tsx:176-180`
   - `editor/shell/AquibraStudio.tsx:82-98` — Catppuccin error boundary palette
   - `editor/shell/PageTabBar.tsx:27-32`
   - `editor/sync/ConflictModal.tsx:108`
2. Verify rule scope covers `stroke="#"` / `fill="#"` on SVG elements (audit found these in ConflictModal). If existing rule misses these JSX attributes, extend matcher to handle `JSXAttribute` nodes for `stroke`/`fill` props.
3. Tokenize Catppuccin error boundary palette as `--bd-error-*` family in `themes/design-system/`.
4. Flip rule severity from `"warn"` → `"error"` in `eslint.config.mjs`.

**Acceptance criteria PR3:**
- ESLint passes with rule at `error` severity.
- Catppuccin tokens move to design-system; no chrome literal hex remains.
- CI fails any new inline hex without `@lint-hex-policy:` directive.

**Sequencing:** PR3 ships after PR2 (boundary lint) but is independent. Can ride parallel lane.

---

## D3 Stage — VersionHistoryPanel Split (~1 day human / ~30min CC)

**Source:** `editor/panels/VersionHistoryPanel.tsx` (962 LOC).
**Pattern:** Same as D2's hook-extract sequence (`useSaveCallback` → `useEditorEventListeners` → `useExportHandlers`).

> **Eng-review correction:** VersionHistoryPanel has **zero existing tests** (verified via grep). D3 was originally "tests should pass after each stage" — but no tests exist to pass. **D3 Stage 0 added: build baseline coverage BEFORE splitting**, otherwise regressions are invisible.

**Stage 0 (baseline tests, NEW):** Write smoke + integration tests for current 962-LOC component. ~2-4hr CC. Coverage targets:
- Versions list renders with N items, empty list shows empty state.
- Compare view toggles on, shows two version snapshots.
- AI summary fetch fires on demand, renders result.
- Restore action emits expected composer event.
- Time-travel scrubber position state round-trips correctly.

This is the regression baseline. Without it, splits are blind.

**Stage 1:** Extract `<VersionList>` component (FixedSizeList + row renderer + virtualization). ~300 LOC. Add unit tests.
**Stage 2:** Extract `<CompareView>` (diff state + side-by-side render). ~250 LOC. Add unit tests.
**Stage 3:** Extract `<AIPanel>` (AI summary state + render). ~150 LOC. Add unit tests.
**Stage 4:** `VersionHistoryPanel.tsx` becomes orchestrator (~250 LOC) — owns shared state, composes the three children.

**Each stage is a commit.** Same git pattern as D2. Stage 0 tests must remain green through Stages 1-4.

---

## D4 Stage — StudioModals Reducers (~1 day human / ~30min CC)

**Source:** `editor/shell/hooks/useStudioModals.ts` (15 useState pairs).

> **Eng-review correction:** Originally one 15-variant reducer. Splits to **3 sub-reducers by domain** to avoid recreating god-state-as-god-reducer.

**Target shape — 3 domain reducers:**

```ts
// editor/shell/hooks/useGlobalModals.ts (3 variants)
type GlobalModal =
  | { name: "none" }
  | { name: "commandPalette" }
  | { name: "shortcuts" }
  | { name: "projectSettings" };

// editor/shell/hooks/useContentModals.ts (8 variants)
type ContentModal =
  | { name: "none" }
  | { name: "templates" }
  | { name: "saveTemplate"; pageId: string }
  | { name: "exporter" }
  | { name: "ai" }
  | { name: "copilot" }
  | { name: "mediaLibrary"; mode: "browse" | "pick" }
  | { name: "imageEditor"; assetId: string; onSave: ModalSubmit<[Asset], void> }
  | { name: "iconPicker"; onPick: (icon: string) => void };

// editor/shell/hooks/useDomainModals.ts (3 variants)
type DomainModal =
  | { name: "none" }
  | { name: "collectionSetup"; onConfirm: ModalSubmit<[CollectionConfig], void> }
  | { name: "createComponent" }
  | { name: "cmsCollectionSetup" };
```

`AquibraStudio` composes all three: `useGlobalModals()` + `useContentModals()` + `useDomainModals()`. Same composition pattern as D2's hook extraction.

**Bundled:** Extract `useEscapeKey()` and `useClickOutside()` shared hooks from audit Pattern A duplicates (Escape key in 3 modals, ClickOutside in 3 dropdowns). Land alongside D4 — same cleanup session.

**Win:** `StudioModals.tsx` props collapse from 30+ to ~7 (3 modal-state objects + 3 dispatch fns + composer). ~50 LOC removed.

**Risk:** Modal state migrations across reducer boundaries. Mitigation: ship behind no flag — modal state is ephemeral per-session, no localStorage migration needed.

**Tests:** state machine round-trip per sub-reducer. Invariant test: at most one modal open across all three reducers at any time (orchestrator-level).

---

## D5 Stage — LibraryManager State Collapse (~1 day human / ~30min CC)

**Source:** `editor/media/LibraryManager.tsx` (900+ LOC, 11 useState).

**Step 1:** Extract `useLibraryUiState()` reducer combining 11 useState into single state machine.
**Step 2:** Extract `<FolderTree>`, `<AssetGrid>`, `<AssetDetailsPanel>` — 4 separate files.
**Step 3:** Add `react-window` virtualization to `<AssetGrid>` (audit performance finding #4.2).
**Step 4:** Extract `formatSize()` utility to `editor/media/utils/formatSize.ts` (audit duplicate #4.4).

**Open question:** Is virtualization a separate stage gated on real-user-with-500-assets evidence? Default: ship virtualization regardless — premature opt is cheap; perf cliff is invisible until it bites.

---

## D6 Stage — ProInspector Decomposition (~1 day human / ~30min CC)

**Source:** `editor/inspector/ProInspector.tsx` (631 LOC).

**Step 1:** Extract `<BreakpointSwitcher>` to own file (already partly its own component — finalize).
**Step 2:** Extract `<PseudoStateSwitcher>` to own file.
**Step 3:** Extract `<InspectorTabs>` orchestrator.
**Step 4:** ProInspector.tsx → ~250 LOC orchestrator.

**Note:** PR1's bug fix at line 255 lands first; D6 builds on top. Don't conflate — bug ships in PR1, decomposition is D6.

---

## Sequencing (post eng-review)

| Week | Action | Owner | Status |
|---|---|---|---|
| Week 0 | PR1 (engine/media boundary + ModalSubmit type, 2 items) | bugfix | Pending |
| Week 0 | PR2 (ESLint `@typescript-eslint/no-restricted-imports`) | tooling | Pending |
| Week 0 | PR3 (inline-hex drain + warn→error flip) | tooling | Pending |
| Week 1 | D3 Stage 0 (baseline tests) | testing | Queued |
| Week 1 | D3 Stages 1-4 (split) | refactor | Queued |
| Week 2 | D4 (3 sub-reducers + useEscapeKey/useClickOutside) | refactor | Queued |
| Week 3 | D5 LibraryManager state | refactor | Queued |
| Week 3 | D6 ProInspector decomposition | refactor | Queued |
| Q3 | UI smoke-test initiative (5 untested domains) | testing | Deferred |

**Parallel lanes** (eng-review parallelization):
- Lane A: PR1 (engine/media + types)
- Lane B: PR2 (lint) + PR3 (hex drain)
- Lane D: D3 (sequential Stage 0 → 1-4)
- Lane E: D5 (independent, editor/media)
- Lane F: D6 (independent, editor/inspector)

Lanes A, B, E, F runnable in parallel after PR2 ships. D3 and D4 sequential (both touch shell rendering tree).
**Conflict flag:** PR3 hex drain may touch LibraryManager (Lane E) and ProInspector (Lane F). PR3 ships before D5/D6 to avoid 3-way merge.

---

## NOT in scope (deferred to TODOS.md or backlog)

- **UI smoke tests** for onboarding/, collaboration/, ecommerce/, export/, sync/ — Q3 initiative.
- **Engine god-class splits** beyond Composer manager facades — VersionTimelineManager (947 LOC), CollaborationManager (795 LOC), StyleEngine (698 LOC), ExportEngine (668 LOC), MediaManager (634 LOC). Separate engine cleanup arc post-D-series.
- **Achievement timer duplication** (`useOnboardingOrchestrator` 3.5s vs `AchievementPrompt` 4s) — minor; consolidate when next touching onboarding.
- **`PresenceIndicators` mock users** — kept by design for empty-disconnect UX. Document the intent, don't remove.
- **Mode-specific empty-state UX** for `PresenceIndicators`, `OnboardingChecklist` — UX polish; not structural.
- **`themes/legacy-components.css` further drain** — already at 72 LOC and locked. Phase Final closed the arc.

---

## Failure Modes

| Risk | Probability | Mitigation |
|---|---|---|
| Gate 26 inline-hex inventory undercount (like vibcoder 1622 → 202) | High | Phase 0 inventory PR before drain — same playbook |
| D3-D6 stages compete with Phase 1d publish smoke | Med | PR1+PR2+PR3-Phase0 ship Week 0; D3 starts Week 1 after Phase 1d gates |
| ESLint rule false-positives on `shared/extensions/` | Low | Whitelist explicitly via `except` |
| ProInspector:255 fix breaks responsive-override semantics for users who learned the broken behavior | Low | Add visible breakpoint indicator in UI; test pre/post on real project |
| Stage-by-stage git history during D3-D6 noisy | Low | Same as D2 — already validated |

---

## Exit Criteria (per stage)

- **PR1:** Bug counts in audit drop by 3 (ProInspector responsive, engine/media boundary, modal contract). Manual repro for ProInspector.
- **PR2:** Lint passes; new violation in PR fails CI.
- **PR3 (full):** Gate 26 baseline locked at 0 in chrome paths; per-panel growth lock active.
- **D3:** VersionHistoryPanel.tsx ≤300 LOC; 3 child components each ≤350 LOC; tests green.
- **D4:** `StudioModals.tsx` props ≤5; reducer state machine round-trip-tested.
- **D5:** LibraryManager.tsx ≤400 LOC; AssetGrid virtualized.
- **D6:** ProInspector.tsx ≤300 LOC.

---

## Re-audit cadence

Re-run the multi-agent audit after PR1 + each D-stage. Track findings count per category. Audit doc becomes living artifact, not snapshot.

```
Audit baseline (2026-05-07): 91 findings
After PR1+PR2:               ~75 findings expected
After D3:                    ~68
After D4:                    ~60
After D6:                    ~50
Q3 (UI tests):               ~35
Steady state target:         < 30
```

---

## Open Questions for User

These are not blocking — defaults are usable. But user input shifts the plan:

1. **AlignmentHandler boundary:** Surface as `composer.alignment.*` (Approach A) or allow direct engine import for action handlers in toolbars (Approach B-relaxed)?
   - Default: A — composer is the gateway by design.
2. **Catppuccin error boundary palette:** Tokenize as `--bd-error-*` or leave as one-off?
   - Default: tokenize during Gate 26 drain.
3. **Virtualization on AssetGrid:** Ship always or gate on user evidence?
   - Default: ship always (audit + memory both flag perf cliff for 500+ asset projects).
4. **D3-D6 owner:** AI-driven (CC sequential PRs) or human-driven?
   - Default: AI-driven, same as D2. Each stage = single commit, reviewable diff.

---

## TODOS.md additions (proposed)

To be added under a new "Audit Remediation 2026-05-07" section:

- **UI smoke-test initiative for 5 untested feature domains** — onboarding/, collaboration/, ecommerce/, export/, sync/. Effort: M (human ~1 week / CC ~3hr). Priority: P2. Q3.
- **Engine god-class split arc** — VersionTimelineManager, CollaborationManager, StyleEngine, ExportEngine, MediaManager. Effort: L. Priority: P3. Post-D-series.
- **Achievement timer SSOT** — consolidate orchestrator 3.5s vs AchievementPrompt 4s. Effort: S. Priority: P3. Next onboarding touch.
- **Tooltip extraction in PresenceIndicators + ConnectionQualityIndicator** — use vibcoder Tooltip. Effort: S. Priority: P3. Next collaboration touch.

---

## Status

ACTIVE. PR1 begins on next work session. Plan reviewed via `/plan-ceo-review` 2026-05-07 + `/plan-eng-review` 2026-05-07.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR (HOLD/SELECTIVE) | Approach B selected; D-series + gates rail confirmed |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 6 issues raised; 4 plan-altering (ProInspector not-a-bug, Gate 26 already exists, D3 baseline tests missing, D4 reducer split); plan revised |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | not run (no UI scope) |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | skipped (audit was multi-agent) |
| DX Review | `/plan-devex-review` | Developer experience | 0 | — | not run (internal editor, no public API) |

- **UNRESOLVED:** 0
- **CRITICAL GAPS REMAINING:** 1 (D3 Stage 0 must run before D3 Stage 1)
- **VERDICT:** CEO + ENG CLEARED — ready to implement starting with PR1.
