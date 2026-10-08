# 04 · CMS — UX / IA audit (2026-09-27)

23 findings, 7 P1. The drawer, workspace, record sheet and Inspector binding are mostly the right surfaces; the mess is
in the seams between them. Test collection "Audit CMS test" (3 records) and the inserted Collection list were deleted;
Home heading unbound and restored. After reload only "Products · 3" remains (never written to).

## 1. Module map

| Surface | Shape | Code |
|---|---|---|
| Rail "CMS" (key D) | Rail tab `content`; comment at `tabsConfig.ts:227-230` still says "Off-rail" (stale) | `rail/tabsConfig.ts:226-243` |
| Drawer | Collections list + "+ New collection"; Data › Sources / Variables / Conditions | `sidebar/tabs/content/ContentTab.tsx`, `ContentViews.tsx`, `useContentPanel.ts` |
| Workspace | Replaces canvas area, hides Inspector. Tabs Records · Fields · ⋯ (Dynamic pages, Settings, Import CSV/JSON) | `cms/CmsWorkspace.tsx`, `cmsWorkspaceStore.ts` |
| Field inspector, record sheet | Right column; sheet covers the table | `cms/FieldInspector.tsx`, `cms/RecordSheet.tsx` |
| Modals | New collection, Add field, Delete field / typed-DELETE | `shell/modals/CMSCollectionSetupModal.tsx`, `cms/AddFieldDialog.tsx`, `cms/DeleteFieldDialog.tsx`, `cms/TypedDeleteDialog.tsx` |
| In Inspector | Settings › Content (Static / From CMS), separate "bound to" banner, Collection list › Source | `inspector/sections/ContentSection.tsx`, `inspector/components/BindingBanner.tsx`, `inspector/sections/CollectionListSection.tsx` |
| In Add, Pages, ⌘K, context menu | Collection list block; "+N from collections ›"; "Open CMS" + "Manage CMS records" + record results; "Bind to CMS field…" | `catalog.ts:42-51`, `PagesTab.tsx:89-97`, `CommandPalette.tsx:450-470`, `useEditorEventListeners.ts:100-108` |
| Server | Fields + record data as untyped JSON; only collection slugs unique | `server/services/cms.service.ts`, `packages/shared/schemas/cms.ts:3-17` |

## 2. Scorecard (1–5 as reported; ×2 ≈ /10)

| Lens | Score | Note |
|---|---|---|
| Cohesion | 3 | Conditions are element rules parked in CMS |
| Misfit | 2 | |
| Duplicate doors | 2 | two "New collection" doors, two field forms, two tab rows, two binding UIs, two ⌘K rows |
| Scope leakage | 3 | |
| Discoverability | 2 | |
| Information scent | 2 | CMS / Content / record / entry / item / row all in use |
| Bloat | 3 | |
| Surface | 3 | |
| Navigation | 3 | |
| Collaboration | n/a | |
| Cognitive load | 2 | |

