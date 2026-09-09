# V2 → V1 — AI experience, gap pass (`ai2`)

**Target:** page `1:3`, section `1776:8380` "12 · AI" · **Scope:** the eighteen
UX-G findings that reached the end of the 2026-09-07 apply with **no queue row
at all** — `UX-G-02 04 06 07 08 09 10 12 13 14 16 17 18 19 20 21 22 24`.

**Figma calls spent: 10 of the 25 allowed.** No board was created, none removed.

## The finding this pass is actually about

The eighteen had no row because the AI-module agent's quota died after one call,
not because nobody thought about them. Three decision boards **did** land later
in that session, and the first thing this pass did was ask the file — not a plan
— which of the eighteen those boards already answer:

```
node scripts/figma/ai-gap-close.mjs --apply      # 1 call, 24 lane ids × 3 boards
```

**Seventeen of eighteen came back HIT.** One came back MISS. That single MISS —
`UX-G-24` — is the whole difference between "already done" and "nobody looked",
and it is not visible from any plan file: it is only visible from the boards.

So this pass is mostly read-back, deliberately. A second board restating a
decision already drawn is worse than no board: the file then carries the rule
twice and the copies drift. Four things were genuinely missing and were drawn.

## What changed in the file

| # | change | node | read-back |
|---|---|---|---|
| 1 | `UX-G-24`'s line — the only finding of the eighteen no board asserted | TEXT **`2872:12431`** on board A | `ADDED 2872:12431 @32,780 1316x32 "UX-G-24 · module summary — adopt one AI interaction system BEFORE redrawing any of these screens…"`; board A `796 → 836` tall, `kids=49` |
| 2 | `UX-G-04`'s quota meter, moved to where the finding asks for it | TEXT **`2846:21653`** on `170:2` | `METER-AFTER 2846:21653 @154,148 100x16 pos=ABSOLUTE input-bottom-right siblings-moved=0 fits=true "7 left today"` |
| 3 | `UX-G-19`'s scope rule, on the caption of the board that draws the TRY rows | TEXT **`172:33`** | `OK append-text … h=144` (the gap to the row below at `y=1226` is 174) |
| 4 | a door for `2476:12001`, which had **zero** inbound edges | hotspot **`2876:12485`** | `OK 2876:12485 over 2846:21471 -> 2476:12001` |

### The quota meter was a silent no-op, and only a read found it

`build-ai-v2-boards.mjs --only=D` had already run — it returned `SKIP-EXISTS` for
all five of its rows, so `UX-G-04`'s meter *existed*. It was in the wrong place
and nothing had ever said so:

- Step D computed `pf.x + pf.width - 116, pf.y - 20` from a frame matched by
  `/prompt/i` **anywhere in the subtree**, so those coordinates are in *that
  frame's parent's* space, while the meter was appended to the **board**.
- And it did not matter, because **`170:2` is a `VERTICAL` auto-layout frame**,
  `spacing=0`, `pad=0`, packed `MIN`. x/y on a flow child are computed by the
  parent. The first repair attempt wrote `x=164` and **read back `x=0`** — the
  call returned, the node had not moved. That is the standing trap in this repo
  and the reason every op here re-reads in the same call.

`layoutPositioning = "ABSOLUTE"` is the fix, and taking a child out of flow
re-flows the stack — so the script measures every sibling's position before and
after and **reverts if any sibling moves**. It reported `siblings-moved=0`.

The second attempt then guessed a slot ("the band above the composer") and put
the label across the input's top-right corner, because the board's children are
contiguous and that band is **0px**. One read call settled it:

```
KID0 170:3  Back row     0,0   280x36     KID3 170:7  Prompt      0,112 280x72
KID1 170:5  Header       0,36  280x44     KID4 170:10 Suggestions 0,184 280x120
KID2 1625:7162 Scope     0,80  280x32     PROMPT 170:8 input     16,120 248x52
                                          PROMPT 170:9 "Ask AI to change something…" 26,128 169x18
```

The meter now sits at `154,148` — the composer input's bottom-right, clear of the
placeholder, which is literally "beside the send control". Measured, not eyeballed.

## One row per finding

`board · node` is the node the read-back came from. Every id below was returned
by Figma on 2026-09-07, not copied from a plan.

