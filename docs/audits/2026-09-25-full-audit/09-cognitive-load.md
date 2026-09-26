# 09: Cognitive Load and Progressive Disclosure (Prompt 9)

**Scope:** how much the editor and dashboard put in front of the user at once, and whether secondary and advanced controls are held back until they are relevant. Surfaces covered: canvas toolbars (selection, inline text, floating footer), Inspector, left rail and panels (Add, Layers, Pages, Assets, CMS, Components, Brand), topbar and site menu, collaboration controls and presence, comments, Review, Publish, Issues, Settings, the canvas context menu and the dashboard nav.

This report covers only Prompt 9. Wiring, state, a11y and visual-consistency defects are noted in "Overlaps" and not audited here.

---

## Method and runtime status

**Code read** (all paths relative to `packages/editor/src/editor/` unless noted):
- **Shell:** `shell/StudioHeader.tsx`, `chrome-ui/Topbar.tsx`, `chrome-ui/IssueChip.tsx`, `chrome-ui/SaveStatus.tsx`, `shell/SiteMenu.tsx`, `shell/lifecycle.ts`, `shell/ReviewBar.tsx`, `shell/StudioPanels.tsx`, `shell/AquibraStudio.tsx`, `shell/StudioFooter.tsx`, `shell/PageTabBar.tsx`.
- **Rail and sidebar:** `rail/tabsConfig.ts`, `sidebar/LeftSidebar.tsx`.
- **Canvas:** `canvas/Canvas.tsx`, `canvas/CanvasFooterToolbar.tsx`, `canvas/overlays/CanvasOverlayGroup.tsx`, `canvas/overlays/CanvasBreadcrumb.tsx`, `canvas/controls/UnifiedSelectionToolbar.tsx` with `toolbar/*`, `canvas/controls/AiPromptPopover.tsx`, `canvas/menus/contextMenuRegistry.ts` with `actions/*`, `canvas/hooks/useCanvasContextMenu.ts`, `canvas/hooks/useCanvasInlineCommands.ts`, `canvas/hooks/useCanvasCommandPalette.ts`.
- **Inline text toolbar:** `panels/RichTextEditor.tsx`.
- **Inspector:** `inspector/ProInspector.tsx`, `inspector/tabs/InspectorTabContent.tsx`, `inspector/hooks/useInspectorSections.ts`, `inspector/config/elementProfiles.ts`, `inspector/sections/registry/element.tsx`, `inspector/renderer/featureFlags.ts`.
- **Panels:** `sidebar/tabs/build/BuildTab.tsx`, `sidebar/tabs/content/ContentTab.tsx`, `sidebar/tabs/content/ContentViews.tsx`, `design-system/ui/DesignSystemTab.tsx`, `design-system/ui/DesignTabFooter.tsx`, `design-system/state/DSModeContext.tsx`, `design-system/state/TokenRegistryContext.tsx`, `sidebar/tabs/settings/SettingsTab.tsx` with `constants.ts`, `sidebar/tabs/publish/PublishTab.tsx`, `sidebar/tabs/review/ReviewTab.tsx`, `sidebar/tabs/layers/LayersTab.tsx`, `sidebar/tabs/media/MediaTab.tsx`.
- **Collaboration:** `engine/collaboration/CollaborationManager.ts`, `canvas/hooks/useCollaboration.ts`.
- **Other:** `shared/utils/editorViewMode.ts`, `packages/dashboard/components/dashboard/shell/nav.ts`, `packages/shared/schemas/account.ts`, `prisma/schema.prisma`.

**What I ran:**
- **Scratchpad jsdom probes.** Two probe files ran through a scratchpad vitest config that extends `packages/editor/vitest.config.ts`. They are outside the repo and no repo file was changed. All 7 probe tests pass.
  - **`a09.probe.test.tsx`** (6 tests) measured:
    - CMS empty root: Sources, Variables and Conditions are absent.
    - Site menu: 21 rows.
    - Canvas footer toolbar: 14 buttons.
    - Topbar in the "changes requested" state: 9 controls, with the pill and the CTA both present.
    - `density`: comes only from the URL.
    - Inspector section counts per element profile.
  - **`brand.probe.test.tsx`** (1 test) put `StudioHeader` in a brand-dirty state and checked four things: the save pill is a button, clicking it cannot clear it, ‹ Exit navigates with no dialog, and `beforeunload` is not prevented.
- **Existing tests:** I read `StudioHeader.test.tsx` and `ContentTab.test.tsx` to reuse their harness shapes. I did not re-run the full suites; the Stage A inventory covers baseline suite status.

**NOT RUNTIME VERIFIED (no browser, no DB):**
- **Layout:** real on-screen stacking and pixel geometry of the bottom chrome (A09-2). The counts are from jsdom; the positions are read from CSS in code.
- **Inline toolbar:** what the sanitizer keeps from `execCommand("fontSize")` and the alignment and indent markup (A09-5).
- **Brand loss:** loss of staged Brand edits after a real navigation (A09-1). The probe shows no guard fires, and the code shows staging is in memory only until Apply, but no reload was performed.
- **Collaboration:** every collab finding. `FEATURE_COLLAB` is off in production.
- **Dashboard:** any dashboard surface beyond reading the nav config.

---

## Output table: disclosure classification

**Frequency:** H = most sessions, M = some sessions, L = rare or expert.

**Current exposure:**
- AV: Always Visible
- CX: Contextual
- SC: Secondary
- AD: Advanced
- MM: More Menu
- PO: Popover
- DW: Dedicated Workspace
- RM: Remove

