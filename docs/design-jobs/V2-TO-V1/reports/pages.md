# V2 → V1 · Pages & Routing (`pages`) — report

**Target section:** `1776:8377` "04 · Pages" on page `1:3` (26 children: 17 boards + 9 captions).
**Also in scope, because the module's screens live there:** `302:1978` / `302:2004` /
`302:2026` — the `S3.7 · page-settings` boards in section `1776:8388` "23 · Journeys".
Page settings has no board inside `04 · Pages`; the section holds only its two error
modals (`1706:8505`, `1706:8509`) and the unsaved-warning (`1171:4820`).

**Status of the work: PLAN-COMPLETE, ZERO WRITES APPLIED.** The Figma seat quota was
exhausted account-wide (fifteen agents, one Professional seat) before any write landed.
Every row below that would otherwise be `IMPLEMENTED` is therefore `BLOCKED-ON-QUOTA`,
and the deliverable is a resolved, executable plan rather than a changed file. I stopped
making Figma calls of any kind on the coordinator's instruction and did not probe again.

## What I actually read from the file, versus what I inferred

This distinction is the report's load-bearing content, so it comes first.

**READ from Figma (ids and characters), 2026-09-07:**

| What | Detail |
|---|---|
| `1776:8377` | all 26 children — id, type, name, absolute box |
| `140:2` | **full recursive dump** with absolute boxes for every node. The board sits at abs `100,15970`, so every parent-relative coordinate in my plans for it is exact arithmetic, not a guess. |
| `141:2`, `141:40`, `141:78`, `141:124`, `141:165`, `141:207`, `774:4044`, `782:4212`, `1171:4713`, `1171:4767`, `1717:17217`, `1171:4820`, `1706:8505`, `1706:8509`, `2430:12214` | ids + node names + **every text node's characters**. **No coordinates.** |
| `302:1978`, `302:2004`, `302:2026` | **full dumps with parent-relative coordinates** |
| page `1:3` | every section id + name |
| page `2668:2` | the twelve section ids + names |

**NOT read, and named as such wherever a plan row depends on it:**

- `435:2348` "Pages · page tab bar" — **no child was ever read.** All three rows in
  `pages-nodes-12-tabbar.json` carry `_geometry_source: UNKNOWN`.
- Any **fill colour**, anywhere. `QA-A-33` is therefore planned as `copy-fill` from the
  sibling that is already correct rather than as a hex I would have had to guess.
- Coordinates inside `141:2 / 141:40 / 141:78 / 141:124 / 141:165 / 141:207 / 1171:4713 /
  1171:4767 / 1717:17217 / 1171:4820 / 2430:12214`.
- **The V2 boards themselves.** Every V2 claim below is read from the **generator**,
  `scripts/figma/build-proposal-page.mjs` and `scripts/figma/build-polished-panels.mjs`,
  which is the source page `2668:2` was built from — not from the boards. A write is not
  verified by the write, so treat the V2 halves of this report as unverified against the
  file.
- `verify-invariants.mjs` — **not run.** It is a Figma call.

**Inferred, and flagged in the plan rows themselves:** row geometry on `141:78`,
`1171:4713`, `1171:4767` (assumed to mirror `140:2`, which they are clones of); the free
band at rel y ≈ 500–670 on every 280×812 board (measured on `140:2` only); the Structure
tree's 30px row pitch (derived from `QA-A-27`'s own "rows at y 115..325" over eight rows —
the **x** values in that plan are QA-A-27's measurements and are not inferred).

---

## The board question `PHASE4-QA-REPORT` §8 could not settle — settled

`FIG-CO-20` says *"the Figma boards draw a Draft badge"*. `SPEC-PAGES-PANEL` §3 says
*"Board 140:2 draws rows with no chips"*.

**`SPEC-PAGES-PANEL` is right.** Full dump of `140:2`: the six rows are
`140:11 / 140:17 / 140:22 / 140:25 / 140:28 / 140:34`, and between them they hold a
checkbox instance, a disclosure triangle, a folder glyph, a name, a folder count, one
`⌂` home glyph (`140:19`) and one `dirty` ellipse (`140:21`). **No chip, no badge, no
status word, on any row, on any of the seven boards that draw page rows.** `FIG-CO-20`'s
`edit` note is wrong about the boards in the same way its own `truth` field admits it was
wrong about the panel.

