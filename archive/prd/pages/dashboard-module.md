# Dashboard Module PRD

## 1. Overview

The Dashboard module is the authenticated user's home screen and the primary entry point after login. It serves three purposes: give the user an at-a-glance summary of their workspace (sites, traffic, team), surface contextual next-step actions, and provide persistent chrome (sidebar, topbar) that frames every page inside the `/dashboard` route tree.

**Route:** `/dashboard`
**Auth requirement:** Authenticated user with a workspace membership. All tRPC queries are `protectedProcedure` and resolve the workspace from the session user's membership.

---

## 2. Layout (`/dashboard` Layout)

The dashboard layout wraps every child route under `/dashboard`. It renders three persistent regions and a content area.

### 2.1 Layout Regions

| Region | Position | Dimensions | Behavior |
|---|---|---|---|
| Sidebar | Fixed, left edge, full height | 220 px wide | Hidden below `lg` breakpoint; replaced by mobile tab bar |
| Topbar | Fixed, top edge, right of sidebar | Height 14 (56 px), spans from 220 px left to right edge | Always visible on desktop |
| Main content | Below topbar, right of sidebar | `ml-[220px] pt-14`, max-width 1220 px, centered with 32 px padding | Scrollable |
| Mobile tab bar | Fixed, bottom edge, full width | Height 14 (56 px) | Visible only below `lg` breakpoint |

**Background:** Page background is `#FAFAFA`.

---

## 3. Sidebar

### 3.1 Navigation Items

The sidebar contains exactly five navigation links, rendered as a vertical list:

| # | Label | Icon | Route | Active-state rule |
|---|---|---|---|---|
| 1 | Dashboard | LayoutDashboard | `/dashboard` | Exact match only (`pathname === "/dashboard"`) |
| 2 | My Sites | Globe | `/dashboard/sites` | Starts-with match |
| 3 | Team | Users | `/dashboard/team` | Starts-with match |
| 4 | Billing | CreditCard | `/dashboard/billing` | Starts-with match |
| 5 | Settings | Settings | `/dashboard/settings` | Starts-with match |

### 3.2 Active State Styling

- **Active:** Red-50 background, text color `#E42313`.
- **Inactive:** Text `#7A7A7A`, hover background `#F4F4F4`, hover text `#0D0D0D`.

### 3.3 Workspace Footer Section

Located at the bottom of the sidebar, below a `#E8E8E8` border:

- **Workspace label:** "My Workspace" in `#0D0D0D`, 12 px text.
- **Plan badge:** A pill displaying the current plan name.
  - Free plan: background `#F4F4F4`, text `#7A7A7A`.
  - Pro/Business plan: background `#FEF2F2`, text `#E42313`.
  - Plan labels map: `FREE` = "Free", `PRO` = "Pro", `BUSINESS` = "Business".
- **Usage bar:** Shows sites used vs. sites limit (e.g., "2/3") with a progress bar.
  - Green (`#22C55E`) when usage is below 60%.
  - Yellow (`#EAB308`) when usage is 60-84%.
  - Red (`#EF4444`) when usage is 85% or above.
- **Upgrade link:** Shown only when plan is `FREE`. Text "Upgrade" in `#E42313` with an ArrowUpRight icon. Links to `/dashboard/billing`.

### 3.4 Data Source

The sidebar fetches `trpc.dashboard.health` with a `staleTime` of 60 seconds to populate plan name and site usage.

### 3.5 Mobile Tab Bar

Below the `lg` breakpoint, the sidebar is hidden and a fixed bottom tab bar appears. It contains the same five items as icons with 10 px labels. Active item text is `#E42313`; inactive is `#7A7A7A`.

---

## 4. Topbar

The topbar is a 56 px-tall fixed header. It contains four interactive elements arranged left-to-right:

### 4.1 Search Trigger (left-aligned)

- Displays a Search icon, the text "Search...", and a keyboard shortcut badge `Cmd+K`.
- Clicking it or pressing `Cmd+K` / `Ctrl+K` opens the `CommandPalette` overlay.
- The shortcut listener is registered on mount and cleaned up on unmount.

