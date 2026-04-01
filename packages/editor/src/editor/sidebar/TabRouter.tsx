/**
 * TabRouter — Switch/case tab routing for LeftSidebar
 * Maps GroupedTabId to lazy-loaded tab components.
 * All 10 tabs wired: add | templates | layers | pages | components | assets | design | settings | publish | history
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { BlockData } from "../../shared/types";
import type { PublishResult } from "../../shared/hooks/usePublish";

// Lazy-loaded tab components (code splitting)
const BuildTab = React.lazy(() => import("./tabs/build").then((m) => ({ default: m.BuildTab })));
const TemplatesTab = React.lazy(() => import("./tabs/templates/TemplatesTab"));
const LayersTab = React.lazy(() => import("./tabs/layers/LayersTab"));
const PagesTab = React.lazy(() => import("./tabs/pages/PagesTab"));
const ComponentsTab = React.lazy(() => import("./tabs/ComponentsTab"));
const MediaTab = React.lazy(() =>
  import("./tabs/media/MediaTab").then((m) => ({ default: m.MediaTab }))
);
const DesignSystemTab = React.lazy(() => import("./tabs/DesignSystemTab"));
const SettingsTab = React.lazy(() => import("./tabs/settings/SettingsTab"));
const PublishTab = React.lazy(() => import("./tabs/publish/PublishTab"));
const HistoryTab = React.lazy(() => import("./tabs/history/HistoryTab"));

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
  onReplayTour,
  projectId,
  onPublish,
  onUnpublish,
  onSettingsDirtyChange,
  onTemplatesSwitchTab,
}) => {
  switch (activeTab) {
    case "add":
      return <BuildTab composer={composer} onBlockClick={onBlockClick} {...commonTabProps} />;

    case "templates":
      return (
        <TemplatesTab
          composer={composer}
          onTemplateUsed={onSwitchToAdd}
          onSwitchTab={onTemplatesSwitchTab}
          {...commonTabProps}
        />
      );

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

    case "design":
      return <DesignSystemTab composer={composer} {...commonTabProps} />;

    case "settings":
      return <SettingsTab composer={composer} onReplayTour={onReplayTour} {...commonTabProps} projectId={projectId} onDirtyChange={onSettingsDirtyChange} />;

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
      return <HistoryTab composer={composer} {...commonTabProps} projectId={projectId} />;

    default:
      return null;
  }
};
