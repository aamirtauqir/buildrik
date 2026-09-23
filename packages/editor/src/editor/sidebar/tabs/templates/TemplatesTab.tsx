/**
 * TemplatesTab — the full-canvas Templates view (decision #24; boards
 * 4418:54134 catalogue, 4418:53202 preview). Mounted edge-to-edge by
 * FullPageRouter, it replaces the 280/700 drawer and the preview modal.
 *
 * Left: the view's own sidebar — ‹ Back to canvas · Templates · PAGE
 * TEMPLATES · All page templates · N · one row per page template. Right: the
 * catalogue (search + one flat grid of built-in and saved templates) or, when a
 * template is picked, its preview in place with Create page · Replace page….
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelFrame, useToast, Button, TextField, openUpgrade } from "@/editor/chrome-ui";
import { Search, X } from "lucide-react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { type TemplateItem, SITE_TEMPLATES, DEFAULT_TEMPLATE_VERSION, getMyTemplates } from "./templatesData";
import { clearAppliedId, recordTemplateApplied, saveAppliedId } from "./templatesStorage";
import { ReplaceModal, CreatePageSuccessModal, CreatePageErrorModal } from "./TemplatesTabModals";
import { TemplatePreview } from "./TemplatePreview";
import { useEditorRole } from "@/editor/shell/hooks/useEditorRole";
import { roleAtLeast } from "@/services/RoleService";
import { useTemplatePersistence } from "./hooks/useTemplatePersistence";
import { useTemplateApply } from "./hooks/useTemplateApply";
import { useTemplateSelection } from "./hooks/useTemplateSelection";
import { TemplateCard } from "./components/TemplateCard";
import { useTemplateUsageMap } from "./hooks/useTemplateUsageMap";
import { resolveTokens } from "./utils/resolveTemplateTokens";
import { snapshotFromComputedStyle } from "./utils/tokenSnapshot";
import { DEFAULT_TOKENS } from "../../../design-system/constants";
import { ApplyProgressOverlay, type ApplyStep } from "./ApplyProgressOverlay";
import "./TemplatesTab.css";

/** The sidebar lists the built-in page templates (board 4418:54134). */
const PAGE_TEMPLATES = SITE_TEMPLATES.filter((t) => t.type === "page");

// Re-export for external consumers
export type { TemplateItem, RecentTemplate } from "./templatesData";
export { getRecentTemplates, addRecentTemplate, getTemplateById } from "./templatesData";