So the board-amendment request `SPEC-PAGES-PANEL` files is real, and it is the centre of
this job: **the row has no publication signal at all, and the one the code computes is
spent on an `aria-label`.**

## One finding is stale at HEAD, and it is the module's headline Critical

`UX-B-01` rests on `usePages.ts:120` mapping unset visibility to `"draft"`. **At HEAD it
maps to `"live"`** — `usePages.ts:127`:

```
status: (p.settings?.visibility as PageItem["status"]) ?? "live",
```

with a 12-line comment above it that names the defect, names `CAN-013`, and says *"The
result was a page the panel called 'Draft', in its chip and in PageRow's aria-label, that
publishing shipped."* The display default now agrees with `isPageLive`. What still stands
is the half `SPEC-PAGES-PANEL` sharpened: **a sighted user gets no publication signal
whatsoever**, and `AdvancedTab.tsx:24` still offers only `["live","hidden","password"]`,
so Draft is still unreachable. The design fix is unchanged; the code citation is not.

A second stale marker, in my own section: two hotspots
(`787:4307` on `140:2`, `1171:4803` on `1171:4767`) are named
*"CUT 2026-09-02 (Pages · loading RETIRED, no producer)"*. **The loading state has a
producer** — `PageList.tsx:123` renders `PagesLoadingSkeleton` and its own comment at
`:118-122` records the door being added. The third copy of that hotspot
(`1171:4749`) was never cut, so the file already contradicted itself.

## Where V2 and `SPEC-PAGES-PANEL` disagree — and which I drew

`build-polished-panels.mjs` draws the V2 corrected Pages panel as **40px rows** carrying a
slug on a second line and a **coloured status pill on every row** (`HOME` accent, `LIVE`
green, `DRAFT` amber, `HIDDEN` grey), plus a **380-wide** delete confirm.

`SPEC-PAGES-PANEL` — later, and the document the brief points me at — says **32px rows**
(`PagesTab.css:13-14`, board `140:2`, pinned by `PagesTab.rowHeight.test.ts`), **no chip
system** (*"`.bd-pg-chip` and its seven colours stay dead"*), **silence as the default**
(*"a page that will publish says nothing"*), and a **420** confirm.

I drew the spec: **32px rows, one muted word in the existing right-hand slot, only on the
exception.** Three reasons. The row height is pinned by a test and by the board the
precedence rule makes authoritative. A label on every row is the noise the spec argues
against. And the pill set is exactly the seven-colour chip system the spec deletes.

On the confirm width I drew **neither**: `PHASE4-QA-REPORT` §2.4 is right that 420 and 380
are both fresh literals at fresh call sites, so I clone the **440** modal (`1171:4820`),
which is `SPEC-NAVIGATION`'s `modal-sm` class.

**Open decision filed, not resolved** (per the brief): the expanded drawer is drawn at
**700**, which is what `LeftSidebar.tsx:586-587` does and what V2's own §11 rules table
records (`Drawer (expanded) 700, runtime override, hard-coded`). `SPEC-NAVIGATION` §5.2
proposes 560. Filed onto the section name (`pages-truth-10.json`) and onto `141:207`
(`pages-nodes-06-annotations.json`), in the file's own convention for an open question —
compare section `1779:3`'s name.

---

## Finding table

