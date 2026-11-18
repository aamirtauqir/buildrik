# CMS: Figma design report (Proposal v1)

## Run metadata
- **Date:** 2026-10-09 (PKT). Figma calls ran 2026-10-08 21:19–21:43 UTC.
- **Mode / arguments:** `design` · `cms`
- **Git ref:** HEAD is `24640e769`; the source audit commit is `7a50e34e1`. The drift check (`git diff --stat 7a50e34e1 HEAD`) shows no change in any CMS, engine, sync or server-CMS path, so the spec's evidence is current.
- **Run flags:** none. Figma was reachable and writable. There was no new runtime walk, because this mode designs and does not test code.
- **Figma file:** `g4GzQFqzNYz5sosz1QtZXC`, page `4418:45431` (Editor v3 · IA).
- **Figma calls:** 11 `use_figma` calls, 1 of them refused because the return value was over 20 KB. The audit's 10 `get_screenshot` calls bring today's total to about 21 of the 200/day budget. Call log: `calls.log`, kept in the session scratchpad and not copied into the repo.
- **Tooling:** `scripts/baseline/figma-mcp.mjs` (with the plugin bundle header, so `use_figma` is available), plus the `figma:figma-use` skill loaded before every write.

- **Revision 2 (2026-10-09):** a second `design cms` run fixed the 5 board defects found by `verify cms` and drew 15 missing states. See the **Revision 2** section at the end. Where Revision 2 conflicts with an earlier section, Revision 2 is current.

## Preflight (`references/figma-protocol.md`)
| Gate | Result | Evidence |
|---|---|---|
| 1. Approved spec | PASS | `specs/cms.md`: 13 of 13 sign-off rows approved by the founder on 2026-10-09, and `decision-log.md` has no open rows. D-01 approves a non-destructive proposal section before the code work. |
| 2. Connection and write permission | PASS | `tools/list` returned `use_figma`. The file opened; the read-only inspection `s01` listed its 4 pages and 64 sections on the target page. Writes succeeded (section `8243:232531` was created). |
| 3. Read current Figma tool/skill instructions | PASS | `figma:figma-use` (plugin 2.2.127) was loaded. Its rules were followed: return IDs, 0–1 colours, fonts loaded first, one page switch per call, and fixes driven by screenshots. |
| 4. Inspect the design system first | PASS | `s01` found the variable collections `Primitives` (156 vars) and `Package` (77 vars, Editor/Dashboard modes), the text styles `ui/*` (Inter) and `data/*` (Geist Mono), the effect styles `elevation/*`, and 183 components. `s02` mapped board `4428:143182`: Topbar / Rail instances, the 280 drawer, the 1100 Canvas and 40px row instances. |

## Where it is
- **Section:** `Editor Improvements / CMS / Proposal v1`, node **`8243:232531`**, at x=12000, y=204000 on page `4418:45431`, to the right of `v3 · Phase 6 · CMS` (`4428:140485`). The section is 9400 × 5820.
- **Link:** https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/?node-id=8243-232531
- **Originals:** untouched. Every board is a **clone** of `4428:143182`'s shell (Topbar, Rail and Drawer instances), with new native content built in the cloned Canvas. No original node or shared token was modified.
- **Index:** a README frame **`8251:238275`** inside the section lists the rows, the spec and decision references, and the conventions used.

## Created boards (30 + README)
Each board has a caption frame above it naming the original node it replaces or updates, the EDT issues and the acceptance tests.

