/**
 * ContentTab — the Content panel (Figma boards 148:2…151:87, P3 build-out).
 *
 * Drill-in views over the live engine:
 *   root        collections (+ counts) · Data: Sources / Variables / Conditions
 *   collection  records list · + Add · Fields ›
 *   record      field form + Published toggle + unsaved savebar
 *   fields      field list · + Add field
 *   sources     DataManager sources · + Add a source (JSON → importSampleData)
 *   variables   {{site.*}} key/values (persisted, registered as a live source)
 *   conditions  element condition bindings · + New condition (pick → expr)
 *
 * Deliberate divergences from the boards (documented in the audit doc):
 * "Dynamic pages ›" row omitted (no edit path for an existing collection's
 * page settings yet); "Connect a source" is "+ Add a source (JSON)" — external
 * connectors (Sheets) aren't built.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, PanelHeader, SectionHeader, SkeletonBlock, BK_LINK_BUTTON_CLASS } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import type { Composer } from "@/engine";
import type { ConditionExpression } from "@/shared/types/data";
import {
  getCmsHydrationStatus,
  onCmsHydrationChange,
  retryCmsHydration,
  type CmsHydrationStatus,
} from "@/services/cmsSync";
import { useContentPanel } from "./useContentPanel";
import {
  CollectionView,
  DynamicPagesView,
  ConditionsView,
  FieldsView,
  RecordView,
  RootView,
  CONTENT_BODY,
  SourcesView,
  VariablesView,
} from "./ContentViews";

export interface ContentTabProps {
  composer: Composer | null;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Opens the CMS collection setup (shell-owned modal) — the data-first create
   *  path, no element selection required. Absent → the create button hides. */
  onCreateCollection?: () => void;
  /**
   * Overrides the live CMS hydration status. The status is module state in
   * `cmsSync` (one hydrate per session, shared by every consumer), so the only
   * way to render the loading and error screens for measurement is to inject
   * it. Absent in the app — the live status wins there.
   */
  hydrationStatus?: CmsHydrationStatus;
}

/** One placeholder row of the Content root: the row glyph, then the label bar.
 *  Board 775:4241 keeps both, so the skeleton occupies the same box the real
 *  row will. */
function SkeletonRow({ width }: { width: string }) {
  return (
    <div className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2.5">
      <SkeletonBlock className="tw:size-3.5 tw:flex-none tw:rounded-sm" />
      <SkeletonBlock className={`tw:h-3 ${width}`} />
    </div>
  );
}

