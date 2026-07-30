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
import { getBlockDefinitions } from "../../blocks/blockRegistry";
import type { Composer } from "../../engine";
import { useElementFlash } from "../../shared/hooks";
import { EVENTS } from "../../shared/constants";
import type { ComposerConfig, ProjectData, BlockData } from "../../shared/types";
import { Button, Stack, StudioSkeleton, ToastProvider, UpgradeModal, useToast } from "@/editor/ui";
import { StaleApprovalModal } from "./modals/StaleApprovalModal";
import { PreviewOverlay } from "./PreviewOverlay";
import { migrateStorageKeys, migrateAqbKeys } from "../../shared/utils/storageMigration";
import type { CanvasRef } from "../canvas/Canvas";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { OnboardingMount } from "../onboarding/OnboardingMount";
import { useCmsSync } from "./hooks/useCmsSync";
import { useVersionSync } from "./hooks/useVersionSync";
import { useComponentSync } from "./hooks/useComponentSync";
import { hydrateUserTemplatesFromServer } from "@/services/templateSync";
import { useComposerInit } from "./hooks/useComposerInit";
import { RecoveryBanner } from "./RecoveryBanner";
import { LoadErrorBanner, type LoadErrorKind } from "./LoadErrorBanner";
import { IssuesPanel } from "./IssuesPanel";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
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
            color: "var(--bk-ink)",
            background: "var(--bk-bg-panel)",
            height: "100vh",
          }}
        >
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <div style={{ color: "var(--bk-error)" }}>{this.state.message}</div>
          <div style={{ fontSize: 13, color: "var(--bk-ink-soft)" }}>
            Please reload the editor.
          </div>
          <Button
            onClick={() => window.location.reload()}
            style={{
              alignSelf: "flex-start",
              padding: "8px 14px",
              background: "var(--bk-accent)",
              border: "none",
              borderRadius: 6,
              color: "var(--bk-accent-on)",
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

  // Use extracted hooks
  const state = useStudioState();
  const modals = useStudioModals();
  const blocks: BlockData[] = React.useMemo(() => getBlockDefinitions(), []);

  // S1.5: a dashboard load failure surfaces as a persistent banner (not a toast).
  const [loadError, setLoadError] = React.useState<LoadErrorKind>(null);
  // P3: the Issues panel (the topbar issue pill opens it — was a settings stub).
  const [issuesOpen, setIssuesOpen] = React.useState(false);

  // In-shell preview (shell state 7) — sanitized page HTML below the topbar.
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null);

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
    setShowExporter: modals.setShowExporter,
    setShowComponentView: state.setShowComponentView,
    setIsDirty: state.setIsDirty,
    setSaveState: state.setSaveState,
    openCollectionSetup: modals.openCollectionSetup,
    onLoadError: setLoadError,
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
    addToast,
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

  // T10 (topbar plan): the Issues panel's page scope needs to know which page
  // the user is on, reactively — a page switch must re-scope the list.
  const [activePageId, setActivePageId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const read = () => setActivePageId(composer.elements.getActivePage()?.id ?? null);
    read();
    composer.on(EVENTS.PAGE_CHANGED, read);
    composer.on(EVENTS.PROJECT_LOADED, read);
    return () => {
      composer.off(EVENTS.PAGE_CHANGED, read);
      composer.off(EVENTS.PROJECT_LOADED, read);
    };
  }, [composer]);

  // The Issues panel had a state slot but no producer, so it rendered "No
  // issues" no matter how many the DS linter had found. Bridge the one real
  // source we have (designSystem.lintState) into it, and keep it live — the
  // linter re-runs on token edits and emits 'lint:changed'.
  const setIssues = state.setIssues;
  React.useEffect(() => {
    const lint = composer?.designSystem?.lintState;
    if (!lint) return;
    const sync = () => {
      setIssues(
        lint.getAllVisibleIssues().map(({ tokenId, issue }) => ({
          id: `${tokenId}:${issue.type}`,
          type: issue.severity === "error" ? ("error" as const) : ("warning" as const),
          message: issue.message,
          tokenId,
          autoFixHint: issue.autoFixHint,
          location: `Brand › ${tokenId}`,
        })),
      );
    };
    sync();
    lint.on("lint:changed", sync);
    return () => {
      lint.off("lint:changed", sync);
    };
  }, [composer, setIssues]);

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
  useEditorShortcuts({ composer, modals, saveProject, openLeftPanelToTab: state.openLeftPanelToTab });

  // Export + publish lifecycle (HTML zip, Vercel deploy, publish-toast effect,
  // usePublishJob) extracted into useExportHandlers — D2 stage 4. The hook
  // owns its own publishJob instance and surfaces it back so the orchestrator
  // can wire it into Topbar / PublishDropdown without re-instantiating.
  const {
    handleExportHTML,
    handleVercelPublish,
    handlePublishAcknowledged,
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
        background: "var(--bk-bg-app, var(--bk-bg-panel))",
        color: "var(--bk-ink)",
        fontFamily: "var(--bk-font-ui)",
        position: "relative",
        ...style,
      }}
    >
      <RecoveryBanner pageCount={composer?.elements.getAllPages().length} />
      <LoadErrorBanner
        kind={loadError}
        onRetry={() => window.location.reload()}
        onSignIn={() => { window.location.href = `${DASHBOARD_URL}/auth`; }}
        onDismiss={() => setLoadError(null)}
      />
      <header role="banner" aria-label="Editor toolbar">
        <StudioHeader
          composer={composer}
          saveStatus={state.saveState.status}
          isDirty={state.isDirty}
          isOffline={isOffline}
          lastSaved={state.saveState.lastSavedAt ? new Date(state.saveState.lastSavedAt) : null}
          lastSavedAt={state.saveState.lastSavedAt}
          previewLoading={modals.previewLoading}
          selectedElement={selectedElement}
          studioSyncStatus={state.syncStatus}
          issues={state.issues}
          onInlinePreview={setPreviewHtml}
          onSetPreviewLoading={modals.setPreviewLoading}
          onSetExportLoading={modals.setExportLoading}
          // ✨ Ask AI → the AITab rail panel (single consolidated AI surface).
          // Emitting ui:switch-tab opens the "ai" tab; AITab reads the live
          // canvas selection itself, so no element context needs threading.
          onShowAI={() => composer.emit("ui:switch-tab", { tab: "ai" })}
          onShowExporter={modals.openExporter}
          onOpenProjectSettings={modals.openProjectSettings}
          onOpenDesignSystem={() => state.openLeftPanelToTab("design")}
          onOpenPublish={() => state.openLeftPanelToTab("publish")}
          onOpenPlugins={() => state.openLeftPanelToTab("settings", "plugins")}
          onOpenHistory={() => state.openLeftPanelToTab("history")}
          onOpenPublishHistory={() => state.openLeftPanelToTab("settings", "publish-history")}
          onOpenTemplates={() => state.openLeftPanelToTab("templates")}
          onOpenComponents={() => state.openLeftPanelToTab("components")}
          onOpenIssues={() => setIssuesOpen(true)}
          onOpenReview={() => state.openLeftPanelToTab("review")}
          onOpenShortcuts={modals.toggleShortcuts}
          onSave={saveProject}
          onExportHTML={handleExportHTML}
          onVercelPublish={handleVercelPublish}
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
        onOpenMediaLibrary={modals.openMediaLibrary}
        onOpenIconPicker={modals.openIconPicker}
        onOpenImageEditor={modals.openImageEditor}
        onOpenCreateCollection={modals.openCMSCollectionSetup}
        canvasRef={canvasRef}
        composerContainerRef={composerContainerRef}
        publishJob={publishJob}
        onVercelPublish={handleVercelPublish}
      />

      {/* P3: Issues panel — opened by the topbar issue pill */}
      {issuesOpen && (
        <div
          style={{
            position: "absolute",
            top: 56,
            right: 0,
            bottom: 0,
            width: 360,
            zIndex: 45,
            background: "var(--bk-bg-panel)",
            borderLeft: "1px solid var(--bk-border)",
          }}
        >
          <IssuesPanel
            issues={state.issues}
            activePageId={activePageId}
            onClose={() => setIssuesOpen(false)}
            // Jump-to-element is a refinement: an Issue id is the issue's id,
            // not reliably an element id (lint/link/alt issues aren't 1:1 with
            // a node), so v1 just closes. Wiring a real jump needs each issue
            // to carry its target elementId — a follow-up.
            onSelectElement={() => setIssuesOpen(false)}
            // applyAutoFix already wraps the rewrite in one transaction, which
            // is what lets the panel promise a single undo step. It returns
            // null when it will not touch the token — the panel shows that as
            // fix-failed instead of silently doing nothing.
            onFix={async (issue) =>
              issue.tokenId && issue.autoFixHint
                ? composer.designSystem.applyAutoFix(issue.tokenId, issue.autoFixHint)
                : null
            }
            onOpenBrand={() => {
              setIssuesOpen(false);
              composer.emit("ui:switch-tab", { tab: "design" });
            }}
            onIgnore={(tokenId) => composer.designSystem.lintState.suppress(tokenId)}
          />
        </div>
      )}
      {/* Tour overlay removed — onboarding handled by orchestrator */}

      <StudioModals
        composer={composer}
        showSaveTemplate={modals.showSaveTemplate}
        onCloseSaveTemplate={modals.closeSaveTemplate}
        onSaveTemplate={handlers.handleSaveTemplate}
        showExporter={modals.showExporter}
        onCloseExporter={modals.closeExporter}
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

      <PreviewOverlay html={previewHtml} onDone={() => setPreviewHtml(null)} />

      <UpgradeModal />

      {/* First-time onboarding checklist (gated to new users by the orchestrator). */}
      <OnboardingMount composer={composer} />

      {/* Stale-approval gate (contracts §1.5, S5.6 board 131:201): the site
          changed after the client approved it. The modal itemizes the changed
          pages, offers a fresh review round, or ships the changes deliberately. */}
      <StaleApprovalModal
        isOpen={publishJob.blockedReason === "stale-approval"}
        composer={composer}
        onClose={publishJob.dismissBlock}
        onPublishAnyway={handlePublishAcknowledged}
      />
    </Stack>
  );
};

/**
 * Main Aquibra Studio Editor (with providers).
 *
 * Provider stack (outer → inner):
 *   ToastProvider            — toast queue + viewport. Hosts the useToast
 *                              hook for all chrome consumers.
 *   StudioErrorBoundary      — last-resort UI fallback.
 *
 * (No tooltip provider: the ui Tooltip is self-contained.)
 */
export const AquibraStudio: React.FC<AquibraStudioProps> = (props) => (
  <ToastProvider>
    <StudioErrorBoundary>
      <AquibraStudioShell {...props} />
    </StudioErrorBoundary>
  </ToastProvider>
);

export default AquibraStudio;
