/**
 * PublishTab — the Publish panel (board `4418:97118`, the panel behind B3-10
 * `7574:193972`): PRE-PUBLISH CHECKS · RELEASE TO · CHANGES IN THIS SESSION ·
 * LAST DEPLOY, then a pinned foot with the one CTA and the gate's reason.
 *
 * Reshaped 2026-09-22 (code-gap B4, G1-042/043/044/047/051/052):
 *   · the readiness checks are INLINE (they were step 1 of a wizard) and the
 *     panel's CTA opens the SAME confirm the topbar opens — `onRequestPublish`
 *     is AquibraStudio's `requestPublish`, which routes on `nextMove.gate`.
 *     The wizard, whose second step duplicated the facts confirm, is deleted;
 *   · the panel reads `nextMove` (one derivation, `useLifecycle`) for whether
 *     a publish can go ahead. `onRequestPublish` being absent is the ONLY
 *     thing left that means "no publish path is wired" (flag off);
 *   · a running publish can be cancelled (`publishJob.cancel` →
 *     `sites.cancelPublish`), and a cancelled job has its own outcome block;
 *   · Unpublish asks for the word (typed UNPUBLISH) from both doors.
 *
 * Read-only view of the ONE canonical publish state machine (`usePublishJob`,
 * the same instance the topbar drives). No second state machine, no second
 * toast — the outcome toast is `useExportHandlers`'s.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, Button, Menu, MenuItem, Modal, Popover, Progress, SkeletonBlock, Tooltip, useToast } from "@/editor/chrome-ui";
import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import type { SettingsNavId } from "../settings/types";
import type { Composer } from "../../../../engine";
import type { UsePublishJobResult } from "../../../shell/hooks/usePublishJob";
import type { NextMove } from "../../../shell/lifecycle";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { fetchPrePublishChecks, unpublishSite } from "../../../../services/PublishService";
import { EVENTS } from "@/shared/constants";
import { relativeShort, usePublishSnapshot } from "./usePublishSnapshot";
import { CHECK_DOOR, PrePublishChecks } from "./PrePublishChecks";
import { ApprovalCheckRow, PublishGateBanner } from "./PublishGateBanner";
import { UnpublishConfirmModal } from "./UnpublishConfirmModal";
import { getSiteIdFromUrl } from "../../../../services/BuildrikSyncProvider";
import {
  VERCEL_CHECK_LABEL,
  type PrePublishChecksResult,
} from "@buildrik/shared/schemas/publish";

// ============================================
// Types
// ============================================

export interface PublishTabProps {
  composer: Composer | null;
  /** Project ID for publish operations */
  projectId?: string | null;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** The site menu asked for the unpublish confirm before this tab was
   *  mounted, so the event it emits could not be heard here. The sidebar
   *  latched the request; this reads it once on mount and reports it consumed
   *  so a cancelled confirm does not come back on the next visit. */
  initialUnpublish?: boolean;
  onUnpublishIntentConsumed?: () => void;
  /** The canonical publish state machine (shared with the topbar). */
  publishJob?: UsePublishJobResult;
  /** The site's ONE next move (`useLifecycle`) — the same object the topbar
   *  CTA reads. `null` = live with nothing waiting. */
  nextMove: NextMove | null;
  /** The ONE publish door — opens the dialog `nextMove.gate` names. Absent =
   *  no publish path is wired (the flag is off): board 784:4480. */
  onRequestPublish?: () => void;
  /** Initial published URL from loaded project */
  publishedUrl?: string | null;
  /** Initial published state from loaded project */
  isProjectPublished?: boolean;
}

// ============================================
// Sub-components
// ============================================

/**
 * Where a non-passing check is fixed. Only `fail` rows block the publish, so a
 * warning gets a quiet text link, never a solid button — the affordance has to
 * match the severity or the panel implies the warning is blocking (Figma
 * "Publish · pre-checks", founder decision 2026-08-05).
 *
 * Settings rows open Settings ON their pane (UI_SETTINGS_OPEN): SEO › SEO,
 * Domain › Domains. Page rows switch to the Pages panel.
 */
type FixTarget = { tab: string } | { screen: SettingsNavId };
const FIX_TARGETS: Record<string, FixTarget> = {
  "Pages ready": { tab: "pages" },
  "SEO configured": { screen: "seo" },
  "Domain connected": { screen: "domains" },
  "Empty pages": { tab: "pages" },
  Favicon: { screen: "general" },
};

/** The board's row rhythm: label left, value right, one line. */
const ROW = "tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-[3px]";

/** "Home, Menu and Contact". */
function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Board 7045:77984 — the primary's tooltip: what it replaces and what ships. */
export function publishTooltip(lastLiveVersion: number | null, pageNames: string[]): string {
  const lead = lastLiveVersion !== null ? `Replaces LIVE · v${lastLiveVersion}.` : "First publish.";
  if (pageNames.length === 0) return lead;
  return `${lead} ${listNames(pageNames)} ${pageNames.length === 1 ? "is" : "are"} included.`;
}

/** Board 4418:97118's RELEASE TO row: label left, the value muted on the
    right with a ›. The whole row opens Settings › Domains, where the
    environment is configured (the live site stays one click away in the
    site menu and the published block). */
const EnvRow: React.FC<{ label: string; value: string | null; empty: string; onOpen?: () => void }> = ({
  label,
  value,
  empty,
  onOpen,
}) => (
  <Button
    color="light"
    size="xs"
    onClick={onOpen}
    disabled={!onOpen}
    className={`${ROW} tw:h-8 tw:w-full tw:rounded-none tw:border-transparent tw:bg-transparent tw:px-0 tw:font-normal tw:hover:bg-transparent`}
    data-testid={`publish-env-${label.startsWith("Preview") ? "preview" : "production"}`}
  >
    <span className="tw:text-[13px] tw:text-[var(--bk-ink)]">{label}</span>
    <span className={`${META} tw:flex tw:min-w-0 tw:items-center tw:gap-1`} title={value ?? empty}>
      <span className="tw:truncate">{value ?? empty}</span>
      <span aria-hidden="true">›</span>
    </span>
  </Button>
);

