# Sub-Project 2: Dashboard Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full dashboard home page (DASH-1) with stat cards, quick actions bar, recent sites section, activity feed, workspace health indicator, avatar dropdown menu, dunning banner, and personalized empty states (DASH-2).

**Architecture:** Backend uses tRPC `dashboardRouter` calling `dashboard.service.ts` which queries Prisma. Frontend is a client component at `app/dashboard/page.tsx` consuming tRPC queries. Each visual section is its own component in `components/dashboard/`. Data flow: Page → tRPC query → Router → Service → Prisma.

**Tech Stack:** tRPC 11, Prisma 5, React 19, Tailwind CSS 4, Lucide React, Vitest

**PRD Reference:** Sections 5.6 (DASH-1), 5.7 (DASH-2), 3.2 (Topbar/Avatar), 6.1-6.3 (Components)

---

## File Structure

### Files to Create

| File | Responsibility |
|------|---------------|
| `server/services/dashboard.service.ts` | Business logic: getStats, getRecentSites, getActivity, getWorkspaceHealth, getQuickActions |
| `server/trpc/routers/dashboard.ts` | tRPC router: stats, recentSites, activity queries |
| `lib/validations/dashboard.ts` | Zod schemas for dashboard inputs/outputs |
| `components/dashboard/stat-card.tsx` | Reusable stat card (click target, trend, sparkline placeholder) |
| `components/dashboard/quick-actions.tsx` | Context-aware quick action buttons (max 4) |
| `components/dashboard/recent-sites.tsx` | 3 site cards + 1 "New" placeholder |
| `components/dashboard/site-card.tsx` | Individual site card with hover overlay |
| `components/dashboard/activity-feed.tsx` | Grouped activity entries with filter tabs |
| `components/dashboard/workspace-health.tsx` | Usage progress bars with color thresholds |
| `components/dashboard/avatar-dropdown.tsx` | DASH-4 dropdown: Profile, Settings, Billing, Help, Logout |
| `components/dashboard/dunning-banner.tsx` | Red payment failed banner |
| `components/dashboard/empty-state.tsx` | DASH-2 personalized empty states by role |
| `__tests__/dashboard-service.test.ts` | Service layer tests |
| `__tests__/dashboard-router.test.ts` | Router tests |
| `__tests__/dashboard-components.test.ts` | Component data/constant tests |

### Files to Modify

| File | Change |
|------|--------|
| `server/trpc/router.ts` | Add dashboardRouter to appRouter |
| `components/dashboard/topbar.tsx` | Replace avatar button with AvatarDropdown |
| `app/dashboard/page.tsx` | Replace placeholder with real dashboard |

---

## Task 1: Dashboard Zod Schemas

**Files:**
- Create: `lib/validations/dashboard.ts`

- [ ] **Step 1: Create dashboard validation schemas**

```typescript
// lib/validations/dashboard.ts
import { z } from "zod";

export const dashboardStatsSchema = z.object({
  totalSites: z.number(),
  publishedSites: z.number(),
  draftSites: z.number(),
  archivedSites: z.number(),
  monthlyVisits: z.number(),
  visitsChange: z.number(),
  collaborators: z.number(),
  pendingInvites: z.number(),
  lastPublishedSiteName: z.string().nullable(),
  lastPublishedAt: z.date().nullable(),
});

export const recentSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  thumbnail: z.string().nullable(),
  pages: z.number(),
  lastEditedAt: z.date(),
  publishedUrl: z.string().nullable(),
});

export const activityEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  actorName: z.string().nullable(),
  description: z.string().nullable(),
  siteId: z.string().nullable(),
  createdAt: z.date(),
});

export const workspaceHealthSchema = z.object({
  sites: z.object({ used: z.number(), limit: z.number() }),
  storage: z.object({ usedMB: z.number(), limitMB: z.number() }),
  aiCredits: z.object({ used: z.number(), limit: z.number() }),
  bandwidth: z.object({ usedMB: z.number(), limitMB: z.number() }),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
export type RecentSite = z.infer<typeof recentSiteSchema>;
export type ActivityEntry = z.infer<typeof activityEntrySchema>;
export type WorkspaceHealth = z.infer<typeof workspaceHealthSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add lib/validations/dashboard.ts
git commit -m "feat: add dashboard Zod schemas"
```

