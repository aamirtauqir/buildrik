# Appendix B: API Inventory

> All tRPC procedures from `server/trpc/routers/*.ts` and REST API routes from `app/api/`.

---

## 1. Auth Domain (`authRouter`)

> Source: `server/trpc/routers/auth.ts`

| Procedure              | Type     | Rate Limit | Input Schema                                                                 | Description                                                          | Service Called                          |
|------------------------|----------|------------|------------------------------------------------------------------------------|----------------------------------------------------------------------|-----------------------------------------|
| `auth.login`           | mutation | strict (5/15m) | `loginSchema` (email, password, rememberMe)                              | Authenticates user with email+password. Returns session token or 2FA temp token | `auth.service.login`                    |
| `auth.signup`          | mutation | normal (10/15m) | `signupSchema` (fullName, email, password, termsAccepted)               | Creates a new user account and sends verification email              | `auth.service.signup`                   |
| `auth.verifyEmail`     | mutation | normal | `{ token: uuid }`                                                            | Verifies email address using token from verification email           | `auth.service.verifyEmail`              |
| `auth.resendVerification` | mutation | normal | `{ email: string }`                                                       | Resends email verification link                                      | `auth.service.resendVerification`       |
| `auth.forgotPassword`  | mutation | normal | `forgotPasswordSchema` (email)                                               | Sends password reset email                                           | `auth.service.forgotPassword`           |
| `auth.resetPassword`   | mutation | strict | `resetPasswordSchema` (token, newPassword, confirmPassword)                  | Resets password using token from email                               | `auth.service.resetPassword`            |
| `auth.magicLink`       | mutation | normal | `magicLinkSchema` (email)                                                    | Sends a passwordless magic link to email                             | `auth.service.sendMagicLink`            |
| `auth.verifyMagicLink` | mutation | strict | `{ token: uuid }`                                                            | Verifies magic link token and creates session                        | `auth.service.verifyMagicLink`          |
| `auth.verify2FA`       | mutation | strict | `{ twoFactorToken: uuid, code: string(6) }`                                 | Verifies TOTP 2FA code                                              | `auth.service.verify2FA`                |
| `auth.verifyBackupCode`| mutation | strict | `{ twoFactorToken: uuid, backupCode: string }`                              | Verifies a backup recovery code for 2FA                             | `auth.service.verifyBackupCode`         |
| `auth.logout`          | mutation | protected | none                                                                        | Deletes all sessions for user and logs audit event                   | Direct Prisma + `audit.service`         |
| `auth.getInviteDetails`| query    | public | `{ token: string }`                                                          | Retrieves invite workspace name, inviter, role, expiry status        | Direct Prisma query                     |
| `auth.acceptInvite`    | mutation | protected | `{ token: string }`                                                       | Accepts a workspace invite, creates member + site permissions        | Direct Prisma transaction               |
| `auth.declineInvite`   | mutation | public | `{ token: string }`                                                          | Declines a workspace invite                                          | Direct Prisma update                    |

---

## 2. Dashboard Domain (`dashboardRouter`)

> Source: `server/trpc/routers/dashboard.ts`

| Procedure              | Type  | Input Schema                                    | Description                                                   | Service Called                      |
|------------------------|-------|-------------------------------------------------|---------------------------------------------------------------|-------------------------------------|
| `dashboard.stats`      | query | none                                            | Returns total sites, published/draft counts, visits, collaborators | `dashboard.service.getDashboardStats` |
| `dashboard.recentSites`| query | none                                            | Returns the most recently edited sites                        | `dashboard.service.getRecentSites`  |
| `dashboard.activity`   | query | `{ filter?: "all" \| "mine" \| "team" }` (optional) | Returns the workspace activity feed, optionally filtered  | `dashboard.service.getActivityFeed` |
| `dashboard.health`     | query | none                                            | Returns workspace resource usage (sites, storage, AI credits) | `dashboard.service.getWorkspaceHealth` |

---

## 3. Sites Domain (`sitesRouter`)

> Source: `server/trpc/routers/sites.ts`

