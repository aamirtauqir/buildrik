import { SITE_COLUMN_FIELDS } from "@buildrik/shared/schemas/site-column-fields";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * SA-01: `projectSettings` without the keys that belong to Site columns. The
 * editor saves its settings verbatim, and a second copy of a column in the JSON
 * is one that can disagree with it. Returns a deep copy; non-objects pass
 * through unchanged.
 */
export function stripColumnBackedSettings(settings: unknown): unknown {
  if (!isPlainObject(settings)) return settings;
  const out = structuredClone(settings);
  for (const field of SITE_COLUMN_FIELDS) {
    const [section, key] = field.split(".");
    const block = out[section];
    if (isPlainObject(block)) delete block[key];
  }
  return out;
}
