/**
 * StudioHeader — the editor topbar's container.
 *
 * There used to be two files here: this wrapper and a 755-line `Topbar` that
 * drew its own bar, its own buttons and its own pills, with a block of props
 * commented "Legacy / StudioHeader wiring". The bar itself is now the `Topbar`
 * component (Figma 681:122) and the rare surfaces are their own components
 * (`SiteMenu`, `SendForReview`, `NotificationPanel`), so what is left here is
 * the only thing a container should hold: translating editor state into what
 * the design says about it.
 *
 * Every mapping below is a product decision, which is why they are here and not
 * in the component:
 *   · offline beats every other save state — a dropped connection must never
 *     read as lost work;
 *   · a blocked publish stays visible with its reason attached, never hidden;
 *   · an invited editor sends for review instead of publishing.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Topbar,
  Button,
  ModalRoot,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  type PublishState,
  type ReviewPill,
  type SaveState,
  type ToastInput,
} from "@/editor/ui";
import type { SaveOutcome } from "./hooks/useSaveCallback";
import type { Composer } from "../../engine";
import { sanitizeHTMLForPreview } from "../export/ExportUtils";
import { useCollaboration } from "../canvas/hooks/useCollaboration";
import { toPresenceUsers } from "../collaboration/PresenceIndicators";
import { getSiteIdFromUrl } from "../../services/BuildrikSyncProvider";
import {
  fetchReviewStatus,
  fetchReviewStatusOrNull,
  type ReviewStatus,
} from "../../services/ReviewService";
import { useRefetchOnFocus } from "../../shared/hooks";
import { formatRelativeTime } from "../../shared/utils/relativeTime";
import { EVENTS } from "../../shared/constants";
import { isFeatureEnabled } from "../../shared/utils/featureFlags";
import { getEditorViewMode } from "../../shared/utils/editorViewMode";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import type { SyncStatus, Issue } from "./hooks/useStudioState";
import { useEditorRole } from "./hooks/useEditorRole";
import { CommandPalette } from "./modals/CommandPalette";
import { NotificationPanel, useUnreadCount } from "./NotificationPanel";
import { SendForReview } from "./SendForReview";
import { SiteMenu } from "./SiteMenu";
import "./header.css";

/** Selected element minimal info */
export interface SelectedElementInfo {
  id: string;
  type: string;
  tagName?: string;
}

export interface StudioHeaderProps {
  /** Composer instance */
  composer: Composer | null;
  /** Save status indicator */
  saveStatus: "idle" | "saving" | "error";
  /** Has unsaved changes */
  isDirty: boolean;
  /** Network offline — edits are queued locally (60-save-states). */
  isOffline?: boolean;
  /** Last saved timestamp */
  lastSaved: Date | null;
  /** Last saved as timestamp number */
  lastSavedAt?: number;
  /** Preview loading state */
  previewLoading: boolean;
  /** Currently selected element */
  selectedElement: SelectedElementInfo | null;
  /** Sync status */
  studioSyncStatus?: SyncStatus;
  /** Issues list */
  issues?: Issue[];

  // Callbacks for state changes
  onSetPreviewLoading: (loading: boolean) => void;
  onSetExportLoading: (loading: boolean) => void;

  /** ✨ Ask AI — opens the AITab rail panel (single consolidated AI surface). */
  onShowAI: () => void;
  onShowExporter: () => void;

  // Global settings menu handlers
  onOpenProjectSettings?: () => void;
  onOpenDesignSystem?: () => void;
  onOpenPublish?: () => void;
  onOpenPlugins?: () => void;
  onOpenHistory?: () => void;
  onOpenIssues?: () => void;
  /** Open Keyboard Shortcuts panel (site menu · `?`) */
  onOpenShortcuts?: () => void;
  /** Site menu destinations from Figma 642:3664. */
  onOpenPublishHistory?: () => void;
  onOpenTemplates?: () => void;
  onOpenComponents?: () => void;
  /** F3 — the review pill is a door, not a label: opens the Review panel. */
  onOpenReview?: () => void;

  // Core actions
  /** Save now. Resolves with the HONEST outcome — the exit guard branches on it. */
  onSave: () => Promise<SaveOutcome>;

  /** Export HTML as zip download */
  onExportHTML?: () => void;

  /** Opens the in-shell preview overlay with the sanitized page HTML (shell state 7). */
  onInlinePreview: (html: string) => void;
  /** Vercel publish flow — when present, replaces fallback handleExport on Publish click */
  onVercelPublish?: () => void;
  /** True while a publish job is in flight */
  publishLoading?: boolean;
  /** Live URL after successful publish */
  publishedUrl?: string | null;

