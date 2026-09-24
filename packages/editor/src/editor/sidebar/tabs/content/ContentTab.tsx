/**
 * ContentTab — the Content panel (Figma boards 148:2…151:87, P3 build-out).
 *
 * The CMS drawer (v3 IA, 4428:140486). Its root lists the collections and
 * the Data rows; a collection opens in the CMS workspace beside it
 * (`editor/cms/CmsWorkspace`, which replaces the canvas + inspector), so the
 * drawer only drills into the Data views:
 *   sources     DataManager sources · + Add a source (JSON → importSampleData)
 *   variables   {{site.*}} key/values (persisted, registered as a live source)
 *   conditions  element condition bindings · + New condition (pick → expr)
 *
 * "Connect a source" is "+ Add a source (JSON)" — external connectors
 * (Sheets) aren't built.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, PanelHeader, SectionHeader, SkeletonBlock } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { ConditionExpression } from "@/shared/types/data";
import {
  getCmsHydrationStatus,
  onCmsHydrationChange,
  retryCmsHydration,
  type CmsHydrationStatus,
} from "@/services/cmsSync";
import { useContentPanel } from "./useContentPanel";
import { cmsWorkspace, useCmsWorkspace } from "@/editor/cms/cmsWorkspaceStore";
import {
  ConditionsView,
  RootView,
  CONTENT_BODY,
  SECTION_H,
  SourcesView,
  type SourceRowActions,
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
function SkeletonRow({ width, testId }: { width: string; testId: string }) {
  return (
    /* 32 tall on 16px gutters, exactly the List row it stands in for — it was
       12px gutters and 34 tall, so the rows it replaced moved sideways and up
       the moment data landed. */
    <div className="tw:flex tw:h-8 tw:items-center tw:gap-2 tw:px-4" data-testid={testId}>
      {/* 12 square at radius 3, and 10 tall at radius 4 — the board draws the
          glyph placeholder smaller than the glyph, not the same size. */}
      <SkeletonBlock className="tw:size-3 tw:flex-none tw:rounded-[3px]" data-testid={`${testId}-icon`} />
      <SkeletonBlock className={`tw:h-2.5 tw:rounded-[4px] ${width}`} data-testid={`${testId}-bar`} />
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
  const workspace = useCmsWorkspace();
  const { view, setView, reload } = panel;
  const [pickedElementId, setPickedElementId] = React.useState<string | null>(null);

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
  const sourceActions: SourceRowActions | undefined = composer
    ? {
        rename: (id, name) => {
          composer.data.renameSource(id, name);
          reload();
        },
        refresh: async (id) => {
          const pulled = await composer.data.refreshSource(id);
          if (pulled) reload();
          return pulled;
        },
        replaceData: (id, data) => {
          composer.data.updateSourceData(id, data);
          reload();
        },
        remove: (id) => {
          composer.data.unregisterSource(id);
          reload();
        },
      }
    : undefined;

  const selectElement = (id: string) => {
    const el = composer?.elements.getElement(id);
    if (el && composer) composer.selection.select(el);
  };


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
          <p className="tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error-text)]" data-testid="content-load-error-title">Couldn&apos;t load your collections.</p>
          <p className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]" data-testid="content-load-error-hint">
            This is a connection problem, not a change to your data.
          </p>
          <Button
            type="button"
            color="light"
            size="xs"
            variant="link" className="tw:min-h-6 tw:self-start"
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
          {/* 32, like the bands the loaded panel draws (148:7 / 148:23) — the
              shared SectionHeader is 28, so both bands grew 4px when the data
              landed, which is the reflow the skeleton exists to prevent. */}
          <SectionHeader tint className={SECTION_H} data-testid="content-section-collections">Collections</SectionHeader>
          {["tw:w-[92px]", "tw:w-[96px]", "tw:w-[110px]"].map((w, i) => (
            <SkeletonRow key={`c${i}`} width={w} testId={`content-skel-c${i}`} />
          ))}
          <SectionHeader tint className={SECTION_H} data-testid="content-section-data">Data</SectionHeader>
          {["tw:w-[110px]", "tw:w-[86px]", "tw:w-[124px]"].map((w, i) => (
            <SkeletonRow key={`d${i}`} width={w} testId={`content-skel-d${i}`} />
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
          selectedCollectionId={workspace.collectionId}
          /* v3 IA (4428:143182) — a collection opens in the workspace beside
             the drawer; the drawer stays on its list. */
          onOpenCollection={(id) => cmsWorkspace.openCollection(id)}
          onCreateCollection={onCreateCollection}
          onOpenSources={() => setView({ kind: "sources" })}
          onOpenVariables={() => setView({ kind: "variables" })}
          onOpenConditions={() => setView({ kind: "conditions" })}
        />
      );
      break;
    case "sources":
      body = (
        <SourcesView
          sources={panel.sources}
          onBack={() => setView({ kind: "root" })}
          onImportJson={importJson}
          actions={sourceActions}
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
        // v3 IA Q4 — the panel is the CMS; the rail says so, the header agrees.
        title="CMS"
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
