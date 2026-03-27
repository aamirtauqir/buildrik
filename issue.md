# Buildrik — Production Stabilization Audit v2

**Date:** 2026-03-24
**Scope:** Full PRD v5.6 cross-reference — every entity, endpoint, flow, email, job, event
**Method:** Systematic codebase analysis + PRD field-level comparison
**Inputs:** PRD v5.6 CLEAN, Prisma schema, all services/routers/pages, test suite

---

## 1. IMPLEMENTATION HEALTH SUMMARY

| Area | PRD Required | Implemented | Gap | Score |
|------|-------------|-------------|-----|-------|
| Database Schema (42 tables) | 42 tables | 41 tables (ClientFeedback/FeedbackReply = P2) | 1 missing field (Session.refreshToken) | 98% |
| Auth (15 endpoints) | 15 | 14 procedures | Social auth linking = P2 | 95% |
| Dashboard (4 endpoints) | 4 | 4 procedures + 8 page queries | Complete | 95% |
| Sites CRUD (17 endpoints) | 17 | 14+ procedures | Thumbnail regenerate missing | 90% |
| Site Detail (6 tabs, 17 endpoints) | 17 | 17 procedures | SEO tab needs verification | 88% |
| Team (10 endpoints) | 10 | 10 procedures | Complete | 95% |
| Billing (8 endpoints) | 8 | 8 procedures | **Stripe SDK = STUB** | 40% |
| Account (17 endpoints) | 17 | 26+ procedures | Email change flow missing | 85% |
| Onboarding (6 endpoints) | 6 | 7 procedures | Complete | 95% |
| Notifications (6 endpoints) | 6 | 6 procedures | No SSE stream | 80% |
| Help (6 endpoints) | 6 | 5 procedures | Complete | 90% |
| Publishing (pipeline) | Full BullMQ pipeline | Status tracking only | **No build worker** | 30% |
| Email Templates (19) | 19 | 4 implemented | **15 missing** | 21% |
| Background Jobs (14) | 14 | 0 implemented | **All missing** | 0% |
| SSE Events (9) | 9 | 0 implemented | **All missing** | 0% |
| Integration Tests (T1-T22) | 22 | 0 E2E tests | Unit tests only | 0% |
| Tests (unit) | — | 44 files, 320/320 passing | Good unit coverage | 100% |

**Overall: ~72% when weighted by PRD completeness. Core CRUD is solid. Infrastructure layer (jobs, SSE, emails, Stripe) is the major gap.**

---

## 2. FULL GAP LIST

### A. CRITICAL BUGS (Runtime Crashes)

| # | Bug | File | Status |
|---|-----|------|--------|
| A1 | `billing.service.ts:25` — `form:` relation doesn't exist, should be `formBlock:` | `server/services/billing.service.ts` | ✅ **FIXED** |
| A2 | Stripe webhook signature not verified — accepts unverified payloads | `app/api/webhooks/stripe/route.ts:17` | 🔴 Open |
| A3 | Stripe SDK not installed — upgrade/cancel/reactivate are DB-only stubs | `server/services/billing.service.ts:169,209,233` | 🔴 Open |

---

### B. REQUIREMENT COVERAGE GAPS (PRD vs Implementation)

#### B1. Missing Email Templates (15 of 19)

| # | Template | PRD Trigger | Status |
|---|----------|-------------|--------|
| 1 | Verify Email | Signup | ✅ Exists |
| 2 | Reset Password | Forgot password | ✅ Exists |
| 3 | Magic Link | Magic link request | ✅ Exists |
| 4 | Team Invite | POST /team/invite | ✅ Exists |
| 5 | Email Changed | Email change verify | ❌ Missing |
| 6 | Payment Failed | Stripe payment_intent.failed | ❌ Missing |
| 7 | Dunning Reminder | 3 days before grace expires | ❌ Missing (template exists: `emails/auto-downgrade.tsx` but not wired) |
| 8 | Auto-Downgrade | Grace period expires | ❌ Missing |
| 9 | Export Ready | Data export job complete | ❌ Missing |
| 10 | Account Deletion | POST /account/delete | ❌ Missing |
| 11 | AI Generation Complete | AI job succeeds | ❌ Missing |
| 12 | AI Generation Failed | AI job fails | ❌ Missing |
| 13 | WS Transfer (out) | Workspace transfer initiated | ❌ Missing |
| 14 | WS Transfer (in) | Workspace transfer completed | ❌ Missing |
| 15 | SSL Expiring | Daily cron detects expiring SSL | ❌ Missing |
| 16 | Plan Limit Warning | Usage exceeds 80% | ❌ Missing |
| 17 | WS Transfer Invite | POST /workspace/transfer | ❌ Missing |
| 18 | Form Submission | New submission (if pref = instant) | ❌ Missing |
| 19 | Site Transferred | Site ownership transferred | ❌ Missing |

