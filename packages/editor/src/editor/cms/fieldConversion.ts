/**
 * fieldConversion — what a stored value becomes when its field changes type
 * (2L9 B5-F22 257:51318: "5 → "5"", "Lossless conversion"). A value converts
 * when the new type's own rules (cmsValueError, without Required) accept the
 * converted form; anything else can only be cleared.
 *
 * @license BSD-3-Clause
 */
import type { CMSContentItem, CMSField, CMSFieldType } from "@/shared/types/cms";
import { cmsTextOf, cmsValueError, isEmptyCmsValue } from "@buildrik/shared/schemas/cms";

export type Converted = { ok: true; value: unknown } | { ok: false };

const TRUE = new Set(["true", "yes", "1"]);
const FALSE = new Set(["false", "no", "0"]);

function convertRaw(value: unknown, to: CMSFieldType): unknown {
  const text = cmsTextOf(value).trim();
  switch (to) {
    case "number":
      return text === "" ? NaN : Number(text);
    case "boolean":
      if (typeof value === "boolean") return value;
      return TRUE.has(text.toLowerCase()) ? true : FALSE.has(text.toLowerCase()) ? false : text;
    case "multiselect":
      return Array.isArray(value) ? value.map((v) => cmsTextOf(v)) : [text];
    default:
      return text;
  }
}

/** One value under the field's new type, or why it cannot be one. */
export function convertValue(field: CMSField, value: unknown, to: CMSFieldType): Converted {
  const next = convertRaw(value, to);
  const rules = { ...field.validation, required: false };
  const error = cmsValueError({ name: field.name, slug: field.slug, type: to, validation: rules, options: field.options }, next);
  return error ? { ok: false } : { ok: true, value: next };
}

export interface ConversionPlan {
  /** Records that hold a value — the ones the change touches. */
  touched: CMSContentItem[];
  /** Of those, the ones whose value converts. */
  converts: Array<{ record: CMSContentItem; value: unknown }>;
  failing: CMSContentItem[];
}

export function planConversion(field: CMSField, records: CMSContentItem[], to: CMSFieldType): ConversionPlan {
  const touched = records.filter((r) => !isEmptyCmsValue(r.data[field.slug]));
  const converts: ConversionPlan["converts"] = [];
  const failing: CMSContentItem[] = [];
  for (const record of touched) {
    const c = convertValue(field, record.data[field.slug], to);
    if (c.ok) converts.push({ record, value: c.value });
    else failing.push(record);
  }
  return { touched, converts, failing };
}
