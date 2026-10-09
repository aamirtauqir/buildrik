import { z } from "zod";
import { isDangerousUrl } from "./element-markup";

/**
 * CMS — the SSOT for the collection schema (field types, field shape, record
 * status) and for the rules a record has to meet (DM-13). The engine
 * (`CollectionManager`), the record sheet and the server (`cms.service`, on
 * every PUBLISHED upsert) all validate through the functions below, so the
 * editor and the server can never disagree about what may publish.
 *
 * Collections and entry `data` still travel as JSON; the server checks them
 * with these rules inside the service (a `CmsError("INVALID")`), not at the
 * tRPC input boundary — a stored collection that predates a rule must be
 * answered with a reason the client can show, not a bare 400 it retries
 * forever.
 */

/** Every field type the model stores. `slug` is a real type (CMS-09). */
export const CMS_FIELD_TYPES = [
  "text",
  "textarea",
  "richtext",
  "number",
  "date",
  "datetime",
  "boolean",
  "select",
  "multiselect",
  "image",
  "file",
  "reference",
  "color",
  "url",
  "email",
  "slug",
] as const;
export type CmsFieldType = (typeof CMS_FIELD_TYPES)[number];

/** Record status as the editor stores it; the server keeps DRAFT | PUBLISHED. */
export const CMS_RECORD_STATUSES = ["draft", "published", "archived"] as const;
export type CmsRecordStatus = (typeof CMS_RECORD_STATUSES)[number];

/** A field key as a person may type it: what `{key}` patterns, `{{item.key}}`
 *  placeholders and record data all read. */
export const CMS_FIELD_KEY_RE = /^[a-z][a-z0-9_-]*$/;
/** What the server accepts in a stored key — looser than the UI rule so a
 *  collection made before the rule still saves, strict enough that a key can
 *  never break a `{key}` pattern or a `{{item.key}}` path. */
const STORED_FIELD_KEY_RE = /^[^\s{}.]+$/;
/** Names a record already uses for itself (RT-15: a field named "Published"
 *  collided with the record's Published switch), plus `url` — `{{item.url}}`
 *  is the record's own page (BD-12). */
export const CMS_RESERVED_FIELD_KEYS: ReadonlySet<string> = new Set(["id", "status", "published", "url", "createdat", "updatedat"]);

export const CMS_MAX_FIELDS = 100;
/* DM-12 size caps — technical bounds, not plan limits (per-plan numbers wait
   on PD-9). A record's data as JSON; records per collection (the list cap,
   CMS_COLLECTION_LIMIT_MAX); collections per site. */
export const CMS_MAX_ENTRY_CHARS = 200_000;
export const CMS_MAX_ENTRIES_PER_COLLECTION = 10_000;
export const CMS_MAX_COLLECTIONS_PER_SITE = 100;
export const CMS_MAX_OPTIONS = 100;

const cmsFieldValidation = z
  .object({
    required: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
    pattern: z.string().max(200).optional(),
    patternMessage: z.string().max(200).optional(),
  })
  .passthrough();

/** One field of a collection's schema. */
export const cmsFieldSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(64).regex(STORED_FIELD_KEY_RE, "Field keys can't contain spaces, braces or dots"),
    type: z.enum(CMS_FIELD_TYPES),
    order: z.number(),
    validation: cmsFieldValidation.optional(),
    options: z.array(z.string().max(100)).max(CMS_MAX_OPTIONS).optional(),
    referenceCollection: z.string().max(200).optional(),
  })
  .passthrough();
export type CmsFieldInput = z.infer<typeof cmsFieldSchema>;

