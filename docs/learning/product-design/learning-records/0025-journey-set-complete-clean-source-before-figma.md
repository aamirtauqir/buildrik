# 0025 — Journey set now covers all 6 jobs; "clean the source before pushing to Figma" is the right sequence

**Date:** 2026-06-29
**Status:** active

## What happened
The founder set the order plainly: drop the SVG route, recreate the artifacts in Figma via MCP — *but* "us se pehle hum logo ko saari cheezein sahi karni hein" (fix everything first). Scope confirmed via AskUserQuestion: complete the 4 reference artifacts (not the 108 dashboard screens), rail stays object-named. Drew the 4 journeys codex flagged missing, so `wireflows.html` now has **10 journeys covering all 6 jobs**.

## The teachable thing
**Clean the upstream artifact before propagating it downstream — the founder sequenced this correctly.** Pushing a half-complete journey set into Figma would mean recreating known gaps by hand, then discovering them again in a second tool. The cheap place to fix "wireflows is missing 4 journeys" is in the one HTML source, before it forks into Figma frames. This is the same direction-of-flow discipline as the redesign pipeline (LR-0016): design → validate → build, never skip upstream. The founder applied it to tools: source-of-truth → export, never export-then-fix.

**A confirmed decision changes status from "reversible-pending" to "settled" — record the difference.** The D4 rail (object-named `Insert·Pages·Styles·Site`) was applied last session as reversible, flagged for the founder. They confirmed it (object-named stands; job-named rejected as a real rebuild). The shape-check report now reads "✓ CONFIRMED 2026-06-29, not reversible-pending." Leaving a decision marked "reversible" after the founder has ruled invites re-litigation later; closing it is part of "sahi karna."

**The journey set is now complete, and completeness here is honest because each journey is a real sequence, not a labelled surface (LR-0018 held).** 10 journeys: ★ wedge spine + J1 Run-business · J2 Start-site · J3 Build ×2 · J4 Brand · J5 Sign-off · J6 Ship ×3 (ship · run/measure · forms→leads). The J6 ×3 makes codex's "Ship & run it is two jobs" seam visible in the structure: Ship (one-time) vs Run/measure + Forms (ongoing). Every job a user actually does now has a left-to-right journey that closes on its goal.

## Consequence for the work
- `wireflows.html`: +4 journeys (J1, J2, J6-run, J6-forms) → 10 total, all 6 jobs covered. Counts propagated to editor-wireframe banner + by-journey index + functionality-map (6→10).
- D4 rail confirmed object-named in the shape-check report.
- `wireflows.standalone.html` subordinated with a stale banner (nothing consumes it; not worth hand-syncing 4 big blocks through this expansion — flag, don't fake).
- Verified: 10 journeys, 0 broken §N anchors, all tags balanced, "10 journeys" consistent across the doc set.
- Course: 24 lessons · 16 references · 25 learning-records.

## Teaching note
Reusable: **when work forks into a second tool, finish it in the source first — the gap you skip upstream you rebuild downstream.** And: **close confirmed decisions explicitly** so "reversible-pending" doesn't linger as future ambiguity. Ties to [[0023-codex-journey-audit-the-wedge-journey-is-the-wrong-job]] (these 4 journeys are exactly its gap list, now filled) and [[0024-figma-is-export-not-build-svg-route-on-starter]] (the Figma step this is preparing for). What's still NOT done is correctness — 10 coherent journeys is still a wireframe set no user has touched (L23); the Figma recreation makes it prettier/shareable, not validated.
