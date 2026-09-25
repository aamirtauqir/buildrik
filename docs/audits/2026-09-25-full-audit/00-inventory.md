# 00 — Whole-Repository Inventory & Relationship Map (Stage A)

Agent A (Audit Orchestrator) · 2026-09-25 · READ-ONLY · static reading plus the local test runs recorded in §9.
**Nothing here was checked against a running app.** There is no Postgres and no browser in this sandbox, so every "active" label below means *reachable in code* (imported, mounted, routed). It does not mean *works at runtime*.

Status legend used in the module table:
- **ACTIVE**: mounted or routed, and reachable from a UI entry point.
- **FLAGGED-OFF**: reachable only behind a flag that is off by default.
- **NO-UI**: a server half exists but no screen calls it.
- **DEAD**: nothing imports it.
- **COMPETING**: two or more implementations of the same job; the row says which one is active.

Path conventions: `E/` = `packages/editor/src/`, `D/` = `packages/dashboard/`, `S/` = `server/`.

---

## 1. Workspace / packages / entry points

| Unit | Path | Role | Entry point(s) |
|---|---|---|---|
| Root package `@buildrik/dashboard` | `package.json` | Holds all runtime deps: Next 16, tRPC 11, NextAuth 5 beta.30, Prisma 5, Stripe, OpenAI, Vercel Blob. Scripts: `test`, `audit:rules`, `env:check*`, `gate:baked-flags` | — |
| Dashboard (Next App Router) | `D/` | Pages, API routes, emails, middleware | `D/app/layout.tsx`, `D/middleware.ts` (matcher: `/api/*`, `/auth/*`, `/dashboard/*`, `/onboarding/*`) |
| Editor `@buildrik/editor` | `E/` | Vite app, also bundled into Next through `transpilePackages` | Shipping mount: `D/app/edit/[siteId]/page.tsx` → `D/components/editor-route/EditorClient.tsx` → `E/editor/shell/AquibraStudio.tsx`. The standalone port-5050 demo is dev-only. |
| Shared `@buildrik/shared` | `packages/shared/schemas/*` (33 schema files) | Zod SSOT, API client types | `packages/shared/index.ts` |
| Server | `S/trpc/{trpc,router,guards,require-workspace,workspace-ctx}.ts`, `S/trpc/routers/*` (33), `S/services/*` (71) | tRPC plus business logic | `D/app/api/trpc/[trpc]/route.ts` |
| Lib | `lib/` | prisma singleton, encryption, publish-html/files/forms, sanitize-blocks, url-guard, cron-auth, SSE hooks, tRPC client | — |
| DB | `prisma/schema.prisma` (1566 lines, **67 models**, 56 migrations; latest `20260914120000_settings_s3_redirects`) | Postgres | — |
| Auth | `S/auth.ts`, `S/auth.config.ts` | Google and GitHub OAuth only. Deliberately no Credentials provider in NextAuth; password login goes through the `auth.login` tRPC procedure and then `api/auth/create-session`. | `D/app/api/auth/[...nextauth]` |
| CI | `.github/workflows/dashboard-tests.yml` (root vitest + Playwright `e2e/dashboard.spec.ts`), `editor-ci.yml` (vite build, DS gates, lint, vitest, parity/target-size Playwright), `editor-dashboard-build.yml` (`next build`) | Editor `tsc` is not a CI step (a `gate:tsc` baseline script exists) | — |
| Hooks | `packages/editor/scripts/hooks/pre-push` | Local gates. CLAUDE.md says `gate:figma` was wired into it on 2026-08-19. | — |
| Deploy | Production is **cPanel/Passenger**, not Vercel (CLAUDE.md, `docs/cpanel-deploy.md`) | `vercel.json` holds 18 crons. `docs/cpanel-deploy.md:182` says "15 routes" and lists 2 of them. | See §6 |
| Audit tooling | `scripts/audit/{rule-drift-scan,event-graph,link-audit}.mjs`, `D/scripts/check-trpc-orphans.mjs` | Read-only scanners; results in §9 | — |

