# CMS audit — Track A: server, data, contract, security

- **Commit:** `main @ 7a50e34e1` (HEAD was still `7a50e34e1` at the end of the audit. `git diff --stat 7a50e34e1 HEAD` over every file cited below was empty, so nothing cited has changed.)
- **Mode:** read-only. No repo file was modified. Probes live only in this scratchpad (`probe/cms-audit-probe.db.test.ts`, `bench.ts`) and ran against the local `buildrik_test` DB, which is guarded to localhost.
- **Read:** root `CLAUDE.md`, `server/AGENTS.md`, `prisma/schema.prisma` (CmsCollection, CmsEntry, Site.cmsEditedAt/projectCmsBindings), all 6 `prisma/migrations/*cms*`, `server/services/cms.service.ts` (whole file), `server/trpc/routers/cms.ts`, `server/trpc/routers/__internal__/translateCms.ts`, `packages/shared/schemas/cms.ts`, `packages/shared/content/cmsRichText.ts` (via its tests), the CMS parts of `server/services/publish.service.ts` (`runPrePublishChecks`, `startPublish`, `rollbackPublish`), `lib/publish-files.ts` (`buildDeployFiles`, sitemap), `packages/shared/schemas/publish.ts` (`publishPathError`), `lib/sanitize-blocks.ts` (`sanitizeGeneratedPageHtml`), `server/services/permission.service.ts`, `server/trpc/trpc.ts` (protectedProcedure, errorFormatter), `server/services/sites.service.ts` (`duplicateSite`), plus client touchpoints that the server findings depend on (`cmsSync.ts:265,710,829`, `CollectionManager.ts:228-264`, `CollectionSettingsPane.tsx:51-91`).
- **Prior docs reconciled:** `docs/audits/2026-09-27-module-audit/04-cms.md`, `docs/plans/2026-09-28-cms-architecture-proposal.md` (C0–C5), `docs/plans/cms-c1-evidence/` (walk scripts and screenshots only; no separate C1 ledger or gate doc exists, and `cms-c1-evidence` is referenced only from `2026-09-28-cms-c0a-ledger.md`), `phase2-live/L3.md` L3-015..L3-023, `phase1-code/05-pages-cms-components-forms.md` §2, `phase1-code/07-publish-api-integration.md`.

## Tests run (exact results)

| Run | Command | Result |
|---|---|---|
| Server/shared unit | `npx vitest run server/services/__tests__/cms.service.test.ts …cms.service.validation.test.ts …cms.service.entry-gone.test.ts server/trpc/routers/__tests__/cms-translate.test.ts …cms-csv-import.test.ts packages/shared/content/__tests__/cmsRichText.test.ts packages/shared/schemas/__tests__/cms-validator.test.ts lib/__tests__/sanitize-blocks.test.ts` | **8 files, 191/191 passed** (21.2 s) |
| DB tier (repo tests) | `npx vitest run --config vitest.db.config.ts __tests__/db/cms-{conflict,tombstones,edited-at,publish-snapshot,bindings-persist}.db.test.ts` | **5 files, 25/25 passed** (105 s). "No pending migrations" on buildrik_test (70 migrations). My first attempt, `pnpm test:db -- __tests__/db/cms`, printed nothing for about 9 minutes and I killed it. The likely cause is the literal `--` defeating the file filter, plus other sessions sharing the DB. It is not a product signal. |
| DB tier (audit probes, scratchpad) | `npx vitest run --config vitest.db.config.ts --dir <scratchpad>/cms-audit/probe` | **8/8 passed.** Each probe asserts the CURRENT (defective) behaviour, so a pass confirms the finding: P1 blind write, P2 `_skipTouchCmsEdited`, P3 cross-collection bypass, P4 P2002 race (87 raw `PrismaClientKnownRequestError:P2002` rejections over 30×4 concurrent creates), P5 duplicate generated paths, P6 rename strips rich text, P7 dangling reference publishes, P8 `api/` record path |
| Micro-benchmark | `npx tsx <scratchpad>/cms-audit/bench.ts` (`sanitizeGeneratedPageHtml` on a 50 KB page) | 1st call 1193 ms. Warm: **230.8 ms/page** over 20 pages |

---

## Findings

