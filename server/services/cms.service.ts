import DOMPurify from "isomorphic-dompurify";
import { prisma } from "@/lib/prisma";
import { parseCsvText } from "@/lib/csv";
import { sanitizeGeneratedPageHtml } from "@/lib/sanitize-blocks";
import type { Prisma } from "@prisma/client";
import type {
  UpsertCollectionInput,
  UpsertEntryInput,
} from "@buildrik/shared/schemas/cms";
import { CSV_IMPORT_MAX_ROWS, CSV_IMPORT_MAX_COLUMNS, CSV_IMPORT_MAX_CELL_LENGTH } from "@buildrik/shared/schemas/cms";
import { insertBeforeHeadClose } from "@/lib/publish-html";
import { escapeHtmlText } from "@buildrik/shared/schemas/element-markup";
import { CMS_COLLECTION_LIMIT_MAX, filterCmsBindings } from "@buildrik/shared/schemas/sites";

/**
 * CMS server persistence (E7) — the ONLY layer that reads/writes cms_collections
 * + cms_entries. Everything is scoped by siteId (the router authorizes site
 * access first); entry ops additionally confirm the collection belongs to the
 * site, so a crafted collectionId can't reach another site's CMS.
 */

export class CmsError extends Error {
  constructor(
    public code: "NOT_FOUND" | "BAD_REQUEST" | "CONFLICT" | "GONE",
    message: string,
  ) {
    super(message);
    this.name = "CmsError";
  }
}

/**
 * Defense-in-depth at the write boundary (audit S-1 class: "some stores never
 * sanitized on the server"). Entry `data` is opaque JSON supplied by the
 * client; every string value is run through the same DOMPurify sanitizer
 * `lib/sanitize-blocks.ts` uses for page blocks. Applied by `upsertEntry`, so
 * every write path (manual save, CSV import, any future importer) shares it.
 *
 * This strips MARKUP only (tags/attributes an HTML parser would honor) and
 * stores the remaining text raw; every sink escapes it (`escapeHtmlText`) — it
 * does nothing about a plain-text value like `javascript:alert(1)` (no tags,
 * nothing for DOMPurify to remove) that later lands in a URL-bearing
 * attribute at template-substitution time. That is a different threat with a
 * different fix location: the scheme check lives at the SUBSTITUTION SINK
 * (`substituteOutsideScriptStyle`, below), which is where untrusted text
 * meets an attribute an HTML parser will navigate/load — not here at write
 * time, and not by guessing which fields are "URL fields" up front.
 */
function sanitizeEntryData(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = typeof value === "string" ? stripMarkup(value) : value;
  }
  return out;
}

/**
 * The text of `value` with its markup removed, NOT serialized HTML: the
 * serialized form entity-encoded the text ("Tom & Jerry" stored as
 * "Tom &amp; Jerry"), the page sink escaped it again, and every save encoded
 * it once more. `&` is escaped before parsing so nothing reads as an entity —
 * the text comes back exactly as typed. Escaping belongs to the sink.
 *
 * Repeated until nothing changes: cutting a tag out of the middle of another
 * (`<<img …>img …>`) leaves text that is itself a tag. Unbounded by design —
 * each changing pass strictly shortens the text (DOMPurify only ever removes
 * a tag's markup characters, never adds any, and the `&`-escape means it
 * never reintroduces one via entity decoding), so this always terminates. A
 * fixed iteration cap here would fail OPEN instead: a payload built by
 * repeatedly re-escaping `<` (e.g. `<img src=x onerror=alert(1)>` wrapped as
 * `<<<...<img…>...i>i>i>` N times) can still contain live markup after N
 * passes, and a cap would hand that back untouched. As a fail-closed
 * backstop for a parser disagreement the loop cannot see, a converged result
 * that still holds a tag opener (`<` followed by a letter, `!`, `/` or `?`)
 * loses every angle bracket. A bare `<` or `>` is never markup, so ordinary
 * text ("5 < 10", "a -> b", "<3") comes back exactly as typed.
 */
function stripMarkup(value: string): string {
  let text = value;
  for (;;) {
    const fragment = DOMPurify.sanitize(text.replace(/&/g, "&amp;"), { ALLOWED_TAGS: [], RETURN_DOM_FRAGMENT: true });
    const next = fragment.textContent ?? "";
    if (next === text) break;
    text = next;
  }
  return /<[a-z!/?]/i.test(text) ? text.replace(/[<>]/g, "") : text;
}

export async function listCollections(siteId: string) {
  const rows = await prisma.cmsCollection.findMany({
    where: { siteId, deletedAt: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { entries: true } } },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, entryCount: _count.entries }));
}

