# V2 → V1 · Content / CMS (slug `content`)

**Target section:** `1776:8376` "06 · Content · 37" on page `1:3`.
**Source:** `docs/design-jobs/V2-TO-V1/slices/content.json` — 29 UX findings + 1 module summary,
plus the board-level rows filtered to this section from `QA-A.jsonl`, `QA-C.jsonl`,
`VIS-*.jsonl`, `FIG-A.jsonl` and `slices/_board-level.json`.

## Status of this pass: PLAN-ONLY. Nothing was written to Figma.

The Figma MCP seat quota was exhausted account-wide (fifteen agents, one Professional
seat). The coordinator issued a hard stop on all Figma calls mid-pass. Every plan below
is complete and applyable; **not one of them has been applied, and therefore not one of
them has a read-back.** Per the brief's rule 2, nothing here is marked `IMPLEMENTED`.

### What I actually read from the file, versus what I inferred

This distinction is the load-bearing part of this report.

**READ from Figma this session (two successful calls, both before the quota wall):**

| What | Where it is recorded |
|---|---|
| Section `1776:8376` — name `06 · Content · 37`, at `0,32309`, `3440x5957`, and **all 37 children** with id, type, name, x, y, w, h | `plans/content-section-read-2026-09-07.json` — the authoritative geometry for every slot computed in these plans |
| `2429:12111`'s board name = `Content · dynamic-pages` (a quota probe) | proves the board carries **no** `[not-implemented]` marker — QA-A-03's premise |

**INFERRED, never read back — every row that depends on one of these is marked
`unresolved-id` in its plan:**

- Every TEXT node id *inside* a board (`2429:21307`, `2429:21308`, `1706:8397`,
  `1706:8399`, `1173:4825`, `1173:4830`, `1753:8419`, `1744:8394` …) — taken from
  `QA-A.jsonl` / `QA-C.jsonl` / `FIG-A.jsonl`, which read them on 2026-09-06.
- The **current characters** of every `caption/*` node. This is why the caption work is
  an *append* plan keyed on a unique substring rather than an `apply-text-fixes`
  full-replacement plan: I cannot write an honest `expect` guard for text I have not read,
  and a full replacement would silently revert the two lanes that rewrote these captions
  on 2026-09-06.
- The `dp/*` layer names inside the dynamic-pages boards and the `Crumb` / `meta` /
  `block` / `spacer` frame names — taken from `scripts/figma/build-dynamic-pages-boards.mjs`
  at `667fd830d`. The applier reports `SHAPE-CHANGED` and skips a board whose frames do
  not match, so a wrong inference fails loudly.
- The frame-level reaction destination `149:84` on the four dynamic-pages boards — from
  QA-A-12. `repoint-board-edges.mjs` **refuses** any row whose edge does not currently
  point at `from`, so a stale inference cannot overwrite somebody else's wiring.
- Whether commit `667fd830d` (2026-09-06, "QA found two Criticals in my own work")
  actually landed its dynamic-pages fixes in the file. Its *script* carries the fix; the
  *file* was never re-read. The generator in these plans is written to be correct either
  way, and now sweeps for a stray `TEMPLATE PAGE` / `Choose a page…` node and reports
  what it found.

### Design decisions this pass made (they are decisions, not omissions)

1. **The repeater is not drawn.** `FIG-A-01` is a measured NO-EDIT instruction ("Do not
   create a repeater board and do not rename anything. Record as covered so the next wave
   does not 'discover' the missing screen and design it"). The task brief asked for a
   decision rather than silence. The decision: **no board; the absence is stated on
   `caption/Content · collection` (155:49)** in the terms the code supports — re-verified
   by grep this session, `RepeaterRenderer.ts` and `CMSBindingManager.bindCollection`
   (`:215`, not `:208` — the working tree has shifted the line) have no caller outside
   `__tests__` and the barrel export.
2. **No proposed affordance is drawn as if it shipped.** V2 recommends an overflow menu on
   the collection row (UX-C-02), a template-page picker (UX-C-09), a repeater flow
   (UX-C-06), record import (UX-C-28). Drawing any of them on a truth board is the exact
   defect this arc exists to remove — and `667fd830d` had already had to delete an invented
   "Choose a page…" picker from four boards. Each recommendation is therefore recorded as an
   **absence with its evidence**, in the section's own commentary channel (a `caption/*`
   node outside the 280px panel, per QA-A-11) or in the board name (`apply-truth-marks`).
