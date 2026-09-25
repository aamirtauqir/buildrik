/**
 * TabRouter — Panel-mode tab routing for LeftSidebar
 * Maps GroupedTabId to lazy-loaded panel tab components.
 * Handles panel-mode tabs (Add, Media, Layers, Pages, Components, Design, History).
 * Fullpage tabs (Templates, Settings) are handled by FullPageRouter.
 *
 * Tab lifecycle note: this router mounts one panel tab at a time via a
 * `switch` and unmounts the previous tab on every nav click. An earlier
 * revision tried to keep-mount tabs across switches using a
 * `display: contents` wrapper, but that broke the flex height chain of
 * the enclosing `.ls-panel-animate` → `.bld-container` layout, collapsing
 * the scroll area to ~16px. The perf win from cross-tab caching was not
 * worth the layout regression, so we keep the simple switch.
 *
 * The per-tab bottlenecks previously hidden by this remount pattern are
 * addressed at the component level instead (SvgIcon memoization, catalog
 * pre-grouping, conditional CatAccordion mounts, lazy SectionsMode), so
 * reopening Add/Layers is now cheap even with a fresh mount.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "../shell/hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { BlockData } from "../../shared/types";
import type { UsePublishJobResult } from "../shell/hooks/usePublishJob";
import type { NextMove } from "../shell/lifecycle";
import type { PageSettingsOpenRequest } from "./tabs/pages/types";
import { isFeatureEnabled } from "../../shared/utils/featureFlags";
import { FROM_ACTIVITY } from "./tabs/activity/BackToActivityRow";

/** History's deep-link sub-screen: "published", or an Activity row's
 *  "from-activity:published" / "from-activity:session". */
function historyView(sub: string | undefined): "published" | "session" | undefined {
  const view = sub?.startsWith(`${FROM_ACTIVITY}:`) ? sub.slice(FROM_ACTIVITY.length + 1) : sub;
  return view === "published" || view === "session" ? view : undefined;
}

// Lazy-loaded panel tab components (code splitting)
const BuildTab = React.lazy(() => import("./tabs/build").then((m) => ({ default: m.BuildTab })));
const LayersTab = React.lazy(() => import("./tabs/layers/LayersTab"));
const PagesTab = React.lazy(() => import("./tabs/pages/PagesTab"));
const ComponentsTab = React.lazy(() => import("./tabs/ComponentsTab"));
const MediaTab = React.lazy(() =>
  import("./tabs/media/MediaTab").then((m) => ({ default: m.MediaTab }))
);
const PublishTab = React.lazy(() => import("./tabs/publish/PublishTab"));
const HistoryTab = React.lazy(() => import("./tabs/history/HistoryTab"));
const ActivityTab = React.lazy(() => import("./tabs/activity/ActivityTab").then((m) => ({ default: m.ActivityTab })));
const ReviewTab = React.lazy(() => import("./tabs/review/ReviewTab"));
const ContentTab = React.lazy(() => import("./tabs/content/ContentTab"));

export interface TabRouterProps {
  activeTab: GroupedTabId;
  composer: Composer | null;
  commonTabProps: {
    isOpen?: boolean;
    isExpanded: boolean;
    /** Absent for panels hosted in the inspector column — no 700 expand there. */
    onExpandToggle?: () => void;
    onHelpClick?: () => void;
    onClose: () => void;
  };
  onBlockClick?: (data: BlockData) => void;
  onElementSelect?: (id: string) => void;
  canvasHoveredId?: string | null;
  onSwitchToTemplates?: () => void;
  /** Site menu › Unpublish asked for the confirm before PublishTab existed.
   *  Same one-tab-at-a-time race as above; same answer — a prop the always-
   *  mounted sidebar owns, consumed once by the tab it was meant for. */
  unpublishIntent?: boolean;
  onUnpublishIntentConsumed?: () => void;
  onCreateComponent: () => void;
  projectId?: string | null;
  publishJob?: UsePublishJobResult;
  /** The site's ONE next move + the ONE publish door (B4) — see StudioPanels. */
  nextMove?: NextMove | null;
  onRequestPublish?: () => void;
  /** Switches the assets tab from slim launcher to fullpage library manager. */
  onOpenLibrary?: (opts?: { searchQuery?: string; folderId?: string | null }) => void;
  /** §17 — opens ImageEditorModal for asset crop/rotate/adjust in panel-mode MediaTab. */
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string, edits: EditsSnapshot) => void | Promise<void>,
    options?: ImageEditorOptions,
  ) => void;
  /** §20 — opens IconPickerModal from StockSourceModal "Browse full icon library". */
  onOpenIconPicker?: (
    currentIcon: import("../../shared/types/media").IconConfig | undefined,
    onSelect: (icon: import("../../shared/types/media").IconConfig) => void,
  ) => void;
  /** P0 review loop: full re-send (re-render snapshot + mint fresh token) for
   *  the Review panel — provided by the shell (same path as the topbar send). */
  onResendReview?: (clientEmail?: string) => Promise<{ inviteEmailSent: boolean | null } | void>;
  /** P4.2 Content tab: opens the shell CMS collection-setup modal (data-first
   *  create, no element selection). Absent → the Content create button hides. */
  onCreateCollection?: () => void;
  /** FB-4: the agency review layer's server flag. `null`/`false`/absent
   *  renders nothing for the "review" tab id — no client feature flag gates
   *  it today, so a workspace without the layer must not be able to reach
   *  the panel at all once every door is closed. */
  reviewsEnabled?: boolean | null;
  /** Deep-link sub-tab for the active panel — `openLeftPanelToTab(tab, subTab)`.
   *
   *  This chain existed but stopped one component short: `StudioPanels` took
   *  `leftPanelSubTab` and destructured it to `_leftPanelSubTab`, unused, so
   *  every sub-tab deep link opened the right panel at the wrong screen. Only
   *  History reads it today; other tabs ignore it until they need it. */
  activeSubTab?: string;
  /** `ui:pages-open-settings`, held by the shell for the Pages panel. */
  pagesOpen?: PageSettingsOpenRequest | null;
}

