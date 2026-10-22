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
import { Button, CopyButton, Progress, useFocusTrap } from "@/editor/chrome-ui";
import { X } from "lucide-react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import {
  cmsSyncBlocker,
  cmsSyncFailure,
  onCmsSyncError,
  retryCmsSync,
  type CmsSyncFailure,
} from "@/services/cmsSync";
import { VERCEL_CHECK_LABEL } from "@buildrik/shared/schemas/publish";
import { CONTENT_CHECK_LABELS } from "@buildrik/shared/content/contentIssues";
import { locateComment } from "@/editor/sidebar/tabs/review/locate";
import { CHECK_DOOR, CheckIcon, PrePublishChecks } from "@/editor/sidebar/tabs/publish/PrePublishChecks";
import { ApprovalCheckRow } from "@/editor/sidebar/tabs/publish/PublishGateBanner";
import { openPublishCheckFix } from "@/editor/sidebar/tabs/publish/PublishTab";
import { usePrePublishChecks } from "@/editor/sidebar/tabs/publish/usePrePublishChecks";
import { domainOf, usePublishSnapshot } from "@/editor/sidebar/tabs/publish/usePublishSnapshot";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import { PUBLISH_CHECK_ISSUE } from "./hooks/useIssuesFeed";
import type { UsePublishJobResult } from "./hooks/usePublishJob";
import type { Issue } from "./hooks/useStudioState";
import type { NextMove } from "./lifecycle";
import { publishTray } from "./publishTrayStore";

/* The server's content rows ("Image alt text", "Links") run the same shared
   detector the issue scanner runs per element — the tray lists the per-element
   rows (each one selectable), so the server's summary of them would count
   every fact twice. Same rule as useIssuesFeed. */
const SERVER_CONTENT_LABELS = new Set<string>(Object.values(CONTENT_CHECK_LABELS));

/** Task 1.7: a CMS write is "stuck" — not merely pending — after this many
 *  failed attempts or this long failing. */
const CMS_STUCK_ATTEMPTS = 5;
const CMS_STUCK_MS = 60_000;

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

interface CmsSyncState {
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
  "tw:flex tw:w-full tw:items-start tw:gap-2 tw:py-2 tw:text-left tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";

const IssueRow: React.FC<{ issue: Issue; composer: Composer | null }> = ({ issue, composer }) => (
  <div className={ISSUE_ROW} data-testid={`publish-tray-issue-${issue.type === "error" ? "fail" : "warning"}`}>
    <span className="tw:mt-0.5">
      <CheckIcon status={issue.type === "error" ? "fail" : "warning"} />
    </span>
    <span className="tw:min-w-0 tw:flex-1">{issue.message}</span>
    <Button
      color="light"
      size="xs"
      className={CHECK_DOOR}
      disabled={!composer}
      aria-label={`Fix: ${issue.message}`}
      onClick={() => composer && locateIssue(composer, issue)}
    >
      Fix ›
    </Button>
  </div>
);

/* ── The one CTA ─────────────────────────────────────────────────────────── */

type Cta =
  | { kind: "publish"; label: string }
  | { kind: "retry"; label: string }
  | { kind: "check-status"; label: string }
  | { kind: "connect"; label: string }
  | { kind: "shut"; label: string; reason: string | null };

interface CtaInput {
  nextMove: NextMove | null;
  publishJob?: UsePublishJobResult;
  wired: boolean;
  checkState: "loading" | "ready" | "error";
  vercelMissing: boolean;
  cms: CmsSyncState;
}

/** In priority order: what is running or has just failed speaks first, then
 *  what stops a new publish, then the door itself. */
function trayCta({ nextMove, publishJob, wired, checkState, vercelMissing, cms }: CtaInput): Cta {
  const label = nextMove?.kind === "publish" ? nextMove.label : "Publish";
  const ui = publishJob?.uiState;
  if (ui === "publishing") return { kind: "shut", label: "Publishing…", reason: null };
  if (ui === "failed" && publishJob?.pollLost && publishJob.jobId) return { kind: "check-status", label: "Check status" };
  if (ui === "failed" && publishJob?.error) return { kind: "retry", label: "Try again" };
  if (!wired) {
    return { kind: "shut", label, reason: nextMove?.blockedReason ?? "Publishing isn't switched on for this workspace yet" };
  }
  if (cms.stuck) return { kind: "shut", label, reason: `CMS changes couldn't sync: ${cms.stuck.reason}` };
  if (cms.pending) return { kind: "shut", label, reason: "Saving CMS changes…" };
  if (nextMove === null) return { kind: "shut", label: "Up to date", reason: null };
  if (vercelMissing) return { kind: "connect", label: "Connect Vercel" };
  if (checkState === "loading") return { kind: "shut", label, reason: "Checking…" };
  if (nextMove.kind !== "publish") return { kind: "shut", label, reason: nextMove.gateReason ?? nextMove.blockedReason };
  if (nextMove.blockedReason) return { kind: "shut", label, reason: nextMove.blockedReason };
  return { kind: "publish", label };
}

/* ── Layout constants (board 499:2656) ───────────────────────────────────── */

const HEAD = "tw:m-0 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]";
const SECTION = "tw:flex tw:flex-col tw:gap-1.5 tw:px-3 tw:pt-3.5";
const META = "tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const BODY = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const LINK_BTN =
  "tw:h-8 tw:w-auto tw:border-transparent tw:bg-transparent tw:px-0 tw:text-[13px] tw:font-normal tw:text-[var(--bk-accent)] tw:hover:bg-transparent tw:hover:underline";
const ID = "tw:font-[family-name:var(--bk-font-mono)] tw:tabular-nums tw:text-[11px] tw:text-[var(--bk-ink-soft)]";

const SIMULATED_HOST = ".dev-simulated.invalid";

/** Board B8-PB01: "Published 2 days ago". */
function ago(at: string | Date | null): string {
  if (!at) return "";
  const ts = new Date(at).getTime();
  return Number.isFinite(ts) ? formatRelativeTime(ts, { fallback: "days", justNowLabel: "just now" }) : "";
}

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