### 4.2 Notification Bell (right group)

- Rendered by `NotificationDropdown` (from `components/notifications/notification-dropdown`).
- Part of the right-aligned icon group.

### 4.3 Help Button (right group)

- Rendered by `ContextualHelp` (from `components/help/contextual-help`).
- Provides route-aware help content.

### 4.4 Avatar Dropdown (right group)

- Displays the user's initials in a 36 px red (`#E42313`) circle.
- Initials logic: if the user has a two-word name, first letter of each word; otherwise, first letter of the name; falls back to "?".
- Clicking the avatar opens a dropdown (256 px wide, positioned top-right) with:

| Menu Item | Icon | Route | Behavior |
|---|---|---|---|
| User header | -- | -- | Shows full name and email, separated by a border |
| Profile | User | `/dashboard/settings` | Navigation link |
| Settings | Settings | `/dashboard/settings` | Navigation link |
| Billing | CreditCard | `/dashboard/billing` | Navigation link |
| Help | HelpCircle | `/dashboard/help` | Navigation link |
| Logout | LogOut | -- | POSTs to `/api/auth/logout`, then redirects to `/auth/login` |

- The dropdown closes on outside click (mousedown listener).

---

## 5. Dashboard Home Page

The main content area of `/dashboard`. This is a client component that orchestrates multiple tRPC queries and conditionally renders sections based on workspace state.

### 5.1 tRPC Queries Used

| Query | Purpose | Input |
|---|---|---|
| `trpc.dashboard.stats` | Stat cards, empty-state determination, quick-action variant | None |
| `trpc.dashboard.recentSites` | Recent sites grid | None |
| `trpc.dashboard.activity` | Activity feed | `{ filter: "all" | "mine" | "team" }` |
| `trpc.dashboard.health` | Workspace health panel | None |
| `trpc.account.workspace.get` | Workspace deletion grace-period banner | None |
| `trpc.account.dangerZone.pendingDeletion` | Account deletion grace-period banner | None |
| `trpc.billing.overview` | Dunning banner (past-due status) | None |
| `trpc.onboarding.getState` | Onboarding checklist visibility | None |

**Mutations used:**

| Mutation | Purpose |
|---|---|
| `trpc.account.workspace.cancelDelete` | Cancel workspace deletion, then refetches workspace data |
| `trpc.account.dangerZone.cancelAccountDeletion` | Cancel account deletion, then refetches pending deletion |
| `trpc.onboarding.dismiss` | Dismiss onboarding checklist, then refetches onboarding state |

### 5.2 Loading State

Displayed while `stats` or `recentSites` queries are loading. The skeleton consists of:

1. Page title "Dashboard" (rendered immediately, not skeletonized).
2. Four stat card skeletons: 112 px tall, `#F4F4F4` with `animate-pulse`, in a 4-column grid.
3. Four quick action skeletons: 64 px tall, same style.
4. Four recent site skeletons: 160 px tall, same style.
5. A 3-column grid with a 2-column activity skeleton (192 px) and a 1-column health skeleton (192 px).

### 5.3 Error State

Handled by `app/dashboard/error.tsx` (Next.js error boundary). Displays:

- A red circle icon with an exclamation mark.
- Heading: "Failed to load this page".
- Body: "Something went wrong while loading this section."
- Two buttons: "Retry" (calls `reset()`) and "Back to Dashboard" (links to `/dashboard`).

### 5.4 Page Header

Always displayed (both empty and populated states):

- Title: "Dashboard" in 22 px bold, `#0D0D0D`.
- "New Site" button: red (`#E42313`) pill with a Plus icon, links to `/dashboard/sites/new`. Right-aligned.

---

## 6. Alert Banners

Three distinct banners can appear above the main content. They stack vertically in this priority order:

### 6.1 Dunning Banner

**Condition:** `billingOverview.data.status === "PAST_DUE"`.

