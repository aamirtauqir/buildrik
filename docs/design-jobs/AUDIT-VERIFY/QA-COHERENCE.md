# QA — did any repair break the board it repaired?

Reconstructed on paper from `b*.tsv` (pre-edit geometry, dumped after 18:29),
`fix-queue.json` (the authors' arithmetic), `fix-queue-state.json` (the ledger's
post-write read-backs) and `scripts/figma/apply-queue.mjs` (what each op actually
does). **Zero Figma calls were made.**

100 rows landed: 95 `OK`, 5 `SAME`, **0 `DRIFT`, 0 `REFUSED`, 0 `MISSING`**.
Every read-back detail was diffed against its row's target — all 100 match
(the two apparent text mismatches are the ledger truncating a two-line string at
its newline; `status:OK` is only emitted when `back===want`, so both are exact).

## What `SAME` means here, and why it is the strongest evidence in the ledger

`apply-queue.mjs:167` emits `SAME` when the node **already holds the target size
at write time**. The batches ran in this order:

| 15:04:22 | 15:09:44 | 15:15:00 | 15:17:45 | 15:20:23 | 15:25:38 |
|---|---|---|---|---|---|
| text ×12 | delete ×40 | resize ×25 | rename ×6 | add-text ×1 | move ×16 |

So every compensating resize was measured **after** the hides and text rewrites it
was compensating for. A `SAME` on a compensation row is not a no-op that got
skipped — it is Figma independently arriving at the number the author computed by
hand. Five rows did this, and each one confirms a different structural fact:

- `c1-clones#6` → `440x117`: modal `2850:22371` **hugs** vertically; the author's
  `202 − 85 = 117` was right to the pixel.
- `c1-clones#14` → `300x95`, `c1-clones#15` → `624x95`: `2881:12616` and
  `2881:12608` both hug; the +15 from the two-line body and the −324 from the
  collapsed `result-clean` slot both landed exactly as computed.
- `c2-clipping#30` → `440x229`: bulk modal `1175:4827` hugs; `214 + 15 = 229`.
- `c5-c6-c7#9` → `280x564`: spacer `641:2595` **is a fill child** and had already
  absorbed the 92px the three hidden rows released. The author wrote "if it is a
  layoutGrow/FILL child it will absorb the 92 by itself and this row reports SAME"
  — it did.

## 1. Grow / shrink pairs — every pair both landed

