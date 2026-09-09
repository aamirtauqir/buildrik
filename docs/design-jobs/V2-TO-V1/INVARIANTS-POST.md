# Invariants AFTER the first V2→V1 apply — 2026-09-07

| class | pre | post | verdict |
|---|---|---|---|
| loose nodes on page | 77 | **77** | unchanged — pre-existing |
| section overlaps | 2 | **2** | unchanged — pre-existing (`07 · Brand`×`06 · Content`, `12 · AI`×`13 · Command palette`) |
| board overlaps | 0 | **0** | **regressed to 12, then repaired to 0** — see below |
| out-of-bounds children | 2 | **2** | regressed to 3, repaired |
| dangling prototype edges | 0 | **0** | unchanged |
| sections / boards | 29 / 927 | **29 / 934** | **+7, growth only** — the non-destructive requirement holds |

`verify-invariants.mjs` still exits FAIL. Every remaining failure is in
`INVARIANTS-PRE.md` and predates this arc.

## The regression, and what caused it

Rewriting a caption makes it **taller**, and this page parks captions in a fixed
~300px gap beneath each row of boards. Twelve captions grew past that gap and lay
across the board below. Nothing warned: the write succeeded, the read-back
matched the string asked for, and the defect was purely geometric.

Widening was not available — the column pitch is 400 and boards are 280.
Shortening would have thrown away the finding each caption was rewritten to
carry. So `reflow-caption-overflow.mjs` moves the rows **below** down by exactly
the measured shortfall, vertically only, so no column can drift.

| section | overflowing captions | worst shortfall | nodes moved | height |
|---|---|---|---|---|
| `03 · Layers` | 3 | 228px (`caption/Layers · locked`) | 21 | 3696 → 4098 |
| `05 · Media` | 4 | 246px (`caption/Media · grid`) | 51 | 10522 → 10936 |
| `02 · Insert` | 5 | 318px (`caption/Insert · dragging`) | 12 | 3747 → 4383 |
| `08 · Inspector` | 3 | 30px | 29 | 6013 → 6073 |
| `18 · Review` | 3 | 261px (`caption/Review panel · empty`) | 27 | 5281 → 5622 |

140 nodes moved, **0 drift**. Each section's new height was checked against the
next section's origin first, so none of the five created a section overlap.

The separate OOB: the history plan set `163:45` to **width 328 inside a 280-wide
board**. Corrected to 248 (280 less 16px padding each side).

## Three bugs in the applier that only a read-back could have found

Each returned success and changed nothing:

1. **`reactions` is a `ReadonlyArray`** under dynamic-page access — assignment is
   a silent no-op. `setReactionsAsync` is the documented setter.
2. **A Reaction carries BOTH a legacy singular `action` and the current `actions`
   array, and Figma reads `actions`.** Rewriting only the singular left four
   Content crumb edges pointing at `149:84 Content · record` while the call
   reported success. Both fields are now written.
3. **A TEXT node in `WIDTH_AND_HEIGHT` mode ignores `resize()`** — it sizes from
   content. `textAutoResize` must go to `HEIGHT` first or the width never changes.

A fourth was caught before it cost anything: **26 `move` rows targeted children of
auto-layout frames**, where x/y belong to the parent. They now return
`AUTOLAYOUT` with the parent id and the reason, instead of silently drifting.

## Three more, found while applying the module scripts

Each returned success or passed `node --check`, and each was wrong:

4. **`\"` inside a template literal does not survive into the sandbox.** The host
   parser consumes the escape, so the emitted Figma code carries a BARE double
   quote: `T("… and "Try again" hits …")` → `SyntaxError: expecting ','`. Two
   scripts shipped this — one of them reported as "syntax-checked", because
   `node --check` proves the HOST file parses and says nothing about the string
   inside it. `scripts/figma/preflight-sandbox.mjs` now builds each script's real
   payload and parses THAT, for zero calls.
5. **`remove()` is refused on an instance child** — *"Removing this node is not
   allowed"* — which is also the repo's standing rule (`apply-truth-marks.mjs`
   never deletes a design because it is not yet built). The settings header fix
   now hides; `visible=false` is reversible and `remove()` is not.
