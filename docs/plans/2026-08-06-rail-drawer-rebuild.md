<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260806-114656.md -->

# Rail + drawer inner panels — rebuild to the boards

2026-08-06. Founder order: *"sab se pehle left side ki rail karo, un ke inner
sections totally mismatch hain"* — and **no Codex** (`codex_reviews=disabled`;
the last Codex direction was reversed by evidence). Claude-only voices.

## Scope — from `packages/editor/scripts/conformance/boards.json`

| Family | Root board | Boards | Shipped code |
|---|---|---:|---|
| Rail | `52:6` (in shell board) | 1 | `rail/tabsConfig.ts` + LayoutShell — RAIL_FIGMA matches 6 items; logo tile is NOT on the board |
| Insert | `137:2` | 9 | `sidebar/tabs/build/` (ElementsTab etc.) |
| Layers | `142:2` | 11 | `panels/layers/` + `sidebar/tabs/layers/` |
| Pages | `140:2` | 10 | `sidebar/tabs/pages/` |
| Media | `144:2` | 17 | `editor/media/` + `sidebar/tabs/media/` |
| Content | `148:2` | 11 | `sidebar/tabs/content/` |
| Brand | `152:2` | 26 | `editor/design-system/` |
| **Total** | | **85** | |

Order: Insert → Layers → Pages → Media → Content → Brand (frequency order, and
Brand last because 26 boards of one panel = volume, low judgement).

## Premises (founder-stated, gate below)

1. The drawer panels' inner sections **do not match their boards** — confirmed
   for the shell already (inspector body accordion-vs-flat was the visible
   proof); the drawer inners are the founder's named pain.
2. The board is the contract for everything visual (standing precedence rule,
   `packages/editor/CLAUDE.md` §FIGMA UI REBUILD).
3. Per-board loop is Figma's official skill: `figma-design-to-code` →
   `get_design_context` → build → **verify = board screenshot vs live
   screenshot, by eye**. Probes/harness = regression net only.
4. Behaviour stays: panels keep their Composer wiring, handlers, tests on
   behaviour. Re-derivation changes what renders, not what it does.

## Per-family loop (the standing CLAUDE.md loop, applied 6×)

1. `get_design_context` on the root board; states fetched as needed per board.
2. Rebuild the panel's render tree to the board: structure, section order,
   copy (shape, not sample data), geometry, `--bk-*` tokens via `tw:`.
3. Behaviour tests on touched files BEFORE re-derivation where thin.
4. Live screenshot at 1440×900 with the panel open, matching board state,
   side-by-side vs board screenshot. Iterate until the eye says match.
5. Tests protecting the old design rewritten in the same commit.
6. One commit per family minimum; ratchets stay green (`--update` with reason
   where board-driven CSS genuinely grows).

## Known deltas going in (from the shell pass)

- Rail: logo tile ships, board has none. Insert active-state tint differs by
  state, not drift.
- Tip banner / FAB / "0/7 done" checklist float over the drawer — on no board.
  Founder call needed: demo-only or chrome (surfaced at the gate).
- Drawer inner sections: founder says "totally mismatch" — the per-board fetch
  will produce the exact delta list per family.

## Acceptance

Per family: side-by-side screenshot match (board vs live), behaviour tests
green, family commit pushed. Arc done when all 6 families + rail pass the eye
test. `boards.json` recipe coverage may grow behind it (regression net), never
gates the visual call.

## Premise gate — DECIDED (founder, 2026-08-06)

Voice (Claude-only, Codex disabled) found 4 of 6 families re-derived to these
boards on 08-04 and recommended flipping to Pages→Brand full + 4 audits.
**Founder held the original: ALL SIX full rebuild, original order.** Presented,
decided, final. **Brand IA: boards win** — the 26 drawer screens replace the
4-tab workspace render tree; registries and state stay.

## Step 0 (from the voice, absorbed)

- DELETE `rail/DrawerPanel.tsx` (+test/CSS) and `sidebar/tabs/ElementsTab.tsx`
  + `tabs/elements/` — dead code, nothing routes them. `BuildTab` is Insert.
