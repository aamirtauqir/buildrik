# Figma → Reality — the completion plan

**Written 2026-08-13, from measured state, not ambition.** Supersedes nothing —
this sequences what `2026-08-06-rail-drawer-rebuild.md` (the ledger of what
happened) leaves open. That doc stays the evidence; this one is the route.

## The goal, stated so it can be falsified

Every **active** board in `scripts/conformance/boards.json` (363 of 416; 30
design-ahead and 23 out-of-scope excluded by definition) is:

1. **Walked** — read as a contract, diffed against code, defects fixed with a
   test in the same commit.
2. **Eye-verified** — live screenshot vs board at 1440×900, by eye. This is
   the founder's acceptance rule and the ONLY check that catches the
   invisible-but-healthy class (three found on the first day it could run).
3. **Pinned** — a regression test or conformance recipe holds what the walk
   established, so it cannot drift back silently.

Done = all three, per board. "Code home exists" counts for nothing — Canvas
had 7/7 homes and 8 defects.

## Where we are (measured 2026-08-13)

| Metric | Value |
|---|---|
| Walked | **140 / 363 (39%)** — Insert 13, Layers 18, Pages 13, Media 26, Content 15, Brand 28, Inspector 20, Canvas 7. History in progress (~8 of 16) |
| Eye-verified | **4 surfaces** (zoom flyout, breadcrumb, palette, footer toggles) — 3 defects found, all fixed |
| Machine-pinned | 8 conformance specs; `recipe` field empty on all 416 |
| Cross-cutting scans run | 5 (emit-vs-listen, silent-default, duplicate-type, option-catalogue, discarded-props) — ~25 defects fixed |
| Session defect rate | Canvas walk: 8 defects / 7 boards. Live round: 3 / 4 surfaces |

## The loop (proven, do not improvise)

Per board: **PARHO** (board = contract: every label, button, state) →
**MILAO** (diff against code; what is missing, what is INVERTED) → **DEKHO**
(live vs board, by eye — protocol below) → **PIN** (test asserting the board's
claim; run it against the OLD wiring once and watch it fail).

