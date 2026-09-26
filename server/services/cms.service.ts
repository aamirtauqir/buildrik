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

/**
 * CMS server persistence (E7) — the ONLY layer that reads/writes cms_collections
 * + cms_entries. Everything is scoped by siteId (the router authorizes site
 * access first); entry ops additionally confirm the collection belongs to the
 * site, so a crafted collectionId can't reach another site's CMS.
 */

export class CmsError extends Error {
  constructor(
    public code: "NOT_FOUND" | "BAD_REQUEST",
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
    where: { siteId },
    orderBy: { name: "asc" },
    include: { _count: { select: { entries: true } } },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, entryCount: _count.entries }));
}

export async function upsertCollection(siteId: string, input: UpsertCollectionInput) {
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
    const existing = await prisma.cmsCollection.findUnique({ where: { id: input.id }, select: { siteId: true } });
    if (existing && existing.siteId !== siteId) throw new CmsError("NOT_FOUND", "Collection not found");
    return prisma.cmsCollection.upsert({
      where: { id: input.id },
      create: { id: input.id, siteId, ...data },
      update: data,
    });
  }
  return prisma.cmsCollection.create({ data: { siteId, ...data } });
}

export async function deleteCollection(siteId: string, id: string): Promise<void> {
  const owned = await prisma.cmsCollection.findFirst({ where: { id, siteId }, select: { id: true } });
  if (!owned) throw new CmsError("NOT_FOUND", "Collection not found");
  await prisma.cmsCollection.delete({ where: { id } });
}

// Confirm the collection is in this site before any entry op — entries key on
// collectionId alone, so this is the cross-site guard.
async function assertCollectionInSite(siteId: string, collectionId: string): Promise<void> {
  const owned = await prisma.cmsCollection.findFirst({
    where: { id: collectionId, siteId },
    select: { id: true },
  });
  if (!owned) throw new CmsError("NOT_FOUND", "Collection not found");
}

export async function listEntries(siteId: string, collectionId: string) {
  await assertCollectionInSite(siteId, collectionId);
  return prisma.cmsEntry.findMany({ where: { collectionId }, orderBy: { updatedAt: "desc" } });
}

export async function upsertEntry(siteId: string, input: UpsertEntryInput) {
  await assertCollectionInSite(siteId, input.collectionId);
  const data = {
    data: sanitizeEntryData(input.data) as unknown as Prisma.InputJsonValue,
    ...(input.status ? { status: input.status } : {}),
  };
  if (input.id) {
    const existing = await prisma.cmsEntry.findUnique({
      where: { id: input.id },
      select: { collection: { select: { siteId: true } } },
    });
    if (existing && existing.collection.siteId !== siteId) throw new CmsError("NOT_FOUND", "Entry not found");
    return prisma.cmsEntry.upsert({
      where: { id: input.id },
      create: { id: input.id, collectionId: input.collectionId, ...data },
      update: data,
    });
  }
  return prisma.cmsEntry.create({ data: { collectionId: input.collectionId, ...data } });
}

export async function deleteEntry(siteId: string, id: string): Promise<void> {
  const owned = await prisma.cmsEntry.findFirst({
    where: { id, collection: { siteId } },
    select: { id: true },
  });
  if (!owned) throw new CmsError("NOT_FOUND", "Entry not found");
  await prisma.cmsEntry.delete({ where: { id } });
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
  const col = await prisma.cmsCollection.findFirst({ where: { id: collectionId, siteId }, select: { fields: true } });
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
      await upsertEntry(siteId, { siteId, collectionId, data });
      imported += 1;
    } catch (e) {
      errors.push({ row: rowNumber, message: e instanceof Error ? e.message : "Could not be saved" });
    }
  }
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
}

export async function findStaleTemplateBindings(
  siteId: string,
  pages: { slug: string; isHomePage: boolean }[],
): Promise<StaleTemplateBindingsResult> {
  const cols = await prisma.cmsCollection.findMany({
    where: { siteId, pageSlugPattern: { not: null }, pageTemplatePath: { not: null } },
    select: { id: true, name: true, pageTemplatePath: true },
  });
  if (cols.length === 0) return { hasPageGeneratingCollections: false, stale: [] };
  const fileNames = new Set(pages.map((p) => (p.isHomePage ? "index.html" : `${p.slug}.html`)));
  const stale = cols
    .filter((c) => !fileNames.has(c.pageTemplatePath as string))
    .map((c) => ({ collectionId: c.id, collectionName: c.name, templatePath: c.pageTemplatePath as string }));
  return { hasPageGeneratingCollections: true, stale };
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
    where: { id: collectionId, siteId },
    select: { pageSlugPattern: true, pageSeoTitle: true, pageSeoDescription: true },
  });
  if (!col) throw new CmsError("NOT_FOUND", "Collection not found");
  if (!col.pageSlugPattern) return [];
  const entries = await prisma.cmsEntry.findMany({
    where: { collectionId, status: "PUBLISHED" },
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
    where: { id: collectionId, siteId },
    select: { pageSlugPattern: true, pageSeoTitle: true, pageSeoDescription: true },
  });
  if (!col) throw new CmsError("NOT_FOUND", "Collection not found");
  if (!col.pageSlugPattern) return [];
  const entries = await prisma.cmsEntry.findMany({
    where: { collectionId, status: "PUBLISHED" },
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
 * Publish-pipeline step: expand a publish page-set with the dynamic pages each
 * page-generating collection produces. SAFE NO-OP for the common case — a site
 * with no page-generating collection gets its pages back unchanged, so existing
 * publishes are untouched. For each collection that has both a slug pattern and a
 * pageTemplatePath present in the payload, it renders one page per entry from
 * that template and appends them. Called by startPublish before the job persists.
 */
export async function appendDynamicPagesToPublish(
  siteId: string,
  pages: Array<{ path: string; html: string }>,
): Promise<Array<{ path: string; html: string }>> {
  const cols = await prisma.cmsCollection.findMany({
    where: { siteId, pageSlugPattern: { not: null }, pageTemplatePath: { not: null } },
    select: { id: true, pageTemplatePath: true },
  });
  if (cols.length === 0) return pages;
  const result = [...pages];
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
