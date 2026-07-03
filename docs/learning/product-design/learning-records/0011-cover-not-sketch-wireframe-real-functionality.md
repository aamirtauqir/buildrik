# 0011 — Cover, don't sketch: the wireframe must be the real functionality, redesigned

**Date:** 2026-06-26
**Status:** active

## What happened
After the editor-wireframe + left-side lock ([[0010-wireframe-job-first-then-blocks]]), the learner pushed back hard (Roman Urdu): *"the wireframe isn't being built from my existing functionality? And not like a feature list either — just show the functionality. Redesign the whole editor, because the first product wasn't designed right. Now I get it — you run skills for this too."* A correction, a realization, and an implicit endorsement of the structured process.

## The teachable thing (three distinct points)
1. **Reverse, not forward.** Every wireframe screen must trace to *real* functionality in the code, not an invented wish. This is reverse-wireframing ([[0007-structure-becomes-navigation-the-rail]] lineage / L12), and the learner was right that my draft drifted toward a high-level sketch rather than their actual surface set.
2. **Feature ≠ surface ≠ screen.** The learner's "not like features, just functionality" is a real taxonomy: a *feature* is one capability (~100 of them), a *surface* is where the user works (~12–15, holds many features), a *screen/state* is one condition of a surface. You wireframe the **surface**, grouped by job — cataloguing 100 features as 100 screens is the mistake.
3. **Cover vs sketch.** Drawing 3–4 "representative" screens *feels* complete but isn't. The fix is a **coverage map** that makes completeness countable: list every real surface, give each a home, mark drawn/to-draw, drive to-draw to zero. This is `definition-of-done` applied to wireframing.

## Consequence for the work
- Honest self-correction: the editor-wireframe was **sketch, not cover** — frame + 4 rail panels + inspector at basic fidelity, with **~21 of ~35 surfaces still to-draw** (CMS, Components, Interactions/Animations, Version history, Forms, SEO, Settings, Publish flow, Preview/Review/Comments/Share, AI assistant + propose, Command palette, Onboarding, Layers, Canvas controls, Image editor, Stock, Custom CSS, Domains, Redirects, My Templates).
- New grounding SSOT: `reference/editor-functionality-map.html` — every editor functional surface, code-grounded (from the existing `complete-feature-list-20260623.md` + `editor-orphans-20260624.md` + `wiring-matrix-codex`), grouped by the 6 jobs, with status + redesign-home + drawn status. This is both the build checklist and the proof the wireframe is grounded in *their* functionality.
- **Process choice (deliberate):** did NOT mass-produce the 21 missing screens this turn. The learner's complaint was specifically about *grounding* — so I surfaced the inventory/coverage map first, for them to verify I captured their functionality correctly, before investing in drawing. Matches the L12 sequence: inventory → confirm → wireframe → review → build. Confirm-before-build, not build-then-discover-it's-wrong.

## No new principle
The constitution stayed at 15. L18 is application of #13 (every state / completeness) + the reverse-wireframe method — a *scope/process* discipline, not a new design rule. (Second lesson in a row with no new principle — the constitution keeps covering new ground; see [[0009-lock-the-spine-stability-under-growth]].)

## Teaching note
The "ab samajh aati hai aap iske liye skills bhi run karte ho" line is a shift: the learner now sees the redesign as a *real, repeatable process* (inventory docs, reverse-wireframe, coverage map, reviews), not ad-hoc chatting. That's the pro-builder posture the mission targets — directing the work like a PM. Lead next from the map: let them confirm coverage, then draw to-draw surfaces in batches.