`BLOCKED-ON-QUOTA` means the plan row is written and resolved but no write landed.
**Nothing is marked `IMPLEMENTED`, because nothing was read back** — and no row came back
`ALREADY-CORRECT` either: on every one of the thirty-three findings the board needed
something it did not have.

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-B-01** Critical | Badge the row from the predicate the deploy uses; say "Will publish" rather than inventing a Draft | `140:2`, `141:78`, `1171:4713`, `1171:4767` | `pages-nodes-02-tree.json` + `-04-siblings`: `pub/state` text in the right-hand slot on the Contact row ("Draft") and the About row ("Won't publish"); default rows stay silent | **read**: `140:2` dump shows no chip on any of `140:11/17/22/25/28/34`; row `140:25` is abs `100,16146 280x32` | BLOCKED-ON-QUOTA |
| **UX-B-02** Critical | Add Draft as a first-class visibility, or delete the statuses nothing writes | `302:2026` | `-03-settings`: a four-option visibility control (`Will publish` selected · `Draft` · `Hidden` · `Password`) at card `28,344`, plus `note/UX-B-02` | **read**: `302:2026`'s body `302:2034` draws `Custom <head> code`, `Password protect`, `Canonical URL` — **there is no visibility control on the board at all** | BLOCKED-ON-QUOTA |
| **UX-B-03** Critical | Seed visibility as unset; persist only when the Advanced control is used | `302:2026` | `-03-settings`: the default segment reads **Will publish**, helper says "nothing is stored until you choose otherwise"; `note/UX-B-03` | **read**: as above | BLOCKED-ON-QUOTA |
| **UX-B-04** Critical | Count inbound links before the dialog; leave them broken, not re-pointed | **no delete-confirm board exists** | `pages-boards-07-new.sh` clones `1171:4820` → "Pages · delete-page · confirm · inbound links", wired from `1171:4765` (mi/Delete page); `-08-newboards` sets the copy and the links box | **read**: section `1776:8377`'s 26 children contain no delete confirm; `1171:4820` is 440×117 | BLOCKED-ON-QUOTA |
| **UX-B-05** Critical | Flag the first page as home, or mark the positional homepage | `140:2` → new board | `-07-new.sh` clones `140:2` → "Pages · tree · homepage by position"; `-08-newboards` puts `Homepage (by position)` in the Home row's right slot + `note/UX-B-05` | **read**: `140:2`'s Home row `140:17` carries `⌂` (`140:19`) and a dirty dot (`140:21`) and nothing about position | BLOCKED-ON-QUOTA |
| **UX-B-10** Critical | Do not autosave into a known-invalid state; no toast | `302:1978` | `-03-settings`: `note/UX-B-10` below the card | **read**: `302:1978`'s card and body measured | BLOCKED-ON-QUOTA |
| **UX-B-13** Critical | Route `addPage` through the uniqueness helpers | `140:2` | `-06-annotations`: `note/UX-B-13` at rel y 512 | **read**: `140:2` Add page frame `140:38` at rel `0,712`; free band 380–670 | BLOCKED-ON-QUOTA |
| **UX-B-32** Critical | Generate nav from the page list, or show which pages nothing links to | `140:2` | `-06-annotations`: `note/UX-B-32` states what Pages owns ("show in nav", the unlinked-page view) and hands the editor to the navbar element, per `SPEC-PAGES-PANEL` §5 | **read**: free band on `140:2` | BLOCKED-ON-QUOTA |
| **UX-B-06** Major | Draw the insertion line at the computed drop position | new board from `140:2` | `-07-new.sh` clone + `-08`: `drag/indicator` 248×2 accent at rel y **79**, `drag/lifted-row` over the About row | **read**: Row · Marketing begins at rel y 80, so 79 is the line above the first row | BLOCKED-ON-QUOTA |
| **UX-B-07** Major | Make the drop position depend on the pointer's half of the row | same board | same rows; the line is drawn **above the first row**, which is the state today's code cannot reach | **read**: as above | BLOCKED-ON-QUOTA |
| **UX-B-08** Major | Offer the matching slug at rename | `1717:17217` → new board | `-07-new.sh` clones it → "Pages · rename · URL offer"; `-08-newboards` replaces the conflict line with the offer | **read**: `1717:17229` holds "A page with this name already exists"; **coordinates unknown** | BLOCKED-ON-QUOTA · geometry unresolved |
| **UX-B-09** Major | Write the slug the popover promises, or stop drawing it | `435:2348`, and the new rename board | `-12-tabbar` `note/UX-B-09`; `-08-newboards` `rename/annotation` | **read**: `435:2348` exists, 1080×920 at abs `500,1334`. **No child of it was ever read** | BLOCKED-ON-QUOTA · geometry unknown |
| **UX-B-11** Major | One toast for one user action | `141:78` → new board | `-06` `note/UX-B-11` on `141:78`; `-07-new.sh` clone → "Pages · bulk · one toast per action"; `-08-newboards` draws "3 pages deleted · Undo" | **read**: `141:78`'s bulk bar `141:119` holds "3 selected / Duplicate / Move to… / Delete"; **no coordinates** | BLOCKED-ON-QUOTA |
| **UX-B-12** Major | Toast the count, select the copies, scroll the first into view | same new board | `-08-newboards` `note/UX-B-12` | as above | BLOCKED-ON-QUOTA |
| **UX-B-14** Major | Give the modal a labelled exit | `302:1978`, `302:2004`, `302:2026` | `-03-settings`: `✕` in each header at `536,24` **and** a `Done` button at card `468,470` on all three | **read**: all three headers are 580×74 holding only a title and the tab strip — **no close control on any of them**. And `PageSettingsDrawer.tsx:9` cites *board 302:1980* as the reason there is no ✕, so this board amendment is the exact thing the code is waiting on | BLOCKED-ON-QUOTA |
| **UX-B-15** Major | One page-actions menu, used by both surfaces | `435:2348`, `1171:4713` | `-12-tabbar` `note/UX-B-15` naming the three drifts (hidden-vs-disabled Delete, the missing external guard, two delete copies) | **read**: `1171:4713`'s menu is `Rename… / Duplicate / Set as homepage / Copy link / Page settings… / Delete page`. The tab bar's menu was **not read** | BLOCKED-ON-QUOTA · geometry unknown |
| **UX-B-16** Major | Replace the copy with "Add a 301 from /old to /new" | `302:1978` | `-03-settings`: `row/redirect` wash panel + body + `Add redirect` action at card `28,400` | **read**: `302:1978`'s body ends at card y 388, leaving 132px — the row fits without moving a field | BLOCKED-ON-QUOTA |
| **UX-B-17** Major | Persist folders or label them as a private view; confirm the delete | `140:2`, `141:2` | `-02-tree`: "Folders are yours only, on this browser." at rel `16,282`; `-06`: `note/UX-B-17-delete` on `141:2` | **read**: `140:2`'s spacer `140:37` runs rel y 272–712 | BLOCKED-ON-QUOTA |
| **UX-B-18** Major | Dropping a folder child out removes it; on a sibling reorders | `141:2` | `-06`: `note/UX-B-18` | **read**: `141:2` is 280×812 and draws two collapsed folders | BLOCKED-ON-QUOTA |
| **UX-B-19** Major | One score, one definition | `141:207` | `-06`: `note/UX-B-19` | **read**: `141:207` draws `PAGE / TITLE / DESC / SCORE` with 92 / 78 / 41 | BLOCKED-ON-QUOTA |
| **UX-B-20** Major | Expand, do not toggle; hide the link at full width | `141:207` | `-06`: `note/UX-B-20`, plus the 700-vs-560 open decision beside it | **read**: `141:265`/`141:266` "Open full listings ›" | BLOCKED-ON-QUOTA |
| **UX-B-21** Major | Put the media library behind the field, with upload and a failed state | `302:2004` | `-03-settings`: `Choose from library` + `Upload` buttons at card `28,322` / `204,322`, and `note/og-image-failed` | **read**: `302:2021` "OG image" group is an Input row only, body ends at card y 310 | BLOCKED-ON-QUOTA |
| **UX-B-22** Major | Show the derived title as a placeholder; persist only what was typed | `302:1978` | `-03-settings`: `note/UX-B-22` | **read**: `302:1991` "Meta title" holds "Bella Cucina — Wood-fired pizza" as a value | BLOCKED-ON-QUOTA |
| **UX-B-23** Major | Merge the SEO object; give the six orphan fields an input or a deletion | `302:2026` | `-03-settings`: `note/UX-B-23` | **read**: `302:2043`/`343:2320` — **the Advanced board already draws `Canonical URL`**, a field the product renders nowhere. The board is already asking for the input; what it cannot show is the silent deletion | BLOCKED-ON-QUOTA |
| **UX-B-24** Major | One sentence per option | `302:2026` | `-03-settings`: `note/visibility-helper` — one sentence, attached to the selected option | **read**: the board draws **no** visibility helper at all, so there is no contradicting pair to delete on the board; the contradiction is `AdvancedTab.tsx:49-56` vs `:57-61` | BLOCKED-ON-QUOTA |
| **UX-B-25** Major | List generated routes as a read-only group; mark the template page | `140:2` | `-02-tree`: rule + `▾ FROM BLOG` + count `12` + `ⓘ` + `/blog/{slug} · template: Blog post` + `read-only` + closing rule, rel y 306–361 | **read**: `140:2` rows end at rel 272; spacer to 712 | BLOCKED-ON-QUOTA |
| **UX-B-26** Major | One ⌘K, scoped to pages | `1171:4767` | `-04-siblings`: `note/UX-B-26` | **read**: `1171:4807` palette with input "go to page…" and four rows | BLOCKED-ON-QUOTA |
| **UX-B-27** Major | Say "these pages are local only"; hold editing back | `141:124`, `141:165` → new board | `-07-new.sh` clones `141:124` → "Pages · local-only · project load failed"; `-08-newboards` rewrites the copy; `-06` scopes the two existing boards | **read**: `141:163` "This site has one page."; `141:204` "Couldn't load your pages." / `141:205` "The site is fine — this panel isn't." — the second is the *panel-threw* case, not the network one | BLOCKED-ON-QUOTA |
| **UX-B-28** Major | Clear the selection on page activation and on delete | `435:2348` | `-12-tabbar`: `note/UX-B-28` | **read**: board exists; children not read | BLOCKED-ON-QUOTA · geometry unknown |
| **UX-B-31** Major | Keep deleted pages recoverable independently of undo | new delete-confirm board | `-08`: the dialog's undo line is corrected to "Undo (⌘Z) brings it back — for the very next action only", rather than drawing a trash `SPEC-PAGES-PANEL` §5 rules out | — | BLOCKED-ON-QUOTA · **partially NOT-APPLICABLE**: the spec puts recently-deleted outside this panel (a history-model decision, one editor-wide stack). What Pages can honestly do is stop over-promising, which is what is planned |
| **UX-B-29** Minor | Bind the row actions; print the chords on the menu | `1171:4713` | `-04-siblings`: `F2` / `⌘D` / `⌫` right-aligned in the three menu items, plus `note/UX-B-29` marking that only F2 is bound today | **read**: `1171:4754/4756/4765` are the mi/ frames; **their widths were not read**, so the chord x is inferred | BLOCKED-ON-QUOTA · geometry inferred |
| **UX-B-30** Minor | Make the two tabs behave the same way | `302:2004` | `-03-settings`: `12/60` and `28/160` counters on the OG title and description rows + `note/UX-B-30` | **read**: `302:2013` / `302:2017` groups measured; neither drew a counter | BLOCKED-ON-QUOTA |
| **UX-B-33** Minor | Carry the row actions into Structure; let "(no page)" create one | `2430:12214` | `pages-text-01.json` fixes the legal row's label/path split; `-05-structure` adds a `⋯` per page row, `+ Create page` on the legal row, and `note/UX-B-33` | **read**: all sixteen row/path text nodes and their strings | BLOCKED-ON-QUOTA · row **y** inferred from QA-A-27's 115–325 span |
| **UX-B-34** — | module summary, no fix field | — | no action; its thesis is what the whole plan set answers | — | NOT-APPLICABLE (summary row) |