/**
 * Mark the site as having unpublished CMS changes. Called after EVERY
 * successful CMS mutation (collection upsert/delete, entry upsert/delete,
 * CSV import). The publish-approval gate + the editor's publish state read
 * this so a CMS-only edit invalidates stale approvals and shows "unpublished
 * changes" in the editor — distinct from `lastEditedAt`, which the editor's
 * own page writes bump.
 *
 * Fire-and-log on its own error: a successful CMS write has already
 * committed, and an out-of-band bump failure must not roll the mutation
 * back. The "unpublished changes" signal will still catch up on the next
 * write.
 */
async function touchCmsEdited(siteId: string): Promise<void> {
  try {
    await prisma.site.update({
      where: { id: siteId },
      data: { cmsEditedAt: new Date() },
    });
  } catch (err) {
    console.error("[cms] touchCmsEdited failed for site", siteId, err);
  }
}

/**
 * Precondition guard: the caller's last-seen `updatedAt` must match what's in
 * the DB, or the row has been edited underneath them (CONFLICT — return the
 * current value so the client can show "someone else saved, reload?"). When
 * the caller didn't supply a precondition (`expectedUpdatedAt` undefined) the
 * check is skipped — a deliberate opt-out, NOT a default. Skipping on null
 * too: the editor's first-time save after a reset wipes the optimistic value.
 */
async function assertFresh(
  table: "cmsCollection" | "cmsEntry",
  where: Record<string, unknown>,
  expectedUpdatedAt: string | null | undefined,
): Promise<Date> {
  if (expectedUpdatedAt === undefined) return new Date(0);
  const row = await (prisma[table].findFirst as (args: unknown) => Promise<{ updatedAt: Date } | null>)({
    where,
    select: { updatedAt: true },
  });
  if (!row) throw new CmsError("NOT_FOUND", "Row not found");
  const expected = expectedUpdatedAt === null ? null : new Date(expectedUpdatedAt);
  if (expected && row.updatedAt.getTime() !== expected.getTime()) {
    throw new CmsError("CONFLICT", row.updatedAt.toISOString());
  }
  return expected ?? row.updatedAt;
}

export async function upsertCollection(siteId: string, input: UpsertCollectionInput) {
  /* The home page is index.html; a collection bound to it would emit
     {field} tokens at the site root (BD-04). The picker (DynamicPagesPane)
     hides it too — refuse here as a defence in depth. */
  if (input.pageTemplatePath === "index.html") {
    throw new CmsError("BAD_REQUEST", "The home page can't be a collection template. Pick another page.");
  }
  const data = {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    icon: input.icon ?? null,
    displayField: input.displayField ?? null,
    fields: input.fields as unknown as Prisma.InputJsonValue,
    pageSlugPattern: input.pageSlugPattern ?? null,
    pageSeoTitle: input.pageSeoTitle ?? null,
    pageSeoDescription: input.pageSeoDescription ?? null,
    pageTemplatePath: input.pageTemplatePath ?? null,
  };
  if (input.id) {
    // Upsert by the editor-supplied id (engine collection id = DB id, so the
    // first sync creates and later syncs update). Reject only a real cross-site
    // collision — a row with this id already owned by a DIFFERENT site.
    const existing = await prisma.cmsCollection.findUnique({
      where: { id: input.id },
      select: { siteId: true, deletedAt: true },
    });
    if (existing && existing.siteId !== siteId) throw new CmsError("NOT_FOUND", "Collection not found");
    if (existing?.deletedAt) throw new CmsError("GONE", "This collection was deleted.");
    if (existing) {
      await assertFresh(
        "cmsCollection",
        { id: input.id },
        input.expectedUpdatedAt,
      );
      // Conditional update: WHERE updatedAt = expected AND deletedAt IS NULL — if
      // another writer slipped in between assertFresh and here, or the row was
      // tombstoned concurrently, count is 0 and we throw CONFLICT/GONE. Carrying
      // `deletedAt: null` into the SQL is the P0-C fix — without it, an
      // unconditional updateMany with `expected === null` would silently resurrect
      // a soft-deleted row (audit 2026-09-30).
      const expected = input.expectedUpdatedAt ? new Date(input.expectedUpdatedAt) : null;
      const result = await prisma.cmsCollection.updateMany({
        where: expected
          ? { id: input.id, updatedAt: expected, deletedAt: null }
          : { id: input.id, deletedAt: null },
        data,
      });
      if (result.count === 0) {
        const fresh = await prisma.cmsCollection.findUnique({ where: { id: input.id }, select: { updatedAt: true, deletedAt: true } });
        if (fresh?.deletedAt) throw new CmsError("GONE", "This collection was deleted.");
        throw new CmsError("CONFLICT", fresh?.updatedAt.toISOString() ?? new Date().toISOString());
      }
      await touchCmsEdited(siteId);
      return prisma.cmsCollection.findUnique({ where: { id: input.id } });
    }
    const created = await prisma.cmsCollection.create({ data: { id: input.id, siteId, ...data } });
    await touchCmsEdited(siteId);
    return created;
  }
  const created = await prisma.cmsCollection.create({ data: { siteId, ...data } });
  await touchCmsEdited(siteId);
  return created;
}

