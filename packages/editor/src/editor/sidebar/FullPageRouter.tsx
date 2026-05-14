/**
 * FullPageRouter — Routes fullpage-mode tabs (Templates, Assets)
 * Renders inside LayoutShell.FullPage slot when a fullpage tab is active.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { IconConfig } from "../../shared/types/media";

// Lazy-loaded fullpage tab components
const TemplatesTab = React.lazy(() => import("./tabs/templates/TemplatesTab"));
const LibraryManager = React.lazy(() =>
  import("../media/LibraryManager").then((m) => ({ default: m.LibraryManager }))
);

/** Props shared across all fullpage tabs (no pin concept in fullpage mode) */
export interface FullPageCommonProps {
  onHelpClick: () => void;
  onClose: () => void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
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
}) => {
  switch (activeTab) {
    case "templates":
      return (
        <TemplatesTab
          composer={composer}
          onTemplateUsed={onSwitchToAdd}
          {...commonTabProps}
        />
      );

    case "assets":
      return composer ? (
        <LibraryManager
          composer={composer}
          onClose={commonTabProps.onClose}
          onOpenImageEditor={commonTabProps.onOpenImageEditor}
          onOpenIconPicker={commonTabProps.onOpenIconPicker}
        />
      ) : null;

    default:
      return null;
  }
};
