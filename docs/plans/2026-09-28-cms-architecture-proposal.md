# CMS — current-state audit + proposed architecture (2026-09-28)

**Status: APPROVED 2026-09-28 (founder): start C0.** Founder answers: PD-1 = **build Reference / Rich text / Multiselect in C1** (overrides the hide recommendation) · PD-10 = right-docked 480px record panel · PD-3 + PD-5 **superseded same day (D4–D6)**: Sources become a **per-collection source** (Buildrik, CSV/JSON, Google Sheets, Airtable, Custom API/JSON URL, all five in scope); Conditions become **per-collection Views (filters)** plus **element visibility in the Inspector**; Variables become **collection constants `{{collection.x}}`** alongside site variables `{{site.*}}`. See §2c. PD-2, 4, 6, 7, 8, 9, 11 are still open; the recommendations stand as defaults until the founder says otherwise.
Order agreed with the founder: fix the code first (Phases C0–C4), verify it live, and only then conform Figma (Phase F).

Inputs:
- Prior UX audit `docs/audits/2026-09-27-module-audit/04-cms.md` (CMS-01..23). Re-checked on 2026-09-28: **17 still open, 0 fixed.** The other 6 are in the bindings slice and are **all still open** too. There have been no CMS commits since.
- Three code audits run 2026-09-28: data/server (DM-01..22), UI surfaces (UI-01..24), bindings/publish (BD-01..29).
- A live-app walk on localhost:3000 (RT-nn, §R).
- The P0 claims DM-01, DM-02, BD-02 and BD-10 were re-read by hand against source before being kept as P0.

ID prefixes: **CMS** prior audit · **DM** data/server · **UI** workspace UI · **BD** bindings/publish · **RT** runtime.

---

## 0. The one-paragraph verdict

The CMS **surfaces** are roughly the right ones: drawer → workspace → record sheet, plus an Inspector binding. The **data architecture underneath them is not safe to publish from.**

- Every edit is written first to each browser's own IndexedDB, and the server gets a best-effort mirror.
- At publish, static bindings and Collection lists are rendered from **the publishing browser's IndexedDB**, while dynamic pages are rendered from **Postgres**. Nothing makes the two agree.
- On top of that:
  - Renames don't sync.
  - Deletes don't propagate.
  - Concurrent edits overwrite each other silently.
  - List-child bindings publish the same record N times.
  - Every link on a generated record page 404s.

Fix the data authority first (C0). Everything visual after that is ordinary product work.

Design completeness of the current CMS: **3/10.** A 10 means:
- one data authority;
- every field type real or hidden;
- one binding picker scoped by context;
- template pages that are visible in Pages;
- every state (loading, empty, error, conflict, offline, read-only) designed;
- nothing publishes that the author can't see.

---

## 1. Complete feature inventory (Phase 1)

### 1a. Surfaces

| Surface | Shape | Code | Status |
|---|---|---|---|
| Rail "CMS" (key D) | rail tab `content` | `rail/tabsConfig.ts:226-243` | live; stale "Off-rail" comment; aria name collides with the "Records" tab (CMS-22) |
| Drawer root | collections list, "+ New collection", Data › Sources / Variables / Conditions | `sidebar/tabs/content/ContentTab.tsx`, `ContentViews.tsx:134-273` | live; has its own loading, error and empty states |
| Sources drill-in | paste-JSON data source | `ContentViews.tsx`, `DataManager.ts:60-73` | **lost on reload** (CMS-14) |
| Variables drill-in | site variables `{{site.*}}` | `ContentViews.tsx:303+`, `projectSettings.siteVariables` | live; text-only substitution, braces show on the canvas (BD-24) |
| Conditions drill-in | element visibility rules | `useContentPanel.ts:282-289`, `DataManager.ts:450-521` | **inert**: sets `data-condition-hidden`, which nothing reads (BD-10) |
| Workspace | covers canvas **and** Inspector; tabs Records · Fields · ⋯ | `cms/CmsWorkspace.tsx`, mounted `shell/StudioPanels.tsx:845-852` | live; root pane is blank (CMS-21); closes when the drawer collapses (UI-21) |
| Records tab | div-grid table | `cms/RecordsTable.tsx` | live; no selection, bulk, filter, column config or loading state |
| Fields tab + FieldInspector | table + right column | `cms/FieldsTable.tsx`, `cms/FieldInspector.tsx` | live; no reorder, display field, defaults or unique |
| Dynamic pages (behind ⋯) | pattern + template page | `cms/DynamicPagesPane.tsx` | live; no SEO fields, lists the home page as a template (BD-04) |
| Settings (behind ⋯) | name, slug, delete | `cms/CollectionSettingsPane.tsx` | delete ignores bindings (CMS-06) |
| Record sheet | `absolute inset-0` over the whole workspace | `cms/RecordSheet.tsx` | live; blank-record retry bug (CMS-01); no focus management (UI-16) |
| Record preview column / Preview saved record | generic card / sandboxed iframe of the template | `RecordPreview.tsx`, `RecordTemplatePreviewDialog.tsx` | the template preview uses saved data only; client and server substitution differ (BD-23) |
| New collection modal | 5 types, `_` keys | `shell/modals/CMSCollectionSetupModal.tsx` | disagrees with Add field (CMS-03); broken "page per entry" (CMS-02) |
| Add field / Delete field / Typed DELETE | modals | `cms/AddFieldDialog.tsx`, `DeleteFieldDialog.tsx`, `TypedDeleteDialog.tsx` | live |
| CSV import (server) / JSON import (client) | modal / file input + strip | `CsvImportDialog.tsx`, `useImportRecords.tsx` | two write paths, no type coercion, no rollback (DM-14, UI-12) |
| Ecommerce "Set up Products" | modal on first e-com block drop | `ecommerce/CollectionSetupModal.tsx`, `ProductCollectionService.ts` | creates a collection that nothing consumes (BD-26) |
| Inspector › Content (Static / From CMS) | field binding | `inspector/sections/ContentSection.tsx` | shown on **every** element type, field list unfiltered (BD-11) |
| Inspector › Collection › Source / Show | list binding | `inspector/sections/CollectionListSection.tsx` | "All" means 50 (BD-08); no sort or filter |
| Binding banner | "bound to …" + Unbind | `inspector/components/BindingBanner.tsx` | its Unbind can't be undone (BD-21); shows a raw id when the collection has been deleted |
| Add panel "Collection list" block | block | `blocks/Layout/CollectionList.tsx` | the media slot is a container and can't be bound; publishes raw `{{item.*}}` when unbound (BD-06) |
| Pages "+N from collections ›" | count + link | `sidebar/tabs/pages/useDynamicPagesSummary.ts` | counts collections that have no template (CMS-23); opens only one collection |
| ⌘K "Open CMS", "Manage CMS records", record rows | palette | `CommandPalette.tsx:126,445-477`, `defaultCommands.ts:599` | duplicate row (CMS-15); VIEWER sees dead rows (UI-18) |
| Context menu "Bind to CMS field…" | focuses Inspector › Content | `standaloneActions.ts:61-74` | live; limited to 6 element types while the Inspector allows every type |

### 1b. Capabilities that do not exist

- Export (any format).
- Bulk select and bulk actions.
- Filter.
- Column config.
- Saved views.
- Duplicate record.
- Archive in the UI (the engine has `archived`, which becomes DRAFT on sync).
- Scheduled record publish.
- Display-field editor.
- Field reorder.
- Defaults, help text and unique.
- SEO patterns UI.
- Record picker for references.
- Multi-reference.
- Rich text editor.
- Deep links.
- Activity log.
- Soft delete / restore.
- Per-record redirects.
- Localization.
- Conflict detection.
- Presence.
- Public CMS API.
- Forms → CMS.
- CMS plan limits.

(Evidence: UI §1–5, DM §1/5/8, BD §5/6.)

---

## 2. What CMS owns (Phases 2, 4, 5)

**CMS owns the site's structured content:**
- collections;
- each collection's schema (fields, types, rules, display field);
- records (values, status);
- the rule that turns records into URLs (the URL pattern + SEO patterns);
- import and export of records.

**CMS does not own:**
- page structure;
- element visibility logic;
- page templates' content.

Other modules **consume** CMS through a contract.