| Procedure                   | Type     | Input Schema                                                   | Description                                            | Service Called                       |
|-----------------------------|----------|----------------------------------------------------------------|--------------------------------------------------------|--------------------------------------|
| `sites.list`                | query    | `listSitesSchema` (page, perPage, status, sort, search, folderId, createdBy, dateRange, templateUsed, hasCustomDomain, hasTraffic) | Paginated list with filters and sorting | `sites.service.listSites`            |
| `sites.get`                 | query    | `{ id: string }`                                               | Get a single site by ID                                | `sites.service.getSite`              |
| `sites.create`              | mutation | `createSiteSchema` (name, method, templateId?)                 | Create a new site (blank, template, or AI)             | `sites.service.createSite`           |
| `sites.rename`              | mutation | `{ id: string, name: string(2-100) }`                         | Rename a site                                          | `sites.service.renameSite`           |
| `sites.duplicate`           | mutation | `{ id: string }`                                               | Duplicate a site with all pages                        | `sites.service.duplicateSite`        |
| `sites.archive`             | mutation | `{ id: string }`                                               | Archive a site (soft-delete)                           | `sites.service.archiveSite`          |
| `sites.unarchive`           | mutation | `{ id: string }`                                               | Restore an archived site                               | `sites.service.unarchiveSite`        |
| `sites.delete`              | mutation | `{ id: string, confirmName: string }`                          | Permanently delete a site (name confirmation required) | `sites.service.deleteSite`           |
| `sites.bulk`                | mutation | `bulkActionSchema` (action, siteIds[])                         | Bulk archive/delete/unarchive/publish/unpublish        | `sites.service.bulkAction`           |
| `sites.checkSlug`           | query    | `checkSlugSchema` (slug)                                       | Check if a site slug is available                      | `sites.service.checkSlugAvailability`|
| `sites.transfer`            | mutation | `transferSiteSchema` (siteId, newOwnerId)                      | Transfer site ownership to another workspace member    | `sites.service.transferSite`         |
| `sites.prePublishChecks`    | query    | `prePublishCheckSchema` (siteId)                               | Run pre-publish validation checks                      | `publish.service.runPrePublishChecks`|
| `sites.publish`             | mutation | `{ siteId: string }`                                           | Start a publish build job                              | `publish.service.startPublish`       |
| `sites.publishStatus`       | query    | `{ jobId: string }`                                            | Poll publish build job status                          | `publish.service.getPublishStatus`   |
| `sites.cancelPublish`       | mutation | `{ jobId: string }`                                            | Cancel an in-progress publish job                      | `publish.service.cancelPublish`      |
| `sites.unpublish`           | mutation | `{ siteId: string }`                                           | Take a published site offline                          | `publish.service.unpublishSite`      |
| `sites.folders.list`        | query    | none                                                           | List all folders in workspace                          | `folder.service.listFolders`         |
| `sites.folders.create`      | mutation | `{ name: string(1-50) }`                                      | Create a new folder                                    | `folder.service.createFolder`        |
| `sites.folders.delete`      | mutation | `{ id: string }`                                               | Delete a folder (sites move to root)                   | `folder.service.deleteFolder`        |
| `sites.folders.rename`      | mutation | `{ id: string, name: string(1-50) }`                          | Rename a folder                                        | `folder.service.renameFolder`        |
| `sites.folders.moveSite`    | mutation | `{ siteId: string, folderId: string \| null }`                | Move a site into a folder (or root)                    | `folder.service.moveSiteToFolder`    |

---

## 4. Site Detail Domain (`siteDetailRouter`)

> Source: `server/trpc/routers/site-detail.ts`

