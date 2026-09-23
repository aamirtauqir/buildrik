# Board coverage — the honest figure

**206 of 628 boards on page `1:3` carry a change from this arc. That is 33%.**

All 294 V2 findings have a verdict, and that is a different measurement. A
finding is resolved when its claim is answered; a board is covered when the
change actually reaches it. The gap between the two numbers is steps 4 and 5 of
the founder's brief — *"check whether the same issue appears elsewhere in V1"*
and *"apply the fix everywhere it is relevant"* — which the module passes did
per-finding, on the board each finding named, and not across the siblings that
show the same defect.

Measured 2026-09-07 by walking every section and asking whether any node this
arc created or wrote lives inside each board.

| coverage | boards | section |
|---|---|---|
| 100% | 8/8 | 14 · Preview |
| 100% | 3/3 | 26 · REVIEW · Insert |
| 75% | 41/55 | 05 · Media |
| 67% | 32/48 | 21 · Settings/S7 |
| 67% | 12/18 | 15 · Publish |
| 63% | 12/19 | 02 · Insert |
| 61% | 17/28 | 06 · Content |
| 61% | 14/23 | 04 · Pages |
| 47% | 15/32 | 01 · Shell |
| 40% | 14/35 | 16 · History |
| 33% | 6/18 | 03 · Layers |
| 26% | 5/19 | 12 · AI |
| 25% | 2/8 | 13 · Command palette |
| 20% | 1/5 | 22 · Ecommerce |
| 17% | 6/35 | **07 · Brand** |
| 17% | 1/6 | 20 · Notifications |
| 15% | 6/40 | **08 · Inspector** |
| 13% | 3/23 | **18 · Review** |
| 13% | 1/8 | 17 · Compare |
| 13% | 2/15 | 09 · Canvas |
| 10% | 1/10 | 19 · Client sign-off |
| 5% | 4/74 | **23 · Journeys · S-flows** |
| 0% | 0/14 | 11 · Templates |
| 0% | 0/13 | 24 · Notes |
| 0% | 0/10 | 10 · Components |
| 0% | 0/3 | 28 · Library · shared chrome |

Out of scope by construction and correctly at 0%: `25 · Reference`,
`27 · Archive`, `29 · Reference · UX analysis docs` — reference and archive
material, not product screens.

## What the low numbers mean, per section

They are not all the same problem:

- **Sibling sweeps not done** — Inspector (6/40), Brand (6/35), Review (3/23),
  Layers (6/18), History (14/35). A finding was fixed on the board it named
  while the same defect repeats on the state boards beside it. This is the
  largest and most mechanical share of the gap.
- **Mirror boards** — `23 · Journeys` (4/74) redraws module screens as S-flow
  steps. A correction to a module panel is owed to the journey step that shows
  the same panel, or the two disagree.
- **Never audited** — `11 · Templates`, `10 · Components`, `28 · Library`,
  `24 · Notes` drew no findings in the UX lanes at all. Zero coverage there is
  not a failure to apply; it is a gap in the audit, and it should be stated as
  that rather than counted as done.

## The metric has two halves, and only one of them was being counted

The 33% above counts a board as covered when **a node inside it** was written.
That undercounts, and the inspector/layers sweep proved it: the file's own
convention for commentary is a **caption BELOW the board**, parented to the
section — not a node inside the board, which on a full 812-tall auto-layout
panel would land out of bounds anyway. By the inside-only metric that sweep
moved Layers 6/18 → 7/18 while it had in fact given six more boards a record of
the defect they show.

Both numbers are worth having and they answer different questions:

| metric | question |
|---|---|
| **A — node written inside the board** | did the drawing itself change? |
| **B — the board carries a record of the defect it shows**, in its own name or its own caption | does the screen now tell the truth about itself? |

For the two sections swept first: Layers **A 6→7 of 18, B 7→13 of 18**;
Inspector **A 7→7 of 40, B 17→24 of 40**.

Neither number is the goal on its own. A board whose drawing is correct and
whose caption says so is done; a board with a caption and an uncorrected drawing
is not, and the report for each sweep says which it is.

## Found by sweeping, not by the audit

Three things no V2 finding names, surfaced only because someone walked the
siblings:

- **`reports/layers.md` is wrong** that every row on every Layers board is an
  instance of the tree-row master. Five boards draw their own rows, with the eye
  and lock as **10×10 TEXT nodes 16px apart** — smaller than the master's 20×20,
  and unlike the master they are reachable from page `1:3`. Measured and
  recorded; the geometry is not yet fixed (~120 nodes, a drawing pass).
