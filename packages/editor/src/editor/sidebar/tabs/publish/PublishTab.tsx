/**
 * PublishTab - Publish/deploy management panel
 * Shows publish status, URL, and publish/unpublish actions
 *
 * Follows the same pattern as HistoryTab and DesignSystemTab.
 * Publish API calls are injected from the host app (website) via callbacks.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, Button, Progress, SkeletonBlock, Spinner } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { UsePublishJobResult } from "../../../shell/hooks/usePublishJob";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { fetchPrePublishChecks } from "../../../../services/PublishService";
import { relativeShort, usePublishSnapshot } from "./usePublishSnapshot";
import { PublishWizard } from "./PublishWizard";
import { getSiteIdFromUrl } from "../../../../services/BuildrikSyncProvider";
import {
  VERCEL_CHECK_LABEL,
  type PrePublishChecksResult,
} from "@buildrik/shared/schemas/publish";
// ============================================
// Types
// ============================================

export interface PublishTabProps {
  /** Composer instance */
  composer: Composer | null;
  /** Project ID for publish operations */
  projectId?: string | null;
  /** Panel pin state */
  isExpanded?: boolean;
  /** Pin toggle callback */
  onExpandToggle?: () => void;
  /** Help button callback */
  onHelpClick?: () => void;
  /** Close panel callback */
  onClose?: () => void;
  /**
   * The canonical publish state machine (shared with the Topbar Publish
   * dropdown). The sidebar is a read-only subscriber to its state.
   */
  publishJob?: UsePublishJobResult;
  /**
   * Fire the canonical publish flow (same handler the Topbar uses:
   * export pages → publishSite → poll). Fire-and-poll; state surfaces via
   * publishJob. Toast is owned by the canonical path (useExportHandlers), so
   * the sidebar does not toast.
   */
  onVercelPublish?: () => Promise<void>;
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
 * Settings sub-sections are not addressable today: `ui:switch-tab` takes a tab
 * id only (StudioPanels), so SEO / Domain / Favicon all land on Settings rather
 * than their exact pane.
 */
const FIX_TARGETS: Record<string, { tab: string; label: string }> = {
  "Pages ready": { tab: "pages", label: "Add a page" },
  "SEO configured": { tab: "settings", label: "Fix" },
  "Domain connected": { tab: "settings", label: "Fix" },
  "Empty pages": { tab: "pages", label: "Fix" },
  Favicon: { tab: "settings", label: "Fix" },
};



/** The board's row rhythm: label left, value right, one line. */
const ROW = "tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-[3px]";

/** Board 641:2652's environment row — value on the right, chevron when the
    value is somewhere you can actually go. */
