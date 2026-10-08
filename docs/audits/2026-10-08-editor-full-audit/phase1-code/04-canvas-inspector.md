# Audit 04: the core editing loop (canvas, inspector, layers, Add, shell shortcuts, rail)

Date: 2026-10-08 · Mode: READ-ONLY (no edits, no stash) · Base: working tree at `44f5db956`
Paths are relative to `packages/editor/src/` unless noted.

## 0. Test results

Command: `npx vitest run src/editor/canvas src/editor/inspector src/editor/panels src/editor/sidebar/tabs/build src/editor/rail src/blocks`

| Run | Files | Tests | Notes |
|---|---|---|---|
| Full scoped run | 244 pass, 9 fail of 253 | 2274 pass, 11 fail, 1 todo of 2286 | **All 11 failures were timeouts** (`Test timed out in 15000ms`, one at 120000ms). None were assertion failures. Machine load average was about 450 (other agents were running). |
| Re-run of 8 of the failing files with `--testTimeout=300000` | 8/8 pass | 151/151 pass | |
| `AddAnimation.test.tsx` run alone | 1/1 pass | 3/3 pass | |

**Verdict: green. No functional test failures.** Under parallel load the default 15s timeout is too short. That is an infra issue, not a product one.

Tests do not cover the findings below. The lock and breakpoint bypasses happen on paths that no test exercises.

---

## 1. What is solidly wired

These were verified by reading the code.

- **One element-action registry** (`editor/shared/elementActions.ts`). Inspector ⋯, canvas right-click / ⋯ More, the selection toolbar (`canvas/hooks/useCanvasToolbarActions.ts`) and the keyboard all run engine commands for duplicate, delete, copy-style, paste-style, reset-style, lock and unlock. `canvas/hooks/useCanvasKeyboard.ts:131-149` defers Delete to `commands.run("delete")`. It skips anything the capture-phase registry already handled (`e.defaultPrevented`, :73).
- **Engine `delete` / `cut` / `duplicate` / `copy`** (`engine/commands/defaultCommands.ts:88-305`) prune to top-most, filter locked elements and instances, run as one transaction, and ask for confirmation when N > 1 (`UI_REQUEST_DELETE_SELECTION` → `canvas/DeleteSelectionConfirm.tsx`, mounted at `Canvas.tsx:845`).
- **Inspector style writes** (`inspector/hooks/useStyleHandlers.ts`) are aware of breakpoints (`setBreakpointStyle` when not desktop, :279-287) and of pseudo-states (`styles.setRule` with a media query). Multi-select is one transaction. The lock gate goes through `canWrite` / `writableElements`. Pending debounced writes are flushed on selection, breakpoint or pseudo change (:136). Discrete actions get their own undo step through `runDiscrete`. `--hide-*` is pinned to the base layer (:252).
- **Inspector section writes** (FormFields, Progress, Source, Slides) go through `writeElement` / `writableElements`.
- **Selection sync.** Layers subscribes to the engine selection events (`panels/layers/hooks/useLayerSelection.ts:46-64`) and writes back through `composer.selection.*`. Canvas right-click keeps an existing multi-selection (`Canvas.tsx:700-704`). The Inspector gets `currentBreakpoint={device}` (`shell/StudioPanels.tsx:977`).
- **Click-to-insert** (`shell/hooks/useBlockInsertion.ts`) uses one transaction, smart placement up the ancestor chain, selects the new element, and shows a toast with Undo. Drag-drop moves and inserts (`canvas/hooks/drag/dropOperations.tsx`) are wrapped in transactions with rollback.
- **Inline text edit** (`canvas/hooks/useCanvasInlineEdit.ts`) goes through the lock gate (:86), sanitizes on commit, runs one transaction, and Escape reverts.
- **Context-menu rows in `canvas/menus/actions/*`** all have real handlers. No `onClick={() => {}}` stubs in scope, except intentional `aria-disabled` rows with a tooltip (viewer restore, save-version disabled), which are fine.
- **Every rail tab routes.** Templates, Design and Settings go through `sidebar/FullPageRouter.tsx`. The rest go through `sidebar/TabRouter.tsx`.