| # | Board | Node | Replaces / updates | Spec / issues / AT |
|---|---|---|---|---|
| A1 | Root · management table | `8243:232532` | blank root `4428:140486` | EDT-044 · D-02, D-09 · AT-25/33 |
| A2 | Records · table: status column and filter, View picker, 32px rows, hover ⋯ | `8243:232939` | `4428:143182` | EDT-026/031 · AT-12/14/22 |
| A3 | Records · 3 selected, bulk bar + Undo toast | `8243:233452` | new | EDT-026 · AT-12 |
| A4 | Record panel · docked 480 · saved · ⋯ menu open | `8243:233966` | `4428:144760` | EDT-032 · PD-10 · AT-06/07 |
| A5 | Record panel · conflict · per-field diff + merge | `8243:234482` | `8139:217560` | EDT-002/014 · D-06 · AT-08 |
| A6 | Record panel · read-only (Google Sheets) | `8243:235002` | new | D-02 · AT-25 |
| B1 | Fields + field inspector: key locked, Required impact, Used by links | `8248:233437` | `4428:147552` | EDT-023/028/030 · D-05 · AT-04/05/24 |
| B2 | Fields · type-change confirm + conversion preview | `8248:233926` | new | EDT-023 · AT-04 |
| B3 | Pages tab: template by pageId, URL/SEO patterns, routes with reserved/colliding flags, Save | `8248:234422` | `4428:147857` | EDT-004/047 · D-12 · AT-09/14 |
| B4 | Settings: title field, Constants, danger zone (delete then unbind) | `8248:234837` | `4428:148660` | EDT-029 · AT-15/30 |
| B5 | Source · Google Sheets · synced, mapping, schedule, history | `8248:235219` | new (`4418:48010` old Sheets board) | D-02 · AT-25 |
| B6 | Source · Custom API · last sync failed / partial, SSRF note, masked secret | `8248:235650` | new | D-02 · AT-26/27 |
| C1 | Views: list, rule builder AND/OR, sort/limit, live count | `8249:234343` | new (replaces old Conditions `4418:89490`) | D-02 · AT-29 |
| C2 | New collection · step 1 source picker + name | `8249:234771` | `4418:84646` | EDT-043 · AT-01/25 |
| C3 | Import CSV · preview with type coercion, skipped rows | `8249:235137` | new | EDT-009/052 · AT-13 |
| C4 | Delete record with dependants · typed confirm | `8249:235700` | `6881:70349` (extends it) | EDT-008/027 · AT-11 |
| C5 | Plan limit reached (Free · 100 records) | `8249:236229` | new | D-09 · AT-33 |
| C6 | Loading skeleton + Topbar offline pill + pending popover | `8249:236741` | `4418:88666` (loading) | EDT-012/018/044 · AT-20 |
| D1 | Inspector · binding · searchable Record combobox, field names | `8250:235249` | `7995:205467` | EDT-003/006/045/046 · AT-16 |
| D2 | Inspector · Draft record → "Empty · Name" placeholder + fallback | `8250:235648` | `7995:205787` | EDT-011 · AT-17 |
| D3 | Collection list · View, sort, empty message, Show drafts toggle | `8250:236011` | `7995:204147` | EDT-015 · D-04 · AT-18/29 |
| D4 | Visibility · "Show when" field rule | `8250:236412` | new | D-02 · AT-31 |
| D5 | Template page · record switcher · "This page's record" | `8250:236796` | new | D-12 · AT-14 |
| D6 | Product grid wired to Products + "created" toast | `8250:237174` | new | EDT-042 · D-11 · AT-32 |
| D7 | Site data · JSON sources persisted, Convert to collection | `8250:237556` | `4418:87780` (old Sources) | EDT-016 · D-03 · AT-28 |
| E1 | Record panel · field validation + save error Retry | `8251:236084` | new | EDT-019/024/025 · AT-07/09 |
| E2 | Record panel · deleted elsewhere · deleted reference · missing media | `8251:236574` | new | spec §States · AT-11 |
| E3 | Pages drawer · template row + routes + guarded delete | `8251:237058` | new | D-12 · AT-14 |
| E4 | Publish · pre-publish checks with CMS rows, toast below dialog | `8251:237408` | new | EDT-004/010/012/017/047 · AT-21 |
| E5 | Records · View only (VIEWER) | `8251:237789` | new | spec §States |

**Construction:**
- **Native and editable:** every board uses native auto-layout frames, text with the file's text styles, fills and strokes bound to `Primitives`/`Package` variables, and `elevation/*` effect styles.
- **No flattened images:** no screenshots are embedded.
- **Unresolved tokens:** 0, per the `missing: []` the script returned on every build.

