# CMS: verification report

## Run metadata
- **Date:** 2026-10-09 (PKT). Figma reads ran 2026-10-08 21:56–21:59 UTC.
- **Mode / arguments:** `verify` · `cms`
- **Git ref:** HEAD is `24640e769`; the source audit commit is `7a50e34e1`.
- **Drift check:** `git diff --stat 7a50e34e1 HEAD` over every CMS-related path (`editor/cms`, `engine/cms`, `engine/data`, `services`, `shell`, `inspector/sections`, `canvas`, `cms.service`, `publish.service`, `sites.service`, `routers/cms`, `shared/schemas`, `lib/publish-files.ts`, `prisma`) is **empty**. The implementation is unchanged since the audit, so the audit's runtime and test evidence still describes current behaviour, and is reused here with its original confidence.
- **Run flags:** none.
  - Figma was verified this run with 5 read-only `use_figma` calls (structure + 20 screenshots).
  - There was no new live walk, because no code changed. The runtime evidence comes from the audit run (`evidence/cms-2026-10-08/`, same implementation).
- **Inputs:** `specs/cms.md` (AT-01…AT-33, all 13 decisions approved), `design/cms.md` (30 boards), `02-issues.md` (54 issues).
- **Writes:** this file and `evidence/verify-cms-2026-10-09/` (20 board screenshots). Nothing in Figma or the code was modified.
- **Re-verification #3 (2026-10-09):** HEAD is `030979468` on main. **The CMS code CHANGED**: the audit-fix branch was merged, with 20 files on CMS/save paths. **Run flag for #3: `NOT_RUNTIME_VERIFIED`** (code and tests only). See the section at the end.
- **Re-verification #2 (2026-10-09):** after `design cms` Revision 2.
  - HEAD is `0c58215b1`; the CMS-path drift check against `7a50e34e1` is still empty.
  - 2 read-only `use_figma` calls: `w1`, a structural pass over all 45 boards; `w2`, 5 screenshots. Evidence: `evidence/verify-cms-2026-10-09-rev2/`.
  - The verdict, the per-criterion design column and the defects below reflect re-verification #2; see the section at the end.

## Verdict
| Dimension | Result |
|---|---|
| **DESIGN READY** | **31 of 33 criteria READY. The other 2 need no UI** (AT-19 server duplicate, AT-23 raw tRPC). All 5 board defects are fixed. Re-verification #2 was FIGMA_EVIDENCE: structural check 45/45 and visual check. |
| **FUNCTIONALLY COMPLETE** | **0 of 33.** 26 criteria fail on the current code; 7 are not built (C5 sources/Views/Constants/Visibility, and plan limits). |
| **VERIFIED COMPLETE** (design + implementation + integration + persistence + errors + tests) | **0 of 33** |

Figma-only completion is **DESIGN READY, not FUNCTIONALLY COMPLETE** (SKILL Phase E). No criterion may be called done until it passes at the "Verification level needed" set in the spec, on implemented code.

## Design verification (Figma)
- **Structural pass** (`v1`, all 30 boards):
  - Every board exists at 1440×900, and **every required content string is present (30/30)**.
  - **0 rows at 40px.**
  - The original section `4428:140485` still has 61 children, and the base board `4428:143182` Canvas still has 13. **The originals are untouched.** FIGMA_EVIDENCE
- **Binding / style hygiene:**
  - Every board has a constant **3 unbound paints + 1 text without a text style** (1 + 1 on D1–D6 and E3, where the drawer was removed). Because the count stays the same whatever content the board carries, it most likely belongs to the cloned shell (footer/drawer frames of `4428:143182`) rather than the new content. INFERRED, not confirmed by checking the original board.
  - Every new node built by the scripts reported **0 unresolved tokens**. FIGMA_EVIDENCE
- **Visual pass:**
  - Every one of the 30 boards was screenshotted individually and read: 10 during `design` and 20 in this run (`evidence/verify-cms-2026-10-09/`). FIGMA_EVIDENCE
  - **Not verified:** text legibility at 100%, because the screenshots were 0.5–0.6×. Prototype links don't exist.

### Board defects found (all FIXED in Revision 2, re-verified in #2)
Each needs a `design cms` fix run. None of them is an `EDT-` issue.

