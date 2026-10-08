# 03 — Engine integration audit (Composer, history, events, persistence)

Repo: `/Users/shahg/Desktop/pencil/buildrik/packages/editor` · HEAD `44f5db956` · audited 2026-10-08 · read-only.

## How this was verified

- **Probe** means a throwaway vitest file in the scratchpad (`scratchpad/probe/*.probe.test.ts`), run against the real engine modules through a scratch config that reuses `vitest.config.ts`. Nothing in the repo was edited.
- **Read** means the conclusion comes from reading the code and tracing the data flow, with no execution.
- **UNVERIFIED** means the finding is plausible, but neither a probe nor the live app confirmed it.
- Nothing here was checked in the running app. Per the root CLAUDE.md rule 1, every P1 still needs a live walk.

## Engine test run

`npx vitest run src/engine` → **218 files: 217 passed, 1 failed. 2677 tests passed, 2 failed, 16 todo.**

- Both failures are in `src/engine/export/__tests__/ExportEngine.tokenClosure.test.ts` ("declares every var() each block's export reads", in two describes). Each one hit the 15 s `testTimeout` under full-suite load, taking 40 s and 27 s.
- The same file re-run on its own **passes** (exit 0, 58 s total). So this is a timeout flake caused by load, not a correctness failure. Raise the per-test timeout or make the test cheaper.

---

## P1 findings

### P1-1 · `trimHistory` corrupts the undo baseline once history passes 100 entries (probe-verified)
- **Where:** `src/engine/HistoryManager.ts:679-696`. Cap: `THRESHOLDS.HISTORY_MAX_SIZE = 100` (`shared/constants/config.ts:107`).
- **Trace:**
  1. `record()` pushes an entry, then `trimHistory()` runs `shift()`, which removes index 0 (always a checkpoint).
  2. The new index 0 is a patch, so it calls `reconstructState(0)`.
  3. That walks back from index 0, finds no checkpoint (it was just removed) and hits the fallback at `:437-445`. The fallback returns the **tail** snapshot, which is the newest state, or `{}` when the tail is a patch.
  4. That wrong state becomes the new bottom checkpoint.
- **Measured** with a fake composer, `n` = edit counter:
  - With max 15 and 16 edits, undo goes `15,14,13,12,11,10` and then **stalls**. `undo()` returns false: "undo bailed — Cannot navigate path", even though `canUndo()` is still true.
  - With the real cap of 100 and 120 edits, undo goes `119 … 22` and then the last undo jumps to **120**. The oldest undo re-applies every edit instead of reverting one.
  - If the tail is a patch at trim time, the baseline becomes `{}`. Undo to that entry would then `importProject({})`, which clears every page and seeds an empty default page. The tail can be a patch after undo/redo or `forceCheckpoint` shift the checkpoint alignment. Wiping the canvas this way is UNVERIFIED end to end.
- **Root cause:** the replacement checkpoint is computed *after* the checkpoint it depends on has already been removed.
- **Expected:** after a trim, the oldest reachable state is the state at the new index 0.
- **Fix:** convert `undoStack[1]` before shifting.
  ```ts
  while (this.undoStack.length > this.config.maxHistory) {
    if (this.undoStack[1]?.type === "patch") {
      this.undoStack[1] = { type: "checkpoint", timestamp: this.undoStack[1].timestamp,
        snapshot: this.reconstructState(1), label: this.undoStack[1].label, userId: this.undoStack[1].userId };
    }
    this.undoStack.shift();
  }
  ```
  Add a test that runs more than `maxHistory` edits and then undoes all of them. No test covers `trimHistory` today.

### P1-2 · `runWithoutTracking` leaves the diff baseline stale, so the next undo reverts the "untracked" write (probe-verified)
- **Where:** `HistoryManager.ts:487-497`. It never refreshes `currentStateCache`.
- **Callers:**
  - `media/MediaCommandLayer.ts:108-121`: deleting a file clears `src` / `background-image` on every element that used it.
  - `cms/CMSBindingManager.ts:294-295`: a bound field writes its resolved CMS value into the element.
