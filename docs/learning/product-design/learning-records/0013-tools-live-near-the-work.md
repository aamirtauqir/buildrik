# 0013 — Tools live near the work (constitution #16)

**Date:** 2026-06-26
**Status:** active

## What happened
Mid-Stage-2 (drawing surfaces), the learner proposed a structural rule of their own (Roman Urdu): the controls that are *part of working on the canvas* — undo/redo, edit history, breakpoint switch (and "more like these") — should live **with the canvas**, not in the topbar; and the topbar should be kept clean, holding **only infrequently-used** things.

## The teachable thing
This is a real, nameable principle: **control locality / proximity.** Two axes, not one:
- **#4 (prominence):** frequency × importance decides how *loud* a control is.
- **#16 (proximity, new):** frequency relative to the *object* a control acts on decides *where* it lives. Frequent canvas-operations hug the canvas; the chrome edge (topbar) carries only rare, global actions.

Grounding = **Fitts's Law** (time/effort to hit a target rises with distance, falls with size) + the established "canvas toolbar" pattern in Figma/Framer. Reaching to the far topbar for a per-minute action (undo) is a tax the layout should remove.

**It refines L5 (the topbar is a bouncer).** Old door test: "topbar, default NO." New, sharper filter: "is this a *frequent canvas operation*? then it doesn't belong in the topbar at all — it belongs by the canvas." The bouncer got a second question.

**The apparent conflict that isn't:** if topbar = rare/global, where does the hero Publish go? Publish *is* infrequent (you build for long stretches and publish occasionally), so it stays the topbar hero. "#5 Publish is the hero" and "#16 topbar = rare/global" coexist cleanly — Publish is the rare-but-important global ship action.

## Consequence for the work
- **Constitution → 16.** Added #16 "Tools live near the work" to the Structure group (after #15). First new principle in four lessons — the learner *generated* it from their own instinct (the founding naming-muscle method, [[0001-worked-examples-not-homework]]); I named + grounded it.
- **Wireframe revised:** topbar slimmed (Exit · Share · Publish · ⋯); a **canvas toolbar** strip added at the top of the canvas region holding undo/redo · history · device-switch (centered, it's a lens) · zoom. Topbar §7 rewritten as "slim, rare/global only" with an honest L8 re-lay-out note — the *shipped* topbar still carries undo/redo + breakpoints, so the build is "move the buttons, keep the handlers," not a rewrite.
- Decision recorded: AI ✨ stays in the topbar — it's a global *helper*, not a direct canvas-manipulation control, so it's outside #16's scope (flagged as a possible later reconsideration if AI proves high-frequency).

## Teaching note
The learner is now *authoring principles*, not just applying them — they handed me the rule fully formed and only lacked the name + grounding. That's a level up from [[0009-lock-the-spine-stability-under-growth]] (where they also named an instinct): there it was vocabulary, here it's a genuinely new spatial axis the constitution didn't cover. Lead stayed: affirm the instinct → name it (proximity/Fitts) → ground it → apply to the real wireframe → record. Then back to Stage-2 batches.
