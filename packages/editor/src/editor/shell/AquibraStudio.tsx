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
import type { Composer } from "@/engine";
import { makeFirstHeadingH1 } from "@/engine/commands/commandOperations";
import { useElementFlash } from "@/shared/hooks";
import { EVENTS } from "@/shared/constants";
import { useActivePageId } from "@/editor/shared/useActivePageId";
import type { ComposerConfig, ProjectData } from "@/shared/types";
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
import { migrateStorageKeys, migrateAqbKeys } from "@/shared/utils/storageMigration";
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
import { useTabSwitchGuard } from "./hooks/useTabSwitchGuard";
import type { DirtyDomain } from "./shellDirtyRegistry";
import { useViewerChrome } from "./hooks/useEditorRole";
import { isTabAllowedForViewer, type GroupedTabId } from "@/editor/rail/tabsConfig";
import { UnsavedTabSwitchDialog } from "./modals/UnsavedTabSwitchDialog";
import { LoadErrorBanner, type LoadErrorKind } from "./LoadErrorBanner";
import { IssuesPanel } from "./IssuesPanel";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { useEditorEventListeners } from "./hooks/useEditorEventListeners";
import { useEditorShortcuts } from "./hooks/useEditorShortcuts";
import { useExportHandlers } from "./hooks/useExportHandlers";
import { exportPublishPages, renderPreviewHtml } from "./exportPublishPages";
import { submitForReview } from "@/services/ReviewService";
import { locateComment } from "@/editor/sidebar/tabs/review/locate";
import { openPublishCheckFix } from "@/editor/sidebar/tabs/publish/PublishTab";
import { PUBLISH_CHECK_ISSUE } from "./hooks/useIssuesFeed";
import { useHistoryFeedback } from "./hooks/useHistoryFeedback";
import { usePublishOutcomeFlash } from "./hooks/usePublishOutcomeFlash";
import { useSaveCallback } from "./hooks/useSaveCallback";
import { useServerConflict } from "./hooks/useServerConflict";
import { useLoadRepair } from "./hooks/useLoadRepair";
import { trackEvent } from "@/shared/utils/errorTracking";
import { getEditorViewMode } from "@shared/utils/editorViewMode";
import { useStudioHandlers } from "./hooks/useStudioHandlers";
import { useStudioModals } from "./hooks/useStudioModals";
import { useStudioState } from "./hooks/useStudioState";
import { useIssuesFeed } from "./hooks/useIssuesFeed";
import { StudioHeader } from "./StudioHeader";
import { StudioModals } from "./StudioModals";
import { StudioPanels } from "./StudioPanels";
import { requestAssetPick, useAssetPickBridge } from "../sidebar/tabs/media/data/assetPick";
import type { MediaAsset, MediaAssetType } from "@shared/types/media";
import { ConflictModal } from "./modals/ConflictModal";
import { useOtherTabNotice } from "./hooks/useOtherTabNotice";

import "../../themes/default.css";
import { requestBrandToken } from "@/editor/design-system/ui/brandOpenRequest";
import "../../themes/ux-fixes.css";
import "./chrome.css";
// flowbite-bigbang Task 2: configure flowbite-react's tw: class prefix
// (spec §4.1) before any flowbite-react component can mount in the real app.
import "../chrome-ui/flowbiteStore";
// Run localStorage migration on app startup (module load)
migrateStorageKeys();
migrateAqbKeys();

