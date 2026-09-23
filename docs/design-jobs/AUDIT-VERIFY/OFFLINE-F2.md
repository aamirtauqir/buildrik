# Offline verification — external audit findings F15…F28

**Scope:** ids `F15`–`F28` of `docs/design-jobs/AUDIT-VERIFY/ALL-FINDINGS.json`, checked
against this repo's own record only. **Zero Figma MCP calls were made.** Nothing below
rests on re-reading the file; every citation is a committed (or working-tree) path and line.

**What "offline" can and cannot settle.** Four of these fourteen are decidable to the
character from local files — F22, F24, F26, F27 — because the repo carries the file's own
dumps (`V2-TO-V1/DISCOVERY.md`, `V2-TO-V1/V2-CORPUS-6-12.md`, `findings/BOARD-BASELINE.json`)
and, for two of them, the generator source that wrote the nodes. Three more are settled by
reading what this arc's own scripts do (F21, F25, F28). The rest are dispositions, not
re-measurements, and say so.

**Headline:** three findings (F22, F27, and 30 of F28's 31) are artefacts this arc created
or, in F28's case, *is*. Two more (F19, F25) cite as evidence a board or a marker that
landed on 2026-09-07 as part of the fix.

---

## Summary table

| id | already known? | disposition | offline verdict |
|---|---|---|---|
| F15 | NO | silent — board explicitly outside every plan | LIKELY-REAL |
| F16 | YES (`UX-F-22`) | landed **as a rule on a new board**, drawing untouched | LIKELY-REAL |
| F17 | NO (precedent exists for Insert) | silent; section measured 0% by read-back | UNDETERMINED-NEEDS-FIGMA |
| F18 | YES, verbatim (`FIG-F-45`) | **PENDING** — "NONE of these was applied" | LIKELY-REAL |
| F19 | YES (`UX-D-14`) | landed as a **new specimen beside** the old sections | LIKELY-REAL (self-inflicted) |
| F20 | PARTIAL | clipping half repaired on a *different* board; status-dot half silent | LIKELY-REAL (partly stale) |
| F21 | PARTIAL — the retirement is this arc's own | **no rewire queued or landed**; host board out of scope | LIKELY-REAL (self-inflicted) |
| F22 | YES (mechanism, dismissed as a one-off) | self-inflicted today; **understated 13 → 3** | LIKELY-REAL |
| F23 | YES — and disposed the *other* way | `NOT-APPLICABLE — recorded so it is not re-filed` | CONTRADICTED-BY-RECORD |
| F24 | YES (the board name says it) | closed ALREADY-CORRECT on naming only | LIKELY-REAL |
| F25 | the "[not-implemented]" half is this arc's mark | overlap half never measured; detector is blind to the class | LIKELY-REAL |
| F26 | NO | silent — labels are `slice(0,4)` in committed source | LIKELY-REAL |
| F27 | NO | silent; section "NEVER READ", panels added today 04:28 | LIKELY-REAL (self-inflicted) |
| F28 | YES — **as the fix, not the defect** | 30/31 are subtitles this arc set `visible=false` today | CONTRADICTED-BY-RECORD |

---

## F15 · Canvas-specific footer persists in full-page Settings — `638:2378`

**already_known: NO.** The closest rows are about a different complaint:
`V2-TO-V1/REGISTER.md:323` (`UX-F-34`, *"The footer is the shell's only always-on statement
of what is selected, and it is read-only"*) and `V2-TO-V1/REGISTER.md:248` (`UX-F-13`,
*"Full-page mode replaces the canvas and the inspector… There is no global 'back to
canvas'"*). Neither says the footer keeps reporting canvas context **on a Settings board**.

**disposition: silent, and explicitly out of coverage.**
`V2-TO-V1/reports/settings.md:201` — *"**No board was changed. Zero of 46. No node was read.
Zero.**"*
`V2-TO-V1/reports/settings.md:209` — *"**12 of the 46 boards are outside every plan**:
`638:2378` General, `638:3070` SEO, `639:2754` Export…"*
Section `1776:8387` is not one of the eight sections dumped in `V2-TO-V1/DISCOVERY.md`
(`grep -n '^## SECTION' V2-TO-V1/DISCOVERY.md` → `1779:2, 1776:8388, 1776:8373, 1776:8383,
1084:4527, 1938:8372, 1776:8384, 1779:5`), so no local string dump of this board exists.

**counter_evidence: none — the local record corroborates the premise instead.**
`docs/design-jobs/baselines/figma-page-1-3-pre-reorg.tsv` (columns `id · size · prototype
targets · name`, per `docs/design-jobs/IA-AUDIT.md:344-345`) carries
`638:2378 <tab> 1440x900 <tab> 52:2 <tab> S7 · Settings · General` — i.e. this board is a
**full 1440×900 shell frame**, not a 280-wide panel. Every other 1440×900 shell board the
repo dumped carries the footer strings the audit quotes:
`V2-TO-V1/DISCOVERY.md:133` `T 53:20 "Section · Hero"`, `:147` `T 53:21 "680 × 250"`,
`:154` `T 53:23 1343,8 "Desktop · 100%"`.

**verdict_offline: LIKELY-REAL** — the board is a full-shell 1440×900 frame that no pass in
this arc opened, and the exact footer strings the audit quotes are the ones every sibling
shell board in the repo's own dump carries.

---

## F16 · Zoom and device controls have competing representations — `52:2`, `2855:12407`

**already_known: YES.** `V2-TO-V1/REGISTER.md:256` — `UX-F-22`, *"Zoom has three independent
implementations that step differently. The footer's percentage flyout emits
ZOOM_IN/ZOOM_OUT… the floating canvas bar binds Cmd+= / Cmd+- itself…"*. Also `UX-F-28`
(two dead viewport controls) and `UX-F-24` (device change does not fit).

**disposition: landed — but as a written rule on a NEW board, not as an edit to `52:2`.**
`V2-TO-V1/CHECKLIST.md:271` — *"| `UX-F-22` | shell | canvas / footer · 13 · Command palett… |
IMPLEMENTED | VERIFIED — read-back |"*.
`V2-TO-V1/reports/shell-gap.md:40` — *"| **UX-F-22** three zoom implementations |
**IMPLEMENTED** | `2855:12407` block 2 (`2875:12436`, 430×80 @16,198) | same rename
read-back |"*.
`V2-TO-V1/reports/shell-gap.md:45` quotes the read-back verbatim: *"`OK: chrome-ui
BreakpointSwitcher is the one (CanvasFooterToolbar.tsx:318-331). DeviceSelector and
useDeviceZoom have no call site — delete both. (UX-F-28)`"*.

**counter_evidence: the drawing the audit is looking at was never touched, and the repo
proves it still says what the audit says it says.** `V2-TO-V1/DISCOVERY.md:71`
`BOARD 52:2 100,379 1440x900 layout=VERTICAL S1 · Editor — ASSEMBLED (1440, drawer pinned)`,
then in the same board's children:
`:76` `T 52:65 8,3 "Desktop ▾"` · `:127` `T 462:3969 "W"` · `:128` `T 462:3975 "M"` ·
`:131` `T 462:3971 "D"` · `:132` `T 462:3973 "T"` · `:140` `T 462:3995 "100%"` ·
`:154` `T 53:23 1343,8 "Desktop · 100%"`.
That is the W/D/T/M strip, its own `100%`, a topbar `Desktop ▾` **and** the global footer's
`Desktop · 100%` — three device/zoom representations on one board. `V2-TO-V1/COVERAGE.md:232`
measures `09 · Canvas` at `13% | 13% | 2/2 of 15`.

**verdict_offline: LIKELY-REAL** — the finding is answered in the register and stated on a
new decision board, but the assembled canvas board still carries all four competing readouts
in the repo's own node dump.

---

## F17 · Gallery thumbnails are placeholders — `641:2487`

**already_known: NO for Templates.** The identical defect class is known and fixed for the
*Insert* panel: `V2-TO-V1/REGISTER.md:50` — `UX-A-05`, *"BLOCKS is the one group in Insert
drawn as a picture grid, and it has no pictures. The card renders `b.preview`… so all 50
cards fall through to an empty grey 80x136 rectangle"* — landed as a truth mark
(`V2-TO-V1/queue-state.json` → `insert-truth-marks#1` `{"status":"OK", … "op":"rename"}`,
detail *"Insert · blocks-expanded — [not-implemented] the thumbnails…"*). Nothing equivalent
exists for `641:2487`.

**disposition: silent.** The board was measured at board level only —
`V2-TO-V1/plans/brand-08-templates-components.json:16` — *"`641:2487`: Templates · gallery —
280x812, 22 TEXT, 16 bound"* — and its interior was never read: the Templates audit's own
"what I examined" list (`V2-TO-V1/reports/sweep-brand-templates.md:322-330`) names
`781:4433`, `781:4372`, `782:4402`, `1138:13394` and **not** `641:2487`.

**counter_evidence: coverage says nothing landed on this section at all.**
`V2-TO-V1/COVERAGE.md:40` — *"| 0% | 0/14 | 11 · Templates |"*; `:60` — *"**Never audited** —
`11 · Templates`, `10 · Components`, `28 · Library`, `24 · Notes` drew no findings in the UX
lanes at all."* The later measured table still reads `V2-TO-V1/COVERAGE.md:228`
*"| 0% | 21% | 0/3 of 14 | 11 · Templates |"* — **A = 0%**, i.e. zero applier read-backs
inside any Templates board.

**verdict_offline: UNDETERMINED-NEEDS-FIGMA** — no local file records what is drawn inside
`641:2487`, so the claim cannot be confirmed or refuted offline; the repo's own Insert
precedent (`UX-A-05`) makes it plausible and the section is measured at 0% coverage, so
nothing in this arc would have changed it either way.

---

## F18 · Unavailable brand components look linked and actionable — `641:2546`

**already_known: YES, and almost word-for-word.**
`V2-TO-V1/plans/brand-08-templates-components.json:74` — *"FIG-F-45 — `641:2546` draws a
'FROM BRAND' section with rows badged 'linked'. No brand-linked component exists in the
model; `ComponentDefinition` has no field that could carry one and the panel renders ONE
section (`ComponentsTab.tsx:233` says so in its own comment)."*

**disposition: PENDING, and stated as such.** Same file, the enclosing key is
`identified_not_covered`, whose `note` reads: *"found while working, out of my lane, recorded
so it is not lost. **NONE of these was applied and NONE was read back.**"* and whose
`why_not_covered` reads: *"FIG-F is a previous arc's lane and is not one of the board-level
lanes in `_board-level.json` that this arc assigned me."*

**counter_evidence: none — the record agrees the board is untouched.** The Components work
that *did* land is enumerated at `V2-TO-V1/reports/sweep-brand-templates.md:186-206`
(`781:4433`'s footer hidden, caption `788:4315` rewritten, `641:2599` repaints,
`1712:8391` promoted) — `641:2546` is not among them. `V2-TO-V1/COVERAGE.md:233` measures
`10 · Components` at *"| 0% | 10% | 0/1 of 10 |"* — **A = 0%**.

**verdict_offline: LIKELY-REAL** — the repo filed this exact finding with its own code
citation and explicitly recorded that it was never applied.

---

## F19 · Two adjacent motion systems compete for the same task — `807:8342`, `2865:22206`

**already_known: YES.** `V2-TO-V1/REGISTER.md:55` — `UX-D-14`, *"The panel has TWO animation
systems, adjacent in every element profile, that do not acknowledge each other."*

**disposition: landed — by BUILDING the MOTION specimen the audit points at.**
`V2-TO-V1/REGISTER.md:55` verdict cell: *"IMPLEMENTED | agent read-back — UX-D-14 —
IMPLEMENTED. Board `2865:22206` 'Inspector · MOTION' built in section `1776:8381` by
build-inspector-sta[tes.mjs]"*; identically for `UX-D-15`/`:157`, `UX-D-16`/`:158`,
`UX-D-28`/`:299`; receipts at `V2-TO-V1/plans/zz-receipts.json:55,60,65,70`.
`V2-TO-V1/reports/inspector-boards.md:36` describes it as *"`Inspector · MOTION · one
section` @1360,2824, **clone of `2430:11940`**"*.

**counter_evidence — the arc CREATED the thing the audit is complaining about.** The finding
says *"A newer MOTION specimen exists elsewhere"*; that specimen is this arc's fix, added
**beside** the untouched Text profile rather than replacing its two sections:
- `V2-TO-V1/reports/inspector.md:161` — *"| `QA-C-02` | `807:8342` draws 12 section headers
  under '2 of 11'; delete `807:8399` LINK + chevron, re-stack −28 | folded into `UX-D-17` |
  **BLOCKED** |"* — `807:8342`'s own section stack is still unedited.
- `V2-TO-V1/COVERAGE.md:131` — *"| 08 · Inspector | 7/40 | **7/40** by metric A · **24/40**
  by metric B |"* — the drawing count did not move.
- The new specimen has its own unrepaired defect: `V2-TO-V1/OVERPRINT-LARGE-REVIEW.md:37` —
  *"150px  2865:22206  Inspector · MOTION · one section"*.

**verdict_offline: LIKELY-REAL** — the register calls `UX-D-14` IMPLEMENTED on the strength
of a new board, while the element profile the audit inspected was measured as unchanged
(`7/40` metric A) and its own header defect is still `BLOCKED`.

---

## F20 · Status and mode explanations are visually ambiguous — `1333:7162`

**already_known: PARTIAL — both halves are observed in the record, neither is filed as a
defect.**
The orange dot and the settled-state footer were seen **in the same screenshot** and not
connected: `V2-TO-V1/SHOTS.md:76-77` — *"Footer line: `Brand is up to date`. The counts carry
small status dots, which matches the `dirty-dot` paint the conformance scan found
(`1751:8403`, `#8E4B10`)."*
The Beginner-mode cramping is measured, on a sibling board:
`V2-TO-V1/RENDER-DEFECTS-brand.txt:8` — *"CLIPPED `154:132` Brand · root · Beginner mode
`154:186` needs 32px, has 28"*.

**disposition: the clipping half LANDED; the status-naming half is silent.**
`V2-TO-V1/COVERAGE.md:545-547` — *"`fix-clipped-text.mjs` (new — nothing in the repo repaired
the CLIPPED class) un-clipped **five of the six** Brand text nodes, 28 → 32px each. The
sixth, `154:25`, was **REVERTED by its own guard**"*. `154:186` is one of the five, so the
Beginner text was un-clipped on 2026-09-07.

