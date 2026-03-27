# Sub-Project 1: Database Schema + Dashboard Layout Shell

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Prisma schema from 7 models to 41 models (all PRD Section 10 tables + 23 enums), and build the dashboard layout shell (sidebar, topbar, breadcrumbs, toast system) that every future module depends on.

**Architecture:** Prisma schema uses string-typed fields for enums (matching existing pattern in codebase). Dashboard layout uses Next.js App Router nested layout at `app/dashboard/layout.tsx` with a fixed sidebar (220px) + topbar (56px) + main content area. All dashboard components live in `components/dashboard/`. Toast system is global via React context.

**Tech Stack:** Prisma 5, Next.js 16 (App Router), React 19, Tailwind CSS 4, tRPC 11, Lucide React icons, Vitest

**PRD Reference:** `/Users/shahg/Desktop/pencil/Buildrik_PRD_v5.6_CLEAN.md` — Section 10 (Database), Section 2 (Design System), Section 3 (Navigation), Section 6 (Components)

---

## File Structure

### Files to Create

| File | Responsibility |
|------|---------------|
| `lib/constants/enums.ts` | All 23 enum constant objects (shared between Prisma seed, services, and UI) |
| `lib/constants/plan-limits.ts` | Plan limit constants (Free/Pro/Business) from PRD Section 1.7 |
| `lib/constants/design-tokens.ts` | Dashboard color tokens, spacing, radius from PRD Section 2 |
| `components/dashboard/sidebar.tsx` | 220px fixed sidebar with 5 nav items + workspace info |
| `components/dashboard/topbar.tsx` | 56px topbar with search trigger, bell, help, avatar |
| `components/dashboard/breadcrumb.tsx` | Path navigation component |
| `components/dashboard/toast.tsx` | Toast notification component (4 variants) |
| `components/dashboard/toast-provider.tsx` | React context for toast system |
| `app/dashboard/layout.tsx` | Dashboard shell layout (sidebar + topbar + content) |
| `app/dashboard/page.tsx` | Dashboard home placeholder (DASH-1 skeleton) |
| `app/dashboard/sites/page.tsx` | Sites placeholder |
| `app/dashboard/team/page.tsx` | Team placeholder |
| `app/dashboard/billing/page.tsx` | Billing placeholder |
| `app/dashboard/settings/page.tsx` | Settings placeholder |
| `app/dashboard/settings/layout.tsx` | Settings sub-nav layout (8 tabs) |
| `__tests__/schema-integrity.test.ts` | Tests that Prisma schema has all models |
| `__tests__/plan-limits.test.ts` | Tests for plan limit constants |
| `__tests__/enums.test.ts` | Tests for enum completeness |
| `__tests__/dashboard-layout.test.ts` | Tests for sidebar nav items, topbar elements |
| `__tests__/toast.test.ts` | Tests for toast system |

### Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add 34 new models + update existing models with missing fields |
| `app/layout.tsx` | Add ToastProvider wrapper |

---

## Task 1: Add Enum Constants

