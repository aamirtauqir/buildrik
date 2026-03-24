import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type {
  CreateSiteInput,
  ListSitesInput,
  BulkActionInput,
} from "@/lib/validations/sites";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;

  for (let i = 0; i < 10; i++) {
    const existing = await prisma.site.findFirst({
      where: { slug: candidate },
    });
    if (!existing) return candidate;
    candidate = `${base}-${i + 2}`;
  }

  return `${base}-${Date.now()}`;
}

const SORT_MAP: Record<string, Record<string, string>> = {
  lastEdited: { lastEditedAt: "desc" },
  name: { name: "asc" },
  created: { createdAt: "desc" },
  traffic: { lastEditedAt: "desc" },
  pages: { pages: "desc" },
  published: { lastPublishedAt: "desc" },
};

export async function listSites(
  workspaceId: string,
  filters: ListSitesInput
) {
  const { page, perPage, status, sort, search, folderId } = filters;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {
    workspaceId,
    deletedAt: null,
  };

  if (status) where.status = status;
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (folderId !== undefined) where.folderId = folderId;

  const orderBy = SORT_MAP[sort] ?? SORT_MAP.lastEdited;

  const [total, data] = await Promise.all([
    prisma.site.count({ where }),
    prisma.site.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        thumbnail: true,
        pages: true,
        lastEditedAt: true,
        publishedUrl: true,
        createdAt: true,
        folderId: true,
      },
    }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function createSite(
  workspaceId: string,
  userId: string,
  input: CreateSiteInput
) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
    include: { workspace: { select: { plan: true } } },
  });

  const plan = (membership?.workspace?.plan as PlanName) ?? "FREE";
  const limit = PLAN_LIMITS[plan].sites as number;

  const currentCount = await prisma.site.count({
    where: { workspaceId, deletedAt: null },
  });

  if (currentCount >= limit) {
    throw new Error("SITE_LIMIT");
  }

  const slug = await generateUniqueSlug(input.name);

  return prisma.site.create({
    data: {
      name: input.name,
      slug,
      status: "DRAFT",
      workspaceId,
      createdBy: userId,
      pages: 0,
      lastEditedAt: new Date(),
    },
  });
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const existing = await prisma.site.findFirst({ where: { slug } });
  return !existing;
}

export async function transferSite(
  siteId: string,
  newOwnerId: string,
  currentUserId: string
) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error("SITE_NOT_FOUND");
  if (site.createdBy !== currentUserId) throw new Error("NOT_OWNER");

  const currentMember = await prisma.workspaceMember.findFirst({
    where: { userId: currentUserId, workspaceId: site.workspaceId },
  });
  const newOwnerMember = await prisma.workspaceMember.findFirst({
    where: { userId: newOwnerId, workspaceId: site.workspaceId },
  });
  if (!newOwnerMember) throw new Error("MEMBER_NOT_FOUND");

  await prisma.$transaction([
    prisma.site.update({
      where: { id: siteId },
      data: { createdBy: newOwnerId },
    }),
    ...(currentMember
      ? [
          prisma.sitePermission.upsert({
            where: {
              memberId_siteId: { memberId: currentMember.id, siteId },
            },
            create: {
              memberId: currentMember.id,
              siteId,
              roleOverride: "EDITOR",
              grantedBy: currentUserId,
            },
            update: { roleOverride: "EDITOR" },
          }),
        ]
      : []),
  ]);

  return { success: true };
}

export async function getSite(siteId: string) {
  return prisma.site.findUnique({
    where: { id: siteId },
    include: { folder: true },
  });
}

export async function renameSite(siteId: string, name: string) {
  return prisma.site.update({
    where: { id: siteId },
    data: { name, lastEditedAt: new Date() },
  });
}

export async function duplicateSite(
  siteId: string,
  workspaceId: string,
  userId: string
) {
  const original = await prisma.site.findUnique({ where: { id: siteId } });
  if (!original) throw new Error("SITE_NOT_FOUND");

  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
    include: { workspace: { select: { plan: true } } },
  });

  const plan = (membership?.workspace?.plan as PlanName) ?? "FREE";
  const limit = PLAN_LIMITS[plan].sites as number;

  const currentCount = await prisma.site.count({
    where: { workspaceId, deletedAt: null },
  });

  if (currentCount >= limit) {
    throw new Error("SITE_LIMIT");
  }

  const copyName = `${original.name} (Copy)`;
  const slug = await generateUniqueSlug(copyName);

  return prisma.site.create({
    data: {
      name: copyName,
      slug,
      status: "DRAFT",
      workspaceId,
      createdBy: userId,
      pages: original.pages,
      lastEditedAt: new Date(),
    },
  });
}

export async function archiveSite(siteId: string) {
  return prisma.site.update({
    where: { id: siteId },
    data: { status: "ARCHIVED" },
  });
}

export async function unarchiveSite(siteId: string) {
  return prisma.site.update({
    where: { id: siteId },
    data: { status: "DRAFT" },
  });
}

export async function deleteSite(siteId: string, confirmName: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error("SITE_NOT_FOUND");

  if (site.name !== confirmName) {
    throw new Error("NAME_MISMATCH");
  }

  return prisma.site.update({
    where: { id: siteId },
    data: { deletedAt: new Date() },
  });
}

export async function bulkAction(
  workspaceId: string,
  input: BulkActionInput
) {
  const { action, siteIds } = input;

  switch (action) {
    case "archive": {
      const result = await prisma.site.updateMany({
        where: { id: { in: siteIds }, workspaceId },
        data: { status: "ARCHIVED" },
      });
      return { succeeded: siteIds.slice(0, result.count), failed: [] };
    }
    case "unarchive": {
      const result = await prisma.site.updateMany({
        where: { id: { in: siteIds }, workspaceId },
        data: { status: "DRAFT" },
      });
      return { succeeded: siteIds.slice(0, result.count), failed: [] };
    }
    case "publish": {
      const result = await prisma.site.updateMany({
        where: { id: { in: siteIds }, workspaceId },
        data: { status: "PUBLISHED" },
      });
      return { succeeded: siteIds.slice(0, result.count), failed: [] };
    }
    case "unpublish": {
      const result = await prisma.site.updateMany({
        where: { id: { in: siteIds }, workspaceId },
        data: { status: "DRAFT" },
      });
      return { succeeded: siteIds.slice(0, result.count), failed: [] };
    }
    case "delete": {
      const result = await prisma.site.updateMany({
        where: { id: { in: siteIds }, workspaceId },
        data: { deletedAt: new Date() },
      });
      return { succeeded: siteIds.slice(0, result.count), failed: [] };
    }
    default:
      throw new Error("INVALID_ACTION");
  }
}
