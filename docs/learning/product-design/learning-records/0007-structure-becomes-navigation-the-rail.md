# 0007 — Structure becomes navigation: explaining the editor rail (Step 2)

**Date:** 2026-06-23
**Status:** active

## What happened
Right after the home-map run produced two nav skeletons, the learner pasted the **editor rail skeleton** back and asked (Roman Urdu) "explain me all of this." They wanted to understand the concrete artifact — the topbar line, the 4 modes, what's grouped inside each, the merges, and what got removed.

## The teachable thing
This is the **Step 1 → Step 2** transition made explicit: the home-map (IA — *what goes where*) becomes navigation (*how that organization is shown and clicked*). IA ≠ navigation; good nav just honestly mirrors the IA, it doesn't invent. Taught as L14.

## The structure explained (the substance)
- **Two layers of editor nav, two different questions.** Topbar = whole-site *actions* ("where am I · leave · send"), always present, same in every mode. Rail = the *jobs* you do inside one site ("what am I doing now"), one at a time. Mixing the two is what reads as "messy."
- **Topbar** = the already-shipped 3-zone bar (Navigate │ View │ Status+Ship): Publish is the lone hero (#5); ⋯ holds the rare ones that failed earns-its-way-in (#7).
- **The 4-mode rail was already correct** — the fix was the *contents*, not the rail. Build = make the page exist (add/pages/layers/CMS/media/insert). Design = on-brand. AI = assistant. Settings = configure this site.
- **Design mode has two altitudes:** Inspector (this selected element, local) vs Brand (the whole-site system — tokens/styles/components). The three old DS surfaces (ds1/ds2/ds3) merged into one "Brand".
- **Three merges, all #14 (one home):** Brand 3→1, Media 2→1, Settings 3→1.
- **Four removals, #3 + product judgment:** collab (6 P1 bugs), locale (engine locale-unaware), stock (STUB → []), export (works, but *cut* as anti-retention). "Hide ≠ delete the code" — code stays, it just leaves the nav until ready.

## Why this matters for teaching
- Every element of the skeleton traces to a *principle*, not taste (#5/#7/#10/#14/#3). That's the payoff the learner can now see: the redesign is rule-driven and therefore defensible/repeatable.
- Builds on [[0006-the-mess-is-an-ia-problem-group-by-job]] — that record was the structure (IA); this is rendering that structure as the thing users click.
- No new principle — pure application of the existing constitution. Good signal the constitution is now load-bearing.
- Next teachable move: turn the skeleton into a clickable editor wireframe (real rail + topbar, all states), or open the dashboard sidebar the same way. Then the L12 sequence step 4 (plan-design-review / plan-ceo-review) on the drafted redesign.
