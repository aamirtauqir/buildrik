/**
 * useContentPanel — state + engine wiring for the Content panel drill-ins
 * (Figma boards 148:2…151:87). All data comes from the live engine:
 * collections/records/fields via composer.cms.collections, sources +
 * site variables via composer.data (DataManager), conditions from element
 * data-bindings. Variables persist editor-side and are re-registered as the
 * "site" object source on mount so {{site.*}} bindings resolve for real.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";
import type { ConditionBinding, ConditionExpression, DataSource } from "@/shared/types/data";
import {
  SITE_VARS_SOURCE_ID,
  loadSiteVariables,
  saveSiteVariables,
  variablesToSourceData,
  type SiteVariable,
} from "./contentPanelUtils";

export type ContentView =
  | { kind: "root" }
  | { kind: "collection"; id: string }
  | { kind: "record"; collectionId: string; recordId: string | null }
  | { kind: "fields"; collectionId: string }
  | { kind: "sources" }
  | { kind: "variables" }
  | { kind: "conditions" };

export interface ConditionRow {
  elementId: string;
  label: string;
  binding: ConditionBinding;
}

export interface UseContentPanelReturn {
  view: ContentView;
  setView: (v: ContentView) => void;
  collections: CMSCollection[];
  recordCounts: Record<string, number>;
  records: CMSContentItem[];
  sources: DataSource[];
  variables: SiteVariable[];
  conditions: ConditionRow[];
  reload: () => void;
  loadRecords: (collectionId: string) => Promise<void>;
  saveRecord: (
    collectionId: string,
    recordId: string | null,
    data: Record<string, unknown>,
    published: boolean,
  ) => Promise<CMSContentItem | null>;
  deleteRecord: (recordId: string) => Promise<void>;
  addField: (collectionId: string, name: string, type: string, required: boolean) => Promise<void>;
  deleteField: (collectionId: string, fieldId: string) => Promise<void>;
  setVariables: (vars: SiteVariable[]) => void;
  removeCondition: (elementId: string) => void;
  addCondition: (elementId: string, expr: ConditionExpression) => void;
}

function elementLabel(composer: Composer, id: string): string {
  const el = composer.elements.getElement(id);
  if (!el) return id;
  const type = el.getType?.() ?? "element";
  const content = (el.getContent?.() ?? "").replace(/<[^>]*>/g, "").trim().slice(0, 24);
  return content ? `${type} · ${content}` : type;
}

export function useContentPanel(composer: Composer | null): UseContentPanelReturn {
  const [view, setView] = React.useState<ContentView>({ kind: "root" });
  const [collections, setCollections] = React.useState<CMSCollection[]>([]);
  const [recordCounts, setRecordCounts] = React.useState<Record<string, number>>({});
  const [records, setRecords] = React.useState<CMSContentItem[]>([]);
  const [sources, setSources] = React.useState<DataSource[]>([]);
  const [variables, setVariablesState] = React.useState<SiteVariable[]>([]);
  const [conditions, setConditions] = React.useState<ConditionRow[]>([]);

  const projectId = composer?.getProjectMetadata?.()?.name ?? null;

  // Upsert — DataManager.registerSource THROWS on a duplicate id, so re-register
  // becomes updateSourceData (live-walk finding, 2026-07-25).
  const registerSiteSource = React.useCallback(
    (vars: SiteVariable[]) => {
      if (!composer) return;
      const data = variablesToSourceData(vars);
      if (composer.data.getSource(SITE_VARS_SOURCE_ID)) {
        composer.data.updateSourceData(SITE_VARS_SOURCE_ID, data);
      } else {
        composer.data.registerSource({
          id: SITE_VARS_SOURCE_ID,
          name: "Site variables",
          type: "object",
          data,
        });
      }
    },
    [composer],
  );

  const scanConditions = React.useCallback((): ConditionRow[] => {
    if (!composer) return [];
    const rows: ConditionRow[] = [];
    for (const el of composer.elements.getAllElements()) {
      const bindings = el.getDataBindings?.();
      if (!bindings) continue;
      for (const binding of Object.values(bindings)) {
        if (binding?.type === "condition") {
          rows.push({
            elementId: el.getId(),
            label: elementLabel(composer, el.getId()),
            binding: binding as ConditionBinding,
          });
        }
      }
    }
    return rows;
  }, [composer]);

  const reload = React.useCallback(() => {
    if (!composer) return;
    void composer.cms.collections.initialize().then(() => {
      const cols = composer.cms.collections.getAllCollections();
      setCollections(cols);
      void Promise.all(
        cols.map(async (c) => [c.id, (await composer.cms.collections.getContentItems(c.id)).length] as const),
      ).then((entries) => setRecordCounts(Object.fromEntries(entries)));
    });
    setSources(composer.data.getAllSources().filter((s) => s.id !== SITE_VARS_SOURCE_ID));
    setConditions(scanConditions());
  }, [composer, scanConditions]);

  // Mount: load persisted variables, register the live source, load the rest.
  React.useEffect(() => {
    const vars = loadSiteVariables(projectId);
    setVariablesState(vars);
    registerSiteSource(vars);
    reload();
  }, [projectId, registerSiteSource, reload]);

  const loadRecords = React.useCallback(
    async (collectionId: string) => {
      if (!composer) return;
      setRecords(await composer.cms.collections.getContentItems(collectionId));
    },
    [composer],
  );

  const saveRecord = React.useCallback(
    async (
      collectionId: string,
      recordId: string | null,
      data: Record<string, unknown>,
      published: boolean,
    ) => {
      if (!composer) return null;
      const status = published ? ("published" as const) : ("draft" as const);
      let item: CMSContentItem | null;
      if (recordId) {
        item = await composer.cms.collections.updateContentItem(recordId, { data, status });
      } else {
        item = await composer.cms.collections.createContentItem(collectionId, data);
        if (item && status !== "draft") {
          item = await composer.cms.collections.updateContentItem(item.id, { status });
        }
      }
      await loadRecords(collectionId);
      reload();
      return item;
    },
    [composer, loadRecords, reload],
  );

  const deleteRecord = React.useCallback(
    async (recordId: string) => {
      if (!composer) return;
      await composer.cms.collections.deleteContentItem(recordId);
      reload();
    },
    [composer, reload],
  );

  const addField = React.useCallback(
    async (collectionId: string, name: string, type: string, required: boolean) => {
      if (!composer) return;
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const order = composer.cms.collections.getCollection(collectionId)?.fields.length ?? 0;
      await composer.cms.collections.addField(collectionId, {
        name: name.trim(),
        slug,
        type: type as CMSCollection["fields"][number]["type"],
        order,
        ...(required ? { validation: { required: true } } : {}),
      });
      reload();
    },
    [composer, reload],
  );

  const deleteField = React.useCallback(
    async (collectionId: string, fieldId: string) => {
      if (!composer) return;
      await composer.cms.collections.deleteField(collectionId, fieldId);
      reload();
    },
    [composer, reload],
  );

  const setVariables = React.useCallback(
    (vars: SiteVariable[]) => {
      setVariablesState(vars);
      saveSiteVariables(projectId, vars);
      if (composer) registerSiteSource(vars);
    },
    [composer, projectId, registerSiteSource],
  );

  const removeCondition = React.useCallback(
    (elementId: string) => {
      if (!composer) return;
      const el = composer.elements.getElement(elementId);
      if (!el) return;
      const bindings = el.getDataBindings?.() ?? {};
      for (const [prop, binding] of Object.entries(bindings)) {
        if (binding?.type === "condition") el.removeDataBinding(prop);
      }
      setConditions(scanConditions());
    },
    [composer, scanConditions],
  );

  const addCondition = React.useCallback(
    (elementId: string, expr: ConditionExpression) => {
      if (!composer) return;
      const el = composer.elements.getElement(elementId);
      if (!el) return;
      composer.data.bindCondition(el, expr);
      setConditions(scanConditions());
    },
    [composer, scanConditions],
  );

  return {
    view,
    setView,
    collections,
    recordCounts,
    records,
    sources,
    variables,
    conditions,
    reload,
    loadRecords,
    saveRecord,
    deleteRecord,
    addField,
    deleteField,
    setVariables,
    removeCondition,
    addCondition,
  };
}
