# Where the Figma design stands, what the editor actually ships, and why it did not look professional

2026-08-29. Written against the census (`scripts/conformance/boards.json`),
the source, and a live 1440×900 walk with computed-style measurement — not
against memory.

## 1. What "the design" is, exactly

Two Figma files, and only one of them is the design we build to:

| File | Page | Role |
|---|---|---|
| `g4GzQFqzNYz5sosz1QtZXC` | `1:3` | **THE design.** 439 boards catalogued, 35 families. Everything below counts this file. |
| `Micuc1rmLcFhjxF1A08Kk2` | `75:2` | The OLD baseline. Historical record only; 83 of its frames are self-marked SUPERSEDED. |

Of the 439 rows: **355 active**, 41 design-ahead (drawn for capability we
have not built), 43 out-of-scope (superseded by a redraw, or another
product's screen). The design is therefore *complete as a drawing* — every
editor surface has a board — and the honest question is not "is Figma
finished" but "how much of it is proven in the running app".

## 2. How much is implemented — and how strongly we know it

The census records an `authority` per board, which is the evidence class:

| Evidence | Boards | What it means |
|---|---:|---|
| `walked:` | **49** | Driven live in the editor and eyeball-compared to its board. This is the only class that proves a screen. |
| `code:` | **262** | The state exists in code and was read there. NOT screenshot-verified. |
| `board:` | **39** | The board is the contract on a point where code and drawing differ. Most were closed in the 08-28 arc; each is now either fixed or explained. |
| `founder:` / `open:` | 5 | Founder calls (drill-in nav, no-templates-in-Insert) and two deferred features (section catalog, migration UI). |

**So: 100% drawn, ~100% built, 14% proven live.** That gap is the real
answer to "kitna implement hua" — the code exists almost everywhere; the
*proof* exists for 49 boards. Families with full live proof: Media (29/29),
S3 canvas (7/17), S5 review (3/23 + the gates), CmdK (2/7).

## 3. Why it did not look professional — measured, not felt

The cause was one thing wearing three costumes. The editor's type scale
defines seven steps (11/12/13/14/16/20/24). The running app was not using
it, and the gates could not see why, because **each gate only scanned one
spelling**:

| Spelling | Where | What was hiding there |
|---|---|---|
| `tw:text-[Npx]` class | TSX | the only form the first ratchet counted |
| `font: 500 9.5px …` | **stylesheets** | 63 rules — the inspector, settings, layers, pages |
| `fontSize: 10` | **inline style objects** | 47 sites |

Surveyed live with `getComputedStyle`, the inspector was rendering **49 runs
of 9.5px text**. Nine-and-a-half pixels is below every readable floor; a
panel full of it reads as cramped and unfinished no matter how correct the
layout is. Beside it sat 9px, 10px, 10.5px, 11.5px, 12.5px, and an 18/28/32
tail at the top end.

**Fixed:** everything snapped onto the scale (sub-11 → 11, half-pixels →
12/13, 18/28/32 → 16/24). Live re-measure: the inspector now reads
**11/12/13/16 and nothing else**.

**And one real defect surfaced on the way**: `.bdi-sec-preview` shipped as an
EMPTY CSS rule while the comment above it described exactly what it should
do. Every collapsed inspector section — 34 of them — drew its value readout
("16px · solid") at the panel's default 13px ink, flush against the chevron.
It is mono, muted and truncating now, as its own comment always said.

## 4. What now guards it

`gate:design-debt-ratchet` (in `verify:ds`) holds **five populations at
zero**, each negative-tested by planting a violation and watching it fail:

1. off-brand Tailwind blues (`#1D4ED8` beside the accent `#1A56DB`) — 109 → 0
2. Tailwind gray palette classes — 470 → 0 (the generated `--bk-gray-*` scale
   existed all along; only the semantic ink names had been grepped)
3. the ghost-link recipe — 44 → 0 (`variant="link"`, one definition)
4. off-scale sizes in TSX, **all three spellings** — 47 → 0
5. off-scale sizes in stylesheets — 63 → 0

## 5. What is left, and what it would take

**Not a look problem any more — a proof problem.** The work that remains is
ranked by what it buys:

1. **Live-walk the 262 `code:` boards** (the real gap). At the 08-28 rate —
   16 states per pass, ~9 fixes found per 16 — that is roughly 16 passes and
   would surface an estimated 100-150 small drifts. This is the single
   highest-value thing left, and it is the only way "implemented" becomes
   "proven".
2. **Families with zero live proof and high traffic**: Brand (22 boards),
   Inspector (20), Layers (17), History (16), Content (15), Settings (15).
   Start here — they are where a designer spends the day.
3. **Two deferred features** the founder parked: the Templates section
   catalog (641:2487) and the migration UI (B9.5 433:2391).
4. **Publish** stays out of scope by the 2026-08-25 call; its 12 boards are
   built but cannot be proven without a real Vercel deploy.

Nothing on this list is a blocker for using the editor. They are the
difference between "we believe it matches" and "we watched it match".