## Visual verification
| Level | Boards | How |
|---|---|---|
| Inspected individually (screenshot read after the final fix) | A2, A5, B1, B5, C1, C3, D1, D3, E3, E4 (10 of 30) | `node.screenshot()` at 0.6×. Copies are in `evidence/design-cms-2026-10-09/`. |
| Inspected only in the section overview (thumbnail) | the other 20 | `section-overview.png` at 0.06× shows layout only, not text legibility |

**Defects found and fixed during the run:**
1. **Grey canvas.** Bound paints kept the grey 0.5 placeholder colour, which made the workspace render grey. The fix rebinds with the resolved value (6 nodes repaired). Before: `BEFORE-FIX-A2-grey-canvas.png`.
2. **Clipped diff column** on A5 (20 cells resized).
3. **Tall empty spacer frames and unwrapped hint text** (51 nodes repaired).
4. **Clipped Inspector captions and "› CMS" breadcrumbs** on the page boards (13 nodes fixed).

## State coverage vs spec
- **Covered:**
  - idle/root, loading, empty (Views empty is implied, not drawn), selected, hover, focus (focused inputs)
  - success (Saved), validation, save error, conflict, offline/pending
  - read-only (external source and VIEWER), deleted elsewhere, deleted reference, missing media
  - empty binding / Draft, plan limit, import preview/partial, source synced/partial/failed
  - publish pre-checks
- **Not drawn:**
  - no-results (the existing board `6819:59478` still applies)
  - Views "needs fixing"
  - the source connecting/syncing progress state
  - the disconnected / needs-reconnect source
  - import progress and the Undo-import toast
  - Export menu
  - Required-on impact as a separate board (it is shown inline on B1)
  - keyboard focus rings on the table grid
  - the Pages tab "template missing" and "pages off" variants

## Deviations from the spec
1. **Rail highlight:** on page-editing boards (D1–D6) and the Pages board (E3), the cloned Rail instance still highlights **CMS**, and the drawer is collapsed or replaced. The rail instance wasn't re-variant'ed, to keep instance overrides minimal.
2. **Drawer collection list:** in workspace boards it shows only "Menu items 24" (the original drawer). It does not list Team / Events / Products, which A1 and B5/B6 imply.
3. **Topbar breadcrumb:** it still reads "Bella Cucina › CMS" on CMS boards, which is correct. The page boards were fixed.
4. **Table focus states (AT-22):** the grid and roving-focus visuals aren't drawn, and no axe checks were run (that belongs to the code stage).
5. **The A4 ⋯ menu** shows an extra "Copy link" item that is not in the spec's ⋯ list (Duplicate, View on page, Delete). Keep it or drop it in review.

## Unresolved gaps / next steps
- **Prototype wiring:** no prototype links were created. The boards are not connected, and claims are kept separate per `figma-protocol.md`.
  - **Figma designed:** yes; editable and inspected as described above.
  - **Prototype connected:** no.
  - **Function implemented:** no. Code is a separate request.
  - **End-to-end working:** no.
- The states listed under "Not drawn" above.
- `scripts/conformance/boards.json` has not been updated with these nodes. That file is in the repo, and this skill only writes to `reports/editor-audit/`. The proposal's F3 step does it when the boards are accepted.
- Retiring the superseded original boards (`4418:89490` Conditions, `4418:87780` Sources, and others) needs founder approval. They are deliberately left untouched.

## Candidate issues found while designing
These have no `EDT-` IDs; the next audit promotes them.
- **40px rows on boards:** the original board rows are instances of a 40px "Record row" component (`7423:130192` and siblings), against DESIGN.md's "Never 40px". The live app was not measured for this.
- **The original board's Inspector frame** (`4428:143291`, 300 wide) sits under the 1100-wide Canvas in an auto-layout band. It appears to be hidden or overlapping, which needs a look on the original board.

