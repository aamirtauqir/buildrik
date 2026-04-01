/**
 * PageList — Renders pages list + Add Page CTA + conditional search.
 * Zero business logic. All state/actions received as props from usePages.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { PageItem } from "../types";
import { AddPageButton } from "./AddPageButton";
import { PageRow } from "./PageRow";

interface Props {
  pages: PageItem[];
  renamingPageId: string | null;
  canSearch: boolean;
  openContextMenuPageId?: string | null;
  /**
   * When set (e.g. from context menu "Page Settings"), PageList syncs its
   * expandedPageId to this value so the settings open on the correct row.
   */
  requestExpandPageId?: string | null;
  composer: Composer | null;
  onAddPage: () => void;
  onSelectPage: (id: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onSettingsClick: (id: string) => void;
  onRenameStart: (id: string) => void;
  onRenameCommit: (id: string, name: string) => void;
  onRenameCancel: () => void;
  onRequestTemplates?: () => void;
}

export const PageList: React.FC<Props> = ({
  pages,
  renamingPageId,
  canSearch,
  openContextMenuPageId = null,
  requestExpandPageId = null,
  composer,
  onAddPage,
  onSelectPage,
  onContextMenu,
  onSettingsClick,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onRequestTemplates,
}) => {
  const [search, setSearch] = React.useState("");
  const [expandedPageId, setExpandedPageId] = React.useState<string | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Sync expansion when context menu "Page Settings" triggers openSettings externally
  React.useEffect(() => {
    if (requestExpandPageId && requestExpandPageId !== expandedPageId) {
      setExpandedPageId(requestExpandPageId);
    }
  }, [requestExpandPageId]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = search
    ? pages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pages;

  const handleToggleSettings = React.useCallback(
    (pageId: string) => {
      setExpandedPageId((prev) => (prev === pageId ? null : pageId));
      // Also call original onSettingsClick so context menu closes etc.
      onSettingsClick(pageId);
    },
    [onSettingsClick]
  );

  return (
    <div className="pg-list">
      {/* Search — only show when 5+ pages */}
      {canSearch && (
        <div className="pg-list__search-wrap">
          <svg
            className="pg-list__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchRef}
            className="pg-list__search"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("");
            }}
            aria-label="Search pages"
          />
          {search && (
            <button
              className="pg-list__search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Page rows */}
      <div className="pg-list__rows aqb-scrollbar" role="list" aria-label="Pages">
        {visible.length === 0 && search ? (
          <div className="pages-empty-search">
            <div className="pages-empty-search__msg">No pages match &ldquo;{search}&rdquo;</div>
            <button className="pages-empty-search__clear" onClick={() => setSearch("")}>
              Clear search
            </button>
          </div>
        ) : (
          visible.map((page) => (
            <PageRow
              key={page.id}
              page={page}
              pages={pages}
              composer={composer}
              isRenaming={renamingPageId === page.id}
              isContextMenuOpen={openContextMenuPageId === page.id}
              isExpanded={expandedPageId === page.id}
              onSelect={() => onSelectPage(page.id)}
              onRenameStart={() => onRenameStart(page.id)}
              onRenameCommit={(name) => onRenameCommit(page.id, name)}
              onRenameCancel={onRenameCancel}
              onContextMenu={(x, y) => onContextMenu(page.id, x, y)}
              onSettingsClick={() => handleToggleSettings(page.id)}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      <div className="pg-list__footer">
        <span>{pages.length} page{pages.length !== 1 ? "s" : ""}</span>
        {onRequestTemplates && (
          <button className="pg-list__from-template" onClick={onRequestTemplates}>
            From Template →
          </button>
        )}
      </div>

      {/* Add Page CTA — sticky bottom */}
      <AddPageButton onClick={onAddPage} />
    </div>
  );
};
