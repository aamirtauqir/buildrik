# Phase 3: Team + Billing + Notifications + Settings — Design Spec

**Date:** 2026-03-24
**Status:** Reviewed (v2 — fixes from spec review applied)
**PRD Refs:** Sections 5.12-5.13, 5.18-5.19, 5.20 (ACCT/WS/NOTIF), 13.1-13.4, 14.1-14.4
**Audit Refs:** D-5, D-6, D-16, D-18, D-27, D-31, D-35, D-36, D-50, D-51

---

## 1. Problem Statement

Team, Billing, Notifications, and Settings modules have complete scaffolding (routers, services, components, pages) but ~40 gaps between PRD spec and current implementation. Backend services are 80-90% complete. The gaps are mostly frontend polish, missing UI states, Stripe integration depth, notification grouping, and settings tab completeness.

---

## 2. Approach

Fix-in-place. No new service or router files. Same pattern as Phase 1 and 2.

---

## 3. Team Gaps (10)

### 3.1 Members Table — Enhanced Columns

**Files:** `components/team/members-table.tsx`

**Current:** Table with name, email, role, status, lastActive, actions.

**Needed per PRD 5.12:**
- Online dot (green) for members active in last 15 min
- "(Owner)" / "(You)" tags next to role
- Sites Access column: "All sites" or "{N} of {M} sites" — query SitePermission count
- Avatar in name column

**Implementation:** Add online dot check (`lastActiveAt > now - 15min`). Add tags. Add sites access column — join SitePermission count in `listMembers` service.

### 3.2 Multi-Invite Modal Enhancement (TEAM-7)

**Files:** `components/team/invite-modal.tsx`

**Current:** Basic invite modal.

**Needed per PRD 5.12 AD-4:**
- Up to 10 emails (one per line or comma-separated)
- Real-time validation per line (email format + existing member check)
- Role selector shared for all invitees
- Site access: "All sites" or specific sites (checkbox list)
- Personal message textarea
- Dynamic CTA: "Send {N} Invitations"

**Implementation:** Verify current modal has these features. Wire real-time email validation. Add site access checkbox list querying `trpc.sites.list`.

### 3.3 Pending Invitations Enhancement

**Files:** `components/team/pending-invites.tsx`

**Current:** Shows pending invites with revoke.

**Needed per PRD 5.12:**
- Show: email, role, sent date, "expires in X days"
- Resend count (max 2 resends) — track resend count
- [Resend] button (disabled after 2 resends)
- [Revoke] button

**Schema change required:** Add `resendCount Int @default(0)` to the `Invite` model in `prisma/schema.prisma`.

**Implementation:** `resendInvite` service increments `resendCount` and resets `expiresAt`. Frontend disables Resend button when `resendCount >= 2`. Display: "Resent {N}/2 times".

### 3.4 Member Click → Popover Card

**Files:** `components/team/members-table.tsx`

**Needed per PRD 5.12:** Click member row → MEMBER-CARD popover (avatar, name, email, role, last active, joined date). Read-only.

**Implementation:** Add a popover/modal on row click showing member details.

### 3.5 Team Empty State

**Files:** `components/team/team-empty-state.tsx`

**Current:** Component exists.

**Needed per PRD 5.12 TEAM-2:** "No team members yet" + Invite CTA + role explanation cards (Owner/Admin/Editor/Viewer descriptions).

**Implementation:** Verify content matches PRD. Add role explanation cards if missing.

### 3.6 Team Activity Section

**Files:** `app/dashboard/team/page.tsx`

**Current:** `activityQuery` exists in page but may not be rendered.

**Needed per PRD 5.12:** Last 5 team-specific activities below pending invites.

**Implementation:** Verify rendering. Wire activity data to a simple list.

### 3.7 Invite Email Sending

**Files:** `server/services/team.service.ts`, `server/services/email.service.ts`

**Current:** `inviteMembers` creates Invite records but doesn't send emails.

**Needed:** Send team invite email for each invited email using existing `sendTeamInviteEmail`.

**Implementation:** After creating each invite, call `sendTeamInviteEmail(email, workspaceName, inviterName, invite.token)`. Get workspace name + inviter name from queries.

### 3.8 Sites Access in Member Data

**Files:** `server/services/team.service.ts`

**Current:** `listMembers` returns member data but no sites access info.

**Needed:** Include sites access: total site count + member's permitted site count.

**Implementation:** Add `sitePermissions: { _count: true }` to member include, plus total sites count for workspace.

