import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import { isFeatureEnabled } from "@/server/services/feature-flag.service";
import type {
  DashboardStats,
  RecentSite,
  ActivityFeed,
  WorkspaceHealth,
} from "@buildrik/shared/schemas/dashboard";

export async function getDashboardStats(
  workspaceId: string,
  memberRole: string,
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
    prisma.site.count({ where: { workspaceId, deletedAt: null } }),
    prisma.site.count({ where: { workspaceId, status: "PUBLISHED", deletedAt: null } }),
    prisma.site.count({ where: { workspaceId, status: "DRAFT", deletedAt: null } }),
    prisma.site.count({ where: { workspaceId, status: "ARCHIVED", deletedAt: null } }),
    // "Collaborators" excludes the owner — matches the Team page, which
    // treats an owner-only workspace as "No team members yet".
    prisma.workspaceMember.count({ where: { workspaceId, role: { not: "OWNER" } } }),
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
      where: { workspaceId, lastPublishedAt: { not: null }, deletedAt: null },
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
    memberRole,
  };
}

export async function getRecentSites(
  workspaceId: string,
  limit = 4
): Promise<RecentSite[]> {
  const sites = await prisma.site.findMany({
    where: { workspaceId, deletedAt: null },
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
  options: { userId?: string; excludeUserId?: string; limit?: number; offset?: number } = {}
): Promise<ActivityFeed> {
  const { userId, excludeUserId, limit = 20, offset = 0 } = options;

  const logs = await prisma.activityLog.findMany({
    where: {
      workspaceId,
      // "mine" → only my actions; "team" → everyone except me.
      ...(userId ? { actorId: userId } : {}),
      ...(excludeUserId ? { actorId: { not: excludeUserId } } : {}),
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

  // Resolve site names so a feed row can name the object it acted on. One query
  // for all referenced sites; entries without a siteId (or for a deleted site)
  // simply carry a null siteName and read as before.
  const siteIds = [...new Set(logs.map((l) => l.siteId).filter(Boolean))] as string[];
  const sites =
    siteIds.length > 0
      ? await prisma.site.findMany({ where: { id: { in: siteIds } }, select: { id: true, name: true } })
      : [];
  const siteMap = new Map(sites.map((s) => [s.id, s.name]));

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
      siteName: log.siteId ? siteMap.get(log.siteId) ?? null : null,
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
        href: "/dashboard/billing?tab=overview",
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
        href: "/dashboard/billing?tab=usage",
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
      href: "/dashboard/sites?view=analytics",
      icon: "BarChart3",
      description: "Check your site performance",
    },
    {
      label: "Manage Domains",
      href: "/dashboard/sites?view=domains",
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

  // MediaAsset.siteId is a bare string — sum storage by siteId ∈ workspace sites.
  const siteIds = (await prisma.site.findMany({ where: { workspaceId }, select: { id: true } })).map((s) => s.id);

  const [siteCount, membership, aiJobCount, storageAgg] = await Promise.all([
    prisma.site.count({ where: { workspaceId, deletedAt: null } }),
    prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      include: { workspace: { select: { plan: true } } },
    }),
    prisma.aIGenerationJob.count({
      where: { workspaceId, createdAt: { gte: startOfMonth } },
    }),
    prisma.mediaAsset.aggregate({ _sum: { bytes: true }, where: { siteId: { in: siteIds } } }),
  ]);

  const plan = (membership?.workspace?.plan as PlanName) ?? "FREE";
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    sites: {
      used: siteCount,
      limit: limits.sites as number,
    },
    storage: {
      usedMB: Math.round((storageAgg._sum?.bytes ?? 0) / (1024 * 1024)),
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

// m3 dashboard "Needs attention" agency work queue. Aggregates the cross-site
// signals that should pull an agency operator back in: edits awaiting review,
// open client comments, domains still verifying, and recent failed publishes.
// Returns only non-zero items so the UI can hide the whole block when clear.
export interface AttentionItem {
  type: "reviews" | "comments" | "domains" | "publish_failed";
  label: string;
  count: number;
  href: string;
}

export async function getAttentionQueue(
  workspaceId: string,
  opts: { isAdmin: boolean } = { isAdmin: false }
): Promise<AttentionItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // reviews & comments are admin-only agency queues — never surface them (or
  // their deep links) to non-admins or solo workspaces, or the row links a
  // member straight into a DeniedState.
  const agencyEnabled = await isFeatureEnabled(workspaceId, "agency_layer");
  const canSeeAgencyQueues = opts.isAdmin && agencyEnabled;

  const [pendingReviews, openComments, pendingDomains, failedPublishes] = await Promise.all([
    canSeeAgencyQueues ? prisma.reviewRequest.count({ where: { site: { workspaceId }, status: "PENDING" } }) : Promise.resolve(0),
    canSeeAgencyQueues ? prisma.comment.count({ where: { site: { workspaceId }, status: "OPEN" } }) : Promise.resolve(0),
    prisma.domain.count({ where: { site: { workspaceId }, status: "PENDING" } }),
    prisma.publishBuildJob.count({ where: { workspaceId, status: "FAILED", createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const items: AttentionItem[] = [];
  if (pendingReviews > 0)
    items.push({ type: "reviews", label: pendingReviews === 1 ? "edit needs review" : "edits need review", count: pendingReviews, href: "/dashboard/agency/reviews" });
  if (openComments > 0)
    items.push({ type: "comments", label: openComments === 1 ? "open comment" : "open comments", count: openComments, href: "/dashboard/agency/reviews" });
  if (pendingDomains > 0)
    items.push({ type: "domains", label: pendingDomains === 1 ? "domain verifying" : "domains verifying", count: pendingDomains, href: "/dashboard/settings/domains" });
  if (failedPublishes > 0)
    items.push({ type: "publish_failed", label: failedPublishes === 1 ? "publish failed" : "publishes failed", count: failedPublishes, href: "/dashboard/projects" });
  return items;
}
