# Dashboard + Sites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill ~50 gaps across Dashboard, Sites List, Site Detail, and Site Creation to complete the daily product loop per PRD.

**Architecture:** Fix-in-place — modify existing files. 2 schema fields added, ~12 backend files modified, ~20 frontend files modified, 2 new components created. All changes follow existing patterns (tRPC router → service → Prisma).

**Tech Stack:** Next.js 16, tRPC 11, Prisma 5, React 19, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-03-24-dashboard-sites-design.md`

**Important:** Each task is a self-contained commit. Tasks within a sub-system should be done in order. Sub-systems (A/B/C/D) can be done in any order but A→B→C is recommended (follows the daily user loop).

---

## Task 0: Schema Migration (Prerequisite)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `isPrimary` to Domain model**

Find the `Domain` model and add after the `autoRenewSsl` field:
```prisma
  isPrimary     Boolean   @default(false)
```

- [ ] **Step 2: Add `difficulty` to Template model**

Find the `Template` model and add after the `previewUrl` field:
```prisma
  difficulty    String    @default("BEGINNER")
```

- [ ] **Step 3: Push schema changes**

Run: `npx prisma db push`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "chore: add isPrimary to Domain, difficulty to Template"
```

---

## PART A: DASHBOARD (Tasks 1-6)

### Task 1: Dashboard Service Fixes (Backend)

**Files:**
- Modify: `server/services/dashboard.service.ts`

Covers spec gaps: 3.1 (stat data), 3.10 (visits change), 3.11 (actor name), 3.2 (activity grouping).

- [ ] **Step 1: Fix `getDashboardStats` — add visitsChange, dailyVisitors, memberAvatars**

In `getDashboardStats`, add these to the `Promise.all` array:
```typescript
// Add to existing Promise.all:
prisma.siteAnalytics.aggregate({
  where: { site: { workspaceId }, date: { gte: previousMonth, lt: startOfMonth } },
  _sum: { visitors: true },
}),
prisma.siteAnalytics.findMany({
  where: { site: { workspaceId }, date: { gte: thirtyDaysAgo } },
  select: { date: true, visitors: true },
  orderBy: { date: "asc" },
}),
prisma.workspaceMember.findMany({
  where: { workspaceId, status: "ACTIVE" },
  take: 5,
  include: { user: { select: { fullName: true, avatar: true } } },
}),
```

Where `thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)` and `previousMonth` is 60 days ago to 30 days ago.

Compute `visitsChange`:
```typescript
const previousVisits = previousMonthAgg._sum.visitors ?? 0;
const visitsChange = previousVisits > 0
  ? Math.round(((monthlyVisits - previousVisits) / previousVisits) * 100)
  : 0;
```

Add to return:
```typescript
dailyVisitors: dailyVisitorRecords.map(r => r.visitors),
memberAvatars: members.map(m => ({ name: m.user.fullName, avatar: m.user.avatar })),
```

- [ ] **Step 2: Fix `getActivityFeed` — add grouping, filtering, actor resolution**

Replace `getActivityFeed` with:
```typescript
export async function getActivityFeed(
  workspaceId: string,
  options: { userId?: string; limit?: number; offset?: number } = {}
): Promise<{ groups: ActivityGroup[] }> {
  const { userId, limit = 15, offset = 0 } = options;

  const where: Record<string, unknown> = { workspaceId };
  if (userId) where.actorId = userId;

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  // Resolve actor names
  const actorIds = [...new Set(logs.map(l => l.actorId).filter(Boolean))] as string[];
  const actors = actorIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, fullName: true, avatar: true },
      })
    : [];
  const actorMap = new Map(actors.map(a => [a.id, a]));

  // Group by date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: ActivityGroup[] = [];
  const buckets: Record<string, typeof logs> = { Today: [], Yesterday: [], "This Week": [], Older: [] };

  for (const log of logs) {
    const d = new Date(log.createdAt);
    if (d >= today) buckets.Today.push(log);
    else if (d >= yesterday) buckets.Yesterday.push(log);
    else if (d >= weekAgo) buckets["This Week"].push(log);
    else buckets.Older.push(log);
  }

  for (const [label, entries] of Object.entries(buckets)) {
    if (entries.length === 0) continue;
    groups.push({
      label,
      entries: entries.map(log => {
        const actor = log.actorId ? actorMap.get(log.actorId) : null;
        return {
          id: log.id,
          action: log.action,
          actorName: actor?.fullName ?? "System",
          actorAvatar: actor?.avatar ?? null,
          description: log.description,
          siteId: log.siteId ?? null,
          createdAt: log.createdAt,
        };
      }),
    });
  }

  return { groups };
}
```

Add types to `lib/validations/dashboard.ts`:
```typescript
export interface ActivityGroup {
  label: string;
  entries: ActivityEntry[];
}
```

- [ ] **Step 3: Update dashboard router to pass userId filter**

