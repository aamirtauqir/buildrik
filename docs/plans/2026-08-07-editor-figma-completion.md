# Editor — Figma completion & reconciliation (TIMEBOXED CORE)

Written 2026-08-07 · reviewed by `/autoplan` same day · **founder approved
shape: Option A — timeboxed core** at the D1 gate. Supersedes
`docs/plans/2026-08-06-editor-figma-rebuild.md`, removed on founder order
2026-08-07 — recovery via git history +
`~/.gstack/projects/aamirtauqir-buildrik/REMOVED-20260807-editor-figma-rebuild-final.md`.

> **Provenance.** The founder's full prompt arrived untruncated 2026-08-07.
> Deliverable: *"a complete, professional, production-ready Editor design
> **in Figma**"* — code is truth for capability/behaviour, Figma is truth for
> UI/flow. The code-rebuild loop is **paused, not cancelled**; its resume
> criterion is in Acceptance below.

## Source-of-truth rules (founder's, from the full prompt)

1. **Code wins on behaviour** — capabilities, permissions, validations
   (proof on file: the 8-row pre-checks board was corrected TO the code).
2. **Figma wins on UI** — visual direction, IA, panel behaviour, dimensions,
   interaction patterns, extensions.
3. Code-only features get designed INTO Figma inside the right user job,
   marked code-derived. Figma-only extensions preserved + documented as
   implementation gaps. Conflicts → ONE canonical flow, decision recorded.
   Nothing potentially obsolete deleted without approval.

## Measured state (2026-08-07, live reads)

| Measure | Value |
|---|---|
| Boards on page `1:3` | **368**, **368/368 reachable**, 0 dead ends, 0 dangling (post-wiring) |
| Manifest | `boards.json` 324 total / **300 active / 33 families**, regenerated today |
| Paint styles / unbound vars | **0 / 113** — every colour a raw hex literal |
| Missing state boards | **5**: Review·loading, History·loading, Components·empty, Brand·empty, Templates·empty |
| Publish cluster | consolidation OPEN since 08-05 |
| Unresolved file areas | 2 `[superseded]` boards, 2 `🔍 REVIEW` sections |
| Code side | 396 non-test `.tsx`; 22 code-backed screens added 08-05 |

**How complete is the file? Unknown until Phase 0.** An earlier draft asserted
"~95%"; the CEO review (F3) struck it — the number had no denominator. The
reconciliation matrix produces the number; the plan does not pre-judge it.

## Decision record (the /autoplan gate, 2026-08-07)

CEO voice ran `[subagent-only]` (Codex disabled by config). 11 findings.
Founder chose **A — timeboxed core** over:

- **Full plan as written** (all 6 phases, full tokenization, 15 job walks) —
  rejected for now: 2–4 CC-weeks against a pre-revenue clock (F1, F5, F7),
  and the file's only consumer (the code arc) is paused (F2).
- **Phase-0-only** — rejected: the 5 state boards and publish consolidation
  are already evidence-backed by the 08-06 design review; waiting on the
  matrix to redo that evidence is deliberation, not caution.
- **Tokenize now** (old T11) — deferred behind code-arc resume (F10): the
  stated goal is drift *detection*, which a lint achieves at ~1% of the cost;
  full binding pays off when a stable consumer builds from the file.
- **Skip Figma, go pilot/Stripe first** — the models' preference; founder
  kept Figma-first but accepted the hard timebox. Founder context wins.

**Named regret scenario (F7), accepted with eyes open:** six months out,
pre-revenue still, retro reads "polished the design file while Stripe sat one
afternoon from live." The timebox is the mitigation: **3 working days hard**,
overflow ships partial with unresolved items named. After this arc, the
founder-gated business actions (real client `/review/<token>` walk, Stripe
live provisioning, pilot workspace) are next in queue.

## Phases (3-day box)

### Phase 0 — Reconciliation matrix (Day 1, read-only)

One row per feature/flow, classified 1–9 per the founder prompt (consistent /
inconsistent / code-only / Figma-only / duplicated-Figma / duplicated-code /
incomplete / obsolete / unclear). Sources: `boards.json` (300 active), editor
`src/` inventory (running as a background sweep), tRPC routers + shared Zod
schemas for capability truth, the 4 superseding design docs for copy/state
contracts. **Output:** `docs/audits/2026-08-07-editor-reconciliation-matrix.md`.

**Tripwire (F3):** if **>20%** of rows land in class 2/7/8/9
(inconsistent / incomplete / obsolete / unclear), STOP — re-plan at the gate
before drawing anything. The matrix is allowed to falsify P1.

### Phase 1 — Close the known board gaps (Day 2)

1. Draw the **5 missing state boards** — copy taken verbatim from the
   wireframes' final §5.7 empty-state copy, never invented. Wired into the
   spine same-batch (a board landing unreachable is the defect this week's
   read caught). Re-BFS after: every active board reachable.
2. **Publish-cluster consolidation** — one canonical publish flow per the
   prompt's duplication-control protocol; losing variants moved to Archive
   section (nothing deleted), decision recorded in the matrix.
