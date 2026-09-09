# V2 → V1 — the 13 `manual-draw` rows

**Page `1:3` "🖥️ Editor v1", 2026-09-07.** These are the rows the queue applier
excludes on purpose, because each spec is a sentence rather than a machine row.

**All 13 are drawn.** Every number below is a read-back — the value Figma
returned after the write, in the same call — not a value from a plan.

| | |
|---|---|
| rows drawn | **13 of 13** |
| Figma MCP calls spent | **7** of the 20 allowed |
| nodes created | 10 annotations + 2 checklist rows (10 child nodes) = **22** |
| nodes edited in place | 1 text (`914:4526`), 1 hidden button (`784:4517`), 4 toolbar frames |
| invariants | loose 77 → **77** · section overlaps 2 → **2** · board overlaps 0 → **0** · dangling 0 → **0** · OOB 2 → **4**, neither of the two new ones on a board this pass touched (§Invariants) |

---

## The row table

| row key | board | what was drawn | node ids created | read-back | `shift` performed |
|---|---|---|---|---|---|
| `brand-06-vis-defects#2` (VIS-3-30) | `642:2832` Templates · applying → frame `642:2928` | The floating canvas toolbar grew to fit the second row it already wraps onto. | none — `642:2928` resized in place | `760x40 at 0,740`, content spanned `-8..48` (8px proud top **and** bottom) → **`760x72 at 0,708`, content `8..64`**, bottom edge held at 780 | n/a — no shift row |
| ↳ same fix, 3 sibling boards | `642:2556`/`642:2652`, `807:4299`/`807:4330`, `807:6694`/`807:6778` | Identical defect, identical fix. | none | `760x40→760x72 @0,708`; `800x40→800x72 @0,683`; `760x40→760x72 @0,683` — all three content `8..64`, all three bottom edges held | n/a |
| `publish-structure#0` (UX-E-27) | `784:4326` Publish · published (this session) | TEXT 10/Regular `#6B7280` w248 — "Disabled: no changes since v15. Edit a page, or republish anyway." | **`2863:12408`** | `248x24 @16,702`, 0 inked nodes intersected | n/a |
| `publish-structure#1` (UX-E-27) | `781:4489` Publish · load-error | TEXT 10/Regular `#6B7280` w248 — "Disabled because the deploy service did not answer — not because there is nothing to send." | **`2863:12409`** | `248x24 @16,736`, 0 intersections | n/a |
| `publish-structure#2` (UX-E-27, QA-C-17) | `778:4238` Publish · loading | TEXT 10/Regular `#6B7280` w248 — "Checks still loading. The shipping panel leaves this button LIVE (PublishTab.tsx:710 does not gate on loading)." | **`2863:12410`** | `248x36 @16,724`, 0 intersections | n/a |
| `publish-structure#3` (UX-E-09) | `784:4250` Publish · publishing | TEXT 11/Medium `#1A56DB` — "Cancel", right of the progress track | **`2863:12411`** | `37x13 @208,150`, 0 intersections | n/a |
| `publish-structure#4` (UX-E-09) | `784:4250` Publish · publishing | TEXT 10/Regular `#C27803` w248 — the cancel-scope note, in the spacer band | **`2863:12412`** | `248x60 @16,280`, 0 intersections | n/a |
| `publish-structure#5` (UX-E-29) | `641:2652` Publish · panel | TEXT 11/Medium `#1A56DB` — "All versions ›", in spacer `641:2705`, clear of the `641:2704` timestamp | **`2863:12413`** | `68x13 @16,360`, 0 intersections | n/a |
| `publish-structure#6` (UX-E-04) | `784:4480` Publish · unavailable (feature off) | Hid the footer's primary — the Connect-Vercel door that must not exist on this state. | none — `784:4517` hidden, not removed | **`784:4517 'Button · primary' visible=false`** | n/a — ran after the `no Vercel connection` clone, per the ordering constraint |
| `publish-structure#7` (UX-E-04) | `784:4480` Publish · unavailable (feature off) | TEXT 11/Regular `#6B7280` w248 — "Nothing on this screen can turn it on.", in the band the hidden button vacated | **`2863:12414`** | `248x13 @16,776`, 0 intersections | n/a |
| `publish-structure#8` (UX-E-25) | `784:4403` Publish · failed | TEXT 10/Regular `#C27803` w248 — the ALREADY_PUBLISHING note, in spacer `784:4438` | **`2863:12415`** | `248x48 @16,300`, 0 intersections | n/a |
| `publish-structure#9` (UX-E-06) | `833:4518` Publish · pre-checks | FRAME 520x36 at y=321: ✕ 10/Medium `#E02424` in a 20x20 box at 24,8 · "Client approval" 12/Regular `#111827` at 54,10 · "Waiting on Sara" 10/Regular `#4B5563` right-aligned to 463 · "Open" 10/Medium `#1A56DB` right-aligned to 496 | **`2863:12416`** (box `2863:12417`, ✕ `2863:12418`, label `2863:12419`, detail `2863:12420`, action `2863:12421`) | row `520x36 @0,321`; divider `833:4577` **321→357**, band `833:4579` **322→358**, divider `833:4581` **378→414**, footer `833:4582` **379→415**; content ends **flush at 475** | **YES — but not the way the row describes it.** See §The shift below |
| `publish-structure#10` (UX-E-06) | `893:4518` Publish · pre-checks · blocked | Same row. | **`2863:12422`** (`…12423` box, `…12424` ✕, `…12425` label, `…12426` detail, `…12427` action) | row `520x36 @0,321`; `893:4569` **321→357**, `893:4570` **322→358**, `893:4573` **378→414**, `893:4574` **379→415**; content ends flush at 475 | **YES**, same mechanism |
| `publish-structure#11` (UX-E-23) | `914:4507` Publish · Confirm → text `914:4526` | Edited in place: `WIDTH_AND_HEIGHT`, then x = 496 − width so the longer string grows LEFT off the board's 496 gutter. | none — `914:4526` edited | **`"3 pages + 12 generated from Blog"` @x=285 w=211, right edge = 496** (was "3 pages" @x=446 w=50) | n/a |