In `server/trpc/routers/dashboard.ts`, update the `activity` procedure to accept an optional filter:
```typescript
  activity: protectedProcedure
    .input(z.object({ filter: z.enum(["all", "mine", "team"]).optional().default("all") }).optional())
    .query(async ({ ctx, input }) => {
      const member = await ctx.prisma.workspaceMember.findFirst({
        where: { userId: ctx.session.user.id },
        select: { workspaceId: true },
      });
      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
      const userId = input?.filter === "mine" ? ctx.session.user.id : undefined;
      return getActivityFeed(member.workspaceId, { userId });
    }),
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add server/services/dashboard.service.ts server/trpc/routers/dashboard.ts lib/validations/dashboard.ts
git commit -m "feat(dashboard): fix stats calculation, activity grouping, actor resolution

Visits change now computed from rolling 30d periods. Activity feed
grouped by Today/Yesterday/Week/Older with actor name resolution.
Added dailyVisitors and memberAvatars to stats. Spec gaps 3.1-3.2, 3.10-3.11."
```

---

### Task 2: Dashboard Frontend — Stat Cards + Visuals

**Files:**
- Modify: `components/dashboard/stat-card.tsx`
- Modify: `app/dashboard/page.tsx`

Covers spec gaps: 3.1 (sparkline, donut, avatars, trends).

- [ ] **Step 1: Add MiniDonut, Sparkline, AvatarStack to stat-card.tsx**

Read the current `stat-card.tsx` to understand its props, then add these inline components and extend `StatCard` props to accept optional `chart`, `sparkline`, `avatarStack`, and `trend` data. The components should be:

- `MiniDonut`: SVG circle with stroke-dasharray segments for published/draft/archived.
- `Sparkline`: SVG polyline from `number[]` data.
- `AvatarStack`: Stack of `<img>` or initials circles.
- `TrendArrow`: Green up or red down arrow with % text.

- [ ] **Step 2: Wire enhanced stat cards in dashboard page**

Update `app/dashboard/page.tsx` to pass the new data from `stats.data` to each StatCard:
- Total Sites: pass `donut: { published, draft, archived }`
- Monthly Visits: pass `sparkline: stats.data.dailyVisitors`, `trend: stats.data.visitsChange`
- Collaborators: pass `avatarStack: stats.data.memberAvatars`

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/stat-card.tsx app/dashboard/page.tsx
git commit -m "feat(dashboard): stat cards with donut, sparkline, avatar stack, trend arrows"
```

---

### Task 3: Dashboard Frontend — Activity Feed, Empty States, Dunning

**Files:**
- Modify: `components/dashboard/activity-feed.tsx`
- Modify: `components/dashboard/empty-state.tsx`
- Modify: `app/dashboard/page.tsx`

Covers spec gaps: 3.2 (activity frontend), 3.3 (empty states), 3.4 (dunning), 3.6 (quick actions hide), 3.7 (health conditional), 3.12 (skeleton).

- [ ] **Step 1: Rewrite activity feed with grouping + filter tabs**

Read current `activity-feed.tsx`. Rewrite to:
- Accept `groups: ActivityGroup[]` instead of flat `entries`.
- Add filter tabs (All / My Activity / Team Activity) with state.
- Render sections with date labels (Today, Yesterday, etc.).
- Add "Show more" button that increases limit.

- [ ] **Step 2: Update empty state with 4 role variants**

Read current `empty-state.tsx`. Add `variant` prop: `"owner_new" | "owner_empty" | "editor_no_sites" | "viewer"`. Each has different heading, description, and CTAs per PRD 5.6 DASH-2.

- [ ] **Step 3: Wire dunning, health conditional, quick actions hide in dashboard page**

In `app/dashboard/page.tsx`:
- Query subscription status (add `trpc.billing.overview.useQuery()`)
- Show `DunningBanner` when `billing.data?.subscription?.status === "PAST_DUE"`
- Hide QuickActions when user created >30 days ago AND has sites
- Only show WorkspaceHealth when any metric >50%
- Pass member role to EmptyState for role-based variant
- Expand skeleton to match full layout

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/activity-feed.tsx components/dashboard/empty-state.tsx app/dashboard/page.tsx
git commit -m "feat(dashboard): activity grouping, role-based empty states, dunning wiring

Activity feed now shows grouped sections with filter tabs. Empty state
has 4 variants by role. Dunning banner wired to subscription status.
Quick actions hide after 30d. Health only shows when >50%."
```

---

### Task 4: Dashboard — Recent Sites Enhancement

**Files:**
- Modify: `components/dashboard/recent-sites.tsx`
- Modify: `components/dashboard/site-card.tsx`

Covers spec gap: 3.5.

- [ ] **Step 1: Enhance site card with hover overlay + metadata**

Read current `site-card.tsx`. Add:
- Hover overlay with [Edit] + [Manage] buttons (CSS `group-hover`).
- Quick publish icon for drafts, copy URL icon for published.
- Display: page count, visitor count, "Edited 2h ago".

- [ ] **Step 2: Add empty slot placeholder + "View All" link**

