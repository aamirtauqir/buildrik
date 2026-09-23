# Sibling sweep + gap audit — 07 Brand · 11 Templates · 10 Components · 28 Library

**Date:** 2026-09-07 · **Figma calls spent: 11 of a 15 budget.** Call 11 returned
the daily-cap string and took no measurement; I stopped there.
**Boards changed: 28, plus 2 captions.** Every one is listed below with the
read-back that proves it.

Two different jobs, kept apart because they failed for different reasons.
**Brand was a sweep** — the defect was measured and never applied.
**Templates, Components and Library were never audited at all**, and the answer
to "what did you find" includes "examined, conforms" three times, which is a
result and not a shortfall.

---

## 0. Coverage, before and after

| section | before | after | how |
|---|---|---|---|
| `1776:8373` 07 · Brand | 6 / 35 | **14 / 35** (worst case 12 / 35) | 8 boards drained; 2 of them (`1172:4840`, `1333:7162`) also appear in a pre-arc applied plan, so if COVERAGE already counted those, the figure is 12 |
| `1084:4527` 11 · Templates | 0 / 14 | **7 / 14** | 4 boards drained + 3 audit-fixed, plus caption `788:4312` |
| `1938:8372` 10 · Components | 0 / 10 | **6 / 10** | 3 boards drained + 3 audit-fixed, plus caption `788:4315` |
| `2040:8372` 28 · Library | 0 / 3 | **3 / 3** | all three component sets laid out |
| `1779:6` 22 · Ecommerce (not mine; carried in the same plan) | 1 / 5 | **5 / 5** | 4 boards drained |

**These after-figures are computed from my own read-backs, not re-measured by
COVERAGE's method.** COVERAGE.md carries no per-board dataset in the repo, and
the call that would have re-measured hit the cap. Note also that COVERAGE's
denominators (35 / 14 / 10 / 3) are smaller than the sections' own board counts
(51 / 18 / 12 / 3); I have used COVERAGE's, unchanged.

---

## 1. Invariants

`verify-invariants.mjs`, page `1:3`, after every write:

```
loose nodes on page: 77
section overlaps: 2   (07 Brand x 06 Content · 12 AI x 13 Command palette)
sections: 29  boards: 1043
board overlaps: 0
out-of-bounds children: 1  (1719:8421 Ecommerce · bound · inspector)
prototype edges: 3579  dangling: 0
FAIL
```

| class | stated baseline | measured after | verdict |
|---|---|---|---|
| loose nodes | 77 | **77** | unchanged |
| section overlaps | 2 | **2** | unchanged |
| board overlaps | 0 | **0** | unchanged |
| out-of-bounds children | 1 | **1** | unchanged — same node, `1719:8421`, pre-existing |
| dangling edges | 0 | **0** | unchanged |
| boards | 1031 | **1043** | **+12, and not mine** |

On the +12, stated plainly rather than waved away: **every operation I ran edits
an existing node — repaint, resize, reposition, rename, hide, set a font size,
set a style. I created no node of any kind**, and the full list of nodes I
touched is in §2 and §3. A board count cannot rise from that set of operations.
The file is shared and other lanes were writing to page `1:3` on the same day.
I did not spend a call proving whose the twelve are, because the five classes I
could actually regress all read exactly at baseline.

The Library layout was the one change that could plausibly have broken an
invariant, so it checked itself in the same call: `setOverlaps=0
leaveSection=0`, and every one of the 21 variants read back inside its parent
(`escaped=0`).

---

## 2. THE SWEEP — 07 · Brand

The brand pass measured this section and wrote nothing. Its measurement was the
plan; this is the application of it.

### 2a. The baseline it published, re-checked rather than trusted

