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
import { PanelHeader } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import type { Composer } from "@/engine";
import type { ConditionExpression } from "@/shared/types/data";
import { useContentPanel } from "./useContentPanel";
import {
  CollectionView,
  ConditionsView,
  FieldsView,
  RecordView,
  RootView,
  S,
  SourcesView,
  VariablesView,
} from "./ContentViews";

export interface ContentTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Opens the CMS collection setup (shell-owned modal) — the data-first create
   *  path, no element selection required. Absent → the create button hides. */
  onCreateCollection?: () => void;
}

export const ContentTab: React.FC<ContentTabProps> = ({
  composer,
  isPinned,
  onPinToggle,
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
    ] as const;
    cmsEvents.forEach((ev) => cms.on(ev, onChange));
    return () => {
      cmsEvents.forEach((ev) => cms.off(ev, onChange));
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

  const selectElement = (id: string) => {
    const el = composer?.elements.getElement(id);
    if (el && composer) composer.selection.select(el);
  };

  const collectionFor = (id: string) => panel.collections.find((c) => c.id === id) ?? null;

  let body: React.ReactNode = null;
  switch (view.kind) {
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
    case "sources":
      body = <SourcesView sources={panel.sources} onBack={() => setView({ kind: "root" })} onImportJson={importJson} />;
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
    <div style={S.body}>
      <PanelHeader
        title="Content"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      {body}
    </div>
  );
};

export default ContentTab;
