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
import { ToastProvider, UpgradeModal, useToast, StudioSkeleton, Button } from "@/editor/chrome-ui";
import { StaleApprovalModal } from "./modals/StaleApprovalModal";
import { SessionExpiredModal } from "./modals/SessionExpiredModal";
import { PublishConfirmModal } from "./modals/PublishConfirmModal";
import { PublishErrorsConfirmModal } from "./modals/PublishErrorsConfirmModal";
import { PublishGateModal, isPublishGateReason } from "./modals/PublishGateModal";
import { gateFromBlockReason, type PublishGate } from "./lifecycle";
import { useLifecycle } from "./hooks/useLifecycle";
import { PreviewOverlay } from "./PreviewOverlay";
import { CompareHost } from "./CompareHost";
import { sanitizeHTMLForPreview } from "../export/ExportUtils";
import { migrateStorageKeys, migrateAqbKeys } from "../../shared/utils/storageMigration";
import type { CanvasRef } from "../canvas/Canvas";
import { useComposerSelection } from "../canvas/hooks/useComposerSelection";
import { OnboardingMount } from "../onboarding/OnboardingMount";
import { useCmsSync } from "./hooks/useCmsSync";
import { useVersionSync } from "./hooks/useVersionSync";
import { useDeepLink } from "./hooks/useDeepLink";
import { useComponentSync } from "./hooks/useComponentSync";
import { hydrateUserTemplatesFromServer } from "@/services/templateSync";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useComposerInit } from "./hooks/useComposerInit";
import { RecoveryBanner } from "./RecoveryBanner";
import { LoadErrorBanner, type LoadErrorKind } from "./LoadErrorBanner";
import { IssuesPanel } from "./IssuesPanel";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { useEditorEventListeners } from "./hooks/useEditorEventListeners";
import { useEditorShortcuts } from "./hooks/useEditorShortcuts";
import { useExportHandlers } from "./hooks/useExportHandlers";
import { exportPublishPages } from "./exportPublishPages";
import { submitForReview } from "../../services/ReviewService";
import { useHistoryFeedback } from "./hooks/useHistoryFeedback";
import { usePublishOutcomeFlash } from "./hooks/usePublishOutcomeFlash";
import { useSaveCallback } from "./hooks/useSaveCallback";
import { useStudioHandlers } from "./hooks/useStudioHandlers";
import { useStudioModals } from "./hooks/useStudioModals";
import { useStudioState } from "./hooks/useStudioState";
import { StudioFooter } from "./StudioFooter";
import { StructurePopover } from "./StructurePopover";
import { StudioHeader } from "./StudioHeader";
import { StudioModals } from "./StudioModals";
import { StudioPanels } from "./StudioPanels";
import { getTabMode, type GroupedTabId } from "../rail/tabsConfig";
import { ConflictModal } from "./modals/ConflictModal";
import { SAVE_CONFLICT_EVENT, setBaselineLastEditedAt } from "@/services/BuildrikSyncProvider";