In `recent-sites.tsx`:
- Add section header with "View All →" link to `/dashboard/sites`.
- When < 4 sites, render a dashed-border placeholder card "Create your next project".

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/recent-sites.tsx components/dashboard/site-card.tsx
git commit -m "feat(dashboard): recent sites hover overlay, quick publish, empty slot"
```

---

### Task 5: Dashboard — Sidebar Plan Usage + Topbar Verification

**Files:**
- Modify: `components/dashboard/sidebar.tsx`
- Modify: `components/dashboard/topbar.tsx`

Covers spec gaps: 3.8, 3.9.

- [ ] **Step 1: Add plan usage to sidebar bottom**

Read current `sidebar.tsx`. Add a bottom section showing:
- Workspace name
- Plan + site count: "Free 3/5 sites"
- "Upgrade" link to `/dashboard/billing`

Query workspace data (plan + site count) — either via prop from layout or via tRPC query.

- [ ] **Step 2: Verify topbar completeness**

Read current `topbar.tsx`. Verify these elements exist and are wired:
- Logo → home link
- Search input → Cmd+K command palette trigger
- Bell icon → notification dropdown
- ? Help → contextual help dropdown
- Avatar → dropdown menu
- Breadcrumbs on nested pages

Add any missing elements.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/sidebar.tsx components/dashboard/topbar.tsx
git commit -m "feat(dashboard): sidebar plan usage, topbar completeness check"
```

---

### Task 6: User Preferences CRUD (Backend)

**Files:**
- Modify: `server/services/account.service.ts`
- Modify: `server/trpc/routers/account.ts`
- Modify: `lib/validations/account.ts`

Covers spec gap: 4.1 (prerequisite for saved view preferences in Sites List).

- [ ] **Step 1: Add Zod schema for preferences**

In `lib/validations/account.ts`, add:
```typescript
export const updatePreferencesSchema = z.object({
  siteViewMode: z.enum(["grid", "list"]).optional(),
  siteViewSort: z.string().optional(),
  analyticsRange: z.enum(["7d", "30d", "90d"]).optional(),
  theme: z.enum(["light"]).optional(),
  locale: z.string().optional(),
});
```

- [ ] **Step 2: Add service functions**

In `server/services/account.service.ts`, add:
```typescript
export async function getPreferences(userId: string) {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  return prefs ?? {
    siteViewMode: "grid",
    siteViewSort: null,
    analyticsRange: "7d",
    theme: "light",
    locale: null,
  };
}

export async function updatePreferences(userId: string, data: Record<string, unknown>) {
  return prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
```

- [ ] **Step 3: Add router endpoints**

In `server/trpc/routers/account.ts`, add a `preferences` sub-router:
```typescript
preferences: router({
  get: protectedProcedure.query(({ ctx }) => getPreferences(ctx.session.user.id)),
  update: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(({ ctx, input }) => updatePreferences(ctx.session.user.id, input)),
}),
```

Add imports for `getPreferences`, `updatePreferences`, and `updatePreferencesSchema`.

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add lib/validations/account.ts server/services/account.service.ts server/trpc/routers/account.ts
git commit -m "feat(account): add user preferences CRUD (get + upsert)

Enables saved view mode and sort for Sites List page."
```

---

## PART B: SITES LIST (Tasks 7-11)

### Task 7: Sites List — Pagination + Saved Preferences

**Files:**
- Modify: `app/dashboard/sites/page.tsx`

Covers spec gaps: 4.1 (saved prefs), 4.2 (pagination).

- [ ] **Step 1: Wire saved preferences on mount + change**

Read current `sites/page.tsx`. Add:
- Load preferences on mount: `const prefs = trpc.account.preferences.get.useQuery()`
- Initialize `viewMode` and `sort` from `prefs.data` when loaded.
- On viewMode/sort change, call `trpc.account.preferences.update.useMutation()`.

- [ ] **Step 2: Add pagination state and controls**

Add `page` state (default 1). Wire to `sitesQuery` input. Add pagination UI below grid/list:
```tsx
<div className="flex items-center justify-between mt-6">
  <p className="text-sm text-gray-500">
    Page {page} of {sitesQuery.data?.totalPages ?? 1}
  </p>
  <div className="flex gap-2">
    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
    <button disabled={page >= (sitesQuery.data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}>Next</button>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/sites/page.tsx
git commit -m "feat(sites): pagination controls, saved view preferences"
```

---

### Task 8: Sites Backend — Slug Fix, Transfer, Folder Rename

**Files:**
- Modify: `server/services/sites.service.ts`
- Modify: `server/services/folder.service.ts`
- Modify: `server/trpc/routers/sites.ts`
- Modify: `lib/validations/sites.ts`

Covers spec gaps: 4.5 (transfer), 4.9 (folder rename), 4.10 (slug fix), 6.1 (slug check).

- [ ] **Step 1: Fix slug global uniqueness**

In `sites.service.ts`, in `generateUniqueSlug`, change:
```typescript
const existing = await prisma.site.findFirst({ where: { slug: candidate, workspaceId } });
```
to:
```typescript
const existing = await prisma.site.findFirst({ where: { slug: candidate } });
```

Remove the `workspaceId` parameter from the function signature and callers.

- [ ] **Step 2: Add `checkSlugAvailability` function**

```typescript
export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const existing = await prisma.site.findFirst({ where: { slug } });
  return !existing;
}
```

- [ ] **Step 3: Add `transferSite` function**

```typescript
export async function transferSite(siteId: string, newOwnerId: string, currentUserId: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error("SITE_NOT_FOUND");
  if (site.createdBy !== currentUserId) throw new Error("NOT_OWNER");

  const newOwner = await prisma.workspaceMember.findFirst({
    where: { userId: newOwnerId, workspaceId: site.workspaceId },
  });
  if (!newOwner) throw new Error("MEMBER_NOT_FOUND");

  await prisma.$transaction([
    prisma.site.update({ where: { id: siteId }, data: { createdBy: newOwnerId } }),
    prisma.sitePermission.create({
      data: { memberId: newOwner.id, siteId, roleOverride: "EDITOR", grantedBy: currentUserId },
    }),
  ]);

  return { success: true };
}
```

- [ ] **Step 4: Add `renameFolder` function in folder.service.ts**

```typescript
export async function renameFolder(folderId: string, name: string) {
  return prisma.folder.update({ where: { id: folderId }, data: { name } });
}
```

- [ ] **Step 5: Add validation schemas**

In `lib/validations/sites.ts`, add:
```typescript
export const transferSiteSchema = z.object({
  siteId: z.string(),
  newOwnerId: z.string(),
});

