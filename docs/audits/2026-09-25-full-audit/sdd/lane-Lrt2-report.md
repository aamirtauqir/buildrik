# Lane Lrt2 report — live-verify bugs X-1, X-6, X-8, X-4

Worktree `/Users/shahg/Desktop/buildrik-af-Lrt2`, branch `fix/audit-Lrt2`, base `bda180a95`.
Commits: `7d9861d79` (X-1), `43d804596` (X-6), `464c93829` (X-8), `175cae936` (X-4).

## X-1 — renamed version shows its stale name after reload — fixed `7d9861d79`
**Root cause.** `siteVersions.rename` updates only the `site_versions.name` column. The stored `payload` JSON keeps the name the version was created with. `hydrateVersionsFromServer` (`packages/editor/src/services/versionSync.ts`) (a) spread `payload` for newly hydrated versions, so a fresh browser got `X1-orig-name` from the payload, and (b) never touched versions already in IndexedDB, so a rename made in another browser never arrived. The verifier's "new browser session" was case (a).
**Fix.** The list row's `name` wins, both for new versions and for cached ones. Exception: while this browser still has its own rename queued (`queue.isPending("versionRename:<id>")`, the same C-4 pending guard CMS uses). A renamed cached version counts toward the return value, so `useVersionSync` re-reads the store (`setProjectId`) without a second reload.
**Tests.** `src/services/__tests__/versionSync.test.ts` gets 3 new tests: a fresh hydrate takes the server name; a cached version is renamed and counted; a queued local rename is not overwritten. 25/25 pass.

## X-6 — "+N from collections ›" row never renders — fixed `43d804596`
**Root cause.** `useDynamicPagesSummary` subscribed to `CMS_STORE_REFRESHED` / `CMS_COLLECTION_*` on the **composer**. `CollectionManager` emits those events on **itself** (`this.emit` in `engine/cms/CollectionManager.ts:100,127,149,162`). Every other consumer, such as useContentPanel and CollectionListSection, listens on `composer.cms.collections`. The Pages tab is open at load, so the hook computed once against an empty store (before `useCmsSync` → `hydrateCmsFromServer().then(refreshFromStorage)`) and never heard the refresh. Result: count 0 forever. The old test fake re-emitted CMS events on the composer, which encoded the bug.
**Fix.** The hook now listens on `composer.cms.collections`. It also listens for entry publish, unpublish and delete, because the count is published entries only.
**Tests.** `useDynamicPagesSummary.test.ts` now uses a real `CollectionManager` (storage mocked) under a composer whose own emitter never carries CMS events. New tests: a store loaded after mount (the live shape, `{count:1, collectionId:"posts"}`), publish/unpublish recompute, unsubscribe on unmount. Pages dir: 194/194 pass.

## X-8 — VIEWER has no door to History/Review/Activity — fixed `464c93829`
**Evidence (live, base app, VIEWER on S1, headless Playwright).** The rail shows `add, layers, pages, assets, content, design` only. The site menu collapses to "View only" (`SiteMenu.tsx:146-154`). Pressing **H** did route: the sidebar's `aria-labelledby` became `rail-tab-history`. But the drawer was **empty** and the right column still showed the role notice. So FC-9's read-only gating was both unreachable and invisible. Why it was invisible: `rightColumnTab = !readOnlyView && …` withheld the column from every read-only view, `LeftSidebar` renders nothing for a column-hosted tab (`hostedInColumn`), and a viewer's inspector column rendered only `<ViewerRoleNotice>`.
**Fix.**
- `editor/rail/tabsConfig.ts`: `RIGHT_COLUMN_TABS` moves next to `VIEWER_TABS`, with one predicate, `isColumnTabOpen`. It now serves a VIEWER. An owner's own `?view=readonly` preview still gets no panel, and Review still requires `reviewsEnabled` (FB-4).
- `StudioPanels.tsx`: a single `columnPanel` element is hosted by both the normal inspector column and the viewer's column (it replaces the role notice while a column tab is open).
- `LeftSidebar.tsx`: a viewer's rail adds the `VIEWER_TABS` entries missing from the six-item Figma rail, below a divider: History, Review (only if `reviewsEnabled`), Activity. The entries are derived from `VIEWER_TABS`, so there is no second list. Icons added: Activity, MessageSquare.
**Tests.** New `sidebar/__tests__/LeftSidebarViewerDoors.test.tsx` (viewer rail shows history/review/activity and a click opens the tab; review hidden when disabled; non-viewer rail unchanged). `rail/__tests__/tabsConfig.test.ts` adds 4 `isColumnTabOpen` tests. `shell/__tests__/StudioPanels.openRequests.test.ts`: the exact-import-line assertion is loosened to a regex (the import list grew), and a source assertion is added that the viewer column renders `columnPanel`.