  const vercelMissing = (checks?.checks ?? []).some((c) => c.label === VERCEL_CHECK_LABEL && c.status === "fail");
  const cta = trayCta({ nextMove, publishJob, wired: !!onRequestPublish, checkState, vercelMissing, cms });

  /* Idempotent Try again / Check status: one press per failure. The latch
     clears when the job moves on, so the next failure can be retried. */
  const [retried, setRetried] = React.useState(false);
  React.useEffect(() => setRetried(false), [uiState, publishJob?.jobId]);

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

  /* Issue rows: the content and Brand findings. The server's own rows come
     from PrePublishChecks, so `publish-check:` issues are not listed twice. */
  const siteIssues = issues.filter((i) => i.type !== "info" && !i.id.startsWith(PUBLISH_CHECK_ISSUE));
  const blockingCount = issues.filter((i) => i.type === "error").length;
  const tipCount = issues.filter((i) => i.type === "warning").length;
  const summary = [blockingCount ? `${blockingCount} blocking` : "", tipCount ? `${tipCount} tip${tipCount === 1 ? "" : "s"}` : ""]
    .filter(Boolean)
    .join(" · ");

  const renderFix = (label: string): React.ReactNode =>
    label === VERCEL_CHECK_LABEL ? null : (
      <Button color="light" size="xs" className={CHECK_DOOR} onClick={() => openPublishCheckFix(composer, label)}>
        Fix ›
      </Button>
    );

  const running = uiState === "publishing";
  const runningStep = (() => {
    const steps = publishJob?.steps;
    if (!running || !steps?.length) return null;
    const i = steps.findIndex((s) => s.status === "running");
    return i < 0 ? null : { name: steps[i].name, index: i + 1, total: steps.length };
  })();

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

      <div className="tw:min-h-0 tw:flex-1 tw:overflow-y-auto tw:pb-3">
        {simulated ? (
          <p className="tw:m-3 tw:mb-0 tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-warning-tint)] tw:px-3 tw:py-2 tw:text-[12px] tw:text-[var(--bk-warning-text)]">
            Simulation mode — nothing is deployed
          </p>
        ) : null}

