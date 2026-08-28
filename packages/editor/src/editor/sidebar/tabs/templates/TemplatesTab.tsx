/**
 * TemplatesTab v4 — Full-page template browser matching .pen Screens 4-7.
 * Light theme, 4-column grid, pagination, inline detail panel, two-stage filtering.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, useToast, Button, TextField, openUpgrade } from "@/editor/chrome-ui";
import { Search, X } from "lucide-react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { DrillInHeader } from "../../shared/DrillInHeader";
import { type TemplateItem, SITE_CATEGORY_PILLS, SITE_TEMPLATES, TEMPLATE_TYPE_PILLS, SUB_CATEGORY_TAGS, type SiteCategory, type TemplateType, DEFAULT_TEMPLATE_VERSION } from "./templatesData";
import { clearAppliedId, recordTemplateApplied, saveAppliedId } from "./templatesStorage";
import { ReplaceModal, CreatePageConfirmModal, CreatePageSuccessModal, CreatePageErrorModal } from "./TemplatesTabModals";
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
import { DrawerGallery } from "./components/DrawerGallery";
import { TemplateApplyModal } from "./components/TemplateApplyModal";
import { useTemplateUsageMap } from "./hooks/useTemplateUsageMap";
import { resolveTokens } from "./utils/resolveTemplateTokens";
import { snapshotFromComputedStyle } from "./utils/tokenSnapshot";
import { DEFAULT_TOKENS } from "../../../design-system/constants";
import { ApplyProgressOverlay, type ApplyStep } from "./ApplyProgressOverlay";
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
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  composer,
  onTemplateUsed,
  onSwitchTab,
  onClose,
  newPageMode: newPageModeProp = false,
  isExpanded,
  onExpandToggle,
}) => {
  const { addToast } = useToast();
  const [showSearch, setShowSearch] = React.useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = React.useState(false);
  const [createResult, setCreateResult] = React.useState<"success" | "error" | null>(null);

  // §6 — newPageMode is a PROP from the caller that navigated here (Pages ›
  // "From template" via LeftSidebar). It used to be an event, and the event
  // could never be heard: TabRouter mounts one tab at a time, so this panel's
  // listener did not exist yet when the emit fired — the gallery mode, whose
  // apply REPLACES the current page, showed every time. LeftSidebar owns the
  // reset (mode ends when the visit leaves Templates).
  const newPageMode = newPageModeProp;

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

  /** The drawer's preview modal (board 642:2556). */
  const [applyPreviewId, setApplyPreviewId] = React.useState<string | null>(null);

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
    if (t.status === "premium") { openUpgrade({ feature: t.name }); return; }
    addAsNewPageRef.current = false;
    pendingId.current = id;
    sel.setDetailId(null);
    hasExistingContent ? sel.setShowReplace(true) : startApply();
  }

  function handleAddAsNewPage(id: string) {
    if (denyApply()) return;
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "premium") { openUpgrade({ feature: t.name }); return; }
    addAsNewPageRef.current = true;
    pendingId.current = id;
    sel.setDetailId(null);
    if (newPageMode) {
      setShowCreateConfirm(true);
    } else {
      startApply();
    }
  }

  /* The stages the apply actually runs, in the order it runs them. The
     overlay used to tick these off on timers while the whole apply happened
     afterwards in one blocking call — so every step read "done" before any of
     it had been done. */
  const APPLY_STEPS: ReadonlyArray<{ id: string; label: string }> = [
    { id: "tokens", label: "Resolving brand tokens" },
    { id: "import", label: "Importing template HTML" },
    { id: "render", label: "Rendering on canvas" },
    { id: "save", label: "Saving applied state" },
  ];
  const [applyStepIndex, setApplyStepIndex] = React.useState(0);
  const applyCancelledRef = React.useRef(false);
  const applyRunningRef = React.useRef(false);
  /** Cancel is only honest before the import has landed. */
  const [applyCancellable, setApplyCancellable] = React.useState(true);

  const applySteps: ApplyStep[] = APPLY_STEPS.map((s, i) => ({
    ...s,
    state: i < applyStepIndex ? "done" : i === applyStepIndex ? "active" : "queued",
  }));

  /** Let React paint the step that just changed before the next one runs. */
  const paint = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

  async function runApply() {
    const id = pendingId.current;
    if (!id) return;
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    // P2 fix (codex A6): capture newPageMode flag BEFORE null reset; needed for
    // success/error modal routing below.
    const wasNewPageMode = addAsNewPageRef.current;
    if (!composer) {
      setShowProgress(false);
      setApplyError("Editor not ready — please reload and try again");
      if (wasNewPageMode) setCreateResult("error");
      return;
    }
    if (!t.html) {
      setShowProgress(false);
      setApplyError("Template has no content");
      if (wasNewPageMode) setCreateResult("error");
      return;
    }

    try {
      // 1 — tokens
      setApplyStepIndex(0);
      await paint();
      // P3 phase 2: resolve `{{token.kind.name}}` placeholders against the
      // current Design System (read from :root computed style) before
      // sanitize+import. Templates without placeholders pass through
      // unchanged — regex misses leave content verbatim.
      const snapshot = snapshotFromComputedStyle(document.documentElement, DEFAULT_TOKENS);
      const resolvedHtml = resolveTokens(t.html, snapshot);
      if (applyCancelledRef.current) { setShowProgress(false); return; }

      // 2 — import. Past this point the page has changed, so Cancel stops
      // being offered rather than promising an undo it cannot do.
      setApplyStepIndex(1);
      await paint();
      if (wasNewPageMode) {
        /* Switch to the page we just made BEFORE importing. `createPage`
           adopts the new page only when there is no active one
           (PageManager:87), so on any real site the import below landed on
           the page the user was looking at: asking for the template as a NEW
           page replaced the page they were on, and left the new one empty.
           Walked live — Page 1 held "SaaS Landing", "Add as new page" with
           Portfolio, and Page 1 came back as Portfolio. */
        const created = composer.elements.createPage(t.name);
        composer.elements.setActivePage?.(created.id);
      }
      if (resetStyles) composer.styles.clear();
      setApplyCancellable(false);
      composer.elements.importHTMLToActivePage(resolvedHtml);

      // 3 — the canvas re-render the import triggers
      setApplyStepIndex(2);
      await paint();
      await paint();
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
      setShowProgress(false);
      return;
    }

    // 4 — bookkeeping
    setApplyStepIndex(3);
    await paint();

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
    setApplyStepIndex(APPLY_STEPS.length);
    await paint();
    setShowProgress(false);
  }

  /* One run per showProgress window, whichever entry point opened it —
     card preview, expanded gallery, or the create-page confirm. */
  React.useEffect(() => {
    if (!showProgress) {
      applyRunningRef.current = false;
      return;
    }
    if (applyRunningRef.current) return;
    applyRunningRef.current = true;
    applyCancelledRef.current = false;
    setApplyCancellable(true);
    setApplyStepIndex(0);
    void runApply();
    // runApply is redefined every render; the ref guard is what makes this
    // fire once per window, so the dep list is deliberately just the flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProgress]);

  // ── Render ──
  // Compact drawer (board 641:2487) vs the full grid: detail, new-page and
  // the expanded 700 view keep the pre-existing layout.
  const showFull = Boolean(detailTemplate) || newPageMode || Boolean(isExpanded);
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
        /* PanelFrame.Header renders `actions`, never children — the chip and
           the close button sat here as children and were dropped on the floor,
           so the new-page header (board 807:7252) shipped without its "New
           Page" chip and, alone among the three headers, without a way out. */
        <PanelFrame.Header
          title="Choose a template for your new page"
          onClose={onClose}
          actions={<span className="tpl-newpage-chip">New Page</span>}
        />
      ) : (
        <PanelFrame.Header
          title="Templates"
          subtitle={showFull ? `${SITE_TEMPLATES.length} templates` : undefined}
          isExpanded={isExpanded}
          onExpandToggle={onExpandToggle}
          onClose={onClose}
        >
          {showFull && (
            <Button
              className="tpl-header-btn"
              onClick={() => setShowSearch(!showSearch)}
              aria-label={showSearch ? "Close search" : "Search templates"}
            >
              <Search size={16} />
            </Button>
          )}
        </PanelFrame.Header>
      )}
      {/* Board 641:2487: at 320 the drawer shows the compact gallery — page
          cards + section rows + Browse-all (which expands to this full view).
          The full grid/pills/pagination survive as the EXPANDED (700) and
          detail/new-page layouts. */}
      {/* Board 642:2556: a card in the drawer opens the preview modal. It used
          to set detailId, which widened the panel to 700 and swapped in the
          expanded gallery's detail pane — a different surface, with three
          apply buttons and no statement of what applying replaces. */}
      {!showFull ? (
        <DrawerGallery
          searchQ={sel.searchQ}
          onSearchChange={sel.setSearchQ}
          onOpenTemplate={setApplyPreviewId}
          onBrowseAll={onExpandToggle}
        />
      ) : (
      <>
      {/* Search input */}
      {showSearch && (
        <div className="tpl-search-wrap">
          <div className="tpl-search-input-box">
            <Search size={16} className="tpl-search-icon" />
            <TextField
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
      </>
      )}
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
                const backup = composer.elements.duplicatePage(active.id);
                /* Name it what the checkbox PROMISED. `duplicatePage` names its
                   output "<name> Copy", which is also exactly what the Pages
                   menu's Duplicate produces — so the backup was
                   indistinguishable from an ordinary duplicate, while the hint
                   above it said `Keeps your work as "Home (backup)"`. The
                   suffix is numbered on collision so a second backup does not
                   overwrite the first in the reader's eye. */
                if (backup) {
                  const taken = new Set(
                    composer.elements.getAllPages().map((p) => p.name),
                  );
                  let name = `${active.name} (backup)`;
                  for (let n = 2; taken.has(name); n++) name = `${active.name} (backup ${n})`;
                  composer.elements.updatePage(backup.id, { name });
                }
              }
            }
            startApply();
          }}
        />
        );
      })()}
      {showCreateConfirm && (
        <CreatePageConfirmModal
          templateName={tName}
          /* The new page takes the template's name — createPage(t.name). */
          newPageName={tName}
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
          pageName={tName}
          onClose={() => { setCreateResult(null); onTemplateUsed?.(); }}
          onOpenPageSettings={() => {
            setCreateResult(null);
            onSwitchTab?.("pages");
            /* Page settings is local state inside PagesTab, so the ask goes
               through the composer (UI_PAGES_OPEN_SETTINGS). Without this the
               button opened the Pages list and left the user to find the
               page they had just made. */
            const active = composer?.elements.getActivePage?.();
            if (active) composer?.emit(EVENTS.UI_PAGES_OPEN_SETTINGS, { pageId: active.id });
            onTemplateUsed?.();
          }}
        />
      )}
      {createResult === "error" && (
        <CreatePageErrorModal
          reason={applyError ?? undefined}
          onCancel={() => setCreateResult(null)}
          onRetry={() => { setCreateResult(null); startApply(); }}
        />
      )}
      {showProgress && (
        <ApplyProgressOverlay
          templateName={tName}
          steps={applySteps}
          onCancel={
            applyCancellable
              ? () => {
                  applyCancelledRef.current = true;
                  setShowProgress(false);
                }
              : undefined
          }
        />
      )}
      {/* Board 642:2556 — what a drawer card opens. Applying goes through the
          same gate as every other entry point (premium check, then the replace
          confirm when the page already has content). */}
      <TemplateApplyModal
        open={!!applyPreviewId}
        template={SITE_TEMPLATES.find((t) => t.id === applyPreviewId) ?? null}
        pageName={activePageInfo?.name}
        onClose={() => setApplyPreviewId(null)}
        onApply={(t) => {
          setApplyPreviewId(null);
          handleApplyToCurrent(t.id);
        }}
      />
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