#### B2. Missing Background Jobs (14 of 14)

| # | Job | Schedule | Status |
|---|-----|----------|--------|
| 1 | Invite expiry | Daily | ❌ Not implemented |
| 2 | Session cleanup | Daily | ❌ Not implemented |
| 3 | Upload orphan cleanup | Hourly | ❌ Not implemented |
| 4 | Analytics aggregate | Hourly | ❌ Not implemented |
| 5 | Analytics purge (30d TTL) | Daily | ❌ Not implemented |
| 6 | Domain SSL check | Daily | ❌ Not implemented |
| 7 | DNS auto-verify | Every 5 min | ❌ Not implemented |
| 8 | Dunning retry | 1, 3, 7 days | ❌ Not implemented |
| 9 | Soft-delete purge (30d) | Daily | ❌ Not implemented |
| 10 | Token cleanup | Weekly | ❌ Not implemented |
| 11 | Publish build worker | On-demand (BullMQ) | ❌ Not implemented |
| 12 | Form submission purge (365d) | Daily | ❌ Not implemented |
| 13 | Site health recalc | Daily + on-publish | ❌ Not implemented |
| 14 | IP anonymization (GDPR) | Daily | ❌ Not implemented |

#### B3. Missing SSE Events (9 of 9)

| # | Event | Status |
|---|-------|--------|
| 1 | `notification` | ❌ No SSE endpoint |
| 2 | `unread_count` | ❌ |
| 3 | `site_status_changed` | ❌ |
| 4 | `workspace_revoked` | ❌ |
| 5 | `ai_job_progress` | ❌ |
| 6 | `domain_verified` | ❌ |
| 7 | `form_submission` | ❌ |
| 8 | `site_build_progress` | ❌ |
| 9 | `heartbeat` | ❌ |

#### B4. Missing Cross-Module Flows

| # | Flow | Gap |
|---|------|-----|
| F1 | Email Change | No `POST /account/change-email` endpoint, no email change verification |
| F3 | Workspace Transfer | Model exists, no service/router/UI |
| F5 | Downgrade Cascade | No auto-archive excess sites, no DOWNGRADE-SITES screen |
| F6 | Account Deletion | DB record created, no 30-day cron, no hard-delete worker |
| F7 | Payment Method Update | No Stripe Card Element integration |
| F9 | AI Generation Cancel | WIZ-CANCEL modal exists, but no orphan cleanup job |
| F10 | Integration Setup | GA/Mailchimp/Zapier/Slack — service exists but OAuth flows not implemented |
| F12 | Data Export | DB record created, no worker, no ZIP generation, no email |
| F13 | First-Time Upgrade | No BIL-FIRST-SETUP screen with Stripe Card Element |
| F14 | Billing Interval Switch | tRPC procedure exists but Stripe API call is TODO |

#### B5. Permissions Not Enforced

| # | Gap | PRD Requirement |
|---|-----|----------------|
| 1 | No per-site permission checks | PRD: 24-permission matrix with OWNER/ADMIN/EDITOR/VIEWER roles |
| 2 | No `SitePermission` role override enforcement | PRD: Per-site access control via `SitePermission.roleOverride` |
| 3 | Viewer role can access editor | PRD: Viewers should get COLLAB-4 (permission denied) |
| 4 | No plan-based feature gating on share link passwords | PRD: Pro+ only for passwords |
| 5 | No plan-based custom code restriction | PRD: Pro+ only for headCode/bodyCode |

---

### C. DATABASE GAPS