6. **A clone plan's `new` and `cloneName` are not interchangeable.** `new` is the
   name the NEW board gets; `cloneName` is the SOURCE board's own name, carried
   for provenance. Reading the second as the first would have created a second
   board called `Insert · default` beside the original — a duplicate that looks
   like the real board and is not.

## One script aborted a whole batch; the queue did not

`fix-settings-headers.mjs` threw on a single bad instance-child id
(`I1703:7981;9:7 does not exist`) and **landed none of its 30 boards**. Its dry
run had resolved every header, subtitle and button correctly, so the resolution
was right and only the write path was brittle. Those resolved ids were routed
through `apply-queue.mjs` instead: **90 of 101 rows landed, and the 11 bad ids
were reported and stepped over.** A batch that stops on the first bad row buys
nothing; a batch that reports each row and continues buys 90.

## Final state, end of the 2026-09-07 apply

| class | pre | final | verdict |
|---|---|---|---|
| loose nodes on page | 77 | **77** | unchanged |
| section overlaps | 2 | **2** | unchanged |
| board overlaps | 0 | **0** | regressed to 12, repaired |
| out-of-bounds children | 2 | **2** | regressed to 3, repaired |
| prototype edges / dangling | 3217 / 0 | **3327 / 0** | 110 edges added, none dangling |
| sections / boards | 29 / 927 | **29 / 982** | **+55, growth only** |

Sections that grew: `01 · Shell` 34 → 54, `12 · AI` 25 → 30, `02 · Insert` 22 → 28,
`06 · Content` 37 → 46, `05 · Media` 61 → 71, `15 · Publish` 20 → 24.
**No section lost a board.** That is the non-destructive promise, checked by diff
against a baseline taken before the first write rather than asserted.

## A seventh, and the reason it hid for hours

**Figma refuses the legacy singular reaction field on WRITE:**

> `Error: Please update the actions field instead of the action field in order to prevent data loss.`

The hotspot builder was constructing `{trigger, action:{…}}`. Every hotspot call
threw — and the applier reported **`outcomes none`** rather than an error,
because a thrown sandbox returns prose and the result loop only looked for
tab-delimited rows. A call was spent, an error was returned, and the summary line
said nothing was found. That is the same null-reads-as-success shape this arc has
now paid for five times.

Two fixes, both kept:

1. **Write the plural only.** `setReactionsAsync([{trigger, actions:[…]}])`. The
   API still READS both fields — which is why a *rewire* must check both — but a
   write that includes the singular is rejected outright.
2. **The applier now prints the raw reply when a batch parses zero rows.** An
   unparseable response is a result, not a silence.

68 hotspots were blocked on this one field name.

## Out-of-bounds, second round — two of three were mine

After the hotspot pass, `out-of-bounds children` went 2 → 5. Three were this
arc's, and each had a different cause:

1. **`2865:21976 hotspot/tile` left board `147:55`** (x=169 + 136 wide in 280).
   The hotspot builder did `parent.appendChild(r)` then set `r.x`/`r.y` — but the
   parent was an **auto-layout** frame, so the coordinates were ignored and the
   stack placed the rect wherever it liked. Fixed at the source: the builder now
   sets `layoutPositioning = "ABSOLUTE"` when the parent has a layout mode, which
   takes the rect out of the flow so its coordinates mean something again.
2. **`2854:21613` and `2854:21676`** inherited an overflow from the board they
   were cloned from. `163:113` already had it, and cloning propagated it — a
   defect this arc did not create but did multiply.

The Button case was not what it looked like. Its label sits at `x = -39`
**relative to the instance**, which reads as an overflow to the LEFT; measured in
absolute terms it runs `179..303` inside a 280-wide board — a 23px overflow to
the **RIGHT**. A first fix computed from the relative number would have moved the
instance further out. Measuring against `absoluteBoundingBox` gave the real
answer: shift the instance left by 23, to x=195. All three now read `FITS`,
**including the pre-existing one**, so the source no longer seeds the defect into
future clones.

## Why `12 · AI` × `13 · Command palette` computes as an overlap

The AI gap pass measured it: **`build-ai-v2-boards.mjs` placed its three decision
boards outside the section node's own box.** The section reads
`1776:8380 · 2480x5200`, and board A sits at `y=5220` — past a 5200-tall box —
while board C spans `x=3060..4440` past a 2480-wide one. The boards are
correctly positioned relative to each other; the SECTION was never grown to
contain them.