## 3. Findings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| CMS-01 | P1 | **Blank records pile up.** A failed publish-save creates a draft first, then publish throws; sheet keeps its "new" id, so each "Retry save" adds another blank record (seen 1 → 2 → 3). | `useContentPanel.ts:218-223`; `CmsWorkspace.tsx:343-345`; `CollectionManager.ts:327-341`; shots 16, 18 |
| CMS-02 | P1 | **"Generate a page per entry" broken on arrival.** Setup modal saves pattern `/<name>/{slug}` but creates only `title`; Dynamic pages says pattern can't be saved. | `CMSCollectionSetupModal.tsx:141,179,229-231`; shot 09 |
| CMS-03 | P1 | **Two field-creation paths disagree.** Setup modal: 5 types, `_` keys, no format/duplicate check (created two `title` fields). "+ Add field": 9 types, `KEY_RE`, clash dialog. | `CMSCollectionSetupModal.tsx:32,50,219-226` vs `AddFieldDialog.tsx:30-31,62-74`; shot 06 |
| CMS-04 | P1 | **Bound element shows an implicit, arbitrary record** ("first published"); nothing marks a page as a collection template. | `ContentSection.tsx:1-12,93`; shot 26 |
| CMS-05 | P1 | **List children bind only through raw `{{item.key}}`**; image slot can't be bound; Inspector "From CMS" on a list child binds to first record, not the list item. | `CMSBindingManager.ts:62,80-82,277-309`; shots 31, 33 |
| CMS-06 | P1 | **Collection delete unguarded** — warns only about records; bindings orphaned; banner shows raw id; "Unbind" leaves old value as static text. | `CollectionSettingsPane.tsx:46-48,63-69`; shots 41, 43 |
| CMS-07 | P1 | **Duplicate record slugs accepted** client + server. Only Dynamic pages warns (wrong advice), Save stays enabled; at publish both records write the same page. | `DynamicPagesPane.tsx:57-58,125-126,178`; `cms.service.ts:147-166,497-510`; shot 21 |
| CMS-08 | P2 | "Used by" not navigable; "Open the binding" links only first use and lands in Layers. | `FieldsTable.tsx:80-82`; `DeleteFieldDialog.tsx:43,87-90`; `CmsWorkspace.tsx:174-179`; shot 30 |
| CMS-09 | P2 | "Slug" isn't a real field type; nothing validates it; offered Min/Max length never enforced. | `fieldTypes.ts:9`; `shared/types/cms.ts:7-22,174-253` |
| CMS-10 | P2 | Unbind bakes the field value into the element as static text. | `BindingBanner.tsx:80-90`; shot 44 |
| CMS-11 | P2 | Record sheet covers the table and repeats the tab row; help/AI floating button overlaps "Save record" (hit-test). | `RecordSheet.tsx:360,424-425`; shot 16 |
| CMS-12 | P2 | Dynamic pages + Settings behind an unlabeled ⋯. | `CmsWorkspace.tsx:56-59,257-301`; shot 08 |
| CMS-13 | P2 | Vocabulary drift + false copy: "Edit the record in Content"; "Generated pages open … under Pages" (they don't); setup modal shows step chips for a wizard that no longer exists. | `BindingBanner.tsx:90`; `CmsWorkspace.tsx:229`; `CMSCollectionSetupModal.tsx:296` |
| CMS-14 | P2 | Conditions only in CMS › Data; Sources are paste-JSON, lost on reload. | `useContentPanel.ts:104-121`; `DataManager.ts:60-73` |
| CMS-15 | P2 | Redundant doors: two "+ New collection" on one screen; ⌘K "Manage CMS records" duplicates "Open CMS"; banner duplicates Content section. | `useEditorEventListeners.ts:100-108`; shot 39 |
| CMS-16 | P2 | ⌘K labels records by first text value (here the slug); "Alpha" (a title) found nothing. Setup modal never sets a display field (disables slug auto-fill). | `CommandPalette.tsx:459-462`; `RecordSheet.tsx:231-241`; shot 38 |
| CMS-17 | P2 | Canvas shows draft records in lists; publish doesn't. | `RepeaterRenderer.ts:102-105`; shot 33 |
| CMS-18 | P2 | Inserting a Collection list opens Style tab and shows raw `{{item.name}}`; binding is on Settings. | `elementProfiles.ts:290-293`; shot 31 |
| CMS-19 | P2 | Field picker not filtered by element type (heading offered Number, Image); meaningless "Default" collection option. | `ContentSection.tsx:125-141`; `InputControls.tsx:377` |
| CMS-20 | P2 | Changing an unbound field's type: no confirm, no data conversion. | `FieldInspector.tsx:150-157`; `CollectionManager.ts:218-250` |
| CMS-21 | P2 | Workspace root is a blank grey pane; first open briefly "0 collections" while drawer said "Products 3". | `CmsWorkspace.tsx:79,121-149`; shots 02, 02b |
| CMS-22 | P2 | React key warning in `RecordsTable.tsx:134-155`; rail accessible name collides with "Records" tab. | `rail/tabsConfig.ts:237` |
| CMS-23 | P2 | Pages "+2 from collections" counts a collection with no template page; link opens only one collection. | shot 37 |

## 4. Flow map

| Task | Steps | Breaks at |
|---|---|---|
| (a) Create a collection | 5, +2 per extra field · 3 surfaces | CMS-02, CMS-03 |
| (b) Add a field | 5 per field, +2 for validation rules | CMS-09, CMS-20 |
| (c) Add a record | 4 + inputs | CMS-01, CMS-07, CMS-11; number defaults to 0 so "required" number can't be empty |
| (d1) Bind an element | 5 | CMS-04, CMS-19 |
| (d2) Collection list | 4 | CMS-05, CMS-17, CMS-18 |
| (e) Template page | 7 + 5 per bound element · 5 surfaces · 3 modules · no feedback until publish | |
| (f1) Rename a field in use | 3 — works (key + type locked) | |
| (f2) Delete a field in use | ~12 across 5 surfaces | |
| (f3) Delete a collection in use | 5 — no guard | CMS-06 |
| (g) Find where a field is used | 2 — dead end | CMS-08 |

## 5. Validation matrix

All rules are browser-only, if any. Server stores fields and record data as untyped JSON.

| Rule | Where enforced | Result |
|---|---|---|
| Field key format + uniqueness | Add field + field inspector; **not** setup modal | two `title` fields created |
| Required fields | only at publish, client-side; server accepts anything | error shows but blank draft created (CMS-01) |
| Slug length / format | offered in UI, never enforced | — |
| Record slug uniqueness | nowhere | duplicates accepted (CMS-07) |
| Collection name clash | modal; collection slugs unique on server | ✓ |
| URL pattern names real fields; template page exists | Dynamic pages pane | ✓ |
| Collection delete with bindings | none | orphaned (CMS-06) |
| CSV import | stores every value as string, creates drafts | — |

## 6. Simple target flow (Webflow / Framer model: collection → fields → items → bind)

1. One field-creation path; every collection gets name + slug fields and a display field.
2. Clickable "Used by": each row names the page and jumps to the element with Inspector › Content focused.
3. Record sheet that doesn't hide the table; saves once, then publishes the same record.
4. One binding picker: current item inside a list (images included); "this page's record" on a template page; "which record?" elsewhere.
5. Template page as a page type in Pages: badge, read-only list of generated routes, record-preview dropdown.
6. Symmetric deletes: collection delete locks on bindings like field delete; unbind restores original text.
7. Server-side checks: required on publish, unique field keys, unique record slugs.

Target: 4 steps each for (a)–(d), ~5 for (f2), 2 with click-through for (g).

## 7. Prior-audit reconciliation

| Prior | Now |
|---|---|
| A01-5 site variables browser-only | PARTLY FIXED — saved with project; site source registers only when CMS panel mounts; Sources memory-only |
| A01-13 / FC-1 dynamic pages invisible in Pages | PARTLY FIXED (CMS-23) |
| A03-6 / A04-11 hidden records modal | FIXED; redundant ⌘K row remains |
| A04-10 / B-1 unsaved record lost | FIXED |
| A09-8 empty state hides Data doors | FIXED in code; not seen live |
| A15-7 template path; two binding models | path FIXED; two models STILL TRUE |
| FB-5 Bind to CMS wrong surface | FIXED (shot 24) |
| 92 #25 RecordsTable crash | FIXED; key warning remains |
| PD-20 record search | STILL OPEN |
| FC-7 three takeover shapes | STILL TRUE |
| C-4 server guard | not re-verified |

## 8. Not verified
Publish (generated pages, duplicate-slug overwrite, drafts excluded — code only); collaboration; name-clash dialog;
empty-CMS state; CSV/JSON import; record image picker; record delete/preview; `{{site.*}}` without opening CMS;
Sources after reload; "Open the binding" across pages; four HTTP 500s on first CMS open (shared server, unattributed);
keyboard/screen reader.
