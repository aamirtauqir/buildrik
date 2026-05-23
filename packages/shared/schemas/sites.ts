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

export const createSiteFolderSchema = z.object({
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

/**
 * Page SEO metadata — mirrors editor's `PageSEO` interface in
 * packages/editor/src/shared/types/project.ts. All fields optional;
 * structuredData passes through as a free-form record so JSON-LD
 * payloads survive validation without us pinning their shape.
 */
export const pageSeoSchema = z
  .object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    twitterCard: z.enum(["summary", "summary_large_image"]).optional(),
    twitterTitle: z.string().optional(),
    twitterDescription: z.string().optional(),
    twitterImage: z.string().optional(),
    noIndex: z.boolean().optional(),
    noFollow: z.boolean().optional(),
    canonicalUrl: z.string().optional(),
    structuredData: z.record(z.unknown()).optional(),
  })
  .passthrough();

/**
 * Per-page settings — mirrors editor's `PageSettings` interface in
 * packages/editor/src/shared/types/project.ts. Was `z.unknown()` —
 * Codex shared P2 audit flagged the unshaped contract field. Now
 * shaped with passthrough so unknown future keys still round-trip.
 */
export const pageSettingsSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    head: z.string().optional(),
    seo: pageSeoSchema.optional(),
    visibility: z.enum(["live", "hidden", "password"]).optional(),
    password: z.string().optional(),
  })
  .passthrough();

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

/**
 * sites.saveProject — the EDITOR-side save path used by
 * BuildrikSyncProvider.saveProject. Distinct from saveProjectDataSchema
 * above which the dashboard's saveProjectData uses. Codex shared P1
 * 2026-05-22: editor schema was inlined in routers/sites.ts with z.any()
 * blobs and bypassed shared entirely — every editor save could drift
 * silently. Extracted as-is here so shared is now the source of truth.
 *
 * Field shape uses `root` (engine element tree) rather than the
 * dashboard-side `blocks` field, matching Page.blocks column rename
 * Prisma does in saveProjectFromEditor service.
 */
export const editorSaveProjectSchema = z.object({
  siteId: z.string(),
  projectData: z.object({
    version: z.string(),
    pages: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string().optional(),
        isHome: z.boolean().optional(),
        root: z.unknown(),
        styles: z.unknown().optional(),
        settings: z.unknown().optional(),
        meta: z.unknown().optional(),
        slugHistory: z.unknown().optional(),
        slugManuallySet: z.boolean().optional(),
        seoTitle: z.string().nullable().optional(),
        seoDescription: z.string().nullable().optional(),
      })
    ),
    styles: z.array(z.unknown()),
    assets: z.array(z.unknown()),
    metadata: z.unknown().optional(),
    settings: z.unknown().optional(),
  }),
});

export const getProjectDataSchema = z.object({
  siteId: z.string(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type ListSitesInput = z.infer<typeof listSitesSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type SaveProjectDataInput = z.infer<typeof saveProjectDataSchema>;
export type EditorSaveProjectInput = z.infer<typeof editorSaveProjectSchema>;
