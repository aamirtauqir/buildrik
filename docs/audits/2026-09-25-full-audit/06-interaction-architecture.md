# 06 · Interaction Architecture (Prompt 6)

**Scope:** For each control I traced control → handler → state change → API or store → the UI that results. Controls covered: clicks, keyboard, context menus, toolbars, selection, drag and drop, destructive actions, undo/redo, async actions and collaboration actions. Code covered: `packages/editor` (engine and chrome), `packages/dashboard`, `server`, `prisma`. Agent C, READ-ONLY run, 2026-09-25.

---

## Method & runtime status

**What I ran**
- **Existing suites:** `pnpm --filter @buildrik/editor exec vitest run src/engine/commands src/engine/__tests__/undo-redo-live.integration.test.ts src/editor/sidebar/shared/__tests__/DrillInHeader.test.tsx` gave **9 files, 122 passed, 3 todo**. All green. None of these cover the defects below.
- **Scratchpad probes (no repo change):** 7 probes in 3 files under the session scratchpad (`…/scratchpad/probe/a06*.probe.test.ts`). They ran through a scratch vitest config that reuses the editor config, against a **real `Composer`** in jsdom, not a mock. **7 of 7 passed**, and each one asserts the defect is present:
  1. With a locked element selected by ⌘A, a real `keydown` Delete deletes it (A06-1).
  2. `history.undo()` after a settings save reverts `seo.metaTitle` and `publishing.publishedPassword`, the canvas is untouched, and the undo label is `undefined` (A06-2).
  3. An unrecorded metadata rename is reverted by undoing a later canvas edit (A06-14).
  4. `DrillInHeader`'s Escape goes back with no Composer, and does nothing once a Composer is mounted (A06-12).
  5. A local undo after `applyRemoteOperation` also removes the peer's element (A06-9a).
  6. A remote op arriving inside the 500 ms coalesce window erases the local uncommitted edit (A06-9b).

**NOT RUNTIME VERIFIED**
- **No browser and no DB.**
- **The server mirror in A06-2.** The `siteDetail.settings.update` write of the reverted values is proven by code, not observed.
- **Anything needing a live form submission, token or site (A06-3, A06-10, A06-11):** proven by code read.
- **A06-7:** the insert being dropped on the next `syncInstance` is shown only by code read.
- **Dashboard double-submits:** not clicked.
- **Canvas `<a href>` clicks:** whether a click on a link inside the canvas navigates the editor away is unverified. I found no anchor click guard in `editor/canvas`, but I did not confirm how the canvas serialiser renders `href`.

---

## Interaction trace table

