# Panel 07 — CMS area: functionality specification (FD-PNL-07)

**Current release override — BD-39 (2026-10-21):** CMS Sources management and stored-JSON source-picker entries are hidden behind the disabled feature flag. Site variables and Conditions retain their owners. This supersedes Q12 shipment/persistence language below. Preserve existing authored data and legacy bindings; hiding UI is not a migration or deletion. Sources screens remain future design references, not shipping evidence.


Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by field tombstone + collection undelete + conflict rebase (S6); Sources deferred behind a disabled release flag (BD-39) · not VERIFIED** *(R-1018: conflict rebase added; R-1018b: Source persistence added)* (independent `design-qa-critic` review: pass 1 PROPOSAL with 4 blocking, pass 2 one contradiction fixed — exact Restore recorded as IAF-07 amendment). Runtime NOT RUN; geometry NOT MEASURED. *(DS)* = designer-selected under owner standing instruction "apply recommended answers" (2026-10-17). Product-design review 2026-10-17: **Panel 00 SC-11…SC-19 and the *(R-1017)* amendments override this panel where they differ** (`REVIEW-2026-10-17-pro-product-design.md`).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2, S3, S6, P1, P10, P11, N5, V1, V2, V6; gap rows D2-1, D2-9, D2-10, D2-20, D2-22, D2-25, D2-31, T1-28, T4-11, T4-16, T4-17, T4-18, T5-17 (copy), INV B4/B5/B18 🐞; CS-11, CS-12, CS-13, CS-14, CS-15; F-PB-Y12, F-PB-Y26. "workspace" → "area" and US spelling throughout (SC-11) *(R-1018)*. Round 2: Q12 (CMS › Data › Sources were planned to ship under Q12; superseded by BD-39 — §10.1; T4-12 closed) *(R-1018b)*.
Governing IA: BD-01 (CMS visible in rail), BD-22 / FD-DYN-01 (bindings, Create collection page, Dynamic pages, Show drafts), IA-01 (CMS → Records / Fields / Dynamic pages / Collection settings + CMS → Data), GEO-01 (resource nav 240/200/280; detail 320; record subview 720–960; ≤1280 nav collapses to "CMS navigation"), IAF-07, IAF-08, Panel 02 (rail, returns §6.1), Panel 06 (Inspector overlay). Memory note: flagged/planned features stay visible as Planned, not deleted. *(renamed 2026-10-17 — SC-11 "Collection page")*

---

## 1. Purpose and boundary

The CMS area is where **content lives**: define collections and fields, write and publish records, and set how a collection becomes pages. Designing how content looks happens on the canvas (bindings, lists, templates).

Job: **S supporting** — manage content at scale (00-STRATEGY §3); serves J3 Publish and maintain (the client updates content without breaking the design). *(R-1018, D2-1)*

| In CMS | Not in CMS (owner) |
|---|---|
| Collections, fields (schema), records (draft/published), CSV/JSON import, dynamic-page settings (template, URL pattern, SEO/og:image patterns), collection settings/delete, CMS → Data (Sources, Site variables, Conditions index) | Element bindings, conditions, Collection list presentation → **Inspector** (FD-DYN-01, Panel 06) · template page design → **Editor canvas** · assets → **Assets** (picked contextually) |

## 2. Current implementation (source-read 2026-10-16/17; runtime NOT RUN)

Files: `src/editor/cms/CmsWorkspace.tsx`, `RecordsTable.tsx`, `RecordSheet.tsx`, `FieldsTable.tsx`, `FieldInspector.tsx`, `AddFieldDialog.tsx`, `fieldTypes.ts`, `DynamicPagesPane.tsx`, `CollectionSettingsPane.tsx`, `CsvImportDialog.tsx`, `ReferenceField.tsx`, `RecordPreview.tsx`, `RecordTemplatePreviewDialog.tsx`, `TypedDeleteDialog.tsx`, `DeleteFieldDialog.tsx`, `cmsWorkspaceStore.ts`; `sidebar/tabs/content/ContentViews.tsx` (left drawer: Collections + Data); `shell/modals/CMSCollectionSetupModal.tsx`; server `server/trpc/routers/cms.ts`, `server/services/cms.service.ts`.

| ID | Capability | Today |
|---|---|---|
| CM-01 | Entry | Rail CMS opens left drawer (Collections, + New collection, Data: Sources / Variables / Conditions) **and** the area over the canvas column (`StudioPanels.tsx:921-931`); "‹ Back to canvas" when opened from an element |
| CM-02 | Root | "CMS · {site}" + counts + "+ New collection"; hint "Create your first collection" / "Select a collection" |
| CM-03 | Collection header | 56h: name, count, primary per tab ("+ Add record" / "+ Add field"); tabs **Records, Fields** only; ⋯: Dynamic pages, Settings, Import CSV…, Import JSON…, Google Sheets / Airtable disabled (labelled "Coming soon" in code today; target label "Planned", §4 — CS-15 *(R-1018)*) |
| CM-04 | Records | table 50/page, column-sort, search; empty "No records yet" + Add record / Import / Import CSV |
| CM-05 | Record editor | wide sheet; Published switch; "Preview saved record" (read-only template preview); required enforced on publish; reference select; save awaits mirror receipt; unsaved guard (`cms-record`) |
| CM-06 | Fields | FieldsTable + FieldInspector side panel; empty "No fields yet"; Add field dialog offers **10 of 16** stored types (`fieldTypes.ts:17`); settings: required, min/max, pattern, options, reference target, default, placeholder, help; **field update fire-and-forget** |
| CM-07 | Dynamic pages | choose existing page as template (home refused client + server), URL pattern `/menu/{slug}` with unknown-field / pattern / collision / missing-template checks, SEO title/description patterns; "Generate N pages" (= save; pages appear on next publish) |
| CM-08 | Collection settings | rename name/slug, Source row, Danger zone delete (type DELETE; blocked while referenced) |
| CM-09 | New collection | `CMSCollectionSetupModal` (incl. "Generate a page per entry" → sets pattern only, no page) |
| CM-10 | Data | Sources (session JSON, rename/re-sync/delete — lost on reload, INV B31; detail §10.1 *(R-1018b)*), Site variables (`{{site.key}}`, project settings), Conditions (legacy, no-op output) |
| CM-11 | Delete recovery | delete then restore creates a **new record ID** |
| CM-12 | Permissions | reads: site access; writes EDITOR+ (server); no UI role gating in area; viewers cannot open CMS (rail) |
| CM-13 | Publish checks | missing template, template pages not published, empty bindings (warnings); list without collection (fail) |