3. **Disposition** of the 2 `[superseded]` boards + 2 `🔍 REVIEW` sections —
   proposal per item, founder approves, Archive move only.

### Phase 2 — Hex-drift lint (Day 2–3, replaces full tokenization)

Extend `scripts/conformance/` (reuse `check-token-resolution.mjs` machinery)
with a board-fill census check: fetched board fills diffed against the
DESIGN.md palette; any hex outside the palette (or the known-drift list) goes
red with board id + node path. **Watched to fail first:** plant `#3366f2` on a
raw capture, confirm red, restore
(`feedback_gate_negative_test_or_it_lies`). This is the only code this arc
touches — `scripts/` only, zero `src/` edits.

### Deferred — gated, not cancelled

| Item | Gate |
|---|---|
| Full tokenization (113 vars, paint styles — old T11) | code-arc resume |
| Class-3 code-only feature boards | Phase 0 matrix says which exist |
| Job-by-job verification walks (15 jobs) | matrix tripwire outcome + founder call |
| S5 review-flow board polish | **after** one real (or founder-as-client) `/review/<token>` walk — the walk's friction log feeds the boards, not the reverse (F8) |
| Final DoD coverage audit | when the above unlock |

## Not in scope

- **Any `src/` change.** Rebuild loop paused (Insert/Layers/Pages/Media
  shipped, Content next when resumed).
- Backends for the 16 `[design-ahead]` boards (founder order stands:
  *"backend baad me, pehle design complete"*).
- Dashboard pages, other Figma pages than `1:3`, mobile chrome.

## Risks

| Risk | Mitigation |
|---|---|
| Figma writes silently no-op | read back every write; re-fetch samples |
| `resize()` collapses auto-layout → silent clipping | never resize hug containers; screenshot per batch |
| MCP payload truncation (page metadata ≈ 2.3 MB) | per-family chunked reads, resumable batches |
| Duplicate creation on re-run | search-by-id + semantic-name before create; stable names |
| **Matrix rots when code arc resumes** (F4) | matrix rows carry source file anchors; first post-resume commit re-verifies affected rows |
| Timebox overflow | ship partial, unresolved items named — never silently extended |

## Acceptance (falsifiable — F9)

- Matrix exists, covers all 300 active boards + every `src/` feature family,
  every row classified; tripwire evaluated and its outcome recorded.
- 5 state boards drawn with §5.7 copy, wired, full-page BFS green.
- Publish cluster is ONE canonical flow; losing variants in Archive with a
  recorded decision.
- Hex-drift lint red on planted `#3366f2`, green on the clean file — the
  planted run is in the log.
- Zero duplicates introduced; zero founder-refined boards overwritten;
  Figma-only extensions still present.
- **Exit criterion owned by the consumer (F2/F9):** the code arc can resume
  from the matrix — first resumed family (Content, 148:2) builds from its
  boards with **zero clarification questions**. If resumption stalls on
  missing answers, this arc failed regardless of how green the file looks.

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale |
|---|-------|----------|----------------|-----------|-----------|
| 1 | Intake | Old plan removed from repo (kept in git history + 2 external snapshots) | Founder order | — | "old wala sahi nahi hai... remove kar do"; supersession documented here (F11 noted, founder kept removal) |
| 2 | CEO gate | Shape = timeboxed core (A) over full plan / phase-0-only | Founder decision at gate | P3 pragmatic, P6 action | CEO F1/F5/F10; founder kept Figma-first, accepted 3-day box |
| 3 | CEO gate | Tokenization → lint now, full binding deferred | Taste, surfaced + approved | P5 explicit, P3 | F10: detection ≠ binding; 1% cost for same drift catch |
| 4 | CEO gate | "95% complete" claim struck; matrix owns the number + 20% tripwire | Auto-fix from F3 | P1 completeness | un-derived premise made falsifiable |
| 5 | CEO gate | Code-arc resume criterion written into Acceptance | Auto-fix from F2/F9 | P1 | plan gains a way to fail outside the file |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/autoplan` | Strategy & scope | 1 | issues_resolved_at_gate | 11 findings; 2 critical challenges surfaced to founder; shape re-cut |
| Design Review | `/autoplan` | UI scope | 0 (carried) | carried_forward | Phase 1 items ARE the 08-06 design review's named gaps (5 boards, publish cluster) — re-reviewing them would re-derive same evidence |
| Eng Review | `/autoplan` | Code touched | 0 (n/a) | not_required | zero `src/` changes; only Phase 2 lint script, which carries its own watched-to-fail control |
| DX Review | `/autoplan` | Dev-facing scope | 0 | not_required | no developer-facing product change |

**VOICES:** Codex disabled by config — CEO ran `[subagent-only]`. Recorded,
not hidden: single-model confidence on the strategy challenge.

**VERDICT:** APPROVED (founder, Option A) with the 3-day box and the
consumer-owned exit criterion as the binding constraints.
