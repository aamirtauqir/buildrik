# Team + Billing + Notifications + Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill ~40 gaps across Team, Billing, Notifications, and Settings to complete the collaboration and revenue layer per PRD.

**Architecture:** Fix-in-place — modify existing files. 3 schema fields added, ~10 backend files modified, ~20 frontend files modified, 15 new email templates created. All changes follow existing patterns.

**Tech Stack:** Next.js 16, tRPC 11, Prisma 5, React 19, Tailwind CSS 4, React Email

**Spec:** `docs/superpowers/specs/2026-03-24-team-billing-notifications-design.md`

**Important:** Tasks within a module should be done in order. Modules (A/B/C/D) can be done in any order.

---

## Task 0: Schema Migration (Prerequisite)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `resendCount` to Invite model**

Find `Invite` model, add after `siteIds`:
```prisma
  resendCount Int      @default(0)
```

- [ ] **Step 2: Add `iconUrl` and `accentColor` to Workspace model**

Find `Workspace` model, add after `deletedAt`:
```prisma
  iconUrl              String?
  accentColor          String?
```

- [ ] **Step 3: Generate Prisma client**

Run: `npx prisma generate`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "chore: add resendCount to Invite, branding fields to Workspace"
```

---

## PART A: TEAM (Tasks 1-3)

### Task 1: Team Backend — Sites Access, Invite Emails, Resend Count

**Files:**
- Modify: `server/services/team.service.ts`

Covers spec gaps: 3.7, 3.8, 3.3.

- [ ] **Step 1: Add sites access data to `listMembers`**

In `listMembers`, expand the member include to add site permission counts:
```typescript
include: {
  user: { select: { fullName: true, email: true, avatar: true } },
  sitePermissions: { select: { id: true } },
},
```

Also query total sites count for workspace:
```typescript
const totalSites = await prisma.site.count({ where: { workspaceId, deletedAt: null } });
```

Add to each member in the map:
```typescript
sitesAccess: m.sitePermissions.length === 0 ? "All sites" : `${m.sitePermissions.length} of ${totalSites}`,
```

- [ ] **Step 2: Send invite emails in `inviteMembers`**

After creating each invite record, add email sending. First, get workspace name + inviter name:
```typescript
const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
const inviter = await prisma.user.findUnique({ where: { id: inviterId }, select: { fullName: true } });
```

Then after each `prisma.invite.create`, add:
```typescript
try {
  await sendTeamInviteEmail(email, workspace?.name ?? "Workspace", inviter?.fullName ?? "A team member", invite.token);
} catch {
  // Email failure shouldn't block invite creation
}
```

Import `sendTeamInviteEmail` from `@/server/services/email.service`.

- [ ] **Step 3: Update `resendInvite` to track resend count**

Replace existing `resendInvite`:
```typescript
export async function resendInvite(inviteId: string) {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) throw new Error("INVITE_NOT_FOUND");
  if (invite.resendCount >= 2) throw new Error("MAX_RESENDS");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return prisma.invite.update({
    where: { id: inviteId },
    data: { expiresAt, resendCount: { increment: 1 } },
  });
}
```

- [ ] **Step 4: Verify compilation + commit**

```bash
npx tsc --noEmit
git add server/services/team.service.ts
git commit -m "feat(team): sites access in member data, invite emails, resend count tracking"
```

---

### Task 2: Team Frontend — Members Table + Invite Modal + Pending

**Files:**
- Modify: `components/team/members-table.tsx`
- Modify: `components/team/invite-modal.tsx`
- Modify: `components/team/pending-invites.tsx`
- Modify: `app/dashboard/team/page.tsx`

Covers spec gaps: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6.

- [ ] **Step 1: Enhance members table**

Read current `members-table.tsx`. Add:
- Green online dot next to name when `lastActiveAt > Date.now() - 15 * 60 * 1000`
- Avatar circle (initials fallback if no avatar)
- "(Owner)" tag for role=OWNER, "(You)" tag for current user
- Sites Access column showing `member.sitesAccess` string
- Row click → popover/modal showing member details (avatar, name, email, role, last active, joined)

- [ ] **Step 2: Enhance invite modal**

Read current `invite-modal.tsx`. Verify/add:
- Multi-line email input (10 max), comma/newline separated
- Per-email validation with error display
- Role selector dropdown
- Site access toggle: "All sites" / "Specific sites" with checkbox list (query `trpc.sites.list`)
- Personal message textarea
- Dynamic CTA: "Send {N} Invitations"

- [ ] **Step 3: Enhance pending invites**

Read current `pending-invites.tsx`. Add:
- "Expires in {N} days" display (compute from invite.expiresAt)
- Resend button disabled when `resendCount >= 2`, show "Resent {N}/2 times"
- Wire resend to `trpc.team.resendInvite`

- [ ] **Step 4: Wire team activity + empty state in page**

Read current `team/page.tsx`. Verify:
- Activity section renders below pending invites
- Empty state shows when no members (besides owner)
- Verify `team-empty-state.tsx` has role explanation cards

- [ ] **Step 5: Commit**

```bash
git add components/team/members-table.tsx components/team/invite-modal.tsx components/team/pending-invites.tsx app/dashboard/team/page.tsx
git commit -m "feat(team): enhanced table columns, invite modal with site access, pending resend count"
```

---

### Task 3: Team — Empty State + Activity Rendering

**Files:**
- Modify: `components/team/team-empty-state.tsx`
- Modify: `app/dashboard/team/page.tsx`

Covers spec gaps: 3.5, 3.6.

- [ ] **Step 1: Enhance empty state with role explanation cards**

Read `team-empty-state.tsx`. Add 4 role cards: Owner, Admin, Editor, Viewer — each with icon, title, and short description of permissions.

- [ ] **Step 2: Ensure activity section renders**

Verify the team page renders the activity query results as a list below pending invites.

- [ ] **Step 3: Commit**

```bash
git add components/team/team-empty-state.tsx app/dashboard/team/page.tsx
git commit -m "feat(team): role explanation cards in empty state, activity section"
```

---

## PART B: BILLING (Tasks 4-7)

### Task 4: Billing Backend — Stripe TODOs + Interval Switch

**Files:**
- Modify: `server/services/billing.service.ts`
- Modify: `server/trpc/routers/billing.ts`
- Modify: `lib/validations/billing.ts`

Covers spec gaps: 4.1, 4.4, 4.12.

- [ ] **Step 1: Add Stripe TODO markers in billing service**

In `upgradePlan`, add before the placeholder creation:
```typescript
// TODO: Replace with real Stripe API when stripe@^17 is installed:
// const stripeCustomerId = workspace.stripeCustomerId ?? await createStripeCustomer(workspace);
// const subscription = await stripe.subscriptions.create({ customer: stripeCustomerId, items: [{ price: stripePriceId }] });
```

Similarly add TODOs in `cancelSubscription` and add a `reactivateSubscription` function:
```typescript
export async function reactivateSubscription(workspaceId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { workspaceId } });
  if (!subscription) throw new Error("NO_SUBSCRIPTION");
  if (!subscription.cancelAtPeriodEnd) throw new Error("NOT_CANCELLED");
  // TODO: await stripe.subscriptions.update(subscription.stripeSubscriptionId, { cancel_at_period_end: false });
  return prisma.subscription.update({
    where: { workspaceId },
    data: { cancelAtPeriodEnd: false },
  });
}
```

- [ ] **Step 2: Add cancel reason enum to billing validations**

In `lib/validations/billing.ts`:
```typescript
export const cancelReasonSchema = z.enum([
  "TOO_EXPENSIVE", "MISSING_FEATURES", "SWITCHING", "NOT_USING", "TEMPORARY", "OTHER",
]);

