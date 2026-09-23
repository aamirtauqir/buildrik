# Mirror sweep — `23 · Journeys · S-flows`, `09 · Canvas`, `13 · Command palette`

**Date** 2026-09-07 · **Page** `1:3` (write) · **Figma calls spent: 12 of the 15 allowed.**
Every row below quotes the value Figma returned **after** the write, in the same call.

## Headline

| | |
|---|---|
| Figma calls spent | **12** (1 section dump · 4 reads · 6 writes+read-backs · 1 verify) |
| boards changed (nodes written inside the board) | **3** — `817:5220`, `813:4836`, `817:4649` |
| text nodes rewritten | **16**, all `OK` (read back), 0 REFUSED, 0 MISMATCH |
| captions created | **2** (`2914:12831`, `2914:12832`) — section-parented, below their board |
| captions appended | **4** (`813:4869`, `807:7521`, `463:2378`, `172:19`) |
| boards created / deleted | **0 / 0** |
| journey boards walked | **8 interiors opened of 74**; all 74 enumerated by name + geometry |

## Coverage

Coverage counts a board as covered when a node this arc wrote lives **inside** it.
A caption sits in the SECTION, beside the board, so **captions do not move this number**
and are not counted as coverage below.

| section | before | after | what moved it |
|---|---|---|---|
| `1776:8388` 23 · Journeys | 4 / 74 | **6 / 74** | `817:5220` (12 nodes), `813:4836` (3 nodes) |
| `1779:5` 09 · Canvas | 2 / 15 | **3 / 15** | `817:4649` (1 node) |
| `1779:3` 13 · Command palette | 2 / 8 | **2 / 8** | unchanged — nothing inside a palette board was wrong; see below |

## Invariants

`node scripts/figma/verify-invariants.mjs`, run after every write:

| class | stated pre | measured after | verdict |
|---|---|---|---|
| loose nodes | 77 | **77** | unchanged |
| section overlaps | 2 | **2** | unchanged (`07 · Brand`×`06 · Content`, `12 · AI`×`13 · Command palette`) |
| board overlaps | 0 | **0** | unchanged |
| out-of-bounds children | 1 | **1** | unchanged (`1719:8421`, pre-existing) |
| dangling prototype edges | 0 | **0** | unchanged (3579 edges) |
| sections / boards | 29 / 1031 | **29 / 1043** | growth only; **none of the +12 is mine** — I created 0 boards |

---

# 1 · Publish → `817:5220 S6.4 · deploy-progress-pipeline`

**Module board it mirrors:** the Publish progress panel — corrections carried on
`note/Publish 2876:12480` (UX-E-31) and section `15 · Publish`.

The step this board draws had never been reconciled with the worker. Read first,
then corrected against `packages/dashboard/app/api/workers/publish/[jobId]/route.ts`:

- `STEPS` (`:22-28`) is **five**: Generating pages · Optimizing images · Deploying to CDN ·
  Verifying SSL · Performance check. The board drew **seven**, with different names, while
  its own board name already said *“SHIPS: the worker emits a five-step pipe…”* — the board
  contradicted its own title.
- `SKIPPED_STEPS` (`:34-37`) = `{1, 4}`: image optimisation and the Lighthouse check
  **report `skipped`, never `done`**. The board drew a green ✓ on “Optimize images” with
  the sub-line *“12 images → WebP, saved 3.2MB”* — a tick and a measurement for work the
  MVP does not do.
- **Cancel:** the last `checkCancelled(jobId)` runs at `:374`, immediately **before**
  `runVercelDeploy` at `:375`, and there is none inside it. Cancelling during the deploy
  does not stop the deploy.

| node | was | now | read-back |
|---|---|---|---|
| `817:5229` | `Build pages` | `Generating pages` | `OK 817:5229` |
| `817:5235` | `Optimize images` | `Optimizing images` | `OK 817:5235` |
| `817:5236` | `12 images → WebP, saved 3.2MB` | `Skipped — not run in the MVP` | `OK 817:5236` |
| `817:5233` | `✓` | `–` | `OK 817:5233` |
| `817:5246` | `Upload to CDN` | `Deploying to CDN` | `OK 817:5246` |
| `817:5250` | `Provision SSL` | `Verifying SSL` | `OK 817:5250` |
| `817:5257` | `Health check` | `Performance check` | `OK 817:5257` |
| `817:5258` | `Verify live site responds` | `Skipped — Lighthouse is not run` | `OK 817:5258` |
| `817:5241` | `Generate CSS` | `Generate CSS [not-implemented]` | `OK 817:5241` |
| `817:5242` | `Tree-shaken, minified` | `Not one of the five worker steps` | `OK 817:5242` |
| `817:5254` | `DNS propagation` | `DNS propagation [not-implemented]` | `OK 817:5254` |
| `817:5255` | `Waiting for SSL` | `Not one of the five worker steps` | `OK 817:5255` |