- **`1171:4829 Layers · display-settings` draws four options; the code ships
  three.** *Show hidden layers*, *Show lock badges* and *Highlight CMS-bound* do
  not exist in `LayerDisplayPrefs` (`types.ts:60-67`). Marked.
- **`UX-D-19` / `UX-H-16` were swept across all 48 boards of both sections and
  applied to none — correctly.** No board draws the T/M breakpoint badges; the
  four name-hits are a row label, a lock-badge toggle, and the inspector's own
  working breakpoint pill. A null result that was checked rather than assumed,
  which is the distinction this arc keeps having to pay for.

---

# After the four sweeps — agent-reported, NOT re-measured

**The re-measure did not run.** `measure-coverage.mjs` exists and is the tool for
it, but the daily Figma cap bit on the sweep's eleventh call. Every figure below
is the number each sweep computed from its own read-backs, and it should carry
that caveat until the tool is run in the next window:

```
node scripts/figma/measure-coverage.mjs --json=docs/design-jobs/V2-TO-V1/coverage.json
```

| section | before | after (reported) |
|---|---|---|
| 20 · Notifications | 1/6 | **6/6** |
| 28 · Library · shared chrome | 0/3 | **3/3** |
| 22 · Ecommerce | 1/5 | **5/5** |
| 11 · Templates | 0/14 | **7/14** |
| 10 · Components | 0/10 | **6/10** |
| 17 · Compare | 1/8 | **5/8** |
| 07 · Brand | 6/35 | **14/35** (worst case 12 — two also appear in a pre-arc plan) |
| 03 · Layers | 6/18 | **7/18** by metric A · **13/18** by metric B |
| 08 · Inspector | 7/40 | **7/40** by metric A · **24/40** by metric B |
| 09 · Canvas | 2/15 | **3/15** |
| 23 · Journeys | 4/74 | **6/74** |
| 19 · Client sign-off | 1/10 | **2/10** |
| 18 · Review | 3/23 | **3/23 deliberately** — 20 boards examined and cleared |
| 13 · Command palette | 2/8 | **2/8** — nothing inside a palette board was wrong |

Roughly **248 of 628 by metric A (~39%)**, materially higher by metric B. Not
100%, and the sections that moved least are the ones where sweeping correctly
found nothing to change.

## What the sweeps fixed that no finding had named

- **The Library stacking defect.** All 21 variants in `28 · Library` sat at ONE
  point — Rail was seven 60×812 variants inside a 60×812 box, so the library
  showed one variant per component and every state was invisible. Now
  `distinctPositions` 7/7, 2/2, 12/12, nothing escaping its set or its section.
- **`FIG-F-57`** — `781:4433`'s live "+ Create component" footer hidden, since
  `ComponentsTab.tsx:93-113` returns before any footer.
- **`781:4372 Templates · load-error` marked**, not renamed: `TemplatesTab.tsx`
  has no fetch and no `isLoading`; what ships is an APPLY-error banner.
- **41 of 41 Brand conformance rows applied** — a resolved plan that had never
  been run. Two `#6B7380` repaints bound to `color/ink-muted`, 39 sub-11px nodes
  promoted to 11/16 across 19 boards. The published baseline checked out exactly.

## The measured finding worth carrying forward

**Binding is blocked by leading, not by binding.** The exact-match binder found
**496 nodes with no style to bind to** across three product sections, and the
same read shows off-leading counts of 161 and 72, overwhelmingly `AUTO` —
which no `--bk-leading-*` token can express. So `CONF-1-14`'s ordering is now
measured rather than assumed: the leading has to be fixed before the binding can
succeed. A ~400-node leading change was NOT fired blind on a spent quota; the
safe per-section procedure is in `plans/sweep-b-04-leading-blocks-binding.json`.

## Still not covered, named

43 of Brand's 51 boards never walked · Brand's off-size / off-leading /
off-token / 4px-grid figures **UNMEASURED before and after** · `CONF-1-19/-20/-22`
untouched · 66 of 74 Journey interiors unopened · the Notifications 280→360
re-lay recorded on all six boards but not performed · Review's 20 cleared boards
cleared on names, not interiors · **and no board in this entire arc has been
looked at at 1440×900.**

---

# Independently measured, 2026-09-07 — and it is a LOWER BOUND

`measure-coverage.mjs` completed a full paged walk of all 29 sections:

```
IN SCOPE   A 215/570 (38%)   B 301/570 (53%)
```

(570 in-scope boards; `25 · Reference`, `27 · Archive` and `29 · Reference` are
excluded as reference material, not product screens.)

**Both figures under-count, and by a knowable amount.** The touched-node set is
built from `queue-state.json`, which only records what `apply-queue` wrote. Every
bespoke script — `build-spec-boards`, `add-state-board`, `build-inspector-states`,
the sweeps' own repainters — leaves no receipt there. The proof is in the table:
`28 · Library` measured **0 of 3** in the same hour its three boards had their
variant-stacking defect repaired and read back.

The fix is written and did not get to run: the measurement now also harvests node
ids cited in `reports/*.md`, which widens the set from **778 to 1,477 nodes**
(778 applier read-backs + 699 additionally cited in reports). The re-run hit the
daily cap. Next window:

```
node scripts/figma/measure-coverage.mjs --json=docs/design-jobs/V2-TO-V1/coverage.json
```

The two sources are labelled separately on purpose and are not equal evidence: a
state-file entry is a read-back the applier took; a report line is an agent's
account of one.

| A% | B% | A/B of boards | section |
|---|---|---|---|
| 100% | 100% | 8/8 | 14 · Preview |
| 100% | 100% | 3/3 | 26 · REVIEW · Insert |
| 63% | **95%** | 12/18 of 19 | 02 · Insert |
| 67% | 83% | 12/15 of 18 | 15 · Publish |
| 56% | 83% | 10/15 of 18 | 03 · Layers |
| 75% | 76% | 41/42 of 55 | 05 · Media |
| 67% | 75% | 32/36 of 48 | 21 · Settings/S7 |
| 13% | 75% | 1/6 of 8 | 17 · Compare |
| 61% | 71% | 17/20 of 28 | 06 · Content |
| 61% | 61% | 14/14 of 23 | 04 · Pages |
| 40% | 60% | 14/21 of 35 | 16 · History |
| 28% | 55% | 11/22 of 40 | 08 · Inspector |
| 47% | 53% | 15/17 of 32 | 01 · Shell |
| 17% | 51% | 6/18 of 35 | 07 · Brand |
| 13% | 48% | 3/11 of 23 | 18 · Review |
| 20% | 40% | 1/2 of 5 | 22 · Ecommerce |
| 26% | 37% | 5/7 of 19 | 12 · AI |
| 25% | 25% | 2/2 of 8 | 13 · Command palette |
| 0% | 21% | 0/3 of 14 | 11 · Templates |
| 10% | 20% | 1/2 of 10 | 19 · Client sign-off |
| 5% | 19% | 4/14 of 74 | 23 · Journeys · S-flows |
| 17% | 17% | 1/1 of 6 | 20 · Notifications |
| 13% | 13% | 2/2 of 15 | 09 · Canvas |
| 0% | 10% | 0/1 of 10 | 10 · Components |
| 0% | 8% | 0/1 of 13 | 24 · Notes |
| 0% | 0% | 0/0 of 3 | 28 · Library — **measured 0, actually repaired; see above** |

## What is honestly still owed

This is the list, and none of it is blocked on anything but the daily allowance:

1. **Re-run the measurement** with the widened evidence set — one command, ~7 calls.
2. **Journeys**: 66 of 74 interiors unopened. It mirrors module screens, so every
   correction made this session may have a stale twin there.
3. **Brand**: 43 of 51 boards never walked; its off-size / off-leading /
   off-token / 4px-grid figures are **UNMEASURED before and after**.
4. ~~**Notifications 280 → 360**~~ — **DONE 2026-09-07.** All six boards re-laid
   frame AND interior by `relay-panel-width.mjs`: right-aligned nodes re-seated
   to their original right margin, wrapping copy re-measured, **0 out-of-bounds**,
   each read back `OK`. Invariants unchanged afterwards (0 board overlaps — the
   column pitch is 400, so +80 fits).

   The fix then made all six board names FALSE — they still read "the 280→360
   re-lay is NOT taken here" and, on `165:2`, "drawn 280 wide". Both wordings
   corrected by `fix-notifications-relay-claim.mjs`, idempotent, all six now
   read back clean. **A board made to lie by its own fix is worse than the
   original defect**, and it is the reason that script exists rather than a
   hand-edit.
