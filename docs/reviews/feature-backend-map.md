# Buildrik — Feature → Backend-Function Map

Generated 2026-06-23 by a 7-agent backend audit. Every row is grounded in real
`file:line`. Input: `feature-inventory.md`. Scope: backend functions (services /
routers / API routes / engine), not frontend UI.

**Status legend:** WORKING · PARTIAL (works, gaps noted) · STUB (UI/route exists,
logic fake/no-op) · BROKEN (wired but a real bug) · NO-BACKEND (frontend-only).

**Data-flow chain:** UI → tRPC router (`server/trpc/routers/X.ts`) → service
(`server/services/X.service.ts`) → Prisma / external API. Editor: UI → Composer
method → engine manager → state (often browser-local). Async: → `/api/workers/*`,
`/api/sse/*`, `/api/cron/*`.

---

## 1. Auth & Account

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Sign in — credentials (tRPC) | `auth.service.ts:login` + `auth.ts:login` | Lockout + bcrypt + DUMMY_HASH anti-enumeration; mints 5-min `session_grant` → `create-session/route.ts` sets NextAuth cookie. | WORKING |
| Sign in — credentials (NextAuth) | `auth.config.ts:authorize` | Parallel path; IP rate-limit + lockedUntil + bcrypt. Does NOT write failedAttempts/auditLog (only tRPC path does). | WORKING |
| Sign in — magic link | `auth.service.ts:sendMagicLink`/`verifyMagicLink` + `auth.ts` | No-op if user missing; 15-min token → `/auth/callback`; branches to 2FA or session_grant. | WORKING (needs SMTP) |
| Sign in — OAuth (Google/GitHub) | `auth.config.ts:signIn`/`jwt`/`session` | Upserts user+workspace on first login; populates token.workspaceId. | WORKING (needs OAuth client envs) |
| Sign up | `auth.service.ts:signup` + `auth.ts:signup` | `$transaction` user+workspace+OWNER+onboarding; 24h verify token emailed (failure swallowed). | WORKING (verify needs SMTP) |
| Email verify / resend | `auth.service.ts:verifyEmail`/`resendVerification` | Validates token → sets emailVerified; same proc handles email_change swap. | WORKING |
| Password reset / change / set | `auth.service.ts:forgotPassword`/`resetPassword`, `account.service.ts:changePassword`/`setPassword` | reset kills all sessions; set guarded for OAuth-only accounts. | WORKING |
| Email change | `account.service.ts:requestEmailChange` + `account.ts:changeEmail` | 24h `email_change` token to NEW address; swap on verify. | WORKING (needs SMTP) |
| 2FA enable/confirm/disable/verify/backup | `account.service.ts:enable2FA`/`confirm2FA`/`disable2FA`, `auth.service.ts:verify2FA`/`verifyBackupCode` | TOTP secret AES-encrypted; 10 bcrypt backup codes; ≤5 attempts lockout. | WORKING (needs ENCRYPTION_KEY) |
| Account profile get/update | `account.service.ts:getProfile`/`updateProfile` | Safe fields + hasPassword + connectedAccounts; avatar is a URL string. | WORKING |
| Avatar upload | — | No avatar-upload mutation; `avatar` URL passthrough via updateProfile only. | PARTIAL (no avatar-specific backend) |
| Disconnect OAuth / sessions / login history | `account.service.ts:disconnectProvider`/`getActiveSessions`/`revokeSession`/`getLoginHistory` | Refuses last login method; scoped IDOR-safe revoke. | WORKING |
| Account deletion (30-day) | `account.service.ts:requestAccountDeletion` + cron `account-deletion/route.ts` | Scheduled +30d; cron processes incl owner-heir reassignment. | WORKING (needs SMTP) |
| Data export | `account.service.ts:requestDataExport` | Creates `exportJob(PENDING)` row; **no processor cron found**. | PARTIAL (no producer) |
| API tokens (list/create/revoke/verify) | `api-token.service.ts:*` + `api-tokens.ts` | `bdr_live_*`, SHA-256 hashed, plaintext once; bearer-auth context. | WORKING |