- **Trace:**
  1. The untracked write mutates the tree, but `currentStateCache` still holds the pre-write state.
  2. The next user edit runs `record()`, whose `createPatch(cache, now)` includes the untracked write.
  3. ⌘Z on that edit reconstructs the previous entry, which predates the write.
- **Measured:** edit `a=1` (recorded), untracked `b=99`, edit `a=2` (recorded), then one undo gives `a=1, b=0`.
- **In the product:** delete an image file, make any edit, press ⌘Z. The image gets back the dead asset URL that the 2026-09-15 fix was meant to stop. A CMS-bound text goes back to its placeholder the same way.
- **Root cause:** the untracked delta was folded into the next diff instead of the baseline.
- **Fix:** at the end of `runWithoutTracking` (when not called from `rollbackTransaction`), re-base the top of the stack:
  ```ts
  const snap = this.captureSnapshot();
  this.undoStack[this.undoStack.length - 1] = { type: "checkpoint", timestamp: Date.now(), snapshot: snap, label: top.label, userId: top.userId };
  this.currentStateCache = snap;
  ```
  Undoing the next edit then lands on a state that keeps the untracked write. Undoing further back still reverts it, which is historically correct.

### P1-3 · Undo/redo always jumps the editor to the first page (probe-verified)
- **Where:**
  - `HistoryManager.restoreSnapshot` (`:462-479`) calls `importScoped`, which calls `Composer.importProject` (`Composer.ts:700-727`).
  - `elements.clear()` then reaches `PageManager.clear()` (`elements/manager/PageManager.ts:423-429`), which sets `setActivePageId(null)`.
  - `importPage` then sets the active page to the **first page imported** (`PageManager.ts:~399-400`). `Composer.ts:720-724` also falls back to `pages[0]`.
- **Measured** with the real Composer: active page "About", add a heading, ⌘Z. The active page becomes **"Home"**.
  - The undone change sits on a page the user is no longer looking at.
  - No shell listener puts the page back. The `HISTORY_UNDO` listeners in `TimeTravelHost.tsx`, `useSectionReorder.ts` and `useTemplateApply.ts` only read the active page.
- **Root cause:** active page is navigation state, and the history restore path does not keep it.
- **Fix:** in `restoreSnapshot` (and `applyRemoteOperation`), capture `const active = composer.elements.getActivePage()?.id` before `importScoped`. After it, if `composer.elements.getPage(active)` exists, call `composer.elements.setActivePage(active)`. Do this while `isRecording` is still false. The `page:activated` payload is navigation-only, so autosave ignores it. Consider the same fix in `rollbackTransaction`.

### P1-4 · "Restore my edits" restores in memory, then deletes the only recovery copy without saving (read)
- **Where:** `src/editor/shell/hooks/useComposerInit.ts:323-329`.
- **Trace:**
  1. `instance.importProject(unsaved.project)` emits only `PROJECT_LOADED`, and `importProject` sets `state.dirty = false` (`Composer.ts:726`).
  2. The autosave effect listens only to `project:changed`, `history:undo`, `history:redo` and `version:restored` (`:822-826`), so no save is scheduled.
  3. `setIsDirty(true)` only sets the React flag.
  4. `clearUnsaved(siteId)` then **removes the localStorage copy** right away.
  5. If the user leaves through the beforeunload prompt (or the tab crashes) before any other edit, the restored work exists nowhere.
  6. The restore also wipes the undo stack: HistoryManager's `PROJECT_LOADED` handler (`HistoryManager.ts:138-162`).
- **Expected:** restored edits are saved as soon as possible, and the recovery copy is kept until the server has them.
- **Fix:** after `importProject`, call `instance.markDirty()`. That emits `PROJECT_CHANGED` and schedules autosave. Remove the eager `clearUnsaved` here, because the autosave success path already clears it (`:669`).