**counter_evidence:**
1. The clip was on `154:132` (*Brand · root · Beginner mode*), **not** on `1333:7162` which
   the audit names — `V2-TO-V1/RENDER-DEFECTS-brand.txt` lists 12 Brand defects and
   `1333:7162` is on none of them.
2. The record flags two *other* unresolved things on this exact board that the audit does not
   mention: `V2-TO-V1/SHOTS.md:81-83` — *"A grey block sits below the footer, roughly 60% of
   the panel width… Candidate stray node, candidate legitimate spacer"* — and `:86-89` — the
   `#3F83F8` active segment (Flowbite blue-500, not the accent).
3. `V2-TO-V1/DISCOVERY.md:4065` shows the board's own name already carries a
   `[not-implemented]` marker for the shared-theme strip.

**verdict_offline: LIKELY-REAL for the unnamed status dot** (the repo saw the dot and the
"up to date" line together and never asked how they relate) — **LIKELY-STALE for the
cramped Beginner explanation**, which was measured at 4px and repaired on 154:132 the same
day, though never re-measured on `1333:7162`.

---

## F21 · The site-menu prototype still routes to retired destinations — `642:3538 → 159:2`, `926:4484 → 817:4774`, `1172:4895 → 1172:4867`

**already_known: PARTIAL, and the retirement is this arc's own act.**
The three *source* node ids the audit names — `642:3538`, `926:4484`, `1172:4895` — appear
**nowhere in the repo outside `AUDIT-VERIFY/`** (`grep -rl` over `docs/design-jobs/` returns
only `ALL-FINDINGS.json` and `audit2.txt` for each). The *destinations* are all locally
attested as retired:
- `1172:4867` — retired **today** by this arc.
  `V2-TO-V1/plans/settings-truth-marks.json:4-6`: `{"op":"rename","id":"1172:4867","name":
  "RETIRED — Project settings modal (⌃,) · superseded by the full-page Settings per
  UX-I-30…","expect":"Project settings"}`. It landed:
  `V2-TO-V1/queue-state.json` → `"settings-truth-marks#0": {"status":"OK", "detail":"RETIRED
  — Project settings modal (⌃,) · superseded by the full-page Settings per UX-I-30…",
  "at":"2026-09-07T04:39:27.831Z","op":"rename"}`.
