import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type {
  DashboardStats,
  RecentSite,
  ActivityFeed,
  WorkspaceHealth,
} from "@/lib/validations/dashboard";

export async function getDashboardStats(
  workspaceId: string
): Promise<DashboardStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);

  const [
    totalSites,
    publishedSites,
    draftSites,
    archivedSites,
    collaborators,
    pendingInvites,
    currentPeriodAgg,
    previousPeriodAgg,
    dailyAnalytics,
    memberRows,
    lastPublished,
  ] = await Promise.all([
    prisma.site.count({ where: { workspaceId } }),
    prisma.site.count({ where: { workspaceId, status: "PUBLISHED" } }),
    prisma.site.count({ where: { workspaceId, status: "DRAFT" } }),
    prisma.site.count({ where: { workspaceId, status: "ARCHIVED" } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.invite.count({ where: { workspaceId, status: "PENDING" } }),
    prisma.siteAnalytics.aggregate({
      where: { site: { workspaceId }, date: { gte: thirtyDaysAgo } },
      _sum: { visitors: true },
    }),
    prisma.siteAnalytics.aggregate({
      where: {
        site: { workspaceId },
        date: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
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
    prisma.site.findMany({
      where: { workspaceId, lastPublishedAt: { not: null } },
      orderBy: { lastPublishedAt: "desc" },
      take: 1,
      select: { name: true, lastPublishedAt: true },
    }),
  ]);

  const monthlyVisits = currentPeriodAgg._sum.visitors ?? 0;
  const previousVisits = previousPeriodAgg._sum.visitors ?? 0;
  const visitsChange =
    previousVisits > 0
      ? Math.round(((monthlyVisits - previousVisits) / previousVisits) * 100)
      : 0;

  // Aggregate visitors per day for sparkline
  const visitorsByDay = new Map<string, number>();
  for (const row of dailyAnalytics) {
    const key = row.date.toISOString().slice(0, 10);
    visitorsByDay.set(key, (visitorsByDay.get(key) ?? 0) + row.visitors);
  }
  const dailyVisitors = Array.from(visitorsByDay.values());

  const memberAvatars = memberRows.map((m) => ({
    name: m.user.fullName,
    avatar: m.user.avatar,
  }));

  const lastSite = lastPublished[0] ?? null;

  return {
    totalSites,
    publishedSites,
    draftSites,
    archivedSites,
    monthlyVisits,
    visitsChange,
    dailyVisitors,
    memberAvatars,
    collaborators,
    pendingInvites,
    lastPublishedSiteName: lastSite?.name ?? null,
    lastPublishedAt: lastSite?.lastPublishedAt ?? null,
  };
}

export async function getRecentSites(
  workspaceId: string,
  limit = 4
): Promise<RecentSite[]> {
  const sites = await prisma.site.findMany({
    where: { workspaceId },
    orderBy: { lastEditedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      thumbnail: true,
      pages: true,
      lastEditedAt: true,
      publishedUrl: true,
    },
  });

  return sites as RecentSite[];
}

export async function getActivityFeed(
  workspaceId: string,
  options: { userId?: string; limit?: number; offset?: number } = {}
): Promise<ActivityFeed> {
  const { userId, limit = 20, offset = 0 } = options;

  const logs = await prisma.activityLog.findMany({
    where: {
      workspaceId,
      ...(userId ? { actorId: userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  // Resolve actor names + avatars in one query
  const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))] as string[];
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, fullName: true, avatar: true },
        })
      : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  // Group by date bucket
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - startOfToday.getDay() * 86400000);

  const buckets: Record<string, typeof entries> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  };

  const entries = logs.map((log) => {
    const actor = log.actorId ? actorMap.get(log.actorId) : null;
    return {
      id: log.id,
      action: log.action,
      actorName: actor?.fullName ?? "System",
      actorAvatar: actor?.avatar ?? null,
      description: log.description ?? null,
      siteId: log.siteId ?? null,
      createdAt: log.createdAt,
    };
  });

  for (const entry of entries) {
    const t = entry.createdAt.getTime();
    if (t >= startOfToday.getTime()) {
      buckets["Today"].push(entry);
    } else if (t >= startOfYesterday.getTime()) {
      buckets["Yesterday"].push(entry);
    } else if (t >= startOfWeek.getTime()) {
      buckets["This Week"].push(entry);
    } else {
      buckets["Older"].push(entry);
    }
  }

  const groups = (["Today", "Yesterday", "This Week", "Older"] as const)
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, entries: buckets[label] }));

  return { groups };
}