export const checkSlugSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
});
```

- [ ] **Step 6: Add router endpoints**

In `server/trpc/routers/sites.ts`:
```typescript
  checkSlug: protectedProcedure
    .input(checkSlugSchema)
    .query(async ({ input }) => ({ available: await checkSlugAvailability(input.slug) })),

  transfer: protectedProcedure
    .input(transferSiteSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        return await transferSite(input.siteId, input.newOwnerId, ctx.session.user.id);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "NOT_OWNER")
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the site owner can transfer." });
        if (e instanceof Error && e.message === "MEMBER_NOT_FOUND")
          throw new TRPCError({ code: "NOT_FOUND", message: "Member not found in workspace." });
        throw e;
      }
    }),
```

Add folder rename:
```typescript
  folders: router({
    // ... existing list, create, delete, moveSite ...
    rename: protectedProcedure
      .input(z.object({ id: z.string(), name: z.string().min(1).max(50) }))
      .mutation(async ({ input }) => renameFolder(input.id, input.name)),
  }),
```

Add imports for new functions and schemas.

- [ ] **Step 7: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 8: Commit**

```bash
git add server/services/sites.service.ts server/services/folder.service.ts server/trpc/routers/sites.ts lib/validations/sites.ts
git commit -m "feat(sites): slug global uniqueness, transfer, folder rename, slug check

Fixed slug check to be global (not per-workspace). Added site transfer
within workspace, folder rename, and slug availability check endpoint."
```

---

### Task 9: Sites Frontend — Context Menu + Transfer Modal + Bulk Ops

**Files:**
- Modify: `components/sites/context-menu.tsx`
- Modify: `components/sites/bulk-action-bar.tsx`
- Create: `components/sites/transfer-modal.tsx`
- Modify: `app/dashboard/sites/page.tsx`

Covers spec gaps: 4.4, 4.5, 4.6.

- [ ] **Step 1: Verify and complete context menu actions**

Read current `context-menu.tsx`. Add missing actions: Transfer Site, View Published (disabled if draft with tooltip), Copy Site URL (clipboard + toast). Wire Transfer Site to open transfer modal.

- [ ] **Step 2: Create transfer modal**

Create `components/sites/transfer-modal.tsx`:
- Fetches workspace members via `trpc.team.list`
- Dropdown to select member (Admin/Editor only)
- Confirmation text: "Transfer ownership of '{name}' to {member}. You will become an Editor."
- Confirm + Cancel CTAs
- Calls `trpc.sites.transfer.useMutation`

- [ ] **Step 3: Complete bulk action bar**

Read current `bulk-action-bar.tsx`. Add:
- "Move to Folder" action with folder picker dropdown
- Cap selection at 25 (if `selectedIds.size > 25`, show toast warning)
- Add shift+click range selection in the sites page selection handler

- [ ] **Step 4: Commit**

```bash
git add components/sites/context-menu.tsx components/sites/bulk-action-bar.tsx components/sites/transfer-modal.tsx app/dashboard/sites/page.tsx
git commit -m "feat(sites): complete context menu, transfer modal, bulk ops