export async function deleteCollection(siteId: string, id: string): Promise<void> {
  const owned = await prisma.cmsCollection.findFirst({
    where: { id, siteId, deletedAt: null },
    select: { id: true, slug: true },
  });
  if (!owned) throw new CmsError("NOT_FOUND", "Collection not found");
  const now = new Date();
  await prisma.$transaction([
    prisma.cmsEntry.updateMany({ where: { collectionId: id, deletedAt: null }, data: { deletedAt: now } }),
    prisma.cmsCollection.update({
      where: { id },
      data: { deletedAt: now, slug: `${owned.slug}~deleted~${id}` },
    }),
  ]);
  await touchCmsEdited(siteId);
}

// Confirm the collection is in this site before any entry op — entries key on
// collectionId alone, so this is the cross-site guard.
async function assertCollectionInSite(siteId: string, collectionId: string): Promise<void> {
  const owned = await prisma.cmsCollection.findFirst({
    where: { id: collectionId, siteId, deletedAt: null },
    select: { id: true },
  });
  if (!owned) throw new CmsError("NOT_FOUND", "Collection not found");
}

export async function listEntries(siteId: string, collectionId: string) {
  await assertCollectionInSite(siteId, collectionId);
  return prisma.cmsEntry.findMany({
    where: { collectionId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}

export async function upsertEntry(siteId: string, input: UpsertEntryInput) {
  /* A write into a DELETED collection is GONE, not NOT_FOUND: the client
     drops a GONE row, while NOT_FOUND is just a failure it retries forever —
     a permanent "didn't sync" notice and a blocked publish on the device that
     still held the collection (C0a live run, 2026-10-02). */
  const collection = await prisma.cmsCollection.findFirst({
    where: { id: input.collectionId, siteId },
    select: { deletedAt: true },
  });
  if (!collection) throw new CmsError("NOT_FOUND", "Collection not found");
  if (collection.deletedAt) throw new CmsError("GONE", "This collection was deleted.");
  const data = {
    data: sanitizeEntryData(input.data) as unknown as Prisma.InputJsonValue,
    ...(input.status ? { status: input.status } : {}),
  };
  // CSV import loops upsertEntry; skip the per-row bump and let the
  // importer touch cmsEditedAt once at the end.
  const bump = input._skipTouchCmsEdited !== true;
  if (input.id) {
    const existing = await prisma.cmsEntry.findUnique({
      where: { id: input.id },
      select: { deletedAt: true, collection: { select: { siteId: true } } },
    });
    if (existing && existing.collection.siteId !== siteId) throw new CmsError("NOT_FOUND", "Entry not found");
    if (existing?.deletedAt) throw new CmsError("GONE", "This record was deleted.");
    if (existing) {
      await assertFresh(
        "cmsEntry",
        { id: input.id },
        input.expectedUpdatedAt,
      );
      const expected = input.expectedUpdatedAt ? new Date(input.expectedUpdatedAt) : null;
      const result = await prisma.cmsEntry.updateMany({
        where: expected
          ? { id: input.id, updatedAt: expected, deletedAt: null }
          : { id: input.id, deletedAt: null },
        data,
      });
      if (result.count === 0) {
        const fresh = await prisma.cmsEntry.findUnique({ where: { id: input.id }, select: { updatedAt: true, deletedAt: true } });
        if (fresh?.deletedAt) throw new CmsError("GONE", "This record was deleted.");
        throw new CmsError("CONFLICT", fresh?.updatedAt.toISOString() ?? new Date().toISOString());
      }
      if (bump) await touchCmsEdited(siteId);
      return prisma.cmsEntry.findUnique({ where: { id: input.id } });
    }
    const created = await prisma.cmsEntry.create({ data: { id: input.id, collectionId: input.collectionId, ...data } });
    if (bump) await touchCmsEdited(siteId);
    return created;
  }
  const created = await prisma.cmsEntry.create({ data: { collectionId: input.collectionId, ...data } });
  if (bump) await touchCmsEdited(siteId);
  return created;
}

export async function deleteEntry(siteId: string, id: string): Promise<void> {
  const owned = await prisma.cmsEntry.findFirst({
    where: { id, deletedAt: null, collection: { siteId } },
    select: { id: true },
  });
  if (!owned) throw new CmsError("NOT_FOUND", "Entry not found");
  await prisma.cmsEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  await touchCmsEdited(siteId);
}

// ── CSV import ────────────────────────────────────────────────────────────
// Server-side parsing + validation: the client only reads the file as text
// and posts it, never parses it. `previewCsvImport` and `importCsvEntries`
// both re-parse the raw CSV rather than trust a client-computed row count, so
// the size/row caps are enforced against what the server itself decodes.

interface CmsFieldShape {
  slug: string;
  name: string;
}

async function loadCollectionFields(siteId: string, collectionId: string): Promise<CmsFieldShape[]> {
  const col = await prisma.cmsCollection.findFirst({
    where: { id: collectionId, siteId, deletedAt: null },
    select: { fields: true },
  });
  if (!col) throw new CmsError("NOT_FOUND", "Collection not found");
  const fields = col.fields as unknown;
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((f): f is CmsFieldShape => !!f && typeof f === "object" && typeof (f as CmsFieldShape).slug === "string")
    .map((f) => ({ slug: f.slug, name: typeof (f as { name?: unknown }).name === "string" ? (f as { name: string }).name : f.slug }));
}

function parseAndCapCsv(csv: string): { headers: string[]; dataRows: string[][] } {
  const rows = parseCsvText(csv).filter((r) => !(r.length === 1 && r[0] === ""));
  if (rows.length === 0) throw new CmsError("BAD_REQUEST", "This file has no rows.");
  const [headers, ...dataRows] = rows;
  if (headers.every((h) => h.trim() === "")) throw new CmsError("BAD_REQUEST", "This file has no header row.");
  if (dataRows.length === 0) throw new CmsError("BAD_REQUEST", "This file has a header row but no data.");
  if (dataRows.length > CSV_IMPORT_MAX_ROWS) {
    throw new CmsError("BAD_REQUEST", `This file has ${dataRows.length} rows — the limit is ${CSV_IMPORT_MAX_ROWS}.`);
  }
  if (headers.length > CSV_IMPORT_MAX_COLUMNS) {
    throw new CmsError("BAD_REQUEST", `This file has ${headers.length} columns — the limit is ${CSV_IMPORT_MAX_COLUMNS}.`);
  }
  for (const row of [headers, ...dataRows]) {
    for (const cell of row) {
      if (cell.length > CSV_IMPORT_MAX_CELL_LENGTH) {
        throw new CmsError("BAD_REQUEST", `A cell is longer than ${CSV_IMPORT_MAX_CELL_LENGTH} characters — split this file up.`);
      }
    }
  }
  return { headers, dataRows };
}

/** Case-insensitive match of a collection field to a CSV header, by slug or
 *  by name — the same rule `parseRecordsJson` (JSON import) uses on the
 *  client, kept in step so the two importers read the same way. */
function suggestColumnMapping(fields: CmsFieldShape[], headers: string[]): Record<string, string> {
  const headerByKey = new Map<string, string>();
  for (const h of headers) {
    headerByKey.set(h.trim().toLowerCase(), h);
  }
  const mapping: Record<string, string> = {};
  for (const f of fields) {
    const header = headerByKey.get(f.slug.toLowerCase()) ?? headerByKey.get(f.name.toLowerCase());
    if (header) mapping[f.slug] = header;
  }
  return mapping;
}

export interface CsvImportPreview {
  headers: string[];
  totalRows: number;
  /** First few data rows, keyed by header, for the mapping screen. */
  sampleRows: Array<Record<string, string>>;
  /** fieldSlug -> CSV header, guessed by matching field slug/name to a header. */
  suggestedMapping: Record<string, string>;
}

const CSV_PREVIEW_SAMPLE_ROWS = 5;

export async function previewCsvImport(siteId: string, collectionId: string, csv: string): Promise<CsvImportPreview> {
  const fields = await loadCollectionFields(siteId, collectionId);
  const { headers, dataRows } = parseAndCapCsv(csv);
  const sampleRows = dataRows.slice(0, CSV_PREVIEW_SAMPLE_ROWS).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = row[i] ?? "";
    });
    return record;
  });
  return { headers, totalRows: dataRows.length, sampleRows, suggestedMapping: suggestColumnMapping(fields, headers) };
}

