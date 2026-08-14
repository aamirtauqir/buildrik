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
import { CopyButton, PanelFrame, Button, Progress, Spinner } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { UsePublishJobResult } from "../../../shell/hooks/usePublishJob";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { PublishHistory } from "../../../shell/PublishHistory";
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

const StatusBadge: React.FC<{ isPublished: boolean }> = ({ isPublished }) => (
  <span
    aria-label={`Publication status: ${isPublished ? "Published" : "Draft"}`}
    className={[
      "tw:inline-flex tw:items-center tw:gap-1.5 tw:px-2.5 tw:py-1 tw:rounded-full",
      "tw:text-xs tw:font-semibold tw:tracking-[0.02em]",
      isPublished
        ? "tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success)]"
        : "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning)]",
    ].join(" ")}
  >
    <span
      className={`tw:size-1.5 tw:rounded-full ${isPublished ? "tw:bg-[var(--bk-success)]" : "tw:bg-[var(--bk-warning)]"}`}
    />
    {isPublished ? "Published" : "Draft"}
  </span>
);

type CheckStatus = PrePublishChecksResult["checks"][number]["status"];

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

const STATUS_ICON: Record<CheckStatus, { dot: string; glyph: string; sr: string }> = {
  pass: { dot: "tw:bg-[var(--bk-success)]", glyph: "✓", sr: "passed" },
  warning: { dot: "tw:bg-[var(--bk-warning)]", glyph: "!", sr: "warning" },
  fail: { dot: "tw:bg-[var(--bk-error)]", glyph: "✕", sr: "blocking" },
};

