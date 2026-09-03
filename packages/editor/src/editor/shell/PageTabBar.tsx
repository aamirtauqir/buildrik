/**
 * PageTabBar - Horizontal tab bar for page switching
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ConfirmDialog, Portal, TextInput, useToast } from "@/editor/chrome-ui";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants";
import type { PageData } from "../../shared/types";
import { useClickOutside } from "@/shared/hooks";
import { useDirtyPages } from "../shared/useDirtyPages";
import { getDefaultPageName } from "../../shared/utils/pageUtils";
import { normalizeSlug } from "../sidebar/tabs/pages/utils/slug";
// ============================================================================
// TYPES
// ============================================================================

interface PageTabBarProps {
  composer: Composer | null;
  /**
   * View mode. Switching pages is looking, so the tabs stay — Figma's view
   * mode navigates a file too. Add, rename, duplicate and delete are not, so
   * the + button and the row's context menu are withheld. Hiding the rail and
   * the inspector had left both of them reachable here.
   */
  readOnly?: boolean;
}

interface ContextMenuState {
  pageId: string;
  x: number;
  y: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PageTabBar: React.FC<PageTabBarProps> = ({ composer, readOnly = false }) => {
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [activePageId, setActivePageId] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);
  const [editingPageId, setEditingPageId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [deleteConfirmPageId, setDeleteConfirmPageId] = React.useState<string | null>(null);
  const dirtyPages = useDirtyPages(composer);
  const ctxMenuRef = React.useRef<HTMLDivElement>(null);
  const renameWrapRef = React.useRef<HTMLSpanElement>(null);
  const [renameRect, setRenameRect] = React.useState<{ left: number; top: number } | null>(null);
  const { addToast } = useToast();

  // The validation popover is portaled (the tablist clips overflow), so it
  // needs the input's viewport position — measured once per edit session.
  React.useLayoutEffect(() => {
    if (!editingPageId) {
      setRenameRect(null);
      return;
    }
    const r = renameWrapRef.current?.getBoundingClientRect();
    setRenameRect(r ? { left: r.left, top: r.top } : null);
  }, [editingPageId]);

  const nameValidation = React.useMemo<{
    error?: string;
    warning?: string;
    slug: string;
  }>(() => {
    const trimmed = editName.trim();
    const slug = normalizeSlug(trimmed);
    if (!trimmed) return { error: "Page name is required", slug: "" };
    if (trimmed.length < 3) return { warning: "Short name — consider 3+ characters", slug };
    return { slug };
  }, [editName]);

  // Sync pages from composer — subscribe to all page events
  React.useEffect(() => {
    if (!composer) return;

    const syncPages = () => {
      const allPages = composer.elements.getAllPages();
      setPages(allPages);
      const active = composer.elements.getActivePage();
      setActivePageId(active?.id ?? null);
    };

    syncPages();
    /* PROJECT_CHANGED is the whole list: PageManager announces create, delete
       and activate through it with a `type` discriminator (:91, :270, :225).
       The four bare "page:*" names that sat beside it are emitted by nothing —
       this bar worked only because the one real name was also here.

       PROJECT_LOADED is the other half, and its absence hid the entire bar.
       The pages arrive asynchronously: this component mounts against an empty
       project (`pages.length === 0` → renders null), the project then loads and
       emits PROJECT_LOADED — which nothing here listened for. So after a plain
       page load there was no tab bar at all, and it appeared only once some
       unrelated edit happened to fire PROJECT_CHANGED. Found live 2026-08-14
       against board 435:2348. */
    composer.on(EVENTS.PROJECT_CHANGED, syncPages);
    composer.on(EVENTS.PROJECT_LOADED, syncPages);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, syncPages);
      composer.off(EVENTS.PROJECT_LOADED, syncPages);
    };
  }, [composer]);

  useClickOutside(ctxMenuRef, () => setContextMenu(null), { enabled: !!contextMenu });

  const handleTabClick = (pageId: string) => {
    if (editingPageId) return;
    composer?.elements.setActivePage(pageId);
  };

  const handleAddPage = () => {
    if (!composer) return;
    composer.elements.createPage(getDefaultPageName(pages));
  };

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    // Clamp to viewport so menu never clips at right/bottom edges
    const menuW = 160;
    const menuH = 160;
    const x = e.clientX + menuW > window.innerWidth ? e.clientX - menuW : e.clientX;
    const y = e.clientY + menuH > window.innerHeight ? e.clientY - menuH : e.clientY;
    setContextMenu({ pageId, x, y });
  };

  const handleRename = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (page) {
      setEditingPageId(pageId);
      setEditName(page.name);
    }
    setContextMenu(null);
  };

  const handleRenameSubmit = () => {
    if (editingPageId && editName.trim() && !nameValidation.error && composer) {
      composer.elements.updatePage(editingPageId, { name: editName.trim() });
    }
    setEditingPageId(null);
    setEditName("");
  };

  const handleDuplicate = (pageId: string) => {
    if (!composer) return;
    setContextMenu(null);
    /* `createPage(name + " Copy")` makes an EMPTY page wearing the copy's
       name — the exact feature-theater PageManager.duplicatePage was written
       to fix, fixed in the Pages tab and never here. Measured live: a Home
       page with four blocks duplicated to a "Home Copy" whose canvas held one
       node and 133 characters of HTML, and duplicating twice produced two
       tabs both called "Home Copy" because createPage does not de-duplicate
       names. The engine's duplicate deep-clones the LIVE tree, mints fresh
       ids, and names the copy itself. */
    try {
      if (!composer.elements.duplicatePage(pageId)) {
        addToast({
          description: "Couldn't duplicate — source page not found.",
          tone: "warning",
          duration: 3000,
        });
      }
    } catch (err) {
      addToast({
        description: "Duplicate failed — page may have corrupt content.",
        tone: "error",
        duration: 4000,
      });
      console.error("[page-tabs] duplicatePage failed", err);
    }
  };

  const handleDeleteRequest = (pageId: string) => {
    if (!composer || pages.length <= 1) return;
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    if (page.isHome) {
      addToast({
        description: "Set another page as Homepage before deleting this one.",
        tone: "warning",
        duration: 4000,
      });
      setContextMenu(null);
      return;
    }
    setDeleteConfirmPageId(pageId);
    setContextMenu(null);
  };

  const confirmDelete = () => {
    if (!deleteConfirmPageId || !composer) return;
    const page = pages.find((p) => p.id === deleteConfirmPageId);
    const pageName = page?.name ?? "Page";
    composer.elements.deletePage(deleteConfirmPageId);
    setDeleteConfirmPageId(null);
    addToast({
      description: `"${pageName}" deleted`,
      tone: "info",
      duration: 8000,
      action: { label: "Undo", onClick: () => composer.history?.undo?.() },
    });
  };

  const handleSetHome = (pageId: string) => {
    composer?.elements.setHomePage(pageId);
    setContextMenu(null);
  };

  if (!composer || pages.length === 0) return null;

  return (
    <div className={BAR}>
      {/* Outer flex row — tablist + add button side by side */}
      <div className={ROW}>
        {/* Tab list with keyboard navigation */}
        <div
          className={TABS}
          role="tablist"
          aria-label="Site pages"
          onKeyDown={(e) => {
            const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
            const idx = tabs.indexOf(document.activeElement as HTMLElement);
            if (e.key === "ArrowRight") {
              e.preventDefault();
              tabs[(idx + 1) % tabs.length]?.focus();
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              tabs[(idx - 1 + tabs.length) % tabs.length]?.focus();
            }
          }}
        >
          {pages.map((page) => (
            <div
              key={page.id}
              role="tab"
              tabIndex={page.id === activePageId ? 0 : -1}
              aria-selected={page.id === activePageId}
              aria-label={`${page.name}${page.isHome ? ", Homepage" : ""}${dirtyPages.has(page.id) ? ", unsaved changes" : ""}`}
              onClick={() => handleTabClick(page.id)}
              onContextMenu={readOnly ? undefined : (e) => handleContextMenu(e, page.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTabClick(page.id);
                }
                /* readOnly guarded onContextMenu but not the keyboard, so F2
                   still opened the rename input and ⇧F10 still opened the menu
                   with Delete in it. A mouse-only guard is not a guard. */
                if (e.key === "F2" && !readOnly) {
                  e.preventDefault();
                  handleRename(page.id);
                }
                if (!readOnly && (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10"))) {
                  e.preventDefault();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  // Open above the tab — tab bar is at the bottom, rect.bottom is off-screen
                  const menuH = 160;
                  const y = rect.top - menuH > 0 ? rect.top - menuH : rect.bottom;
                  setContextMenu({ pageId: page.id, x: rect.left, y });
                }
              }}
              className={`${TAB} ${page.id === activePageId ? TAB_ACTIVE : TAB_RESTING}`}
            >
              {page.isHome && (
                <span
                  className={`tw:text-[12px] tw:font-medium ${page.id === activePageId ? "tw:text-[var(--bk-ink-soft)]" : "tw:text-[var(--bk-ink-muted)]"}`}
                  aria-hidden="true"
                >
                  {"\u2302"}
                </span>
              )}
              {editingPageId === page.id ? (
                <span className="tw:relative" ref={renameWrapRef}>
                  <TextInput
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                      // Stop bubbling to tab/tablist handlers — arrows would move tab focus,
                      // F2 would reset editName to page.name, losing in-progress text
                      e.stopPropagation();
                      if (e.key === "Enter" && !nameValidation.error) handleRenameSubmit();
                      if (e.key === "Escape") {
                        setEditingPageId(null);
                        setEditName("");
                      }
                    }}
                    autoFocus
                    aria-describedby="ptb-rename-feedback"
                    aria-invalid={!!nameValidation.error}
                    className={`${RENAME_INPUT} ${
                      nameValidation.error
                        ? "tw:[&_input]:border-[var(--bk-error)] tw:[&_input]:focus:border-[var(--bk-error)]"
                        : nameValidation.warning
                          ? "tw:[&_input]:border-[var(--bk-warning)] tw:[&_input]:focus:border-[var(--bk-warning)]"
                          : "tw:[&_input]:border-[var(--bk-blue-500)] tw:[&_input]:focus:border-[var(--bk-blue-500)]"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* Board 435:2385 popover — portaled because the tablist's
                      overflow-x-auto clips vertical overflow, and it opens
                      ABOVE the input since the bar sits at the canvas foot. */}
                  {renameRect && (
                    <Portal>
                      <span
                        id="ptb-rename-feedback"
                        role={nameValidation.error ? "alert" : undefined}
                        className={RENAME_FEEDBACK}
                        style={{
                          left: renameRect.left,
                          bottom: window.innerHeight - renameRect.top + 2,
                        }}
                      >
                        {nameValidation.error && (
                          <span className="tw:block tw:font-medium tw:text-[var(--bk-error)]">
                            {nameValidation.error}
                          </span>
                        )}
                        {nameValidation.warning && (
                          <span className="tw:block tw:font-medium tw:text-[var(--bk-warning)]">
                            {nameValidation.warning}
                          </span>
                        )}
                        {nameValidation.slug && (
                          <span className="tw:block tw:text-[var(--bk-ink-muted)]">
                            /{nameValidation.slug}
                          </span>
                        )}
                      </span>
                    </Portal>
                  )}
                </span>
              ) : (
                <span className={TAB_NAME}>{page.name}</span>
              )}
              {dirtyPages.has(page.id) && (
                <span className={DIRTY_DOT} aria-hidden="true" title="Unsaved changes" />
              )}
            </div>
          ))}
        </div>
        {/* Add button outside tablist — ARIA: only role="tab" may be tablist children */}
        {readOnly ? null : (
        <Button
          onClick={handleAddPage}
          className={ADD_BTN}
          title="Add page"
          aria-label="Add new page"
        >
          +
        </Button>
        )}
      </div>
      {/* Context menu — portal so it escapes overflow:hidden parents */}
      {contextMenu && (
        <Portal>
          <div
            ref={ctxMenuRef}
            className="bd-ptb-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            role="menu"
            aria-label={`Options for ${pages.find((p) => p.id === contextMenu.pageId)?.name ?? "page"}`}
            onKeyDown={(e) => {
              if (e.key === "Escape") setContextMenu(null);
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const items = Array.from(
                  (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
                    '[role="menuitem"]'
                  )
                );
                const idx = items.indexOf(document.activeElement as HTMLElement);
                const next =
                  e.key === "ArrowDown"
                    ? (idx + 1) % items.length
                    : (idx - 1 + items.length) % items.length;
                items[next]?.focus();
              }
            }}
          >
            <Button
              className="bd-ptb-menu-item"
              role="menuitem"
              onClick={() => handleRename(contextMenu.pageId)}
            >
              Rename
            </Button>
            <Button
              className="bd-ptb-menu-item"
              role="menuitem"
              onClick={() => handleDuplicate(contextMenu.pageId)}
            >
              Duplicate
            </Button>
            <Button
              className="bd-ptb-menu-item"
              role="menuitem"
              onClick={() => handleSetHome(contextMenu.pageId)}
            >
              Set as home
            </Button>
            {pages.length > 1 && (
              <Button
                className="bd-ptb-menu-item danger"
                role="menuitem"
                onClick={() => handleDeleteRequest(contextMenu.pageId)}
              >
                Delete
              </Button>
            )}
          </div>
        </Portal>
      )}
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteConfirmPageId}
        onClose={() => setDeleteConfirmPageId(null)}
        onConfirm={confirmDelete}
        title={`Delete "${pages.find((p) => p.id === deleteConfirmPageId)?.name}"?`}
        message="This page and everything on it is removed. You can undo this from the toast that follows."
        confirmLabel="Delete page"
        tone="destructive"
      />
    </div>
  );
};

// ============================================================================
// CLASSES
// ============================================================================

/** The strip carries the app background so the active tab (bg-card) reads as
 *  proud of it. Both were bg-card before, which left the active page marked
 *  only by a 500 weight and a 5%-alpha shadow — invisible in practice.
 *  Figma board B9.7 is the record. */
const BAR = "tw:relative tw:border-y tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-app)]";
const ROW = "tw:flex tw:items-center tw:gap-2 tw:px-2 tw:py-1";
const TABS = "tw:flex tw:min-w-0 tw:items-center tw:gap-0.5 tw:overflow-x-auto";
const TAB =
  "tw:flex tw:items-center tw:gap-1 tw:px-3 tw:py-1.5 tw:whitespace-nowrap tw:cursor-pointer " +
  "tw:rounded-t-md tw:rounded-b-none tw:text-[13px]";
const TAB_RESTING = "tw:border-0 tw:bg-transparent tw:text-[var(--bk-ink-soft)]";
const TAB_ACTIVE =
  "tw:border tw:border-b-0 tw:border-[var(--bk-gray-200)] tw:bg-white tw:font-medium tw:text-[var(--bk-ink)] " +
  "tw:[box-shadow:var(--bk-shadow-raised)]";
/** inline-block is required for overflow+ellipsis to trigger on a span. */
const TAB_NAME = "tw:inline-block tw:max-w-30 tw:overflow-hidden tw:text-ellipsis tw:align-middle";
const DIRTY_DOT = "tw:size-1.5 tw:flex-none tw:rounded-full tw:bg-[var(--bk-blue-500)]";
const RENAME_INPUT = "tw:w-25 tw:[&_input]:px-1 tw:[&_input]:py-0.5 tw:[&_input]:text-[13px] tw:[&_input]:rounded";
const ADD_BTN =
  "tw:flex tw:items-center tw:justify-center tw:size-6 tw:ml-1 tw:p-0 tw:rounded tw:text-sm tw:font-medium " +
  /* ink-soft, not ink-muted: this sits on the tab bar's gray-100 where muted
     measures 4.39:1, under the 4.5 floor. Same pairing as the panel subtitle. */
  "tw:border tw:border-dashed tw:border-[var(--bk-gray-400)] tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-[var(--bk-gray-100)]";
const RENAME_FEEDBACK =
  "tw:fixed tw:z-[10000] tw:px-2 tw:py-1 tw:whitespace-nowrap " +
  "tw:rounded tw:border tw:border-[var(--bk-gray-200)] tw:bg-white tw:text-xs tw:leading-snug " +
  "tw:[box-shadow:var(--bk-shadow-drag)]";

export default PageTabBar;
