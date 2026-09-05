# Design-system unification — final state

Two things this document separates, because conflating them is how a design
audit becomes a to-do list nobody trusts: **what was reviewed** (complete) and
**what was resolved** (partial, with the reason for each remainder).

---

## 1. Review coverage — complete

Every page in the file was walked, every screen given a verdict against the
user's mental model before any craft critique.

| page | screens | audited by |
|---|---|---|
| `1:3` 🖥️ Editor | 27 sections / 898 children | waves A–G, 7 agents |
| `1:2` 🧩 Components | 93 | agent I |
| `1:4` 🗔 Site | 113 | agent J |
| `1:5` 🏢 Portfolio | 70 | agent K |
| `1:6` 👤 Client review | 50 | agent H |
| `397:2` + `988:2` Dashboard | 229 | agent L |
| `1:7` 🗃️ Archive | 159 | coordinator — 158 of 159 carry a supersession marker; correctly an archive |
| `0:1` 📕 Foundations | 2 | coordinator — the root spec sheet |
| `500:2` / `510:2` | 7 | coordinator — foreign UI kits, renamed to ARCHIVE |

**635 findings across 66 modules** — 112 Critical, 351 Major, 146 Minor, 20
Polish. **261 were independently re-verified** by two separate verifier agents
plus codex: 242 confirmed, 16 refuted, 3 unsupported.

The refutations matter as much as the confirmations. Six findings — including
two of the coordinator's own — were withdrawn under checking, and the reasons
are recorded next to them.

---

## 2. Resolved — shared chrome

Measured before and after, every change rendered either side.

| | before | after |
|---|---|---|
| hand-drawn chrome copies (rail, Settings nav, client bars, panel headers) | **766** | **0** |
| boards with a fully wired rail | 53 | **99 of 99** |
| drawer sizes | 4 | **1** (177 boards, 15 modules) |
| off-token accent `#1c64f2` | 161 nodes | **0** |
| type-style binding | 40.6% | **60.1%** |
| topbar save states in use | 0 of 9 | 10 boards corrected |
| text at 1.00:1 contrast | 8 | **0** |
| loose nodes / out-of-bounds / overlaps | — | **0 / 0 / 0** |
| prototype edges | 2,489 | **2,833**, none dangling |

Components built: `Rail` (7 variants), `Settings nav row` (2), `Panel header`
(3), and four client-review chrome sets.

---

## 3. Not resolved — and why each one is a decision

The module interiors remain. That is not effort outstanding; it is **eight
pilots, one success**, and every failure was specific.

| attempted | result |
|---|---|
| Radio adoption | **worked** — done |
| Slider adoption | the knob position *is* the value, and `relative-transform` is not overridable. A swap rewrote a board's "Opacity 100" to 62 |
| Row adoption | its Label carries no depth. All 369 candidates are tree rows — 41 groups, zero flat lists. A swap flattened the hierarchy |
| Status dot adoption | five status colours vs local `#d1d5db` / `#1a56db`. A different object sharing a shape |
| bulk contrast fix | three false-positive classes; a board the detector called broken renders perfectly |
| group-label binding | 718 was really 278; of 34 tracking-only candidates, 28 would clip |
| 360→280 drawers | naive resize destroyed controls — then **solved** by re-anchoring right insets |
| copy conflicts | governance: CLAUDE.md says the board owns copy, and the code changed it deliberately |

**Four of five estimates tested were wrong in the direction of looking easier
than they were.** Treating the audit's remaining numbers as a work queue would
repeat those failures at scale.

---

## 4. What unblocks the rest

`DECISIONS-OPEN.md` holds eleven items, each reduced to one question with its
number attached and, where tested, the evidence that the obvious answer is
wrong. Three of them are unusually cheap relative to what they unlock:

1. **"Code leads on copy" — one line in CLAUDE.md.** About a dozen boards follow
   mechanically, and a share of the remaining Criticals stop being defects.
2. **Section-header tracking: `+8%` or `+0.5px`.** Settles 278 group labels.
3. **A `Depth` axis on `Row`, a value property on `Slider`.** Converts two dead
   components into ~400 adoptable nodes.

---

## 5. The honest verdict

The final QA agent's words still hold: **one product wherever the shell is
drawn, and separate screens elsewhere.** The shell is now drawn everywhere it
should be, from components, with zero duplication and no lost wiring.

The interiors need decisions this session could measure but not make.
