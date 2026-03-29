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
import type { GroupedTabId } from "../../shared/constants/tabs";
import type { BlockData } from "../../shared/types";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import { PanelSkeleton, SidebarErrorFallback } from "./SidebarFallbacks";
import { TabRouter } from "./TabRouter";
import { useSidebarKeyboard } from "./useSidebarKeyboard";
import { useSidebarState } from "./useSidebarState";

// Panel dimensions
const PANEL_WIDTH = 280;

export interface LeftSidebarProps {
  composer: Composer | null;
  onElementSelect?: (elementId: string) => void;
  onBlockClick?: (block: BlockData) => void;
  onOpenTemplates?: () => void;
  activePrimaryTab?: GroupedTabId;
  onPrimaryTabChange?: (tab: GroupedTabId) => void;
  isPanelExpanded?: boolean;
  onPanelExpandedChange?: (expanded: boolean) => void;
  isPanelPinned?: boolean;
  onPanelPinnedChange?: (pinned: boolean) => void;
  onExportForDeploy?: () => Promise<{
    files: Array<{ path: string; content: string }>;
    projectName?: string;
  }>;
  canvasHoveredId?: string | null;
  /** @deprecated No longer used — LeftRail handles icons */
  showIconRail?: boolean;
  /** Use minimal styles when parent handles layout (e.g. LayoutShell) */
  useMinimalContainer?: boolean;
  onOpenCommandPalette?: () => void;
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
  canvasHoveredId,
  useMinimalContainer = false,
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

  // Keyboard shortcuts (A=Add, Z=Layers, P=Pages, etc.)
  useSidebarKeyboard(state.handlePrimaryTabChange);

  // Help click handler
  const handleHelpClick = React.useCallback(() => {
    window.open("https://docs.aquibra.com", "_blank");
  }, []);

  // Create component handler
  const handleCreateComponent = React.useCallback(() => {
    if (!composer) return;
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

  const panelStyle = useMinimalContainer
    ? minimalFillStyles
    : {
        ...panelStyles,
        width: state.isPanelExpanded ? PANEL_WIDTH : 0,
        opacity: state.isPanelExpanded ? 1 : 0,
        overflow: state.isPanelExpanded ? ("visible" as const) : ("hidden" as const),
      };

  return (
    <nav role="region" aria-label="Editor Sidebar" style={containerStyle}>
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
                  onSwitchToAdd={() => state.handlePrimaryTabChange("add")}
                  onCreateComponent={handleCreateComponent}
                />
              </React.Suspense>
            </div>
          </InspectorErrorBoundary>
        </div>
      </div>
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

export default LeftSidebar;
