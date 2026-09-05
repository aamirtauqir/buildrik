# Workflow audit — can the user finish the job?

Sixteen module agents, one per module, walked every screen on page `1:3` against
four questions in order: **trace the job end to end · dead controls · missing
fields · missing screens.** 538 findings, 0 malformed.

| | |
|---|---|
| Critical | **106** |
| Major | 285 |
| Minor | 121 |
| Polish | 26 |

By kind: dead-control 156 · missing-field 140 · missing-screen 125 · flow-gap 117.

---

## 1. The pattern the audit found

It is not 538 unrelated defects. **The same shape appears in five separate
lifecycles**: the decision is drawn, the outcome is drawn, and nothing connects
the click to its result.

| lifecycle | producer | outcomes | connected? |
|---|---|---|---|
| Publish | `784:4250 publishing` | `live`, `failed` both drawn | **no** — each has in=1, and that inbound is a reviewer state-chip, not a flow edge |
| Save | `2162:11660 Saving` | `Save failed` drawn | **no** — both in-degree 0 file-wide |
| Conflict | `66:640` | three outcomes drawn as text | **no** — all three fall through the board's catch-all to `199:2` |
| Exit | ‹ Exit on 16 of 17 boards | guard drawn | **inverted** — the guard's only inbound came from the screen you reach *after* leaving |
| Settings save | five "Save changes" | failure drawn 5×, success **0×** | no success state exists on any of 45 boards |

The file already contains the worked counter-example — History's
`restore-confirm → restoring → restored / restore-failed` — so the fix has a
model inside the file.

## 2. Fixed this pass

| fix | before | after |
|---|---|---|
| **Topbar controls** — master `681:27` was `rx=0` on every control, so no instance could inherit an edge | exit guard in-degree **1**, from the screen *after* leaving | **75**; notifications 7 → **83**; site menu 4 → **79** (224 edges on 76 boards) |
| **Brand root rows** — all nine hotspots sat exactly 96px above the rows they name, so a click on Tokens landed in Starters | 0 of 9 rows reached their own destination | **9 of 9 aligned** |
| **Brand state hotspots** parked at y=820 on an 812-tall board | 3 unreachable | re-seated inside |
| **Collection creation** — the wizard's only inbound came from a screen you reach once you *already own* a collection | wizard in-degree **1** | **4** |
| Prototype edges, page-wide | 2,851 | **3,077**, 0 dangling |

`node scripts/figma/verify-invariants.mjs 1:3` prints **PASS** — 0 loose, 0
overlaps, 0 out-of-bounds, 0 dangling.

## 3. The instrument was wrong three times

The dead-control census I handed the agents had **three** blind spots, each
found by an agent and each fixed:

1. **Matched NAMES** (`btn/`, `Button`, `cta`). Publish and AI name their button
   frames `Frame`; it returned **0** for both whole sections, and both agents
   swept by hand. → v2 detects by SHAPE.
2. **Counted a board-level catch-all as "wired"**, hiding every control on such a
   board — including a Settings "Save changes" that lands outside Settings.
3. **The fix for (2) was itself wrong**: I seeded `wired=false`, but the first
   loop iteration is the board, so the OR put its reaction straight back in.
   Same false negative, opposite mechanism. The frame-level catch-all is this
   file's dominant convention — 16 of 20 Shell boards, 5 of 6 Notifications — so
   the totals were drawn only from boards that happened to lack one.

Corrected census: **1,343 candidates across 306 boards**, from 72.
`findings/DEAD-CONTROLS-V2.txt`.

**A detector needs a positive control.** v2 was validated by reproducing, from
shape alone, the exact nodes the Publish agent had found by hand.

## 4. Agents corrected the record, and each other

- **D-C-31 / D-C-46 refuted** by measurement — first-run already drew "Unsaved
  changes", conflict drew "Conflict — reload", the offline board did draw its pill.
- **Five "missing" S-numbers exist**, in other sections — the Journeys agent
  checked before filing, as instructed, and dropped them.
- **`theme.*` is not dead server code**: the Brand root's own strip says *"The
  brand syncs from your workspace shared theme"*, so the four uncalled procedures
  mean the sentence is false, not the API surplus. That flipped my W-CO-01.