---

## 2. Findings

### P1-1 Layers single-row Delete and Cut skip the lock and instance gate

- **Where:** `panels/layers/hooks/useLayerActions.ts:298-307` (`deleteLayer` calls `composer.elements.removeElement(id)` directly). It is reached from `panels/layers/hooks/useLayerContextActions.ts:123-138` (delete when `!multi`) and `:68-77` (cut when `!multi`).
- **Trace:** Layers row ⋯ / right-click → Delete → `act("delete")` → `deleteLayer` → `ElementCRUD.removeElement` (`engine/elements/manager/ElementCRUD.ts:96`). `removeElement` only refuses the page root. It has no lock check.
- **Root cause:** a second delete implementation. The engine `delete` command (`defaultCommands.ts:99-121`) runs `dropLockedAndInstances` before it removes anything. The multi-row path uses that command; the single-row path does not. The same panel's keyboard Delete (`LayerTreeItem.tsx:159-167`) does run the command, so in the same panel the keyboard refuses while the menu deletes. Single-row Cut has the same gap. The canvas Cut was fixed for exactly this in `canvas/menus/actions/editActions.ts:56-68` ("Follow-up to A-5").
- **Expected:** deleting or cutting a locked element, or a component-instance child, from Layers is refused with the "locked" toast, as on the canvas.
- **Fix:** in `useLayerContextActions`, select the row (`composer.selection.select(el)`) and then run `composer.commands.run("delete")` / `"cut"` in both branches. Delete `deleteLayer`. The engine command already shows Undo through `useHistoryFeedback`, so drop the hand-made toast at :132-137. AGENTS.md calls a re-implemented registry action "a defect".
- **Live:** UNVERIFIED (code trace only).

### P1-2 Canvas resize handles and spacing spots write base (desktop) styles at every breakpoint

- **Where:**
  - Resize: `engine/canvas/resize/DOMUpdater.ts:106-145` (`applyBoundsToModel` → `element.setStyle("width"|"height"|"left"|"top"|"transform")`). It is called from `engine/canvas/ResizeHandler.ts:246` (keyboard resize) and `:365` (finishResize). Handles are shown for any unlocked selection at any device (`canvas/overlays/SelectionBoxOverlay.tsx:468`).
  - Spacing spot: `canvas/spots/CanvasSpotSpacing.tsx:39-49`. `CanvasOverlayGroup.tsx:247-252` passes no `onUpdate`, so the fallback `element.setStyle(...)` always runs.
  - Keyboard nudge: `canvas/hooks/keyboard/keyboardHelpers.ts:92-116` (`moveElementPosition` reads and writes base `top`/`left`).
- **Trace:** device = Tablet → user drags a resize handle → `ResizeHandler.finishResize` → `applyBoundsToModel` → base `width` changes → desktop layout changes too.
- **Root cause:** none of the three canvas-direct manipulation paths knows the active breakpoint. Only the Inspector path (`useStyleHandlers.writeOne`) routes to `styles.setBreakpointStyle`.
- **Expected:** a canvas edit made on Tablet or Mobile writes that breakpoint's override, the same as the Inspector does.
- **Fix:** add one engine helper, e.g. `writeStyle(composer, el, props, breakpoint)` next to `writeElement` in `engine/commands/commandOperations.ts`. It should do the lock check, the transaction, and the desktop-vs-`setBreakpointStyle` branch. Call it from `applyBoundsToModel`, `moveElementPosition` and `CanvasSpotSpacing`. Resize needs the current device; the canvas already has it as the `device` prop. Then `useStyleHandlers.writeOne` can reuse the same helper.
- **Live:** UNVERIFIED. Recommended check: switch to Tablet, resize an element, switch back to Desktop and read `getComputedStyle(el).width`.