| id | verdict | board · node touched / quoted | read-back evidence |
|---|---|---|---|
| **UX-G-02** *Crit* | **IMPLEMENTED** | A `2846:21441` · `2846:21443`, `21447`, `21467/21471/21479/21483` | `BOARD 2846:21441 AI · one home — every door, one destination @100,5220 1380x836 kids=49 texts=37`; subtitle reads `"DECISION — applies UX-G-02, UX-G-15, UX-G-16"`. The left-drawer variant is deliberately **not** drawn — drawing it preserves what the decision removes. |
| **UX-G-04** *Major* | **IMPLEMENTED** | B `2846:21490` · `2846:21555` · **and** `170:2` · `2846:21653` | rule cell `HIT UX-G-04 2846:21490 2846:21555 @1220,962 "UX-G-04"`; meter `METER-AFTER 2846:21653 @154,148 100x16 pos=ABSOLUTE siblings-moved=0 fits=true` |
| **UX-G-06** *Major* | **IMPLEMENTED** · relabels owed to Media | C `2846:21613/21614/21615`; B `2846:21570` | `C 2846:21613 "Media · alt text"` / `21615 "ships twice — unify on the vision path"`; `HIT UX-G-06 2846:21490 2846:21570 @1220,1192` (beside *Provenance survives the apply*) |
| **UX-G-07** *Crit* | **IMPLEMENTED** · CTA gate owed to Brand | B `2846:21574`; `2476:12029` | `HIT UX-G-07 2846:21490 2846:21574 @32,1294 "An affordance and the capability behind it share one switch. Brand's “Generate with AI…"`; `NODE 2476:12029 [not-implemented] Brand · generate component with AI — the schema has nowhere to go` |
| **UX-G-08** *Major* | **IMPLEMENTED** | C `2846:21621/21622/21623`; `2476:12029` | `C 2846:21621 "Brand · component generation"` / `21623 "built, dead-ended: no Accept destination"` |
| **UX-G-09** *Crit* | **IMPLEMENTED** (board) + **doc corrected** | C `2846:21630/21631`, `21632/21633`; `DESIGN-AUDIT-SUMMARY.md:99` | `C 2846:21630 "Version history · AI diff summary"` / `21631 "Fails clause 4 — the diff is already rendered, structured and…"`; `21632 "Milestone / version naming"` / `21633 "Fails clause 1 — naming a checkpoint is three words the user t…"`. **`ai.summarize` has an editor caller** (`useAISummary.ts:109`); line 99 still asserted D-F-38's refuted claim and now reads `REFUTED (findings/VERDICTS.jsonl:199)`. |
| **UX-G-10** *Major* | **IMPLEMENTED** · relabels owed to six modules | B `2846:21490` · `2846:21492` | `HIT UX-G-10 2846:21490 2846:21492 @32,62 "DECISION — applies UX-G-10, and the controls UX-G-04 / -05 / -11 / -12 / -13 / -14 / -"` — one Sparkles mark, three tiers, one verb each, a `never` column per tier |
| **UX-G-12** *Major* | **IMPLEMENTED-AS-RULE** · board change owed to Inspector `32:2` | B `2846:21564` | `HIT UX-G-12 2846:21490 2846:21564 @1220,1100 "UX-G-12"` beside *AI never evicts the surface that judges it*. No board in `1776:8380` draws the inspector being replaced, so there is nothing here to redraw. |
| **UX-G-13** *Major* | **IMPLEMENTED-AS-RULE** · host board does not exist | B `2846:21558` | `HIT UX-G-13 2846:21490 2846:21558 @1220,1008 "UX-G-13"` beside *Undo is a button, not folk knowledge*. `W-K-01`'s "AI · proposal" (the applied chat message) was never built — the Undo belongs **on** it, so the two must be built together. Not drawn on a substitute board: putting an Undo on a board that does not draw the applied chat state would be a false claim. |
| **UX-G-14** *Major* | **IMPLEMENTED-AS-RULE** · draw owed to Inspector `160:512` | B `2846:21561` | `HIT UX-G-14 2846:21490 2846:21561 @1220,1054 "UX-G-14"`, carrying the consequence sentence and the statement that privileged actions stay gated under auto-apply. The toggle is drawn on **no** board (`W-K-15`). |
| **UX-G-16** *Minor* | **IMPLEMENTED** · palette edit owed to `1779:3` | A `2846:21443`, `2846:21479` | `HIT UX-G-16 2846:21441 2846:21479 @588,574 "RETIRE the destination. One palette row, always present, routing to the inspector colu…"` |
| **UX-G-17** *Major* | **NOT-APPLICABLE as a V1 board edit** — the subject is the dashboard's Settings → AI credits page, and page `1:3` is the **editor**; its 29-section ground truth has no dashboard family. Recorded, not dropped. | C `2846:21648` | `C 2846:21648 @32,952 "3 · One honest index of what AI does. The dashboard's AI-credi…"` |
| **UX-G-18** *Major* | **NOT-APPLICABLE as a V1 board edit** — same reason: two dashboard site-creation wizards, no dashboard family on this page. | C `2846:21625/21626/21627`, `2846:21648` | `C 2846:21625 "Dashboard · site draft"` / `21626 "Primary — one brief form, reached from both doors"` / `21627 "ships as two wizards, one weaker"` |
| **UX-G-19** *Minor* | **IMPLEMENTED** | B `2846:21567`; caption `172:33` | `HIT UX-G-19 2846:21490 2846:21567 @1220,1146 "UX-G-19"`; `ai2-02#0 OK append-text … h=144` on `caption/AI · idle`. The three TRY rows are **not** annotated one by one — their child ids have never been read. |
| **UX-G-20** *Major* | **IMPLEMENTED** · Settings + History owe the two surfaces | C `2846:21646`; B `2846:21573` | `C 2846:21646 @32,856 "1 · “What AI can change”, in plain words, reachable from the p…"`; `HIT UX-G-20 2846:21490 2846:21573 @1220,1238`. Board C puts Settings under **MUST NEVER HAVE ONE** (`2846:21634/21635`), so the disclosure is a page *about* AI, not a surface where AI acts. |
| **UX-G-21** *Major* | **IMPLEMENTED** · doors owed to Content + Insert | C `2846:21601/21602/21603`, `21609/21610/21611` | `C 2846:21601 "Content / CMS · records and fields"` / `21603 "not built — highest-value gap"`; `C 2846:21609 "Insert / Layouts"` / `21611 "not built — the command ships, the door does not"` |
| **UX-G-22** *Major* | **IMPLEMENTED** · Pages door owed to `1776:8377` | C `2846:21647` | `C 2846:21647 @32,904 "2 · The onboarding brief — industry, description, location, to…"` |
| **UX-G-24** *summary* | **IMPLEMENTED — the one that was genuinely missing** | A `2846:21441` · new TEXT `2872:12431` | `MISS UX-G-24 no TEXT on any of the three decision boards carries this id` → `ADDED 2872:12431 @32,780 1316x32` · `BOARD-AFTER 2846:21441 @100,5220 1380x836 kids=49` |