## 2. Workspace & Team (Agency layer)

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Workspace create | `auth.service.ts:createWorkspaceForUser` | Created inside signup/OAuth txn. **No "create additional workspace" mutation.** | WORKING / NO-BACKEND for extra workspaces |
| Workspace select/switch | `workspace-settings.service.ts:listUserWorkspaces` + `auth.config.ts:jwt` (trigger=update) | Client `update({workspaceId})`; jwt re-validates ACTIVE membership (IDOR guard). | WORKING |
| Workspace settings / sharing update | `workspace-settings.service.ts:updateWorkspaceSettings`/`updateSharingSettings` | **No OWNER/ADMIN role check** — any active member can update. | WORKING (weak authz) |
| Workspace delete (30-day) | `workspace-settings.service.ts:deleteWorkspace` + `account.ts:workspace.delete` | Owner-only + name-match → +30d schedule; cron purges. | WORKING |
| Ownership transfer (send/accept/cancel) | `workspace-transfer.service.ts:*` + `account.ts:workspace.transfer.*` | 48h token, email-match accept, txn swaps ownerId + demotes old owner; cron expiry. | WORKING (needs SMTP) |
| Team list/stats | `team.service.ts:listMembers`/`getTeamStats` | Paginated members + permission counts. | WORKING |
| Team invite send | `team.service.ts:inviteMembers` + `team.ts:invite` (ADMIN) | Dedupe + plan limit; per-email invite + email + `MEMBER_INVITED` activity. | WORKING (needs SMTP) |
| Team invite accept / details / decline | `auth.ts:acceptInvite`/`getInviteDetails`/`declineInvite` | Email-match guard, txn creates member+sitePermissions, `MEMBER_JOINED`. | WORKING |
| Invite revoke / resend | `team.service.ts:revokeInvite`/`resendInvite` | **resendInvite extends expiry/counter but does NOT re-send email.** | PARTIAL |
| Roles & permissions | `permission.service.ts:checkWorkspaceRole`/`checkSiteRole` | ROLE_RANK; ACTIVE-only; bearer scoped to token workspace. | WORKING |
| Change role / revoke / delete member | `team.service.ts:changeRole`/`revokeMember`/`deleteMember` (ADMIN) | IDOR-scoped; refuse OWNER + last-ADMIN demote; `MEMBER_*` activity. | WORKING |
| Team activity feed | `team.service.ts:getTeamActivity` | Queries activityLog for TEAM_ACTIONS (now written by team router + acceptInvite). | WORKING |
| Notifications center (list/grouped/unread SSE/mark/mute) | `notification.service.ts:*` + `sse/notifications/route.ts` | Owner-scoped; SSE polls unread every 5s; prefs honored at send. | WORKING |
| Integrations — add | `integrations.service.ts:addIntegration` + `account.ts:integrations.add` | Plan limit + SSRF guard; **NOT role-gated** (add only). | WORKING (weak authz on add) |
| Integrations — remove/update/test | `integrations.service.ts:removeIntegration`/`updateIntegration`/`sendIntegrationTestEvent` | ADMIN-gated; test re-validates URL (DNS-rebind defense), 8s timeout. | WORKING |
| Vercel OAuth (authorize/callback/finish/status/disconnect) | `vercel-oauth.service.ts:*` + `integrations.ts:finishConnect`/`getConnection`/`disconnect` + `api/integrations/vercel/*` | HMAC state, token AES-encrypted into `workspaceIntegration.config`; ADMIN-gated. | WORKING (needs ENCRYPTION_KEY + VERCEL_OAUTH_*) |

