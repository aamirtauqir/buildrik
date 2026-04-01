/**
 * LeftSidebar — Expandable panel container for the 9-tab system
 *
 * Responsibilities (thin wrapper):
 * 1. Compose extracted modules: TabRouter, useSidebarState, useSidebarKeyboard
 * 2. Render panel shell with error boundary + suspense
 * 3. Pass common props down to active tab
 *
 * 9-TAB STRUCTURE (IA Redesign 2026):
 * TOP: Add | Layers | Pages | Components | Assets
 * BOTTOM: Design | Settings | Publish | History
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./LeftSidebar.css";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants/events";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { BlockData } from "../../shared/types";
import type { PublishResult } from "../../shared/hooks/usePublish";
import { ConfirmDialog } from "../../shared/ui/Modal";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import { PanelSkeleton, SidebarErrorFallback } from "./SidebarFallbacks";
import { TabRouter } from "./TabRouter";
import { useSidebarKeyboard } from "./useSidebarKeyboard";
import { useSidebarState } from "./useSidebarState";
import { LAYOUT } from "../../shared/constants/layout";
import type { PanelSizeMode } from "../../shared/types/ui";

export interface LeftSidebarProps {
  composer: Composer | null;
  onElementSelect?: (elementId: string) => void;
  onBlockClick?: (block: BlockData) => void;
  activePrimaryTab?: GroupedTabId;
  onPrimaryTabChange?: (tab: GroupedTabId) => void;
  isPanelExpanded?: boolean;
  onPanelExpandedChange?: (expanded: boolean) => void;
  isPanelPinned?: boolean;
  onPanelPinnedChange?: (pinned: boolean) => void;
  panelSizeMode?: PanelSizeMode;
  onPanelSizeModeChange?: (mode: PanelSizeMode) => void;
  canvasHoveredId?: string | null;
  /** Use minimal styles when parent handles layout (e.g. LayoutShell) */
  useMinimalContainer?: boolean;
  onOpenCommandPalette?: () => void;
  onReplayTour?: () => void;
  projectId?: string | null;
  onPublish?: (projectId: string) => Promise<PublishResult>;
  onUnpublish?: (projectId: string) => Promise<void>;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  composer,
  onElementSelect,
  onBlockClick,
  activePrimaryTab: controlledPrimaryTab,
  onPrimaryTabChange,
  isPanelExpanded: controlledExpanded,
  onPanelExpandedChange,
  isPanelPinned: controlledPinned,
  onPanelPinnedChange,
  panelSizeMode,
  onPanelSizeModeChange,
  canvasHoveredId,
  useMinimalContainer = false,
  onReplayTour,
  projectId,
  onPublish,
  onUnpublish,
}) => {
  // State: tab selection, expand/collapse, pin, persistence
  const state = useSidebarState({
    controlledPrimaryTab,
    onPrimaryTabChange,
    controlledExpanded,
    onPanelExpandedChange,
    controlledPinned,
    onPanelPinnedChange,
  });

  // Settings dirty-state guard — intercept tab switches when a sub-screen has unsaved changes
  const [settingsDirty, setSettingsDirty] = React.useState(false);
  const [tabGuard, setTabGuard] = React.useState<{ open: boolean; pendingTab: GroupedTabId | null }>({
    open: false,
    pendingTab: null,
  });

  // Intercept programmatic tab changes (keyboard shortcuts, internal nav)
  const safeTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      if (state.activePrimaryTab === "settings" && settingsDirty) {
        setTabGuard({ open: true, pendingTab: tab });
      } else {
        state.handlePrimaryTabChange(tab);
      }
    },
    [state, settingsDirty]
  );

  // Detect rail-driven (prop-driven) tab switch away from Settings while dirty
  const prevActiveTabRef = React.useRef<GroupedTabId>(state.activePrimaryTab);
  React.useEffect(() => {
    const prev = prevActiveTabRef.current;
    prevActiveTabRef.current = state.activePrimaryTab;
    if (prev === "settings" && state.activePrimaryTab !== "settings" && settingsDirty) {
      setTabGuard({ open: true, pendingTab: state.activePrimaryTab });
    }
  }, [state.activePrimaryTab, settingsDirty]);

  const confirmTabSwitch = React.useCallback(() => {
    const dest = tabGuard.pendingTab;
    setTabGuard({ open: false, pendingTab: null });
    setSettingsDirty(false);
    if (dest) state.handlePrimaryTabChange(dest);
  }, [tabGuard.pendingTab, state]);

  const cancelTabSwitch = React.useCallback(() => {
    setTabGuard({ open: false, pendingTab: null });
    // If rail already switched, revert back to Settings
    if (state.activePrimaryTab !== "settings") {
      state.handlePrimaryTabChange("settings");
    }
  }, [state]);

  // Keyboard shortcuts (A=Add, Z=Layers, P=Pages, etc.)
  useSidebarKeyboard(safeTabChange);

  // Help click handler
  const handleHelpClick = React.useCallback(() => {
    window.open("https://docs.aquibra.com", "_blank");
  }, []);

  // Create component handler
  const handleCreateComponent = React.useCallback(() => {
    if (!composer) return;
    const hasComponentsApi =
      typeof (composer?.elements as unknown as Record<string, unknown> | undefined)?.[
        "getComponents"
      ] === "function";
    if (!hasComponentsApi) {
      // Components API not ready — do not create orphaned data
      return;
    }
    const selectedIds = composer.selection.getSelectedIds();
    const elementId = selectedIds[0];
    if (elementId) {
      composer.emit(EVENTS.COMPONENT_CREATE_REQUESTED, { elementId });
    }
  }, [composer]);

  // Common props passed to every tab
  const commonTabProps = {
    isPinned: state.isPanelPinned,
    onPinToggle: state.handlePinToggle,
    onHelpClick: handleHelpClick,
    onClose: state.handlePanelClose,
  };

  // Container + panel styles
  const containerStyle = useMinimalContainer ? minimalFillStyles : containerStyles;

  // When size controls footer is shown, tabpanel must flex-grow instead of height:100%
  const hasSizeControls = Boolean(onPanelSizeModeChange);
  const panelStyle = useMinimalContainer
    ? hasSizeControls
      ? { ...minimalFillStyles, height: "auto", flex: 1, minHeight: 0 }
      : minimalFillStyles
    : {
        ...panelStyles,
        width: state.isPanelExpanded ? LAYOUT.DRAWER_WIDTH : 0,
        opacity: state.isPanelExpanded ? 1 : 0,
        overflow: state.isPanelExpanded ? ("visible" as const) : ("hidden" as const),
      };

  return (
    <nav role="region" aria-label="Editor Navigation Panel" style={containerStyle}>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
        />
      <div
        style={panelStyle}
        role="tabpanel"
        id={`sidebar-panel-${state.activePrimaryTab}`}
        aria-labelledby={`sidebar-tab-${state.activePrimaryTab}`}
        aria-hidden={!state.isPanelExpanded && !useMinimalContainer}
      >
        <div ref={state.panelContentRef} style={contentStyles} tabIndex={-1}>
          <InspectorErrorBoundary
            key={state.errorKey}
            fallback={<SidebarErrorFallback onRetry={state.resetError} />}
          >
            <div key={state.activePrimaryTab} className="aqb-panel-animate">
              <React.Suspense fallback={<PanelSkeleton />}>
                <TabRouter
                  activeTab={state.activePrimaryTab}
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
                  onTemplatesSwitchTab={(tab) => safeTabChange(tab as import("../rail/tabsConfig").GroupedTabId)}
                />
              </React.Suspense>
            </div>
          </InspectorErrorBoundary>
        </div>
      </div>
      {hasSizeControls && (
        <div style={sizeModeBarStyles} role="toolbar" aria-label="Panel width">
          {(["compact", "normal", "extended"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onPanelSizeModeChange!(mode)}
              className={`aqb-icon-btn${panelSizeMode === mode ? " aqb-icon-btn--active" : ""}`}
              title={
                mode === "compact"
                  ? "Compact (280px)"
                  : mode === "normal"
                    ? "Normal (320px)"
                    : "Wide (400px)"
              }
              aria-pressed={panelSizeMode === mode}
              style={sizeModeButtonStyles}
            >
              <SizeModeIcon mode={mode} active={panelSizeMode === mode} />
            </button>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={tabGuard.open}
        onClose={cancelTabSwitch}
        onConfirm={confirmTabSwitch}
        title="Unsaved Changes"
        message="You have unsaved changes in Settings. Switching tabs will discard them."
        confirmText="Discard & Switch"
        variant="danger"
      />
    </nav>
  );
};

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  position: "absolute",
  top: "var(--aqb-header-height)",
  bottom: "var(--aqb-footer-height)",
  left: "var(--aqb-layout-gap)",
  display: "flex",
  flexDirection: "row",
  height: "calc(100% - calc(var(--aqb-header-height) + var(--aqb-footer-height)))",
  background: "var(--aqb-sidebar-glass-bg)",
  backdropFilter: "var(--aqb-sidebar-glass-blur)",
  WebkitBackdropFilter: "var(--aqb-sidebar-glass-blur)",
  borderRadius: "var(--aqb-radius-xl)",
  border: "1px solid var(--aqb-sidebar-glass-border)",
  boxShadow: "var(--aqb-sidebar-glass-shadow)",
  transition: "width 0.3s var(--aqb-ease-bounce)",
  zIndex: 2000,
  overflow: "hidden",
};

const panelStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  transition: "width 0.2s ease, opacity 0.15s ease",
};

const contentStyles: React.CSSProperties = {
  flex: 1,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const minimalFillStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
};

const sizeModeBarStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  height: 32,
  minHeight: 32,
  borderTop: "1px solid var(--aqb-border)",
  background: "var(--aqb-surface-2)",
  flexShrink: 0,
};

const sizeModeButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 24,
  padding: 0,
};

// ============================================
// SizeModeIcon — inline SVG icons for S/M/L panel widths
// ============================================
const SizeModeIcon: React.FC<{ mode: PanelSizeMode; active: boolean }> = ({ mode }) => {
  // Three vertical bars representing relative panel widths
  const bars = {
    compact: [{ h: 10 }, { h: 6 }, { h: 8 }],
    normal: [{ h: 10 }, { h: 9 }, { h: 10 }],
    extended: [{ h: 10 }, { h: 10 }, { h: 10 }],
  };

  if (mode === "compact") {
    return (
      <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor" aria-hidden="true">
        <rect x="0" y="1" width="5" height="9" rx="1" />
        <rect x="6" y="3" width="3" height="7" rx="0.5" opacity="0.4" />
        <rect x="10" y="3" width="3" height="7" rx="0.5" opacity="0.4" />
      </svg>
    );
  }
  if (mode === "normal") {
    return (
      <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor" aria-hidden="true">
        <rect x="0" y="1" width="7" height="9" rx="1" />
        <rect x="8" y="3" width="2.5" height="7" rx="0.5" opacity="0.4" />
        <rect x="11" y="3" width="2.5" height="7" rx="0.5" opacity="0.4" />
      </svg>
    );
  }
  // extended
  void bars;
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor" aria-hidden="true">
      <rect x="0" y="1" width="10" height="9" rx="1" />
      <rect x="11" y="3" width="3" height="7" rx="0.5" opacity="0.4" />
    </svg>
  );
};

export default LeftSidebar;