### 3.9 Integration Limit Enforcement (Audit D-18)

**Files:** `server/services/integrations.service.ts`

**Current:** Already enforces plan limits in `addIntegration`. ✅ Done.

### 3.10 Invite Expiration 7 Days (Audit D-27)

**Files:** `server/services/team.service.ts`

**Current:** Already sets 7-day expiry. ✅ Done.

---

## 4. Billing Gaps (12)

### 4.1 Stripe Integration — Real API Calls

**Files:** `server/services/billing.service.ts`

**Current:** `upgradePlan` creates a placeholder subscription record with `stripeSubscriptionId: "placeholder_..."`. No real Stripe API calls.

**Needed per PRD:** Real Stripe integration:
- `upgradePlan`: Create Stripe Customer if missing, create Checkout Session or Subscription via Stripe API
- `cancelSubscription`: Call `stripe.subscriptions.update(subId, { cancel_at_period_end: true })`
- `reactivateSubscription`: Call `stripe.subscriptions.update(subId, { cancel_at_period_end: false })`

**Implementation:** This is the biggest gap. However, the PRD note says "Stripe SDK not yet installed — add `stripe@^17` before billing sprint." For now, keep the placeholder pattern but make the service functions ready to swap. Add TODO comments marking where Stripe calls go. The frontend flow should work end-to-end with placeholder data.

### 4.2 Plan Comparison — Usage-Aware (BIL-2)

**Files:** `components/billing/plan-comparison.tsx`

**Current:** Component exists.

**Needed per PRD 5.13:**
- Shows current usage per metric with warning icon on metrics at/near limit
- "BEST FOR YOU" badge on plan covering all warned metrics
- Monthly/Yearly toggle showing savings

**Implementation:** Wire usage data from `billing.usage` query. Compute which plan covers all over-limit metrics. Add toggle for interval.

### 4.3 First-Time Upgrade Flow (BIL-FIRST-SETUP)

**Files:** `app/dashboard/billing/page.tsx`

**Needed per PRD 13.3:** Combined plan confirmation + Stripe Card Element. Shows plan + price + interval, inline card element, "Start {Plan}" CTA.

**Implementation:** Since Stripe SDK isn't installed yet, create the UI flow with a placeholder card input. When Stripe is added, swap in `@stripe/react-stripe-js` CardElement.

### 4.4 Cancel Subscription Flow (CANCEL-SUB) — Audit D-5

**Files:** `components/billing/cancel-modal.tsx`

**Current:** Component exists. Verify content.

**Needed per PRD 13.3:** Impact list (features lost), reason dropdown (6 options: TOO_EXPENSIVE, MISSING_FEATURES, SWITCHING, NOT_USING, TEMPORARY, OTHER), optional feedback textarea (500 chars), "Keep My Plan" primary + "Cancel Plan" destructive CTAs.

**Implementation:** Verify modal content matches PRD. Wire reason + feedback to `billing.cancel` mutation.

### 4.5 Subscription Reactivation

**Files:** `app/dashboard/billing/page.tsx`

**Current:** `reactivateMutation` exists in page.

**Needed per PRD 9.7:** One-click reactivate before period end. Show "Your plan cancels on {date}" with "Reactivate" button.

**Implementation:** Verify the reactivate button appears when `cancelAtPeriodEnd === true`.

### 4.6 Payment Method Update (BIL-5/BIL-PAYMENT)

**Files:** `components/billing/payment-method-card.tsx`

**Current:** Component exists showing card info.

**Needed per PRD 13.3:** "Update Payment Method" CTA. Stripe Elements Card Element for update. Auto-retry failed charge on PAST_DUE after update.

**Implementation:** Add update flow. Placeholder card input until Stripe SDK added.

### 4.7 Usage Bars Enhancement

**Files:** `components/billing/usage-bars.tsx`

**Current:** Component exists.

**Needed per PRD 5.13:** Color by threshold (0-59% blue, 60-84% yellow, 85-100% red). Each bar has contextual link (create site, invite member, etc). 8 usage meters: Sites, Bandwidth, Team, Domains, Storage, AI Credits, Form Submissions, Redirects.

**Implementation:** Wire all 8 meters. Add color thresholds. Add contextual action links.

### 4.8 Invoice Table Enhancement

**Files:** `components/billing/invoice-table.tsx`

**Current:** Component exists.

**Needed per PRD 5.13:** Status column (Paid/Failed/Pending/Refunded badges), PDF download link, click for detail.

