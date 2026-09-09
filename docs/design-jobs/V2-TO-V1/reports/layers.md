# V2 → V1 · module **layers** — section `1776:8375` "03 · Layers" (29 boards)

**Status: PLAN-ONLY. Zero writes landed.** The Figma MCP seat quota was exhausted
account-wide before this agent made a single write, and the coordinator issued a
hard stop on all Figma calls — including read-only ones — mid-task. Every row
below is planned, resolved and locally validated; none is read back, so nothing
is marked `IMPLEMENTED`.

## What I actually read, and what I did not

This distinction is the report.

| Source | Kind | Used for |
|---|---|---|
| `scratchpad_audit/vis3/page-meta.txt` (2026-09-06 14:20) | **READ from the file** — a complete XML dump of page `1:3` | every node id, name, x/y/w/h in this report. Not one id is inferred from a finding. |
| One live probe, 2026-09-07 05:12, before the stop | **READ from the file** | `03 · Layers · 29 \| children=29 \| 2480x3696` — byte-identical to the dump's section header, which is what licenses using the dump as current. |
| `docs/design-jobs/applied/plan-qa-text.json`, `plan-text-C.json` | applied plans | the `expect` guards on captions `155:25`, `155:28`, `155:29`. |
| the layers source under `packages/editor/src/editor/panels/layers/` | code | every behavioural claim, re-verified line by line (see the contradiction section). |
| **Never read** | — | the CHARACTERS of any text node. `page-meta.txt` carries names and geometry, not content. This affects exactly one row — caption `155:30` — and it is flagged in the plan. |
| **Never read** | — | boards `1082:4640`, `1082:4739`, `1082:4835`, `1082:5004`, `1171:4829`, `143:2`, `143:60`, `775:4130`, `781:4217`, `782:4260`, `143:355` beyond their node trees in the dump. No finding I own targets them. |

## Findings

| V2 finding | recommendation | affected V1 board(s) | action planned | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-H-14** (Critical) — lock lives in localStorage *and* on the element; only storage is re-read | the element is the source of truth; the panel must not draw the opposite state | `143:237` Layers · locked; caption `155:30` | rename `143:237` to carry TWO SOURCES OF TRUTH + the exact cite chain (`layers-rename.json#1`, `expect:"Layers · locked"`); replace caption `155:30` with the full locked truth incl. the canvas toast string (`layers-text.json#3`) | none — no write attempted | **BLOCKED-ON-QUOTA** |
| **UX-H-15** — Layers selects a locked element the canvas refuses | decide what lock protects and apply it on both surfaces | `143:237`; caption `155:30` | folded into the `155:30` replacement: "the lock only holds on one of the two surfaces: clicking this row selects the element normally and the Inspector edits it (`useLayerSelection.ts:68-74`)". The Inspector half is `UX-D-02`, the inspector agent's. | none | **BLOCKED-ON-QUOTA** |
| **UX-H-16** — M/T breakpoint badges can never render | feed the breakpoint state into the tree node, or drop the badge | `142:2` Layers · tree; caption `155:25` | clause added to `155:25` (`layers-text.json#0`, `expect:"28h dense rows."`). **No board draws the badges** — confirmed against the dump's full node tree for `142:2` — so there was nothing to un-draw, which is the correct outcome for "do not draw them as working". | none | **BLOCKED-ON-QUOTA** |
| **UX-H-17** — the eye dims in the editor; it does not hide | one idea, one control | `143:179` Layers · hidden; caption `155:29` | rename `143:179` → "EDITOR-ONLY DIM …" (`layers-rename.json#0`); caption clause naming the glyph/behaviour conflict and the Inspector's Visibility as the real control (`layers-text.json#2`) | none | **BLOCKED-ON-QUOTA** |
| **UX-H-18** — custom layer names are browser-local and fail silently | persist with the element; until then say it is local to this browser | `1082:4589` Layers · renaming | the board is **named** renaming and draws no rename field at all — eight plain tree rows (verified in the dump). Plan: draw the inline field inside row `1082:4610`, add a 20px hint "This browser only, not the project" marked `[not-implemented]`, shift four rows +20 and the spacer (`layers-structural.json` step E + `layers-move.json`), and create `caption/Layers · renaming` at 1700,2112 | none | **BLOCKED-ON-QUOTA** |
| **UX-H-19** — right-click Delete has no confirm, no count, no toast | name the blast radius, or confirm afterwards with undo | `1082:4527` Layers · context-menu; NEW board cloned from `143:295` | rename `1082:4527` to carry the no-confirm fact (`layers-rename.json#2`); new caption at 900,1052; and build the shipped **`Layers · multi-delete-confirm`** state, which exists in code (`index.tsx:412-418`) and on no board — so the "safer path is the one used less" comparison can be seen | none | **BLOCKED-ON-QUOTA** |
| **UX-H-20** — the context menu has two silently different scopes | a menu opened inside a selection should act on the selection and say so | `1082:4527`; `143:295` | rename + caption carry the scope split and the three orphaned actions (`selectChildren`, `moveToTop`, `moveToBottom`). Plus the selection toolbar on `143:295` (`layers-structural.json` step B) — without it the board cannot show that the one item that *does* act on the selection lives in a bar nobody drew | none | **BLOCKED-ON-QUOTA** |
| **UX-H-21** — arrow keys move selection, never focus | move focus and let selection follow | `142:2`; caption `155:25` | clause in `155:25` (`layers-text.json#0`) | none | **BLOCKED-ON-QUOTA** |
| **UX-H-22** — every row is its own tab stop plus three more | one tab stop for the tree | `142:2`; caption `155:25` | clause in `155:25` | none | **BLOCKED-ON-QUOTA** |
| **UX-H-23** (Minor, the closed half is *not* re-filed) — the surviving 20-high toggle is under the 24×24 minimum | take the row's full 24px for both toggles | tree-row master **`243:6`, page 🧩 Components (1:2), 57 instances** | **cannot be done from this job.** The eye and lock are not drawn on any Layers board — every row on every board is an INSTANCE of that master, and the brief's hard rule 1 is "write only inside page `1:3`". Overriding 57 instances is 57 desyncs, not a fix. Carried as a measured clause in `155:25` and as a `blocked` entry in `layers-structural.json` with the unblock condition | none | **BLOCKED — page constraint** (independent of quota) |
| **UX-H-24** (Minor) — refusal is raw type ids, after the drop, gone in 3s | say it in the row's words, show it during the drag, let it stay | `143:119` Layers · invalid-drop; caption `155:28` | four things: rename `143:177` DragTooltip → `bdc-layers-drop-alert`; set `143:178` to the shipped string `button cannot contain children`; move/resize/fill it into a 280×28 ink bar at 0,112 and close the 51px hole in the row ladder; and move caption `155:28` from 100,3346 — under the *empty* board — to 1700,3136, under the board it captions | none | **BLOCKED-ON-QUOTA** |
| **UX-H-25** (Minor) — hidden/locked have no roll-up and no clear-all | count them in the footer, make each a filter, add unlock-all | `142:2` footer; caption `155:25` | clause in `155:25`, with the search fact verified rather than assumed (`useLayerSearch.ts:16-24` matches display name, type, tagName and id — never state) | none | **BLOCKED-ON-QUOTA** |
| **UX-H-34** (module summary) — lock, hide and names live in localStorage; the tree is not keyboard-operable | move the three into the document; give the tree roving focus | the section as a whole | no separate row: the summary is exactly the union of H-14/17/18 (storage) and H-21/22 (keyboard), and every one of those is planned above. Filing it again would double-count | none | **N/A — covered by its constituents** |

