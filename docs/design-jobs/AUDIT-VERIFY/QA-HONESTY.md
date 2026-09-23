# Honesty audit — does the write-up claim more than the evidence carries?

Adversarial read of `IMPLEMENTATION.md` and `VERDICTS.md` against the files that
are supposed to prove them: `fix-queue.json`, `fix-queue-state.json`,
`fix-queue-needs-review.json`, `fixplans/*.json`, the `b*.tsv` dumps, and the
current source of `normalize-plans.mjs`, `apply-queue.mjs`,
`validate-fixplans.mjs` and `qa-containment.mjs`. Zero Figma calls; everything
below is recomputed from disk.

`IMPLEMENTATION.md` was edited while this audit ran (mtime 20:37) and
`QA-CLOSURE.md` was written at 20:35. Both are audited as they stand now. Where
`QA-CLOSURE.md` already corrects `IMPLEMENTATION.md`, that is said.

---

## 1. Every number in `IMPLEMENTATION.md`, recounted

| claim | line | recount | verdict |
|---|---|---|---|
| plan files 5 | `:9` | 5 files in `fixplans/` | **agrees** |
| rows authored 131 | `:10` | 29+31+23+14+34 = **131** in the five `rows[]` arrays. `validate-fixplans.mjs` independently prints `131 rows` | **agrees** (see §1a) |
| queued 129 | `:11` | `fix-queue.json` `rows` length = **129** | **agrees** |
| **executable 106** | `:12` | **100.** 129 − 23 held − 6 `unresolved` = 100. `apply-queue.mjs` itself calls the 6 **unusable** (`:94` "unresolved node id — run resolve-selectors first") and its dry run prints `pending 100 rows in 6 calls` | **DISAGREES — overstated by 6** |
| held, "carried not dropped" 23 | `:13` | 23 rows in the queue carry `hold:true`, and none has a ledger entry — that half is exact. But **28 rows were authored held**: 25 inside `rows[]` (2 of which were dropped to `fix-queue-needs-review.json`) plus 3 in `c2-clipping.json`'s top-level `held[]`, which the normalizer never reads. **5 held rows were not carried** | **half true; "not dropped" is false for 5 rows** |
| awaiting one selector lookup 6 | `:14` | 6 rows carry `unresolved:true` (F16 zoom chips on `52:2` / `199:205`) | **agrees**, but they are counted *inside* the 106 above, so the table double-counts them as executable |
| **cost to apply 6 calls** / "the whole arc executes in 6 calls" | `:4`, `:15` | 6 is the correct **batch count** (verified: dry run against an empty state prints `100 rows in 6 calls`, one per op-group, and the ledger holds exactly 6 distinct batch timestamps). But `fix-queue-state.json` records **`"spend": {"2026-09-07": 16}`** — 16 calls were charged against this queue that day, with `capSeenAt: 15:23:00Z`. 6 carried the rows; ~10 produced no outcomes (cap-trickle re-runs, which `apply-queue.mjs:545` documents) | **DISAGREES — the arc's own ledger says 16** |
| 100 rows landed, 95 OK + 5 already-correct, 0 failed | `:79` | 100 ledger entries: 95 `OK`, 5 `SAME`, 0 `DRIFT`/`REFUSED`/`MISSING`. Keys reconcile exactly with the 100 live queue rows — no orphan state key, no un-run live row | **agrees, exactly** |
| 16 of 48 findings had no rows | `:89` | 24 of 48 findings have no queue row at all; 24 = 16 MISSED + 6 NOT-APPLICABLE (F05, F11, F23, F26, F27, F28) + F14 (documented `not_authored`) + F19 (held in `PLAN.md` §C6). The 16 named are correct | **agrees** |
| F22: "records Inspector at 52 where the fresh read says 56" | `:57` | `BOARD-BASELINE.json` `1776:8381` → `"name": "08 · Inspector · 51", "n": 52`; `b17.tsv` N line → `56` | **agrees, exactly** |
| F22: "13 renames" | `:56` | 13 of the 29 sections in `BOARD-BASELINE.json` have a title count that disagrees with `n` | **agrees, exactly** |
| bug 3: `y=16024` ≈ 16,000px down | `:36` | Parent `Search` is at abs y 16014; a parent-relative 16024 lands the chip at abs 32038 vs its current 16068 = **15,970px**. Note the *plan rows'* own `why` says "~10px down the canvas" — the doc is right and its source is wrong | **agrees** |
| bug 4: 8px overflow on the bulk board | `:42` | `b*.tsv`: text `1175:4830` = `126,24781,406,13` → right edge 532; frame `1175:4829` = `116,24775,408,25` → clip edge 524. **8px** | **agrees, exactly** |
| "9 clipped frames resolved, 0 still clipped" | `:82` | The script prints that. What it establishes is far narrower — see §3 | **restated accurately; the underlying check does not support the reading** |

