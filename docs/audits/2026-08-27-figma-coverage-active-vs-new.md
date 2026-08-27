# Figma coverage — is every screen's design complete, and what differs between ACTIVE and NEW

2026-08-27. Answers the founder's first two questions directly: *"kya her screen
ka design Figma ma codebase ka related complete hai ab? kuch miss to ni hai?"*
and *"active or new dono ka difference bhee check karna ho ga."*

Read from Figma, not from memory. The plugin tools were absent from the session
as usual, so this went through `scripts/baseline/figma-mcp.mjs` — the committed
JSON-RPC client over the login keychain's token.

## The two files

| | File | What it is | Size |
|---|---|---|---|
| **ACTIVE** | `Micuc1rmLcFhjxF1A08Kk2` page `75:2` | the as-built baseline, captured FROM the running app | **176 top-level frames** |
| **NEW** | `g4GzQFqzNYz5sosz1QtZXC` page `1:3` | the design target | **422 boards / 366 active / 34 families** |

**176 is not the ACTIVE screen count.** 83 of those frames carry a
`— SUPERSEDED <date> by <node>` marker in their own name — 47% of the page. A
census that counts frames counts dead ones, which is the trap already recorded
as `feedback_figma_census_resolves_dead_frames`. `scripts/baseline/inventory.json`
is the SSOT, and it puts the CURRENT editor coverage at **76 screens**
(65 `captured-current` + 4 `readback-verified`, plus the `editor-state` kind).

## Is anything missing? — 34 of 366 have no settled authority

By the `authority` field, over the 366 active boards:

| | Count |
|---|---|
| code-backed (`code:*`) | 239 |
| board is its own authority (`board:*`, `founder:*`, `scope:dashboard`) | 47 |
| walked live (`walked:2026-08-18`) | 46 |
| **OPEN decision** | **28** |
| **BLOCKED** | **6** |

**34 unsettled, and 22 of them are Brand** — one family holding two-thirds of
every open question in the file. The rest scatter: Layers 3, Review panel 2,
Templates 2, Modal 2, and one each in B9.5, S1 flows, Shell.

## ACTIVE vs NEW — 70 of 76 match, 6 do not

Matched the 76 current ACTIVE screens against all 366 NEW boards by state
wording. Six ACTIVE screens have no counterpart anywhere in the NEW file:

| ACTIVE screen | Verdict |
|---|---|
| `BL-0224 client-sign-off` | **REAL GAP — the important one.** See below. |
| `BL-0119 sitemenu-plugins` | **Real gap.** No Plugins board or family exists. |
| `BL-0120 sitemenu-invite-teammates` | **Real gap.** No invite/teammate board exists. |
| `BL-0118 sitemenu-design-system` | Not a gap. The destination is the Brand family (28 boards); the row that opens it lives inside `Shell / Site menu (⋯)`. |
| `BL-0182 experimental-rail-e3` | Not a gap, a decision — the redesign plan settles the rail IA and says to delete the other two. |
| `BL-0183 experimental-rail-legacy` | Same. |

### The client sign-off page has no board

`Review panel` has 13 boards and every one of them is the DESIGNER's panel —
`open`, `empty`, `load-error`, `re-sending`, `all-resolved`, `older-round`,
`detached-present`, `review-closed`, and the rest.

None of them is `/review/<token>`: the page the client actually opens.
`PRODUCT-OVERVIEW.md` calls it *"the only page in the product built for someone
who will never have an account"*, and it is the one screen in this product with
no design behind it.

That is worth stating plainly against the founder's own words. The complaint was
*"screens per client ko samajh nahi ati ka kya karna hai"* — and the screen
built for the client is the screen with no board.

## What this does not cover

- Whether each of the 366 boards AGREES with what the code renders. This is a
  coverage census: which screens have a design and how the two files differ.
  Per-board visual conformance is the twelve-family loop in
  `2026-08-25-editor-ui-redesign.md`, and it is not done.
- `opened-not-acted`, one CTA state, still has no live walk — its signal does
  not live on the review round, so it cannot be staged.

---

## Brand family loop — started 2026-08-27, and it found the order was wrong

### `open:status-pill-convention` — settled, one third built

Eight boards sat on this one authority. Read from Figma, the convention was
never open: a single Badge, x=16, height 20, in the band between the back row
and the first content row, one per screen. The wording is the boards' own —
"Bound to elements" (128px), "Unbound" (73px), "Draft preset" (89px), each width
corroborating its label.

Only "Draft preset" could be built. `bound`/`unbound` mean *applied to elements*,
and nothing in the product can answer that: elements carry no preset reference,
and `TokenUsageTracker` tracks TOKENS. Both moved to `design-ahead` /
`blocked:no-element-preset-reference`. Census is now 364 active / 32
design-ahead.

### `open:root-strips` — the code is ahead of the board, and I put it there

Board `152:2` (Brand · root) draws **nine List rows at 32px each**, starting
immediately under the 44px panel header. No preview strip. No swatches. No row
hints.

Measured live at 1440×900 after the R10 commit (`7573232b`):

| | Board `152:2` | Live | Δ |
|---|---|---|---|
| rows | 9 | 9 | — |
| row height | **32px** | **52px** | **+20 each** |
| preview strip | **absent** | 295 × 82 | **added** |

Nine rows twenty pixels taller, plus an 82px strip, is **262px** of extra height
in an 812px panel.

That work was right by the ledger (R10: "the design-system surface is a plain
text list with counts — no swatches, no type specimens") and by the founder's
brief. It is wrong by the process: the redesign loop in
`2026-08-25-editor-ui-redesign.md` is *draw the board, then implement to it*, and
this implemented first.

The census already knew. `152:2` carries `authority: open:root-strips` — the
open question on that board is literally whether the root gets strips. It is an
open DECISION, and it is the founder's, not mine.

**This is the blocker being raised**: whether an agent session may draw new
boards into `g4GzQFqzNYz5sosz1QtZXC`. Until that is answered, the Brand root
ships ahead of its board and this file records by how much.
