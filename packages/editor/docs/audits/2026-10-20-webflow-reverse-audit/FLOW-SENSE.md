# Flow sense audit: Buildrick visual editor (2026-10-20)

**Mode:** read-only source audit. Nothing was run, clicked or edited. No live walk and no sub-agents.
**Code read:** worktree `~/Desktop/buildrik-worktrees/remove-editor-ai` @ `1ad15c849` (AI removed from the editor on purpose, so missing AI is not flagged). All `file:line` anchors point into that tree. Editor paths are relative to `packages/editor/src/`; dashboard paths start with `packages/dashboard/`.
**Leads used:** `README.md` and `evidence/C1–C5, L` in this folder. The live walk L ran on `main` @ `19f964d5e`, not on this branch. When a finding rests on L, it says "live (L Wn)". Every lead used here was re-checked in this worktree's code unless the finding is marked SUSPECTED.
**Authority:** `PRODUCT-DESIGN-BRIEF.md` decisions (BD-xx, IA-xx) are approved and are not reopened here. Where shipped code contradicts one, that is stated as a fact about the code.
**Labels:** PROVEN = the code path was read end to end in this worktree, sometimes also seen live in L. SUSPECTED = inferred from code or from evidence files and not traced fully.

---

## 1. Summary

Most single actions in the editor work. Drag-add, Layers, reorder, delete with Undo, page delete, autosave/reload, version restore with "Undo restore", and the guarded exit all behave the way a user expects. The flows break down **at the seams between surfaces**, and five patterns repeat:

1. **One action, several silent outcomes.** "Start from Scratch" has three different endings depending on which dashboard door you used. One asset click either replaces or inserts. ⌘-click means different things on the canvas and in Layers.
2. **Labels that promise what the code does not do.** "CSS classes" applies no styles. "Edit master" does not edit the master. The context menu's "Insert" submenu inserts nothing. "Create page" creates no page. "Head scripts" strips inline scripts.
3. **Scope that is shown but not honoured.** The inspector shows a "Tablet" chip, then Paste styles writes Desktop. Duplicate drops the tablet, mobile and hover work. Spacing turns `2rem` into `2px`.
4. **No way to see the result before it ships.** Preview runs no scripts, and the interaction "Preview" button plays nothing. Live, the inspector colour differed from the canvas colour, and the canvas colour differed from the published colour.
5. **Core destinations hidden behind ⋯ or a pill.** The breakpoint switcher is in a footer submenu. Version history opens only from the save pill. Site settings sits behind the site menu even though BD-14 (locked) puts it in the topbar.

The two P0s that lose work: **Esc throws away inline text edits** and **Duplicate/paste drops responsive and hover styles**. Both are silent.

---

## 2. Flow map

