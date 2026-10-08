# Audit 05 — Pages · CMS · Components · Forms

Repo HEAD `44f5db956` (2026-10-08). Read-only audit: code trace + unit tests. **Nothing was walked in the live app** — every finding is code-traced; items marked UNVERIFIED additionally depend on runtime timing/behaviour not confirmed. Paths relative to repo root unless prefixed `src/` (= `packages/editor/src/`).

Spot-rechecked by the lead after the module passes: Pages P1-1 (no slug dedupe in `PageManager.createPage`, `@@unique([siteId, slug])` at `prisma/schema.prisma:472`), Pages P1-4 (raw `history.undo()` at `usePages.ts:222,303,323,341`), Components P1-1 (`Element.setContent` `Element.ts:145-149` records no override), CMS P1-1 (canvas listeners lack PUBLISHED events), CMS P1-3 (`onCmsInvalid` has no subscriber), Forms P1-1 (`Object.fromEntries` at route `:50`).

## Test results

| Suite | Result |
|---|---|
| Editor vitest: `sidebar/tabs/pages`, `editor/cms`, `engine/cms`, `engine/components`, `components-catalog`, `engine/forms` (89 files) | 788 pass / **1 fail** / 2 todo in the combined run. The failure — `CmsWorkspace.recordSave.test.tsx:167` "multi-select … stores the chosen options as a list" — is a **15 s timeout under load**; the file passes 9/9 in isolation. Flaky (P2). |
| Editor vitest `engine/routing` | 27 pass / 2 todo |
| Server vitest (root config): `page-service`, `form-submission-service`, `cms.service{,validation,entry-gone}`, `page-folder.service`, `site-settings-pageSeo`, `site-component.service`, `component-usage`, routers `pages-folders`, `cms-translate`, `cms-csv-import`, `site-component-scope-library`, `forms` (14 files) | **186 / 186 pass** |
| DB tier (`pnpm test:db`: cms-conflict, cms-tombstones, cms-publish-snapshot, cms-bindings-persist, form-block-*, duplicate-site-forms …) | **NOT RUN** — Postgres not running on localhost:5432 |

## Summary

| Module | P0 | P1 | P2 |
|---|---|---|---|
| Pages | 0 | 5 | 9 |
| CMS | 0 | 3 | 12 |
| Components | 0 | 6 | 8 |
| Forms | 0 | 3 | 15 |

No P0s. Highest-impact: duplicate page slugs break every autosave (Pages P1-1); instance text edits lost on master update (Components P1-1); repeated form field names drop submitted data (Forms P1-1); CMS publish/unpublish not reflected on canvas (CMS P1-1); a refused CMS collection silently blocks publish forever (CMS P1-3); FREE plan page limit not enforced (Pages P1-2).

---

## 1. Pages

### Verified wiring
- `pages.list({siteId})` and `pages.folders.list/create/update/delete/movePage` (`src/services/PageFolderService.ts:26-33`) match `packages/shared/schemas/pages.ts:62-88` field by field; errors translated (`FOLDER_NOT_FOUND`/`PAGE_NOT_FOUND` → NOT_FOUND).
- Create (blank/template), rename (Keep/Update URL), duplicate (deep clone + CMS bindings, `PageManager.ts:296-336`), delete (single + bulk w/ confirm), set homepage, drag reorder (`PageList.tsx:108-121`), folder CRUD/collapse/move — all wired.
- Page switch: `setActivePage` emits `PROJECT_CHANGED page:activated` + `PAGE_CHANGED`; `useLayerTree.ts:113-119` re-hydrates layers; canvas re-renders. No undo entry for switch.
- Page ops go through `PROJECT_CHANGED` → snapshot history; bulk delete coalesces.
- Persistence: full snapshot `sites.saveProject` → `saveProjectData` (upsert by id, deletions, array-order position, settings/meta/slugHistory). Folders persist server-side per user+site with localStorage fallback.