export const cancelSchema = z.object({
  reason: cancelReasonSchema,
  feedback: z.string().max(500).optional(),
});
```

Verify the existing `cancelSchema` matches this — update if needed.

- [ ] **Step 3: Add interval switch endpoint**

In billing router, add:
```typescript
  switchInterval: protectedProcedure
    .input(z.object({ interval: z.enum(["MONTHLY", "YEARLY"]) }))
    .mutation(async ({ ctx, input }) => {
      const wsId = await getWorkspaceId(ctx);
      // TODO: Real Stripe proration when SDK installed
      const subscription = await ctx.prisma.subscription.findUnique({ where: { workspaceId: wsId } });
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.subscription.update({
        where: { workspaceId: wsId },
        data: { interval: input.interval },
      });
    }),
```

- [ ] **Step 4: Commit**

```bash
git add server/services/billing.service.ts server/trpc/routers/billing.ts lib/validations/billing.ts
git commit -m "feat(billing): Stripe TODO markers, cancel reason schema, interval switch endpoint"
```

---

### Task 5: Billing Frontend — Plan Comparison + Cancel + Usage Bars

**Files:**
- Modify: `components/billing/plan-comparison.tsx`
- Modify: `components/billing/cancel-modal.tsx`
- Modify: `components/billing/usage-bars.tsx`
- Modify: `components/billing/plan-card.tsx`
- Modify: `components/billing/limit-reached.tsx`

Covers spec gaps: 4.2, 4.4, 4.7, 4.9, 4.11.

- [ ] **Step 1: Enhance plan comparison**

Read `plan-comparison.tsx`. Add:
- Usage warnings: for each metric near/at limit, show warning icon
- "BEST FOR YOU" badge on the cheapest plan that covers all warned metrics
- Monthly/Yearly toggle showing "Save 20%" badge

- [ ] **Step 2: Enhance cancel modal**

Read `cancel-modal.tsx`. Ensure it has:
- Impact list: "Features you'll lose" section listing plan-specific features
- Reason dropdown with 6 options from `cancelReasonSchema`
- Optional feedback textarea (500 chars)
- "Keep My Plan" primary CTA + "Cancel Plan" destructive CTA
- Wire reason + feedback to `billing.cancel` mutation

- [ ] **Step 3: Enhance usage bars**

Read `usage-bars.tsx`. Add:
- 8 usage meters: Sites, Bandwidth, Team, Domains, Storage, AI Credits, Form Submissions, Redirects
- Color coding: blue (0-59%), yellow (60-84%), red (85-100%)
- Contextual action link per bar (e.g., Sites → "Create site", Team → "Invite member")

- [ ] **Step 4: Add grandfathered badge to plan card**

Read `plan-card.tsx`. Add conditional badge when `isGrandfathered === true`: "Legacy pricing" in a subtle badge.

- [ ] **Step 5: Add Owner vs Editor variants to limit reached**

Read `limit-reached.tsx`. Ensure two variants:
- Owner: lock icon + usage bar + "Upgrade to Pro — $29/mo" CTA
- Editor: "Contact your workspace admin to upgrade" + no pricing

Accept `role` prop to determine variant.

- [ ] **Step 6: Commit**

```bash
git add components/billing/plan-comparison.tsx components/billing/cancel-modal.tsx components/billing/usage-bars.tsx components/billing/plan-card.tsx components/billing/limit-reached.tsx
git commit -m "feat(billing): usage-aware comparison, cancel with reason, 8 usage meters, role variants"
```

---

### Task 6: Billing Page — Upgrade Flow + Reactivation + Dunning

**Files:**
- Modify: `app/dashboard/billing/page.tsx`
- Modify: `components/dashboard/dunning-banner.tsx`
- Modify: `components/billing/payment-method-card.tsx`
- Modify: `components/billing/invoice-table.tsx`

Covers spec gaps: 4.3, 4.5, 4.6, 4.8, 4.10.

- [ ] **Step 1: Wire upgrade flow in billing page**

Read `billing/page.tsx`. Add first-time upgrade UI:
- When user clicks "Upgrade" → show plan selection → confirm plan + price + interval
- Placeholder card input for payment (until Stripe SDK)
- "Start {Plan} — ${price}/{interval}" CTA

- [ ] **Step 2: Wire reactivation**

Show "Your plan cancels on {date}" banner with "Reactivate" button when `cancelAtPeriodEnd === true`.

- [ ] **Step 3: Add interval switch modal**

When user clicks "Switch to Yearly/Monthly", show confirmation modal with proration placeholder.

- [ ] **Step 4: Enhance dunning banner**

Read `dunning-banner.tsx`. Add:
- "X days remaining" countdown (14-day grace)
- Dismiss to sessionStorage
- Compute from subscription's `stripeCurrentPeriodEnd` or first failure date

- [ ] **Step 5: Enhance payment method card**

Read `payment-method-card.tsx`. Add "Update Payment Method" CTA with placeholder card input.

- [ ] **Step 6: Enhance invoice table**

Read `invoice-table.tsx`. Verify: status badges (Paid=green, Failed=red, Pending=yellow), PDF download link.

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/billing/page.tsx components/dashboard/dunning-banner.tsx components/billing/payment-method-card.tsx components/billing/invoice-table.tsx
git commit -m "feat(billing): upgrade flow, reactivation, interval switch, dunning countdown, invoices"
```

