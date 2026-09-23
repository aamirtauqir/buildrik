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
import type { SettingsOpenRequest } from "./tabs/settings/types";

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
  projectId?: string | null;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  /** `ui:settings-open` — the screen (and repair draft) Settings opens on. */
  settingsOpen?: SettingsOpenRequest | null;
  onTemplatesSwitchTab?: (tab: string) => void;
}

export const FullPageRouter: React.FC<FullPageRouterProps> = ({
  activeTab,
  activeSubTab,
  composer,
  commonTabProps,
  onSwitchToAdd,
  onSwitchToDesign,
  projectId,
  onSettingsDirtyChange,
  settingsOpen,
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

    /* Clone 3397:32011 — Settings is edge-to-edge the same way the library
       is: a 256 sidebar at x=0 whose `‹ Back to canvas` is the one door out,
       and a 1184 pane, which is the full 1440. Inside the slot it would have
       been 1123 under a topbar whose own `‹ Exit` sat beside Back to canvas.
       Same portal, same reason it is not an OverlayMount: the tab owns its
       Escape, its guard and its dialogs. */
    case "settings":
      return (
        <Portal>
          <div
            className="tw:fixed tw:inset-0 tw:z-[var(--bk-z-overlay)] tw:bg-[var(--bk-bg-panel)]"
            data-testid="set-host"
          >
            <SettingsTab
              initialScreen={activeSubTab}
              composer={composer}
              projectId={projectId}
              onDirtyChange={onSettingsDirtyChange}
              openRequest={settingsOpen}
              onOpenDesignTab={onSwitchToDesign}
              onClose={commonTabProps.onClose}
            />
          </div>
        </Portal>
      );

    default:
      return null;
  }
};
