# V2 → V1 — the 17 findings that had no queue row

**Date:** 2026-09-07 · **Page:** `1:3` "🖥️ Editor v1" (write) · `2668:2` (read-only source, not opened this pass)
**Budget:** 15 Figma calls allowed · **15 spent** · **0 remaining**

These seventeen sat `PENDING` in `REGISTER.md` with nothing behind them: their
module agents ran out of quota before writing a row, so nothing distinguished
them from findings nobody had looked at. Every one now ends as a row in a plan
file under `plans/gap-a-*`, and every row that changed a board quotes the value
Figma returned **after** the write.

## Headline

| | |
|---|---|
| findings closed with a board change, read back | **8** (all Settings) |
| findings closed as a reasoned NOT-APPLICABLE | **8** (6 Insert, 1 Pages, 1 Layers) |
| findings planned, priced and left unspent | **1** (`UX-A-28`, 1 call) |
| new nodes created | 13 notice bands · 2 state boards · 2 confirm dialogs + scrims |
| nodes deleted | 2 (the duplicate in-body Saves on the two save-error boards) |
| shared components edited | **0** — `2041:19572` was not read and not touched |

## Invariants — before and after

| class | stated pre-state | measured after | verdict |
|---|---|---|---|
| loose nodes on page | 77 | **77** | unchanged |
| section overlaps | 2 | **2** | unchanged (`07 · Brand`×`06 · Content`, `12 · AI`×`13 · Command palette`) |
| board overlaps | 0 | **0** | unchanged |
| out-of-bounds children | 2 | **2** | unchanged (`147:55`, `1719:8421` — both pre-existing) |
| dangling prototype edges | 0 | **0** | unchanged |
| boards | 1002 | **1016** | +14; **2 are mine**, the other 12 belong to the agents running concurrently |

**Nothing in the failure set is this pass's.** One out-of-bounds pair was
created and repaired inside the budget — see `UX-I-34/35` below.

---

## One row per finding

### Settings — section `1776:8387`

| id | verdict | board / node touched | read-back evidence |
|---|---|---|---|
| **UX-I-40** (Critical) | **IMPLEMENTED** | 6 warning bands, one per server-backed screen: `639:3092`→`2876:12433` · `639:3795`→`2876:12437` · `640:2440`→`2876:12441` · `640:2789`→`2876:12445` · `640:3135`→`2876:12449` · `640:3849`→`2876:12453` | `OK  1192x52@32,24  moved=1  newfoot=492/736` … `520/756` — text read back verbatim on all six, e.g. `'Not covered by version history. Redirect rules a…'` |
| **UX-I-34** (Critical) | **IMPLEMENTED** | new board `2877:12431` `S7 · Settings · Forms · delete-submission-confirm` (clone of `640:3135`), dialog `2879:12609` | `OK 2877:12431 board 1440x900 · scrim 2879:12608 1440x900@0,0 FITS · card 2879:12609 440x204@500,348 FITS` · text `[Delete this submission? \| “maria@bellacucina.com” is \| Cancel \| Delete submission]` |
| **UX-I-35** (Major) | **IMPLEMENTED** | new board `2877:21890` `S7 · Settings · Domains · remove-confirm` (clone of `639:3092`), dialog `2879:12616` | `OK 2877:21890 board 1440x900 · scrim 2879:12615 1440x900@0,0 FITS · card 2879:12616 440x184@500,358 FITS` · text `[Remove this domain? \| bellastudio.com stops poin \| Cancel \| Remove domain]` |
| **UX-I-32** (Major) | **IMPLEMENTED where the duplicate is drawn** — 2 of 9 boards; the conflict with `COVER-1-11` is **resolved**, see below | `1703:7914` Headers·save-error → removed `1703:8069` "Save headers" · `1703:7445` Localization·save-error → removed `1703:7605` "Save locales" | `OK 1703:7914 1703:8069 'Save headers'` / `OK 1703:7445 1703:7605 'Save locales'` — the applier re-fetches the removed id and `getNodeByIdAsync` returned **null** for both. The other seven boards return `NOT-DRAWN`: `640:2789`, `2209:11816`, `1703:7606`, `1703:7760`, `639:3795`, `1703:7127`, `1703:7286` hold no such string, which matches `COVER-1-11`'s own reading that loading and load-error early-return |
| **UX-I-36** (Major) | **IMPLEMENTED (saying-so half)** · **ALREADY-CORRECT (not-rendering half)** · counter **deliberately untouched** | 3 info bands: `639:3092`→`2876:12457`, `640:3135`→`2876:12461`, `640:3849`→`2876:12465` | `OK 1192x52@32,24 moved=1 newfoot=560/736 · 574/756 · 588/756`, text `'Saved as you go. Every action on this screen wri…'`. The six savebar deletions returned `NO-SCOPE` on all three boards: **no FRAME/GROUP/INSTANCE named `savebar\|save bar\|bd-set-savebar` exists on any of them** — the bar the finding asks to stop rendering is not drawn there, so there was nothing to remove and the boards are already correct on that half |
| **UX-I-37** (Major) | **IMPLEMENTED** | `1688:7195` → filter field `2876:12467`, open-decision band `2876:12469` | `OK 560x32@640,24 inBoard=true 'Filter settings…'` and `OK 1160x88@40,560 inBoard=true 'OPEN DECISION — group names and membership. UX-I…'`. The group **rename is drawn, not applied**, as the settings plan specified — it would rewrite the breadcrumb on 30 boards |
| **UX-I-41** (Major) | **IMPLEMENTED** — the one finding of settings' thirteen that had no plan file at all | `638:3070` S7 · Settings · SEO → band `2876:12473` | `OK 1192x70@32,24 moved=1 newfoot=560/736`, text `'SEO is edited in two places and neither names th…'`. The unbuilt half of the fix (the "overridden on N pages" count and the page field's "site default: …") is drawn as `[design-ahead]` inside the band, not asserted as shipping |
| **UX-I-39** (Minor) | **IMPLEMENTED as a drawn open decision — the master was not touched** | `1688:7195` → band `2876:12475`. `2041:19572` "Settings nav row": **not read, not edited, 0 of ~600 instances touched** | `OK 1160x88@40,700 inBoard=true 'OPEN DECISION — rows that leave the app. This li…'` |