---

## PART C: NOTIFICATIONS (Tasks 7-9)

### Task 7: Notifications Backend — Grouping + Priority

**Files:**
- Modify: `server/services/notification.service.ts`
- Modify: `server/trpc/routers/notifications.ts`
- Modify: `lib/validations/notifications.ts`

Covers spec gaps: 5.1, 5.7.

- [ ] **Step 1: Add `listGroupedNotifications` to service**

New function (keeps existing `listNotifications` for dropdown):
```typescript
const MENTION_TYPES = ["MEMBER_INVITED", "SITE_TRANSFERRED", "FEEDBACK_RECEIVED"];

export async function listGroupedNotifications(userId: string, filter: "all" | "unread" | "mentions" = "all") {
  const where: Record<string, unknown> = { userId };
  if (filter === "unread") where.read = false;
  if (filter === "mentions") where.type = { in: MENTION_TYPES };

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Group same-actor + same-type within 1hr
  const groups: Array<{ key: string; notifications: typeof notifications; count: number }> = [];
  for (const n of notifications) {
    const key = `${n.actorId ?? "system"}-${n.type}`;
    const last = groups[groups.length - 1];
    if (last?.key === key) {
      const timeDiff = last.notifications[0].createdAt.getTime() - n.createdAt.getTime();
      if (timeDiff < 3600000) { // 1hr
        last.notifications.push(n);
        last.count++;
        continue;
      }
    }
    groups.push({ key, notifications: [n], count: 1 });
  }

  return { groups };
}
```