## 3. Dashboard & Site Management

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Dashboard stats + activity feed + filters | `dashboard.service.ts:getDashboardStats`/`getActivityFeed` | 11-read Promise.all; feed `all/mine/team` filters; hardcoded limit 20. | WORKING (feed under-fed) |
| Quick actions / workspace health / attention queue | `dashboard.service.ts:getQuickActions`/`getWorkspaceHealth`/`getAttentionQueue` | Plan-aware actions; **bandwidth.usedMB hardcoded 0**; agency review/comment/domain/failed-job counts. | PARTIAL (bandwidth fake) |
| Recent sites / sites list (filter/sort/search/pagination) | `dashboard.service.ts:getRecentSites`, `sites.service.ts:listSites` | DB pagination + 30d analytics sum; SORT_MAP. | WORKING |
| Sites list — traffic filter/sort | `sites.service.ts:listSites` (needsFullScan) | visitors30d is an aggregate → in-memory scan/sort/slice when traffic filter/sort. | WORKING |
| Create site — blank / template | `sites.service.ts:createSite` + `sites.ts:create` | Plan limit, unique slug, txn site+pages; template copies pages + usageCount. | WORKING |
| Create site — **AI** | `sites.service.ts:createSite` (no AI branch) | Schema accepts `method:"ai"` but service has no AI branch → **falls through to blank 1-page site**. | STUB / NO-BACKEND (AI) |
| Site detail / overview | `site-detail.service.ts:getSiteOverview` | 11-read; health score (seo·.3+content·.3+ssl·.2+favicon·.2). | WORKING |
| Rename / duplicate / archive / delete | `sites.service.ts:renameSite`/`duplicateSite`/`archiveSite`/`deleteSite` | Deep-copy on duplicate; soft delete + name-match; **rename/dup/archive/delete write NO activity log**. | WORKING (feed gap) |
| Bulk actions | `sites.service.ts:bulkAction` + `sites.ts:bulk` | **Bulk "publish" = status flip, no real deploy**; succeeded count approximate. | PARTIAL |
| Bulk move / export | — | `bulkActionSchema` enum lacks move/export → `INVALID_ACTION`. | NO-BACKEND |
| Move to folder / folders CRUD | `folder.service.ts:moveSiteToFolder`/`listFolders`/`createFolder`/`renameFolder`/`deleteFolder` | Cross-workspace guard on move; **folder create not role-gated**. | WORKING |
| Clients CRUD + assign (agency) | `clients.service.ts:*` | Workspace-scoped IDOR guard; flag-gated (default off). | WORKING (flag off) |
| Slug availability | `sites.service.ts:checkSlugAvailability` | **No deletedAt filter** → soft-deleted sites reserve slug forever. | WORKING (minor bug) |

## 4. Core Editor — Canvas (engine; client-side)

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Add / select / multi-select | `ElementCRUD.ts:createElement`/`addElement`, `SelectionManager.ts:select`/`addToSelection`/`selectAll` | In-memory engine tree + Set; emits events. | WORKING |
| Resize / drag-move | `canvas/ResizeHandler.ts:startResize`, `drag/DragManager.ts` + `ElementCRUD.ts:moveElement` | Drag state machines → inline styles / reparent. | WORKING |
| Group / ungroup | `ElementManager.ts:groupElements`/`ungroupElement` | ≥2 siblings → container; ungroup reflows children. | WORKING |
| Add section/blocks / duplicate / copy-paste | `ElementManager.ts:importHTMLToActivePage`, `ElementCRUD.ts:duplicateElement`/`serializeElement`/`pasteElement` | HTML/ElementData injection; clipboard in `Composer.ts:clipboard`. | WORKING |
| Pages CRUD/reorder/setHome | `PageManager.ts:createPage`/`updatePage`/`deletePage`/`duplicatePage`/`reorderPage`/`setHomePage` | Pages Map + PageRouter; slugHistory cap 100. | WORKING |
| Layers tree | `SelectionManager.ts:selectParent`/etc. | Derived from live element hierarchy. | WORKING |
| Project import/export + transactions/rollback | `Composer.ts:importProject`/`exportProject`/`beginTransaction`/`rollbackTransaction` | Sanitizes each page (XSS boundary); snapshot rollback. | WORKING |

## 5. Inspector / Styling (engine)

All controls funnel through `ElementStyles.ts:setStyle` (desktop = inline `data.styles`)
or `StyleEngine.ts:setBreakpointStyle` (tablet/mobile = media-query rules). Persisted
only via project blocks JSON.

| Feature | Backend function(s) | Status |
|---|---|---|
| Typography / spacing / layout / size / background / effects / transform / filter | `ElementStyles.ts:setStyle` (+ `StyleEngine.ts:setRule`/`setBreakpointStyle`) | WORKING |
| Responsive per-device | `StyleEngine.ts:setBreakpointStyle` | WORKING |
| Global styles / presets | `GlobalStyleManager.ts:define`/`applyToElement`/`applyAsClass` | WORKING |
| Custom CSS injection | `projectSettings.customCode.globalCss` → `ExportEngine.ts:361/546` + `useGlobalCustomCss.ts`; server mirror `Site.headCode/bodyCode` | WORKING |

## 6. Components & Design System (engine)

**KEY GAP: component masters stored in browser IndexedDB (`aquibra-components`) only — NOT server-persisted.** Lost on cache-clear / other device.

