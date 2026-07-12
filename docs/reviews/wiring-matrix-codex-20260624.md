# Buildrik — Full API Wiring Matrix (codex sweep, 2026-06-24)

Independent codex read-only pass over the WHOLE codebase (not trusting prior docs).
Enumerates every tRPC `router.procedure`, its service `file:line`, its UI call-site,
and a wiring status. This is the API-level source of truth that the job-grouped
`complete-feature-list-20260623.md` summarizes.

**Status legend:** `WIRED` real end-to-end · `STUB` UI exists, backend fake/throws ·
`ORPHAN-BACKEND` server proc with no UI consumer · `ORPHAN-UI` UI/feature with
no (or browser-only) backend · `BROKEN` wired but a real runtime bug.

**Counts:** ~150 procedures · most WIRED · ~29 ORPHAN-BACKEND · ~9 STUB/fake ·
~12 editor features browser-only (data-loss). Codex session `019ef5fb-e511-7fa1-b3e3-6cf19663628f`.

---

## A. MISSING FROM THE EXISTING DOCS

`complete-feature-list-20260623.md` is feature-level, not API-level. It omits the
concrete tRPC surface almost entirely. It is also stale on at least two points:

- `/api/asset-upload` exists and is wired: `packages/dashboard/app/api/asset-upload/route.ts:1-220` creates Blob upload tokens and calls `createAsset` in `server/services/media.service.ts:120`. The earlier review claiming this route is missing is stale.
- The DNS verify cron no longer hardcodes the dead host; it compares each DNS record to that record's expected value: `packages/dashboard/app/api/cron/dns-verify/route.ts:34-41`. The earlier review claiming domains can never verify is stale against current code.

### Procedure inventory (full tRPC surface)
- `auth`: `login`, `signup`, `verifyEmail`, `resendVerification`, `forgotPassword`, `resetPassword`, `magicLink`, `verifyMagicLink`, `verify2FA`, `verifyBackupCode`, `checkEmail`, `logout`, `getInviteDetails`, `acceptInvite`, `declineInvite`
- `account`: `profile.get`, `profile.update`, `changeEmail`, `changePassword`, `setPassword`, `disconnectProvider`, `twoFactor.enable`, `twoFactor.confirm`, `twoFactor.disable`, `sessions.list`, `sessions.revoke`, `sessions.revokeAll`, `loginHistory`, `notifications.list`, `notifications.update`, `preferences.get`, `preferences.update`, `workspace.get`, `workspace.listMine`, `workspace.update`, `workspace.sharing`, `workspace.delete`, `workspace.cancelDelete`, `workspace.transfer.pending`, `workspace.transfer.initiate`, `workspace.transfer.accept`, `workspace.transfer.cancel`, `integrations.list`, `integrations.add`, `integrations.remove`, `integrations.update`, `integrations.testEvent`, `aiCredits`, `dangerZone.pendingDeletion`, `dangerZone.exportData`, `dangerZone.deleteAccount`, `dangerZone.cancelAccountDeletion`
- `actions`: `propose`, `confirm`
- `ai`: `content`, `page`, `layout`, `summarize`, `milestoneSuggest`, `getQuotaStatus`, `streamPrompt`, `componentSchema`, `logAdoption`
- `apiTokens`: `list`, `create`, `revoke`, `delete`
- `billing`: `overview`, `plans`, `usage`, `invoices`, `upgrade`, `cancel`, `switchInterval`, `reactivate`
- `clients`: `list`, `get`, `create`, `assignSite`, `update`, `delete`
- `cms`: `collections.list`, `collections.upsert`, `collections.delete`, `dynamicPages`, `generateDynamicPages`, `entries.list`, `entries.upsert`, `entries.delete`
- `comments`: `create`, `list`, `workspaceList`, `resolve`
- `dashboard`: `stats`, `recentSites`, `attentionQueue`, `activity`, `health`, `quickActions`
- `features`: `list`, `set`
- `forms`: `listBlocks`, `listSubmissions`, `updateSubmission`, `deleteSubmission`, `exportSubmissions`
- `help`: `categories`, `search`, `byCategory`, `article`, `feedback`, `createTicket`
- `integrations.vercel`: `getConnection`, `finishConnect`, `disconnect`
- `media`: `listFolders`, `createFolder`, `renameFolder`, `moveFolder`, `deleteFolder`, `listAssets`, `createAsset`, `updateAsset`, `deleteAsset`, `moveAsset`, `listAssetVersions`, `createAssetVersion`, `restoreAssetVersion`, `generateAltText`, `checkStorageQuota`
- `notifications`: `list`, `unreadCount`, `markRead`, `markAllRead`, `delete`, `muteType`, `recent`, `listGrouped`
- `onboarding`: `getState`, `selectRole`, `setupProject`, `completeStep`, `completeDashboardTask`, `dismiss`
- `pages`: `list`, `get`, `create`, `update`, `delete`, `getTranslation`, `setTranslation`, `removeTranslation`
- `reviews`: `submit`, `list`, `resolve`
- `siteDetail`: `overview`, `settings.get`, `settings.update`, `redirects.list`, `redirects.create`, `redirects.update`, `redirects.delete`, `redirects.import_csv`, `redirects.export_csv`, `domains.list`, `domains.listForWorkspace`, `domains.connect`, `domains.remove`, `domains.setPrimary`, `sharing.list`, `sharing.create`, `sharing.revoke`, `analytics`
- `sites`: `list`, `get`, `create`, `rename`, `duplicate`, `archive`, `unarchive`, `delete`, `bulk`, `checkSlug`, `transfer`, `saveProject`, `prePublishChecks`, `publish`, `publishStatus`, `cancelPublish`, `unpublish`, `saveProjectData`, `getProjectData`, `folders.list`, `folders.create`, `folders.delete`, `folders.rename`, `folders.moveSite`
- `team`: `stats`, `list`, `invite`, `changeRole`, `revoke`, `delete`, `pendingInvites`, `revokeInvite`, `resendInvite`, `activity`
- `templates`: `list`, `get`, `use`, `generate.create`, `generate.status`, `generate.cancel`
- `theme`: `getShared`, `targets`, `capture`, `setLock`, `push`
- `upload`: `presign`, `confirm`, `limits`