- [ ] **Step 2: Add router endpoint**

In notifications router:
```typescript
  listGrouped: protectedProcedure
    .input(z.object({ filter: z.enum(["all", "unread", "mentions"]).optional().default("all") }))
    .query(async ({ ctx, input }) => listGroupedNotifications(ctx.session.user.id, input.filter)),
```

- [ ] **Step 3: Commit**

```bash
git add server/services/notification.service.ts server/trpc/routers/notifications.ts lib/validations/notifications.ts
git commit -m "feat(notifications): grouped list with actor+type collapse, mentions filter"
```

---

### Task 8: Notifications Frontend — Page + Items + Dropdown

**Files:**
- Modify: `components/notifications/notification-page.tsx`
- Modify: `components/notifications/notification-item.tsx`
- Modify: `components/notifications/notification-dropdown.tsx`
- Modify: `app/dashboard/notifications/page.tsx`

Covers spec gaps: 5.2, 5.3, 5.4.

- [ ] **Step 1: Enhance notification item**

Read `notification-item.tsx`. Add:
- Unread: 3px left border #6366F1 + tinted bg (#EEF2FF)
- Read: opacity-60
- Click handler: navigate to `actionUrl` + call markRead mutation
- Hover: show read/unread toggle icon + "..." menu

- [ ] **Step 2: Enhance notification page with tabs**

Read `notification-page.tsx`. Add:
- Tabs: All / Unread / Mentions
- Wire to `trpc.notifications.listGrouped` with filter param
- "Mark all as read" button top-right
- Render grouped notifications (expandable groups for collapsed entries)

- [ ] **Step 3: Enhance dropdown**

Read `notification-dropdown.tsx`. Add:
- Unread count badge on bell icon
- Wire to `trpc.notifications.unreadCount`
- "View All →" link to `/dashboard/notifications`

- [ ] **Step 4: Commit**

```bash
git add components/notifications/notification-page.tsx components/notifications/notification-item.tsx components/notifications/notification-dropdown.tsx app/dashboard/notifications/page.tsx
git commit -m "feat(notifications): unread styling, tabs, grouping, dropdown badge"
```

---

### Task 9: Notification Preferences + Email Templates

**Files:**
- Modify: `components/settings/notification-prefs.tsx`
- Create: 15 email template files in `emails/`

Covers spec gaps: 5.5, 5.6, 5.8.

