
---

## 2026-09-08 — second tranche, and three instrument defects

### Counts

| | before | after |
|---|---|---|
| boards captured (`raw-figma/`) | 97 | **123** |
| specs extracted | 36 | **123** |
| surface recipes | 37 | 37 (+87 assigned, in flight) |
| anchors checked | 197 | 197 |
| `boards.json` verdicts | 56 match / 48 drift-fixed / 38 drift-open | **57 match / 53 drift-fixed / 32 drift-open** |

Two agents landed 14 surfaces (Pages/Templates/Publish 8/8, History/Issues/
Modal/Export 6/6). Six agents are in flight over the remaining 87 specs, by
family: Brand 11 · History+Compare+Content 12 · Layers+Insert+Shell+Inspector 14
· review/collaboration 18 · first-run/onboarding/errors 15 · canvas+settings+
leftovers 17.

### Three defects in the harness itself

All three were found by the harness's own ratchets or sweeps, not by reading it.

**1. The extractor could not read a named colour — and lost coverage silently.**
`propsFrom` matched only ARBITRARY utility values (`bg-[#fff]`). On 2026-09-02
the topbar board came back from Figma with `bg-white`, which matches no bracket,
and the topbar's background quietly stopped being compared. `diff.mjs` still
said PASS: **one fewer property is an absence, not a failure.** Only the
compared-count ratchet caught it, six days later, with
`compared properties fell 7 -> 6. Something stopped being checked.`
Across the 123 committed boards this had hidden **57 `bg-white` and 8
`text-white`**. Fixed with a whole-class-name `NAMED` table — deliberately not
prefix-keyed, because `SINGLE` maps `border-` to border-COLOR and a prefix
lookup would have read `border-b` (a width, 177×) and `border-solid` (a style,
876×) as colours.

**2. Restoring that check then exposed a second, opposite error.** Three
surfaces failed `background-color #ffffff vs rgba(0,0,0,0)` — modal feet and
grids that declare no fill and simply look white inside a white card. Comparing
the declared value calls a pixel-identical surface a failure. `measure.mjs` now
reports the element's own fill when it declares one and composites up only when
it is fully transparent. The naive version of this fix — composite always — was
written first and **turned a scrim's deliberate `rgba(17,24,39,0.4)` into
`#979da5`**, silently redefining the target. Both halves of the rule are
load-bearing. Verified by planting 8 wrong fills into a spec and confirming the
comparison still fails (`73 compared · 71 pass · 2 fail`), then restoring.

**3. Alpha is invisible to the diff, by design, and was undocumented.**
`lib.mjs` drops the alpha channel (`:116`) and treats only a literal `0` as
distinct (`:109`), so `rgba(17,24,39,0.4)` and `#111827` compare EQUAL. This is
the right call — Figma cannot export a layer opacity, so every board bakes its
scrim to an opaque base and requiring alpha to match would fail all of them —
but nothing said so. Now recorded in the README's "What this harness cannot
see", together with the fill-inheritance rule from (2).

### Two systemic contrast defects, neither fixable in code

Written up in full in `CONTRAST-INK-MUTED.md`. Short version:

- **`--bk-ink-muted` `#6B7280` passes on exactly one background — pure white
  (4.83) — and fails on every tint the system itself ships** (gray-100 4.39,
  blue-50 4.38, green-50 4.29). 19 of the 25 measured failures are this one
  pair. It is used 699× in `src/`. The boards specify the pairing, so
  implementers keep faithfully reproducing it. Minimal fix `#646C79` (worst case
  4.70) — but the token is generated from Figma and checksum-locked by
  `gate:tokens-generated`, so it is a Figma edit and a founder call.
- **`--bk-success` `#0E9F6E` is a FILL token used as text in ~28 places**
  (3.39 on white, **3.00 on its own tint** — the worst pair in the arc).
  Attempting the obvious code fix disproved it: board 171:67 names
  `--color/success` for those glyphs, so the swap failed conformance 3 ways and
  was reverted. The real fix re-points the BOARDS' text layers to
  `--color/success-text` — a design job, not an implementation one — paired with
  a lint ban, or the ban fails conformance on arrival.

The through-line: **both defects are the design system faithfully transcribed.
Neither is an implementation mistake, and neither can be fixed at a call site.**

### Capture caught up to the board list