| Interaction | Source | Handler | Actual | Expected | State/API | Issue | Priority |
|---|---|---|---|---|---|---|---|
| Del / Backspace on canvas | window keydown (capture) | `KeybindingManager.setup` → `CommandCenter.run("delete")` `defaultCommands.ts:75-98` | Deletes all top-most selected elements, **including locked elements and component instances** | Locked elements skipped | `elements.removeElement` → autosave | A06-1 | P1 |
| Del with canvas focused (lock-aware path) | `Canvas` wrapper `onKeyDown` | `useCanvasKeyboard.ts:122-222` | **Never reached**: returns on `e.defaultPrevented` (`:78`) because the registry already ran | One Delete implementation | — | A06-1 (dead guard) | P1 |
| Right-click → Delete / Cut on a locked element | `Canvas.handleContextMenu` `Canvas.tsx:627-652` | `editActions.ts:44-86, 124-160` | Selects the locked element (no lock check), then deletes or cuts it | Menu hides destructive rows for locked elements | `removeElement` | A06-1 | P1 |
| Right-click → Cut, then Paste | context menu | `editActions.ts` "cut" | Writes only the OS clipboard; `composer.clipboard` is unchanged. Paste says "Nothing to paste" or pastes an older copy | Cut fills the same clipboard that Copy fills (`:18-24`) | `composer.clipboard` | A06-5 | P2 |
| Layers lock icon | `LayerTreeItem` | `useLayerActions.toggleLock` `:148-168` | Toggles a **per-browser localStorage set**; ignores `element.data.locked` | One lock source | `localStorage` + `setLocked` | A06-4 | P2 |
| ⌘Z after saving a Settings screen | window keydown | `useEditorShortcuts.ts:156-158` → `HistoryManager.undo` | Reverts site SEO, password, head/body code, analytics and integrations. Toast: "Undo: last action". Autosave mirrors this to Site columns | Canvas undo does not reach saved site settings | `siteDetail.settings.update` | A06-2 | P1 |
| Toast "Undo" (page / element delete, cut) | toast action | `usePages.ts:286-298`, `useCanvasKeyboard.ts:160-170`, `editActions.ts:74-85`, `StudioPanels.tsx:379-395` | Undoes **whatever is newest**, not the action the toast names | Bound to that action, or disabled after a newer edit | `history.undo()` | A06-6 | P2 |
| Drag a block into a component instance | canvas drop | `dropOperations.tsx` / `findValidDropTargetWithFallback` | Allowed. The context menu forbids the same edit (`insertActions.ts:62-70`) | Same rule on every door | `pasteElement` | A06-7 | P2 |
| Version restore when the safety save fails | VersionHistoryPanel confirm | `useVersionHistory.ts:100-106` drops the `false` result | Toast "Restored to …" (success) while nothing was restored | Error toast | `VersionTimelineManager.restoreVersion` | A06-8 | P2 |
| Undo during live collab (flag off) | ⌘Z | `HistoryManager.undo` | Reverts peers' edits locally; peers diverge silently | Local undo scope | `applyRemoteOperation` | A06-9 | P2 (flagged) |
| Delete Submission | `submission-drawer.tsx:233-242` | `forms.deleteSubmission` | One click, no confirm, hard delete, primary styling, no `onError` | Confirm, danger styling, error feedback | `prisma.formSubmission.delete` | A06-3 | P1 |
| Create site → Start from Scratch | `create-site-modal.tsx:127` | `sites.create.mutate` (`quick-actions.tsx:65`, `projects/page.tsx:647`) | Rows stay clickable while pending, so a double click creates two sites | Disabled while pending | `sites.create` | A06-10 | P2 |
| Create site → Use a Template | same modal | two callers | Quick actions open `/dashboard/sites/new?method=template&name=…`; Projects opens `/dashboard/templates` and drops the name | One destination | router | A06-10 | P2 |
| API token Revoke | `api-tokens-tab.tsx:163-168` | `apiTokens.revoke` | One click, irreversible, no confirm | Confirm | server | A06-11 | P2 |
| Escape in a drill-in (Components detail, Templates) | document keydown | `DrillInHeader.tsx:94-112` | Dead: the registry's bare-Escape `deselect` (`defaultCommands.ts:389-394`) calls `preventDefault` first | Escape goes back | — | A06-12 | P3 |
| ⌘S | window keydown ×2 | registry `save` (`defaultCommands.ts:69-74`) **and** `useEditorShortcuts.ts:135-138` | Two saves. The engine one emits `PROJECT_SAVED` before the server save resolves. In view mode the shell ⌘S and ⌘Z bypass the read-only gate | One owner; gated | `storage.save` + `sites.saveProject` | A06-13 | P3 |
| Publish double click | Topbar / PublishTab | `usePublishJob.publish` `:180-215` | Guard is armed only after the first `await`, so the second call gets `ALREADY_PUBLISHING`, shown as an error over a running job | In-flight guard | `sites.publish` | A06-15 | P3 |
| CMS record Delete | `ContentViews.tsx:467-485` (confirm) → `ContentTab.tsx:282-290` | `deleteRecord` | Confirmed ✔. A failure is an unhandled rejection with no feedback | Error state | IndexedDB | A06-15 | P3 |
| Page delete | `PagesTab.tsx:155-163, 360-376` | `usePages.deletePage` | Guarded (home and last page), confirm, one undo step ✔ | — | autosave | Good | — |
| Team remove / revoke | `members-table.tsx:182-241` | confirm → `team.delete` | Confirm on single and bulk ✔ | — | — | Good | — |
| Save conflict | `ConflictModal.tsx` | Reload / Backup / Overwrite (two-step) | ✔ Overwrite needs a second click | — | `SAVE_CONFLICT` | Good | — |

---

## Findings

### P0 — IMMEDIATE FIX REQUIRED

None in this concern. A04-1 (Delete on the hidden canvas under full-page surfaces) is still open and belongs to Prompt 4. A06-1 shares its root cause: a single keyboard gateway that knows nothing about lock state or surface ownership.

A06-9 is P2 **only because `FEATURE_COLLAB` is off in production**. It becomes P0 (collaborative data loss) the moment collab is enabled.

### P1

