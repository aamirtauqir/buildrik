# V2 → V1 — what actually landed in the Figma file

**Page `1:3` "🖥️ Editor v1", 2026-09-07.** Every number here comes from a
read-back: the value Figma returned *after* the write, in the same call. Not from
a plan, not from an agent's report.

## Headline

| | |
|---|---|
| queue rows landed (`OK` written+re-read, `SAME` already-correct re-read) | **804** |
| register findings resolved | **294 of 294** — 255 implemented · 9 partial · 6 as-rule · 10 not-applicable · 3 open decision · 1 deferred · 10 QA-refuted |
| findings quarantined as refuted by the QA pass | **10** (`DO-NOT-IMPLEMENT`) |
| boards on the page | **927 → 1031** (+104), growth only; no section ever lost a board |
| board overlaps | 0 → **0** (regressed to 12 twice, repaired both times) |
| prototype edges | 3217 → **3579**, dangling **0** throughout |

`verify-invariants.mjs` still exits FAIL on 77 loose nodes, 2 section overlaps
and 2 out-of-bounds children. All of those are in `INVARIANTS-PRE.md`, measured
**before** this arc wrote anything.

## What was built, not just edited

- **10 new Shell boards** — the More index, rail selected-vs-open, the five
  Publish CTA verbs, the unpublish confirm, the regrouped ⋯ menu, the location
  line, full-page mode, the below-1024 state, Issues in the grid, and a
  `Shell · open decisions` board carrying the 700-vs-560 drawer, the two
  palettes and the unpublish-confirm conflict rather than resolving them quietly.
- **3 AI decision boards + 2 AI state clones.** The two-AI-homes duplicate is
  settled on the board: the inspector column is the home, one thread, one ⌘J, one
  ⌘K row, with all nine doors tabulated and the losers marked RETIRED.
  `FIG-K-12`'s proposed left-panel variant is deliberately **not** drawn —
  drawing it would preserve what the decision removes.
- **4 Publish state boards** — cancelled, lost contact, published (simulated), no
  Vercel connection — each wired, each marked `[not-implemented]` where the code
  cannot produce it. The cancelled board does **not** say "nothing was deployed",
  because the worker has no cancel check across the Vercel deploy and that copy
  would be a lie the panel tells.
- **30 Settings headers corrected** — title becomes the breadcrumb, the invented
  subtitle and the invented primary hidden, because `DrillInHeader.tsx:12-47` has
  no action slot and no children.
- **QA-C-01 (Critical)** — the restore-confirm band grew 96 → 136 and its two
  buttons moved to y=98, clear of a body that already reached y=96.

## The reflow this arc owed itself

Rewriting a caption makes it taller, and the page parks captions in a fixed
~300px gap. Twelve captions grew past it and lay across the board below —
invisible to the write, which succeeded, and to the read-back, which matched the
string asked for. `reflow-caption-overflow.mjs` moved the rows below down by the
measured shortfall across five sections: **140 nodes, 0 drift**, each section's
new height checked against the next section's origin first.

## What is NOT done

**131 register findings remain PENDING**, and 99 queue rows have not landed:

| kind | rows | why |
|---|---|---|
| `text` / `rename` / `hotspot` with an unresolved selector | ~230 | their target board did not exist when the selector ran, or the selector matches several nodes and was left alone rather than guessing |
| `advisory` | 50 | no single node to write — cross-module instructions a person or module agent owns |
| `clone-board` / `add-board` | 38 | new boards, one call each |
| `manual-draw` | 13 | the spec is a sentence — *"FRAME 520x36 at y=321 containing: ✕ 10/Medium #E02424 in a 20x20 box…"*. A drawing instruction for someone with a cursor |
| `move` refused as `AUTOLAYOUT` | 26 | the parent owns x/y; these need `layoutPositioning` or a different fix |

Pending by module: shell 28 · inspector 24 · ai 21 · history 15 · insert 11 ·
settings 10 · publish 8 · content 6 · brand 3 · review 3 · pages 2 · layers 1.

## Independently re-checked after the fact

