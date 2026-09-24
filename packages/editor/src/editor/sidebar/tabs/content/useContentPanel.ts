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
import { EVENTS } from "@/shared/constants";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
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
  addField: (collectionId: string, field: Omit<CMSField, "id" | "order">) => Promise<void>;
  deleteField: (collectionId: string, fieldId: string) => Promise<void>;
  setVariables: (vars: SiteVariable[]) => void;
  removeCondition: (elementId: string) => void;
  addCondition: (elementId: string, expr: ConditionExpression) => void;
}

/** Board 151:87 names the row after the element itself — "Happy hour banner",
 *  "Sold-out badge" — not after its tag. The type was prefixed onto every row
 *  ("badge · Sold out"), which is the one word the reader already knows least
 *  about the thing being hidden, and it pushed the words that identify it
 *  towards the truncation. The type is still the whole label when the element
 *  carries no text of its own, which is the case the prefix was there for. */
function elementLabel(composer: Composer, id: string): string {
  const el = composer.elements.getElement(id);
  if (!el) return id;
  const content = (el.getContent?.() ?? "").replace(/<[^>]*>/g, "").trim().slice(0, 24);
  return content || el.getType?.() || "element";
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

  /* The collection whose records `records` holds, so an engine event can
     re-read the same list (the CMS workspace table and the drawer both read
     through this hook). */
  const recordsFor = React.useRef<string | null>(null);
  const loadRecords = React.useCallback(
    async (collectionId: string) => {
      if (!composer) return;
      recordsFor.current = collectionId;
      const rows = await composer.cms.collections.getContentItems(collectionId);
      if (recordsFor.current === collectionId) setRecords(rows);
    },
    [composer],
  );

  // Reload on engine CMS events (collection created via the shell modal, etc.).
  // NB: CollectionManager is its own emitter — subscribe there, not on composer.
  React.useEffect(() => {
    if (!composer) return;
    const cms = composer.cms.collections;
    const onChange = () => {
      reload();
      if (recordsFor.current) void loadRecords(recordsFor.current);
    };
    const cmsEvents = [
      EVENTS.CMS_COLLECTION_CREATED,
      EVENTS.CMS_COLLECTION_UPDATED,
      EVENTS.CMS_COLLECTION_DELETED,
      EVENTS.CMS_CONTENT_CREATED,
      EVENTS.CMS_CONTENT_UPDATED,
      EVENTS.CMS_CONTENT_DELETED,
      /* The server hydration lands after this panel's first read. */
      EVENTS.CMS_STORE_REFRESHED,
    ] as const;
    cmsEvents.forEach((ev) => cms.on(ev, onChange));

    /* Sources live on DataManager, which is a DIFFERENT emitter. A source
       registered or updated from anywhere else left the Sources view showing
       stale rows, and board 303:2083's "Watching for changes" is only true
       because the panel really is watching. */
    const dataEvents = [
      EVENTS.DATA_SOURCE_REGISTERED,
      EVENTS.DATA_SOURCE_UPDATED,
      EVENTS.DATA_SOURCE_UNREGISTERED,
      EVENTS.DATA_SAMPLE_IMPORTED,
    ] as const;
    dataEvents.forEach((ev) => composer.data.on(ev, onChange));

    return () => {
      cmsEvents.forEach((ev) => cms.off(ev, onChange));
      dataEvents.forEach((ev) => composer.data.off(ev, onChange));
    };
  }, [composer, reload, loadRecords]);

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
    async (collectionId: string, field: Omit<CMSField, "id" | "order">) => {
      if (!composer) return;
      const order = composer.cms.collections.getCollection(collectionId)?.fields.length ?? 0;
      await composer.cms.collections.addField(collectionId, { ...field, order });
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
