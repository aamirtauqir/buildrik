/**
 * TemplatesTab v3 — UI shell
 * All state/logic via hooks; this file renders only.
 * UX fixes applied: C4 C5 H5 H6 M5 M6 M8 L4 L5
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import type { Composer } from "../../../../engine";
import { PanelHeader } from "../../shared/PanelHeader";
import { useToast } from "../../../../shared/ui/Toast";
import { ApplyProgressOverlay } from "./ApplyProgressOverlay";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { type TemplateItem, SITE_CATEGORY_PILLS, SITE_TEMPLATES } from "./templatesData";
import { clearAppliedId, recordTemplateApplied, saveAppliedId } from "./templatesStorage";
import { ReplaceModal, ProModal } from "./TemplatesTabModals";
import { useTemplatePersistence } from "./hooks/useTemplatePersistence";
import { useTemplateApply } from "./hooks/useTemplateApply";
import { useTemplateSelection } from "./hooks/useTemplateSelection";
import "./TemplatesTab.css";

// Re-export for external consumers
export type { TemplateItem, RecentTemplate } from "./templatesData";
export { getRecentTemplates, addRecentTemplate, getTemplateById } from "./templatesData";

// ── Constants ────────────────────────────────────────────────────────
const INSIGHTS: Record<string, string> = {
  all: "SaaS templates most used in your niche",
  landing: "Landing pages with video hero convert 3× better",
  portfolio: "Portfolios with 6–12 projects get best client responses",
  blog: "Blogs with featured images get 2× more shares",
  ecommerce: "Product pages with 4+ images see higher conversion rates",
  saas: "SaaS pricing pages with 3 tiers convert best",
};

const GLOW: Record<string, string> = {
  "site-saas-landing": "#7C6DFA", "site-portfolio": "#0EA5E9", "site-blog": "#F59E0B",
  "site-ecommerce": "#22C55E", "site-agency": "#F87171", "site-startup": "#A78BFA",
  "site-minimal": "#E879F9", "site-restaurant": "#FB923C", "site-saas-pro": "#38BDF8",
  "site-coming-soon": "#818CF8",
};

// ── Props ────────────────────────────────────────────────────────────
export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
  /** Called when a quick-action button wants to switch to another tab (replaces composer event bus) */
  onSwitchTab?: (tab: string) => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