| Feature | Backend function(s) | Status |
|---|---|---|
| Create / save-as component | `ComponentManager.ts:createComponent` → `ComponentStorage.ts:saveComponent` (IndexedDB) | WORKING (browser-LOCAL) |
| Create instance / rehydrate after load | `ComponentInstances.ts:instantiateComponent`, `ComponentManager.ts:rehydrateInstances` | WORKING |
| Update master → propagate | `ComponentManager.ts:updateComponentMaster` + `ComponentInstances.ts:syncAllInstances` | PARTIAL |
| Per-instance overrides | `ComponentInstances.ts:recordInstanceOverride` + `ComponentInstance.ts:applyOverride` | **BROKEN-ish: overrides NOT re-applied on master-sync (`ComponentInstances.ts:233-246`) → customizations revert on every propagate.** |
| Detach / variants | `ComponentInstances.ts:detachInstance`/`updateInstanceVariant` + `ComponentVariantResolver.ts` | WORKING / PARTIAL (variant authoring thin) |
| Design tokens (set/auto-fix) | `Composer.ts:setDesignToken`/`applyAutoFix`; `projectSettings.designTokens`; `Site.dsSchemaVersion` | WORKING |

## 7. Content System

| Feature | Backend function(s) | Status |
|---|---|---|
| Text/heading inline editing | `Element.ts:setContent` | WORKING |
| Links (href) | `ElementStyles.ts:setAttribute` (href); CMS dynamic via `cms/DataBindResolver.ts` | WORKING |
| Interactions (13 triggers) + runtime | `interactions/InteractionManager.ts:addInteraction`, `InteractionRuntime.ts:start` | WORKING |
| Animations (GSAP) | `animations/GSAPEngine.ts:createAnimation` | PARTIAL (native ScrollTrigger removed; scroll via IntersectionObserver) |
| Localization — engine | — | NO-BACKEND (engine is locale-unaware) |
| Localization — server | `page.service.ts:resolveTranslation`; `Page.translations` Json; `pages.getTranslation/setTranslation` | WORKING (server-only; invisible to editor) |

## 8. CMS

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Collections CRUD — engine | `CollectionManager.ts:createCollection`/etc → `CollectionStorage.ts` (IndexedDB `aquibra-cms`) | Local SSOT. | WORKING (local) |
| Collections CRUD — server | `cms.service.ts:listCollections`/`upsertCollection`/`deleteCollection` + `cms.ts` | siteId-scoped Prisma `cmsCollection`. | WORKING |
| Server-sync (engine→DB) | `useCmsSync.ts` → `cmsSync.ts:syncCollectionUpsert`/etc; `hydrateCmsFromServer` | **Best-effort, lossy: failures dropped; server→local hydration additive-only (server edits to existing collection never sync down).** | WORKING (eventual/lossy) |
| Records CRUD (modal + engine) | `CollectionManager.ts:createContentItem`/etc; `CMSRecordsModal.tsx` | Modal (was dead UI) now wired; mirrored to server. | WORKING |
| Records CRUD — server | `cms.service.ts:listEntries`/`upsertEntry`/`deleteEntry` | `assertCollectionInSite` cross-site guard. | WORKING |
| Binding (element→record/field) | `CMSBindingManager.ts:bindToField`/`resolveBinding`/`applyBinding` | In-engine; repeater context handled. | WORKING |
| Dynamic pages (resolve/generate + publish) | `cms.service.ts:resolveDynamicPages`/`generateDynamicPages`/`appendDynamicPagesToPublish` | One page per PUBLISHED entry; safe no-op when none. | WORKING |

## 9. Media

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Library list / upload / delete | `media.service.ts:listAssets`/`createAsset`; `MediaManager.ts:uploadFile`/`deleteAsset` | Server SSOT + IndexedDB cache; Vercel Blob; atomic bytes; SVG DOMPurify. | WORKING |
| Folders CRUD / move | `media-folder.service.ts:*`; `MediaManager.ts:createFolder` | Cycle-detection; delete moves children to root. | WORKING |
| Presign + confirm upload (favicon/og/avatar) | `upload.service.ts:createPresignedUrl`/`confirmUpload`; `api/upload/[fileId]/route.ts` | DB `PendingUpload` (10-min TTL) → PUT → Vercel Blob. Small-asset path (separate from library). | WORKING |
| `/api/asset-upload` route | — | **Referenced in comments but file does not exist**; real path is tRPC `media.createAsset`. | NO-BACKEND (dangling ref) |
| Alt-text (AI) | `alt-text.service.ts:generateAltText` + `media.ts:generateAltText` | Claude Haiku vision; TOCTOU guard (never overwrites user text). | WORKING (needs ANTHROPIC_API_KEY) |
| Stock photos / videos | `StockService.ts:searchPhotos`/`searchVideos` | **STUB: `IS_STOCK_CONFIGURED=false`, returns `[]` for every query.** No `media.searchStock` route. | STUB |
| Stock icons / fonts | `MediaManager.ts:getIcons`/`getFonts`; `IconPickerModal.tsx` (Lucide) | Hardcoded local lists (4 icons / 4 fonts); icon picker uses bundled Lucide. | NO-BACKEND (local, functional) |
| Image editor (version on edit) | `MediaVersionService.ts:createAssetVersion` → `media.service.ts:createAssetVersion`/`restoreAssetVersion` | `MediaAssetVersion` rows, plan-capped prune; needs synced asset. | WORKING |

