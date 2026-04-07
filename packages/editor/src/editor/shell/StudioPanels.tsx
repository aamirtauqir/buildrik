/**
 * StudioPanels - Main panel layout component
 * Manages left sidebar, canvas area, right inspector, and fullpage views.
 *
 * Panel mode: Rail + Drawer (variable width) + Canvas + Inspector
 * Fullpage mode: Rail + FullPage (Templates, Settings, History, Design)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants/events";
import type { GroupedTabId } from "../rail/tabsConfig";
import { getTabMode } from "../rail/tabsConfig";
import type { BlockData, DeviceType } from "../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { useToast } from "../../shared/ui/Toast";
import { Canvas, type CanvasRef } from "../canvas/Canvas";
import { CanvasFooterToolbar, type CanvasOverlayState } from "../canvas/CanvasFooterToolbar";
import { ProInspector } from "../inspector/ProInspector";
import { LayoutShell } from "../rail/LayoutShell";
import { LeftSidebar } from "../sidebar/LeftSidebar";
import { FullPageView } from "../sidebar/FullPageView";
import { useBlockInsertion } from "./hooks/useBlockInsertion";
import { PageTabBar } from "./PageTabBar";

// ============================================================================
// TYPES
// ============================================================================

export interface StudioPanelsProps {
  composer: Composer | null;
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  } | null;
  device: DeviceType;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isLeftPanelOpen: boolean;
  onLeftPanelToggle?: () => void;
  leftPanelTab?: string;
  leftPanelSubTab?: string;
  onLeftPanelTabChange?: (tab: string) => void;
  onLeftPanelSubTabChange?: (tab: string) => void;
  blocks: BlockData[];
  onQuickAdd: (block: BlockData) => void;
  showSpacingIndicators?: boolean;
  showBadges?: boolean;
  showGuides?: boolean;
  showGrid?: boolean;
  showComponentView?: boolean;
  showXRay?: boolean;
  onOverlayChange?: (overlay: keyof CanvasOverlayState, enabled: boolean) => void;
  devMode?: boolean;
  onAIRequest?: (payload: { elementId: string; elementType?: string }) => void;
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  onOpenTemplates?: () => void;
  onExportForDeploy?: () => Promise<{
    files: Array<{ path: string; content: string }>;
    projectName?: string;
  }>;
  canvasRef?: React.RefObject<CanvasRef>;
  composerContainerRef?: React.RefObject<HTMLDivElement>;
  /** Whether the active tab is in fullpage mode (derived from usePanelState) */
  isFullPageMode?: boolean;
  /** Drawer width in pixels for the active tab (derived from usePanelState) */
  drawerWidth?: number;
  panelPinned?: boolean;
  projectId?: string | null;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    flex: 1,
    overflow: "hidden",
    background: "var(--surface-base, #0f1115)",
  } as React.CSSProperties,

  canvasPattern: {
    position: "absolute" as const,
    inset: 0,
    backgroundImage: `
      radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)
    `,
    backgroundSize: "24px 24px",
    pointerEvents: "none" as const,
    zIndex: 0,
  } as React.CSSProperties,

  canvasContent: {
    height: "100%",
    width: "100%",
    display: "flex",
    flex: 1,
    position: "relative" as const,
    zIndex: 1,
  } as React.CSSProperties,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const StudioPanels: React.FC<StudioPanelsProps> = ({
  composer,
  selectedElement,
  device,
  zoom,
  onZoomChange,
  isLeftPanelOpen,
  onLeftPanelToggle,
  leftPanelTab,
  leftPanelSubTab: _leftPanelSubTab,
  onLeftPanelTabChange,
  onLeftPanelSubTabChange: _onLeftPanelSubTabChange,
  blocks: _blocks,
  onQuickAdd: _onQuickAdd,
  showSpacingIndicators = false,
  showBadges = false,
  showGuides = true,
  showGrid = false,
  showComponentView = false,
  showXRay = false,
  devMode = false,
  onOverlayChange,
  onAIRequest,
  onOpenMediaLibrary,
  onOpenIconPicker,
  onOpenTemplates,
  onExportForDeploy,
  canvasRef,
  composerContainerRef,
  isFullPageMode = false,
  drawerWidth = 280,
  panelPinned = true,
  projectId,
}) => {
  const { addToast } = useToast();
  const { handleBlockClick } = useBlockInsertion(composer);

  const [canvasHoveredId, setCanvasHoveredId] = React.useState<string | null>(null);

  // Derive fullpage mode from tab if not explicitly passed
  const activeTabId = (leftPanelTab as GroupedTabId) || "add";
  const effectiveFullPageMode = isFullPageMode || getTabMode(activeTabId) === "fullpage";

  // Listen for panel open events from composer
  React.useEffect(() => {
    if (!composer) return;

    const openBuild = () => {
      onLeftPanelTabChange?.("add");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    const openDesign = () => {
      onLeftPanelTabChange?.("design");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };

    composer.on(EVENTS.UI_OPEN_BUILD_PANEL, openBuild);
    composer.on(EVENTS.UI_BROWSE_TEMPLATES, openBuild);
    composer.on(EVENTS.UI_OPEN_DESIGN_PANEL, openDesign);
    return () => {
      composer.off(EVENTS.UI_OPEN_BUILD_PANEL, openBuild);
      composer.off(EVENTS.UI_BROWSE_TEMPLATES, openBuild);
      composer.off(EVENTS.UI_OPEN_DESIGN_PANEL, openDesign);
    };
  }, [composer, onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]);

  // Listen for tab switch events
  React.useEffect(() => {
    if (!composer) return;
    const handler = (data: { tab: string }) => {
      onLeftPanelTabChange?.(data.tab);
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    composer.on("ui:switch-tab", handler);
    return () => {
      composer.off("ui:switch-tab", handler);
    };
  }, [composer, onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]);

  // Canvas hover sync
  React.useEffect(() => {
    if (!composer) return;
    const handleCanvasHover = (data: { id: string | null }) => {
      setCanvasHoveredId(data.id);
    };
    composer.on("canvas:hover", handleCanvasHover);
    return () => {
      composer.off("canvas:hover", handleCanvasHover);
    };
  }, [composer]);

  const handleElementSelect = React.useCallback(
    (elementId: string) => {
      if (composer) {
        const el = composer.elements.getElement(elementId);
        if (el) composer.selection.select(el);
      }
    },
    [composer]
  );

  const handleDelete = React.useCallback(
    (id: string) => {
      if (!composer) return;
      const element = composer.elements.getElement(id);
      const elementType = element?.getType?.() || "element";
      const elementLabel = elementType.charAt(0).toUpperCase() + elementType.slice(1);
      composer.elements.removeElement(id);
      addToast({
        message: `${elementLabel} deleted`,
        variant: "info",
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            composer.history?.undo?.();
          },
        },
      });
    },
    [composer, addToast]
  );

  const handleZoomChange = React.useCallback(
    (z: number) => {
      onZoomChange(z);
      if (composer) composer.setZoom(z);
    },
    [composer, onZoomChange]
  );

  const handleFitToScreen = React.useCallback(() => {
    onZoomChange(100);
    if (composer) composer.setZoom(100);
  }, [composer, onZoomChange]);

  const handleRailTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      if (onLeftPanelTabChange) {
        onLeftPanelTabChange(tab);
      }
      if (!isLeftPanelOpen && onLeftPanelToggle) {
        onLeftPanelToggle();
      }
    },
    [onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]
  );

  const handleFullPageClose = React.useCallback(() => {
    // Return to last panel tab (default: Add)
    onLeftPanelTabChange?.("add");
  }, [onLeftPanelTabChange]);

  return (
    <LayoutShell
      drawerOpen={isLeftPanelOpen && !effectiveFullPageMode}
      drawerPinned={panelPinned}
      drawerWidth={drawerWidth}
      fullPageMode={effectiveFullPageMode && isLeftPanelOpen}
      inspectorOpen={!!selectedElement && !effectiveFullPageMode}
      style={styles.container}
    >
      {/* Left Sidebar — merged rail + panel */}
      <LayoutShell.Sidebar>
        <LeftSidebar
          composer={composer}
          activeTab={activeTabId}
          onTabChange={handleRailTabChange}
          drawerOpen={isLeftPanelOpen && !effectiveFullPageMode}
          onDrawerToggle={onLeftPanelToggle ?? (() => {})}
          isPinned={panelPinned}
          onElementSelect={handleElementSelect}
          onBlockClick={handleBlockClick}
          canvasHoveredId={canvasHoveredId}
          projectId={projectId}
        />
      </LayoutShell.Sidebar>

      {/* Canvas Area — main editing surface */}
      <LayoutShell.Canvas>
        <PageTabBar composer={composer} />
        <div style={styles.canvasPattern} />
        <div ref={composerContainerRef} style={styles.canvasContent}>
          <Canvas
            ref={canvasRef}
            composer={composer}
            device={device}
            zoom={zoom}
            showSpacing={showSpacingIndicators}
            showBadges={showBadges}
            showGuides={showGuides}
            showGrid={showGrid}
            showComponentView={showComponentView}
            showXRay={showXRay}
            devMode={devMode}
            onAIRequest={onAIRequest}
          />
        </div>
        <CanvasFooterToolbar
          overlays={{
            guides: showGuides,
            spacing: showSpacingIndicators,
            grid: showGrid,
            badges: showBadges,
            xray: showXRay,
          }}
          zoom={zoom}
          onOverlayChange={onOverlayChange ?? (() => {})}
          onZoomChange={handleZoomChange}
          onFitToScreen={handleFitToScreen}
        />
      </LayoutShell.Canvas>

      {/* Right Inspector — element properties */}
      <LayoutShell.Inspector>
        <ProInspector
          composer={composer}
          selectedElement={selectedElement}
          currentBreakpoint={device}
          onDelete={handleDelete}
          onOpenMediaLibrary={onOpenMediaLibrary}
          onOpenIconPicker={onOpenIconPicker}
        />
      </LayoutShell.Inspector>

      {/* FullPage View — Templates, Settings, History, Design (replaces canvas area) */}
      <LayoutShell.FullPage>
        <FullPageView
          activeTab={activeTabId}
          composer={composer}
          onClose={handleFullPageClose}
          onSwitchToAdd={() => onLeftPanelTabChange?.("add")}
          onReplayTour={undefined}
          projectId={projectId}
        />
      </LayoutShell.FullPage>
    </LayoutShell>
  );
};

export default StudioPanels;