// ── Component ────────────────────────────────────────────────────────
export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  composer, onTemplateUsed, onSwitchTab, isPinned, onPinToggle, onHelpClick, onClose,
}) => {
  const { addToast } = useToast();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // ── Hooks ──────────────────────────────────────────────────────────
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

  const {
    selectedId, setSelectedId,
    previewId, setPreviewId,
    showReplace, setShowReplace,
    showUpgrade, setShowUpgrade,
    searchQ, setSearchQ,
    activeFilter, setActiveFilter,
    filteredTemplates,
    clearAll,
  } = useTemplateSelection(showProgress);

  // ── Derived ────────────────────────────────────────────────────────
  const total = SITE_TEMPLATES.length;
  const isFiltered = Boolean(searchQ.trim() || activeFilter !== "all");
  const headerCount = isFiltered ? `${filteredTemplates.length} of ${total}` : `${total}`;
  const metaCount = isFiltered ? `${filteredTemplates.length} of ${total} templates` : `${total} templates`;
  const selectedTpl = selectedId ? (SITE_TEMPLATES.find((t) => t.id === selectedId) ?? null) : null;
  const appliedTpl = appliedId ? (SITE_TEMPLATES.find((t) => t.id === appliedId) ?? null) : null;
  const appliedInView = appliedId ? filteredTemplates.some((t) => t.id === appliedId) : false;
  const previewTpl = previewId ? (SITE_TEMPLATES.find((t) => t.id === previewId) ?? null) : null;
  const isAppliedSel = Boolean(appliedId && selectedId === appliedId);
  const tName = pendingId.current
    ? (SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Template")
    : "Template";
  const nudgeMeta = !selectedTpl
    ? "Select a template to get started"
    : isAppliedSel
      ? "Applied · want to replace it?"
      : `${selectedTpl.pageCount ?? 1} pages · ${selectedTpl.status === "premium" ? "Pro" : "Free"} · click the button to apply`;
  const nudgeBtnLabel = isAppliedSel ? "Replace →" : hasExistingContent ? "Replace with This →" : "Apply Template →";

  // ── Handlers ───────────────────────────────────────────────────────

  // Enter to apply selected, Cmd+Enter to open preview
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showProgress || previewId) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && selectedId) {
        setPreviewId(selectedId);
      } else if (e.key === "Enter" && selectedId && !showReplace && !showUpgrade) {
        handleUseThis();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProgress, previewId, selectedId, showReplace, showUpgrade]);

  function selectTemplate(id: string) {
    setPreviewId(id);
  }

  function handleUseThis() {
    if (!selectedId) return;
    const t = SITE_TEMPLATES.find((x) => x.id === selectedId);
    if (!t) return;
    if (t.status === "premium") { setShowUpgrade(true); return; }
    pendingId.current = selectedId;
    setShowReplace(false);
    hasExistingContent ? setShowReplace(true) : startApply();
  }

  function handleUseFromPreview() {
    if (!previewId) return;
    const id = previewId;
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "premium") {
      pendingId.current = id;
      setShowUpgrade(true);
      setPreviewId(null);
      return;
    }
    setSelectedId(id);
    setPreviewId(null);
    pendingId.current = id;
    hasExistingContent ? setShowReplace(true) : startApply();
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
      if (resetStyles) composer.styles.clear();
      composer.elements.importHTMLToActivePage(t.html);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply";
      setCanRetry(true);
      setApplyError(msg);
      addToast({ message: "Template apply failed — nothing was changed", variant: "error",
        action: { label: "Retry", onClick: handleRetry } });
      return;
    }
    pendingId.current = null;
    setAppliedId(null);
    requestAnimationFrame(() => {
      setAppliedId(id);
      setSelectedId(null);
      setResetStyles(false);
      addToast({ message: `"${t.name}" applied successfully`, variant: "success",
        action: { label: "Undo", onClick: () => { composer?.history?.undo?.(); setAppliedId(null); clearAppliedId(); } } });
      recordTemplateApplied(t);
      saveAppliedId(id);
      onTemplateUsed?.();
      requestAnimationFrame(() => {
        const card = scrollRef.current?.querySelector(`[data-id="${id}"]`) as HTMLElement | null;
        card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="tpl-shell">
      <PanelHeader title="Templates" isPinned={isPinned} onPinToggle={onPinToggle}
        onHelpClick={onHelpClick} onClose={onClose}>
        <small className="tpl-count">{headerCount}</small>
      </PanelHeader>

      {/* Search */}
      <div className="tpl-search">
        <div className="tpl-search-box">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input className="tpl-search-input" placeholder="Search templates..." value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)} aria-label="Search templates" />
          {searchQ.length > 0 && (
            <button className="tpl-search-clear" onClick={() => setSearchQ("")} aria-label="Clear search">×</button>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="tpl-filters" role="tablist" aria-label="Template categories">
        {SITE_CATEGORY_PILLS.map((pill) => (
          <button key={pill.id} className={`tpl-pill${activeFilter === pill.id ? " tpl-pill--on" : ""}`}
            onClick={() => setActiveFilter(pill.id)} role="tab" aria-selected={activeFilter === pill.id}>
            {pill.label}
          </button>
        ))}
        {isFiltered && (
          <button className="tpl-pill-clear" onClick={clearAll} aria-label="Clear all filters">× Clear all</button>
        )}
      </div>

      {/* Meta */}
      <div className="tpl-meta"><span className="tpl-meta-count">{metaCount}</span></div>

      {/* Applied banner */}
      {appliedTpl && (
        <div className="tpl-applied-banner">
          <span className="tab-icon">🎉</span>
          <div className="tab-body">
            <div className="tab-title">{appliedTpl.name} applied!</div>
            <div className="tab-sub">Just now · {appliedTpl.pageCount ?? 1} pages ready</div>
            {!appliedInView && isFiltered && <div className="tab-filtered-warn">↑ Currently filtered out — clear filters to see it</div>}
          </div>
          <button className="tpl-undo-btn" onClick={() => { composer?.history?.undo?.(); setAppliedId(null); clearAppliedId(); }} aria-label="Undo template apply">↩ Undo</button>
          <button className="tpl-banner-dismiss" onClick={() => { setAppliedId(null); clearAppliedId(); }} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* Quick actions post-apply */}
      {appliedTpl && (
        <div className="tpl-quick-actions">
          <button className="tql-action" onClick={() => onSwitchTab?.("design")}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            Customize global styles
          </button>
          <button className="tql-action" onClick={() => onSwitchTab?.("history")}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            View version history
          </button>
          <div className="tql-sep" />
        </div>
      )}

      {/* Error banner */}
      {applyError && (
        <div className="tpl-error-banner">
          <span>⚠️ {applyError}</span>
          <div className="tpl-error-actions">
            {canRetry && <button className="tpl-error-retry" onClick={handleRetry}>Retry</button>}
            <button className="tpl-error-dismiss" onClick={() => { setApplyError(null); setCanRetry(false); }}>✕</button>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="tpl-cards-scroll" ref={scrollRef}>
        {filteredTemplates.length === 0 ? (
          <div className="tpl-empty">
            {searchQ.trim() ? (
              <><div className="tpl-empty-icon">🔍</div>
                <p className="tpl-empty-txt">No templates found for <strong>"{searchQ}"</strong></p>
                <p className="tpl-empty-hint">Try: Landing, SaaS, Portfolio, Blog</p>
                <button className="tpl-empty-clear" onClick={() => setSearchQ("")}>Clear search</button></>
            ) : (
              <><div className="tpl-empty-icon">📂</div>
                <p className="tpl-empty-txt">No templates in this category</p>
                <button className="tpl-empty-clear" onClick={clearAll}>Show all templates</button></>
            )}
          </div>
        ) : (
          <div className="tpl-cards-grid" role="listbox" aria-label="Available templates" aria-multiselectable="false">
            {filteredTemplates.map((tpl) => {
              const isLocked = tpl.status === "premium";
              const isSel = tpl.id === selectedId;
              const isAppl = tpl.id === appliedId;
              const glow = GLOW[tpl.id] ?? "#7C6DFA";
              return (
                <div key={tpl.id} data-id={tpl.id}
                  className={["tcard", isSel ? "tcard--sel" : "", isAppl ? "tcard--applied" : "", isLocked ? "tcard--locked" : ""].filter(Boolean).join(" ")}
                  onClick={() => selectTemplate(tpl.id)} role="option" tabIndex={0} aria-selected={isSel}
                  aria-label={`${tpl.name} template, ${tpl.pageCount ?? 1} pages, ${tpl.status === "premium" ? "Pro plan required" : "Free"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); setPreviewId(tpl.id); if (!isLocked) setSelectedId(tpl.id); }
                    if (e.key === " ") { e.preventDefault(); selectTemplate(tpl.id); }
                  }}
                >
                  <div className="tcard-thumb" style={{ background: tpl.gradient ?? "linear-gradient(145deg,#0d0d14,#181820)" }}>
                    <div className="tcard-glow" style={{ background: glow }} />
                    <div className="tcard-line tcard-line--h" style={{ background: `${glow}55` }} />
                    <div className="tcard-line" /><div className="tcard-line tcard-line--s" /><div className="tcard-line tcard-line--xs" />
                    {isLocked ? (
                      <div className="tcard-lock-ov">
                        <span className="tcard-lock-lbl" title="PRO plan required" aria-label="PRO plan required">🔒 PRO</span>
                        <button className="tcard-prev-btn" onClick={(e) => { e.stopPropagation(); setPreviewId(tpl.id); }}>Preview</button>
                        <button className="tcard-use-btn" onClick={(e) => { e.stopPropagation(); setShowUpgrade(true); }}>Upgrade →</button>
                      </div>
                    ) : (
                      <div className="tcard-hover-ov">
                        <button className="tcard-prev-btn" onClick={(e) => { e.stopPropagation(); setPreviewId(tpl.id); }}>Preview</button>
                        <button className="tcard-use-btn" onClick={(e) => { e.stopPropagation(); setSelectedId(tpl.id); pendingId.current = tpl.id; setShowReplace(false); hasExistingContent ? setShowReplace(true) : startApply(); }}>Use this →</button>
                      </div>
                    )}
                    <div className="tcard-check">✓</div>
                  </div>
                  <div className="tcard-info">
                    <div className="tcard-name" title={tpl.name}>{tpl.name}</div>
                    {tpl.pageCount !== undefined && <div className="tcard-pg">{tpl.pageCount}pg</div>}
                    <div className={`tcard-badge ${tpl.status === "premium" ? "tcard-badge--pro" : "tcard-badge--free"}`}>
                      {tpl.status === "premium" ? "PRO" : "FREE"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nudge bar */}
      <div className="tpl-nudge">
        <div className="tpl-nudge-info">
          <div className="tpl-nudge-text">
            <div className="tpl-nudge-name">{selectedTpl ? selectedTpl.name : "Select a template"}</div>
            <div className="tpl-nudge-meta">{nudgeMeta}</div>
          </div>
          {selectedId && <button className="tpl-deselect" onClick={() => setSelectedId(null)} aria-label="Deselect template">×</button>}
        </div>
        <button className="tpl-nudge-btn" disabled={!selectedTpl} onClick={handleUseThis}>{nudgeBtnLabel}</button>
      </div>

      {/* Insight bar */}
      <div className="tpl-insight">
        <div className="tpl-insight-dot" />
        <span className="tpl-insight-txt">{INSIGHTS[activeFilter] ?? INSIGHTS.all}</span>
      </div>

      {/* Modals */}
      {showReplace && selectedTpl && (
        <ReplaceModal template={selectedTpl} currentPageCount={composer?.elements?.getAllPages?.()?.length ?? 1}
          resetGlobalStyles={resetStyles} onResetChange={setResetStyles}
          onCancel={() => setShowReplace(false)} onApply={() => { setShowReplace(false); startApply(); }} />
      )}
      {showUpgrade && (
        <ProModal templateName={SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Pro Template"}
          onCancel={() => setShowUpgrade(false)}
          onUpgrade={() => { setShowUpgrade(false); window.open("/dashboard/settings/billing", "_blank"); }} />
      )}
      {showProgress && (
        <ApplyProgressOverlay templateName={tName} onComplete={handleProgressComplete}
          onCancel={() => { setShowProgress(false); pendingId.current = null; addToast({ message: "Template apply cancelled", variant: "info" }); }}
          onError={(err) => { setShowProgress(false); setCanRetry(true); setApplyError(err.message);
            addToast({ message: "Template apply failed — nothing was changed", variant: "error",
              action: { label: "Retry", onClick: handleRetry } }); }} />
      )}
      {previewTpl && (
        <TemplatePreviewModal template={previewTpl} onBack={() => setPreviewId(null)}
          onUseTemplate={(_t: TemplateItem) => handleUseFromPreview()} hasExistingContent={hasExistingContent} />
      )}

      {/* Canvas selection banner — portal */}
      {selectedTpl && !showProgress && !showReplace && !showUpgrade &&
        createPortal(
          <div className="tpl-canvas-banner" role="status">
            <span className="tpl-canvas-banner__label">Previewing: <strong>{selectedTpl.name}</strong> — not applied yet</span>
            <button className="tpl-canvas-banner__apply" onClick={handleUseThis}>Apply Template →</button>
            <button className="tpl-canvas-banner__cancel" onClick={() => setSelectedId(null)}>Cancel</button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default TemplatesTab;