| Feature / control | File | Current exposure | Freq | Context relevance | Recommended disclosure | Priority |
|---|---|---|---|---|---|---|
| **Topbar:** Exit, site name, save pill, CTA, ⋯ | `chrome-ui/Topbar.tsx:206-349` | AV (9 controls measured) | H | Always | AV, keep | Good as-is |
| **Topbar:** Issue chip at zero issues | `chrome-ui/IssueChip.tsx:8-15,101-121` | AV | M | Gates publish | AV, keep (deliberate "all-clear" anchor) | Good as-is |
| **Topbar:** Quick preview, Comments toggle | `Topbar.tsx:256-275` | AV | M | Always | AV, keep | Good as-is |
| **Topbar:** review pill **and** CTA "Open feedback" **and** ReviewBar row | `StudioHeader.tsx:724-744,685-695`; `ReviewBar.tsx:122-168` | AV ×3 while a round is open | M | Only during a round | One CX signal: CTA plus bar; pill becomes status-only | P2 (A09-7) |
| **Topbar:** presence avatars | `StudioHeader.tsx:771-786` | CX (flag and connected) | L | Collab only | CX, keep | Good as-is |
| **Site menu ⋯:** 21 rows | `shell/SiteMenu.tsx:190-308` | MM | mixed | mixed | MM, trimmed to site-scoped rows; dashboard hand-offs grouped under one "Open in dashboard ›" | P2 (A09-6) |
| **Site menu:** Brand, Review, Components rows | `SiteMenu.tsx:203,239-249` | MM, duplicating the rail, pill and ⇧A | M | — | RM from menu (Brand); keep Review only as the fallback door | P2 (A09-6) |
| **Site menu:** Site health, Activity log (unlabelled group, new tab) | `SiteMenu.tsx:220-229` | MM | L | Dashboard data | SC under "Open in dashboard ›" | P3 (A09-6) |
| **Rail:** Add, Layers, Pages, Assets, CMS, Brand | `rail/tabsConfig.ts:359-361` | AV (6) | H–M | Always | AV, keep | Good as-is |
| **Add:** "⌥ Paste HTML…" pinned row | `sidebar/tabs/build/BuildTab.tsx:247-249` | AV (pinned, even during search) | L | Expert | AD, moved into the search empty-state or the ⋯ of the panel header | P3 (A09-11) |
| **Add:** tips carousel, transition callout, purpose line | `BuildTab.tsx:200-205,221,250-257` | AV (3 helper bands) | L after the first session | Onboarding | CX until dismissed once; one band max | P3 (A09-11) |
| **Assets quick panel** | `sidebar/tabs/media/MediaTab.tsx` | SC launcher over a DW library | M | — | keep; three full media surfaces are A01/A02 | Overlap |
| **CMS:** Sources, Variables, Conditions rows | `sidebar/tabs/content/ContentViews.tsx:200-240,275-278` | Hidden when the CMS is empty; AV at root once any collection exists | L | Variables are useful before any collection exists | SC: always reachable (one "Data ›" row), never at root level | P2 (A09-8) |
| **Components** (off-rail panel, Add group, Brand "Component styles", ⋯ row, ⇧A) | `tabsConfig.ts:154-173`; `DesignSystemTab.tsx:152-158` | 4 doors | M | — | covered by A02-8 and A01-10 | Overlap |
| **Brand:** root of 9 drill-in rows plus Beginner/Pro toggle | `design-system/ui/DesignSystemTab.tsx:644-862` | DW-in-drawer, drill-in | M | Brand work | keep; in Beginner, move Classes, Lint and Import/export under "More" | P3 (A09-15) |
| **Brand:** staged edits needing an explicit Save | `DesignTabFooter.tsx:20`; `StudioHeader.tsx:560-585` | separate commit model | M | — | One commit model, or honest global state | **P1 (A09-1)** |
| **Pages:** PageTabBar (+, rename, duplicate, delete) **and** the Pages panel | `shell/PageTabBar.tsx:357`; `StudioPanels.tsx:536` | AV and CX | H | Always | Keep the tab bar for switching; move create and destroy to the panel | P3 (A09-13) |
| **Layers panel** | `sidebar/tabs/layers/LayersTab.tsx:170-182` | CX | M | — | keep | Good as-is |
| **Selection toolbar:** parent, name ▾, +, duplicate, ⋯, delete, ✨ | `canvas/controls/UnifiedSelectionToolbar.tsx:279-310` | CX (single selection) | H | Selection | keep; low-frequency items are already in ⋯ | Good as-is |
| **Selection toolbar:** ✨ "Edit with AI" **and** inspector "✦ AI" chip | `UnifiedSelectionToolbar.tsx:302-320`; `inspector/ProInspector.tsx:398-407` | AV ×2 for one selection, 2 different AI UIs | M | Selection | One AI entry per selection | P2 (A09-4) |
| **Inline text toolbar:** 18 controls | `panels/RichTextEditor.tsx:40-92`; `CanvasOverlayGroup.tsx:334-355` | CX (while editing text), all 18 at once | Bold/italic/link H; justify/indent/strike/7-step size L | Editing | CX core (B, I, link, style); advanced in an overflow; remove what duplicates Inspector Typography | P2 (A09-5) |
| **Canvas footer:** undo, redo, 4 breakpoints | `canvas/CanvasFooterToolbar.tsx:287-336` | AV | H | Always | AV, keep | Good as-is |
| **Canvas footer:** 6 overlay toggles as words, plus Inspector toggle | `CanvasFooterToolbar.tsx:338-386` | AV (14 buttons in the bar) | L | Diagnostics | PO: one "View ▾" popover with the 6 toggles and their chords | P2 (A09-2) |
| **Canvas footer:** DeviceFrameToggle | `canvas/Canvas.tsx:838-842` | AV | L | Mobile preview | into the "View ▾" popover | P3 (A09-2) |
| **Canvas breadcrumb** (bottom-centre) | `canvas/overlays/CanvasBreadcrumb.tsx:51-59`; `CanvasOverlayGroup.tsx:371-373` | CX, stacked above the footer bar | M | Selection | merge with the StudioFooter selection readout | P2 (A09-3) |
| **StudioFooter:** "Type · Name", size, "Device · zoom" | `shell/StudioFooter.tsx:1-30` | AV | M | Status | keep zoom; drop the duplicate device and identity | P2 (A09-3) |
| **Inspector header:** pick, parent, ✦ AI, bind, Bound chip, ⋯ | `ProInspector.tsx:361-442` | CX | M | Selection | keep; parent is duplicated elsewhere (A09-3) | P3 |
| **Inspector context row:** Scope, Breakpoint, State, Detach | `ProInspector.tsx:446-470` | CX | M | Selection | keep; Breakpoint duplicates the footer switcher (A09-3) | P3 |
| **Inspector sections:** 12–16 per profile, auto-open only when a value is set | `inspector/config/elementProfiles.ts:47-170`; `hooks/useInspectorSections.ts:161-214` | CX, collapsed by default | M | Selection | keep; good disclosure rule | Good as-is |
| **Inspector:** "CSS classes" section for every element | `inspector/sections/registry/element.tsx:50-61` | CX, all users | L | Expert | AD (move with All CSS behind Pro/dev) | P3 (A09-9) |
| **Inspector:** "All CSS" raw editor | `element.tsx:63-75`; `renderer/featureFlags.ts:35` | AD (localStorage flag) | L | Expert | keep | Good as-is |
| **Inspector:** density "fewer" simplified mode | `shared/utils/editorViewMode.ts:93`; `inspector/tabs/InspectorTabContent.tsx:175,230-247` | URL-only, no UI | — | Beginners | a real preference, or RM | P2 (A09-9) |
| **Inspector:** Link section on a button (its primary job), 10th of 14 | `elementProfiles.ts:152-170` | CX, low in the scroll | H for buttons | Selection | promote for button, link, cta | P2 (A09-9, PRODUCT DECISION) |
| **Context menu:** Copy, Paste, Duplicate, Delete under "Edit ›" | `canvas/menus/contextMenuRegistry.ts:42-71`; `actions/editActions.ts:13-133` | nested SC | H | Selection | top level | P2 (A09-10) |
| **Context menu:** Save as component, Reveal in layers, Lock, Add interaction, Select parent | `actions/standaloneActions.ts:61-180` | top level | L | Selection | SC or grouped | P2 (A09-10) |
| **Context menu:** "Improve with AI" | `actions/standaloneActions.ts:37-46`; `canvas/hooks/useCanvasContextMenu.ts:108-115` | never rendered (no handler supplied) | — | — | wire it or remove it | Overlap (A09-4) |
| **Collab:** "Start collaboration" (⋯) and ⌘⇧P "Start collaboration session" | `StudioHeader.tsx:542-553,848`; `canvas/hooks/useCanvasCommandPalette.ts:187-195` | MM and a hidden palette | L | Flag-gated | one door, plus a leave control | P3 (A09-12) |
| **Comments** toggle, pins | `Topbar.tsx:268-272` | AV | M | Team work | keep | Good as-is |
| **Publish:** CTA (state-dependent verb) | `shell/lifecycle.ts:141-251` | AV, one verb | H | Always | keep | Good as-is |
| **Publish panel, history, unpublish, export** | `SiteMenu.tsx:204-211` | MM | L | — | keep in MM | Good as-is |
| **Issues panel** | `AquibraStudio.tsx:600-620` | PO from the chip | M | — | keep (geometry is A04-5) | Overlap |
| **Settings:** 16 rows in 5 groups including "Advanced", with search | `sidebar/tabs/settings/constants.ts`; `SettingsTab.tsx:79-86` | DW (full page) | L–M | — | keep | Good as-is |
| **Preview family:** Quick preview, Enter view mode, Share preview link, "Wide (preview width)" | `Topbar.tsx:258`; `SiteMenu.tsx:257-278`; `CanvasFooterToolbar.tsx:319` | AV, MM, MM, AV | M | — | rename so "preview" means one thing | P3 (A09-14) |
| **Dashboard nav:** 6 items, plus the ecosystem nav | `packages/dashboard/components/dashboard/shell/nav.ts` | AV | H | Always | keep | Good as-is |

