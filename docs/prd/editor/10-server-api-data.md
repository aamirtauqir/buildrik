# Editor PRD · Ch.10 — Server API, Schemas, Data Model

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · Prisma at repo-root `prisma/schema.prisma`; tRPC at `server/trpc/routers/` (NOT under packages)

## 10.1 API surface (editor-relevant)

**sites** (`routers/sites.ts`): saveProject (EDITOR, optimistic `expectedLastEditedAt`→CONFLICT `:230-258`) · saveProjectData/getProjectData · prePublishChecks · publish (**ADMIN**, ALREADY_PUBLISHING→CONFLICT `:272-292`) · publishStatus · cancelPublish (NOT_CANCELLABLE→400) · unpublish (ADMIN, →DRAFT) · create/duplicate (SITE_LIMIT→FORBIDDEN "Upgrade your plan") · bulk (delete=OWNER, archive/publish=ADMIN, ≤25 ids).

**ai** (`routers/ai.ts`, all protected): content/page/layout (reserve 1 unit first `:155-228`) · **streamPrompt subscription** (prompt ≤5000, intent text|style-command|plan; provider-check BEFORE reserve; refund on no-delivery `:274-371`) · componentSchema (reserve+refund) · ⚠ summarize + milestoneSuggest = **NO quota** (`:230-268`) · getQuotaStatus · logAdoption.

**media** (`routers/media.ts:54-318`): folders/assets/versions CRUD, generateAltText (Haiku vision), checkStorageQuota, stock search — all user-scoped.

**Other**: pages.* (PAGE_LIMIT), siteVersions.*, siteComponents.*, theme.* (agency_layer flag + ADMIN), upload.* (presign/confirm), templates.generate.* (AI site gen), billing.*.

**REST**: `GET /api/sse/publish/[jobId]` (SSE 1s poll, 10min lifetime) · `POST /api/workers/publish|ai-generate/[jobId]` (x-worker-secret=CRON_SECRET, maxDuration 300) · `POST /api/asset-upload` (Blob token flow) · `POST /api/public/forms/...` (10/60s, 256KB) · `POST /api/public/track/[siteId]` (60/60s, CORS *) · `GET /api/cron/billing-downgrade` (Bearer CRON_SECRET) · `POST /api/auth/create-session` (uuid token, CSRF same-origin, 30d rememberMe, **max 10 sessions/user**).

## 10.2 Publish pipeline