  // Toast notifications
  addToast: (input: ToastInput) => string;
}

/** Persistent review status → the topbar's one review pill. */
const REVIEW_PILL: Record<ReviewStatus["state"], Omit<ReviewPill, "onClick"> | null> = {
  none: null,
  pending: { label: "In review", tone: "info" },
  "opened-not-acted": { label: "Opened · no reply", tone: "info" },
  "changes-requested": { label: "Changes requested", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  "approved-edited-since": { label: "Approved · edited since", tone: "warning" },
};

/** "· 2d ago" suffix on the approved pill (S5.6 board 131:2). */
function pillAgo(at?: string | Date | null): string {
  if (!at) return "";
  const ts = new Date(at).getTime();
  if (!Number.isFinite(ts) || ts > Date.now()) return "";
  return ` · ${formatRelativeTime(ts, { fallback: "days", justNowLabel: "just now" })}`;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  composer,
  saveStatus,
  isDirty,
  isOffline,
  lastSaved,
  lastSavedAt,
  previewLoading,
  selectedElement,
  studioSyncStatus = "connected",
  issues = [],
  onSetPreviewLoading,
  onSetExportLoading,
  onShowAI,
  onShowExporter,
  onOpenProjectSettings,
  onOpenDesignSystem,
  onOpenPublish,
  onOpenPlugins,
  onOpenHistory,
  onOpenIssues,
  onOpenShortcuts,
  onOpenPublishHistory,
  onOpenTemplates,
  onOpenComponents,
  onOpenReview,
  onSave,
  onExportHTML,
  onInlinePreview,
  onVercelPublish,
  publishLoading,
  publishedUrl,
  addToast,
}) => {
  const { users, currentUser, state: collaborationState, isConnected } = useCollaboration(composer);
  const isViewer = useEditorRole() === "VIEWER";
  const viewMode = getEditorViewMode();
  const publishEnabled = isFeatureEnabled("publish");
  // Recovery Phase 0: collaboration is DEMO-ONLY (last-write-wins, 6 known P1s)
  // and was the #1 reason the product read as "broken" in user testing. The flag
  // gates the ENTIRE surface — when it is off, nothing collab shows, even if a
  // session somehow connected.
  const collabOn = isFeatureEnabled("collab");

  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  // T6 (read path): the bar MIRRORS comment-mode state — CommentLayer owns it
  // and broadcasts ui:comment-mode-changed on every change including its
  // unmount cleanup. Deliberately NO reset here on PAGE_CHANGED: the layer
  // survives page switches (it re-scopes itself), so a bar-side reset would
  // create the exact desync the state event exists to prevent.
  const [commentsOn, setCommentsOn] = React.useState(false);
  React.useEffect(() => {
    if (!composer) return;
    const onChanged = (p: { on?: boolean }) => setCommentsOn(Boolean(p?.on));
    composer.on("ui:comment-mode-changed", onChanged);
    return () => {
      composer.off("ui:comment-mode-changed", onChanged);
    };
  }, [composer]);
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const { count: unread, refresh: refreshUnread } = useUnreadCount();

  // Clicking away dismisses the notification panel. Scoped to the header so the
  // bell's own toggle still works — otherwise it would close here and reopen there.
  React.useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [notifOpen]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        // F9: a modal dialog (exit guard, confirm) owns the keyboard — opening
        // the palette on top of it would stack two focus traps.
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // S5.2: the persistent review pill. Fails closed to "none" (flag off, no
  // review), which renders nothing — safe for non-agency workspaces too.
  const [reviewStatus, setReviewStatus] = React.useState<ReviewStatus>({
    state: "none",
    reviewerName: null,
    at: null,
  });
  const refreshReview = React.useCallback(() => {
    fetchReviewStatus().then(setReviewStatus);
  }, []);
  React.useEffect(() => {
    refreshReview();
  }, [refreshReview]);
  // F3/6A: approval usually lands while the editor is backgrounded — refresh
  // on return. The OrNull variant keeps the last-known pill on transport
  // failure instead of erasing it (fail-closed is for the mount only).
  useRefetchOnFocus(
    React.useCallback(() => {
      void fetchReviewStatusOrNull().then((s) => {
        if (s) setReviewStatus(s);
      });
    }, []),
  );
  useRefetchOnFocus(refreshUnread);

  // Keeps "Saved · 2m ago" honest without a render on every tick.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!lastSavedAt && !lastSaved) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, [lastSavedAt, lastSaved]);

  // Redesign P5: the live site name, read from the composer rather than a
  // "My project" placeholder. F7: PROJECT_METADATA_CHANGED fires from every
  // metadata writer, so the old selectedElement-dep hack (which resubscribed
  // these listeners on every canvas click) is gone.
  const [siteName, setSiteName] = React.useState("Untitled site");
  React.useEffect(() => {
    if (!composer) return;
    const read = () => setSiteName(composer.getProjectMetadata?.()?.name || "Untitled site");
    read();
    composer.on(EVENTS.PROJECT_LOADED, read);
    composer.on(EVENTS.PROJECT_METADATA_CHANGED, read);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, read);
      composer.off(EVENTS.PROJECT_METADATA_CHANGED, read);
    };
  }, [composer]);

  const handlePreview = React.useCallback(() => {
    if (previewLoading) return;
    onSetPreviewLoading(true);
    // F7-B2: exportHTML is synchronous and can be heavy on big sites — yield a
    // tick so the loading state PAINTS before the export blocks the thread.
    // (The old fake 300ms timer pretended to load; the real work replaces it.)
    setTimeout(() => {
      const rawHtml = composer?.exportHTML().combined || "<!DOCTYPE html><html><body>No content</body></html>";
      onInlinePreview(sanitizeHTMLForPreview(rawHtml));
      onSetPreviewLoading(false);
    }, 0);
  }, [composer, previewLoading, onSetPreviewLoading, onInlinePreview]);

  const handleExport = React.useCallback(() => {
    onSetExportLoading(true);
    onShowExporter();
    setTimeout(() => onSetExportLoading(false), 500);
  }, [onSetExportLoading, onShowExporter]);

  // 60-save-states: "offline" is the browser being offline OR the dashboard sync
  // being disconnected. Either way edits are queued locally, so it outranks
  // every other state — a queued edit is not a failed one.
  const offline = Boolean(isOffline) || studioSyncStatus === "offline";

  // ── F1 · dirty-exit guard (plan 2026-07-29, decisions 1A/2A/5A) ──────────
  // Every full-page navigation out of the editor goes through here. Four
  // callers: ‹ Exit, menu "Exit to dashboard", "Preview as client", and
  // notification row jumps. `nav` is injectable so tests never touch
  // window.location (redirect-mock pattern).
  type ExitDialog = { kind: "dirty" | "risky"; error?: string; nav: () => void };
  const [exitDialog, setExitDialog] = React.useState<ExitDialog | null>(null);
  const [leaving, setLeaving] = React.useState(false);
  // 2A: set immediately before a user-confirmed programmatic navigation so the
  // beforeunload guard doesn't double-prompt. Reset on a timer in case the
  // navigation is somehow cancelled — a stuck flag would disarm the guard.
  const bypassRef = React.useRef(false);
  const bypassAndNavigate = React.useCallback((nav: () => void) => {
    bypassRef.current = true;
    try {
      nav();
    } finally {
      window.setTimeout(() => {
        bypassRef.current = false;
      }, 1000);
    }
  }, []);

  const guardNavigation = React.useCallback(
    (nav: () => void) => {
      if (bypassRef.current) return nav();
      // 5A: while offline the save pipeline reports queued saves as clean
      // (useSaveCallback settles to idle) but the queue dies on navigation —
      // never offer a fake "Save & leave" here.
      if (offline && isDirty) return setExitDialog({ kind: "risky", nav });
      if (isDirty || saveStatus === "saving" || saveStatus === "error") {
        return setExitDialog({
          kind: "dirty",
          error: saveStatus === "error" ? "The last save failed." : undefined,
          nav,
        });
      }
      nav();
    },
    [offline, isDirty, saveStatus],
  );

  const saveAndLeave = React.useCallback(async () => {
    if (!exitDialog) return;
    setLeaving(true);
    const timeout = new Promise<SaveOutcome>((resolve) =>
      window.setTimeout(() => resolve("error"), 3000),
    );
    const outcome = await Promise.race([onSave(), timeout]);
    setLeaving(false);
    if (outcome === "saved") {
      const { nav } = exitDialog;
      setExitDialog(null);
      bypassAndNavigate(nav);
    } else if (outcome === "queued-offline" || outcome === "conflict") {
      // The save did NOT durably land — switch to the honest dialog.
      setExitDialog({ kind: "risky", nav: exitDialog.nav });
    } else {
      setExitDialog({
        kind: "dirty",
        error: "Save failed — your changes may be lost if you leave.",
        nav: exitDialog.nav,
      });
    }
  }, [exitDialog, onSave, bypassAndNavigate]);

  const leaveAnyway = React.useCallback(() => {
    if (!exitDialog) return;
    const { nav } = exitDialog;
    setExitDialog(null);
    bypassAndNavigate(nav);
  }, [exitDialog, bypassAndNavigate]);

  // 2A: browser-chrome exits (⌘W, refresh, tab close) get the native prompt
  // while there is anything a navigation would strand.
  React.useEffect(() => {
    const shouldGuard = isDirty || saveStatus === "saving";
    if (!shouldGuard) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      if (bypassRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [isDirty, saveStatus]);

  const exitToDashboard = React.useCallback(() => {
    guardNavigation(() => window.location.assign(`${DASHBOARD_URL}/dashboard/projects`));
  }, [guardNavigation]);

  /** Client view is a URL mode, so toggling it is a navigation, not local state. */
  const toggleClientView = React.useCallback(() => {
    guardNavigation(() => {
      const url = new URL(window.location.href);
      if (viewMode.clientView) url.searchParams.delete("view");
      else url.searchParams.set("view", "client");
      window.location.assign(url.toString());
    });
  }, [guardNavigation, viewMode.clientView]);

  const navigateFromNotification = React.useCallback(
    (url: string) => {
      guardNavigation(() => {
        window.location.href = /^https?:\/\//.test(url) ? url : `${DASHBOARD_URL}${url}`;
      });
    },
    [guardNavigation],
  );

  const copyLiveUrl = React.useCallback(() => {
    if (!publishedUrl) return;
    // navigator.clipboard is absent on insecure origins, and writeText can be
    // refused. Either way the user hears about it rather than pressing again.
    const done = navigator.clipboard?.writeText(publishedUrl);
    if (!done) {
      addToast({ title: "Couldn't copy", description: publishedUrl, tone: "error" });
      return;
    }
    void done.then(
      () => addToast({ title: "Live URL copied", description: publishedUrl, tone: "success" }),
      () => addToast({ title: "Couldn't copy", description: publishedUrl, tone: "error" }),
    );
  }, [publishedUrl, addToast]);

  const startCollab = React.useCallback(() => {
    const siteId = getSiteIdFromUrl();
    if (!siteId || !composer) {
      addToast?.({ title: "Save your site first", description: "Open a saved site to collaborate.", tone: "info" });
      return;
    }
    void composer.collab.manager
      .startSession(siteId, currentUser?.name ?? "Editor")
      .catch(() =>
        addToast?.({ title: "Couldn't start collaboration", description: "Try again in a moment.", tone: "error" }),
      );
  }, [composer, currentUser, addToast]);

  const save: SaveState = offline
    ? "offline"
    : saveStatus === "saving"
      ? "saving"
      : saveStatus === "error"
        ? "error"
        : isDirty
          ? "unsaved"
          : "saved";

  const errorCount = issues.filter((i) => i.type === "error").length;
  const warnCount = issues.filter((i) => i.type === "warning").length;
  // T7/D14: the old errors-noun label ("3 errors" for 1 error + 2 warnings)
  // is gone — the IssueChip owns count copy via formatIssueSummary.

  // A blocked publish is shown disabled with its reason, never hidden — the
  // user must be able to find out why (P6 permissions boards).
  const publishBlockedReason = !publishEnabled
    ? "Publishing isn't switched on for this workspace yet"
    : isViewer
      ? "Viewers can't publish — ask an editor"
      : offline
        ? "Can't publish while offline"
        : undefined;
  const publish: PublishState = publishBlockedReason ? "disabled" : errorCount > 0 ? "anyway" : "ready";

  // Plan §2/eng D12: the CONTAINER composes the tool cluster per role/view —
  // the bar renders exactly what it receives. Client view is itself a preview,
  // so it gets Comments only; viewers keep the chip with the fix door
  // labelled shut.
  const toggleComments = composer ? () => composer.emit("ui:comment-mode", {}) : undefined;
  const tools = viewMode.clientView
    ? { commentsPressed: commentsOn, onToggleComments: toggleComments }
    : {
        onPreview: handlePreview,
        previewBusy: previewLoading,
        commentsPressed: commentsOn,
        onToggleComments: toggleComments,
        issues: {
          errors: errorCount,
          warnings: warnCount,
          onClick: onOpenIssues,
          readOnlyReason: isViewer ? "ask an editor to fix these" : undefined,
        },
      };

  const pill = REVIEW_PILL[reviewStatus.state];
  const review: ReviewPill | null = pill
    ? {
        ...pill,
        label:
          reviewStatus.state === "approved" && reviewStatus.reviewerName
            ? `Approved by ${reviewStatus.reviewerName}${pillAgo(reviewStatus.at)}`
            : pill.label,
        title: reviewStatus.reviewerName ? `${pill.label} — ${reviewStatus.reviewerName}` : undefined,
        // F3: every review state opens the same door — the Review panel.
        onClick: onOpenReview,
      }
    : null;

  return (
    <div className="bk-header" ref={headerRef}>
      <Topbar
        siteName={siteName}
        onExit={exitToDashboard}
        save={save}
        savedAt={lastSavedAt ?? lastSaved?.getTime()}
        onSave={onSave}
        review={review}
        tools={tools}
        presence={
          // A reconnecting session still has collaborators in it — hiding them
          // mid-drop reads as "everyone left", which is the wrong alarm.
          collabOn && collaborationState !== "disconnected"
            ? {
                users: toPresenceUsers(users, currentUser, collaborationState),
                connection: collaborationState === "connected" ? "live" : "reconnecting",
              }
            : null
        }
        unreadCount={unread}
        onOpenNotifications={() => setNotifOpen((v) => !v)}
        publish={publish}
        publishBusy={publishLoading}
        publishBlockedReason={publishBlockedReason}
        onPublish={onVercelPublish ?? onOpenPublish ?? handleExport}
        action={
          viewMode.clientView ? (
            <SendForReview
              composer={composer}
              disabledReason={isViewer ? "Viewers can't send for review — ask an editor" : undefined}
              onSent={refreshReview}
              reviewStatus={reviewStatus}
            />
          ) : undefined
        }
        menu={
          <SiteMenu
            onOpenSiteSettings={onOpenProjectSettings}
            onOpenHistory={onOpenHistory}
            onOpenPublishHistory={onOpenPublishHistory}
            onExportCode={onExportHTML}
            onOpenTemplates={onOpenTemplates}
            onOpenComponents={onOpenComponents}
            onOpenShortcuts={onOpenShortcuts}
            onAskAI={viewMode.fourToolRail ? onShowAI : undefined}
            onStartCollaboration={collabOn && !isConnected ? startCollab : undefined}
            onOpenDesignSystem={onOpenDesignSystem}
            onOpenPlugins={onOpenPlugins}
            publishedUrl={publishedUrl}
            onCopyLiveUrl={copyLiveUrl}
            clientView={viewMode.clientView}
            onToggleClientView={toggleClientView}
          />
        }
      />

      {notifOpen ? (
        <div className="bk-header__dropdown">
          <NotificationPanel
            onClose={() => setNotifOpen(false)}
            onRead={refreshUnread}
            onNavigate={navigateFromNotification}
            addToast={addToast}
          />
        </div>
      ) : null}

      {cmdOpen ? <CommandPalette onClose={() => setCmdOpen(false)} composer={composer ?? null} /> : null}

      {/* F1 exit dialog — dialog A ("dirty": save is a real option) vs
          dialog B ("risky": offline/conflict, a save here would be a lie). */}
      {exitDialog ? (
        <ModalRoot open onOpenChange={(o) => !o && setExitDialog(null)}>
          <ModalContent size="question" aria-labelledby="bk-exit-title">
            <ModalTitle id="bk-exit-title">Leave the editor?</ModalTitle>
            <ModalDescription>
              {exitDialog.kind === "risky"
                ? "You're offline — unsaved edits will be lost if you leave."
                : "You have unsaved changes."}
            </ModalDescription>
            {exitDialog.error ? (
              <p className="bk-exit-dialog__error" role="alert">
                {exitDialog.error}
              </p>
            ) : null}
            <ModalFooter>
              <Button kind="ghost" size="md" onClick={() => setExitDialog(null)}>
                Stay
              </Button>
              <Button kind="destructive" size="md" onClick={leaveAnyway}>
                Leave anyway
              </Button>
              {exitDialog.kind === "dirty" ? (
                <Button kind="primary" size="md" loading={leaving} onClick={() => void saveAndLeave()}>
                  Save &amp; leave
                </Button>
              ) : null}
            </ModalFooter>
          </ModalContent>
        </ModalRoot>
      ) : null}
    </div>
  );
};

export default StudioHeader;
