import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type {
  CreateSiteInput,
  ListSitesInput,
  BulkActionInput,
  SaveProjectDataInput,
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
      projectStyles: (original.projectStyles as Prisma.InputJsonValue) ?? undefined,
      projectAssets: (original.projectAssets as Prisma.InputJsonValue) ?? undefined,
      projectSettings: (original.projectSettings as Prisma.InputJsonValue) ?? undefined,
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
        blocks: (p.blocks ?? []) as Prisma.InputJsonValue,
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

/**
 * Editor's `sites.saveProject` router shape — what `composer.exportProject()`
 * produces and what BuildrikSyncProvider.saveProject sends. Translated to
 * SaveProjectDataInput shape and forwarded to consolidated saveProjectData.
 *
 * Phase -1 consolidation: previously this function and saveProjectData(input)
 * coexisted as a duplicate-export TS2323/TS2393 error. Build pipeline
 * silently dropped the conflict; runtime hoisting picked one. Now this is
 * a thin adapter that maps the editor shape → canonical input shape.
 */
export async function saveProjectFromEditor(
  siteId: string,
  projectData: {
    version: string;
    pages: Array<{
      id: string;
      name: string;
      slug?: string;
      isHome?: boolean;
      root?: unknown;
      settings?: unknown;
      meta?: unknown;
      slugHistory?: unknown;
      slugManuallySet?: boolean;
      seoTitle?: string | null;
      seoDescription?: string | null;
    }>;
    styles: unknown[];
    assets: unknown[];
    metadata?: unknown;
    settings?: unknown;
    dsSchemaVersion?: number;
  }
) {
  return saveProjectData({
    siteId,
    pages: projectData.pages.map((p, index) => ({
      id: p.id,
      blocks: p.root,
      name: p.name,
      slug: p.slug,
      isHomePage: p.isHome,
      position: index,
      seoTitle: p.seoTitle ?? undefined,
      seoDescription: p.seoDescription ?? undefined,
      meta: p.meta as Record<string, unknown> | undefined,
      settings: p.settings,
      slugHistory: p.slugHistory as Array<{ fromSlug: string; toSlug: string; changedAt: string }> | undefined,
      slugManuallySet: p.slugManuallySet,
    })),
    styles: projectData.styles,
    assets: projectData.assets,
    settings: projectData.settings,
    dsSchemaVersion: projectData.dsSchemaVersion,
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

/**
 * Phase -1: canonical project-data persistence path.
 *
 * Writes:
 *   - Per page: blocks, name, slug, position, isHomePage, seoTitle, seoDescription,
 *     meta (Json?), settings (Json?), slugHistory (Json?), slugManuallySet (Boolean).
 *   - Upserts incoming pages by id, deletes pages no longer present.
 *   - Site-level: projectStyles, projectAssets, projectSettings, lastEditedAt.
 *
 * REGRESSION-1 (codex finding C23): `pages[].meta` was previously dropped on
 * save, breaking applied-template state across reload. Persisting meta is
 * load-bearing for P2 + P9 (template version pinning + applied-template badge).
 */
export async function saveProjectData(input: SaveProjectDataInput) {
  const site = await prisma.site.findUnique({ where: { id: input.siteId } });
  if (!site) throw new Error("SITE_NOT_FOUND");

  const savedAt = new Date();

  await prisma.$transaction(async (tx) => {
    // Delete pages not in incoming set (only when caller supplies position
    // for every page — that's how we infer the editor sent a full project
    // snapshot, not a partial blocks update).
    const isFullSnapshot = input.pages.every((p: { position?: number }) => p.position !== undefined);
    if (isFullSnapshot) {
      const existingPages = await tx.page.findMany({
        where: { siteId: input.siteId },
        select: { id: true },
      });
      const incomingPageIds = new Set(input.pages.map((p: { id: string }) => p.id));
      const pagesToDelete = existingPages.filter((p) => !incomingPageIds.has(p.id));
      if (pagesToDelete.length > 0) {
        await tx.formBlock.deleteMany({
          where: { pageId: { in: pagesToDelete.map((p) => p.id) } },
        });
        await tx.page.deleteMany({
          where: { id: { in: pagesToDelete.map((p) => p.id) } },
        });
      }
    }

    // Upsert each incoming page.
    for (const [index, page] of input.pages.entries()) {
      const slug =
        page.slug ?? (page.name ? page.name.toLowerCase().replace(/\s+/g, "-") : undefined);

      // Phase -1: persist meta + settings + slugHistory + slugManuallySet
      // (previously silently dropped, breaking applied-template reload).
      const metaJson =
        page.meta === undefined
          ? undefined
          : page.meta === null
            ? Prisma.JsonNull
            : (page.meta as Prisma.InputJsonValue);
      const settingsJson =
        page.settings === undefined
          ? undefined
          : (page.settings as Prisma.InputJsonValue);
      const slugHistoryJson =
        page.slugHistory === undefined
          ? undefined
          : page.slugHistory === null
            ? Prisma.JsonNull
            : (page.slugHistory as Prisma.InputJsonValue);

      const updateData: Prisma.PageUpdateInput = {
        blocks: page.blocks as Prisma.InputJsonValue,
      };
      if (page.name !== undefined) updateData.name = page.name;
      if (slug !== undefined) updateData.slug = slug;
      if (page.position !== undefined) updateData.position = page.position ?? index;
      if (page.isHomePage !== undefined) updateData.isHomePage = page.isHomePage;
      if (page.seoTitle !== undefined) updateData.seoTitle = page.seoTitle;
      if (page.seoDescription !== undefined) updateData.seoDescription = page.seoDescription;
      if (metaJson !== undefined) updateData.meta = metaJson;
      if (settingsJson !== undefined) updateData.settings = settingsJson;
      if (slugHistoryJson !== undefined) updateData.slugHistory = slugHistoryJson;
      if (page.slugManuallySet !== undefined) updateData.slugManuallySet = page.slugManuallySet;

      // Upsert path used when full snapshot (covers new pages); plain update otherwise.
      if (isFullSnapshot && page.name !== undefined && slug !== undefined) {
        await tx.page.upsert({
          where: { id: page.id },
          create: {
            id: page.id,
            siteId: input.siteId,
            name: page.name,
            slug,
            position: page.position ?? index,
            isHomePage: page.isHomePage ?? false,
            blocks: page.blocks as Prisma.InputJsonValue,
            ...(metaJson !== undefined && metaJson !== Prisma.JsonNull
              ? { meta: metaJson }
              : {}),
            ...(settingsJson !== undefined ? { settings: settingsJson } : {}),
            ...(slugHistoryJson !== undefined && slugHistoryJson !== Prisma.JsonNull
              ? { slugHistory: slugHistoryJson }
              : {}),
            ...(page.slugManuallySet !== undefined
              ? { slugManuallySet: page.slugManuallySet }
              : {}),
            ...(page.seoTitle !== undefined ? { seoTitle: page.seoTitle } : {}),
            ...(page.seoDescription !== undefined
              ? { seoDescription: page.seoDescription }
              : {}),
          },
          update: updateData,
        });
      } else {
        await tx.page.update({
          where: { id: page.id },
          data: updateData,
        });
      }
    }

    // Site-level project artifacts.
    await tx.site.update({
      where: { id: input.siteId },
      data: {
        projectStyles:
          input.styles === undefined
            ? undefined
            : ((input.styles as Prisma.InputJsonValue) ?? Prisma.DbNull),
        projectAssets:
          input.assets === undefined
            ? undefined
            : ((input.assets as Prisma.InputJsonValue) ?? Prisma.DbNull),
        projectSettings:
          input.settings === undefined
            ? undefined
            : ((input.settings as Prisma.InputJsonValue) ?? Prisma.DbNull),
        dsSchemaVersion: input.dsSchemaVersion,
        lastEditedAt: savedAt,
        ...(isFullSnapshot ? { pages: input.pages.length } : {}),
      },
    });
  });

  return { success: true, savedAt };
}

export async function getProjectData(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      name: true,
      projectStyles: true,
      projectAssets: true,
      projectSettings: true,
      dsSchemaVersion: true,
      sitePages: {
        select: {
          id: true,
          name: true,
          slug: true,
          position: true,
          blocks: true,
          isHomePage: true,
          seoTitle: true,
          seoDescription: true,
          // Phase -1: round-trip applied-template state + slug-redirect history.
          meta: true,
          settings: true,
          slugHistory: true,
          slugManuallySet: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!site) throw new Error("SITE_NOT_FOUND");

  return {
    siteId: site.id,
    name: site.name,
    pages: site.sitePages,
    styles: site.projectStyles ?? [],
    assets: site.projectAssets ?? [],
    settings: site.projectSettings ?? {},
    dsSchemaVersion: site.dsSchemaVersion,
  };
}

export async function userCanEditSite(
  userId: string,
  siteId: string,
): Promise<boolean> {
  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      deletedAt: null,
      workspace: { members: { some: { userId } } },
    },
    select: { id: true },
  });
  return !!site;
}
