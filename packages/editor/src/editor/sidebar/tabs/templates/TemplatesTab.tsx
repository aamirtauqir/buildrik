/**
 * TemplatesTab v4 — Full-page template browser matching .pen Screens 4-7.
 * Light theme, 4-column grid, pagination, inline detail panel, two-stage filtering.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Input, PanelFrame, useToast } from "@/editor/ui";
import { Search, X } from "lucide-react";
import type { Composer } from "../../../../engine";
import { DrillInHeader } from "../../shared/DrillInHeader";
import { type TemplateItem, SITE_CATEGORY_PILLS, SITE_TEMPLATES, TEMPLATE_TYPE_PILLS, SUB_CATEGORY_TAGS, type SiteCategory, type TemplateType, DEFAULT_TEMPLATE_VERSION } from "./templatesData";
import { clearAppliedId, recordTemplateApplied, saveAppliedId } from "./templatesStorage";
import { ReplaceModal, ProModal, CreatePageConfirmModal, CreatePageSuccessModal, CreatePageErrorModal } from "./TemplatesTabModals";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";
import { roleAtLeast } from "@/services/RoleService";
import { useTemplatePersistence } from "./hooks/useTemplatePersistence";
import { useTemplateApply } from "./hooks/useTemplateApply";
import { useTemplateSelection } from "./hooks/useTemplateSelection";
import { TemplateCard } from "./components/TemplateCard";
import { TemplateDetail } from "./components/TemplateDetail";
import { TemplatePagination } from "./components/TemplatePagination";
import { TemplateUsageDrawer } from "./components/TemplateUsageDrawer";
import { useTemplateUsageMap } from "./hooks/useTemplateUsageMap";
import { resolveTokens } from "./utils/resolveTemplateTokens";
import { snapshotFromComputedStyle } from "./utils/tokenSnapshot";
import { DEFAULT_TOKENS } from "../../../design-system/constants";
import { ApplyProgressOverlay } from "./ApplyProgressOverlay";
import "./TemplatesTab.css";
import { Button } from "flowbite-react";

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
  newPageMode: newPageModeProp = false,
}) => {
  const { addToast } = useToast();
  const [showSearch, setShowSearch] = React.useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = React.useState(false);
  const [createResult, setCreateResult] = React.useState<"success" | "error" | null>(null);

  // §6 — newPageMode can be activated externally via composer event so any
  // future caller (Pages tab "Add page from template", rail action, etc.)
  // can flip the templates panel into "new page" mode without prop-drilling.
  const [newPageModeInternal, setNewPageModeInternal] = React.useState(false);
  const newPageMode = newPageModeProp || newPageModeInternal;
  React.useEffect(() => {
    if (!composer) return;
    const enable = () => setNewPageModeInternal(true);
    const disable = () => setNewPageModeInternal(false);
    composer.on("ui:templates-newpage-on", enable);
    composer.on("ui:templates-newpage-off", disable);
    return () => {
      composer.off("ui:templates-newpage-on", enable);
      composer.off("ui:templates-newpage-off", disable);
    };
  }, [composer]);

  // ── Hooks ──
  const { appliedId, setAppliedId } = useTemplatePersistence();

  // Phase -1: hydrate appliedId from active page's meta.appliedTemplates on
  // mount + page-switch. Page meta is the durable source (survives reload +
  // cross-device); sessionStorage is the in-tab fallback the hook reads.
  React.useEffect(() => {
    if (!composer) return;
    const syncFromPageMeta = () => {
      const active = composer.elements.getActivePage();
      const stack = active?.meta?.appliedTemplates;
      const latest = stack && stack.length > 0 ? stack[stack.length - 1] : null;
      if (latest?.templateId) setAppliedId(latest.templateId);
    };
    syncFromPageMeta();
    composer.on("project:changed", syncFromPageMeta);
    return () => {
      composer.off("project:changed", syncFromPageMeta);
    };
  }, [composer, setAppliedId]);

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

  // P2 fix (codex A4): backup-current-page checkbox state for ReplaceModal.
  // When checked, apply path duplicates the current page as "<Name> (backup)"
  // before replacing content.
  const [backupCurrentPage, setBackupCurrentPage] = React.useState(false);

  // ── Derived ──
  const detailTemplate = sel.detailId
    ? SITE_TEMPLATES.find((t) => t.id === sel.detailId) ?? null
    : null;

  // S9: aggregate usage across pages from page.meta.appliedTemplates.
  const usageMap = useTemplateUsageMap(composer);
  const [usageDrawerOpen, setUsageDrawerOpen] = React.useState(false);
  const detailUsage = detailTemplate ? usageMap.get(detailTemplate.id) : [];

  // prototype-v3 §2: surface current page name + applied-here state to TemplateDetail.
  const activePageInfo = composer?.elements?.getActivePage?.();
  const detailAppliedToCurrent =
    !!activePageInfo && !!detailUsage?.some((u) => u.pageId === activePageInfo.id);

  // prototype-v3 §2 — emit panel width override based on detail mode.
  // 320 (default) when no card selected, 700 (320 grid + 380 detail) when
  // a card is selected. LeftSidebar listens and widens the panel.
  React.useEffect(() => {
    if (!composer) return;
    composer.emit("ui:templates-panel-width", {
      width: sel.detailId ? 700 : 320,
      expanded: !!sel.detailId,
    });
    return () => {
      composer.emit("ui:templates-panel-width", {
        width: 320,
        expanded: false,
      });
    };
  }, [composer, sel.detailId]);

  const handleJumpToPage = React.useCallback(
    (pageId: string) => {
      composer?.elements.setActivePage?.(pageId);
      setUsageDrawerOpen(false);
    },
    [composer]
  );

  // Track whether apply is "add as new page" mode
  const addAsNewPageRef = React.useRef(false);

  // P6 permissions boards: applying a template rewrites the whole page —
  // admin-scoped. Non-admins get the reason, not a silent no-op.
  const canApplyTemplate = roleAtLeast(useEditorRole(), "ADMIN") !== false;
  function denyApply(): boolean {
    if (canApplyTemplate) return false;
    addToast({ description: "Only an admin can apply a template", tone: "warning" });
    return true;
  }

  // ── Handlers ──
  function handleApplyToCurrent(id: string) {
    if (denyApply()) return;
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "premium") { sel.setShowUpgrade(true); return; }
    addAsNewPageRef.current = false;
    pendingId.current = id;
    sel.setDetailId(null);
    hasExistingContent ? sel.setShowReplace(true) : startApply();
  }

  function handleAddAsNewPage(id: string) {
    if (denyApply()) return;
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
    // P2 fix (codex A6): capture newPageMode flag BEFORE null reset; needed for
    // success/error modal routing below.
    const wasNewPageMode = addAsNewPageRef.current;
    if (!composer) {
      setApplyError("Editor not ready — please reload and try again");
      if (wasNewPageMode) setCreateResult("error");
      return;
    }
    if (!t.html) {
      setApplyError("Template has no content");
      if (wasNewPageMode) setCreateResult("error");
      return;
    }

    try {
      if (wasNewPageMode) {
        composer.elements.createPage(t.name);
      }
      if (resetStyles) composer.styles.clear();
      // P3 phase 2: resolve `{{token.kind.name}}` placeholders against the
      // current Design System (read from :root computed style) before
      // sanitize+import. Templates without placeholders pass through
      // unchanged — regex misses leave content verbatim.
      const snapshot = snapshotFromComputedStyle(document.documentElement, DEFAULT_TOKENS);
      const resolvedHtml = resolveTokens(t.html, snapshot);
      composer.elements.importHTMLToActivePage(resolvedHtml);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply";
      setCanRetry(true);
      setApplyError(msg);
      addToast({
        description: "Template apply failed — nothing was changed",
        tone: "error",
        action: { label: "Retry", onClick: handleRetry },
      });
      // P2 fix (codex A6): error path must set createResult so CreatePageErrorModal
      // renders (it was previously never reachable; success was fired prematurely
      // from onConfirm, so error-state was dead).
      if (wasNewPageMode) setCreateResult("error");
      return;
    }

    // P2 fix (codex A6): success modal now fires AFTER actual page creation +
    // HTML import, not on confirm-click. Renders only in newPage flow.
    if (wasNewPageMode) setCreateResult("success");

    pendingId.current = null;
    addAsNewPageRef.current = false;
    setAppliedId(null);
    requestAnimationFrame(() => {
      setAppliedId(id);
      setResetStyles(false);
      addToast({ description: `"${t.name}" applied successfully`, tone: "success" });
      recordTemplateApplied(t);
      saveAppliedId(id);
      // Phase -1: persist applied-template state on Page.meta so it survives reload
      // + cross-device. sessionStorage path is the legacy fallback for offline.
      const activePage = composer?.elements.getActivePage();
      if (activePage) {
        composer!.elements.recordAppliedTemplate(activePage.id, {
          templateId: id,
          // P9: capture the template's version at apply time. Future
          // bumps surface "update available" via TemplateUsageDrawer's
          // Versions tab.
          version: t.version ?? DEFAULT_TEMPLATE_VERSION,
        });
      }
      onTemplateUsed?.();
    });
  }

  // ── Render ──
  const tName = pendingId.current
    ? (SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Template")
    : "Template";

  return (
    <PanelFrame className="tpl-shell">
      {/* Header — 3 modes via TabFrame.Header / DrillInHeader. Breadcrumb
          mode uses the canonical drill-in pattern (back button + path);
          newpage + default modes use the standard panel header. */}
      {detailTemplate ? (
        <DrillInHeader
          title={detailTemplate.name}
          parentName="Templates"
          breadcrumb={[
            (detailTemplate.category || "Templates").replace(/-/g, " "),
            detailTemplate.name,
          ]}
          onBack={() => sel.setDetailId(null)}
          onClose={onClose}
        />
      ) : newPageMode ? (
        <PanelFrame.Header title="Choose a template for your new page">
          <div className="tpl-newpage-chip">New Page</div>
          {onClose && (
            <Button className="tpl-header-btn" onClick={onClose} aria-label="Close templates">
              <X size={16} />
            </Button>
          )}
        </PanelFrame.Header>
      ) : (
        <PanelFrame.Header
          title="Templates"
          subtitle={`${SITE_TEMPLATES.length} templates`}
          onClose={onClose}
        >
          <Button
            className="tpl-header-btn"
            onClick={() => setShowSearch(!showSearch)}
            aria-label={showSearch ? "Close search" : "Search templates"}
          >
            <Search size={16} />
          </Button>
        </PanelFrame.Header>
      )}
      {/* Search input */}
      {showSearch && (
        <div className="tpl-search-wrap">
          <div className="tpl-search-input-box">
            <Search size={16} className="tpl-search-icon" />
            <Input
              className="tpl-search-input"
              placeholder="Search templates..."
              value={sel.searchQ}
              onChange={(e) => sel.setSearchQ(e.target.value)}
              aria-label="Search templates"
              autoFocus
            />
            {sel.searchQ.length > 0 && (
              <Button
                className="tpl-search-clear"
                onClick={() => sel.setSearchQ("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </div>
      )}
      <>

      {/* Filter pills — two-stage */}
      {sel.templateType === null ? (
        <div className="tpl-pills" role="tablist" aria-label="Template categories">
          {SITE_CATEGORY_PILLS.map((pill) => (
            <Button
              key={pill.id}
              className={`tpl-pill${sel.activeFilter === pill.id ? " tpl-pill--active" : ""}`}
              onClick={() => sel.setActiveFilter(pill.id)}
              role="tab"
              aria-selected={sel.activeFilter === pill.id}
            >
              {pill.label}
            </Button>
          ))}
        </div>
      ) : (
        <>
          {/* Type toggle — Page Templates / Section Templates */}
          <div className="tpl-pills" role="tablist" aria-label="Template type">
            {TEMPLATE_TYPE_PILLS.map((pill) => (
              <Button
                key={pill.id}
                className={`tpl-pill${sel.templateType === pill.id ? " tpl-pill--active" : ""}`}
                onClick={() => sel.setTemplateType(pill.id)}
                role="tab"
                aria-selected={sel.templateType === pill.id}
              >
                {pill.label}
              </Button>
            ))}
          </div>
          {/* Sub-category tags */}
          <div className="tpl-tags">
            {SUB_CATEGORY_TAGS.map((tag) => (
              <Button
                key={tag.id}
                className={`tpl-tag${sel.subCategory === tag.id ? " tpl-tag--active" : ""}`}
                onClick={() => sel.setSubCategory(sel.subCategory === tag.id ? null : tag.id)}
              >
                {tag.label}
              </Button>
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
            <Button className="tpl-empty-btn" onClick={sel.clearAll}>
              {sel.searchQ.trim() ? "Clear search" : "Show all templates"}
            </Button>
          </div>
        ) : (
          <>
            <div className={`tpl-detail-layout${detailTemplate ? " tpl-detail-layout--split" : ""}`}>
              <div className="tpl-grid-area">
                {sel.searchQ.trim() && (
                  <div className="tpl-search-results-count" aria-live="polite">
                    {sel.filteredTemplates.length} result{sel.filteredTemplates.length === 1 ? "" : "s"} for &ldquo;{sel.searchQ.trim()}&rdquo;
                  </div>
                )}
                <div className="tpl-grid" role="listbox" aria-label="Available templates">
                  {sel.paginatedTemplates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      template={tpl}
                      isSelected={sel.detailId === tpl.id}
                      isApplied={appliedId === tpl.id}
                      onClick={(id) => sel.setDetailId(sel.detailId === id ? null : id)}
                      highlightQuery={sel.searchQ.trim() || undefined}
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
                  usageCount={detailUsage.length}
                  onShowUsage={() => setUsageDrawerOpen(true)}
                  currentPageName={activePageInfo?.name}
                  appliedToCurrentPage={detailAppliedToCurrent}
                />
              )}
            </div>
            {detailTemplate && (
              <TemplateUsageDrawer
                open={usageDrawerOpen}
                onOpenChange={setUsageDrawerOpen}
                templateId={detailTemplate.id}
                templateName={detailTemplate.name}
                usage={detailUsage}
                onJumpToPage={handleJumpToPage}
                currentVersion={detailTemplate.version ?? DEFAULT_TEMPLATE_VERSION}
                onOpenPreview={() => {
                  setUsageDrawerOpen(false);
                  sel.setPreviewId(detailTemplate.id);
                }}
              />
            )}
          </>
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
              <Button className="tpl-error-retry" onClick={handleRetry}>
                Try again
              </Button>
            )}
            <Button
              className="tpl-error-dismiss"
              onClick={() => { setApplyError(null); setCanRetry(false); }}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      )}
      {/* Modals */}
      {sel.showReplace && (() => {
        const activePage = composer?.elements?.getActivePage?.();
        const activePageElement = activePage ? composer?.elements?.getElement?.(activePage.root.id) : undefined;
        const elementCount = activePageElement?.getDescendants?.()?.length ?? 0;
        return (
        <ReplaceModal
          template={SITE_TEMPLATES.find((t) => t.id === pendingId.current) ?? SITE_TEMPLATES[0]}
          currentPageName={activePage?.name}
          currentPageCount={elementCount}
          resetGlobalStyles={resetStyles}
          onResetChange={setResetStyles}
          backupCurrentPage={backupCurrentPage}
          onBackupChange={setBackupCurrentPage}
          onCancel={() => sel.setShowReplace(false)}
          onApply={() => {
            sel.setShowReplace(false);
            // P2 fix (codex A4): if user opted in, duplicate current page first.
            if (backupCurrentPage && composer) {
              const active = composer.elements.getActivePage();
              if (active) {
                composer.elements.duplicatePage(active.id);
              }
            }
            startApply();
          }}
        />
        );
      })()}
      {sel.showUpgrade && (
        <ProModal
          templateName={SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Pro Template"}
          onCancel={() => sel.setShowUpgrade(false)}
          onUpgrade={() => {
            sel.setShowUpgrade(false);
            // Billing lives at /dashboard/settings/billing (IA v2 route merge).
            window.open("/dashboard/settings/billing", "_blank");
          }}
        />
      )}
      {showCreateConfirm && (
        <CreatePageConfirmModal
          templateName={tName}
          onCancel={() => { setShowCreateConfirm(false); addAsNewPageRef.current = false; }}
          onConfirm={() => {
            // P2 fix (codex A6): startApply only — success/error result is set
            // inside handleProgressComplete after the actual page creation.
            setShowCreateConfirm(false);
            startApply();
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
    </PanelFrame>
  );
};

export default TemplatesTab;