/** Board 4418:97118 draws CHANGES IN THIS SESSION and LAST DEPLOY as
    collapsed section headers with a trailing chevron. */
const CollapsibleTitle: React.FC<{ title: string; open: boolean; onToggle: () => void }> = ({ title, open, onToggle }) => (
  <Button
    color="light"
    size="xs"
    onClick={onToggle}
    aria-expanded={open}
    className={`${SECTION_TITLE} tw:h-6 tw:w-full tw:justify-between tw:rounded-none tw:border-transparent tw:bg-transparent tw:px-0 tw:hover:bg-transparent`}
  >
    {title}
    {open ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}
  </Button>
);

/** Board 778:4238: the labels stay, the values become bars. Widths are
    deliberately uneven — a column of identical bars reads as a rendered UI
    that has gone wrong rather than one still arriving. */
const SkeletonRows: React.FC<{ widths: string[] }> = ({ widths }) => (
  <div className="tw:flex tw:flex-col tw:gap-2 tw:py-1" aria-hidden="true">
    {widths.map((w, i) => (
      <div key={i} className="tw:flex tw:items-center tw:gap-2">
        <SkeletonBlock className="tw:size-3 tw:rounded-[2px]" />
        <SkeletonBlock className={`tw:h-3 ${w}`} />
      </div>
    ))}
  </div>
);

const TEXT_LINK = "tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-accent)]";

// ============================================
// Main Component
// ============================================

