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
import type { SiteVariable } from "@/shared/types/project";
import type { DataSource } from "@/shared/types/data";
import { CMS_CONDITION_OP_LABEL, OPS_WITH_VALUE, type CmsCondition } from "@buildrik/shared/schemas/cmsConditions";
import {
  consumeDirectSync,
  isCmsConflictPending,
  markDirectSync,
  syncEntryUpsert,
  takeCmsInvalid,
} from "@/services/cmsSync";
import {
  SITE_VARS_SOURCE_ID,
  loadLegacySiteVariables,
  variablesToSourceData,
} from "./contentPanelUtils";

export type ContentView =
  | { kind: "root" }
  | { kind: "sources" };

/** One element condition in the site-wide index (176:21830): where it is,
 *  and whether it is active or a legacy rule waiting for review. */
export interface ConditionRow {
  elementId: string;
  pageId: string | null;
  /** "Blog post › Heading" */
  label: string;
  state: "active" | "legacy";
  /** Active: the rule ("opening_hours.sunday is set"). */
  summary: string;
}

export interface SaveRecordResult {
  item: CMSContentItem | null;
  reached: boolean;
  conflict: boolean;
  /** The server refused the record under the collection's rules — its reason. */
  invalid: string | null;
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
  ) => Promise<SaveRecordResult>;
  deleteRecord: (recordId: string) => Promise<void>;
  addField: (collectionId: string, field: Omit<CMSField, "id" | "order">) => Promise<void>;
  deleteField: (collectionId: string, fieldId: string) => Promise<void>;
  setVariables: (vars: SiteVariable[]) => void;
}

/** Board 151:87 names the row after the element itself — "Happy hour banner",
 *  "Sold-out badge" — not after its tag. The type was prefixed onto every row
 *  ("badge · Sold out"), which is the one word the reader already knows least
 *  about the thing being hidden, and it pushed the words that identify it
 *  towards the truncation. The type is still the whole label when the element
 *  carries no text of its own, which is the case the prefix was there for. */
/** The page that holds an element: walk up to a page root. */
function pageOf(composer: Composer, id: string): { id: string; name: string } | null {
  const roots = new Map(composer.elements.getAllPages().map((p) => [p.root.id, p]));
  let el = composer.elements.getElement(id);
  while (el) {
    const page = roots.get(el.getId());
    if (page) return { id: page.id, name: page.name };
    el = el.getParent?.() ?? undefined;
  }
  return null;
}

/** The element as the board names it: its kind ("Heading"), not its text. */
function elementKind(composer: Composer, id: string): string {
  const type = composer.elements.getElement(id)?.getType?.() ?? "element";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function cmsConditionSummary(condition: CmsCondition): string {
  return condition.rules
    .map((r) => [r.field, CMS_CONDITION_OP_LABEL[r.op], OPS_WITH_VALUE.has(r.op) ? r.value : ""].filter(Boolean).join(" "))
    .join(condition.match === "all" ? " and " : " or ");
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

  /* Every element condition on the site (176:21830): the element's own
     condition (Inspector › Content › Conditions), else a legacy condition
     binding that is inactive until reviewed there. */
  const scanConditions = React.useCallback((): ConditionRow[] => {
    if (!composer) return [];
    const rows: ConditionRow[] = [];
    for (const el of composer.elements.getAllElements()) {
      const id = el.getId();
      const condition = composer.cms?.bindings?.getCondition?.(id) ?? null;
      const legacy = Object.values(el.getDataBindings?.() ?? {}).some((b) => b?.type === "condition");
      if (!condition && !legacy) continue;
      const page = pageOf(composer, id);
      rows.push({
        elementId: id,
        pageId: page?.id ?? null,
        label: `${page?.name ?? "Page"} › ${elementKind(composer, id)}`,
        state: condition ? "active" : "legacy",
        summary: condition ? cmsConditionSummary(condition) : "",
      });
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
    /* Variables live in the project (saved with it, so export and publish
       see them). A site that still has them only in this browser's
       localStorage moves them into the project once. */
    let vars = composer?.getProjectSettings()?.siteVariables;
    if (!vars && composer) {
      const legacy = loadLegacySiteVariables(projectId);
      if (legacy.length) composer.setProjectSettings({ ...composer.getProjectSettings(), siteVariables: legacy });
      vars = legacy;
    }
    vars = vars ?? [];
    setVariablesState(vars);
    registerSiteSource(vars);
    reload();
  }, [composer, projectId, registerSiteSource, reload]);

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
    ): Promise<SaveRecordResult> => {
      if (!composer) return { item: null, reached: true, conflict: false, invalid: null };
      const status = published ? ("published" as const) : ("draft" as const);
      /* P0-B audit 2026-09-30: the sheet's save needs to know whether the
         mirror landed on the server, so it fires the sync DIRECTLY for a
         reach signal, and `markDirectSync` makes the event-driven mirror in
         `useCmsSync` skip its own POST for this id. The mark has to be set
         BEFORE the engine write: the write emits its event while it runs, so
         a mark set afterwards was never seen — every save POSTed twice (C0.3
         live 2026-10-02). A new record's id is reserved first for the same
         reason, and the record is created straight into its status in one
         write (CMS-01: create-then-publish left a draft behind on a refused
         publish, and each Retry made another). */
      const cms = composer.cms.collections;
      const id = recordId ?? cms.nextId();
      let item: CMSContentItem | null = null;
      let reached = true;
      markDirectSync("entry", id);
      try {
        item = recordId
          ? await cms.updateContentItem(recordId, { data, status })
          : await cms.createContentItem(collectionId, data, { status, id });
        if (item) reached = await syncEntryUpsert(item);
      } finally {
        /* A write that threw (validation) never emitted — drop the mark so it
           can't swallow a later, unrelated mirror. */
        consumeDirectSync("entry", id);
      }
      await loadRecords(collectionId);
      reload();
      /* Not reached because the server refused this copy (another device
         changed the record) — a different sentence from "not reached yet". */
      const conflict = !reached && item !== null && isCmsConflictPending("entry", item.id);
      const invalid = !reached && item !== null ? takeCmsInvalid("entry", item.id) : null;
      return { item, reached, conflict, invalid };
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

  /* Two readers hold this hook (the drawer and the CMS workspace's Site
     variables page, B5-V01); a write through either lands in the project,
     so each re-reads it there. */
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => {
      const vars = composer.getProjectSettings()?.siteVariables;
      if (vars) setVariablesState((prev) => (prev === vars ? prev : vars));
    };
    composer.on(EVENTS.PROJECT_CHANGED, sync);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, sync);
    };
  }, [composer]);

  /* The conditions index follows edits made in the Inspector. */
  React.useEffect(() => {
    if (!composer) return;
    const rescan = () => setConditions(scanConditions());
    composer.on(EVENTS.CMS_CONDITION_CHANGED, rescan);
    return () => {
      composer.off(EVENTS.CMS_CONDITION_CHANGED, rescan);
    };
  }, [composer, scanConditions]);

  const setVariables = React.useCallback(
    (vars: SiteVariable[]) => {
      setVariablesState(vars);
      if (!composer) return;
      composer.setProjectSettings({ ...composer.getProjectSettings(), siteVariables: vars });
      registerSiteSource(vars);
    },
    [composer, registerSiteSource],
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
  };
}
