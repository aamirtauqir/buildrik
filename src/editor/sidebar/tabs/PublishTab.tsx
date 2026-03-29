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
import type { Composer } from "../../../engine";
import { usePublish, type PublishResult } from "../../../shared/hooks/usePublish";
import { Button } from "../../../shared/ui/Button";
import { useToast } from "../../../shared/ui/Toast";
import { PanelHeader } from "../shared/PanelHeader";

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
      borderRadius: "var(--aqb-radius-full, 999px)",
      fontSize: "var(--aqb-text-xs, 12px)",
      fontWeight: 600,
      letterSpacing: "0.02em",
      background: isPublished
        ? "var(--aqb-success-light, rgba(34, 197, 94, 0.12))"
        : "rgba(245, 158, 11, 0.15)",
      color: isPublished ? "var(--aqb-success, #22c55e)" : "#F59E0B",
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: isPublished
          ? "var(--aqb-success, #22c55e)"
          : "#F59E0B",
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
      border: `1px solid ${ok ? "rgba(34,197,94,0.15)" : "var(--aqb-border)"}`,
      fontSize: 12,
    }}
    aria-label={`${label}: ${ok ? "complete" : "incomplete"}`}
  >
    <span
      style={{
        width: 16,
        height: 16,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        background: ok ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
        color: ok ? "#22c55e" : "var(--aqb-text-muted)",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {ok ? "✓" : "○"}
    </span>
    <span style={{ flex: 1, color: ok ? "var(--aqb-text-secondary)" : "var(--aqb-text-primary)" }}>
      {label}
    </span>
    {required && !ok && (
      <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>Required</span>
    )}
    {hint && !ok && (
      <span style={{ fontSize: 12, color: "var(--aqb-text-muted)" }}>{hint}</span>
    )}
  </div>
);

const UrlDisplay: React.FC<{ url: string }> = ({ url }) => {
  const { addToast } = useToast();
  const handleCopy = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        addToast?.({ message: "URL copied to clipboard", variant: "success", duration: 2000 });
      })
      .catch(() => {
        addToast?.({ message: "Failed to copy URL", variant: "error" });
      });
  };

  return (
    <div style={urlContainerStyles}>
      <label style={labelStyles}>Published URL</label>
      <div style={urlRowStyles}>
        <a href={url} target="_blank" rel="noopener noreferrer" style={urlLinkStyles} title={url}>
          {url.replace(/^https?:\/\//, "")}
        </a>
        <button
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
        </button>
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
        message: "Site published successfully",
        variant: "success",
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
        message: "Publish failed. Check your connection and try again.",
        variant: "error",
        duration: 5000,
        action: { label: "Retry", onClick: () => void handlePublish() },
      });
    }
  };

  const handleUnpublish = async () => {
    clearError();
    const success = await unpublish();
    if (success) {
      addToast?.({ message: "Site unpublished", variant: "info", duration: 3000 });
    } else {
      addToast?.({
        message: "Unpublish failed. Please try again.",
        variant: "error",
        duration: 5000,
      });
    }
  };

  return (
    <div style={containerStyles}>
      <PanelHeader
        title="Publish"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      <div className="aqb-scrollbar" style={contentStyles}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <ChecklistItem label="Template applied" ok={true} required />
            <ChecklistItem label="Content edited" ok={true} required />
            <ChecklistItem label="SEO title set" ok={false} hint="Pages → SEO" />
            <ChecklistItem label="Meta description added" ok={false} hint="Pages → SEO" />
            <ChecklistItem label="Social preview configured" ok={false} hint="Pages → Social" />
          </div>
          {projectId && (
            <p style={{ ...metaTextStyles, marginTop: 4 }}>
              Publishing to <strong style={{ color: "var(--aqb-text-primary)" }}>buildrik.app/{projectId}</strong>
            </p>
          )}
        </section>

        {/* Trust signal */}
        <div style={trustBadgeStyles}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0, color: "var(--aqb-success, #22c55e)" }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Your site data is encrypted and stored securely.</span>
        </div>

        {/* Actions */}
        <section style={sectionStyles}>
          {!isPublished ? (
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={isPublishing || !projectId || !onPublish}
              style={{ width: "100%" }}
            >
              {isPublishing ? "Publishing..." : "Publish Site"}
            </Button>
          ) : (
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
            <button onClick={clearError} style={errorDismissStyles} aria-label="Dismiss error">
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
            </button>
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
    </div>
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
    stroke="var(--aqb-primary, #6366f1)"
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

const containerStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  background: "var(--aqb-surface-1)",
};

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
  background: "var(--aqb-surface-2)",
  borderRadius: "var(--aqb-radius-md, 8px)",
  border: "1px solid var(--aqb-border)",
};

const sectionHeaderStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const sectionTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--aqb-text-sm, 13px)",
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};

const metaTextStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--aqb-text-xs, 12px)",
  color: "var(--aqb-text-muted)",
};

const labelStyles: React.CSSProperties = {
  fontSize: "var(--aqb-text-xs, 12px)",
  fontWeight: 500,
  color: "var(--aqb-text-secondary)",
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
  background: "var(--aqb-surface-3)",
  borderRadius: "var(--aqb-radius-sm, 4px)",
  border: "1px solid var(--aqb-border)",
};

const urlLinkStyles: React.CSSProperties = {
  flex: 1,
  fontSize: "var(--aqb-text-xs, 12px)",
  color: "var(--aqb-primary)",
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
  borderRadius: "var(--aqb-radius-sm, 4px)",
  color: "var(--aqb-text-secondary)",
  cursor: "pointer",
  flexShrink: 0,
};

const actionRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const infoSectionStyles: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: 12,
  background: "var(--aqb-primary-subtle, rgba(99, 102, 241, 0.06))",
  borderRadius: "var(--aqb-radius-md, 8px)",
  border: "1px solid var(--aqb-primary-light, rgba(99, 102, 241, 0.12))",
};

const infoTitleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: "var(--aqb-text-sm, 13px)",
  fontWeight: 600,
  color: "var(--aqb-text-primary)",
};

const infoDescStyles: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "var(--aqb-text-xs, 12px)",
  lineHeight: 1.5,
  color: "var(--aqb-text-secondary)",
};

const errorStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 12px",
  background: "var(--aqb-error-light, rgba(239, 68, 68, 0.1))",
  borderRadius: "var(--aqb-radius-md, 8px)",
  border: "1px solid var(--aqb-error-light, rgba(239, 68, 68, 0.2))",
  color: "var(--aqb-error, #ef4444)",
  fontSize: "var(--aqb-text-xs, 12px)",
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
  borderRadius: "var(--aqb-radius-md, 8px)",
  border: "1px solid rgba(34, 197, 94, 0.15)",
  fontSize: 12,
  color: "var(--aqb-text-muted)",
  lineHeight: 1.4,
};

const privacyFooterStyles: React.CSSProperties = {
  padding: "10px 16px",
  borderTop: "1px solid var(--aqb-border)",
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--aqb-text-muted)",
  textAlign: "center",
};

const privacyLinkStyles: React.CSSProperties = {
  color: "var(--aqb-primary, #3b82f6)",
  textDecoration: "none",
};

export default PublishTab;