### P1-1 Duplicate slugs make every save fail
- **Where:** `src/engine/elements/manager/PageManager.ts:63-71` (`createPage` sets `slug = slugify(name)` without uniqueness); DB `prisma/schema.prisma:472` `@@unique([siteId, slug])`.
- **Trace:** `NewPageModal.tsx:78` → `createPage` / `TemplatesTab.tsx:313` add-as-page / `usePages.ts commitRename` with Update URL (`slugify`, "About!" & "About" → `about`) / `shared/utils/pageUtils.ts:16-21` `getDefaultPageName` (`Page ${count+1}` re-offers a taken name after a delete) → autosave `sites.saveProject` → `saveProjectData` (`server/services/sites.service.ts:~1150`) → Prisma P2002 → whole tx fails; `server/trpc/routers/sites.ts:363-400` doesn't translate P2002 → generic 500 on every autosave tick. Engine router `registerRoute` also silently overwrites `/slug`.
- **Root cause:** only `usePageSettings.setSlug` checks `isSlugDuplicate`.
- **Expected:** slugs unique at create/rename.
- **Fix:** in `PageManager.createPage`/`updatePage` reuse `duplicatePage`'s `uniqueCopySlug`/`existingSlugs`; server: dedupe or translate P2002 → CONFLICT as backstop. (End-to-end save failure UNVERIFIED live; constraint + path confirmed.)

### P1-2 Plan page limit never enforced from the editor
- **Where:** gate only in `server/services/page.service.ts:65-68` (`pages.create`), which the editor never calls. Editor creates locally and saves via `saveProjectData` (`sites.service.ts:1043`, no count check).
- **Fix:** in `saveProjectData` reject a snapshot whose page count exceeds `pagesPerSite` (new error → FORBIDDEN); mirror in New-page modal.

### P1-3 "Copy link" always "No address yet"
- **Where:** `usePages.ts:363` reads `getProjectMetadata().domain`, filled at `src/services/BuildrikSyncProvider.ts:695` from `siteRow.domain` — `Site` has no `domain` column → always undefined.
- **Fix:** resolve host like `usePageSettings` (`siteOrigin(domains, publishedUrl, canonicalUrl)`, the documented D2 fix).

### P1-4 Pages toast "Undo" undoes the newest history entry, not the page action
- **Where:** `src/editor/sidebar/tabs/pages/usePages.ts:222, 303, 323, 341` call `composer.history?.undo?.()`.
- **Trace:** delete page → canvas edit within 8 s → click toast Undo → canvas edit reverted, page stays deleted.
- **Expected/Fix:** use `history.captureUndo()` captured right after the mutation, as every other toast does (`useHistoryFeedback.ts:195`, `useClipboardToasts.ts:95`).

### P1-5 Undo/redo on a non-first page jumps canvas to first page (UNVERIFIED runtime)
- **Trace:** `HistoryManager.restoreSnapshot` → `importScoped` → `Composer.importProject` → `elements.clear()` → `PageManager.clear()` (`activePageId=null`) → `importPage` activates first page (`PageManager.ts:399-401`). Snapshot doesn't carry active page.
- **Fix:** in `importScoped` remember `getActivePage()?.id`, restore via `setActivePage` if it still exists.

### P2
1. **Folder memberships pruned while pages still loading** — `PagesTab.tsx:100-103` and `useFolders.ts:101-113` prune with empty `livePageIds` and persist to localStorage; legacy upload (`useFolders.ts:166-179`) then uploads empty folders. Also duplicated pruning. Fix: drop PagesTab effect; skip prune while loading/empty.
2. **Folder move of unsaved page silently reverted** — `server/services/page-folder.service.ts:83-84` throws PAGE_NOT_FOUND; client `orNull`→`reload()` (`useFolders.ts:150-157`). UNVERIFIED timing.
3. **Slug swap inside one save can collide mid-transaction** (A about→info, B x→about) — UNVERIFIED. Two-phase slug write.
4. **Skeleton forever if project load fails** — `usePages.ts` `loading = !loaded && !loadError`; `loadError` only on composer read throw. Subscribe to project-unavailable state.
5. **Deleting active page doesn't emit `PAGE_CHANGED`** — `PageManager.deletePage:274-277`; Issues panel scope (`AquibraStudio.tsx:369-378`) stays on deleted page.
6. **Selection not cleared on page switch** (UNVERIFIED) — `PageManager.setActivePage:225-239`.
7. **"Page settings saved" toast before any persistence; page SEO edits revertible by ⌘Z** — `usePageSettings.ts save`; contradicts PD-12 treatment of site SEO (`HistoryManager.ts:~376`). Product decision.
8. **Dead code** — `server/trpc/routers/pages.ts` `get/create/update/delete/getTranslation/setTranslation/removeTranslation` have no callers (plan gate of P1-2 lives in dead path); `src/editor/sidebar/tabs/pages/index.ts` barrel unused; `utils/keyboardShortcuts.ts` test-only; `ElementManager.ts:62-135` page pass-throughs (CLAUDE.md middle-man rule).
9. **`slugHistory` shape mismatch** — server casts `{fromSlug,toSlug,changedAt}` (`sites.service.ts:777`), editor `SlugChange` is `{slug,changedAt}` (`src/shared/types/project.ts:215`). Harmless today; share a schema.