- **PanelFrame/PanelHeader/SearchBar FROZEN** for the arc — 10+ consumers.
- Plumbing mines: `TabRouter.tsx` display:contents trap (root layout change →
  every panel's scroll collapses to 16px); `LeftSidebar.tsx:565` variable width
  + `ui:media-panel-width`/`ui:templates-panel-width` events (320↔700) — never
  hard-code 320.
- Corrected: tip banner (`138:244`) + onboarding checklist (`807:6694`) ARE
  board-backed. Only History FAB undecided, out of scope.
- Per family commit: existing specs stay green + root-board recipe added
  (regression net armed; eye still decides).

## Decision Audit Trail

| # | Phase | Decision | Class | Principle | Rationale |
|---|---|---|---|---|---|
| 1 | CEO | All 6 full rebuild, original order | Premise gate | founder | held after evidence of 08-04 re-derivations |
| 2 | CEO | Brand IA = boards (drawer screens) | User decision | precedence rule | visual → board |
| 3 | CEO | Dead code deleted step 0 | Mechanical | P4/no-dead-code | zero routers import them |
| 4 | CEO | PanelFrame frozen | Mechanical | P2 blast-radius | 10+ consumers incl. out-of-scope panels |
| 5 | CEO | Recipes ride per family | Mechanical | gate-must-fail doctrine | net armed, never gates the eye |

## Insert `137:2` — extracted board contract (fetched 2026-08-06)

Geometry (px), **re-fetched after founder edits (2nd fetch, same day)**:
header **44h** (title 11/500 caps tracking .5) · search band **36h, border
`--bk-border` + rounded-6** (box 288×28 **bg gray-50 `#f9fafb` + border
`--bk-border`**, rounded-6, "Search elements" 13 muted + `⌘F` Geist Mono 11
right) · group header **32h** (▾/▸ @16, LABEL 11/500 tracking .5 @32, count
Geist Mono 11 right @284) · list row **32h, rounded-4** (12px icon rounded-2 +
13/400 label, px-16 gap-8) · flex spacer · pinned `⌥ Paste HTML…` row 32h ·
**TipsFooter 40h** (accent-tint bg, tip 12, controls 11 tracking .5). Board
root: white + 1px `#f3f4f6` border. Founder's edits = outlined lighter search
field, rounded rows, bordered band; taxonomy and heights unchanged.

Panel-header component doc (16:6, applies to ALL SEVEN drawers): *"44h. Title
is 11/600 caps 8% tracking — a label, not a heading. **Pin sits before
close**: closing is the last thing you do, so it goes last."*

**THE mismatch (founder was right on Insert):** board groups are
**ELEMENTS 48 · BLOCKS 63 · COMPONENTS 27 · TEMPLATES 10 · MINE 4** —
five groups, catalog-source taxonomy. Live BuildTab ships
**BASIC/LAYOUT/FORMS/MEDIA/NAVIGATION/INTERACTIVE** — six element-type
categories. Different IA, not drift. Counts are sample data; group names are
structure. Rebuild = regroup the catalog to the board taxonomy (`blocks/` dir
→ BLOCKS, `componentsData.ts` → COMPONENTS, `templates/` → TEMPLATES, user's
own → MINE). Header gains PIN before close; live's "53 blocks · 6 categories"
subtitle is NOT on the board.

Insert state-board ledger (updated after fetches):
- 137:2 default ✅ rebuilt+verified · 775:4053 loading ✅ · 781:4154 load-error ✅
- 138:2 group-expanded ✅ — BLOCKS is a CARD GRID (`Card / media` 17:6:
  136×104, 136×76 thumb, 2 cols 16+136+16+136+16=320 EXACT, "140 overflows
  by 8"). Rows implementation replaced with the grid.
- 138:198 disabled-item ✅ — Soon tag + reason tooltip (ink bg, white 12) +
  no insert; wired to the pre-existing ElEntry.disabled flag.
- 138:53 searching ✅ IMPLEMENTED:
  flat result rows 32h — label 13 ink @16 + SOURCE-GROUP tag 11 caps muted
  right (@230, tracking .5). NO "N results for" header, NO category grouping,
  NO cards. Results span ALL sources (sample: Button/ELEMENTS,
  Button group/BLOCKS, CTA button/COMPONENTS) — search must cover elements +
  blocks (+ components/mine when async). Paste-HTML row + TipsFooter STAY
  VISIBLE during search (current code hides panel-bottom while searching —
  board contradicts). SearchResults.tsx needs the rebuild.
- 138:106 no-results ✅ — board draws NO sparkle icon: two lines only,
  muted "Nothing matches 'X'." (curly quotes + period) + accent "Clear
  search" link. Old icon+button state replaced; .bld-no-results CSS deleted.
- 138:153 dragging ✅ — behaviour-note board ("Dragging to canvas — the
  panel keeps its scroll" is an annotation, not a UI row). Contract: drag
  mutates no panel DOM — handleDragStart only sets dataTransfer, already
  true. Default-view geometry re-confirmed against shipped GroupSection.
- 138:244 tip-dismissed ✅ — dismiss removes the TipsFooter band ENTIRELY
  (no collapsed pill). Component already returned null; dead collapsed/
  onToggleCollapsed plumbing + BUILD_TIPS_COLLAPSED key deleted.
- ALL 9 INSERT BOARDS FETCHED, CONFORMED, AND EYE-VERIFIED (2026-08-06):
  default/searching/no-results/tip-dismissed/card-grid live at :5050,
  disabled-row via probe case `insert-disabled-row` (:5051, run
  `npx vite . --port 5051` from packages/editor — root is the PACKAGE, not
  e2e/probe; URL is /e2e/probe/probe.html?case=…), loading/error via probe
  earlier. One-shot capture script: `e2e/insert-eye-verify.mjs`.

### Founder visual pass 2026-08-06 (board screenshots vs live, all 9 frames)

Second sweep after the founder called a mismatch. Four real deltas found and
fixed (all were in the "frozen" shared chrome, which the first pass under-
compared — the frames, not the contracts, caught them):
1. SearchBar drew a magnifier + inline ✕ + bordered ⌘F chip — board 137:8
   draws NONE of those: text + bare Geist Mono 11 hint, hint stays during
   typing (138:53). Also killed the `-apple-system` fallback stack
   (DESIGN.md anti-slop 8) and the inner flowbite focus ring (double-box).
2. TipsFooter rendered the tip body inline — every board draws ONLY
   "💡 Tip n/N" + ‹ › ✕. Body now rides on title hover.
3. `.bld-kbd-hint` was a 9.5px bordered chip — board is bare 11/500 mono.
4. PIN WAS DEAD: `StudioPanels` defaulted `panelPinned = true`
   (half-controlled) so the header pin never unpinned anywhere in the app.
   Now uncontrolled-with-override like LeftSidebar.
Known intentional deltas vs frames: real glyphs instead of the board's
placeholder icon squares; live counts/rows instead of sample 3-row data.

### Insert — coverage matrix (FINAL)

| Board | State | Where it lives | Verified |
|---|---|---|---|
| 137:2 | default | BuildTab + GroupSection | eye ✅ |
| 775:4053 | loading | InsertStateBlocks (probe-only mount) | eye ✅ |
| 781:4154 | load-error | InsertStateBlocks (probe-only mount) | eye ✅ |
| 138:2 | group-expanded (BLOCKS card grid) | GroupSection blocks branch | eye ✅ |
| 138:198 | disabled item | Row disabled+reason (probe mount; no prod entry disabled) | eye ✅ |
| 138:53 | searching | SearchResults flat cross-source | eye ✅ |
| 138:106 | no-results | SearchResults empty branch | eye ✅ |
| 138:153 | dragging | behaviour note — drag mutates no panel DOM (handleDragStart) | contract ✅ |
| 138:244 | tip-dismissed | TipsFooter dismissed→null | eye ✅ |

### Insert — codebase-only flows (in code, on NO board — documented, NOT deleted)

1. **useBuildTab dead surface**: `favs/toggleFav/clearFavs/restoreFavs/
   favsInformed/markFavsInformed/favOpen/setFavOpen/openCats/toggleCat/
   allElements/insertionContext` — ZERO consumers outside the hook + its
   tests since the rebuild (ElCard carried the star; deleted). ElementsTab/
   ComponentsTab favorites are a DIFFERENT system (useElementsState /
   useComponentsState). Founder call: delete the surface or design a
   favorites board.
2. **TransitionCallout + useCallout** — one-time v4-transition notice, still
   renders above the groups; no board draws it.
3. **"/" focus shortcut** — board shows only ⌘F; "/" is an extra
   typing-context-safe alias (kept, harmless).
4. **openCats search-restore** (setSearchQuery capture/restore) — restores
   accordion state that no longer drives the default view (openGroups is
   BuildTab-local now).
5. **Media element needs-asset auto-open** (useBlockInsertion) and the
   registry-miss container fallback — behaviour contracts, boardless by
   nature.

Gate note (pre-existing, NOT from this arc): `gate:buildrick` FAILs 78→116;
the +38 are storage-key strings in canvas/layers/shell tests from earlier
arcs. The gate is in NO verify chain (verify:ds excludes it) so it sat red
unnoticed — same class as the dashboard gate:figma trap. Founder call:
re-baseline with reason or wire it into verify:ds.

## NOT in scope

- Inspector flat body (board `52:56` / `824:5095`) — next arc after this one;
  already the named biggest shell mismatch.
- Drawer drill-ins beyond the 85 boards (Media drill-in boards ARE in the 17).
- Backend/behaviour changes; `AquibraStudio.tsx` (founder's dirty file).