PublishBuildJob: ≤1 active/site via **partial unique index in SQL migration only, not Prisma** (`schema.prisma:1157-1181`). Written statuses QUEUED→BUILDING→COMPLETED|FAILED|CANCELLED — ⚠ **DEPLOYING never written** (stale queries/cron reference a state that can't exist). Site: PUBLISHING→PUBLISHED|DRAFT. Worker steps ×5 — ⚠ "Optimizing images" + "Performance check" are **MVP no-ops shown as completed**; lighthouseScore always null (`workers/publish/[jobId]/route.ts:13-19,348,370`). Stale cutoffs QUEUED 5min / BUILDING 15min → FAILED "STRANDED_BY_WORKER_DISPATCH_LOSS". HTML payload on job.log Json, **cleared at terminal** (data-at-rest). dispatchWorker fire-and-forget, retries [200,500ms], 2s in-flight window. Vercel: workspace OAuth, deploy v13, poll 2s/timeout 60s, URL = shortest alias > project.vercel.app; 401/403 → VERCEL_TOKEN_INVALID + markInactive; prod 0-pages hard-fail (dev simulation exempt ⚠); republish failure preserves PUBLISHED if url exists. **Server-side injection at deploy**: analytics beacon, favicon/og, canonical+robots, robots.txt, **FREE-plan "Made with Buildrik" badge** (`route.ts:227-342`).

## 10.3 AI site-generation worker

AIGenerationJob: QUEUED→GENERATING_STRUCTURE→_CONTENT→_STYLES→COMPLETED|FAILED|CANCELLED; claim via conditional updateMany (double-dispatch guard, 409); **write-at-end** single $transaction (cancel = no site, no quota burn); site creationMethod "AI", first slug forced `home`. Inputs: name 2-100, businessType ×6, pages 1-**8**, desc ≤500 (`schemas/templates.ts:12-20`). Credits: monthly `aiGenerations` (CANCELLED excluded) + **3/hr anti-abuse all plans** (`ai-generation.service.ts:6,26,35`). ⚠ **No retry/reaping — lost dispatch strands job QUEUED forever** (`:82-84`). ⚠ **MODEL DRIFT**: worker + `ai.page` hardcode `gpt-4o-mini`, ignoring PLAN_MODELS tiers (`ai.service.ts:9,187`).

## 10.4 Business rules master (ACTUAL values)

**PLAN_LIMITS** (FREE/PRO/BUSINESS, `lib/constants/plan-limits.ts`): sites 3/15/50 · pagesPerSite 10/30/50 · domains 0/3/20 · team 1/5/25 · storageMB 500/5120/51200 · bandwidthMB 1024/10240/102400 · aiGenerations 3/20/-1 · aiPromptsPerDay 10/200/-1 · fileUploadMaxMB 10/50/200 · formSubmissions 100/2500/-1 · redirects 100/500/-1 · integrations 0/2/-1 · analyticsRetention 7/30/90d · shareLinkExpiry 7/30/90d · shareLinkPasswords ✗/✓/✓ · assetVersionsCap 5/25/100 · templateVersionsCap ∞ all · price $0/$29/$79 mo ($0/23/63 yr).

**PLAN_MODELS** (`:103-121`): FREE haiku-4-5 [haiku,4o-mini] · PRO sonnet-4-6 [+haiku] · BUSINESS opus-4-7 [all]. Client model = hint; unlisted → tier default. ⚠ "ollama" in modelSchema but no allow-list (env-forced only).

**Publish caps** (`schemas/publish.ts`): page HTML 2MB · payload 16MB · pages 500. **Upload** (`schemas/upload.ts`): avatar 5 / favicon 0.5 / touch 0.5 / og 2 / workspace 1 / site_media 50 / ticket 10 MB; route ceiling min(50MB, plan cap) (`asset-upload/route.ts:117`). **Quota service**: UTC-midnight daily bucket, atomic conditional updateMany reserve, release floors 0; ⚠ `used` return value wrong on success branch (cosmetic, `quota.service.ts:73-112`). AI bounds: prompt 5000, scope 200 el/120 tokens/100 assets. Theme snapshots 10/site. Billing downgrade: PAST_DUE + 7d grace → FREE + unpublish beyond 3 (keep newest, non-destructive, `billing.service.ts:183-198`).

## 10.5 Prisma models (editor)

Site (status DRAFT default, slug **globally unique**, projectStyles/Assets/Settings Json, dsSchemaVersion, soft-delete `schema.prisma:216-292`) · Page (blocks Json, @@unique(siteId,slug), seoTitle VarChar(60)/seoDesc(160) `:410-432`) · PublishBuildJob `:1164-1181` · AIGenerationJob (standalone, `:999-1017`) · AIUsage (userId+dayBucket unique `:629-641`) · MediaAsset (@@unique(userId,url) `:843-868`) · MediaFolder/AssetVersion · SiteVersion (@@unique(siteId,versionId) `:933-948`) · SiteComponent `:956-971` · CmsCollection/Entry (dynamic-page publish `:318-359`) · PendingUpload (10min TTL `:1236-1250`) · RateLimitBucket `:1256-1263` · CollabOperation `:1268-1280`.

## 10.6 Enum drift (all String columns, app-level enums)

| Enum | Drift |
|---|---|
| Site.status | runtime PUBLISHING exists; ⚠ `listSitesSchema.status` omits it — mid-publish unfilterable (`schemas/sites.ts:22`) |
| PublishBuildJob.status | ⚠ DEPLOYING declared everywhere, written nowhere |
| AIGenerationJob.status | `aiJobStatusSchema` = z.string() unshaped |
| businessType vs page types | different axes; pages free-form → fallback "landing" |
| Roles | EDITOR(default)/ADMIN/OWNER/VIEWER |

## 10.7 Defects (feeds §13)

1. DEPLOYING dead status; 2. PUBLISHING unfilterable; 3. AI model-tier bypass (gpt-4o-mini hardcode); 4. quota `used` misleading; 5. MVP no-op steps shown completed; 6. dev simulation can COMPLETE non-deployed site; 7. AI job stranding (no reaper); 8. summarize/milestone uncounted; 9. upload completion path historically fragile (P0-P3 codex scars; onUploadCompleted never throws → silent orphans possible).
