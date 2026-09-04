# Editor Figma file — IA audit and rebuild checklist

File `g4GzQFqzNYz5sosz1QtZXC`, page `1:3`. Every number below was fetched from
the file, not estimated. Ground truth captured 2026-09-04.

## Phase 1 — what is actually on the page

| kind | count |
|---|---|
| screens (≥280×200, not caption/strip/shape) | **397** |
| caption frames | 244 |
| thin strips / annotations | 162 |
| stray shapes at top level (`Rectangle`, …) | 12 |
| section markers (📄 🗃️ 🔍) | 5 |
| **total top-level frames** | **820** |

Prototype graph: **2,489 edges** — 350 at frame level, **2,139 on hotspot
children**. Orphan screens **21 (5%)**. Dead ends **12 (3%)**.

> **A first pass read reactions only at frame level and reported 77% orphans and
> 58% dead ends.** Both were wrong by an order of magnitude: 86% of this file's
> wiring hangs off hotspot children. Any flow claim made without walking
> descendants is fiction. This is a recorded trap in this repo and it still
> caught me.

## Phase 2 — findings

Severity: **Critical** blocks a job · **Major** IA/hierarchy/missing states ·
**Minor** consistency · **Polish** micro-detail.

| # | Finding | Evidence | Sev | Recommendation |
|---|---|---|---|---|
| IA-1 | **Two competing taxonomies organise the same 397 screens.** A feature taxonomy (Media 39, Brand 30, History 19, Layers 18, Content 18, Pages 13, Publish 12, Insert 11, Inspector 9) and a flow taxonomy (S1 22, S3 18, S5 23, S7 42 = 107 screens). A screen can only sit in one, so "where does this live" has two answers. | frame-name census, 80 families over 397 screens | **Critical** | Pick ONE spine. The product's own rail is feature-based, so features are the spine; S-flows become a cross-cutting *journey* layer that references feature screens instead of owning parallel copies. |
| IA-2 | **40 of 80 families contain exactly one screen.** `S1.1c`, `S3.10`, `B9.5`, `Exit`, `Export`, `S2.0`, `S6.2` are identifiers, not groups. | taxonomy count | **Major** | Fold every singleton into its feature parent; keep the flow id in the frame name as a suffix, not as the grouping key. |
| IA-3 | **The S-flow numbering implies seven flows and delivers four.** S1 22 screens, S3 18, S5 23, S7 42 — but **S2 = 1, S6 = 1, S4 = 0**. A reader counting S1–S7 expects seven journeys; three of those slots are empty or a stub. | per-flow counts | **Major** | Either build S2/S4/S6 or retire the numbering and name journeys for the job they do ("First run", "Publish", "Client sign-off"). |
| IA-4 | **Screens and annotation share one flat page.** 418 of 820 frames are captions, strips, markers or stray shapes, interleaved with the 397 screens in one list. | kind census | **Major** | Group with Figma Sections: screens by feature, annotation into a parallel `Notes` section per feature. Sections preserve node ids, history and every prototype link. |
| IA-5 | **12 stray shapes sit at page top level** (`Rectangle` ×12). | name census | **Minor** | Delete or move into the frame they annotate. |
| IA-6 | 21 orphan screens — nothing navigates to them. Concentrated in Insert (3), Compare (2), S1.3 (2), REVIEW (2). | flow graph | **Major** | Give each an entry point or retire it. Full list in `ia-graph.json`. |
| IA-7 | 12 dead ends — no forward path and no way back. Layers (3), Client sign-off (2). | flow graph | **Major** | Every terminal screen needs an onward step. |

### What is already working — protect it

- **Flow wiring is in good shape**: 5% orphans and 3% dead ends across 397
  screens is a healthy graph, and 2,139 hotspot-level edges means transitions
  are scoped to real controls rather than whole-frame click-anywhere.
- The feature families that dominate (Media, Brand, History, Layers, Content)
  already match the product's rail, so the spine in IA-1 is a consolidation,
  not an invention.

## Phase 3 — the rebuild, in cascade order

1. **Sections for the spine** (IA-4, IA-2): one Figma Section per feature, one
   `Journeys` section for S-flows, one `Notes` section for annotation.
2. **Resolve the taxonomy conflict** (IA-1): every S-flow screen either moves
   under its feature or is recorded as a journey-only composite.
3. **Retire or build the empty flow slots** (IA-3).
4. **Close orphans and dead ends** (IA-6, IA-7).
5. **Sweep stray shapes** (IA-5).

## Checklist — agents tick these, each with evidence

- [ ] C1 · Sections exist for every feature family with ≥5 screens
- [ ] C2 · Every screen sits in exactly one section
- [ ] C3 · Annotation frames are out of the screen list
- [ ] C4 · No family has exactly one screen unless it is genuinely standalone
- [ ] C5 · S-flow numbering is either complete or retired — no phantom slots
- [ ] C6 · Every orphan has an entry point or a recorded retirement
- [ ] C7 · Every dead end has an onward step
- [ ] C8 · Stray top-level shapes are gone
- [ ] C9 · Prototype edge count did not drop (2,489 baseline) — sectioning must not break wiring
- [ ] C10 · A codex review has read the diff and signed off

**Rule for every tick:** cite the fetched value. A tick without evidence is a
guess, and guesses are what this audit exists to remove.