**Measured counts from the jsdom probes:**
- Topbar in the "changes requested" state: 9 controls.
- Site menu with every door supplied: 21 rows.
- Canvas footer bar: 14 buttons, plus the DeviceFrameToggle.
- Inline text toolbar: 18 controls (counted from `RichTextEditor.tsx`; not rendered).
- Inspector profile lengths: container 16, flex 14, button 14, heading 13, input 13, image 12.

With one element selected, the always-visible or contextual interactive controls outside the Inspector body and the open drawer add up to about 50:
- topbar ≈ 9
- rail 6
- selection toolbar 7
- breadcrumb segments
- footer bar 15
- page tabs n + 1
- status bar ≈ 3

---

## Findings

### P0 — IMMEDIATE FIX REQUIRED

None. No cognitive-load finding falls into the immediate-fix class.

### P1

#### A09-1 · Four different commit models. Brand's staged edits make the topbar "Unsaved changes" pill a Save button that cannot save them, and both exit guards ignore them.

- **Finding:** The editor asks the user to hold four save models in their head:
  1. **Canvas:** autosaves on a 1000 ms debounce.
  2. **Brand:** stages its edits until an explicit Save (`APPLY_CHANGES_LABEL = "Save"`).
  3. **Settings screens:** buffer edits behind Save/Cancel. Domains, Forms and Integrations are the exception and apply immediately.
  4. **CMS records:** use a per-record savebar.

  The global save pill merges the Brand state in but cannot act on it. With staged Brand edits:
  - the pill reads "Unsaved changes" and becomes a button;
  - clicking it runs the project save, which does not touch Brand staging, so the pill stays "Unsaved changes";
  - ‹ Exit navigates immediately with no dialog;
  - `beforeunload` is not prevented.

  Staged token edits exist only in memory until Apply. Leaving therefore discards them silently, after the chrome showed a Save control that did nothing.
- **Severity:** P1. This is loss of uncommitted work under a misleading affordance. It is not persisted-data corruption, so it is not in the P0 class.
- **File:**
  - `packages/editor/src/editor/shell/StudioHeader.tsx:416-442` (`guardNavigation`)
  - `StudioHeader.tsx:477-502` (`beforeunload`)
  - `StudioHeader.tsx:560-585` (`brandDirty` feeds `save`)
  - `StudioHeader.tsx:768` (`onSave`)
  - `chrome-ui/SaveStatus.tsx:106,144` (actionable when `unsaved`)
  - `design-system/state/TokenRegistryContext.tsx:8-11,194-224` (persist only "after apply")
  - `design-system/ui/DesignSystemTab.tsx:373-387` (emits brand dirty)