- `159:2` — its live name already ends `— RET…`:
  `V2-TO-V1/RENDER-DEFECTS-PAGE.txt:6` — *"CONTAINER `159:2` Inspector · single-selection —
  RET `159:74` "control" right +4"*.
- `817:4774` — carried in the Publish lane as one of the boards in section 14 that was
  never opened (`V2-TO-V1/reports/publish.md:183`).

**disposition: no rewire was ever queued, let alone landed.** `queue.json` holds exactly six
`rewire` rows and every one is a Content crumb edge:
`{"key":"content-dynamic-pages-edges#0"…"op":"rewire","id":"2429:12111","from":"149:84",
"to":"149:50"}` and its five siblings `#1…#5`. None touches `642:3538`, `926:4484` or
`1172:4895`. The host board is explicitly **out of scope and untouched**:
`V2-TO-V1/reports/shell.md:177-179` — *"**Three shell-owned surfaces live outside my four
sections and were not touched:** the Site menu `642:3401` and the five Issues boards
`164:2`/`164:22`/`164:35`/`164:42`/`164:57` in **section 25 · Reference**, and the
keyboard-shortcuts overlay `815:4518`… My new boards restate the target design; they do not
correct those drawings."*
`V2-TO-V1/reports/shell-gap.md:117-118` repeats it: *"**The out-of-section shell surfaces are
still untouched** — the Site menu `642:3401` and the five Issues boards in section 25."*
`V2-TO-V1/reports/shell.md:116` says the arc answered `UX-F-29` with a *new* board instead:
*"the shipped menu board `642:3401` is in **section 25**, outside my scope; N7 restates the
target rather than editing it | BLOCKED-ON-QUOTA"*.