**Implementation:** Verify status badges and PDF link. Add pagination if missing.

### 4.9 Limit Reached Screen (BIL-8)

**Files:** `components/billing/limit-reached.tsx`

**Current:** Component exists.

**Needed per PRD 5.13:**
- **Owner variant:** Lock icon + usage bar + "Upgrade to Pro — $29/mo" CTA + Compare Plans link
- **Editor variant (BIL-8/EDITOR):** "Contact your workspace admin to upgrade" + no pricing

**Implementation:** Verify both variants exist. Wire based on user role.

### 4.10 Dunning Banner Enhancement (PRD 13.1)

**Files:** `components/dashboard/dunning-banner.tsx`

**Current:** Basic banner exists, wired in Phase 2.

**Needed per PRD 13.1:** Countdown "X days remaining" (14-day grace). Retry count. Dismissible per session.

**Implementation:** Compute days remaining from first failure date. Add dismiss to sessionStorage.

### 4.11 Grandfathered Badge

**Files:** `components/billing/plan-card.tsx`

**Needed per PRD 5.13:** If `isGrandfathered=true`, show "Legacy pricing" badge.

**Implementation:** Add conditional badge.

### 4.12 Interval Switch with Proration (BIL-INTERVAL-CONFIRM)

**Files:** `app/dashboard/billing/page.tsx`

**Needed per PRD 13.3:** Modal confirming interval switch with proration preview.

**Implementation:** Add interval switch modal. Proration preview from `billing.upcoming-invoice` query (placeholder until Stripe integration).

---

## 5. Notifications Gaps (8)

### 5.1 Notification Grouping (AD-7)

**Files:** `server/services/notification.service.ts`, `components/notifications/notification-page.tsx`

**Current:** Flat list of notifications.

**Needed per PRD 5.19 + AD-7:** Same-actor + same-type within 1 hour → grouped. Expandable. Groups individually markable as read.

**Implementation:** Add a new `listGroupedNotifications` function in service (keeps existing `listNotifications` unchanged for dropdown/other consumers). Router adds a `listGrouped` query. Full page uses grouped; dropdown uses existing flat list.

### 5.2 Notification Item Enhancement

**Files:** `components/notifications/notification-item.tsx`

**Current:** Basic item.

**Needed per PRD 5.19:**
- Unread: 3px #6366F1 left border + tinted bg
- Read: 0.6 opacity
- Click: navigate to actionUrl + mark read
- Hover: mark read/unread icon + three-dot menu (mute type, delete)

**Implementation:** Add visual states, click handler, hover actions.

### 5.3 Notification Full Page Tabs

**Files:** `components/notifications/notification-page.tsx`, `app/dashboard/notifications/page.tsx`

**Current:** Basic list.

**Needed per PRD 5.19:** Tabs: All / Unread / Mentions. "Mark all read" top-right.

**Mentions definition:** Notifications where the current user is directly referenced (e.g., `type` in `["MEMBER_INVITED", "SITE_TRANSFERRED", "FEEDBACK_RECEIVED"]` — notifications specifically targeting the user by name). Filter via `type IN (mention_types)` in the service query. No schema change needed — use existing `type` field.

**Implementation:** Add tab state, filter query (pass `filter: "mentions"` which maps to type-based filter), mark all read button.

### 5.4 Notification Dropdown Enhancement

**Files:** `components/notifications/notification-dropdown.tsx`

**Current:** Basic dropdown.

**Needed per PRD 3.2:** Bell icon with unread count badge. Dropdown shows last 5. "View All →" link to full page.

**Implementation:** Wire unread count to badge. Verify dropdown content.

### 5.5 Notification Preferences (NOTIF-5)

**Files:** `components/settings/notification-prefs.tsx`, `app/dashboard/settings/notifications/page.tsx`

**Current:** Component exists.

**Needed per PRD 5.20 AD-9:** Per-category toggles:
- Categories: Site Updates, Team, Billing, Domains, Feedback, AI, Forms, Security
- Per category: In-App (ON/OFF) + Email (Instant / Daily Digest / Off)
- Security notifications cannot be disabled

**Implementation:** Verify all 8 categories. Wire to `account.notificationPrefs` query/mutation. Disable toggle for Security category.

### 5.6 Email Templates for Notifications

**Files:** `emails/` directory

**Current:** 4 templates (verify-email, reset-password, magic-link, team-invite).