## 3. Problems this design solves
1. **Dynamic pages and Settings hidden** in ⋯ (IAF-07 C).
2. **Two entry surfaces** (drawer + area) for one destination.
3. **Schema saves overstate persistence** (field update fire-and-forget).
4. **Field types limited** to 10 of 16 in Add field — FD-DYN-01 needs datetime, select, url, email, file, color.
5. **No "Create collection page"** (FD-DYN-01 Way 3) and no og:image. *(renamed 2026-10-17 — SC-11 "Collection page")*
6. **Delete recovery** silently changes identity (new ID) and can break incoming references.
7. **Field usage is incomplete**: the existing Used-by count and bound-field delete refusal (`fieldUsage.ts`, `DeleteFieldDialog.tsx:58-69`) cover bindings, list templates and the URL pattern, but not SEO patterns, conditions or filters.

## 4. Target layout

```
rail │ CMS NAVIGATION (240)         │ WORK AREA (flex)                                      │ DETAIL (320, when a field is selected)
     │ Collections        + New     │ Blog · 20 records             [+ Add record]   ⋯      │
     │ ● Blog            20         │ [Records] [Fields] [Dynamic pages] [Collection settings]│
     │   Team             6         │ ───────────────────────────────────────────────────── │
     │   Menu            14         │  Search…            Status ▾   Sort ▾                  │
     │ DATA                          │  ☐ Title            Status      Updated   Author      │
     │   Sources                     │  ☐ Biryani recipe   Published   2h ago    Ali         │
     │   Site variables              │  ☐ Lahore trip      Draft       1d ago    Sara        │
     │   Conditions (index)          │                                                       │
     │ Recently deleted              │                                                       │
     │ ‹ Back to Editor · Home       │                                                       │
```

- **One destination:** rail CMS opens the area; the former drawer content becomes the **CMS navigation** column (Panel 02 §5 merge). "‹ Back to Editor · {page}" / "‹ Back to {origin}" per Panel 00 SC-1 (Back slot per Panel 00 SC-1: left end of the 56px work-area header — not in the nav, so it survives the ≤1280 nav collapse.) The sketch's nav position is illustrative only.
- **Four visible tabs** (IA-01): Records · Fields · Dynamic pages · Collection settings. Header primary action follows the tab.
- **⋯ (collection):** Import CSV…, Import JSON…, Google Sheets / Airtable kept **disabled "Planned"**. No collection export is added (IAF-07 K: not established in the product).
- **CMS navigation › Recently deleted** (nav-level entry, like Assets and Components) hosts deleted records, fields and collections — §8 *(R-1018, D2-31)*.
- **Empty CMS:** the "Create your first collection" call to action sits in the centre of the work area; the permanent right hint column is dropped (INV B5 🐞 UX-15 / IA-11) *(R-1018)*.
- **Products collection preset** (auto-offered on the first product block, INV 11.4): **deferred with e-commerce** (owner P1; T4-11 one disposition) — not offered in this version *(R-1018, T1-28)*.
- **URL** keeps the area, collection and open record (owner N5); a record that no longer exists falls back per IA-07 *(R-1018)*.

## 5. Records

