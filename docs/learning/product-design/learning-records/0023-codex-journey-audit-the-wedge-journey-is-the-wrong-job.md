# 0023 — Codex journey-audit: only 1 of 6 jobs is correctly journeyed, and the brand journey we drew is the wrong job

**Date:** 2026-06-29
**Status:** active

## What happened
The founder asked codex to deeply check which jobs/flows have no journey. Ran codex consult (high effort, 461k tokens, read the actual files). It confirmed the wireframe-audit baseline (L23), **added one gap I missed (J5 dashboard review-queue/status-flip)**, corrected three of my claims, and — the sharp one — reframed the J4 finding from "missing a step" to "the journey is aimed at the wrong job."

## The teachable thing
**Codex sharpened the finding past where my own audit stopped — the value of the independent reviewer.** My L23 audit said "J4 is missing the cross-site push step." Codex read the source and said something stronger: the J4 journey we *did* draw is "consistent across the whole **site**" (wireflows:217), but the IA defines J4's done-state as propagation to "every selected **client site**" (ia-tree:222). So J4 isn't a complete journey minus one step — **it journeys the wrong outcome entirely** (single-site consistency instead of cross-client propagation). That's a different, more damning class of error: not incomplete, *mis-aimed*. I'd have shipped "add a push step to J4"; the real fix is "J4's journey is at the wrong altitude." This is exactly why the founder's instinct to run codex was right — a second reader catches the frame error the first reader rationalized.

**The honest coverage headline is brutal: only J3 (Build) is correctly journeyed.** J4 = wrong job. J5 = partial (editor round-trip drawn, dashboard review-queue/status-flip — the IA's actual success condition — never journeyed). J6 = partial (ship yes, run/measure no). J1, J2 = no journey. So the design set that looked "done" (5 journeys, coverage complete) actually journeys **one** of six jobs cleanly. Countable coverage hid it again (LR-0018's trap, third time): 5 drawn journeys *felt* like coverage; job-by-job correctness says 1/6.

**The differentiator has no journey — codex's one-liner names the whole problem:** *"the doc that claims to prove the differentiator never draws the differentiator."* The agency wedge end-to-end (Clients→…→Shared DS push→…→Live) is the IA's stated "first slice," and the only journey artifact skips it. That's the #1 gap, and it's the same story as the J4-wrong-job gap at a different zoom — codex flagged my double-counting (wedge end-to-end ≈ J4 push ≈ J1/J2 entry overlap): keep both zoom levels, but it's one product bet, not several.

## Corrections worth keeping
- §21a is tracker *config*, not the analytics *view* (dashboard) — my citation was sloppy; "run it" still lacks a journey, just not because of §21a.
- AI-inside-a-job = LEGIT (cross-cutting, no standalone journey); the only real AI flow gap is J2 "New site — AI."
- Onboarding splits: dashboard first-run (J2) = real gap; editor onboarding = legit cross-cutting.

## Consequence for the work
- `docs/reviews/journey-coverage-audit-20260629.md` — the codex-verified gap table (7 real gaps, ranked) + corrections + the one-move recommendation.
- **Recommendation surfaced:** draw the agency-wedge end-to-end journey — it collapses gaps #1, #2, and the J5-queue half of #4 into one artifact and forces J1/J2 entry to be drawn. Highest-leverage single missing piece.
- Course: 23 lessons · 16 references · 23 learning-records.

## Teaching note
Reusable: **a coherence audit run by the author finds the missing steps; an independent reviewer finds the mis-aimed journey.** Same artifact, deeper class of error — the author checks "is each step there?", the outsider checks "is this even the right journey?" (the global-shape question from LR-0018/LR-0017). The pattern keeps repeating: countable completeness (5 journeys) masks correctness (1/6 jobs journeyed right). Ties to [[0022-wireframe-audit-tests-coherence-not-correctness]] (this is that audit, deepened by codex) and [[0017-autoplan-caught-build-the-wrong-thing]] (independent review catches "the wrong thing, well"). Next real move is to draw the wedge journey — and ultimately, still, to put it in front of agencies (the correctness proof a wireframe can't give).