| Procedure                        | Type     | Input Schema                                                  | Description                                 | Service Called                          |
|----------------------------------|----------|---------------------------------------------------------------|---------------------------------------------|-----------------------------------------|
| `siteDetail.overview`            | query    | `{ siteId: string }`                                         | Get site overview with stats, activity, forms | `site-detail.service.getSiteOverview`   |
| `siteDetail.settings.get`        | query    | `{ siteId: string }`                                         | Get site settings (codes, social, SEO)      | `site-settings.service.getSiteSettings` |
| `siteDetail.settings.update`     | mutation | `updateSiteSettingsSchema` (id + headCode, bodyCode, socialLinks, metaTitleTemplate, touchIcon, slug) | Update site settings | `site-settings.service.updateSiteSettings` |
| `siteDetail.redirects.list`      | query    | `{ siteId: string }`                                         | List all URL redirects for a site           | `redirect.service.listRedirects`        |
| `siteDetail.redirects.create`    | mutation | `createRedirectSchema` (siteId, fromPath, toUrl, type)       | Create a URL redirect (plan-limited)        | `redirect.service.createRedirect`       |
| `siteDetail.redirects.update`    | mutation | `{ id, fromPath?, toUrl?, type? }`                           | Update an existing redirect                 | `redirect.service.updateRedirect`       |
| `siteDetail.redirects.delete`    | mutation | `{ id: string }`                                             | Delete a redirect                           | `redirect.service.deleteRedirect`       |
| `siteDetail.redirects.import_csv`| mutation | `{ siteId: string, csv: string }`                            | Bulk import redirects from CSV              | `redirect.service.importRedirects`      |
| `siteDetail.redirects.export_csv`| query    | `{ siteId: string }`                                         | Export all redirects as CSV                 | `redirect.service.exportRedirects`      |
| `siteDetail.domains.list`        | query    | `{ siteId: string }`                                         | List all custom domains for a site          | `domain.service.listDomains`            |
| `siteDetail.domains.connect`     | mutation | `connectDomainSchema` (siteId, domain)                       | Connect a custom domain to a site           | `domain.service.connectDomain`          |
| `siteDetail.domains.remove`      | mutation | `{ id: string }`                                             | Remove a custom domain                      | `domain.service.removeDomain`           |
| `siteDetail.domains.setPrimary`  | mutation | `{ id: string, siteId: string }`                             | Set a domain as the primary domain          | `domain.service.setPrimaryDomain`       |
| `siteDetail.sharing.list`        | query    | `{ siteId: string }`                                         | List all share links for a site             | `share-link.service.listShareLinks`     |
| `siteDetail.sharing.create`      | mutation | `createShareLinkSchema` (siteId, name, password?, expiresAt?) | Create a share link                        | `share-link.service.createShareLink`    |
| `siteDetail.sharing.revoke`      | mutation | `{ id: string }`                                             | Revoke (deactivate) a share link            | `share-link.service.revokeShareLink`    |
| `siteDetail.analytics`           | query    | `siteAnalyticsQuerySchema` (siteId, range, granularity)      | Get site analytics data                     | `analytics.service.getSiteAnalytics`    |

---

## 5. Team Domain (`teamRouter`)

> Source: `server/trpc/routers/team.ts`

| Procedure             | Type     | Input Schema                                              | Description                                      | Service Called                    |
|-----------------------|----------|-----------------------------------------------------------|--------------------------------------------------|----------------------------------|
| `team.stats`          | query    | none                                                      | Get team member counts and role distribution      | `team.service.getTeamStats`      |
| `team.list`           | query    | `listMembersSchema` (page, perPage)                       | Paginated list of workspace members               | `team.service.listMembers`       |
| `team.invite`         | mutation | `inviteMembersSchema` (emails[], role, siteIds[], message?) | Invite one or more people to the workspace       | `team.service.inviteMembers`     |
| `team.changeRole`     | mutation | `{ memberId: string, role: "ADMIN"\|"EDITOR"\|"VIEWER" }` | Change a member's role                           | `team.service.changeRole`        |
| `team.revoke`         | mutation | `{ memberId: string }`                                    | Suspend a member's access                        | `team.service.revokeMember`      |
| `team.delete`         | mutation | `{ memberId: string }`                                    | Permanently remove a member from workspace       | `team.service.deleteMember`      |
| `team.pendingInvites` | query    | none                                                      | List all pending invitations                     | `team.service.listPendingInvites`|
| `team.revokeInvite`   | mutation | `{ inviteId: string }`                                    | Revoke a pending invitation                      | `team.service.revokeInvite`      |
| `team.resendInvite`   | mutation | `{ inviteId: string }`                                    | Resend an invitation email                       | `team.service.resendInvite`      |
| `team.activity`       | query    | none                                                      | Get team-related activity log                    | `team.service.getTeamActivity`   |