| Board | Node | Defect | Severity (design) |
|---|---|---|---|
| A6 Read-only external record | `8243:235002` | The header says **Team** (Google Sheets), but the table rows and the record fields still show Menu items sample data (Margherita, Slug, Price $12). The board contradicts itself. | High: it misleads review of AT-25 |
| C5 Plan limit | `8249:236229` | The tooltip covers the **Upgrade to Pro** CTA. The header says "100 / 100" while the pager says "1–8 of 24". | Medium |
| E2 Deleted / missing states | `8251:236574` | The "Replace image for Photo" button is clipped at the dock's right edge. | Low |
| B4 Settings, D7 Site data | `8248:234837`, `8250:237556` | The content column is centred in the workspace; the other tabs align left. | Low |
| D1–D6, E3 | various | The cloned Rail still highlights **CMS** on page and Pages boards. The drawer lists only "Menu items" on every workspace board. | Low (already in `design/cms.md` deviations) |

## Per-criterion results
How to read the columns:
- **Design:** READY / PARTIAL / NOT DRAWN / N/A (no UI).
- **Implementation:** `Confidence · Status` from the audit evidence on the unchanged code.
- **Verdict:** FAIL (behaviour contradicts the criterion), ABSENT (not built), or BLOCKED (not testable).

| AT | Criterion (short) | Figma node(s) | Design | Implementation evidence | Verdict |
|---|---|---|---|---|---|
| AT-01 | Create collection; title + slug; refusal shows reason | C2 `8249:234771`, A1 `8243:232532` | READY | VERIFIED_RUNTIME. Create works (D j2). Wizard defects (EDT-043) VERIFIED_BROKEN. A server refusal is silent (EDT-012), CODE_EVIDENCE. | FAIL |
| AT-02 | Add all 10 field types; multiselect needs an option; refusal in dialog | F4 `8260:239020`, B1 `8248:233437` | READY (rev 2) | VERIFIED_RUNTIME: 10 types OK. The wizard multiselect has no options (D-23). The refusal is swallowed (EDT-029), CODE_EVIDENCE. | FAIL |
| AT-03 | Key rename preserves rich text (interim: key locked, D-05) | B1 `8248:233437` | READY (lock) | VERIFIED_RUNTIME · VERIFIED_BROKEN: rename strips formatting (EDT-001, D-01). The lock isn't implemented, CODE_EVIDENCE. | FAIL |
| AT-04 | Type change confirm + conversion; Required impact | B2 `8248:233926`, B1 | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: instant change, no dialog (EDT-023, D-22) | FAIL |
| AT-05 | Field used only in SEO/href is locked; delete purges values | B1, F5 `8260:239442` | READY (rev 2) | CODE_EVIDENCE: SEO/attribute uses are not counted (EDT-028). VERIFIED_RUNTIME: values left after delete (`notesLeft: 2`). | FAIL |
| AT-06 | Panel docks at 480, table visible, first field focused | A4 `8243:233966` | READY | VERIFIED_RUNTIME: full overlay (EDT-032), focus stays on the row (EDT-024) | FAIL |
| AT-07 | Save → inline "Saved", panel stays open, value persists | A4 | READY | VERIFIED_RUNTIME: persistence OK. The inline Saved state with the panel staying open is not implemented (CODE_EVIDENCE: the sheet closes on save, proposal §7). | FAIL (partial) |
| AT-08 | Two tabs / two profiles → per-field diff; merge keeps both | A5 `8243:234482` | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: same-browser lost update (EDT-002); blind Keep mine (EDT-014) | FAIL |
| AT-09 | `api` / `index` / template slug / duplicate refused inline | B3 `8248:234422`, E1 `8251:236084` | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: all accepted (EDT-004, EDT-019) | FAIL |
| AT-10 | Every exit of a dirty record is guarded | F2 `8260:237906` | READY (rev 2) | VERIFIED_RUNTIME: 5 exits guarded; **drawer ✕ discards** (EDT-007) | FAIL |
| AT-11 | Delete names dependants; Undo restores the same id | C4 `8249:235700`, E2 `8251:236574` | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: new id on Undo (EDT-008). No dependants warning, CODE_EVIDENCE (EDT-027). | FAIL |
| AT-12 | Bulk publish 60 + Undo | A3 `8243:233452` | READY | VERIFIED_RUNTIME · EXPECTED_BUT_ABSENT: no bulk actions (EDT-026) | FAIL |
| AT-13 | Typed CSV import, bad rows reported, Undo import, export | C3 `8249:235137`, F1 `8260:237492`, F11 `8261:240102`, F12 `8261:240652` | READY (rev 2) | VERIFIED_RUNTIME · VERIFIED_BROKEN: strings stored, `false` shows Yes (EDT-009). Export absent, CODE_EVIDENCE. | FAIL |
| AT-14 | Pages tab Save; routes; publish counts record pages | B3, E3 `8251:237058`, D5 `8250:236796`, E4 `8251:237408` | READY | VERIFIED_RUNTIME: pattern/template save OK. The button says "Generate"; the publish confirm says "2 pages" while 59 generate (EDT-047). | FAIL |
| AT-15 | Offline collection delete keeps bindings + error | B4 `8248:234837`, F15 `8261:241967` | READY (rev 2) | CODE_EVIDENCE: unbind before delete, no catch (EDT-029). Not run live. | FAIL |
| AT-16 | Pin the oldest of 60; pin-only change survives reload | D1 `8250:235249` | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: 50-record window (EDT-003); pin not saved (EDT-006) | FAIL |
| AT-17 | Unpublish/delete → "Empty · Title" + marker after reload | D2 `8250:235648` | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: stale text, marker lost (EDT-011) | FAIL |
| AT-18 | List = publish (or marked drafts); empty state; <50 ms at 2k | D3 `8250:236011` | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: drafts + raw `{{item.*}}` (EDT-015). Performance BLOCKED (not measured). | FAIL |
| AT-19 | Duplicate site copies collections + records | — | N/A (server behaviour) | VERIFIED_RUNTIME · VERIFIED_BROKEN: copy has `[]` collections (EDT-005) | FAIL |
| AT-20 | No phantom sync toast; pill = gate count; save auto-retries | C6 `8249:236741` | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: toast never clears; gate disagrees; no auto-retry (EDT-012, EDT-018) | FAIL |
| AT-21 | Publish 1k records <2 s; `api` skipped; toasts below dialogs | E4 `8251:237408` | READY | VERIFIED_RUNTIME: toast covers Cancel (EDT-017). VERIFIED_TEST: `api/` fails the whole deploy (EDT-004, probe P8). CODE_EVIDENCE: synchronous generation (EDT-010). | FAIL |
| AT-22 | Keyboard-only path; focus return; axe 0 | F3 `8260:238456`, F2 | READY (rev 2) | VERIFIED_RUNTIME · VERIFIED_BROKEN: Escape dead, focus on the row (EDT-024). axe BLOCKED (not run). | FAIL |
| AT-23 | Raw tRPC: flag ignored, collection mismatch refused, procedure gone | — | N/A | VERIFIED_TEST · VERIFIED_BROKEN: probes P2, P3 (EDT-021, EDT-038). Procedure present, CODE_EVIDENCE (EDT-022). | FAIL |
| AT-24 | "Used by" opens the page + element + binding section | B1 | READY | CODE_EVIDENCE · CODE_GAP: lands in Layers, first use only (EDT-030) | FAIL |
| AT-25 | Sheets/Airtable source, read-only records, Sync now | A1, A6 `8259:237243` (rebuilt), B5 `8248:235219`, F8 `8261:238955`, F9 `8261:239334`, C2 | READY (rev 2) | CODE_EVIDENCE · EXPECTED_BUT_ABSENT: C5 not built; "Coming soon" seen live | ABSENT |
| AT-26 | Custom API, SSRF refusals, switch-source typed confirm | B6 `8248:235650`, F10 `8261:239716` | READY (rev 2) | CODE_EVIDENCE · EXPECTED_BUT_ABSENT | ABSENT |
| AT-27 | Source row deletion tombstoned; failed sync keeps data; pre-publish warns | B6, E4 | READY | CODE_EVIDENCE · EXPECTED_BUT_ABSENT | ABSENT |
| AT-28 | Pasted JSON source survives reload; Convert to collection | D7 `8250:237556` | READY | VERIFIED_RUNTIME · VERIFIED_BROKEN: vanishes after relaunch (EDT-016) | FAIL |
| AT-29 | View filters the canvas and the published list identically | C1 `8249:234343`, D3 | READY | CODE_EVIDENCE · EXPECTED_BUT_ABSENT: no `CmsView`, no evaluator | ABSENT |
| AT-30 | `{{collection.currency}}` renders; unknown key warns | B4 | READY | CODE_EVIDENCE · EXPECTED_BUT_ABSENT: no `constants` | ABSENT |
| AT-31 | Visibility rule removes the element from published HTML | D4 `8250:236412` | READY | CODE_EVIDENCE · EXPECTED_BUT_ABSENT: Conditions inert (proposal BD-10) | ABSENT |
| AT-32 | Product grid shows Products records; one upsert | D6 `8250:237174` | READY | CODE_EVIDENCE · CODE_GAP: `data-bind` resolved by nothing; ~7 upserts (EDT-042) | FAIL |
| AT-33 | Free 2/100 limits, server-enforced, Upgrade state | C5 `8249:236229` (tooltip fixed) | READY (rev 2) | CODE_EVIDENCE · EXPECTED_BUT_ABSENT: only the technical caps 100 / 10,000 exist | ABSENT |