---

## Task 2: Dashboard Service (TDD)

**Files:**
- Create: `server/services/dashboard.service.ts`
- Test: `__tests__/dashboard-service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/dashboard-service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing service
vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    workspaceMember: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    invite: { count: vi.fn() },
    activityLog: { findMany: vi.fn() },
    siteAnalytics: { aggregate: vi.fn() },
    aIGenerationJob: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  getDashboardStats,
  getRecentSites,
  getActivityFeed,
  getWorkspaceHealth,
  getQuickActions,
} from "@/server/services/dashboard.service";

describe("Dashboard Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("getDashboardStats", () => {
    it("returns correct stat structure", async () => {
      vi.mocked(prisma.site.count)
        .mockResolvedValueOnce(5)   // total
        .mockResolvedValueOnce(3)   // published
        .mockResolvedValueOnce(1)   // draft
        .mockResolvedValueOnce(1);  // archived
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(3);
      vi.mocked(prisma.invite.count).mockResolvedValue(1);
      vi.mocked(prisma.siteAnalytics.aggregate).mockResolvedValue({
        _sum: { visitors: 1200 },
        _count: 0, _avg: {}, _min: {}, _max: {},
      } as any);
      vi.mocked(prisma.site.findMany).mockResolvedValue([
        { name: "Portfolio", lastPublishedAt: new Date("2026-03-20") },
      ] as any);

      const stats = await getDashboardStats("ws_123");

      expect(stats.totalSites).toBe(5);
      expect(stats.publishedSites).toBe(3);
      expect(stats.collaborators).toBe(3);
      expect(stats.pendingInvites).toBe(1);
      expect(stats.lastPublishedSiteName).toBe("Portfolio");
    });
  });

  describe("getRecentSites", () => {
    it("returns max 4 sites ordered by lastEditedAt", async () => {
      const mockSites = [
        { id: "s1", name: "Site 1", slug: "site-1", status: "PUBLISHED", thumbnail: null, pages: 5, lastEditedAt: new Date(), publishedUrl: "https://site-1.buildrik.app" },
        { id: "s2", name: "Site 2", slug: "site-2", status: "DRAFT", thumbnail: null, pages: 3, lastEditedAt: new Date(), publishedUrl: null },
      ];
      vi.mocked(prisma.site.findMany).mockResolvedValue(mockSites as any);

      const sites = await getRecentSites("ws_123");

      expect(sites).toHaveLength(2);
      expect(sites[0].id).toBe("s1");
    });
  });

  describe("getActivityFeed", () => {
    it("returns activity entries", async () => {
      vi.mocked(prisma.activityLog.findMany).mockResolvedValue([
        { id: "a1", action: "SITE_PUBLISHED", actorId: "u1", description: 'Published "Portfolio"', siteId: "s1", createdAt: new Date(), metadata: null },
      ] as any);

      const activity = await getActivityFeed("ws_123");

      expect(activity).toHaveLength(1);
      expect(activity[0].action).toBe("SITE_PUBLISHED");
    });
  });

  describe("getQuickActions", () => {
    it("returns new user actions when 0 sites", () => {
      const actions = getQuickActions({ siteCount: 0, hasPendingInvites: false, isNearLimit: false, isDunning: false });
      expect(actions).toHaveLength(4);
      expect(actions[0].label).toBe("Create Site");
    });

    it("returns active user actions when 5+ sites", () => {
      const actions = getQuickActions({ siteCount: 5, hasPendingInvites: false, isNearLimit: false, isDunning: false });
      expect(actions[0].label).toBe("New Site");
    });

    it("returns near-limit actions", () => {
      const actions = getQuickActions({ siteCount: 3, hasPendingInvites: false, isNearLimit: true, isDunning: false });
      expect(actions.some((a: { label: string }) => a.label === "Upgrade Plan")).toBe(true);
    });

    it("returns dunning actions", () => {
      const actions = getQuickActions({ siteCount: 5, hasPendingInvites: false, isNearLimit: false, isDunning: true });
      expect(actions[0].label).toBe("Update Payment");
    });
  });

  describe("getWorkspaceHealth", () => {
    it("returns health metrics", async () => {
      vi.mocked(prisma.site.count).mockResolvedValue(2);
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        workspace: { plan: "FREE" },
      } as any);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(1);

      const health = await getWorkspaceHealth("ws_123", "u1");

      expect(health.sites.used).toBe(2);
      expect(health.sites.limit).toBe(3);
      expect(health.aiCredits.used).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/dashboard-service.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `server/services/dashboard.service.ts` with these functions:

- `getDashboardStats(workspaceId)` — queries site counts (total/published/draft/archived), member count, invite count, monthly analytics aggregate, last published site. Returns `DashboardStats`.
- `getRecentSites(workspaceId, limit=4)` — queries sites ordered by lastEditedAt DESC, take limit, select id/name/slug/status/thumbnail/pages/lastEditedAt/publishedUrl. Returns `RecentSite[]`.
- `getActivityFeed(workspaceId, limit=5)` — queries ActivityLog ordered by createdAt DESC. Maps to `ActivityEntry[]` with actorName from metadata or "System".
- `getQuickActions({ siteCount, hasPendingInvites, isNearLimit, isDunning })` — pure function returning 4 action objects based on workspace state. Each action has `label`, `href`, `icon` (Lucide name).
- `getWorkspaceHealth(workspaceId, userId)` — queries site count and AI job count for current month, gets plan from workspace member, returns health metrics with limits from `PLAN_LIMITS`.

Import `PLAN_LIMITS` from `@/lib/constants/plan-limits`. Import `prisma` from `@/lib/prisma`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/dashboard-service.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/dashboard.service.ts __tests__/dashboard-service.test.ts
git commit -m "feat: add dashboard service with stats, recent sites, activity, health"
```

