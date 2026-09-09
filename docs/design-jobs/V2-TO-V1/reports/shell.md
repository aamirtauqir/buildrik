# shell — V2 → V1

**Module:** shell (rail / topbar / canvas / navigation) · slug `shell`
**Findings:** 36 UX rows + 1 module summary (`slices/shell.json`)
**Target sections on page `1:3`:** `1776:8385` 01 · Shell (34) · `1779:5` 09 · Canvas (14) · `1779:3` 13 · Command palette (13) · `1779:2` 20 · Notifications (12)
**Date:** 2026-09-07

## Headline

**Nothing was written to Figma. The account's MCP seat quota was exhausted
part-way through the reads and never recovered** — fifteen agents shared one
Full seat on the Professional plan, and the server answers every call, read or
write, with `You've reached the Figma MCP tool call limit`. The coordinator
confirmed the cap at the parent level and ordered a hard stop. So **no row below
is `IMPLEMENTED`**, because there is no read-back, and a status without a
read-back is the exact failure this brief exists to prevent.

What exists instead is a resolved, executable plan: **7 plan files, 34 rows,
11 new boards fully specified down to every rect and string**, plus two new
scripts. Applying it costs roughly **7 Figma calls**, not 40, because the reads
that would normally drive it have been replaced by selectors the applier
resolves in one call.

### What I actually read from the file, versus what I inferred

This distinction is load-bearing for every row below.

**READ (4 calls against page `1:3`, before the quota went):**

| | |
|---|---|
| the page's 29 sections | id · y · child count · name |
| section `1776:8385` | **all 34 children** — id, type, x/y/w/h, full name |
| section `1779:5` | all 14 children, same fields |
| section `1779:3` | all 13 children, same fields |
| section `1779:2` | all 12 children, same fields |
| section `2040:8372` | the Rail `COMPONENT_SET` `2034:8519` (60×812) and variants `2034:8392` None, `2034:8413` Insert, `2034:8434` Layers, `2034:8455` Pages, with their `rail/*` item frames at y 10/58/106/154/202/250 (44px item, 48px pitch) and their label TEXT nodes. **The dump truncated before Media, Content and Brand**, so three variant ids are not read. |
| a name-regex sweep over every section | located `642:3401` Site menu (⋯) and `164:2`/`164:22`/`164:35`/`164:42`/`164:57` Issues in section **25 · Reference `862:6859`**; `815:4518` keyboard-shortcuts-overlay in section 23; `2429:11904` "Preview · what the sandbox drops" in section 14 |

**INFERRED, never read — treat as unconfirmed:**

- **Every TEXT node id in the file.** I opened no board's interior. Every claim
  below about what a board *says* comes from the findings lanes, not from me.
