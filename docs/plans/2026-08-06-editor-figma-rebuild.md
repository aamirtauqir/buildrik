<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260806-010418.md -->

# Editor — full rebuild to the Figma spine

Written 2026-08-06. Target of `/autoplan` review.

> **Provenance note.** The founder's prompt was truncated at `## Primary Goal`;
> everything after it was lost in transit. The founder then chose
> "I reconstruct it from Figma" + "Full rebuild to Figma" at the intake gate.
> Sections marked **[reconstructed]** are TA's reading of intent from the Figma
> file and the code, **not** the founder's words. They are the first thing the
> CEO phase should challenge.

---

## Primary goal

Make every editor surface **verifiably** match Figma `g4GzQFqzNYz5sosz1QtZXC`
page `1:3` (🖥️ Editor), and make a mismatch impossible to ship unnoticed.

Coverage target is all **287 buildable boards**, grouped as the **32 surface
families** they actually collapse to. Verification is `diff.mjs`. **Only
surfaces that diff red get rewritten** — evidence decides, not assumption.

Founder decision at the 2026-08-06 premise gate: *targeted conformance across
all 32 families*, chosen over the original "full rebuild" after both CEO voices
called the rebuild framing a strategic error.

## Premises (corrected at the premise gate)

1. **Neither artefact is the oracle. Diff the contract, not the picture.**
   ~~Figma wins where they disagree.~~ **Falsified by this repo.**
   `Publish · pre-checks` (`833:4518`) showed eight check rows;
   `runPrePublishChecks` (`server/services/publish.service.ts:18-87`) returns
   six, only two of which can hard-fail. The **board** was corrected to match
   the code on 2026-08-05. Where a board asserts behaviour, the code's contract
   wins; where it asserts appearance, the board wins. A disagreement about
   behaviour is a Figma bug and is filed as one.
2. **Coverage is measured in families, not boards.** 287 boards collapse to 32
   families (Brand 26 boards = 1 panel; Settings 14 = 1 fullpage with 14 tabs).
   Estimates that key off 287 are wrong.
3. ~~**Existing chrome is a liability.**~~ **Dropped.** 396 non-test `.tsx` and
   679 vitest files encode behaviour no board specifies. Re-derivation is
   applied per surface, only where `diff.mjs` reports FAIL.
4. **The harness is the right mechanism, but its intake does not scale as
   built.** See the CRITICAL finding below. Phase 0.4 is a precondition, not a
   nice-to-have.

## What already exists

Measured 2026-08-06, not remembered:

| Thing | Count | Note |
|---|---|---|
| Figma boards, page `1:3` | 311 top-level | 309 frames + 3 sections (1 section double-counted in the frame scan) |
| — buildable product boards | **287** | the scope of this plan |
| — `[design-ahead]`, no backend | 16 | scheduled-publish, backups, lighthouse, multiplayer, Publish·Options |
| — reference / spec / archive | 8 | `Reference · index`, 2 doc sections, Archive, slot-proof, stress + keyboard boards |
| `src/editor/**/*.tsx` (non-test) | 396 | |
| `chrome-ui/` components | 49 | the single import surface |
| Vitest files | 679 | jsdom — **blind to `tw:` classes by construction** |
| Playwright specs | 2 | |
| `data-testid` anchors in `src/` | 176 across 66 files | the harness addresses elements by testid |
| Conformance harness scripts | **10** | 8 `.mjs` + 2 test files (an earlier draft said 11) |
| Conformance **specs** (Figma side) | **8** | `topbar`, `media-drawer`, `media-bulk-bar`, `media-load-error`, `layers-{loading,load-error,no-results}`, `content-load-error` |
| Conformance **surfaces** (recipes) | 9 | +`media-card`, `shell-default` |
| Conformance **measured** surfaces | **9** | (`measured/` holds 18 entries = 9 dirs + 9 JSON; an earlier draft read that as 18) |
| `tw:` class usages in `src/` | 7,110 | of which **253 carry `var(--bk-*)` = 3.6%** — the 08-03 doc's "372 of 6,564 ≈ 6%" no longer reproduces |

Every Figma family already has a shipped counterpart directory:
`sidebar/tabs/{insert,pages,layers,media,content,build,publish,review,history,settings,templates,component-library,ai}`,
`panels/{layers,version-history}`, `editor/media/`, `editor/design-system/`
(Brand), `inspector/{sections,tabs,renderer}`, `shell/` (topbar, footer,
CmdK, notifications, modals), `rail/`.

**So this is not a greenfield build. It is a re-derivation of 396 existing files
against 287 boards.** The 2026-08-03 conformance plan said this in its own
words: *"It is not a rebuild. Every Figma family already has a shipped
counterpart, and the shell geometry already matches."* This plan deliberately
overrides that judgement on founder instruction.

### Harness coverage is the real number

The machinery landed. The coverage did not: **8 of 287 boards = 2.8%.**
Whatever else this plan is, it is mostly the job of taking that to 100%.

## Parallel-arc decision (founder, 2026-08-06)

This arc runs **concurrently** with two others:

| Arc | What | Status |
|---|---|---|
| 1 | This one — 32-family conformance | new |
| 2 | Client-review-loop walk + wire the analytics provider | new |
| 3 | Inline-style drain (`docs/plans/2026-08-01-one-component-system.md`) | **already open** |

Arc 2 exists because the wedge is unproven and unmeasured:
`packages/editor/src/shared/utils/sidebarAnalytics.ts:18-20` sets
`provider = noopProvider`, so nothing measures activation or drop-off; and per
PRODUCT-OVERVIEW.md §4 no real client has walked `/review/<token>` end to end.
Wave B of this arc is 45 boards of that loop.

**The risk the founder accepted, and its mitigation.** Three concurrent arcs on
one branch, solo-to-main, means a regression cannot be attributed. The Claude
CEO voice put it precisely: coupling the drain to a re-derivation makes every
commit change both the source of truth *and* the delivery mechanism. Since the
arcs are running anyway, the mitigation is **commit discipline, enforced by
convention and checked at review**:

- A **conformance** commit adds specs/recipes/anchors and touches **no**
  `style={{}}`.
- A **drain** commit converts inline styles and adds **no** spec.
- An **arc-2** commit touches neither `scripts/conformance/` nor chrome styling.
- Never mix two arcs in one commit. If a change genuinely needs both, split it.

The earlier draft's line *"the inline-style drain rides in the same commits"* is
**revoked** — that is exactly the un-bisectable coupling to avoid.

## Not in scope