- **Symbol:** `StudioHeader.guardNavigation`, the `onBefore` handler, the `save` derivation, `SaveStatus`.
- **Evidence:**
  - **Code.** `guardNavigation` checks `offline && isDirty`, `isDirty || saving || error`, and `totalPendingMirrors()`. It never checks `brandDirty`. The `beforeunload` handler returns early when `!isDirty && saveStatus !== "saving" && stranded === 0`. The `save` derivation reads `isDirty || brandDirty ? "unsaved"`. The comment at `DesignSystemTab.tsx:378-381` says the brand edit "deliberately does NOT raise the project's dirty flag".
  - **Probe** (`brand.probe.test.tsx`, jsdom):

    ```
    BRAND1 pillIsButton true
    BRAND2 onSaveCalls 1 stillUnsaved true
    BRAND3 navigatedWithoutDialog 1 dialog false
    BRAND4 beforeunloadPrevented false
    ```

- **Expected behavior:** One of two:
  - one commit model, where Brand autosaves like the canvas (with its Review modal kept as an optional diff); or
  - the global chrome treats staged Brand work as its own state. The pill is not a Save button for work it cannot save; it deep-links to Brand's Save. The exit and unload guards include `brandDirty`, and the Settings and CMS drafts too.
- **Root cause:** Brand staging lives in `TokenRegistryProvider`, below the header, and is announced over the bus as display-only state. The header's action and guard logic was written for project dirtiness only.
- **Affected modules:** Brand, Topbar save pill, exit dialog, Settings (the same class; see A04-2), CMS record drafts (see A04-10).
- **Recommendation:** Decide the commit model first (see PRODUCT DECISION 1). Until then:
  - make the pill's click target depend on which store is dirty;
  - add `brandDirty` to both guards.

  The fix is shared with A04-2 and A04-10: one registry of "uncommitted work" sources that the pill and both guards read.
- **Status:** VERIFIED in code and by the jsdom probe. The real data loss after navigation is NOT RUNTIME VERIFIED in a browser.

### P2

#### A09-2 · The canvas foot stacks four horizontal bars, and six low-frequency overlay toggles are permanent, word-labelled buttons

- **Finding:** With an element selected, the canvas foot has four bars stacked bottom to top:
  1. the StudioFooter status bar;
  2. the PageTabBar;
  3. the floating footer toolbar: undo, redo, four breakpoints, Snap Guides, Spacing, Grid, Rulers, Badges, X-Ray, Inspector, help, plus the DeviceFrameToggle beside it;
  4. the CanvasBreadcrumb, lifted to `bottom-14` so it clears the toolbar.

  The six overlays are diagnostic view preferences, used rarely. Each has a chord. They take the most horizontal space in the bar, and the bar wraps onto a second row at narrower widths (`CanvasFooterToolbar.tsx:132-139`, a comment reports a 1280 px wrap).
- **Severity:** P2
- **File:**
  - `canvas/CanvasFooterToolbar.tsx:141-144,338-386`
  - `canvas/Canvas.tsx:811-842`
  - `canvas/overlays/CanvasBreadcrumb.tsx:51-59`
  - `shell/StudioPanels.tsx:534-536`
  - `shell/AquibraStudio.tsx` (`StudioFooter` mount)
- **Symbol:** `CanvasFooterToolbar`, `OverlayButton`, `CanvasBreadcrumb`, `PageTabBar`, `StudioFooter`
- **Evidence:** The probe rendered 14 buttons: `["Undo","Redo","Wide …","Desktop …","Tablet …","Mobile …","Snap Guides","Spacing","Grid","Rulers","Badges","X-Ray","Inspector","Show keyboard shortcuts …"]`. Every overlay is `OverlayButton` with a visible text label.
- **Expected behavior:** Keep undo, redo and the breakpoint switcher visible. Put the six overlays, Device frame and the Inspector toggle behind one "View ▾" popover that shows their chords. Merge the breadcrumb and the status-bar identity (see A09-3), leaving at most two bars at the foot.
- **Root cause:** Board 199:205 draws the overlays as words. The zoom group was moved out to make room for them, rather than asking whether they need permanent exposure at all.
- **Affected modules:** Canvas, shell footer, Pages tab bar.
- **Recommendation:** Popover disclosure for the overlays. This is a PRODUCT DECISION against the board (decision 2).
- **Status:** VERIFIED for control count (probe). Stacking and geometry are NOT RUNTIME VERIFIED (read from CSS).

#### A09-3 · The same selection and breakpoint facts appear three or four times on screen at once

- **Finding:** For one selected element, the user sees each fact several times.
  - **Identity and ancestry, four places:**
    - selection-toolbar name with an ancestor ▾ (`ToolbarNavSection`);
    - Inspector header name plus "Select parent";
    - the canvas breadcrumb;
    - the StudioFooter "Type · Name".
  - **Parent selection, five doors visible at once:** toolbar parent, toolbar ancestor ▾, Inspector parent, breadcrumb, context menu "Select parent".
  - **Active breakpoint, three places:**
    - the footer `BreakpointSwitcher`;
    - the Inspector `BreakpointPill`, which also changes the device;
    - the StudioFooter "Desktop · 100%".
- **Severity:** P2
- **File:**
  - `canvas/controls/UnifiedSelectionToolbar.tsx:280-289`
  - `inspector/ProInspector.tsx:361-393,454-458`
  - `canvas/overlays/CanvasOverlayGroup.tsx:371-373`
  - `shell/StudioFooter.tsx:1-30`
  - `canvas/CanvasFooterToolbar.tsx:318-331`