5. **Leading before binding**: 496 nodes have no style to bind to, and the block
   is `AUTO` leading (161 and 72 off-leading nodes in two sections). Procedure in
   `plans/sweep-b-04-leading-blocks-binding.json`, deliberately not fired blind.
6. **Review's 20 cleared boards were cleared on names, not interiors.**
7. **No board in this arc has been looked at at 1440×900.** A read-back proves a
   write landed, not that a board reads correctly — which is exactly how one
   board came to be named `APPEND to whatever the current name is: "…"` and was
   logged `OK`.

---

# Journeys: read in full, and the mirror problem is NOT there

`23 · Journeys` was the largest gap on the page — **66 of 74 interiors
unopened**, and the section that worries most, because it redraws module screens
as flow steps. A correction made to a panel could easily leave a stale twin here
saying the opposite.

**All 74 boards are now read: 3,377 TEXT nodes**, captured by
`discovery-pass.mjs` and filed in `DISCOVERY.md`.

Every claim this session corrected elsewhere was then searched across all 3,377
strings, by exact text rather than by pattern:

| corrected claim | stale twins in Journeys |
|---|---|
| a cancelled publish deployed "nothing" | **0** |
| `TEMPLATE PAGE` / "Choose a page" control | **0** |
| Insert `RECENT` band / "Recently used" | **0** |
| Settings in-body "Save headers" / "Save locales" | **0** |
| "Jump to 14:32" timestamp that silently restores | **0** |
| the Milestones / All changes split | **0** |
| `Drawer slot · 320` | **0** |

**None of them appears anywhere in the section.** The mirror problem is not
present for these corrections — and that is a checked result, not an assumption:
the first pass used loose regexes and produced five hits that turned out to be
the words "Gap" and "Fill" and a 62-character heading containing "320". Re-run
against exact strings, it is zero.

What this does NOT say: Journeys is not thereby conformant. It says the specific
things corrected this session have no contradicting twin there. Its own defects —
`817:5220`'s seven-step pipeline against the worker's five, `813:4836`'s five
save-states against six, `817:5114`'s unresolved duplicate of History › All
changes — were found and fixed or filed separately.

---

# Review: the 20 "cleared on names" boards, now checked on interiors

The Review sweep cleared 20 boards without opening them, and said so. All 23 are
now read (`DISCOVERY.md`, 278 TEXT nodes), so the clears could be tested.

**`UX-I-21` — the clear holds.** A crude search found "Compare" inside 13 of the
23 boards, which looked like the sweep had missed a sibling on every one. It had
not: all 13 strings are the button **"Compare with approved"** — the DOOR into
Compare, not the Compare surface. `UX-I-21` is about the Compare SCREEN being
mounted in a 280 drawer, and the sweep's "none draws Compare" meant exactly that.

The two boards that *do* draw it — `1717:17235` and `1717:17246` — already carry
the whole finding in their own names: that `ApprovedCompareView` renders inside
the Review drawer at 280 collapsed / 700 expanded
(`ReviewTab.tsx:497-532`), that these boards record what the CODE does today,
that the proposed fix is the §17 Compare family drawn 1080 wide on the canvas
surface, and that `SPEC-NAVIGATION`'s 560 remains an open decision against the
700 the code ships.

**`UX-I-26` and `UX-I-24`: zero interior hits**, matching the sweep's own
verdicts.

The point of the exercise: a clear made on names is weaker evidence than one made
on interiors, and this one survived the upgrade. It is also why the first search
was re-run — "13 boards show the defect" and "13 boards show the button that
opens it" are different claims, and only reading the strings tells them apart.

---

# The 4px grid, measured offline — and 105 boards snapped

`DISCOVERY.md` carries every board's geometry, so the 4px-grid class could be
measured with **zero Figma calls**:

| section | off-grid boards | off-grid TEXT |
|---|---|---|
| 23 · Journeys | 74 of 74 | 2545 of 3377 (75%) |
| 07 · Brand | 25 of 35 | 431 of 612 (70%) |
| 18 · Review | 6 of 23 | 171 of 278 (62%) |
| 20 · Notifications | 0 of 6 | 26 of 40 (65%) |

**The drift is entirely vertical.** Every board column is on-grid; only rows are
off, and they cluster — Journeys' off-grid boards sit on six shared rows,
Review's six on a single row at `y=1310`. That shape is the signature of rows
being moved as a unit, not of boards drawn carelessly.

**And some of it was mine.** `reflow-caption-overflow.mjs` moved rows by
`Math.ceil(shortfall)` — whatever the overflow happened to be, in a page whose
geometry is 4px throughout. It now rounds up to a multiple of 4, so it keeps the
clearance it asks for without taking an on-grid row off the grid.