### 2a. Responsibility model

| Capability | Primary owner | CMS role | Other module role | Scope | User job |
|---|---|---|---|---|---|
| Collections, schema, fields | CMS › Fields / Settings | owns | — | collection | define the data |
| Records, status | CMS › Records + record panel | owns | ⌘K jumps in | record | write content |
| URL pattern + SEO patterns for records | CMS › Pages tab (proposed) | owns | Pages shows the routes read-only | collection | give each record a page |
| Template page layout | **Pages** (a page typed "Collection template") | provides the preview record | Pages owns the page; the canvas edits it | page | design the record page |
| Binding an element to data | **Inspector** | provides fields and records | Inspector owns the picker | element | show data on the page |
| Collection list (repeater) | Inspector › Collection | provides records | Add panel inserts the block | element | list records |
| Site variables `{{site.*}}` | CMS drawer › Site data | owns | any page consumes | site | reuse a phone number or address |
| Collection constants `{{collection.x}}` | CMS › collection Settings › Constants | owns | pages and lists of that collection consume | collection | currency, default image, CTA text |
| Collection source (where records come from) | CMS › collection **Source** tab | owns | — | collection | keep records in Sheets / Airtable / an API / a file |
| Collection Views (named filters) | CMS › collection **Views** tab | owns | Collection list picks a View | collection | "Featured only", "Price > 100" |
| Element visibility (show/hide by rule, incl. CMS fields) | **Inspector › Visibility** | provides fields | Inspector owns | element | hide a badge when `featured` is false |
| Pasted JSON Sources (site-level, memory-only) | **REPLACED** by the per-collection source | — | — | — | — |
| Publishing records live | Site publish (Topbar) | record status says "eligible" | Publish renders | site | go live |
| Products collection (ecommerce) | CMS | owns the data | Ecommerce blocks consume it (not wired today) | collection | sell |

### 2b. Collection-level vs record-level (Phase 5)

| Capability | Level | Today | Problem |
|---|---|---|---|
| Fields, types, key, required, min/max | Collection | Fields tab | ok |
| Display ("title") field | Collection | **no UI**; 4 different fallbacks (CMS-16) | add to Settings |
| Defaults, help text, unique | Collection | no UI | add to FieldInspector |
| URL pattern, template page, SEO patterns | Collection | Dynamic pages behind ⋯; SEO has no UI | promote to a first-class tab |
| Values, status, slug value | Record | record sheet | ok |
| "Required" enforcement | Record, at publish | client-only | server must enforce (DM-09) |
| "Open affected record" from FieldInspector | schema → record jump | opens the first record *with* a value | wrong record (UI-24) |
| Record sheet tab row listing "Fields / Dynamic pages" | record surface showing collection tabs | duplicate tab row (CMS-11) | schema tabs shouldn't live inside the record surface |

### 2c. Collection management model (added 2026-09-28, D4–D6)

Each collection owns four things: its **source**, its **Views** (named filters), its **constants**, and its **pages** rule. Site-level things (site variables) live once in the drawer's Site data.

**Sources: all five in scope.**

| Source | Records editable in Buildrik? | Setup | Sync | Auth / secrets | Server safety |
|---|---|---|---|---|---|
| **Buildrik** (default) | yes | none | n/a | — | — |
| **CSV / JSON file** | yes after import (import = copy); optional "Replace from file" | upload → map columns → preview | manual re-import (upsert by key field) | — | size caps (existing CSV caps) |
| **Google Sheets** | **no**, read-only mirror (Sheet is the authority) | connect Google → pick spreadsheet + tab → header row → map columns → key column | manual "Sync now" + schedule (off / hourly / daily) via a new `/api/cron/cms-source-sync` (CRON_SECRET) | OAuth scope `spreadsheets.readonly`; tokens AES-256-GCM with `ENCRYPTION_KEY`, workspace-scoped (`WorkspaceIntegration`, provider `google-sheets`) | lazy-init client; rate-limit backoff |
| **Airtable** | **no**, read-only mirror | connect Airtable → base → table → view (optional) → map fields → key field | same as Sheets | Airtable OAuth (`data.records:read`, `schema.bases:read`); `WorkspaceIntegration` provider `airtable` | lazy-init client; 5 req/s limit respected |
| **Custom API / JSON URL** | **no**, read-only mirror | URL + method GET + optional header auth (bearer / API key) + JSON path to the array (e.g. `data.items`) + pagination (none / page / cursor) → map → key | same as Sheets | the header secret is encrypted per collection | **SSRF guard**: https only, block private/link-local/metadata IPs after DNS resolve, 10 s timeout, 5 MB cap, no redirects to private hosts |

Rules for every external source:
- The **key field** (a stable id from the source) maps to `CmsEntry.externalId`, so a sync upserts instead of duplicating, and rows gone from the source are tombstoned (reuses C0.4).
- Records from an external source are **read-only** in the record panel. The header says "From Google Sheets · Edit in the sheet ↗". Status (Published/Draft) is either all-published or taken from a mapped boolean column; the founder picks per collection.
- The **field mapping** is the schema. Source columns map to typed Buildrik fields with coercion (the shared validator from C1). A mapping error on a row = the row is skipped and reported, never stored half-typed.
- **Sync result** is stored: `lastSyncedAt`, `lastSyncStatus` (ok / partial / failed), counts (added / updated / removed / skipped), first 50 row errors. The management table and Source tab show it.
- Publish reads the **server copy** (C0.1), so external data is exactly what the last sync stored. The pre-publish check warns "Blog last synced 3 days ago" or "last sync failed".
- Switching a collection's source from Buildrik to external requires a typed confirm ("existing N records become read-only and will be replaced by the next sync").

**Views (collection conditions).** A View = name + filter rules (field · operator · value, AND/OR groups) + sort + limit. Stored per collection (`CmsView`). A Collection list picks "All records" or a View; the Inspector list section shows the View name, not the rules. Operators by type: text (is, contains, is empty), number/date (=, <, >, between), boolean (is), select/multiselect (is any of), reference (is record). Server applies Views at publish; canvas applies the same function (shared code).

**Element visibility (Inspector).** Replaces today's inert CMS › Data › Conditions: Inspector › Visibility › "Show when" rule on the element, testing a CMS field in context (current item / this page's record) or a site variable. Exported as removal at publish (not a CSS attribute), preview on canvas.

**Constants.** Per collection key → value (text, number, image, URL). Usable as `{{collection.<key>}}` inside that collection's lists and template page, plus in SEO patterns. Site variables stay `{{site.<key>}}`, substituted in text **and** attributes (fixes BD-24).

**Management table (CMS root).** Columns: Collection · Source (icon + name) · Records · Last sync (time + status dot) · Pages (on/off + count) · Used by (count of bound elements / lists) · ⋯ (Sync now, Open, Duplicate schema, Delete). Row click opens the collection. Header: "New collection" (source picker is step 1 of the modal).

**Data model additions (C5).**
- `CmsCollection`: `sourceType` (`BUILDRIK | FILE | GOOGLE_SHEETS | AIRTABLE | API`), `sourceConfig Json` (non-secret: sheet id, tab, base, table, URL, JSON path, pagination, key field, mapping), `sourceSecret String?` (encrypted, API only), `syncSchedule` (`OFF | HOURLY | DAILY`), `lastSyncedAt`, `lastSyncStatus`, `lastSyncReport Json`, `constants Json`.
- `CmsEntry`: `externalId String?` with `@@unique([collectionId, externalId])`.
- New `CmsView` (id, collectionId, name, rules Json, sort Json, limit Int?).
- New `CmsSyncRun` (id, collectionId, startedAt, finishedAt, status, counts, errors Json) for history.
- New env rows in root CLAUDE.md in the same commit that reads them: `AIRTABLE_CLIENT_ID` / `AIRTABLE_CLIENT_SECRET`; Google Sheets reuses `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` with an added scope (the consent screen must list it); `check-prod-env.mjs` updated.

**Permissions.** Connect/disconnect an integration: ADMIN+. Change a collection's source or mapping: EDITOR+. Sync now: EDITOR+. Views/constants: EDITOR+.

---

## 3. Data model (Phase 3)

### 3a. Collection → field → type → validation → relationship

