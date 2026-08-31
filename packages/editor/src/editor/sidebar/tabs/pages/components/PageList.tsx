/**
 * PageList — search input + pages tree + bulk toolbar mount + footer + Add CTA.
 * Zero business logic. All state/actions received as props from usePages + useFolders.
 *
 * Class namespace: `.bd-pg-list` is the scroll container (CSS owns `overflow:auto`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EmptyState, EmptyStateActions, EmptyStateDesc, EmptyStateTitle, IconButton, Button, TextInput } from "@/editor/chrome-ui";
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
  /** Opens the whole-site listings view — board 140:10's toolbar link. */
  onOpenListings?: () => void;
  openContextMenuPageId?: string | null;
  composer: Composer | null;
  folders: FolderItem[];
  pageToFolder: Map<string, string>;
  selectedIds: Set<string>;
  /** Pages with unsaved edits — board 140:21's dirty ●. */
  dirtyPages?: ReadonlySet<string>;
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
  onOpenListings,
  openContextMenuPageId = null,
  composer,
  folders,
  pageToFolder,
  selectedIds,
  dirtyPages,
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

  if (pages.length === 0) {
    return (
      <div className="bd-pg-list-shell">
        {/* No `role="tree"` on the empty state: its children are the two
            create buttons, and a tree may only own treeitems — axe called it
            "Element has children which are not allowed". There is no tree to
            announce when there are no pages. */}
        <div className="bd-pg-list empty">
          <EmptyState size="compact">
            <EmptyStateTitle>No pages yet</EmptyStateTitle>
            <EmptyStateDesc>Add your first page to get started. Pages are the screens visitors see.</EmptyStateDesc>
            <EmptyStateActions>
              <Button size="xs" onClick={onAddPage}>
                Create blank page
              </Button>
              {onRequestTemplates && (
                <Button color="light" size="xs" onClick={onRequestTemplates} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">
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
      {/* Board 140:7: 36h band with a bare 28h search box (no magnifier,
          no inline clear) plus the Listings text link on the right. Always
          visible - the old 5-page gate is gone. */}
      <div className="bd-pg-search-wrap">
        <div className="bd-pg-search">
          <TextInput
            ref={searchRef}
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("");
            }}
            aria-label="Search pages"
          />
        </div>
        {onOpenListings && (
          <Button
            color="light"
            size="xs"
            className="bd-pg-listings-link"
            data-testid="pages-open-listings"
            onClick={onOpenListings}
          >
            {"\u229E"} Listings
          </Button>
        )}
      </div>
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
      <div className="bd-pg-list">
        {visible.length === 0 && search ? (
          <div className="bd-pg-nores" role="status" aria-live="polite" data-testid="pages-no-results">
            <p>Nothing matches {"\u2018"}{search}{"\u2019"}.</p>
            <Button
              color="light"
              size="xs"
              className="bd-pg-nores-clear"
              onClick={() => setSearch("")}
            >
              Clear search
            </Button>
          </div>
        ) : (
          <>
            {/* Only treeitems inside the tree. The one-page note below carries
                an Add-page button, and axe (correctly) refuses a button as a
                tree's child — the scroll container, not the tree, is what those
                blocks belong to. */}
            <div className="bd-pg-tree" role="tree" aria-label="Pages">
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
                  selectedIds={selectedIds}
                  dirtyPages={dirtyPages}
                  onToggleSelect={onToggleSelect}
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
              // Board 141:40: search results are FLAT — folder members show
              // too, tagged "in {Folder}". Outside search, folder members
              // render under their folder above.
              .filter((p) => (search ? true : !pageToFolder.has(p.id)))
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
                  isDirty={dirtyPages?.has(page.id) ?? false}
                  onSelect={() => onSelectPage(page.id)}
                  onToggleSelect={(e) => onToggleSelect(page.id, e)}
                  onRenameStart={() => onRenameStart(page.id)}
                  onRenameCommit={(name) => onRenameCommit(page.id, name)}
                  onRenameCancel={onRenameCancel}
                  onContextMenu={(x, y) => onContextMenu(page.id, x, y)}
                  onSettingsClick={() => onSettingsClick(page.id)}
                  searchContext={
                    search
                      ? folders.find((f) => f.id === pageToFolder.get(page.id))?.name
                      : undefined
                  }
                />
              ))}
            </div>
            {/* Board 141:124: with exactly one page the list carries the
                one-page note + a centered Add link under the row. */}
            {!search && pages.length === 1 && (
              <div className="bd-pg-onepage" data-testid="pages-onepage">
                <p>This site has one page.</p>
                <Button
                  color="light"
                  size="xs"
                  className="bd-pg-onepage-add"
                  onClick={onAddPage}
                >
                  + Add page
                </Button>
              </div>
            )}
          </>
        )}

        {/* Drop indicator placeholder — toggled via .show during dragover (CSS owns visibility) */}
        <div className="bd-pg-drop-indicator" aria-hidden="true" />
      </div>
      {/* Board 141:78: the band appears with ANY checkbox selection —
          it replaces the Add-page footer. */}
      {selectedIds.size >= 1 && (
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
      {/* Board 140:38 footer vs board 141:78: when a bulk selection is
          active the bottom band IS the bulk bar — otherwise "+  Add page". */}
      {selectedIds.size === 0 && (
        <div className="bd-pg-footer">
          <AddPageButton onAddBlank={onAddPage} onFromTemplate={onRequestTemplates} onAddFolder={onAddFolder} />
        </div>
      )}
    </div>
  );
};
