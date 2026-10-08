# 07 — Publish / version history / collab / editor↔server integration audit

Date: 2026-10-08 · Mode: READ-ONLY (no edits, no stash) · Repo HEAD 44f5db956
Scope: editor publish flow, engine export → server publish → worker, scheduled publish,
approval gate, site versions, collab (state only), editor tRPC/HTTP client layer,
dashboard `/edit/[siteId]` mount + load/save path.

## Verification run

| Check | Result |
|---|---|
| `npx tsc --noEmit -p packages/editor/tsconfig.json` (covers `src/`, every typed `createTRPCClient<AppRouter>` call site) | **PASS** (exit 0). First attempt hit a 600 s `timeout`; re-run without a cap passed. |
| Editor vitest: services (api-client, versionSync, PublishService, cmsSync, BuildrikSyncProvider), VersionTimelineManager, useVersionHistory, engine/collaboration, editor/panels, exportPublishPages, PublishHistory/DiffView/SiteMenu.unpublish, shell/modals, usePublishJob, useExportHandlers(+publishErrors), sidebar/tabs/publish | 73 files / 695 tests: 693 pass, 2 timed out under load (`VersionHistoryPanel.branches` "Escape closes the form", `RichTextEditor` "align commands"). **Both PASS on isolated re-run** (38/38) → load flake, not a defect. |
| Root vitest: server publish*/scheduled-publish/site-version service tests, sites-publish-acknowledge-stale / published-snapshot / s10-authz router tests, `lib/__tests__/publish-worker-completion`, `__tests__/collab-routes`, `collab-service`, `cron-scheduled-publish`, `publish-service`, `publish-project-name-clash`, dashboard `app/edit` + `components/editor-route` | **31 files / 215 tests PASS** |
| Live app | **NOT verified.** Everything below is code-traced; runtime confirmation is marked UNVERIFIED. |

---

## Findings

### P1-1 — Publish job deploys with the caller's SESSION workspace, not the site's workspace
- **Where:** `server/trpc/routers/sites.ts:456` (`const workspaceId = await getWorkspaceId(ctx)`) → `server/services/publish.service.ts:503-507` (`publishBuildJob.create({ data: { siteId, workspaceId, … } })`) → `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:135` (`runVercelDeployJob(jobId, job.siteId, job.workspaceId, pages)`) → `:319` (plan/badge lookup), `:326` (workspace app scripts), `:395` (`runVercelDeploy(workspaceId, …)` → `getActiveVercelConnection(workspaceId)`), `:146` (`deliverWebhook(job.workspaceId, …)`).
- **Trace:** `resolveWorkspaceId` (`server/trpc/workspace-ctx.ts:59-89`) returns the session's selected workspace (or any ACTIVE membership). Site authorization uses `checkSiteRole` on the SITE's workspace. A member of workspaces A and B whose session is on A opens `/edit/<site in B>` (allowed by `getEditorAccess`) and publishes. `startPublish` pre-checks Vercel on `site.workspaceId` (B, `:483`) — passes — but stores `workspaceId = A` on the job. The worker then deploys into **A's Vercel account**, applies **A's plan** for the free-plan badge, injects **A's** marketplace scripts and fires **A's** webhooks. If A has no Vercel connection the job fails `VERCEL_NOT_CONNECTED` after the pre-check said OK.
- **Also affected:** `rollbackPublish` (`publish.service.ts:794-812`) filters `site: { workspaceId }` with the session value → cross-workspace ADMIN gets `NOT_FOUND` on rollback.
- **Root cause:** the S-? fix that moved the approval gate to `site.workspaceId` (`publish.service.ts:396-413`, whose comment claims "the deploy … already uses `site.workspaceId`") was not applied to the job row the worker reads.
- **Expected:** every workspace-scoped decision for a site's publish keys on `site.workspaceId`.
- **Fix:** in `startPublish`, write `workspaceId: site.workspaceId` on the job (the `site` row is already loaded at `:366-377`) and drop/ignore the `workspaceId` param there; in `rollbackPublish` filter by `siteId` only (role already checked by the router). Add a test with session workspace ≠ site workspace.
- **Status:** code-confirmed; runtime UNVERIFIED.