### Dashboard route inventory (`D/app`)
- **auth/** (33 pages): login, signup, 2FA, magic-link, invite, join-workspace, workspace-select/setup, 11 error pages.
- **dashboard/**: home, projects, activity, notifications, media, templates(+[id]), marketplace, learn, help(+[slug]), resources, getting-started.
  - `sites/new` and `sites/[id]/` with the tabs overview, settings, seo, domains, redirects, access, analytics, feedback, publish.
  - `settings/` with the tabs profile, account, security, workspace, team, billing, plans, usage, notifications, ai, api-tokens, integrations(+vercel-team-picker), domains, danger.
  - `agency/(tabs)/` with the tabs index, handover, library, partner, reviews, theme, plus `agency/[id]`.
- **onboarding/**: path, workspace, site, blank, template(+preview/selected), ai/{goal,basics,brand,generating,preview}, ready.
- **Public or token routes**: `review/[token]` (client review), `share/[token]` (draft share), `transfer/accept`, `privacy`, `terms`, `maintenance`.
- **`dev/states`**: a static gallery with no data. It has no `NODE_ENV` guard, so it ships to production (P3).
- **edit/[siteId]**: the editor mount, protected server-side by `userCanEditSite` (`D/app/edit/[siteId]/page.tsx:21`).
- **api/** has no pages:
  - `trpc`; `auth/{[...nextauth],create-session,logout}`
  - `collab/[siteId]/ops` (POST); `sse/{collab/[siteId],publish/[jobId],notifications}`
  - `workers/{publish,ai-generate}/[jobId]`; `cron/*` (18)
  - `webhooks/stripe`; `integrations/vercel/{authorize,callback}`
  - `asset-upload`, `upload/[fileId]`; `public/forms/[siteId]/[formBlockId]`, `public/track/[siteId]`
  - `share/[token]/verify-password`, `site-thumbnail/[siteId]`

---

## 2. Auth / roles model

- **Roles**: `VIEWER(0) < EDITOR(1) = DESIGNER(1) < ADMIN(2) < OWNER(3)`, defined in `S/services/permission.service.ts:4-11`.
- **Workspace-level role**: held on `WorkspaceMember.role`.
- **Per-site scoping**: `SitePermission` rows, one per allowed site, with an optional `roleOverride`. A member who has any rows can reach only those sites; ADMIN and OWNER are never scoped. Implemented in `resolveSiteScope` (`permission.service.ts:47`).
- **Service API** (`permission.service.ts`): `assertSiteAccess` (read access, including VIEWER), `getEffectiveSiteRole`, `checkSiteRole(minRole)`, `checkWorkspaceRole`.
- **tRPC guards** (`S/trpc/guards.ts`):
  - `guardSiteAccess` and `guardSiteRole` translate `PermissionError` into `TRPCError`.
  - `requireAgencyLayer` gates on the workspace flag `agency_layer`.
- **Procedure types** (`S/trpc/trpc.ts`):
  - `protectedProcedure`: cookie session only; bearer tokens are denied.
  - `scopedProcedure(scope)`: accepts API bearer tokens with the named scope; an invalid bearer fails closed.
  - `createRateLimitedProcedure(n, ms)`: public, keyed on IP + path through `rate-limiter`.
- **Duplicated authz lookups**: routers repeat inline `workspaceMember.findFirst` checks in `api-tokens.ts:24`, `integrations.ts:31`, `sites.ts:665,682`, `site-detail.ts:169,237` and `dashboard.ts:31,97`. Permission logic therefore has more than one source (→ Agent F).
- **Editor-side role**: `E/services/RoleService.ts` calls `sites.myRole`, consumed by `E/editor/shell/hooks/useEditorRole.ts`. This is a UX gate only; the server re-checks.
- **External identities**:
  - `Reviewer` model: account-less client reviewers who authenticate by review token.
  - `ShareLink`: draft share links, optionally password-protected.
  - `Invite`: accepted through `auth.acceptInvite`; expired by `cron/invite-expiry`.
  - `WorkspaceTransfer`.

---

## 3. Feature flags

| Flag | Kind / where read | Default | Gates | Status |
|---|---|---|---|---|
| `NEXT_PUBLIC_FEATURE_PUBLISH` / `VITE_FEATURE_PUBLISH` | Build-time; `E/shared/utils/runtimeEnv.ts:88` → `featureFlags.ts` `publish` | off | Publish button in `StudioHeader.tsx:220`; `onVercelPublish` in `TabRouter.tsx:210` | Must be baked at `next build` |
| `NEXT_PUBLIC_FEATURE_DS_AI` / `VITE_…` | Build-time; `runtimeEnv.ts:91` | off | AI assist in Brand `DesignSystemTab.tsx:923`; `useComposerInit.ts:132` aiClient | — |
| `NEXT_PUBLIC_FEATURE_COLLAB` / `VITE_…` | Build-time; `runtimeEnv.ts:98` | off (CLAUDE.md: "never in production") | "Start collaboration" in `StudioHeader.tsx:225,848` and the ⌘⇧P command `start-collab` (`useCanvasCommandPalette.ts:326`) | **FLAGGED-OFF.** The whole collab stack is reachable only through these two entries. |
| `NEXT_PUBLIC_UNIFIED_EDITOR` | Build-time; `D/components/editor-route/unified-flag*.ts`, `EditorLink.tsx` | must be `true` | `/edit/:id` versus the legacy `NEXT_PUBLIC_EDITOR_URL` demo | — |
| `NEXT_PUBLIC_FEATURE_COMPONENTS_V2` | — | — | Deleted 2026-08-16. Only a comment remains at `TabRouter.tsx:181`. | DEAD, correctly removed |
| `?rail=` query → `editorViewMode.railMode` | Runtime URL param; `E/shared/utils/editorViewMode.ts:79-88` | `"figma"` | Three rail renderers in `LeftSidebar.tsx:653-659`: `figma` (default, 6 items), `e3` (4-tool), and legacy zone | COMPETING: `figma` is active; `e3` and zone are reachable only by URL param |
| Workspace flag `agency_layer` | Runtime DB (`WorkspaceFeature`); `S/services/feature-flag.service.ts`, `guards.ts:requireAgencyLayer` | off | clients, reviews, theme, handover, dashboard.partner, `/dashboard/agency/*` | Toggled from `features.set` (settings `agency-layer-toggle.tsx`) |
| Workspace flag `client_mode` | Declared in `packages/shared/schemas/feature-flags.ts` `FEATURE_KEYS` | off | **Nothing reads it.** Only a test calls `isFeatureEnabled(…,"client_mode")`. | Stale flag (P3) |
| `PUBLISH_ALLOW_SIMULATION` | Server env; `publish.service.ts` | unset | Fake publish path | Must never be set in production |
| `IS_DEV_BUILD` | `runtimeEnv.ts:95` | — | Dev-only UI | — |

---

## 4. Backend: tRPC router → service map

Aggregated in `S/trpc/router.ts`: 33 routers and **286 procedures**. `gate:trpc-orphans` reports 29 procedures with no caller; all 29 are allowlisted with reasons (§9).

| Router (key) | Procedures (abridged) | Service(s) | Main consumers |
|---|---|---|---|
| `auth` | login, logout, getInviteDetails, acceptInvite, declineInvite | auth, token, turnstile, audit, activity-log, notification.trigger, rate-limiter | `D/app/auth/*` |
| `account` | profile/2FA/sessions/loginHistory/prefs/workspace/sharing/aiCredits/deletion/exportData | account, integrations, workspace-settings, workspace-transfer, permission | `D/app/dashboard/settings/*`; editor `account.profile.get` |
| `dashboard` | stats, recentSites*, attentionQueue, activity, health, usage, partner, quickActions* | dashboard, partner, usage (plus direct Prisma) | Dashboard home, `/dashboard/activity` |
| `sites` | list/get/create/rename/duplicate/archive/unarchive/delete/bulk/myRole/checkSlug/transfer/**saveProject**/prePublishChecks/**publish**/publishStatus/cancelPublish/schedule*/unpublish/publishHistory/publishDiff/**rollback**/saveProjectData*/getProjectData*; folders.{list,create,delete,rename,moveSite} | sites, publish, scheduled-publish, folder, site-quota, activity-log | Dashboard sites; editor `BuildrikSyncProvider`, `PublishService`, `RoleService` |
| `siteDetail` | overview, settingsOverview, locales, settings.{get,update}, redirects.*, domains.*, shareLinks.*, analytics, analyticsStatus | site-detail, site-settings, domain, redirect, share-link, analytics | **Two UIs**: dashboard `sites/[id]/*` tabs **and** editor Settings screens (`E/editor/sidebar/tabs/settings/screens/*`) |
| `pages` | list, get, create*, update*, delete, get/set/removeTranslation* | page | Editor `BuildrikSyncProvider` (`pages.list`) only. Page CRUD really goes through `sites.saveProject` → `saveProjectData` (`sites.service.ts:594`), which upserts/deletes `Page` rows. |
| `cms` | collections.{list,upsert,delete}, dynamicPages*, generateDynamicPages*, entries.{list,upsert,delete} | cms | `E/services/cmsSync.ts`, `E/engine/cms/RepeaterRenderer.ts` |
| `media` | folders CRUD, assets CRUD/move, asset versions, generateAltText, checkStorageQuota, searchStockPhotos/Videos | media, media-folder, alt-text, stock | Editor `AssetUploadService`, `MediaVersionService`, `AltTextService`, `StockService`; dashboard `components/media/media-library.tsx` |
| `upload` | presign, confirm, limits* | upload | Plus REST `api/asset-upload`, `api/upload/[fileId]` (Vercel Blob) |
| `ai` | content, page, layout, summarize, milestoneSuggest, getQuotaStatus*, **streamPrompt** (subscription, SSE), componentSchema, logAdoption | ai, quota, ai-adoption | Editor `AiTrpcClient`, `useStreamPrompt` (httpSubscriptionLink), `useAutoMilestone`, `useAISummary` |
| `actions` | propose, confirm | ai-actions, action-confirmation, rate-limiter | Editor `useAiActionGate` |
| `templates` | list, cloneFromSite*, get, use, applyToSite, create, status, cancel | template, ai-generation, site-quota | Dashboard templates and onboarding |
| `userTemplates` | upsert, list, delete* | user-template | Editor `templateSync.ts` |
| `siteVersions` | create, list, get, delete | site-version | Editor `versionSync.ts` |
| `siteComponents` | upsert, list, get, delete, workspaceList/Rename/Delete, usage* | site-component | Editor `componentSync.ts`; dashboard `components/library` |
| `comments` | create, list, workspaceList, reattach, resolve | comment | Editor `ReviewService.ts` (CommentLayer); dashboard `components/comments` |
| `reviews` | submit, list, status, resolve, currentRound, rounds, approvedSnapshot, revoke | review, activity-log, feature-flag | Editor `ReviewService.ts`; dashboard `components/reviews` |
| `clientReview` (public, rate-limited) | get, comments, identify, comment, resolve | client-review | `D/app/review/[token]` |
| `notifications` | list, unreadCount, markRead, markAllRead, delete, muteType, recent, listGrouped | notification | Editor `NotificationService.ts` → `shell/NotificationPanel.tsx`; dashboard `components/notifications/*` plus SSE `api/sse/notifications` |
| `team` | stats, list, auditLog*, invite, changeRole, revoke, reactivate, delete, pendingInvites, revokeInvite, resendInvite, activity | team, activity-log | `D/app/dashboard/settings/team` |
| `billing` | overview, plans, usage*, invoices, createCheckoutSession, createPortalSession, cancel, reactivate | billing (Stripe) | Settings billing/plans |
| `theme` | getShared, targets, capture, setLock, push, previewPush, rollback, snapshots; presets.* (NO-UI) | theme | Dashboard agency theme |
| Others | `forms` (form-submission), `onboarding`, `help`, `learn`, `marketplace`, `apiTokens`, `integrations.vercel` (direct Prisma), `webhooks` (webhook), `features`, `clients`, `handover` | — | — |