Added Transfer Site, View Published, Copy URL to context menu.
Created transfer modal with member selector. Bulk ops: move to folder,
25 item cap, shift+click selection."
```

---

### Task 10: Sites Frontend — Advanced Filters + List View Columns

**Files:**
- Modify: `components/sites/site-filters.tsx`
- Modify: `components/sites/site-list-view.tsx`
- Modify: `components/sites/site-card-full.tsx`
- Modify: `lib/validations/sites.ts`
- Modify: `server/services/sites.service.ts`

Covers spec gaps: 4.3, 4.7, 4.8.

- [ ] **Step 1: Expand `listSitesSchema` with new filter fields**

In `lib/validations/sites.ts`, expand the existing schema:
```typescript
export const listSitesSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(50).default(12),
  status: z.string().optional(),
  sort: z.enum(["lastEdited", "name", "created", "traffic", "pages", "published"]).default("lastEdited"),
  search: z.string().optional(),
  folderId: z.string().nullable().optional(),
  // New filters:
  createdBy: z.string().optional(),
  dateRange: z.enum(["7d", "30d", "90d"]).optional(),
  templateUsed: z.string().optional(),
  hasCustomDomain: z.boolean().optional(),
  hasTraffic: z.enum(["none", "1-100", "100-1000", "1000+"]).optional(),
});
```

- [ ] **Step 2: Expand `listSites` service with new where clauses**

In `sites.service.ts`, add to the `where` building in `listSites`:
```typescript
if (filters.createdBy) where.createdBy = filters.createdBy;
if (filters.dateRange) {
  const days = filters.dateRange === "7d" ? 7 : filters.dateRange === "30d" ? 30 : 90;
  where.createdAt = { gte: new Date(Date.now() - days * 86400000) };
}
if (filters.templateUsed) where.template = filters.templateUsed;
if (filters.hasCustomDomain !== undefined) {
  if (filters.hasCustomDomain) where.domains = { some: {} };
  else where.domains = { none: {} };
}
```

Also expand the `select` to include domain info for list view:
```typescript
domains: { take: 1, select: { domain: true } },
```

- [ ] **Step 3: Update SiteFilters component with new filter controls**

Read current `site-filters.tsx`. Add filter dropdowns for: Created by, Date range, Template, Has domain, Has traffic. Load dropdown options from tRPC queries where needed.

- [ ] **Step 4: Update list view with additional columns**

Read current `site-list-view.tsx`. Add columns: Pages, Visitors (30d), Domain, Folder.

- [ ] **Step 5: Enhance grid card**

Read current `site-card-full.tsx`. Add missing fields per PRD: URL, page count, visitor count, "Edited 2h ago by {name}".

- [ ] **Step 6: Commit**

```bash
git add components/sites/site-filters.tsx components/sites/site-list-view.tsx components/sites/site-card-full.tsx lib/validations/sites.ts server/services/sites.service.ts
git commit -m "feat(sites): 7-type advanced filters, list view columns, card enhancement"
```

---

### Task 11: Site Creation — Template Cloning + Slug Check + AI Credits

**Files:**
- Modify: `server/services/sites.service.ts`
- Modify: `components/sites/create-site-modal.tsx`
- Modify: `components/templates/template-card.tsx`

Covers spec gaps: 6.1, 6.2, 6.3, 6.4.

- [ ] **Step 1: Add template cloning to `createSite`**

In `sites.service.ts`, in `createSite`, add template handling:
```typescript
if (input.method === "template" && input.templateId) {
  const template = await prisma.template.findUnique({ where: { id: input.templateId } });
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");

  const site = await prisma.$transaction(async (tx) => {
    const site = await tx.site.create({
      data: { name: input.name, slug, status: "DRAFT", workspaceId, createdBy: userId, pages: 0, lastEditedAt: new Date() },
    });

    // Clone template pages
    const templatePages = template.pages as Array<{ name: string; slug: string; blocks: unknown; isHomePage?: boolean }>;
    for (let i = 0; i < templatePages.length; i++) {
      const tp = templatePages[i];
      await tx.page.create({
        data: { siteId: site.id, name: tp.name, slug: tp.slug, position: i, blocks: tp.blocks ?? [], isHomePage: tp.isHomePage ?? i === 0 },
      });
    }

    await tx.site.update({ where: { id: site.id }, data: { pages: templatePages.length } });
    await tx.template.update({ where: { id: input.templateId! }, data: { usageCount: { increment: 1 } } });

    return site;
  });

  return site;
}
```

- [ ] **Step 2: Add slug live check + AI credits to create modal**

Read current `create-site-modal.tsx`. Add:
- Slug preview: auto-generate from name as user types, show below name input.
- Debounced availability check using `trpc.sites.checkSlug.useQuery` with 300ms debounce.
- AI credit indicator: query workspace health for AI credits used/limit. Show "{N}/{limit} credits remaining". Lock AI card if 0 credits.

- [ ] **Step 3: Add difficulty badge + usage count to template card**

Read current `template-card.tsx`. Add:
- Difficulty badge: `template.difficulty` displayed as colored badge (Beginner=green, Intermediate=blue).
- Usage count: format `template.usageCount` (e.g., 2400 → "2.4K sites").

- [ ] **Step 4: Commit**

```bash
git add server/services/sites.service.ts components/sites/create-site-modal.tsx components/templates/template-card.tsx
git commit -m "feat(sites): template cloning with pages, slug live check, difficulty badges

createSite now clones template pages when method=template. Create modal
has live slug availability check. Template cards show difficulty + usage."
```

---

## PART C: SITE DETAIL (Tasks 12-17)

### Task 12: Site Detail Backend — Health Score + Form Blocks + Plan Enforcement

**Files:**
- Modify: `server/services/site-detail.service.ts`
- Modify: `server/services/analytics.service.ts`
- Modify: `server/services/share-link.service.ts`
- Modify: `app/api/public/forms/[siteId]/[formBlockId]/route.ts`

Covers spec gaps: 5.2, 5.5, 5.10 (plan clamping), 5.9 (share expiry), 5.14.

- [ ] **Step 1: Enhance health score in `getSiteOverview`**

Replace the basic health score computation with:
```typescript
// SEO completeness
const pagesWithSeo = await prisma.page.count({
  where: { siteId, seoTitle: { not: null }, seoDescription: { not: null } },
});
const seoScore = totalPages > 0 ? Math.round((pagesWithSeo / totalPages) * 100) : 0;

// Content fill rate
const pagesWithContent = await prisma.page.count({
  where: { siteId, blocks: { not: { equals: [] } } },
});
// Note: checking ≥3 blocks requires raw query or client filtering
const contentScore = totalPages > 0 ? Math.round((pagesWithContent / totalPages) * 100) : 0;