- [ ] **Step 1: Enhance notification preferences**

Read `notification-prefs.tsx`. Ensure:
- 8 categories: Site Updates, Team, Billing, Domains, Feedback, AI, Forms, Security
- Per category: In-App toggle (ON/OFF) + Email dropdown (Instant / Daily Digest / Off)
- Security category: toggles disabled with lock icon + "Required for security"
- No "Weekly" option (audit D-16)
- Wire to `trpc.account.notificationPrefs` query/mutation

- [ ] **Step 2: Create 15 email templates**

Create each following the pattern of existing templates (React Email with header, body, CTA, footer). Each file exports a component accepting relevant props:

Templates to create:
1. `emails/payment-failed.tsx` — "Your payment failed" + update payment CTA
2. `emails/dunning-reminder.tsx` — "X days until downgrade" + update payment CTA
3. `emails/auto-downgrade.tsx` — "Your plan has been downgraded" + reactivate CTA
4. `emails/export-ready.tsx` — "Your data export is ready" + download CTA
5. `emails/account-deletion.tsx` — "Account deletion scheduled" + cancel CTA
6. `emails/ai-complete.tsx` — "Your site is ready" + view site CTA
7. `emails/ai-failed.tsx` — "Generation failed" + retry CTA
8. `emails/form-submission.tsx` — "New submission on {site}" + view CTA
9. `emails/site-transferred.tsx` — "{name} transferred {site} to you" + view CTA
10. `emails/plan-limit-warning.tsx` — "Usage at 80%" + upgrade CTA
11. `emails/ws-transfer-out.tsx` — "Workspace transfer initiated" + details
12. `emails/ws-transfer-in.tsx` — "Workspace transferred to you" + manage CTA
13. `emails/ws-transfer-invite.tsx` — "Accept workspace ownership" + accept CTA
14. `emails/ssl-expiring.tsx` — "SSL certificate expiring" + renew CTA
15. `emails/email-changed.tsx` — "Verify your new email" + verify CTA

- [ ] **Step 3: Commit**

```bash
git add components/settings/notification-prefs.tsx emails/
git commit -m "feat(notifications): 8-category preferences, 15 new email templates"
```

---

## PART D: SETTINGS (Tasks 10-14)

### Task 10: Settings — Profile + Account Tabs

**Files:**
- Modify: `components/settings/profile-form.tsx`
- Modify: `components/settings/account-tab.tsx`

Covers spec gaps: 6.1, 6.2.

- [ ] **Step 1: Enhance profile form**

Read `profile-form.tsx`. Add:
- Avatar upload with preview + "Remove Photo" button
- Auto-initials fallback (first letter of first + last name, colored circle)
- Helper text per field: "Your name appears on published sites", "Display name is shown to team members", etc.

- [ ] **Step 2: Enhance account tab**

Read `account-tab.tsx`. Add:
- Password change form (current + new + confirm) wired to `trpc.account.changePassword`
- Connected social accounts section showing Google/GitHub connection status
- Social-only users (no password): show "Set Password" form instead of "Change Password"

- [ ] **Step 3: Commit**

```bash
git add components/settings/profile-form.tsx components/settings/account-tab.tsx
git commit -m "feat(settings): profile avatar + helper text, account password + social accounts"
```

---

### Task 11: Settings — Security Tab (2FA + Sessions + History)

**Files:**
- Modify: `components/settings/security-tab.tsx`
- Modify: `server/services/account.service.ts`
- Modify: `server/trpc/routers/account.ts`

Covers spec gap: 6.3.

- [ ] **Step 1: Add 2FA service functions**