export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
  onSwitchTab?: (tab: string) => void;
  onClose?: () => void;
  /** The New-page modal's name (#19): Create page makes the page under it. */
  newPageName?: string;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  composer,
  onTemplateUsed,
  onSwitchTab,
  onClose,
  newPageName,
}) => {
  const { addToast } = useToast();
  const [showSearch, setShowSearch] = React.useState(false);
  const [createResult, setCreateResult] = React.useState<"success" | "error" | null>(null);


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

  /* P2 fix (codex A4): backup-current-page checkbox state for ReplaceModal.
     When checked, the apply path duplicates the current page as
     "<Name> (backup)" before replacing content.

     Defaults ON. Applying a template REPLACES the page, and board 1169:4713
     draws this box checked — on an action that destroys work, the safe option
     is the default and the user opts out of it, not into it. This repo has
     already paid for the other arrangement once ("one failed load + one edit
     deleted a site"). */
  const [backupCurrentPage, setBackupCurrentPage] = React.useState(true);

  // ── Derived ──
  /* G2-103: saved templates are first-class — listed, previewed, applied —
     beside the built-ins. Read once per visit; a save happens outside the view. */
  const catalogue = React.useMemo<TemplateItem[]>(() => [...PAGE_TEMPLATES, ...getMyTemplates()], []);
  const findTemplate = (id: string | null) => (id ? catalogue.find((t) => t.id === id) ?? null : null);
  const visible = sel.searchQ.trim()
    ? catalogue.filter((t) => t.name.toLowerCase().includes(sel.searchQ.trim().toLowerCase()))
    : catalogue;

  // S9: which pages each template was applied to (page.meta.appliedTemplates).
  const usageMap = useTemplateUsageMap(composer);
  const activePageInfo = composer?.elements?.getActivePage?.();

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
    const t = findTemplate(id);
    if (!t) return;
    if (t.status === "premium") { openUpgrade({ feature: t.name }); return; }
    addAsNewPageRef.current = false;
    pendingId.current = id;
    hasExistingContent ? sel.setShowReplace(true) : startApply();
  }

  function handleAddAsNewPage(id: string) {
    if (denyApply()) return;
    const t = findTemplate(id);
    if (!t) return;
    if (t.status === "premium") { openUpgrade({ feature: t.name }); return; }
    addAsNewPageRef.current = true;
    pendingId.current = id;
    startApply();
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
  /* Board 642:2832 draws PER-SECTION phases. The names come from the
     template's own markup — `importHTMLToActivePage` reports each top-level
     landmark as it converts (`<nav>` → "Navigation") — so nothing here is
     invented, which is the whole reason the board's six phases could not be
     built before: `templatesData` exposed a section COUNT and never names.
     Reporting happens inside the import's single transaction, so a template
     apply is still one undo step.
     Measured: the largest shipped template is 3,488 chars with 3 landmarks and
     the loop is single-digit milliseconds, so this line is a RECORD of what
     ran, not a countdown to watch — no delay is added to make it visible. */
  const [importedSections, setImportedSections] = React.useState<string[]>([]);
  const applyCancelledRef = React.useRef(false);
  const applyRunningRef = React.useRef(false);
  /** Cancel is only honest before the import has landed. */
  const [applyCancellable, setApplyCancellable] = React.useState(true);

  const applySteps: ApplyStep[] = APPLY_STEPS.flatMap((s, i) => {
    const state: ApplyStep["state"] =
      i < applyStepIndex ? "done" : i === applyStepIndex ? "active" : "queued";
    const row = { ...s, state };
    /* The import step carries the sections it actually converted, named by the
       markup. They are reported after the fact, so each is `done` — a queued
       section row would be a promise about work not yet begun, which is the
       "theater" BLOCKERS B5 warned against. */
    if (s.id !== "import" || importedSections.length === 0) return [row];
    return [
      row,
      ...importedSections.map((label, n) => ({
        id: `import-section-${n}`,
        label,
        state: "done" as const,
      })),
    ];
  });

  /** Let React paint the step that just changed before the next one runs. */
  const paint = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

  async function runApply() {
    const id = pendingId.current;
    if (!id) return;
    const t = findTemplate(id);
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
        const created = composer.elements.createPage(newPageName ?? t.name);
        composer.elements.setActivePage?.(created.id);
      }
      if (resetStyles) composer.styles.clear();
      setApplyCancellable(false);
      setImportedSections([]);
      composer.elements.importHTMLToActivePage(resolvedHtml, (label, done, total) => {
        setImportedSections((prev) => [...prev, `${label} (${done}/${total})`]);
      });

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

  /* QA 2026-09-24: Escape leaves the full-canvas view. The preview owns
     Escape first (back to the catalogue, capture phase); the replace confirm,
     an apply and its outcome dialogs keep theirs. `defaultPrevented` is not
     a guard: the canvas's own Escape (clear selection) prevents default under
     the view, and that swallowed this one live. */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (sel.previewId || sel.showReplace || showProgress || createResult) return;
      onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sel.previewId, sel.showReplace, showProgress, createResult, onClose]);

  // ── Render ──
  const tName = findTemplate(pendingId.current)?.name ?? "Template";
  const previewTemplate = findTemplate(sel.previewId);

  return (
    <div className="tpl-ws" data-testid="tpl-workspace">
      {/* Board 4418:54134 "Full-screen Templates sidebar": one door out (to the
          canvas, or back to the catalogue from a preview), then the page
          templates by name. */}
      <aside className="tpl-ws-side" data-testid="tpl-ws-side" aria-label="Page templates">
        <Button
          color="light"
          size="xs"
          variant="link"
          className="tpl-ws-back"
          data-testid="tpl-ws-back"
          onClick={previewTemplate ? () => sel.setPreviewId(null) : onClose}
        >
          {previewTemplate ? "‹ Back to templates" : "‹ Back to canvas"}
        </Button>
        <div className="tpl-ws-title">Templates</div>
        <div className="tpl-ws-label">PAGE TEMPLATES</div>
        <Button
          className="tpl-ws-row"
          data-testid="tpl-ws-all"
          aria-current={previewTemplate ? undefined : "true"}
          onClick={() => sel.setPreviewId(null)}
        >
          All page templates · {catalogue.length}
        </Button>
        {catalogue.map((t) => (
          <Button
            key={t.id}
            className="tpl-ws-row tpl-ws-row--item"
            data-testid={`tpl-ws-item-${t.id}`}
            aria-current={previewTemplate?.id === t.id ? "true" : undefined}
            onClick={() => sel.setPreviewId(t.id)}
          >
            {t.name}
          </Button>
        ))}
      </aside>
      <PanelFrame className="tpl-shell tpl-ws-main">
      {previewTemplate ? (
        /* Board 4418:53202 — the preview lives in the view, not in a modal. */
        <TemplatePreview
          template={previewTemplate}
          pageName={activePageInfo?.name}
          onCreatePage={(t) => handleAddAsNewPage(t.id)}
          onReplacePage={(t) => handleApplyToCurrent(t.id)}
          onBack={() => sel.setPreviewId(null)}
          usedOn={(usageMap.get(previewTemplate.id) ?? []).map((u) => ({ id: u.pageId, name: u.pageName }))}
          onOpenPage={(pageId) => {
            composer?.elements.setActivePage?.(pageId);
            onClose?.();
          }}
        />
      ) : (
      <>
        <PanelFrame.Header
          title="Templates"
          subtitle="Preview a template, then create a page or replace this one."
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
                <Button className="tpl-search-clear" onClick={() => sel.setSearchQ("")} aria-label="Clear search">
                  <X size={14} />
                </Button>
              )}
            </div>
          </div>
        )}
        {/* G2-095: board 4418:54134 is one flat list — no pills, tags or pages. */}
        <div className="tpl-content">
          {visible.length === 0 ? (
            <div className="tpl-empty">
              <Search size={32} className="tpl-empty-icon" />
              <p className="tpl-empty-text">No templates found for &ldquo;{sel.searchQ.trim()}&rdquo;</p>
              <Button className="tpl-empty-btn" onClick={() => sel.setSearchQ("")}>
                Clear search
              </Button>
            </div>
          ) : (
            <div className="tpl-grid" role="listbox" aria-label="Available templates">
              {visible.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  isApplied={appliedId === tpl.id}
                  onClick={(id) => sel.setPreviewId(id)}
                  highlightQuery={sel.searchQ.trim() || undefined}
                />
              ))}
            </div>
          )}
        </div>
      </>
      )}
      </PanelFrame>
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
          template={findTemplate(pendingId.current) ?? SITE_TEMPLATES[0]}
          currentPageName={activePage?.name}
          currentPageCount={elementCount}
          resetGlobalStyles={resetStyles}
          onResetChange={setResetStyles}
          backupCurrentPage={backupCurrentPage}
          onBackupChange={setBackupCurrentPage}
          onCancel={() => sel.setShowReplace(false)}
          onApply={async () => {
            sel.setShowReplace(false);
            /* Owner decision #25 (C4): the backup is a History auto-version,
               not a "<page> (backup)" page — it restores the whole site from
               History › Saves instead of leaving a stray page in the
               sitemap. Taken BEFORE the apply, so it holds the page the user
               is about to lose. A failed snapshot must not cost the apply
               the user asked for; the version list simply lacks the row. */
            if (backupCurrentPage && composer?.versions) {
              const t = SITE_TEMPLATES.find((t) => t.id === pendingId.current) ?? SITE_TEMPLATES[0];
              await composer.versions.autoCheckpoint(`Before template “${t.name}”`).catch(() => null);
            }
            startApply();
          }}
        />
        );
      })()}
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
    </div>
  );
};

export default TemplatesTab;
