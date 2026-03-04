/**
 * PageTabBar - Horizontal tab bar for page switching
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants";
import type { PageData } from "../../shared/types";
import { ConfirmDialog } from "../../shared/ui/Modal";
import { useToast } from "../../shared/ui/Toast";

// ============================================================================
// TYPES
// ============================================================================

interface PageTabBarProps {
  composer: Composer | null;
}

interface ContextMenuState {
  pageId: string;
  x: number;
  y: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PageTabBar: React.FC<PageTabBarProps> = ({ composer }) => {
  const [pages, setPages] = React.useState<PageData[]>([]);
  const [activePageId, setActivePageId] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);
  const [editingPageId, setEditingPageId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [deleteConfirmPageId, setDeleteConfirmPageId] = React.useState<string | null>(null);
  const { addToast } = useToast();

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
    const evs = [
      EVENTS.PROJECT_CHANGED,
      "page:created",
      "page:deleted",
      "page:changed",
      "page:updated",
    ] as const;
    evs.forEach((ev) => composer.on(ev as string, syncPages));
    return () => {
      evs.forEach((ev) => composer.off(ev as string, syncPages));
    };
  }, [composer]);

  // Close context menu on outside mousedown
  React.useEffect(() => {
    if (!contextMenu) return;
    const handle = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(".ptb-ctx-menu")) return;
      setContextMenu(null);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [contextMenu]);

  const handleTabClick = (pageId: string) => {
    if (editingPageId) return;
    composer?.elements.setActivePage(pageId);
  };

  const handleAddPage = () => {
    if (!composer) return;
    const pageCount = pages.length + 1;
    composer.elements.createPage(`Page ${pageCount}`);
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
    if (editingPageId && editName.trim() && composer) {
      composer.elements.updatePage(editingPageId, { name: editName.trim() });
    }
    setEditingPageId(null);
    setEditName("");
  };

  const handleDuplicate = (pageId: string) => {
    if (!composer) return;
    const page = pages.find((p) => p.id === pageId);
    if (page) {
      // Match PagesTab pattern: "[Name] Copy" not "[Name] (Copy)"
      composer.elements.createPage(`${page.name} Copy`);
    }
    setContextMenu(null);
  };

  const handleDeleteRequest = (pageId: string) => {
    if (!composer || pages.length <= 1) return;
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    if (page.isHome) {
      addToast({
        message: "Set another page as Homepage before deleting this one.",
        variant: "warning",
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
      message: `"${pageName}" deleted`,
      variant: "info",
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
    <div style={containerStyles}>
      {/* Outer flex row — tablist + add button side by side */}
      <div style={tabRowStyles}>
        {/* Tab list with keyboard navigation */}
        <div
          style={tabsContainerStyles}
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
              aria-label={`${page.name}${page.isHome ? ", Homepage" : ""}`}
              onClick={() => handleTabClick(page.id)}
              onContextMenu={(e) => handleContextMenu(e, page.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleTabClick(page.id);
                }
                if (e.key === "F2") {
                  e.preventDefault();
                  handleRename(page.id);
                }
                if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
                  e.preventDefault();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  // Open above the tab — tab bar is at the bottom, rect.bottom is off-screen
                  const menuH = 160;
                  const y = rect.top - menuH > 0 ? rect.top - menuH : rect.bottom;
                  setContextMenu({ pageId: page.id, x: rect.left, y });
                }
              }}
              style={{
                ...tabStyles,
                ...(page.id === activePageId ? activeTabStyles : {}),
              }}
            >
              {page.isHome && <span style={homeIconStyles}>🏠</span>}
              {editingPageId === page.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    // Stop bubbling to tab/tablist handlers — arrows would move tab focus,
                    // F2 would reset editName to page.name, losing in-progress text
                    e.stopPropagation();
                    if (e.key === "Enter") handleRenameSubmit();
                    if (e.key === "Escape") {
                      setEditingPageId(null);
                      setEditName("");
                    }
                  }}
                  autoFocus
                  style={inputStyles}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span style={tabNameStyles}>{page.name}</span>
              )}
            </div>
          ))}
        </div>
        {/* Add button outside tablist — ARIA: only role="tab" may be tablist children */}
        <button
          onClick={handleAddPage}
          style={addButtonStyles}
          title="Add page"
          aria-label="Add new page"
        >
          +
        </button>
      </div>

      {/* Context menu — portal so it escapes overflow:hidden parents */}
      {contextMenu &&
        createPortal(
          <div
            className="ptb-ctx-menu"
            style={{ ...menuStyles, left: contextMenu.x, top: contextMenu.y }}
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
            <button
              style={menuItemStyles}
              role="menuitem"
              onClick={() => handleRename(contextMenu.pageId)}
            >
              ✏️ Rename
            </button>
            <button
              style={menuItemStyles}
              role="menuitem"
              onClick={() => handleDuplicate(contextMenu.pageId)}
            >
              📋 Duplicate
            </button>
            <button
              style={menuItemStyles}
              role="menuitem"
              onClick={() => handleSetHome(contextMenu.pageId)}
            >
              🏠 Set as Home
            </button>
            {pages.length > 1 && (
              <button
                style={{ ...menuItemStyles, color: "#ef4444" }}
                role="menuitem"
                onClick={() => handleDeleteRequest(contextMenu.pageId)}
              >
                🗑️ Delete
              </button>
            )}
          </div>,
          document.body
        )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmPageId}
        onClose={() => setDeleteConfirmPageId(null)}
        onConfirm={confirmDelete}
        title={`Delete "${pages.find((p) => p.id === deleteConfirmPageId)?.name}"?`}
        message="All content on this page will be permanently removed. You can undo immediately after."
        confirmText="Delete Page"
        variant="danger"
      />
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const containerStyles: React.CSSProperties = {
  position: "relative",
  borderBottom: "1px solid var(--aqb-border, #e2e8f0)",
  background: "var(--aqb-surface, #f8fafc)",
};

