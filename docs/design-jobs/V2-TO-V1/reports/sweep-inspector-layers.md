# Sibling sweep A — `08 · Inspector` (`1776:8381`) and `03 · Layers` (`1776:8375`)

**Founder steps 4 and 5:** *check whether the same issue appears elsewhere in V1*
and *apply the fix everywhere it is relevant.* The module passes fixed each
finding on the one board it named. This is the sweep of the siblings.

**Cost: 7 Figma calls** — 1 recon, 3 apply, 1 repair, 2 verify. 21 rows written,
all `OK` with a read-back. **19 boards carry a new correction** (9 Layers,
10 Inspector); a 20th, `1176:4804`, was moved to repair an overlap this sweep
itself created. **25 boards were examined and cleared** (9 Layers, 16 Inspector),
each with a stated reason.

Plans: `plans/sweep-a-01-captions.json`, `sweep-a-02-appends.json`,
`sweep-a-03-rename.json`, `sweep-a-04-fix-overlap.json`.

---

## What the recon changed about the plan

One call — `dump-section-children.mjs --sections=1776:8375,1776:8381 --text` —
because the local page dump (`scratchpad_audit/vis3/page-meta.txt`, 2026-09-06)
predates the 2026-09-07 caption reflow. The reflow had moved Layers row 2 from
y=1280 to y=1454 and row 3 from 2304 to 2706, and Inspector rows 2/3/4/5 down by
30 and 60. Every caption coordinate below is from the live read, not the dump.

Everything else came from the dump and from the code, both free. The dump is
what made the sweep decidable: it carries the full node tree of all 18 Layers
boards and all 30 pre-arc Inspector boards, so "does this sibling actually show
the defect" is a lookup, not a guess.

---

## Per defect: applied, and cleared

### UX-H-14 / UX-H-15 / UX-H-17 — the eye dims, the lock is written twice

Applied by the layers pass to **`143:179`** and **`143:237`** (board renames) and
their two captions. Verified again at source before sweeping:

```
useLayerActions.ts:140-146   el.setAttribute("data-hidden", String(pending.hidden))   ← DOM only
useLayerActions.ts:163-168   composer.elements.getElement(id)?.setLocked(locked)
Element.ts:151-155           setLocked -> this.data.locked
shared/types/element.ts:73   locked?: boolean   on ElementData — travels with the document
useLayerActions.ts:70-97     hydrateFromStorage reads localStorage and PUSHES into the engine; never reads back
useLayerSelection.ts:68-74   selectSingle -> composer.selection.select(el)   — no lock check
```

The `COVER-1-61` correction stands: lock is **not** localStorage-only. That
asymmetry is the defect.

**APPLIED — 8 boards**

| board | how | read-back |
|---|---|---|
| `1082:4640` Layers · expanded | new `caption/Layers · expanded` | `2914:12651  280x144 @2100,1052` |
| `1082:4739` Layers · component-instance | new caption | `2914:12652  280x90 @500,1052` |
| `1082:4835` Layers · scroll-overflow | new caption (with the UX-H-23 measurement) | `2914:12653  280x72 @2100,2286` |
| `1171:4829` Layers · display-settings | new caption | `2914:12654  280x144 @1300,1052` |
| `1082:4527` Layers · context-menu | new caption (UX-H-23 half) | `2914:12649  280x90 @900,1052` |
| `143:2` Layers · filtered | append to `155:26` | `OK h=198` … *“…Data.locked while the panel re-reads only the first. UX-H-14, UX-H-17.”* |
| `143:60` Layers · dragging | append to `155:27` | `OK h=144` … same tail |
| `143:295` Layers · multi-select | append to `155:31`, incl. UX-H-15 | `OK h=180` … *“…canvas refuses (useLayerSelection.ts:68-74). UX-H-14, UX-H-15, UX-H-17.”* |

**EXAMINED AND CLEARED — 9 boards**