interface QuickActionInput {
  siteCount: number;
  hasPendingInvites: boolean;
  isNearLimit: boolean;
  isDunning: boolean;
}

interface QuickAction {
  label: string;
  href: string;
  icon: string;
  description: string;
}

export function getQuickActions(input: QuickActionInput): QuickAction[] {
  if (input.isDunning) {
    return [
      {
        label: "Update Payment",
        href: "/dashboard/billing",
        icon: "CreditCard",
        description: "Update your payment method",
      },
      {
        label: "View Billing",
        href: "/dashboard/billing",
        icon: "BarChart3",
        description: "Review your billing details",
      },
      {
        label: "Manage Sites",
        href: "/dashboard/sites",
        icon: "Settings",
        description: "Manage your existing sites",
      },
      {
        label: "Contact Support",
        href: "/dashboard/help",
        icon: "Headphones",
        description: "Get help from our team",
      },
    ];
  }

  if (input.isNearLimit) {
    return [
      {
        label: "New Site",
        href: "/dashboard/sites/new",
        icon: "Plus",
        description: "Create a new site",
      },
      {
        label: "Upgrade Plan",
        href: "/dashboard/billing",
        icon: "CreditCard",
        description: "Unlock more sites and features",
      },
      {
        label: "Manage Sites",
        href: "/dashboard/sites",
        icon: "Settings",
        description: "Manage your existing sites",
      },
      {
        label: "View Usage",
        href: "/dashboard/billing",
        icon: "BarChart3",
        description: "Check your resource usage",
      },
    ];
  }

  if (input.siteCount === 0) {
    return [
      {
        label: "Create Site",
        href: "/dashboard/sites/new",
        icon: "Plus",
        description: "Build your first site",
      },
      {
        label: "Set Up Profile",
        href: "/dashboard/settings",
        icon: "User",
        description: "Complete your workspace profile",
      },
      {
        label: "Explore Templates",
        href: "/dashboard/sites/new?method=template",
        icon: "LayoutTemplate",
        description: "Start from a template",
      },
      {
        label: "Invite Team",
        href: "/dashboard/team",
        icon: "UserPlus",
        description: "Invite collaborators to your workspace",
      },
    ];
  }

  return [
    {
      label: "New Site",
      href: "/dashboard/sites/new",
      icon: "Plus",
      description: "Create a new site",
    },
    {
      label: "View Analytics",
      href: "/dashboard/sites",
      icon: "BarChart3",
      description: "Check your site performance",
    },
    {
      label: "Manage Domains",
      href: "/dashboard/sites",
      icon: "Globe",
      description: "Configure custom domains",
    },
    {
      label: "Invite Member",
      href: "/dashboard/team",
      icon: "UserPlus",
      description: "Add a team member",
    },
  ];
}

export async function getWorkspaceHealth(
  workspaceId: string,
  userId: string
): Promise<WorkspaceHealth> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [siteCount, membership, aiJobCount] = await Promise.all([
    prisma.site.count({ where: { workspaceId } }),
    prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      include: { workspace: { select: { plan: true } } },
    }),
    prisma.aIGenerationJob.count({
      where: { workspaceId, createdAt: { gte: startOfMonth } },
    }),
  ]);

  const plan = (membership?.workspace?.plan as PlanName) ?? "FREE";
  const limits = PLAN_LIMITS[plan];

  return {
    sites: {
      used: siteCount,
      limit: limits.sites as number,
    },
    storage: {
      usedMB: 0,
      limitMB: limits.storageMB as number,
    },
    aiCredits: {
      used: aiJobCount,
      limit: limits.aiGenerations as number,
    },
    bandwidth: {
      usedMB: 0,
      limitMB: limits.bandwidthMB as number,
    },
  };
}