/** A collection's whole field list: each field well formed, keys unique. */
export const cmsFieldsSchema = z
  .array(cmsFieldSchema)
  .max(CMS_MAX_FIELDS)
  .superRefine((fields, ctx) => {
    const seen = new Set<string>();
    for (const f of fields) {
      if (seen.has(f.slug)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Two fields use the key ${f.slug}` });
      seen.add(f.slug);
    }
  });

/** The minimal field shape the record rules read — the engine's `CMSField`
 *  and the server's stored JSON both satisfy it. */
export interface CmsFieldRule {
  name: string;
  slug: string;
  type: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
  };
  options?: string[];
}

/** No value: nothing, an empty or blank string, or an empty list. An empty
 *  number is empty too — it is never stored as 0. */
export function isEmptyCmsValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

const SLUG_VALUE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/* A user-written pattern runs on the server too; only short values are
   tested so a pathological pattern cannot hold a request for long. */
const PATTERN_VALUE_LIMIT = 1_000;

function lengthOf(field: CmsFieldRule, value: string): number {
  return field.type === "richtext" ? value.replace(/<[^>]*>/g, "").length : value.length;
}

/**
 * Why `value` cannot stand in `field` on a published record, or null.
 * Required, type, min/max, length and pattern — the one rule set the record
 * sheet, `CollectionManager` and the server's PUBLISHED upsert all run.
 */
export function cmsValueError(field: CmsFieldRule, value: unknown): string | null {
  const v = field.validation;
  if (isEmptyCmsValue(value)) return v?.required ? `${field.name} is required` : null;
  switch (field.type) {
    case "number": {
      const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
      if (!Number.isFinite(n)) return `${field.name} must be a number`;
      if (v?.min !== undefined && n < v.min) return `${field.name} must be at least ${v.min}`;
      if (v?.max !== undefined && n > v.max) return `${field.name} must be at most ${v.max}`;
      return null;
    }
    case "boolean":
      return typeof value === "boolean" || value === "true" || value === "false" ? null : `${field.name} must be yes or no`;
    case "multiselect": {
      if (!Array.isArray(value) || value.some((x) => typeof x !== "string")) return `${field.name} must be a list of options`;
      const off = field.options?.length ? value.filter((x) => !field.options!.includes(x)) : [];
      return off.length ? `${field.name} has an option that isn't offered: ${off[0]}` : null;
    }
    case "select":
      return field.options?.length && !field.options.includes(String(value))
        ? `${field.name} must be one of: ${field.options.join(", ")}`
        : null;
    case "date":
    case "datetime":
      return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? null : `${field.name} must be a date`;
    case "reference":
      return typeof value === "string" ? null : `${field.name} must name a record`;
  }
  if (typeof value !== "string") return `${field.name} must be text`;
  const len = lengthOf(field, value);
  if (v?.minLength !== undefined && len < v.minLength) return `${field.name} must be at least ${v.minLength} characters`;
  if (v?.maxLength !== undefined && len > v.maxLength) return `${field.name} must be at most ${v.maxLength} characters`;
  if (field.type === "slug" && !SLUG_VALUE_RE.test(value)) return `${field.name} uses lowercase letters, numbers and single hyphens`;
  if (field.type === "email" && !EMAIL_RE.test(value)) return `${field.name} must be a valid email`;
  if (field.type === "url") {
    try {
      new URL(value);
    } catch {
      return `${field.name} must be a valid URL`;
    }
    if (isDangerousUrl(value)) return `${field.name} must be a web address`;
  }
  if (v?.pattern && value.length <= PATTERN_VALUE_LIMIT) {
    let re: RegExp | null = null;
    try {
      re = new RegExp(v.pattern);
    } catch {
      re = null; // An unreadable pattern is the schema's fault, not the record's.
    }
    if (re && !re.test(value)) return v.patternMessage || `${field.name} format is invalid`;
  }
  return null;
}

/** A field value as text on a page — a multi-select's options read
 *  "a, b"; nothing reads "". The one formatter every text sink uses (canvas
 *  binding, list copies, the server's record pages). */
export function cmsTextOf(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map((v) => cmsTextOf(v)).filter(Boolean).join(", ");
  return String(value);
}

/**
 * The token the export writes on a collection's template page where a
 * binding follows "this page's record" — filled per record on the server
 * (BD-13). Namespaced so author copy with braces ("{note}", "{ }") is never
 * read as a field.
 */
export function cmsRecordToken(key: string): string {
  return `{{bk:${key}}}`;
}

/**
 * Fill a template page's record tokens: every `{{bk:key}}`, and — for pages
 * exported before the namespaced token — a bare `{key}` only when `key` IS a
 * field of the collection. Any other braces are the author's text and stay.
 */
export function fillCmsRecordTokens(text: string, fieldKeys: ReadonlySet<string>, render: (key: string) => string): string {
  return text.replace(/\{\{bk:([a-zA-Z0-9_-]+)\}\}|\{([a-zA-Z0-9_-]+)\}/g, (m, bk?: string, bare?: string) =>
    bk ? render(bk) : bare && fieldKeys.has(bare) ? render(bare) : m,
  );
}

/** A record's name: its collection's display field, else the first field —
 *  what a reference shows for the record it points at. "" when empty. */
export function cmsRecordLabel(
  collection: { displayField?: string | null; fields: readonly { slug: string }[] },
  data: Record<string, unknown>,
): string {
  const key = collection.fields.find((f) => f.slug === collection.displayField)?.slug ?? collection.fields[0]?.slug;
  return key ? cmsTextOf(data[key]).trim() : "";
}

/** A multi-select's options from "one per line" text: trimmed, unique, non-empty. */
export function cmsOptionsFrom(text: string): string[] {
  return [...new Set(text.split("\n").map((o) => o.trim()).filter(Boolean))].slice(0, CMS_MAX_OPTIONS);
}

/** Every field's reason, keyed by field key; empty when the record may publish. */
export function cmsRecordErrors(fields: readonly CmsFieldRule[], data: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const e = cmsValueError(f, data[f.slug]);
    if (e) errors[f.slug] = e;
  }
  return errors;
}

/** The field that holds a record's slug: a `slug`-type field, else one keyed
 *  `slug` (collections made before the type existed). */
export function cmsSlugField<F extends { slug: string; type: string }>(fields: readonly F[]): F | undefined {
  return fields.find((f) => f.type === "slug") ?? fields.find((f) => f.slug === "slug");
}

