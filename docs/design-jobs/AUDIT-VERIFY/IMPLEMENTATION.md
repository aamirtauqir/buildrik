# Implementing the verified audit fixes into Editor v1

Five agents authored repair rows offline; none of them made a Figma call. The
whole arc executes in **6 calls** because `apply-queue.mjs` batches by op and
reads every write back in the same call.

| | |
|---|---|
| plan files | 5 (`fixplans/`) |
| rows authored | 134 (131 in `rows[]` + 3 in a `held[]` key no tool reads) |
| queued | 129 (2 selector-based fills went to needs-review) |
| **executable** | **100** |
| authored held | 28 — of which **23 were carried**; 5 were not |
| awaiting one selector lookup | 6 (counted as unusable, not executable) |
| batch price | **6 calls** — one per op-group |
| calls actually charged | **16** — the ledger's own `spend` for the day; ~10 were cap-trickle re-runs that produced no outcomes |

## Four things caught before anything ran — two of them toolchain bugs

Calling all four "toolchain bugs" overstated it, and a later QA pass said so.
**1 and 2 are toolchain bugs.** 3 is a plan-authoring error (a validator rule was
added *because* of it). 4 is a plan collision caught by a rule that already
existed. All four would have done real damage; only two were defects in the
tools.

1. **`hold` was honoured by nothing.** Neither `normalize-plans.mjs` nor
   `apply-queue.mjs` read the flag, so a row its author had deliberately
   withheld arrived in the queue indistinguishable from a live one. *Three
   independent agents hit this and each invented a different workaround* —
   `op:"advisory"`, a top-level `held` key, a `HOLD — DO NOT EXECUTE` prefix in
   `why`. Fixed in both scripts: the normalizer now carries `hold`/`holdWhy`,
   and the applier skips a held row instead of executing it.
2. **The fix above was itself incomplete, and the gap was live.** After adding
   the applier guard, four `#FFFFFF` fill rows still reached the queue unheld,
   because the *normalizer* dropped the flag before the applier could see it.
   Those rows would have painted a hero's heading and subtext white on a hero
   nobody had repainted — invisible text on two assembled boards.
3. **Three `move` rows carried absolute coordinates.** `move` writes
   `node.x`/`node.y`, which are parent-relative, while every box in the fresh
   dumps is an `absoluteBoundingBox`. `y=16024` would have thrown three chips
   ~16,000px down the canvas. Converted to the parent-relative `(201,10)` —
   independently the same on all three clone boards, which corroborates it.
   `validate-fixplans.mjs` now rejects any move coordinate past 2000.
4. **A cross-plan collision on `2850:22371`.** Two authors resized the same
   modal to different heights. Resolving it surfaced a defect the audit missed:
   the long in-use warning also overflows its clip by 8px on the **bulk** board
   `1175:4827`, where that string legitimately lives. M06's repair moved there.

## What is deliberately held

- **F02 — the hero fill.** `#1A56DB` is Buildrik's own accent; this hero belongs
  to the mock customer site. Painting a customer's hero in the product's brand
  blue is a category error, which makes the inspector sample the more likely
  wrong half. `fill` has no `expect` guard, so painting over an unread colour
  cannot be undone. One read settles it.
- **F01 — the Layers highlight.** No op in the toolchain sets an instance
  property or a fill on an instance sublayer, and all nine row frames are named
  `row`, so a selector returns `AMBIGUOUS(9)`.
- **F22 — section counts.** `order-sections.mjs` already derives them; the right
  answer is to run that script, not to hand-type 13 renames. The baseline was
  *already stale the day it was taken* — it records Inspector at 52 where the
  fresh read says 56.
- **F03 — re-parking the annotations.** The caption convention is measured, but
  `140:2`'s slot is already occupied and `add-caption` has no collision test.
  One read of section `1776:8377`'s children unblocks all three.
