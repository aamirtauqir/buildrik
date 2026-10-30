/**
 * PublishTray — the editor's one publish surface, docked in the right column
 * (boards Publish v2 `499:2656` and B8-PB01 `233:2`: "Task host / Publish",
 * 360 wide, right edge; the canvas column narrows beside it and the authored
 * viewport scales to fit). design-2l9 Task 1.7.
 *
 * ONE CTA, in the footer, with its reason under it. The topbar's Publish is
 * the tray's toggle, never a second CTA (`publishTrayStore`).
 *
 * Every publish decision is read, never re-derived:
 *   · `nextMove` (useLifecycle) — the label, and why the door is shut: flag,
 *     role, network, review round, or OD-1's "Fix {n} blocking issue(s) to
 *     publish" (blocking issues block; "Publish anyway" is gone);
 *   · `publishJob` (usePublishJob) — running, landed, failed, poll lost;
 *   · the server's readiness list (`usePrePublishChecks`) — a failing Vercel
 *     row turns the CTA into "Connect Vercel";
 *   · the CMS outbox (`cmsSyncBlocker` / `cmsSyncFailure`) — publish waits
 *     for CMS writes to land, and a write stuck for 5 attempts or 60 s says
 *     why and where.
 *
 * Try again is idempotent. A lost poll resumes the SAME job (`track`); a
 * failed job asks for a new one through the shell's one door, and the server
 * refuses a second live job per site (`ALREADY_PUBLISHING`,
 * publish.service.ts) — so a double press, or a press while the old job is
 * somehow still alive, never deploys twice.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, CopyButton, Menu, MenuItem, Popover, useFocusTrap } from "@/editor/chrome-ui";
import { MoreHorizontal, X } from "lucide-react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { getSiteIdFromUrl, updateSiteColumns } from "@/services/BuildrikSyncProvider";
import {
  cmsSyncBlocker,
  cmsSyncFailure,
  onCmsSyncError,
  retryCmsSync,
  type CmsSyncFailure,
} from "@/services/cmsSync";
import { PASSWORD_CHECK_LABEL, PLAN_LIMIT_CHECK_LABEL, VERCEL_CHECK_LABEL } from "@buildrik/shared/schemas/publish";
import { CONTENT_CHECK_LABELS } from "@buildrik/shared/content/contentIssues";
import { locateComment } from "@/editor/sidebar/tabs/review/locate";
import { openPublishCheckFix } from "@/editor/sidebar/tabs/publish/PublishTab";
import { usePrePublishChecks } from "@/editor/sidebar/tabs/publish/usePrePublishChecks";
import { domainOf, usePublishSnapshot } from "@/editor/sidebar/tabs/publish/usePublishSnapshot";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import { fetchCurrentRound, type CurrentRound } from "@/services/ReviewService";
import { PUBLISH_CHECK_ISSUE } from "./hooks/useIssuesFeed";
import type { UsePublishJobResult } from "./hooks/usePublishJob";
import type { Issue } from "./hooks/useStudioState";
import { PUBLISH_REFUSAL, type NextMove } from "./lifecycle";
import { trayCta, type Cta } from "./publishTrayCta";
import { publishTray } from "./publishTrayStore";
import { ChangesSection, FailedLog, PasswordCheckCard, OUTCOME_BTN, OutcomeNote, PublishedActions, RunSection, TraySkeleton, runSteps } from "./PublishTrayRun";
import { usePublishPreviewDiff } from "@/editor/sidebar/tabs/publish/usePublishPreviewDiff";

/* The server's content rows ("Image alt text", "Links") run the same shared
   detector the issue scanner runs per element — the tray lists the per-element
   rows (each one selectable), so the server's summary of them would count
   every fact twice. Same rule as useIssuesFeed. */
const SERVER_CONTENT_LABELS = new Set<string>(Object.values(CONTENT_CHECK_LABELS));

/** Task 1.7: a CMS write is "stuck" — not merely pending — after this many
 *  failed attempts or this long failing. */