import "../../themes/default.css";
import "../../themes/ux-fixes.css";
import "./chrome.css";
// flowbite-bigbang Task 2: configure flowbite-react's tw: class prefix
// (spec §4.1) before any flowbite-react component can mount in the real app.
import "../chrome-ui/flowbiteStore";
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
        <div
          className="tw:flex tw:flex-col tw:gap-3"
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

  // Use extracted hooks
  const state = useStudioState();
  const modals = useStudioModals();
  const blocks: BlockData[] = React.useMemo(() => getBlockDefinitions(), []);

  // S1.5: a dashboard load failure surfaces as a persistent banner (not a toast).
  const [loadError, setLoadError] = React.useState<LoadErrorKind>(null);
  /* Board 813:4870 — a mid-session 401 (manual save OR autosave) opens the
     blocking recovery surface instead of a toast. Cleared the moment any save
     lands (the watcher below), or by an explicit Keep editing. */
  const [authExpired, setAuthExpired] = React.useState(false);
  const onAuthExpired = React.useCallback(() => setAuthExpired(true), []);
  // P3: the Issues panel. Its doors: the Publish panel's open-errors gate,
  // the site menu and ⌘K, all through `UI_OPEN_ISSUES` (the topbar chip that
  // used to open it is gone — owner decision 11).
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
    setIsDirty: state.setIsDirty,
    setSaveState: state.setSaveState,
    openCollectionSetup: modals.openCollectionSetup,
    onLoadError: setLoadError,
    onAuthExpired,
  });

  /* The Issues panel's one door (owner decision 11 removed the topbar chip). */
  React.useEffect(() => {
    if (!composer) return;
    const open = () => setIssuesOpen(true);
    composer.on(EVENTS.UI_OPEN_ISSUES, open);
    return () => {
      composer.off(EVENTS.UI_OPEN_ISSUES, open);
    };
  }, [composer]);

  /**
   * "Preview" from anywhere opens board 65:211, not just the topbar eye.
   *
   * `UI_TOGGLE_PREVIEW` has three emitters — the ⌘K palette, the canvas
   * palette, and an onboarding step — and all three used to land on
   * `composer.setPreviewMode`, which starts the interaction runtime, emits
   * `PREVIEW_MODE_CHANGED` (nothing listens) and changes not one pixel of
   * chrome. The command reported success and the screen stayed put. They open
   * the overlay now, and toggle it closed if it is already up.
   */
  React.useEffect(() => {
    if (!composer) return;
    const handle = () => {
      setPreviewHtml((current) => {
        if (current != null) return null;
        const raw = composer.exportHTML().combined || "<!DOCTYPE html><html><body>No content</body></html>";
        return sanitizeHTMLForPreview(raw);
      });
    };
    composer.on(EVENTS.UI_TOGGLE_PREVIEW, handle);
    return () => {
      composer.off(EVENTS.UI_TOGGLE_PREVIEW, handle);
    };
  }, [composer]);

  // 4 composer-driven side-effects (wizard hide, COMPONENT_CREATE_REQUESTED,
  // SHOW_IN_LAYERS, overlay-defaults init) extracted into useEditorEventListeners
  // — D2 stage 3.
  // E7: mirror local CMS changes to the server (best-effort + retryable toast on failure).
  useCmsSync(composer, addToast);

  // #3/26: mirror version history to the server + hydrate on open (best-effort).
  useVersionSync(composer, addToast);
  /* ?el=&page= from the Layers menu's "Copy link" — selects on load. */
  useDeepLink(composer);

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
    onAuthExpired,
  });

  /* Recovery closes the surface from EITHER save path: a successful save
     settles status to "idle", including an autosave that succeeded after the
     user signed back in from another tab. */
  React.useEffect(() => {
    if (authExpired && state.saveState.status === "idle") setAuthExpired(false);
  }, [authExpired, state.saveState.status]);

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
  // don't stack dialogs while one is open. `open` is separate from the token:
  // a dismissed dialog keeps the token, so the save pill's `conflict` state
  // can re-open it (B2, decision #23) with the same three ways out.
  const [conflict, setConflict] = React.useState<{ serverToken: string; open: boolean } | null>(null);

  // Redesign P4 (51-layers): the footer ⌗ opens the structure tree as a floating
  // popover over the canvas, not the left drawer. Open-only trigger; close via the
  // popover's X / Esc / outside-click.
  const [structureOpen, setStructureOpen] = React.useState(false);
  React.useEffect(() => {
    const onConflict = (e: Event) => {
      const token = (e as CustomEvent<{ serverLastEditedAt: string }>).detail?.serverLastEditedAt;
      if (token) setConflict((c) => (c?.open ? c : { serverToken: token, open: true }));
    };
    window.addEventListener(SAVE_CONFLICT_EVENT, onConflict);
    return () => window.removeEventListener(SAVE_CONFLICT_EVENT, onConflict);
  }, []);

  // Keyboard shortcuts (extracted into useEditorShortcuts — D2 stage 1)
  useEditorShortcuts({
    composer,
    modals,
    saveProject,
    openLeftPanelToTab: state.openLeftPanelToTab,
    // T9: same handler the site menu's "Site settings" row uses.
    openSiteSettings: modals.openProjectSettings,
  });

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

  /* ── The site's ONE next move, derived once (B4, decision #34) ────────────
     `useLifecycle` owns the review-status reads and the one call to
     `deriveLifecycleState`. The topbar (StudioHeader) and the Publish panel
     (StudioPanels → PublishTab) receive the same `nextMove`, so the CTA, the
     panel footer, its gate banner and the dialog below all read one gate. */
  const errorCount = React.useMemo(
    () => state.issues.filter((i) => i.type === "error").length,
    [state.issues],
  );
  const { reviewStatus, openCommentCount, nextMove, gateAfterErrors } = useLifecycle({
    composer,
    addToast,
    isDirty: state.isDirty,
    lastSavedAt: state.saveState.lastSavedAt,
    // "offline" is the browser being offline OR the dashboard sync being
    // disconnected — the same rule the save pill uses.
    offline: isOffline || state.syncStatus === "offline",
    errorCount,
    publishedUrl: publishJob.publishedUrl,
    lastPublishedAt: publishJob.lastPublishedAt,
    serverHasUnpublishedChanges: publishJob.hasUnpublishedChanges,
    serverBlock: publishJob.blockedReason,
  });

  /* ── The publish door (B4 — ONE confirm door, both entrances) ─────────────
     `publishDoor` is the dialog the user asked for by pressing a publish verb,
     routed on `nextMove.gate`. The server's post-click refusal
     (`publishJob.blockedReason`) lands on the same enum, so each dialog's
     `open` is "the user asked for this door OR the server sent them to it";
     closing does both — clears the ask and dismisses the block.

       open-errors        → "Publish with N open errors?" (B1-11), whose
                            Publish anyway continues to `gateAfterErrors`
       changes-requested  → the changes-requested gate (B1-09)
       stale-approval     → StaleApprovalModal (B1-10) — its Publish anyway
                            ships with `acknowledgeStale`
       confirm            → the four-facts confirm (B3-10)
       waiting · none     → nothing opens; the CTA was disabled with its reason

     Publishing replaces the live site for every visitor. The stop on the
     common path is the facts confirm; StaleApprovalModal used to be the only
     gate, and it fires after the server has already refused. */
  const [publishDoor, setPublishDoor] = React.useState<PublishGate>("none");
  const serverGate = gateFromBlockReason(publishJob.blockedReason);
  const doorOpen = React.useCallback(
    (gate: PublishGate) => publishDoor === gate || serverGate === gate,
    [publishDoor, serverGate],
  );
  const closeDoor = React.useCallback(() => {
    setPublishDoor("none");
    publishJob.dismissBlock();
  }, [publishJob]);
  /* Review panel re-send. `TabRouter` declares `onResendReview` and forwards it
     to `ReviewTab` as `onResend`, and NOTHING supplied it — the chain simply
     stopped at the shell. ReviewTab renders its "Re-send" button
     unconditionally and `doResend` opens with `if (!onResend) return;`, so the
     button was live, clickable, and silent.

     Same path the topbar's SendForReview takes (snapshot then submit), minus
     the note/summary/email the compose form collects: a panel re-send is a
     fresh round of what is already there, not a new message. A failed snapshot
     still sends — the round matters more than the preview, which is the
     tradeoff SendForReview already makes. */
  const resendReview = React.useCallback(async (clientEmail?: string) => {
    let snapshotPages;
    if (composer) {
      try {
        snapshotPages = await exportPublishPages(composer);
      } catch (e) {
        console.warn("[review] snapshot render failed; re-sending without preview", e);
      }
    }
    /* The third argument is `clientEmail`, and it used to be hardcoded
       `undefined`. `submitReview` mints a review token only when it is given an
       email, so every round after the first carried `token: null` and the
       client had no link to open — while the button said "Re-send for review"
       and the client's old link still showed round 1's "You approved this".
       The panel passes the round's own `invitedEmail`, so a re-send goes to
       whoever the round was sent to; an internal submit with no client still
       passes undefined and stays internal. */
    const outcome = await submitForReview(undefined, undefined, clientEmail, snapshotPages);
    composer?.emit(EVENTS.REVIEW_SENT, { invitedEmail: clientEmail ?? null });
    return outcome;
  }, [composer]);

  /* Routes on the GATE, not the kind: `changes-requested` is a publish door
     even though the topbar's own verb there is "Open feedback" — the panel's
     "Publish to production" still has to answer with the gate modal. */
  const requestPublish = React.useCallback(() => {
    const gate = nextMove?.gate ?? "none";
    if (gate === "waiting" || gate === "unchecked" || gate === "none") return;
    setPublishDoor(gate);
  }, [nextMove]);
  const confirmPublish = React.useCallback(async () => {
    setPublishDoor("none");
    await handleVercelPublish();
  }, [handleVercelPublish]);

  // T5 (topbar plan D10/eng D11): the 2s outcome flash behind the topbar's
  // "✓ Published" transient. Display state only — toasts stay owned by
  // useExportHandlers, announcements by StudioHeader.
  const publishOutcome = usePublishOutcomeFlash(publishJob.uiState);

  /* Announce a real publish on the bus. The onboarding checklist used to tick
     "Publish your site" when the publish PANEL opened — the CTA press, not the
     outcome — so the list could reach 7 of 7 over a site that had never been
     deployed. Nothing else on the bus could tell, because until now nothing
     said it: publishing lives above the composer and never spoke to it. */
  const publishedJobRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (publishJob.uiState !== "published" || !publishJob.jobId) return;
    if (publishedJobRef.current === publishJob.jobId) return;
    publishedJobRef.current = publishJob.jobId;
    composer?.emit(EVENTS.SITE_PUBLISHED, {
      jobId: publishJob.jobId,
      url: publishJob.publishedUrl,
    });
  }, [publishJob.uiState, publishJob.jobId, publishJob.publishedUrl, composer]);

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
    <div
      className={`tw:flex tw:flex-col tw:gap-0 bd-studio ${className}`}
      style={{
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
        /* New tab, deliberately: the auth load-error can sit over LOCAL
           fallback changes being edited, and a same-tab redirect destroys
           them — the exact failure the session-expired surface exists to
           prevent. Same-origin cookie lands either way. */
        onSignIn={() => window.open(`${DASHBOARD_URL}/auth?reason=session-expired`, "_blank", "noopener")}
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
          onOpenPublishHistory={() => state.openLeftPanelToTab("history", "published")}
          onOpenActivity={() => state.openLeftPanelToTab("history", "activity")}
          onOpenTemplates={() => state.openLeftPanelToTab("templates")}
          onOpenComponents={() => state.openLeftPanelToTab("components")}
          onOpenIssues={() => setIssuesOpen(true)}
          onOpenReview={() => state.openLeftPanelToTab("review")}
          onOpenConflict={() => setConflict((c) => (c ? { ...c, open: true } : c))}
          onOpenShortcuts={modals.toggleShortcuts}
          onSave={saveProject}
          onExportHTML={handleExportHTML}
          onVercelPublish={requestPublish}
          publishLoading={publishJob.uiState === "publishing"}
          publishedUrl={publishJob.publishedUrl}
          publishOutcome={publishOutcome}
          reviewStatus={reviewStatus}
          openCommentCount={openCommentCount}
          nextMove={nextMove}
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
        onResendReview={resendReview}
        canvasRef={canvasRef}
        composerContainerRef={composerContainerRef}
        publishJob={publishJob}
        /* The panel's CTA is the SAME door as the topbar's: `requestPublish`
           routes on `nextMove.gate` and opens one dialog. The panel used to
           open its own two-step wizard whose second step duplicated the
           facts confirm — two gates for one board (B3-10). */
        nextMove={nextMove}
        onRequestPublish={requestPublish}
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
            /* B9 / SH-63 — a row click lands on the canvas: the element the
               issue names, else the first element that uses its token (the
               engine's usage tracker knows), else the Brand panel where the
               token lives. Never a dead click. */
            onSelectElement={(issue) => {
              const refs = issue.tokenId ? composer.designSystem.tokenUsage.getBreakdown(issue.tokenId) : [];
              const ids = [issue.elementId, ...refs.map((r) => r.elementId)].filter((id): id is string => Boolean(id));
              const target = ids.map((id) => composer.elements.getElement(id)).find((el) => el != null);
              setIssuesOpen(false);
              if (target) composer.selection.select(target);
              else composer.emit("ui:switch-tab", { tab: "design" });
            }}
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
      />

      <ConflictModal
        open={!!conflict?.open}
        onClose={() => setConflict((c) => (c ? { ...c, open: false } : c))}
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
          /* F15 — a full-page tab replaces the canvas, so the footer's selection
             readout and zoom control describe something that is not on screen.
             The footer is a flex sibling OUTSIDE LayoutShell's grid, which is
             why `.layout-shell--fullpage` cannot reach it and the mode has to
             be handed over explicitly. StudioPanels derives the same condition
             from the same tab for its own grid. */
          fullPage={getTabMode((state.leftPanelTab as GroupedTabId) || "add") === "fullpage"}
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

      <PreviewOverlay
        html={previewHtml}
        onDone={() => setPreviewHtml(null)}
        siteId={getSiteIdFromUrl()}
      />
      {/* B8: the one Compare, opened by every Compare door via UI_COMPARE_OPEN. */}
      <CompareHost composer={composer} siteId={getSiteIdFromUrl()} />

      <UpgradeModal />

      {/* First-time onboarding checklist (gated to new users by the orchestrator). */}
      <OnboardingMount composer={composer} />

      {/* Stale-approval gate (contracts §1.5, S5.6 board 131:201): the site
          changed after the client approved it. The modal itemizes the changed
          pages, offers a fresh review round, or ships the changes deliberately. */}
      <StaleApprovalModal
        isOpen={doorOpen("stale-approval")}
        composer={composer}
        onClose={closeDoor}
        onPublishAnyway={() => {
          setPublishDoor("none");
          void handlePublishAcknowledged();
        }}
      />

      {/* The changes-requested gate (B1-09), by name from the pre-click door.
          `no-review` / `review-pending` are `waiting` — a shut door, never a
          dialog — EXCEPT when the server is the one saying so: then the
          pre-click derivation was stale (a round sent from another tab), the
          CTA was enabled, and a silent refusal is the defect this flow was
          fixed for. The server's own reason opens its board (307:2193 /
          307:2213) while `useLifecycle` re-reads the round so the CTA and the
          panel catch up. */}
      <PublishGateModal
        reason={
          publishDoor === "changes-requested"
            ? "changes-requested"
            : isPublishGateReason(publishJob.blockedReason)
              ? publishJob.blockedReason
              : null
        }
        composer={composer}
        onClose={closeDoor}
      />

      {/* B1-11 — the open-errors confirm. "Publish anyway" continues to the
          next door for the same site (the facts confirm, or the stale
          acknowledgement when the approval is also stale). */}
      <PublishErrorsConfirmModal
        open={doorOpen("open-errors")}
        issues={state.issues}
        reviewerInRound={
          reviewStatus.state === "none" ? null : (reviewStatus.reviewerName ?? "your reviewer")
        }
        onFixFirst={() => {
          closeDoor();
          setIssuesOpen(true);
        }}
        onPublishAnyway={() => setPublishDoor(gateAfterErrors)}
        onClose={closeDoor}
      />

      <SessionExpiredModal
        open={authExpired}
        composer={composer}
        lastSavedAt={state.saveState.lastSavedAt ?? null}
        onRetry={saveProject}
        onKeepEditing={() => setAuthExpired(false)}
      />

      {/* B3-10 — the four-facts confirm before an irreversible deploy. Runs
          BEFORE the publish call, so a server refusal the pre-click gate could
          not see (a revision that went stale between paint and click) still
          lands in its dialog afterwards — sequential, not alternatives. */}
      <PublishConfirmModal
        isOpen={doorOpen("confirm")}
        composer={composer}
        /* So the confirm can ask `runPrePublishChecks` whether this workspace
           can deploy at all — the panel path has always asked; this one
           published first and found out afterwards. */
        siteId={getSiteIdFromUrl()}
        isPublished={publishJob.uiState === "published" || !!publishJob.publishedUrl}
        publishedUrl={publishJob.publishedUrl}
        onConfirm={confirmPublish}
        onClose={closeDoor}
      />
    </div>
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
