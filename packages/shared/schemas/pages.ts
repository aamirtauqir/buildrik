import { z } from "zod";

export const createPageSchema = z.object({
  siteId: z.string(),
  name: z.string().min(1).max(100),
  slug: z.string().optional(),
  position: z.number().optional(),
  isHomePage: z.boolean().optional(),
});

export const updatePageSchema = z.object({
  pageId: z.string(),
  siteId: z.string(),
  name: z.string().min(1).max(100).optional(),
  slug: z.string().max(100).optional(),
  blocks: z.unknown().optional(),
  position: z.number().optional(),
  isHomePage: z.boolean().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  updatedAt: z.date().optional(),
});

export const deletePageSchema = z.object({
  pageId: z.string(),
  siteId: z.string(),
});

// Locale string shape mirrors packages/shared/schemas/site-detail.ts (defaultLocale/enabledLocales).
// BCP-47 friendly: "en", "fr-FR", "zh-Hant".
const localeString = z.string().min(2).max(10);

export const getTranslationSchema = z.object({
  pageId: z.string(),
  locale: localeString,
});

export const setTranslationSchema = z.object({
  pageId: z.string(),
  siteId: z.string(),
  locale: localeString,
  blocks: z.unknown(),
});

export const removeTranslationSchema = z.object({
  pageId: z.string(),
  siteId: z.string(),
  locale: localeString,
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type GetTranslationInput = z.infer<typeof getTranslationSchema>;
export type SetTranslationInput = z.infer<typeof setTranslationSchema>;
export type RemoveTranslationInput = z.infer<typeof removeTranslationSchema>;
