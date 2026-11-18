# CMS: Product + UX specification

## Run metadata
- **Date:** 2026-10-09
- **Mode:** `blueprint`
- **Arguments:** `cms`
- **Git ref (HEAD):** `98ca128b1`
- **Source audit commit:** `7a50e34e1` (`reports/editor-audit/02-issues.md`, 54 issues)
- **Drift check:** `git diff --stat 7a50e34e1 HEAD` over every CMS, engine, sync, server-CMS, publish, sites and shared-schema path shows three files, all in the brand theme toggle inspector (`ThemeToggleInspector*`). No CMS file changed, so the audit evidence is current.
- **Run flags:** none. This run made no new runtime or Figma reads; it builds on the audit, which had both.
- **Revision 2 (2026-10-09):** the founder resolved all 13 sign-off rows. This revision adds what those answers brought into scope:
  - C5 surfaces (D-02 = include): Source, Views, Constants, management-table source columns, Inspector View picker and Visibility.
  - Persisted JSON sources (D-03).
  - Wired product blocks (D-11).
  - Tiered plan-limit states (D-09).
- **Inputs:**
  - The audit reports `00`–`07` and `evidence/cms-2026-10-08/tracks/`.
  - The approved architecture proposal `docs/plans/2026-09-28-cms-architecture-proposal.md`: §2, §4, §5b, §7, §8, §10, C2, C3, C5, §12, F1, F2.
  - `DESIGN.md` (row density, widths, accent, type).
- **Precedence** (from `packages/editor/CLAUDE.md`, plus founder decisions):
  - Behaviour follows the code contract, meaning the Zod schemas and service returns.
  - Visuals follow the board.
  - A founder decision recorded in the proposal overrides both: PD-1, PD-3/4/5 (D4–D6) and PD-10.

---

## Identity
- **Module:** CMS (collections, fields, records, record pages, binding contract).
- **Audience / personas:**
  - **Site builder / designer** (primary): models content once, binds it to pages, ships record pages. Expert, keyboard-heavy, desktop only.
  - **Content editor:** adds and edits records daily and publishes. Moderate skill. Must not be able to break the schema or the layout.
  - **Agency operator:** many sites, duplicates sites, imports client data in bulk (CSV), works under approval workflows.
  - **Project owner / reviewer:** approves before publish. Needs to trust that what was approved is what ships.
- **Job-to-be-done and success criteria:**
  - *"Keep my site's repeating content (posts, menu items, team, products) in one place, show it on pages, and give each record its own page, without ever losing or mis-publishing content."*
  - Success means all of the following:
    - zero silent data loss;
    - what the canvas shows equals what publishes;
    - a new collection with its first bound list takes 4 steps or fewer (proposal §10b);
    - a record edit takes 4 steps or fewer (§10c);
    - every destructive action is reversible or explicitly confirmed with its consequences shown.
- **Primary ownership and entry point:**
  - CMS owns collections, schema, records and record-page rules (URL and SEO patterns), plus import and export.
  - CMS does **not** own page structure, element binding UI (the Inspector owns that) or template page layout (Pages owns that) (proposal §2/§2a).
  - Entry points: rail **CMS** (shortcut D); ⌘K "Open CMS"; Inspector "Open record"; Pages template row "Edit in CMS"; "Used by" links.
- **Location:**
  - **Left** drawer (280px): the collection chooser and Site data.
  - **Full workspace** (canvas replaced): records, fields, pages, settings.
  - **Right dock** inside the workspace (480px): the record panel.
  - **Right** Inspector (300px): binding.
  - **Dialog:** create, delete, import and confirmations.
  - **Command:** ⌘K jumps.
  - **Canvas:** a record switcher on template pages.

---

## Existing reality
Each line below is a fact from the audit, with its confidence label.

- **Code components** — CODE_EVIDENCE:
  - workspace: `packages/editor/src/editor/cms/*` (CmsWorkspace, RecordsTable, RecordSheet, FieldsTable, FieldInspector, AddFieldDialog, DeleteFieldDialog, TypedDeleteDialog, CollectionSettingsPane, DynamicPagesPane, CsvImportDialog, ReferenceField, RichTextField, OptionsEditor, RecordPreview, cmsWorkspaceStore);
  - binding: `inspector/sections/CmsBindingSection.tsx` and `CollectionListSection.tsx`;
  - setup: `shell/modals/CMSCollectionSetupModal.tsx`;
  - engine: `engine/cms/*`;
  - sync: `services/cmsSync.ts` and `syncRetryQueue.ts`;
  - server: `server/services/cms.service.ts` and `server/trpc/routers/cms.ts`;
  - contract: `packages/shared/schemas/cms.ts`.
- **Stack** — CODE_EVIDENCE: chrome-ui on flowbite-react, `tw:` utilities and `--bk-*` tokens. The CMS files use no raw controls, no hex and no purple. A few raw palette utilities remain (EDT-051).
- **Runtime** — VERIFIED_RUNTIME: 9 journeys walked live, with 45 steps passing and 31 failing (`03`). The happy path to preview works. Critical journey 5 is not complete.
- **Server foundations that work** — VERIFIED_TEST / VERIFIED_RUNTIME:
  - authorization on every procedure;
  - cross-site isolation;
  - tombstones and GONE;
  - the shared validator on publish;
  - layered XSS sanitizing;
  - drafts never published;
  - publish reads the server snapshot;
  - cross-browser conflict detection;
  - offline queue and replay.