- **M17, F10, M13's second half** — each needs an op the runner does not have
  (`insertChild`, `layoutSizingHorizontal`, `setProperties`).

## Structural work the queue cannot do

A queue row edits one existing node. These need a build script:
the auto-layout modal footer (M05's real fix), a hug-width Button main component
(F10, 7 instances), inserting a label into an auto-layout board (M17), and
assembling the rail/location-line/back-to-canvas corrections into the shell
(F14). One is a **code** fix, not a design one: `AquibraStudio.tsx:710-729`
renders the footer outside the grid, which is why F15's canvas readout survives
into full-page Settings — and `LayoutShell.Footer` at `:332` has no production
consumer (only `LayoutShell.test.tsx:28`). **That code fix did not land**, so the
18 hidden board texts are a corrected drawing of an uncorrected editor.

**82 of the 100 applied writes ran unguarded.** `expect` is enforced only in the
`text` and `rename` builders; `delete`, `resize`, `move` and `fill` act on
whatever sits at the id. The guard that mattered most on this arc was therefore
the offline one — checking every `expect` against the dumps before spending a
call — not the applier's.

---

## What the first pass landed, and the hole QA found in it

**100 rows landed, 95 `OK` + 5 already-correct, 0 failed.** All six op-groups
executed; the 23 held rows were skipped by the guard and none ran. The
containment check re-derived the C2 arithmetic from the applied heights and the
dumped child boxes: **9 clipped frames resolved, 0 still clipped** — the AI
recovery route (32–120px outside its parent on three boards), the AI idle
paragraph (8px), and the History retention sentence on all five boards (16px
each) are now inside the frames that clip them.

Then the closure QA found the real defect in this arc, and it was mine:

> **16 of the 48 verified findings had no rows at all** — M09, M10, M11, M14,
> M15, M16, M18, M19, F04, F08, F09, F17, F20, F21, F24, F25. Not held, not
> deferred, not out of scope. Simply absent.

**The cause is one layer above the plans.** The five authoring agents were
scoped to `PLAN.md`'s eight causes, and that cause list names only 25 of the 48
findings. Seven of the remaining 23 are legitimately non-applicable (refuted,
off-page, duplicate, or a product-code change). The other 16 were dispositioned
by nobody. Each plan file was correct and complete *for the cause it was given*;
the brief dropped a third of the audit before any agent saw it.

That is the same failure this repo has recorded before — a green result
describing the rows a tool matched rather than the rows it meant to match —
promoted one level, from the queue to the plan. The guard against it is the one
QA applied: **enumerate closure from the verified finding list, never from the
plan list.** A plan can only be complete against a scope; only the finding list
knows what complete means.

Eight of the sixteen need no new capability and no new read. `F21` is the
sharpest: three live controls navigate into boards whose own names say RETIRED
or superseded, and `rewire` is an executable op that was simply never used.


---

## Final state

`apply-queue` reports **zero executable rows owed**. Everything the queue can
execute has executed.

| | |
|---|---|
| rows queued across 19 plans | 300 |
| **landed** | **243** — 238 `OK` + 5 already-correct |
| **failed** | **0** — no `DRIFT`, no `REFUSED`, no `MISSING` |
| withheld | 50 held + 6 awaiting a selector lookup |
| held rows that executed anyway | **none** |
| executable rows still owed | **0** |
| Figma calls spent | 58 |

**All 48 findings dispositioned:** 21 closed · 17 partial · 8 held · 2 refuted
(the refuted two correctly get no rows — repairing them would undo correct work).

Containment: **10 measurable defects, 10 resolved, 0 still clipped**, with 8
frames reported as *no child evidence — NOT a pass*.

### Closed by measurement after the first pass

- **F02.** The named read settled it: the hero's real fill is `#F3F4F6` on both
  boards, so the inspector's `#1A56DB` was the wrong half — as the hold argued.
  Had the original rows run they would have painted a customer site's hero in
  Buildrik's own accent and destroyed the true value unrecoverably, because
  `fill` has no `expect` guard. Both inspectors now read `#F3F4F6`.
- **F22.** A rename-only pass, because `order-sections.mjs:75` also does
  `s.x = 0; s.y = y` — a whole-page re-layout for a counting problem. Derived
  counts found **15** drifted titles, not the 13 the baseline knew: Layers
  29→35, Content 46→49 and Journeys 107→109 were invisible to a baseline that
  was already stale the day it was taken.
- **F25.** Measured for the first time — `reports/publish.md` had said in the
  first person *"I never read inside 817:4856"*. The console covered the bottom
  **100px of both** lower cards. It now sits below them; the board read back
  `1080x660`.
- **F03 + QA's R1.** All three Pages boards are `FIXED/FIXED`, so hiding the
  annotations shrank nothing and clipped no hotspot — QA's highest-consequence
  open risk, cleared. The re-park was declined on measurement: the caption band
  has 24px free and would need ~234px.
- **F20's status half.** The footer now reads "Tokens not saved" instead of
  "Brand is up to date", so the orange dot and the footer finally agree.

### Closed by the last reads

- **M13** — the read gave the frame the hold had been missing: `Button · Retry`
  `1706:8498`, a 55x28 `#1A56DB` pill. Hiding the *label* alone would have left
  empty accent chrome, which is why it was held. The pill is now hidden and
  Cancel moved flush to the footer's 16px padding, leaving the single-dismiss
  shape `AITab.tsx:266-281` actually ships. The door itself still needs a frame
  the runner cannot create, so M13 stays partial — honestly.
- **F04 reaches 12 of 12.** The twelfth board was held because a detector row
  said its Footer hung 100px below the board. The read refuted that: `2430:21397`
  sits at y21866-21910 inside a board ending 21946. The board is structurally
  identical to the eleven already repaired — same node names, same footer-relative
  offsets — and took the same three-band repair.
- **F24's last placeholder.** Held because a button label is sized to its own
  text and the box was unknown; the read shows a fixed 392px CTA frame, so
  "Look at Bella Cucina" fits with room to spare.

### Two code fixes, tested

- **F15** — `StudioFooter` takes `fullPage` and drops the selection readout and
  device/zoom control; `AquibraStudio` derives it from the tab `StudioPanels`
  already uses. This was the real bug: the footer renders as a flex sibling
  **outside** `LayoutShell`'s grid, so no `.layout-shell--fullpage` rule could
  reach it. Eighteen corrected boards now describe a corrected editor.
- **F11** — the Forms error is recoverable; `loadSubs` was already a stable
  `useCallback`. The test asserts the screen *recovers*, not that a handler fired.

34 tests green across both files.

### What genuinely remains

- **An op the runner lacks** — M17 (`insertChild`), M19 (`fontSize`), F10
  (`layoutSizingHorizontal`), F17 (a gradient paint: the read gave the thumb ids
  and then disqualified the fix, because `fill` writes a solid hex while
  `TemplateCard.tsx:88-93` paints a gradient plus a glyph).
- **A founder decision** — F19 (ship or retire Motion), M19 (re-scale the modal
  family), F11 (COVER-1-11 vs UX-I-32), F20's dot label (a measured space
  problem: 32px, occupied by the chevron), F21's third edge (cross-page NAVIGATE).