### P1-5 · An autosave that fails with 401 keeps no recovery copy; manual save does (read)
- **Where:**
  - Autosave: `useComposerInit.ts:756-767` (`isAuthSaveError` branch). It sets the error state and calls `onAuthExpired()`, but there is **no `keepUnsaved`**.
  - Manual save: `useSaveCallback.ts:~351` keeps the snapshot. Its own comment explains why: a 401 "was the ONE recoverable failure that kept nothing".
- **Trace:**
  1. The session expires mid-edit and autosave fails first.
  2. The recovery surface nudges the user to sign in again or reload.
  3. On reload, `readUnsaved` finds nothing, so the load path seeds "Saved · just now" over the gap.
- **Same gap for generic server errors:** the generic branch at `:775-801` also keeps nothing, in both the autosave and manual paths. This is exactly the "silent loss" pattern described at `useComposerInit.ts:296-302`.
- **Fix:** add `if (siteId && snapshot) keepUnsaved(siteId, snapshot);` to the autosave 401 branch and to the generic-error branch. Leave out the `SITE_MISSING` case, as the manual path does.

### P1-6 · Data sources ("+ Add a source") are never persisted (probe-verified)
- **Where:**
  - `engine/data/DataManager.ts:60-120, 315-355`: `registerSource`, `importSampleData`, `renameSource`, `updateSourceData` and `unregisterSource` keep state in an in-memory map. They never call `markDirty` and are never serialized.
  - `Composer.exportProject` (`Composer.ts:734-770`) has no data-sources field.
  - UI entry points: `editor/sidebar/tabs/content/ContentTab.tsx:106-133`.
- **Measured:** `importSampleData` gives 1 source. Export, then `importProject` into a new Composer, gives **0 sources**. The project is not even dirtied (`isDirty()` is false).
  - Elements whose `dataBindings` point at that source render empty after a reload.
  - Site variables are fine: they live in `projectSettings.siteVariables`.
- **Fix:**
  - Add `dataSources` to `ProjectData`.
  - Export it in `exportProject` and restore it in `importProject`.
  - Call `composer.markDirty()` in every DataManager mutator.
  - Include it in the server save and load (`BuildrikSyncProvider.projectDataFromRows` / `sites.saveProject`). That needs a server column or settings key; the server side is UNVERIFIED.

### P1-7 · A CMS field bind whose value doesn't resolve is never autosaved (read, UNVERIFIED live)
- **Where:**
  - `engine/data/BaseBindingManager.ts:84-121` (`bind`).
  - `engine/cms/CMSBindingManager.ts:281` (`if (!value) return;`).
  - Caller: `editor/inspector/sections/CmsBindingSection.tsx:204,260`, which passes a history label.
- **Trace:**
  1. `bind()` writes the binding map and calls `applyBinding`.
  2. When there is no published record or the field is empty, nothing is written to the element, so `markDirty` never runs.
  3. `history.record(label)` then records an undo entry (cmsBindings *is* in the snapshot), but `record` only emits `HISTORY_RECORDED`.
  4. Autosave does not listen to that event, so the binding stays only in memory and disappears on reload, unless some other edit happens to dirty the project.
- **Note:** `bindCollection` and `unbind` do call `markDirty` (`CMSBindingManager.ts:340,383`; `BaseBindingManager.ts:142`). Only field `bind` is missing it.
- **Fix:** call `this.composer.markDirty()` in `bind()` right after `this.bindings.set(...)`. Delete the stale `noteUnrecordedAction` branch (see P2-6).

---

## P2 findings

### P2-1 · Separate undoable actions within 500 ms merge into one undo step (probe-verified)
- **Where:**
  - `HistoryManager.ts:95-128`: the `PROJECT_CHANGED` handler is a trailing debounce.
  - `Composer.endTransaction` (`Composer.ts:1107-1131`) only emits `TRANSACTION_END`, and HistoryManager ignores it unless the transaction was rolled back (`:170-174`).
