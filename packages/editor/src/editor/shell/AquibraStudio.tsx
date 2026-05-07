import { Button } from "@/editor/shared/vibcoder/Button";
import { Stack } from "@/editor/shared/vibcoder/Stack";
/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette (error boundary / overlay / preview
 *   frame / warm neutral / onboarding theme). Chrome-hex lint rules do not apply.
 *
 * Aquibra Studio - Main Editor Component
 * Full visual web composer with all features
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AIAssistantBar } from "../../ai/AIAssistantBar";
import { getBlockDefinitions } from "../../blocks/blockRegistry";
import type { Composer } from "../../engine";
import { ExportEngine } from "../../engine/export";
import { useElementFlash } from "../../shared/hooks";
import type { ComposerConfig, ProjectData, BlockData } from "../../shared/types";
import { TooltipProvider, ToastProvider, useToast } from "@/editor/shared/vibcoder";
import { StudioSkeleton } from "@/shared/extensions/Skeleton";
import { UpgradeModal } from "@/shared/extensions/UpgradeModal";
import { migrateStorageKeys, migrateAqbKeys } from "../../shared/utils/storageMigration";
import type { CanvasRef } from "../canvas/Canvas";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { PageWizard } from "../wizard/PageWizard";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useComposerInit } from "./hooks/useComposerInit";
import { useEditorEventListeners } from "./hooks/useEditorEventListeners";
import { useEditorShortcuts } from "./hooks/useEditorShortcuts";
import { useHistoryFeedback } from "./hooks/useHistoryFeedback";
import { usePublishJob } from "./hooks/usePublishJob";
import { useSaveCallback } from "./hooks/useSaveCallback";
import { useStudioHandlers } from "./hooks/useStudioHandlers";
import { useStudioModals } from "./hooks/useStudioModals";
import { useStudioState } from "./hooks/useStudioState";
import { StudioFooter } from "./StudioFooter";
import { StudioHeader } from "./StudioHeader";
import { StudioModals } from "./StudioModals";
import { StudioPanels } from "./StudioPanels";

import "../../themes/default.css";
import "../../themes/ux-fixes.css";
import "./chrome.css";

// Run localStorage migration on app startup (module load)
migrateStorageKeys();
migrateAqbKeys();

export interface AquibraStudioProps {
  licenseKey?: string;
  options?: Partial<ComposerConfig> & {
    project?: { type?: string; default?: { pages?: Array<{ name: string; component: string }> } };
  };
  onEditor?: (composer: Composer) => void;
  onReady?: (composer: Composer) => void;
  onUpdate?: (data: ProjectData) => void;
  style?: React.CSSProperties;
  className?: string;
}