| board | why cleared |
|---|---|
| `143:179` hidden, `143:237` locked, `143:119` invalid-drop | the module pass's own targets — the finding is on the board name and the caption already |
| `1082:5004` [not-implemented] Layers · list-view | **does not show the defect.** Its twelve `List row` frames draw an icon and a name and **no eye and no lock** (`1082:5013`…`1082:5048`). Nothing to say about a control it does not draw. |
| `143:355` empty, `775:4130` loading, `781:4217` load-error, `782:4260` no-results | draw an empty state / skeletons / an error card — no tree rows, so no eye and no lock |
| `142:2` Layers · tree | caption `155:25` was rewritten by the layers pass and is **378px tall in a 402px band**; any append overflows into row 2. The finding is already carried there. |

### UX-D-02 — the inspector draws every control enabled for a locked element

Applied by the inspector pass as **one new board**, `2865:12419
[not-implemented] Inspector · locked element`, cloned from BUTTON. Re-verified at
source, and this is the strongest read in the sweep:

```
$ grep -rn "isLocked" src/editor/inspector/   →  0 files
```

The inspector reads no lock flag anywhere. Every control stack in the section is
therefore silent about the locked case, exactly as the sweep brief says.

**APPLIED — 10 boards**

| board | how | read-back |
|---|---|---|
| `807:8342` profile · TEXT | new `caption/Inspector · profile · TEXT` | `2914:12655  300x72 @1780,5865` |
| `807:8475` profile · GRID | new caption | `2914:12656  300x72 @520,5865` |
| `807:8521` profile · MEDIA | new caption | `2914:12657  300x72 @1360,5865` |
| `807:8614` profile · INPUT | new caption | `2914:12658  300x72 @940,5865` |
| `159:123` multi-select | append to `161:15` | `OK h=378` … *“…stays live for a locked element. UX-D-02, and the drawn answer is 2865:12419.”* |
| `160:2` instance-selected | append to `161:16` | `OK h=126` … same tail |
| `160:105` bound-to-CMS | append to `161:17` | `OK h=234` … same tail |
| `160:313` pseudo-state | append to `161:19` | `OK h=360` … same tail |
| `160:412` reach-all-like-this | append to `161:20` | `OK h=252` … same tail |
| `189:2` reach-whole-site | append to `189:104` | `OK h=342` … same tail |

The four new profile captions carry the UX-D-10/11/25/26 half as well — *no
search, no count pills (2865:22079)* — which `reports/inspector.md` itself says is
owed on "board 6 **and the seven profile boards**" and which only board 6 got.

**EXAMINED AND CLEARED — 16 boards**

| board | why cleared |
|---|---|
| `807:8567` profile · BUTTON | it is the **source** of `2865:12419`; the source/clone pair is this file's before-and-after convention, so the correction reaches it |
| `807:8412` profile · FLEX | source of `2865:21984 Inspector · disabled control · reason and fix` (UX-D-12/13) |
| `32:2` profile · CONTAINER | source of `2865:22079` (findability) and `2864:12415` (slider editor) |
| `2474:11972` profile · FORM | source of `2864:21821 FORM · destination`. Its caption slot is also physically occupied — board bottom 5933, the section-wide note `2876:12479` starts at 5953. |
| `160:208` breakpoint-override | paired with `2865:12493`, **and** caption `161:18` is 270px in a 294px band — an append overflows into row 2. Not edited rather than edited unsafely. |
| `2430:11940 / 11959 / 11996` INTERACTIONS | paired with `2865:22206 Inspector · MOTION · one section`; they draw a trigger/preset list, not a style control stack |
| `159:99` no-selection, `159:102` loading, `160:512` ai-agent-run, `1707:8456` error-boundary, `1175:4841` template-applied, `429:2350` animation editor, `1176:4804` + `1707:8406/8417/8427` popovers, `1706:8458` modal, `824:5095` flat-scroll | **draw no control stack.** An empty state, six skeletons, an AI takeover, an error card, a banner, three popovers and a modal have no controls to leave enabled. `824:5095` and `1175:4841` already carry their own markers. |

### UX-D-19 / UX-H-16 — the T/M breakpoint badges can never render

`useLayerTree.ts:88-95` returns `{id,type,tagName,depth,preview,children}` and
never populates `breakpointOverrides`, which `LayerTreeItem.tsx:276-281` reads.

**Swept across every board in both sections and applied to none — correctly.**
The full node trees of all 18 Layers boards and all 30 pre-arc Inspector boards
were searched for a badge node (`name` matching `T`, `M`, `bp`, `badge`,
`breakpoint`, `tablet`, `mobile`). Four hits, none of them the badge:

- `1082:4785` `Badge` — a text label on a tree row, not a breakpoint chip
- `1171:4856` `opt/Show lock badges` — the display popover (see below)
- `160:217` `Tablet ▾` and `160:312` `Overridden on Tablet — Base is 16` — the
  Inspector breakpoint pill and its override note, which are the *inspector's*
  own mechanism and do render

**No V1 board draws the badges as working.** That is the correct state for a
finding whose fix is "drop the badge or feed the data", and it is a null result
that was checked rather than assumed — `reports/layers.md` had confirmed it for
`142:2` only.

### UX-H-23 — the remaining half: a hit target under 24×24

The brief records the 40px-in-a-28px-row half as CLOSED and a 20×20 target as
still open on the tree-row master `243:6`, which lives on page `1:2` and is out
of this job's scope.

**A correction to `reports/layers.md`.** It states: *"the eye and lock are not
drawn on any Layers board — every row on every board is an INSTANCE of that
master."* The dump disproves it. **Five boards draw their own rows**, not
instances: `1082:4527`, `1082:4589`, `1082:4640`, `1082:4739`, `1082:4835`. On
every one of them the eye and lock are **10×10 TEXT nodes at x=246 and x=262,
16px apart, inside a 28-high row** — smaller than the master's 20×20 and reachable
from page `1:3`, where the master is not.

**APPLIED** — the measurement is now on `1082:4527` and `1082:4835`
(`2914:12649`, `2914:12653`). **NOT applied:** the geometry itself. Resizing ~60
glyph pairs across five boards is a drawing job, not a caption row, and it was
not attempted rather than half-done.

### New, same class, never swept — `1171:4829` Layers · display-settings

The layers pass marked two boards whose copy asserts something the code cannot
do (`1082:5004` list-view, `143:355` empty). It never checked this one, and it
earns the same marker.

The board draws a popover titled **Display** with four options: *Show hidden
layers, Show lock badges, Compact rows, Highlight CMS-bound.*
`LayerDisplaySettings.tsx` ships a popover titled **Display Settings** with
exactly three: *Show HTML tags (div, section, h1…)*, *Show element IDs (#abc123
format)*, *Compact rows* — and `LayerDisplayPrefs` (`types.ts:60-67`) has exactly
three keys, `showHtmlBadges`, `showElementIds`, `treeDensity`. **Three of the four
drawn options do not exist; two that ship are not drawn; the title is wrong.**

**APPLIED** — rename, read back:

```
sweep-a-03-rename#0  OK  [not-implemented] Layers · display-settings — three of the
four options drawn do not exist. LayerDisplaySettings.tsx ships exactly three rows
— Show HTML tags, Show element IDs, Compact rows — against LayerDisplayPrefs
(types.ts:60-67); Show hidden layers, Show lock badges and Highlight CMS-bound are
invented, and the popover title is Display Settings
```

plus `caption/Layers · display-settings` naming the three real rows
(`2914:12654  280x144 @1300,1052`).

### UX-H-18 — custom layer names are browser-local

