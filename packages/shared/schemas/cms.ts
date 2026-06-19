import { z } from "zod";

/**
 * CMS server persistence (redesign E7). SSOT for the collection/entry payloads.
 * The editor owns the rich field shape (engine src/shared/types/cms.ts); the
 * server stores `fields` and entry `data` as opaque JSON so the editor can
 * round-trip its own structures without the server re-validating their internals.
 */
const cmsField = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    slug: z.string().min(1),
    type: z.string(),
    order: z.number(),
  })
  .passthrough();

export const upsertCollectionInput = z.object({
  id: z.string().optional(),
  siteId: z.string().min(1),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  displayField: z.string().nullable().optional(),
  fields: z.array(cmsField).default([]),
  // Dynamic-page binding + pattern SEO (set pageSlugPattern to generate one page
  // per entry; {fieldSlug} placeholders resolve against each entry's data).
  pageSlugPattern: z.string().max(200).nullable().optional(),
  pageSeoTitle: z.string().max(200).nullable().optional(),
  pageSeoDescription: z.string().max(400).nullable().optional(),
  pageTemplatePath: z.string().max(500).nullable().optional(),
});
export type UpsertCollectionInput = z.infer<typeof upsertCollectionInput>;

export const listCollectionsInput = z.object({ siteId: z.string().min(1) });

export const dynamicPagesInput = z.object({ siteId: z.string().min(1), collectionId: z.string().min(1) });

export const generateDynamicPagesInput = z.object({
  siteId: z.string().min(1),
  collectionId: z.string().min(1),
  templateHtml: z.string().max(2_000_000),
});

export const deleteCollectionInput = z.object({ siteId: z.string().min(1), id: z.string().min(1) });

export const upsertEntryInput = z.object({
  id: z.string().optional(),
  siteId: z.string().min(1),
  collectionId: z.string().min(1),
  data: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});
export type UpsertEntryInput = z.infer<typeof upsertEntryInput>;

export const listEntriesInput = z.object({ siteId: z.string().min(1), collectionId: z.string().min(1) });

export const deleteEntryInput = z.object({ siteId: z.string().min(1), id: z.string().min(1) });