**Needed per PRD 14.3:** 19 total templates. Missing: payment-failed, dunning-reminder, auto-downgrade, export-ready, account-deletion, ai-generation-complete, ai-generation-failed, ws-transfer-out, ws-transfer-in, ssl-expiring, plan-limit-warning, ws-transfer-invite, form-submission, site-transferred.

**Implementation:** Create remaining email templates using React Email. Each is a simple template — header, body text, CTA button, footer. Follow pattern of existing templates.

### 5.7 Notification Priority Handling

**Files:** `server/services/notification.service.ts`

**Needed per PRD 14.1:** High-priority notifications (PAYMENT_FAILED, DOMAIN_ERROR, etc.) should trigger toasts. Medium should update bell badge only. Low are silent.

**Implementation:** Add `priority` field usage when creating notifications. Frontend checks priority for toast display.

### 5.8 Weekly Digest Option Removal (Audit D-16)

**Files:** `components/settings/notification-prefs.tsx`

**Needed per audit D-16:** Remove "Weekly" from email options. Keep only: Instant / Daily Digest / Off.

**Implementation:** Verify email options don't include "Weekly".

---

## 6. Settings Gaps (10)

### 6.1 Profile Tab (ACCT-1) Enhancement

**Files:** `components/settings/profile-form.tsx`

**Current:** Basic form.

**Needed per PRD 5.20:**
- Avatar upload + "Remove Photo" + auto-initials fallback
- All fields have helper text explaining where value appears
- Fields: Full name, Display name, Email (read-only), Bio, Language, Timezone

**Implementation:** Verify avatar upload works. Add helper text per field. Add initials fallback display.

### 6.2 Account Tab (ACCT-2) Enhancement

**Files:** `components/settings/account-tab.tsx`

**Current:** Component exists.

**Needed per PRD 5.20:**
- Password change form (current + new + confirm)
- Connected social accounts (Google/GitHub) — show connected status
- Social-only users: show "Set Password" instead of "Change Password" (Audit D-31)

**Implementation:** Wire password change to `account.changePassword`. Show social accounts from `ConnectedAccount` table. Handle `passwordHash === null` case.

### 6.3 Security Tab (ACCT-3) Enhancement

**Files:** `components/settings/security-tab.tsx`

**Current:** Component exists.

**Needed per PRD 5.18:**
- 2FA setup 3-step modal (QR → backup codes → verify)
- Active sessions with revoke + "Revoke All Other"
- Login history (last 10 attempts) with browser/OS/location/timestamp

**Implementation:** Services exist (`getActiveSessions`, `revokeSession`, `revokeAllOtherSessions`, `getLoginHistory`). Wire to component.

**2FA endpoints needed:** Verify if `account` router has 2FA sub-router. If not, add: `account.twoFactor.enable` (returns QR + backup codes), `account.twoFactor.confirm` (verify TOTP to activate), `account.twoFactor.disable` (requires password or social re-auth per audit D-31). Service functions `enable2FA`, `confirm2FA`, `disable2FA` in `account.service.ts`.

### 6.4 Workspace Settings (WS-1) Enhancement

**Files:** `components/settings/workspace-form.tsx`, `app/dashboard/settings/workspace/page.tsx`

**Current:** Basic form.

**Needed per PRD 5.20:**
- Name, URL, defaults
- Branding: workspace icon upload 64x64 + accent color picker (AD-7). **Schema change required:** Add `iconUrl String?` and `accentColor String?` to `Workspace` model.
- Activity summary: this month's stats
- Default sharing settings (expiry, require password, allow editors)
- **Danger section (Owner only):** "Delete Workspace" link → WS-DELETE modal (Audit D-6)

**Implementation:** Wire branding upload + color picker. Add sharing settings from `WSSharingSettings`. Add workspace delete with type-to-confirm modal.

### 6.5 Integrations Tab (WS-INT-1) Enhancement

**Files:** `components/settings/integrations-tab.tsx`

**Current:** Component exists.

**Needed per PRD 5.20:**
- Google Analytics: Tracking ID + site selection + anonymize IP
- Mailchimp: Field mapping to merge tags (AD-7)
- Zapier: Webhook URL + trigger events + test event button
- Slack: Channel mapping + quiet hours 10PM-8AM (AD-7)

**Implementation:** Each integration is a config card. Wire to `account.integrations` CRUD. Config stored as JSONB in `WorkspaceIntegration.config`.

### 6.6 AI & Credits Tab (AI-1) Enhancement

**Files:** `components/settings/ai-credits-tab.tsx`