### Board-level rows inside `1776:8377`

| id | action | evidence | status |
|---|---|---|---|
| **QA-A-26** | `pages-text-01.json`: "5 pages, by route." → "7 pages, by route." | **read**: `2430:21523` holds "5 pages, by route." and the board draws seven pages plus one inferred segment | BLOCKED-ON-QUOTA |
| **QA-A-27** | `-05-structure`: seven single-axis `move` ops (Menu/legal/Contact → x 30; the four leaves → x 44; Home stays 16) | x values are **QA-A-27's own measurement**; ids read | BLOCKED-ON-QUOTA |
| **QA-A-28** | `pages-text-01.json`: label → "▾ legal/ (no page)", mono path → "/legal" | **read**: `2430:21532` = "▾  legal/", `2430:21533` = "(no page)" | BLOCKED-ON-QUOTA |
| **QA-A-32** | **not changed** — filed as an open decision on the section name | **read**: `2433:11972` = "⚂ Structure" (U+2682); `PageList.tsx:202` ships `⑂`. QA-A-27's own fix says "adjudicate… this needs to be a decision, not a silent divergence" | OPEN DECISION FILED (in `pages-truth-10.json`) |
| **QA-A-33** | `-02-tree`: `copy-fill` `2433:11972` ← `140:10` | **read**: both are siblings in `140:7`; I never read a fill, which is why this is a copy and not a hex | BLOCKED-ON-QUOTA |
| **stale CUT markers** | `pages-truth-10.json`: rename `787:4307` and `1171:4803` back to "hotspot/state · Pages · loading"; `pages-hotspots-11.json` re-wires both to `774:4044` | **read**: both names; **code**: `PageList.tsx:118-123` gives the skeleton its door | BLOCKED-ON-QUOTA |
| **ARR-A-13/14/15/16/34** | **not actioned** — see "not covered" below | — | NOT COVERED |

