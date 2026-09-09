# V2 → V1 — module `insert` (insert-elements)

**Agent:** insert-elements · **Date:** 2026-09-07
**Target sections:** `1776:8379` "02 · Insert · 22" · `1090:4527` "26 · REVIEW · Insert · 3"
**Source slice:** `docs/design-jobs/V2-TO-V1/slices/insert.json` — 32 UX findings + 1 module summary.

---

## Headline: zero writes landed. This is a plan, and it says so.

The Figma MCP seat quota was exhausted account-wide part-way through the pass and
the coordinator issued a hard stop. **No board was renamed, no string was set, no
board was cloned, no hotspot was placed, and `verify-invariants.mjs` was NOT run.**
Nothing below is marked `IMPLEMENTED`, because nothing was read back — and this
repo has reported success on a dead POST before.

What did land is six applyable plan files. Everything in them is resolved to a real
node id where I read one from the file, and marked `unresolved-id` with a resolvable
selector where I did not.

### The three reads I actually got — these are measurements, everything else is inference

| # | Call | What it returned |
|---|---|---|
| 1 | children of `1776:8379` | 13 board FRAMEs + 9 caption TEXT nodes, with id, name, x, y, w, h for each. Section box `x0 y7053 2480x3747`. |
| 2 | children of `1090:4527` | `1069:4790` and `1069:4970` (both 280x812 at y220) + label TEXT `1092:4527` @ (100,1152 151x34). Section box `x0 y150967 1200x1326`. |
| 3 | **full node tree of `137:2` `Insert · default`** | Every descendant with id, type, geometry and `characters`. This is the only board whose interior I have. |

Every id and quoted string in this report and in the plans that is attributed to
"read from file" comes from one of those three calls. **The interiors of the other
14 boards were never opened.** Where a plan row needs one of their node ids, it
carries `"unresolved-id": true` and a selector (board id + board name + the text to
match + the structural hint from `137:2`, which is the same 280x812 panel).

---

## Verified board facts (read-back, call 3)

`137:2` `Insert · default`, 280x812, in layout order:

```
207:2   INSTANCE Panel header  (0,44)     I207:2;16:7 TEXT "Insert"
137:7   FRAME Search  (0,44 280x36)
  137:8  search box (16,4 248x28)   137:9 TEXT "Search elements"   137:10 TEXT "⌘F"
137:11  Group header · ELEMENTS   (0,80)   137:12 "▾"  137:13 "ELEMENTS"  137:14 "53"
233:1108 / 233:1113 / 233:1118  List row   "Heading" / "Text" / "Link"
137:24  Group header · BLOCKS     (0,208)  137:25 "▸"  137:26 "BLOCKS"      137:27 "50"
137:28  Group header · COMPONENTS (0,240)  137:29 "▸"  137:30 "COMPONENTS"  137:31 "14"
137:36  Group header · MINE       (0,272)  137:37 "▸"  137:38 "MINE"        137:39 "4"
137:40  spacer (0,304 280x400)
233:1123 List row  "⌥  Paste HTML…"  (0,704)
137:43  TipsFooter (0,736 280x40)   137:44 "💡  Tip 2/4"   137:45 "‹  ›  ✕"
```

Three things that follow, and they matter:

1. **`137:2` carries no `TEMPLATES | 10` group.** D-A-01 says "both expanded boards"
   carry it — those are `1069:4529` and `1069:4707`, which I never opened. The
   default board is clean, and its four headers (`ELEMENTS 53 · BLOCKS 50 ·
   COMPONENTS 14 · MINE 4`) match `buildInsertGroups()` and the founder-final
   taxonomy at `blocks/groups.ts:1-19` exactly.
2. **`137:2` carries no RECENT band.** Consistent with `PHASE4-QA-REPORT` §1.1 —
   recents are not built, only the orphan key `BUILD_RECENT`. No plan of mine draws one.
3. **Seven hotspots overlap on `137:2`.** `787:4303` at (120,778 160x34) contains six
   more at exactly (130,784 150x28). Only the topmost is clickable — six dead edges.
   Filed as `INS-DEF-01` in `plans/insert-board-defects.json`; it is board-level, not
   one of my 32, but nobody else has this read.

---

## One row per finding

Status key — `PLANNED` = design decision made, plan row written, **no write attempted**;
`BLOCKED-ON-QUOTA` = the write was in flight or next when the stop landed;
`NOT-APPLICABLE` = no board in my two sections can carry it;
`ALREADY-CORRECT` = proved by a read-back quoted here.
No row is `IMPLEMENTED`. Nothing was read back after a write, because there were no writes.