| Type | Addable | Record control | Engine rule | Enforced where | Verdict |
|---|---|---|---|---|---|
| text | yes | TextInput | min/max length, pattern | client, at publish only | keep; enforce on server |
| textarea (Long text) | yes | Textarea | same | same | keep |
| richtext | yes | **plain textarea** (same as Long text); server strips all markup | same | same | **fake**: build it or hide it (UI-06, DM-10) |
| number | yes | number, defaults to 0 | min/max | client | fix: empty ≠ 0 |
| date / datetime | date only | native | none | none | keep |
| boolean | yes | Select No/Yes | — | — | keep; CSV stores `"false"`, which reads as truthy (DM-14) |
| select | no (Products only) | Select | in options | client | no options editor |
| multiselect | no | **text input → corrupts arrays** | none | none | fix or hide (UI-07) |
| image | yes | Assets picker | none | none | keep; add alt + missing-media state |
| file, color | no | text | none | none | hide |
| url, email | no | typed inputs | format | client | not addable; decide |
| reference | **yes** | **raw id text box**; nothing resolves it | none | none | **declared, not built** (DM-11, UI-05) |
| slug | yes (UI only, not in the type union) | text | none | none | make it a real type with format + uniqueness (CMS-09) |
| required (any type) | yes | " *" text | empty check | client, at publish | server must enforce |
| multi-reference | — | — | — | — | does not exist |

- **System fields.** `id` is generated client-side and accepted as the DB PK. `createdAt` / `updatedAt` use two clocks. `status` is `draft|published|archived` in the engine but `DRAFT|PUBLISHED` on the server, so archived is lost. `publishedAt`, `createdBy` and `updatedBy` exist only in the engine (DM-13).
- **Relationships.** Collection → entries cascades on delete. Nothing else.

### 3b. Defects in the model

- **Schema defined 3×.** The engine TS union (15 types), the UI list (9, including a non-member `slug`) and a passthrough shared Zod (`type: z.string()`); Prisma stores `Json`. This violates the root CLAUDE.md rule that shared schemas are the SSOT (DM-13).
- **IndexedDB unique index on `slug` across all sites** in the browser. A second site's `products` collection fails to create or hydrate (DM-06).
- **Legacy rows with no `siteId`** show on every site (DM-20).
- **Deleted fields leave their values** in every record and resurrect if the key is reused (DM-16).
- **No size caps or plan limits** (DM-12).
- **No localization** (DM-21). Decide before the Zod SSOT hardens.

### 3c. Persistence and sync (the root cause)

| Question | Answer |
|---|---|
| Source of truth | none. IndexedDB for edits and static publish; Postgres for dynamic pages and share drafts (DM-01, BD-07) |
| Pull from server | once per editor mount (and after CSV import) |
| Conflict handling | whole-row last-write-wins, no precondition (DM-03) |
| Deletes | never removed locally; a stale session recreates them on the server (DM-04) |
| Rename field key | local records migrated **without an event**, so the server keeps old keys and every dynamic page collapses to one path (DM-02; hand-verified: `CollectionManager.ts:236-251` writes via `Storage.saveContentItem`, and `useCmsSync.ts:91-98` only listens to emitted events) |
| Retry queue | in memory; lost on reload (DM-05) |
| Slug clash on server | untranslated 500, retried forever; the collection's records are stranded (DM-07) |
| Sanitized value | server strips markup and never writes the result back (DM-10) |

---

## 4. Pages ↔ CMS ownership map (Phase 6)

| Capability | Owner today | Proposed primary owner | Secondary entry | Context passed | Return path |
|---|---|---|---|---|---|
| Mark a page as a collection template | CMS picks a page **by file name** | **Pages**: page type "Collection template · <Collection>" with a badge | CMS › Pages tab ("Template: <page> · Open") | pageId (not file name) | canvas on that page → Pages |
| URL pattern | CMS (behind ⋯) | CMS › Pages tab | Pages template row shows the pattern read-only | collectionId | "Edit in CMS" opens the CMS Pages tab |
| SEO title/description per record | server columns, **no UI** (BD-05) | CMS › Pages tab (patterns, default `{title}`) | Page settings of the template page shows "SEO comes from <Collection>" | collectionId | — |
| Canonical / OG per record | inherited from the unpublished template (BD-05) | server regenerates per record | — | — | — |
| List of generated routes | CMS (local) + Pages (server count, no list) | **Pages**: template row expands to its routes (read-only) | CMS Pages tab | collectionId | click a route → record panel |
| Record preview on the template page | modal, saved data only | canvas **record switcher** on a template page ("Previewing: <record> ▾") | record panel "View on page" | recordId | back to the record |
| Links to a record's page | none; typed URLs break (BD-12) | Inspector › Link › "Collection page" + `{{item.url}}` inside lists | — | collectionId + recordId | — |
| Redirects when a record slug changes | none (BD-28) | server writes Redirect rows | — | — | — |
| Delete the template page | Pages, unguarded | Pages guard: "Template for <Collection> — N record pages will stop publishing" | — | — | — |
| Home page as template | allowed; ships raw `{title}` (BD-04) | blocked | — | — | — |

Rule: **Pages never manages records. CMS never manages page structure.** Today CMS picks, hides and routes pages while Pages doesn't know. The proposal reverses that.

---

## 5. Binding architecture (Phase 7)

### 5a. Binding map today

| Binding | Live? | Source → target | Main defects |
|---|---|---|---|
| Field → text (`content`) | live | Inspector › Content | on every element type, overwrites containers' children (BD-11); resolves "most recently edited published record" (BD-09, CMS-04); inside a list, same record N times (BD-01) |
| Field → `src` / `href` | live | same, picked by element type | no type filter; button URL, video src, alt and title unbindable |
| Collection list `{{item.*}}` | live | Inspector › Collection + typed text | "All" = 50 (BD-08); no sort, filter or empty state; nested lists broken (BD-17); attributes ship literal placeholders (BD-19) |
| Template page `{field}` | live | implicit | replaces **any** `{word}` on the page (BD-13); home-page template ships tokens (BD-04) |
| `{{site.*}}` | live | typed | text only; braces show on the canvas (BD-24) |
| Visibility condition | stored, **inert** | CMS › Data › Conditions | nothing reads the attribute (BD-10, hand-verified) |
| engine/data Style / Trait / Text bindings, TemplateEngine, DataBindResolver, `repeat:"self"`, ExportModal CMS mode | **dead** | — | delete (BD-25) |

**11 doors create or remove bindings. There are 2 engines and 6 syntaxes.**

### 5b. Proposed binding model

1. **One engine:** `engine/cms`. Delete engine/data's binding managers, TemplateEngine and DataBindResolver, and the product blocks' inert `data-bind`.
2. **One picker, three contexts,** chosen automatically:
   - **Inside a Collection list** → "Current item" (binds per clone; fixes BD-01).
   - **On a template page** → "This page's record" (preview record comes from the canvas record switcher).
   - **Elsewhere** → "Specific record ▾" (explicit `itemId`; no implicit "first").
3. **Slots, not properties.**
   - The Inspector shows only slots the element has: Text, Link URL, Image src, Image alt, Video src.
   - Each slot lists only compatible field types.
   - Container, section and form elements get **no** Content binding.
   - The allowed set already exists as `BINDABLE_TYPES` (`standaloneActions.ts:18`).
4. **Bound state is visible** in three places: a Layers badge, a canvas outline, and the Inspector slot chip "Title · Blog ▾ × ".
   - Unbind restores the element's pre-bind value.
   - Every unbind is undoable.
5. **Empty value:**
   - Canvas shows the fallback, or a dimmed "Empty · Title".
   - Publish writes the fallback, or `""`, **never the stale stored text** (BD-03).
   - Pre-publish lists "N bound elements have no value".
6. **Rename/delete:**
   - Field delete is blocked while bound (exists). Collection delete gets the same guard (CMS-06).
   - Deleting an element removes its bindings (BD-22).
   - Duplicating an element or page copies its bindings (BD-06).
7. **Tokens:**
   - The template page uses a namespaced token written only by the resolver (e.g. `{{bk:title}}`), so author copy with braces survives.
   - `{{item.url}}` is computed from the collection's URL pattern with the server's `slugify`.

---

## 6. Findings by area (Phases 8–23)

