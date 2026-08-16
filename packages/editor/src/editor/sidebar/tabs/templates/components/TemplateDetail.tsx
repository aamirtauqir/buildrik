/**
 * TemplateDetail — inline detail panel (prototype-v3 §2).
 *
 * Layout (top → bottom):
 *  - Breadcrumb row: "‹ Back  Category › Type" + close ✕
 *  - Preview block (gradient bg) with optional APPLIED HERE badge
 *  - Title + description
 *  - 3 meta pills: TYPE · FREE/PRO · (Used in N pages — when usage present)
 *  - APPLY TO section label
 *  - Buttons: Apply to current page / Add as new page (outline) / Preview full-screen (ghost)
 *  - Info note: replacing current page content
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TemplateItem } from "../templatesData";
import { Button } from "@/editor/chrome-ui";

interface TemplateDetailProps {
  template: TemplateItem;
  onApplyToCurrent: (id: string) => void;
  onAddAsNewPage: (id: string) => void;
  onPreview: (id: string) => void;
  /** S9: count of pages this template is applied to (drives "Used in" link). */
  usageCount?: number;
  /** S9: open the Used in / Versions drawer. */
  onShowUsage?: () => void;
  /** Current page name — used in primary CTA label "Apply to current page (PageName)"
   *  and info note "Replacing current PageName page content".
   *  Falls back to "current page" if not provided. */
  currentPageName?: string;
  /** True when this template is currently applied to the active page (shows
   *  APPLIED HERE badge on the preview). */
  appliedToCurrentPage?: boolean;
}

export const TemplateDetail: React.FC<TemplateDetailProps> = ({
  template,
  onApplyToCurrent,
  onAddAsNewPage,
  onPreview,
  usageCount,
  onShowUsage,
  currentPageName,
  appliedToCurrentPage,
}) => {
  const isPremium = template.status === "premium";
  const rawType = template.type || template.category || "Template";
  const typeLabel = rawType.charAt(0).toUpperCase() + rawType.slice(1).replace(/-/g, " ");
  const statusLabel = isPremium ? "Pro" : "Free";
  const pageName = currentPageName || "current page";

  return (
    <div className="tpl-detail">
      {/* Preview block. A template's preview is `template.gradient` — a CSS
          gradient rendered synchronously from a static module array. It has no
          fetch, so it cannot be loading and cannot fail; the loading/error/retry
          states that used to live here were unreachable in every render. The
          gallery-list loading + load-error states the boards DO specify
          (778:4102, 781:4372) are a different surface and still unbuilt — they
          need a server-backed catalog before they can mean anything. */}
      <div
        className="tpl-detail-preview"
        style={{ background: template.gradient ?? "var(--bk-bg-subtle)" }}
      >
        {appliedToCurrentPage && (
          <span className="tpl-detail-applied-badge">APPLIED HERE</span>
        )}
      </div>

      {/* Title + description */}
      <div className="tpl-detail-info">
        <h3 className="tpl-detail-title">{template.name}</h3>
        {template.description && (
          <p className="tpl-detail-desc">{template.description}</p>
        )}
        {!template.description && (
          <p className="tpl-detail-desc">
            A {template.category?.replace("-", " ") ?? "page"} template
            {template.pageCount ? ` with ${template.pageCount} pages` : ""}
            {isPremium ? " — Pro plan required." : "."}
          </p>
        )}
      </div>

      {/* Meta pills */}
      <div className="tpl-detail-meta">
        <span className="tpl-detail-meta-pill tpl-detail-meta-pill--type">{typeLabel}</span>
        <span className={`tpl-detail-meta-pill tpl-detail-meta-pill--${isPremium ? "pro" : "free"}`}>
          {statusLabel}
        </span>
        {usageCount !== undefined && usageCount > 0 && onShowUsage && (
          <Button
            className="tpl-detail-meta-pill tpl-detail-meta-pill--usage"
            onClick={onShowUsage}
            type="button"
          >
            Used in {usageCount} {usageCount === 1 ? "page" : "pages"} →
          </Button>
        )}
      </div>

      {/* Apply-to section */}
      <div className="tpl-detail-section-label">Apply to</div>
      <div className="tpl-detail-buttons">
        {isPremium ? (
          <Button
            className="tpl-detail-btn tpl-detail-btn--primary"
            onClick={() => onApplyToCurrent(template.id)}
          >
            🔒 Upgrade to use
          </Button>
        ) : (
          <>
            <Button
              className="tpl-detail-btn tpl-detail-btn--primary"
              onClick={() => onApplyToCurrent(template.id)}
            >
              Apply to current page ({pageName})
            </Button>
            <Button
              className="tpl-detail-btn tpl-detail-btn--outline"
              onClick={() => onAddAsNewPage(template.id)}
            >
              Add as new page
            </Button>
          </>
        )}
        <Button
          className="tpl-detail-btn tpl-detail-btn--ghost"
          onClick={() => onPreview(template.id)}
        >
          Preview full-screen
        </Button>
      </div>

      {/* Info note */}
      {!isPremium && (
        <div className="tpl-detail-info-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>
            Replacing current {pageName} page content.{" "}
            <Button
              color="light"
              size="xs"
              className="tpl-detail-info-note-link tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
              onClick={() => onAddAsNewPage(template.id)}
            >
              Add as new page instead?
            </Button>
          </span>
        </div>
      )}
    </div>
  );
};