**Appearance:** Red-50 background, red-200 border, rounded-xl. Contains:
- AlertCircle icon (red-600).
- Message text: "Payment failed. Your workspace will be restricted in N days." (or "has been restricted" if grace period expired).
- "Update Payment" button linking to `/dashboard/billing`.
- Dismiss button (X icon) -- dismissal is session-scoped via `sessionStorage` key `buildrik_dunning_dismissed`.

**Grace period calculation:** 14-day window from the `failedAt` date. Days remaining is computed as ceiling of remaining time.

### 6.2 Workspace Deletion Banner

**Condition:** `wsData.data.deletionScheduledAt` is non-null.

**Appearance:** Red-tinted background (`#FEF2F2`), left border `3px solid #EF4444`.
- Message: "Your workspace is scheduled for deletion on {date}."
- "Cancel Deletion" underlined link that calls `cancelWsDelete.mutate()`. Shows "Cancelling..." while pending.

### 6.3 Account Deletion Banner

**Condition:** `pendingDeletion.data` is non-null.

**Appearance:** Identical styling to the workspace deletion banner.
- Message: "Your account is scheduled for deletion on {date}."
- "Cancel Deletion" underlined link that calls `cancelAcctDelete.mutate()`. Shows "Cancelling..." while pending.

---

## 7. Stat Cards

Displayed only when the workspace has at least one site (not in empty state). Rendered in a 4-column grid.

### 7.1 Card 1: Total Sites

| Field | Value |
|---|---|
| Title | "Total Sites" |
| Value | "{totalSites} sites" |
| Subtitle | "{publishedSites} published . {draftSites} draft" |
| Link | `/dashboard/sites` |
| Visual | Mini donut chart with three segments |

**Donut segments:**
- Published: `#22C55E` (green)
- Draft: `#EAB308` (yellow)
- Archived: `#7A7A7A` (gray)

The donut is a 40x40 SVG with radius 15, stroke-width 6. Segments are proportional arcs. Returns null if total is 0.

### 7.2 Card 2: Published

| Field | Value |
|---|---|
| Title | "Published" |
| Value | "{publishedSites} live" |
| Subtitle | "Last: {lastPublishedSiteName}" (only if a site has been published) |
| Link | `/dashboard/sites?status=published` |
| Visual | None |

### 7.3 Card 3: Monthly Visits

| Field | Value |
|---|---|
| Title | "Monthly Visits" |
| Value | Raw number (e.g., 1,234) |
| Trend | "{visitsChange}% vs last month" (green if positive, red if negative) |
| Link | `/dashboard/sites` |
| Visual | Sparkline chart + TrendArrow |

**Sparkline:** An 80x24 SVG polyline of daily visitor counts over the last 30 days. Stroke color is `#E42313`. Only rendered when there are 2 or more data points.

**TrendArrow:** Shows up/down arrow with signed percentage. Green (`#22C55E`) for positive, red (`#E42313`) for negative, gray (`#7A7A7A`) for zero.

**Calculation:** Monthly visits = sum of `siteAnalytics.visitors` for the last 30 days across all workspace sites. Change percentage = `((current - previous) / previous) * 100`, rounded. Previous period is 31-60 days ago. If previous period is 0, change is reported as 0%.

### 7.4 Card 4: Collaborators

| Field | Value |
|---|---|
| Title | "Collaborators" |
| Value | "{collaborators} active" |
| Subtitle | "{pendingInvites} pending" (only if > 0) |
| Link | `/dashboard/team` |
| Visual | Avatar stack |

**Avatar stack:** Shows up to 4 overlapping circular avatars (28 px diameter, -8 px overlap). Displays user image if available, otherwise first letter of name. If more than 4 members, shows a "+N" overflow circle.

### 7.5 Common Card Behavior

- Each card is a clickable link (full-card tap target).
- ARIA label: "View {title} details".
- Border: `#E8E8E8`, hover border transitions to `#E42313` at 30% opacity.
- Background: white, rounded-xl, 20 px padding.

---

## 8. Quick Actions

Displayed below stat cards. A horizontal row of exactly 4 action cards.

### 8.1 Variants

