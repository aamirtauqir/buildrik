# shell — the 22 findings that had no queue row

**Module:** shell · slug `shell2` · **Date:** 2026-09-07
**Scope:** the 22 shell findings the first pass left with no plan row at all —
`UX-F-05 08 13 14 15 16 17 18 19 20 22 23 24 26 27 28 29 31 32 34 36 37`
**Sections touched:** `1776:8385` 01 · Shell · `1779:5` 09 · Canvas ·
`1779:3` 13 · Command palette · `1779:2` 20 · Notifications
**Figma calls spent: 8** (of the 25 allowed). Account total for the day ≈ 108/200.

## The thing the first pass got wrong, and it was not the drawing

Ten of these findings already had a board. `build-spec-boards.mjs` ran on
2026-09-07 and built all ten — the read-back below names each one — but an
`add-board` row is **excluded from the queue applier by design**, so it never
lands in `queue-state.json`, and `register-status.mjs` credits a finding only
from a row that landed. Ten boards existed and twenty-two findings read
`PENDING`. The gap was bookkeeping, not pixels, and the fix is the idiom this
arc already uses everywhere else: a `rename` row that appends the claim to the
board that answers the finding, with the finding ids in its `why`. Twelve of
those landed `OK` in one call.

Two findings genuinely had nothing drawn anywhere (`UX-F-05`, and `UX-F-15`'s
handle) and one had been closed as code-only when its own fix is half a naming
decision (`UX-F-28`). Those are the three new drawings.

## One row per finding