export const PublishTab: React.FC<PublishTabProps> = ({
  composer,
  projectId = null,
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
  publishJob,
  nextMove,
  onRequestPublish,
  publishedUrl: initialUrl,
  isProjectPublished,
  initialUnpublish,
  onUnpublishIntentConsumed,
}) => {
  const isPublishing = publishJob?.uiState === "publishing";
  const publishedUrl = publishJob?.publishedUrl ?? initialUrl ?? null;
  // Live-state is durable: a deployment serving (publishedUrl) OR the loaded
  // project was published. A failed/cancelled republish (uiState flips away
  // from "published") must NOT make a still-live site read as Draft.
  const isPublished = publishJob?.uiState === "published" || !!publishedUrl || !!isProjectPublished;
  const error = publishJob?.error ?? null;

  // The `projectId` prop is not threaded in unified-editor mode (AquibraStudio
  // never sets it), so resolve the site the same way the canonical publish path
  // does — from the URL. Without this the panel silently had no site: readiness
  // never loaded and the deploy sections below never rendered.
  const siteId = React.useMemo(() => projectId ?? getSiteIdFromUrl(), [projectId]);

  // Board B3-10's sections, every field read from what the editor already
  // owns (deploy history, undo stack, page list).
  const snapshot = usePublishSnapshot(composer, siteId, publishedUrl, publishJob?.uiState);

  /* Unpublish. unpublishSite was fully built — Vercel teardown included — and
     exposed only in the dashboard's site header, so taking a site down meant
     leaving the editor. This panel hosts the ONE confirm; the site menu opens
     the panel and asks it (UI_UNPUBLISH_REQUEST) rather than hosting a second
     dialog with drifting words. */
  const { addToast } = useToast();
  const [confirmUnpublish, setConfirmUnpublish] = React.useState(false);
  const [unpublishing, setUnpublishing] = React.useState(false);
  React.useEffect(() => {
    if (!composer) return;
    const ask = () => setConfirmUnpublish(true);
    composer.on(EVENTS.UI_UNPUBLISH_REQUEST, ask);
    return () => {
      composer.off(EVENTS.UI_UNPUBLISH_REQUEST, ask);
    };
  }, [composer]);
  /* The cold-open half. The listener above only serves a panel that is
     already mounted; on the first click from the site menu it did not exist
     yet and the confirm never appeared. Verified live 2026-09-15: second click
     worked, first click opened the panel and nothing else. */
  React.useEffect(() => {
    if (!initialUnpublish) return;
    setConfirmUnpublish(true);
    onUnpublishIntentConsumed?.();
  }, [initialUnpublish, onUnpublishIntentConsumed]);
  const runUnpublish = async () => {
    if (!siteId) return;
    setUnpublishing(true);
    try {
      await unpublishSite(siteId);
      setConfirmUnpublish(false);
      /* The server's truth changed; the shell derives `publishedUrl` from the
         last job and the hydrated state, so both are told. */
      publishJob?.unpublished();
      addToast({ title: "Site unpublished", description: "Its public URL stops working until you publish again.", tone: "info" });
      snapshot.reload();
    } catch (e) {
      /* The dialog stays up with the word typed: the site is still live, and
         the user decides whether to try again or stop. */
      addToast({
        title: "Couldn't unpublish",
        description: e instanceof Error ? e.message : "The site is still live. Try again.",
        tone: "error",
      });
    } finally {
      setUnpublishing(false);
    }
  };
  const siteName = composer?.getProjectMetadata?.()?.name ?? "This site";

  /* Board 784:4326 is the just-published panel: the result leads and the
     "what would go out" sections are empty by definition.

     Gated on there BEING a job — the same gate TabRouter puts on the rollback
     job it hands the History panel. `uiState` alone is "published" for any
     site with a hydrated URL and nothing in flight, and `changeCount` is 0 on
     every load because HistoryManager empties the undo stack when a project
     opens. A job id is what says a publish actually ran in this session. */
  const simulated = Boolean(publishedUrl?.includes(".dev-simulated.invalid"));
  const justPublished =
    publishJob?.jobId != null && publishJob.uiState === "published" && snapshot.changeCount === 0;
  const hasFailed = publishJob?.uiState === "failed" && !!error;
  /* Board 4418:98663 — the run was cancelled. Only a job THIS session started
     can be cancelled, so a job id is implied; nothing was deployed. */
  const wasCancelled = publishJob?.uiState === "cancelled";
  /* The build log behind board 784:4403's "View log". A pre-job failure never
     reaches the worker, so there are no steps and the link stays away rather
     than opening an empty list. */
  /* 4418:97570 / 97787 / 97355: while a run is in flight or has just ended,
     the panel shows the run and ENVIRONMENT only — no checks, no changes. */
  const failedAt = (() => {
    const steps = hasFailed ? publishJob?.steps ?? [] : [];
    const i = steps.findIndex((st) => st.status === "failed");
    return i >= 0 ? { index: i + 1, total: steps.length } : null;
  })();
  const connectionRefused = hasFailed && /token|connection|unauthori[sz]ed|reconnect/i.test(error ?? "");
  const resultState = isPublishing || justPublished || hasFailed;
  const failedSteps = hasFailed && publishJob?.steps?.length ? publishJob.steps : null;
  const [logOpen, setLogOpen] = React.useState(false);
  const [reconnectOpen, setReconnectOpen] = React.useState(false);

  /* Board 784:4250's "step 2 of 4". The worker marks exactly one step
     `running`; before it does, or once the list is exhausted, there is no
     honest step number and the line falls back to the percentage. */
  const runningStep = React.useMemo(() => {
    const steps = publishJob?.steps;
    if (!isPublishing || !steps?.length) return null;
    const i = steps.findIndex((s) => s.status === "running");
    return i < 0 ? null : { name: steps[i].name, index: i + 1, total: steps.length };
  }, [isPublishing, publishJob?.steps]);

  /* Board 784:4250 prints how long the run has been going. The job reports
     progress, not a start time, so the panel stamps the transition into
     "publishing" itself and ticks while it lasts. */
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [nowTick, setNowTick] = React.useState(0);
  React.useEffect(() => {
    if (publishJob?.uiState === "publishing") {
      setStartedAt((prev) => prev ?? Date.now());
      const t = window.setInterval(() => setNowTick((n) => n + 1), 1000);
      return () => window.clearInterval(t);
    }
    setStartedAt(null);
    return undefined;
  }, [publishJob?.uiState]);
  const startedAgo = React.useMemo(() => {
    void nowTick;
    if (!startedAt) return "";
    const secs = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m`;
  }, [startedAt, nowTick]);

  /* Cancel (G1-047). `sites.cancelPublish` flips a QUEUED/BUILDING job to
     CANCELLED and the poll reports it; past that point the server answers
     NOT_CANCELLABLE and `publishJob.error` carries its sentence, shown under
     the bar. What this cancels is the JOB on the server — the export that
     produced the payload ran synchronously before the job existed and is not
     a thing that can be cancelled, so the copy never claims it. */
  const [cancelling, setCancelling] = React.useState(false);
  const cancelRun = async () => {
    if (!publishJob || cancelling) return;
    setCancelling(true);
    try {
      await publishJob.cancel();
    } finally {
      setCancelling(false);
    }
  };
  React.useEffect(() => {
    if (!isPublishing) setCancelling(false);
  }, [isPublishing]);

  // Readiness comes from the server (`runPrePublishChecks`), never from a local
  // approximation. See fetchPrePublishChecks for why: the old local set was a
  // different seven checks with no severity and no Vercel check, so the panel
  // could read all-green while the server hard-refused the publish.
  const [checkState, setCheckState] = React.useState<"loading" | "ready" | "error">("loading");
  const [checks, setChecks] = React.useState<PrePublishChecksResult | null>(null);

  const loadChecks = React.useCallback(async () => {
    if (!siteId) {
      setCheckState("ready");
      setChecks(null);
      return;
    }
    setCheckState("loading");
    try {
      const result = await fetchPrePublishChecks(siteId);
      /* 7051:78232 / 7051:78633 draw the server's Favicon row too (with
         Fix ›), so every server row renders — the list is the server's. */
      setChecks(result);
      setCheckState("ready");
    } catch {
      // DF5: never fall back to a fake-passing checklist — show Retry.
      setChecks(null);
      setCheckState("error");
    }
  }, [siteId]);

  React.useEffect(() => {
    void loadChecks();
  }, [loadChecks]);

  // Re-read after a publish settles: publishing can change what the checks
  // report (a first deploy resolves the Vercel row), and a stale checklist is
  // the exact failure this panel is being fixed for.
  const uiState = publishJob?.uiState;
  React.useEffect(() => {
    if (uiState === "published" || uiState === "failed") void loadChecks();
  }, [uiState, loadChecks]);

  const blocking = React.useMemo(
    () => (checks?.checks ?? []).filter((c) => c.status === "fail"),
    [checks],
  );
  // Only a `fail` blocks. When the checks could not be loaded we do NOT invent a
  // block — the server gate is still authoritative and refuses on its own.
  const blockedByChecks = checkState === "ready" && !!checks && !checks.ready;
  /** Board 893:4518 — the blocker is the connection itself, which is answered
      with Connect rather than Fix. */
  const blockedOnVercel = blocking.some((c) => c.label === VERCEL_CHECK_LABEL);

  /*
    Board 784:4480 ("Connect Vercel to publish.") is the panel with no publish
    path at all — `onRequestPublish` absent, i.e. publishing not wired.

    It is NOT the panel for "connected account missing". That case is the
    Vercel check failing in the list above, with `Connect` on the row and a
    `Connect Vercel` footer CTA — so the checklist is what explains the block.
  */
  const noPublishPath = !onRequestPublish;
  const openIntegrations = () =>
    window.open(`${DASHBOARD_URL}/dashboard/settings/integrations`, "_blank", "noopener");

  const openDomains = composer ? () => composer.emit(EVENTS.UI_SETTINGS_OPEN, { screen: "domains" }) : undefined;
  const [changesOpen, setChangesOpen] = React.useState(false);
  const [lastDeployOpen, setLastDeployOpen] = React.useState(false);

  /* Board 7045:77972 — the panel ⋯: All versions › (History › Published) and,
     while the site is live, Unpublish site… (the confirm below). */
  const [menuOpen, setMenuOpen] = React.useState(false);
  const canUnpublish = Boolean(snapshot.lastDeploy?.isLive && siteId);
  const publishMenu = (
    <Popover
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      placement="bottom-end"
      label="Publish actions"
      trigger={
        <Button
          color="light"
          size="xs"
          className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
          aria-label="Publish actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          data-testid="publish-menu"
        >
          <MoreHorizontal size={14} aria-hidden="true" />
        </Button>
      }
    >
      <Menu label="Publish actions">
        <MenuItem
          disabled={!composer}
          onClick={() => {
            setMenuOpen(false);
            composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "history", screen: "published" });
          }}
        >
          All versions ›
        </MenuItem>
        {canUnpublish ? (
          <MenuItem
            danger
            disabled={unpublishing}
            onClick={() => {
              setMenuOpen(false);
              setConfirmUnpublish(true);
            }}
          >
            {unpublishing ? "Unpublishing…" : "Unpublish site…"}
          </MenuItem>
        ) : null}
      </Menu>
    </Popover>
  );

  const renderFix = (label: string): React.ReactNode => {
    /* Board 893:4518 puts `Connect` on the Vercel row, not `Fix` — the fix is
       not in this editor, so it opens the dashboard's integrations page
       rather than switching tabs. */
    if (label === VERCEL_CHECK_LABEL) {
      return (
        <a
          href={`${DASHBOARD_URL}/dashboard/settings/integrations`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CHECK_DOOR} tw:no-underline`}
        >
          Connect
        </a>
      );
    }
    const target = FIX_TARGETS[label];
    if (!target) return null;
    return (
      <Button
        color="light"
        size="xs"
        onClick={() =>
          "screen" in target
            ? composer?.emit(EVENTS.UI_SETTINGS_OPEN, { screen: target.screen })
            : composer?.emit("ui:switch-tab", { tab: target.tab })
        }
        className={CHECK_DOOR}
      >
        Fix ›
      </Button>
    );
  };

  /* ── The CTA reads ONE gate (B4, decision #34) ────────────────────────────
     Disabled, with the reason printed under it, when:
       · the lifecycle blocks it (flag · role · offline · a review round that
         has not cleared) — `nextMove.blockedReason` / gate `waiting`;
       · the site has no next act (`nextMove === null`: live, nothing waiting);
       · the server's readiness list has a blocking row;
       · a publish is running, or just landed.
     Otherwise it opens the door `nextMove.gate` names — the errors confirm,
     the changes-requested gate, the stale acknowledgement, or the facts
     confirm — through the same `requestPublish` the topbar uses. */
  /* `waiting` and `unchecked` print their own reason in the gate banner. */
  const gateSpeaks = nextMove?.gate === "waiting" || nextMove?.gate === "unchecked";
  const gateShut = nextMove === null || gateSpeaks || nextMove.blockedReason !== null;
  /* Never publishable in an unknown state (re-walk 2026-09-24: the CTA stayed
     clickable through a 60 s "Checking readiness…"). A disabled primary always
     says why. */
  const checksPending = !noPublishPath && checkState === "loading";
  const ctaDisabled = isPublishing || justPublished || snapshot.error || blockedByChecks || gateShut || checksPending;
  const ctaReason: string | null = isPublishing
    ? `${isPublished ? "Update" : "Publishing"} in progress — please wait.`
    : checksPending
      ? "Checking readiness…"
      : snapshot.error
        ? "Couldn't read the deploy history — try again above."
        : nextMove === null
      ? "Nothing has changed since the last deploy."
      : !gateSpeaks && nextMove.blockedReason
        ? nextMove.blockedReason
        : null;

  /* Board 784:4403's failure block, hoisted to a const because it renders in
     TWO branches: the normal panel, and the no-publish-path panel when the
     publish failed by revoking the connection. One implementation, so the two
     cannot say different things about the same failure. */
  const failureSection = (
    <section className={`${SECTION} ${RESULT_BLOCK}`} aria-label="Publish failure">
      {/* 4418:97355: a 13px red line, the reason in 12 muted, then a primary
          door — "Repair connection" when the connection was refused, else
          "Try again" — with "View log" beside it. */}
      <h2 className={RESULT_TITLE_ERROR}>Publish failed.</h2>
      <p className={`${META} tw:mt-2 tw:leading-[18px]`}>
        {error}
        {error && !/nothing was deployed|unchanged/i.test(error)
          ? snapshot.lastDeploy?.isLive
            ? " The previous live version is unchanged."
            : " Nothing was deployed."
          : ""}
      </p>
      <div className="tw:mt-3 tw:flex tw:items-center tw:gap-4">
        {connectionRefused ? (
          <Button size="xs" onClick={() => setReconnectOpen(true)} className="tw:h-7 tw:px-3" data-testid="publish-repair">
            Repair connection
          </Button>
        ) : (
          <Button
            size="xs"
            disabled={!onRequestPublish}
            onClick={() => {
              publishJob?.reset?.();
              onRequestPublish?.();
            }}
            className="tw:h-7 tw:px-3"
          >
            Try again
          </Button>
        )}
        {/* Board 784:4403 draws "View log" beside "Try again". `getPublishStatus`
            has always returned the `steps` column — the link names the step
            that failed and the ones that never ran. */}
        {failedSteps && (
          <Button color="light" size="xs" onClick={() => setLogOpen(true)} aria-haspopup="dialog" className={TEXT_LINK}>
            View log
          </Button>
        )}
      </div>
      {/* 4418:98003 — the log is a dialog: where it stopped, why, and what
          is still live; the step list follows. */}
      <Modal
        open={Boolean(failedSteps) && logOpen}
        onClose={() => setLogOpen(false)}
        testId="publish-log"
        title={`Publish log · ${siteName} / Production`}
        footer={
          <Button size="xs" onClick={() => setLogOpen(false)}>
            Back to publish
          </Button>
        }
      >
        {failedAt ? <p className={LOG_LINE}>Attempt failed at step {failedAt.index} of {failedAt.total}.</p> : null}
        {error ? <p className={LOG_LINE}>{error}</p> : null}
        <p className={LOG_LINE}>
          No new deployment was created.
          {snapshot.lastDeploy?.isLive ? ` Current live version: v${snapshot.lastDeploy.version}.` : ""}
        </p>
      {failedSteps && logOpen && (
        <ul className="tw:m-0 tw:mt-2 tw:list-none tw:p-0" aria-label="Build log">
          {failedSteps.map((s) => (
            <li key={s.name} className="tw:flex tw:items-center tw:gap-2 tw:py-0.5 tw:text-[12px] tw:leading-[18px]">
              {/* The glyph carries the outcome visually and the sr-only word
                  carries it to a screen reader — the same rule the check rows
                  follow. */}
              <span
                aria-hidden="true"
                className={
                  s.status === "failed"
                    ? "tw:text-[var(--bk-error)]"
                    : s.status === "done"
                      ? "tw:text-[var(--bk-success-text)]"
                      : "tw:text-[var(--bk-ink-muted)]"
                }
              >
                {s.status === "failed" ? "✕" : s.status === "done" ? "✓" : "·"}
              </span>
              <span className="tw:text-[var(--bk-ink)]">{s.name}</span>
              <span className={META}>{STEP_WORD[s.status] ?? s.status}</span>
            </li>
          ))}
        </ul>
      )}
      </Modal>
      {/* 4418:98009 — reconnecting happens in the dashboard; the dialog says
          so, names the site, and offers the way back once it is done. */}
      <Modal
        open={reconnectOpen}
        onClose={() => setReconnectOpen(false)}
        testId="publish-reconnect"
        title="Reconnect Vercel · Workspace"
        footer={
          <>
            <Button
              color="light"
              size="xs"
              className="tw:border-transparent tw:bg-transparent"
              onClick={() => {
                setReconnectOpen(false);
                publishJob?.reset?.();
                void loadChecks();
              }}
            >
              Connection restored · review publish
            </Button>
            <Button size="xs" onClick={openIntegrations}>
              Open dashboard
            </Button>
          </>
        }
      >
        <p className={LOG_LINE}>Open workspace connections in the dashboard to reconnect Vercel.</p>
        <p className={LOG_LINE}>
          {[siteName, "Production", snapshot.production.value].filter(Boolean).join(" · ")}
        </p>
        <p className={LOG_LINE}>Return after the connection is restored, then review the publish details again.</p>
      </Modal>
    </section>
  );

  return (
    /* h-full so the pinned CTA below actually reaches the bottom of the
       drawer: PanelFrame is flex-col but sizes to content, which left the
       button floating mid-panel with white space under it. */
    <PanelFrame className="tw:h-full">
      <PanelFrame.Header
        title="Publish"
        actions={publishMenu}
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      {noPublishPath ? (
        <div className={CONTENT}>
          {/* Board 784:4480 — with no publish path there is nothing to say
              about environments, changes or deploys: the panel states the one
              fact that matters and offers the one action that changes it. */}
          <section className={SECTION}>
            <h2 className="tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:text-[var(--bk-ink)]">
              Connect Vercel to publish.
            </h2>
            <p className="tw:m-0 tw:mt-1 tw:text-[13px] tw:leading-normal tw:text-[var(--bk-ink-muted)]">
              Buildrick deploys into your own Vercel account — we host nothing.
            </p>
          </section>
        </div>
      ) : snapshot.error ? (
        /* Frame 781:4545 verbatim: pt-36 pb-32 px-24, 6px gaps, three lines at
           13 / 12 / 13. */
        <div
          className="tw:flex tw:flex-col tw:gap-1.5 tw:px-6 tw:pt-9 tw:pb-8"
          role="alert"
          aria-label="Deploy service unreachable"
          data-testid="publish-load-error"
        >
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error-text)]" data-testid="publish-load-error-title">
            Couldn&apos;t reach the deploy service.
          </p>
          <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]" data-testid="publish-load-error-desc">
            Nothing was published. Your work is saved.
          </p>
          <Button
            color="light"
            size="xs"
            variant="link"
            onClick={() => snapshot.reload()}
            data-testid="publish-load-error-retry"
            className="tw:min-h-5 tw:self-start tw:p-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-accent-text)]"
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
        {/* Board 784:4250 — while a publish runs, the panel leads with the run
            itself, at the panel's own width on the board's 24px gutters. */}
        {isPublishing && (
          <section
            className="tw:flex tw:flex-col tw:gap-2 tw:px-6 tw:pt-8 tw:pb-7"
            aria-label="Publish progress"
            data-testid="publish-progress"
          >
            <h3 className="tw:m-0 tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="publish-progress-title">
              Publishing to production…
            </h3>
            {/* The board's meta line reads "Building · step 2 of 4 · started
                14s ago". It names the running step rather than a phase word,
                because the worker knows which one it is. Falls back to the
                percentage when a job carries no steps. */}
            <p className={META} data-testid="publish-progress-meta">
              {runningStep
                ? `${runningStep.name} · step ${runningStep.index} of ${runningStep.total}`
                : publishJob && publishJob.progress > 0
                  ? `${publishJob.progress}%`
                  : "Starting"}
              {startedAgo ? ` · started ${startedAgo} ago` : ""}
            </p>
            {/* GEOMETRY stays flowbite's (chrome-ui's shared `Progress`);
                COLOUR is corrected to the single accent — flowbite fills the
                bar blue-600, one step off blue-700. `theme.color`, not
                `theme.bar`, because the colour class is twMerged after bar. */}
            <Progress progress={publishJob?.progress ?? 0} size="sm" theme={{ color: { default: "tw:bg-[var(--bk-accent)]" } }} />
            {/* Board 4418:97570 — Cancel beside the run. A job the worker has
                already handed to Vercel answers NOT_CANCELLABLE; the server's
                sentence prints under the bar and the run keeps going. */}
            {/* 4418:97570 sets Cancel at the bar's right end. */}
            <div className="tw:mt-1 tw:flex tw:items-center tw:justify-end tw:gap-4">
              <Button
                color="light"
                size="xs"
                onClick={() => void cancelRun()}
                disabled={cancelling}
                aria-busy={cancelling || undefined}
                className={TEXT_LINK}
                data-testid="publish-cancel"
              >
                {cancelling ? "Cancelling…" : "Cancel"}
              </Button>
              {error ? (
                <span className={`${META} tw:text-[var(--bk-error-text)]`} role="alert" data-testid="publish-cancel-error">
                  {error}
                </span>
              ) : null}
            </div>
          </section>
        )}
        <div className={CONTENT}>
        <>

        {/* Board 784:4403 — a failed publish leads with the failure AND with
            the fact that nothing changed, which is the half a user needs
            first. */}
        {hasFailed && failureSection}

        {/* Board 4418:98663 — the run was cancelled. Nothing went out; the
            door to try again is the same door as always. ("Resume" is on the
            board and has no backing: a cancelled job is terminal.) */}
        {wasCancelled && (
          <section className={SECTION} aria-label="Publish cancelled" data-testid="publish-cancelled">
            <h2 className="tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:text-[var(--bk-ink)]">
              Publish cancelled.
            </h2>
            <p className={META}>Nothing was deployed. Your work is saved.</p>
            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-4">
              <Button
                color="light"
                size="xs"
                disabled={ctaDisabled}
                onClick={() => {
                  publishJob?.reset?.();
                  onRequestPublish?.();
                }}
                className={TEXT_LINK}
                data-testid="publish-again"
              >
                Publish again
              </Button>
            </div>
          </section>
        )}

        {/* Board 784:4326 — the moment after a publish: what went out, where
            to see it, and what changed against the version it replaced. */}
        {justPublished && (
          <section className={`${SECTION} ${RESULT_BLOCK}`} aria-label="Publish result">
            {/* Board 4418:99089 (C5 G1-048): a dev simulation says so. The
                worker gives it a `.dev-simulated.invalid` URL, which is how
                the panel knows — and why it offers no "View live site". */}
            {simulated ? (
              <>
                <h2
                  className="tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:text-[var(--bk-success-text)]"
                  data-testid="publish-simulated"
                >
                  Simulated publish — nothing was deployed.
                </h2>
                <p className={META}>
                  PUBLISH_ALLOW_SIMULATION is on. The URL is on .dev-simulated.invalid and can never resolve.
                </p>
              </>
            ) : (
              <>
                <h2 className={RESULT_TITLE_SUCCESS}>Published to production.</h2>
                {/* 4418:97787: "● LIVE · v6". */}
                <p className={`${META} tw:mt-2 tw:flex tw:items-center tw:gap-1.5`}>
                  <span className="tw:size-2 tw:rounded-full tw:bg-[var(--bk-ink-muted)]" aria-hidden="true" />
                  {snapshot.lastDeploy ? `LIVE · v${snapshot.lastDeploy.version}` : "LIVE"}
                  <span className="tw:sr-only">{snapshot.lastDeploy ? relativeShort(snapshot.lastDeploy.rawAt) : "just now"}</span>
                </p>
              </>
            )}
            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-4">
              {publishedUrl && !simulated && (
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="tw:text-[13px] tw:text-[var(--bk-accent)] tw:no-underline">
                  View live site
                </a>
              )}
              {snapshot.lastDeploy && snapshot.lastDeploy.version > 1 && (
                <Button
                  color="light"
                  size="xs"
                  onClick={() => composer?.emit("ui:switch-tab", { tab: "history" })}
                  className={TEXT_LINK}
                >
                  Compare v{snapshot.lastDeploy.version - 1} → v{snapshot.lastDeploy.version}
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Board B3-10 opens on the checks. They gate the publish, so they
            sit where the user decides to publish — in the panel, not behind
            the CTA (they were a wizard step; owner decision 2026-09-21). The
            list is the server's; the Client approval row is the lifecycle's,
            and the two read as one list. Absent during a run, which the board
            leads with. */}
        {!resultState && (
        <section className={SECTION} aria-label="Pre-publish checks">
          <h3 className={SECTION_TITLE}>Pre-publish checks</h3>
          <PrePublishChecks state={checkState} checks={checks} onRetry={() => void loadChecks()} renderFix={renderFix}>
            <ApprovalCheckRow nextMove={nextMove} composer={composer} />
          </PrePublishChecks>
        </section>
        )}

        {/* Board B3-10's RELEASE TO: Production carries the live domain;
            Preview deployment stays listed because an environment list that
            hides it says the site has none (its row has no backing yet —
            annotation card beside 4418:97118). */}
        <section className={SECTION} aria-label="Release to">
          {/* The run boards (4418:97570 / 97787 / 97355) title it ENVIRONMENT. */}
          <h3 className={SECTION_TITLE}>{resultState ? "Environment" : "Release to"}</h3>
          {snapshot.loading ? (
            <SkeletonRows widths={["tw:w-32", "tw:w-24"]} />
          ) : (
            <>
              <EnvRow
                label={snapshot.production.label}
                value={snapshot.production.value}
                empty="Not published yet"
                onOpen={openDomains}
              />
              <EnvRow
                /* 97570 / 97787 write "Preview"; 97355 keeps "Preview deployment". */
                label={isPublishing || justPublished ? "Preview" : "Preview deployment"}
                value={snapshot.preview.value}
                empty="None"
                onOpen={openDomains}
              />
            </>
          )}
        </section>

        {/* Board B3-10's CHANGES IN THIS SESSION — what would go out if you
            published now. The count pair is the header; the rows are the
            changes themselves. Absent during a run and right after one. */}
        {!isPublishing && !justPublished && !hasFailed && (
        <section className={`${SECTION} ${COLLAPSED_SECTION}`} aria-label="Changes in this session">
          <CollapsibleTitle title="Changes in this session" open={changesOpen} onToggle={() => setChangesOpen((v) => !v)} />
          {!changesOpen ? null : snapshot.loading ? (
            <SkeletonRows widths={["tw:w-36", "tw:w-28", "tw:w-20", "tw:w-32"]} />
          ) : (
          <>
          <div className={ROW}>
            <span className="tw:text-[13px] tw:text-[var(--bk-ink)]">
              {snapshot.changeCount} {snapshot.changeCount === 1 ? "change" : "changes"}
            </span>
            <span className={META}>
              {snapshot.pageCount} {snapshot.pageCount === 1 ? "page" : "pages"}
            </span>
          </div>
          {snapshot.changes.slice(0, 6).map((c) => (
            <div key={c.id} className={ROW}>
              <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[13px] tw:text-[var(--bk-ink)]">
                {c.label}
              </span>
              <span className={`${META} tw:flex-none`}>
                {c.author ? `${c.author} · ${c.when}` : c.when}
              </span>
            </div>
          ))}
          {snapshot.changeCount === 0 && (
            /* Two different facts wore one sentence. With no deploy to measure
               from, "Nothing has changed since the last deploy." is false. The
               never-published line states what the section claims to state —
               what would go out if you published now. */
            <p className={META}>
              {snapshot.lastDeploy
                ? "Nothing has changed since the last deploy."
                : "Publishing will put the whole site live for the first time."}
            </p>
          )}
          </>
          )}
        </section>
        )}

        {/* Board B3-10's LAST DEPLOY — what is live right now, and therefore
            what a rollback would return to. */}
        {!isPublishing && !justPublished && !hasFailed && (
        <section className={`${SECTION} ${COLLAPSED_SECTION}`} aria-label="Last deploy">
          <CollapsibleTitle title="Last deploy" open={lastDeployOpen} onToggle={() => setLastDeployOpen((v) => !v)} />
          {!lastDeployOpen ? null : snapshot.loading ? (
            <SkeletonRows widths={["tw:w-24"]} />
          ) : snapshot.lastDeploy ? (
            <>
              {/* 7051:78633: "● LIVE · v6" with its date, then "All versions ›". */}
              <div className={ROW}>
                <span className="tw:flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:text-[var(--bk-ink)]">
                  {snapshot.lastDeploy.isLive ? (
                    <span className="tw:size-2 tw:rounded-full tw:bg-[var(--bk-ink)]" aria-hidden="true" />
                  ) : null}
                  {snapshot.lastDeploy.isLive ? "LIVE · " : "Not live · "}v{snapshot.lastDeploy.version}
                </span>
                <span className={META}>{snapshot.lastDeploy.when}</span>
              </div>
              <Button
                color="light"
                size="xs"
                disabled={!composer}
                onClick={() => composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "history", screen: "published" })}
                className={`${CHECK_DOOR} tw:mt-1 tw:self-start`}
                data-testid="publish-last-deploy-all"
              >
                All versions ›
              </Button>
            </>
          ) : (
            <p className={META}>This site has never been published.</p>
          )}
        </section>
        )}
        </>
        </div>
        </>
      )}

      {/* Board B3-10 pins the foot to the bottom of the panel: a meta line
          naming what the publish replaces, the CTA sized to its label, and
          the gate's reason with its door beside it. A bordered white band on
          16px gutters with 10 above and below. */}
      {/* 4418:97118 prints what the publish replaces ABOVE the footer's rule. */}
      {!noPublishPath && !resultState && !snapshot.loading && !snapshot.error ? (
        <p className={`${META} tw:px-4 tw:pb-2`} data-testid="publish-footer-meta">
          {snapshot.lastDeploy?.isLive ? `Replaces LIVE · v${snapshot.lastDeploy.version}` : "First publish"}
        </p>
      ) : justPublished && !simulated ? (
        /* 4418:97787: why the primary is off right after a publish. */
        <p className={`${META} tw:px-4 tw:pb-2`} data-testid="publish-footer-meta">
          No page changes{snapshot.lastDeploy ? ` since v${snapshot.lastDeploy.version}` : ""}. Edit a page to publish an
          update.
        </p>
      ) : null}
      <div
        className="tw:flex tw:flex-col tw:gap-2 tw:border-t tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-4 tw:py-2.5"
        data-testid="publish-footer"
      >
        {noPublishPath ? (
          /* Board 784:4480 puts the CTA here too — the panel body above
             carries the sentence, this is the action. */
          <Button onClick={openIntegrations} className="tw:w-full">
            Connect Vercel
          </Button>
        ) : (
          <>
            <div className="tw:flex tw:items-center tw:gap-3">
              {/* Boards 781:4526 / 784:4287 draw "Button · disabled" as a grey
                  chip sized to its label, 28 tall. The remaining 50% dim is
                  `themes/ux-fixes.css`'s global `button:disabled { opacity:
                  .5 }`, left global deliberately. */}
              {hasFailed ? (
                /* 4418:97355's foot: one way back to the panel. */
                <Button
                  onClick={() => publishJob?.reset?.()}
                  className="tw:h-7 tw:w-auto tw:flex-none tw:self-start tw:whitespace-nowrap tw:px-3 tw:py-1.5 tw:text-[13px]"
                  data-testid="publish-back"
                >
                  Back to Publish
                </Button>
              ) : (() => {
                const cta = (
                  <Button
                    onClick={onRequestPublish}
                    disabled={ctaDisabled}
                    /* 4418:97118 draws the blocked CTA as the accent at 40%, one
                       line, 13px — not a grey chip. */
                    className={`tw:h-7 tw:w-auto tw:flex-none tw:self-start tw:whitespace-nowrap tw:px-3 tw:py-1.5 tw:text-[13px] tw:disabled:bg-[var(--bk-accent)] tw:disabled:text-white ${
                      /* 4418:97570 draws "Publishing…" and 97787 "No new
                         changes" at full strength. */
                      isPublishing || justPublished ? "tw:disabled:opacity-100" : "tw:disabled:opacity-40"
                    }`}
                    data-testid="publish-cta"
                  >
                    {/* One label, in every state. The board names the destination
                        and never draws an "Update" variant. */}
                    {isPublishing ? "Publishing…" : justPublished ? "No new changes" : "Publish to production"}
                  </Button>
                );
                /* Board 7045:77984: hovering the live primary says what it
                   replaces and which pages ship. A disabled primary has its
                   reason printed under it instead. */
                return ctaDisabled || snapshot.loading ? (
                  cta
                ) : (
                  <Tooltip
                    content={publishTooltip(
                      snapshot.lastDeploy?.isLive ? snapshot.lastDeploy.version : null,
                      snapshot.pageNames,
                    )}
                  >
                    {cta}
                  </Tooltip>
                );
              })()}
              {/* Board 893:4518 swaps the primary's neighbour for Connect
                  Vercel when the connection is the blocker. */}
              {blockedOnVercel && !isPublishing ? (
                <Button color="light" size="xs" onClick={openIntegrations} className="tw:h-7">
                  Connect Vercel
                </Button>
              ) : null}
              {/* 4418:97118: the gate's reason and door stack BESIDE the CTA. */}
              {!isPublishing ? <PublishGateBanner nextMove={nextMove} composer={composer} /> : null}
            </div>
            {ctaReason && !isPublishing && !hasFailed ? (
              <p className="tw:m-0 tw:text-[11px] tw:leading-[1.4] tw:text-[var(--bk-ink-muted)]" data-testid="publish-cta-reason">
                {ctaReason}
              </p>
            ) : null}
            {blockedByChecks && !isPublishing && (
              <p className="tw:m-0 tw:text-[11px] tw:text-[var(--bk-error)] tw:leading-[1.4]" data-testid="publish-blocked-by-checks">
                {blocking.map((c) => c.detail).join(" ")}
              </p>
            )}
          </>
        )}
      </div>
      {/* Privacy & Terms footer. The two links are underlined and the sentence
          around them is gray-600: inside a text block, colour alone cannot
          carry "this is a link" (WCAG 1.4.1). */}
      <div className="tw:px-4 tw:py-2.5 tw:text-xs tw:leading-normal tw:text-[var(--bk-ink-soft)] tw:text-center">
        By publishing, your site is deployed to your connected Vercel account.{" "}
        <a href={`${DASHBOARD_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="tw:text-[var(--bk-accent-text)] tw:underline">
          Privacy policy
        </a>
        {" · "}
        <a href={`${DASHBOARD_URL}/terms`} target="_blank" rel="noopener noreferrer" className="tw:text-[var(--bk-accent-text)] tw:underline">
          Terms of service
        </a>
      </div>

      <UnpublishConfirmModal
        open={confirmUnpublish}
        siteName={siteName}
        busy={unpublishing}
        onConfirm={() => void runUnpublish()}
        onClose={() => setConfirmUnpublish(false)}
      />
    </PanelFrame>
  );
};

// ============================================
// Classes
// ============================================

const CONTENT = "tw:flex-1 tw:overflow-y-auto tw:px-4 tw:py-3 tw:flex tw:flex-col tw:gap-3";
/* 4418:97118 stacks the two collapsible headers at a 28 pitch right under
   RELEASE TO — they sit 4 apart, not a full section gap. */
const COLLAPSED_SECTION = "tw:-mt-3";
/* Board B3-10 sets these sections on the panel surface itself — no cards. */
const SECTION = "tw:flex tw:flex-col tw:gap-0";
/* The board's section label: 11px, uppercase, tracked, ink-muted. */
const SECTION_TITLE =
  "tw:m-0 tw:mb-1 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]";
const META = "tw:m-0 tw:text-xs tw:text-[var(--bk-ink-muted)]";
/* 4418:97787 / 97355: the outcome line is 13/400, green or red — not a 16
   semibold heading. */
/* The outcome block sits on the run block's 24 gutter and 32 top
   (4418:97787 / 97355), with the board's air before ENVIRONMENT. */
/* 4418:98003 / 98009 — the dialog lines, 13 ink with 12 between. */
const LOG_LINE = "tw:m-0 tw:mb-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const RESULT_BLOCK = "tw:px-2 tw:pt-5 tw:pb-8";
const RESULT_TITLE_SUCCESS = "tw:m-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-success-text)]";
const RESULT_TITLE_ERROR = "tw:m-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-error-text)]";

/** The worker's own step statuses, said in words. `pending` is the one that
    matters and the one a raw dump would bury: it means the step never ran,
    which is how a reader tells "this broke" from "this was skipped". */
const STEP_WORD: Record<string, string> = {
  pending: "not run",
  running: "in progress",
  done: "done",
  failed: "failed",
};

export default PublishTab;
