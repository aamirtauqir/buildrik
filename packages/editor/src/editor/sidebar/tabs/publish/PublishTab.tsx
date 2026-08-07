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
import { CopyButton, PanelFrame, Button, Spinner } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { UsePublishJobResult } from "../../../shell/hooks/usePublishJob";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { PublishHistory } from "../../../shell/PublishHistory";
import { fetchPrePublishChecks } from "../../../../services/PublishService";
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
    <PanelFrame>
      <PanelFrame.Header
        title="Publish"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      <div className={CONTENT}>
        {/* Status Section */}
        <section className={SECTION}>
          <div className="tw:flex tw:items-center tw:justify-between">
            <h3 className={SECTION_TITLE}>Status</h3>
            <StatusBadge isPublished={isPublished} />
          </div>
          {isPublishing && publishJob && publishJob.progress > 0 && (
            <p className={META}>Publishing… {publishJob.progress}%</p>
          )}
        </section>

        {/* Published URL */}
        {isPublished && publishedUrl && (
          <section className={SECTION}>
            <UrlDisplay url={publishedUrl} />
          </section>
        )}

        {/* Pre-publish readiness — the server's contract, rendered verbatim */}
        <section className={SECTION} aria-label="Pre-publish readiness">
          <h3 className={SECTION_TITLE}>Pre-publish checklist</h3>

          {checkState === "loading" && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-3 tw:text-xs tw:text-gray-500">
              <Spinner size="sm" aria-label="Checking readiness" />
              Checking readiness…
            </div>
          )}

          {checkState === "error" && (
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-2 tw:py-2 tw:text-xs tw:text-[var(--bk-ink-soft)]">
              <span>Couldn&apos;t load the readiness checks.</span>
              <Button color="light" size="xs" onClick={() => void loadChecks()}>
                Retry
              </Button>
            </div>
          )}

          {checkState === "ready" && checks && (
            <>
              <div className="tw:flex tw:flex-col">
                {checks.checks.map((c) => {
                  const isVercel = c.label === VERCEL_CHECK_LABEL;
                  const target = FIX_TARGETS[c.label];
                  return (
                    <CheckRow
                      key={c.label}
                      label={c.label}
                      status={c.status}
                      detail={c.detail}
                      // The Vercel connection is a workspace-level integration,
                      // so its fix lives in the dashboard, not in an editor tab.
                      fixHref={isVercel ? `${DASHBOARD_URL}/dashboard/settings/integrations` : undefined}
                      fixLabel={isVercel ? "Connect Vercel" : target?.label}
                      onFix={
                        !isVercel && target
                          ? () => composer?.emit("ui:switch-tab", { tab: target.tab })
                          : undefined
                      }
                    />
                  );
                })}
              </div>
              <p
                className={`tw:m-0 tw:mt-1 tw:px-2 tw:text-[11px] tw:leading-snug ${
                  blockedByChecks ? "tw:text-[var(--bk-error)]" : "tw:text-gray-500"
                }`}
                role={blockedByChecks ? "alert" : undefined}
              >
                {blockedByChecks
                  ? `Blocked — ${blocking.map((c) => c.label).join(", ")}. Fix to publish.`
                  : warnings.length > 0
                    ? `${warnings.length} warning${warnings.length > 1 ? "s" : ""} — none block. Client approval is a separate gate.`
                    : "All checks pass."}
              </p>
            </>
          )}

          {checkState === "ready" && !checks && (
            <p className={META}>Open this site from the dashboard to see readiness checks.</p>
          )}
        </section>

        {/* Trust signal */}
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:px-2.5 tw:py-[7px] tw:bg-[var(--bk-success-tint)] tw:rounded-lg tw:border tw:border-green-200 tw:text-xs tw:text-gray-500 tw:leading-snug">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="tw:flex-none tw:text-[var(--bk-success)]">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Your site data is encrypted and stored securely.</span>
        </div>

        {/* Actions */}
        <section className={SECTION}>
          {!canPublish ? (
            <div className="tw:p-3 tw:bg-[var(--bk-warning-tint)] tw:border tw:border-yellow-200 tw:rounded-lg tw:text-xs tw:text-[var(--bk-ink-soft)] tw:leading-normal">
              Publishing not configured. Contact your administrator to link this project.
            </div>
          ) : (
            <>
              <Button
                onClick={handlePublish}
                // A blocking check means the server WILL refuse this publish
                // (runPrePublishChecks → ready:false). Disabling here is the
                // point of the fix: the panel must not offer a publish that
                // cannot succeed.
                disabled={isPublishing || blockedByChecks}
                className="tw:w-full"
              >
                {isPublishing ? (isPublished ? "Updating..." : "Publishing...") : isPublished ? "Update Site" : "Publish Site"}
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
        </section>

        {/* Info Section */}
        <section className="tw:flex tw:gap-3 tw:p-3 tw:bg-[var(--bk-accent-tint)] tw:rounded-lg tw:border tw:border-[var(--bk-accent-subtle)]">
          <RocketIcon />
          <div>
            <p className={SECTION_TITLE}>{isPublished ? "Your site is live" : "Ready to go live?"}</p>
            <p className="tw:mt-1 tw:mb-0 tw:text-xs tw:leading-normal tw:text-[var(--bk-ink-soft)]">
              {isPublished
                ? "Changes made after publishing require an update to go live."
                : blockedByChecks
                  ? "Clear the blocking check above, then hit Publish to make your site public."
                  : "Warnings above don't block. Hit Publish to make your site public."}
            </p>
          </div>
        </section>

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
      </div>
      {/* Privacy & Terms footer */}
      <div className="tw:px-4 tw:py-2.5 tw:border-t tw:border-gray-200 tw:text-xs tw:leading-normal tw:text-gray-500 tw:text-center">
        By publishing, your site is deployed to your connected Vercel account.{" "}
        <a href={`${DASHBOARD_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="tw:text-blue-700 tw:no-underline">
          Privacy policy
        </a>
        {" · "}
        <a href={`${DASHBOARD_URL}/terms`} target="_blank" rel="noopener noreferrer" className="tw:text-blue-700 tw:no-underline">
          Terms of service
        </a>
      </div>
    </PanelFrame>
  );
};

// ============================================
// Icons
// ============================================

const RocketIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--bk-accent)"
    strokeWidth="1.5"
    className="tw:flex-none tw:mt-0.5"
    aria-hidden="true"
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

// ============================================
// Classes
// ============================================

const CONTENT = "tw:flex-1 tw:overflow-y-auto tw:p-4 tw:flex tw:flex-col tw:gap-4";
const SECTION = "tw:flex tw:flex-col tw:gap-2 tw:p-3 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-gray-200";
const SECTION_TITLE = "tw:m-0 tw:text-[13px] tw:font-semibold tw:text-gray-900";
const META = "tw:m-0 tw:text-xs tw:text-gray-500";
const LABEL = "tw:text-xs tw:font-medium tw:text-[var(--bk-ink-soft)] tw:mb-1";

export default PublishTab;