**105 boards across 25 rows were snapped**, each moved DOWN by 1–3px so the gap
to the row above only grows. All 105 read back `OK` in one call.

The TEXT percentages are deliberately not acted on: a text node's x/y are
relative to its PARENT, and its vertical position is usually set by line-height
rather than a grid, so "70% off-grid" there is a weaker signal than the board
figure and would need reading before it meant anything.

## A bug in my own budget guard, found by it blocking real work

`apply-queue.mjs` wrote `spend = 200` the moment Figma returned the cap string.
The cap **trickles** — one or two calls return within minutes — so that line
poisoned the script's own counter and made every later run refuse on its own
guard while Figma would have answered. The 105-row grid snap was blocked by
**my code, not by Figma**, and landed in full the instant the guard was raised.

Now it records `capSeenAt` and lets the next run ask. Same lesson as the rest of
this arc, turned on the tooling: a refusal is a fact about one call, not a
measurement of what is available.

---

# 2026-09-07, later — what the last window bought

## Brand's conformance figures are MEASURED. They were the last UNMEASURED claim.

`sweep-b-section-scan.mjs 1776:8373`, one call, whole section:

| measure | 07 · Brand |
|---|---|
| nodes / TEXT | 1,430 / 629 |
| bound to a type style | **302 (48%)** |
| type below 11px | **0** |
| weight over 600 | **0** |
| off the type ramp | 10 |
| off the leading ramp | 273 |
| paints off the token set | 42 |
| off the 4px grid | 826 |

The two that matter most are the two that are zero: no sub-11px type and no
weight over 600 anywhere in the section. `offLead` is dominated by `AUTO`, which
is the known blocker on binding — 496 nodes across the page have no style to bind
to while their leading is `AUTO`.

### It also surfaced a THIRD accent.

Three nodes paint `#3F83F8` — Flowbite blue-**500** — on `btn/primary`,
`progress-fill` and a `running…` label. The file's second accent (blue-600
`#1C64F2`, in the Button master) was found and fixed earlier by
`fix-button-accent.mjs`; this is a different rung again, hardcoded rather than
inherited. DESIGN.md allows one blue, `#1A56DB`.

**Not yet drained, and not to be drained blindly.** The same section paints
`#EF4444` and `#1F2937` on nodes named `swatch` — those are *content*, a chip
showing a customer's colour, and `drain-offtoken.mjs` refuses anything named
swatch for exactly that reason (it was written after a fix painted a chip accent
blue and made it contradict its own `#E2E5F8` caption). The three `#3F83F8`
nodes are accent-role by name and are safe; the page-wide sweep for other rungs
is not done, and no other section has been paint-scanned at all.

## A live self-contradiction, found by widening the cross-check

The first cross-check searched 4,307 **TEXT nodes** and reported zero stale
claims. It was clean and it was not sufficient: **a board's name is not a TEXT
node**, and on this page the name is where most of the arc's findings were
written. 138 board names had never been searched.

Searching them found it at once. Five of the six Notifications boards said in
their own names *"drawn 280 … the 280→360 re-lay is NOT taken here"*. All six
measure **360×812** live, interiors re-seated, right edge exactly 360. They had
been contradicting themselves since the re-lay landed.

**And a script to fix precisely this already existed and had reported success.**
`fix-notifications-relay-claim.mjs` carried two match strings; the boards use
three wordings. It corrected what it matched, skipped the rest, and exited 0.
The third wording is now in its pair list; five boards corrected, read back, and
the sixth was already clean.

Two things follow, and neither is comfortable:

1. **A green run proves the rows it matched, not the rows it meant to match.**
   This is the fifth distinct costume of the same failure in this arc.
2. `DISCOVERY.md`'s `1779:2` section is a **stale capture** — pre-re-lay geometry
   and names. It is now labelled as such in the file. Nothing should be planned
   against it.

## The 38 rows that never landed are now decided, not just counted

`queue-state.json` holds 968 rows; 930 landed. The other 38 are itemised in
`UNRESOLVED-ROWS.md`: **3 correctly refused** (a guard catching a false width, two
moves against auto-layout parents), **9 undetermined** (deletes whose absent
target is indistinguishable from success without a read), and **24 genuinely
unfinished** — Insert hotspots left pointing at placeholder tokens like
`UNRESOLVED-ID`, the six Pages state doors already carried as PARTIAL, and two
`Content · dynamic-pages` boards that were never drawn (a builder for them
exists and is queued).

