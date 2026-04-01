import { z } from "zod";

export const createSiteSchema = z.object({
  name: z.string().min(2).max(100),
  method: z.enum(["blank", "template", "ai"]),
  templateId: z.string().optional(),
});

export const renameSiteSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
});

export const deleteSiteSchema = z.object({
  id: z.string(),
  confirmName: z.string(),
});

export const listSitesSchema = z.object({
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(50).default(12),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  sort: z
    .enum(["lastEdited", "name", "created", "traffic", "pages", "published"])
    .default("lastEdited"),
  search: z.string().optional(),
  folderId: z.string().nullable().optional(),
  createdBy: z.string().optional(),
  dateRange: z.enum(["7d", "30d", "90d"]).optional(),
  templateUsed: z.string().optional(),
  hasCustomDomain: z.boolean().optional(),
  hasTraffic: z.enum(["none", "1-100", "100-1000", "1000+"]).optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
});

export const bulkActionSchema = z.object({
  action: z.enum(["archive", "delete", "unarchive", "publish", "unpublish"]),
  siteIds: z.array(z.string()).min(1).max(25),
});

export const transferSiteSchema = z.object({
  siteId: z.string(),
  newOwnerId: z.string(),
});

export const checkSlugSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type ListSitesInput = z.infer<typeof listSitesSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