| Item | Contract |
|---|---|
| Table | rows 40 (existing; thumbnail resource list, owner V1 *(R-1018)*); columns: title/name field, **Status column (NEW — today only a "· Draft" name suffix)**: Draft / Published / **Changed since publish** *(DS; derived: Published and `updatedAt` > site `lastPublishedAt` — a status-only change also counts)*, Updated, + up to 3 user-chosen fields (column picker, local preference); sticky header; search; sort by column; **Status filter** (All / Published / Draft) *(DS, NEW)*; pagination 50 (existing) |
| Open record | row click → **record subview** in the work area. The four area tabs **stay visible above** (switching runs the record dirty guard); the sheet's own inner tab row (`RecordSheet.tsx:560-593`) is retired in favour of them. Subview header: breadcrumb "Blog › {record title}" (Back = Blog records list) · status chip · ⋯ (Delete). Form column 720–960; **Preview column 420** (existing "Preview ▸", `RecordPreview.tsx`) to the right when work area ≥ 1140, otherwise a **Form | Preview** toggle in the header; footer **Save record** / Cancel |
| Form | fields in schema order with label, help, required marker; reference = searchable record picker (existing select upgraded to search *(DS)*); image and **file** = contextual Asset picker (Panel 02; file today falls back to a text input, `RecordSheet.tsx:480`); file uploads limited to server-allowed types (images, video, fonts — no PDFs yet, Panel 08 §4.4); **color = color picker + hex input (NEW)**; url/email inputs with validation; rich text editor; date/datetime pickers; option chips |
| Published | explicit switch "Published — included in the next site publish" (not a deploy, IAF-07 D); existing eligibility line kept: "Eligible for publishing" / "{N} required fields missing" — **colored by eligibility** (success when eligible, warning when not; today "Not eligible — not saved yet" is green beside a warning icon, INV B18 🐞) *(R-1018)* |
| Save states | Saving… → **Saved** only after server receipt (existing record behaviour); failed → form kept + "Couldn't save — Retry"; conflict → "Changed elsewhere — Review" (see Conflict row); bottom-bar status uses the SC-4 five states with the object prefix: "Record — Saving…", "Record saved", "Record — Couldn't save — Retry", "Record — Offline — will save when back online" *(R-1018, CS-12 — replaces "Record saving / Record save pending / Record save failed")* |
| Conflict *(R-1018, owner S6; T4-17)* | Opening "Review" (record banner or toast) shows a **field diff**: only the fields that differ between my unsaved form and the latest server version, one row per field — field name · **Mine** · **Theirs (latest saved)**; unchanged fields are not listed. Actions: **Keep mine** — rebases: loads the latest server version and re-applies **only the fields I changed** since I opened the record (fields I did not touch take theirs), then saves against the latest version (server precondition required); if the server changed again meanwhile, the diff reopens. **Use theirs** — discards my edits and loads the latest version. Cancel returns to the form with edits kept. **Gone** (record deleted elsewhere): existing "This item is no longer available" kept. Requires engineering (⛔, SC-9): base-version tracking per open record + mandatory server precondition (today Keep mine resends the copy from conflict time and the precondition is optional — INV B43, audit P2-7 / L3-022) |
| History | **No per-record history in this version** (owner P10). Recovery for records = Undo toast, CMS › Recently deleted (§8) and the conflict field diff above *(R-1018)* |
| Loading *(R-1018, D2-20)* | opening a record: skeleton form rows in the subview; header and tabs stay interactive; load failure "Couldn't load {record} — Retry" (server) vs "You're offline" (network) |
| Preview | **Existing:** Preview column previews the unsaved form (relabelled **"Preview (unsaved)"**) and "Preview saved record" opens the read-only template preview — IAF-07 G. Not new |
| Offline | record shows "Offline — will save when back online" (SC-4; replaces "Saved on this device only"); bottom bar "Record — Offline — will save when back online"; the offline announcement is Panel 22's (one polite announcement) *(R-1018, CS-10, CS-12)* |
| Delete | subview ⋯ or row menu: **no confirm — deletes at once with toast "{Record title} deleted · Undo · Recently deleted ›"** (≥8 s; SC-15 class (a) Undo only; Undo = the exact Restore below) *(R-1018, CS-13 / D2-10 — was "Deleted — Restore")* and Recently deleted (§8); **records that own a generated page keep the existing typed delete** (`RecordSheet.tsx:339`) — declared exception **E-1** *(amended 2026-10-17 — source: Panel 24 §4.9 / SC-15)*. Recovery: records are already soft-deleted (`cms.service.ts:445`, tombstone pattern) → **exact Restore (same ID)** via a small undelete endpoint — **IAF-07 H/K amendment, applied under the owner's standing "apply recommended" instruction (owner may veto)** (restores the tombstoned slug; if the slug was taken meanwhile, asks for a new one). Retire the misleading toast copy "Undo restores it" (`RecordSheet.tsx:349`) → "{Record title} deleted · Undo · Recently deleted ›" *(R-1018)*. Until the endpoint ships, the toast action and the Recently deleted action stay labelled honestly "Restore as new record" with the new-ID warning |
| Bulk | *(DS, NEW, P2 of this panel)* select rows → Publish / Unpublish / Delete; per-record result report ("18 published, 2 failed — required fields missing · Show") |
| Guard | unsaved record → the one SC guard dialog (owner S3): title "Leave without saving?" · **Keep editing** (default) · **Discard changes** · **Save and leave** (the record has an explicit Save); Save and leave that fails stays on the record with "Couldn't save — Retry"; failed discard → Retry/Stay per Panel 02 §7 (kept) *(R-1018, CS-02 — was Keep editing / Leave and lose changes)* |

## 6. Fields

| Item | Contract |
|---|---|
| List | rows 40: name, key, type, required, **Used by** count (existing: bindings, list templates, URL pattern; **NEW sources:** SEO/og:image patterns, conditions, list filters/sorts); selecting opens **detail 320** (FieldInspector) |
| Add field | dialog offers **all 16 stored types** *(NEW: + datetime, select, file, color, url, email)* grouped: Text (text, long text, rich text, email, url, slug) · Number & date (number, date, date & time) · Choice (yes/no, option, options) · Media (image, file) · Relation (reference) · Other (color). Name + auto key (editable, `^[a-z][a-z0-9_-]*$`, reserved/duplicate guard). **Reference is single-record only; multi-reference fields are deferred** (owner P11) and the list-filter operator **"contains any of" is hidden** in the Inspector filter builder while P11 holds (FD-DYN-01 / Panel 06 own that control) *(R-1018)* |
| Settings | existing: required, min/max, pattern, options, reference target, default, placeholder, help; unset ≠ 0 |
| Save | **Fix:** field changes show Saving… → Saved only on server receipt; failure keeps the draft in the detail with "Couldn't save — Retry" (SC-4 vocabulary *(R-1018)*; no optimistic "Saved") |
| Bound field protection | **Keep (existing):** key, type and reference target locked when Used by > 0 with explanation (`FieldInspector.tsx:6`); **Show usages** list (each opens its owner: Inspector row, list filter, Dynamic pages pattern) |
| Delete a used field | **Keep (existing):** refused — existing copy "Cannot delete — field is bound" (`DeleteFieldDialog.tsx:63`) with Show usages; the user removes usages first. No "delete anyway" (a lossy delete would need an owner decision). Unused fields with no stored values: no confirm — toast "{Field} deleted · Undo · Recently deleted ›" (SC-15 class (a) *(R-1018)*) + CMS › Recently deleted (§8); with stored values see the next row (E-3) *(amended 2026-10-17 — source: Panel 24 §4.9 / SC-15)* |
| Rename a used field | Display name rename allowed (key unchanged, existing); usages listed for awareness |
| **Stored-data protection (NEW, C-4, review 2026-10-17)** | Usage protection covers bindings only; values stored in records are protected separately. **Delete field** (even unused): preflight "**{N} records have a value in {field}**" — typed confirm when N > 0 (declared exception **E-3**, kept after the tombstone ships because it states the data count *(amended 2026-10-17 — source: Panel 24 §4.9 / SC-15)*); the field moves to a **deleted-field tombstone** for 30 days (values kept, key reserved) with **Restore field** in CMS › Recently deleted (§8). **Change type** (allowed only while Used by = 0): opens a conversion step with a preview of the first 5 records — *Convert* (lossless pairs only, e.g. text→long text, number→text), *Clear values* (typed confirm, N shown), or *Cancel*; lossy conversions never run silently. **Add a required field** to a collection with published records: preflight "{N} published records have no value — they will be skipped on the next publish" with *Set a default value* / *Required for new records only* / *Cancel*. Requires engineering: field tombstone + conversion endpoint (SC-9). **Until the tombstone + conversion endpoint ships (SC-9 ⛔):** field delete is refused when any record holds a value, and type change is refused when any record holds a value. |