- The 16 `[design-ahead]` boards — **code only**. The Figma boards stay drawn:
  the founder ordered them on 2026-08-05 (*"backend baad me, pehle design
  complete"*) and that order stands. They get no code yet because
  `scheduled-publish`, `backup-restore` and `lighthouse`/site-health have no
  routers, and multiplayer presence is demo-only per the PRD. Each is filed to
  TODOS.md **with its missing router named**.
  Explicitly rejected: shipping the 16 against stubs. `feedback_dev_configured_never_to_fail`
  records three production outages caused by dev fallbacks that looked like they
  worked (`runSimulation`, the fake domain, Ollama).
- The 8 reference/spec/archive boards. They are file hygiene, not product.
- The dashboard package. Different Figma pages, different arc.
- Anything on Figma pages other than `1:3`.
- Responsive/mobile. DESIGN.md says the editor is desktop-only; the Figma
  file documents the skip.

## Approach

### ~~Phase 0 — make measurement trustworthy~~ **ALREADY SHIPPED 2026-08-03. DELETED.**

This plan originally carried Phase 0 forward from the 08-03 document as
*"still unshipped, blocks everything."* **That was false, and it was the plan's
most load-bearing paragraph.** Verified by running it, 2026-08-06:

| Item | Claimed | Actual |
|---|---|---|
| 0.1 fonts | Bunny CDN, `display=swap`, 0 `document.fonts` hits | `src/themes/fonts.css` self-hosts; **10 `.woff2`** in `src/themes/fonts/`; `document.fonts` awaited in `e2e/lib/measure-lib.mjs` |
| 0.2 shared reader | not built | `e2e/lib/measure-lib.mjs` exports `TRACKED`/`fontsLoadedStatus`; imported by `style-parity.spec.ts:23` **and** `measure.mjs:20` |
| 0.3 CI browser job | not split | `.github/workflows/editor-ci.yml:199` `browser:` job, `timeout-minutes: 20`, runs `check-spec-age --mode=ci` (`:259`) and `diff.mjs --all` (`:305`) |

`node scripts/conformance/diff.mjs --all` → **PASS, 9 surfaces.**

Lesson, and it is one this repo has already written down twice
(`feedback_plan_must_grep_actual_code`, `feedback_transcription_is_not_verification`):
a plan that cites a prior plan instead of running the command inherits its
staleness. Every remaining state claim here was re-derived by execution.

### Phase 0.0 — unblock the working tree (do first, today)

`node scripts/check-styling-ratchet.mjs`, run 2026-08-06:

```
ok   inline_literal  785   (baseline 785)
FAIL inline_hoisted  349 > baseline 344 (+5)
ok   css_lines       10378 (baseline 10651, drained 273)
```

**`verify:ds` is red on the working tree**, so the pre-push hook
(`BLOCK_ON_FAIL=true`) refuses the next push. Cause is the untracked
`src/editor/shell/modals/PublishConfirmModal.tsx`: hoisted `ROW`/`KEY`/`VAL`
`React.CSSProperties` objects (`:51`, `:59`, `:60`) plus 2 inline `style={{`
= exactly +5. Convert it to `chrome-ui` + `tw:` utilities before anything else
lands, or this arc starts from a red gate.

### Phase 0.4 — make spec intake survivable (NEW, precondition)

Without this, the 30-day expiry blocks every push once coverage is broad.

- **Change-detect before re-extract.** Snapshot one page-level `get_metadata`
  call (all 287 boards' name/size/position). Diff against the previous snapshot
  to find which boards moved; re-extract only those. Prefilter, not proof — a
  pure fill edit that preserves geometry slips through, so pair it with a slower
  full re-extract on a longer cycle.
- **Age the spec, not the suite.** `check-spec-age.mjs` currently fails prepush
  on any spec past `MAX_AGE_DAYS = 30`. Scope prepush enforcement to wave-A
  surfaces; everything else warns in CI.
- **Decide the forgery control.** "Read the raw file in the PR" is a control for
  8 specs, not 287. Either accept it explicitly as unenforced, or gate on the
  `figmaHash` matching a re-fetch sampled at random.

### Phase 1 — anchors before boards

The harness addresses elements by `data-testid`. 176 anchors across 66 files
cover a fraction of 287 boards. Every board needs its targets pointable before
it can be measured. `check-anchors.mjs` already fails on a recipe naming an
absent anchor — that gate is the ratchet.

### Phase 2 — 287 specs, extracted not hand-written

`extract.mjs` pulls a board to `raw-figma/<board>.json`; the spec is derived
from it. Hand-editing a `raw-figma/*.json` can make any diff pass and nothing
mechanical catches it — the control is reading the raw file in the PR. At 287
boards this control does not scale, and that is an open risk, not a solved one.

### Phase 3 — waves

Order from the 2026-08-03 plan, which is sound: frequency-of-use first, so
drift that is felt daily dies first.

| Wave | Families | Boards (approx) | Why here |
|---|---|---|---|
| **A** | Shell states · Inspector (8 profiles) · Insert (9) · Layers (11) · Pages (10) · canvas toolbar | ~65 | every session touches these |
| **B** | Review panel (12) · S5.1–S5.6 · S5.5 reviewer-view | ~45 | the differentiator, least-exercised code |
| **C** | Media (17) · Brand (26) · Content (11) | ~54 | biggest counts, heaviest token use |
| **D** | Publish (10) · History (15) · Compare (8) · Settings S7 (14) | ~47 | low frequency, high stakes |
| **E** | AI (11) · CmdK (6) · Notifications (6) · Templates (6) · Components (5) · S1–S3 flows | ~76 | everything else |

The inline-style drain rides in the same commits. Ratchets may only fall:
`inline_literal` ≤ 785, `inline_hoisted` ≤ 344, `css_lines` ≤ 10,651.

## Test strategy

The existing 679 vitest files **cannot see this work**. jsdom loads no
stylesheet, so `getComputedStyle` on `tw:text-blue-700` returns black; 7,758
assertions stay green while the editor renders wrong. Adding vitest coverage
for board fidelity is theatre.

Real coverage is three things:
1. `diff.mjs` verdict per board (the harness) — the only mechanism that says
   *wrong from the start* rather than *changed since last time*.
2. Playwright behaviour specs for interactive boards (currently 2 specs).
3. `check-anchors.mjs` as the structural ratchet.

Token-identity checking covers **3.6%** of chrome (253 of 7,110 `tw:` usages —
see the measured table above; the 08-03 doc's "~6%" no longer reproduces). The
harness reports UNKNOWN outside that. A green board is therefore weaker evidence
than it looks — and per CRITICAL A, a MAPPED verdict says nothing about whether
the *code* used a token either.

## Where this plan is weak

Stated up front because the review phases will find them anyway:

1. **Premise 3 may be false.** Re-deriving 396 files that mostly work risks
   regressing behaviour that no test protects, in exchange for pixel fidelity.
   The 2026-08-03 plan explicitly rejected the rebuild framing.
2. **Effort is 2–3 CC-weeks minimum** (~6–8 human-weeks) with no user-visible
   feature at the end. Every hour is drift repair.
3. **The spec-forgery hole does not scale.** "Read the raw file in the PR" is
   a control for 8 boards, not 287.
4. **Two chrome accents coexisted in the Figma file** until the 2026-08-05
   drain (`#3366f2` ×95 → `#1a56db`). The file has **0 paint styles and 113
   unbound vars — every colour is a raw hex literal**, so nothing prevents
   recurrence. Rebuilding against hex literals bakes that fragility into code.
5. **Blast radius is the whole editor.** Not a lake. An ocean.

## CEO review findings (2026-08-06)

### CRITICAL — the spec pipeline cannot carry 287 boards

`extract.mjs:5-13` declares its input an **agent step**: fetching a board is a
`get_design_context` call behind interactive OAuth whose token lives in the
agent's keychain, so *"CI cannot reach it and a build script has no business
reading Claude Code's credential store."*

```
  get_design_context(board)   AGENT. interactive OAuth. NOT scriptable.  x287
        |
        v
  raw-figma/<surface>.json    committed by hand
        |
        v  extract.mjs        pure file->file (the only reason it is testable)
  specs/<surface>.json        + figmaHash + extractorVersion + extractedAt
        |
        v  measure.mjs        browser; needs a data-testid anchor to exist
  measured/<surface>.json
        |
        v  diff.mjs           0 PASS · 1 FAIL · 3 MISSING
```

`check-spec-age.mjs:45` sets `MAX_AGE_DAYS = 30` and `--mode=prepush` **fails**
past it. So 287 specs all expire inside a month, and past day 30 **every push is
blocked until all 287 are re-fetched by hand**. That treadmill will not be run.

This kills the naive "spec everything" shape of both Approach A and Approach B.

**Cheap fix that changes the economics:** one page-level `get_metadata` call
returns every board's name, size and position (2.3 MB for page `1:3`). Diff that
against the last snapshot to learn *which boards actually moved*, and re-extract
only those. Turns an O(287)/month agent treadmill into O(changed). It does not
catch a pure fill/token edit that leaves geometry identical, so it is a
prefilter, not a proof — pair it with a slower full re-extract on a longer cycle.

### CRITICAL — premise 1 is falsified by this repo's own history

`Publish · pre-checks` (board `833:4518`) rendered **eight** check rows.
`runPrePublishChecks` (`server/services/publish.service.ts:18-87`) returns
**six**, only two of which can hard-fail. The board invented Alt text, Mobile
responsive, Performance, Accessibility, Broken links, Forms validation and Legal
pages, omitted both blocking checks, and put blocking `Fix` buttons on
non-blocking warnings. **The board was corrected to match the code**, 2026-08-05.

Same arc: 4 styled `Fix` links with zero reactions, a 3-step stepper whose steps
2 and 3 did not exist, three real features reachable only through
`opacity 0.001` hotspots parked outside the board bounds, and a stress-test
string rendering as product copy on 41 boards.

"Figma wins" would have re-implemented the 8-row pre-checks board into
production. The rule has to be *diff the contract, not the picture*.

### HIGH — the board count is the wrong unit

287 boards is not 287 work items. Brand is 26 boards of one panel; Media 17;
History 15; Settings 14 tabs of one fullpage; Review panel 12. Collapsed to
component x state, the real surface count is roughly 40-50. Every effort
estimate in this plan that keys off 287 is wrong, in the plan's favour — but
"rebuild all 287 boards" is not an honest description of the work.

### Sections 1-11 (CEO deep review, SELECTIVE EXPANSION)

**1 · Architecture.** No new architecture; the harness exists. New coupling is
real though: `data-testid` stops being a test detail and becomes a **published
contract** between chrome and recipes.

```
  Figma page 1:3 ──get_design_context──▶ raw-figma/*.json   [AGENT, x287]
                                              │
   src/editor/**  ──data-testid anchors──┐    │ extract.mjs
                                         │    ▼
                          measure.mjs ◀── surfaces/*.json  specs/*.json
                                 │                              │
                                 └────────▶ diff.mjs ◀──────────┘
                                              │
                                    0 PASS · 1 FAIL · 3 MISSING
```
SPOF: the agent step (Phase 0.4). Rollback: one commit per family, revert a
family without touching the rest.

**2 · Error & rescue.** The 0/1/3 taxonomy is well-built — 1 means design and
code disagree, 3 means we never got far enough to know, and `extract.mjs`
deliberately never returns 1. Gaps found:

| Codepath | Failure | Rescued? | User sees |
|---|---|---|---|
| `get_design_context` | payload too large | **N — GAP** | truncation; **observed today**: page `1:3` metadata returned 2.3 MB and was truncated by the tool layer |
| `get_design_context` | MCP rate limit mid-run | **N — GAP** | partial extraction, no resume point |
| `extract.mjs` | raw absent / `code` empty / 0 targets | Y | exit 3 MISSING |
| `measure.mjs` | anchor in src but not rendered in that state | Y | distinguished from absent-anchor (`check-anchors.mjs:15-16`) |
| `check-spec-age` | spec past 30d | Y (fails prepush) | **blocks the push** — see Phase 0.4 |

Both GAPs are new at 287-board scale and did not exist at 8. Extraction needs to
be resumable and chunked.

**3 · Security.** Read-only scripts, no new endpoint, no new secret. One
non-obvious vector: a hand-edited `raw-figma/*.json` makes CI assert a false
truth. Likelihood Low, impact Med. Unmitigated by design today; Phase 0.4 forces
an explicit decision rather than leaving it implied.

**4 · Data flow & edge cases.** Shadow paths covered by the taxonomy. Unhandled:
a board that renders only after interaction the recipe cannot reach (modal behind
a `confirm`), and repeated elements — handled by `mode: "uniform"`, which asserts
siblings agree and catches one-card-in-twelve.

**5 · Code quality.** 287 committed spec JSONs is fine (derived, regenerable).
DRY risk is in `surfaces/` recipes: 26 Brand states will duplicate the same
open-the-panel step sequence. Recommend family-level recipes with per-state
step deltas.

**6 · Tests — the section that matters.** 679 vitest files cannot see any of
this: jsdom loads no stylesheet, so `getComputedStyle` on `tw:text-blue-700`
returns black. Coverage here is `diff.mjs`, 2 Playwright specs, and
`check-anchors.mjs`. **Every gate added must be watched to FAIL before it is
believed** — plant a violation and confirm red. Five gates in a prior arc were
green while broken. `extract.mjs:47-48` records exactly this working ("A
negative control caught it"); keep that discipline for every new gate.

**7 · Performance.** 287 surfaces x browser visit is the CI cost. Mitigated by
measuring all states in one page visit. Watch for the run exceeding the job
timeout once coverage passes ~100 surfaces.

**8 · Observability.** `diff.mjs` prints a flat table — legible at 8 surfaces,
not at 287. Needs per-family grouping and a summary line, plus screenshots on
failure, before wave C.

**9 · Deployment.** Not a deploy; per-family commits behind existing ratchets
(`inline_literal` ≤ 785, `inline_hoisted` ≤ 344, `css_lines` ≤ 10,651), which may
only fall. Rollback is `git revert` of one family commit.

**10 · Trajectory.** Reversibility 4/5. The debt this does **not** pay: Figma
has 0 paint styles and 113 unbound variables, so every colour is a raw hex
literal. That is why `#3366f2` reached 95 instances across 65 boards and needed
a hand drain. This plan detects the next drift instead of preventing it. Filed
to TODOS, not scope.

**11 · Design & UX.** UI scope confirmed — 32 families, every one user-facing.
Handed to Phase 2.

## Design review findings (2026-08-06)

Initial design completeness: **4/10**. This plan *verifies* design rather than
designing, so the question flips: does its verification actually protect design
quality? A 10 states what the harness protects, what it structurally cannot, and
names the human control for the gap. The plan currently states none of the three.

### Pass 5 · Design-system alignment — CRITICAL, conflicts with Gate 16

DESIGN.md mandates one accent, `#1A56DB`, reached through `var(--bk-*)`. The
Figma file has **0 paint styles and 113 unbound variables — every colour is a raw
hex literal.** A spec extracted from that file therefore encodes **hex values,
not token identity**, and `diff.mjs` marks token identity `UNKNOWN` on 96.4% of
chrome (253 of 7,110 `tw:` usages carry a `var(--bk-*)`).

Consequence the plan never states: when a board and the code disagree on a
colour, **the harness cannot tell you whether the correct fix is a token or a
literal.** Applying the board's hex directly satisfies `diff.mjs` and trips
**Gate 16**, the hex ratchet, which may only fall (drain target 49 CSS + 143
TSX). A green conformance run and a red DS gate are reachable from the same fix.

**Fix:** every colour finding resolves to a `--bk-*` token or is not applied. If
no token carries that value, the finding is a **Figma bug** (an unbound colour)
and goes back to the file, not into code. Spec rows should carry the intended
token name so the fix is unambiguous.

### Pass 2 · Interaction-state coverage — the boards themselves are ragged

Conforming to the boards inherits the boards' gaps. Computed across the 12 panel
families, 2026-08-06:

```
panel          loading   load-error  empty    no-results
-------------- --------- ----------- -------- ----------
Insert         yes       yes         --       yes
Pages          yes       yes         yes      yes
Layers         yes       yes         yes      yes
Media          yes       yes         yes      yes
Content        yes       yes         yes      --
Brand          yes       yes         --       --
Review panel   --        yes         yes      --
History        --        yes         yes      --
Notifications  yes       yes         yes      --
Templates      yes       yes         --       yes
Components     yes       yes         --       --
Publish        yes       yes         --       --
```

`load-error` is 12/12. Everything else is uneven, and two gaps are real UX holes
rather than N/A:

- **Review panel and History have `load-error` but no `loading`.** The user sees
  nothing at all during load, then an error. Those are the two 360-wide overlay
  panels — the slowest to populate.
- **Components has no `empty` board**, yet an empty component library is the
  *first-run state for every new site*. Same for **Brand** (fresh workspace, no
  tokens) and **Templates** (workspace with none).

Insert has no `empty` legitimately (it always lists elements); Publish is covered
by `not-connected`. Those are N/A, not gaps.

**Fix:** file 5 boards to Figma before wave A reaches those families —
`Review panel · loading`, `History · loading`, `Components · empty`,
`Brand · empty`, `Templates · empty`. Do not let an engineer invent them at
implementation time; that is how "No items found." ships.

### Pass 1 · Information architecture (of the report) — 3/10

`diff.mjs` prints a flat property table. Legible at 9 surfaces and 74 properties;
unreadable at 287 surfaces and ~2,300. If the first full run prints 400 FAIL rows
with no grouping, the arc stalls on triage. Needs per-family grouping, a summary
line, and worst-offender ordering **before wave C**, not after.

### Pass 3 · Journey — 4/10

Two humans have a journey here and the plan considers neither: the **implementer**
reading a failure list, and the **reviewer** asked to eyeball a `raw-figma` blob.
The second is the forgery control, and at 287 boards it is a control nobody will
perform.

### Pass 4 · AI-slop risk — 7/10

Low. No new UI is being invented; Gate 18 already bans the purple/violet/indigo
bleed and the Flowbite purple ramp is allowlisted only for PRO badge and avatar
identity tones. Residual risk is conforming to a board that itself carries slop —
the two-accent incident (`#3366f2` x95 across 65 boards) was exactly that, and it
was caught by hand, not by a gate.

### Pass 6 · Responsive & a11y — 4/10 (revised down)

**The plan contradicts itself on responsive, and an earlier draft of this very
section repeated the error.** "Desktop-only, documented skip" is true of the
editor *chrome*. It is not true of the product: `shell-default` carries a
`breakpoint-switcher` target, the footer ships W/T/M controls, and two boards
exist for it — `S3.4 · responsive-viewport · breakpoint-bar` and
`S3.8 · preview-responsive · mobile-device-frame`.

Those drive the **canvas** viewport — the customer's site rendered at a chosen
breakpoint. That is a first-class UI contract with boards, and it needs
conformance coverage. Conflating "chrome is desktop-only" with "responsive is out
of scope" silently drops it.

**Fix:** state the two rules separately. (1) Editor chrome renders at 1440x900
only — skip, documented. (2) The canvas breakpoint switcher is in scope and its
boards get specs like any other family.

**A11y — corrected, and worse than "missing".** An earlier draft of this section
said nothing asserts contrast. Wrong: contrast **is** measured, and
`.conformance-baseline.json` records for `shell-default`:

```json
{ "skipped": 4, "compared": 7, "contrastFailures": 3, "nonTextFailures": 0 }
```

**Three contrast failures are baselined as accepted on the editor's default
surface right now.** That is not an unbuilt check, it is grandfathered a11y debt,
and nothing in this plan drives it to zero. `target-size` also runs in the browser
CI job.

Still genuinely absent: acceptance for keyboard nav, focus visibility, tab order,
escape handling, and accessible names. The two archived `S1-keyboard` /
`S1-stress` boards are treated as reference, not contract.

**Fix:** make `contrastFailures` a falling ratchet like the styling ones — 3 may
become 2, never 4 — and name the three offenders in TODOS.

### ACCEPTED SCOPE EXPANSION — tokenize the Figma file first

Both design voices reached this independently, and it is the root cause behind
Pass 5, Pass 6's contrast gap, and the recurring accent drain.

**Phase 0.5 — bind before extract.** In `g4GzQFqzNYz5sosz1QtZXC`: create paint
styles for the DESIGN.md palette, bind the 113 unbound variables, and replace raw
hex with variable references on page `1:3`. Then extract.

Why it is in scope rather than deferred: the specs are *derived from this file*.
Extracting 287 specs from raw hex bakes 287 unbound literals into committed
artifacts, and `diff.mjs` will report token identity `UNKNOWN` on essentially all
of them — which is the state that let `#3366f2` reach 95 instances across 65
boards before a human caught it. Doing this after extraction means re-extracting
everything.

Effort: human ~1 day / CC ~1 hour. Blast radius: the Figma file only, no code.

**Caveat the founder should weigh at the gate:** this edits a file closed at
100% on 2026-08-05. It is additive (styles and bindings, no geometry or wiring
change) but it is not zero-risk, and `feedback_figma_silent_noop_writes` records
that variable-mode writes can silently no-op — **read back, do not trust the
counter.**

### REQUIRED — a canonical state model, not sampled states

Codex: *"interaction states are not designed; they are sampled."* Confirmed by
the coverage table above — the harness knows the states it happens to have, not
the states the editor can be in.

Publish is the proof: `prePublishChecksResultSchema`
(`packages/shared/schemas/publish.ts:78-85`) defines `pass | warning | fail` per
check plus a top-level `ready` boolean. That is the real state model, it is
already a shared Zod schema, and no board enumerates its combinations.

**Fix:** before wave A, write one state matrix per family covering loading,
empty, error, partial, stale, disabled and blocked. Derive it from the Zod
schemas in `packages/shared/schemas/` where one exists — those are the contract,
and they are testable. Boards that contradict a schema are Figma bugs.

### Pass 7 · Unresolved design decisions

| Decision needed | If deferred |
|---|---|
| Token or literal when a colour diffs? | Engineer applies the hex, Gate 16 goes red |
| Who authors the 5 missing state boards? | Engineer invents "No items found." |
| Report grouping at 287 surfaces? | First full run is untriageable, arc stalls |
| Is a board's behaviour claim authoritative? | The 8-row pre-checks defect ships again |

## THE TWO FINDINGS THAT CHANGE WHAT GETS BUILT

### CRITICAL A — the harness will launder Figma's unbound hex INTO the codebase

`lib.mjs:82` exports `figmaTokenValue()`, the one function that resolves a Figma
token to the repo's own value. **It is called by nothing but its own unit test**
(`conformance-lib.test.mjs:46-54`). Verified: `grep -rn figmaTokenValue scripts/`
returns the definition, and three test lines. `extract.mjs`, `measure.mjs` and
`diff.mjs` never call it.

What `diff.mjs:130` actually does:

```js
const value = compareValue(prop, expected.value, actual);   // board's raw fallback
let token = "UNKNOWN";
if (expected.token) token = figmaTokenToBk(expected.token) ? "MAPPED" : "UNMAPPED";
```

It compares the **board's literal fallback**. The token verdict only answers
*"can this token name be mapped"* — never *"does the board's hex equal what that
token holds"* — and is documented advisory, never a failure.

**The failure mode, concretely.** A designer edits a fill to `#3366f2` (this
happened 95 times across 65 boards and needed a hand drain on 2026-08-05).
`raw-figma` captures `var(--color/accent,#3366f2)`. `extract.mjs` writes
`value: "#3366f2"`. `diff.mjs` then **FAILS a component that correctly renders
`var(--bk-accent)` = `#1A56DB`**, and the implementer, following this plan, fixes
the red diff by deleting the correct token usage. Gate 16 goes red behind them.

At 8 surfaces a human catches it. Across 287 in five waves, nobody will.

**Fix (small, and it inverts the arc's worst failure mode):**
1. In `extract.mjs`, when a prop carries both token and fallback, compare the
   fallback to `figmaTokenValue(token)` and **refuse to write the spec on
   mismatch** — that is a Figma bug, filed as one, exactly per premise 1.
2. In `diff.mjs`, when a token is named and maps, compare against the **token's**
   value; treat the board literal as advisory. Invert today's polarity.
3. Watch it fail on a planted `#3366f2` before trusting it.

### CRITICAL B — the plan cites the wrong sources, and 4 authoritative docs exist

`DESIGN.md:232` carries a **`⚠ SUPERSEDED 2026-07-18`** banner over its own editor
layout sections — *"A designer who follows them builds the previous product"* —
and redirects to four documents. All four exist and this plan cited **none**:

| Doc | Lines |
|---|---|
| `docs/designs/2026-07-17-editor-product-redesign-complete.md` | 919 |
| `docs/designs/2026-07-18-editor-shell-wireframes.md` | 328 |
| `docs/designs/2026-07-18-site-fullpage-wireframes.md` | 388 |
| `docs/prd/editor/14-screen-specs.md` | 562 |

`editor-shell-wireframes.md` already contains, marked final: the 12 shell states
(§4), **empty-state copy for 11 surfaces marked "final, not placeholder" (§5.7)**,
the five control states (§5.8), and a ten-layer z-index contract (§5.9).

**Verified damage.** Sampling §5.7's final copy against `src/`:

| Final copy | In `src/` |
|---|---|
| "This site has one page." | **0 hits** |
| "No images or files yet." | **0 hits** |
| "Select something on the canvas to edit it." | **0 hits** |
| "No brand set. …" | **0 hits** |
| "No comments yet. …" | **0 hits** |

`PageList.tsx:116` ships `<EmptyStateTitle>No pages yet</EmptyStateTitle>` — and
`PageList.test.tsx:55` **asserts the drifted string**. The test protects the
drift, the same shape as the ⌘-key hijack where a test guarded the bug.

**A geometry/colour/type diff will never see any of this**, and the acceptance
criteria would mark all 11 boards green.

**Fix:** add a **copy manifest** with string-equality assertions. It is cheaper
than any board extraction and catches more. Then state the precedence order for a
four-way conflict (Figma board · DESIGN.md values · the 4 superseding docs · code
contract), because the plan currently has a written rule for exactly one pairwise
case.

### Also unresolved, from the same review

- **"32 surface families" is never enumerated anywhere** and no `boards.json`
  exists. Counts moved Brand 14→26, Media 15→17, Inspector 11→8 (code says **7**
  profiles) in three days. Generate the manifest as **Phase 0.1**, before waves
  are tabled — nothing downstream is checkable without it.
- **Wave B contradicts "Not in scope".** Wave B lists `S5.5 reviewer-view`;
  `14-screen-specs.md:370` puts S5.5 at `dashboard/app/review/[token]/`, and the
  plan excludes the dashboard package. Pick one.
- **`shell-default` specs 1 of 5 targets.** Skipped: rail, sidebar-panel, canvas,
  breakpoint-switcher — the first three things a user sees. It should be the
  first surface to reach `skipped: 0`, ahead of Media's 17 boards.
- **Structure, motion and focus are unverifiable by construction.** `TRACKED`
  (`measure-lib.mjs:55-69`) is 40 properties and omits `transition`, `cursor`,
  `outline`, `position`, `z-index`. The README says it plainly: *"the shipped
  topbar renders three controls board 681:26 does not contain — the screenshot
  caught that, the numbers could not."* Geometry, colour and type are all
  property classes; none is structure. Add a `structure` assertion (ordered child
  testids) and a `text` assertion to the recipe schema.
- **This plan contradicted itself on token coverage** — corrected 6% → 3.6% in
  one section and re-asserted 6% in another. One number, one place.

## Eng review findings (2026-08-06)

### 1 · Architecture — what scales and what does not

Measured, not assumed:

| Dimension | Today (9 surfaces) | At 287 | Verdict |
|---|---|---|---|
| Distinct `data-testid` anchors | 23 across 9 recipes (33 refs) | ~150 needed; **134 already exist** in `src/` | **NOT a bottleneck** — a gap of tens |
| Spec intake | 9 agent calls, once | 287 agent calls, **re-run every 30 days** | **THE bottleneck** (Phase 0.4) |
| Properties compared | 74 | ~2,300 vs 7,110 `tw:` usages | thin — hence property-denominated acceptance |
| Browser CI | 1 job, 20 min budget | 287 surface visits | needs measurement before wave C |

The anchoring cost has been consistently over-estimated (by me, in an earlier
draft, and in the plan's Phase 1 framing). Recipes reuse anchors across the
states of a family; 9 recipes need only 23. The real constraint is the agent
step, and Phase 0.4 addresses it.

### 2 · The harness is sounder than it looks — correcting the record

Two worries raised during review do not survive reading the code:

- *"9/9 PASS, so it may be a gate that cannot fail."* `conformance-scripts.test.mjs`
  (33 tests) + `conformance-lib.test.mjs` (25 tests) include explicit negative
  controls: `FAIL (1) on a value disagreement, naming the delta`, and
  `FAIL (1) when SKIPPED rises above the baseline — coverage may not shrink`.
  It has been watched to fail. (Suite size is **78**, now 80 with T2's two cases
  — an earlier draft here said 58, which was an `it(` grep undercount; the
  README's "78 tests" was correct.)
- *"Coverage can silently shrink."* `diff.mjs:27-29` counts SKIPPED in the header
  and checks it against `.conformance-baseline.json`. The exit taxonomy is
  0 PASS / 1 FAIL / 2 STALE / 3 MISSING, and `extract.mjs` deliberately never
  returns 1 because it performs no comparison.

This is well-built infrastructure with thin coverage — not shaky infrastructure.
The plan's job is coverage and intake, not rebuilding the harness.

### 3 · Test review — the regression net the plan argued itself out of

The plan claimed *"adding vitest coverage for board fidelity is theatre."* True
for **styling**, false for **behaviour**, and the distinction is load-bearing:
jsdom is blind to `tw:` classes but not to props, handlers, state transitions, or
engine calls. Since surfaces that diff red get **re-derived**, the behaviour tests
are precisely the net that catches what re-derivation breaks.

**Rule:** before a surface is re-derived, check test coverage on the files it
touches. Below the bar, behaviour tests get written **first**. Re-derivation
without that is a rewrite with no rollback signal.

### 4 · Failure modes registry

| Codepath | Failure | Rescued? | Test? | User sees | CRITICAL? |
|---|---|---|---|---|---|
| `get_design_context` | payload too large | N | N | truncation (**observed**: 2.3 MB page metadata) | **GAP** |
| `get_design_context` | rate limit mid-run | N | N | partial extraction, no resume | **GAP** |
| `extract.mjs` | raw absent / empty / 0 targets | Y | Y | exit 3 MISSING | ok |
| `diff.mjs` | value disagreement | Y | Y | exit 1 + grouped delta | ok |
| `diff.mjs` | every target SKIPPED | Y | Y | exit 3 + count | ok |
| `check-spec-age` | spec > 30d | Y | Y | **blocks push** | **GAP at scale** |
| `check-anchors` | recipe names absent testid | Y | Y | exit non-zero, names it | ok |

Two GAPs, both new at 287-scale, both in the intake. Extraction must be
**chunked and resumable** — a run that dies at board 200 must not restart at 1.

### 5 · Parallel-arc attribution

Three arcs, one branch, solo-to-main. The commit-discipline rule above is
necessary but **not sufficient** — nothing enforces it. Recommend a cheap
mechanical check: a pre-commit assertion that a single commit does not touch both
`scripts/conformance/` and files whose inline-style count changed. If that is too
fiddly, accept the risk explicitly and keep arcs on separate days.

## DX review findings (2026-08-06) — the largest lever in this plan

Measured by execution, not inference.

### LIVE BUG 1 — `diff --update-baseline` deletes the a11y ratchet

```js
// diff.mjs:216   — fresh object, drops contrastFailures + nonTextFailures
baseline[surfaceId] = { skipped: skipped.length, compared: rows.length };

// measure.mjs:503 — spreads, preserves them
bl[surfaceId] = { ...entry, contrastFailures: textNow, nonTextFailures: iconNow };
```

Two scripts write one file with two merge semantics. After `diff --update-baseline`,
the next `measure` reads `contrastFailures ?? 0`, sees 3, and prints **"TEXT
CONTRAST REGRESSION: 3 > baseline 0. A new failure was introduced"** — a false
statement about a cause that never happened. The dev re-runs
`measure --update-baseline` and the loop repeats. `diff --all --update-baseline`
disarms **every** contrast baseline in the repo in one command, with no
confirmation and no dry-run. The 58 tests do not cover it.

**Fix:** one `readBaseline`/`writeBaseline` pair in `lib.mjs` that merges by key;
a test asserting `diff --update-baseline` preserves `contrastFailures`; require
`--yes` for `--all --update-baseline`.

### LIVE BUG 2 — the coverage ratchet protects 1 surface of 9

`.conformance-baseline.json` has exactly **one** entry (`shell-default`) against
**nine** recipes. The "coverage may grow, never shrink" guarantee that
`diff.mjs:27-30` explains at length, and that this plan's acceptance leans on,
currently covers one ninth of the harness.

Worse: `runEvery` (`lib.mjs:285`) enumerates whatever is in `surfaces/`. Delete 87
recipes at 287 coverage and it prints `[all] PASS — 200 surface(s)` and exits 0.
The orphaned baseline keys are never read. **The harness whose purpose is
preventing gates that quietly stop checking has an unratcheted surface inventory.**

**Fix:** `conformance/boards.json` as the committed manifest (already required for
scope reconciliation) doubles as the expected-surface ratchet — `runEvery` fails
if an `active` board has no recipe. Add baseline entries for all 9 surfaces today.

### The intake is the real bottleneck, and Phase 0.4 points at the wrong one

Measured per-surface cost today: **~60 min** for the 10th surface in a new family,
**35-60 min** in an already-probed family, **3-4.5 h** for a first-timer on the
README alone. The documented path is wrong for **8 of 9 surfaces**: `README.md:53-59`
says `npx vite --port 5050`, but only `shell-default` uses 5050 — the other eight
run against a **probe** server at `:5051` (`npx vite . --port 5051 --strictPort`,
different vite root) whose existence is documented only in a CI comment. The
README never mentions `e2e/probe/probe.tsx` at all, and registering a probe case
is step 2 of 12.

The most likely first-run failure is `measure.mjs:60` — an **uncaught**
`page.goto` throw (`ERR_CONNECTION_REFUSED`) that exits **1**, which in this
harness's own taxonomy means *FAIL: a measured value did not match its spec*. A
newcomer reads FAIL and starts debugging their CSS.

**Phase 0.4 solves re-fetching 287 specs monthly — an O(changed) problem. It does
not touch authoring 287 recipes, 287 probe cases and ~1,500 anchors — an O(287)
problem an order of magnitude larger.** Cutting intake from ~60 min to ~15 min
across 287 boards is **~200 hours**, against ~26 hours of DX work. Roughly 8:1,
and it is the highest-leverage work in this plan.

### Other confirmed intake defects

| # | Defect | Effect |
|---|---|---|
| F4 | `extract.mjs --help` **rewrites all 8 committed specs** (no flag validation; `args.find(a => !a.startsWith("--"))`) | idempotent today; a 287-file commit the day `EXTRACTOR_VERSION` bumps |
| F8 | Exit taxonomy inconsistent: usage errors take **2 (STALE)** in 3 scripts; `check-spec-age` reports staleness as **1 (FAIL)** not 2; `measure` reports a missing target as **1** not 3 | and nothing consumes the taxonomy — CI collapses it to `!= 0` |
| F6 | `check-anchors.mjs:49` bare `JSON.parse`, never calls `validateRecipe` | schema violations escape the 0.3s local gate and surface in the 20-min CI job |
| F7 | `check-anchors` substring-matches 4 literal forms; `chrome-ui/Chip.tsx:61` uses `data-testid={countTestId}` (a prop) | reports a rendering anchor as missing, blocking the push for a false reason. Only 3 of 49 `chrome-ui` components carry a testid, so this is the normal case, not an edge |
| F11 | Measured **4.4 s/surface**; 287 = ~21 min local, **32-42 min on CI**. `browser:` job is `timeout-minutes: 20` and already runs parity + target-size first | **budget breaks at ~110 surfaces = wave A + wave B**, not "after wave C". Cause: `runEvery` spawns a fresh node + fresh chromium per surface |
| F12 | No `--json`, no `--failures-only`, no grouping. 167 lines for 9 surfaces → **~5,300 lines** at 287, ~95% passing rows | the triage consumer in this repo is an agent; `rows[]` in `diff.mjs:138-145` is already the right shape for a reporter |
| F10b | No per-surface skip and no allowlist — despite `scripts/gates/overlay-allowlist.txt` being exactly that idiom for Gate 22 | the 5 state boards filed to Figma leave CI red, and per the README's own argument "a gate that is red on arrival gets disabled" |

**Acceptance criteria that cannot be emitted yet.** This plan requires *"every
report prints assertion count beside board count"* and *"`skipped` is a falling
ratchet per surface."* Neither is implementable without F12 and F10. Both move
into Phase 0.4 as **preconditions** — a criterion no tool can emit gets marked
done by inspection.

## Acceptance

**Board-denominated acceptance is vacuous and has been replaced.** Measured
2026-08-06: the 9 shipped surfaces compare **74 properties total** (5, 7, 8, 8,
5, 7, 24, 3, 7). `shell-default` compares 7 properties, all on `topbar`, and
**skips 4 of its 5 targets** — rail, sidebar-panel, canvas and
breakpoint-switcher carry no spec. Extrapolated, 287 boards x ~8 properties is
~2,300 assertions against 7,110 `tw:` usages and 10,378 in-scope CSS lines, with
token identity resolving on 3.6%. "287/287 green" is satisfiable while the
editor renders wrong nearly everywhere.

**Half of this mechanism already exists — extend it, do not reinvent it.**
`diff.mjs:27-29` already counts SKIPPED rather than hiding it, and checks it
against `.conformance-baseline.json` so *coverage cannot shrink*. The harness
also has real negative controls: `conformance-scripts.test.mjs` asserts
`FAIL (1) on a value disagreement, naming the delta` and `FAIL (1) when SKIPPED
rises above the baseline`, across 58 tests. It is provably capable of failing —
the "9/9 PASS so it may be a lying gate" worry does not survive reading the tests.

Acceptance is therefore **property-denominated**, built on that baseline file:

- Every target named by a recipe carries **≥1 assertion each for geometry,
  colour and type**. `skipped` is a **falling ratchet per surface** — today
  `shell-default` is at 4 of 5 targets skipped; it may fall, never rise.
- `contrastFailures` is a falling ratchet too. Today: **3 on `shell-default`**.
- Every report prints **total assertion count beside board count**. A board with
  3 assertions and a board with 40 must never both print "PASS".
- `check-anchors.mjs` passes; every recipe testid resolves.
- Three ratchets fell and none rose — **`inline_hoisted` is +5 over baseline
  today**, so this starts red (Phase 0.0).
- Every new gate has been **watched to fail** on a planted violation before
  being trusted.
- A **reverse pass** exists: shipped surfaces enumerated and marked
  `has-board` / `no-board`. Under a Figma→code-only criterion an unspecified
  surface is invisible — no board, no spec, no anchor, no diff. `no-board` is
  either a Figma gap or dead code; both are worth more than re-deriving a board
  that already looked right.
- A committed **board manifest** (`conformance/boards.json`: nodeId, name, family,
  state, classification, authority, `status: active|pending-figma|out-of-scope`)
  generated by script, and the plan cites that file. Board counts recorded for
  page `1:3` within one day on 2026-08-05 were 347, 355, 351, 347; this plan's own
  scan says 311 top-level; Brand moved 14→26, Media 15→17, Inspector 11→8 (code
  says **7** profiles) in three days. **A scope you cannot diff will drift
  mid-arc.** This is **Phase 0.1**, not an acceptance bullet — nothing downstream
  (wave sizing, effort, the 32-family claim, the reverse pass) is checkable
  without it.

## Implementation Tasks

Synthesized from this review. P1 blocks the arc; P2 lands same branch.

- [x] **T3 (P1) — chrome — convert `PublishConfirmModal` to chrome-ui + `tw:`** ✅ **DONE 2026-08-06**
  - Surfaced by: Phase 0.0 — `inline_hoisted 349 > 344 (+5)`, `verify:ds` red, push blocked
  - `ROW`/`KEY`/`VAL` `CSSProperties` → `tw:` class strings; 2 inline `style={{}}` → `className`
  - Verified: ratchet **PASS, `inline_hoisted 337`** (7 *below* the 344 baseline, `inline_literal` 783 −2);
    `tsc` clean; 11/11 tests. jsdom cannot see `tw:`, so also **built the CSS and confirmed every class
    emits the right declaration** — incl. `text-\[12px\]{font-size:12px}` and
    `text-\[var\(--bk-warning-text\)\]{color:…}` resolving separately on the same element.
- [x] **T2 (P1) — harness — wire `figmaTokenValue()` into extract + diff** ✅ **DONE 2026-08-06**
  - Surfaced by: CRITICAL A — dead function; `diff` compared the board's raw fallback
  - `extract.mjs`: refuses a spec when a class's literal fallback contradicts the token it names
    (unresolvable tokens stay UNKNOWN, never a failure). `diff.mjs`: compares the **token's** value
    when the token places, falling back to the literal only when it does not.
  - Verified: all 8 specs re-extract **byte-identical**; `diff --all` PASS 9 surfaces; anchors PASS.
    **Negative control run:** planted `#3366f2` on `--color/warning-tint` in `raw-figma/topbar.json` →
    extract refused, exit 3, `board says #3366f2, token --color/warning-tint holds #fdfdea`. Restored clean.
  - Codified as 2 new tests (refusal + the agreeing case, so the check cannot reject the ordinary path).
    Harness suite **80 passing**.
- [x] **T1 (P1) — harness — unify baseline read/write** ✅ **DONE** — `patchBaseline` in `lib.mjs`
  merges by key; both writers use it. Verified live: the 3 grandfathered contrast failures now
  survive a `diff --update-baseline` that previously erased them.
- [x] **T4 (P1) — harness — `boards.json` + expected-surface ratchet** ✅ **DONE** —
  **288 active / 16 design-ahead / 8 out-of-scope / 33 active families.** Corrects the 287/32 this
  plan asserted an hour earlier. `check-boards.mjs` ratchets recipe count, board status, and orphaned
  baseline keys; wired into `verify:ds` + `gate:boards`. Real coverage stated where it cannot be
  rounded up: **6/288 = 2.1%**.
- [x] **T6 (P2) — harness — catch `page.goto`, exit 3 not 1** ✅ **DONE** — names the server for the
  recipe's port. Missing recipe + font-load failure also gained cause + fix.
- [x] **T7 (P2) — harness — `parseArgs`; `--help` must not rewrite 8 specs** ✅ **DONE** — allowlist,
  exit 64 (EX_USAGE, not 2/STALE). `--url` also stopped being positional. Added
  `conformance:serve` + `serve.sh` because the README documented the wrong server for 8 of 9 surfaces.
- [x] **T8 (P2) — harness — `--json` + `--failures-only`** ✅ **DONE**

### Stopped here, deliberately

- [ ] **T13 (P2) — `structure` + `text` assertions; extend `TRACKED`** — **BLOCKED on a browser run.**
  `measure-lib.mjs:50-54` states the constraint: a property added to `TRACKED` is absent from the old
  records, so it reports on every node, and 120 baseline nodes already carried no `min-width` /
  `overflow-x` because the list grew and nothing re-captured. Extending it requires
  `pnpm test:parity:update` **in the same commit**, and the moved values must be read and explained
  by a human. Doing that unattended is how a wrong baseline becomes permanent — the exact failure
  this harness exists to prevent.
- [ ] **T5 (P1) — shared browser + `--shard`** — needs a live run to measure the speedup it claims;
  4.4 s/surface was measured once, on a warm local server.
- [ ] **T4 (P1, human: ~3h / CC: ~45min) — harness — generate `boards.json`, use it as the expected-surface ratchet**
  - Surfaced by: CRITICAL 4 + LIVE BUG 2 — 32 families never enumerated; baseline covers 1 of 9
  - Verify: delete a recipe, confirm `--all` fails instead of printing PASS
- [ ] **T5 (P1, human: ~4h / CC: ~1h) — harness — shared browser + `--shard`**
  - Surfaced by: DX F11 — 4.4 s/surface measured; CI budget breaks at ~110 = wave A + B
  - Files: `scripts/conformance/lib.mjs`, `.github/workflows/editor-ci.yml`
- [ ] **T9 (P1, human: ~2h / CC: ~20min) — design-docs — copy manifest + reconcile §5.7**
  - Surfaced by: CRITICAL B — 5 of 5 sampled final lines absent; `PageList.test.tsx:55` asserts the drift
- [ ] **T10 (P1, human: ~1h / CC: ~15min) — design-docs — write the 4-way precedence rule**
- [ ] **T6 (P2, ~20min / ~5min) — harness — catch `page.goto`, exit 3 not 1** (DX F2)
- [ ] **T7 (P2, ~1.5h / ~20min) — harness — `parseArgs`; `--help` must not rewrite 8 specs** (DX F4)
- [ ] **T8 (P2, ~3h / ~30min) — harness — `--json` + `--failures-only`** (DX F12)
- [ ] **T11 (P2, ~1d / ~1h) — figma — bind 113 vars, create paint styles** (accepted expansion)
- [ ] **T12 (P2, ~2h / ~30min) — figma — file the 5 missing state boards**
- [ ] **T13 (P2, ~3h / ~30min) — harness — `structure` + `text` assertions; extend `TRACKED`**

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | issues_open | 3 proposals, 1 accepted, 2 deferred; 3 critical gaps |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open | 7 issues, 2 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | score 4/10 → 7/10, 4 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 1 | issues_open | score 3/10, TTHW 60min → 15min target |

**CODEX:** CEO voice ran and returned a hard verdict ("full rebuild is a strategic
error"); design voice ran; **eng voice timed out at 600 s (`CODEX_EXIT=124`)**.

**CROSS-MODEL:** CEO 6/6 CONFIRMED, 0 disagreements — both voices independently
rejected the original scope. Design 5/6 with one disagreement (I called responsive
a legitimate skip; Codex correctly caught the `breakpoint-switcher` contradiction,
and Codex was right). **Eng phase ran single-reviewer** — the Codex voice timed out
and the Claude subagent stalled at 600 s after reaching "confirmed a vacuous-pass
hole". **DX ran subagent-only.** Both degradations are recorded rather than hidden;
the Eng findings here carry one model's confidence, not two.

**VERDICT:** CEO + DESIGN + DX CLEARED with issues open. ENG NOT CLEARED —
single-reviewer coverage on the phase that owns the two live harness bugs. Re-run
`/plan-eng-review` before implementation starts.

**UNRESOLVED DECISIONS:**
- Wave B lists `S5.5 reviewer-view`, which `14-screen-specs.md:370` places in the
  excluded dashboard package. The plan asserts both on one page.
- Whether the ~26 h of DX intake work (T1, T5-T8) lands before wave A. Arithmetic
  says 8:1 return; it is a sequencing call, not a technical one.