## X-4 — added slider never persisted — root cause was not the slider; fixed `175cae936`
**Investigation (live, base app, OWNER, S1).** Added "Slider/Carousel" via topbar search, then waited 15 s. One `sites.saveProject` returned 200. `pages.blocks` then contained the full `type:"slider"` / `buildrick-slider` / 2× `buildrick-slide` tree, and it matched the request payload field for field. **So neither serialization nor the S-1 sanitizer drops the slider.** No allowlist change is needed.
**What the run really hit.** Before the add, Home/About/Contact were byte-identical (683 B, `updatedAt` within 4 ms of each other). After the add, all three were the same 1546 B tree, and the **client payload itself** carried the same root for all three pages. Cause: every seeded page, every AI-generated page (`sectionsToBlocks` in `app/api/workers/ai-generate/[jobId]/route.ts:43`) and every page with empty blocks (`DEFAULT_ROOT`, `BuildrikSyncProvider.ts:179`) has root id `"root"`. The element registry is one map across all pages, so the roots collided. Every page tab showed one tree (the verifier noticed "tabs visually indistinguishable"), and `PageManager.exportPages` (`elements.get(page.root.id)`) wrote the active page's tree into every page on each autosave. The verifier logged this as "cross-agent DB contamination". It is at least partly this real data-loss bug.
**Fix.** `PageManager.importPage` → `withUniqueIds`: any id that is already registered, or repeated within the page, gets a fresh id on a copy. Projects with unique ids are returned untouched.
**Tests.** New `engine/__tests__/Composer.importSharedRootId.test.ts`: each page exports its own tree; an element added to one page is saved only there; already-clobbered pages (same child ids) come apart; unique ids are left untouched. The first three were red on base with exactly the live symptom (`[['Contact'],['Contact'],['Contact']]`).

## Gates
- vitest (`--maxWorkers=2`, touched files only): versionSync 25/25; pages dir 194/194; rail + sidebar + StudioPanels source tests 95/95; engine PageManager/Composer/import 103/103; HistoryManager + undo-redo integration 6/6.
- `npx tsc --noEmit -p packages/editor`: 0 errors. `-p packages/dashboard`: 0 errors.
- `verify:ds` (editor): fails at `check-token-resolution` on `--bk-danger` in `FormAfterSubmitSection.tsx:240`. That failure is **pre-existing on base, is in Lfinal's file, and is not touched here**. Every gate after it, run by hand (anchors, boards, hex-drift, copy, tsc-baseline, tokens-generated, vibcoder, editor-ui-gone, chrome-ui-surface, styling, buildrick, design-debt, narrow-control-padding), passes.