#### A06-1 · Locked elements can be deleted and cut. The one lock-aware delete path is dead code.
- **Severity:** P1
- **File:line:**
  - `packages/editor/src/engine/commands/defaultCommands.ts:75-98` (delete), `:174-192` (cut)
  - `engine/commands/CommandCenter.ts:59-64, 72-81`
  - `engine/elements/manager/ElementCRUD.ts:90-103`
  - `engine/SelectionManager.ts:225-248`
  - `editor/canvas/hooks/useCanvasKeyboard.ts:78, 132-146`
  - `editor/canvas/Canvas.tsx:627-652`
  - `editor/canvas/menus/actions/editActions.ts:44-86, 124-160`
  - `editor/canvas/controls/UnifiedSelectionToolbar.tsx:196-215`
  - `editor/canvas/hooks/useCanvasToolbarActions.ts:62-69`
  - `editor/panels/layers/hooks/useLayerActions.ts:208-216`
  - `editor/panels/layers/index.tsx:329-337`
- **Symbol:** `buildDefaultCommands` → `delete` / `cut`, `ElementCRUD.removeElement`, `SelectionManager.selectAll`, `useCanvasKeyboard.handleKeyDown`
- **Evidence:**
  - **Lock only blocks a left click.** Selection by left click refuses a locked element and says "This element is locked. Unlock it in the Layers panel." (`useSelectionBehavior.ts:88,106,134`). Every other route selects it:
    - `selectAll()` collects every non-root element with no lock filter;
    - a Layers row click;
    - Tab cycling;
    - right-click: `Canvas.handleContextMenu` calls `select(el)` with no lock check.
  - **The registry ignores lock.** Its `delete` and `cut` remove `topMost(getAllSelected())` with no lock check, and `removeElement` has none either; its only guard is the page root.
  - **The only filter that exists is unreachable.** `useCanvasKeyboard.ts:132-146` filters out `isLocked()` and `isComponentInstance()`, but returns early at `:78` on `e.defaultPrevented`. The registry listener runs in the capture phase on window and has already called `preventDefault`.
  - **Every other delete door skips the lock:** the toolbar, context-menu Delete/Cut, the Layers row and the Layers banner.
  - **Probe:** add a heading, `setLocked(true)`, `selection.selectAll()`, then dispatch a real `keydown` Delete on `document.body`. The locked heading is gone and the page has 0 children. PASS, meaning the defect is confirmed.
- **Expected:** Lock (and the component-instance rule) is enforced once, in the engine: in `removeElement`, or in the delete and cut commands plus `selectAll`. Every door then inherits it, and destructive context-menu rows are hidden for locked targets.
- **Root cause:**
  - There are 8 delete implementations. The keyboard one is chosen by listener phase, not by intent.
  - Lock is a UI convention enforced at the click site, not an engine invariant.
- **Affected modules:** Canvas, Layers, Inspector toolbar, the ⌘K and ⌘⇧P palettes, and autosave, which persists the delete within about 1 s.
- **Recommendation:**
  - Enforce lock in the engine.
  - Delete the dead branch in `useCanvasKeyboard`, or make it the single path.
  - Filter `selectAll`, or keep locked elements selectable but not mutable.
  - Undo recovers the element, so this is not P0.
- **Status:** VERIFIED (engine probe). The browser path is NOT RUNTIME VERIFIED.

#### A06-2 · Canvas ⌘Z silently reverts saved site-level settings, and autosave writes the old values to the server
- **Severity:** P1
- **File:line:**
  - `engine/Composer.ts:669-693` (`exportProject` includes `settings`), `:834-853` (`setProjectSettings` → `PROJECT_CHANGED`), `:634-636` (import re-applies settings)
  - `engine/HistoryManager.ts:93-127, 459-513`
  - `editor/sidebar/tabs/settings/SettingsTab.tsx:420-446`
  - `screens/SeoScreen.tsx:171-189`, and the same flush pattern in `AdvancedScreen.tsx:211-225`, `AnalyticsScreen.tsx:259-281`, `SiteSettingsScreen.tsx:176`, `LocalizationScreen.tsx:150`, `DesignSystemTab.tsx:554`
  - `services/BuildrikSyncProvider.ts:137-156, 398-441`
  - `editor/shell/hooks/useHistoryFeedback.ts:123-125`
