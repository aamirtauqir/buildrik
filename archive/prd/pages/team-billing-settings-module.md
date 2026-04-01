# PRD: Team, Billing, Settings, Notifications, Help, Onboarding & Utility Pages

## Document Scope

This PRD covers all non-editor, non-site-management dashboard modules: Team Management, Billing & Subscription, Settings (8 tabs), Notifications, Help Center, Onboarding, and utility pages (Share Password Gate, Maintenance).

---

## 1. Team Management (`/dashboard/team`)

### 1.1 Overview

Full team lifecycle management: view stats, list members, invite new members, manage roles, revoke/delete members, track pending invitations, and view team activity.

### 1.2 Layout

- **Header row**: Title "Team" (left) + "Invite Member" primary button with UserPlus icon (right, red `#E42313`)
- **Stat cards**: 3-column grid (1-col on mobile) showing Total Members, Active, Pending Invitations
- **Members table**: Full-width sortable table with row selection
- **Pending invitations table**: Shown only when pending invites exist, preceded by "Pending Invitations" heading
- **Team activity feed**: Bordered card at bottom showing recent team events
- **Empty state**: Shown when total members <= 1; replaces all content below header with illustration, CTA, and 4 role explanation cards

### 1.3 States

| State | Behavior |
|-------|----------|
| Loading | 3 skeleton cards (h-24, animate-pulse) |
| Empty (<=1 member) | `TeamEmptyState` with "No team members yet" message, "Invite Team Members" CTA, 4-column role cards (Owner/Admin/Editor/Viewer) |
| Populated | Full stat cards + members table + pending invites + activity feed |

### 1.4 Stat Cards (`TeamStatCards`)

Three cards in a responsive grid:
- **Total Members**: count of all workspace members
- **Active**: count of active members
- **Pending Invitations**: count of pending invites

### 1.5 Members Table (`MembersTable`)

#### Columns
| Column | Sortable | Content |
|--------|----------|---------|
| Checkbox | No | Select all / individual selection; accent-red |
| Name | Yes (`fullName`) | Avatar or red initials circle, full name, email. Badges: "Owner" (red), "You" (gray). Green online dot if active within 15 min |
| Role | Yes | Color-coded badge: OWNER (red), ADMIN (blue), EDITOR (green), VIEWER (gray) |
| Status | Yes | Dot + label: ACTIVE (green), PENDING (amber), SUSPENDED (red) |
| Last Active | Yes | Relative time (Just now, Xm ago, Xh ago, Xd ago, Xmo ago, dash for null) |
| Sites Access | No | "All sites" or "X of Y" |
| Actions | No | 3-dot menu (hidden for OWNER) |

#### Sort behavior
- Click column header toggles asc/desc
- Active sort shows red arrow; inactive shows neutral bi-directional arrow
- Default: fullName ascending

#### Row click
- Opens `MemberDetailCard` modal overlay showing: larger avatar/initials, name + online dot, email, role badge, sites access, last active (relative), joined date (formatted), Close button

#### Bulk selection
- Header checkbox selects/deselects all
- Selected rows get `bg-red-50` highlight

### 1.6 Member Actions (`MemberActions`)

