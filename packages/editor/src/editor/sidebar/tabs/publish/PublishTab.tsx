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
import type { Composer } from "../../../../engine";
import { usePublish, type PublishResult } from "../../../../shared/hooks/usePublish";
import { Button } from "@/editor/shared/vibcoder/Button";
import { useToast } from "@/editor/shared/vibcoder";
import { TabFrame } from "@/shared/extensions/TabFrame";
import { Stack } from "@/editor/shared/vibcoder";

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
  /** Async function that publishes the project — provided by host app */
  onPublish?: (projectId: string) => Promise<PublishResult>;
  /** Async function that unpublishes the project — provided by host app */
  onUnpublish?: (projectId: string) => Promise<void>;
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
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: "var(--bd-radius-full)",
      fontSize: "var(--bd-text-xs, 12px)",
      fontWeight: 600,
      letterSpacing: "0.02em",
      background: isPublished
        ? "var(--bd-success-bg, rgba(34, 197, 94, 0.12))"
        : "rgba(245, 158, 11, 0.15)",
      color: isPublished ? "var(--bd-success, #22c55e)" : "var(--bd-warning)",
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: isPublished
          ? "var(--bd-success, #22c55e)"
          : "var(--bd-warning)",
      }}
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
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 8px",
      borderRadius: 6,
      background: ok ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${ok ? "rgba(34,197,94,0.15)" : "var(--bd-border-light, var(--bd-border))"}`,
      fontSize: 13,
    }}
    aria-label={`${label}: ${ok ? "complete" : "incomplete"}`}
  >
    {/* 16×16 checkbox — filled with success color when checked */}
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: "var(--bd-radius-sm)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ok ? "var(--bd-success, #22c55e)" : "transparent",
        border: ok ? "none" : "1px solid var(--bd-border-light, var(--bd-border))",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
      aria-hidden="true"
    >
      {ok && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 5l2.5 2.5L8 2.5" />
        </svg>
      )}
    </span>
    <span
      style={{
        flex: 1,
        color: ok ? "var(--bd-fg-muted)" : "var(--bd-fg-secondary)",
        textDecoration: ok ? "line-through" : "none",
        fontSize: 13,
      }}
    >
      {label}
    </span>
    {required && !ok && (
      <span style={{ fontSize: 12, color: "var(--bd-error)", fontWeight: 500 }}>Required</span>
    )}
    {hint && !ok && (
      <span style={{ fontSize: 12, color: "var(--bd-fg-muted)" }}>{hint}</span>
    )}
  </div>
);

const UrlDisplay: React.FC<{ url: string }> = ({ url }) => {
  const { addToast } = useToast();
  const handleCopy = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        addToast?.({ description: "URL copied to clipboard", tone: "success", duration: 2000 });
      })
      .catch(() => {
        addToast?.({ description: "Failed to copy URL", tone: "error" });
      });
  };

  return (
    <div style={urlContainerStyles}>
      <label style={labelStyles}>Published URL</label>
      <div style={urlRowStyles}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={urlLinkStyles} title={url}>
          {url.replace(/^https?:\/\//, "")}
        </a>
        <Button
          onClick={handleCopy}
          style={copyButtonStyles}
          title="Copy URL"
          aria-label="Copy published URL"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </Button>
      </div>
    </div>
  );
};

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
  onPublish,
  onUnpublish,
  publishedUrl: initialUrl,
  isProjectPublished,
}) => {
  const { addToast } = useToast();
  const {
    publish,
    unpublish,
    isPublishing,
    publishedUrl,
    lastPublishedAt,
    error,
    isPublished,
    clearError,
  } = usePublish(projectId, {
    onPublish,
    onUnpublish,
    initialState: {
      publishedUrl: initialUrl,
      isPublished: isProjectPublished,
    },
  });

  // Track latest publishedUrl for toast action (avoids stale closure)
  const publishedUrlRef = React.useRef(publishedUrl);
  publishedUrlRef.current = publishedUrl;

  const handlePublish = async () => {
    clearError();
    const success = await publish();
    if (success) {
      addToast?.({
        description: "Site published successfully",
        tone: "success",
        duration: 4000,
        action: {
          label: "Open Site",
          onClick: () => {
            if (publishedUrlRef.current) {
              window.open(publishedUrlRef.current, "_blank");
            }
          },
        },
      });
    } else {
      addToast?.({
        description: "Publish failed. Check your connection and try again.",
        tone: "error",
        duration: 5000,
        action: { label: "Retry", onClick: () => void handlePublish() },
      });
    }
  };

  const handleUnpublish = async () => {
    clearError();
    const success = await unpublish();
    if (success) {
      addToast?.({ description: "Site unpublished", tone: "info", duration: 3000 });
    } else {
      addToast?.({
        description: "Unpublish failed. Please try again.",
        tone: "error",
        duration: 5000,
      });
    }
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
    // At least 1 page — use elements.getPages if available, otherwise assume true
    const hasPages = (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pagesApi = (_composer as any)?.pages;
        if (pagesApi && typeof pagesApi.getAll === "function") {
          const pages = pagesApi.getAll();
          return Array.isArray(pages) && pages.length > 0;
        }
        return true; // assume true if API not available
      } catch { return true; }
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
        const img = settings?.seo?.ogImage;
        return typeof img === "string" && img.trim().length > 0;
      } catch { return false; }
    })();
    return { hasContent, hasPageTitle, hasFavicon, hasPages, hasSeoTitle, hasMetaDesc, hasSocialImg };
  }, [_composer]);

  return (
    <TabFrame>
      <TabFrame.Header
        title="Publish"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      <div style={contentStyles}>
        {/* Status Section */}
        <section style={sectionStyles}>
          <div style={sectionHeaderStyles}>
            <h3 style={sectionTitleStyles}>Status</h3>
            <StatusBadge isPublished={isPublished} />
          </div>

          {lastPublishedAt && (
            <p style={metaTextStyles}>
              Last published:{" "}
              {lastPublishedAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </section>

        {/* Published URL */}
        {isPublished && publishedUrl && (
          <section style={sectionStyles}>
            <UrlDisplay url={publishedUrl} />
          </section>
        )}

        {/* Pre-Publish Checklist */}
        <section style={sectionStyles}>
          <h3 style={sectionTitleStyles}>Pre-publish checklist</h3>
          <Stack gap="sm">
            <ChecklistItem label="Page title set" ok={checks.hasPageTitle} hint="Settings → Site" />
            <ChecklistItem label="Favicon uploaded" ok={checks.hasFavicon} hint="Settings → Site" />
            <ChecklistItem label="At least 1 page" ok={checks.hasPages} required />
            <ChecklistItem label="SEO title set" ok={checks.hasSeoTitle} hint="Pages → SEO" />
            <ChecklistItem label="Meta description added" ok={checks.hasMetaDesc} hint="Pages → SEO" />
          </Stack>
          {projectId && (
            <p style={{ ...metaTextStyles, marginTop: 4 }}>
              Publishing to <strong style={{ color: "var(--bd-fg-primary)" }}>buildrik.app/{projectId}</strong>
            </p>
          )}
        </section>

        {/* Trust signal */}
        <div style={trustBadgeStyles}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0, color: "var(--bd-success, #22c55e)" }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Your site data is encrypted and stored securely.</span>
        </div>

        {/* Actions */}
        <section style={sectionStyles}>
          {(!projectId || !onPublish) ? (
            <div style={{
              padding: "12px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              borderRadius: "var(--bd-radius-md)",
              fontSize: 12,
              color: "var(--bd-fg-secondary)",
              lineHeight: 1.5,
            }}>
              Publishing not configured. Contact your administrator to link this project.
            </div>
          ) : !isPublished ? (
            <>
              <Button
                variant="primary"
                onClick={handlePublish}
                disabled={isPublishing}
                style={{ width: "100%" }}
              >
                {isPublishing ? "Publishing..." : "Publish Site"}
              </Button>
              {isPublishing && (
                <p style={disabledReasonStyles}>
                  Publishing in progress — please wait.
                </p>
              )}
            </>
          ) : (
            <>
              <div style={actionRowStyles}>
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  disabled={isPublishing || !projectId || !onPublish}
                  style={{ flex: 1 }}
                >
                  {isPublishing ? "Updating..." : "Update Site"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleUnpublish}
                  disabled={isPublishing || !projectId || !onUnpublish}
                >
                  Unpublish
                </Button>
              </div>
              {isPublishing && (
                <p style={disabledReasonStyles}>
                  Update in progress — please wait.
                </p>
              )}
              {!onUnpublish && !isPublishing && (
                <p style={disabledReasonStyles}>
                  Unpublish not available — contact your administrator.
                </p>
              )}
            </>
          )}
        </section>

        {/* Info Section */}
        <section style={infoSectionStyles}>
          <RocketIcon />
          <div>
            <p style={infoTitleStyles}>{isPublished ? "Your site is live" : "Ready to go live?"}</p>
            <p style={infoDescStyles}>
              {isPublished
                ? "Changes made after publishing require an update to go live."
                : "Complete the checklist above, then hit Publish to make your site public."}
            </p>
          </div>
        </section>

        {/* Error display */}
        {error && (
          <div style={errorStyles} role="alert">
            <span>{error}</span>
            <Button onClick={clearError} style={errorDismissStyles} aria-label="Dismiss error">
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
      </div>
      {/* Privacy & Terms footer */}
      <div style={privacyFooterStyles}>
        By publishing, your site is hosted on Buildrik servers.{" "}
        <a href="https://buildrik.com/privacy" target="_blank" rel="noopener noreferrer" style={privacyLinkStyles}>
          Privacy policy
        </a>
        {" · "}
        <a href="https://buildrik.com/terms" target="_blank" rel="noopener noreferrer" style={privacyLinkStyles}>
          Terms of service
        </a>
      </div>
    </TabFrame>
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
    stroke="var(--bd-accent)"
    strokeWidth="1.5"
    style={{ flexShrink: 0, marginTop: 2 }}
    aria-hidden="true"
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

// ============================================
// Styles
// ============================================

const contentStyles: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const sectionStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: 12,
  background: "var(--bd-bg-subtle)",
  borderRadius: "var(--bd-radius-md)",
  border: "1px solid var(--bd-border)",
};

const sectionHeaderStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const sectionTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--bd-text-sm, 13px)",
  fontWeight: 600,
  color: "var(--bd-fg-primary)",
};

const metaTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--bd-text-xs, 12px)",
  color: "var(--bd-fg-muted)",
};

const labelStyles: React.CSSProperties = {
  fontSize: "var(--bd-text-xs, 12px)",
  fontWeight: 500,
  color: "var(--bd-fg-secondary)",
  marginBottom: 4,
};

const urlContainerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const urlRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 8px",
  background: "var(--bd-bg-subtle)",
  borderRadius: "var(--bd-radius-sm)",
  border: "1px solid var(--bd-border)",
};

const urlLinkStyles: React.CSSProperties = {
  flex: 1,
  fontSize: "var(--bd-text-xs, 12px)",
  color: "var(--bd-accent)",
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const copyButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  padding: 0,
  background: "transparent",
  border: "none",
  borderRadius: "var(--bd-radius-sm)",
  color: "var(--bd-fg-secondary)",
  cursor: "pointer",
  flexShrink: 0,
};

const actionRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const disabledReasonStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: "var(--bd-fg-muted)",
  lineHeight: 1.4,
};

const infoSectionStyles: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: 12,
  background: "var(--bd-accent-tint)",
  borderRadius: "var(--bd-radius-md)",
  border: "1px solid var(--bd-accent-subtle)",
};

const infoTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--bd-text-sm, 13px)",
  fontWeight: 600,
  color: "var(--bd-fg-primary)",
};

const infoDescStyles: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "var(--bd-text-xs, 12px)",
  lineHeight: 1.5,
  color: "var(--bd-fg-secondary)",
};

const errorStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 12px",
  background: "var(--bd-error-tint, rgba(239, 68, 68, 0.1))",
  borderRadius: "var(--bd-radius-md)",
  border: "1px solid var(--bd-error-tint, rgba(239, 68, 68, 0.2))",
  color: "var(--bd-error, #ef4444)",
  fontSize: "var(--bd-text-xs, 12px)",
};

const errorDismissStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 20,
  height: 20,
  padding: 0,
  background: "transparent",
  border: "none",
  color: "inherit",
  cursor: "pointer",
  flexShrink: 0,
};

const trustBadgeStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  background: "rgba(34, 197, 94, 0.06)",
  borderRadius: "var(--bd-radius-md)",
  border: "1px solid rgba(34, 197, 94, 0.15)",
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  lineHeight: 1.4,
};

const privacyFooterStyles: React.CSSProperties = {
  padding: "10px 16px",
  borderTop: "1px solid var(--bd-border)",
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--bd-fg-muted)",
  textAlign: "center",
};

const privacyLinkStyles: React.CSSProperties = {
  color: "var(--bd-accent)",
  textDecoration: "none",
};

export default PublishTab;
