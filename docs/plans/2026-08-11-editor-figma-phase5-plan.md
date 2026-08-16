# Editor ⇄ Figma — Phase 5 execution plan

**Target file: `g4GzQFqzNYz5sosz1QtZXC`, page `1:3`.** Founder call 2026-08-11.
The Phase 1/2 gate is closed; frames may now be created.

This plan does not restate the audits. It is the order of work, the exit test for
each batch, and the questions that must be answered before certain batches can
run. Read first:

- `docs/audits/2026-08-11-editor-figma-reconciliation.md` — Phase 1/2 inventory
- `docs/audits/2026-08-11-editor-job-architecture.md` — Phase 3/4, 13 jobs,
  findings A–J, merge decisions M1–M5

## Standing rules for every batch

1. **Live app is the verifier, not a probe and not the JSX.** Three defects this
   month passed a unit suite, a probe render and an eyeball; a live walk caught
   all three.
2. **Measure computed values** before claiming a match. At 2× an 8px error is
   invisible.
3. **Re-census `boards.json` before calling a board missing** — a parallel lane
   regenerates it. `git log` it.
4. **Board sample data is not the contract.** The shape is.
5. **Read back every Figma write.** The API's success counter has lied before;
   `resize()` silently collapses auto-layout.
6. **Nothing is created without first searching for it** — by node id, by name,
   by user job. Duplication is the one failure this arc cannot ship.
7. A batch is done when its exit test passes, not when its frames exist.

## Batch order

Ordered by the brief's own priority: broken jobs first, polish last.

### B0 — close the gate (done)
Target file recorded here, in both audit docs, and in memory. No frames.

### B1–B5 — finish the tracing the audits admit is missing
§6 of the Phase 3/4 doc is explicit: five jobs were never traced end to end at
the depth J10/J11/J12 got. Their family counts agree, and "counts agree" is
exactly what Finding B was made of before it was withdrawn.

| Batch | Job | Exit test |
|---|---|---|
| B1 | J3 · Arrange elements and layers | every panel state and every context action walked live; deltas filed with node ids |
| B2 | J6 · Manage page structure | same |
| B3 | J7 · Preview responsive layouts | same |
| B4 | J13 · Resolve validation problems | same |
| B5 | J2 · Add content — the **authoring** half | same |

No frames are drawn in B1–B5. They exist to stop Phase 5 designing against
counts instead of flows.

### B6 — the founder batch (blocking, asked once, together)
Four open decisions gate later batches. They are asked in one message, not
drip-fed:

- **M3** — two `CreateComponentModal` (180-line for `ComponentsTab`, 260-line for
  `StudioModals`). One job, two implementations. Which is canonical?
- **M4** — `Publish · pre-checks` and `Publish · blocked`: one screen with two
  states, or two screens? Code currently implies one.
- **Finding E** — there is no `S4` in the flow spine. Was it merged, dropped, or
  never drawn? One sentence unblocks it.
- **Brand's four unbuilt rows** — Classes is Figma-only and stays unbuilt by rule
  4. Colour mode, Typography and Starters need a build/defer call each.

### B7+ — draw, one job at a time
For each job with a confirmed gap, in priority order:

1. Re-census the family; confirm the gap still exists.
2. Read a neighbouring board's node tree for the family's own conventions
   (padding, type ramp, footer shape) — never invent a convention.
3. Draw into the family's own column at the next free Y. Auto-layout, no
   `resize()` on a hugging frame.
4. Read back: node ids, geometry, text.
5. Screenshot; compare against the neighbour by eye.
6. Wire the prototype both ways — trigger → screen, and its exit back.
7. Log the frame in the change register.

### B8 — prototype completeness
Every added frame reachable from a flow start; every added frame has an exit. No
dead ends, no unexplained jumps. Verified by walking the prototype, not by
counting reactions — in-degree is not reachability.

### B9 — live validation
Every drawn screen reproduced in the running editor and compared. Mismatches are
fixed in whichever source is wrong, and the direction is recorded: behaviour
follows code, everything visual follows the board.

## What this plan will not do

- It will not touch the baseline lane's file. Two lanes, two files, by design.
- It will not implement Figma-only extensions (rule 4). They are preserved and
  documented as gaps: `Brand · classes`, History · Backups (7 boards),
  Preview · performance audit (4), scheduled-publish (4).
- It will not consolidate anything class-6 without the B6 answers.