| # | Board | The grow (or collapse) | The compensation | Both in ledger? | Net board Δ |
|---|---|---|---|---|---|
| 1 | `163:2` History · Saves · changes | `163:44` Prune note 40→64 — `c2-clipping#12` **OK 280x64** | `163:43` spacer 340→316 — `c2-clipping#11` **OK 280x316** | **YES** | 0 |
| 2 | `2854:12294` restore-confirm | `2854:12327` 40→64 — `c2-clipping#14` **OK** | `2854:12326` 194→170 — `c2-clipping#13` **OK** | **YES** | 0 |
| 3 | `2854:21739` start-of-history | `2854:21772` 40→64 — `c2-clipping#16` **OK** | `2854:21771` 182→158 — `c2-clipping#15` **OK** | **YES** | 0 |
| 4 | `2854:21814` clear-confirm | `2854:21847` 40→64 — `c2-clipping#18` **OK** | `2854:21846` 90→66 — `c2-clipping#17` **OK** | **YES** | 0 |
| 5 | `2854:21854` undo-unavailable | `2854:21887` 40→64 — `c2-clipping#20` **OK** | `2854:21886` 238→214 — `c2-clipping#19` **OK** | **YES** | 0 |
| 6 | `641:2546` Components · library | 3 frames hidden, −92 (`c5#6/7/8` **OK**) | `641:2595` spacer 472→564 — `c5#9` **SAME** (fill child already absorbed it) | **YES** | 0 |
| 7 | `2850:22371` Media delete-confirm | 3 nodes hidden, −85 (`c1#3/4/5` **OK**) | board 202→117 — `c1#6` **SAME** (hug) | **YES** | −85 ⚠ see §3 |
| 8 | `2881:12608` / `:12616` replace-across | body 15→30 (`c1#10` **OK**); `result-clean` hidden, −324w (`c1#9` **OK**) | `2881:12616` →300x95 (`c1#14` **SAME**), `2881:12608` →624x95 (`c1#15` **SAME**) | **YES** | −324w / +15h |
| 9 | `1175:4827` bulk delete-confirm | `1175:4830` →388w (`c2#28` **OK 388x26**), `1175:4829` 25→40 (`c2#29` **OK**) | board 214→229 (`c2#30` **SAME**, hug) | **YES** | +15 |
| 10 | `2850:21560` Add Child · refused | new `inline-error` band +40 (`c1#16` **OK 348x40 @16,221**) | board 225→277 (`c1#17` **OK**) | **YES** | +52 |
| 11 | `1170:4777` Components · create | board 740→720 (`c5#1` **OK**) | 3 footer moves up 20 — `c5#2/3/4` **OK** (`0,656` / `497,678` / `548,670`) | **YES** | −20 |
| 12 | `171:105` AI · error-quota | `171:132` 108→240 (`c2#0` **OK**) | none needed — 520px of board tail, verified from `kids 171:105` | **YES (n/a)** | 0 |
| 13 | `171:136` AI · not-configured | `171:163` 140→304 (`c2#1` **OK**) + 3 moves (`c2#2/3/4` **OK**) | none needed — 560px tail | **YES (n/a)** | 0 |
| 14 | `2846:21667` AI · error-provider | `2846:21677` 108→272 (`c2#6` **OK**) + `:21678` →248w (`c2#5` **OK 248x18**) + 3 moves (`c2#7/8/9` **OK**) | none needed — 520px tail | **YES (n/a)** | 0 |
| 15 | `170:2` AI · idle | `170:15` 96→112 (`c2#10` **OK**) | none needed — in-flow tail 596→612 in a fixed 812 board | **YES (n/a)** | 0 |
| 16 | `138:53` Insert · searching | `138:105` 66→92w (`c2#21` **OK 92x16**) | 3 labels re-aligned to rel x164 — `c2#22/23/24` **OK** | **YES** | 0 |
| 17 | `1164:4713` Media picker | `foot` hidden, −41 (`c1#27` **OK**) | none needed — board is fixed 520 with 131px of slack | **YES (n/a)** | 0 |
| 18 | `2850:22373` / `:22374` (the clone) | — | `c2-clipping#25/26/27` **HELD as a group** and re-aimed at `1175:4827` (pair 9) | **coherent hold** | — |

**No orphaned grow anywhere in the ledger.** Every row that added height has its
paying row landed in the same batch or later, and no compensation row was
`REFUSED`, `DRIFT`ed, or left unqueued.

Two arithmetic claims that could only be settled by measurement were settled by
the read-backs, and both came out the author's way:
- `2846:21678` — "widen to 248 and the two-line title unwraps back to h18". Ledger:
  **`248x18`**. The pre-existing `100x14` overprint closes.
- `138:105` — "widen COMPONENTS to 92 and it unwraps back to h16" (the author wrote
  an explicit VERIFY condition for the 32-tall failure case). Ledger: **`92x16`**.

## 2. Empty bands — collapse vs hole, per hidden node

40 `delete` rows = 40 `visible=false` hides. Classified:

**(a) In-flow, slot collapses, compensation landed — 8 nodes**
`2850:22375` `:22376` `:22384` (modal hugged 202→117), `2881:12613` (horizontal
slot collapsed 948→624), `641:2581` `:2585` `:2590` (fill spacer absorbed 92),
`1164:4731` (`foot`, board has 131px of fixed slack; the footnote `1173:4814`
rides up 41 to abs 29517 with nothing in that band).

**(b) In-flow but LAST in the stack — nothing to reflow — 6 nodes**
`2838:12104`/`12105` on `140:2`, `2898:12679`/`12680` on `2898:12617`,
`2898:22043`/`22044` on `2898:21981`. Proof from the dumps: the two annotation
texts tile `16548..16665..16782`, and `16782` **is the board's own bottom edge**.
Every remaining child of those boards (`633:3977`, `787:4307/4311`,
`1171:4868/4870`, `1668:7247/7356/7358`, `1720:17466/17470/17529`) sits at
16642-16788 in overlapping, non-tiling positions — i.e. `layoutPositioning:
ABSOLUTE`, which does not move. Result: the in-flow tail ends at 16548 and 234px
of board empties. No hole, no shift. (One caveat — see §5.)