- **Symbol:** `Composer.setProjectSettings`, `HistoryManager.undo`, `extractSiteColumnPatch`, `saveProject`
- **Evidence:**
  - **How it happens:**
    - Saving a Settings screen flushes its buffer into `composer.setProjectSettings(...)`.
    - That emits `PROJECT_CHANGED`, which `HistoryManager` records as an ordinary undo step with no transaction label.
    - The undo snapshot is the whole `exportProject()`, including `settings`.
    - Back on the canvas, the next ⌘Z pops that step. `restoreSnapshot` → `importProject` re-applies the old settings.
  - **What the user sees:**
    - The toast reads "Undo: last action", because the label is `undefined` (`useHistoryFeedback.ts:123-125`).
    - Nothing on the canvas changes.
  - **What reaches the server:** the next autosave runs `extractSiteColumnPatch`, which mirrors these into `siteDetail.settings.update`:
    - `seo.metaTitle`, `metaDescription`, `ogImage`, `robotsTxt`, `allowIndexing`
    - `customCode.headScripts` / `bodyScripts`
    - `publishing.publishedPassword`
    - `seo.siteName` → `Site.name`
  - **Probe:**
    - `setProjectSettings({seo:{metaTitle:"NEW TITLE"}, publishing:{publishedPassword:"s3cret"}})`, advance 550 ms, then `history.undo()`.
    - Result: both values are `undefined` again, the canvas child count is unchanged, and the undo label is `[undefined]`. PASS, meaning the defect is confirmed.
- **Expected:**
  - Site-level settings persist through their own save (they do: `siteDetail.settings.update`) and are **outside** the canvas undo scope.
  - Or, at minimum, the step is labelled "Changed site settings" and undo refuses it while the user is on the canvas.
- **Root cause:** The undo scope is the whole `ProjectData`, and site settings are stored in it (the `projectSettings` blob). The same state has two sources of truth: `Site` columns and `projectSettings`, overlapping A02-1.
- **Affected modules:** Settings (SEO, General, Custom code, Analytics, Localization, Advanced), Brand (design tokens also flow through `setProjectSettings`), History, autosave, publish (reads the Site columns).
- **Recommendation:**
  - Run settings flushes through `history.runWithoutTracking`, or exclude `settings` from history snapshots.
  - Pair this with the A02-1 fix, which removes the settings mirror from autosave.
  - Design-token edits stay undoable, but need their own label.
- **Status:** VERIFIED for the engine revert (probe). PARTIAL for the server write-back (code read only).

#### A06-3 · "Delete Submission" hard-deletes a customer's form submission in one unconfirmed, primary-styled click, with no error feedback
- **Severity:** P1
- **File:line:**
  - `packages/dashboard/components/site-detail/submission-drawer.tsx:233-242`
  - `components/site-detail/submissions-panel.tsx:48-54, 66-71`
  - `server/trpc/routers/forms.ts:41-51`
  - `server/services/form-submission.service.ts:118-120`
- **Symbol:** `SubmissionDrawer` delete button, `handleDrawerDelete`, `deleteSubmission`
- **Evidence:**
  - `<Button onClick={() => onDelete(submission.id)}>` uses the default (primary) variant, has no confirm, and calls straight through to `prisma.formSubmission.delete`. That is a hard delete with no archive or restore.
  - The mutation has `onSuccess` only. A failure closes nothing and says nothing.
  - The same drawer already offers the non-destructive "Archived" toggle (`:223-228`).
- **Expected:** A confirm ("Delete this submission permanently?"), danger styling, an error toast, and ideally soft delete.
- **Root cause:** The destructive action was built without the `ConfirmDialog` pattern used elsewhere (team, media, CMS record, page).
- **Affected modules:** Dashboard site-detail Submissions. Lead data is irrecoverable.
- **Recommendation:** Add a confirm and the danger variant. Consider routing the delete through `isArchived` and purging later.
- **Status:** VERIFIED (code). NOT RUNTIME VERIFIED.

### P2

#### A06-4 · Two sources of truth for "locked": the Layers panel's per-browser set, and the element's persisted flag
- **File:line:**
  - `editor/panels/layers/hooks/useLayerActions.ts:53, 70-95, 115-119, 148-168`
  - `panels/layers/hooks/useLayersState.ts:150`
  - `canvas/menus/actions/standaloneActions.ts:161-184`
  - `engine/elements/ElementSerialization.ts:140-142`