The quick actions displayed depend on workspace state. The page defines two client-side variants:

**New User (0 sites):**

| Label | Icon | Description | Route |
|---|---|---|---|
| Create Site | Plus | Start from scratch | `/dashboard/sites/new` |
| Set Up Profile | Settings | Personalize your account | `/dashboard/settings` |
| Explore Templates | LayoutTemplate | Browse 50+ templates | `/dashboard/sites/new?method=template` |
| Invite Team | UserPlus | Collaborate together | `/dashboard/team` |

**Active User (1+ sites):**

| Label | Icon | Description | Route |
|---|---|---|---|
| New Site | Plus | Create a new site | `/dashboard/sites/new` |
| View Analytics | BarChart3 | Check site performance | `/dashboard/sites` |
| Manage Domains | Globe | Connect custom domains | `/dashboard/sites` |
| Invite Member | UserPlus | Add team members | `/dashboard/team` |

### 8.2 Server-Side Variants (in service layer)

The service layer defines two additional variants not currently consumed by the page but available via `getQuickActions()`:

**Near-Limit:** Surfaces "Upgrade Plan" and "View Usage" actions.
**Dunning:** Surfaces "Update Payment", "View Billing", "Contact Support" actions.

### 8.3 Card Layout

Each action card contains:
- A 36 px circular icon container with red-50 background and `#E42313` icon.
- Label (14 px semibold) and description (12 px muted).
- Full-card link, `flex-1` (equal-width distribution).
- Same hover border treatment as stat cards.

---

## 9. Recent Sites

Displayed only when `recentSites` query returns 1 or more sites.

### 9.1 Section Header

- Title: "Recent Sites" (14 px semibold).
- "View All" link in `#E42313` with right arrow, links to `/dashboard/sites`.

### 9.2 Grid

- 4-column grid (`grid-cols-2` on small screens, `grid-cols-4` on `sm` and above).
- Shows up to 3 most-recently-edited sites.
- If fewer than 4 cards are shown, the last slot renders an "empty slot" card -- dashed border, Plus icon, text "Create your next project", linking to `/dashboard/sites/new`.

### 9.3 Site Card

Each site card displays:

**Thumbnail area (128 px tall):**
- Site thumbnail image (object-cover, fill) or a Globe placeholder icon if no thumbnail.
- **Hover overlay:** A dark semi-transparent overlay appears with two buttons:
  - "Edit" button (red, links to `/editor/{siteId}`) -- opens the site editor.
  - "Manage" button (white/transparent, links to `/dashboard/sites/{siteId}`).
- **Quick action icon (top-right, visible on hover only):**
  - Draft sites: Upload icon linking to site manage page (title "Publish").
  - Published sites with URL: Copy-URL button. Copies `publishedUrl` to clipboard. Shows a Check icon for 2 seconds after copying.

**Info area (12 px padding):**
- Site name (14 px, truncated).
- Status badge pill: Published (`#DCFCE7` bg / `#166534` text), Draft (`#FEF9C3` bg / `#854D0E` text), Archived (`#F4F4F4` bg / `#7A7A7A` text).
- Subtitle: "Edited {timeAgo} . {pages} page(s)".

### 9.4 Data Shape (`RecentSite`)

```
{
  id: string
  name: string
  slug: string
  status: string          // "published" | "draft" | "archived"
  thumbnail: string | null
  pages: number
  lastEditedAt: Date
  publishedUrl: string | null
}
```

Service fetches the 4 most-recently-edited sites (ordered by `lastEditedAt desc`).

---

## 10. Activity Feed

Displayed in the left two-thirds of a 3-column grid, alongside workspace health.

### 10.1 Filter Tabs

Three filter buttons above the feed:

| Label | Filter value | Behavior |
|---|---|---|
| All | `"all"` | Shows all workspace activity |
| My Activity | `"mine"` | Filters to current user's actions only (passes `userId` to service) |
| Team | `"team"` | Currently passes no userId filter (shows all, same as "all") |

Active tab: `#F4F4F4` background, `#0D0D0D` text. Inactive: no background, `#7A7A7A` text.

