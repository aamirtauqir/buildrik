/**
 * FullPageView — Container for fullpage-mode tabs
 * Renders inside LayoutShell.FullPage slot.
 * Provides consistent header and close action across Templates, Settings, History.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { IconConfig } from "../../shared/types/media";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import { PanelSkeleton, SidebarErrorFallback } from "./SidebarFallbacks";
import { FullPageRouter } from "./FullPageRouter";

export interface FullPageViewProps {
  activeTab: GroupedTabId;
  composer: Composer | null;
  onClose: () => void;
  onSwitchToAdd?: () => void;
  onReplayTour?: () => void;
  projectId?: string | null;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  onTemplatesSwitchTab?: (tab: string) => void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void,
  ) => void;
}

export const FullPageView: React.FC<FullPageViewProps> = ({
  activeTab,
  composer,
  onClose,
  onSwitchToAdd,
  onReplayTour,
  projectId,
  onSettingsDirtyChange,
  onTemplatesSwitchTab,
  onOpenImageEditor,
  onOpenIconPicker,
}) => {
  const [errorKey, setErrorKey] = React.useState(0);

  const commonTabProps = {
    onClose,
    onOpenImageEditor,
    onOpenIconPicker,
  };

  return (
    <div className="ls-fullpage-container">
      <InspectorErrorBoundary
        key={errorKey}
        fallback={
          <SidebarErrorFallback onRetry={() => setErrorKey((k) => k + 1)} />
        }
      >
        <React.Suspense fallback={<PanelSkeleton />}>
          <FullPageRouter
            activeTab={activeTab}
            composer={composer}
            commonTabProps={commonTabProps}
            onSwitchToAdd={onSwitchToAdd}
            onReplayTour={onReplayTour}
            projectId={projectId}
            onSettingsDirtyChange={onSettingsDirtyChange}
            onTemplatesSwitchTab={onTemplatesSwitchTab}
          />
        </React.Suspense>
      </InspectorErrorBoundary>
    </div>
  );
};