| # | Flow | Verdict | Sev |
|---|---|---|---|
| F1 | Dashboard → create site → open editor | **DUPLICATED** (3 doors, 3 outcomes; one is a dead end) | P1 |
| F2 | First load / empty canvas | CONFUSING (5 competing prompts) | P2 |
| F3 | Add element via Add drawer (drag/click) | SENSIBLE | — |
| F4 | Add element via ⌘K / canvas context menu | CONFUSING (⌘K only opens Add; "Insert" submenu holds Wrap/Unwrap) | P2 |
| F5 | Select / multi-select / parent select | **BROKEN** (⌘-click cycle dead; same chord means something else in Layers; ⇧-click cannot deselect) | P1 |
| F6 | Edit text inline | **BROKEN** (Esc discards; Insert link replaces text with a URL) | **P0** |
| F7 | Style values in the inspector (units, colour readout) | CONFUSING (rem/% → px; inspector colour ≠ rendered colour) | P1 |
| F8 | Breakpoint switching | **HIDDEN** (footer ▸ View ▸ Breakpoint submenu) | P1 |
| F9 | States (hover etc.) and scope readout | SENSIBLE (ContextRow chips) | — |
| F10 | Copy / paste styles | **BROKEN** (writes Desktop whatever chip is shown; copies base only) | P1 |
| F11 | "Apply style to all" in a state | **BROKEN** (selector typo → nothing copied) | P2 |
| F12 | Duplicate / paste element | **BROKEN** (tablet/mobile/hover styles dropped) | **P0** |
| F13 | CSS classes | **DEAD END** (names only; no styles; suggestions call a missing method) | P1 |
| F14 | Layout (flex / grid / position) | CONFUSING (Layout/Position only on containers; grid = column count) | P2 |
| F15 | Components: create, edit master, instances, detach | CONFUSING ("Edit master" = push-from-selection; accepts any selection) | P1 |
| F16 | Pages: new page | CONFUSING (defaults to From template; button still says "Create page") | P1 |
| F17 | Pages: settings / SEO / head code | **BROKEN** (valid `<meta>` blocks save; inline scripts silently stripped) | P1 |
| F18 | Pages: delete / rename / homepage | SENSIBLE | — |
| F19 | Assets: upload, pick, alt, replace | CONFUSING (same click replaces or inserts; replace jumps you to Add) | P2 |
| F20 | CMS: collection list | **DEAD END** (limit only; no filter/sort/offset) | P1 |
| F21 | CMS: bind field / template page | CONFUSING (binding in a separate Behaviour section, not on the property row; reference prints id, SUSPECTED) | P1 |
| F22 | Interactions | **DEAD END** (no way to see it before publish) | P1 |
| F23 | Brand / design system | CONFUSING (toasts say "Undo ⌘Z" with no button; IA-02 header Undo not shipped) | P2 |
| F24 | Preview | CONFUSING (differs from publish; Esc dead once the iframe has focus) | P1 |
| F25 | Publish | SENSIBLE (checks block correctly; production-only by design) | — |
| F26 | History / versions / restore | **HIDDEN** (only door is the save pill / ⌘K / ⌘H; restore itself is sensible) | P1 |
| F27 | Review / comments / share | **DUPLICATED** ("Share preview link" = live draft vs "Send for review" = frozen snapshot) | P2 |
| F28 | Save / autosave / recovery | SENSIBLE | — |
| F29 | Save conflict | CONFUSING ("Save a backup" downloads JSON nothing can import) | P1 |
| F30 | Undo / redo scope | CONFUSING (one stack across pages; components/settings/CMS off ⌘Z) | P2 |
| F31 | Keyboard shortcuts | CONFUSING (sheet advertises dead ⌘-click; `?` disputed) | P2 |
| F32 | Site settings | **HIDDEN** (⋯ menu only, contradicts BD-14); password may silently not apply (SUSPECTED P0) | P1 |
| F33 | Leaving the editor | SENSIBLE (dirty guard); always returns to `/dashboard/projects` | P2 |

**Counts (33 flows):** SENSIBLE 6 · CONFUSING 13 · BROKEN 6 · DEAD END 3 · DUPLICATED 2 · HIDDEN 3.

---

## 3. Findings, ranked

### P0: blocks or loses work

**FS-01 · Esc throws away inline text edits (F6). PROVEN (code + live L W8).**
- Path: double-click → `editor/canvas/hooks/useCanvasInlineEdit.ts:88-100` saves `original` → typing → `:204-207` Escape → `finishEdit(false)` → `:184` puts `original` back. Enter (`:208-210`) and click-outside (`:201`) both commit.
- Expected: Esc means "done editing" (Webflow, Figma, Framer text all commit on Esc). At minimum, a cancel should be undoable.
- Actual: the typed text vanishes with no toast and no undo entry, because the edit was never recorded. Because Enter commits too (no `shiftKey` check at `:208`), a user also cannot add a line break in a paragraph. That part is SUSPECTED; a soft break may be handled elsewhere.
- Recommendation: **Esc commits and exits**, the same as click-outside. If a cancel gesture is wanted, make it explicit ("Revert text" in the inline toolbar) and undoable. Give ⇧Enter a line break.

