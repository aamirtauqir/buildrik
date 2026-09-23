# Inspector state boards — build report

Section **`1776:8381` "08 · Inspector"**, page `1:3`. Plan:
`docs/design-jobs/V2-TO-V1/plans/inspector-state-boards.json` (10 rows, none drawn
before this pass). Applied plan for the interiors:
`docs/design-jobs/V2-TO-V1/plans/inspector-state-interiors.json`.

**16 Figma MCP calls spent** of the 25 allowed: 1 recon · 9 clones · 3 interior
passes · 1 overflow fix · 1 verify · 1 section rename. Section grew 41 → 51
children; `boards:` on page `1:3` grew 992 → 1002, i.e. +10 and nothing lost.

Every panel board is **300** wide (`--bk-size-inspector`) because each is a clone
of a board that already was, and the clones were pinned into free 300-pitch slots
rather than allowed to open a new row. The one exception is by design: board 10 is
a 720-wide record, not a panel.

## Order this was done in, and why

The RUNBOOK's own correction — *"clone every new board FIRST"* — was followed:
all ten boards existed before a single interior node was written, so nothing
referenced a board that did not yet exist. The three free pre-flight checks were
run before any call: `node --check` on both new scripts, `preflight-sandbox.mjs`
on the recon script, and a `--emit` + `node --check` of the real payload for the
interior script (12 854 chars for the largest batch, against a ~20 000 cap).

## The boards