export interface CsvImportRowError {
  row: number; // 1-based, header excluded (row 1 = first data row)
  message: string;
}

export interface CsvImportResult {
  imported: number;
  total: number;
  errors: CsvImportRowError[];
}

/**
 * Create one entry per CSV data row, mapped by `columnMapping`
 * (fieldSlug -> CSV header) and written through `upsertEntry` — the exact
 * write manual "Add record" uses, so sanitization/validation stay in one
 * place. A row that fails to write is reported by its 1-based position and
 * the rest of the file still imports (partial success, like JSON import).
 */
export async function importCsvEntries(
  siteId: string,
  collectionId: string,
  csv: string,
  columnMapping: Record<string, string>,
): Promise<CsvImportResult> {
  await assertCollectionInSite(siteId, collectionId);
  const { headers, dataRows } = parseAndCapCsv(csv);
  const columnIndex = new Map(headers.map((h, i) => [h, i]));
  const mappedFields = Object.entries(columnMapping).filter(([, header]) => columnIndex.has(header));

  let imported = 0;
  const errors: CsvImportRowError[] = [];
  for (const [i, row] of dataRows.entries()) {
    const rowNumber = i + 1;
    const data: Record<string, unknown> = {};
    for (const [fieldSlug, header] of mappedFields) {
      const value = row[columnIndex.get(header)!];
      if (value !== undefined && value !== "") data[fieldSlug] = value;
    }
    if (Object.keys(data).length === 0) {
      errors.push({ row: rowNumber, message: "No mapped column had a value" });
      continue;
    }
    try {
      await upsertEntry(siteId, { siteId, collectionId, data, _skipTouchCmsEdited: true });
      imported += 1;
    } catch (e) {
      errors.push({ row: rowNumber, message: e instanceof Error ? e.message : "Could not be saved" });
    }
  }
  if (imported > 0) await touchCmsEdited(siteId);
  return { imported, total: dataRows.length, errors };
}