3. **Commentary goes outside the panel.** Nine new `caption/*` nodes; two audit paragraphs
   that were drawn as field hints inside a 280px panel move out (QA-A-11).
4. **The dynamic-pages bodies became data.** `build-dynamic-pages-boards.mjs` now reads
   `plans/content-dynamic-pages-body.json` instead of holding the copy inline, so the copy
   can be reviewed and applied by someone who is not its author.

### Apply sequence (all six steps are one dry run then one `--apply` each)

```
# 0 · offline sanity check — no network calls
node scripts/figma/check-content-plans.mjs
# 1 · two missing state boards (pinned slots — see the note in the plan)
node scripts/figma/add-state-board.mjs 2429:12111 "Content · dynamic-pages · unknown-key" --at 2500,4073 --apply
node scripts/figma/add-state-board.mjs 2429:12111 "Content · dynamic-pages · no-records"  --at 2900,4073 --apply
# 2 · fill all six dynamic-pages bodies (reads content-dynamic-pages-body.json)
node scripts/figma/build-dynamic-pages-boards.mjs --apply
# 3 · nine new captions (cloned from donor 155:47, skips a name that exists, collision-tested)
node scripts/figma/add-board-captions.mjs docs/design-jobs/V2-TO-V1/plans/content-captions-new.json --apply
# 4 · eight caption appends (idempotent by key, refused if the node would grow into the row below)
node scripts/figma/append-caption-text.mjs docs/design-jobs/V2-TO-V1/plans/content-captions-append.json --apply
# 5 · eight board renames
node scripts/figma/apply-truth-marks.mjs docs/design-jobs/V2-TO-V1/plans/content-marks.json --apply
# 6 · six frame-level edges repointed 149:84 -> 149:50
node scripts/figma/repoint-board-edges.mjs docs/design-jobs/V2-TO-V1/plans/content-dynamic-pages-edges.json --apply
# then, and only then:
node scripts/figma/verify-invariants.mjs
```

`add-state-board.mjs` rewrites the section's count in its own name. The count is
**children**, not boards: 37 today = 26 boards + 11 captions; after this pass, 48 = 28
boards + 20 captions.

## Findings table

Every row's status is `BLOCKED-ON-QUOTA` unless stated otherwise, because no write was made.
"Plan" names the file under `docs/design-jobs/V2-TO-V1/plans/`.