- **A build script** — F14, and only after F02/F15/F16 have settled.
- **Nothing was looked at.** No screenshot, no live render. By this repo's own
  rule that is the acceptance, and it has not happened for any of these boards.

---

## Looking at it — the acceptance that had not happened

Every claim above this line was arithmetic. The founder rule says the live
rendering is the acceptance, and for most of this arc it had not been done. It
has now, for the boards where a repair could most plausibly have gone wrong.
**Three screenshots found two defects no measurement on this arc could see.**

**1. The revealed paragraph was an engineering note (H1, answered).** The C2
author grew three clipping parents so their contents would render, and wrote
down an open question: are those paragraphs product copy or C4-class
annotation? Geometry cannot tell — both look identical to a containment check,
which is why the author refused to guess and held the alternative. The render
settles it. The string is *"The thread and the prompt you typed stay on screen
behind this state. Losing the user's words is a second failure on top of the
first."* No product tells a user that a failure is "a second failure on top of
the first"; it is third-person reasoning about the design. So the grow was right
to reveal what was clipped, and the note itself is now hidden on all three AI
boards, with each parent resized to its remaining content (156 / 230 / 188).
"Continue by hand in the inspector" — the affordance F06 was actually about —
stays revealed. Re-screenshotted after: correct.

**2. The destructive button still looked disabled.** M01 removed the typed
confirmation gate, correctly, and hid the hint that went with it. What no
arithmetic noticed is that the Delete button kept the *disabled treatment* that
gate had justified: the fill reads `#E02424` at full strength while the button
rendered washed out, i.e. node opacity. The dialog was offering a primary action
that looked unavailable with nothing left to explain why. Opacity restored to 1,
and the frame — still named `btn/Delete 34 files` on a single-file dialog,
because a text row cannot rename its parent — renamed to `btn/Delete`.
Re-screenshotted after: a full-strength enabled destructive action.