\* = allowlisted orphan (no caller).

**Non-tRPC server entry points**:
- **SSE**: `api/sse/collab/[siteId]`, `api/sse/publish/[jobId]` (`lib/hooks/use-publish-sse.ts`), `api/sse/notifications` (`lib/hooks/use-notification-sse.ts`).
- **Workers**, self-invoked by `fetch`:
  - `publish.service.ts:155` → `api/workers/publish/[jobId]`
  - `ai-generation.service.ts:101` → `api/workers/ai-generate/[jobId]`
  - Both are authenticated by `lib/cron-auth.ts`.
- **Webhook**: `api/webhooks/stripe` (raw HMAC) → `stripe-webhook.service.ts`.
- **Cron**: 18 routes under `api/cron/*`, all guarded by `lib/cron-auth.ts`. Most query Prisma inline with no service; only billing-*, ssl-check, scheduled-publish import services.

**Layer violations seen while mapping** (→ Agent E):
- Routers query Prisma directly: `integrations.ts` imports `@/lib/prisma`, and so do `api-tokens.ts`, `marketplace.ts` and `pages.ts`; `ctx.prisma.*` queries appear in sites, site-detail and dashboard.
- `S/trpc/routers/ai.ts` imports `../../services/*`, which breaks the `../../` rule.