## NOT verified (controller Phase 2)
- None of the four fixes has been seen in a running app built from THIS branch. The live runs above were against the base app at :3100, to reproduce the bugs.
- X-1: reload after rename in a fresh browser and in the same browser. Also rename in browser A, then open browser B that already has the version cached.
- X-6: set a collection's `pageSlugPattern` with 1 published entry, reload, and check that the row reads "+1 from collections ›".
- X-8: as VIEWER, the rail shows History/Review/Activity below a divider, and each opens in the right column read-only (x5's disabled write controls plus tooltip). Also check the viewer's column is sized sensibly. The rail's active bar does not light for column tabs (drawer closed), which is the existing behaviour for column tabs.
- X-4: open a site whose pages share root "root", switch tabs, and check each shows its own content; edit one and check the others stay unchanged in `pages.blocks`. **The S1 pages in the verify DB are already clobbered into one tree**: the fix separates them going forward but cannot restore the lost per-page content, so a reseed is needed.

## Cross-lane edits / notes
- None of Lfinal's or Lrt's files were edited. `StudioPanels.tsx` / `LeftSidebar.tsx` / `tabsConfig.ts` / `PageManager.ts` are shared shell/engine files. Lrt's "canvas-vs-tab current page on load" is probably a symptom of the X-4 root-id collision, so Lrt should rebase onto `175cae936` and re-check.
- **Harness write:** reproducing X-4 made one autosave on verify-DB S1. All 3 pages were already identical; they now hold the input-range + slider tree (1546 B).
- Out of scope, not fixed: the AI worker and `DEFAULT_ROOT` still emit root id `"root"`. The engine fix makes that harmless on load, but new sites would be cleaner generating unique ids at the source.
- For the controller: `SiteMenu` for a VIEWER still offers nothing but "View only". The rail is now the door.

## X-4 REVERTED — `60c03576a` reverts `175cae936` (controller ruling)
Lane Lrt owns the duplicate-element-id fix, so the X-4 commit is reverted on this branch. X-1, X-6 and X-8 are kept. After the revert: X-1/X-6/X-8 tests 311/311 pass (36 files, `--maxWorkers=2`), and `tsc -p packages/editor` shows 0 errors.

The X-4 root-cause analysis above still stands. For Lrt, this is what the reverted commit did and tested:
- **Approach:** `PageManager.importPage` → private `withUniqueIds(root)`. It first scans the page tree. If any node id is already in `ctx.elements` (another page's) or repeats within the page, it `structuredClone`s the root and gives each clashing node a fresh id (`generateId("root")` for the root, `generateId("el")` for children). A project with unique ids is returned as-is, with no clone. It deliberately did NOT rewrite id-keyed styles, CMS bindings or refs, and did not fix the server sources. Lrt's complete version covers those.
- **Test cases** (`engine/__tests__/Composer.importSharedRootId.test.ts`, via `new Composer({} as never)` + `importProject`/`exportProject`, with canvas getContext and indexedDB stubbed as in `Composer.importSanitize.test.ts`):
  1. Three pages, each with root id `"root"` and a distinct heading → each page exports its own heading. On base this fails as `[['Contact'],['Contact'],['Contact']]`, the exact live symptom.
  2. Two `"root"` pages; add a `slider` to the active page's root → only that page has 2 children, and the other still has its own 1 child.
  3. Two pages already clobbered to the same tree (same root AND child ids) → the exported root ids differ and the child ids differ.
  4. Pages with unique ids (`root`, `root-about`) → ids are unchanged.
- **Live evidence for the backfill:** in the verify DB, S1's Home/About/Contact are identical (1546 B), so their per-page content is already lost.

## Fix round 1 — X-1 CRITICAL (offline rename lost after reload) — fixed `b8f42dc06`
**Cause (review).** The guard `queue.isPending("versionRename:<id>")` read SyncRetryQueue's in-memory map, which is empty after a reload. So an offline rename (already in IndexedDB) was overwritten by the older server name on the next hydrate. The two new tests below failed against `7d9861d79` with exactly that.
**Fix.** No new mechanism: this reuses L3's persisted stamps (`recordServerStamp` / `serverCopyWins`, localStorage `bk-sync-stamps-v1`). Key `version:<id>`; the stamp's "local" value is the version's **name**.
- Hydrate, same name on both sides → stamp. Freshly hydrated version → stamp.
- A rename mirror that succeeds (including a replay) → stamp with the clock the server returns.
- Names differ → the server name wins only when the copy is stamped AND has not been renamed here since. Otherwise (unstamped, or renamed locally) the local name is kept and `mirrorVersionRename` runs again.
- The in-memory `isPending` read is removed from versionSync. The doc comment is rewritten.
**Server clock (new; needs deploy step).** `SiteVersion` had no `updatedAt`. I added `updatedAt DateTime @default(now()) @updatedAt`:
- migration `20261002100000_site_version_updated_at` (additive; existing rows get "now"). `prisma migrate diff` against a shadow DB reports "No difference detected".
- CHANGELOG deploy line added.
- `listSiteVersions` selects it; `renameSiteVersion` returns `{ ok, updatedAt }` (a findUnique after the updateMany; `null` when the version is gone).
**Tests.** `versionSync.test.ts` gets 5 new tests that simulate a reload: `vi.resetModules()` plus a re-import gives a new queue instance, while IndexedDB mocks and localStorage are kept.
- offline rename → reload → hydrate: the local name is kept and re-mirrored;
- teammate rename on an untouched version wins;
- own rename confirmed, then teammate rename → the teammate's wins;
- unstamped version with a different name → kept and mirrored;
- freshly hydrated version is stamped, so a later teammate rename reaches it.

The previous "cached version renamed" and "queued rename" tests are replaced by these. Results: versionSync 28/28; `server/.../site-version.service.test.ts` 11/11 (rename returns updatedAt, list selects it); syncRetryToasts + StudioHeader.savePill pass; tsc editor 0 errors, dashboard 0 errors.
**Behaviour note.** The first open after deploy is a one-time pass: cached versions whose name equals the server's get adopted (stamped). A cached version whose name differs and has no stamp is treated as a local rename and pushed. So a teammate rename made BEFORE this deploy, on a version this browser had already cached, would be reverted by that browser once. This follows the controller's contract ("unstamped … keeps its local name and re-queues").
**Not verified live.** The reload and teammate scenarios have not been run in a browser, and neither has the migration against the verify DB.

## Fix round 2 — first-pass adoption (controller ruling) — fixed `07eb979cf`
- **Rule.** On the first hydrate of a site with no version stamps yet (`stampMigrationDue("version:<siteId>")`, the same `bk-sync-stamp-migrations-v1` marker CMS/components use), a cached version with no stamp and a name that differs from the server's **adopts** the server name. It is stamped and not re-sent. The marker is set only when no rename mirror failed during the pass. After that pass, the round-1 stamp rules apply. `mirrorVersionRename` now returns `boolean` (whether it reached the server).
- **Tests** (`versionSync.test.ts`, 30/30):
  - first pass: an unstamped name that differs adopts the server name, is stamped and not re-sent, and the marker is done; on the next load (simulated reload) a later offline local rename is kept and re-mirrored;
  - the first pass stays due when a mirror in it failed;
  - the round-1 "unstamped, name differs → keep and mirror" test now runs after the first pass.
- **Covering tests.** versionSync + syncRetryToasts + StudioHeader.savePill: 40/40. tsc editor: 0 errors.
- **Verify DB.** `20261002100000_site_version_updated_at` applied to `buildrik_verify` only (`prisma migrate deploy`, "All migrations have been successfully applied"; the column `site_versions.updatedAt` is present).
- **Not verified live.** The first-pass and reload scenarios have not been run in a browser.