| claim | verdict |
|---|---|
| 86 boards · 1394 TEXT · 697 style-bound (50.0%) | **Corroborated within drift.** My own walk on 2026-09-07: Brand 629 TEXT, Templates 479, Components 228, Library 56 — the brand census said 628 / 479 / 229 / (Library not in its scope). |
| 39 nodes at 10px | **Exactly right.** All 39 resolved, all 39 promoted, all 39 read back at 11/16. |
| 2 real off-token paints (`#6B7380` ×2 on `641:2599`) | **Exactly right.** Both repainted to `#6B7280` and bound to `color/ink-muted`, read back. |
| 37 `#000000` are `hotspot/*` markers and NOT a defect | **Accepted, not re-derived.** My scan excluded `hotspot/*` by name and found no black defect; I did not re-enumerate all 37. |
| exactly one weight > 600 — `813:4498`, left unclassified | **Now classified, on a read.** See §3c. It is customer content and is not chrome debt. |

### 2b. What landed — 8 Brand boards, 22 nodes

`drain-offtoken.mjs docs/design-jobs/V2-TO-V1/plans/brand-03-conformance.json --apply --chunk=39`

**41 of 41 rows OK. 0 MISMATCH. 0 nodes escaped their board.**

| board | nodes promoted 10px → 11/16 | read-back |
|---|---|---|
| `152:52` Brand · tokens | `1749:8405` `1749:8407` | `OK … 11/16 bound was WIDTH_AND_HEIGHT` |
| `153:2` Brand · classes | `1720:17385` | `OK 11/16 bound` |
| `153:29` Brand · components | `1720:17388` | `OK 11/16 bound` |
| `153:92` Brand · colour-mode | `1751:8399` `1751:8401` `1751:8402` | `OK 11/16 unbound` ×3 |
| `1172:4840` Brand · review-changes (modal) | 9 nodes `1172:4843…4858` | `OK 11/16 bound` ×9 |
| `1333:7162` Brand · root (CURRENT) | `1720:17208` `1720:17211` `1720:17447` | `OK 11/16 bound` ×3 |
| `1706:8467` Modal · Brand · AI prompt · idle | `1720:17451` | `OK 11/16 bound` |
| `1706:8476` Modal · Brand · AI prompt · generating | `1720:17455` `1720:17459` | `OK 11/16 bound` ×2 |

Five of the 41 came back **size-corrected but unbound** — `1751:8399/8401/8402`,
`807:6539/6552`, `1719:8416`. The size rule is satisfied; the ramp has no
exact-match style for their family+weight at 11. Reported, not papered over.

The same run carried the sibling boards in the other three sections:
Templates `807:4299` `1169:4725` `1169:4753` `1169:4764`;
Components `641:2599` `1138:13394` `1170:4792`;
Ecommerce `1719:8391` `1719:8414` `1719:8443` `1719:8450`.

### 2c. Brand boards examined and CLEARED

`306:2232` · `306:2265` · `306:2298` — UX-H-28's three drop-zone strings.
`apply-text-fixes.mjs --apply` returned **`SAME` on all three**: they already
read *"Drop tokens.json — JSON only"*. `SAME` is emitted only when
`n.characters === want`, so this is a read-back, not an assumption.
**ALREADY-CORRECT.**

### 2d. Five brand copy rows I deliberately did NOT apply

`plans/sweep-b-01-brand-text-HELD.json`. `152:145`, `306:2191`, `155:60`,
`155:58`, `155:56` each describe a control that is not drawn on the board it
sits on, and two of them contradict the shipped code: they would print
*"Selecting a starter previews it on the canvas"* on boards that draw no Apply
control, while `StartersSection.tsx:43` fires `applyStarter(id)` straight from
`onSelect`. The brand pass authored them as the caption half of boards N1/N3/N4
and edits E3/E5, which are still unbuilt. Applying the caption without the board
is precisely the failure RUNBOOK §3 names — a board asserting something false,
invisible to every render sweep. **They land in the same commit as those boards
or not at all.**

---

## 3. THE AUDIT — three sections no finding ever targeted

### 3a. `2040:8372` 28 · Library · shared chrome — the stacking defect, fixed

**This was the highest-value thing in the four sections and it is now fixed.**

Measured first-hand before the write:

```
LIB-SET 2034:8519  Rail              60x812  @100,220   layout=NONE kids=7   → all 7 variants at 0,0
LIB-SET 2041:19572 Settings nav row 140x30   @100,1152  layout=NONE kids=2   → both at 0,0
LIB-SET 2142:11082 List row · indented 280x28 @360,1152 layout=NONE kids=12  → all 12 at 0,0
```