Two capture runs (99 + 71) took `raw-figma/` from 123 to **293 boards**, all
extracted, 0 failures. **293 of 346 active boards (85%) are now captured**; the
last 55 stopped on `You've reached the Figma MCP tool call limit`, which
`capture.mjs` handles by design — it reports what it spent and stops rather than
burning the remainder against a wall. Specs total 39,495 properties; exactly one
spec is thin (`media-bulk-bar`, 1 target).

Recipes went 37 → **99** while the six agents worked, and measured coverage
9.8% → **27.4%** of active boards.

(zsh note, cost twenty minutes: `for b in $new` does NOT word-split an unquoted
parameter the way bash does, so a 99-line list arrived as one argument and the
first extract "failed" for all of them. Use `while IFS= read -r`.)

### A fourth harness gap closed: copy, and through it, structure

`diff.mjs` compares geometry, colour and type — all property classes, none of
them text — and only over ANCHORED targets. So it cannot see a label the board
draws and the product does not, nor a control the product renders that no board
contains. The README lists structure as the harness's largest blind spot, and
until now only a screenshot caught it.

`measure.mjs` now captures every visible string on the surface, and
`check-board-copy.mjs` compares that against the copy the extractor already
pulls from each board. On its first run it found drift on a surface sitting at
**73/73 green**:

- board `Export site as HTML` · product `Export site as`
- board `One HTML file, styles inlined — the page open now (About), saved as
  index.html.` · product `One HTML file with styles inlined — open it anywhere.`

That second one is **UX-E-14**, which the agent who conformed that surface could
only find by reading the board's frame NAME. The check finds it from the text.

Deliberate limits, both stated in the script's own header:

- **Advisory, always exits 0.** Boards render sample values, so a lead is a
  shape to look at, not a verdict — the same standing the founder gave the
  property probes on 2026-08-06. Digits and quoted spans are folded before
  comparing; proper nouns like "Bella Cucina" cannot be.
- **The "extras" direction is suppressed below full spec coverage.**
  `shell-default` sweeps `body` but joins one spec out of five targets, and
  reported 88 extras that were simply the rest of the editor.

Its own test caught a flaw in it: with no board-side leads it early-returned and
printed "no leads" while **silently** withholding the extras count — the exact
failure mode the check exists to catch. It now says what it withheld and why.
Harness self-tests 83 → **90**.

---

## Five agents landed · 2026-09-08

| | session start | now |
|---|---|---|
| recipes | 9 | **105** |
| boards measured | 34 (9.8%) | **101 (29.1%)** |
| match + drift-fixed | 56 + 48 | **63 + 96 = 159** |
| drift-**open** | 38 | **19** |
| unchecked | 150 | **26** |
| harness self-tests | 83 | **96** |

### Product defects found by conformance, not by tests

None of these is drift. Each is something the product does wrong, found because
a board was measured against the running app.

1. **The rail coach was unreachable for every user who ever existed.**
   `useComposerInit`'s bootstrap calls `elements.createPage` on empty storage and
   emits `project:changed {type:"page:created"}` outside any import;
   `OnboardingMount` credited it. So every new user's checklist started at **1/7
   for a page they never made**, and `showCoach` requires `completedCount === 0`.
   Measured live: 1/7 done and an achievement overlay on screen four seconds
   after boot, untouched. Re-measured after the fix: 0/7 and the coach on the
   rail.
2. **All three publish gates shipped as a toast that called `dismissBlock()` in
   the same effect** — so no gate dialog could ever have been driven off
   `blockedReason`. The test asserted the toasts *and* the dismiss, protecting
   the bug.
3. **Applying a starter empties the Brand preview in Beginner mode** — the
   default. `stageTokens` replaces the colour registry with the starter's nine
   tokens, none carrying `semanticKind` (zero hits across all six starter
   files), and Beginner filters on exactly that. Measured **0 swatches and
   `Tokens 0`** against a board drawing four. This is the founder's own worked
   example of what "verified" means, failing.
4. **A session expiry kept nothing**, though it is the one recoverable save
   failure — the next load seeds "Saved just now" over discarded work.
5. **`.bdc-lr.bdc-editing` shipped as a class with no CSS rule at all**, and the
   rename input was 36px inside a 28px row.
6. **The prune notice promised a guarantee the engine does not implement** —
   "Named versions *and the approved one* were kept", while `pruneVersions`
   filters on `isAutoCheckpoint` and knows nothing about approval.
7. **The failed-rollback modal had two wordings for one failure**, depending on
   which layer noticed.
8. **A canvas edit silently discards staged brand edits** — `markDirty()` emits
   `project:changed`, and `TokensSection`'s handler calls `resetAll` →
   `resetFromSaved`, moving `savedTokens` too. The neighbouring handlers guard
   on `isDirtyRef` for exactly this reason.

