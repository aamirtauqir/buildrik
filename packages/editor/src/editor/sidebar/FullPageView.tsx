/**
 * FullPageView — Container for fullpage-mode tabs (Templates, Assets,
 * Settings, Design — FullPageRouter's cases; History is a right-column mode
 * and never reaches here).
 * Renders inside LayoutShell.FullPage slot: an error boundary + Suspense
 * fallback around FullPageRouter. It does NOT provide a shared header or
 * close action — each screen draws its own nav with its own way back and
 * owns its own Escape/dialogs. Assets, Settings and Brand render in this slot
 * (the resource area); Templates portals edge-to-edge. Takeover shape 1 of 3
 * (see "THE TAKEOVER SHAPES" at the top of FullPageRouter.tsx).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "../shell/hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import type { Composer } from "@/engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { IconConfig } from "@/shared/types/media";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import { PanelSkeleton, SidebarErrorFallback } from "./SidebarFallbacks";
import { PanelChunkBoundary } from "@/editor/shell/PanelChunkBoundary";
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
        <PanelChunkBoundary>
        <React.Suspense fallback={<PanelSkeleton />}>
          <FullPageRouter
            activeTab={activeTab}
            activeSubTab={activeSubTab}
            composer={composer}
            commonTabProps={commonTabProps}
            onSwitchToAdd={onSwitchToAdd}
            onSwitchToDesign={onSwitchToDesign}
            projectId={projectId}
            settingsOpen={settingsOpen}
            onTemplatesSwitchTab={onTemplatesSwitchTab}
            templatesOpen={templatesOpen}
          />
        </React.Suspense>
        </PanelChunkBoundary>
      </InspectorErrorBoundary>
    </div>
  );
};
