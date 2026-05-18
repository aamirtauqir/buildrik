import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * LeftSidebar — Merged rail + panel component
 * Rail: 60px icon navigation with 3 zones (creation, structure, config)
 * Panel: Variable-width drawer with header, pin, close, and tab content
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./LeftSidebar.css";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants/events";
import type { GroupedTabId, TabZone } from "../rail/tabsConfig";
import { getTabWidth, getTabConfig, getTabsByZone } from "../rail/tabsConfig";
import type { BlockData } from "../../shared/types";
import type { PublishResult } from "../../shared/hooks/usePublish";
import { ConfirmDialog } from "@/shared/extensions/ConfirmDialog";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import { PanelSkeleton, SidebarErrorFallback } from "./SidebarFallbacks";
import { TabRouter } from "./TabRouter";
import { useSidebarKeyboard } from "./useSidebarKeyboard";
import {
  Plus,
  LayoutGrid,
  Image,
  Layers,
  File,
  Diamond,
  Palette,
  Settings,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================
// Icon map — lucide icon name → component
// ============================================

const ICON_MAP: Record<string, LucideIcon> = {
  Plus,
  LayoutGrid,
  Image,
  Layers,
  File,
  Diamond,
  Palette,
  Settings,
  Timer,
};

// ============================================
// Types
// ============================================

export interface LeftSidebarProps {
  composer: Composer | null;
  activeTab: GroupedTabId;
  onTabChange: (tab: GroupedTabId) => void;
  drawerOpen: boolean;
  onDrawerToggle: () => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onElementSelect?: (elementId: string) => void;
  onBlockClick?: (block: BlockData) => void;
  canvasHoveredId?: string | null;
  onReplayTour?: () => void;
  projectId?: string | null;
  onPublish?: (projectId: string) => Promise<PublishResult>;
  onUnpublish?: (projectId: string) => Promise<void>;
  onExportForDeploy?: () => Promise<{
    files: Array<{ path: string; content: string }>;
    projectName?: string;
  }>;
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

// ============================================
// Zone rendering
// ============================================

const ZONES: TabZone[] = ["creation", "structure", "config"];

// Stable empty set — avoids allocating a new Set on every render
const EMPTY_SET: ReadonlySet<string> = new Set();
// Stable set for when settings tab has unsaved changes
const SETTINGS_DIRTY_SET: ReadonlySet<string> = new Set(["settings"]);

function RailZone({
  zone,
  activeTab,
  drawerOpen,
  onBtnClick,
  dirtyTabIds,
}: {
  zone: TabZone;
  activeTab: GroupedTabId;
  drawerOpen: boolean;
  onBtnClick: (tabId: GroupedTabId) => void;
  dirtyTabIds?: ReadonlySet<string>;
}) {
  const tabs = React.useMemo(() => getTabsByZone(zone), [zone]);

  return (
    <div className="ls-zone">
      {tabs.map((tab) => {
        const Icon = ICON_MAP[tab.iconName];
        if (!Icon) return null;
        const isSelectedTab = tab.id === activeTab;
        const isVisibleActive = isSelectedTab && drawerOpen;
        const isDirty = dirtyTabIds?.has(tab.id) ?? false;

        return (
          <Button
            key={tab.id}
            className={`ls-btn${isSelectedTab ? " ls-btn--active" : ""}${!drawerOpen && isSelectedTab ? " ls-btn--last" : ""}`}
            onClick={() => onBtnClick(tab.id)}
            role="tab"
            aria-selected={isVisibleActive}
            aria-label={tab.ariaLabel}
            data-tab={tab.id}
          >
            {isVisibleActive && <div className="ls-btn-bar" />}
            {isDirty && <div className="ls-btn__dirty-dot" aria-hidden="true" />}
            <Icon size={20} />
          </Button>
        );
      })}
    </div>
  );
}

// ============================================
// LeftSidebar Component
// ============================================

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  composer,
  activeTab,
  onTabChange,
  drawerOpen,
  onDrawerToggle,
  isPinned: controlledPinned,
  onPinToggle: controlledPinToggle,
  onElementSelect,
  onBlockClick,
  canvasHoveredId,
  onReplayTour,
  projectId,
  onPublish,
  onUnpublish,
  onExportForDeploy,
  onOpenLibrary,
  onOpenImageEditor,
  onOpenIconPicker,
}) => {
  const navRef = React.useRef<HTMLElement>(null);
  const panelContentRef = React.useRef<HTMLDivElement>(null);
  const [errorKey, setErrorKey] = React.useState(0);

  // Pin state (controlled or internal fallback)
  const [internalPinned, setInternalPinned] = React.useState(true);
  const isPinned = controlledPinned ?? internalPinned;
  const onPinToggle = controlledPinToggle ?? (() => setInternalPinned((p) => !p));

  // Settings dirty-state guard
  const [settingsDirty, setSettingsDirty] = React.useState(false);
  const [tabGuard, setTabGuard] = React.useState<{
    open: boolean;
    pendingTab: GroupedTabId | null;
  }>({ open: false, pendingTab: null });

  const safeTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      if (activeTab === "settings" && settingsDirty) {
        setTabGuard({ open: true, pendingTab: tab });
      } else {
        onTabChange(tab);
      }
    },
    [activeTab, onTabChange, settingsDirty]
  );

  const confirmTabSwitch = React.useCallback(() => {
    const dest = tabGuard.pendingTab;
    setTabGuard({ open: false, pendingTab: null });
    setSettingsDirty(false);
    if (dest) onTabChange(dest);
  }, [tabGuard.pendingTab, onTabChange]);

  const cancelTabSwitch = React.useCallback(() => {
    setTabGuard({ open: false, pendingTab: null });
    if (activeTab !== "settings") {
      onTabChange("settings");
    }
  }, [activeTab, onTabChange]);

  // Rail button click: open drawer if closed, switch tab if different.
  // Clicking an already-active tab is a no-op — closing uses the explicit X.
  const handleBtnClick = React.useCallback(
    (tabId: GroupedTabId) => {
      if (tabId !== activeTab) {
        safeTabChange(tabId);
        if (!drawerOpen) onDrawerToggle();
      } else {
        // Clicking the already-active rail icon toggles the drawer
        // (open if closed, close if open). Replaces the redundant
        // outer `ls-panel-close` × icon for tabs without PanelHeader.
        onDrawerToggle();
      }
    },
    [activeTab, drawerOpen, onDrawerToggle, safeTabChange]
  );

  // Keyboard nav within rail
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const buttons = navRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
      if (!buttons || buttons.length === 0) return;
      const arr = Array.from(buttons);
      const idx = arr.indexOf(document.activeElement as HTMLElement);
      if (idx === -1) return;

      let nextIdx = idx;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        nextIdx = (idx + 1) % arr.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nextIdx = (idx - 1 + arr.length) % arr.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIdx = arr.length - 1;
      }

      if (nextIdx !== idx) {
        const nextButton = arr[nextIdx];
        const tabId = nextButton.dataset.tab as GroupedTabId | undefined;
        if (tabId) safeTabChange(tabId);
        nextButton.focus();
      }
    },
    [safeTabChange]
  );

  // Global keyboard shortcuts (A, T, Z, etc.)
  useSidebarKeyboard(safeTabChange);

  // Component creation handler
  const handleCreateComponent = React.useCallback(() => {
    if (!composer) return;
    const hasComponentsApi =
      typeof (composer?.elements as unknown as Record<string, unknown> | undefined)?.[
        "getComponents"
      ] === "function";
    if (!hasComponentsApi) return;
    const selectedIds = composer.selection.getSelectedIds();
    const elementId = selectedIds[0];
    if (elementId) {
      composer.emit(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId });
    }
  }, [composer]);

  // Panel header info
  const tabConfig = getTabConfig(activeTab);
  const configPanelWidth = getTabWidth(activeTab);
  const panelTitle = tabConfig?.label ?? "Panel";

  // §12 — assets tab supports runtime width override (320 ↔ 560) via
  // ui:media-panel-width composer event. Other tabs ignore the event.
  const [mediaPanelOverride, setMediaPanelOverride] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const handler = (payload: unknown) => {
      const p = payload as { width?: number };
      if (typeof p?.width === "number") setMediaPanelOverride(p.width);
    };
    composer.on("ui:media-panel-width", handler);
    return () => {
      composer.off("ui:media-panel-width", handler);
    };
  }, [composer]);
  // Reset override when leaving assets tab — prevents stale 560 leaking to
  // next tab opened.
  React.useEffect(() => {
    if (activeTab !== "assets") setMediaPanelOverride(null);
  }, [activeTab]);
  // prototype-v3 §2 — templates tab supports runtime width override
  // (320 ↔ 700) via ui:templates-panel-width composer event when detail
  // card opens. Other tabs ignore the event.
  const [templatesPanelOverride, setTemplatesPanelOverride] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const handler = (payload: unknown) => {
      const p = payload as { width?: number };
      if (typeof p?.width === "number") setTemplatesPanelOverride(p.width);
    };
    composer.on("ui:templates-panel-width", handler);
    return () => {
      composer.off("ui:templates-panel-width", handler);
    };
  }, [composer]);
  // Reset override when leaving templates tab.
  React.useEffect(() => {
    if (activeTab !== "templates") setTemplatesPanelOverride(null);
  }, [activeTab]);
  const panelWidth = activeTab === "assets" && mediaPanelOverride !== null
    ? mediaPanelOverride
    : activeTab === "templates" && templatesPanelOverride !== null
    ? templatesPanelOverride
    : configPanelWidth;

  const commonTabProps = {
    isPinned,
    onPinToggle: onPinToggle ?? (() => {}),
    onHelpClick: () => window.open("https://docs.buildrik.com", "_blank"),
    onClose: onDrawerToggle,
  };

  return (
    <div className="ls-root">
      {/* Rail */}
      <nav
        ref={navRef}
        className="ls-rail"
        role="tablist"
        aria-label="Editor navigation"
        aria-orientation="vertical"
        onKeyDown={handleKeyDown}
      >
        <div className="ls-logo">
          <Layers size={28} />
        </div>

        <div className="ls-divider" />

        {ZONES.map((zone, i) => (
          <React.Fragment key={zone}>
            <RailZone
              zone={zone}
              activeTab={activeTab}
              drawerOpen={drawerOpen}
              onBtnClick={handleBtnClick}
              dirtyTabIds={settingsDirty ? SETTINGS_DIRTY_SET : EMPTY_SET}
            />
            {i < ZONES.length - 1 && <div className="ls-divider" />}
          </React.Fragment>
        ))}

        <div className="ls-spacer" />
      </nav>
      {/* Panel */}
      <div
        className={`ls-panel${!drawerOpen ? " ls-panel--closed" : ""}`}
        style={{ width: drawerOpen ? panelWidth : 0 }}
        role="tabpanel"
        aria-hidden={!drawerOpen}
      >
        {/* ls-panel-close removed: PanelHeader inside each tab owns the close X.
            Tabs without a PanelHeader (Layers, Add) can be closed by re-clicking
            the active rail icon, which now toggles drawerOpen. */}
        <div ref={panelContentRef} className="ls-panel-content ls-panel-content--no-padding" tabIndex={-1}>
          <InspectorErrorBoundary
            key={errorKey}
            fallback={<SidebarErrorFallback onRetry={() => setErrorKey((k) => k + 1)} />}
          >
            <div key={activeTab} className="ls-panel-animate">
              <React.Suspense fallback={<PanelSkeleton />}>
                <TabRouter
                  activeTab={activeTab}
                  composer={composer}
                  commonTabProps={commonTabProps}
                  onBlockClick={onBlockClick}
                  onElementSelect={onElementSelect}
                  canvasHoveredId={canvasHoveredId}
                  onSwitchToAdd={() => safeTabChange("add")}
                  onSwitchToTemplates={() => safeTabChange("templates")}
                  onSwitchToDesign={() => safeTabChange("design")}
                  onCreateComponent={handleCreateComponent}
                  onReplayTour={onReplayTour}
                  projectId={projectId}
                  onPublish={onPublish}
                  onUnpublish={onUnpublish}
                  onSettingsDirtyChange={setSettingsDirty}
                  onTemplatesSwitchTab={(tab) => safeTabChange(tab as GroupedTabId)}
                  onOpenLibrary={onOpenLibrary}
                  onOpenImageEditor={onOpenImageEditor}
                  onOpenIconPicker={onOpenIconPicker}
                />
              </React.Suspense>
            </div>
          </InspectorErrorBoundary>
        </div>
      </div>
      {/* Settings dirty guard */}
      <ConfirmDialog
        isOpen={tabGuard.open}
        onClose={cancelTabSwitch}
        onConfirm={confirmTabSwitch}
        title="Unsaved Changes"
        message="You have unsaved changes in Settings. Switching tabs will discard them."
        confirmText="Discard & Switch"
        variant="danger"
      />
    </div>
  );
};

export default LeftSidebar;
