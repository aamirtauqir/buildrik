/**
 * TemplatesTab v3 — Spec v2 Complete Redesign
 * Panel: header → search → filters → meta → [banner] → [quick-actions] → cards → pagination → nudge → insight
 * UX fixes applied: C4 C5 H5 H6 M5 M6 M8 L4 L5
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { ApplyProgressOverlay } from "./ApplyProgressOverlay";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { ReplaceModal, ProModal } from "./TemplatesTabModals";
import "./TemplatesTab.css";
import {
  type SiteCategory,
  type TemplateItem,
  SITE_CATEGORY_PILLS,
  SITE_TEMPLATES,
  addRecentTemplate,
} from "./templatesData";

// Re-export for external consumers
export type { TemplateItem, RecentTemplate } from "./templatesData";
export { getRecentTemplates, addRecentTemplate, getTemplateById } from "./templatesData";

// ── Insight text per category (FIX L5) ─────────────────────────────
const INSIGHTS: Record<string, string> = {
  all:       "SaaS templates most used in your niche",
  landing:   "Landing pages with video hero convert 3× better",
  portfolio: "Portfolios with 6–12 projects get best client responses",
  blog:      "Blogs with featured images get 2× more shares",
  ecommerce: "Product pages with 4+ images see higher conversion rates",
  saas:      "SaaS pricing pages with 3 tiers convert best",
};

// ── Glow color per template id ───────────────────────────────────────
const GLOW: Record<string, string> = {
  "saas-landing":    "#7C6DFA",
  "portfolio-clean": "#0EA5E9",
  "blog-minimal":    "#F59E0B",
  "ecom-store":      "#22C55E",
  "agency-bold":     "#F87171",
  "startup-pitch":   "#A78BFA",
  "photography":     "#E879F9",
  "restaurant":      "#FB923C",
  "news-site":       "#38BDF8",
  "product-launch":  "#818CF8",
};

const ONBOARDING_KEY = "aqb-tmpl-onboarded";
const PAGE_SIZE = 10;

// ── Props ────────────────────────────────────────────────────────────
export interface TemplatesTabProps {
  composer: Composer | null;
  onTemplateUsed?: () => void;
  onPagesOpen?: () => void;
  /** @deprecated Ignored — search is now internal */
  searchQuery?: string;
  /** @deprecated Ignored */
  flatMode?: boolean;
  /** @deprecated Ignored */
  onTemplateSelect?: (t: TemplateItem | null) => void;
  /** @deprecated Ignored */
  selectedTemplateId?: string | null;
}