Nothing was deleted. The two steps the worker does not emit keep their drawing and carry
`[not-implemented]`, per `apply-truth-marks`' standing rule.

**Cancel wording** — the board draws a `Cancel deploy` button (`817:5260`) and had no
statement of what cancel means. The sanctioned sentence has no node to live in on a
520px board, so it is on the new caption, verbatim and unaltered:

> `OK 2914:12831 caption/S6.4 · deploy-progress-pipeline at 3340,17162 1440x72`
> *“…CANCEL: the last checkCancelled runs BEFORE runVercelDeploy (:374-375) and there is
> none inside it, so a cancel during the deploy does not stop the deploy. The sanctioned
> wording, which this board must not contradict, is: If the deploy had already started it
> may still finish. We will tell you which. Canonical for the cancelled state:
> note/Publish 2876:12480 and section 15 · Publish.”*

**Status: IMPLEMENTED.**

---

# 2 · Shell save lifecycle → `813:4836 S1.2f · save-indicator · 5-states`

**Module correction it mirrors:** `fix-save-lifecycle.mjs`, which wired the four shipped
topbar save states in `01 · Shell` (`65:2` unsaved → `2162:11660` saving → `199:2` saved /
`2162:11838` save-failed).

Read against `packages/editor/src/editor/chrome-ui/SaveStatus.tsx:18`, which is the
component the board describes: `SaveState` is **six** values — `saved · saving · unsaved ·
conflict · offline · error`. The board draws five, and gets the split wrong in both
directions:

- *Saved (fresh)* and *Saved (stale)* are **one** state — `saved` plus `savedAt` rendered
  through `formatRelativeTime`. The board presented them as two.
- **`conflict` and `offline` are drawn nowhere on it**, and the component's own header
  says those are the states that matter most.
- State 4 claimed unsaved *“appears when auto-save is paused or offline”*. Offline has its
  own copy: `offline: "Offline — not saved"` (`SaveStatus.tsx:40-51`).

| node | was | now | read-back |
|---|---|---|---|
| `813:4850` | `Green dot. Appears immediately after save completes. Transitions to 'S…` | `Green dot, straight after the save. Not its own state — saved with a fresh savedAt.` | `OK 813:4850` |
| `813:4856` | `Green dot, grey text. Relative time updates every 60s. This is the res…` | `Green dot, grey text. The same saved state as 2 — only savedAt is older. The resting default.` | `OK 813:4856` |
| `813:4862` | `Amber dot + amber text. Appears when auto-save is paused or offline. W…` | `Amber dot + amber text. Unsaved work. Offline is a SEPARATE state: Offline — not saved.` | `OK 813:4862` |

The two missing states are **not drawn** — drawing a `conflict` and an `offline` pill here
would be inventing a state board in a journey section. The absence is stated on the
caption instead: `OK 813:4869 54 -> 90px … · 2162:11660 saving · 199:2 saved ·
2162:11838 save-failed.`

**Status: IMPLEMENTED (the three false sentences), PARTIAL by decision (the two undrawn
states are named, not drawn).**

---

# 3 · Shell rail + drawer → every 1440-wide journey step

**The correction:** the rail renders exactly six ids; Publish and History have shortcuts
and no rail seat; the expanded drawer is **700**.

This is the mirror that looked like fifty boards and is one component. Read back on
`52:2 S1 · Editor — ASSEMBLED`:

```
NAMES 52:2  S1 · Editor — ASSEMBLED (1440, drawer pinned)
  2040:20649                    INSTANCE  0,0  60x812   Rail
  I2040:20649;2034:8415         FRAME     8,10   44x44  rail/Insert
  I2040:20649;2034:8418         FRAME     8,58   44x44  rail/Layers
  I2040:20649;2034:8422         FRAME     8,106  44x44  rail/Pages
  I2040:20649;2034:8425         FRAME     8,154  44x44  rail/Media
  I2040:20649;2034:8428         FRAME     8,202  44x44  rail/Content
  I2040:20649;2034:8431         FRAME     8,250  44x44  rail/Brand
```

Six seats, and they are the six shipped ids (`RAIL_FIGMA`, `tabsConfig.ts:350`). The rail
here is an **instance of the shared component**, not a second drawing — so the seat
correction reaches these steps through the component and no journey board needs editing
for it. That fact is now written down where the next sweep will find it:
`OK 463:2378 76 -> 133px … the seat correction reaches them through the component, not
board by board.`

**Status: ALREADY-CORRECT, with the read-back that proves it.** Checked on one board of
the ~50 that draw a rail; the component instance is the evidence, not the sample size.

