/**
 * PageList — Renders pages list + Add Page CTA + conditional search.
 * Zero business logic. All state/actions received as props from usePages.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";
import { AddPageButton } from "./AddPageButton";
import { PageRow } from "./PageRow";

interface Props {
  pages: PageItem[];
  renamingPageId: string | null;
  canSearch: boolean;
  openContextMenuPageId?: string | null;
  onAddPage: () => void;
  onSelectPage: (id: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onSettingsClick: (id: string) => void;
  onRenameStart: (id: string) => void;
  onRenameCommit: (id: string, name: string) => void;
  onRenameCancel: () => void;
}

export const PageList: React.FC<Props> = ({
  pages,
  renamingPageId,
  canSearch,
  openContextMenuPageId = null,
  onAddPage,
  onSelectPage,
  onContextMenu,
  onSettingsClick,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
}) => {
  const [search, setSearch] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  const visible = search
    ? pages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pages;

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
              isRenaming={renamingPageId === page.id}
              isContextMenuOpen={openContextMenuPageId === page.id}
              onSelect={() => onSelectPage(page.id)}
              onRenameStart={() => onRenameStart(page.id)}
              onRenameCommit={(name) => onRenameCommit(page.id, name)}
              onRenameCancel={onRenameCancel}
              onContextMenu={(x, y) => onContextMenu(page.id, x, y)}
              onSettingsClick={() => onSettingsClick(page.id)}
            />
          ))
        )}
      </div>

      {/* Footer count */}
      <div className="pg-list__footer">
        {pages.length} page{pages.length !== 1 ? "s" : ""}
      </div>

      {/* Add Page CTA — sticky bottom */}
      <AddPageButton onClick={onAddPage} />
    </div>
  );
};
