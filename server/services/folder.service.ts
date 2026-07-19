import { prisma } from "@/lib/prisma";

/**
 * Folder cards show `N sites · N live · N views`. "Live" and "views" reuse the
 * exact predicates the rest of the app already uses for those words — status
 * "PUBLISHED" (dashboard.service getDashboardStats, sites.service listSites)
 * and a 30-day sum of SiteAnalytics.visitors (dashboard.service's monthlyVisits,
 * sites.service's visitors30d) — so folder totals foot to the per-site numbers
 * shown elsewhere. Two queries total, independent of folder count: no N+1.
 */
export async function listFolders(workspaceId: string) {
  const folders = await prisma.folder.findMany({
    where: { workspaceId },
    orderBy: { position: "asc" },
    include: {
      _count: { select: { sites: true } },
      sites: { select: { id: true, status: true } },
    },
  });

  const siteIds = folders.flatMap((f) => f.sites.map((s) => s.id));
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const viewRows =
    siteIds.length > 0
      ? await prisma.siteAnalytics.groupBy({
          by: ["siteId"],
          where: { siteId: { in: siteIds }, date: { gte: thirtyDaysAgo } },
          _sum: { visitors: true },
        })
      : [];
  const viewsBySite = new Map(viewRows.map((v) => [v.siteId, v._sum.visitors ?? 0]));

  return folders.map(({ sites, ...folder }) => ({
    ...folder,
    liveCount: sites.filter((s) => s.status === "PUBLISHED").length,
    views: sites.reduce((sum, s) => sum + (viewsBySite.get(s.id) ?? 0), 0),
  }));
}

export async function createFolder(workspaceId: string, name: string) {
  const existing = await prisma.folder.findFirst({
    where: { workspaceId, name },
  });

  if (existing) {
    throw new Error("FOLDER_NAME_EXISTS");
  }

  return prisma.folder.create({
    data: { name, workspaceId, position: 0 },
  });
}

export async function deleteFolder(folderId: string) {
  await prisma.site.updateMany({
    where: { folderId },
    data: { folderId: null },
  });

  return prisma.folder.delete({ where: { id: folderId } });
}

export async function renameFolder(folderId: string, name: string) {
  return prisma.folder.update({ where: { id: folderId }, data: { name } });
}

export async function moveSiteToFolder(
  siteId: string,
  folderId: string | null
) {
  // Guard cross-workspace assignment: a foreign folderId would otherwise file
  // this site under another workspace's folder. Verify same-workspace first.
  if (folderId !== null) {
    const [site, folder] = await Promise.all([
      prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } }),
      prisma.folder.findUnique({ where: { id: folderId }, select: { workspaceId: true } }),
    ]);
    if (!site) throw new Error("SITE_NOT_FOUND");
    if (!folder || folder.workspaceId !== site.workspaceId) throw new Error("FOLDER_NOT_FOUND");
  }
  return prisma.site.update({
    where: { id: siteId },
    data: { folderId },
  });
}