Filter change triggers a new `trpc.dashboard.activity` query with the updated filter parameter.

### 10.2 Grouping

Activity entries are grouped into time buckets:

1. **Today** -- entries from start of current calendar day onward.
2. **Yesterday** -- entries from start of previous calendar day to start of today.
3. **This Week** -- entries from start of current calendar week (Sunday) to start of yesterday.
4. **Older** -- everything else.

Empty groups are omitted. Each group renders its label as an uppercase 12 px heading.

### 10.3 Entry Format

Each entry displays:
- Actor avatar (20 px circle) or a red dot (8 px) if no avatar.
- Actor name in bold, followed by the description (or action name as fallback).
- Relative timestamp (e.g., "5m ago", "2h ago", "3d ago").

### 10.4 Empty State

If no activity entries exist, displays "No activity yet." centered in the feed container.

### 10.5 Data Shape (`ActivityFeed`)

```
{
  groups: [
    {
      label: string       // "Today" | "Yesterday" | "This Week" | "Older"
      entries: [
        {
          id: string
          action: string
          actorName: string | null
          actorAvatar: string | null
          description: string | null
          siteId: string | null
          createdAt: Date
        }
      ]
    }
  ]
}
```

Service fetches the last 20 activity log entries (with offset support for future pagination). Actor names and avatars are resolved via a batch user lookup.

---

## 11. Workspace Health

Displayed in the right one-third of the activity/health grid.

### 11.1 Visibility Conditions

The workspace health panel is shown only when **both** conditions are met:
1. The health data has loaded.
2. At least one metric (sites, storage, or AI credits) exceeds 50% usage.

The component itself applies an additional internal guard: it returns null if no metrics have any usage or if none exceed 50%.

### 11.2 Metrics Displayed

| Metric | Used value | Limit source | Unit |
|---|---|---|---|
| Sites | Count of workspace sites | Plan limit `sites` | (none) |
| Storage | Currently hardcoded to 0 | Plan limit `storageMB` | " MB" |
| AI Credits | Count of AI generation jobs this month | Plan limit `aiGenerations` | (none) |
| Bandwidth | Currently hardcoded to 0 | Plan limit `bandwidthMB` | " MB" |

### 11.3 Plan Limits Reference

| Metric | Free | Pro | Business |
|---|---|---|---|
| Sites | 3 | 15 | 50 |
| Storage (MB) | 500 | 5,120 | 51,200 |
| AI Generations | 3 | 20 | Unlimited (-1) |
| Bandwidth (MB) | 1,024 | 10,240 | 102,400 |

### 11.4 Progress Bar Color Coding

Each metric renders a horizontal progress bar with color thresholds:

| Usage Percentage | Color | CSS Class |
|---|---|---|
| Below 60% | Green | `bg-green-500` |
| 60% to 84% | Yellow | `bg-yellow-400` |
| 85% and above | Red | `bg-red-500` |

### 11.5 Header Actions

- Title: "Workspace Usage" (14 px semibold).
- "Manage plan" link in `#E42313`, links to `/dashboard/billing`.

### 11.6 Data Shape (`WorkspaceHealth`)

```
{
  plan: "FREE" | "PRO" | "BUSINESS"
  sites: { used: number, limit: number }
  storage: { usedMB: number, limitMB: number }
  aiCredits: { used: number, limit: number }
  bandwidth: { usedMB: number, limitMB: number }
}
```

---

## 12. Empty States

When the workspace has zero sites (`totalSites === 0`), the stat cards, quick actions, recent sites, activity feed, and workspace health are all replaced by a single empty-state component. The variant is determined by the user's membership role and workspace history.

### 12.1 Variant Selection Logic

```
if totalSites === 0:
  if memberRole === "OWNER":
    if archivedSites > 0:  -> "owner_empty"
    else:                  -> "owner_new"
  elif memberRole === "EDITOR": -> "editor_no_sites"
  else:                         -> "viewer"
```

### 12.2 Variant Details

#### owner_new