// SSL
const sslDomain = await prisma.domain.findFirst({
  where: { siteId, sslStatus: "ACTIVE" },
});
const sslScore = sslDomain ? 100 : 0;

// Favicon
const faviconScore = site.touchIcon ? 100 : 0;

const healthScore = Math.round((seoScore * 0.3 + contentScore * 0.3 + sslScore * 0.2 + faviconScore * 0.2));
```

Add `healthBreakdown` to return: `{ seo: seoScore, content: contentScore, ssl: sslScore, favicon: faviconScore }`.

- [ ] **Step 2: Add formBlocks to overview**

Add to `getSiteOverview` Promise.all:
```typescript
prisma.formBlock.findMany({
  where: { siteId, isActive: true },
  select: { id: true, name: true, _count: { select: { submissions: true } } },
}),
```

Add to return: `formBlocks`.

- [ ] **Step 3: Add plan retention clamping to analytics service**

In `analytics.service.ts`, at the start of `getSiteAnalytics`:
```typescript
// Clamp range to plan limit
const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
const ws = await prisma.workspace.findUnique({ where: { id: site!.workspaceId }, select: { plan: true } });
const maxDays = { FREE: 7, PRO: 30, BUSINESS: 90 }[ws!.plan] ?? 7;
const requestedDays = params.range === "90d" ? 90 : params.range === "30d" ? 30 : 7;
const clampedDays = Math.min(requestedDays, maxDays);
```

Return `clampedRange` in response.

- [ ] **Step 4: Add share link expiry validation**

In `share-link.service.ts`, in `createShareLink`, add:
```typescript
// Check plan expiry max
const maxDays = { FREE: 7, PRO: 30, BUSINESS: 90 }[plan] ?? 7;
if (expiresInDays > maxDays) {
  throw new Error("EXPIRY_EXCEEDS_PLAN");
}
```

- [ ] **Step 5: Add form submission plan limit to public endpoint**

In `app/api/public/forms/[siteId]/[formBlockId]/route.ts`, before creating the submission:
```typescript
// Check monthly plan limit
const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
const ws = await prisma.workspace.findUnique({ where: { id: site!.workspaceId }, select: { plan: true } });
const limits = { FREE: 100, PRO: 2500, BUSINESS: Infinity };
const limit = limits[ws!.plan as keyof typeof limits] ?? 100;

if (limit !== Infinity) {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const count = await prisma.formSubmission.count({
    where: { site: { workspaceId: site!.workspaceId }, createdAt: { gte: startOfMonth } },
  });
  if (count >= limit) {
    return NextResponse.json({ error: "Monthly form submission limit reached" }, { status: 402 });
  }
}
```

- [ ] **Step 6: Verify compilation**

Run: `npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add server/services/site-detail.service.ts server/services/analytics.service.ts server/services/share-link.service.ts app/api/public/forms/[siteId]/[formBlockId]/route.ts
git commit -m "feat(site-detail): health score, form blocks, plan limit enforcement

Health score now computed from SEO + content + SSL + favicon. Form blocks
included in overview. Analytics clamped to plan retention. Share link
expiry validated. Form submissions enforce monthly plan limit."
```

---

### Task 13: Site Detail Frontend — Overview Tab Enhancement

**Files:**
- Modify: `components/site-detail/overview-tab.tsx`
- Modify: `components/site-detail/site-header.tsx`

Covers spec gaps: 5.1, 5.2, 5.11, 5.12.

- [ ] **Step 1: Render 6 stat cards with visual components**

Read current `overview-tab.tsx`. Wire the overview data to 6 StatCards using the visual components from Task 2 (Sparkline, AvatarStack, etc.).

- [ ] **Step 2: Add form submissions section**

Below stat cards, add a "Form Submissions" section rendering `formBlocks` from overview data. Each form block shows name + submission count. Click to expand last 3 submissions inline. "View All" link.

- [ ] **Step 3: Add health score expandable panel**

Add expandable panel showing health breakdown: SEO %, Content %, SSL status, Favicon status. Each bar is clickable → navigates to relevant tab.

- [ ] **Step 4: Add loading/error states**

Add skeleton state (DETAIL-SKEL) and error state (DETAIL-ERR) with Retry + Back CTAs.

- [ ] **Step 5: Fix "View Published" disabled state in site-header**

Read current `site-header.tsx`. Add conditional disabled + tooltip on "View Site" button when `site.status !== "PUBLISHED"`.

- [ ] **Step 6: Commit**

```bash
git add components/site-detail/overview-tab.tsx components/site-detail/site-header.tsx
git commit -m "feat(site-detail): 6 stat cards, form submissions, health panel, loading states