### 1a. The 131 hides three rows

`c2-clipping.json` carries a fourth array — `held[]`, 3 rows — deliberately kept
outside `rows[]` because at authoring time the normalizer would have executed
them. `validate-fixplans.mjs` only walks `rows|boards|ops|adds|add`, so those 3
are checked by nothing and queued by nothing. Total authored is 134, of which
131 are visible to every downstream tool. The `hold` fix (§2.1) was never
followed by migrating them back into `rows[]`, so they remain invisible.

### 1b. The internal contradiction

`IMPLEMENTATION.md`'s summary table (`:7-15`) is still the pre-apply forecast,
and its own new section (`:77-85`) contradicts it: the table says 106 executable
and 6 calls; the section says 100 landed. The table was not updated.

---

## 2. The four "toolchain bugs"

First, a scope note the heading gets wrong: **only 1 and 2 are toolchain bugs.**
3 is a plan-authoring error (a new validator rule was added *because* of it), and
4 is a plan-data collision caught by a validator rule that already existed
(`validate-fixplans.mjs:122-127`). "Four toolchain bugs found" over-credits the
tooling for two defects that were in the plans.

Second, a verification limit that applies to 1 and 2: **`git diff` proves
nothing here.** `apply-queue.mjs`, `normalize-plans.mjs`, `validate-fixplans.mjs`
and `qa-containment.mjs` are all **untracked** (`git ls-files --error-unmatch`
fails on all four; `git log` on them is empty). There is no before-state on disk,
so "Fixed in both scripts" cannot be diffed. It can only be corroborated.

**2.1 — `hold` was honoured by nothing. SUPPORTED (strongly corroborated).**
The guards exist now: `normalize-plans.mjs:84-90` carries `hold`/`holdWhy`, and
`apply-queue.mjs:92` diverts a held row to the unusable pile before op checking.
More convincingly, all three smuggling workarounds the claim names are
physically present in the plan files, written by different authors:
`op:"advisory"` (13 rows across c1, c3-c4, c8, all `hold:true`), a top-level
`held[]` key (c2-clipping), and a `HOLD — DO NOT EXECUTE` prefix in `why` (3
occurrences in c5-c6-c7). An author does not invent a workaround for a flag that
works. And the guard demonstrably held: **all 23 held rows have zero ledger
entries.**