const CMS_STUCK_ATTEMPTS = 5;
const CMS_STUCK_MS = 60_000;
/** How long a Try again / Check status press stays latched when nothing follows it. */
const RETRY_LATCH_MS = 3000;

export interface PublishTrayProps {
  composer: Composer | null;
  publishJob?: UsePublishJobResult;
  nextMove: NextMove | null;
  /** The shell's one publish door (`requestPublish`). Absent = no publish
   *  path is wired (the flag is off). */
  onRequestPublish?: () => void;
  issues: Issue[];
}

/* ── CMS sync — pending vs stuck ─────────────────────────────────────────── */

export interface CmsSyncState {
  /** `cmsSyncBlocker()`'s sentence — writes still on their way. */
  pending: string | null;
  /** Set once the failing write has failed 5 times or for 60 s. */
  stuck: CmsSyncFailure | null;
}

function readCmsSync(now: number): CmsSyncState {
  const pending = cmsSyncBlocker();
  const failure = pending ? cmsSyncFailure() : null;
  const stuck =
    failure && (failure.attempts >= CMS_STUCK_ATTEMPTS || now - failure.since >= CMS_STUCK_MS) ? failure : null;
  return { pending, stuck };
}

/** Re-read on every sync event, and once a second while anything is pending —
 *  the 60 s threshold passes with no event to announce it. */
function useCmsSync(): [CmsSyncState, () => void] {
  const [state, setState] = React.useState<CmsSyncState>(() => readCmsSync(Date.now()));
  const refresh = React.useCallback(() => setState(readCmsSync(Date.now())), []);
  React.useEffect(() => onCmsSyncError(refresh), [refresh]);
  React.useEffect(() => {
    if (!state.pending) return undefined;
    const t = window.setInterval(refresh, 1000);
    return () => window.clearInterval(t);
  }, [state.pending, refresh]);
  return [state, refresh];
}

/* ── Zoom: fit beside the tray, give it back on close ────────────────────── */

/**
 * On open, ask the canvas to fit the authored width into the narrowed column
 * (width only, never zooming in). On close, put the user's zoom back — unless
 * they changed it while the tray was open, which is a choice to keep.
 */
