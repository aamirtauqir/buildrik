# V2 → V1 — module `history` (history-and-versions)

**V1 target section:** `1776:8374` "16 · History" (35 boards), Figma page `1:3`, file `g4GzQFqzNYz5sosz1QtZXC`.
**V2 source:** page `2668:2` — `2797:2` (1 · UX Audit), `2797:342` (4 · Missing Screens & States), `2797:574` (10 · Major User Flows, journey 5 "Recover from a mistake", 8 steps / 8 broken, first stop step 1).
**Findings owned:** the 16 `UX-I` rows in `../slices/history.json`, plus `UX-I-42`, plus the `_board-level.json` rows that land inside this section — `VIS-1-01`, `QA-C-01`, `QA-C-09`, `QA-C-14`, `ARR-C-07..12`.

---

## ⛔ Mode: PLAN-ONLY. Nothing was written to Figma. Nothing was read from Figma.

The Figma MCP seat quota was exhausted account-wide for the entire session. It
is a seat cap on the Professional plan, not a rate limit: `use_figma` **and**
read-only `get_metadata` returned the same refusal, so backing off does not
clear it and a read costs the same as a write.

```
$ node scripts/baseline/figma-mcp.mjs tools/list
… 30 tools, use_figma present …            ← server and auth are FINE

$ …rpc('tools/call',{name:'get_metadata',arguments:{fileKey:'g4GzQFqzNYz5sosz1QtZXC',nodeId:'1776:8374',…}})
{"result":{"isError":true,"content":[{"type":"text","text":
 "You've reached the Figma MCP tool call limit for your Full seat on the
  Professional plan. Upgrade your seat or plan for more tool calls. …"}]}}
```

The brief's own instruction was followed first (back off 60–90s, do not hammer):
a retry driver ran against the single highest-value read with 120s backoff and
returned the identical refusal on every attempt. The coordinator then confirmed
the account-wide cap at the parent level and issued a hard stop; **the driver
was killed and no Figma call of any kind has been made since**, including
`verify-invariants.mjs`.

**Consequence, stated plainly.** The brief's rule 2 is *a write is not verified
by the write — read every changed node back and quote the read-back.* I could
neither write nor read. **0 of the 35 boards in `1776:8374` were opened and 0
were modified**, so nothing below is `IMPLEMENTED` and nothing is
`ALREADY-CORRECT` on board evidence. What exists instead is the complete,
resolvable plan set in `../plans/`, so applying it later costs a handful of
calls rather than a re-derivation.

### Node ids: read vs inferred

**I read zero node ids from the file this session.** Every id below comes from a
prior lane's committed read record. This distinction is load-bearing and is
repeated in `../plans/history-README.md`:

| ids | source | age / risk |
|---|---|---|
| all board ids, names and sizes in this section | `docs/design-jobs/baselines/figma-page-1-3-pre-reorg.tsv` | ids survive a re-lay; the **positions in that file are stale** (pre-reorg) — I used `ARR-C-07..12` for current coordinates instead |
| `163:213` band, `163:215` body, `229:1144` Cancel, `229:1146` Restore, + their exact offsets | `QA-C-01` evidence in `_board-level.json` | quotes exact frames/offsets; high trust |
| `163:167` (VIS-1-01's board) | `VIS-1-01` in `_board-level.json` | exact |
| `172:3`, `172:6` (captions) | `QA-C-14`, `QA-C-09` | exact |
| `163:110/112`, `163:276`, `163:315`, `453:4038/4042/4044` + verbatim live strings | `LEDGER.jsonl`, agent `verifier-history`, 2026-09-02 | 5 days old |
| the tab-row FRAME on `163:167`; the slider thumb on `163:113`; every chip / approval-band / drawer-label TEXT node | **never recorded by any lane** | these are the `unresolved-id` rows — selector only |

---

## The table

| V2 finding id | recommendation | affected V1 board(s) | action taken | read-back evidence | status |
|---|---|---|---|---|---|
| `UX-I-01` **Critical** — the "All changes" timestamp is labelled *"Jump to 14:32"*, RESTORES, truncates the stack and empties redo, with no confirm (`ActivityView.tsx:360-393,536-537`; `HistoryManager.ts:757-775`) | Timestamp previews; restore becomes a separate confirmed action naming what it discards, saving current work first | `163:2` History · Saves · changes + new sibling `History · Saves · changes · restore-confirm` | `plans/history-state-boards.json` board 1 — clone of `163:2`, wired from `163:2`, with the full confirm copy resolved (title `Restore to 14:32?` · body naming the discarded count and the redo loss and whether any is unsaved · `Cancel` · `Restore, discard 12 changes`) plus the corrected row label/tooltip. Hotspot row 1 of `plans/history-hotspots.json` puts the edge on the timestamp, not the board. **Deliberately NOT marked `[design-ahead]`** — the code has moved: `ActivityView.tsx:400-462` (working tree) now routes the timestamp through `requestRestore` → `ConfirmDialog` with these exact strings, the discard count derived from the *unfiltered* stack so a search box cannot undercount it; the `aria-label` is `Restore the project to 14:32`; "Jump to" survives only in the comment at `:402` explaining what it used to do | **none — no Figma call was made** | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-02` **Critical** — the scrubber's "Restore this point" fires the same truncating restore with no confirmation | One restore contract: preview → confirm naming the cost → restore, current state auto-saved first | `163:113` + new `[design-ahead] History · Saves · time-travel · restore-confirm` | `plans/history-state-boards.json` board 2 — clone of `163:113`, full copy (`Restore to 14:32?` · "Your current work is saved as a version first. This discards 12 later changes and everything you can currently redo." · `Keep scrubbing` · `Restore, discard 12 changes`). Hotspot row 3 over "Restore this point". `[design-ahead]` is correct here: `HistoryTab.tsx:197 handleScrubberRestore → composer.history.restoreEntry(entryId)` is still a bare call | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-03` **Critical** — the scrubber's document keydown has no text-field guard; Enter in the search box restores the middle of the stack | Scope the drawer's keys to the drawer, or guard on the focused element | `163:113` | **Code half already fixed in the working tree** — `TimeTravelScrubber.tsx:271-283` now returns early for `TEXTAREA`, contentEditable, and `INPUT` where `type !== "range"` (the range exception is load-bearing: the drawer's own control is the slider). No V1 board draws a keyboard handler, so the board consequence is only that the drawer prints the key contract it now honours — carried by the two `UX-I-10` copy rows | code read-back quoted (`git diff` of `TimeTravelScrubber.tsx`). **This is a code fact, not a board fact — no board was read** | code half **ALREADY-CORRECT** · board copy **BLOCKED-ON-QUOTA** |
| `UX-I-12` **Critical** — the scrub preview is the nearest *named* version's screenshot; with none, the layer is `opacity: 0` and the live canvas shows through under "Previewing: 14:32 — Added block" | Say there is no frame for this point, name the nearest snapshot, disable Restore | `163:113` + new `[design-ahead] History · Saves · time-travel · no-preview` | `plans/history-state-boards.json` board 3 — full copy (`No preview for this point` · "The nearest saved frame is from 13:05. Scrub there to see it, or save a version now so this point has one." · disabled `Restore this point` with the reason stated · `Go to 13:05`). Hotspot row 4 over the "Previewing" label — the node that lies is the door onto the honest state. The finding's second branch (restore into a backable preview mode) is a behavioural change a state board cannot carry; the first branch is taken and the choice is recorded on the board | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-04` **Major** — Left/Right fire in both the canvas and the scrubber; the canvas stays interactive because the overlay is `pointer-events:none` and the preview layer transparent | Time-travel is a mode: canvas non-editable, keys inert, said on the canvas | `163:113` (panel half only) | `plans/history-geometry-and-arrangement.json` → `geometry[1]`: the drawer band states the mode ("Time-travel is on. The canvas is read-only; ← → step the timeline."). **The canvas half is not coverable in this section** — every History board here is 280/360 wide and none draws the canvas under an open drawer. Owner: `1779:5` "09 · Canvas" / `1776:8385` "01 · Shell". Recorded, not applied elsewhere | none | panel half **BLOCKED-ON-QUOTA** · canvas half **NOT-APPLICABLE to this section** |
| `UX-I-05` **Major** — undo capped at 100, oldest dropped silently; `HISTORY_CAPACITY_WARNING` has zero emitters and zero listeners | End the list with a stated boundary; tell the user once when the cap is first hit, with "Save a version" beside it | `163:2` + new `[design-ahead] History · Saves · changes · start-of-history` | `plans/history-state-boards.json` board 4 — boundary row (`History starts here` / "Earlier steps were dropped — this list keeps the last 100.") + the door ("Save a version to keep a point") + the first-hit notice. Hotspot row 5. **`163:269` History · Saves · pruned-notice is NOT this state** and reusing it would re-create the very conflation `UX-I-09` is about: `LEDGER J-163:269` measured it live and it draws the *version* store's 50-item rule ("Older auto-saves were removed / Past 50. Named versions and the approved one were kept."). The undo stack's 100-step cap has no board at all | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-06` **Major** — the change list's built error state is unreachable; a failed read renders "No undo history" | Wire the failure through, or delete the branch | new `[design-ahead] History · Saves · changes · load-error` | `plans/history-state-boards.json` board 5 — **cloned from `453:4031` History · Saves · load-error**, the state it should always have been a sibling of. `LEDGER J-453:4031` measured that board's live copy verbatim ("Couldn't load version history." / "Your versions are still stored. Only this list failed to load." / "Try again"), which is already the honest form this finding asks for, so the clone inherits the right shape and only the subject changes. Hotspot row 6 deliberately hangs the edge off the empty-state title, so the prototype shows the pair the finding is about — "nothing happened" vs "I could not read it" | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-07` **Major** — "Clear" wipes the undo stack behind a same-button "Clear all" confirm that never states the cost, hidden behind a filter chip | State the cost, or drop the control | `163:2` + new `[design-ahead] History · Saves · changes · clear-confirm` | `plans/history-state-boards.json` board 6 — costed confirm (`Clear this session's history?` / "Undo will stop working for the 47 steps before now, and it cannot be brought back. Saved versions are not affected." / `Cancel` / `Clear 47 steps`). Hotspot row 2. The finding's second branch — delete the control — is recorded as an open decision on the board rather than taken: removing a control is a founder call and the costed confirm is safe either way | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-09` **Major** — "Milestones" vs "All changes" presents two different stores as two filters of one list, with the retention promise printed under both | Name them for what survives — "Saved versions" / "This session" — and put the durability sentence on the session list | `162:2`, `163:2`, `163:64`, `163:113`, `163:167`, `163:220`, `163:269`, `453:4031`, `1138:4573` — **nine boards** | 19 rows in `plans/history-text.json`: 18 chip rewrites across all nine boards, plus the prune note on the session list becoming "This session only — the last 100 steps, cleared when you reload. Save a version to keep a point." The largest single change in the module, and the one the founder's precedence rule most clearly assigns to the board (on-screen copy → the BOARD) | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-10` **Major** — the drawer declares `aria-modal` and implements no Escape; the printed exit is `Ctrl+Shift+T`, a chord the browser owns | Escape exits; pick a chord the browser does not own | `163:113` | 2 rows in `plans/history-text.json`: "Exit time-travel" → "Exit time-travel  (Esc)", and the printed `Ctrl+Shift+T` **spliced** to `Esc` (splice, not replace — the node is probably "Ctrl+Shift+T to exit" and a whole-node replace would eat the rest). `TimeTravelScrubber.tsx:270-286` still has no `Escape` case, so this is board-leads-code | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-14` **Major** — the only control creating a durable restore point is a text link three navigations from the canvas | "Save a version" beside Save in the topbar, and as an action on any session row | `163:2` (session-row half) · topbar lives in `1776:8385` | Session-row half is carried by the new `start-of-history` board's action ("Save a version to keep a point") and by the `UX-I-09` prune-note rewrite, which puts the same door on the session list. **The topbar half is outside this section** and was not applied to a board another module owns | none | session half **BLOCKED-ON-QUOTA** · topbar half **out of section** |
| `UX-I-15` **Major** — a binding or media delete switches Undo off and nothing in the UI listens | Disable/annotate the undo control the moment history stops covering the last action, and name the action | new `[design-ahead] History · Saves · changes · undo-unavailable` | `plans/history-state-boards.json` board 7 — the notice ("Undo isn't covering your last action" / "Binding a field to content isn't undoable. Undo starts working again with your next edit.") plus the disabled-undo tooltip. **The finding is half stale and I did not carry it over unaltered** — see *Contradictions* §1: the Undo control is already disabled on this event; what is missing is the naming. The label is engine-supplied user-facing copy (`noteUnrecordedAction`'s docblock: "said the way the toast will say it"; `BaseBindingManager.ts:106` passes "binding a field to content") | none | **BLOCKED-ON-QUOTA** (plan complete, finding corrected) |
| `UX-I-16` **Major** — "Now — N changes since approval" is computed from the in-memory undo stack, which resets on every project load | Derive drift from persisted versions; where the count cannot be known, say "edited since approval" | `162:2`, `163:2`, `163:167`, `163:220`, `163:269` — every board drawing the approval band | 5 rows in `plans/history-text.json`: the Now row becomes "Now — edited since approval". `SavesChrome.tsx:89-107` still counts `getHistoryStack()` filtered by `timestamp > approvedAt` and `HistoryManager.ts:136-157` still resets both stacks on `PROJECT_LOADED`, so the number remains unbacked | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-08` **Minor** — `exportVersions`/`importVersions` are implemented and no screen calls either | Saves overflow with Export / Import, import defaulting to merge, destructive option named explicitly | new `[design-ahead] History · Saves · overflow — Export / Import` | `plans/history-state-boards.json` board 8 — three rows with merge as the default and "Replace everything with an import…" as its own explicitly-destructive row, plus the reason the feature matters ("Versions are stored in this browser. Export before switching machines."). Hotspot row 7 hangs it off "+ Save a version", the one control that already writes to the version store. Re-verified today: `grep exportVersions\|importVersions src/` returns only `engine/storage/VersionHistoryStorage.ts:269,284` and `engine/VersionTimelineManager.ts:360,378` — no `editor/` caller | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `UX-I-11` **Minor** — the drawer's `left` is the rail width and `right` a hardcoded 320px, so ~232px sits under the History panel | Anchor the drawer to the canvas region the way the preview layer already measures `#editor-canvas` | `163:113` (360×776) | **`NOT-APPLICABLE` to this section, with the reason recorded in `plans/history-geometry-and-arrangement.json` → `geometry[2]`:** `163:113` is a panel-width board; it does not draw the drawer's position relative to the canvas, the panel or the inspector, so no geometry on it can be wrong in the way the finding describes. Carrying it here would mean inventing a full-screen History board and duplicating the shell family in `1776:8385` | reason rests on the board's recorded size `360x776` (pre-reorg TSV), not on a read I took | **NOT-APPLICABLE** |
| `UX-I-13` **Minor** — the scrubber opens with the slider parked at the MIDDLE of the stack | Open at the current state, timeline running back from it | `163:113` | `plans/history-geometry-and-arrangement.json` → `geometry[0]`: move the thumb to the right end of the track and re-point the "Previewing" label at the newest entry. **This is the one row in the module with no id and no text to match** — no lane ever recorded the thumb — so it carries a `shape` selector instead of a `contains`. `TimeTravelScrubber.tsx:74-78` unchanged | none | **BLOCKED-ON-QUOTA** (plan row written, shape selector) |
| `UX-I-42` — module summary; calls History's entry point a **"rail tab 'History'"** | — | every board in `1776:8374` instancing the shared Rail `2040:8372` | **The V2 wording is wrong and the repo already rules against it.** `RAIL_FIGMA` (`tabsConfig.ts:349-351`) is an explicit allow-list rendering exactly six ids — `add, layers, pages, assets, content, design`. History is `tabsConfig.ts:218-227`: `id: "history"`, `section: "bottom"`, `pattern: "standalone"`, `shortcut: "H"`, `mode: "panel"` — **no rail button**. Doors: ⌘H, `SiteMenu.tsx:200` "Version history", `SiteMenu.tsx:206` "Publish history" (deep-linking the Published sub-view via `AquibraStudio.tsx:513`), and ⌘K. `UX-FLOW-MAP.md` §Contradictions ¶1 already rules `UX-F-01`/`UX-F-37` over `UX-I-42` on exactly this point. The two checks that would turn this from a code fact into a board fact — count the rail buttons on every board instancing `2040:8372`, and grep the section's TEXT for "rail" — are written out in `plans/history-geometry-and-arrangement.json` → `verification[0]` and **were not run** | none — the conclusion is from the code and from `UX-FLOW-MAP`, **not from counting buttons on a board** | claim **NOT-APPLICABLE (V2 wording superseded)** · board check **BLOCKED-ON-QUOTA** |
| `VIS-1-01` **Major** (render defect, assigned) — on `163:167` the two tab sub-labels render THROUGH the tab row; "Named milestones" is struck by the active-tab underline and both it and "What's live" are clipped at the row's bottom edge | Raise the tab row from 44 to 60px (or move the sub-labels below the underline) | `163:167` **and every sibling drawing the same tab row** | `plans/history-render-defects.json` op 1 + `scripts/figma/fix-history-render-defects.mjs` (new script — nothing in `scripts/figma/` resizes a frame and re-seats its children). Board id `163:167` is exact; the tab-row FRAME id was never recorded by any lane, so it is selected by shape (nearest `FRAME` ancestor of the sub-label TEXT nodes). **The script does not trust the finding's single-board scope**: `HistoryTab.tsx:225-236` draws the same `VIEW_LABEL` + `HELPER_TEXT` header on every Saves and Published board, so it sweeps every board in the section, reports `ALREADY` for any already ≥60 with sub-labels inside, and reads height + sub-label bottoms back inside the same call | none — the dry run could not be executed | **BLOCKED-ON-QUOTA** (script + plan complete, `node --check` clean) |
| `QA-C-01` **Critical** (board-level, in section) — the rewritten confirm body `163:215` is 4 lines in a 96h clipping frame and renders straight through both buttons | Grow `163:213` to 280×136 and re-stack the button row to y=98 | `163:167` / `163:213` / `163:215` / `229:1144` / `229:1146` | Same plan + script, op 2. All four ids and the from-geometry are exact (quoted from `QA-C-01`'s own evidence). Took the *grow the frame* branch and recorded why the *shorten the copy* branch is rejected: the offered shortening drops exactly the scope correction `QA-C-09` asked for (every project setting, and the element→content bindings) | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `QA-C-09` **Major** (board-level, in section) — caption `172:6` says "Restore always confirms", which was false for `composer.history.restoreEntry()`, and understates the blast radius | Rewrite naming the safety save, the abort-on-failure rule and the full replace scope | caption `172:6` | Row in `plans/history-text.json`, **updated past `QA-C-09`'s own prescribed text** because the code moved after it was filed. `QA-C-09` ends "(Restoring from the activity list or the scrubber does neither.)" — the activity-list half is now false. The row reads "…Restoring from the activity list confirms too, and names how many later changes it discards; the Time-Travel scrubber still does neither." | none | **BLOCKED-ON-QUOTA** (plan complete, source text corrected) |
| `QA-C-14` **Minor** (board-level, in section) — caption `172:3` claims a named version is "the only thing that survives a long session" | "…the only thing **guaranteed to survive** a long session" | caption `172:3` | Splice row in `plans/history-text.json` (splice, not replace — the target is a fragment inside a long caption and a whole-node replace would truncate it) | none | **BLOCKED-ON-QUOTA** (plan complete) |
| `ARR-C-07` · `ARR-C-08` · `ARR-C-09` · `ARR-C-10` · `ARR-C-11` · `ARR-C-12` (arrangement, this section) | Wrap the five 1440-wide Published boards 3+2; lead each tab block with its own root; group the three 280-wide Published states; collect the seven Backups boards into one contiguous design-ahead block; demote `433:2348` to a fragments band; rename the seven drifted captions and add four missing Published ones | `1776:8374` | All six written out with their board ids and target positions in `plans/history-geometry-and-arrangement.json` → `arrangement[]`. **Deliberately sequenced LAST** — the state-board pass adds 8 boards (7 of them design-ahead, belonging in `ARR-C-10`'s block), so re-laying first means re-laying twice. `ARR-C-12`'s caption *renames* are also sequenced after the `172:3`/`172:6` *copy* rewrites, so a caption is never named for content it no longer carries | none | **BLOCKED-ON-QUOTA** (plan complete, sequenced) |

**Counts:** 16 `UX-I` + `UX-I-42` + 4 board-level singles + 6 `ARR-C` = **27 rows.**
`BLOCKED-ON-QUOTA` 24 · `NOT-APPLICABLE` 2 (`UX-I-11`; `UX-I-42`'s claim) · `ALREADY-CORRECT` 1 (`UX-I-03`, **code** evidence only) · `IMPLEMENTED` **0**.

---

## `verify-invariants.mjs`

**Not run — deliberately.** Its first action is an MCP call against
`g4GzQFqzNYz5sosz1QtZXC` and every such call returns the seat-quota string.
Per the coordinator's hard stop, a quota string is not a measurement, so probing
again to produce one would be noise. I changed nothing, so the section's
invariants are whatever they were at the start of the session. The run is owed
twice when the quota reopens: once before `../plans/` is applied (baseline) and
once after.

---

## What I did NOT cover — explicitly

1. **Nothing was written to Figma. 0 of 35 boards opened, 0 modified.**
2. **Nothing was read from Figma. Every node id in the plans is second-hand**,
   sourced per the provenance table above. The `LEDGER` ids are 5 days old and
   the pre-reorg TSV's *positions* are stale (its ids are not).
3. **No screenshots, no side-by-side.** The Figma loop's real acceptance test —
   board screenshot vs live screenshot at 1440×900, by eye — was not run for any
   board in this section.
4. **The canvas half of `UX-I-04`** (canvas visibly non-editable, mode said on the
   canvas) belongs to `1779:5` / `1776:8385`. Not applied.
5. **The topbar half of `UX-I-14`** ("Save a version" beside Save) belongs to
   `1776:8385`. Not applied.
6. **`UX-I-11` is `NOT-APPLICABLE` here and was not applied anywhere else.** If
   the founder wants the drawer's canvas-relative geometry drawn, this section
   has no board that can carry it.
7. **The Published family (9 boards) and the design-ahead Backups family (7
   boards) were not examined.** None of the 16 findings names them, but "not
   named" is not "checked and clear". `LEDGER` rows `J-184:37`, `J-184:45` and
   `J-453:4064` already carry an **`unreachable`** verdict against three
   Published boards and no board marker corresponds to it — someone should look.
8. **The shared Rail component `2040:8372` was not opened**, so `UX-I-42`'s board
   half is unverified (see the table).
9. **The 8 new state boards do not exist, so their copy plan cannot exist yet.**
   Their strings are fully written in `plans/history-state-boards.json` →
   `boards[].copy`, but the selector plan that puts them on the clones needs the
   ids `add-state-board.mjs` prints. This is step 5 of the run order and is the
   one genuinely un-authorable artefact.
10. **`plans/history-text.json` step 1 needs a human read before step 2.** The
    resolver fills `expect` with each node's *current* characters; if a chip node
    reads "Milestones · 12" rather than "Milestones", the whole-node replacement
    would drop the count and that row must become a splice. This is called out
    in the run order and is not a defect in the plan — it is the check that the
    plan cannot make for itself without the read.

---

## Contradictions with the V2 source

All three are cases where the V2 audit was right when taken and the code moved
under it. Recorded rather than silently applied, per the brief.

1. **`UX-I-15` is half stale.** It states "nothing in the UI listens" to
   `HISTORY_UNRECORDED` and that "the only UI listener in `useHistoryFeedback.ts:254`
   is `HISTORY_NOOP`, i.e. the refusal, not the notice." No longer true:
   `packages/editor/src/editor/shell/hooks/useComposerInit.ts:705-716` includes
   `EVENTS.HISTORY_UNRECORDED` in `HISTORY_STATE_EVENTS` and re-reads
   `canUndo`/`canRedo` on it, so **the Undo control is already disabled** the
   moment an unrecorded action lands. Landed in `de36af334`
   ("fix(history): Undo stops offering after an action that is not in history",
   2026-09-04) — two days *before* the V2 page was built, so the lane missed a
   listener rather than pre-dating it. The surviving half, and the half the
   board draws, is **naming** the action: the switch-off is no longer silent,
   only anonymous.

2. **`UX-I-01` and `UX-I-03` are fixed in the founder's working tree**, which
   makes `QA-C-09`'s prescribed replacement caption wrong.
   - `UX-I-01` — `ActivityView.tsx:400-462`: the timestamp calls `requestRestore`,
     which opens a `ConfirmDialog` (`Restore to 14:32?` · "It permanently
     discards N later changes and everything you can currently redo." ·
     `Restore, discard N changes`), the count derived from the unfiltered stack.
     `aria-label` is `Restore the project to 14:32`; "Jump to" survives only in
     the comment at `:402`.
   - `UX-I-03` — `TimeTravelScrubber.tsx:271-283`: a text-entry guard returning
     early for `TEXTAREA`, contentEditable, and `INPUT` where `type !== "range"`.
   - Consequence: `QA-C-09`'s caption tail "(Restoring from the activity list or
     the scrubber does neither.)" is now false for the activity list; the plan
     row carries the corrected tail.
   - **These changes are UNCOMMITTED** in the founder's live tree
     (`git diff --stat`: `ActivityView.tsx +88`, `TimeTravelScrubber.tsx +15`,
     plus both test files). I did not stage, commit or stash anything. **If they
     are reverted, `UX-I-01`'s new board must be re-marked `[design-ahead]` and
     the `172:6` caption tail reverted to `QA-C-09`'s wording.**

3. **`UX-I-42` calls History a "rail tab".** It is not; `RAIL_FIGMA` renders six
   ids and History is a registered tab with shortcut `H` and no rail button.
   `UX-FLOW-MAP.md` §Contradictions ¶1 already rules `UX-F-01`/`UX-F-37` over it.
   Carried into the plan as a *check*, not as a change.

Additionally, one trap that is not a contradiction but reads like one:
**`UX-I-05`'s cap and the board `163:269` are different caps.** `163:269`
"History · Saves · pruned-notice" reads as *the* pruning state and is the version
store's 50-item rule (`LEDGER J-163:269`, measured live). The undo stack's
100-step cap (`config.ts:108`, `HistoryManager.ts:613-629`) has no board at all.
Reusing `163:269` for `UX-I-05` would have re-created the exact conflation
`UX-I-09` exists to break.

---

## Artefacts

| file | rows | covers |
|---|---|---|
| `../plans/history-README.md` | — | provenance table, the 8-step run order, and why each step is sequenced where it is |
| `../plans/history-text.json` | 28, all `unresolved-id` with `{section, board, boardName, contains}` selectors | `UX-I-09` ×19, `UX-I-16` ×5, `UX-I-10` ×2, `QA-C-14`, `QA-C-09` |
| `../plans/history-render-defects.json` | 2 ops, ids exact except the tab-row frame | `VIS-1-01`, `QA-C-01` |
| `../plans/history-state-boards.json` | 8 boards, each with `cloneFrom`, `wireFrom`, marker policy, full copy and notes | `UX-I-01`, `UX-I-02`, `UX-I-12`, `UX-I-05`, `UX-I-06`, `UX-I-07`, `UX-I-15`, `UX-I-08` |
| `../plans/history-hotspots.json` | 8 rows, all `unresolved-id` | the inbound edge for each new board |
| `../plans/history-geometry-and-arrangement.json` | 3 geometry + 1 verification + 6 arrangement | `UX-I-13`, `UX-I-04` (partial), `UX-I-11` (NOT-APPLICABLE), `UX-I-42` (check), `ARR-C-07..12` |
| `scripts/figma/history-resolve-ids.mjs` | **new** | resolves every `selector` row in a plan to a TEXT node id in ONE mcp call; refuses ambiguous rows; supports `splice` so a fragment row cannot truncate its node |
| `scripts/figma/fix-history-render-defects.mjs` | **new** | `VIS-1-01` + `QA-C-01`, plan-driven, read back inside the same call |

Both scripts pass `node --check`. **Neither has been executed against Figma.**
