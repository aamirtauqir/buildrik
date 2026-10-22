# 05-resources inventory — Figma page 05 · Resources (`page-3-6.json`)

Scope: 527 `active` rows of `boards-2l9.json` with page `05`. All are in `05-resources.json`; the 35 `out-of-scope` resources rows are excluded. This pass changed no code, made no Figma calls and used no screenshots. It judges only from the dump's texts, instances and boxes, read against the code in `feat/design-2l9` (paths are relative to `packages/editor/src/editor/` unless prefixed).

| family | rows | match | drift | missing | blocked |
|---|---|---|---|---|---|
| cms (B5-*) | 277 | 2 | 113 | 149 | 13 (11 annotation-only, 2 bd39-sources-flag-off) |
| brand (B6-B*) | 62 | 0 | 40 | 20 | 2 (1 owner-class-first, 1 first-run-out-of-scope) |
| assets (B6-A*) | 34 | 1 | 27 | 6 | 0 |
| components (B6-K*) | 42 | 0 | 17 | 25 | 0 |
| templates (B6-T*) | 36 | 0 | 12 | 24 | 0 |
| resources (Guard / Pending / GAP / RL / handoffs) | 76 | 0 | 43 | 18 | 15 (9 annotation-only, 6 bd39-sources-flag-off) |
| **total** | **527** | **3** | **252** | **242** | **30** |

New blocked reasons this group introduces, for the lead to accept or rename:
- `blocked:annotation-only`: handoff and spec boards that carry contract text but no product UI. Their contracts are summarised in the notes.
- `blocked:bd39-sources-flag-off`: stored-JSON Sources surfaces. Board RL00 (BD-39) marks them as a future capability, hidden in this release.
- `blocked:first-run-out-of-scope`: B6-B47, per the brief.

Status `code-ahead` was not used on any row. Code capabilities that the boards lack are listed under each family's "Code-ahead" heading.

## CMS — records, fields, recovery, collection settings, creation/import, site variables (B5-C/T/F/R/K/N/M/V)

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| records-table | 165:2 | 1 | src/editor/cms/CmsWorkspace.tsx:403; src/editor/cms/RecordsTable.tsx:165 | drift | Board: status filter, sort menu, Columns, 4 visible tabs; code: search + header sort, Records/Fields + ⋯ menu (CmsWorkspace.tsx:64,358) |
| record-sheet | 165:520, 165:1350 | 2 | src/editor/cms/RecordSheet.tsx:504 | drift | Board: ‹ Blog records back, 4 tabs, always-on Preview (unsaved) pane; code: crumb, 3 tabs (:576), Preview ▸ toggle (:600) |
| record-saving | 165:797, 254:81738 | 2 | src/editor/cms/RecordSheet.tsx:710 | drift | Save disabled while saving but label stays "Save record"; board shows "Saving…" |
| record-save-failed | 165:1072 | 1 | src/editor/cms/RecordSheet.tsx:326 | drift | Code: footer state line + "Retry save" (:711); board: top banner "Couldn’t save · edits still here" |
| record-offline | 165:1625 | 1 | src/editor/cms/RecordSheet.tsx:102 | drift | Code saves to device with offline footer copy; board banner "You’re offline · not saved to server" |
| record-changed-elsewhere | 165:1903 | 1 | src/editor/cms/RecordSheet.tsx:615 | drift | Code: whole-record Keep mine / Use theirs strip; board: banner + Review entry to field diff |
| record-conflict-field-diff | 165:2414 | 1 | src/editor/cms/RecordSheet.tsx:277 | missing | No per-field diff modal; code resolves conflicts only as whole-record keepMine/useTheirs |
| record-leave-guard | 165:2184, 254:81923 | 2 | src/editor/cms/RecordSheet.tsx:722 | drift | Code "Discard record changes?" Discard and leave/Keep editing; board "Leave without saving?" adds Save and leave |
| record-server-accepted | 168:21194 | 1 | src/editor/cms/RecordSheet.tsx:283 | match | Use theirs result: form shows latest server record |
| record-saved-preview | 170:9596 | 1 | src/editor/cms/RecordTemplatePreviewDialog.tsx:95 | match | "Preview saved record" read-only dialog renders saved record, not draft |
| return-to-editor | 168:20773 | 1 | src/editor/cms/CmsWorkspace.tsx:169 | drift | Code "‹ Back to canvas" only when opened from an element; board persistent "‹ Back to Editor · Home"; editor chrome phase1 |
| fields-table | 165:2648, 167:9021, 254:74310 | 3 | src/editor/cms/FieldsTable.tsx:44 | drift | Board adds Key column; columns Name/Type/Required/Used by otherwise match |
| fields-stored-values-list | 257:51073, 259:90449 | 2 | src/editor/cms/FieldsTable.tsx:44 | drift | Board shows "Used by N · M values" + Change type/Delete/Add required actions; code has no value counts |
| field-inspector-locked | 165:2917 | 1 | src/editor/cms/FieldInspector.tsx:147 | drift | Key/type lock when bound matches; board adds Placeholder, Help text, Show N usages, explicit Save field (code commits on blur) |
| field-usages | 165:3173 | 1 | src/editor/cms/FieldInspector.tsx:231 | drift | Code lists uses inline in inspector; board separate "Title · 4 usages" list with ‹ Back to field |
| dynamic-pages | 165:3432 | 1 | src/editor/cms/DynamicPagesPane.tsx:156 | drift | Board: Collection page + Edit collection page ›, Social image, "On the next publish" summary; code: Template page select, Generate N pages (:232) |
| dynamic-url-collision | 165:3693 | 1 | src/editor/cms/DynamicPagesPane.tsx:158 | missing | No URL-pattern collision check or "Use {slug}" fix in code |
| collection-settings | 165:3894, 257:57589 | 2 | src/editor/cms/CollectionSettingsPane.tsx:101 | drift | Board: slug URL-impact line, Add redirects, Save collection, Show usages; code: name/slug, Source, Danger zone (:129) |
| collection-in-use-block | 257:57832, 257:58023 | 2 | src/editor/cms/CollectionSettingsPane.tsx:34 | missing | Board blocks delete while used; code unbinds elements then deletes — behaviour conflict, code contract wins pending owner |
| collection-delete-typed | 257:58253, 257:58446 | 2 | src/editor/cms/TypedDeleteDialog.tsx:49 | drift | Typed DELETE matches; board copy promises 30-day Recently deleted that code/server lack |
| collection-delete-no-recovery | 257:59011 | 1 | src/editor/cms/CollectionSettingsPane.tsx:72 | drift | Truthful interim variant; code consequence copy differs ("Deleting removes N records…") |
| collection-delete-pending | 257:58639 | 1 | src/editor/cms/TypedDeleteDialog.tsx:58 | drift | Code only disables confirm while busy; board shows "Deleting Blog…" waiting state |
| collection-delete-failed | 257:58823 | 1 | src/editor/cms/TypedDeleteDialog.tsx:36 | missing | No failure/Retry state for collection delete |
| collection-slug-change | 259:94578, 259:94780, 259:94976 | 4 | src/editor/cms/CollectionSettingsPane.tsx:45 | missing | No URL-impact confirm, pending, failed-draft or acknowledged states for slug save |
| redirects-handoff | 257:59204, 259:94362, 259:95361 | 3 | src/editor/sidebar/tabs/settings/screens/RedirectsScreen.tsx | missing | Redirects screen exists but no CMS-origin prefill of affected URLs or ‹ Back to CMS · Blog |
| field-type-change | 257:51318, 257:51516, 257:51711 | 10 | src/editor/cms/FieldInspector.tsx:147 | missing | Type Select changes type instantly; no conversion preview/clear/ack/refusal flow (server conversion is an SC-9 dependency) |
| field-delete-typed | 257:52890, 257:53085 | 2 | src/editor/cms/DeleteFieldDialog.tsx:99 | drift | Code untyped "Delete this field? cannot be undone"; board typed count + 30-day Recently deleted |
| field-delete-pending | 257:53280 | 1 | src/editor/cms/CmsWorkspace.tsx:235 | missing | No pending state; delete is fire-and-toast |
| field-delete-unavailable | 257:53466 | 1 | src/editor/cms/DeleteFieldDialog.tsx:99 | drift | Interim board refuses delete of valued fields; code hard-deletes — behaviour conflict, owner |
| field-required-impact | 167:9237, 257:53654, 257:53846 | 7 | src/editor/cms/FieldInspector.tsx:207 | missing | Required toggles instantly; no impact dialog, new-records-only rule or default-value backfill |
| add-field-type-picker | 167:3871 | 1 | src/editor/cms/fieldTypes.ts:17 | drift | Picker offers 10 of 16 schema types (shared/schemas/cms.ts:20); labels Boolean→Yes/no, Multi-select→Options |
| add-field-config-supported | 167:4135, 167:4412, 167:4689 | 10 | src/editor/cms/AddFieldDialog.tsx:147 | drift | Code: Name/Required(+collection/options); board adds Key, Default value, min/max, Placeholder, Help text; title copy differs |
| add-field-config-unsupported-type | 167:4956, 167:5224, 167:6306 | 6 | src/editor/cms/fieldTypes.ts:17 | missing | Email/URL/Date & time/Option/File/Color stored by schema but not offered in Add field |
| add-field-saving | 167:8474 | 1 | src/editor/cms/AddFieldDialog.tsx:62 | drift | Busy disables Save; label never becomes "Saving…" |
| add-field-failed | 167:8747 | 1 | src/editor/cms/AddFieldDialog.tsx:79 | missing | No catch: failure not shown, no Retry, draft retention unhandled |
| recently-deleted-list | 257:54485, 259:90820, 259:91009 | 14 | server/trpc/routers/cms.ts:57 | missing | No Recently deleted UI or restore endpoint; server soft-deletes (deletedAt) but lists only live rows |
| recently-deleted-states | 257:56930, 257:57145, 257:57359 | 4 | server/trpc/routers/cms.ts:57 | missing | Empty/loading/failure/no-results of a list that does not exist |
| restore-flow | 257:54735, 257:54936, 257:55127 | 16 | server/services/cms.service.ts:140 | missing | Exact-ID restore needs server undelete (SC-9 dependency); nothing in code |
| restore-source | 259:91934, 259:92134 | 2 | src/editor/sidebar/tabs/content/useContentPanel.ts:147 | missing | Source restore: Sources are in-memory and hidden behind BD-39 flag — future capability |
| restore-as-new-interim | 257:55553, 257:55771, 257:55939 | 3 | src/editor/cms/RecordSheet.tsx:349 | missing | Closest code: record-delete Undo toast re-saves as a new record (CmsWorkspace.tsx:486); no Recently deleted entry |
| collection-empty-records | 254:74075 | 1 | src/editor/cms/CmsWorkspace.tsx:276 | drift | Copy "Add your first record." vs board "…or import existing records."; buttons Import CSV/JSON labels lack "…" |
| create-collection-modal | 254:74551, 254:76593 | 2 | src/editor/shell/modals/CMSCollectionSetupModal.tsx:277 | drift | Title "Fields for X" + step labels vs "Create collection"; "Generate a page per entry" vs "Create a page for each record" + URL pattern |
| create-collection-name-taken | 254:75060 | 1 | src/editor/shell/modals/CMSCollectionSetupModal.tsx:248 | drift | Code separate "Collection name already exists" modal; board inline field error |
| create-collection-creating | 254:75572, 255:81856 | 2 | src/editor/shell/modals/CMSCollectionSetupModal.tsx:396 | drift | Create disabled while creating; verify "Creating…" label |
| create-collection-failed | 254:76081 | 1 | src/editor/shell/modals/CMSCollectionSetupModal.tsx:224 | drift | Raw error message; board "Couldn’t create Events. Your name and starter fields are still here." |
| collection-page-missing | 254:77105 | 1 | src/editor/cms/DynamicPagesPane.tsx:170 | drift | Code Template page select; board "Collection page missing" + Create collection page |
| create-collection-page | 254:77338, 254:77544 | 2 | src/editor/cms/DynamicPagesPane.tsx:170 | missing | No create-and-link collection page from CMS |
| collection-page-linked | 254:77717 | 1 | src/editor/cms/DynamicPagesPane.tsx:93 | drift | Code toast "Dynamic pages saved"; board inline "Collection page link saved" |
| csv-choose | 254:77963 | 1 | src/editor/cms/CsvImportDialog.tsx:143 | drift | Copy differs; board lists expected columns, title "Import CSV · Events" |
| csv-reading | 254:78146 | 1 | src/editor/cms/CsvImportDialog.tsx:151 | drift | "Reading file…" on button vs board body copy |
| csv-mapping | 254:78324 | 1 | src/editor/cms/CsvImportDialog.tsx:165 | drift | Mapping + preview present; copy differs |
| csv-no-mapping | 254:78534 | 1 | src/editor/cms/CsvImportDialog.tsx:230 | drift | Import disabled with no mapping; board adds explanatory message |
| csv-importing | 254:78740 | 1 | src/editor/cms/CsvImportDialog.tsx:241 | drift | Full progress bar + "Importing…"; board "Keep this window open…" copy |
| csv-result | 254:78920, 254:79102 | 2 | src/editor/cms/CsvImportDialog.tsx:255 | drift | "Imported X of Y" + Row errors match; board adds duplicate-risk guidance |
| csv-file-refused | 254:79282 | 1 | src/editor/cms/CsvImportDialog.tsx:86 | drift | Generic error; board names file + Choose another file |
| import-unknown-outcome | 254:79464, 254:81264 | 2 | src/editor/cms/CsvImportDialog.tsx:116 | missing | No unknown-outcome / check-records state |
| json-import | 254:79645 | 1 | src/editor/cms/useImportRecords.tsx:118 | drift | Code opens file picker directly; board modal with format sample |
| json-import-errors | 254:79829, 254:80011 | 2 | src/editor/cms/parseRecordsJson.ts:35 | drift | Refusals shown in inline status (CmsWorkspace.tsx:401), not modal |
| json-import-progress | 254:80193 | 1 | src/editor/cms/useImportRecords.tsx:84 | drift | Inline progress, not modal |
| json-import-result | 254:80371 | 1 | src/editor/cms/useImportRecords.tsx:100 | drift | Inline "Imported N of M" + Row reasons; board modal + guidance |
| imported-records-table | 254:80553, 254:80790, 254:81032 | 3 | src/editor/cms/RecordsTable.tsx:165 | drift | Board footnote "Imported records are drafts…" absent |
| collection-menu | 254:82143 | 1 | src/editor/cms/CmsWorkspace.tsx:382 | drift | Import CSV…/JSON… + disabled Sheets/Airtable present; board "· Planned" vs code "Coming soon" |
| new-record-draft | 254:81490 | 1 | src/editor/cms/RecordSheet.tsx:665 | drift | Code "Not eligible — not saved yet"; board Published toggle copy "include on next site publish" |
| site-variables-list | 260:235689, 260:236943, 260:237185 | 4 | src/editor/sidebar/tabs/content/ContentViews.tsx:461 | drift | Variables in drawer subview "Variables"; board workspace page, intro copy, placeholder counts |
| site-variables-empty | 260:235928 | 1 | src/editor/sidebar/tabs/content/ContentViews.tsx:489 | drift | Empty copy/location differ |
| add-variable | 260:236147, 260:236411, 260:236677 | 3 | src/editor/sidebar/tabs/content/ContentViews.tsx:569 | drift | Inline add row vs modal; dup copy matches (:580), key-rule copy differs |
| variable-save-status | 260:237363, 260:237547 | 2 | src/editor/sidebar/tabs/content/useContentPanel.ts:163 | missing | No per-variable failure/offline banner; site autosave status is phase1 |
| variable-row-menu | 260:237728 | 1 | src/editor/sidebar/tabs/content/ContentViews.tsx:553 | drift | Edit value/Rename/Delete…; board adds Show usages, "Rename key…" |
| variable-edit-value | 260:237910 | 1 | src/editor/sidebar/tabs/content/ContentViews.tsx:523 | drift | Inline edit with "Save"; board "Apply value"/Cancel |
| variable-usages | 260:238267, 260:238707 | 2 | src/editor/sidebar/tabs/content/ContentViews.tsx:461 | missing | No placeholder usage count/list or stale-placeholder prompt |
| variable-rename | 260:238513 | 1 | src/editor/sidebar/tabs/content/ContentViews.tsx:617 | drift | Rename dialog lacks usage impact + Show usages |
| variable-delete | 260:238886 | 1 | src/editor/sidebar/tabs/content/ContentViews.tsx:639 | drift | Delete confirm lacks placeholder impact + Show usages |
| variable-delete-undo | 260:239074, 260:239253 | 2 | src/editor/sidebar/tabs/content/ContentViews.tsx:639 | missing | No Undo receipt after delete; document-undo path unverified |
| cms-handoff | 165:4419, 254:82329, 257:59452 | 6 | — | blocked:annotation-only | Spec/annotation boards (scope, SC-9 engineering gates, outcome launchers); no product UI |