function useFitWhileOpen(composer: Composer | null): void {
  React.useEffect(() => {
    if (!composer) return undefined;
    let before: number | null = null;
    let fitted: number | null = null;
    const frame = window.requestAnimationFrame(() => {
      before = composer.getState().zoom;
      composer.emit(EVENTS.ZOOM_FIT, { widthOnly: true });
      fitted = composer.getState().zoom;
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (before === null || fitted === null || fitted === before) return;
      if (composer.getState().zoom === fitted) composer.setZoom(before);
    };
  }, [composer]);
}

/* ── Issue rows — click selects, the tray stays open ─────────────────────── */

/** Land on what the issue names: its element (page first — the registry is
 *  site-wide), else the pane that fixes a server check, else the first
 *  element using its token. Nothing here closes the tray. */
function locateIssue(composer: Composer, issue: Issue): void {
  if (issue.elementId && locateComment(composer, { pageId: issue.pageId ?? null, targetSelector: issue.elementId }) === "located") return;
  if (issue.id.startsWith(PUBLISH_CHECK_ISSUE) && openPublishCheckFix(composer, issue.id.slice(PUBLISH_CHECK_ISSUE.length))) return;
  const refs = issue.tokenId ? composer.designSystem.tokenUsage.getBreakdown(issue.tokenId) : [];
  const target = refs.map((r) => composer.elements.getElement(r.elementId)).find((el) => el != null);
  if (target) composer.selection.select(target);
}

const ISSUE_ROW =
  "tw:flex tw:w-full tw:items-start tw:gap-2 tw:py-[13px] tw:text-left tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";

/* ── Layout constants (board 499:2656) ───────────────────────────────────── */

const HEAD = "tw:m-0 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]";
const SECTION = "tw:flex tw:flex-col tw:gap-1.5 tw:px-3 tw:pt-3.5";
const META = "tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const BODY = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const LINK_BTN =
  "tw:h-8 tw:w-auto tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent)] tw:hover:bg-transparent tw:hover:underline";
/** Fix › at the row's text size (board B8-PB01: 13, accent). */
const FIX_DOOR = "tw:flex-none tw:h-5 tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent)]";

const SIMULATED_HOST = ".dev-simulated.invalid";

/** Board B8-PB01: "Published 2 days ago". */
function ago(at: string | Date | null): string {
  if (!at) return "";
  const ts = new Date(at).getTime();
  return Number.isFinite(ts) ? formatRelativeTime(ts, { fallback: "days", justNowLabel: "just now" }) : "";
}

/* ── The review round, for the Approval section ─────────────────────────── */

/** The current round, read once per open and again when the gate moves —
 *  B8-PB01 prints who approved and when; PB15 how many comments came back. */
function useCurrentRound(gate: NextMove["gate"] | null): CurrentRound | null {
  const [round, setRound] = React.useState<CurrentRound | null>(null);
  React.useEffect(() => {
    let alive = true;
    fetchCurrentRound()
      .then((r) => alive && setRound(r && !r.revoked ? r : null))
      .catch(() => alive && setRound(null));
    return () => {
      alive = false;
    };
  }, [gate]);
  return round;
}

const reviewerOf = (round: CurrentRound | null): string => round?.reviewerName ?? round?.invitedEmail ?? "Your client";

const shortDate = (at: string | Date | null): string =>
  at ? new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "";

/* ── The tray ────────────────────────────────────────────────────────────── */

export const PublishTray: React.FC<PublishTrayProps> = ({ composer, publishJob, nextMove, onRequestPublish, issues }) => {
  const close = React.useCallback(() => publishTray.close(), []);
  const trapRef = useFocusTrap(true, close);
  useFitWhileOpen(composer);

  const siteId = React.useMemo(() => getSiteIdFromUrl(), []);
  const siteName = composer?.getProjectMetadata?.()?.name || "This site";
  const publishedUrl = publishJob?.publishedUrl ?? null;
  const uiState = publishJob?.uiState;
  const snapshot = usePublishSnapshot(composer, siteId, publishedUrl, uiState);
  const { checkState, checks: allChecks, reload } = usePrePublishChecks(siteId, uiState);
  const checks = React.useMemo(
    () => (allChecks ? { ...allChecks, checks: allChecks.checks.filter((c) => !SERVER_CONTENT_LABELS.has(c.label)) } : null),
    [allChecks],
  );
  const [cms, refreshCms] = useCmsSync();
  /* A-33: what a publish now would change, against the live version. */
  const preview = usePublishPreviewDiff(composer, siteId, uiState !== "publishing", uiState);
  const round = useCurrentRound(nextMove?.gate ?? null);

  const vercelMissing = (checks?.checks ?? []).some((c) => c.label === VERCEL_CHECK_LABEL && c.status === "fail");
  const failing = (label: string) => (checks?.checks ?? []).find((c) => c.label === label && c.status === "fail") ?? null;
  const planLimit = failing(PLAN_LIMIT_CHECK_LABEL)?.detail ?? null;
  const passwordRow = failing(PASSWORD_CHECK_LABEL);
  const cta = trayCta({
    nextMove,
    publishJob,
    wired: !!onRequestPublish,
    checkState,
    vercelMissing,
    planLimit,
    cms,
    live: !!publishJob?.publishedUrl,
  });

  /* Idempotent Try again / Check status: a second press while the first is in
     flight does nothing. The latch clears when the job moves on — or after
     RETRY_LATCH_MS when nothing happened (the publish confirm was cancelled,
     or the re-poll failed again), so the button never stays dead. */
  const [retried, setRetried] = React.useState(false);
  React.useEffect(() => setRetried(false), [uiState, publishJob?.jobId]);
  React.useEffect(() => {
    if (!retried) return undefined;
    const t = window.setTimeout(() => setRetried(false), RETRY_LATCH_MS);
    return () => window.clearTimeout(t);
  }, [retried]);

  const onCta = () => {
    if (cta.kind === "publish") onRequestPublish?.();
    else if (cta.kind === "connect") window.open(`${DASHBOARD_URL}/dashboard/settings/integrations`, "_blank", "noopener");
    else if (cta.kind === "check-status" && publishJob?.jobId) {
      setRetried(true);
      publishJob.track(publishJob.jobId);
    } else if (cta.kind === "retry") {
      setRetried(true);
      onRequestPublish?.();
    }
  };
  const ctaDisabled = cta.kind === "shut" || ((cta.kind === "retry" || cta.kind === "check-status") && retried);

  const domain = domainOf(publishedUrl) ?? snapshot.production.value;
  const simulated = Boolean(publishedUrl?.includes(SIMULATED_HOST));
  const isLive = !!publishedUrl;
  const justPublished = publishJob?.jobId != null && uiState === "published";
  const running = uiState === "publishing";
  const failed = uiState === "failed" && !!publishJob?.error;
  /* PB07–PB14: a run or its outcome replaces the checks and the footer CTA. */
  const outcome = running || failed || (justPublished && !!publishedUrl);

  /* Issue rows: the content and Brand findings. The server's own rows come
     from the checks list, so `publish-check:` issues are not listed twice. */
  const siteIssues = issues.filter((i) => i.type !== "info" && !i.id.startsWith(PUBLISH_CHECK_ISSUE));
  const serverRows =
    checkState === "ready" ? (checks?.checks ?? []).filter((c) => c.status !== "pass" && c.label !== PASSWORD_CHECK_LABEL) : [];
  /* Blockers first (board B8-PB01), then the advice; the count is every row listed. */
  const rows = [
    ...serverRows.map((c) => ({
      key: c.label,
      kind: "check",
      blocking: c.status === "fail",
      message: c.detail,
      fix: c.label === VERCEL_CHECK_LABEL ? null : () => openPublishCheckFix(composer, c.label),
    })),
    ...siteIssues.map((i) => ({
      key: i.id,
      kind: "issue",
      blocking: i.type === "error",
      message: i.message,
      fix: composer ? () => locateIssue(composer, i) : undefined,
    })),
  ].sort((a, b) => Number(b.blocking) - Number(a.blocking));
  const blockingCount = rows.filter((r) => r.blocking).length + (passwordRow ? 1 : 0);
  const tipCount = rows.filter((r) => !r.blocking).length;
  const summary = [blockingCount ? `${blockingCount} blocking` : "", tipCount ? `${tipCount} tip${tipCount === 1 ? "" : "s"}` : ""]
    .filter(Boolean)
    .join(" · ");

  /* B8-PB20: a workspace that cannot publish shows only the site's status;
     B8-PB19/PB21: a viewer or a lost connection see what would change, but
     no checks and no destination — none of it is theirs to act on now.
     B8-PB15: a round that came back with changes is the one thing to read. */
  const refusal = !onRequestPublish ? PUBLISH_REFUSAL.off : nextMove?.blockedReason ?? null;
  const statusOnly = refusal === PUBLISH_REFUSAL.off;
  const changesRequested = nextMove?.gate === "changes-requested";
  const noChecks =
    statusOnly ||
    changesRequested ||
    planLimit !== null ||
    refusal === PUBLISH_REFUSAL.viewer ||
    refusal === PUBLISH_REFUSAL.offline;
  const loadingChecks = checkState === "loading" && !outcome && !noChecks;
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [logOpen, setLogOpen] = React.useState(false);

  const openReview = () => composer?.emit(EVENTS.UI_SWITCH_TAB, { tab: "review" });
  const last = snapshot.lastDeploy;
  const prev = snapshot.previousDeploy;
  const seeWhatChanged =
    justPublished && last && prev && last.rollbackable && prev.rollbackable
      ? () =>
          composer?.emit(EVENTS.UI_COMPARE_OPEN, {
            left: { kind: "published", jobId: prev.id, version: prev.version },
            right: { kind: "published", jobId: last.id, version: last.version },
            from: "Publish",
          })
      : undefined;
  const approvalLine =
    round?.status?.toLowerCase() === "approved"
      ? `✓ Approved by ${reviewerOf(round)}${round.resolvedAt ? ` · ${shortDate(round.resolvedAt)}` : ""}`
      : nextMove && (nextMove.gate === "waiting" || nextMove.gate === "unchecked")
        ? nextMove.gateReason
        : null;

  return (
    <div
      ref={trapRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-tray-title"
      id="publish-tray"
      data-testid="publish-tray"
      className="tw:flex tw:h-full tw:w-full tw:flex-col tw:border-l tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]"
    >
      {/* Task header — 48 tall: title over "{site} · whole site", then ✕. */}
      <div className="tw:flex tw:h-12 tw:flex-none tw:items-center tw:gap-1 tw:border-b tw:border-[var(--bk-border)] tw:pl-3 tw:pr-2">
        <div className="tw:min-w-0 tw:flex-1">
          <h2 id="publish-tray-title" className="tw:m-0 tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]">
            Publish
          </h2>
          <p className={`${META} tw:truncate`}>{siteName} · whole site</p>
        </div>
        {/* B8-PB*: ⋯ before ✕ — publish history lives here (code-ahead, kept). */}
        <Popover
          open={moreOpen}
          onClose={() => setMoreOpen(false)}
          placement="bottom-end"
          label="More publish actions"
          trigger={
            <Button
              color="light"
              size="xs"
              aria-label="More publish actions"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              className="tw:size-8 tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[var(--bk-ink-soft)]"
              data-testid="publish-tray-more"
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </Button>
          }
        >
          <Menu label="More publish actions">
            <MenuItem
              onClick={() => {
                setMoreOpen(false);
                composer?.emit(EVENTS.UI_SWITCH_TAB, { tab: "history" });
                close();
              }}
              data-testid="publish-tray-history"
            >
              Publish history
            </MenuItem>
          </Menu>
        </Popover>
        <Button
          color="light"
          size="xs"
          aria-label="Close publish"
          onClick={close}
          className="tw:size-8 tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[var(--bk-ink-soft)]"
          data-testid="publish-tray-close"
        >
          <X size={16} aria-hidden="true" />
        </Button>
      </div>

      {loadingChecks ? (
        <div className="tw:min-h-0 tw:flex-1">
          <TraySkeleton />
        </div>
      ) : (
      <div className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:pb-3">
        {/* PB14: said first, before the card, so nothing below reads as live. */}
        {simulated ? (
          <OutcomeNote tone="neutral" testId="publish-tray-simulated">Simulation mode — nothing is deployed</OutcomeNote>
        ) : null}

        {/* Status card — on top in every state, the run's included (PB07). */}
        <section
          className="tw:m-3 tw:mb-0 tw:rounded-[var(--bk-radius-lg)] tw:bg-[var(--bk-bg-subtle)] tw:p-3"
          aria-label="Site status"
          data-testid="publish-tray-status"
        >
          {publishedUrl ? (
            <>
              <p className={BODY}>
                <span aria-hidden="true">● </span>Live · {domain ?? publishedUrl}
              </p>
              {last ? (
                <p className={`${META} tw:mt-1`}>
                  Published {ago(last.rawAt)} · v{last.version}
                </p>
              ) : null}
              <LiveLinks url={publishedUrl} />
            </>
          ) : (
            <>
              <p className={BODY}>
                <span aria-hidden="true">○ </span>Not live yet
              </p>
              <p className={`${META} tw:mt-1`}>
                The first publish puts this site on {domain ?? "its Vercel address"}.
              </p>
            </>
          )}
        </section>

        {running ? <RunSection steps={publishJob?.steps ?? null} startedAt={publishJob?.startedAt ?? null} /> : null}

        {failed && publishJob ? (
          publishJob.pollLost ? (
            <OutcomeNote
              tone="warning"
              role="alert"
              testId="publish-tray-failed"
              actions={<OutcomeButton cta={cta} disabled={ctaDisabled} onClick={onCta} />}
            >
              We lost track of this publish. It may still finish. Nothing is shown as failed until the server says so.
            </OutcomeNote>
          ) : (
            <>
              <OutcomeNote
                tone="error"
                role="alert"
                testId="publish-tray-failed"
                actions={
                  <>
                    <OutcomeButton cta={cta} disabled={ctaDisabled} onClick={onCta} />
                    <Button
                      color="light"
                      size="xs"
                      className={LINK_BTN}
                      aria-expanded={logOpen}
                      onClick={() => setLogOpen((v) => !v)}
                      data-testid="publish-tray-view-log"
                    >
                      View log
                    </Button>
                  </>
                }
              >
                Publish failed — {publishJob.error}
                {isLive ? (last ? ` The live site still shows v${last.version}.` : " The live site is unchanged.") : " Nothing went live."}
              </OutcomeNote>
              {logOpen ? (
                <FailedLog steps={publishJob.steps} jobId={publishJob.jobId} deploymentId={publishJob.deploymentId} />
              ) : null}
            </>
          )
        ) : null}

        {justPublished && publishedUrl ? (
          simulated ? (
            <OutcomeNote tone="neutral" role="status" testId="publish-tray-published">
              Simulated publish — nothing went live.
            </OutcomeNote>
          ) : (
            <OutcomeNote
              tone="success"
              role="status"
              testId="publish-tray-published"
              actions={<PublishedActions url={publishedUrl} onSeeWhatChanged={seeWhatChanged} />}
            >
              Your changes are live on {domain ?? publishedUrl}.{last ? ` v${last.version} is live.` : ""}
            </OutcomeNote>
          )
        ) : null}

        {cms.stuck ? (
          <section className={SECTION} aria-label="CMS sync" data-testid="publish-tray-cms-stuck">
            <p className={`${BODY} tw:text-[var(--bk-error-text)]`} role="alert">
              CMS changes couldn&apos;t sync: {cms.stuck.reason}
            </p>
            <div className="tw:flex tw:gap-4">
              <Button
                color="light"
                size="xs"
                className={LINK_BTN}
                onClick={() => void retryCmsSync().then(refreshCms)}
              >
                Retry sync
              </Button>
              {cms.stuck.open ? (
                <Button
                  color="light"
                  size="xs"
                  className={LINK_BTN}
                  onClick={() => {
                    composer?.emit(EVENTS.UI_CMS_OPEN, cms.stuck?.open);
                    close();
                  }}
                >
                  Open CMS ›
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}

        {outcome || statusOnly ? null : (
          <>
            {/* PB15: the round came back — what the client asked, and the way to it. */}
            {changesRequested ? (
              <OutcomeNote
                tone="warning"
                testId="publish-tray-changes-requested"
                actions={
                  <Button color="light" size="xs" className={LINK_BTN} onClick={openReview}>
                    Open Review ›
                  </Button>
                }
              >
                {reviewerOf(round)} requested changes
                {round?.openCommentCount ? ` on ${round.openCommentCount} comment${round.openCommentCount === 1 ? "" : "s"}` : ""}.
                {" "}Publishing waits for a fresh approval.
              </OutcomeNote>
            ) : null}

            <ChangesSection
              preview={nextMove === null ? null : preview}
              fallback={
                nextMove === null
                  ? "No unpublished changes"
                  : isLive
                    ? "Changes since the last publish"
                    : "First publish — every page goes live"
              }
              pageNames={nextMove !== null ? snapshot.pageNames : []}
              onSeeAll={
                last && preview?.diff.retained
                  ? () =>
                      composer?.emit(EVENTS.UI_COMPARE_OPEN, {
                        left: { kind: "published", jobId: last.id, version: last.version },
                        right: { kind: "current" },
                        from: "Publish",
                      })
                  : undefined
              }
            />

            {noChecks ? null : (
            <>
            <section className={SECTION} aria-label="Checks">
              <div className="tw:flex tw:items-baseline tw:justify-between">
                <h3 className={HEAD}>Checks</h3>
                {summary ? <span className={META}>{summary}</span> : null}
              </div>
              <div data-testid="publish-checks">
                {checkState === "error" ? (
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-2 tw:text-[12px]" role="alert">
                    <span className="tw:text-[var(--bk-error-text)]">Couldn&apos;t load the readiness checks.</span>
                    <Button color="light" size="xs" onClick={() => void reload()}>
                      Retry
                    </Button>
                  </div>
                ) : null}
                {passwordRow ? (
                  <PasswordCheckCard
                    detail={passwordRow.detail}
                    domain={domain}
                    onUpgrade={() => window.open(`${DASHBOARD_URL}/dashboard/settings/billing`, "_blank", "noopener")}
                    onRemoveAndPublish={async () => {
                      if (!siteId) throw new Error("no site");
                      await updateSiteColumns(siteId, { publishedPassword: null });
                      await reload();
                      onRequestPublish?.();
                    }}
                  />
                ) : null}
                {rows.map((r) => (
                  <TrayRow
                    key={r.key}
                    blocking={r.blocking}
                    message={r.message}
                    testId={`publish-${r.kind === "issue" ? "tray-issue" : "check"}-${r.blocking ? "fail" : "warning"}`}
                    fix={r.fix}
                  />
                ))}
                {rows.length > 0 ? (
                  <p className={`${META} tw:mt-1`} data-testid="publish-checks-legend">
                    Red blocks publishing · amber is advisory
                  </p>
                ) : checkState === "ready" && !passwordRow ? (
                  <p className={`${BODY} tw:py-1`}>Nothing to fix</p>
                ) : null}
              </div>
            </section>

            {approvalLine ? (
              <section className={SECTION} aria-label="Approval" data-testid="publish-tray-approval">
                <h3 className={HEAD}>Approval</h3>
                <p className={BODY}>{approvalLine}</p>
                <div>
                  <Button
                    color="light"
                    size="xs"
                    className={LINK_BTN}
                    onClick={() =>
                      nextMove?.gate === "unchecked" ? composer?.emit(EVENTS.REVIEW_STATUS_RETRY, undefined) : openReview()
                    }
                  >
                    {nextMove?.gate === "unchecked" ? "Retry ›" : "Open Review ›"}
                  </Button>
                </div>
              </section>
            ) : null}

            {/* B8-PB16: the password card is the whole question; no destination. */}
            {passwordRow ? null : (
            <section className={SECTION} aria-label="Goes to">
              <h3 className={HEAD}>Goes to</h3>
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                <span className={`${BODY} tw:truncate`}>{domain ?? "Its Vercel address"}</span>
                <Button
                  color="light"
                  size="xs"
                  className={LINK_BTN}
                  disabled={!composer}
                  onClick={() => composer?.emit(EVENTS.UI_SETTINGS_OPEN, { screen: "domains" })}
                >
                  Manage domains ›
                </Button>
              </div>
            </section>
            )}
            </>
            )}
          </>
        )}
      </div>
      )}

      {/* Task footer. A run has no CTA: before the worker picks the job up it
          can still be cancelled (PB08), after that it cannot (PB07). An
          outcome's button sits with its sentence; the footer is empty. */}
      {running ? (
        <div className="tw:flex-none tw:border-t tw:border-[var(--bk-border)] tw:p-3" data-testid="publish-tray-run-footer">
          {runSteps(publishJob?.steps).every((s) => s.status === "pending") ? (
            <Button color="light" size="sm" className="tw:h-8 tw:w-full" onClick={() => void publishJob?.cancel()}>
              Cancel (not started)
            </Button>
          ) : (
            <p className={META}>Publishing can&apos;t be stopped once deploying. You can keep working or leave.</p>
          )}
        </div>
      ) : outcome ? (
        <div className="tw:h-3.5 tw:flex-none tw:border-t tw:border-[var(--bk-border)]" />
      ) : (
      <div className="tw:flex-none tw:border-t tw:border-[var(--bk-border)] tw:px-3 tw:pb-3 tw:pt-3">
        <Button
          variant={ctaDisabled ? "secondary" : "primary"}
          size="sm"
          className="tw:h-8 tw:w-full"
          disabled={ctaDisabled}
          onClick={onCta}
          aria-describedby={cta.kind === "shut" && cta.reason ? "publish-tray-reason" : undefined}
          data-testid="publish-tray-cta"
        >
          {cta.label}
        </Button>
        {cta.kind === "shut" && cta.reason ? (
          <p id="publish-tray-reason" className={`${META} tw:mt-1`} data-testid="publish-tray-reason">
            {cta.reason}
          </p>
        ) : null}
        {/* B8-PB*: the legal pages under the CTA. */}
        <div className="tw:mt-3 tw:flex tw:gap-4" data-testid="publish-tray-legal">
          <a href={`${DASHBOARD_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="tw:text-[13px] tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline">
            Privacy policy
          </a>
          <a href={`${DASHBOARD_URL}/terms`} target="_blank" rel="noopener noreferrer" className="tw:text-[13px] tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline">
            Terms of service
          </a>
        </div>
      </div>
      )}
    </div>
  );
};

/** PB10 Try again / PB12 Check status — the outcome's own outlined button,
 *  still the one CTA (idempotent, latched). */
const OutcomeButton: React.FC<{ cta: Cta; disabled: boolean; onClick: () => void }> = ({ cta, disabled, onClick }) => (
  <Button color="light" size="xs" className={OUTCOME_BTN} disabled={disabled} onClick={onClick} data-testid="publish-tray-cta">
    {cta.label}
  </Button>
);

/** B8-PB01/PB02 check row: the glyph (red ✕ blocks, amber ! advises), the
 *  sentence wrapping at 13, Fix › at the far end. */
const TrayRow: React.FC<{ blocking: boolean; message: string; testId: string; fix?: (() => void) | null }> = ({
  blocking,
  message,
  testId,
  fix,
}) => (
  <div className={ISSUE_ROW} data-testid={testId}>
    <span
      className={`tw:mt-px tw:inline-flex tw:w-3 tw:flex-none tw:justify-center tw:text-[13px] tw:font-semibold ${
        blocking ? "tw:text-[var(--bk-error)]" : "tw:text-[var(--bk-warning)]"
      }`}
    >
      <span aria-hidden="true">{blocking ? "✕" : "!"}</span>
      <span className="tw:sr-only">{blocking ? "blocking" : "warning"}</span>
    </span>
    <span className="tw:min-w-0 tw:flex-1">{message}</span>
    {fix === null ? null : (
      <Button
        color="light"
        size="xs"
        className={FIX_DOOR}
        disabled={!fix}
        aria-label={`Fix: ${message}`}
        onClick={() => fix?.()}
      >
        Fix ›
      </Button>
    )}
  </div>
);

/** "View live ↗" and "Copy link" — the status card's two doors. */
const LiveLinks: React.FC<{ url: string }> = ({ url }) => (
  <div className="tw:mt-2 tw:flex tw:items-center tw:gap-4">
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="tw:text-[13px] tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline"
      data-testid="publish-tray-view-live"
    >
      View live ↗
    </a>
    <CopyButton content={url} label="Copy link" variant="ghost" />
  </div>
);

export default PublishTray;
