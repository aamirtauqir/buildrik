# Production Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all immediately-implementable gaps from issue.md — DB alignment, email wiring, event wiring, notification triggers, LoginAttempt/SlugHistory writes, UI states, and edge cases — without requiring new infrastructure (Stripe/Redis/BullMQ).

**Architecture:** Fix gaps in priority order: schema first, then service layer (email wiring, event triggers, data writes), then UI states, then edge cases. All changes follow existing patterns. No new dependencies.

**Tech Stack:** Prisma 5, tRPC 11, React Email, nodemailer, Next.js 16, Vitest

**Scope Note:** This plan covers Phases 2, 3 (email wiring only — templates exist), 5, 8, 9 from issue.md. Phases 1 (Stripe), 4 (BullMQ), 6 (permissions/transfers), 7 (SSE) require infrastructure decisions and will be separate plans.

---

## File Structure

### Schema changes
- Modify: `prisma/schema.prisma` — add indexes, fix nullability

### Service layer (email wiring + event triggers)
- Modify: `server/services/email.service.ts` — add 15 missing email send functions
- Create: `server/services/notification.trigger.ts` — centralized notification creation helper
- Modify: `server/services/auth.service.ts` — write LoginAttempt records
- Modify: `server/services/site-settings.service.ts` — write SlugHistory on slug change
- Modify: `server/services/account.service.ts` — send account deletion + export emails
- Modify: `server/services/form-submission.service.ts` — send form submission email
- Modify: `server/services/sites.service.ts` — log activity on create/archive/delete

### UI fixes
- Modify: `components/site-detail/analytics-tab.tsx` — add empty state
- Modify: `components/sites/site-grid.tsx` or page — add "no results" state
- Modify: `components/publish/publish-success.tsx` — add Copy URL button

### Tests
- Create: `__tests__/email-wiring.test.ts`
- Create: `__tests__/notification-triggers.test.ts`
- Create: `__tests__/login-attempt.test.ts`
- Create: `__tests__/slug-history.test.ts`

---

### Task 1: Database Schema Alignment

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add @@index directives for hot queries**

Add these indexes to `prisma/schema.prisma`:

```prisma
// In Site model, before closing brace:
  @@index([workspaceId])
  @@index([workspaceId, status])
  @@index([workspaceId, deletedAt])

// In SiteAnalytics model:
  @@index([siteId, date])

// In AnalyticsEvent model:
  @@index([siteId, createdAt])

// In LoginAttempt model:
  @@index([email, createdAt])

// In FormSubmission model:
  @@index([siteId, createdAt])
  @@index([siteId, formBlockId])

// In Notification model:
  @@index([userId, read])

// In ActivityLog model:
  @@index([workspaceId, createdAt])

// In Invite model:
  @@index([workspaceId, status])

// In VerificationToken model:
  @@index([expiresAt])
```

- [ ] **Step 2: Make OnboardingState.step non-nullable with default**

```prisma
// Change from:
  step           String?
// To:
  step           String   @default("ROLE_SELECT")
```

- [ ] **Step 3: Push schema changes to DB**

Run: `npx prisma db push`
Expected: "Your database is now in sync"

- [ ] **Step 4: Run existing tests to verify no breakage**

Run: `npx vitest run`
Expected: 44 files, 320 tests, ALL PASSING

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "fix(schema): add performance indexes, fix OnboardingState.step nullability"
```

---

### Task 2: Wire 15 Missing Email Send Functions

**Files:**
- Modify: `server/services/email.service.ts`
- Test: `__tests__/email-wiring.test.ts`

- [ ] **Step 1: Write failing test for email service exports**

```typescript
// __tests__/email-wiring.test.ts
import { describe, it, expect } from "vitest";