---

## 5. Product module → files map

| Module | UI entry (editor unless noted) | State / hook | Client service → tRPC | Server service / models | Status |
|---|---|---|---|---|---|
| **Add** | Rail `add` → `E/editor/sidebar/tabs/build/BuildTab.tsx`; also `canvas/controls/BlockPickerModal.tsx`, which embeds `sidebar/tabs/ElementsTab.tsx`; `CanvasEmptyCTA.tsx` | `shell/hooks/useBlockInsertion.ts`, `tabs/elements/useElementsState.ts` | local (engine `elements`, `blocks/`) | — (goes into project JSON) | ACTIVE. COMPETING: two insert surfaces, BuildTab drawer and BlockPickerModal. |
| **Layers** | Rail `layers` → `tabs/layers/LayersTab.tsx`; `shell/StructurePopover.tsx` (footer "structure", E3 target) | `canvas/hooks/useComposerSelection.ts`, engine `SelectionManager.ts` | local | — | ACTIVE (panel and popover both mounted) |
| **Pages** | Rail `pages` → `tabs/pages/PagesTab.tsx` (+`page-settings/`, `usePages.ts`, `useFolders.ts`); topbar `shell/PageTabBar.tsx` | engine `routing/`, `usePages` | `BuildrikSyncProvider` → `sites.saveProject` (pages inside project) and `pages.list` | `sites.service.saveProjectData` → `Page` | ACTIVE. `pages.create/update` tRPC are NO-UI; the i18n translations are NO-UI. |
| **Media Quick** | Rail `assets` → `tabs/media/MediaTab.tsx` (+`AssetDetailOverlay` → `media/OptimizationPanel.tsx`) | `tabs/media/hooks/*` (`useLibraryState`, `useMediaState`, `useServerStorageQuota`) | `AssetUploadService`, `MediaVersionService`, `AltTextService`, `stock/StockService` → `media.*`; REST `api/asset-upload` | media, media-folder, alt-text, stock, upload → `MediaAsset`, `MediaFolder`, `MediaAssetVersion`, `PendingUpload` | ACTIVE |
| **Full Media** | `sidebar/FullPageRouter.tsx:20` "assets" → `media/LibraryManager.tsx` (1199 lines); **also** the `media/MediaLibraryPanel.tsx` modal via `shell/StudioModals.tsx:15`; **dashboard** `/dashboard/media` → `D/components/media/media-library.tsx` | `shell/hooks/useMediaManager.ts` | same `media.*` | same | ACTIVE. COMPETING: three full-library surfaces (LibraryManager full page, MediaLibraryPanel modal, dashboard media page). |
| **CMS** | Rail `content` (label "CMS") → `tabs/content/ContentTab.tsx`; `shell/modals/CMSRecordsModal.tsx`, `CMSCollectionSetupModal.tsx`; `canvas/hooks/useCMSPreview.ts` | engine `cms/` (CollectionManager has its own emitter) | `E/services/cmsSync.ts`, `shell/hooks/useCmsSync.ts` → `cms.collections/entries.*` | cms → `CmsCollection`, `CmsEntry` | ACTIVE. Dynamic pages are NO-UI (`cms.dynamicPages`, `generateDynamicPages`). |
| **Components** | Off-rail: shortcut ⇧A and ⌘K → `sidebar/tabs/ComponentsTab.tsx` (+`component-library/*`); `shell/modals/CreateComponentModal.tsx`; catalog in `editor/components-catalog/*`; **dashboard** `/dashboard/agency/library` → `components/library/library-panel.tsx` | `component-library/useComponentsState.ts`, engine `components/` | `E/services/componentSync.ts`, `useComponentSync.ts` → `siteComponents.*` | site-component → `SiteComponent` | ACTIVE, off-rail. V2 panel deleted. |
| **Brand** | Rail `design` (label "Brand") → `E/editor/design-system/ui/DesignSystemTab.tsx` (989 lines) | `design-system/state`, engine `designSystem/` | project styles through the save path; DS-AI through `ai.*` (flag) | `Site.projectStyles`; agency theme push = `theme.*` → `SiteThemeSnapshot`, `WorkspacePreset` | ACTIVE (AI part FLAGGED-OFF) |
| **Inspector** | `E/editor/inspector/ProInspector.tsx` (634), mounted in `shell/StudioPanels.tsx:24`; `sections/`, `tabs/`, `renderer/` | `inspector/hooks` | local | — | ACTIVE |
| **Selected-element AI** | `canvas/controls/AiPromptPopover.tsx` inside `UnifiedSelectionToolbar.tsx:15`; the ✨ entry | `tabs/ai/hooks/useAIScope.ts`, `runPromptOnce.ts` | `ai.streamPrompt` (intent `style-command`) | ai, quota → `AIUsage` | ACTIVE |
| **AI generation / chat** | Off-rail `ai` → `tabs/ai/AITab.tsx` (+`useAgentRunner`, `AgentPlan`); onboarding AI `D/app/onboarding/ai/*` → `templates.create` / ai-generation worker | `useStreamPrompt.ts` (tRPC SSE subscription, `RECONNECT_BUDGET=2`) | `AiTrpcClient.ts`, `subscriptionClient.ts`, `actions.propose/confirm` | ai, ai-generation, ai-actions, action-confirmation, openai.client, ollama.client → `AIGenerationJob`, `ActionConfirmation`, `AiAdoptionEvent` | ACTIVE. Rail "AI" was removed; reached through ✨ and ⌘K. |
| **Review** | Off-rail `review` → `tabs/review/ReviewTab.tsx` (1071); `shell/ReviewBar.tsx`, `SendForReview.tsx`, modals `ReviewSentModal`, `StaleApprovalModal`; **dashboard** `components/reviews/*` (agency/reviews, site feedback); **external** `D/app/review/[token]` | — | `E/services/ReviewService.ts` → `reviews.*`, `comments.*` | review, client-review, publish-approval → `ReviewRequest`, `Reviewer`, `Comment` | ACTIVE. Server-side it is gated on `agency_layer`. |
| **Comments** | `canvas/comments/CommentLayer.tsx` (mounted `Canvas.tsx:806`); dashboard `components/comments/comment-queue.tsx` | `commentAnchors.ts` | `ReviewService` → `comments.create/list/reattach/resolve` | comment → `Comment` | ACTIVE |
| **Mentions** | None | — | — | `notifications.list` has a `filter:"mentions"`, but `MENTION_NOTIFICATION_TYPES` (`packages/shared/schemas/notifications.ts:13`) lists SECURITY_* and PAYMENT_FAILED types, not @mentions | **NOT IMPLEMENTED**, and the "Mentions" filter is mislabelled (→ B/D) |
| **Issues** | `shell/IssuesPanel.tsx`, mounted `AquibraStudio.tsx:618` | `shell/hooks/useStudioState.ts` (`Issue`); DS-lint via `designSystem.applyAutoFix` | local | — | ACTIVE (DS-lint only; broken-link and alt producers noted as "as they land") |
| **History / versions** | Off-rail `history` → `tabs/history/HistoryTab.tsx` (441) → `panels/VersionHistoryPanel.tsx` + `panels/version-history/*` + `components/ActivityView.tsx` (local undo timeline); `PublishHistory.tsx`, `PublishDiffView.tsx` | engine `VersionTimelineManager.ts` (1058), `storage/VersionHistoryStorage.ts` (IndexedDB), `useVersionSync.ts` | `E/services/versionSync.ts` → `siteVersions.*`; `sites.publishHistory/publishDiff/rollback` | site-version, publish → `SiteVersion`, `PublishBuildJob` | ACTIVE. Two stores: IndexedDB and server `SiteVersion`. |
| **Undo / redo** | Keyboard (`useEditorShortcuts`), toolbar | engine `HistoryManager.ts` (813). `recordChange` hands the patch to `OTEngine.createOperation` when collab is connected (`HistoryManager.ts:323-327`); `applyRemoteOperation` exists | — | — | ACTIVE |
| **Activity** | **Two meanings.** Editor `ActivityView` is the undo timeline. Dashboard `/dashboard/activity` is the server `ActivityLog` (`dashboard.activity`); settings/team has `team.activity`. | — | — | activity-log, audit → `ActivityLog`, `AuditLog` | ACTIVE. Naming collision (→ B). |
| **Publish** | Topbar Publish (`StudioHeader.tsx`, flag) → `tabs/publish/PublishTab.tsx` (941) + `PublishWizard.tsx`; modals `PublishGateModal`, `PublishConfirmModal`; **dashboard** `sites/[id]/publish` + `components/publish/*` | `shell/hooks/usePublishJob.ts`, `usePublishOutcomeFlash.ts`, `tabs/publish/usePublishSnapshot.ts` | `E/services/PublishService.ts` → `sites.prePublishChecks/publish/publishStatus/cancelPublish/unpublish` | publish, scheduled-publish, publish-approval, vercel-oauth, `lib/publish-*.ts`; worker `api/workers/publish`; SSE `api/sse/publish` → `PublishBuildJob`, `ScheduledPublish`, `WorkspaceIntegration` | ACTIVE (editor side flag-gated). COMPETING: editor and dashboard publish surfaces. |
| **Notifications** | Editor `shell/NotificationPanel.tsx` (StudioHeader:862), polling; dashboard `components/notifications/*` + `/dashboard/notifications` with SSE | — | `E/services/NotificationService.ts` → `notifications.recent/unreadCount/markRead/markAllRead` | notification, notification.trigger → `Notification`, `NotificationPref` | ACTIVE. Two clients with different transports. |
| **Settings (site)** | Off-rail `settings` (fullpage) → `sidebar/FullPageRouter.tsx:105` → `tabs/settings/SettingsTab.tsx` (726) + `screens/*` (Overview, SiteSettings, SEO, Domains, Redirects, Localization, Headers, Analytics, Forms, Webhooks, Integrations, Advanced, Locked); **dashboard** `sites/[id]/{settings,seo,domains,redirects,access,analytics}` | `tabs/settings/hooks` | direct `siteDetail.*`, `forms.*`, `webhooks.*` | site-settings, site-detail, domain, redirect, form-submission, webhook → `Site`, `Domain`, `DnsRecord`, `Redirect`, `FormBlock`, `FormSubmission`, `WorkspaceWebhook` | ACTIVE. COMPETING: editor and dashboard site-settings UIs share one backend. |
| **Settings (workspace/account)** | Dashboard `/dashboard/settings/*` only | — | `account.*`, `team.*`, `billing.*`, `apiTokens.*`, `integrations.vercel.*`, `features.*` | — | ACTIVE |
| **Templates** | Off-rail `templates` (T / Pages "From template") → `tabs/templates/TemplatesTab.tsx` + `TemplatePreviewModal`; FullPageRouter "templates"; **dashboard** `/dashboard/templates`, onboarding template | `useTemplateManager.ts`, `templatesStorage.ts` | `E/services/templateSync.ts` → `userTemplates.*`; dashboard `templates.*` | template, user-template → `Template`, `TemplateVersion`, `UserTemplate` | ACTIVE. "Save site as template" (`templates.cloneFromSite`) is NO-UI. |
| **Search / command palette** | **Editor, two palettes**: `shell/modals/CommandPalette.tsx` (674, ⌘K, StudioHeader:871) and `canvas/controls/CommandPalette.tsx` (501, ⌘⇧P, `Canvas.tsx:857` via `useCanvasCommandPalette.ts`). **Dashboard**: `components/search/command-palette.tsx` (`sites.list`, `team.list`, `help.search`, `features.list`). Local searches in the Settings `searchIndex.ts`, Media, Templates and similar. | `shell/modals/commandRecents.ts` | — | — | ACTIVE. COMPETING: two editor palettes. |
| **Collaboration** (live) | "Start collaboration" `StudioHeader.tsx:542,848` (FLAG); presence `editor/collaboration/PresenceIndicators.tsx` (`toPresenceUsers` → header); `canvas/hooks/useCollaboration.ts`, `useCursorSync.ts` (50 ms throttle) | engine `collaboration/{CollaborationManager,OTEngine,OTTypes,SSETransport}.ts`, `Composer.ts:277` | POST `api/collab/[siteId]/ops` plus EventSource `api/sse/collab/[siteId]` | `collab.service.ts` → `CollabOperation` | **FLAGGED-OFF.** See §7. |
| **Invitations / roles / sharing** | Dashboard `settings/team` (`components/team/invite-modal.tsx`, `members-table.tsx`, `pending-invites.tsx`); `auth/invite`, `auth/join-workspace`; site `access` tab; `share-draft-modal.tsx` → `/share/[token]` | — | `team.*`, `auth.acceptInvite`, `siteDetail.shareLinks.*`, `account.workspace.sharing` | team, share-link, permission → `Invite`, `WorkspaceMember`, `SitePermission`, `ShareLink`, `WSSharingSettings`, `WorkspaceTransfer` | ACTIVE, dashboard only (no in-editor invite or share) |
| **Autosave** | `SaveStatus.tsx` chip, `RecoveryBanner.tsx`, `ConflictModal.tsx`, `SessionExpiredModal.tsx` | `useComposerInit.ts:~500-666` (debounce `THRESHOLDS.AUTOSAVE_DEBOUNCE=1000ms`, `config.ts:113`); `useSaveCallback.ts` (manual; outcomes saved/queued-offline/conflict/error); `syncRetryQueue.ts`; `unsavedRecovery.ts`; engine `recovery/RecoveryManager.ts`; `storage/StorageAdapter.ts` (local) | `BuildrikSyncProvider.saveProject` → `sites.saveProject` with `expectedLastEditedAt` optimistic concurrency (`BuildrikSyncProvider.ts:415`, `SAVE_CONFLICT` → `buildrik:save-conflict` event) | `sites.service.saveProjectFromEditor:489` → `saveProjectData:594` (whole-project overwrite of Site JSON + Page rows) | ACTIVE |
| **Onboarding (editor)** | `E/editor/onboarding/useOnboardingOrchestrator.ts` | — | `onboarding.getState/completeEditorTask` | onboarding → `OnboardingState` | ACTIVE |
| **Agency layer** | Dashboard `agency/(tabs)/*`, `components/{clients,handover,theme,library}` | — | `clients.*`, `handover.*`, `theme.*`, `dashboard.partner` | clients, handover, theme, partner → `Client`, `SiteThemeSnapshot` | FLAGGED-OFF (`agency_layer`) |

