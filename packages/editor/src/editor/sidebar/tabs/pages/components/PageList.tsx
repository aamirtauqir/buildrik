/**
 * PageList — Renders pages list + Add Page CTA + conditional search.
 * Zero business logic. All state/actions received as props from usePages.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { FolderItem, PageItem } from "../types";
import { shouldFocusSearch } from "../utils/keyboardShortcuts";
import { AddPageButton } from "./AddPageButton";
import { BulkToolbar } from "./BulkToolbar";
import { PageFolder } from "./PageFolder";
import { PageRow } from "./PageRow";

interface Props {
  pages: PageItem[];
  renamingPageId: string | null;
  nameError: string | null;
  canSearch: boolean;
  openContextMenuPageId?: string | null;
  composer: Composer | null;
  // Folder support
  folders: FolderItem[];
  pageToFolder: Map<string, string>;
  // Bulk select
  selectedIds: Set<string>;
  onAddPage: () => void;
  onAddFolder: () => void;
  onSelectPage: (id: string) => void;
  onToggleSelect: (id: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  onBulkDuplicate: () => void;
  onBulkMoveToFolder: (folderId: string) => void;
  onBulkRemoveFromFolders: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onSettingsClick: (id: string) => void;
  onRenameStart: (id: string) => void;
  onRenameCommit: (id: string, name: string) => void;
  onRenameCancel: () => void;
  onRequestTemplates?: () => void;
  // Folder handlers
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, name: string) => void;
  onFolderDelete: (folderId: string) => void;
  onMovePageToFolder: (pageId: string, folderId: string) => void;
  onRemovePageFromFolder: (pageId: string) => void;
}

export const PageList: React.FC<Props> = ({
  pages,
  renamingPageId,
  nameError,
  canSearch,
  openContextMenuPageId = null,
  composer,
  folders,
  pageToFolder,
  selectedIds,
  onAddPage,
  onAddFolder,
  onSelectPage,
  onToggleSelect,
  onBulkDuplicate,
  onBulkMoveToFolder,
  onBulkRemoveFromFolders,
  onBulkDelete,
  onClearSelection,
  onContextMenu,
  onSettingsClick,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onRequestTemplates,
  onFolderToggle,
  onFolderRename,
  onFolderDelete,
  onMovePageToFolder,
  onRemovePageFromFolder,
}) => {
  const [search, setSearch] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (shouldFocusSearch(e)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const visible = search
    ? pages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pages;

  const stats = React.useMemo(() => {
    let drafts = 0, scheduled = 0, hidden = 0;
    for (const p of pages) {
      if (p.status === "draft")          drafts++;
      else if (p.status === "scheduled") scheduled++;
      else if (p.status === "hidden")    hidden++;
    }
    return { total: pages.length, drafts, scheduled, hidden };
  }, [pages]);

  if (pages.length === 0) {
    return (
      <div className="pg-list pg-list--empty">
        <div className="pg-empty">
          <div className="pg-empty__illus" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h4 className="pg-empty__title">No pages yet</h4>
          <p className="pg-empty__sub">Pages are the screens visitors see. Start with a blank canvas or pick a template.</p>
          <div className="pg-empty__actions">
            <button className="pg-empty__cta pg-empty__cta--primary" onClick={onAddPage}>Create blank page</button>
            {onRequestTemplates && (
              <button className="pg-empty__cta pg-empty__cta--ghost" onClick={onRequestTemplates}>From template</button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
          {search ? (
            <button
              className="pg-list__search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <span className="pg-list__search-kbd" aria-hidden="true">/</span>
          )}
        </div>
      )}

      {/* Group label — shown when pages exist and search is inactive */}
      {pages.length > 0 && !search && (
        <div className="pg-list__group">Site</div>
      )}

      {/* Select-all row — visible only in bulk mode (prototype .pg-selectall) */}
      {selectedIds.size > 0 && (
        <div
          className="pg-selectall"
          role="button"
          tabIndex={0}
          aria-label={`Select all ${pages.length} pages`}
          onClick={() => {
            if (selectedIds.size === pages.length) {
              onClearSelection();
            } else {
              pages.forEach((p) => {
                if (!selectedIds.has(p.id)) onToggleSelect(p.id, {} as React.MouseEvent);
              });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
          }}
        >
          <span
            className={`pg-selectall__checkbox${selectedIds.size === pages.length ? " pg-selectall__checkbox--on" : ""}`}
            aria-hidden="true"
          >
            {selectedIds.size === pages.length ? (
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
            ) : null}
          </span>
          <span>Select all ({pages.length} page{pages.length !== 1 ? "s" : ""})</span>
        </div>
      )}

      {/* Page rows + folders */}
      <div className="pg-list__rows buildrick-scrollbar" role="list" aria-label="Pages">
        {visible.length === 0 && search ? (
          <div className="pages-empty-search">
            <div className="pages-empty-search__msg">No pages match &ldquo;{search}&rdquo;</div>
            <button className="pages-empty-search__clear" onClick={() => setSearch("")}>
              Clear search
            </button>
          </div>
        ) : (
          <>
            {/* Folders (hidden when searching — search shows all matches flat) */}
            {!search && folders.map((folder) => {
              const folderPages = folder.pageIds
                .map((id) => pages.find((p) => p.id === id))
                .filter((p): p is PageItem => !!p);
              return (
                <PageFolder
                  key={folder.id}
                  folder={folder}
                  pages={folderPages}
                  allPages={pages}
                  composer={composer}
                  renamingPageId={renamingPageId}
                  nameError={nameError}
                  openContextMenuPageId={openContextMenuPageId}
                  onToggle={() => onFolderToggle(folder.id)}
                  onFolderRename={(name) => onFolderRename(folder.id, name)}
                  onFolderDelete={() => onFolderDelete(folder.id)}
                  onSelectPage={onSelectPage}
                  onContextMenu={onContextMenu}
                  onSettingsClick={onSettingsClick}
                  onRenameStart={onRenameStart}
                  onRenameCommit={onRenameCommit}
                  onRenameCancel={onRenameCancel}
                  onDrop={(pageId) => onMovePageToFolder(pageId, folder.id)}
                  onPageRemove={onRemovePageFromFolder}
                />
              );
            })}

            {/* Ungrouped pages */}
            {visible
              .filter((p) => !pageToFolder.has(p.id))
              .map((page) => (
                <PageRow
                  key={page.id}
                  page={page}
                  pages={pages}
                  composer={composer}
                  isRenaming={renamingPageId === page.id}
                  nameError={renamingPageId === page.id ? nameError : null}
                  isContextMenuOpen={openContextMenuPageId === page.id}
                  draggable={folders.length > 0}
                  isSelected={selectedIds.has(page.id)}
                  onSelect={() => onSelectPage(page.id)}
                  onToggleSelect={(e) => onToggleSelect(page.id, e)}
                  onRenameStart={() => onRenameStart(page.id)}
                  onRenameCommit={(name) => onRenameCommit(page.id, name)}
                  onRenameCancel={onRenameCancel}
                  onContextMenu={(x, y) => onContextMenu(page.id, x, y)}
                  onSettingsClick={() => onSettingsClick(page.id)}
                />
              ))}
          </>
        )}
      </div>

      {/* Bulk action toolbar — shown when 2+ pages selected */}
      {selectedIds.size >= 2 && (
        <BulkToolbar
          selectedCount={selectedIds.size}
          folders={folders}
          onDuplicate={onBulkDuplicate}
          onMoveToFolder={onBulkMoveToFolder}
          onRemoveFromFolders={onBulkRemoveFromFolders}
          onDelete={onBulkDelete}
          onClear={onClearSelection}
        />
      )}

      {/* Footer stats */}
      <div className="pg-list__footer">
        <div className="pg-list__stats">
          <span><b>{stats.total}</b> page{stats.total !== 1 ? "s" : ""}</span>
          {stats.drafts > 0 && (
            <><span>·</span><span>{stats.drafts} draft{stats.drafts !== 1 ? "s" : ""}</span></>
          )}
          {stats.scheduled > 0 && (
            <><span>·</span><span>{stats.scheduled} scheduled</span></>
          )}
          {stats.hidden > 0 && (
            <><span>·</span><span>{stats.hidden} hidden</span></>
          )}
        </div>
      </div>

      {/* Add Page CTA — sticky bottom */}
      <AddPageButton onAddBlank={onAddPage} onFromTemplate={onRequestTemplates} onAddFolder={onAddFolder} />
    </div>
  );
};
