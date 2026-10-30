/**
 * CMS conditions and Collection list queries — the one rule model and the one
 * evaluator for the canvas, the in-browser export / publish render and the
 * server's per-record template pages (design notes:
 * packages/editor/docs/design-2l9/engine-conditions.md, engine-list-query.md).
 *
 * Pure: no DOM, no store. A record is its `data` object.
 */
import { z } from "zod";
import type { CmsFieldType } from "./cms";

export const CMS_CONDITION_OPS = [
  "set",
  "empty",
  "is",
  "isNot",
  "contains",
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
  "before",
  "after",
  "on",
  "off",
  "includes",
  "excludes",
] as const;
export type CmsConditionOp = (typeof CMS_CONDITION_OPS)[number];

export const CMS_CONDITION_MAX_RULES = 10;
export const CMS_LIST_SORT_MAX_KEYS = 3;

export const cmsConditionRuleSchema = z.object({
  /** A field slug, or a dotted path into a JSON-ish value ("opening_hours.sunday"). */
  field: z.string().min(1).max(200),
  op: z.enum(CMS_CONDITION_OPS),
  /** A literal, or `@page.<field>` — read from the template page's own record. */
  value: z.string().max(1000).optional(),
});
export type CmsConditionRule = z.infer<typeof cmsConditionRuleSchema>;

export const cmsConditionSchema = z.object({
  match: z.enum(["all", "any"]),
  rules: z.array(cmsConditionRuleSchema).min(1).max(CMS_CONDITION_MAX_RULES),
});
export type CmsCondition = z.infer<typeof cmsConditionSchema>;

/** Record timestamps a list may sort by ("Updated" on the boards). */
export const CMS_RECORD_SORT_KEYS = ["_updated", "_created"] as const;

export const cmsListSortKeySchema = z.object({
  field: z.string().min(1).max(200),
  dir: z.enum(["asc", "desc"]),
});
export type CmsListSortKey = z.infer<typeof cmsListSortKeySchema>;

/** Operators that need a value. */
export const OPS_WITH_VALUE: ReadonlySet<CmsConditionOp> = new Set([
  "is",
  "isNot",
  "contains",
  "eq",
  "neq",
  "gt",
  "lt",
  "gte",
  "lte",
  "before",
  "after",
  "includes",
  "excludes",
]);

/** The operators a field type offers (engine-conditions.md table). */
export function opsForFieldType(type: CmsFieldType | undefined): readonly CmsConditionOp[] {
  switch (type) {
    case "number":
      return ["set", "empty", "eq", "neq", "gt", "lt", "gte", "lte"];
    case "date":
    case "datetime":
      return ["set", "empty", "before", "after"];
    case "boolean":
      return ["on", "off"];
    case "select":
      return ["set", "empty", "is", "isNot"];
    case "multiselect":
      return ["set", "empty", "includes", "excludes"];
    case "image":
    case "file":
    case "reference":
      return ["set", "empty"];
    default:
      return ["set", "empty", "is", "isNot", "contains"];
  }
}

export const CMS_CONDITION_OP_LABEL: Record<CmsConditionOp, string> = {
  set: "is set",
  empty: "is empty",
  is: "is",
  isNot: "is not",
  contains: "contains",
  eq: "=",
  neq: "≠",
  gt: ">",
  lt: "<",
  gte: "≥",
  lte: "≤",
  before: "is before",
  after: "is after",
  on: "is on",
  off: "is off",
  includes: "includes",
  excludes: "excludes",
};

/** A value at a dotted path: the field, then into its object (JSON-ish values). */
export function cmsValueAt(data: Record<string, unknown> | null | undefined, path: string): unknown {
  let cur: unknown = data ?? undefined;
  for (const key of path.split(".")) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

const isSet = (v: unknown): boolean =>
  v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "") && !(Array.isArray(v) && v.length === 0);

const asText = (v: unknown): string => (v === undefined || v === null ? "" : Array.isArray(v) ? v.map(asText).join(", ") : String(v));

/** `@page.<field>` reads the page's record; anything else is the literal. */
function ruleValue(value: string | undefined, pageRecord?: Record<string, unknown> | null): string {
  if (value && value.startsWith("@page.")) return asText(cmsValueAt(pageRecord, value.slice(6)));
  return value ?? "";
}

