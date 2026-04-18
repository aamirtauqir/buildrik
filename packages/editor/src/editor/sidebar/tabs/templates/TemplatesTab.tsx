/**
 * TemplatesTab v4 — Full-page template browser matching .pen Screens 4-7.
 * Light theme, 4-column grid, pagination, inline detail panel, two-stage filtering.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Search, X } from "lucide-react";
import type { Composer } from "../../../../engine";
import { useToast } from "../../../../shared/ui/Toast";
import { type TemplateItem, SITE_CATEGORY_PILLS, SITE_TEMPLATES, TEMPLATE_TYPE_PILLS, SUB_CATEGORY_TAGS, type SiteCategory, type TemplateType } from "./templatesData";
import { clearAppliedId, recordTemplateApplied, saveAppliedId } from "./templatesStorage";
import { ReplaceModal, ProModal, CreatePageConfirmModal, CreatePageSuccessModal, CreatePageErrorModal } from "./TemplatesTabModals";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { useTemplatePersistence } from "./hooks/useTemplatePersistence";
import { useTemplateApply } from "./hooks/useTemplateApply";
import { useTemplateSelection } from "./hooks/useTemplateSelection";
import { TemplateCard } from "./components/TemplateCard";
import { TemplateDetail } from "./components/TemplateDetail";
import { TemplatePagination } from "./components/TemplatePagination";
import { ApplyProgressOverlay } from "./ApplyProgressOverlay";
import "./TemplatesTab.css";

// Re-export for external consumers
export type { TemplateItem, RecentTemplate } from "./templatesData";
export { getRecentTemplates, addRecentTemplate, getTemplateById } from "./templatesData";

export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
  onSwitchTab?: (tab: string) => void;
  onClose?: () => void;
  newPageMode?: boolean;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  composer,
  onTemplateUsed,
  onSwitchTab,
  onClose,
  newPageMode = false,
}) => {
  const { addToast } = useToast();
  const [showSearch, setShowSearch] = React.useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = React.useState(false);
  const [createResult, setCreateResult] = React.useState<"success" | "error" | null>(null);

  // ── Hooks ──
  const { appliedId, setAppliedId } = useTemplatePersistence();

  const {
    showProgress, setShowProgress,
    applyError, setApplyError,
    canRetry, setCanRetry,
    resetStyles, setResetStyles,
    hasExistingContent,
    pendingId,
    startApply,
    handleRetry,
  } = useTemplateApply(composer);

  const sel = useTemplateSelection(showProgress);

  // ── Derived ──
  const detailTemplate = sel.detailId
    ? SITE_TEMPLATES.find((t) => t.id === sel.detailId) ?? null
    : null;

  // Track whether apply is "add as new page" mode
  const addAsNewPageRef = React.useRef(false);

  // ── Handlers ──
  function handleApplyToCurrent(id: string) {
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "premium") { sel.setShowUpgrade(true); return; }
    addAsNewPageRef.current = false;
    pendingId.current = id;
    sel.setDetailId(null);
    hasExistingContent ? sel.setShowReplace(true) : startApply();
  }

  function handleAddAsNewPage(id: string) {
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "premium") { sel.setShowUpgrade(true); return; }
    addAsNewPageRef.current = true;
    pendingId.current = id;
    sel.setDetailId(null);
    if (newPageMode) {
      setShowCreateConfirm(true);
    } else {
      startApply();
    }
  }

  function handleProgressComplete() {
    setShowProgress(false);
    const id = pendingId.current;
    if (!id) return;
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (!composer) { setApplyError("Editor not ready — please reload and try again"); return; }
    if (!t.html) { setApplyError("Template has no content"); return; }

    try {
      if (addAsNewPageRef.current) {
        composer.elements.createPage(t.name);
      }
      if (resetStyles) composer.styles.clear();
      composer.elements.importHTMLToActivePage(t.html);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply";
      setCanRetry(true);
      setApplyError(msg);
      addToast({
        message: "Template apply failed — nothing was changed",
        variant: "error",
        action: { label: "Retry", onClick: handleRetry },
      });
      return;
    }

    pendingId.current = null;
    addAsNewPageRef.current = false;
    setAppliedId(null);
    requestAnimationFrame(() => {
      setAppliedId(id);
      setResetStyles(false);
      addToast({ message: `"${t.name}" applied successfully`, variant: "success" });
      recordTemplateApplied(t);
      saveAppliedId(id);
      onTemplateUsed?.();
    });
  }

  // ── Render ──
  const tName = pendingId.current
    ? (SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Template")
    : "Template";

  return (
    <div className="tpl-shell">
      {/* Header — 48px, title 18px/600 */}
      <div className="tpl-header">
        {detailTemplate ? (
          /* Breadcrumb (Screen cV3OT) */
          <div className="tpl-breadcrumb">
            <button
              className="tpl-breadcrumb-back"
              onClick={() => sel.setDetailId(null)}
              aria-label="Back to grid"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to grid</span>
            </button>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--ls-text-lighter, #94A3B8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="tpl-breadcrumb-cat">{detailTemplate.category ?? "All"}</span>
          </div>
        ) : newPageMode ? (
          <div className="tpl-newpage-header">
            <h2 className="tpl-header-title tpl-header-title--sm">Choose a template for your new page</h2>
            <div className="tpl-newpage-chip">New Page</div>
          </div>
        ) : (
          <h2 className="tpl-header-title">Templates</h2>
        )}
        <div className="tpl-header-actions">
          <button
            className="tpl-header-btn"
            onClick={() => setShowSearch(!showSearch)}
            aria-label={showSearch ? "Close search" : "Search templates"}
          >
            <Search size={16} />
          </button>
          {onClose && (
            <button className="tpl-header-btn" onClick={onClose} aria-label="Close templates">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search input */}
      {showSearch && (
        <div className="tpl-search-wrap">
          <div className="tpl-search-input-box">
            <Search size={16} className="tpl-search-icon" />
            <input
              className="tpl-search-input"
              placeholder="Search templates..."
              value={sel.searchQ}
              onChange={(e) => sel.setSearchQ(e.target.value)}
              aria-label="Search templates"
              autoFocus
            />
            {sel.searchQ.length > 0 && (
              <button
                className="tpl-search-clear"
                onClick={() => sel.setSearchQ("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <>

      {/* Filter pills — two-stage */}
      {sel.templateType === null ? (
        <div className="tpl-pills" role="tablist" aria-label="Template categories">
          {SITE_CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.id}
              className={`tpl-pill${sel.activeFilter === pill.id ? " tpl-pill--active" : ""}`}
              onClick={() => sel.setActiveFilter(pill.id)}
              role="tab"
              aria-selected={sel.activeFilter === pill.id}
            >
              {pill.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Type toggle — Page Templates / Section Templates */}
          <div className="tpl-pills" role="tablist" aria-label="Template type">
            {TEMPLATE_TYPE_PILLS.map((pill) => (
              <button
                key={pill.id}
                className={`tpl-pill${sel.templateType === pill.id ? " tpl-pill--active" : ""}`}
                onClick={() => sel.setTemplateType(pill.id)}
                role="tab"
                aria-selected={sel.templateType === pill.id}
              >
                {pill.label}
              </button>
            ))}
          </div>
          {/* Sub-category tags */}
          <div className="tpl-tags">
            {SUB_CATEGORY_TAGS.map((tag) => (
              <button
                key={tag.id}
                className={`tpl-tag${sel.subCategory === tag.id ? " tpl-tag--active" : ""}`}
                onClick={() => sel.setSubCategory(sel.subCategory === tag.id ? null : tag.id)}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Content area */}
      <div className="tpl-content">
        {sel.paginatedTemplates.length === 0 ? (
          <div className="tpl-empty">
            <Search size={32} className="tpl-empty-icon" />
            <p className="tpl-empty-text">
              {sel.searchQ.trim()
                ? `No templates found for "${sel.searchQ}"`
                : "No templates in this category"}
            </p>
            <button className="tpl-empty-btn" onClick={sel.clearAll}>
              {sel.searchQ.trim() ? "Clear search" : "Show all templates"}
            </button>
          </div>
        ) : (
          <div className={`tpl-content-inner${sel.detailId ? " tpl-content-inner--with-detail" : ""}`}>
            <div className={`tpl-grid-area${sel.detailId ? " tpl-grid-area--dimmed" : ""}`}>
              <div className="tpl-grid" role="listbox" aria-label="Available templates">
                {sel.paginatedTemplates.map((tpl) => (
                  <TemplateCard
                    key={tpl.id}
                    template={tpl}
                    isSelected={sel.detailId === tpl.id}
                    onClick={(id) => sel.setDetailId(sel.detailId === id ? null : id)}
                  />
                ))}
              </div>
            </div>
            {detailTemplate && (
              <TemplateDetail
                template={detailTemplate}
                onApplyToCurrent={handleApplyToCurrent}
                onAddAsNewPage={handleAddAsNewPage}
                onPreview={(id) => sel.setPreviewId(id)}
                onCancel={() => sel.setDetailId(null)}
              />
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <TemplatePagination
        currentPage={sel.currentPage}
        totalPages={sel.totalPages}
        onChange={sel.setCurrentPage}
      />

      </>

      {/* Error banner */}
      {applyError && (
        <div className="tpl-error-banner">
          <span>{applyError}</span>
          <div className="tpl-error-actions">
            {canRetry && (
              <button className="tpl-error-retry" onClick={handleRetry}>
                Try again
              </button>
            )}
            <button
              className="tpl-error-dismiss"
              onClick={() => { setApplyError(null); setCanRetry(false); }}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {sel.showReplace && (
        <ReplaceModal
          template={SITE_TEMPLATES.find((t) => t.id === pendingId.current) ?? SITE_TEMPLATES[0]}
          currentPageCount={composer?.elements?.getAllPages?.()?.length ?? 1}
          resetGlobalStyles={resetStyles}
          onResetChange={setResetStyles}
          onCancel={() => sel.setShowReplace(false)}
          onApply={() => { sel.setShowReplace(false); startApply(); }}
        />
      )}
      {sel.showUpgrade && (
        <ProModal
          templateName={SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Pro Template"}
          onCancel={() => sel.setShowUpgrade(false)}
          onUpgrade={() => {
            sel.setShowUpgrade(false);
            window.open("/dashboard/settings/billing", "_blank");
          }}
        />
      )}
      {showCreateConfirm && (
        <CreatePageConfirmModal
          templateName={tName}
          onCancel={() => { setShowCreateConfirm(false); addAsNewPageRef.current = false; }}
          onConfirm={() => {
            setShowCreateConfirm(false);
            startApply();
            setCreateResult("success");
          }}
        />
      )}
      {createResult === "success" && (
        <CreatePageSuccessModal
          onClose={() => { setCreateResult(null); onTemplateUsed?.(); }}
          onGoToPage={() => { setCreateResult(null); onSwitchTab?.("pages"); onTemplateUsed?.(); }}
        />
      )}
      {createResult === "error" && (
        <CreatePageErrorModal
          onCancel={() => setCreateResult(null)}
          onRetry={() => { setCreateResult(null); startApply(); }}
        />
      )}
      {showProgress && (
        <ApplyProgressOverlay templateName={tName} onComplete={handleProgressComplete} />
      )}
      {sel.previewId && (() => {
        const previewTemplate = SITE_TEMPLATES.find((t) => t.id === sel.previewId);
        if (!previewTemplate) return null;
        return (
          <TemplatePreviewModal
            template={previewTemplate}
            onBack={() => sel.setPreviewId(null)}
            onUseTemplate={(t) => { sel.setPreviewId(null); handleApplyToCurrent(t.id); }}
            hasExistingContent={hasExistingContent}
          />
        );
      })()}
    </div>
  );
};

export default TemplatesTab;