### Insert — sections `1776:8379`, `1090:4527`

| id | verdict | board / node touched | evidence |
|---|---|---|---|
| **UX-A-21** (Major) | **NOT-APPLICABLE** — pure viewport behaviour, no visual state | none | `useBlockInsertion.ts:118-127` / `dropOperations.tsx:494-514` never call `scrollIntoView`. A board is a still frame; neither Insert section holds a canvas board (the canvas is `01 · Shell`). Row `gap-a-triage#0` |
| **UX-A-26** (Minor) | **NOT-APPLICABLE — cross-module** | none | Subject is `shell/modals/CommandPalette.tsx:53-56`; its board is in `13 · Command palette`. Drawing palette commands on an Insert board would put the claim on a surface that does not render it. Row `gap-a-triage#1` |
| **UX-A-27** (Minor) | **NOT-APPLICABLE — cross-module, already folded** | none | `insertActions.ts:13-19` / `contextMenuRegistry.ts:57-63` — the canvas right-click menu, owned by `01 · Shell`, and already entry 5 of the `note/Insert · OPEN DECISIONS` frame with `UX-A-03`. All three insert doors must change together. Row `gap-a-triage#2` |
| **UX-A-30** (Minor) | **NOT-APPLICABLE** — the fix is a code deletion of something that renders nothing | none | `handleQuickAdd` (`useStudioHandlers.ts:74-92`) is destructured to `_onQuickAdd` and never used (`StudioPanels.tsx:156-157`). It reaches no board, so there is no drawing to add, mark or retire. Row `gap-a-triage#3` |
| **UX-A-32** (Minor) | **NOT-APPLICABLE — cross-module, and contested** | none | The toast is raised at `useBlockInsertion.ts:155` and drawn on the shell's toast boards. It also collides with Insert open decision 8: `SPEC-INSERT-PANEL` §4 deletes the click toast, which is the surface the Undo would live on. Row `gap-a-triage#4` |
| **UX-A-33** (module summary) | **NOT-APPLICABLE** — no fix field | none | Used as the checklist the other 32 Insert findings were walked against. All five named entry points resolve to the same panel; the one involuntary exit is `UX-A-17`. Row `gap-a-triage#5` |
| **UX-A-28** (Minor) | **PLANNED, PRICED, UNSPENT — 1 call** | `1069:4707` `Insert · blocks-expanded` — a `rename` appending the CMS-modal ambush to the existing truth-mark | Row `gap-a-insert-marks#0`. `apply-queue.mjs --only=gap-a` dry run: **"Applying would cost 1 calls: 1 rename @ 1:3"**. `expect` is the prefix `Insert · blocks-expanded — [not-implemented] the thumbnails.`, which `insert-truth-marks#0` landed `OK`. Not spent because the budget's last call was reserved for `verify-invariants.mjs` |

