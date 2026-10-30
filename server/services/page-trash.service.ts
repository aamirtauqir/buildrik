import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import { checkSiteRole } from "@/server/services/permission.service";
import {
  PAGE_TRASH_RETENTION_DAYS,
  type PurgePageInput,
  type RestorePageInput,
  type TrashedPage,
} from "@buildrik/shared/schemas/pages";

/**
 * Page trash — "Recently deleted" in the Pages panel (design-2l9 A-21, boards
 * 142:53229–142:61796, 144:64795). The CMS tombstone pattern: a trashed page
 * keeps its row with `deletedAt` set, and its slug is rewritten to
 * `<slug>~deleted~<id>` so the (siteId, slug) unique key is free for a new
 * page; the URL it had is kept in `trashedSlug`. Every read of live pages
 * filters `deletedAt: null`.
 *
 * Owner decisions (2026-10-30): kept 30 days; EDITOR+ may list and restore;
 * permanent delete is ADMIN; a restore that would put the site over its plan's
 * page limit is refused ("Delete a page or upgrade to restore").
 */

export class PageTrashError extends Error {
  constructor(
    public code: "NOT_FOUND" | "PAGE_LIMIT" | "SLUG_TAKEN" | "CONFIRM_MISMATCH",
    message: string,
    /** SLUG_TAKEN: the first free URL to offer instead. */
    public suggestedSlug?: string,
  ) {
    super(message);
    this.name = "PageTrashError";
  }
}

const RETENTION_MS = PAGE_TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const SLUG_MAX = 100;
const TOMBSTONE = "~deleted~";

/** `<slug>~deleted~<id>`, cut to the column's 100 chars — the id keeps it unique. */
export function tombstoneSlug(slug: string, id: string): string {
  return `${slug.slice(0, Math.max(0, SLUG_MAX - TOMBSTONE.length - id.length))}${TOMBSTONE}${id}`;
}

/**
 * Move live pages of a site to the trash. Runs inside the caller's
 * transaction (the editor save removes the pages its snapshot no longer has).
 * Form blocks stay with the row until it is purged.
 *
 * `base` is the save's own base stamp (expectedLastEditedAt): a page restored
 * AFTER it was missing from a snapshot built before the restore — an
 * autosave in flight, another tab — and is left live. The restoring editor's
 * next save, based after the restore, carries the page; if that editor has
 * deleted it again by then, that save trashes it.
 */
export async function trashPages(
  tx: Prisma.TransactionClient,
  siteId: string,
  pageIds: string[],
  deletedById: string | null,
  base?: Date,
): Promise<void> {
  if (pageIds.length === 0) return;
  const pages = await tx.page.findMany({
    where: {
      id: { in: pageIds },
      siteId,
      deletedAt: null,
      ...(base ? { OR: [{ restoredAt: null }, { restoredAt: { lte: base } }] } : {}),
    },
    select: { id: true, slug: true },
  });
  const deletedAt = new Date();
  for (const page of pages) {
    await tx.page.update({
      where: { id: page.id },
      data: { deletedAt, deletedById, trashedSlug: page.slug, slug: tombstoneSlug(page.slug, page.id) },
    });
  }
}

/** The site's trashed pages still inside the retention window, newest first. */
export async function listPageTrash(userId: string, siteId: string): Promise<TrashedPage[]> {
  await checkSiteRole(prisma, userId, siteId, "EDITOR");
  const pages = await prisma.page.findMany({
    where: { siteId, deletedAt: { gte: new Date(Date.now() - RETENTION_MS) } },
    orderBy: { deletedAt: "desc" },
    select: { id: true, name: true, slug: true, trashedSlug: true, deletedAt: true, deletedById: true },
  });
  if (pages.length === 0) return [];

  const deleterIds = [...new Set(pages.map((p) => p.deletedById).filter((id): id is string => !!id))];
  const [users, folders] = await Promise.all([
    deleterIds.length
      ? prisma.user.findMany({ where: { id: { in: deleterIds } }, select: { id: true, fullName: true, displayName: true } })
      : Promise.resolve([]),
    // Folders are personal: "where it was" is the CALLER's folder, if any.
    prisma.pageFolder.findMany({ where: { userId, siteId }, select: { name: true, pageIds: true } }),
  ]);
  const userById = new Map(users.map((u) => [u.id, { id: u.id, name: u.displayName || u.fullName || null }]));

  return pages.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.trashedSlug ?? p.slug,
    deletedAt: p.deletedAt as Date,
    deletedBy: p.deletedById
      ? { id: p.deletedById, name: userById.get(p.deletedById)?.name ?? null, isYou: p.deletedById === userId }
      : null,
    folderName: folders.find((f) => f.pageIds.includes(p.id))?.name ?? null,
  }));
}