| id | verdict | board · node | read-back |
|---|---|---|---|
| **UX-F-05** two incomplete help screens | **IMPLEMENTED** — the merged screen had no drawing anywhere; the first pass closed it out-of-section because the *shipped* overlay `815:4518` sits in section 23, which is true of that drawing and is not a reason to leave the target undrawn | **NEW board `2875:12449`** "Shortcuts · one screen (? and ⌘/)" — section `1779:3`, 1000×420 @820,852, caption `2875:12470` | `MADE 2875:12449 … 1000x420 @820,852 children=20`; 17 TEXT nodes read back, all Inter 11/12/14 ≤ Semi Bold, all inside the board (max bottom 408 of 420) |
| **UX-F-08** Issues is a 360 slab outside the grid | **IMPLEMENTED** | `2844:12158` (board built 09-07, row added now) + `963:4474`'s existing class table | `OK: Shell · Issues joins the grid (right column, not a slab) — UX-F-08: today the panel is position:absolute top:56 right:0 width:360 z-index:45 (AquibraStudio.tsx:604-616)…` |
| **UX-F-13** full-page mode has no way out | **IMPLEMENTED** | `2844:12136` | `OK: Shell · full-page mode — Back to canvas — UX-F-13: … closing hard-codes a jump to Insert (StudioPanels.tsx:364-372)…` |
| **UX-F-14** below 1024 the shell degrades silently | **IMPLEMENTED** | `2844:12149` | `OK: Shell · below 1024 — desktop-only — UX-F-14: LayoutShell.css:353-358 reserves the breakpoint and its only content is a comment saying a warning overlay is “handled by component”. No such component exists.` |
| **UX-F-15** drawer has two widths and no handle | **IMPLEMENTED** — the first pass drew the 700-vs-560 decision and said plainly that the handle was not drawn | **NEW board `2875:12471`** "Drawer · width steps and the drag handle (280 ↔ 700)" — section `1776:8385`, 1000×300 @3180,6640, caption `2875:12493` · plus `2844:12186` | `MADE 2875:12471 … 1000x300 @3180,6640 children=21` (two 1/4-scale shell strips, a 2px accent handle on each drawer edge, the 1440 arithmetic); `OK: Shell · open decisions … — UX-F-15’s 560 proposal is filed here and not applied; the handle … are drawn on “Drawer · width steps and the drag handle” (2875:12471).` |
| **UX-F-16** two tab strips read as one list | **IMPLEMENTED** | `2844:12121` | `OK: Topbar · location line — site › page › panel — UX-F-36 and UX-F-16: … “Editor sections” (LeftSidebar.tsx:606-610) vs “Site pages” (PageTabBar.tsx:220-235)…` |
| **UX-F-17** page management exists twice | **NOT-APPLICABLE** (register vocabulary: `DEFERRED-BY-DECISION`) — **re-read at HEAD, the first pass's judgement holds.** `SPEC-NAVIGATION` §7: *“the duplicate is real (UX-F-17, UX-B-15) and it is the Pages spec’s decision, not this one. This spec only asks that the two strips stop reading as one list.”* The half that IS navigation's is drawn and credited under UX-F-16 | advisory row anchored on `1776:8377` (04 · Pages), the section that owns it | `shell2-marks#12` carried as `NOT-APPLICABLE: UX-F-17 …`; the register now shows the reason instead of `PENDING` |
| **UX-F-18** Tab cannot leave the canvas | **IMPLEMENTED** | `2855:12407` block 1 + `2875:12449` (F6 printed in the merged screen for the first time) | `OK: Canvas · keyboard, zoom and viewport (one owner each) — UX-F-18 · F-19 · F-22 · F-23 · F-24 · F-27 · F-28 · F-32 · F-34…`; text `2875:12434` read back 430×80 @16,78 |
| **UX-F-19** inspector mode has no control | **IMPLEMENTED** | `2855:12407` block 5 (`2875:12442`, 414×80 @470,198) | same rename read-back |
| **UX-F-20** a refused Publish looks ready | **IMPLEMENTED** — and the rename records the correction: `SH-A-02` measured the **board** already drawing it at 50% on grey, so `Topbar.tsx:295-321` is the off-system party | `2844:12066` | `OK: Topbar · Publish CTA states (five verbs · settled · refused) — UX-F-20: … SH-A-02 measured that the BOARD already drew it … and Topbar.tsx:295-321 is the off-system party (PUBLISH_BTN_CLASS changes no colour or opacity)…` |
| **UX-F-22** three zoom implementations | **IMPLEMENTED** | `2855:12407` block 2 (`2875:12436`, 430×80 @16,198) | same rename read-back |
| **UX-F-23** arbitrary session memory | **IMPLEMENTED** | `2855:12407` block 7 (`2875:12446`, 414×48 @470,430) | same rename read-back |
| **UX-F-24** device change does not fit | **IMPLEMENTED** | `2855:12407` block 3 (`2875:12438`, 430×80 @16,326) | same rename read-back |
| **UX-F-26** `--bk-size-nav` has zero consumers | **IMPLEMENTED** — section 20 · Notifications had received **no** work in the first pass, and it holds the token's only real sibling. Verified at HEAD: `.bk-notifications { width: var(--bk-size-panel-right) }` (`header.css:39`) is the token's **only** consumer, and `--bk-size-nav` (240) has none | `165:2` in `1779:2`, plus the existing `963:4474` slot proof | `OK: Notifications · unread — UX-F-26 / UX-F-25: drawn 280 wide; the shipped dropdown is 360 (.bk-notifications, header.css:39) and is the ONLY consumer of --bk-size-panel-right. ONE right-hand class — 360 for notifications, Issues and Structure; 300 for the inspector column; --bk-size-nav (240) has zero consumers anywhere in the package.` |
| **UX-F-27** Structure popover unreachable | **IMPLEMENTED** | `2855:12407` block 5 (shares `2875:12442` with F-19) | same rename read-back |
| **UX-F-28** two dead viewport controls | **IMPLEMENTED** — the first pass closed this code-only. Re-checked: the finding's own fix is *“name one component as the viewport control for the whole shell”*, which is a board statement. Verified at HEAD — `canvas/controls/DeviceSelector.tsx` and `shell/hooks/useDeviceZoom.ts` have no importer, and `templates/TemplatePreview.tsx:79` declares a **third**, local `DeviceSelector`, so the finding under-counts | **new block on `2855:12407`** — `2875:12447` "One viewport control" + `2875:12448` | board rebuilt `children=16 → 18`; `2875:12448` read back at 430×64, then corrected (below) and re-read `OK: chrome-ui BreakpointSwitcher is the one (CanvasFooterToolbar.tsx:318-331). DeviceSelector and useDeviceZoom have no call site — delete both. (UX-F-28)` |
| **UX-F-29** the ⋯ menu does three jobs | **IMPLEMENTED** | `2844:12104` | `OK: Site menu (⋯) · regrouped — in-editor rows moved to More — UX-F-29: eighteen rows doing three jobs at once (SiteMenu.tsx:189-308…)` |
| **UX-F-31** twelve bare letters, no legend, no modal guard | **IMPLEMENTED (board half) — the guard is a code fix and is now stated, not built.** Re-verified at HEAD: 13 shortcuts, **twelve bare letters**, Components `⇧A` (`tabsConfig.ts:82-259`), and `useSidebarKeyboard.ts:16-53` still guards only tagName / contenteditable / modifiers, while `useEditorShortcuts.ts:85` and `CanvasFooterToolbar.tsx:226` both call `isModalOpen()` first | `2844:12025` (letters where the user is) + `2875:12449` (the guard, stated) | `OK: Rail · More index (popover · 240) — UX-F-31 · UX-F-01 · UX-F-37: … The missing modal guard — useSidebarKeyboard.ts:16-53 checks tagName, contenteditable and modifiers and never isModalOpen() — is a code fix and is stated on “Shortcuts · one screen” (2875:12449, section 13).` |
| **UX-F-32** ⌘R is taken for Rulers | **IMPLEMENTED** — and the six chords are printed on a board for the first time. Read at HEAD: `⌘;` guides · `⌘⇧;` spacing · `⌘'` grid · `⌘B` badges · `⌘R` rulers · `⌘⇧X` x-ray | `2855:12407` block 4 + `2875:12449` VIEW column (`2875:12463`, 120×112 @530,296) | `TEXTS 2875:12463 · 12/Regular · Inter · #6B7280 · 120x112 · "⌘0 ⌘1 ⌘2\n⌘= / ⌘-\n⌘; / …"` |
| **UX-F-34** the status footer is inert | **IMPLEMENTED** | `2855:12407` block 6 (`2875:12444`, 414×48 @470,338) | same rename read-back |
| **UX-F-36** the shell never states its location | **IMPLEMENTED** | `2844:12121` | see UX-F-16 |
| **UX-F-37** module summary — the spine is half-built | **IMPLEMENTED** — its four asks are now all drawn: name the destination list (`2844:12025`), give every destination a door (the More seat + `2844:12104`), make the rail and footer say where you are (`2844:12046`, `2844:12121`, and the footer-as-door block on `2855:12407`), repair the three broken promises (`65:211` preview, `2844:12158` issues, `2844:12092` unpublish confirm) | `2844:12025` carries the id | `OK: Rail · More index (popover · 240) — UX-F-31 · UX-F-01 · UX-F-37…` |

