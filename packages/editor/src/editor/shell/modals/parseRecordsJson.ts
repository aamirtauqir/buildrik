/**
 * parseRecordsJson — turn an Import JSON file into record data for one
 * collection (B13, SH-115). A file is a JSON array of objects; each object's
 * keys are matched to the collection's fields by slug or by name, ignoring
 * case, and keys that match no field are dropped. A row that is not an object,
 * or that matches no field at all, is reported by its 1-based position rather
 * than failing the whole file (decision #31: partial count + skipped rows).
 *
 * @license BSD-3-Clause
 */
import type { CMSField } from "@/shared/types/cms";

export interface SkippedRow {
  row: number;
  reason: string;
}

/** A usable row, keeping its 1-based position so a later refusal can name it. */
export interface ParsedRow {
  row: number;
  data: Record<string, unknown>;
}

export type ParsedRecords =
  | { ok: true; rows: ParsedRow[]; invalid: SkippedRow[] }
  | { ok: false; reason: string };

export function parseRecordsJson(text: string, fields: CMSField[]): ParsedRecords {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: "This file isn't valid JSON." };
  }
  if (!Array.isArray(data)) return { ok: false, reason: "Expected a JSON array of records." };

  const slugByKey = new Map<string, string>();
  for (const f of fields) {
    slugByKey.set(f.slug.toLowerCase(), f.slug);
    slugByKey.set(f.name.toLowerCase(), f.slug);
  }

  const rows: ParsedRow[] = [];
  const invalid: SkippedRow[] = [];
  data.forEach((entry: unknown, i) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      invalid.push({ row: i + 1, reason: "not an object" });
      return;
    }
    const record: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entry)) {
      const slug = slugByKey.get(key.toLowerCase());
      if (slug) record[slug] = value;
    }
    if (Object.keys(record).length === 0) invalid.push({ row: i + 1, reason: "no field of this collection" });
    else rows.push({ row: i + 1, data: record });
  });
  return { ok: true, rows, invalid };
}
