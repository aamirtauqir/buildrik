import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, PlanName } from "@/lib/constants/plan-limits";
import type { CreatePageInput, UpdatePageInput } from "@buildrik/shared/schemas/pages";

type DeletePageInput = { pageId: string; siteId: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function listPages(siteId: string) {
  return prisma.page.findMany({
    where: { siteId },
    select: {
      id: true,
      siteId: true,
      name: true,
      slug: true,
      position: true,
      isHomePage: true,
      seoTitle: true,
      seoDescription: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: { position: "asc" },
  });
}

export async function getPage(pageId: string) {
  return prisma.page.findUnique({ where: { id: pageId } });
}

export async function createPage(input: CreatePageInput) {
  const site = await prisma.site.findUnique({ where: { id: input.siteId } });
  if (!site) throw new Error("SITE_NOT_FOUND");

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: site.workspaceId },
    include: { workspace: true },
  });

  const plan = (member?.workspace?.plan ?? "FREE") as PlanName;
  const limit = PLAN_LIMITS[plan].pagesPerSite as number;

  const pageCount = await prisma.page.count({ where: { siteId: input.siteId } });
  if (pageCount >= limit) throw new Error("PAGE_LIMIT");

  const baseSlug = input.slug ?? slugify(input.name);
  const existing = await prisma.page.findUnique({
    where: { siteId_slug: { siteId: input.siteId, slug: baseSlug } },
  });
  const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

  const position = input.position ?? pageCount;

  const page = await prisma.page.create({
    data: {
      siteId: input.siteId,
      name: input.name,
      slug,
      position,
      isHomePage: input.isHomePage ?? false,
    },
  });

  await prisma.site.update({
    where: { id: input.siteId },
    data: { pages: { increment: 1 } },
  });

  return page;
}

export async function updatePage(input: UpdatePageInput) {
  const existing = await prisma.page.findUnique({ where: { id: input.pageId } });
  if (!existing) throw new Error("NOT_FOUND");

  if (input.updatedAt && existing.updatedAt > input.updatedAt) {
    throw new Error("CONFLICT");
  }

  const { pageId, siteId: _siteId, updatedAt: _updatedAt, ...fields } = input;

  return prisma.page.update({
    where: { id: pageId },
    data: fields,
  });
}

export async function deletePage(input: DeletePageInput) {
  const pageCount = await prisma.page.count({ where: { siteId: input.siteId } });
  if (pageCount <= 1) throw new Error("LAST_PAGE");

  const page = await prisma.page.findUnique({ where: { id: input.pageId } });
  if (!page) throw new Error("NOT_FOUND");

  await prisma.formBlock.deleteMany({ where: { pageId: input.pageId } });
  await prisma.page.delete({ where: { id: input.pageId } });
  await prisma.site.update({
    where: { id: input.siteId },
    data: { pages: { decrement: 1 } },
  });
}
