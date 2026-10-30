/**
 * useConditions — one element's visibility condition (B-11,
 * docs/design-2l9/engine-conditions.md) as the Content tab reads and writes
 * it: the condition, the record it is read against (the list's or the
 * template page's collection, previewed on its first published record), the
 * preview result, the pre-CMS "old Conditions" binding kept inactive, and the
 * writes — each one history step with its receipt.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection } from "@/shared/types/cms";
import type { ConditionBinding, ConditionExpression, ConditionOperator, LogicGroup } from "@/shared/types/data";
import { EVENTS } from "@/shared/constants/events";
import {
  evaluateCmsCondition,
  evaluateCmsRule,
  type CmsCondition,
  type CmsConditionOp,
  type CmsConditionRule,
} from "@buildrik/shared/schemas/cmsConditions";
import { recordContextOf } from "../binding/useCmsBinding";

const LEGACY_OPS: Partial<Record<ConditionOperator, CmsConditionOp>> = {
  exists: "set",
  empty: "empty",
  "==": "is",
  "!=": "isNot",
  contains: "contains",
  ">": "gt",
  "<": "lt",
  ">=": "gte",
  "<=": "lte",
};

const pathOf = (side: ConditionExpression["left"]): string | null =>
  typeof side === "string" ? side : side && typeof side === "object" && "path" in side && side.path ? String(side.path) : null;

/**
 * The old "Conditions" (DataManager.bindCondition) as the new rule model, or
 * null when it does not convert (a nested group, startsWith / endsWith, a
 * non-path left side).
 */
export function convertLegacyCondition(legacy: ConditionExpression | LogicGroup): CmsCondition | null {
  const exprs: ConditionExpression[] =
    "conditions" in legacy ? (legacy.conditions.every((c) => !("conditions" in c)) ? (legacy.conditions as ConditionExpression[]) : []) : [legacy];
  if (exprs.length === 0 || exprs.length > 10) return null;
  const rules: CmsConditionRule[] = [];
  for (const e of exprs) {
    const op = LEGACY_OPS[e.operator];
    const field = pathOf(e.left);
    if (!op || !field) return null;
    const right = e.right;
    rules.push(right === undefined || typeof right === "object" ? { field, op } : { field, op, value: String(right) });
  }
  return { match: "conditions" in legacy && legacy.operator === "OR" ? "any" : "all", rules };
}

/** "opening_hours.sunday" → "Sunday"; a field slug → its name. */
export function ruleLabel(rule: Pick<CmsConditionRule, "field">, collection: CMSCollection | null): string {
  const field = collection?.fields.find((f) => f.slug === rule.field);
  if (field) return field.name;
  const last = rule.field.split(".").pop() ?? rule.field;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/_/g, " ");
}

export interface ConditionsState {
  condition: CmsCondition | null;
  collection: CMSCollection | null;
  record: { id: string; data: Record<string, unknown> } | null;
  /** The preview record's result; null when there is no record to read. */
  passes: boolean | null;
  /** The first rule that fails on the preview record. */
  failing: CmsConditionRule | null;
  legacy: { expression: ConditionExpression | LogicGroup; converted: CmsCondition | null } | null;
  set: (next: CmsCondition | null, label: string) => boolean;
  activateLegacy: () => boolean;
  removeLegacy: () => void;
}

export function useConditions(composer: Composer | null | undefined, elementId: string): ConditionsState {
  const [tick, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    if (!composer) return;
    const evs = [EVENTS.CMS_CONDITION_CHANGED, EVENTS.ELEMENT_UPDATED, EVENTS.PROJECT_LOADED, EVENTS.CMS_COLLECTION_BOUND, EVENTS.CMS_PREVIEW_RECORD_CHANGED];
    evs.forEach((e) => composer.on(e, bump));
    return () => evs.forEach((e) => composer.off(e, bump));
  }, [composer]);

  const condition = composer?.cms?.bindings?.getCondition?.(elementId) ?? null;
  const collection = recordContextOf(composer, elementId);
  const [record, setRecord] = React.useState<ConditionsState["record"]>(null);
  React.useEffect(() => {
    let live = true;
    setRecord(null);
    if (!composer || !collection) return;
    /* The record the canvas previews (the record bar's choice, 173:12022). */
    const read = composer.cms.bindings.getPreviewRecord
      ? composer.cms.bindings.getPreviewRecord(collection.id)
      : composer.cms.collections.queryContent({ collectionId: collection.id, status: "published", filter: {} }).then((r) => r.items[0] ?? null);
    void read
      .then((first) => {
        if (live) setRecord(first ? { id: first.id, data: first.data } : null);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [composer, collection?.id, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const el = composer?.elements.getElement(elementId);
  const legacyBinding = el?.getDataBinding?.("condition") as ConditionBinding | undefined;
  const legacy = legacyBinding?.condition ? { expression: legacyBinding.condition, converted: convertLegacyCondition(legacyBinding.condition) } : null;

  const passes = condition && record ? evaluateCmsCondition(condition, record.data) : null;
  const failing = condition && record && passes === false ? (condition.rules.find((r) => !evaluateCmsRule(r, record.data)) ?? null) : null;

  return {
    condition,
    collection,
    record,
    passes,
    failing,
    legacy,
    set: (next, label) => Boolean(composer?.cms.bindings.setCondition(elementId, next, label)),
    activateLegacy: () => {
      if (!composer || !legacy?.converted || !el) return false;
      /* One step: the legacy binding goes and the rule arrives together. */
      composer.history?.flushPending?.();
      composer.beginTransaction("Activate legacy condition");
      try {
        el.removeDataBinding?.("condition");
        return composer.cms.bindings.setCondition(elementId, legacy.converted);
      } finally {
        composer.endTransaction();
      }
    },
    removeLegacy: () => {
      if (!composer || !el) return;
      composer.history?.flushPending?.();
      composer.beginTransaction("Remove legacy condition");
      try {
        el.removeDataBinding?.("condition");
        composer.markDirty();
      } finally {
        composer.endTransaction();
      }
    },
  };
}
