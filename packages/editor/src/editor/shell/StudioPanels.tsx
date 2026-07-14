import { Button } from "@/editor/shared/vibcoder/Button";
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
import type { UsePublishJobResult } from "./hooks/usePublishJob";
import { EVENTS } from "../../shared/constants/events";
import type { GroupedTabId } from "../rail/tabsConfig";
import { getTabMode } from "../rail/tabsConfig";
import type { BlockData, DeviceType } from "../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { useToast } from "@/editor/shared/vibcoder";
import { Canvas, type CanvasRef } from "../canvas/Canvas";
import type { CanvasOverlayState } from "../canvas/CanvasFooterToolbar";
import { ProInspector } from "../inspector/ProInspector";
import { LayoutShell } from "../rail/LayoutShell";
import { LeftSidebar } from "../sidebar/LeftSidebar";
import { FullPageView } from "../sidebar/FullPageView";
import { TokenRegistryProvider, DSModeProvider, StylePresetRegistryProvider } from "@/editor/design-system";
import { MigrationProgressMount } from "@/editor/design-system/ui/MigrationProgressMount";
import { StarterGalleryMount } from "@/editor/design-system/ui/StarterGalleryMount";
import { useBlockInsertion } from "./hooks/useBlockInsertion";
import { useAltTextAutoTrigger } from "./hooks/useAltTextAutoTrigger";
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
  onDeviceChange?: (device: DeviceType) => void;
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
  showRulers?: boolean;
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
  onOpenCreateCollection?: () => void;
  onOpenTemplates?: () => void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string) => void | Promise<void>,
  ) => void;
  canvasRef?: React.RefObject<CanvasRef | null>;
  composerContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Whether the active tab is in fullpage mode (derived from useStudioState) */
  isFullPageMode?: boolean;
  /** Drawer width in pixels for the active tab (derived from useStudioState) */
  drawerWidth?: number;
  panelPinned?: boolean;
  onPanelPinnedToggle?: () => void;
  projectId?: string | null;
  /** Canonical publish state machine (shared with the Topbar) + its fire
   *  handler, forwarded to the sidebar PublishTab so both drive ONE flow. */
  publishJob?: UsePublishJobResult;
  onVercelPublish?: () => Promise<void>;
}

// ============================================================================
// STYLES
// ============================================================================