/** The publish service's slug rule — one implementation for the server's
 *  page paths and the editor's preview of them. */
export function cmsSlugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** `{key}` placeholders in a pattern, filled from a record. `asSlug` slugifies
 *  each value (URL patterns); SEO patterns keep the text as written. */
export function applyCmsPattern(pattern: string, data: Record<string, unknown>, asSlug: boolean): string {
  return pattern.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_m, key: string) => {
    const v = data[key];
    const s = cmsTextOf(v);
    return asSlug ? cmsSlugify(s) : s;
  });
}

/** A record's page path from the collection's URL pattern, without the
 *  slashes at either end — "" when a placeholder resolves to nothing (the
 *  page would land on the collection's own prefix, shared by every such
 *  record). */
export function cmsRecordPath(pattern: string, data: Record<string, unknown>): string {
  const keys = [...pattern.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]);
  if (keys.some((k) => applyCmsPattern(`{${k}}`, data, true) === "")) return "";
  return applyCmsPattern(pattern, data, true)
    .split("/")
    .filter(Boolean)
    .join("/");
}

/**
 * Why a URL pattern can't be saved, or null (DM-18). It has to be a path —
 * letters, digits, `-`, `_`, `/` and `{key}` placeholders, no empty or `..`
 * segment — name at least one field (or every record gets one page), and
 * name only fields the collection has.
 */
export function cmsPatternError(pattern: string, fields: readonly { slug: string }[]): string | null {
  const p = pattern.trim();
  if (!p) return null;
  if (p.length > 200) return "The URL pattern is longer than 200 characters.";
  if (!/^[A-Za-z0-9_\-/{}]+$/.test(p)) return "A URL pattern uses letters, numbers, -, _, / and {field} only.";
  if (/\/\//.test(p) || p.split("/").some((seg) => seg === "." || seg === "..")) return "A URL pattern can't have an empty or dot segment.";
  const keys = [...p.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]);
  if (p.replace(/\{[a-zA-Z0-9_-]+\}/g, "").includes("{") || p.replace(/\{[a-zA-Z0-9_-]+\}/g, "").includes("}")) {
    return "A URL pattern's braces must hold a field key, like {slug}.";
  }
  if (keys.length === 0) return "A URL pattern needs a field, like {slug} — otherwise every record gets the same page.";
  const unknown = keys.filter((k) => !fields.some((f) => f.slug === k));
  if (unknown.length) return `${unknown.join(", ")} ${unknown.length === 1 ? "is" : "are"} not a field of this collection.`;
  return null;
}

/** A record the uniqueness rules compare against. */
export interface CmsRecordPeer {
  id: string;
  data: Record<string, unknown>;
  published: boolean;
}

/**
 * Why `record` can't be published beside the collection's other records, or
 * null: its slug is another record's (CMS-07), its page path resolves to
 * nothing or to another published record's path (BD-14).
 */
export function cmsRecordClash(
  collection: { fields: readonly CmsFieldRule[]; pageSlugPattern?: string | null },
  record: { id: string; data: Record<string, unknown> },
  peers: readonly CmsRecordPeer[],
): string | null {
  const others = peers.filter((p) => p.id !== record.id);
  const slugField = cmsSlugField(collection.fields);
  if (slugField) {
    const mine = record.data[slugField.slug];
    if (!isEmptyCmsValue(mine) && others.some((p) => p.data[slugField.slug] === mine)) {
      return `Another record already uses the ${slugField.name} “${String(mine)}”.`;
    }
  }
  const pattern = collection.pageSlugPattern?.trim();
  if (pattern) {
    const path = cmsRecordPath(pattern, record.data);
    if (!path) return "This record's page URL comes out empty — fill the fields its URL pattern uses.";
    const owner = others.find((p) => p.published && cmsRecordPath(pattern, p.data) === path);
    if (owner) return `Another published record already has the page /${path}.`;
  }
  return null;
}

/* Rich text (PD-1): the allow-list and the one sanitizer live in
   packages/shared/content/cmsRichText.ts. */

export const upsertCollectionInput = z.object({
  id: z.string().optional(),
  siteId: z.string().min(1),
  expectedUpdatedAt: z.string().datetime().nullable().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  displayField: z.string().nullable().optional(),
  /* Shape only here; the service applies `cmsFieldsSchema` and answers a
     collection that fails it with a reason (CmsError INVALID). */
  fields: z.array(z.object({ id: z.string(), name: z.string().min(1), slug: z.string().min(1), type: z.string(), order: z.number() }).passthrough()).max(CMS_MAX_FIELDS).default([]),
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

export const deleteCollectionInput = z.object({ siteId: z.string().min(1), id: z.string().min(1) });

export const upsertEntryInput = z.object({
  id: z.string().optional(),
  siteId: z.string().min(1),
  collectionId: z.string().min(1),
  expectedUpdatedAt: z.string().datetime().nullable().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  // Internal flag: CSV import loops this; skipping the per-row touchCmsEdited
  // makes the importer batch its site-bump into a single UPDATE.
  _skipTouchCmsEdited: z.boolean().optional(),
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