- **Evidence:**
  - **The Layers panel keeps its own set.**
    - The icon reads `lockedIds` (useState, persisted to `localStorage` per page).
    - `toggleLock` computes `isNowLocked = !prev.has(id)` from that set, then calls `element.setLocked(...)`.
  - **The canvas context menu uses the element flag.** Lock and Unlock read and write `element.data.locked`, which is persisted with the project.
  - **Consequences:**
    - An element locked from the canvas shows **unlocked** in Layers. The toast still tells the user to "Unlock it in the Layers panel", and the first Layers click is a no-op (`setLocked(true)` again).
    - An element unlocked from the canvas is **re-locked** on the next Layers hydrate, because `hydrateFromStorage` only ever calls `setLocked(true)`.
    - Locks set in Layers live in one browser's `localStorage`. A teammate, or the same user on another device, gets the element flag, not the Layers state.
    - Layers lock changes are not wrapped in a transaction.
- **Expected:** `element.data.locked` is the only lock state, and Layers derives from it.
- **Recommendation:** Drop `lockedIds` persistence and read `element.isLocked()`.
- **Status:** VERIFIED (code).

#### A06-5 · Right-click Cut does not fill the in-app clipboard, so Cut → Paste pastes nothing or a stale copy
- **File:line:** `editor/canvas/menus/actions/editActions.ts:18-24` (Copy sets `composer.clipboard`), `:44-86` (Cut does not), `:88-110` (Paste reads `composer.clipboard`)
- **Evidence:**
  - Copy's own comment says "Populate the in-app clipboard … Without this, copy→paste from the right-click menu silently did nothing". Cut was never given the same fix.
  - Cut removes the element and writes only `navigator.clipboard`.
  - Paste runs `commands.run("paste")`, which reads `composer.clipboard`: it shows "Nothing to paste" or re-pastes an earlier ⌘C.
  - The context menu's Cut also bypasses the registry `cut` (which handles multi-selection and the clipboard) and uses the `context-cut` label, which is missing from `ACTION_DESCRIPTIONS`, so its undo toast reads "Context Cut".
- **Expected:** Right-click Cut runs `commands.run("cut")`.
- **Status:** VERIFIED (code).

#### A06-6 · Toast "Undo" buttons are not bound to the action they announce
- **File:line:**
  - `sidebar/tabs/pages/usePages.ts:286-298` (8 s)
  - `canvas/hooks/useCanvasKeyboard.ts:160-170, 196-215`
  - `canvas/menus/actions/editActions.ts:74-85, 150-160`
  - `canvas/controls/UnifiedSelectionToolbar.tsx:209-214`
  - `shell/StudioPanels.tsx:379-395`
  - `shell/hooks/useHistoryFeedback.ts:147-165, 238-245`
- **Evidence:**
  - Every action calls `composer.history.undo()`, which pops the **newest** stack entry.
  - Deleting a page shows `"About" deleted · Undo` for 8 s. If the user edits a heading within that window, the toast's Undo reverts the heading edit and leaves the page deleted.
  - `StudioPanels.handleDelete` calls `removeElement` with **no transaction**. The deletion can therefore coalesce with a preceding edit (500 ms window), so one Undo reverts both.
- **Expected:** Capture the stack depth or entry id when the toast is raised. Undo to that entry (`restoreEntry`) or disable the action once a newer entry exists.
- **Status:** VERIFIED (code).

#### A06-7 · Structural edits inside component instances are blocked in the context menu but allowed through drag-drop, Add-panel insert and paste
- **File:line:**
  - `canvas/menus/actions/insertActions.ts:62-70, 83-91`
  - `shared/utils/dragDrop/dropTarget.ts:148` (no instance or lock check)
  - `canvas/hooks/drag/dropOperations.tsx:191-215, 396-490`
  - `shell/hooks/useBlockInsertion.ts:23`
  - `engine/commands/defaultCommands.ts:193-268` (paste targets the selection)
  - `engine/components/ComponentInstances.ts:241-300`
- **Evidence:**
  - The context menu hides "Insert inside" for instances because "structural inserts inside an instance subtree are discarded by the next syncInstance".
  - `syncInstance` removes the instance subtree, re-clones the master and re-applies only position-keyed overrides. Children the user dropped in are gone after the next master update.
  - Drop-target resolution, click-insert and paste apply no instance or lock rule.
- **Expected:** One structural-edit predicate (`canAcceptStructuralChild`) shared by every insert door. The rejection shows "Detach instance to add content".
- **Status:** PARTIAL. The door inconsistency is verified in code; the loss on sync is by code read only.

