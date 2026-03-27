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
  blocks: z.any().optional(),
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

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
