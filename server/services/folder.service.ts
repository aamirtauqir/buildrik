import { prisma } from "@/lib/prisma";

export async function listFolders(workspaceId: string) {
  return prisma.folder.findMany({
    where: { workspaceId },
    orderBy: { position: "asc" },
    include: { _count: { select: { sites: true } } },
  });
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
