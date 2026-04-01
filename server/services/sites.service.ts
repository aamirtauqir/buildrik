import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type {
  CreateSiteInput,
  ListSitesInput,
  BulkActionInput,
} from "@buildrik/shared/schemas/sites";
import { sendSiteTransferredEmail } from "@/server/services/email.service";

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
  const { page, perPage, status, sort, search, folderId, createdBy, dateRange, templateUsed, hasCustomDomain, hasTraffic } = filters;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {
    workspaceId,
    deletedAt: null,
  };

  if (status) where.status = status;
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (folderId !== undefined) where.folderId = folderId;
  if (createdBy) where.createdBy = createdBy;
  if (dateRange) {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    where.createdAt = { gte: new Date(Date.now() - days * 86400000) };
  }
  if (templateUsed) where.template = templateUsed;
  if (hasCustomDomain === true) where.domains = { some: {} };
  if (hasCustomDomain === false) where.domains = { none: {} };

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
        createdBy: true,
        template: true,
        folderId: true,
        domains: { take: 1, select: { domain: true, isPrimary: true } },
        analytics: {
          where: { date: { gte: new Date(Date.now() - 30 * 86400000) } },
          select: { visitors: true },
        },
      },
    }),
  ]);

  const enriched = data.map((site) => {
    const visitors30d = site.analytics.reduce((sum, a) => sum + a.visitors, 0);
    const domain = site.domains[0]?.domain ?? null;
    return {
      id: site.id,
      name: site.name,
      slug: site.slug,
      status: site.status,
      thumbnail: site.thumbnail,
      pages: site.pages,
      lastEditedAt: site.lastEditedAt,
      publishedUrl: site.publishedUrl,
      createdAt: site.createdAt,
      createdBy: site.createdBy,
      template: site.template,
      folderId: site.folderId,
      domain,
      visitors30d,
    };
  });

  const filtered = hasTraffic
    ? enriched.filter((s) => {
        switch (hasTraffic) {
          case "none": return s.visitors30d === 0;
          case "1-100": return s.visitors30d >= 1 && s.visitors30d <= 100;
          case "100-1000": return s.visitors30d > 100 && s.visitors30d <= 1000;
          case "1000+": return s.visitors30d > 1000;
          default: return true;
        }
      })
    : enriched;

  return {
    data: filtered,
    total: hasTraffic ? filtered.length : total,
    page,
    totalPages: Math.ceil((hasTraffic ? filtered.length : total) / perPage),
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

  if (input.method === "template" && input.templateId) {
    const template = await prisma.template.findUnique({
      where: { id: input.templateId },
    });
    if (!template) throw new Error("TEMPLATE_NOT_FOUND");

    const site = await prisma.$transaction(async (tx) => {
      const created = await tx.site.create({
        data: {
          name: input.name,
          slug,
          status: "DRAFT",
          workspaceId,
          createdBy: userId,
          creationMethod: "TEMPLATE",
          template: input.templateId,
          pages: 0,
          lastEditedAt: new Date(),
        },
      });

      const templatePages =
        (template.pages as Array<{
          name: string;
          slug: string;
          blocks: unknown;
          isHomePage?: boolean;
        }>) ?? [];

      for (let i = 0; i < templatePages.length; i++) {
        const tp = templatePages[i];
        await tx.page.create({
          data: {
            siteId: created.id,
            name: tp.name,
            slug: tp.slug,
            position: i,
            blocks: tp.blocks ?? [],
            isHomePage: tp.isHomePage ?? i === 0,
          },
        });
      }

      await tx.site.update({
        where: { id: created.id },
        data: { pages: templatePages.length },
      });

      await tx.template.update({
        where: { id: input.templateId! },
        data: { usageCount: { increment: 1 } },
      });

      return created;
    });

    return site;
  }

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

  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: currentUserId }, select: { fullName: true } }),
    prisma.user.findUnique({ where: { id: newOwnerId }, select: { email: true } }),
  ]);
  if (toUser?.email) {
    sendSiteTransferredEmail(
      toUser.email,
      fromUser?.fullName ?? "A team member",
      site.name,
      siteId,
    ).catch(() => {});
  }

  return { success: true };
}

export async function getSite(siteId: string) {
  return prisma.site.findFirst({
    where: { id: siteId, deletedAt: null },
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

  const originalPages = await prisma.page.findMany({
    where: { siteId },
    orderBy: { position: "asc" },
  });

  const newSite = await prisma.site.create({
    data: {
      name: copyName,
      slug,
      status: "DRAFT",
      workspaceId,
      createdBy: userId,
      pages: originalPages.length,
      lastEditedAt: new Date(),
    },
  });

  if (originalPages.length > 0) {
    await prisma.page.createMany({
      data: originalPages.map((p) => ({
        siteId: newSite.id,
        name: p.name,
        slug: p.slug,
        position: p.position,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blocks: (p.blocks ?? []) as any,
        isHomePage: p.isHomePage,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
      })),
    });
  }

  return newSite;
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

  const now = new Date();

  await prisma.$transaction([
    prisma.site.update({
      where: { id: siteId },
      data: { deletedAt: now },
    }),
    prisma.shareLink.updateMany({
      where: { siteId },
      data: { isActive: false },
    }),
    prisma.formBlock.updateMany({
      where: { siteId },
      data: { isActive: false },
    }),
  ]);

  return { success: true };
}

export async function saveProjectData(
  siteId: string,
  projectData: {
    version: string;
    pages: Array<{
      id: string;
      name: string;
      slug?: string;
      isHome?: boolean;
      root: unknown;
    }>;
    styles: unknown[];
    assets: unknown[];
    metadata?: unknown;
    settings?: unknown;
  }
) {
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error("SITE_NOT_FOUND");

  const savedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const existingPages = await tx.page.findMany({
      where: { siteId },
      select: { id: true },
    });

    const incomingPageIds = new Set(projectData.pages.map((p) => p.id));
    const pagesToDelete = existingPages.filter((p) => !incomingPageIds.has(p.id));

    if (pagesToDelete.length > 0) {
      await tx.page.deleteMany({
        where: { id: { in: pagesToDelete.map((p) => p.id) } },
      });
    }

    for (const [index, page] of projectData.pages.entries()) {
      await tx.page.upsert({
        where: { id: page.id },
        create: {
          id: page.id,
          siteId,
          name: page.name,
          slug: page.slug || page.name.toLowerCase().replace(/\s+/g, "-"),
          position: index,
          isHomePage: page.isHome || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          blocks: page.root as any,
        },
        update: {
          name: page.name,
          slug: page.slug || page.name.toLowerCase().replace(/\s+/g, "-"),
          position: index,
          isHomePage: page.isHome || false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          blocks: page.root as any,
        },
      });
    }

    await tx.site.update({
      where: { id: siteId },
      data: { lastEditedAt: savedAt, pages: projectData.pages.length },
    });
  });

  return { success: true, savedAt };
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