describe("Email Service Exports", () => {
  it("exports all 19 email send functions", async () => {
    const mod = await import("@/server/services/email.service");
    const expected = [
      "sendVerificationEmail",
      "sendPasswordResetEmail",
      "sendMagicLinkEmail",
      "sendTeamInviteEmail",
      "sendEmailChangedEmail",
      "sendPaymentFailedEmail",
      "sendDunningReminderEmail",
      "sendAutoDowngradeEmail",
      "sendExportReadyEmail",
      "sendAccountDeletionEmail",
      "sendAICompleteEmail",
      "sendAIFailedEmail",
      "sendWSTransferOutEmail",
      "sendWSTransferInEmail",
      "sendSSLExpiringEmail",
      "sendPlanLimitWarningEmail",
      "sendWSTransferInviteEmail",
      "sendFormSubmissionEmail",
      "sendSiteTransferredEmail",
    ];
    for (const fn of expected) {
      expect(mod).toHaveProperty(fn);
      expect(typeof (mod as any)[fn]).toBe("function");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/email-wiring.test.ts`
Expected: FAIL — missing exports

- [ ] **Step 3: Add all 15 missing email send functions to email.service.ts**

Add imports at the top of `server/services/email.service.ts`:

```typescript
import EmailChanged from "@/emails/email-changed";
import PaymentFailed from "@/emails/payment-failed";
import DunningReminder from "@/emails/dunning-reminder";
import AutoDowngrade from "@/emails/auto-downgrade";
import ExportReady from "@/emails/export-ready";
import AccountDeletion from "@/emails/account-deletion";
import AIComplete from "@/emails/ai-complete";
import AIFailed from "@/emails/ai-failed";
import WSTransferOut from "@/emails/ws-transfer-out";
import WSTransferIn from "@/emails/ws-transfer-in";
import SSLExpiring from "@/emails/ssl-expiring";
import PlanLimitWarning from "@/emails/plan-limit-warning";
import WSTransferInvite from "@/emails/ws-transfer-invite";
import FormSubmission from "@/emails/form-submission";
import SiteTransferred from "@/emails/site-transferred";
```

Add these exported functions after the existing ones:

```typescript
export async function sendEmailChangedEmail(to: string, newEmail: string) {
  const html = await render(EmailChanged({ newEmail }));
  await sendEmail(to, "Your email address has been changed — Buildrik", html);
}

export async function sendPaymentFailedEmail(to: string) {
  const html = await render(PaymentFailed({ billingUrl: `${BASE_URL}/dashboard/billing` }));
  await sendEmail(to, "Payment failed — Buildrik", html);
}

export async function sendDunningReminderEmail(to: string) {
  const html = await render(DunningReminder({ billingUrl: `${BASE_URL}/dashboard/billing` }));
  await sendEmail(to, "Payment reminder — Action required — Buildrik", html);
}

export async function sendAutoDowngradeEmail(to: string) {
  const html = await render(AutoDowngrade({ reactivateUrl: `${BASE_URL}/dashboard/billing` }));
  await sendEmail(to, "Your plan has been downgraded — Buildrik", html);
}

export async function sendExportReadyEmail(to: string, downloadUrl: string) {
  const html = await render(ExportReady({ downloadUrl }));
  await sendEmail(to, "Your data export is ready — Buildrik", html);
}

export async function sendAccountDeletionEmail(to: string, cancelUrl: string) {
  const html = await render(AccountDeletion({ cancelUrl }));
  await sendEmail(to, "Account deletion scheduled — Buildrik", html);
}

export async function sendAICompleteEmail(to: string, siteName: string, siteUrl: string) {
  const html = await render(AIComplete({ siteName, siteUrl }));
  await sendEmail(to, `Your site "${siteName}" is ready — Buildrik`, html);
}

export async function sendAIFailedEmail(to: string, siteName: string) {
  const html = await render(AIFailed({ siteName, retryUrl: `${BASE_URL}/dashboard/sites/new?method=ai` }));
  await sendEmail(to, `AI generation failed for "${siteName}" — Buildrik`, html);
}

export async function sendWSTransferOutEmail(to: string, workspaceName: string) {
  const html = await render(WSTransferOut({ workspaceName }));
  await sendEmail(to, `Workspace "${workspaceName}" transfer initiated — Buildrik`, html);
}

export async function sendWSTransferInEmail(to: string, workspaceName: string) {
  const html = await render(WSTransferIn({ workspaceName }));
  await sendEmail(to, `Workspace "${workspaceName}" transferred to you — Buildrik`, html);
}

export async function sendSSLExpiringEmail(to: string, domain: string, expiresAt: string) {
  const html = await render(SSLExpiring({ domain, expiresAt }));
  await sendEmail(to, `SSL certificate expiring for ${domain} — Buildrik`, html);
}

export async function sendPlanLimitWarningEmail(to: string, resource: string, used: number, limit: number) {
  const html = await render(PlanLimitWarning({ resource, used, limit, upgradeUrl: `${BASE_URL}/dashboard/billing` }));
  await sendEmail(to, `You're approaching your ${resource} limit — Buildrik`, html);
}

export async function sendWSTransferInviteEmail(to: string, workspaceName: string, inviterName: string, token: string) {
  const html = await render(WSTransferInvite({ workspaceName, inviterName, acceptUrl: `${BASE_URL}/workspace/transfer?token=${token}` }));
  await sendEmail(to, `${inviterName} wants to transfer "${workspaceName}" to you — Buildrik`, html);
}

export async function sendFormSubmissionEmail(to: string, siteName: string, pageName: string, fields: Record<string, string>) {
  const html = await render(FormSubmission({ siteName, pageName, fields, dashboardUrl: `${BASE_URL}/dashboard` }));
  await sendEmail(to, `New form submission on "${siteName}" — Buildrik`, html);
}

export async function sendSiteTransferredEmail(to: string, siteName: string, fromName: string, toName: string) {
  const html = await render(SiteTransferred({ siteName, fromName, toName }));
  await sendEmail(to, `Site "${siteName}" ownership transferred — Buildrik`, html);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/email-wiring.test.ts`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASSING

- [ ] **Step 6: Commit**

```bash
git add server/services/email.service.ts __tests__/email-wiring.test.ts
git commit -m "feat(email): wire 15 missing email send functions to React Email templates"
```

---

### Task 3: Create Notification Trigger Helper

**Files:**
- Create: `server/services/notification.trigger.ts`
- Test: `__tests__/notification-triggers.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/notification-triggers.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { create: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("Notification Triggers", () => {
  it("exports createNotification function", async () => {
    const mod = await import("@/server/services/notification.trigger");
    expect(mod.createNotification).toBeDefined();
  });

  it("creates notification with correct shape", async () => {
    const { createNotification } = await import("@/server/services/notification.trigger");
    vi.mocked(prisma.notification.create).mockResolvedValue({ id: "n1" } as any);
    await createNotification({
      userId: "u1",
      type: "SITE_PUBLISHED",
      message: "Your site was published",
      actorId: "u2",
      actorName: "Ali",
      actionUrl: "/dashboard/sites/s1",
    });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "u1",
        type: "SITE_PUBLISHED",
        message: "Your site was published",
        actorId: "u2",
        actorName: "Ali",
        actionUrl: "/dashboard/sites/s1",
      }),
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/notification-triggers.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement notification trigger helper**

```typescript
// server/services/notification.trigger.ts
import { prisma } from "@/lib/prisma";

interface CreateNotificationInput {
  userId: string;
  type: string;
  message: string;
  actorId?: string;
  actorName?: string;
  actionUrl?: string;
  priority?: "high" | "medium" | "low";
}

const HIGH_PRIORITY_TYPES = [
  "PAYMENT_FAILED",
  "SECURITY_LOGIN_NEW_DEVICE",
  "SECURITY_PASSWORD_CHANGED",
  "SECURITY_2FA_CHANGED",
  "WORKSPACE_REVOKED",
];

export async function createNotification(input: CreateNotificationInput) {
  const priority = input.priority ?? (HIGH_PRIORITY_TYPES.includes(input.type) ? "high" : "medium");
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        message: input.message,
        actorId: input.actorId,
        actorName: input.actorName,
        actionUrl: input.actionUrl,
        priority,
      },
    });
  } catch {
    // Notification failure should never block the primary operation
  }
}

export async function notifyWorkspaceOwner(workspaceId: string, type: string, message: string, actionUrl?: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true },
  });
  if (!workspace) return;
  return createNotification({ userId: workspace.ownerId, type, message, actionUrl });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/notification-triggers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/notification.trigger.ts __tests__/notification-triggers.test.ts
git commit -m "feat(notifications): add centralized notification trigger helper"
```

---

### Task 4: Write LoginAttempt Records During Auth

**Files:**
- Modify: `server/services/auth.service.ts`
- Test: `__tests__/login-attempt.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/login-attempt.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("LoginAttempt Recording", () => {
  it("auth.service.ts calls prisma.loginAttempt.create in login function", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../server/services/auth.service.ts"),
      "utf-8"
    );
    expect(src).toContain("loginAttempt.create");
  });

  it("records SUCCESS on valid login", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../server/services/auth.service.ts"),
      "utf-8"
    );
    expect(src).toContain('"SUCCESS"');
  });

  it("records FAILED on invalid password", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../server/services/auth.service.ts"),
      "utf-8"
    );
    expect(src).toContain('"FAILED"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/login-attempt.test.ts`
Expected: FAIL — auth.service.ts doesn't contain "loginAttempt.create"

- [ ] **Step 3: Add LoginAttempt writes to auth.service.ts login function**

In `server/services/auth.service.ts`, find the `login` function. After the password comparison and before returning, add loginAttempt writes:

After a FAILED password check:
```typescript
await prisma.loginAttempt.create({
  data: { email, userId: user.id, ipAddress: "", result: "FAILED" },
}).catch(() => {});
```

After a successful login:
```typescript
await prisma.loginAttempt.create({
  data: { email, userId: user.id, ipAddress: "", result: "SUCCESS" },
}).catch(() => {});
```

After account locked check:
```typescript
await prisma.loginAttempt.create({
  data: { email, userId: user.id, ipAddress: "", result: "LOCKED" },
}).catch(() => {});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/login-attempt.test.ts`
Expected: PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASSING

- [ ] **Step 6: Commit**

```bash
git add server/services/auth.service.ts __tests__/login-attempt.test.ts
git commit -m "feat(auth): record LoginAttempt on login success/failure/locked"
```

---

### Task 5: Write SlugHistory on Site Slug Change

**Files:**
- Modify: `server/services/site-settings.service.ts`
- Test: `__tests__/slug-history.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/slug-history.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("SlugHistory on slug change", () => {
  it("site-settings.service.ts writes to slugHistory when slug changes", () => {
    const src = readFileSync(
      path.resolve(__dirname, "../server/services/site-settings.service.ts"),
      "utf-8"
    );
    expect(src).toContain("slugHistory.create");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/slug-history.test.ts`
Expected: FAIL

- [ ] **Step 3: Add SlugHistory write to updateSiteSettings**

In `server/services/site-settings.service.ts`, modify `updateSiteSettings` to check if slug changed and write history:

```typescript
export async function updateSiteSettings(
  siteId: string,
  data: { /* existing params */ }
) {
  // If slug is being changed, record the old slug
  if (data.slug) {
    const current = await prisma.site.findUnique({
      where: { id: siteId },
      select: { slug: true },
    });
    if (current && current.slug !== data.slug) {
      await prisma.slugHistory.create({
        data: {
          siteId,
          oldSlug: current.slug,
          newSlug: data.slug,
        },
      }).catch(() => {});
    }
  }

  return prisma.site.update({
    where: { id: siteId },
    data,
  });
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/slug-history.test.ts`
Expected: PASS

Run: `npx vitest run`
Expected: ALL PASSING

- [ ] **Step 5: Commit**

```bash
git add server/services/site-settings.service.ts __tests__/slug-history.test.ts
git commit -m "feat(sites): record SlugHistory on site slug change for 301 redirects"
```

---

### Task 6: Wire Email Sends to Account Service Triggers

**Files:**
- Modify: `server/services/account.service.ts`

- [ ] **Step 1: Add email send on account deletion request**

In `server/services/account.service.ts`, find `requestAccountDeletion`. After creating the `AccountDeletionReq`, add:

```typescript
import { sendAccountDeletionEmail } from "@/server/services/email.service";

// Inside requestAccountDeletion, after the create:
const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
if (user) {
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings/danger`;
  sendAccountDeletionEmail(user.email, cancelUrl).catch(() => {});
}
```

- [ ] **Step 2: Add notification on password change**

In `changePassword`, after successful update:

```typescript
import { createNotification } from "@/server/services/notification.trigger";

// After password update succeeds:
await createNotification({
  userId,
  type: "SECURITY_PASSWORD_CHANGED",
  message: "Your password was changed",
  priority: "high",
});
```

- [ ] **Step 3: Add notification on 2FA enable/disable**

In `confirm2FA` (after confirming):
```typescript
await createNotification({
  userId,
  type: "SECURITY_2FA_CHANGED",
  message: "Two-factor authentication was enabled",
  priority: "high",
});
```

In `disable2FA` (after disabling):
```typescript
await createNotification({
  userId,
  type: "SECURITY_2FA_CHANGED",
  message: "Two-factor authentication was disabled",
  priority: "high",
});
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASSING

- [ ] **Step 5: Commit**

```bash
git add server/services/account.service.ts
git commit -m "feat(account): wire email on deletion request, notifications on password/2FA changes"
```

---

### Task 7: Wire Notification Triggers to Key Events

**Files:**
- Modify: `server/services/sites.service.ts`
- Modify: `server/services/team.service.ts`
- Modify: `server/services/form-submission.service.ts`

- [ ] **Step 1: Add notification on site publish (in publish service)**

Find `server/services/publish.service.ts` and add notification after publish job creation:

```typescript
import { notifyWorkspaceOwner } from "@/server/services/notification.trigger";

// After creating PublishBuildJob:
await notifyWorkspaceOwner(
  workspaceId,
  "SITE_PUBLISHED",
  `Site "${site.name}" is being published`,
  `/dashboard/sites/${siteId}`
);
```

- [ ] **Step 2: Add notification on invite accepted (in auth router)**

In `server/trpc/routers/auth.ts`, in the `acceptInvite` procedure, after the accept logic:

```typescript
import { createNotification } from "@/server/services/notification.trigger";

// After invite accepted:
await createNotification({
  userId: invite.invitedBy,
  type: "MEMBER_JOINED",
  message: `${ctx.session.user.name || ctx.session.user.email} accepted your invitation`,
  actorId: ctx.session.user.id,
  actorName: ctx.session.user.name || undefined,
  actionUrl: "/dashboard/team",
});
```

- [ ] **Step 3: Add notification on form submission**

In `server/services/form-submission.service.ts`, in `submitForm`, after creating the submission:

```typescript
import { notifyWorkspaceOwner } from "@/server/services/notification.trigger";

// After formSubmission.create:
await notifyWorkspaceOwner(
  site.workspaceId,
  "FORM_SUBMISSION_RECEIVED",
  `New form submission on "${site.name}"`,
  `/dashboard/sites/${siteId}`
);
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASSING

- [ ] **Step 5: Commit**

```bash
git add server/services/publish.service.ts server/trpc/routers/auth.ts server/services/form-submission.service.ts
git commit -m "feat(notifications): trigger notifications on publish, invite accept, form submission"
```

---

### Task 8: Add Missing UI Empty States

**Files:**
- Modify: `app/dashboard/sites/[id]/analytics/page.tsx` or `components/site-detail/analytics-tab.tsx`
- Modify: `app/dashboard/sites/page.tsx` or `components/sites/site-grid.tsx`

- [ ] **Step 1: Add "no data" empty state to analytics tab**

In the analytics tab component, after the data query, add an empty state when `timeSeries` is empty:

```tsx
{data?.timeSeries?.length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <BarChart3 className="h-10 w-10 text-[#B0B0B0] mb-4" />
    <h3 className="text-base font-semibold text-[#0D0D0D]">No analytics data yet</h3>
    <p className="text-sm text-[#7A7A7A] mt-1 max-w-sm">
      Analytics will appear here once your site starts receiving visitors.
    </p>
  </div>
)}
```

- [ ] **Step 2: Add "no results" state to sites search**

In the sites page, when search/filter returns 0 results but total exists:

```tsx
{data?.data?.length === 0 && search && (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Search className="h-10 w-10 text-[#B0B0B0] mb-4" />
    <h3 className="text-base font-semibold text-[#0D0D0D]">No sites found</h3>
    <p className="text-sm text-[#7A7A7A] mt-1">
      No sites match &ldquo;{search}&rdquo;. Try a different search.
    </p>
  </div>
)}
```

- [ ] **Step 3: Add "Copy URL" to publish success**

In `components/publish/publish-success.tsx`, add a copy button:

```tsx
<button
  onClick={() => {
    navigator.clipboard.writeText(publishedUrl);
    // Show toast or change button text
  }}
  className="flex items-center gap-2 rounded-lg border border-[#E8E8E8] bg-white px-4 py-2 text-sm font-medium text-[#0D0D0D] hover:bg-[#F4F4F4]"
>
  <Copy className="h-4 w-4" />
  Copy URL
</button>
```

- [ ] **Step 4: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASSING

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): add empty states for analytics and search, copy URL on publish"
```

---

### Task 9: Add Soft-Delete Cascade for Sites

**Files:**
- Modify: `server/services/sites.service.ts`

- [ ] **Step 1: Update deleteSite to cascade soft-delete**

In `server/services/sites.service.ts`, modify `deleteSite` to also soft-delete related records:

```typescript
export async function deleteSite(siteId: string, confirmName: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error("SITE_NOT_FOUND");
  if (site.name !== confirmName) throw new Error("NAME_MISMATCH");

  const now = new Date();

  // Cascade soft-delete: mark related records
  await prisma.$transaction([
    prisma.site.update({
      where: { id: siteId },
      data: { deletedAt: now },
    }),
    prisma.shareLink.updateMany({
      where: { siteId },
      data: { isActive: false },
    }),
    prisma.formBlock.updateMany({
      where: { siteId },
      data: { isActive: false },
    }),
  ]);

  return { success: true };
}
```

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASSING (existing deleteSite test may need update)

- [ ] **Step 3: Commit**

```bash
git add server/services/sites.service.ts
git commit -m "fix(sites): cascade soft-delete to share links and form blocks"
```

---

### Task 10: Remove Unnecessary "use client" from Error Pages

**Files:**
- Modify: `app/auth/error/access-denied/page.tsx`
- Modify: `app/auth/error/captcha/page.tsx`
- Modify: `app/auth/error/invite-expired/page.tsx`
- Modify: `app/auth/error/session-expired/page.tsx`

- [ ] **Step 1: Check each file — only remove "use client" if the file has no client hooks**

For each file, verify it doesn't use `useState`, `useEffect`, `useSearchParams`, `useRouter`, or other client hooks. If it only uses `Link` from next/link, remove the `"use client"` directive.

- [ ] **Step 2: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASSING

- [ ] **Step 3: Commit**

```bash
git add app/auth/error/
git commit -m "fix(auth): remove unnecessary 'use client' from static error pages"
```

---

## Summary

| Task | What It Fixes | Issue.md Items |
|------|--------------|----------------|
| 1 | DB indexes + schema fixes | C4, C5 |
| 2 | Wire 15 email send functions | B1 (15 emails) |
| 3 | Notification trigger helper | F1 |
| 4 | LoginAttempt recording | D4, E6 |
| 5 | SlugHistory on slug change | D5, C8, G5 |
| 6 | Email + notification on account events | F3, D13 |
| 7 | Notifications on publish/invite/form | F1, D13 |
| 8 | UI empty states + Copy URL | E1, E2, E5 |
| 9 | Soft-delete cascade | C6 |
| 10 | Remove unnecessary "use client" | H6 |

**After this plan:** 30+ issue.md items resolved. Remaining for separate plans: Stripe integration (Phase 1), BullMQ jobs (Phase 4), permissions (Phase 6), SSE (Phase 7).