### A-01 Renaming a field key loses rich-text formatting and moves no record data on the server (C0.2 rename migration not built)
- Type: Data / Priority: **P1** (permanent content loss across every record of a collection) / Confidence: VERIFIED_TEST (server half, probe P6) + CODE_EVIDENCE (client ordering) / Status: VERIFIED_BROKEN
- Journey/preconditions: A collection has a rich-text field with records. The EDITOR renames the field key in Fields › field inspector.
- Repro: (1) Create collection field `summary` (richtext). (2) Save a record with `Hello <strong>bold</strong>`. (3) Rename the key to `excerpt`. The client re-keys each record and upserts it before the collection upsert (`CollectionManager.ts:244-261`). (4) The server receives `entries.upsert {excerpt: "Hello <strong>bold</strong>"}` while its stored field list still says `summary`.
- Actual: `sanitizeEntryData` (`cms.service.ts:67-74`) decides "richtext" from the STORED field list, so `excerpt` is treated as plain text and `stripMarkup` stores `Hello bold`. The probe reads back `excerpt: "Hello bold"`. The stripped copy is written back locally (`cmsSync.ts:840-846`, per L3-015). For a PUBLISHED record whose old key is required, the record upsert fails INVALID instead, and the record keeps the old key server-side while the collection moves to the new key. The data is then orphaned under a key no field names.
- Expected: A rename is one server operation that re-keys `data`, `pageSlugPattern` and `displayField` atomically and preserves values byte-for-byte.
- Source: `server/services/cms.service.ts:67-74,236-305,342-423`; `packages/editor/src/engine/cms/CollectionManager.ts:244-261`; no `fields.rename` / `renameField` exists anywhere under `server/` or `packages/shared` (git grep, empty).
- Root cause: **confirmed.** The client writes records before the schema (ordering), and the server has no atomic rename (C0.2 was never built). The server treats the field list as the authority for sanitization, so any record write ahead of the schema write is judged against the old schema.
- Impacted: CMS records, dynamic page paths (pattern keyed on the renamed field), bindings by field slug.
- Recommendation: Build `cms.fields.rename` (C0.2). In one `$transaction` it updates the collection's fields, pattern and displayField and runs `jsonb` key moves on `cms_entries.data`. The engine calls it and rehydrates. Alternative (stop-gap): the client awaits the collection upsert before the record upserts (the parked fix). That alone still leaves a non-atomic window and the PUBLISHED/INVALID split.
- Acceptance: Rename `summary→excerpt` on a collection with 3 rich-text records (one PUBLISHED with required). A SQL read shows all 3 under `excerpt` with `<strong>` intact and none under `summary`. Dynamic page paths are unchanged.
- Prior: L3-015 (STILL OPEN), DM-02, proposal C0.2 (NOT BUILT), 05 P1-2.

### A-02 A record whose page path starts with `api/` makes the whole site publish fail at deploy time
- Type: Integration / Priority: **P1** (core flow made unpublishable by one ordinary record) / Confidence: VERIFIED_TEST (probe P8) / Status: VERIFIED_BROKEN
- Journey: A page-generating collection with pattern `{slug}` (or `api/{slug}`, which `cmsPatternError` accepts) and a PUBLISHED record whose slug is `api`.
- Repro: Probe P8. `upsertCollection(pattern "{slug}", template "doc.html")`, then `upsertEntry({slug:"api"}, PUBLISHED)`. Both are accepted. `generateDynamicPages` returns `api/index.html`.
- Actual: `publishPathError("api/index.html")` returns "Page paths may not live under api/" (`packages/shared/schemas/publish.ts:23,41`). `buildDeployFiles` throws `UNSAFE_PUBLISH_PATH` for the whole deploy (`lib/publish-files.ts:176-179`), inside the worker (`app/api/workers/publish/[jobId]/route.ts:365`) after the job was queued. Nothing in `runPrePublishChecks` or `cmsRecordClash` warns, so every publish of the site fails until the record is renamed.
- Expected: The record is refused (or its page skipped and named in pre-publish) with a reason. The site's other pages still publish.
- Source: `packages/shared/schemas/cms.ts:295-309` (`cmsPatternError`), `:323-344` (`cmsRecordClash`); `server/services/cms.service.ts:905-927`; `lib/publish-files.ts:176-179`.
- Root cause: **confirmed.** The CMS validator and the deploy path guard do not share a rule. The generator emits a path the deploy layer then refuses as a whole-job error.
- Recommendation: Run `publishPathError` on `cmsRecordPath(...)/index.html` inside `cmsRecordClash`, so the PUBLISHED upsert refuses with INVALID. Also make `appendDynamicPagesToPublish` drop and report an unsafe generated path instead of letting the deploy throw. Alternative: reject reserved first segments in `cmsPatternError` and in the slug value rule.
- Acceptance: Publishing record slug `api` returns `CMS_INVALID:` with a readable reason. A site with a legacy `api` record still publishes its other pages, and pre-publish names the skipped record.
- Prior: new (related to 05 P2-9, "dynamic vs static path collisions UNVERIFIED").

