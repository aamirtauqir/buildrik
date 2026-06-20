# 0001 — Teach this learner with worked examples, not homework-gated lessons

**Date:** 2026-06-20
**Status:** active

## Context
The default `/teach` loop assumes: lesson → learner does the assignment → their output drives the next lesson. After L1, the assignment was "write 3 findings on one editor task." The learner did not return findings; each turn they answered "go with the recommendation" — i.e. *you drive, don't make me produce input first*. This matches the project memory `feedback_user_drive_dont_quiz` (founder is cost/time-pressed, overwhelmed by technical Q&A, wants one clear lead + confirm).

## Decision
Do **not** block a lesson on the learner producing input. Deliver each lesson as a **worked example on the real app** — I perform the audit/rating/sequencing on the live Buildrik editor, show my reasoning, and leave a *small, optional* assignment at the end. The lesson stands on its own even if the assignment is never done.

L2 was built this way: instead of rating *their* 3 findings, I found 3 fresh real ones in the editor and rated + ranked them with the explicit "why." The teaching value (the method) is fully transferred by demonstration.

## Why this is non-obvious
The teach skill's structure pushes toward learner-produced artifacts driving progression. For a drive-don't-quiz learner that structure stalls (the open loop never closes). Worked examples invert it: the agent produces the artifact, the learner absorbs the method, progression is agent-paced.

## Consequences
- Every lesson must be self-contained + grounded in the live editor (not abstract).
- Findings used in lessons must be **real and verified** (seen in the running app this session), never invented — a teaching lesson built on a phantom finding teaches the wrong thing (cf. `feedback_tool_artifact_vs_product_bug`: don't use browse artifacts as findings).
- Keep one short optional assignment per lesson for the learner who *does* want to practice, but never gate the next lesson on it.
- Revisit if the learner starts returning their own findings — then resume the learner-driven loop.
