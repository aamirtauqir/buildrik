# V2 → V1 runbook — how to spend the next 200 Figma calls

**The constraint that shapes everything here:** the Figma MCP allowance is **200
tool calls per day, 15 per minute**, on the account's one Professional Full seat
(https://developers.figma.com/docs/figma-mcp-server/rate-limits-access). It is
shared by every agent and every session. A read costs exactly what a write costs.

On 2026-09-07 fifteen agents ran in parallel and spent the entire day's 200 on
reconnaissance. Every plan got written; **the file was not touched**. That is not
a tooling failure, it is a budgeting failure, and this runbook is the fix: the
thinking is already done and on disk, so the next window buys changes instead of
looking around.

## When the window reopens — inferred, not documented

Figma's page states the limits (200/day, 15/min) and **does not say when the day
rolls over**. The evidence here points at **UTC midnight**: the agents began at
00:00 UTC on 2026-09-07 and the cap was already hard by ~03:00 UTC, so a full
allowance was available at the start of the UTC day and was spent inside three
hours. That is consistent with a UTC-midnight reset and inconsistent with a
rolling 24-hour window measured from first use, which would have let calls
trickle back through the morning — they did not; probes at +3, +6, +10, +20, +25
and +30 minutes all returned the same string.

Treat that as a working hypothesis, not a fact. **Do not spend calls probing it.**
The first command of the next window is a real one from the list below; if it
returns the quota string, the hypothesis was wrong and you have lost nothing.

## Before you start

```bash
node scripts/figma/normalize-plans.mjs      # 0 calls — folds every agent's plan into queue.json
node scripts/figma/apply-queue.mjs          # 0 calls — dry run, prints the exact price
node scripts/figma/apply-queue.mjs --status # 0 calls — what is already done
```

All three are free. Run them first, every time. If the dry run's price exceeds
the budget you have, cut with `--only=<slug>` rather than starting something you
cannot finish — a half-applied section is worse than an unstarted one, because
the next pass cannot tell which half.

## Step 0 — finish reading V2. It is not optional and it is not done.

**Eight of the twelve V2 sections have never been opened.** `V2-CORPUS.md` covers
1–4 completely and 5 partially (10 of 21 TEXT nodes); sections **6, 7, 8, 9, 10,
11 and 12 have never been read from Figma at all** — that is Navigation
Structure, Design System, Component Library, Corrected Module Screens, Major User
Flows, Panel/Drawer/Modal Rules, and the Final Polished Editor.

Every module agent worked from the local documents that *generated* the V2 page —
`SPEC-*.md`, `UX-FLOW-MAP.md`, the findings lanes. That is a reasonable proxy and
it is not the same artefact. The insert agent said so plainly: *"If the drawn V2
panel differs from `SPEC-INSERT-PANEL.md` §3, I would not know."* Three specific
places where the proxy is already known to disagree with the page:

- `SPEC-PUBLISH-PANEL.md:313` says **two** publish fixes are server-side; the
  applied job record says **seven**. Section 9 is unread, so the board's own
  wording is unknown.
- Sections 8, 9 and 12 carry an explicit "not yet built" chip naming the phase
  that owns them. **Nobody has read those chips.** They are the difference
  between a spec and a promise, and no agent has seen one.
- The nav-row bar-vs-fill decision lives on section 8. Its status is unknown.

```bash
node scripts/figma/dump-v2-sections.mjs --sections=6,7,8,9,10,11,12 --apply   # 7 calls, one per section
```

Budget this FIRST, before any write. A V1 board built against a proxy that the
page contradicts is a defect introduced with full confidence, and it is the exact
failure mode — *"a board asserting something false"* — that five clean render
sweeps could not see.

## Order, and why it is this order

| # | step | calls | why here |
|---|---|---|---|
| 1 | `node scripts/figma/board-baseline.mjs` | 1 | Per-section counts BEFORE anything moves. The non-destructive promise is only checkable against a baseline taken first. Page 1:3 was 29 sections / 927 boards on 2026-09-06. |
| 2 | `node scripts/figma/verify-invariants.mjs` | 1 | The pre-state of loose / oob / overlap / secoverlap / dangling. Without it, any defect found afterwards is unattributable. |
| 3 | `node scripts/figma/resolve-selectors.mjs docs/design-jobs/V2-TO-V1/queue.json --apply` | 1 per page | Turns every unresolved row into a node id — **116 selectors in ONE call**, batched per page. Ambiguous and unmatched rows are reported and LEFT unresolved, never guessed. The single highest-value call in the list. It reads three selector slots per row (`selector`, `overSelector`, `toSelector`); resolving only the first left every hotspot row unresolved while printing "nothing to resolve", which reads exactly like success. |
| 4 | `node scripts/figma/apply-queue.mjs --apply` | ~20 before step 3, more after | Every mechanical row: copy, renames, markers, hides, moves, clones, captions, hotspots, rewires — **727 queued rows, 677 writable**. Batched, read back in the same call, resumable. Re-price with the free dry run after step 3, because resolving adds rows to it. |
| 5 | Module scripts (below) | ~40 | The rows a generic applier should not do — new boards, clones, component edits. |
| 6 | `node scripts/figma/verify-invariants.mjs` | 1 | The post-state. Steps 4 and 5 create, resize and reparent; those are exactly what breaks these five. |
| 7 | `node scripts/figma/render-defects.mjs --min=8 --page=1:3` | ~10 | Measured defect sweep. Eyeballing 900 boards is not available; measuring them is. |
| 8 | `node scripts/figma/board-baseline.mjs` | 1 | Diff against step 1. Counts must **grow or hold, never shrink**. A shrink is a destroyed board and must be investigated before anything else. |

Leave headroom. `--budget=180` is the default for a reason: steps 6–8 must run in
the same window as the writes they check, or the check is about a different file.

## Module scripts

Each was written by the agent that owns the module, is idempotent, reads its
changes back, and refuses rather than guesses. Run them after step 4.

| module | command | notes |
|---|---|---|
| shell | `node scripts/figma/build-spec-boards.mjs --apply` | 11 new boards. Refuses off-grid geometry, sub-11px text, weights above Semi Bold and `#1A264D` before it opens a connection. |
| shell | `node scripts/figma/add-rail-more-seat.mjs --apply` | Shared Rail component set. Reports the instance census rather than asserting propagation. |
| publish | `node scripts/figma/apply-publish-v2.mjs --apply` | Structural adds. **Then** the states script, not before. |
| publish | `node scripts/figma/apply-publish-v2-states.mjs --apply` | Clone copy, hotspots, final names, preview board. Three ordering constraints are in `reports/publish.md`; ignoring them corrupts the result silently. |
| settings | `node scripts/figma/fix-settings-headers.mjs docs/design-jobs/V2-TO-V1/plans/settings-headers.json --apply` | Deliberately carries empty `rows` so the shared queue reads nothing from it. |
| ai | `node scripts/figma/build-ai-v2-boards.mjs --apply` | 6 steps, ~11 calls. Grows section `1776:8380` from 5 200 to ~6 620 tall — step 6 then `order-sections.mjs` is mandatory if a SECTION OVERLAP is reported. |
| history | `node scripts/figma/history-resolve-ids.mjs …` then `fix-history-render-defects.mjs --apply` | Resolve first. Its `splice` support stops a fragment row truncating its node. |
| components | `node scripts/figma/compare-nav-rows.mjs` **then** `apply-merged-nav-row.mjs --apply` | The apply **refuses** until compare has run, because the founder's exception is gated on a measurement nobody has taken. |
| any | `node scripts/figma/add-state-board.mjs <sourceId> "<name>" [--at x,y] --apply` | One call per board. Collision-tested against every sibling. |

## What this runbook will NOT do, and must not pretend to

- **`add-board`, `clone-board` and `manual-draw` rows are excluded from the queue
  applier on purpose.** A `manual-draw` row's spec is a sentence — *"FRAME 520x36
  at y=321 containing: ✕ 10/Medium #E02424 in a 20x20 box…"*. That is a drawing
  instruction for someone with a cursor. Parsing it half-correctly and marking it
  done is how a board ends up half-built and reported complete.
- **`advisory` rows have no single node to write.** They are cross-module
  instructions carried so they cannot be forgotten, and they need a module agent
  or a person, not the applier.
- **A census is a measurement.** `audit-components.mjs` has been wrong twice —
  once counting COMPONENT_SETs and their variants as zero-use (204 reported, 49
  real), once comparing variant property strings as component names (12
  collisions reported, 0 real). Both failures now have a self-test
  (`audit-components.selftest.mjs`, runs offline, 0 calls). Run the self-test
  before believing any census, and do not report one that was not taken.

## The three traps this arc has already paid for

1. **A null result is your instrument until proven otherwise.** A sweep that
   returns zero rows after 29 rate-limit responses read nothing. That zero is the
   quota, not the file. `verify-invariants.mjs` output that says
   `You've reached the Figma MCP tool call limit` is **UNMEASURED**, not clean.
2. **A write is not verified by the write.** A capture submit in this repo has
   reported success on a dead POST and failure on four that landed. Every op in
   `apply-queue.mjs` re-reads the node in the same call and prints what it found;
   `OK` means the read-back matched, `DRIFT` means the call returned and the node
   does not hold what was asked. Those are different and only one is done.
3. **A render sweep is blind to a board asserting something false.** One did — a
   band labelled for a feature that is not built, invisible to five clean sweeps.
   That is why the copy rows carry `expect` guards and why `REGISTER.md`
   quarantines the ten refuted findings instead of listing them as work.

## Resuming

`apply-queue.mjs` persists every row's outcome to `queue-state.json` as it lands
and tracks the day's spend. Re-running skips `OK` and `SAME` rows and continues
from the first that is neither. An exhausted window therefore costs a pause, not
a redo — stop, and run the same command tomorrow.

Rows that come back `DRIFT`, `REFUSED`, `MISSING`, `NOEDGE` or `OOB` are
information, not something to retry blindly. `REFUSED` means the board moved on
since the plan was written; `MISSING` means the id is stale; `OOB` means the node
was created and left its board. All four want a read before the plan changes.

---

# What the 2026-09-07 run actually cost, and what it taught

The plan above was written before any of it had been run. This is the correction.

## Costs, measured

| step | estimated | actual |
|---|---|---|
| read V2 sections 6-12 | 7 | **7** (section 9 came back PARTIAL at the ~20k cap) |
| baseline + pre-invariants | 2 | **2** |
| resolve selectors | 1 | **1** for 115 selectors — 17 resolved, the rest NOMATCH because their board did not exist yet |
| apply queue | ~20 | **20**, then 9 + 8 + 8 more as fixes and re-resolutions unlocked rows |
| module scripts | ~40 | **~35** including 28 `add-state-board` clones at 1 call each |
| caption reflow (unplanned) | — | **12** across five sections |
| post-invariants + baseline | 2 | **2** |

**Total ≈ 100 calls of the 200/day.** The single most valuable call was
`resolve-selectors` and the single most wasteful pattern was re-running the
queue before the boards its selectors pointed at existed.

## Order this differently next time

**Clone every new board FIRST.** Half the apply's misses — 113 NOMATCH
selectors, 18 MISSING ids, four Publish text rows that landed on the original
instead of the clone — trace to one cause: rows referencing boards that were
created later in the same session. `add-state-board` is 1 call per board and
unblocks whole plans. The corrected order is:

1. read what you are conforming to · 2. baseline + invariants ·
3. **create every clone and new board** · 4. resolve selectors ·
5. apply the queue · 6. module scripts · 7. reflow · 8. verify + diff

The 2026-09-07 run did 3 after 5, and paid for it in re-resolutions.

## Three things that are now checkable for free

- `apply-queue.selftest.mjs` — parses all 26 generated sandbox bodies.
- `preflight-sandbox.mjs` — builds each script's REAL payload and parses that.
  `node --check` proves the host file parses and says nothing about the string
  inside it; two scripts shipped a payload that died in Figma, one of them
  reported as "syntax-checked".
- `audit-components.selftest.mjs` — reproduces both census failures offline.

Run all three before spending a call. None of them costs one.

## Reaction fields — the exact contract

- **Write:** `await node.setReactionsAsync([{ trigger, actions: [ … ] }])`.
  Including the legacy singular `action` is **rejected**: *"Please update the
  actions field instead of the action field in order to prevent data loss."*
- **Read:** check BOTH `r.action?.destinationId` and `r.actions[].destinationId`.
  Existing reactions in this file carry both, and Figma resolves the plural — a
  rewire that updated only the singular reported success and moved nothing.
- `reactions` itself is a `ReadonlyArray`; assignment is a silent no-op.

## The rule that earned its keep

Every op reads the node back **in the same call** and prints what it found. That
is what turned six silent no-ops into six fixed bugs — a `ReadonlyArray` that
ignored assignment, a Reaction whose `actions` array Figma reads and whose
legacy `action` it does not, a TEXT node that ignores `resize()`, an escape that
does not survive into a template, a `remove()` refused on an instance child, and
a clone plan whose `cloneName` is the SOURCE's name. Not one would have been
visible from the fact that the call returned.

---

# Next window — spend it on the seven things that are actually owed

Coverage is independently measured at **A 215/570 (38%) · B 301/570 (53%)**, and
that is a lower bound (see `COVERAGE.md`). All 294 findings carry a verdict. What
remains is not thinking — it is reading boards nobody has opened, and the
allowance is the only thing in the way.

**Run in this order. Discovery first, because every item below is blocked on the
same reads and doing them once is the whole saving.**

| # | command | calls | why first |
|---|---|---|---|
| 1 | `node scripts/figma/discovery-pass.mjs --apply --budget=40` | 24–48 | Reads the 8 unopened sections ONCE — Journeys (66 of 74 interiors), Brand (43 of 51), Review's 20 name-only clears, Notifications' interiors, Templates, Components, Sign-off, Canvas. Writes `DISCOVERY.md`. Every later pass then plans for free. Resumable; a section that hits the response cap is marked PARTIAL, never filed as read. |
| 2 | `node scripts/figma/measure-coverage.mjs --json=…/coverage.json` | ~7 | The re-measure that did not get to run, now harvesting node ids from `reports/*.md` as well — the evidence set widens 778 → 1,477 nodes. The current figure under-counts every bespoke-script write; `28 · Library` measured 0/3 in the same hour its three boards were repaired. |
| 3 | Journeys mirror sweep, planned off `DISCOVERY.md` | ~15 | It redraws module screens as flow steps, so every correction this arc made may have a stale twin. `817:5114 S5.10 · activity-log` is already flagged as an unresolved duplicate of History › All changes. |
| 4 | Brand conformance re-measure + sweep | ~15 | Its off-size / off-leading / off-token / 4px-grid figures are **UNMEASURED before and after**. |
| 5 | `plans/sweep-b-04-leading-blocks-binding.json` | ~10 | **Leading blocks binding, measured:** 496 nodes have no style to bind to, and the block is `AUTO` leading (161 and 72 off-leading in two sections), which no `--bk-leading-*` token expresses. Per-section, never blind. |
| 6 | Notifications 280 → 360 | ~6 | Debt is recorded on all six boards; the re-lay is not done. A frame resize alone leaves a 280 interior in a 360 box — a worse drawing than what ships. Needs the interiors from step 1. |
| 7 | **Look at boards at 1440×900** | ~10 | The one thing nothing here substitutes for. |

## Why step 7 is not optional

A read-back proves a write **landed**. It does not prove the write was **right**.
This session produced three defects that passed every automated check:

- a board named, literally, `APPEND to whatever the current name is: "…"` —
  logged `OK`, because the read-back matched the string that was *sent*;
- two dialogs drawn at `y=1800` on a 900-tall board, reported `OK` because the
  script checked the copy and never the geometry;
- an annotation seated on a divider whose own geometry matched its plan exactly.

An offline scan of all 804 landed rows for the first defect's shape found 19
candidates and **exactly one real** — so the class is contained, and the method
that found it was a person reading board names, not a checker.

## Free before every call, no exceptions

```
node scripts/figma/preflight-sandbox.mjs        # 118/118 payloads parse today
node scripts/figma/apply-queue.selftest.mjs     # 26/26 generated bodies
node scripts/figma/audit-components.selftest.mjs
node scripts/figma/lint-sandbox-scripts.mjs     # green
node scripts/figma/normalize-plans.mjs
node scripts/figma/apply-queue.mjs              # dry run prices the work
```

## How the cap actually behaves — trickle, not a daily block

Measured across this arc, and it contradicts the note above about UTC midnight:

After the limit string appears, calls come back **a few at a time within
minutes**. A probe succeeded, a two-call discovery read completed, and the very
next call was refused again. So a single successful call is NOT the window
reopening — it means two or three calls exist, not two hundred.

Consequences for the passes still owed:

- **Split them into stages that each LAND something.** `discovery-pass.mjs` is
  built for this: it writes each section as it completes, skips what is already
  captured, and marks a truncated section PARTIAL instead of filing it as read.
  Re-run it repeatedly and it walks forward a section or two at a time.
- **Never start a twenty-call run hoping.** Price it with a free dry run, then
  take the cheapest slice that produces a finished artefact.
- `relay-panel-width.mjs` is one call for all six Notifications boards and its
  plan is written (`plans/relay-notifications.json`) — that is the shape to aim
  for: whole jobs that fit in a single call.

## ~~RUN THIS FIRST — six boards are currently lying~~ · RESOLVED 2026-09-07

`relay-panel-width.mjs` re-laid all six Notifications boards 280 → 360 — frame
AND interior: right-aligned nodes re-seated to their original right margin,
wrapping copy re-measured, **0 out-of-bounds**, every board read back `OK`.

Their NAMES still say *"The 280→360 re-lay is NOT taken here."* That was true
when written and is false now, and this arc introduced the falsehood by fixing
the thing the sentence described. The correction was written and the cap bit
before it landed:

```
node scripts/figma/fix-notifications-relay-claim.mjs   # 1 call, idempotent
node scripts/figma/verify-invariants.mjs               # 1 call — six boards changed width
```

Both have now run. `165:2` fixed on the retry (it carried the claim in different
words — "drawn 280 wide" — which the script now also matches); the other five
report `NOCLAIM`, i.e. already correct. Invariants re-checked after: **0 board
overlaps, 1 out-of-bounds (pre-existing), 0 dangling**.

Left here as the worked example: a board that asserts something false is the
exact defect this arc exists to remove, and one introduced *by a fix* is worse,
not better. The correction was scripted rather than hand-edited precisely so it
could be re-run when the cap interrupted it — which it did, twice.
