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
2. High-risk surfaces get a measured spec (`specs/` + `measure.mjs`) — extend
   from 8 toward every stateful panel. Probes are thermometers, not
   acceptance (founder rule stands) — they exist to catch REGRESSION after
   the eye has accepted once.
3. The 5 scans become a script (`scripts/conformance/seam-scan.mjs`) run in
   `verify:ds` — emit-vs-listen and option-catalogue found 25 defects; they
   should never need a human to remember them.

## Standing protocol — live verify (hard-won, follow exactly)

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
5. **Dev server uptime** — every session needs it now; Phase 0 dies without.

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

- `boards.json`: 363 active boards, each with a recipe; floor = 363.
- `verify:ds` green including seam-scan; pre-push unblocked.
- A closing entry in the ledger naming the last family and the final count.
- Founder gates 1–4 decided (any way — decided is the requirement).