**Current:** Component exists.

**Needed per PRD 5.20 AD-9:**
- Credits usage bar (Free: 3/mo, Pro: 20, Business: Unlimited)
- Generation history table with date, type, status
- "Generate New Site" CTA → WIZ-1
- 4 locked AI tool cards with "Coming Soon" tag

**Implementation:** Wire credits from workspace health. Wire history from `AIGenerationJob` query. Add locked tool cards.

### 6.7 Danger Zone (ACCT-4) Enhancement

**Files:** `components/settings/danger-zone-tab.tsx`

**Current:** Component exists.

**Needed per PRD 5.20:**
- Export data: what's included list, estimated size, download, previous exports with expiry
- Delete account: type-to-confirm, 30-day grace, pre-checks (sole owner, active subscription)
- Workspace delete trigger (from WS-1 danger section)

**Implementation:** Wire export to `account.requestDataExport`. Wire delete to `account.requestAccountDeletion`. Add export history via `GET /account/exports` (if endpoint added in Task 6 of Phase 2).

### 6.8 Workspace Delete Flow (Audit D-6)

**Files:** `app/dashboard/settings/workspace/page.tsx`

**Current:** No delete trigger from workspace settings.

**Needed per PRD 5.20 + Audit D-6:** "Delete Workspace" button (Owner only) → WS-DELETE modal (type workspace name to confirm). Pre-checks: active subscription must be cancelled, pending transfers resolved. 30-day grace.

**Endpoints needed (do not exist yet):**
- Add `deleteWorkspace(workspaceId)` to `workspace-settings.service.ts`: sets `deletionScheduledAt = now + 30 days`, cancels subscription, removes members, soft-deletes sites.
- Add `cancelWorkspaceDeletion(workspaceId)` to same service: clears `deletionScheduledAt`.
- Add `workspace.delete` mutation + `workspace.cancelDelete` mutation to `account.ts` router (workspace endpoints live here).
- Add `account.cancelDelete` mutation for account deletion cancellation (verify if exists — `AccountDeletionReq` model has `cancelledAt` field).

**Implementation:** Add delete button + modal in workspace page. Wire to new `workspace.delete` mutation.

### 6.9 Account Deletion Grace Period Banner

**Files:** `app/dashboard/page.tsx`

**Needed per PRD 13.3 ACCT-DELETE-GRACE:** Banner on dashboard during grace period: "Your account is scheduled for deletion on {date}. [Cancel Deletion]."

**Implementation:** Query `AccountDeletionReq` for current user. Show banner if active. Wire cancel to `account.delete.cancel`.

### 6.10 Workspace Deletion Grace Period Banner

**Files:** `app/dashboard/page.tsx`

**Needed per PRD 13.3 WS-DELETE-GRACE:** Banner during grace: "Your workspace is scheduled for deletion on {date}. [Cancel Deletion]."

**Implementation:** Check `workspace.deletionScheduledAt`. Show banner if set. Wire cancel to `workspace.delete.cancel`.

---

## 7. Files Modified Summary

### Schema

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `resendCount Int @default(0)` to Invite. Add `iconUrl String?` and `accentColor String?` to Workspace. |

### Validation Schemas

| File | Changes |
|------|---------|
| `lib/validations/billing.ts` | Add cancel reason enum, feedback schema |
| `lib/validations/notifications.ts` | Add grouped list schema |
| `lib/validations/account.ts` | Add 2FA setup schemas |

### Backend

| File | Changes |
|------|---------|
| `server/services/team.service.ts` | Sites access in member data, send invite emails |
| `server/services/billing.service.ts` | Stripe TODO markers, interval switch |
| `server/services/notification.service.ts` | Notification grouping |
| `server/services/account.service.ts` | Social-only password handling |
| `server/services/workspace-settings.service.ts` | Workspace delete |
| `server/trpc/routers/team.ts` | No major changes |
| `server/trpc/routers/billing.ts` | Interval switch, upcoming invoice |
| `server/trpc/routers/notifications.ts` | Grouped list |
| `server/trpc/routers/account.ts` | 2FA setup endpoints |

### Frontend