That is what makes the section overlap compute. It is not a drawing defect and
it is not repaired by moving a board: the fix is either to grow `12 · AI` and
push `13 · Command palette` (and everything below it) down, or to re-space the
page with `order-sections.mjs`. Both move many sections at once, which is the
arrangement lane's job and not something to start while other passes are writing
into the same file.

**Deliberately not fixed.** Recorded here so the next arrangement pass has the
measurement rather than the symptom — and so nobody reads the overlap as a board
lying across another board, which it is not.

## The bookkeeping hole this arc had to close twice

`apply-queue.mjs` refuses `add-board`, `clone-board` and `manual-draw` rows on
purpose — they need their own scripts. The cost is that those scripts never
write `queue-state.json`, `register-status.mjs` credits a finding only from a
landed row, and **twenty-two shell findings read PENDING while the ten boards
that answer them were sitting in the file.**

`scripts/figma/reconcile-built-boards.mjs` closes it: it reads the page and marks
a board row `SAME` when the board it asked for exists — matching the exact name,
then a name with a marker appended (`apply-truth-marks` legitimately does that),
then a prepended `[design-ahead]`. **29 of 30 rows reconciled; one board was
genuinely missing.**

Its first run reported **all thirty ABSENT** for boards that were demonstrably
there: a single whole-page read of a thousand boards came back silently
truncated at the ~19,000-char cap. It now pages six sections at a time, warns
when a chunk returns near the cap, and **refuses to call a row absent when its
section was never read** — the difference between "not there" and "not looked
at", which is the same distinction this arc keeps having to re-learn.

## A read-back proves the write LANDED. It does not prove the write was RIGHT.

This is the most important thing the arc learned, and it qualifies every
"read back and verified" claim above.

On page `1:6`, board `1736:8397` was found named, literally:

> `APPEND to whatever the current name is: "…"`

A plan row had carried the *instruction* in its `name` field — **alongside its
own warning that `apply-truth-marks` does not append** — and it was applied
anyway. `queue-state.json` logged it `OK`, because the read-back matched the
string that was **sent**. It never matched what the string **meant**. The
verification was working exactly as designed and confirmed a destroyed board
name.

So the guarantee this arc's tooling actually provides is narrower than it has
been stated:

| a read-back proves | a read-back does NOT prove |
|---|---|
| the call reached Figma | the string is the right string |
| the node now holds what was sent | the node is the right node |
| the geometry is what was asked for | the geometry is what the board needs |

Three failures in this session are all that same shape, and none was caught by a
read-back:

1. This destroyed name — caught by a human-shaped sweep reading board names.
2. Two settings dialogs drawn at `y=1800` on a 900-tall board, reported `OK`
   because the script checked the copy and never the geometry.
3. A publish annotation seated on a divider, its own geometry matching the plan
   exactly — caught only by dumping the board's children.

**What actually catches this class:** reading the board as a person would, at
its own size, and asking whether it makes sense — not whether the write
succeeded. That is what the arc still owes, and no board in this session has
been looked at at 1440×900.

Restored to `S5.5 · dead-link · not-found — UX-I-18: …`, corroborated by
position, size and two neighbours.

### The same defect, hunted across every landed row

An instruction written into a `name` or `text` field is invisible to a
read-back by construction, so the only way to know whether `1736:8397` was alone
was to look for its shape everywhere. All **804** rows logged `OK` or `SAME`
were scanned offline for values opening with `APPEND` / `PREPEND` / `REPLACE` /
`SET` / `TODO` / `UNRESOLVED` / `whatever` / `<placeholder>`.

**19 matched the pattern. Exactly one was real** — the `1736:8397` name, already
repaired. The other eighteen are legitimate board copy that happens to begin
with an imperative: *"Add redirect"*, *"Set here, generated on publish…"*,
*"Insert · Save"*, *"Whatever the sanitizer drops must be reported once…"*.

That ratio is the point. A pattern search over values is cheap and finds the
class; it cannot tell an instruction from a sentence, so every hit still needs
reading. The check cost zero Figma calls and is worth re-running after any
future plan-driven pass.
