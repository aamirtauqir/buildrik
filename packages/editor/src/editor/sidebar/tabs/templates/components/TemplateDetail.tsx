import { Button } from "@/shared/ui/Button";
/**
 * TemplateDetail — 420px side panel matching .pen Screen 6 design.
 * Preview image, title, description, and 3 action buttons.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TemplateItem } from "../templatesData";

interface TemplateDetailProps {
  template: TemplateItem;
  onApplyToCurrent: (id: string) => void;
  onAddAsNewPage: (id: string) => void;
  onPreview: (id: string) => void;
  onCancel: () => void;
  previewState?: "loading" | "error" | "ready";
  onPreviewRetry?: () => void;
}

export const TemplateDetail: React.FC<TemplateDetailProps> = ({
  template,
  onApplyToCurrent,
  onAddAsNewPage,
  onPreview,
  onCancel,
  previewState = "ready",
  onPreviewRetry,
}) => {
  return (
    <div className="tpl-detail">
      <div
        className="tpl-detail-preview"
        style={{
          background:
            previewState === "ready"
              ? (template.gradient ?? "var(--bd-bg-subtle, var(--bd-bg-subtle))")
              : "var(--bd-bg-subtle, var(--bd-bg-subtle))",
        }}
      >
        {previewState === "loading" && (
          <div className="tpl-detail-preview-state">
            <div className="tpl-apply-spinner" />
          </div>
        )}
        {previewState === "error" && (
          <div className="tpl-detail-preview-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bd-fg-secondary, var(--bd-fg-muted))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p style={{ fontSize: 11, color: "var(--bd-fg-muted, #475569)", margin: "6px 0 0", textAlign: "center" }}>
              Preview unavailable
            </p>
            {onPreviewRetry && (
              <Button className="tpl-detail-preview-retry" onClick={onPreviewRetry}>
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="tpl-detail-info">
        <h3 className="tpl-detail-title">{template.name}</h3>
        {template.description && (
          <p className="tpl-detail-desc">{template.description}</p>
        )}
        {!template.description && (
          <p className="tpl-detail-desc">
            A {template.category?.replace("-", " ") ?? "page"} template
            {template.pageCount ? ` with ${template.pageCount} pages` : ""}.
            {template.status === "premium" ? " Pro plan required." : ""}
          </p>
        )}
      </div>
      <div className="tpl-detail-buttons">
        {template.status === "premium" ? (
          <Button className="tpl-detail-btn tpl-detail-btn--primary" disabled>
            Pro Plan Required
          </Button>
        ) : (
          <>
            <Button
              className="tpl-detail-btn tpl-detail-btn--primary"
              onClick={() => onApplyToCurrent(template.id)}
            >
              Apply to Current Page
            </Button>
            <Button
              className="tpl-detail-btn tpl-detail-btn--outline"
              onClick={() => onAddAsNewPage(template.id)}
            >
              Add as New Page
            </Button>
          </>
        )}
        <Button
          className="tpl-detail-btn tpl-detail-btn--ghost"
          onClick={() => onPreview(template.id)}
        >
          Preview
        </Button>
        <Button
          className="tpl-detail-btn tpl-detail-btn--ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