const EnvRow: React.FC<{ label: string; value: string | null; href?: string | null; empty: string }> = ({
  label,
  value,
  href,
  empty,
}) => (
  <div className={ROW}>
    <span className="tw:text-[13px] tw:text-[var(--bk-ink)]">{label}</span>
    {value && href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="tw:min-w-0 tw:truncate tw:text-[12px] tw:text-[var(--bk-accent)] tw:no-underline"
        title={value}
      >
        {value} ›
      </a>
    ) : (
      <span className={`${META} tw:min-w-0 tw:truncate`} title={value ?? empty}>
        {value ?? empty}
      </span>
    )}
  </div>
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
  onVercelPublish,
  publishedUrl: initialUrl,
  isProjectPublished,
}) => {
  // Read-only view of the ONE canonical publish state machine (the same
  // instance the Topbar drives). No second state machine, no second toast.
  const isPublishing = publishJob?.uiState === "publishing";
  const publishedUrl = publishJob?.publishedUrl ?? initialUrl ?? null;
  // Live-state is durable: a deployment serving (publishedUrl) OR the loaded
  // project was published. A failed/cancelled republish (uiState flips away
  // from "published") must NOT make a still-live site read as Draft.
  const isPublished = publishJob?.uiState === "published" || !!publishedUrl || !!isProjectPublished;
  const error = publishJob?.error ?? null;
  // The canonical handler resolves the site from the URL itself (and toasts if
  // it can't), so "publishing is wired" == the handler being present. This
  // matches how the Topbar gates its Publish dropdown on the feature flag.
  const canPublish = !!onVercelPublish;

  const handlePublish = async () => {
    if (!onVercelPublish) return;
    // Fire-and-poll: progress + completion surface via publishJob; the
    // canonical useExportHandlers effect owns the success/failure toast.
    await onVercelPublish();
  };

  // The `projectId` prop is not threaded in unified-editor mode (AquibraStudio
  // never sets it), so resolve the site the same way the canonical publish path
  // does — from the URL. Without this the panel silently had no site: readiness
  // never loaded and the publish-history section below never rendered.
  const siteId = React.useMemo(() => projectId ?? getSiteIdFromUrl(), [projectId]);

  // Board 641:2652's three sections, every field read from what the editor
  // already owns (deploy history, undo stack, page list).
  const snapshot = usePublishSnapshot(composer, siteId, publishedUrl, publishJob?.uiState);
  /* Board 833:4518 / 914:4507: publishing runs through a stepped modal, so the
     panel's CTA opens the gate rather than firing the deploy. */
  const [wizardOpen, setWizardOpen] = React.useState(false);
  /* Board 784:4326 is the just-published panel: the result leads and the
     "what would go out" sections are empty by definition. */
  const justPublished = publishJob?.uiState === "published" && snapshot.changeCount === 0;
  /* Board 784:4403. "View log" is drawn beside Try again; this editor has no
     log destination — the job reports a message, not a build log — so the row
     carries the retry only rather than a link to nowhere. */
  const hasFailed = publishJob?.uiState === "failed" && !!error;
  /* The build log behind board 784:4403's "View log". A pre-job failure never
     reaches the worker, so there are no steps and the link stays away rather
     than opening an empty list. */
  const failedSteps = hasFailed && publishJob?.steps?.length ? publishJob.steps : null;
  const [logOpen, setLogOpen] = React.useState(false);

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
      setChecks(await fetchPrePublishChecks(siteId));
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
  const warnings = React.useMemo(
    () => (checks?.checks ?? []).filter((c) => c.status === "warning"),
    [checks],
  );
  // Only a `fail` blocks. When the checks could not be loaded we do NOT invent a
  // block — the server gate is still authoritative and refuses on its own.
  const blockedByChecks = checkState === "ready" && !!checks && !checks.ready;

  /*
    Board 784:4480 ("Connect Vercel to publish.") is the panel with no publish
    path at all — `onVercelPublish` absent, i.e. publishing not wired.

    It is NOT the panel for "connected account missing". That case has its own
    board, 893:4518, which draws the WIZARD with the Vercel row failed, a
    `Connect` link on the row and a `Connect Vercel` footer CTA — so the
    checklist is what explains the block, reached by pressing the panel's
    normal CTA. A previous pass here routed a failing Vercel check to 784:4480
    instead, which read fine in isolation and made 893:4518 unreachable.
    Two boards, two states; the board decides which.
  */
  const noPublishPath = !canPublish;
  /** Board 893:4518 — the blocker is the connection itself, which the wizard
      answers with Connect rather than Fix. */
  const blockedOnVercel = blocking.some((c) => c.label === VERCEL_CHECK_LABEL);

  /* Board 784:4403's failure block, hoisted to a const because it renders in
     TWO branches: the normal panel, and the no-publish-path panel when the
     publish failed by revoking the connection. One implementation, so the two
     cannot say different things about the same failure. */
  const failureSection = (
          <section className={SECTION} aria-label="Publish failure">
            <h2 className="tw:m-0 tw:text-[15px] tw:font-semibold tw:text-[var(--bk-error-text)]">
              Publish failed.
            </h2>
            <p className={META}>
              {error}
              {error && !/nothing was deployed/i.test(error) ? " Nothing was deployed." : ""}
            </p>
            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-4">
              <Button
                color="light"
                size="xs"
                onClick={() => {
                  publishJob?.reset?.();
                  setWizardOpen(true);
                }}
                className="tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-accent)]"
              >
                Try again
              </Button>
              {/* Board 784:4403 draws "View log" beside "Try again". It was
                  never built because nothing carried a log to the editor —
                  but `getPublishStatus` has always selected the `steps`
                  column and returned it; PublishService simply dropped it in
                  the mapping. (Not the `log` column: that holds the raw page
                  HTML and is deliberately never sent to a client.) So the
                  link is disclosure, not decoration — it names the step that
                  failed and the ones that never ran. */}
              {failedSteps && (
                <Button
                  color="light"
                  size="xs"
                  onClick={() => setLogOpen((v) => !v)}
                  aria-expanded={logOpen}
                  className="tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-accent)]"
                >
                  {logOpen ? "Hide log" : "View log"}
                </Button>
              )}
            </div>
            {failedSteps && logOpen && (
              <ul className="tw:m-0 tw:mt-2 tw:list-none tw:p-0" aria-label="Build log">
                {failedSteps.map((s) => (
                  <li
                    key={s.name}
                    className="tw:flex tw:items-center tw:gap-2 tw:py-0.5 tw:text-[12px] tw:leading-[18px]"
                  >
                    {/* The glyph carries the outcome visually and the sr-only
                        word carries it to a screen reader — the same rule the
                        wizard's check rows follow. */}
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
          </section>
  );

  return (
    /* h-full so the pinned CTA below actually reaches the bottom of the
       drawer: PanelFrame is flex-col but sizes to content, which left the
       button floating mid-panel with white space under it. */
    <PanelFrame className="tw:h-full">
      <PanelFrame.Header
        title="Publish"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      <div className={CONTENT}>
        {/* Board 784:4480 — with no publish path there is nothing to say about
            environments, changes or deploys: the panel states the one fact
            that matters and offers the one action that changes it. */}
        {noPublishPath ? (
          <section className={SECTION}>
            <h2 className="tw:m-0 tw:text-[15px] tw:font-semibold tw:text-[var(--bk-ink)]">
              Connect Vercel to publish.
            </h2>
            <p className="tw:m-0 tw:mt-1 tw:text-[13px] tw:leading-normal tw:text-[var(--bk-ink-muted)]">
              Buildrick deploys into your own Vercel account — we host nothing.
            </p>
          </section>
        ) : (
        <>
        {/* Board 781:4489 — the deploy service is unreachable, so the panel
            can claim nothing about environments or deploys. Both halves of the
            reassurance: nothing went out, and the work is not lost. */}
        {snapshot.error ? (
          <section className={SECTION} aria-label="Deploy service unreachable">
            <h2 className="tw:m-0 tw:text-[15px] tw:font-semibold tw:text-[var(--bk-error-text)]">
              Couldn&apos;t reach the deploy service.
            </h2>
            <p className={META}>Nothing was published. Your work is saved.</p>
            <div className="tw:mt-1">
              <Button
                color="light"
                size="xs"
                onClick={() => snapshot.reload()}
                className="tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-accent)]"
              >
                Try again
              </Button>
            </div>
          </section>
        ) : (
        <>

        {/* Board 784:4403 — a failed publish leads with the failure AND with
            the fact that nothing changed, which is the half a user needs
            first. Same shape as the rollback-failed modal. */}
        {hasFailed && failureSection}

        {/* Board 784:4326 — the moment after a publish: what went out, where
            to see it, and what changed against the version it replaced. */}
        {justPublished && (
          <section className={SECTION} aria-label="Publish result">
            <h2 className="tw:m-0 tw:text-[15px] tw:font-semibold tw:text-[var(--bk-success-text)]">
              Published to production.
            </h2>
            <p className={META}>
              {snapshot.lastDeploy ? `v${snapshot.lastDeploy.version} · live · ` : ""}
              {snapshot.lastDeploy ? relativeShort(snapshot.lastDeploy.rawAt) : "just now"}
            </p>
            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-4">
              {publishedUrl && (
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tw:text-[13px] tw:text-[var(--bk-accent)] tw:no-underline"
                >
                  View live site
                </a>
              )}
              {snapshot.lastDeploy && snapshot.lastDeploy.version > 1 && (
                <Button
                  color="light"
                  size="xs"
                  onClick={() => composer?.emit("ui:switch-tab", { tab: "history" })}
                  className="tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-accent)]"
                >
                  Compare v{snapshot.lastDeploy.version - 1} → v{snapshot.lastDeploy.version}
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Board 784:4250 — while a publish runs, the panel leads with the run
            itself and drops the "what would go out" sections: they describe a
            publish the user has already started. ENVIRONMENT stays, because
            where it is going is still the question being answered.

            The board's meta line reads "Building · step 2 of 4 · started 14s
            ago". This note used to say the job "exposes a percentage and a
            start, not named steps" — true until `steps` was carried through
            PublishService for board 784:4403's log. It names the running step
            rather than the board's generic "Building", because the worker
            knows which one it is and "Optimizing images" answers "what is it
            doing" where a phase word does not. Falls back to the percentage
            when a job carries no steps. */}
        {isPublishing && (
          <section className={SECTION} aria-label="Publish progress">
            <h3 className="tw:m-0 tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">
              Publishing to production…
            </h3>
            <p className={META}>
              {runningStep
                ? `${runningStep.name} · step ${runningStep.index} of ${runningStep.total}`
                : publishJob && publishJob.progress > 0
                  ? `${publishJob.progress}%`
                  : "Starting"}
              {startedAgo ? ` · started ${startedAgo} ago` : ""}
            </p>
            <Progress progress={publishJob?.progress ?? 0} size="sm" />
          </section>
        )}

        {/* Board 641:2652 opens on WHERE it goes, not on a status chip.
            Production carries the live domain; Preview stays listed because an
            environment list that hides it says the site has none. */}
        <section className={SECTION} aria-label="Environment">
          <h3 className={SECTION_TITLE}>Environment</h3>
          {snapshot.loading ? (
            <SkeletonRows widths={["tw:w-32", "tw:w-24"]} />
          ) : (
            <>
              <EnvRow
                label={snapshot.production.label}
                value={snapshot.production.value}
                href={publishedUrl}
                empty="Not published yet"
              />
              <EnvRow label={snapshot.preview.label} value={snapshot.preview.value} empty="None" />
            </>
          )}
        </section>

        {/* Board 641:2652 — what would go out if you published now. The count
            pair is the header; the rows are the changes themselves. Absent
            during a run (board 784:4250 drops it). */}
        {!isPublishing && !justPublished && !hasFailed && (
        <section className={SECTION} aria-label="Since last deploy">
          <div className={ROW}>
            <h3 className={SECTION_TITLE}>Since last deploy</h3>
          </div>
          {snapshot.loading ? (
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
            /*
              Two different facts wore one sentence. With no deploy to measure
              from, "Nothing has changed since the last deploy." is false — and
              it reads as an all-clear two lines above LAST DEPLOY saying "This
              site has never been published." The panel contradicted itself and
              the reassuring half was the wrong one, on the path where a user
              decides whether to publish at all.

              `lastDeploy` is already null in that case, so the discriminator
              needs no new state. The never-published line states what the
              section claims to state — what would go out if you published now.
            */
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

        {/* Board 641:2652 — what is live right now, and therefore what a
            rollback would return to. */}
        {!isPublishing && !justPublished && !hasFailed && (
        <section className={SECTION} aria-label="Last deploy">
          <h3 className={SECTION_TITLE}>Last deploy</h3>
          {snapshot.loading ? (
            <SkeletonRows widths={["tw:w-24"]} />
          ) : snapshot.lastDeploy ? (
            <div className={ROW}>
              <span className="tw:text-[13px] tw:text-[var(--bk-ink)]">
                v{snapshot.lastDeploy.version} · live
              </span>
              <span className={META}>{snapshot.lastDeploy.when}</span>
            </div>
          ) : (
            <p className={META}>This site has never been published.</p>
          )}
        </section>
        )}

        {/* The "Published URL" copy-card is gone. Board 641:2652 and board
            784:4326 both end their content after LAST DEPLOY and draw empty
            space; neither carries it, and ENVIRONMENT › Production already
            names the live domain and links to it. Founder call 2026-08-17. */}

        {/* The pre-publish checklist moved to the wizard's first step
            (board 833:4518). It gated a publish, so it belongs in the flow
            that publishes, not in a panel the user may only be reading. */}

        {/* The encryption reassurance banner and the "Ready to go live?" card
            are not on board 641:2652 and were pure decoration around the CTA —
            removed. The legal line below stays: a compliance disclosure is not
            a visual call. */}

        {/* The rocket card is not on board 641:2652. Its only load-bearing
            sentence — why a blocked publish is blocked — already prints under
            the CTA, so the card was restating the panel back to itself. */}
        {/* The error chip with a dismiss X is gone: board 784:4403 makes the
            failure a first-class state at the top of the panel, not a toast
            hiding under the checklist. */}

        {/* The published-version list and its rollback buttons are gone from
            this panel. Boards 641:2652 and 784:4326 both end after LAST DEPLOY
            and draw empty space below it, and the list has a board of its own —
            History · Published (949:4474) — which SiteMenu's "Publish history"
            already opens. Rendering it here made the panel a second, unboarded
            copy of that destination. Founder call 2026-08-17.

            LAST DEPLOY above still answers "what is live" (v3 · live · date),
            which is what this panel is for; "show me every version and roll
            one back" is the other surface's question. */}
        </>
        )}
        </>
        )}
      </div>

      {/* Board 641:2652 pins the CTA to the bottom of the panel, full width,
          and names the destination rather than the verb: "Publish to
          production", not "Publish Site". Inside the scroll body it drifted
          below the fold as the change list grew — exactly when it is most
          needed. */}
      <div className="tw:flex tw:flex-col tw:gap-2 tw:border-t tw:border-[var(--bk-border)] tw:px-4 tw:py-3">
        <div className="tw:flex tw:flex-col tw:gap-2">
          {noPublishPath ? (
            /* Board 784:4480 puts the CTA here too — the panel body above
               carries the sentence, this is the action. */
            <Button
              onClick={() => window.open(`${DASHBOARD_URL}/dashboard/settings/integrations`, "_blank", "noopener")}
              className="tw:w-full"
            >
              Connect Vercel
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setWizardOpen(true)}
                /* The gate moved into the wizard (board 833:4518), so this
                   button opens it rather than publishing. Disabling it on a
                   blocking check — which is what it used to do — locked the
                   user out of the one screen that says WHY they are blocked.
                   The wizard's "Continue to Confirm" is the dead control now,
                   which is what the board draws. */
                /* Board 784:4326 greys the CTA right after a deploy: with no
                   pending change there is nothing to publish. */
                disabled={isPublishing || justPublished || snapshot.error}
                className="tw:w-full"
              >
                {/* One label, in every state. Board 641:2652 and 784:4326 both name the
                    destination and neither draws an "Update" variant — the
                    publish/update distinction is one the boards deliberately do not
                    make, and the disabled state already says "nothing to send". */}
                {isPublishing ? "Publishing…" : "Publish to production"}
              </Button>
              {blockedByChecks && !isPublishing && (
                <p className="tw:m-0 tw:text-[11px] tw:text-[var(--bk-error)] tw:leading-[1.4]">
                  {blocking.map((c) => c.detail).join(" ")}
                </p>
              )}
              {isPublishing && (
                <p className="tw:m-0 tw:text-[11px] tw:text-gray-500 tw:leading-[1.4]">
                  {isPublished ? "Update" : "Publishing"} in progress — please wait.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      {/* Privacy & Terms footer. The two links are underlined and the sentence
          around them is gray-600: inside a text block, colour alone cannot
          carry "this is a link" (WCAG 1.4.1), and axe measured these two at
          1.27:1 against their surrounding text — nowhere near the 3:1 that
          would let colour do the work on its own. */}
      <div className="tw:px-4 tw:py-2.5 tw:text-xs tw:leading-normal tw:text-gray-600 tw:text-center">
        By publishing, your site is deployed to your connected Vercel account.{" "}
        <a href={`${DASHBOARD_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="tw:text-[var(--bk-accent-text)] tw:underline">
          Privacy policy
        </a>
        {" · "}
        <a href={`${DASHBOARD_URL}/terms`} target="_blank" rel="noopener noreferrer" className="tw:text-[var(--bk-accent-text)] tw:underline">
          Terms of service
        </a>
      </div>

      <PublishWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onPublish={() => void handlePublish()}
        checkState={checkState}
        checks={checks}
        onRetryChecks={() => void loadChecks()}
        blockedOnVercel={blockedOnVercel}
        onConnectVercel={() =>
          window.open(`${DASHBOARD_URL}/dashboard/settings/integrations`, "_blank", "noopener")
        }
        renderFix={(label) => {
          /* Board 893:4518 puts `Connect` on the Vercel row, not `Fix` — the
             fix is not in this editor, so it opens the dashboard's
             integrations page rather than switching tabs. */
          if (label === VERCEL_CHECK_LABEL) {
            return (
              <a
                href={`${DASHBOARD_URL}/dashboard/settings/integrations`}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:flex-none tw:text-[13px] tw:text-[var(--bk-accent)] tw:no-underline"
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
              onClick={() => {
                setWizardOpen(false);
                composer?.emit("ui:switch-tab", { tab: target.tab });
              }}
              className="tw:flex-none tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-accent)]"
            >
              Fix ›
            </Button>
          );
        }}
        composer={composer}
        publishedUrl={publishedUrl}
        isPublished={isPublished}
        rollbackTo={snapshot.lastDeploy?.version ?? null}
      />
    </PanelFrame>
  );
};

// ============================================
// Icons
// ============================================


// ============================================
// Classes
// ============================================

const CONTENT = "tw:flex-1 tw:overflow-y-auto tw:px-4 tw:py-3 tw:flex tw:flex-col tw:gap-4";
/* Board 641:2652 sets these sections on the panel surface itself — no cards.
   A card per section turned three related facts into three separate objects
   and cost 24px of chrome each, which is why the board's four sections fit
   above the fold and the card version did not. */
const SECTION = "tw:flex tw:flex-col tw:gap-0";
/* The board's section label: 11px, uppercase, tracked, ink-muted. */
const SECTION_TITLE =
  "tw:m-0 tw:mb-1 tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]";
const META = "tw:m-0 tw:text-xs tw:text-gray-500";

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
