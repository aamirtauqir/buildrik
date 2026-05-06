# Phase D — D2 + D3 execution plan

**Predecessor:** `EDITOR_CLEANUP_REMAINING.md` (Phase A/B/C/D plan), D1 closed in commit `0928f1f4`
**Status:** Ready to execute (plan only — no code changes)
**Updated:** 2026-05-08

D1 ([useCanvasDragDrop split](../packages/editor/src/editor/canvas/hooks/)) shipped tonight in 3 stages: tests first, then 3 incremental extractions, each with its own commit + verification. **Total: 692 → 260 LOC orchestrator + 3 sub-hooks at 158/193/300 LOC.** Coverage 100% stmts on the orchestrator after split. **Mirror this exact discipline for D2 + D3.**

The single biggest lesson from D1: each stage MUST be independently verifiable + committable. No half-extractions. If a stage breaks, revert one commit, not the whole arc.

---

## D2 — AquibraStudio split (E-006, 669 LOC)

### What it does today

Function body 119-433 (314 lines of state/effects/callbacks) + 220-line JSX render. Already orchestrates 5 extracted hooks (`useStudioState`, `useStudioModals`, `useComposerInit`, `useComposerSelection`, `useStudioHandlers`) but still owns:

| Block | Lines | Concern |
|---|---|---|
| Refs + simple state | 121-128 | `canvasRef`, `composerContainerRef`, wizard, hasManuallyToggled |
| Hook composition | 130-195 | calls 5 existing hooks + 1 useMemo for selectedElement |
| `saveProject` callback | 199-235 | save flow + error toast |
| Keyboard shortcuts effect | 238-285 | ~50 lines, 8+ key bindings |
| Export handlers | 287-321 | `handleExportHTML` + `handleExportForDeploy` |
| Vercel publish flow | 325-376 | `usePublishJob` + handler + completion toast effect |
| Component-creation listener | 378-390 | `composer.on("create-component")` |
| "Show in Layers" listener | 393-411 | navigates left panel + scrolls |
| Load overlay defaults | 415-422 | localStorage → state |
| Auto-enable spacing | 425-433 | first-selection effect |
| JSX render | 439-657 | 220-line tree |

### Test prep first (gate: ≥70%)

AquibraStudio has **0 tests**. Same pattern as D1 stage 0: write hook integration tests via renderHook + mocked sub-hooks before extraction.

**Mock strategy:** mock all 5 existing sub-hooks (`useStudioState`, etc.) + `useComposerInit` returning a stub composer + `usePublishJob`. Test orchestration choices, not sub-hook internals.

**Test scope (~16-20 tests):**
- `saveProject` — calls composer.save(), shows toast, error path
- Keyboard shortcuts — Cmd+S → save, Cmd+Z → undo, Cmd+Y → redo, Esc → close modal, Del → delete element
- `handleExportHTML` — exportEngine call → zip download
- `handleVercelPublish` — siteId guard, exportAllPages → publishJob.publish, error toast
- Publish completion effect — toast on `published` state with URL
- Component creation listener — modal open on event
- Load defaults effect — localStorage → state setters
- Auto-spacing effect — first selection enables, manual toggle disables

**Time estimate:** 2-3 hours.

### Extraction stages (4 stages)

Audit proposed `useEditorShortcuts` / `useSaveCallback` / `useEditorModals` (last already exists as `useStudioModals`). Real extraction map after inspection:

#### Stage 1 — `useEditorShortcuts` (~50 lines)

**Owns:** lines 238-285 (keyboard shortcuts useEffect).

**Inputs:** composer, modals (open/close handlers), state (canUndo/canRedo derivation), saveProject.

**Output:** none (effect-only hook, attaches listener internally).

**Risk:** low. Self-contained `useEffect` with `addEventListener("keydown")`. No state ownership.

**Time:** 30-60 min including test verification.

#### Stage 2 — `useExportHandlers` (~100 lines)

**Owns:** lines 287-376 — `handleExportHTML`, `handleExportForDeploy`, `usePublishJob`, `handleVercelPublish`, publish-completion toast effect.

**Inputs:** composer, modals (setExporterOpen, setExportLoading), addToast.

**Output:** `{ handleExportHTML, handleExportForDeploy, handleVercelPublish, publishJob }`.

**Risk:** medium — couples to `usePublishJob` (existing hook) + the 2-second polling there. Test the toast effect carefully (depends on prior `publishJob.uiState` value).

**Time:** 60-90 min.

#### Stage 3 — `useEditorEventListeners` (~80 lines)

**Owns:** lines 378-433 — 4 useEffects: component-creation listener, Show-in-Layers listener, overlay-defaults loader, auto-spacing effect.