- The Topbar component set's id, its variant axis names and its property values
  (`SH-A-01`'s fix depends on them).
- That the ⌘K boards actually print `Ctrl+0` / `Ctrl+Y` / `Undo last action` —
  `UX-F-06` is a finding about the *code*, and whether the board repeats it is
  unverified. The plan rows carry `expect` guards so a wrong guess is refused,
  not applied.
- That `963:4474` contains the string `320` (`SH-C-10`/`SH-E-23` say so).
- That `2476:11987` contains "Drop an element from the Insert panel".
- `1688:7195` as the Settings root board — that id is `COVER-1-01`'s, not mine.
- The instance counts (~102 rail, ~105 topbar) — `SH-CO-03` / `SH-B-14`'s census.

### Code facts I did re-verify at source (these cost nothing)

`RAIL_FIGMA` is one group of six ids (`tabsConfig.ts:350`) · `assistant` declares
`placement: "topbar"`, label "Ask AI" (`tabsConfig.ts:314`) · `isVisibleActive =
isSelectedTab && drawerOpen` and both `aria-selected` and the 3px bar hang off it
(`LeftSidebar.tsx:137,153,160`) · `onOpenPublish?.()` then
`composer?.emit(EVENTS.UI_UNPUBLISH_REQUEST)` in one synchronous arrow body
(`StudioHeader.tsx:809-812`) with `PublishTab` at `React.lazy`
(`TabRouter.tsx:42`) · `@media (max-width: 1024px)` whose only content is
`/* Show warning overlay - handled by component */` (`LayoutShell.css:354-358`) ·
the Issues slab at `position:absolute; top:56; right:0; width:360; zIndex:45`
(`AquibraStudio.tsx:604-616`) · ⌘R → Rulers with the reasoning at
`CanvasFooterToolbar.tsx:219-223,271` · the 1024 floor is
`BREAKPOINTS.desktop.minWidth` at `canvasStyles.ts:57` · `StudioPanels.tsx:370`
hard-codes the close jump to `"add"` · `StudioPanels.tsx:494-501` renders `AITab`
**instead of** `ProInspector`, not beside it.

That last one matters: `PHASE4-QA-REPORT` §2.2 says `SPEC-INSPECTOR` claims to
inherit "docked **beside** the inspector" from `SPEC-NAVIGATION`, which says *in*
the column and cites code that says *replacing* it. **I drew the code's answer —
AI replaces the column — and recorded the discrepancy on the board rename rather
than picking the nicer sentence.**

---

## One row per finding

`BLOCKED-ON-QUOTA` means the design decision is made and the plan row is written
and executable; only the Figma call is missing.

| V2 finding | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-F-01** Critical · rail shows 6 of 13 destinations | give the rail a `More` seat that indexes every off-rail destination with its key | Rail `COMPONENT_SET` **2034:8519** (7 variants) + new board **"Rail · More index (popover · 240)"** in 1776:8385 | `shell-rail-more-seat.json` + `scripts/figma/add-rail-more-seat.mjs` (new); board N1 in `shell-new-boards.json` (19 nodes: BUILD Templates T / Components ⇧A · SHIP Publish U / History H / Review R · CONFIGURE Settings S, plus "Bare letters — no modifier. AI is not here…") | component set id, size 60×812, four variant ids and the 48px item pitch **read**; the More seat and its instance census are not | BLOCKED-ON-QUOTA |
| **UX-F-07** Critical · issue rows go nowhere | give each issue a real destination, or stop drawing the row as clickable | new board **"Shell · Issues joins the grid"**; the Issues boards themselves (`164:2`/`22`/`35`/`42`/`57`) are in section 25, outside my scope | the board carries the row-target statement verbatim, including the QA correction that `Fix ›` **is** live (`IssuesPanel.tsx:252-261`) and it is the issue TEXT that is not a navigation target | board is planned, not built | BLOCKED-ON-QUOTA (and see *Not covered* — the Issues boards are out of section) |
| **UX-F-09** Critical · Quick preview is one page with everything off | preview the site, or say on screen that it does not | **65:211** "Shell state 7 · Preview" | rename in `shell-truth-marks.json` naming `Composer.ts:707`, `PreviewOverlay.tsx:106`, `ExportUtils.ts:35-43` and requiring the on-screen disclosure | current name read as exactly `Shell state 7 · Preview` — it says none of this today | BLOCKED-ON-QUOTA |
| **UX-F-30** Critical · "Unpublish site…" never confirms | the destructive row owns its confirmation at the point of invocation | new boards **"Site menu · Unpublish confirm (modal · 440)"** and **"Site menu (⋯) · regrouped"** | N8 + N7 in `shell-new-boards.json`; wiring in `shell-hotspots.json` rows 1-2 (both ends are boards this pass creates, so they resolve with no prior file knowledge) | `StudioHeader.tsx:809-812` and `TabRouter.tsx:42` re-read at source | BLOCKED-ON-QUOTA |
| **UX-F-02** Major · nothing selected when the drawer is shut | keep selected marked whether the drawer is open or shut | new board **"Rail · selected vs open (two signals)"** + instance override on **199:409** "Shell state 5 · Drawer closed" | N2 (three specimens: open / closed / unselected) + `shell-instance-overrides.json` row 2 (`Active=Insert`, hide the `active bar` child) | `LeftSidebar.tsx:137-160` re-read; the board's rail instance id is not read | BLOCKED-ON-QUOTA |
| **UX-F-03** Major · Exit never says where it goes | name the destination on the control and in the confirm | **2272:11904** "Exit · Editor (leaves to your sites)"; the shared Topbar's exit label | rename in `shell-truth-marks.json`; text fix row 6 in `shell-text-fixes.json` (`"Exit"` → `"Exit to dashboard"`, marked **high risk / ~105 instances**); the new "Topbar · location line" board draws it | current board name read exactly; the Topbar set was never located — the selector is a stated guess with a fallback route | BLOCKED-ON-QUOTA |
| **UX-F-04** Major · two command palettes | one palette, or make both show the same rows | section **1779:3** and board **1177:4804** | the brief forbids resolving this silently, so: rename appending the open decision, plus row 2 of the new "Shell · open decisions" board | **section name read as** `13 · Command palette · 13 — two palettes ship: shell ⌘K and canvas ⌘⇧P — one decision open` — the conflict is *already* recorded at section level; the board is not | ALREADY-CORRECT at section level (read back), amendment BLOCKED-ON-QUOTA |
| **UX-F-05** Major · two incomplete help screens | one shortcuts screen answering both `?` and ⌘/ | `815:4518` "S3.10 · keyboard-shortcuts-overlay" — **section 23 · Journeys**, not mine | none | board located by name sweep; its section is outside my four | NOT-APPLICABLE (out of section) — see *Not covered* |
| **UX-F-06** Major · ⌘K prints chords that do not exist | derive printed chords from one registry; drop the duplicate Undo | **166:27** and its five siblings in 1779:3 | 3 conditional text rows (`Ctrl+0`→`⌘1`, `Fit to view` whole-string variant, `Ctrl+Y`→`⌘⇧Z`) + 1 deletion row for `Undo last action` | **not verified that the boards print these strings at all** — every row carries an `expect` guard and reports NOMATCH rather than writing | BLOCKED-ON-QUOTA (conditional) |
| **UX-F-08** Major · Issues is a 360 slab outside the grid | make it a real column sharing the inspector slot | new board **"Shell · Issues joins the grid"** + **963:4474** rename | N9 (two schematics: today's absolute overlay vs. the inspector slot with a `‹ Inspector` back row) + truth-mark row 4 | `AquibraStudio.tsx:604-616` re-read; `963:4474`'s current name read exactly as `Shell · 360 overlay panel (slot proof)` | BLOCKED-ON-QUOTA |
| **UX-F-10** Major · AI has two homes | one home, every door routes to it | **66:225** "Shell state 9 · AI agent run" | rename recording the one-home decision **and** the `PHASE4-QA` §2.2 correction that the cited code replaces the column rather than docking beside it | current name read exactly as `Shell state 9 · AI agent run`; `StudioPanels.tsx:494-501` re-read | BLOCKED-ON-QUOTA |
| **UX-F-11** Major · no persistent AI door | build the top-bar door the config claims, or move the declaration | **66:225** (same rename) | the rename states that the door the config has claimed since `tabsConfig.ts:314` still does not exist. **No board draws the affordance** | `tabsConfig.ts:314` re-read (`placement: "topbar"`, label `"Ask AI"`) | PARTIAL / BLOCKED-ON-QUOTA — the door itself is not drawn |
| **UX-F-12** Major · two things called settings | one Settings destination | new board **"Site menu (⋯) · regrouped"** | its caption states that "Site settings" and ⌘, point at the full-page surface where Domains / Redirects / Forms / Headers / Localization live | the 13-screen surface is section 21 `1776:8387`, read in the section list | BLOCKED-ON-QUOTA |
| **UX-F-13** Major · full-page mode has no way out | a persistent shell-level "Back to canvas" that returns you where you were | new board **"Shell · full-page mode — Back to canvas"** | N6 — topbar with the back control, the rail with nothing lit, and the note that closing hard-codes `"add"` | `StudioPanels.tsx:370` re-read | BLOCKED-ON-QUOTA |
| **UX-F-14** Major · below 1024 the shell silently degrades | build the small-viewport state or delete the promise | new board **"Shell · below 1024 — desktop-only"** | N3 — the blocking card, the measured-width chip, and the citation | `LayoutShell.css:354-358` and `canvasStyles.ts:57` re-read | BLOCKED-ON-QUOTA |
| **UX-F-15** Major · drawer has two widths and no handle | a draggable edge with a remembered width, or a middle step | new board **"Shell · open decisions"** row 1 | records **700 as drawn** (per the brief) and files the 560 proposal, with `SPEC-PUBLISH-PANEL`'s contradicting "nothing else" clause | — | PARTIAL / BLOCKED-ON-QUOTA — the open decision is drawn, the drag handle is not |
| **UX-F-16** Major · two tab strips read as one list | distinct roles and names | new board **"Topbar · location line"** | carries the "Editor sections" vs "Site pages" contract and the a11y snapshot that ended in "Home" | — | BLOCKED-ON-QUOTA |
| **UX-F-17** Major · page management exists twice | decide which surface owns it | — | none | `SPEC-NAVIGATION` §7 states in as many words that this is the Pages spec's decision, not navigation's | NOT-APPLICABLE (owned by the pages module) |
| **UX-F-18** Major · Tab cannot leave the canvas | let Tab leave, or print the escape chord | new board **"Canvas · keyboard, zoom and viewport"** in 1779:5 | block 1 of 7 | `Canvas.tsx:660` / `useCanvasKeyboard.ts:87-107` per the lane; section 09 geometry read so the board fits at (2480,1695) with no section resize | BLOCKED-ON-QUOTA |
| **UX-F-19** Minor · inspector mode has no control | give it a control or delete the flag | same canvas board | block 5 | — | BLOCKED-ON-QUOTA |
| **UX-F-20** Major · a refused Publish looks ready | show the block without hovering | new board **"Topbar · Publish CTA states"** | N5 row 7 — grey treatment plus the reason printed beside the button in `#C27803` | `SH-A-02` records that the board already draws it at 50% on grey and the **code** is the off-system party; N5 states the target for both | BLOCKED-ON-QUOTA |
| **UX-F-21** Major · the CTA changes verb and vanishes | keep it present and constant; say "Up to date" | same board + instance override on **199:2** | N5 rows 1-6 + `shell-instance-overrides.json` row 1 (`SH-A-01`: the ready variant is on **zero** of the 15 numbered Shell boards) | `199:2` read as `Shell state 2 · Returning (default)`, 1440×900 @1660,220; its topbar instance id and property map are **not** read | BLOCKED-ON-QUOTA |
| **UX-F-22** Major · three zoom implementations | one owner, one step, one clamp | canvas board | block 2 — 10-step vs preset-walk vs registry, and the 400/500 clamp split | `CanvasFooterToolbar.tsx:258-264` re-read | BLOCKED-ON-QUOTA |
| **UX-F-23** Minor · arbitrary session memory | one rule, one store | canvas board | block 7 | — | BLOCKED-ON-QUOTA |
| **UX-F-24** Major · device change does not fit | fit on device change | canvas board | block 3 | `AquibraStudio.tsx:545-548` per the lane | BLOCKED-ON-QUOTA |
| **UX-F-25** Major · fifteen widths, four tokens | one sizing table, a token per surface class | **963:4474** rename + **"Shell · Issues joins the grid"** caption | the rename carries the class table: 300 inspector, 360 panel-right for notifications/Issues/Structure | `963:4474` name read exactly | BLOCKED-ON-QUOTA |
| **UX-F-26** Minor · `--bk-size-nav` has zero consumers | delete it, or share one right-hand token | same | the rename and the caption both state the rename to `--bk-size-popover` | — | BLOCKED-ON-QUOTA |
| **UX-F-27** Minor · Structure popover unreachable | render the trigger or delete the surface | canvas board block 5 + Issues-board caption | both name it | — | BLOCKED-ON-QUOTA |
| **UX-F-28** Minor · two dead viewport controls | delete both | — | none | a component with no call site has no drawing to change; this is a code deletion | NOT-APPLICABLE (code-only) |
| **UX-F-29** Major · the ⋯ menu does three jobs | split it; mark the rows that leave | new board **"Site menu (⋯) · regrouped"** | N7 — two groups (THIS SITE / LEAVES THE EDITOR ↗), ↗ on every new-tab row, Unpublish in `#E02424` | the shipped menu board `642:3401` is in **section 25**, outside my scope; N7 restates the target rather than editing it | BLOCKED-ON-QUOTA |
| **UX-F-31** Major · twelve bare letters, no legend, no modal guard | add the guard; print the letters where the user is | **"Rail · More index"** | its footer reads "Bare letters — no modifier. AI is not here: it opens in the inspector column." | `PHASE4-QA` correction honoured: **twelve** bare letters, not thirteen — Components is `⇧A` (`tabsConfig.ts:163`), and the index prints it that way | BLOCKED-ON-QUOTA |
| **UX-F-32** Minor · ⌘R is taken for Rulers | move the overlay chords off browser keys | canvas board | block 4 | `CanvasFooterToolbar.tsx:219-223,271` re-read | BLOCKED-ON-QUOTA |
| **UX-F-33** Major · Start blank removes both routes | keep a way back while the page is empty | **2476:11987** | rename + text row 5 rewriting the instruction to "Drop an element… / Open Insert · Browse templates" | current name read exactly as `Canvas · empty page — first run · after Start blank (anatomy)`; the interior string is unverified and the row is `expect`-guarded | BLOCKED-ON-QUOTA |
| **UX-F-34** Minor · the status footer is inert | make the readout a door; say "not visible" | canvas board | block 6 | `StudioFooter.tsx:210-224` per the lane | BLOCKED-ON-QUOTA |
| **UX-F-35** Minor · Exit and the menu disagree about the noun | one noun, one destination | **2272:11904** | the rename requires `/dashboard/sites/<id>` for both | current name read exactly | BLOCKED-ON-QUOTA |
| **UX-F-36** Major · the shell never states its location | one location line surviving every mode | new board **"Topbar · location line — site › page › panel"** | N4 — three variants (canvas / full-page / preview) and the note that the canvas breadcrumb `1175:4849` is a different question | `1175:4849` "Canvas · breadcrumb bar" read in the section-09 inventory | BLOCKED-ON-QUOTA |
| **UX-F-37** Critical · module summary: the spine is half-built | name the destination list; give every destination a door; make the rail and footer say where you are; repair the three broken promises | the eleven new boards together | the More index names the list; the rail seat is the door; "selected vs open" and the location line are the orientation; preview / issues / unpublish are the three promises | — | BLOCKED-ON-QUOTA |

---

## Deliverables produced

| file | rows | resolved? |
|---|---|---|
| `plans/shell-new-boards.json` | 10 boards, 150 nodes, section `1776:8385`, resize to 7880×7020 | **fully resolved** — no node ids needed |
| `plans/shell-canvas-board.json` | 1 board, 16 nodes, section `1779:5` at (2480,1695) 900×480 | **fully resolved** — fits the existing row, no section resize |
| `plans/shell-truth-marks.json` | 6 renames | **fully resolved** — every id read from the file, each row carries the exact current name in `was` |
| `plans/shell-rail-more-seat.json` | the shared-component change | component-set id + 4 of 7 variant ids read; the script iterates `set.children` so the 3 unread variants are covered |
| `plans/shell-text-fixes.json` | 6 rows | `unresolved-id` + selectors; all `expect`-guarded |
| `plans/shell-instance-overrides.json` | 2 rows | `unresolved-id`; property names flagged as guesses |
| `plans/shell-hotspots.json` | 8 rows | 2 fully mechanical (both ends are new boards); 6 name a destination *section* only and are deliberately left unresolved |
| `plans/shell-deletions.json` | 1 row | conditional; no remover script exists by design |
| `scripts/figma/build-spec-boards.mjs` | new | builds a designed board from a flat spec, refuses off-grid geometry, sub-11px text, weights above Semi Bold and `#1A264D`, and reads every board back in the same call |
| `scripts/figma/add-rail-more-seat.mjs` | new | adds the divider + seat to every variant, wires it, and reports the **instance census** instead of asserting propagation |
| `scripts/figma/resolve-selectors.mjs` | new | turns every selector row into a node id in **one** call; reports AMBIGUOUS/NOMATCH rather than guessing |

### Apply order (≈7 Figma calls)

1. `build-spec-boards.mjs plans/shell-new-boards.json --apply` — 2 calls (chunked; the section resize rides on the second).
2. `build-spec-boards.mjs plans/shell-canvas-board.json --apply` — 1 call.
3. `add-rail-more-seat.mjs --to <id of "Rail · More index (popover · 240)"> --apply` — 1 call. **Take the id from step 1's output; do not guess it.**
4. `apply-truth-marks.mjs plans/shell-truth-marks.json --apply` — 1 call, 6 rows. Check each row's `was` against the printed old name first.
5. `resolve-selectors.mjs` on `shell-text-fixes.json`, then `apply-text-fixes.mjs …resolved.json --apply` — 2 calls.
6. `verify-invariants.mjs` — 1 call. **Required**: steps 1-3 are structural.

`shell-instance-overrides.json`, `shell-hotspots.json` (rows 3-8) and
`shell-deletions.json` need a read first and should not be applied blind.

### Design-system compliance, enforced in the builder rather than asserted

Every new board is Inter at 11/12/13/14/16/20 with weights capped at **Semi
Bold**; all board geometry is on the 4px grid; the only colours used are the
brief's tokens plus `#1A56DB` at 0.06/0.08 for the two tints; `#1A264D`
(`CONF-1-01`) is refused by the script. `build-spec-boards.mjs` exits non-zero
on any violation before it opens a connection — the plan passed that check.

---

## What I did NOT cover — plainly

1. **Nothing was applied.** Zero writes. Zero read-backs of anything this pass
   proposes. Do not read any row above as done.
2. **`verify-invariants.mjs` was never run** — not before (no baseline captured)
   and not after (nothing changed). It is step 6 of the apply order and it is
   not optional: the new boards, the section resize and the component-set edit
   are exactly the kind of change that breaks loose/oob/overlap/dangling.
3. **I opened no board's interior.** 73 board-level nodes across my four
   sections were read by name and geometry only. Every statement about what a
   board *contains* is the findings lanes', not mine. That is why six plan rows
   are `unresolved-id` and every text row is `expect`-guarded.
4. **Three shell-owned surfaces live outside my four sections and were not
   touched:** the Site menu `642:3401` and the five Issues boards
   `164:2`/`164:22`/`164:35`/`164:42`/`164:57` in **section 25 · Reference**, and
   the keyboard-shortcuts overlay `815:4518` in **section 23 · Journeys**. My new
   boards restate the target design; they do not correct those drawings.
   `UX-F-05` is closed as out-of-section for that reason and for no other.
5. **Section 14 · Preview (`1779:4`) is not mine**, though `UX-F-09` reaches into
   it. `2429:11904` "Preview · what the sandbox drops (reference)" already exists
   there and covers part of the finding; I did not read it.
6. **Three Rail variants — Media, Content, Brand — were never read** (the dump
   truncated). The seat script iterates `set.children`, so they are covered by
   construction, but their ids are not in this report.
7. **`UX-F-11`'s actual affordance is not drawn.** The rename says the top-bar AI
   door does not exist; no board shows what it should look like.
8. **`UX-F-15`'s drag handle is not drawn** — only the 700-vs-560 open decision.
9. **The More index's seven rows are not wired to their panels.** Six of the
   eight hotspot rows name only a destination section, because no panel-root
   board id was ever read and a hotspot pointing at the wrong board is worse
   than none.
10. **The arrangement findings in `_board-level.json` that touch my sections
    (`ARR-B-01`…`ARR-B-05`, `ARR-B-13`…`ARR-B-15`, `ARR-B-25`…`ARR-B-27`,
    `ARR-C-25/26`) were read and deliberately not acted on.** They are row-order
    and caption-coverage defects; re-flowing a section while ten new boards were
    pending would have invalidated my own placement arithmetic. My new bands sit
    below the existing content and change no existing board's position.
11. **The visual defects `VIS-2-24`, `VIS-2-29`, `VIS-2-30` (notification-row
    timestamp overprinting on `165:2` and its all-read twin) and `VIS-3-15`
    (caption overflow on `1176:4925`) are inside my sections and are not
    planned.** They need the node-level read the quota denied. Section 20 ·
    Notifications received **no** work at all.

## What contradicts the V2 source

1. **`SPEC-NAVIGATION` §2.5 vs. the code it cites, on AI's home.** §2.5 says the
   boards put AI "in the inspector column"; `SPEC-INSPECTOR` §6 says it inherits
   "docked **beside** the inspector"; `StudioPanels.tsx:494-501` renders `AITab`
   **instead of** `ProInspector`. Beside is a third design nobody allocated room
   for — the column is 300 and §5.2's table gives it no sibling. **I drew the
   code's answer and said so on the board.**
2. **`SPEC-NAVIGATION` §5.2 vs. `SPEC-PAGES-PANEL` / `SPEC-PUBLISH-PANEL`, on the
   expanded drawer.** 560 vs 700. Per the brief I drew **700** and filed 560 as
   an open decision. §5.2's rider — that the wide drawer also collapses the
   inspector — is contradicted by `SPEC-PUBLISH-PANEL`'s "nothing else" and by
   `SPEC-INSPECTOR` §6's "no new panel width"; that is on the decisions board too.
3. **`SPEC-NAVIGATION` §6 vs. `PublishTab.tsx:179-183`, on the unpublish
   confirm.** The spec gives it to the ⋯ menu's own flow; the code records the
   opposite decision *with its reason* ("this panel hosts the ONE confirm …
   rather than hosting a second dialog with drifting words"), and
   `SPEC-PUBLISH-PANEL` never mentions `UX-F-30` at all. The two fixes cannot
   both ship. I drew the menu-side confirm because `UX-F-30` is Critical and the
   race is real, and recorded the conflict on the decisions board instead of
   pretending it is settled.
4. **`UX-F-31` says thirteen bare letters; there are twelve.** Components is
   `⇧A` (`tabsConfig.ts:163`), which `PHASE4-QA` caught and which
   `SPEC-NAVIGATION`'s own More index already prints correctly. The new index
   prints `⇧A`.
5. **`UX-F-01` and `UX-F-37` say "twelve panel destinations"; `SPEC-NAVIGATION`
   §2.1 says thirteen registered tabs, twelve of which render in the drawer**
   (Settings is full-page). Both are true at different levels. The More index
   lists **seven** off-rail destinations and excludes AI, which is the spec's
   own arithmetic.
6. **`UX-F-07` overstates its own case and the file already knows it.** The
   panel is not inert: `IssuesPanel.tsx:252-261` renders a working `Fix ›`
   beside every fixable row. The defect is narrower — the issue *text* is not a
   navigation target — and the new board says the narrower thing.
7. **`UX-F-20` blames the board for a code defect.** `SH-A-02` measured it: the
   board already draws the blocked CTA at 50% on grey and the **code** renders
   full-opacity accent blue. The board is not the off-system party here.
