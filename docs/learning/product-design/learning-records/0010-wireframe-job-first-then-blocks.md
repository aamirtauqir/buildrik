# 0010 — Wireframing: job first, then blocks (and the editor wireframe shipped)

**Date:** 2026-06-25
**Status:** active

## What happened
The learner invoked `/teach` with a wireframing prompt (Roman Urdu): use **job-to-be-done** first, then **module/block**; follow a 5-step order (Screen → Job → Modules → Wireframe → Why); ground it in the *real* app; and produce **"a complete wireframing of the whole editor."** This lands precisely on the NEXT-action that [[0007-structure-becomes-navigation-the-rail]], [[0008-craft-on-guesses-hits-the-wall-converge-and-test]], and [[0009-lock-the-spine-stability-under-growth]] all converged on — the clickable editor wireframe. The IA was done, the rail was locked; the missing step was *drawing* it so it can be tested.

## The teachable thing
Wireframing is **two passes on one screen**, in this order:
1. **Job (JTBD)** — what one task did the user come to do? This decides **prominence**: the biggest job becomes the loudest box. (This IS constitution #4 wearing a process hat; Christensen's "milkshake" lens.)
2. **Modules/blocks** — cut the screen into blocks (nav / main-action / info), then place them as grey boxes on a grid.

Job *before* blocks because blocks-first just copies the existing UI; job-first starts from the user. The learner's 5-step recipe (Screen→Job→Modules→Wireframe→Why) is the operational form.

**Low-fi discipline (the why behind grey):** the point of a wireframe is "not final" — colour/real-images drag feedback off *layout* and onto *taste*. So: monochrome, prominence by **size + position** (never colour), bars instead of copy, ✕-box for images, snap to a grid. Krug's bar: make it **testable, not right**.

## Consequence for the work
- **No new principle.** L17 is pure application of #1 (plain language / match real world), #4 (prominence), #5 (one hero), #9 (progressive disclosure), #13 (every state), #15 (lock the spine). That the constitution covered an entire new artifact with zero additions is the strongest signal yet that it's load-bearing — the milestone first flagged in [[0009-lock-the-spine-stability-under-growth]].
- **Deliverable shipped:** `reference/editor-wireframe.html` — the whole editor, grey-boxed, 11 sections, each via the 5-step recipe with numbered "why" notes citing the constitution. This is now the visual SSOT for the redesign and the blueprint for the 5-user walk.
- **Method made reusable:** `assets/wireframe.css` is the workspace's first wireframing component (grey-box kit). Future wireframe lessons build on it, not from scratch — the assets-reuse rule in practice.

## Grounding (honesty)
The wireframe matches the **real shipped shell**, mapped live via an Explore pass (`AquibraStudio.tsx` / `Topbar.tsx` / `ProInspector.tsx` / `StudioFooter.tsx` / `tabsConfig.ts`). Caveat surfaced in the doc: the shipped rail is still the **11-tab zoned** version; the wireframe draws the **locked 4-tool target** (Insert·Media·Pages·Design) from the home-map — i.e. it's the *to-be*, not the *as-is*. Open ties (Media slot vs Insert sub-tab; Layers footer vs Pages; Components placement; the gated presence slot) are **drawn but flagged for the walk**, honoring [[0008-craft-on-guesses-hits-the-wall-converge-and-test]] — decide enough to test, break ties by use not debate.

## Teaching note
Confidence stayed steady (contrast with the wobble in [[0008-craft-on-guesses-hits-the-wall-converge-and-test]]). The learner is now commissioning artifacts ("wireframe the whole editor") rather than asking whether they *can* — applied-judgment posture from [[0002-learner-caught-a-real-design-error]] is holding. Next is the highest-leverage deferred habit: the 5-user walk on the drawn wireframe (Krug / mission "pro frontier").