**FS-02 · Duplicate and paste silently drop responsive and hover styles (F12). PROVEN (code; reproduced in C1).**
- Path: ⌘D / menu Duplicate → `engine/elements/manager/ElementCRUD.ts:227-253` clones `original.toJSON()` and builds the tree. Breakpoint and state rules live in `StyleEngine`, keyed by element id, and nothing copies them. The only `ELEMENT_DUPLICATED` listener is a toast (`editor/shell/hooks/useClipboardToasts.ts:128`).
- Expected: the duplicate looks identical at every breakpoint and in every state.
- Actual: it matches only on Desktop/base. The loss shows up later on Tablet/Mobile, or on the published site, long after the action, so the user cannot connect cause and effect.
- Recommendation: Duplicate, Copy/Paste and Save-as-component must carry the element's full style record (base + breakpoint + state rules). A fix exists on the unmerged Phase 1 branch (README bug #1). Re-verify it before merge.

### P1: major confusion

**FS-03 · "Start from Scratch" has three endings (F1). PROVEN (code + live L W1).**
- Projects page modal: `packages/dashboard/app/dashboard/projects/page.tsx:698-704` → `createMutation` `:177-182` → toast "Site created" and **you stay on the list**.
- Home Quick actions modal (same component): `packages/dashboard/components/dashboard/quick-actions.tsx:60-62` → `:22` → **site detail page** `/dashboard/sites/:id`.
- `/dashboard/sites/new` page: `packages/dashboard/app/dashboard/sites/new/page.tsx:145` → `:57-61` → **opens the editor**.
- The modal's "Use a Template" (`packages/dashboard/components/sites/create-site-modal.tsx:118`) sends you to the generic templates gallery and drops the name you just typed (`projects/page.tsx:705-706`).
- Why it confuses: the same button in the same dialog leads to three places. The most common door, the Projects list, is a dead end that needs a second click to reach the thing you just made.
- Recommendation: the dashboard owns creation, and **every create path ends in the editor** on the new site, as `/sites/new` already does. Carry the typed name into the template flow.

**FS-04 · Paste styles ignores the scope the inspector shows (F10). PROVEN (code).**
- Path: ⋯ / canvas Style › Paste / ⌥⌘V → `engine/commands/commandOperations.ts:318-327` `pasteStyles` → `el.setStyle(key, …)`. That is the base layer. It does not use `setStyleAt(activeBreakpoint)` (`:245-248`, `:270`). Copy (`engine/commands/defaultCommands.ts:193-201`) snapshots only `el.getStyles()` (base), so tablet, mobile and hover values never reach the clipboard.
- Meanwhile `editor/inspector/components/ContextRow.tsx:1-8` shows "Tablet · N overrides" and "State: :hover".
- Expected: paste lands where the inspector says writes land.
- Actual: Desktop changes while you look at Tablet, and the canvas you are viewing may not change at all.
- Recommendation: one rule, **all writes honour the ContextRow scope**. Copy captures the full record; paste writes into the active breakpoint and state. If paste deliberately targets base, the menu row must say so ("Paste to Desktop").

**FS-05 · CSS classes are labels that style nothing (F13). PROVEN (code + live L W3).**
- Path: Inspector **Behaviour** tab › "CSS classes" (`editor/inspector/sections/registry/behaviour.tsx:196-200`) → `editor/inspector/sections/CSSClassesSection.tsx:116-123` adds names only. Suggestions call `composer.styles.getGlobalClasses`, which does not exist in `engine/`, so the list is always empty (`:111-114`). Style edits go to the element. Publish emits one generated class per element, and user classes ship with no rules (L W16).
- Expected (any Webflow user): style a class once, and every element with that class follows.
- Actual: typing `hero-title` on a second element changes nothing. The section also sits in Behaviour, away from Style, which hides what it is for.
- Recommendation: needs an owner decision (OD-1). Until then, rename the section **"Class names (for custom code)"**, move it to Behaviour › Advanced attributes, and explain in one line that it does not style. Half-way is the worst option.