## 10. AI Features

**Two stacks:** (a) tier-aware multi-provider (`streamPrompt`, alt-text, plan, componentSchema) — Claude default, env-guarded; (b) **legacy hardcoded OpenAI `gpt-4o-mini`** (`ai.content`/`page`/`layout` + site-gen worker) — **needs `OPENAI_API_KEY`, no clean guard** (opaque 401 if unset).

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| AI streaming prompt (chat) | `ai.ts:streamPrompt`; `ai.service.ts:streamContent`; `getProvider().stream` | resolveModel → assertProviderConfigured → reserveQuota → SSE token stream. | WORKING (needs ANTHROPIC/OPENAI/OLLAMA key; runtime live-unverified) |
| AI content / page / layout generation | `ai.service.ts:generateContent`/`generatePage`/`generateLayout` | OpenAI gpt-4o-mini; **no quota refund on failure**. | WORKING (needs OPENAI_API_KEY) |
| AI **site** generation (job→worker→Site+Pages) | `ai-generation.service.ts:createGenerationJob`; `workers/ai-generate/[jobId]/route.ts`; `generatePage`+`sectionsToBlocks` | QUEUED job → fire-and-forget worker (x-worker-secret) → per-page gen → txn create Site+Pages → COMPLETED; client polls. | WORKING (needs OPENAI_API_KEY + CRON_SECRET; full flow live-unverified) |
| AI edit-commands / page-scope / plan | `ai.service.ts:generateEditCommands`/`generatePageEditCommands`/`generatePlan` | Constrained-JSON, allow-list validated; editor re-validates + applies; agent runner walks plan steps. | WORKING (needs provider key) |
| AI SEO write-with-AI | `SeoTab.tsx:suggestTitle` → `ai.content` | Suggests ≤60-char title via gpt-4o-mini. (`generateSEO` util is dead — no consumer.) | PARTIAL (needs OPENAI_API_KEY) |
| AI alt-text | `media.ts:generateAltText` → `alt-text.service.ts` | Claude Haiku vision. | WORKING (needs ANTHROPIC_API_KEY) |
| AI propose-action (propose→confirm→execute) | `actions.ts:propose`/`confirm`; `action-confirmation.service.ts`; `ai-actions.service.ts` | ADMIN-gated, single-use 5-min `ActionConfirmation` token; `site.publish` only; rate-limited. | WORKING (platform AI-agnostic, fully wired) |
| AI adoption instrumentation | `ai.ts:logAdoption` → `ai-adoption.service.ts`/`summary` | Pure DB telemetry; STOP-AND-MEASURE summary. | WORKING (no key needed) |
| Quota / tier limits | `quota.service.ts:reserveQuota`/`resolveModelForUser`/`checkQuota` | Atomic per-user-per-day reserve; tier model resolution. | WORKING |

## 11. Templates

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Template gallery (list) | `template.service.ts:listTemplates` + `templates.ts:list` | Prisma `template.findMany(isActive)`. **`prisma/seed.ts` seeds NO templates → empty gallery out-of-box.** | PARTIAL (no seed data) |
| Template get/preview + use→create site | `template.service.ts:getTemplate`/`useTemplate` | Plan limit → site.create(TEMPLATE) → pages from JSON → usageCount++. | WORKING (data-dependent) |
| Editor templates tab | `templatesData.ts:SITE_TEMPLATES` (10 hardcoded); `useTemplateSelection.ts` | **Entirely client-side hardcoded HTML, separate from DB Template table.** | WORKING (hardcoded, no backend) |
| Save-as-custom-template / My Templates | `templatesData.ts:getMyTemplates` (localStorage `MY_TEMPLATES`) | **localStorage only — no server, no cross-device.** | WORKING (local only) |

