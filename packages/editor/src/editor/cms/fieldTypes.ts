/**
 * The field types a person can add, in the Add field dialog's order
 * (2L9 167:3871 — every type the schema stores, CMS_FIELD_TYPES), and their
 * prose names — the slug is an identifier, a field list is read.
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

export const FIELD_TYPES = [
  "text",
  "textarea",
  "richtext",
  "email",
  "url",
  "slug",
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
] as const satisfies readonly CMSFieldType[];

export const FIELD_TYPE_LABEL: Record<CMSFieldType, string> = {
  text: "Text",
  textarea: "Long text",
  richtext: "Rich text",
  email: "Email",
  url: "URL",
  slug: "Slug",
  number: "Number",
  date: "Date",
  datetime: "Date & time",
  boolean: "Yes/no",
  select: "Option",
  multiselect: "Options",
  image: "Image",
  file: "File",
  reference: "Reference",
  color: "Color",
};

/** The rules each type can carry (CMSFieldValidation, enforced on publish
 *  by cmsValueError): numbers take a range, text a length. One list for
 *  + Add field (167:4135 "Minimum length · Maximum length") and the field
 *  inspector's VALIDATION. */
export type FieldRuleKey = "min" | "max" | "minLength" | "maxLength";
const LENGTH_RULES: ReadonlyArray<{ key: FieldRuleKey; label: string }> = [
  { key: "minLength", label: "Minimum length" },
  { key: "maxLength", label: "Maximum length" },
];
export const FIELD_RULES: Partial<Record<CMSFieldType, ReadonlyArray<{ key: FieldRuleKey; label: string }>>> = {
  number: [{ key: "min", label: "Minimum" }, { key: "max", label: "Maximum" }],
  text: LENGTH_RULES,
  textarea: LENGTH_RULES,
  richtext: LENGTH_RULES,
  slug: LENGTH_RULES,
  email: LENGTH_RULES,
  url: LENGTH_RULES,
};

/** Types a person types a value into — the ones that take a Placeholder and
 *  a typed Default value (167:4135). */
export const TYPED_VALUE_TYPES: ReadonlySet<CMSFieldType> = new Set([
  "text", "textarea", "email", "url", "slug", "number", "date", "datetime", "color",
]);

/** A typed default as the field stores it: a number field's is a number. */
export function parseDefault(type: CMSFieldType, raw: string): unknown {
  const t = raw.trim();
  if (t === "") return undefined;
  return type === "number" ? Number(t) : t;
}

/** Types whose values are chosen from a list the field carries. */
export const OPTION_TYPES: ReadonlySet<CMSFieldType> = new Set(["select", "multiselect"]);

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
