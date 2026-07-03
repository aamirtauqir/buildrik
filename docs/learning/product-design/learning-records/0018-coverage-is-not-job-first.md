# 0018 — Completeness is not job-first: a coverage list with "job:" labels is still module-shaped

**Date:** 2026-06-26
**Status:** active

## What happened
The founder ran `/codex` on the finished wireframe with a blunt critique: it's not deeply job-based, user flow is missing, the structure is still module-shaped, and there's AI slop. Codex (high effort, read the actual file) **sided with the founder.** Two claims came back flatly TRUE — (2) the structure is still surface/module-first (the index is `0 shell · 1 Insert · 2 Media · 3 Pages · 4 Design…` — backend panels, violating principle #14 "group by the user's job, not the backend module"), and (6) AI slop — the repeated `Job · Numayan · Dheema · Modules · Why` formula, the `✓ Stage-3 check… pass` self-stamps, and `to-draw = 0` read as "completeness theater… generated, sounding exhaustive." Real flow appeared in only 2 of 38 sections. The fix was a restructure: a new `wireflows.html` with 5 job journeys as left→right storyboards, the 37 panel specs demoted to a referenced appendix, and the 27 self-certifying "pass" lines drained.

## The teachable thing (the capstone of the whole wireframe arc)

**I built completeness and mistook it for job-first.** The coverage map made "done" countable (41 surfaces, to-draw → 0), which was genuinely useful — but countable-coverage is a property of an *inventory*, not a *journey*. I drew every panel, wrote `Job:` at the top of each, and added a heuristic "pass" line — and that *felt* job-based. It wasn't. A surface dump with a job label is still a surface dump. The tell, which codex named precisely: on most screens the **job is a label sitting on top of a control inventory** (§4 "Job: on-brand banao" → screen organised as `Colors · Typography · Spacing · Components`). The job didn't *shape* the screen; it annotated it.

**Job-first means the journey is the unit, not the screen.** The real test isn't "did I draw every surface?" — it's "can a user move through a goal, step by step, and does each screen earn its place in that movement?" That's why only §14 (publish-flow) and §26 (propose→confirm→execute) survived as real flows: they were *sequences*, not specs. The fix made every top-level entry a sequence (open → add → edit → preview → publish; send → comment → resolve → resend), and the panels became the *blocks the flow passes through* — which is what Lesson 17 ("job-first THEN blocks") actually asked for. I had built the blocks and skipped the job-first.

**The slop was self-certification.** The `✓ Stage-3 check … pass` line I added to every section — and *defended* across three codex batch-reviews as a teaching device — is exactly the AI-slop pattern: a document spending energy to *sound* exhaustive and self-approve. In a job-flow, the proof is intrinsic: the flow either closes or it doesn't. No stamp needed. Removing all 27 made the artifact more honest, not less complete.

## Why it took the founder to catch it
The founder felt this for ~10 turns ("job-based, like Webflow," "user flow miss hai") while I kept delivering more surfaces and reconciling more counts. Two reasons I missed it: (1) the coverage map's countability gave a false signal of rigor — green numbers feel like correctness; (2) every codex *batch* review I ran was scoped to "is this section internally consistent / are its states drawn?" — never "is the top-level structure a journey or a list?" I was verifying the trees and never asked about the forest. The founder asked about the forest. Lesson: a reviewer scoped to local correctness will never catch a global-shape error — periodically point a review at the organizing principle itself, not just the contents.

## Consequence for the work
- `wireflows.html`: 5 journeys, 26 steps, each a mini editor-snapshot + Karta→Dikhta caption + `→ §N` pointer into the appendix.
- `editor-wireframe.html`: now the "Surface appendix," 27 slop lines drained, a banner directing readers to the journeys first.
- This becomes the canonical wireframe — the thing the build plan's Phase −1 (and an eventual `/goal`) actually consumes.

## Teaching note
The founder's instinct beat the AI's completeness machinery. Worth saying plainly: countable completeness is a tool, not a proof of correctness — it answers "did I cover everything?" but is silent on "did I structure it around the user's goal?" The two questions feel similar and are not. When a founder keeps repeating a critique you think you've addressed, the gap is usually a frame mismatch (inventory vs journey), not a missing detail — stop adding detail and re-examine the frame. Ties to [[0017-autoplan-caught-build-the-wrong-thing]]: both are "the craft was real but aimed at the wrong target."