Severity: **P0** = wrong content published, data loss or security. **P1** = broken feature or silent failure. **P2** = friction or debt.
Full evidence for every row is in the source reports; the key file:line is repeated here.

### 6a. P0 — data integrity and published output

| ID | Finding | Evidence | Decision |
|---|---|---|---|
| DM-01 / BD-07 | Publish renders static bindings and lists from the publishing browser's IndexedDB, and dynamic pages from Postgres | `CMSBindingManager.ts:147,161`; `RepeaterRenderer.ts:103-107`; `exportPublishPages.ts:126` vs `cms.service.ts:489-493` | **CHANGE: server data is the only publish source.** Seam already exists: `getPublishedCmsForBindings` (`cms.service.ts:527`), used by share drafts |
| DM-02 | Field key rename never reaches server records; dynamic pages collapse onto one path | `CollectionManager.ts:236-251` (no emit); `useCmsSync.ts:91-98` | **CHANGE:** server `renameField` mutation, migrated in one transaction |
| DM-03 | Concurrent record and schema edits overwrite silently | `cms.service.ts:117-121,159-163` | **CHANGE:** `version` precondition → 409; per-field schema ops |
| DM-04 | Deletes don't propagate; stale sessions recreate deleted rows | `cmsSync.ts:122`; `cms.service.ts:159-162` | **CHANGE:** tombstones (`deletedAt`), hydrate deletes, upsert refuses tombstoned ids |
| BD-01 | A "From CMS" binding on a list child publishes one record N times and destroys `{{item.x}}` | `RepeaterRenderer.ts:240-248`; `CMSExportResolver.ts:85-106`; `CMSBindingManager.ts:227` | **CHANGE:** "Current item" context (§5b.2) |
| BD-02 | Every internal link on a generated record page 404s: relative `about.html` from `<slug>/index.html` | `ExportEngine.ts:168-181,924-927`; `cms.service.ts:509-510` (hand-verified) | **CHANGE:** root-absolute page hrefs in export |
| BD-03 | An empty binding at publish keeps stale text, so unpublished or deleted content ships | `CMSExportResolver.ts:100-103` | **CHANGE:** write fallback / `""` + pre-publish warning |
| BD-04 | Home page as template ships raw `{title}` tokens | `DynamicPagesPane.tsx:156`; `cms.service.ts:585-588` | **CHANGE:** exclude home from the picker; server refuses |

### 6b. P1 — broken or silent

| Area | IDs | One-line |
|---|---|---|
| Record save | CMS-01, UI-02, UI-01 | the retry creates blank records; 3 unguarded exits lose edits; a sorted table crashes on collection switch |
| Collection create | CMS-02, CMS-03, UI-08 | "page per entry" broken on arrival; two field paths disagree; empty records possible |
| Validation | DM-09, CMS-07, BD-14, DM-18 | the server validates nothing; duplicate record slugs; URL collisions and empty slugs; the pattern isn't path-checked |
| Sync robustness | DM-05, DM-06, DM-07, DM-10 | in-memory retry queue; cross-site IDB slug index; untranslated slug clash; sanitized value not written back |
| Publish status | DM-08 | CMS edits don't mark the site as edited; the approval gate is bypassed |
| Field types | DM-11/UI-05, UI-06, UI-07 | reference not built; rich text fake; multiselect corrupts data |
| Limits | DM-12 | no plan limits or size caps; share draft caps at 10k while publish doesn't |
| Bindings | CMS-04/BD-09, CMS-05, CMS-06, BD-05, BD-06, BD-08, BD-10, BD-11, BD-12, BD-13, BD-15 | implicit record hops on every save; collection delete orphans bindings; record pages have an empty `<title>`; unbound list ships placeholders; "All" = 50; conditions inert; bindings on containers; record links break; `{word}` blanked; >1M bindings dropped silently |

### 6c. P2 — friction, gaps, debt (grouped)