| V2 finding | recommendation | affected V1 board(s) | action planned | read-back evidence | status |
|---|---|---|---|---|---|
| **UX-C-01** Critical — a binding does not survive a reload on a real site; the save schema strips `cmsBindings` | do not present binding as durable; the Bound chip and the save indicator must say when it is session-only | in-section: `155:50` `caption/Content · record` (id + geometry READ). Out of section: `160:105`, `161:17` (Inspector), topbar save chip (Shell) | append to `155:50`: "on a real site the binding does not survive a reload — sites.ts:192-214 strips cmsBindings in transit" · `content-captions-append.json` | none — not applied. Code half re-verified this session: `packages/shared/schemas/sites.ts:192-214` has no `.passthrough()` and no `cmsBindings` key | BLOCKED-ON-QUOTA (in-section half); **cross-module** for the Inspector/Shell boards — `FIG-A-14`/`FIG-A-15` assign those to the Inspector lane |
| **UX-C-02** Critical — a collection can never be renamed or deleted | give the row an overflow menu with Rename / Edit description / Delete, counting dependants in the confirm | `155:47` `caption/Content · root` (READ); the affordance's home would be `149:50` | record the absence, do **not** draw the menu (decision 2). Append to `155:47` · `content-captions-append.json` | none. Re-verified by grep this session: `deleteCollection` appears only at `CollectionManager.ts:154,159` and `CollectionStorage.ts:129` — zero call sites under `editor/` | BLOCKED-ON-QUOTA |
| **UX-C-03** Critical — a condition writes an attribute nothing reads | make it hide the element, or take the screen out of the panel | `151:87` + `1705:8378` (renames), `155:55` (caption) — all three ids READ | `[not-implemented]` rename on both boards naming `DataManager.ts:482-491`, + caption append · `content-marks.json`, `content-captions-append.json` | none. Code re-read this session: `DataManager.ts:482-491` sets/removes `data-condition-hidden` and nothing else | BLOCKED-ON-QUOTA |
| **UX-C-04** Critical — publishing a record refreshes nothing on canvas | publish must be a visible state change | `155:50` (READ) | caption append · `content-captions-append.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-05** Critical — drafts ship; the switch means two different things | one rule, shown; count drafts before deploying | `155:50` (READ) | caption append naming `CMSBindingManager.ts:120-123` (no status filter) · `content-captions-append.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-06** Critical — no repeater; one binding serves one record | design the "Repeat this with…" flow; it is the primary CMS screen | `155:49` `caption/Content · collection` (READ) | **absence recorded, screen not drawn** (decision 1, per `FIG-A-01`'s NO-EDIT) · `content-captions-append.json`, `content-deferred.json` | none for the caption. The absence itself re-verified by grep: `RepeaterRenderer` / `bindCollection` have no caller outside their own file, the barrel and `__tests__` | BLOCKED-ON-QUOTA (write); the **decision** is recorded and final |
| **UX-C-07** Critical — two record editors, only one of which confirms a delete | keep one editor | `1170:4749` (rename, READ) + new `caption/Content · records (modal)` + `155:51` append | rename + new caption + append · `content-marks.json`, `content-captions-new.json`, `content-captions-append.json` | none. Re-read this session: `CMSRecordsModal.remove()` calls `deleteContentItem` with no confirm | BLOCKED-ON-QUOTA |
| **UX-C-08** Critical — a failed publish-on-create leaves a hidden draft per retry | validate before writing, or keep the id | `1705:8408` `Content · record · save-error` (READ) — **it had no caption** | new `caption/Content · record · save-error` · `content-captions-new.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-09** Major — Dynamic pages states a blocking condition it cannot clear | put the template binding on this screen | `2429:21281` caption + `1170:4713` rename/caption (ids READ) | captions + rename; **no picker drawn** (decision 2) · `content-captions-new.json`, `content-marks.json` | none. Code re-read: `ContentViews.tsx:630` "Nothing in this panel sets it"; only writer is `CMSCollectionSetupModal.tsx:211` | BLOCKED-ON-QUOTA |
| **UX-C-10** Major — the popover's dead end names a command-palette entry | link into the Content panel, or add inline | `BindingPopover` boards live in `1776:8381` (Inspector) | none in my section; the destination's own caption records that the modal's only door is `⌘⇧P` | none | **NOT-APPLICABLE** — cross-module, Inspector lane owns `1776:8381` |
| **UX-C-11** Major — fields cannot be renamed, retyped or reordered; the wizard's drag handle is fake | make the row editable; make the handle real or remove it | `155:52` (append) + `1170:4713` (rename) — both READ | append + rename · `content-captions-append.json`, `content-marks.json` | none. Re-verified by grep: `updateField` (`CollectionManager.ts:201`) and `reorderFields` (`:232`) have no UI caller; `BOARD_HANDLE` at `CMSCollectionSetupModal.tsx:378` is a `<span>` with no handlers | BLOCKED-ON-QUOTA |
| **UX-C-12** Major — deleting a record silently blanks bound elements | count them in the confirm; fall back to placeholder copy | `155:50` (READ) | caption append · `content-captions-append.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-13** Major — the popover binds `content` for every field type | ask which property; offer only compatible fields | Inspector boards (`1776:8381`) | none in my section | none | **NOT-APPLICABLE** — cross-module |
| **UX-C-14** Major — an Image field is a plain text box in both editors | the field type should decide the input | `155:51` (READ) | caption append naming `useContentModals.ts:89` · `content-captions-append.json` | none. Re-verified by grep: `onOpenMediaLibrary` reaches only `inspector/`, never the Content panel or the records modal | BLOCKED-ON-QUOTA |
| **UX-C-15** Major — no CMS surface knows about roles | gate the writes; distinguish "you cannot" from "this did not reach the server" | `155:47` (READ) | caption append · `content-captions-append.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-16** Major — data sources are not saved anywhere | persist them, or stop presenting them as saved | `151:46` (rename) + `155:53` (append) — both READ | `[not-implemented]` rename naming `DataManager.ts:47` + `project.ts:30-66`, + caption append · `content-marks.json`, `content-captions-append.json` | none. Re-verified: `private sources: Map` at `DataManager.ts:47` is the only store; `ProjectData` has no sources field | BLOCKED-ON-QUOTA |
| **UX-C-17** Major — a name collision is reported as a syntax error | detect the collision and offer replace / rename | `155:53` (READ) | caption append · `content-captions-append.json` | none. Re-read: `ContentTab.tsx:153` bare `catch` → "Not valid JSON — check the syntax and try again." | BLOCKED-ON-QUOTA |
| **UX-C-18** Major — variables are keyed on the project NAME, in this browser | key on site id; put them in the project payload | `151:62`, `1705:8339`, `1705:8454` (renames) + `155:54` (append) — all READ | three `[not-implemented]` renames + caption append · `content-marks.json`, `content-captions-append.json` | none. Re-verified: `useContentPanel.ts:81` `projectId = getProjectMetadata().name`; `contentPanelUtils.ts:21-23` builds the key from it | BLOCKED-ON-QUOTA |
| **UX-C-19** Major — nothing outside Content knows dynamic pages exist | show generated routes in Pages; add a CMS line to the pre-publish facts | in-section: new `caption/Content · dynamic-pages`. Out of section: `141:207` (Pages), `833:4518` (Publish) | in-section caption states the silence · `content-captions-new.json` | none | BLOCKED-ON-QUOTA (in-section half); **cross-module** for Pages/Publish — `FIG-A-16`/`FIG-A-17` assign those |
| **UX-C-20** Major — three screens create a collection and disagree | one field-type vocabulary, one field editor | `1170:4713` (rename + new caption), `155:47` (append) — ids READ | rename + caption · `content-marks.json`, `content-captions-new.json` | none. Re-verified: `CMSCollectionSetupModal.tsx:47` = 5 types; `ContentViews.tsx:440` = 9 types | BLOCKED-ON-QUOTA |
| **UX-C-21** Major — the e-commerce offer creates a collection and binds nothing | finish the flow; make the offer recoverable | the dialog's board is in section **22 · Ecommerce** (`1779:6`), not mine | the new collection-setup caption names the e-commerce dialog as the third, disagreeing definition | none | **NOT-APPLICABLE** — board outside `1776:8376`; the cross-reference is planned |
| **UX-C-22** Major — step 1's Content type is discarded; zero-field and duplicate-name collections are reachable | make the control do what its label implies, or drop it | `1170:4713` (READ) | rename naming `:112` declared, `:326` rendered, never read by `handleCreate` (`:168-227`) · `content-marks.json` | none. Re-read this session: `handleCreate` never references `contentType` | BLOCKED-ON-QUOTA |
| **UX-C-23** Minor — neither record view can be searched, filtered, sorted or paged | search box, status filter, paging, column choice | `155:49` (append) + new `caption/Content · records (modal)` — ids READ | caption work · `content-captions-append.json`, `content-captions-new.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-24** Minor — pick mode arms with no notice and no way out | the panel should hold the only Cancel; scope the pick | `155:55` (READ) | caption append · `content-captions-append.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-25** Minor — the palette prints a `D` badge for a chord that does nothing | bind the chord or stop printing it | command-palette board `1177:4804` is in the Shell/Canvas section | none in my section | none | **NOT-APPLICABLE** — cross-module, **and materially corrected**: `UX-FLOW-MAP.md` §Contradiction 2 re-verified that `D` **is** bound (`useSidebarKeyboard.ts:34-47`); the observable defect survives for a different reason (`safeTabChange` re-targets the rail without opening the drawer). A board carrying UX-C-25's original wording would be false |
| **UX-C-26** Minor — "+ Create Collection" abandons the user in the wizard | return the collection to the caller; reopen the popover | Inspector boards (`1776:8381`) | none in my section | none | **NOT-APPLICABLE** — cross-module |
| **UX-C-27** Minor — restoring bindings at load disables Undo and blames the user | restoring persisted state is not a user action | the refusal surfaces in History/undo, not in `1776:8376` | none | none | **NOT-APPLICABLE** — cross-module (History lane) |
| **UX-C-28** Major — records go in one at a time and never come out | paste-a-table / CSV in, and an export | `1170:4749` (rename) + new caption — ids READ | rename + caption; the modal's existing `[not-implemented] Import JSON` frame (`1170:4771`, id inferred from `FIG-A-23`) is left alone · `content-marks.json`, `content-captions-new.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-29** Minor — no screen sets the display field | put "Show records by" on the collection settings screen | `155:49` (READ) | caption append · `content-captions-append.json` | none | BLOCKED-ON-QUOTA |
| **UX-C-30** module summary — the spine (collection → fields → records → repeater → publish) is absent | sequence the redesign around that one journey; give the collection a settings screen | the whole section | this pass makes the section state the spine's four missing links (repeater, durable binding, publish→canvas, template binding) in the section's own commentary channel, and marks the four screens whose outcome does not exist | none | BLOCKED-ON-QUOTA |

## Board-level rows inside `1776:8376`

| Row | what it asks | action planned | read-back evidence | status |
|---|---|---|---|---|
| **QA-A-01** Critical — all four dynamic-pages boards draw a TEMPLATE PAGE label + input | delete it from `2429:12111 / 21243 / 21262 / 21281` | the rewritten generator wipes every `dp/*` node and redraws without one, **and** sweeps the whole board for any TEXT matching `TEMPLATE PAGE` / `Choose a page`, reporting what it found either way · `content-dynamic-pages-body.json` | none. `667fd830d` (2026-09-06) claims to have removed it via this same generator; **that claim is unverified in the file** and the sweep exists because of it | BLOCKED-ON-QUOTA |
| **QA-A-02** Major — the "Choose a page…" placeholder promises a picker | remove the row | same sweep | none | BLOCKED-ON-QUOTA |
| **QA-A-03** Major — none of the four boards carries a status marker | strip the row (preferred) or mark the boards | strip, per QA-A-01's preference — so **no marker is added**, deliberately | **READ**: `2429:12111`'s name is exactly `Content · dynamic-pages`, and the section dump shows all four names unmarked. The premise is confirmed; the resolution is the strip | BLOCKED-ON-QUOTA (the strip is unapplied) |
| **QA-A-07** Minor — wrong state copy on `· no-pattern` | set `No pattern set — this collection generates no pages.` | in `content-dynamic-pages-body.json`, verbatim from `ContentViews.tsx:672` | none | BLOCKED-ON-QUOTA |
| **QA-A-08** Minor — placeholder reads `/collection/{slug}` | set `/menu/{slug}` | same plan, verbatim from `:645` | none | BLOCKED-ON-QUOTA |
| **QA-A-09** Minor — a third state string that exists in neither branch | set `4 records, none published…` **and add the "No records yet" sibling** | both: corrected copy + the new `· no-records` board · `content-dynamic-pages-body.json`, `content-new-boards.json` | none | BLOCKED-ON-QUOTA |
| **QA-A-10** Minor — labels drawn in ALL CAPS | set `URL pattern` | done in the generator, and the type is brought to `FIELD_LABEL`'s own 12px Regular ink-muted (`ContentViews.tsx:69`, which carries no uppercase transform). **This is one step beyond the letter of QA-A-10** — a sentence-case string left in Semi Bold 11 caps styling reads as neither | none | BLOCKED-ON-QUOTA |
| **QA-A-11** Major — two audit notes drawn inside the 280px panel as field hints | move them into `caption/*` nodes outside the frame | the generator no longer draws them; `caption/Content · dynamic-pages` and `· no-template` carry them · `content-captions-new.json` | **READ**: the section's 37 children include 11 `caption/*` nodes and **none** named for dynamic-pages — the absence half of QA-A-11 is confirmed from the file | BLOCKED-ON-QUOTA |
| **QA-A-12** Major — the frame edge lands on `Content · record` | repoint `149:84` → `149:50` on all four | six rows (four existing + two new siblings) · `content-dynamic-pages-edges.json`; the applier refuses a row whose edge is not currently `149:84` | none — the current destination was never re-read, which is precisely why the guard is there | BLOCKED-ON-QUOTA |
| **QA-A-13** Minor — `· unknown-key` and `· no-records` were never created; no captions | create both, one caption per board | two `add-state-board` invocations at pinned slots + six dynamic-pages captions · `content-new-boards.json`, `content-captions-new.json` | **READ**: the section dump lists exactly four dynamic-pages frames and zero dynamic-pages captions | BLOCKED-ON-QUOTA |
| **QA-A-04/05/06/14/15** | confirmed rows / citation additions | no action; QA-A-05 asks only for an added citation on a caption that does not exist yet — folded into `caption/Content · dynamic-pages` | none | folded in, BLOCKED-ON-QUOTA |
| **QA-C-05** (`155:52`) | fields caption rewritten | already applied on 2026-09-06 per `docs/design-jobs/applied/plan-qa-text.json`; my plan **appends** to it and is keyed on a substring so it cannot revert that work | none — I did not read `155:52`'s text | reported as applied-by-others, **UNVERIFIED by me** |
| **QA-C-20** (`1706:8399`) | records-modal header casing | already applied on 2026-09-06 per the same plan file (set to `TITLE PRICE PHOTO UPDATED`, the "uppercase all four" option) | none | reported as applied-by-others, **UNVERIFIED by me** |
| **ARR-A-21 / 22 / 23 / 24** Major — family splits and row order in this section | re-home five sub-states, the records modal and the collection-setup modal | **DEFERRED, with the reason written down** in `content-deferred.json`: nine new captions are placed at slots computed from the current geometry, so a re-lay must come *after* the annotation pass and `add-board-captions.mjs` must then be re-run (it skips a name that already exists, so it repositions nothing) | none | DEFERRED — see `content-deferred.json` |
| **CONF-1-04** Critical — 87.2% of paints on the new boards are unbound to `color/*` | bind them | **NOT PLANNED** — needs the `color/*` variable ids, which needs a read. Note: the four dynamic-pages boards are among CONF-1-04's own five *exceptions*, and everything this pass creates is a clone, so it adds no new hand-authored paint beyond the `dp/*` text fills that were already unbound | none | NOT PLANNED — reason in `content-deferred.json` |
| **CONF-1-13** Major — 3 sub-11px nodes on `2429:12111` | promote to `ui/11 · caption` | partly addressed as a side effect: the two 10px audit paragraphs leave the panel and the generator now draws only 11px and 12px. The third node is unidentified | none | PARTLY ADDRESSED, UNVERIFIED — must be re-read before anyone records it fixed |
| **VIS-1-19 / VIS-1-20 / VIS-3-02 / VIS-3-03** | render checks, all `clean` | none | none | ALREADY-CORRECT per those lanes' own reads (not re-verified here) |
| **QA-A-43** | "37 Content boards" count on `2357:11981` | **NOT MINE** — Reference section. Note left for its owner: 37 is *children* (26 boards + 11 captions), and this pass takes it to 48 | none | NOT-APPLICABLE |

## What I did NOT cover

1. **Nothing was written to Figma.** Zero boards changed, zero renames, zero captions,
   zero edges. Six apply steps are queued and unexecuted.
2. **`verify-invariants.mjs` was not run** — the coordinator's stop covers it, and its
   output under quota is the quota string, which is not a measurement.
3. **I never read the V2 source boards.** `2797:342`, `2797:574` (journey 2), `2797:323`
   and `2797:2` on page `2668:2` were not opened. Everything V2 in this report comes from
   `slices/content.json` (the extracted 29 findings + module summary) and the task brief's
   own summary of journey 2. If the boards carry anything the slice does not, this pass
   does not have it.
4. **I read 1 of 37 boards' interiors — none, in fact.** I read the section's child list
   (names and geometry) and one board's *name*. I opened no board's contents. Every claim
   about what a board currently draws comes from the QA/FIG/VIS lanes' 2026-09-06 reads.
5. **The `667fd830d` dynamic-pages fixes are unverified in the file.** The script carries
   them; whether the run landed is unknown. My generator is written to be correct in
   either case and now reports what it found.
6. **Four findings are cross-module and were not acted on**: UX-C-10, UX-C-13, UX-C-26
   (binding popover, section `1776:8381`, Inspector lane) and UX-C-27 (History). UX-C-01
   and UX-C-19 are half cross-module and only their in-section half is planned. UX-C-21's
   board is in section 22 · Ecommerce.
7. **Arrangement (ARR-A-21…24) and colour binding (CONF-1-04) are deferred, not done**,
   with reasons in `content-deferred.json`.
8. **No screenshot comparison.** The brief's acceptance for a rebuilt board is board
   screenshot vs live screenshot, by eye. No screenshots were taken (they are the
   expensive call, and the quota is gone). Every plan here is a truth-and-annotation
   change to existing boards plus two cloned state boards; none of it is a visual rebuild,
   so the by-eye acceptance does not apply — but that is an argument, not a measurement.

## Files this pass produced

| File | Applier |
|---|---|
| `plans/content-section-read-2026-09-07.json` | — (the one real read; the geometry every other plan is computed from) |
| `plans/content-new-boards.json` | `scripts/figma/add-state-board.mjs` (one invocation per row) |
| `plans/content-dynamic-pages-body.json` | `scripts/figma/build-dynamic-pages-boards.mjs` (rewritten to read it) |
| `plans/content-captions-new.json` | `scripts/figma/add-board-captions.mjs` — the **Layers lane's** script, reused rather than duplicated (see below) |
| `plans/content-captions-append.json` | `scripts/figma/append-caption-text.mjs` (**new** — an *append* keyed on a unique substring, because a full replacement needs an `expect` guard I could not read, and would revert two other lanes' 2026-09-06 caption rewrites) |
| `plans/content-marks.json` | `scripts/figma/apply-truth-marks.mjs` |
| `plans/content-dynamic-pages-edges.json` | `scripts/figma/repoint-board-edges.mjs` (**new**) |
| `plans/content-deferred.json` | — (rows deliberately not planned, with reasons) |
| `scripts/figma/check-content-plans.mjs` | offline validator — re-runs every slot, gap and id computation in these plans against the one read, with **no network calls**. `ALL PLAN CHECKS PASS` as of writing |

**A duplicate script was written and then deleted.** This pass wrote
`add-section-captions.mjs` before noticing the Layers lane had shipped
`add-board-captions.mjs` for the identical job in the same hour. Theirs is better
in the one place it matters — it derives the vertical gap from the donor caption's
own offset below ITS board instead of hardcoding 20 — so mine was deleted and
`content-captions-new.json` now speaks its `board` / `donor` shape. The one thing
theirs does not do is size the collision test to the height the NEW text will
take (it tests the donor's height), so `check-content-plans.mjs` estimates that
offline instead: all nine slots pass with the tightest at 90px into a 100px gap.

Two new scripts, and two small changes to existing ones: `add-state-board.mjs` gained
`--at <x>,<y>` (its free-slot scan collides against siblings but not against the section,
and would have put the second new board 140px past the section's right edge), and
`build-dynamic-pages-boards.mjs` moved its copy into the plan file and gained the
TEMPLATE-PAGE stray sweep.