**Editor rail as rendered** (default `railMode=figma`, `tabsConfig.ts:359`): Add · Layers · Pages · Assets · CMS(`content`) · Brand(`design`).

Off-rail tabs and their entries (`tabsConfig.ts:338-352`):
- `ai`: ✨ / ⌘K
- `templates`: T / Pages
- `components`: ⇧A / ⌘K
- `settings`: site menu
- `publish`: topbar
- `history`: site menu
- `review`: ReviewBar / site menu

**Editor ↔ server transport**:
- tRPC client: `E/services/api-client.ts` (`${DASHBOARD_URL}/api/trpc`).
- `ai.summarize` and `ai.milestoneSuggest` are called by raw `fetch("/api/trpc/…")`.

**Event bus** (`scripts/audit/event-graph.mjs`):
- 309 events declared; 81 are never named in code.
- 123 "strong orphans": emitted, with no listener.
- 7 modules are isolated from the composer bus: engine:collaboration, drag, fonts, forms, interactions, templates, and panel:content. The tool itself says an isolated module can still be wired through direct method calls, so this is a lead to check (→ Agents E/G).

---

## 6. Workers / cron / webhooks

| Route | Schedule (vercel.json) | Auth | Service |
|---|---|---|---|
| cron/scheduled-publish | */5 min | cron-auth | publish, scheduled-publish |
| cron/dns-verify | */5 min | cron-auth | inline Prisma |
| cron/billing-dunning, billing-downgrade | daily | cron-auth | email / billing |
| cron/ssl-check | daily | cron-auth | email |
| cron/{session,invite,token,workspace-transfer,account-deletion,publish-job,ai-job}-*, soft-delete-purge, analytics-purge/aggregate, form-submission-purge, ip-anonymization, ephemeral-purge | various | cron-auth | inline Prisma |
| workers/publish/[jobId] | fire-and-forget fetch from `publish.service.ts:155` | cron-auth | publish, site-settings, marketplace, activity-log, notification.trigger |
| workers/ai-generate/[jobId] | from `ai-generation.service.ts:101` | cron-auth | ai |
| webhooks/stripe | Stripe push | raw HMAC + 5-minute replay window | stripe-webhook |