### Prisma models not enumerated in the master doc
- **Orphaned models (defined, no router/service usage found):** `PaymentMethod`, `TemplateVersion`
- **Write-only / internal models:** `ExportJob` (`account.service.ts:206`), `ProcessedWebhookEvent` (`webhooks/stripe/route.ts:70,109`), `PendingUpload` (`upload.service.ts:34,51,72`), `RateLimitBucket` (`cron/session-cleanup/route.ts:21`), `CollabOperation` (`collab.service.ts:24,31,39,49`), `ActionConfirmation` (`action-confirmation.service.ts:23,46`), `DnsRecord` (`domain.service.ts:110`, `cron/dns-verify/route.ts:14,64,70`)
- **Live models real but not enumerated:** `User`, `Account`, `Session`, `VerificationToken`, `Workspace`, `WorkspaceMember`, `WorkspaceFeature`, `Site`, `Page`, `Domain`, `Client`, `Folder`, `Invite`, `ShareLink`, `SitePermission`, `Subscription`, `Invoice`, `Notification`, `AIUsage`, `AiAdoptionEvent`, `NotificationPref`, `ActivityLog`, `OnboardingState`, `SiteAnalytics`, `AnalyticsEvent`, `FormBlock`, `FormSubmission`, `Template`, `MediaAsset`, `MediaFolder`, `MediaAssetVersion`, `AIGenerationJob`, `WorkspaceIntegration`, `WSSharingSettings`, `HelpArticle`, `SupportTicket`, `UserPreference`, `SlugHistory`, `WorkspaceTransfer`, `AccountDeletionReq`, `LoginAttempt`, `PublishBuildJob`, `Redirect`, `ApiToken`

---

## B. FULL WIRING MATRIX

