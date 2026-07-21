import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import { sanitizeBlocks } from "@/lib/sanitize-blocks";
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
  const { category, page, perPage, sort, search, difficulty } = input;
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
  if (difficulty !== "ALL") {
    where.difficulty = difficulty;
  }
  // T2: free-text search over name + description (case-insensitive). AND-ed with
  // the workspace OR-scope above so search never leaks other agencies' templates.
  const term = search?.trim();
  if (term) {
    where.AND = [
      {
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
    ];
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

type TemplatePageInput = {
  name: string;
  slug: string;
  position: number;
  isHomePage: boolean;
  blocks: Prisma.InputJsonValue;
};

/**
 * Map a template's stored `pages[]` (Json) into `page.createMany` rows bound to
 * a target site. Shared by all three template→site paths — useTemplate (brand-new
 * site), applyTemplateToSite (existing site), and sites.create's onboarding
 * template branch — so the clone shape lives in exactly one place.
 *
 * Runs each page's blocks through sanitizeBlocks: the write-boundary XSS guard is
 * applied on every clone path, not just onboarding. DOMPurify preserves safe HTML,
 * so container blocks stamped `contentFormat:"html"` still render.
 */
export function pagesFromTemplate(template: { pages: Prisma.JsonValue }, siteId: string) {
  const templatePages = (template.pages ?? []) as unknown as TemplatePageInput[];
  return templatePages.map((p, i) => ({
    siteId,
    name: p.name,
    slug: p.slug,
    position: p.position ?? i,
    isHomePage: p.isHomePage ?? i === 0,
    blocks: sanitizeBlocks(p.blocks ?? []),
  }));
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
  const templatePageCount = ((template.pages ?? []) as unknown[]).length;

  const site = await prisma.site.create({
    data: {
      name: siteName,
      slug,
      status: "DRAFT",
      workspaceId,
      createdBy: userId,
      creationMethod: "TEMPLATE",
      templateId: template.id,
      pages: templatePageCount,
      lastEditedAt: new Date(),
    },
  });

  const pageRows = pagesFromTemplate(template, site.id);
  if (pageRows.length > 0) {
    await prisma.page.createMany({ data: pageRows });
  }

  await prisma.template.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  });

  return site;
}

/**
 * Part ③ — apply a template to an EXISTING site. DESTRUCTIVE: replaces the
 * site's pages with the template's (delete-then-recreate), records the source
 * template, and refreshes the page count + edit timestamp. Workspace-scoped:
 * the site must belong to `workspaceId` and the template must be visible to it
 * (a global built-in or one of the workspace's own clones — same scope
 * listTemplates uses). The delete + recreate + update run in one transaction so
 * a failure can never strand the site with zero pages.
 */
export async function applyTemplateToSite(
  workspaceId: string,
  userId: string,
  siteId: string,
  templateId: string
) {
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspaceId, deletedAt: null },
    select: { id: true },
  });
  if (!site) throw new TemplateError("SITE_NOT_FOUND", "Site not found in this workspace");

  const template = await prisma.template.findFirst({
    where: {
      id: templateId,
      isActive: true,
      OR: [{ workspaceId: null }, { workspaceId }],
    },
  });
  if (!template) throw new Error("TEMPLATE_NOT_FOUND");

  const pageRows = pagesFromTemplate(template, siteId);

  return prisma.$transaction(async (tx) => {
    await tx.page.deleteMany({ where: { siteId } });
    if (pageRows.length > 0) {
      await tx.page.createMany({ data: pageRows });
    }
    return tx.site.update({
      where: { id: siteId },
      data: {
        templateId: template.id,
        pages: pageRows.length,
        lastEditedAt: new Date(),
      },
    });
  });
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