export interface AquibraStudioProps {
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

/** How a failed "Leave anyway" discard names its surface in the toast. */
const DISCARD_SURFACE: Record<DirtyDomain, string> = {
  settings: "Settings",
  "cms-record": "record",
};

const AquibraStudioShell: React.FC<AquibraStudioProps> = ({
  options,
  onEditor,
  onReady,
  onUpdate,
  style,
  className = "",
}) => {
  const canvasRef = React.useRef<CanvasRef>(null);
  const composerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const { addToast } = useToast();

  // Use extracted hooks
  const state = useStudioState();
  const modals = useStudioModals();

  /* B-1: every left-panel tab-switch door gets these two guarded sinks, never
     the raw `state.setLeftPanelTab` / `state.openLeftPanelToTab` — the rail,
     ui:switch-tab and StudioPanels' open requests (setLeftPanelTab), and
     ⇧A, the palette, UI_PANEL_OPEN and every onOpen* deep link
     (openLeftPanelToTab). A switch that would unmount unsaved Settings or CMS
     record work (shellDirtyRegistry) prompts first. The VIEWER gate stays in
     the sinks themselves (useStudioState); a switch it refuses is not
     prompted for. */
  const viewerChrome = useViewerChrome();
  const isTabAllowed = React.useCallback(
    (tab: string) => isTabAllowedForViewer(tab as GroupedTabId, viewerChrome),
    [viewerChrome],
  );
  const onDiscardFailed = React.useCallback(
    (domains: DirtyDomain[]) =>
      domains.forEach((d) =>
        addToast({ tone: "error", description: `Couldn't discard ${DISCARD_SURFACE[d]} changes` }),
      ),
    [addToast],
  );
  const {
    setLeftPanelTab: guardedSetLeftPanelTab,
    openLeftPanelToTab: guardedOpenLeftPanelToTab,
    toggleLeftPanel: guardedToggleLeftPanel,
    closeLeftPanel: guardedCloseLeftPanel,
    dialogProps: tabSwitchDialogProps,
  } = useTabSwitchGuard({
    leftPanelTab: state.leftPanelTab,
    leftPanelSubTabs: state.leftPanelSubTabs,
    setLeftPanelTab: state.setLeftPanelTab,
    openLeftPanelToTab: state.openLeftPanelToTab,
    isTabAllowed,
    onDiscardFailed,
    isLeftPanelOpen: state.isLeftPanelOpen,
    setIsLeftPanelOpen: state.setIsLeftPanelOpen,
  });

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
  /** Draft records the previewed page's lists leave out (REA #18). */
  const [previewDrafts, setPreviewDrafts] = React.useState(0);
  /* Decision 9: the build's own state — building, or failed (with its cause
     and how many times in a row). A failed build showed nothing. */
  const [previewBuild, setPreviewBuild] = React.useState<
    { status: "building"; attempts: number } | { status: "error"; error: string; attempts: number } | null
  >(null);


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

  /* Audit G3-061: every "choose an image" door opens the Assets drawer's pick
     mode — the one picker (board 6764:59051). */
  useAssetPickBridge(composer);
  const openAssetPick = React.useCallback(
    (allowedTypes: MediaAssetType[], onSelect: (asset: MediaAsset) => void, forLabel?: string) => {
      if (composer) requestAssetPick(composer, { allowedTypes, onSelect, label: forLabel });
    },
    [composer],
  );

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
  const previewOpenRef = React.useRef(false);
  const previewRun = React.useRef(0);
  const buildPreview = React.useCallback(() => {
    if (!composer) return;
    const mine = ++previewRun.current;
    setPreviewHtml(null);
    setPreviewBuild((b) => ({ status: "building", attempts: b?.status === "error" ? b.attempts : 0 }));
    renderPreviewHtml(composer).then(
      ({ html, hiddenDrafts }) => {
        if (mine !== previewRun.current) return;
        setPreviewBuild(null);
        setPreviewDrafts(hiddenDrafts);
        setPreviewHtml(sanitizeHTMLForPreview(html));
      },
      (err: unknown) => {
        if (mine !== previewRun.current) return;
        const error = err instanceof Error && err.message ? err.message : "Something on this page couldn't be rendered.";
        setPreviewBuild((b) => {
          const attempts = (b?.attempts ?? 0) + 1;
          trackEvent("preview.build_failed", { attempt: attempts });
          return { status: "error", error, attempts };
        });
      },
    );
  }, [composer]);
  const closePreview = React.useCallback(() => {
    previewRun.current += 1;
    setPreviewBuild(null);
    setPreviewHtml(null);
  }, []);
  previewOpenRef.current = previewHtml != null || previewBuild != null;
  React.useEffect(() => {
    if (!composer) return;
    /* Building is async — CMS bindings resolve as publish resolves them
       (renderPreviewHtml) — so a toggle that lands while one is building
       supersedes it (previewRun) instead of opening a stale preview. */
    const handle = () => {
      if (previewOpenRef.current) closePreview();
      else buildPreview();
    };
    composer.on(EVENTS.UI_TOGGLE_PREVIEW, handle);
    return () => {
      previewRun.current += 1;
      composer.off(EVENTS.UI_TOGGLE_PREVIEW, handle);
    };
  }, [composer, buildPreview, closePreview]);

  // Composer-driven side-effects (COMPONENT_CREATE_REQUESTED, overlay-defaults
  // init, …) live in useEditorEventListeners — D2 stage 3.
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
    addToast,
    state: {
      openLeftPanelToTab: guardedOpenLeftPanelToTab,
      setShowSpacingIndicators: state.setShowSpacingIndicators,
      setShowBadges: state.setShowBadges,
      setShowGuides: state.setShowGuides,
      setShowGrid: state.setShowGrid,
    },
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
  const activePageId = useActivePageId(composer);

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

  // 61-conflict + BK-04: a refused save and kept edits that never reached
  // the server, both resolved in ConflictModal (useServerConflict).
  const serverConflict = useServerConflict({
    composer,
    siteId: getSiteIdFromUrl(),
    addToast,
    setIsDirty: state.setIsDirty,
    setSaveState: state.setSaveState,
    saveProject,
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
    saveProject,
  });
  // The Issues panel had a state slot but no producer, so it rendered "No
  // issues" no matter how many the DS linter had found. `useIssuesFeed`
  // bridges DS-lint (designSystem.lintState) live, and — B-15 / A02-9's
  // decision-free fix — folds in the page-content scanner (missing alt,
  // broken links) and the SAME pre-publish check list the Publish panel
  // renders verbatim, so Issues and Publish stop disagreeing about what's
  // wrong with the site.
  // Its server check rows re-read when a publish settles and when the panel
  // opens (IR-1), as well as after a save and on return to the tab.
  useOtherTabNotice(getSiteIdFromUrl(), addToast);
  /* E-T9 / DR-T5: the load scan's repairs, toast and Issues rows — after the
     restore dialog (decision 1). View mode only lists them. */
  const viewOnly = React.useMemo(() => getEditorViewMode().readOnlyView, []);
  const loadRepair = useLoadRepair({ composer, siteId: getSiteIdFromUrl(), addToast, readOnly: viewOnly });
  const issuesFeed = useIssuesFeed(composer, getSiteIdFromUrl(), state.setIssues, {
    publishState: publishJob.uiState,
    panelOpen: issuesOpen,
    damageIssues: loadRepair.issues,
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
    // "offline" is the browser being offline OR the dashboard sync being
    // disconnected — the same rule the save pill uses.
    offline: isOffline || state.syncStatus === "offline",
    errorCount,
    publishedUrl: publishJob.publishedUrl,
    lastPublishedAt: publishJob.lastPublishedAt,
    serverHasUnpublishedChanges: publishJob.hasUnpublishedChanges,
    serverBlock: publishJob.blockedReason,
    saveConflict: state.saveState.status === "conflict",
    saveFailed: state.saveState.status === "error",
  });

  // Keyboard shortcuts (extracted into useEditorShortcuts — D2 stage 1).
  // Moved below useLifecycle so it can gate the C/comment-mode shortcut on
  // reviewsEnabled (A-8/PD-7/PD-8) — the same flag StudioHeader/TabRouter
  // already gate the comments toggle and Review rail tab on.
  useEditorShortcuts({
    composer,
    modals,
    // reviewsEnabled is `boolean | null` before the status resolves (see
    // ReviewStatus) — treat "unknown yet" the same as "on" (the hook's own
    // default), never as "off": the C shortcut should not go dead for the
    // brief window before the first status fetch lands.
    reviewsEnabled: reviewStatus.reviewsEnabled ?? true,
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


  if (!composer) {
    return <StudioSkeleton />;
  }

  /* FB-8: Issues used to float as an absolute 360px overlay on top of the
     inspector (z-45). It is now a real right-column mode — StudioPanels
     swaps it in for ProInspector the same way it swaps in a column tab.
     Built here (not in StudioPanels) because it needs `requestBrandToken`
     and `composer.designSystem`, both already in scope on this component. */
  /* StudioPanels supplies the back row's action: "‹ Inspector" also shows a
     hidden inspector, a state that lives there (M-1). */
  const renderIssuesPanel = (onBack: () => void) => (
    <IssuesPanel
      issues={state.issues}
      activePageId={activePageId}
      onClose={() => setIssuesOpen(false)}
      onBack={onBack}
      /* B9 / SH-63 — a row click lands on the canvas: the element the
         issue names, else the first element that uses its token (the
         engine's usage tracker knows), else the Brand panel where the
         token lives. Never a dead click. */
      onSelectElement={(issue) => {
        setIssuesOpen(false);
        /* An element-bound issue may live on another page ("Whole site"):
           the registry is site-wide, so selecting alone left the canvas on
           the current page with an invisible selection. Page first, then
           select and scroll — the one locate seam Review and Forms use. */
        if (issue.elementId && locateComment(composer, { pageId: issue.pageId ?? null, targetSelector: issue.elementId }) === "located") return;
        /* A server check ("Favicon", "SEO configured", "Domain connected")
           opens the pane that fixes it — it opened Brand (L4-035). */
        if (issue.id.startsWith(PUBLISH_CHECK_ISSUE) && openPublishCheckFix(composer, issue.id.slice(PUBLISH_CHECK_ISSUE.length))) return;
        const refs = issue.tokenId ? composer.designSystem.tokenUsage.getBreakdown(issue.tokenId) : [];
        const target = refs.map((r) => composer.elements.getElement(r.elementId)).find((el) => el != null);
        if (target) composer.selection.select(target);
        /* Brand ON the issue's token — it landed on the first colour
           row (walk B9: color-primary opened color-action). */
        else if (issue.tokenId) requestBrandToken(composer, issue.tokenId);
        else composer.emit("ui:switch-tab", { tab: "design" });
      }}
      // applyAutoFix already wraps the rewrite in one transaction, which
      // is what lets the panel promise a single undo step. It returns
      // null when it will not touch the token — the panel shows that as
      // fix-failed instead of silently doing nothing.
      onFix={async (issue) => {
        if (!issue.tokenId || !issue.autoFixHint) return null;
        const fixed = composer.designSystem.applyAutoFix(issue.tokenId, issue.autoFixHint);
        /* Board 6749:58662: a fix is confirmed, with its one undo step — the
           issue used to drop off the list with nothing said (FG-028). The
           handle is bound to the fix's own history entry. */
        if (fixed !== null) {
          const undo = composer.history.captureUndo();
          addToast({
            title: "Issue fixed",
            description: issue.message,
            tone: "success",
            duration: 8000,
            action: { label: "Undo", onClick: () => void undo() },
          });
        }
        return fixed;
      }}
      /* BD-39 (6): the no-H1 row's fix — the page's first heading becomes
         its h1, one undo step through the engine's lock gate. */
      onMakeH1={(issue) => {
        if (!issue.pageId || !makeFirstHeadingH1(composer, issue.pageId)) return false;
        const undo = composer.history.captureUndo();
        addToast({
          title: "Issue fixed",
          description: "The page's first heading is now its H1.",
          tone: "success",
          duration: 8000,
          action: { label: "Undo", onClick: () => void undo() },
        });
        return true;
      }}
      onDamageFix={loadRepair.fix}
      onDamageKeep={loadRepair.keep}
      damageReadOnly={viewOnly}
      onOpenBrand={(tokenId) => {
        setIssuesOpen(false);
        if (tokenId) requestBrandToken(composer, tokenId);
        else composer.emit("ui:switch-tab", { tab: "design" });
      }}
      onIgnore={(tokenId) => composer.designSystem.lintState.suppress(tokenId)}
      onUnignore={(tokenId) => composer.designSystem.lintState.unsuppress(tokenId)}
      suppressedTokenIds={composer.designSystem.lintState.suppressedIds()}
      scanState={issuesFeed.scanState}
      onRescan={issuesFeed.rescan}
    />
  );

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
      <RecoveryBanner
        pageCount={composer?.elements.getAllPages().length}
        /* A dashboard site shows the server's copy unless its load failed
           (L5-074) — the unsaved-edits toast owns recovery there. */
        localDraftShown={!getSiteIdFromUrl() || loadError !== null}
      />
      <LoadErrorBanner
        kind={loadError}
        onRetry={() => window.location.reload()}
        /* New tab, deliberately: the auth load-error can sit over LOCAL
           fallback changes being edited, and a same-tab redirect destroys
           them — the exact failure the session-expired surface exists to
           prevent. Same-origin cookie lands either way. */
        onSignIn={() => window.open(`${DASHBOARD_URL}/auth?reason=session-expired`, "_blank", "noopener")}
        onGoToDashboard={() => window.open(`${DASHBOARD_URL}/dashboard`, "_blank", "noopener")}
        onDismiss={() => setLoadError(null)}
      />
      <header role="banner" aria-label="Editor toolbar">
        <StudioHeader
          composer={composer}
          saveStatus={state.saveState.status}
          saveError={state.saveState.error}
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
          onShowExporter={modals.openExporter}
          onOpenProjectSettings={() => guardedOpenLeftPanelToTab("settings")}
          onOpenPublish={() => guardedOpenLeftPanelToTab("publish")}
          onOpenHistory={() => guardedOpenLeftPanelToTab("history")}
          onOpenPages={() => guardedOpenLeftPanelToTab("pages")}
          onCloseDrawer={guardedCloseLeftPanel}
          onOpenActivity={() => guardedOpenLeftPanelToTab("activity")}
          onOpenIssues={() => setIssuesOpen(true)}
          onOpenReview={() => guardedOpenLeftPanelToTab("review")}
          onOpenConflict={serverConflict.reopenSaveConflict}
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
        onLeftPanelToggle={guardedToggleLeftPanel}
        leftPanelTab={state.leftPanelTab}
        leftPanelSubTab={state.leftPanelSubTabs[state.leftPanelTab]}
        onLeftPanelTabChange={guardedSetLeftPanelTab}
        showSpacingIndicators={state.overlays.showSpacingIndicators}
        showBadges={state.overlays.showBadges}
        showGuides={state.overlays.showGuides}
        showGrid={state.overlays.showGrid}
        showRulers={state.overlays.showRulers}
        showXRay={state.overlays.showXRay}
        onOverlayChange={(overlay, enabled) => {
          if (overlay === "guides") state.setShowGuides(enabled);
          else if (overlay === "spacing") state.setShowSpacingIndicators(enabled);
          else if (overlay === "grid") state.setShowGrid(enabled);
          else if (overlay === "rulers") state.setShowRulers(enabled);
          else if (overlay === "badges") state.setShowBadges(enabled);
          else if (overlay === "xray") state.setShowXRay(enabled);
        }}
        onOpenMediaLibrary={openAssetPick}
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
        issuesOpen={issuesOpen}
        renderIssuesPanel={renderIssuesPanel}
        onCloseIssues={() => setIssuesOpen(false)}
        // FB-4: closes Review's ⌘K row, "R" shortcut and panel render when
        // the server's agency review layer is off — the topbar pill stays
        // visible either way (owner decision).
        reviewsEnabled={reviewStatus.reviewsEnabled}
      />

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
        reviewsEnabled={reviewStatus.reviewsEnabled ?? true}
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
        showCMSCollectionSetup={modals.showCMSCollectionSetup}
        onCloseCMSCollectionSetup={modals.closeCMSCollectionSetup}
      />

      <ConflictModal {...serverConflict.modalProps} />

      <PreviewOverlay
        html={previewHtml}
        hiddenDrafts={previewDrafts}
        status={previewBuild?.status}
        error={previewBuild?.status === "error" ? previewBuild.error : undefined}
        attempts={previewBuild?.attempts}
        onRetry={buildPreview}
        onDone={closePreview}
        siteId={getSiteIdFromUrl()}
        siteName={previewHtml ? composer.getProjectMetadata?.()?.name : null}
        pageName={previewHtml ? composer.elements.getActivePage?.()?.name : null}
        pages={previewHtml ? composer.elements.getAllPages() : undefined}
        currentPageId={previewHtml ? composer.elements.getActivePage?.()?.id : null}
        /* Another page in the preview (its menu, or an internal link): the
           editor moves to that page too, so "Back to canvas" lands on what
           was being previewed (L5-051). */
        onShowPage={(pageId) => {
          composer.elements.setActivePage(pageId);
          buildPreview();
        }}
      />
      {/* B8: the one Compare, opened by every Compare door via UI_COMPARE_OPEN. */}
      <CompareHost composer={composer} siteId={getSiteIdFromUrl()} />

      <UpgradeModal />

      {/* First-time onboarding checklist (gated to new users by the orchestrator). */}
      <OnboardingMount composer={composer} />

      {/* B-1: the shared tab-switch guard's confirm — Settings/Brand/CMS
          record dirty, caught before H, ⇧A, the palette, ui:switch-tab or
          UI_PANEL_OPEN silently discards it. */}
      <UnsavedTabSwitchDialog {...tabSwitchDialogProps} />

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