---

## 6. Billing Domain (`billingRouter`)

> Source: `server/trpc/routers/billing.ts`

| Procedure               | Type     | Input Schema                                             | Description                                           | Service Called                         |
|-------------------------|----------|----------------------------------------------------------|-------------------------------------------------------|----------------------------------------|
| `billing.overview`      | query    | none                                                     | Get current plan, status, usage, payment method        | `billing.service.getBillingOverview`    |
| `billing.plans`         | query    | none                                                     | Get available plans with pricing                       | `billing.service.getPlans`             |
| `billing.usage`         | query    | none                                                     | Get detailed usage breakdown                           | `billing.service.getUsageDetails`      |
| `billing.invoices`      | query    | `{ page: number, perPage: number }`                      | Paginated invoice history                              | `billing.service.listInvoices`         |
| `billing.upgrade`       | mutation | `upgradeSchema` (planId, interval)                       | Upgrade to a paid plan                                 | `billing.service.upgradePlan`          |
| `billing.cancel`        | mutation | `cancelSchema` (reason, feedback)                        | Cancel subscription at period end                      | `billing.service.cancelSubscription`   |
| `billing.switchInterval`| mutation | `{ interval: "MONTHLY"\|"YEARLY" }`                     | Switch billing interval (monthly/yearly)               | Direct Prisma update                   |
| `billing.reactivate`    | mutation | none                                                     | Reactivate a cancelled subscription                    | `billing.service.reactivateSubscription`|

---

## 7. Account Domain (`accountRouter`)

> Source: `server/trpc/routers/account.ts`

| Procedure                          | Type     | Input Schema                                          | Description                                         | Service Called                              |
|------------------------------------|----------|-------------------------------------------------------|-----------------------------------------------------|--------------------------------------------|
| `account.profile.get`              | query    | none                                                  | Get user profile (name, email, avatar, bio, etc.)   | `account.service.getProfile`               |
| `account.profile.update`           | mutation | `updateProfileSchema`                                 | Update user profile fields                          | `account.service.updateProfile`            |
| `account.changePassword`           | mutation | `changePasswordSchema` (currentPassword, newPassword, confirmPassword) | Change user password                   | `account.service.changePassword`           |
| `account.twoFactor.enable`         | mutation | none                                                  | Begin 2FA setup, returns QR code + secret           | `account.service.enable2FA`                |
| `account.twoFactor.confirm`        | mutation | `{ code: string(6) }`                                | Confirm 2FA setup with TOTP code, returns backup codes | `account.service.confirm2FA`            |
| `account.twoFactor.disable`        | mutation | `{ password?: string }`                              | Disable 2FA (requires password for credential users) | `account.service.disable2FA`              |
| `account.sessions.list`            | query    | none                                                  | List all active sessions (device, IP, location)     | `account.service.getActiveSessions`        |
| `account.sessions.revoke`          | mutation | `{ sessionId: string }`                              | Revoke a specific session                           | `account.service.revokeSession`            |
| `account.sessions.revokeAll`       | mutation | `{ currentSessionId: string }`                       | Revoke all sessions except the current one          | `account.service.revokeAllOtherSessions`   |
| `account.loginHistory`             | query    | none                                                  | Get recent login attempts for the user              | `account.service.getLoginHistory`          |
| `account.notifications.list`       | query    | none                                                  | Get notification preferences by category            | `account.service.getNotificationPrefs`     |
| `account.notifications.update`     | mutation | `notificationPrefSchema` (category, inApp, email)    | Update notification preferences                     | `account.service.updateNotificationPref`   |
| `account.preferences.get`          | query    | none                                                  | Get UI preferences (view mode, sort, theme)         | `account.service.getPreferences`           |
| `account.preferences.update`       | mutation | `updatePreferencesSchema`                             | Update UI preferences                               | `account.service.updatePreferences`        |
| `account.workspace.get`            | query    | none                                                  | Get workspace settings                              | `workspace-settings.service.getWorkspaceSettings` |
| `account.workspace.update`         | mutation | `updateWorkspaceSchema`                               | Update workspace settings (name, slug, etc.)        | `workspace-settings.service.updateWorkspaceSettings` |
| `account.workspace.sharing`        | mutation | `workspaceSharingSettingsSchema`                      | Update workspace-wide sharing defaults              | `workspace-settings.service.updateSharingSettings` |
| `account.workspace.delete`         | mutation | `{ confirmName: string }`                            | Schedule workspace deletion (owner only)            | `workspace-settings.service.deleteWorkspace` |
| `account.workspace.cancelDelete`   | mutation | none                                                  | Cancel a pending workspace deletion                 | `workspace-settings.service.cancelWorkspaceDeletion` |
| `account.integrations.list`        | query    | none                                                  | List connected integrations                         | `integrations.service.listIntegrations`    |
| `account.integrations.add`         | mutation | `addIntegrationSchema` (provider, config)            | Connect a new integration (plan-limited)            | `integrations.service.addIntegration`      |
| `account.integrations.remove`      | mutation | `{ id: string }`                                     | Disconnect an integration                           | `integrations.service.removeIntegration`   |
| `account.aiCredits`                | query    | none                                                  | Get AI generation credits used/limit/history        | `account.service.getAICreditsInfo`         |
| `account.dangerZone.pendingDeletion` | query  | none                                                  | Check if account has a pending deletion request     | Direct Prisma query                        |
| `account.dangerZone.exportData`    | mutation | none                                                  | Request a full data export                          | `account.service.requestDataExport`        |
| `account.dangerZone.deleteAccount` | mutation | `{ reason?: string(max 500) }`                       | Schedule account deletion (30-day grace period)     | `account.service.requestAccountDeletion`   |
| `account.dangerZone.cancelAccountDeletion` | mutation | none                                          | Cancel a pending account deletion                   | Direct Prisma updateMany                   |