- **Symbol:** `ToolbarNavSection`, `ProInspector` header and context row, `CanvasBreadcrumb`, `StudioFooter`, `BreakpointPill`
- **Evidence:** All of these render together when `selectedIds.length === 1 && !isResizing` (`CanvasOverlayGroup.tsx:294`) and `!isDragOver && selectedId && !isResizing` (`:371`). The Inspector renders them whenever there is a selection.
- **Expected behavior:** One canonical place for each fact:
  - identity and ancestry: the breadcrumb, or the toolbar;
  - breakpoint: the footer switcher, with the Inspector pill kept only as a read-out of "editing at Tablet".
- **Root cause:** Each surface was conformed to its own board. Nothing owns the whole-screen redundancy budget.
- **Affected modules:** Canvas, Inspector, shell footer.
- **Recommendation:**
  - drop the StudioFooter identity text, or the breadcrumb;
  - make the Inspector `BreakpointPill` a status indicator, not a second switcher.
- **Status:** VERIFIED in code. Not rendered together in a browser.

#### A09-4 · Two AI buttons for the same selection open two different AI experiences, and the "Improve with AI" context-menu entry is silently absent

- **Finding:** With one element selected, the selection toolbar's ✨ "Edit with AI" and the Inspector header's "✦ AI" chip are visible together.
  - ✨ opens `AiPromptPopover`: an inline prompt, then a diff, then accept.
  - ✦ AI emits `ui:switch-tab {tab:"ai"}`, which replaces the whole Inspector with the chat `AITab` (`StudioPanels.tsx:340-343`).

  Further AI doors: the Inspector empty state, the multi-select toolbar, the `I` key, ⌘K, and the Brand "Component styles" AI (flag-gated). The v3 IA's context-menu door never renders: `isVisible: ({openAI}) => Boolean(openAI)`, and `AquibraStudio` never passes `onAIRequest` to `StudioPanels`, so `openAI` is always undefined.
- **Severity:** P2
- **File:**
  - `canvas/controls/UnifiedSelectionToolbar.tsx:302-320`
  - `inspector/ProInspector.tsx:398-407`
  - `inspector/components/InspectorEmptyState.tsx:90`
  - `inspector/components/MultiSelectToolbar.tsx:247`
  - `canvas/menus/actions/standaloneActions.ts:37-46`
  - `canvas/hooks/useCanvasContextMenu.ts:108-115`
  - `shell/StudioPanels.tsx:78,174,525`
  - `shell/AquibraStudio.tsx:489-570` (no `onAIRequest` prop)
- **Symbol:** `UnifiedSelectionToolbar`, `ProInspector` AI chip, the `improve-with-ai` action
- **Evidence:** Read directly in the code. A grep for `onAIRequest` finds no supplier in `AquibraStudio.tsx`.
- **Expected behavior:** One AI entry per selection context, opening one experience. The other doors route to it.
- **Root cause:** AI entry points accumulated per board. Popover and chat were each boarded as "the" AI surface.
- **Affected modules:** Canvas, Inspector, AI panel.
- **Recommendation:** Pick one selected-element AI model (PRODUCT DECISION 3). Remove the second chip from the always-visible chrome. Wire the context menu or delete its row.
- **Status:** VERIFIED in code. This dedupes with A03-3, A04-4 and A02-13, which cover navigation and surface; this finding adds the simultaneous-exposure angle and the dead context-menu row.

#### A09-5 · The inline text toolbar shows 18 controls at once, several duplicating the Inspector with different semantics

- **Finding:** Editing text floats 18 controls in one row:
  - text style (P, H1–H6);
  - font size (seven legacy steps, 10–48 px);
  - B, I, U, S;
  - bullet and numbered lists;
  - four alignments, including Justify;
  - outdent and indent;
  - text colour and highlight;
  - link;
  - clear.

  Alignment, size and colour are also Inspector Typography properties. Those are element styles, breakpoint-aware and token-bindable. The toolbar writes inline markup through `document.execCommand` instead. So one property has two editors with different reach, and the user cannot tell which one wins.
- **Severity:** P2
- **File:**
  - `panels/RichTextEditor.tsx:40-114,216-240`
  - `canvas/hooks/useCanvasInlineCommands.ts:126-160`
  - `canvas/overlays/CanvasOverlayGroup.tsx:334-355`
- **Symbol:** `RichTextEditor`, `handleInlineCommand`
- **Evidence:** `execCommand` handles `justify*`, `indent`, `outdent`, `fontSize` and the colours (`useCanvasInlineCommands.ts:138-160`). The comment at `:161-167` itself counts "a toolbar of eighteen controls".
- **Expected behavior:**
  - Contextual core: style, B, I, link, and clear if needed.
  - Advanced formatting: behind an overflow.
  - Block-level properties (alignment, size, colour): left to the Inspector, or shown as the Inspector's own values.
- **Root cause:** A general rich-text toolbar was reused as the canvas inline editor.
- **Affected modules:** Canvas inline edit, Inspector Typography, Brand tokens.
- **Recommendation:** Trim to about 6 controls plus a "…" overflow. Route alignment, size and colour to element styles.
- **Status:** PARTIAL. The control count and routing are VERIFIED in code. What the sanitizer keeps (`<font size>` and alignment styles) is NOT RUNTIME VERIFIED.

#### A09-6 · The ⋯ site menu is a 21-row overflow that mixes site operations, duplicate doors and five new-tab dashboard exits

- **Finding:** With every door supplied, the menu has 21 rows:
  - **Site:** 7 rows.
  - **An unlabelled group:** Site health, Activity log.
  - **Build:** Templates, Components, Brand, Plugins.
  - **Share:** 4 rows.
  - **Workspace:** Invite teammates, Account settings.
  - **Footer:** Getting started, Keyboard shortcuts.

  Several rows duplicate an always-visible door:
  - "Brand" is the rail item (its own comment says "the SAME destination");
  - "Review" is the review pill or CTA;
  - "Components" is ⇧A and the Add-panel group.

  Five rows (Site health, Activity log, Share preview link, Invite teammates, Account settings) open the dashboard in a new tab through `window.open`, with no signifier that they leave the editor. "Activity log" also collides with the editor's own undo "Activity" (A02-17).