**Files:**
- Create: `lib/constants/enums.ts`
- Test: `__tests__/enums.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/enums.test.ts
import { describe, it, expect } from "vitest";
import {
  AuthProvider,
  UserRole,
  SiteStatus,
  SiteCreationMethod,
  InviteStatus,
  MemberStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingInterval,
  InvoiceStatus,
  DomainStatus,
  SslStatus,
  NotificationType,
  OnboardingRole,
  TicketCategory,
  TicketStatus,
  IntegrationProvider,
  TemplateCategory,
  AIJobStatus,
  ActivityAction,
  BlockType,
  VerificationTokenType,
  OnboardingStep,
} from "@/lib/constants/enums";

describe("Enums", () => {
  it("AuthProvider has 3 values", () => {
    expect(Object.values(AuthProvider)).toHaveLength(3);
    expect(AuthProvider.EMAIL).toBe("EMAIL");
    expect(AuthProvider.GOOGLE).toBe("GOOGLE");
    expect(AuthProvider.GITHUB).toBe("GITHUB");
  });

  it("UserRole has 4 values", () => {
    expect(Object.values(UserRole)).toHaveLength(4);
    expect(UserRole.OWNER).toBe("OWNER");
    expect(UserRole.ADMIN).toBe("ADMIN");
    expect(UserRole.EDITOR).toBe("EDITOR");
    expect(UserRole.VIEWER).toBe("VIEWER");
  });

  it("SiteStatus has 3 values", () => {
    expect(Object.values(SiteStatus)).toHaveLength(3);
    expect(SiteStatus.DRAFT).toBe("DRAFT");
    expect(SiteStatus.PUBLISHED).toBe("PUBLISHED");
    expect(SiteStatus.ARCHIVED).toBe("ARCHIVED");
  });

  it("SiteCreationMethod has 3 values", () => {
    expect(Object.values(SiteCreationMethod)).toHaveLength(3);
  });

  it("InviteStatus has 4 values", () => {
    expect(Object.values(InviteStatus)).toHaveLength(4);
  });

  it("MemberStatus has 2 values", () => {
    expect(Object.values(MemberStatus)).toHaveLength(2);
    expect(MemberStatus.ACTIVE).toBe("ACTIVE");
    expect(MemberStatus.SUSPENDED).toBe("SUSPENDED");
  });

  it("SubscriptionPlan has 3 values", () => {
    expect(Object.values(SubscriptionPlan)).toHaveLength(3);
  });

  it("SubscriptionStatus has 4 values", () => {
    expect(Object.values(SubscriptionStatus)).toHaveLength(4);
  });

  it("BillingInterval has 2 values", () => {
    expect(Object.values(BillingInterval)).toHaveLength(2);
  });

  it("InvoiceStatus has 4 values", () => {
    expect(Object.values(InvoiceStatus)).toHaveLength(4);
  });

  it("DomainStatus has 3 values", () => {
    expect(Object.values(DomainStatus)).toHaveLength(3);
  });

  it("SslStatus has 3 values", () => {
    expect(Object.values(SslStatus)).toHaveLength(3);
  });

  it("NotificationType has 21 values", () => {
    expect(Object.values(NotificationType)).toHaveLength(21);
    expect(NotificationType.FORM_SUBMISSION_RECEIVED).toBe("FORM_SUBMISSION_RECEIVED");
    expect(NotificationType.SECURITY_LOGIN_NEW_DEVICE).toBe("SECURITY_LOGIN_NEW_DEVICE");
  });

  it("OnboardingRole has 3 values", () => {
    expect(Object.values(OnboardingRole)).toHaveLength(3);
  });

  it("TicketCategory has 6 values", () => {
    expect(Object.values(TicketCategory)).toHaveLength(6);
  });

  it("TicketStatus has 4 values", () => {
    expect(Object.values(TicketStatus)).toHaveLength(4);
  });

  it("IntegrationProvider has 4 values", () => {
    expect(Object.values(IntegrationProvider)).toHaveLength(4);
  });

  it("TemplateCategory has 6 values", () => {
    expect(Object.values(TemplateCategory)).toHaveLength(6);
  });

  it("AIJobStatus has 7 values", () => {
    expect(Object.values(AIJobStatus)).toHaveLength(7);
  });

  it("ActivityAction has 26 values", () => {
    expect(Object.values(ActivityAction)).toHaveLength(26);
  });

  it("BlockType has 12 values", () => {
    expect(Object.values(BlockType)).toHaveLength(12);
    expect(BlockType.HEADING).toBe("HEADING");
    expect(BlockType.FORM).toBe("FORM");
  });

  it("VerificationTokenType has 4 values", () => {
    expect(Object.values(VerificationTokenType)).toHaveLength(4);
  });

  it("OnboardingStep has 6 values", () => {
    expect(Object.values(OnboardingStep)).toHaveLength(6);
  });

  it("all 23 enum objects are exported", () => {
    const enums = [
      AuthProvider, UserRole, SiteStatus, SiteCreationMethod, InviteStatus,
      MemberStatus, SubscriptionPlan, SubscriptionStatus, BillingInterval,
      InvoiceStatus, DomainStatus, SslStatus, NotificationType, OnboardingRole,
      TicketCategory, TicketStatus, IntegrationProvider, TemplateCategory,
      AIJobStatus, ActivityAction, BlockType, VerificationTokenType, OnboardingStep,
    ];
    expect(enums).toHaveLength(23);
    enums.forEach((e) => expect(typeof e).toBe("object"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/enums.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `lib/constants/enums.ts` with all 23 enum constant objects. Each enum is a `const` object with string values matching PRD Section 10.1. Include type helper exports for each enum (e.g., `export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]`).

Full enum values:
- **AuthProvider(3):** EMAIL, GOOGLE, GITHUB
- **UserRole(4):** OWNER, ADMIN, EDITOR, VIEWER
- **SiteStatus(3):** DRAFT, PUBLISHED, ARCHIVED
- **SiteCreationMethod(3):** BLANK, TEMPLATE, AI
- **InviteStatus(4):** PENDING, ACCEPTED, DECLINED, EXPIRED
- **MemberStatus(2):** ACTIVE, SUSPENDED
- **SubscriptionPlan(3):** FREE, PRO, BUSINESS
- **SubscriptionStatus(4):** ACTIVE, PAST_DUE, CANCELLED, INCOMPLETE
- **BillingInterval(2):** MONTHLY, YEARLY
- **InvoiceStatus(4):** PAID, FAILED, PENDING, REFUNDED
- **DomainStatus(3):** PENDING, VERIFIED, FAILED
- **SslStatus(3):** PENDING, ACTIVE, EXPIRED
- **NotificationType(21):** SITE_PUBLISHED, SITE_PUBLISH_FAILED, SITE_TRANSFERRED, SITE_ARCHIVED, SITE_DUPLICATED, MEMBER_JOINED, MEMBER_REMOVED, MEMBER_ROLE_CHANGED, PAYMENT_FAILED, PLAN_LIMIT_WARNING, SUBSCRIPTION_CHANGED, DOMAIN_VERIFIED, DOMAIN_ERROR, DOMAIN_SSL_EXPIRING, SHARE_LINK_VIEWED, FORM_SUBMISSION_RECEIVED, AI_GENERATION_COMPLETE, AI_GENERATION_FAILED, SECURITY_LOGIN_NEW_DEVICE, SECURITY_PASSWORD_CHANGED, SECURITY_2FA_CHANGED
- **OnboardingRole(3):** FREELANCER, SMALL_TEAM, AGENCY
- **TicketCategory(6):** GENERAL, BILLING, TECHNICAL, ACCOUNT, FEATURE, BUG
- **TicketStatus(4):** OPEN, IN_PROGRESS, RESOLVED, CLOSED
- **IntegrationProvider(4):** GOOGLE_ANALYTICS, MAILCHIMP, ZAPIER, SLACK
- **TemplateCategory(6):** PORTFOLIO, BUSINESS, BLOG, AGENCY, ECOMMERCE, RESTAURANT
- **AIJobStatus(7):** QUEUED, GENERATING_STRUCTURE, GENERATING_CONTENT, GENERATING_STYLES, COMPLETED, FAILED, CANCELLED
- **ActivityAction(26):** SITE_CREATED, SITE_PUBLISHED, SITE_UNPUBLISHED, SITE_ARCHIVED, SITE_UNARCHIVED, SITE_DELETED, SITE_DUPLICATED, SITE_TRANSFERRED, SITE_RENAMED, PAGE_CREATED, PAGE_UPDATED, PAGE_DELETED, MEMBER_INVITED, MEMBER_JOINED, MEMBER_REMOVED, MEMBER_ROLE_CHANGED, DOMAIN_CONNECTED, DOMAIN_VERIFIED, DOMAIN_REMOVED, SHARE_LINK_CREATED, SHARE_LINK_REVOKED, SETTINGS_UPDATED, INTEGRATION_ADDED, INTEGRATION_REMOVED, BILLING_CHANGED, AI_SITE_GENERATED
- **BlockType(12):** HEADING, PARAGRAPH, IMAGE, VIDEO, BUTTON, COLUMNS, HERO, GALLERY, FORM, DIVIDER, EMBED, CODE
- **VerificationTokenType(4):** EMAIL_VERIFY, PASSWORD_RESET, MAGIC_LINK, EMAIL_CHANGE
- **OnboardingStep(6):** ROLE_SELECT, PROJECT_SETUP, SITE_CREATION, EDITOR_TOUR, CHECKLIST, COMPLETED

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/enums.test.ts`
Expected: All 24 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/constants/enums.ts __tests__/enums.test.ts
git commit -m "feat: add all 23 enum constant objects with type helpers (PRD Section 10.1)"
```

---

## Task 2: Add Plan Limit Constants

**Files:**
- Create: `lib/constants/plan-limits.ts`
- Test: `__tests__/plan-limits.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/plan-limits.test.ts
import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, getPlanLimit } from "@/lib/constants/plan-limits";