Per family: run the family end-to-end in one pass (half-walked families go
stale — Media had to be reopened), close with one live-verify batch, then
re-run `verify:ds` (Gate 24 caught this walk's own breadcrumb).

## Phases

### Phase 0 — verify the debt (1–2 sessions) ← START HERE

**First task (eng-review 3A): script the 5 seam-scans as
`scripts/conformance/seam-scan.mjs`, WARN-mode in `verify:ds`.** They produced
~25 defects and exist only as session knowledge; phases 1–2 must run inside
the net, not before it.

The 140 walked boards were walked before the server existed. Round 1 found
defects at 3-per-4-surfaces on exactly such boards. Batch eye-verify per
family, rebuilt/high-risk surfaces first:

1. Canvas remainder + History-Saves surfaces just built (pruned notice,
   skeleton, load-error) — same session they shipped.
2. Brand (28, most recently rebuilt: drill-ins, Tokens, Starters, Lint).
3. Media (26 — fullpage manager, grid toolbar, context menu CSS).
4. Insert · Layers · Pages · Content (59, older, lower risk).
5. Inspector (20 — includes MultiSelectToolbar, empty state).

Risk class to hunt: overlays/popovers/drawers (clipping + z-order), anything
`tw:`-converted from CSS, anything that opens upward.

### Phase 1 — finish History, then the panel families (3–4 sessions)

Order by user impact, using each family's boards as the checklist:

| Order | Family | Boards | Note |
|---|---|---|---|
| 1 | History (finish) | ~8 left | Published states: failed, redeploying, roll-back confirm, restored — homes exist in `PublishHistory.tsx`, verify + pin |
| 2 | Publish | 12 | touches money-path; pre-checks board M4 already flagged |
| 3 | Shell states | 12 | includes conflict (66:640 — modal blocked on founder, chip done) |
| 4 | Review panel | 13 | comment flows just fixed; verify pins live |
| 5 | Templates | 11 | new-page mode just built — eye-verify it |
| 6 | AI | 11 | apply contract pinned; states idle→done |
| 7 | CmdK | 7 | second palette — apply the same board diff as canvas palette |
| 8 | Compare · Components · Issues · Notifications · Modal · Shell · Exit · Onboarding · Orphans · small | ~40 | small families, batch 2–3 per session |

### Phase 2 — the S-flows (2–3 sessions)

S1/S2/S3/S5/S6/S7 ≈ 78 boards. These are **compositions** of surfaces from
phases 0–1, walked as *journeys* (each board = a step with entry, state,
exit). Faster per board; most defects will be seams (the walk's specialty:
two halves that both exist and disagree on a name). Run the emit-vs-listen
scan again before starting — seams are its exact shape.

### Phase 3 — the machine net (1–2 sessions, then continuous)

Human verification decays; the net is what holds.

1. Every walked board gets its `recipe` filled in `boards.json` —
   `coveredFloor` ratchets it (already wired in `check-boards.mjs`, floor 9).
2. **(eng-review 1A) The visual pin is Playwright `toHaveScreenshot`** — a
   baseline captured per surface at the moment the eye accepts, using the
   existing e2e probe harness (probe.tsx MUST import flowbiteStore; portalled
   content asserts `data-probe-ready`, never `waitFor`). Prereq: fix the
   BrowserStack env-divert so local runs stay local. `measure.mjs` probes stay
   only for surfaces whose dynamic content breaks pixel-diff. Rationale: all
   three live-round defects (clipping, z-order ×2) are invisible to probes and
   to jsdom — only pixels catch the class.
3. The 5 scans become a script (`scripts/conformance/seam-scan.mjs`) run in
   `verify:ds` — emit-vs-listen and option-catalogue found 25 defects; they
   should never need a human to remember them.

## Standing protocol — live verify (hard-won, follow exactly)

- **Server is agent-owned (2A):** probe 5050 at session start; if down, start
  `npm run dev` in background and retry with backoff. Never block on the founder.
- `browse` at **1440×900**, element selected where the board shows selection.
- Popovers: `chain` + `screenshot --viewport` + JS `.click()` — full-page
  screenshots SCROLL and close popovers; Playwright clicks scroll-into-view.
- Never trust DOM for visibility. Kit: `elementFromPoint` at element centre,
  walk ancestors for computed `overflow !== visible`, compare z against
  `Z_LAYERS` registry.
- Board sample data never conformed to literally — SHAPE is the contract.
- Behaviour → code contract; visual → board (labels name BOUND keys — the
  Alt+↑ rule).

## Founder gates (blocked on you, listed once)

1. **`#page:<id>` in saved templates** — strip / slug / ask-on-apply.
2. **Styling ratchet** — red since 08-12 (pre-session +209, session +145).
   Pre-push blocks until drained or re-based. Decide per file.
3. **ConflictModal** (66:640) — needs "Review both" surface + a prop through
   `AquibraStudio.tsx` (your file).
4. **`PAGE_CHANGED` listener** in `AquibraStudio.tsx:248` — one-line fix
   written out in the ledger; your file, your commit.
(Gate removed by eng-review 2A: the dev server is the AGENT's job — probe at
session start, background-start `npm run dev` with health retries if down, as
proven 2026-08-13. Noted in Standing protocol below.)

## Estimate (from measured rates, not hope)

| Phase | Sessions |
|---|---|
| 0 — verify the 140 | 1–2 |
| 1 — panel families (~105 boards) | 3–4 |
| 2 — S-flows (~78 boards) | 2–3 |
| 3 — machine net | 1–2 |
| **Total** | **7–11 sessions** |

Defect projection at observed rates: 60–100 more real defects, most in the
invisible-but-healthy and two-halves-disagree classes. Budget commits, not
just reads.

## What DONE looks like

- **(eng-review 4A) Census-fresh at every phase close:** name-scan page 1:3,
  fold new boards into `boards.json`, update counts. boards.json has missed
  founder-drawn boards TWICE; a DONE claim against a stale census is void.
- `boards.json`: every active board (count per the LATEST census) has a
  recipe; floor = that count.
- `verify:ds` green including seam-scan; pre-push unblocked.
- A closing entry in the ledger naming the last family and the final count.
- Founder gates 1–4 decided (any way — decided is the requirement).

## NOT in scope (review-confirmed)

- Design-ahead (30) and out-of-scope (23) boards — excluded by definition.
- AI-worker raw-HTML canvas sanitize — already tracked in TODOS.md; adjacent
  to, not part of, this arc.
- ConflictModal "Review both" + PAGE_CHANGED one-liner — founder-file work,
  gates 3–4.
- Running the full Playwright suite in CI — TODOS.md item; 1A only needs
  local snapshot runs.

## What already exists (reused, not rebuilt)

- `check-boards.mjs` coveredFloor ratchet — Phase 3 fills recipes into it.
- `e2e/` probe harness (probe.tsx, style-parity patterns) — 1A builds
  snapshot pins on it instead of a new system.
- `measure.mjs` + 8 specs — kept for dynamic-content surfaces only.
- The 5 seam-scans — written this session as one-offs; 3A scripts them,
  no re-derivation.

## Implementation Tasks
Synthesized from this review's findings. Run with Claude Code; checkbox as you ship.

- [x] **T1 (P1)** — DONE 2026-08-14 — the editor config's loud guard already
  refused BS creds; the real work was making local runs TRUE: Playwright
  1.61 silently drops use.reducedMotion (explicit emulateMedia + assert now),
  and CSS @import chains raced the measurement (stylesheetsSettled gate).
  31/31 twice, locally (`9ac6dca2`)
  - Surfaced by: Architecture Issue 1 (1A prereq); TODOS.md already names it
  - Files: packages/editor/playwright.config.ts
  - Verify: `npx playwright test` runs local chromium with BS creds present
- [x] **T2 (P1)** — DONE 2026-08-13 — seam-scan.mjs in verify:ds, WARN-mode,
  baseline + triage notes; first run found a real dead listener
  - Surfaced by: Code Quality Issue 3 (3A)
  - Verify: plant one dead listener, scan goes amber
- [~] **T3 (P2)** — tranche 1 DONE 2026-08-14 (`59d2c357`) — visual-pins.spec.ts,
  19 probe surfaces, threshold 0.02, negative-tested twice. Tranche 2
  (live-app surfaces: breadcrumb, inline toolbar, shell states) needs
  per-case app-state setup — carried into Phase 1
- [x] **T4 (P2)** — Phase 0 close re-census DONE 2026-08-14 (`a1c7900f`):
  421 boards / 366 active / 34 families. Section CHILDREN must be scanned —
  depth-1-only made 51 catalogued boards look deleted. Found 3 new Media
  boards, one of which was a shipped-but-denied feature (`ff07eaae`).
  Repeat at every phase close.
- [x] **T5 (P3)** — DONE 2026-08-13 — protocol in plan + ledger
  - Surfaced by: Architecture Issue 2 (2A)
  - Verify: next session starts without founder action

## Failure modes (per pipeline path)

| Path | Realistic failure | Test? | Handling? | Silent? |
|---|---|---|---|---|
| seam-scan | new event style evades regex | plant-a-violation check (T2) | WARN-mode | flagged, not silent |
| snapshot pin | BS divert / flake | T1 prereq; retry-once policy | baseline re-accept flow | visible red |
| eye-verify | popover closes pre-shot | chain+viewport protocol | re-query in same chain | caught in-protocol |
| census | founder draws boards mid-phase | T4 per-phase gate | counts diff | was silent — now gated |
| recipes floor | recipe filled without eye-accept | floor only ratchets after verify | reviewer discipline | **residual risk — accepted** |

No critical gap: every silent path now has a gate except recipe-discipline,
accepted as process risk.

## Worktree parallelization

| Step | Modules touched | Depends on |
|---|---|---|
| T1 BS-divert | playwright.config | — |
| T2 seam-scan.mjs | scripts/conformance | — |
| T3 snapshot pins | e2e/ | T1 |
| Phase 0 eye-verify | none (read-only + fixes as found) | server |
| T4 census | scripts/conformance/boards.json | phase close |

Lane A: T1 → T3 (sequential, e2e/). Lane B: T2 (independent). Lane C: Phase 0
eye-verify (independent, defect-fix commits land anywhere). Launch A+B+C in
parallel; T4 at each phase close. Conflict flag: T2 and T4 both touch
scripts/conformance/ — sequence T4 after T2 lands.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — (disabled by config) | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 4 issues, 0 critical gaps — all 4 resolved (1A, 2A, 3A, 4A) and folded into the plan |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** ENG CLEARED — ready to implement (Phase 0).

NO UNRESOLVED DECISIONS
