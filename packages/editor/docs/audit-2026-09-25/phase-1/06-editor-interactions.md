# Audit 6 — Editor interaction architecture

Date: 2026-09-25. Scope: playbook Prompt 6, editor-owned controls in shell, Pages, Layers, Media Quick/picker, and Inspector. Source inspection only; **no interaction in this pass was runtime verified**. The lead’s earlier browser observations are cited only where they overlap existing findings. Full Media actions are source traced but blocked from runtime by the baseline `LibraryManager.tsx` merge marker documented in Audit 3. No production changes or tests were run.

## Interaction traces

| Control | Handler → state/API → visible result | Assessment |
|---|---|---|
| Global Cmd/Ctrl+K | `StudioHeader` document listener toggles `cmdOpen`; renders global `CommandPalette`. Pages’ window listener independently toggles `paletteOpen`; renders `PageCommandPalette` when Pages is active. | **INT-E01**: both listeners receive the same bubbling key event and both open dialogs. Source verified; runtime not verified. |
| Cmd/Ctrl+Z, redo, save, preview and other shell chords | `AquibraStudio` always mounts `useEditorShortcuts`; after checking `isModalOpen()` and editable targets it calls engine history, save, preview, or panel callbacks. | **INT-E02**: the hidden canvas remains mounted in full-page workspaces, but the shortcut hook has no full-page guard. Canvas history/preview actions may affect the hidden editor while Settings/Full Media owns the visible workspace. Candidate pending runtime confirmation. |
| Pages select/range | Row click selects the page; modifier-click/range delegates to `useBulkSelect`, whose local Set drives the selection toolbar. Enter activates; F2 renames; Escape clears bulk selection; Cmd/Ctrl+K opens page search. | Source path traced. Repeated Shift ranges accumulate previous IDs rather than replacing the prior range; whether that is unintended depends on the intended additive-selection contract, so this is an observation, not a finding. |
| Pages rename | Row input Enter/blur share a `committedRef` guard; Escape cancels; trimmed duplicate-name validation precedes `p.commitRename`. | Duplicate commit is explicitly guarded in source. Runtime not verified. |
| Pages delete one / many | Row/menu delete opens a named confirm (homepage/last-page guard warns); confirm calls `p.deletePage` → `composer.elements.deletePage` → toast. Bulk confirm filters homepage and retains one page, loops deletes, clears selection. | Guard and confirmation behavior source verified. Bulk loop is intended as one history step per existing source comments and lead verification, but not independently exercised here. Undo toast scope caveat INT-E04 below. |
| Pages duplicate / folders | Bulk duplicate, move-to-folder and remove-from-folder loop over selected IDs, then clear selection; each page duplicate delegates to engine cloning. | Source traced. No runtime check of partial failure or whether loops form one undo step. |
| Layer selection | Tree row calls Composer selection; event subscriptions mirror selection into React state. Meta toggles; Shift adds range IDs. | Composer is declared source of truth. Shift-range accumulation is noted above; no definite mismatch established. |
| Layer reorder/nest | HTML drag stores source ID; drop computes before/after/inside position, checks root/cycle/locked-parent/type legality, then `moveElement` in one transaction and reselects. | Source checks make illegal drops no-op with feedback in common rejected cases. No browser drag was performed. |
| Layer hide/lock/rename/delete | Hide and lock update local page-persisted Sets and corresponding canvas DOM/engine lock state; rename updates local custom-name storage and emits rename; delete and duplicate use engine transactions. Multi-delete uses a confirm and transaction. | Hide is explicitly editor-only and does not mean hidden on publish (banner title); no persistence or undo promise is implied. Single context-menu delete is immediate but undoable; not classified as a defect without destructive-action policy. |
| Inspector delete | Overflow menu opens `DeleteConfirmModal`; confirm calls parent `onDelete(selectedElement.id)`, then closes. | Named confirmation and undo copy are source verified; owner callback is in shell. Runtime not verified. |
| Media Quick bulk move | Selected assets → folder target → `Promise.all(moveAsset)` → success toast and selection-mode toggle. `moveAsset` awaits `composer.media.updateAsset`. | **INT-E03**: rejection has no catch/error state; the success continuation does not run, leaving selection mode and selection in place with an unhandled rejected promise. Source verified; actual API failure not induced. |
| Media picker | Card click/Enter/Space sets selected asset; Upload drop/input chooses pending file; Upload button awaits upload; Use calls the parent selection callback and closes. | Source path traced. No upload, selection callback, or remote mutation performed. Full Library manager interactions remain source-only due the pre-existing compile blocker. |

## Findings

### INT-E01 — Pages Cmd/Ctrl+K opens two command palettes