#### Top drifts (cms-a)
- CMS drawer + workspace IA: board shows four visible tabs (Records · Fields · Dynamic pages · Collection settings), "Site variables" and "Recently deleted" in the drawer and a persistent "‹ Back to Editor · Home". The code has Records/Fields plus a ⋯ menu (CmsWorkspace.tsx:64,358), a drawer row labelled "Variables" (ContentViews.tsx:269), no Recently deleted, and "‹ Back to canvas" only when CMS was opened from an element (CmsWorkspace.tsx:169).
- Record sheet structure and states: the code shows a crumb, three tabs and a Preview ▸ toggle (RecordSheet.tsx:560-609). The board has an always-on "Preview (unsaved)" pane, top banners for failed/offline/changed-elsewhere, "Saving…" on the button, and "Leave without saving?" with Save and leave (code: Discard record changes?, :722).
- Field types: Add field offers 10 of the 16 schema types (fieldTypes.ts:17 vs packages/shared/schemas/cms.ts:20). Email, URL, Date & time, Option, File and Color are missing. The config dialog lacks Key, Default value, min/max, Placeholder and Help text (AddFieldDialog.tsx:147), and a failed add has no error state (:79).
- Destructive field ops are instant. Type change (FieldInspector.tsx:147) and Required (:207) commit with no impact preview, and field delete is an untyped hard delete (DeleteFieldDialog.tsx:99). The board wants a conversion preview, typed confirmation and a 30-day Recently deleted.
- Collection delete behaviour conflicts. The board blocks delete while the collection is in use (K22/K23), but the code unbinds and then deletes (CollectionSettingsPane.tsx:34). The board's delete copy promises a 30-day recovery that neither code nor server provides. This needs an owner decision.
- Site variables live in a drawer subview with inline add and edit (ContentViews.tsx:461). The board puts them in a workspace page with an add modal, placeholder usage counts and impact-aware rename/delete.

#### Code-ahead (cms-a)
- Record conflict "Keep mine / Use theirs" whole-record choice (RecordSheet.tsx:277,615): this is the behaviour contract until per-field diff (C09) exists. Keep it inside the C07 banner's Review step.
- Record-delete Undo toast that re-creates the record as new (RecordSheet.tsx:349, CmsWorkspace.tsx:486): this is the interim restore path. It belongs in the B5-R26 "Restore as new record" flow under Recently deleted.
- Field Validation rules (min/max length etc., FieldInspector.tsx:43,214) appear only partly on the board (min/max on Add field). Keep them in the field inspector.
- Collection ⋯ menu disabled Google Sheets/Airtable rows (CmsWorkspace.tsx:392): the board (M18) agrees and labels them "· Planned".