### A-03 Duplicating a site copies its CMS bindings but none of its collections or records
- Type: Integration / Priority: **P1** (the copy of a CMS site cannot publish its lists, and its bound content is gone) / Confidence: CODE_EVIDENCE / Status: CODE_GAP
- Journey: Dashboard › site › Duplicate, on a site with collections, a Collection list and bound headings.
- Repro: `duplicateSite(siteId, …)` (`server/services/sites.service.ts:458-530+`).
- Actual: The transaction copies the site row, pages and form blocks, and `projectCmsBindings: copyCmsBindings(original.projectCmsBindings, reid.renames)` (`:512`). No `cmsCollection`/`cmsEntry` rows are copied (no CMS model is referenced in the function). The copy's bindings point at the ORIGINAL site's collection ids, and every CMS read is site-scoped. In the copy:
  - `findUnboundLists` reports every Collection list as a blocking "fail" row (`cms.service.ts:746-775`, `publish.service.ts:208-220`).
  - `findEmptyBindings` reports every field binding as empty, "a deleted collection".
  - `publishSnapshot` returns nothing.
  - An editor that tries to re-push the original ids gets `NOT_FOUND` (`cms.service.ts:269`, cross-site id).
- Expected: The duplicate carries its collections (new ids) and records, with the bindings re-pointed. Alternatively it carries neither, and the UI says CMS content is not copied.
- Source: `server/services/sites.service.ts:458-530,587-600`. No test covers it: `__tests__/db/duplicate-site-forms.db.test.ts` and `__tests__/duplicate-site-setting-columns.test.ts` never mention CMS.
- Root cause: **confirmed by code.** The CMS tables were added after `duplicateSite`, and only the JSON bindings column was carried along with the X-A1 re-id.
- Recommendation: Inside the same `$transaction`, copy non-deleted collections with fresh ids, copy their non-deleted entries, and remap three things through an old→new collection-id map: `projectCmsBindings` collectionIds, reference fields' `referenceCollection`, and reference values (entry ids). Alternative: strip `projectCmsBindings` from the copy and show a "CMS not copied" notice.
- Acceptance: A DB test duplicates a site with 2 collections (one referencing the other) and 3 records. The copy has 2 collections and 3 records with new ids, its bindings resolve, `runPrePublishChecks` on the copy has no "Collection lists" fail row, and the original is unchanged.
- Prior: new.

### A-04 Dynamic pages are rendered and sanitized synchronously inside the `sites.publish` request, then stored in one JSON row
- Type: Performance / Priority: **P1** for collections of a few hundred records or more (the publish request outlives any proxy timeout). P3 for small sites. / Confidence: CODE_EVIDENCE + measured micro-benchmark. The end-to-end timing is INFERRED. / Status: CODE_GAP
- Journey: Publish a site whose page-generating collection has N published records.
- Actual: `sites.publish` awaits `startPublish` (`server/trpc/routers/sites.ts:457`), which awaits `appendDynamicPagesToPublish` (`publish.service.ts:496`) before the job row exists. For every record that runs `substituteOutsideScriptStyle` plus `sanitizeGeneratedPageHtml`, a jsdom + DOMPurify parse of the whole page (`cms.service.ts:905-927`). Measured: **~231 ms per 50 KB page** warm (1.19 s cold). That extrapolates to ~4 min for 1,000 records and ~38 min at the 10,000-record cap (`CMS_MAX_ENTRIES_PER_COLLECTION`), all on the request thread. The full result is then written as `publishBuildJob.log = { pages: finalPages }` (`publish.service.ts:510`): 1,000 × 50 KB ≈ 50 MB of JSON in one row, and 10k records approaches Postgres's per-value limits. The template is also allowed up to 2 MB through the unused `generateDynamicPages` procedure (A-07).
- Expected: Generation happens in the worker (which already runs out of band) or in bounded batches, and the job row stores inputs, not N rendered pages.
- Source: `server/services/publish.service.ts:493-512`; `server/services/cms.service.ts:885-928,1027-1065`; `lib/sanitize-blocks.ts:331+`.
- Root cause: **confirmed** for the placement (request path) and storage. The timeout threshold on the cPanel/LiteSpeed proxy is INFERRED, not measured.
- Recommendation: Persist the static pages and generate dynamic pages in the publish worker, streaming them to the deploy file list. Alternative: cap generated pages per publish with a pre-publish warning, and sanitize the template once with per-value escaping (the substituted values are already escaped or allow-listed) instead of re-parsing every page.
- Acceptance: Publish with 1,000 published records returns from `sites.publish` in under 2 s, and the worker deploys 1,000 record pages. The job row is under 1 MB.
- Prior: new (DM-12 set the size caps but not the publish cost).