#### A06-8 · A failed version restore is announced as a success
- **File:line:** `engine/VersionTimelineManager.ts:276-316`, `shared/hooks/useVersionHistory.ts:100-106`, `editor/panels/VersionHistoryPanel.tsx:207-220`
- **Evidence:**
  - `restoreVersion` returns `false`, without throwing, when the version is missing or the safety "Before restoring…" save fails. In the second case it also emits `VERSION_LOAD_FAILED`.
  - The hook `await`s it and discards the boolean. `handleRestoreConfirm` then shows `Restored to <time>` (success), and `onLoadFailed` flips the panel into its load-error state.
  - The user is told the canvas was restored when it was not. No data is lost, because the restore aborts safely.
- **Expected:** Propagate the boolean and toast "Couldn't restore — your current work was not saved as a version, so nothing changed."
- **Status:** VERIFIED (code).

#### A06-9 · Collaboration: local undo removes peers' edits, and a remote op erases a local edit that is not yet recorded (feature-flagged off)
- **File:line:** `engine/HistoryManager.ts:242-252` (record + broadcast), `:332-350` (`applyRemoteOperation`), `:459-513` (`undo` rebuilds from the local stack only)
- **Evidence:**
  - **(a) Undo reverts peers' edits.**
    - A remote op updates `currentStateCache` but is never pushed onto `undoStack`.
    - `undo()` rebuilds `reconstructState(undoStack.length-1)` from local entries only, so the peer's change vanishes locally and no op is broadcast for the undo.
    - Probe: add my heading, apply a peer paragraph patch, undo. The result is `[]`, with the peer paragraph gone.
  - **(b) A remote op erases an uncommitted local edit.**
    - `applyRemoteOperation` patches `currentStateCache`, which excludes an edit still inside the 500 ms coalesce window, then calls `importProject`.
    - Probe: add a heading, advance 10 ms, apply the remote patch. The result is `["paragraph"]`, with my heading gone.
  - **(c) No feedback in either case.** No toast and no presence cue.
  - The engine's own `AGENTS.md` lists these as known. The probes add runtime proof.
- **Severity:** P2 while `FEATURE_COLLAB` is off (`runtimeEnv.ts`). **P0 if enabled.**
- **Recommendation:** Hand to Agent D. The fix needs a collaboration-aware history (per-client undo via inverse ops) and `flushPending()` before any remote apply.
- **Status:** VERIFIED (engine probes). The UI and the SSE path are NOT RUNTIME VERIFIED.

#### A06-10 · Create-site modal: double-submit, and the same row goes to two different places
- **File:line:**
  - `components/sites/create-site-modal.tsx:103, 107, 127`
  - `components/dashboard/quick-actions.tsx:27-35, 60-72`
  - `app/dashboard/projects/page.tsx:148-155, 642-656`
- **Evidence:**
  - **Double-submit.** The option rows are plain `<button onClick>` with no `disabled` tied to `createMutation.isPending`, and the modal gets no pending prop. "Start from Scratch" can fire `sites.create` twice, creating two sites and using two plan slots.
  - **"Taken" does not block.** A slug shown as "Taken" does not stop submission.
  - **Two destinations.** "Use a Template" goes to `/dashboard/sites/new?method=template&name=…` from quick actions, but to `/dashboard/templates` from Projects, where the typed name is dropped.
  - **Two post-create behaviours.** A blank site navigates to the site detail from quick actions, but stays on the list from Projects.
- **Expected:** One `onSubmit` owner, with pending-disabled rows and one destination per method.
- **Status:** VERIFIED (code). NOT RUNTIME VERIFIED.

#### A06-11 · Irreversible dashboard actions with no confirmation
- **File:line:**
  - `components/settings/api-tokens-tab.tsx:163-168` (Revoke)
  - `components/settings/integrations-content.tsx:328-334` (Disconnect)
  - `components/site-detail/access-tab.tsx:179` (revoke share link; trash icon tinted primary blue)
  - `components/site-detail/redirects-tab.tsx:94` (delete redirect)
- **Evidence:**
  - Each is a single `onClick → mutate` with no confirm.
  - A token revoke immediately breaks whatever integration uses the token, and cannot be undone.
  - After a revoke, the row's button becomes "Delete" in the same spot.
  - Compare: team removal (`members-table.tsx:182-241`), domain removal (`domains-tab.tsx:189`), unpublish (`site-header.tsx:193`) and media delete (`media-library.tsx:448, 510`) all confirm.
- **Severity:** P2 for the token revoke. The other three are P3 and are grouped here.
- **Status:** VERIFIED (code).

### P3

