# Wave 4 status — Critical/High reconcile + L1/L2 Medium/Low

Branch `fix/editor-audit-wave4` from main `e8df3945b` (2026-10-09). ISSUE-INDEX.md is not edited; this file is the record.

**Live verification (2026-10-09, after `git merge main` → 6c3bb6fa8, load < 40):** dev server from this worktree on :3560, qa@buildrik.local, 1440×900, `sites.publish` route-aborted, throwaway site `cmv16rsz…` (SaaS Landing applied; soft-deleted afterwards). Screenshots in the session scratchpad `wave4/`. Measured results:

| ID | Live result |
|---|---|
| L2-025 | PASS — SaaS hero `<h1>` content `Ship faster with<br><span …>less complexity</span>`; 0 `br`/`strong`/`span` elements carry `data-buildrick-id` (no layers) |
| L1-016 / L2-023 | PASS — the inserted Image (no src, alt "Image") renders 120×80, computed `content: url(data:image/svg+xml…)`, bg rgb(226,232,240); the screenshot shows the slab and icon only, no broken glyph or alt text |
| L1-023 | PASS — Add search "pic" lists Image |
| L1-027 | PASS — CMS workspace open (count 1) → Escape → count 0 |
| L1-011 | PASS — pointer at (left+10, section top+17), inside the old 48×40 hit box: `elementFromPoint` = the SECTION; click → readout "Section · 991 × 530"; the nearby grip shows opacity 1 / pointer-events auto, the others 0 / none |
| L1-036 | PASS — comment mode: capture layer up, click on the h1 opened "Leave a comment…", readout stayed "Nothing selected" |
| L1-010 | PASS — paragraph dragged onto the top edge of the h1: "Drop here" at y=301 (heading top 313); order after drop P, H1, DIV; Undo restores H1, P, DIV |
| L2-013 | **FAILED, then fixed** — first run: Layers row read "Renamed Hero W4" after Undo (the engine had reverted; the row's `customNames` only followed ELEMENT_RENAMED). Fixed in `967164e6a` (the undo/redo/load rescan rebuilds names; hook test added). Re-run: before "Section" → rename "Renamed Hero W4" → Undo "Section" → Redo "Renamed Hero W4" |
| L4-034 | PASS — page "Second" with a file-less Image; from Home, Issues › Whole site row "Image has no file @ Second › IMG" → active page tab Second, readout "Image · 120 × 80". Same panel showed the new L1-035 rows ("Image has no file", "Image is missing alt text") |
| L1-008 | PASS after a copy fix — `aquibra-project` seeded with another project ("LEAK-MARKER") and `pages.list` forced to 500: nothing leaked (no LEAK-MARKER, empty canvas), and the server copy was untouched (36 elements on the next normal load). The banner still said "You're seeing local changes for now", which is false now → fixed in `4bd0bb595` ("Couldn't load this site. Retry — anything done here is not saved until it loads."), re-verified live. Separately, a "Couldn't save … Check your connection" dialog appears in this state (the save is refused because the project never loaded): pre-existing, not changed here |

Not live-checked: everything else in section B (tests only).

Statuses: FIXED (this branch), ALREADY-FIXED (on main before this wave), DECISION (needs an owner or designer call; the recommended default is given), NOT-DONE (plan given).

## A. Critical / High rows whose Evidence is not "FIXED"

All of these were fixed on the parked branch `fix/editor-ai-audit-2026-10-08` (merged into main), by wave 1, or by Brand 1b/1c. Each was checked with the commit's own tests on this branch: 29 editor files / 410 tests and 7 root files / 176 tests, all green.

| ID | Status | Commit | Evidence |
|---|---|---|---|
| L1-002 | ALREADY-FIXED | 7bf99a90f | ExportEngine.textWithChildren.test green |
| L2-001 | ALREADY-FIXED | 99bc72216 | inverseResolveTokens + resolveTemplateTokens tests green |
| L3-002 | ALREADY-FIXED | 98024b024 | SelectionManager.pageSwitch.test green |
| L4-001 | ALREADY-FIXED | 2cb6d3a43 | mediaDrop + useCanvasDragDrop tests green |
| L1-001 | ALREADY-FIXED | 1c98083b2 | useBlockInsertion.test (text leaf → after) green |
| L1-004 | ALREADY-FIXED | e2e0d5e73 | writeCanvasStyles, DOMUpdater.constraints, keyboardHelpers.breakpointLock tests green |
| L1-007 | ALREADY-FIXED | 39081ed5f | HistoryManager.activePage.test green |
| L2-002 | ALREADY-FIXED | 94f47f080 (+ 2b91ea01c CONFLICT) | PageManager.test green |
| L2-003 | ALREADY-FIXED | 1dd0a5bf6 | LayersPanel.singleRowLock: locked row Delete/Cut refused |
| L2-004 | ALREADY-FIXED | 1dd0a5bf6 + new test 6a5673159 | row Delete inside an instance refused via dropLockedAndInstances. The "unregister on ELEMENT_DELETED" extra is moot because the path can no longer delete instance parts |
| L2-006 | ALREADY-FIXED | bd913f3de | ComponentInstances.test green |
| L2-009 | ALREADY-FIXED | 8471a15c5 | TemplatesTab.premiumUpgrade.test green |
| L2-010 | ALREADY-FIXED | 6c1dd5615 | ComponentManager.test green |
| L3-024 | ALREADY-FIXED | 6389005f0 | public-form-route-repeated-fields.test green |
| L4-002 | ALREADY-FIXED | 2cb6d3a43 | `isLibraryAsset` guard at useDropExecution.ts:149; mediaDrop.test "does not upload it again" |
| L4-003 | ALREADY-FIXED | 158788d09 | MediaCommandLayer + useMediaState.localOnlyInsert tests green |
| L4-018 | ALREADY-FIXED | 1e97fefba, 71f94ea41 (+ Brand 1b) | emit.ts aliases `replacedBy`; shared tokens emit/resolve/migrate + kindRegistry tests green |
| L4-019 | ALREADY-FIXED | 71f94ea41, 464b61855 | the list filters `replacedBy` (semanticKind.ts:34); TokenDetailView / Composer.setTokens tests green |
| L4-021 | ALREADY-FIXED | 5b44aaa16 | the preview switch is preview-only; useBrandPreview / useColorMode / ColorModeToggle tests green |
| L4-034 | ALREADY-FIXED | da223041b | AquibraStudio.tsx:608 routes element issues through `locateComment` (page first); review/locate.test green. The commit added no test of its own |
| L5-002 | ALREADY-FIXED | 21635494e | ai-router + ai.styleCommands tests green |
| L5-003 | ALREADY-FIXED | 1cdb991dd | applyAiEdit.integrity + applySetStyle + AITab.applyContract green |
| L5-004 | ALREADY-FIXED | 3915996bd, 675830d02 | useAgentRunner + runPromptOnce green |
| L5-007 | ALREADY-FIXED | 0764e514c | GenerateBlockScreen.scope green |
| FG-001 / FG-002 / FG-007 / FG-009 | DECISION | — | carried from wave 2: Figma-only / owner calls (Review v2 supersession; SEO container + save verbs). Not code |

## B. L1 / L2 Medium and Low

| ID | Status | Commit | Evidence / note |
|---|---|---|---|
| L1-005 | ALREADY-FIXED | fc052ec41 | useCanvasElementDrag.test: a locked drag is refused |
| L1-006 | ALREADY-FIXED | 948197059 | useCanvasEditorFlags.test: dim/lock survive re-render |
| L1-008 | FIXED | 639a5fcea, 4bd0bb595 | useComposerInit.loadFlow: a site session gets `storage:{type:"none"}`, and the demo keeps local storage. Not done: clearing an `aquibra-project` key already written by older builds on logout (that code lives in the dashboard's sign-out) |
| L1-009 | NOT-DONE | — | Needs a live repro on a fresh site to find which load-time write records "Updated page". Plan: snapshot `history` right after `importMigratedProject`, then wrap the culprit (likely ProjectTokensApplier / token push) in `runWithoutTracking` or re-baseline after load |
| L1-010 | FIXED | af8f870bc | dropOperations.test: before → slot 1, after → slot 2, fallback resolver not consulted |
| L1-011 | FIXED | 526ff717d | SectionReorderHandles.test: no pointer-active div at rest; proximity hover; a hovered grip takes the pointer |
| L1-012 | DECISION | — | Default zoom. Options: (a) Fit when the frame is wider than the column, (b) remember zoom per site, (c) keep 100%. **Default: (a)+(b)** |
| L1-013 | DECISION | — | One "Desktop" width. Options: 1024 / 1280 / 1440 shared via `shared/constants`. **Default: one constant at 1280**, with canvas, Preview and Export all reading it (changes the canvas breakpoint feel, so it is an owner call) |
| L1-014 | FIXED (copy) | 1a78e115e | KeyboardLegend.test: ⇧A → Components, ⌘J → AI, R unconditional. Generating the legend from the registry is a follow-up |
| L1-015 | NOT-DONE | — | Two progress sources (pill vs checklist). Plan: make the server onboarding state the source, derive the pill from it, and add event signals. Bigger than ~40 lines |
| L1-016 | FIXED (canvas + checks) | 552c0243e, c5107bf94 | Canvas.css replaces a src-less img's render with a transparent 120×80 so only the slab shows (**not checked in a browser**). Pre-publish/Issues now warn "Image has no file". The exporter still emits `<img>` (warned, not blocked) |
| L1-017 | NOT-DONE | — | Shell-level `element:needs-asset` handler with a pick mode that keeps Add open. Plan: lift the listener out of useMediaState into the shell; Inspector "Choose image" as the inline affordance |
| L1-018 | FIXED (Paste) / DECISION (IA) | d6c066144 | editActions.test: Paste disabled with an empty clipboard. Clipboard group at top level and disabled-row reasons: **default: move Copy/Cut/Paste to top level, extend ContextAction.isEnabled to `true\|string`** |
| L1-019 | FIXED | 8195b5628 | SelectionHandles.edges.test: a 40 px button gets E/W handles inside its height |
| L1-020 | FIXED | 94e259c21 | useHistoryFeedback.groupToast: single-element ⌘G/⌘⇧G hints, "N elements grouped · Undo". Cut already toasted ("Element cut") |
| L1-021 | FIXED | ffe303b3a | useSelectionReadout.test: page root → "Page · Home" |
| L1-022 | DECISION | — | Add-panel duplicates (Elements / Blocks / Built-in Components). **Default: one name per concept; Blocks keeps only multi-element sections** |
| L1-023 | FIXED (aliases) / DECISION (hint) | 7b8e6559e | search.test: btn/pic/photo/separator/paragraph resolve, and the typed word still matches. The ⌘F hint conflicts with G2-105: **default: print "/" as the hint** |
| L1-024 | DECISION | — | Components panel vs library. **Default: label the scopes ("This site" / "Workspace library") and list the library under them** |
| L1-025 | DECISION | — | Dashboard IA. **Default: Start from Scratch routes to `/edit/:id`; Overview gets a primary "Edit site"** |
| L1-026 | FIXED | fa1dd8fba | delete-confirm-modal-copy.test |
| L1-027 | FIXED (Escape) | d8b5bb518 | StudioPanels.inspectorColumn: Escape leaves a rail-opened workspace, and Escape after a bound door = Back to canvas. Reopening across reload is panel-state persistence: **DECISION, default keep** |
| L1-028 | FIXED | 8839e959c | loadFlow: no success toast on a normal load |
| L1-029 | NOT-DONE | — | Needs one tip queue with server-side "seen". Plan: a single onboarding queue owner, tips never take focus, triggers only between tasks |
| L1-030 | FIXED | 957cd5dbd | hook + barrel re-export deleted; tsc 0 |
| L1-031 | DECISION | — | Hero copy was deliberately set to the Buildrick brand (D5 sweep, blockConfigs.static.test:88). **Default: neutral placeholder ("Your headline here" / one-line subtitle) and the CTA as a Brand-token Button** |
| L1-032 | FIXED | 54c73d706 | HistoryTab.test: ⌘Z on Mac, Ctrl+Z elsewhere |
| L1-033 | NOT-DONE | — | Palette gaps. Plan: generate Add rows from the catalog (`catalog.ts`), tighten fuzzy keyword scoring, print chords on zoom rows |
| L1-034 | ALREADY-FIXED | c6063ed14 (wave 3) | useDSLint.missingDark.test: no "missing dark value" while Dark mode is Off |
| L1-035 | FIXED | c5107bf94 | contentIssues.test (missing-image kind; "Image" placeholder alt = missing); publish-prechecks-visibility.test (new "Images" row; the audit's exact img now warns twice) |
| L1-036 | FIXED | 48314ce07 | CommentLayer.test: capture-layer click/mousedown do not reach the frame handlers |
| L1-037 | FIXED | 58adfd87a | useBlockInsertion.test: a Section with a lone container inserts into it |
| L1-038 | FIXED | dcaa0aa54 | useCanvasKeyboard.arrows: ⇧→ then ⌘→ both explain (the hint was once per element per session) |
| L2-011 | FIXED | 4eb728855 | useStyleHandlers.shorthandFill: an authored `background` drops the default `background-color` |
| L2-012 | ALREADY-FIXED | 948197059 | as L1-006 |
| L2-013 | FIXED | 51d5fa8a8 (test), 967164e6a (fix) | the engine already undid the rename, but the Layers row did not follow (found live); `useLayerActions` now rebuilds names on undo/redo/load. Live re-run passes |
| L2-014 | FIXED | b874b9a88 | TemplatePreview.tokens.test: srcdoc has no `{{token.` |
| L2-015 | NOT-DONE | — | Stable ids across master sync. Plan: reconcile the instance subtree by element path in `syncInstance` and keep existing ids. Engine-wide, needs care with overrides |
| L2-016 | FIXED | d334fb887 | defaultCommands + useClipboardToasts: instance-only refusals emit `{reason:"instance"}` → "Part of a component — detach the instance to change it". No component name / Detach action in the toast yet |
| L2-017 | ALREADY-FIXED | cfbfda1b0 (wave 3) | per index |
| L2-018 | NOT-DONE | — | Tablet/Mobile/pseudo rows show type defaults. Plan: for non-desktop, merge base-effective styles (desktop layer) under the breakpoint layer instead of defaults, and mark them inherited |
| L2-019 | NOT-DONE (risky) | — | The 300 ms debounce. Plan: write immediately inside one coalescing transaction per field focus and debounce only the close. Touches the pendingFlush / lock / multi-target paths |
| L2-020 | DECISION | — | Master preview well. **Default: a dark/checker well when the component's computed background is light-on-dark** |
| L2-021 | DECISION | — | Library counts/duplicates. **Default: one count model, source site on library rows, group by name, fix "1 components"** |
| L2-022 | DECISION | — | Audit says product decision. **Default: rename "Edit master" to "Component settings" now; master edit mode as its own project** |
| L2-023 | FIXED (canvas + flag) | 552c0243e, c5107bf94 | The placeholder slab without glyph/alt text; "Image" alt now flagged in Issues. Default alt kept as "Image" so it stays flagged (`alt=""` would read as decorative and hide the problem) |
| L2-024 | DECISION | — | Default Form styling. **Default: give form children their input/button type defaults from Brand tokens** |
| L2-025 | FIXED | 1dc4c1d43 | HTMLParser.test: `<h1>Grow<br>faster</h1>` has no layers; `<strong>` stays content; a link stays an element. The stock-template floor changed 20 → 15 elements, and its equality/round-trip still pass |
| L2-026 | FIXED | f0cb5640d | ReplaceModal.tokenCopy.test: saved template → "takes this site's brand"; built-in unchanged |
| L2-027 | FIXED | c89d33686 | AddInteractionPanel.icons.test: svg glyphs, no emoji |
| L2-028 | FIXED | 232734916 | StatusMarks.test: the mark follows COMPONENT_UPDATED |
| L2-029 | FIXED (toast) | d009168e7 | ComponentRow.test: "<name> instance detached". Undo not offered: detach is not a history step and the instance registry is outside snapshots |
| L2-030 | FIXED | 912cf3c9e | LinkSection.validation: `example.com/menu` → `https://example.com/menu` |
| L2-031 | DECISION | — | The committed test cites board 4418:83498 as drawing "Nothing here yet" for no-results, which the audit disputes. **Default: keep until the board is re-read** (Figma call budget not spent here) |
| L2-032 | DECISION | — | Dead hide/show/lock/selectChildren/moveTo* branches. **Default: add Lock and Select children rows, delete hide/show/moveToTop/moveToBottom** |
| L2-033 | FIXED | 4b44ae405 | singleRowLock: row Group on a locked row is refused and toasts nothing; Move to page shares the gate. Duplicate was already the engine command |
| L2-034 | DECISION | — | Board 21 draws "SEO & social ↗" and the ⋯. **Default: designer drops ↗ (in-editor jump) and either extends ⋯ (Duplicate, Set as homepage) or removes it** |
| L2-035 | DECISION | — | The toolbar caption is drawn by the board; wave 2 hides it when the pill sits outside. **Default: show on hover/focus only** (board change) |
| L2-036 | FIXED (comment) / DECISION (search) | 3eacf8490 | **Default: add search once saved templates exceed ~12** |
| L2-037 | NOT-DONE | — | Cause unknown and the AI provider is not reachable in dev. Plan (with wave 6 / L5): log adoption only after a successful apply, and filter ResizeObserver errors out of Recovery |
| L2-038 | NOT-DONE | — | One-off; no repro attempted (no live session). Plan: give resize handles priority over drag start, and require a minimum distance plus a valid hovered target before moving |

## Gates (after merging main 6c3bb6fa8)

editor + dashboard `tsc` 0 · `verify:ds` 0 · dashboard DS grep 7/7 · tRPC orphans PASS · targeted vitest on touched files: editor 45 files / 563 tests, root 3 files / 35 tests, green. Pre-merge full runs: editor 1326/1327 files and root 1493/1494 files; the one failure in each (FormAfterSubmitSection, RedirectsScreen) is untouched code that fails a different test on each rerun.