## Files written
- This report: `reports/editor-audit/design/cms.md`
- Evidence: `reports/editor-audit/evidence/design-cms-2026-10-09/`, 12 PNGs (10 boards, the section overview, and the before-fix A2)
- Figma: section `8243:232531` with 30 boards, 30 captions and the README `8251:238275`
- No product source, Prisma or tracked file changed. Before and after `git status` both show 0 tracked changes.

---

## Revision 2: defect fixes and missing states (2026-10-09)

### Run metadata
- **Date:** 2026-10-09 (PKT). Figma calls ran 2026-10-08 22:0x–22:3x UTC.
- **Mode / arguments:** `design` · `cms` · free text "fix the 5 board defects + draw missing states"
- **Git ref:** HEAD `e1be3ff7e`. The drift check against audit commit `7a50e34e1` over the CMS paths is empty; the commits since then touch brand only.
- **Run flags:** none.
- **Preflight:** all 4 gates passed again.
  - The spec is still approved (13/13).
  - The connection is unchanged, and `use_figma` succeeded.
  - `figma-use` rules applied.
  - Rail, drawer and row components were inspected before editing (`g1`).
- **Figma calls this run:** 7 `use_figma` calls (`g1`, `g2`, `f1`, `f2`, `f3`, `f4`, `f5`). The running total for the day is about 33 of 200.
- **Scope:** only nodes inside `Editor Improvements / CMS / Proposal v1` (`8243:232531`) were edited. The original section `4428:140485` still has 61 children (checked in verify). No original board was touched.

### Defects fixed (from `verify/cms.md`)
| # | Board | Fix | Evidence after the fix |
|---|---|---|---|
| 1 | A6 read-only external record | **Rebuilt** with Team data: 8 team rows with roles; read-only fields Staff ID (key), Name, Role, Email, Bio, Photo. The old node `8243:235002` and its caption were removed. **New node: `8259:237243`.** | `evidence/design-cms-2026-10-09-rev2/A6-rebuilt-team.png` |
| 2 | C5 plan limit | The tooltip moved to the left of "+ Add record". Measured: the tooltip's bottom is at 134px and the Upgrade button's top is at 162px, so they no longer overlap. The pager now reads "1–8 of 100". | `C5-tooltip-moved.png` |
| 3 | E2 deleted / missing states | The missing-image row wraps, so "Replace image for Photo" sits on its own line inside the dock. | `E2-wrap-fixed.png` |
| 4 | B4 Settings, D7 Site data | The workspace content is left-aligned (canvas `counterAxisAlignItems = MIN`). | `B4-left-aligned.png` |
| 5 | Rail and drawer on cloned boards | Rail `Active` variant: `None` on page-editing boards D1–D6, `Pages` on E3. On 23 workspace boards the drawer lists **Menu items 24 · Team 8 · Events 31 · Products 12**. Only the active collection is selected: Team on A6, B5 and the F8/F9 source boards; Events on B6. Non-active rows had their overrides reset and their `Label`/`Count value`/`Selected` component properties set. | `A2-drawer-4-collections.png`, `D1-rail-none.png` |

### Missing states drawn (15 boards, rows 5–7)
| # | Board | Node | Covers |
|---|---|---|---|
| F1 | Records · no results + header ⋯ (Import CSV/JSON, Export CSV/JSON) | `8260:237492` | AT-13 (Export menu), EDT-031/048 |
| F2 | Discard guard on drawer ✕ ("Keep editing" focus-visible) | `8260:237906` | AT-10, EDT-007 |
| F3 | Records · keyboard grid, focus-visible row, keyboard legend | `8260:238456` | AT-22, EDT-024/025 |
| F4 | Add field dialog: 10 types, multi-select options required, server refusal inside the dialog | `8260:239020` | AT-02, EDT-029/043 |
| F5 | Delete unused field · typed confirm · values purged | `8260:239442` | AT-05, EDT-023 |
| F6 | Views · needs fixing (deleted field; the list falls back to All) | `8260:239828` | AT-29 |
| F7 | Views · empty | `8261:238578` | AT-29 |
| F8 | Source · syncing (progress, counts so far) | `8261:238955` | AT-25/27 |
| F9 | Source · disconnected · needs reconnect (Admin-only) | `8261:239334` | AT-25 |
| F10 | Switch source Buildrik → Google Sheets · typed SWITCH confirm | `8261:239716` | AT-26 |
| F11 | Import in progress (close guarded) | `8261:240102` | AT-13, EDT-052 |
| F12 | Import done · "Undo import" toast | `8261:240652` | AT-13, EDT-009 |
| F13 | Pages tab · record pages off | `8261:241197` | AT-14, EDT-047 |
| F14 | Pages tab · template page missing | `8261:241574` | AT-14 |
| F15 | Settings · collection delete failed, nothing unbound | `8261:241967` | AT-15, EDT-029 |

