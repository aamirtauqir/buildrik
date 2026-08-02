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
import { CopyButton, PanelFrame, Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import type { UsePublishJobResult } from "../../../shell/hooks/usePublishJob";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { PublishHistory } from "../../../shell/PublishHistory";
// ============================================
// Types
// ============================================

export interface PublishTabProps {
  /** Composer instance */
  composer: Composer | null;
  /** Project ID for publish operations */
  projectId?: string | null;
  /** Panel pin state */
  isPinned?: boolean;
  /** Pin toggle callback */
  onPinToggle?: () => void;
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

const ChecklistItem: React.FC<{
  label: string;
  ok: boolean;
  required?: boolean;
  hint?: string;
}> = ({ label, ok, required, hint }) => (
  <div
    className={[
      "tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1.5 tw:rounded-md tw:border tw:text-[13px]",
      ok
        ? "tw:bg-[var(--bk-success-tint)] tw:border-green-200"
        : "tw:bg-transparent tw:border-gray-200",
    ].join(" ")}
    aria-label={`${label}: ${ok ? "complete" : "incomplete"}`}
  >
    {/* 16x16 checkbox — filled with success colour when checked */}
    <span
      className={[
        "tw:size-4 tw:rounded-sm tw:flex tw:items-center tw:justify-center tw:flex-none",
        "tw:[transition:var(--bk-transition-fast)]",
        ok ? "tw:bg-[var(--bk-success)] tw:border-0" : "tw:bg-transparent tw:border tw:border-gray-200",
      ].join(" ")}
      aria-hidden="true"
    >
      {ok && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 5l2.5 2.5L8 2.5" />
        </svg>
      )}
    </span>
    <span
      className={`tw:flex-1 tw:text-[13px] ${ok ? "tw:text-gray-500 tw:line-through" : "tw:text-[var(--bk-ink-soft)] tw:no-underline"}`}
    >
      {label}
    </span>
    {required && !ok && (
      <span className="tw:text-xs tw:font-medium tw:text-[var(--bk-error)]">Required</span>
    )}
    {hint && !ok && <span className="tw:text-xs tw:text-gray-500">{hint}</span>}
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
  composer: _composer,
  projectId = null,
  isPinned,
  onPinToggle,
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

  const checks = React.useMemo(() => {
    const hasContent = (() => {
      try {
        const page = _composer?.elements?.getActivePage?.();
        if (!page) return false;
        const root = _composer?.elements?.getElement?.(page.root?.id);
        return (root?.getChildCount?.() ?? 0) > 0;
      } catch { return false; }
    })();
    // Page title: check project settings seo.siteName
    const hasPageTitle = (() => {
      try {
        const settings = _composer?.getProjectSettings?.();
        const title = settings?.seo?.siteName;
        return typeof title === "string" && title.trim().length > 0;
      } catch { return false; }
    })();
    // Favicon: check project settings seo.favicon
    const hasFavicon = (() => {
      try {
        const settings = _composer?.getProjectSettings?.();
        const favicon = settings?.seo?.favicon;
        return typeof favicon === "string" && favicon.trim().length > 0;
      } catch { return false; }
    })();
    // At least 1 page — read the real pages API (pages live under
    // composer.elements, NOT a `composer.pages` bag). When the API is
    // unavailable we can't verify, so this required check stays incomplete
    // rather than falsely green.
    const hasPages = (() => {
      try {
        const pages = _composer?.elements?.getAllPages?.();
        return Array.isArray(pages) && pages.length > 0;
      } catch { return false; }
    })();
    const hasSeoTitle = (() => {
      try {
        const settings = _composer?.getProjectSettings?.();
        const title = settings?.seo?.metaTitle;
        return typeof title === "string" && title.trim().length > 0;
      } catch { return false; }
    })();
    const hasMetaDesc = (() => {
      try {
        const settings = _composer?.getProjectSettings?.();
        const desc = settings?.seo?.metaDescription;
        return typeof desc === "string" && desc.trim().length > 0;
      } catch { return false; }
    })();
    const hasSocialImg = (() => {
      try {
        const settings = _composer?.getProjectSettings?.();
        const img = settings?.seo?.defaultOgImage;
        return typeof img === "string" && img.trim().length > 0;
      } catch { return false; }
    })();
    return { hasContent, hasPageTitle, hasFavicon, hasPages, hasSeoTitle, hasMetaDesc, hasSocialImg };
  }, [_composer]);

  return (
    <PanelFrame>
      <PanelFrame.Header
        title="Publish"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
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

        {/* Pre-Publish Checklist */}
        <section className={SECTION}>
          <h3 className={SECTION_TITLE}>Pre-publish checklist</h3>
          <div className="tw:flex tw:flex-col tw:gap-2">
            <ChecklistItem label="Page title set" ok={checks.hasPageTitle} hint="Settings → Site" />
            <ChecklistItem label="Favicon uploaded" ok={checks.hasFavicon} hint="Settings → Site" />
            <ChecklistItem label="At least 1 page" ok={checks.hasPages} required />
            <ChecklistItem label="Page has content" ok={checks.hasContent} hint="Add sections" />
            <ChecklistItem label="SEO title set" ok={checks.hasSeoTitle} hint="Pages → SEO" />
            <ChecklistItem label="Meta description added" ok={checks.hasMetaDesc} hint="Pages → SEO" />
            <ChecklistItem label="Social share image" ok={checks.hasSocialImg} hint="Pages → SEO" />
          </div>
          {projectId && (
            <p className={`${META} tw:mt-1`}>
              Publishing to <strong className="tw:text-gray-900">your connected Vercel project</strong>
            </p>
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
                disabled={isPublishing}
                className="tw:w-full"
              >
                {isPublishing ? (isPublished ? "Updating..." : "Publishing...") : isPublished ? "Update Site" : "Publish Site"}
              </Button>
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
                : "Complete the checklist above, then hit Publish to make your site public."}
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
        {projectId && (
          <section className={SECTION}>
            <PublishHistory siteId={projectId} onRollbackStarted={() => publishJob?.reset?.()} />
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