- **Severity:** P2
- **File:** `shell/SiteMenu.tsx:117-119,190-308`
- **Symbol:** `SiteMenu`
- **Evidence:** Probe output: `PROBE2 21 ["Site settings…","Version history…","Review","Publish panel","Publish history","Unpublish site…","Export code","Site health","Activity log","Templates","Components⇧A","Brand","Plugins","Enter view mode","View live site","Copy live URL","Share preview link","Invite teammates","Account settings","Getting started","Keyboard shortcuts…"]`
- **Expected behavior:** Roughly 12 editor-scoped rows. Dashboard hand-offs collected under one "Open in dashboard ›" submenu with an external-link glyph. No row that duplicates the rail.
- **Root cause:** The menu is the catch-all for everything the six-item rail dropped (`tabsConfig.ts:344-352`), plus board 642:3401 additions.
- **Affected modules:** Topbar, rail, dashboard hand-offs.
- **Recommendation:**
  - remove "Brand";
  - label or merge the unlabelled group;
  - collapse the dashboard exits;
  - keep "Review" only as the fallback door the comment at `SiteMenu.tsx:45-55` justifies.
- **Status:** VERIFIED (probe).

#### A09-7 · An open review round is signalled by three controls that open the same panel

- **Finding:** With `changes-requested` on an approval workspace, the user sees three controls stacked within about 100 px, all landing on the Review panel:
  1. the topbar pill "Changes requested", which opens Review;
  2. the topbar CTA, which the lifecycle labels "Open feedback" and which also opens Review;
  3. the full-width ReviewBar row: "N open", Next ›, Compare, Re-send.

  Site menu › Review makes a fourth door.
- **Severity:** P2
- **File:**
  - `shell/StudioHeader.tsx:685-695,724-744`
  - `shell/lifecycle.ts:224-231`
  - `shell/ReviewBar.tsx:122-168`
  - `chrome-ui/Topbar.tsx:249-251`
- **Symbol:** `REVIEW_PILL`, `handleCtaClick`, `deriveLifecycleState`, `ReviewBar`
- **Evidence:** The probe rendered the Topbar with the pill and `ctaLabel="Open feedback"` and got both: `["‹ Exit","Live at …","Changes requested",…,"Open feedback","Site menu"]`. The ReviewBar renders for `PENDING` and `CHANGES_REQUESTED` rounds (`ReviewBar.tsx:52,122`).
- **Expected behavior:** During a live round, the ReviewBar is the working surface and the CTA carries the next verb. The pill steps down to non-interactive status, or is hidden while the bar is visible.
- **Root cause:** The pill, the CTA and the bar were each designed as the complete answer on separate boards.
- **Affected modules:** Topbar, ReviewBar, Review panel.
- **Recommendation:** Hide the pill (or make it text-only) while `ReviewBar` renders.
- **Status:** VERIFIED for pill and CTA (probe). The ReviewBar is VERIFIED in code.

#### A09-8 · The CMS empty state hides every Data door, and once a collection exists it shows the advanced Data rows at root level

- **Finding:** The same panel gets disclosure wrong in both directions.
  - **Empty CMS:** with no collections, sources, variables or conditions, `RootView` returns only the empty state and "Create a collection". Sources, Variables (`{{site.*}}`) and Conditions are unreachable. A user who wants a site variable has to create a collection first. Nothing else opens those views: the only `setView({kind:"variables"|…})` callers are the root rows (`ContentTab.tsx:249-251`).
  - **With one collection:** the three Data rows sit at root level with the same weight as collections. That includes Sources, a raw JSON paste, and Conditions.
- **Severity:** P2
- **File:** `sidebar/tabs/content/ContentViews.tsx:200-240,272-279`; `sidebar/tabs/content/ContentTab.tsx:245-252`
- **Symbol:** `RootView`
- **Evidence:** Probe output: `PROBE1 {"sources":false,"variables":false,"conditions":false,"createCta":true}`
- **Expected behavior:** A single secondary "Data ›" row (Sources, Variables, Conditions) that is always reachable, including from the empty state, and never at root weight.
- **Root cause:** The empty-state early return was conformed to board 149:7 without accounting for the non-collection features.
- **Affected modules:** CMS panel, `{{site.*}}` variables, element conditions.
- **Recommendation:** Add a quiet "Data sources & variables ›" link to the empty state, and fold the three rows into it at root.
- **Status:** VERIFIED (probe and code).

#### A09-9 · The Inspector's only simplified mode is URL-only, and expert or secondary sections have no tiering

- **Finding:**
  - **The "fewer" density exists but is unreachable.** It keeps only the first three visible sections and shows "Show all controls". `density` comes only from `?density=fewer`. There is no UI toggle. `UserPreference.editorDensity` exists in Prisma and in `updatePreferencesSchema`, but nothing reads it (grep).
  - **Everyone sees every applicable section.** That is 12–16 per profile, including "CSS classes" on every element.
  - **The button profile buries the link.** "Link", the reason a button exists, is 10th of 14, after Effects, Interactions and Animation.
  - **The sections-apply footer is good disclosure,** but it is the only tiering. `tier` (`primary` / `secondary` / `tertiary`) is computed by position and affects only visual weight.
- **Severity:** P2
- **File:**
  - `shared/utils/editorViewMode.ts:22,93`
  - `inspector/tabs/InspectorTabContent.tsx:173-185,230-247`
  - `inspector/config/elementProfiles.ts:152-170`
  - `inspector/sections/registry/element.tsx:50-61`
  - `prisma/schema.prisma:1295`
  - `packages/shared/schemas/account.ts:95`
- **Symbol:** `getEditorViewMode().density`, `InspectorTabContent`, `BUTTON_PROFILE`
- **Evidence:**
  - Probe output: `PROBE5 full fewer` (without and with the URL parameter).
  - Probe output: `PROBE6 {"container":16,"heading":13,"button":14,"image":12,"input":13,"flex":14,"button.linkIndex":9}` (zero-based index 9, so 10th).
