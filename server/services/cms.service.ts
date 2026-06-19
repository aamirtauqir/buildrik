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
    pageSlugPattern: input.pageSlugPattern ?? null,
    pageSeoTitle: input.pageSeoTitle ?? null,
    pageSeoDescription: input.pageSeoDescription ?? null,
  };
  if (input.id) {
    // Upsert by the editor-supplied id (engine collection id = DB id, so the
    // first sync creates and later syncs update). Reject only a real cross-site
    // collision — a row with this id already owned by a DIFFERENT site.
    const existing = await prisma.cmsCollection.findUnique({ where: { id: input.id }, select: { siteId: true } });
    if (existing && existing.siteId !== siteId) throw new CmsError("NOT_FOUND", "Collection not found");
    return prisma.cmsCollection.upsert({
      where: { id: input.id },
      create: { id: input.id, siteId, ...data },
      update: data,
    });
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
    const existing = await prisma.cmsEntry.findUnique({
      where: { id: input.id },
      select: { collection: { select: { siteId: true } } },
    });
    if (existing && existing.collection.siteId !== siteId) throw new CmsError("NOT_FOUND", "Entry not found");
    return prisma.cmsEntry.upsert({
      where: { id: input.id },
      create: { id: input.id, collectionId: input.collectionId, ...data },
      update: data,
    });
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

// ── Dynamic pages (E7) ──────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Replace {fieldSlug} placeholders with each entry's values. slug patterns
// slugify the substituted value; SEO patterns keep it human-readable.
function applyPattern(pattern: string, data: Record<string, unknown>, asSlug: boolean): string {
  return pattern.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_m, key: string) => {
    const v = data[key];
    const s = v == null ? "" : String(v);
    return asSlug ? slugify(s) : s;
  });
}

export interface DynamicPage {
  entryId: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
}

/**
 * Resolve the published pages a page-generating collection produces — one per
 * PUBLISHED entry, with its slug + pattern SEO computed from the entry's data.
 * This is the data the publish pipeline turns into HTML; returning it lets the
 * dashboard preview the generated pages without a deploy. Non-page collections
 * (no pageSlugPattern) yield [].
 */
export async function resolveDynamicPages(
  siteId: string,
  collectionId: string,
): Promise<DynamicPage[]> {
  const col = await prisma.cmsCollection.findFirst({
    where: { id: collectionId, siteId },
    select: { pageSlugPattern: true, pageSeoTitle: true, pageSeoDescription: true },
  });
  if (!col) throw new CmsError("NOT_FOUND", "Collection not found");
  if (!col.pageSlugPattern) return [];
  const entries = await prisma.cmsEntry.findMany({
    where: { collectionId, status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, data: true },
  });
  return entries.map((e) => {
    const data = (e.data as Record<string, unknown>) ?? {};
    return {
      entryId: e.id,
      slug: applyPattern(col.pageSlugPattern as string, data, true),
      seoTitle: col.pageSeoTitle ? applyPattern(col.pageSeoTitle, data, false) : "",
      seoDescription: col.pageSeoDescription ? applyPattern(col.pageSeoDescription, data, false) : "",
    };
  });
}