        {/* Status card */}
        <section
          className="tw:m-3 tw:mb-0 tw:rounded-[var(--bk-radius-lg)] tw:bg-[var(--bk-bg-subtle)] tw:p-3"
          aria-label="Site status"
          data-testid="publish-tray-status"
        >
          {running ? (
            <>
              <p className={BODY} role="status">
                Publishing{domain ? ` to ${domain}` : ""}…
              </p>
              <p className={`${META} tw:mt-1`}>
                {runningStep
                  ? `Step ${runningStep.index} of ${runningStep.total} · ${runningStep.name}`
                  : `${Math.round(publishJob?.progress ?? 0)}%`}
              </p>
              <Progress progress={Math.round(publishJob?.progress ?? 0)} size="sm" className="tw:mt-2" />
              <p className={`${META} tw:mt-2`}>Closing this tray does not cancel the publish.</p>
            </>
          ) : uiState === "failed" && publishJob?.error ? (
            <div role="alert" data-testid="publish-tray-failed">
              {publishJob.pollLost ? (
                <p className={BODY}>
                  We lost track of this publish. It may still finish. Nothing is shown as failed until the server says so.
                </p>
              ) : (
                <p className={`${BODY} tw:text-[var(--bk-error-text)]`}>
                  Publish failed — {publishJob.error}
                  {isLive ? " The live site is unchanged." : " Nothing went live."}
                </p>
              )}
              <dl className="tw:m-0 tw:mt-2 tw:grid tw:grid-cols-[auto_1fr] tw:gap-x-2 tw:gap-y-0.5">
                {publishJob.jobId ? (
                  <>
                    <dt className={META}>Job</dt>
                    <dd className={`tw:m-0 ${ID}`} data-testid="publish-tray-job-id">{publishJob.jobId}</dd>
                  </>
                ) : null}
                {publishJob.deploymentId ? (
                  <>
                    <dt className={META}>Deployment</dt>
                    <dd className={`tw:m-0 ${ID}`} data-testid="publish-tray-deployment-id">{publishJob.deploymentId}</dd>
                  </>
                ) : null}
              </dl>
            </div>
          ) : justPublished && publishedUrl ? (
            <>
              <p className={`${BODY} tw:text-[var(--bk-success-text)]`} role="status">
                {simulated ? "Simulated publish — nothing went live." : `Your changes are live on ${domain ?? publishedUrl}.`}
              </p>
              <LiveLinks url={publishedUrl} />
            </>
          ) : isLive ? (
            <>
              <p className={BODY}>
                <span aria-hidden="true">● </span>Live · {domain ?? publishedUrl}
              </p>
              {snapshot.lastDeploy ? (
                <p className={`${META} tw:mt-1`}>
                  Published {ago(snapshot.lastDeploy.rawAt)} · v{snapshot.lastDeploy.version}
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

        {running ? null : (
          <>
            <section className={SECTION} aria-label="What will change">
              <h3 className={HEAD}>What will change</h3>
              <p className={BODY} data-testid="publish-tray-changes">
                {nextMove === null
                  ? "No unpublished changes"
                  : isLive
                    ? "Changes since the last publish"
                    : "First publish — every page goes live"}
              </p>
              {nextMove !== null && snapshot.pageNames.length > 0 ? (
                <p className={META}>{snapshot.pageNames.join(" · ")}</p>
              ) : null}
            </section>

            <section className={SECTION} aria-label="Checks">
              <div className="tw:flex tw:items-baseline tw:justify-between">
                <h3 className={HEAD}>Checks</h3>
                {summary ? <span className={META}>{summary}</span> : null}
              </div>
              <PrePublishChecks
                state={checkState}
                checks={checks}
                onRetry={() => void reload()}
                renderFix={renderFix}
                hidePassing
                legend="Red blocks publishing · amber is advisory"
              >
                <ApprovalCheckRow nextMove={nextMove} composer={composer} />
                {siteIssues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} composer={composer} />
                ))}
              </PrePublishChecks>
            </section>

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
          </>
        )}
      </div>

      {/* Task footer — the ONE CTA, its reason under it. */}
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
      </div>
    </div>
  );
};

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