- **Record editor** — VERIFIED_RUNTIME: a full overlay over the table with a duplicate tab row. PD-10 (480px dock) is not built (EDT-032).
- **Table** — VERIFIED_RUNTIME: display field, up to 3 fields and Updated. Status is only a "· Draft" suffix. No bulk actions, no row actions and no status filter. Paged at 50 (EDT-026).
- **Tabs** — VERIFIED_RUNTIME: Records · Fields. Dynamic pages and Settings sit behind an unlabelled ⋯ (EDT-031).
- **Figma frames** — FIGMA_EVIDENCE, 10 boards screenshotted in the audit:
  - `4428:143182` records table and `4428:144760` record workspace: both behind PD-10 and C2.
  - `4428:147552` Fields: this board is right and the code is behind it.
  - `4428:147857` Dynamic pages and `4428:148660` Settings: both boards stale.
  - `7063:79200` and `7995:205467` Inspector: the boards have no Record row.
  - `8139:217560` conflict: no diff.
  - `4418:84646` New collection: fake chips.
  - `6881:70349` Delete record: matches the code.
- **Existing issues by ID:**
  - P0: EDT-001 and EDT-002.
  - P1: EDT-003 through EDT-010.
  - P2: EDT-011 through EDT-034.
  - P3: EDT-035 through EDT-054.
- **Built / not built** — CODE_EVIDENCE:
  - Built: C0.1, C0.4, C0.7–C0.10, most of C1.
  - Partial: C0.3 and C0.5.
  - **Not built:** C0.2 (server rename), C2 (IA), C3 (a11y), C4 (cleanup), C5 (sources, Views, constants).
- **Constraints and assumptions:**
  - Founder order: code first, then Figma, but only after runtime verification (proposal §F; memory `cms-architecture-2026-09-28`). This conflicts with running `design cms` before any code change; see decision D-01.
  - Migrations are create-only; the owner applies them.
  - The QA workspace publishes to a real Vercel account.
  - Desktop only (DESIGN.md).

---

## Information Architecture

### Hierarchy (target)
This is proposal §10a, in full. The C5 surfaces are in scope per D-02.

```
Rail · CMS (D)
└─ Drawer 280 — Collections (name, record count, source icon, sync dot) · + New collection · Site data (site variables + JSON data sources, persisted — D-03)
   └─ Workspace (full width; survives drawer collapse; deep link ?cms=<col>&tab=<t>&record=<id>)
      Root (no collection selected): management table
        Collection · Source (icon + name) · Records (n / plan limit) · Last sync (time + status dot) · Pages (on/off + count) · Used by · ⋯ (Sync now, Open, Duplicate schema, Delete)
      Header: <Collection> · source badge · N records · [primary action of the tab] · ⋯ (Import CSV, Import JSON, Export CSV, Export JSON, Sync now)
      Tabs (named, aria-selected): Records · Fields · Source · Views · Pages · Settings
      ├─ Records: toolbar (search · Status filter · View ▾ · Columns) · table (checkbox · title · ≤4 fields · Status · Updated · row ⋯) · bulk bar
      │   └─ Record panel — right dock 480 over the table (table stays visible and live)
      │       header: display value · Status chip · ‹ › stepping · ⋯ (Duplicate, View on page, Delete)
      │       body: fields in schema order · footer: Saving… / Saved · 2s ago · Save
      │       external source: read-only, header "From <Source> · Edit in <source> ↗"
      ├─ Fields: table (drag reorder) + FieldInspector (name, key, type, required, unique, default, help, Used by)
      │       external source: fields = the column mapping (edit in Source)
      ├─ Source: type · connection · mapping (column → field, key field) · schedule · last sync report · Sync now · history
      ├─ Views: list of named filters · rule builder (field · operator · value, AND/OR) · sort · limit · live match count
      ├─ Pages: Generates pages [on/off] · Template page (pageId, from Pages) · URL pattern · SEO title/description patterns · routes list
      └─ Settings: name · slug · title (display) field · Constants ({{collection.x}}) · danger zone (records, pages, bindings counted)
Inspector 300 (element selected)
├─ Content slots (Text / Link / Image src / Image alt / Video src) → Source: Static | Current item | This page's record | Record ▾ (searchable)
├─ Collection list → Collection · View (All records / <View>) · Sort · Show N (All explicit) · Empty state slot
└─ Visibility → Show when <CMS field (current item / this page's record) | site variable> <operator> <value>
Add panel — Ecommerce: Product card / Product grid = Collection list + current-item bindings over the Products collection (D-11)
Pages drawer
└─ Template page row: badge "Collection template · <Collection>" · expands to routes (read-only) · guarded delete
Canvas (template page) — record switcher "Previewing: <record> ▾"
Topbar — sync pill: Offline · N pending · Sync failed (View)
```

### Actions
- **Primary actions:** New collection; Add record; Edit record (open → edit → Save); toggle Published; Add field; bind an element (Inspector); turn on record pages (Pages tab).
- **Secondary actions:** import, export; bulk publish, unpublish and delete; duplicate a record; view a record on its page; reorder fields; rename a field key (server operation, with confirm); change a field type (with confirm and conversion); delete a field, record or collection (with consequences shown).

### Views
- **Default view:** the Records table, sorted by Updated (descending) and persisted per collection. Rows are 32px (DESIGN.md §Row Density, "Never 40px"). The FieldsTable uses 32px rows.
- **Optional views:** table only for this spec. Card and list views are not requested (see Out of scope).

### Search, filter, sort, grouping
- Search covers visible text values, with rich-text markup stripped before matching.
- Status filter: All / Published / Draft. There is no Archived status (D-07).
- Field filters come through the **View ▾** picker; Views are defined in the Views tab.
- Every column header sorts, and the sort is persisted per collection.
- No grouping.

