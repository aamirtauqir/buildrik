# 0020 — A job-first shape-check on finished artifacts finds *consistency* drift, not structure drift

**Date:** 2026-06-29
**Status:** active

## What happened
Ran the Lesson-21 job-first shape-check across the four design artifacts (ia-home-map · ia-tree · wireflows · editor-wireframe) against the 6-job SSOT. Expected to find the known module-shape drift the founder had flagged ("IA index Insert·Media·Pages·Design"). Instead found the structure was *already* job-first everywhere — the LR-0018 fix had held — and the real defects were **four consistency drifts**: the four docs were each job-first internally but didn't all speak *one* job vocabulary. Produced a flag/fix list (`docs/reviews/shape-check-job-first-20260629.md`), fixed all four, verified (0 missing anchors, tags balanced, no stale numbering).

## The teachable thing
**Once the structure is job-first, the next failure mode is vocabulary, not shape.** Every artifact passed the "is the top level a job or a module?" test. What failed was alignment *between* them:
- **wireflows** numbered its 5 flows `J1–J5`, but the IA's jobs are `J1–J6` with different meanings (wireflows "J1 Make a page" = IA "J3 Build"; IA "J1" = "Run the business"). Same key, different referent — a reader crossing docs hits a contradiction. This is the LR-0014 cross-ref-drift class, one level up: not a broken `§N` link, a broken *concept* link. **The names were stable and correct; only the numbers lied** — exactly the LR-0015 pattern. The tell: `editor-wireframe` and both IA docs already used `J3/J4/J5/J6` correctly, so wireflows was the lone outlier. When one of N docs disagrees, the majority usually holds the truth.
- The deepest finding wasn't a typo — it was a **fork I could surface but shouldn't silently resolve**: ia-tree's editor rail (`Build·Design·AI·Settings`) vs the code-locked spine (`Insert·Pages·Styles·Site`), with AI wrongly sitting as a rail slot against the docs' own "AI is not a place." The honest resolution was to align to the locked spine + note that **job-grouping lives in the journeys, not the rail labels** — the post-LR-0018 split (rail = tool/object, Webflow-style; jobs = the flows). That's mission-coherent, but I flagged it as reversible because "should the rail be job-named?" is a real redesign decision, not a doc fix.

**A shape-check's value is highest *after* the structure is right.** Before LR-0018 a shape-check would've screamed "module-shaped." After it, the same check finds the quieter, more durable failure: drift between artifacts that each look fine alone. This is why the founder's "make it professional" reduced to a *check*, not a *rebuild* (LR-0019) — the work existed; what it lacked was one spine of vocabulary running top to bottom.

## Consequence for the work
- `docs/reviews/shape-check-job-first-20260629.md` — the flag/fix list (4 drifts D1–D4, severity-ranked, with the fix log + verification).
- **D1 fixed:** wireflows renumbered to the IA vocab (`J3·J3·J4·J5·J6`) across all 3 copies (html · standalone · svg); editor-wireframe back-ref corrected.
- **D2 fixed:** wireflows now states its scope (4 editor jobs here; 2 dashboard jobs elsewhere).
- **D3 fixed:** editor-wireframe appendix gained a "By journey (job-first)" index above the module A–Z.
- **D4 fixed (reversible):** ia-tree's editor rail aligned to the locked spine, AI dropped from the rail, job-grouping-lives-in-journeys note added.
- Verified: 0 unresolved anchors, all tags balanced, no stale J-numbers, one J# = one job across every doc.

## Teaching note
Two reusable rules came out of this. (1) **When N documents share a numbered scheme, the number is a cross-reference and rots like any link — make the docs speak one vocabulary or the drift is invisible until a reader crosses docs.** (2) **A shape-check distinguishes the mechanical fix from the design fork:** three of the four drifts were objectively wrong and mechanically fixable; the fourth (rail naming) was a defensible-either-way call I surfaced with a recommendation rather than silently deciding. Knowing which is which is the judgment. Ties to [[0019-no-single-goal-design-is-a-4-step-spine]] (the check that replaced the rebuild) and [[0014-codex-review-caught-cross-ref-drift]] (number-drift, now at the concept level).
