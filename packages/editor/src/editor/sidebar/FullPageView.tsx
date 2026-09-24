/**
 * FullPageView — Container for fullpage-mode tabs
 * Renders inside LayoutShell.FullPage slot.
 * Provides consistent header and close action across Templates, Settings, History.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "../shell/hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { IconConfig } from "../../shared/types/media";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import { PanelSkeleton, SidebarErrorFallback } from "./SidebarFallbacks";
import { FullPageRouter } from "./FullPageRouter";
import type { SettingsOpenRequest } from "./tabs/settings/types";
import type { TemplatesOpenRequest } from "./tabs/templates/TemplatesTab";

export interface FullPageViewProps {
  activeTab: GroupedTabId;
  /** Deep-link screen inside the active fullpage tab — `openLeftPanelToTab(tab, subTab)`. */
  activeSubTab?: string;
  composer: Composer | null;
  onClose: () => void;
  onSwitchToAdd?: () => void;
  onSwitchToDesign?: () => void;
  projectId?: string | null;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  /** `ui:settings-open` — the screen (and repair draft) Settings opens on. */
  settingsOpen?: SettingsOpenRequest | null;
  onTemplatesSwitchTab?: (tab: string) => void;
  /** `ui:browse-templates` — what the door that opened Templates asked for. */
  templatesOpen?: TemplatesOpenRequest | null;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string, edits: EditsSnapshot) => void | Promise<void>,
    options?: ImageEditorOptions,
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void,
  ) => void;
}

export const FullPageView: React.FC<FullPageViewProps> = ({
  activeTab,
  activeSubTab,
  composer,
  onClose,
  onSwitchToAdd,
  onSwitchToDesign,
  projectId,
  onSettingsDirtyChange,
  settingsOpen,
  onTemplatesSwitchTab,
  templatesOpen,
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
            activeSubTab={activeSubTab}
            composer={composer}
            commonTabProps={commonTabProps}
            onSwitchToAdd={onSwitchToAdd}
            onSwitchToDesign={onSwitchToDesign}
            projectId={projectId}
            onSettingsDirtyChange={onSettingsDirtyChange}
            settingsOpen={settingsOpen}
            onTemplatesSwitchTab={onTemplatesSwitchTab}
            templatesOpen={templatesOpen}
          />
        </React.Suspense>
      </InspectorErrorBoundary>
    </div>
  );
};
