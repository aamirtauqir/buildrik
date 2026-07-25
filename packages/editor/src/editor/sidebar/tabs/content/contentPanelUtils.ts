/**
 * contentPanelUtils — pure helpers for the Content panel (Figma boards
 * 148:2…151:87): site-variable persistence, condition summaries, field
 * defaults. No React, no engine imports beyond types.
 *
 * @license BSD-3-Clause
 */
import type { CMSField } from "@/shared/types/cms";
import type { ConditionBinding, ConditionExpression, LogicGroup } from "@/shared/types/data";

/** DataManager source id that carries the site variables ({{site.*}}). */
export const SITE_VARS_SOURCE_ID = "site";

const SITE_VARS_KEY_PREFIX = "buildrick-site-variables";

export interface SiteVariable {
  key: string;
  value: string;
}

function storageKey(projectId: string | null): string {
  return projectId ? `${SITE_VARS_KEY_PREFIX}-${projectId}` : SITE_VARS_KEY_PREFIX;
}

/** Load persisted site variables (editor-side persistence; the DataManager
 *  source is re-registered from this on panel mount so {{site.*}} bindings
 *  resolve for real). */
export function loadSiteVariables(projectId: string | null): SiteVariable[] {
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

export function saveSiteVariables(projectId: string | null, vars: SiteVariable[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(storageKey(projectId), JSON.stringify(vars));
  } catch {
    // Storage blocked (private mode) — variables stay session-only.
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

const OPERATOR_LABEL: Record<string, string> = {
  "==": "is",
  "!=": "is not",
  ">": ">",
  "<": "<",
  ">=": "≥",
  "<=": "≤",
  contains: "contains",
  not_contains: "doesn't contain",
  exists: "exists",
  not_exists: "doesn't exist",
  empty: "is empty",
  not_empty: "isn't empty",
};

function sideLabel(side: ConditionExpression["left"]): string {
  if (side == null) return "";
  if (typeof side === "object") {
    const b = side as { sourceId?: string; path?: string };
    return [b.sourceId, b.path].filter(Boolean).join(".");
  }
  return String(side);
}

function isLogicGroup(c: ConditionExpression | LogicGroup): c is LogicGroup {
  return "conditions" in c;
}

/** "when available is false" — the sub-line on a Conditions row (board 151:87). */
export function conditionSummary(binding: ConditionBinding): string {
  const c = binding.condition;
  if (isLogicGroup(c)) {
    const parts = c.conditions.map((sub) =>
      isLogicGroup(sub) ? "(…)" : exprSummary(sub),
    );
    return `when ${parts.join(` ${String((c as { operator?: string }).operator ?? "and").toLowerCase()} `)}`;
  }
  return `when ${exprSummary(c)}`;
}

function exprSummary(e: ConditionExpression): string {
  const op = OPERATOR_LABEL[e.operator] ?? e.operator;
  const left = sideLabel(e.left);
  const right = e.right !== undefined ? ` ${sideLabel(e.right)}` : "";
  return `${left} ${op}${right}`.trim();
}

/** Default value for a new record, per field type (mirrors the record form). */
export function fieldDefault(field: CMSField): unknown {
  if (field.defaultValue !== undefined) return field.defaultValue;
  switch (field.type) {
    case "boolean":
      return false;
    case "number":
      return 0;
    case "multiselect":
      return [];
    default:
      return "";
  }
}
