# Lane Lrt report — bugs from live verification

Worktree `/Users/shahg/Desktop/buildrik-af-Lrt`, branch `fix/audit-Lrt`, base `bda180a95`.
Commits `902238948..7d032ee8f` (5 commits, one per bug). Never pushed, never stashed.

## 1. B-14/A02-9: Issues panel ignored content issues (fixed `902238948`)
- **Root cause:** `useContentIssueScanner` scanned `composer.elements.getAllPages()`. Each `page.root` there is a snapshot, and `buildElementTree` empties its `children` when it hands them to the element registry. I probed a real Composer with the stored S2 `blocks` shape: the snapshot had `kids []` and `detectContentIssues(snap) = []`, while `exportPages()` had 3 kids and 2 findings. Every loaded project scanned as empty. S2 also has a hero link `href:"#"` that should have raised a warning and didn't, which is more evidence of the same cause. (The seeded `el-verify-b2-*` elements are no longer in the DB; a later save overwrote them.)
- **Fix:** scan `exportPages()`, the live-tree serializer that the export and save paths use.
- **Test:** `src/editor/shell/hooks/__tests__/useContentIssueScanner.test.ts` (new). It uses a real Composer, `importProject` with the stored shape, and an image added after load. Both cases were red before the fix. `useIssuesFeed.test.ts` fake changed to `exportPages`.