// ── Dynamic pages (E7) ──────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Replace {fieldSlug} placeholders with each entry's values. slug patterns
// slugify the substituted value; SEO patterns keep it human-readable.
function applyPattern(pattern: string, data: Record<string, unknown>, asSlug: boolean): string {
  return pattern.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_m, key: string) => {
    const v = data[key];
    const s = v == null ? "" : String(v);
    return asSlug ? slugify(s) : s;
  });
}

export interface DynamicPage {
  entryId: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
}

/**
 * Page-generating collections whose bound template page is missing from the
 * site's CURRENT pages — a stale binding (the template page was deleted or
 * renamed since the collection was configured). Used by
 * `runPrePublishChecks` to surface the miss as a visible warning BEFORE
 * publish, instead of the deploy silently shipping without those pages
 * (see `appendDynamicPagesToPublish`, which is the authoritative,
 * publish-time check against the actual rendered export paths).
 *
 * Matches by the same filename shape the exporter's `pageFileNames` assigns
 * (`${slug}.html`, `index.html` for the home page) — slug is unique per
 * site (`@@unique([siteId, slug])`), so this reproduces the exporter's
 * naming without duplicating its de-duplication logic.
 */
export interface StaleTemplateBindingsResult {
  /** True when the site has at least one page-generating collection — lets a
   *  caller distinguish "nothing to check" from "checked, none stale"
   * (a pre-publish check that always shows a
   *  "pass" row is noise for the near-all-sites-have-no-CMS-collection case). */
  hasPageGeneratingCollections: boolean;
  stale: { collectionId: string; collectionName: string; templatePath: string }[];
  /** Existing template pages that leave the publish (appendDynamicPagesToPublish
   *  drops them — they are blueprints). index.html is not listed: it stays. */
  templates: { collectionName: string; pageName: string }[];
}

export async function findStaleTemplateBindings(
  siteId: string,
  pages: { slug: string; isHomePage: boolean; name?: string }[],
): Promise<StaleTemplateBindingsResult> {
  const cols = await prisma.cmsCollection.findMany({
    where: { siteId, deletedAt: null, pageSlugPattern: { not: null }, pageTemplatePath: { not: null } },
    select: { id: true, name: true, pageTemplatePath: true },
  });
  if (cols.length === 0) return { hasPageGeneratingCollections: false, stale: [], templates: [] };
  const byFile = new Map(pages.map((p) => [p.isHomePage ? "index.html" : `${p.slug}.html`, p]));
  const stale = cols
    .filter((c) => !byFile.has(c.pageTemplatePath as string))
    .map((c) => ({ collectionId: c.id, collectionName: c.name, templatePath: c.pageTemplatePath as string }));
  const templates = cols.flatMap((c) => {
    const page = c.pageTemplatePath === "index.html" ? undefined : byFile.get(c.pageTemplatePath as string);
    return page ? [{ collectionName: c.name, pageName: page.name ?? page.slug }] : [];
  });
  return { hasPageGeneratingCollections: true, stale, templates };
}