In `account.service.ts`, add:
```typescript
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { encryptSecret, hashBackupCodes } from "@/server/services/auth.service";

export async function enable2FA(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, "Buildrik", secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  // Generate 10 backup codes
  const codes = Array.from({ length: 10 }, () =>
    `${randomChars(4)}-${randomChars(4)}-${randomChars(4)}`
  );

  // Store encrypted secret + hashed backup codes (pending confirmation)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encryptSecret(secret),
      backupCodes: await hashBackupCodes(codes),
    },
  });

  return { qrCodeDataUrl, secret, backupCodes: codes };
}

function randomChars(n: number): string {
  return Array.from({ length: n }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");
}

export async function confirm2FA(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFactorSecret: true } });
  if (!user?.twoFactorSecret) throw new Error("2FA_NOT_SETUP");

  // Verify the code works
  const secret = user.twoFactorSecret.includes(":")
    ? (await import("@/server/services/auth.service")).decryptSecret(user.twoFactorSecret)
    : user.twoFactorSecret;
  const valid = authenticator.verify({ token: code, secret });
  if (!valid) throw new Error("INVALID_CODE");

  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
  return { success: true };
}

export async function disable2FA(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("USER_NOT_FOUND");

  if (user.passwordHash) {
    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error("WRONG_PASSWORD");
  }
  // Social-only users: password param is empty, allow disable (audit D-31)

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: [] },
  });
  return { success: true };
}
```

- [ ] **Step 2: Add 2FA router endpoints**

In `account.ts` router:
```typescript
  twoFactor: router({
    enable: protectedProcedure.mutation(({ ctx }) => enable2FA(ctx.session.user.id)),
    confirm: protectedProcedure
      .input(z.object({ code: z.string().length(6) }))
      .mutation(({ ctx, input }) => confirm2FA(ctx.session.user.id, input.code)),
    disable: protectedProcedure
      .input(z.object({ password: z.string().optional().default("") }))
      .mutation(({ ctx, input }) => disable2FA(ctx.session.user.id, input.password)),
  }),
```

- [ ] **Step 3: Enhance security tab frontend**

Read `security-tab.tsx`. Wire:
- 2FA setup: 3-step modal (QR code → backup codes display → verify code)
- Active sessions: list from `trpc.account.sessions` with revoke buttons
- Login history: list from `trpc.account.loginHistory` with browser/device info
- "Revoke All Other Sessions" button

- [ ] **Step 4: Commit**

```bash
git add server/services/account.service.ts server/trpc/routers/account.ts components/settings/security-tab.tsx
git commit -m "feat(settings): 2FA setup (enable/confirm/disable), sessions, login history"
```

---

### Task 12: Settings — Workspace + Integrations

**Files:**
- Modify: `components/settings/workspace-form.tsx`
- Modify: `components/settings/integrations-tab.tsx`
- Modify: `app/dashboard/settings/workspace/page.tsx`

Covers spec gaps: 6.4, 6.5.

- [ ] **Step 1: Enhance workspace form**

Read `workspace-form.tsx`. Add:
- Branding section: icon upload (64x64) + accent color picker (hex input + preview)
- Activity summary: this month's stats (sites created, published, etc.)
- Default sharing settings: expiry dropdown, require password toggle, allow editors toggle
- Wire branding to workspace update mutation (new `iconUrl` + `accentColor` fields)

- [ ] **Step 2: Add workspace delete trigger**

In `app/dashboard/settings/workspace/page.tsx`, add Owner-only danger section:
- "Delete Workspace" destructive button
- Type-to-confirm modal: type workspace name
- Pre-checks: show warnings for active subscription, pending transfers
- Wire to workspace delete endpoint (add endpoint if needed)

- [ ] **Step 3: Enhance integrations tab**

Read `integrations-tab.tsx`. Add config cards for each integration:
- **Google Analytics**: Tracking ID input + site selector + anonymize IP toggle
- **Mailchimp**: API key + audience selector + field mapping UI
- **Zapier**: Webhook URL + trigger event checkboxes + "Send Test Event" button
- **Slack**: Workspace connection + channel mapping + quiet hours toggle (10PM-8AM)

Each card shows connected/disconnected status. Wire to `trpc.account.integrations` CRUD. Config stored as JSONB.

- [ ] **Step 4: Commit**

```bash
git add components/settings/workspace-form.tsx components/settings/integrations-tab.tsx app/dashboard/settings/workspace/page.tsx
git commit -m "feat(settings): workspace branding + delete, integration config cards"
```

---

### Task 13: Settings — AI Credits + Danger Zone

**Files:**
- Modify: `components/settings/ai-credits-tab.tsx`
- Modify: `components/settings/danger-zone-tab.tsx`

Covers spec gaps: 6.6, 6.7.

- [ ] **Step 1: Enhance AI credits tab**