---

## 2. CMS

### Verified wiring
- All client calls match server procedures/inputs field by field against `packages/shared/schemas/cms.ts`: `collections.list/upsert/delete`, `entries.list/upsert/delete/importCsvPreview/importCsv`, `dynamicPages`, `publishSnapshot` (a **mutation** both sides, `src/services/cmsSync.ts:433` ↔ `server/trpc/routers/cms.ts:150` — memory note saying `.query` is stale).
- **Publish reads server, not IndexedDB:** `exportPublishPages.ts:87-90` → `cmsSyncBlocker()` → `fetchPublishSnapshot` → scratch composer `loadSnapshot` (`CollectionManager.ts:89`). Server returns PUBLISHED non-deleted rows + one level of references (`cms.service.ts:983-1020`); dynamic pages rendered server-side (`publish.service.ts:499`).
- **CONFLICT/GONE/INVALID** end to end: `CmsError` → `translateCms.ts` prefixes → `cmsSync.classify` (`:284`) → `mirror` (`:314`) removes from retry loop; race-safe `updateMany` with `deletedAt: null` (`cms.service.ts:284,400`); delete NOT_FOUND→GONE (`cmsSync.ts:358`); Keep mine / Use theirs in toast + `RecordSheet.tsx:231`; outbox replayed before hydrate (`useCmsSync.ts:53`).
- Data edits → `content:updated` (`CollectionManager.ts:386`) → `useCMSPreview.ts:126`, `CMSBindingManager.ts:114` re-resolve bound canvas elements.
- Loading/error/retry in `ContentTab.tsx:146-175`; CSV dialog states.