- The Publish agent's first inbound scan returned 0-for-everything and it
  reported that as **its own harness bug** (`PAGE` missing from its container
  set), not a finding.

## 5. What is not done

- The 106 Criticals are a queue, not a verdict — four of five estimates tested in
  the previous arc were wrong in the direction of looking easier than they were.
- No agent ran the live app. Every claim is a board fetch or a `file:line` read.
- Craft, contrast and token conformance were explicitly out of scope here.

---

## 6. Adversarial verification — closed

Four verifiers attacked the 106 Criticals with one instruction: **refute them.**

| | |
|---|---|
| CONFIRMED | 78 |
| CONFIRMED, already fixed this pass | 5 |
| PARTIAL | 24 |
| REFUTED | 4 |
| **total verdicts** | **111** |

(Counted from `findings/VERDICTS-W.jsonl`, not from the agents' own summaries —
the first draft of this table said 87/23/2 because I added up what four agents
each reported rather than reading the file they wrote.)

**The refutations and partials are the output that mattered**, and six of them
landed on work of mine.

### The thesis survived its own attack

I asked a verifier to kill §1 by showing that reaching an outcome through a
hotspot chip IS the file's convention. It measured the opposite, decisively: the
file uses **two** names and uses them consistently —

- **386 `hotspot/state`** — reviewer chips, parked on hub and root boards.
- **36 `hotspot/alt`** — an alternate-**outcome** edge, carried **on the producer**.

History's restore chain is wired with real controls plus `hotspot/alt` on the
producer. Publish's outcomes were reached only by state chips on a *different*
board. The convention defence fails and the thesis stands — in a sharper form
than filed: the producer `784:4250` **is** properly reached (2 real inbound
edges), so the gap is **purely downstream**, and it was a two-edge fix.

### What the verifiers took away from me

- **W-J-02 REFUTED on the board's own name** — `Insert · dragging —
  CONDITION-ONLY — leaves on drop/dragend, no control`. Zero reactions is intent.
- **W-I-01/32 PARTIAL — my own supplied premise was false.** The three pill
  dropdowns are *not* the only door to four boarded states; all four are reachable
  via a walk chain. The undrawn menus are real; the ranking rationale was not.
- **W-G-03 REFUTED, and I had been closer to right than the module agent.** The
  `theme` router *is* called — from the dashboard (`theme-manager.tsx`), which
  the agent never searched. The narrow residual survives: the push carries
  StyleEngine CSS while this panel's 14 registries persist elsewhere.
- **W-E-16, W-N-20 PARTIAL on board names** — the approved end-state and the
  re-send surface both exist; their names carry the decision. Not missing screens.
- **W-N-01 PARTIAL** — the supersede sweep only touches *tokened* rounds, so an
  internally-approved round does still yield a snapshot. The absolute claim died;
  the ungated doors survived.
- **W-P-01, W-H-07 PARTIAL** — each contradicted by its own evidence line.

### What the verifiers took away from my hands specifically

- The Topbar set has **six variants**; I matched one and missed **28 of 104
  instances**, including the file's named ENTRY POINT and every `Publish=ready`
  board. Fixed: exit guard in-degree **1 → 75 → 103**.
- My two new publish hotspots used the **wrong convention name** — outcome edges
  on a producer are `alt`, not `state`.
- I re-seated Brand's hotspots by Y and left X, because **my own detector flagged
  right-overhang and my writer only ever moved `c.y`**.
- **`verify-invariants.mjs` skipped every hotspot**, so its `PASS` was silent on
  that entire class. Earlier PASS claims in this session partly rested on a blind
  checker. Honest count now reported.

### Settled after two sessions

`"Sent — waiting on your client"` (`ReviewBar.tsx:131`) is **drawn on no board**.
0 hits across **14,396** TEXT nodes on page `1:3` and 352 on `1:6` — with a
positive control proving instance subtrees were traversed (3,322 of the 14,396
sit inside instances and were returned). It exists in code only.

## 7. Left undone on purpose

**110 hotspots on 48 clipping boards, 104 with zero board intersection.** The
premise that a clipped hotspot is un-hittable *in the prototype player* is mine,
and the verifier said plainly it did not check it. On canvas review none of it is
a defect. Moving them costs 79 visible annotation labels. That is a question for
the founder, not a queue — `W-CO-12`, with the one board to test it on.
