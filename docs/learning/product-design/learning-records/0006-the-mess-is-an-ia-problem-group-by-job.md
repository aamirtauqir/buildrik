# 0006 — The "mess" is an information-architecture problem: group by job, one home

**Date:** 2026-06-23
**Status:** active

## What happened
The learner asked (Roman Urdu) to redesign the existing app's features "first" — naming the real symptoms precisely: too many feature clusters, duplicate features, two surfaces (dashboard + editor), broken navigation/hierarchy, and the core feeling *"samajh nahi aata kis cheez ko kahan rakhun"* (I don't know what to put where). They asked for a step plan, UX-first, and "what do you suggest."

## The diagnosis worth keeping
This isn't taste, polish, or a rewrite — it's **information architecture**. The learner's own words ("can't figure out where things go") are the textbook symptom of bad IA. And the root cause was already visible in the fresh `docs/reviews/feature-inventory.md`: the product is grouped into **17 clusters that mirror the PRD/backend modules** (Module 1–9) — i.e. organized by the *system's* shape, not the *user's*. That is the #1 IA mistake (NN/g: structure must match the user's mental model, not the org chart).

## The method taught (L13 + the home-map worksheet)
Three rules:
1. **Group by the user's job, not the module.** 17 technical clusters collapse to ~6 agency-operator jobs (run the business · start a site · build the page · make it on-brand · get sign-off · ship & run).
2. **One home per feature** (new constitution principle **#14** — the whole-product big brother of #10 "Group by intent"). Duplicates → pick one, merge.
3. **The scope test splits the two surfaces:** "one site's content → Editor; across sites / the business → Dashboard." One line answers every "where does this go?".

The deliverable is a **home-map** (`reference/ia-home-map.html`): every feature → job → home → verdict (keep / merge / cut / hide / fix). Verdicts are grounded in `feature-backend-map.md`, not taste — e.g. AI-create-site + stock photos + collab + billing-upgrade = **hide** (STUB/broken/off, constitution #3); Export HTML = **cut** (anti-retention, prior product audit); Site-settings ×3 / Media ×2 / SEO ×2 / DS ×3 = **merge**.

## The step plan confirmed (UX-first)
1 **Structure (IA)** → 2 **Navigation** (groups become the real nav; ~5 top-level) → 3 **Flows** (walk each job, fix broken paths + missing states/feedback) → 4 **Visual polish (later)**. Structure first because nav, hierarchy, and flows all sit on top of it — the learner's instinct to "do UX first" was correct.

## Consequences for teaching
- Builds on [[0005-zero-ghosts-gap-is-states-not-screens]]: that record found the gap is *states inside existing surfaces*, not missing screens. This adds the orthogonal axis — those surfaces are also *mis-located and duplicated*. State-completion (P1 feedback) and structure (IA) are two different repairs; the home-map is the structure one.
- Same engine as always — inventory → decide → handoff → build → verify — now reading the *whole product's structure* rather than one panel (L3) or one panel's states (L7) or the backend's capabilities (L12).
- Next teachable move: **"run the home-map"** — fill all ~100 features + confirm each verdict against live code in one pass → that output IS Step 2's nav skeleton.