/** A bound element that publishes with no value from its record (C0.7). */
export interface EmptyBinding {
  pageName: string;
  /** The Layers name, or the element type. */
  element: string;
  collectionName: string;
  fieldSlug: string;
  /** What publishes instead — absent means nothing. */
  fallback?: string;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface BoundNode {
  id?: string;
  type?: string;
  data?: { layerName?: unknown } | null;
  children?: BoundNode[];
}

/**
 * Bound elements on the pages that ship whose record gives them no value —
 * null when the site binds no element at all —
 * what CMSExportResolver writes as the binding's fallback, or as nothing
 * (BD-03). Read by `runPrePublishChecks` so the user sees the list before the
 * publish, not on the live site.
 *
 * Mirrors the export's resolution over the server's PUBLISHED rows — the rows
 * the publish renders from (C0.1): a binding with a record id reads that
 * record; one without reads the newest published record, except where the
 * record is filled per record and so cannot be judged once — on its
 * collection's template page, and inside a Collection list of the same
 * collection ("current item", C0.8).
 */
export async function findEmptyBindings(
  siteId: string,
  pages: { name: string; slug: string; isHomePage: boolean; blocks: unknown }[],
  rawBindings: unknown,
): Promise<EmptyBinding[] | null> {
  const bindings = filterCmsBindings(rawBindings);
  const fieldMap = bindings?.field ?? {};
  if (Object.keys(fieldMap).length === 0) return null;
  const lists = new Map(
    Object.entries(bindings?.collection ?? {})
      .filter(([, b]) => b.repeat === "children")
      .map(([id, b]) => [id, b.collectionId]),
  );
  const collectionIds = [...new Set(Object.values(fieldMap).flatMap((list) => list.map((b) => b.collectionId)))];
  const [collections, entries] = await Promise.all([
    prisma.cmsCollection.findMany({
      where: { siteId, deletedAt: null, id: { in: collectionIds } },
      select: { id: true, name: true, pageTemplatePath: true },
    }),
    prisma.cmsEntry.findMany({
      where: { collectionId: { in: collectionIds }, status: "PUBLISHED", deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true, collectionId: true, data: true },
    }),
  ]);
  const collectionById = new Map(collections.map((c) => [c.id, c]));
  const valueOf = (collectionId: string, itemId: string | undefined, fieldSlug: string): string => {
    const record = itemId
      ? entries.find((e) => e.id === itemId && e.collectionId === collectionId)
      : entries.find((e) => e.collectionId === collectionId);
    const v = ((record?.data ?? {}) as Record<string, unknown>)[fieldSlug];
    return v === undefined || v === null ? "" : String(v);
  };

  const found: EmptyBinding[] = [];
  for (const page of pages) {
    const file = page.isHomePage ? "index.html" : `${(page.slug ?? "").replace(/^\/+/, "")}.html`;
    const walk = (node: BoundNode | undefined, listCollection: string | undefined) => {
      if (!node || typeof node !== "object") return;
      const id = typeof node.id === "string" ? node.id : "";
      for (const b of fieldMap[id] ?? []) {
        const onPageRecord = !b.itemId || b.itemId === "context";
        const collection = collectionById.get(b.collectionId);
        if (onPageRecord && listCollection === b.collectionId) continue;
        if (onPageRecord && collection?.pageTemplatePath === file) continue;
        if (valueOf(b.collectionId, onPageRecord ? undefined : b.itemId, b.fieldSlug)) continue;
        const layerName = node.data?.layerName;
        found.push({
          pageName: page.name,
          element: typeof layerName === "string" && layerName ? layerName : capitalize(node.type ?? "element"),
          collectionName: collection?.name ?? b.collectionName ?? "a deleted collection",
          fieldSlug: b.fieldSlug,
          ...(b.fallback ? { fallback: b.fallback } : {}),
        });
      }
      const inner = lists.get(id) ?? listCollection;
      for (const child of Array.isArray(node.children) ? node.children : []) walk(child, inner);
    };
    walk(page.blocks as BoundNode, undefined);
  }
  return found;
}

export interface GeneratedPage {
  path: string;
  content: string;
}

/**
 * Resolve the published pages a page-generating collection produces — one per
 * PUBLISHED entry, with its slug + pattern SEO computed from the entry's data.
 * This is the data the publish pipeline turns into HTML; returning it lets the
 * dashboard preview the generated pages without a deploy. Non-page collections
 * (no pageSlugPattern) yield [].
 */
export async function resolveDynamicPages(
  siteId: string,
  collectionId: string,
): Promise<DynamicPage[]> {
  const col = await prisma.cmsCollection.findFirst({
    where: { id: collectionId, siteId, deletedAt: null },
    select: { pageSlugPattern: true, pageSeoTitle: true, pageSeoDescription: true },
  });
  if (!col) throw new CmsError("NOT_FOUND", "Collection not found");
  if (!col.pageSlugPattern) return [];
  const entries = await prisma.cmsEntry.findMany({
    where: { collectionId, status: "PUBLISHED", deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, data: true },
  });
  return entries.map((e) => {
    const data = (e.data as Record<string, unknown>) ?? {};
    return {
      entryId: e.id,
      slug: applyPattern(col.pageSlugPattern as string, data, true),
      seoTitle: col.pageSeoTitle ? applyPattern(col.pageSeoTitle, data, false) : "",
      seoDescription: col.pageSeoDescription ? applyPattern(col.pageSeoDescription, data, false) : "",
    };
  });
}

/**
 * The publish-pipeline consumer: render one HTML file per PUBLISHED entry from a
 * template (the designated template page's exported HTML). {fieldSlug} markers in
 * the template are replaced with the entry's values (HTML-escaped), the resolved
 * pattern SEO is injected into <head>, and the file is emitted at the resolved
 * slug. Returns the file list the publish worker deploys. Non-page collections
 * yield []. (The editor supplies templateHtml from the page bound to this
 * collection; the deploy of these files is verified at publish time.)
 */
// A17: substitution must not reach inside <script>/<style> — a field value
// containing e.g. `{` could otherwise land inside inline JS/CSS unescaped
// and unexpected (the surrounding markup is HTML-escaped by design;
// script/style content is not HTML). Splits the template into
// script/style spans and the rest, substitutes only the rest, and
// reassembles in order.
//
// Found this entity-escaped substitution alone
// isn't enough for a URL-bearing attribute (`<a href="{fieldSlug}">` with a
// `javascript:` value survives entity-escaping — it has no `<`, `>` or `"`
// to escape). An earlier fix used a regex "is this substitution inside a URL
// attribute" detector, but that detector proved bypassable (unquoted
// attributes, a non-first `srcset` candidate, `style="url(...)"`, and case
// all need real parsing to resolve correctly). BINDING RULING: stop
// detecting HTML context with regex here — this function goes back to plain
// entity-escaped substitution, and `generateDynamicPages` runs the whole
// resulting page through `sanitizeGeneratedPageHtml` (a real parser) below.
function substituteOutsideScriptStyle(
  html: string,
  data: Record<string, unknown>,
): string {
  const spanRe = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let result = "";
  let last = 0;
  let m: RegExpExecArray | null;
  const sub = (segment: string) =>
    segment.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_m, key: string) => {
      const v = data[key];
      return v == null ? "" : escapeHtmlText(String(v));
    });
  while ((m = spanRe.exec(html))) {
    result += sub(html.slice(last, m.index));
    result += m[0]; // script/style span verbatim — never substituted
    last = spanRe.lastIndex;
  }
  result += sub(html.slice(last));
  return result;
}