| feature | router.procedure | service fn (file:line) | UI call-site | status |
|---|---|---|---|---|
| login | `auth.login` | `auth.service.ts:96` | `app/auth/page.tsx:68` | WIRED |
| signup | `auth.signup` | `auth.service.ts:152` | `app/auth/page.tsx:115` | WIRED |
| verify email | `auth.verifyEmail` | `auth.service.ts:181` | `app/auth/verify-email/page.tsx:24` | WIRED |
| resend verification | `auth.resendVerification` | `auth.service.ts:215` | `app/auth/verify-email/page.tsx:29` | WIRED |
| forgot password | `auth.forgotPassword` | `auth.service.ts:227` | `app/auth/forgot-password/page.tsx:19` | WIRED |
| reset password | `auth.resetPassword` | `auth.service.ts:236` | `app/auth/reset-password/page.tsx:41` | WIRED |
| magic link send | `auth.magicLink` | `auth.service.ts:255` | `app/auth/magic-link/page.tsx:19` | WIRED |
| magic link verify | `auth.verifyMagicLink` | `auth.service.ts:264` | `app/auth/callback/page.tsx:18` | WIRED |
| 2FA verify | `auth.verify2FA` | `auth.service.ts:293` | `app/auth/2fa/page.tsx:24` | WIRED |
| backup code verify | `auth.verifyBackupCode` | `auth.service.ts:347` | `app/auth/2fa/backup/page.tsx:23` | WIRED |
| email-first discovery | `auth.checkEmail` | router-direct Prisma `routers/auth.ts:159` | `app/auth/page.tsx:44` | WIRED |
| logout | `auth.logout` | router Prisma + `audit.service.ts:16` | — | ORPHAN-BACKEND |
| invite details | `auth.getInviteDetails` | router Prisma `routers/auth.ts:200` | `app/auth/invite/page.tsx:21` | WIRED |
| accept invite | `auth.acceptInvite` | router Prisma + `notification.trigger.ts:21` | `app/auth/invite/page.tsx:26` | WIRED |
| decline invite | `auth.declineInvite` | router Prisma + `audit.service.ts:16` | `app/auth/invite/page.tsx:39` | WIRED |
| account profile get | `account.profile.get` | `account.service.ts:70` | `settings/account/page.tsx:10` | WIRED |
| account profile update | `account.profile.update` | `account.service.ts:121` | `settings/page.tsx:10` | WIRED |
| account change email | `account.changeEmail` | `account.service.ts:53` | `settings/account/page.tsx:22` | WIRED |
| account change password | `account.changePassword` | `account.service.ts:8` | `settings/account/page.tsx:12` | WIRED |
| account set password | `account.setPassword` | `account.service.ts:34` | `settings/account/page.tsx:17` | WIRED |
| disconnect provider | `account.disconnectProvider` | `account.service.ts:100` | `settings/account/page.tsx:27` | WIRED |
| 2FA enable | `account.twoFactor.enable` | `account.service.ts:233` | `settings/security-tab.tsx:53` | WIRED |
| 2FA confirm | `account.twoFactor.confirm` | `account.service.ts:255` | `settings/security-tab.tsx:64` | WIRED |
| 2FA disable | `account.twoFactor.disable` | `account.service.ts:281` | `settings/security-tab.tsx:77` | WIRED |
| sessions list | `account.sessions.list` | `account.service.ts:128` | `settings/security-tab.tsx:48` | WIRED |
| revoke session | `account.sessions.revoke` | `account.service.ts:138` | `settings/security-tab.tsx:89` | WIRED |
| revoke all sessions | `account.sessions.revokeAll` | `account.service.ts:146` | `settings/security-tab.tsx:95` | WIRED |
| login history | `account.loginHistory` | `account.service.ts:155` | `settings/security-tab.tsx:49` | WIRED |
| notif prefs read | `account.notifications.list` | `account.service.ts:163` | `settings/notification-prefs.tsx:40` | WIRED |
| notif prefs write | `account.notifications.update` | `account.service.ts:169` | `settings/notification-prefs.tsx:52` | WIRED |
| site list prefs read | `account.preferences.get` | `account.service.ts:214` | `sites/page.tsx:28` | WIRED |
| site list prefs write | `account.preferences.update` | `account.service.ts:225` | `sites/page.tsx:29` | WIRED |
| workspace get | `account.workspace.get` | `workspace-settings.service.ts:4` | `dashboard/page.tsx:28` | WIRED |
| workspace list mine | `account.workspace.listMine` | `workspace-settings.service.ts:13` | `auth/workspace-select/page.tsx:22` | WIRED |
| workspace update | `account.workspace.update` | `workspace-settings.service.ts:40` | `settings/workspace/page.tsx:105` | WIRED |
| workspace sharing | `account.workspace.sharing` | `workspace-settings.service.ts:63` | `settings/workspace/page.tsx:123` | WIRED |
| workspace delete | `account.workspace.delete` | `workspace-settings.service.ts:47` | `settings/workspace/page.tsx:113` | WIRED |
| workspace cancel delete | `account.workspace.cancelDelete` | `workspace-settings.service.ts:56` | `dashboard/page.tsx:30` | WIRED |
| transfer pending | `account.workspace.transfer.pending` | `workspace-transfer.service.ts:119` | `settings/workspace/page.tsx:89` | WIRED |
| transfer initiate | `account.workspace.transfer.initiate` | `workspace-transfer.service.ts:9` | `settings/workspace/page.tsx:91` | WIRED |
| transfer accept | `account.workspace.transfer.accept` | `workspace-transfer.service.ts:56` | `transfer/accept/page.tsx:25` | WIRED |
| transfer cancel | `account.workspace.transfer.cancel` | `workspace-transfer.service.ts:106` | `settings/workspace/page.tsx:100` | WIRED |
| integrations list | `account.integrations.list` | `integrations.service.ts:16` | `settings/integrations/page.tsx:104` | WIRED |
| integrations add | `account.integrations.add` | `integrations.service.ts:22` | `settings/integrations/page.tsx:106` | WIRED |
| integrations remove | `account.integrations.remove` | `integrations.service.ts:44` | `settings/integrations/page.tsx:110` | WIRED |
| integrations update | `account.integrations.update` | `integrations.service.ts:56` | `settings/integrations/page.tsx:113` | WIRED |
| integrations test event | `account.integrations.testEvent` | `integrations.service.ts:80` | `settings/integrations/page.tsx:117` | WIRED |
| AI credits read | `account.aiCredits` | `account.service.ts:318` | `settings/ai/page.tsx:7` | WIRED |
| pending acct deletion | `account.dangerZone.pendingDeletion` | router Prisma `routers/account.ts:241` | `dashboard/page.tsx:29` | WIRED |
| export data | `account.dangerZone.exportData` | `account.service.ts:205` | `settings/danger/page.tsx:10` | WIRED (queue only) |
| delete account | `account.dangerZone.deleteAccount` | `account.service.ts:185` | `settings/danger/page.tsx:15` | WIRED |
| cancel acct deletion | `account.dangerZone.cancelAccountDeletion` | router Prisma `routers/account.ts:249` | `dashboard/page.tsx:31` | WIRED |
| action propose | `actions.propose` | `ai-actions.service.ts:67` + `action-confirmation.service.ts:23` | `editor/useAiActionGate.ts:44` | WIRED |
| action confirm | `actions.confirm` | `action-confirmation.service.ts:46` + `ai-actions.service.ts:67` | `editor/useAiActionGate.ts:69` | WIRED |
| AI content gen | `ai.content` | `ai.service.ts` | `editor/AiTrpcClient.ts:196` | WIRED |
| AI page gen | `ai.page` | `ai.service.ts` | `editor/AiTrpcClient.ts:213` | WIRED |
| AI layout gen | `ai.layout` | `ai.service.ts` | `editor/AiTrpcClient.ts:222` | WIRED |
| AI summarize | `ai.summarize` | `ai.service.ts` | `editor/useAISummary.ts:109` | WIRED |
| AI milestone suggest | `ai.milestoneSuggest` | `ai.service.ts` | `editor/useAutoMilestone.ts:174` | WIRED |
| AI quota status | `ai.getQuotaStatus` | `quota.service.ts` | — | ORPHAN-BACKEND |
| AI stream prompt | `ai.streamPrompt` | `ai.service.ts` | `editor/useStreamPrompt.ts:87` | WIRED |
| AI component schema | `ai.componentSchema` | `ai.service.ts` | `editor/useComposerInit.ts:126` | WIRED |
| AI adoption log | `ai.logAdoption` | `ai-adoption.service.ts:32` | `editor/adoptionTracker.ts:25` | WIRED |
| API token list | `apiTokens.list` | `api-token.service.ts:92` | `settings/api-tokens-tab.tsx:41` | WIRED |
| API token create | `apiTokens.create` | `api-token.service.ts:71` | `settings/api-tokens-tab.tsx:50` | WIRED |
| API token revoke | `apiTokens.revoke` | `api-token.service.ts:111` | `settings/api-tokens-tab.tsx:58` | WIRED |
| API token delete | `apiTokens.delete` | `api-token.service.ts:118` | `settings/api-tokens-tab.tsx:61` | WIRED |
| billing overview | `billing.overview` | `billing.service.ts:51` | `billing/page.tsx:82` | WIRED |
| billing plans | `billing.plans` | `billing.service.ts:249` | — | ORPHAN-BACKEND |
| billing usage | `billing.usage` | `billing.service.ts:97` | — | ORPHAN-BACKEND |
| billing invoices | `billing.invoices` | `billing.service.ts:140` | `billing/page.tsx:83` | WIRED |
| billing upgrade | `billing.upgrade` | `billing.service.ts:158` (throws `PAYMENTS_NOT_CONFIGURED:173`) | — | STUB |
| billing cancel | `billing.cancel` | `billing.service.ts:200` | `billing/page.tsx:85` | WIRED |
| billing switch interval | `billing.switchInterval` | router Prisma `routers/billing.ts:45` | — | ORPHAN-BACKEND |
| billing reactivate | `billing.reactivate` | `billing.service.ts:226` | `billing/page.tsx:94` | WIRED |
| clients list | `clients.list` | `clients.service.ts:35` | `clients/clients-view.tsx:132` | WIRED |
| clients get | `clients.get` | `clients.service.ts:103` | `clients/client-detail-view.tsx:176` | WIRED |
| clients create | `clients.create` | `clients.service.ts:54` | `clients/clients-view.tsx:137` | WIRED |
| clients assign site | `clients.assignSite` | `clients.service.ts:129` | `clients/client-detail-view.tsx:206` | WIRED |
| clients update | `clients.update` | `clients.service.ts:84` | `clients/client-detail-view.tsx:189` | WIRED |
| clients delete | `clients.delete` | `clients.service.ts:94` | `clients/clients-view.tsx:153` | WIRED |
| CMS collections list | `cms.collections.list` | `cms.service.ts:25` | `editor/cmsSync.ts:36` | WIRED |
| CMS collections upsert | `cms.collections.upsert` | `cms.service.ts:34` | `editor/cmsSync.ts:78` | WIRED |
| CMS collections delete | `cms.collections.delete` | `cms.service.ts:62` | `editor/cmsSync.ts:102` | WIRED |
| CMS dynamic pages resolve | `cms.dynamicPages` | `cms.service.ts:152` | — | ORPHAN-BACKEND |
| CMS dynamic pages generate | `cms.generateDynamicPages` | `cms.service.ts:187` | — | ORPHAN-BACKEND |
| CMS entries list | `cms.entries.list` | `cms.service.ts:78` | `editor/cmsSync.ts:57` | WIRED |
| CMS entries upsert | `cms.entries.upsert` | `cms.service.ts:83` | `editor/cmsSync.ts:113` | WIRED |
| CMS entries delete | `cms.entries.delete` | `cms.service.ts:104` | `editor/cmsSync.ts:130` | WIRED |
| comments create | `comments.create` | `comment.service.ts:21` | `comments/comment-preview.tsx:42` | WIRED |
| comments list | `comments.list` | `comment.service.ts:41` | `comments/comment-preview.tsx:40` | WIRED |
| comments workspace list | `comments.workspaceList` | `comment.service.ts:59` | `comments/comment-queue.tsx:22` | WIRED |
| comments resolve | `comments.resolve` | `comment.service.ts:78` | `comments/comment-queue.tsx:28` | WIRED |
| dashboard stats | `dashboard.stats` | `dashboard.service.ts:10` | `dashboard/page.tsx:23` | WIRED |
| dashboard recent sites | `dashboard.recentSites` | `dashboard.service.ts:106` | `dashboard/page.tsx:24` | WIRED |
| dashboard attention queue | `dashboard.attentionQueue` | `dashboard.service.ts:391` | `dashboard/needs-attention.tsx:17` | WIRED |
| dashboard activity | `dashboard.activity` | `dashboard.service.ts:129` | `dashboard/page.tsx:25` | WIRED |
| dashboard health | `dashboard.health` | `dashboard.service.ts:334` | `dashboard/page.tsx:26` | WIRED |
| dashboard quick actions | `dashboard.quickActions` | `dashboard.service.ts:218` | `dashboard/page.tsx:27` | WIRED |
| feature flags list | `features.list` | `feature-flag.service.ts:29` | `dashboard/sidebar.tsx:30` | WIRED |
| feature flags set | `features.set` | `feature-flag.service.ts:48` | `onboarding/setup/page.tsx:11` | WIRED |
| form blocks list | `forms.listBlocks` | `form-submission.service.ts:112` | `editor/FormsScreen.tsx:86` | WIRED |
| form submissions list | `forms.listSubmissions` | `form-submission.service.ts:78` | `editor/FormsScreen.tsx:111` | WIRED |
| form submission update | `forms.updateSubmission` | `form-submission.service.ts:103` | `editor/FormsScreen.tsx:141` | WIRED |
| form submission delete | `forms.deleteSubmission` | `form-submission.service.ts:108` | `editor/FormsScreen.tsx:154` | WIRED |
| form submissions export | `forms.exportSubmissions` | `form-submission.service.ts:120` | — | ORPHAN-BACKEND |
| help categories | `help.categories` | `help.service.ts:12` | — | ORPHAN-BACKEND |
| help search | `help.search` | `help.service.ts:16` | `help/page.tsx:17` | WIRED |
| help by category | `help.byCategory` | `help.service.ts:37` | `help/page.tsx:22` | WIRED |
| help article | `help.article` | `help.service.ts:53` | `help/[slug]/page.tsx:15` | WIRED |
| help feedback | `help.feedback` | `help.service.ts:57` | `help/[slug]/page.tsx:20` | WIRED |
| help ticket create | `help.createTicket` | `help.service.ts:64` | `help/ticket-form.tsx:45` | WIRED |
| Vercel get connection | `integrations.vercel.getConnection` | router Prisma `routers/integrations.ts:23` | `settings/integrations/page.tsx:10` | WIRED |
| Vercel finish connect | `integrations.vercel.finishConnect` | router Prisma + `permission.service.ts:74` | `vercel-team-picker-form.tsx:20` | WIRED |
| Vercel disconnect | `integrations.vercel.disconnect` | router Prisma + `permission.service.ts:74` | `settings/integrations/page.tsx:14` | WIRED |
| media folders list | `media.listFolders` | `media-folder.service.ts:20` | `editor/BuildrikSyncProvider.ts:370` | WIRED |
| media folder create | `media.createFolder` | `media-folder.service.ts:39` | `editor/AssetUploadService.ts:181` | WIRED |
| media folder rename | `media.renameFolder` | `media-folder.service.ts:60` | — | ORPHAN-BACKEND |
| media folder move | `media.moveFolder` | `media-folder.service.ts:74` | — | ORPHAN-BACKEND |
| media folder delete | `media.deleteFolder` | `media-folder.service.ts:124` | `editor/AssetUploadService.ts:194` | WIRED |
| media assets list | `media.listAssets` | `media.service.ts:87` | `editor/BuildrikSyncProvider.ts:369` | WIRED |
| media asset create | `media.createAsset` | `media.service.ts:120` | `editor/AssetUploadService.ts:151` | WIRED |
| media asset update | `media.updateAsset` | `media.service.ts:261` | — | ORPHAN-BACKEND |
| media asset delete | `media.deleteAsset` | `media.service.ts:296` | `editor/AssetUploadService.ts:169` | WIRED |
| media asset move | `media.moveAsset` | `media.service.ts:343` | `editor/AssetUploadService.ts:205` | WIRED |
| media version list | `media.listAssetVersions` | `media.service.ts:368` | `editor/MediaVersionService.ts:35` | WIRED |
| media version create | `media.createAssetVersion` | `media.service.ts:386` | `editor/MediaVersionService.ts:45` | WIRED |
| media version restore | `media.restoreAssetVersion` | `media.service.ts:442` | `editor/MediaVersionService.ts:50` | WIRED |
| media alt text AI | `media.generateAltText` | `alt-text.service.ts:125` | `editor/AltTextService.ts:44` | WIRED |
| media quota | `media.checkStorageQuota` | `media.service.ts:474` | `editor/useServerStorageQuota.ts:61` | WIRED |
| notifications list | `notifications.list` | `notification.service.ts:5` | — | ORPHAN-BACKEND |
| notifications unread count | `notifications.unreadCount` | `notification.service.ts:25` | `notifications/notification-dropdown.tsx:18` | WIRED |
| notifications mark read | `notifications.markRead` | `notification.service.ts:31` | `notifications/notification-dropdown.tsx:21` | WIRED |
| notifications mark all read | `notifications.markAllRead` | `notification.service.ts:41` | `notifications/notification-page.tsx:33` | WIRED |
| notifications delete | `notifications.delete` | `notification.service.ts:48` | `notifications/notification-page.tsx:39` | WIRED |
| notifications mute type | `notifications.muteType` | `notification.service.ts:58` | `notifications/notification-page.tsx:45` | WIRED |
| notifications recent | `notifications.recent` | `notification.service.ts:68` | `notifications/notification-dropdown.tsx:15` | WIRED |
| notifications grouped | `notifications.listGrouped` | `notification.service.ts:76` | `notifications/notification-page.tsx:22` | WIRED |
| onboarding state | `onboarding.getState` | `onboarding.service.ts:25` | `dashboard/page.tsx:33` | WIRED |
| onboarding role | `onboarding.selectRole` | `onboarding.service.ts:63` | `onboarding/role/page.tsx:9` | WIRED |
| onboarding setup project | `onboarding.setupProject` | `onboarding.service.ts:75` | `onboarding/setup/page.tsx:19` | WIRED |
| onboarding complete step | `onboarding.completeStep` | `onboarding.service.ts:85` | — | ORPHAN-BACKEND |
| onboarding complete dash task | `onboarding.completeDashboardTask` | `onboarding.service.ts:99` | `onboarding/dashboard-checklist.tsx:90` | WIRED |
| onboarding dismiss | `onboarding.dismiss` | `onboarding.service.ts:116` | `onboarding/dashboard-checklist.tsx:95` | WIRED |
| pages list | `pages.list` | `page.service.ts:23` | `editor/BuildrikSyncProvider.ts:204` | WIRED |
| pages get | `pages.get` | `page.service.ts:50` | — | ORPHAN-BACKEND |
| pages create | `pages.create` | `page.service.ts:54` | — | ORPHAN-BACKEND (editor persists via saveProject blob) |
| pages update | `pages.update` | `page.service.ts:95` | — | ORPHAN-BACKEND (editor persists via saveProject blob) |
| pages delete | `pages.delete` | `page.service.ts:116` | — | ORPHAN-BACKEND (editor persists via saveProject blob) |
| pages get translation | `pages.getTranslation` | `page.service.ts:139` | — | ORPHAN-BACKEND |
| pages set translation | `pages.setTranslation` | `page.service.ts:181` | — | ORPHAN-BACKEND |
| pages remove translation | `pages.removeTranslation` | `page.service.ts:217` | — | ORPHAN-BACKEND |
| reviews submit | `reviews.submit` | `review.service.ts:26` | `editor/ReviewService.ts:23` | WIRED |
| reviews list | `reviews.list` | `review.service.ts:61` | `reviews/review-queue.tsx:21` | WIRED |
| reviews resolve | `reviews.resolve` | `review.service.ts:85` | `reviews/review-queue.tsx:23` | WIRED |
| site overview | `siteDetail.overview` | `site-detail.service.ts:4` | `sites/[id]/page.tsx:11` | WIRED |
| site settings get | `siteDetail.settings.get` | `site-settings.service.ts:57` | `editor/BuildrikSyncProvider.ts:205` | WIRED |
| site settings update | `siteDetail.settings.update` | `site-settings.service.ts:102` | `editor/BuildrikSyncProvider.ts:306` | WIRED |
| redirects list | `siteDetail.redirects.list` | `redirect.service.ts:7` | `editor/RedirectsScreen.tsx:62` | WIRED |
| redirects create | `siteDetail.redirects.create` | `redirect.service.ts:14` | `editor/RedirectsScreen.tsx:97` | WIRED |
| redirects update | `siteDetail.redirects.update` | `redirect.service.ts:36` | — | ORPHAN-BACKEND |
| redirects delete | `siteDetail.redirects.delete` | `redirect.service.ts:43` | `editor/RedirectsScreen.tsx:135` | WIRED |
| redirects import CSV | `siteDetail.redirects.import_csv` | `redirect.service.ts:47` | `sites/[id]/redirects/page.tsx:27` | WIRED |
| redirects export CSV | `siteDetail.redirects.export_csv` | `redirect.service.ts:79` | — | ORPHAN-BACKEND |
| domains list | `siteDetail.domains.list` | `domain.service.ts:11` | `sites/[id]/domains/page.tsx:13` | WIRED |
| domains list workspace | `siteDetail.domains.listForWorkspace` | `domain.service.ts:30` | `dashboard/domains/page.tsx:15` | WIRED |
| domains connect | `siteDetail.domains.connect` | `domain.service.ts:47` | `sites/[id]/domains/page.tsx:23` | WIRED |
| domains remove | `siteDetail.domains.remove` | `domain.service.ts:117` | `sites/[id]/domains/page.tsx:31` | WIRED |
| domains set primary | `siteDetail.domains.setPrimary` | `domain.service.ts:143` | `sites/[id]/domains/page.tsx:38` | WIRED |
| share links list | `siteDetail.sharing.list` | `share-link.service.ts:5` | `sites/[id]/access/page.tsx:14` | WIRED |
| share links create | `siteDetail.sharing.create` | `share-link.service.ts:12` | `sites/[id]/access/page.tsx:22` | WIRED |
| share links revoke | `siteDetail.sharing.revoke` | `share-link.service.ts:79` | `sites/[id]/access/page.tsx:30` | WIRED |
| site analytics | `siteDetail.analytics` | `analytics.service.ts:94` | `sites/[id]/analytics/page.tsx:13` | WIRED |
| sites list | `sites.list` | `sites.service.ts:46` | `sites/page.tsx:75` | WIRED |
| sites get | `sites.get` | `sites.service.ts:334` | `editor/BuildrikSyncProvider.ts:203` | WIRED |
| sites create blank/template | `sites.create` | `sites.service.ts:163` | `sites/new/page.tsx:83` | WIRED |
| sites create AI branch | `sites.create` | falls through to blank-site `sites.service.ts:186-263` | `sites/new/page.tsx:93` | STUB |
| sites rename | `sites.rename` | `sites.service.ts:341` | `sites/page.tsx:110` | WIRED |
| sites duplicate | `sites.duplicate` | `sites.service.ts:348` | `sites/page.tsx:134` | WIRED |
| sites archive | `sites.archive` | `sites.service.ts:454` | `sites/page.tsx:127` | WIRED |
| sites unarchive | `sites.unarchive` | `sites.service.ts:461` | — | ORPHAN-BACKEND |
| sites delete | `sites.delete` | `sites.service.ts:468` | `sites/page.tsx:118` | WIRED |
| sites bulk | `sites.bulk` | `sites.service.ts:562` | `sites/page.tsx:142` | WIRED |
| slug check | `sites.checkSlug` | `sites.service.ts:273` | `sites/create-site-modal.tsx:29` | WIRED |
| site transfer | `sites.transfer` | `sites.service.ts:278` | `sites/transfer-modal.tsx:26` | WIRED |
| save project | `sites.saveProject` | `sites.service.ts:506` | `editor/BuildrikSyncProvider.ts:297` | WIRED |
| pre-publish checks | `sites.prePublishChecks` | `publish.service.ts:16` | `sites/[id]/publish/page.tsx:23` | WIRED |
| publish | `sites.publish` | `publish.service.ts:116` | `editor/PublishService.ts:46` | WIRED |
| publish status | `sites.publishStatus` | `publish.service.ts:232` | `editor/PublishService.ts:54` | WIRED |
| cancel publish | `sites.cancelPublish` | `publish.service.ts:252` | `editor/PublishService.ts:86` | WIRED |
| unpublish | `sites.unpublish` | `publish.service.ts:295` | `sites/[id]/layout.tsx:24` | WIRED |
| save project data | `sites.saveProjectData` | `sites.service.ts:622` | — | ORPHAN-BACKEND |
| get project data | `sites.getProjectData` | `sites.service.ts:768` | — | ORPHAN-BACKEND |
| site folders list | `sites.folders.list` | `folder.service.ts:3` | `sites/page.tsx:98` | WIRED |
| site folders create | `sites.folders.create` | `folder.service.ts:11` | `sites/page.tsx:158` | WIRED |
| site folders delete | `sites.folders.delete` | `folder.service.ts:25` | — | ORPHAN-BACKEND |
| site folders rename | `sites.folders.rename` | `folder.service.ts:34` | — | ORPHAN-BACKEND |
| site folders move site | `sites.folders.moveSite` | `folder.service.ts:38` | `sites/page.tsx:150` | WIRED |
| team stats | `team.stats` | `team.service.ts:14` | `team/page.tsx:21` | WIRED |
| team list | `team.list` | `team.service.ts:23` | `team/page.tsx:22` | WIRED |
| team invite | `team.invite` | `team.service.ts:64` | `team/page.tsx:27` | WIRED |
| team change role | `team.changeRole` | `team.service.ts:130` | `team/page.tsx:38` | WIRED |
| team revoke member | `team.revoke` | `team.service.ts:159` | `team/page.tsx:46` | WIRED |
| team delete member | `team.delete` | `team.service.ts:172` | `team/page.tsx:55` | WIRED |
| team pending invites | `team.pendingInvites` | `team.service.ts:182` | `team/page.tsx:23` | WIRED |
| team revoke invite | `team.revokeInvite` | `team.service.ts:189` | `team/page.tsx:64` | WIRED |
| team resend invite | `team.resendInvite` | `team.service.ts:197` | `team/page.tsx:73` | WIRED (sends no email 🟡) |
| team activity | `team.activity` | `team.service.ts:211` | `team/page.tsx:24` | WIRED |
| templates list | `templates.list` | `template.service.ts:38` | `sites/new/page.tsx:52` | WIRED |
| templates get | `templates.get` | `template.service.ts:67` | `sites/new/page.tsx:62` | WIRED |
| templates use | `templates.use` | `template.service.ts:71` | `sites/new/page.tsx:73` | WIRED |
| AI site-gen job create | `templates.generate.create` | `ai-generation.service.ts:8` | `sites/new/page.tsx:93` | WIRED |
| AI site-gen job status | `templates.generate.status` | `ai-generation.service.ts:89` | `sites/new/page.tsx:67` | WIRED |
| AI site-gen job cancel | `templates.generate.cancel` | `ai-generation.service.ts:105` | `sites/new/page.tsx:111` | WIRED |
| shared theme get | `theme.getShared` | `theme.service.ts:49` | `theme/theme-manager.tsx:28` | WIRED |
| shared theme targets | `theme.targets` | `theme.service.ts:87` | `theme/theme-manager.tsx:29` | WIRED |
| shared theme capture | `theme.capture` | `theme.service.ts:62` | `theme/theme-manager.tsx:36` | WIRED |
| shared theme lock | `theme.setLock` | `theme.service.ts:97` | `theme/theme-manager.tsx:44` | WIRED |
| shared theme push | `theme.push` | `theme.service.ts:118` | `theme/theme-manager.tsx:49` | WIRED |
| upload presign | `upload.presign` | `upload.service.ts:22` | `settings/profile-form.tsx:77` | WIRED |
| upload confirm | `upload.confirm` | `upload.service.ts:66` | `settings/profile-form.tsx:78` | WIRED |
| upload limits | `upload.limits` | `upload.service.ts:84` | — | ORPHAN-BACKEND |
| local project mode | — | `localStorage["buildrick-project"]` `useComposerInit.ts:260,341` | editor-only | ORPHAN-UI |
| undo/redo | — | RAM `HistoryManager.ts` | editor-only | ORPHAN-UI |
| version history | — | IndexedDB `aquibra-versions` `VersionHistoryStorage.ts:19` | editor-only | ORPHAN-UI |
| component masters | — | IndexedDB `aquibra-components` `ComponentStorage.ts:15` | editor-only | ORPHAN-UI |
| CMS local cache | — | IndexedDB `aquibra-cms` `CollectionStorage.ts:13` | editor-only | ORPHAN-UI |
| runtime form submit | — | in-memory `Map` `FormSubmissionService.ts:99-127` | editor-only | ORPHAN-UI |
| media metadata edit | — | local-only `MediaManager.ts:948-980` | editor-only | ORPHAN-UI |
| media folder rename | — | local-only `MediaManager.ts:1216-1228` | editor-only | ORPHAN-UI |
| layers hidden/locked/names | — | `localStorage` `layersPersistence.ts:15,31,67,76` | editor-only | ORPHAN-UI |
| page sidebar folders | — | `localStorage` `useFolders.ts:27,37` | editor-only | ORPHAN-UI |
| design token/preset/DS prefs | — | `localStorage` `TokenRegistryContext/StylePresetRegistryContext/DSModeContext` | editor-only | ORPHAN-UI |
| my templates | — | `localStorage` `templatesData.ts:62,72,99,120` | editor-only | ORPHAN-UI |