- **Measured:** "Delete A" (transaction), 300 ms, "Delete B" (transaction). The stack holds **one** entry labelled "Delete A", and one ⌘Z reverts both deletes.
- **Fix:** at `TRANSACTION_BEGIN` (outermost), call `this.flushPending()` so the previous edit commits on its own. At `TRANSACTION_END` (not rolled back, dirty), record immediately with the label instead of debouncing. Typing, which is not transactional, keeps coalescing.

### P2-2 · The label of a transaction that changed nothing sticks to the next edit (probe-verified)
- **Where:** `HistoryManager.ts:164-168` sets `currentTransactionLabel` at begin. It is only cleared in `record()` (`:195-197`) or on rollback.
- **Measured:** an empty transaction "Rename page", then an ordinary edit. That edit lands on the stack labelled "Rename page", which is what the History panel shows.
- **Fix:** clear `currentTransactionLabel` on every outermost `TRANSACTION_END`. The handler already receives it; record the label when the transaction was dirty.

### P2-3 · When undo or redo bails, nothing tells the user (read)
- **Where:** `HistoryManager.ts:537-541` and `:650-654`.
- **Trace:** they `console.warn` and return false, with no `HISTORY_NOOP`. ⌘Z or the footer Undo does nothing visible and the button stays enabled. This combines with P1-1.
- **Fix:** emit `HISTORY_NOOP { direction, reason: "diverged" }` in both catch blocks.

### P2-4 · Page operations emit `PROJECT_CHANGED` directly, bypassing `markDirty` and transactions (probe-verified for dirty)
- **Where:** `elements/manager/PageManager.ts:94,173,252,279,334,359` and `HTMLParser.ts:119,140`.
- **Measured:** `updatePage(..., {name})` leaves `composer.isDirty() === false`.
- **Consumers that read the engine flag:**
  - `editor/sidebar/tabs/history/components/ActivityView.tsx:352`, whose "unsaved" warning is wrong after a page rename, delete or reorder.
  - `storage/StorageAdapter.ts:49`.
- Page operations inside a `beginTransaction` also emit immediately, so they are not batched.
- Autosave still fires, because it listens to the event.
- **Fix:** in PageManager, replace each bare emit with `composer.markDirty()` plus a typed payload. That needs `markDirty(payload?)` to forward the payload, which `isNavigationOnlyChange` reads. Keep `setActivePage` as a bare emit, since it is navigation only.

### P2-5 · Production runs the engine's own localStorage autosave into one key shared by every site (read)
- **Where:**
  - `dashboard/components/editor-route/EditorClient.tsx:64` mounts `<AquibraStudio>` with no options.
  - `Composer.normalizeConfig` therefore defaults `storage = {type:"local", autoSave:true}` (`Composer.ts:552-557`).
  - `StorageAdapter` (`storage/StorageAdapter.ts:36-58`) debounces 5 s on `PROJECT_CHANGED` and writes the whole (redacted) project to `aquibra-project`, whenever the shell's 1 s dashboard save has not yet cleared `dirty`.
- **On load failure:** `loadFromLocalStorage` (`useComposerInit.ts:415-437`) loads that key. That is whichever site last wrote it, possibly a **different site**, shown as "falling back to local".
  - No server write happens: `PROJECT_NOT_LOADED` guards it at `BuildrikSyncProvider.ts:794`.
  - But the user is shown, and can edit, the wrong site.
  - The adapter's `STORAGE_ERROR` (`:51`) has no listener either.
- **Fix:** when a siteId is present, create the composer with `storage: { type: "none", autoSave: false }`. Or key the adapter by siteId. Do not fall back to a key that is not scoped to the site.

### P2-6 · Contradictory binding/history contract; `noteUnrecordedAction` on unbind gets re-armed (read)
- **What the code says:**
  - The `BaseBindingManager.ts:107-111` comment says "ProjectData has no field for them".
  - But `Composer.exportProject` serializes `cmsBindings` (`Composer.ts:755-768`), and `bind()`'s own header (`:85-89`) says bindings are in the snapshot.
