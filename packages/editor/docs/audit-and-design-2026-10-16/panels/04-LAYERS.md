# Panel 04 — Layers (page structure): functionality specification (FD-PNL-04)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · not VERIFIED** (independent `design-qa-critic` review: pass 1 PROPOSAL with 5 blocking, pass 2 two one-line fixes applied). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected under owner standing instruction "apply recommended answers" (2026-10-17). Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): C2, N1, V1, V4, V5, V6, V7; gap rows D2-3, D2-11, D2-14 (pointer), D2-30, T2-10, T2-13, T3-3; CS-03, CS-07, CS-14, CS-16, CS-17, CS-19, CS-22; DS §4 Tree row (bind to chrome-ui `TreeRow`). Round 2: Q8 (pointer); not-asked dimmed-row contrast confirmed *(R-1018b)*.
Governing IA: BD-05 (rail Layers), BD-13 (stable Add/Layers behaviour), IA-01, GEO-01 (Add/Layers 284 / 260 / 360, bounded resize, header/search sticky, one list scroll), IAF-03, IAF-02 (selection), FD-DYN-01 §12.2 (Layers condition + CMS markers), Panel 02 (rail), proposed fixture 5,000 tree nodes (handoff CTRL-07).

---

## 1. Purpose and boundary

Layers answers: **what is on this page, how is it nested, and let me select, rename, reorder, lock or tidy it — precisely, even when the canvas makes that hard.**

Job: J1 Build (00-STRATEGY §3) *(R-1018)*
Visual: SC-27 (DESIGN_SYSTEM_SPECIFICATION §2–§4); sentences SC-28 *(R-1018)*

| In Layers | Not in Layers (owner) |
|---|---|
| Tree of the current page; select (single/multi), hover-locate, expand, rename, reorder/reparent, lock, editor-only dim, structural commands (cut/copy/paste/duplicate/delete/group/move to page) | Element properties → **Inspector**; live-site visibility per breakpoint → **Inspector Behavior › Visibility** (US spelling, SC-11 *(R-1018)*); page list → **Pages** (bottom bar); main components → **Components** (reached from an instance row — §7) |

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)

Files: `src/editor/panels/layers/index.tsx`, `LayerTreeItem.tsx`, `hooks/useLayersState.ts` (+ useLayerTree, useLayerActions, useLayerSearch, useLayerSelection, useLayerDrag, useLayerContextActions), `components/*` (DisplaySettings, ContextMenu, StateBlocks, EmptyState, ScrollThumb), `styles/layers-v2.css`, `sidebar/tabs/layers/LayersTab.tsx`.

