# Buildrik — Program Roadmap (locked 2026-06-24)

The founder's chosen sequence. Decide first, build second. Each phase ends before
the next starts. Source-of-truth docs referenced per phase.

> Principle: don't add features. ~95 work. Make the existing ones reliable +
> user-friendly, THEN reorganize/redesign. (Matches `enhance-existing-features-plan-20260623.md`.)

---

## Phase 0 — Audit (DONE)
Full feature + wiring map of the real codebase.
- `complete-feature-list-20260623.md` — master, job-grouped, API-reconciled.
- `wiring-matrix-codex-20260624.md` — every `router.procedure` → service → UI, file:line.
- `editor-orphans-20260624.md` — 27 editor orphans (browser-only / wrong-wired / stub), `You:` review column.
**Status:** founder reviewing the orphans manually.

## Phase 1 — Office-hours on the features (NEXT)
Sit on the feature list + orphans. Decide, per feature: fix / wire / keep-local / hide / cut, and what "user-friendly" means for it. Not building yet.
- Input: the 3 Phase-0 docs + founder's manual review marks.
- Skill: `/office-hours`.
- Output: a fix-scope design doc — ranked, user-friendly definition per feature.

## Phase 2 — Fix the features (build)
Make the chosen features right + user-friendly. Wire the orphans that earned WIRE. Feedback on every action (no silent failures). Each behind a flag, ship per-item, verify.
- Input: Phase 1 fix-scope doc.
- Maps to: `enhance-existing-features-plan-20260623.md` Phase 0 (cut) + Phase A (reliability).
- Output: working, trustworthy features.

## Phase 3 — plan-ceo-review (gate)
Run scope/strategy review on the fixed feature set before redesign. Confirm priorities, cut anything that doesn't earn its place.
- Skill: `/plan-ceo-review`.
- Output: go/no-go + redesign priorities.

## Phase 4 — Redesign + wireframes + prototypes
Redesign the product around the now-solid features. Proper wireframing, then clickable prototypes.
- Input: Phase 3 verdict + `ia-home-map-20260623.md` + `editor-left-bar-decision-worksheet.md` (IA already mostly designed).
- Output: wireframes → hi-fi clickable prototype (reuse the `docs/reviews/prototype/` pipeline).

---

## Rules across all phases
- Decide before build (office-hours + ceo-review are gates, not paperwork).
- No new Webflow features. Fix + organize + cut only.
- Every fix surfaces its failure (zero silent failures).
- Two-way doors: everything behind flags, reversible.

> Locked by founder, 2026-06-24. Phase 1 is the active step.