/** Error boundary to avoid hard crashes in the Studio shell */
class StudioErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Unknown error" };
  }
  componentDidCatch() {
    /* Error captured in getDerivedStateFromError */
  }
  render() {
    if (this.state.hasError) {
      return (
        <Stack
          style={{
            padding: 24,
            color: "#cdd6f4",
            background: "#11111b",
            height: "100vh",
          }}
        >
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <div style={{ color: "#f38ba8" }}>{this.state.message}</div>
          <div style={{ fontSize: 13, color: "#a6adc8" }}>Please reload the editor.</div>
          <Button
            onClick={() => window.location.reload()}
            style={{
              alignSelf: "flex-start",
              padding: "8px 14px",
              background: "linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)",
              border: "none",
              borderRadius: 6,
              color: "#1e1e2e",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </Button>
        </Stack>
      );
    }
    return this.props.children;
  }
}

const AquibraStudioShell: React.FC<AquibraStudioProps> = ({
  licenseKey: _licenseKey,
  options,
  onEditor,
  onReady,
  onUpdate,
  style,
  className = "",
}) => {
  const canvasRef = React.useRef<CanvasRef>(null);
  const composerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const hasManuallyToggledSpacing = React.useRef(false);
  const { addToast } = useToast();

  // Wizard state: show on first load when canvas is blank
  const [showWizard, setShowWizard] = React.useState(true);

  // Use extracted hooks
  const state = useStudioState();
  const modals = useStudioModals();
  const blocks: BlockData[] = React.useMemo(() => getBlockDefinitions(), []);

  // Initialize composer with hooks
  const composer = useComposerInit({
    options,
    containerRef: composerContainerRef,
    onReady,
    onEditor,
    onUpdate,
    addToast,
    setCanUndo: state.setCanUndo,
    setCanRedo: state.setCanRedo,
    setDevice: state.setDevice,
    setZoom: state.setZoom,
    setShowTemplates: modals.setShowTemplates,
    setShowExporter: modals.setShowExporter,
    setShowAI: modals.setShowAI,
    setShowComponentView: state.setShowComponentView,
    setIsDirty: state.setIsDirty,
    setSaveState: state.setSaveState,
    openCollectionSetup: modals.openCollectionSetup,
  });

  // 4 composer-driven side-effects (wizard hide, COMPONENT_CREATE_REQUESTED,
  // SHOW_IN_LAYERS, overlay-defaults init) extracted into useEditorEventListeners
  // — D2 stage 3.
  useEditorEventListeners({
    composer,
    modals,
    state: {
      setLeftPanelTab: state.setLeftPanelTab,
      setIsLeftPanelOpen: state.setIsLeftPanelOpen,
      setShowSpacingIndicators: state.setShowSpacingIndicators,
      setShowBadges: state.setShowBadges,
      setShowGuides: state.setShowGuides,
      setShowGrid: state.setShowGrid,
    },
    setShowWizard,
    hasManuallyToggledSpacingRef: hasManuallyToggledSpacing,
  });

  // Single source of truth for selection - derived from Composer
  const selection = useComposerSelection({ composer });

  // Phase 6: Element flash effect on create/duplicate
  useElementFlash(composer);
  // Convert Element to the info format used by components
  const selectedElement = React.useMemo(() => {
    if (!selection.selectedElement) return null;
    return {
      id: selection.selectedId || "",
      type: selection.selectedElement.getType?.() || "custom",
      tagName: selection.selectedElement.getTagName?.(),
    };
  }, [selection.selectedElement, selection.selectedId]);

  // Use handlers hook
  const handlers = useStudioHandlers({
    composer,
    selectedElement,
    aiContext: modals.aiContext,
    addToast,
    openAI: modals.openAI,
    closeTemplates: modals.closeTemplates,
  });

  // Enable descriptive history toasts
  useHistoryFeedback(composer, addToast);

  // Save function (extracted into useSaveCallback — D2 stage 2)
  const saveProject = useSaveCallback({
    composer,
    addToast,
    setSaveState: state.setSaveState,
    setIsDirty: state.setIsDirty,
  });

  // Keyboard shortcuts (extracted into useEditorShortcuts — D2 stage 1)
  useEditorShortcuts({ composer, canvasRef, modals, saveProject });

  // Export HTML as zip download
  const handleExportHTML = React.useCallback(async () => {
    if (!composer) return;
    modals.setExportLoading(true);
    try {
      const exportEngine = new ExportEngine(composer);
      await exportEngine.downloadZip("site-export.zip");
      addToast({
        title: "Export complete",
        description: "Your site has been downloaded as a zip file.",
        tone: "success",
        duration: 3000,
      });
    } catch (err) {
      addToast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Could not export your site.",
        tone: "error",
      });
    } finally {
      modals.setExportLoading(false);
    }
  }, [composer, addToast, modals]);

  // Export handler for Vercel deployment
  const handleExportForDeploy = React.useCallback(async () => {
    if (!composer) throw new Error("Composer not ready");
    const exportEngine = new ExportEngine(composer);
    const result = await exportEngine.exportAllPages({ format: "html", minify: true });
    const settings = composer.getProjectSettings?.();
    const projectName = settings?.seo?.siteName || "aquibra-site";
    return {
      files: result.files.map((f) => ({ path: f.name, content: f.content })),
      projectName,
    };
  }, [composer]);

  // Vercel publish flow — exports pages, sends to dashboard, polls status.
  // Hidden behind VITE_FEATURE_PUBLISH; falls back to Export HTML otherwise.
  const publishJob = usePublishJob();
  const handleVercelPublish = React.useCallback(async () => {
    const siteId = getSiteIdFromUrl();
    if (!siteId) {
      addToast({
        title: "Cannot publish",
        description: "Open this editor from a site URL with ?siteId=… to publish.",
        tone: "error",
      });
      return;
    }
    try {
      const exported = await handleExportForDeploy();
      const pages = exported.files
        .filter((f) => f.path.endsWith(".html"))
        .map((f) => ({ path: f.path, html: f.content }));
      if (pages.length === 0) {
        addToast({
          title: "Nothing to publish",
          description: "Add at least one page before publishing.",
          tone: "warning",
        });
        return;
      }
      await publishJob.publish(siteId, pages);
    } catch (err) {
      addToast({
        title: "Publish failed",
        description: err instanceof Error ? err.message : "Could not start publish.",
        tone: "error",
      });
    }
  }, [handleExportForDeploy, publishJob, addToast]);

  // Surface publish completion / failure as toasts.
  React.useEffect(() => {
    if (publishJob.uiState === "published" && publishJob.publishedUrl) {
      addToast({
        title: "Site published",
        description: publishJob.publishedUrl,
        tone: "success",
        duration: 6000,
      });
    } else if (publishJob.uiState === "failed" && publishJob.error) {
      addToast({
        title: "Publish failed",
        description: publishJob.error,
        tone: "error",
      });
    }
  }, [publishJob.uiState, publishJob.publishedUrl, publishJob.error, addToast]);

  // Auto-enable spacing on first selection
  React.useEffect(() => {
    if (
      !selectedElement ||
      state.overlays.showSpacingIndicators ||
      hasManuallyToggledSpacing.current
    )
      return;
    state.setShowSpacingIndicators(true);
  }, [state]);

  if (!composer) {
    return <StudioSkeleton />;
  }

  return (
    <Stack
      className={`bd-studio ${className}`}
      style={{
        gap: 0,
        height: "100%",
        background: "var(--buildrick-bg-app, var(--bd-bg-panel))",
        color: "var(--buildrick-text-primary)",
        fontFamily: "var(--buildrick-font-family)",
        position: "relative",
        ...style,
      }}
    >
      <header role="banner" aria-label="Editor toolbar">
        <StudioHeader
          composer={composer}
          device={state.device}
          zoom={state.zoom}
          canUndo={state.canUndo}
          canRedo={state.canRedo}
          saveStatus={state.saveState.status}
          isDirty={state.isDirty}
          lastSaved={state.saveState.lastSavedAt ? new Date(state.saveState.lastSavedAt) : null}
          lastSavedAt={state.saveState.lastSavedAt}
          previewLoading={modals.previewLoading}
          exportLoading={modals.exportLoading}
          selectedElement={selectedElement}
          showXRay={state.overlays.showXRay}
          devMode={state.overlays.devMode}
          showSuggestions={state.overlays.showSuggestions}
          studioSyncStatus={state.syncStatus}
          issues={state.issues}
          onDeviceChange={(d) => {
            state.setDevice(d);
            if (composer) composer.setDevice(d);
          }}
          onZoomChange={(z) => {
            state.setZoom(z);
            if (composer) composer.setZoom(z);
          }}
          onSetPreviewLoading={modals.setPreviewLoading}
          onSetExportLoading={modals.setExportLoading}
          onShowTemplates={modals.openTemplates}
          onShowAI={() =>
            modals.openAI(
              selectedElement
                ? {
                    elementId: selectedElement.id,
                    elementType: selectedElement.type,
                    prompt: `Improve content for ${selectedElement.type}`,
                  }
                : undefined
            )
          }
          onShowCopilot={modals.openCopilot}
          onShowExporter={modals.openExporter}
          onToggleXRay={() => state.setShowXRay((v) => !v)}
          onToggleDevMode={state.toggleDevMode}
          onToggleSuggestions={() => state.setShowSuggestions((v) => !v)}
          onAddPage={() => {
            if (
              composer &&
              "elements" in composer &&
              typeof composer.elements?.createPage === "function"
            ) {
              composer.elements.createPage("Home");
            }
          }}
          onOpenProjectSettings={modals.openProjectSettings}
          onOpenDesignSystem={() => state.openLeftPanelToTab("styling")}
          onOpenPublish={() => state.openLeftPanelToTab("publish")}
          onOpenPlugins={() => state.openLeftPanelToTab("settings", "plugins")}
          onOpenHistory={() => state.openLeftPanelToTab("history")}
          onOpenIssues={() => state.openLeftPanelToTab("settings")}
          onSave={saveProject}
          onExportHTML={handleExportHTML}
          onVercelPublish={handleVercelPublish}
          publishState={publishJob.uiState === "published" ? "published" : "draft"}
          publishLoading={publishJob.uiState === "publishing"}
          publishedUrl={publishJob.publishedUrl}
          addToast={addToast}
        />
      </header>
      <StudioPanels
        composer={composer}
        selectedElement={selectedElement}
        device={state.device}
        onDeviceChange={(d) => {
          state.setDevice(d);
          if (composer) composer.setDevice(d);
        }}
        zoom={state.zoom}
        onZoomChange={state.setZoom}
        isLeftPanelOpen={state.isLeftPanelOpen}
        onLeftPanelToggle={() => state.setIsLeftPanelOpen((v) => !v)}
        leftPanelTab={state.leftPanelTab}
        leftPanelSubTab={state.leftPanelSubTabs[state.leftPanelTab]}
        onLeftPanelTabChange={state.setLeftPanelTab}
        onLeftPanelSubTabChange={(subTab) =>
          state.setLeftPanelSubTabs((prev) => ({ ...prev, [state.leftPanelTab]: subTab }))
        }
        blocks={blocks}
        onQuickAdd={handlers.handleQuickAdd}
        showSpacingIndicators={state.overlays.showSpacingIndicators}
        showBadges={state.overlays.showBadges}
        showGuides={state.overlays.showGuides}
        showGrid={state.overlays.showGrid}
        showComponentView={state.overlays.showComponentView}
        showXRay={state.overlays.showXRay}
        devMode={state.overlays.devMode}
        onOverlayChange={(overlay, enabled) => {
          if (overlay === "guides") state.setShowGuides(enabled);
          else if (overlay === "spacing") state.setShowSpacingIndicators(enabled);
          else if (overlay === "grid") state.setShowGrid(enabled);
          else if (overlay === "badges") state.setShowBadges(enabled);
          else if (overlay === "xray") state.setShowXRay(enabled);
        }}
        onAIRequest={handlers.handleAIRequest}
        onOpenMediaLibrary={modals.openMediaLibrary}
        onOpenIconPicker={modals.openIconPicker}
        onOpenCreateCollection={modals.openCMSCollectionSetup}
        onOpenTemplates={modals.openTemplates}
        onExportForDeploy={handleExportForDeploy}
        canvasRef={canvasRef}
        composerContainerRef={composerContainerRef}
      />
      {/* Tour overlay removed — onboarding handled by orchestrator */}

      <StudioModals
        composer={composer}
        selectedElement={selectedElement}
        showTemplates={modals.showTemplates}
        onCloseTemplates={modals.closeTemplates}
        onSelectTemplate={handlers.handleSelectTemplate}
        showSaveTemplate={modals.showSaveTemplate}
        onCloseSaveTemplate={modals.closeSaveTemplate}
        onSaveTemplate={handlers.handleSaveTemplate}
        showExporter={modals.showExporter}
        onCloseExporter={modals.closeExporter}
        showAI={modals.showAI}
        onCloseAI={modals.closeAI}
        onAIGenerate={handlers.applyAIResult}
        aiContext={modals.aiContext}
        showCopilot={modals.showCopilot}
        onCloseCopilot={modals.closeCopilot}
        onCopilotInsert={handlers.handleCopilotInsert}
        showShortcuts={modals.showShortcuts}
        onCloseShortcuts={modals.closeShortcuts}
        showMediaLibrary={modals.showMediaLibrary}
        onCloseMediaLibrary={modals.closeMediaLibrary}
        onSelectMedia={(asset) => {
          modals.mediaLibraryContext?.onSelect(asset);
          modals.closeMediaLibrary();
        }}
        mediaLibraryContext={modals.mediaLibraryContext}
        showImageEditor={modals.showImageEditor}
        onCloseImageEditor={modals.closeImageEditor}
        imageEditorContext={modals.imageEditorContext}
        showIconPicker={modals.showIconPicker}
        onCloseIconPicker={modals.closeIconPicker}
        iconPickerContext={modals.iconPickerContext}
        showCollectionSetup={modals.showCollectionSetup}
        onCloseCollectionSetup={modals.closeCollectionSetup}
        collectionSetupContext={modals.collectionSetupContext}
        showCreateComponent={modals.showCreateComponent}
        onCloseCreateComponent={modals.closeCreateComponent}
        createComponentContext={modals.createComponentContext}
        showProjectSettings={modals.showProjectSettings}
        onCloseProjectSettings={modals.closeProjectSettings}
      />

      <footer
        className="layout-shell__footer"
        role="contentinfo"
        aria-label="Editor status"
      >
        <StudioFooter
          composer={composer}
          device={state.device}
          zoom={state.zoom}
          onZoomChange={(z) => {
            state.setZoom(z);
            if (composer) composer.setZoom(z);
          }}
          selectedElement={selectedElement}
        />
      </footer>

      <UpgradeModal />

      <AIAssistantBar
        isOpen={modals.showAI}
        onClose={() => modals.setShowAI(false)}
        composer={composer}
      />

      {/* Onboarding is managed by useOnboardingOrchestrator */}

      {/* Page Wizard - shown on first load for blank canvas */}
      {showWizard && (
        <PageWizard
          composer={composer}
          onComplete={() => setShowWizard(false)}
          onSkip={() => setShowWizard(false)}
        />
      )}
    </Stack>
  );
};

/**
 * Main Aquibra Studio Editor (with providers).
 *
 * Provider stack (outer → inner):
 *   TooltipProvider          — Radix.Tooltip ambient (B1 T2, delayDuration=500
 *                              matches deleted shim default).
 *   ToastProvider            — Radix.Toast queue + Viewport (B3). Hosts the
 *                              vibcoder useToast hook for all chrome consumers.
 *   StudioErrorBoundary      — last-resort UI fallback.
 */
export const AquibraStudio: React.FC<AquibraStudioProps> = (props) => (
  <TooltipProvider delayDuration={500}>
    <ToastProvider>
      <StudioErrorBoundary>
        <AquibraStudioShell {...props} />
      </StudioErrorBoundary>
    </ToastProvider>
  </TooltipProvider>
);

export default AquibraStudio;
