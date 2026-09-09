# V2 → V1 · module **media** · section `1776:8372` "05 · Media · 61"

**Status of the whole pass: PLAN-ONLY. No write was made to Figma.**

The Figma MCP seat quota was exhausted account-wide part-way through this pass (fifteen
agents on one Professional seat). Two reads landed before it drained; every call after
that returned *"You've reached the Figma MCP tool call limit for your Full seat"*, and the
coordinator issued a hard stop on all further calls — including `verify-invariants.mjs`,
because a quota string is not a measurement.

So: **nothing here carries a read-back, and nothing here is `IMPLEMENTED`.** What exists
instead is eight plan files that another session can apply mechanically in ~57 calls, and
one new script that the plans need and the folder did not have.

---

## What was actually read from the file, and what was not

| | |
|---|---|
| **Read LIVE from Figma (1 successful call, 2026-09-07)** | The 61 children of section `1776:8372` — id, type, x, y, width, height, reaction count, name. Result: **44 boards + 17 caption TEXT nodes**. |
| **Read OFFLINE** | `scratchpad_audit/vis3/page-meta.txt` — a full XML dump of page `1:3` taken **2026-09-06 14:20**, i.e. *after* `scripts/figma/fix-qa-regressions.mjs` ran (its three fixes are visible in the dump: `lo/strip` at h36, the two `lo/badge` rects at y300, `2430:21399` at w64). Every board id, name and coordinate in that dump matches the live read exactly, which is the only reason the child-level ids below are trusted. |
| **NEVER read** | (a) the `characters` of any TEXT node — the dump carries the node **name**, which for auto-named Figma text equals the copy but is not guaranteed to; (b) the children of any component **instance** (`Panel header` ×17, `Card / media` ×~40, `List row` ×5, `Topbar`, `Rail`); (c) **any reaction / prototype edge** — every edge fact in this report comes from `docs/design-jobs/findings/W-A.jsonl`, not from a read. |
| **Never fetched** | Any screenshot. The brief says they are the expensive call, and the quota was gone. |

**Consequence for the plans.** Every `apply-text-fixes` row carries an `expect` prefix
guard taken from the node's Figma name, so a row whose characters differ is **REFUSED, not
applied**. That is deliberate: the guard converts "I inferred this string" into a failure
the applier will see rather than a silent overwrite.

---