- **Expected behavior:** Either make density a real per-user preference, surfaced in the Inspector ⋯ or in account settings and reading `editorDensity`, or remove the mode and the column. Put "CSS classes" at an advanced tier. Promote Link for link, button and cta.
- **Root cause:** The density mode was built for an "invited content editor" audience that the code comment says never materialized. The profile order was copied from the boards.
- **Affected modules:** Inspector, account preferences, Prisma.
- **Recommendation:** PRODUCT DECISION 4 (keep and expose, or delete). Link order is PRODUCT DECISION 5, because board 807:8567 draws Link low.
- **Status:** VERIFIED (probe and code).

#### A09-10 · The context menu nests the highest-frequency actions and promotes low-frequency ones

- **Finding:** The right-click top level puts four submenus first: Edit ›, Insert ›, Layout › and Quick Style ›. Standalone rows follow: Replace with block, Bind to CMS, Add interaction, Save as component, Reveal in layers, Select parent, Group or Ungroup, Lock or Unlock. Copy, Cut, Paste, Duplicate and Delete, the actions a right-click is most used for, are one level deep under "Edit ›".
- **Severity:** P2
- **File:**
  - `canvas/menus/contextMenuRegistry.ts:42-100`
  - `canvas/menus/actions/editActions.ts:13-133`
  - `canvas/menus/actions/standaloneActions.ts:25-180`
- **Symbol:** `mainMenuItems`, `getContextMenuActions`
- **Evidence:** `getContextMenuActions` returns `[...filterActions(mainMenuItems), ...filterActions(standaloneActions)]`, and `editSubmenu` is a submenu of `edit-group`.
- **Expected behavior:** Edit actions flat at the top, grouped by separators. Insert, Layout and Quick Style as submenus. The rare standalone rows grouped under a separator, or moved into a submenu.
- **Root cause:** A submenu taxonomy was applied uniformly, without weighting by frequency.
- **Affected modules:** Canvas context menu.
- **Recommendation:** Flatten `editSubmenu` into the top level.
- **Status:** VERIFIED in code. Not rendered.

### P3

#### A09-11 · The Add panel carries four permanent helper and advanced bands

- **Finding:** The Add panel always carries four bands on top of the insert list:
  - a purpose line;
  - a TransitionCallout;
  - a tips carousel with prev, next, dots and dismiss;
  - a pinned "⌥ Paste HTML…" row, visible even during search.

  Paste HTML is an expert action that needs clipboard-read permission.
- **File:** `sidebar/tabs/build/BuildTab.tsx:200-205,221,246-258`
- **Evidence:** Read in code. The `bld-panel-bottom` band is unconditional.
- **Recommendation:** Keep at most one onboarding band, dismissible for good. Move Paste HTML into the panel header ⋯ or the search empty state.
- **Status:** VERIFIED in code.

#### A09-12 · Collaboration has two start doors that behave differently, and no way to leave (flag-gated)

- **Finding:** When `FEATURE_COLLAB` is on, the two start doors disagree:
  - **Site menu "Start collaboration":** starts with the user's own name and toasts on failure.
  - **⌘⇧P "Start collaboration session":** starts with a hard-coded `"Editor"` name and swallows errors (`.catch(() => {})`).

  There is no stop or leave control anywhere. `useCollaboration` exposes `leaveRoom`, but `StudioHeader` does not read it (`StudioHeader.tsx:210`).
- **File:**
  - `shell/StudioHeader.tsx:210,542-553,848`
  - `canvas/hooks/useCanvasCommandPalette.ts:187-195,326`
  - `canvas/hooks/useCollaboration.ts:180-199`
- **Evidence:** Read in code. A grep for `leaveRoom` finds only the hook.
- **Recommendation:**
  - keep one start door (the menu), with a matching "Leave session";
  - drop the palette row, or make it call the same handler.
- **Severity note:** P3 today because the flag is off in production. It becomes P2 if the flag is enabled. Hand to Agent D.
- **Status:** VERIFIED in code. NOT RUNTIME VERIFIED.

#### A09-13 · Page create and destroy live in two always-reachable surfaces

- **Finding:** The canvas-foot PageTabBar offers +, rename, duplicate and delete while the Pages panel offers the same set. The tab bar stays visible even while the Pages drawer is open.
- **File:** `shell/PageTabBar.tsx:357,371`; `shell/StudioPanels.tsx:536`
- **Recommendation:** Keep the tab bar for switching (high frequency). Move create and destroy to the Pages panel, or keep + only. This is a PRODUCT DECISION.
- **Status:** VERIFIED in code.

#### A09-14 · "Preview" names four different things

- **Finding:** Four controls use the word:
  - Quick preview (the eye icon in the topbar);
  - "Enter view mode" (⋯ menu);
  - "Share preview link" (⋯ menu, opens a dashboard tab);
  - "Wide (preview width, uses Desktop styles)" (a breakpoint in the footer).
- **File:** `chrome-ui/Topbar.tsx:258-266`; `shell/SiteMenu.tsx:257-278`; `canvas/CanvasFooterToolbar.tsx:319-322`
- **Recommendation:** Reserve "preview" for one concept and rename the others.
- **Status:** VERIFIED in code (the Wide label is from the probe output).

#### A09-15 · Brand's Beginner mode hides counts, not rows

- **Finding:** Beginner mode, the default (`DSModeContext.tsx:32-38`), still lists all 9 destinations. That includes Classes, Component styles, Lint and Import/export. Only their counts are dropped (`DesignSystemTab.tsx:352-354`).
- **Recommendation:** In Beginner, show Tokens, Typography, Starters and Colour mode, and put the rest under "More".
- **Status:** VERIFIED in code.

---

## Good as-is (verified in code)