### Three more instrument defects, all found by agents using the instruments

- **Ancestor `opacity` was invisible to the contrast sweep.** `tw:opacity-55` on
  completed checklist rows meant text computing 4.83:1 rendered at **2.1:1** —
  and at 7/7 that was the whole list. `measure.mjs` now multiplies inherited
  opacity into the foreground alpha; the arithmetic reproduces the agent's 2.14.
- **`check-board-copy` could not see `placeholder`.** Boards draw "Search
  elements" as a text layer; the product renders an attribute. Now split:
  `placeholder`/`value` are visible text and count in both directions;
  `aria-label`/`title` may SATISFY a board line but never GENERATE an extra — a
  board cannot draw an accessible name. Including them in both turned 8 leads
  into 25 on the first surface tried.
- **`rounded-full` compiles to `calc(infinity * 1px)`**, which no length parser
  read, so every pill compared UNCOMPARABLE against a board drawing
  `rounded-[9999px]` — the badge radius was simply not being checked.

`extract.mjs` also learned to read JSX template-literal children — Figma wraps a
string in one whenever it contains a character JSX would escape, so the old
`[^<>{}]` pattern dropped exactly the interesting copy (`What's live`,
`+  Save a version`, `‹  Tokens`). Three agents reported it independently.

### A wrong claim I made, and the gate that now prevents it

I recorded eleven Brand rows from the agent's prose instead of from the recipes.
**Six node ids were wrong**, and `152:112` (Brand · presets) was stamped
`recipe: brand-starters` with the starters verdict over a row that was still
`driven`. Every gate passed. I caught it by hand, which is not a control.

`check-boards.mjs` now verifies that a row's `recipe` names a recipe that
actually joins that row's `nodeId`, and fails with the offending pair. Proven by
planting the exact error:

```
[boards] board "Brand · presets" (152:112) names recipe "brand-starters",
         but that recipe measures 152:137 — not this board.
```

### The denominator, corrected