| V2 finding | recommendation | affected V1 board(s) | action taken (plan row) | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-A-01** `Critical` drop reports success, places nothing | make `dropSucceeded` reflect the handler; a no-op drop must say "couldn't place that" | `138:153` (id read) + **new** `Insert · drop-refused` | `insert-truth-marks.json[0]` marks `138:153` `[not-implemented] the drop it promises`, citing `useDropExecution.ts:302-303`. `insert-new-boards.json[2]` clones `138:153` into the refusal state: red rule replaces the accent indicator, refusal chip at the cursor. `insert-text-fixes.json` `155:15` states it. | `138:153` name read: `"Insert · dragging — CONDITION-ONLY — leaves on drop/dragend, no control (GroupSection.tsx:189-190; ELEMENTS rows only)"` — carries no drop claim today | **BLOCKED-ON-QUOTA** |
| **UX-A-02** `Critical` picker toasts before it inserts | success after the insert returns an id; refusal keeps the modal open with the contextual reason | `1706:8501` (id read) + **new** `Modal · Add Child Element · refused` | `insert-truth-marks.json[2]`; `insert-new-boards.json[1]` adds the inline error band `"Can't add Button — a heading doesn't take children. Select a container first."` and removes the success toast on that branch | `1706:8501` name read: `"Modal · Add Child Element"`, `380x225 @ (100,2340)` | **BLOCKED-ON-QUOTA** |
| **UX-A-05** `Critical` BLOCKS is 50 blank grey rectangles | give every block a preview, **or** drop the grid and show rows | `1069:4707` (id read) + **new** `Insert · blocks-expanded · rows` | **Decision: stop promising pictures.** `1069:4707` is truth-marked DESIGN-AHEAD (kept, not deleted); `insert-new-boards.json[0]` clones `1069:4529` into a rows board, header `BLOCKS 50`, 14 sample rows in registry order incl. Hero Section / Features (the two with no element row) and two ecommerce rows carrying a `Needs a collection` badge | `1069:4707` name read: `"Insert · blocks-expanded"`, `280x812 @ (500,220)`. Code read: `grep -rn preview packages/editor/src/blocks/` → 0 hits; `shared/types/block.ts:25` declares it | **BLOCKED-ON-QUOTA** |
| **UX-A-03** `Major` three insert surfaces, three catalogs | one catalog, one picker, all three doors | `1706:8501`; cross-module (Canvas toolbar, context menu) | Recorded as **open decision 5** on the new `note/Insert · OPEN DECISIONS` frame (`insert-decision-note.json`) rather than silently redrawn — it spans three modules. Stated on `1706:8501`'s name and its new caption. | — | **PLANNED (open decision)** |
| **UX-A-04** `Major` ELEMENTS repeats 53 things below itself | make ELEMENTS and BLOCKS disjoint | `137:2`, `1069:4529`, `1069:4707` | Taxonomy change **against founder-final** `blocks/groups.ts:1-19` → **open decision 3**, not applied. The duplication is stated instead, in caption `155:11`: "40 of the 50 BLOCKS and 13 of the 14 COMPONENTS also have an ELEMENTS row" | `137:2` headers read: `ELEMENTS 53 · BLOCKS 50 · COMPONENTS 14 · MINE 4` — the counts are honest, the overlap is what is unsaid | **PLANNED (open decision + caption)** |
| **UX-A-06** `Major` only 53 of ~117 offerings drag | everything draggable, or nothing claims to be | `1069:4707`, `1069:4790`, `1069:4970`, caption `155:12` | Stated on all three board names (`insert-truth-marks.json` rows 1, 3, 4) and caption `155:12`. A drag handle on hover is specced on the rows board; the affordance change itself waits on `GroupSection.tsx:206-262` | `1069:4790` / `1069:4970` names read: `"Insert · components-expanded"` / `"Insert · mine-expanded"` | **BLOCKED-ON-QUOTA** |
| **UX-A-07** `Major` onboarding points at a collapsed, undraggable group | promote section blocks into the first screenful, or rewrite the step | `137:2`, `1069:4707` | Both routes cost the founder-final taxonomy or the step copy → **open decision 6**. Partial mitigation applied in the plan: the new rows board's sample list leads with `Section · Hero Section · Features · Footer · Navbar · Call to Action`, so the boarded BLOCKS list at least *shows* what the step names | `137:2` read: BLOCKS header chevron is `"▸"` (closed) — the finding's premise verified on the board | **PLANNED (open decision)** |
| **UX-A-08** `Major` open/closed state resets every visit | persist the open set + scroll, keyed like the dead `openCats` | `137:2` caption `155:11` | Caption row written: "…component-local state and TabRouter unmounts the tab, so leaving Insert and coming back re-collapses all three and resets the scroll to the top of 53 rows" | `155:11` id + box read `(100,1052 280x54)`; **its current characters were never read** — the row carries no `expect` guard and says so | **BLOCKED-ON-QUOTA** |
| **UX-A-09** `Major` 53 written descriptions never render | show on hover | **new** `Insert · element-hover (description)` from `1069:4529` | `insert-new-boards.json[5]`: hover row on `--bk-bg-subtle` + the dark Tooltip carrying `"Swipeable image or content carousel"`, matching `138:198`'s disabled-reason tooltip style | `1069:4529` id + box read `(1300,220 280x812)`; interior never opened | **BLOCKED-ON-QUOTA** |
| **UX-A-10** `Major` the "Soon" state is unreachable; 11 blocks have no row | list the 11 with the Soon treatment | `138:198` + caption `155:16` | Caption rewritten to name all eleven — hero, features, text, row, column, columns3, contact-form, product-card, product-grid, product-detail, cart-button — and to keep QA-C-12's correction (no 45% dim was ever built) | `138:198` name read back **already correct**: `"Insert · disabled-item — BUILT, MOUNTED NOWHERE. The earlier \"RETIRED (no producer)\" was wrong…"` — QA-B-22 has landed on the board name | **PARTLY ALREADY-CORRECT** (board name) / **BLOCKED-ON-QUOTA** (caption) |
| **UX-A-11** `Major` search never covers MINE | index MINE with its own source tag | `138:53`, `1069:4970`, caption `155:13` | `1069:4970` truth-marked `[not-implemented] finding one of these by name`; caption `155:13` written; a MINE-tagged hit row is specced on `138:53` **with the dependency marker**, per the brief's rule 4 | `1069:4970` name read: `"Insert · mine-expanded"` | **BLOCKED-ON-QUOTA** |
| **UX-A-12** `Major` no way to clear a search that returned wrong hits | a clear control whenever the field has text | `138:53`, `138:106`, caption `155:13`/`155:14` | **Decision: the ⌘F hint becomes ✕ on the searching state, and only there.** `137:2` keeps `⌘F` because its field is empty — that is the code's honest `kbdHint` contract. Row is `insert-text-fixes-unresolved.json[0]` with `expect: "⌘F"` | `137:2`'s equivalent node read exactly: TEXT `137:10` `"⌘F"` @ (218,7 16x16) inside `137:8`. `138:53`'s own node id was never read | **BLOCKED-ON-QUOTA (unresolved-id)** |
| **UX-A-14** `Major` a pager over invisible text; 2 of 4 tips stale | show the tip text, or remove the carousel; rewrite the two stale tips | `137:2` (**resolved**) + 11 sibling boards (unresolved) + caption `155:17` | **Decision: show it.** `insert-geometry.json[0]` turns the 40px strip into a 48px two-line strip — new `tip-body` TEXT at (16,8 248x16) `"Press / to search. Esc or ✕ clears."`, `137:44` and `137:45` drop to y=28, `137:43` h 40→48. The board is 812 tall and the strip ends at 776, so 48 fits without moving anything. All four corrected tip bodies are in the plan and in caption `155:17` | Resolved from call 3: `137:43 (0,736 280x40)`, `137:44 "💡  Tip 2/4" (16,12 60x18)`, `137:45 "‹  ›  ✕" (212,12 33x18)`. **Verified against code: `catalog/tips.ts` holds FOUR tips, not five — W-J-12 is stale, UX-A-14 is right** | **BLOCKED-ON-QUOTA** |
| **UX-A-15** `Major` dismissal is permanent and the promised Help does not exist | give Insert the Help entry, or make dismissal per-session and say so | `138:244` + caption `155:17` | Both routes are live → **open decision 7**. Caption `155:17` states the whole falsehood with its four citations | `138:244` id + box read `(100,1262 280x812)`; interior never opened | **PLANNED (open decision + caption)** |
| **UX-A-17** `Major` Insert → Media hijack; cancel strands | cancel returns to Insert, or show the picker over the canvas | caption `155:11`; cross-module (Media owns the cancel branch) | Stated in caption `155:11`. The return-path board belongs to the Media module — flagged, not drawn here | — | **PLANNED (caption) + cross-module** |
| **UX-A-18** `Major` clicked Image opens Media, dragged Image lands src-less | fire the same needs-asset handoff from the drop path | `138:153` + caption `155:15` | In the `138:153` truth-mark and in caption `155:15` | `138:153` name read (above) | **BLOCKED-ON-QUOTA** |
| **UX-A-19** `Major` drop indicator computed for a generic container | put the dragged type where dragover can read it | `138:153` + **new** `Insert · drop-refused` | In the truth-mark, in caption `155:15`, and the refusal chip on the new board *is* the per-type answer: `"Can't place Submit Button inside Heading"` | `138:153` name read (above) | **BLOCKED-ON-QUOTA** |
| **UX-A-20** `Major` click toasts, drag is silent | one contract; a highlight beats a toast | caption `155:15`; cross-module (Canvas/shell owns the toast) | **Open decision 8** — adopting SPEC §4's "highlight both" deletes the click toast, which is a shell board change and also removes where UX-A-32's Undo would live | — | **PLANNED (open decision)** |
| **UX-A-21** `Major` nothing scrolls the new element into view | `scrollIntoView` on every insert path | none in my two sections | Pure viewport behaviour; no Insert board can draw it. Listed in the decision note's code-dependency footer | — | **NOT-APPLICABLE (recorded)** |
| **UX-A-22** `Major` inserts into instances / locked containers unguarded | refuse with the reason, or place as a sibling | **new** `Insert · drop-refused` + caption `155:15` | The new board carries the second refusal variant `"Detach this instance first"` — the exact rule `insertActions.ts:68-69` already applies in the context menu | — | **BLOCKED-ON-QUOTA** |
| **UX-A-25** `Major` "Components" names two things one click apart | rename one of them | `1069:4790` | Renaming is the founder-final taxonomy again → **open decision 4**. The board name and its new caption state all three meanings instead | `1069:4790` name read: `"Insert · components-expanded"` | **PLANNED (open decision + truth-mark)** |
| **UX-A-13** `Minor` no count, no grouping, one live region over the whole list | show and announce a count | `138:53` + caption `155:13` | A `"12 results"` status line is specced above the list; caption written | `138:53` id + box read `(2100,220 280x812)`; interior never opened | **BLOCKED-ON-QUOTA (unresolved-id)** |
| **UX-A-16** `Minor` a callout describing a panel that never shipped, on an 8s timer | rewrite it; give it a dismiss control | **new** `Insert · transition-callout` | `insert-new-boards.json[6]` — no board for the callout exists today. New copy: "Quick Picks removed. Open a source group below — ELEMENTS, BLOCKS, COMPONENTS or MINE — and click a row to insert it. ELEMENTS rows can also be dragged onto the canvas." plus a ✕ replacing the timer (`useCallout.ts:37-45` already exposes `dismiss()`) | — | **BLOCKED-ON-QUOTA** |
| **UX-A-23** `Minor` 150ms lockout swallows clicks invisibly | surface the pending row, or drop the lockout | caption `155:11` | Stated in the caption. A per-row busy state was judged not worth a board of its own against the remaining budget | — | **PLANNED (caption)** |
| **UX-A-24** `Minor` MINE 0 shows a blank space | an empty state naming "Save as component" | **new** `Insert · mine-expanded · empty` | `insert-new-boards.json[3]`: "Nothing saved yet." / "Right-click any element on the canvas and choose Save as component. It appears here." — `Save as component` is the exact shipped label, `standaloneActions.ts:14` | `1069:4970` id + box read `(500,220 280x812)` | **BLOCKED-ON-QUOTA** |
| **UX-A-26** `Minor` palette can open Insert and nothing more | feed the catalog into the palette | none in my two sections | The palette board is the shell module's. Flagged in the decision note | — | **NOT-APPLICABLE (cross-module)** |
| **UX-A-27** `Minor` context-menu Insert submenu places `"New element"` divs | open the real list, pre-targeted | none in my two sections | Folded into **open decision 5** with UX-A-03 — same cluster, same owner | — | **NOT-APPLICABLE (cross-module, recorded)** |
| **UX-A-28** `Minor` product blocks open a one-shot CMS modal unannounced | say what the block needs on the card | **new** `Insert · blocks-expanded · rows`; caption for `1069:4707` | A `Needs a collection` badge (11px `--bk-ink-muted`, right-aligned) on the Product Card / Product Grid rows, which is why those two are in the 14-row sample at all | `137:2` read shows `1720:17541 hotspot/state · Ecommerce · collection-setup (moda` already exists — but stacked with five others (INS-DEF-01), so it is one of the six dead edges | **BLOCKED-ON-QUOTA** |
| **UX-A-29** `Minor` 53 tab stops to the second group; no `role="group"` | real groups + arrow-key navigation | caption `155:12` | Stated in the caption. Not otherwise drawable — focus order has no visual | — | **PLANNED (caption)** |
| **UX-A-30** `Minor` a fourth, unreachable insert implementation | delete it | none | `handleQuickAdd` renders nothing and reaches no board. Recorded in **open decision 5** so the deletion is not forgotten | — | **NOT-APPLICABLE (recorded)** |
| **UX-A-31** `Minor` favourites fully built, rendered nowhere | bring them into the panel, pinned above the groups | **new** `Insert · favourites` | `insert-new-boards.json[4]`: a 64px FAVOURITES band at y=80 (`▾ FAVOURITES … 3`) over a 3-chip row, with the exact displacement arithmetic for every node below it, computed from the read geometry of `137:2`. The ☆ toggle that fills it is specced onto `1069:4529` and flagged as unresolved | **Cross-checked against `PHASE4-QA-REPORT` §1.1 and honoured: favourites are built (`useBuildTab.ts:104-168`), recents are NOT (`BUILD_RECENT` has zero consumers) — no RECENT band appears in any plan of mine** | **BLOCKED-ON-QUOTA** |
| **UX-A-32** `Minor` insert toast has no Undo and does not say where | attach Undo; name the parent | none in my two sections | The toast is shell/canvas. Also collides with **open decision 8** — SPEC §4 deletes the toast entirely | — | **NOT-APPLICABLE (cross-module, recorded)** |
| **UX-A-33** module summary | — | — | Used to check the door inventory. All five entry points named there resolve to the same panel; the one involuntary exit (media → Media, no return on cancel) is UX-A-17 | `137:2` read confirms the pinned `"⌥  Paste HTML…"` row (`233:1123` @ y704) that the summary names as the third primary task | **N/A (context)** |