**FS-06 · Inline "Insert link" replaces the selection with a plain URL (F6). PROVEN live (L W8, 3 attempts); root cause SUSPECTED.**
- Path: toolbar `editor/panels/RichTextEditor.tsx:28-33` → `editor/canvas/hooks/useCanvasInlineCommands.ts:36-40` re-focuses and reads `window.getSelection()` at command time → `:88-103` wraps the range in `<a>`. The range is not saved when the URL input takes focus. The live result was the text replaced by the URL, with no `<a>`.
- Recommendation: capture the selection when the link popover opens and restore it on apply. Once a link exists, show "Edit link / Remove link" for it. Inside text editing, ⌘K should open the link prompt, not the command palette (L W8).

**FS-07 · Preview is not what ships (F24, F22). PROVEN (code + live L W5/W15/W16).**
- Path: ⌘P / topbar → `editor/shell/PreviewOverlay.tsx:209-212` `sandbox="allow-same-origin"`, no `allow-scripts`. Interactions and runtimes never run, and live the hover rules did not render either. The Esc listener (`:148`) is on the parent window, so it is dead once a click puts focus inside the iframe (L W16).
- The in-panel interaction "Preview" (`editor/inspector/sections/registry/behaviour.tsx:52-59`) sets `animation: bd-anim-<preset>`, but the keyframes are injected only when referenced in project CSS (`shared/constants/animationKeyframes.ts:76-79`). Live, nothing played (cause SUSPECTED).
- Expected: Preview equals the published page. The interaction Preview button plays the animation.
- Actual: there is **no place to see an interaction before publishing**, and live a heading rendered slate on canvas and black in Preview/publish (L W16).
- Recommendation: Preview should render the publish exporter's output **with its runtime scripts**, in a sandbox that allows scripts but not same-origin access to the editor. Make Esc and "Back to canvas" work from inside the frame (forward keydown, or keep the close control focusable). The interaction Preview plays on the canvas using the same keyframe source as export. IA-03's preview/publish distinction stays as approved.

**FS-08 · "Edit master" does not edit the master; "Update from selection" accepts anything (F15). PROVEN (code + live L W11).**
- Path: Inspector `editor/inspector/sections/ComponentRow.tsx:131` "Edit master" → Components panel `editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx`. "Update from selection…" is enabled whenever *anything* is selected (`:342`). `confirmUpdateAction` (`:170-176`) replaces the master with that element. Live, a child heading was offered as the new master for 2 instances.
- Expected: "Edit master" opens the master for editing in isolation.
- Actual: you edit an instance and push it back. One wrong selection can overwrite every instance; only the toast Undo protects you, because component definitions are not on ⌘Z (C1 C11).
- Recommendation: rename the action to what it does ("Push changes to master…") or build isolated master editing (OD-3). Enable the push only when an **instance root of this component** is selected. Put component definition changes on the shared undo stack (IA-02).

**FS-09 · New page defaults to "From template"; "Create page" creates nothing (F16). PROVEN (code + live L W12).**
- Path: `editor/sidebar/tabs/pages/components/NewPageModal.tsx:44` `useState("template")` (reset to template at `:52`) → `:71-74` emits browse-templates and closes → the footer button reads **"Create page"** in both modes (`:122-124`).
- Why it confuses: the primary label promises a result and delivers a gallery. Leaving the gallery creates nothing (header comment `:9-11`).
- Recommendation: default to **Blank**, the minimum-surprise outcome, and keep From template one click away. When From template is chosen, the button reads **"Choose template…"**.

**FS-10 · Page head code: valid `<meta>` refused; inline scripts silently stripped (F17). PROVEN (code).**
- Path: Page settings › Advanced → `editor/sidebar/tabs/pages/page-settings/usePageSettings.ts:85-94`. `validateHeadCode` counts `<meta …>` and `<link …>` as unclosed and refuses the save. The sanitizer that runs at publish explicitly *allows* `<meta>` and `<link>` (`engine/export/sanitizeHeadCode.ts:8-10`) but strips inline `<script>` (C4 P02). Site settings labels the field "Head scripts" (`AdvancedScreen.tsx:3`).
- Why it confuses: the Google verification tag cannot be saved, and a GA/GTM snippet *can* be saved but never ships. Both failures sit in the field users touch for analytics.
- Recommendation: validation should match the sanitizer. Accept what publishes, and warn inline, at save time, about what will be removed ("Inline scripts are removed on publish — use a `<script src>`"). Rename the field "Head code".