### P1-2 — Publish is not gated on the project having loaded; a failed load can publish fallback content over the live site
- **Where:** `packages/editor/src/services/PublishService.ts:72-76` checks only `siteColumnsLoaded(siteId)`; `BuildrikSyncProvider.ts:117-119` returns `!_siteColumnsMissing.has(siteId)`, and `_siteColumnsMissing` is only written on the *successful* load path (`:719-720`). `settledBaselineLastEditedAt()` (`:192-195`) returns `null` when no load ever set the baseline. Server `startPublish` skips the C-3 freshness check when `expectedLastEditedAt` is falsy (`publish.service.ts:387-392`).
- **Trace:** `useComposerInit.ts:241` `loadProject` rejects (network/500/timeout) → `.catch` at `:363-416` shows the load-error banner and calls `loadFromLocalStorage(...)` (stale cache or default project on screen). Saves are protected (`saveProjectNow` → `_loadedSites` → `ProjectNotLoadedError`, `BuildrikSyncProvider.ts:794-796`), but Publish is not: `lifecycle.ts:233-239 publishBlocker` has no load-failure input, `siteColumnsLoaded` returns `true`, the payload is the fallback canvas, `expectedLastEditedAt` is `null`, and the server accepts it. Live site replaced with fallback/stale local content (recoverable only via rollback). `hasProjectLoaded()` exists (`:988`) but only `usePages.ts:105` consumes it.
- **Expected:** publish refused unless this tab's project loaded from the server (same invariant the save boundary enforces).
- **Fix:** in `publishSite`, `if (!hasProjectLoaded(siteId)) throw new Error("This site didn't load. Reload the editor before publishing.")` (replaces/extends the `siteColumnsLoaded` check); optionally feed `loadError` into `LifecycleInput` so the button disables. Server-side defence: require `expectedLastEditedAt` whenever `pages` is present (schema `.refine`).
- **Status:** code-confirmed; runtime UNVERIFIED.

