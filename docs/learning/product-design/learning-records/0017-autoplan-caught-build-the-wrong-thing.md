# 0017 — Stage-5 review caught "build the wrong thing well" before a line of code

**Date:** 2026-06-26
**Status:** active

## What happened
Ran `/autoplan` (Stage 5) on the Stage-4 redesign plan — CEO + design + eng lenses, each an independent Claude subagent, plus a codex code-check. The plan was internally excellent (code-grounded, honest tally, cut collab/export, honesty gates). The reviews still came back **GATE FAIL with critical findings**, converging on one verdict: *don't green-light the 6-phase build — validate agency demand first.* The founder took the User Challenge and chose **"validate demand first."** The plan now carries a Phase −1 demand gate + 7 required revisions; the 6 phases are kept as the blueprint for after the gate.

## The teachable things (this is the capstone of the redesign arc)

**1. A plan can be excellent and still aimed at the wrong target.** Every craft signal was green — grounding, honesty, the 30/3/8 tally, the cut features. The CEO lens still said "build the wrong thing well": ~80% of the plan reskins surfaces *no agency has complained about*, the differentiator *already works in code*, and nothing tested whether agencies want the agency-first bet until Stage 8 — after the whole build. Craft quality ≠ correctness of target. Reviews exist to check the target, not just the execution.

**2. Code-grounded review beats document review.** The eng lens read the actual source and found what no amount of reading the plan or the map could surface: the wedge (Shared DS push) has **zero `theme.*` wiring in the editor** — the working UI is dashboard-only, there's no `themeSync.ts`. The coverage map said `✅ keep+reskin`; the code said "this is a new editor build, days not hours," plus a live cross-session clobber hazard. Codex confirmed it. **The status-icon abstraction hid a re-wire behind a ✅.** Lesson: when a plan's effort estimate rides on a status column, make at least one reviewer read the code the column summarizes.

**3. The keep/new method had a hole I built in.** "Read keep-vs-new off the status icon" conflates two different questions: *does the code work* vs *does the flow/IA need rethinking*. The dedup "one home" merge — the stated lever of the whole redesign — got tagged cheap `keep+reskin` because the code works, even though merging two homes IS the IA work. And a single icon drops sub-statuses the feature-list's note column carries (Components `🔴 overrides revert`, Comments' real cost = the cross-origin client overlay, Animations' engine deleted). Fix: classify on two axes (works? / flow-changes?) and read the note column, not just the icon. My own method from [[0016-coverage-map-to-build-plan]] needed this correction — the reviews found it.

**4. Demand-validation beats craft for a pre-PMF solo founder.** First real user-contact was Stage 8, after six build phases. The CEO lens's move — carve the one differentiator onto the *current* chrome, put it in front of 3-5 agencies *now* — tests in two weeks what the full build would take a quarter to validate. The cheapest place to learn the thesis is wrong is before you build, not after. We moved the demand check to Phase −1.

**5. The User Challenge is sacred — and the founder used it.** autoplan never auto-decides when both models say the user's stated direction should change. The plan said "build all 6 phases"; both models said "validate first." That went to the founder as a User Challenge with the cost-of-being-wrong spelled out, and the founder chose to validate. That's the whole point of the gate: the models surface the blind spot, the human (who has the market context the models lack) decides.

## Consequence for the work
- The plan is revised: a Phase −1 demand gate + 7 required revisions (re-tag the wedge `new-flow` + clobber-guard, fix the keep/new method, split the Inspector, draw the 5 build-blockers, fix Share's security gap, reclassify Animations, move the demand gate before build). The 6 phases survive as the blueprint, now honestly gated.
- The tally correction alone (wedge `keep→new`) moved 30/3/8 → 29/3/9 — and that's just the first re-classification; the dedup-IA re-count will move it further.

## Teaching note
This closes the loop the founder opened many turns ago: *"can we redesign the whole product using plan-ceo-review / design-review / a goal skill + codex?"* The answer played out end-to-end — wireframes (human, Stage 2) → plan from the map (Stage 4) → and Stage 5 just earned its keep by catching a quarter-saving strategic error that no amount of more drawing or more planning would have found. The skills don't draw or build; they pressure-test. Used at the right moment, one of them just paid for the entire arc. The next move isn't more design — it's putting the one differentiator in front of real agencies.
