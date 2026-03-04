/**
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
import { EVENTS } from "../../shared/constants/events";
import { useElementFlash } from "../../shared/hooks";
import type { ComposerConfig, ProjectData, BlockData } from "../../shared/types";
import { StudioSkeleton } from "../../shared/ui/Skeleton";
import { ToastProvider, useToast } from "../../shared/ui/Toast";
import { TourOverlay } from "../../shared/ui/TourOverlay";
import { UpgradeModal } from "../../shared/ui/UpgradeModal";
import { migrateStorageKeys } from "../../shared/utils/storageMigration";
import type { CanvasRef } from "../canvas/Canvas";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { OnboardingProgress } from "../onboarding";
import { OnboardingModal, isOnboardingComplete, markOnboardingComplete } from "../onboarding/OnboardingModal";
import { useComposerInit } from "./hooks/useComposerInit";
import { useHistoryFeedback } from "./hooks/useHistoryFeedback";
import { useStudioHandlers } from "./hooks/useStudioHandlers";
import { useStudioModals } from "./hooks/useStudioModals";
import { useStudioState } from "./hooks/useStudioState";
import { StudioHeader } from "./StudioHeader";
import { StudioModals } from "./StudioModals";
import { StudioPanels } from "./StudioPanels";

import "../../themes/default.css";
import "../../themes/ux-fixes.css";

// Run localStorage migration on app startup (module load)
migrateStorageKeys();

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
        <div
          style={{
            padding: 24,
            color: "#cdd6f4",
            background: "#11111b",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <div style={{ color: "#f38ba8" }}>{this.state.message}</div>
          <div style={{ fontSize: 13, color: "#a6adc8" }}>Please reload the editor.</div>
          <button
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
          </button>
        </div>
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
  const [showOnboarding, setShowOnboarding] = React.useState(() => !isOnboardingComplete());

  const handleOnboardingDone = React.useCallback(() => {
    markOnboardingComplete();
    setShowOnboarding(false);
  }, []);

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

  // Save function
  // P1-4: Enhanced error messages with "why" context
  const saveProject = React.useCallback(() => {
    if (!composer) return;
    state.setSaveState((prev) => ({ ...prev, status: "saving", error: undefined }));
    composer
      .saveProject()
      .then(() => {
        state.setSaveState({ status: "idle", lastSavedAt: Date.now(), error: undefined });
        state.setIsDirty(false);
        addToast({
          title: "Saved",
          message: "Project saved successfully",
          variant: "success",
          duration: 1800,
        });
      })
      .catch((err) => {
        const errorMessage = err?.message || "Unknown error";
        // Provide user-friendly error context
        let userMessage = "Could not save project.";
        if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
          userMessage = "Network error — check your internet connection and try again.";
        } else if (errorMessage.includes("storage") || errorMessage.includes("quota")) {
          userMessage = "Storage full — try clearing browser data or exporting your project.";
        } else if (errorMessage.includes("permission") || errorMessage.includes("denied")) {
          userMessage = "Permission denied — try refreshing the page.";
        } else if (errorMessage.includes("timeout")) {
          userMessage = "Request timed out — the server may be busy, try again shortly.";
        }
        state.setSaveState((prev) => ({ ...prev, status: "error", error: errorMessage }));
        addToast({
          title: "Save failed",
          message: userMessage,
          variant: "error",
          action: { label: "Retry", onClick: () => saveProject() },
        });
      });
  }, [addToast, composer, state]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (
        target?.closest("input, textarea, select, [contenteditable='true']") ||
        target?.isContentEditable
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveProject();
      }
      if (!composer) return;
      const isRedo =
        (e.ctrlKey || e.metaKey) &&
        ((e.shiftKey && e.key.toLowerCase() === "z") || e.key.toLowerCase() === "y");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        composer.history.undo();
      } else if (isRedo) {
        e.preventDefault();
        composer.history.redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        modals.setShowShortcuts(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        canvasRef.current?.openCommandPalette();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "j") {
        e.preventDefault();
        modals.setShowAI((prev) => !prev);
      }
      if (e.key === "Escape") {
        modals.setShowShortcuts(false);
        modals.setShowAI(false);
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        modals.setShowShortcuts(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveProject, composer, modals]);

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

  // Listen for component creation requests
  React.useEffect(() => {
    if (!composer) return;

    const handleCreateComponentRequest = (event: { elementId: string }) => {
      modals.openCreateComponent(event.elementId);
    };

    composer.on(EVENTS.COMPONENT_CREATE_REQUESTED, handleCreateComponentRequest);
    return () => {
      composer.off(EVENTS.COMPONENT_CREATE_REQUESTED, handleCreateComponentRequest);
    };
  }, [composer, modals]);

  // Listen for "Show in Layers" navigation requests (Phase 6: UX Audit)
  React.useEffect(() => {
    if (!composer) return;

    const handleShowInLayers = () => {
      // Switch to Layers tab and open drawer
      state.setLeftPanelTab("layers");
      state.setIsLeftPanelOpen(true);
      // Also emit scroll event for LayersPanel to scroll to selection
      // This handles the case when already on Layers tab
      setTimeout(() => {
        composer.emit(EVENTS.LAYERS_SCROLL_TO_SELECTION, {});
      }, 100); // Small delay to ensure tab switch completes
    };

    composer.on(EVENTS.SHOW_IN_LAYERS, handleShowInLayers);
    return () => {
      composer.off(EVENTS.SHOW_IN_LAYERS, handleShowInLayers);
    };
  }, [composer, state]);

  // Load overlay defaults
  React.useEffect(() => {
    if (!composer?.canvasIndicators) return;
    const overlay = composer.canvasIndicators.getOverlay();
    state.setShowSpacingIndicators(overlay.showSpacing ?? !hasManuallyToggledSpacing.current);
    state.setShowBadges(overlay.showBadges ?? false);
    state.setShowGuides(overlay.showGuides ?? true);
    state.setShowGrid(overlay.showGrid ?? false);
  }, [composer, state]);

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
    <div
      className={`aqb-studio ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0A0A0A",
        color: "var(--aqb-text-primary)",
        fontFamily: "var(--aqb-font-family)",
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
              composer.elements.createPage("Untitled Page");
            }
          }}
          onOpenProjectSettings={modals.openProjectSettings}
          onOpenDesignSystem={() => state.openLeftPanelToTab("styling")}
          onOpenPublish={() => state.openLeftPanelToTab("publish")}
          onOpenPlugins={() => state.openLeftPanelToTab("settings", "plugins")}
          onOpenHistory={() => state.openLeftPanelToTab("history")}
          onOpenIssues={() => state.openLeftPanelToTab("settings")}
          onSave={saveProject}
          addToast={addToast}
        />
      </header>
      <StudioPanels
        composer={composer}
        selectedElement={selectedElement}
        device={state.device}
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
        onOpenTemplates={modals.openTemplates}
        onExportForDeploy={handleExportForDeploy}
        canvasRef={canvasRef}
        composerContainerRef={composerContainerRef}
      />
      <TourOverlay />
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingDone} onSkip={handleOnboardingDone} />
      )}

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

      <UpgradeModal />

      <AIAssistantBar
        isOpen={modals.showAI}
        onClose={() => modals.setShowAI(false)}
        composer={composer}
      />

      {/* Onboarding Progress Tracker - shown for new users */}
      <OnboardingProgress />
    </div>
  );
};

/** Main Aquibra Studio Editor (with providers) */
export const AquibraStudio: React.FC<AquibraStudioProps> = (props) => (
  <ToastProvider>
    <StudioErrorBoundary>
      <AquibraStudioShell {...props} />
    </StudioErrorBoundary>
  </ToastProvider>
);

export default AquibraStudio;