### P1-3 — Client-supplied page `path` is unvalidated: an EDITOR can ship arbitrary deploy files (`vercel.json`, `api/*`) into the workspace owner's Vercel account
- **Where:** `packages/shared/schemas/publish.ts:21-23` — `path: z.string().min(1).max(500)`, no shape/extension check. `lib/publish-files.ts:178-212` maps each page to `{ file: p.path }` and later appends server `robots.txt`, `sitemap.xml`, `vercel.json` (only when `buildVercelConfig` returns non-null).
- **Trace:** `sites.publish` requires only EDITOR. A crafted tRPC call (or a tampered editor) can include pages with `path: "vercel.json"` (overrides/collides with ADMIN-owned CSP/HSTS/redirect config — and stands alone when the server emits none) or `path: "api/x.js"` (Vercel treats `api/` as Serverless Functions in a framework-less deployment — UNVERIFIED for this deployment's `projectSettings`). Badge injection and SEO injection run on these as if HTML.
- **Expected:** only `.html` page paths under a safe charset reach the deployment; reserved names are refused.
- **Fix:** tighten `publishPageSchema.path` to e.g. `/^(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*\.html$/i` plus refuse `..`, leading `/`, and the `api/` prefix; also de-dupe/deny server-reserved filenames in `buildDeployFiles`.
- **Status:** schema gap confirmed; Vercel function-execution impact UNVERIFIED.

### P1-4 — Cancelling a re-publish of an already-live site marks it DRAFT
- **Where:** `server/services/publish.service.ts:582-605` `cancelPublish` sets `site.status: "DRAFT"` unconditionally.
- **Trace:** site live (`publishedUrl` set) → user republishes → cancels while QUEUED/BUILDING → site row becomes `DRAFT` with `publishedUrl` still set. Editor `fetchSitePublishState` (`PublishService.ts:187-205`) computes `isPublished = status === "PUBLISHED" && !!publishedUrl` → false; Topbar/dashboard show the site as not live while the previous deployment keeps serving. Compare the dispatch-failure path (`:543-555`) and worker failure path, which both restore `publishedUrl ? "PUBLISHED" : "DRAFT"`.
- **Fix:** read `publishedUrl` in the transaction and set `status: site.publishedUrl ? "PUBLISHED" : "DRAFT"` (same rule as the other two exits).
- **Status:** code-confirmed; runtime UNVERIFIED.

### P2-1 — Poll race can strand the UI in "publishing" after the job completed
- **Where:** `packages/editor/src/editor/shell/hooks/usePublishJob.ts:181-215` — `setInterval(tick, 2000)` with async `tick`, no request sequencing.
- **Trace:** tick A (slow, >2 s) in flight; tick B returns `COMPLETED` → `stopPolling()`; tick A resolves with `BUILDING` → `setStatus(BUILDING)` (only `abortRef` is checked, it is false). Polling is stopped, `uiState` = "publishing" forever, no outcome toast.
- **Fix:** chain with `setTimeout` after each response (no overlap), or drop responses whose `seq` < last applied / once a terminal status has been applied.
- **Status:** UNVERIFIED (timing-dependent).

### P2-2 — A COMPLETED job can be reported as failed when the follow-up `sites.get` fails
- **Where:** `PublishService.ts:98-111` — on `COMPLETED`, `fetchPublishStatus` also awaits `sites.get` for `publishedUrl`; any throw fails the whole tick → `usePublishJob.ts:192-203` counts it; 3 in a row → `pollLost` → `uiState "failed"` + "Publish failed / Try again" toast for a publish that succeeded (and "Try again" starts a second deploy).
- **Fix:** catch the `sites.get` read separately (publishedUrl `null` on failure) or return `publishedUrl` from `getPublishStatus` via a join so status is one read.

### P2-3 — `VERCEL_NOT_CONNECTED` toast branch is dead for the common (pre-job) case
- **Where:** router rewrites the message (`server/trpc/routers/sites.ts:481-485` → "Connect this workspace to Vercel before publishing."); editor matches the raw code (`useExportHandlers.ts:167`). The pre-job refusal therefore falls to the generic "Publish failed · Try again" toast instead of "Vercel not connected · Open settings". (`VERCEL_TOKEN_INVALID` from the worker still matches because the job `error` keeps the raw code.)
- **Fix:** keep a stable code in the TRPCError (e.g. `cause: { code: "VERCEL_NOT_CONNECTED" }`, already forwarded by `errorFormatter` as `data.cause`) and match on that; or put the shared sentence in `@buildrik/shared` like `PUBLISH_APPROVAL_MESSAGES`.

### P2-4 — EDITOR may publish but may not cancel their own publish
- **Where:** `sites.publish` requires EDITOR (`sites.ts:439`), `sites.cancelPublish` requires ADMIN (`sites.ts:545`). `PublishTab.tsx:321-336` shows Cancel to anyone who can publish; an EDITOR gets FORBIDDEN rendered as the cancel error (`:757`).
- **Fix:** gate cancel at EDITOR (it is the inverse of an EDITOR action), or hide Cancel below ADMIN. Product decision; flag only.

### P2-5 — Worker claim / cancel race (non-atomic QUEUED→BUILDING)
- **Where:** `app/api/workers/publish/[jobId]/route.ts:63-66` reads `status === "QUEUED"`, then `:110-118` updates to BUILDING with `where: { id }` only. A cancel landing between the read and the write is overwritten; the job proceeds to deploy. `checkCancelled` exists (`:249-255`) but runs later.
- **Fix:** `updateMany({ where: { id: jobId, status: "QUEUED" }, data: {...BUILDING} })` and bail when `count === 0`.

### P2-6 — Publish does not flush the pending debounced autosave
- **Where:** `settledBaselineLastEditedAt` awaits only in-flight saves (`_saveChain`, `BuildrikSyncProvider.ts:192-195`); the 1 s autosave timer (`useComposerInit.ts:616`, `AUTOSAVE_DEBOUNCE: 1000`) is not flushed. Published HTML comes from the live composer (correct), but the server's stored project lags what went live; if that save then fails/conflicts, the live site carries content that exists in no stored project or version.
- **Fix:** expose a `flushPendingSave()` from the autosave effect and await it in `runPublish` before export.

### P2-7 — Version restore wipes the whole undo stack (not ⌘Z-undoable)
- **Where:** `engine/VersionTimelineManager.ts:281-323` → `composer.importProject` → `HistoryManager.ts:138-161` resets undo/redo on the `PROJECT_LOADED` emit. Restore is persisted (autosave listens to `version:restored`, `useComposerInit.ts` handler list) and a safety version + "Undo restore" toast exists (`VersionHistoryPanel.tsx:198-216`), so no data loss — but ⌘Z history before the restore is gone and ⌘Z cannot undo the restore.
- **Fix (if desired):** run the import inside a history transaction (as `Composer.ts:1153` does for rollback) instead of the PROJECT_LOADED reset path. Product decision.

### P2-8 — `siteVersions.create` payload is unbounded
- **Where:** `packages/shared/schemas/site-version.ts:16-25` `payload: z.record(z.unknown())`; up to 50 full-project snapshots per site (`site-version.service.ts:13`). No byte cap like publish's `MAX_PUBLISH_PAYLOAD_BYTES`.
- **Fix:** add a size refine (and/or reuse the project-save cap).

### P2-9 — Transfer dialog reads the SESSION workspace roster and needs ADMIN
- **Where:** `DangerZoneScreen.tsx:184` `team.list` → `server/trpc/routers/team.ts:57-60` `requireAdmin(ctx)` on the session workspace. `sites.transfer` also allows the site's creator (`canTransferSite`). A creator below ADMIN gets FORBIDDEN, swallowed into an empty member list; a multi-workspace user lists the wrong workspace's members. Same class as P1-1.
- **Fix:** a site-scoped member query (`siteDetail`/`sites.transferCandidates({ siteId })`) gated by `canTransferSite`.

### P2-10 — Four tRPC client factories for one server (SSOT)
- `services/api-client.ts:20-44` (absolute `DASHBOARD_URL`, `credentials: include`, singleton), `services/PublishService.ts:16-20` (a second instance of the same factory, not the singleton), `services/ai/AiTrpcClient.ts:163-172` and `services/ai/subscriptionClient.ts:13-37` (relative `/api/trpc`). In the standalone Vite demo the relative clients hit the Vite origin, so AI is dead there; in the unified build they work. Fix: one factory (`getBuildrikClient`) with an optional subscription split link.
- `useComposerInit.ts:191` calls `ai.componentSchema.mutate` through `as any`; input shape checked by hand and matches (`{ prompt, model? }` vs `ai.ts:168-171`).

### P2-11 — Dead / non-existent endpoints still referenced
- `shared/constants/config.ts:203-206` `AI_ENDPOINT /api/ai`, `ASSETS_ENDPOINT /api/assets`, `TEMPLATES_ENDPOINT /api/templates`, `EXPORT_ENDPOINT /api/export` — no consumers, no such routes. Delete.
- `engine/export/StripeInjector.ts:24` default `checkoutEndpoint "/api/checkout"` is emitted into exported/published sites when `checkoutMode` is API mode; no such endpoint exists on a static Vercel deploy (default mode `payment-links` is unaffected).
- `services/EmailService.ts:358-366`, `engine/integrations/EmailService.ts:94-102` throw "Implement POST /api/email/…" — stubs.
- `engine/forms/FormHandler.ts:13` imports `../../services/FormSubmissionService` — engine→services violates the editor import-direction rule.

### P2-12 — Scheduled publish: disabled at create, but the cron still fires any legacy PENDING rows into a guaranteed failure
- `scheduled-publish.service.ts:39-57` refuses creation (`NO_RENDERER`); `app/api/cron/scheduled-publish/route.ts:37` calls `startPublish` without pages, which the worker refuses ("No page content to deploy", `route.ts:96-100`). The row is marked PUBLISHED with a job id (`markScheduleStarted`) even though the job will FAIL. Only matters if rows exist from before the refusal (UNVERIFIED — query `scheduled_publishes WHERE status='PENDING'`). No editor UI calls schedule APIs.

### P2-13 — `/edit/<trashed site>` mounts the editor instead of the denied/missing state
- `app/edit/[siteId]/page.tsx:47` → `getEditorAccess` → `getEffectiveSiteRole` (`permission.service.ts:168`) does not check `deletedAt`. The editor then loads, `sites.get` returns NOT_FOUND (`sites.service.ts:391-393` filters `deletedAt: null`) and the "missing" banner shows. Functional, but the server page could render `DeniedState`/a "site is in trash" state directly.

---

## Data-flow summaries

**Publish (editor, unified build):** Topbar/PublishTab → `useExportHandlers.runPublish` (`useExportHandlers.ts:82-122`) → `exportPublishPages` (`exportPublishPages.ts:66-91`: no CMS bindings → live composer export with inlined stylesheet; bindings → `cmsSyncBlocker()` then `cms.publishSnapshot` (server rows + fonts) rendered in a scratch composer) → fire-and-forget thumbnail POST `/api/site-thumbnail/:id` → `usePublishJob.publish` → `PublishService.publishSite` (waits in-flight saves, sends `expectedLastEditedAt`) → `sites.publish` (EDITOR; ADMIN for `acknowledgeStale`) → `startPublish` (single-active-job, stale cleanup, C-3 freshness, approval gate on site workspace, Vercel pre-check, dynamic CMS pages appended, job row, dispatch worker) → worker `POST /api/workers/publish/:jobId` (cron-auth) → BUILDING → DEPLOYING → `runVercelDeploy` → `completePublish`. Editor polls `sites.publishStatus` every 2 s (3-failure backoff → pollLost/"Check status"). Pre-publish checks: `sites.prePublishChecks` → `runPrePublishChecks`, rendered by PublishTab (server is the only source). Approval blocks map via shared `PUBLISH_APPROVAL_MESSAGES` (`usePublishJob.ts:71-81`). Flag: `FEATURE_PUBLISH = VITE_FEATURE_PUBLISH ?? NEXT_PUBLIC_FEATURE_PUBLISH` (`runtimeEnv.ts:84-85`, literal `process.env.NEXT_PUBLIC_FEATURE_PUBLISH` read at `:46`); `NEXT_PUBLIC_FEATURE_PUBLISH` is present in root and dashboard `.env.local` and `.env.production.local`; `check-baked-flags.mjs:42` requires it baked `"true"` → reachable in the shipping bundle (value not printed; bundle not built in this audit).

**Version history:** VersionTimelineManager (IndexedDB) → events → `versionSync.ts` mirror (`siteVersions.create/rename/delete`, retry queue) ; open → `hydrateVersionsFromServer` (list + ≤20 payloads). Restore: safety version first, `importProject(snapshot)`, `version:restored` → autosave persists. Server: EDITOR for writes (`guardSiteRole`), any member for reads, sanitized payload, prune autos beyond 50.

**Collaboration (flagged, planned):** `CollaborationManager.startSession(siteId)` → `SSETransport` → `POST /api/collab/:siteId/ops` + `GET /api/sse/collab/:siteId?since=` (both 404 unless `NEXT_PUBLIC_FEATURE_COLLAB==="true"`, both `checkSiteRole EDITOR`, SSE re-checks role mid-stream). Last-write-wins; UI entry gated by `isFeatureEnabled("collab")`. Transport uses relative URLs (works only same-origin). No action.

**Dashboard mount:** `app/edit/[siteId]/page.tsx` (server): unauthenticated → login with deep-link preserved; no access → `DeniedState`; VIEWER → forced `?view=readonly`; else `EditorClient` → `dynamic(import("@buildrik/editor").AquibraStudio, ssr:false)` with `key={siteId}` and an error boundary (ChunkLoadError → hard reload). The editor derives `siteId` from `/edit/:id` (`getSiteIdFromUrl`). Load: `sites.get` + `pages.list` + `siteDetail.settings.get` (retried once); failures classified auth/missing/forbidden/network → banner + localStorage fallback (see P1-2). Save: autosave 1 s debounce → serialized `_saveChain` → `sites.saveProject` (EDITOR, `expectedLastEditedAt` conflict check) → then changed site columns → `siteDetail.settings.update` (ADMIN only).

---

## Client call table (editor → server)

All tRPC calls go through clients typed `createTRPCClient<AppRouter>` (type-only import of `server/trpc/router`), and `tsc --noEmit` passes → **every procedure below exists and every input shape type-checks.** The one untyped call (`ai.componentSchema` via `as any`) was checked by hand and matches. Auth column = guard found in the router or (marked *svc*) inside the service.

| Router.procedure (editor call sites) | Exists / input | Server auth |
|---|---|---|
| `sites.get` (BuildrikSyncProvider:714, PublishService:111,192, DangerZone:130) | ✓ | assertSiteAccess |
| `sites.myRole` (RoleService:32, DangerZone:132) | ✓ | getEffectiveSiteRole (throws on no access) |
| `sites.saveProject` (BuildrikSyncProvider:819) | ✓ | checkSiteRole EDITOR |
| `sites.publish` / `publishStatus` / `cancelPublish` / `prePublishChecks` / `publishHistory` / `publishDiff` / `publishedSnapshot` / `rollback` / `unpublish` (PublishService) | ✓ | EDITOR / site member (job's site) / ADMIN / member / EDITOR / EDITOR / EDITOR / ADMIN / ADMIN |
| `sites.duplicate`, `sites.delete` (BuildrikSyncProvider:598,606), `sites.archive`/`unarchive`/`transfer` (DangerZone, Overview) | ✓ | role-checked in router; transfer checked in *svc* (`NOT_OWNER`) |
| `pages.list` (BuildrikSyncProvider:715); `pages.folders.*` (PageFolderService) | ✓ | site guard; folders: `checkSiteRole EDITOR` *svc* |
| `siteDetail.settings.get/update`, `siteDetail.projectSettings.update`, `siteDetail.domains.list`, `siteDetail.redirects.list/suggestions`, `siteDetail.locales`, `siteDetail.analyticsStatus`, `siteDetail.settingsOverview` | ✓ | site guards in router (settings.update ADMIN) |
| `cms.collections.*`, `cms.entries.*` (incl. importCsv/Preview), `cms.dynamicPages`, `cms.publishSnapshot` (mutation) | ✓ | requireRead / requireWrite (assertSiteAccess / role) |
| `forms.listBlocks/getBlock/updateBlock/listSubmissions/updateSubmission/deleteSubmission/exportSubmissions` | ✓ | site guards |
| `siteVersions.create/list/get/rename/delete` | ✓ | guardSiteRole EDITOR (writes) / guardSiteAccess (reads) |
| `siteComponents.upsert/delete/get/list/library/libraryGet`; `userTemplates.list/upsert` | ✓ | site / workspace guards |
| `reviews.status/submit/currentRound/rounds/approvedSnapshot/revoke`; `comments.list/create/reattach/resolve` | ✓ | site guards + agency-layer flag |
| `media.*` (listAssets, listFolders, createAsset, updateAsset, deleteAsset, moveAsset, createFolder, renameFolder, deleteFolder, list/create/restoreAssetVersion, generateAltText, checkStorageQuota, uploadPrefix, searchStockPhotos/Videos) | ✓ | user-scoped (`userId` owner) + `assertMediaWrite(userId, siteId)` *svc* on writes; stock search: session only (proxy) |
| `upload.presign/confirm` (SiteSettingsScreen:86,102) | ✓ | `assertUploadRole` *svc*; confirm owner-scoped |
| `team.list` (DangerZone:185) | ✓ | ADMIN on **session** workspace — see P2-9 |
| `activity.recent`, `notifications.recent/unreadCount/markRead/markAllRead`, `onboarding.getState/completeEditorTask`, `account.profile.get` | ✓ | user-scoped (session) |
| `ai.content/summarize/milestoneSuggest/quota/logAdoption/streamPrompt(subscribe)/componentSchema`, `actions.propose/confirm` | ✓ | session + per-user quota; logAdoption verifies site membership *svc* |

Raw HTTP from the editor:

| Call | Route | Exists | Auth |
|---|---|---|---|
| `captureThumbnail.ts:79` POST `${DASHBOARD_URL}/api/site-thumbnail/:siteId` | `app/api/site-thumbnail/[siteId]/route.ts` | ✓ | session + `assertSiteEditAccess` before write |
| `AssetUploadService.ts:117` `@vercel/blob` `handleUploadUrl` `/api/asset-upload` | `app/api/asset-upload/route.ts` | ✓ | session in `onBeforeGenerateToken`, `assertMediaWrite`, quota, owned prefix |
| `SiteSettingsScreen.tsx:92` PUT presigned `uploadUrl` | `app/api/upload/[fileId]/route.ts` | ✓ | session + `assertUploadRole` |
| `SSETransport.ts:42,91` `/api/sse/collab/:id`, `/api/collab/:id/ops` | both exist | ✓ | flag kill-switch + `checkSiteRole EDITOR` |
| `config.ts:203-206` `/api/ai`, `/api/assets`, `/api/templates`, `/api/export` | — | ✗ (no consumers) | P2-11 |
| `StripeInjector.ts:24` `/api/checkout` (published-site runtime) | — | ✗ | P2-11 |
| `FormSubmissionService.ts:237` user webhook URL; `StorageAdapter.ts:328-365` configurable remote endpoint; misc `fetch(blob/data/asset URL)` for media | n/a (external / local) | — | — |

No editor call targets a non-existent tRPC procedure, and no editor-used site-scoped procedure was found without an access check. The authorization weaknesses found are the session-vs-site workspace mismatches (P1-1, P2-9) and the EDITOR-reachable deploy-file injection (P1-3).

## Not verified
- No live run of publish, rollback, cancel, restore or collab; no production bundle built to confirm the baked `NEXT_PUBLIC_FEATURE_PUBLISH` value.
- Vercel's handling of client-supplied `api/*` / `vercel.json` files in this project's deployments (P1-3 impact).
- Whether legacy PENDING `scheduled_publishes` rows exist (P2-12).
- Poll race (P2-1) reproduction.