| File | Changes |
|------|---------|
| `components/team/members-table.tsx` | Online dot, tags, sites access, member popover |
| `components/team/invite-modal.tsx` | Site access checkboxes, email validation |
| `components/team/pending-invites.tsx` | Expiry display, resend count |
| `components/billing/plan-comparison.tsx` | Usage-aware, BEST FOR YOU badge |
| `components/billing/usage-bars.tsx` | 8 meters, color thresholds, action links |
| `components/billing/cancel-modal.tsx` | Reason dropdown, feedback, impact list |
| `components/billing/plan-card.tsx` | Grandfathered badge |
| `components/billing/limit-reached.tsx` | Owner vs Editor variants |
| `components/notifications/notification-page.tsx` | Tabs, grouping, mark all read |
| `components/notifications/notification-item.tsx` | Unread styling, click nav, hover actions |
| `components/notifications/notification-dropdown.tsx` | Unread badge, recent 5 |
| `components/settings/profile-form.tsx` | Avatar upload, helper text |
| `components/settings/account-tab.tsx` | Social accounts, social-only password |
| `components/settings/security-tab.tsx` | 2FA setup modal, login history, sessions |
| `components/settings/notification-prefs.tsx` | 8 categories, security lock |
| `components/settings/workspace-form.tsx` | Branding, sharing defaults, delete trigger |
| `components/settings/integrations-tab.tsx` | GA/Mailchimp/Zapier/Slack configs |
| `components/settings/ai-credits-tab.tsx` | Credits bar, history, locked tools |
| `components/settings/danger-zone-tab.tsx` | Export history, delete pre-checks |
| `app/dashboard/billing/page.tsx` | Upgrade flow, interval switch modal |
| `app/dashboard/team/page.tsx` | Activity rendering |
| `app/dashboard/settings/workspace/page.tsx` | Delete workspace button |
| `app/dashboard/page.tsx` | Deletion grace banners |

### New Email Templates

| File | Purpose |
|------|---------|
| `emails/payment-failed.tsx` | Stripe payment failure |
| `emails/dunning-reminder.tsx` | 3 days before grace expiry |
| `emails/auto-downgrade.tsx` | Grace period expired |
| `emails/export-ready.tsx` | Data export complete |
| `emails/account-deletion.tsx` | Account deletion initiated |
| `emails/ai-complete.tsx` | AI generation success |
| `emails/ai-failed.tsx` | AI generation failure |
| `emails/form-submission.tsx` | New form submission |
| `emails/site-transferred.tsx` | Site ownership transfer |
| `emails/plan-limit-warning.tsx` | Usage >80% of limit |
| `emails/ws-transfer-out.tsx` | Transfer initiated (to current owner) |
| `emails/ws-transfer-in.tsx` | Transfer completed (to new owner) |
| `emails/ws-transfer-invite.tsx` | Transfer invite to prospective owner |
| `emails/ssl-expiring.tsx` | SSL certificate expiring soon |
| `emails/email-changed.tsx` | Email change verification (P2 — create template now, wire later) |

---

## 8. Out of Scope

- Real Stripe API calls (keep placeholder pattern, add when `stripe@^17` installed)
- SSE real-time notifications (use polling for now)
- Daily digest email cron job
- Background jobs (invite expiry, session cleanup, analytics purge)
- Workspace transfer (WS-2 is Phase 2/P2)
- Social auth linking (Phase 2/P2)
- Subscription pause (Phase 2/P2)
- Community forum (Phase 2/P2)
- Mailchimp field mapping live sync
- Slack quiet hours enforcement (store config only)

---

## 9. Success Criteria

### Team
1. Members table shows online dot, role tags, sites access count
2. Multi-invite works with site access selection
3. Invite emails actually sent
4. Pending invites show expiry + resend (max 2)
5. Member click shows popover card

### Billing
6. Plan comparison is usage-aware with "BEST FOR YOU" badge
7. Cancel flow has reason + feedback + impact list
8. Reactivate button shows when cancelAtPeriodEnd
9. Usage bars show all 8 meters with color thresholds
10. Limit reached has Owner vs Editor variants
11. Dunning banner shows days remaining

### Notifications
12. Notifications grouped by actor+type within 1hr
13. Full page has All/Unread/Mentions tabs
14. Items have unread styling + click-to-navigate + mark read
15. Dropdown shows unread badge + recent 5
16. Preferences: 8 categories with in-app + email toggles

### Settings
17. Profile has avatar upload with initials fallback
18. Security has 2FA setup, active sessions, login history
19. Workspace has branding + delete trigger
20. Integrations have config cards for GA/Mailchimp/Zapier/Slack
21. AI credits shows usage bar + history + locked tools
22. Danger zone has export + delete with pre-checks
23. 15 new email templates created (total 19 with existing 4)