### P1-3 Lock bypasses on canvas paths (drag-move, unwrap, replace-with-block, spacing spot, nudge)

`writeElement` / `canWrite` is the documented single lock gate (`engine/AGENTS.md:19`). These canvas paths write without it.

| Path | file:line | Effect on a locked element |
|---|---|---|
| Drag-move | `canvas/hooks/useCanvasElementDrag.ts:138-157` (`draggable = true` for any non-root), `canvas/hooks/drag/dropOperations.tsx:224-235` (`moveElement`, no check) | Moved. Plain click refuses to select a locked element (`useSelectionBehavior.ts:88`), but mousedown → drag starts anyway. |
| Unwrap (right-click → Structure) | `canvas/menus/actions/insertActions.ts:27-38` → `element.unwrap()` (`engine/elements/ElementOperations.ts:102`) | The locked container is dissolved. Its sibling "Wrap" checks the lock (`canvas/utils/wrapInContainer.ts:19`). |
| Replace with block… | `editor/shared/elementActions.ts:236-245` (visible for locked), `shell/hooks/useBlockInsertion.ts:130` (`removeElement(replaced)`) | The locked section is deleted and replaced. |
| Spacing spot commit | `canvas/spots/CanvasSpotSpacing.tsx:46` | Written. |
| Keyboard nudge (⌘/⇧ + arrows) | `canvas/hooks/keyboard/keyboardHelpers.ts:105-112` | Written (positioned elements only). |
| ⌥ + arrow reorder | `keyboardHelpers.ts:118-165` | Moved. |

How you reach it: right-click on a locked element selects it (`Canvas.tsx:704`) and opens the menu. A locked element can also be selected from Layers.

- **Expected:** every listed action is refused with the `LOCKED_ELEMENTS_SKIPPED` toast, or hidden or disabled with a reason (`isEnabled` returns a string).
- **Fix:**
  - Set `draggable = false` in `handleMouseDown` when `composer.elements.getElement(id)?.isLocked()`. Also guard at the top of `handleDragStart`.
  - Give `unwrap` and `replace-with-block` an `isEnabled` that returns "Unlock to …" when locked, and route the write through `writeElement`.
  - Nudge, reorder and spacing go through the helper from P1-2.
- **Live:** UNVERIFIED.

### P1-4 Canvas right-click "Copy" copies stale data from one element and ignores the selection

- **Where:** `canvas/menus/actions/editActions.ts:12-41`: `composer.clipboard = [element.getData()]`.
- **Root cause:** `ElementCRUD.serializeElement` says `getData()` "has stale data" for children (`engine/elements/manager/ElementCRUD.ts:262`). The engine `copy` uses `serializeElement(toJSON())` over `topMost(getAllSelected())` and emits `CLIPBOARD_COPY` (`defaultCommands.ts:267-282`). This row copies only the right-clicked element, can carry a stale children array, and shows its own "Copied to clipboard" toast instead of the shared one. Its own sibling rows Cut and Paste already run the engine commands. Layers single-row copy (`useLayerContextActions.ts:44-50`) is a third variant; it uses `serializeElement` but still bypasses the command.
- **Expected:** right-click Copy and ⌘C are the same action.
- **Fix:** handler becomes `composer.commands.run("copy")`. Keep the OS-clipboard text write if wanted, but build it from `serializeElement`. Delete the local toast; `useClipboardToasts` already handles `CLIPBOARD_COPY`.
- **Live:** UNVERIFIED. Impact depends on how stale `data.children` is after edits, e.g. copy a section after editing a child's text, then paste.

### P1-5 Layers "eye" (editor-only hide) and canvas lock styling are lost on the next canvas re-render

