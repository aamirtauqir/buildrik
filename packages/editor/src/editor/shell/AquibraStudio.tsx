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
import { useElementFlash } from "../../shared/hooks";
import type { ComposerConfig, ProjectData, BlockData } from "../../shared/types";
import { TooltipProvider, ToastProvider, useToast } from "@/editor/shared/vibcoder";
import { StudioSkeleton } from "@/shared/extensions/SkeletonCompounds";
import { UpgradeModal } from "@/shared/extensions/UpgradeModal";
import { migrateStorageKeys, migrateAqbKeys } from "../../shared/utils/storageMigration";
import type { CanvasRef } from "../canvas/Canvas";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { PageWizard } from "../wizard/PageWizard";
import { OnboardingMount } from "../onboarding/OnboardingMount";
import { useCmsSync } from "./hooks/useCmsSync";
import { useVersionSync } from "./hooks/useVersionSync";
import { useComponentSync } from "./hooks/useComponentSync";
import { hydrateUserTemplatesFromServer } from "@/services/templateSync";
import { useComposerInit } from "./hooks/useComposerInit";
import { useEditorEventListeners } from "./hooks/useEditorEventListeners";
import { useEditorShortcuts } from "./hooks/useEditorShortcuts";
import { useExportHandlers } from "./hooks/useExportHandlers";
import { useHistoryFeedback } from "./hooks/useHistoryFeedback";
import { useSaveCallback } from "./hooks/useSaveCallback";
import { useStudioHandlers } from "./hooks/useStudioHandlers";
import { useStudioModals } from "./hooks/useStudioModals";
import { useStudioState } from "./hooks/useStudioState";
import { StudioFooter } from "./StudioFooter";
import { StructurePopover } from "./StructurePopover";
import { StudioHeader } from "./StudioHeader";
import { StudioModals } from "./StudioModals";
import { StudioPanels } from "./StudioPanels";
import { ConflictModal } from "./modals/ConflictModal";
import { SAVE_CONFLICT_EVENT, setBaselineLastEditedAt } from "@/services/BuildrikSyncProvider";

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
            color: "var(--buildrick-text-primary)",
            background: "var(--buildrick-bg-panel)",
            height: "100vh",
          }}
        >
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <div style={{ color: "var(--buildrick-error)" }}>{this.state.message}</div>
          <div style={{ fontSize: 13, color: "var(--buildrick-text-secondary)" }}>
            Please reload the editor.
          </div>
          <Button
            onClick={() => window.location.reload()}
            style={{
              alignSelf: "flex-start",
              padding: "8px 14px",
              background: "var(--buildrick-accent)",
              border: "none",
              borderRadius: 6,
              color: "var(--buildrick-text-on-accent)",
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

  // Wizard state: show on first load when canvas is blank.
  // Persisted via localStorage so Skip/Complete sticks across reloads.
  // Also gates against showing alongside StarterGalleryModal (DS arc T1)
  // which now owns the first-run starter-picker path.
  const WIZARD_DISMISSED_KEY = "buildrik:page-wizard-dismissed";
  const [showWizard, setShowWizard] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      // Dismissed previously → never re-show. Also stays dismissed for users
      // who completed the StarterGalleryModal flow (DS arc owns onboarding).
      if (localStorage.getItem(WIZARD_DISMISSED_KEY) === "true") return false;
      if (localStorage.getItem("buildrik:starter-gallery-seen-default") === "1") return false;
    } catch {
      // SecurityError → never show wizard rather than spam.
      return false;
    }
    return true;
  });
  const dismissWizard = React.useCallback(() => {
    setShowWizard(false);
    try {
      localStorage.setItem(WIZARD_DISMISSED_KEY, "true");
    } catch {
      // Private mode: state-flip alone is enough for this session.
    }
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

  // 4 composer-driven side-effects (wizard hide, COMPONENT_CREATE_REQUESTED,
  // SHOW_IN_LAYERS, overlay-defaults init) extracted into useEditorEventListeners
  // — D2 stage 3.
  // E7: mirror local CMS changes to the server (best-effort + retryable toast on failure).
  useCmsSync(composer, addToast);

  // #3/26: mirror version history to the server + hydrate on open (best-effort).
  useVersionSync(composer, addToast);

  // #4/27: mirror component masters to the server + hydrate on open (best-effort).
  useComponentSync(composer, addToast);

  // #13/25: pull server "My Templates" into the local cache on open (best-effort).
  React.useEffect(() => {
    if (composer) void hydrateUserTemplatesFromServer();
  }, [composer]);

  useEditorEventListeners({
    composer,
    modals,
    state: {
      setLeftPanelTab: state.setLeftPanelTab,
      setIsLeftPanelOpen: state.setIsLeftPanelOpen,
      openLeftPanelToTab: state.openLeftPanelToTab,
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

  // 60-save-states: track connectivity so the topbar can reassure "changes
  // queued, will sync" instead of looking like a failed/lost save.
  const [isOffline, setIsOffline] = React.useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  React.useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // 61-conflict: a behind-copy save was rejected by the server. Listen on the
  // window event; idempotent (keep the first) so repeated autosave conflicts
  // don't stack dialogs while one is open.
  const [conflict, setConflict] = React.useState<{ serverToken: string } | null>(null);

  // Redesign P4 (51-layers): the footer ⌗ opens the structure tree as a floating
  // popover over the canvas, not the left drawer. Open-only trigger; close via the
  // popover's X / Esc / outside-click.
  const [structureOpen, setStructureOpen] = React.useState(false);
  React.useEffect(() => {
    const onConflict = (e: Event) => {
      const token = (e as CustomEvent<{ serverLastEditedAt: string }>).detail?.serverLastEditedAt;
      if (token) setConflict((c) => c ?? { serverToken: token });
    };
    window.addEventListener(SAVE_CONFLICT_EVENT, onConflict);
    return () => window.removeEventListener(SAVE_CONFLICT_EVENT, onConflict);
  }, []);

  // Keyboard shortcuts (extracted into useEditorShortcuts — D2 stage 1)
  useEditorShortcuts({ composer, modals, saveProject });

  // Export + publish lifecycle (HTML zip, Vercel deploy, publish-toast effect,
  // usePublishJob) extracted into useExportHandlers — D2 stage 4. The hook
  // owns its own publishJob instance and surfaces it back so the orchestrator
  // can wire it into Topbar / PublishDropdown without re-instantiating.
  const {
    handleExportHTML,
    handleVercelPublish,
    publishJob,
  } = useExportHandlers({
    composer,
    addToast,
    setExportLoading: modals.setExportLoading,
  });

  // Auto-enable spacing on first selection. Deps are the specific values read
  // (not the whole `state` object, which is a fresh literal every render and
  // made this effect run on every render).
  const showSpacingIndicators = state.overlays.showSpacingIndicators;
  const setShowSpacingIndicators = state.setShowSpacingIndicators;
  React.useEffect(() => {
    if (!selectedElement || showSpacingIndicators || hasManuallyToggledSpacing.current) return;
    setShowSpacingIndicators(true);
  }, [selectedElement, showSpacingIndicators, setShowSpacingIndicators]);

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
          isOffline={isOffline}
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
          onOpenDesignSystem={() => state.openLeftPanelToTab("design")}
          onOpenPublish={() => state.openLeftPanelToTab("publish")}
          onOpenPlugins={() => state.openLeftPanelToTab("settings", "plugins")}
          onOpenHistory={() => state.openLeftPanelToTab("history")}
          onOpenIssues={() => state.openLeftPanelToTab("settings")}
          onOpenShortcuts={modals.toggleShortcuts}
          onSave={saveProject}
          onExportHTML={handleExportHTML}
          onVercelPublish={handleVercelPublish}
          // Live-state is durable (a deployment is serving) = publishedUrl
          // exists. uiState is transient job-state; a FAILED/CANCELLED
          // *republish* of an already-live site must not flip the UI back to
          // "draft" while the previous deployment is still up.
          publishState={(publishJob.uiState === "published" || publishJob.publishedUrl) ? "published" : "draft"}
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
        canUndo={state.canUndo}
        canRedo={state.canRedo}
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
        showRulers={state.overlays.showRulers}
        showComponentView={state.overlays.showComponentView}
        showXRay={state.overlays.showXRay}
        devMode={state.overlays.devMode}
        onOverlayChange={(overlay, enabled) => {
          if (overlay === "guides") state.setShowGuides(enabled);
          else if (overlay === "spacing") {
            // Mark spacing as user-controlled so the auto-enable-on-selection
            // effect stops re-enabling it after the user turns it off.
            hasManuallyToggledSpacing.current = true;
            state.setShowSpacingIndicators(enabled);
          } else if (overlay === "grid") state.setShowGrid(enabled);
          else if (overlay === "rulers") state.setShowRulers(enabled);
          else if (overlay === "badges") state.setShowBadges(enabled);
          else if (overlay === "xray") state.setShowXRay(enabled);
        }}
        onAIRequest={handlers.handleAIRequest}
        onOpenMediaLibrary={modals.openMediaLibrary}
        onOpenIconPicker={modals.openIconPicker}
        onOpenImageEditor={modals.openImageEditor}
        onOpenCreateCollection={modals.openCMSCollectionSetup}
        onOpenTemplates={modals.openTemplates}
        canvasRef={canvasRef}
        composerContainerRef={composerContainerRef}
        publishJob={publishJob}
        onVercelPublish={handleVercelPublish}
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
        showSaveAsComponent={modals.showSaveAsComponent}
        onCloseSaveAsComponent={modals.closeSaveAsComponent}
        saveAsComponentContext={modals.saveAsComponentContext}
        showProjectSettings={modals.showProjectSettings}
        onCloseProjectSettings={modals.closeProjectSettings}
        showCMSCollectionSetup={modals.showCMSCollectionSetup}
        onCloseCMSCollectionSetup={modals.closeCMSCollectionSetup}
        showCMSRecords={modals.showCMSRecords}
        onCloseCMSRecords={modals.closeCMSRecords}
        showCommandPalette={modals.showCommandPalette}
        onCloseCommandPalette={modals.closeCommandPalette}
      />

      <ConflictModal
        open={!!conflict}
        onClose={() => setConflict(null)}
        onReload={() => window.location.reload()}
        onSaveBackup={() => {
          // Download the local copy so nothing is lost, then take the latest.
          try {
            const blob = new Blob([JSON.stringify(composer.exportProject(), null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `buildrik-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          } finally {
            window.location.reload();
          }
        }}
        onOverwrite={() => {
          // Adopt the server's version token so our next save matches + wins.
          if (conflict) setBaselineLastEditedAt(conflict.serverToken);
          setConflict(null);
          saveProject();
        }}
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
          // Drive the connection pill from the real save state — it was
          // hardcoded "Connected · main" regardless of save failures.
          syncConnected={state.saveState.status !== "error"}
          onOpenStructure={() => setStructureOpen(true)}
        />
      </footer>

      <StructurePopover
        open={structureOpen}
        onClose={() => setStructureOpen(false)}
        composer={composer}
        selectedElement={selectedElement}
      />

      <UpgradeModal />

      <AIAssistantBar
        isOpen={modals.showAI}
        onClose={() => modals.setShowAI(false)}
        composer={composer}
      />

      {/* First-time onboarding checklist (gated to new users by the orchestrator). */}
      <OnboardingMount composer={composer} />

      {/* Page Wizard — shown on first load for a blank canvas. Persists
          dismissal so Skip/Complete sticks across reloads (was always
          re-mounting alongside StarterGalleryModal pre-fix). */}
      {showWizard && (
        <PageWizard
          composer={composer}
          onComplete={dismissWizard}
          onSkip={dismissWizard}
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