## Register, before and after

`node scripts/figma/register-status.mjs --write` — 0 Figma calls, driven only by
read-backs in `queue-state.json`:

| | before | after |
|---|---|---|
| findings touched by an applied row | 237 | **260** |
| IMPLEMENTED | 218 | **241** |
| DEFERRED-BY-DECISION | 1 | **10** |
| PENDING (of those touched) | 4 | 4 |

All 22 now carry a status with evidence behind it: **21 IMPLEMENTED, 1
NOT-APPLICABLE with its reason.** None reads PENDING.

## The defect this pass introduced and repaired

The added UX-F-28 block landed at `y=430` with a measured height of **64** in a
480-tall board — four lines, the last one clipped. The write succeeded and the
child count matched; only the interior read-back showed it, which is the same
shape as the caption overflow that cost the first arc twelve board overlaps.
The board could not grow (its own caption sits at `y=2188`, 12px below the board
floor, and `verify-invariants` counts a caption a board covers as a board
overlap), so the **copy** shortened instead: 217 chars → 150, re-read `OK` at
`2875:12448`. `shell2-canvas-board.json` carries the shortened string, so a
re-run is idempotent.

## Invariants

`node scripts/figma/verify-invariants.mjs`, run after every write:

| class | required | measured | verdict |
|---|---|---|---|
| loose nodes | 77 | **77** | unchanged |
| section overlaps | 2 | **2** | unchanged (`07 · Brand`×`06 · Content`, `12 · AI`×`13 · Command palette`) |
| board overlaps | 0 | **0** | held |
| out-of-bounds children | 2 | **2** | unchanged (`147:55`, `1719:8421` — both pre-existing) |
| dangling prototype edges | 0 | **0** | held |
| boards | 1002 | **1006** | +4, growth only: 2 new boards + their 2 captions |

`FAIL` is the pre-existing state recorded in `INVARIANTS-PRE.md`. **Nothing on
this list moved except the board count, and it only grew.**

## What I did NOT cover — plainly

1. **No prototype wiring.** The three boards this pass touched have no inbound
   edge. That is not one of the five invariants, and a hotspot pointing at a
   guessed destination is worse than none, but it means `Shortcuts · one screen`
   and `Drawer · width steps` are reachable only by scrolling to them.
2. **The six Notifications boards are still drawn 280 wide** while the shipped
   dropdown is 360. Filed as an advisory (`shell2-marks#13`), not applied: a
   frame resize alone would leave a 280 interior in a 360 box, which is a worse
   drawing than the one that ships. That is a re-layout for someone with a
   cursor.
3. **`VIS-2-24`, `VIS-2-29`, `VIS-2-30`** (notification-row timestamp
   overprinting on `165:2` and its all-read twin) and **`VIS-3-15`** (caption
   overflow on `1176:4925`) are inside my sections and are still unplanned. They
   are not among the 22 and I did not measure them.
4. **`UX-F-31`'s modal guard and `UX-F-32`'s chord move are code changes.** Both
   are now *stated* on boards, with the file and line that has to change. No
   code was touched.
5. **I read four sections' direct children and three boards' interiors. I opened
   no other board.** Every claim above about a board I did not build is its
   name, read back this session, and nothing more.
6. **The out-of-section shell surfaces are still untouched** — the Site menu
   `642:3401` and the five Issues boards in section 25, and the shortcuts
   overlay `815:4518` in section 23. `UX-F-05` is now answered by a *new* board
   in section 13; `815:4518` itself was not edited and still draws the split.

## Files

| file | what |
|---|---|
| `plans/shell2-canvas-board.json` | rebuild of `2855:12407` + the UX-F-28 block. **Supersedes `shell-canvas-board.json`; do not run both.** |
| `plans/shell2-shortcuts-board.json` | new board `2875:12449` in section `1779:3` |
| `plans/shell2-drawer-handle.json` | new board `2875:12471` in section `1776:8385` |
| `plans/shell2-marks.json` | 12 renames (landed `OK`) + 2 advisories |
| `plans/shell2-fix-overflow.json` | the measured overflow correction |
| `scripts/figma/dump-section-children.mjs` | new, read-only: direct children of several sections in **one** call. `dump-board-interiors` reads one section, `board-baseline` reads counts; neither answers "where is the next free slot in each of these four", which is what a placement decision needs — and is why this pass did not repeat the first one's stale 34-child reading of a section that now holds 54. |