## 12. Publishing & Domains

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Pre-publish checks | `publish.service.ts:runPrePublishChecks` + `sites.ts:prePublishChecks` | Parallel counts; only zero-pages is a hard fail. | WORKING |
| Start publish (job + dispatch) | `publish.service.ts:startPublish` + `sites.ts:publish` (ADMIN) | Stale-job guard, QUEUED job, payload in `log`, dispatch worker (x-worker-secret); partial-unique = 1 active job/site. | WORKING |
| Worker: Vercel vs simulation | `workers/publish/[jobId]/route.ts` (`runVercelDeployJob`/`runSimulation`) | `useVercel = pages>0`; prod+zero-pages throws (honesty guard); injects beacon/SEO/icons; sim = 5×2s → placeholder URL. | WORKING (sim is a real fallback) |
| Real Vercel deploy | `publish.service.ts:runVercelDeploy`; `lib/vercel.ts:createVercelDeployment` | Needs workspace OAuth conn; dev+no-conn → null (sim); prod+no-conn → throws. | WORKING — **needs Vercel OAuth/Pro; real deploy unverifiable without live token** |
| Published-site password enforcement | `lib/vercel.ts:setProjectPasswordProtection` (in `runVercelDeploy`) | PATCH Vercel `passwordProtection`; **402/403 swallowed → on Hobby Vercel the password does NOT gate**. | PARTIAL (Pro-only; silently skipped) |
| Publish status polling / lifecycle / cancel | `publish.service.ts:getPublishStatus`/`completePublish`/`cancelPublish`; `PublishService.ts` (2s poll) + SSE | Never returns raw `log`; QUEUED→BUILDING→COMPLETED txn; cancel aborts mid-build. | WORKING |
| Unpublish | `publish.service.ts:unpublishSite` | Sets DRAFT + nulls publishedUrl; **does NOT take down the live Vercel deployment**. | PARTIAL |
| Preview / published view / export HTML | `StudioHeader.tsx:handlePreview`; `ExportEngine.ts:export`/`exportAllPages` | Client-only sanitized preview; export = pure client (CSS, interactions, sitemap, JSZip). | WORKING (NO-BACKEND by design) |
| Custom domain connect / verify / primary / remove | `domain.service.ts:connectDomain`/`setPrimaryDomain`/`removeDomain`; `lib/vercel.ts:addDomainToVercelProject`; cron `dns-verify` | Vercel attach + stores verification DnsRecords (fallback `cname.vercel-dns.com`). | WORKING (connect) |
| Domain DNS-verify cron | `cron/dns-verify/route.ts` | **BROKEN: matches dead host `sites.buildrik.app` while records point at `cname.vercel-dns.com` → DNS verification never succeeds.** | BROKEN |
| Share links create/revoke/verify-password/viewCount | `share-link.service.ts:*`; `share/[token]/verify-password/route.ts` | Plan-gated; token UUID; bcrypt password; rate-limited verify; viewCount++. | WORKING |
| Share-page gate | `share/[token]/page.tsx` | **Decorative: redirects to world-readable `publishedUrl`; token is not a hard boundary** (admitted in code). | PARTIAL (security theatre) |
| Redirects CRUD + CSV | `redirect.service.ts:*` + `site-detail.ts:redirects.*` | DB-correct, CSV-injection-safe; **never injected into deployed output (no vercel.json/_redirects) → don't redirect live**. | PARTIAL |
| Per-page + technical SEO | `workers/publish/.../route.ts:injectSeoTags`/`injectHeadTags`; `engine/export/SEOInjector.ts` | Title/desc/OG/canonical/robots/noindex injected at publish. | WORKING |

## 13. History & Versioning

**KEY GAP: undo/redo (RAM) and named versions (IndexedDB) are BOTH browser-local. No `PageVersion`/`SiteVersion` server model exists.**

| Feature | Backend function(s) | Status |
|---|---|---|
| Undo / redo / patch-coalesce | `HistoryManager.ts:undo`/`redo`/`record`/`flushPending` | WORKING (RAM-only, lost on reload) |
| Named versions (create/restore/delete/compare/export) | `VersionTimelineManager.ts:createVersion`/`restoreVersion`/`compareVersions` → `VersionHistoryStorage.ts` (IndexedDB) | WORKING (browser-LOCAL) |
| Server version persistence | — (only `MediaAssetVersion`, `TemplateVersion` exist) | NO-BACKEND (server) |
| Project save → server | `BuildrikSyncProvider.ts:saveProject` → `sites.service.ts:saveProjectData` | WORKING (dual-save pages + Site columns, sanitized) |
| Save-conflict detection / autosave | `BuildrikSyncProvider.ts:SaveConflictError`/`initBuildrikSync` (5s debounce, empty-project guard) | WORKING |

