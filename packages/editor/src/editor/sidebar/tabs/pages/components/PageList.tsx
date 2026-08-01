/**
 * PageList — search input + pages tree + bulk toolbar mount + footer + Add CTA.
 * Zero business logic. All state/actions received as props from usePages + useFolders.
 *
 * Class namespace: `.bd-pg-list` is the scroll container (CSS owns `overflow:auto`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDesc,
  EmptyStateTitle,
  IconButton
} from "@/editor/chrome-ui";
import type { Composer } from "../../../../../engine";
import type { FolderItem, PageItem } from "../types";
import { shouldFocusSearch } from "../utils/keyboardShortcuts";
import { AddPageButton } from "./AddPageButton";
import { BulkToolbar } from "./BulkToolbar";
import { PageFolder } from "./PageFolder";
import { PageRow } from "./PageRow";
import { Button, TextInput } from "@/editor/chrome-ui";

interface Props {
  pages: PageItem[];
  renamingPageId: string | null;
  nameError: string | null;
  canSearch: boolean;
  openContextMenuPageId?: string | null;
  composer: Composer | null;
  folders: FolderItem[];
  pageToFolder: Map<string, string>;
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
      <div className="bd-pg-list-shell">
        <div className="bd-pg-list empty" role="tree" aria-label="Pages">
          <EmptyState size="compact">
            <EmptyStateTitle>No pages yet</EmptyStateTitle>
            <EmptyStateDesc>Add your first page to get started. Pages are the screens visitors see.</EmptyStateDesc>
            <EmptyStateActions>
              <Button size="xs" onClick={onAddPage}>
                Create blank page
              </Button>
              {onRequestTemplates && (
                <Button color="light" size="xs" onClick={onRequestTemplates} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                  From template
                </Button>
              )}
            </EmptyStateActions>
          </EmptyState>
          <div className="bd-pg-drop-indicator" aria-hidden="true" />
        </div>
      </div>
    );
  }

  const showSelectAll = selectedIds.size > 0;
  const allSelected = selectedIds.size === pages.length && pages.length > 0;

  return (
    <div className="bd-pg-list-shell">
      {canSearch && (
        <div className="bd-pg-search-wrap">
          <div className="bd-pg-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <TextInput
              ref={searchRef}
              type="text"
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearch("");
              }}
              aria-label="Search pages"
            />
            {search && (
              <IconButton
                size="sm"
                onClick={() => setSearch("")}
                label="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ width: 14, height: 14 }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </IconButton>
            )}
          </div>
        </div>
      )}
      {showSelectAll && (
        <div
          className="bd-pg-selectall"
          role="button"
          tabIndex={0}
          aria-label={`Select all ${pages.length} pages`}
          onClick={() => {
            if (allSelected) {
              onClearSelection();
            } else {
              pages.forEach((p) => {
                if (!selectedIds.has(p.id)) onToggleSelect(p.id, {} as React.MouseEvent);
              });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") (e.currentTarget as HTMLElement).click();
          }}
        >
          <span
            className={`bd-pg-selectall-checkbox${allSelected ? " on" : ""}`}
            aria-hidden="true"
          >
            {allSelected ? (
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <polyline points="4 12 10 18 20 6" />
              </svg>
            ) : null}
          </span>
          <span>Select all ({pages.length} page{pages.length !== 1 ? "s" : ""})</span>
        </div>
      )}
      <div className="bd-pg-list" role="tree" aria-label="Pages">
        {visible.length === 0 && search ? (
          <EmptyState size="compact">
            <EmptyStateTitle>No pages match &ldquo;{search}&rdquo;</EmptyStateTitle>
            <EmptyStateActions>
              <Button color="light" size="xs" onClick={() => setSearch("")} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                Clear search
              </Button>
            </EmptyStateActions>
          </EmptyState>
        ) : (
          <>
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
                  draggable
                  onReorderDrop={(draggedId) =>
                    composer?.elements.reorderPage(draggedId, page.id)
                  }
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

        {/* Drop indicator placeholder — toggled via .show during dragover (CSS owns visibility) */}
        <div className="bd-pg-drop-indicator" aria-hidden="true" />
      </div>
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
      <div className="bd-pg-footer">
        <div className="bd-pg-footer-stats">
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
        <AddPageButton onAddBlank={onAddPage} onFromTemplate={onRequestTemplates} onAddFolder={onAddFolder} />
      </div>
    </div>
  );
};