### A-05 `_skipTouchCmsEdited` is client-settable, so an EDITOR can change published content after approval without invalidating it
- Type: Security / Priority: **P2** (approval-gate bypass by a crafted request from a site EDITOR) / Confidence: VERIFIED_TEST (probe P2) / Status: VERIFIED_BROKEN
- Journey: A workspace with `editsRequireApproval` and `agency_layer` on. An EDITOR's site is APPROVED.
- Repro: Send `cms.entries.upsert {id, siteId, collectionId, data:{…changed…}, _skipTouchCmsEdited: true}` (raw tRPC). Probe P2: `upsertEntryInput.parse` keeps the flag, the write lands, and `site.cmsEditedAt` is unchanged.
- Actual: The approval gate's staleness signal is `latestEditAt(site) = max(lastEditedAt, cmsEditedAt)` (`publish.service.ts:451-456`). The skipped bump leaves the approval "fresh", so the EDITOR publishes changed CMS content without `APPROVAL_STALE`. The editor's "unpublished changes" signal is also suppressed.
- Expected: Only the CSV importer, inside the service, can skip the per-row bump.
- Source: `packages/shared/schemas/cms.ts:389-391` (public input), `server/trpc/routers/cms.ts:117-119` (whole `input` passed through), `server/services/cms.service.ts:363-365,572`.
- Root cause: **confirmed.** An internal option was added to the transport schema.
- Recommendation: Remove `_skipTouchCmsEdited` from `upsertEntryInput`, and give `upsertEntry` a separate second parameter (`opts: { touch?: boolean }`) that the router never sets. Alternative: strip the key in the router.
- Acceptance: A router-level test sends `_skipTouchCmsEdited: true` and `cmsEditedAt` still advances. The CSV import DB test still bumps exactly once.
- Prior: 05 P2-1 (STILL OPEN).

### A-06 Optimistic concurrency is opt-in: an upsert without a precondition overwrites a newer save
- Type: State / Priority: **P2** (silent lost update between tabs or devices) / Confidence: VERIFIED_TEST (probe P1) / Status: VERIFIED_BROKEN
- Repro (probe P1): Save v1. Tab B saves v2 with the correct `expectedUpdatedAt`. Stale tab A saves with no `expectedUpdatedAt`. Final `title = "stale"`, with no CONFLICT.
- Actual: `assertFresh` returns early on `undefined` (`cms.service.ts:184`) and skips the comparison on `null` (`:190-194`). `updateMany` then uses `{id, deletedAt:null}` with no `updatedAt` (`:285-287,401-403`). The repo's own DB test documents the bypass as intended ("expectedUpdatedAt: null bypasses the precondition", `__tests__/db/cms-conflict.db.test.ts:60`). The client sends `serverStampOf(...) ?? null` (`cmsSync.ts:710,829`), so any row without a recorded stamp is written blind. In addition, a collection create that races another create on the same id retries itself with the precondition forcibly cleared (`cms.service.ts:231`).
- Expected: For an existing row, a missing precondition is a CONFLICT (or a `version` precondition per C0.3). A create is the only write allowed without one.
- Source: as above. Correction to L3-022: "any API token" cannot reach CMS. `protectedProcedure` rejects bearer tokens (`server/trpc/trpc.ts:123-134`), so exposure is limited to cookie sessions (any EDITOR client or script).
- Root cause: **confirmed.** It is a design choice ("deliberate opt-out") that C0.3 meant to replace with `version Int` + required `expectedVersion`. C0.3 was built only partially (updatedAt stamp, optional).
- Recommendation: Require `expectedUpdatedAt` when `input.id` exists server-side (CONFLICT when absent). The client's "first save after reset" path should first fetch the row's stamp. Remove the forced clear at `:231` and answer the raced create with the existing row's stamp as CONFLICT. Alternative: add `version` per C0.3.
- Acceptance: Probe P1 inverted: the stale write gets `CMS_CONFLICT:`. `cms-conflict.db.test.ts:60` is rewritten. The two-tab live walk shows the conflict banner.
- Prior: L3-022 (STILL OPEN), DM-03, proposal C0.3 (PARTIAL).

### A-07 Schema changes never re-check published records, so two records can publish to the same path
- Type: Data / Priority: **P2** (one record page silently overwrites another and the sitemap lists the duplicate; workaround is to re-save records) / Confidence: VERIFIED_TEST (probe P5) / Status: VERIFIED_BROKEN
- Repro (probe P5): Pattern `blog/{slug}`, records `one`/`two` both PUBLISHED (accepted, distinct paths). Change the pattern to `blog/{cat}` (both `cat = news`). The collection upsert is accepted. `generateDynamicPages` returns `["blog/news/index.html", "blog/news/index.html"]`.
- Actual: `upsertCollection` validates the field list and pattern shape only (`cms.service.ts:245-248`). It never re-runs `cmsRecordErrors`/`cmsRecordClash` over existing PUBLISHED rows. The same applies to making a field required, adding `min`/`pattern`, or changing a field type (CMS-20: no conversion). `buildDeployFiles` does not dedupe (`lib/publish-files.ts:185-200`), so the Vercel payload carries duplicate `file` entries. Which one wins is INFERRED (Vercel API behaviour not verified), and `sitemap.xml` lists the URL twice (`packages/shared/seo/sitemap.ts:34-45`). The clash check on record publish is also read-then-write without a lock (`cms.service.ts:381-391`), so two concurrent publishes can both pass.
- Expected: A schema change that would invalidate published records is refused with the count, or applied with those records demoted to draft and named. The generator never emits two pages at one path.
- Source: `server/services/cms.service.ts:236-305,378-391,905-927`; `lib/publish-files.ts:172-200`.
- Root cause: **confirmed.** Validation is per-record-write only.
- Recommendation: (1) In `upsertCollection`, when `fields`, `pageSlugPattern` or validation change, run the shared validator over PUBLISHED rows and return `INVALID` with "N published records would break: …". (2) `appendDynamicPagesToPublish` keeps the first page per path and reports collisions in `runPrePublishChecks`. (3) Make the clash check atomic: serialize on the collection row (`SELECT … FOR UPDATE`) or use a stored, unique `path` column.
- Acceptance: Probe P5 gets INVALID on the pattern change. A forced legacy duplicate yields one file per path and a pre-publish warning naming both records.
- Prior: CMS-07 (FIXED for new writes, residual here), CMS-20 (STILL OPEN, server half), BD-14.