- **Priority:** P2. **Status:** SOURCE VERIFIED; runtime NOT VERIFIED.
- **Source/handler:** `src/editor/shell/StudioHeader.tsx:257`–`:274` listens on `document` and toggles the global palette for Cmd/Ctrl+K. `src/editor/sidebar/tabs/pages/PagesTab.tsx:166`–`:179` listens on `window` and toggles its page palette for the same chord. Both are mounted while the Pages module is active (`src/editor/sidebar/TabRouter.tsx:169`–`:176`). The event is not stopped by the document listener, so it reaches the window listener too.
- **State/result:** one keypress sets both booleans true. The global modal renders at `StudioHeader.tsx:871`; the local `aria-modal` page dialog renders at `PagesTab.tsx:403`–`:409`.
- **Expected:** one shortcut should select one palette for the active context, or the local page search should be a sub-flow of the global command surface.
- **Risk/recommendation:** competing dialogs and focus targets can open together; confirm in browser and choose a single owner/explicit precedence. Do not count as IA-PROD-01 (AI destination) or COH-02 (duplicate Undo command rows).

### INT-E02 — Global document shortcuts remain active while canvas is hidden in full-page workspace

- **Priority:** P2 candidate. **Status:** STATIC SOURCE PATH; runtime NOT VERIFIED.
- **Source/handler:** `src/editor/shell/AquibraStudio.tsx:360`–`:368` mounts `useEditorShortcuts` at shell scope. `src/editor/shell/hooks/useEditorShortcuts.ts:80`–`:101` gates only on an open modal and editable target; history handlers call Composer at `:153`–`:162`. Full-page mode is derived in `src/editor/shell/StudioPanels.tsx:267`–`:272`, keeps Canvas mounted (`:506` per Audit 4), and `src/editor/rail/LayoutShell.css:314`–`:323` hides the canvas using visibility/zero size/pointer-events. A workspace is not itself covered by the modal guard.
- **Expected:** shortcuts that mutate or control the document should have explicit precedence when a dedicated workspace owns the screen.
- **Risk/recommendation:** Cmd/Ctrl+Z/Y can change hidden document history; preview/canvas chords may also act behind Settings or Full Media. Verify after a known harmless history step with a disposable project, then decide whether to suspend editor shortcuts for full-page mode. Do not generalize the existing modal guard: modal keyboard ownership is separately implemented.

### INT-E03 — Media bulk move has no failure outcome

- **Priority:** P2 candidate. **Status:** SOURCE VERIFIED; API rejection NOT RUNTIME VERIFIED.
- **Source/handler:** `src/editor/sidebar/tabs/media/MediaTab.tsx:321`–`:327` runs `Promise.all(keys.map(state.moveAsset))`, but attaches only `.then(success)`. `src/editor/sidebar/tabs/media/hooks/useLibraryState.ts:304`–`:306` awaits `composer.media.updateAsset` without catching.
- **State/API/result:** each selected asset is updated remotely; only full success produces “Moved N files” and toggles selection mode off. Rejection skips both, surfaces no local error, and rejects the fire-and-forget promise.
- **Expected:** report partial/total failure and preserve or reconcile selection so the user can retry; account for Promise.all allowing some individual updates to succeed before another fails.
- **Recommendation:** add explicit pending/error/partial-result handling in a future fix, after checking whether the media manager API already emits a global error event. Audit did not trigger a remote mutation.

### INT-E04 — Page-delete toast Undo invokes whichever history entry is current

- **Priority:** P2 candidate. **Status:** SOURCE VERIFIED; stale-toast sequence NOT RUNTIME VERIFIED.
- **Source/handler:** `src/editor/sidebar/tabs/pages/usePages.ts:284`–`:296` deletes a page, then displays an Undo action for eight seconds. Its handler calls the generic `composer.history.undo()` at click time (`:290`–`:294`); it does not bind the action to the deletion history entry.
- **State/API/result:** if another undoable edit enters history before the user clicks the still-visible toast, the button undoes that latest edit instead of specifically restoring the named page. A toast still labeled for the deleted page can therefore perform a different operation.
- **Expected:** the toast’s action should either target that deletion safely or cease to promise page-specific undo when another action supersedes it.
- **Recommendation:** reproduce with a disposable page: delete, make a small edit, click the toast action, then choose an operation-aware undo design or constrain/dismiss the toast. The keyboard undo remains naturally LIFO. This is not the separate palette duplicate-row finding COH-02.

## Existing finding deduplication and limits

- Existing NAV-02 covers bare module shortcuts changing a tab while leaving the drawer closed; this report does not recount it. NAV-C02 covers Issues rows dismissing without navigation; already separately runtime-confirmed by the lead.
- Existing IA-001 covers the left/right AI destination contract, including lead’s R9 hidden Inspector symptom. COH-01 covers separate asset alt-text generation paths. Neither is duplicated here.
- Layer hide/lock, drag guards, page delete guards and modal-aware shortcut behavior have coherent source paths. No remote collaboration editing was exercised; engine collaboration remains demo-only per `src/engine/AGENTS.md`.
- This audit is bounded source tracing plus prior lead runtime evidence. It did not exercise live network failures, full-page hidden-document shortcuts, simultaneous palettes, rapid undo sequencing, or drag/drop in a browser. No production source changed.