**FS-11 · Breakpoint switching is hidden (F8). PROVEN (code).**
- Path: footer `editor/canvas/CanvasFooterToolbar.tsx:392-421` → View menu → "Breakpoint ▸" submenu → radio rows. The only other doors are ⌘K and shortcuts.
- Why it matters: responsive editing is a top-three task, and the shipped location contradicts BD-10 (breakpoint in the Canvas toolbar view group). IA-06's inspector readout does exist and is good.
- Recommendation: implement BD-10 as approved. Put a visible breakpoint segmented control in the canvas toolbar and keep the footer entry as a secondary door to the same state.

**FS-12 · Version history has no visible entry (F26). PROVEN (code).**
- Path: `editor/shell/StudioHeader.tsx:652-659`. Clicking the save pill opens History when saved, saving or unsaved. Other doors: ⌘K "Open History" (`editor/shell/modals/CommandPalette.tsx:228`) and ⌘H. The rail note at `editor/rail/tabsConfig.ts:286-288` says history is in the site menu, but the site menu has no such row (`editor/shell/SiteMenu.tsx:149-258`).
- The restore flow itself is good: confirm, safety save, "Undo restore" (`editor/panels/VersionHistoryPanel.tsx:185-212`).
- Recommendation: add a labelled **"Version history"** row to the site menu, as the comment already claims, and give the save pill a tooltip saying it opens history.

**FS-13 · Save-conflict "backup" cannot be restored (F29). PROVEN (code); whole-site scope from L/README T04.**
- Path: `editor/shell/AquibraStudio.tsx:808-821` "Save a backup" downloads `buildrik-backup-*.json`, then reloads. Nothing in the editor UI imports a project JSON. The only `importProject` caller is the brand migration (`editor/design-system/ui/MigrationProgressMount.tsx:253`).
- Also: the conflict fires for the whole site even when two people edit different pages (README T04).
- Recommendation: either offer **"Restore from backup file"** (site menu or the conflict dialog), or replace the download with a server-side "Save my copy as a version" that History can restore. Narrow conflicts to the page/resource level when the owner is ready (OD-6).

**FS-14 · Collection list cannot filter or sort (F20). PROVEN (code).**
- Path: Inspector Behaviour › Collection → `editor/inspector/sections/CollectionListSection.tsx:52-56` binds `{ limit }` only. The engine supports filter, sort and offset (C4 M02: `CollectionManager.ts:480-509`), but no UI reaches them.
- Why it is a dead end: "latest 3 posts" and "featured only" are the first things a CMS user tries. BD-20 approved list filter/sort.
- Recommendation: add Filter / Sort / Offset rows to the Collection section, per BD-20/FD-DYN-01.

**FS-15 · CMS binding lives apart from the property it binds (F21). PROVEN (placement); reference-id output SUSPECTED.**
- Path: a separate "CMS binding" section in Behaviour (`editor/inspector/sections/registry/behaviour.tsx:165-172`), while image src/alt sit in Style › "Type" (`registry/_shared.tsx:42-48`: tabs are Style · Behaviour · Effects).
- BD-22 approved a bind icon on the property's own row, and BD-08 approved a Content tab. Neither shipped. Template pages print a reference field's raw id (C4 M03, SUSPECTED).
- Recommendation: implement BD-08/BD-22 as approved. Until then, label each bound property's row with a "Bound to {field}" chip so the user can see a value is dynamic where it is edited.

**FS-16 · Inspector values do not match what renders (F7). PROVEN (spacing code); colour PROVEN live only.**
- Spacing: `editor/inspector/shared/controls/SpacingControls.tsx:86-90,144-148` commits only bare numbers while typing, so `2rem` commits `2px` on the "2" and reverts on blur.
- Colour: live, the inspector showed `1a1a1a` while the canvas rendered `#334155`, and publish rendered black (L W16).
- Recommendation: fields accept any valid CSS length/var/calc and display the stored value. The colour field shows the **computed** value and its source (inherited, token, breakpoint) when no local value exists.

