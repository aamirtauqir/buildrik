import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  UpsertCollectionInput,
  UpsertEntryInput,
} from "@buildrik/shared/schemas/cms";

/**
 * CMS server persistence (E7) — the ONLY layer that reads/writes cms_collections
 * + cms_entries. Everything is scoped by siteId (the router authorizes site
 * access first); entry ops additionally confirm the collection belongs to the
 * site, so a crafted collectionId can't reach another site's CMS.
 */

export class CmsError extends Error {
  constructor(
    public code: "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "CmsError";
  }
}

export async function listCollections(siteId: string) {
  const rows = await prisma.cmsCollection.findMany({
    where: { siteId },
    orderBy: { name: "asc" },
    include: { _count: { select: { entries: true } } },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, entryCount: _count.entries }));
}

export async function upsertCollection(siteId: string, input: UpsertCollectionInput) {
  const data = {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    icon: input.icon ?? null,
    displayField: input.displayField ?? null,
    fields: input.fields as unknown as Prisma.InputJsonValue,
  };
  if (input.id) {
    const owned = await prisma.cmsCollection.findFirst({ where: { id: input.id, siteId }, select: { id: true } });
    if (!owned) throw new CmsError("NOT_FOUND", "Collection not found");
    return prisma.cmsCollection.update({ where: { id: input.id }, data });
  }
  return prisma.cmsCollection.create({ data: { siteId, ...data } });
}

export async function deleteCollection(siteId: string, id: string): Promise<void> {
  const owned = await prisma.cmsCollection.findFirst({ where: { id, siteId }, select: { id: true } });
  if (!owned) throw new CmsError("NOT_FOUND", "Collection not found");
  await prisma.cmsCollection.delete({ where: { id } });
}

// Confirm the collection is in this site before any entry op — entries key on
// collectionId alone, so this is the cross-site guard.
async function assertCollectionInSite(siteId: string, collectionId: string): Promise<void> {
  const owned = await prisma.cmsCollection.findFirst({
    where: { id: collectionId, siteId },
    select: { id: true },
  });
  if (!owned) throw new CmsError("NOT_FOUND", "Collection not found");
}

export async function listEntries(siteId: string, collectionId: string) {
  await assertCollectionInSite(siteId, collectionId);
  return prisma.cmsEntry.findMany({ where: { collectionId }, orderBy: { updatedAt: "desc" } });
}

export async function upsertEntry(siteId: string, input: UpsertEntryInput) {
  await assertCollectionInSite(siteId, input.collectionId);
  const data = {
    data: input.data as unknown as Prisma.InputJsonValue,
    ...(input.status ? { status: input.status } : {}),
  };
  if (input.id) {
    const owned = await prisma.cmsEntry.findFirst({
      where: { id: input.id, collection: { siteId } },
      select: { id: true },
    });
    if (!owned) throw new CmsError("NOT_FOUND", "Entry not found");
    return prisma.cmsEntry.update({ where: { id: input.id }, data });
  }
  return prisma.cmsEntry.create({ data: { collectionId: input.collectionId, ...data } });
}

export async function deleteEntry(siteId: string, id: string): Promise<void> {
  const owned = await prisma.cmsEntry.findFirst({
    where: { id, collection: { siteId } },
    select: { id: true },
  });
  if (!owned) throw new CmsError("NOT_FOUND", "Entry not found");
  await prisma.cmsEntry.delete({ where: { id } });
}