**Totals:**
- **Design:** 31 READY · 0 PARTIAL · 0 NOT DRAWN · 2 N/A. Re-verification #2; it was 22 / 8 / 1 / 2 before Revision 2.
- **Function:** 26 FAIL · 7 ABSENT · 0 PASS.

## Extended traceability: issue → spec criterion → Figma node → code area → test
| Issue | AT | Figma node | Code area | Test today → needed |
|---|---|---|---|---|
| EDT-001 (P0) | AT-03 | B1 `8248:233437` (key locked) | `engine/cms/CollectionManager.ts:244-261`; `server/services/cms.service.ts:67-74` | `CollectionManager.rename.test.ts:30` pins the bug → rewrite + DB rename test |
| EDT-002 (P0) | AT-08 | A5 `8243:234482` | `services/syncRetryQueue.ts:218-292`, `cmsSync.ts` | none → two-tab Playwright test |
| EDT-003 | AT-16 | D1 `8250:235249` | `CMSBindingManager.ts:225-233`, `CmsBindingSection.tsx:170-180` | none → >50-record unit test |
| EDT-004 | AT-09, AT-21 | B3 `8248:234422`, E1, E4 | `shared/schemas/cms.ts:295-344`, `lib/publish-files.ts:176-179` | probe P8 (scratch) → committed DB test |
| EDT-005 | AT-19 | — | `server/services/sites.service.ts:458-530` | none → duplicate-site CMS DB test |
| EDT-006 | AT-16 | D1 | `engine/data/BaseBindingManager.ts:84-122` | none → autosave-after-bind test |
| EDT-007 | AT-10 | F2 `8260:237906` | `shell/StudioPanels.tsx:449` | none → Playwright exit-guard test |
| EDT-008 | AT-11 | C4 `8249:235700`, E2 | `CmsWorkspace.tsx:486-488`, `useContentPanel.ts:221-249` | none → restore-same-id test |
| EDT-009 | AT-13 | C3 `8249:235137`, F11, F12 `8261:240652` | `cms.service.ts:556-566` | `cms-csv-import.test.ts` (no type asserts) → add coercion cases |
| EDT-010 | AT-21 | E4 | `publish.service.ts:493-512` | bench (scratch) → worker timing test |
| EDT-011 | AT-17 | D2 `8250:235648` | `CMSBindingManager.ts:113-115,282`, `useCMSPreview.ts` | none |
| EDT-012 | AT-01, AT-20 | C6 `8249:236741` | `cmsSync.ts:265,284-291,340,400-428` | `cmsSync.outbox.test.ts` → terminal NOT_FOUND case |
| EDT-013/014 | AT-08 | A5 | `cms.service.ts:184-194`; `RecordSheet.tsx:612-638` | `cms-conflict.db.test.ts:60` pins the bypass → rewrite |
| EDT-015 | AT-18 | D3 `8250:236011` | `RepeaterRenderer.ts:155-186` | `RepeaterRenderer.test.ts` asserts canvas drafts → rewrite per D-04 |
| EDT-016 | AT-28 | D7 `8250:237556` | `DataManager`, `DataRowDialogs.tsx` | none |
| EDT-017 | AT-21 | E4 (toast below dialog) | chrome-ui Toast layering | none → hit-test check |
| EDT-021/022/038 | AT-23 | — | `shared/schemas/cms.ts:389-391`; `routers/cms.ts:87-97`; `cms.service.ts:347-405` | probes P2/P3 (scratch) → router tests |
| EDT-023 | AT-04, AT-05 | B2 `8248:233926`, B1 | `FieldInspector.tsx:147-160`, `CollectionManager.ts:223-275` | none |
| EDT-024/025 | AT-06, AT-22 | A4 (focus); grid focus not drawn | `RecordSheet.tsx:505-516`, `RecordsTable.tsx:161-210` | none → axe + keyboard Playwright |
| EDT-026 | AT-12 | A2 `8243:232939`, A3 `8243:233452` | `RecordsTable.tsx` | `RecordsTable.test.tsx` → status/bulk cases |
| EDT-028 | AT-05, AT-24 | B1 | `fieldUsage.ts:52-68` | `fieldUsage.test.ts` → SEO/attribute cases |
| EDT-029 | AT-15, AT-02 | B4 | `CollectionSettingsPane.tsx:75-97`, `AddFieldDialog.tsx:62-82` | none |
| EDT-030 | AT-24 | B1 | `fieldUsage.ts:25-30`, `CmsWorkspace.tsx:242-247` | none |
| EDT-031/032 | AT-06, AT-14 | A2–A6 tabs + dock | `CmsWorkspace.tsx:64-67,448-491`, `RecordSheet.tsx` | `CmsWorkspace.test.tsx` → tabs/dock cases |
| EDT-042 | AT-32 | D6 `8250:237174` | `blocks/Ecommerce/*`, `ProductCollectionService.ts:57-96` | none |
| EDT-043 | AT-01 | C2 `8249:234771` | `CMSCollectionSetupModal.tsx` | `CMSCollectionSetupModal.b13.test.tsx` → rewrite |
| EDT-047 | AT-14 | B3, E4 | `DynamicPagesPane.tsx`, publish confirm | none |
| C5 (no EDT) | AT-25…27, AT-29…31 | B5, B6, C1, B4, D4 | not built: no `cms-source`/`cms-view` services or models | none → C5 test plan (proposal C5 "Done when") |
| D-09 (no EDT) | AT-33 | C5 `8249:236229` | not built: plan limits | none |