- **Why it matters:** `unbind()` (`:131-144`) calls `markDirty()` and then `noteUnrecordedAction`.
  - The debounced record lands about 500 ms later with a real patch that includes the binding map, and sets `lastActionRecorded = true` again.
  - So the "disable Undo" signal is wrong for half a second, and then Undo works. Unlabelled `bind()` declares the action unrecorded even though it could be recorded.
- **Fix:** bindings are in the snapshot, so drop `noteUnrecordedAction` from `bind`, `unbind` and `unbindAll`. Record with a label instead. Fix the stale comment.

### P2-7 · Undo of "Update component master" reverts instances but not the master (read, UNVERIFIED live)
- **Where:** `components/ComponentManager.ts:378-401` (`applyMaster`). The master lives in IndexedDB plus the server mirror (`useComponentSync.ts`), outside the history snapshot. `syncAllInstances` dirties the instance elements, and that change is recorded.
- **What happens:** ⌘Z restores the old instance trees while the master keeps the new tree and `version++`. Instances then silently disagree with their master until the next sync re-applies it.
  - The detail screen's toast undo (`ComponentDetailScreen.tsx:196`, `revertComponentMaster`) is the only correct revert.
  - `applyMaster` never calls `noteUnrecordedAction`.
- **Fix:** route master edits through one history-aware path. Either call `noteUnrecordedAction("updating a component")` after the sync, or have the HISTORY_UNDO of that labelled entry call `revertComponentMaster`.

### P2-8 · RecoveryManager mutates the document silently on any window error (read)
- **Where:** `recovery/RecoveryManager.ts`.
  - The listeners (`:53-80`) trigger `handleRuntimeFault` (`:86-102`) on **any** `window` `error` or `unhandledrejection` anywhere in the app.
  - That runs `recoverFromInactivity`, and then `ensurePageRootExists` (`:114-141`).
- **What happens:** if a root is missing, it creates an empty root and assigns `page.root = newRootData` directly. There is no `markDirty`, no history entry, and `PAGE_RECOVERED` has **no listener**, so the user is never told that a page was reset to empty. The next save persists the empty page.
- **Fix:** emit through `markDirty` and record a labelled history entry. Surface `PAGE_RECOVERED` in a toast. Narrow the trigger to faults that originate in the editor.

### P2-9 · Secrets reach browser storage unredacted through the recovery and version paths (read)
- **Where:**
  - `services/unsavedRecovery.ts:53` stores the full `composer.exportProject()` in localStorage.
  - `VersionTimelineManager.ts:624,951` snapshots `exportProject()` into IndexedDB (`storage/VersionHistoryStorage.ts:70`).
- **Why it matters:** both snapshots include `settings.integrations.email.apiKey` and `settings.publishing.publishedPassword`. `StorageAdapter.redactSecretsForBrowserStorage` (`StorageAdapter.ts:176-196`) strips exactly those, and documents why (XSS or shared-device exposure).
- **Fix:** move `redactSecretsForBrowserStorage` into a shared util and apply it in `keepUnsaved` and in version persistence. When restoring, re-merge the live secrets.

### P2-10 · Event wiring problems

Method: a script cross-referenced all 322 `EVENTS` constants and every literal `emit("…")` / `.on("…")` across `src/`, tests excluded. The script is in `scratchpad/scripts/events.mjs` and its output in `scratchpad/events.txt`.

**Dead subscriptions (listened for, never emitted):**

| Event | Listener | Effect |
|---|---|---|
| `UI_TOGGLE_LAYERS` `ui:toggle:layers` | `editor/shell/hooks/useEditorEventListeners.ts:193` | Handler cannot fire |
| `SHOW_IN_LAYERS` `ui:show-in-layers` | `useEditorEventListeners.ts:146` | The "Show in Layers" tab-switch and scroll path is unreachable |
| `ZOOM_SELECTION` `zoom:selection` | `editor/canvas/Canvas.tsx:394` | Zoom-to-selection only works through the footer prop/⌘2 (`CanvasFooterToolbar.tsx:229`). The command-palette route is missing |
| literal `ui:toggle:templates` | `useComposerInit.ts:535` | The comment says "the ⌘⇧T command emits" it, but nothing emits it and it is not in `EVENTS` |
| `SELECTION_CHANGED` `selection:changed` | `canvas/hooks/useSelectionReadout.ts:36` (array) | Harmless; the other four events cover it |

