import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { ListTemplatesInput } from "@buildrik/shared/schemas/templates";

const SORT_MAP: Record<string, Record<string, string>> = {
  popular: { usageCount: "desc" },
  newest: { createdAt: "desc" },
  alphabetical: { name: "asc" },
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function generateUniqueSlug(
  name: string,
  workspaceId: string
): Promise<string> {
  const base = slugify(name);
  let candidate = base;

  for (let i = 0; i < 10; i++) {
    const existing = await prisma.site.findFirst({
      where: { slug: candidate, workspaceId },
    });
    if (!existing) return candidate;
    candidate = `${base}-${i + 2}`;
  }

  return `${base}-${Date.now()}`;
}

export async function listTemplates(input: ListTemplatesInput, workspaceId?: string) {
  const { category, page, perPage, sort } = input;
  const skip = (page - 1) * perPage;

  // Gallery = global built-ins (workspaceId null) + the caller's own cloned
  // templates (T4). A workspace never sees another agency's private clones.
  const where: Record<string, unknown> = {
    isActive: true,
    OR: workspaceId ? [{ workspaceId: null }, { workspaceId }] : [{ workspaceId: null }],
  };
  if (category !== "ALL") {
    where.category = category;
  }

  const orderBy = SORT_MAP[sort] ?? SORT_MAP.popular;

  const [total, data] = await Promise.all([
    prisma.template.count({ where }),
    prisma.template.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
    }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getTemplate(id: string) {
  return prisma.template.findUnique({ where: { id } });
}

export async function useTemplate(
  workspaceId: string,
  userId: string,
  templateId: string,
  siteName: string
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

  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  const slug = await generateUniqueSlug(siteName, workspaceId);
  const templatePages = (template.pages ?? []) as Array<{
    name: string;
    slug: string;
    position: number;
    isHomePage: boolean;
    blocks: Prisma.InputJsonValue;
  }>;

  const site = await prisma.site.create({
    data: {
      name: siteName,
      slug,
      status: "DRAFT",
      workspaceId,
      createdBy: userId,
      creationMethod: "TEMPLATE",
      pages: templatePages.length,
      lastEditedAt: new Date(),
    },
  });

  if (templatePages.length > 0) {
    await prisma.page.createMany({
      data: templatePages.map((p, i) => ({
        siteId: site.id,
        name: p.name,
        slug: p.slug,
        position: p.position ?? i,
        isHomePage: p.isHomePage ?? i === 0,
        blocks: p.blocks ?? [],
      })),
    });
  }

  await prisma.template.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  });

  return site;
}

export class TemplateError extends Error {
  constructor(public code: "SITE_NOT_FOUND", message: string) {
    super(message);
    this.name = "TemplateError";
  }
}

/** Template.slug is GLOBALLY unique — dedupe against all templates, not per-workspace. */
async function uniqueTemplateSlug(name: string): Promise<string> {
  const base = slugify(name) || "template";
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const existing = await prisma.template.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/**
 * T4 (clone-as-template): turn one of the agency's sites into a reusable template,
 * private to their workspace. Copies the site's pages (structure + blocks) into a
 * new Template row tagged with workspaceId, so it shows in their gallery alongside
 * the built-ins but never to other agencies. IDOR-guarded (site must be in ws).
 */
export async function cloneSiteAsTemplate(
  workspaceId: string,
  siteId: string,
  name: string,
  category?: string,
): Promise<{ templateId: string; slug: string; pageCount: number }> {
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (!site) throw new TemplateError("SITE_NOT_FOUND", "Site not found in this workspace");

  const pages = await prisma.page.findMany({
    where: { siteId },
    orderBy: { position: "asc" },
    select: { name: true, slug: true, position: true, isHomePage: true, blocks: true },
  });

  const slug = await uniqueTemplateSlug(name);
  const tpl = await prisma.template.create({
    data: {
      name,
      slug,
      category: category ?? "BUSINESS",
      description: `Cloned from a workspace site`,
      workspaceId,
      isActive: true,
      pages: pages.map((p) => ({
        name: p.name,
        slug: p.slug,
        position: p.position,
        isHomePage: p.isHomePage,
        blocks: (p.blocks ?? []) as Prisma.InputJsonValue,
      })) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  return { templateId: tpl.id, slug, pageCount: pages.length };
}
