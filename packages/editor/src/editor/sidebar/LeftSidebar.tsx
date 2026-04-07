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
import { getTabWidth, getTabConfig, getTabsByZone, GROUPED_TABS_CONFIG } from "../rail/tabsConfig";
import type { BlockData } from "../../shared/types";
import type { PublishResult } from "../../shared/hooks/usePublish";
import { ConfirmDialog } from "../../shared/ui/Modal";
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
  Settings,
  Timer,
  Info,
  Pin,
  X,
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
  Settings,
  Timer,
  Info,
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
}

// ============================================
// Zone rendering
// ============================================

const ZONES: TabZone[] = ["creation", "structure", "config"];

function RailZone({
  zone,
  activeTab,
  drawerOpen,
  onBtnClick,
}: {
  zone: TabZone;
  activeTab: GroupedTabId;
  drawerOpen: boolean;
  onBtnClick: (tabId: GroupedTabId) => void;
}) {
  const tabs = React.useMemo(() => getTabsByZone(zone), [zone]);

  return (
    <div className="ls-zone">
      {tabs.map((tab) => {
        const Icon = ICON_MAP[tab.iconName];
        if (!Icon) return null;
        const isActive = tab.id === activeTab && drawerOpen;

        return (
          <button
            key={tab.id}
            className={`ls-btn${isActive ? " ls-btn--active" : ""}`}
            onClick={() => onBtnClick(tab.id)}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.ariaLabel}
            data-tab={tab.id}
          >
            {isActive && <div className="ls-btn-bar" />}
            <Icon size={20} />
          </button>
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
  isPinned = true,
  onPinToggle,
  onElementSelect,
  onBlockClick,
  canvasHoveredId,
  onReplayTour,
  projectId,
  onPublish,
  onUnpublish,
  onExportForDeploy,
}) => {
  const navRef = React.useRef<HTMLElement>(null);
  const panelContentRef = React.useRef<HTMLDivElement>(null);
  const [errorKey, setErrorKey] = React.useState(0);

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

  // Rail button click: toggle drawer if same tab, else switch tab
  const handleBtnClick = React.useCallback(
    (tabId: GroupedTabId) => {
      if (tabId === activeTab) {
        onDrawerToggle();
      } else {
        safeTabChange(tabId);
      }
    },
    [activeTab, onDrawerToggle, safeTabChange]
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
  const panelWidth = getTabWidth(activeTab);
  const panelTitle = tabConfig?.label ?? "Panel";

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
            />
            {i < ZONES.length - 1 && <div className="ls-divider" />}
          </React.Fragment>
        ))}

        <div className="ls-spacer" />

        <a
          className="ls-btn ls-btn--help"
          href="https://docs.buildrik.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Help and documentation"
        >
          <Info size={20} />
        </a>
      </nav>

      {/* Panel */}
      <div
        className={`ls-panel${!drawerOpen ? " ls-panel--closed" : ""}`}
        style={{ width: drawerOpen ? panelWidth : 0 }}
        role="tabpanel"
        aria-hidden={!drawerOpen}
      >
        <div className="ls-panel-header">
          <span className="ls-panel-title">{panelTitle}</span>
          <div className="ls-panel-header-spacer" />
          {onPinToggle && (
            <button
              className="ls-panel-icon-btn"
              onClick={onPinToggle}
              aria-label={isPinned ? "Unpin panel" : "Pin panel"}
            >
              <Pin size={16} />
            </button>
          )}
          <button
            className="ls-panel-icon-btn"
            onClick={onDrawerToggle}
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={panelContentRef} className="ls-panel-content" tabIndex={-1}>
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
                  onCreateComponent={handleCreateComponent}
                  onReplayTour={onReplayTour}
                  projectId={projectId}
                  onPublish={onPublish}
                  onUnpublish={onUnpublish}
                  onSettingsDirtyChange={setSettingsDirty}
                  onTemplatesSwitchTab={(tab) => safeTabChange(tab as GroupedTabId)}
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