#### A06-12 · Escape in `DrillInHeader` screens never goes back while the editor is mounted
- **File:line:** `sidebar/shared/DrillInHeader.tsx:94-112`, `engine/commands/defaultCommands.ts:389-394`, `CommandCenter.ts:72-81`
- **Evidence:**
  - The registry binds bare `escape` to `deselect`. The capture-phase listener's bare-key guard only skips inputs and widget roles, and the back button that DrillInHeader focuses is neither. So the registry calls `preventDefault()`.
  - DrillInHeader's document-level handler requires `!e.defaultPrevented`, so it never fires.
  - Probe: with no Composer, Escape calls `onBack` once. With a real Composer mounted, it calls it 0 times.
  - Affects `ComponentDetailScreen` and `TemplatesTab`.
- **Status:** VERIFIED (probe).

#### A06-13 · ⌘S is handled twice, and the shell's ⌘S and ⌘Z skip the read-only gate
- **File:line:** `engine/commands/defaultCommands.ts:69-74`, `shell/hooks/useEditorShortcuts.ts:135-138, 151-162`, `engine/Composer.ts:556-570`, `CommandCenter.ts:117-131`
- **Evidence:**
  - **Two handlers.** The registry `save` (capture) runs `composer.saveProject()`: an engine storage write plus `markSaved`, which emits `PROJECT_SAVED` and clears the page dirty dots. The shell hook, which does not check `defaultPrevented`, then runs the server save. The engine one can report "saved" when the server save conflicts or fails.
  - **View mode.** The registry refuses `save`, `undo` and `redo`, but the shell hook calls `saveProject()` and `composer.history.undo()` directly. The read-only gateway is therefore not the only gateway. This contradicts the claim at `CommandCenter.ts:117-124` that "every caller funnels through run()".
  - **Low impact.** A fresh view-mode load has an empty undo stack. The ⌘S server write re-sends the unchanged project, but with A02-1 that can still overwrite dashboard settings.
- **Status:** VERIFIED (code).

#### A06-14 · Undoing a canvas edit also reverts an unrecorded project rename or author change
- **File:line:** `sidebar/tabs/settings/screens/SiteSettingsScreen.tsx:198`, `engine/Composer.ts:872-881` (`updateProjectMetadata` marks dirty and does not record), `:640-642` (import merges snapshot metadata)
- **Evidence:** Probe: add a heading, `updateProjectMetadata({name:"Renamed"})`, add a paragraph, undo. The paragraph is gone **and** the name is no longer "Renamed".
- **Status:** VERIFIED (probe).

#### A06-15 · Async actions with no in-flight guard or failure feedback (editor)
- **File:line:** `shell/hooks/usePublishJob.ts:180-215`, `sidebar/tabs/content/ContentTab.tsx:282-290`
- **Evidence:**
  - **Publish.** The `publish` guard only checks `jobId`, which is set **after** `await publishSite`. A second click inside that window reaches the server, gets `ALREADY_PUBLISHING`, and `setError` shows a failure over a job that is running. The server precheck (`publish.service.ts:198-207`) prevents a real double job.
  - **CMS record delete.** `void panel.deleteRecord(...).then(...)` has no `catch`.
- **Status:** VERIFIED (code).

---

## Good as-is

- **Read-only gateway.** `CommandCenter.run` refuses mutating commands, and chords are gated separately (`CommandCenter.ts:117-131, 44-81`). The only gap is the shell hook (A06-13).
- **Text-owned chords.** ⌘A, ⌘X, ⌘C, ⌘V and ⌘Z yield to text entry (`TEXT_OWNED_COMMANDS`). An open aria-modal dialog blocks mod chords.
- **Undo and pending edits.** `undo()` and `redo()` flush the pending coalesced edit first. The live integration test covers this.
- **Multi-element commands.** Delete, cut, copy and duplicate prune to top-most elements and run in one transaction. Paste plans legal targets before opening a transaction.
- **Page delete.** The home and last-page guards are right, both single and bulk delete confirm, and the copy is honest about undo.
- **Version restore.** It creates a safety version before `importProject` (`VersionTimelineManager.ts:283-299`).
- **ConflictModal.** Overwrite takes two steps, and "Save a backup" runs before reload.
- **Confirms that are consistent:** team removal (single and bulk), domain removal, unpublish, dashboard media delete, and CMS record and field delete.
- **Send for Review.** It snapshots the **local** composer, not the stale server copy (`SendForReview.tsx:99-116`).

## Product decisions required