`scripts/figma/verify-applied.mjs` re-read the file separately from the apply:
**55 of 55 sampled rows match** their recorded read-back, **4 of 4** Content
crumb edges point at `149:50` in BOTH reaction fields, **17 of 17** built boards
are present. Coverage is 55 of 501 — a clean sample, not a proof about the other
446. Full record in `reports/qa-applied.md`.

The dedicated QA subagent stalled before its first Figma call and produced
nothing; this scripted check is what was actually run, and it is repeatable
rather than a second pair of eyes.

## Still owed, and named

- **Section 9 of the V2 corpus is PARTIAL** — it hit the ~20k response cap at 429
  TEXT nodes across 19 boards. It is filed as incomplete, not as read.
- **The component census is UNMEASURED.** It has been wrong twice; the self-test
  that catches both failure modes exists and runs offline, but the census itself
  was never taken.
- **The merged nav row is planned and gated**, and refuses `--apply` until
  `compare-nav-rows.mjs` runs, because the founder's exception rests on a
  measurement nobody has taken. Bar-vs-fill is still open — ~600 instances either
  way.
- **Two pre-existing section overlaps** (`07 · Brand`×`06 · Content`,
  `12 · AI`×`13 · Command palette`) are untouched. They predate this arc and
  belong to the arrangement lane, which every module agent deliberately deferred.

## The 26 `AUTOLAYOUT` rows are a plan error, not a blocked apply

`layers-move` (24 rows) re-ladders the Layers rows by setting `y` on each — 112,
140, 168, 196 … — to close the 51px hole left when the drop-refusal tooltip is
removed (UX-H-24 / COVER-1-62). Their parent `143:119` is a **VERTICAL
auto-layout frame**, so those y values are computed by the layout and assigning
them is a no-op. The applier now says so with the parent id and the reason
instead of drifting silently.

**The ladder does not need moving — and this is now DONE.** The
`.bdc-layers-drop-alert` bar `143:177` was sitting at **index 6, in the middle of
the tree rows**, while UX-H-24 says it is a full-width bar at the TOP of the
panel. Moving it to index 2 (straight under the Toolbar) let auto-layout reflow
the stack itself:

`149, 177, 205, 233, 261, 289, 317, 345` — a clean 28px pitch, the 51px hole
closed. **One call, where 26 coordinate writes were no-ops.**

The other two (`media-05-node-edits`) are the same shape.

Recorded rather than retried: a row that cannot work as written is a finding
about the plan, and quietly dropping it would make a plan error look like a
quota problem.

## The bookkeeping hole, and why the count moved without the file changing

Three separate passes reported findings as done while the register showed them
PENDING. The cause is one design decision and its unpaid cost:
`apply-queue.mjs` **refuses** `add-board`, `clone-board` and `manual-draw` rows,
because a generic applier that half-parsed a board spec would be worse than one
that declines. Those rows are executed by their own scripts — and those scripts
never write `queue-state.json`, which is the only thing `register-status.mjs`
reads.

So ten inspector boards, thirty settings edits and twenty-nine cloned boards were
all genuinely in the file while their findings read as untouched work.

Closed three ways, none of which is "trust the report":

1. `scripts/figma/reconcile-built-boards.mjs` reads the page and marks a board row
   `SAME` when the board it asked for exists — exact name, then name-plus-appended
   marker, then a prepended `[design-ahead]`. **29 of 30 reconciled; one board was
   genuinely missing and was then created.**
2. `register-status.mjs` now parses a verdict out of an advisory row's own text
   (`"UX-G-02 — IMPLEMENTED. Board 2846:21441 …"`), and an explicit verdict from a
   pass that OPENED the node outranks a row-derived guess when nothing landed.
3. The receipts written from agent reports were then **verified against the file**:
   all 19 claimed nodes came back PRESENT with real content — 12 to 75 children
   each, not empty clones wearing new names.

The first run of the reconciler reported **all thirty ABSENT** for boards that
were demonstrably there: one whole-page read of a thousand boards came back
silently truncated at the ~19,000-char cap. It now pages six sections per call,
warns when a chunk returns near the cap, and refuses to call a row absent when
its section was never read.