`UX-A-28`'s planned home — the new `Insert · blocks-expanded · rows` board
(`insert-new-boards#0`) — does not exist, and its other named home, "a caption
for `1069:4707`", does not exist either: section `02 · Insert`'s nine captions
map to `137:2`, the two search states, the drag state and the two
mounted-nowhere states, and none of them to the BLOCKS grid. The claim therefore
goes on the board that draws the grid, by the truth-mark convention.

### Pages `1776:8377` and Layers `1776:8375` — the two module summaries

| id | verdict | evidence |
|---|---|---|
| **UX-B-34** | **NOT-APPLICABLE — module summary, covered by its constituents** | No fix field. Its thesis is the union of the Pages module's own findings, all of which are planned across `pages-nodes-02..12`, `pages-text-01/08`, `pages-truth-10`, `pages-hotspots-11`. Checked, not assumed: no constituent is missing a plan. The pages agent reached the same verdict independently (`reports/pages.md:164`). Row `gap-a-triage#6` |
| **UX-H-34** | **NOT-APPLICABLE — module summary, covered by its constituents** | Exactly the union of `UX-H-14/17/18` (lock, hide and names in localStorage) and `UX-H-21/22` (the `role=tree` markup promises roving focus it does not implement), all five planned in `layers-structural` / `layers-text` / `layers-rename`. Same verdict at `reports/layers.md:38`. Carried forward: `COVER-1-61` is half wrong — hide IS local, **lock is not** (`useLayerActions.ts:163-168` writes `data.locked` onto `ElementData`), which is what makes `UX-H-14` a real defect. Row `gap-a-triage#7` |

---

## The two conflicts the brief named — both resolved

### `UX-I-32` vs `COVER-1-11` — resolved, and narrower than it read

`COVER-1-11` asks the four save-failure boards to be redrawn as the full screen
with the error at the foot **"beside 'Save headers'" / "beside 'Save locales'"**.
`UX-I-32` deletes exactly those two buttons. Both cannot land as written.

Three facts decided it:

1. **The overlap is two boards, not nine.** `COVER-1-11` covers `1703:7914`,
   `1703:7445`, `1703:10185`, `1703:9208`; `UX-I-32` covers nine boards. Only
   `1703:7914` and `1703:7445` are in both. `COVER-1-11`'s other two are
   untouched by `UX-I-32` and need no amendment.
2. **The other seven `UX-I-32` boards never drew the button** — measured this
   pass, seven `NOT-DRAWN` read-backs. `COVER-1-11` itself says loading and
   load-error early-return, so the two lanes agree there.
3. **`COVER-1-11` is unapplied** (`REGISTER.md`: PENDING; its redraw is
   `manual-draw` class). Nothing is being undone.

**Decision: `UX-I-32` takes the button; `COVER-1-11` keeps its substance.**
COVER-1-11's real claim — a save failure is never an early return, the whole
form stays on screen (`HeadersScreen.tsx:158-271`,
`LocalizationScreen.tsx:206-297`) — survives untouched. Only the anchor for the
error line moves, from an in-body Save to the savebar's single Save. Recorded as
`gap-a-triage#8`, a **non-deferred** advisory so it reads as a live instruction
to COVER-1-11's owner rather than as a decision already discharged. **Whoever
draws COVER-1-11 must read that row, or the duplicate Save comes back.**

### `UX-I-36` vs `FIG-M-01` on `2209:11816` — verified, not re-opened

`FIG-M-01` (measured) wants "3 unsaved" corrected to "1", because
`SettingsTab.tsx:380-383` does `setDirtyCount(dirty ? 1 : 0)`. `UX-I-36` wants
the actual field count. The settings pass left the board at **"3"** — board
leading code — deliberately. **I did not touch that node.** `UX-I-36`'s two
halves were both addressable without it, and re-deciding a recorded decision was
not this pass's job. It remains the one place where a V1 board asserts something
the product cannot currently do, and it is still flagged.

