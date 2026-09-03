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
import type { SaveState as StudioSaveState } from "./hooks/useStudioState";
import type { ReviewPillState } from "@buildrik/shared/schemas/reviews";
import { deriveLifecycleState } from "./lifecycle";
import { Topbar, ModalRoot, ModalContent, ModalTitle, ModalDescription, ModalFooter, isModalOpen, plural, Button, type PublishState, type ReviewPill, type ReviewTone, type SaveState, type ToastInput } from "@/editor/chrome-ui";
import type { SaveOutcome } from "./hooks/useSaveCallback";
import type { Composer } from "../../engine";
import { useCollaboration } from "../canvas/hooks/useCollaboration";
import { toPresenceUsers } from "../collaboration/PresenceIndicators";
import { getSiteIdFromUrl } from "../../services/BuildrikSyncProvider";
import {
  fetchReviewStatus,
  fetchReviewStatusOrNull,
  UNKNOWN_REVIEW_STATUS,
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
import { totalPendingMirrors } from "@/services/syncRetryQueue";
import { SiteMenu } from "./SiteMenu";
import "./header.css";

/** Selected element minimal info */
import type { SelectedElementInfo } from "@/shared/types";
export type { SelectedElementInfo };

export interface StudioHeaderProps {
  /** Composer instance */
  composer: Composer | null;
  /** Save status indicator */
  /* Derived from useStudioState rather than re-spelled — this was the fifth
     copy of that union, and each copy is a place the set can silently fall
     behind. */
  saveStatus: StudioSaveState["status"];
  /** Has unsaved changes */
  isDirty: boolean;
  /** Network offline. Nothing is queued for a dashboard-backed site — the save
   *  is a bare RPC and the reconnect queue carries CMS/components/templates/
   *  versions, never the project. */
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

  /** Vercel publish flow — when present, replaces fallback handleExport on Publish click */
  onVercelPublish?: () => void;
  /** True while a publish job is in flight */
  publishLoading?: boolean;
  /** Live URL after successful publish */
  publishedUrl?: string | null;
  /** T5 (D10): 2s outcome flash — drives "✓ Published" and the announcement
   *  region. Toasts stay with useExportHandlers (eng D10), never here. */
  publishOutcome?: "published" | "failed" | null;
  /** When the site last went live, ISO — from `usePublishJob`. Compared against
   *  this session's own save clock to answer "is anything waiting to ship?". */
  lastPublishedAt?: string | null;
  /** The server's answer at mount. Used only when this session has no save of
   *  its own to compare — see `hasUnpublishedChanges` below. */
  serverHasUnpublishedChanges?: boolean | null;

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

/**
 * Save transitions worth announcing (T5/eng D5). `conflict` is listed even
 * though today's derivation never yields it (D11 — blocked on the
 * save-honesty arc): the pipe is ready for the day it does.
 */
const SAVE_ANNOUNCEMENTS: Partial<Record<SaveState, { assertive: boolean; msg: string }>> = {
  error: { assertive: true, msg: "Save failed" },
  conflict: { assertive: true, msg: "Sync conflict — reload" },
  /* Not "changes queued": for a dashboard-backed site nothing queues them.
     `saveProject` is a bare RPC and the reconnect queue in syncRetryQueue
     carries CMS, components, templates and versions — never the project.
     Proven by blocking the save and reloading: the edit was gone. */
  offline: { assertive: false, msg: "Offline — changes not saved" },
};

/** The strings the save effect owns, so it clears only its own stale text. */
const SAVE_MSGS = new Set<string>([
  ...Object.values(SAVE_ANNOUNCEMENTS).map((a) => a.msg),
  "Saved",
]);

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
  onVercelPublish,
  publishLoading,
  publishedUrl,
  publishOutcome = null,
  lastPublishedAt = null,
  serverHasUnpublishedChanges = null,
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
        /* View mode has no palette. It offers Delete element, Paste, Undo and
           "Open <tab> panel" rows for panels that are not rendered — a keyboard
           door into the editor from a mode built to have none. Confirmed by
           pressing it: the palette opened on Insert / AI / Templates / Media. */
        if (viewMode.readOnlyView) return;
        // F9: a modal dialog (exit guard, confirm) owns the keyboard — opening
        // the palette on top of it would stack two focus traps.
        if (isModalOpen()) return;
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewMode.readOnlyView]);

  /* S5.2: the persistent review pill. Starts at UNKNOWN — `state: "none"`, so
     it still renders nothing, but with the two flags null rather than asserting
     "reviews are on and publishing is ungated" before anyone has asked. A
     control that picks a verb from a guessed lifecycle position and changes it
     after paint is worse than one that arrives a beat late. */
  const [reviewStatus, setReviewStatus] = React.useState<ReviewStatus>(UNKNOWN_REVIEW_STATUS);
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

  /* Board 158:213 announces the close: "Review closed — Sara approved v3". The
     product had no such moment. The pill changed and the review bar vanished,
     both silently, and the one thing a designer is waiting on — did my client
     answer — arrived as furniture quietly rearranging itself.

     Fires on the TRANSITION only, and only away from a live round, so opening
     an already-approved site does not congratulate you on news from last week.
     `answeredRef` starts unset and is seeded by the first status that lands, so
     the mount itself is never a transition. */
  const answeredRef = React.useRef<ReviewPillState | null>(null);
  React.useEffect(() => {
    const now = reviewStatus.state;
    const was = answeredRef.current;
    answeredRef.current = now;
    if (was === null || was === now) return;
    const LIVE: ReadonlySet<ReviewPillState> = new Set(["pending", "opened-not-acted"]);
    if (!LIVE.has(was)) return;
    const who = reviewStatus.reviewerName ?? "Your client";
    if (now === "approved" || now === "approved-edited-since") {
      addToast({ title: "Review closed", description: `${who} approved this design.`, tone: "success" });
    } else if (now === "changes-requested") {
      addToast({ title: "Review closed", description: `${who} asked for changes.`, tone: "info" });
    }
  }, [reviewStatus.state, reviewStatus.reviewerName, addToast]);

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
    /* Emits the toggle instead of building HTML itself: this button was the
       one preview door that bypassed UI_TOGGLE_PREVIEW, so the shell had two
       preview builders and the onboarding "Preview your site" step never
       ticked on the most common path. One owner now — the shell's toggle
       handler builds and sanitizes. */
    setTimeout(() => {
      composer?.emit(EVENTS.UI_TOGGLE_PREVIEW, {});
      onSetPreviewLoading(false);
    }, 0);
  }, [composer, previewLoading, onSetPreviewLoading]);

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
  type ExitDialog = { kind: "dirty" | "risky" | "stranded"; error?: string; pending?: number; nav: () => void };
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
      /* Everything above is PROJECT-save state. CMS collections, components,
         templates and versions mirror through `SyncRetryQueue`, which never
         touches the project — so a site with a clean project and a queue full
         of failed mirrors walked out of here with no dialog at all. The queue
         is a Map of closures in memory, so the navigation ends them: the local
         copy survives and the server never hears about it. Read at call time,
         not from state, because the count changes from `window` callbacks. */
      const stranded = totalPendingMirrors();
      if (stranded > 0) return setExitDialog({ kind: "stranded", pending: stranded, nav });
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
    /* Registered unconditionally and decided when it fires. It used to be
       mounted only while `isDirty || saving`, which cannot see the mirror
       queue: that count changes from `window` event callbacks with no render
       in between, so a listener gated on React state would still be absent at
       the moment it was needed. Reading at fire time has no staleness. */
    const onBefore = (e: BeforeUnloadEvent) => {
      if (bypassRef.current) return;
      const stranded = totalPendingMirrors();
      if (!isDirty && saveStatus !== "saving" && stranded === 0) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [isDirty, saveStatus]);

  const exitToDashboard = React.useCallback(() => {
    guardNavigation(() => window.location.assign(`${DASHBOARD_URL}/dashboard/projects`));
  }, [guardNavigation]);

  /** View mode is a URL mode, so toggling it is a navigation, not local state. */
  const toggleReadOnlyView = React.useCallback(() => {
    guardNavigation(() => {
      const url = new URL(window.location.href);
      if (viewMode.readOnlyView) url.searchParams.delete("view");
      else url.searchParams.set("view", "readonly");
      window.location.assign(url.toString());
    });
  }, [guardNavigation, viewMode.readOnlyView]);

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

  /* SaveStatus has carried a "conflict" state — label, amber pill, dot — that
     this derivation could not produce, so board 66:640's condition showed the
     chip as Saved. */
  const save: SaveState = offline
    ? "offline"
    : saveStatus === "saving"
      ? "saving"
      : saveStatus === "conflict"
        ? "conflict"
        : saveStatus === "error"
          ? "error"
          : isDirty
            ? "unsaved"
            : "saved";

  const errorCount = issues.filter((i) => i.type === "error").length;
  const warnCount = issues.filter((i) => i.type === "warning").length;
  // T7/D14: the old errors-noun label ("3 errors" for 1 error + 2 warnings)
  // is gone — the IssueChip owns count copy via formatIssueSummary.

  /* A blocked publish is shown disabled with its reason, never hidden — the
     user must be able to find out why (P6 permissions boards). The three
     permission/network reasons used to be spelled out again here; they live in
     `deriveLifecycleState`'s `publishBlocker` now, beside the review reasons
     they have to be ordered against. */
  /* ── The site's ONE next move (wireframes §2) ─────────────────────────────
     The shell knew whether publishing was *permitted* and never where the site
     stood. `deriveLifecycleState` is the table; everything here is the reads it
     needs.

     "Anything waiting to ship?" prefers THIS session's save clock over the
     server's snapshot, which was taken at mount and cannot see an edit made
     since. Unsaved work counts on its own — it is by definition not live. */
  const savedAtMs = lastSavedAt ?? lastSaved?.getTime() ?? null;
  const publishedAtMs = lastPublishedAt ? Date.parse(lastPublishedAt) : null;
  const hasUnpublishedChanges =
    isDirty ||
    (savedAtMs != null && publishedAtMs != null
      ? savedAtMs > publishedAtMs
      : serverHasUnpublishedChanges);
  const nextMove = deriveLifecycleState({
    reviewState: reviewStatus.state,
    reviewerName: reviewStatus.reviewerName,
    reviewsEnabled: reviewStatus.reviewsEnabled,
    editsRequireApproval: reviewStatus.editsRequireApproval,
    isPublished: Boolean(publishedUrl),
    hasUnpublishedChanges,
    isViewer,
    publishEnabled,
    offline,
    errorCount,
  });
  /* The visual state follows the derived move, not the old permission-only
     reason. Reading `publishBlockedReason` here left a review-blocked site
     rendering the ENABLED branch — no tooltip, no aria-disabled — because a
     pending round is not a permission problem and never set that string.
     `"anyway"` is gone: the derivation owns the error re-label, and it refuses
     to put an invitation on a button nobody can press. */
  const publish: PublishState =
    publishOutcome === "published"
      ? "published"
      : nextMove?.blockedReason
        ? "disabled"
        : "ready";

  // ── T5/F24 · the ONE announcement pipe (eng D5 — centralized) ────────────
  // SaveStatus is presentation-only; these two visually-hidden regions speak
  // for every save transition and publish outcome, exactly once each.
  const [politeMsg, setPoliteMsg] = React.useState("");
  const [alertMsg, setAlertMsg] = React.useState("");
  const prevSaveRef = React.useRef<SaveState>(save);
  React.useEffect(() => {
    const prev = prevSaveRef.current;
    if (prev === save) return;
    prevSaveRef.current = save;
    const a = SAVE_ANNOUNCEMENTS[save];
    /* One save state, one announcement. Setting only the matching region left
       the OTHER one holding the previous save state's text, and both regions
       are live: going offline then failing was read out as "Offline — changes
       not saved" AND "Save failed" at once — two answers to one question.
       Only save-owned strings are cleared, so a publish message in the sibling
       region survives (that effect owns its own text). */
    if (a) {
      (a.assertive ? setAlertMsg : setPoliteMsg)(a.msg);
      (a.assertive ? setPoliteMsg : setAlertMsg)((m) => (SAVE_MSGS.has(m) ? "" : m));
    } else if (save === "saved" && prev === "saving") {
      setPoliteMsg("Saved");
      setAlertMsg((m) => (SAVE_MSGS.has(m) ? "" : m));
    }
    // `unsaved` and `saving` are not announced — they fire on every keystroke.
  }, [save]);
  React.useEffect(() => {
    if (publishOutcome === "published") setPoliteMsg("Published — site is live");
    else if (publishOutcome === "failed") setAlertMsg("Publish failed");
  }, [publishOutcome]);

  // ── T4 · publish-anyway confirm (plan §5, D12/D13, eng D9) ────────────────
  // Errors > 0 opens a confirm instead of publishing in one click; warnings
  // alone never confirm — the chip already carried that signal. Gate
  // precedence (D9): this fires only when publish isn't `disabled` (the
  // blocked reasons above win); the SERVER approval gate can still reject the
  // attempt afterwards — its acknowledge flow owns that path, not this modal.
  const [pubConfirm, setPubConfirm] = React.useState(false);
  // `onVercelPublish` is a plain useCallback in AquibraStudio, so it is never
  // undefined and the two fallbacks below are unreachable in the shipping
  // editor. That is fine for `handleExport`, but it silently made the Publish
  // PANEL (board 641:2652) undiscoverable — this was its only wire. The panel
  // now has its own door in SiteMenu; the chain stays as a degraded path for a
  // build with publishing switched off.
  const publishNow = onVercelPublish ?? onOpenPublish ?? handleExport;
  /* One control, so one handler. Both review verbs land on the Review panel —
     the door that already owns SendForReview and the feedback thread — so a
     state-dependent CTA adds no surface, only a destination. */
  const handleCtaClick = React.useCallback(() => {
    if (nextMove && nextMove.kind !== "publish") {
      onOpenReview?.();
      return;
    }
    if (errorCount > 0) {
      setPubConfirm(true);
      return;
    }
    publishNow();
  }, [nextMove, onOpenReview, errorCount, publishNow]);
  // D12: top-3 concrete rows, errors first — real messages from the shipped
  // Issue shape, never invented categories.
  const confirmRows = issues
    .filter((i) => i.type !== "info")
    .sort((a, b) => (a.type === b.type ? 0 : a.type === "error" ? -1 : 1))
    .slice(0, 3);
  const confirmMore = errorCount + warnCount - confirmRows.length;

  // Plan §2/eng D12: the CONTAINER composes the tool cluster per role/view —
  // the bar renders exactly what it receives. View mode is itself a preview,
  // so it gets Comments only; viewers keep the chip with the fix door
  // labelled shut.
  const toggleComments = composer ? () => composer.emit("ui:comment-mode", {}) : undefined;
  const tools = viewMode.readOnlyView
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
  // T8/D7 rule 6 — at most two amber signals at once. Offline-or-unsaved save
  // and an amber Issues chip are both about *this* publish; a warning review
  // pill is about the last one, so it is the signal that steps back. Demoted to
  // `info`, which D7 rule 3 already renders neutral — the copy still says
  // "Changes requested", it just stops shouting alongside two louder ambers.
  const amberElsewhere = (save === "offline" || save === "unsaved") && warnCount > 0;
  const tone: ReviewTone = pill?.tone === "warning" && amberElsewhere ? "info" : (pill?.tone ?? "info");
  const review: ReviewPill | null = pill
    ? {
        ...pill,
        tone,
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
      {/* F24/eng D5 — the single live pipe; visually hidden, never removed. */}
      <div className="bk-sr-only" role="status" aria-live="polite">
        {politeMsg}
      </div>
      {/* aria-live (not role=alert) so the exit dialog's role=alert stays the
          only alert in the tree — two alerts break getByRole and SR focus. */}
      <div className="bk-sr-only" aria-live="assertive" data-testid="bk-announce-assertive">
        {alertMsg}
      </div>
      <Topbar
        siteName={siteName}
        /* In view mode the leftmost control leaves the MODE. It used to
           leave the product — the loudest button on a preview took you to the
           dashboard, while returning to the editor was buried in ⋯. */
        onExit={viewMode.readOnlyView ? toggleReadOnlyView : exitToDashboard}
        exitLabel={viewMode.readOnlyView ? "‹ Back to editing" : "‹ Exit"}
        save={viewMode.readOnlyView ? undefined : save}
        savedAt={lastSavedAt ?? lastSaved?.getTime()}
        /* SaveStatus renders as a BUTTON that fires onSave when the state is
           unsaved or error. A view does not offer a save control. */
        onSave={viewMode.readOnlyView ? undefined : onSave}
        review={review}
        tools={tools}
        presence={
          // A reconnecting session still has collaborators in it — hiding them
          // mid-drop reads as "everyone left", which is the wrong alarm.
          collabOn && collaborationState !== "disconnected"
            ? {
                users: toPresenceUsers(users, currentUser, collaborationState),
                connection: collaborationState === "connected" ? "live" : "reconnecting",
                // T8 compact tier 3 (plan §7): two faces, then "+N". Not
                // width-conditional on purpose — CSS can hide a third avatar
                // but it cannot re-count the overflow badge, and a "+N" that
                // disagrees with the faces beside it is worse than a tighter
                // stack at every width.
                max: 2,
              }
            : null
        }
        unreadCount={unread}
        onOpenNotifications={() => setNotifOpen((v) => !v)}
        /* Publishing is the owner's act. It stayed visible in view mode
           because nothing here ever read readOnlyView for it. */
        /* `nextMove === null` means the site has no next act — live, with
           nothing waiting. The CTA is withheld there rather than showing a
           Publish that would do nothing; the live chip below carries the
           status that used to be implied by the button's presence. */
        publish={viewMode.readOnlyView || !nextMove ? "hidden" : publish}
        publishBusy={publishLoading}
        publishBlockedReason={nextMove?.blockedReason ?? undefined}
        ctaLabel={nextMove?.label}
        ctaHint={nextMove?.hint}
        liveUrl={viewMode.readOnlyView ? null : publishedUrl}
        onPublish={handleCtaClick}
        /* SendForReview used to render ONLY in view mode, from when
           ?view=client (now ?view=readonly) meant "invited content editor". It is a viewer now
           (founder, 2026-08-23), and sending a site for review is the owner's
           act, so the slot is empty there. */
        action={undefined}
        menu={
          /* Every build door is withheld in view mode; the menu keeps only
             the toggle back out, which is the one thing an owner previewing
             their client's view still needs. */
          <SiteMenu
            onOpenSiteSettings={viewMode.readOnlyView ? undefined : onOpenProjectSettings}
            onOpenHistory={viewMode.readOnlyView ? undefined : onOpenHistory}
            /* The pill (below) opens the same panel, but `REVIEW_PILL.none` is
               null — revoke a round without sending a new one and the pill is
               gone, and with it the only way back into Review. This row does
               not depend on the state it navigates to. */
            onOpenReview={viewMode.readOnlyView ? undefined : onOpenReview}
            onOpenPublish={viewMode.readOnlyView ? undefined : onOpenPublish}
            onOpenPublishHistory={viewMode.readOnlyView ? undefined : onOpenPublishHistory}
            /* Board 1172:4825 is a MODAL — format chips, a preview, a code
               view, options — and it had no door. `handleExport` opens it, but
               `handleExport` is third in `onVercelPublish ?? onOpenPublish ??
               handleExport`, and the first is never undefined, so it was as
               unreachable as the Publish panel was. Meanwhile this row fired
               `onExportHTML`, which downloads a zip on the spot: the one
               screen for CHOOSING a format was skipped by the only control
               that mentions exporting. The row opens the modal; the immediate
               zip is what the modal's own ZIP button does. */
            onExportCode={viewMode.readOnlyView ? undefined : handleExport}
            onOpenTemplates={viewMode.readOnlyView ? undefined : onOpenTemplates}
            onOpenComponents={viewMode.readOnlyView ? undefined : onOpenComponents}
            onOpenShortcuts={viewMode.readOnlyView ? undefined : onOpenShortcuts}
            onReplayOnboarding={
              viewMode.readOnlyView || !composer
                ? undefined
                : () => composer.emit(EVENTS.UI_ONBOARDING_REPLAY, {})
            }
            onAskAI={viewMode.fourToolRail ? onShowAI : undefined}
            onStartCollaboration={collabOn && !isConnected ? startCollab : undefined}
            onOpenDesignSystem={viewMode.readOnlyView ? undefined : onOpenDesignSystem}
            onOpenPlugins={viewMode.readOnlyView ? undefined : onOpenPlugins}
            publishedUrl={publishedUrl}
            onCopyLiveUrl={copyLiveUrl}
            siteId={getSiteIdFromUrl()}
            readOnlyView={viewMode.readOnlyView}
            onToggleReadOnlyView={toggleReadOnlyView}
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

      {/* T4 publish-anyway confirm — the missing frame (TODOS.md founder
          decision, resolved D12/D13). Focus opens on the safe door (F26);
          ModalRoot's trap returns focus to Publish on close. */}
      {pubConfirm ? (
        <ModalRoot open onOpenChange={(o) => !o && setPubConfirm(false)}>
          <ModalContent size="question" aria-labelledby="bk-pubconfirm-title">
            <ModalTitle id="bk-pubconfirm-title">
              {/* Board 1168:4732 says "open errors", not "errors" — the word
                  is doing work: these are errors the user has already been
                  shown and left, not ones this dialog is reporting. */}
              Publish with {errorCount} open {errorCount === 1 ? "error" : "errors"}?
            </ModalTitle>
            {/* Board 1168:4732 states the consequence, not the options — the
                options are the two buttons. */}
            <ModalDescription>
              These will ship to every visitor exactly as they are now.
              {reviewStatus.state !== "none"
                ? ` A review round is open — ${reviewStatus.reviewerName ?? "your reviewer"} will see the published site.`
                : ""}
            </ModalDescription>
            <div className="bk-pubconfirm__list">
              {confirmRows.map((i) => (
                /* Each row carries its OWN severity tint. They used to share
                   one amber box with only the text colour differing, which
                   dressed an error as a warning — the single distinction the
                   modal exists to make. */
                <p
                  key={i.id}
                  className={`tw:m-0 tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-8)] tw:rounded-[var(--bk-radius-md)] tw:text-[length:var(--bk-text-12)] tw:leading-[var(--bk-leading-normal)] ${
                    i.type === "error"
                      ? "tw:text-[var(--bk-error-text)] tw:bg-[var(--bk-error-tint)]"
                      : "tw:text-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)]"
                  }`}
                >
                  <span aria-hidden="true">{i.type === "error" ? "●" : "▲"}</span>{" "}
                  {/* `location` is the human "where" the Issue shape already
                      carries ("Brand › color.accent"); `pageId` is an id and
                      would print as one. */}
                  {i.location ? `${i.location} · ` : ""}
                  {i.message || `A ${i.type} will go live exactly as it looks now.`}
                </p>
              ))}
              {confirmMore > 0 ? (
                <Button
                  color="light"
                  size="xs"
                  onClick={() => {
                    setPubConfirm(false);
                    onOpenIssues?.();
                  }} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
                >
                  +{plural(confirmMore, "more warning")}
                </Button>
              ) : null}
            </div>
            {/* Board 1168:4732 makes "Fix issues first" the strong primary and
                "Publish anyway" the amber secondary. This footer had it exactly
                backwards: the safe action carried `color="light"` PLUS a
                transparent/ghost class string, while the risky one was a bare
                `<Button>` — which buttonTheme.ts documents as already being the
                brand accent. So the destructive choice was the solid blue CTA
                and the safe one read as a faint text link, on a dialog opened
                *because* the site has unresolved errors. Same amber treatment
                as StaleApprovalModal's "Publish anyway", which was already
                right. autoFocus stays on the safe action. */}
            <ModalFooter>
              <Button
                autoFocus
                onClick={() => {
                  setPubConfirm(false);
                  onOpenIssues?.();
                }}
              >
                Fix issues first
              </Button>
              <Button
                /* Same properties flowbite sets, so twMerge drops its accent
                   fill for the warning tone. Utilities rather than a `style`
                   object — the ratchet counts inline styles, and this value is
                   authored, not measured. */
                className="tw:bg-[var(--bk-warning)] tw:border-[var(--bk-warning)] tw:hover:bg-[var(--bk-warning)]"
                onClick={() => {
                  setPubConfirm(false);
                  publishNow();
                }}
              >
                Publish anyway
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalRoot>
      ) : null}

      {/* F1 exit dialog — dialog A ("dirty": save is a real option) vs
          dialog B ("risky": offline/conflict, a save here would be a lie). */}
      {exitDialog ? (
        <ModalRoot open onOpenChange={(o) => !o && setExitDialog(null)}>
          <ModalContent size="question" aria-labelledby="bk-exit-title">
            {/* Board 1172:4804 draws these as two different dialogs, and the
                difference is which door is the safe one. With a save
                available, leaving is the risk. Offline, STAYING is the
                answer — so Stay is the primary there and the other button
                names what it costs. */}
            <ModalTitle id="bk-exit-title">
              {exitDialog.kind === "risky"
                ? "You're offline with unsaved changes"
                : exitDialog.kind === "stranded"
                  ? "Some changes are only on this device"
                  : "Leave with unsaved changes?"}
            </ModalTitle>
            <ModalDescription>
              {exitDialog.kind === "risky"
                ? "Saving isn't possible right now — leaving loses this work. Reconnect first, or stay until the connection returns."
                : exitDialog.kind === "stranded"
                  ? /* Says what actually happens, which is not "you lose your
                       work": the local copy survives, the retry queue does not.
                       Naming the wrong loss would be its own defect — and the
                       first wording did exactly that, promising "your other
                       sites won't see them" for a count that also covers CMS
                       entries and saved versions, both of which are site-scoped
                       and would never appear on another site even after a
                       perfect sync. (Codex review, 2026-08-24.) */
                    `${exitDialog.pending} change${exitDialog.pending === 1 ? "" : "s"} ${exitDialog.pending === 1 ? "hasn't" : "haven't"} reached the server yet. Leaving drops the retry queue — they stay on this device and never reach your account.`
                  : "Your last edits aren't saved yet."}
            </ModalDescription>
            {exitDialog.error ? (
              <p className="bk-exit-dialog__error" role="alert">
                {exitDialog.error}
              </p>
            ) : null}
            <ModalFooter>
              {exitDialog.kind === "risky" || exitDialog.kind === "stranded" ? (
                <>
                  <Button onClick={() => setExitDialog(null)}>Stay</Button>
                  <Button
                    color="light"
                    onClick={leaveAnyway}
                    className="tw:border-[var(--bk-error)] tw:bg-transparent tw:text-[var(--bk-error)]"
                  >
                    {exitDialog.kind === "stranded" ? "Leave anyway" : "Leave and lose changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button color="light" onClick={() => setExitDialog(null)} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
                    Stay
                  </Button>
                  <Button
                    color="light"
                    onClick={leaveAnyway}
                    className="tw:border-[var(--bk-error)] tw:bg-transparent tw:text-[var(--bk-error)]"
                  >
                    Leave anyway
                  </Button>
                  <Button disabled={leaving} onClick={() => void saveAndLeave()} aria-busy={leaving || undefined}>
                    Save &amp; leave
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalContent>
        </ModalRoot>
      ) : null}
    </div>
  );
};

export default StudioHeader;