- Icon: Sparkles
- Heading: "Welcome to Buildrik!"
- Description: "Build your first site in under 5 minutes."
- Video placeholder: A 160x288 px dashed-border rectangle (future onboarding video).
- CTAs:
  1. "AI Generate" (primary, red button) -> `/dashboard/sites/new?method=ai`
  2. "Use Template" (secondary, white button) -> `/dashboard/sites/new?method=template`
  3. "Start Blank" (secondary) -> `/dashboard/sites/new`

#### owner_empty

- Icon: FileText
- Heading: "Your workspace is empty"
- Description: "Ready for something new?"
- No video placeholder.
- CTAs: Same three as owner_new.

#### editor_no_sites

- Icon: Users
- Heading: "No sites assigned"
- Description: "You haven't been assigned to any sites yet. Ask your workspace admin to give you access."
- CTAs: "View Team" -> `/dashboard/settings/team`

#### viewer

- Icon: Eye
- Heading: "No published sites to view yet"
- Description: "Your team is still building!"
- CTAs: None.

### 12.3 Layout

Centered content within a dashed-border (`#E8E8E8`), `#F4F4F4` background container. 64 px vertical padding, 32 px horizontal padding. CTAs are arranged in a flex-wrap row. The first CTA is always styled as the primary button (red), subsequent CTAs are secondary (white with border).

---

## 13. Onboarding Checklist

A floating overlay that appears in the bottom-right corner of the screen when the user has not completed or dismissed onboarding.

### 13.1 Visibility

Shown when `onboardingState.data` exists AND `completed` is false AND `dismissed` is false.

### 13.2 Variants

**Full checklist (7 tasks, for workspace owners):**

| ID | Label | Description |
|---|---|---|
| add-text-block | Add your first text block | Start building with content |
| upload-image | Upload an image | Add visuals to your site |
| change-site-name | Change your site name | Make it yours |
| add-second-page | Add a second page | Expand your site structure |
| preview-site | Preview your site | See how it looks to visitors |
| invite-team-member | Invite a team member | Collaborate with others |
| publish-site | Publish your site | Make it live for the world |

**Invited checklist (3 tasks, for invited users):**

| ID | Label | Description |
|---|---|---|
| edit-page | Edit a page | Make changes to existing content |
| preview-site | Preview your site | See how it looks to visitors |
| invite-team-member | Invite a team member | Collaborate with others |

### 13.3 Layout

- Fixed position, bottom-right (24 px inset), z-index 50, 320 px wide.
- White card with rounded-2xl border and shadow.
- Header: "Getting Started" label with completion counter (e.g., "3/7").
- Collapse/expand toggle (ChevronUp/ChevronDown).
- Dismiss button (X icon) -- calls `trpc.onboarding.dismiss` mutation.
- Progress bar: red (`#E42313`) fill proportional to completed/total percentage.
- Each task row: green CheckCircle2 if completed (with line-through text), gray Circle if incomplete. Clicking an incomplete task calls `trpc.onboarding.completeStep` mutation.

---

## 14. Toast System

A global notification system available throughout the dashboard.

### 14.1 Variants

| Variant | Border Color | Background | Icon | ARIA Role |
|---|---|---|---|---|
| success | `#22C55E` | `#F0FDF4` | CheckCircle | status |
| error | `#EF4444` | `#FEF2F2` | AlertCircle | alert |
| warning | `#EAB308` | `#FEFCE8` | AlertTriangle | alert |
| info | `#3B82F6` | `#EFF6FF` | Info | status |

### 14.2 Behavior

- Toasts render in a fixed stack at bottom-right (16 px inset), z-index 9999.
- Maximum 4 toasts visible simultaneously. Oldest is evicted when limit is exceeded.
- Auto-dismiss after 5 seconds.
- Each toast is 360 px wide with a 4 px left border, icon, title, optional message, optional action button, and dismiss (X) button.
- The `useToast()` hook provides `addToast(variant, title, message?)` to any component within the `ToastProvider`.

---

## 15. Breadcrumb

A shared navigation component available for sub-pages within the dashboard.

