# Panel 05 — Canvas and canvas toolbar: functionality specification (FD-PNL-05)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by ⛔ U-1 (document ⌘Z checks the active area; interim guard per Panel 24 §11 / SC-9) · not VERIFIED** *(R-1018 — D2-2)* (independent `design-qa-critic` review: pass 1 PROPOSAL with 7 blocking, pass 2 three wording fixes applied). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected under owner standing instruction "apply recommended answers" (2026-10-17). Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): C1, C2, C3, C4, C5, C6, C7 (cascade pointer), S2, V3, V4, V5, V7; FINAL §4 item 7; gap rows T2-1…T2-9, T2-11…T2-14, T2-20, T2-21, T2-23, T2-24, T2-25 (pointer), T2-26, T2-27, T2-29, T2-30, T2-31, T2-33, T2-34, T2-36, T2-38, T7-14, T7-26, T7-32 (depth, size), T1-12, T1-23, D2-2, D2-12, D2-13, D2-15, D2-18, CS-16, CS-20, CS-22; F-EN-A1.6, FI-02. Round 2: Q5, Q6, Q7, Q8 *(R-1018b)*.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA: BD-07 / BD-10 (canvas controls with the canvas; toolbar **above** the canvas column: Editing group Undo/Redo + breadcrumbs; View group breakpoint, width, zoom, Fit, view options), BD-02 (page tabs/switching in bottom bar), BD-13, IA-02 (shared document Undo), GEO-01 (toolbar 44h; two rows 88h when canvas column < 720; at ≤1366 Inspector overlays without changing the authored viewport), IAF-02, FI-01 (resize integrity), FD-DYN-01 §12–13 (Record switcher, Show drafts, Show hidden elements, ghosts), Panels 03/04.

---

## 1. Purpose and boundary

The canvas is where the page is composed: **see the page at a breakpoint, select precisely, edit directly, and always know what you are editing and at which breakpoint.**

Job: J1 Build *(R-1018)*

**Principle (P05):** the canvas toolbar always shows, in words, which breakpoint you are editing — the active breakpoint segment keeps its text label at every width *(R-1018)*.

