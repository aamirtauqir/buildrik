/**
 * PageTabBar - Horizontal tab bar for page switching
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../engine";
import { EVENTS } from "../../shared/constants";
import type { PageData } from "../../shared/types";
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
  const { addToast } = useToast();

  // Sync pages from composer
  React.useEffect(() => {
    if (!composer) return;

    const syncPages = () => {
      const allPages = composer.elements.getAllPages();
      setPages(allPages);
      const active = composer.elements.getActivePage();
      setActivePageId(active?.id ?? null);
    };

    syncPages();
    composer.on(EVENTS.PROJECT_CHANGED, syncPages);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, syncPages);
    };
  }, [composer]);

  // Close context menu on outside click
  React.useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
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
    setContextMenu({ pageId, x: e.clientX, y: e.clientY });
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
      composer.elements.createPage(`${page.name} (Copy)`);
    }
    setContextMenu(null);
  };

  const handleDelete = (pageId: string) => {
    if (!composer || pages.length <= 1) return;

    // Get page name before deletion for the toast message
    const page = pages.find((p) => p.id === pageId);
    const pageName = page?.name || "Page";

    composer.elements.deletePage(pageId);
    setContextMenu(null);

    // Show undo toast with action button (Task 3.2)
    addToast({
      message: `"${pageName}" deleted`,
      variant: "info",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          composer.history?.undo?.();
        },
      },
    });
  };

  const handleSetHome = (pageId: string) => {
    composer?.elements.setHomePage(pageId);
    setContextMenu(null);
  };

  if (!composer || pages.length === 0) return null;

  return (
    <div style={containerStyles}>
      <div style={tabsContainerStyles}>
        {pages.map((page) => (
          <div
            key={page.id}
            onClick={() => handleTabClick(page.id)}
            onContextMenu={(e) => handleContextMenu(e, page.id)}
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
        <button
          onClick={handleAddPage}
          style={addButtonStyles}
          title="Add page"
          aria-label="Add new page"
        >
          +
        </button>
      </div>

      {contextMenu && (
        <div style={{ ...menuStyles, left: contextMenu.x, top: contextMenu.y }}>
          <button style={menuItemStyles} onClick={() => handleRename(contextMenu.pageId)}>
            ✏️ Rename
          </button>
          <button style={menuItemStyles} onClick={() => handleDuplicate(contextMenu.pageId)}>
            📋 Duplicate
          </button>
          <button style={menuItemStyles} onClick={() => handleSetHome(contextMenu.pageId)}>
            🏠 Set as Home
          </button>
          {pages.length > 1 && (
            <button
              style={{ ...menuItemStyles, color: "#ef4444" }}
              onClick={() => handleDelete(contextMenu.pageId)}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
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

const tabsContainerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: "4px 8px",
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
  fontSize: 11,
};

const tabNameStyles: React.CSSProperties = {
  maxWidth: 120,
  overflow: "hidden",
  textOverflow: "ellipsis",
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