- Renders only when there are 2 or more breadcrumb items.
- Items are separated by ChevronRight icons (`#B0B0B0`).
- Intermediate items are links in `#7A7A7A` with hover underline.
- The last item is plain text in `#0D0D0D` (current page, not clickable).
- ARIA label: "Breadcrumb".

---

## 16. tRPC Router Definitions

All dashboard queries live in `dashboardRouter` and require authentication.

### 16.1 `dashboard.stats`

- **Input:** None.
- **Authorization:** Finds the user's workspace membership. Throws `NOT_FOUND` if no membership.
- **Service call:** `getDashboardStats(workspaceId, memberRole)`.
- **Database queries (parallelized via `Promise.all`):**
  - Site counts by status (total, published, draft, archived).
  - Workspace member count.
  - Pending invite count.
  - Visitor aggregate for current 30-day period.
  - Visitor aggregate for previous 30-day period (days 31-60).
  - Daily analytics rows for sparkline (last 30 days, ordered by date).
  - Top 5 active member avatars.
  - Last published site name.

### 16.2 `dashboard.recentSites`

- **Input:** None.
- **Service call:** `getRecentSites(workspaceId)` -- returns 4 sites ordered by `lastEditedAt desc`.
- **Fields selected:** id, name, slug, status, thumbnail, pages, lastEditedAt, publishedUrl.

### 16.3 `dashboard.activity`

- **Input:** `{ filter: "all" | "mine" | "team" }` (optional, defaults to "all").
- **Service call:** `getActivityFeed(workspaceId, { userId })` -- userId is set only when filter is "mine".
- **Behavior:** Fetches 20 most recent activity log entries. Resolves actor names/avatars in a single batch query. Groups entries into date buckets.

### 16.4 `dashboard.health`

- **Input:** None.
- **Service call:** `getWorkspaceHealth(workspaceId, userId)`.
- **Database queries (parallelized):**
  - Site count.
  - Workspace membership with workspace plan.
  - AI generation job count for current calendar month.
- **Note:** Storage and bandwidth usage are currently hardcoded to 0 (not yet implemented).

---

## 17. Responsive Behavior

| Breakpoint | Sidebar | Topbar | Content | Tab Bar |
|---|---|---|---|---|
| >= lg (1024 px) | Visible, fixed left 220 px | Fixed top, offset left 220 px | ml-[220px], max-w-[1220px] | Hidden |
| < lg | Hidden | Visible (full width assumed) | Full width | Visible, fixed bottom 56 px |

**Grid adaptations:**
- Stat cards: 4-column grid (no explicit responsive override -- may need attention on tablet).
- Recent sites: `grid-cols-2` default, `grid-cols-4` at `sm` breakpoint.
- Activity + Health: 3-column grid with activity spanning 2 columns (no explicit responsive override).
- Quick actions: Flex row with `flex-1` children.

---

## 18. Color System Reference

| Token | Hex | Usage |
|---|---|---|
| Primary red | `#E42313` | Buttons, active states, links, sparkline, brand accents |
| Primary red hover | `#C91F10` / `#c91e0f` | Button hover states |
| Text primary | `#0D0D0D` | Headings, primary text |
| Text secondary | `#7A7A7A` | Labels, inactive nav, secondary text |
| Text muted | `#B0B0B0` | Timestamps, subtitles, placeholders |
| Border | `#E8E8E8` | Card borders, dividers, sidebar border |
| Surface background | `#FAFAFA` | Page background |
| Surface hover | `#F4F4F4` | Hover states, skeleton backgrounds, empty-state backgrounds |
| Success green | `#22C55E` | Published status, positive trends, healthy usage |
| Warning yellow | `#EAB308` | Draft status, moderate usage |
| Error red | `#EF4444` | Danger borders, high usage |
| Published badge bg | `#DCFCE7` | Site card published badge |
| Published badge text | `#166534` | Site card published badge |
| Draft badge bg | `#FEF9C3` | Site card draft badge |
| Draft badge text | `#854D0E` | Site card draft badge |