**Inputs:** composer, modals.openCreateComponent, state (setLeftPanelTab/setIsLeftPanelOpen + 4 overlay setters), selectedElement, hasManuallyToggledSpacing ref.

**Output:** none (effect-only).

**Risk:** medium — multiple useEffects with different deps; easy to introduce stale-closure bugs. Test each effect's listener attach/detach pair.

**Time:** 60-90 min.

#### Stage 4 — `useSaveCallback` (~40 lines)

**Owns:** lines 199-235 — `saveProject` callback.

**Inputs:** composer, addToast, state.markSaved/markSaving/markError, modals.openErrorModal.

**Output:** `{ saveProject }`.

**Risk:** low — pure callback extraction.

**Time:** 30 min.

### Stage order rationale

Stages ordered by **risk + independence**, not size:

1. **Stage 1 (shortcuts)** — most isolated, safest first
2. **Stage 4 (save)** — atomic, simple
3. **Stage 3 (event listeners)** — moderate, but multiple effects need careful detach handling
4. **Stage 2 (export)** — most coupled (publishJob polling), do last after orchestrator is leaner

### Final shape projection

After all 4 stages:

```
AquibraStudio.tsx       669 → ~250 LOC  (orchestrator + JSX render)
+ useEditorShortcuts.ts        ~80 LOC
+ useExportHandlers.ts        ~150 LOC
+ useEditorEventListeners.ts  ~120 LOC
+ useSaveCallback.ts           ~70 LOC
                               ─────────
Total D2 surface:              ~670 LOC across 5 files
```

JSX render stays in AquibraStudio (220 lines). The orchestrator becomes: refs + sub-hook composition + JSX. Same shape as D1 final.

### D2 total time estimate

- Test prep: 2-3 hr
- 4 extraction stages: 3-4 hr
- **Total: 5-7 hours.** Single focused session, fresh head.

---

## D3 — Composer manager grouping (E-014, 30 fields, 162 consumer files)

### What it does today

`Composer.ts` has 30 `readonly` manager fields (lines 86-115). Every consumer reaches in flat: `composer.mediaCommands.insertMediaAt(...)`, `composer.collaboration.connect(...)`, `composer.cmsBindings.bind(...)`. The audit's complaint: god-object. Fields cross 8+ unrelated domains.

### Why this is harder than D1/D2

**D1/D2 are single-file refactors.** D3 is a **cross-cutting redesign** touching 162 consumer files. Wrong cleavage = drag-drop, autosave, collaboration, media upload, AND publish all broken simultaneously. There is no "stage 1 ship + verify" if stage 1 changes 50 files.

**Codemod is required**, not optional. Manual rewrite of 162 files with manager renames is regression-bait.

### Proposed facades

Reality: 30 fields don't group cleanly into 3 facades. Real grouping (8 facades, +misc):

| Facade | Member fields | Today's flat names |
|---|---|---|
| `composer.media` | `manager`, `commands` | `media`, `mediaCommands` |
| `composer.data` | `sources`, `bindings.style`, `bindings.trait`, `bindings.text` | `data`, `styleBindings`, `traitBindings`, `textBindings` |
| `composer.cms` | `collections`, `bindings` | `cmsManager`, `cmsBindings` |
| `composer.collab` | `manager`, `sync`, `ot` | `collaboration`, `sync` (engine `OTEngine` if exposed) |
| `composer.canvas` | `indicators`, `resize`, `drag` | `canvasIndicators`, `resizeHandler`, `drag` |
| `composer.lifecycle` | `history`, `versionTimeline`, `recovery`, `plugins` | `history`, `versionHistory`, `recovery`, `plugins` |
| `composer.content` | `elements`, `styles`, `components`, `templates`, `fonts`, `globalStyles`, `forms`, `interactions` | (8 fields, flat) |
| `composer.ui` | `viewport`, `router`, `selection`, `commands`, `storage` | (5 fields, flat) |

**Net surface change:** 30 flat fields → 8 facades. Field naming maps documented in the codemod.

**Counter-question worth asking before committing to D3:**
> Does grouping under facades genuinely improve readability, or just moves the noise? `composer.media.commands.insertMediaAt(...)` is one extra dot vs. `composer.mediaCommands.insertMediaAt(...)`. Argument FOR: faster autocomplete on `composer.` (8 options vs 30). Argument AGAINST: 2 lookups instead of 1 per call site.

**Recommendation:** validate with the user BEFORE codemod. D1+D2 win was real LOC reduction; D3 is naming reorganization with disputed LOC impact.

### If approved — staging plan

#### Stage 0 — codemod prep + dry run (~3-4 hr)

