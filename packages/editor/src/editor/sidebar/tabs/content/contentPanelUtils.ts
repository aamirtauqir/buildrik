/**
 * contentPanelUtils — pure helpers for the Content panel (Figma boards
 * 148:2…151:87): site-variable persistence, condition summaries, field
 * defaults. No React, no engine imports beyond types.
 *
 * @license BSD-3-Clause
 */
import type { CMSField } from "@/shared/types/cms";
import type { SiteVariable } from "@/shared/types/project";

/** DataManager source id that carries the site variables ({{site.*}}). */
export const SITE_VARS_SOURCE_ID = "site";

const SITE_VARS_KEY_PREFIX = "buildrick-site-variables";


function storageKey(projectId: string | null): string {
  return projectId ? `${SITE_VARS_KEY_PREFIX}-${projectId}` : SITE_VARS_KEY_PREFIX;
}

/** Load persisted site variables (editor-side persistence; the DataManager
 *  source is re-registered from this on panel mount so {{site.*}} bindings
 *  resolve for real). */
/** Variables saved before they moved into the project — read once to migrate. */
export function loadLegacySiteVariables(projectId: string | null): SiteVariable[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage?.getItem(storageKey(projectId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is SiteVariable =>
        typeof v === "object" && v !== null &&
        typeof (v as SiteVariable).key === "string" &&
        typeof (v as SiteVariable).value === "string",
    );
  } catch {
    return [];
  }
}

export function variablesToSourceData(vars: SiteVariable[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of vars) out[v.key] = v.value;
  return out;
}

/** Valid variable key: dotted-path-safe segment (letters/digits/_/-). */
export function isValidVariableKey(key: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(key);
}

/** Default value for a new record, per field type (mirrors the record form). */
export function fieldDefault(field: CMSField): unknown {
  if (field.defaultValue !== undefined) return field.defaultValue;
  switch (field.type) {
    case "boolean":
      return false;
    /* Empty, not 0: a 0 default made a required Price look filled, and
       "no price" publish as $0. */
    case "number":
      return undefined;
    case "multiselect":
      return [];
    default:
      return "";
  }
}