1. **Undo scope.** Should canvas undo cover site-level settings and design tokens at all? Recommended: element tree plus tokens. Site settings outside (A06-2).
2. **Lock semantics.** Should a locked element be "cannot be selected", or "can be selected but not mutated"? This decides whether `selectAll` filters it (A06-1).
3. **Form submissions.** Should they be soft-deleted, with archive plus purge, instead of hard-deleted (A06-3)?
4. **"Use a Template" destination** from Create Site: the onboarding flow or the templates gallery (A06-10)?

## Overlaps with other audits

- **Agent B (Prompt 4):**
  - A04-1 (Delete deletes the hidden canvas selection under full-page surfaces) has the same root cause as A06-1: one window-capture keymap that knows nothing about surfaces or lock state. Fix them together.
  - A04-2 and A04-8 (bare-letter shortcuts and ⇧A bypass guards): ⇧A is bound twice (`useEditorShortcuts.ts:129-133` and `useSidebarKeyboard.ts:37`). Both are idempotent, but it is one more reason for a single shortcut registry.
- **Agent B (Prompt 2):** A02-1 (autosave overwrites dashboard settings) is the persistence half of A06-2.
- **Agent D (Prompts 7 and 16):** A06-9 probes (a) and (b) are ready-made regression tests. The inventory's `resync` and permission-recheck items are not re-audited here.
- **Agent C (Prompt 12, states):** silent failures in A06-3, A06-8 and A06-15.
- **Agent C (Prompt 13, accessibility):** `useCanvasKeyboard` takes Tab to cycle elements (`:98-113`), so keyboard users can only leave the canvas with F6.
- **Agent C (Prompt 8, signifiers):** the share-link revoke uses a primary-blue trash icon (`access-tab.tsx:179`), and "Delete Submission" is styled as a primary button.
- **Agent G (tests):** No test covers:
  - lock versus any delete door;
  - settings versus undo;
  - context-menu Cut → Paste;
  - toast-Undo target;
  - the restore failure path.
  
  The `CommandCenter` tests use a mock composer, so none of the A06-1 routes are exercised.

---

## AUDIT HANDOFF

- **Agent / Prompt:** C (Interaction & UX), Prompt 6: Interaction Architecture.
- **Report:** `docs/audits/2026-09-25-full-audit/06-interaction-architecture.md`
- **Counts:** P0 = 0 · P1 = 3 · P2 = 8 · P3 = 4
- **P0:** none. A06-9 becomes P0 if `FEATURE_COLLAB` is enabled.
- **P1:**
  - **A06-1:** locked elements can be deleted or cut through Delete/Backspace, ⌘A, the right-click menu, the toolbar and Layers. The one lock-aware guard is dead code.
  - **A06-2:** canvas ⌘Z silently reverts saved site settings (SEO, password, head code…), and autosave mirrors the old values to the server.
  - **A06-3:** "Delete Submission" hard-deletes in one unconfirmed click.
- **Runtime verified:**
  - 7 scratchpad probes against a real `Composer`, all confirming defects: A06-1, A06-2, A06-9a, A06-9b, A06-12, A06-14.
  - Existing suites: 9 files, 122 tests passing.
- **NOT RUNTIME VERIFIED:**
  - browser paths for every finding;
  - the A06-2 server write-back;
  - A06-3, A06-10 and A06-11 (dashboard, no DB);
  - A06-7 loss on sync;
  - canvas `<a href>` click navigation.
- **Dependencies:**
  - A06-1 and A04-1 share one fix: an engine-level mutability guard plus a surface-aware keymap.
  - A06-2 should land with A02-1.
  - A06-6 depends on history entry ids (`restoreEntry` already exists).
  - A06-9 depends on Agent D's collab-history design.
  - A06-5 and A06-13 are folded into "one owner per command": route context-menu Cut and the shell ⌘S/⌘Z through `commands.run`.
- **Inventory corrections:**
  - "Undo: `engine/HistoryManager`" is incomplete. The undo scope is the whole `ProjectData`, including `settings` and CMS bindings, and it is not limited to the element tree.
  - Lock state has two stores: Layers `localStorage` and `element.data.locked`.
  - The editor has **8** element-delete implementations, not one command.
- **Suggested next owners:**
  - **G:** browser walk: Layers-select a locked element, then press Delete; save SEO, then ⌘Z on the canvas.
  - **F:** none.
  - **D:** A06-9.
  - **E:** consolidate the delete, cut and save paths into the command registry.