export const ContentTab: React.FC<ContentTabProps> = ({
  composer,
  hydrationStatus,
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
  onCreateCollection,
}) => {
  const panel = useContentPanel(composer);
  const { view, setView, reload } = panel;
  const [pickedElementId, setPickedElementId] = React.useState<string | null>(null);

  // Reload on engine CMS events (collection created via the shell modal, etc.).
  // NB: CollectionManager is its own emitter — subscribe there, not on composer.
  React.useEffect(() => {
    if (!composer) return;
    const cms = composer.cms.collections;
    const onChange = () => reload();
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

    /* Sources live on DataManager, which is a DIFFERENT emitter, and nothing
       here was subscribed to it — the Sources view only ever refreshed because
       importJson and removeSource call reload() by hand. A source registered or
       updated from anywhere else left this panel showing stale rows with no
       sign anything had happened.

       Subscribing is also what makes board 303:2083's "Watching for changes"
       true rather than decorative: the panel really is watching now. */
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
  }, [composer, reload]);

  // "+ New condition" pick flow — reuses the inspector's canvas pick mode.
  React.useEffect(() => {
    if (!composer) return;
    const onResult = (id: unknown) => {
      if (typeof id === "string" && view.kind === "conditions") setPickedElementId(id);
    };
    composer.on("inspector:pick-result", onResult);
    return () => {
      composer.off("inspector:pick-result", onResult);
    };
  }, [composer, view.kind]);

  const startPick = () => composer?.emit("inspector:pick-start");
  const cancelPick = () => {
    composer?.emit("inspector:pick-cancel");
    setPickedElementId(null);
  };

  const importJson = (json: string): string | null => {
    if (!composer) return "Editor not ready.";
    try {
      composer.data.importSampleData(json);
      reload();
      return null;
    } catch {
      return "Not valid JSON — check the syntax and try again.";
    }
  };

  /* Board 151:46 puts a `⋯` on each source row. DataManager.unregisterSource
     has existed since the manager shipped and no UI ever called it, so a source
     could be added and never removed. */
  const removeSource = (id: string) => {
    if (!composer) return;
    composer.data.unregisterSource(id);
    reload();
  };

  const selectElement = (id: string) => {
    const el = composer?.elements.getElement(id);
    if (el && composer) composer.selection.select(el);
  };

  const collectionFor = (id: string) => panel.collections.find((c) => c.id === id) ?? null;

  const [liveHydration, setLiveHydration] = React.useState<CmsHydrationStatus>(() =>
    getCmsHydrationStatus(),
  );
  React.useEffect(() => onCmsHydrationChange(setLiveHydration), []);
  const hydration = hydrationStatus ?? liveHydration;

  /*
    Board `775:4241` (loading) and `453:4010` (load-error). Until hydration
    settles, "no collections" is not a fact about the workspace — it is the
    absence of an answer, and `hydrateCmsFromServer` used to swallow its own
    failure so the panel said "No collections yet" to users whose collections
    were sitting on a server it could not reach. The error copy names that
    explicitly, because the first thing someone thinks when a content list
    empties is that they lost data.
  */
  let body: React.ReactNode = null;
  if (view.kind === "root" && hydration !== "ready" && panel.collections.length === 0) {
    body =
      hydration === "error" ? (
        <div className="tw:flex tw:flex-col tw:gap-1.5 tw:px-6 tw:pb-8 tw:pt-9" data-testid="content-load-error" role="alert">
          <p className="tw:text-[13px] tw:leading-5 tw:text-red-700">Couldn&apos;t load your collections.</p>
          <p className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
            This is a connection problem, not a change to your data.
          </p>
          <Button
            type="button"
            color="light"
            size="xs"
            className={`${BK_LINK_BUTTON_CLASS} tw:self-start`}
            data-testid="content-load-retry"
            onClick={() => void retryCmsHydration()}
          >
            Try again
          </Button>
        </div>
      ) : (
        /* Board 775:4241 draws the ROOT'S OWN STRUCTURE with skeletons inside
           it — the COLLECTIONS and DATA bands are already there, and each
           placeholder row carries the row glyph as well as the label bar. The
           flat list of four bars this replaces reflowed the whole panel the
           moment data landed, which is the one thing a skeleton exists to
           prevent. */
        <div data-testid="content-loading" aria-busy="true" aria-label="Loading collections">
          <SectionHeader tint>Collections</SectionHeader>
          {["tw:w-40", "tw:w-24", "tw:w-44"].map((w, i) => (
            <SkeletonRow key={`c${i}`} width={w} />
          ))}
          <SectionHeader tint>Data</SectionHeader>
          {["tw:w-28", "tw:w-20", "tw:w-36"].map((w, i) => (
            <SkeletonRow key={`d${i}`} width={w} />
          ))}
        </div>
      );
  } else switch (view.kind) {
    case "root":
      body = (
        <RootView
          collections={panel.collections}
          recordCounts={panel.recordCounts}
          sourcesCount={panel.sources.length}
          variablesCount={panel.variables.length}
          conditionsCount={panel.conditions.length}
          onOpenCollection={(id) => {
            void panel.loadRecords(id);
            setView({ kind: "collection", id });
          }}
          onCreateCollection={onCreateCollection}
          onOpenSources={() => setView({ kind: "sources" })}
          onOpenVariables={() => setView({ kind: "variables" })}
          onOpenConditions={() => setView({ kind: "conditions" })}
        />
      );
      break;
    case "collection": {
      const collection = collectionFor(view.id);
      body = collection ? (
        <CollectionView
          collection={collection}
          records={panel.records}
          onBack={() => setView({ kind: "root" })}
          onOpenRecord={(recordId) => setView({ kind: "record", collectionId: view.id, recordId })}
          onAddRecord={() => setView({ kind: "record", collectionId: view.id, recordId: null })}
          onOpenFields={() => setView({ kind: "fields", collectionId: view.id })}
          onOpenDynamicPages={() => setView({ kind: "dynamic-pages", collectionId: view.id })}
        />
      ) : null;
      break;
    }
    case "record": {
      const collection = collectionFor(view.collectionId);
      const record = view.recordId ? panel.records.find((r) => r.id === view.recordId) ?? null : null;
      body = collection ? (
        <RecordView
          collection={collection}
          record={record}
          onBack={() => setView({ kind: "collection", id: view.collectionId })}
          onSave={async (data, published) => {
            await panel.saveRecord(view.collectionId, view.recordId, data, published);
            setView({ kind: "collection", id: view.collectionId });
          }}
          onDelete={
            view.recordId
              ? () => {
                  void panel.deleteRecord(view.recordId as string).then(() => {
                    void panel.loadRecords(view.collectionId);
                    setView({ kind: "collection", id: view.collectionId });
                  });
                }
              : undefined
          }
        />
      ) : null;
      break;
    }
    case "fields": {
      const collection = collectionFor(view.collectionId);
      body = collection ? (
        <FieldsView
          collection={collection}
          onBack={() => setView({ kind: "collection", id: view.collectionId })}
          onAddField={(name, type, required) => panel.addField(view.collectionId, name, type, required)}
          onDeleteField={(fieldId) => panel.deleteField(view.collectionId, fieldId)}
        />
      ) : null;
      break;
    }
    case "dynamic-pages": {
      const collection = collectionFor(view.collectionId);
      body = collection ? (
        <DynamicPagesView
          collection={collection}
          records={panel.records}
          onBack={() => setView({ kind: "collection", id: view.collectionId })}
          onSave={async (pattern) => {
            if (!composer) return;
            /* Empty clears the binding rather than storing "" — a collection
               with an empty pattern is one that generates nothing, and the
               field is optional in the model. */
            await composer.cms.collections.updateCollection(view.collectionId, {
              pageSlugPattern: pattern || undefined,
            });
            reload();
          }}
        />
      ) : null;
      break;
    }
    case "sources":
      body = (
        <SourcesView
          sources={panel.sources}
          onBack={() => setView({ kind: "root" })}
          onImportJson={importJson}
          onRemoveSource={removeSource}
        />
      );
      break;
    case "variables":
      body = (
        <VariablesView
          variables={panel.variables}
          onBack={() => setView({ kind: "root" })}
          onChange={panel.setVariables}
        />
      );
      break;
    case "conditions":
      body = (
        <ConditionsView
          conditions={panel.conditions}
          onBack={() => {
            cancelPick();
            setView({ kind: "root" });
          }}
          onRemove={panel.removeCondition}
          onSelectElement={selectElement}
          onStartPick={startPick}
          pickedElementId={pickedElementId}
          onCancelPick={cancelPick}
          onCreate={(expr: ConditionExpression) => {
            if (pickedElementId) {
              panel.addCondition(pickedElementId, expr);
              setPickedElementId(null);
            }
          }}
        />
      );
      break;
  }

  return (
    <div className={CONTENT_BODY}>
      <PanelHeader
        title="Content"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      {body}
    </div>
  );
};

export default ContentTab;
