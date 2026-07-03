# 0008 — Craft-on-guesses hits the wall: the cure is converge + test, not think harder

**Date:** 2026-06-23
**Status:** active

## What happened
After several turns iterating the editor left-rail design (frequency order, 4 vs 5 tools, Insert-as-cluster, the "grab-bag" reframe), the learner stepped back with a confidence wobble (Roman Urdu): *"I'm not a product designer, I only have some idea of UX/UI, why can't I design this properly, help me get good."* They were caught in a loop — every proposed rail still "felt off," and they read that as personal inadequacy.

## The diagnosis (the teachable thing)
This is exactly the wall [[0004-mission-evolved-to-pro-builder]] predicted: **craft applied to your own guesses produces confident-but-unvalidated work, and endless second-guessing.** The learner wasn't failing — two things were true:
1. **They are already designing well.** In this one session they caught a breadcrumb misplacement, caught that the "Site" rail group duplicates the topbar (#14 — a real flaw in the team's own E3 plan), sensed the cluster/grab-bag smell, and restated "frequently-used → left bar" (which is constitution #4). A non-designer doesn't feel those. The discomfort IS taste firing.
2. **The loop came from trying to *deduce* the one perfect rail.** Nobody can. The rail's answer doesn't live in the designer's head — it lives in how the real user uses the editor. Insert-sub-tab vs separate-Media, 4 vs 5 tools: these are tie-broken by *use and frequency*, not by more reasoning.

## The cure taught (L15)
- **Ira Glass "The Gap":** early on, taste outruns skill, so your own work disappoints you — that gap feels like failure but is the engine; close it with reps, not harder thinking.
- **Krug:** "you don't have to get it right, you have to make it testable." Designers converge on good-enough → test → fix; they don't perfect on paper.
- **The unstick for the rail:** lock the fewest-issue option already on the table (Model C + dissolve Settings: Insert · Media · Pages · Design), build a clickable mockup (like `topbar-final.html`), walk the real job (self + 3-5 users, silent), fix what trips. Decision > perfection.

## The "grab-bag vs palette" reframe (worth keeping)
The learner's recurring objection — "it just becomes a cluster again (the Add one)" — surfaced a real principle: **you can't eliminate grouping in a ~100-feature tool; the goal is that every group is ONE honest job (a palette) not several (a grab-bag).** "Insert = elements/sections/components" is a palette (one job: put something on the canvas) and is fine. The actual grab-bag was **Settings** (SEO+domains+code+forms = 4 jobs) — dissolve it by sending each item to its real job. This is the macro of #10.

## Consequences for teaching
- The learner's mission ("pro builder; research is the frontier") is now *felt*, not just stated — the wall is real. Next move is the highest-leverage one the path has been pointing at: stop deciding the rail in the abstract, build the mockup, run the 5-user walk on the core job, let use break the ties.
- Confidence is now a teaching variable. Lead with evidence of their real wins (anti-perfectionism), then method. Builds on [[0002-learner-caught-a-real-design-error]].
- No new constitution principle — this is about *process and confidence*, not a new placement rule.
