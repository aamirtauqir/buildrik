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
Known intentional deltas vs frames: live counts/rows instead of sample
3-row data. Icons: founder ruled 2026-08-06 (AskUserQuestion) — EVERY element
row draws the board's 12px solid ink-muted rounded square; the per-element
SVG glyph system in the Insert rows is retired (glyphs return only via a
Figma icon library regenerating like tokens). SvgIcon.tsx survives — the
rail (TabRouter) still consumes it.

### Header action correction 2026-08-06 (founder): EXPAND, not pin

16:6's first header action is the corner-brackets EXPAND icon (the frame's
own SVG) — the component description's "Pin sits before close" text is
STALE; the drawn icon wins. Founder chose the action: 320↔700 drawer width
toggle (pattern media/templates already had). Shipped across all seven
drawers: PanelHeader draws the board SVG with Expand/Collapse labels;
LeftSidebar owns the expand state and width; PanelFrame `narrow` became
w-full (the fixed w-80 froze every panel at 320 regardless of drawer
width); the pin plumbing (isPinned/onPinToggle, StudioPanels state, dead
PinIcon/HelpIcon/CloseIcon) is deleted. Verified live: 320→700→320.

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

## Insert taxonomy — FOUNDER FINAL 2026-08-07: TEMPLATES OUT