### `UX-I-39` — the instruction not to edit `2041:19572` was followed, and then went further

The plan specified "add a variant, swap two instances". **Adding** a variant is
still an edit to the set: a `Destination` property does not exist on it today,
so introducing one gives the property to every existing variant and therefore to
all ~600 instances — and the brief requires listing every instance checked. The
finding is drawn as an open decision on `1688:7195` instead, which is the shape
this arc already uses for the merged nav row and for `UX-I-37`'s regrouping.
**`2041:19572` was not read and not written. Zero of its instances were touched,
and zero were checked.**

---

## Four bugs found by read-backs, three fixed at source

Each returned success or refused for the wrong reason.

1. **`add-settings-blocks.mjs` refuses every Settings board with `slack=0`** — 13
   rows, 13 refusals, 2 calls. The refusal is *correct* and the reason it gives
   is not the reason: a Settings pane holds exactly two children, a 44px header
   and a body frame **sized to fill the rest**, so the "content" it measures ends
   at the pane foot by construction. The room is one level further in, where the
   cards stop around two thirds down. `add-settings-band-v2.mjs` (new) measures
   the body's own children, descends through a wrapper that fills its parent,
   and refuses against the number that actually decides `oob`.
2. **The root board has no pane at all.** `1688:7195` puts nineteen absolutely
   positioned rows straight into `1688:7197 'Middle band'` (1440x812, layoutMode
   HORIZONTAL) — hence three `NOHDR` lines. v2 takes explicit coordinates and
   sets `layoutPositioning = "ABSOLUTE"`, without which the parent's layout
   places the band and the coordinates mean nothing.
3. **`drop-settings-duplicates.mjs` aborted both of its batches** and lost every
   row's outcome, including rows that had already run. Cause: the scope search
   read `.findAll` off a TEXT node named for the savebar, and in the Figma plugin
   API that **throws** rather than returning `undefined` — so even
   `typeof n.findAll === "function"` crashes the callback. Fixed twice: select
   the scope **by node type**, and isolate each row in its own try/catch so a
   throw is one `ERROR` line and not a silent batch. Cost: 2 calls.
4. **`draw-settings-confirm.mjs` drew both dialogs outside their boards and
   reported `OK`.** The board is a VERTICAL auto-layout frame, so the parent owns
   x/y: scrim and card were stacked at the end and read back
   `440x204@0,1800` on a 900-tall board. The check passed because it compared the
   **text** and never the geometry. `fix-confirm-placement.mjs` (new) set
   `layoutPositioning = "ABSOLUTE"` and re-centred; both now read `FITS` against
   the board's `absoluteBoundingBox`. **The source script is patched** — it sets
   ABSOLUTE itself and its read-back now includes `inBoard=`.

A fifth was caught for **zero** calls: a backtick in a comment I added inside a
sandbox template literal ended the string early. `lint-sandbox-scripts.mjs`
flagged it; all four scripts this pass touched are now clean.

Every payload sent this pass was parsed offline first, by stubbing the transport
and running `node --check` over the emitted sandbox code. Five payloads for the
three pre-existing scripts, two for v2, one for the placement fix. No call was
spent on a syntax error.

---

## Call ledger — 15 of 15

| # | what | calls | outcome |
|---|---|---|---|
| 1-2 | `add-settings-blocks.mjs` (13 bands) | 2 | 13 refusals — `slack=0` ×10, `NOHDR` ×3. Diagnosis, not waste, but it is 2 calls |
| 3 | one read of the pane structure of `640:2440`, `638:3070`, `1688:7195` | 1 | the measurement that unblocked all 13 |
| 4-5 | `add-settings-band-v2.mjs` (13 bands) | 2 | **13/13 OK**, each read back |
| 6-7 | `drop-settings-duplicates.mjs` (15 rows) | 2 | both batches threw; nothing landed |
| 8-9 | same, after the type fix | 2 | 2 OK, 7 NOT-DRAWN, 6 ERROR |
| 10 | the 6 savebar rows, after the second fix | 1 | 6 `NO-SCOPE` — the frames do not exist |
| 11 | `add-state-board.mjs 640:3135` | 1 | created `2877:12431`, no overlap |
| 12 | `add-state-board.mjs 639:3092` | 1 | created `2877:21890`, no overlap |
| 13 | `draw-settings-confirm.mjs` | 1 | 2 dialogs, text OK, geometry wrong |
| 14 | `fix-confirm-placement.mjs` | 1 | both `FITS` |
| 15 | `verify-invariants.mjs` | 1 | 77 / 2 / 0 / 2 / 0 — all at baseline |