1. Author `scripts/codemods/composer-manager-facades.ts` (jscodeshift)
2. Hardcode the 30-name mapping table in the codemod
3. Run with `--dry` against `packages/editor/src/`; verify output count = 162 files modified
4. Spot-check 5 random transformed files for correctness (string interpolation, optional chaining, type narrowing all preserved)
5. Verify codemod is idempotent (running twice = no further changes)

**Deliverable:** committed codemod + dry-run report, no code changed yet.

#### Stage 1 — Composer.ts: add facades alongside flat fields (~1-2 hr)

Add the 8 facade objects as new `readonly` fields. Each facade is a plain object literal pointing at the existing flat-named fields:

```ts
readonly media = { manager: this.media, commands: this.mediaCommands };
// ...
```

(Need to assign in constructor body since `this.media` reference order matters; or use getters.)

**Deliverable:** Composer has both flat AND grouped surfaces. All 162 consumers continue to work via flat names. New facade names also work.

**Verification:** typecheck clean, all existing tests pass.

#### Stage 2 — codemod sweep (~30 min execution + 1 hr review)

Run the Stage 0 codemod for real. Commit results in a single mega-commit (this is unusual but justified — atomic rewrite is the point).

**Verification:** typecheck clean, all 1860+ tests pass, manual smoke (open editor, drag-drop, save, switch device).

#### Stage 3 — remove the flat fields (~30 min)

Delete the 30 `readonly mediaCommands!: ...` etc. lines from Composer.ts. Verify zero remaining `composer.mediaCommands` (etc.) refs via grep.

**Deliverable:** `git grep "composer\\.mediaCommands"` returns 0 results. Same for the other 29 flat names.

**Verification:** typecheck clean, all tests pass.

### D3 total time estimate

- Stage 0 (codemod prep): 3-4 hr
- Stage 1 (Composer additions): 1-2 hr
- Stage 2 (codemod sweep + review): 1.5 hr
- Stage 3 (flat-field removal): 30 min
- **Total: 6-8 hours.** Single concentrated session ideal — atomic codemod step is brittle if interrupted.

---

## Cross-cutting risk register

| Risk | Mitigation |
|---|---|
| D2 stage 4 (export) breaks publish flow + you're testing Phase 1d that day | Run D2 BEFORE flipping `VITE_FEATURE_PUBLISH=true`, OR after Phase 1d e2e proves baseline works |
| D3 codemod misses `(composer as any).mediaCommands` patterns | Codemod must include the `as any` cast pattern in its match rules |
| D3 breaks an external package consuming `@buildrik/editor` | Editor package has no published exports — confirmed safe per memory `project_components_graveyard_killed_20260502.md` |
| D2 keyboard-shortcut extraction breaks Cmd+S timing | Manual smoke test required: open editor, type, Cmd+S, verify save toast fires |
| D3 codemod produces TypeScript errors in 50+ files | Stage 0 dry-run catches this before stage 2 commits |

---

## Sequencing recommendation

**D2 first, D3 second.**

D2 is single-file (mostly). Self-contained. Clear win like D1.

D3 changes 162 files atomically. Higher risk, higher coordination cost. After D2 proves the AquibraStudio orchestrator is leaner, the appetite for codemod-driven cross-cut is clearer (or the user may decide D3's value isn't worth the disruption).

**If only one happens:** **D2.** D3 is a naming-reorg arc that's debatable whether it improves anything beyond autocomplete affordance.

---

## What NOT to do

- Don't combine D2 + D3 stages in single commits. Each must be independently revertible.
- Don't skip the test-prep step for D2. (D1's stage-0 hook tests caught the mock-hoisting issue early; D2 will have similar pitfalls.)
- Don't run D3 stage 2 (codemod sweep) when uncommitted changes exist in `packages/editor/src/`. Clean tree only — same lesson as `feedback_no_stash_mid_execution.md`.
- Don't extract `useStudioModals` further. It's already an existing hook; the audit's `useEditorModals` proposal duplicated it.
- Don't move JSX out of `AquibraStudio.tsx`. The 220-line render tree IS the orchestration — extracting it just reshuffles the same code.

---

## Open questions for the user before D3

1. Is grouping `composer.{media,data,cms,collab,canvas,lifecycle,content,ui}` the desired final shape, or some other partition?
2. Should `cmsManager` rename to `cms.collections`? (Audit said yes; current name is awkward — `cmsManager` is itself a `CollectionManager` instance.)
3. Should the deprecated flat fields stay temporarily for backwards-compat (Stage 1 only) or get removed atomically (Stages 2+3 in one commit)?

(D2 has no open questions — extraction shape is clear from the file structure.)
