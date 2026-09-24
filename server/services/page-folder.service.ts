import { prisma } from "@/lib/prisma";
import { checkSiteRole } from "@/server/services/permission.service";
import type {
  CreatePageFolderInput,
  MovePageToFolderInput,
  PageFolder,
  UpdatePageFolderInput,
} from "@buildrik/shared/schemas/pages";

/**
 * Personal page folders — the Pages panel's folders (boards 4418:92679,
 * 6887:77925), stored per user × site. They were per-BROWSER localStorage;
 * now they follow the user across devices. Pages stay shared; a folder only
 * records how THIS user groups them.
 *
 * Authz: EDITOR+ on the site (checkSiteRole → PermissionError). A folder is
 * personal, but the Pages panel it lives in is an editing surface — a VIEWER
 * opens the editor in read-only view mode, where the panel is not shown — and
 * no board draws folders for a viewer. Every folder operation is also scoped to
 * `userId`: another member's folder is NOT_FOUND, never visible.
 *
 * Errors: FOLDER_NOT_FOUND, PAGE_NOT_FOUND (a page id not on the folder's site).
 */

const SELECT = { id: true, name: true, collapsed: true, pageIds: true } as const;

async function ownFolder(userId: string, folderId: string) {
  const folder = await prisma.pageFolder.findUnique({
    where: { id: folderId },
    select: { userId: true, siteId: true },
  });
  if (!folder || folder.userId !== userId) throw new Error("FOLDER_NOT_FOUND");
  await checkSiteRole(prisma, userId, folder.siteId, "EDITOR");
  return folder;
}

/** The user's folders on a site, in order. Ids of pages deleted since are
 *  dropped from the answer (pages are shared; a folder cannot hold them up). */
export async function listPageFolders(userId: string, siteId: string): Promise<PageFolder[]> {
  await checkSiteRole(prisma, userId, siteId, "EDITOR");
  const [folders, pages] = await Promise.all([
    prisma.pageFolder.findMany({
      where: { userId, siteId },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: SELECT,
    }),
    prisma.page.findMany({ where: { siteId }, select: { id: true } }),
  ]);
  const live = new Set(pages.map((p) => p.id));
  return folders.map((f) => ({ ...f, pageIds: f.pageIds.filter((id) => live.has(id)) }));
}

export async function createPageFolder(userId: string, input: CreatePageFolderInput): Promise<PageFolder> {
  await checkSiteRole(prisma, userId, input.siteId, "EDITOR");
  const count = await prisma.pageFolder.count({ where: { userId, siteId: input.siteId } });
  return prisma.pageFolder.create({
    data: { userId, siteId: input.siteId, name: input.name, position: count },
    select: SELECT,
  });
}

export async function updatePageFolder(userId: string, input: UpdatePageFolderInput): Promise<PageFolder> {
  await ownFolder(userId, input.folderId);
  return prisma.pageFolder.update({
    where: { id: input.folderId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.collapsed !== undefined ? { collapsed: input.collapsed } : {}),
    },
    select: SELECT,
  });
}

/** Deleting a folder never touches its pages — they return to the top level. */
export async function deletePageFolder(userId: string, folderId: string): Promise<{ success: true }> {
  await ownFolder(userId, folderId);
  await prisma.pageFolder.delete({ where: { id: folderId } });
  return { success: true };
}

export async function movePageToFolder(userId: string, input: MovePageToFolderInput): Promise<PageFolder[]> {
  await checkSiteRole(prisma, userId, input.siteId, "EDITOR");
  const page = await prisma.page.findUnique({ where: { id: input.pageId }, select: { siteId: true } });
  if (!page || page.siteId !== input.siteId) throw new Error("PAGE_NOT_FOUND");

  const folders = await prisma.pageFolder.findMany({
    where: { userId, siteId: input.siteId },
    select: { id: true, pageIds: true },
  });
  if (input.folderId !== null && !folders.some((f) => f.id === input.folderId)) {
    throw new Error("FOLDER_NOT_FOUND");
  }

  const writes = folders
    .map((f) => {
      // Already in the target folder → keep its place; otherwise append there
      // and leave every other folder.
      const next =
        f.id === input.folderId
          ? f.pageIds.includes(input.pageId) ? f.pageIds : [...f.pageIds, input.pageId]
          : f.pageIds.filter((id) => id !== input.pageId);
      const same = next.length === f.pageIds.length && next.every((id, i) => id === f.pageIds[i]);
      return same ? null : prisma.pageFolder.update({ where: { id: f.id }, data: { pageIds: next } });
    })
    .filter((w): w is NonNullable<typeof w> => w !== null);
  if (writes.length) await prisma.$transaction(writes);
  return listPageFolders(userId, input.siteId);
}
