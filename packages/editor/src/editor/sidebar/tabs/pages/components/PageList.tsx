/**
 * PageList — pages tree + bulk toolbar mount + footer + Add CTA.
 *
 * The filter is the topbar field (v3 4418:92256), owned by PagesTab and
 * handed down as `search`. The load-error body lives here, not one level up:
 * v3 4418:94910 keeps the Add-page footer under it.
 * Zero business logic. All state/actions received as props from usePages + useFolders.
 *
 * Class namespace: `.bd-pg-list` is the scroll container (CSS owns `overflow:auto`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { EmptyState, EmptyStateActions, EmptyStateDesc, EmptyStateTitle, Button } from "@/editor/chrome-ui";
import { PanelLoadError, PanelLoadingSkeleton, PanelNoResults } from "@/editor/shared/PanelStates";
import type { Composer } from "../../../../../engine";
import type { FolderItem, PageItem } from "../types";
import { AddPageButton } from "./AddPageButton";
import { BulkToolbar } from "./BulkToolbar";
import { PageFolder } from "./PageFolder";
import { PageRow } from "./PageRow";

interface Props {
  pages: PageItem[];
  renamingPageId: string | null;
  nameError: string | null;
  openContextMenuPageId?: string | null;
  composer: Composer | null;
  folders: FolderItem[];
  pageToFolder: Map<string, string>;
  selectedIds: Set<string>;
  /** The topbar filter (v3 4418:92256) — empty when not searching. */
  search?: string;
  /** "Search everywhere" on the no-results block hands the query to ⌘K. */
  onSearchEverywhere?: (query: string) => void;
  /** Pages with unsaved edits — board 140:21's dirty ●. */
  dirtyPages?: ReadonlySet<string>;
  /** Sync failed — board 141:203 replaces the tree, the frame stays. */
  loadError?: string | null;
  /** The project has not answered yet — an empty list is not an empty site. */
  loading?: boolean;
  onRetry: () => void;
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
  onRenameStart: (id: string) => void;
  onRenameCommit: (id: string, name: string, updateUrl?: boolean) => void;
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
  openContextMenuPageId = null,
  composer,
  folders,
  pageToFolder,
  selectedIds,
  search = "",
  onSearchEverywhere,
  dirtyPages,
  loadError,
  loading,
  onRetry,
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
  /* A drop lands BEFORE or AFTER the row it is on. The engine only knows
     "after <id>", so before-X is after X's predecessor in site order (or
     first, when X is the first page). */
  const onReorder = React.useCallback(
    (draggedId: string, targetId: string, position: "before" | "after") => {
      if (!composer) return;
      if (position === "after") {
        composer.elements.reorderPage(draggedId, targetId);
        return;
      }
      const order = composer.elements.getAllPages().map((p) => p.id).filter((id) => id !== draggedId);
      const at = order.indexOf(targetId);
      composer.elements.reorderPage(draggedId, at > 0 ? order[at - 1] : null);
    },
    [composer]
  );
  const visible = search
    ? pages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pages;

  /* PagesLoadingSkeleton existed for months with no importer outside the e2e
     probe, while this empty state shipped over every still-loading project and
     invited a page creation that `importProject` would silently discard. The
     skeleton was built for exactly this moment; it just had no door. */
  if (pages.length === 0 && loading && !loadError) {
    return (
      <div className="bd-pg-list-shell">
        <div className="bd-pg-list">
          <PanelLoadingSkeleton label="Loading pages" testId="pages-loading" barTestId="pages-sk-bar" />
        </div>
        <div className="bd-pg-footer" data-testid="pages-footer">
          <AddPageButton onAddBlank={onAddPage} onFromTemplate={onRequestTemplates} onAddFolder={onAddFolder} />
        </div>
      </div>
    );
  }

  if (pages.length === 0 && !loadError) {
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
      {/* Board 141:203 draws the error as a full-width band between the search
          row and the Add-page foot — a SIBLING of the tree, not a child of it.
          Nested inside `.bd-pg-list` it inherited that container's 6px gutter,
          so its 24px text column measured 220 against the board's 232, and it
          scrolled with a list that was not there. */}
      {loadError ? (
        <PanelLoadError
          title="Couldn’t load pages"
          rest="to load this site’s pages."
          testId="pages-load-error"
          retryTestId="pages-load-error-retry"
          onRetry={onRetry}
        />
      ) : (
      <div className="bd-pg-list">
        {visible.length === 0 && search ? (
          <PanelNoResults
            search={search}
            message="No pages match your search."
            testId="pages-no-results"
            everywhereTestId="pages-search-everywhere"
            actionOffset="tw:mt-6"
            onSearchEverywhere={onSearchEverywhere}
          />
        ) : (
          <>
            {/* Only treeitems inside the tree. The one-page note below carries
                an Add-page button, and axe (correctly) refuses a button as a
                tree's child — the scroll container, not the tree, is what those
                blocks belong to. */}
            <div className="bd-pg-tree" role="tree" aria-label="Pages">
            {!search && folders.map((folder, index) => {
              const folderPages = folder.pageIds
                .map((id) => pages.find((p) => p.id === id))
                .filter((p): p is PageItem => !!p);
              return (
                <PageFolder
                  key={folder.id}
                  folder={folder}
                  explainFolders={index === 0}
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
                  onRenameStart={onRenameStart}
                  onRenameCommit={onRenameCommit}
                  onRenameCancel={onRenameCancel}
                  onDrop={(pageId) => onMovePageToFolder(pageId, folder.id)}
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
                  onReorderDrop={(draggedId, position) => onReorder(draggedId, page.id, position)}
                  isSelected={selectedIds.has(page.id)}
                  isDirty={dirtyPages?.has(page.id) ?? false}
                  onSelect={() => onSelectPage(page.id)}
                  onToggleSelect={(e) => onToggleSelect(page.id, e)}
                  onRenameStart={() => onRenameStart(page.id)}
                  onRenameCommit={(name, updateUrl) => onRenameCommit(page.id, name, updateUrl)}
                  onRenameCancel={onRenameCancel}
                  onContextMenu={(x, y) => onContextMenu(page.id, x, y)}
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
                <p data-testid="pages-onepage-text">This site has one page.</p>
                <Button
                  color="light"
                  size="xs"
                  className="bd-pg-onepage-add"
                  data-testid="pages-onepage-add"
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
      )}
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
        <div className="bd-pg-footer" data-testid="pages-footer">
          {/* v3 4418:90494 legend over the Add band; a search puts its match
              count there instead (4418:92256). */}
          {!loadError && (
            <p className="bd-pg-legend" data-testid="pages-legend">
              {search
                ? `${visible.length} of ${pages.length} pages match “${search}”`
                : "⌂ homepage · ● unpublished changes · ⠿ drag to reorder · ⋯ page menu"}
            </p>
          )}
          <AddPageButton onAddBlank={onAddPage} onFromTemplate={onRequestTemplates} onAddFolder={onAddFolder} />
        </div>
      )}
    </div>
  );
};