// ── Component ────────────────────────────────────────────────────────
export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  composer,
  onTemplateUsed,
  onPagesOpen,
}) => {
  const [searchQ, setSearchQ]           = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<SiteCategory>("all");
  const [page, setPage]                 = React.useState(0);
  const [selectedId, setSelectedId]     = React.useState<string | null>(null);
  const [appliedId, setAppliedId]       = React.useState<string | null>(null);
  const [previewId, setPreviewId]       = React.useState<string | null>(null);
  const [showProgress, setShowProgress] = React.useState(false);
  const [showReplace, setShowReplace]   = React.useState(false);
  const [showUpgrade, setShowUpgrade]   = React.useState(false);
  const [resetStyles, setResetStyles]   = React.useState(false);
  const [applyError, setApplyError]     = React.useState<string | null>(null);

  const scrollRef      = React.useRef<HTMLDivElement>(null);
  const pendingId      = React.useRef<string | null>(null);

  // ── Derived ──────────────────────────────────────────────────────
  const total = SITE_TEMPLATES.length;
  const filtered = React.useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    return SITE_TEMPLATES.filter((t) => {
      const mq = !q || t.name.toLowerCase().includes(q);
      const mc = activeFilter === "all" || t.category === activeFilter;
      return mq && mc;
    });
  }, [searchQ, activeFilter]);

  const isFiltered      = Boolean(searchQ.trim() || activeFilter !== "all");
  const headerCount     = isFiltered ? `${filtered.length} of ${total}` : `${total}`;
  const metaCount       = isFiltered ? `${filtered.length} of ${total} templates` : `${total} templates`;
  const totalPages      = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated       = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const selectedTpl     = selectedId ? SITE_TEMPLATES.find((t) => t.id === selectedId) ?? null : null;
  const appliedTpl      = appliedId  ? SITE_TEMPLATES.find((t) => t.id === appliedId)  ?? null : null;
  const appliedInView   = appliedId ? filtered.some((t) => t.id === appliedId) : false;
  const previewTpl      = previewId  ? SITE_TEMPLATES.find((t) => t.id === previewId)  ?? null : null;
  const isAppliedSel    = Boolean(appliedId && selectedId === appliedId);
  const nudgeMeta       = !selectedTpl
    ? "hover karo preview ke liye"
    : isAppliedSel
      ? "Applied · change karna hai?"
      : `${selectedTpl.pageCount ?? 1} pages · ${selectedTpl.status === "premium" ? "Pro" : "Free"}`;

  React.useEffect(() => { setPage(0); }, [searchQ, activeFilter]);

  // ── Keyboard shortcuts (FIX M8, C5) ─────────────────────────────
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Escape") {
        if (previewId)    { setPreviewId(null);    return; }
        if (showUpgrade)  { setShowUpgrade(false); return; }
        if (showReplace)  { setShowReplace(false); return; }
        if (selectedId)   { setSelectedId(null);   return; }
        return;
      }
      if (inInput) return;
      if (previewId) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && selectedId) {
        setPreviewId(selectedId); return;
      }
      if (e.key === "Enter" && selectedId && !showReplace && !showUpgrade) {
        handleUseThis(); return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const idx = selectedId ? paginated.findIndex((t) => t.id === selectedId) : -1;
        const next = e.key === "ArrowRight" ? paginated[idx + 1] : paginated[idx - 1];
        if (next) setSelectedId(next.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewId, showUpgrade, showReplace, selectedId, paginated]);

  // ── Handlers ─────────────────────────────────────────────────────
  function canvasHasContent(): boolean {
    if (!composer) return false;
    try { return Boolean(composer.elements.toHTML()?.trim()); }
    catch { return false; }
  }

  function selectTemplate(id: string) {
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "premium") { pendingId.current = id; setShowUpgrade(true); return; } // FIX C4
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function handleUseThis() {
    if (!selectedId) return;
    const t = SITE_TEMPLATES.find((x) => x.id === selectedId);
    if (!t) return;
    if (t.status === "premium") { setShowUpgrade(true); return; }
    pendingId.current = selectedId;
    canvasHasContent() ? setShowReplace(true) : startApply();
  }

  // FIX C5: use previewId, not selectedId
  function handleUseFromPreview() {
    if (!previewId) return;
    const id = previewId;
    const t = SITE_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    if (t.status === "premium") { pendingId.current = id; setShowUpgrade(true); setPreviewId(null); return; }
    setSelectedId(id);
    setPreviewId(null);
    pendingId.current = id;
    canvasHasContent() ? setShowReplace(true) : startApply();
  }

  function startApply() {
    setShowReplace(false);
    setShowProgress(true);
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
    } catch (err) { setApplyError(err instanceof Error ? err.message : "Failed to apply"); return; }
    // FIX H6: reset before set to avoid stale banner
    setAppliedId(null);
    requestAnimationFrame(() => {
      setAppliedId(id);
      addRecentTemplate({ id: t.id, name: t.name, icon: t.icon, html: t.html });
      onTemplateUsed?.();
      // FIX L4: scroll to applied card
      requestAnimationFrame(() => {
        const card = scrollRef.current?.querySelector(`[data-id="${id}"]`) as HTMLElement | null;
        card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      setTimeout(() => {
        composer?.emit?.("ui:switch-tab", { tab: "add" });
        if (!localStorage.getItem(ONBOARDING_KEY)) {
          setTimeout(() => {
            localStorage.setItem(ONBOARDING_KEY, "true");
            composer?.emit?.("ui:template-onboarding-start", {});
          }, 800);
        }
        onPagesOpen?.();
      }, 800);
    });
  }

  function clearAll() { setSearchQ(""); setActiveFilter("all"); setPage(0); }

  // ── Progress overlay ──────────────────────────────────────────────
  if (showProgress) {
    const tName = pendingId.current
      ? (SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Template")
      : "Template";
    return (
      <div className="tpl-shell">
        <ApplyProgressOverlay templateName={tName} onComplete={handleProgressComplete} />
      </div>
    );
  }

  // ── Preview modal ─────────────────────────────────────────────────
  if (previewTpl) {
    return (
      <div className="tpl-shell">
        <TemplatePreviewModal
          template={previewTpl}
          onBack={() => setPreviewId(null)}
          onUseTemplate={(_t: TemplateItem) => handleUseFromPreview()}
        />
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────
  const nudgeBtnLabel = isAppliedSel ? "Replace →" : "Use This →";

  return (
    <div className="tpl-shell">

      {/* ① Header */}
      <div className="tpl-header">
        <span className="tpl-title">
          Templates
          <small className="tpl-count">{headerCount}</small>
        </span>
      </div>

      {/* ② Search */}
      <div className="tpl-search">
        <div className="tpl-search-box">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="tpl-search-input"
            placeholder="Search templates..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            aria-label="Search templates"
          />
          {searchQ.length > 0 && (
            <button className="tpl-search-clear" onClick={() => setSearchQ("")} aria-label="Clear search">×</button>
          )}
        </div>
      </div>

      {/* ③ Filter pills + Clear all (FIX M5) */}
      <div className="tpl-filters" role="tablist" aria-label="Template categories">
        {SITE_CATEGORY_PILLS.map((pill) => (
          <button
            key={pill.id}
            className={`tpl-pill${activeFilter === pill.id ? " tpl-pill--on" : ""}`}
            onClick={() => setActiveFilter(pill.id)}
            role="tab"
            aria-selected={activeFilter === pill.id}
          >{pill.label}</button>
        ))}
        {isFiltered && (
          <button className="tpl-pill-clear" onClick={clearAll} aria-label="Clear all filters">× Clear all</button>
        )}
      </div>

      {/* ④ Meta row */}
      <div className="tpl-meta">
        <span className="tpl-meta-count">{metaCount}</span>
      </div>

      {/* ⑤ Applied banner (FIX H6, M6) */}
      {appliedTpl && (
        <div className="tpl-applied-banner">
          <span className="tab-icon">🎉</span>
          <div className="tab-body">
            <div className="tab-title">{appliedTpl.name} applied!</div>
            <div className="tab-sub">Just now · {appliedTpl.pageCount ?? 1} pages ready</div>
            {!appliedInView && isFiltered && (
              <div className="tab-filtered-warn">↑ Currently filtered out — 'All' select karo dekhne ke liye</div>
            )}
          </div>
        </div>
      )}

      {/* ⑥ Quick actions (post-apply) */}
      {appliedTpl && (
        <div className="tpl-quick-actions">
          <button className="tql-action" onClick={() => composer?.emit?.("ui:switch-tab", { tab: "design" })}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Global Styles customize karo
          </button>
          <button className="tql-action" onClick={() => composer?.emit?.("ui:switch-tab", { tab: "history" })}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Versions tab dekho
          </button>
          <div className="tql-sep" />
        </div>
      )}

      {/* Error banner */}
      {applyError && (
        <div className="tpl-error-banner">
          <span>⚠️ {applyError}</span>
          <button onClick={() => setApplyError(null)}>✕</button>
        </div>
      )}

      {/* ⑦ Cards scroll */}
      <div className="tpl-cards-scroll" ref={scrollRef}>
        {paginated.length === 0 ? (
          <div className="tpl-empty">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <div className="tpl-empty-txt">
              {searchQ.trim()
                ? `"${searchQ.trim()}" — koi template nahi mila`
                : `No ${activeFilter} templates`}
            </div>
            <button className="tpl-empty-clear" onClick={clearAll}>Filters clear karo →</button>
          </div>
        ) : (
          <div className="tpl-cards-grid">
            {paginated.map((tpl) => {
              const isLocked = tpl.status === "premium";
              const isSel    = tpl.id === selectedId;
              const isAppl   = tpl.id === appliedId;
              const glow     = GLOW[tpl.id] ?? "#7C6DFA";
              return (
                <div
                  key={tpl.id}
                  data-id={tpl.id}
                  className={["tcard", isSel ? "tcard--sel" : "", isAppl ? "tcard--applied" : "", isLocked ? "tcard--locked" : ""].filter(Boolean).join(" ")}
                  onClick={() => selectTemplate(tpl.id)}
                  role="button"
                  tabIndex={isLocked ? -1 : 0}
                  aria-label={tpl.name}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectTemplate(tpl.id); } }}
                >
                  <div className="tcard-thumb" style={{ background: tpl.gradient ?? "linear-gradient(145deg,#0d0d14,#181820)" }}>
                    <div className="tcard-glow" style={{ background: glow }} />
                    <div className="tcard-line tcard-line--h" style={{ background: `${glow}55` }} />
                    <div className="tcard-line" />
                    <div className="tcard-line tcard-line--s" />
                    <div className="tcard-line tcard-line--xs" />
                    {isLocked ? (
                      <div className="tcard-lock-ov">
                        <span>🔒</span>
                        <span className="tcard-lock-lbl">PRO TEMPLATE</span>
                      </div>
                    ) : (
                      <div className="tcard-hover-ov">
                        <button
                          className="tcard-prev-btn"
                          onClick={(e) => { e.stopPropagation(); setPreviewId(tpl.id); }}
                        >Preview →</button>
                      </div>
                    )}
                    <div className="tcard-check">✓</div>
                  </div>
                  <div className="tcard-info">
                    <div className="tcard-name">{tpl.name}</div>
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

      {/* ⑧ Pagination */}
      {totalPages > 1 && (
        <div className="tpl-pag" role="navigation" aria-label="Template pages">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`tpl-pag-dot${page === i ? " tpl-pag-dot--on" : ""}`}
              onClick={() => setPage(i)}
              aria-label={`Page ${i + 1}`}
              aria-current={page === i ? "page" : undefined}
            />
          ))}
        </div>
      )}

      {/* ⑨ Nudge bar — ALWAYS visible (FIX M8) */}
      <div className="tpl-nudge">
        <div className="tpl-nudge-info">
          <div className="tpl-nudge-text">
            <div className="tpl-nudge-name">{selectedTpl ? selectedTpl.name : "Select a template"}</div>
            <div className="tpl-nudge-meta">{nudgeMeta}</div>
          </div>
          {selectedId && (
            <button className="tpl-deselect" onClick={() => setSelectedId(null)} aria-label="Deselect template">×</button>
          )}
        </div>
        <button className="tpl-nudge-btn" disabled={!selectedTpl} onClick={handleUseThis}>
          {nudgeBtnLabel}
        </button>
      </div>

      {/* ⑩ Insight bar — ALWAYS visible (FIX L5) */}
      <div className="tpl-insight">
        <div className="tpl-insight-dot" />
        <span className="tpl-insight-txt">{INSIGHTS[activeFilter] ?? INSIGHTS.all}</span>
      </div>

      {/* Modals */}
      {showReplace && selectedTpl && (
        <ReplaceModal
          template={selectedTpl}
          resetGlobalStyles={resetStyles}
          onResetChange={setResetStyles}
          onCancel={() => setShowReplace(false)}
          onApply={() => startApply()}
        />
      )}
      {showUpgrade && (
        <ProModal
          templateName={SITE_TEMPLATES.find((t) => t.id === pendingId.current)?.name ?? "Pro Template"}
          onCancel={() => setShowUpgrade(false)}
          onUpgrade={() => { setShowUpgrade(false); window.open("/dashboard/settings/billing", "_blank"); }}
        />
      )}
    </div>
  );
};

export default TemplatesTab;
