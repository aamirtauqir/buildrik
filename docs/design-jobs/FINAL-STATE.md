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

---

## 6. Second pass — the Criticals that were code-authoritative after all

Section 3 said the module interiors "are decisions". That was true of some and
**wrong about others**: of a 7-Critical sample re-tested against the code, five
had a determinate answer sitting in a shipped string, a component master, or a
feature flag. The pattern that produced §3's conclusion — treating a finding as
a decision without testing it — is the same one that produced four earlier
false "founder decisions".

| finding | what the code said | done |
|---|---|---|
| D-X-25 · ungated collab in ⌘⇧P | `StudioHeader.tsx:217` gates the CTA; the palette had no guard at all, and CLAUDE.md says the flag must never be on in production | command filtered out of the registry; 2 tests rewritten to assert **both** sides of the gate |
| D-X-09 · "Apply lands as one undo step" | false only on the agent path (`useAgentRunner.ts:280` applies one transaction per approved step). True at the other **two** call sites the agent never found | scoped the one false line, in code and on board `170:2` |
| D-C-46 · offline board | **refuted** — the board drew the pill and a disabled Publish. The real defect was worse: it read "Offline — **saved locally**", the exact wording `SaveStatus.tsx:50` rejects by name | fixed on the board **and at the component master** (`697:460`), which still carried it |
| D-B-01 / D-X-33 · Brand paywall | `DSModeContext` documents the mode as display-only; the shipped segments are "Beginner"/"Pro", not "Basic"/a plan | copy rebuilt from the shipped `DSModeToggle` hints, board renamed, and the upgrade-modal edge **moved** to `Templates · gallery` — the board that actually draws a "Pro" row |
| D-C-31 · save pill | **substantially refuted** — First run already drew "Unsaved changes", conflict drew "Conflict — reload". Of six shipped states, four were drawn, not one | the two genuinely missing states (`saving`, `error`) added as boards `2162:11660` / `2162:11838` |

### A number in §2 was wrong

**"loose / out-of-bounds / overlaps — 0 / 0 / 0" was measured with an instrument
that did not descend the tree.** A real check found **467** out-of-bounds
children. Classifying them dropped that to **116** real ones (bottom-only
overflow inside a clipping frame is a scroll region; `RETIRED` boards carry
their own explanation) — and 93 of those were one class: children still sized
for the 360px drawer, overflowing the 280px panel, visible in any screenshot of
the Templates gallery. Refitted across 11 boards, 30 changes, mostly by giving
the child `layoutSizingHorizontal = "FILL"` so the next width change cannot
reintroduce it.

Then the detector itself was wrong twice more, in the direction of inventing
work: it counted `hotspot/*` rows parked off-board on purpose (the file's own
convention), and it only exempted downward scroll, so a canvas scrolled down —
nav above the viewport — read as broken. With both corrected the count went
**467 → 116 → 79 → 11**, and the 11 were real: a detach-confirm modal clipping
100px off the sentence that explains what detaching costs, a Generate button
4px below its popover, a caption 5px below its panel. All fixed. The page now
reads **0 / 0 / 0 / 0 / 0** with 2,851 edges and no dangling destination —
`node scripts/figma/verify-invariants.mjs 1:3` prints `PASS`.

`scripts/figma/verify-invariants.mjs` is committed so this is checkable rather
than claimed. It found one regression I had just introduced — a menu glyph
shifted onto four timestamps — which is the argument for having it.

### Not fixed, and why

- **Text-on-text collisions**: a detector found 465 pairs, then 178 after making
  it ancestor-aware and excluding variant sets. Sampling showed the remainder is
  still dominated by false positives — an opaque drawer legitimately overlaying
  canvas text reads identically to a collision in a bounding-box test. Two real
  ones were found and fixed by eye. **The 178 is not a work queue**; publishing
  it as a defect count would repeat the mistake §3 warns about.
- **`Sent — waiting on your client`** still exists in `ReviewBar.tsx` and on no
  board, with no existing board copy to draw from. Unchanged: authoring it is
  writing product copy.