---

# 4 · Insert → `807:6558 S1.1c · First run · Start blank (Insert drawer opens)`

**Correction to carry:** no RECENT band (recents are not built — only the storage key
`BUILD_RECENT`); FAVOURITES is the built-but-unrendered feature.

Read back: searching this board's TEXT for `recent` returns `NO-HIT`; for `favour`,
`NO-HIT`; for `block`, one hit — `807:6682 "BLOCKS"`. So the board is **already correct**
on the half that matters, and drawing a FAVOURITES band here would have made it disagree
with the module board `137:2`, which carries the same absence
(`reports/insert.md:62-63, 111`).

Recorded on the new caption rather than changed:
`OK 2914:12832 caption/S1.1c · First run · Start blank at 6340,1299 1440x54`.

**Status: ALREADY-CORRECT (cleared, not changed).**

---

# 5 · Drop feedback → `807:7301 S3.2 · drop-target · insertion-indicators`

Three boards draw this one screen: this step, `2474:12031 Canvas · drop feedback —
anatomy` (09 · Canvas) and the three boards of `26 · REVIEW · Insert` (100% covered).
`2474:12031` is the one carrying the corrections — read back this session, it already
says *“The whole visual block is gated on there being a RESOLVED drop target. Over empty
canvas there is no affordance at all”* and *“the accept cue is shown first”* (UX-A-19).

This step draws only `Drop target shown` and `Drop inside: Section > Column` and says
neither. Rather than duplicate a third drawing, the step now names the canonical one:
`OK 807:7521 54 -> 90px … an insertion line is drawn on rows that will reject the drop.`

**Status: IMPLEMENTED as a canonicity statement.** No node inside the board changed, so
this does not move coverage.

---

# 6 · Settings and Content — mirrors looked for and NOT found

Both were on the brief's list. Both are cleared by the section dump, which is evidence,
not an assumption:

- **Settings (30 headers → breadcrumbs; invented subtitle and primary button hidden
  because `DrillInHeader.tsx:12-47` can render neither).** Every `S7 · Settings · *` board
  — `1702:*`, `1703:*`, `638:*`, `639:*`, `640:*`, `1688:7195`, `1344:7165` — is a child of
  section **`1776:8387` 21 · Settings/S7**, not of `1776:8388`. The journeys section holds
  **zero** S7 boards. `302:1978/2004/2026 S3.7 · page-settings` are the Pages drawer, a
  different screen with a different header. **NOT-APPLICABLE to this section.**
- **Content dynamic pages (TEMPLATE PAGE control the panel never renders; crumb repointed
  `149:84 → 149:50`).** The four boards are `2429:12111 / 21243 / 21262 / 21281` in
  `06 · Content`. No dynamic-pages board and no `S3.12b · Data binding` board is a child of
  `1776:8388` today. **NOT-APPLICABLE to this section.**

---

# 7 · `09 · Canvas` — ordinary sweep

**9 of 15 boards opened.** One changed.