24 of 968 is 2.5%, and it is concentrated in three places rather than smeared.

## A verified live code defect, found by checking a board's claim

Board `817:5220` asserts the publish worker emits step status `active` while
`PublishTab.tsx:251` looks for `running`. **True at HEAD, and understated** —
`STEP_WORD` also has no key for `active` *or* for `skipped`, so the in-flight
step and every deliberately-skipped step both render blank. `grep '"active"'`
across the publish tab returns nothing. Written up in
`VERIFIED-CODE-DEFECT-publish-steps.md`; **not fixed** — this arc's scope is the
Figma page, and a vocabulary change on a publish path deserves its own review.
The fuller statement is queued as a band for the board.

## Still owed, unchanged

**No board in this arc has been looked at at 1440×900.** The tool now exists
(`shoot-boards.mjs`, writes PNGs the session can open) and six boards are queued
behind the cap. Until that runs, every claim in this document rests on read-backs
and measurements — which is exactly the evidence that said `OK` to a board named
`APPEND to whatever the current name is: "…"`.

---

# The first two boards looked at, and what looking cost the tooling

Two boards have now been screenshotted and read (`SHOTS.md`). The acceptance test
paid for itself on the first one and then again on the second.

## Board 1 found a defect the read-backs could not

`165:2` showed a row title running into its timestamp. Measured:
`render-defects.mjs` returned **six OVERPRINTs across the two Notifications
boards that have rows, every one exactly 14px**. Uniform overlap is the
signature of a formula, and the formula was mine — `relay-panel-width.mjs` grew
each title flush to the widened panel's right edge with no gutter for the meta
beside it. Both the damage and the cause are fixed.

Three read-backs had already said this board was 360 wide with 0 out-of-bounds.
All three were true. None of them could see a timestamp sitting under a string.

## Board 2 turned a section's numbers into a defect list

`1333:7162` prompted the same measurement on Brand: **12 defects** —
3 `Card / starter` instances 20px past their container, 1 text overprint,
6 rows clipped (`needs 32px, has 28`), 2 instance children escaping by 30px.
Before today Brand's only numbers were the conformance census.

## Four bugs in my own tooling, in one afternoon

Every one reported success or silence at the time:

| tool | bug | how it presented |
|---|---|---|
| `fix-notifications-relay-claim.mjs` | carried 2 of the 3 wordings on the boards | exited 0 having fixed some; five boards kept asserting 280 |
| `relay-panel-width.mjs` | grew titles flush to the panel edge | 0 out-of-bounds, 6 overprints |
| `build-dynamic-pages-boards.mjs` | `/^dp\//` — an odd-parity escape JS eats before Figma sees it | `SyntaxError: unexpected token in expression: '.'` pointing at `.test`, nowhere near the cause |
| `add-finding-band.mjs` | took its width from the STYLE donor | a 227px band on a board ten times wider, wrapped 272 tall, straight off the bottom |
| the trickle runner | treated "did not hit the cap" as "succeeded" | marked a throwing script DONE, twice |

The escaped-slash class is now a lint rule beside the backtick one — and that
rule's own first version flagged 28 correctly-doubled escapes, because it matched
two characters instead of counting backslash parity. It was noise for exactly one
run, which is the thing this file's linter header warns about in writing.

**The pattern under all five: a green result describes the rows a tool matched,
never the rows it meant to match.** That has now appeared in five distinct
costumes in this arc, and it is the reason coverage here is reported as a
measured lower bound rather than a percentage anyone should quote.

## The loop closed once, properly

The Notifications overprint is the first defect in this arc to go the whole way
round — **seen, measured, repaired, and then re-measured by the detector rather
than by the fixer's own report**:

| step | evidence |
|---|---|
| seen | `165:2` screenshot: row 1's title running into the timestamp column |
| measured | `render-defects.mjs 1779:2 --fresh` → **6 OVERPRINT, 14px each** |
| caused | `relay-panel-width.mjs` grew titles to `parentWidth - x`, no gutter |
| repaired | `fix-overprinting-titles.mjs` with the six measured pairs |
| root cause fixed | the growth now stops 12px short of the nearest right-hand sibling |
| **re-measured** | `render-defects.mjs 1779:2 --fresh` → **0 defects** |