**counter_evidence — the only wiring invariant this arc checked is blind to this defect
class.** `V2-TO-V1/OUTCOME.md:16` — *"| prototype edges | 3217 → **3579**, dangling **0**
throughout |"*. An edge into a board that still exists but has been *renamed* RETIRED is not
dangling, so `verify-invariants.mjs` reports clean while the route is dead in meaning.
Separately, `V2-TO-V1/REFUTED-AUDIT.md:44-65` records that the same rename cites `UX-I-30`,
which `V2-TO-V1/REGISTER.md:341` quarantines as `DO-NOT-IMPLEMENT` (QA-refuted), and that the
repair — *"`fix-refuted-citation.mjs` repoints it at `2797:404-406`… **Queued.**"*
(`REFUTED-AUDIT.md:64-65`) — has **not** landed.

**verdict_offline: LIKELY-REAL** — the retirement of `1172:4867` is this arc's own write from
04:39 today, the arc grew the prototype graph by 362 edges without repointing a single one
away from a retired board, and the board holding the three controls is on record as
deliberately untouched.

---

## F22 · Section totals and content types are not reliable screen counts — `1776:8385`, `1776:8381`, `1776:8374`

**already_known: YES — the mechanism is written down, and dismissed as a one-off.**
`V2-TO-V1/CHECKLIST.md:11-14` — *"`board-baseline.mjs` (per-section board counts diffed
against a baseline taken before the first write), and `verify-applied.mjs`… — **83 sampled,
82 matched, 1 divergence explained** (a section name carrying a live board count that
`add-state-board` had since bumped)."* That is exactly this defect, recorded as an
explanation for one sampled row rather than as a page-wide condition.

**disposition: real, self-inflicted by today's arc, and understated by the audit.**
The repo carries the before and after in one tracked file.

*Before* — `git show HEAD:docs/design-jobs/findings/BOARD-BASELINE.json`, `"taken":
"2026-09-06"`, `"total": 927`: **every one of the 29 sections has `name` count == `n`.**
Sample: `"01 · Shell · 34", n 34` · `"08 · Inspector · 41", n 41` · `"16 · History · 35",
n 35`.

*After* — the working-tree `docs/design-jobs/findings/BOARD-BASELINE.json:2` `"taken":
"2026-09-07"`, `:4` `"total": 1031`: **13 of 29 sections disagree**, including the audit's
three:

| line | section | title says | children | audit says |
|---|---|---|---|---|
| `:97-99` | `1776:8385` `01 · Shell · 34` | 34 | **56** | 34 vs 56 — **exact match** |
| `:42-44` | `1776:8374` `16 · History · 43` | 43 | **49** | 43 vs 49 — **exact match** |
| `:77-79` | `1776:8381` `08 · Inspector · 51` | 51 | **52** | says 56 — local file says **52** |