- **Topbar:** a bounded cluster of about 9 controls. The `extra` slot was removed on purpose, and a test (`StudioHeader.test.tsx`, "does not carry …") guards against drift. Role and view branching lives in the container.
- **Publish CTA:** a single, state-dependent verb from `deriveLifecycleState`, so the topbar never shows Publish and Send for review side by side. It withholds the verb when nothing is waiting (`lifecycle.ts:245-250`).
- **Issue chip:** always visible, as an "all clear" anchor with a stable position (`IssueChip.tsx:8-15`). This is a deliberate exception to "show only when relevant", and it is justified.
- **Inspector sections:** open by default only when they carry a value, with a "N of M sections apply" footer. "All CSS" sits behind a dev flag. Per-type collapse memory is kept in `localStorage`.
- **Selection toolbar:** compact, with low-frequency actions (Copy, Wrap, Bring forward, Send backward) already in its ⋯.
- **Context menu:** layout actions are contextual (`isContainer()`), and Group and Ungroup appear only when they apply.
- **Brand panel:** a drill-in root with the BrandPreview. The strips that used to consume about 300 px above the fold are gone, and Beginner/Pro is persisted.
- **Settings:** a full-page workspace with 16 rows in 5 labelled groups (including "Advanced"), with search.
- **View mode** (`?view=readonly`): strips the rail, drawer, inspector, overlays and every build door.
- **Collaboration:** the whole surface is hidden when the flag is off (`StudioHeader.tsx:221-225,771-786`).
- **Dashboard sidebar:** 6 items, with the ecosystem pages split into their own top nav.

## Product decisions required

1. **Commit model (A09-1).** Should Brand (and Settings) autosave like the canvas, or keep staging with honest global state? This decides the fix shape for A09-1, A04-2 and A04-10.
2. **Overlay toggles (A09-2).** Behind a "View" popover, against board 199:205?
3. **Selected-element AI (A09-4).** Inline popover or chat panel: which is the one model?
4. **Inspector density (A09-9).** Ship a real simplified mode backed by `editorDensity`, or delete the mode, the schema field and the column?
5. **Button profile (A09-9).** Promote Link above Effects, Interactions and Animation, against board 807:8567?
6. **Inline text toolbar scope (A09-5).** Which properties belong to inline markup, and which to element styles?
7. **PageTabBar (A09-13).** Switching only, or full page management?

## Overlaps with other audits (observed, not audited here)

- **Prompt 12 and A04-2 / A04-10:** the unsaved-work guards for Settings and CMS drafts share A09-1's root cause.
- **A03-3, A04-4, A02-13 (AI):** A09-4 adds that the context-menu "Improve with AI" row is never rendered.
  - **Correction to A03:** the navigation table and `A03-3` list it as a working door (`03-navigation-discoverability.md:67,175`). It is not, because `AquibraStudio` supplies no `onAIRequest`.
- **A02-8, A01-10:** Components has four doors.
- **A01, A02:** three full media surfaces.
- **A04-5:** Issues panel geometry.
- **A06, delete behaviour:** deletion is inconsistent across surfaces. The selection toolbar deletes with no confirm and offers an undo toast (`UnifiedSelectionToolbar.tsx:196-223`). The Inspector ⋯ Delete opens `DeleteConfirmModal` (`ProInspector.tsx:429-441`). The same action behaves two ways depending on the door; A06 counts 8 delete implementations.
- **Prompt 10/11:** inline `execCommand` formatting and the Quick Style "Add padding (16px)" presets bypass Brand tokens.
- **Prompt 13:** the 14-button footer wraps to two rows at about 1280 px, and focus order runs through the diagnostic toggles before the canvas.
- **Agent D:** A09-12 (collab start doors disagree; no leave control).
- **Prompt 14:** `UserPreference.editorDensity` is a dead column and schema field.

---

## AUDIT HANDOFF

- **Agent / Prompt:** C (Interaction & UX), Prompt 9: Cognitive Load and Progressive Disclosure.
- **Report:** `docs/audits/2026-09-25-full-audit/09-cognitive-load.md`
- **Counts:** P0 = 0 · P1 = 1 · P2 = 9 · P3 = 5
- **P0:** none.
- **P1:**
  - **A09-1:** four commit models. Staged Brand edits turn the topbar save pill into a Save button that cannot save them, and the exit and `beforeunload` guards ignore them, so leaving silently drops staged Brand work.
- **Runtime verified:** 7 scratchpad jsdom probe tests against real components, all pass:
  - `RootView` empty state (A09-8);
  - `SiteMenu`, 21 rows (A09-6);
  - `CanvasFooterToolbar`, 14 buttons (A09-2);
  - `Topbar` pill plus CTA (A09-7);
  - `getEditorViewMode` density (A09-9);
  - profile lengths (A09-9);
  - `StudioHeader` brand-dirty save and exit (A09-1).
- **NOT RUNTIME VERIFIED:**
  - browser stacking and geometry of the canvas-foot bars;
  - sanitizer output of the inline toolbar;
  - actual loss of staged Brand work after a real reload or navigation;
  - every collab path (flag off);
  - the dashboard beyond its nav config.
- **Dependencies:**
  - A09-1 should land with A04-2 and A04-10 as one "uncommitted-work registry" read by the save pill and both guards, after PRODUCT DECISION 1.
  - A09-4 dedupes into the AI-consolidation fix batch (A02-13 / A03-3 / A04-4).
  - A09-2 and A09-3 are one "canvas-foot consolidation" batch.
  - A09-6 depends on the Components (A02-8) and Brand door decisions.
- **Inventory corrections:**
  - The v3 IA context-menu "Improve with AI" is not mounted: `onAIRequest` is never supplied by `AquibraStudio`.
  - An Inspector "simplified" density mode exists, reachable only through `?density=fewer`. `UserPreference.editorDensity` has no reader.
  - The Settings rail dirty-dot set (`SETTINGS_DIRTY_SET`) targets a tab that is not in the default six-item rail. It is not audited here.
- **Suggested next owners:**
  - **G:** a browser walk.
    - Stage a Brand colour, click the "Unsaved changes" pill, then ‹ Exit and reopen; confirm the loss.
    - Measure the canvas-foot stack at 1280 and 1440.
  - **D:** A09-12.
  - **E:** consolidate the AI entry points and flatten the context-menu edit group.
  - **F:** none.
