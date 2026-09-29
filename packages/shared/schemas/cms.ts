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
  expectedUpdatedAt: z.string().datetime().nullable().optional(),
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
  expectedUpdatedAt: z.string().datetime().nullable().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});
export type UpsertEntryInput = z.infer<typeof upsertEntryInput>;

export const listEntriesInput = z.object({ siteId: z.string().min(1), collectionId: z.string().min(1) });

export const deleteEntryInput = z.object({ siteId: z.string().min(1), id: z.string().min(1) });

// ── CSV import (fix-all round, 2026-09-25 — decision: "build CSV import now") ─
// Upload → preview → map columns → create records, entirely server-side
// (Page → tRPC → Router → Service → Prisma): the raw CSV text is parsed and
// validated on the server, never in the browser, so size/row caps and
// sanitization are enforced at one boundary regardless of client.
export const CSV_IMPORT_MAX_BYTES = 300_000; // ~300KB of CSV text
export const CSV_IMPORT_MAX_ROWS = 500; // data rows, header excluded
export const CSV_IMPORT_MAX_COLUMNS = 100; // header cells — a pathological wide file shouldn't cost O(columns) per row for nothing a real collection needs
export const CSV_IMPORT_MAX_CELL_LENGTH = 5_000; // characters per cell — big enough for a real field value, small enough that one cell can't eat the whole byte budget

export const previewCsvEntriesInput = z.object({
  siteId: z.string().min(1),
  collectionId: z.string().min(1),
  csv: z.string().min(1).max(CSV_IMPORT_MAX_BYTES),
});
export type PreviewCsvEntriesInput = z.infer<typeof previewCsvEntriesInput>;

export const importCsvEntriesInput = z.object({
  siteId: z.string().min(1),
  collectionId: z.string().min(1),
  csv: z.string().min(1).max(CSV_IMPORT_MAX_BYTES),
  // fieldSlug -> CSV column header. A field left unmapped (or mapped to a
  // header the file doesn't have) is skipped for every row.
  columnMapping: z.record(z.string(), z.string().min(1)),
});
export type ImportCsvEntriesInput = z.infer<typeof importCsvEntriesInput>;

// C0.1 server half: the publish worker asks the server for the live CMS rows
// (and site fonts) it should render against, instead of trusting whatever the
// editor exported. The collectionIds are the collections the project's
// current CMS bindings point at.
export const publishSnapshotInput = z.object({
  siteId: z.string().min(1),
  collectionIds: z.array(z.string().min(1)).max(500),
});
export type PublishSnapshotInput = z.infer<typeof publishSnapshotInput>;