The re-measure matters more than the repair. The repair ran in a shell whose
output went to `/dev/null`, so there was no record of what it did — and rather
than assume, the section was measured again from scratch. **A fix with no
evidence is not a fix**, and this arc has already logged `OK` on a board named
`APPEND to whatever the current name is: "…"`.

## Brand: 12 measured, 5 repaired, 1 refused

`fix-clipped-text.mjs` (new — nothing in the repo repaired the CLIPPED class)
un-clipped five of the six Brand text nodes, 28 → 32px each. The sixth,
`154:25`, was **REVERTED by its own guard**: letting it grow to the 48px its
glyphs need would have pushed it 12px out of its parent, trading a clipped
descender for an overflow. It needs a layout change, not a resize, and is
recorded as such rather than forced.

That guard exists because two fixers in this arc did exactly the damage it
prevents — one created six overprints while fixing a width, another squeezed
three nodes to 40px while clearing overprints.

Remaining in Brand: 3 `Card / starter` instances 20px past their container,
1 text overprint, 2 instance children escaping by 30px, and the one reverted
clip. Six, down from twelve, all named.

## The state file gave a false negative in the other direction too

`queue-state.json` under-reports coverage because bespoke scripts leave no
receipt in it. Today it also over-reported the backlog, from the same fact.

I found ~46 unlanded rows carrying a `{selector}` and no node id, each filed by
`apply-queue` as *"unresolved node id — run resolve-selectors first"*, and
concluded they were the largest remaining block of real work, blocked on a tool
nobody had run. The tool was run. **`history-text.json` resolved 0 of 28 — every
selector matched nothing**, and `settings-text.json` 0 of 31.

Reading the boards settles it: the History chips already read **"Saved versions"**
and **"This session"**. The unresolved rows are searching for **"Milestones"** and
**"All changes"** — the strings they were authored to replace, which sibling rows
in the same plan had already replaced.

They are obsolete, not pending.

`never attempted` in that file means **"this ROW never ran"**, never *"this work
never happened"*. Both readings of it have now been wrong in this arc, in
opposite directions, within a few hours of each other — and in both cases the
only thing that settled it was reading the file itself.

---

# The page-wide render sweep — 413 defects, 29 of 29 sections

Triggered by the fifth board looked at. `1705:8704` (Review · reply-composer)
showed hint text running under a right-aligned Send button — the identical shape
as the six overprints repaired in Notifications, in a section that had nothing to
do with the re-lay that caused those. So the class was never an artifact of my
tooling. `render-defects.mjs` had said so in its own docstring, calling the toast
catalog *"latent — it survives only because its strings happen to be short
today"*.

The brief's rules 4 and 5 are explicit: check whether the issue appears elsewhere,
and apply the fix everywhere it is relevant. Only a page-wide measurement can say
where. **Complete sweep, all 29 sections read, nothing rate-limited:**

| class | count | what it is |
|---|---|---|
| CONTAINER | 173 | a child spilling past its clipping container |
| **OVERPRINT** | **94** | two siblings printing on top of each other |
| TEXTOVER | 83 | text past its parent frame |
| ESCAPES | 38 | a node past its PARENT's width (the board check is blind to this) |
| OUT | 12 | out of the board entirely |
| CLIPPED | 9 | fixed-height text whose glyphs are cut |
| UNMEASURED | 4 | clone or font failed — clipping NOT checked, reported rather than passed |
| **total** | **413** | across **29 of 29** sections |

## What that number means for this arc's claims

**I found 6 overprints. There are 94, across 51 boards.** The six in Notifications
were 6% of the class, and I would have closed the arc believing they were the
whole of it — because they were the ones a screenshot happened to show me.

Worst sections: `1776:8381` (62), `1776:8388` Journeys (60), `1776:8372` (50),
`1776:8374` History (44), `1776:8385` (32), `1084:4527` Templates (29).

This is the measured form of the founder's *"sari screens per ni hoi changes."*
It was correct, and it stayed correct after every pass this arc ran, because
nothing until now had asked the whole page a question that could return a number.

## What is being repaired, and what is deliberately not

The 94 OVERPRINT pairs split by overlap size, and the split is a judgement about
what the fixer can honestly do:

- **49 pairs at ≤60px** — the classic title/meta collision: a full-width title
  and a right-aligned timestamp, count or tag with no gutter reserved. This is
  exactly what `fix-overprinting-titles.mjs` computes, and it carries a floor
  that refuses any repair taking a node below 60% of its width or 80px. Queued in
  two batches, followed by a **re-measure with the detector** — the fixer's own
  report is not verification, and the Notifications loop only closed because
  `render-defects.mjs` was run again.