| ID | Capability | Today |
|---|---|---|
| LY-01 | Header | "Layers" + help + ✕; ⋯ menu: Expand all, Collapse all, Display settings…, Widen/Narrow panel |
| LY-02 | Search | "Search layers…" (name, type, tag, id); flat results, ancestors auto-expand; count `aria-live`; Escape: clear → deselect → close drawer |
| LY-03 | Display settings | Show dimmed layers, Show lock badges, Compact rows (default on), Highlight CMS-bound (off), Show HTML tags (off); localStorage `buildrick-layers-display-prefs` |
| LY-04 | Footer | "N layers" / "N selected of M" / "N of M match"; Select / Select all / Deselect all / Done (selection mode); ⓘ dimming explainer |
| LY-05 | States | Loading skeleton; error boundary + Retry; empty "No layers yet"; no results + Clear / Search everywhere; rejected-drop alert 3s |
| LY-06 | Row | indent 16 + depth×16 (uncapped); chevron 20; type icon; name (custom › text preview › type) ellipsis + title; badges ◇ instance, HTML tag, CMS (only with setting); **M/T breakpoint badges never render** (data not filled); eye + lock 24×24 on hover/focus; rows 28 (compact) / 32 |
| LY-07 | Select | click; ⌘/Ctrl toggle; Shift range in flattened order incl. collapsed; selection = `composer.selection` |
| LY-08 | Hover | row hover highlights canvas; canvas hover tints row + expands ancestors |
| LY-09 | Expand | chevron, ←/→; per-page expanded state persisted; first visit opens first top layer to depth 3; selection change expands + scrolls to centre |
| LY-10 | Rename | double-click / F2 / menu; Enter/blur save, Escape cancel; empty → type label; undoable. **Menu Rename skips lock check** |
| LY-11 | Drag | native DnD; zones 30/40/30; refuses root move, into descendants, locked target/parent, invalid nesting (named error); one `move-layer` transaction; locked rows not draggable |
| LY-12 | Context menu | Cut, Copy, Paste, Duplicate, Delete (N>1 confirms + Undo toast), Rename (single), Group (one transaction; refuses instance parts — **does not check locks**: Group/Ungroup skip the lock gate, INV 11.14 / REG M02-11.14 *(R-1018, T2-10 — the earlier "refuses locked" claim was wrong)*), Move to page…, Copy link. **No Lock/Unlock, no Wrap**; viewers get none |
| LY-13 | Eye (dim) | Editor-only `data-hidden`, per-page localStorage; **still publishes**; no undo; selected dimmed row shows note → Inspector Visibility + "Show normally in editor" |
| LY-14 | Lock | engine command, one undo step. **Already refused for locked elements:** drag, rename (dbl-click/F2), drop-into, Delete key, Cut, menu Delete/Cut — via `dropLockedAndInstances` (`defaultCommands.ts:109,290`; `useLayerContextActions.ts:40-46`), which also refuses an unlocked parent with a locked descendant and component instances. **Duplicate is allowed** on a locked element; the copy is unlocked (`defaultCommands.ts:172-176`). **Multi-selection skips locked members and applies the rest** with a LOCKED_ELEMENTS_SKIPPED toast. **Not checked:** menu Rename, paste-into, insert-into, Move to page |
| LY-15 | Multi-select | modifiers + selection-mode checkboxes; Select all respects filter/dimmed; bulk only via menu; no mixed-state summary |
| LY-16 | Components / root | only instance root ◇; no main-component marker or boundary; page root not a row |
| LY-17 | Performance | no virtualization; rebuild batched per frame; scroll kept per page |
| LY-18 | Gating | `readOnlyView` removes drag/rename/menu/eye/lock; Delete key relies on engine |
| LY-19 | ARIA | `tree` + `treeitem` (level, expanded, selected), roving tabindex, ↑/↓ wrap, ←/→, Enter/Space, F2, Delete. Missing `group` nesting, `aria-multiselectable`, setsize/posinset, Home/End, type-ahead, ← to parent / → to first child |
| LY-20 | Missing | **keyboard reorder from the tree** (the canvas already has ⌥↑/↓ move and ⌥Home/End move to first/last, `useCanvasKeyboard.ts:191-246`; canvas ⌥←/→ = select parent / first child); "Show in Layers" from canvas; condition marker |
| LY-21 | Widen | ⋯ "Widen panel" sets drawer to 700 (`LeftSidebar.tsx:410`) |
| — | Other | empty-canvas click closes the Layers drawer (`StudioPanels.tsx:417-424`) |

Tests: ~23 files / ~133 cases under `panels/layers/__tests__` plus LayersTab tests (counts from two inventories differ; no e2e).

## 3. Problems this design solves

1. **Live-site visibility invisible in the tree** (dead M/T badges) — users can't see what is hidden on Mobile/Tablet.
2. **Eye means "dim in editor" but looks like "hide"** — risk of publishing content the user believes is hidden.
3. **Lock gaps** — menu Rename, paste-into, insert-into and Move to page ignore it; no Lock/Unlock in menu.
4. **No keyboard reorder from the tree** — the canvas has one, the tree does not (WCAG 2.5.7; IAF-03 H).
5. **No way to find a canvas element in Layers** explicitly.
6. **Scale** — 5,000-node fixture renders all rows.
7. **Panel closes on empty-canvas click** — unstable tool (BD-13).
8. Incomplete tree semantics and multi-select feedback.

## 4. Target structure (284w panel)