// A17: the template page already has its OWN <title>/<meta name="description">
// (it's a real, exportable page) — injecting the generated page's SEO without
// removing them produced two <title> elements, and browsers/crawlers use the
// first, so the pattern-derived title the collection is configured for never
// actually won.
function stripExistingSeoTags(html: string): string {
  return html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .replace(/<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>/gi, "");
}

export async function generateDynamicPages(
  siteId: string,
  collectionId: string,
  templateHtml: string,
): Promise<GeneratedPage[]> {
  const col = await prisma.cmsCollection.findFirst({
    where: { id: collectionId, siteId, deletedAt: null },
    select: { pageSlugPattern: true, pageSeoTitle: true, pageSeoDescription: true },
  });
  if (!col) throw new CmsError("NOT_FOUND", "Collection not found");
  if (!col.pageSlugPattern) return [];
  const entries = await prisma.cmsEntry.findMany({
    where: { collectionId, status: "PUBLISHED", deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, data: true },
  });
  const cleanedTemplate = stripExistingSeoTags(templateHtml);
  return entries.map((e) => {
    const data = (e.data as Record<string, unknown>) ?? {};
    const slug = applyPattern(col.pageSlugPattern as string, data, true);
    const seoTitle = col.pageSeoTitle ? applyPattern(col.pageSeoTitle, data, false) : "";
    const seoDescription = col.pageSeoDescription ? applyPattern(col.pageSeoDescription, data, false) : "";
    let html = substituteOutsideScriptStyle(cleanedTemplate, data);
    const seoTags =
      `<title>${escapeHtmlText(seoTitle)}</title>` +
      (seoDescription ? `<meta name="description" content="${escapeHtmlText(seoDescription)}">` : "");
    html = insertBeforeHeadClose(html, seoTags);
    // The sink defense against a dangerous URL a
    // substitution introduced runs here, over the FINAL page, through a real
    // parser — not as a step of the substitution above.
    html = sanitizeGeneratedPageHtml(html);
    const cleanSlug = slug.replace(/^\/+|\/+$/g, "") || "index";
    return { path: `${cleanSlug}/index.html`, content: html };
  });
}

/**
 * The CMS data a draft render needs to resolve a site's bindings, and nothing
 * more — the read is for the /share/<token> draft, whose holder may be
 * anonymous. Takes, per collection, the field slugs the delivered pages'
 * bindings read (`fieldsByCollection`, from share-link.service); returns the
 * collections of THIS site among them, their PUBLISHED entries only (a draft
 * record never leaves the server) capped at CMS_COLLECTION_LIMIT_MAX each,
 * and every entry's `data` — and each collection's field list — projected to
 * those slugs plus the display field. An unbound field ("internal notes") is
 * not sent (review I-2). Entries come newest-first, the editor store's order
 * (CollectionStorage.loadContentItems), so "the first published record" a
 * binding without an itemId previews is the record the canvas shows.
 */