**Emitted but unheard, where silence matters:**
- `ERROR` (`Composer.ts:425,603,623`): init, load and save failures.
- `STORAGE_ERROR` (`StorageAdapter.ts:51`).
- `COMMAND_ERROR` (`CommandCenter.ts:143,158`). This includes the **read-only refusal**, so a refused mutating command in view mode is silent.
- `PAGE_RECOVERED` / `RUNTIME_FAULT_CAUGHT` (`RecoveryManager.ts:101,140`).
- `ai:generate:started|failed|complete` (`designSystem/services/AIAssistService.ts:80-109`).
- `migration:skipped` (`MigrationManager.ts:30`).
- `PROJECT_SAVING` (`Composer.ts:616`).
- 104 constants in total are emitted with no listener. Most are informational: the collab, plugin, drag, form, interaction and guide families.

**Never referenced at all:** 79 `EVENTS` constants. Examples: `PROJECT_CLEARED`, `HISTORY_PUSH`, `HISTORY_CHANGED`, `HISTORY_CAPACITY_WARNING`, `STORAGE_SAVED`, `STORAGE_LOADED`, `NETWORK_ONLINE/OFFLINE`, `EXPORT_*`, and the whole `TIMELINE_*` and `AI_CONTENT_*` families.

**Typos:** none found. Every literal event outside `EVENTS` pairs an emitter with a listener, except the five rows above and the three `ai:generate:*` events.

**Fix:**
- Emit `SHOW_IN_LAYERS` from the canvas/context-menu "Show in Layers" action. Add a `zoom-selection` command that emits `ZOOM_SELECTION`. Delete the `ui:toggle:templates` and `UI_TOGGLE_LAYERS` listeners, or give them emitters.
- Add one shell listener that turns `ERROR`, `STORAGE_ERROR` and `COMMAND_ERROR` (read-only) into a toast.
- Delete the 79 dead constants.

### P2-11 · Dead code and CLAUDE.md violations (read, script-assisted)

- **Managers instantiated in `Composer` with zero use outside it**, counted by grep over `src/` (tests excluded):
  - `globalStyles` (GlobalStyleManager, 250+ LOC; it even calls `markDirty`, but its state is never exported)
  - `styleBindings`, `traitBindings`, `textBindings`
  - `darkResolver`, `cssBundler`
  - `plugins` (PluginManager, 346 LOC)
  - `forms` (FormHandler). Whether the published-site runtime uses it is UNVERIFIED.
  - `textBindings` is also missing from `destroy()` (`Composer.ts:1260-1284`), while it subscribes to `composer.data` in its constructor (`BaseBindingManager.ts:74-79`).
- `engine/history/index.ts` is a re-export-only barrel with no importer (a middle-man file).
- `HistoryManager.ts:11-14` points to a `HistoryCollaboration.ts` that does not exist.
- `Composer.destroy` emits `COMPOSER_DESTROY` a second time **after** `removeAllListeners()` (`:1300-1301`), so that emit is dead.
- **Public methods with no non-test caller:**
  - HistoryManager: `forceCheckpoint`, `getUndoCount`, `getRedoCount`, `getStats`, `resume`, `setMaxHistory`, `setCheckpointInterval`, `setCoalesceDelay`
  - VersionTimelineManager: `setConfig`, `setEnabled`, `getStats`
  - SelectionManager: `isSelected`, `selectParent`, `selectFirstChild`, `selectNextSibling`, `selectPrevSibling`, `getSelectedBounds`
  - Composer: `setProjectSettingsRaw`, `updateProjectMetadata`, `patchState`, `isPreviewMode`
  - ComponentManager: `getComponentsByCategory`, `setVariantProperties`, `addVariant`, `updateVariant`, `removeVariant`, `syncInstance`
  - DataManager: `getGlobalContext`, `setGlobalVariable`, `getGlobalVariable`, `bindVariable`
  - StyleEngine: `clearBreakpointStyles` (`StyleEngine.ts:305`)
  - RecoveryManager: `validateAllPages`, `validateSelection`
  - StorageAdapter: `getStorageQuota`
  - PageRouter: `getAllRoutes`