```
┌──────────────────────────────────────┐
│ Layers · Home                 ⋯   ✕  │ header 44 (page name = current page; title 14/20/600)
│ [search] Search layers…      ] [≡]   │ search 32 sticky · ≡ = Display settings
├──────────────────────────────────────┤
│ ▾ ▭ Header                    ◇      │ ◇ = instance (row menu: Edit main component)
│   ▾ ▭ Nav               [lock]       │ locked (own lock)
│       T Logo        [lock-outline]   │ inherited lock (locked by Nav)
│ ▾ ▭ Hero              M  [database]  │ M = hidden on Mobile (live site)
│     H Welcome to Bella        ◐      │ ◐ = has condition
│     [image] Hero image   [eye-off]   │ dimmed in editor: ink-muted name + dim icon
│ …                                    │ one scroll, virtualized
├──────────────────────────────────────┤
│ 24 layers · 2 selected (1 locked)  ⓘ │ footer 32
└──────────────────────────────────────┘
```
*(R-1018: CS-22 — Lucide icon names in brackets, no emoji; SC-14 inherited-lock row; N1 instance link; D2-30 dim treatment.)*

Header ⋯: Expand all · Collapse all · Collapse to selection · Select mode. (Widen/Narrow replaced by the resize edge.) Header type: title "Layers · {page}" 14/20/600 (panel/task level of the header ladder, V6); ⋯ and ✕ are 32 icon buttons *(R-1018, V6 / CS-03)*.

**Row component** *(R-1018, DS §4 Tree row)*: every row is the chrome-ui **`TreeRow`** (28 / 32, indent 16) — today it has 0 consumers; Layers binds to it instead of its own row. Its states cover default, hover, focus, selected, disabled, expanded, drag over/between/inside, and the locked / inherited-lock / hidden / dimmed markers below.

## 5. Row contract

