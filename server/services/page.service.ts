import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeBlocks } from "@/lib/sanitize-blocks";
import type {
  SetTranslationInput,
  RemoveTranslationInput,
} from "@buildrik/shared/schemas/pages";

type TranslationMap = Record<string, { blocks: Prisma.JsonValue }>;

export async function listPages(siteId: string, db: Prisma.TransactionClient = prisma) {
  // Phase -1: full page hydration. BuildrikSyncProvider.loadProject expects
  // blocks/settings/slugHistory/meta/slugManuallySet for applied-template
  // state + slug-redirect history to survive reload.
  return db.page.findMany({
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
    // sources of truth — the project save (sites.saveProject) owns it.
    throw new Error("DEFAULT_LOCALE_USES_BLOCKS");
  }

  const existing = (page.translations ?? {}) as TranslationMap;
  const next: TranslationMap = {
    ...existing,
    [input.locale]: { blocks: sanitizeBlocks(input.blocks) as Prisma.JsonValue },
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