## 14. Collaboration

**Gated OFF by default (`VITE_FEATURE_COLLAB=false`).** Transport/op-log/presence work on the happy path; the **OT engine is DEMO-ONLY (6 known P1 convergence bugs)**.

| Feature | Backend function(s) | Status |
|---|---|---|
| Start session / join room | `CollaborationManager.ts:startSession`/`joinRoom`; `StudioHeader.tsx:handleStartCollab` | WORKING (happy path; UI gated off) |
| SSE transport (POST ops + EventSource) | `SSETransport.ts`; `api/collab/[siteId]/ops`; `api/sse/collab/[siteId]` (poll 1.5s) | WORKING (polling, ~1.5s latency) |
| Op-log append/replay + retention | `collab.service.ts:appendCollabOp`/`getCollabOpsSince`; opportunistic 24h prune | WORKING |
| OT engine (conflict resolution) | `OTEngine.ts`; `HistoryManager.ts:recordAndMaybeBroadcast` | **PARTIAL / NOT production-safe** — last-write-wins, remote-clobbers-local, 6 P1 bugs |
| Presence (cursor/selection/lock) | `CollaborationManager.ts:updateCursor`/`acquireLock` | WORKING (ephemeral) |
| Comments | `comment.service.ts:*` + `comments.ts` | WORKING |

## 15. Analytics & Forms

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Page-view ingest + public beacon | `analytics.service.ts:recordPageView`; `api/public/track/[siteId]/route.ts` | Silent no-op for forged sites; CORS `*`; rate-limited 60/min; 204. | WORKING |
| Rate limiter | `rate-limiter.ts:checkRateLimit` | **Postgres-backed (shared across lambdas), NOT in-memory Map.** | WORKING |
| Beacon injection by publish worker | `workers/publish/.../route.ts:injectAnalyticsBeacon` | sendBeacon to `${NEXT_PUBLIC_APP_URL}/api/public/track`; **skips silently if env unset**. | WORKING (gated on env) |
| getSiteAnalytics (devices + granularity + sources/countries) | `analytics.service.ts:getSiteAnalytics`/`bucketByGranularity` | Plan-clamped range; devices from viewportWidth; **hourly silently degrades to daily**. | PARTIAL (hourly=daily) |
| Aggregation / purge cron | `cron/analytics-aggregate`/`analytics-purge` | Daily upsert; **avgSession hardcoded 0** (no duration capture); 30d raw purge. | PARTIAL (avgSession=0) |
| Form submission capture (public) | `form-submission.service.ts:submitForm`; `api/public/forms/[siteId]/[formBlockId]/route.ts` | Honeypot; plan cap; 256KB; rate-limited 10/min; owner notify+email. | WORKING |
| Form block config | `page.service.ts` / `sites.service.ts` (delete/copy only) | **No `formBlock.create`/`upsert` — config lives in page blocks JSON; no direct server write path.** | PARTIAL |
| Submissions list/update/delete/export/unread | `form-submission.service.ts:*` + `forms.ts` | Paginated; CSV-injection-safe export; unread count. | WORKING |

## 16. Settings (hub)

| Feature | Backend function(s) | Status |
|---|---|---|
| Site settings get/update (general/SEO/social/custom-code/security headers/locales) | `site-settings.service.ts:getSiteSettings`/`updateSiteSettings` | WORKING (custom-code Pro-gated on content; locales row-locked invariant) |
| Published-password storage | `site-settings.service.ts:hashPublishedPassword`/`decryptPublishedPassword` | WORKING (AES-encrypted, reversible for Vercel push) |
| Feature flags read/toggle | `feature-flag.service.ts:isFeatureEnabled`/`setFeature` | WORKING (kill-switch) |
| Help (categories/search/articles/feedback/ticket) | `help.service.ts:*` + `help.ts` | WORKING (feedback is unauthenticated/unthrottled — vote-stuffable) |
| Reviews (agency) | `review.service.ts` + `reviews.ts` | WORKING |

## 17. Billing & Plans