## CMS — dynamic bindings, conditions, collection pages and lists (B5-D)

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| binding-static-entry | 173:8463 | 1 | src/editor/inspector/sections/CmsBindingSection.tsx:277; src/editor/inspector/sections/registry/behaviour.tsx:165 | drift | Binding lives in Behaviour "CMS binding" (Static/From CMS); board puts it in Content as a property-owned binding entry |
| binding-source-picker | 173:9019, 174:12766, 178:17605 | 3 | src/editor/inspector/sections/CmsBindingSection.tsx:238 | drift | Board: grouped source popover (record/list item/specific record/Site/Page, Live=Planned). Code: Collection select only; no Site/Page |
| binding-field-picker | 173:9389, 173:10713, 178:17995 | 3 | src/editor/inspector/sections/CmsBindingSection.tsx:57,132,249 | drift | Board lists incompatible fields with reasons; code hides them (CmsBindingSection.tsx:57,132) |
| binding-bound-summary | 173:9757, 174:12411, 177:16471 | 5 | src/editor/inspector/sections/CmsBindingSection.tsx:302 | drift | Content "Dynamic bindings" row + Blog·title value + receipt "Title bound… Undo"; code: Behaviour Field select + preview line |
| binding-subview | 173:10329, 173:15823, 174:13529 | 3 | src/editor/inspector/sections/CmsBindingSection.tsx:302-324; src/engine/cms/CMSBindingManager.ts:49 | drift | Subview Source/Format/If empty/Preview/Open record/Unbind; no Format/If-empty UI (engine fallback CMSBindingManager.ts:49) |
| binding-context-menu | 173:11096 | 1 | src/editor/inspector/sections/CmsBindingSection.tsx:313,321 | drift | Popover: Change field / Open record / Unbind — keep shown text; code shows flat ActionRows (CmsBindingSection.tsx:313,:321) |
| binding-unbind-receipt | 173:11458 | 1 | src/editor/inspector/sections/CmsBindingSection.tsx:214 | drift | Unbind keeps text + one undo matches (CmsBindingSection.tsx:214); board adds receipt "Title is now static text · Undo" |
| canvas-record-picker | 173:12022, 177:17091, 174:13155 | 4 | — (src/editor/canvas/hooks/useCMSPreview.ts has no record selector) | missing | Canvas record row (Record ‹ › Show drafts) + picker popover absent; code previews first published record only (CmsBindingSection.tsx:178) |
| canvas-record-preview | 173:12390 | 1 | src/editor/inspector/sections/CmsBindingSection.tsx:178 | missing | Previewing record 2 of 980 on canvas; code cannot switch preview record for template/list context |
| binding-status-empty | 173:12958 | 1 | src/engine/cms/CMSBindingManager.ts:218 | drift | Empty value → fallback shown + status note; engine fallback (CMSBindingManager.ts:218) but no status row |
| binding-status-loading | 173:13534 | 1 | src/editor/inspector/sections/CmsBindingSection.tsx:305 | drift | "Loading Blog records…" status; code shows "…" (CmsBindingSection.tsx:305) |
| binding-status-load-failed | 173:14104 | 1 | src/editor/inspector/sections/CmsBindingSection.tsx:189 | missing | "Couldn't load Blog. Binding kept · Retry"; code catch leaves preview null → "…" forever (CmsBindingSection.tsx:189) |
| binding-status-field-missing | 173:14676 | 1 | src/editor/inspector/sections/CmsBindingSection.tsx:125,284 | missing | Field deleted → "Choose field"; code detects only deleted collection (CmsBindingSection.tsx:125,:284) |
| binding-status-incompatible | 173:15249 | 1 | — | missing | Field type changed to Image → "Choose a text field"; no type-drift check in code |
| record-return-to-binding | 173:16169, 173:16399, 173:16863 | 3 | src/editor/cms/RecordSheet.tsx:521; src/editor/cms/RecordPreview.tsx:6 | drift | Record opened from binding: crumb "‹ Heading · Title binding"; code "‹ Back to canvas" (RecordSheet.tsx:521) |
| record-return-saving | 173:16635, 174:13882, 177:16850 | 3 | src/editor/cms/RecordSheet.tsx:155 | missing / drift | Saving with pending return intention ("Stay here"); code has no return-intent state |
| record-return-save-failed | 174:14111 | 1 | src/editor/cms/RecordSheet.tsx:326 | drift | Save failed, return paused + "Retry and return"; code failure copy (RecordSheet.tsx:326) has no paused return |
| record-leave-guard | 173:17098 | 1 | src/editor/cms/RecordSheet.tsx:725 | drift | Guard names destination + Save and leave; code "Discard record changes?" Keep editing/Discard only (RecordSheet.tsx:725) |
| record-narrow | 180:17867, 180:18105, 183:20735 | 4 | src/editor/cms/CmsWorkspace.tsx (no compact layout) | drift / missing | CMS record at 1280×640 with "CMS navigation" collapsed; CmsWorkspace has no compact layout. Topbar phase1 |
| condition-inspector-empty | 176:17207 | 1 | — (only src/editor/sidebar/tabs/content/ContentViews.tsx:651) | missing | Inspector Content Conditions ("Show on every record · + Add rule"); code edits conditions only in CMS drawer (ContentViews.tsx:651) |
| condition-rule-editor | 176:17568, 182:20917 | 2 | src/editor/sidebar/tabs/content/ContentViews.tsx:722 | missing | Rule row Match All / source / operator / Remove; code is a free-text path+operator form in the drawer (ContentViews.tsx:722) |
| condition-source-picker | 176:17956 | 1 | — | blocked:bd39-sources-flag-off | Picker offers stored-JSON opening_hours; BD-39 hides new stored-JSON choices while flag off. CMS/Site/Page part missing |
| condition-ghost | 176:19089, 176:19451 | 2 | — | missing | False condition → 40% selectable ghost + View "Show hidden elements"; no canvas ghost/view pref in code |
| condition-missing-path | 176:19804, 177:17469, 177:17866 | 3 | — | missing | Missing path keeps rule, shows on live + Choose field; no path validation in code (fixture source is stored JSON) |
| condition-legacy | 176:20156, 176:20542 | 2 | — | missing | Legacy condition inactive until reviewed, Activate/Keep inactive; no legacy state in code |
| condition-source-manager-return | 176:20912 | 1 | src/editor/sidebar/tabs/content/ContentViews.tsx:303 | blocked:bd39-sources-flag-off | Sources manager with "‹ Heading · Condition" return; Sources hidden under BD-39 (RL00). SourcesView ContentViews.tsx:303 |
| cms-conditions-index | 176:21830 | 1 | src/editor/sidebar/tabs/content/ContentViews.tsx:651,771 | drift | Board: read-only index with Locate, edit in Inspector. Code: editable list with + New condition/Remove (ContentViews.tsx:651,771) |
| content-condition-status | 182:18493, 182:20512, 182:18901 | 6 | — | missing | Content summary "1 · Hidden" + receipt; no condition status in inspector |
| condition-removed-receipt | 182:21319 | 1 | src/editor/sidebar/tabs/content/ContentViews.tsx:707 | drift | Remove exists in drawer menu (ContentViews.tsx:707); board removes from inspector with Undo receipt |
| add-cms-fields | 176:21119, 176:21523 | 2 | src/editor/sidebar/tabs/build/catalog/catalog.ts:37 | missing | Add panel "CMS fields · Blog" contextual insertion into named position; Add has only generic Collection list (catalog.ts:37) |
| add-collection-lists | 189:21741 | 1 | src/editor/sidebar/tabs/build/catalog/catalog.ts:37; src/blocks/Layout/CollectionList.tsx:39 | drift | Add offers "List of Blog/List of Team/blank"; code one generic Collection list block (catalog.ts:37, blocks/Layout/CollectionList.tsx:39) |
| collection-list-query | 189:22181 | 1 | src/editor/inspector/sections/CollectionListSection.tsx:64-89; src/engine/cms/RepeaterRenderer.ts:155 | drift | Content list panel Source/Filter/Sort/Show/Skip/Split/When empty; code: Collection + Show items (CollectionListSection.tsx:64) |
| collection-list-filter | 189:22915, 189:23428 | 2 | — | missing | Filter rule + category menu; no list filter in code |
| collection-list-empty | 189:24174 | 1 | — | missing | Editable "No items" slot + When empty; not in code |
| collection-list-sort | 189:24890 | 1 | — | missing | Three sort keys; code has no sort control |
| collection-list-pagination | 189:25445, 189:25985 | 2 | — | missing | Split into static pages /page/N; not in code |
| collection-list-related | 189:26518, 195:27443, 195:28651 | 4 | — | missing | Related list: filter by this page's category, exclude current record, pagination disabled; not in code |
| list-card-template | 189:27274 | 1 | — | missing | Card context "Inside list of Blog · edits affect every copy" + Link-to binding row; no card context in code |
| list-card-record-link | 189:27792 | 1 | src/editor/inspector/sections/LinkSection.tsx (no CMS target) | missing | Link to "This record's page"; LinkSection has no CMS record-page target |
| list-return-to-origin | 189:28227 | 1 | src/editor/inspector/sections/CollectionListSection.tsx:91; src/editor/cms/CmsWorkspace.tsx:172 | drift | Open collection exists (CollectionListSection.tsx:91); back reads "‹ Back to canvas" (CmsWorkspace.tsx:172), not origin list |
| collection-page-empty | 187:20406 | 1 | src/editor/cms/DynamicPagesPane.tsx:171 | drift | Board: "Create collection page / Choose an existing page"; code only template-page select (DynamicPagesPane.tsx:171) |
| collection-page-linked | 187:21853 | 1 | src/editor/cms/DynamicPagesPane.tsx:158-180 | drift | Linked summary + Edit collection page › + publish count; code edits pattern/template/SEO fields (DynamicPagesPane.tsx:158-180) |
| collection-page-create | 187:20616, 191:31132 | 2 | — | missing | Create collection page modal (fields→elements, layout); no page generator in code |
| collection-page-create-pending | 187:20858 | 1 | — | missing | Creating page then link; not in code |
| collection-page-link-failed | 187:21035, 187:21245, 187:22071 | 3 | — | missing | Page created, link not saved + Retry link only; not in code |
| collection-page-created | 187:21418 | 1 | — | missing | Generated ordinary page + receipt "6 pages on publish · Undo"; not in code |
| collection-page-missing | 187:22375, 187:22586 | 2 | src/editor/cms/RecordTemplatePreviewDialog.tsx:53 (partial) | missing | Saved link with missing page, publish blocked; partial: RecordTemplatePreviewDialog.tsx:53 only |
| link-row-generation | 193:25438, 193:25921, 193:26469 | 7 | src/editor/inspector/sections/LinkSection.tsx (no CMS target) | missing | Card Link "Team has no page per record · Create collection page"; LinkSection lacks record-page target |
| link-row-link-failed | 193:28433, 195:29268 | 2 | — | missing | Page created, link failed, Retry link save; not in code |
| list-card-content | 197:28410, 197:28869, 197:29333 | 3 | — | missing | Card Content "Inside list of Team · This card has no link · Edit link in Behavior ›"; not in code |
| handoff-annotation | 173:17364, 176:22052, 187:23017 | 5 | — | blocked:annotation-only | Binding contract: property-owned, Sources absent from binding, Live=Planned, record/drafts are view prefs, CMS vs doc save split |