**Production scheduling is NOT VERIFIED.** Production runs on cPanel, where `vercel.json` crons do nothing. `docs/cpanel-deploy.md:182-192` tells operators to add "15 routes" by hand but lists only 2, while `vercel.json` has 18. Whether scheduled publish, dunning and the purge crons actually run in production cannot be seen from the repo (→ Agent G/F; possible P1 if missing).

---

## 7. Collaboration tech summary (read from code, not from comments)

- **Transport**: a custom DB-backed op log. There is no WebSocket, Yjs, Automerge or Liveblocks.
  - Outbound: `SSETransport.send` makes a fire-and-forget `fetch POST /api/collab/:siteId/ops` (`E/engine/collaboration/SSETransport.ts:90-99`). On failure, `catch(() => {})` drops the op.
  - Server: `appendCollabOp` inserts a `CollabOperation` row with a global autoincrement `seq` (`S/services/collab.service.ts:21`). Every 50th seq it prunes ops older than 24h.
  - Inbound: an `EventSource` on `/api/sse/collab/:siteId?since=seq`. The route polls the DB every **1500 ms** (`D/app/api/sse/collab/[siteId]/route.ts:66`) and sends `hello`, `op` and `resync` events. The client drops its own echoes by `clientId`.
- **Auth**:
  - Both routes check `checkSiteRole(…,"EDITOR")` **once, at connect or POST**. The SSE loop never re-checks, so a revoked member keeps receiving ops until they disconnect (→ Agent F/D).
  - The op payload is opaque, unvalidated JSON (`ops/route.ts:30`), apart from the non-null checks on `clientId` and `op`.