## Candidate issues (found while verifying; no EDT IDs)
- **Design board fixes needed:** A6 sample data, C5 tooltip/CTA overlap and count mismatch, E2 clipped button, B4/D7 alignment, rail highlight and drawer list on cloned boards. Fix in the next `design cms` run.
- **Inherited shell paints:** the cloned shell carries 3 unbound paints and 1 unstyled text per board. The original board `4428:143182` probably has the same unbound paints, which would be a token-hygiene gap on the original CMS boards. Check with one read of the original board.
- **Add-field dialog:** `4418:164208` was not redrawn for the spec (multiselect options required, refusal error inside the dialog), so AT-02 design stays PARTIAL.

## What is NOT verified
- **Prototype navigation:** no links exist between the boards.
- **Text at 100% zoom:** the screenshots were 0.5–0.6×.
- **Live re-walk:** none was done in this run. The code is unchanged, and the audit's live evidence (2026-10-08, same implementation) is reused.
- **Still open from the audit:**
  - real publish/deploy output
  - L3-019 live
  - roles below OWNER
  - axe / screen reader
  - canvas performance at 2k+ records


---

## Re-verification #2 (after design Revision 2, 2026-10-09)

### Structural pass (`w1`, all 45 boards): **0 failures** · FIGMA_EVIDENCE
- **Content:** the required strings are present on 45/45 boards, including the 15 new F boards and the rebuilt A6 `8259:237243`.
- **Drawer:** 38 workspace boards each have exactly 4 collection rows, with the expected one selected:
  - Team on A6, B5, F8 and F9;
  - Events on B6;
  - Menu items on the rest.
