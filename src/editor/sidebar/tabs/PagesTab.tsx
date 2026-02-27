/** PagesTab — Pages panel with settings drawer. @license BSD-3-Clause */

import * as React from "react";
import { createPortal } from "react-dom";
import type { Composer } from "../../../engine";
import { useToast } from "../../../shared/ui/Toast";
import { PanelHeader } from "../shared/PanelHeader";
import { PageRow } from "./pages/PageRow";
import { PageSettingsScreen } from "./pages/PageSettingsScreen";
import { CtxItem, AddMenuItem, IconEdit, IconCopy, IconHome, IconLink, IconSettings, IconTrash } from "./pages/PagesTabHelpers";
import type { PageItem } from "./pages/types";
import "./PagesTab.css";

const PAGE_LIMIT = 5;
const IS_PRO = false;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PagesTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Called when user clicks "From Template" — parent should switch to Templates tab */
  onRequestTemplates?: () => void;
  /** Called when user clicks the upgrade CTA in the page limit footer */
  onUpgradeClick?: () => void;
}

interface CtxMenuState {
  pageId: string;
  x: number;
  y: number;
}

interface UndoAction {
  page: PageItem;
  /** Index in pages array before deletion */
  index: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PagesTab: React.FC<PagesTabProps> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
  onRequestTemplates,
  onUpgradeClick,
}) => {
  const [pages, setPages] = React.useState<PageItem[]>([]);
  const [searchQ, setSearchQ] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [drawerPageId, setDrawerPageId] = React.useState<string | null>(null);
  const [undoAction, setUndoAction] = React.useState<UndoAction | null>(null);
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const [ctxMenu, setCtxMenu] = React.useState<CtxMenuState | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { addToast } = useToast();

  const undoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up undo timer on unmount
  React.useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);
  // Ref mirrors for keyboard handler (avoids stale closures)
  const drawerOpenRef = React.useRef(false);
  const renamingIdRef = React.useRef<string | null>(null);
  const pagesRef = React.useRef<PageItem[]>([]);
  const undoActionRef = React.useRef<UndoAction | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Keep refs in sync
  React.useEffect(() => { drawerOpenRef.current = drawerPageId !== null; }, [drawerPageId]);
  React.useEffect(() => { renamingIdRef.current = renamingId; }, [renamingId]);
  React.useEffect(() => { pagesRef.current = pages; }, [pages]);
  React.useEffect(() => { undoActionRef.current = undoAction; }, [undoAction]);

  // ── Load pages from composer ──────────────────────────────────────────────

  const loadPagesState = React.useCallback(() => {
    if (!composer) return;
    try {
      const composerPages = composer.elements.getAllPages();
      const activeId = composer.elements.getActivePage()?.id ?? null;
      setPages(
        composerPages.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug || p.name?.toLowerCase().replace(/\s+/g, "-"),
          route: composer.router?.getPath(p.id) || undefined,
          isHome: p.isHome,
          isActive: p.id === activeId,
          seo: p.settings?.seo,
          head: p.settings?.head,
        }))
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pages");
    }
  }, [composer]);

  React.useEffect(() => {
    loadPagesState();
    if (!composer) return;
    const evs = ["page:created", "page:deleted", "page:changed", "page:updated"] as const;
    evs.forEach((ev) => composer.on(ev, loadPagesState));
    return () => evs.forEach((ev) => composer.off(ev, loadPagesState));
  }, [composer, loadPagesState]);

  // ── Keyboard handler (FIX C2 + M1 + L1 + L2) ────────────────────────────

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (drawerOpenRef.current) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      // FIX L1: ⌘, → open settings for active page
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        const active = pagesRef.current.find((p) => p.isActive);
        if (active) openSettings(active.id);
        return;
      }

      // ⌘F → focus search input
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // FIX L2: F2 → rename active page
      if (e.key === "F2") {
        const active = pagesRef.current.find((p) => p.isActive);
        if (active) setRenamingId(active.id);
        return;
      }

      // ⌘D → duplicate active page
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        const active = pagesRef.current.find((p) => p.isActive);
        if (active) handleDuplicate(active.id);
        return;
      }

      // FIX M1: ⌘Z → undo delete (guarded above by drawerOpen check)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && undoActionRef.current) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Escape: cancel rename → close add menu → close context menu
      if (e.key === "Escape") {
        if (renamingIdRef.current !== null) {
          setRenamingId(null);
          return;
        }
        setShowAddMenu(false);
        setCtxMenu(null);
        return;
      }

      // FIX C2: Delete/Backspace — blocked when drawer is open (guarded above)
      if (e.key === "Delete" || e.key === "Backspace") {
        if (renamingIdRef.current !== null) return;
        const active = pagesRef.current.find((p) => p.isActive);
        if (active && !active.isHome && pagesRef.current.length > 1) {
          handleDelete(active.id);
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []); // all state accessed via refs

  // ── Page action handlers ──────────────────────────────────────────────────

  const handleSelectPage = (pageId: string) => {
    if (!composer) return;
    composer.elements.setActivePage(pageId);
    setPages((prev) => prev.map((p) => ({ ...p, isActive: p.id === pageId })));
  };

  const handleRenameCommit = (pageId: string, name: string) => {
    if (!composer) return;
    composer.elements.updatePage(pageId, { name });
    setRenamingId(null);
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, name } : p)));
  };

  const openSettings = (pageId: string) => {
    if (renamingIdRef.current !== null) setRenamingId(null);
    setCtxMenu(null);
    setDrawerPageId(pageId);
  };

  const handleAddBlank = () => {
    setShowAddMenu(false);
    if (!composer) return;
    const name = `Page ${pages.length + 1}`;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const newPage = composer.elements.createPage(name, { slug });
    if (newPage?.id && composer.router) composer.router.register(`/${slug}`, newPage.id);
    setTimeout(() => setRenamingId(newPage.id), 60);
  };

  const handleAddExternal = () => {
    setShowAddMenu(false);
    addToast({ message: "External link pages — engine support required (coming soon)", variant: "info" });
  };

  const handleAddFolder = () => {
    setShowAddMenu(false);
    addToast({ message: "Page folders — engine support required (coming soon)", variant: "info" });
  };

  const handleDelete = (pageId: string) => {
    if (!composer) return;
    const pg = pages.find((p) => p.id === pageId);
    if (!pg || pg.isHome || pages.length <= 1) return;
    setCtxMenu(null);

    const index = pages.findIndex((p) => p.id === pageId);
    setUndoAction({ page: pg, index });

    composer.elements.deletePage(pageId);

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => {
      setUndoAction(null);
    }, 5000);
  };

  const handleUndo = () => {
    const action = undoActionRef.current;
    if (!action || !composer) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoAction(null);
    composer.elements.createPage(action.page.name, { slug: action.page.slug, isHome: action.page.isHome });
  };

  const handleDuplicate = (pageId: string) => {
    if (!composer) return;
    setCtxMenu(null);
    const pg = pages.find((p) => p.id === pageId);
    if (!pg) return;
    const taken = new Set(pages.map((p) => p.slug));
    let slug = `${pg.slug}-copy`;
    let n = 2;
    while (taken.has(slug)) slug = `${pg.slug}-copy-${n++}`;
    composer.elements.createPage(`${pg.name} Copy`, { slug });
  };

  const handleSetHome = (pageId: string) => {
    if (!composer) return;
    setCtxMenu(null);
    composer.elements.setHomePage(pageId);
  };

  // ── Context menu ──────────────────────────────────────────────────────────

  const showCtxMenu = (pageId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let x = e.clientX;
    let y = e.clientY;
    if (x + 200 > window.innerWidth) x -= 200;
    if (y + 280 > window.innerHeight) y -= 280;
    setCtxMenu({ pageId, x, y });
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const filteredPages = React.useMemo(
    () =>
      pages.filter((p) => p.name.toLowerCase().includes(searchQ.toLowerCase().trim())),
    [pages, searchQ]
  );

  const drawerPage = pages.find((p) => p.id === drawerPageId) ?? null;
  const ctxPage = ctxMenu ? pages.find((p) => p.id === ctxMenu.pageId) : null;
  const footerInfo = pages.length === 1 ? "1 page" : `${pages.length} pages`;
  const atLimit = !IS_PRO && pages.length >= PAGE_LIMIT;

  // ── Close menus on outside click ─────────────────────────────────────────

  React.useEffect(() => {
    if (!showAddMenu && !ctxMenu) return;
    const handler = () => {
      setShowAddMenu(false);
      setCtxMenu(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showAddMenu, ctxMenu]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pages-panel">
      <PanelHeader
        title="Pages"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {error ? (
        <div className="pages-error">
          <span>{error}</span>
          <button className="pages-error__btn" onClick={loadPagesState}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Header row: count badge + search btn + add btn */}
          <div className="pages-header">
            <span className="pages-header__count">{pages.length}</span>
            <button className="pages-header__btn" title="Search (⌘F)" aria-label="Search (⌘F)" onClick={() => searchInputRef.current?.focus()}><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
            <button
              className="pages-header__btn pages-header__btn--add"
              title="Add page"
              aria-label="Add page"
              disabled={atLimit}
              onClick={(e) => { e.stopPropagation(); setShowAddMenu((v) => !v); }}
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {showAddMenu && (
              <div className="pages-add-menu" onClick={(e) => e.stopPropagation()}>
                <AddMenuItem icon="📄" bg="rgba(99,102,241,0.1)" label="Blank Page" sub="Empty page to build from scratch" onClick={handleAddBlank} />
                <AddMenuItem icon="⬜" bg="rgba(34,197,94,0.08)" label="From Template" sub="Start with a pre-built design" onClick={() => { setShowAddMenu(false); onRequestTemplates?.(); }} />
                <div className="pages-add-sep" />
                <AddMenuItem icon="🔗" bg="rgba(245,158,11,0.08)" label="External Link" sub="Link to an external URL" soon onClick={handleAddExternal} />
                <AddMenuItem icon="📁" bg="rgba(148,163,184,0.06)" label="New Folder" sub="Group pages in a folder" soon onClick={handleAddFolder} />
              </div>
            )}
          </div>

          {/* Search wrap */}
          <div className="pages-search-wrap">
            <div className="pages-search-inner">
              <svg className="pages-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                className="pages-search-input"
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search pages…"
                aria-label="Search pages"
              />
              <button
                className={`pages-search-clear${searchQ ? " pages-search-clear--show" : ""}`}
                onClick={() => setSearchQ("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Limit banner */}
          {atLimit && (
            <div className="pages-limit-banner pages-limit-banner--show">
              <span className="pages-limit-banner__icon">⚠️</span>
              <div>
                <div className="pages-limit-banner__title">Page limit reached</div>
                <div className="pages-limit-banner__sub">{pages.length}/{PAGE_LIMIT} pages — upgrade for unlimited</div>
              </div>
            </div>
          )}

          {/* Pages list */}
          <div
            className="pages-list aqb-scrollbar"
            aria-live="polite"
            aria-label="Pages"
          >
            {filteredPages.length === 0 && searchQ ? (
              <div className="pages-empty pages-empty--show">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>No pages found for &ldquo;{searchQ}&rdquo;</span>
              </div>
            ) : (
              filteredPages.map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  isRenaming={renamingId === page.id}
                  isCtxOpen={ctxMenu?.pageId === page.id}
                  onSelect={() => handleSelectPage(page.id)}
                  onRenameCommit={(name) => handleRenameCommit(page.id, name)}
                  onRenameCancel={() => setRenamingId(null)}
                  onRenameStart={() => setRenamingId(page.id)}
                  onContextMenu={(e) => showCtxMenu(page.id, e)}
                  onSettingsClick={() => openSettings(page.id)}
                  onOpenPage={() => {
                    const url = page.route ?? (page.slug ? `/${page.slug}` : null);
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                    else handleSelectPage(page.id);
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pages-footer">
            <span className="pages-footer__info">{footerInfo}</span>
            <button className={`pages-footer__upg${atLimit ? " pages-footer__upg--show" : ""}`} onClick={onUpgradeClick}>↑ Upgrade</button>
          </div>
        </>
      )}

      <PageSettingsScreen
        key={drawerPageId ?? "closed"}
        composer={composer}
        page={drawerPage}
        allPages={pages}
        onClose={() => setDrawerPageId(null)}
      />

      {ctxMenu &&
        ctxPage &&
        createPortal(
          <div
            className="pages-ctx"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <CtxItem label="Rename" kbd="F2" icon={<IconEdit />}
              onClick={() => { setCtxMenu(null); setRenamingId(ctxPage.id); }} />
            <CtxItem label="Duplicate" kbd="⌘D" icon={<IconCopy />}
              onClick={() => handleDuplicate(ctxPage.id)} />
            <CtxItem label="Set as Homepage" icon={<IconHome />}
              disabled={ctxPage.isHome}
              onClick={() => handleSetHome(ctxPage.id)} />
            <CtxItem
              label="Copy Page Link"
              icon={<IconLink />}
              disabled={!ctxPage.route && !ctxPage.slug}
              onClick={() => {
                const path = ctxPage.route ?? (ctxPage.slug ? `/${ctxPage.slug}` : "");
                navigator.clipboard.writeText(window.location.origin + path).catch(() => {});
                setCtxMenu(null);
              }}
            />
            <CtxItem label="Page Settings" kbd="⌘," icon={<IconSettings />}
              onClick={() => openSettings(ctxPage.id)} />
            <div className="pages-ctx__sep" />
            <CtxItem label="Delete Page" kbd="⌫" icon={<IconTrash />} danger
              disabled={ctxPage.isHome || pages.length <= 1}
              onClick={() => handleDelete(ctxPage.id)} />
          </div>,
          document.body
        )}

      {undoAction &&
        createPortal(
          <div className="pages-undo-toast">
            <span>🗑 &ldquo;<strong>{undoAction.page.name}</strong>&rdquo; deleted</span>
            <button className="pages-undo-toast__btn" onClick={handleUndo}>Undo</button>
            <div className="pages-undo-toast__bar" />
          </div>,
          document.body
        )}
    </div>
  );
};

export default PagesTab;
