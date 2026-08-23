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
import { useToast } from "@/editor/chrome-ui";
import { Canvas, type CanvasRef } from "../canvas/Canvas";
import type { CanvasOverlayState } from "../canvas/CanvasFooterToolbar";
import { ProInspector } from "../inspector/ProInspector";
import { AITab } from "../sidebar/tabs/ai/AITab";
import { LayoutShell } from "../rail/LayoutShell";
import { LeftSidebar } from "../sidebar/LeftSidebar";
import { FullPageView } from "../sidebar/FullPageView";
import { TokenRegistryProvider, DSModeProvider, StylePresetRegistryProvider } from "@/editor/design-system";
import { MigrationProgressMount } from "@/editor/design-system/ui/MigrationProgressMount";
import { DSLintRunner } from "@/editor/design-system/ui/DSLintRunner";
import { ProjectTokensApplier } from "@/editor/design-system/ui/ProjectTokensApplier";
import { useBlockInsertion } from "./hooks/useBlockInsertion";
import { useClipboardToasts } from "./hooks/useClipboardToasts";
import { useAltTextAutoTrigger } from "./hooks/useAltTextAutoTrigger";
import { PageTabBar } from "./PageTabBar";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { getEditorViewMode } from "@shared/utils/editorViewMode";
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
  /** Whether undo/redo steps are available — drives the canvas footer toolbar. */
  canUndo?: boolean;
  canRedo?: boolean;
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
  /** P0 review loop: full re-send for the Review panel. */
  onResendReview?: () => Promise<void>;
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
  /** Canonical publish state machine (shared with the Topbar) + its fire
   *  handler, forwarded to the sidebar PublishTab so both drive ONE flow. */
  publishJob?: UsePublishJobResult;
  onVercelPublish?: () => Promise<void>;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    flex: 1,
    overflow: "hidden",
    background: "var(--bk-bg-panel)",
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
  canUndo,
  canRedo,
  zoom,
  onZoomChange,
  isLeftPanelOpen,
  onLeftPanelToggle,
  leftPanelTab,
  leftPanelSubTab,
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
  onResendReview,
  onOpenImageEditor,
  canvasRef,
  composerContainerRef,
  isFullPageMode = false,
  drawerWidth = 280,
  publishJob,
  onVercelPublish,
}) => {
  /* The site whose brand/tokens/publish state these panels edit.
     This was a prop, and `AquibraStudio` never passed it — so every consumer
     below ran on `undefined`, and `TokenRegistryProvider` fell through to its
     `"default"` storage key. One key for every site on the origin: apply a
     brand colour on one site and the next site you open loads it, on a
     surface whose whole job is per-site identity. The id is not something
     the shell has to hand down — it is in the URL, which is where the sync
     provider and PublishTab already read it from. */
  const projectId = React.useMemo(() => getSiteIdFromUrl(), []);

  const { addToast } = useToast();

  // Copy / cut / paste / duplicate feedback. The canvas keyboard hook used to
  // carry these next to its own second implementation of those shortcuts; the
  // implementations are gone and the feedback follows the commands' events.
  useClipboardToasts(composer, addToast);
  const { handleBlockClick } = useBlockInsertion(composer);
  useAltTextAutoTrigger(composer);

  const [canvasHoveredId, setCanvasHoveredId] = React.useState<string | null>(null);
  /** AI drills in over the inspector (boards 170:* · 66:225). */
  /* URL-derived, so it is stable for the life of the document — view mode
     is entered by navigation (StudioHeader.toggleReadOnlyView), never by state. */
  const readOnlyView = React.useMemo(() => getEditorViewMode().readOnlyView, []);
  /* A root class, not a prop, because the surfaces that still leak editing
     chrome into view mode are reached by CSS alone: the empty-container
     placeholder is a ::after in Canvas.css, and the footer's selection label is
     rendered by AquibraStudio, which an agent session must not stage. */
  /* The engine gate. Withholding React handlers left the document mutable —
     KeybindingManager listens on window in the capture phase, so click-then-
     Delete still worked. One flag on the gateway closes every chord at once. */
  React.useEffect(() => {
    if (composer) composer.readOnly = readOnlyView;
  }, [composer, readOnlyView]);

  /* useLayoutEffect, not useEffect: this class now drives LAYOUT as well as the
     canvas placeholder rules — it collapses the rail column via
     --layout-rail-width (LayoutShell.css). Under useEffect the browser can
     paint one frame with the 60px rail track still reserved, i.e. an empty
     strip beside the canvas, before the class lands. */
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    if (!readOnlyView) return;
    root.classList.add("bk-read-only-view");
    return () => root.classList.remove("bk-read-only-view");
  }, [readOnlyView]);

  const [aiInInspector, setAiInInspector] = React.useState(false);

  // Media tab dual-mode: panel (slim launcher) or fullpage (library manager)
  const [mediaFullPage, setMediaFullPage] = React.useState(false);

  /* Settings' unsaved-edit flag lives here because two children need it:
     FullPageView mounts the SettingsTab that raises it, and LeftSidebar's
     rail draws the dirty dot and guards the tab switch against it. */
  const [settingsDirty, setSettingsDirty] = React.useState(false);

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

    const openTemplates = () => {
      onLeftPanelTabChange?.("templates");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    const openDesign = () => {
      onLeftPanelTabChange?.("design");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };

    composer.on(EVENTS.UI_BROWSE_TEMPLATES, openTemplates);
    composer.on(EVENTS.UI_OPEN_DESIGN_PANEL, openDesign);
    return () => {
      composer.off(EVENTS.UI_BROWSE_TEMPLATES, openTemplates);
      composer.off(EVENTS.UI_OPEN_DESIGN_PANEL, openDesign);
    };
  }, [composer, onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]);

  // Listen for tab switch events
  React.useEffect(() => {
    if (!composer) return;
    const handler = (data: { tab: string }) => {
      /* Boards 170:2 and 66:225 put AI in the INSPECTOR column with a
         "‹ Inspector" way back — not in the left sidebar. Every existing
         entry point (the inspector's ✦ AI chip, the multi-select toolbar, the
         no-selection state, the shell's own onShowAI) emits this same event,
         so routing it here moves them all at once. */
      if (data.tab === "ai") {
        setAiInInspector(true);
        return;
      }
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
      {/* Headless. The linter only ran from inside the Brand panel, so the
          topbar Issues chip — which gates the publish-anyway confirm — read
          "No issues" until the user happened to open Brand. */}
      <DSLintRunner composer={composer} />
      <MigrationProgressMount composer={composer} />
      {/* Headless, for the same reason the linter above is: a site's own
          tokens reached the page only when the Brand panel mounted, so a
          machine without the localStorage cache drew the DEFAULT brand. */}
      <ProjectTokensApplier composer={composer} />
      <LayoutShell
        /* View mode is a VIEW, the way Figma's is: the person holding the link
           is looking, not building, so the rail, the drawer and the inspector are
           not rendered at all and the canvas takes the whole width. It used to
           trim four header tools and leave every editing surface in place, so an
           owner opening "what my client sees" was shown the full editor.
           (Founder call, 2026-08-23.) */
        drawerOpen={!readOnlyView && isLeftPanelOpen && !effectiveFullPageMode}
        drawerWidth={drawerWidth}
        fullPageMode={!readOnlyView && effectiveFullPageMode && isLeftPanelOpen}
        // Open whenever not fullpage — the no-selection state is a DRAWN
        // board (2 lines + ✦ Ask AI); gating on selectedElement collapsed the
        // column to 1px, so that state rendered off-viewport, unseeable.
        inspectorOpen={!readOnlyView && !effectiveFullPageMode}
        style={styles.container}
      >
        {/* Left Sidebar — merged rail + panel. Absent in view mode. */}
        {readOnlyView ? null : (
        <LayoutShell.Sidebar>
          <LeftSidebar
            composer={composer}
            activeTab={activeTabId}
            activeSubTab={leftPanelSubTab}
            onTabChange={handleRailTabChange}
            drawerOpen={isLeftPanelOpen && !effectiveFullPageMode}
            onDrawerToggle={onLeftPanelToggle ?? (() => {})}
            onElementSelect={handleElementSelect}
            onBlockClick={handleBlockClick}
            canvasHoveredId={canvasHoveredId}
            settingsDirty={settingsDirty}
            onSettingsDirtyChange={setSettingsDirty}
            projectId={projectId}
            publishJob={publishJob}
            onVercelPublish={onVercelPublish}
            onOpenLibrary={handleOpenLibrary}
            onCreateCollection={onOpenCreateCollection}
            onResendReview={onResendReview}
            onOpenImageEditor={onOpenImageEditor}
            onOpenIconPicker={onOpenIconPicker}
          />
        </LayoutShell.Sidebar>
        )}

        {/* Canvas Area — main editing surface */}
        <LayoutShell.Canvas>
          <div style={styles.canvasPattern} />
          <div ref={composerContainerRef} style={styles.canvasContent}>
            <Canvas
              ref={canvasRef as React.Ref<CanvasRef>}
              /* The overlay toggles (Grid / Rulers / Badges / X-Ray) are build
                 tools, so they go with the rest of the editing chrome. */
              showFooterToolbar={!readOnlyView}
              readOnly={readOnlyView}
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
              onZoomChange={onZoomChange}
              onOverlayChange={onOverlayChange}
              onDeviceChange={onDeviceChange}
              canUndo={canUndo}
              canRedo={canRedo}
            />
          </div>
          {/* Board 435:2348: the tab bar sits at the canvas FOOT — the
              context menu opens upward from it. */}
          <PageTabBar composer={composer} readOnly={readOnlyView} />
        </LayoutShell.Canvas>

        {/* Right Inspector — element properties, or the AI drill-in that
            replaces them (boards 170:*). Absent in view mode. */}
        {readOnlyView ? null : (
        <LayoutShell.Inspector>
          {aiInInspector ? (
            <AITab
              composer={composer}
              isExpanded={false}
              onExpandToggle={() => {}}
              onClose={() => setAiInInspector(false)}
              onBack={() => setAiInInspector(false)}
            />
          ) : (
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
          )}
        </LayoutShell.Inspector>
        )}

        {/* FullPage View — Templates, Settings, History, Design (replaces canvas area) */}
        <LayoutShell.FullPage>
          <FullPageView
            activeTab={activeTabId}
            composer={composer}
            onClose={handleFullPageClose}
            onSwitchToAdd={() => onLeftPanelTabChange?.("add")}
            onSwitchToDesign={() => onLeftPanelTabChange?.("design")}
            onReplayTour={undefined}
            /* The deep-link sub-tab reached the DRAWER and stopped there. Every
               fullpage tab — Settings above all — got nothing, so the site
               menu's "Plugins" landed on the Settings root and looked like a
               dead door. */
            activeSubTab={leftPanelSubTab}
            onSettingsDirtyChange={setSettingsDirty}
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