- **45 pairs above 60px**, including twelve at 248px and three at 268px, are
  **held for a human read** in `plans/overprint-large.json`. An overlap that size
  is far more likely two nodes that genuinely stack than a missing gutter, and
  "shrink the left one to the gap" is meaningless there. The floor would refuse
  most of them anyway; holding them back means the refusals are a reviewable list
  rather than noise mixed through a run.

The other 319 defects — CONTAINER, TEXTOVER, ESCAPES — have no proven fixer in
this repo and are **not** being auto-repaired. They are measured, itemised by
node, and listed. Inventing a bulk fixer for 173 container overflows at this
point would be the exact move that produced six overprints while fixing a width.

## The overprint arc, closed and measured

| step | evidence |
|---|---|
| seen | `165:2` screenshot — a row title running into its timestamp |
| measured (one section) | 6 OVERPRINT, 14px each |
| **measured (whole page)** | **94 OVERPRINT** across 51 boards, in a complete 29-of-29 sweep |
| triaged | 49 at ≤60px to the fixer; 45 above held for a human read |
| repaired | 32 |
| refused by the fixer's own floor | 16 (a frame, and pairs starting at nearly the same x) |
| **re-measured** | **407 → 376 like-for-like across 22 comparable sections** |
| regressions found by the re-measure | **1** |
| regression closed | `2866:21840` back to 271×16 in its 20px parent, overflow −4 |

**Every number above is a detector reading, not a fixer's self-report.** The
fixer said 32 clean repairs; only the re-run showed that one of them was a net
loss — a 6px horizontal overlap traded for a 12px parent overflow.

### Four bugs in the fixer, found in four consecutive runs

Each one produced a plausible-looking result:

1. `loadFontAsync(title.fontName)` — `figma.mixed` on a multi-font node. The
   sandbox threw at line 22 and returned **zero rows** for 25 pairs.
2. `title` can be a **FRAME**. The sweep's OVERPRINT class reports any two
   intersecting siblings, not text-on-text.
3. The `OK` was pushed **before** the mutation, with no try/catch — so one throw
   aborted the loop and the batch returned nothing while reporting "repaired: 0".
4. Moving the report after the mutation made every row print `w92 -> 92` — the
   post-resize width twice, which reads exactly like a no-op on repairs that
   were real.

Plus the missing guard the re-measure caught: narrowing a title makes it taller,
and a taller text can leave its parent. `fix-clipped-text.mjs` already carried
that guard; this file did not until it had done the damage.

### What the last one turned into

The regression could not be reverted by any width, and reading the geometry said
why: the parent is a **20px row**, the chevron sits at x276, and the string
`"3 ELEMENTS SELECTED   [not-implemented]"` needs more than the 248px that
leaves. **No width both clears the chevron and fits one line.** The fix was to
restore self-sizing, and the underlying defect is editorial — a
`[not-implemented]` marker appended to a row label that cannot hold it. Recorded
in `OVERPRINT-LARGE-REVIEW.md`, deliberately not guessed at.

### The verification gap, closed exactly

The whole-page re-measure stalled two sections short. Rather than leave that as
"2 of 29 unread", the two were identified and only one turned out to matter:

| section | defects before | contains a repair? | re-measured |
|---|---|---|---|
| `2040:8372` | **0** | no | not needed |
| `1938:8372` · Components | **6** | **yes** — `1712:8430 x 1712:8431`, a 15px overprint on `Components · create (modal)` | **yes, targeted** |

The targeted read came back: **6 defects, and the pair is still overlapping by
15px.** That repair did not land — it was one of the sixteen the fixer's floor
refused, and I had been carrying it in the "32 repaired" count without evidence.

### The final arithmetic, all of it detector-measured

```
before, 29 of 29 sections ......... 413
after,  27 of 29 sections ......... 376
1938:8372, measured separately ....   6   (unchanged)
2040:8372, 0 before, untouched ....   0
                                    ----
after, full page .................. 382     413 -> 382, net -31
```

The net is **−31**, not the −32 the fixer claimed. The difference is exactly this
pair. And the one regression the re-measure caught nets to zero either way: the
revert removed a TEXTOVER and restored the OVERPRINT it had traded away.

**382 is the current page total, and every digit of it is a detector reading.**
No section is unmeasured, and no repair is counted that a detector has not
confirmed.