const previewBannerStyle: React.CSSProperties = {
  position: "absolute",
  top: 12,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 14px",
  background: "rgba(0,0,0,0.82)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "var(--text-primary, #fff)",
  fontSize: 13,
  zIndex: 50,
  pointerEvents: "auto",
  backdropFilter: "blur(6px)",
  userSelect: "none",
};

const previewExitBtnStyle: React.CSSProperties = {
  marginLeft: 8,
  padding: "2px 10px",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 5,
  background: "transparent",
  color: "inherit",
  fontSize: 12,
  cursor: "pointer",
};

const styles = {
  container: {
    flex: 1,
    overflow: "hidden",
    background: "var(--buildrick-bg-panel)",
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
  onDeviceChange,
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
  showRulers = false,
  showComponentView = false,
  showXRay = false,
  devMode = false,
  onOverlayChange,
  onAIRequest,
  onOpenMediaLibrary,
  onOpenIconPicker,
  onOpenCreateCollection,
  onOpenImageEditor,
  canvasRef,
  composerContainerRef,
  isFullPageMode = false,
  drawerWidth = 280,
  panelPinned = true,
  onPanelPinnedToggle,
  projectId,
  publishJob,
  onVercelPublish,
}) => {
  const { addToast } = useToast();
  const { handleBlockClick } = useBlockInsertion(composer);
  useAltTextAutoTrigger(composer);

  const [canvasHoveredId, setCanvasHoveredId] = React.useState<string | null>(null);
  const [isVersionPreview, setIsVersionPreview] = React.useState(false);

  // Media tab dual-mode: panel (slim launcher) or fullpage (library manager)
  const [mediaFullPage, setMediaFullPage] = React.useState(false);

  // Derive fullpage mode from tab if not explicitly passed
  const activeTabId = (leftPanelTab as GroupedTabId) || "add";
  const effectiveFullPageMode =
    isFullPageMode ||
    getTabMode(activeTabId) === "fullpage" ||
    (activeTabId === "assets" && mediaFullPage);

  // Reset media fullpage override when switching away from assets tab
  React.useEffect(() => {
    if (activeTabId !== "assets" && mediaFullPage) {
      setMediaFullPage(false);
    }
  }, [activeTabId, mediaFullPage]);

  // Listen for panel open events from composer
  React.useEffect(() => {
    if (!composer) return;

    const openBuild = () => {
      onLeftPanelTabChange?.("add");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    const openTemplates = () => {
      onLeftPanelTabChange?.("templates");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    const openDesign = () => {
      onLeftPanelTabChange?.("design");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };

    composer.on(EVENTS.UI_OPEN_BUILD_PANEL, openBuild);
    composer.on(EVENTS.UI_BROWSE_TEMPLATES, openTemplates);
    composer.on(EVENTS.UI_OPEN_DESIGN_PANEL, openDesign);
    return () => {
      composer.off(EVENTS.UI_OPEN_BUILD_PANEL, openBuild);
      composer.off(EVENTS.UI_BROWSE_TEMPLATES, openTemplates);
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

  // Version preview mode — dims canvas and shows "Preview" banner while hovering a version row
  React.useEffect(() => {
    if (!composer) return;
    const handlePreviewStarted = () => setIsVersionPreview(true);
    const handlePreviewCleared = () => setIsVersionPreview(false);
    composer.on(EVENTS.VERSION_PREVIEW_STARTED, handlePreviewStarted);
    composer.on(EVENTS.VERSION_PREVIEW_CLEARED, handlePreviewCleared);
    return () => {
      composer.off(EVENTS.VERSION_PREVIEW_STARTED, handlePreviewStarted);
      composer.off(EVENTS.VERSION_PREVIEW_CLEARED, handlePreviewCleared);
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
        description: `${elementLabel} deleted`,
        tone: "info",
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

  const handleRailTabChange = React.useCallback(
    (tab: GroupedTabId) => {
      // Tab-only switcher. Drawer-toggle lives in LeftSidebar.handleBtnClick;
      // duplicating it here caused both setters to fire setIsLeftPanelOpen(v=>!v)
      // in the same batch, netting zero on different-tab clicks (2-click bug).
      onLeftPanelTabChange?.(tab);
    },
    [onLeftPanelTabChange]
  );

  const handleFullPageClose = React.useCallback(() => {
    if (activeTabId === "assets" && mediaFullPage) {
      // Media dual-mode: return to panel (slim launcher), don't switch tabs
      setMediaFullPage(false);
    } else {
      // Return to last panel tab (default: Add)
      onLeftPanelTabChange?.("add");
    }
  }, [activeTabId, mediaFullPage, onLeftPanelTabChange]);

  const handleOpenLibrary = React.useCallback(() => {
    setMediaFullPage(true);
  }, []);

  const handleEditMedia = React.useCallback(
    (item: { key: string; src: string; name: string }) => {
      if (!onOpenImageEditor || !composer) return;
      onOpenImageEditor(item.src, async (editedSrc) => {
        try {
          const res = await fetch(editedSrc);
          const blob = await res.blob();
          const file = new File([blob], `edited-${item.name}.webp`, { type: "image/webp" });
          const result = await composer.media.uploadFile(file);
          if (result.success && result.asset) {
            composer.elements.getElement(item.key)?.setAttribute("src", result.asset.src);
          }
        } catch (err) {
          console.error("Failed to save edited canvas media:", err);
        }
      });
    },
    [onOpenImageEditor, composer]
  );

  return (
    <DSModeProvider>
    <TokenRegistryProvider projectId={projectId} composer={composer ?? undefined}>
    <StylePresetRegistryProvider projectId={projectId}>
      <MigrationProgressMount composer={composer} />
      <StarterGalleryMount projectId={projectId} composer={composer} />
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
            onPinToggle={onPanelPinnedToggle}
            onElementSelect={handleElementSelect}
            onBlockClick={handleBlockClick}
            canvasHoveredId={canvasHoveredId}
            projectId={projectId}
            publishJob={publishJob}
            onVercelPublish={onVercelPublish}
            onOpenLibrary={handleOpenLibrary}
            onOpenImageEditor={onOpenImageEditor}
            onOpenIconPicker={onOpenIconPicker}
          />
        </LayoutShell.Sidebar>

        {/* Canvas Area — main editing surface */}
        <LayoutShell.Canvas>
          <PageTabBar composer={composer} />
          <div style={styles.canvasPattern} />
          <div ref={composerContainerRef} style={styles.canvasContent}>
            <Canvas
              ref={canvasRef as React.Ref<CanvasRef>}
              composer={composer}
              device={device}
              zoom={zoom}
              showSpacing={showSpacingIndicators}
              showBadges={showBadges}
              showGuides={showGuides}
              showGrid={showGrid}
              showRulers={showRulers}
              showComponentView={showComponentView}
              showXRay={showXRay}
              devMode={devMode}
              onAIRequest={onAIRequest}
              onOpenImageEditor={handleEditMedia}
            />
            {isVersionPreview && (
              <div style={previewBannerStyle}>
                <span style={{ fontWeight: 500 }}>Preview</span>
                <span style={{ color: "var(--text-muted, rgba(255,255,255,0.45))", fontSize: 12 }}>
                  — not saved
                </span>
                <Button
                  style={previewExitBtnStyle}
                  onClick={() => composer?.versions?.clearPreview()}
                >
                  Exit
                </Button>
              </div>
            )}
          </div>
        </LayoutShell.Canvas>

        {/* Right Inspector — element properties */}
        <LayoutShell.Inspector>
          <ProInspector
            composer={composer}
            selectedElement={selectedElement}
            currentBreakpoint={device}
            onBreakpointChange={onDeviceChange}
            onDelete={handleDelete}
            onOpenMediaLibrary={onOpenMediaLibrary}
            onOpenIconPicker={onOpenIconPicker}
            onOpenCreateCollection={onOpenCreateCollection}
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
            onOpenImageEditor={onOpenImageEditor}
            onOpenIconPicker={onOpenIconPicker}
          />
        </LayoutShell.FullPage>
      </LayoutShell>
    </StylePresetRegistryProvider>
    </TokenRegistryProvider>
    </DSModeProvider>
  );
};

export default StudioPanels;