const CheckRow: React.FC<{
  label: string;
  status: CheckStatus;
  detail: string;
  onFix?: () => void;
  fixLabel?: string;
  fixHref?: string;
}> = ({ label, status, detail, onFix, fixLabel, fixHref }) => {
  const icon = STATUS_ICON[status];
  return (
    <div
      className="tw:flex tw:items-start tw:gap-2 tw:px-2 tw:py-1.5 tw:text-[13px]"
      aria-label={`${label}: ${icon.sr}. ${detail}`}
    >
      <span
        className={`tw:size-4 tw:mt-0.5 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:flex-none tw:text-[10px] tw:font-bold tw:text-white ${icon.dot}`}
        aria-hidden="true"
      >
        {icon.glyph}
      </span>
      <span className="tw:flex tw:flex-col tw:flex-1 tw:min-w-0">
        <span className="tw:text-[13px] tw:text-[var(--bk-ink-soft)]">{label}</span>
        {status !== "pass" && (
          <span className="tw:text-[11px] tw:text-gray-500 tw:leading-snug">{detail}</span>
        )}
      </span>
      {status !== "pass" && fixHref && (
        <a
          href={fixHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`tw:flex-none tw:text-[11px] tw:no-underline ${status === "fail" ? "tw:font-semibold" : ""} tw:text-[var(--bk-accent)]`}
        >
          {fixLabel} ›
        </a>
      )}
      {status !== "pass" && !fixHref && onFix && (
        /* chrome-ui Button, not a native <button> — Gate 24 keeps native
           elements inside chrome-ui. Stripped to a text link so a non-blocking
           warning never wears a solid-button affordance. */
        <Button
          color="light"
          size="xs"
          onClick={onFix}
          className={`tw:flex-none tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[11px] tw:text-[var(--bk-accent)] ${status === "fail" ? "tw:font-semibold" : ""}`}
        >
          {fixLabel} ›
        </Button>
      )}
    </div>
  );
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

const UrlDisplay: React.FC<{ url: string }> = ({ url }) => (
  <div className="tw:flex tw:flex-col">
    <label className={LABEL}>Published URL</label>
    <div className="tw:flex tw:items-center tw:gap-1.5 tw:px-2 tw:py-1.5 tw:bg-gray-50 tw:rounded tw:border tw:border-gray-200">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="tw:flex-1 tw:text-xs tw:text-blue-700 tw:no-underline tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap"
        title={url}
      >
        {url.replace(/^https?:\/\//, "")}
      </a>
      {/* chrome-ui's CopyButton owns the clipboard write, the copied-state
          checkmark and the toast. This file had its own copy of all three. */}
      <CopyButton content={url} label="" aria-label="Copy published URL" />
    </div>
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
        {!canPublish ? (
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
            where it is going is still the question being answered. The board's
            meta line reads "Building · step 2 of 4 · started 14s ago"; the job
            exposes a percentage and a start, not named steps, so the shape is
            kept and only what exists is printed. */}
        {isPublishing && (
          <section className={SECTION} aria-label="Publish progress">
            <h3 className="tw:m-0 tw:text-[13px] tw:font-semibold tw:text-[var(--bk-ink)]">
              Publishing to production…
            </h3>
            <p className={META}>
              {publishJob && publishJob.progress > 0 ? `${publishJob.progress}%` : "Starting"}
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
          <EnvRow
            label={snapshot.production.label}
            value={snapshot.production.value}
            href={publishedUrl}
            empty="Not published yet"
          />
          <EnvRow label={snapshot.preview.label} value={snapshot.preview.value} empty="None" />
        </section>

        {/* Board 641:2652 — what would go out if you published now. The count
            pair is the header; the rows are the changes themselves. Absent
            during a run (board 784:4250 drops it). */}
        {!isPublishing && !justPublished && (
        <section className={SECTION} aria-label="Since last deploy">
          <div className={ROW}>
            <h3 className={SECTION_TITLE}>Since last deploy</h3>
          </div>
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
            <p className={META}>Nothing has changed since the last deploy.</p>
          )}
        </section>
        )}

        {/* Board 641:2652 — what is live right now, and therefore what a
            rollback would return to. */}
        {!isPublishing && !justPublished && (
        <section className={SECTION} aria-label="Last deploy">
          <h3 className={SECTION_TITLE}>Last deploy</h3>
          {snapshot.lastDeploy ? (
            <div className={ROW}>
              <span className="tw:text-[13px] tw:text-[var(--bk-ink)]">
                v{snapshot.lastDeploy.version} · live
              </span>
              <span className={META}>{snapshot.lastDeploy.when}</span>
            </div>
          ) : (
            <p className={META}>
              {snapshot.loading ? "Reading deploy history…" : "This site has never been published."}
            </p>
          )}
        </section>
        )}

        {/* Published URL */}
        {isPublished && publishedUrl && (
          <section className={SECTION}>
            <UrlDisplay url={publishedUrl} />
          </section>
        )}

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
        {/* Error display */}
        {error && (
          <div
            className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-2 tw:bg-[var(--bk-error-tint)] tw:rounded-lg tw:border tw:border-red-200 tw:text-[var(--bk-error)] tw:text-xs"
            role="alert"
          >
            <span>{error}</span>
            <Button
              color="light"
              size="xs"
              onClick={() => publishJob?.reset?.()}
              aria-label="Dismiss error"
              className="tw:border-transparent tw:bg-transparent tw:text-current tw:flex-none tw:p-0 tw:size-5"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </Button>
          </div>
        )}

        {/* P1: published-version history + rollback (contract §5) */}
        {siteId && (
          <section className={SECTION}>
            <PublishHistory siteId={siteId} onRollbackStarted={() => publishJob?.reset?.()} />
          </section>
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
          {!canPublish ? (
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
                disabled={isPublishing || justPublished}
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
      {/* Privacy & Terms footer */}
      <div className="tw:px-4 tw:py-2.5 tw:text-xs tw:leading-normal tw:text-gray-500 tw:text-center">
        By publishing, your site is deployed to your connected Vercel account.{" "}
        <a href={`${DASHBOARD_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="tw:text-blue-700 tw:no-underline">
          Privacy policy
        </a>
        {" · "}
        <a href={`${DASHBOARD_URL}/terms`} target="_blank" rel="noopener noreferrer" className="tw:text-blue-700 tw:no-underline">
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
        renderFix={(label) => {
          const isVercel = label === VERCEL_CHECK_LABEL;
          const target = FIX_TARGETS[label];
          if (isVercel) {
            return (
              <a
                href={`${DASHBOARD_URL}/dashboard/settings/integrations`}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:flex-none tw:text-[13px] tw:text-[var(--bk-accent)] tw:no-underline"
              >
                Connect Vercel ›
              </a>
            );
          }
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
        target={snapshot.production.value ? `Production · ${snapshot.production.value}` : "Production"}
        pageCount={snapshot.pageCount}
        /* The approval gate is the server's, surfaced through the publish
           job's block reason — the panel never decides it locally. */
        approval={
          publishJob?.blockedReason === "needs-approval"
            ? { label: "Not approved yet", tone: "warn" }
            : publishJob?.blockedReason === "stale-approval"
              ? { label: "Approved, then changed", tone: "warn" }
              : { label: "Not required", tone: "muted" }
        }
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
const LABEL = "tw:text-xs tw:font-medium tw:text-[var(--bk-ink-soft)] tw:mb-1";

export default PublishTab;
