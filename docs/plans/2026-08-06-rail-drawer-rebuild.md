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
ESCAPE BUG FIXED 2026-08-10. The earlier note blamed "a capture-phase
listener eating Escape" — WRONG, and the measurement said so: patching
Event.prototype.stopPropagation logged ZERO calls on the Escape keydown.
The real shape, from a 3-run probe: with the drill-in OPEN the event
reached document but not window; with it closed it reached window fine.
The overlays listened on WINDOW BUBBLE — the last stop on the event path
and the easiest position to be preempted from, in an app carrying ~15
keydown listeners across document and window. All three drill-ins
(asset-detail, icon-browser, stock-browser) listen at document CAPTURE
now, so the topmost layer gets the keystroke FIRST instead of last.
Verified 3/3 deterministic live (was roughly half). The unit tests had
to move their dispatch from `window` to `document`: an event dispatched
ON window never passes a document capture listener, which is also why
the old window-dispatch probe "passed" while the real keystroke did
not — the probe was testing a path a real key never takes.
MEDIA FAMILY *NOT* CLOSED — reopened 2026-08-08. The same parallel arc
drew 36 new boards, NINE of them Media, all after my pass declared the
family done:
- 1159:4593 / 1162:4617 / 1163:4641 / 1163:13695 / 1163:13948 —
  `Media · fullpage · *` (library / empty / list-view bulk-select /
  unused-scope context-menu / drag-over uploading)