---

## Cross-checks the brief demanded, and what they returned

| Check | Result |
|---|---|
| `b.preview` undefined for all 64 entries (UX-A-05) | **Confirmed in code**: `grep -rn preview packages/editor/src/blocks/` → 0 hits; `shared/types/block.ts:25` declares `preview?: string`; `GroupSection.tsx:234-262` falls through to `tw:h-[80px] tw:w-[136px] … tw:bg-[var(--bk-bg-subtle)]`. The board is redesigned to rows, not patched. |
| Four Insert tips, not five (UX-A-14 corrects W-J-12) | **Confirmed**: `catalog/tips.ts:11-28` holds exactly four. Every plan row says 4. |
| `TEMPLATES \| 10` on both expanded boards (D-A-01) | **Not verifiable — those two boards were never opened.** What I *can* say: `137:2` has no TEMPLATES group, and `buildInsertGroups()` returns exactly four groups; `groups.ts:1-19` records TEMPLATES as explicitly OUT of Insert, founder-final 2026-08-07. If D-A-01 holds on `1069:4529`/`1069:4707`, the group must be deleted there — **that row is not in my plans because I could not confirm the node exists.** |
| SPEC-INSERT-PANEL's RECENT band (PHASE4-QA §1.1) | **Not drawn.** Recorded as open decision 2. |
| SPEC's BLOCKS→Section / MINE→Component / SECTIONS-open-by-default (PHASE4-QA §1.3) | **Not applied.** Recorded as open decision 1, explicitly as a founder-visible call, per the instruction not to slip it in. |
| The 560 vs 700 expanded-drawer conflict | Not reached — no Insert board in my sections is drawn at the expanded width. |

