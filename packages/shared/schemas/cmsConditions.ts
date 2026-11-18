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
  id?: string;
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
  /** "Exclude this page's record" (B5-D94): the record with this id is left out. */
  excludeId?: string | null;
}

/**
 * A Collection list's records: filter → sort → skip → limit. No query = the
 * records as given (today's order, newest first). Empty values sort last in
 * both directions.
 */
export function applyCmsListQuery<T extends CmsQueryRecord>(records: readonly T[], query: CmsListQuery, pageRecord?: Record<string, unknown> | null): T[] {
  let out = query.filter ? records.filter((r) => evaluateCmsCondition(query.filter as CmsCondition, r.data, pageRecord)) : [...records];
  if (query.excludeId) out = out.filter((r) => r.id !== query.excludeId);
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

/* ---------------------------------------------------------------------------
 * Per generated page (B-26 / B-27). A collection's template page is exported
 * once and filled once per record on the server (`generateDynamicPages`).
 * What depends on THAT record travels in the markup:
 *   data-bk-if="<condition>"        an element shown only when its condition
 *                                   holds on the page's record — or, with
 *   data-bk-if-row="<record fields>" an element of a list copy whose own
 *                                   condition compares the copy's record to
 *                                   the page's (`@page.*`): evaluated on that
 *                                   row, `@page.*` read from the page's record;
 *   data-bk-query="<list query>"    a Collection list whose filter reads the
 *                                   page's record (`@page.*`) or excludes it —
 *                                   its copies carry data-bk-item (the record
 *                                   id) and data-bk-row (the fields the filter
 *                                   reads), already sorted; the per-page pass
 *                                   filters, excludes, skips and takes Show.
 * `applyRecordPass` is that pass, over any DOM (the server's jsdom, the
 * editor's preview). One evaluator, one place.
 * ------------------------------------------------------------------------- */

export const CMS_CONDITION_ROW_ATTR = "data-bk-if-row";
export const CMS_LIST_QUERY_ATTR = "data-bk-query";
export const CMS_LIST_ITEM_ATTR = "data-bk-item";
export const CMS_LIST_ROW_ATTR = "data-bk-row";
/** B-30 (B5-D78): a Collection list's "No items" child — shown only when the
 *  list has no records, never repeated. */
export const CMS_LIST_EMPTY_ATTR = "data-bk-empty";

/** What a list hands the per-page pass. */
export interface CmsPageListQuery {
  filter?: CmsCondition;
  skip?: number;
  limit?: number;
  excludeCurrent?: boolean;
  /** "Hide list" when no record is left (B-30). */
  whenEmpty?: "hide";
}

const pageListQuerySchema = z.object({
  filter: cmsConditionSchema.optional(),
  skip: z.number().int().min(0).optional(),
  limit: z.number().int().min(0).optional(),
  excludeCurrent: z.boolean().optional(),
  whenEmpty: z.literal("hide").optional(),
});

export const encodeCmsJson = (value: unknown): string => encodeURIComponent(JSON.stringify(value));

function decodeJson(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

/** Does this exported page carry anything the per-page pass acts on? */
export function needsRecordPass(html: string): boolean {
  return html.includes(CMS_CONDITION_ATTR) || html.includes(CMS_LIST_QUERY_ATTR);
}

/** Does a condition compare against the page's own record (`@page.*`)? */
export function readsPageRecord(condition: CmsCondition | undefined): boolean {
  return Boolean(condition?.rules.some((r) => r.value?.startsWith("@page.")));
}

/** The fields a condition reads (the head of each dotted path). */
export function conditionFields(condition: CmsCondition | undefined): string[] {
  return condition ? [...new Set(condition.rules.map((r) => r.field.split(".")[0]))] : [];
}

/**
 * Apply one record to an exported template page: conditions decide their
 * elements, lists reduce their copies. Mutates `root`; every marker it reads
 * is removed. An undecodable marker keeps its element / copies (shown).
 */
export function applyRecordPass(root: { querySelectorAll(sel: string): ArrayLike<Element> }, record: Record<string, unknown>, recordId?: string | null): void {
  for (const el of Array.from(root.querySelectorAll(`[${CMS_CONDITION_ATTR}]`))) {
    const condition = decodeCmsCondition(el.getAttribute(CMS_CONDITION_ATTR) ?? "");
    const row = decodeJson(el.getAttribute(CMS_CONDITION_ROW_ATTR));
    el.removeAttribute(CMS_CONDITION_ATTR);
    el.removeAttribute(CMS_CONDITION_ROW_ATTR);
    const data = row && typeof row === "object" ? (row as Record<string, unknown>) : record;
    if (condition && !evaluateCmsCondition(condition, data, record)) el.remove();
  }
  for (const list of Array.from(root.querySelectorAll(`[${CMS_LIST_QUERY_ATTR}]`))) {
    const parsed = pageListQuerySchema.safeParse(decodeJson(list.getAttribute(CMS_LIST_QUERY_ATTR)));
    list.removeAttribute(CMS_LIST_QUERY_ATTR);
    const copies = Array.from(list.children).filter((c) => c.hasAttribute(CMS_LIST_ITEM_ATTR));
    if (parsed.success) {
      const q = parsed.data;
      /* One record may render as several nodes: decide per record, in order. */
      const order: string[] = [];
      const rows = new Map<string, Record<string, unknown>>();
      for (const c of copies) {
        const id = c.getAttribute(CMS_LIST_ITEM_ATTR) ?? "";
        if (!rows.has(id)) {
          order.push(id);
          const row = decodeJson(c.getAttribute(CMS_LIST_ROW_ATTR));
          rows.set(id, row && typeof row === "object" ? (row as Record<string, unknown>) : {});
        }
      }
      const kept = new Set(
        applyCmsListQuery(
          order.map((id) => ({ id, data: rows.get(id) ?? {} })),
          { filter: q.filter, skip: q.skip, limit: q.limit, excludeId: q.excludeCurrent ? (recordId ?? null) : null },
          record,
        ).map((r) => r.id),
      );
      for (const c of copies) if (!kept.has(c.getAttribute(CMS_LIST_ITEM_ATTR) ?? "")) c.remove();
    }
    for (const c of copies) {
      c.removeAttribute(CMS_LIST_ITEM_ATTR);
      c.removeAttribute(CMS_LIST_ROW_ATTR);
    }
    /* B-30: the "No items" block shows only when no record is left on this
       page; "Hide list" drops the list instead. */
    const left = copies.some((c) => c.parentNode === list);
    for (const slot of Array.from(list.children).filter((c) => c.hasAttribute(CMS_LIST_EMPTY_ATTR))) {
      if (left) slot.remove();
      else slot.removeAttribute(CMS_LIST_EMPTY_ATTR);
    }
    if (!left && parsed.success && parsed.data.whenEmpty === "hide") list.remove();
  }
}