---

## 8. Notifications Domain (`notificationsRouter`)

> Source: `server/trpc/routers/notifications.ts`

| Procedure                    | Type     | Input Schema                                             | Description                                    | Service Called                              |
|------------------------------|----------|----------------------------------------------------------|------------------------------------------------|--------------------------------------------|
| `notifications.list`         | query    | `listNotificationsSchema` (page, perPage, filter?)       | Paginated notification list                    | `notification.service.listNotifications`   |
| `notifications.unreadCount`  | query    | none                                                     | Get count of unread notifications              | `notification.service.getUnreadCount`      |
| `notifications.markRead`     | mutation | `{ notificationId: string }`                             | Mark a single notification as read             | `notification.service.markAsRead`          |
| `notifications.markAllRead`  | mutation | none                                                     | Mark all notifications as read                 | `notification.service.markAllAsRead`       |
| `notifications.recent`       | query    | none                                                     | Get most recent notifications (for dropdown)   | `notification.service.getRecentNotifications` |
| `notifications.listGrouped`  | query    | `{ filter?: "all"\|"unread"\|"mentions" }`               | List notifications grouped by date             | `notification.service.listGroupedNotifications` |

---

## 9. Help Domain (`helpRouter`)

> Source: `server/trpc/routers/help.ts`

| Procedure          | Type     | Auth     | Input Schema                                    | Description                               | Service Called                   |
|--------------------|----------|----------|-------------------------------------------------|-------------------------------------------|---------------------------------|
| `help.categories`  | query    | public   | none                                            | List help article categories              | `help.service.listCategories`   |
| `help.search`      | query    | public   | `{ query: string(1-200) }`                      | Full-text search across help articles     | `help.service.searchArticles`   |
| `help.article`     | query    | public   | `{ slug: string }`                              | Get a single help article by slug         | `help.service.getArticle`       |
| `help.feedback`    | mutation | public   | `{ articleId: string, helpful: boolean }`       | Submit helpful/not-helpful feedback        | `help.service.submitFeedback`   |
| `help.createTicket`| mutation | protected | `supportTicketSchema` (subject, category, description, attachments?) | Create a support ticket | `help.service.createTicket`     |