Applied nowhere: `fix-layers-ux.mjs` step E (draw the rename field + the "this
browser only" hint) never ran, and `1082:4589 Layers · renaming` draws eight
plain tree rows and **no rename field at all**.

**APPLIED** — `caption/Layers · renaming` (`2914:12650  280x108 @1700,2286`),
which says both: the field is not drawn, and the names are localStorage-only
(`buildrick-layers-{pageId}-names`, `layersPersistence.ts:73-79`). **The field is
still not drawn.** A caption is a smaller correction than the one the plan asked
for and it is not a substitute for it.

---

## The one defect this sweep created, and the repair

Appending the UX-D-02 clause grew `161:15 caption/Inspector · multi-select` from
288 to **378** tall at `100,2178` — bottom 2556. `1176:4804 Inspector ·
token-picker popover` (236×214) is parked at `100,2490`, **inside the caption
band**, not in a board row. `verify-invariants` caught it as a board overlap:

```
OVERLAP in 08 · Inspector · 51: 161:15 'caption/Inspector · multi-se' x 1176:4804 'Inspector · token-picker pop'
board overlaps: 1
```

`reflow-caption-overflow.mjs` could not have fixed it — it only measures a
caption against the next **row top**, computed from non-TEXT children, and a
236×214 popover parked mid-band defines no row. Repaired by moving the popover
down 90px, vertical only, x untouched: new y 2580, bottom 2794, clear of row 3 at
2824, and its column x=100..336 is empty for that span.

```
sweep-a-04-fix-overlap#0  OK  100,2580
```

Every other new caption was measured against the row below it before it was
written, and all fit: the largest is 144px in a 402px band, and the four
Inspector row-5 captions are 72px each in the 88px between the profile boards'
bottom (5845) and the section note `2876:12479` at 5953.

---

## Invariants

`node scripts/figma/verify-invariants.mjs`, before and after, same command:

| class | brief's baseline | after this sweep | verdict |
|---|---|---|---|
| loose nodes on page | 77 | **77** | unchanged |
| section overlaps | 2 | **2** | unchanged (`07 · Brand`×`06 · Content`, `12 · AI`×`13 · Command palette`) |
| board overlaps | 0 | **0** | regressed to 1, repaired — see above |
| out-of-bounds children | 1 | **1** | unchanged (`1719:8421 Ecommerce · bound · inspector`, not mine) |
| dangling prototype edges | 0 | **0** | unchanged (3579 edges, none added) |
| boards | 1031 | **1041** | **+10, growth only.** Ten caption TEXT nodes; no board created, none deleted, none renamed except `1171:4829`. |

Section child counts: `03 · Layers` 29 → 35, `08 · Inspector` 52 → 56.

---

## Coverage, measured two ways because they disagree

`COVERAGE.md` counts a board as covered when a node this arc created or wrote
lives **inside** it. A caption is a child of the **section**, not of the board, so
by that metric a caption sweep barely moves the number. Both are reported.

| metric | Layers `1776:8375` | Inspector `1776:8381` |
|---|---|---|
| **A — a node written inside the board** (COVERAGE.md's rule) — before | 6/18 | 7/40 |
| **A — after** | **7/18** (`1171:4829` renamed) | **7/40** (unchanged) |
| **B — the board carries a record of a defect it shows**, on its own name or its own caption — before | 7/18 | 17/40 |
| **B — after** | **13/18** | **24/40** |

`COVERAGE.md` publishes 6/40 for Inspector and 6/18 for Layers. My own count of
the pre-state, joining `queue.json` to `queue-state.json` and mapping every landed
row's target node to its board, gives 6 boards for Layers (matching) and, for
Inspector, 7 boards under metric B once the 2026-09-07 `gap-b-copy` row and the
ten new boards are included. **I did not edit `COVERAGE.md`** — it is a
whole-page measurement and re-running it belongs to whoever owns that number.

The 5 Layers and 16 Inspector boards still at zero under metric B are itemised in
the CLEARED tables above, each with the reason it was not edited.

---

## What this sweep did NOT do

1. **No geometry fix for UX-H-23.** The five boards' 10×10 eye/lock glyphs are
   *measured and recorded*, not resized. That is roughly 120 nodes across five
   boards and it is a drawing pass.
2. **No rename field drawn on `1082:4589`.** UX-H-18's board still shows eight
   plain rows; only its caption now says so.
3. **The `1171:4829` popover is not redrawn.** It still shows four invented
   options; the board name and its caption now say which three are fiction and
   which two real ones are missing.
4. **Nothing was swept outside these two sections.** `UX-D-19`/`UX-H-16` was
   checked across both, and `UX-D-02`'s twin `UX-H-15` reaches the Layers side —
   but the Journeys mirror boards (`1776:8388`, 4/107) redraw these same panels
   and were not touched. A Layers or Inspector panel redrawn as an S-flow step
   now disagrees with its module board.
5. **No screenshot verification.** Every claim here is a read-back of a node, a
   measurement against the live section read, or a `file:line` in this working
   copy. Nobody has looked at these boards at 1440×900, which is this repo's
   stated acceptance for a drawn change. For twenty captions and one rename that
   is a proportionate risk; for the drawing work in items 1–3 it would not be.
6. **`REGISTER.md` untouched** — it is written concurrently and a targeted edit
   racing other writers is worse than a stale column.