**(c) A text inside a fixed-size hotspot frame — no geometry change at all — 7 nodes**
`2435:12145/12148/12151` (`2429:12111`), `2483:11979/11982/11985` (`170:2`),
`2435:12154` (`144:2`). These are the *labels*, not the hotspots. The parent
frames keep their reactions (§3). That the frames do **not** hug their label is
proved inside the dumps: on `140:2` nine such labels (`2838:12171/12173/12175/
12177/12179/12181`, `1720:17467/17471/17530`) are **already `vis=False`** while
their parent frames still carry full 150×28 / 160×34 boxes and live NAVIGATE
edges. These 7 rows bring three boards into the file's own convention.

**(d) A text run inside a `btns` row — 1 node**
`2881:12621` "Retry failed". Verified from the dump: `par='btns'`, and the btns row
is 13px tall holding two bare text runs 8px apart (`Close` 762..792, `Retry`
800..861). No filled pill is left behind; the row just hugs narrower.

**(e) Absolute / non-reflowing footer children — 18 nodes**
The three canvas-readout chips (`Section · Hero`, `680 × 250`, `Desktop · 100%`)
on six Settings boards. Each board's Footer holds **exactly** those three texts
and nothing else (checked against `52:2`, whose untouched footer has the same
three at the same offsets). All three hidden together, so the band empties as a
unit — no half-collapsed row. One residual sizing question in §5.

### The two boards the brief singled out

**`641:2546` — CLEAN.** Post-edit stack: header 44 → `641:2557` 28 → four 32px
rows → spacer **564** → Panel footer 48 = 812, footer at abs 56683 exactly where
it was. The three absolute hotspots (`787:4359` / `787:4363` at 56661..56695,
`1138:13548` at 56693..56727) sit over the spacer tail and the footer in *both*
states — unmoved and still inside the 812 board (bottom 56731). Nothing above the
hidden rows moves. The visible result is a 4-item library with a taller blank
band, which is what a 4-item library looks like.

**`2850:22371` — BROKEN. See §3.**

## 3. Did any board lose something it needed?

### 🔴 `2850:22371` "Media · delete-confirm · single file" — both prototype edges are now clipped away. This board is WORSE than before.

`analyze.py report 2850:22371` lists exactly two reactions, and they are the
board's only ones:

```
2850:22386 (hotspot/back · Media · bulk-select) -> 145:300 [NAVIGATE]
2850:22385 (hotspot/back)                       -> 145:300 [NAVIGATE]
```

Both are **absolute** children (they overlap `foot`/`22384`, and the board's six
in-flow children tile exactly to 202 without them):

| node | abs box | rel y in board | old board (202) | new board (117) |
|---|---|---|---|---|
| `2850:22385` | `[6820,21299,320,34]` | 165..199 | inside (3px to spare) | **48px past the clip edge** |
| `2850:22386` | `[6820,21295,280,34]` | 161..195 | inside (7px to spare) | **44px past the clip edge** |

The board `clipsContent=true` and its read-back height is `440x117`, so the new
bottom is abs 21251 while both hotspots start at 21295/21299. They are not
painted and they are not hit-testable. **The board now has no way back to
`145:300` — it is a prototype dead end.**

Nobody wrote this row. The board shrank because `c1-clones#3/4/5` hid 85px of
in-flow content and the modal hugs; `c1-clones#6` reported `SAME` precisely
*because* the collapse had already happened. The c1 author's `why` for `#6`
enumerates only the six in-flow children. The c2 author **did** flag these two
nodes — in `c2-clipping#27`, the row that was held: *"NOT AUTHORED and flagged in
the report: the two absolutely-positioned back-hotspots 2850:22385 and 2850:22386
do not move with the flow… their placement is a prototype-wiring question."* The
warning was written down, the row it lived on was held for an unrelated reason,
and the collapse it warned about then happened via a different plan.

**Repair, one row each, both ops exist in the runner:**
`{"op":"move","id":"2850:22385","y":76}` and `{"op":"move","id":"2850:22386","y":76}`
— rel 76 is the `foot` row's own top in the new 117 stack (14+17+10+25+10), so a
34-tall hotspot lands 76..110 inside 117. (Alternative: hide both and `rewire` the
foot buttons `2850:22380`/`22382` to `145:300`.)

