# Vibcoder Position 3 Integration — Spec Set

**Date:** 2026-04-26
**Owner:** shahg
**Branch:** main
**Brainstorm session:** 9 questions, 9 decisions locked
**Pass 6 review:** 3 adversarial reviewers, 15 findings, all addressed inline (Pass 6 commit follows initial spec commit dad08d0)
**Plan note:** No separate Plan v3 doc. Per Pass 6 scope-guardian finding, this spec set IS the plan in solo workflow. Plan v2 (`~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-vibcoder-integration-20260425-235606.md`) preserved as historical reference.

## What this is

Position 3 adoption of the vibcoder reference design system bundle as canonical
chrome contract for Buildrik editor. Includes:

- Token folds (50 net-new tokens)
- Component ports (65 chrome primitives via vendored CSS + React render)
- Chrome layout convergence (sidebar + rail + inspector dimensions)
- Codex routing + 4 new CI gates
- Storybook-style gallery infrastructure

## Spec set structure

| File | Purpose |
|---|---|
| `README.md` | This index |
| `design.md` | Comprehensive design spec (5 sections: Architecture, Components, Data Flow, Error Handling, Testing) |
| `roadmap.md` | Phase-by-phase sequencing with dependencies and milestones |
| `SCOPE.md` | Per-component triage (chrome / dashboard / CMS / engine buckets) |

**Note on SCOPE.md location:** Originally planned at `docs/reference/vibcoder/SCOPE.md`
per Q3.2, but `docs/reference/` is gitignored as a dev-local snapshot of the
designer-facing spec drop. SCOPE.md moved to this spec folder to ensure it's
tracked and visible to team + CI. Vibcoder bundle remains pristine in
`docs/reference/vibcoder/` (gitignored).

## Brainstorm decisions (9)

| Q | Decision |
|---|---|
| Q1 (E) Adoption policy | Position 3 + R2 namespace exception (vibcoder canonical, `--bd-*` alias layer preserved) |
| Q2 (D) Architecture | Path B Hybrid — vendored CSS in `themes/components/` + React renders className |
| Q3 (F) Triage | 65 chrome / 5 dashboard-mobile / 2 CMS / 1 engine wrapper. Annotated in SCOPE.md |
| Q4 (B) Token folds | Strategy C Hybrid — 8 commits, codemod auto-mirrors aliases, DESIGN.md per tier |
| Q5 (C) Chrome-ssot | Stage 2 first (sidebar 280→240/320, only Layers nav) then Stage 3 (rail 48→60, inspector 280→320). 200ms ease-out animation |
| Q6 (A) Port strategy | Strategy C Hybrid — POC → atoms → molecules → organisms → layouts → re-port existing 37. ~25 commits, per-category batches |
| Q7 Gallery | Minimal gallery at `packages/editor/src/preview/`, side-by-side HTML + React, vendor + codemod per bundle update |
| Q8 Codex routing + gates | Editor CLAUDE.md section. Codex routing advisory throughout migration, blocking only post-Phase 5 (per Pass 6 scope-guardian finding — solo workflow makes mid-arc tier transition theater). Gates 19 (bdr-X leak) + 21 (namespace direction) + vibcoder-port (manifest + body line) added. Gate 20 merged into vibcoder-port. Gate 22 cut (broken gallery is its own signal). |
| Q9 Plan + spec output | Plan v3 CUT per Pass 6 (spec set IS the plan in solo workflow). Pass 6 plan-eng-review run, 15 findings addressed inline. Hybrid spec output (this folder). |

## Reading order

For a first-time reader:

1. This README (5 min) — overview
2. `design.md` (30 min) — comprehensive design
3. `roadmap.md` (10 min) — execution sequencing
4. `SCOPE.md` (5 min) — triage manifest

For execution start:

1. `roadmap.md` Phase 0 POC section
2. `design.md` Section 3 (Data Flow) for codemod pipeline
3. `design.md` Section 5 (Testing) for POC validation criteria

## Cross-references

- Plan v2 (superseded): `~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-vibcoder-integration-20260425-235606.md`
- Token diff (grounding): `docs/ideation/2026-04-26-vibcoder-token-diff.md`
- Chrome-ssot decision: `docs/ideation/2026-04-25-chrome-ssot-convergence.md`
- Primitive conformance audit (precursor): `docs/ideation/2026-04-25-primitive-conformance.md`
- Vibcoder bundle source: `docs/reference/vibcoder/`
- Editor CLAUDE.md: `packages/editor/CLAUDE.md`
- Gate scripts: `packages/editor/scripts/ds-grep-gates.sh`

## Status

- [x] Brainstorm complete (9 questions, 9 decisions)
- [x] Design presented (5 sections, all confirmed)
- [x] Spec written (this set)
- [x] Self-review pass (5 counting bugs fixed)
- [x] Pass 6 plan-eng-review (3 reviewers, 15 findings, all addressed inline)
- [x] User review gate
- [x] Hand off to writing-plans skill
- [x] Phase A infrastructure landed
- [x] Phase 0 POC dispatched
- [x] Phase 0 POC complete (button atom, findings captured at poc-findings.md)
- [ ] Phase 1 atoms — fan-out (blocked on poc-findings tuning items)