`distinctPositions=1` on every set: 21 variants stacked at one point, so the
library displayed one variant per component and the states these sets exist to
document were invisible.

Read back after `sweep-b-library-layout.mjs --apply`:

```
OK 2034:8519  now 564x812 @100,220   distinctPositions=7/7   escaped=0
OK 2041:19572 now 304x30  @100,1064  distinctPositions=2/2   escaped=0
OK 2142:11082 now 584x208 @100,1110  distinctPositions=12/12 escaped=0
CHECK setOverlaps=0  leaveSection=0  section=1200x1322
```

The List row is now a readable matrix: 2 columns (State rest / selected) × 6
rows (Depth 0-5). Everything sits inside the section's **existing** 1200×1322
box, so the section never grew and could not collide with its neighbour.
Moving a variant inside its set changes no instance — an instance references its
main component by id — so the 387 List-row and ~600 nav-row consumers are
untouched.

Two related rows resolved without a write:

- **ARR-D-33** (the section name still calls `2142:11082` "the Rail component
  set") — **ALREADY-CORRECT**, read back verbatim: *"28 · Library · shared
  chrome · 3 — Rail, Settings nav row and the indented List row. NOTE: the List
  row here is NOT the Layers tree row…"*
- **ARR-D-34** asked for all three sets on one row at y=220. That was computed
  against the STACKED widths (60 + 140 + 280). Laid out they are 564 + 304 + 584
  and one row needs ~1500px in a 1200-wide section. **Superseded with a
  measurement, not ignored**; the vertical stack is in the plan with the
  arithmetic. Its second half — a caption under each set — is filed, not
  applied: a caption placed as a direct section child counts as a board in
  `verify-invariants.mjs`, and I was not going to move the page's board count on
  the last calls of a spent quota.

**Library type conformance: `TEXT=56, bound=56, offSize=0, offLead=0,
weight>600=0`. Examined, conforms — the only section of the four that is
already clean.**

### 3b. `1938:8372` 10 · Components — one real defect, fixed

**FIG-F-57 is fixed, not just re-derived.** Board `781:4433 Components ·
load-error` drew `781:4468` "Panel footer" (280×48) holding Button instance
`781:4469` labelled "+ Create component". `ComponentsTab.tsx:93-113` returns a
`PanelFrame` holding only the header and `PanelErrorState` and **returns** — no
footer is ever reached.

```
OK-HIDE  781:4468  'Panel footer'  visible=false  on 781:4433
```

Hidden, not removed: `remove()` is refused on instance children, and this repo
never deletes a design. Caption `788:4315` said the opposite of the code in so
many words — *"Create component stays live because it does not depend on the
list."* — and now reads *"The error branch returns before the footer, so no
Create button renders when the list fails — Retry is the only way out."*
(`OK-TEXT 788:4315 54px -> 54px clash=0`; the replacement was length-matched on
purpose so the caption could not grow into the board below).

Also in Components: `641:2599`'s two `#6B7380` near-misses repainted to
`#6B7280` and bound (`OK 2483:11988 #6B7280 bound`, `OK 2483:11991 #6B7280
bound`); `1712:8391` "Create Component" 15px → 16/24 bound. That last one is
worth a line — **the plan named board `1712:8388` and the real board is
`1170:4777 Components · create (modal)`.** The script derives the board by
walking to the section child instead of trusting the id, which is the only
reason the overflow guard measured against the right box.

**Examined and conforms:** `1138:13394 Components · empty` draws "No components
yet." plus a Panel footer with "+ Create component" — and here the footer is
CORRECT, because the empty branch is in the normal render path. It is the exact
mirror of `781:4433`, which is what made the defect legible.

### 3c. `1084:4527` 11 · Templates — a mis-titled board, and a false alarm

**`781:4372` is mis-titled and now says so on the board.** `TemplatesTab.tsx`
has no fetch and no `isLoading`; what ships is an APPLY-error banner
(`:575-586`) with Retry (gated on `canRetry`, `:281`) and Dismiss. Marked rather
than renamed, because a bare rename would promise a banner the board does not
draw:

```
OK-MARK 781:4372  'Templates · load-error — [not-implemented] as drawn:
TemplatesTab.tsx has no fetch and no isLoading; the shipped error is an
apply-error banner (Retry / Dismiss) over the gallery, TemplatesTab.tsx:575-586'
```

Caption `788:4312` carried the same wrong premise and now reads *"There is no
load, so there is no load error…"* (`OK-TEXT 788:4312 36px -> 72px clash=0` —
it doubled in height and was checked against every sibling in the section before
being accepted).