**Money path is honest-stubbed end-to-end. No Stripe SDK installed.** Downstream (webhook ingest, invoices, dunning, downgrade) is real but un-triggered until Checkout exists.

| Feature | Backend function(s) | How it works | Status |
|---|---|---|---|
| Billing overview / usage / plans / invoices | `billing.service.ts:getBillingOverview`/`getUsageCounts`/`getPlans`; `billing.ts` | Reads Subscription + live usage; FREE fallback. **bandwidth usedMB hardcoded 0.** | WORKING (bandwidth stub) |
| Upgrade plan / paywall | `billing.service.ts:upgradePlan` | **HARD-DISABLED: throws `PAYMENTS_NOT_CONFIGURED`** (prevents free self-grant); UI "coming soon". | STUB (honest) |
| Payment method (Stripe Elements) | `payment-method-card.tsx` | **Form fields all `disabled`, "coming soon"; no card-write path.** | STUB |
| Cancel / reactivate / switch interval / downgrade-reconcile | `billing.service.ts:cancelSubscription`/`reactivate`/`reconcileWorkspaceToFreePlan` | DB-only (no Stripe call); downgrade unpublishes over-cap sites. | WORKING (DB-only) |
| Stripe webhook + handlers | `api/webhooks/stripe/route.ts`; `stripe-webhook.service.ts` | **Manual HMAC verify (no SDK)** + idempotency; charge.failed/sub.updated/deleted/invoice.paid. | WORKING (un-triggered until Checkout) |
| Dunning / downgrade cron | `cron/billing-dunning`/`billing-downgrade` | 7-day grace reminders → flip to FREE + reconcile. | WORKING |

---

## SUMMARY

### Status counts (approx, by row)
- **WORKING:** ~95 features (the bulk — auth, editor engine, media, CMS, analytics ingest, forms, publish pipeline, settings).
- **PARTIAL:** ~20 (bandwidth=0, avgSession=0, hourly=daily, bulk-publish flip, unpublish no-teardown, redirects-not-deployed, share-page decorative, published-password Pro-only, resendInvite no email, data-export no processor, form-config no write path, OT engine).
- **STUB:** ~5 (stock photos/videos, billing upgrade, payment method, AI-method-on-create).
- **BROKEN:** ~2 (dns-verify cron host mismatch; component overrides revert on master-sync).
- **NO-BACKEND:** ~8 (bulk move/export, extra-workspace create, `/api/asset-upload` route, engine localization, server version persistence, avatar-upload, `generateSEO` dead util, stock icons/fonts hardcoded).

### Top 10 to fix first (by user impact)
1. **Billing/payments** — no Stripe Checkout; nobody can actually pay/upgrade (`billing.service.ts:upgradePlan` throws). STUB.
2. **Published-site password not enforced** on Hobby Vercel (402/403 swallowed) — security theatre. PARTIAL.
3. **Share links decorative** — redirect to world-readable `publishedUrl`; token not a real gate. PARTIAL.
4. **AI site generation needs `OPENAI_API_KEY`** (not set) + "AI" on create silently makes a blank site. STUB/gated.
5. **dns-verify cron BROKEN** — custom-domain DNS verification can never succeed (dead-host match).
6. **Version history + component masters browser-local only** — silent data loss on cache-clear / new device. NO-BACKEND (server).
7. **Stock photos/videos STUB** — returns `[]`; a prominent media feature is empty.
8. **Redirects stored but not deployed** — configured redirects don't work on the live site. PARTIAL.
9. **Collaboration off** (OT demo-only, 6 P1 bugs) — multiplayer not production-safe.
10. **Email is SMTP not Resend, failures swallowed** — verify/reset/invite silently no-op without SMTP env (user sees success, no email).

### Cross-cutting infra notes
- **Email:** `email.service.ts:sendEmail` uses **nodemailer/SMTP**, not Resend (despite env docs). Most callers `.catch(()=>{})` → silent no-op without SMTP.
- **ENCRYPTION_KEY** gates 2FA + all Vercel OAuth + published-password.
- **OPENAI_API_KEY** specifically gates site-gen + SEO-suggest (legacy OpenAI path, no clean guard); everything else can run on **ANTHROPIC_API_KEY** or local **OLLAMA**.
- **VERCEL_TOKEN / workspace OAuth** gates real publish + domains + password enforcement (dev silently simulates).
- **Browser-local-only stores (data-loss risk):** undo/redo (RAM), named versions + component masters (IndexedDB), My Templates (localStorage), standalone projects.