---

## The plan set, and the order it must run in

Eleven files in `docs/design-jobs/V2-TO-V1/plans/`, plus one shell script that carries
the run order. **Every applier already existed** — `apply-text-fixes.mjs`,
`edit-board-nodes.mjs`, `add-state-board.mjs`, `resolve-selectors.mjs`,
`apply-truth-marks.mjs`, `add-hotspots.mjs`. I started writing a fourth applier of my own
before `edit-board-nodes.mjs` appeared in the tree and **deleted it unrun**: it did the
same job, and worse — it created text nodes with a hand-chosen font, size and fill, which
is exactly what `edit-board-nodes.mjs`'s "new text is always a clone of an existing
sibling" rule exists to stop. Every new node in these plans is now a clone of a named
source whose style is already right on that board.

| file | applier | rows | geometry |
|---|---|---|---|
| `pages-text-01.json` | `apply-text-fixes` | 3 | ids read; `expect` guard on all three |
| `pages-nodes-02-tree.json` | `edit-board-nodes` | 12 | **measured** — `140:2` was dumped with absolute boxes |
| `pages-nodes-03-settings.json` | `edit-board-nodes` | 26 | **measured** — the three `S3.7` boards were dumped parent-relative |
| `pages-nodes-04-siblings.json` | `edit-board-nodes` | 11 | ids read, coordinates assumed to mirror `140:2` |
| `pages-nodes-05-structure.json` | `edit-board-nodes` | 16 | 7 `move`s use QA-A-27's own x measurements; the 9 adds infer a 30px row pitch |
| `pages-nodes-06-annotations.json` | `edit-board-nodes` | 8 | free-band placement inferred from `140:2` |
| `pages-boards-07-new.sh` | `add-state-board` ×6 | 6 boards | source ids read; carries the 15-step run order |
| `pages-text-08-newboards.json` | `resolve-selectors` → `apply-text-fixes` | 8 | selector rows; the clones' inherited strings are exact, so every `equals` is exact |
| `pages-nodes-08-newboards.json` | `resolve-selectors` → `edit-board-nodes` | 8 | selector rows carrying `_resolve_into` |
| `pages-nodes-09-doors.json` | `edit-board-nodes` | 6 | measured; six labelled hotspot chips cloned from `1720:17466` |
| `pages-truth-10.json` | `apply-truth-marks` | 3 | ids read; the section-count row must be re-derived after the clones |
| `pages-hotspots-11.json` | `add-hotspots` | 8 | 2 rows fully resolved; 6 wait on the new board ids |
| `pages-nodes-12-tabbar.json` | `edit-board-nodes` | 3 | **board id read, children never read** — read it before applying |