**The one >600-weight node is now classified.** `813:4498` Inter Bold 32 "Build
something amazing", ancestor chain read in full:

```
TEXT 813:4498 < FRAME 813:4497 < FRAME 813:4495 'template-preview-scroll'
  < FRAME 1711:8404 'modal/1100 · template preview' < FRAME 813:4489 < SECTION 1084:4527
```

It is inside the **scroll body of a template preview** — it is the template being
previewed, i.e. customer site content, which TYPE-COLOR-SYSTEM rule 3 exempts.
Its four siblings (`813:4502/4505/4509/4513`, 15–22px Semi Bold) are the same
content. **Not chrome debt, not drained, and no longer unclassified.** By
contrast `1711:8406` "Hero + Features" 15px sits in `modal-header`, one level
outside the preview — that one IS chrome, and was corrected to 16/24.

**VIS-3-30 and its three siblings: ALREADY-CORRECT, and the finding's
prescription was unapplyable.** All four toolbars read:

```
BAR-AL 642:2928  HORIZONTAL/AUTO  760x72 @0,708  content 8..64  padTB=8/8  FITS
BAR-AL 642:2652  HORIZONTAL/AUTO  760x72 @0,708  content 8..64  padTB=8/8  FITS
BAR-AL 807:4330  HORIZONTAL/AUTO  800x72 @0,683  content 8..64  padTB=8/8  FITS
BAR-AL 807:6778  HORIZONTAL/AUTO  760x72 @0,683  content 8..64  padTB=8/8  FITS
```

Two things follow. The defect is fixed — the cached SWEEP-FULL list the plan
quoted is stale. And VIS-3-30's instruction, *"shift its children down 16"*,
could never have been carried out on any of the four: they are auto-layout
frames whose children's x/y belong to the parent. My first attempt refused all
four with `AUTOLAYOUT` rather than writing coordinates that would be ignored;
the second attempt, which hugs the counter axis instead, found nothing left to
do. **A finding whose fix is impossible to apply is worth recording as such.**

**Examined and conforms:** `782:4402 Templates · no-results` draws *"Nothing
matches 'pricing'."* with the search field carrying "pricing" — the SEARCH
string, which is the state it is named for (`TemplatesTab.tsx:502-503` renders
the search string when a search is active and the category string otherwise).

---

## 4. The finding this audit produced that nobody had

**Text-style adoption in these sections is not blocked by binding. It is blocked
by leading.** `sweep-b-bind-sections.mjs --apply` bound every TEXT node whose
family, weight, size, leading, tracking, case and decoration all equal a local
style's, outside instances, that did not already carry one:

| section | TEXT | bound after (read back) | newly bound | skipped: in instance | skipped: **no exact style** |
|---|---:|---:|---:|---:|---:|
| Brand | 629 | 302 | 0 | 50 | **276** |
| Templates | 479 | 302 | 0 | 31 | **146** |
| Components | 228 | 127 | 1 | 27 | **74** |
| Library | 56 | 56 | 0 | 0 | **0** |

Sample read back from the file: `BOUND 2476:12066 asked 'ui/11 · caption' —
file says 'ui/11 · caption' — OK`.

496 unbound nodes have **no exact style to bind to**, and the same read says why:
`offLead=161` in Templates, `offLead=72` in Components, overwhelmingly AUTO. A
node at Inter Regular 13 with AUTO leading matches nothing in a ramp whose every
entry carries a pixel leading. CONF-1-14's ordering — *"correct the leading
FIRST, or there is nothing on the ramp to bind to"* — is now **measured rather
than asserted**, and it is the single largest lever left on these sections.

