# 0015 — The "pass" line drifts into claiming undrawn states — fix it at draw-time, not review-time

**Date:** 2026-06-26
**Status:** active

## What happened
Three wireframe batches in a row (B2 close, B3, B4) a codex review found the **same defect**: the Stage-3 "✓ check: … pass" line on a surface listed states/capabilities (streaming · error · quota-out · executing · done · rejected · loading · edit-commands · plan-mode · empty · set-primary) that were **named in prose but never drawn as a visible element**. Each time the fix was the same: draw the missing state as a real chip/box, then the "pass" is honest. B4 needed two codex passes (GATE FAIL → draw every claimed state as a chip → GATE PASS).

## The teachable thing
This is [[0014-codex-review-caught-cross-ref-drift]]'s rule — *every "pass" line must be backed by a visually drawn state, "described in text" ≠ drawn* — but the **recurrence** is the new lesson. Knowing the rule at *review* time didn't stop me reproducing the defect at *draw* time. I keep writing the pass-line aspirationally (listing the full state-set a complete surface *should* have, #13) while the wireframe only shows the happy path plus one or two states.

**The corrective is a draw-time order-of-operations, not another review:**
1. Draw the surface's states FIRST (as chips/boxes) — empty · loading · error · the edge · the app-states that matter.
2. Write the "pass" line LAST, reading it **off the screen** — only list a state if a reader can point to the pixel that shows it.
3. A state worth claiming but not worth drawing in low-fi → write it as `→ states-checklist` (an explicit TODO), never as `pass`.

Same shape as the honesty principle the course already teaches users (#3 "don't promote what isn't ready", #13 "design every state"): the *claim* must not outrun the *artifact*. I was failing my own constitution in the meta-document.

## Why it kept happening (the real root)
The "pass" line is seductive because it doubles as a teaching device — it shows the learner the full heuristic set a surface is judged against. So I write the complete checklist, which reads as "all done." Fix: keep the teaching value but split the verb — `drawn:` for what's on screen, `still needed:` for the rest. One honest line, two columns. (Not yet applied to the older surfaces — a cheap consistency sweep for a later pass.)

## Consequence for the work
- B4 (AI: assistant · propose-action · inline) now has every claimed state drawn as a chip; map AI rows ✓ are defensible; 24 drawn / 7 partial / 10 to-draw / 41.
- Process change for B5 (the last 10 surfaces): **draw states → then write the pass line from the screen.** If this holds, the next codex batch-review should come back clean on the first pass — that's the test of whether the lesson actually landed.

## Teaching note
Worth surfacing to the learner explicitly: "I kept making the same mistake three times; the fix wasn't *trying harder at review*, it was *changing the order I work in*." That's a transferable engineering lesson (move the check upstream / make the failure impossible, don't catch it downstream) — the design analog of a lint rule over a code-review comment. Ties to the pipeline thinking in [[0012-redesign-is-a-pipeline-not-a-button]]: cheap insurance belongs at the earliest stage that can hold it.