export async function getPublishedCmsForBindings(siteId: string, fieldsByCollection: ReadonlyMap<string, ReadonlySet<string>>) {
  if (fieldsByCollection.size === 0) return { collections: [], entries: [] };
  const rows = await prisma.cmsCollection.findMany({
    where: { siteId, deletedAt: null, id: { in: [...fieldsByCollection.keys()] } },
    select: { id: true, name: true, slug: true, displayField: true, fields: true, createdAt: true, updatedAt: true },
  });
  const keep = (c: { id: string; displayField: string | null }) =>
    new Set([...(fieldsByCollection.get(c.id) ?? []), ...(c.displayField ? [c.displayField] : [])]);
  const collections = rows.map((c) => {
    const slugs = keep(c);
    const fields = Array.isArray(c.fields)
      ? (c.fields as Array<{ id?: string; slug?: string }>).filter((f) => slugs.has(f.slug ?? f.id ?? ""))
      : [];
    return { ...c, fields };
  });
  const perCollection = await Promise.all(
    rows.map(async (c) => {
      const slugs = keep(c);
      const found = await prisma.cmsEntry.findMany({
        where: { collectionId: c.id, status: "PUBLISHED", deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: CMS_COLLECTION_LIMIT_MAX,
        select: { id: true, collectionId: true, data: true, status: true, createdAt: true, updatedAt: true },
      });
      return found.map((e) => {
        const data = (e.data ?? {}) as Record<string, unknown>;
        return { ...e, data: Object.fromEntries(Object.entries(data).filter(([k]) => slugs.has(k))) };
      });
    }),
  );
  return { collections, entries: perCollection.flat() };
}

/**
 * The CMS rows a publish renders from: every field of the collections the
 * project binds, and their live PUBLISHED entries, newest first (the editor
 * store's order, so an itemId-less binding resolves the same record here as on
 * the canvas). Unlike the share draft this is not projected — the caller is an
 * EDITOR publishing the site, not an anonymous visitor.
 */
export async function getPublishedCmsForCollections(siteId: string, collectionIds: readonly string[]) {
  if (collectionIds.length === 0) return { collections: [], entries: [] };
  /* pageTemplatePath too: the export writes a template page's "record on
     this page" binding as the `{field}` token the worker fills per record
     only when it knows the page IS the template. Without it every record page
     published the newest record's values. */
  const collections = await prisma.cmsCollection.findMany({
    where: { siteId, deletedAt: null, id: { in: [...collectionIds] } },
    select: { id: true, name: true, slug: true, displayField: true, fields: true, pageTemplatePath: true, createdAt: true, updatedAt: true },
  });
  const entries = await prisma.cmsEntry.findMany({
    where: { collectionId: { in: collections.map((c) => c.id) }, status: "PUBLISHED", deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, collectionId: true, data: true, status: true, createdAt: true, updatedAt: true },
  });
  return { collections, entries };
}

/**
 * Publish-pipeline step: expand a publish page-set with the dynamic pages each
 * page-generating collection produces. SAFE NO-OP for the common case — a site
 * with no page-generating collection gets its pages back unchanged, so existing
 * publishes are untouched. For each collection that has both a slug pattern and a
 * pageTemplatePath present in the payload, it renders one page per entry from
 * that template and appends them, and the template page itself leaves the set
 * (see below). Called by startPublish before the job persists.
 */
export async function appendDynamicPagesToPublish(
  siteId: string,
  pages: Array<{ path: string; html: string }>,
): Promise<Array<{ path: string; html: string }>> {
  const cols = await prisma.cmsCollection.findMany({
    where: { siteId, deletedAt: null, pageSlugPattern: { not: null }, pageTemplatePath: { not: null } },
    select: { id: true, pageTemplatePath: true },
  });
  if (cols.length === 0) return pages;
  /* A bound template page is a blueprint, not a page. The exporter writes a
     binding to "the record on this page" as the `{fieldSlug}` token this
     step fills per record (CMSExportResolver), so the template's own HTML is
     full of placeholders — published as-is it shipped `<h1>{title}</h1>`
     beside the pages it generated (A-17, walked live). It is replaced by what
     it generates, even when that is nothing yet. The home page is the one
     exception: dropping index.html would leave the site root empty. */
  const templatePaths = new Set(
    cols.map((c) => c.pageTemplatePath).filter((path): path is string => !!path && path !== "index.html"),
  );
  const result = pages.filter((p) => !templatePaths.has(p.path));
  for (const col of cols) {
    const template = pages.find((p) => p.path === col.pageTemplatePath);
    if (!template) {
      // A-17: was a silent `continue` — a collection whose template page was
      // deleted/renamed since binding produced NO generated pages with no
      // signal anywhere. runPrePublishChecks (publish.service.ts) surfaces
      // this as a visible warning before the user ever gets here; this stays
      // a warn-only skip (not a throw) so a stale binding degrades a publish
      // rather than failing one outright — see A-17's risk_notes.
      console.warn(
        `[cms] collection ${col.id} on site ${siteId}: template page "${col.pageTemplatePath}" is not in this publish — skipping its generated pages.`,
      );
      continue;
    }
    const generated = await generateDynamicPages(siteId, col.id, template.html);
    for (const g of generated) result.push({ path: g.path, html: g.content });
  }
  return result;
}