Three-dot dropdown menu (hidden for OWNER role):
| Action | Color | Disabled condition |
|--------|-------|-------------------|
| Change Role | Default (#0D0D0D) | Never |
| Revoke Access | Red (#E42313) | Never |
| Remove Member | Red (#E42313) | When member is current user |

### 1.7 Invite Modal (`InviteModal`)

Full-screen overlay modal (max-w-lg, max-h-90vh scrollable):

#### Fields
| Field | Type | Validation | Details |
|-------|------|-----------|---------|
| Email addresses | Textarea (4 rows) | Max 10 emails, comma/newline separated, regex validation per email | Red border on error; shows invalid email list or over-limit message |
| Role | Radio group (3 options) | Required | ADMIN ("Can manage everything except billing"), EDITOR ("Can edit sites they have access to"), VIEWER ("Can only view published sites"). Default: EDITOR. Selected = red border + bg |
| Site Access | Toggle buttons | - | "All sites" (default) or "Specific sites". Specific: shows scrollable checkbox list of workspace sites (fetched via `trpc.sites.list`, up to 50) |
| Personal message | Textarea (2 rows) | Optional, max 500 chars | Placeholder: "Add a note to your invitation..." |

#### Buttons
- **Cancel**: outlined, closes modal
- **Send Invitation / Send X Invitations**: red primary, disabled when 0 valid emails, too many, invalid emails, or loading. Shows "Sending..." while pending

#### API: `trpc.team.invite`
Input: `{ emails: string[], role: "ADMIN"|"EDITOR"|"VIEWER", siteIds?: string[], message?: string }`
Response: `{ sent: number, skipped: number, errors: string[] }`

#### Business rules
- Max 10 emails per batch
- Duplicate emails (already member or pending) are silently skipped
- Plan limit enforced: if `currentCount + newInvites + pendingCount > planLimit`, error returned
- Each invite expires in 7 days
- Invitation email sent via `sendTeamInviteEmail`

### 1.8 Pending Invites Table (`PendingInvites`)

| Column | Content |
|--------|---------|
| Email | Font-medium |
| Role | Color-coded badge |
| Sent | Formatted date (MMM DD, YYYY) |
| Expires In | "Expires today" or "Expires in Xd". Red text if <= 2 days |
| Resends | "Resent X/2 times". Red if at max |
| Actions | Resend button (disabled at max 2 resends) + Revoke button (red outlined) |

#### API calls
- `trpc.team.revokeInvite({ inviteId })` - Deletes invite
- `trpc.team.resendInvite({ inviteId })` - Extends expiry by 7 days, increments resend counter. Max 2 resends.

### 1.9 Team Activity Feed

Bordered white card showing recent team activity:
- Red dot + actor name (bold) + description + date
- Empty state: "No team activity yet"
- Actions tracked: MEMBER_INVITED, MEMBER_JOINED, MEMBER_REMOVED, MEMBER_ROLE_CHANGED
- Default limit: 5 entries

### 1.10 API Dependencies

| Endpoint | Type | Router |
|----------|------|--------|
| `team.stats` | Query | `teamRouter` |
| `team.list` | Query | `teamRouter` |
| `team.pendingInvites` | Query | `teamRouter` |
| `team.activity` | Query | `teamRouter` |
| `team.invite` | Mutation | `teamRouter` |
| `team.changeRole` | Mutation | `teamRouter` |
| `team.revoke` | Mutation | `teamRouter` |
| `team.delete` | Mutation | `teamRouter` |
| `team.revokeInvite` | Mutation | `teamRouter` |
| `team.resendInvite` | Mutation | `teamRouter` |
| `sites.list` | Query | (used in InviteModal for site access picker) |

### 1.11 Business Rules

- Owner role cannot be changed, revoked, or deleted
- Cannot demote the last admin/owner (LAST_ADMIN error)
- Current user cannot delete themselves
- Plan-based team member limits enforced at invite time
- Invitations expire after 7 days
- Maximum 2 resends per invitation

---

## 2. Billing (`/dashboard/billing`)

### 2.1 Overview

Subscription management: view current plan, usage metrics, upgrade/downgrade, switch billing interval, cancel/reactivate, view invoices, manage payment method.

### 2.2 Layout & View States

The page has 4 distinct view modes controlled by local state:

#### A) Default billing view (main)
- Title "Billing"
- Dunning banner (if `status === "PAST_DUE"`)
- Cancellation warning banner (if `cancelAtPeriodEnd === true`)
- Current plan card
- Billing interval switch (paid plans only)
- Usage bars (8 metrics)
- Payment method card
- Invoice table with pagination

#### B) Plan comparison view (`showPlans === true`)
- Title "Choose a Plan" + "Back to Billing" button
- `PlanComparison` component with monthly/yearly toggle and feature comparison table

#### C) Upgrade confirmation view (`upgradeConfirm !== null`)
- Title "Confirm Upgrade"
- Plan badge, price display, billing interval
- Card input placeholder (Stripe Elements placeholder, currently disabled)
- "Start [Plan] -- $X/mo" primary button
- "Back to Plans" secondary button

#### D) Cancel modal (`showCancel === true`)
- Overlay modal with cancellation flow

### 2.3 Loading State

Title "Billing" + 3 skeleton rectangles (h-32, animate-pulse)

### 2.4 Plan Card (`PlanCard`)

Displays current plan information:
- **Plan badge**: Color-coded (FREE: gray, PRO: blue, BUSINESS: purple)
- **"Current Plan"** badge (red background)
- **"Legacy pricing"** badge (amber, shown when `isGrandfathered`)
- **Price**: `$X/mo` or `$X/yr`
- **Features list**: Checkmark items
- **Active indicator** (red background) or **Change Plan** button

### 2.5 Plan Comparison Table (`PlanComparison`)

#### Monthly/Yearly Toggle
- Toggle switch with "Save 20%" badge next to Yearly label
- Default: Monthly

#### Feature comparison table (12 rows)
| Feature | Free | Pro | Business |
|---------|------|-----|----------|
| Sites | 3 | 15 | 50 |
| Pages per site | 10 | 30 | 50 |
| Custom domains | 0 | 3 | 20 |
| Team members | 1 | 5 | 25 |
| Storage | 500 MB | 5 GB | 50 GB |
| Bandwidth | 1 GB | 10 GB | 100 GB |
| AI generations | 3/mo | 20/mo | Unlimited |
| File upload max | 10 MB | 50 MB | 200 MB |
| Form submissions | 100/mo | 2,500/mo | Unlimited |
| URL redirects | 100 | 500 | Unlimited |
| Integrations | 0 | 2 | Unlimited |
| Analytics retention | 7 days | 30 days | 90 days |

#### Plan pricing
| Plan | Monthly | Yearly |
|------|---------|--------|
| Free | $0 | $0 |
| Pro | $19/mo | $15/mo |
| Business | $49/mo | $39/mo |

#### Smart recommendation
- "Best for you" badge shown on the next plan up when `nearLimitFeatures` has entries
- Warning triangles on features at >= 80% usage

#### Footer buttons
- Upgrade button for non-current paid plans
- "Upgrade -- Best for you" with green ring highlight for recommended plan
- "Current Plan" label for current plan

### 2.6 Usage Bars (`UsageBars`)

8 resource meters:
| Resource | CTA Label | CTA Link |
|----------|-----------|----------|
| Sites | Create site | /dashboard/sites/new |
| Bandwidth | View usage | /dashboard/settings/billing |
| Team members | Invite member | /dashboard/settings/team |
| Custom domains | Connect domain | /dashboard/domains |
| Storage | Manage files | /dashboard/settings/billing |
| AI credits | View usage | /dashboard/settings/billing |
| Form submissions | View forms | /dashboard/forms |
| Redirects | Manage redirects | /dashboard/redirects |

#### Color coding
- Blue (#3B82F6) when < 60%
- Yellow (#EAB308) when 60-84%
- Red (#EF4444) when >= 85%

### 2.7 Limit Reached Component (`LimitReached`)

Standalone banner (not embedded in billing page directly, used elsewhere):
- Lock icon in red circle
- "[Resource] limit reached" title
- Usage bar (red)
- For owners: "Upgrade to [Plan] -- $X/mo" button + "Compare plans" link
- For non-owners: "Contact your workspace admin to upgrade." text

### 2.8 Payment Method Card (`PaymentMethodCard`)

- Card brand icon (Visa: blue box, Mastercard: overlapping circles, other: 4-letter abbreviation)
- Masked card number (dots + last 4)
- Expiration MM/YY
- "Update Payment Method" button
- Expanded edit state: Stripe Elements placeholder (disabled inputs), Cancel + Save Card buttons

### 2.9 Invoice Table (`InvoiceTable`)

| Column | Content |
|--------|---------|
| Date | createdAt formatted |
| Amount | Currency-formatted (cents to dollars) |
| Status | Badge: PAID (green), FAILED (red), PENDING (amber), REFUNDED (gray) |
| Period | Start -- End dates |
| Actions | PDF download link (red) or dash |

Pagination: Previous/Next buttons with "Page X of Y" (10 per page).

### 2.10 Cancel Modal (`CancelModal`)

#### Layout
- Title "Cancel subscription" + "We're sorry to see you go."
- Red warning: features active until period end, then downgrade to Free
- "Features you'll lose" list (from current plan features)
- Radio group with 6 reasons: Too expensive, Missing features, Switching, Not using, Temporary, Other
- Additional feedback textarea (optional, max 500 chars with counter)
- **"Keep My Plan"** button (red primary, styled as the prominent action)
- **"Cancel Plan"** button (red outlined, secondary, disabled without reason selection)

#### Cancel reasons
`TOO_EXPENSIVE`, `MISSING_FEATURES`, `SWITCHING`, `NOT_USING`, `TEMPORARY`, `OTHER`

### 2.11 Billing Interval Switch

- Card showing current billing interval
- "Switch to Yearly/Monthly" button
- Confirmation modal: "You'll be charged a prorated amount for the remainder of your current billing period."
- Cancel + "Confirm Switch" buttons

### 2.12 Dunning Banner

Shown when `status === "PAST_DUE"` via `DunningBanner` component (imported from dashboard).

### 2.13 Reactivation Banner

Amber banner shown when `cancelAtPeriodEnd === true`:
- "Your plan cancels on [date]"
- "Reactivate" button (red)

### 2.14 API Dependencies

| Endpoint | Type | Router |
|----------|------|--------|
| `billing.overview` | Query | `billingRouter` |
| `billing.invoices` | Query | `billingRouter` |
| `billing.plans` | Query | `billingRouter` |
| `billing.usage` | Query | `billingRouter` |
| `billing.upgrade` | Mutation | `billingRouter` |
| `billing.cancel` | Mutation | `billingRouter` |
| `billing.reactivate` | Mutation | `billingRouter` |
| `billing.switchInterval` | Mutation | `billingRouter` |

### 2.15 Business Rules

- Free plan users see $0 pricing, no cancel/interval options
- Grandfathered plans show "Legacy pricing" badge
- Upgrade creates a new subscription (errors if already subscribed)
- Cancel sets `cancelAtPeriodEnd: true`, does not immediately terminate
- Reactivate reverses cancellation
- Interval switch is prorated (TODO: Stripe integration placeholder)
- Invoice amounts stored in cents, displayed as dollars
- Stripe Elements are currently placeholder/disabled inputs

---

## 3. Settings (`/dashboard/settings/*`)

### 3.1 Overview

8-tab settings area under a shared layout with horizontal tab navigation.

### 3.2 Settings Layout

- Page title: "Settings" (22px bold)
- Horizontal tab bar with underline active indicator (red `#E42313`)
- Tabs: Profile, Account, Security, Notifications, Workspace, Integrations, AI & Credits, Danger Zone
- Active tab detection: exact match for `/dashboard/settings`, startsWith for sub-paths
- Content area below with mt-6 spacing

---

### 3.3 Profile Tab (`/dashboard/settings` -- default)

#### API: `trpc.account.profile.get` / `trpc.account.profile.update`

#### Fields
| Field | Type | Editable | Validation | Notes |
|-------|------|----------|-----------|-------|
| Avatar | File upload + preview | Yes | JPG/PNG/GIF, max 2 MB | Shows initials circle (color-hashed) when no avatar. Upload/Remove buttons |
| Full name | Text | Yes | - | "Appears on published sites" |
| Display name | Text | Yes | - | "Shown to team members" |
| Email | Text (readonly) | No | - | Gray background, "Change in Account tab" |
| Bio | Textarea (3 rows) | Yes | Max 500 chars | Character counter "X/500" |
| Language | Select | Yes | 7 options | en, es, fr, de, pt, zh, ja. "Used for email and date formatting" |
| Timezone | Select | Yes | 10 options | UTC through Australia/Sydney. "Used for email and date formatting" |

#### Buttons
- "Save changes" (red primary, disabled while saving)

---

### 3.4 Account Tab (`/dashboard/settings/account`)

#### Password Section
Two modes based on `hasPassword`:
- **Has password**: "Change password" heading. Fields: Current password, New password (with strength bar), Confirm new password
- **Social-only**: "Set a password" heading. Fields: New password, Confirm new password

##### Password Strength Bar
5-level scoring: length >= 8, uppercase, number, symbol, length >= 12
Labels: Weak (red), Fair (amber), Good (blue), Strong (green), Very strong (dark green)

##### Validation
- Passwords must match (client-side)
- Min 8 characters (client-side)
- Server: verifies current password hash via bcrypt

#### Connected Accounts Section
Two provider rows (Google, GitHub) each showing:
- Provider icon (inline SVG)
- Provider name
- Connected email or "Not connected" badge
- Connect/Disconnect button

#### API: `trpc.account.changePassword`

---

### 3.5 Security Tab (`/dashboard/settings/security`)

Three sections:

#### A) Two-Factor Authentication (2FA)

**Status display**: Badge (Enabled/green or Disabled/red) + Enable/Disable button

**Enable flow** (3-step inline expansion):
1. **Step 1 - QR Code**: Shows QR code via qrserver.com API + manual secret key display. "Next: View backup codes" button
2. **Step 2 - Backup Codes**: 10 codes displayed in 2-column grid (format: XXXX-XXXX-XXXX). "Next: Verify setup" button
3. **Step 3 - Verify**: 6-digit code input (numeric only). "Verify & Enable" button. Cancel link

**Disable flow**: Inline form requiring password input. "Disable 2FA" button

#### API calls
- `trpc.account.twoFactor.enable` -> returns `{ otpauth, secret, backupCodes }`
- `trpc.account.twoFactor.confirm` -> input `{ code: string (6 digits) }`
- `trpc.account.twoFactor.disable` -> input `{ password: string }`

#### B) Active Sessions

Table with columns: Device, IP address, Last active, Actions
- Current session marked with red "Current" badge
- Non-current sessions have "Revoke" link (red)
- "Revoke all other sessions" button at top (shown when other sessions exist)

#### API calls
- `trpc.account.sessions.list`
- `trpc.account.sessions.revoke({ sessionId })`
- `trpc.account.sessions.revokeAll({ currentSessionId })`

#### C) Login History

Table with columns: Status (Success/green or Failed/red), Browser/Device, IP address, Time
- Last 10 entries from `loginAttempt` table

#### API: `trpc.account.loginHistory`

---

### 3.6 Notifications Preferences Tab (`/dashboard/settings/notifications`)

#### Layout
Grid table with 3 columns: Category (1fr), In-app (80px), Email (160px)

#### Categories
8 notification categories:
| Category | In-app default | Email default | Locked |
|----------|---------------|---------------|--------|
| Site Updates | On | Digest | No |
| Team | On | Digest | No |
| Billing | On | Digest | No |
| Domains | On | Digest | No |
| Feedback | On | Digest | No |
| AI | On | Digest | No |
| Forms | On | Digest | No |
| Security | On | Instant | Yes (locked) |

- Security category: always on, cannot be toggled. Shows lock icon and "Required for security" note
- In-app: Toggle switch (red when on)
- Email: Dropdown select (Instant / Daily Digest / Off)

#### Optimistic updates
Uses tRPC `onMutate` for instant UI feedback with rollback on error.

#### API: `trpc.account.notifications.list` / `trpc.account.notifications.update`

---

### 3.7 Workspace Tab (`/dashboard/settings/workspace`)

Two form sections + danger zone:

#### General Settings Form
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Workspace name | Text | - | "Visible to all workspace members" |
| Workspace URL | Prefixed input (`buildrik.io/`) | Auto-slugified (lowercase, hyphens, max 30 chars) | Live preview below |
| Default language | Select | 5 options | en, es, fr, de, pt |
| Timezone | Select | 6 options | UTC, ET, PT, GMT, CET, JST |
| Workspace icon | File upload | PNG/SVG/JPG | 64x64 button with preview |
| Accent color | Color picker + hex input | Valid hex (#XXXXXX) | Color picker, text input, preview swatch. Red border on invalid hex |

#### Default Sharing Settings Form
| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| Link expiration | Select | No expiration | Options: No expiration, 24h, 7d, 30d |
| Require password on shared links | Toggle | Off | "New shared links will require a password by default" |
| Allow editors to share | Toggle | Off | "Editors can create and manage shared links" |
| Activity summary emails | Toggle | On | "Receive weekly summaries of workspace activity" |

Each section has its own "Save" button.

#### Danger Zone
- "Delete workspace" card with red border
- Opens `DeleteWorkspaceModal`: type workspace name to confirm, subscription cancellation warning
- Currently shows "Not yet available" toast (deletion not implemented)

#### API calls
- `trpc.account.workspace.get`
- `trpc.account.workspace.update`
- `trpc.account.workspace.sharing`

---

### 3.8 Integrations Tab (`/dashboard/settings/integrations`)

4 integration providers, each in a collapsible card:

| Provider | Fields | Extra features |
|----------|--------|----------------|
| Google Analytics | Tracking ID (G-XXXXXXXXXX) | "Apply to all sites" toggle, "Anonymize IP" toggle |
| Mailchimp | API Key, Audience ID | Field mapping preview (Email->EMAIL, Name->FNAME/LNAME, Custom->MERGE) |
| Zapier | Webhook URL | Trigger events checkboxes (form_submission, site_published, member_joined). "Send test event" button |
| Slack | Webhook URL, Channel name | "Quiet hours" toggle (suppress 10 PM - 8 AM) |

#### Card states
- **Disconnected**: gray border, "Disconnected" badge, "Connect" button (red)
- **Connected**: green border, "Connected" badge (green), "Configure" + "Disconnect" buttons
- **Expanded**: Shows provider-specific config form, "Save & connect" (new) or "Close" (existing)

#### API calls
- `trpc.account.integrations.list`
- `trpc.account.integrations.add({ provider, config })`
- `trpc.account.integrations.remove({ id })`

#### Business rules
- Integration count limited by plan (FREE: 0, PRO: 2, BUSINESS: Unlimited)
- `INTEGRATION_LIMIT` error when plan limit reached

---

### 3.9 AI & Credits Tab (`/dashboard/settings/ai`)

Three sections:

#### AI Site Generation Credits
- Remaining credits counter (large number)
- "X/Y credits used" summary
- Progress bar (green < 60%, yellow 60-85%, red > 85%)
- "Credits reset on the 1st of each month"
- "Generate New Site" button (links to `/dashboard/sites/new?method=ai`, disabled at 0 credits)

#### Generation History
Table: Date, Business Type, Status (Completed/green, Failed/red, In Progress/yellow), Site (link to site if completed, "Generating..." if processing)
- Empty state: "No generations yet. Use your credits to create your first AI site."

#### More AI Tools (Coming Soon)
2-column grid of disabled cards:
- Content Generation
- Design Suggestions
- Page Creation
- SEO Optimization

Each with "Coming Soon" badge at 60% opacity.

#### API: `trpc.account.aiCredits`

---

### 3.10 Danger Zone Tab (`/dashboard/settings/danger`)

Two sections:

#### Export Data
- Description: "Download a copy of everything we store"
- What's included checklist (7 items): Sites, Settings, Form submissions, Team members, Analytics, Invoices, Account preferences
- Estimated size display (~2 MB)
- Previous exports list (if any): date, size, expiry countdown, download link / processing indicator
- "Export My Data" button

#### Delete Account
- Warning heading in dark red (#7F1D1D)
- Pre-check warnings (conditional):
  - Sole owner warning: "Transfer ownership or delete the workspace first"
  - Active subscription warning: "Cancel it before deleting your account"
- Consequences list (4 items): 30-day grace period, sites unpublished immediately, lose access, irreversible after grace
- Two-phase interaction:
  1. "I want to delete my account" button (dark red)
  2. Expanded form: optional reason textarea (max 500), type `DELETE` to confirm, Delete Account + Cancel buttons

#### API calls
- `trpc.account.dangerZone.exportData` -> creates export job
- `trpc.account.dangerZone.deleteAccount({ reason? })` -> schedules deletion in 30 days, sends confirmation email

#### Business rules
- Account deletion has 30-day grace period
- Export job is async (notification sent when ready)
- Deletion scheduling sends email via `sendAccountDeletionEmail`

---

## 4. Notifications (`/dashboard/notifications`)

### 4.1 Full Page (`/dashboard/notifications`)

#### Layout
- Centered max-w-3xl container
- Title "Notifications" + "Mark All Read" button (indigo #6366F1)
- Tab bar: All / Unread / Mentions (underline active indicator, black)
- Notification list in bordered container

#### Grouped Notifications
Notifications are grouped by same actor + same type within 1-hour windows:
- Single notifications render directly
- Groups show lead notification + expandable "X similar notifications" toggle (ChevronDown/Up, indigo)

#### Empty State
"No notifications" / "You're all caught up!"

### 4.2 Notification Item (`NotificationItem`)

- Left border: indigo (#6366F1) for unread, transparent for read
- Background: light indigo (#EEF2FF) for unread, transparent for read
- Opacity: 0.6 for read, 1 for unread
- Content: Actor name (bold) + message text + time ago + "View" link (if actionUrl)
- Hover actions (hidden until hover):
  - Toggle read/unread (Eye/EyeOff icon)
  - More menu (MoreHorizontal): "Mute this type", "Delete" (red)
- Click behavior: navigates to `actionUrl` if present, marks as read

### 4.3 Notification Dropdown (`NotificationDropdown`)

Header bar component (Bell icon):
- Badge showing unread count (red circle, white text)
- Dropdown (w-80): header with "Mark all read" link, scrollable list (max-h-80), "View All" footer link to `/dashboard/notifications`
- Fetches `trpc.notifications.recent` (5 items) only when open

### 4.4 API Dependencies

| Endpoint | Type | Router |
|----------|------|--------|
| `notifications.listGrouped` | Query | `notificationsRouter` |
| `notifications.unreadCount` | Query | `notificationsRouter` |
| `notifications.recent` | Query | `notificationsRouter` |
| `notifications.markRead` | Mutation | `notificationsRouter` |
| `notifications.markAllRead` | Mutation | `notificationsRouter` |

### 4.5 Notification Types Tracked

Mention types (shown in Mentions tab): MEMBER_INVITED, SITE_TRANSFERRED, FEEDBACK_RECEIVED

Security notifications (auto-created): SECURITY_PASSWORD_CHANGED, SECURITY_2FA_CHANGED

### 4.6 Business Rules

- Grouping: same actorId + same type within 1 hour = collapsed group
- Recent dropdown: max 5 items
- Full page: max 50 notifications fetched
- Invalidation: markRead and markAllRead invalidate all notification queries

---

## 5. Help Center (`/dashboard/help`)

### 5.1 Overview

Self-service help: search articles, browse categories, view articles with feedback, submit support tickets. Route-aware contextual help dropdown.

### 5.2 Help Center Home (`/dashboard/help`)

Three view modes controlled by local state:

#### Home View
- Title "Help Center" + "Submit a Ticket" button (red outlined)
- Search input (search icon, debounced 300ms, explicit submit button appears on input)
- "Browse by Category" grid (2-col, 3-col on sm+): 6 categories from `HELP_CATEGORIES` constant, each with icon + label + "Coming soon"
- "Contact Support" section: Live Chat card (toast "coming soon") + Email Support card (navigates to ticket view)
- "Keyboard Shortcuts" section with Print button: 9 shortcuts listed (Cmd+K, Cmd+N, Cmd+comma, Esc, ?, G+D, G+S, G+T, G+B)

#### Search View
- Breadcrumb: Help Center / Search results for "[query]"
- Title "Search Results"
- Loading: 3 skeleton rows
- Results via `ArticleList` component
- "Back to Help Center" link (red)

#### Ticket View
- Breadcrumb: Help Center / Submit Ticket
- Title "Submit a Support Ticket"
- `TicketForm` component (max-w-lg)

### 5.3 Article List (`ArticleList`)

Each article row (click navigates to `/dashboard/help/[slug]`):
- Title + category badge (gray pill)
- Excerpt text (if available)
- Read time with Clock icon

Empty state: BookOpen icon + "No articles found" + "Try a different search term"

### 5.4 Article Detail (`/dashboard/help/[slug]`)

- Back breadcrumb: "Back to Help Center" with ArrowLeft
- Title (22px bold)
- Category badge + read time
- Content body (whitespace-pre-wrap)
- "Was this article helpful?" feedback section: Yes (ThumbsUp) / No (ThumbsDown) buttons, confirmation message after feedback

#### API calls
- `trpc.help.article({ slug })` - public procedure
- `trpc.help.feedback({ articleId, helpful })` - public procedure

### 5.5 Ticket Form (`TicketForm`)

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| Subject | Text input | Min 5, max 200 chars | Character counter |
| Category | Select | Required | 6 options: GENERAL, BILLING, TECHNICAL, ACCOUNT, FEATURE, BUG |
| Description | Textarea (6 rows) | Min 20, max 5000 chars | Character counter |
| Attachments | File input | Optional, max 5 files, PNG/JPG/PDF only | Shows file list with remove buttons, "Attach file" button |

#### Confirmation View
After successful submission:
- Green checkmark circle
- "Ticket #[number] Created"
- "We've received your support request"
- Expected response time card based on plan:
  - FREE: "Help docs only -- no email support on Free plan"
  - PRO: "48-hour email response"
  - BUSINESS: "4-hour priority response"

#### API: `trpc.help.createTicket` (protected)

### 5.6 Contextual Help Dropdown (`ContextualHelp`)

Header bar component (HelpCircle icon):
- Route-aware article suggestions (3 articles per route)
- Route mapping:
  - `/dashboard` -> getting-started, dashboard-guide, quick-actions
  - `/dashboard/sites` -> managing-sites, publishing, templates
  - `/dashboard/team` -> team-permissions, inviting-members, roles
  - `/dashboard/billing` -> billing-plans, payment-methods, invoices
  - `/dashboard/settings` -> account-settings, security, workspace
  - Default -> getting-started, contact-support, keyboard-shortcuts
- Each article shows title + read time, links to `/dashboard/help/[slug]`
- Footer: "View Help Center" link (red)

### 5.7 API Dependencies

| Endpoint | Type | Auth | Router |
|----------|------|------|--------|
| `help.categories` | Query | Public | `helpRouter` |
| `help.search` | Query | Public | `helpRouter` |
| `help.article` | Query | Public | `helpRouter` |
| `help.feedback` | Mutation | Public | `helpRouter` |
| `help.createTicket` | Mutation | Protected | `helpRouter` |

### 5.8 Business Rules

- Article search: case-insensitive match on title, excerpt, content
- Article feedback: increments helpfulYes or helpfulNo counter
- Ticket creation requires authentication
- SLA varies by plan
- Help categories and articles require public access (no auth)

---

## 6. Onboarding (`/onboarding/*`)

### 6.1 Overview

3-step onboarding wizard for new users, plus an in-dashboard checklist for continued guidance. Layout: fixed left sidebar (72px) with step indicators + centered content area.

### 6.2 Onboarding Layout

- Dark sidebar (#0D0D0D) with:
  - Buildrik logo (red square with "B")
  - Step indicators: 3 dots (ROLE_SELECT, PROJECT_SETUP, SITE_CREATION)
  - Completed steps: white checkmark circle
  - Active step: red dot
  - Future steps: dark gray dot
  - Connecting lines between steps
- Main area: centered children with Space Grotesk font

### 6.3 Onboarding Root (`/onboarding`)

Auto-redirect page:
- Shows loading spinner on dark background
- Uses `useOnboardingFlow` hook to determine current step
- Redirects to appropriate step page

### 6.4 Role Selection (`/onboarding/role`)

#### Layout
Centered card (max-w-md):
- Title: "How will you use Buildrik?" (Space Grotesk)
- Subtitle: "This helps us personalise your experience."
- 3 role cards as radio-style buttons:

| Role | Icon | Description |
|------|------|-------------|
| Freelancer | User | Independent professional |
| Small Team | Users | 2-10 people |
| Agency | Building2 | Client work at scale |

- Selected card: red border + red-50 background + red icon background
- Unselected: gray border + white background + gray icon
- "Continue" button: red when selection made, gray disabled otherwise

#### API: `trpc.onboarding.selectRole({ role })` -> navigates to `/onboarding/setup`

### 6.5 Project Setup (`/onboarding/setup`)

#### Layout
Centered card (max-w-md) with back navigation:
- "Back" link to `/onboarding/role`
- Title: "Set up your first project" (Space Grotesk)
- Subtitle: "Give it a name and choose how you want to start."

#### Fields
| Field | Validation |
|-------|-----------|
| Project name | Min 2 chars, max 100 chars |

#### Creation Method Selection (3 radio-style cards)
| Method | Icon | Description | Badge |
|--------|------|-------------|-------|
| Generate with AI | Sparkles | AI builds your site in minutes | "Recommended" (red, shown when not selected) |
| Use a Template | LayoutTemplate | Choose from 50+ designs | - |
| Start Blank | File | Full creative control | - |

- AI method has dark icon background by default (primary emphasis)
- "Continue" button: enabled when name >= 2 chars AND method selected

#### Post-submit routing
Based on method:
- **blank**: Creates site via `trpc.sites.create`, redirects to `/editor/[siteId]`
- **template**: Redirects to `/dashboard/sites/new?method=template`
- **ai**: Redirects to `/dashboard/sites/new?method=ai`

#### API: `trpc.onboarding.setupProject({ projectName, method })`

### 6.6 Onboarding Step Sequence

Full sequence tracked in DB: `ROLE_SELECT -> PROJECT_SETUP -> SITE_CREATION -> EDITOR_TOUR -> CHECKLIST -> COMPLETED`

### 6.7 Dashboard Checklist (`DashboardChecklist`)

Fixed bottom-right floating widget (w-80, z-50):

#### Header
- "Getting Started" title + "X/Y" progress counter
- Collapse/Expand toggle (ChevronUp/Down)
- Dismiss button (X) -- calls `trpc.onboarding.dismiss`

#### Progress bar
Red bar showing percentage completion

#### Two variants

**Full checklist (7 tasks)** -- for workspace creators:
1. Add your first text block
2. Upload an image
3. Change your site name
4. Add a second page
5. Preview your site
6. Invite a team member
7. Publish your site

**Invited checklist (3 tasks)** -- for invited users:
1. Edit a page
2. Preview your site
3. Invite a team member

#### Task interaction
- Click incomplete task -> calls `trpc.onboarding.completeStep({ step })`
- Completed tasks: green checkmark, strikethrough text, no description
- Incomplete tasks: gray circle, black text, description subtitle

### 6.8 API Dependencies

| Endpoint | Type | Router |
|----------|------|--------|
| `onboarding.getState` | Query | `onboardingRouter` |
| `onboarding.selectRole` | Mutation | `onboardingRouter` |
| `onboarding.setupProject` | Mutation | `onboardingRouter` |
| `onboarding.completeStep` | Mutation | `onboardingRouter` |
| `onboarding.dismiss` | Mutation | `onboardingRouter` |
| `onboarding.completeTourStep` | Mutation | `onboardingRouter` |
| `onboarding.completeTour` | Mutation | `onboardingRouter` |
| `sites.create` | Mutation | (used when blank method selected) |

### 6.9 Business Rules

- Onboarding state created on first access (defaults to ROLE_SELECT)
- Steps advance sequentially via `nextStep()` logic
- Checklist can be dismissed (persisted in `onboardingState.dismissed`)
- Tour progress tracked separately (`tourStep`, `tourCompleted`)
- Invited users see reduced 3-task checklist

---

## 7. Share Password Gate (`/share/[token]`)

### 7.1 Overview

Public page protecting password-gated shared links. No authentication required.

### 7.2 Layout

Centered card (max-w-sm) on light gray background:
- Lock icon in red circle
- Title: "This site is password protected"
- Subtitle: "Enter the password to view this site"
- Password input (autofocus)
- "View Site" submit button (red, disabled when empty or loading)

### 7.3 Error States

| HTTP Status | Error Message |
|-------------|--------------|
| 410 | "This share link has expired." |
| 404 | "This share link is no longer available." |
| 401/other | Server error message or "Incorrect password" |
| Network error | "Something went wrong. Please try again." |

- Error displayed below input in red text
- Input border turns red on error

### 7.4 Success Flow

On correct password: receives `{ redirectUrl }` from API, performs `window.location.href` redirect.

### 7.5 API

Direct fetch (not tRPC): `POST /api/share/[token]/verify-password` with `{ password }` body.

---

## 8. Maintenance Page (`/maintenance`)

### 8.1 Overview

Shown during scheduled maintenance. Auto-recovers when service is restored.

### 8.2 Layout

Full-screen centered display:
- Buildrik logo text (2xl bold)
- Clock icon in red circle (16x16)
- Title: "We'll be back shortly"
- Subtitle: "We're performing scheduled maintenance. This page will automatically refresh when we're back online."

### 8.3 Auto-Recovery

- Polls `GET /api/health` every 60 seconds
- On `200 OK` response: redirects to `/dashboard`
- On failure: silently continues polling

---

## 9. Cross-Module Page Relationships

```
/onboarding/role -> /onboarding/setup -> /editor/[siteId] (blank)
                                       -> /dashboard/sites/new?method=template
                                       -> /dashboard/sites/new?method=ai

/dashboard/team -> InviteModal -> trpc.sites.list (site access picker)

/dashboard/billing -> Plan Comparison -> Upgrade Confirmation -> billing.upgrade
                   -> Cancel Modal -> billing.cancel
                   -> billing.reactivate (from cancellation banner)
                   -> billing.switchInterval

/dashboard/settings -> 8 sub-tabs (all under accountRouter)
  /settings/workspace -> Delete Workspace Modal
  /settings/danger -> Export / Delete Account

/dashboard/notifications -> notification detail via actionUrl
NotificationDropdown (header) -> /dashboard/notifications

/dashboard/help -> /dashboard/help/[slug] (article detail)
                -> Ticket Form (inline view)
ContextualHelp (header) -> /dashboard/help/[slug]

/share/[token] -> /api/share/[token]/verify-password -> redirect

/maintenance -> /api/health -> /dashboard
```

---

## 10. Shared UI Patterns

### Toast Notifications
All mutations use `useToast().addToast(type, title, message?)`:
- `success`: Green confirmation
- `error`: Red with error detail
- `info`: Neutral informational

### Loading States
- Skeleton rectangles (animate-pulse, #F4F4F4 background)
- Button text changes: "Saving...", "Sending...", "Processing...", etc.
- Buttons disabled during pending state via `isPending`

### Data Refetch Pattern
Mutations trigger selective refetch of affected queries via `.refetch()` or `utils.[query].invalidate()`.

### Color System
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #E42313 | CTAs, active states, brand elements |
| Text primary | #0D0D0D | Headings, body text |
| Text secondary | #7A7A7A | Descriptions, labels |
| Text muted | #B0B0B0 | Placeholders, hints |
| Border | #E8E8E8 | Card borders, dividers |
| Surface | #FAFAFA | Table headers, backgrounds |
| Surface alt | #F4F4F4 | Hover states, skeleton bg |
| Success | #22C55E | Online dots, plan features |
| Warning | #F59E0B | Expiring items, amber alerts |
| Danger | #EF4444 | Destructive actions |
| Info/Indigo | #6366F1 | Notification accents |

### Modal Pattern
- Fixed inset overlay with bg-black/40
- Centered white card (rounded-2xl, shadow-xl)
- Close via X button, backdrop click, or Cancel button

### Role-Based Access Colors
| Role | Background | Text |
|------|-----------|------|
| OWNER | #FEF2F2 | #E42313 |
| ADMIN | #EFF6FF | #3B82F6 |
| EDITOR | #F0FDF4 | #22C55E |
| VIEWER | #F3F4F6 | #7A7A7A |