### 🟡 `1164:4713` — one of two identical escape edges hidden

`c1-clones#27` hid `foot` (`1164:4731`). The dump shows `1164:4737` "Use Selected"
has `par='btn/use'`, and `btn/use` (`1164:4736`) carries `NAVIGATE -> 807:8521`.
Hiding the footer hides that button and kills its edge. **Not a dead end** — the
board's other reaction, `1164:4718` (the `✕` in `head`), goes to the *same*
destination `807:8521`. Net: one redundant edge lost, which is consistent with the
author's code argument (the multi-select footer never renders in the product).
Worth a line in the arc report, not a repair.

### 🟡 `2898:22178` — copy repurposed, wiring not

`c1-clones#19..24` turned this board from an unsaved-SEO-changes warning into a
delete-page confirm (`Delete "Menu"?`, buttons renamed to `btn/Cancel` /
`btn/Delete page`). The NAVIGATE edges were **not** touched:

- `2898:22185` (now "Delete page") → `140:2` Pages · tree — correct.
- `2898:22183` (now **"Cancel"**) → `302:1978` — this was the *"Keep editing"*
  destination, a page-settings screen (`140:2`'s own `633:3977 hotspot/state ·
  S3.7 · page-settings · SEO` also points there). A Cancel on a delete-page
  confirm should return to `140:2`.

`rewire` is in the runner's OPS set, so this is one row.

### ✅ Everything else clears

- The 7 hidden hotspot **labels** (§2c) leave their parent frames' NAVIGATE edges
  untouched: `2435:12144/12147/12150`, `2483:11978/11981/11984`, `2435:12153` are
  all still visible and still listed as reaction sources.
- The 3 hidden rows on `641:2546` are not reaction sources; that board's six
  reactions (`641:2546` itself, `1138:13548`, `787:4363`, `787:4359`, `641:2596`
  Panel footer, `641:2571` Row · Menu card) all survive.
- The 18 hidden Settings footer chips are texts; those boards' hotspots
  (`915:6884`, `1688:16207/16221/16223/16225`, `645:4351`, `2212:11910`,
  `1720:17284…17332`) are board-level siblings, untouched.
- The 6 hidden annotation texts on the Pages family are not reaction sources.
- `2881:12608`'s only reaction, `2881:12622` (→ `1159:4593`), sits at abs y31750
  — **40px above** a board whose top is 31790 and which clips. It was already
  dead before this arc and the arc did not change it (the width shrink 948→624
  does not reach it: it spans x100..420). Pre-existing; recorded, not caused.

## 4. New overlaps — recomputed from the dumps

Every board whose text moved or whose frames resized, re-run by hand against
`analyze.py report`'s pre-edit overlap list:

| Board | Pre-edit overlaps | Post-edit |
|---|---|---|
| `171:136` AI · not-configured | `178x18` (`171:166` >< `171:165`), `178x2` (`2846:21649` >< `171:165`) | **both closed.** Post-move: `171:165` 65719..65815, `171:166` 65823..65841, `21649` 65853..65889, `21650` 65897..65961; frame 65675..65979 (18px bottom pad). Zero overlaps. |
| `2846:21667` AI · error-provider | `100x14` (`21679` >< `21678`), `56x18` (`21680` >< `21679`) | **both closed.** `21678` 64311..64329 (h18, read-back confirms), `21679` 64333..64397, `21680` 64407..64425, `21681` 64437..64473, `21682` 64481..64561; frame 64301..64573. |
| `163:2` + the four `2854:*` clones | `106x2` (retention text >< Footer text) ×5 | **closed ×5.** Prune note rides up 24 to 78058..78122 (163:2: 80156..80220), its text to +8..+56 inside, clearing the Footer text at 78136 (80234) by 22px. |
| `140:2`, `2898:12617`, `2898:21981` | `7x6` (`⚂ Structure` >< `3`) ×3 | **closed ×3.** Chip to abs y16024..16042; `Row · Marketing`'s `3` starts 16058. New neighbours checked: `⊞ Listings` ends x2693/x293 → 8px gap to the chip at x301/x2701; parent `Search` 16014..16050 contains it; the hidden twin (`2433:11972` / `2898:12623`, `vis=False`) sits at the identical box so there is no double-print. |
| `138:53` Insert | none reported; `138:105` overran its row clip by 8px | **closed.** Three labels to rel x164 (abs 2272): `138:99` 2272..2337, `:102` 2272..2321, `:105` 2272..2364 vs the row clip at 2372. Left neighbours end at 2165/2205/2194 — no collision, and the column stays one line. |
| `1170:4777` Components · create | `15x16` (`Cancel` >< `btn/Create component`) | **closed.** Cancel rel x497..540, button rel x548..700 → 8px gap; button bottom rel 704 in a 720 board (16px pad, same as before). |
| `1175:4827` bulk delete-confirm | text overran `in-use-warn` by 8px | **closed** (wrap to 2 lines at 388w, alert 25→40). Everything below rides down 15 into a board that grew 15. New: the two absolute back-hotspots (`1175:4874` 24899..24933, `1671:7209` 24895..24929) now cover 31px of the 39px `foot` instead of 16px. Both, and the Cancel hotspot `2865:21978` inside the foot, point at the same `145:300`, so no behaviour changes — and the `Delete 34 files` button (x435..512) is outside both hotspots' x-range. Cosmetic only. |
| `2850:22371` single-file delete | text overran `in-use-warn` by 8px | **closed** — the replacement string is 60 chars ≈ 308px in a 398px column. (But see §3.) |
| `1172:4840` Brand · review-changes | none | **none introduced.** `1172:4841` → 340w carrying a 40-char string ≈ 280px (1 line, h16). `1172:4855` → 200w carrying 174px (1 line, h16); its right-hand sibling `1172:4857` "removed" is right-anchored at 594 (all three `chg` rows right-align at 594), so the widened label at 126..326 leaves a 222px gap. No height change → no reflow of a VERTICAL clipping board. |
| `1706:8492` Brand AI · error | none | **none.** New 96-char string at 12/Regular ≈ 576px in a 668px fixed-width `ar=HEIGHT` box → one line, h15 unchanged. Even if it wrapped, the board is `clips=false` and the buttons are 43px below. |
| `2850:21560` Add Child · refused | none | **none.** New band rel 221..261 under `categories` (ends rel 209, 12px gap) in a board grown to 277 → 16px bottom pad, matching every other inset. `layout=NONE`, nothing reflows. |
| `2881:12608` replace-across | none | **none.** `2881:12616` moves x748→424; its body grows to 213w at 14px inset inside a 300w clipping frame (227 < 300). Column heights 52 / 95 → board 624x95. |
| `638:2378` + 5 Settings boards | none | **none** — hides only, no geometry. |

## 5. What cannot be closed without a Figma read

Three questions, in descending order of consequence. Each is one read.

### R1 — Are the Pages-tree boards still 812 tall? (highest consequence)
**Read:** `absoluteBoundingBox.height` and `primaryAxisSizingMode` (or
`layoutSizingVertical`) of `140:2`, `2898:12617`, `2898:21981`.

**Why it matters:** the two hidden annotations were the *last* in-flow children and
their bottom edge (16782) **is** the board's bottom edge. If those boards hug
vertically rather than being fixed at 812, the board just shrank by 234px to
16548 and every absolute hotspot below that line is clipped — ~10 NAVIGATE edges
per board × 3 boards.

**Why I believe they are fixed (but did not measure it):** `170:2` is the same
280×812 family and its in-flow children sum to **596 in an 812 board** — a hug
frame cannot be 216px taller than its in-flow content (absolute children are
excluded from auto-layout sizing). And `641:2546`'s spacer grew 472→564 *by
itself*, which is only possible in a fixed-height parent. So the family is
fixed-height. That is inference from two siblings, not a measurement of these
three.

### R2 — Did the Settings footers keep their height?
**Read:** `layoutMode` + `layoutSizingVertical` + `height` of `638:2613`
(the Footer), and `height` of `638:2378` (the board). One read covers all six —
they are the same template.

**Why it matters:** all three of a footer's children are now hidden. If the Footer
hugs vertically it collapses from 32 to its padding; if the *board* also hugs, it
shrinks up to 32px, and on `640:2440`, `640:2789` and `640:3135` the
`hotspot/state · …` chips sit **flush with the board's bottom edge**
(103555 / 102535 / 100495 = board bottom exactly) — 4 + 4 + 6 = 14 NAVIGATE
edges would be clipped. A gap in the id run (`638:2616`, `640:2678`, `640:3027`,
`640:3373`, `1703:9151`, `1703:9313`, and `53:22` on the untouched `52:2`) says
there is a fourth, non-text child between `680 × 250` and `Desktop · 100%` —
almost certainly a fill spacer, i.e. the footer is a horizontal auto-layout that
empties cleanly. Same fixed-vs-hug inference as R1 applies to the 1440×900
shells. Low risk, unmeasured.

### R3 — Is `2898:21981`'s Search row really the same as its two clones?
**Read:** children of `2898:21983` (the `Search` frame) — specifically the box of
its `⊞ Listings` label and whether the hidden twin of `⚂ Structure` exists there.

**Why:** `b*.tsv` dumped only 32 of that board's 36 texts, so the moved chip's
left-hand neighbour was never captured. The conclusion rests on symmetry with
`140:2` and `2898:12617` plus the fact that the move resolved to the identical
parent-relative `(201,10)` on all three (the author's own corroboration, and the
read-back agrees). Cheap to close, very unlikely to be wrong.

### Also worth one read, but not a coherence risk
- `2898:22183`'s reaction target (§3) — decide whether Cancel should go to `140:2`.
- `302:1978`'s identity, to confirm it is the page-settings screen (inferred from
  `140:2`'s `633:3977 hotspot/state · S3.7 · page-settings · SEO -> 302:1978`).

## 6. Partial repairs that leave a board self-contradictory

Not layout breakage, but the arc created them and they should not be lost:

- **`1706:8492` "Modal · Brand · AI prompt · error".** `c5-c6-c7#12` landed the new
  body — *"AI drafting isn't configured yet. No API key is set for this workspace,
  so nothing here will run."* — while its companion `c5-c6-c7#13`, which replaces
  the **Retry** button label, is held (measured reason: `1706:8497` is
  `WIDTH_AND_HEIGHT`, so a 23-char string would grow 86px past the board's right
  edge). The board now says nothing will run and still offers Retry. The
  contradiction existed before (`AI service not configured` + Retry) but the
  landed half makes it louder. Closing it needs the width row the held plan
  already describes.
- **`2898:22178`** — see §3. Copy is a delete-page confirm; wiring is still the
  unsaved-changes wiring.

## 7. Verdict

| | |
|---|---|
| Boards touched by a landed row | 32 |
| Boards verified coherent | 31 |
| **Boards now WORSE than before** | **1 — `2850:22371`** (both NAVIGATE edges clipped out of a shrunk clipping frame; prototype dead end) |
| Grow/shrink pairs, both halves landed | **18 / 18** |
| Grows with a missing or refused compensation | **0** |
| Hidden nodes that were reaction sources | 1 (`1164:4736` `btn/use`, redundant with the `✕` to the same destination) |
| Pre-edit text-text overlaps closed | 13, across 11 boards |
| Pre-edit clip overruns closed | 12, across 12 boards |
| New overlaps introduced | 0 |
| Checks needing a Figma read | 3 (R1, R2, R3) |

## What was NOT verified

- **Nothing was looked at.** No Figma call, no screenshot, no live render. This is
  arithmetic over the pre-edit dumps plus the ledger's read-backs.
- Sizing mode (hug vs fixed) was **inferred**, not read, for `140:2`/`2898:12617`/
  `2898:21981` and for the six Settings boards and their Footers — R1 and R2.
- `2898:21981`'s dump is incomplete (32 of 36 texts) — R3.
- Text advance widths for the rewritten strings were computed from each node's own
  px/char calibration, not from a font engine. Three of them were confirmed by the
  ledger's own size read-back (`248x18`, `92x16`, `388x26`); the rest
  (`1706:8416`, `1172:4841`, `1172:4855`, `2850:22372`) were not measured after
  the write, because the `text` op reads back characters, not geometry. All four
  sit in non-clipping or heavily over-provisioned boxes.
- The 23 held and 6 unresolved rows were checked only for whether they were the
  missing half of a landed pair (none were). Their own merits were not re-audited.
- No visual comparison against the Figma boards was performed — per the founder
  rule, that is the acceptance and it has not happened for any of these 32 boards.