## 7. Dynamic pages (FD-DYN-01 §10.1)

```
Dynamic pages · Blog
Collection page [ Blog post page ▾ ]  Edit collection page ›     or  [ Create collection page ]
URL pattern     /blog/{slug}                 ✓ 20 unique URLs
SEO title       {title} · Bella Cucina
SEO description {excerpt}
Social image    {photo}                      (NEW og:image)
Status          20 pages will be generated on the next publish · 2 records skipped (no slug)  Show
[ Save ]
```
- Template select lists non-home pages (home refused, existing). **Create collection page** (NEW) opens the FD-DYN-01 dialog (layouts Article/Profile/Simple). **Edit collection page ›** opens the page in Editor with "‹ Back to CMS · Dynamic pages". *(renamed 2026-10-17 — SC-11 "Collection page")*
- Validation (existing): unknown fields with "Use {slug}" fix, pattern error, URL collisions, missing template. **NEW:** og:image pattern accepts image fields only.
- Button renamed **Save** (it never generated pages); status line states the next-publish effect and skipped records (IAF-07 G).
- Collection page missing (deleted/undone) → "Collection page missing — Choose page / Create collection page" (FD-DYN-01 §10.1). *(renamed 2026-10-17 — SC-11 "Collection page")*

## 8. Collection settings
- Name, slug (with impact note on URLs — **NEW:** the note shows "{N} live URLs will change" and offers *Add redirects from old URLs* via Site settings › Redirects; until that exists the copy says "Old URLs will show 404 after the next publish"), Source (existing read-only row "Buildrik CMS · Records are edited here"), **Danger zone**: delete collection — typed confirm (existing; declared exception **E-2** *(amended 2026-10-17 — source: Panel 24 §4.9 / SC-15)*) + **preflight** (NEW): records count, bindings, lists, conditions, dynamic pages generated; blocked while referenced by another collection (existing). Delete never unbinds the document before server success; afterwards bindings show "Blog was deleted — Choose source" (FD-DYN-01 §14). Deleted-field copy everywhere = FD-DYN-01's "{field} no longer exists — Choose field".
- **Collection delete recovery (NEW, C-5, review 2026-10-17):** delete is a **soft delete for 30 days** — collection, fields and records move to CMS › "Recently deleted" with **Restore collection** (same IDs, bindings resolve again; FD-DYN-01 §14 states clear on restore). **Delete is blocked while bound** (same rule as fields): preflight lists bindings, lists, conditions and dynamic pages with *Show usages*; the user removes them first. Permanent removal happens only after 30 days or via "Delete permanently" (typed confirm, ADMIN+ — SC-15 class (c) *(R-1018, D2-9)*). Requires engineering: collection **undelete** only — the server already soft-deletes collections and their records (`cms.service.ts:307-318`) *(corrected 2026-10-17)*. Fallback until undelete ships: delete stays blocked while bound and the confirm says "Deleted collections can't be restored from the editor yet" (the data is kept on the server).
- **Recently deleted (NEW):** a **CMS navigation entry "Recently deleted"** (below Data, §4) opens one list hosting deleted **records, fields and collections** (30 days) with a Type filter (All / Records / Fields / Collections / **Sources** — §10.1 *(R-1018b)*), the collection name on each record and field row, and single and bulk **Restore** — exact Restore (same IDs) for records once the undelete endpoint ships, **Restore field** after the tombstone ships, **Restore collection** after collection undelete ships (until then the row reads "Restore as new record" / is not listed, per the SC-9 fallbacks). A deleted collection's records stay reachable here because the entry does not depend on the collection being in the nav. The Records Status filter no longer carries a Recently deleted option *(R-1018, D2-31 — was a Records Status filter option)*. Replaces toast-only recovery. Rows use the Panel 24 §4.8 Recently deleted row pattern (32 px tool rows, "Deletes in N days", newest first). *(amended 2026-10-17 — source: Panel 24 §4.8 / SC-15)*
- **Confirm precedence and undo (SC-15, Panel 24):** in CMS the only confirmations are **E-1** (record that owns a generated page), **E-2** (collection delete), **E-3** (field delete with stored values), permanent delete from Recently deleted, and lossy conversions; every other CMS delete uses Undo + Recently deleted. In the owner's S2 classes → SC-15: record delete and delete of a field without stored values = **(a) Undo only** with toast "{Name} deleted · Undo · Recently deleted ›"; E-1 (page-owning record), E-2 (collection), E-3 (field with values) and permanent delete = **(c) typed** (a typed delete still lands in Recently deleted where the object has one); lossy conversions unchanged *(R-1018)*. ⌘Z inside CMS runs the CMS live recovery toast and never the hidden document (Panel 24 §4.3). Binding or unbinding a CMS field on the canvas (Inspector) is a document undo step (U-3). *(amended 2026-10-17 — source: Panel 24 §4.3, §4.9 / SC-10, SC-15)*

## 9. New collection
- "+ New collection" → existing setup modal: name, starter fields (existing). Starter field rows offer the **same type list as Add field** (§6, one source; today 9 types and no reference); the modal is one step, so the **step indicator is dropped** (it always showed "✓ Name & Type" with "2 Fields" current, INV B10 🐞) *(R-1018, T4-16)*. Checkbox **renamed** "Generate a page per entry" → **"Create a page for each record"** *(Change)*.
- Flow when checked: (1) collection is created and the URL pattern `/{collection-slug}/{slug}` is set (existing behaviour); (2) on success the **Create collection page dialog (FD-DYN-01 §10.1) opens with defaults prefilled** (layout Article, all compatible fields included); (3) **Create page** → page + link (FD-DYN-01 order and failure rules); **Cancel** → collection stays with its pattern and Dynamic pages shows "Collection page missing — Create collection page". If step 1 fails, nothing else runs and the modal keeps its input. *(renamed 2026-10-17 — SC-11 "Collection page")*