- **Conflict model**: `OTEngine.ts` does JSON-Patch path transforms against pending local ops. `CollaborationManager.ts` (825 lines) owns the room, users, cursors, selection and the join/leave/sync_request broadcasts. The in-code comment (`runtimeEnv.ts:95-97`) calls it "DEMO-ONLY (last-write-wins, 6 known non-convergence P1s)".
- **Undo**: local `HistoryManager.recordChange` creates an OT op when connected (`HistoryManager.ts:323`). Remote ops come in through `applyRemoteOperation`.
- **Presence**: cursor, selection and join events use the same op log. With `useCursorSync` throttled at 50 ms, one moving user can generate up to about 20 DB inserts per second (→ Agent E/D).
- **Persistence and autosave**: independent of collab. Each client autosaves the **whole project** through `sites.saveProject` with `expectedLastEditedAt`, so two live collaborators will trip each other's `SAVE_CONFLICT`. NOT RUNTIME VERIFIED (→ D).
- **Verified wiring gap**: the server sends `event: resync` (`sse/collab route.ts:43`), but `SSETransport` registers listeners only for `hello` and `op` plus `onerror` (`SSETransport.ts:44-78`). No code in `E/` handles `resync`. Static reading of that code suggests this sequence (NOT RUNTIME VERIFIED):
  1. The server closes the stream.
  2. EventSource auto-reconnects with the same stale `since`.
  3. The server sends resync and closes again, in a loop.
  4. The client never reloads the project.

  → Agent D (flag-off in prod, so not P0).
- **Reachability**: only through `FEATURE_COLLAB`; the entries are the header button and `start-collab` in ⌘⇧P. `CollaborationManager.startSession` (`CollaborationManager.ts:192`) is the single entry point.
- **Async collaboration**, which is live in production:
  - Comments: `Comment`, anchored by `targetSelector`/x/y, with a `reviewerId` for external reviewers.
  - Review rounds: `ReviewRequest`, `Reviewer`, token links `/review/[token]`.
  - Notifications, including the dashboard's notification SSE stream.
  - Activity log, share links, invites.
- **Mentions**: no implementation (§5).
- **Tests**: about 10 unit test files mention collab. There are no multi-client, E2E or realtime tests (→ G).

---

## 8. Prisma models by domain (67)

- **Identity/auth**: User, Account, Session, VerificationToken, KnownDevice, LoginAttempt, ApiToken, RateLimitBucket, AccountDeletionReq, UserPreference, LessonProgress
- **Workspace**: Workspace, WorkspaceMember, Invite, SitePermission, WorkspaceFeature, WorkspacePreset, WorkspaceApp, WorkspaceIntegration, WSSharingSettings, WorkspaceTransfer, WorkspaceWebhook, WebhookDelivery, Referral, AuditLog, ActivityLog, Client, Folder
- **Site/content**: Site, Page, SlugHistory, Domain, DnsRecord, Redirect, ShareLink, SiteVersion, SiteComponent, SiteThemeSnapshot, CmsCollection, CmsEntry, FormBlock, FormSubmission, UserTemplate, Template, TemplateVersion
- **Media**: MediaAsset, MediaFolder, MediaAssetVersion, PendingUpload
- **Review/collab**: Comment, ReviewRequest, Reviewer, CollabOperation
- **Publish**: PublishBuildJob, ScheduledPublish, ProcessedWebhookEvent
- **Billing**: Subscription, PaymentMethod, Invoice
- **AI**: AIUsage, AiAdoptionEvent, AIGenerationJob, ActionConfirmation
- **Misc**: Notification, NotificationPref, OnboardingState, SiteAnalytics, AnalyticsEvent, HelpArticle, SupportTicket, ExportJob

**Data model notes**:
- Site content lives in two places: `Site.projectStyles/projectAssets/projectSettings` JSON, and `Page.blocks` JSON rows. Both are written together by `saveProjectData`.
- `Site.pages Int` is a denormalised counter.

---

## 9. Baseline results

All runs took place on a 4-core sandbox. **Other audit agents were running at the same time**, with load average around 5.6–6.