---

## What I did NOT cover — stated plainly

1. **No write of any kind was made.** 0 renames, 0 strings, 0 clones, 0 hotspots, 0 moves.
2. **`verify-invariants.mjs` was NOT run.** The coordinator's stop covers it, and a quota
   string is not a measurement. There is no loose/oob/overlap/dangling number in this report.
3. **14 of the 15 boards in my two sections were never opened.** I have their ids, names
   and bounding boxes; I do not have a single interior node id for `138:2`, `138:53`,
   `138:106`, `138:153`, `138:198`, `138:244`, `775:4053`, `781:4154`, `1069:4529`,
   `1069:4707`, `1069:4790`, `1069:4970`, `1138:13413` or `1706:8501`. Every plan row that
   needs one is marked `unresolved-id`.
4. **No caption's current text was read.** All nine caption rows in `insert-text-fixes.json`
   therefore carry no `expect` guard and an explicit applier note to read first and merge,
   not clobber. That guard is the one thing a rename cannot recover from.
5. **The V2 source page `2668:2` was never opened** — not board `2797:559` (Corrected Module
   Screens), not `2797:342` (Missing Screens & States), not `2797:2` (UX Audit). Every V2
   recommendation I acted on came from the local slice, `SPEC-INSERT-PANEL.md`,
   `PHASE4-QA-REPORT.md` and `UX-FLOW-MAP.md`. **If the drawn V2 Insert panel differs from
   `SPEC-INSERT-PANEL.md` §3, I would not know.**