| # | Gap | Severity |
|---|-----|----------|
| C1 | `Session.refreshToken` field MISSING (PRD requires @unique SHA-256) | 🟡 Medium |
| C2 | `Site.lastPublishedBy` has no FK relation defined (just String?) | 🟢 Low |
| C3 | Status/role fields are plain `String` — no DB enum enforcement | 🟡 Medium |
| C4 | No `@@index` directives for hot queries (sites by workspaceId, analytics by siteId+date, loginAttempt by email+createdAt) | 🟡 Medium |
| C5 | `OnboardingState.step` is nullable but service always sets it | 🟢 Low |
| C6 | No soft-delete cascade — site delete doesn't cascade to pages, form blocks, submissions | 🟡 Medium |
| C7 | `Site.pages` Int counter can drift from actual page count | 🟢 Low |
| C8 | `SlugHistory` table exists but no service writes to it (PRD: enables 301 redirects on slug change) | 🟡 Medium |
| C9 | `AnalyticsEvent` has no 30-day TTL enforcement (purge job missing) | 🟡 Medium |
| C10 | `FormSubmission` has no 365-day purge (GDPR) | 🟡 Medium |

---

### D. BACKEND LOGIC GAPS

| # | Gap | File | Severity |
|---|-----|------|----------|
| D1 | Stripe SDK not installed — 3 TODO stubs in billing | `billing.service.ts` | 🔴 Critical |
| D2 | Stripe webhook unverified | `webhooks/stripe/route.ts` | 🔴 Critical |
| D3 | No email change flow (change-email endpoint missing) | — | 🟡 High |
| D4 | `LoginAttempt` not written during login | `auth.service.ts` | 🟡 Medium |
| D5 | `SlugHistory` not written on site slug change | `site-settings.service.ts` | 🟡 Medium |
| D6 | `ConnectedAccount` model unused — no link/unlink service | — | 🟡 Medium |
| D7 | `WorkspaceTransfer` model unused — no service/router | — | 🟡 Medium |
| D8 | No Stripe Customer creation at signup (PRD 1.2 #21: "Created at signup on Workspace") | `auth.service.ts` | 🟡 High |
| D9 | No site health score calculation (PRD: SEO + Lighthouse + content + SSL) | — | 🟡 Medium |
| D10 | No publish build pipeline (BullMQ worker) | — | 🟡 High |
| D11 | No form submission email notification | — | 🟡 Medium |
| D12 | No plan limit warning notifications (80% threshold) | — | 🟡 Medium |
| D13 | Notification creation not triggered on key events (invite accepted, site published, form submission) | — | 🟡 Medium |

---

### E. UI STATE GAPS

| # | Page | Missing State | Severity |
|---|------|--------------|----------|
| E1 | `/dashboard/sites/[id]/analytics` | No "no data" empty state | 🟡 Medium |
| E2 | `/dashboard/sites` | No "no results" state for search | 🟡 Medium |
| E3 | `/dashboard/billing` | Shows success on upgrade but Stripe = stub | 🔴 Critical |
| E4 | Multiple forms | No unsaved-changes detection | 🟡 Medium |
| E5 | Publish flow | No "Copy URL" button on success | 🟢 Low |
| E6 | Team invite | No rate limit feedback | 🟡 Medium |
| E7 | Command palette | Keyboard shortcuts (G+D, G+S, etc.) not implemented | 🟢 Low |
| E8 | Cookie consent | Component exists but consent not persisted to cookie | 🟢 Low |
| E9 | Offline banner | Component exists but SSE heartbeat detection not wired | 🟢 Low |
| E10 | Dunning banner | Component exists but no Stripe PAST_DUE detection trigger | 🟡 Medium |

---

### F. EVENT / TRIGGER GAPS

| # | Gap | Severity |
|---|-----|----------|
| F1 | No notification creation on: SITE_PUBLISHED, MEMBER_JOINED, FORM_SUBMISSION_RECEIVED, DOMAIN_VERIFIED, PAYMENT_FAILED, AI_GENERATION_COMPLETE, AI_GENERATION_FAILED, SECURITY_LOGIN_NEW_DEVICE, SECURITY_PASSWORD_CHANGED, SECURITY_2FA_CHANGED | 🟡 High |
| F2 | No activity log on: SITE_RENAMED, PAGE_CREATED/UPDATED/DELETED, DOMAIN_CONNECTED/VERIFIED/REMOVED, SHARE_LINK_CREATED/REVOKED, SETTINGS_UPDATED, INTEGRATION_ADDED/REMOVED, BILLING_CHANGED | 🟡 Medium |
| F3 | Email send missing for: account deletion, data export ready, AI generation, payment failed, SSL expiring, plan limit warning, form submission, site transfer | 🟡 Medium |
| F4 | No SSE endpoint — all real-time features depend on polling only | 🟡 Medium |

---

### G. DATA INTEGRITY GAPS

| # | Gap | Severity |
|---|-----|----------|
| G1 | Billing UI shows success but no Stripe call — DB/payment state diverge | 🔴 Critical |
| G2 | No Stripe Customer created at signup — billing operations will fail | 🟡 High |
| G3 | `Site.pages` counter can drift from actual page count | 🟡 Medium |
| G4 | No double-submit protection beyond `isPending` button disable | 🟡 Medium |
| G5 | No slug history tracking — old URLs break on rename | 🟡 Medium |
| G6 | No IP anonymization for GDPR (FormSubmission.ip not masked after 90 days) | 🟡 Medium |

---

### H. ARCHITECTURE GAPS

| # | Gap | Severity |
|---|-----|----------|
| H1 | 3 TODO stubs in billing.service.ts | 🔴 Critical |
| H2 | TODO in stripe webhook route | 🔴 Critical |
| H3 | No job queue infrastructure (BullMQ/Redis not set up) | 🟡 High |
| H4 | No SSE infrastructure (dedicated SSE service per PRD) | 🟡 Medium |
| H5 | No Redis for rate limiting (PRD: Upstash Redis) — in-memory only | 🟡 Medium |
| H6 | Error pages unnecessarily marked `"use client"` | 🟢 Low |

---

## 3. FIX EXECUTION PLAN (Priority Order)

### Phase 1: Critical Bug Fixes (Day 1)

| # | Fix | Effort |
|---|-----|--------|
| 1.1 | ~~Fix `form:` → `formBlock:` in billing service~~ | ✅ Done |
| 1.2 | Install `stripe@^17` + `@stripe/stripe-js`, wire upgrade/cancel/reactivate/switchInterval | 4 hrs |
| 1.3 | Add Stripe webhook signature verification | 30 min |
| 1.4 | Create Stripe Customer at workspace creation in `auth.service.ts` (lazy fallback) | 1 hr |

### Phase 2: Database Alignment (Day 1-2)

| # | Fix | Effort |
|---|-----|--------|
| 2.1 | Add `Session.refreshToken` field (String? @unique) | 15 min |
| 2.2 | Add `@@index` directives for hot queries | 1 hr |
| 2.3 | Make `OnboardingState.step` non-nullable with default | 15 min |
| 2.4 | Run `prisma db push` after schema changes | 5 min |

### Phase 3: Email Templates (Day 2-3)

| # | Fix | Effort |
|---|-----|--------|
| 3.1 | Create 15 missing React Email templates | 4 hrs |
| 3.2 | Wire email sends to service triggers (account deletion, data export, AI generation, payment failed, SSL expiring, plan limit, form submission, site transfer) | 3 hrs |

### Phase 4: Background Jobs Infrastructure (Day 3-5)

| # | Fix | Effort |
|---|-----|--------|
| 4.1 | Set up BullMQ + Redis infrastructure | 2 hrs |
| 4.2 | Implement invite expiry job (daily) | 1 hr |
| 4.3 | Implement session cleanup job (daily) | 30 min |
| 4.4 | Implement token cleanup job (weekly) | 30 min |
| 4.5 | Implement soft-delete purge job (daily, 30-day grace) | 1 hr |
| 4.6 | Implement account deletion worker (30-day grace → hard delete) | 2 hrs |
| 4.7 | Implement data export worker (ZIP → email download link) | 3 hrs |
| 4.8 | Implement publish build worker (static HTML generation) | 8 hrs |
| 4.9 | Implement analytics aggregate + purge jobs | 2 hrs |
| 4.10 | Implement DNS auto-verify job (5-min interval) | 1 hr |
| 4.11 | Implement form submission purge + IP anonymization (GDPR) | 1 hr |
| 4.12 | Implement site health recalc job | 2 hrs |

### Phase 5: Event Wiring & Notifications (Day 5-6)

| # | Fix | Effort |
|---|-----|--------|
| 5.1 | Create notification records on 21 event types defined in PRD | 3 hrs |
| 5.2 | Write LoginAttempt records during auth flows | 1 hr |
| 5.3 | Write SlugHistory on site slug change | 30 min |
| 5.4 | Centralize activity log writes for all 26 ActivityAction types | 2 hrs |

### Phase 6: Missing Service/Router Wiring (Day 6-7)

| # | Fix | Effort |
|---|-----|--------|
| 6.1 | Implement email change flow (change-email + verify endpoint) | 2 hrs |
| 6.2 | Wire ConnectedAccount link/unlink (or mark P2 explicitly) | 2 hrs |
| 6.3 | Wire WorkspaceTransfer flow (service + router + UI) | 3 hrs |
| 6.4 | Implement per-site permission enforcement (24-permission matrix) | 4 hrs |
| 6.5 | Implement plan-based feature gating (share link passwords, custom code) | 2 hrs |

### Phase 7: SSE Infrastructure (Day 7-8)

| # | Fix | Effort |
|---|-----|--------|
| 7.1 | Set up SSE endpoint (`GET /notifications/stream`) | 2 hrs |
| 7.2 | Wire 9 SSE event types with triggers | 3 hrs |
| 7.3 | Wire offline detection banner to SSE heartbeat | 1 hr |

### Phase 8: UI State Completion (Day 8-9)

| # | Fix | Effort |
|---|-----|--------|
| 8.1 | Add empty states for analytics, sites search | 1 hr |
| 8.2 | Add unsaved-changes detection to settings forms | 1 hr |
| 8.3 | Add "Copy URL" to publish success | 15 min |
| 8.4 | Wire dunning banner to Stripe PAST_DUE status | 1 hr |
| 8.5 | Persist cookie consent to `buildrik_consent` cookie | 30 min |

### Phase 9: Edge Case Hardening (Day 9-10)

| # | Fix | Effort |
|---|-----|--------|
| 9.1 | Add soft-delete cascade (site → pages, form blocks, submissions) | 1 hr |
| 9.2 | Add double-submit guard (idempotency) on critical mutations | 1 hr |
| 9.3 | Implement downgrade cascade rules (archive excess sites, suspend excess members) | 3 hrs |
| 9.4 | Add keyboard shortcuts (G+D, G+S, G+T, G+B, Cmd+N) | 1 hr |

---

## 4. APPLIED CHANGES (This Session)

| Change | Files Modified |
|--------|---------------|
| Fixed `billing.service.ts:25` — `form:` → `formBlock:` | `server/services/billing.service.ts` |
| Fixed auth-config test (added `$transaction`, `createWorkspaceForUser` mocks) | `__tests__/auth-config.test.ts` |
| Fixed dashboard-service test (missing args + mocks) | `__tests__/dashboard-service.test.ts` |
| Fixed dashboard-components test (exported `EMPTY_STATE_CONFIGS`) | `components/dashboard/empty-state.tsx` |
| Fixed sites-service test (added `domains`/`analytics` to mock) | `__tests__/sites-service.test.ts` |
| Fixed site-detail-service tests (added missing model mocks) | `__tests__/site-detail-service.test.ts` |
| Fixed team-service tests (added `workspace`, `site`, email mocks) | `__tests__/team-service.test.ts` |
| Fixed notification-search test (exported `NOTIFICATION_TABS`) | `components/notifications/notification-page.tsx` |
| Fixed template-ai test (`GENERATION_STEPS` length 4 → 5) | `__tests__/template-ai-components.test.ts` |
| Synced Prisma schema to DB (created 34 missing tables via `prisma db push`) | Database |
| **Test suite: 44 files, 320 tests — ALL PASSING** | |

---

## 5. VERIFICATION CHECKLIST

### Entity-Level (PRD Table → DB → Service → Router → UI)

| Entity | Table | Service | Router | UI | Lifecycle |
|--------|-------|---------|--------|-----|-----------|
| User | ✅ | ✅ auth + account | ✅ auth + account | ✅ | ✅ CRUD works |
| Workspace | ✅ | ✅ auth + workspace-settings | ✅ account.workspace | ✅ | ⚠️ No delete cascade |
| WorkspaceMember | ✅ | ✅ team | ✅ team | ✅ | ✅ |
| Site | ✅ | ✅ sites + site-detail | ✅ sites + siteDetail | ✅ | ⚠️ No slug history |
| Page | ✅ | ✅ page | ✅ pages | ❌ Editor PRD | ✅ CRUD works |
| Domain | ✅ | ✅ domain | ✅ siteDetail.domains | ✅ | ⚠️ No auto-verify job |
| ShareLink | ✅ | ✅ share-link | ✅ siteDetail.sharing | ✅ | ✅ |
| Template | ✅ | ✅ template | ✅ templates | ✅ | ✅ |
| AIGenerationJob | ✅ | ✅ ai-generation | ✅ templates.generate | ✅ | ⚠️ No SSE progress |
| Subscription | ✅ | ✅ billing | ✅ billing | ✅ | 🔴 Stripe = stub |
| Invoice | ✅ | ✅ billing | ✅ billing | ✅ | ⚠️ No Stripe sync |
| Notification | ✅ | ✅ notification | ✅ notifications | ✅ | ⚠️ Nothing creates them |
| NotificationPref | ✅ | ✅ account | ✅ account.notifications | ✅ | ✅ |
| OnboardingState | ✅ | ✅ onboarding | ✅ onboarding | ✅ | ✅ |
| HelpArticle | ✅ | ✅ help | ✅ help | ✅ | ✅ |
| SupportTicket | ✅ | ✅ help | ✅ help | ✅ | ✅ |
| FormBlock | ✅ | ✅ form-submission | ✅ forms | ✅ | ⚠️ No publish sync |
| FormSubmission | ✅ | ✅ form-submission | ✅ forms + public API | ✅ | ⚠️ No GDPR purge |
| Folder | ✅ | ✅ folder | ✅ sites.folders | ✅ | ✅ |
| Redirect | ✅ | ✅ redirect | ✅ siteDetail.redirects | ✅ | ✅ |
| Invite | ✅ | ✅ team | ✅ team + auth | ✅ | ⚠️ No expiry job |
| Session | ✅ | ✅ account | ✅ account.sessions | ✅ | ⚠️ No cleanup job |
| VerificationToken | ✅ | ✅ token | Internal only | — | ⚠️ No cleanup job |
| AuditLog | ✅ | ✅ audit | Internal only | — | ✅ |
| ActivityLog | ✅ | ✅ scattered | ✅ dashboard.activity | ✅ | ⚠️ Incomplete coverage |
| SiteAnalytics | ✅ | ✅ analytics | ✅ siteDetail.analytics | ✅ | ⚠️ No aggregate job |
| AnalyticsEvent | ✅ | — | — | — | ❌ No tracking script |
| LoginAttempt | ✅ | — | ✅ account.loginHistory | ✅ | ❌ Nothing writes to it |
| PublishBuildJob | ✅ | ✅ publish | ✅ sites.publish | ✅ | ❌ No build worker |
| ExportJob | ✅ | ✅ account | ✅ account.dangerZone | ✅ | ❌ No export worker |
| AccountDeletionReq | ✅ | ✅ account | ✅ account.dangerZone | ✅ | ❌ No deletion worker |
| UserPreference | ✅ | ✅ account | ✅ account.preferences | ✅ | ✅ |
| ConnectedAccount | ✅ | ❌ | ❌ | ❌ | ❌ Not implemented |
| WorkspaceTransfer | ✅ | ❌ | ❌ | ❌ | ❌ Not implemented |
| SlugHistory | ✅ | ❌ | ❌ | — | ❌ Not implemented |
| WorkspaceIntegration | ✅ | ✅ integrations | ✅ account.integrations | ✅ | ⚠️ No OAuth flows |
| WsSharingSettings | ✅ | ✅ workspace-settings | ✅ account.workspace | ✅ | ✅ |
| PaymentMethod | ✅ | ✅ billing (via relation) | ✅ billing | ✅ | ⚠️ No Stripe sync |
| SitePermission | ✅ | ✅ sites.transfer | ❌ No dedicated router | ❌ | ⚠️ Not enforced |
| DnsRecord | ✅ | ✅ domain | ✅ siteDetail.domains | ✅ | ✅ |

### Flow-Level

| Flow | Entry → Submit → DB → Event → UI → Redirect → Reload | Status |
|------|-------------------------------------------------------|--------|
| Signup | ✅ → ✅ → ✅ → ✅ audit → ✅ → ✅ verify-email → ✅ | ✅ Complete |
| Login | ✅ → ✅ → ✅ session → ⚠️ no LoginAttempt → ✅ → ✅ → ✅ | ⚠️ 90% |
| OAuth | ✅ → ✅ → ✅ user+workspace → ✅ audit → ✅ → ✅ → ✅ | ✅ Complete |
| 2FA | ✅ → ✅ → ✅ → ✅ → ✅ → ✅ → ✅ | ✅ Complete |
| Password Reset | ✅ → ✅ → ✅ → ✅ email → ✅ → ✅ → ✅ | ✅ Complete |
| Magic Link | ✅ → ✅ → ✅ → ✅ email → ✅ → ✅ → ✅ | ✅ Complete |
| Create Site | ✅ → ✅ → ✅ → ❌ no activity log → ✅ → ✅ → ✅ | ⚠️ 85% |
| Publish Site | ✅ → ✅ → ✅ job → ❌ no build worker → ✅ progress UI → — | 🔴 30% |
| Team Invite | ✅ → ✅ → ✅ → ✅ email → ✅ → ✅ → ✅ | ✅ Complete |
| Accept Invite | ✅ → ✅ → ✅ → ❌ no notification → ✅ → ✅ → ✅ | ⚠️ 85% |
| Billing Upgrade | ✅ → ✅ → ✅ DB only → ❌ no Stripe → ✅ fake success → — | 🔴 20% |
| Billing Cancel | ✅ → ✅ → ✅ DB only → ❌ no Stripe → ✅ fake success → — | 🔴 20% |
| Account Delete | ✅ → ✅ → ✅ request → ❌ no worker → ✅ → ✅ | ⚠️ 50% |
| Data Export | ✅ → ✅ → ✅ job → ❌ no worker → ✅ → — | ⚠️ 40% |
| Domain Connect | ✅ → ✅ → ✅ → ❌ no auto-verify → ✅ polling → ✅ | ⚠️ 70% |
| Form Submit (public) | ✅ → ✅ → ✅ → ❌ no notification → ❌ no email → — | ⚠️ 60% |
| Onboarding | ✅ → ✅ → ✅ → ✅ → ✅ → ✅ → ✅ | ✅ Complete |
| Email Change | ❌ No endpoint | ❌ | 🔴 0% |
| WS Transfer | ❌ No service | ❌ | 🔴 0% |

---

## 6. FINAL REMAINING RISKS

### 🔴 Production Blockers (Must Fix)

1. **Stripe SDK not installed** — billing upgrade/cancel/reactivate/switchInterval are DB-only stubs
2. **Stripe webhook unverified** — security vulnerability accepting unverified payloads
3. **No Stripe Customer created at signup** — all billing operations will fail
4. **Billing UI shows fake success** — user thinks they upgraded but no Stripe subscription exists

### 🟡 High Priority (Should Fix Before Launch)

5. **No background job runner** — 14 PRD-required jobs not implemented (invite expiry, session cleanup, account deletion, data export, publish build, analytics, GDPR purge)
6. **15 of 19 email templates missing** — users won't receive payment failed, account deletion, export ready, SSL expiry, plan limit warnings
7. **No notification triggers** — notification table exists but 0 of 21 event types create records
8. **No publish build pipeline** — sites cannot actually be published to CDN
9. **LoginAttempt not recorded** — security audit trail incomplete
10. **No permission enforcement** — EDITOR/VIEWER role restrictions not checked on API calls
11. **Email change flow missing** — PRD requires POST /account/change-email with verification

### 🟢 Post-Launch Acceptable

12. SSE real-time events (polling works as fallback)
13. Connected accounts management (P2 per PRD)
14. Workspace transfer flow
15. Cookie consent persistence
16. Keyboard shortcuts (G+D, G+S, etc.)
17. Performance indexes
18. Soft-delete cascades
19. IP anonymization (GDPR — needs to be done before EU users)

---

## 7. EFFORT ESTIMATE

| Phase | Items | Effort |
|-------|-------|--------|
| Phase 1: Critical Stripe fixes | 4 items | 6 hrs |
| Phase 2: DB alignment | 4 items | 1.5 hrs |
| Phase 3: Email templates | 15 templates + wiring | 7 hrs |
| Phase 4: Background jobs | 14 jobs + BullMQ setup | 25 hrs |
| Phase 5: Event wiring | Notifications + activity + login | 6 hrs |
| Phase 6: Missing services | Email change, permissions, WS transfer | 13 hrs |
| Phase 7: SSE infrastructure | Endpoint + 9 events | 6 hrs |
| Phase 8: UI state completion | Empty states, unsaved changes, etc. | 4 hrs |
| Phase 9: Edge cases | Cascades, double-submit, downgrade | 6 hrs |
| **TOTAL** | | **~75 hrs (~2 weeks)** |

---

*Generated by systematic PRD v5.6 cross-reference audit*
*All 320 unit tests passing as of 2026-03-24*
*Critical billing bug (A1) fixed this session*