export const TabRouter: React.FC<TabRouterProps> = ({
  activeTab,
  composer,
  commonTabProps,
  onBlockClick,
  onElementSelect,
  canvasHoveredId,
  onSwitchToTemplates,
  unpublishIntent,
  onUnpublishIntentConsumed,
  onCreateComponent,
  projectId,
  publishJob,
  nextMove,
  onRequestPublish,
  onOpenLibrary,
  onOpenImageEditor,
  onOpenIconPicker,
  onResendReview,
  onCreateCollection,
  reviewsEnabled,
  activeSubTab,
  pagesOpen,
}) => {
  switch (activeTab) {
    case "add":
      return <BuildTab composer={composer} onBlockClick={onBlockClick} {...commonTabProps} />;

    case "layers":
      return (
        <LayersTab
          composer={composer}
          onElementSelect={onElementSelect}
          canvasHoveredId={canvasHoveredId}
          {...commonTabProps}
        />
      );

    case "pages":
      return (
        <PagesTab
          composer={composer}
          {...commonTabProps}
          onRequestTemplates={onSwitchToTemplates}
          openSettingsRequest={pagesOpen}
        />
      );

    case "components":
      /* One panel, both paths. There were two: ComponentsPanelV2 behind
         VITE_FEATURE_COMPONENTS_V2, and this one when the flag was off. Only
         the NEXT_PUBLIC_ half of a flag reaches production, and nothing ever
         set it — so the port-5050 demo rendered V2 while every real user got
         this, and only this one was ever built to board 641:2546. V2 and the
         flag are deleted. */
      return (
        <ComponentsTab composer={composer} onCreateNew={onCreateComponent} {...commonTabProps} />
      );

    case "assets":
      return (
        <MediaTab
          composer={composer}
          onOpenLibrary={onOpenLibrary}
          onOpenImageEditor={onOpenImageEditor}
          onOpenIconPicker={onOpenIconPicker}
          initialStockQuery={activeSubTab?.startsWith("stock") ? activeSubTab.slice(6) : undefined}
          {...commonTabProps}
        />
      );

    case "publish":
      // The publish door is gated on the same flag as the topbar CTA, so the
      // sidebar action only lights up when publishing is enabled.
      return (
        <PublishTab
          composer={composer}
          {...commonTabProps}
          projectId={projectId}
          publishJob={publishJob}
          nextMove={nextMove ?? null}
          onRequestPublish={isFeatureEnabled("publish") ? onRequestPublish : undefined}
          initialUnpublish={unpublishIntent}
          onUnpublishIntentConsumed={onUnpublishIntentConsumed}
        />
      );

    case "activity":
      return <ActivityTab composer={composer} projectId={projectId} onClose={commonTabProps.onClose} />;

    case "history":
      return (
        <HistoryTab
          composer={composer}
          projectId={projectId}
          initialView={historyView(activeSubTab)}
          fromActivity={activeSubTab?.startsWith(`${FROM_ACTIVITY}:`) ?? false}
          /* Boards 184:37 / 184:45 / 453:4064 read the same job the Publish
             panel polls — one source, two surfaces. */
          rollbackJob={
            /* Gated on there BEING a job. `uiState` alone is "published" for
               any already-live site with nothing in flight, so the panel used
               to read a success that predated the rollback and announce it at
               T+0s. A job id means the server actually started one. */
            publishJob?.jobId &&
            (publishJob.uiState === "publishing" ||
              publishJob.uiState === "published" ||
              publishJob.uiState === "failed")
              ? { state: publishJob.uiState, progress: publishJob.progress }
              : null
          }
          /* The rollback creates its own publish job; adopt it so the boards
             above watch the real thing. */
          onRollbackStarted={(jobId) => publishJob?.track(jobId)}
          {...commonTabProps}
        />
      );

    case "review":
      /* FB-4: no client gate existed — the panel rendered regardless of the
         server's agency_layer flag. The topbar Review pill stays visible
         either way (owner decision); this only closes the panel door. */
      if (!reviewsEnabled) return null;
      return (
        <ReviewTab
          {...commonTabProps}
          composer={composer}
          fromActivity={activeSubTab === FROM_ACTIVITY}
          onResend={onResendReview}
        />
      );

    case "content":
      return (
        <ContentTab composer={composer} onCreateCollection={onCreateCollection} {...commonTabProps} />
      );

    default:
      return null;
  }
};