### Navigation to related modules

| From | To | Behaviour |
|---|---|---|
| Record panel "View on page" | Canvas | Opens the template page, or the first page that binds the record, with the panel still docked |
| "Used by" row | Page + element | Switches page, selects the element and opens Inspector › Content |
| Inspector "Open record" | CMS | Opens the workspace on that record |
| Pages template row "Edit in CMS" | CMS | Opens the Pages tab |
| Pages "+N from collections" | CMS | Popover listing each collection |
| Escape | Previous context | Closes, in order: the innermost dialog, then the record panel, then the workspace, returning to the canvas |

---

## Interaction contracts

| User event | Preconditions | System response | Shared state updated | Error / recovery | Test |
|---|---|---|---|---|---|
| Create collection | EDITOR+ | Modal (name only). Title and slug fields are created automatically. Opens on Records. | Collection in IndexedDB + outbox → `collections.upsert` | Name or slug clash → inline "Use <name> 2". Server INVALID → toast with reason, collection marked local-only (EDT-012) | AT-01 |
| Add field | Collection open | One dialog for all types. Key derived from name, kebab-case. Multi-select requires at least 1 option. | Collection schema | Key clash → inline error. Refusal → error inside the dialog (EDT-029) | AT-02 |
| Rename field **key** | Field exists | Confirm: "Moves values in N records; updates URL and SEO patterns". Then the **server** `cms.fields.rename` runs in one transaction, followed by a rehydrate. | Schema, entries, `pageSlugPattern`, `pageSeo*`, `displayField` | Failure → nothing changes; error shown. **Until built: key field is read-only** (D-05) | AT-03 |
| Change field type | Field has values | Confirm shows N affected records and a conversion preview. Values that can't convert block the change or are listed. | Schema + converted values | Published records that would break are listed before confirm | AT-04 |
| Required → on | — | Inline: "N records will stop being publishable" | Schema | — | AT-04 |
| Delete field | Not bound or used anywhere: content, URL or SEO patterns, attributes | Typed confirm. Values purged from every record. | Schema + entries | Bound or used → blocked; every use is listed as a link (EDT-028) | AT-05 |
| Add record | — | The panel opens docked with the first field focused | Local draft; nothing saved until Save | — | AT-06 |
| Save record | Panel dirty | Inline "Saving…" → "Saved · now". The panel stays open. A per-tab precondition (the `updatedAt` the panel loaded) is sent. | Entry + outbox (written synchronously at save time) | CONFLICT → conflict state (below). INVALID → field-level `aria-invalid` messages. Offline → "Saved on this device · will sync" | AT-07, AT-08 |
| Toggle Published | Required fields valid; slug unique among **all** records; path not reserved and not colliding | Chip "Published · not live until site publish". Topbar shows "Unpublished changes". | Entry status | Reserved or colliding path → inline on Slug (EDT-004/019) | AT-09 |
| Conflict | Server copy changed after the panel loaded | A banner lists the changed fields with "yours" and "theirs" values. Choices: Keep mine for this field / Take theirs / Merge (non-conflicting fields from both). No choice is styled primary. | Entry after the choice | Nothing is discarded without an explicit per-field choice (D-06) | AT-08 |
| Leave a dirty record (any exit: row, tab, drawer ✕, rail, ⌘K, Escape, ‹ ›) | Panel dirty | Discard dialog with "Keep editing" focused | — | — | AT-10 |
| Delete record | — | No dependants and no page → instant, with an Undo toast that restores the **same id**. Has dependants (references, pinned bindings) or owns a page → typed confirm naming them. | Entry tombstone; Undo = server restore by id | Restore failure → toast; the record stays in the list as "Deleted · Retry restore" | AT-11 |
| Bulk select → Publish / Unpublish / Delete | ≥1 row checked | Bulk bar shows a count. The action runs per record, with one aggregated result and an Undo. | Entries | Partial failure → "N done, M failed · View" | AT-12 |
| Import CSV / JSON | EDITOR+ | One server path: preview (mapping, type coercion, required-missing count, bad rows) → progress → result ("N imported, M skipped") + Undo import | Entries | Close is blocked while importing; the error step has Back | AT-13 |
| Export CSV / JSON | — | Download of the current collection (all records) | — | — | AT-13 |
| Pages tab: enable record pages | Template page exists (not home, not used by another collection) | Pattern (default `/<slug>/{slug}`) and SEO patterns (default `{title}`). Live route list. Status "N records will get a page on next publish". Button label: **Save**. | Collection | Pattern names an unknown field, a reserved segment, or collides with an existing page → inline error | AT-14 |
| Delete collection | — | Typed confirm counting records, pages and bindings. **Delete first, then unbind** on success. | Collection + entries tombstoned; bindings removed | Failure → nothing unbound; "Couldn't delete …" | AT-15 |
| Bind element (Inspector) | Bindable element type | The context default is preselected (Current item / This page's record / Record ▾). Field list filtered by slot type and shown by **name**. | Binding map **and project marked dirty** (EDT-006) | — | AT-16 |
| Pin a specific record | — | Searchable combobox. Resolves **by id** with any number of records (EDT-003). | Binding | Record unpublished or deleted → canvas shows the dimmed placeholder "Empty · <Field>" with the marker kept; Inspector explains why | AT-16, AT-17 |
| Record published / unpublished / deleted elsewhere | Element bound to it | Canvas re-resolves at once and mirrors publish | Canvas preview | — | AT-17 |
| Collection list on canvas | — | Shows **exactly what publishes** (published only), or drafts with a "Draft" marker per D-04. Zero records → designed empty state. Never shows `{{…}}`. Canvas caps clones (e.g. 24 + "+N more"). | Canvas preview | — | AT-18 |
| Duplicate site (dashboard) | Site has CMS | The copy carries collections and records with new ids; bindings and references are remapped (D-08) | Server | — | AT-19 |
| Second tab, same browser | Same record open | Behaves like a second client: the stale save gets the conflict state | — | — | AT-08 |
| Offline → online | Pending changes | Topbar pill "Offline · N pending". Replays on reconnect, and the project save auto-retries. Terminal failures are named with Retry / Discard. The publish gate count equals the pill count. | Outbox | No phantom "didn't sync" after a 404 of an op whose parent was never created (EDT-012) | AT-20 |
| Publish (site) | — | Pre-publish lists: empty bindings, unbound lists, unsynced CMS changes, reserved or colliding record paths, records whose pages will be skipped, stale or failed source syncs ("Blog last synced 3 days ago"). The page count includes record pages. Toasts never cover dialog actions. | — | One bad record never fails the whole deploy (EDT-004) | AT-21, AT-27 |
| New collection: pick source | EDITOR+ | Step 1: source (Buildrik · CSV/JSON file · Google Sheets · Airtable · Custom API/JSON URL). Step 2: name. Buildrik and file sources get title + slug fields automatically. External sources: connect → pick table → map columns (types suggested from sample rows) → key field → first sync. | Collection with `sourceType`, `sourceConfig` | Connect or auth failure → reason shown, nothing created | AT-25 |
| Connect an integration (Sheets / Airtable) | ADMIN+ | OAuth: Sheets `spreadsheets.readonly`, Airtable `data.records:read` + `schema.bases:read`. Workspace-scoped and encrypted. | `WorkspaceIntegration` | Denied, revoked or expired → "Reconnect" state on every collection using it | AT-25 |
| Custom API source | EDITOR+ | URL (https only) + GET + optional header auth + JSON path + pagination → **Test request** shows sample rows → map → key | `sourceConfig`; secret encrypted per collection | SSRF guard: private/link-local/metadata IPs blocked after DNS, 10 s timeout, 5 MB cap, no redirects to private hosts → named error | AT-26 |
| Sync now / scheduled sync | EDITOR+; schedule off / hourly / daily | Fetch → map → validate → upsert by `externalId` → tombstone rows missing at the source. A report is stored (added / updated / removed / skipped, first 50 row errors). | Entries, `lastSyncedAt`, `lastSyncStatus`, `CmsSyncRun` | Row mapping error → that row is skipped and reported, never stored half-typed. Total failure → "Last sync failed · <reason>", and the previous data is kept | AT-26, AT-27 |
| Edit a record of an external source | — | Record panel is read-only: "From Google Sheets · Edit in the sheet ↗". Status comes from the source (default: all published, PD-12). | — | — | AT-25 |
| Switch source Buildrik → external | Collection has records | Typed confirm: "N existing records become read-only and will be replaced by the next sync" | Collection | — | AT-26 |
| Paste JSON data source (site level) | — | Persisted with the project and marks it dirty. Listed under Site data after reload (D-03). Offers "Convert to collection", which creates a CSV/JSON-sourced collection. | Project settings | Invalid JSON → inline error | AT-28 |
| Create / edit a View | EDITOR+ | Name + rules (field · operator by type · value, AND/OR) + sort + limit. Live match count. | `CmsView` | A rule names a deleted field → View flagged "Needs fixing" | AT-29 |
| Collection list picks a View | List selected | Inspector › Collection list › View ▾. The canvas and publish apply the **same** shared filter evaluator. | Binding | View deleted → the list falls back to "All records" with a warning | AT-29 |
| Set a collection constant | EDITOR+ | Settings › Constants: key → value (text, number, image, URL). Usable as `{{collection.<key>}}` in that collection's lists, template page and SEO patterns. | Collection `constants` | Unknown key on a page → pre-publish warning | AT-30 |
| Element visibility rule | Element selected | Inspector › Visibility › Show when <field / site var> <op> <value>. Canvas previews it. Publish removes the element when the rule is false (not CSS-hidden). | Element attribute | Rule names a deleted field → warning, element shown | AT-31 |
| Insert Product card / grid | — | Inserts a Collection list over Products with current-item bindings (name, price, image). If Products doesn't exist, the user is offered to create it in **one** `createCollection` call (D-11). | Collection + binding | Products deleted → the standard unbound-list state | AT-32 |
| Hit a plan limit | FREE 2 collections / 100 records each · PRO 20 / 2,000 · BUSINESS 100 / 10,000 (D-09) | Create / import / sync stops at the limit with "Limit reached on <plan> · Upgrade". Import and sync report the rows skipped for the limit. | — | Enforced on the server, never only in the client | AT-33 |

---

## States and quality

### States
Each line names the state and where it appears (proposal §7).

- **Idle:** the root shows the collections overview, not a blank pane (EDT-044).
- **Loading:** a table skeleton with 32px rows. The previous collection's rows are never shown during a switch.
- **Empty:**
  - no collections: overview with "New collection" and "Import CSV";
  - no fields: "Add a field to start", with Save blocked;
  - no records: Add / Import.
- **No results:** message plus "Clear search".
- **Selected:** row highlighted while its record is open in the dock; bulk checkboxes.
- **Hover:** row ⋯ appears on hover and on focus.
- **Focus:** `var(--bk-shadow-focus)` on every interactive element. Focus is visible on table rows.
- **Success:**
  - record: "Saved · 2s ago", inline;
  - schema and settings autosave with a "Saved" tick (one save model, C2).
- **Validation:** per-field message with `aria-invalid` and `aria-describedby`, plus a live eligibility line.
- **Error:** save error shows Retry, and Retry updates the same record. Server reasons are shown verbatim and in sentence case.
- **Offline:** Topbar pill with the count of pending changes. Publish is disabled while CMS changes are unsynced.
- **Conflict:** field diff (see the contracts table).
- **Deleted elsewhere:** "This record was deleted by <name>", with Restore / Close.
- **Read-only:** for VIEWER: workspace visible with a "View only" banner and controls disabled.
- **Permission revoked mid-edit:** switch to read-only and keep the values available to copy.
- **Missing media:** placeholder, "Missing image" and Replace.
- **Deleted reference:** "Deleted record" chip with Clear.
- **Missing template:** "Template page missing" with Pick page.
- **Importing / partial / failed:** as in the Import contract above.
- **Empty binding:** dimmed "Empty · Title" on the canvas, plus a pre-publish warning.
- **Needs site publish:** chip "Published · not live yet" (D-13).
- **Source states:** connecting · syncing (progress) · synced (report) · partial (row errors listed) · failed (reason, previous data kept) · disconnected / needs reconnect · history list.
- **External read-only:** record panel and Fields locked, with the "Edit in <source> ↗" link.
- **View states:** empty (no Views yet) · match count 0 · needs fixing (rule names a deleted field).
- **Plan limit:** "Limit reached · Upgrade" on New collection, Add record, Import and Sync. The management table shows counts as "n / limit".

### Breakpoints and panel widths
Desktop only. Widths come from DESIGN.md unless noted.

| Surface | Width / height | Source |
|---|---|---|
| Drawer | 280px (`--bk-size-drawer`) | DESIGN.md |
| Inspector | 300px | DESIGN.md |
| Record panel | **480px right dock** | founder PD-10 |
| Table and field rows | 32px | DESIGN.md §Row Density |
| Layer-like dense lists | 28px | DESIGN.md §Row Density |

- No 40px rows: today's boards draw 40 (`4428:143182`), which violates DESIGN.md.
- Reference viewport for verification: 1440×900.

### Keyboard interactions and accessibility
Proposal C3, EDT-024 and EDT-025.

- Tables use `role=grid` with roving tabindex: one Tab stop per table, arrow keys move between cells and rows, Enter opens a record, and Space toggles the checkbox.
- The record panel moves focus to its first field when it opens. Escape closes the panel through `useColumnPanelEscape`, running the discard guard first. On close, focus returns to the originating row.
- Fields carry `aria-required`, `aria-invalid` and `aria-describedby`. The image field has a real `<label>`, and its controls are named, for example "Choose image for Photo".
- Tabs are chrome-ui `Tabs` with `aria-selected` and arrow-key navigation. The ⋯ menu contains actions only.
- Contrast and focus: tokens only. Sort heads are at least 24px. Status is exposed as text, not colour alone.
- Every drag action (field reorder) has a keyboard alternative (Move up / Move down).

### Performance and scale
- Stated caps: 10,000 records per collection and 100 collections per site. These are the existing technical caps; plan limits come from D-09.
- The records list is cursor-paginated on the server (EDT-040).
- Canvas list expansion is capped and memoised (EDT-034).
- Typing on the canvas stays under 50 ms with 2,000 records.
- Dynamic pages are generated in the publish worker, not in the request (EDT-010).
- `sites.publish` returns in under 2 s with 1,000 records.

### Undo, cancel, refresh, persistence
- **Undo:**
  - Undo covers element-level binding changes, with one step per user action (EDT-035).
  - Record saves are not part of canvas undo; the panel says so (D-10).
  - Record delete is undone through the Undo toast or a restore by id.
  - Bulk actions and imports are undone through Undo.
- **Cancel:** Cancel and Escape never discard without the guard.
- **Refresh:** CMS re-hydrates on window focus. Other tabs receive CMS writes through `BroadcastChannel`.
- **Persistence:**
  - Every user change marks the project dirty, including binding-only changes (EDT-006).
  - Data Sources: pasted JSON sources persist with the project and mark it dirty (D-03).

---

## Data + integrations
- **State owner:**
  - The server (Postgres `CmsCollection` / `CmsEntry`) is the authority.
  - IndexedDB is a cache plus the offline store.
  - The outbox holds unsynced operations.
  - The bindings live in `Site.projectCmsBindings`, saved with the project.
- **APIs and background operations:**

  | Kind | Operations |
  |---|---|
  | Existing tRPC | `cms.collections.*`, `cms.entries.*` |
  | New | `cms.fields.rename` (atomic, C0.2) |
  | New | `cms.fields.changeType` (converted values) |
  | New | `cms.entries.restore` |
  | New | `cms.entries.bulk` |
  | New | `cms.export` |
  | Removed | `cms.generateDynamicPages` (EDT-022) |
  | Moved into the publish worker | dynamic page generation |

  | New (C5) | `cms.sources.*` (connect, test, map, sync now, history) |
  | New (C5) | `cms.views.*` |
  | New (C5) | collection `constants` |
  | New (C5) | integration connect routes under `app/api/integrations/<provider>/` |
  | New (C5) | cron `/api/cron/cms-source-sync` (`CRON_SECRET`) |

  - **Data model additions (C5):** proposal §2c lists them in full:
    - on `CmsCollection`: `sourceType`, `sourceConfig`, `sourceSecret` (encrypted), `syncSchedule`, `lastSyncedAt`, `lastSyncStatus`, `lastSyncReport`, `constants`;
    - on `CmsEntry`: `externalId` (`@@unique([collectionId, externalId])`);
    - new models `CmsView` and `CmsSyncRun`.
  - **Env rows:** add `AIRTABLE_CLIENT_ID` / `AIRTABLE_CLIENT_SECRET` to the root CLAUDE.md table, and update `check-prod-env.mjs`, in the same commit that reads them. Google Sheets reuses the Google OAuth app with an added consent-screen scope.
  - **Shared filter evaluator** in `packages/shared`, used by both the canvas and publish.
  - **Concurrency:** every write to an existing row requires a precondition: a `version` column with a required `expectedVersion` (D-06, approved).
- **Connected modules:**
  - Inspector (binding UI)
  - Canvas (preview resolution must use the **same** resolver rules as publish: published-only, by-id, empty → placeholder or "")
  - Pages (template page type, routes)
  - Publish (snapshot, pre-checks, worker)
  - Sites › Duplicate
  - History
  - Save / recovery
  - Approval workflow (`cmsEditedAt`)
  - ⌘K
  - Forms: not in scope.
- **AI scope and context:** none. CMS has no AI and none is planned (`04`).
- **Security and data boundaries:**
  - **Roles:** reads need workspace membership; writes need EDITOR+. Connecting a source needs ADMIN+ (C5).
  - **Transport schema:** carries no internal flags (EDT-021). Entry writes are validated against the record's **stored** collection (EDT-038).
  - **References:** a required reference must name a live record (EDT-037).
  - **Output:** rich text goes through the shared allow-list. Bound URLs drop `javascript:` / `data:`.
  - **Errors:** Prisma messages are masked (EDT-036).
  - **Rate limits:** exist on import, on any render-amplifying endpoint, on Sync now and on Custom API test requests.
  - **External sources:**
    - OAuth tokens and API secrets are encrypted with AES-256-GCM (`ENCRYPTION_KEY`) and never sent to the client.
    - The Custom API fetch runs server-side only, behind the SSRF guard.
    - Clients are initialized lazily (root CLAUDE.md rule).
    - Permissions: connect / disconnect needs ADMIN+; change source or mapping, Sync now, Views and Constants need EDITOR+.
  - **Plan limits:** enforced on the server (D-09).

---

## Design implementation in Figma
*This blueprint makes no Figma writes. This section defines what a later `design cms` must produce.*

- **Reusable tokens and components:**
  - existing CMS boards and components on page `4418:45431`;
  - DESIGN.md values: Inter, accent `#1A56DB`, 4px grid, 28/32px rows, `--bk-*` variables bound, no purple, no decorative shadows;
  - chrome-ui equivalents: Tabs, Modal, Toast, TextInput, Select, Badge, Checkbox, Button.
- **Approved new flows:** proposal F1 updates (drawn as proposal copies, not edits of the originals) and F2 creations, items 1–18. C5 is in scope per D-02. Also:
  - plan-limit states (D-09);
  - the persisted Site data JSON sources (D-03);
  - the wired Product card / grid (D-11).
- **Target Figma page/section:** a new section `Editor Improvements / CMS / Proposal v1` on page `4418:45431` (D-01 approved: a non-destructive proposal before code). Originals stay untouched, and each proposal frame records its reference node:
  - `4428:143182`, `4428:144760`, `4428:147552`, `4428:147857`, `4428:148660`;
  - `7995:205467`, `7995:204147`, `7995:205787`;
  - `4418:84646`, `8139:217560`, `6881:70349`.
- **Links to created nodes:** none yet; this is the blueprint stage.
- **Visual verification status:** not started.

---

## Acceptance tests
**Verification level needed:**
- `VERIFIED_RUNTIME`: live at 1440×900 in two browser profiles where stated.
- `VERIFIED_TEST`: an automated unit or DB test.

| # | Journey / precondition | Steps | Expected result | Covers issue(s) | Verification level needed |
|---|---|---|---|---|---|
| AT-01 | New site | New collection "Posts" → Create | Title and slug fields exist; the Records tab opens; the server holds the collection. A refused create shows the reason. | EDT-012, EDT-043 | VERIFIED_RUNTIME |
| AT-02 | Collection open | Add a field of each of the 10 types | Each saves. Multi-select requires an option. A refusal shows the reason in the dialog. | EDT-029, EDT-043 | VERIFIED_RUNTIME |
| AT-03 | 3 rich-text records (1 published, required) | Rename key `summary`→`excerpt` → confirm | SQL shows every value under `excerpt` with `<strong>` intact; the SEO and URL patterns are updated; the network shows only `cms.fields.rename` | EDT-001, EDT-028 | VERIFIED_RUNTIME + VERIFIED_TEST |
| AT-04 | Field with values | Change Text→Number; turn Required on | Confirm shows N affected records and the conversion; the Required impact count appears | EDT-023 | VERIFIED_RUNTIME |
| AT-05 | Field used only in an SEO pattern or an `href` | Delete the field | Blocked, with the use listed. An unused field deletes and is purged from every record. | EDT-023, EDT-028 | VERIFIED_RUNTIME |
| AT-06 | — | Add record | The panel docks at 480px, the table stays visible, and the first field has focus | EDT-032, EDT-024 | VERIFIED_RUNTIME |
| AT-07 | Panel open | Edit → Save | "Saved" appears inline and the panel stays open; reload shows the value | EDT-033 | VERIFIED_RUNTIME |
| AT-08 | Same record open in 2 tabs **and** in 2 profiles | Save the title in A, then the body in B | B gets the conflict diff listing the title; Merge keeps A's title and B's body | EDT-002, EDT-013, EDT-014 | VERIFIED_RUNTIME |
| AT-09 | Pattern `{slug}` | Set a record's slug to `api`, `index`, the template's slug, or a draft's duplicate | Each is refused inline on Slug | EDT-004, EDT-019 | VERIFIED_RUNTIME + VERIFIED_TEST |
| AT-10 | Dirty record | Try each exit: row, tab, drawer ✕, rail, ⌘K, Escape, ‹ › | Every exit shows the discard dialog | EDT-007 | VERIFIED_RUNTIME |
| AT-11 | Record pinned by an element and referenced by 2 records | Delete → Undo | The typed confirm names its dependants; after Undo the id is the same and the bindings resolve | EDT-008, EDT-027 | VERIFIED_RUNTIME |
| AT-12 | 60 drafts | Select all → Publish → Undo | All publish, then all revert | EDT-026 | VERIFIED_RUNTIME |
| AT-13 | CSV with `false`, `12`, `a;b`, `abc` | Import → result → Undo import; Export | Values are typed; the `abc` row is reported; Undo removes the import; the export round-trips | EDT-009, EDT-052 | VERIFIED_RUNTIME |
| AT-14 | Template page exists | Pages tab: on, pattern, SEO → Save | Routes are listed; the button says Save; the publish confirm counts record pages | EDT-047, EDT-031 | VERIFIED_RUNTIME |
| AT-15 | Network off | Delete a collection | Bindings are kept and "Couldn't delete" is shown | EDT-029 | VERIFIED_RUNTIME |
| AT-16 | 60 published records | Pin a heading to the oldest; change only the pin; wait for autosave; reload | It resolves on the canvas and in Preview; the pin survives reload | EDT-003, EDT-006 | VERIFIED_RUNTIME |
| AT-17 | Heading bound to R | Unpublish R; delete R; reload | The canvas shows "Empty · Title" with the bound marker, both before and after reload | EDT-011 | VERIFIED_RUNTIME |
| AT-18 | List on a collection with drafts / with 0 records / with 2,000 records | View the canvas; type | Matches publish (or marked drafts per D-04); empty state; never `{{`; typing stays under 50 ms | EDT-015, EDT-034 | VERIFIED_RUNTIME |
| AT-19 | Site with 2 collections (one referencing the other) | Duplicate the site | The copy has both collections and their records with new ids; bindings resolve; pre-publish passes | EDT-005 | VERIFIED_TEST + VERIFIED_RUNTIME |
| AT-20 | — | Offline: create a collection, add a record, delete the collection; online; reload | No phantom sync toast; the pill and the publish gate both read 0; the project save auto-retries | EDT-012, EDT-018 | VERIFIED_RUNTIME |
| AT-21 | 1,000 published records; a legacy `api` record | Publish (in a no-Vercel or simulation workspace) | Returns in under 2 s; the worker deploys every valid page; the `api` record is skipped and named; toasts don't cover Cancel | EDT-004, EDT-010, EDT-017 | VERIFIED_RUNTIME |
| AT-22 | Keyboard only | Tab to the table → arrow to a row → Enter → edit → Esc → Keep editing → Esc → Discard | Every step works; focus returns to the row; axe reports 0 violations | EDT-024, EDT-025 | VERIFIED_RUNTIME |
| AT-23 | Raw tRPC as EDITOR / VIEWER | Send `_skipTouchCmsEdited`; send a mismatched `collectionId`; call `generateDynamicPages` | Flag ignored (`cmsEditedAt` advances); NOT_FOUND; the procedure is absent | EDT-021, EDT-022, EDT-038 | VERIFIED_TEST |
| AT-24 | Field used on another page | Click it in "Used by" | Lands on that page with the element selected and Inspector › Content open | EDT-030 | VERIFIED_RUNTIME |
| AT-25 | QA workspace with a Google Sheet and an Airtable table | New collection → Sheets (then Airtable) → connect → map → key → sync | Records appear typed; the record panel is read-only with "Edit in the sheet ↗"; a row edited at the source shows after Sync now | EDT-016 | VERIFIED_RUNTIME |
| AT-26 | Public JSON URL; a private-IP URL; a 6 MB URL | Custom API source → Test request → map → sync; switch an existing Buildrik collection to an external source | The public URL works. The private IP and 6 MB URL are refused with a named reason. The source switch asks for a typed confirm. | — | VERIFIED_RUNTIME + VERIFIED_TEST (SSRF unit tests) |
| AT-27 | Synced collection | Delete a row at the source → Sync now; then break the URL → Sync now → open Publish | The deleted row disappears (tombstoned). "Last sync failed · <reason>" shows and the previous data is kept. Pre-publish warns about the failed sync. | — | VERIFIED_RUNTIME |
| AT-28 | — | Paste a JSON data source → reload → relaunch the browser → Convert to collection | The source is still listed after reload and relaunch; converting creates a typed collection | EDT-016 | VERIFIED_RUNTIME |
| AT-29 | Collection with a `featured` boolean | Views → "Featured only" (featured is true) → Collection list › View = Featured only → publish (no-Vercel or simulation workspace) | Live count is right; canvas and published HTML both list only featured records | — | VERIFIED_RUNTIME |
| AT-30 | Constant `currency = PKR` | Use `{{collection.currency}}` on the template page and in a list | Renders on the canvas and in published HTML; an unknown key warns pre-publish | — | VERIFIED_RUNTIME |
| AT-31 | Element with "Show when featured is true" | Preview a non-featured record on the template; publish | Canvas preview hides the element; the published HTML does **not contain** it | — | VERIFIED_RUNTIME |
| AT-32 | New site | Insert Product grid → accept "Create Products" → add 3 products | The grid shows the 3 products on the canvas and in publish; Products is created with one collection upsert | EDT-042 | VERIFIED_RUNTIME |
| AT-33 | FREE workspace with 2 collections; a 150-row CSV | New collection; import the CSV | "Limit reached · Upgrade"; the import stores 100 and reports 50 skipped; a raw tRPC call over the limit is refused by the server | — | VERIFIED_RUNTIME + VERIFIED_TEST |

---

## Out of scope for this spec
- **Card and list views of records:** not requested by any PRD or decision.
- **Write-back to external sources** (editing a Sheet or Airtable row from Buildrik): proposal §2c makes external sources read-only mirrors.
- **15-minute sync schedule:** PD-13 defaults to off / hourly / daily.
- **Presence, locks and real-time co-editing:** PD-7 recommends conflict-only until the collab flag ships.
- **Localization UI:** PD-8 reserves the shape only.
- **Scheduled record publish:** no decision exists. Candidate for a later audit.
- **AI for CMS:** absent and not planned (`04`).
- **Forms → CMS destination:** not audited.
- **Code fixes:** this skill does not implement. Wave 0 of `07` is a separate request.

## Candidate issues found while writing this spec
These have no `EDT-` IDs; the next audit should promote them.

- **40px rows:** board `4428:143182` and the live table may both use 40px rows, against DESIGN.md's "Never 40px". Measure live with `getComputedStyle`.
- **Template page by file name:** the template page is chosen by file name, not `pageId` (proposal §4, PD-11). A page rename may orphan the template. Not re-verified in the audit.
- **No redirect on slug change:** changing a record's slug creates no redirect (proposal BD-28). Not re-verified.
- **Unguarded template delete:** deleting a template page from Pages is unguarded (proposal §4). Not re-verified.
- **Two "New collection" buttons and two `useContentPanel` instances** (proposal §9 MERGE). Not re-verified.
- **No VIEWER read-only workspace:** proposal UI-16/17 say a VIEWER sees the workspace hidden, or editable locally. Not walked as a VIEWER in the audit.

## Definition of done
- [ ] Product requirements approved (every row below resolved)
- [ ] Design reviewed and complete for the required states (`design cms` → `verify cms`)
- [ ] Prototype links verified where possible (flow-audit over the CMS prototype)
- [ ] Implementation matched to spec (separate stage, outside this skill)
- [ ] Core actions, save/reload, errors and integrations tested: AT-01…AT-33 at their stated level (separate stage)
- [ ] Accessibility and regression checks passed: AT-22, axe, `verify:ds`, and rewritten pinning tests (`CollectionManager.rename.test.ts:30`, `cms-conflict.db.test.ts:60`) (separate stage)

## Open decisions / sign-off
All 13 rows were resolved by the product owner (founder) on 2026-10-09. Three answers differ from the original recommendation: D-02, D-03 and D-11.

| # | Decision needed | Options considered | Recommendation | Approver | Status (open / approved / rejected) |
|---|---|---|---|---|---|
| D-01 | May `design cms` produce a Figma proposal section before the code fixes land? | (a) wait for runtime-verified code · (b) non-destructive `Editor Improvements / CMS / Proposal v1` now | (b) | Product owner (founder) | **approved: (b)** |
| D-02 | Do this spec and the next design include the C5 surfaces (Source, Views, Constants, Visibility)? | (a) include now · (b) separate `cms-sources` spec | (b) | Product owner | **approved: (a), include.** The recommendation was rejected. The C5 surfaces are now specified in this file. |
| D-03 | Pasted-JSON Data Sources until C5 (EDT-016) | (a) hide the door · (b) persist in the project · (c) leave as is | (a) | Product owner | **approved: (b), persist ("no need to vanish").** The recommendation was rejected. Sources persist and offer "Convert to collection". |
| D-04 | Drafts in a Collection list on the canvas | (a) published only · (b) drafts marked · (c) toggle, default (a) | (c) | Product owner + design lead | **approved: (c)** |
| D-05 | Field-key rename before the server rename exists | (a) key read-only · (b) warn · (c) client ordering fix only | (a) | Engineering lead | **approved: (a)** |
| D-06 | Concurrency model and conflict UX | (a) required `expectedUpdatedAt` + diff · (b) `version` column + diff/merge · (c) last-write-wins | (b) | Engineering lead | **approved: (b)** |
| D-07 | `archived` status | (a) add on the server · (b) remove from the editor | (b) | Product owner | **approved: (b)** |
| D-08 | Duplicate site and CMS | (a) copy with remapped ids · (b) strip + notice | (a) | Product owner | **approved: (a)** |
| D-09 | Plan limits for CMS | tiered · same for all plans · decide later | tiered | Product owner | **approved: tiered.** FREE 2 collections / 100 records each · PRO 20 / 2,000 · BUSINESS 100 / 10,000. Enforced on the server. |
| D-10 | Record saves vs canvas undo | (a) out of canvas undo, with a note · (b) in the undo stack | (a) | Product owner + engineering lead | **approved: (a)** |
| D-11 | Ecommerce product blocks | (a) wire as Collection lists · (b) drop the prompt | (b) | Product owner | **approved: (a), wire ("use").** The recommendation was rejected. |
| D-12 | Template page ownership | (a) Pages page type with a pageId · (b) CMS file-name pointer | (a) | Product owner | **approved: (a)** |
| D-13 | Record publish model | (a) record Published + site publish, honest copy · (b) per-record live publish | (a) | Product owner | **approved: (a)** |

**Sign-off state:** no rows are open, so the `design cms` gate (SKILL rule 9b) is satisfied.
