import { z } from "zod";
import { isDangerousUrl, isSafeElementId } from "./element-markup";

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
  // Agency layer (E2): filter to one client's sites; null = unassigned (solo) sites.
  clientId: z.string().nullable().optional(),
  createdBy: z.string().optional(),
  dateRange: z.enum(["7d", "30d", "90d"]).optional(),
  templateUsed: z.string().optional(),
  hasCustomDomain: z.boolean().optional(),
  hasTraffic: z.enum(["none", "1-100", "100-1000", "1000+"]).optional(),
});

export const createSiteFolderSchema = z.object({
  name: z.string().min(1).max(50),
});

// publish/unpublish are intentionally NOT bulk actions: a bulk status-flip
// bypasses the deploy pipeline (no build/teardown) and the approval gate, so it
// lies — the row says PUBLISHED while the live site never changes. Per-site
// publish goes through the real pipeline. See sites.service bulkAction.
export const bulkActionSchema = z.object({
  action: z.enum(["archive", "delete", "unarchive"]),
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

/* CMS bindings — which canvas element shows which collection field, and
   which element repeats per record. The shape Composer.exportProject() writes
   (`cmsBindings`: CMSBindingManager's export() / exportCollectionBindings()).
   Keys are element ids, so they get the element-id rule the sanitizer uses;
   counts are bounded because the whole map lands in one JSON column. */
const MAX_BOUND_ELEMENTS = 5000;
const MAX_BINDINGS_PER_ELEMENT = 50;
/** Largest "Show N" a collection list stores — the inspector clamps to it. */
export const CMS_COLLECTION_LIMIT_MAX = 10_000;
/** Serialized length (UTF-16 units, `JSON.stringify(...).length`) above
 *  which a save keeps its pages but not its bindings. */
export const MAX_CMS_BINDINGS_CHARS = 1_000_000;

/**
 * The element properties a CMS field binding may fill — SSOT for the save
 * schema and both sinks (CMSBindingManager on the canvas, CMSExportResolver on
 * the published page). A stored binding's `property` becomes an attribute
 * name, so anything else (`onmouseover`, `style`, …) is a stored XSS. The
 * editor itself emits only content/src/href (ContentSection `boundProperty`).
 */
export const CMS_BINDABLE_PROPERTIES = ["content", "src", "href", "alt", "title"] as const;
export type CmsBindableProperty = (typeof CMS_BINDABLE_PROPERTIES)[number];

/**
 * May `value` be written to `property` of a bound element? Only allowlisted
 * properties, and never a URL `isDangerousUrl` refuses into src/href. Values
 * resolve from CMS entries at render time, so the sinks call this on every
 * write — the save schema cannot see them.
 */
export function isSafeCmsBoundValue(property: string, value: string): property is CmsBindableProperty {
  if (!(CMS_BINDABLE_PROPERTIES as readonly string[]).includes(property)) return false;
  return !((property === "src" || property === "href") && isDangerousUrl(value));
}

const bindingElementId = z.string().max(128).refine(isSafeElementId, { message: "Invalid element id" });

const cmsFieldBindingSchema = z
  .object({
    binding: z.object({
      sourceId: z.string().max(300),
      path: z.string().max(500),
      type: z.string().max(32),
    }),
    collectionId: z.string().max(200),
    itemId: z.string().max(200).optional(),
    fieldSlug: z.string().max(200),
    property: z.enum(CMS_BINDABLE_PROPERTIES),
    fallback: z.string().max(10_000).optional(),
  })
  .refine((b) => b.fallback === undefined || isSafeCmsBoundValue(b.property, b.fallback), {
    message: "Unsafe fallback URL",
  });

const cmsCollectionBindingSchema = z.object({
  elementId: bindingElementId,
  collectionId: z.string().max(200),
  itemVar: z.string().max(64),
  indexVar: z.string().max(64).optional(),
  limit: z.number().int().min(0).max(CMS_COLLECTION_LIMIT_MAX).optional(),
  status: z.enum(["published", "draft", "all"]).optional(),
  repeat: z.enum(["self", "children"]).optional(),
});

const boundedRecord = <T extends z.ZodTypeAny>(value: T) =>
  z
    .record(bindingElementId, value)
    .refine((r) => Object.keys(r).length <= MAX_BOUND_ELEMENTS, { message: "Too many bound elements" });

const cmsBindingsShape = z.object({
  field: boundedRecord(z.array(cmsFieldBindingSchema).max(MAX_BINDINGS_PER_ELEMENT)).optional(),
  collection: boundedRecord(cmsCollectionBindingSchema).optional(),
});
export type CmsBindingsInput = z.infer<typeof cmsBindingsShape>;

const isPlainRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/** The well-formed entries of an element-id-keyed record, capped in count. */
function keepEntries<V>(raw: unknown, keep: (value: unknown) => V | null): Record<string, V> | undefined {
  if (!isPlainRecord(raw)) return undefined;
  const out: Record<string, V> = {};
  let count = 0;
  for (const [id, value] of Object.entries(raw)) {
    if (count >= MAX_BOUND_ELEMENTS) break;
    if (!bindingElementId.safeParse(id).success) continue;
    const kept = keep(value);
    if (kept === null) continue;
    out[id] = kept;
    count += 1;
  }
  return out;
}

/**
 * Only the well-formed binding entries — one bad entry (an out-of-range
 * limit, an unsafe element id, a malformed field binding) is dropped on its
 * own, the way `sanitizeProjectStyles` drops a bad rule, instead of failing
 * the whole save and losing the pages with it. Anything that is not a
 * bindings object reads as "none sent". Also the read filter for a stored
 * value (`duplicateSite`).
 */
export function filterCmsBindings(raw: unknown): CmsBindingsInput | undefined {
  if (!isPlainRecord(raw)) return undefined;
  const field = keepEntries(raw.field, (list) => {
    if (!Array.isArray(list)) return null;
    const kept = list
      .slice(0, MAX_BINDINGS_PER_ELEMENT)
      .flatMap((b) => {
        const parsed = cmsFieldBindingSchema.safeParse(b);
        return parsed.success ? [parsed.data] : [];
      });
    return kept.length > 0 ? kept : null;
  });
  const collection = keepEntries(raw.collection, (b) => {
    const parsed = cmsCollectionBindingSchema.safeParse(b);
    return parsed.success ? parsed.data : null;
  });
  return {
    ...(field ? { field } : {}),
    ...(collection ? { collection } : {}),
  };
}

/** The save-side shape: lenient per entry (see filterCmsBindings), never a
 *  reason to refuse a save. */
export const cmsBindingsSchema = z.preprocess(filterCmsBindings, cmsBindingsShape.optional());

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
  cmsBindings: cmsBindingsSchema.optional(),
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
  // 61-conflict: optimistic-concurrency token. The editor sends the site's
  // lastEditedAt it loaded (or last saved). If it no longer matches the server's,
  // the copy is behind — the server rejects with CONFLICT instead of clobbering.
  // Omitted (older callers / first save) = no check, so this is non-regressive.
  expectedLastEditedAt: z.string().datetime().nullish(),
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
    /* The DS project-migration version. saveProjectFromEditor has always
       forwarded it, but this schema stripped it, so the editor's save never
       reached Site.dsSchemaVersion and the migration re-ran on every open
       (walk A2, 2026-09-24). */
    dsSchemaVersion: z.number().int().min(0).optional(),
    /* Stripped here like dsSchemaVersion was: Composer.exportProject() has
       written it since bindings were made to round-trip, but the save dropped
       it, so every server reload unbound every element (Ldata bug B). */
    cmsBindings: cmsBindingsSchema.optional(),
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