| board | verdict |
|---|---|
| `817:4649` Canvas · toolbar states | **CHANGED.** Its subtitle ended *“Keyboard shortcuts shown in parentheses.”* and the board draws no chord at all — the labels read `Snap to guides`, `Spacing`, `Grid overlay`, `Rulers`, `Badges`, bare. The shell pass has since printed the six chords (⌘; · ⌘⇧; · ⌘' · ⌘B · ⌘R · ⌘⇧X) on `2855:12407` and `2875:12449`. Read-back: `OK 817:4651 Footer bar (1440×32) toggles. Each icon has on/off state with blue hig…` → now ends *“Chords are drawn on 2855:12407 and 2875:12449, not here.”* |
| `2474:12031` drop feedback — anatomy | CLEARED — already carries UX-A-19 and the resolved-target gate, in full, with code refs |
| `2474:12065` element manipulated — resize · rotate | CLEARED — anatomy board with handle thresholds and the `role="slider"` contract |
| `2476:11972` element locked · element hidden | CLEARED — carries UX-D-02/UX-H-14/UX-H-15 verbatim (*“A locked element cannot be SELECTED…”*, hide is outside the undo stack) and records the off-token `#f38ba8` as *recorded not corrected* |
| `2476:11987` empty page — first run · after Start blank | CLEARED — variant B already draws the UX-F-33 way back (`Open Insert · Browse templates`) |
| `1176:4925` hover levels | CLEARED — four levels, no behavioural claim to check |
| `1176:4824` inline-edit toolbar | CLEARED — 18 controls, glyphs only |
| `1176:4866` context-menu · submenu anatomy | CLEARED — five submenus, no claim |
| `1175:4849` breadcrumb bar | **FLAGGED, NOT CHANGED** — it contains a stray TEXT `1720:17257` reading `view-mode · stripped-chrome — NEW ` at 6,8, which is the name of journey board `1343:7162`, not a breadcrumb. It is inside a 720x36 bar. I did not touch it: I cannot tell from one read whether it is a mis-parented label or a deliberate marker, and `remove()` is refused on instance children anyway. Next pass should look. |
| `817:4723`, `1707:8433`, `1707:8452`, `1707:8436`, `1707:8455` | **NOT OPENED** — 5 boards (zoom levels + the four Canvas · AI popovers) |
| `2855:12407` | not re-read; its read-back is in `reports/shell-gap.md` |

---

# 8 · `13 · Command palette` — ordinary sweep

**7 of 8 boards opened. Nothing inside a board was wrong, so coverage did not move.**

| board | verdict |
|---|---|
| `166:2` CmdK · empty | CLEARED — and worth stating, because it is a trap: this board draws a **RECENT** band, and unlike Insert's, this one is **built** — `commandRecents.ts` (`getRecentCommandIds` / `recordCommandRun`) feeds a `Recent` group at `CommandPalette.tsx:285-293`. Carrying Insert's *“no RECENT”* correction across on the strength of the word would delete a real feature. `SUGGESTED` is likewise honoured in code (`SUGGESTED_COUNT`, `:21`, whose comment cites this very board). |
| `166:18` typing · `166:27` results | CLEARED. Both draw two `GO TO` bands and a duplicated `Open Review panel` / `Review panel`, both chorded `R`. The code's groups are Navigation / Edit / View / History / Commands / Recent — but a group **heading is on-screen copy, and per the founder's precedence the BOARD wins on copy**. Left alone deliberately, and recorded here so the next reader does not "fix" it into a code label. |
| `166:45` no-results · `166:51` ai-offer · `166:58` disabled-command | CLEARED — `166:58`'s disabled reasons (`select two or more`, `select a group`) match `registryGuard` at `CommandPalette.tsx:168-195` exactly |
| `1177:4804` Canvas palette (⌘⇧P) | CLEARED — `Zoom to fit ⌘1` is drawn correctly, as `UX-F-06`'s closure already found. **The two-palette open decision on `2844:12186` was not touched.** |
| `2875:12449` Shortcuts · one screen | **NOT OPENED** — built by the shell gap pass, read-back in `reports/shell-gap.md` |

**One row was owed to this section and had never been drawn:** `UX-A-26`. The Insert pass
closed it `NOT-APPLICABLE — cross-module`, explicitly routing it here
(`reports/gap-settings-insert.md`), and here it stopped. The palette builds Navigation,
Edit, View, History, Commands and Recent — `GROUPED_TABS_CONFIG` plus the `CommandCenter`
registry (`CommandPalette.tsx:47-63, 160-210`) — and no element catalog, so nothing Insert
can place is reachable from ⌘K. Recorded, **not drawn as UI**, because the commands do not
exist: `OK 172:19 36 -> 126px … le from ⌘K. Not drawn as UI here: the commands do not exist.`

---

# 9 · What I did NOT cover

- **66 of the 74 journey boards were not opened.** All 74 were enumerated by name,
  geometry and section membership in the one section dump, which is how §6 clears
  Settings and Content — but an enumeration is not a reading. The eight opened are
  `817:5220`, `813:4836`, `807:6558`, `807:7301`, `807:8787`, `817:5114`, `302:1978`,
  and `52:2` (layer names only).
- **`817:5114 S5.10 · activity-log` is a flagged, unresolved duplicate.** It draws a
  timestamped feed — `14:32 Alex Edited`, `14:15 Maria Commented`, `12:00 System
  Auto-saved` — which is the same shape as History › All changes, the list where
  `UX-I-01` found that a timestamp labelled *“Jump to 14:32”* silently **restores** and
  truncates history. I did not carry that correction here: I have not read the History
  boards this session, so I cannot say which of the two is canonical, and guessing would
  create exactly the disagreement this sweep exists to remove. **Next pass: read
  `16 · History`'s ActivityView boards and `817:5114` together, and settle it.**
- **`302:1978 S3.7 · page-settings · SEO` is already covered** — it carries this arc's
  `2838:12118/12119/12120` (UX-B-22, UX-B-10, UX-B-19). Its two siblings `302:2004` and
  `302:2026` were **not** opened and may or may not carry the same.
- **5 Canvas boards and 1 palette board not opened** (listed in §7 and §8).
- **No board was created, renamed or deleted**, and no shared component was edited.

## Plans

- `plans/sweep-d-text.json` — 16 rows, all `OK`
- `plans/sweep-d-captions.json` — 2 rows, both `OK`
- `plans/sweep-d-caption-appends.json` — 4 rows, all `OK`