## 10. CMS → Data (IAF-08)
- **Sources — hidden this release (BD-39).** The full future specification in **§10.1** *(R-1018b, owner Q12 — Sources were planned to ship under Q12; superseded by BD-39; supersedes the "hide until persisted" default in INV B31 and closes T4-12)*. The session banner "Sources reset when you reload" is retired with persistence; it is never shipped as the fallback (⛔ below).
- **Site variables**: key/value list (`^[A-Za-z][A-Za-z0-9_-]*$`, unique, empty value allowed); rename/delete shows placeholder usage; listed in the source picker under Site (FD-DYN-01 §7.1).
- **Conditions (index)**: read-only table page · element · rule · state (Active / Not active — review); **Locate** opens the exact Inspector Content › Conditions rule with origin return. No editing here (one writer).

### 10.1 CMS › Data › Sources *(R-1018b, owner Q12)*

**Purpose.** A Source is a named block of JSON data the site keeps beside its collections — for values that are not records (a price table, opening hours, feature flags pasted from another tool) — so that conditions can test them and the published site reflects them. Job: **S supporting** (serves J1 Build and J3 Publish and maintain).

**Today (evidence, source-read 2026-10-18; runtime NOT RUN).**

| Fact | Evidence |
|---|---|
| One user-creatable type: **pasted JSON**. "+ Connect a source" opens a paste dialog; each **top-level key becomes its own source** (id = name = key; type `array` or `object`) | `DataRowDialogs.tsx:179-199`; `DataManager.importSampleData` `engine/data/DataManager.ts:315-333` |
| Stored **in memory only** (`Map` in `DataManager`) — gone on reload; not in project settings, not on the server, not in export or publish (`exportData()` has no caller) | `DataManager.ts:47, 337`; INV B31 🐞 L3-018 |
| Row: name + status dot + "{type} · {n} keys/items"; ⋯ Rename · Re-sync · Delete… (confirm "The source and its data leave this site. Elements bound to it stop receiving its data.") | `ContentViews.tsx:303-460` |
| Re-sync on pasted JSON = paste replacement data (no provider to pull from) | `DataRowDialogs.tsx:106-130`; `DataManager.refreshSource` `:128-136` |
| "Watching for changes" pill is shown for every list — false for pasted JSON | `ContentViews.tsx` `sources-watching`; INV B31 |
| Copy claims "A source feeds a collection" / "each list becomes records a collection can use" — **no code links a Source to a collection** | `ContentViews.tsx` `content-source-note`; `DataRowDialogs.tsx:195`; no caller found |
| Pasting a key that already exists throws inside `registerSource`, which the dialog reports as **"Not valid JSON"**; keys before it are already registered (partial add) 🐞 | `DataManager.ts:60-63`; `ContentTab.tsx:103-112` |
| A top-level JSON **array** is accepted and creates sources named "0", "1", … 🐞 | `importSampleData` (`Object.entries`) |
| **Only consumer:** legacy Conditions, path `sourceId.path` (`DataManager.bindCondition`) — whose output is a no-op (INV B33). No UI binds a property to a Source (`DataManager.bindVariable` has no UI caller) | `useContentPanel.ts:317-325`; `DataManager.ts:398-470` |
| Engine types `function` and `api` (with `endpoint`) exist with **no UI to create them and no fetch implementation** | `shared/types/data.ts:23-45` |

**Scope this version.** Sources stay **pasted JSON only** — the one type users can create today. No URL/API/fetched source and no "feeds a collection" behaviour is added (neither exists; both would be new capabilities needing an owner decision — see Not resolved). The false copy is retired.

**Location and geometry.**
```
CMS NAVIGATION (240)   │ WORK AREA (flex)                                   │ DETAIL (320, when a source is selected)
 DATA                   │ Sources · 3                   [+ Add source]      │ opening_hours                    ⋯
 ● Sources          3   │ ─────────────────────────────────────────────────  │ JSON object · 7 keys · Updated 2h ago
   Site variables       │ ▸ opening_hours   Object · 7 keys      Used by 2  │ Used by 2 conditions   Show usages ›
   Conditions (index)   │ ▸ price_table     List · 12 items      Not used   │ DATA
                        │ ▸ promo           Object · 3 keys      Used by 1  │  monday     "9–17"
                        │                                                     │  sunday     null
                        │                                                     │ [ Replace data… ]
```
- Host: CMS area; nav entry **Data › Sources** (nav 240, rows 32). Work area header 56 ("Sources · {N}" + primary **+ Add source**, renamed from "+ Connect a source" — it never connects to anything *(DS)*). List rows **48 two-line** (name / "{Object · N keys | List · N items}"), trailing "Used by N" or "Not used" and a 24×24 ⋯ (≥8 spacing). Selecting a row opens **detail 320** (header 48: name + ⋯; type line; Used by + Show usages ›; read-only **data preview**: first level of keys, objects expand one level, lists show the item count and the first 5 items; values in Geist Mono `tabular-nums`; "Replace data…" button). At remaining width < 480 the detail replaces the list as a subview with Back (§11 rule).
- Row ⋯ and detail ⋯: **Rename… · Replace data… · Delete** ("Re-sync" renamed "Replace data…" — that is what it does for JSON *(DS)*).

**States.**

| State | Behaviour / copy |
|---|---|
| Empty | title "No sources yet" · one sentence "Paste JSON data that conditions on your pages can check." · one action **+ Add source** (SC-28 empty pattern) |
| Loading | skeleton rows (48) in the list; header and + Add source drawn but disabled until loaded; reduced motion = static skeleton |
| Load error | server "Couldn't load sources — Retry"; network "You're offline" (SC-28) |
| Offline | list and detail stay readable from the last load; **+ Add source, Rename, Replace data, Delete** disabled with "Needs a connection" (writes need the server); announcement owned by Panel 22 |
| Viewer / role refusal | Viewers cannot open CMS (Panel 02, §11 Role). If the server refuses a write (role changed mid-session): inline "Editing sources needs Editor access", dialog input kept |
| Many sources | list scrolls under a sticky header; a **Search sources…** field appears in the header at > 10 sources *(DS)*; no results "No sources match "{query}"" + Clear search (SC-28) |
| Long names | single-line ellipsis in nav, list and detail header; full name in tooltip and accessible name; data keys in the preview wrap, never clip |
| Saved elsewhere | another session's add/replace/delete refreshes the list on next load or sync event; an open detail whose source was deleted elsewhere shows "This source is no longer available" + Back |

