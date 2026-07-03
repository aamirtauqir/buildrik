# 0021 — "Are there only 6 jobs?" — the count is code-derived, not user-proven

**Date:** 2026-06-29
**Status:** active

## What happened
Right after the shape-check (LR-0020), the founder asked the sharp question the whole IA rests on: *"kya sirf 6 jobs hain ya aur bhi?"* — is six the real number, or are jobs hiding? Taught Lesson 22: today yes, 6, and they're well-formed — but the count came from collapsing the code's 17 backend clusters, **not** from watching users, so it's an educated guess, not a proof.

## The teachable thing
**The job-count question has two layers, and conflating them is the trap.** Layer one — *is the list well-formed?* — yes: each of the 6 is an outcome, has one home, and the top level is 5–6 (the IA test passes). The reason it's exactly 6 is that three things were correctly excluded: **AI is a cross-cutting tool** (lives inside jobs, not a 7th job), and **auth / save / states / confirm are substrate** (the system needs them; the user isn't "doing" them). The clean discriminator is the *"I came here to ___"* test: the blank is a job only if it's an **outcome stated without the UI** ("get sign-off," "publish") — not a step ("open the inspector"), a tool ("use AI"), or plumbing ("log in").

Layer two — *is the list correct/complete?* — **unknown, because it was derived from code, not users.** This is the uncomfortable part and the honest answer: the 6 jobs were reverse-engineered from the backend-map, which is *why* they map so cleanly onto modules. A real user might carve the space differently. Three candidate 7th jobs are currently folded into J3/J6: **grow/measure** (analytics, in J6's "run it"), **maintain a live site** (the update→re-publish loop, re-entering J3+J6), and **publish content regularly** (CMS editorial, in J3). Splitting any of them today would create a near-empty job (LR-0005 ghost risk — analytics is even partly fake, avgSession=0), so staying at 6 is right *for now* — but as a guess, not a law.

**Jobs come from users, not features — and we skipped that step.** This lands directly on the mission's pro-frontier: the only thing that confirms whether it's 6, 5, or 7 is watching ~5 real users (Krug's DIY test) and hearing the words they use for their goal. The course has built the whole IA → flows → wireframe chain on a job list that has never met a user. That's the single biggest unvalidated assumption under everything drawn so far — and the founder's question is exactly the instinct that surfaces it.

## Consequence for the work
- `lessons/0022-is-six-jobs-right.html`: job vs tool vs substrate, the "I came here to ___" test, the 3 candidate 7th jobs, and the "validate with users not code" close.
- Surfaced the highest-leverage open thread: the 6 jobs are code-derived and user-unvalidated. Next move offered = write a Krug 5-user test script to actually check the carve.
- Course: 22 lessons · 16 references · 21 learning-records.

## Teaching note
Two reusable rules. (1) **"Is my list of N right?" splits into well-formed (checkable now, against the IA test) and complete (only users can confirm).** Answer both; don't let a clean-looking list pass as a validated one. (2) **A job list reverse-engineered from code will always look module-clean — that cleanliness is a warning, not a comfort**, because it means the cut followed the system's seams, not the user's. Ties to [[0020-shape-check-finds-consistency-drift-not-structure]] (the structure is internally sound) and the mission's deferred-but-now-in-scope user-research habit. The next real validation isn't more drawing — it's the first user.