### A-08 `cms.generateDynamicPages` lets any VIEWER force unbounded server CPU, and the client never calls it
- Type: Security / Performance / Priority: **P2** / Confidence: CODE_EVIDENCE / Status: CODE_GAP
- Actual: The mutation is gated by `requireRead` (`server/trpc/routers/cms.ts:87-97`), so any workspace member down to VIEWER can call it. It accepts `templateHtml` up to 2,000,000 chars (`packages/shared/schemas/cms.ts:374-378`) and renders plus jsdom-sanitizes it once per published record (up to 10,000). At the measured ~231 ms per 50 KB, one 2 MB call over a large collection holds a Node worker for many minutes. CMS has no rate limiter: `rate-limit.service.ts`/`rate-limiter.ts` do not mention CMS. The procedure has no UI caller; it is listed in `packages/dashboard/scripts/check-trpc-orphans.mjs:80` as "server half complete, no UI. FOUNDER DECISION". The response also returns full rendered pages.
- Expected: There is no amplification endpoint reachable by the lowest role.
- Root cause: **confirmed.** A dev and preview seam was shipped as a public procedure.
- Recommendation: Delete the procedure (publish uses the service function directly). If preview is wanted later, gate it at EDITOR, cap the template at about 200 KB, return at most a few rendered records, and rate-limit it.
- Acceptance: `cms.generateDynamicPages` is absent from the router (orphan list updated), or a VIEWER call returns FORBIDDEN and a 2 MB template is refused.
- Prior: 05 P2-10 (dead procedure, STILL OPEN). The VIEWER/CPU angle is new.

### A-09 Concurrent first write of one record surfaces a raw Prisma P2002 as a 500
- Type: Functional / Priority: P3 (self-heals on retry, but the Prisma error text reaches the client) / Confidence: VERIFIED_TEST (probe P4: 87 `PrismaClientKnownRequestError:P2002` rejections over 30 rounds of 4 concurrent creates) / Status: VERIFIED_BROKEN
- Actual: `upsertEntry`'s create paths (`cms.service.ts:414-422`) are not wrapped the way `createCollectionRow` is (`:219-233`, DM-07). The error is not a `CmsError`, so `translateCms` rethrows it and tRPC returns INTERNAL_SERVER_ERROR with the Prisma message. `errorFormatter` (`trpc.ts:63-108`) does not mask `shape.message`, which for Prisma includes the invocation and code frame (the same leak class as RT-11).
- Expected: The losing create becomes an update, or a CONFLICT carrying the winner's stamp.
- Recommendation: Catch P2002 on `cmsEntry.create` and retry as an update only when the caller is the same writer, otherwise return CONFLICT with the row's `updatedAt`. Separately, mask INTERNAL_SERVER_ERROR messages in production in `errorFormatter`.
- Acceptance: Probe P4 inverted: zero non-`CmsError` rejections.
- Prior: 05 P2-2 (STILL OPEN), RT-11 (collection half FIXED, entry half open).

### A-10 Reference integrity is type-only on the server: dangling references publish, and deletes are not guarded
- Type: Data / Priority: P3 (the client has a "Deleted record" state and a delete guard, so the server is the defence layer) / Confidence: VERIFIED_TEST (probe P7) / Status: VERIFIED_BROKEN
- Actual: `cmsValueError` accepts any string for `reference` (`packages/shared/schemas/cms.ts:170-171`). A REQUIRED reference to a deleted record (`a1` after `deleteEntry`) or to `"no-such-record"` publishes. `deleteEntry` and `deleteCollection` (`cms.service.ts:307-322,433-441`) check neither inbound references nor `projectCmsBindings`. The CMS-06 guard exists only in the client (`CollectionSettingsPane.tsx:55-91`), so a stale tab or a script bypasses it. The publish snapshot resolves exactly one reference hop (`cms.service.ts:996-1009`), so `{{item.author.company.name}}` publishes empty. Downstream mitigation is real: `findUnboundLists` blocks orphaned lists, and `findEmptyBindings` names orphaned field bindings.
- Expected: A required reference must name a live record of `referenceCollection` in the same site. Deleting a referenced record or collection is refused, or answered with the dependent count.
- Recommendation: In the PUBLISHED branch of `upsertEntry`, batch-check reference values against `cmsEntry {id in, collectionId: referenceCollection, deletedAt: null}`. In `deleteCollection`, count bindings in `site.projectCmsBindings` plus inbound reference fields and refuse with `CONFLICT:IN_USE:<n>` unless `force`.
- Acceptance: Probe P7 inverted (INVALID "Author names a deleted record"). A collection delete with 1 binding returns IN_USE.
- Prior: CMS-06 (PARTLY FIXED: client yes, server no), DM-11, 05 P2-8 (one level: STILL OPEN).