| # | Finding | New node id | What was drawn | Read-back that proves it | Marker |
|---|---|---|---|---|---|
| 1 | UX-D-08 | **`2864:12415`** | `Inspector · profile · SLIDER · component editor` @1780,1346, clone of `32:2`. SLIDER inserted as the FIRST section (flow index 2), above the inherited CSS stack: 3 slide rows with a drag handle, thumbnail glyph, label and ✕; `+ Add slide`; Autoplay / Loop / Navigation rows; footer note. 15 trailing rows of the inherited stack hidden (never deleted) to make the vertical room. | `OK 2866:12436 section/SLIDER @0,80 "SLIDER   [not-implemented]"` · rows `2866:12439/12443/12447/12451/12455/12459/12463` at y=100…304 · note `2866:12467` 268×182 · `READBACK children=35 visible=20 contentExtent=810 of 812 fits` (after the y 640→628 move) | inline **`[not-implemented]`** on the SLIDER section header — the CSS stack below it ships, the component editor does not |
| 2 | UX-D-09 | **`2864:21821`** | `Inspector · profile · FORM · destination` @3020,2824, clone of `2474:11972`. WHERE IT GOES seated FIRST by shifting all 57 existing children down 320px: Send to → Email address ▾, Address, Success message, Success redirect; then ADVANCED HTML collapsed carrying the five raw attributes; then the `#C27803` exporter warning. Board resized 900 → 1200 so the inherited stack still fits. | `shifted 57 child(ren) at y>=44 by 320` · `OK 2866:12469 section/WHERE IT GOES @16,55` · `OK 2866:12470 mark/where-not-implemented @176,55 "[not-implemented]"` · `OK 2866:12484 note/exporter warning @16,264 268x78` · resize read back `300|960 => 300|1200` · `visible=75` (nothing hidden) | inline **`[not-implemented]`** in warning ink beside WHERE IT GOES |
| 3 | UX-D-02 | **`2865:12419`** | `[not-implemented] Inspector · locked element` @2200,1346, clone of `807:8567`. Lock banner row `🔒 Locked / Unlock` inserted directly under the header, then `ALL CONTROLS BELOW ARE DISABLED`; two footer notes — the disabled-state description, and the mechanism with the two back doors. | `OK 2866:12485 row/Locked banner @0,48 "🔒  Locked"` · `OK 2866:12489 section/Disabled @0,82` · notes `2866:12492` / `2866:12493` · `READBACK … contentExtent=762 of 812 fits` | **board-name prefix `[not-implemented]`**, applied at creation |
| 4 | UX-D-20 | **`2865:12493`** | `Inspector · breakpoint-override · collapsed summary` @2600,1346, clone of `160:208`. The full-width tinted per-override banner (`Override note`, child index 3) hidden; one summary row `⚠ 6 tablet overrides ⌄ / Revert all` in its place; footer note carrying PHASE4-QA's restatement of acceptance #12. | `hideIdx [3]` + `hidden 6 from index 14` · `OK 2866:12494 row/Override summary @0,80 "⚠ 6 tablet overrides   ⌄"` · `OK 2866:12498 note/override rationale @16,640 268x130` · `contentExtent=770 of 812 fits` | none specified |
| 5 | UX-D-12, UX-D-13 | **`2865:21984`** | `Inspector · disabled control · reason and fix` @3020,1346, clone of `807:8412`. `DISABLED, WITH THE REASON SHOWN` + five rows that are PRESENT and disabled with their reason as the value: Margin ↕, Padding ↕, Gap, Grow/Shrink/Basis, and the one-click `Enable flex` (the EnableFlexPrompt pattern). One footer note carrying the `title=`-on-a-disabled-input mechanism. | `OK 2866:12499 … "DISABLED, WITH THE REASON SHOWN"` · rows `2866:12502/12506/12510/12514/12518` at y=108…244 · `OK 2866:12522 note/disabled reason 268x221` · `contentExtent=773 of 812 fits` | `[not-implemented]` inside the footer note |
| 6 | UX-D-10, 11, 25, 26 | **`2865:22079`** | `Inspector · findability — search · pills · expand-all` @940,2824, clone of `32:2`. Search row under the pill row; five collapsed sections each carrying a summary pill, incl. the four that carry none today (`MOTION · 2 triggers`, `CSS CLASSES · 4 classes`, `LINK · /pricing`, `ADVANCED HTML · ID, Title, Tab Index`) plus the renamed `CUSTOM CSS`; `Expand all / Collapse all` footer row. The `N of M sections apply` line is hidden, not restated. | `OK 2866:21802 row/Search "⌕  Search properties"` · `2866:21806/21809/21812/21815/21818` at y=114…226 · `OK 2866:21821 row/Expand all` · note `2866:21825` 268×273 moved 624→520 · `contentExtent=793 of 812 fits` | none specified |
| 7 | UX-D-14, 15, 16, 28 | **`2865:22206`** | `Inspector · MOTION · one section` @1360,2824, clone of `2430:11940`. Header rewritten INTERACTIONS → MOTION in place; the three scroll near-synonyms collapsed to one trigger; preset labels re-grouped; four blocks added — triggers that apply, the six preset families, the delete→Undo toast, and the 18-duplicate footer. | `OK setText[0] "INTERACTIONS" => "MOTION"` · `setText[5] "👁  Scroll Into View" => "👁 When it scrolls into view"` · `2866:21826/21827/21828/21829/21830/21831` at y=200…480 · `contentExtent=648 of 812 fits` | **correction applied**: 18, not 16 (PHASE4-QA corrects UX-D-14's own count) |
| 8 | UX-D-03 | **`2865:22227`** | `Inspector · multi-select · with context header` @1780,2824, clone of `159:123`. The `This ▾ / Tablet ▾ / Base ▾` pill row made unconditional at the top; `3 ELEMENTS SELECTED` + three rows with a ✕ that drops one out of the selection; Delete / Group; footer note. MixedValueBadge deliberately **not** drawn. | `OK 2866:21832 row/Pills @0,48 "This ▾"` · `2866:21839` section · `2866:21842/21846/21850/21854` · `OK 2866:21858 note/multi-select 268x104` · `contentExtent=696 of 812 fits` | inline `[not-implemented]` on the selection section header |
| 9 | UX-D-24, UX-D-27 | **`2865:22266`** | `Inspector · CSS classes duplicate · simplified density` @2200,2824, clone of `807:8342`. Left half — CSS CLASSES with applied chips and the duplicate typed back reading `already applied`. Right half — SIMPLIFIED DENSITY as an in-panel toggle. Two footer notes, one per defect. | `2866:21859/21862/21866/21870/21873` at y=88…196 · `OK 2866:21877 note/duplicate class 268x78` · `OK 2866:21878 note/density 268x117` · `contentExtent=809 of 812 fits` | none specified |
| 10 | UX-D-04, 05, 06, 07, 19 + SPEC conflicts | **`2866:21879`** | `Inspector · OPEN DECISIONS (V2 → V1)` — a **new 720×812 frame** @2600,4101 (not a clone; nothing in the section is a 720 record board). Carries all nine decisions verbatim from the plan: panel width, expanded drawer, AI home, "all like this" scope, "whole site", the properties registry, the layers breakpoint badge, the visibility keys, and the five code fixes not drawn by design. | `CREATED 2866:21879 720x812 @2600,4101` · `OK 2866:21880 title/OPEN DECISIONS @24,24` · `OK 2866:21881 body/decisions @24,56 672x533` · `contentExtent=589 of 812 fits` | it *is* the marker |

## The two conflicts — recorded, not resolved

- **Panel width.** `SPEC-NAVIGATION` has a wide drawer collapse the inspector;
  `SPEC-INSPECTOR` §6 says 300 and never contemplates collapse. **Drawn at 300**,
  which is what all 30 pre-existing panel boards in this section already are, and
  the conflict is written out as decision 1 on `2866:21879` rather than settled.
- **UX-D-02 is one third of a three-part defect.** The inspector's locked state is
  drawn (board 3). `UX-H-15` and `UX-H-14` are named in that board's footer note as
  the Layers lane's to fix, and **Layers was not redrawn**.

## What is fully drawn, and what is a clone

**Fully drawn** — every board in the table has real, new interior content, not a
renamed copy. Nine of the ten also **inherit** the CSS stack of the board they were
cloned from, which is what the plan asks for ("the clone already carries the 300px
column, the header and the section stack — the content pass then replaces the
body"). Where the 300×812 column could not hold both, trailing rows of the
inherited stack were **hidden, never deleted** (`visible=false`, one click to undo,
the repo rule): 15 on board 1, 7 on 3, 6 on 4, 16 on 5, 14 on 6, 6 on 7, 14 on 9.
Boards 2 and 8 hide nothing — board 2 shifted its whole inherited stack down and
grew to 1200 to keep all 75 children visible.

**Not drawn, and it is not a miss:**
- The four sibling composite editors (tabs, accordion, navbar, list/table) are
  **named on board 1, not drawn** — that is what the plan says to do.
- No `wireFrom` was applied, because **every row in the plan carries
  `"wireFrom": null`.** All ten boards therefore have no inbound prototype edge.
  If they should be reachable, that is a follow-up and it wants `add-hotspots.mjs`
  (a `hotspot/*` rect over the label), never a board-level reaction.
- Type: every new TEXT node is a **clone of an existing TEXT node**, so no font,
  size or weight was chosen by hand anywhere in this pass. Sources: `2067:20295`
  (11/Semi Bold `#6B7280` section header), `2067:20301` (collapsed header),
  `2067:20296` (12/Regular label + value), `956:6867` (pill row), `807:8613`
  (11/Regular note), `807:8570` (12/Semi Bold `#1A56DB`), and the FORM/MOTION
  boards' own texts. The only colours set by hand are `#C27803`, `#4B5563` and
  `#6B7280`, all tokens. No `#1A264D`, no weight above 600, all y on the 4px grid.

## Invariants

| | before (brief) | after |
|---|---|---|
| loose nodes | 77 | **77** |
| section overlaps | 2 | **2** |
| board overlaps | 0 | **0** |
| dangling edges | 0 | **0** |
| out-of-bounds | 2 | **5** |

The three new out-of-bounds children are **not from this arc** and not in this
section. `verify-invariants.mjs` names their parents itself: `147:55` *Media ·
drill-in · stock-b* (child `hotspot/tile · Insert to c`), `163:113` *History ·
Saves · time-tra* and `2854:21613` / `2854:21676` *[design-ahead] History* (children
named `Button`), plus `1719:8421` *Ecommerce · bound · inspector*. Nothing in this
pass created a hotspot or a Button instance, and every board created here is inside
`1776:8381`, which appears nowhere in that list. Reported rather than absorbed —
they are somebody's, and whoever owns Media / History / Ecommerce should see them.

The three overflows the interior pass caught (`contentExtent … OVERFLOW` on boards
1, 2 and 6) were fixed in one call and each fix read its node back
(`16|640|268|182 => 16|628|268|182`, `300|960 => 300|1200`,
`16|624|268|273 => 16|520|268|273`). The independent confirmation is the
out-of-bounds list above, which ran AFTER the fix and names five parent boards,
none of them in this section — an overflowing note is exactly what that check
counts, so the three are closed by measurement, not by arithmetic.

All ten new boards were collision-tested at creation (`no overlap`, each) and
pinned to slots measured from the free recon dump rather than left to the
first-free-row scan, which on a full section opens a row outside the section.

## Two new scripts

- `scripts/figma/dump-board-interiors.mjs` — read-only. Section bounds for every
  section on a page, the target section's children, a board's direct children, and
  a board's TEXT descendants with the size/style/colour a clone would inherit — all
  in **one** call. Three separate reads is three calls out of 200/day.
- `scripts/figma/build-inspector-states.mjs` — draws the interior of a board that
  was just cloned. Needed because a fresh clone's children are ids nobody has read:
  `edit-board-nodes.mjs` addresses nodes by id and refuses an AUTO-LAYOUT parent,
  and six of the eight inspector profile boards are auto-layout, where a new row
  belongs at a flow *index*, not an x,y. Resolves children at runtime, hides rather
  than deletes, clones rather than invents type, and reads every board back in the
  same call with its visible content extent against its own height — which is how
  the three overflows above were caught rather than shipped.