Read `ai-credits-tab.tsx`. Add:
- Credits usage bar (visual progress bar with {used}/{limit})
- Generation history table: date, business type, status badge, site link
- "Generate New Site" primary CTA → `/dashboard/sites/new?method=ai`
- 4 locked AI tool cards: Content, Design, Page, SEO — each with "Coming Soon" tag, grayed out

- [ ] **Step 2: Enhance danger zone tab**

Read `danger-zone-tab.tsx`. Add:
- **Export section**: What's included list, estimated size, "Export My Data" CTA, previous exports with expiry countdown + download links
- **Delete account section**: Pre-checks (sole owner warning, active subscription warning), type "DELETE" to confirm, 30-day grace explanation
- Wire export to `trpc.account.requestDataExport`, delete to `trpc.account.requestAccountDeletion`

- [ ] **Step 3: Commit**

```bash
git add components/settings/ai-credits-tab.tsx components/settings/danger-zone-tab.tsx
git commit -m "feat(settings): AI credits bar + history + locked tools, danger zone export + delete"
```

---

### Task 14: Workspace/Account Delete Endpoints + Grace Banners

**Files:**
- Modify: `server/services/workspace-settings.service.ts`
- Modify: `server/trpc/routers/account.ts`
- Modify: `app/dashboard/page.tsx`

Covers spec gaps: 6.8, 6.9, 6.10.

- [ ] **Step 1: Add workspace delete + cancel service functions**

In `workspace-settings.service.ts`:
```typescript
export async function deleteWorkspace(workspaceId: string) {
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) throw new Error("NOT_FOUND");

  const scheduledAt = new Date(Date.now() + 30 * 86400000);
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletionScheduledAt: scheduledAt },
  });
  return { scheduledAt };
}

export async function cancelWorkspaceDeletion(workspaceId: string) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data: { deletionScheduledAt: null },
  });
}
```

- [ ] **Step 2: Add router endpoints**

In `account.ts` router, add to the workspace section:
```typescript
  workspace: router({
    // ... existing get, update, sharing ...
    delete: protectedProcedure
      .input(z.object({ confirmName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { workspaceId } = await getWorkspaceCtx(ctx);
        const ws = await ctx.prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (!ws || ws.name !== input.confirmName) throw new TRPCError({ code: "BAD_REQUEST", message: "Name mismatch" });
        if (ws.ownerId !== ctx.session.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return deleteWorkspace(workspaceId);
      }),
    cancelDelete: protectedProcedure.mutation(async ({ ctx }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      return cancelWorkspaceDeletion(workspaceId);
    }),
  }),
```

Also verify `account.cancelDelete` for account deletion exists. If not, add:
```typescript
  cancelAccountDeletion: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.accountDeletionReq.updateMany({
      where: { userId: ctx.session.user.id, processedAt: null, cancelledAt: null },
      data: { cancelledAt: new Date() },
    });
  }),
```

- [ ] **Step 3: Add grace period banners to dashboard page**

In `app/dashboard/page.tsx`, add above the main content:
- Query workspace `deletionScheduledAt`
- If set: "Your workspace is scheduled for deletion on {date}. [Cancel Deletion]"
- Query `AccountDeletionReq` for current user
- If active: "Your account is scheduled for deletion on {date}. [Cancel Deletion]"
- Style: `bg-[#FEF2F2]` with left border `#EF4444`

- [ ] **Step 4: Commit**

```bash
git add server/services/workspace-settings.service.ts server/trpc/routers/account.ts app/dashboard/page.tsx
git commit -m "feat(settings): workspace/account delete endpoints, grace period banners"
```

---

## Task 15: Final Verification

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`

- [ ] **Step 2: Git status clean**

Run: `git status`

- [ ] **Step 3: Trace module flows**

| Flow | Expected |
|------|----------|
| Team → Invite → Accept | Modal with site access → email sent → accept via auth/invite → join workspace |
| Billing → Upgrade | Plan comparison → select plan → confirm → subscription created (placeholder) |
| Billing → Cancel | Cancel modal → reason + feedback → cancelAtPeriodEnd = true → reactivate option |
| Notifications → View | Grouped list → tabs → click → navigate + mark read |
| Settings → 2FA Setup | Enable → QR code → backup codes → verify → enabled |
| Settings → Delete WS | Confirm name → scheduled deletion → grace banner → cancel option |