## Findings table

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-H-02** *(Critical)* — stock search can never say it failed; "no key", "key expired", "network dropped" and "no photos of that" are one silent empty grid | a configured-ness signal + a distinct error state; only one of the three is worth a retry | `1738:8394` stock·search-failed · `1716:8497` stock·no-results · **new** `Media · stock · not-configured` · **new** three 280-wide arms off `147:55` | 3 text rewrites on `1738:8394` (`1738:8406` → "Couldn't reach the stock provider.", `1738:8411`, `1738:8412`); a `Try again` label cloned onto `1738:8394` **only**; 4 new boards (`media-04` rows 1, 3–5) with per-arm copy in `media-06` | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-11** *(Critical)* — a device-only asset is warned about twice, in toasts that auto-dismiss; the tile carries no marker | persistent badge in the grid **and** a line in the detail screen with the re-upload that fixes it | `2430:21365` local-only · `146:2` detail (**new** `… · device-only (re-upload)`) · sync pills on `1159:4593` `1162:4617` `1163:4641` `1163:13695` `1163:13948` | board renamed to `[not-implemented] …` (QA-A-39's exact wording); `lo/note` `2430:21547` rewritten to QA-A-37's replacement; **five** `⚠ This device only` pills → `⚠ 2 not on the server` (four rewritten + pill frames widened 107→121; the one on the *empty* board `1162:4825` hidden, because with zero assets `localOnlyCount` is zero); new detail board with the ⚠ strip and a `↻ Re-upload` row | — none | **BLOCKED-ON-QUOTA** |
| **W-A-01** *(Critical, module headline)* — the module's primary outcome, an asset landing on a page, has **no wired edge anywhere in the section** | wire "Insert to canvas" with hotspots, not board reactions | `1159:4593` (`1161:145`/label `1161:146`) · `1163:4641` (`1163:4831`/`1163:4832`) · `1163:13948` (`1163:14138`/`1163:14139`) · `144:2` card 1 (`218:686`) | 4 `hotspot/*` rects → `52:2` in `media-03` (the three fullpage twins **and** the drawer card, because the drawer's frame catch-all sends a card click to asset-detail while the code inserts — `useMediaState.ts:245-259`) | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-01** *(Major)* — right-click opens no menu; it silently enters bulk mode. No rename, copy-URL or single-asset delete on the default surface | restore the per-asset menu on right-click; give bulk selection its own Select control | all 13 drawer folder rows · `144:2` gesture hotspot `1671:7213` · **new** drawer context-menu board | folder-row `⊞ ⊟ ↑` → `☑ Select` on 13 nodes + moved to x200 w64; 12 hotspots → `145:300`; `1671:7213` renamed and re-pointed at the new menu board (cloned from `1717:17203`, item list corrected to `MediaContextMenu.tsx:5-10`'s nine per W-A-49, menu card grown 196→280 so `Delete` stops rendering outside it — VIS-2-18) | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-03** *(Major)* — the drawer's stock overlay isn't wired to the failure flag at all | give it the modal's three-way state: results / genuinely empty / could not reach | `147:55` + **3 new** boards; hotspot `1720:17505` | 3 clones of `147:55` with per-arm copy, results/loading/load-more hidden on each; `1720:17505` renamed to say it jumps to a **different component** (StockSourceModal, W-A-33) | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-04** *(Major)* — two stock browsers with unequal powers; the drawer's is missing the primary verb | one component, two sizes, same actions | `147:55` · `1716:8391` | `147:55` renamed with an explicit `[not-implemented] insert-to-canvas` clause naming `StockBrowserOverlay.tsx:148` vs `MediaTab.tsx:232-255`; an `Insert · Save` action label cloned under all four result cards; a `hotspot/tile` on `147:74` → `52:2` and on `1716:8435` → `144:2` (W-A-05: no stock board had a save **or** insert edge); caption `155:46` carries the unify recommendation | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-05** *(Major)* — a 395-line stock modal mounted behind a flag that is never turned on; Icons/Fonts reachable only through the fullpage manager | delete the unreachable mount or give it a door; put Icons and Fonts in the footer beside Upload and Stock | **12** drawer footers · `1159:4593` `1162:4617` `1163:4641` `1163:13695` `1163:13948` toolbars | footer re-gridded to four doors (Upload x16 · Stock x89 · Icons x152 · Fonts x213, right edge 263); `☁ Browse stock` → `☁ Stock` ×11; `⬡ Icons` cloned onto the 10 footers that lack it and moved off its overlap on the 2 that have it; `Aa Fonts` cloned onto all 12 with a **new** `Media · stock · fonts · empty` destination so it is not a fourth dead control; 10 fullpage toolbar hotspots for `+ Add from stock` and `⭳ Import URL` (W-A-09/10/39) | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-06** *(Major)* — the picker offers more formats than the product can store; nothing states what is supported | make the accept-list the server's closed list and name the formats before the user picks | `1163:13948` drop veil · `145:148` failed row · `1164:4713` footnote · **12** drawer footers | `1163:14202` → the closed list + **50 MB per file**; `145:197` → "file is 62 MB, the limit is 50 MB per file" (the board said the picker's 10 MB); `1173:4814` loses "· From URL launches soon" (W-A-17); `1163:14190` loses the zip-extraction row (W-A-19, no such capability exists) and `1163:14182` is marked; a `note/formats` line cloned into all 12 footers | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-07** *(Major)* — the folder scope control can never enable and the drawer cannot create a folder | put New folder in the drawer's own folder menu | `144:11` on `144:2` · **new** `Media · detail · folder-menu · ＋ New folder (of 144:2)` | new board cloned from `1717:17203`, items = the smart scopes + user folders + `＋ New folder…` in accent `#1A56DB`; hotspot on `144:11`; `＋ New folder…` → `1205:4829` (the existing inline field board — 240 wide, drawn for the fullpage rail; a 280 variant is **owed and not planned**) | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-08** *(Major)* — Grid / List / Sort render permanently disabled, no tooltip, Grid drawn pressed | wire them or remove them; a disabled control needs a stated reason | all 13 drawer folder rows + 12 footers | **removed** — the trio becomes `☑ Select`. A one-option view toggle is noise and sort is genuinely unreachable in the drawer (`useMediaState.ts:363-372` wired nowhere in `SlimLauncher`); list view and sort keep working where they actually work. A `note/where-it-lives` line in every footer says so: *"Sort and list view live in the full library ⇱"* | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-09** *(Major)* — "✨ Generate" fails in total silence | an inline error under the field, or hide the affordance when AI is unconfigured | `146:2` (+ **new** `… · alt-generate-failed`) · alt-rows on `1159:4593` `1163:4641` `1163:13948` | new state board with `Couldn't generate alt text — AI isn't configured for this site.` in `#E02424` under the field and the Alt text frame grown 80→108; `146:11` and the **three fullpage `alt-row` twins** (`1161:129`, `1163:4815`, `1163:14122`) renamed to carry the silent-catch marker; the "hide the affordance" alternative recorded as an open decision because it needs a capability signal the product does not have — the same shape as UX-H-02 | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-10** *(Major)* — the asset drill-in has no rename, delete, download or copy-URL | put them there; let the filename be the editable field | `146:2` · **new** `Media · delete-confirm · single file` | four `List row` instances cloned from `233:1274` at y480/512/544/576 → `✎ Rename`, `🔗 Copy URL`, `⤓ Download`, `🗑 Delete`; the three **existing but dead** hub rows wired (`233:1254`→`146:68`, `233:1259`→`146:32`, `233:1274`→`1164:4738`, W-A-06); a single-file confirm cloned from `1175:4827` with the typing gate hidden and the Undo contradiction settled in a note (W-A-26/27/29) | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-12** *(Minor)* — an upload in flight cannot be cancelled or dismissed | every in-flight row needs a cancel, every terminal row a dismiss, in the drawer | `145:96` (`145:143`) · `145:148` (`145:195`) · `1163:13948` (`1163:14188`, `1163:14194`) | `✕ cancel` cloned onto the drawer's running row and `✕ dismiss` onto its failed row (percent/Retry moved left to make room); `Cancel` onto the fullpage `q/run` and `Dismiss` onto `q/done`, cloned from the `Dismiss` the `q/err` row already has | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-13** *(Major)* — the expand brackets don't widen the drawer, they open a different application surface | name the destination; make the missing actions visible-but-redirecting | `144:2` hotspot `1165:4713` · 12 footers · caption `155:33` | hotspot renamed to say the expand **closes** the drawer and opens the full library (`MediaTab.tsx:87-96`); the footer's `note/where-it-lives` line names the destination; the Panel header itself is a shared instance and was **deliberately not touched** (brief rule 6) | — none | **BLOCKED-ON-QUOTA** |
| **UX-H-33** *(module summary)* — two surfaces with unequal powers and nothing naming the second | make one canonical and the other a size of it | caption `155:33` + everything above | The pass closes the gap **in the drawer** wherever the code already can (Select, the folder menu, four footer doors, rename/copy-URL/download/delete on the drill-in) and **names the destination** for what is left. The "one canonical surface" call itself is recorded as an open decision, not taken — it is a product decision, not a defect with a right answer | — none | **BLOCKED-ON-QUOTA** |

### Board-level rows inside `1776:8372` picked up on the way

| row | action taken | status |
|---|---|---|
| **QA-A-37 / QA-A-39** (`2430:21365`) | note rewritten, board marked — folded into UX-H-11 | BLOCKED-ON-QUOTA |
| **QA-A-35** (`2430:21365` badges over the STOCK badge) | **ALREADY-CORRECT.** `scripts/figma/fix-qa-regressions.mjs` moved both `lo/badge` rects to y300 (the filename row) and grew `lo/strip` to h36; the 2026-09-06 14:20 dump shows the fixed geometry. *Evidence is the offline dump, not a live read-back.* | ALREADY-CORRECT (offline evidence only) |
| **COVER-1-21** (sync pills) | applied to **five** boards — the row named three; `1159:4593` and `1163:13948` carry the same pill and were missed | BLOCKED-ON-QUOTA |
| **COVER-1-22** (Trash rows) | all **five** rows renamed with the "Trash coming soon" marker; rows kept drawn on purpose | BLOCKED-ON-QUOTA |
| **COVER-1-23** (mixed provider credits on `1716:8391`) | `1716:8440` / `8446` / `8452` → `· Unsplash` | BLOCKED-ON-QUOTA |
| **COVER-1-25** (replace-across has a 4th, rollback arm) | new `Media · modal · replace-across · all-failed (rollback)` board at 520 wide (W-A-15: the 948×80 strip is a section listing, not a modal state) | BLOCKED-ON-QUOTA |
| **VIS-3-26** (`782:4353` has no footer — it sits at y827 on an 812 board) | spacer `782:4381` 494→297 | BLOCKED-ON-QUOTA |
| **— (unflagged twin of VIS-3-26)** | `777:4093` has the same defect: `777:4122` at y768 h182 = 950 on an 812 board. Spacer `777:4121` 254→116. Found by measuring all twelve footers | BLOCKED-ON-QUOTA |
| **VIS-3-18** (`1758:8372` stray empty-state block inside the populated `145:49`) | hidden, not deleted | BLOCKED-ON-QUOTA |
| **VIS-2-18** (`Delete` renders outside the context-menu card) | menu card grown 196→280 on the new drawer menu; the defect **remains on `1717:17203` itself** and is listed as not covered | BLOCKED-ON-QUOTA |
| **W-A-02** (neither button on the bulk delete confirm works) | Cancel wired to `145:300`; the Delete button's destination is a post-delete board that does not exist (W-A-26) and is **not planned** | partial → BLOCKED-ON-QUOTA |
| **W-A-06 / 09 / 10 / 13 / 17 / 19 / 39 / 49** | folded into the rows above | BLOCKED-ON-QUOTA |

---

## The open conflicts I did **not** resolve

1. **The Media drawer has three widths and no token.** The boards draw **280**. The panel
   mounts at **320** (`SlimLauncher`, per UX-H-01's own screen label). `LeftSidebar.css:231`
   overrides Media to **560**, which V2 §11 measured and called "a runtime override with no
   token". Separately the brief's standing conflict — `SPEC-NAVIGATION` proposes the expanded
   drawer at 560 while `SPEC-PAGES-PANEL`/`SPEC-PUBLISH-PANEL` and `LeftSidebar.tsx:586-587`
   say **700** — is unresolved and I drew nothing at either width. Filed on caption `155:33`
   (`media-07`), not applied.
2. **Two per-file size caps ship.** `UploadZone` and the server enforce **50 MB**
   (`UploadZone.tsx:16`, `asset-upload/route.ts:52`); the picker modal enforces **10 MB**
   (`MediaLibraryPanel.tsx:272`). The plan makes each board state the cap **its own** path
   enforces. Reconciling them is a product decision.
3. **UX-H-09's second arm.** "Hide the Generate affordance entirely when AI is not
   configured" needs a capability signal the product does not have — structurally the same
   gap as UX-H-02's stock configured-ness. Recorded, not drawn.
4. **UX-H-05's first arm.** "Delete the unreachable mount" is a code decision
   (`MediaTab.tsx:73` `stockModalOpen`, initialised false, only setter sets it false again).
   I applied the second arm — give the doors a home in the footer — which is the design half.

## Where the V2 source and the code disagree, and what I did

- **UX-H-11 vs QA-A-37.** The V2 finding says a device-only asset "is warned about exactly
  twice, in two toasts". QA-A-37 shows it is **three** places by name
  (`useUploadState.ts:128`, `useMediaState.ts:235` and `:268`, plus `useDropExecution.ts:263`
  on canvas drop). The finding's *conclusion* survives — none of them is persistent and none
  is in the grid — so I applied the fix and corrected the board's justification text rather
  than the finding.
- **W-A-09's node map is wrong for `1163:4641`.** It reads `1163:4674` as Import URL; the
  file has `1163:4674 = btn/↑ Upload`, `1163:4672 = btn/⭳ Import URL`, `1163:4676 = btn/+ Add
  from stock`. The plan uses the file's ids.
- **1716:8557's marker already contradicts the boards it sits beside.** It is correctly
  marked `[not-implemented]` for the inert provider switch, while `1716:8391` and `1716:8497`
  still draw the same live-looking pills. `media-06` hides the pill group on the new
  not-configured board; the two existing boards are **not** fixed here (FIG-E-13's scope).

---

## What I did **NOT** cover — named

**Section arithmetic:** 61 children = **44 boards + 17 captions**. I extracted the offline
node tree for **24** boards and only grepped the footer/folder-row of the rest.

**Boards I never opened beyond their one-line row in the section listing (20):**

`75:2` (Media drill-ins — the five destinations, 1436×992) · `146:32` (drill-in · versions) ·
`146:68` (drill-in · used-in) · `147:2` (drill-in · icon-picker) · `1164:4738` (modal ·
replace-across-site) · `1205:4804` (modal · import-url) · `1205:4816` (modal · import-url ·
invalid) · `1205:4829` (fullpage · folders · new-folder inline) · `1704:8361` (used-in ·
empty) · `1704:8396` (versions · empty) · `1704:8448` (icon-picker · no-results) ·
`1716:8453` (stock · searching) · `1716:8541` (stock · icons · empty) · `1716:8557` (stock ·
quota-strip) — plus, opened by grep only, never in full: `145:2`, `145:49`, `145:199`,
`145:250`, `145:359`, `453:3931`, `1164:4713`.

**W-A findings inside my section that I did NOT plan** (26 of the 51):

- `W-A-08` bulk bar's Move to… / Delete / Done all dead on `145:300` (only the Cancel half of the confirm is planned)
- `W-A-12` the grid toolbar's view/density/sort/select cluster on all five fullpage boards, where the **one** live node is the sort-direction arrow wired to the list-view board
- `W-A-14` the fullpage upload state has no completion edge (needs an `AFTER_TIMEOUT` reaction, which `add-hotspots` cannot author)
- `W-A-16` / `W-A-46` the picker's Upload, From URL and Optimize tabs have no boards and its tab row is dead
- `W-A-20` the picker's 10 MB vs the product's 50 MB (recorded as an open decision, not drawn)
- `W-A-21` / `W-A-22` the provider switch and the quota strip have no producer (`1716:8557` already marked; `1716:8391`/`8497` not)
- `W-A-23` the details rail draws Edit **and** Rename where the code renders ONE branching button
- `W-A-24` rename is drawn twice and cannot be done once (the drill-in Rename row is planned; the **filename-as-field** half is not)
- `W-A-25` Trash has no board (marked, not built)
- `W-A-26` no post-delete / undo-toast board (so `1175:4838` stays unwired)
- `W-A-28` covered by UX-H-10; `W-A-30` the drawer's *selection-context* screen ("Selecting image for: …") has no board at all
- `W-A-31` / `W-A-32` the replacement-picker step and the replace-across upload-failure arm
- `W-A-34` no video card, no video detail, anywhere
- `W-A-35` `Load more` dead, no page-2 board · `W-A-36` three of four type chips dead
- `W-A-37` the picker's List toggle · `W-A-41` the empty fullpage board contradicts its own state ("24 files" over "0 assets")
- `W-A-42` the pre-upload rejection strip has no board · `W-A-43` **17 boards carry a frame-level catch-all reaction**, which is why the census never saw any of this — my hotspots win over it locally but do not remove it
- `W-A-44` `1704:8514`'s catch-all points at an unreachable board · `W-A-45` the whole fullpage folder rail is dead
- `W-A-47` `Done` on the replace result · `W-A-48` creating a folder has no result state
- `W-A-51` the census still returns nothing for any of the seventeen 280-wide boards

**Arrangement rows `ARR-A-01…08`** (the section is 10 rows with the weight all wrong, the
composite index frame in the middle of the grid-state row, the fullpage family split across
three rows, the stock family split by ~4200px) — **entirely uncovered.** They need
`layout-section.mjs` / `order-sections.mjs`, and re-laying out a 61-child section on top of
11 new boards without being able to read the result back would be the worst possible use of
a blocked quota.

**`verify-invariants.mjs` was NOT run.** Steps 3 and 5 of the plan move and add geometry on
27 boards and step 5 adds 11 more, so loose / oob / overlap / secoverlap / dangling must be
re-checked after applying. Nothing in this report should be read as a claim that the section
is clean.

---

## Files produced

| file | rows | feeds |
|---|---|---|
| `plans/media-00-manifest.json` | — | run order, call budget, what was read live vs offline |
| `plans/media-01-truth-marks.json` | 16 | `apply-truth-marks.mjs` |
| `plans/media-02-text-fixes.json` | 39 | `apply-text-fixes.mjs` — **every row has an `expect` guard** |
| `plans/media-03-hotspots.json` | 46 | `add-hotspots.mjs` |
| `plans/media-04-state-boards.json` | 11 | `add-state-board.mjs`, one invocation per row (`cmd` supplied) |
| `plans/media-05-node-edits.json` | 105 | **`scripts/figma/edit-board-nodes.mjs`** (new) |
| `plans/media-06-post-clone-unresolved.json` | 62 edits + 20 edges | selector-based; targets do not exist until 04/05 have run |
| `plans/media-07-captions.json` | 9 | read-then-append; no `expect` is possible for a `caption/…` node |

**New script: `scripts/figma/edit-board-nodes.mjs`.** Nothing in `scripts/figma/` can add a
node *inside* a board — `apply-text-fixes` rewrites a string that already exists,
`apply-truth-marks` renames a frame, `add-state-board` clones a whole board,
`add-hotspots` drops a transparent rect. Adding a fourth door to a footer, a cancel to an
upload row and a Delete row to an asset's detail hub needs node creation, so this file adds
`clone-label`, `clone-row`, `move`, `resize`, `hide`, `show`, `rename`. Its one design rule:
**new text is always a clone of an existing sibling**, never a fresh TEXT node — because
choosing a font, size, weight and fill by hand is exactly how this file ended up with 920
TEXT nodes under the 11px floor and a 4.1% text-style bind rate (CONF-1-11/13). Nothing in
it deletes; `hide` sets `visible = false`, which a designer can undo in one click. Every op
is read back and diffed after the write.

### The one thing in this pass that *was* verified

The new script was exercised against a mock Figma node graph (clone-label, clone-row, move,
resize, hide, rename, a duplicate-name guard, a missing-node guard, and the read-back diff),
and every op behaved. That is evidence about the **script**, not about the file — no board
was touched. The mock also surfaced a real hazard and it is now guarded: appending a child
to an **auto-layout** parent would ignore `x`/`y` and reflow every sibling, so
`clone-label` / `clone-row` now **refuse** an auto-layout parent (exit 4) unless the row
passes `"strictAbsolute": false`.

Whether the twelve drawer `Footer` frames and thirteen `Folder row` frames are auto-layout is
**unknown** — the offline dump carries no `layoutMode`. Their children sit at arbitrary
absolute x (16, 110, 156, 196), and CONF-1-20 records that 17 of the section's 22 newest
boards use no auto-layout at all, so `NONE` is very likely. If any of them is not, the
refusal will say so on the dry run and the geometry in `media-05` needs re-deriving before
`--apply`. **Dry-run `media-05` first.**
