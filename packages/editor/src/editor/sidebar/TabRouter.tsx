/**
 * TabRouter — Panel-mode tab routing for LeftSidebar
 * Maps GroupedTabId to lazy-loaded panel tab components.
 * Handles panel-mode tabs (Add, Media, Layers, Pages, Components, Design, History).
 * Fullpage tabs (Templates, Settings) are handled by FullPageRouter.
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
import type { UsePublishJobResult } from "../shell/hooks/usePublishJob";
import { isFeatureEnabled } from "../../shared/utils/featureFlags";

// Lazy-loaded panel tab components (code splitting)
const BuildTab = React.lazy(() => import("./tabs/build").then((m) => ({ default: m.BuildTab })));
const LayersTab = React.lazy(() => import("./tabs/layers/LayersTab"));
const PagesTab = React.lazy(() => import("./tabs/pages/PagesTab"));
const TemplatesTab = React.lazy(() =>
  import("./tabs/templates/TemplatesTab").then((m) => ({ default: m.TemplatesTab }))
);
const ComponentsTab = React.lazy(() => import("./tabs/ComponentsTab"));
const ComponentsPanelV2 = React.lazy(() =>
  import("@/editor/components-catalog/ui/ComponentsPanelV2").then((m) => ({ default: m.ComponentsPanelV2 })),
);
const MediaTab = React.lazy(() =>
  import("./tabs/media/MediaTab").then((m) => ({ default: m.MediaTab }))
);
const PublishTab = React.lazy(() => import("./tabs/publish/PublishTab"));
const HistoryTab = React.lazy(() => import("./tabs/history/HistoryTab"));
const SettingsTab = React.lazy(() => import("./tabs/settings/SettingsTab"));
const AITab = React.lazy(() =>
  import("./tabs/ai/AITab").then((m) => ({ default: m.AITab })),
);
const DesignSystemTab = React.lazy(() => import("@/editor/design-system/ui/DesignSystemTab"));

export interface TabRouterProps {
  activeTab: GroupedTabId;
  composer: Composer | null;
  commonTabProps: {
    isPinned: boolean;
    onPinToggle: () => void;
    onHelpClick?: () => void;
    onClose: () => void;
  };
  onBlockClick?: (data: BlockData) => void;
  onElementSelect?: (id: string) => void;
  canvasHoveredId?: string | null;
  onSwitchToAdd: () => void;
  onSwitchToTemplates?: () => void;
  onSwitchToDesign?: () => void;
  onCreateComponent: () => void;
  onReplayTour?: () => void;
  projectId?: string | null;
  publishJob?: UsePublishJobResult;
  onVercelPublish?: () => Promise<void>;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  onTemplatesSwitchTab?: (tab: string) => void;
  /** Switches the assets tab from slim launcher to fullpage library manager. */
  onOpenLibrary?: (opts?: { searchQuery?: string; folderId?: string | null }) => void;
  /** §17 — opens ImageEditorModal for asset crop/rotate/adjust in panel-mode MediaTab. */
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  /** §20 — opens IconPickerModal from StockSourceModal "Browse full icon library". */
  onOpenIconPicker?: (
    currentIcon: import("../../shared/types/media").IconConfig | undefined,
    onSelect: (icon: import("../../shared/types/media").IconConfig) => void,
  ) => void;
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
  onSwitchToDesign,
  onCreateComponent,
  projectId,
  publishJob,
  onVercelPublish,
  onSettingsDirtyChange,
  onTemplatesSwitchTab,
  onReplayTour,
  onOpenLibrary,
  onOpenImageEditor,
  onOpenIconPicker,
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
          onClose={commonTabProps.onClose}
        />
      );

    case "ai":
      return <AITab composer={composer} {...commonTabProps} />;

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
      // S6: dual-section panel (Catalog + UserSaved + DSStatusChip) gated
      // behind VITE_FEATURE_COMPONENTS_V2. Default OFF — legacy single-section
      // ComponentsTab keeps shipping until the new path passes browser smoke.
      if (isFeatureEnabled("componentsV2")) {
        return (
          <ComponentsPanelV2
            composer={composer}
            onJumpToDesign={onSwitchToDesign}
            {...commonTabProps}
          />
        );
      }
      return (
        <ComponentsTab composer={composer} onCreateNew={onCreateComponent} {...commonTabProps} />
      );

    case "assets":
      return (
        <MediaTab
          composer={composer}
          onOpenLibrary={onOpenLibrary}
          onOpenImageEditor={onOpenImageEditor}
          onOpenIconPicker={onOpenIconPicker}
          {...commonTabProps}
        />
      );

    case "publish":
      // onVercelPublish gated on the same flag as the Topbar Publish dropdown
      // so the sidebar action only lights up when publishing is enabled.
      return (
        <PublishTab
          composer={composer}
          {...commonTabProps}
          projectId={projectId}
          publishJob={publishJob}
          onVercelPublish={isFeatureEnabled("publish") ? onVercelPublish : undefined}
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
          onOpenDesignTab={onSwitchToDesign}
          {...commonTabProps}
        />
      );

    case "design":
      return <DesignSystemTab composer={composer} {...commonTabProps} />;

    default:
      return null;
  }
};