**FS-17 · ⌘-click is dead on canvas and means something else in Layers (F5). PROVEN (code; probe in C2).**
- Path: `editor/canvas/hooks/useSelectionBehavior.ts:241-246` → `handleClickThrough`. `lastClickPosition` is written first, so `isSamePosition` at `:79` is always true and `:100` cycles over an empty stack. Nothing gets selected.
- Layers ⌘-click toggles multi-select (C2: `useLayerSelection.ts:78-105`). On canvas, ⇧-click only adds and cannot remove (C2 C03).
- Recommendation: one meaning per chord across canvas and Layers. **⇧-click toggles in both places.** ⌘-click selects the deepest element on canvas. Remove the cycle claim from the shortcut sheet until it works.

**FS-18 · Site settings is hidden, and the password may not apply (F32). Placement PROVEN; password SUSPECTED P0.**
- Path: ⋯ Site menu › Site settings (`editor/shell/SiteMenu.tsx:165`), ⌘,, ⌘K. Rail composition excludes it (`editor/rail/tabsConfig.ts:294-296`). BD-14 (APPROVED/LOCKED) requires a visible gear + "Site settings" label in the topbar.
- Password: Vercel 402/403/404 swallowed with `console.warn` (C4 P03, `server/services/publish.service.ts:995-1020`). The user believes the site is protected.
- Recommendation: implement BD-14. For the password, a failed protection call must fail the publish or show a blocking warning, never pass silently.

### P2: polish

**FS-19 · First load stacks five prompts (F2). PROVEN (code + live L W1).** At the same moment the user gets: the empty-page CTA (`editor/canvas/CanvasEmptyCTA.tsx:84`, three buttons), the Add drawer opened, the FirstUseTip coach mark (`editor/sidebar/tabs/build/components/FirstUseTip.tsx`), the onboarding checklist pill (`editor/onboarding/OnboardingChecklist.tsx`), and Page properties in the inspector. Each is reasonable alone. Together there is no single next step. *Recommendation:* the canvas CTA is the one first-run voice. Hold the coach mark until the first element is added, and keep the checklist collapsed until then.

**FS-20 · ⌘K and the context menu cannot insert (F4). PROVEN.** ⌘K has "Open Add" but no element/block insert commands (`editor/shell/modals/CommandPalette.tsx:115-138`). The canvas context menu's **"Insert"** group holds only Wrap/Unwrap (`editor/canvas/menus/actions/insertActions.ts:1-37`; insert-before/after were removed, G2-052). *Recommendation:* rename the group "Structure". Either add "Insert {element}" commands to ⌘K that place at the selection, or keep ⌘K as navigation and say so in the placeholder.

**FS-21 · One asset click, two outcomes (F19). PROVEN.** `editor/sidebar/tabs/media/hooks/useMediaState.ts:204-215`: with one image selected the click **replaces** its src, otherwise it **inserts** a new image. Nothing on the card tells you which will happen. After a replace, the panel switches to Add (`:233`), throwing you out of Assets. *Recommendation:* show the mode on hover ("Replace selected image" / "Insert") and stay in Assets after a replace. Alt-text propagation from the library to placed images is already handled (`engine/Composer.ts:530-534`). Good.

**FS-22 · Layout only on containers; grid is a column count (F14). SUSPECTED (C3 S02, L W6).** Headings, images and buttons cannot set display, position or z-index from the inspector. *Recommendation:* Layout/Position available on every element, with progressive disclosure.

**FS-23 · "Apply style to all" in a state copies nothing (F11). PROVEN.** `engine/commands/stylePeers.ts:79` builds `[data-buildrik-id=…]`, but the real attribute is `data-buildrick-id` (`engine/export/ExportEngine.ts:509`). *Recommendation:* fix the selector, and toast the count actually applied so a zero is visible.

