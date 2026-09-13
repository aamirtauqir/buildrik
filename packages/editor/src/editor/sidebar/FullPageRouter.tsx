/**
 * FullPageRouter — Routes fullpage-mode tabs (Templates, Assets)
 * Renders inside LayoutShell.FullPage slot when a fullpage tab is active.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "../shell/hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { IconConfig } from "../../shared/types/media";
import { Portal } from "@/editor/chrome-ui";

// Lazy-loaded fullpage tab components
const TemplatesTab = React.lazy(() => import("./tabs/templates/TemplatesTab"));
const LibraryManager = React.lazy(() =>
  import("../media/LibraryManager").then((m) => ({ default: m.LibraryManager }))
);
const SettingsTab = React.lazy(() => import("./tabs/settings/SettingsTab"));

/** Props shared across all fullpage tabs (no pin concept in fullpage mode) */
export interface FullPageCommonProps {
  onHelpClick?: () => void;
  onClose: () => void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string, edits: EditsSnapshot) => void | Promise<void>,
    options?: ImageEditorOptions,
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
}

export interface FullPageRouterProps {
  activeTab: GroupedTabId;
  /** Deep-link screen inside the active fullpage tab. */
  activeSubTab?: string;
  composer: Composer | null;
  commonTabProps: FullPageCommonProps;
  onSwitchToAdd?: () => void;
  onSwitchToDesign?: () => void;
  onReplayTour?: () => void;
  projectId?: string | null;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  onTemplatesSwitchTab?: (tab: string) => void;
}

export const FullPageRouter: React.FC<FullPageRouterProps> = ({
  activeTab,
  activeSubTab,
  composer,
  commonTabProps,
  onSwitchToAdd,
  onSwitchToDesign,
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

    /* Clone 3695:45155 — the Asset library is edge-to-edge: no rail, no
       topbar, its own Close. The V1 board (1159:4593) drew it inside the
       shell's 1380×844 band, which is what the LayoutShell slot gives; the
       Clone frames are 1440×900 with the SMART rail at x=0. So the library
       does not render into the slot at all — it portals a fixed host into the
       overlay root (Gate 22: `Portal`, not OverlayMount — the library owns
       its Escape and its modals, and a scrim it never asked for would close
       it on a stray click). */
    case "assets":
      return composer ? (
        <Portal>
          <div className="mgr-host" data-testid="mgr-host">
            <LibraryManager
              composer={composer}
              onClose={commonTabProps.onClose}
              onOpenImageEditor={commonTabProps.onOpenImageEditor}
              onOpenIconPicker={commonTabProps.onOpenIconPicker}
            />
          </div>
        </Portal>
      ) : null;

    // P5: Site settings graduated from the narrow drawer to a full-page surface
    // (authoritative IA 14-screen-specs.md:8 — "Site full-page = settings…").
    // SettingsTab is the same snav+pane component; it ignores the pin props, so
    // it renders unchanged at full width. FullPageView supplies the back/close.
    case "settings":
      return (
        <SettingsTab
          initialScreen={activeSubTab}
          composer={composer}
          projectId={projectId}
          onReplayTour={onReplayTour}
          onDirtyChange={onSettingsDirtyChange}
          onOpenDesignTab={onSwitchToDesign}
          onClose={commonTabProps.onClose}
          onHelpClick={commonTabProps.onHelpClick}
        />
      );

    default:
      return null;
  }
};
