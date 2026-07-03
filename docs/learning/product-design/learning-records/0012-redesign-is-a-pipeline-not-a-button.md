# 0012 — Redesign is a pipeline, not a button (and what the skills really do)

**Date:** 2026-06-26
**Status:** active

## What happened
The learner moved from *what* to redesign ([[0011-cover-not-sketch-wireframe-real-functionality]]) to *how to execute it as a process*. They proposed driving the whole-product redesign with named skills — `plan-ceo-review` (to "fix our features"), `design-review` (to "make the user flow + proper wireframing"), a `/goal` autonomous skill + `codex` review, every screen checked, job+module "like Webflow" — and asked whether old flows should be kept or everything made new.

## The teachable thing
**Two corrections + one model:**

1. **What the skills actually do** (prevents misdirected effort — same lineage as the L12 correction that plan-reviews don't draw):
   - `plan-ceo-review` / `plan-design-review` / `plan-eng-review` — pressure-test a *written plan*. They critique; they don't draw or build. `autoplan` runs all three (+DX) in sequence.
   - `design-review` — QAs *built* UI (spacing, AI-slop, hierarchy, slow interactions) and fixes it. It is a post-build QA skill, **not** a wireframe generator. The learner's model ("design-review se wireframing banwate hain") was the thing to fix.
   - `codex` — external-model code/plan review (daily cap ~14). `/goal` — autonomous *build* run.
   - So: **wireframes = human (me + their eye); skills validate (plan reviews + codex), QA the built UI (design-review), or build (/goal).** No skill produces the wireframe.

2. **Keep vs new flow** = L8 "re-lay-out, not re-wire" at product scale. Keep + re-skin any flow the user completes without getting stuck (status ✅); design a *new* flow only where it's broken/confusing/missing (status 🟡🔵). The decision falls straight out of the coverage-map **status** column — no fresh judgment call needed per surface.

3. **The pipeline (the answer to "can we redesign the whole product"): yes — as 8 stages in 3 lanes.**
   - **Design (human):** 1 inventory ✓ → 2 wireframe every surface → 3 check every screen (heuristics + states, *before* build).
   - **Validate (skills):** 4 write the plan → 5 `autoplan` (ceo+design+eng) + `codex`.
   - **Build (auto):** 6 `/goal` + `codex` + 5-rung verify → 7 `design-review` the built UI → 8 5-user walk.

## Honest limit recorded
Stages 2–3 (design) need the learner's judgment — an autonomous `/goal` will guess and produce slop. `/goal` shines at stage 6 (build): it implements what the wireframes + plan specify. **One `/goal` will not design the product; it will build the design.** So the order is non-negotiable: design (human) → validate (skills) → build (auto). This is L8's "presentation ≠ logic" lifted to the whole-product scale.

## Consequence for the work
- New SSOT playbook: `reference/redesign-pipeline.html` (skill-roles table, keep/new-flow rule, 8 stages, autonomous-vs-judgment split). `lessons/0019-the-redesign-pipeline.html`.
- Webflow added to RESOURCES as the job+module reference model (fills the long-noted "no agency-tool UX teardown" gap; the learner cited it as the target structure).
- Sequencing reaffirmed: **we are at Stage 2** — draw the to-draw surfaces *before* running any review (can't review an unwritten plan; can't write a plan from undrawn surfaces). This holds the learner back from prematurely firing `autoplan`/`codex`.

## No new principle
Constitution stayed at 15 — three lessons running with no new principle (process/method, not design rules). The constitution is now stable; new lessons apply and sequence it rather than extend it (the maturity signal from [[0009-lock-the-spine-stability-under-growth]]).

## Teaching note
The learner is now thinking in *pipelines and tool-roles* — assembling skills into a process, asking where each fits. That's the PM-directing-a-team posture the mission's "pro frontier" targets. The right move was to honour the ambition (yes, the whole product, with these tools) while correcting the tool-model and enforcing the design-before-build order — ambition + accuracy, not a damper.
