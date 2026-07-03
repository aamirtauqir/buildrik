# 0014 — Codex review caught wireframe cross-reference drift (and a bug I wrongly dismissed)

**Date:** 2026-06-26
**Status:** active

## What happened
The learner ran `/codex review the wireframing and find all the issues` against the wireframe docs (built across the prior sessions: `editor-wireframe.html`, `editor-functionality-map.html`, `redesign-pipeline.html`, the constitution, lessons 17–20). Codex (read-only, ~1.1M tokens) found **11 real issues** — 7 P1, 4 P2. All were fixed (12 edits including a real HTML bug). Files re-verified: tag-balanced, map cells 16/7/18 = 41 matching the summary.

## The teachable thing
1. **Incremental wireframe edits silently drift cross-references.** Almost every finding was a consistency break introduced by editing one doc without sweeping the others: after principle #16 moved undo/redo·breakpoints·zoom to a canvas toolbar in `editor-wireframe.html`, the **functionality-map still listed those in the topbar/footer rows**; zoom ended up with **two homes**; the surface count said **~35 in the pipeline, ~40 in the map, ~12–15 in lesson 18**; stage-3 "check: pass" lines claimed states (sent/awaiting, components badge, form validation) that **weren't actually drawn**. None were wrong when written; they rotted as later edits landed. **Lesson: after a batch of wireframe edits, run a consistency pass (codex or a script) across all cross-referencing docs — counts, control-homes, and "drawn" claims are the first things to drift.**

2. **Don't dismiss a tool's finding as a false-positive without checking ground truth.** Codex's P1 #2 said the functionality-map callout `<div>` was closed with `</p>`. I called it a `tidy` strictness false-positive because an earlier Read had shown `</div>`. A div/section balance check then found a real **15-open / 14-close imbalance**, and a raw-byte dump confirmed the line literally ended `…update.</p>` — **codex was right, my dismissal was wrong** (the earlier Read was stale/misread). The browser would have silently mis-nested the source/nav block. **Lesson: when overruling a finding, verify against the raw artifact (bytes / a parser), not a possibly-stale memory of it.** This is the mirror image of [[feedback_phantom_bugs_static_analysis]] — there static analysis over-reported; here I under-trusted a true report.

## Consequence for the work
- Wireframe set is now internally consistent: one home per control (#14), counts reconciled (41/16/7/18), every "pass" line backed by a drawn state, the review-loop link fixed, constitution provenance current through #16, and the callout HTML valid.
- Process note added to the [redesign pipeline](../reference/redesign-pipeline.html) sequence in practice: codex (Stage 5) is for the **plan**, but a lightweight codex/consistency pass is also worth running after each **wireframe batch** (Stage 2/3) — cheap insurance against drift before the plan is even assembled.

## Teaching note
The learner reached for `/codex` themselves at exactly the right moment — after several edit batches, before assembling the plan. That's the pipeline-thinking from [[0012-redesign-is-a-pipeline-not-a-button]] becoming habit: use the validate-tools to catch drift early. Good instinct to reinforce. My own miss (dismissing the real bug) is the honesty lesson to carry: verify before you overrule.