6. **The section split is planned, not resolved.** `1069:4790` and `1069:4970` are still
   parented in `1090:4527`.
7. **Left to other lanes on purpose:** ARR-A-19's taxonomy reorder of row y=220;
   ARR-A-18's move of `Templates · empty` (`1138:13413`) out to section `1084:4527`;
   INS-DEF-01's seven-deep hotspot stack, five of whose labels name boards in other modules.
8. **No screenshot was taken, and no board was compared by eye to anything.** The Figma
   loop's acceptance step — board screenshot beside live screenshot — did not happen.

---

## Run order for the applier

Each step is idempotent; every script reports `SAME`/`ALREADY` on a re-run, so a
rate-limited abort can simply be re-run.

```
1  node scripts/figma/apply-truth-marks.mjs docs/design-jobs/V2-TO-V1/plans/insert-truth-marks.json          # dry run
   node scripts/figma/apply-truth-marks.mjs docs/design-jobs/V2-TO-V1/plans/insert-truth-marks.json --apply  # 7 renames, all ids resolved

2  READ 155:11 155:12 155:13 155:14 155:15 155:16 155:17 788:4299 788:4300  -> add `expect` guards
   node scripts/figma/apply-text-fixes.mjs docs/design-jobs/V2-TO-V1/plans/insert-text-fixes.json --apply

3  READ 138:53, 1069:4790, 138:106  -> resolve the three ids in insert-text-fixes-unresolved.json, then --apply

4  For each row of insert-new-boards.json (order: 0,1,2,3,4,5,6):
     node scripts/figma/add-state-board.mjs <clone> "<new>" --apply
     READ the new board -> resolve its child ids -> apply that row's postClone edits

5  READ 137:43/44/45 to confirm, then apply insert-geometry.json[0] on 137:2;
   repeat the same three-step transform on the 11 sibling boards it names

6  insert-layout.json steps 1..5   (reparent -> captions -> layout-section.mjs 1776:8379 -> rename -> label)

7  node scripts/figma/add-hotspots.mjs docs/design-jobs/V2-TO-V1/plans/insert-hotspots.json --apply
   (resolve the two `to_unresolved` destinations from step 4 first)

8  insert-decision-note.json   -> the OPEN DECISIONS frame
9  node scripts/figma/verify-invariants.mjs
```

## Plan files

| File | Rows | Ids resolved? |
|---|---|---|
| `plans/insert-truth-marks.json` | 7 board/hotspot renames | **all 7 read from file**, each with its `current_name_read_back` |
| `plans/insert-text-fixes.json` | 10 | ids read from file; **no `expect` guards** — current text never read |
| `plans/insert-text-fixes-unresolved.json` | 3 | `unresolved-id`, each with a selector + the `137:2` structural analogue |
| `plans/insert-new-boards.json` | 7 new boards | clone sources + wire-from nodes all read from file; post-clone edits unresolved by construction |
| `plans/insert-geometry.json` | 3 ops | op 1 fully resolved on `137:2`; ops 2–3 `unresolved-id` |
| `plans/insert-hotspots.json` | 7 (2 optional, 1 already present) | every `over` node read from file, with computed hotspot bounds; 2 destinations pending step 4 |
| `plans/insert-layout.json` | 5 steps | full read-back of both sections' children embedded as the baseline |
| `plans/insert-decision-note.json` | 1 frame, 8 entries | new node |
| `plans/insert-board-defects.json` | 2 | measured on `137:2`; outside my 32 |