---

## 10. Onboarding Domain (`onboardingRouter`)

> Source: `server/trpc/routers/onboarding.ts`

| Procedure                    | Type     | Input Schema                            | Description                                       | Service Called                         |
|------------------------------|----------|-----------------------------------------|---------------------------------------------------|----------------------------------------|
| `onboarding.getState`        | query    | none                                    | Get current onboarding state for user              | `onboarding.service.getOnboardingState`|
| `onboarding.selectRole`      | mutation | `selectRoleSchema` (role)               | Save user's selected role (Freelancer/Team/Agency) | `onboarding.service.selectRole`        |
| `onboarding.setupProject`    | mutation | `setupProjectSchema` (projectName, method) | Save project setup choices                      | `onboarding.service.setupProject`      |
| `onboarding.completeStep`    | mutation | `{ step: string }`                      | Mark an onboarding step as completed               | `onboarding.service.completeStep`      |
| `onboarding.dismiss`         | mutation | none                                    | Dismiss the onboarding checklist                   | `onboarding.service.dismissOnboarding` |
| `onboarding.completeTourStep`| mutation | `{ step: number(int, min 0) }`         | Advance the editor tour to next step               | `onboarding.service.completeTourStep`  |
| `onboarding.completeTour`    | mutation | none                                    | Mark the editor tour as complete                   | `onboarding.service.completeTour`      |

---

## 11. Templates Domain (`templatesRouter`)

> Source: `server/trpc/routers/templates.ts`

| Procedure                   | Type     | Input Schema                                                                  | Description                                      | Service Called                            |
|-----------------------------|----------|-------------------------------------------------------------------------------|--------------------------------------------------|------------------------------------------|
| `templates.list`            | query    | `listTemplatesSchema` (category, page, perPage, sort)                         | Paginated, filterable template gallery            | `template.service.listTemplates`         |
| `templates.get`             | query    | `{ id: string }`                                                              | Get a single template with full details           | `template.service.getTemplate`           |
| `templates.use`             | mutation | `{ templateId: string, siteName: string(2-100) }`                             | Create a new site from a template                 | `template.service.useTemplate`           |
| `templates.generate.create` | mutation | `generateSiteSchema` (name, businessType, selectedPages[], description?)      | Start an AI site generation job                   | `ai-generation.service.createGenerationJob` |
| `templates.generate.status` | query    | `{ jobId: string }`                                                           | Poll AI generation job status + progress          | `ai-generation.service.getJobStatus`     |
| `templates.generate.cancel` | mutation | `{ jobId: string }`                                                           | Cancel an in-progress AI generation job           | `ai-generation.service.cancelJob`        |

---

## 12. Pages Domain (`pagesRouter`)

> Source: `server/trpc/routers/pages.ts`

| Procedure      | Type     | Input Schema                                              | Description                                  | Service Called                  |
|----------------|----------|-----------------------------------------------------------|----------------------------------------------|---------------------------------|
| `pages.list`   | query    | `{ siteId: string }`                                     | List all pages for a site (ordered)          | `page.service.listPages`       |
| `pages.get`    | query    | `{ pageId: string }`                                     | Get a single page with blocks                | `page.service.getPage`         |
| `pages.create` | mutation | `createPageSchema` (siteId, name, slug, blocks?, isHomePage?, seoTitle?, seoDescription?) | Create a new page (plan-limited) | `page.service.createPage`      |
| `pages.update` | mutation | `updatePageSchema` (pageId, name?, slug?, blocks?, seoTitle?, seoDescription?) | Update page content/metadata (conflict detection) | `page.service.updatePage`      |
| `pages.delete` | mutation | `deletePageSchema` (pageId, siteId)                      | Delete a page (cannot delete last page)      | `page.service.deletePage`      |

---

## 13. Forms Domain (`formsRouter`)

> Source: `server/trpc/routers/forms.ts`