| Command | Result |
|---|---|
| `pnpm --filter @buildrik/editor typecheck` (`tsc --noEmit`) | **PASS**, exit 0, no errors |
| `pnpm run audit:rules` | exit 0. 7 docs checked. 1 present-tense drift: `CLAUDE.md:169 packages/dashboard/.env`, a gitignored file that cannot exist in a clean checkout, so this is expected. 23 historical/counter-example mentions. |
| `node D/scripts/check-trpc-orphans.mjs` | **PASS**: 286 procedures, 29 without a caller, all allowlisted. Four of them carry "FOUNDER DECISION" (theme presets ×4, i18n translations ×3, CMS dynamic pages ×2, cloneFromSite). |
| `node scripts/audit/event-graph.mjs` | 309 events; 123 strong orphans; 7 bus-isolated modules |
| `pnpm vitest run` (root; the include covers editor + server + lib + shared + dashboard, about 1135 test files: 903 editor + 232 others) | **TIMED OUT at the 600 s cap (exit 124)** with no summary printed, while running alongside the editor run. **I then re-ran it as `pnpm vitest run --shard=i/3` with the JSON reporter, one shard after another. Each shard finished in about 4–7 minutes and exited 1.** Totals across the three shards: **11,222 tests: 11,190 passed, 5 failed, 27 skipped/todo** (9 failed describe-suites). |
| `pnpm --filter @buildrik/editor exec vitest run` | **TIMED OUT at the 600 s cap (exit 124)**, run concurrently with the root run |
| Verbose partial run (420 s cap; the root include is a superset of the editor suite, so it covers the editor tests) | 752 test files finished before the cap: 9415 passed, 4 failed. Superseded by the sharded run above. |

**Failing tests.** The failure messages are taken from the sharded JSON run.

*Deterministic: failed in every run that reached them.*
1. `E/editor/shell/modals/__tests__/CommandPalette.test.tsx` › command list › "with a composer: exactly 21 hardcoded commands…" fails with `expected length 21 but got 23`.
2. Same file › filtering › "clearing the query restores the full list" fails with the same 21≠23 error.
3. Same file › executing › "clicking a navigation command emits UI_PANEL_OPEN…" fails with `Unable to find an element with the text: Open Insert panel`.
4. `E/editor/canvas/__tests__/CanvasEmptyCTA.test.tsx` › "Start blank opens the Insert drawer › and 'add' is still the Insert tab" does a source regex check expecting `id: "add" … label: "Insert"`. `tabsConfig.ts` now says `label: "Add"` (the v3 IA rename of 2026-09-14).

Failures 1–4 are test drift after the v3 IA relabel (Insert→Add) and 2 added ⌘K commands. This is the likely cause, but I did not root-cause it (→ Agent G).

*Flaky under load:*

5. `E/editor/sidebar/tabs/settings/screens/__tests__/RedirectsScreen.test.tsx`. A **different test** failed in different runs:
   - Concurrent runs: "a refused create stays inline in the dialog — no banner on the screen".
   - Sharded run: "the header's Add redirect → … opens the Add dialog…", with `Unable to find [data-testid="set-rd-add"]`.

   This points to a timing-sensitive or flaky test, not a stable product defect. NOT VERIFIED either way.

Other notes on the runs:
- jsdom logs `HTMLCanvasElement.getContext not implemented` many times and `navigation to another Document` once. This is noise, not failure.
- **Nothing ran against a database or a browser.** Playwright suites (`D/e2e/*`, `E/e2e/*`) were not run.

---

## 10. Competing implementations: summary for specialists

| Job | Implementations | Active |
|---|---|---|
| Rail renderer | figma (6 items) / e3 (4-tool) / legacy zone (`LeftSidebar.tsx:653`) | figma by default; the others only by `?rail=` |
| Command palette | ⌘K `shell/modals/CommandPalette.tsx`, ⌘⇧P `canvas/controls/CommandPalette.tsx`, dashboard `components/search/command-palette.tsx` | All three mounted |
| Insert / Add | `BuildTab` drawer, `BlockPickerModal`(`ElementsTab`), `CanvasEmptyCTA` | All mounted |
| Full media library | `LibraryManager` (fullpage), `MediaLibraryPanel` (modal), dashboard `media-library.tsx` | All mounted |
| Site settings UI | Editor `SettingsTab` screens vs dashboard `sites/[id]/*` tabs | Both, same `siteDetail.*` backend |
| Publish UI | Editor `PublishTab`/`PublishWizard` vs dashboard `sites/[id]/publish` | Both (editor behind flag) |
| Notifications client | Editor `NotificationPanel` (poll) vs dashboard dropdown (SSE) | Both |
| "Activity" | Editor undo timeline `ActivityView` vs server `ActivityLog` | Both; the name collides |
| Version history store | IndexedDB `VersionHistoryStorage` vs server `SiteVersion` (`versionSync`) | Both |
| Page persistence | `pages.*` tRPC vs whole-project `sites.saveProject` | `saveProject`; `pages.create/update` are orphans |
| Structure/Layers | `LayersTab` panel vs `StructurePopover` | Both mounted |

---

## 11. Overlaps (observed; for the owning specialist, not audited here)

- **D (collab)**:
  - the unhandled `resync` event (§7)
  - no permission re-check on the long-lived SSE stream
  - send failures are silently dropped
  - whole-project autosave conflicts with the op log
  - cursor ops are persisted to the DB
- **F (security)**:
  - collab SSE revocation gap, and the unvalidated opaque op JSON stored in `CollabOperation`
  - authz lookups duplicated inline in routers
  - `dev/states` route ships ungated (static, low risk)
- **E (architecture)**:
  - Prisma used directly in routers and cron routes
  - `ai.ts` uses `../../` imports
  - large files: `Composer.ts` 1225, `LibraryManager.tsx` 1199, `ReviewTab.tsx` 1071, `VersionTimelineManager.ts` 1058, `StudioHeader.tsx` 1040
  - 123 orphan bus events
- **B (IA)**:
  - the "Mentions" filter is mapped to security/payment notifications
  - the "Activity" name collision
  - two editor command palettes
  - site settings duplicated between editor and dashboard
- **G (verification)**:
  - cPanel cron coverage (18 in `vercel.json` vs "15" in the doc)
  - 4 deterministic failing unit tests plus 1 flaky file
  - the unsharded full suite does not finish inside 10 minutes under shared load
  - editor `tsc` is not in CI; `editor-ci.yml:11-13` says this is on purpose because of dashboard path-alias leakage
  - no collab or multi-user tests
