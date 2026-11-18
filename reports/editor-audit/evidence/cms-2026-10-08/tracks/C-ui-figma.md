# Track C: CMS UI/UX/IA/a11y + Figma (2026-10-08)

- **Commit:** main @ `7a50e34e1`. `git diff --stat 7a50e34e1 HEAD` over every audited path is empty (HEAD is still `7a50e34e1` at the end of the audit).
- **Mode:** read-only. No repo or Figma writes.
- **Files read, in full:**
  - `src/editor/cms/` (all 17 components named in the brief), plus `fieldTypes.ts`, `fieldUsage.ts`, `paneStyles.ts` and `useImportRecords.tsx`.
  - `inspector/sections/CmsBindingSection.tsx`, `shell/modals/CMSCollectionSetupModal.tsx`.
- **Files read in part:**
  - Shell and entry points: `shell/StudioPanels.tsx` (CMS wiring), `sidebar/tabs/content/ContentTab.tsx` and `useContentPanel.ts` (save, load, delete), `sidebar/tabs/pages/PagesTab.tsx`, `shell/modals/CommandPalette.tsx`, `rail/tabsConfig.ts`.
  - Engine and styling: `engine/cms/CollectionManager.ts` (`updateField`), `chrome-ui/Chip.tsx`, `themes/design-system/a11y.css`, `tokens.generated.css`.
  - Rules and plans: `DESIGN.md`, `src/editor/AGENTS.md`, `docs/plans/2026-09-28-cms-architecture-proposal.md` (§8, §10a, C2, F1/F2).
  - Prior audits: `04-cms.md`, L3/FG/DQ.
- **Figma:** 10 MCP calls, all `get_screenshot`, serial, all `isError=false`. The client used the newest valid keychain token, with no 401.

  | # | Node | Board |
  |---|---|---|
  | 1 | `4428:143182` | records table |
  | 2 | `4428:144760` | record workspace |
  | 3 | `4428:147552` | Fields |
  | 4 | `4428:147857` | Dynamic pages |
  | 5 | `4428:148660` | Settings |
  | 6 | `7063:79200` | Inspector · From CMS |
  | 7 | `7995:205467` | Inspector v4 CMS-bound heading |
  | 8 | `8139:217560` | record conflict |
  | 9 | `4418:84646` | New collection modal |
  | 10 | `6881:70349` | Delete record (typed) |

  Screenshots are in `cms-audit/figma/*.png` and the call log in `cms-audit/figma/calls.log`.
- **Other board text** came from the local 2026-09-21 dump (`docs/audit-2026-09-21/dump/live-all.json`) and is marked "dump". It was **not** re-read in Figma this session, so it never counts as FIGMA_EVIDENCE.
- **Counts:** P0 0 · P1 2 · P2 11 · P3 14. There are 27 findings and 1 VERIFIED_OK block.

---

### C-01 The record editor is a full overlay over the table, not the approved right-docked 480px panel (PD-10)
- **Classification:** IA · **P1** · FIGMA_EVIDENCE · **BOTH_GAP**. The code follows the board, and both diverge from the founder decision PD-10.
- **Journey:** scan records → edit one → compare it with its neighbours, or go to the next one.
- **Repro:** CMS → a collection → click a row.
- **Actual:**
  - `RecordSheet` covers the whole workspace (`tw:absolute tw:inset-0`), which hides the table and the workspace header.
  - It re-draws its own Records · Fields · Dynamic pages tab row. That row has no Settings tab, and its "Records" tab closes the sheet.
  - The record ⋯ menu holds only "Preview saved record" and "Delete record…".
  - The next record cannot be reached without closing the sheet.
- **Expected:** PD-10 and proposal §8, §10a and C2 call for:
  - a right-docked 480px record panel *over the table, not covering it*;
  - no duplicate tab row;
  - ⋯ = Duplicate, View on page, Delete;
  - a Saved state.
- **Source:**
  - `RecordSheet.tsx:505-516` (overlay), `:573-593` (duplicate tablist), `:538-551` (menu).
  - `CmsWorkspace.tsx:448-491`.
- **Figma:** `4428:144760` and `8139:217560` both draw "wide · over the table" with the duplicate tab row. Proposal F1 already lists `4428:144760` as needing this change; it hasn't been made.
- **Root cause:** C2 (IA restructure) has not started. The 2026-09-28 memory says "Not started: … C2 (PD-10 480px right dock)".
- **Impacted:** RecordSheet, CmsWorkspace, RecordPreview (its 420px column sits inside the overlay).
- **Recommendation:**
  - Build the dock as `aside` 480px in the HintColumn slot. The table stays live, and selecting a row swaps the record (the leave guard already exists).
  - Drop the inner tab row and add Duplicate and View on page.
  - Alternative: keep the overlay but add ‹ / › record stepping and drop the tab row.