#### Top drifts (cms-d)
- Binding ownership: board puts CMS binding in Inspector **Content** ("Dynamic bindings" row + binding subview); code keeps it in **Behaviour › CMS binding** with Static/From CMS toggle (CmsBindingSection.tsx:277, registry/behaviour.tsx:165).
- Source/field pickers: board has a grouped source popover (record / list item / specific record / Site / Page, Live = Planned) and lists incompatible fields with reasons; code is two SelectRows that hide incompatible fields (CmsBindingSection.tsx:57,132,238).
- Binding status states: load-failed, field-missing and incompatible-field have no UI (failure leaves "…" forever, CmsBindingSection.tsx:189); only collection-missing is detected (:284).
- Conditions: board makes CMS › Conditions a read-only index with Locate and edits rules in the element's Inspector; code edits them in the CMS drawer with a free-text path form (ContentViews.tsx:651,722). Ghost/legacy/missing-path states are absent.
- Collection list query: board's Content panel has filter, 3 sort keys, skip, pagination, When-empty slot, related-list "exclude this record"; code exposes collection + limit in Behaviour (CollectionListSection.tsx:64-89). Behaviour gap: canvas list renders drafts (RepeaterRenderer.ts:155); board says published-only with Show drafts as a view preference.
- Record return-to-origin: board crumbs back to the exact origin ("‹ Heading · Title binding", "‹ Home · Latest posts") with Save-and-leave guard; code says "‹ Back to canvas" (RecordSheet.tsx:521, CmsWorkspace.tsx:172) and the guard offers only Discard (RecordSheet.tsx:725).

#### Code-ahead (cms-d)
- Binding "Specific record" pin exists in code as a Record select outside list/template context (CmsBindingSection.tsx:256); board shows it only as a "Specific record · Pin one record" source row. Should live in the D02 source picker, not a separate select.
- Binding Source-missing state with Reconnect… (CmsBindingSection.tsx:284) has no board in this slice (closest: D14 field-missing). Keep it as the collection-deleted variant of the binding-status row.
- CMS drawer still allows creating conditions (+ New condition, ContentViews.tsx:771). The board demotes that view to a read-only index, so that create path moves to the Inspector rule editor (D28/D29).

#### Unmappable / notes
- D30 and D40 are `blocked:bd39-sources-flag-off`: their stored-JSON source entry points are pre-BD-39 future references (RL00). The condition mechanics boards (D33–D36, D41, D45, D46) use an opening_hours fixture but describe flag-independent behaviour, so they are marked `missing`.
- Canvas record row, Show drafts, collection-page generator, link-row generation and the list query (filter/sort/pagination/related) have no code surface at all.