## Board-level rows inside `1776:8375` (filtered from `_board-level.json`)

| id | disposition |
|---|---|
| `QA-B-15`, `QA-C-06`, `QA-C-10`, `QA-C-13` | **ALREADY-APPLIED before this job** — found in `docs/design-jobs/applied/plan-qa-marks.json` and `plan-qa-text.json`. Their strings are what my `expect` guards are built on, which is the read-back that proves it. |
| `COVER-1-63` (selection toolbar + multi-delete-confirm) | adopted — `layers-structural.json` steps B and C. It is the mechanism UX-H-19 and UX-H-20 need. |
| `COVER-1-62` (drop refusal is an alert bar, not a tooltip) | adopted — the UX-H-24 rows. |
| `COVER-1-64` (context menu: 8 items, disabled reasons, 3 orphan actions) | **partly rejected on the founder's precedence rule.** The board draws 11 menu rows in a different order from the code (Copy link last vs 4th). Precedence: *visual → the BOARD*. So the board's order and item set stand and the code is what diverges; I changed neither. The parts that are behavioural — the disabled reasons and the three orphaned handlers — went into the new caption. |
| `COVER-1-61` (eye/lock are editor-only) | **adopted for hide, corrected for lock.** See below. |
| `COVER-1-31`, `COVER-1-32`, `COVER-1-65`, `COVER-1-66` | not mine to change: `-31` is the loading board's footer (already corrected in caption `788:4303` by QA-C-06), `-66` is a `scripts/conformance/boards.json` note for the coordinator, `-32` and `-65` are "no change" records. |
| `ARR-A-09/10/11/12` (section is one 7280px ribbon) | **ALREADY DONE by someone else.** The dump and the live probe both show 2480×3696 in three rows of six — the reflow ARR-A-09 asked for. `ARR-A-11`/`-12` (segregating the NOT-A-STATE and UNBUILDABLE boards) are **not** done and are the arrangement lane's, not mine. |

