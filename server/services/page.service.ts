import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, PlanName } from "@/lib/constants/plan-limits";
import type {
  CreatePageInput,
  UpdatePageInput,
  SetTranslationInput,
  RemoveTranslationInput,
} from "@buildrik/shared/schemas/pages";

type DeletePageInput = { pageId: string; siteId: string };

type TranslationMap = Record<string, { blocks: Prisma.JsonValue }>;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function listPages(siteId: string) {
  // Phase -1: full page hydration. BuildrikSyncProvider.loadProject expects
  // blocks/settings/slugHistory/meta/slugManuallySet for applied-template
  // state + slug-redirect history to survive reload.
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
      blocks: true,
      meta: true,
      settings: true,
      slugHistory: true,
      slugManuallySet: true,
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

  const { pageId, siteId: _siteId, updatedAt: _updatedAt, blocks, ...fields } = input;

  return prisma.page.update({
    where: { id: pageId },
    data: {
      ...fields,
      ...(blocks !== undefined ? { blocks: blocks as Prisma.InputJsonValue } : {}),
    },
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

// Locale fallback chain: `fr-FR` → `fr` → site.defaultLocale → null.
// `null` means caller should 404 / serve placeholder; the canonical row exists
// at `page.blocks` and is paired with `site.defaultLocale`, so a true miss is rare.
//
// The chain is intentionally limited to two language hops (region → base) plus
// the site default. We do NOT walk through region siblings (e.g. `fr-CA`) —
// industry convention is base-language fallback only. Caller passes the
// browser/Accept-Language locale unchanged.
export async function resolveTranslation(pageId: string, locale: string) {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      siteId: true,
      blocks: true,
      translations: true,
      site: { select: { defaultLocale: true } },
    },
  });
  if (!page) return null;

  const translations = (page.translations ?? {}) as TranslationMap;
  const defaultLocale = page.site.defaultLocale;
  const chain = buildFallbackChain(locale, defaultLocale);

  for (const candidate of chain) {
    if (candidate === defaultLocale) {
      // Default-locale content is the canonical Page.blocks column, not a
      // translations entry — translations exist only for non-default locales.
      return { locale: candidate, blocks: page.blocks, isFallback: candidate !== locale };
    }
    const entry = translations[candidate];
    if (entry !== undefined) {
      return { locale: candidate, blocks: entry.blocks, isFallback: candidate !== locale };
    }
  }
  return null;
}

export function buildFallbackChain(locale: string, defaultLocale: string): string[] {
  const chain: string[] = [locale];
  const dash = locale.indexOf("-");
  if (dash > 0) {
    const base = locale.slice(0, dash);
    if (!chain.includes(base)) chain.push(base);
  }
  if (!chain.includes(defaultLocale)) chain.push(defaultLocale);
  return chain;
}

export async function setTranslation(input: SetTranslationInput) {
  const page = await prisma.page.findUnique({
    where: { id: input.pageId },
    select: { id: true, siteId: true, translations: true },
  });
  if (!page) throw new Error("NOT_FOUND");
  if (page.siteId !== input.siteId) throw new Error("SITE_MISMATCH");

  const site = await prisma.site.findUnique({
    where: { id: input.siteId },
    select: { defaultLocale: true, enabledLocales: true },
  });
  if (!site) throw new Error("SITE_NOT_FOUND");

  if (!site.enabledLocales.includes(input.locale)) {
    throw new Error("LOCALE_NOT_ENABLED");
  }
  if (input.locale === site.defaultLocale) {
    // Default-locale content lives at Page.blocks (the canonical column).
    // Writing to translations[defaultLocale] would create two competing
    // sources of truth — route the caller through updatePage(blocks) instead.
    throw new Error("DEFAULT_LOCALE_USES_BLOCKS");
  }

  const existing = (page.translations ?? {}) as TranslationMap;
  const next: TranslationMap = {
    ...existing,
    [input.locale]: { blocks: input.blocks as Prisma.JsonValue },
  };

  return prisma.page.update({
    where: { id: input.pageId },
    data: { translations: next as Prisma.InputJsonValue },
  });
}

export async function removeTranslation(input: RemoveTranslationInput) {
  const page = await prisma.page.findUnique({
    where: { id: input.pageId },
    select: { id: true, siteId: true, translations: true },
  });
  if (!page) throw new Error("NOT_FOUND");
  if (page.siteId !== input.siteId) throw new Error("SITE_MISMATCH");

  const existing = (page.translations ?? {}) as TranslationMap;
  if (!(input.locale in existing)) return page; // idempotent

  const next: TranslationMap = { ...existing };
  delete next[input.locale];

  return prisma.page.update({
    where: { id: input.pageId },
    data: {
      translations:
        Object.keys(next).length === 0 ? Prisma.JsonNull : (next as Prisma.InputJsonValue),
    },
  });
}