| Procedure               | Type     | Input Schema                                              | Description                                    | Service Called                                |
|-------------------------|----------|-----------------------------------------------------------|------------------------------------------------|-----------------------------------------------|
| `forms.listBlocks`      | query    | `{ siteId: string }`                                     | List all form blocks for a site                | `form-submission.service.listFormBlocks`      |
| `forms.listSubmissions` | query    | `listSubmissionsSchema` (siteId, formBlockId, page, perPage, isRead?, isSpam?) | Paginated form submission list   | `form-submission.service.listSubmissions`     |
| `forms.updateSubmission`| mutation | `updateSubmissionSchema` (id, isRead?, isSpam?, isArchived?) | Update submission flags (read/spam/archive) | `form-submission.service.updateSubmission`    |
| `forms.deleteSubmission`| mutation | `{ id: string }`                                         | Delete a form submission                       | `form-submission.service.deleteSubmission`    |
| `forms.exportSubmissions`| query   | `{ siteId: string, formBlockId: string, format: "csv"\|"json" }` | Export submissions in CSV or JSON     | `form-submission.service.exportSubmissions`   |

---

## 14. Upload Domain (`uploadRouter`)

> Source: `server/trpc/routers/upload.ts`

| Procedure        | Type     | Input Schema                          | Description                                     | Service Called                         |
|------------------|----------|---------------------------------------|-------------------------------------------------|----------------------------------------|
| `upload.presign` | mutation | `presignSchema` (filename, type, size) | Generate a presigned upload URL                 | `upload.service.createPresignedUrl`    |
| `upload.confirm` | mutation | `confirmSchema` (fileId)              | Confirm a successful upload                      | `upload.service.confirmUpload`         |
| `upload.limits`  | query    | none                                  | Get upload size/format limits for current plan   | `upload.service.getUploadLimits`       |

---

## REST API Routes

> Source: `app/api/`

| Route                                              | Method | Auth     | Description                                                            |
|----------------------------------------------------|--------|----------|------------------------------------------------------------------------|
| `app/api/auth/[...nextauth]/route.ts`              | GET/POST | NextAuth | NextAuth catch-all handler for OAuth callbacks, CSRF, session endpoints |
| `app/api/auth/create-session/route.ts`             | POST   | none (token-based) | Exchanges a session_grant token for a signed JWT cookie. Creates DB session. Enforces 10-session limit. CSRF checks origin/referer |
| `app/api/auth/logout/route.ts`                     | POST   | cookie   | Decodes JWT, deletes all user sessions from DB, clears session cookie  |
| `app/api/trpc/[trpc]/route.ts`                     | GET/POST | tRPC   | tRPC catch-all handler for all procedures listed above                 |
| `app/api/webhooks/stripe/route.ts`                 | POST   | Stripe signature | Handles Stripe webhook events: `charge.failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid` |
| `app/api/public/forms/[siteId]/[formBlockId]/route.ts` | POST | none (public) | Public form submission endpoint for published sites. Validates form, checks submission limits, records IP |
| `app/api/share/[token]/verify-password/route.ts`   | POST   | none (public) | Verifies share link password. Sets a 24h cookie on success. Returns redirect URL to published site |

---

## Procedure Count Summary

| Domain        | Queries | Mutations | Total |
|---------------|---------|-----------|-------|
| Auth          | 1       | 13        | 14    |
| Dashboard     | 4       | 0         | 4     |
| Sites         | 4       | 13        | 17    |
| Folders       | 1       | 4         | 5     |
| Site Detail   | 5       | 8         | 13    |
| Domains       | 1       | 3         | 4     |
| Sharing       | 1       | 2         | 3     |
| Team          | 4       | 6         | 10    |
| Billing       | 4       | 4         | 8     |
| Account       | 8       | 17        | 25    |
| Notifications | 4       | 2         | 6     |
| Help          | 3       | 2         | 5     |
| Onboarding    | 1       | 6         | 7     |
| Templates     | 3       | 3         | 6     |
| Pages         | 2       | 3         | 5     |
| Forms         | 3       | 2         | 5     |
| Upload        | 1       | 2         | 3     |
| **Total**     | **50**  | **90**    | **140** |
| REST routes   | --      | --        | **7** |
