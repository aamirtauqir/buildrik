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
import { IMPROVE_ELEMENT_PROMPT } from "@/editor/sidebar/tabs/ai/types";
import { openPublishCheckFix } from "@/editor/sidebar/tabs/publish/PublishTab";
import { PUBLISH_CHECK_ISSUE } from "./hooks/useIssuesFeed";
import { useHistoryFeedback } from "./hooks/useHistoryFeedback";
import { usePublishOutcomeFlash } from "./hooks/usePublishOutcomeFlash";
import { useSaveCallback } from "./hooks/useSaveCallback";
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
import { navigateBypassingUnloadGuard } from "./unloadGuardBypass";
import { useOtherTabNotice } from "./hooks/useOtherTabNotice";
import { SAVE_CONFLICT_EVENT, setBaselineLastEditedAt } from "@/services/BuildrikSyncProvider";

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
     ui:switch-tab and StudioPanels' open requests (setLeftPanelTab), and ⌘H,
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
  previewOpenRef.current = previewHtml != null;
  React.useEffect(() => {
    if (!composer) return;
    /* Building is async now — CMS bindings resolve as publish resolves them
       (renderPreviewHtml) — so a toggle that lands while one is building
       supersedes it instead of opening a stale preview. */
    let run = 0;
    const handle = () => {
      const mine = ++run;
      if (previewOpenRef.current) {
        setPreviewHtml(null);
        return;
      }
      void renderPreviewHtml(composer).then((html) => {
        if (mine === run) setPreviewHtml(sanitizeHTMLForPreview(html));
      });
    };
    composer.on(EVENTS.UI_TOGGLE_PREVIEW, handle);
    return () => {
      run += 1;
      composer.off(EVENTS.UI_TOGGLE_PREVIEW, handle);
    };
  }, [composer]);

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

  // 61-conflict: a behind-copy save was rejected by the server. Listen on the
  // window event; idempotent (keep the first) so repeated autosave conflicts
  // don't stack dialogs while one is open. `open` is separate from the token:
  // a dismissed dialog keeps the token, so the save pill's `conflict` state
  // can re-open it (B2, decision #23) with the same three ways out.
  const [conflict, setConflict] = React.useState<{ serverToken: string; brandFormat: boolean; open: boolean } | null>(null);

  React.useEffect(() => {
    const onConflict = (e: Event) => {
      const detail = (e as CustomEvent<{ serverLastEditedAt: string; brandFormat?: boolean }>).detail;
      const token = detail?.serverLastEditedAt;
      if (token) setConflict((c) => (c?.open ? c : { serverToken: token, brandFormat: detail.brandFormat === true, open: true }));
    };
    window.addEventListener(SAVE_CONFLICT_EVENT, onConflict);
    return () => window.removeEventListener(SAVE_CONFLICT_EVENT, onConflict);
  }, []);

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
  const issuesFeed = useIssuesFeed(composer, getSiteIdFromUrl(), state.setIssues, {
    publishState: publishJob.uiState,
    panelOpen: issuesOpen,
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
    saveProject,
    openLeftPanelToTab: guardedOpenLeftPanelToTab,
    /* FC-11: same door the site menu's "Site settings" row uses — both go
       straight to the Settings tab now, the way S and ⌘K already did. This
       used to round-trip through a `showProjectSettings` flag that
       StudioModals immediately converted back into this same call and
       cleared — a modal that never rendered a modal. */
    openSiteSettings: () => guardedOpenLeftPanelToTab("settings"),
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
     swaps it in for ProInspector the same way it swaps in the AI drill-in.
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
          // ✨ Ask AI → the AITab rail panel (single consolidated AI surface).
          // Emitting ui:switch-tab opens the "ai" tab; AITab reads the live
          // canvas selection itself, so no element context needs threading.
          onShowExporter={modals.openExporter}
          onOpenProjectSettings={() => guardedOpenLeftPanelToTab("settings")}
          onOpenPublish={() => guardedOpenLeftPanelToTab("publish")}
          onOpenHistory={() => guardedOpenLeftPanelToTab("history")}
          onOpenPages={() => guardedOpenLeftPanelToTab("pages")}
          onCloseDrawer={guardedCloseLeftPanel}
          onOpenActivity={() => guardedOpenLeftPanelToTab("activity")}
          onOpenIssues={() => setIssuesOpen(true)}
          onOpenReview={() => guardedOpenLeftPanelToTab("review")}
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
        /* FA-1: the canvas context menu's "Improve with AI" (right-click →
           el already selected, see Canvas.tsx handleContextMenu) opens the
           SAME right-column AI thread as every other AI door — same event,
           same panel, no second engine. Without this prop the menu item
           hides itself (useCanvasContextMenu only shows it when set). */
        onAIRequest={() => composer.emit("ui:switch-tab", { tab: "ai", prompt: IMPROVE_ELEMENT_PROMPT })}
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

      <ConflictModal
        open={!!conflict?.open}
        brandFormat={conflict?.brandFormat}
        siteId={getSiteIdFromUrl()}
        onClose={() => setConflict((c) => (c ? { ...c, open: false } : c))}
        /* The user already chose to drop this tab's copy; the dirty-tab
           "Leave site?" prompt on top of that choice was a second, scarier
           dialog asking the same thing (L5-077). */
        onReload={() => navigateBypassingUnloadGuard(() => window.location.reload())}
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
            navigateBypassingUnloadGuard(() => window.location.reload());
          }
        }}
        onOverwrite={() => {
          // Adopt the server's version token so our next save matches + wins.
          if (conflict) setBaselineLastEditedAt(conflict.serverToken);
          setConflict(null);
          saveProject();
        }}
      />

      <PreviewOverlay
        html={previewHtml}
        onDone={() => setPreviewHtml(null)}
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
          void renderPreviewHtml(composer).then((html) => setPreviewHtml(sanitizeHTMLForPreview(html)));
        }}
      />
      {/* B8: the one Compare, opened by every Compare door via UI_COMPARE_OPEN. */}
      <CompareHost composer={composer} siteId={getSiteIdFromUrl()} />

      <UpgradeModal />

      {/* First-time onboarding checklist (gated to new users by the orchestrator). */}
      <OnboardingMount composer={composer} />

      {/* B-1: the shared tab-switch guard's confirm — Settings/Brand/CMS
          record dirty, caught before ⌘H, ⇧A, the palette, ui:switch-tab or
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