function firstFreeSlug(base: string, taken: Set<string>): string {
  for (let n = 2; ; n++) {
    const candidate = `${base.slice(0, SLUG_MAX - String(n).length - 1)}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Bring a trashed page back as a live page at the end of the list. Answers the
 * page as `pages.list` rows are shaped, for the editor to add to its document.
 */
export async function restorePage(userId: string, input: RestorePageInput) {
  await checkSiteRole(prisma, userId, input.siteId, "EDITOR");
  const page = await prisma.page.findFirst({
    where: { id: input.pageId, siteId: input.siteId, deletedAt: { not: null } },
    select: { id: true, name: true, slug: true, trashedSlug: true, isHomePage: true },
  });
  if (!page) throw new PageTrashError("NOT_FOUND", "This page is no longer in Recently deleted.");

  const site = await prisma.site.findUnique({
    where: { id: input.siteId },
    select: { workspace: { select: { plan: true } } },
  });
  const limit = PLAN_LIMITS[(site?.workspace.plan ?? "FREE") as PlanName].pagesPerSite as number;
  const live = await prisma.page.findMany({
    where: { siteId: input.siteId, deletedAt: null },
    select: { slug: true, isHomePage: true },
  });
  if (limit !== -1 && live.length + 1 > limit) {
    throw new PageTrashError("PAGE_LIMIT", "Delete a page or upgrade to restore.");
  }

  const slug = input.slug ?? page.trashedSlug ?? page.slug.split(TOMBSTONE)[0];
  const liveSlugs = new Set(live.map((p) => p.slug));
  if (liveSlugs.has(slug)) {
    throw new PageTrashError("SLUG_TAKEN", `Another page now uses /${slug}.`, firstFreeSlug(slug, liveSlugs));
  }

  try {
    const [restored] = await prisma.$transaction([
      prisma.page.update({
        where: { id: page.id },
        data: {
          deletedAt: null,
          deletedById: null,
          trashedSlug: null,
          restoredAt: new Date(),
          slug,
          slugManuallySet: input.slug !== undefined ? true : undefined,
          position: live.length,
          // A site has one home page: the trashed one gets the role back only
          // if no live page took it meanwhile.
          isHomePage: page.isHomePage && !live.some((p) => p.isHomePage),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          position: true,
          isHomePage: true,
          seoTitle: true,
          seoDescription: true,
          blocks: true,
          meta: true,
          settings: true,
          slugHistory: true,
          slugManuallySet: true,
          updatedAt: true,
        },
      }),
      prisma.site.update({ where: { id: input.siteId }, data: { pages: { increment: 1 } } }),
    ]);
    return restored;
  } catch (e) {
    // A page took the slug between the check and the write.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new PageTrashError("SLUG_TAKEN", `Another page now uses /${slug}.`, firstFreeSlug(slug, new Set([...liveSlugs, slug])));
    }
    throw e;
  }
}

/** Delete one trashed page for good (ADMIN; the typed name must match). */
export async function purgePage(userId: string, input: PurgePageInput): Promise<{ success: true }> {
  await checkSiteRole(prisma, userId, input.siteId, "ADMIN");
  const page = await prisma.page.findFirst({
    where: { id: input.pageId, siteId: input.siteId, deletedAt: { not: null } },
    select: { id: true, name: true },
  });
  if (!page) throw new PageTrashError("NOT_FOUND", "This page is no longer in Recently deleted.");
  if (input.confirmName.trim() !== page.name) {
    throw new PageTrashError("CONFIRM_MISMATCH", `Type ${page.name} to confirm.`);
  }
  await prisma.$transaction([
    prisma.formBlock.deleteMany({ where: { pageId: page.id } }),
    prisma.page.delete({ where: { id: page.id } }),
  ]);
  return { success: true };
}

/** Retention purge (cron): trashed pages older than the window, with their form blocks. */
export async function purgeExpiredPageTrash(now: Date = new Date()): Promise<{ deleted: number }> {
  const expired = await prisma.page.findMany({
    where: { deletedAt: { not: null, lt: new Date(now.getTime() - RETENTION_MS) } },
    select: { id: true },
  });
  if (expired.length === 0) return { deleted: 0 };
  const ids = expired.map((p) => p.id);
  const [, pages] = await prisma.$transaction([
    prisma.formBlock.deleteMany({ where: { pageId: { in: ids } } }),
    prisma.page.deleteMany({ where: { id: { in: ids }, deletedAt: { not: null } } }),
  ]);
  return { deleted: pages.count };
}
