/**
 * StudioPanels - Main panel layout component
 * Manages left sidebar, canvas area, and right inspector panel
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants/events";
import type { GroupedTabId } from "../../shared/constants/tabs";
import type { BlockData, DeviceType } from "../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { useToast } from "../../shared/ui/Toast";
import { Canvas, type CanvasRef } from "../canvas/Canvas";
import { CanvasFooterToolbar, type CanvasOverlayState } from "../canvas/CanvasFooterToolbar";
import { ProInspector } from "../inspector/ProInspector";
import { LayoutShell } from "../rail/LayoutShell";
import { LeftRail } from "../rail/LeftRail";
import { LeftSidebar } from "../sidebar/LeftSidebar";
import { useBlockInsertion } from "./hooks/useBlockInsertion";
import { PageTabBar } from "./PageTabBar";

// ============================================================================
// TYPES
// ============================================================================

export interface StudioPanelsProps {
  /** Composer instance */
  composer: Composer | null;
  /** Currently selected element */
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  } | null;
  /** Current device type */
  device: DeviceType;
  /** Current zoom level */
  zoom: number;
  /** Callback to change zoom */
  onZoomChange: (zoom: number) => void;
  /** Whether left panel is visible */
  isLeftPanelOpen: boolean;
  /** Callback to toggle left panel visibility */
  onLeftPanelToggle?: () => void;
  /** Active primary tab in left sidebar */
  leftPanelTab?: string;
  /** Active sub-tab per primary tab */
  leftPanelSubTab?: string;
  /** Callback to change primary tab */
  onLeftPanelTabChange?: (tab: string) => void;
  /** Callback to change sub-tab */
  onLeftPanelSubTabChange?: (tab: string) => void;
  /** Block definitions for quick add */
  blocks: BlockData[];
  /** Callback when adding a block via QuickAddBar */
  onQuickAdd: (block: BlockData) => void;
  /** Canvas visibility flags */
  showSpacingIndicators?: boolean;
  showBadges?: boolean;
  showGuides?: boolean;
  showGrid?: boolean;
  showComponentView?: boolean;
  showXRay?: boolean;
  /** Callback when a canvas overlay toggle changes */
  onOverlayChange?: (overlay: keyof CanvasOverlayState, enabled: boolean) => void;
  /** Dev Mode - enables enhanced hover levels (boxmodel view) */
  devMode?: boolean;
  /** AI request handler */
  onAIRequest?: (payload: { elementId: string; elementType?: string }) => void;
  /** Opens media library */
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  /** Opens icon picker */
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  /** Opens template library modal */
  onOpenTemplates?: () => void;
  /** Export handler for Vercel deployment */
  onExportForDeploy?: () => Promise<{
    files: Array<{ path: string; content: string }>;
    projectName?: string;
  }>;
  /** Canvas ref for undo/redo access */
  canvasRef?: React.RefObject<CanvasRef>;
  /** Container ref for canvas area */
  composerContainerRef?: React.RefObject<HTMLDivElement>;
}

// ============================================================================
// STYLES - Updated to use V2 semantic tokens
// ============================================================================

const styles = {
  // Container style for LayoutShell - minimal, lets grid handle layout
  container: {
    flex: 1,
    overflow: "hidden",
    background: "var(--surface-base, #0f1115)",
  } as React.CSSProperties,

  // Canvas background pattern - subtle grid dots
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

  // Canvas content container
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
}) => {
  const { addToast } = useToast();
  const { handleBlockClick } = useBlockInsertion(composer);

  // Track canvas hovered element for LayersPanel sync
  const [canvasHoveredId, setCanvasHoveredId] = React.useState<string | null>(null);

  // Listen for inspector empty-state Composer events (replaces callback props)
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

  // Phase 7: Listen for tab switch events (from post-apply quick actions)
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

  // Listen for canvas hover events
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

  // Handle element selection from sidebar
  const handleElementSelect = React.useCallback(
    (elementId: string) => {
      if (composer) {
        const el = composer.elements.getElement(elementId);
        if (el) composer.selection.select(el);
      }
    },
    [composer]
  );

  // Handle element deletion with undo toast (Task 3.2 - UX improvement)
  const handleDelete = React.useCallback(
    (id: string) => {
      if (!composer) return;

      // Get element info before deletion for the toast message
      const element = composer.elements.getElement(id);
      const elementType = element?.getType?.() || "element";
      const elementLabel = elementType.charAt(0).toUpperCase() + elementType.slice(1);

      // Delete the element
      composer.elements.removeElement(id);

      // Show undo toast with action button
      addToast({
        message: `${elementLabel} deleted`,
        variant: "info",
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            // Use composer's history to undo the deletion
            composer.history?.undo?.();
          },
        },
      });
    },
    [composer, addToast]
  );

  // Handle zoom change with composer sync
  const handleZoomChange = React.useCallback(
    (z: number) => {
      onZoomChange(z);
      if (composer) composer.setZoom(z);
    },
    [composer, onZoomChange]
  );

  // Handle fit to screen
  const handleFitToScreen = React.useCallback(() => {
    onZoomChange(100);
    if (composer) composer.setZoom(100);
  }, [composer, onZoomChange]);

  // Handle tab change from LeftRail - auto-open drawer when switching tabs
  const handleRailTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      if (onLeftPanelTabChange) {
        onLeftPanelTabChange(tab);
      }
      // Auto-open drawer when clicking a tab (if not already open)
      if (!isLeftPanelOpen && onLeftPanelToggle) {
        onLeftPanelToggle();
      }
    },
    [onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]
  );

  // Handle opening command palette from LeftRail search hint
  const handleOpenCommandPalette = React.useCallback(() => {
    canvasRef?.current?.openCommandPalette();
  }, [canvasRef]);

  return (
    <LayoutShell drawerOpen={isLeftPanelOpen} inspectorOpen={true} style={styles.container}>
      {/* Left Rail - 60px icon navigation (new LayoutShell) */}
      <LayoutShell.Rail>
        <LeftRail
          activeTab={(leftPanelTab as GroupedTabId) || "add"}
          onTabChange={handleRailTabChange}
          drawerOpen={isLeftPanelOpen}
          onDrawerToggle={onLeftPanelToggle}
          onOpenCommandPalette={handleOpenCommandPalette}
        />
      </LayoutShell.Rail>

      {/* Drawer Panel - 280px sliding panel with LeftSidebar content */}
      <LayoutShell.Drawer>
        <LeftSidebar
          composer={composer}
          onElementSelect={handleElementSelect}
          onBlockClick={handleBlockClick}
          onOpenTemplates={onOpenTemplates}
          onExportForDeploy={onExportForDeploy}
          activePrimaryTab={leftPanelTab as GroupedTabId}
          onPrimaryTabChange={onLeftPanelTabChange}
          canvasHoveredId={canvasHoveredId}
          isPanelExpanded={isLeftPanelOpen}
          onPanelExpandedChange={onLeftPanelToggle ? () => onLeftPanelToggle() : undefined}
          showIconRail={false}
          useMinimalContainer={true}
        />
      </LayoutShell.Drawer>

      {/* Canvas Area - Main editing surface */}
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

        {/* Footer Toolbar — overlay toggles + zoom */}
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

      {/* Right Inspector - 300px property panel */}
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
    </LayoutShell>
  );
};

export default StudioPanels;
