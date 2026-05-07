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

/**
 * Page meta — forward-compatible Json column on Page.
 *
 * Currently models:
 *   - appliedTemplates: stack of templates ever applied to this page (latest at end)
 *
 * Persisted via sites.service.ts:saveProjectData → Page.meta column (Phase -1).
 * Editor reads via BuildrikSyncProvider.loadProject and surfaces in TemplatesTab
 * applied-template badge + future where-used drawer.
 *
 * Forward-compat: unknown keys passed through unchanged so older clients don't strip
 * fields written by newer clients.
 */
export const pageMetaSchema = z
  .object({
    appliedTemplates: z
      .array(
        z.object({
          templateId: z.string(),
          version: z.string().optional(),
          appliedAt: z.string(), // ISO date
        })
      )
      .optional(),
  })
  .passthrough();

export const pageSettingsSchema = z.unknown(); // shape owned by editor; forward-compat

/**
 * Slug-change history entry. Matches editor's `SlugChange` interface in
 * packages/editor/src/shared/types/project.ts. Each entry stores the prior
 * slug (the value being redirected FROM); the current slug is implicit
 * (`Page.slug`). Used to generate 301 redirects on publish.
 */
export const slugHistorySchema = z.array(
  z.object({
    slug: z.string(), // prior slug
    changedAt: z.string(), // ISO date
  })
);

export const saveProjectDataSchema = z.object({
  siteId: z.string(),
  pages: z.array(
    z.object({
      id: z.string(),
      blocks: z.unknown(),
      // Phase -1 additions: full page persistence for round-trip integrity.
      // All optional so older editor builds keep working.
      name: z.string().optional(),
      slug: z.string().optional(),
      isHomePage: z.boolean().optional(),
      position: z.number().optional(),
      seoTitle: z.string().optional().nullable(),
      seoDescription: z.string().optional().nullable(),
      meta: pageMetaSchema.optional().nullable(),
      settings: pageSettingsSchema.optional(),
      slugHistory: slugHistorySchema.optional().nullable(),
      slugManuallySet: z.boolean().optional(),
    })
  ),
  styles: z.unknown().optional(),
  assets: z.unknown().optional(),
  settings: z.unknown().optional(),
  dsSchemaVersion: z.number().int().min(0).optional(),
});

export const getProjectDataSchema = z.object({
  siteId: z.string(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type ListSitesInput = z.infer<typeof listSitesSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type SaveProjectDataInput = z.infer<typeof saveProjectDataSchema>;