| Part | Rule |
|---|---|
| Indent | 16 per level (board 4418:81300 ladder, unchanged); **NEW:** visual indent **capped at 4 levels** (64) — deeper rows show a small depth number badge ("7", 16w, `--bk-*` muted text) **rendered inside the last 16px of the capped indent** (no extra width); full path in tooltip and accessible description |
| Width budget (260 panel) | 16 padding + 64 indent + 20 chevron + 20 icon + ≥96 name + 2 markers 32 + 8 gap = 256. **On hover/focus the two row actions overlay the markers** (markers hide while actions show) — 24 + 8 spacing + 24 = **56** (DS §2.8 in-row targets) *(R-1018 — was 48 with no spacing)*; at rest the name never drops below 96 — markers collapse into "+N" first; while the actions show on a 260 panel at the capped indent, they may cover the name's last 12px (full name stays in the tooltip) |
| Chevron | 20 hit area within row; leaf rows keep the space |
| Icon + name | existing name rule; ellipsis + full name tooltip; renaming inline field same height as row |
| Markers (right, max 3 visible, then "+N" with tooltip list) | ◇ component instance (existing) · **M / T / D** hidden on that breakpoint on the live site (**Fix**: fill `breakpointOverrides` from the element's visibility values) · [database] CMS-bound (**always shown**, glyph only; the row tint stays an optional setting — FD-DYN-01) · ◐ condition (NEW, FD-DYN-01 §12.2) · [lock] locked · **[lock] outline in ink-muted = inherited lock** (a locked ancestor — SC-14; NEW *(R-1018, D2-11)*) · HTML tag (setting) |
| Row actions (hover/focus, and always when active) | **Dim in editor** toggle (renamed, see §6) 24×24 · Lock toggle 24×24, ≥8 apart — inside the row's own height (28/32). On an inherited-lock row the Lock toggle is **disabled with reason** "Locked by {ancestor} — unlock it to edit" *(R-1018, SC-14)* |
| States | selected (accent-subtle fill; secondary text ink-soft — DS §2.9), multi-selected, hover (canvas linked), drop target (before/inside/after indicator), **dimmed in editor** = name in **ink-muted** + dim (eye-off) icon — **no opacity change** *(R-1018, D2-30: 50% opacity had no contrast floor; ink-muted keeps ≥4.5:1 on the panel background, ink-soft when the row is selected; **confirmed 2026-10-18 as a not-asked owner item (WCAG — no real choice): text ≥ 4.5:1, ink-muted, no opacity, plus the eye-off icon**)* *(R-1018b)*; locked (lock glyph, name normal); **inherited lock** (outline lock glyph, name normal) *(R-1018)*; **hidden on previewed breakpoint** = name in ink-muted + italic + M/T/D marker; **hidden by condition on previewed record** = name in ink-muted + filled ◐ marker (FD-DYN-01). Each also stated in the row's accessible name — never colour or style alone |

Every marker has an accessible name ("Hidden on Mobile", "Bound to CMS", "Has visibility condition", "Locked", **"Locked by {ancestor}"** *(R-1018, D2-11)*, "Component instance", "Dimmed in editor") included in the row's label.

## 6. Dim vs live visibility vs lock (fixes problem 2)

| Control | What it changes | Undo | Shown as |
|---|---|---|---|
| **Dim in editor** (eye-off icon with small "E") | Editor view only; never output | No (view preference, per page, existing storage) | Tooltip "Dim in editor only — still published"; footer ⓘ explains; selected dimmed row note kept with **"Show normally"** and **"Hide on live site… →"** (opens Inspector Behavior › Visibility for that element) |
| Live-site visibility (per breakpoint) | Authored element data | Yes (Inspector) | M/T/D markers in Layers; edited only in Inspector |
| **Lock** | Authored element flag | Yes, one step | 🔒 marker; refused actions show reason "Locked — unlock to edit" |

**Lock rules (existing kept, gaps closed):** existing refusals stay exactly as `dropLockedAndInstances` defines them (drag, dbl-click/F2 rename, drop-into, Delete key, Cut, menu Delete/Cut; also an unlocked parent with a locked descendant, and component instances). Duplicate stays allowed (copy unlocked) — unchanged. **NEW:** menu Rename, paste-into, insert-into (Panel 03) and Move to page also refuse. **Fix (not existing)** *(R-1018, T2-10)*: Group refuses a set with a locked member, and Ungroup refuses a locked container or one with locked children — today both skip the lock gate (INV 11.14). Selecting, copying and dimming stay allowed.

**Inherited lock (SC-14)** *(R-1018, D2-11)*: locking an element locks all its descendants. On the canvas a locked descendant shows the badge "Locked by {parent} — unlock in Layers"; its "Layers" link runs Show in Layers on the locking parent, whose row Lock toggle unlocks it (owner Q8 — Panel 05 §6) *(R-1018b)*. Descendants: **selectable from Layers only** (canvas treatment belongs to Panel 05 — T2-29), not draggable, and every refused action (move, resize, delete, rename, inline text edit, Inspector writes, insert inside) shows the one SC-14 lock copy **"Locked — unlock to edit"** with a second line "Locked by {ancestor}". Marker: outline lock in ink-muted; accessible name "Locked by {ancestor}". Unlocking happens on the ancestor (its row toggle or menu Unlock); the descendant's own toggle is disabled with that reason.

## 7. Interactions

| Task | Contract |
|---|---|
| Select | Existing (click / ⌘ / Shift range). **Change *(DS)*:** Shift range uses **visible order** (collapsed children not silently included; "Select children" covers that). Footer **"Select all"** keeps its meaning — every element on the page incl. collapsed branches (labelled "Select all on page") — the two rules differ on purpose: range = what you see, all = everything |
| Hover locate | Existing two-way hover |
| **Show in Layers** (NEW) | Canvas context menu (also reached from the selection toolbar's More button) "Show in Layers": opens Layers if closed, expands ancestors (from the data model — works with virtualization), scrolls row to centre, focuses it. Shortcut ⇧L *(DS; no existing conflict; registered in the shortcuts dialog)* |
| Expand | Existing persistence; first-visit depth 3; + **Collapse to selection** |
| Rename | Existing; lock check on every path |
| Drag reorder/reparent | Existing zones + validation + one transaction; indicator line + "Into {name}" label; auto-scroll at list edges; auto-expand collapsed target after a 600 ms hover **dwell** (intent timer, not an animation); the expand itself uses the base 160 token, instant under reduced motion *(R-1018, V5 / CS-19)* |
| **Keyboard move in the tree** (NEW, fixes problem 4) | Reuse the **existing canvas reorder commands and chords** so one chord means one thing in every region (NAV-04): ⌥↑ / ⌥↓ move up / down, ⌥Home / ⌥End move to first / last among siblings. **Move into / Move out** have no chord (⌥←/→ already mean select parent / first child on the canvas) — they are in the context menu and the tree's Shift+F10 menu. Same validation and refusal messages as drag; one Undo step each; focus follows the moved row |
| Context menu (single + multi, names target; draws from the shared registry, Panel 00 SC-3) | Rows: Cut · Copy · Paste (into / after) · Duplicate · Delete · Rename · **Save as component…** (NEW) · **Lock / Unlock** (NEW) · Group · Ungroup · **Select children** (NEW) · **Move up · Move down · Move into above · Move out** (NEW) · Move to page… · Show on canvas · Copy link · **Edit main component** (instance rows only — N1). **Order and grouping are SC-3's one group order for every menu (C2)**, not the order listed here; ineligible-but-relevant rows are disabled with reason; Show on canvas, Copy link and Paste into/after are SC-3 Layers-column rows (D2-14) *(R-1018)*. Wrap/Unwrap stay in the canvas and selection-toolbar menus (SC-3: Group ≠ Wrap) |
| **Edit main component** (instance rows) *(R-1018, N1)* | The Layers door to Components (no rail item). Opens the Components area (Panel 13) with that main component selected; header back **"‹ Back to Layers"** restores the page, selection, Layers scroll and focus on the instance row. The ◇ marker's tooltip reads "Instance of {main component} — Edit main component (Shift+F10)". Needs an SC-3 registry row (Layers column) — 00 owner |
| Move to page… | Existing dialog. **Pre-check (NEW):** refuse with reason if a moved item is a page-only main component or uses one *(R-1018, SC-11 noun)* ("Heading uses a page-only component — save it to the library first"). After move: toast "Moved 2 elements to About" + **Go to page** (opens About with the moved elements selected — IAF-03 G); current page selection clears (existing) |
| Delete | Single or many: no confirm — Undo toast "N elements deleted · Undo" (SC-3) |
| Empty-canvas click | **No longer closes the Layers panel** (BD-13 stable tools); it deselects only |

## 8. Multi-select
- Footer summary: "3 selected · 1 locked · 1 component" *(mixed state)*.
- Bulk rules keep today's behaviour: Delete / Cut **skip locked members and apply the rest**; Duplicate copies all members (locked copies come out unlocked, unchanged); with the existing LOCKED_ELEMENTS_SKIPPED toast ("2 locked elements skipped"); Group and Move to page refuse the whole set when any member is locked or an instance part (Group: **Fix** for the lock part — today only instance parts are refused, INV 11.14 *(R-1018, T2-10)*; Move to page: NEW). Ungroup refuses a locked container (Fix). The footer summary (NEW) tells the user in advance which members will be skipped.
- Selection mode (checkboxes) kept for touch-free bulk picking. "Select all on page" covers every element when no search is active; while searching it selects the matching rows (existing `index.tsx:430`), labelled "Select all matches".

## 9. Search
- Kept (name, type, tag, id). Results show **path subtitle** ("Hero › Content") under each flat result *(DS)* so duplicates ("Heading" ×12) are distinguishable. Enter on a result selects and reveals it in the tree (clears search, keeps focus on row).
- Escape per Panel 00 SC-2 search-field exception: first Esc clears the search, a second Esc **blurs** the field *(R-1018, D2-3 / CS-17 — was "→ no-op")* (**Change:** Esc never deselects or closes Layers — BD-13 stable panel; deselect is the canvas's job).

## 10. Scale, geometry, accessibility

**Scale:** virtualize the tree when visible rows > 300 *(DS threshold)*; roving focus, selection, rename and drag must survive recycled rows (handoff CTRL-07). Rebuild batching kept.

**Geometry (NOT MEASURED):** panel 284 / 260 / 360 bounded resize (keyboard splitter); header 44 + search 32 sticky; one scroll (custom thumb kept); footer 32 sticky; rows **32 default** (GEO-01 dense tool row), **28 when "Compact rows" is on** *(DS: default changes from compact-on to comfortable; existing users' stored preference is kept)*; row actions 24 inside row with ≥8 spacing *(R-1018, CS-07)*; context menu **280w** (DS §4 context menu; V7 popover-md — was 224), items 32, `shadow-drag` (V4), clamps to viewport − 16 like every menu (SC-3 clamp) *(R-1018, T2-13 / CS-16)*. Header and rows are `TreeRow`/`PanelHeader` from chrome-ui. Motion: expand/collapse base 160, menu open base 160, reduced motion → instant *(R-1018, V5)*. At 260 the name keeps ≥ 96px before markers collapse into "+N".

**ARIA (Fix LY-19):** `tree` (`aria-multiselectable="true"`) containing a **flat list of `treeitem`s** (compatible with virtualization) each carrying `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded` (parents), `aria-selected`; no nested `group` elements. Type-ahead and Show in Layers search the **data model**, not rendered rows; Home/End; type-ahead by name; ← on expanded collapses, on collapsed moves to parent; → on collapsed expands, on expanded moves to first child; Enter selects; F2 rename; Delete; ⌥↑/↓ and ⌥Home/End move; context menu via Shift+F10 / Menu key.

## 11. States, roles, persistence

| Condition | Behaviour |
|---|---|
| Viewer / read-only view | Tree, search, select, hover, expand available; **Change:** Dim in editor becomes available to viewers (today `readOnlyView` removes the eye) — it is a personal view preference, writes nothing; rename, drag, move, lock, structural menu items hidden; Delete key ignored with "View only" announcement (Fix LY-18) |
| Locked element | §6 rules |
| Empty page | "No elements yet — add a section to start this page" + **Add a section** (opens Add at Sections) *(R-1018, T3-3 — Panel 16 §4.6 copy wins)* |
| Load error | Existing Retry boundary, copy "Couldn't load layers — Retry" (DS §3 load-error pattern) *(R-1018)* |
| Inherited lock | §6 inherited-lock rules (SC-14) *(R-1018)* |
| Rejected drop | Existing alert (3s) → inline near the drop point, also announced |
| Persistence | Expanded state, scroll, dim set: per page, local (existing). Display prefs: local (existing key) |

## 12. Preservation map

| Old | New | Disposition |
|---|---|---|
| LY-01 header ⋯ (Expand/Collapse/Display) | ⋯ + Display via ≡ beside search | Keep |
| LY-21 Widen to 700 | Bounded resize 260–360 (GEO-01); long names via tooltip, indent cap and path subtitle | **Change** — wide mode removed: GEO-01 caps the panel at 360 to protect the canvas (700 left ~400px canvas at 1440) |
| LY-02 search | + path subtitle, Enter reveals | Keep + extend |
| LY-03 display settings (5) | Same 5; CMS glyph now always on, tint optional | Keep |
| LY-04 footer + selection mode | + mixed-state summary | Keep + extend |
| LY-05 states | Same; empty adds Add link | Keep |
| LY-06 row + markers | Fixed M/T/D; condition marker; indent cap | Keep + Fix |
| LY-07..09 select/hover/expand | Same; Shift range visible-order; Collapse to selection | Keep (one change) |
| LY-10 rename | Lock-safe | Fix |
| LY-11 drag | + auto-expand/auto-scroll | Keep + extend |
| LY-12 menu | + Lock/Unlock, Select children, Move up/down/into/out, Show on canvas | Keep + extend |
| LY-13 eye | Renamed "Dim in editor", explicit live-site link | Redesign (same behaviour) |
| LY-14 lock | Existing refusals kept + 4 NEW refusals (menu Rename, paste-into, insert-into, Move to page) + Group/Ungroup lock refusal (Fix, T2-10) + inherited-lock marker and refusals (SC-14) | Keep + Fix *(R-1018)* |
| LY-16 components | ◇ kept; main-component marker NOT added (no model); instance rows gain **Edit main component** (N1) | Keep + door *(R-1018)* |
| LY-17 perf | Virtualized above 300 rows | Fix |
| LY-18/19 gating, ARIA | Completed | Fix |
| Empty-canvas click closes panel | Removed | Change (BD-13) |
| — | Show in Layers; tree keyboard move (reusing canvas chords); Move-to-page pre-check + Go to page | New |

**NEW in this panel:** Show in Layers (⇧L); tree keyboard move; Move up/down/into/out and Select children in menu; Lock/Unlock in menu; lock refusal for menu Rename, paste-into, insert-into, Move to page; Move-to-page pre-check and Go to page; Collapse to selection; search path subtitle; drag auto-expand and auto-scroll; mixed-state footer; ◐ condition marker; M/T/D marker fix; always-on CMS glyph; indent cap + depth badge; virtualization; flat ARIA tree semantics. **Changes:** default rows 28 → 32; Shift range visible-order; empty-canvas click no longer closes Layers; Widen-700 removed; Dim available to viewers; eye renamed "Dim in editor".

No capability removed except the 700 wide mode (Change, rationale above).

## 13. Acceptance (specified, NOT RUN)

| ID | Pass condition |
|---|---|
| T-LY-01 | Element hidden on Mobile in Inspector shows "M" in Layers; marker announced |
| T-LY-02 | Dim in editor: tooltip says still published; publish output contains the element |
| T-LY-03 | Locked element: menu Rename and Move to page now refused with reason; existing refusals (Delete key, Cut, drag) unchanged; Duplicate still allowed (copy unlocked); multi-delete with one locked member skips it with the existing toast |
| T-LY-04 | In the tree, ⌥↓ moves the focused row down one sibling via the same command as the canvas; one Undo restores; "Move into above" on a non-container refused with drag's message |
| T-LY-05 | Canvas "Show in Layers" on a deeply nested element opens Layers, expands, scrolls, focuses row |
| T-LY-06 | Multi-select with one locked → Group disabled with reason; nothing partially grouped; Ungroup on a locked container refused (Fix — today both skip the lock gate) *(R-1018, T2-10)* |
| T-LY-07 | Move to page with page-only component → refused with reason; valid move → Go to page selects moved items |
| T-LY-08 | 5,000-node fixture: scroll, select, rename, drag remain responsive; focus survives recycling |
| T-LY-09 | Screen reader: level, position "3 of 7", expanded, selected, markers read; Home/End/type-ahead work |
| T-LY-10 | Empty-canvas click deselects but keeps Layers open |
| T-LY-11 | Existing Layers tests (~133 + LayersTab) updated with the change, not deleted |
| T-LY-12 *(R-1018, D2-11)* | Lock Nav: its children show the outline lock marker, read "Locked by Nav", are selectable only from Layers, and any edit shows "Locked — unlock to edit" |
| T-LY-13 *(R-1018, N1)* | Instance row → Edit main component opens Components with it selected; "‹ Back to Layers" restores selection and focus on the row |
| T-LY-14 *(R-1018, D2-3)* | In Layers search, Esc clears; a second Esc blurs the field; selection and panel unchanged |
| T-LY-15 *(R-1018, D2-30)* | A dimmed row's name measures ≥4.5:1 against its background (selected and unselected); no row uses opacity for state |
| T-LY-16 *(R-1018)* | Rows render through chrome-ui `TreeRow`; eye and lock buttons are 24 with ≥8 px between them; the context menu measures 280 wide and stays 16 px inside the viewport |

## 14. Review and not verified
Independent `design-qa-critic` review done (see Status line; this footer was stale until 2026-10-17). Not verified: runtime, virtualization performance numbers, screen-reader output, measured geometry.