The ten the audit missed, from the same file: `07 · Brand` 51/52 · `06 · Content` 46/47 ·
`15 · Publish` 24/25 · `02 · Insert` 28/29 · `17 · Compare` 16/17 · `18 · Review` 38/39 ·
`21 · Settings/S7` 48/49 · `13 · Command palette` 13/15 · `09 · Canvas` 14/16 ·
`22 · Ecommerce` 5/6.

**Cause, and it is this arc's:** `V2-TO-V1/OUTCOME.md:14` — *"| boards on the page | **927 →
1031** (+104), growth only; no section ever lost a board |"*. Boards were added and the
section renamer was not re-run.

**counter_evidence / how cheap the fix is.** The names are **generated**, so one script run
closes the whole finding: `scripts/figma/order-sections.mjs:74` —
`s.name = num + " · " + label + " · " + n + (note ? " — " + note : "");` — with `n` from
`:59` — `const n = s.children.filter(c => typeof c.width === "number").length;`.
`docs/design-jobs/findings/COMPILE-C.md:32-36` already states this: *"### 0.1 Section names
are GENERATED. Three rows ask for a rename that cannot survive… **A section renamed in Figma
is overwritten on the next run of that script.**"*

The audit's second half — *"Children include captions, specifications and retired states"* —
is also the repo's own: `n` counts any sized child, and
`V2-TO-V1/reports/sweep-brand-templates.md:181-182` records *"a caption placed as a direct
section child counts as a board in `verify-invariants.mjs`"*. A third count for the same
sections disagrees again: `V2-TO-V1/COVERAGE.md:29-30` — *"COVERAGE's denominators (35 / 14 /
10 / 3) are smaller than the sections' own board counts (51 / 18 / 12 / 3)"*. And even 1031
is stale: `V2-TO-V1/reports/sweep-brand-templates.md:41,55` reads *"sections: 29  boards:
1043"* and *"| boards | 1031 | **1043** | **+12, and not mine** |"*.

**verdict_offline: LIKELY-REAL** — decidable offline from a tracked file: 0 of 29 sections
drifted before this arc, 13 of 29 drift after it, two of the audit's three numbers match to
the digit, and one `order-sections.mjs` run fixes all thirteen.

---

## F23 · Prototype and engineering material contaminates user-facing specimens — `170:2`, `2429:12111`, `140:2`

**already_known: YES — and the repo examined this exact population twice and filed it as
NOT a defect.**
`docs/design-jobs/IA-AUDIT.md:17-18` — *"Prototype graph: **2,489 edges** — 350 at frame
level, **2,139 on hotspot children**."* (post-reorg re-measure: *"it measures 416/2,073"*,
`IA-AUDIT.md:351`).
`docs/design-jobs/IA-AUDIT.md:61-63` files that population as a **strength**: *"**Flow wiring
is in good shape**: 5% orphans and 3% dead ends across 397 screens is a healthy graph, and
2,139 hotspot-level edges means transitions are scoped to real controls rather than
whole-frame click-anywhere."*
Their paint was measured and exempted: `V2-TO-V1/reports/brand.md:94` — *"**All 37 are
prototype markers.** Every layer name begins `hotspot/back·`, `hotspot/state·`,
`hotspot/row·` or `hotspot/alt·`… Same exemption `TYPE-COLOR-SYSTEM` §2d already records for
the 291 `#0000FF` hotspot nodes… | **NOT-APPLICABLE — recorded so it is not re-filed** |"*
(`docs/design-jobs/TYPE-COLOR-SYSTEM.md:218`).
The repo's own detector skips them by construction:
`scripts/figma/render-defects.mjs:11-12` — *"Exempt: nodes named `hotspot/*` (the file parks
those off-board on purpose)."*

**disposition: the arc ADDED to the population rather than reducing it.** `queue.json`
carries 82 `hotspot` rows (69 executed — 55 `OK`, 10 `MISSING`, 2 `MISSINGTARGET`, 2 `SAME`
in `queue-state.json`), plus 81 rows across the seven `V2-TO-V1/plans/*hotspot*.json` files
(`media-03-hotspots` 46, `history-hotspots` 8, `pages-hotspots-11` 8, `shell-hotspots` 8,
`insert-hotspots` 7, `review-hotspots` 3, `settings-hotspots` 1); net effect
`V2-TO-V1/OUTCOME.md:16` *"prototype edges | 3217 → **3579**"*.
The "technical implementation paragraphs occupy product UI" half is the arc's **stated
method**, not an accident: hundreds of truth-mark renames write `file.tsx:line` citations
into board names — e.g. `V2-TO-V1/queue-state.json` → `insert-truth-marks#1` detail *"Insert ·
blocks-expanded — [not-implemented] the thumbnails. shared/types/block.ts:25 declares
preview?: string and noth…"*.

**counter_evidence: one hotspot-clutter defect IS filed and is much more specific than
F23** — `V2-TO-V1/CONTRADICTIONS.md:173-175`: *"**`INS-DEF-01`** — seven hotspots stacked on
`137:2`: `787:4303` at 120,778 160×34 *contains* six more at exactly 130,784 150×28. **Six
dead edges**; five name boards in other modules."*

**verdict_offline: CONTRADICTED-BY-RECORD** — as an observation the counts are consistent
with the repo's own (912 hotspot nodes against 2,073–2,139 hotspot-level edges), but the
disposition is already made and it is the opposite one: the hotspot layer is filed as healthy
scoping and explicitly exempted from the colour ratchet, and the engineering prose on boards
is this arc's deliberate contract. F23 re-files something the repo closed as
`NOT-APPLICABLE — recorded so it is not re-filed`.

