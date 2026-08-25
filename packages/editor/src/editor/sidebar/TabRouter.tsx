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
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { BlockData } from "../../shared/types";
import type { UsePublishJobResult } from "../shell/hooks/usePublishJob";
import { isFeatureEnabled } from "../../shared/utils/featureFlags";
import { exportPublishPages } from "../shell/exportPublishPages";

// Lazy-loaded panel tab components (code splitting)
const BuildTab = React.lazy(() => import("./tabs/build").then((m) => ({ default: m.BuildTab })));
const LayersTab = React.lazy(() => import("./tabs/layers/LayersTab"));
const PagesTab = React.lazy(() => import("./tabs/pages/PagesTab"));
const TemplatesTab = React.lazy(() =>
  import("./tabs/templates/TemplatesTab").then((m) => ({ default: m.TemplatesTab }))
);
const ComponentsTab = React.lazy(() => import("./tabs/ComponentsTab"));
const MediaTab = React.lazy(() =>
  import("./tabs/media/MediaTab").then((m) => ({ default: m.MediaTab }))
);
const PublishTab = React.lazy(() => import("./tabs/publish/PublishTab"));
const HistoryTab = React.lazy(() => import("./tabs/history/HistoryTab"));
const ReviewTab = React.lazy(() => import("./tabs/review/ReviewTab"));
const ContentTab = React.lazy(() => import("./tabs/content/ContentTab"));
const AITab = React.lazy(() =>
  import("./tabs/ai/AITab").then((m) => ({ default: m.AITab })),
);
const DesignSystemTab = React.lazy(() => import("@/editor/design-system/ui/DesignSystemTab"));

export interface TabRouterProps {
  activeTab: GroupedTabId;
  composer: Composer | null;
  commonTabProps: {
    isExpanded: boolean;
    onExpandToggle: () => void;
    onHelpClick?: () => void;
    onClose: () => void;
  };
  onBlockClick?: (data: BlockData) => void;
  onElementSelect?: (id: string) => void;
  canvasHoveredId?: string | null;
  onSwitchToAdd: () => void;
  onSwitchToTemplates?: () => void;
  onCreateComponent: () => void;
  projectId?: string | null;
  publishJob?: UsePublishJobResult;
  onVercelPublish?: () => Promise<void>;
  onTemplatesSwitchTab?: (tab: string) => void;
  /** Switches the assets tab from slim launcher to fullpage library manager. */
  onOpenLibrary?: (opts?: { searchQuery?: string; folderId?: string | null }) => void;
  /** §17 — opens ImageEditorModal for asset crop/rotate/adjust in panel-mode MediaTab. */
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  /** §20 — opens IconPickerModal from StockSourceModal "Browse full icon library". */
  onOpenIconPicker?: (
    currentIcon: import("../../shared/types/media").IconConfig | undefined,
    onSelect: (icon: import("../../shared/types/media").IconConfig) => void,
  ) => void;
  /** P0 review loop: full re-send (re-render snapshot + mint fresh token) for
   *  the Review panel — provided by the shell (same path as the topbar send). */
  onResendReview?: (clientEmail?: string) => Promise<void>;
  /** P4.2 Content tab: opens the shell CMS collection-setup modal (data-first
   *  create, no element selection). Absent → the Content create button hides. */
  onCreateCollection?: () => void;
  /** Deep-link sub-tab for the active panel — `openLeftPanelToTab(tab, subTab)`.
   *
   *  This chain existed but stopped one component short: `StudioPanels` took
   *  `leftPanelSubTab` and destructured it to `_leftPanelSubTab`, unused, so
   *  every sub-tab deep link opened the right panel at the wrong screen. Only
   *  History reads it today; other tabs ignore it until they need it. */
  activeSubTab?: string;
}

export const TabRouter: React.FC<TabRouterProps> = ({
  activeTab,
  composer,
  commonTabProps,
  onBlockClick,
  onElementSelect,
  canvasHoveredId,
  onSwitchToAdd,
  onSwitchToTemplates,
  onCreateComponent,
  projectId,
  publishJob,
  onVercelPublish,
  onTemplatesSwitchTab,
  onOpenLibrary,
  onOpenImageEditor,
  onOpenIconPicker,
  onResendReview,
  onCreateCollection,
  activeSubTab,
}) => {
  switch (activeTab) {
    case "add":
      return <BuildTab composer={composer} onBlockClick={onBlockClick} {...commonTabProps} />;

    case "templates":
      return (
        <TemplatesTab
          isExpanded={commonTabProps.isExpanded}
          onExpandToggle={commonTabProps.onExpandToggle}
          composer={composer}
          onTemplateUsed={onSwitchToAdd}
          onSwitchTab={onTemplatesSwitchTab}
          onClose={commonTabProps.onClose}
        />
      );

    case "ai":
      return <AITab composer={composer} {...commonTabProps} />;

    case "layers":
      return (
        <LayersTab
          composer={composer}
          onElementSelect={onElementSelect}
          canvasHoveredId={canvasHoveredId}
          onAddBlockClick={onSwitchToAdd}
          {...commonTabProps}
        />
      );

    case "pages":
      return (
        <PagesTab
          composer={composer}
          {...commonTabProps}
          onRequestTemplates={onSwitchToTemplates}
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
          {...commonTabProps}
        />
      );

    case "publish":
      // onVercelPublish gated on the same flag as the Topbar Publish dropdown
      // so the sidebar action only lights up when publishing is enabled.
      return (
        <PublishTab
          composer={composer}
          {...commonTabProps}
          projectId={projectId}
          publishJob={publishJob}
          onVercelPublish={isFeatureEnabled("publish") ? onVercelPublish : undefined}
        />
      );

    case "history":
      return (
        <HistoryTab
          composer={composer}
          projectId={projectId}
          initialView={activeSubTab === "published" ? "published" : undefined}
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
      return (
        <ReviewTab
          {...commonTabProps}
          composer={composer}
          onResend={onResendReview}
          /* Board 200:213's ReviewBar links straight to Compare, the same way
             the history tab deep-links to "published" two cases above. */
          initialCompare={activeSubTab === "compare"}
          onExportCurrentPages={composer ? () => exportPublishPages(composer) : undefined}
        />
      );

    case "content":
      return (
        <ContentTab composer={composer} onCreateCollection={onCreateCollection} {...commonTabProps} />
      );

    case "design":
      return <DesignSystemTab composer={composer} projectId={projectId} {...commonTabProps} />;

    default:
      return null;
  }
};