Overview tab now has full stat cards with visuals, form submissions
section with inline expand, health score panel. Header View Published
disabled for drafts. Added skeleton + error states."
```

---

### Task 14: Site Detail — Settings + SEO Tabs (SD-03, SD-04)

**Files:**
- Modify: `components/site-detail/settings-tab.tsx`
- Modify: `components/site-detail/seo-tab.tsx`

Covers spec gaps: 5.6, 5.7.

- [ ] **Step 1: Expand settings tab**

Read current `settings-tab.tsx`. Add missing fields per PRD SD-03:
- Favicon upload + preview (16/32/64px)
- Touch icon upload (180x180)
- Site password toggle (Pro+ gate)
- Custom code head/body textareas (Pro+ gate, 10KB max)
- Social links editor (add/remove platform + URL)

All fields already exist in Prisma schema (`headCode`, `bodyCode`, `socialLinks`, `publishedPassword`, `touchIcon`). Wire to `siteDetail.settings.update`.

- [ ] **Step 2: Expand SEO tab**

Read current `seo-tab.tsx`. Add:
- Meta title input with 60-char counter + live Google search preview
- Meta description textarea with 160-char counter
- og:image upload with social card preview
- Meta title template field
- Redirects management section: table with CRUD + CSV import/export buttons

For redirects, wire to existing `siteDetail.redirects.*` router endpoints. Add import/export later (Task 15).

- [ ] **Step 3: Commit**

```bash
git add components/site-detail/settings-tab.tsx components/site-detail/seo-tab.tsx
git commit -m "feat(site-detail): expanded settings (favicon, code, social) + SEO (preview, redirects)"
```

---

### Task 15: Site Detail — Redirect Import/Export + Domains + Sharing

**Files:**
- Modify: `server/services/redirect.service.ts`
- Modify: `server/trpc/routers/site-detail.ts`
- Modify: `components/site-detail/domains-tab.tsx`
- Modify: `components/site-detail/access-tab.tsx`

Covers spec gaps: 5.8, 5.9, 5.13.

- [ ] **Step 1: Add redirect import/export to service + router**

In `redirect.service.ts`:
```typescript
export async function importRedirects(siteId: string, csv: string, plan: string) {
  const rows = csv.trim().split("\n").slice(1); // skip header
  const data = rows.map(row => {
    const [fromPath, toUrl, type] = row.split(",").map(s => s.trim());
    return { siteId, fromPath, toUrl, type: type === "302" ? "302" : "301" };
  });
  // Check plan limit before import
  const existing = await prisma.redirect.count({ where: { siteId } });
  const limits = { FREE: 100, PRO: 500, BUSINESS: Infinity };
  const limit = limits[plan as keyof typeof limits] ?? 100;
  if (existing + data.length > limit) throw new Error("REDIRECT_LIMIT");

  return prisma.redirect.createMany({ data });
}

