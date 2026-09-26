# Lane Ldata report — two pre-existing data-integrity bugs

Worktree `/Users/shahg/Desktop/buildrik-af-Ldata`, branch `fix/audit-Ldata`, base `90c0a51ee`.
Commits (first-parent): `472c723be` → `d160e5d08` → `00b1b1be7` → `87c184a7f` (merge of `fix/audit-2026-09-25` @ `5079568ee`, Lrt; no conflicts) → `59d1d46a0`.

## Bug A — cross-tenant FormBlock collision — fixed `d160e5d08` (+ refactor `472c723be`)

**Root cause.** `FormBlock.id` (global PK) was set to the form element id. Evidence:
- publish worker `packages/dashboard/app/api/workers/publish/[jobId]/route.ts` (old :364) `prisma.formBlock.upsert({ where: { id: form.blockId }, create: { id: form.blockId, siteId, … }, update: { fields, isActive: true } })`. Site B publishing a form whose id site A already owned hit A's row: `update` rewrote A's `fields`/`isActive`, no row was created for B.
- `submitForm` looked up `findFirst({ id, siteId, isActive })`, so B's visitors got `FORM_NOT_FOUND`.
- `updateFormBlock` refused B outright with `FORM_NOT_FOUND` (ownership check on the global id). The forms router read `notifyEmail` by the global id.
- `wireForms` (`lib/publish-forms.ts`) takes `data-buildrik-id ?? id`. Sites built from one template share page-1 element ids, and AI forms share HTML ids such as `contact-form`.
- Before the re-key, a DB test showed site A's row overwritten and only one row for two sites (6/6 red).

**Fix.**
- Schema: `@@unique([siteId, blockId])`. `id` stays the PK as a cuid surrogate. `FormSubmission.formBlockId` still references `FormBlock.id`. The FK needed no change because existing ids are untouched.
- Migration `20261003100000_form_block_site_scoped_identity`:
  - `blockId` has been NOT NULL since the baseline, and every writer set it to the element id, so no backfill is needed.
  - It merges any site's duplicate `(siteId, blockId)` rows onto the row with `id = blockId` (otherwise the latest `updatedAt`). It moves submissions first, then deletes the rest, then creates the unique index.
  - The only way to get duplicates: a duplicated site whose source was hard-deleted, after which the copy was published. I exercised the dedupe in a rolled-back transaction on buildrik_test.
  - The PK already stopped a second site from getting its own row. Such a site has NO row today and gets one on its next publish. Site A's row may carry B's `fields`/`isActive` from B's publishes. That cannot be un-mixed; A's next publish rewrites `fields`.
- Service (`form-submission.service.ts`): `submitForm`, `getFormBlockSettings`, `updateFormBlock`, `getPublishedFormSettings` (keyed by blockId) and `recordPublishedForms` (upsert and sweep) all use `(siteId, blockId)`. A submission links to `formBlock.id`. The cross-site ownership check is gone because the key makes the overwrite impossible.
- The worker's raw-Prisma form writes moved into the service in `472c723be` (pure refactor, then keyed).
- Router `forms.updateBlock`: the notifyEmail diff now reads through `getFormBlockSettings` instead of raw Prisma by the global id.
- Unchanged: the public route (it already has siteId in the path), `lib/publish-forms.ts` (it posts `/api/public/forms/<siteId>/<blockId>`; only comments changed), and dashboard/editor lists (they use the surrogate `id` consistently).

**Tests.**
- New `__tests__/db/form-block-site-scope.db.test.ts` (6):
  - two sites with the same id get two rows;
  - each site keeps its own inspector settings;
  - each site's submission lands on its own row;
  - one site's sweep never touches the other;
  - a second `(site, blockId)` row is refused;
  - a copied surrogate-id row is found by publish.
- Changed: `__tests__/form-submission-service.test.ts` (upsert key; removed the obsolete "other site" refusal test) and `server/trpc/routers/__tests__/forms.test.ts` (reads through the service; the Prisma mock is empty).