## Contradiction with the V2 source, stated rather than resolved

`COVER-1-61` says of the eye *and* the lock: "Both flags are per-page localStorage
keys that write `data-hidden` / `data-locked` onto the canvas node **and nothing
else**." That is true of hide and **false of lock**, and `UX-H-14` is right:

```
useLayerActions.ts:163-168   composer?.elements.getElement(pending.id)?.setLocked(pending.locked);
Element.ts:151-155           setLocked(locked) { this.data.locked = locked; … markDirty(); }
shared/types/element.ts:73   locked?: boolean;      // on ElementData — it travels with the document
```

Lock is written to **both** stores; hide is written to neither. That asymmetry is
the whole of UX-H-14 — if lock were only local, a second machine would show an
unlocked element and an unlocked canvas, and there would be no defect. I planned
to UX-H-14, not to COVER-1-61, and flag it here so the next reader does not
"correct" the caption back.

## Plans

| file | rows | shape |
|---|---|---|
| `plans/layers-text.json` | 5 | `op:text` — 4 captions + the drop-alert string |
| `plans/layers-rename.json` | 4 | `op:rename` — 3 boards + the DragTooltip node |
| `plans/layers-move.json` | 32 | `op:move` ×26, `op:resize` ×4, `op:copy-fill` ×2 |
| `plans/layers-structural.json` | 0 queue rows | node **creation** (no queue op exists), the clone, the blocked item, and a 12-step runbook |

Validated locally, 0 Figma calls: `normalize-plans.mjs` then
`apply-queue.mjs --only=layers` reports **41 rows, 0 unusable, 5 calls**
(text 5, rename 4, move 26, resize 4, fill 2). The whole module is **14 calls**,
and steps 1–6 of the runbook carry eleven of the twelve findings without needing
the new board.

Two normalizer facts worth carrying, because they cost silent rows:

- `normalize-plans.mjs` classifies a resize **only** as `{target, from, to}` (a
  height). A `{op:"resize", id, w, h}` row is dropped with no report line. My
  four height-only resizes were rewritten into the recognised shape; the two that
  change **width** (`143:178`, and the section itself) cannot be queue rows and
  are listed under `geometry_not_expressible_as_queue_rows` with exact
  before/after.
- There is no classifier for a bare `{op:"fill", id, hex}`. `copy-fill` with an
  explicit `hex` normalises to `op:fill` and resolves; both my fill rows use it.

## Scripts added

- `scripts/figma/add-board-captions.mjs` — clones an existing caption as a style
  donor and seats it under a board, deriving the gap from the donor's own board
  rather than assuming 20px. Seven boards in this section have no caption; no
  existing script creates one.
- `scripts/figma/fix-layers-ux.mjs` — steps A–F, each read back in the same call.
  A: the drop alert bar. B: the selection toolbar. C: the multi-delete-confirm
  state on the clone. D: caption `155:28` re-seated. E: the rename field + hint.
  F: widen the section — **width only**, with the reason inline (section
  `04 · Pages` starts 480px below, and a taller section is a `secoverlap` FAIL).

Both pass `node --check` and `scripts/figma/lint-sandbox-scripts.mjs`.

## What I did NOT do

1. **No Figma writes at all.** Not one node changed. Every "planned" above is a
   plan.
2. **`verify-invariants.mjs` was not run**, on the coordinator's instruction. Its
   output under an exhausted quota is the quota string, and a quota string is not
   a measurement. The geometry in the plans is arithmetic against the dump — the
   invariants are *predicted*, not verified. Specifically unverified: that the
   `143:119` ladder closes without an overlap; that the widened section does not
   collide with `04 · Pages`; that the three caption slots I called empty are
   empty.
3. **Caption `155:30`'s current text was never read.** No applied plan touches it,
   so it should still hold its original build string, but the replacement I wrote
   is a REPLACEMENT. The row carries `needs_read: true` and says to dry-run or
   read it first and append instead if it carries a clause mine does not.
4. **UX-H-23 is not applied and cannot be from here** — the master is on page
   `1:2`, and the brief forbids writing outside `1:3`.
5. **Boards I did not open beyond their node tree in the dump:** `143:2`
   filtered, `143:60` dragging, `143:355` empty, `775:4130` loading, `781:4217`
   load-error, `782:4260` no-results, `1082:4640` expanded, `1082:4739`
   component-instance, `1082:4835` scroll-overflow, `1082:5004` list-view,
   `1171:4829` display-settings. Eleven of twenty-nine. No finding I own targets
   them, but that is a reason, not a claim of coverage.
6. **`ARR-A-11` and `ARR-A-12`** — segregating the two NOT-A-STATE and two
   UNBUILDABLE boards from the live ones — are still open. They belong to the
   arrangement lane and I left them alone rather than half-doing the reflow
   someone else finished.