- `ComponentManager.updateComponent` (`:333-338`) is a pass-through alias of `updateComponentMetadata`, which CLAUDE.md §1 forbids. It has one caller (`ComponentDetailScreen.tsx:275`).
- `HistoryManager.recordForCollaboration` (`:300-331`) never increments `patchesSinceCheckpoint` or resets `lastActionRecorded`. It is collab-only, and collab is demo-only.

---

## Persistence coverage map (what save actually captures)

| State slice | In `exportProject` / server save | In undo snapshot | Notes |
|---|---|---|---|
| Pages, element tree, element attrs/styles/traits/animations/interactions/data bindings | yes | yes | Interactions and animations live on element data |
| StyleEngine rules (incl. breakpoint rules) | yes (`styles`) | yes | |
| Brand tokens / presets | yes (settings) | yes (`designTokens*`, `designPresets` only, PD-12) | `setTokens` is one labelled transaction |
| Other project settings (SEO, siteVariables, integrations) | yes | **no** (deliberate, PD-12) | |
| Project metadata | yes | no (deliberate) | `updateProjectMetadata` has no caller |
| CMS field/collection bindings | yes (`cmsBindings`) | yes | P1-7: bind may never dirty |
| CMS collections/items | separate (`useCmsSync`, IndexedDB + server) | no | Out of this audit's depth |
| Component masters | separate (IndexedDB + `useComponentSync` mirror) | no | P2-7 |
| Component instance links | yes (element `data.componentInstance`), rehydrated on load | yes | |
| Media library | separate (MediaManager + server) | no | Element `src` refs are in pages; `blob:` stripped on save |
| Site fonts | via media `siteFont` flag | no | |
| **Data sources (DataManager)** | **no** | **no** | **P1-6: lost on reload** |
| GlobalStyleManager styles | no | no | Dead manager |
| Active page | no | no (reset to the first page) | P1-3 |

**Dirty, autosave and conflict handling:**
- Autosave is the 1 s debounce in `useComposerInit.ts:590-827`. It covers conflict (`isSaveConflictPending`, `SaveConflictError`), `TOKENS_INVALID` hold, network, 401, 403, `PROJECT_NOT_LOADED` and `SITE_MISSING`. Saves are serialized by `_saveChain` (`BuildrikSyncProvider.ts:753-765`), and `changeSeq` guards against a stale "saved" announcement.
- The gaps are P1-4, P1-5, P1-7, P2-4 and P2-5.

## Mutation paths that bypass history, inventoried

- **Deliberately untracked:**
  - `runWithoutTracking` callers: media-delete src clear and the CMS bound-value write. Both leak into the next undo (P1-2).
  - Project settings and metadata (PD-12).
  - `adoptSavedProjectSettings`.
- **Accidentally untracked or not dirtied:**
  - DataManager (P1-6).
  - RecoveryManager root rebuild (P2-8).
  - Page operations: recorded, but they do not set the engine dirty flag (P2-4).
- **Wrongly merged into one step:** separate transactions within 500 ms (P2-1).
- **Recorded together, but correct:** `GlobalStyleManager.applyToElement` and `StyleEngine.setBreakpointStyles` / `GlobalStyleManager:163` `setData` mutate without `markDirty`, but always in the same tick as a sibling `markDirty`. The debounced record captures them, so this is not a bug.

## Not verified

- No finding was walked in the live app. P1-3, P1-4, P1-5 and P1-7 should be walked first.
- I did not check the server side for data sources (P1-6 fix) or for version snapshots containing secrets.
- CMS collection sync (`useCmsSync`, `cmsSync.ts`, outbox) and collaboration/OT were only skimmed. AGENTS.md already lists collab as demo-only.