- **README** `8251:238275` now lists rows 5–7 and the Revision 2 fixes, and its "Not done" line is updated.
- **Section size** is 9400 × 9300 and holds 91 children: 45 boards, 45 captions and the README.

### Visual verification (Revision 2)
- **Inspected individually** after the final fix (0.5× screenshots): all 15 F boards, plus the fixed A6, C5, E2, B4, A2 drawer and D1 rail. 21 PNGs are in `evidence/design-cms-2026-10-09-rev2/`. FIGMA_EVIDENCE
- **Found and fixed during the run:**
  - All 4 drawer rows looked selected, because the clones copied the selected-state overrides. Fixed by resetting overrides and setting properties.
  - F-board bodies were centred; fixed by left-aligning the canvas on all 15.
  - F15's Retry button overflowed its banner; the banner text was narrowed to 460.
  - The F12 drawer count said 24 against 85 in the header; set to 85.

### Updated state coverage vs spec
- **Now drawn** (were "Not drawn" in revision 1):
  - no-results
  - Views empty and needs-fixing
  - source syncing and disconnected
  - import progress and Undo-import
  - Export menu
  - keyboard focus in the table
  - Pages tab off and template missing
  - Add-field dialog
  - field-delete purge
  - discard guard on drawer ✕
  - switch-source confirm
  - collection delete failure
- **Still not drawn:**
  - Prototype links between boards.
  - The key-rename server confirm, deliberately deferred by D-05.
  - Responsive variants (the editor is desktop-only).
  - A screen-reader rendering. That isn't drawable, and is checked in code via axe.

### Design-readiness after Revision 2 (against `verify/cms.md`)
- **AT design status** was 22 READY / 8 PARTIAL / 1 NOT DRAWN / 2 N/A.
- **Every one of those PARTIAL / NOT DRAWN items now has its board:**
  - AT-02 → F4
  - AT-05 → F5
  - AT-10 → F2
  - AT-13 → F1, F11, F12
  - AT-15 → F15
  - AT-22 → F3
  - AT-25 → A6 rebuilt, F8, F9
  - AT-26 → F10
  - AT-33 → C5 fixed
- **Expected result:** 31 READY + 2 N/A. This is **not re-verified per criterion**; run `verify cms` to confirm it.
- **Functionally complete is unchanged: 0 of 33.** No code has changed.

### Candidate issues (no EDT IDs)
- **Original `List row` component:** its selected styling on the original boards appears to come from instance overrides, not the `Selected` boolean property. After resetting overrides and setting `Selected=true`, the active row looked right on the source boards, but the component should own its selected style. This is a design-system hygiene item for the original library.
- **F1 header ⋯ menu:** it has no "Sync now", which is correct for a Buildrik-source collection. External-source collections should show it; the board for that variant is not drawn.

### Files written (Revision 2)
- This section of `reports/editor-audit/design/cms.md`, plus the revision note in the run metadata.
- `reports/editor-audit/evidence/design-cms-2026-10-09-rev2/` (22 PNGs).
- **Figma:** 15 new boards and captions; A6 rebuilt (`8259:237243`); edits to 30 existing proposal boards (drawer, rail, alignment, C5, E2) and the README.
- **No product source or tracked file changed:** `git status` shows 0 tracked changes before and after.