---

## F24 · The editor-page client review echo is a schematic — `1339:7171`

**already_known: YES — the board's own name says so, and the repo has its full text.**
`V2-TO-V1/DISCOVERY.md:5243` —
*"BOARD `1339:7171` 100,220 1280x720 layout=NONE Client sign-off · A · viewing · 1280 — echo
of 1:6 at the 1280×720 minimum fold; canonical `23:21` is 1280×900. Kept because Figma
rejects cross-page NAVIGATE and the editor prototype must reach this state."*

All three strings the audit quotes are in that same dump, verbatim:
`:5249` — `T 1339:7176 24,24 "(the site, page tabs, and Your notes)"`
`:5247` — `T 1339:7173 24,20 "{Agency}"`
`:5250` / `:5251` — `T 1339:7179` / `T 1339:7177` *"Signed as {Name}. You are looking at the
version sent to you {date} — later edits will not change it."*

**disposition: examined and closed — but only on the naming question.**
`V2-TO-V1/reports/sweep-review.md:189` — *"| `1339:7171` A · viewing | `canonical 23:21 is
1280×900` | `23:21` | **ALREADY-CORRECT** |"* (five of six such boards refuted before any
write, `sweep-review.md:180-186`). The schematic body and the unresolved placeholders were
never raised.

**counter_evidence: the audit under-counts — this is a section-wide template, not one
frame.** `{Agency}` and the same `is asking for your feedback` line appear on at least five
sibling boards in the same dump: `V2-TO-V1/DISCOVERY.md:5253` (`1339:7188`, D · approved),
`:5258` (`1339:7195`, C · changes-requested), `:5263` (`1339:7202`, F · expired), `:5268`
(`1339:7209`, F · revoked), `:5273` (`1339:7216`, F · not-found) — and `:5237`, `:5278`,
`:5287`, `:5290` on four more boards in the same section.
Coverage: `V2-TO-V1/COVERAGE.md:38` *"| 10% | 1/10 | 19 · Client sign-off |"* → reported
`2/10` at `:134`, never re-measured.

**verdict_offline: LIKELY-REAL** — confirmed to the character offline; the record knows the
board is a deliberate cross-page echo and never questioned that its content is a schematic
with unresolved placeholders, which is true of six boards in the section, not one.

---

## F25 · The interaction-testing reference covers content with its console — `817:4856`

**already_known: the "explicitly marked not implemented" half is this arc's OWN mark, landed
today.**
`V2-TO-V1/plans/publish-marks.json:63` —
`{"id":"817:4856","name":"[not-implemented] Preview · interaction test — the in-shell
PreviewOverlay strips every <script> (ExportUtils.ts:38-43) AND renders its iframe with
sandbox=\"\" (PreviewOverlay.tsx:106), so no interaction, form or internal link can run
there…","why":"QA-A-17, UX-E-17"}`
It landed: `V2-TO-V1/queue-state.json` → `"publish-marks#12": {"status":"OK","detail":
"[not-implemented] Preview · interaction test — the in-shell PreviewOverlay strips every
<script> (ExportUtils.ts:38-43) ","at":"2026-09-07T04:39:16.857Z","op":"rename"}`.
So the audit's corroborating detail — *"The frame is also explicitly marked not
implemented"* — is a 04:39 write from this arc, not a pre-existing signal.

**disposition: the overlap half is silent and provably unmeasured.**
`V2-TO-V1/reports/publish.md:180-184` — *"**Seven of the eight boards in section 14 were
never dumped.** I have their ids and full names from the section listing… but **I never read
inside `817:4899`, `817:4856`, `817:4950`, `1157:4593`, `879:6901`, `879:6896`, `817:4774`,
or `2429:11904`.**"*
`V2-TO-V1/reports/publish.md:49` (`UX-E-17`) reaches this board only to correct its marker
text; status `BLOCKED-ON-QUOTA`.

**counter_evidence — and why "the local sweep found nothing" is NOT evidence against F25.**
The page-wide sweep found 10 defects in section `1779:4` and **every one is on `817:4899`,
none on `817:4856`** (`V2-TO-V1/RENDER-DEFECTS-PAGE.txt`, block `--- 1779:4 (10)`). But the
detector cannot see this class: `scripts/figma/render-defects.mjs:8-45` documents six classes
— OUT-OF-BOUNDS, TEXT OVERFLOW, SQUEEZED, OVERPRINT, ESCAPES, CONTAINER — and all of them
are parent↔child relations or a *"full-width title and a right-aligned sibling"*. A console
FRAME lying over sibling card FRAMEs, both inside their board, violates none of them.

**verdict_offline: LIKELY-REAL** — the overlap was never measured (the board's interior was
never opened, on record), the repo's detector is structurally blind to sibling-frame overlap,
and the "not implemented" the audit reads as independent corroboration is this arc's own
rename from 04:39 today.

---

## F26 · The final V2 shell still uses cryptic rail labels — `2797:22382`

**already_known: NO.** No file in `docs/design-jobs/` raises the rail labels. The board is
mentioned in exactly one place outside the audit — `V2-TO-V1/V2-CORPUS-6-12.md:736` — and
that is a dump, not a finding.

**disposition: silent, and confirmable to the character from committed source.**
The corpus dump carries all eleven labels the audit names:
`V2-TO-V1/V2-CORPUS-6-12.md:736` — `BOARD 2797:22382 final/editor · 1440x900 40,1200 1440x900`
`:794` `"Comp"` · `:795` `"Tmpl"` · `:796` `"Pub"` · `:797` `"Hist"` · `:798` `"Rev"` ·
`:806` `"Laye"` · `:807` `"Page"` · `:808` `"Medi"` · `:809` `"Cont"` · `:810` `"Bran"` ·
`:811` `"Inse"`.

The generator proves both halves of the finding without a Figma call:
`scripts/figma/build-polished-editor.mjs:76-77` (upper six seats) —
```
 icon(cell,k,15,10, active?ACCENT:MUTED);
 put(cell,T(label.slice(0,4),7,"Medium", active?ACCENT:FAINT), …, 28);
```
a hard `slice(0,4)` at **7px**; and `:82-85` (lower six seats) —
```
for(const label of ["Tmpl","Comp","AI","Pub","Hist","Rev"]){
 const cell=F("seat2/"+label,44,40,PANEL,6); st(cell,LINE,1); put(rail,cell,8,ry);
 put(cell,T(label,8,"Regular",MUTED), …, 16);
```
— **no `icon()` call at all**, which is precisely the audit's *"lower destinations lack the
icon treatment of upper destinations."*

**counter_evidence: none.** Provenance: `git log --oneline -3 --
scripts/figma/build-polished-editor.mjs` → `cb0b50866 feat(figma): section 12 drawn at the
fidelity of the panels, not as a silhouette`; script mtime 2026-09-07 01:45.

**verdict_offline: LIKELY-REAL** — both halves confirmed offline from the repo's own node
dump and from the script that wrote the nodes.

---

## F27 · Corrected-module documentation does not match the current board inventory — `2797:559`, `2797:560`

**already_known: NO — the repo quotes the false string verbatim and lists the contradicting
inventory three lines below it, unremarked.**
`V2-TO-V1/V2-CORPUS-6-12.md:160` — *"`2797:559` — 9 · Corrected Module Screens · **19
boards** · 429 TEXT nodes · **INCOMPLETE**"*
`:164` — `BOARD 2797:560 Corrected screens — what changes, and what it depends on`
`:166` — `TEXT 2797:562 28,66 "**Five panels**, drawn at their real widths. …"`
`:172` — `TEXT 2797:568 28,206 "The **five** corrected panels are drawn below, at their real
widths, by build-polished-{insert,panels,nav}.mjs. …"`

The 19 boards are listed immediately after and include exactly the panels the audit names:
`:474` `2805:2 cms/panel · corrected` · `:494` `2805:33 lyr/panel` · `:519` `2805:76
med/panel` · `:534` `2805:104 brd/panel` · `:551` `2805:134 hst/panel` · `:576` `2805:167
rev/panel` · `:589` `2805:183 set/panel` — twelve panel-shaped boards, not five. (The audit's *"AI panels"* is the one item the corpus listing does **not**
support.)

**disposition: silent, and structurally unverifiable by the arc.**
`V2-TO-V1/V2-CORPUS.md:489-491` — *"## 9 · Corrected Module Screens — `2797:559` /
**NEVER READ — quota stop.** No board and no TEXT node of this section was fetched."*
`V2-TO-V1/reports/publish.md:191` — *"**I did not lay eyes on a single V2 board**."*
`V2-TO-V1/BRIEF.md:49` — *"**Write only inside page `1:3`.** Page `2668:2` is read-only
source."* — so the V2 page was never in this arc's write scope.

**counter_evidence — and the cause is today's.** The seven extra module panels were written
by `scripts/figma/build-polished-modules-a.mjs:71,97,118,144` (`cms/`, `lyr/`, `med/`,
`brd/`) and `build-polished-modules-b.mjs:74,97,113` (`hst/`, `rev/`, `set/`), both with
mtime **2026-09-07 04:28** — after `2797:560`'s intro was authored, and the intro was never
updated. `2797:568` was itself edited on 2026-09-07 (it says *"This board owned silhouette
versions of them until 2026-09-07"*), so the sentence was touched and the number in it was
not.

**verdict_offline: LIKELY-REAL** — confirmed offline from the repo's own corpus dump plus the
two generator scripts; self-inflicted by today's 04:28 build, on a page the arc's brief
declared read-only.

---

## F28 · Repeated subtitle bounds require a targeted cleanup pass — `640:2440`, `640:2789`, `640:3135`, `1703:9208`

**already_known: YES — but as this arc's FIX, not as a defect.**
`V2-TO-V1/OUTCOME.md:39-41` — *"**30 Settings headers corrected** — title becomes the
breadcrumb, **the invented subtitle and the invented primary hidden**, because
`DrillInHeader.tsx:12-47` has no action slot and no children."*

**All four boards the audit cites are among exactly those 30.**
`V2-TO-V1/plans/settings-headers.json` → `structural` array, 30 rows; its `board` values are
`1703:10515, 1702:7095, 1702:7261, 1702:6931, 1702:7425, 640:3135, 1703:9208, 1703:8882,
1703:9046, 1703:9532, 1703:9370, 1703:8720, 640:2789, 1703:7760, 1703:7606, 1703:7914,
1703:7286, 1703:7127, 1703:7445, 640:2440, 1703:8232, 1703:8394, 1703:8070, 1703:8556,
640:3849, 1703:9857, 1703:10352, 1703:10022, 1703:9694, 1703:10185`.
The same 30 ids are listed in `V2-TO-V1/reports/settings.md:92` under `COVER-1-01`.

**disposition: landed, and "hidden" literally means `visible=false` with geometry retained.**
`scripts/figma/fix-settings-headers.mjs:110` — `for(const n of subs){
dropped.push("sub:"+n.id); n.visible=false; }`, with the reason at `:68-70`: *"`remove()` is
refused on an instance child — 'Removing this node is not allowed'… `visible=false` is
reversible and `remove()` is not."*
The rows that actually landed went through the queue, which does the same thing:
`scripts/figma/apply-queue.mjs:236-238` — *"/\* Hide, never remove. A drawing is not deleted
because the code cannot produce it yet… \*/"* — and `:246` `n.visible=false;`.
`V2-TO-V1/queue-state.json`: 131 header rows — **90 `OK`, 30 `SAME`, 11 `MISSING`**, ops
`delete` 71 / `rename` 30 / `text` 30. Corroborated at
`V2-TO-V1/INVARIANTS-POST.md:81-86` — *"`fix-settings-headers.mjs` threw on a single bad
instance-child id (`I1703:7981;9:7 does not exist`) and **landed none of its 30 boards**…
routed through `apply-queue.mjs` instead: **90 of 101 rows landed, and the 11 bad ids were
reported and stepped over.**"*

**counter_evidence — decisive, and it explains the audit's number.**
1. A hidden Figma node keeps its bounding box. A structural check that does not test
   `visible` will report ~30 Settings subtitle nodes sitting wherever they were. The repo's
   own detector **does** filter visibility — `scripts/figma/render-defects.mjs:139`
   `if(n.visible!==false) boxes.push(…)`, `:163` `if(c.visible===false || … ) continue`,
   `:214` `filter(c=>c.visible!==false…)` — and its page-wide sweep of the Settings section
   returned **11** defects, not 31: `V2-TO-V1/RENDER-DEFECTS-PAGE.txt:337` *"--- 1776:8387
   (11)"*, of which `1703:9208` appears as *"ESCAPES `1703:9208` S7 · Settings · Forms ·
   action-err `1703:9273` by 9 past `1703:9271`"* (a 9px sibling escape, not a header
   subtitle), `640:3135` likewise, `640:2789` only as *"CLIPPED … `I640:3119;14:22` needs
   40px, has 36"*, and `640:2440` not at all.
2. **The audit's own corroboration is the signature of `visible=false`, not of clipping:**
   *"The sampled Forms error screen omits the header subtitle visible in the node text."*
   Rendered-absent + present-in-node-text is exactly what hiding produces; a node outside a
   clipping parent would be present in the node text **and** cropped in the render, not
   omitted.
3. The genuine residual is different and smaller, and it is named: 11 of 101 rows never ran
   because their `id` fields are text fragments, not node ids — `V2-TO-V1/queue-state.json`
   → `zz-settings-headers-queue#2 {"status":"MISSING","detail":"Plausible"}`, `#3
   {"detail":"PostHog"}`, `#4 {"detail":"'"}`, `#41/#46/#51/#56 {"detail":"HSTS"}`,
   `#42/#47/#52/#57 {"detail":"security poli'"}` — a comma-splitting bug in the plan
   generator (`V2-TO-V1/plans/zz-settings-headers-queue.json`, rows 2-4 carry
   `"id":"Plausible"` / `"PostHog"` / `"'"`).
4. The measurement that would settle it does not exist:
   `V2-TO-V1/RENDER-DEFECTS-PAGE-AFTER.txt:1` is one line — *"RATE LIMITED — You've reached
   the Figma MCP tool call limit for your Full seat on the Professional plan."*

**verdict_offline: CONTRADICTED-BY-RECORD** — 30 of the audit's 31 frames are the exact 30
whose header subtitles this arc set to `visible=false` today; the repo's own detector, which
filters visibility, finds 11 defects in that section and none of them is a header subtitle.
The real open item is 11 malformed plan rows, not 31 clipped subtitles.

---

## Cross-cutting notes

1. **Five of the fourteen findings read this arc's own 2026-09-07 writes as pre-existing
   defects or as independent corroboration:** F19 (the MOTION specimen is the fix), F21 (the
   RETIRED rename landed 04:39:27), F22 (+104 boards without re-running the renamer), F25
   (the `[not-implemented]` marker landed 04:39:16), F28 (30 subtitles hidden today). F27 is
   the same shape one page over (panels added 04:28, intro not updated).
2. **`dangling = 0` is the only prototype invariant this arc checked**
   (`V2-TO-V1/OUTCOME.md:16`, `INVARIANTS-PRE.md:16`). An edge into a live-but-RETIRED board
   passes it. F21 is exactly the class that invariant cannot see.
3. **Two of the audit's "structural checks" appear not to filter `visible`** (F28) or
   `hotspot/*` (F23) — both filters the repo's own `render-defects.mjs` applies deliberately
   (`:11-12`, `:139`, `:163`, `:214`) after an earlier detector *"read 467 defects where there
   were 11"*.
4. **Section counts now disagree three ways** — the section titles, `BOARD-BASELINE.json`'s
   `n` (1031), the sweep's own read (1043, `sweep-brand-templates.md:55`), and COVERAGE's
   denominators (`COVERAGE.md:29-30`). One `order-sections.mjs` run reconciles the first two.
