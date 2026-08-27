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
