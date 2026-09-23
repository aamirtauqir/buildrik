# Invariants BEFORE the V2→V1 writes — 2026-09-07

Taken with `node scripts/figma/verify-invariants.mjs` immediately after
`board-baseline.mjs` reported **no drift since 2026-09-06 (29 sections, 927
boards)** and before a single write of this arc.

**The page already FAILS.** These are pre-existing and must not be attributed to
the V2→V1 apply:

| class | count | detail |
|---|---|---|
| loose nodes on page | **77** | incl. `2591:11986 '375'`, `2591:11988 '768'`, `2591:11990 'fills canvas (min 1024)'`, `2591:11992 '1920'`, and the same four at `2598:*` — breakpoint labels parented to the page, not to a board |
| section overlaps | **2** | `07 · Brand` × `06 · Content` · `12 · AI` × `13 · Command palette` |
| out-of-bounds children | **2** | `163:113` History · Saves · time-travel ← `I229:1140;9:7 'Button'` · `1719:8421` Ecommerce · bound · inspector ← `1719:8442` |
| board overlaps | 0 | |
| dangling prototype edges | 0 | of 3217 |

Two consequences for the apply order:

1. **The AI section's new boards grow `12 · AI` from ~5 200 to ~6 620 tall, and
   `12 · AI` is ALREADY overlapping `13 · Command palette`.** `order-sections.mjs`
   after the AI build is not optional — it is repairing a defect that predates
   this arc and would otherwise be blamed on it.
2. A post-write run showing 77 loose / 2 overlaps / 2 OOB is **unchanged**, not
   broken. Only a number above these is this arc's doing.