### A-11 Entry writes take their rules from `input.collectionId`, not from the record's own collection
- Type: Security / Data / Priority: P3 (same-site EDITOR, crafted request) / Confidence: VERIFIED_TEST (probe P3) / Status: VERIFIED_BROKEN
- Actual: For an existing `input.id`, `upsertEntry` loads validation fields, sanitizer field types and clash peers from `input.collectionId` (`cms.service.ts:347-391`), then updates by `id` alone (`:400-405`). Probe P3 sends a record of collection `strict` (required title) with `collectionId: "lax"`, `data: {}`, `status: PUBLISHED`. It succeeds, and the `strict` record is now PUBLISHED with no title. Cross-SITE access is correctly blocked (`:372`).
- Recommendation: Read `existing.collectionId` and refuse (NOT_FOUND) when it differs from `input.collectionId`, or validate against `existing.collectionId`.
- Acceptance: Probe P3 inverted.
- Prior: new.

### A-12 CSV import stores every value as text and accepts keys that are not fields
- Type: Data / Priority: P3 / Confidence: CODE_EVIDENCE / Status: CODE_GAP
- Actual: `importCsvEntries` copies cell strings as-is (`cms.service.ts:560-566`): number, boolean and date as strings, and a multiselect as one string where the validator requires an array (`cms.ts:158-161`). Rows are created DRAFT, so they pass. The first PUBLISH of an imported multiselect record fails INVALID unless the client coerces. `columnMapping` keys are not checked against the collection's fields (`:556`), and `upsertEntryInput.data` accepts any keys (`cms.ts:387`). Unknown keys persist, ship in `publishSnapshot`, and fill bare `{key}` tokens on template pages because record keys count as fields (`cms.service.ts:910-912`); that also applies to a deleted field's leftover data. The import has no undo, and rows are not transactional (partial success is by design).
- Recommendation: Coerce by field type in the importer (number, boolean, `;`-split multiselect, ISO date) and report coercion failures per row. Drop mapping keys that are not fields. Consider refusing unknown keys in `upsertEntry`.
- Acceptance: A CSV with `price=12`, `tags=a;b` imports as `12` (number) and `["a","b"]`, and a mapping to `bogus` is ignored.
- Prior: 04-cms §5 "CSV stores every value as string" (STILL OPEN), DM-14 / C2 "coercion by type" (NOT BUILT).

### A-13 There is no activity log, restore, purge or rate limit for CMS writes
- Type: Missing State / Priority: P3 / Confidence: CODE_EVIDENCE / Status: EXPECTED_BUT_ABSENT (C2 plan: "Soft delete + restore-by-id; ActivityLog writes")
- Actual:
  - `cms.service.ts` never calls `activity-log.service.ts` (`record`/`recordForSite`), so collection and record deletes leave no trail.
  - Tombstoned rows (`deletedAt`) have no restore procedure.
  - The `soft-delete-purge` cron (`app/api/cron/soft-delete-purge/route.ts:15`) purges sites only, so CMS tombstones accumulate forever, and their rows still count toward nothing but disk.
  - No CMS procedure is rate-limited.
  - Smaller consistency nits:
    - The cap checks are count-then-create without a lock (`cms.service.ts:215-220,426-431`), so concurrent creates can exceed 100 collections or 10,000 records slightly.
    - `touchCmsEdited` runs outside the write and swallows its failure (`:160-169`, documented trade-off).
- Recommendation: Write ActivityLog rows for collection create/delete, record delete and CSV import. Add `cms.collections.restore` and `cms.entries.restore` within a window, and extend the purge cron to CMS tombstones older than that window.
- Prior: DM-19, proposal C2 (NOT BUILT).