- **Rail:** `Active=None` on D1–D6, `Pages` on E3, `CMS` on the other boards.
- **Rows:** 0 rows at 40px.
- **A6:** the old node `8243:235002` is gone.
- **Originals:** untouched. Section `4428:140485` still has 61 children, and the `4428:143182` Canvas still has 13. The proposal section now holds 91 children: 45 boards, 45 captions and the README.

### Visual pass · FIGMA_EVIDENCE
- **Seen individually after their last edit:**
  - all 15 F boards, and A6, C5, E2, B4, A2 and D1 (during Revision 2);
  - A1, B5, B6, D7 and E4 (in `w2`).
- **Drawer-only edits:** the remaining 15 workspace boards had only the drawer edited. They were checked structurally (see above) but **not re-screenshotted after that edit**. The same function produced the drawer on every board, and it was confirmed visually on 10 of them.
- **Not verified:** text at 100% zoom (screenshots were 0.5×); prototype links (none exist).

### Defect status
| Defect (verify #1) | Status | Evidence |
|---|---|---|
| A6 sample data | FIXED: rebuilt as `8259:237243` with Team data | `design-cms-2026-10-09-rev2/A6-rebuilt-team.png`, w1 content check |
| C5 tooltip over the CTA, count mismatch | FIXED: tooltip ends at 134px, Upgrade starts at 162px; pager reads "1–8 of 100" | measured in `f1`; `C5-tooltip-moved.png` |
| E2 clipped button | FIXED: the row wraps | `E2-wrap-fixed.png` |
| B4 / D7 centred | FIXED: left-aligned | `B4-left-aligned.png`, `verify-cms-2026-10-09-rev2/D7.png` |
| Rail highlight, drawer list | FIXED: rail variant and 4 collections with a single selection | w1 checks, `A2-drawer-4-collections.png`, `B5-team-active.png`, `B6-events-active.png` |

### Candidate issues (no EDT IDs)
- **D7 Site data drawer:** the drawer still highlights "Menu items", not the Site data › JSON data sources row, while the board shows the Site data panel. The drawer says "JSON data sources 1" but the board lists 2 sources. This is a P3-level polish item for the next design pass.
- **List row selected style:** the original `List row` component's selected styling comes from instance overrides, not its `Selected` property. This was found in Revision 2 and is a design-system hygiene item for the original library.

### Verdict after re-verification #2
| Dimension | Result |
|---|---|
| DESIGN READY | **31 / 33**; the other 2 need no UI |
| FUNCTIONALLY COMPLETE | **0 / 33**, unchanged. 26 FAIL and 7 ABSENT on the current code. CMS code is unchanged since the audit (drift check empty at `0c58215b1`). |
| VERIFIED COMPLETE | **0 / 33** |

The design is ready to hand to engineering. Nothing is functionally complete until the code passes AT-01…AT-33 at the level each one requires.


---

## Re-verification #3: implementation changed (2026-10-09)

### Run metadata
- **HEAD:** `030979468` (`Merge branch 'main' into fix/editor-audit-wave2`), an ancestor of `main`.
- **Drift:** `git diff --stat 7a50e34e1 HEAD` over the CMS, save and canvas paths shows **20 files, +576 / −87**.
  - Re-verifications #1 and #2 found no drift. The merge landed after #2 (HEAD was `0c58215b1` then).
- **Run flags:** `NOT_RUNTIME_VERIFIED` for this pass. No live walk; the evidence is code reading plus a unit-test run. The earlier live evidence (2026-10-08) no longer describes the changed behaviour.
- **Figma:** unchanged since #2. A read-only check (`w3`) found 91 children in the proposal section and 61 in the original section.

### Commits on CMS paths since the audit commit
`56a31dbbc` (L3-015 rename order) · `4180deaca` and `701c28522` (L3-016 canvas mirrors publish, re-resolves on bind/unbind/load/publish) · `a51581f6c` (unresolved binding still saved) · `5dda5a9f4` (L5-070 failed autosave retries; at once when online) · `9579895f2` (L5-074 no recovery banner over the server copy) · `2bc953a43` (L5-075 Restore saves) · `53346a2ec` (L5-074 Retry after reload re-sends kept edits) · `dc4a5e064` (save transaction budget) · `2b91ea01c` (L3-001 duplicate page slug → CONFLICT) · `5c0053cf6` (selection toolbar placement, not CMS).

### Tests run
- `npx vitest run` from `packages/editor`, covering:
  - `src/engine/cms`, `Composer.cms`, `useCanvasContent.cms`
  - `cmsSync*`, `unsavedRecovery*`, `useSaveCallback`, `useComposerInit.loadFlow`
  - `RecoveryBanner`, `CmsBindingSection`
- **Result: 36 files, 391 passed, 1 todo, 0 failed** (32.5 s). VERIFIED_TEST for what those tests assert.

### Issue status after the merge
These statuses are re-verification evidence only. The register (`02-issues.md`) is updated only by the next `audit cms`.

| Issue | Code change | Evidence | Status now (pending runtime) |
|---|---|---|---|
| **EDT-001 (P0)** rename strips rich text | `CollectionManager.ts` `updateField`: rewrites `pageSlugPattern`/`displayField`, `await updateCollection(...)` **first**, then moves records. Each record's mirror waits on the in-flight collection op (`syncEntryUpsert → queue.settled`). `CollectionManager.rename.test.ts` was rewritten to assert `["collection", "entry:…"]`. **The test that pinned the bug is retired.** | CODE_EVIDENCE + VERIFIED_TEST (order test passes) | **Likely fixed for the online path (stop-gap).** Still missing: the server-side atomic `cms.fields.rename` (C0.2), the D-05 key lock, and SEO-pattern rewriting (EDT-028, `pageSeo*` not in `keyed`). The offline/outbox replay order is not re-checked. Needs a live re-run of D-01 (rename a rich-text key, then read back `<strong>`). |
| **EDT-006** binding-only change not saved | `BaseBindingManager.bind`: after `applyBinding`, `markDirty()` (untracked) on every bind | CODE_EVIDENCE | **Likely fixed.** Needs a live re-run of D-03 (re-pin to a draft → autosave → reload). |
| **EDT-011** canvas stale after unpublish/delete; marker lost | `useCMSPreview`: `data-cms-bound` is always set; an unresolved value is written as nothing (matches export); it subscribes to `CMS_CONTENT_PUBLISHED/UNPUBLISHED`, `BINDING_CREATED/REMOVED`. `CMSBindingManager` re-applies on publish/unpublish. | CODE_EVIDENCE + VERIFIED_TEST (`useCanvasContent.cms`, `CMSBindingManager.lifecycle` pass) | **Partly fixed:** the canvas now **mirrors publish** (empty) and keeps the marker. The spec/board D2 calls for a dimmed **"Empty · Title" placeholder plus a fallback field**, which isn't built (`writeBoundValue` writes empty). |
| **EDT-018** save not auto-retried; recovery prompt outlives a successful save | `useSaveCallback`, `useComposerInit`, `unsavedRecovery`, `RecoveryBanner` (L5-070/074/075) | CODE_EVIDENCE + VERIFIED_TEST (`useSaveCallback`, `loadFlow`, `RecoveryBanner`, `unsavedRecovery.offScreen` pass) | **Likely fixed.** Needs a live re-run of D-13 (offline edits → online → save fires without Retry; no stale "Restore my edits"). |
| EDT-005 duplicate site drops CMS | The `sites.service.ts` hunks are in `checkedTokensOrConflict`/`saveProjectData` (L3-001 page-slug CONFLICT); `duplicateSite` is untouched | CODE_EVIDENCE | **Still open** |
| EDT-002, 003, 004, 007, 008, 009, 010, 012–017, 019–054 | No change on their code paths | CODE_EVIDENCE (diff) | **Still open**, with the audit evidence unchanged |

### Per-criterion impact (AT)
No acceptance test flips to PASS. Each one also requires behaviour that is still missing, and none was re-run live:

| AT | Change | Still failing on |
|---|---|---|
| **AT-03** | The rich-text loss is likely gone (EDT-001 stop-gap) | The spec's acceptance needs one server rename call (C0.2) and the SEO pattern updated. Live read-back not done. |
| **AT-16** | The pin-only change is now saved (EDT-006) | The 50-record window (EDT-003) is unchanged |
| **AT-17** | The canvas mirrors publish and keeps the marker | The "Empty · Title" placeholder isn't built; not re-verified live |
| **AT-20** | Save auto-retry and recovery are fixed (EDT-018) | The orphaned outbox op never clears and the gate disagrees (EDT-012, unchanged) |

### Verdict after #3
| Dimension | Result |
|---|---|
| DESIGN READY | **31 / 33** (unchanged; 2 need no UI) |
| FUNCTIONALLY COMPLETE | **0 / 33** |
| Issue movement | **4 issues likely fixed or partly fixed in code:** EDT-001 (P0, stop-gap), EDT-006 (P1), EDT-011 (P2, partial), EDT-018 (P2). None is runtime-verified. EDT-002 (the other P0) is still open. |

### Recommended next step
- The code moved under the audit, so the skill rule applies: **run `audit cms`**, or a targeted live re-walk of D-01, D-03, D-10 and D-13. That promotes or closes EDT-001/006/011/018 with VERIFIED_RUNTIME evidence and refreshes `02-issues.md`.
- Until then, these four are "likely fixed", not fixed.