## 2. B-15/A02-9: Publish had no content checks (fixed `8c3ed5625`)
- **Root cause:** `runPrePublishChecks` had no alt-text or broken-link check. The detector lived only in `packages/editor/src/engine/content`.
- **Fix:** `git mv` the detector to `packages/shared/content/contentIssues.ts`. It now uses a structural `ContentElement`/`ContentPage` type and no editor imports; `isUrl` is inlined as `parsesAsUrl`. I also added:
  - `existingPageIds` so the server can scan live pages while checking `#page:` targets against every page (the editor's rule)
  - `asContentRoot(blocks)` for stored JSON
  - `CONTENT_CHECK_LABELS`
  - malformed `children` is now skipped instead of throwing

  Wiring:
  - The editor scanner imports it from `@buildrik/shared/content/contentIssues`.
  - The server adds "Image alt text" and "Links" rows. They are warnings and never block (`ready` stays true).
  - `useIssuesFeed` drops those two server rows, because the scanner already lists each fact per element.
- **Tests:**
  - `server/services/__tests__/publish-prechecks-visibility.test.ts`: 2 new cases with the real stored S2 root shape; red before the fix.
  - `packages/shared/content/__tests__/contentIssues.test.ts`: moved, plus `existingPageIds`, malformed children and `asContentRoot`.
  - `useIssuesFeed.test.ts`: dedupe case. It was written after the filter, so I did not watch it go red.

## 3. C-4: CMS RecordsTable crash (fixed `f998df679`)
- **Root cause:** the verify seed (`buildrik-af-verify/scripts/audit/seed-verify.ts:435`) stored fields as `{ id, name, type }` with no `slug`. That makes a column key `undefined`, so `sort?.key === key` is true when nothing is sorted (`undefined === undefined`), and `sort.dir` then reads `null`. `toggleSort` had the same shape. The live collection was re-saved with slugs at 10:02, after the run, which is why it renders on :3100 today (confirmed live via Playwright). The shared zod schema requires a slug, so tRPC writes can't produce this. Legacy or direct DB rows can.
- **Fix:** compare only against a non-null sort in `head()` and in `toggleSort`.
- **Test:** `src/editor/cms/__tests__/RecordsTable.test.tsx` (new). It uses the stored slugless collection with a null sort and with a sort by Updated. It reproduced the exact live `TypeError` before the fix.

## 4. C-9: forbidden save not recognised (fixed `8e7f400b2`)
- **Root cause:** the server throws `TRPCError FORBIDDEN` with the message "Insufficient permissions" (`permission.service.ts` `checkSiteRole`). `isForbiddenSaveError` regex-matched `/forbidden|403/` on the message, so the error fell through to `explainSaveError`'s "Permission denied" branch. The existing tests used made-up messages like "FORBIDDEN".
- **Fix:** `isForbiddenSaveError(err: unknown)` checks `data.code === "FORBIDDEN"` or `data.httpStatus === 403`. It duck-types rather than using `instanceof`, and keeps the message regex for errors that aren't from tRPC. The manual save, autosave and load paths now pass the error object.
- **Tests:**
  - `useSaveCallback.test.ts`: `TRPCClientError.from({ data: { code: "FORBIDDEN", httpStatus: 403 }, message: "Insufficient permissions" })`; red before the fix.
  - `useComposerInit.offline.test.ts`: same shape through autosave.

## 5. X-A1: Home tab selected but canvas shows Contact (fixed `7d032ee8f`, added by controller)
- **Root cause:** the tab bar and canvas agree on the active page id. They disagree on which element tree that page is. All S1 pages store root `id: "root"`, and so does every page the AI-generate worker writes (`packages/dashboard/app/api/workers/ai-generate/[jobId]/route.ts:43`, whose section ids `ai-<type>-<i>` also repeat across pages). The element registry is keyed by id across all pages, so the last page imported (Contact) owns "root". `toHTML` draws Contact under the Home tab.
- **Data loss:** `exportPages()` also writes Contact's tree into every page on save. The verify DB now holds one identical tree for S1's Home, About and Contact (`el-muhwzj1l-lf4feao62s/input` in all three).
- **Fix:** `PageManager.importPage` re-ids any element whose id is already taken, either by an earlier page or earlier in the same tree, before the tree is registered. The first owner keeps its stored ids, and the next save persists the new ones.
- **Test:** `src/engine/elements/__tests__/ElementManager.importIds.test.ts` (new) loads 3 stored pages that share root and section ids. It checks the canvas HTML, page switching, that `exportPages` keeps each page's own tree, and that the first page keeps its ids. All 4 cases were red before the fix.
- **Not explained:** the verifier said clicking Home fixed the canvas. By code reading, `toHTML` still resolves "root" to the last page after a click. I couldn't re-observe it because the live data is already collapsed into one tree.

## Gate
- vitest (`--maxWorkers=2`, touched files only): editor 8 files / 91 tests pass; root 3 files / 42 tests pass.
- Engine tests that call `importProject` (12 files / 66 tests) also pass after fix 5.
- `npx tsc --noEmit -p packages/editor`: 0 errors. `-p packages/dashboard`: 0 errors.
- `verify:ds`: fails only at `check-token-resolution` on `--bk-danger` in `FormAfterSubmitSection.tsx:240`, which is Lfinal's file. Because the chain stops there, I ran every gate after it by hand; all pass, including tsc-baseline 0/0 and chrome-ui-surface.

## Not verified
- None of the five fixes has been checked in a live browser on this worktree. :3100 runs the base code, so the controller's Phase 2 needs to re-run B-14/A02-9 (both rows), C-4 (plus the D-11 CMS half), C-9 and X-A1.
- S1's pages in `buildrik_verify` are already collapsed into one identical tree, so X-A1 has to be re-seeded before it can be re-verified.
- The server's alt/link rows are only unit-tested with a mocked Prisma. They haven't been checked against a real `sites.prePublishChecks` response.

## Cross-lane edits
- None. I didn't touch `FormAfterSubmitSection`, the forms router, `CommandPalette`, `VersionList` or the sanitize-blocks comments.

## Out-of-scope findings
1. The AI-generate worker (`sectionsToBlocks`) and `prisma/seed.ts:118` still write `id: "root"` and ids that repeat across pages. The import-time fix neutralises this in the editor, but anything reading `blocks` server-side before the first editor save still sees duplicate ids. That includes the publish checks, which only use page ids, so they are fine.
2. In `runPrePublishChecks`, the `emptyPages` check tests `Array.isArray(p.blocks) && length === 0`. `blocks` is a root object in practice, so "Empty pages" can never warn for a real page.
3. The CMS hydration step (`cmsSync.ts`) passes stored fields through without checking them. A slugless legacy field now renders safely, but its cells read `data[undefined]`, so they show blank.

---

# Fix round 1 (controller review of bug 5): commits `c1ea37aad..0e02960fa`

| Commit | What |
|---|---|
| `c1ea37aad` | editor: one deterministic re-id scheme; blank pages; id-keyed data follows (IMPORTANT 1–3 + Lrt2 repro) |
| `4cc28e5d6` | server: every page write path stores ids unique across the site (IMPORTANT 4) |
| `a572c664e` | minors: slugless CMS fields hydrate as `slug = id`; an empty root object counts as an "Empty page" |
| `0e02960fa` | backfill `scripts/audit/reid-duplicate-elements.mjs` + `reidSite` (shared by backfill and `duplicateSite`) |

**SSOT:** `packages/shared/content/elementIds.ts` provides `stableElementId`, `claimUniqueIds`, `withUniqueIds`, `reidSite`, `blankPageRoot`, `copyIdKeyedStyles` and `copyIdKeyedRecord`. The editor, the server paths and the backfill all use it.

## IMPORTANT 1 — blank pages collapsed (fixed `c1ea37aad`)
- `BuildrikSyncProvider` gave every page stored as `[]` the same `DEFAULT_ROOT` object. It now calls `blankPageRoot(page.id)`, a fresh object with a per-page id.
- `PageManager.importPage` now `structuredClone`s the root before lift and re-id, so import never mutates caller data.
- Test (`Composer.duplicateIds.test.ts`): two `[]` pages; a child added to A doesn't appear on B; the roots are distinct objects and unmutated after load.
- `buildrik-sync-provider.test.ts` "uses default root" was rewritten to the per-page root. It had pinned the shared constant.

## IMPORTANT 2 — id-keyed data (fixed `c1ea37aad`)
- `importPage` returns its renames, and `importProject` copies onto the new ids:
  - style rules keyed `[data-buildrick-id="<old>"]`, including media and pseudo variants
  - CMS field and collection bindings

  These are copies, not moves: the original stays with the page that kept the old id.
- Test: page 2 shares an id with page 1, and that id has a mobile media rule and a CMS field binding. After load, both apply to the re-id'd element and survive `exportProject`. The original is also kept.
- **In-tree refs were deliberately not rewritten.** `href="#x"`, `for` and `aria-*` target the HTML `id` attribute. `generation.ts:71` emits `id="${attributes.id}"`, separately from `data-buildrick-id` (`:63`), and re-id never touches `attributes`, so those refs keep resolving. A shared test pins this: after a re-id, `attributes.id` is unchanged. Rewriting them to the element id would break them. If the controller disagrees, this is the one ruling deviation.

## IMPORTANT 3 — deterministic (fixed `c1ea37aad`)
- `stableElementId(pageKey, oldId, occurrence)` is two FNV-1a 32-bit hashes, giving ids like `el-…`.
- Pages are processed in position order (the sync provider sorts by position), and the first page keeps its ids.
- Test: two independent loads of the same rows, given in reversed input order, produce identical ids. Page 1 keeps `root`.

## Lrt2 repro (pinned)
- Test: 3 pages all rooted at `"root"`, plus an element added on page 2. `exportProject` (the autosave payload) keeps pages 1 and 3 distinct and slider-free, and the canvas draws page 2.
- This case was already green from `7d032ee8f`; it stays in as a pin.

## IMPORTANT 4 — server sources (fixed `4cc28e5d6`)
- **Template paths:** `pagesFromTemplate` is the single mapping for `useTemplate`, `applyTemplateToSite` and `sites.create`'s template branch. It sorts by position and runs `withUniqueIds`.
- **AI worker:** `withUniqueIds` runs over the generated pages.
- **`prisma/seed.ts` templates:** stored unique.
- **`cloneSiteAsTemplate`:** stores unique ids.
- **`duplicateSite`:** uses `reidSite` keyed by the original page id, so the copy gets the ids the editor gives the original. Id-keyed `projectStyles` rules are copied, and a form block's `blockId` follows its renamed element.
- **Blank pages:** `pages.create` and a blank site's Home write `blankPageRoot` instead of `[]`.
- **Page keys when the row has no id yet (`createMany`):**
  - template, seed and clone paths: `site:slug` (or `templateSlug:slug`)
  - AI worker: `site:index`
  - The output is still unique and deterministic. Page-id keying is used wherever a page id exists (editor, duplicate, backfill).
- **Other writers:** `saveProjectData`'s upsert writes whatever the editor exported, which is now unique. No other page writer exists (grep of `page.create|createMany|upsert`).
- **Tests (one per path, all red first):** template apply, clone-as-template, duplicate with a colliding form and style rule, `pages.create`, blank site, AI worker.

## Minors (fixed `a572c664e`)
- **`cmsSync` hydration:** a field with no slug gets `slug = id`. Test red first. The Date-normalisation hydrate fixture was itself slugless, so its expectation now includes `slug: "f1"`.
- **"Empty pages":** now matches `[]` or a root with no children. Before, it could never fire for a real page. Test red first.

## Backfill (`0e02960fa`)
- `scripts/audit/reid-duplicate-elements.mjs`, run with `DATABASE_URL=… npx tsx --tsconfig packages/dashboard/tsconfig.json scripts/audit/reid-duplicate-elements.mjs [--apply]`.
- Dry-run by default, one transaction per site under `--apply`, idempotent. It refuses a non-localhost host (verified with `db.example.com`) unless `--i-know-this-is-production` is passed.
- **buildrik_verify:** dry-run found 2 sites / 3 pages / 120 elements to rename, 0 style copies, 0 form blocks, and 5 pages already collapsed. **Applied.** A re-run renames 0.
- **dev `buildrik` (dry-run only, nothing written):** 19 sites / 54 pages / 135 elements to rename, 0 style copies, 0 form blocks, and 6 pages already collapsed (sites "My New Site" `cmpebwtd9…` and "Agency" `cmrv8izkg…`).
- **CMS bindings are not persisted server-side.** `editorSaveProjectSchema.projectData` has no `cmsBindings` field, so zod strips it. There is nothing server-side to copy (see out-of-scope finding 5).

**Read-only SQL for production** (run inside `BEGIN READ ONLY;`). It matched the script on both DBs: dev 19 sites, verify 0 after apply.
```sql
WITH RECURSIVE nodes AS (
  SELECT p."siteId" AS site_id, p.id AS page_id, p.blocks AS node
  FROM pages p WHERE jsonb_typeof(p.blocks) = 'object'
  UNION ALL
  SELECT n.site_id, n.page_id, c.child
  FROM nodes n
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(n.node -> 'children') = 'array' THEN n.node -> 'children' ELSE '[]'::jsonb END
  ) AS c(child)
),
dupes AS (
  SELECT site_id, node ->> 'id' AS element_id, count(DISTINCT page_id) AS pages_sharing
  FROM nodes WHERE node ->> 'id' IS NOT NULL
  GROUP BY site_id, node ->> 'id' HAVING count(DISTINCT page_id) > 1
)
SELECT s.id, s.name, s."deletedAt" IS NOT NULL AS deleted,
       count(*) AS shared_element_ids, max(d.pages_sharing) AS max_pages_sharing_one_id,
       bool_or(d.element_id = 'root') AS shares_root
FROM dupes d JOIN sites s ON s.id = d.site_id
GROUP BY s.id, s.name, s."deletedAt" ORDER BY shared_element_ids DESC;
```

## Gate (round 1)
- tsc: editor 0 errors, dashboard 0 errors.
- vitest (`--maxWorkers=2`), touched files only:
  - editor: 68 files / 619 tests pass. This includes all 64 files that exercise `importProject`, `importPage` or `loadProject`.
  - root, server and shared: 8 files / 102 tests pass.
- No DB-tier tests were added. The backfill was exercised against the two real local DBs instead.
- I didn't re-run `verify:ds`: no chrome or dashboard UI was touched this round.

## Not verified / concerns
- No live-browser check on this worktree yet.
- **Collapsed content can't be recovered by re-id.** The verify DB's S1 (3 pages) and S2 (2 pages) already hold one identical tree, and so do 6 pages on dev. The backfill counts these but can't restore them; a restore needs version history or a re-seed. X-A1 needs a re-seed before Phase 2.
- **Form blocks on a renamed element are orphaned in the editor.** `FormBlock.id` equals the element id (`form-submission.service.ts:313`), so a form element re-id'd on load no longer finds its settings row. The backfill counts these (0 in both DBs) but doesn't rewrite a primary key. That belongs to the forms lane (Lfinal).
- **Id-keyed style copies are covered only by unit tests.** Neither DB had a colliding rule (0 copies).
- **Backfill vs editor determinism for parser-hoisted pages.** The backfill doesn't run `liftParserHoisted`. For a page the editor would also lift, in-page duplicate occurrence numbering could differ from the editor's. Either result is unique; the editor's next save persists its own.

## Out-of-scope finding (new)
5. **CMS bindings are lost on every server reload.** `Composer.exportProject` includes `cmsBindings`, but `editorSaveProjectSchema` strips the field, so it never reaches the DB. Bindings survive only in local versions and history. This matches the comment in `project.ts:55` ("every reload silently unbound every element"). It is only fixed for the local path.

---

# Fix round 2 (form blocks): commit `c0fef5584`

**Root cause.** The backfill (`reid-duplicate-elements.mjs:106`) and `duplicateSite`'s blockId remap both matched form rows on `FormBlock.pageId`. No writer ever sets that column: the publish worker's upsert (`route.ts:364`) and `updateFormBlock` (`form-submission.service.ts:305`) both leave it empty. On the local DBs, 0 of 1 (verify) and 0 of 3 (dev) rows have a `pageId`, so both checks were blind. A form row is keyed by its element id (`FormBlock.id === blockId`), which means it serves every page that carries that id.

**Fix:**
- **Shared helper:** `copiesForRenamedIds(rows, renames)` in `packages/shared/content/elementIds.ts`. It matches a row on `id` or `blockId` (a row written by an earlier duplicate has a cuid `id` but the element's `blockId`). It returns one copy per new id and is scoped per site by its callers.
- **Backfill `--apply`:** creates `FormBlock { id: <new>, blockId: <new>, same siteId/pageId/name/fields/settings }` for each renamed occurrence. Submissions stay on the original row. A copy is skipped if a row with that id already exists, so the run is idempotent. Detection selects only `id` and `blockId`, so a DB that is behind on migrations still dry-runs (the dev DB is missing `form_blocks.successAction`). The full row is read only at apply time.
- **`duplicateSite`:** writes the original rows plus one copy per renamed id, matched the same way. The old pageId-keyed move never fired. `reidSite`'s `renamedIn` was removed because nothing reads it any more.
- **Composite key compatibility:** the change stays minimal so it fits Ldata's planned composite `(siteId, blockId)` key. Copies carry `blockId = <new id>`, and the originals are untouched.
- **Collapse counter:** `identicalPages` now skips blank pages. Two empty roots look alike by nature; they haven't collapsed.

**Tests (both red first):**
- `copiesForRenamedIds`: one element renamed on two pages yields two copies; a cuid-id row is matched via its `blockId`.
- `duplicateSite` with a pageId-less row where `id === blockId`: the created rows are `["form-1", <About's new id>]`, and the copy keeps the original's settings.
- Covering tests: 55 (shared + sites + template) and 9 (editor re-id) pass. Dashboard tsc: 0 errors.

**Live exercise on buildrik_verify (scratch site, cleaned up):** two pages sharing a form element, plus its form row and an id-keyed style rule.
1. Dry-run reported `formBlockCopies=1 styleRulesCopied=1`.
2. `--apply` wrote the copy `el-9re2m91gwks5z` with the same name, fields and notifyEmail. The original `lrt-form` was kept, the rule was copied, and About's element was re-id'd to the same id.
3. A re-run found 0.
4. The scratch rows were deleted.

**Form counts (dry-run):**
- **buildrik_verify:** 0 form copies. Its one row (blockId `verify-home-form`) isn't referenced by any S1 page any more; that content went in the collapse. So the round-1 `--apply`, which ran before form support existed, orphaned nothing.
- **dev `buildrik` (read-only):** 19 sites / 54 pages / 135 elements; `formBlockCopies=0` (its 3 rows sit on a site with no collisions); 6 pages already collapsed.

**Read-only production SQL, updated.** It adds `form_rows_on_shared_ids` and `form_copies_needed`, the latter being `pages_sharing - 1` per shared id. Checked against a scratch collision (it reported 1 row and 1 copy), verify (0 sites) and dev (19 sites, 0 forms).
```sql
WITH RECURSIVE nodes AS (
  SELECT p."siteId" AS site_id, p.id AS page_id, p.blocks AS node
  FROM pages p WHERE jsonb_typeof(p.blocks) = 'object'
  UNION ALL
  SELECT n.site_id, n.page_id, c.child
  FROM nodes n
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(n.node -> 'children') = 'array' THEN n.node -> 'children' ELSE '[]'::jsonb END
  ) AS c(child)
),
dupes AS (
  SELECT site_id, node ->> 'id' AS element_id, count(DISTINCT page_id) AS pages_sharing
  FROM nodes WHERE node ->> 'id' IS NOT NULL
  GROUP BY site_id, node ->> 'id' HAVING count(DISTINCT page_id) > 1
),
forms AS (
  SELECT d.site_id, count(DISTINCT f.id) AS form_rows, sum(d.pages_sharing - 1) AS form_copies_needed
  FROM dupes d
  JOIN form_blocks f ON f."siteId" = d.site_id AND (f.id = d.element_id OR f."blockId" = d.element_id)
  GROUP BY d.site_id
)
SELECT s.id, s.name, s."deletedAt" IS NOT NULL AS deleted,
       count(*) AS shared_element_ids, max(d.pages_sharing) AS max_pages_sharing_one_id,
       bool_or(d.element_id = 'root') AS shares_root,
       coalesce(max(fm.form_rows), 0) AS form_rows_on_shared_ids,
       coalesce(max(fm.form_copies_needed), 0) AS form_copies_needed
FROM dupes d JOIN sites s ON s.id = d.site_id
LEFT JOIN forms fm ON fm.site_id = d.site_id
GROUP BY s.id, s.name, s."deletedAt" ORDER BY shared_element_ids DESC;
```

## ORDER requirement (deploy)
**Run the backfill against production (`--apply --i-know-this-is-production`) BEFORE the editor re-id (`c1ea37aad`) ships.** The editor re-ids colliding elements on load and saves the new ids. A form element re-id'd that way has no FormBlock row under its new id, so its settings read as defaults, until the backfill creates the copies. Once a site has been saved by the new editor, the backfill no longer sees those renames (the stored ids are already unique) and can't create the copies. This also belongs in the deploy notes / CHANGELOG, which the controller owns.

## Not verified
- No production run.
- No browser check that the editor reads the copied form row after load. It should: the editor and the backfill use the same `stableElementId`, and the scratch run produced the same id the editor would.