### P1-1 Publishing/unpublishing a record doesn't update canvas
- **Where:** `src/engine/cms/CollectionManager.ts:368-387` emits only `CMS_CONTENT_PUBLISHED/UNPUBLISHED`; listeners `useCMSPreview.ts:126-129`, `CMSBindingManager.ts:113-115` don't subscribe to them. Bindings resolve published records only (`CMSBindingManager.ts:214-227`), and when nothing resolves they keep stale text.
- **Expected:** canvas reflects status change like export does.
- **Fix:** add the two events to both listener lists (don't add an extra UPDATED emit — `useCmsSync` would double-send).
- Related P2: canvas keeps stored text when unresolved (`useCMSPreview.ts:79`, `CMSBindingManager.ts:281`) while export writes empty (`CMSExportResolver.ts:127-135`) — canvas ≠ live site.

### P1-2 Field-key rename races the collection mirror (UNVERIFIED timing)
- **Where:** `CollectionManager.ts:236-260` `updateField` migrates records (emitting CONTENT_UPDATED each) **before** `updateCollection`; `syncEntryUpsert`'s `queue.settled("collectionUpsert:…")` resolves immediately (`syncRetryQueue.ts:101`).
- **Effect:** server `sanitizeEntryData` (`cms.service.ts:67`) doesn't know the new key is richtext → strips markup → stripped copy written back locally (`cmsSync.ts:840-846`); for PUBLISHED records with a required old field → INVALID → `takeServerCopy` (`cmsSync.ts:868`) restores old-key data.
- **Fix:** `await this.updateCollection(...)` before the record-migration loop.

### P1-3 Server-refused collection (INVALID) dropped silently, then blocks publish forever
- **Where:** `onCmsInvalid` (`src/services/cmsSync.ts:265`) has no subscriber in `src/`.
- **Trace:** collection upsert → `CMS_INVALID` (e.g. 101st collection, `cms.service.ts:216`) → removed from outbox, no UI → collection local-only → every record write NOT_FOUND (`cms.service.ts:351`), unclassified → retried forever → permanent "didn't sync" toast + `cmsSyncBlocker` blocks every publish of a site with bindings (`exportPublishPages.ts:87`).
- **Fix:** subscribe `onCmsInvalid` in `useCmsSync` with a toast; treat record NOT_FOUND as terminal when parent collection was refused/unstamped.

### P2
1. `_skipTouchCmsEdited` exposed in public tRPC input (`packages/shared/schemas/cms.ts:391`) — any EDITOR can skip the unpublished-changes bump; make it internal (`cms.service.ts:572`).
2. Concurrent first write of a new record → raw Prisma unique 500 (`cms.service.ts:417`); collections handle it (`:230`).
3. Status "archived" sent as DRAFT (`cmsSync.ts:829`), hydrates as draft (`:620`).
4. `useDynamicPagesSummary.ts` counts collections with `pageSlugPattern` only; publish also needs `pageTemplatePath` + template page (`cms.service.ts:1031`); lags one change.
5. "Dynamic pages saved" toast (`DynamicPagesPane.tsx:91`) before server accepts; refusals unseen.
6. `DynamicPagesPane.tsx:43-54` page list `useMemo([composer])` — stale while open.
7. `keepMine` resends the conflict-time copy (`cmsSync.ts:858-862`) — stale toast can overwrite newer edits; re-read from storage.
8. Snapshot fetches one reference level (`cms.service.ts:997-1008`) — nested refs publish empty (scope UNVERIFIED).
9. Dynamic page paths never checked against static page paths (collision behaviour UNVERIFIED).
10. Dead code: `src/engine/cms/DataBindResolver.ts` (test + barrel only); `cms.generateDynamicPages` procedure (`routers/cms.ts:94`) no client caller; `onCmsInvalid` (see P1-3).
11. `refreshFromStorage` runs twice per open (`cmsSync.ts:681` + `useCmsSync.ts:55`).
12. `CMSBindingManager` ignores `CMS_STORE_REFRESHED` — remote edits update preview but not stored element text (export re-resolves; low impact).
13. Test flake: `CmsWorkspace.recordSave.test.tsx:167` times out at 15 s under parallel load.

---

## 3. Components

### Verified wiring
- 6 editor calls in `src/services/componentSync.ts` (`:62,88,126,136,188,201` — `siteComponents.upsert/delete/list/get/library/libraryGet`) match `server/trpc/routers/site-component.ts` + `packages/shared/schemas/site-component.ts`; router mounted as `siteComponents` (`server/trpc/router.ts:69`).
- Dashboard `workspaceList/Rename/Delete` used by `library-panel.tsx` with loading/error-retry/empty.
- Create/update/delete/variant/thumbnail → `COMPONENT_*` events → `useComponentSync.ts:69-72` mirror with retry queue + Retry toast; server-first hydrate (`:41-58`); per-site cache (`useComposerInit.ts:213`); sanitize both sides.
- Master edit propagates to instances on all loaded pages: `syncAllInstances` (`ComponentInstances.ts:419`) over registry built by `rehydrateInstances` (`ComponentManager.ts:175`).
- Style/attribute overrides recorded (`ElementStyles.ts:41,134`), re-applied (`ComponentInstances.ts:334`), dropped-override toast (`ComponentDetailScreen.tsx:206`). Detach (`ComponentRow.tsx:90`), reset, toast Undo wired.

### P1-1 Instance text edits lost on every master update/reset
- **Where:** `src/engine/elements/Element.ts:145-149` `setContent` never calls `recordInstanceOverride`; `removeStyle/removeAttribute` (`ElementStyles.ts:52,157`) don't either; `"trait"` override never recorded.
- **Trace:** edit instance text → master update → `syncInstance` rebuilds from master + recorded overrides (`ComponentInstances.ts:325-334`) → text silently reverts, not counted as lost.
- **Fix:** record a `"content"` override in `setContent` (path shape matching `applyOverridesToTree`); record removals.

### P1-2 Library masters overwrite each other in IndexedDB
- **Where:** `src/engine/components/ComponentStorage.ts:51` `keyPath: "id"`; library masters keep the same id across sites (`ComponentManager.ts:290-301`); `saveComponent(c, siteB)` (`:91-98`) moves site A's record; `deleteComponent(id)` (`:164`) can delete another site's copy.
- **Fix:** key on `[projectId, id]` (bump `DB_VERSION`, migrate); pass `projectId` to delete.

### P1-3 Dashboard rename of library master reverted by editor
- **Where:** `server/services/site-component.service.ts:139-142` updates `name` column only, not `payload.name`; hydrate stores `payload` (`componentSync.ts:156-158`); next upsert writes old name back (`:65`).
- **Fix:** update `payload.name` in same write, or overlay `r.name` on hydrate.

### P1-4 Dashboard "delete everywhere" resurrects
- **Where:** hydrate never deletes local copies (`componentSync.ts:118`); next local edit/thumbnail upserts again (`useComponentSync.ts:61-71`).
- **Fix:** hydrate removes server-stamped locals absent from `list`, or server tombstones.

### P1-5 Undo of delete never re-mirrors
- **Where:** `ComponentManager.ts:516-533` `restoreDeletedComponent` emits only `COMPONENT_LIST_UPDATED`; server row stays deleted, no failure toast.
- **Fix:** emit `COMPONENT_CREATED` with the restored component.

### P1-6 Library reads skip site-scope access control
- **Where:** `site-component.service.ts:192-235` (`listComponentLibrary`, `getLibraryComponent`; router `:82-94`) filter by workspace only; `listWorkspaceComponents` applies `siteScopeWhere` (`:80-82`). Site-restricted member can read masters from un-granted sites.
- **Fix:** add `...await siteScopeWhere(prisma, userId, workspaceId)`.

**UNVERIFIED intent:** "linked from library" is a one-time copy — master edits on site A only upsert A's row (`site-component.service.ts:26`); dashboard copy claims "the change lands on every site" (true only for rename/delete).

### P2
1. Hydrate with newer master only reloads list (`useComponentSync.ts:43-46`); canvas instances stay stale; `syncedVersion` unread (UNVERIFIED live).
2. ⌘Z after master update = N steps (per instance, `ComponentInstances.ts:318`), master def not in history; `revertComponentMaster` doesn't restore dropped overrides.
3. `duplicateComponent` (`ComponentManager.ts:476-489`) drops `variants`, `prefillFromDs`, `pageId`.
4. Upsert last-write-wins (`site-component.service.ts:26-41`); add `updatedAt` precondition.
5. `fetchComponentLibrary` returns `[]` on error (`componentSync.ts:190-194`) — no error/retry; refetches on every list update (`useComponentList.ts:60`).
6. `isLoaded` true before async cache load (`useComponentList.ts:49` vs `ComponentManager.ts:142`) → empty-state flash; `ComponentsTab.tsx:128` Retry only clears error (UNVERIFIED).
7. `placeCatalogComponent.ts:81-85` variant styles outside insert transaction → separate undo step (UNVERIFIED).
8. Dead/duplicate: variant authoring API (`ComponentManager.ts:425-468`) no UI caller; `getComponentsByCategory` (`:308`); `useCatalog.ts` test-only; `loadComponent`/`getStorageStats` exports (`engine/components/index.ts:18,21`); `updateComponent` pass-through (`:334-339`); duplicate implemented twice (`ComponentDetailScreen.tsx:153-160` vs `useComponentsState.ts:143-153`). No payload size cap (`z.record(z.unknown())`, thumbnails as data URLs).

---

## 4. Forms

### Verified wiring
- Publish: `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:343-350` → `planFormWiring` (`lib/publish-forms.ts:198`) sets `action=${NEXT_PUBLIC_APP_URL}/api/public/forms/<siteId>/<data-buildrick-id>` + `_return` + optional `_honeypot` (`:120-159`); refuses if `NEXT_PUBLIC_APP_URL` unset (`:203-211`); `recordPublishedForms` upserts `FormBlock` (`form-submission.service.ts:343`).
- Public endpoint `app/api/public/forms/[siteId]/[formBlockId]/route.ts`: DB rate limit 10/min/site+form+IP (`:21`), 256 KB cap, Zod, honeypot (`service:85`), monthly plan limit (`:116-123`), open-redirect checks.
- `forms.getBlock/updateBlock` match `FormAfterSubmitSection.tsx:99,148`; `notifyEmail` emailed; REDIRECT honoured; ADMIN required to change `notifyEmail` (`routers/forms.ts:81-87`).
- `FormsScreen.tsx` list/update/delete/export calls match `packages/shared/schemas/forms.ts`; update/delete guarded by `guardSiteRole`; CSV injection guarded.

### P1-1 Repeated field names silently drop submitted values
- **Where:** `route.ts:50` `Object.fromEntries(new URLSearchParams(raw).entries())` keeps last value per key. Defaults: every Checkbox `name="checkbox"` (`blocks/Forms/Checkbox.tsx:19`), Radio `name="radio-group"` with no `value` (`Radio.tsx:19` → submits `"on"`), Input `name="text"` (`Input.tsx:17`); `FormFieldsSection.tsx:135` `field-${fields.length+1}` collides after a delete.
- **Fix:** group repeated keys (`getAll`) in route; unique `name` per block/`addField`; give radios a `value`.

### P1-2 File input block can't work
- `blocks/Forms/FileInput.tsx:18`; wired forms post urlencoded (filename only); multipart would hit JSON.parse → 400 (`route.ts:58-61`). Fix: hide block or flag at publish until uploads supported.

### P1-3 Visitors see raw JSON errors
- `route.ts:28,38,66,134-137` return `NextResponse.json` on 429/400/404/413/402/500 in the browser path. Over-limit FREE site shows `{"error":"Monthly submission limit reached"}`; owner never notified; 500 unlogged.
- **Fix:** when `isForm`, redirect back with `?submitted=0&reason=…`; log 500; notify owner on `FORM_SUBMISSION_LIMIT`.

### P2
1. Inspector says "Saved to your site straight away" (`FormAfterSubmitSection.tsx:216`) but `successMessage`/`spamProtection` are baked at publish (`publish-forms.ts:134-141`) — need republish.
2. Clearing redirect URL early-returns (`:138`) while local state shows empty; raw Zod JSON shown as error; no client max for `successMessage` (500).
3. Inspector "Label" edits `placeholder` (`FormFieldsSection.tsx:116-119`), not label/name; submissions keyed `field-3`; ContactForm labels lack `for` (`ContactForm.tsx:14-16`).
4. `FormBlock.pageId` never written; `FormsScreen.tsx:219` passes `pageId: null` → cross-page locate may fail (UNVERIFIED).
5. `recordPublishedForms` runs before deploy (`route.ts:350`) — failed deploy deactivates forms the old deploy still serves → 404.
6. Dead columns: `FormBlock.webhookUrl` (never written/read; `handover.service.ts:45` counts it), `submitButtonText`, `FormSubmission.sourceUrl` never set.
7. Plan looked up via arbitrary `workspaceMember` row, FREE fallback (`form-submission.service.ts:108-114`); month window in server local time.
8. CORS: JSON/scripted submit preflight answered with `ACAO: EDITOR_ORIGIN` only (`middleware.ts:57-67`), POST lacks ACAO — contradicts `route.ts:43` comment.
9. User CSP `default-src 'self'` (`lib/publish-files.ts:157`) blocks inline `FORM_PAGE_SCRIPT` (UNVERIFIED live).
10. `\baction="` regex matches `data-action="` (`lib/publish-forms.ts:31,129`) → form left unwired; `\bname="` matches `data-name`.
11. Dashboard `submissions-panel.tsx:205-229` no `isError` branch → false empty state.
12. Layer violations: `routers/forms.ts:39-42,51-54` query Prisma directly; cron `app/api/cron/form-submission-purge/route.ts:14` calls Prisma directly.
13. Dead engine stack: `composer.forms` (`Composer.ts:164,288`) no runtime caller; `src/engine/forms/FormHandler.ts` (431 lines) + `src/services/FormSubmissionService.ts` (in-memory Map, client-side webhooks); `shared/forms/FormStateOverlay.tsx` unused; `Composer.applyProjectSettings:877-903` email services; `ExportEngine.collectFormElements` (`:1037`), `formConfig` injection (`:1157`), `FormspreeInjector.ts` key on never-written `formConfig`. Engine forms tests cover only dead code.
14. Rate-limit key includes attacker-chosen `formBlockId` before 404 → unbounded rows.
15. PasswordInput block on public forms → plaintext passwords stored + emailed.

---

## Not verified
- No live-app walk (CLAUDE.md: live app is the verifier). All P1s are code-traced; P1-5 (Pages), P1-2 (CMS) timing-dependent.
- DB-backed test tier not run (Postgres down).
- Dashboard UI tests not run.