---

## Task 3: Dashboard tRPC Router

**Files:**
- Create: `server/trpc/routers/dashboard.ts`
- Modify: `server/trpc/router.ts`

- [ ] **Step 1: Create dashboard router**

```typescript
// server/trpc/routers/dashboard.ts
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getDashboardStats,
  getRecentSites,
  getActivityFeed,
  getWorkspaceHealth,
} from "@/server/services/dashboard.service";

export const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getDashboardStats(member.workspaceId);
  }),

  recentSites: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getRecentSites(member.workspaceId);
  }),

  activity: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getActivityFeed(member.workspaceId);
  }),

  health: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getWorkspaceHealth(member.workspaceId, ctx.session.user.id);
  }),
});
```

- [ ] **Step 2: Register in appRouter**

Edit `server/trpc/router.ts`:
```typescript
import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
  auth: authRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
```

- [ ] **Step 3: Commit**

```bash
git add server/trpc/routers/dashboard.ts server/trpc/router.ts
git commit -m "feat: add dashboard tRPC router with stats, recentSites, activity, health"
```

---

## Task 4: StatCard Component (TDD)

**Files:**
- Create: `components/dashboard/stat-card.tsx`
- Test: `__tests__/dashboard-components.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/dashboard-components.test.ts
import { describe, it, expect } from "vitest";

describe("Dashboard Components", () => {
  describe("StatCard", () => {
    it("exports StatCard component", async () => {
      const mod = await import("@/components/dashboard/stat-card");
      expect(mod.StatCard).toBeDefined();
      expect(typeof mod.StatCard).toBe("function");
    });
  });

  describe("QuickActions", () => {
    it("exports QUICK_ACTION_ICONS map", async () => {
      const mod = await import("@/components/dashboard/quick-actions");
      expect(mod.QUICK_ACTION_ICONS).toBeDefined();
    });
  });

  describe("AvatarDropdown", () => {
    it("exports AVATAR_MENU_ITEMS with 5 items", async () => {
      const mod = await import("@/components/dashboard/avatar-dropdown");
      expect(mod.AVATAR_MENU_ITEMS).toHaveLength(5);
      const labels = mod.AVATAR_MENU_ITEMS.map((i: { label: string }) => i.label);
      expect(labels).toEqual(["Profile", "Settings", "Billing", "Help", "Logout"]);
    });
  });

  describe("EmptyState", () => {
    it("exports EMPTY_STATE_CONFIGS with role-based content", async () => {
      const mod = await import("@/components/dashboard/empty-state");
      expect(mod.EMPTY_STATE_CONFIGS).toBeDefined();
      expect(mod.EMPTY_STATE_CONFIGS.owner_new).toBeDefined();
      expect(mod.EMPTY_STATE_CONFIGS.owner_empty).toBeDefined();
      expect(mod.EMPTY_STATE_CONFIGS.editor).toBeDefined();
      expect(mod.EMPTY_STATE_CONFIGS.viewer).toBeDefined();
    });
  });

  describe("WorkspaceHealth", () => {
    it("exports getHealthColor function", async () => {
      const mod = await import("@/components/dashboard/workspace-health");
      expect(mod.getHealthColor).toBeDefined();
      expect(mod.getHealthColor(30)).toBe("green");
      expect(mod.getHealthColor(70)).toBe("yellow");
      expect(mod.getHealthColor(90)).toBe("red");
    });
  });

  describe("DunningBanner", () => {
    it("exports DunningBanner component", async () => {
      const mod = await import("@/components/dashboard/dunning-banner");
      expect(mod.DunningBanner).toBeDefined();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/dashboard-components.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Create StatCard**

```tsx
// components/dashboard/stat-card.tsx
"use client";