**3. M17 was right first time.** "Template Name" sits directly above its input in
the family's own style, and the board hugged to 169 as computed.

### Five ops added so held rows could execute

Four findings were held not because the repair was unknown but because this
toolchain had no op for it, and a fifth need surfaced from looking. Each
mutates, reads the node back, and reports the node's own value:
`font-size` (M19), `insert-text` (M17 — appending put the label below the
footer), `hug-width` (F10), `fill-gradient` (F17), `opacity` (M01's button).
`normalize-plans` and `validate-fixplans` were taught all five in the same pass;
the normalizer's own warning — *"add a classifier or they are lost"* — caught the
one that would otherwise have been silently dropped.

`validate-fixplans` also learned **supersession**: a row whose target already has
a landed row is not a collision, because the landed row is in the ledger and
cannot re-run. Without that it reported three false conflicts.

---

## Closing tally

| | |
|---|---|
| rows queued across 29 plans | 335 |
| **landed** | **276** |
| **failed** | **0** throughout |
| **executable rows owed** | **0** |
| Figma calls | 71 |
| boards screenshotted and inspected | 6 |

| | |
|---|---|
| **all executable work landed** | **30** |
| a held row still carries a real op | 13 |
| recorded only — no executable repair | 3 |
| refuted — correctly no rows | 2 |

## Six ops added, and what each unstuck

Findings were being held not because the repair was unknown but because this
toolchain had no op for it. Six were added, each mutating, reading the node back
and reporting the node's own value; `normalize-plans` and `validate-fixplans`
were taught all six in the same pass.

| op | what it closed |
|---|---|
| `insert-text` | **M17** — `add-text` appends, so in a VERTICAL parent the label landed below the footer. Inserting at an index put "Template Name" above its input. |
| `set-prop` | **F01, the audit's first finding.** The Layers rows are instances whose highlight is a VARIANT (`State=selected`), not a fill they own — so neither `fill` nor `text` could move it. |
| `hug-width` | **F10** — a 127px label in a 119px button. Fixed on all **seven** instances, not one, so the master stops producing the defect. |
| `opacity` | **M01's button** — it kept the disabled treatment its removed typed-confirm gate had justified. |
| `font-size` | **M19's two named specimens**, now at the kit's 16/13. |
| `fill-gradient` | authored for **F17**; the read then disqualified the fix, and that is recorded rather than forced. |

## Looking at it — six boards, and what only looking found

- **H1 answered.** The paragraph the C2 grow revealed reads *"Losing the user's
  words is a second failure on top of the first."* That is reasoning about the
  design, not product copy. Hidden on all three AI boards; the recovery link
  stays. Geometry could never have told the two apart — which is exactly why its
  author held it.
- **M01's Delete button looked disabled** while its fill read `#E02424` at full
  strength: node opacity, left from the gate M01 correctly removed.
- **F02's swatch still said blue** after the value was corrected to `#F3F4F6`.
  The text fix had moved the contradiction one node to the left. Both swatches
  read first, not inferred, then repainted.
- **F01, F08, F09, F10** all verified closed on their rendered boards.

`validate-fixplans` also learned **supersession**: a row whose target already has
a landed row is not a collision, because the landed row is in the ledger and
cannot re-run.

## F14 is done — all three corrections, applied and verified

It was the last thing anyone called "a session of its own". It took three steps
and a screenshot after each.

1. **The location line.** The spec board is an annotated specification, not a
   component — its body is prose about why the line is needed — so it could not
   be cloned in; the *shape* had to be applied. `52:2`'s topbar title now reads
   **"Bella Cucina › Home › Layers"**. The panel name was read from the drawer's
   own header, not from the rail: the rail's highlighted seat is Insert, so
   taking the crumb from the rail would have written the wrong panel.
2. **The seventh rail seat.** `add-rail-more-seat.mjs` already existed and had
   never been run — the c8 audit noted it had "no receipt anywhere". It edits the
   **component set**, not the boards, which is the difference between one rail
   gaining a seat and every rail agreeing: all seven variants took the divider +
   `⋯ More`, and the instance census went from **0 to 104**. Verified on `52:2`.
3. **Back to canvas.** The spec puts it where `‹ Exit` sits, because in full-page
   mode the action wanted is returning to the canvas, not leaving for the
   dashboard. Tried on ONE board first — `btn/exit` hugs, so the longer label
   grew and pushed the title right with no overflow — then applied to the other
   four. That single trial screenshot also independently confirmed **F15 closed**
   (no canvas footer on a full-page Settings screen) and the new More seat
   propagating into that board's rail.

## What is left

**Nothing that is a repair.** Every finding's executable work has landed. The
thirteen findings that still show a held row carrying a real op were each checked
individually, and all thirteen are superseded alternatives or recorded refusals:

- **F02** — four `fill` rows that would have painted the hero `#1A56DB`.
  Superseded by the measured fix: the hero is `#F3F4F6`, so the inspector was the
  wrong half. Holding them was right; running them would have destroyed the true
  value with no record of it.
- **F04** — board 12's four rows, superseded by `zz-final-two`, which landed on
  the same node ids once the read refuted the premise they were held on.
- **F10, M17, M07/M19** — the pre-op analyses, superseded by `hug-width`,
  `insert-text` and `font-size` once those existed.
- **F17** — a refusal kept on the record with its op, deliberately, so nobody
  re-files it: the product paints a gradient plus a glyph and a solid fill would
  swap one misrepresentation for a harder-to-spot one.

**F11 and F14, the last two called "a session of its own", are done.**

- **F11** — the board now shows `Retry` beside the error, matching the code this
  session shipped. The first attempt threw `in resize: Property "width" failed
  validation` because `add-text` always calls `resize(w, …)`; `w` is required,
  not optional. Verified by screenshot.
- **F14** — all three corrections applied: the location line, the seventh rail
  seat (via the component set, so **0 → 104** instances), and Back to canvas on
  five boards. Verified by screenshot.

One screenshot of `1703:9208` now shows four closed findings at once — Back to
canvas and the More seat (F14), no canvas footer (F15), and a recoverable error
(F11).

## Final

| | |
|---|---|
| rows queued across 32 plans | 342 |
| **landed** | **283** |
| **failed** | **0** — no `DRIFT`, `REFUSED` or `MISSING`, at any point |
| **executable rows owed** | **0** |
| Figma calls | 80 |
| boards screenshotted and inspected | 7 |
| ops added to the toolchain | 6 |
| code fixes shipped with tests | 2 |
