/**
 * TabRouter — Panel-mode tab routing for LeftSidebar
 * Maps GroupedTabId to lazy-loaded panel tab components.
 * Only handles panel-mode tabs (Add, Media, Layers, Pages, Components, History).
 * Fullpage tabs (Templates, Settings, Design) are handled by FullPageRouter.
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
import type { PublishResult } from "../../shared/hooks/usePublish";

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
const SettingsTab = React.lazy(() => import("./tabs/settings/SettingsTab"));

export interface TabRouterProps {
  activeTab: GroupedTabId;
  composer: Composer | null;
  commonTabProps: {
    isPinned: boolean;
    onPinToggle: () => void;
    onHelpClick: () => void;
    onClose: () => void;
  };
  onBlockClick?: (data: BlockData) => void;
  onElementSelect?: (id: string) => void;
  canvasHoveredId?: string | null;
  onSwitchToAdd: () => void;
  onSwitchToTemplates?: () => void;
  onCreateComponent: () => void;
  onReplayTour?: () => void;
  projectId?: string | null;
  onPublish?: (projectId: string) => Promise<PublishResult>;
  onUnpublish?: (projectId: string) => Promise<void>;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  onTemplatesSwitchTab?: (tab: string) => void;
  /** Whether AI suggestions in the Add tab are enabled */
  aiEnabled?: boolean;
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
  onPublish,
  onUnpublish,
  onSettingsDirtyChange,
  onReplayTour,
  aiEnabled,
}) => {
  switch (activeTab) {
    case "add":
      return <BuildTab composer={composer} onBlockClick={onBlockClick} {...commonTabProps} aiEnabled={aiEnabled} />;

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
      return (
        <ComponentsTab composer={composer} onCreateNew={onCreateComponent} {...commonTabProps} />
      );

    case "assets":
      return <MediaTab composer={composer} {...commonTabProps} />;

    case "publish":
      return (
        <PublishTab
          composer={composer}
          {...commonTabProps}
          projectId={projectId}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
        />
      );

    case "history":
      return <HistoryTab composer={composer} projectId={projectId} {...commonTabProps} />;

    case "settings":
      return (
        <SettingsTab
          composer={composer}
          projectId={projectId}
          onReplayTour={onReplayTour}
          onDirtyChange={onSettingsDirtyChange}
          {...commonTabProps}
        />
      );

    default:
      return null;
  }
};
