import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type {
  DashboardStats,
  RecentSite,
  ActivityEntry,
  WorkspaceHealth,
} from "@/lib/validations/dashboard";

export async function getDashboardStats(
  workspaceId: string
): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalSites,
    publishedSites,
    draftSites,
    archivedSites,
    collaborators,
    pendingInvites,
    monthlyAnalytics,
    lastPublished,
  ] = await Promise.all([
    prisma.site.count({ where: { workspaceId } }),
    prisma.site.count({ where: { workspaceId, status: "PUBLISHED" } }),
    prisma.site.count({ where: { workspaceId, status: "DRAFT" } }),
    prisma.site.count({ where: { workspaceId, status: "ARCHIVED" } }),
    prisma.workspaceMember.count({ where: { workspaceId } }),
    prisma.invite.count({ where: { workspaceId, status: "PENDING" } }),
    prisma.siteAnalytics.aggregate({
      where: {
        site: { workspaceId },
        date: { gte: startOfMonth },
      },
      _sum: { visitors: true },
    }),
    prisma.site.findMany({
      where: { workspaceId, lastPublishedAt: { not: null } },
      orderBy: { lastPublishedAt: "desc" },
      take: 1,
      select: { name: true, lastPublishedAt: true },
    }),
  ]);

  const monthlyVisits = monthlyAnalytics._sum.visitors ?? 0;
  const lastSite = lastPublished[0] ?? null;

  return {
    totalSites,
    publishedSites,
    draftSites,
    archivedSites,
    monthlyVisits,
    visitsChange: 0,
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
  limit = 5
): Promise<ActivityEntry[]> {
  const logs = await prisma.activityLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((log: any) => ({
    id: log.id,
    action: log.action,
    actorName: log.description ?? "System",
    description: log.description,
    siteId: log.siteId ?? null,
    createdAt: log.createdAt,
  }));
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