I did not fire it. Setting AUTO leading to a ramp value changes every affected
node's height; `verify-invariants.mjs` treats vertical overflow inside a
clipping frame as a scroll region and cannot see the damage; and the founder's
acceptance for this file is a board screenshot beside a live screenshot. A
~400-node vertical-rhythm change fired blind on the last calls of an exhausted
quota is the shape of edit this arc has already had to repair twice. The safe
per-section procedure is written out in
`plans/sweep-b-04-leading-blocks-binding.json`, and the binder is proved and
idempotent — one call per pass once the leading is on the ramp.

---

## 5. What I examined versus what I only counted

**Examined — read node by node, first-hand, this session:**

- `2040:8372` — the section, all 3 component sets and all 21 variants, before
  and after.
- `781:4433`, `781:4372`, `782:4402`, `1138:13394` — every TEXT node and every
  control-shaped frame on each, with strings and geometry.
- Captions `788:4312`, `788:4315` — full strings before and after.
- `813:4498`, `1711:8406`, `807:7269` — full ancestor chains.
- The 4 canvas toolbars `642:2928`, `642:2652`, `807:4330`, `807:6778` — layout
  mode, padding, content extent.
- Every one of the 41 drained nodes and the 1 bound node — each written and
  re-read in the same call.
- Type-ramp aggregates for `1084:4527`, `1938:8372`, `2040:8372` — every TEXT
  node walked for size, leading, weight and style binding.

**Counted, not examined:**

- **The other 43 boards of `1776:8373` Brand.** I drained 8 and cleared 3. Brand
  is 51 boards. I never ran the type-ramp scan over Brand at all — the call that
  would have (`sweep-b-section-scan.mjs`, written and preflighted) is the one
  that hit the cap. **Brand's off-size / off-leading / off-token-paint /
  4px-grid figures are UNMEASURED, before and after.**
- **The "after" DS state of all four sections.** Same lost call. Every "after"
  number in §0 is computed from my read-backs, not from a fresh walk.
- **The 4px grid (CONF-1-19), auto-layout absence (-20), off-grid board y
  (-22)** — the brand pass listed these as NOT COVERED and they are still not
  covered. The scan that would have measured them died with call 11.
- **The 37 `#000000` hotspot nodes** — I accepted the brand pass's
  classification rather than re-enumerating them.
- **`1138:13413 Templates · empty`** — stranded in the Insert section; not read,
  not moved, needs the Insert owner.
- **Four cached SWEEP-FULL defects in Templates** (`807:7252`'s six overflowing
  cards, `813:4489`'s 72px modal overflow, `778:4102`'s eight, `807:6694`'s
  canvas overflows) — carried from the 2026-09-06 cache, **not re-measured by
  me**, and filed rather than fixed. Given that the fifth item on that same
  cached list (VIS-3-30) turned out to be already fixed, **treat all four as
  unverified leads, not as open defects.**
- **No screenshot comparison.** The founder's acceptance is board vs live, side
  by side. I did neither. Everything above is measurement, which is a different
  and weaker thing.

## 6. Files

Plans: `plans/sweep-b-00-manifest.json` · `sweep-b-01-brand-text.json` ·
`sweep-b-01-brand-text-HELD.json` · `sweep-b-02-library-variants.json` ·
`sweep-b-03-audit-templates-components.json` ·
`sweep-b-04-leading-blocks-binding.json`

Scripts added: `sweep-b-read.mjs` · `sweep-b-library-layout.mjs` ·
`sweep-b-audit-fixes.mjs` · `sweep-b-toolbar-fit.mjs` ·
`sweep-b-bind-sections.mjs` · `sweep-b-section-scan.mjs` (**written,
preflighted, never successfully run**).

Modified: `drain-offtoken.mjs` gained `--chunk=N`. Its CHUNK was 12 for payload
safety; at 39 rows the real payload is 3,854 chars against a ~20,000 cap. At 200
calls a day the batch size *is* the budget — 39 promotions cost 1 call instead
of 4. Every new script was parse-checked against its **real** payload with
`preflight-sandbox.mjs` before a call was spent; all passed.