### A-14 Unpaginated reads and the server's two-state status
- Type: Performance / Functional / Priority: P3 / Confidence: CODE_EVIDENCE / Status: CODE_GAP
- Actual:
  - `cms.entries.list` returns every non-deleted record with full `data`, unpaginated (`cms.service.ts:334-340`). At the caps (10,000 × 200 KB) that is unbounded in practice.
  - `findEmptyBindings` loads every published row of every bound collection, then does a linear `entries.find` per binding (`:685-702`), which is O(bindings × records) on each pre-publish check. Its entries query is not site-scoped (`:690-694`); it is harmless because collections are site-scoped and the leak would be a boolean only.
  - The server status is `DRAFT | PUBLISHED` (`schema.prisma:482`, `cms.ts:388`), while the editor has `archived` (`cms.ts:40`), so archived round-trips as draft.
  - There is no scheduled record publish.
- Recommendation: Cursor-paginate `entries.list` (or project to the list columns). Index entries by id in `findEmptyBindings`. Add `ARCHIVED` to the server status, or remove it from the editor.
- Prior: 05 P2-3 (archived: STILL OPEN), DM-13, DM-12.

---

## VERIFIED_OK strengths (with evidence)

1. **Every CMS procedure is authorized before the service runs.** Reads use `assertSiteAccess` (ACTIVE workspace member plus site scope). Writes, CSV preview and import, and `publishSnapshot` use `checkSiteRole(…,"EDITOR")` with effective-role caps (`server/trpc/routers/cms.ts:37-55`, `permission.service.ts:92-111,162-203`). Bearer API tokens are refused outright by `protectedProcedure` (`trpc.ts:123-134`).
2. **There is no cross-site IDOR via `collectionId`/`entryId`.**
   - `assertCollectionInSite` guards list and CSV.
   - `upsertEntry` returns NOT_FOUND for an id owned by another site (`cms.service.ts:372`).
   - `deleteEntry` scopes by `collection: { siteId }` (`:434-437`).
   - The collection upsert refuses a foreign id (`:269`).
   - Snapshot and reference targets are filtered by `siteId` (`:992-1009`).
3. **Tombstones and GONE semantics hold.** A tombstoned id is GONE and never resurrected. The conditional `updateMany` carries `deletedAt: null`. A collection delete tombstones its entries in one `$transaction` and frees its slug (`:307-322`). Covered by `cms-tombstones.db.test.ts`, 4/4 pass.
4. **Error translation is correct.** `CmsError` maps to tRPC with `CMS_CONFLICT:` / `CMS_GONE:` / `CMS_INVALID:` prefixes (`translateCms.ts`); `cms-translate.test.ts` passes. CONFLICT and GONE do not bump `cmsEditedAt` (`cms-edited-at.db.test.ts`, 9/9).
5. **The shared validator (DM-09/DM-13) runs on every PUBLISHED upsert.** It covers required, types, min/max, length, pattern (bounded to 1,000 chars), slug format, email, URL with dangerous schemes, record-slug uniqueness and page-path uniqueness among published records. Collection fields go through `cmsFieldsSchema` (unique keys, 100 max) and `cmsPatternError` (path-safe, real fields).
6. **XSS defences are layered.** Every string leaf is markup-stripped with a bounded fail-closed loop (`:120-136`). Rich text goes through the one shared allow-list sanitizer on write and again at output (`:90-92,853-856`). Generated pages pass through the parser-based `sanitizeGeneratedPageHtml` sink, and script/style spans are never substituted. Covered by `sanitize-blocks.test.ts` + `cmsRichText.test.ts` + `cms.service.test.ts`, in the 191/191 pass.
7. **Drafts never leave the server for anonymous or published output.** The share draft, publish snapshot, dynamic pages and empty-binding check read `status: "PUBLISHED", deletedAt: null` only. The share read also projects to bound fields (`:943-974`). Covered by `cms-publish-snapshot.db.test.ts`.
8. **Size caps (DM-12) and CSV caps are enforced server-side** against the server's own parse: 300 KB, 500 rows, 100 columns, 5,000 chars per cell (`:467-487`).
9. **The home page is refused as a template server-side** (C0.9, `:240-242`). The template page is dropped from the publish and named in pre-publish (`publish.service.ts:170-180`).
10. **Dynamic pages reach `sitemap.xml` and get per-page canonicals** through `buildDeployFiles` (`lib/publish-files.ts:185-217`). The cms.service comment saying canonical is "not emitted here" is accurate, and it is emitted downstream. Generated paths pass the same path-safety guard as pages; per A-02, they pass it as a whole-job failure.
11. **CMS edits re-arm the approval gate** via `latestEditAt` = max(lastEditedAt, cmsEditedAt) (C0.10, `publish.service.ts:451-456`), except for the bypass in A-05.

## Prior findings reconciliation

