import { prisma } from "@/lib/prisma";
import type {
  CreateFolderInput,
  DeleteFolderInput,
  ListFoldersInput,
  MoveFolderInput,
  RenameFolderInput,
} from "@buildrik/shared/schemas/media";

/**
 * Phase A: media-folder backend.
 *
 * Implements the v3 expanded-panel folder tree (Section 12-13). Cascade-delete
 * policy is "move assets to root" per resolved decision #6 — handled in
 * deleteFolder via transaction (NOT via Prisma cascade — Prisma SetNull on
 * folderId already does the right thing, but we keep deletion explicit so the
 * service can return the moved-asset count for the client toast).
 */

export async function listFolders(userId: string, input: ListFoldersInput) {
  return prisma.mediaFolder.findMany({
    where: {
      userId,
      ...(input.siteId !== undefined ? { siteId: input.siteId } : {}),
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      parentId: true,
      siteId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { assets: true } },
    },
  });
}

export async function createFolder(userId: string, input: CreateFolderInput) {
  // Validate parent ownership when set.
  if (input.parentId) {
    const parent = await prisma.mediaFolder.findUnique({
      where: { id: input.parentId },
      select: { userId: true },
    });
    if (!parent || parent.userId !== userId) {
      throw new Error("PARENT_NOT_FOUND");
    }
  }
  return prisma.mediaFolder.create({
    data: {
      userId,
      siteId: input.siteId ?? null,
      name: input.name,
      parentId: input.parentId ?? null,
    },
  });
}

export async function renameFolder(userId: string, input: RenameFolderInput) {
  const folder = await prisma.mediaFolder.findUnique({
    where: { id: input.folderId },
    select: { userId: true },
  });
  if (!folder || folder.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  return prisma.mediaFolder.update({
    where: { id: input.folderId },
    data: { name: input.name },
  });
}

export async function moveFolder(userId: string, input: MoveFolderInput) {
  const [folder, newParent] = await Promise.all([
    prisma.mediaFolder.findUnique({
      where: { id: input.folderId },
      select: { userId: true, parentId: true },
    }),
    input.newParentId
      ? prisma.mediaFolder.findUnique({
          where: { id: input.newParentId },
          select: { userId: true },
        })
      : Promise.resolve(null),
  ]);

  if (!folder || folder.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  if (input.newParentId && (!newParent || newParent.userId !== userId)) {
    throw new Error("PARENT_NOT_FOUND");
  }
  if (input.newParentId === input.folderId) {
    throw new Error("CYCLE");
  }
  // Cycle detection: walk up newParent's ancestors; refuse if we hit folderId.
  if (input.newParentId) {
    let cursor: string | null = input.newParentId;
    const seen = new Set<string>();
    while (cursor) {
      if (seen.has(cursor)) break; // safety
      seen.add(cursor);
      if (cursor === input.folderId) throw new Error("CYCLE");
      const next: { parentId: string | null } | null =
        await prisma.mediaFolder.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        });
      cursor = next?.parentId ?? null;
    }
  }

  return prisma.mediaFolder.update({
    where: { id: input.folderId },
    data: { parentId: input.newParentId },
  });
}

/**
 * Decision #6: deleting a folder with assets MOVES the assets to root
 * (parentId = null) instead of cascading. Returns the moved count for client toast.
 */
export async function deleteFolder(userId: string, input: DeleteFolderInput) {
  const folder = await prisma.mediaFolder.findUnique({
    where: { id: input.folderId },
    select: { userId: true },
  });
  if (!folder || folder.userId !== userId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    // Move direct child folders to root.
    const childFolders = await tx.mediaFolder.updateMany({
      where: { parentId: input.folderId },
      data: { parentId: null },
    });
    // Move assets in this folder to root.
    const movedAssets = await tx.mediaAsset.updateMany({
      where: { folderId: input.folderId },
      data: { folderId: null },
    });
    await tx.mediaFolder.delete({ where: { id: input.folderId } });
    return {
      movedAssets: movedAssets.count,
      movedChildFolders: childFolders.count,
    };
  });
}