**Create flow (+ Add source → dialog 640).**
1. Field **JSON data** (mono textarea, min 8 lines) with the hint "Each top-level key becomes a source."
2. **Check data** (secondary) parses and shows a **preview list** in the dialog: one row per top-level key — name · Object · N keys / List · N items — and the first-level preview of the selected row (same renderer as the detail). Typing again clears the preview.
3. Validation (inline, under the field; the primary stays disabled until it passes):
   - not JSON → "Not valid JSON — check the syntax and try again." (existing copy)
   - top level is not an object → "Paste a JSON object — each top-level key becomes a source." *(fixes the "0", "1" bug)*
   - a key matches an existing source name → listed on its preview row: "A source called {key} already exists — rename the key, or use Replace data on {key}" *(fixes the mis-reported error and the partial add: nothing is added until every key passes)*
   - a top-level value that is not an object or list (string/number/boolean/null) → "{key} must be an object or a list"
   - over the server size limit → "This data is too large to save" (limit set by the persistence API, SC-9 ⛔; no number is invented here)
4. **Save model = explicit Save (SC-4):** primary **Add {N} sources** (singular "Add source"). Saving… in the button → dialog closes and toast "{N} sources added" only on **server receipt**; failure keeps the dialog and its text with "Couldn't save — Retry". All keys save together or none.
5. Dirty close (Cancel, Escape, outside click with text present) → the one guard (owner S3): "Leave without saving?" · **Keep editing** (default) · **Discard changes** · **Save and leave** (the dialog has an explicit Save).

**Edit flows.**
- **Rename…** — dialog 480, field "Source name" (required "A source needs a name.", existing; unique "A source called {name} already exists"); Save on server receipt. Bindings reference the source **id**, so rename never breaks a condition (existing rule, `DataManager.renameSource`).
- **Replace data…** — dialog 640, prefilled with the current JSON; same Check data → preview → validation (value must be an object or list). Before Save, the dialog lists **paths that conditions use and that the new data no longer has**: "{N} conditions use paths this data removes: {path}, … — they will show "{path} no longer exists — Choose field"" (consequence stated; Save stays available). Explicit Save = **Save data**; receipt rule and guard as in Create.

**Delete (SC-15).**
- **Used by 0 → class (a) Undo only:** no dialog; deleted at once; toast "**{Name} deleted · Undo · Recently deleted ›**" (≥ 8 s, SC-28); the source lands in **CMS › Recently deleted** (§8) for 30 days with **Restore source** (same id, so restored conditions resolve again). Recently deleted's Type filter gains **Sources** *(R-1018b)*.
- **Used by > 0 → class (b) consequence confirm** (dialog 480, default **Cancel**): title "Delete {Name}?" · body "{N} conditions use this source. They will show "{Name} was deleted — Choose source", and on the live site those elements will always show." · **Show usages** · Cancel · **Delete source**. After delete it still goes to Recently deleted with the same toast.
- Permanent delete from Recently deleted = class (c) typed (SC-15).
- Replaces today's always-on confirm dialog (`ContentViews.tsx` "Delete source").

**How consumers show a broken source (reuse FD-DYN-01 §14 states).** Sources are consumed by **Conditions** through the source picker's **Data sources** group (FD-DYN-01 §7.1). Legacy `sourceId.path` rules map onto the same paths (FD-DYN-01 §12.4).

| Case | Where | Copy (FD-DYN pattern) |
|---|---|---|
| Source deleted | condition rule chip, error | "{Name} was deleted — Choose source" (Restore from Recently deleted clears it) |
| Path missing after Replace data | rule chip, error | "{path} no longer exists — Choose field" |
| Path value changed type (e.g. number → text) so the operator no longer fits | rule chip, error | "{path} is now {Type} — Choose field" |
| Sources failed to load | rule chip, error | "Couldn't load {Name} — Retry" (rule kept) |
Failure never clears a stored rule (FD-DYN-01 §14).

**Publish behavior.** Pasted-JSON Sources are **static**: their data is known before publish. Conditions on Source paths are evaluated **at publish time** from the **server copy** (server-first, like `cms.publishSnapshot`) and written as `hidden` where false (FD-DYN-01 §12.3, D3). The Source data itself is not shipped to visitors. **No runtime fetch exists for Sources**, so the D8 browser script is not involved and there is no live-site failure state for Sources; D8 stays scoped to URL parameter / cookie / current date (FD-DYN-01 §7.2–7.3). Pre-publish (Panel 14 owns the rows): warning "**{N} conditions use a deleted source — Review**" and "**{N} conditions use missing paths — Review**"; those elements publish **shown** (same rule as "Can't be checked on the live site — element will always show"). A source with unsaved/failed writes blocks nothing — writes are explicit Save with server receipt.

**Permissions.** Read: anyone who can open CMS. Create / rename / replace / delete / restore: **Editor+** (EDITOR, DESIGNER, ADMIN, OWNER), enforced on the server like other CMS writes; refusal copy per SC-28. Permanent delete: ADMIN+ (same as collections, §8).

**Keyboard and a11y.** Nav → list → detail in F6/Tab order (SC-5). List is a listbox: ↑/↓ move, Enter opens detail, Shift+F10 / ⋯ opens row actions, Delete key = Delete (same class rules). Detail preview is a read-only tree (`role=tree`; →/← expand/collapse). Dialogs trap focus, Escape = Cancel (guard if dirty), focus returns to the invoking row or button. Validation messages are tied to the field (`aria-describedby`) and announced politely; the toast follows SC-31. "Used by N" has accessible name "Used by N conditions".

