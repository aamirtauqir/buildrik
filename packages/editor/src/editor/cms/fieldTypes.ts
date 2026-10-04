/**
 * The field types a person can add, in the Add field dialog's order
 * (4418:164208: Text · Number · Rich text · Image · Boolean · Reference ·
 * Slug, then the two the model also carries), and their prose names — the
 * slug is an identifier, a field list is read.
 *
 * Also the ONE field-key rule (CMS-03): the New collection modal, + Add field
 * and the field inspector all derive and check keys here. The setup modal
 * used to make `_` keys with no format or duplicate check (two `title`
 * fields, `bad_key!`), while Add field had its own rule.
 *
 * @license BSD-3-Clause
 */
import { CMS_FIELD_KEY_RE, CMS_RESERVED_FIELD_KEYS } from "@buildrik/shared/schemas/cms";
import type { CMSField, CMSFieldType } from "@/shared/types/cms";

export const FIELD_TYPES = ["text", "number", "richtext", "image", "boolean", "reference", "slug", "textarea", "date", "multiselect"] as const;

export const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Text",
  textarea: "Long text",
  richtext: "Rich text",
  number: "Number",
  boolean: "Boolean",
  image: "Image",
  date: "Date",
  slug: "Slug",
  reference: "Reference",
  multiselect: "Multi-select",
};

/** A field's key from its name: "Unit price" → "unit-price". */
export function fieldKeyFrom(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Why `key` can't be a new field's key, or null. */
export function fieldKeyError(key: string, taken: ReadonlySet<string>): string | null {
  if (!key) return "A field needs a key.";
  if (!CMS_FIELD_KEY_RE.test(key)) return "Keys start with a letter: lowercase letters, digits, - and _.";
  if (CMS_RESERVED_FIELD_KEYS.has(key.toLowerCase())) return `${key} is reserved for the record itself — choose another key.`;
  if (taken.has(key)) return `The key ${key} is already used.`;
  return null;
}

/** The first free key from a base: "name" → "name-2" → "name-3"… */
export function freeKey(base: string, taken: ReadonlySet<string>): string {
  const root = base || "field";
  if (!taken.has(root) && !CMS_RESERVED_FIELD_KEYS.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

/** A field row as the New collection modal draws it (4418:84646). */
export interface SetupFieldRow {
  name: string;
  type: CMSFieldType;
}

/**
 * The schema a new collection starts with, from the modal's rows — through
 * the same key rule as + Add field (CMS-03). Every collection gets a name
 * field (the display field, CMS-16) and a slug field, so "Generate a page per
 * entry" has the `{slug}` its pattern names (CMS-02: the pattern was saved
 * over a collection with no slug field, and Dynamic pages refused it).
 */
export function collectionSchemaFrom(
  rows: readonly SetupFieldRow[],
  newId: () => string,
): { fields: CMSField[]; displayField: string; slugKey: string } | { error: string } {
  const fields: CMSField[] = [];
  const taken = new Set<string>();
  const add = (name: string, slug: string, type: CMSFieldType, extra: Partial<CMSField> = {}) => {
    taken.add(slug);
    fields.push({ id: newId(), name, slug, type, order: fields.length, ...extra });
  };
  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;
    const key = fieldKeyFrom(name);
    const error = fieldKeyError(key, taken);
    if (error) return { error: `Field “${name}”: ${error}` };
    add(name, key, row.type);
  }
  if (!fields.some((f) => f.type === "text")) {
    const slug = freeKey("title", taken);
    taken.add(slug);
    fields.unshift({ id: newId(), name: "Title", slug, type: "text", order: 0, validation: { required: true } });
  }
  const displayField = fields.find((f) => f.type === "text")!.slug;
  let slugKey = fields.find((f) => f.type === "slug")?.slug;
  if (!slugKey) {
    slugKey = freeKey("slug", taken);
    add("Slug", slugKey, "slug");
  }
  return { fields: fields.map((f, order) => ({ ...f, order })), displayField, slugKey };
}