**Four calls of the fifteen bought diagnosis rather than a change** (1-2 and
6-7). Both were plans written against a structure nobody had read: the first
against a pane that has no room by construction, the second against a savebar
that is not drawn. Both are now measured and both scripts are fixed at source.

---

## What I did NOT do

- **`UX-A-28` was not applied.** The row exists, resolves to a real node, carries
  an `expect` guard and prices at exactly 1 call. It was the sixteenth call.
- **`REGISTER.md` was not rewritten.** `register-status.mjs` dry run reports
  **10 DEFERRED-BY-DECISION** (my 8 triage rows plus 2 pre-existing) and 215 rows
  it would update. I did not pass `--write`: three other agents are working in
  this tree and the register is a shared file. **Run
  `node scripts/figma/register-status.mjs --write` when the tree is quiet.**
- **`register-status.mjs` cannot credit any of this pass's eight Settings
  changes.** It reads `queue-state.json`, which only `apply-queue.mjs` writes;
  bands, guarded deletes, clones and dialogs are drawn by their own scripts and
  leave no queue row. The register will keep showing those eight as `PENDING`.
  That is a gap in the bookkeeping, not in the file — this report's read-backs
  are the record.
- **`UX-I-33`'s confirm board was not cloned.** It is not one of the seventeen
  (it already carries `settings-hotspots#0`), and its row is kept in
  `gap-a-settings-confirms.json` with the clone source, the copy and the wiring
  target in one place. 2 calls finish it.
- **The two new boards have no inbound edge.** `add-state-board` printed
  `no --wire-from given: board has NO inbound edge yet` for both. Wiring needs
  the id of the Delete / Remove control on the source board, which was never
  read. They are pictures until then. No invariant covers this — `dangling`
  counts edges that point nowhere, not boards nothing points at.
- **Nothing was compared by eye.** No screenshot was taken, of a V1 board or a V2
  board. The Figma loop's acceptance step did not happen for any of these.
- **Page `2668:2` was not opened.** Every V2 recommendation acted on came from
  the local slices, the reports and `REGISTER.md`.
- **`2209:11816`'s "3 unsaved" was not read this pass.** Its state is inherited
  from the settings pass's decision, not re-measured.
- **The `NO-SCOPE` result has a loose end:** a TEXT node whose *name* matches
  `savebar|save bar|bd-set-savebar` exists on at least one of `639:3092` /
  `640:3135` / `640:3849` — it is what crashed the first predicate. It was not
  touched and it was not identified. One read would settle whether those boards
  draw a savebar under a different structure.

## Files

| file | what |
|---|---|
| `plans/gap-a-settings-bands.json` | 13 bands, each with its `applied` read-back |
| `plans/gap-a-settings-duplicates.json` | 15 guarded deletes, each with its outcome; the COVER-1-11 resolution on rows 5 and 9 |
| `plans/gap-a-settings-savebar.json` | the 6 savebar rows, split out for the one-call retry |
| `plans/gap-a-settings-confirms.json` | 3 confirm boards — 2 applied, `UX-I-33`'s kept and marked deferred |
| `plans/gap-a-settings-confirms-ready.json` | the 2 rows whose boards exist, as fed to the drawer |
| `plans/gap-a-insert-marks.json` | `UX-A-28`'s rename row — priced, unspent |
| `plans/gap-a-triage.json` | 8 NOT-APPLICABLE decisions + the COVER-1-11 amendment |
| `scripts/figma/add-settings-band-v2.mjs` | new — places a band measured against the pane's CONTENT, or absolutely on a board with no pane |
| `scripts/figma/fix-confirm-placement.mjs` | new — takes an overlay out of an auto-layout board's flow |
| `scripts/figma/drop-settings-duplicates.mjs` | patched — type-selected scope, per-row isolation |
| `scripts/figma/draw-settings-confirm.mjs` | patched — sets ABSOLUTE, and checks geometry in its read-back |
