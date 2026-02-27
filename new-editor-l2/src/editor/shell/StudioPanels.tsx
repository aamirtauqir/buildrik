/**
 * StudioPanels - Main panel layout component
 * Manages left sidebar, canvas area, and right inspector panel
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { getBlockDefinitions, insertBlock } from "../../blocks/blockRegistry";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../../shared/constants/tabs";
import type { BlockData, DeviceType } from "../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../shared/types/media";
import { useToast } from "../../shared/ui/Toast";
import { canNestElement } from "../../shared/utils/nesting";
import { Canvas, type CanvasRef } from "../canvas/Canvas";
import { CanvasFooterToolbar, type CanvasOverlayState } from "../canvas/CanvasFooterToolbar";
import { TemplatePreviewPanel } from "../canvas/overlays/TemplatePreviewPanel";
import { ProInspector } from "../inspector/ProInspector";
import { LayoutShell } from "../rail/LayoutShell";
import { LeftRail } from "../rail/LeftRail";
import { LeftSidebar } from "../sidebar/LeftSidebar";
import { TemplateUseDrawer, type TemplateApplyConfig } from "../sidebar/tabs/templates";
import { addRecentTemplate } from "../sidebar/tabs/templates";
import type { TemplateItem } from "../sidebar/tabs/templates";
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

  // Track block insertion to prevent spam clicking
  const [isInsertingBlock, setIsInsertingBlock] = React.useState(false);

  // Track canvas hovered element for LayersPanel sync
  const [canvasHoveredId, setCanvasHoveredId] = React.useState<string | null>(null);

  // Template preview state - selected template shown in canvas area
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateItem | null>(null);

  // Template Use Drawer state - controls drawer visibility
  const [showUseTemplateDrawer, setShowUseTemplateDrawer] = React.useState(false);
  const [drawerTemplate, setDrawerTemplate] = React.useState<TemplateItem | null>(null);

  // Callbacks for inspector empty state CTAs
  const handleOpenBuildPanel = React.useCallback(() => {
    onLeftPanelTabChange?.("add");
    if (!isLeftPanelOpen) onLeftPanelToggle?.();
  }, [onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]);

  const handleBrowseTemplates = React.useCallback(() => {
    onLeftPanelTabChange?.("add");
    if (!isLeftPanelOpen) onLeftPanelToggle?.();
  }, [onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]);

  // Phase 7: Open Design/Global Styles panel
  const handleOpenDesignPanel = React.useCallback(() => {
    onLeftPanelTabChange?.("design");
    if (!isLeftPanelOpen) onLeftPanelToggle?.();
  }, [onLeftPanelTabChange, isLeftPanelOpen, onLeftPanelToggle]);

  // Listen for canvas "Browse Templates" event (from empty state CTA + command palette)
  React.useEffect(() => {
    if (!composer) return;
    const handler = () => {
      onLeftPanelTabChange?.("add");
      if (!isLeftPanelOpen) onLeftPanelToggle?.();
    };
    composer.on("ui:browse-templates", handler);
    return () => {
      composer.off("ui:browse-templates", handler);
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

  // Clear template preview when canvas element is selected (mode separation)
  React.useEffect(() => {
    if (!composer) return;

    const clearTemplatePreview = () => {
      setSelectedTemplate(null);
    };

    composer.on("element:selected", clearTemplatePreview);
    return () => {
      composer.off("element:selected", clearTemplatePreview);
    };
  }, [composer]);

  // Clear template preview when switching away from Templates tab
  React.useEffect(() => {
    if (leftPanelTab !== "build") {
      setSelectedTemplate(null);
    }
  }, [leftPanelTab]);

  // Handle template selection from TemplatesTab
  const handleTemplateSelect = React.useCallback((template: TemplateItem | null) => {
    setSelectedTemplate(template);
  }, []);

  // Handle "Use Template" click - opens drawer
  const handleUseTemplate = React.useCallback((template: TemplateItem) => {
    setDrawerTemplate(template);
    setShowUseTemplateDrawer(true);
  }, []);

  // Handle drawer close
  const handleDrawerClose = React.useCallback(() => {
    setShowUseTemplateDrawer(false);
    // Keep drawerTemplate for animation - will be cleared on next open
  }, []);

  // Handle template apply from drawer with new config
  const handleTemplateApply = React.useCallback(
    (config: TemplateApplyConfig) => {
      if (!composer || !drawerTemplate) return;

      composer.beginTransaction("apply-template");
      try {
        const template = drawerTemplate;

        if (config.mode === "create-page") {
          if (config.target === "new-page") {
            // Create new page with template
            const pageName = `${template.name} Page`;
            const newPage = composer.elements.createPage(pageName);
            composer.elements.setActivePage(newPage.id);
            composer.elements.importHTMLToActivePage(template.html);
            addToast({ message: `Created page: ${pageName}`, variant: "success", duration: 2000 });
          } else if (config.target === "replace-current") {
            // Replace current page
            if (config.createBackup) {
              // Create backup copy of current page (creates empty backup page)
              const activePage = composer.elements.getActivePage();
              if (activePage) {
                // Create backup page - full content copy would require deep clone implementation
                composer.elements.createPage(`${activePage.name} (backup)`);
              }
            }
            // Clear current page and insert template
            const activePage = composer.elements.getActivePage();
            if (activePage) {
              const rootEl = composer.elements.getElement(activePage.root.id);
              if (rootEl) {
                // Remove all children from root
                const children = rootEl.getChildren() || [];
                children.forEach((child) => {
                  composer.elements.removeElement(child.getId());
                });
              }
            }
            composer.elements.importHTMLToActivePage(template.html);
            addToast({
              message: `Replaced page with: ${template.name}`,
              variant: "success",
              duration: 2000,
            });
          } else if (config.target === "new-site") {
            // Create new site (clear all pages, start fresh)
            const pages = composer.elements.getAllPages();
            // Create one new page with template
            const newPage = composer.elements.createPage(template.name);
            composer.elements.setActivePage(newPage.id);
            composer.elements.importHTMLToActivePage(template.html);
            // Remove old pages
            pages.forEach((page) => {
              if (page.id !== newPage.id) {
                composer.elements.deletePage(page.id);
              }
            });
            addToast({
              message: `Created new site: ${template.name}`,
              variant: "success",
              duration: 2000,
            });
          }
        } else if (config.mode === "insert-page") {
          if (config.target === "current-page") {
            if (config.replaceContent) {
              // Clear page before inserting
              const activePage = composer.elements.getActivePage();
              if (activePage) {
                const rootEl = composer.elements.getElement(activePage.root.id);
                if (rootEl) {
                  const children = rootEl.getChildren() || [];
                  children.forEach((child) => {
                    composer.elements.removeElement(child.getId());
                  });
                }
              }
            }
            // Insert into current page
            composer.elements.importHTMLToActivePage(template.html);
            addToast({ message: `Inserted: ${template.name}`, variant: "success", duration: 2000 });
          } else if (config.target === "new-page") {
            // Create new page and insert
            const pageName = `${template.name} Page`;
            const newPage = composer.elements.createPage(pageName);
            composer.elements.setActivePage(newPage.id);
            composer.elements.importHTMLToActivePage(template.html);
            addToast({ message: `Created page: ${pageName}`, variant: "success", duration: 2000 });
          }
        }

        // Track as recent template
        addRecentTemplate({
          id: template.id,
          name: template.name,
          icon: template.icon,
          html: template.html,
        });

        // Close drawer and preview
        setShowUseTemplateDrawer(false);
        setSelectedTemplate(null);
      } finally {
        composer.endTransaction();
      }
    },
    [composer, drawerTemplate, addToast]
  );

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

  // Handle block click from sidebar
  const handleBlockClick = React.useCallback(
    (block: BlockData) => {
      // Prevent spam clicking during insertion
      if (isInsertingBlock) {
        return;
      }

      if (!composer) {
        addToast({ message: "Editor not ready. Please wait.", variant: "warning" });
        return;
      }

      setIsInsertingBlock(true);
      composer.beginTransaction("insert-block-sidebar");
      try {
        const page = composer.elements.getActivePage();
        if (!page) {
          addToast({ message: "No active page. Please select a page first.", variant: "error" });
          return;
        }
        const root = composer.elements.getElement(page.root.id);
        if (!root) {
          addToast({ message: "Page root element not found.", variant: "error" });
          return;
        }

        const def = getBlockDefinitions().find((b) => b.id === block.id);
        if (!def) {
          addToast({ message: `Block "${block.label}" not found in registry.`, variant: "error" });
          return;
        }

        // Smart placement: insert into selected container if valid, otherwise into root
        const selectedIds = composer.selection.getSelectedIds();
        let parentId = root.getId();
        let insertIndex: number | undefined = root.getChildCount();

        if (selectedIds.length === 1) {
          const selectedEl = composer.elements.getElement(selectedIds[0]);
          if (selectedEl) {
            const selectedType = selectedEl.getType();
            // Check if selected element can contain the new block
            const canContain = canNestElement(def.elementType, selectedType);
            if (canContain) {
              // Insert into selected container at the end
              parentId = selectedEl.getId();
              insertIndex = selectedEl.getChildCount?.() ?? 0;
            } else {
              // Insert as sibling after selected element
              const parentEl = selectedEl.getParent();
              if (parentEl) {
                const siblingIndex = parentEl
                  .getChildren()
                  .findIndex((c) => c.getId() === selectedEl.getId());
                parentId = parentEl.getId();
                insertIndex = siblingIndex >= 0 ? siblingIndex + 1 : undefined;
              }
            }
          }
        }

        const insertedId = insertBlock(composer, def, parentId, insertIndex);
        if (insertedId) {
          const el = composer.elements.getElement(insertedId);
          if (el) composer.selection.select(el);
          // Show success toast
          addToast({
            message: `Inserted: ${block.label}`,
            variant: "success",
            duration: 2000,
          });
        } else {
          addToast({ message: `Failed to insert "${block.label}".`, variant: "error" });
        }
      } catch (err) {
        addToast({
          message: `Error inserting block: ${err instanceof Error ? err.message : "Unknown error"}`,
          variant: "error",
        });
      } finally {
        composer.endTransaction();
        // Small delay to prevent rapid re-clicks
        setTimeout(() => setIsInsertingBlock(false), 150);
      }
    },
    [composer, addToast, isInsertingBlock]
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
          onTemplateSelect={handleTemplateSelect}
          selectedTemplateId={selectedTemplate?.id ?? null}
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
          {/* Template Preview Panel - overlays canvas when template selected */}
          {selectedTemplate && (
            <TemplatePreviewPanel
              template={selectedTemplate}
              composer={composer}
              onUseTemplate={handleUseTemplate}
              onClose={() => setSelectedTemplate(null)}
              visible={!!selectedTemplate}
            />
          )}
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
          onOpenBuildPanel={handleOpenBuildPanel}
          onBrowseTemplates={handleBrowseTemplates}
          onOpenDesignPanel={handleOpenDesignPanel}
        />
      </LayoutShell.Inspector>

      {/* Template Use Drawer - slide-in overlay (outside grid) */}
      <TemplateUseDrawer
        isOpen={showUseTemplateDrawer}
        template={drawerTemplate}
        onClose={handleDrawerClose}
        onApply={handleTemplateApply}
      />
    </LayoutShell>
  );
};

export default StudioPanels;