// Outer row: tablist (scrollable) + add button (fixed, outside tablist)
const tabRowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "4px 8px",
  gap: 4,
};

const tabsContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  flex: 1,
  overflowX: "auto",
};

const tabStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 12px",
  background: "transparent",
  border: "none",
  borderRadius: "6px 6px 0 0",
  fontSize: 13,
  color: "var(--aqb-text-secondary, #64748b)",
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
};

const activeTabStyles: React.CSSProperties = {
  background: "var(--aqb-surface-2, #fff)",
  color: "var(--aqb-text-primary, #1e293b)",
  fontWeight: 500,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const homeIconStyles: React.CSSProperties = {
  fontSize: 12,
};

const tabNameStyles: React.CSSProperties = {
  display: "inline-block", // required for overflow:hidden + text-overflow to trigger on span
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
  verticalAlign: "middle",
};

const inputStyles: React.CSSProperties = {
  width: 100,
  padding: "2px 4px",
  border: "1px solid var(--aqb-accent, #3b82f6)",
  borderRadius: 3,
  fontSize: 13,
  outline: "none",
};

const addButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  marginLeft: 4,
  background: "transparent",
  border: "1px dashed var(--aqb-border, #cbd5e1)",
  borderRadius: 4,
  fontSize: 16,
  color: "var(--aqb-text-muted, #94a3b8)",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

const menuStyles: React.CSSProperties = {
  position: "fixed",
  zIndex: 10000,
  background: "var(--aqb-surface, #fff)",
  border: "1px solid var(--aqb-border, #e2e8f0)",
  borderRadius: 8,
  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  padding: 4,
  minWidth: 140,
};

const menuItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  background: "transparent",
  border: "none",
  borderRadius: 4,
  fontSize: 13,
  color: "var(--aqb-text-primary, #1e293b)",
  cursor: "pointer",
  textAlign: "left",
};

export default PageTabBar;