## Brand (B6-B*) — src/editor/design-system/

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| brand-colors-list | 203:33565 | 1 | `design-system/BrandWorkspace.tsx:965, colors/ColorTokenList.tsx:119` | drift | Shell: nav flat "Colours…" vs grouped Tokens/Reusable styles/Tools; "Back to canvas" vs "‹ Back to Editor · Home"; table vs Edit› cards; "+ Add token" vs "+ Add color" |
| token-edit | 203:34125, 203:34679, 203:35333 | 3 | `design-system/ui/sections/TokenDetailView.tsx:129, :694` | drift | Token card in preview column, not a "‹ Colors" drill-in with reach line; card tooltip says "Edits stay in the draft until you Save" (autosave contract). B06 saved = phase1 status |
| token-invalid-color | 203:34892 | 1 | `design-system/ui/colors/ColorPicker.tsx:335` | drift | Copy "Enter a valid hex like #3B82F6" vs board "Enter a valid hex color, such as #1A56DB. The token hasn’t changed." |
| brand-leave-guard | 203:35106, 212:38600, 219:42625 | 3 | `design-system/ui/BrandWorkspace.tsx:279` | missing | No leave guard: code contract is autosave, "no leave guard" (BrandWorkspace.tsx:34, :279). Pending/failed/offline save guard needs lane decision |
| starters-list | 203:35546 | 1 | `design-system/ui/sections/StartersSection.tsx:49` | drift | Rows apply on click; board lists "From logo or URL ›" as a 6th starter row (code: separate "Your own brand" card behind dsAi) |
| starter-preview-apply | 203:36082 | 1 | `design-system/ui/sections/StartersSection.tsx:81` | missing | No starter preview: row click applies at once (StartersSection.tsx:81-82); no "Preview only" pane, Cancel/Apply |
| starter-apply-pending | 203:36613 | 1 | `design-system/state/useApplyStarter.ts:46` | missing | No restore point before starter apply (useApplyStarter has none) |
| starter-applied-receipt | 203:36801 | 1 | `design-system/state/useApplyStarter.ts:46` | drift | Applies without receipt; board receipt carries an Undo button — conflicts with one-undo (topbar only, Task 1.2) |
| starter-checkpoint-failed | 203:37025 | 1 | `design-system/state/useApplyStarter.ts:46` | missing | No checkpoint step for starters, so no "Couldn’t create a restore point" error state |
| dark-mode-page | 203:37214, 203:38036 | 2 | `design-system/ui/sections/DarkModeCard.tsx:61, ColourModeSection.tsx:45` | drift | Auto/Off card + per-token list; copy differs ("Auto follows each visitor’s device…"), no "Mode · Off" + "Turn on Auto…" paired-value list |
| dark-mode-enable-confirm | 203:37790 | 1 | `design-system/ui/sections/DarkModeCard.tsx:85` | missing | No impact-preview dialog: Auto applies directly with restore point (DarkModeCard.tsx:85) |
| import-export-panel | 203:38272, 212:39331 | 2 | `design-system/ui/sections/ExportSection.tsx:144` | drift | 760 panel with drop zone + format radio + dark-strategy menu; board splits Import/Export, "Update matching" mode, Copy/Download .css |
| import-dry-run | 203:38814 | 1 | `design-system/ui/sections/ImportCard.tsx:114` | drift | Dry-run card lists valid tokens; board breakdown Added/Modified/Skipped/Unsupported/Alias fidelity + "Apply 8 valid" |
| import-offline-local-recovery | 203:39366 | 1 | `design-system/ui/sections/ImportCard.tsx:114` | missing | No offline local-checkpoint confirm for import |
| import-applied-receipt | 212:39590 | 1 | `design-system/ui/sections/ImportCard.tsx:220` | drift | Toast only; board result card with counts matching dry-run + receipt Undo (one-undo conflict) |
| brand-checks | 203:39584 | 1 | `design-system/ui/sections/LintSection.tsx:107` | drift | Findings show Fix/Open only; Ignore lives on token card (TokenDetailView.tsx:671); no "Show ignored · N"; "Unconnected color" not a lint row |
| connect-brand-colors | 203:40130 | 1 | `design-system/ui/sections/ConnectTokensCheck.tsx:60` | drift | "Connect exact matches" page vs "Connect to Brand colors" captured-scope sheet, "Apply 3 connections" |
| connected-receipt | 203:40662 | 1 | `design-system/ui/BrandWorkspace.tsx:837` | drift | Toast "Tokens connected · Undo ⌘Z" vs receipt with Undo button (one-undo conflict) over remaining finding |
| typography-page | 207:38460 | 1 | `design-system/ui/sections/TypographySection.tsx:184` | drift | "Fonts & type styles" card; board Heading/Body font selects + font-size token rows with Used by; "+ Add a font" vs "Manage site fonts ›" |
| spacing-page | 207:38727 | 1 | `design-system/ui/BrandWorkspace.tsx:641` | drift | Presets in ⋯ menu (Compact · 2px…) vs board segmented Compact/Normal/Spacious + Reset to defaults |
| other-kinds-index | 207:38995 | 1 | `design-system/ui/BrandWorkspace.tsx:645` | drift | 11 kinds reached by a Select in Spacing header; board index page with one row + description per kind |
| kind-token-list | 207:39217, 219:41687 | 2 | `design-system/ui/tokens/KindTokenList.tsx:43` | drift | Kind list + side card; board "‹ Other kinds", "+ Add radius", row ⋯ menu Rename/Delete… |
| kind-invalid-value | 207:39439 | 1 | `design-system/ui/sections/TokenDetailView.tsx:421` | drift | No inline length validation copy found ("Use a length such as 8px…"); value edit is in token card |
| kind-inline-rename | 219:41918 | 1 | `design-system/ui/sections/TokenRenameDialog.tsx:43` | drift | Rename is a modal "Rename token ID" (TokenRenameDialog), board renames inline with Enter/Esc |
| type-styles-presets | 207:39789 | 1 | `design-system/ui/sections/ReusableStylesSection.tsx:63, StylesSection.tsx:14` | drift | Code splits Styles, Component styles, Presets pages (+ "Generate with AI" on Styles, PR#33 removes); board one read-only catalogue |
| classes-list | 207:40046 | 1 | `design-system/ui/sections/ClassesSection.tsx:51` | blocked:owner-class-first | Class list exists (ClassesSection.tsx:51); class model pending owner flow decisions |
| token-delete-replace | 207:40289 | 1 | `design-system/ui/sections/TokenDeleteDialog.tsx:147` | drift | "Replace border before deleting?" vs board "Delete border?" + "Use instead" select |
| token-delete-usage-unknown | 207:40532 | 1 | `design-system/ui/sections/TokenDeleteDialog.tsx:107` | drift | Unknown-usage refusal exists ("Can’t delete …", Try again); board title "Can’t delete border yet" + copy |
| token-reach-note | 207:40771 | 1 | `design-system/ui/colors/ColorTokenList.tsx:119` | missing | No first-edit "This changes 42 places across the site, including 30 through aliases" note |
| opened-from-inspector | 207:40997 | 1 | `design-system/ui/brandOpenRequest.ts:17` | drift | Inspector chip opens the token (brandOpenRequest) but no "‹ Back to Heading" return to the row |
| from-logo-or-url-source | 210:36861 | 1 | `design-system/ui/sections/BrandFromSource.tsx:124` | drift | Not AI (deterministic extract; PR#33 keeps it) but gated by dsAi flag. Copy: "Start with your brand"/"Website URL" vs board "Get colors and fonts" |
| from-logo-or-url-reading | 210:37078 | 1 | `design-system/ui/sections/BrandFromSource.tsx:375` | drift | Loading "Finding your brand…" progressbar vs board "Reading… up to 20 seconds" + Cancel |
| from-logo-or-url-refused | 210:37301 | 1 | `design-system/ui/sections/BrandFromSource.tsx:111` | drift | Copy "This address can’t be used" vs board "fieldwork.studio didn’t allow us to read it…" |
| from-logo-or-url-timeout | 210:37520 | 1 | `design-system/ui/sections/BrandFromSource.tsx:112` | drift | Copy "That site took too long to answer" vs board "This took too long and was stopped…" + Try again |
| from-logo-or-url-preview | 210:37740 | 1 | `design-system/ui/sections/BrandFromSource.tsx:333` | drift | "Preview extracted brand" vs board "Result from …" token→value rows with Used by, Light/Dark locked note |
| from-logo-or-url-applied | 210:37943 | 1 | `design-system/ui/sections/BrandFromSource.tsx:227` | drift | Success strip + toast "Brand applied · Undo ⌘Z" vs receipt Undo button (one-undo conflict) |
| from-logo-or-url-offline | 210:38222 | 1 | `design-system/ui/sections/BrandFromSource.tsx:124` | missing | No offline state for website read |
| discard-preview-confirm | 212:39840 | 1 | `design-system/ui/sections/BrandFromSource.tsx:124` | missing | No "Discard this preview?" dialog; preview is reverted silently on navigation/unmount |
| restore-points | 210:38443 | 1 | `design-system/ui/sections/RestorePointsSection.tsx:59` | drift | Restore points is a page (header action), board a "Restore points ▾" popover |
| restore-point-restored | 210:38670 | 1 | `design-system/ui/BrandWorkspace.tsx:845` | drift | Toast "Brand restored · Undo ⌘Z" vs receipt with count + Undo button (one-undo conflict) |
| review-changes | 210:38897 | 1 | `design-system/ui/SessionEditsPopover.tsx:66` | drift | Popover exists with Revert; copy "Edits in this session…" vs board "Changes this session", "Review changes · 3" |
| brand-loading | 212:37895 | 1 | `sidebar/FullPageRouter.tsx:192` | missing | No skeleton / disabled history; workspace lazy-mounts with no loading state |
| brand-offline-banner | 212:38135 | 1 | `design-system/ui/BrandWorkspace.tsx:1030` | missing | No offline banner ("Token edits still apply here…") |
| brand-save-failed | 212:38369 | 1 | `design-system/ui/BrandWorkspace.tsx:279` | missing | phase1: save-failed + retry lives in bottom-bar status; Brand has no own state |
| brand-held-read-only | 212:38857 | 1 | `design-system/ui/BrandWorkspace.tsx:1030, shared/constants/brandReadOnly.ts:10` | drift | Read-only banner exists; copy "This site’s brand was rolled back — editing is paused." vs board "on hold… not about your access" |
| brand-first-run | 212:39093 | 1 | `design-system/ui/BrandWorkspace.tsx:1050` | blocked:first-run-out-of-scope | First-run is out of scope (code has "No brand set." banner, BrandWorkspace.tsx:1050) |
| brand-compact-1280 | 212:40091, 212:40324, 212:40564 | 3 | `design-system/ui/BrandWorkspace.tsx:936` | missing | No compact layout: fixed 256 nav + 468 preview; no "Brand navigation"/"Show website preview" toggles |
| brand-load-failed | 219:42151 | 1 | `sidebar/FullPageRouter.tsx:192` | missing | No "Couldn’t load Brand" + Retry state |
| brand-offline-not-loaded | 219:42387 | 1 | `sidebar/FullPageRouter.tsx:192` | missing | No offline first-load state |
| usage-uncounted | 219:42880 | 1 | `design-system/ui/colors/ColorTokenList.tsx:193, :225` | drift | "Can’t count right now" rows + notice exist; board adds "Retry count" button and copy differs |
| generate-scale-preview | 219:43113 | 1 | `design-system/ui/sections/ScaleGenerator.tsx:53` | drift | "One colour → full scale", 11 primitives; board "Generate a scale from primary", 10 tokens primary-50…900, "Add 10 tokens" |
| dark-preview-off-tooltip | 219:43368 | 1 | `design-system/ui/ColorModeToggle.tsx:31` | drift | Hint "Dark mode is off for this site" vs board "Dark mode is Off. Turn it on in Tools › Dark mode." |
| undo-tooltip-last-action | 219:43600 | 1 | `editor/shell (Task 1.2)` | missing | phase1: topbar Undo tooltip naming last action belongs to Task 1.2 (one undo) |

Paths are under `packages/editor/src/editor/` (`design-system/ui/…` unless shown otherwise).


#### Top drifts (brand)
- Workspace shell: flat nav "Colours / Colour mode / Fonts & type styles / Styles…" vs board groups Tokens (Colors, Typography, Spacing, Other kinds ›) · Reusable styles (Type styles · Presets, Classes) · Tools (Dark mode, Checks, Starters, Import / export); "Back to canvas" vs "‹ Back to Editor · Home"; header line "Changes apply as you edit — undo any time" (BrandWorkspace.tsx:127, :965).
- Preview before apply is missing for starters (StartersSection.tsx:81 applies on click), Auto dark mode (DarkModeCard.tsx:85) and discarding a URL preview. The board draws restore point → preview → Apply for all of them.
- Token editing: the board uses a "‹ Colors" drill-in with a reach note and Light/Dark pickers. The code uses a side card in the preview column (TokenDetailView.tsx:129) whose tooltip still says "Edits stay in the draft until you Save" (:694), which contradicts autosave.
- Receipts (B10/B20/B37/B40/B49) carry their own Undo button. That conflicts with the one-undo decision (topbar only, Task 1.2) and needs a lead or owner ruling. The code uses toasts that say "Undo ⌘Z".
- Brand lifecycle states are missing: loading skeleton, failed to load, offline first load, offline banner, leave guards and compact 1280×640 layout (B42/B43/B45/B51–B53/B56–B58).
- Typography, Spacing, Other kinds and Type styles · Presets page structures differ: font selects plus size tokens, segmented presets, an index page, and one catalogue instead of the Styles/Component styles/Presets split.

#### Code-ahead (brand)
- `✦ Generate with AI` page action + AIPromptModal on Styles/Component styles (BrandWorkspace.tsx:612, AIPromptModal.tsx). No board shows it, and it is an editor AI surface. It belongs under `blocked:pr33-ai-removal` because PR #33 (feat/remove-editor-ai) deletes it.
- Component styles page (ComponentsSection, opens Add › Blocks) has no board in 05; the board folds it into "Type styles · Presets" ("Browse section blocks in Add ›"). Its home should be that catalogue row.
- Dark-strategy menu and Tokens Studio / Figma Variables / Tailwind AST import detection (ExportSection.tsx:240, ImportCard.tsx:97–109) go beyond the board. They should stay in Import / export.
- BrandFromSource is deterministic (not AI) and PR #33 keeps it, but it is gated on the `dsAi` flag (BrandWorkspace.tsx:756, :853). The board shows it as an ungated starter row, so the flag gate needs a decision.

## Assets (B6-A*) — sidebar/tabs/media/, media/


| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Assets workspace · selected asset | 199:37199 | 1 | `src/editor/media/LibraryManager.tsx:755`; `src/editor/media/components/FolderTree.tsx:359,403` | drift | Board: shell topbar+rail stay, left nav “Your uploads for this site / All assets / Recent / Used on this site / No known placements / My folders / Fonts”, filters (types, tag, date, Grid/List, columns), detail tabs Details·Usage·Versions, “Place on canvas / Edit image / More ▾”, “‹ Back to Editor · Home”. Code: edge-to-edge portal (no shell), “Asset library”, Smart Recent/In use/Unused, type tabs, “Insert to canvas”, “‹ Back to canvas”. Shell chrome phase1. |
| Usage tab · known placements | 199:37822 | 1 | `src/editor/media/components/AssetDetailsPanel.tsx:507` | drift | Board splits Pages · N placements / CMS · N record with ↗ links + “Usage outside this site isn’t checked”, “Replace across site…”. Code: one “Used in N places” list. |
| Versions tab · version family | 199:38433, 200:32240 | 2 | `src/editor/media/components/AssetDetailsPanel.tsx:479`; `src/editor/media/components/VersionsModal.tsx:182` | drift | Board inline Versions list (Version N · Selected/Available) + “Upload new version…” + “Use on N page placements…”. Code: VersionsModal with “Apply latest saved version”; no upload-a-new-version in the library (versions only from Edit image). |
| Upload menu | 199:39042 | 1 | `src/editor/media/LibraryManager.tsx:822` | drift | Board: Upload files / From URL / Stock photos & videos / Icons. Code split-button menu: Import from URL… / Add from stock… (Icons is a type tab). |
| Upload transfer · in-grid tile | 199:39336 | 1 | `src/editor/media/components/AssetGrid.tsx:721` | drift | Board tile “Uploading… · Cancel upload”, no percentage. Code draws a % fill bar and has no cancel. |
| Upload registering | 199:39965 | 1 | `src/editor/media/components/AssetGrid.tsx:721` | drift | Board “Saving…” as a distinct registration phase after transfer; code has a single progress phase. |
| Upload registration failed | 199:40594 | 1 | `src/editor/sidebar/tabs/media/hooks/useUploadState.ts:119` | drift | Board tile “Couldn’t save · Not saved to Assets. Your file is kept on this device. · Retry · Remove file”. Code: error row + toast with reason; no Remove file, copy differs. |
| Upload acknowledged | 199:41227 | 1 | `src/editor/media/components/UploadCompleteModal.tsx:49` | drift | Board: tile appears in grid + inline “<file> saved to Assets”. Code opens an “Upload complete” modal. |
| Replace across site · impact review | 199:41851, 201:32973 | 2 | `src/editor/media/LibraryManager.tsx:329`; `src/editor/media/components/ReplaceResultModal.tsx:259` | drift | Board confirm “Replace across site? … Replace 2 images”, CMS usages excluded and named. Code: per-placement checklist “Replace N uses on M pages”. |
| Replace blocked · locked target | 199:42134 | 1 | `src/editor/media/LibraryManager.tsx:329` | missing | No pre-flight refusal when a placement is locked (“Can’t replace these images … No images have changed”). |
| Replace receipt · one Undo | 199:42418, 201:33257 | 2 | `src/editor/media/components/ReplaceResultModal.tsx:259` | drift | Board inline receipt “Replaced 2 images in Home and Studio. CMS unchanged. Undo”; code result modal. Undo control must be the topbar one (Task 1.2) — receipt Undo is toast-level only. |
| Delete used asset · confirm | 199:42695 | 1 | `src/editor/sidebar/tabs/media/components/ConfirmDeleteModal.tsx:78` | drift | Board “Delete Studio study.webp? Used in 3 known places… favicon/social/brand caveat… After 8 seconds this can’t be undone · Delete asset”. Code “Delete permanently” + “Replace instead”. |
| Asset deleted · 8s grace | 199:42990 | 1 | `src/editor/sidebar/tabs/media/hooks/useSelectionState.ts:256` | drift | Grace + Undo for 8000ms exists. Copy differs (“Deleted “x” and cleared it from N elements.” vs “x deleted. Undo available for 8 seconds.”) and board empties detail to “Select an asset”. |
| Inspector image · Replace origin | 199:43595 | 1 | `src/editor/inspector/sections/typeBlock/SourceRow.tsx:44`; `src/editor/inspector/sections/typeBlock/bodies/mediaBodies.tsx:71` | drift | Board button “Replace…” + Alt text; code label “Replace”. Inspector header/breadcrumb is phase1. |
| Replace picker · captured target | 199:44095, 199:44414 | 2 | `src/editor/sidebar/tabs/media/components/PickModePanel.tsx:97` | drift | Board header “Replace image · Work image › Source · Home › Selected work · Cancel”, Recent/All images, Upload, explicit Replace CTA, “selected” status. Code “Choose image” panel with search. |
| Replacement applied · receipt | 199:44733 | 1 | `src/editor/inspector/sections/typeBlock/SourceRow.tsx:44` | drift | Board receipt “Replaced Work image. Alt text kept. Undo”, selection + Layers restored. Code applies with no named receipt; Undo belongs to topbar (Task 1.2). |
| Locked replace target · asset retained | 199:45018, 201:34124 | 2 | `src/editor/sidebar/tabs/media/components/PickModePanel.tsx:97` | missing | Target-became-locked refusal + “Choose new target” / target chooser that keeps the chosen asset — not in code. |
| Asset actions menu | 200:31384 | 1 | `src/editor/media/components/AssetDetailsPanel.tsx:615` | drift | Board More ▾: Optimize, Upload new version…, Replace across site…, Rename, Copy URL, Copy alt text, Download, Move to folder, Delete asset…. Code ⋯: Rename…, Replace across site…, Optimize, Delete…. |
| Image editor · save version | 200:31693 | 1 | `src/editor/media/ImageEditorModal.tsx:471` | drift | Board full-workspace editor: Crop & transform / Adjustments / Filters / Output (size, format, quality 10–100), Cancel · Save version. Code modal with Crop/Adjust/Resize/Optimise tabs; no Filters. |
| Image version · saving | 200:32049 | 1 | `src/editor/media/ImageEditorModal.tsx:471` | drift | Board “Saving… · Saving new version to Assets…” receipt; code button-only “Saving…”. |
| Assets Fonts · site vs personal | 200:32519 | 1 | `src/editor/media/components/SiteFontsModal.tsx:231`; `src/editor/media/LibraryManager.tsx:91` | drift | Board Fonts page inside Assets: Site fonts / My font files, “Remove from site”, “Read-only” for others’ fonts, “Upload font files”. Code: Fonts type tab + Site fonts modal (Added/Remove). |
| Text font · Manage site fonts origin | 200:32832 | 1 | `src/editor/inspector/sections/typography/FontPickerDropdown.tsx:321` | match | Picker foot row “Manage site fonts” exists (board “›” glyph only). |
| Manage site fonts · quick selection | 200:33295 | 1 | `src/editor/media/components/SiteFontsModal.tsx:229` | drift | Board small modal “Fonts available to this site … Manage in Assets › · Cancel · Use Inter”. Code opens the full Site fonts table modal; no Use <font> apply. |
| Fonts management · return to picker | 200:33697 | 1 | `src/editor/media/components/SiteFontsModal.tsx:229` | missing | “‹ Back to font selection” round-trip from Assets Fonts back to the exact Inspector picker not implemented. |
| Place asset · choose insertion target | 200:33875, 200:34170 | 2 | `src/editor/media/LibraryManager.tsx:279` | missing | Code “Insert to canvas” inserts immediately and closes; board asks for a parent/position first (“Choose on canvas”). |
| Inserted asset · new sibling selected | 200:34422 | 1 | `src/editor/media/LibraryManager.tsx:279` | drift | Insert exists; board receipt “Inserted Studio study in Selected work. Undo” with new sibling selected. Undo via topbar (Task 1.2). |
| Assets at 1280×640 · compact nav | 201:33532, 201:33823 | 2 | `src/editor/media/components/FolderTree.tsx:249` | drift | Board collapses nav to an “Assets navigation” button/drawer at 1280×640; code has only folder collapse, no compact nav mode. |


#### Top drifts (assets)
- Assets workspace layout: board keeps the shell (topbar/rail/bottom bar) with a resource-area nav and Details·Usage·Versions tabs; LibraryManager is an edge-to-edge portal titled “Asset library” with “‹ Back to canvas” (`src/editor/sidebar/FullPageRouter.tsx:139`, `media/LibraryManager.tsx:755`).
- Insert flow: board requires choosing a parent/position before placing (A27–A28); code inserts immediately (`media/LibraryManager.tsx:279`).
- Versions: inline version list + “Upload new version…” + “Use on N page placements…” vs VersionsModal/ApplyVersionModal; no version upload.
- Replace across site: board “Replace 2 images” with CMS explicitly excluded + locked-target refusal (A10, missing) vs per-placement checklist.
- Upload tiles: board forbids synthetic % and adds Cancel upload / Saving… / Remove file; code renders a % fill (`media/components/AssetGrid.tsx:721`).
- Receipts with Undo (A11/A13/A17/A29): one-undo decision means the board’s receipt Undo must call the shared composer history that the topbar owns (Task 1.2); asset delete grace is a server-side undo, separate from history.

#### Code-ahead (assets)
- Folder management (delete-folder with Move files…, drag-to-folder, nested folders) — `media/components/FolderTree.tsx`, `media/LibraryManager.tsx:360`; board only shows “+ New folder”. Keep under My folders.
- “Replace instead” on the delete confirm — `sidebar/tabs/media/components/ConfirmDeleteModal.tsx:48`; board delete has none. Keep as secondary in the delete dialog or drop (owner).
- Per-placement opt-out checklist in replace-across — `media/LibraryManager.tsx:329`; board is all-or-nothing. Lane decides; behaviour follows code unless owner rules.
- “N not on the server” local-only pill — `media/LibraryManager.tsx:1020`; belongs in the Assets status line beside “All assets saved”.
- Image editor Resize/Optimise tabs — `media/ImageEditorModal.tsx:68`; map into board “Output” section.
- Tags filter menu (“Tags ▾”) — `media/components/FolderTree.tsx:478`; board has “Any tag” filter in the toolbar.

## Components (B6-K*) — sidebar/tabs/ComponentsTab.tsx, component-library/


Paths are relative to `packages/editor/`. Every board carries the Shell topbar, rail and bottom bar. Those are phase1 and are not re-analysed here.

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| add-door | 215:43301 | 1 | src/editor/sidebar/tabs/build/components/GroupSection.tsx:522 | drift | Code reads "Manage components ›". The board door is "Components ›" over a "Saved components · This site" list |
| workspace-list (This site / This page) | 215:43588, 215:43978 | 2 | src/editor/sidebar/tabs/ComponentsTab.tsx:297 | drift | The board is a full workspace: left nav (This page / This site / Component library / Import package… / Recently deleted), search, Sort, + Create component, rows with source·version, uses and badges, plus a side detail pane. The code is one drill-in list (YOUR COMPONENTS / LINKED FROM LIBRARY) with a footer CTA. It has no page filter: page scope exists only at create time (CreateComponentModal.tsx:150) |
| library-not-on-site | 215:44300 | 1 | src/editor/sidebar/tabs/build/components/GroupSection.tsx:500; src/services/componentSync.ts:184 | drift | Library entries appear only under Add › FROM LIBRARY. There is no library view, no versions, no "Not on this site" label and no Restricted state |
| detail pane (inside K02/K03/K06–K09) | 215:43588 | — | src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:280 | drift | Code is a drill-in titled "Master component · X" with stacked Insert / Update / Detach all / Duplicate / Delete buttons. The board has a right pane with "Used in N places ›", "Structure ›", Insert, Update from selection…, More actions ⋯ |
| library-update-review | 215:44647, 215:45056 | 2 | — (engine version is a local counter, src/engine/components/ComponentManager.ts:399) | missing | No versioned library, no v4→v5 review, no override choices, no applied receipt |
| library-local-changes | 215:45456, 215:45851 | 2 | — | missing | No "Local changes" badge, no Share update as vN, no Keep as this site's copy. The Editor-role disabled variant (K08) does not inherit |
| create-dialog | 215:46247 | 1 | src/editor/shell/modals/CreateComponentModal.tsx:116 | drift | Code has a Scope Select (This site / This page). The board has radios ("Reusable on every site in this workspace" / "Only on Home"), a capacity line "84 of 100", and a "Create and share component" CTA |
| create-dialog-dup-name | 215:46667 | 1 | — | missing | No non-blocking duplicate-name warning |
| create-dialog-capacity | 215:47088 | 1 | — | missing | No 100-per-site limit and no at-capacity copy |
| update-from-selection | 217:40171 | 1 | src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:340, :455 | drift | Code needs an element already selected, then shows a ConfirmDialog. The board has a review subview with "Choose on canvas" |
| update-pick-on-canvas | 217:40475, 217:40648 | 2 | — | missing | No canvas source-pick mode (instruction banner, Cancel, Return to component review) |
| update-review-impact | 217:40825 | 1 | src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:458, :202 | drift | Before applying, the board shows instances affected, overrides kept, and the overrides that no longer apply. Code reports dropped overrides only afterwards, in a warning toast |
| operation-receipt (update) | 217:41149 | 1 | src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:189 | drift | The toast with Undo exists; its Undo is a receipt, so the one-undo rule is OK. Copy differs: code says "X updated · N linked instances updated"; the board says "Hero card updated from Section 3 on Home · 12 instances" |
| detach-all | 217:41451 | 1 | src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:470; src/editor/sidebar/tabs/ComponentsTab.tsx:310 | drift | Board: no dialog, receipt with Undo. Code: confirm dialog first, then a list notice with no Undo |
| delete-receipt | 217:42047 | 1 | src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:81, :65 | drift | Code shows a confirm saying "permanently deleted", then a toast with Undo. The board has a receipt with Undo and a "Recently deleted ›" link, and a "Recently deleted · 3" nav count |
| recently-deleted (+ purge, restore) | 217:41750, 217:42370, 228:46627 | 3 | — | missing | No component trash, no 30-day retention, no bulk Restore/Delete permanently, no typed DELETE (Admin), no re-link receipt |
| used-on-locate | 217:42594 | 1 | src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:400 | drift | Code's USED ON has one row per page and locates the first instance only. The board has one row per instance, each with "Locate ›", and keeps the list on Back |
| layers-instance-menu | 217:42918 | 1 | src/editor/panels/layers/LayerTreeItem.tsx:319; src/editor/inspector/sections/ComponentRow.tsx:131, :158 | drift | Layers shows only the ◇ badge. The board's instance menu ("Go to main component ›", "Detach instance") is in Layers; code's equivalents are Inspector "Edit master" / "Detach instance…" |
| offline | 217:43115 | 1 | src/services/componentSync.ts:190 | missing | No offline state. A failed library read silently returns [] |
| library-load-failed | 217:43415 | 1 | src/editor/sidebar/tabs/ComponentsTab.tsx:126; src/services/componentSync.ts:190 | drift | The only error state covers the whole list. A library-only failure is silent, and the board's Retry (with own components still available) is absent |
| empty-this-page | 217:43651 | 1 | src/editor/sidebar/tabs/ComponentsTab.tsx:195 | drift | The site-wide empty state reads "No components yet.". There is no per-page empty state, and board copy differs |
| long-name-tooltip | 217:43947 | 1 | src/editor/sidebar/tabs/ComponentsTab.tsx:269 | drift | Rows truncate but there is no full-name tooltip |
| narrow-1280 | 217:44243 | 1 | — | missing | No Components nav exists to collapse. The topbar part is phase1 |
| export-package | 220:42592, 220:42920, 220:43248 | 3 | — | missing | No .brcomponent export, no included-dependencies summary, no inaccessible-asset block, no download receipt |
| import-package wizard + outcomes | 220:43545, 220:45240, 220:45883 | 9 | — | missing | Six-step import (file, roots, check, map, review, import) and its progress, outcome-unknown receipt check, receipt with Undo import, and insert-failed retry. Nothing exists |
| opened-from-origin | 228:46016 | 1 | src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:282; src/editor/sidebar/tabs/component-library/useComponentsState.ts:196 | drift | Code's origin back row reads "Back to instance" (opened from Inspector Edit master). The board reads "‹ Back to Layers · Hero card" |
| row-menu | 228:46316 | 1 | src/editor/sidebar/tabs/ComponentsTab.tsx:255; src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:300-370 | drift | Rows have no ⋯ menu. Rename, Duplicate and Delete are detail-screen controls, and Export does not exist |


#### Top drifts (components)
- Workspace structure: the board's nav + search/sort + side detail pane vs code's single drill-in list (ComponentsTab.tsx:297, ComponentDetailScreen.tsx:280). Most of the other K boards depend on this.
- Create dialog: workspace/page radios, capacity line, duplicate warning, "Create and share" vs code's Scope select (CreateComponentModal.tsx:116).
- Update from selection: the board picks the source on canvas and reviews impact before applying. Code needs a pre-selection, then a ConfirmDialog, and reports override loss afterwards (ComponentDetailScreen.tsx:340/455/202).
- Detach all and Delete: the board uses a receipt with Undo and no dialog, and Delete goes to Recently deleted. Code uses confirm dialogs and deletes permanently (ComponentDetailScreen.tsx:470, :65).
- Used on: one row per instance with exact Locate on the board, vs one row per page / first instance in code (ComponentDetailScreen.tsx:400).
- Layers instance menu: the board's "Go to main component / Detach" sit in the Inspector ComponentRow, not in Layers.

#### Code-ahead (components)
- Drag a saved-component row onto the canvas (ComponentsTab.tsx:255, `draggable`). The board does not show it. Keep it on list rows.
- "Components not available" storage-access guard (ComponentsTab.tsx:96). There is no board. Keep it as an error state of the list.
- Inspector "Reset to master" (ComponentRow.tsx:6). The K22 Layers menu lacks it. It belongs in the Inspector instance row, or in the Layers instance menu if that gets built.
- Master preview thumbnail and inline STRUCTURE list (ComponentDetailScreen.tsx:375-395). The board collapses these to "Structure ›". Move them behind that link.
- Overrides-lost warning toast (ComponentDetailScreen.tsx:202). The board moves this information before apply (K15). Keep the toast as a fallback for the post-apply count.

## Templates (B6-T*) — sidebar/tabs/templates/


| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| Templates catalogue · Creating page | 222:43842, 251:75655 | 2 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:454,516` | drift | Board: header “Templates · <site>”, “‹ Back to Pages”, Show filter (All/Built-in/Saved counts, Recent), search, ⋯, inline “Creating “About” · added to navigation · URL /about · Change ›”, cards with section counts. Code: side list of template names, “Page templates”, “‹ Back to canvas”, no search/filter, create asks via confirm modal. |
| Creating · name already used | 222:44210 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:155` | missing | Inline Page name editor with “already exists” validation + Add to navigation toggle not in code (confirm modal names the page only). |
| Template preview · Create page | 222:44591 | 1 | `src/editor/sidebar/tabs/templates/TemplatePreview.tsx:85,146` | drift | Board subtitle “Has its own colors and fonts — your Brand is not changed”, “Replace page…” + primary “Create page”, Desktop/Tablet/Mobile. Code subtitle “Page template · Own colours and typography”, plus Used-on list. |
| Template preview · Pro on Free | 222:44984 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:156` | drift | Board: Pro badge, “Upgrade to use” CTA in place + explanatory note. Code: click opens Upgrade modal (openUpgrade). |
| Template preview · Pro in trial | 222:45381 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:156` | missing | “Pro · included in your trial” — 30-day Pro trial (SC-20) not in code; plan tier only starter vs paid. |
| Create page · staged progress | 222:45775 | 1 | `src/editor/sidebar/tabs/templates/ApplyProgressOverlay.tsx:72`; `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:229` | drift | Board “Creating About from SaaS landing · Stage 2 of 4 · Preparing page / Importing sections / Applying styles / Adding to navigation · Cancel (only before import)”. Code stages: Resolving brand tokens / Importing template HTML / Rendering on canvas / Saving applied state. |
| Create page · taking longer | 222:46181 | 1 | `src/editor/sidebar/tabs/templates/ApplyProgressOverlay.tsx:72` | missing | No slow-path “Taking longer than usual… Keep waiting” state. |
| Page created · receipt | 222:46586 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:195` | drift | Board toast “About created from SaaS landing · Page settings · Connect to Brand colors ›” (Undo gated on T-4). Code “Page created” modal with Open page settings. |
| Partial import report | 222:46761, 251:75291, 251:75461 | 3 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:333` | missing | “About created, with 2 parts left out · Undo · Keep”, omitted-content toast, undo-creation progress and done receipt — no import report or create-undo operation in code (needs T-1/T-4). |
| Create page failed | 222:47163 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:239` | drift | Board “Couldn’t create the page · Nothing was changed. No empty page was left behind. · Close · Try again”. Code body “…failed to load. Your pages are unchanged.” |
| Replacing Home · catalogue | 222:47567 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:523` | drift | Board bar “Replacing Home · a backup is saved first · Cancel”, card “Use for Home”. Code banner “Replacing: Home · your current layout is backed up first”; Use for label matches. |
| Replace Home · confirm | 223:44891 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:91,120` | drift | Board “Replace Home with SaaS landing? Home’s 34 elements are removed…”, checkbox “Save a backup first (History › Saves)”, CTA “Replace Home”. Code CTA “Replace page”, checkbox copy longer. |
| Backup failed | 223:45184 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx:275` | drift | Actions match (Cancel / Replace without a backup / Try the backup again). Title “Couldn’t save a backup of Home” vs “Home backup could not be saved”; body differs. |
| Replace target changed | 223:45479 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:523` | missing | No detection that the target page was renamed/removed (“Choose a page to replace · Choose page ▾ · Choose a page first”). |
| Saved filter · card menu | 223:45775 | 1 | `src/editor/sidebar/tabs/templates/components/TemplateCard.tsx:81` | missing | Saved filter + card ⋯ (Rename / Delete) not in code; card only badges Saved/Built-in. |
| Saved template deleted · receipt | 223:46043 | 1 | `src/editor/sidebar/tabs/templates/components/TemplateCard.tsx:81` | missing | No delete for saved templates, no “Recently deleted ›” receipt. |
| Save page as template | 223:46314 | 1 | `src/templates/SaveTemplate.tsx:48` | drift | Board “Save About as a template”, note “appear under Templates › Saved for everyone on this site”, Name/Description, “Components … saved as plain elements”, “Save template”. Code “Save page as template”, “Template Name”, “Description (optional)”. |
| Templates offline | 223:46516 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:156` | missing | No offline gate/note on Create/Replace. |
| Viewer · actions disabled | 223:46702 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:153` | drift | Board: CTAs disabled with inline reason (“need Editor access”). Code: enabled CTAs, toast “Only an admin can apply a template”. Behaviour (ADMIN) follows code contract; visual disabled+reason follows board. |
| Role unknown · checking access | 223:46886 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:153` | missing | “Checking your access…” pending state not modelled (unknown role treated as allowed). |
| No templates match | 223:47068 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:531` | missing | Search not implemented (“no search yet”, TemplatesTab.tsx:8), so no no-match state. |
| Saved filter empty | 223:47331 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:531` | missing | No Saved filter, no “No saved templates yet” empty state. |
| Templates at 1280×640 | 223:47597 | 1 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:454` | missing | Compact layout with “Show: All ▾” header filter not in code. |
| Templates Recently deleted | 251:73352, 251:73542, 251:73732 | 10 | `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:454` | missing | Saved-template recovery list, restore pending/success/failure, offline, empty, typed-confirm permanent delete and its pending/ack — no server soft-delete for templates in code (services/templateSync.ts mirrors saves only). |


#### Top drifts (templates)
- Catalogue structure: board Show filter (All/Built-in/Saved/Recent), search, header “Templates · <site>”, “‹ Back to Pages”, inline “Creating “About” · … · Change ›”; code is a sidebar list of template names with no search (`sidebar/tabs/templates/TemplatesTab.tsx:454`).
- Saved-template lifecycle missing end to end: card ⋯ Rename/Delete, Recently deleted, restore, typed permanent delete (T15–T16, T24–T33 — 12 boards). Needs server soft-delete (`src/services/templateSync.ts` mirrors saves only).
- Create flow: inline page-name editor (T02), staged progress copy (T06), slow path (T07), toast receipt instead of “Page created” modal (T08), import report/partial undo (T09, T34–T35; board itself flags T-1/T-4 engineering).
- Pro gating: inline “Upgrade to use” vs upgrade modal (T04); trial state (T05) absent — owner SC-20 trial not in code.
- Permission/offline states: disabled+reason (T19), checking access (T20), offline (T18) — code only toasts for non-admins.
- Replace copy: banner, confirm CTA “Replace Home”, backup checkbox, backup-failed title (T11–T13) all small copy drifts on working code.

#### Code-ahead (templates)
- “⟳ Reload catalogue” — `sidebar/tabs/templates/TemplatesTab.tsx:489`; board has none. Could live in the header ⋯ menu.
- “APPLIED” card badge — `sidebar/tabs/templates/components/TemplateCard.tsx:72`; board shows “Recent” filter instead. Fold into Recent or drop (owner).
- Preview “Used on” page list with open-page links — `sidebar/tabs/templates/TemplatePreview.tsx` (usedOn prop); board preview lacks it. Keep under preview subtitle.
- Role threshold ADMIN for apply (`TemplatesTab.tsx:153`) vs board “Editor access” copy: behaviour follows code; copy should name the real role.

## Resources — guards, pending saves, cross-resource publish tray, current-release nav, handoffs

| archetype | example nodeIds (≤3) | count | code surface (file:line) | status | notes |
|---|---|---|---|---|---|
| sources-json-leave-guard | 166:3723, 166:3952, 168:23180 | 6 | `sidebar/tabs/content/DataRowDialogs.tsx:159` (add-only JSON dialog) | blocked:bd39-sources-flag-off | Stored-JSON Sources are future capability per RL00/BD-39. Code has no Sources leave guard and no inline "Replace data…" editor. |
| record-leave-guard | 168:21408, 168:21848, 168:22734 | 4 | `cms/RecordSheet.tsx:725` | drift | Code title "Discard record changes?" with Discard and leave / Keep editing. Board: "Leave without saving?", names the destination ("before opening Fields"), and adds **Save and leave**. |
| record-save-then-leave-pending | 168:21620, 168:22061, 168:22949 | 4 | `cms/RecordSheet.tsx:206` | missing | No save-then-navigate path: the guard either discards or stays. Board shows Saving… then leaves for the chosen tab or the editor. |
| return-to-editor-home | 259:89873 | 1 | `cms/CmsWorkspace.tsx:172` | drift | phase1 (editor shell). CMS exit reads "‹ Back to canvas"; board "‹ Back to Editor · Home". |
| cms-recovered-copy-outcome | 271:256007, 271:256179, 271:256513 | 4 | none (`server/services/cms.service.ts:315-318` soft-deletes only) | missing | No restore and no restore-as-new-record in the server or the UI. Needs the full tRPC→service chain plus a CMS Recently deleted pane (see cms-a R-series). CM03 is the error variant, CM04 the unknown variant. |
| publish-tray-{ready,confirm,pending,success,failed,unknown,working} | 271:257949, 271:258375, 271:258960 | 35 | `sidebar/tabs/publish/PublishTab.tsx:728`, `:555` | drift | phase1 (Task 1.7). Same tray drawn over CMS/Assets/Brand/Components/Templates (5 × 7 states). Code: "Publishing to production…"; board: "Publishing to <domain>…" + "Step n of 5", Live release / What will change / Approval / Goes to rows, "Keep working". |
| topbar-retained-publish-state | 279:66718, 279:66897, 279:67077 | 10 | none | missing | phase1 (Task 1.7). The topbar swaps Publish for **Check publish** while a job is unknown or just published. No such label in code. |
| cms-drawer-current-release (RL01) | 424:337006 | 1 | `sidebar/tabs/content/ContentViews.tsx:268` | drift | Code still shows the **Sources** row (BD-39 hides it). "Variables" vs "Site variables" (:269). No Recently deleted row and no "‹ Back to Editor · Home" row in the drawer. |
| site-variables-current-release (RL02) | 424:337452 | 1 | `sidebar/tabs/content/ContentViews.tsx:461` | drift | Header "Variables" vs "Site variables". No per-variable "N text placeholders" usage line. Intro copy differs. |
| conditions-readonly-index (RL03) | 424:337627 | 1 | `sidebar/tabs/content/ContentViews.tsx:651` | drift | Code edits path/operator/value inline. Board: read-only index ("Edit conditions on their selected element in the Inspector"), Active/legacy state, Locate. |
| handoff-annotation | 199:45286, 271:266543, 424:337803 | 9 | — | blocked:annotation-only | Spec text only: B6 Assets/Brand/Components/Templates handoffs, template recovery, GAP-CM fixtures, GAP-PB simulated outcomes, RL00 BD-39 overrides. RL00 is binding: Sources hidden, Conditions index is read-only, legacy JSON values retained. |


#### Top drifts (resources)
- The BD-39 current-release nav is not applied. Sources is still a live drawer row (`ContentViews.tsx:268`) and Conditions is an inline editor, not a read-only index (`:651`).
- The record leave guard has no **Save and leave** and does not name the destination (`RecordSheet.tsx:725`). Its 4 pending boards have no code path.
- CMS recovery (restore and restore-as-copy) does not exist on the server. Every GAP-CM board is missing.
- The publish tray copy and states are phase1 (Task 1.7), drawn over five resource areas. The topbar "Check publish" retained state is missing.

#### Code-ahead (resources)
- None in this family. The Sources editor in code (`ContentViews.tsx:303` SourcesView, `DataRowDialogs.tsx`) has a live entry point that the boards keep behind BD-39. Treat it as hide-behind-flag work for the CMS lane, not code-ahead.

## Top drifts (whole page, ≤10)

1. **Resource-area shell.** Every resource board keeps the topbar, rail and bottom bar and shows a persistent "‹ Back to Editor · Home". In code, CMS, Assets and Brand each have their own exit ("‹ Back to canvas", `cms/CmsWorkspace.tsx:172`, `design-system/ui/BrandWorkspace.tsx:965`), and Assets opens as a full-screen "Asset library" portal (`media/LibraryManager.tsx:755`).
2. **CMS IA.** The boards show four visible tabs (Records · Fields · Dynamic pages · Collection settings) and a drawer with Site variables and Recently deleted, with Sources hidden by BD-39. The code has two tabs plus a ⋯ menu (`cms/CmsWorkspace.tsx:64`), a drawer row labelled "Variables", and a Sources row that is still live (`sidebar/tabs/content/ContentViews.tsx:268`).
3. **Recovery is missing for every resource.** CMS restore (34 R rows plus GAP-CM; the server only soft-deletes, `server/services/cms.service.ts:315`), Recently deleted for components and saved templates, and typed permanent delete.
4. **Leave guards.** The CMS record guard has no **Save and leave** and does not name the destination (`cms/RecordSheet.tsx:725`). Brand has no guard at all because it autosaves (`BrandWorkspace.tsx:34`).
5. **CMS binding ownership.** The boards put binding in the Inspector's Content tab ("Dynamic bindings"). The code keeps it in Behaviour › CMS binding (`inspector/sections/CmsBindingSection.tsx:277`). Conditions are edited in the CMS drawer (`ContentViews.tsx:651`), but the board makes that view a read-only index.
6. **Destructive CMS field operations have no impact preview.** Type change, Required and field delete commit immediately. Add field offers 10 of the 16 schema types (`cms/fieldTypes.ts:17` vs `packages/shared/schemas/cms.ts:20`).
7. **Brand applies on click where the boards show a preview first.** Starters, Auto dark mode and URL discard all apply immediately; the boards draw restore point → preview → Apply. The Brand nav is flat; the boards group it as Tokens / Reusable styles / Tools.
8. **Components workspace.** The boards show nav, search, sort and a side detail pane; the code is a single drill-in list (`sidebar/tabs/ComponentsTab.tsx:297`). Versioned updates, share, import and export packages, and update-from-selection review are absent.
9. **Publish tray over resource areas (35 rows) and the topbar "Check publish" retained state (10 rows).** These are phase1 work under Task 1.7.
10. **Behaviour gap.** The canvas collection list renders draft records (`RepeaterRenderer.ts:155`). The board renders published records only, with Show drafts as a view preference.

## Decisions the lead or owner must make

- **Undo on receipts.** Receipt toasts with their own Undo button appear in Brand (B10/B20/B37/B40/B49), Assets (A11/A13/A17/A29), Templates (T08) and Components (K16/K17). These rows are marked drift pending a ruling against the one-undo rule (topbar only, Task 1.2).
- **Collection and field delete while in use.** The board blocks it (K22/K23, F32); the code unbinds the elements and then deletes (`cms/CollectionSettingsPane.tsx:34`). Code precedence applies until the owner rules.
- **Brand "From logo or URL" (B32–B38).** The extraction is rule-based, not AI, and PR #33 keeps it, but the code gates it on the `dsAi` flag (`BrandWorkspace.tsx:756`). The board draws it ungated.
- **`✦ Generate with AI` / AIPromptModal in Brand.** This is code-ahead with no board, and PR #33 deletes it, so it should be treated as `blocked:pr33-ai-removal`.
- **Sources.** The Sources drawer row should be hidden behind a flag in this release (RL00); the code shows it unconditionally.