Three boards are not editor surfaces at all and can never be measured by this
harness, which drives the two editor Vite roots: `s5-10-activity-log` (the
dashboard's `activity-feed.tsx`) and both client sign-off boards
(`packages/dashboard/app/review/[token]/review-client.tsx`). Recorded
`unreachable` with the reason, rather than left to sit as permanent "unchecked".

---

## All six agents landed · the board ledger closes to one

| | session start | now |
|---|---|---|
| recipes | 9 | **105** |
| boards with ANY verdict | 280/347 | **346/347** |
| match + drift-fixed | 104 | **180** |
| drift-**open** | 38 | **13** |
| unreachable, each with a stated reason | 31 | 36 |
| **never looked at** | **150** | **1** |
| full-corpus sweep | — | **105/105 PASS · 2,922 properties · 0 fail** |
| harness self-tests | 83 | **96** |

The `unreachable` growth is bookkeeping, not attrition. Each now names why:

- `s5-10-activity-log` and both **client sign-off** boards are DASHBOARD
  surfaces (`activity-feed.tsx`, `app/review/[token]/review-client.tsx`). This
  harness drives the two editor Vite roots and cannot reach a Next route.
- The 2-card "new page" modal and the 720×520 template picker **do not exist** —
  `+ Add page` creates directly and `From template` opens the drawer. A feature,
  not drift.
- `s1-5-session-expired`'s "Your work is saved." is a promise the code
  deliberately does not make; `SessionExpiredModal` says the opposite and is
  right, because a dashboard-backed save writes nothing local. The board needs
  the redraw.
- `s1-1c` draws templates inside the Insert drawer against an explicit founder
  call.
- Both remaining orphan-comment boards are `[not-implemented]` per their own
  frame names.

Five S5.3 boards moved to **match on evidence, not assumption**: their review
column instantiates the same Panel header (208:11) and Comment row (228:906)
components conformed against 157:2, and they agree node-for-node with what
ships.

### A third instrument bug, mine, caught by the aggregate

Teaching `measure.mjs` to fold ancestor opacity was right, and the first version
was wrong. It reported 18 nodes at a ratio of exactly **1:1** — gray-500 on
white, which is 4.83, i.e. arithmetically impossible. The Insert drawer sits
under the coach mark at effective opacity 0, so the foreground blended entirely
into the background. WCAG governs text a person can SEE; invisible text is now
skipped rather than failed, because reporting it buries the real ones.

Contrast across all 105 surfaces went 94 → **71 failing nodes on 25 surfaces**,
and **zero impossible ratios remain** — which is the check that says the number
is real. **49 of the 71 (69%) are `--bk-ink-muted` on a tint.**

That is three instrument bugs I introduced or found in my own changes this
session (the composite-always background, the invisible-text contrast, the
recipe/board join). Each was caught by an instrument rather than by reading —
the ratchet, the aggregate, and a planted error respectively. None was caught by
review.

### Six agents died at once, and what it cost

The next wave of six agents was killed simultaneously by an infrastructure
watchdog — *"no progress for 600s (stream watchdog did not recover)"* — all six
mid-edit. Simultaneous death of every agent is not six failures; it is one, and
the likely cause is resource exhaustion from six heavy agents running alongside
a full 105-surface measurement sweep.

**The tree survived it.** Checked rather than assumed:

```
npx tsc --noEmit          clean except the 3 pre-existing CollectionManager errors
check-anchors             PASS — 667 anchors across 106 recipes
check-token-resolution    PASS — 152 tokens
check-boards              PASS — 106 recipes, 346/347 driven
vitest src/editor/chrome-ui   38 files, 241 tests, all pass
```

One recipe had even landed before the crash (105 → 106). The cost was
work-in-progress, not correctness — but it was *most* of six assignments,
because the agents were batching their recipe writes to the end.

Two changes for the restart, both cheap:

1. **Half the concurrency** — three agents, not six.
2. **Land each recipe the moment its `diff.mjs` passes**, rather than batching.
   A crash then costs one surface instead of an entire assignment. This is now
   in every prompt.

The general lesson is about checkpointing rather than about agents: a long
unit of work that writes nothing until the end has no partial credit, and the
thing that kills it will not be the thing you planned for.

### A fifth instrument gap: `check-anchors` could not see one level of indirection

The Content agent's recipes named 66 anchors the gate called missing —
`row-label-content-record-rec-margherita` and friends. Every one of them
renders. `anchorForm` matched a derived id only through a backtick template
**inside the attribute**, and `ListRow` builds its ids in a helper:

```js
const sub = (part) => (typeof rowId === "string" ? `row-${part}-${rowId}` : undefined);
<span data-testid={sub("label")}>{label}</span>
```

The attribute holds a CALL; the template lives one line up. It now collects the
identifiers a testId attribute calls and takes the literal prefix of any
template assigned to one — the verdict stays the deliberately-weak `template:`,
which proves a producer exists whose prefix the id starts with and leaves the
exact id to `measure.mjs`. 66 → 46, and the 46 are another agent's in-flight
anchors.

Two things worth keeping from the fix itself:

- **The first version was 100× slower.** A whole-file
  `(?:const|let|var)\s+(?:a|b|c)\b[^\n]*?\`...` backtracked badly enough to take
  the gate from seconds to 37s. A declaration and its template sit on the same
  line in every real case, so it scans lines now.
- **The README's "~0.3s" was stale, and not because of this change.** Measured
  with the new code disabled: 16.5s. Enabled: 14.1s. The cost is anchors × files
  and it grew with coverage — 40 anchors when that line was written, **667**
  now. Corrected in the table rather than left to mislead the next reader into
  blaming their own change.

Harness self-tests 96 → **100**.

---

## 2026-09-08 · the manifest closes

| | session start | now |
|---|---|---|
| recipes | 9 | **204** |
| boards measured | 34 (9.8%) | **200 (57.6%)** |
| verified (match + drift-fixed) | 104 | **295** |
| drift-**open** | 38 | **0** |
| never looked at | 150 | **0** |
| boards captured + extracted | 8 | **342 — all of them** |
| coverage ratchets seeded | — | **204/204, zero inert** |
| harness self-tests | 83 | **156** |

### Agent mortality, and the one mitigation that worked

**Twelve agents were killed mid-work** by an infrastructure watchdog
(`no progress for 600s`). The first wave of six died together under load 76; a
later one died on its FIRST action, reading a file, under load 3. So the
diagnosis "resource exhaustion" was incomplete and "long blocking commands" only
partly right — some deaths have no behavioural explanation at all.

What actually preserved work was not a diagnosis but a habit:

> **Land each recipe the moment its `diff.mjs` passes. Never batch.**

The S3/S5 agent died at its verification step with sixteen recipes already on
disk. I re-ran the verification it never reached — **16 surfaces, 442
properties, 0 fail, 0 missing targets** — and recorded them with an explicit
provenance caveat, because that agent filed no report: the measurement is
verified, the *adjudication* is unreviewed, and each note says so rather than
implying a review that never happened.

### Instrument defects found, in one place

Nine, every one of which made a real defect invisible. Several were mine.

| # | Defect | What it hid |
|---|---|---|
| 1 | `propsFrom` matched only bracketed values | 57 `bg-white` + 8 `text-white` never compared; `diff` still said PASS |
| 2 | `background-color` compared as declared | a modal foot with no fill "failed" against a white card |
| 3 | …then compositing ALWAYS | turned a scrim's deliberate `rgba(17,24,39,0.4)` into `#979da5` |
| 4 | contrast blind to ancestor `opacity` | text at 4.83:1 rendering at 2.1:1 |
| 5 | …then reporting invisible text | 18 nodes at exactly 1:1, arithmetically impossible |
| 6 | `contrastScope` on a portalled dialog | five recipes certifying modals **nobody had measured** |
| 7 | `diff` reading a failed run's file | `11 compared · 11 pass` for a surface that measured nothing |
| 8 | `text-[#6b7280]` read as a font-size | 70 colour checks vanished across 53 specs |
| 9 | `parse()` knew only `rgb()`/`rgba()` | Tailwind v4's `oklab(...)` → null → treated as NO fill |

Plus three where the instrument dictated code shape and was corrected instead:
`check-anchors` could not see a helper's template, a wrapped declaration, or a
two-literal ternary — agents reformatted **source** to be seen, twice, before I
fixed the checker.

And one that made the whole harness useless: **`measure.mjs` did not parse** for
a period — a comment containing `` `bg-*/NN` `` closed the block early. Every
parallel agent was measuring against a dead tool. There is now a test asserting
every `scripts/conformance/*.mjs` parses.

### The rule this arc keeps rediscovering

**Absence reads as success unless something refuses it.** A missing property, an
empty scope, a failed run, an unparseable colour, a dead tool — each produced a
green verdict. Every fix above is a refusal: exit 3, exit 2, a ratchet, a
planted-error test.

---

## Closed · every active board has a verdict

```
[boards] PASS — 208 recipe(s) · 204/347 active board(s) measured (58.8%)
[boards] verified — 347/347 driven · 72 match · 228 drift-fixed
                    0 drift-OPEN · 46 unreachable · 0 no-verdict · 0 unchecked
full sweep — 208/208 surfaces · 7,295 properties · 0 fail
check-anchors PASS (1,435 anchors) · check-token-resolution PASS (152 tokens)
check-copy PASS · every scripts/conformance/*.mjs parses
```

**300 boards conformed and measured. 46 unreachable, each naming why** — a
dashboard route this harness cannot drive, a state the product deliberately does
not build, a board contradicting a founder call, or a board asking the product
to say something untrue.

### The last sweep earned its keep

208 individually-green surfaces produced **7 failures when swept together** —
invisible to every agent, because each surface passed when its own agent landed
it. They were not regressions: the `text-[#hex]` extractor fix had turned bogus
font-sizes into real colour checks, so `s1-2f-save-indicator` went 8 compared to
12. Newly *visible*, which is the point of fixing an instrument.

One was a real bug (`review-rounds-rows` set a size but no colour, so it
inherited **black** where the board says `#4b5563`). The other six were the
board being wrong, and the arithmetic settled it: the save indicator's four
state hues exist as **no token** and three **fail AA on white** — 3.84, 4.28,
4.37 against 4.5 — where the shipped grey is 4.83.

The board was right about the problem and wrong about the fix. **The indicator
paints saving, saved and unsaved the same grey**, so the one control whose job
is to tell you your save state says nothing by colour. The system already
carries accessible per-state tokens (8.93 / 5.36 / 5.74); adopting them deviates
from the board, so it is a founder call, recorded rather than taken.

### One last instrument gap, closed

Refusing that honestly needed something the harness did not have, and that an
agent had already asked for: **a per-property skip**. A target was
all-or-nothing, so declining one colour meant dropping its geometry too — which
pushes toward the worse option, conforming to a value you have already judged
wrong. `skipProps` now takes a **mandatory reason per property**, validated: a
refusal too short to be one is rejected, because a refusal that does not say why
is indistinguishable from an oversight.

They also print apart from genuine gaps. They had been appearing under
`skipped (no spec yet)` — a judgement labelled as a hole, which is the vague
labelling this whole directory exists to stop.

Harness self-tests: 83 → **162**.