| In this panel | Not here (owner) |
|---|---|
| Canvas surface: render, selection, hover, marquee, direct manipulation (move, resize, rotate, reorder sections, spacing chips), inline text editing + format bar, context menu, comment pins, empty/loading/error states | Element properties → Inspector · structure tree → Layers · insertion catalog → Add |
| Canvas toolbar: Undo/Redo, breadcrumbs, breakpoint, width, zoom/Fit, View options (overlays, Record switcher, Show drafts, Show hidden elements) | Page switching → bottom bar (Panel 11) · Preview → topbar · Comments toggle → topbar |

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/canvas/Canvas.tsx`, `CanvasFooterToolbar.tsx`, `canvasStyles.ts`, `Canvas.css`, `hooks/*` (selection, keyboard, inline edit, marquee, element drag, resize, section reorder, CMS preview), `overlays/*` (SelectionBox, Handles, Hover, Label, Drop feedback), `controls/UnifiedSelectionToolbar.tsx`, `controls/CustomWidthModal.tsx`, `menus/contextMenuRegistry.ts`, `comments/CommentLayer.tsx`, `engine/canvas/ResizeHandler.ts`, `canvasGeometry.ts`, `shared/constants/breakpoints.ts`, `canvas.ts`.

| ID | Capability | Today |
|---|---|---|
| CV-01 | Toolbar position | **Footer at the bottom** of the canvas column, 44h; page tab bar sits **above** the canvas (`StudioPanels.tsx:870`) |
| CV-02 | Undo / Redo | Footer icon buttons, disabled states, ⌘Z / ⌘⇧Z (⌘Y) |
| CV-03 | View ▾ ("View · N") | Snap guides ⌘;, Spacing ⌘⇧;, Grid ⌘' (pane: 4/8/16/custom 1–100), Rulers ⌘R, Badges ⌘B, X-Ray ⌘⇧X; Breakpoint ▸ and Zoom ▸ rows |
| CV-04 | Zoom | "N% ▾": Fit, 50/75/100/150/200; ⌘1 fit, ⌘2 zoom to selection, ⌘0 100%, ⌘=/⌘- step (presets 10–400); **no Ctrl+scroll / pinch**; zoom and device **not remembered** |
| CV-05 | Breakpoints | Desktop ≥1024 (frame 100% floored at 1024), Tablet 768 (768×1024), Mobile 375 (375×812); Wide 1920 exists in constants, not offered; custom width modal 240–2560 (strips non-digits), preview-only, dropped on next device pick; **active breakpoint not visible on the bar**; switching device re-fits zoom |
| CV-06 | Readout | "Type · name · W × H" at the bar's right end |
| CV-07 | Breadcrumbs | **NOT FOUND** |
| CV-08 | Selection | click; locked → toast, not selected; Shift add; ⌘ cycles stacked; dbl-click selects child, triple innermost; grey surround clears; marquee (drag start 5 px, minimum box 3 px; **starts only in a ~20 px strip outside elements**; selects a parent together with its children) *(R-1018 — T7-26, T2-11)*; ←/→ parent/first child; **Esc clears**; enlarged hit areas |
| CV-09 | Hover | dashed outline + label; Alt parent chain; Alt+Shift box model |
| CV-10 | Selection box | combined multi box; CMS badge (single); lock badge replaces handles; 8 handles (N/S edges when width > 50); **in multi-select the handles resize only the primary element** *(R-1018 — T2-6)*; rotation (Shift 15°, slider semantics); W×H pill while resizing; tag "Type · name"; handles, pill and marquee are **not** zoom-compensated *(R-1018 — T2-12)* |
| CV-11 | Selection toolbar | single selection: Duplicate, Delete, More (opens element menu); inside or outside small elements; **hidden in multi-select** *(R-1018 — T2-1)* |
| CV-12 | Resize | ResizeHandler with modifiers; **keyboard resize non-functional**; **Esc during resize calls `history.undo()` → can undo the previous unrelated edit**; bounds not zoom-compensated |
| CV-13 | Move / reorder | element drag (⌘-drag clone, multi, auto-scroll); section grips; drop feedback; ⌥↑/↓, ⌥Home/End reorder; ⌘/Shift+arrow nudge for positioned elements only (toast for in-flow). **A cancelled ⌘-drag clone leaves the copy behind** (INV 13.2) *(R-1018 — T2-8)*; media dropped on an image **replaces** it (INV 12.9) *(R-1018 — T2-36)* |
| CV-14 | Spacing | click-to-edit numeric chips; no drag handles |
| CV-15 | Inline text | dbl-click on leaf text (lock refused); select-all on entry; Enter commit, Esc revert, blur commit; one transaction; format bar 52 above (bold, italic, underline, strike, lists, align ×4, indent, colour, highlight, link, clear). **dbl-click also runs select-child** (overlap). **Enter always commits**, so a list can't get a second item and there is no line break (INV 8.4) *(R-1018 — T2-9)* |
| CV-16 | Context menu | AI improve (if available); Duplicate ⌘D; Delete; Arrange ›; Style › (copy/paste style); Structure › (Wrap, Unwrap, Copy, Cut, Paste, Replace with block…, Save as component…); Lock/Unlock; Group ⌘G; Ungroup ⌘⇧G; Bind to CMS field…; Add interaction; Shift+F10. **No group order, no per-type actions, not clamped to the viewport** (INV 11.2, 11.4) *(R-1018 — T2-3, T2-4, T2-13)* |
| CV-17 | Comment mode | C / topbar; crosshair capture; numbered pins (OPEN, current page) **visible only in comment mode**; pin click → Review; draft 2000 chars ⌘Enter; re-pin, orphan modal |
| CV-18 | States | empty CTA (templates, Browse all templates, Add a block, Describe your site, Start blank); loading skeleton; **no canvas-level error state**; DOM render (not iframe) with navigation guard |
| CV-19 | Time Travel / Compare | warning band + past state over canvas (⌃⇧T, ←/→, Esc, Enter restore); Compare full-canvas overlay |
| CV-20 | Read-only / viewer | no drop, dbl-click, menu, marquee, keyboard edits, selection chrome; click-select and comments work; footer shows with `viewerChrome` |
| CV-21 | Keyboard | wrapper tabIndex 0; Tab cycles elements inside canvas; ↑/↓ siblings, ←/→ parent/child, Home/End; ⌘A; Delete; live region |

Tests: ~79 files / ~680 cases across canvas + engine/canvas.

## 3. Problems this design solves

1. **Toolbar in the wrong place** (bottom) and **no breadcrumbs** — against BD-10; users lose ancestry and the active breakpoint.
2. **Active breakpoint hidden** in View ▸ Breakpoint; editing scope unclear.
3. **Resize Esc undoes unrelated work** (data-loss risk, FI-01); keyboard resize broken.
4. **Zoom ergonomics**: no Ctrl+scroll/pinch; zoom/device forgotten on return (IA "exact return" needs breakpoint + zoom).
5. **Width model inconsistent** (Desktop 100%/1024 canvas vs 1320 preview vs 1440 export; Wide hidden; custom width modal strips input and is forgotten).
6. **Double-click conflict** (inline edit vs select child).
7. **No canvas error state** — a render failure takes the shell's boundary.
8. Page tab bar above the canvas conflicts with BD-02 (page tabs belong to the bottom bar).
9. **Canvas interaction gaps** *(R-1018 — DOCUMENTATION_AUDIT H6)*: one generic context menu with no order or type actions; multi-select toolbar contradicts SC-17; multi-resize resizes only the primary; Tab and Enter conflicts; marquee hard to start; drag feedback has no state spec; a cancelled ⌘-drag clone stays; media dropped on an image silently replaces it.

## 4. Target layout

```
┌──────────────────────────────── canvas column ────────────────────────────────┐
│ ↶ ↷ │ Page › Hero › Content › Heading       │ [Desktop|tab|mob] 1440px ▾ │ 52% ▾ │ View ▾ │  44h
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│        ┌──────────────────── page frame (authored width) ─────────────────┐    │
│        │                                                                  │    │
│        │                         CANVAS                                   │    │
│        └──────────────────────────────────────────────────────────────────┘    │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
  (bottom bar below the whole editor: Pages + status — Panel 11)
```
Sketch key *(R-1018 — CS-22, T7-14: no emoji)*: segments use Lucide `monitor` / `tablet` / `smartphone`; the **active** segment always shows its label ("Desktop" above), inactive ones are icon-only below a 1000 column; "52%" is the zoom split button (§5).

- **Editing group (left):** **return chip** "‹ Back to {origin}" when Editor was entered through a contextual frame (Panel 00 SC-7, NEW) · Undo, Redo, breadcrumbs.
- **View group (right):** breakpoint segments, width field, zoom, View menu. On template pages / pages with lists: **Record: {name} ▾** (and Show drafts inside View); on pages with conditions: Show hidden elements inside View (FD-DYN-01 §13).
- **Removed from canvas column:** bottom footer (its controls move up); page tab bar (→ bottom bar, Panel 11).
- **Non-Editor workspaces:** toolbar replaced by the workspace header (IA); Brand keeps document Undo/Redo in its own header (IA-02).

## 5. Toolbar control contracts

| Control | Contract |
|---|---|
| **Undo / Redo** | Document history (IA-02 shared with Brand). Icon buttons 32×32; tooltip/accessible name "Undo {last action}" **where the history entry has a label** (e.g. transactions "Added Heading"), otherwise "Undo" *(DS)*; disabled when empty; ⌘Z / ⌘⇧Z / ⌘Y unchanged. ⌘Z reaches the document only in Editor and Brand (other areas run their own recovery toast or show "Open Editor to undo" — Panel 24 §4.3). CMS bind / unbind is an undo step (U-3). Not record or publish history *(amended 2026-10-17 — source: Panel 24 §4.3 / SC-10)* |
| **Breadcrumbs** (NEW) | Selection ancestry from page root ("Page") to selected element; each crumb a button that selects that ancestor (and scrolls it into view); hover a crumb highlights it on canvas. Overflow: keep first + last two, middle collapses into "…" menu. Multi-select: **common-ancestor path + "· 3 elements"** (same rule as the Inspector, M07-43). No selection: "Page" only. Last crumb may show muted "· 640 × 48" (replaces CV-06 readout; dropped at step 2 of the collapse order, §9) |
| **Breakpoint segments** (NEW visible) | Desktop · Tablet · Mobile segmented control (32h; generic segmented control, DS §4). **The active segment always shows icon + text label** (P05 principle, §1); inactive segments are icon + accessible name (label in tooltip) and show text labels only when the canvas column is ≥ 1000 *(R-1018 — was "icon-only by default" for all three)*; active segment marked (not colour-only); changing sets authored breakpoint + frame width; keyboard: arrow keys within the group (radiogroup) |
| **Desktop authoring width** (Change, IAF-02 F / DEC-IA-04; **kept by owner decision C1, 2026-10-18**) | The Desktop segment applies a **fixed 1440px frame** (today: 100% of the column floored at 1024). Rationale: matches export (1440) and removes the column-dependent desktop layout; a frame that followed the column would change the authored layout and break WYSIWYG. Fit zoom on load is unchanged, so the frame still fits the column (≈ 52 % on a laptop). Preview's 1320 Desktop becomes 1440 too (parity note §13). Tablet 768, Mobile 375 unchanged. **C1 companions** *(R-1018)*: selection chrome is zoom-independent (§6 "Zoom-independent chrome") and 100 % is one click away (Zoom row) |
| **Width field** (NEW inline, replaces modal) | Shows current frame width ("1440px"); it **replaces the as-built width label under the page** (INV 2.5) *(R-1018 — T2-21)*; its preset list is a 240 popover (V7). Click → numeric input + preset list (**NEW presets**): Desktop **1920 (Wide) · 1440 · 1280 · 1024**, Tablet **768**, Mobile **375**; custom 240–2560. Strict parsing: invalid input stays as draft with inline error, never stripped into another number (today strips, `CustomWidthModal.tsx:56`); Enter applies, Escape cancels. The breakpoint follows the width (existing resolution). **Custom width is saved per site as a personal editor preference** (local, not authored content). **One rule:** the Desktop segment applies the saved custom width if one exists (and it is a Desktop-range width), otherwise 1440; choosing the 1440 preset (or any other preset) clears the saved custom width — this makes IAF-02's "saved custom width" true (IA wording assumed it already existed; today it is session-only and cleared on device change) |
| **Zoom** | "75% ▾": Fit (⇧1), Zoom to selection (⇧2), 50/75/100/150/200 (⇧0 = 100%; ⌘0 alias where the browser passes it) — SC-12, ⌘=/⌘-; **NEW: ⌘/Ctrl+scroll and pinch** zoom around the pointer, limits 10–400; zoom never changes the authored breakpoint. **One-click 100 % (C1)** *(R-1018, DS)*: the control is a split button — the percentage half toggles **Fit ↔ 100 %** in one click (tooltip "Zoom to 100% ⇧0" when fitted, "Zoom to fit ⇧1" otherwise; at 100 % it zooms around the selection, else the frame centre); the ▾ half opens the menu above. The old ⌘K zoom-to-selection alias is **removed** — ⌘K is the command palette only (SC-12) *(R-1018 — T2-20)*. **Breakpoint switch:** Fit is applied only when the new frame does not fit the column at the current zoom; otherwise zoom is kept *(R-1018 — T2-21)* |
| **View ▾** | Existing overlays with SC-12 keys (Snap guides, Spacing, Grid + pane — **the Grid row shows the actual size in use, e.g. "Grid · 10 px", including the default 10 that is not a preset** *(R-1018 — T2-31)*, Rulers ⇧R, Badges ⌥B, X-Ray ⌥X); **Show device frame** (existing DeviceFrameToggle, `Canvas.tsx:959`, moved here; shown when Tablet/Mobile); **NEW contextual rows**: Show drafts (FD-DYN-01 D5), Show hidden elements (any page with a condition; **default on**, FD-DYN-01 §12.2); "View · N" count kept |
| **Record ▾** (NEW, contextual) | FD-DYN-01 §13: previewed record, ◂ ▸, search; view preference only |

**Remember view (NEW, fixes problem 4; per IA-05):** **breakpoint and width are editor-wide** for the session — kept when switching pages (write scope never changes silently). **Zoom, pan and selection are a per-page session snapshot**: opening a page restores its snapshot if one exists, otherwise Fit + no selection (IA-05 "Restore deliberately"). "Back to Editor" from any workspace restores the exact origin (page, selection, breakpoint, zoom). Reload starts on the Desktop segment (saved custom width if any, else 1440) + Fit.

### 5.1 Grid and ruler guides — targeted gap resolution, 2026-10-19

**Verification update, later 2026-10-19:** [bounded evidence](../evidence/canvas-verification-2026-10-19/README.md) supersedes the initial NOT RUN wording below only for the checks actually executed. Existing tests 18/18 pass; focused acceptance 2/6 pass, 4/6 fail: decimal grid `1.5` applies `15`, configured 7px becomes 10px in resize state, locked-guide double-click deletes, and unmount before the delayed write loses the edit. These are component/engine reproductions. Browser confirmed Grid on/custom 7px state, but full resize and server persistence remain unverified. The proposed management UI and overall panel remain unvalidated.

**Scope:** T5-21 asked whether canvas snapping exists and where its controls belong; T2-32 lacked guide gestures/keyboard alternatives. Those details were absent from this panel, unlike the already specified page/template creation flows. This section supplies only the missing contract. **Designer-selected written design; source inspected, visual/runtime NOT RUN.** Existing View ownership, toolbar geometry and SC-12 shortcuts remain.

**Source findings, HEAD `19f964d5e`:** `Canvas.tsx:415–430` reads the Composer grid size and couples Grid visibility to `setSnapToGrid(showGrid)`. `CanvasFooterToolbar.tsx` has Grid → Show grid, 4/8/16px presets and a custom 1–100 field; Composer defaults to 10px. `commandOperations.ts` uses the current grid size for nudge; `ResizeOrchestrator.ts` has grid snapping. Therefore **snap-to-grid exists in source**, not an unknown/new feature. Important discrepancy: `ResizeHandler.startResize` copies the current snap flag but leaves size at its default unless supplied in options; `useCanvasResize` supplies no size. Custom-grid resize parity requires implementation verification/correction; a grid drawing does not prove every gesture snaps to it.

`useCanvasGuides.ts` stores guide IDs/orientation/position/locked in **site project settings `canvasGuides`**, with a 300ms delayed write; hiding rulers only hides the returned guides. `Composer.setProjectSettings` marks the project dirty. `RulersOverlay` supports click and drag creation. `GuidesOverlay` supports drag and double-click remove; locked guides refuse drag, but the remove handler has no lock check. The inspected hook exposes no lock setter or explicit guide history transaction. These are source facts, not runtime failures reproduced here. Its timer is cleared on unmount, so pending guide writes also need a leave/flush check before persistence can be called reliable.

| Control / task | Canonical home and scope | Required interaction |
|---|---|---|
| Grid visibility + snapping | **Canvas toolbar → View → Grid**; personal editor view, not Site settings or an authored CSS grid | Keep the existing combined switch; label **Show grid and snap**, with the actual size (`Grid · 10 px` initially). Toggle hides/shows grid and changes eligible nudge/resize snapping together. No competing independent Snap checkbox. Grid toggling never changes existing element values; subsequent gestures may |
| Grid size | Same Grid subview, shared by overlay and eligible snap consumers | Preserve 4/8/16px presets; custom field displays actual current value, including 10px. Integers 1–100; Enter applies, Escape restores the previous value; invalid text remains a draft with `Enter a whole number from 1 to 100 px`. Do not strip `1.5` into `15`. Show current size even when Grid is off; changing size does not enable it. This is editor state, no document Undo; do not claim cross-device persistence |
| Smart alignment vs ruler guides | **Snap guides** remains the existing sibling-alignment aid; **Rulers** shows rulers and user-placed guide lines | Keep these distinct from the grid switch. User-placed guides are saved site-wide editing aids at fixed page-coordinate px, shared across pages; they are not per-element styles, breakpoint overrides or a personal overlay preference. Changing page/zoom does not rewrite their positions. Do not claim the visible ruler-guide list is already wired into every snap calculator |
| Pointer create | Rulers on; preserve existing gestures | Click top ruler at x → vertical guide at x; click left ruler at y → horizontal guide at y. Drag out of top → horizontal guide at release y; out of left → vertical guide at release x. Show a preview/axis/position while dragging, suppress the following click, commit once on release inside the page. Escape or release outside the page cancels creation without a guide/history step |
| Pointer move / remove | Existing guide; same saved guide ID | Drag an unlocked **horizontal guide on y** or **vertical guide on x**; measure from the authored page origin (not the ruler inset or browser edge), compensate for zoom/pan, preview the page-coordinate position and commit once. Escape restores the pre-gesture value without undoing another edit. Preserve double-click removal for unlocked lines; add an explicit Remove action below. Locked lines cannot move **or** be removed until unlocked |
| Non-drag editing / lock | **View → Rulers and guides…** opens a 360px popover using the existing task popover size; it includes Show rulers (same value as Rulers), guide list and Add guide | This is a temporary management view, not another permanent panel. Label `Guides · shared across this site`. Each row names `Vertical · 240 px` or `Horizontal · 120 px`, with Edit. Edit opens an in-popover detail with Orientation read-only, Position (px), Lock/Unlock and Remove. Add guide opens the same detail with Horizontal/Vertical and Position, Add/Cancel. Back returns to the same list row/scroll; closing restores View focus |

**Guide detail contract:** position is a finite non-negative number in authored page px; preserve existing fractional and legacy negative/out-of-range positions without rounding or dropping them on load. The non-negative validation applies to a newly entered position; an existing exceptional value stays visible with an offer to correct it, and is never silently clamped by opening the editor. Stepper moves 1px; Shift-step 10px. Enter/Apply commits, Escape cancels the field draft first (SC-17); invalid value stays visible with an associated error. No cap based on the current breakpoint: a saved guide beyond today's viewport remains in the list, labelled `Outside current page view`, and can be edited back into view. Lock/Unlock changes only that guide; locked Position/Remove are disabled with `Unlock this guide to change it`. Removal follows SC-15 class (a): no confirmation, `Guide removed · Undo`; guides have no Recently deleted resource list. After removal focus moves to the next surviving row, then previous, then Add guide when empty. Preserve unknown guide data and stable IDs.

**Popover draft and return:** orientation/position fields are a transient Add/Edit draft; show `Changes apply with Add or Apply`. Back, Cancel, Close and click-away discard only that unapplied draft, never an existing saved guide. Escape first cancels the field draft per SC-17, then backs to the list, then closes the popover. Successful Add/Apply returns to the same list and focuses the affected guide's Edit control; Back/Cancel returns to its originating row, or Add guide for an abandoned new guide. Closing the popover returns focus to the View trigger. Lock/Unlock and Remove operate on the committed guide: while a position draft differs, require Apply or Cancel of that draft before enabling those commands; they never silently save it.

**Shared-write dependency:** the current hook reads on mount/PROJECT_LOADED and schedules a whole guide-array write; it does not establish live multi-writer reconciliation. Implementation must re-read the latest guide set and reconcile by site, stable guide ID and base revision before commit or Undo, preserving other guides and unrelated project settings. Changes to the same guide while editing show a conflict with retained local input; no silent last-writer overwrite. Undo reverses only that operation's supported value/lock/remove delta after revalidation, never reinstalls an old whole array over someone else's additions. Remote deletion invalidates the target instead of recreating it on a late write. Offline replay uses the same reconciliation; existing collaboration/access policy remains. This is a named engineering dependency, not a claim that current guide persistence supports it.

**Permission, save and history:** users able to edit the site can create/change these site-shared aids; Viewer may toggle visibility and inspect the list but has disabled mutation controls with `Editing guides needs Editor access`. Recheck role/site/guide ID before commit; unknown access disables writes. Adding, moving, locking or removing one guide is one shared document-history step; opening, hiding, selecting a guide or changing Grid is not. This guide-history support and lock setter are required engineering work, not existing verified capabilities. Undo restores the same guide ID and prior value/lock. Failed/queued sync retains the guide with the existing owner-specific document status; never show Saved without the receipt. Offline guide edits are intended to use the document-edit queue policy (P22), not the server-only Pages-manager policy. Guide inclusion in offline/reload/crash recovery serialization is an **unverified engineering dependency**: the hook proves a project-settings write, not that page recovery copies include guides. Until verified, do not promise guide recovery after closing the tab or a crash; show the existing tab-dependent pending-work warning. A page/site transition must settle or cancel an active gesture and flush its completed local guide edit into the existing document recovery path; no pending 300ms edit may silently disappear. No schema migration to per-user or per-page guides is authorized.

**Composition:** Grid's existing menu is retained; the new guide-management subview reuses the 360px popover, clamped to viewport minus 24px, with one scrolling list and reachable Add/Back/Close actions. Long row labels wrap; identity/position precede lock metadata. Empty state says `No ruler guides` with Add guide; loading uses a skeleton, read failure retains loaded data with Retry. Keyboard users reach Add/Edit/Position/Lock/Remove through ordinary controls without dragging; focus/selection of a guide must not change the selected canvas element or its Inspector. Narrow/short and 200% fit remain unmeasured. Alternative rejected: a permanent Guides panel adds spatial cost for this bounded task; putting it in Site settings separates the controls from the canvas where users place guides.

**Acceptance — specified, NOT RUN:** (1) Grid off/on and custom 7px keep overlay, eligible nudge and resize consistent; invalid `1.5`, `0`, `101` are rejected without changing the current size. (2) At 50%/100%/200%, click/drag creation and numeric editing produce the same authored coordinate; cancel adds no object/history. (3) Keyboard add/edit/lock/unlock/remove and Undo preserve selection and stable IDs; a locked guide cannot be double-click deleted. (4) Hide/show, page switch and save/reopen retain site-shared guides; switch within 300ms of a completed edit loses nothing; Viewer/unknown-role mutation is refused. (5) Inspect real long/many-guide data at short/narrow viewports: geometry, grouping/hierarchy, labels/status and interaction/accessibility are separate checks. No performance or accessibility pass follows from this written specification.

**Bounded review — 2026-10-19:** independent `design_guard_reviewer` inspected this addition against the cited source and existing contracts. Movement axes, unapplied-draft dismissal, shared-write reconciliation, recovery limits and legacy-value preservation were clarified and rechecked. No remaining blocking contradiction in this written proposal. G1/G2/G3/G5/G7/G9 pass for the mapped written scope; G4/G6/G8 NOT RUN. Geometry and actual interaction/accessibility remain unverified; grouping/hierarchy and label/status requirements passed document review. Added-link/anchor/whitespace checks passed. Overall status **PROPOSAL**, not completion of B3.4 or implementation.

## 6. Selection and direct manipulation

| Topic | Contract |
|---|---|
| Selection | All CV-08 behaviours kept (click, Shift, ⌘ cycle, triple-click innermost, marquee, ←/→, locked → not selected with toast); Esc follows the ladder below (select parent; clears only at the page root) *(amended 2026-10-17 — source: SC-2)*. **Inherited lock** (SC-14) *(R-1018 — T2-29; changed R-1018b, owner Q8)*: a descendant of a locked element shows the not-allowed cursor and, **on hover or click, a badge at the element "Locked by {parent} — unlock in Layers"** (SC-14; "Layers" runs Show in Layers on the locking parent) instead of the toast; it is not selected from the canvas — selectable from Layers only |
| **Marquee (Change, C5)** *(R-1018 — T2-11)* | **Shift+drag anywhere** — over elements or empty canvas — starts a marquee once the pointer moves 5 px (Shift+click without movement stays "add to selection"); the as-built plain drag in the empty strip outside the page frame keeps working. The marquee **selects at one depth**: the children of the container under the drag start point that the box touches; never a parent together with its children. Locked elements inside the box are skipped. The box is drawn in screen pixels (zoom-independent) |
| **Zoom-independent chrome (C1)** *(R-1018 — T2-12, T2-30)* | Handles, hover/selection outlines (1 px), the type tag, the W×H pill, badges, the insertion line and the marquee are drawn at **screen size at every zoom**; handle hit area stays ≥ 12 screen px even at 10 % zoom. Only page content scales |
| **Double-click (Fix)** | Decided by the **element under the pointer**: if it is an editable text leaf → that leaf **becomes the selection** and enters inline edit (Inspector follows the edited leaf — no scope mismatch); otherwise → existing select-child-under-pointer relative to the current selection. To drill past text without editing: triple-click (innermost) or ⌘-click cycle (existing) |
| Hover | CV-09 kept; hovered breadcrumb or Layers row mirrors the same outline |
| Selection box + badges | CV-10 kept; CMS badge, lock badge; condition ghost overlay (FD-DYN-01 §12.2). **Multi-select (Change, C3)** *(R-1018 — T2-6)*: the combined box shows **no resize handles** this version (as-built handles resized only the primary); single selection keeps all 8 handles. Badge colours per §9 overlay table |
| Selection toolbar | **Single selection:** Duplicate · Delete · More (same element menu, which now includes Show in Layers) — buttons unchanged. **Multi-selection (SC-17)** *(R-1018 — T2-1, D2-12; replaces "single selection only")*: Duplicate · Delete · Group · More, anchored to the **combined box** (top edge, left-aligned). **Small-box rule:** when the box is narrower than the toolbar or shorter than 40 px, the toolbar sits outside, 8 px above the box (below if there is no room above, clamped inside the canvas column) |
| **Escape order (one ladder)** | 1 cancel active gesture (resize/drag/rotate; **a cancelled ⌘-drag clone removes the copy — no element and no Undo step is left behind** *(R-1018 — T2-8)*) → 2 inline canvas text editing — **Esc commits and leaves text mode** (owner decision C4 — was "revert"; ⌘Z then reverts the whole edit as one step; Inspector / form field drafts still revert on Esc — SC-2) *(R-1018)* → 3 close open menu/popover/width field → 4 exit comment mode → 5 stop Follow (Panel 21 §4.4) → 6 select parent; at the page root, clear selection (SC-2, amended 2026-10-17 — was "5 clear selection"). Time Travel and Compare own their Esc (exit their area) |
| **Resize (Fix FI-01)** | **Esc cancels only the active gesture** (restores the pre-gesture size from a snapshot), never calls `history.undo()`; one completed gesture = one Undo step; bounds zoom-compensated; finite valid values only |
| **Keyboard resize (NEW; entry changed by C4)** *(R-1018 — T2-5)* | **Tab keeps cycling elements** (CV-21 unchanged). **Resize command** enters handle mode (alternate shortcut remains to be assigned under BD-39; Enter is reserved for selected-text editing): focus moves to the right-edge handle; Tab / Shift+Tab move between the handles **while in handle mode only**; arrows resize 1px, Shift+arrow 10px; Enter commits **one** Undo step for the keyboard session and leaves handle mode; Escape restores the pre-session size and leaves handle mode; accessible name "Resize right edge, 640 pixels wide". Selected text starts inline edit with Enter or double-click. Not offered in multi-select (C3) |
| Move / reorder | CV-13 kept (drag, clone, sections grips, ⌥↑/↓, ⌥Home/End, nudge); in-flow nudge toast kept. Clone cancel per the Esc ladder step 1 *(R-1018)*. **FI-02** *(R-1018 — T2-7)*: duplicate (⌘D, toolbar, menu), copy/paste and ⌘-drag clone keep the source's breakpoint overrides (Tablet, Mobile) and state styles (:hover etc.) on the copy — T-CV-16 |
| **Image drop (Change, C6)** *(R-1018 — T2-36)* | Dropping an asset or OS image file **on an image element inserts** a new image next to it (before/after by pointer position, like any drop). Replacing is explicit: while an image drag is over an image, a **centre "Replace image" zone** (the middle third of the target, labelled chip "Replace image", accent outline) appears; releasing inside it replaces the source (alt kept unless empty; one Undo step; toast "Image replaced · Undo"). Background-image targets follow the same rule (centre zone "Replace background") |
| Spacing chips | CV-14 kept (click-to-edit) |
| Inline text (C4) *(R-1018 — T2-9)* | CV-15 kept; format bar kept; lock refused. Keys: **Shift+Enter** = line break; **Enter inside a list item** = new list item (Enter on an empty last item leaves the list); Enter elsewhere, **⌘Enter, Esc or a click outside** commit (one transaction; ⌘Z reverts it). Replaces "Esc reverts" |
| Context menu (C2) *(R-1018 — T2-2…T2-4, T2-13, T2-14, D2-15, CS-16)* | **Rows = SC-3 canvas column** (incl. Show in Layers ⇧L, Lock/Unlock ⌘⇧L, Move to page…, Select children, Move up/down/into above/out — replaces "CV-16 kept + Show in Layers"). **Fixed group order = SC-3's six groups** (Panel 00 SC-3 "Menu group order" wins; same on every SC-3 surface, separators between groups) *(R-1018 — was a seven-group order with a separate "edit" group)*: **1 type context** → 2 clipboard (Copy, Cut, Paste, Duplicate, Copy style / Paste style) → 3 structure (Group / Ungroup, Wrap / Unwrap, Select children, Replace with block…, Save as component…, Bind to CMS field… (lands in Inspector › Content with the field picker open — SC-3, Panel 06 C11, owner Q7 *(R-1018b)*), Move to page…, Show in Layers) → 4 arrange (Move up / down / into above / out, **Move to top of parent / Move to bottom of parent** — SC-3 labels *(R-1018, T2-33)*) → 5 state (Lock / Unlock, Add interaction) → 6 Delete, last and alone. **Type-context group** (canvas only, top of the menu, built only from registry actions — each row is an SC-3 registry row *(R-1018)* — omitted when the type has none): text/heading → **Edit text** (enters inline edit); image → **Replace image…** (Asset picker, P06 B6), **Edit alt text** (Inspector Content › alt, focused); link/button → **Edit link** (Inspector Behavior › Link, focused); component instance → **Open component**, **Detach instance** (SC-15 class (a): Undo only); Collection list → **Open collection ›** (CMS, origin return SC-1). Disabled rows stay visible with their reason (SC-18 / P18 row pattern), e.g. "Delete — Locked — unlock to edit". Menu is a 280 popover with `shadow-drag` (V4, V7), **clamped to the viewport with a 16 px inset** (flips up/left when needed); opens with right-click, Shift+F10 or the toolbar More |

### 6.1 Drag feedback states *(R-1018 — T2-38, F-EN-A1.6, T2-23, T2-24, T7-32)*
One table for every drag source (canvas element, section grip, Add row, saved/library component, asset, OS file). Copy is announced through the existing polite region. Colours per §9.

| State | Canvas treatment | Copy |
|---|---|---|
| Valid — between siblings | 2 px insertion line in accent across the target's width; small chip on the line (ink on bg-panel, not accent — CS-20) | "Before {Name}" / "After {Name}" |
| Valid — inside a container | Target outline 2 px dashed accent + `alpha-accent` tint; path chip when ≥ 2 deep | "Inside {Name}" · path "Hero › Content" |
| Invalid + reason | Target outline 2 px solid error; not-allowed cursor; reason chip error-text on error-tint; release does nothing | Existing reasons (INV 12.5): "Can't have children" · "Text can't contain elements" · "Can't drop inside itself" · "Can't nest interactive elements" · "Not allowed here" (fallback) |
| Locked target / ancestor | As invalid, with lock icon | "Locked — drop somewhere else" (SC-14) |
| Max nesting depth | As invalid | "Maximum nesting depth reached" (engine limit 50 — `src/shared/constants/config.ts:135` `MAX_NESTING_DEPTH: 50`; copy from `dropValidation.ts`) *(R-1018)* |
| Replace zone (image over image, C6) | Centre-third zone, accent outline + chip | "Replace image" / "Replace background" |
| Drop while editing text | Refused (existing) | "Can't drop while editing text" |
| Add-drawer cue (drag from Add) | Existing (INV 12.4): the container under the pointer gets the inside/between states above plus a path tag "Drop into · Hero › Content"; the cue chips are restyled to ink on bg-panel (not accent); Esc cancels and Add recents are untouched (P03 §5) | "{Element} — release to place {before/after/inside} {Name}" · "Esc — cancel insert" |
| Auto-scroll | Canvas scrolls near the column edges (existing) | — |
| Success | Element inserted and selected; one transaction | Toast "{Name} added · Undo" (one "added", P22 §5.10; fixes "added ✓ added", INV 12.8) |
| Resize limit | Resize stops at the engine limit; W×H pill shows the limit | "Min 10 px" / "Max 10,000 px" |

Empty-container placeholder copy *(T2-23)*: "Drop elements here, or open Add" (the removed "+" control is no longer named).

## 7. Breakpoint editing scope
- Toolbar segment shows where you are; when not on Desktop, the canvas shows a thin top-left label inside the frame "Editing Tablet" (**NEW**) and the Inspector context row (existing) shows the write scope. Changing panels or zoom never changes the breakpoint (GEO-01).
- **SC-13 on the canvas** *(R-1018 — D2-13)*: style edits on Tablet/Mobile (canvas resize, spacing chips, inline format) write that breakpoint's layer; **structure edits** (move, reorder, reparent, group, delete, insert, duplicate) apply to all breakpoints, and when the current breakpoint is not Desktop the toast says "Moved · applies to all breakpoints · Undo". Inspector markers (dot, count, first-time note) are specified in Panel 06 B10. Edits to a **component instance** at Tablet/Mobile/hover are recorded as instance overrides (owner decision C7; Panel 06 B11).

## 8. States

| State | Behaviour |
|---|---|
| Empty page | **Superseded by Panel 16 §4.1 (2026-10-17):** template cards primary (each opens its preview), Browse all templates, + Add a section, Describe a section (no sparkle glyph — CS-22 *(R-1018)*; only when AI is available — **hidden in this version, SC-21** *(amended 2026-10-17 — source: SC-21)*), Start blank (persisted per page). **Short heights** *(R-1018 — T2-25)*: the CTA must never clip (as-built clips at 1280×720); the short-height layout rule is owned by **Panel 16 §4.1** |
| Loading | On editor open the canvas region is part of the **one shell skeleton** (Panel 22 §5, GS-04) — no second canvas skeleton on top; after the shell is ready, a page switch shows the existing canvas skeleton inside the canvas column only *(R-1018 — T2-27)* |
| **Render error (NEW)** | Canvas-level boundary: "This page couldn't be displayed — Retry · Open another page"; shell, rail, Inspector stay usable; nothing written |
| **Site failed to load** *(R-1018)* | Not a canvas state: the shell-level "Couldn't load {site} — Retry" (server) / "You're offline" (network) is owned by **Panel 22**; the canvas column shows nothing of its own |
| **Offline** *(R-1018)* | Canvas editing continues; edits queue under the save status "Offline — will save when back online" (Panel 11 / P22). Canvas actions that need the server — asset/OS-file drops that upload, Replace image from Assets, Record switcher loading a new record — are disabled with "Needs a connection" (drag shows the invalid state with that reason). The single polite announcement is Panel 22's; the canvas adds none |
| **Selected element deleted by someone else** *(R-1018, DS; only with Collaboration Phase B — Panel 21)* | Selection moves to the nearest surviving ancestor (page root if none); Inspector follows; an open inline edit or gesture on it is cancelled; one polite announcement "{Element} was deleted by {Name}" via the P22 region; nothing else is touched |
| Locked element | Existing (dotted outline, not-allowed, no handles, badge) |
| Read-only / viewer | Existing withheld actions. **Change *(DS)*:** toolbar shows breadcrumbs (select-only) + View group (breakpoint, width, zoom, View); **Undo/Redo hidden** (today viewers see them with the footer, `Canvas.tsx:956`) because a viewer has no document history to undo |
| Comment mode | Existing (crosshair, draft popover); toolbar unchanged. **Pins are visible in comment mode and also while the Review task is open**; pins from the client review are labelled **"Client"** *(amended 2026-10-17 — source: Panel 17 §4.4 / SC-10 CV-17)* |
| Time Travel | **Change (GEO-01 / IAF-18 F):** a **dedicated working area** like Compare (replaces canvas + toolbar; topbar and rail remain per BD-06); keeps its controls (←/→ step, Enter → restore confirm, Esc exits to the exact origin) |
| Compare | Dedicated working area replaces canvas + toolbar (IA), rail/topbar remain |
| **Choose on canvas — source picking** (NEW, Panel 13 §6) | Banner at the canvas top "Choose a source for {component} · Cancel"; eligible elements highlighted on hover, ineligible show not-allowed with reason; click an eligible element → "Return to component review" (confirm in Components); Cancel or Esc returns to Components with the main component unchanged; the return chip is replaced by this banner while active |

## 9. Geometry (GEO-01; NOT MEASURED)

| Item | Value |
|---|---|
| Toolbar | 44h above canvas column, spans the column only; padding 8; group gap 12 |
| Collapse order (any width, before wrapping) | 1 **inactive** segment labels → icons (the active segment keeps its label at every step — P05 principle *(R-1018)*); 2 breadcrumb dimension text dropped (dimensions remain in the selection box W×H pill during resize and in Inspector Size); 3 breadcrumbs collapse to a labelled **ancestry menu** ("Heading ▾", GEO-01); 4 Record switcher folds into View as "Previewing: {name}"; 5 **two rows (88h)** — row 1 Editing, row 2 View. Undo/Redo, segments, zoom and View are never hidden |
| Narrow (< 720 column) | Two rows (88h) as step 5 |
| Widths (est.) | Undo/Redo 64 · breadcrumbs flex (min 120) · segments: active 72 + 2×32 icon-only = 136 (3×72 with labels at column ≥ 1000) · width 80 · zoom split 80 · View 72 · Record 160 *(R-1018: active label + split zoom)* → one row without Record ≈ 630 incl. padding and gaps, with Record ≈ 800; at 1440 normal Editor canvas region 800 (752 after gutters) → fits with inactive segments icon-only; with Record shown, step 4 (Record folds into View) applies |
| **Docked task at 1440** *(R-1018 — D2-18)* | With a right task docked the canvas column is **740** (Panel 12 §4.5): the collapse order applies whenever a task docks — steps 1–2 always, step 4 (Record folds into View) when Record is shown — and the toolbar stays **one row** (≈ 630 ≤ 740). Two rows only below 720. NOT MEASURED — verify at 1440 in the first Figma/runtime pass |
| Canvas wrapper | 24 gutter (existing); page frame radius 12; content padding 20 |
| Handles | **8 px visual, 12 px hit area** (SC-29 *(DS)*) — replaces "12 corners / 8 edges" *(R-1018)*; keyboard focus ring 2px around handle; screen-pixel size at every zoom (C1) |
| Canvas menu / popovers | Context menu 280, width-field presets 240 (V7); `shadow-drag` (V4); viewport clamp 16 px inset *(R-1018)* |
| Motion *(R-1018 — V5)* | Menus/popovers open 160 (base), hover/press 100 (fast); drag ghost and insertion line have no animation; no pulse anywhere on the canvas. Reduced motion: fades → instant |
| Overlay Inspector (≤1366) | Obscures 312 of the canvas; authored width never changes |
| Moved anchors | Toast floor (`data-bk-toast-floor`) moves to the bottom edge of the canvas column (no footer now); toasts sit 16 above it (Panel 22 §5.10). The canvas-corner Inspector door keeps its corner, offset below the toolbar. The KeyboardLegend door is **removed** with the legend card (Panel 18 §9). The **global banner slot** sits under the topbar at full editor width and pushes the canvas column down, never over it; SaveFailedBanner and RecoveryBanner stay on the canvas *(amended 2026-10-17 — source: Panel 18 §9, Panel 22 §4.2 / SC-10)* |

### 9.1 Canvas overlay colours *(R-1018 — T2-26, CS-20, V3; DS §2.11)*
Accent is reserved for selection-like targets (DESIGN.md:213). No raw hex in overlays.

| Overlay | Token |
|---|---|
| Selection outline + handles, hover outline (50 %), drop target, insertion line, Replace zone, comment pins | accent |
| Box model (margin / border / padding / content) | existing `--bk-boxmodel-*` |
| Snap / alignment guides, spacing distance labels on guides | **new `--bk-canvas-guide`** (red, V3 — Figma variable + regenerate; DS §2.12) |
| Lock badge (and inherited-lock badge "Locked by {parent} — unlock in Layers", Q8 *(R-1018b)*) | warning-text on warning-tint |
| Clone (⌘-drag) badge | success-text on success-tint |
| CMS-bound badge | ink-soft on bg-subtle + Lucide `database` icon (not accent) |
| W×H pill, drag chips ("Before/Inside {Name}") | ink on bg-panel, W×H in mono 11 `tabular-nums` |
| Invalid drop | error border + error-text on error-tint chip |
| "Editing Tablet" frame label | ink-soft on bg-panel |

Visual: DS §2.9 (selection/focus), §2.10 (motion), §2.11 (overlays) *(R-1018)*.

## 10. Keyboard and accessibility
- F6 regions per **Panel 00 SC-5** (NAV-04 amended): topbar → global banner slot (only while a banner shows) *(amended 2026-10-17 — source: Panel 22 / SC-5)* → rail → left panel → canvas toolbar + canvas → Inspector/right task → bottom. F6 lands on the **canvas toolbar first**, Tab continues into the canvas.
- Toolbar is a `toolbar` landmark with roving focus between groups; breadcrumbs `nav aria-label="Selection path"`.
- **Skip to canvas** *(R-1018 — T1-12)*: the first tab stop of the editor is a visually hidden "Skip to canvas" link (visible on focus) that moves focus to the canvas toolbar; when another area replaces the canvas (CMS, Assets, Brand, Time Travel, Compare) it reads "Skip to {Area}" and targets that area's main region — it is never a dead link.
- Canvas keys unchanged (CV-21; Tab cycles elements). Keyboard resize added (§6; entered with the Resize command; shortcut pending under BD-39) *(R-1018)*. Inline text keys per §6 (Shift+Enter, Enter in lists, commit on Esc/click-out). All shortcuts registered in the shortcuts dialog (existing + ⌘/Ctrl+scroll documented).
- **Focus mode ⌘\** *(R-1018b, owner Q5)*: hides every panel (rail, topbar, left panel, Inspector, right task, bottom bar) so only the canvas and its toolbar show, with a "Show panels ⌘\" pill (SC-12); ⌘\ again restores them; Esc keeps its SC-2 meaning (SC-12 row). The canvas-corner Inspector door stays visible in focus mode and shows the Inspector alone *(DS)*.
- Live region announces selection changes ("Heading selected, inside Content") *(DS: reuse existing polite region)*.

## 11. Preservation map

| Old | New | Disposition |
|---|---|---|
| CV-01 footer at bottom | Toolbar above canvas | Move (BD-10) |
| CV-01 page tab bar above canvas | Bottom bar (Panel 11) | Move (BD-02) |
| CV-02 Undo/Redo | Same, named actions | Keep |
| CV-03 View overlays + shortcuts | Same + contextual rows | Keep + extend |
| CV-04 zoom | Same + Ctrl/⌘+scroll, pinch, per-page session memory | Keep + NEW |
| CV-05 breakpoints in View ▸ | Visible segments + inline width field with NEW presets incl. Wide 1920; modal retired; Desktop frame 1440 (Change); custom width saved per site (NEW) | Redesign |
| DeviceFrameToggle (Tablet/Mobile) | View ▾ "Show device frame" | Move |
| Time Travel band over canvas | Dedicated working area | Change (IAF-18) |
| CV-06 readout | Last breadcrumb dimension | Move |
| CV-07 breadcrumbs | New | NEW |
| CV-08..11 selection/hover/box/toolbar | Same; dbl-click overlap fixed; marquee = Shift+drag anywhere at one depth (C5); multi-select: no handles (C3) + SC-17 toolbar; zoom-independent chrome (C1) | Keep + Fix + Change *(R-1018)* |
| CV-12 resize | Esc gesture-only; keyboard resize entered with Resize command; alternate key pending (BD-39); zoom-compensated bounds | Fix + NEW |
| CV-13..15 move/spacing/inline | Same; cancelled clone removed; FI-02 styles kept on copies; image-on-image drop inserts + centre Replace zone (C6); inline Shift+Enter / list Enter / Esc commits (C4); drag-feedback table §6.1 | Keep + Fix + Change *(R-1018)* |
| CV-16 context menu | SC-3 rows in fixed group order + type-context group (C2); viewport clamp; disabled-with-reason rows | Keep + NEW + Change *(R-1018)* |
| CV-17 comments | Same + pins also visible while the Review task is open; "Client" label on client pins | Keep + Change *(amended 2026-10-17 — source: Panel 17 §4.4)* |
| CV-18 states | + render error state; empty CTA per Panel 16 §4.1 | Keep + NEW + Change |
| CV-19 Compare | Same dedicated area | Keep |
| CV-19 Time Travel | Dedicated working area (was band over canvas) | Change |
| CV-20 viewer | Breadcrumbs (select-only) + View group; Undo/Redo hidden | Change |

No capability removed.

## 12. Acceptance (specified, NOT RUN)

| ID | Pass condition |
|---|---|
| T-CV-01 | Toolbar is above the canvas; Undo/Redo, breadcrumbs, segments, width, zoom, View all reachable at 1440 and in two rows below 720 column width |
| T-CV-02 | Select a deep element → breadcrumbs show path; clicking "Hero" selects Hero |
| T-CV-03 | Resize, then Esc → element returns to pre-gesture size; the previous unrelated edit is still there; one Undo after a completed resize reverts only that resize |
| T-CV-04 | Keyboard: select an element, invoke **Resize** → focus on the right handle; Shift+→ ×3 → +30px, Enter → one Undo step; Tab outside handle mode still moves to the next element *(R-1018 — C4)* |
| T-CV-05 | ⌘/Ctrl+scroll zooms around the pointer within 10–400; breakpoint unchanged |
| T-CV-06 | Width field: "12a0" shows error, stays draft; "1440" applies; Escape restores previous width; Wide 1920 selectable |
| T-CV-07 | Set Tablet + 150% on Home, open CMS, Back to Editor → Tablet + 150% restored; switch to About → still Tablet; About's own zoom snapshot (or Fit) applies |
| T-CV-08 | With a Section selected, double-click its nested paragraph → paragraph becomes selected and enters inline edit; Inspector shows the paragraph |
| T-CV-09 | Forced render error → canvas error state with Retry; rail/Inspector usable |
| T-CV-10 | Viewer: breadcrumbs (select-only) + View group; no Undo/Redo; no edit actions on canvas |
| T-CV-11 | Template page shows Record switcher; page with a condition shows Show hidden elements in View |
| T-CV-12 | Existing ~680 canvas/engine tests updated with the change, not deleted |
| T-CV-13 | Tablet: View ▾ shows "Show device frame"; Desktop: hidden |
| T-CV-14 | Esc ladder: during resize Esc cancels resize only; during a ⌘-drag clone Esc removes the copy; with text editing Esc **commits** the text (⌘Z then reverts it) *(R-1018 — C4)*; with View menu open Esc closes it; while following a person Esc stops Follow; else selects the parent, and at the page root clears selection *(amended 2026-10-17 — source: SC-2, Panel 21 §4.4)* |
| T-CV-15 | Desktop segment shows a 1440 frame fitted to the column; with custom width 1100 saved, Tablet → Desktop and a reload both show 1100; choosing the 1440 preset clears it and Desktop shows 1440 thereafter |
| T-CV-16 *(R-1018 — FI-02 / T-FI-02, T2-7)* | An element with Tablet and Mobile overrides and a :hover colour → ⌘D, copy/paste, and ⌘-drag clone each produce a copy whose Tablet, Mobile and :hover values match the source |
| T-CV-17 *(R-1018 — T2-8)* | Start a ⌘-drag clone, press Esc → no copy remains, element count unchanged, no new Undo step |
| T-CV-18 *(R-1018 — C3, SC-17, T2-1)* | Select 3 elements → combined box has no handles; toolbar shows Duplicate · Delete · Group · More on the combined box; Group wraps them in one step |
| T-CV-19 *(R-1018 — C5)* | Shift+drag starting over a Section's child → marquee draws; only siblings in that container are selected, never the Section with its children; Shift+click without movement still adds to selection |
| T-CV-20 *(R-1018 — C6)* | Drag an asset onto an image's edge area → a new image is inserted next to it; onto the centre "Replace image" zone → source replaced, alt kept, one Undo step |
| T-CV-21 *(R-1018 — C2, SC-3)* | Right-click an image → first group "Replace image… · Edit alt text", then SC-3's groups clipboard · structure · arrange · state · Delete last (Duplicate in clipboard, Add interaction in state; arrange reads "Move to top of parent / Move to bottom of parent"); on a text element the first group is "Edit text"; on a plain container no type group; menu opened at the bottom-right corner stays 16 px inside the viewport |
| T-CV-22 *(R-1018 — C4)* | Inline edit a list: Enter adds a second item; Shift+Enter in a paragraph inserts a line break; clicking outside commits as one Undo step |
| T-CV-23 *(R-1018 — T2-38, F-EN-A1.6)* | Drag into a container at depth 50 → invalid state "Maximum nesting depth reached", release changes nothing; drop on a locked container → "Locked — drop somewhere else" |
| T-CV-24 *(R-1018 — C1)* | At Fit (≈ 52 %) and at 25 % handles, tag and W×H pill measure the same screen size as at 100 %; one click on the zoom percentage goes Fit → 100 % and back |
| T-CV-25 *(R-1018 — T1-23)* | A page using a Brand font and token colours renders the same font family, weight and computed colours on canvas and in Preview (getComputedStyle on 3 sample elements) |

## 13. Open dependencies
- Width parity: this panel sets Desktop authoring to 1440 (= export). Preview's Desktop (1320 today) moves to 1440 and Preview uses the current frame width — specified in Panel 01 §5.8 and Panel 00 SC-8 — dependency recorded there.
- **Font and colour parity with Preview** *(R-1018 — T1-23)*: canvas and Preview load the same site fonts and the same Brand token CSS, so text renders identically (T-CV-25). Until that is verified the parity is a **known limitation** (as-built fonts/colours differ, INV 8.3 / UX-09) and Preview is not claimed to be "what ships"; the SC-8 / IAF-15 line is owned by Panel 00 / Panel 01. **Owner Q6** *(R-1018b)*: parity is **required** — SC-9 "Preview/canvas render parity"; interim Preview-bar note "Fonts and colors may differ slightly until published" (SC-8, Panel 01).
- **Engine limits** *(R-1018 — T7-32)*: max nesting depth **50** (`src/shared/constants/config.ts:135` `MAX_NESTING_DEPTH: 50`; refusal copy "Maximum nesting depth reached", `dropValidation.ts`; F-EN-A1.6). The inventory's "30" (INV 12.13) is **stale** *(R-1018)*.

## 14. Review and not verified
Independent `design-qa-critic` review done (see Status line; this footer was stale until 2026-10-17). Not verified: runtime, measured toolbar fit, keyboard resize feel, pinch on trackpads, screen-reader output. 2026-10-18 owner-decision amendments *(R-1018)* not independently reviewed. Remaining: T2-22 selection caption placement and T1-11 Inspector hide/show control (SC-12 / Panel 12). T2-28 landing was already decided by owner Q7 (Inspector Content picker); it is not an open owner choice. T2-32 guide interaction detail and T5-21 snapping existence/ownership are addressed by §5.1 (2026-10-19), with visual/runtime verification and named engineering work still open.

### BD-31/39 text-editing clarification — 2026-10-21

Enter on selected text begins editing. While editing, the existing text/list key rules apply; Escape, Done and clicking away commit the current text transaction. Undo restores its prior content and link state. The toolbar is 633px with More formatting preserving secondary tools; selection identity sits outside text. TX01–11 are native specimens; pointer routes are configured, native keyboard/focus and runtime are unverified.