- **Acceptance:**
  - At 1440×900 the table stays visible beside a 480px panel.
  - Clicking another row swaps the record, with the discard question when dirty.
  - There is no second tab row.
  - ⋯ shows Duplicate, View on page and Delete.
- **Prior ID:** CMS-11 (STILL OPEN), proposal F1.

### C-02 "Undo" after deleting a record makes a new record with a new id
- **Classification:** Functional / data integrity · **P1** · CODE_EVIDENCE · CODE_GAP.
- **Journey:** delete a record by mistake → Undo on the toast.
- **Repro:**
  1. Pin an element binding to record X, and make another collection reference X.
  2. Record ⋯ → Delete record… → Undo.
- **Actual:**
  - `onRestore` calls `panel.saveRecord(collection.id, null, r.data, …)`. With a `null` id, `saveRecord` reserves `cms.nextId()` and creates a *new* record.
  - Every pointer to the old id (pinned `itemId` bindings, other collections' Reference fields, ⌘K, open deep links) now resolves to "Deleted record" or to nothing.
  - The original `createdAt` is lost.
- **Expected:** the toast says "Undo restores it", so the same id should come back (un-tombstoned).
- **Source:** `CmsWorkspace.tsx:486-488`, `useContentPanel.ts:221-249` (`const id = recordId ?? cms.nextId()`), `RecordSheet.tsx:343-351`, `ReferenceField.tsx:62-71`, `CmsBindingSection.tsx:161,175-180`.
- **Figma:** dump `6881:70387` draws only the toast "Record deleted · Undo".
- **Root cause:** Undo is built as "create a copy". Server soft-delete tombstones (memory: cms-tombstone-pattern) rewrite the slug, and the client never restores the old row.
- **Impacted:** CMS bindings, Reference fields, dynamic pages (the URL is the same, but it is a different record).
- **Recommendation:**
  - Restore through `createContentItem(collectionId, data, { status, id: r.id })`, plus a server un-tombstone path.
  - Alternative: if a re-used id can't be guaranteed, drop Undo and use the typed confirm for every delete that has dependants (see C-04).
- **Acceptance:**
  - Delete → Undo → the record id equals the original.
  - Pinned bindings and Reference cells show the record again with no "Deleted record".
- **Prior ID:** none. This is new; L3 saw Undo but did not test the id.

### C-03 The Records table cannot manage a real collection: no status column or filter, no bulk select or actions, no row actions, no column choice
- **Classification:** Missing State / UX · **P2** · FIGMA_EVIDENCE · **BOTH_GAP**. The board `4428:143182` has none of these either; proposal C2 and F1 require them.
- **Journey:** publish or unpublish many records; delete stale ones; find drafts.
- **Actual:**
  - Columns are display field + up to 3 short fields + Updated (`RecordsTable.tsx:35-37,101-108`).
  - Status is a faint "· Draft" suffix only (`:185-189`). There is no Published, Scheduled or "needs publish" state.
  - There are no checkboxes, bulk bar, hover or row ⋯, status filter, or Columns menu.
  - Sort resets on every collection switch (`key={collection.id}`, `CmsWorkspace.tsx:301`).
  - Pagination is 50 per page.
- **Expected:** C2's table spec: checkbox column + bulk bar (Publish / Unpublish / Delete + Undo), status column, Status filter, Columns menu, sort persisted per collection, skeleton loading.
- **Figma:** `4428:143182` shows NAME · PRICE · CATEGORY · AVAILABLE · UPDATED with 8 of "24 records", no status column, no checkbox and no pager.
- **Root cause:** C2 has not started, and the board predates the proposal.
- **Recommendation:**
  - Ship a status column and a status filter first; they are cheap and fix the "faint suffix" complaint.
  - Then add bulk selection with a bulk bar, and update the board in the same pass (proposal F2 #2).
- **Acceptance:**
  - A Status column with a Published / Draft pill.
  - A filter "Drafts" shows only drafts.
  - Selecting 3 rows shows a bulk bar whose Publish changes all 3 and offers Undo.
- **Prior ID:** L3-020 part 2 (STILL OPEN), CMS UI-03 / UI-11 in the proposal.

### C-04 Record delete guard: matches decisions #17 / #29 and the boards; L3-020 part 1 is a misread
- **Classification:** UX · **P3** · FIGMA_EVIDENCE · VERIFIED_OK, with a copy nit.
- **How the code decides:** `RecordSheet.tsx:335-352`.
  - A published record whose collection has a URL pattern gets the typed DELETE confirm.
  - Any other record is deleted at once, with a toast and Undo.
- **What the board shows:** `6881:70349` draws the typed confirm for *Margherita*, which is published and owns `/menu/margherita`. The same consequence line ("…and its generated page /menu/margherita") is in code at `:760`. The non-page path's toast board is dump `6881:70387`.
- **Conclusion:** L3-020's "Figma requires typed DELETE" holds only for page-owning records.
- **Remaining nit:** "Delete record…" (`:549`, and `RecordPreview.tsx:89`) keeps the "…" on the instant path. The ellipsis promises a dialog that doesn't come.
- **Recommendation:** label it "Delete record" when `!ownsPage`.
- **Acceptance:** the menu label's ellipsis matches whether a dialog follows.
- **Prior ID:** L3-020 part 1 → RECLASSIFIED (matches design). The real risk is C-02 and C-05.

### C-05 Deleting a record has no warning when it is referenced or pinned by bindings
- **Classification:** UX / destructive · **P2** · CODE_EVIDENCE · CODE_GAP.
- **Actual:**
  - The instant-delete path checks only `ownsPage` (`RecordSheet.tsx:335`).
  - Records referenced by other collections, or pinned by element bindings (`itemId`), go with no notice.
  - Afterwards, Reference cells read "Deleted record" (`RecordsTable.tsx:93-97`) and bound elements show stale text (L3-016).
- **Expected:**
  - Count dependants the way `CollectionSettingsPane.tsx:55-73` does for collections.
  - Route to the typed confirm when dependants exist, naming them.
- **Acceptance:** deleting a record referenced by 2 records and pinned by 1 element shows "Used by 2 records and 1 element" before deleting.
- **Prior ID:** extends CMS-06 (collection guard FIXED) to records.

### C-06 Conflict choice is blind, and the risky choice is styled primary
- **Classification:** UX · **P2** · FIGMA_EVIDENCE · **BOTH_GAP**.
- **Actual:**
  - "Someone else changed this record. Choose Keep mine or Use theirs." comes with no view of the other version.
  - "Use theirs" is the filled primary button, even though it throws away the user's unsaved edits.
  - "Keep mine" is ghost (`RecordSheet.tsx:612-638`).
- **Figma:** `8139:217560` is identical: yellow band, ghost Keep mine, primary Use theirs, no diff.
- **Expected:**
  - Show which fields differ, with their value.
  - Neither choice is primary, or Keep mine is primary because it preserves the user's work.
  - Use theirs says that it discards your edits.
- **Acceptance:** a forced conflict lists the changed fields and both values before the choice.
- **Prior ID:** L3-021 (STILL OPEN; Figma now checked: the board has the same gap).

### C-07 Record sheet keyboard and focus: Escape and focus don't follow the sheet
- **Classification:** Accessibility · **P2** · CODE_EVIDENCE (the behaviour is INFERRED, not run).
- **Actual:**
  - The sheet is `role="dialog"` with no `aria-modal` (`RecordSheet.tsx:505-516`).
  - Nothing moves focus into it on open; there is no `autoFocus` or `.focus()` in `cms/*` except the discard modal.
  - A mouse- or Enter-opened sheet leaves focus on the table row behind it (`RecordsTable.tsx:169-182`, `tabIndex={0}`). Its Escape handler sits in the sheet's `onKeyDown`, which only fires when focus is already inside.
  - Closing does not return focus to the row that opened it.
  - Because `hasOpenEscapeSurface()` counts `role=dialog`, the engine's own Escape does nothing either, so Escape is likely dead until the user tabs into the sheet.
  - The workspace has no Escape back to the canvas, and FieldInspector has no Escape.
- **Expected:**
  - Opening moves focus to the first field or the title.
  - Escape closes from anywhere while the sheet is open, through `useColumnPanelEscape`, which is the AGENTS.md contract.
  - Close restores focus to the originating row.
- **Acceptance:**
  - Keyboard path: Tab to a row → Enter → type → Esc → the discard question → Keep editing.
  - After closing, focus is back on the row.
- **Prior ID:** none (04-cms §8 listed "keyboard/screen reader" as not verified).

### C-08 Changing a field's type (unbound) has no confirm, no impact and no conversion; rule edits are unchecked
- **Classification:** Functional / UX · **P2** · CODE_EVIDENCE · CODE_GAP.
- **Actual:**
  - The Type select writes immediately (`FieldInspector.tsx:148-160`).
  - `CollectionManager.updateField` (`engine/cms/CollectionManager.ts:223-266`) migrates only key renames. A Text field turned Number keeps string values, which then fail `cmsValueError` or publish validation on every record.
  - Required → Yes shows no "N records are missing this" count (`:206-212`).
  - Min > Max is accepted (`RuleInput :50-73`).
- **Expected:** C2: "type-change confirm + conversion, Required impact count".
- **Acceptance:**
  - Changing the type on a field with data opens a confirm with the record count and a conversion preview.
  - Turning Required on shows the missing count.
- **Prior ID:** CMS-20 (STILL OPEN).

### C-09 Renaming a field key silently breaks the SEO patterns, and deleting a field used only there isn't locked
- **Classification:** Functional · **P2** · CODE_EVIDENCE · CODE_GAP.
- **Actual:**
  - A key rename rewrites `pageSlugPattern` and `displayField` only (`CollectionManager.ts:250-252`), not `pageSeoTitle` / `pageSeoDescription`.
  - `fieldUsage` scans only `pageSlugPattern` (`fieldUsage.ts:66-68`), so a field used only in SEO patterns shows "Nothing is bound" and can be deleted.
  - The Dynamic pages pane then refuses to save, because the patterns name an unknown field (`DynamicPagesPane.tsx:69-70,228`), and the published pages carry a literal `{key}` or an empty title.
- **Recommendation:** include the SEO patterns in both the rename rewrite and `fieldUsage`.
- **Acceptance:** after renaming `name`→`title`, the SEO title pattern reads `{title}`, and the field shows "Used by · Dynamic pages (SEO)".
- **Prior ID:** none. Related: L3-015 (a rename strips rich text; engine order), which is still open and not re-tested.

### C-10 "Used by" doesn't say where, and "Open the binding" lands in Layers
- **Classification:** IA / UX · **P2** · FIGMA_EVIDENCE · CODE_GAP. The board is right; the code is behind.
- **Actual:**
  - USED BY labels a use by the element's layer name or type ("Heading"), with no page (`fieldUsage.ts:25-30`). An element not on the current page falls back to its raw element id (`:27`).
  - Rows are plain text (`FieldsTable.tsx:80-82`, `FieldInspector.tsx:232-237`).
  - "Open the binding" selects only the first use and switches to Layers (`CmsWorkspace.tsx:242-247`, `DeleteFieldDialog.tsx:43,87-90`). It never changes page and never focuses Inspector › CMS binding.
- **Figma:** `4428:147552` labels uses by surface/page ("Menu card · Menu item page", "Dynamic pages").
- **Expected:** each use names its page and element and is a link that opens that page, selects the element and opens the Inspector's CMS binding section.
- **Acceptance:** clicking a use on another page lands on that page with the element selected and the binding section open.
- **Prior ID:** CMS-08 (STILL OPEN).

### C-11 Dynamic pages and Settings sit behind an unlabeled ⋯
- **Classification:** IA · **P2** · FIGMA_EVIDENCE · BOTH_GAP (vs the approved C2).
- **Actual:**
  - The tab row is Records · Fields; Dynamic pages and Settings are items in the ⋯ popover (`CmsWorkspace.tsx:64-67,358-399`).
  - On those tabs, the only "selected" cue is the ⋯ button's pressed state (`:366`). No tab names where you are, so a screen reader hears "Collection menu, pressed".
  - The ⋯ also mixes navigation with actions (Import CSV/JSON, disabled Sheets and Airtable).
- **Figma:** `4428:147857` and `4428:148660` draw the same thing: the ⋯ is the "active" tab, with no label.
- **Expected:** C2: tabs Records · Fields · Pages · Settings; ⋯ holds only Import / Export.
- **Acceptance:** each of the four destinations is a named tab with `aria-selected`; ⋯ has no navigation items.
- **Prior ID:** CMS-12 and L3-023 ("active tab shows only •••"), both STILL OPEN.

### C-12 The workspace closes when the CMS drawer is collapsed, taking an open record with it
- **Classification:** IA / State · **P2** · CODE_EVIDENCE (the loss is INFERRED).
- **Actual:**
  - `cmsWorkspaceOpen = !readOnlyView && isLeftPanelOpen && railTab === "content"` (`StudioPanels.tsx:449`), so closing the drawer's ✕ unmounts the workspace and RecordSheet.
  - `shellDirty` covers tab switches (`RecordSheet.tsx:242-261`). Whether drawer collapse consults it is not verified, so unsaved edits may be dropped.
- **Expected:** C2 "Workspace decoupled from drawer collapse (UI-21)".
- **Acceptance:** with a dirty record, collapsing the drawer either keeps the workspace or asks the discard question.
- **Prior ID:** proposal UI-21 (open).

### C-13 Destructive and settings writes swallow errors, and collection delete isn't atomic
- **Classification:** Functional / State · **P2** · CODE_EVIDENCE · CODE_GAP.
- **Actual:**
  - `CollectionSettingsPane.remove` unbinds every bound element *before* awaiting `deleteCollection`, with no `catch` (`CollectionSettingsPane.tsx:86-97`). A failed delete leaves the collection alive and every binding gone, with no message. `TypedDeleteDialog.confirm` has only `finally` (`TypedDeleteDialog.tsx:35-43`).
  - `rename` (`:75-84`), `DynamicPagesPane.save` (`DynamicPagesPane.tsx:79-101`) and `AddFieldDialog.save` (`AddFieldDialog.tsx:62-82`) also have no `catch`. A refused write shows nothing, and Add field stays open with no reason.
- **Expected:** delete first and unbind on success (or both in one undo transaction), with an error toast or inline error on every write.
- **Acceptance:** with the network off, deleting a collection keeps its bindings and shows "Couldn't delete …"; a refused Add field shows the reason in the dialog.
- **Prior ID:** none.

### C-14 Accessibility of the tables and the record form
- **Classification:** Accessibility · **P2** · CODE_EVIDENCE · CODE_GAP.
- **Tables:**
  - The div tables have no `rowgroup`, and every row is a Tab stop: 50 stops per page before the pager (`RecordsTable.tsx:161-210`, `FieldsTable.tsx:42-90`).
  - `aria-selected` on `role=row` inside `role=table` is unsupported; it is valid only in grid / treegrid (`FieldsTable.tsx:58`).
- **Record sheet's inner tablist** (`RecordSheet.tsx:573-593`): Buttons with `role=tab`, no `aria-controls`, no arrow-key roving.
- **Image field:**
  - The label is a `<span>`, not a `<label>`, and drops the required "*" (`:396`).
  - "Choose image" and "Remove" don't name their field, which is ambiguous with 2+ image fields (`:406-421`).
- **Field errors** have no `aria-invalid` or `aria-describedby` and no `aria-required`; the required marker is a literal " *" in the label (`:376-391`).
- **Recommendation:** make it a `grid` with a single Tab stop and arrow keys (or a native `<table>` with a row link); associate errors; label image controls "Choose image for Photo".
- **Acceptance:** an axe pass with zero violations on the records table and the sheet; Tab from the search reaches the pager in ≤3 stops.
- **Prior ID:** CMS-22 (React key warning FIXED; rail-name collision FIXED via `ariaLabel` in `tabsConfig.ts:237`).

### C-15 No loading state in the workspace; switching collections flashes the previous collection's rows
- **Classification:** Missing State · **P3** · CODE_EVIDENCE (the flash is INFERRED).
- **Actual:**
  - `panel.records` keeps the last collection's rows until `loadRecords` resolves (`useContentPanel.ts:172-178`, `CmsWorkspace.tsx:122-124`).
  - The table, keyed by the new collection, renders the old rows under the new columns. `isEmpty` can flash "No records yet".
  - There is no skeleton. The drawer has one (`ContentTab.tsx:150-200`); the workspace doesn't.
- **Expected:** a skeleton rows state until the first read for that collection (proposal F2 #2 "loading skeleton").
- **Acceptance:** switching from a 0-record collection to a 50-record one never shows "No records yet".
- **Prior ID:** CMS-21 (second half, the "0 collections" flash): drawer FIXED, workspace STILL OPEN.

### C-16 The workspace root is a blank pane
- **Classification:** IA / Missing State · **P3** · CODE_EVIDENCE · DESIGN_GAP + CODE_GAP vs proposal F2 #1.
- **Actual:** with collections present and none selected, there is a header plus an empty grey section and a "Select a collection" hint (`CmsWorkspace.tsx:178-207`). The dump of `4428:140486` draws the same.
- **Expected:** a collections overview (Collection · Records · Pages · Used by · ⋯).
- **Prior ID:** CMS-21 and L3-023 ("workspace centre blank grey"), STILL OPEN.

### C-17 Field inspector offers "Open affected record" while saying nothing is bound
- **Classification:** Copy / UX · **P3** · CODE_EVIDENCE.
- **Actual:**
  - `affected` is simply the first record with a value (`FieldInspector.tsx:103,243-253`).
  - The button appears beside "Nothing is bound to this field."
  - The note "Field keys and types with active bindings must be kept…" shows even when unbound (`:241`).
- **Recommendation:** remove the button, or relabel it "Open a record with a value"; show the note only when `bound`.
- **Prior ID:** L3-023 (STILL OPEN).

### C-18 A new record's footer is green with a warning icon: "Not eligible — not saved yet"
- **Classification:** Visual / Copy · **P3** · CODE_EVIDENCE.
- **Actual:**
  - On a pristine new record, the dot is muted and a TriangleAlert shows.
  - The text colour falls to `success-text` whenever `missing.length === 0` (`RecordSheet.tsx:655-669`).
- **Fix:** muted text, with no warning icon, for the not-saved state.
- **Prior ID:** L3-023 (STILL OPEN).

### C-19 The binding Field picker shows keys, not names, and type labels are defined twice
- **Classification:** Copy / SSOT · **P3** · FIGMA_EVIDENCE · BOTH_GAP.
- **Actual:**
  - Options read `name · Text` (`CmsBindingSection.tsx:82`).
  - The section keeps its own `FIELD_TYPE_LABEL` ("Yes / no", "Options", "Option") (`:63-80`), which diverges from `cms/fieldTypes.ts:19-30` ("Boolean", "Multi-select"). The same type has two names across the CMS and the Inspector, which breaks the editor CLAUDE.md SSOT rule.
- **Figma:** `7995:205467` itself shows "name · Text", so the key-not-name choice comes from the board.
- **Recommendation:** label with `f.name` (key as secondary) and import one label map.
- **Prior ID:** L3-023 (STILL OPEN; the board shares the gap).

### C-20 The binding Record picker is a flat list with no search, and the boards don't draw it
- **Classification:** UX / Design · **P3**.
  - Code: CODE_EVIDENCE.
  - Board: FIGMA_EVIDENCE, DESIGN_GAP.
- **Actual:**
  - "Record" is a plain `SelectRow` over every record (`CmsBindingSection.tsx:253-263`), which is unusable at hundreds of records.
  - Changing the Collection select while bound hides Unbind and the preview, yet keeps the old binding live (`:128-130,296-323`).
- **Figma:** `7995:205467` has Source · Collection · Field · "Cacio e pepe (record 1 of 3)" · Open record · Unbind, but no Record row. `7063:79200` is a CONTENT section on Section with radio Static / From CMS. Both are stale against the CMS-04 fix.
- **Recommendation:** a searchable record combobox; keep the "bound to X" line visible until the new Field is picked. Update the boards.
- **Prior ID:** CMS-04 (FIXED in behaviour; the board is stale).

### C-21 The New collection modal shows a fake wizard and a fake drag handle
- **Classification:** Design / Copy · **P3** · FIGMA_EVIDENCE · BOTH_GAP. The board draws both; proposal F1 says "drop the step chips".
- **Actual:**
  - "✓ Name & Type → 2 Fields" is always drawn as done (`CMSCollectionSetupModal.tsx:282-294`).
  - The title flips to "Fields for X" while typing (`:277`).
  - A ⠿ handle with `cursor-grab` has no drag behind it (`:97,320`).
  - The field placeholder is "field_name", although keys are kebab-case and these are display names (`:324`).
  - Copy says "entry" ("Generate a page per entry") where the rest of the CMS says "record".
  - "Create Collection" is title case.
- **Figma:** `4418:84646`:
  - It shows the chips, the handles and display-name rows (Name, Price, Photo, Description).
  - Its summary says "Template — Menu item template · SEO title — {name}". The code moved template and SEO to Dynamic pages (G3-072), so the board is stale there too.
- **Acceptance:** no step chips; the title is constant; no handle unless drag exists; sentence-case CTA; "record".
- **Prior ID:** L3-023 and CMS-13 (STILL OPEN).

### C-22 Design-system bypasses in CMS chrome
- **Classification:** DS conformance · **P3** · CODE_EVIDENCE.
- **Raw palette and default utilities instead of `--bk-*`:**
  - `tw:border-red-200`, `tw:rounded-lg`, `tw:text-xs` in the setup error banner (`CMSCollectionSetupModal.tsx:103-105`).
  - `tw:text-white` (`:84,86`).
  - `tw:text-xs` (`useImportRecords.tsx:91,97,108`).
  - `tw:bg-white` (`RecordTemplatePreviewDialog.tsx:131`).
- **Stale lint exemption:** `@lint-hex-policy: component-theme` (`CMSCollectionSetupModal.tsx:2`) exempts the file from hex lint, though it holds no hex. This is a silent hole for future edits.
- **Clean:** no purple, no raw `<button>/<input>`, no hex in `cms/*`; Inter via tokens.
- **Prior ID:** none.

### C-23 Import: two paths with different rules, a dead-end error, and Escape abandons an import
- **Classification:** UX / State · **P3** · CODE_EVIDENCE.
- **Actual:**
  - CSV goes through the server (`CsvImportDialog.tsx:95-118`); JSON loops `createContentItem` client-side (`useImportRecords.tsx:36-60`).
  - The error step offers only Close, with no Back or retry (`:269-279`).
  - While importing, Cancel is disabled but Escape or the scrim still close the Modal (`:245-249,283`). That unmount drops the result and skips `onImported`, so the table stays stale.
  - Neither path warns about required fields left unmapped, and neither has Undo import.
- **Expected:** C2: "Import: one server path, coercion by type, preview for both, required-missing count, Undo import".
- **Prior ID:** proposal DM-14 / UI-12 (open).

### C-24 Dynamic pages: the button says "Generate" but only saves; stale template list; copy over-promises
- **Classification:** Copy / State · **P3** · FIGMA_EVIDENCE · BOTH_GAP (copy) and DESIGN_GAP (SEO).
- **Actual:**
  - "Generate N pages" just saves the settings; pages appear on the next site publish (`DynamicPagesPane.tsx:79-101,232`).
  - The intro says "Pages are created on publish and update when records change" (`:156`); they don't update until the next publish.
  - The hint "Generated pages open here and under Pages" is false (`CmsWorkspace.tsx:325`): the route rows aren't clickable and Pages shows only a "+N" link.
  - The template list is memoised on `[composer]` only (`:43-54`), so a page added or renamed after mount is missing.
  - There is no unsaved guard on leaving the tab.
- **Figma:** `4428:147857` uses the same copy and button, and has **no** SEO title/description fields (code has them, BD-05), so the board is stale there.
- **Recommendation:** label "Save" + "N pages will be generated on next publish"; recompute pages on page events; make routes link to the template preview.
- **Prior ID:** CMS-13 ("Generated pages open … under Pages", STILL OPEN).

### C-25 Search and filtering are minimal
- **Classification:** UX · **P3** · CODE_EVIDENCE.
- **Actual:**
  - Substring search over every field's raw value, which includes rich-text HTML, so "strong" matches (`RecordsTable.tsx:110-116`).
  - No status or field filter, no saved Views (D5, C5).
  - No-results says "Search looks at every field…"; the dump of `6819:59478` offers "Search everywhere for 'sushi'".
- **Prior ID:** PD-20 record search (search now exists; filters STILL OPEN).

### C-26 Pages panel "+N from collections" opens only one collection
- **Classification:** IA · **P3** · CODE_EVIDENCE.
- **Actual:** `PagesTab.tsx:94-98` opens `dynamicPages.collectionId` (a single collection), even when N spans several.
- **Prior ID:** CMS-23 (STILL OPEN).

### C-27 Copy and vocabulary bugs
- **Classification:** Copy · **P3** · CODE_EVIDENCE.
- **Singular from the collection name:** `collection.name.replace(/s$/, "")` (`RecordSheet.tsx:194`) produces "New New", "New Categorie" and "New Statu" for collections named News, Categories and Status.
- **The save toast over-claims for drafts:**
  - It always says "Changes to this record are live in the CMS. Published pages using this record will refresh on next build." (`:265-271`).
  - For drafts, nothing is live.
  - "Build" is not product vocabulary; the product says publish.
- **The settings Source row is fixed copy:** "Buildrik CMS · Records are edited here" (`CollectionSettingsPane.tsx:119-127`).
  - The board (`4428:148660`) shows "Google Sheets · Menu · Synced 2h ago · View source ›". That board is stale under the 09-25 "no OAuth" decision and C5.
- **Prior ID:** CMS-13 vocabulary drift (partly FIXED; "entry" remains, see C-21).

---

### VERIFIED_OK (code; not run live in this track)
- **Unsaved-changes guard covers every door:** table row, tab, drawer row, ⌘K, the shell tab switch (`cmsWorkspaceStore.ts:50-62`, `RecordSheet.tsx:198-261`). "Keep editing" takes focus (`:158-166`). Board `6879:67190` exists in the dump.
- **Collection delete:** typed DELETE; the consequence counts records, pages and bound elements; it is blocked while another collection references this one (`CollectionSettingsPane.tsx:55-73,133-145`). This is richer than board `4428:148660`.
- **Field delete:** locked while bound or used in the URL pattern (`DeleteFieldDialog.tsx`, matches `4418:165439`). The SEO-pattern gap is C-09.
- **Empty states exist:** no collections, no fields, no records, no results, deleted reference, gone record or collection. Sort has `aria-sort` and pagination is 50 per page.
- **Prior items FIXED in code:** CMS-01 (repeat blank records), CMS-02/03 (one field path, slug type), CMS-06, CMS-09, CMS-19 (fields filtered by element type).

---

## Figma vs code

| Board node | Board shows | Code does | Verdict |
|---|---|---|---|
| `4428:143182` Records table | 5 cols, no status / checkbox / pager, 40px rows | Same columns plus a "· Draft" suffix, search under the tabs, 50-row pager | Code ≈ board; **both behind PD-10 / C2** (C-03) |
| `4428:144760` Record workspace | Full overlay over the table, duplicate tab row, no Published switch | Same overlay plus a Published toggle in the footer | Code ≈ board; **both violate PD-10** (C-01); the board also lacks the publish switch |
| `4428:147552` Fields | Used by = page-level labels; › per row | Used by = layer name or element type, no page, not clickable | **CODE_GAP** (C-10) |
| `4428:147857` Dynamic pages | Pattern, Template, Ready, route list, "Generate 4 pages"; no SEO | Same plus SEO title/description patterns | Board stale (DESIGN_GAP); shared copy issues (C-24) |
| `4428:148660` Settings | Source = Google Sheets synced; danger counts records / pages | Source = "Buildrik CMS"; danger counts bindings and blocks on references | Board stale (decision 09-25); code richer |
| `7063:79200` Inspector · From CMS | CONTENT section, Source radio, Collection only | `CmsBindingSection`: ButtonGroup, Collection, Field, Record, preview, Open record, Unbind | Board stale (superseded by v4) |
| `7995:205467` Inspector v4 bound heading | CMS binding: Static / From CMS, Collection, + New collection…, Field "name · Text", preview, Open record, Unbind, hint | Matches, plus a Record row (CMS-04) | Code ≈ board; board lacks the Record row (C-20); both show the key (C-19) |
| `8139:217560` Record conflict | Yellow band, Keep mine (ghost) / Use theirs (primary), no diff | Identical | Match; **both** blind (C-06) |
| `4418:84646` New collection | Step chips, drag handles, Template + SEO in the summary | Chips + handle kept; summary = slug pattern only | Mostly match; board stale on template / SEO; both keep the chips (C-21) |
| `6881:70349` Delete record (typed) | Page-owning record, typed DELETE | Identical, for page-owning records only | **Match** (C-04) |

## Figma debt
- **Stale against approved decisions:**
  - `4428:144760` and its 10 record-workspace siblings (dump: `5940:149118`, `…149532`, `…149946`, `6887:75832`, `…76066`, `…76300`, `6749:59940`, `6930:81443`, `7116:76427`, `8139:217560`) still draw the overlay, not the PD-10 480px dock.
  - `4428:143182` has no status, bulk or filter states.
- **Missing states** (proposal F2, none exist): workspace-root overview; records loading skeleton; bulk-selected and bulk-delete; record panel saving / saved / field-level validation / read-only / missing media; the conflict *diff*; field type-change confirm; Required impact; record delete with dependants (C-05); import progress / partial / Undo.
- **Board text behind the code:**
  - `4428:147857` has no SEO patterns.
  - `4428:148660` shows the Google Sheets source.
  - `4428:148905` (dump) shows "Import from Google Sheets"; code shows Import JSON + Import CSV.
  - `7063:79200` and `7995:205467` have no Record row.
  - `4418:84646` has template / SEO in the summary.
- **Orphans:** FG-013's 4 CMS state boards (conflict / deleted / collection-deleted / publish-blocked) are unreachable in the prototype. Not re-checked here (no metadata call spent).
- **Uncovered by any board:** the RichTextField toolbar, OptionsEditor and ReferenceField "Deleted record" (the code comments say so); Date field config (FG-043: boards `7978:197166/197182` exist; the code still says "no boards"; STILL OPEN, not re-read).

## Prior-finding reconciliation

| Prior | Status at 7a50e34e1 |
|---|---|
| L3-020 (a) typed DELETE | RECLASSIFIED: matches the boards for page-owning records (C-04). The real gaps are the Undo id (C-02) and dependants (C-05). |
| L3-020 (b) status column / row actions | STILL OPEN (C-03) |
| L3-021 conflict hides theirs | STILL OPEN; the board shares it (C-06) |
| L3-023 key in picker / "Open affected record" / stepper / blank root / ⋯ tab / green footer | All STILL OPEN (C-19, C-17, C-21, C-16, C-11, C-18). "Empty-state links wrap": not re-checked (ContentViews). |
| FG-043 Date config | STILL OPEN (`AddFieldDialog.tsx:11-12` says "no boards") |
| FG-013 CMS orphans | NOT RE-VERIFIED |
| DQ-027 extra 56px `cms-ws-header` | Code matches boards `4428:143182/147552` (56 header); a design exception, not a code defect |
| CMS-08, 11, 12, 20, 21, 23 | STILL OPEN (C-10, C-01, C-11, C-08, C-16/C-15, C-26) |
| CMS-13 | PARTLY FIXED (BindingBanner gone); "under Pages" and "entry" remain |
| CMS-01, 02, 03, 04, 06, 09, 19, 22 | FIXED in code |
| CMS-07 duplicate slugs, CMS-17/18 canvas | Not in this track's scope (server / engine); not re-verified |

**Not verified in this track:** any runtime behaviour (no live app was driven), screen-reader output, and the prototype wiring of the boards.
