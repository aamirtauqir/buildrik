# Autoplan — editor Figma board arc

**Restated goal (founder, 2026-09-04).** Implement every editor Figma board in
the codebase, using multiple agents: some implementing, some testing and
following up on what is done and what remains. Target **80–90%**. Do not stop
until every board is implemented — **except where the codebase is ahead of the
design. There, do not implement: record why and take another board.**

## The two rules, in the order they bind

1. **Build to the board.** Behaviour follows the CODE contract (Zod schemas,
   service returns). Everything visual — layout, colour, type, on-screen copy —
   follows the BOARD. Sample data ("Bella Cucina", "3 open") is never copied
   literally; the SHAPE is the contract.
2. **Skip when the code is ahead.** A board drawing a state the product cannot
   produce, or a worse version of something already built, is not implemented.
   It is marked with one sentence of evidence and the agent moves on. This is a
   good outcome and the founder said so explicitly.

## The arithmetic

Percentage = `(done + verify) ÷ rows that are not unbuildable/fix-figma`.

| | rows |
|---|---|
| J- board jobs | 491 |
| excluded: unbuildable + fix-figma | 54 |
| **implement scope** | **437** |
| done + verify | 337 |
| **complete** | **77.1%** |

To reach 80% close **12** rows; 85% needs **34**; 90% needs **56**. There are
**96 open buildable rows**, so the target is reachable without touching a
single exclusion.

**The quoted figure was 78.7% and it was wrong.** Nine rows sat outside the
denominator with no reason recorded in any field. An exclusion nobody has to
justify flatters every percentage above it, so they went back in; four were
then measured live and reach populated surfaces. A further 27 carried their
reason in the NAME (`[design-ahead]`, `[not-implemented]`) where an evidence
sweep could not see it — those keep the exclusion and now say why in the field
that gets read.

## Wave plan

Six implementer lanes, split by family so no two agents touch one file, each in
its own git worktree; plus an auditor measuring whether the number itself is
true.

| lane | families | rows |
|---|---|---|
| A | S5 flows, Orphan comments | 13 |
| B | Inspector, Compare, Modal | 14 |
| C | Media, Content | 13 |
| D | S3 flows, Insert, Layers | 14 |
| E | S1 flows, Pages, Templates | 21 |
| F | Brand, Shell states, Shell, History, AI, S7, B9.1 | 21 |
| audit | a spread sample of rows already counted as `verify` | 12–16 |

The auditor exists because `verify` and `done` count the same in the figure
above. If `verify` does not hold up under measurement, 77.1% is inflated and
the founder is being told something false. That answer is worth more than any
single row.

## What makes a row closeable

`done` means observed in the running app at 1440×900 — not a probe render, not
the JSX, not a green unit suite. All three have passed over a broken feature in
this repo. Measure with `getComputedStyle`/`getBoundingClientRect`: at 2× a
screenshot hides an 8px error.

Every agent commits per row, path-scoped, behind `tsc && vitest && verify:ds`.
A chain that prints failures and commits anyway has put red code on main twice
in one day; the check must be something the commit is *behind*.