export async function exportRedirects(siteId: string): Promise<string> {
  const redirects = await prisma.redirect.findMany({ where: { siteId } });
  const header = "from,to,type";
  const rows = redirects.map(r => `${r.fromPath},${r.toUrl},${r.type}`);
  return [header, ...rows].join("\n");
}
```

Add router endpoints in `site-detail.ts`:
```typescript
import: protectedProcedure
  .input(z.object({ siteId: z.string(), csv: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({ ... });
    return importRedirects(input.siteId, input.csv, member?.workspace?.plan ?? "FREE");
  }),

export: protectedProcedure
  .input(z.object({ siteId: z.string() }))
  .query(async ({ input }) => exportRedirects(input.siteId)),
```

- [ ] **Step 2: Expand domains tab**

Read current `domains-tab.tsx`. Add:
- Primary domain toggle with visual indicator
- SSL details expandable section per domain
- Provider guide links (static: GoDaddy, Namecheap, Cloudflare, Google)
- Auto-verify polling every 30s using `refetchInterval`

- [ ] **Step 3: Expand sharing/access tab**

Read current `access-tab.tsx`. Add:
- QR code generation per share link (use inline SVG or lightweight library)
- Display share link name, password indicator, expiry, view count
- Plan-limited expiry options (disable options beyond plan max)

- [ ] **Step 4: Commit**

```bash
git add server/services/redirect.service.ts server/trpc/routers/site-detail.ts components/site-detail/domains-tab.tsx components/site-detail/access-tab.tsx
git commit -m "feat(site-detail): redirect CSV import/export, domains primary toggle, sharing QR codes"
```

---

### Task 16: Site Detail — Form Submissions Table + Drawer

**Files:**
- Create: `components/site-detail/submission-drawer.tsx`
- Modify: `components/site-detail/overview-tab.tsx`

Covers spec gaps: 5.3, 5.4.

- [ ] **Step 1: Create submission detail drawer**

Create `components/site-detail/submission-drawer.tsx`:
- Right slide drawer (480px width, slide from right)
- Shows all form field data as label:value pairs
- Metadata: submitted at, source URL, IP (masked last octet)
- Toggles: isRead, isSpam, isArchived
- Delete button (Owner/Admin only)
- Close on X or click outside
- Wire to `trpc.forms.update` + `trpc.forms.delete`

- [ ] **Step 2: Add full submissions table to overview**

Expand the form submissions section in overview tab to include a full table view:
- Table columns: Submitted (date), Form (name), Data Preview (first 2 fields), Read badge, Spam badge
- Filter by form block
- Pagination 20/pg
- "Export CSV" button (client-side generation from query data)
- Click row → open submission drawer

- [ ] **Step 3: Commit**

```bash
git add components/site-detail/submission-drawer.tsx components/site-detail/overview-tab.tsx
git commit -m "feat(site-detail): form submission table with filters + detail drawer"
```

---

### Task 17: Publish Flow — Progress Polling + Success Enhancement

**Files:**
- Modify: `components/publish/publish-progress.tsx`
- Modify: `components/publish/publish-success.tsx`
- Modify: `app/dashboard/sites/[id]/publish/page.tsx`

Covers spec gaps: 5.16, 5.17, 5.18.

- [ ] **Step 1: Wire publish progress polling**

Read current `publish-progress.tsx`. Wire:
- `trpc.sites.publishStatus.useQuery({ jobId }, { refetchInterval: 2000 })`
- Display step indicators from `job.steps`
- Wire cancel button to `trpc.sites.cancelPublish`
- On COMPLETED → redirect to success view
- On FAILED → show error + retry button

- [ ] **Step 2: Enhance publish success**

Read current `publish-success.tsx`. Add:
- Live URL + domain URL with Copy + Open buttons
- Lighthouse score placeholder ("Calculating..." → show score when available)
- CTAs: Share with Client, View Analytics, Edit Site, Dashboard

- [ ] **Step 3: Wire publish page**

Read current `publish/page.tsx`. Wire the flow: pre-checks → trigger publish → show progress → show success.

- [ ] **Step 4: Commit**

```bash
git add components/publish/publish-progress.tsx components/publish/publish-success.tsx app/dashboard/sites/[id]/publish/page.tsx
git commit -m "feat(publish): progress polling every 2s, cancel support, success with URLs"
```

---

## PART D: AI WIZARD + COMMAND PALETTE (Tasks 18-19)

### Task 18: AI Wizard — Content Preferences + Progress Polling + Cancel

**Files:**
- Modify: `components/ai-wizard/step-pages.tsx`
- Modify: `components/ai-wizard/generation-progress.tsx`

Covers spec gaps: 6.5, 6.6, 6.7, 6.8.

- [ ] **Step 1: Add content preferences to step-pages**

Read current `step-pages.tsx`. Add below page selection:
- Tone: 6-option radio group (Professional/Casual/Creative/Minimal/Bold/Playful)
- Content mode: 3-option (Generate placeholder/Lorem ipsum/Leave empty)
- Image mode: 3-option (Stock photos/Colored placeholders/No images)
- Description textarea (500 chars max with counter)

Store selections in component state, pass to generation API.

- [ ] **Step 2: Wire generation progress polling + cancel**

Read current `generation-progress.tsx`. Add:
- Polling: `trpc.sites.publishStatus`-style query with `refetchInterval: 2000` on the AI generation job
- Step indicators: QUEUED → GENERATING_STRUCTURE → GENERATING_CONTENT → GENERATING_STYLES → COMPLETED
- Cancel button: triggers confirmation modal → `DELETE /sites/generate/:jobId`
- Navigation guard: `beforeunload` event handler to warn on navigate-away
- On COMPLETED → redirect to `/editor/:siteId`
- On FAILED → retry (max 1) + "Use Template Instead" + "Start Blank" fallbacks
- Credits exhausted check before starting: if at limit, show modal with upgrade CTA

- [ ] **Step 3: Commit**

```bash
git add components/ai-wizard/step-pages.tsx components/ai-wizard/generation-progress.tsx
git commit -m "feat(ai-wizard): content preferences, generation polling, cancel with guard

AI wizard now has tone/content/image preferences. Generation progress
polls every 2s with step indicators. Cancel triggers confirmation.
Navigation guard prevents accidental leave."
```

---

### Task 19: Command Palette — 6 Scopes + Keyboard Navigation

**Files:**
- Modify: `components/search/command-palette.tsx`

Covers spec gap: 6.9.

- [ ] **Step 1: Verify and complete command palette**

Read current `command-palette.tsx`. Verify all 6 search scopes:
1. Sites — search site names
2. Pages — search page names across sites
3. Team — search member names
4. Settings — navigation items (Profile, Account, Security, etc.)
5. Actions — Create Site, Invite Member, etc.
6. Help — search help articles

Add keyboard navigation:
- Arrow up/down to move between results
- Enter to select/navigate
- Esc to close
- Cmd+K to toggle

Add "Recent" section showing last 5 visited items (stored in localStorage).

- [ ] **Step 2: Commit**

```bash
git add components/search/command-palette.tsx
git commit -m "feat(search): command palette with 6 scopes, keyboard nav, recent items"
```

---

## Task 20: Final Verification

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit`

- [ ] **Step 2: Verify git status clean**

Run: `git status`

- [ ] **Step 3: Trace the daily loop end-to-end**

| Step | Route | Expected |
|------|-------|----------|
| Login → Dashboard | /dashboard | Stat cards with visuals, activity grouped, health conditional |
| Dashboard → Sites | /dashboard/sites | Grid/list with saved prefs, pagination, filters |
| Sites → Site Detail | /dashboard/sites/[id] | 6 stat cards, form submissions, health panel |
| Site Detail → Settings | /dashboard/sites/[id]/settings | Expanded fields (favicon, code, social) |
| Site Detail → SEO | /dashboard/sites/[id]/seo | Google preview, redirects CRUD |
| Site Detail → Domains | /dashboard/sites/[id]/domains | Primary toggle, SSL details |
| Site Detail → Sharing | /dashboard/sites/[id]/access | QR codes, named links, expiry limits |
| Site Detail → Analytics | /dashboard/sites/[id]/analytics | Plan-clamped ranges, metric cards |
| Create Site → Template | /dashboard/sites/new | Slug check, template cloning |
| Create Site → AI | AI wizard | Content prefs, progress polling |