## One thing outside the eighteen, carried because this pass measured it

`2476:12001` "AI · in-canvas popover — 4 states" was re-read at `rx=0` — still
**zero inbound edges**, nothing in the file reaches it. `UX-G-11` owns it and has
its own row elsewhere, but a board nobody can reach is not a board. Board A's
decision cell for the canvas-toolbar door (`2846:21471`, whose own text names
that popover) is now hotspotted to it: `OK 2876:12485 over 2846:21471 ->
2476:12001`. That is a documentation door, not a product flow — the Canvas
module still owes the real one from the selection toolbar.

## Invariants — before and after

| class | stated baseline | after this pass | verdict |
|---|---|---|---|
| loose nodes on page | 77 | **77** | unchanged |
| section overlaps | 2 | **2** (`07 · Brand`×`06 · Content`, `12 · AI`×`13 · Command palette`) | unchanged — both pre-existing |
| board overlaps | 0 | **0** | unchanged |
| out-of-bounds children | 2 | **2** (`147:55`, `1719:8421`) | unchanged — the same two, neither in this pass's scope |
| dangling prototype edges | 0 | **0** | unchanged (edges 3453) |
| boards | 1002 | **1014** | grew by 12, **none of them this pass's** — see below |

**None of the five defect classes moved.** That is the number that matters and it
is the number this pass is accountable for.

**The +12 boards are not mine and I will not claim otherwise.** This pass created
**zero** boards: its four writes are one TEXT inside board A, one string appended
to an existing caption, one hotspot rect inside board A, and one existing TEXT
repositioned inside `170:2` — none of which is a section child, which is what
`verify-invariants.mjs` counts. The shared spend counter also moved from 100 to
104 without this pass spending those calls, so another session was writing to the
file during this window. Growth is the permitted direction (no section lost a
board), but the attribution belongs to whoever ran concurrently, and a pass that
reported +12 as its own would be lying in the direction that flatters it.

### Did section `12 · AI` grow

**No.** The section node's own box reads `2480x5200` — the same value the AI
agent's single successful call read before any of these boards existed:

```
SECTION 1776:8380  12 · AI · 30  2480x5200  kids=30  nextRowY=1226
```

Board A grew `796 → 836`, so its bottom moved `6016 → 6056` — still well inside
its own row, whose tallest member (board B) runs to `y=6580`. The section's
content extent is therefore unchanged too. Worth stating plainly because the
brief flagged the risk: the three decision boards were placed at `y=5220`,
which already extends past the section node's 5200-tall box, and boards C sits
at `x=3060..4440`, past its 2480 width. **That is a pre-existing condition from
the 2026-09-07 apply, not something this pass created or worsened** — and it is
why `12 · AI` × `13 · Command palette` is computed as an overlap off a box that
does not contain its own children. Fixing that is an arrangement-lane job
(`order-sections.mjs`), deliberately not taken here.

## What I did NOT do

1. **I did not open the V2 source boards.** Every "what V2 asks for" statement
   here comes from `slices/ai.json` and `AI-PLACEMENT-MAP.md`, which are the
   documents that generated those boards — a faithful substitute, not the
   rendered board.
2. **I did not screenshot anything.** No board was verified by eye. Every claim
   above is a property read, and a property read is a thermometer: it answers
   what it was asked and nothing else. Nobody has *looked* at board A since the
   `UX-G-24` line was added, and its 32px is asserted from `t.height`.
3. **I did not annotate the three TRY rows individually** (`UX-G-19`), did not
   draw the auto-apply toggle (`UX-G-14`), did not build `AI · proposal`
   (`UX-G-13`), and did not touch `32:2` (`UX-G-12`). Each is named above with
   its owner.
4. **I did not update any board in another module's section.** The nineteen
   cross-module rows in `ai-05-owed-by-other-modules.json` are still owed and
   still unrun.
5. **I did not re-verify the seventeen HITs by reading their full text.** For the
   thirteen whose id is printed in a rule/failure cell, the id **is** the cell.
   For `UX-G-06 / -08 / -09 / -21` the id appears only in board C's subtitle, so
   a second call read board C's fifty-eight rows verbatim and those four are
   quoted from the row, not the subtitle. Nothing else was re-read.
6. **`UX-G-05`, `-15`, `-23`** came back `MISS`/partial in the same sweep but are
   **not in this pass's eighteen** — they already carry queue rows and are marked
   IMPLEMENTED in `REGISTER.md`. `UX-G-05` is asserted by no decision board at
   all; that is worth someone's attention and is not mine to close.

## Files

| file | what |
|---|---|
| `plans/ai2-01-verdicts.json` | 18 advisory rows, one per finding, each carrying its verdict and its read-back node ids |
| `plans/ai2-02-board-additions.json` | the 2 executable rows (`append-text`, `hotspot`), both `OK` in `queue-state.json` |
| `scripts/figma/ai-gap-close.mjs` | the read that found the single MISS, plus the `UX-G-24` line — 1 call |
| `scripts/figma/ai-gap-evidence.mjs` | board C's rows verbatim + the four loose nodes — 1 call, read-only |
| `scripts/figma/ai-gap-idle-geometry.mjs` | board `170:2` in board coordinates — 1 call, read-only |
| `scripts/figma/ai-gap-fix-quota-meter.mjs` | the meter, out of auto-layout flow and into a measured slot, reverting if a sibling moves |

All four pass `node scripts/figma/preflight-sandbox.mjs`, which builds the real
payload and parses **that** — `node --check` proves only that the host file
parses and has twice been wrong about the string inside it.

## Register

`REGISTER.md`'s eighteen `ai` rows read `PENDING | PENDING` before this pass and
now carry a status and a read-back excerpt each — that is where "a finding with
no row is indistinguishable from one nobody looked at" is actually cured, since
the register is what anyone reads next.

Three `UX-G` rows remain `PENDING` and are **outside** this pass's eighteen:
`UX-G-03`, `UX-G-11` and `UX-G-23`. All three already have queue rows
(`ai-02-state-boards`, `ai-04-blocked-state-actions`) and their state boards
`AI · scoped-multi` and `AI · error-provider` exist; closing them means reading
those two clones back, which belongs to whoever owns them. `UX-G-23`'s two
"Continue by hand in the inspector" rows were re-confirmed present on both
`171:136` and `171:105` in passing (`SKIP-EXISTS` ×4 from step D), but a
`SKIP-EXISTS` returns a string match and no node id, so it is reported here as
an observation and not as that finding's evidence.