- 1164:4713 modal · picker (choose for element)
- 1164:4738 + 1174:4849 modal · replace-across-site + result-states
- 1175:4827 delete-confirm · bulk type-DELETE (>20)
My Media pass only ever verified the 320 drawer and its five drill-ins.
The fullpage manager and the modals had NO boards at the time, so they
were never eye-checked — now they have boards.
FOUNDER DECISION (2026-08-08): **B — one manager.** The board draws ONE;
the code had FOUR media surfaces (320 drawer ✅ conformed, 560
ExpandedMediaPanel, a MediaTab fullpage branch + LibraryView that
TabRouter can never render because it always passes onOpenLibrary, and
the real fullpage LibraryManager). Step 1 shipped: the 560 panel is
retired and every expand signal (header brackets, upload auto-expand)
opens the fullpage manager.
The scoping fear was wrong in a useful way: LibraryManager ALREADY
carries the board's IA (3 columns, smart folders, tags, trash, quota
status bar) — the parallel arc drew this board FROM that code, so it is
a conformance pass, not a rebuild.
FEATURE SAVED, NOT DELETED: drag-an-asset-onto-a-folder lived ONLY in
the 560 panel; the fullpage FolderTree/AssetGrid had zero drop handlers.
Ported into FolderTree first (5 regression tests), and the fullpage grid
now publishes the asset KEY in its drag payload — it only ever published
the canvas src/type/name, so a card dragged onto a folder there did
nothing even before this.
DEAD CODE FOUND: MediaTab's fullpage branch + LibraryView are
unreachable (TabRouter always passes onOpenLibrary) — flagged, not yet
deleted.
Grid toolbar + cards DONE 2026-08-09 (board 1161:35 / 1161:52): the
toolbar now reads count → formats → arrangement. Type pills left (the
drawer's control living twice); the manager files by FORMAT, and the
strip lists only formats the library actually holds — a chip with
nothing behind it could only ever empty the grid. A type filter carried
in from the drawer gets a clearable chip so a filtered grid always has
its cause on screen. 2/3/4 sizes the CARD, not the column count: the
board draws "3" active with five 144px cards in an 820 column, so it is
a size control. Select-all moved into the toolbar (it was only reachable
from a bulk bar you cannot see until something is already selected).
Cards: the provenance badge (UP/STOCK/AI) is gone — where a file came
from is the one thing the grid never has to answer — replaced by the
kind badge (▶/◆/Aa, images carry none), and dimensions+bytes gave way to
the board's dot + "used ×N" / "unused", which answers "can I delete
this?". TWO PRE-EXISTING BUGS: the grid/list toggle rendered as two
blank white pills (flowbite Button's own bg/border/min-height beat the
bare `button` selector, hiding the icons inside), and the fullpage
grid's drag payload never carried the asset key.
STILL OPEN (Media): 1162:4617 empty,
1163:4641 list-view bulk-select, 1163:13695 unused-scope context-menu,
1163:13948 drag-over uploading, 1164:4713 picker modal, 1164:4738 +
1174:4849 replace-across, 1175:4827 bulk type-DELETE.

PAGES RE-AUDIT 2026-08-08 (founder re-ran the Pages spec). Census by NAME
on page 1:3 found THREE boards the first Pages pass never saw — the
founder's 1171 batch. CORRECTION 2026-08-08: the commit for this pass
said they were "absent from boards.json, like the 1082 batch". That was
true when the Pages pass ran on 08-07 and FALSE by the time it was
written — a parallel figma-design arc (26e25572..f7b39a4c, all 08-08)
had already drawn them, wired them and REGENERATED boards.json hours
earlier. boards.json is current (416 boards, generatedAt 08-08); the
regeneration I was about to recommend is unnecessary. The real lesson is
the memory rule I skipped: check git log before assuming state
([[feedback_check_git_log_before_assuming_uncleaned]],
[[feedback_parallel_agent_convergence_20260511]]).
The three boards:
- 1171:4713 Pages · context-menu → labels were Title Case with ⌘ hints;
  board is sentence case with ellipses and no hints (Rename… /
  Duplicate / Set as homepage / Copy link / Page settings… / Delete
  page). Shortcuts still fire from the row.
- 1171:4767 Pages · command-palette (⌘K) → code shipped a 560w
  SCREEN-CENTRED modal on a scrim with file icons, status chips and a
  shortcut footer. Board is a 296w dropdown ANCHORED IN THE PANEL under
  the header, rows = name + home ⌂ only. Rebuilt; the scheduled-vs-Live
  guard the palette test carried now lives at its source
  (utils/__tests__/statusLabel.test.ts), which already had it.
- 1171:4820 Pages · settings · unsaved-warning → code had a generic
  "Unsaved changes" + THREE buttons. Board names the stakes ("Discard
  unsaved SEO changes?" + which fields) and draws TWO: Keep editing
  (accent, focused) / Discard changes (error outline). Save & Switch
  left with the third button — the drawer autosaves 500ms after every
  change, so the only state this modal can guard is a failed save or one
  still inside that window.
DIRTY DOT SHIPPED (140:21 / 1171:4729, caption: "checkbox · chevron ·
icon · name · home ⌂ · dirty ●"). It was deferred as "no per-page
unsaved-state source" — there WAS one, PageTabBar had it inline and
unshared. Extracted to editor/shared/useDirtyPages.ts; both surfaces read
it; dot is 8px --bk-warning (#C27803, read off the board, NOT the tab
bar's blue-500).
REAL BUG found on the way: PageSettingsDrawer routes a guarded CLOSE into
the same modal, but Discard only called confirmTabChange() — a no-op with
no pending tab, so discarding while closing left the drawer open. One
modal, two exits now, with regression tests. Dirty-dot (140:21, 8px orange on Home)
NOT shipped — no per-page unsaved-state source in the model yet.

## Status — 2026-08-12 (verified against git, not against this document)

This document had drifted in two places, both caught by reading `git log`
rather than trusting the prose — the rule this arc keeps re-learning
([[feedback_check_git_log_before_assuming_uncleaned]]):

1. **"STILL OPEN (Media)" — all eight are closed.** `53872acd` shipped
   1162:4617 empty, 1163:4641 list-view bulk-select, 1163:13695 unused-scope
   context-menu and 1163:13948 drag-over uploading; `fda2998e` shipped the
   three modals (1164:4713 picker, 1164:4738 + 1174:4849 replace-across,
   1175:4827 bulk type-DELETE). The list was written before the 08-10 pass and
   never struck through.
2. **The dirty dot is recorded twice, contradicting itself** — "DIRTY DOT
   SHIPPED (140:21 / 1171:4729 …)" and, four lines later, "Dirty-dot (140:21,
   8px orange on Home) NOT shipped — no per-page unsaved-state source in the
   model yet." The second is the older text left standing under the newer
   correction. It shipped (`18ab8a66`); the state source existed all along,
   inline and unshared in `PageTabBar`, and is now `editor/shared/useDirtyPages.ts`.

### Family status

| Family | Boards | State |
|---|---|---|
| Insert `137:2` | 9 + Components inline | **CLOSED** — coverage matrix in this doc |
| Layers `1082:*` | 12 | **CLOSED** 12/12 |
| Pages `140:2` | 13 + 1171 batch + S3.7 | **CLOSED** |
| Media `144:2` | 26 | **CLOSED** (twice — 08-08, then the 08-10 one-manager pass) |
| Content `148:2` | 15 | **13/15** — see below |
| Brand `152:2` | 28 | **not walked as a family.** Touched 08-11/12 from the job-architecture audit (`06142b1e` root drill-in, `8764ffb9` Lint destination, `8b3df719` the dark-value data-loss fix) — that was IA work off `docs/audits/2026-08-11-editor-job-architecture.md`, not this arc's per-board pass |

**Counting note.** Content first read as "2/15" because I counted *commits*
touching `tabs/content/`. That is the wrong measure: nine of its boards were
built with the panel and carry their board ids in the source
(`/* ── Root (148:2) + empty (149:7) ── */` and so on). Count board ids the code
claims, then verify them; never count commits.

### Content — CLOSED 2026-08-12, 15/15

Walked board by board. `2f12e5e7` records modal · `975c8500` sources, fields,
variables, conditions · `c72f42f9` unsaved save bar + loading skeleton ·
`5e0d9cf1` the watching state.

| Board | Outcome |
|---|---|
| 148:2 root · 149:7 empty · 149:50 collection · 149:84 record · 453:4010 load-error | already conformant — verified against the frames, no change |
| 1170:4713 collection-setup | conformed earlier (`7fcb6fb9`) |
| 1170:4749 records modal | flat one-column list → table built from the collection's leading fields + Updated |
| 151:46 sources | status line with a dot; `⋯` → Remove source; "+ Connect a source" |
| 151:2 fields | type as prose ("Rich text", not `richtext`); ✕ → `⋯` |
| 151:62 variables · 151:87 conditions | text-button pairs → `⋯` row menus |
| 149:108 unsaved | warn-tinted save bar; Save as accent text, not a filled button |
| 775:4241 loading | flat bars → the root's own structure with skeletons in it |
| 303:2067 · 303:2083 | the two markers, resolved — see below |

**Real bugs the walk turned up**, all pre-existing and none visible to types:

- `DataManager.unregisterSource` had existed since the manager shipped and **no
  UI ever called it** — a source could be added and never removed. The `⋯` the
  board draws on each source row is what exposes it.
- `ContentTab` subscribed to `CollectionManager`'s events and to **nothing on
  `DataManager`**, a different emitter. The Sources view refreshed only because
  `importJson` and `removeSource` called `reload()` by hand, so a source changed
  from anywhere else left the panel stale and silent.
- The test mock's `composer.data` carried no `on`/`off`, making it a weaker
  DataManager than the real one — it could not have caught either.

**On the two marker boards.** I first read them as annotations of a capability
that does not exist and deferred both. That was right about the SAMPLE and wrong
about the STATE: "Connected · synced 4m ago" is a Google Sheets integration this
codebase has nothing to do with, but "no source connected" is simply the empty
state (now in the board's own words), and "watching for changes" became true the
moment the panel subscribed to DataManager. The lesson is narrower than "markers
need a redraw": read what state the pill NAMES, separately from the frame it was
pasted on.

Still not built, and deliberately: `Import JSON` on 1170:4749 (no bulk-import
path on the engine — a test asserts the button does not render), and the sync
clock on 151:46 (`DataSource` carries no timestamp; `DataManager.watch()`
watches a local data path, not a remote file).

### Superseded — the earlier "what is left" note

- `1170:4749` records (modal) — **DONE 2026-08-12** (`2f12e5e7`). Table built
  from the collection's leading fields + Updated; count moved into the title;
  image fields read as present/missing. `Import JSON` deliberately NOT built —
  no bulk import path exists on the engine, and a test asserts no import button
  renders.
- `303:2067` data · no-source and `303:2083` data · watching — **STATUS-PILL
  MARKERS, not designs.** Each is the same Sources frame with a pill pasted over
  the breadcrumb, and both frames show a *connected* source, so the "No data
  source connected" pill contradicts the frame it sits on. This is the S3.6 gap
  again, where the founder's call was: draw it in Figma first, then code to it.
  **Founder call — a design pass, not a code pass.**

### Brand — CLOSED 2026-08-13, and the arc with it

Last family. `06142b1e` root drill-in · `8764ffb9` Lint · `fb6e6d1c` Tokens ·
`bfbfae47` Components · `dd1e62ef` Figma export · `b80cde29` Starters ·
`c7a2a0fc` Colour mode · `42c7b24e` Basic-mode note.

**The finding that ran through the whole family: the code was built to a
PROTOTYPE and the boards had moved past it.** Two files said so themselves —
`TokenKindCard`'s comment named "prototype `COLOR · 12 TOKENS [-]` shape" and
`ExportSection`'s named "Arc D3 (prototype s05)". Brand's root was a tab bar,
Tokens an accordion of cards, Components a card grid, Presets already rows,
Starters a modal, Colour mode a toggle, Lint a banner: seven capabilities in
five different shapes. The boards draw one drill-in stack. It is one now.

| Board | Outcome |
|---|---|
| root · tokens · components | tab bar → rows · accordion → rows · card grid → rows |
| presets (+bound/draft/unbound) | already rows — verified, unchanged |
| starters (+applied) | modal → destination; `useApplyStarter` shared so both paths write identically |
| colour-mode | toggle → destination; unblocked by the dark-value write fix earlier the same day |
| lint (+suppressed/warnings) | banner → destination |
| import-export (+error/exported/imported) | Figma stub disabled + rebuilt to the board's row-per-format with Copy/Download each (`23d44fdf`) |
| pro-locked | it is the root in BASIC mode; the note is the only thing marking it |
| tokens·add · tokens·replace · dirty · empty · loading · load-error · review-changes | verified against existing surfaces, no change |

**The correctness bug**: the Figma export emitted a hand-rolled envelope under
the name `figma-variables.json`. That is not the schema Figma's importer reads —
no collections, no modes — so the file downloaded looking right and failed on
import. Its own comment said "Stub … Real emitter pending" and the row shipped
selectable anyway. Board 153:120 greys it with the workaround in its own copy,
and the board was right.

**Two rows deliberately NOT built** (rule 4 — preserve the design, document the
gap):

- `Classes` — a site-wide class manager with per-class usage counts. No such
  registry exists (`classRegistry` / `classUsage`: zero hits). The usage count is
  what proves it is not the inspector's per-element CSS-classes surface.
- `Typography` — its board is a FONT manager: active fonts, role pills
  (Display/Body/Mono), weights, a `.woff2` drop zone, a licence attestation. The
  code's typography is type TOKENS; font handling is split across Media upload,
  the engine `FontManager` and the inspector `FontPicker`, with no Brand home.

**Import/export is done** (`23d44fdf`). Every live format row carries its own
Copy and Download; the greyed Figma row carries neither, which is the board
refusing to offer a file it cannot make. The single download button under the
preview is gone — two ways to download the same thing is one more than the board
draws. The PREVIEW PANE stays: the board omits it, and reading the output before
taking it is real capability, so rule 1 wins over rule 2 where they disagree
about something that works.

**One thing still open, and it is a founder call rather than a conversion.**
`token-detail` (152:83) draws three footer actions — `Used in 34 places ›`,
`Rename safely ›`, `Fix contrast ›` — at the KIND level, where the code has the
equivalents per TOKEN (`usageByTokenId`, `handleTokenRename`, ColorTokenList's
contrast fixes). All three carry a chevron, implying destinations the file does
not draw anywhere.

Of the three, only `Fix contrast` maps cleanly onto something that exists —
flipping ColorTokenList to its `issues` filter — and it is in-place, not a
drill-in. `Rename safely` has no target at kind level at all. Shipping one of
three, or shipping three rows that go nowhere, are both worse than saying so:
this is the S3.6 situation, where the answer was to draw the destination in
Figma first and then code to it.

### Arc status

All six families closed: Insert · Layers · Pages · Media · Content · Brand.
113 of the file's 416 boards. The remaining 303 sit in 35 families that have
never had a family walk — off-rail panels (History, Settings, Publish, Review,
Templates, AI, Components), cross-cutting surfaces (Inspector, Shell, Canvas,
CmdK) and the journey flows (S1, S3, S5, S6). That is a new arc, and its order
should come from the business rather than from board counts.

## Inspector — walked 2026-08-13, the next arc's first family

Walked board-by-code rather than by surface presence, because "a component with
that name exists" is the reasoning that made Content read 13/15 when seven of
its boards still needed work.

| Board | Outcome |
|---|---|
| `52:56` flat scroll body | conformant since S3.9 — the plan's "biggest shell mismatch" line was stale, see NOT in scope |
| 7 × `profile · *` | 7/7 exact, CONTAINER fallback included |
| `159:99` no-selection | **rebuilt** (`60d0d60c`) — six blocks of chrome down to the board's two lines |
| `1175:4841` empty · template-applied | conformant, down to the 30-minute window |
| `159:123` multi-select | header **done** (`2a409c57`); shared-property editing is a feature gap, below |
| `159:102` loading | the code has no loading moment to show it in — deliberate, see below |
| reach-all-like-this · reach-whole-site · instance-selected · bound-to-CMS · breakpoint-override · pseudo-state · ai-agent-run · token-picker | mapped to live code |

**The family's real gap is multi-select property editing.** Board 159:123 draws
align and distribute AND the shared properties across the selection —
Background, Text colour, Radius, Padding, Font size — with `Mixed` wherever the
values differ, under "Editing a Mixed field applies it to all three". The code
ships align and distribute only.

That is a capability, not a layout. It needs shared-vs-mixed computed across the
selection and a write that fans out to every selected element, and the engine
has no batch style write at all (`updateMany` / `batchUpdate`: zero hits). A
loop over `styles.update` would also have to land as ONE undo step, which is its
own decision. Named here rather than built inside a walk.

**`Inspector · loading` is drawn for a state the code cannot enter.**
`ProInspector` returns the no-selection branch at :266 and otherwise renders
synchronously off the selected element — no awaited data gates the body.
Building the skeleton would mean inventing a delay to justify it.

**Worth noting from the no-selection rewrite**: 510 inspector tests passed
without noticing that a title, two CTAs and a keyboard tip had been deleted. The
surface every user sees whenever they deselect had no coverage at all.

## Canvas family — WALKED 2026-08-13 (7/7 boards)

Not part of the rail-drawer 6, but walked in the same pass because the drawer
work kept landing next to it. Every board had a code home; none of the finds
were missing surfaces. All seven were the same shape — **two halves that both
exist, both look implemented, and disagree with each other** — which no test,
type or gate can see.

| Board | Find | Commit |
|---|---|---|
| inline-edit toolbar (18 controls) | 11 of 18 controls fell into a `default:` that only called `devLog`. Lists, all four alignments, indent/outdent, size and both colours rendered, took the click, did nothing. | `de783749` |
| ctx-menu submenus | "Reveal in Layers" emitted `"layers:reveal"`; the shell listens for `SHOW_IN_LAYERS`. Four names existed for one job. The working chain had no production emitter — its own test kept it alive. | `69666c8f` |
| (same pass) | StudioPanels listened for `VERSION_PREVIEW_STARTED/_CLEARED`; the engine emits `VERSION_PREVIEW/_CLEAR`. Banner could never render. Deleted — board `163:113` puts this bar in the Versions panel, where `TimeTravelScrubber` already implements it. | `69666c8f` |
| hover levels | ⊕ clone badge on Ctrl, clone drag on Alt. Ctrl promised a duplicate and moved; Alt showed the hierarchy overlay and silently duplicated. Tests drove it with `altKey`, so the inverted contract stayed green. | `9e508da7` |
| breadcrumb bar | Bar advertised "Alt+↑ Parent"; Alt+↑ *reorders among siblings*. Parent/child are ← and →. Context menu's "Select Parent" told the same lie. Rebuilt to the board (4 Emotion styled + 95-line `getTypeIcon` gone). | `5a3674e3` |
| command palette | Still rendering the dark-only palette dropped on 2026-04-18. Nine categories against the board's four, grouped by first appearance in a recency-sorted list — running one Insert command floated INSERT to the top. | `7765ace0` |
| zoom levels | Board documents 10%–400% with a 400% state card; presets stopped at 300, so the top of the range was unreachable by any route. Two dead zoom components sat beside the live one reading the same array. | `aaf0b1e9` |
| toolbar states | "Toggles persist per-user per-project" — they were plain useState and reset every reload. `useOverlayState.ts` was a second complete copy of the state, imported by nothing. | `f429fcbb` |

**Deliberate board deviations, all one rule** — a shortcut label names the key
that is bound. Boards draw Alt+↑ as Parent (twice) and ⌘1 as Zoom to fit; the
code binds ← and ⌘0. Same call as the 8-row pre-checks board. The alternative
was moving documented shortcuts so labels could stay as drawn.

**Named, not built:** Zoom to selection (⌘2 on `817:4723`) needs viewport
scrolling this canvas has no path for. Comments as the footer's 7th toggle —
comment mode lives in the top bar; moving it is IA, not a fix. The seven
toggle shortcuts on `817:4649` are bound to nothing; printing them would add
seven more labels naming dead keys.

**The scan worth keeping:** diff every event the package emits against every
event it listens for, and diff a toolbar's dispatched command literals against
its handler's case labels. Both found defects nothing else could see.

## Cross-cutting scans — 2026-08-13 (11 defects, no boards involved)

The Canvas walk's finds all had one shape: two halves that both exist and
disagree on a NAME. That is mechanically detectable, so after Canvas closed the
walk switched from boards to scans. Three of them, run over the whole package.

### Scan 1 — every `.emit(x)` name vs every `.on(x)` name

Ten defects. The pattern is a near-miss: the right name and the wrong one
living side by side.

| What broke | The miss | Commit |
|---|---|---|
| `saveProject` announced completion at the START — the Pages/tab-bar unsaved dots cleared before `storage.save()` ran, and stayed cleared when it threw | emitted `PROJECT_SAVED {saving:true}`; `PROJECT_SAVING` existed with no emitter | `3525b1db` |
| Smart guides and spacing indicators measured against wherever an element sat when first measured — the bounds cache was never invalidated | 8 registrations on `element:style-changed` / `element:children-changed` / `canvas:scrolled` / `viewport:resized`; the engine sends `element:style-updated`, `canvas:scroll`, `viewport:changed` | `34dc0ec9` |
| Zoom to Fit, Zoom In, Zoom Out changed engine state and nothing else — the canvas scales off React state | listened `device:changed` / `zoom:changed`; engine emits `BREAKPOINT_CHANGED` / `VIEWPORT_ZOOM` | `4d2d6e9c` |
| Switching pages left the Layers panel on the previous page's tree, with expansion keyed to the old page | listened for bare `page:changed`; engine sends `PROJECT_CHANGED {type:"page:activated"}` | `cb38908d` |
| Pages › "From template" opened the gallery whose apply path REPLACES the current page — asking for a new page overwrote the open one | `newPageMode` had neither a prop caller nor an event emitter | `c8e22a83` |
| Resolving a comment greyed the row and left its pin open on canvas | `comments:refresh` was in CommentLayer's own docblock, with no emitter | `fc1a7102` |
| Layers never reflected marquee / Select All | `SELECTION_MULTIPLE` and `ELEMENT_SELECTED` unsubscribed; dead `SELECTION_CHANGED` subscribed | `a78ba109` |
| The page_added milestone suggestion never fired | listened `PAGE_CREATED`; engine sends `PROJECT_CHANGED {type:"page:created"}` | `a78ba109` |
| "Reveal in Layers" revealed nothing; a version-preview banner that could never render | `layers:reveal` vs `SHOW_IN_LAYERS`; `VERSION_PREVIEW_STARTED` vs `VERSION_PREVIEW` | `69666c8f` |
| `UI_OPEN_BUILD_PANEL` — a second, emitter-less way to ask for a panel `UI_PANEL_OPEN` already opens | deleted | `0a23f41a` |

### Scan 2 — `default:` branches that only log or no-op

18 candidates, most legitimate (icon maps, routers). One real: `"active"`
("While Pressed") sat in the Add-Interaction picker with no case in
`setupTrigger`, so it fell to a `devLog` that is silent in production
(`56eee5d1`).

### Scan 3 — the same exported type name declared in two files

68 names. Most are benign (a barrel re-declaring its own submodule) or genuine
homonyms (`Template` is a saved project in shared/, a static HTML block in
templates/). Two mattered:

- `InteractionTrigger` — editor 15 values, engine 13. The picker could offer a
  trigger the runtime's exhaustive switch had never heard of and the compiler
  had nothing to compare. This is WHY scan 2's defect existed.
- `LintIssue` — DSLinter `{rule, severity:"warning", tokenId}` vs LintState
  `{type: 4-value union, severity:"warn"}`, sharing not one value. They never
  had to agree because the hand-off was never built: nothing ever called
  `setIssues`, so the Issues panel and TokenDetailView were permanently empty
  while the DS banner showed findings (`96fc8e4d`).

### The one that generalises the rest

`getPresetTimeline` implemented 2 of the inspector's 39 animation presets;
the other 37 returned a 0.2s opacity nudge (`01deb024`). Worse than the dead
toolbar controls, because every preset does *something* — it reads as a weak
animation, not an unimplemented one, so the fix looks like a duration tweak.

The guard that now holds it is the pattern worth copying: a test that walks the
UI's own option catalogue and asserts each entry reaches an implementation. It
immediately found eight presets missing from the table I had just hand-written.

### Scan 4 — UI option catalogues vs their implementations

Generalised from two earlier finds (18 toolbar controls / 7 handled;
5 triggers / 4 handled). Scanned every `const X = [...]` with four or more
`{value}` entries. Most are plain CSS pickers where the browser is the
implementation. Two were not:

- 39 animation presets offered, 2 implemented (`01deb024`, above).
- **`LINK_TYPE_OPTIONS` — the one that reaches customers.** The Link inspector
  writes an internal page link as `href="#page:<pageId>"`. Grep the package:
  one producer, no consumer. ExportEngine copied href through verbatim, so
  every published site shipped `href="#page:cm2x9k…"` — a fragment for an id
  that does not exist. **Every internal link a customer built did nothing on
  their live site** (`41138e12`).

  Nothing is visible from inside the editor: the inspector round-trips its own
  scheme correctly, so the feature looks complete from every surface a
  developer would check. It is only wrong in the artefact that ships.

  The fix had to go in TWICE — ExportEngine has two attribute writers, and the
  multi-page one (`renderPageElement`) is the path publish uses. Fixing the
  live-Element writer alone would have left every site as broken while the
  tests passed.

**Still open, deliberately:** `handleSaveTemplate` captures `exportHTML()`, so
saving a page as a template stores `#page:<id>` pointing at a page id that will
not exist wherever the template is applied. Resolving it means deciding what an
internal link *should* become in a portable template — strip it, keep it as a
slug, prompt on apply. That is a product decision, not a wiring fix, so it is
named rather than guessed at.

### The animation chain — one feature, four implementations, three of them wrong

Pulling on scan 4's second thread (39 presets offered, 2 implemented) ran the
whole length of the feature. Each fix revealed that the next layer down had the
same gap, and each was invisible from the layer above.

| Layer | What it is | Was | Commit |
|---|---|---|---|
| `PRESET_TIMELINES` | GSAP timelines, editor canvas | 2 of 39; the rest returned a 0.2s opacity nudge | `01deb024` |
| the seam | inspector writes `AnimationConfig` (`type`, `iterations`), runtime reads `preset`, `loop` | `animation.preset` undefined for every interaction ever created — so the timelines above were unreachable, and Duration/Delay/Easing reached nothing | `32e8ddc1` |
| `ANIMATION_KEYFRAMES` | CSS `@keyframes`, canvas + export | 25 of 39; and the canvas injected NONE of them (animation-utils.css was deleted 2026-07-28), so element animations worked only after publish and the Preview button previewed nothing | `32e8ddc1`, `598c9436` |
| `INTERACTION_PRESET_KEYFRAMES` | WAAPI runtime inside every published page — **the only one a live site runs** | 17 of 39; 22 presets animated in the editor and did nothing on the customer's site | `00a5067a` |

`AnimationPreset` was 23 values short of its own picker, so writing a preset
needed a cast — which is why none of this ever failed to compile. Widening it
is what surfaced the published-runtime table.

**What actually holds it now:** `presetCoverage.test.ts` walks the inspector's
own `ANIMATION_PRESET_GROUPS` and asserts each entry reaches a timeline, a
keyframe, and a published-page keyframe. It found 8 presets missing from a
table I had hand-written minutes earlier, then 20 missing keyframes, then 22
missing from the export runtime. A list you type into a test is a list that
agrees with you.

### Export — two writers, and what only one of them shipped

| Find | Commit |
|---|---|
| `#page:<id>` internal links shipped raw: **every internal link on every published site was dead** | `41138e12` |
| The HTML/ZIP download kept five attributes (alt, href, src, target, id) and dropped rel, title, poster, placeholder, name, required, and every data-/aria- | `5103524f` |
| The same download dropped the user's own CSS classes, so class-based custom CSS matched nothing | `5103524f` |
| Both writers emitted attributes unfiltered — `onerror` in imported project JSON reached a published page. Pre-existing on the publish path | `0d8dd01c` |
| `sanitizeElementTreeContent` never looked at `attributes`, on a stated assumption that "the serializer" handled it — true of one of three writers | `d8948d25` |

The security review that caught the attribute change was right, and the hole it
pointed at was older and wider than the change. Worth keeping: the fix is one
shared `isSafeAttrValue` across all three writers plus the ingest boundary, not
a fourth allowlist.

### What kept all of this green

In five of the eleven, a TEST asserted the broken half:

- `useCanvasElementDrag` drove clone with `altKey`, pinning an inverted contract
- `standaloneActions` asserted the emit of `"layers:reveal"`
- `SnapCalculator` + `SpacingCalculator` suites consisted ENTIRELY of assertions
  on the four dead event names — deleting them emptied both files, so neither
  class had ever had a test of what it computes
- `InteractionRuntime` passed `"shake"` as its example of an *unknown* preset

A green suite is not evidence a feature works. It is evidence the suite agrees
with the code, which is also what you get when both are wrong.

### Scan 5 — drifted string-literal unions (ran clean; do not re-run)

The duplicate-TYPE scan only sees named exports. Widening SaveState exposed two
copies it could never have found — one spelled inline in `useComposerInit`'s
props, one in `StudioHeader`'s — so the follow-up was to look for the shape
directly: every union of 3+ string literals, named or inline, compared
pairwise.

39 sets are declared identically in 2+ files, and 39 more pairs overlap without
matching. Triaged, **none is a live defect**:

- Most near-misses are legitimate subsets — a component accepting four Toast
  tones where Toast offers six, a switcher offering three breakpoints where the
  state type has five.
- The one domain concept that genuinely drifts is media types: `lottie` exists
  in `ElementManager.insertMedia` and has a block, but not in shared's
  `MediaAssetType`; `font` is in some lists and not others. That is a real
  boundary — the library ingests images/video/fonts, the canvas can hold a
  Lottie element from a URL — not a mismatch to merge.

Recorded so the next person does not spend the afternoon on it. The scan worth
keeping from this pass is the negative result: identical-today unions are risk,
not defect, and chasing all 39 into one home would be the speculative
refactoring CLAUDE.md warns about.

What DID find real defects, every time, is narrower: a UI catalogue compared
against the implementations that must serve it.

### Live eye-verification — round 1, 2026-08-13 (server finally up)

Four Canvas surfaces checked board-vs-live at 1440×900, per the founder's
acceptance rule. **Three defects found that NO offline instrument could see** —
on surfaces where tsc, vitest, gates and even DOM queries all said healthy:

| Surface | Live finding | Fix |
|---|---|---|
| Zoom flyout (817:4723) | Opened **fully invisible** — the footer toolbar's `tw:overflow-x-auto` forces overflow-y to auto, clipping the upward flyout to the toolbar's 40px box. DOM said open, opacity 1; elementFromPoint returned the canvas. Predates this arc. | Portal + fixed coords from anchor rect — PageTabBar's own precedent, Gate 22's sanctioned route. Click-through verified: pick 400% → footer reads 400% (`7ebbabeb`) |
| Breadcrumb (1175:4849) | **My rebuild's own regression**: Emotion version sat at Z_LAYERS.floatingToolbar (3001); the rebuild wrote `tw:z-30`, painting the whole bar UNDER the canvas. checkVisibility() true. Plus bottom-0 put its lower 16px under the floating toolbar. | z from the registry (inline style, per the registry's contract) + bottom-14 (`27e74fec`) |
| Command palette (1177:4804) | Structure/light theme/groups/footer count all match. One visual delta: rows carried emoji icons the board does not draw. | Icon column removed (`27e74fec`) |
| Footer toggles (817:4649) | Persistence verified end-to-end live: toggle Grid → localStorage overlays key → reload → button renders active (Grid✓). | none needed — `f429fcbb` holds |

**The lesson, in one line: the DOM lies about visibility.** Open + opacity:1 +
checkVisibility:true + correct rect can still be invisible (clipped by an
ancestor's computed overflow, or painted under a sibling stacking context).
Only a pixel screenshot catches this class, which is exactly why the founder's
acceptance rule is a screenshot.

Verification tooling note for the next walk: popovers here close between browse
commands — full-page screenshots scroll (closing scroll-away popovers), so use
`chain` + `--viewport`, JS clicks (no scroll-into-view), and re-query popover
presence in the same chain step before trusting a shot.

### Phase 0 — Brand family eye-verified 2026-08-13/14 (all 9 destinations)

Root, Tokens, Tokens·color, Lint, Starters, Components, Colour mode,
Import/export, Presets, TokenDetailView — board-vs-live at 1440×900. Four
defects found, four fixed, each invisible to every offline instrument:

| Surface | Find | Commit |
|---|---|---|
| Lint destination | said "Nothing to fix" while the colour list's chip said "Issues (1)" — a third, local lint implementation. Contrast is now a lint rule in the shared hook; verified live: banner 4 · destination 4 · chip subset | `5f120333` |
| Starter cards | locked to 40px by flowbite's Button theme — gradient squashed to 17px, description clipped mid-line. The CLAUDE.md pill trap, on a card | `5c6d16c2` |
| Export rows | one-line row impossible at 245px — label wrapped word-per-line; flex-1 collapsed it to 0. Rebuilt to board 153:120's two-line rows, board copy, chips dropped | `c7aecd38` |
| TokenDetailView | dark-value commit (8b3df719) verified live end-to-end: type → blur → stored → missing-dark count recomputed 17→16 (the projectHasAnyDark conditional waking, correctly) | verified |

Kept against the board, recorded: export keeps its selection radio + preview
pane (working feature the board does not draw — dropping it is a product
call). Stripe Blue's violet gradient is customer-palette data, outside
Gate 18. The "Surface fails contrast" row is the findSurfaceToken heuristic
missing id "color-surface" — signal-or-noise is a founder call.

Also landed this batch: seam-scan.mjs (T2) wired into verify:ds, whose first
run found three more dead listeners — one real (useElementDragDomSync's
updateRootId never re-ran after mount; drag root stale on every page switch).

### Phase 0 — Media family eye-verified 2026-08-14 (7 surfaces, 0 new defects)

Drawer empty-state, drawer grid (2 uploaded assets, webp transcode), bulk bar
("1 selected · Move to… · Delete · Done"), stock-photos idle, fullpage Asset
Library (board 1159:4593 — folders rail, toolbar, grid, detail panel, footer),
MediaContextMenu (the 08-12 no-stylesheet fix, fully styled: 7 items + red
Delete), ImageEditorModal (board 1124:4527 — tabs, crop grid, ratio pills,
sliders, version footer).

Zero new defects — every prior Media-arc fix holding live. Two states remain
unverifiable without failure injection (upload-failed 145:148, load-error
453:3931) and one needs a saved version (versions drill-in 146:32); listed,
not skipped silently.

Verification notes: the "ghost drawer behind fullpage" I chased was a
screenshot-timing artifact — chain screenshots can land before React commits;
steady-state showed ls-panel--closed at width 0. And browse's viewport resets
to 1280×720 on daemon restart — re-set 1440×900 at each session start (now in
the protocol above).

## Named for the founder — needs a decision or a file I must not stage

**`ConflictModal` does not match board 66:640, and fixing it needs
`AquibraStudio.tsx`.** The board draws "Someone else saved first" / "Sara saved
a change to this page 40 seconds ago. Keeping yours will overwrite hers." with
two buttons: **Review both** and **Keep mine**. The shipped modal says "This
site changed somewhere else" and offers four: Reload latest, Save a backup,
Overwrite… → Yes, overwrite.

The detection works — `useSaveCallback` returns a `"conflict"` outcome
(`:98`) — so this is a real state a user reaches, drawn one way and built
another. "Keep mine" maps to the existing `onOverwrite`; **"Review both" maps
to nothing that exists** and would need a compare surface (board 807:6965
`S1.2d · Conflict · Review both`) plus a new prop, which means editing
`AquibraStudio.tsx` — the founder's file, which CLAUDE.md says never to stage
from an agent session. Left alone deliberately rather than half-conformed: new
copy over the old four-button action set would be worse than either.

Fixed in-file, because it is a violation either way: the modal's inline
`fontFamily: "Inter, system-ui, sans-serif"` — DESIGN.md §Typography bans
naming system fallbacks in any stack — is now `var(--bk-font-ui)`.

Also on the same surface: `SaveStatus`'s `SaveState` union carries a
`"conflict"` value that `StudioHeader:452`'s derivation cannot produce (it maps
offline / saving / error / dirty / saved and nothing else). So the topbar chip
has a conflict state that never appears, while the modal for the same condition
appears with the wrong copy.

**Open product call (unchanged):** `#page:<id>` in a saved template. Templates
capture `exportHTML()`, so a page saved as a template carries an internal link
to a page id that will not exist wherever it is applied. Strip it, resolve to a
slug, or ask on apply — a decision, not a wiring fix.

**Open founder call:** the styling ratchet. It was already failing at this
session's starting commit (css_lines 9252 vs a 9043 baseline, five files over,
incl. a MediaContextMenu.css added 2026-08-12 that never got a bump), so the
pre-push hook has been refusing pushes since before this work. This session
adds 145 on top. Not re-baselined here — a ratchet quietly raised stops being
one.

## NOT in scope

- ~~Inspector flat body (board `52:56` / `824:5095`) — next arc after this one;
  already the named biggest shell mismatch.~~ **STALE, corrected 2026-08-13.**
  It is not a mismatch any more and has not been since S3.9. `ProInspector:353`
  carries the note itself — "no tab strip — the body below is one flat scrolling
  column ordered per element profile" — and the scope row is the board's three
  dropdowns (`ScopeDropdown` · `BreakpointPill` · `StateDropdown`), with
  `InspectorTabContent` called at a fixed `tabId="style"`. That is exactly what
  the board's own name describes: "tabs exist in data, not UI". The `✦ AI` chip
  the board draws in the header is there too (`inspector-ai-chip`).

  Whoever plans the next arc should not budget for this. Verified board-by-code
  on 2026-08-13: of the Inspector family's 21 boards, 20 map to a code surface —
  the 7 element profiles match 7/7 including the CONTAINER fallback, plus
  no-selection, multi-select, instance-selected, bound-to-CMS,
  breakpoint-override, pseudo-state, reach-whole-site, ai-agent-run and the
  token-picker popover.

  The ONE that does not: `Inspector · loading` (159:102) draws the element name
  over six skeleton rows in the real two-column rhythm. The inspector has no
  loading moment to show it in — `ProInspector` returns the no-selection state
  at :266 and otherwise renders synchronously off the selected element, with no
  awaited data gating the body. Building the skeleton would mean inventing a
  delay to justify it. Left undone deliberately.
- Drawer drill-ins beyond the 85 boards (Media drill-in boards ARE in the 17).
- Backend/behaviour changes; `AquibraStudio.tsx` (founder's dirty file).
