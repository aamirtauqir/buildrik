/**
 * TemplatePreviewPanel - Split-view preview panel for templates
 * Renders in canvas area when a template is selected from TemplatesTab
 * Shows empty state or selected template preview with "Use Template" CTA
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { TemplateItem } from "../../sidebar/tabs/templates";

// ============================================================================
// TYPES
// ============================================================================

export interface TemplatePreviewPanelProps {
  /** Currently selected template (null for empty state) */
  template: TemplateItem | null;
  /** Composer instance for actions */
  composer: Composer | null;
  /** Callback when "Use Template" is clicked - opens drawer */
  onUseTemplate: (template: TemplateItem) => void;
  /** Callback to close preview and return to canvas */
  onClose: () => void;
  /** Whether panel is visible (for animation) */
  visible?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TemplatePreviewPanel: React.FC<TemplatePreviewPanelProps> = ({
  template,
  composer: _composer,
  onUseTemplate,
  onClose,
  visible = true,
}) => {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Render HTML preview in iframe when template changes
  React.useEffect(() => {
    if (!template || !iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=1200">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #fff;
              transform-origin: top left;
              overflow-x: hidden;
            }
          </style>
        </head>
        <body>${template.html}</body>
        </html>
      `);
      doc.close();
    }
  }, [template]);

  // Handle ESC key to close preview
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isPremium = template?.status === "premium";

  // Get category label for display
  const getCategoryLabel = (type: string): string => {
    const labels: Record<string, string> = {
      hero: "Hero",
      navigation: "Navigation",
      features: "Features",
      pricing: "Pricing",
      testimonials: "Testimonials",
      cta: "CTA",
      footer: "Footer",
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className={`aqb-template-preview-panel ${visible ? "visible" : ""}`} style={panelStyles}>
      {!template ? (
        /* Empty State */
        <div style={emptyStateStyles}>
          <GridIcon />
          <p style={emptyTextStyles}>Select a template to start building</p>
        </div>
      ) : (
        /* Selected Template Preview */
        <>
          {/* Preview Area */}
          <div style={previewAreaStyles}>
            <div style={iframeWrapperStyles}>
              <iframe
                ref={iframeRef}
                title={`Preview: ${template.name}`}
                sandbox="allow-same-origin"
                style={iframeStyles}
              />
              {isPremium && (
                <div style={premiumOverlayStyles}>
                  <LockIcon />
                  <span>Pro Template</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div style={infoCardStyles}>
            <div style={infoHeaderStyles}>
              <span style={templateNameStyles}>{template.name}</span>
              <span style={template.status === "premium" ? badgeProStyles : badgeFreeStyles}>
                {template.status === "premium" && <SmallLockIcon />}
                {template.status === "premium" ? "PRO" : "FREE"}
              </span>
            </div>
            <div style={templateMetaStyles}>
              {getCategoryLabel(template.type)} •{" "}
              {template.description?.split(" ").slice(0, 4).join(" ")}
            </div>

            {/* Action Buttons */}
            <div style={actionsStyles}>
              {isPremium ? (
                <button style={upgradeButtonStyles}>
                  <UpgradeIcon />
                  Upgrade to Pro
                </button>
              ) : (
                <>
                  <button style={primaryButtonStyles} onClick={() => onUseTemplate(template)}>
                    Use Template
                  </button>
                  <button
                    style={ghostButtonStyles}
                    onClick={() => {
                      // Open full preview in new tab (safe external link)
                      const blob = new Blob([template.html], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      window.open(url, "_blank");
                    }}
                    title="Open full preview"
                  >
                    <ExternalIcon />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            style={closeButtonStyles}
            onClick={onClose}
            title="Close preview (ESC)"
            aria-label="Close preview"
          >
            <CloseIcon />
          </button>
        </>
      )}
    </div>
  );
};

// ============================================================================
// ICONS
// ============================================================================

const GridIcon: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    style={{ opacity: 0.3 }}
  >
    <rect x="8" y="8" width="20" height="20" rx="2" />
    <rect x="36" y="8" width="20" height="20" rx="2" />
    <rect x="8" y="36" width="20" height="20" rx="2" />
    <rect x="36" y="36" width="20" height="20" rx="2" />
  </svg>
);

const LockIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="10" width="14" height="12" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

const SmallLockIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
    <rect x="2" y="5" width="8" height="6" rx="1" />
    <path d="M4 5V4a2 2 0 0 1 4 0v1" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <path d="M5 5l10 10M15 5l-10 10" />
  </svg>
);

const ExternalIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" />
    <path d="M9 2h5v5" />
    <path d="M14 2L7 9" />
  </svg>
);

const UpgradeIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 14V2M8 2l4 4M8 2L4 6" />
  </svg>
);

// ============================================================================
// STYLES
// ============================================================================

const panelStyles: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #e2e8f0 0%, #d1d8e0 100%)",
  zIndex: 50,
  // Animation handled by CSS class .aqb-template-preview-panel + .visible
};

const emptyStateStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  color: "#64748b",
};

const emptyTextStyles: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "#64748b",
  margin: 0,
};

const previewAreaStyles: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 40,
  width: "100%",
  overflow: "hidden",
};

const iframeWrapperStyles: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 900,
  height: "100%",
  maxHeight: 500,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
  overflow: "hidden",
};

const iframeStyles: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  transformOrigin: "top left",
};

const premiumOverlayStyles: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "rgba(0, 0, 0, 0.7)",
  backdropFilter: "blur(4px)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
};

const infoCardStyles: React.CSSProperties = {
  width: "100%",
  maxWidth: 900,
  padding: 20,
  background: "#fff",
  borderTop: "1px solid rgba(0, 0, 0, 0.06)",
  borderRadius: "0 0 12px 12px",
  margin: "-20px auto 40px",
};

const infoHeaderStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
};

const templateNameStyles: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: "#1a1a2e",
};

const badgeFreeStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  background: "#10b981",
  color: "#fff",
  borderRadius: 4,
};

const badgeProStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 10px",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  background: "#f59e0b",
  color: "#fff",
  borderRadius: 4,
};

const templateMetaStyles: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  marginBottom: 16,
};

const actionsStyles: React.CSSProperties = {
  display: "flex",
  gap: 10,
};

const primaryButtonStyles: React.CSSProperties = {
  padding: "10px 20px",
  background: "#6366f1",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 150ms ease",
};

const ghostButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  padding: 0,
  background: "transparent",
  color: "#64748b",
  border: "1px solid rgba(0, 0, 0, 0.12)",
  borderRadius: 8,
  cursor: "pointer",
  transition: "all 150ms ease",
};

const upgradeButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 24px",
  background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const closeButtonStyles: React.CSSProperties = {
  position: "absolute",
  top: 20,
  right: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 36,
  height: 36,
  padding: 0,
  background: "rgba(255, 255, 255, 0.9)",
  border: "none",
  borderRadius: "50%",
  color: "#64748b",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  transition: "all 150ms ease",
};

export default TemplatePreviewPanel;