**Future engineering dependency; not a current-release obligation (BD-39).** ⛔ **Source persistence (server model + API) — Sources were planned to ship under Q12; superseded by BD-39 (owner Q12).** Needs: per-site server storage of sources (id, name, JSON, updatedAt); list/create/rename/replace/delete with receipts and a size limit; 30-day soft delete + restore (Recently deleted); usage count from conditions; publish reads the server copy. **There is no shipping fallback:** the session-only behaviour (lost on reload) does not ship as Sources.

**Not resolved (needs an owner decision, not invented here).** (1) Binding element **properties** (text, image, link) to Source paths — the engine has `DataManager.bindVariable` but no UI; FD-DYN-01's bind picker does not list Sources. (2) "A source feeds a collection" — claimed by today's copy, not built; copy removed. (3) **URL/API (fetched) sources** — the `api` type exists in the type file only; a fetched source would need a runtime or publish-time fetch design (and would be the only case for a live-site failure state).

## 11. States, permissions, geometry

| Condition | Behaviour |
|---|---|
| Loading *(R-1018, D2-20)* | first open: skeleton rows in the CMS navigation (collections) and in the records table (40 px rows, header and tabs drawn); skeleton only, no spinner; reduced motion = static skeleton |
| CMS content failed to load (hydration) *(R-1018, F-PB-Y26)* | server failure: "Couldn't load CMS content — Retry"; network failure: "You're offline" with the existing reassurance "This is a connection problem, not a change to your data." (`ContentTab.tsx:167`, kept for the network case only — never shown for a server error, DS §3 load-error rule) |
| No collections | "Create your first collection" + New collection, centred in the work area; short explainer (sheet → collection page → list); one main action — the extra Sources / Variables / Conditions links leave the empty state (they stay in the CMS navigation) *(R-1018, INV B4/B5 🐞)* |
| No records / no fields / no matches / load failed | distinct messages (existing) + Retry for failure; load failure copy per DS §3 ("Couldn't load {records} — Retry" / "You're offline") *(R-1018)* |
| Saving / offline / saved / failed / conflict | SC-4 five states (§5–6); bottom-bar status prefixes the object ("Record saved") *(R-1018, CS-12)* |
| CMS bindings too large *(R-1018, F-PB-Y12)* | the page save is refused before it is sent: bottom bar Save-failed tier "Couldn't save — this page's CMS bindings are too large"; the page keeps its unsaved state (no "Saved"). Status-row owner: Panel 11 §8 (T5-17) |
| Collection kept on this device only *(R-1018, T4-18)* | a collection the server refused shows "Only on this device" (declared SC-4 exception — a server refusal, not offline *(R-1018)*) on its nav row and header with Retry; Publish lists it as a named check row (Panel 14 owns the row) so its queued records no longer block publish silently (INV B44) |
| Role | Viewer: CMS rail disabled (Panel 02). EDITOR/DESIGNER/ADMIN/OWNER: full (server EDITOR+). Server refusal → "Editing CMS content needs Editor access" inline, draft kept *(R-1018, CS-11)* |
| Visual *(R-1018)* | DS §2 — area header 56 at 20/600, tab/task headers 14/600, section headers 12/600 sentence case (V6); rows 40 for records and fields, 32 for nav and Recently deleted (V1); info banners neutral grey + icon (V2) |
| Geometry | rail 56 + nav 240 (200–280) + work area flex (table may scroll horizontally only when columns exceed width) + field detail 320 when open; record subview 720–960 centred; at remaining width < 480 the field detail replaces the list as a subview with Back; **≤1280 nav collapses** to a labelled "CMS navigation" button opening a 240 overlay |
| Keyboard | table rows focusable, Enter opens. **⌘S rule:** when focus is anywhere inside the record subview (fields, footer, preview column), ⌘S saves **the record only** and the global project save does not run; bottom bar reports "Record saved". Elsewhere ⌘S keeps its global meaning. Escape in record subview = Cancel with dirty guard; elsewhere Escape closes only the topmost cancellable layer (popover, dialog, detail) and is a no-op otherwise — it never leaves the CMS area (REMAINING-IA-HANDOFF NAV; same rule as Panels 08/09) |

## 12. Preservation map

| Old | New | Disposition |
|---|---|---|
| CM-01 drawer + area | One area; drawer content = CMS navigation | Merge |
| CM-02 root | Same | Keep |
| CM-03 tabs + ⋯ | Four visible tabs; ⋯ = imports + Planned providers | Redesign |
| CM-04 records table | + status filter, column picker, status column, bulk (P2) | Keep + NEW |
| CM-05 record editor | Subview 720–960 under the area tabs; preview column 420 (or toggle); eligibility line; typed delete for page-owning records; offline message; inner tab row retired (tabs above); exact Restore NEW | Keep + extend |
| CSV import preview + column mapping (`CsvImportDialog.tsx:50`) | Same in ⋯ Import CSV… | Keep |
| CM-06 fields (10 types) | All 16 types (NEW: datetime, select, file, color, url, email); receipts (Fix); usage protection + delete refusal (Keep) with extra usage sources (NEW) | Keep + Fix + NEW |
| CM-07 dynamic pages | Visible tab; Create collection page; og:image; Save + status line | Keep + NEW |
| CM-08 settings | + delete preflight | Keep + Fix |
| CM-09 setup modal | Checkbox creates collection page | Change |
| CM-10 Data | Same; Conditions = read-only index | Keep + Move (authoring → Inspector) |
| Sources (session JSON, ⋯ Rename / Re-sync / Delete…, always-confirm delete, "Watching for changes", "feeds a collection" copy) | Persisted pasted-JSON Sources in CMS › Data with detail 320, data preview, Replace data…, SC-15 delete (Undo or consequence confirm by usage), Recently deleted, publish-time evaluation; false pill and copy removed (§10.1) | Keep + Fix + NEW *(R-1018b, Q12)* |
| CM-11 delete recovery | Exact Restore (same ID) once the undelete endpoint ships (IAF-07 amendment); until then "Restore as new record" with new-ID warning; toast copy fixed | Fix + NEW (amendment) |
| Google Sheets / Airtable | Disabled "Planned" | Keep |
| Conflict banner / toast Keep mine · Use theirs (INV B21, B43) | Field diff (Mine / Theirs, differing fields only); Keep mine rebases changed fields on the latest version; Use theirs | Fix *(R-1018, S6)* |
| Records Status filter "Recently deleted" option (spec 2026-10-17) | CMS navigation › Recently deleted (records, fields, collections) | Move *(R-1018, D2-31)* |
| Setup modal step indicator (INV B10) | Removed (one-step modal); starter types = Add field list | Change *(R-1018, T4-16)* |