The order matters in one place: the six clones are taken **after** the `140:2` edits, so
the state boards inherit the corrected publication word and the FROM BLOG group and cannot
drift from the root board the moment they are made — and **before** the door chips, so
they do not inherit those and their reactions.

### Style sources, so the clones are checkable

| new node | cloned from | why that one |
|---|---|---|
| the publication word, counts, chords, `⋯` | `140:16` (the folder count "3") | the 11px muted caption already on a row |
| every `note/*` paragraph | `1717:17234` | the file's own annotation type, on a Pages board |
| the Structure note | `2430:21540` | that board's own annotation |
| `▾ FROM BLOG` | `140:15` ("Marketing") | a row label |
| the two hairline rules and the drop indicator | `1717:17220` (`rule`) | **arrives border-grey; the indicator's fill must be set to the accent by hand** |
| the `✕` on all three settings headers | `1706:8508` | the ✕ the save-failed sibling already draws |
| `Done`, the four visibility segments, the two media buttons | `1171:4825` / `1171:4827` | the secondary and primary buttons on the same modal family |
| the accent actions (`Add redirect`, `+ Create page`) | `2433:11972` | the one accent text in the section |
| the six door chips | `1720:17466` | the labelled hotspot chip `140:2` already carries |
| the `Structure` link's replacement ink | `140:10` (`⊞ Listings`) | QA-A-33's own remedy, and it needs no hex — I never read a fill |