import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  href: string;
  trend?: { value: number; label: string };
}

export function StatCard({ title, value, subtitle, href, trend }: StatCardProps) {
  return (
    <Link href={href} className="block rounded-xl border bg-white p-5 transition-shadow hover:shadow-md" style={{ borderColor: "#E8E8E8" }}>
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#7A7A7A" }}>{title}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: "#0D0D0D" }}>{value}</p>
      {subtitle && <p className="mt-1 text-xs" style={{ color: "#B0B0B0" }}>{subtitle}</p>}
      {trend && (
        <p className="mt-2 text-xs font-medium" style={{ color: trend.value >= 0 ? "#22C55E" : "#E42313" }}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </Link>
  );
}
```

- [ ] **Step 4: Run test to verify StatCard passes**

Run: `npx vitest run __tests__/dashboard-components.test.ts -- -t "StatCard"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/stat-card.tsx __tests__/dashboard-components.test.ts
git commit -m "feat: add StatCard component with trend display"
```

---

## Task 5: QuickActions, AvatarDropdown, EmptyState, WorkspaceHealth, DunningBanner Components

**Files:**
- Create: `components/dashboard/quick-actions.tsx`
- Create: `components/dashboard/avatar-dropdown.tsx`
- Create: `components/dashboard/empty-state.tsx`
- Create: `components/dashboard/workspace-health.tsx`
- Create: `components/dashboard/dunning-banner.tsx`
- Create: `components/dashboard/recent-sites.tsx`
- Create: `components/dashboard/site-card.tsx`
- Create: `components/dashboard/activity-feed.tsx`

- [ ] **Step 1: Create QuickActions**

```tsx
// components/dashboard/quick-actions.tsx
"use client";

import Link from "next/link";
import { Plus, UserPlus, Globe, BarChart3, Settings, CreditCard, Headphones, LayoutTemplate } from "lucide-react";

export const QUICK_ACTION_ICONS = {
  Plus, UserPlus, Globe, BarChart3, Settings, CreditCard, Headphones, LayoutTemplate,
} as const;

interface QuickAction {
  label: string;
  href: string;
  icon: keyof typeof QUICK_ACTION_ICONS;
  description: string;
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="flex gap-3">
      {actions.slice(0, 4).map((action) => {
        const Icon = QUICK_ACTION_ICONS[action.icon];
        return (
          <Link key={action.label} href={action.href} className="flex flex-1 items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-shadow hover:shadow-md" style={{ borderColor: "#E8E8E8" }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "#FEF2F2" }}>
              <Icon className="h-4 w-4" style={{ color: "#E42313" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{action.label}</p>
              <p className="text-xs" style={{ color: "#B0B0B0" }}>{action.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create AvatarDropdown**

```tsx
// components/dashboard/avatar-dropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, User, Settings, CreditCard, HelpCircle, LogOut } from "lucide-react";

export const AVATAR_MENU_ITEMS = [
  { label: "Profile", href: "/dashboard/settings", icon: "User" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
  { label: "Billing", href: "/dashboard/billing", icon: "CreditCard" },
  { label: "Help", href: "/dashboard/help", icon: "HelpCircle" },
  { label: "Logout", href: "#", icon: "LogOut" },
] as const;

const iconMap = { User, Settings, CreditCard, HelpCircle, LogOut } as const;

interface AvatarDropdownProps {
  initials: string;
  name: string;
  email: string;
}

export function AvatarDropdown({ initials, name, email }: AvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#F4F4F4]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: "#E42313" }}>{initials}</div>
        <ChevronDown className="h-4 w-4" style={{ color: "#7A7A7A" }} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border bg-white py-1 shadow-lg" style={{ borderColor: "#E8E8E8" }}>
          <div className="border-b px-4 py-3" style={{ borderColor: "#E8E8E8" }}>
            <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>{name}</p>
            <p className="text-xs" style={{ color: "#7A7A7A" }}>{email}</p>
          </div>
          {AVATAR_MENU_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            if (item.label === "Logout") {
              return (
                <button key={item.label} onClick={() => { setOpen(false); fetch("/api/auth/logout", { method: "POST" }).then(() => window.location.href = "/auth/login"); }} className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#F4F4F4]" style={{ color: "#7A7A7A" }}>
                  <Icon className="h-4 w-4" />{item.label}
                </button>
              );
            }
            return (
              <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-[#F4F4F4]" style={{ color: "#7A7A7A" }}>
                <Icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create EmptyState**

```tsx
// components/dashboard/empty-state.tsx
"use client";

import Link from "next/link";
import { Plus, LayoutTemplate, Sparkles, Users } from "lucide-react";

export const EMPTY_STATE_CONFIGS = {
  owner_new: {
    title: "Welcome to Buildrik!",
    message: "Build your first site in under 5 minutes.",
    showCreationCTAs: true,
  },
  owner_empty: {
    title: "Your workspace is empty.",
    message: "Ready for something new?",
    showCreationCTAs: true,
  },
  editor: {
    title: "No sites assigned yet.",
    message: "Ask your workspace admin to give you access.",
    showCreationCTAs: false,
  },
  viewer: {
    title: "No published sites to view yet.",
    message: "Your team is still building!",
    showCreationCTAs: false,
  },
} as const;

type EmptyStateVariant = keyof typeof EMPTY_STATE_CONFIGS;

export function EmptyState({ variant }: { variant: EmptyStateVariant }) {
  const config = EMPTY_STATE_CONFIGS[variant];
  return (
    <div className="flex flex-col items-center rounded-xl border-2 border-dashed py-16 text-center" style={{ borderColor: "#E8E8E8" }}>
      <h2 className="text-lg font-semibold" style={{ color: "#0D0D0D" }}>{config.title}</h2>
      <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>{config.message}</p>
      {config.showCreationCTAs && (
        <div className="mt-6 flex gap-3">
          <Link href="/dashboard/sites/new?method=blank" className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}>
            <Plus className="h-4 w-4" />Blank Site
          </Link>
          <Link href="/dashboard/sites/new?method=template" className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#F4F4F4]" style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}>
            <LayoutTemplate className="h-4 w-4" />Use Template
          </Link>
          <Link href="/dashboard/sites/new?method=ai" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>
            <Sparkles className="h-4 w-4" />Generate with AI
          </Link>
        </div>
      )}
      {variant === "editor" && (
        <Link href="/dashboard/team" className="mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: "#E42313" }}>
          <Users className="h-4 w-4" />View Team →
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create WorkspaceHealth**

```tsx
// components/dashboard/workspace-health.tsx
"use client";

import Link from "next/link";
import type { WorkspaceHealth as HealthData } from "@/lib/validations/dashboard";

export function getHealthColor(percentage: number): "green" | "yellow" | "red" {
  if (percentage >= 85) return "red";
  if (percentage >= 60) return "yellow";
  return "green";
}

const colorMap = {
  green: "#22C55E",
  yellow: "#EA580C",
  red: "#E42313",
};

function HealthBar({ label, used, limit, unit }: { label: string; used: number; limit: number; unit: string }) {
  if (limit === -1) return null;
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0;
  const color = getHealthColor(pct);
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-xs font-medium" style={{ color: "#7A7A7A" }}>{label}</span>
      <div className="flex-1">
        <div className="h-2 rounded-full" style={{ backgroundColor: "#F4F4F4" }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: colorMap[color] }} />
        </div>
      </div>
      <span className="text-xs tabular-nums" style={{ color: "#7A7A7A" }}>{used}/{limit} {unit}</span>
    </div>
  );
}

export function WorkspaceHealth({ data }: { data: HealthData }) {
  const hasUsage = data.sites.used > 0 || data.aiCredits.used > 0;
  const anyOver50 = [data.sites, data.aiCredits, data.storage].some(
    (m) => m.limit > 0 && (m.used / m.limit) * 100 > 50
  );
  if (!hasUsage || !anyOver50) return null;
  return (
    <Link href="/dashboard/billing" className="block rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
      <p className="mb-3 text-sm font-semibold" style={{ color: "#0D0D0D" }}>Workspace Usage</p>
      <div className="space-y-3">
        <HealthBar label="Sites" used={data.sites.used} limit={data.sites.limit} unit="sites" />
        <HealthBar label="Storage" used={data.storage.usedMB} limit={data.storage.limitMB} unit="MB" />
        <HealthBar label="AI Credits" used={data.aiCredits.used} limit={data.aiCredits.limit} unit="used" />
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Create DunningBanner**

```tsx
// components/dashboard/dunning-banner.tsx
"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function DunningBanner() {
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "#E42313" }} />
        <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
          Payment failed. Update payment method to avoid losing Pro features.
        </p>
      </div>
      <Link href="/dashboard/billing" className="shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>
        Update Payment
      </Link>
    </div>
  );
}
```

- [ ] **Step 6: Create SiteCard**

```tsx
// components/dashboard/site-card.tsx
"use client";

import Link from "next/link";
import { Globe, FileText } from "lucide-react";
import type { RecentSite } from "@/lib/validations/dashboard";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PUBLISHED: { bg: "#DCFCE7", text: "#166534" },
  DRAFT: { bg: "#FEF9C3", text: "#854D0E" },
  ARCHIVED: { bg: "#FED7AA", text: "#9A3412" },
};

export function SiteCard({ site }: { site: RecentSite }) {
  const statusColor = STATUS_COLORS[site.status] ?? STATUS_COLORS.DRAFT;
  const timeAgo = getTimeAgo(site.lastEditedAt);
  return (
    <Link href={`/dashboard/sites/${site.id}`} className="group block rounded-xl border bg-white transition-shadow hover:shadow-md" style={{ borderColor: "#E8E8E8" }}>
      <div className="flex h-32 items-center justify-center rounded-t-xl" style={{ backgroundColor: "#F4F4F4" }}>
        <Globe className="h-10 w-10" style={{ color: "#B0B0B0" }} />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold truncate" style={{ color: "#0D0D0D" }}>{site.name}</h3>
          <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: statusColor.bg, color: statusColor.text }}>{site.status.toLowerCase()}</span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "#B0B0B0" }}>Edited {timeAgo}</p>
        <div className="mt-2 flex items-center gap-3 text-xs" style={{ color: "#7A7A7A" }}>
          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{site.pages} pages</span>
        </div>
      </div>
    </Link>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
```

- [ ] **Step 7: Create RecentSites**

```tsx
// components/dashboard/recent-sites.tsx
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { SiteCard } from "./site-card";
import type { RecentSite } from "@/lib/validations/dashboard";

export function RecentSites({ sites }: { sites: RecentSite[] }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>Recent Sites</h2>
        <Link href="/dashboard/sites" className="text-sm font-medium" style={{ color: "#E42313" }}>View All →</Link>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {sites.slice(0, 3).map((site) => <SiteCard key={site.id} site={site} />)}
        <Link href="/dashboard/sites/new" className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors hover:border-[#E42313] hover:bg-red-50/30" style={{ borderColor: "#E8E8E8", minHeight: "200px" }}>
          <Plus className="h-8 w-8" style={{ color: "#B0B0B0" }} />
          <p className="mt-2 text-sm font-medium" style={{ color: "#7A7A7A" }}>Create your next project</p>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create ActivityFeed**

```tsx
// components/dashboard/activity-feed.tsx
"use client";

import { useState } from "react";
import type { ActivityEntry } from "@/lib/validations/dashboard";

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const TABS = ["All", "My Activity", "Team Activity"] as const;

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const [activeTab, setActiveTab] = useState<string>("All");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: "#0D0D0D" }}>Activity</h2>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="rounded-lg px-3 py-1 text-xs font-medium transition-colors" style={{ backgroundColor: activeTab === tab ? "#FEF2F2" : "transparent", color: activeTab === tab ? "#E42313" : "#7A7A7A" }}>
              {tab}
            </button>
          ))}
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: "#B0B0B0" }}>No activity yet. Start editing to see updates here.</p>
      ) : (
        <div className="space-y-0 divide-y" style={{ borderColor: "#E8E8E8" }}>
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 py-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#E42313" }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "#0D0D0D" }}>
                  <span className="font-medium">{entry.actorName ?? "System"}</span>{" "}
                  {entry.description ?? entry.action.toLowerCase().replace(/_/g, " ")}
                </p>
                <p className="text-xs" style={{ color: "#B0B0B0" }}>{getTimeAgo(entry.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Run component tests**

Run: `npx vitest run __tests__/dashboard-components.test.ts`
Expected: All PASS

- [ ] **Step 10: Commit**

```bash
git add components/dashboard/quick-actions.tsx components/dashboard/avatar-dropdown.tsx components/dashboard/empty-state.tsx components/dashboard/workspace-health.tsx components/dashboard/dunning-banner.tsx components/dashboard/site-card.tsx components/dashboard/recent-sites.tsx components/dashboard/activity-feed.tsx
git commit -m "feat: add all dashboard UI components (DASH-1/2/4)"
```

---

## Task 6: Integrate Topbar with AvatarDropdown

**Files:**
- Modify: `components/dashboard/topbar.tsx`

- [ ] **Step 1: Replace avatar button with AvatarDropdown**

Replace the avatar button section in topbar.tsx with:
```tsx
import { AvatarDropdown } from "./avatar-dropdown";
```

Replace the avatar `<button>` element with:
```tsx
<AvatarDropdown initials="U" name="User" email="user@example.com" />
```

Note: In a future sub-project, this will read from session. For now use hardcoded placeholder values.

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/topbar.tsx
git commit -m "feat: integrate AvatarDropdown into topbar"
```

---

## Task 7: Wire Up Dashboard Page

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Replace placeholder with full dashboard**

```tsx
// app/dashboard/page.tsx
"use client";

import { trpc } from "@/lib/trpc/client";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentSites } from "@/components/dashboard/recent-sites";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { WorkspaceHealth } from "@/components/dashboard/workspace-health";
import { DunningBanner } from "@/components/dashboard/dunning-banner";
import { EmptyState } from "@/components/dashboard/empty-state";
import { getQuickActions } from "@/server/services/dashboard.service";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const stats = trpc.dashboard.stats.useQuery();
  const recentSites = trpc.dashboard.recentSites.useQuery();
  const activity = trpc.dashboard.activity.useQuery();
  const health = trpc.dashboard.health.useQuery();

  const isLoading = stats.isLoading || recentSites.isLoading;
  const isEmpty = stats.data?.totalSites === 0;

  // Quick actions based on workspace state
  const quickActions = stats.data
    ? getQuickActions({
        siteCount: stats.data.totalSites,
        hasPendingInvites: stats.data.pendingInvites > 0,
        isNearLimit: false, // Will be computed from health data in future
        isDunning: false,   // Will be computed from subscription status
      })
    : [];

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Dashboard</h1>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Dashboard</h1>
        <Link href="/dashboard/sites/new" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: "#E42313" }}>
          <Plus className="h-4 w-4" />New Site
        </Link>
      </div>

      {/* Dunning banner - shown when payment failed */}
      {/* TODO: Wire to subscription.status === "PAST_DUE" */}

      {isEmpty ? (
        <div className="mt-8">
          <EmptyState variant="owner_new" />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              title="Total Sites"
              value={`${stats.data?.totalSites ?? 0} sites`}
              subtitle={`${stats.data?.publishedSites ?? 0} published · ${stats.data?.draftSites ?? 0} draft`}
              href="/dashboard/sites"
            />
            <StatCard
              title="Published"
              value={`${stats.data?.publishedSites ?? 0} live`}
              subtitle={stats.data?.lastPublishedSiteName ? `Last: ${stats.data.lastPublishedSiteName}` : undefined}
              href="/dashboard/sites?status=published"
            />
            <StatCard
              title="Monthly Visits"
              value={stats.data?.monthlyVisits ?? 0}
              href="/dashboard/sites"
              trend={stats.data?.visitsChange !== undefined ? { value: stats.data.visitsChange, label: "vs last month" } : undefined}
            />
            <StatCard
              title="Collaborators"
              value={`${stats.data?.collaborators ?? 0} active`}
              subtitle={stats.data?.pendingInvites ? `${stats.data.pendingInvites} pending` : undefined}
              href="/dashboard/team"
            />
          </div>

          {/* Quick Actions */}
          {quickActions.length > 0 && <QuickActions actions={quickActions} />}

          {/* Recent Sites */}
          {recentSites.data && recentSites.data.length > 0 && (
            <RecentSites sites={recentSites.data} />
          )}

          {/* Activity + Health side by side */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <ActivityFeed entries={activity.data ?? []} />
            </div>
            <div>
              {health.data && <WorkspaceHealth data={health.data} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

**IMPORTANT:** The `getQuickActions` import from server service is used as a pure function on the client side (it takes data, returns data, no DB access). This is acceptable because it's a pure computation function. If this causes bundling issues, extract it to a shared `lib/` utility.

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: wire up full dashboard page with stats, sites, activity, health (DASH-1/2)"
```

---

## Task 8: Final Integration Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Verify Prisma types compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Fix any type errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Sub-Project 2 — dashboard home (DASH-1/2/4)"
```
