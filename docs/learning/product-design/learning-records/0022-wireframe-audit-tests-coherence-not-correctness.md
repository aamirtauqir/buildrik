# 0022 — A wireframe audit tests job *coherence*, not *correctness* — and it found the wedge has no journey

**Date:** 2026-06-29
**Status:** active

## What happened
After L22 ("are there only 6 jobs? — code-derived, not user-proven"), the founder pushed back with the right instinct: *"jobs ko apni wireframing se audit nahi kar sakte?"* — can't we validate the jobs against our own wireframes instead of waiting for users? Taught L23. The answer is a qualified yes, and to prove it I ran the audit live against `wireflows.html` + `editor-wireframe.html` — which surfaced a real, high-value hole.

## The teachable thing
**A wireframe can audit job *coherence* but not job *correctness*, and conflating the two is the trap.** Coherence = does the job-model hang together internally? Five runnable tests: orphan surface (a surface no journey touches), empty job (a job with no real journey), seam (one job hiding two outcomes), merge (two jobs sharing a journey), dead-end (a journey that never reaches the goal). All checkable *now*, on the artifacts in hand. Correctness = are these the *right* jobs, in users' words, with users' boundaries? That a wireframe **cannot** answer — because the wireframes were derived *from* the jobs, so auditing the jobs against them is checking the model against itself. Circular. A coherence-clean model is internally sound, not validated.

**But coherence smells point at correctness problems — that's why the cheap audit is worth running.** It can't confirm the right jobs, but its structural breaks usually sit exactly where a job is missing or miscut. The live run proved it:
- **Orphan: §36 Shared DS push — the agency wedge, the #1 differentiator — has a surface spec but appears in 0 of the 5 journeys** (`ds-push` count = 0 in wireflows). So either J4 "Make it on-brand" lost its most important step (it only journeys *one site's* consistency, never the *cross-site push to clients*), or there's a hidden 7th job — "keep all my clients on-brand from one place" — that got folded into J4 and disappeared. The product's core bet has no flow.
- **Seam: J6 "Ship & run it"** journeys only the *Ship* half (SEO → domain → publish → live); the *run it* half (analytics/grow) never appears — the same "grow" 7th-job candidate from L22, now with evidence.

The orphan wedge is the headline because it's not a minor surface — it's the differentiator the whole agency-first thesis rests on, and the canonical journeys skip it. The audit found in minutes what re-reading the job list never would: the journeys don't carry the business's central job.

## Consequence for the work
- `lessons/0023-audit-jobs-with-wireframes.html`: the coherence/correctness split + the 5-test wireframe job-audit + the live findings + the circular ceiling.
- Two concrete findings logged: §36 wedge is journey-orphaned; J6 has a ship/grow seam. Both point at a likely missing job (cross-site brand push; grow/measure).
- Next move offered: draw the wedge as a 6th journey (capture → select clients → blast-radius confirm → push → per-site result), then decide J4-step vs 7th-job — and ultimately validate with users.
- Course: 23 lessons · 16 references · 22 learning-records.

## Teaching note
Reusable rule: **an audit that runs against your own derived artifacts can only prove internal consistency; it can flag where the model breaks, but it can't supply the thing the model never contained.** Use the wireframe audit as the cheap first pass — it catches orphans and seams that hint at missing jobs — then send the hints to users for the correctness call. The founder's instinct to audit was right; the discipline is knowing the audit's ceiling. Ties to [[0021-six-jobs-is-code-derived-not-user-proven]] (the jobs are unvalidated) and [[0018-coverage-is-not-job-first]] (completeness ≠ correctness — same trap, audit form). The wedge-orphan also re-raises a known business risk: the differentiator is under-built in the editor (LR-0017's "zero theme.* wiring" finding), and now we see it's under-*designed* in the journeys too.