| Area | IDs |
|---|---|
| Record table (Phase 8) | UI-11 (no selection, bulk or export), UI-03 (stale rows, no loading), CMS-22, UI-17 (a tab stop per row, 16px sort heads) |
| Record editor (Phase 9) | UI-16 (dialog a11y), UI-13 (3 save models), UI-09 (undo re-creates with a new id), CMS-11 (sheet covers table + duplicate tabs), UI-21 (can't see the page while editing) |
| Schema (Phase 5/9) | CMS-09, CMS-20, UI-10 (no reorder, fake handle), UI-15 (display field, defaults, help, unique), UI-24, DM-16 |
| Search / filter / sort (Phase 10) | search = substring over every field of the current collection only, not persisted; no filter; sort single-key, unpersisted; ⌘K searches records by first text value (CMS-16) |
| Import / export (Phase 13) | DM-14/UI-12 (two paths, no coercion, no preview for JSON, no rollback), DM-15 (CSV rows invisible until reload), no export |
| Publishing (Phase 14) | DM-13 (archived lost), BD-27 (rollback resurrects withdrawn records), BD-28 (no redirects), DM-17 |
| Permissions (Phase 16) | server enforcement **good** (reads need any member, writes need EDITOR+, bearer tokens rejected). Gaps: no read-only CMS UI below EDITOR, VIEWER ⌘K dead rows (UI-18), revoked mid-edit = queue retries forever while the UI stays editable |
| Collaboration (Phase 17) | no presence, conflict detection, record locks or remote refresh; bindings not in the collab op stream; last-write-wins everywhere (DM-03) |
| Activity (Phase 17) | no ActivityLog, undo or versions for CMS; hard deletes (DM-19) |
| Navigation (Phase 21) | no deep link (UI-23); Dynamic pages + Settings behind ⋯ (CMS-12); "Used by" not navigable (CMS-08); banner has no door to the record (CMS-13); workspace root blank (CMS-21); duplicate doors (CMS-15); Pages "+N" opens one collection (CMS-23) |
| Cognitive load (Phase 19) | vocabulary: CMS / Content / record / entry / item / row / "complete record" / build vs publish; Conditions + Sources inside CMS; two `useContentPanel` instances (UI-22) |
| DS / UI quality (Phase 22) | chrome-ui use is **good** (no flowbite imports, no raw natives, no hex). Debt: hand tablist, copy-pasted table and CONTROL recipes, `KEY_RE`×2 / `slugify`×3 / `isEmpty`×2 / `plural`×2, raw `red-200` / `white`, banned `../../../engine` imports, Title Case in ecommerce modal (UI-19, UI-20) |
| Dead code | BD-25, BD-29, DM-17, ExportModal CMS selector |
| Ecommerce | BD-26 (Products collection wired to nothing) |
| Localization | DM-21 |

---

## 7. States model (Phase 18)

| State | Trigger | Today | Proposed feedback | Actions | Data safety |
|---|---|---|---|---|---|
| Loading (workspace) | open / switch collection | none; stale rows flash | table skeleton, 28px rows | — | don't render the previous collection's rows |
| Empty: no collections | new site | drawer ok, workspace blank | workspace root = collections overview with "New collection" | Create, Import CSV | — |
| Empty: no fields | new collection | header-only table; Save enabled | "Add a field to start" | + Add field | block Save |
| Empty: no records | — | ok | keep | Add, Import | — |
| No results | search | ok | + "Clear search" | — | — |
| Saving / Saved | save | button disabled, toast, sheet closes | inline "Saving…" → "Saved · 2s ago"; the panel stays open | — | — |
| Unsaved | edit | guarded on 5 of 8 exits | guard every exit (UI-02) | Keep editing / Discard | no silent loss |
| Validation error | publish-on with missing required | required only | per-field `aria-invalid` + message, checked on server too | fix | draft saved, never blank dupes |
| Save error | network / 5xx | inline + Retry (creates dupes) | Retry updates the same record | Retry | idempotent |
| Conflict | 409 version mismatch | **none** | "Changed by <name> 1 min ago" · Review changes / Overwrite / Discard mine | 3 | nothing lost silently |
| Offline | no network | silent local write | Topbar pill "Offline · N changes pending"; publish disabled | — | persistent outbox (DM-05) |
| Sync failed | mirror error | toast "didn't sync" forever | pill + "View N unsynced"; terminal errors named | Retry / Discard | — |
| Read-only | role < EDITOR / revoked | workspace hidden / UI stays editable | read-only workspace, banner "View only" | — | no local-only edits |
| Permission revoked mid-edit | 403 | infinite retry | switch to read-only, keep the draft for copying | Copy values | — |
| Deleted elsewhere | tombstone | row persists and republishes | "This record was deleted by <name>" · Restore / Close | — | — |
| Missing media | 404 image | broken `<img>` | placeholder + "Missing image" + Replace | Replace | — |
| Deleted reference | dangling id | raw id | "Deleted record" chip + Clear | Clear | — |
| Missing template | template page deleted | DP pane "missing" | same + a Pages guard beforehand | Pick page | — |
| Importing / partial / failed | import | per-row errors, no rollback | preview → progress → "N imported, M skipped" + Undo import | Undo | transactional |
| Empty binding | bound field empty | stale text ships | dimmed "Empty · Title" on the canvas; pre-publish warning | Set fallback | — |
| Needs site publish | record published after the last site publish | invisible | record chip "Published · not live yet" + Topbar "Unpublished changes" | Publish site | — |

---

## 8. Surface architecture (Phase 20)

| Job | Frequency | Canvas dependency | Proposed surface |
|---|---|---|---|
| Pick a collection | high | none | left drawer (keep) |
| Scan and manage records | high | none | **workspace, full width** (keep); decoupled from drawer collapse |
| Edit one record | high | wants to see its page | **right-docked record panel (480px)** over the workspace table, *not* covering it; "View on page" swaps the workspace for the canvas with the panel still docked |
| Edit schema | low | none | workspace Fields tab + right FieldInspector (keep) |
| URL pattern / SEO / template | low | template page | workspace **Pages** tab (promote out of ⋯) |
| Collection settings | rare | none | workspace Settings tab (promote out of ⋯) |
| Bind an element | high | yes | Inspector slot pickers (not CMS) |
| Preview a record on its template | medium | yes | canvas record switcher on template pages |
| Import / export | rare | none | modal from workspace header ⋯ (Import CSV, Import JSON, Export CSV, Export JSON) |
| Create collection | rare | none | one modal, same field path as Add field |
| Delete collection / field | rare | none | typed-confirm modal listing records, pages **and bindings** |

---

## 9. Decisions by bucket (Phase 24, items 25–31)

**KEEP**
- drawer as the collection chooser;
- full-width workspace;
- Records / Fields tabs;
- FieldInspector;
- Add field modal (as the only field path);
- Typed DELETE;
- field-delete guard;
- CSV preview;
- server permission model;
- chrome-ui usage;
- ⌘K record jump;
- Collection list block;
- Variables (pending PD-4).

**MOVE**
- Conditions → Inspector › Visibility (and make them work), pending PD-3;
- template-page declaration → Pages page type;
- record preview → canvas record switcher;
- Dynamic pages + Settings → first-class workspace tabs.

**MERGE**
- setup-modal field creation into the Add-field path (CMS-03);
- JSON import into the server CSV path;
- the 4 display-field fallbacks → one `displayField`;
- the 2 `useContentPanel` instances → one store;
- ⌘K "Manage CMS records" into "Open CMS";
- banner Unbind + Inspector Static → one undoable unbind;
- two "New collection" buttons → one per screen.

**SPLIT**
- record sheet: stop carrying collection tabs (CMS-11);
- `useContentPanel`: split Data (variables) from collections.

**MAKE CONTEXTUAL**
- binding picker by context (list item / template record / specific record);
- Content slot only on bindable element types;
- "View on page" from a record;
- "Used by" rows jump to the element.

**ESCALATE (build properly)**
- server publish authority;
- versioning + tombstones;
- server validation;
- Zod SSOT;
- bulk actions;
- export;
- display field;
- field reorder;
- SEO patterns;
- redirects on record slug change;
- activity log + soft delete;
- conflict UI;
- read-only mode.

**ESCALATE (added D4–D6)**
- per-collection sources (Buildrik, CSV/JSON, Google Sheets, Airtable, Custom API/JSON URL) with mapping, key field, sync, history;
- Views (named filters) per collection;
- collection constants;
- Inspector › Visibility that works;
- CMS management table.

**REMOVE**
- engine/data binding managers, TemplateEngine, DataBindResolver + `data-bind`, `repeat:"self"`, ExportModal CMS mode (BD-25);
- today's site-level pasted-JSON Sources and the inert Conditions drill-in (replaced by §2c, not dropped);
- the fake drag handle;
- decorative step chips;
- false copy (CMS-13, UI-14);
- the "Default" collection option.

**PRODUCT DECISION** — §12.

---

## 10. Proposed hierarchy and workflows (Phase 24, items 32–35)

### 10a. Hierarchy

```
Rail · CMS (D)
└─ Drawer: Collections (list: source icon, count, sync dot) · + New collection · Site data (site variables)
   └─ Workspace (full width; survives drawer collapse; deep-linked ?cms=<col>&tab=<t>&record=<id>)
      Root (no collection): management table — Collection · Source · Records · Last sync · Pages · Used by · ⋯
      Header: <Collection> · source badge · N records · [primary for tab] · ⋯ (Import / Export / Sync now)
      Tabs: Records · Fields · Source · Views · Pages · Settings
      ├─ Records: toolbar (search · Status filter · Columns) · table (checkbox, title, ≤N columns, status, updated) · bulk bar
      │   └─ Record panel (right dock 480px): fields by order · status · Save · ⋯ (Duplicate, View on page, Delete)
      ├─ Fields: table (drag reorder) + FieldInspector (name, key, type, required, unique, default, help)
      ├─ Pages: Generates pages [on/off] · URL pattern · Template page (from Pages) · SEO title/description patterns · route list
      ├─ Source: type · connection · mapping (column → field, key field) · schedule · last sync report · Sync now · history
      ├─ Views: list of named filters · rule builder (field · operator · value, AND/OR) · sort · limit · live match count
      └─ Settings: name · slug · title field · Constants ({{collection.x}}) · danger zone (records, pages, bindings counted)
Inspector (element selected)
├─ Content slots (Text / Link / Image / Alt …) → Source: Static | Current item | This page's record | Record ▾
├─ Collection list → Collection · View (All / <View>) · Show N
└─ Visibility → Show when <field / site var> <operator> <value>
Pages
└─ Template page row: badge "Collection template · Blog" · expands to N routes · guarded delete
Canvas (template page)
└─ Record switcher "Previewing: <record> ▾"
```

### 10b. Collection workflow (target: 4 steps)
1. **New collection.** Step 1: pick the source (Buildrik · CSV/JSON · Google Sheets · Airtable · Custom API). Step 2: name it. Buildrik/file: a title and slug field are created automatically. External: connect → pick table → map columns (types suggested from sample rows) → key field → first sync runs.
2. **Add fields.** One dialog, all supported types.
3. **(Optional) Pages tab.** Turn on "Generates pages", pick the template page (only non-home pages not already used), set the pattern (default `/<collection-slug>/{slug}`) and the SEO patterns (default `{title}`).
4. **Add records.**

### 10c. Record workflow (target: 4 steps)
1. **Open the record** from a row, ⌘K or "Used by".
2. **Edit.** Per-field validation runs live.
3. **Save.** The record stays open, shows "Saved", and is version-checked.
4. **Toggle Published.** The chip reads "Published · not live until site publish". The Topbar shows unpublished changes.

Bulk: select → Publish / Unpublish / Delete (with Undo) / Export.

### 10d. Schema workflow
- **Add field:** one path.
- **Rename:** name is free; changing the key runs the server `renameField` with a confirm ("moves values in N records").
- **Type change:** confirm + convert, or block when data can't convert.
- **Required on:** shows "N records will stop being publishable".
- **Reorder:** drag, which drives record panel order.
- **Delete:** blocked while bound; otherwise a confirm that also clears stored values.

### 10e. Binding workflow
1. Select an element.
2. In the Inspector slot, choose the source: the context default is preselected.
3. Pick a field; the list is filtered by slot type.
4. The bound chip appears in the Inspector and the Layers badge appears.
5. Unbind restores the original value and is undoable.

---

## 11. CODE PLAN — do this first (Phase 25, after approval)

Every wave ends with a **done-condition checked in the running app** (root CLAUDE.md "Work against a stated goal"). Unit suites are regression nets, not proof.

### C0 — Data authority (P0; nothing else ships before this)

**Split (founder, 2026-09-28, D3):** **C0a** = C0.1–C0.5, C0.9–C0.12 on `feat/cms-c0` from main (worktree `~/Desktop/buildrik-worktrees/cms-c0`). **C0b** = C0.6, C0.7, C0.8, stacked on `feat/insp-w1` (Inspector v4), because that lane already rewrites `ContentSection`, `CollectionListSection`, `BindingBanner`, `CMSBindingManager` and `ExportEngine`. C0a must not edit those five files: C0.1 injects the server snapshot through `CMSExportResolver` / `RepeaterRenderer`, not through `CMSBindingManager`.

| # | Change | Files | Done when (observable) |
|---|---|---|---|
| C0.1 | Publish resolves static bindings + lists from **server** data. Before export, fetch a server snapshot (extend `getPublishedCmsForBindings` to include list-bound collections) and feed it to `CMSExportResolver` / `RepeaterRenderer` instead of IndexedDB. Block publish while hydrate status is `error` | `exportPublishPages.ts`, `CMSExportResolver.ts`, `RepeaterRenderer.ts`, `cms.service.ts:527`, `routers/cms.ts` | Delete a record in browser B → publish from browser A (stale) → the live list and bound heading don't contain it |
| C0.2 | `cms.fields.rename` server mutation: migrate `data` keys + `pageSlugPattern` + `displayField` in one `$transaction`; the engine calls it, then rehydrates | `cms.service.ts`, `CollectionManager.ts:236-251` | Rename key `title→name` → DB entries carry `name` (SQL) → dynamic pages keep distinct paths |
| C0.3 | `version Int` on `CmsCollection` + `CmsEntry`; upserts require `expectedVersion` → `CONFLICT`; schema ops per field (`addField` / `updateField` / `removeField`) replace the whole-array upsert | Prisma migration, `shared/schemas/cms.ts`, `cms.service.ts`, `cmsSync.ts` | Two tabs edit the same record → the second save shows the conflict state (§7), nothing overwritten |
| C0.4 | Tombstones: `deletedAt` on both models; hydrate removes local rows the server no longer has; upsert refuses a tombstoned id | Prisma, `cms.service.ts`, `cmsSync.ts:122` | Delete in tab A → reload tab B → gone; editing it in a stale tab B shows "deleted by …" |
| C0.5 | Persistent outbox in IndexedDB; in-flight ops count as pending; flush on mount before hydrate | `syncRetryQueue.ts`, `StudioHeader.tsx:577` | Go offline, edit, reload, go online → the change reaches the DB |
| C0.6 | Root-absolute page hrefs in export (`/about.html`) | `ExportEngine.ts:924-927` | Generated record page nav links resolve (curl the deployed or preview HTML) |
| C0.7 | Empty binding at publish writes fallback / `""`; pre-publish check lists empty bound elements | `CMSExportResolver.ts:100-103`, `publish.service.ts` pre-checks | Unpublish the only record → publish → heading shows the fallback, and pre-publish lists it |
| C0.8 | List-child binding = current item (per-clone) | `CMSBindingManager.ts`, `RepeaterRenderer.ts:240-248`, `ContentSection.tsx` | 3-record list, bind the child heading via Inspector → 3 distinct titles on canvas and publish |
| C0.9 | Home page excluded as template (client + server) | `DynamicPagesPane.tsx:156`, `cms.service.ts:585` | Home not in the dropdown; a crafted save is refused |
| C0.10 | Bump `Site.lastEditedAt` on every CMS mutation | `cms.service.ts` | Edit a record → Topbar shows unpublished changes; the approval gate re-arms |
| C0.11 | The local-recovery banner must not offer a device copy older than the server's saved version (RT-10) | project recovery (editor shell) | Save, reload → no "Keep changes" offer; a genuinely newer local copy is still offered |
| C0.12 | A failed save never says "saved" (RT-01): one toast, the sheet stays open with Retry | `RecordSheet.tsx`, `useCmsSync.ts` | Block the network → save → one error, sheet open, no success toast |

### C1 — Correctness (P1)
- **Record save.**
  - Retry updates the created id (CMS-01).
  - Guard every exit through one `cmsWorkspace.navigate` (UI-02).
  - Key `RecordsTable` by collection (UI-01).
  - Block Save with 0 fields (UI-08).
- **One field-creation path:** the setup modal reuses the AddField logic, auto-creates title + slug fields and sets `displayField` (CMS-02, CMS-03).
- **Shared validator** in `packages/shared/schemas/cms.ts` (Zod SSOT for `CMSField`/type/status, DM-13), used by the engine **and** by the server on PUBLISHED upserts. It covers required, types, min/max, pattern, unique field keys, unique record slug per collection and non-empty generated slug (DM-09, CMS-07, BD-14, DM-18).
- **Sync fixes.**
  - IDB index `[siteId, slug]` with a `DB_VERSION` bump (DM-06).
  - P2002 → CONFLICT + adopt the server id (DM-07).
  - Write back the sanitized `data` (DM-10).
  - `refreshFromStorage` after CSV import (DM-15).
  - Legacy siteId migration (DM-20).
- **Field types (PD-1 = build):** Reference = record picker by display field + a 'Deleted record' state + resolution in bindings/lists (`{{item.author.name}}`) + a delete guard. Rich text = a real editor storing allow-listed HTML, sanitized to the same allow-list on the server (DM-10). Multiselect = a chips control storing arrays + an options editor. `file` / `color` stay hidden. Make `slug` a real type. Empty number ≠ 0.
- **Collection delete guard:** count bindings, block or unbind (CMS-06). Element delete removes its bindings (BD-22). Duplicate copies bindings (BD-06). Unbound list: pre-publish error and clear placeholders (BD-06, BD-19).
- **Bindings.**
  - Explicit record outside lists and templates (BD-09, CMS-04).
  - Slots gated by `BINDABLE_TYPES` + field-type filter (BD-11, CMS-19).
  - "All" = max (BD-08).
  - Namespaced template token (BD-13).
  - `{{item.url}}` (BD-12).
  - Bindings > 1M → client-visible refusal (BD-15).
- **SEO patterns** in the Pages tab; the server strips and re-emits canonical/OG per record (BD-05, UI-14).
- **Conditions + Sources (PD-3/5 = remove):** delete the drawer views, `DataManager` condition binding and pasted sources; strip stored `dataBindings.condition` on load.
- **Plan limits + size caps** (DM-12).

Done-condition C1: walk flows (a)–(g) of `04-cms.md §4` live, and each hits its target step count with no break.

### C2 — IA and workflow restructure
- Tabs Records · Fields · Pages · Settings, no ⋯ for them (CMS-12).
- Workspace decoupled from drawer collapse (UI-21).
- Deep link `?cms=&tab=&record=` (UI-23).
- Record panel right-docked 480px, not covering the table; no duplicate tab row (CMS-11); "View on page" (UI-21).
- Workspace root = collections overview (CMS-21). One `useContentPanel` store (UI-22).
- Table:
  - checkbox column + bulk bar (Publish / Unpublish / Delete + Undo);
  - status column;
  - Status filter;
  - Columns menu;
  - sort persisted per collection;
  - skeleton loading (UI-03, UI-11).
- Export CSV/JSON. Import: one server path, coercion by type, preview for both, required-missing count, Undo import (DM-14, UI-12).
- Schema: drag reorder, title-field select, default / help / unique, type-change confirm + conversion, Required impact count (UI-10, UI-15, CMS-20, UI-24).
- "Used by" rows navigate to page + element with Inspector › Content focused (CMS-08). Banner links to the record (CMS-13).
- Pages: template badge, routes list, guarded template delete; "+N" opens the right collection (CMS-23).
- Canvas record switcher on template pages.
- States from §7: conflict, offline, read-only, deleted-elsewhere, missing media, deleted reference, needs-site-publish.
- One save model: records use explicit Save that keeps the panel open; schema and settings autosave with a "Saved" tick (UI-13).
- Soft delete + restore-by-id; ActivityLog writes (UI-09, DM-19).

### C3 — Accessibility
- `role=grid` + roving tabindex on both tables.
- Sort heads ≥ 24px.
- Record panel focus in, trap and return.
- `aria-required` / `aria-invalid` / `describedby`.
- Live eligibility line.
- Image label + alt field.
- Published status text for screen readers.
- VIEWER ⌘K filter (UI-16, UI-17, UI-18).

### C4 — Cleanup
- Delete dead binding code (BD-25, BD-29, DM-17).
- Dedupe `KEY_RE` / `slugify` / `isEmpty` / `plural` / recipes into `cms/format.ts` + `paneStyles.ts`; chrome-ui `Tabs` in place of the hand tablist.
- Tokens in place of `red-200` / `white`. `@/engine` in place of `../../../engine`. Sentence case.
- One vocabulary:
  - **Collection · Field · Record · Published / Draft · Template page · Site publish.**
  - Drop "entry", "item" and "row" from UI copy.
  - Rename `ContentTab` / `useContentPanel` → `CmsDrawer` / `useCmsPanel`.
- Ecommerce: wire product blocks as Collection lists over Products, or drop the prompt (PD-6).
- Rewrite tests that pin old behaviour in the same commit (editor CLAUDE.md loop step 4).

### C5 — Collection management: sources, Views, constants, visibility (D4–D6)
Runs after C1 (needs the shared validator + tombstones) and alongside C2 (needs the tabs).
- Prisma: §2c data model additions. Migration + `prisma migrate deploy` in prod.
- Server: `server/services/cms-source.service.ts` (one file, one adapter function per source; lazy-init clients), `cms-view.service.ts` or inside `cms.service.ts` if small; router `cms.sources.*`, `cms.views.*`. Sync = fetch → map → validate → upsert by `externalId` in a transaction → tombstone missing → write `CmsSyncRun`.
- OAuth: Google Sheets (added scope) and Airtable connect routes under `app/api/integrations/<provider>/`, tokens encrypted with `ENCRYPTION_KEY`, stored in `WorkspaceIntegration`.
- Cron: `/api/cron/cms-source-sync` (CRON_SECRET) runs due collections.
- Custom API: SSRF guard as in §2c; tests for private IPs, redirects, size and timeout.
- Editor: management table (root), Source tab (setup wizard + report + history), Views tab (rule builder with live count), Settings › Constants, read-only record panel for external sources, Collection list View picker, Inspector › Visibility, drawer source icons.
- Shared: one filter evaluator in `packages/shared` used by canvas and publish.
- Done when (live, qa workspace): a Google Sheet, an Airtable table, a public JSON URL and a CSV each become a collection, records appear typed, a row edited at the source shows after "Sync now", a row deleted at the source disappears, a failing URL shows "last sync failed" with the reason, a View filters a published list, `{{collection.currency}}` renders on the template page, and Inspector visibility removes an element from published HTML.

### Verification gates for the whole code phase (Phase 26)
- The live 1440×900 walk of every collection, record, field-type, binding, reference (if built), search, filter, sort, bulk, import/export, publish, permission (EDITOR + VIEWER accounts) and error-state flow, recorded in a runtime ledger.
- Two-browser tests for C0.1, C0.3 and C0.4.
- A real preview deploy for C0.6 and BD-05, with the HTML fetched and checked.
- `npx tsc --noEmit` exit code read directly (not through a pipe); `npx vitest run` for `editor/cms`, `engine/cms`, `server` CMS tests; `pnpm run verify:ds`.
- A status ledger per feature: **DESIGNED / IMPLEMENTED / FUNCTIONALLY VERIFIED / RUNTIME VERIFIED / PARTIALLY VERIFIED / NOT VERIFIED.** Nothing is called done because the screen exists.

---

## 12. Open product decisions (Phase 24, item 36)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| PD-1 | Reference / multi-reference, rich text | build now · hide until built | **Hide now, build after C2.** A fake type corrupts data; a missing one doesn't |
| PD-2 | Record publish model | keep "record Published + site publish required" · per-record live publish | **Keep**, but make the status honest ("not live until site publish") |
| PD-3 | Visibility conditions | — | **DECIDED (D5):** per-collection Views + Inspector › Visibility |
| PD-4 | Site variables home | — | **DECIDED (D6):** site variables in CMS "Site data" + collection constants `{{collection.x}}` |
| PD-5 | Sources | — | **DECIDED (D4):** per-collection source, all five: Buildrik, CSV/JSON, Google Sheets, Airtable, Custom API/JSON URL |
| PD-12 | External-source record status | all published · mapped boolean column | founder picks; default all published |
| PD-13 | Sync schedule options | off / hourly / daily · also 15 min | default off / hourly / daily |
| PD-6 | Ecommerce Products collection | wire product blocks · drop the prompt | **Drop the prompt** until ecommerce is scoped |
| PD-7 | Collaboration depth for CMS | version-conflict only · presence + locks | **Conflict-only** in C0; presence when the collab flag ships |
| PD-8 | Localization | design `data[locale]` now · later | **Reserve the shape in the Zod SSOT now**, no UI |
| PD-9 | Plan limits for CMS | numbers per FREE/PRO/BUSINESS | founder sets the numbers |
| PD-10 | Record editor surface | right-docked panel · keep full overlay · full page | **Right-docked 480px panel** |
| PD-11 | Template page ownership | Pages page type · keep CMS pointer | **Pages page type**; CMS points at a pageId |

---

## F. FIGMA PLAN — do this after the code phase is runtime-verified

The file is `g4GzQFqzNYz5sosz1QtZXC`; the source of truth is the page `4418:45431` (Editor v3 · IA). Precedence from the editor CLAUDE.md: **behaviour → the code contract; everything visual → the board.** This phase conforms boards to the *fixed* code, then any visual deltas go back into code by the per-board loop (`figma:figma-design-to-code` → build → side-by-side at 1440×900).

Tooling: if the Figma tools are missing, use `scripts/baseline/figma-mcp.mjs` **with** the `X-Figma-Plugin-Bundle` header (30 tools including `use_figma`). Load `figma:figma-use` before every write. Read every write back. Budget: 200 calls/day, 15/min, shared (memory `figma-mcp-daily-call-budget`).

### F1. Boards to update (they exist)

| Board | Node | Change |
|---|---|---|
| Records table | `4428:143182` | checkbox column, status column, toolbar (search · Status · Columns), 28/32px rows per DESIGN.md §Row Density (**not 40**), bulk bar variant |
| Record sheet → record panel | `4428:144760` | right-docked 480px over the table; no tab row; Saved state; ⋯ (Duplicate, View on page, Delete) |
| Fields | `4428:147552` | drag handles (real), title-field marker, Required impact line |
| Add field | `4418:164208` | only the supported types (per PD-1); slug as a real type |
| Reference configuration | `4418:164254` | mark `design-ahead` or remove per PD-1 |
| New collection modal | `1170:4713` | drop the step chips; name only + auto title/slug note; sentence case |
| Inspector v4 · CMS-bound heading | `7995:205467` | slot chip + source (Current item / This page's record / Record ▾) |
| Inspector v4 · Collection list | `7995:204147` | sort, filter, limit ("All" explicit), empty-state slot |
| Inspector v4 · CMS source missing | `7995:205787` | empty-binding state with fallback |
| Content · root / empty / loading / load-error | `148:2`, `149:7`, `775:4241`, `453:4010` | drawer copy: "Collections" + "Site data"; remove Sources/Conditions per PD-3/5 |
| Content · conditions / data-sources | `151:87`, `151:46` | retire; replaced by the Views tab, Source tab and Inspector › Visibility boards (F2) |

### F2. Boards to create (on page `4418:45431`, CMS section)

1. Workspace root: collections overview (replaces the blank pane).
2. Records: loading skeleton · no fields · no results · bulk-selected (3) · bulk delete confirm + Undo toast.
3. Record panel states: saving · saved · validation error (field-level) · save error + Retry · **conflict** · **deleted elsewhere** · read-only · missing media · deleted reference.
4. Pages tab: generates pages off / on · pattern error · template missing · SEO patterns · routes list.
5. Settings tab: title field select; danger zone with records / pages / bindings counts.
6. Import: preview (mapping + required-missing count) · progress · partial result + Undo import. Export menu.
7. Offline / sync pill in Topbar: offline · N pending · sync failed.
8. Pages drawer: template-page row with badge + expanded routes; guarded template-delete modal.
9. Canvas: record switcher on a template page.
10. Field-type change confirm; key-rename confirm ("moves values in N records"); collection delete blocked by bindings.
11. CMS root **management table** (5 collections, one per source type, one failed sync).
12. New collection modal step 1: source picker (5 options).
13. Source tab per type: Buildrik · CSV/JSON (upload, map, preview) · Google Sheets (connect, spreadsheet + tab, map, key) · Airtable (connect, base, table, view, map, key) · Custom API (URL, auth header, JSON path, pagination, test request result, map, key). Plus states: syncing · synced (report) · partial (row errors) · failed (reason) · disconnected · history list.
14. Read-only record panel for an external source ("Edit in the sheet ↗").
15. Views tab: list · rule builder (AND/OR) · live match count · empty.
16. Settings › Constants.
17. Inspector › Collection list with View picker; Inspector › Visibility "Show when" rule.
18. Pre-publish warning: stale / failed sync.

Every new board uses the existing CMS components on those boards and DESIGN.md values: Inter, `#1A56DB` single accent, 4px grid, 28/32px rows, `--bk-*` variables bound, no purple, no decorative shadows. Board sample data is illustrative; the shape is the contract.

### F3. Register and verify
- Add every new node to `scripts/conformance/boards.json` (family "CMS", status `active`, recipe null) in the same commit.
- Mark retired boards `retired` with a note that names this doc.
- Acceptance: each board screenshot beside the live screenshot at 1440×900, element or record selected where the board shows it. Not matching → fix. The conformance harness is a regression net only.
- Run the `flow-audit` skill over the CMS prototype links (no dead ends, back paths present).

---

## R. Runtime walk (2026-09-28, localhost:3000)

Test site `cmugopwzg005nnvjysp00b3pf` (E2E, 0 collections at start), headless Chrome at 1440×900. The `/browse` skill could not start (Aside not installed). All test data was deleted afterwards and verified at 0 rows in the DB. Evidence (shots, console, network) lives in the session scratchpad and was not committed.

**Prior P1s: all reproduce live.**

| ID | What reproduced |
|---|---|
| CMS-01 | 3 blank drafts on the server after 3 retries |
| CMS-02 | pattern saved as null |
| CMS-03 | two `title` fields and the key `bad_key!` stored |
| CMS-04 / CMS-19 | the field picker is not filtered by element type, and a bound heading shows an implicit record (first published) |
| CMS-05 | raw `{{item.title}}` shows; drafts render; the image slot can't be bound |
| CMS-06 | a collection delete orphans bindings; the canvas keeps showing the deleted records |
| CMS-07 | duplicate slugs accepted |

CMS-10 and CMS-14 also reproduce.

**Correction:** CMS-11's "floating button over Save" is the dev-only Agentation overlay (`components/agentation-wrapper.tsx`, development only). It is not a product bug. The sheet covering the table (1100×844) stands.

**New findings**

| ID | Sev | Finding | Plan slot |
|---|---|---|---|
| RT-01 | P1 | A failed save shows "didn't sync" **and** "Record saved… live in the CMS" together; the sheet closes as if saved | C0.5 / §7 save-error + sync states |
| RT-04 | P1 | Image "From URL" fails for every external host: the dashboard CSP `connect-src` blocks the client fetch, and the error blames the URL. Same-origin takes ~20 s | C1 (fetch server-side; honest error). Cross-module: `next.config.mjs` CSP + media import |
| RT-07 | P1 | CSV "Imported 4 of 4" and the rows stay invisible (confirms DM-15 live) | C1 |
| RT-10 | P1 | After "Saved" + reload, the local-recovery banner offers "Keep changes" from a device copy **16 min older** than the server. Keep was not tested | **C0** (editor-wide recovery must compare against the server version). Cross-module: project recovery, not CMS-only |
| RT-02 | P2 (1 of 2) | Published ON + Save → server kept DRAFT until the next save | C0.3 / C1 record save |
| RT-03 | P2 | Undo delete restores under a new id (confirms UI-09) | C2 soft delete |
| RT-05 | P2 | "From URL" in a record opens two stacked modals with canvas-image copy | C2 |
| RT-06 | P2 | Enter opens the sheet without moving focus, so Esc can't close it (confirms UI-16/17) | C3 |
| RT-08 | P2 | Imports untyped: `"false"` shows Yes, "abc" sits in a Number column (confirms DM-14) | C2 |
| RT-09 | P2 | image `src` / link `href` bindings don't repaint the canvas for >2.5 s; text binds instantly | C1 bindings |
| RT-11 | P2 | One collection create fires 3–5 concurrent upserts; 2 × HTTP 500 on the first try; a raw Prisma stack with server paths reached the browser console | C0.3 (dedupe + P2002 → CONFLICT) + server error redaction |
| RT-12 | P3 | Add-panel insert with a heading selected nests inside the heading; once bound, children vanish on the canvas | C1 (bindable types) / Add panel |
| RT-13 | P3 | Esc during canvas text edit discards the typed text silently | out of CMS scope (canvas) |
| RT-15 | P3 | A user field named "Published" collides with the record's Published switch and the table column | C1: reserve system names |

**Measured:** record rows 40px (DESIGN.md says 28/32, "never 40"), header 36px, table 1100px wide, columns 240/120/140/110/150; only 5 of 10 fields get a column.

**Doesn't exist live:** export, filters, multi-select, bulk actions. ⌘K finds records by title only. Reference is a text box, and Rich text is a textarea. (The runtime walk reported "no in-table search"; the code audit found search in the Topbar field while a collection is open. Re-check in C2.)

**Runtime NOT VERIFIED:** publish output (generated pages, BD-02 links, drafts excluded), `{{site.*}}` in the published HTML, file upload in the image picker, collaboration, screen readers, the name-clash dialog.

---

## Not verified (as of this proposal)

- Every DM and BD finding is from reading code. The four hand-verified P0s (DM-01, DM-02, BD-02, BD-10) are confirmed in source but **not** on a deployed site.
- BD-02 depends on standard relative-URL resolution at the host.
- BD-14 duplicate-path behaviour on Vercel is untested.
- Collaboration is untested (flag off).
- DM-06, the cross-site IDB clash, has not been reproduced live.
- The tRPC body-size limit, the effective cap for DM-12, has not been checked.

---

## Verification status of this audit

| Claim set | Level |
|---|---|
| CMS-01..07, 10, 14 | RUNTIME VERIFIED (2026-09-28, live app) |
| RT-01..15 | RUNTIME VERIFIED (RT-02 intermittent, RT-10 "Keep" path not exercised) |
| DM-01, DM-02, BD-02, BD-10 | CODE VERIFIED by hand; not runtime or deploy verified |
| Other DM / BD / UI findings | CODE-READ only (single agent read + file:line) |
| Publish output, collaboration, screen readers | NOT VERIFIED |
| Proposed architecture | DESIGNED (text only); nothing IMPLEMENTED |

## GSTACK REVIEW REPORT

| Run | Status | Findings |
|---|---|---|
| plan-design-review (scope A: live CMS audit) | DONE_WITH_CONCERNS | 12 P0 (DM-01..04, BD-01..04, C0.11/RT-10, plus confirmed CMS P1s escalated), ~35 P1, ~50 P2 across CMS / DM / UI / BD / RT |
| Mockups (Step 0.5) | SKIPPED | the founder sequenced design after code (Phase F) |
| Outside voices | SKIPPED | not requested; 4 independent agents + a hand re-check stood in |

Design completeness: current CMS **3/10**. Proposal as written **8/10**. The two missing points are the 11 open product decisions (§12) and the unbuilt state boards (F2).

VERDICT: do not redesign visuals yet. C0 (data authority) is a precondition for every other change.

Approved 2026-09-28: architecture + C0 start; PD-1 build, PD-10 right dock, PD-3/5 remove.

D4–D6 (2026-09-28): per-collection sources (all five), Views + Inspector visibility, collection constants + site variables → §2c, C5, F2 #11–18.

**UNRESOLVED DECISIONS:**
- PD-2, PD-6, PD-7, PD-8, PD-9, PD-11, PD-12, PD-13 (§12) — recommended defaults apply until changed; PD-9 needs founder numbers before C1 limits
