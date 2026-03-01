/**
 * TabRouter — Switch/case tab routing for LeftSidebar
 * Maps GroupedTabId to lazy-loaded tab components.
 * All 10 tabs wired: add | templates | layers | pages | components | assets | design | settings | publish | history
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../../shared/constants/tabs";
import type { BlockData } from "../../shared/types";

// Lazy-loaded tab components (code splitting)
const BuildTab = React.lazy(() => import("./tabs/build").then((m) => ({ default: m.BuildTab })));
const TemplatesTab = React.lazy(() => import("./tabs/templates/TemplatesTab"));
const LayersTab = React.lazy(() => import("./tabs/LayersTab"));
const PagesTab = React.lazy(() => import("./tabs/PagesTab"));
const ComponentsTab = React.lazy(() => import("./tabs/ComponentsTab"));
const MediaTab = React.lazy(() =>
  import("./tabs/media/MediaTab").then((m) => ({ default: m.MediaTab }))
);
const DesignSystemTab = React.lazy(() => import("./tabs/DesignSystemTab"));
const SettingsTab = React.lazy(() => import("./tabs/SettingsTab"));
const PublishTab = React.lazy(() => import("./tabs/PublishTab"));
const HistoryTab = React.lazy(() => import("./tabs/HistoryTab"));

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
  onCreateComponent: () => void;
}

export const TabRouter: React.FC<TabRouterProps> = ({
  activeTab,
  composer,
  commonTabProps,
  onBlockClick,
  onElementSelect,
  canvasHoveredId,
  onSwitchToAdd,
  onCreateComponent,
}) => {
  switch (activeTab) {
    case "add":
      return <BuildTab composer={composer} onBlockClick={onBlockClick} {...commonTabProps} />;

    case "templates":
      return <TemplatesTab composer={composer} />;

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
      return <PagesTab composer={composer} {...commonTabProps} />;

    case "components":
      return (
        <ComponentsTab composer={composer} onCreateNew={onCreateComponent} {...commonTabProps} />
      );

    case "assets":
      return <MediaTab composer={composer} {...commonTabProps} />;

    case "design":
      return <DesignSystemTab composer={composer} {...commonTabProps} />;

    case "settings":
      return <SettingsTab composer={composer} {...commonTabProps} />;

    case "publish":
      return <PublishTab composer={composer} {...commonTabProps} />;

    case "history":
      return <HistoryTab composer={composer} {...commonTabProps} />;

    default:
      return null;
  }
};