/** One rule against one record. */
export function evaluateCmsRule(
  rule: CmsConditionRule,
  data: Record<string, unknown> | null | undefined,
  pageRecord?: Record<string, unknown> | null,
): boolean {
  const v = cmsValueAt(data, rule.field);
  const want = ruleValue(rule.value, pageRecord);
  const text = asText(v).trim().toLowerCase();
  const target = want.trim().toLowerCase();
  const num = Number(v);
  const wantNum = Number(want);
  switch (rule.op) {
    case "set":
      return isSet(v);
    case "empty":
      return !isSet(v);
    case "is":
      return isSet(v) && text === target;
    case "isNot":
      return text !== target;
    case "contains":
      return target !== "" && text.includes(target);
    case "eq":
      return isSet(v) && Number.isFinite(num) && num === wantNum;
    case "neq":
      return !(isSet(v) && Number.isFinite(num) && num === wantNum);
    case "gt":
      return isSet(v) && Number.isFinite(num) && Number.isFinite(wantNum) && num > wantNum;
    case "lt":
      return isSet(v) && Number.isFinite(num) && Number.isFinite(wantNum) && num < wantNum;
    case "gte":
      return isSet(v) && Number.isFinite(num) && Number.isFinite(wantNum) && num >= wantNum;
    case "lte":
      return isSet(v) && Number.isFinite(num) && Number.isFinite(wantNum) && num <= wantNum;
    case "before":
      return isSet(v) && want !== "" && asText(v) < want;
    case "after":
      return isSet(v) && want !== "" && asText(v) > want;
    case "on":
      return v === true || v === "true";
    case "off":
      return !(v === true || v === "true");
    case "includes":
      return Array.isArray(v) ? v.some((x) => asText(x).toLowerCase() === target) : text === target;
    case "excludes":
      return Array.isArray(v) ? !v.some((x) => asText(x).toLowerCase() === target) : text !== target;
  }
}

/** A condition against a record: every rule (all) or one of them (any). */
export function evaluateCmsCondition(
  condition: CmsCondition,
  data: Record<string, unknown> | null | undefined,
  pageRecord?: Record<string, unknown> | null,
): boolean {
  const results = condition.rules.map((r) => evaluateCmsRule(r, data, pageRecord));
  return condition.match === "any" ? results.some(Boolean) : results.every(Boolean);
}

/** A record as a list query sees it: its data plus its own timestamps. */
export interface CmsQueryRecord {
  data: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

function sortValue(r: CmsQueryRecord, field: string): unknown {
  if (field === "_updated") return r.updatedAt;
  if (field === "_created") return r.createdAt;
  return cmsValueAt(r.data, field);
}

function compare(a: unknown, b: unknown): number {
  const as = isSet(a);
  const bs = isSet(b);
  if (!as || !bs) return as === bs ? 0 : as ? -1 : 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const an = Number(a);
  const bn = Number(b);
  if (typeof a !== "boolean" && Number.isFinite(an) && Number.isFinite(bn) && asText(a).trim() !== "" && asText(b).trim() !== "") return an - bn;
  return asText(a).localeCompare(asText(b));
}

export interface CmsListQuery {
  filter?: CmsCondition;
  sort?: readonly CmsListSortKey[];
  skip?: number;
  limit?: number;
}

/**
 * A Collection list's records: filter → sort → skip → limit. No query = the
 * records as given (today's order, newest first). Empty values sort last in
 * both directions.
 */
export function applyCmsListQuery<T extends CmsQueryRecord>(records: readonly T[], query: CmsListQuery, pageRecord?: Record<string, unknown> | null): T[] {
  let out = query.filter ? records.filter((r) => evaluateCmsCondition(query.filter as CmsCondition, r.data, pageRecord)) : [...records];
  const keys = query.sort ?? [];
  if (keys.length > 0) {
    out = out
      .map((r, i) => ({ r, i }))
      .sort((x, y) => {
        for (const k of keys) {
          const a = sortValue(x.r, k.field);
          const b = sortValue(y.r, k.field);
          const emptyA = !isSet(a);
          const emptyB = !isSet(b);
          if (emptyA !== emptyB) return emptyA ? 1 : -1;
          const c = compare(a, b);
          if (c !== 0) return k.dir === "desc" ? -c : c;
        }
        return x.i - y.i;
      })
      .map((x) => x.r);
  }
  const skip = Math.max(0, query.skip ?? 0);
  out = out.slice(skip);
  return query.limit !== undefined && query.limit > 0 ? out.slice(0, query.limit) : out;
}

/** The attribute the export writes on a template-page element whose condition
 *  the server evaluates per record (REQUESTS B-26). */
export const CMS_CONDITION_ATTR = "data-bk-if";

export function encodeCmsCondition(condition: CmsCondition): string {
  return encodeURIComponent(JSON.stringify(condition));
}

export function decodeCmsCondition(raw: string): CmsCondition | null {
  try {
    const parsed = cmsConditionSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
