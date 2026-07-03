# 0026 — A second codex pass on the "clean" journey set still found a P1 dead-end + 3 drifts

**Date:** 2026-06-29
**Status:** active

## What happened
Last session closed with the 10-journey set marked "complete + consistent + verified" (LR-0025) — my own verification (anchor resolution, tag balance, count consistency) all passed. The founder then ran `/codex` to independently audit wireflows.html + wireflows.standalone.html + ia-tree.html for "every flow and job done, no orphan/missing/dead-end." Codex found **4 real issues my pass missed**:

- **[P1] J6 "Ship it" ended on a dead-end.** The journey's success state (`● Live`) was step 4; step 5 was "Restore safety net." So a *Ship* journey visually terminated on "if it broke, restore" — reads like shipping failed. Fixed by reordering: safety net is now step 4 (honest — cloud snapshots exist continuously, the prior version is the standing rollback target), and `● Live — the goal` is the terminal step-5 hero.
- **[P2] J5 sign-off** jumped "Agency resolve" → "Re-share / approved" with no explicit client-return / status-flip. Sharpened step 5 to name the `In-review ➜ ✓ Approved` flip.
- **[P2] Count drift 41→39.** Both wireflow files still said the appendix had "41 per-surface specs"; the appendix itself merged §6+§12 into §5 (`editor-wireframe.html:407`) → 39. My own count-sweeps last session checked the *journey* count (10), never the *surface* count.
- **[P2] ia-tree self-contradiction.** Rail prose said the locked spine `Insert·Pages·Styles·Site`, but a J3 feature-table row still said "4-mode editor (Build / AI / Design / Settings) — this IS the rail." Two cells of one doc disagreeing.

## The teachable thing
**My verification tested the checks I thought to write; codex tested the ones I didn't.** Anchor-resolution + tag-balance + journey-count are *mechanical* invariants — easy to script, easy to pass. The P1 (does a journey end on its goal?) and the two drifts (surface-count, intra-doc rail contradiction) are *semantic/coherence* invariants — they need a reader who asks "does this read right?", not a grep. This is exactly L23's split: a coherence audit catches what a correctness check can't, and a *second independent* coherence pass catches what the first author's coherence pass can't, because the author is blind to their own framing ("of course Ship ends on live — I know restore is just the safety bit").

**"Verified" is scoped to the checks run, not absolute.** Last session I wrote "complete + consistent + verified." Honest phrasing would have been "verified *against anchor/balance/count*." The dead-end lived in a dimension I never checked. Ties to [[feedback_codex_iterate_until_clean]] — a pass that *finds* issues is not a clean pass; the rule is iterate until codex returns clean, not "fix the first batch and stop."

## Consequence for the work
- `wireflows.html`: J6 reordered to end on `● Live` (P1); J5 status-flip made explicit (P2); surface count 41→39 (P2). div 672/672, 19 anchors all resolve.
- `wireflows.standalone.html`: surface count 41→39. div 466/466.
- `ia-tree.html`: J3 rail-table row aligned to locked spine `Insert·Pages·Styles·Site`, AI excluded.
- Re-verified: balance, anchors, no stray "41", no old rail string, "10 journeys" consistent, J6 terminal = Live.
- **Confirm pass ran (founder: "confirm karo").** It CONFIRMED F3 (count) + F4 (rail) + that canonical wireflows.html F1/F2 landed — and found **3 more**: the standalone copy still had the **same J6 dead-end + J5 no-flip** (I'd only applied F1/F2 to the canonical, treating the standalone's "stale" banner as cover), plus a **NEW** stale printed cross-ref `§12 inspector-full` in *both* files (the `#inspector-full` anchor resolves — it lives in §5 after the §6+§12 merge — but the printed "§12" label drifted, LR-0014 class). All 3 fixed: standalone J6 reordered to end on `● Live`, J5 flip added, `§12`→`§5` in both. Re-verified: div 672/672 + 466/466, anchors 19 + 18 all resolve, no `§12`/`§6` printed refs, no "41".

## The deeper cut (confirm pass)
**"Stale snapshot" excuses *missing content*, not a *broken journey* the copy still contains.** Last session I subordinated the standalone with a stale banner instead of hand-syncing (LR-0020) — correct for the 4 *absent* journeys (J1/J2/J6-run/forms). But the banner does NOT excuse the dead-end inside J6-Ship, a journey the standalone *does* have. The confirm pass caught me using "it's stale anyway" to skip a real fix. Refinement of LR-0020: **in a subordinated copy, quality bugs in the content it keeps must still be fixed; only the missing-content gap may be left to the banner.** A fix that lands in the canonical but not its derived copy isn't done — it's half-done in two files.

## Teaching note
Reusable: **a mechanical-invariant pass and a coherence pass are different audits — passing the first does not imply the second.** And: **the author's own coherence pass is blind to the author's framing; spend one independent adversarial pass before calling a design-set done.** Ties to [[0025-journey-set-complete-clean-source-before-figma]] (the "clean before Figma" sequence — this is what "clean" actually took) and [[0023-codex-journey-audit-the-wedge-journey-is-the-wrong-job]] (the prior codex pass that found the coverage gaps; this one found the *quality* gaps inside the now-complete set).