"Template ka apna poora flow hai, Insert mein adjust nahi ho raha." Insert
= ELEMENTS · BLOCKS · COMPONENTS · MINE. Templates' surfaces: rail tab
(gallery 641:2487), Pages new-page (S1.3b), first-run (S1.1b). MINE now
expands INLINE (board 1069:4970) — live user components, click =
instantiateComponent (same parent contract as the Components surface).
COMPONENTS stays navigate: its expanded board (1069:4790) draws a curated
UI catalog with NO live source yet — inline would duplicate MINE.
FIGMA DEBT (founder's file): Insert boards still draw a TEMPLATES group
row; `Insert · templates-expanded` (1069:4905) is obsolete; the 3 NEW ONES
boards are unwired. Founder to update/delete or delegate.

## Insert — COMPONENTS inline SHIPPED 2026-08-07 (board 1069:4790)

The catalog source turned out to EXIST: `src/blocks/Components/` — 13
component blocks (Card, Slider, Testimonials, Pricing, Progress, Countdown,
Accordion, SocialIcons, Stack, Switch, Tabs, Modal, Table). Registry now
exports `componentBlockDefinitions`; Insert's COMPONENTS group expands
inline with those rows (same Row + same onBlockClick insert path), BLOCKS
carries the remaining 50, search gains the third COMPONENTS tag (board
138:53's sample always showed it), and the navigate kind is gone — all
four groups are inline. Components MANAGEMENT surface stays on the rail.
Insert family: every board implemented, no navigate/inline conflict left.

## Templates + Components families — PULLED INTO SCOPE (founder, 2026-08-06)

Founder hit them THROUGH Insert (the navigate groups land on the old-design
tabs) — "insert ke andar templates/components ka layout totally mismatch."
Two families, 11 boards: Components (library 641:2546 · detail 641:2599 ·
create 642:3112 [1440] · loading 778:4173 · load-error 781:4433), Templates
(gallery 641:2487 · preview 642:2556 [1440] · applying 642:2832 [1440] ·
loading 778:4102 · load-error 781:4372 · no-results 782:4402).

### Templates · gallery contract (641:2487, fetched)
Header 44 "Templates" + expand + ✕ · Search = FORM INPUT 10:16 (42h box,
px-12 rounded-8, 14/20 placeholder gray-400, wrapper px-8 py-6 — NOT the
Insert 137:8 band) · "PAGE TEMPLATES" section header 28h (16:16: caps
11/500 track .5 muted, mono count right) → full-width cards px-16 py-8
(thumb w-full 88h bg-subtle border rounded-6; meta: name 13/500 ink left +
"N sections" 11 muted right) · "SECTION TEMPLATES" → 32h rows (label 13
ink · right "Free"/"Pro" 11 muted · › 13 muted) · flex spacer · Panel
footer border-t px-16 py-10 with SECONDARY button 28h rounded-8 bordered
"Browse all templates". State hotspots → loading/error/no-results boards.

### Components · library contract (641:2546, fetched)
Header 44 "Components" + expand + ✕ · NO search · "YOUR COMPONENTS" 28h →
32h rows (name 13 ink · "N instances" 11 muted · ›) · "FROM BRAND" → rows
(name · "linked" · ›) · spacer · footer border-t with PRIMARY button
(accent fill, white 13/500, 28h rounded-8, elevation/raised) "+ Create
component". Hotspots loading/load-error.

Order: these two drawer views land immediately after this note (founder is
looking at them); their loading/error/detail/preview/create states follow,
then Layers 142:2 resumes.

## Layers family — root board conformed (2026-08-07)

142:2 fetched; live diffed by eye; deltas fixed: header gained the expand
toggle; toolbar search dropped its magnifier (board 142:8 is a bare box);
tree-row icons became the 12px solid ink-muted square (founder's Insert
icon call, and what 244:1580 draws); eye/lock are ALWAYS drawn at gray-300
(were hover-reveal — board contradicts) in board order 👁 then 🔒; rows are
28h px-16 gap-8; selected = accent-tint + 2px accent bar with the label
staying ink (was accent-600 bold, not on the board).
State passes DONE 2026-08-07 (from the founder's own board exports, all 11
frames in hand): empty 143:355 = two centered muted lines + "Open Insert"
accent link (icon/button/old copy gone); filtered 143:2 = FLAT match rows
(no indent/chevron/ancestors — itemMatches exported and reused, footer
keeps the total); dragging 143:60 = full-width edge-to-edge accent drop
line; invalid-drop 143:119 = full-width ink band with the reason in white
12 (was a red tinted card with a ⚠️ emoji); hidden 143:179 = muted label
(italic dropped) + gray-300 icon/chevron + gray-200 controls; locked
143:237 = lock-on in ink (was warning-orange — board draws it dark);
multi-select 143:295 = footer flips to "N selected of M" at 2+; row indent
base fixed 6→16 (board px-16); the layers search input lost its inner
flowbite ring (container is the box). Loading/error/no-results were
already live (08-04). 1082:4739 component-instance DONE 2026-08-07: ◇ instance badge (success
token) between label and eye on component-linked rows via
components.isInstance. The board's ◆ master badge is DEFERRED — no
persisted master↔element link in the model (sourceElementId lives only on
the created-event payload); its purple is gate-18-banned anyway, so colors
are tokens. Board styling itself is an off-palette outlier (old grays,
rounded card) — the BADGE is the contract, 142:2 chrome stays. Board still
NOT in boards.json (founder's file, regenerate pending). Loading/error/no-results shipped 08-04 (LayersStateBlocks).

## Pages family — tree board conformed (2026-08-07)

Census first (learning applied): 10 boards.json boards + 3 S3.7
page-settings shell screens, NO hidden founder batch. 140:2 fetched, live
diffed. Shipped: the segmented Pages/Search-listings pill control is GONE —
board 140:7 draws a 28h bare search box (always on; the 5-page canSearch
gate deleted) with the "⊞ Listings" text link right (listings view keeps a
"‹ Pages" back link); rows go board-exact — always-visible 16px checkbox
(was bulk-mode-gated CSS), NO slug, NO status/home chips (status stays in
the aria-label), icon only on Home (roof glyph) and external (link glyph);
footer is the "+  Add page" accent text link (count stats gone; From-
template/New-folder survive on the ⋮ overflow). 187/187 tests (11
old-design chip/slug tests rewritten same-commit).
Delta passes DONE 2026-08-07 (all frames screenshotted first): 141:124
empty is the ONE-PAGE state (Home row + centered "This site has one
page." + Add link) — shipped, replacing nothing (zero-pages EmptyState
stays for the unreachable case); 141:165 load-error centered board copy
("Couldn't load your pages." / "The site is fine — this panel isn't." /
Try again); 782:4212 no-results left-aligned curly-quote copy + Clear
search; 141:40 searching = FLAT results incl. folder members (a real BUG:
the folder filter hid them from search) with the muted "in {Folder}" tag;
141:78 bulk = light bottom band replacing the Add-page footer at ANY
selection (was a floating dark pill gated at 2+), plain 13 ink actions.
141:207 listings DONE 2026-08-07: compact 4-col table (PAGE/TITLE/DESC/
SCORE), caps header band, 32h rows, Set/Missing-in-red, deterministic mono
score from the real SEO signals (100 − 40 no-desc − 15 fallback-title −
25 dup-title − 20 noIndex), red under 50; "Open full listings ›" widens
the drawer (the 700 view IS the full table). 774:4044 loading shipped with
its probe mount.
Folder row DONE 2026-08-07 (boards 140:11-12 + Checkbox 12:26): the three
deltas were all INLINE styles in PageFolder.tsx, not CSS — count pill →
bare Geist Mono 11 via the `.bd-pg-folder-count` class (inline style
deleted, CSS is SSOT), folder glyph `--bk-warning` → `--bk-ink-muted`,
and the row gained the 16px parent checkbox: on when every member is
selected, `mixed` (accent bar) on partial per the Checkbox 12:26 doc,
click selects the remainder / clears all. Folder-child PageRows now
receive isSelected/onToggleSelect (they had NO selection wiring before —
folder members could never join a bulk selection). Live-verified via
drag-into-folder script; mixed state covered by unit test (needs ≥2
members).
435:2348 PageTabBar DONE 2026-08-07, eye-verified against the board:
bar MOVED to the canvas FOOT (was mounted first child of
LayoutShell.Canvas — board title literally says "bar sits at the canvas
foot"), + button pulled adjacent to the tabs (TABS lost flex-1), ⌂ text
glyph replaces the 🏠 emoji (ink-soft active / ink-muted resting), dirty
dot + valid-rename border → --bk-blue-500 per the board (not the 700
accent), add-btn gray-400 dashed with 14px +. Context menu: emojis
dropped, "Set as home"/"Delete" copy, 160w menu now real CSS classes in
shell/chrome.css (.bd-ptb-menu/-item) because flowbite Button's theme
(h-10, justify-center, font-medium) beat tw: overrides — same fix the
Layers menu proved. Rename validation trio: popover PORTALED (the
tablist's overflow-x-auto clips vertical overflow — it never showed at
all at the foot) and opens ABOVE the input via measured rect;
warning/valid border needed focus-variant classes too (flowbite's
focus:border overrode the static border while focused — error only
survived via aria-invalid). ConfirmDialog copy → board ("This page and
everything on it is removed…", "Delete page"). Live-verify traps: global
[role=tab] matches the 6 RAIL buttons before page tabs (scope to the
tablist), and playwright dispatchEvent("contextmenu", {clientX}) builds
a plain Event — coords lost, NaN left/top — use a real right-click.
S3.7 page-settings DONE 2026-08-07 (302:1978 / 302:2004 / 302:2026):
the in-panel slide-over became the boards' centered 580×520 modal card on
a 60% ink scrim (scrim click + ESC close through the existing unsaved
guard) — header is "Page settings — {name}" 16 semibold + bare text-link
tabs (active --bk-blue-500 semibold 14), body px-28 with 42h rounded-8
inputs (drawn instances beat the Input 10:16 doc's 36h — drawn-wins
precedent). Back-chevron, slug line and Save button chrome deleted;
autosave + ⌘S own persistence, an error-only Retry row renders on save
failure. Tab CONTENT kept the code contract (score card, AI suggest,
counters, slug warnings, visibility segmented control) — the boards'
bare 4-input fixtures are shape, not a field-deletion order. Scrim
verified by PIXEL SAMPLING (canvas 112/255 = exactly 0.6 ink over
white) — the downscaled screenshot preview LIES about large translucent
overlays; sample pixels before declaring a scrim missing.
REAL BUG found by the S3.7 live walk: every Pages context-menu action
(Rename/Duplicate/Set as Homepage/Settings/Delete) was DEAD — usePages'
outside-mousedown guard checks closest(".bd-pg-menu") and the wrapper
no longer carried the class, so any item mousedown unmounted the menu
before its click fired. A test comment even called the class "only ever
an implementation detail" — the test was the bug's cover. Class
restored (load-bearing comment added) + 2 regression tests, incl. one
that replays the exact guard.
Pages family: ALL boards + states + S3.7 CLOSED. Next family: Media 144:2.

MEDIA census 2026-08-07 (page 1:3 by name): 12 panel states + 5 drill-ins
+ 2 S3.6 (editing/optimizing) + overview 75:2. Captions read as contracts.
Media pass 1 (grid 144:2 + filtered 145:2 + empty 145:359) DONE:
- Type pills are now the caption's MULTI-SELECT filter — activeTypes Set is
  the SSOT in useLibraryState (csv-persisted, old single key migrates),
  fullpage keeps a derived single activeType for its sections; the "all"
  pill died (empty set = all). Chip now renders a real 0 (load-error is
  the one state that hides counts, per its caption).
- Header gained the expand brackets (320↔700 via setPanelExpanded — the
  700 ExpandedMediaPanel already existed), search became the bare board
  box, folder-row toggles lost their button boxes (plain glyphs, still
  disabled until T12), empty state = board copy "No images or files yet."
  + Upload / Browse stock accent links (filled CTA gone).
- REAL FIXES the pass surfaced: engine "svg" assets were bucketed into
  "img", so the svg pill's count was a permanent 0 (mediaUtils
  assetTypeToFilter — contradicted TypePills' own mapping doc); and the
  engine strips file extensions at upload while the board draws full
  filenames — display-level displayName derives the ext back from MIME
  (name stays ext-less for alt-text/rename).
- Live-verified with real uploads: per-file 44h progress rows ✓, upload
  auto-expand behavior confirmed deliberate (useMediaState), multi-select
  verified in drawer AND expanded panel. Upload of .svg lands under the
  svg pill now.
Media pass 2 (states) DONE 2026-08-07 — probe-verified by eye:
loading/load-error/empty conformed already; no-results took board
782:4353's copy ("Nothing matches '{q}'." + Clear search, left-aligned;
pill-only zero keeps its own line — the board only defines the search
case); load-error hides pill counts via discMode (the CAPTION is the
contract — the board drawing's 128s are sample artifacts); quota-warn
145:199 = warm band "842 MB of 1 GB used" (MB-precise under 1 GB) + bar
+ "Optimise images to free space ›" (wired to onOpenLibrary — the
manager owns optimization); quota-full 145:250 = red band with the
reason ON the number + "Nothing already on your sites is affected." +
footer Upload DISABLED not hidden, track removed at full. The compact
upload-zone strip no longer duplicates quota messages (drag/rejection
only). upload-failed 145:148 verified against the existing probe.
Media pass 3 (asset drill-ins) DONE 2026-08-07: AssetDetailOverlay
REBUILT from the 5-tab drawer to board 146:2's list-row HUB — preview
well (160h, mono dims), alt text + ✨ Generate above the fold (wired to
generateContent; generatedAltMeta is provenance {generatedAt, model},
NOT text — nearly shipped an object into the input), then the five 32h
rows. Versions view = board 146:32 (56h rows, current pinned on
accent-tint with the 3px bar, size deltas from restore-point bytes,
"original" on the last, INLINE 32h Restore?/Cancel/Restore band — no
modal); Used-in view = board 146:68 (28h page-group headers + 44h rows
+ Jump → setActivePage + select; NEW collectUsageByPage util walks the
serialized page trees CROSS-PAGE — the old tab was active-page only).
Dropped from the surface per board: Add-to-page/Delete footer,
Prev/Next, rename input, sibling-filename version list (grid already
shows those as items). No author line on versions — AssetVersion
carries none (codebase gap; board's "Ali/Sara" = sample shape).
TRAPS: .med-detail-overlay CSS was scoped .med-tab/.exp-panel only —
in the drawer (.sl-launcher) the drill-in rendered BELOW the grid in
static flow (positioning now lives on the component); flowbite Button's
justify-center centered the back row + hub rows (explicit
justify-start); overlay Escape now stopPropagation()s so one keystroke
can't also fire the drawer's own close.
Media pass 4 (icon-picker + stock-browser drill-ins) DONE 2026-08-07:
icon-picker 147:2 = IconBrowserOverlay (footer Icons link now opens the
drill-in, NOT the modal): search carries the REAL catalog count (368),
All ▾ + "17 categories" mono, RECENT band capped at 12 (recents SHARED
with IconPickerModal via STORAGE_KEYS.RECENT_ICONS — same literal the
modal already wrote), 6-col 40×40 tiles; pick = insertMedia(name,
"icon") + toast + pop. IconPickerModal stays the inspector's
size/colour/stroke flow. stock-browser 147:55 = StockBrowserOverlay
(drawer footer Stock now opens the drill-in; StockSourceModal stays for
fullpage/expanded): ‹ Stock photos back, search, three 88w dropdowns on
a horizontally-scrolling row (closed controls name the FILTER per the
board — Orientation/Colour/Type), results reuse the 136×104 grid with
the required 24h provider credit ("Pexels · A. Nowak" shape from
item.source+author), infinite scroll handing to an explicit Load more
after 3 auto-loads (caption law), "Loading 8 more…" line. Both overlays
use the drill-in pattern from pass 3 (absolute inset, own header,
Esc stopPropagation).
ALL 5 Media drill-ins DONE. bulk-select 145:300 eye-verified live
(right-click entry → card checkboxes + ink bar "N selected · Move to… ·
Delete · Done") — and it exposed a REAL layout bug: PanelFrame is
flex-col with NO height, so SlimLauncher's flex-1 grid never grew and
the footer/bulk-bar sat under the last row instead of the panel foot.
PanelFrame is frozen (10+ consumers) — the fix is scoped:
.sl-launcher{height:100%}. Every earlier "footer" screenshot showed the
links floating mid-panel; nobody had eye-checked against the boards'
BOTTOM-pinned footer. folder-scoped 145:49: dropdown mechanism verified
in code (Popover + folder menu + All fallback); a live eye pass needs
folders, which only the fullpage manager can create — demo-data
limitation, noted. S3.6 RESOLVED 2026-08-07 (founder: "redraw karo Figma mein pehle"):
the old S3.6 boards were STATUS-PILL MARKERS only ("Image editor — crop
· rotate · adjust" / "Optimizing → WebP…" over the grid) — the full
editor/optimizer UIs had NO Figma design. Drawn now, to the CODE's
behaviour contract + DS conventions:
- 1124:4527 "S3.6 · media · image-editor (modal)" — 720×560 card on ink
  scrim (cargo-sheets §4: modal, not drill-in): title, Crop/Adjust/
  Resize text-link tabs, preview well + crop marks + mono dims, aspect
  chips Free/1:1/4:3/16:9, flip ⇋⇵, Zoom+Rotate sliders, "Edits create
  a new version" note, Cancel + Save version. Adjust/Resize contents
  noted on-board (4 sliders + 6 presets; W×H fields).
- 1124:4562 "S3.6 · media · optimise (drill-in)" — 320×812 drawer
  conventions: ‹ back row, 160h preview + mono dims, Format chips
  WebP/JPEG/PNG, Quality slider (85 mono), Original/Optimised size rows
  (−63% in success), full-width Optimise CTA, new-version note.
- 1124:4588 footer "⬡ Icons" third link ADDED to Media·grid 144:2 —
  founder kept the Icons entry; board and code agree now.
ImageEditorModal DONE 2026-08-07 to board 1124:4527: 2-column icon-tab
layout → single-column 720w card on 60% ink scrim — title (+ optional
imageName; wiring needs imageEditorContext in AquibraStudio, founder
tree, NOT touched), Crop/Adjust/Resize text-link tabs, full-width canvas
well with live mono crop dims, aspect CHIPS (all 6 — board draws 4,
sample shape), rotate/flip tool cluster, chrome-ui Slider everywhere
(TextField type=range gone), foot = note + Reset/Cancel ghosts + "Save
version" primary. Compare moved to a canvas-well overlay chip TOP-RIGHT —
first draft put it in the crop cluster and the §17 test caught that
Adjust lost it (a B&W compare is an Adjust job). ImageEditorModal.css
DELETED (−325 lines) + dead SliderControl.tsx/ImageEditorStyles.ts
removed. All behaviour kept: react-easy-crop, hold-to-compare, async
onSave w/ onError, stay-open-on-error, Escape/backdrop close.
OptimizationPanel DONE 2026-08-07 to board 1124:4562: 160h preview well
(optimised result once it exists, original until then — the old
side-by-side pair was 130px each at 320w and proved nothing), Format
chips, Quality label + mono readout + Slider, Original/Optimised size
rows with the saving ON the optimised number, full-width Optimise CTA,
new-version note. Drill-in no longer passes onClose — its ‹ back row is
the exit and the board draws no second one; the fullpage manager still
gets its Cancel. Back label now reads "· optimise".
REAL BUG found by the live walk: originalSize was computed from base64
arithmetic, which only works for data: URLs — every library asset is a
blob:/http: URL, so the panel showed "Original 0 Bytes" and a fake 0%
saving beside a real optimised number. Now falls back to fetch→blob.size.
Savings tone made honest too: success green only when it actually saved
(0% muted, bigger-file warning) — green-on-0% was the same class of lie.
Code-only controls kept + flagged for a Figma row: AVIF chip (real
probed capability) and the §18 max-dimension clamp.
Status pills DONE 2026-08-07 (marker boards 303:1997 / 303:2032): the
drawer names the running media job over the grid — "Image editor — crop
· rotate · adjust" while the editor is open, "Optimising → WebP…" while
the optimised copy is written. Both spans are owned by MediaTab (the
handlers it already runs); the pill is status, never a control
(pointer-events:none, role=status/aria-live). The editor pill has no
close signal — the modal's open state lives in AquibraStudio (founder
tree) — so it clears on save completion and on the first pointerdown
back in the drawer (inert while the modal is up).
TWO REAL BUGS found chasing the pill live:
1. AssetDetailOverlay's Escape called onClose() INSIDE a setState
   updater — a render-phase side effect that StrictMode's double invoke
   discards, so the drill-in ignored Escape entirely. Now reads the
   level from a ref.
2. The modal-above guard added for it was over-broad: presence-only
   matching counted CLOSED-but-mounted dialogs, so it swallowed every
   Escape. Now skips hidden/display:none/aria-hidden dialogs.
Both locked with regression tests (AssetDetailOverlay.escape.test.tsx,
SlimLauncher.statusPill.test.tsx).
OPEN (pre-existing, not from this pass): a capture-phase listener
somewhere eats a real Escape keystroke before it reaches window — the
overlay closes correctly on a window-dispatched Escape but not on a
physical one. Affordance is unaffected (the ‹ back row works). Needs its
own investigate pass across the shell's key handling.
MEDIA FAMILY CLOSED. NEXT: Content 148:2 (11 boards). Dirty-dot (140:21, 8px orange on Home)
NOT shipped — no per-page unsaved-state source in the model yet.

## NOT in scope

- Inspector flat body (board `52:56` / `824:5095`) — next arc after this one;
  already the named biggest shell mismatch.
- Drawer drill-ins beyond the 85 boards (Media drill-in boards ARE in the 17).
- Backend/behaviour changes; `AquibraStudio.tsx` (founder's dirty file).