---

## C. ORPHANS BOTH WAYS

### C1. Server procedures with NO UI consumer (~29 — built, never called)
`auth.logout` · `ai.getQuotaStatus` · `billing.plans` · `billing.usage` · `billing.upgrade` ·
`billing.switchInterval` · `cms.dynamicPages` · `cms.generateDynamicPages` · `forms.exportSubmissions` ·
`help.categories` · `media.renameFolder` · `media.moveFolder` · `media.updateAsset` · `notifications.list` ·
`onboarding.completeStep` · `pages.get` · `pages.create` · `pages.update` · `pages.delete` ·
`pages.getTranslation` · `pages.setTranslation` · `pages.removeTranslation` · `siteDetail.redirects.update` ·
`siteDetail.redirects.export_csv` · `sites.unarchive` · `sites.saveProjectData` · `sites.getProjectData` ·
`sites.folders.delete` · `sites.folders.rename` · `upload.limits`

> Note: `pages.create/update/delete` are stranded *surface*, NOT a user bug — the editor
> persists page ops through the full project blob (`sites.saveProject`), never the per-page API.

### C2. UI/features with no real backend (fake/stub/browser-only)
- Billing upgrade/paywall — `billing.service.ts:173` throws `PAYMENTS_NOT_CONFIGURED`; payment UI disabled `payment-method-card.tsx:91,99,106,124`
- "Create site with AI" — fake; non-template path makes blank Home page `sites.service.ts:186-263`
- Stock media — stubbed to `[]` `StockService.ts:55,66-72`
- Share-link gate — decorative; page + password-verify route both redirect to `publishedUrl` `share/[token]/page.tsx:35-42`, `verify-password/route.ts:50-57,73`
- Editor runtime forms — local memory only, not server `submitForm` `FormSubmissionService.ts:99-127`
- Editor media rename/altText/source — do not hit `media.updateAsset`; only `folderId` mirrors `MediaManager.ts:964-980`
- Editor folder rename — does not hit `media.renameFolder` `MediaManager.ts:1216-1228`
- My Templates — browser-local only `templatesData.ts:62,72,99,120`
- Version history — browser-local only `VersionHistoryStorage.ts:19`
- Component masters — browser-local only `ComponentStorage.ts:15`