describe("Plan Limits", () => {
  it("has all 3 plans", () => {
    expect(PLAN_LIMITS.FREE).toBeDefined();
    expect(PLAN_LIMITS.PRO).toBeDefined();
    expect(PLAN_LIMITS.BUSINESS).toBeDefined();
  });

  it("Free plan has correct site limit", () => {
    expect(PLAN_LIMITS.FREE.sites).toBe(3);
  });

  it("Pro plan has correct site limit", () => {
    expect(PLAN_LIMITS.PRO.sites).toBe(15);
  });

  it("Business plan has correct site limit", () => {
    expect(PLAN_LIMITS.BUSINESS.sites).toBe(50);
  });

  it("Free plan pages per site is 10", () => {
    expect(PLAN_LIMITS.FREE.pagesPerSite).toBe(10);
  });

  it("Pro plan pages per site is 30", () => {
    expect(PLAN_LIMITS.PRO.pagesPerSite).toBe(30);
  });

  it("Business plan pages per site is 50", () => {
    expect(PLAN_LIMITS.BUSINESS.pagesPerSite).toBe(50);
  });

  it("Free plan has 0 custom domains", () => {
    expect(PLAN_LIMITS.FREE.customDomains).toBe(0);
  });

  it("Free plan has 3 AI generations", () => {
    expect(PLAN_LIMITS.FREE.aiGenerations).toBe(3);
  });

  it("Business plan has -1 (unlimited) AI generations", () => {
    expect(PLAN_LIMITS.BUSINESS.aiGenerations).toBe(-1);
  });

  it("getPlanLimit returns correct value", () => {
    expect(getPlanLimit("FREE", "sites")).toBe(3);
    expect(getPlanLimit("PRO", "teamMembers")).toBe(5);
    expect(getPlanLimit("BUSINESS", "formSubmissions")).toBe(-1);
  });

  it("Free plan share link max expiry is 7 days", () => {
    expect(PLAN_LIMITS.FREE.shareLinkExpiryMaxDays).toBe(7);
  });

  it("Free plan has no share link passwords", () => {
    expect(PLAN_LIMITS.FREE.shareLinkPasswords).toBe(false);
  });

  it("Pro plan has share link passwords", () => {
    expect(PLAN_LIMITS.PRO.shareLinkPasswords).toBe(true);
  });

  it("Pro pricing is correct", () => {
    expect(PLAN_LIMITS.PRO.priceMonthly).toBe(29);
    expect(PLAN_LIMITS.PRO.priceYearly).toBe(23);
  });

  it("all resource keys are present for each plan", () => {
    const requiredKeys = [
      "sites", "pagesPerSite", "customDomains", "teamMembers",
      "storageMB", "bandwidthMB", "aiGenerations", "fileUploadMaxMB",
      "formSubmissions", "urlRedirects", "integrations",
      "analyticsRetentionDays", "shareLinkExpiryMaxDays",
      "shareLinkPasswords", "priceMonthly", "priceYearly",
    ];
    for (const plan of ["FREE", "PRO", "BUSINESS"] as const) {
      for (const key of requiredKeys) {
        expect(PLAN_LIMITS[plan]).toHaveProperty(key);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/plan-limits.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `lib/constants/plan-limits.ts` with the `PLAN_LIMITS` object containing all 3 tiers and all resource limits from PRD Section 1.7. Use `-1` for unlimited values. Export `getPlanLimit(plan, key)` helper. Values:

| Limit | Free | Pro | Business |
|-------|------|-----|----------|
| sites | 3 | 15 | 50 |
| pagesPerSite | 10 | 30 | 50 |
| customDomains | 0 | 3 | 20 |
| teamMembers | 1 | 5 | 25 |
| storageMB | 500 | 5120 | 51200 |
| bandwidthMB | 1024 | 10240 | 102400 |
| aiGenerations | 3 | 20 | -1 |
| fileUploadMaxMB | 10 | 50 | 200 |
| formSubmissions | 100 | 2500 | -1 |
| urlRedirects | 100 | 500 | -1 |
| integrations | 0 | 2 | -1 |
| analyticsRetentionDays | 7 | 30 | 90 |
| shareLinkExpiryMaxDays | 7 | 30 | 90 |
| shareLinkPasswords | false | true | true |
| priceMonthly | 0 | 29 | 79 |
| priceYearly | 0 | 23 | 63 |

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/plan-limits.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/constants/plan-limits.ts __tests__/plan-limits.test.ts
git commit -m "feat: add plan limit constants for Free/Pro/Business tiers (PRD Section 1.7)"
```

---

## Task 3: Add Design Token Constants

**Files:**
- Create: `lib/constants/design-tokens.ts`

- [ ] **Step 1: Write implementation**

Create `lib/constants/design-tokens.ts` with color tokens (PRD Section 2.1), toast variant colors (PRD Section 6.3), spacing/radius tokens (PRD Section 2.4), and layout dimensions (sidebar 220px, topbar 56px, content max 1220px, padding 32px).

- [ ] **Step 2: Commit**

```bash
git add lib/constants/design-tokens.ts
git commit -m "feat: add dashboard design token constants (PRD Section 2)"
```

---

## Task 4: Expand Prisma Schema — Update Existing Models

**Files:**
- Modify: `prisma/schema.prisma`

This task updates the 7 existing models to match PRD Section 10 exactly.

- [ ] **Step 1: Update User model**

Add `emailBounceCount Int @default(0)` and `deletedAt DateTime?` fields.

- [ ] **Step 2: Update Workspace model**

Replace with PRD-compliant version: add `defaultLanguage`, `timezone`, `stripeCustomerId` (unique), `deletionScheduledAt`, `deletedAt`. Change `plan` default from `"free"` to `"FREE"`. Remove `url` field (replaced by slug). Add relations: `sites`, `invites`, `subscription`, `integrations`, `sharingSettings`, `folders`, `activityLogs`.

- [ ] **Step 3: Update WorkspaceMember model**

Add `status String @default("ACTIVE")`, `invitedBy String?`, `lastActiveAt DateTime?`, `suspendedAt DateTime?`. Change `role` default from `"editor"` to `"EDITOR"`. Add `sitePermissions SitePermission[]` relation.

- [ ] **Step 4: Run prisma validate**

Run: `npx prisma validate`
Expected: `The schema file is valid`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: update existing Prisma models with missing PRD fields"
```

---

## Task 5: Expand Prisma Schema — Core Business Models (Site, Page, Domain, Folder)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Site model**

All fields from PRD Table 7: id, workspaceId, name, slug(@unique), status, template, creationMethod, thumbnail, pages(Int), aiJobId, lastEditedAt, lastPublishedAt, lastPublishError, publishedUrl, createdBy, headCode, bodyCode, socialLinks(Json), publishedPassword, metaTitleTemplate, touchIcon, folderId(FK), lastPublishedBy, deletedAt, createdAt, updatedAt. Relations to Workspace, Folder, Page[], Domain[], ShareLink[], SitePermission[], SiteAnalytics[], FormBlock[], FormSubmission[], Redirect[], SlugHistory[], PublishBuildJob[], AnalyticsEvent[]. Index: `[workspaceId, status]`.

- [ ] **Step 2: Add Page model**

PRD Table 42: id, siteId(FK), name(VarChar 100), slug(VarChar 100), position(Int), blocks(Json default "[]"), isHomePage(Boolean), seoTitle(VarChar 60?), seoDescription(VarChar 160?), createdAt, updatedAt. Unique: `[siteId, slug]`.

- [ ] **Step 3: Add Domain and DnsRecord models**

Domain (PRD Table 9): id, siteId(FK), domain(@unique GLOBAL), status, sslStatus, sslExpiresAt, lastCheckedAt, autoRenewSsl. DnsRecord (PRD Table 10): id, domainId(FK), type, host, value, verified.

- [ ] **Step 4: Add Folder model**

PRD Table 39: id, workspaceId(FK), name, position, createdAt. Index: `[workspaceId]`.

- [ ] **Step 5: Run prisma validate**

Run: `npx prisma validate`
Expected: Valid

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Site, Page, Domain, DnsRecord, Folder Prisma models"
```

---

## Task 6: Expand Prisma Schema — Collaboration Models (Invite, ShareLink, SitePermission)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Invite model**

PRD Table 6: id, workspaceId(FK), email, role, message, token(@unique), status, invitedBy, siteIds(String[]), expiresAt, createdAt. Index: `[workspaceId, status]`.

- [ ] **Step 2: Add ShareLink model**

PRD Table 11: id, siteId(FK), name, token(@unique), passwordHash, expiresAt, viewCount, isActive, createdAt. Index: `[siteId, isActive]`.

- [ ] **Step 3: Add SitePermission model**

PRD Table 8: id, memberId(FK WorkspaceMember), siteId(FK Site), roleOverride, grantedBy, grantedByName, createdAt. Unique: `[memberId, siteId]`.

- [ ] **Step 4: Run prisma validate and commit**

```bash
npx prisma validate
git add prisma/schema.prisma
git commit -m "feat: add Invite, ShareLink, SitePermission Prisma models"
```

---

## Task 7: Expand Prisma Schema — Billing Models (Subscription, PaymentMethod, Invoice)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Subscription model**

PRD Table 14: id, workspaceId(@unique FK), stripeSubscriptionId(@unique), stripeCurrentPeriodStart, stripeCurrentPeriodEnd, stripePriceId, plan, status, interval, price(Int), currency, cancelAtPeriodEnd, isGrandfathered, createdAt, updatedAt. Relation to PaymentMethod.

- [ ] **Step 2: Add PaymentMethod model**

PRD Table 15: id, subscriptionId(@unique FK), stripePaymentMethodId, type, brand, last4, expMonth, expYear.

- [ ] **Step 3: Add Invoice model**

PRD Table 16: id, workspaceId, stripeInvoiceId(@unique), amount, currency, status, pdfUrl, periodStart, periodEnd, paidAt, createdAt. Index: `[workspaceId]`.

- [ ] **Step 4: Run prisma validate and commit**

```bash
npx prisma validate
git add prisma/schema.prisma
git commit -m "feat: add Subscription, PaymentMethod, Invoice Prisma models"
```

---

## Task 8: Expand Prisma Schema — Notification, Activity, Onboarding Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Notification model**

PRD Table 17: id, userId, type, actorId, actorName, message, actionUrl, read, emailSent, priority, createdAt. Index: `[userId, read]`.

- [ ] **Step 2: Add NotificationPref model**

PRD Table 18: id, userId, category, inApp(bool), email(String). Unique: `[userId, category]`.

- [ ] **Step 3: Add ActivityLog model (new — different from existing AuditLog)**

PRD Table 19: id, workspaceId(FK), siteId, actorId, action, targetType, targetId, description, metadata(Json), createdAt. Index: `[workspaceId, createdAt]`. **Note:** This is distinct from the existing `AuditLog` model which tracks auth security events. This `ActivityLog` tracks workspace-level business activity.

- [ ] **Step 4: Add OnboardingState model**

PRD Table 20: id, userId(@unique), role, step, projectName, method, dashboardTasks(Json), editorTasks(Json), tourStep(Int), tourCompleted, completed, dismissed, createdAt, updatedAt.

- [ ] **Step 5: Run prisma validate and commit**

```bash
npx prisma validate
git add prisma/schema.prisma
git commit -m "feat: add Notification, NotificationPref, ActivityLog, OnboardingState models"
```

---

## Task 9: Expand Prisma Schema — Analytics, Forms, Templates, AI Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add SiteAnalytics model**

PRD Table 21: id, siteId, date(@db.Date), visitors, uniqueVisitors, pageViews, avgSession(Float), bounceRate(Float), topPages(Json). Unique: `[siteId, date]`.

- [ ] **Step 2: Add AnalyticsEvent model**

PRD Table 29: id, siteId(FK), path, referrer, sessionId, userAgent, country, viewportWidth(Int), createdAt. Index: `[siteId, createdAt]`.

- [ ] **Step 3: Add FormBlock model**

PRD Table 40: id, siteId(FK), pageId, blockId, name, fields(Json), submitButtonText, successMessage, notifyEmail, webhookUrl, isActive, createdAt, updatedAt. Relation to FormSubmission[].

- [ ] **Step 4: Add FormSubmission model**

PRD Table 38: id, formBlockId(FK), siteId(FK), data(Json), sourceUrl, deviceInfo, ip, isRead, isSpam, isArchived, createdAt. Indexes: `[siteId, createdAt]`, `[siteId, formBlockId]`.

- [ ] **Step 5: Add Template model**

PRD Table 27: id, name, slug(@unique), category, description, thumbnail, previewUrl, pages(Json), usageCount, isActive, createdAt, updatedAt.

- [ ] **Step 6: Add AIGenerationJob model**

PRD Table 28: id, workspaceId, siteId, userId, status, businessType, description, selectedPages(String[]), progress(Int), steps(Json), metadata(Json), error, completedAt, cancelledAt, createdAt.

- [ ] **Step 7: Run prisma validate and commit**

```bash
npx prisma validate
git add prisma/schema.prisma
git commit -m "feat: add analytics, form, template, AI generation Prisma models"
```

---

## Task 10: Expand Prisma Schema — Remaining Models

**Files:**
- Modify: `prisma/schema.prisma`

Add all remaining 16 models from PRD Section 10:

- [ ] **Step 1: Add WorkspaceIntegration, WSSharingSettings**
- [ ] **Step 2: Add HelpArticle, SupportTicket**
- [ ] **Step 3: Add ExportJob, UserPreference**
- [ ] **Step 4: Add SlugHistory, WorkspaceTransfer, AccountDeletionReq**
- [ ] **Step 5: Add LoginAttempt, PublishBuildJob, Redirect**
- [ ] **Step 6: Add ConnectedAccount**

Each model's fields are specified in the PRD Section 10 table definitions documented in Tasks 4-9 comments.

- [ ] **Step 7: Run prisma validate and commit**

```bash
npx prisma validate
git add prisma/schema.prisma
git commit -m "feat: add remaining 13 Prisma models (support, export, preferences, history, etc.)"
```

---

## Task 11: Schema Integrity Test

**Files:**
- Create: `__tests__/schema-integrity.test.ts`

- [ ] **Step 1: Write schema test**

```typescript
// __tests__/schema-integrity.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

describe("Prisma Schema Integrity", () => {
  const schema = readFileSync(
    join(__dirname, "..", "prisma", "schema.prisma"),
    "utf-8"
  );

  it("schema contains all 41 models from PRD", () => {
    const expectedModels = [
      "User", "Account", "Session", "VerificationToken",
      "WorkspaceMember", "Workspace", "AuditLog",
      "Site", "Page", "Domain", "DnsRecord", "Folder",
      "Invite", "ShareLink", "SitePermission",
      "Subscription", "PaymentMethod", "Invoice",
      "Notification", "NotificationPref", "ActivityLog", "OnboardingState",
      "SiteAnalytics", "AnalyticsEvent", "FormBlock", "FormSubmission",
      "Template", "AIGenerationJob",
      "WorkspaceIntegration", "WSSharingSettings",
      "HelpArticle", "SupportTicket", "ExportJob", "UserPreference",
      "SlugHistory", "WorkspaceTransfer", "AccountDeletionReq",
      "LoginAttempt", "PublishBuildJob", "Redirect", "ConnectedAccount",
    ];

    for (const model of expectedModels) {
      expect(schema, `Missing model: ${model}`).toContain(`model ${model}`);
    }
    expect(expectedModels).toHaveLength(41);
  });

  it("schema has required unique constraints", () => {
    expect(schema).toContain("@@unique([userId, workspaceId])");
    expect(schema).toContain("@@unique([siteId, slug])");
    expect(schema).toContain("@@unique([memberId, siteId])");
    expect(schema).toContain("@@unique([userId, category])");
    expect(schema).toContain("@@unique([siteId, date])");
  });

  it("schema has required indexes", () => {
    expect(schema).toContain("@@index([workspaceId, status])");
    expect(schema).toContain("@@index([userId, read])");
    expect(schema).toContain("@@index([siteId, createdAt])");
    expect(schema).toContain("@@index([email, createdAt])");
    expect(schema).toContain("@@index([workspaceId, createdAt])");
    expect(schema).toContain("@@index([siteId, formBlockId])");
    expect(schema).toContain("@@index([siteId, isActive])");
  });

  it("Site model has all required fields", () => {
    const siteSection = schema.slice(
      schema.indexOf("model Site {"),
      schema.indexOf("@@map(\"sites\")")
    );
    const requiredFields = [
      "workspaceId", "name", "slug", "status", "creationMethod",
      "pages", "createdBy", "headCode", "bodyCode", "socialLinks",
      "publishedPassword", "metaTitleTemplate", "folderId", "deletedAt",
    ];
    for (const field of requiredFields) {
      expect(siteSection, `Site missing field: ${field}`).toContain(field);
    }
  });

  it("Page model has blocks as Json", () => {
    const pageSection = schema.slice(
      schema.indexOf("model Page {"),
      schema.indexOf("@@map(\"pages\")")
    );
    expect(pageSection).toContain("blocks");
    expect(pageSection).toContain("Json");
    expect(pageSection).toContain("@@unique([siteId, slug])");
  });
});
```

- [ ] **Step 2: Run test**

Run: `npx vitest run __tests__/schema-integrity.test.ts`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add __tests__/schema-integrity.test.ts
git commit -m "test: add schema integrity tests for all 41 Prisma models"
```

---

## Task 12: Run Prisma Generate

- [ ] **Step 1: Generate Prisma client**

Run: `npx prisma generate`
Expected: Generated Prisma Client

- [ ] **Step 2: Verify Prisma client types compile**

Run: `npx tsc --noEmit`
Expected: No type errors related to Prisma

- [ ] **Step 3: Commit (if any generated files changed)**

---

## Task 13: Dashboard Sidebar Component

**Files:**
- Create: `components/dashboard/sidebar.tsx`
- Test: `__tests__/dashboard-layout.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/dashboard-layout.test.ts
import { describe, it, expect } from "vitest";

describe("Sidebar Navigation", () => {
  it("SIDEBAR_NAV_ITEMS has exactly 5 items", async () => {
    const { SIDEBAR_NAV_ITEMS } = await import("@/components/dashboard/sidebar");
    expect(SIDEBAR_NAV_ITEMS).toHaveLength(5);
  });

  it("nav items match PRD Section 3.1", async () => {
    const { SIDEBAR_NAV_ITEMS } = await import("@/components/dashboard/sidebar");
    const labels = SIDEBAR_NAV_ITEMS.map((item: { label: string }) => item.label);
    expect(labels).toEqual(["Dashboard", "My Sites", "Team", "Billing", "Settings"]);
  });

  it("nav items have correct href paths", async () => {
    const { SIDEBAR_NAV_ITEMS } = await import("@/components/dashboard/sidebar");
    const hrefs = SIDEBAR_NAV_ITEMS.map((item: { href: string }) => item.href);
    expect(hrefs).toEqual([
      "/dashboard",
      "/dashboard/sites",
      "/dashboard/team",
      "/dashboard/billing",
      "/dashboard/settings",
    ]);
  });

  it("each nav item has an icon name", async () => {
    const { SIDEBAR_NAV_ITEMS } = await import("@/components/dashboard/sidebar");
    for (const item of SIDEBAR_NAV_ITEMS) {
      expect(item.icon).toBeDefined();
      expect(typeof item.icon).toBe("string");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/dashboard-layout.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `components/dashboard/sidebar.tsx` as a `"use client"` component:
- Export `SIDEBAR_NAV_ITEMS` const array with 5 items (Dashboard, My Sites, Team, Billing, Settings) each having `label`, `href`, `icon` (Lucide icon name string).
- `Sidebar` component: fixed 220px width, full height, border-right. Logo at top ("Buildrik" text), nav list in middle with active state (red bg/text for current route), workspace info at bottom.
- Active route detection: exact match for `/dashboard`, startsWith for others.
- Colors: active = `#E42313` on `red-50` bg, inactive = `#7A7A7A`, hover = `#F4F4F4` bg.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/dashboard-layout.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/sidebar.tsx __tests__/dashboard-layout.test.ts
git commit -m "feat: add dashboard sidebar with 5 nav items (PRD Section 3.1)"
```

---

## Task 14: Dashboard Topbar Component

**Files:**
- Create: `components/dashboard/topbar.tsx`

- [ ] **Step 1: Write implementation**

Create `components/dashboard/topbar.tsx` as a `"use client"` component:
- Fixed position: left offset 220px (sidebar), height 56px, border-bottom.
- Left: Search button with Search icon + "Search..." text + `⌘K` kbd hint. Click handler is a no-op placeholder for Sub-Project 9 command palette.
- Right: Bell icon button (notifications), HelpCircle icon button (help), avatar dropdown button (user initials circle in `#E42313` + ChevronDown).
- All icons from Lucide React. Colors match PRD Section 2.

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/topbar.tsx
git commit -m "feat: add dashboard topbar with search, bell, help, avatar (PRD Section 3.2)"
```

---

## Task 15: Breadcrumb Component

**Files:**
- Create: `components/dashboard/breadcrumb.tsx`

- [ ] **Step 1: Write implementation**

Create `components/dashboard/breadcrumb.tsx` as a `"use client"` component:
- Props: `items: BreadcrumbItem[]` where `BreadcrumbItem = { label: string, href?: string }`.
- Returns `null` if items.length <= 1 (no breadcrumb on top-level pages per PRD Section 3.2).
- Renders `<nav aria-label="Breadcrumb">` with `<ol>` list. Items separated by ChevronRight icons.
- Last item is plain text (current page), others are Links. Colors: active `#0D0D0D`, links `#7A7A7A`.

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/breadcrumb.tsx
git commit -m "feat: add breadcrumb navigation component (PRD Section 3.2)"
```

---

## Task 16: Toast System

**Files:**
- Create: `components/dashboard/toast.tsx`
- Create: `components/dashboard/toast-provider.tsx`
- Test: `__tests__/toast.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/toast.test.ts
import { describe, it, expect } from "vitest";

describe("Toast System", () => {
  it("TOAST_VARIANTS has 4 variants", async () => {
    const { TOAST_VARIANTS } = await import("@/components/dashboard/toast");
    expect(Object.keys(TOAST_VARIANTS)).toHaveLength(4);
    expect(TOAST_VARIANTS.success).toBeDefined();
    expect(TOAST_VARIANTS.error).toBeDefined();
    expect(TOAST_VARIANTS.warning).toBeDefined();
    expect(TOAST_VARIANTS.info).toBeDefined();
  });

  it("each variant has border and bg colors", async () => {
    const { TOAST_VARIANTS } = await import("@/components/dashboard/toast");
    for (const variant of Object.values(TOAST_VARIANTS)) {
      expect(variant.border).toBeDefined();
      expect(variant.bg).toBeDefined();
      expect(variant.icon).toBeDefined();
    }
  });

  it("toast auto-dismisses after 5 seconds", async () => {
    const { TOAST_AUTO_DISMISS_MS } = await import("@/components/dashboard/toast");
    expect(TOAST_AUTO_DISMISS_MS).toBe(5000);
  });

  it("toast max visible is 4", async () => {
    const { TOAST_MAX_VISIBLE } = await import("@/components/dashboard/toast");
    expect(TOAST_MAX_VISIBLE).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/toast.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write Toast component**

Create `components/dashboard/toast.tsx`:
- Export constants: `TOAST_AUTO_DISMISS_MS = 5000`, `TOAST_MAX_VISIBLE = 4`.
- Export `TOAST_VARIANTS` with 4 variants (success/error/warning/info), each having `border`, `bg`, `icon` (Lucide name), `role` (ARIA role).
- Colors from PRD Section 6.3: success=#22C55E/#F0FDF4, error=#EF4444/#FEF2F2, warning=#EAB308/#FEFCE8, info=#3B82F6/#EFF6FF.
- `Toast` component: 360px width, 4px left border, icon + title (bold) + message + optional action + X dismiss. ARIA role from variant.
- Export `ToastData` and `ToastVariant` types.

- [ ] **Step 4: Write ToastProvider**

Create `components/dashboard/toast-provider.tsx`:
- React context with `addToast(variant, title, message?)` function.
- `useToast()` hook that throws if used outside provider.
- State: array of `ToastData`. Auto-dismiss via `setTimeout`. Max 4 visible (oldest dismissed on overflow).
- Renders toast container: fixed bottom-right, z-[9999].

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/toast.test.ts`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/toast.tsx components/dashboard/toast-provider.tsx __tests__/toast.test.ts
git commit -m "feat: add toast notification system with 4 variants (PRD Section 6.3)"
```

---

## Task 17: Dashboard Layout Shell

**Files:**
- Create: `app/dashboard/layout.tsx`
- Modify: `app/layout.tsx` — add ToastProvider

- [ ] **Step 1: Create dashboard layout**

Create `app/dashboard/layout.tsx`:
- Imports `Sidebar` and `Topbar`.
- Layout: `min-h-screen` with `#FAFAFA` background. Sidebar fixed left. Topbar fixed top. Main content area with `ml-[220px] pt-14` (offsets for sidebar/topbar). Content container: `max-w-[1220px] mx-auto p-8`.

- [ ] **Step 2: Add ToastProvider to root layout**

In `app/layout.tsx`, wrap `{children}` inside `<ToastProvider>`:
```
<TRPCProvider><ToastProvider>{children}</ToastProvider></TRPCProvider>
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/layout.tsx app/layout.tsx
git commit -m "feat: add dashboard layout shell with sidebar + topbar (PRD Section 3)"
```

---

## Task 18: Dashboard Placeholder Pages

**Files:**
- Create: `app/dashboard/page.tsx`
- Create: `app/dashboard/sites/page.tsx`
- Create: `app/dashboard/team/page.tsx`
- Create: `app/dashboard/billing/page.tsx`
- Create: `app/dashboard/settings/page.tsx`
- Create: `app/dashboard/settings/layout.tsx`

- [ ] **Step 1: Create all placeholder pages**

Each placeholder page is a simple server component with an `<h1>` title (22px/700, `#0D0D0D`) and a `<p>` message about which sub-project will implement it. Use the same pattern for all:

- `app/dashboard/page.tsx` — "Dashboard" (Sub-Project 2)
- `app/dashboard/sites/page.tsx` — "My Sites" (Sub-Project 3)
- `app/dashboard/team/page.tsx` — "Team" (Sub-Project 6)
- `app/dashboard/billing/page.tsx` — "Billing" (Sub-Project 7)
- `app/dashboard/settings/page.tsx` — "Profile" (Sub-Project 8)

- [ ] **Step 2: Create settings layout with 8-tab sub-nav**

Create `app/dashboard/settings/layout.tsx` as `"use client"`:
- 8 tabs matching PRD Section 3.3: Profile, Account, Security, Notifications, Workspace, Integrations, AI & Credits, Danger Zone.
- Each tab links to `/dashboard/settings`, `/dashboard/settings/account`, etc.
- Active tab: `#E42313` text with 2px bottom border. Inactive: `#7A7A7A`.
- Active detection: exact match for Profile (index), startsWith for others.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/
git commit -m "feat: add dashboard placeholder pages and settings sub-nav layout"
```

---

## Task 19: Final Integration Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (existing auth tests + new enum/plan-limits/schema/layout/toast tests)

- [ ] **Step 2: Run Prisma validate**

Run: `npx prisma validate`
Expected: The schema file is valid

- [ ] **Step 3: Start dev server and verify dashboard renders**

Run: `npx next dev --turbopack`
Navigate to `http://localhost:3000/dashboard`
Expected: Sidebar with 5 nav items, topbar with search/bell/help/avatar, "Dashboard" heading in content area. Clicking nav items navigates between placeholder pages. Settings page shows 8-tab sub-nav.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Sub-Project 1 — database schema (41 models) + dashboard layout shell"
```