| Prior ID | Claim | Now | Evidence |
|---|---|---|---|
| L3-015 | Rename strips rich text | **STILL OPEN** | Probe P6; `CollectionManager.ts:244-261` order unchanged; no server rename (A-01) |
| L3-016/017/018/020/021/023 | Canvas / UI | Not in track A scope (client) | — |
| L3-019 | Collection INVALID dropped silently, blocks publish | **STILL OPEN** | `onCmsInvalid` is defined at `cmsSync.ts:265`, and git grep finds no subscriber outside tests. Server emits `CMS_INVALID:` correctly. |
| L3-022 | Blind writes; precondition opt-in | **STILL OPEN** (scope corrected: API tokens cannot reach CMS) | Probe P1; `cms-conflict.db.test.ts:60`; `trpc.ts:123-134` (A-06) |
| 05 P1-2 | Rename write ordering | **STILL OPEN** | = A-01 |
| 05 P1-3 | `onCmsInvalid` no subscriber | **STILL OPEN** | as L3-019 |
| 05 P2-1 | `_skipTouchCmsEdited` public | **STILL OPEN** | Probe P2 (A-05) |
| 05 P2-2 | Entry create P2002 → 500 | **STILL OPEN** | Probe P4 (A-09) |
| 05 P2-3 | Archived sent as DRAFT | **STILL OPEN** (server half) | `schema.prisma:482`, `cms.ts:388` (A-14) |
| 05 P2-8 | One reference level | **STILL OPEN** | `cms.service.ts:996-1009` (A-10) |
| 05 P2-9 | Dynamic vs static path collision | **NOT REPRODUCIBLE as a file collision.** Static pages are `<slug>.html` and generated pages are `<x>/index.html`. Real adjacent defects: duplicates among generated paths (A-07) and the `api/` path (A-02). | Probes P5, P8 |
| 05 P2-10 | `generateDynamicPages` no caller | **STILL OPEN**, now also P2 security (A-08) | `check-trpc-orphans.mjs:80` |
| 07 | CMS procedures gated | **VERIFIED_OK** | Strength 1 |
| 04 CMS-06 | Collection delete unguarded | **PARTLY FIXED**: client guard (`CollectionSettingsPane.tsx:55-91`), server none (A-10). Publish checks catch orphans. | — |
| 04 CMS-07 | Duplicate record slugs accepted (client + server) | **FIXED** for new PUBLISHED writes (`cmsRecordClash`). Residual race and schema-change gap in A-07. | `cms.service.ts:378-391` |
| 04 CMS-09 | Slug not a real type; min/max never enforced | **FIXED** (server side) | `CMS_FIELD_TYPES` includes `slug`; `cmsValueError` length + slug format |
| 04 CMS-20 | Type change, no conversion | **STILL OPEN** (server half) | A-07 |
| 04 §5 | "Server stores untyped JSON, validates nothing" | **FIXED** for PUBLISHED. Drafts stay free-form by design. | Strength 5 |
| 04 §5 | CSV values all strings | **STILL OPEN** | A-12 |
| DM-01 / C0.1 | Publish from IndexedDB | **FIXED** (server half) | `publishSnapshot` + `getPublishedCmsForCollections`; DB test passes |
| DM-02 / C0.2 | Server rename mutation | **NOT BUILT** | A-01 |
| DM-03 / C0.3 | `version` precondition, per-field schema ops | **PARTIAL**: optional `updatedAt` precondition only, and the whole-array fields upsert remains | A-06 |
| DM-04 / C0.4 | Tombstones | **FIXED** | Strength 3 |
| C0.7 | Empty bindings named pre-publish | **BUILT** | `findEmptyBindings`, `publish.service.ts:186-203` |
| C0.9 | Home page not a template | **FIXED** | Strength 9 |
| C0.10 / DM-08 | CMS edit marks site edited, re-arms approval | **FIXED**, with the bypass in A-05 | `cmsEditedAt`, `latestEditAt` |
| C0.5/C0.6/C0.8/C0.11/C0.12 | Client items | Not verified in track A | — |
| DM-07 / RT-11 | Unique-key 500s | **FIXED** for collections, **OPEN** for entries | A-09 |
| DM-12 | Size caps | **FIXED** (technical caps). Plan limits wait on PD-9. | `cms.ts:59-62` |
| DM-11 | Reference field | **BUILT** client-side. Server is type-only. | A-10 |
| C2 server items | Restore, ActivityLog, import coercion, export | **NOT BUILT** | A-12, A-13 |
| C5 | Sources/Views/externalId/CmsSyncRun | **NOT BUILT** (no `externalId`, `CmsSyncRun`, `CmsView`, `CmsSource` in `schema.prisma`) | git grep |
| BD-27 | Rollback resurrects withdrawn records | **STILL OPEN** (arguably by design). `rollbackPublish` re-sends the stored page set, which already contains the old generated pages; `appendDynamicPagesToPublish` finds no template and skips. | `publish.service.ts:800-815`, `cms.service.ts:1043-1060` |

## Not verified
- Live app (track A is code- and test-only). Vercel's behaviour on duplicate file paths (A-07). The real proxy timeout on cPanel (A-04).
- Client halves of the reconciled items (L3-016..L3-023). `cmsSync` retry behaviour on a P2002 500.
- The DB tier may share `buildrik_test` with concurrent sessions. My runs were green, with no cross-talk observed.
