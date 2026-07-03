# 0016 — A coverage map becomes a build plan by reading three things off the status column

**Date:** 2026-06-26
**Status:** active

## What happened
With Stage-2 wireframing complete (41 surfaces drawn, to-draw = 0), the learner said "go with your recommendation." The recommended next step was Stage 4 of the redesign pipeline: turn the coverage map into an ordered, honest build plan (`reference/redesign-plan.html`) — the input the Stage-5 reviews (autoplan = CEO + design + eng, + codex) will pressure-test. Built it, codex-checked it twice (1 P1 + 2 P2 → fixed → PASS).

## The teachable thing
A plan isn't invented — it's **read off the coverage map** in three moves, all driven by the one **status column**:

1. **Keep vs new = the status icon.** ✅ "works" → *keep + reskin* (re-lay-out, not re-wire — handlers stay, chrome changes, Lesson 8). 🟡 "partial" or 🔵 "stub" → *new flow* + honesty gate. You don't decide this fresh; the audit already did, and the icon encodes it.
2. **The same split is the effort estimate.** Keep+reskin is cheap (hours); new-flow is the real design+build cost (days). So you can state scope honestly *before* writing code. Here: **30 keep + 3 graduated + 8 new = 41** → ~80% re-lay-out, ~20% genuine new build. That headline both reassures (it's not a rewrite) and points the eye at where the risk actually lives (the 8).
3. **Order = dependency first, then pull the differentiator forward.** The spine must come first (everything docks into it, #15). After that the *default* is by job (build → brand → sign-off → ship). But the *business reason* for this redesign is agency-first — so the wedge (Shared DS push) and the agency sign-off loop get pulled forward, not left for last. The plan names that tension explicitly rather than hiding it in the ordering.

## The honesty discipline carried over (LR-0014/0015 again)
Codex's two findings on the plan were the *same families* as the wireframe batches:
- A **contradiction**: a phase header said "all new-flow" while one row inside it was tagged keep+reskin (Preview). Same class as the wireframe "pass line claims what isn't there" — a summary outrunning the body.
- An **unprovable claim**: the headline said "3 graduated" but the body only showed 2 (the 3rd, Version-history, lived in prose-only substrate). Fix: make the substrate a tagged table + add a tally-proof line so **every number in the headline is derivable from the body**. A plan that asserts a count must let the reader add it up.

Lesson: the rule "the claim must not outrun the artifact" is scale-free — it held for a wireframe's pass-line and it holds for a plan's headline tally. Build the proof into the document, don't make the reviewer trust the summary.

## Consequence for the work
- Stage 4 done: a 6-phase plan (P0 spine → P1 editing loop → P2 wedge+brand → P3 agency loop → P4 ship → P5 AI, + woven substrate), each surface tagged keep/graduated/new, each phase with a gate, the wedge pulled forward, collab explicitly excluded (demo-only, #3), and four named risks for Stage 5 to argue.
- Next is the **Validate lane**: run the real plan-review skills (plan-ceo-review, plan-design-review, plan-eng-review, or autoplan to run all three) against this document — that's what they're *for* (pressure-test a written plan), which is the correction first taught in [[0012-redesign-is-a-pipeline-not-a-button]].

## Teaching note
This closes the loop the learner opened three turns ago ("can we redesign using plan-ceo-review / design-review / a goal skill + codex?"). The answer played out in practice: wireframes were human-authored (Stage 2), the plan was authored from the map (Stage 4), and *only now* are the review skills the right tool — because they need a plan to review. Sequence is the whole lesson.