---

## The shift — it was real, and the row described it wrongly

The two `shift` rows read *"every child with y >= 321 moves +36 … board 520x439 →
520x475"*. Both halves of that were false at this HEAD, and the difference is not
cosmetic — following it literally produces a board that is silently half-built.

**The board was already 475.** Something earlier in this arc resized it without
shifting anything, so its divider still sat at 321 with 36px of dead space at the
bottom. Height was therefore *not* evidence that the room had been made — a
resize-with-no-shift and a completed shift are indistinguishable from the number
alone. `apply-publish-v2.mjs`'s guard (which I had written as `height >= 475 →
skip the shift`) read exactly that ambiguous number, skipped, and left the new row
lying on top of the divider. The write returned `OK`. Only dumping the board's
children in the same call showed it.

**And `c.y = c.y + 36` cannot move those children anyway.** The pre-checks boards
are **VERTICAL auto-layout stacks**, `itemSpacing=0`, `primaryAxisSizingMode=FIXED`
— the child y values are `0+56, 56+1, 57+48, 105, 141, 177, 213, 249, 285, 321+1,
322+56, 378+1, 379+60`, ending at 439 inside a 475 board. All eight `move` writes
were accepted and discarded, reading back unchanged, because a flow child's
position belongs to its parent. The row only stayed at 321 at all because
`apply-publish-v2.mjs` now sets `layoutPositioning="ABSOLUTE"` — which is what
parked it *on top of* the divider rather than appending it to the end of the stack.

**The stack is the fix.** 36px of dead space is exactly one row, so seating the
row as a **flow child immediately before the divider** makes auto-layout perform
the shift itself. Nothing is resized, no sibling is moved by hand, and the board's
content now ends flush on its 475 bottom edge. `scripts/figma/seat-precheck-row.mjs`
does this; it searches the insert index rather than assuming one (`insertChild`
interprets its index after the moved child is spliced out) and verifies `y===321`
before reporting `OK`.

**Corrected wording for the two rows, if the queue is ever re-run:** *the boards
are already 520x475 and are vertical auto-layout; seat the row as a flow child
before the divider and the stack shifts the divider/band/footer itself. Do not
resize, do not set child y.*

---

## The copy rule

`v2/cancel-scope` (`2863:12412`) honours the standing prohibition rather than
brushing past it. It does **not** say a cancelled publish deployed nothing; it
says the opposite, and names why: *"publish.service.ts:414 permits QUEUED and
BUILDING only, and no worker step re-checks across runVercelDeploy
(route.ts:374-387) — a late cancel does not stop the deploy."* No board in this
pass carries a "nothing was deployed" claim.

---

## Three checks beyond the write

**1. The notes were clamped off their own footers.** Each of the three UX-E-27
notes was specified at a fixed `y=740`. Two of the three would have printed across
the panel footer from there — the strings are 2 and 3 lines at 10px, and one board
(`784:4326`) has a taller footer starting at 730, not 764. The clamp measures each
board's own footer top and seats the note 4px above it, which is why they landed at
702 / 736 / 724 instead of 740. Reported per row in the apply output.

**2. Nothing overprints.** All seven annotated Publish boards are also VERTICAL
auto-layout, so every annotation is an absolute child at a hard-coded y — the same
shape of placement that failed on the pre-checks boards, where the write and the
node's own read-back both agreed while the node sat on a divider.
`scripts/figma/verify-publish-annotations.mjs` therefore asks the other question:
what inked content does each `v2/*` box actually intersect? **10 of 10 annotations
intersect 0 inked nodes.**

**3. The seventh row sits in the rhythm of the six the server does measure.** The
existing checks are 36-tall frames at y=105/141/177/213/249/285; the new row is
36-tall at 321, and its icon box (24, w20), label (x54), right-aligned detail (463)
and right-aligned action (496) copy the row geometry named in the spec.

---

## Invariants

`node scripts/figma/verify-invariants.mjs`, run after every write above:

| class | pre (`INVARIANTS-PRE.md`) | now | verdict |
|---|---|---|---|
| loose nodes on page | 77 | **77** | unchanged |
| section overlaps | 2 | **2** | unchanged |
| board overlaps | 0 | **0** | unchanged |
| dangling prototype edges | 0 of 3217 | **0 of 3354** | unchanged |
| out-of-bounds children | 2 | **4** | **+2, not from this pass** |

The two recorded pre-existing OOB are both still exactly themselves: `163:113`
History · Saves · time-travel ← `I229:1140;9:7 'Button'`, and `1719:8421`
Ecommerce · bound · inspector. The two extra are `2854:21613` and `2854:21676`,
both named `[design-ahead] History · S…`, each failing on `I2854:21623;9:7 'Button'`
/ `I2854:21686;9:7 'Button'` — the same instance child as `163:113`, i.e. clones of
that board which inherited its pre-existing defect.

They are not this pass's:

- This pass touched 14 nodes, named exhaustively in the table above. **No History
  board is among them, and this pass created no board at all** — only children
  inside existing boards.
- `verify-invariants` reports 4 affected boards at 1 each, and names all four.
  None is a board this pass wrote to.
- The new boards' ids sit in the `2854:*` block; every node this session created
  is in `2863:*`. They predate my first write.
- The page also stands at 992 boards and 3354 edges against the 982 / 3327 recorded
  in `OUTCOME.md`, so ten boards and 27 edges arrived from another session between
  that snapshot and this one.

**What I did NOT verify:** I did not open those two boards to confirm the clone
provenance — the shared instance-child id is strong evidence, not a read. It would
have cost a call to prove something this pass did not cause.

---

## Re-running is safe

All three scripts are idempotent and decide from measurement, not from a flag:

- `apply-publish-v2.mjs` — every node it makes is named `v2/<key>` and removed
  before being recreated.
- `seat-precheck-row.mjs` — a row already seated as a flow child at 321 with the
  divider below it reports `SAME` and is left alone.
- `fix-toolbar-height.mjs` — a toolbar whose content already fits reports `SAME`
  and is not touched; the height is derived from the measured content span (8px
  padding above and below, snapped to the 4px grid), not transcribed. VIS-3-30's
  own arithmetic does not close — it says "shift children down 16" and then "row-2
  y20 → y44" (which is +24), and "h40 → h80" with "content spans 8..72" (which is
  64px of content, not the 56 it measured). Measurement won: 56 + 8 + 8 = 72.

The rows are **not** marked in `queue-state.json`. That file is `apply-queue.mjs`'s
ledger and these rows never pass through it; writing applier state for an applier
that did not run would put a false record in the one file the next pass trusts.

## Files

| file | what |
|---|---|
| `scripts/figma/apply-publish-v2.mjs` | pre-existing, hardened here: absolute positioning on auto-layout boards, footer clamp on the three notes, null guards so one stale id cannot discard the read-back for writes that landed, and a child dump of `833:4518` — which is the check that caught the row lying on the divider |
| `scripts/figma/seat-precheck-row.mjs` | new — seats the seventh row in the auto-layout stack; carries the corrected account of the `shift` |
| `scripts/figma/fix-toolbar-height.mjs` | new — measures the wrapped content and grows the toolbar to fit it, on either the auto-layout or the absolute branch, bottom edge preserved |
| `scripts/figma/verify-publish-annotations.mjs` | new, read-only — what does each annotation actually sit on top of |