## What I did NOT cover

Stated plainly, because six of eighteen is six.

1. **No write of any kind landed.** Not one. Every "action taken" above is a plan file.
2. **`verify-invariants.mjs` was not run.** It is a Figma call and the quota is gone. The
   plans introduce six clones, 84 cloned child nodes, seven single-axis `move`s, one
   `resize` and one `hide`, so `loose`, `oob`, `overlap` and `dangling` are all genuinely
   unknown afterwards. Run it at step 15. `CONF-1-14`'s CHILD-child overlaps are not
   something it checks at all — see item 9.
3. **`435:2348` was never opened.** It is 1080×920 and holds the whole canvas page-tab-bar
   family. `UX-B-09`, `UX-B-15` and `UX-B-28` all land there and all three plan rows carry
   `_geometry_source: UNKNOWN`. This is the single largest hole in the plan.
4. **The V2 boards were never opened.** I read the generators instead. If `2668:2` drifted
   from `build-proposal-page.mjs` / `build-polished-panels.mjs`, my V2-vs-spec conflict
   analysis is analysing the script, not the board.
5. **`ARR-A-13 / 14 / 15 / 16 / 34`** — the five arrangement findings for this section
   (the 1080×920 board opening a hole in the drawer row, the split page-settings modal
   family, overlays before states, the retired board inside the live row, three thin modal
   rows). Not planned. They want `layout-section.mjs`, and re-laying out a section while
   six new boards are pending would have to be redone anyway. **Do the arrangement pass
   after the six clones land, not before.**
6. **`CONF-1-14`** — the 11/15 leading that recurs across the section, including 8 nodes on
   `2430:12214`. Not planned. My new text is all 11/16 (on-ramp), so the plan does not make
   it worse; it does not fix the existing population either.
7. **No screenshot comparison.** The founder's acceptance for this arc is board screenshot
   vs live screenshot side by side. I did neither, for the same reason.
8. **`141:40` (searching) and `782:4212` (no-results)** carry no publication word in the
   plan — they draw one row and zero rows respectively, so the `UX-B-01` treatment has
   nothing to attach to. That is a decision, not an oversight, but it means two of the
   seven row-drawing boards are untouched by the module's headline fix.
9. **Child-child overlap is unchecked by anything.** `verify-invariants.mjs` reports
   loose nodes, out-of-bounds children, board-board and section-section overlap — not two
   siblings covering each other. The door chips at rel 400–608 and the two notes at 640
   and 700 on `140:2` were laid out by hand against a read of that board, and nothing will
   catch it if I got them wrong. The same applies to every `_geometry_source: INFERRED` row.
10. **The three notes for `435:2348` are placed blind** at rel y 740 / 800 / 860 on a
   920-tall board. That keeps them inside the frame, which is all I can guarantee; whether
   that band is empty is unknown, so they may land on top of the drawing.
11. **`1706:8505` / `1706:8509`** (page-settings save-failed and crash) were read and left
   alone. They already draw a `✕`, which is what made the missing one on `302:1980` visible.