No capability removed.

## 13. Acceptance (specified, NOT RUN)

| ID | Pass condition |
|---|---|
| T-CM-01 | Rail CMS opens the area with four visible tabs; Dynamic pages reachable without ⋯ |
| T-CM-02 | Field type change with failed server write never shows Saved; draft kept, Retry works |
| T-CM-03 | Add field dialog offers 16 types; each new type has a record-entry control (datetime picker, option select, file via Asset picker, color picker with hex input, URL and email inputs with validation); datetime usable in a condition and a sort |
| T-CM-04 | Field used by a binding and an SEO pattern: key/type locked; delete refused with Show usages listing both; after removing usages delete succeeds |
| T-CM-05 | Create collection page from Dynamic pages → page exists in Pages, link saved, status "20 pages on next publish" |
| T-CM-06 | **BLOCKED until the receipt registry (Panel 00 SC-9):** record save offline → "Record — Offline — will save when back online" in bottom bar; reconnect → Saved; conflict → Review *(R-1018, CS-12)*. **Fallback test:** the record subview shows its own existing pending/saved/failed messages |
| T-CM-07 | With undelete endpoint: Delete then Restore → same record ID and slug; references work again; if slug taken → asks for a new slug |
| T-CM-07b | Without endpoint (fallback): "Restore as new record" → new ID; warning shown; incoming references not claimed repaired |
| T-CM-12 | ⌘S with focus in the record form saves the record only (no project save); ⌘S on canvas saves the project |
| T-CM-13 | New collection with "Create a page for each record" → dialog prefilled; Cancel leaves "Collection page missing" state |
| T-CM-08 | Conditions index Locate → exact Inspector rule; Back returns to the index row |
| T-CM-09 | ≤1280: CMS navigation collapses to a labelled button; location preserved |
| T-CM-10 | Bulk publish with 2 invalid records → per-record report, 18 published |
| T-CM-11 | Existing CMS tests updated with the change, not deleted |
| T-CM-14 *(R-1018, S6)* | Two sessions edit the same record (A: title, B: title + excerpt). A's save conflicts → Review lists only differing fields with Mine / Theirs; Keep mine → saved record has A's title and B's excerpt; Use theirs → B's version loaded, A's edits gone; neither path resends a stale full copy |
| T-CM-15 *(R-1018, D2-31)* | Delete a record, a field and a collection → all three listed under CMS navigation › Recently deleted; the deleted collection's records are reachable there; Restore per row type (per SC-9 fallbacks until endpoints ship) |
| T-CM-16 *(R-1018, F-PB-Y26, F-PB-Y12, D2-20)* | First open shows skeleton rows; a server load failure shows "Couldn't load CMS content — Retry" (no connection wording); offline shows "You're offline"; an oversized-bindings save shows the Couldn't-save copy and never "Saved" |
| T-CM-17 *(R-1018, S3)* | Leaving a dirty record shows "Leave without saving?" with Keep editing (default) · Discard changes · Save and leave |
| T-CM-18 *(R-1018b, Q12)* | Add source with `{"hours":{…},"prices":[…]}` → Check data previews 2 rows; Add 2 sources → Saved only on server receipt; **reload → both sources still listed** with the same data |
| T-CM-19 *(R-1018b)* | Paste a top-level array → "Paste a JSON object — each top-level key becomes a source."; paste a key that already exists → that row's duplicate message and **nothing** is added (no partial add, never "Not valid JSON") |
| T-CM-20 *(R-1018b)* | Delete an unused source → no dialog; toast "{Name} deleted · Undo · Recently deleted ›"; Undo restores same id. Delete a source used by 2 conditions → consequence confirm naming 2 conditions, default Cancel; after delete both rules show "{Name} was deleted — Choose source"; Restore from Recently deleted clears both |
| T-CM-21 *(R-1018b)* | Replace data removing a used path → dialog names the affected conditions before Save; after Save the rule shows "{path} no longer exists — Choose field"; rename never breaks a rule |
| T-CM-22 *(R-1018b)* | Publish with a condition `hours.sunday is empty` → element written `hidden` per the server copy of the source; no Source data in the published HTML/JS; deleted-source condition → pre-publish warning and element shown |
| T-CM-23 *(R-1018b)* | Offline: write controls disabled "Needs a connection", list readable; server load failure "Couldn't load sources — Retry" (no connection wording); > 10 sources shows search; long name ellipsizes with full name in tooltip and accessible name; full keyboard path per §10.1 |

## 14. Review and not verified
Independent `design-qa-critic` review done (see Status line; this footer was stale until 2026-10-17). Not verified: runtime, server receipts for field writes (requires backend change), bulk operation API (new), **undelete endpoint (new, for exact Restore)**, **conflict rebase: base-version tracking + mandatory server precondition (⛔, S6 — = SC-9 ⛔ "CMS conflict rebase")** *(R-1018)*, **Source persistence (⛔, Q12)** *(R-1018b)*, measured geometry.

**Note to the shared-contracts (Panel 00) owner** *(R-1018b)*: please add an SC-9 row — Dependency "⛔ **Source persistence (server model + API)** — Sources were planned to ship under Q12; superseded by BD-39 (owner Q12)" · Needed by "07 §10.1, FD-DYN-01 §7.1/§12" · Fallback "None that ships — the session-only Sources (lost on reload) are not released; T-CM-18…23 BLOCKED". This panel does not edit 00.