**Read-only prod SQL — run it BEFORE the migration** (it relies on today's `id = element id`):
```sql
-- Sites with a form element whose id another site's FormBlock row owns, and no row of their own:
-- their public submissions are FORM_NOT_FOUND today, and each of their publishes rewrote the owner's row.
WITH RECURSIVE el AS (
  SELECT p."siteId", p.blocks AS node
  FROM pages p JOIN sites s ON s.id = p."siteId" AND s."deletedAt" IS NULL
  UNION ALL
  SELECT el."siteId", c
  FROM el, jsonb_array_elements(CASE WHEN jsonb_typeof(el.node->'children') = 'array' THEN el.node->'children' ELSE '[]'::jsonb END) c
), forms AS (
  SELECT DISTINCT "siteId", node->>'id' AS block_id FROM el WHERE node->>'type' = 'form' AND node ? 'id'
)
SELECT f."siteId" AS victim_site, s."publishedUrl" IS NOT NULL AS victim_published,
       f.block_id, fb."siteId" AS row_owner_site, fb."updatedAt" AS owner_row_last_written
FROM forms f
JOIN sites s ON s.id = f."siteId"
JOIN form_blocks fb ON fb.id = f.block_id AND fb."siteId" <> f."siteId"
LEFT JOIN form_blocks own ON own."siteId" = f."siteId" AND own."blockId" = f.block_id
WHERE own.id IS NULL
ORDER BY victim_published DESC, f.block_id;
-- Summary: SELECT count(DISTINCT victim_site), count(DISTINCT row_owner_site), count(*) FROM (<query above>) q;
-- Rows the migration will merge (same site, same blockId twice):
SELECT "siteId", "blockId", count(*) FROM form_blocks GROUP BY 1,2 HAVING count(*) > 1;
```
Caveats:
- The query uses the stored element tree. Forms that take their id from an HTML `id` attribute differ from the element id and are not counted.
- Refused submissions are not stored, so how many visitors hit `FORM_NOT_FOUND` is unknowable from the DB.

## Bug B — CMS bindings dropped — fixed `00b1b1be7`

**Root cause.**
- `Composer.exportProject()` writes `cmsBindings`, and `importProject()` restores them (engine/Composer.ts).
- The editor sends them via `BuildrikSyncProvider.saveProjectNow` (it spreads projectData).
- But `editorSaveProjectSchema.projectData` (`packages/shared/schemas/sites.ts`) had no key for them, so zod stripped them. `saveProjectFromEditor`/`saveProjectData` had no field, `Site` had no column, and `projectDataFromRows` read none.
- Before the fix, the DB test showed `projectCmsBindings` undefined after save (4/4 red).

**Fix.**
- Storage: `Site.projectCmsBindings Json?`, beside `projectStyles`/`projectSettings`. I chose a column over `projectSettings` because settings flow through `applyProjectSettings` and the column-mirror logic, while bindings are a separate element-keyed map. Migration `20261003110000_site_project_cms_bindings` (additive, nullable, no backfill).
- Shared `cmsBindingsSchema`:
  - element-id keys validated with `isSafeElementId` (element-markup.ts; `packages/shared/content/elementIds.ts` has no validator);
  - at most 5000 bound elements, at most 50 bindings per element;
  - string lengths bounded;
  - known fields of `CMSElementBinding` / `CMSCollectionBinding` only.
  It is on both `editorSaveProjectSchema.projectData` and `saveProjectDataSchema`. `ProjectData.cmsBindings` is typed from it (SSOT).
- The service writes it INSIDE the existing A-2 CAS `updateMany` (no second write). A refused save writes no bindings, and `undefined` leaves the stored ones alone. `getProjectData` returns `cmsBindings`, and `sites.get` returns every scalar.
- Editor: `projectDataFromRows` maps `projectCmsBindings` to `cmsBindings`. Publish and export read `composer.cms.bindings` (CMSExportResolver; `renderProjectPages` imports the loaded project), so a reloaded project now publishes bound values.

**Tests.**
- New `__tests__/db/cms-bindings-persist.db.test.ts` (4): save then reload through both load paths; a stale save writes nothing; an omitted field keeps the stored value; an unsafe element-id key is refused.
- `projectDataFromRows.test.ts` +1: rows to `cmsBindings`, and null to undefined.
- The existing `Composer.cmsBindings.test.ts` covers import into the composer.

## Last part — duplicateSite and the re-id backfill (after Lrt merged) — `59d1d46a0`

- `duplicateSite`:
  - copied FormBlock rows get a fresh surrogate id (no explicit id) under `(newSiteId, blockId)`;
  - they now also carry `successAction` / `redirectUrl` / `spamProtection`, which were dropped before, so a copy lost its redirect and honeypot settings;
  - `projectCmsBindings` is copied, plus an entry per renamed element id (`copyIdKeyedRecord`, same as the editor's load).
- `copiesForRenamedIds` matches on `blockId` only.
- `scripts/audit/reid-duplicate-elements.mjs`:
  - creates copies without an id;
  - the idempotency check is `findUnique({ siteId_blockId })`;
  - copies element-keyed `projectCmsBindings`;
  - per-site try/catch logs `site=<id> FAILED <msg>` and ends with `process.exitCode = 1` if any site failed;
  - the header was rewritten. It now says the Ldata migrations must be applied first.
- Tests:
  - new `__tests__/db/duplicate-site-forms.db.test.ts` (2, red then green): every setting is carried under the copy's key, one row per renamed id, the copy's publish finds the rows, the source is untouched, bindings are copied per rename;
  - `elementIds.test.ts` pins that the surrogate id is ignored;
  - `Composer.duplicateIds.test.ts`: Lrt's binding literal was given the real stored shape (it failed type-check once the type was tightened).
- Ran the script `--apply` twice on buildrik_test with a seeded collision: 1 form copy and 1 binding copy, then a no-op.

## Gate
- Unit tests (`--maxWorkers=2`, touched files only), all green:
  - form-submission-service, forms router, public forms route, publish worker;
  - sites-save-project, save-project-styles-sanitize, save-project-empty-snapshot, sites-service, sites-service.dsSchemaVersion, schema-integrity;
  - elementIds, projectDataFromRows, Composer.cmsBindings, Composer.duplicateIds.
- `pnpm test:db`: 15 files / 62 tests green, on the run with no other test:db client connected.
- `npx tsc --noEmit -p packages/dashboard`: 0 errors. `-p packages/editor`: 0 errors.
- `prisma migrate diff` from buildrik_test to the schema: no difference.
- Migrations applied to buildrik_test (via test:db) and buildrik_verify (`migrate deploy`: both applied). The dev DB was not touched.

## NOT verified
- Live browser: publishing two same-template sites and submitting each public form, the inspector AFTER SUBMIT on both, and editor reload keeping a bound element's CMS value and the published HTML showing it. These need Phase 2.
- The prod SQL was not run (no prod access). It is written against the current schema.

## Concerns / notes
- **Shared buildrik_test.**
  - My first test:db found `20261002100000_site_version_updated_at` recorded as FAILED ("column already exists"; the column was present with an identical definition). I ran `prisma migrate resolve --applied` on **buildrik_test only**.
  - The controller's test:db ran against buildrik_test at the same time as mine. That produced 6 unrelated failures (signup race, uploads), and all 62 passed once it finished.
  - buildrik_test now holds my two migrations, which `fix/audit-2026-09-25` lacks until merge.
- **Out of scope, not fixed:** the `/share/<token>` draft (`getShareDraftRows`) does not select `projectCmsBindings`, so shared drafts still render unbound. It is a 2-line follow-up.
- The publish worker still has other raw Prisma calls (pre-existing).
- **Deploy order:** run both migrations before the code deploy (CHANGELOG lines added), then the re-id backfill per its header.
- **Cross-lane edits:**
  - `scripts/audit/reid-duplicate-elements.mjs`, `packages/shared/content/elementIds.ts` and its test, `Composer.duplicateIds.test.ts` (Lrt files, done as instructed after the merge);
  - `packages/shared/schemas/sites.ts`, `packages/editor/src/shared/types/project.ts`.

## Fix round 1 (review CHANGES_REQUIRED) — `af89f5e15..2e1e93a8b`

| Item | Commit | Evidence |
|---|---|---|
| I1 share draft bindings | `af89f5e15` | `getShareDraftRows` selects `projectCmsBindings` and passes it on `rows.site`, which feeds `projectDataFromRows` in `draft-preview.tsx`. It is not in `siteColumns`. New test in `share-link.visitor.test.ts`: red, then green. |
| I2a Show clamp | `2d6b9af64` | `CollectionListSection` applies `Math.min(n, CMS_COLLECTION_LIMIT_MAX)`; the constant is exported from shared (SSOT). Test with 999999 → 10000: red, then green. |
| I2b lenient parse | `2d6b9af64` | Shared `filterCmsBindings` drops bad entries one at a time: an unsafe or too-long element id, a malformed field binding (checked per item in the list), or an out-of-range or malformed collection binding. It also caps counts. `cmsBindingsSchema` is now `z.preprocess(filterCmsBindings, shape)`, so the parse never refuses a save. |
| I2c test | `2d6b9af64` | `cms-bindings-persist.db`: a save with 1 malformed field binding, 1 unsafe id and 1 limit=999999 persists the pages and exactly the valid bindings. Before the fix: ZodError. |
| I3 coalesce in migration | `fd824fd2c` | Before the DELETE, the survivor's null `pageId`, `successMessage`, `redirectUrl`, `notifyEmail` and `webhookUrl` are COALESCEd from the removed rows, newest `updatedAt` first. Re-applied on buildrik_test and buildrik_verify: dropped the index, deleted the `_prisma_migrations` row, ran `migrate deploy`. Row counts before/after: test form_blocks 1/1 distinct 1, submissions 0; verify form_blocks 1/1 distinct 1, submissions 1 — unchanged. The index is present and the migration row is finished on both. |
| Minor: dedupe migration DB test | `fd824fd2c` | `form-block-dedupe-migration.db.test.ts` runs the committed .sql statements that come before `-- CreateIndex`, against 3 rows for one (site, blockId) with a submission on each, plus another site's row with the same blockId. Result: 1 row left, 3 submissions repointed, settings coalesced newest-first, the other site untouched. Red before the coalesce (notifyEmail/webhookUrl/redirectUrl were null). |
| Minor: size cap | `2d6b9af64` | Over `MAX_CMS_BINDINGS_BYTES` (1,000,000 serialized), `saveProjectData` warns and does not write the column; the pages are still saved. DB test with 4000 × ~400-byte entries: red, then green. |
| Minor: `stored as CmsBindingsInput` | `2d6b9af64` | `duplicateSite`'s `copyCmsBindings` now reads through `filterCmsBindings`. |
| Minor: createMany skipDuplicates | `2e1e93a8b` | DB test seeds a stale row whose blockId equals the copy's re-id target. Before the fix: P2002 "Unique constraint failed on (siteId, blockId)". Green after. |
| Minor: FormAfterSubmitSection comment | `2e1e93a8b` | The comment now describes the (siteId, blockId) key and says `id` is a surrogate. |
| Minor: reid header | `2e1e93a8b` | Added "Run with editors quiet: these writes bypass the lastEditedAt CAS". |
| SKIP: P2002 first-write race | — | Pre-existing; the controller logs it. |

Gate:
- tsc `-p packages/dashboard`: 0 errors. tsc `-p packages/editor`: 0 errors.
- Touched unit tests (`--maxWorkers=2`): 16 files, 117 tests, all passing.
- `pnpm test:db`: 16 files, 65 tests, all passing. The `pg_stat_activity` idle check returned 0 before every DB run.

Notes:
- The coalesce leaves the non-null defaulted columns (`successAction`, `spamProtection`, `submitButtonText`, `isActive`) as the survivor has them. They have no "unset" value to fill from.
- With `skipDuplicates`, a stale colliding row stays as it was. The renamed form on the copy reads that stale row's settings.

## Fix round 2 (stored-XSS via persisted bindings): `1a7cd2f56`

| Item | Evidence |
|---|---|
| Write boundary | `cmsFieldBindingSchema.property` is now `z.enum(CMS_BINDABLE_PROPERTIES)`, with values content, src, href, alt and title. An entry whose src/href fallback fails `isDangerousUrl` (the element-markup function) is refused by a refine. Both drops are per entry, via `filterCmsBindings`. |
| SSOT | `CMS_BINDABLE_PROPERTIES` and `isSafeCmsBoundValue(property, value)` live in `packages/shared/schemas/sites.ts` next to the schema. They are imported by the schema, `CMSExportResolver`, and `CMSBindingManager`. `CMSElementBinding.property` and the `bindToField` parameter are typed `CmsBindableProperty`. |
| Sinks | `CMSExportResolver.applyValue` and `CMSBindingManager`'s apply both return early when `isSafeCmsBoundValue` is false. This covers an off-allowlist property, and a dangerous src/href URL coming from a CMS entry value or a fallback. |
| DB test | `cms-bindings-persist.db` saves `onmouseover`+`alert(1)`, an href `javascript:` fallback and a src `data:text/html` fallback. All are dropped, the pages save, and the valid bindings are kept. This test was red before the fix. |
| Unit tests | `CMSExportResolver`: a `javascript:alert(1)` href from an entry is not written and the original href stays; an `onclick` binding is not applied; a safe href is written. `CMSBindingManager`: `onclick` and a `javascript:` href are never passed to setTrait, while the allowlisted `alt` is. All were red before the fix. |
| Existing test rewritten | The `CMSBindingManager` test "unknown properties fall through to setTrait" asserted the old unsafe behaviour; it now binds `title`. Fixtures that used the never-emitted `textContent`, `text` or `data-label` now use allowlisted names. |
| Minor | The size cap is renamed `MAX_CMS_BINDINGS_CHARS`, because it counts UTF-16 units. |

Gate:
- tsc for dashboard and editor: 0 errors each.
- Touched vitest (`--maxWorkers=2`): 24 files, 212 passed, 1 todo.
- `pnpm test:db` (idle check returned 0): 16 files, 66 tests passing.

## Fix round 3 (canvas sinks): `f386f6270`

| Item | Evidence |
|---|---|
| I1 useCMSPreview | The switch is replaced: if `isSafeCmsBoundValue(p, v)` fails, nothing is written. Otherwise `content` is set via `textContent` and anything else via `setAttribute`. In `useCanvasContent.cms.test`, a `javascript:alert(1)` href from an entry is not written, while a content binding in the same run is (control). The old test asserted that the off-allowlist `data-sku` property was applied; it now asserts it is not. |
| I1 import validation | `CMSBindingManager.import` and `importCollectionBindings` now run the shared `filterCmsBindings` per entry. Bindings arriving from version restore, the local cache or collab are therefore filtered. A `Composer.cmsBindings` test runs `importProject` with an `onclick` binding, a `javascript:` href fallback, an unsafe element id and a collection `limit` of -5. All are dropped and the valid entries are kept. |
| I2 content escape | `applyBinding` calls `setContent(escapeHtmlText(value))`. In a `Composer.cmsBindings` test, an element bound to `<img src=x onerror=alert(1)>` produces `toHTML()` output that contains `&lt;img` and not `<img`, and this still holds after `unbindAll`. |
| One escaper | `escapeHtmlText` lives in shared `element-markup.ts`. It replaces `RepeaterRenderer`'s private `escapeHtml`, plus identical copies in `recordTemplatePreview.ts` and `cms.service.ts`. |

Other CMS-value sinks, checked via a grep for `resolveBinding`, `queryContent` and entry-value writes:
- **Guarded now:**
  - `RepeaterRenderer` attribute substitution, which covers repeaters and collection lists on the canvas and on publish. A substituted value in a URL attribute that `isDangerousUrl` flags is removed. The new `RepeaterRenderer` test shows the dangerous href and src dropped while safe ones are kept.
  - `DataBindResolver.resolveDataBindings` skips dangerous src/href values. A new test covers this.
- **Already safe:**
  - `CMSExportResolver` (round 2).
  - Server dynamic pages in `cms.service`: escaped, then passed through the `sanitizeGeneratedPageHtml` parser.
  - `recordTemplatePreview`: escaped, then `sanitizeHTML`, then shown in a sandboxed iframe.
  - `RepeaterRenderer` text substitution: already escaped, now using the shared escaper.
  - `ContentSection` preview: rendered as React text.
  - The CMS workspace tables: rendered as React.

Gate:
- tsc for dashboard and editor: 0 errors each.
- vitest across every test file touching the changed modules plus `cms.service` (`--maxWorkers=2`): 25 files, 239 passed, 1 todo.
- `pnpm test:db` (idle check returned 0): 16 files, 66 tests passing.