- **Where:** `panels/layers/hooks/useLayerActions.ts:155-162` and `:251-254`, and `panels/layers/hooks/layersPersistence.ts:130-140`. They set `data-hidden` / `data-locked` attributes directly on canvas DOM nodes.
- **Trace:** the canvas body is `dangerouslySetInnerHTML={canvasInnerHtml}` (`canvas/Canvas.tsx:521, 798`), rebuilt whenever `displayContent` changes, i.e. on every document edit. The engine serializer never emits `data-hidden` / `data-locked` (grep of `engine/` finds neither). `applyStoredStatesToDOM` only re-runs on page change (`useLayersState.ts:125-130`).
- **Effect:** after any edit, an element hidden from Layers becomes visible and clickable again while the Layers row still shows it hidden. Locked elements lose their `Canvas.css:247` styling (cursor and outline). Canvas-menu Lock never sets `data-locked` at all.
- **Fix:** derive these attributes during rendering, not by poking the DOM. Either add them in the canvas HTML pass (`useCanvasContent`, from `composer` lock state plus the panel's hidden set exposed through a small engine or editor store), or re-apply them in a `useLayoutEffect` keyed on `displayContent`. Remove the direct `querySelector().setAttribute` writes.
- **Live:** UNVERIFIED. Strong code trace; the CSS rules exist and nothing re-applies the attributes.

### P2-1 The same action implemented two or three times with different behaviour

| Action | Implementations | Divergence |
|---|---|---|
| Duplicate | engine `duplicate` (`defaultCommands.ts:154`); Layers `duplicateLayer` (`useLayerActions.ts:309-317`) | Layers does not unlock the clone (`defaultCommands.ts:178`) and does not select it. |
| Group | engine `group` / `groupElements` (`ElementManager.ts:212`, requires the same parent, sorts into document order); canvas-menu copy of it (`menus/actions/standaloneActions.ts:41-53`); Layers `groupLayers` (`useLayerActions.ts:345-366`) | Layers groups elements from different parents, keeps click order, allows a single element, and renames **after** `endTransaction` (:363). The Undo toast `captureUndo()` (`useLayerContextActions.ts:143`) may then target only the rename. UNVERIFIED. |
| Ungroup | engine `ungroup` (acts on the selection); canvas menu (acts on the right-clicked element, `standaloneActions.ts:55-68`) | Small difference. |
| Reorder | engine `bring-forward` etc. (`commandOperations.ts:115`); keyboard ⌥↑/↓ (`keyboardHelpers.ts:118`); Layers moveToTop/Bottom (`useLayerActions.ts:319-343`) | Three index dialects, all commented as having been wrong before. |
| Delete / Cut | see P1-1 | |
| Copy | see P1-4 | |

**Fix:** make every surface run `composer.commands.run(id)` after setting the selection. For group from Layers, either extend `groupElements` to cover the single-element "wrap in group" case or route it to `wrapInContainer`.

### P2-2 ⌘S runs two saves; inline text edit calls a local-only save that clears the dirty flag

- `engine/commands/defaultCommands.ts:80-85` registers `save` with `shortcut: "ctrl+s"`. The capture-phase `KeybindingManager` runs `composer.saveProject()` (StorageAdapter, local) and `preventDefault`s. `shell/hooks/useEditorShortcuts.ts:166-169` does not check `defaultPrevented`, so it also runs the shell's dashboard save. The undo, redo and preview chords were removed from the registry for exactly this reason (`defaultCommands.ts:60-67`); save was missed.
- `canvas/hooks/useCanvasInlineEdit.ts:178` calls `composer.saveProject?.()` after every inline text commit and swallows errors silently. `useSaveCallback.ts:194-201` documents that with a siteId this path "only writes localStorage", yet `Composer.saveProject` → `markSaved` emits `PROJECT_SAVED` (`engine/Composer.ts:611-648`). That clears the dirty markers before the server has the edit. Autosave still fires on `PROJECT_CHANGED`, so loss is unlikely, but the dirty and saved indicators are wrong in the window between.
- **Fix:** remove `shortcut` from the `save` command, as was done for undo and redo, so the shell owns ⌘S. Delete the `saveProject` call in the inline edit; the transaction's `PROJECT_CHANGED` already arms autosave.
- **Live:** UNVERIFIED (depends on the StorageAdapter `type` in production).

### P2-3 Inspector edits reach the canvas 300 ms late

`useStyleHandlers.ts:204-215` updates only the panel state immediately ("live preview"). The engine write, and therefore the canvas, waits for the 300 ms debounce. Scrubbing a slider lags the canvas. Changing the design is not in scope; to fix, write to the engine immediately inside an open coalescing transaction and keep only the history close debounced. Severity is UX only.

### P2-4 Dead code (production-unreferenced; only a barrel export and/or tests)

- `inspector/components/DeleteConfirmModal.tsx`: exported from `inspector/components/index.ts:12`. Only tests import it or `vi.mock` it. The canvas uses `DeleteSelectionConfirm`.
- `canvas/shared/CanvasButton.tsx`: exported only from `canvas/shared/index.ts`.
- `inspector/shared/controls/ControlRow.tsx` exports `CompactRow`, `StackedRow`, `SubTitle`, and `TextControls.tsx` exports `SectionLabel`: all re-exported by `shared/controls/index.ts` with no consumer.
- `blocks/Navigation/index.ts:2` is labelled "L0 stubs (NavigationLink, Breadcrumbs files not yet created)". Check whether it is registered in `blockRegistry`. UNVERIFIED.
- `shell/StudioPanels.tsx:788` passes `onCreateComponent={() => {}}` to the column-hosted `TabRouter`. It is unreachable today (column tabs are publish/review/history/activity), but it is a silent no-op if Components is ever hosted there. Pass the real handler or make the prop optional.
- `shell/StudioPanels.tsx:954`: `onExpandToggle={() => {}}` for the AI tab in the inspector column. The expand control in that host does nothing. Hide it there.

### P2-5 Smaller wiring notes

- `inspector/shared/ColorFillPopover.tsx:83,85,211`: the `ColorPicker` gets `onChange={() => {}}` in both the token-edit and custom-colour pickers, so there is no live preview while dragging. Commit happens only on Save or "Update everywhere". This may be intentional; confirm against the board.
- `canvas/spots/CanvasSpotSpacing.tsx:68` hardcodes `#00d4aa` (hex ratchet; teal is not in the DS palette).
- The Layers single delete toast reads "<Type> deleted"; the canvas and engine delete toast reads "Deleted element" (`useHistoryFeedback`). Two phrasings for one action. This resolves with P1-1.
- Click-to-insert into a selected **locked** container adds children to it (`useBlockInsertion.ts:96-104`, nest check only, no lock check). Decide whether a lock covers the element's children list. If it does, skip locked candidates in the ancestor walk.

---

## 3. Not verified

- **No live-app run.** Every P1 is a code trace. Per the root CLAUDE.md, the live app is the verifier. Recommended live checks:
  1. P1-1: lock an element, then Layers ⋯ → Delete.
  2. P1-2: on Tablet, resize, then read the desktop width.
  3. P1-3: lock a section, then right-click → Structure → Unwrap or Replace with block.
  4. P1-4: right-click Copy a section after editing a child, then paste.
  5. P1-5: Layers eye, then type in any text element.
- Inline-edit rich-text toolbar commands (`useCanvasInlineCommands.ts`), the command palette contents (`shell/modals/CommandPalette.tsx`), and the AI context-menu door end to end were not traced line by line.
- Block registry completeness: `blockRegistry.everyBlockInserts.test.ts` passes, so every definition inserts. Block visuals were not checked against boards.
- The dead-code sweep matched exported names; components rendered only through dynamic registries could be missed. The four P2-4 items were confirmed by direct grep.