---

## D. TOP GAPS (ranked by user impact)

1. **Billing not sellable.** `billing.upgrade` throws unconditionally `billing.service.ts:173`; payment UI visibly disabled `payment-method-card.tsx:91-124`. Checkout path is absent, not partial.
2. **"Create with AI" mislabeled.** `sites.service.ts:186-263` only special-cases `template`; `ai` falls into blank-site creation. Dashboard still offers it `sites/new/page.tsx:93`.
3. **Share links don't protect content** — just redirect to public published URL `share/[token]/page.tsx:35-42`, `verify-password/route.ts:50-57,73`.
4. **Editor state never leaves the browser** — version history `VersionHistoryStorage.ts:19`, components `ComponentStorage.ts:15`, local crash-resume `useComposerInit.ts:260,341`. Silent data-loss risk.
5. **Editor media metadata edits disconnected from server** despite real route `media.service.ts:261`; editor `MediaManager.ts:948-980` only syncs `folderId`.
6. **Folder rename/move APIs exist server-side, editor doesn't use them** `media-folder.service.ts:60,74` vs `MediaManager.ts:1216-1228` → cross-device divergence.
7. **Account data export only queued, not fulfilled** — `requestDataExport` writes `ExportJob` `account.service.ts:205-206`; no processor found.
8. **Prior docs stale** — `/api/asset-upload` is real+wired `asset-upload/route.ts:1-220`; DNS verify fixed `dns-verify/route.ts:34-41`.
9. **Localization more wired than master doc said** — editor settings call `siteDetail.settings.get/update` `LocalizationScreen.tsx:90,133`; but runtime engine still locale-unaware.
10. **Large stranded server surface** — `pages.*` (except list), `redirects.update/export_csv`, `upload.limits`, `billing.plans/usage/switchInterval`, `notifications.list`, `onboarding.completeStep`, `cms.dynamicPages/generateDynamicPages`, `sites.saveProjectData/getProjectData/unarchive/folders.delete/folders.rename`. Dead/unfinished surface, not shipped product.

> Generated by codex read-only sweep, 2026-06-24. Supersedes prior editor/dashboard
> backend audits where they conflict (see section A staleness notes).