**2.2 — the normalizer still dropped the flag; four `#FFFFFF` fills. SUPPORTED
in outcome, self-reported in cause.** The cause is attested only by the code's
own comment (`normalize-plans.mjs:84-89`) and cannot be diffed. The *stakes* are
verified: `52:160` / `52:161` / `199:293` / `199:294` are, per `b08a.tsv` /
`b08b.tsv`, the 20px Semi Bold heading ("Wood-fired pizza, five minutes from
home") and 13px subtext of the frame named `Hero — SELECTED` on both assembled
boards — so "invisible text on two assembled boards" is exact. And the outcome is
verified: all four sit in the queue with `hold:true` and none appears in the
ledger. No white fill was applied.

**2.3 — three `move` rows carried absolute coordinates. SUPPORTED, with the
label corrected.** `c3-c4#13/14/15` targeted `(301,16024)`, `(2701,16024)`,
`(3001,16024)`; all three now read `(201,10)`, and the three parents sit at abs
`(100,16014)`, `(2500,16014)`, `(2800,16014)` — the conversion is arithmetically
right and independently identical, as claimed. The new guard is real:
`validate-fixplans.mjs:116-120` rejects `|x|` or `|y| > 2000` on a `move`.
Two limits on that guard worth recording: it is skipped for held rows (the
function returns at `:86` first) and for rows with no id, and 2000 is a heuristic
that would miss a wrong-but-small absolute coordinate.

**2.4 — cross-plan collision on `2850:22371`. SUPPORTED.** `c1-clones#6` asks
`h=117`; `c2-clipping#27` asks `h=217` — same node, two authors, two heights.
Resolution is visible in the files: `c2#25/26/27` are now `hold:true` and three
new rows (`c2#28/29/30`) target the bulk board `1175:4830/4829/4827`; all three
landed (`OK`, `OK`, `SAME`). The 8px figure is exact (§1). One caveat carried
into §4.

---

## 3. The containment QA — what "resolved 9 · still clipped 0" actually establishes

The script's stated purpose is right and its header is honest about using the
dumped child boxes. The arithmetic it performs is narrower than the sentence it
prints, in six ways, all checkable in the source.

**3a. Where the other 12 went — and why that is only partly legitimate.**
`checked` is incremented at `:68`, *before* the `if (!wasOut.length) continue;`
at `:71`. So a frame with no pre-existing overflow is counted as checked and
printed as nothing. Instrumenting the 25 live `resize` rows gives:

| | n | what it is |
|---|---|---|
| printed (9) | 9 | genuine before→after bottom-edge repairs |
| silent: 6 `spacer` frames | 6 | `163:43`, `2854:12326/21771/21846/21886`, `641:2595` — auto-layout compensation shrinks, no clipping role. `childrenOf["spacer"]` holds 7 texts file-wide and **geometry excluded all 7 for every one of the six** — the check had zero evidence, not a clean bill |
| silent: `2881:12608` | 1 | **zero name-matched children in the whole file.** A pure null result, indistinguishable in the output from "no defect" |
| silent: `2881:12616`, `2850:21560`, `2850:22371`, `1175:4827`, `1175:4829` | 5 | children found and contained pre-fix |
| never counted | 4 | 3 width-only rows (`2846:21678`, `138:105`, `1175:4830`) skipped by `!r.h` at `:62`; and `1170:4777` (M20's board) skipped at `:67` because its box is in **no dump** — dropped before `checked++`, so it is absent from the "21" as well |

So "checked 21 resized frames" is 21 of 25 live resize rows, and at least 7 of
the 21 were checked against nothing.

**3b. It measures the bottom edge only.** `over = (b[1]+b[3]) - bottom` (`:53`).
Left/right clipping is not computed at all, and width-only rows are excluded at
`:62`. **The two defects `IMPLEMENTATION.md` uses to headline bug 4 — the 8px
horizontal overrun on `1175:4830` and F13's `COMPONENTS` label — are exactly the
class this check cannot see.**

**3c. Only TEXT children exist to it.** `childrenOf` is populated solely from
`T` lines (`:33`). The dumps' `K`/`N` lines carry no parent column at all, so a
frame clipping a nested FRAME, INSTANCE or RECT has, to this script, no children.
A frame can be reported RESOLVED on its one text while a non-text child still
overflows.

**3d. Parentage by name is a heuristic, and it happens to hold here.** `:33`
keys children by the dump's parent-**name** column, then disambiguates with an
x-overlap test (`:51`) and a y window of `[top−1, top+h+200]` (`:52`). In this
data set that is correct: the repeated names separate cleanly on x — `Error` ×2
at x1220 and x2100, `Prune note` ×5 at x1300/3400/4300/4860/5140, `spacer` ×2 at
x1312 and x2332. That is a property of this page's layout, not of the method.
Two ways it can be wrong: (i) two same-named frames stacked vertically within
200px at overlapping x cross-contaminate; (ii) the `+200` ceiling is a hard
detection limit — a child escaping further than that is dropped from `before` as
well as `after`, so the frame reports nothing rather than STILL CLIPPED.

**3e. It cannot fail a shrink.** `:71` returns before `nowOut` is ever consulted,
so a resize that *creates* a clip is invisible. Concretely, by the script's own
arithmetic, `c1-clones#6`'s 202→117 shrink of `2850:22371` leaves `2850:22384`
**71px past the new bottom** — and the script prints nothing for that frame.
(In practice `2850:22384` is hidden by `c1-clones#5` and the parent is
auto-layout, so it is probably not a live defect — but the check has no notion of
either, so it is not the check that tells us so.)

**3f. It never verifies the rows the arithmetic depends on.** `landed` (`:63-64`)
reads the ledger for the **resize row only**. The F06 repair also *moves* five
texts down; the check computes containment from pre-move boxes (dumps taken
18:29–19:07, writes at 20:04–20:25) and never asks whether the move rows landed.
Recomputed by hand with post-move positions, the three F06 frames still contain
their children (`171:163` bottom 65979 vs last child 65961; `2846:21677` 64573 vs
64561), so the verdict survives — but the script did not establish that, and the
moves are what the numbers rest on. (Minor: `state[r.id]` at `:63` is dead — the
ledger is keyed by `r.key` only.)

**Fair reading of the line.** "resolved 9 · still clipped 0" is true as: *for the
9 frames where a dumped TEXT child had a bottom-edge overflow and whose resize
row read back OK/SAME, the same arithmetic against the requested height now
yields ≤ 0.* It is not evidence that the C2 class is closed, and the `0` is a
zero over a denominator the script never established.

---

## 4. Claims that rest on a plan rather than the ledger

The ledger is strong where it applies: 100 entries, every one a post-write
read-back, `OK` only on strict equality. Three claims reach past it.

1. **M06 on the *clone* board.** `IMPLEMENTATION.md:43` ("M06's repair moved
   there") and `QA-CLOSURE.md`'s **CLOSED (re-aimed)** both rest on the clone's
   clip being cured incidentally by M01's shorter string. The ledger proves
   `2850:22374`'s *characters* changed; it does not prove the new 60-char string
   fits 398px. The only support is a character-count estimate inside a `why`, and
   §3b shows the containment check is structurally unable to test it. **This is
   the one "fixed" claim in the arc that has no measurement behind it.**
2. **`LayoutShell.Footer` "has zero consumers"** (`:73`). True of production
   code — the only import is `src/editor/rail/__tests__/LayoutShell.test.tsx:28`.
   The substantive claim holds; "zero consumers" is literally one too few.
   Everything else in the F15 code diagnosis checks out: `AquibraStudio.tsx:710-729`
   renders `<footer className="layout-shell__footer">` as a flex sibling of the
   whole shell (the root div is `tw:flex tw:flex-col` at `:468`);
   `LayoutShell.css:286-294` re-areas the fullpage grid with no `footer` area and
   `:311-320` hides only drawer/canvas/inspector. Neither file is modified in the
   working tree — the code fix has not landed.
3. **`expect` is documentation for 82 of the 100 applied rows.** The applier
   enforces `expect` only in the `text` and `rename` builders (`:133`, `:151`);
   `resize`, `move`, `delete`, `fill` and `add-text` ignore it. So 40 delete + 25
   resize + 16 move + 1 add-text = 82 writes ran with no guard against the file
   having moved since 18:29 — `c2-clipping.json`'s own `note` says exactly this
   and `IMPLEMENTATION.md` does not. Five rows carry no `expect` at all
   (`c1-clones#6/14/15/16/17`), against `BRIEF-FIX.md` rule 3. The risk is
   over-writing newer work, not phantom success: `SAME`/`OK` are still real.

`VERDICTS.md` itself makes **no** claim that anything was fixed by this arc — it
predates the apply (mtime 19:07 vs writes at 20:04–20:25) and every row cites a
fresh read, a post-arc sweep, the code, or a builder source. Its two checkable
numeric claims re-measure exactly: F22's `01 · Shell · 34` → 56, `08 · Inspector
· 51` → 56, `16 · History · 43` → 49 are the literal `N` lines of `b17.tsv`, and
its "48 claims" matches `verdicts.jsonl`. F05's REFUTED-ALREADY-FIXED rests on a
before/after measurement (6 → 0 overprints, 16:29), not a screenshot.

---

## 5. The honest remainder

### 5.1 Findings still open

- **16 verified-real findings with zero rows and no recorded reason** — M09, M10,
  M11, M14, M15, M16, M18, M19, F04, F08, F09, F17, F20, F21, F24, F25.
  `IMPLEMENTATION.md:89` and `QA-CLOSURE.md` now both say this; it was absent
  from the document until the 20:37 edit.
- **F04 is the sharpest of those**: a 185×40 overprint on `144:2` that this
  repo's *own* detector already logs, sitting inside the exact defect class
  `c2-clipping.json` was chartered for.
- **F21** needs `rewire`, which is in `apply-queue.mjs`'s `OPS` set (`:67-68`)
  with a working builder (`:380`). Authorable, never authored.

### 5.2 Held, and what unblocks each

| held | rows | unblock |
|---|---|---|
| F02 hero fill | 4 `#FFFFFF` fills held in-queue + 2 `#1A56DB` frame fills in `fix-queue-needs-review.json` | one read of `fills[0].color` on `Hero — SELECTED` (`52:2`, `199:205`) |
| F01 Layers highlight | 2 advisories | a row-frame id read + an instance-paint/variant op the runner lacks |
| F03 annotation re-park | 3 advisories | one read of section `1776:8377`'s children |
| F22 section counts | 1 advisory | `order-sections.mjs` (1 call) — with its page-restack side effect |
| F16 zoom chips | 6 `unresolved` + 1 advisory | `resolve-selectors.mjs --apply` (1 call); the *device* half is deliberately unauthored |
| M17 / F10 / M13 second half | 3 | ops the runner does not have (`insertChild`, `layoutSizingHorizontal`, `setProperties`) |
| M01 / M04 / M08 residue | 5 | prototype-edge and rename decisions; `c1-clones#7` is a gap the repair *opened* — after the 202→117 shrink the back-hotspots `2850:22385/22386` fall outside the board |
| M06 clone-board rows | 3 | held so they cannot fight M01's `h=117` |

### 5.3 What `IMPLEMENTATION.md` still omits from its own "deliberately held"

1. **The 3 rows in `c2-clipping.json`'s `held[]`** — `2846:21652`, `2846:21650`,
   `2846:21682`, the open **H1** question: is "The thread and the prompt you
   typed stay on screen behind this state…" product copy or C4 engineering
   annotation? It is third-person, about "the user", and matches the shape C4
   describes. The F06 resizes **revealed** all three (`qa-containment` prints all three
   as "now inside"); if the answer is *annotation*, the repair made three
   engineering notes render on product boards and three parents are 88/72/88px
   too tall. `QA-CLOSURE.md` records this under F06; `IMPLEMENTATION.md` does not
   mention it anywhere.
2. **The 2 dropped F02 rows.** `:13` says held rows were "carried not dropped".
   `c8-assembled#0/#1` were dropped to `fix-queue-needs-review.json` because
   `normalize-plans.mjs:119` requires `r.id`, so a selector-only `fill`
   matches no branch and falls through to needs-review.
3. **`FOUND-WHILE-VERIFYING.md`'s eight defects get zero rows and zero mention.**
   Verified absent from `fix-queue.json`: `1753:8438` ("Revoke link" 25px below a
   clipping board), `1720:17491`, the four `1170:4713` delete-glyph × chevron
   overlaps (`1753:8421/8413/8405/8397`), `2865:22216` × `2865:22215`,
   `2429:21289` vs `2987:21970`, `199:296` × `199:288`. Only the section-count
   row of that table is referenced (via F22).
4. **The six unread S7 Settings boards.** `c8-assembled.json`'s
   `not_authored.F15_unread_boards` names `638:3070`, `639:2754`, `639:3443`,
   `639:4144`, `640:3488`, `1138:13436` and estimates "18 more delete rows of the
   same shape". None is in any `b*.tsv`. `QA-CLOSURE.md` carries it under F15;
   `IMPLEMENTATION.md` does not.
5. **The 82 unguarded writes** (§4.3).

### 5.4 Structural work the queue cannot do — verified

The list at `:65-73` checks out: the auto-layout modal footer (M05's real fix),
a hug-width Button main component (F10, 7 instances), `insertChild` for M17's
label, and F14's rail/location-line/back-to-canvas assembly, which
`c8-assembled.json`'s `not_authored.F14` documents in full and sequences after
F02/F15/F16. Add to it: `2881:12608`, the only resize whose containment could not
be checked at all, and `1170:4777`, whose box is in no dump.

### 5.5 The code change F15 actually needs

`AquibraStudio.tsx:710-729` renders the status footer as an unconditional flex
sibling of the whole shell, outside `.layout-shell`. `LayoutShell.css:286-294`
(`.layout-shell--fullpage`) re-declares `grid-template-areas: "rail fullpage
fullpage fullpage"` with no `footer` area, and `:311-320` hides only
`__drawer`/`__canvas`/`__inspector` — neither rule can reach a node that is not in
the grid. `LayoutShell` already exports the correct destination: `Footer`
(`LayoutShell.tsx:167`, displayName `:177`, registered `:332`), used by nothing but its own
test. Moving `<StudioFooter>` into `<LayoutShell.Footer>` inside
`StudioPanels.tsx`'s shell puts the footer under the fullpage grid rules and
drains the dead slot in one change. **Until that lands the 18 hidden board texts
are a corrected drawing of an uncorrected editor**, and `git status` confirms
neither file is modified.

---

## 6. What is properly supported — stated plainly

- **The ledger is real and complete.** 100 entries, 95 `OK` + 5 `SAME`, 0
  `DRIFT`/`REFUSED`/`MISSING`; every key reconciles with a live queue row and no
  live row is missing one. `OK` is emitted only on a post-write read-back
  equality check. This is the strongest evidence in the arc and it says what the
  document says it says.
- **The hold guard worked.** All 23 held rows have zero ledger entries.
- **Nothing was silently dropped at normalization.** The 2 unclassifiable rows
  went to `fix-queue-needs-review.json` by design, and `validate-fixplans.mjs`
  runs clean on the current plans (131 rows, 95 target nodes, 0 problems).
- **Bugs 3 and 4 are real and correctly arithmetic'd**, and the `>2000` move
  guard now exists.
- **The F15 code diagnosis is accurate**, line for line, against the current
  source.
- **`VERDICTS.md` claims no fixes and its measurements re-derive exactly.**
- **`QA-CLOSURE.md` (20:35) is an honest document** and already corrects most of
  what `IMPLEMENTATION.md` originally omitted. The items in §5.3 and the two
  numbers in §1 are what it does not reach.

## 7. The three lines to correct

1. `IMPLEMENTATION.md:12` — **executable 106 → 100** (+ 6 blocked on a lookup).
   `apply-queue.mjs` calls those 6 *unusable*.
2. `IMPLEMENTATION.md:4, :15` — **6 calls is the batch price, not the spend.**
   The ledger says 16 were charged. Say both.
3. `IMPLEMENTATION.md:13` — **"carried not dropped" is false for 5 held rows**:
   2 dropped to `fix-queue-needs-review.json`, 3 never left `c2-clipping.json`'s
   `held[]`, and those 3 carry an open question (H1) that the F06 repair has
   already pre-empted in one direction.