**FS-24 · Brand edits advertise an Undo button that does not exist (F23). PROVEN (copy); ⌘Z reach SUSPECTED.** Toasts read "… · Undo ⌘Z" as text (`editor/design-system/ui/BrandWorkspace.tsx:532,544,741,807,815`) where every other surface has a clickable Undo action. IA-02 (header Undo in Brand) is not shipped. *Recommendation:* implement IA-02 and give the toasts a real Undo action.

**FS-25 · Share preview vs Send for review (F27). PROVEN.** "Share preview link" (`editor/shell/SiteMenu.tsx:203`) gives a link to the **current saved draft**, which keeps changing. "Send for review" (`editor/shell/SendForReview.tsx` header) freezes a **snapshot** for sign-off. Both mean "show the client" and nothing explains the difference. *Recommendation:* name them by outcome ("Share live draft link" / "Send a fixed version for approval") and add a one-line difference in each dialog.

**FS-26 · Undo across pages (F30). SUSPECTED (C1 C11).** One stack for all pages. ⌘Z on page B can undo an edit on page A without showing it, and component definitions, settings and CMS are not on ⌘Z. *Recommendation:* when an undo targets another page, switch to it or toast "Undid {label} on {page}". Bring component edits onto the stack (IA-02).

**FS-27 · Keyboard sheet advertises dead chords (F31). PROVEN for ⌘-click; `?` disputed.** `editor/canvas/controls/keyboardSheetRows.ts` lists the ⌘-click cycle (dead, FS-17). `?` *is* handled in code (`editor/shell/hooks/useEditorShortcuts.ts:62`), yet L W18 saw nothing, likely because of focus context. *Recommendation:* add a test that checks every sheet row against a real handler.

**FS-28 · Exit always lands on the Projects list (F33). PROVEN.** `editor/shell/StudioHeader.tsx:566-567`. Users who came in from a site's detail page lose their place. *Recommendation:* return to the referring dashboard page when there is one.

---

## 4. Owner decisions needed

| # | Question | Recommended answer |
|---|---|---|
| OD-1 | Styling model: should classes own styles (Webflow) or stay labels? | Decide now. If per-element styling stays, rename/move the class field (FS-05) this release and drop the "class" framing. If class styling is the goal, schedule it as its own arc. Do not ship the halfway state. |
| OD-2 | Should Esc commit or cancel inline text edits? | **Commit** (FS-01). Offer an explicit, undoable "Revert text". |
| OD-3 | Components: isolated master editing, or keep push-from-instance? | Keep push-from-instance for now, rename it honestly, and gate it to instance roots (FS-08). Isolated master editing goes in a later arc. |
| OD-4 | New page default: Blank or From template? | **Blank**, with a mode-aware button label (FS-09). |
| OD-5 | Should Preview run site scripts (interactions, tabs, sliders)? | **Yes**, in a scripts-allowed sandbox without same-origin access, so Preview equals publish (FS-07). |
| OD-6 | Save-conflict backup: file restore or server version? | **Server-side "keep my copy as a version"**, restorable from History. Drop the unrestorable download (FS-13). |
| OD-7 | Paste styles: honour the active breakpoint/state, or always base? | **Honour the ContextRow scope**, copying the full record (FS-04). |
| OD-8 | Create site: should every path open the editor? | **Yes** (FS-03). |

---

## 5. Not verified

- **Nothing was run.** No browser, no tests, no Composer probe in this pass. Live facts come from L (run on `main` @ `19f964d5e`, not this worktree), and C1/C2 probes from the same day.
- Not traced end to end: Add drawer click-insert placement, Brand ⌘Z reach, the 1a1a1a/#334155 colour source, hover loss in Preview (CSS vs export), the reason `?` failed live, site-password swallow, template reference-id output, Tabs/Modal runtimes, multi-select first-only writes (C3), recovery banner behaviour on this branch, the onboarding checklist content, comments on canvas, the `/review/<token>` page, and the ecommerce stub.
- Dashboard flows beyond create-site (templates gallery, AI generation, site detail) were not mapped. The dashboard's own "Generate with AI" option is out of scope.
- Phase 1 fix branch (`feat/phase1-s6-publish`) not assessed. FS-02 may already be fixed there.
- Severity is design judgment, not measured user impact.
