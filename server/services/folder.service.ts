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

export async function moveSiteToFolder(
  siteId: string,
  folderId: string | null
) {
  return prisma.site.update({
    where: { id: siteId },
    data: { folderId },
  });
}
