/**
 * FullPageRouter — Routes fullpage-mode tabs (Templates, Settings, History, Design)
 * Renders inside LayoutShell.FullPage slot when a fullpage tab is active.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";

// Lazy-loaded fullpage tab components
const TemplatesTab = React.lazy(() => import("./tabs/templates/TemplatesTab"));
const DesignSystemTab = React.lazy(() => import("./tabs/DesignSystemTab"));
const SettingsTab = React.lazy(() => import("./tabs/settings/SettingsTab"));
const HistoryTab = React.lazy(() => import("./tabs/history/HistoryTab"));

/** Props shared across all fullpage tabs (no pin concept in fullpage mode) */
export interface FullPageCommonProps {
  onHelpClick: () => void;
  onClose: () => void;
}

export interface FullPageRouterProps {
  activeTab: GroupedTabId;
  composer: Composer | null;
  commonTabProps: FullPageCommonProps;
  onSwitchToAdd?: () => void;
  onReplayTour?: () => void;
  projectId?: string | null;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  onTemplatesSwitchTab?: (tab: string) => void;
}

export const FullPageRouter: React.FC<FullPageRouterProps> = ({
  activeTab,
  composer,
  commonTabProps,
  onSwitchToAdd,
  onReplayTour,
  projectId,
  onSettingsDirtyChange,
  onTemplatesSwitchTab,
}) => {
  switch (activeTab) {
    case "templates":
      return (
        <TemplatesTab
          composer={composer}
          onTemplateUsed={onSwitchToAdd}
          onSwitchTab={onTemplatesSwitchTab}
          {...commonTabProps}
        />
      );

    case "design":
      return <DesignSystemTab composer={composer} {...commonTabProps} />;

    case "settings":
      return (
        <SettingsTab
          composer={composer}
          onReplayTour={onReplayTour}
          {...commonTabProps}
          projectId={projectId}
          onDirtyChange={onSettingsDirtyChange}
        />
      );

    case "history":
      return <HistoryTab composer={composer} {...commonTabProps} projectId={projectId} />;

    default:
      return null;
  }
};
