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
import { PanelLoadError, PanelLoadingSkeleton } from "@/editor/shared/PanelStates";
import type { Composer } from "@/engine";
import type { FolderItem, PageItem } from "../types";
import type { CollectionPagesRow } from "../useDynamicPagesSummary";
import { AddPageButton } from "./AddPageButton";
import { BulkToolbar } from "./BulkToolbar";
import { PageFolder } from "./PageFolder";
import { PageRow, ROW_SUB, ROW_TAG } from "./PageRow";

/* Board 63:6393's two-part section headings ("My folders · Only visible to
   you", "Collection pages"). */
const SECTION_HEAD = "tw:flex tw:flex-col tw:px-3 tw:pt-3 tw:pb-1";
const SECTION_TITLE = "tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]";
const SECTION_SUB = "tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const LEGEND = "tw:m-0 tw:px-3 tw:pt-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

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
  /** Board 63:22616's "Clear search". */
  onClearSearch?: () => void;
  /** Pages with unsaved edits — board 140:21's dirty ●. */
  dirtyPages?: ReadonlySet<string>;
  /** Sync failed — board 141:203 replaces the tree, the frame stays. */
  loadError?: string | null;
  /** The project has not answered yet — an empty list is not an empty site. */
  loading?: boolean;
  onRetry: () => void;
  onAddPage: () => void;
  onAddFolder: () => void;
  /** The folder "New folder" just made — it opens in rename (L3-012). */
  newFolderId?: string | null;
  onSelectPage: (id: string) => void;
  onToggleSelect: (id: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  onBulkDuplicate: () => void;
  onBulkMoveToFolder: (folderId: string) => void;
  onBulkRemoveFromFolders: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  /** ⌥↑ / ⌥↓ on a top-level row. */
  onMovePage?: (id: string, direction: -1 | 1) => void;
  onRenameStart: (id: string) => void;
  onRenameCommit: (id: string, name: string, updateUrl?: boolean) => void;
  onRenameCancel: () => void;
  onRequestTemplates?: () => void;
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, name: string) => void;
  onFolderDelete: (folderId: string) => void;
  onMovePageToFolder: (pageId: string, folderId: string) => void;
  onRemovePageFromFolder: (pageId: string) => void;
  /** design-2l9 board 63:6393 "Collection pages": the pages CMS collections
   *  publish, which have no Page row of their own (FC-1). Empty → no block. */
  collectionPages?: readonly CollectionPagesRow[];
  onOpenTemplatePage?: (pageId: string) => void;
  onManageCollection?: (collectionId: string) => void;
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
  onClearSearch,
  dirtyPages,
  loadError,
  loading,
  onRetry,
  onAddPage,
  onAddFolder,
  newFolderId = null,
  onSelectPage,
  onToggleSelect,
  onBulkDuplicate,
  onBulkMoveToFolder,
  onBulkRemoveFromFolders,
  onBulkDelete,
  onClearSelection,
  onContextMenu,
  onMovePage,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onRequestTemplates,
  onFolderToggle,
  onFolderRename,
  onFolderDelete,
  onMovePageToFolder,
  onRemovePageFromFolder,
  collectionPages = [],
  onOpenTemplatePage,
  onManageCollection,
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

  /* Board 139:47668 draws no "Select all" band; ⌘A / Ctrl+A in the list
     still ticks every page once a selection has started. */
  const selectAll = (e: React.KeyboardEvent) => {
    if (selectedIds.size === 0 || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "a") return;
    if ((e.target as HTMLElement).closest("input, textarea, [contenteditable='true']")) return;
    e.preventDefault();
    pages.forEach((p) => {
      if (!selectedIds.has(p.id)) onToggleSelect(p.id, {} as React.MouseEvent);
    });
  };

  return (
    <div className="bd-pg-list-shell" onKeyDown={selectAll}>
      {selectedIds.size >= 1 && (
        <BulkToolbar
          selectedCount={selectedIds.size}
          selectedNames={pages.filter((p) => selectedIds.has(p.id)).map((p) => p.name)}
          folders={folders}
          onDuplicate={onBulkDuplicate}
          onMoveToFolder={onBulkMoveToFolder}
          onRemoveFromFolders={onBulkRemoveFromFolders}
          onDelete={onBulkDelete}
          onClear={onClearSelection}
        />
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
          /* design-2l9 board 63:22616: the failed query as a heading and an
             outlined Clear search, left-aligned — no icon, no ⌘K hand-off. */
          <div className="tw:flex tw:flex-col tw:items-start tw:gap-3 tw:px-3 tw:pt-2" role="status" data-testid="pages-no-results">
            <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]">{`No pages match “${search}”`}</p>
            <Button
              color="light"
              size="xs"
              className="tw:h-8 tw:min-h-0 tw:px-3 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0"
              data-testid="pages-no-results-clear"
              onClick={onClearSearch}
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
                  onMove={!search && onMovePage ? (d) => onMovePage(page.id, d) : undefined}
                  searchContext={
                    search
                      ? folders.find((f) => f.id === pageToFolder.get(page.id))?.name
                      : undefined
                  }
                />
              ))}
            </div>
            {/* Board 63:6393's legend sits under the page rows; a search puts
                its match count there instead (4418:92256). */}
            {!loadError && (
              <p className={LEGEND} data-testid="pages-legend">
                {search
                  ? `${visible.length} of ${pages.length} pages match “${search}”`
                  : "● marks a page with unsaved changes"}
              </p>
            )}
            {/* Board 63:6393: root pages first, then the personal folders under
                their own heading — a second tree, since a tree owns only
                treeitems and the heading is not one. */}
            {!search && folders.length > 0 && (
              <>
              <div className={SECTION_HEAD} data-testid="pages-folders-head">
                <span className={SECTION_TITLE} id="pages-folders-title">My folders</span>
                <span className={SECTION_SUB}>Only visible to you</span>
              </div>
              <div className="bd-pg-tree" role="tree" aria-labelledby="pages-folders-title">
            {folders.map((folder) => {
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
                  startRenaming={folder.id === newFolderId}
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
              </div>
              </>
            )}
            {!search && collectionPages.length > 0 && (
              <section aria-label="Collection pages" data-testid="pages-collections">
                <div className={SECTION_HEAD}>
                  <span className={SECTION_TITLE}>Collection pages</span>
                </div>
                {/* Board 63:6393: a gray card per collection — a white row
                    (glyph, name over pattern, page count) and its two doors. */}
                {collectionPages.map((c) => (
                  <div key={c.id} className="tw:mx-3 tw:flex tw:flex-col tw:gap-1 tw:rounded-md tw:bg-[var(--bk-gray-100)] tw:p-2" data-testid={`pages-collection-${c.id}`}>
                    <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-md tw:bg-[var(--bk-bg-card)] tw:px-2 tw:py-1">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="tw:flex-none tw:text-[var(--bk-ink-soft)]">
                        <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
                        <path d="M14 3v6h6" />
                      </svg>
                      <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
                        <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{c.name}</span>
                        <span className={ROW_SUB}>{c.pattern}</span>
                      </span>
                      <span className={`${ROW_TAG} tw:tabular-nums`}>{`${c.count} page${c.count === 1 ? "" : "s"}`}</span>
                    </div>
                    <div className="tw:flex">
                      {c.templatePageId && onOpenTemplatePage && (
                        <Button
                          variant="link"
                          size="xs"
                          className="tw:flex-1 tw:justify-center"
                          data-testid={`pages-collection-open-${c.id}`}
                          onClick={() => onOpenTemplatePage(c.templatePageId!)}
                        >
                          Open page
                        </Button>
                      )}
                      {onManageCollection && (
                        <Button
                          variant="link"
                          size="xs"
                          className="tw:flex-1 tw:justify-center"
                          data-testid={`pages-collection-manage-${c.id}`}
                          onClick={() => onManageCollection(c.id)}
                        >
                          Manage in CMS
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            )}
            {/* Board 141:124: with exactly one page the list carries the
                one-page note under the row. The board also draws a second
                "+ Add page" in the note (141:164); owner call 2026-10-03: two
                Add page controls in one panel confuse, the footer's is the
                one that stays. */}
            {!search && pages.length === 1 && (
              <div className="bd-pg-onepage" data-testid="pages-onepage">
                <p data-testid="pages-onepage-text">This site has one page.</p>
              </div>
            )}
          </>
        )}

        {/* Drop indicator placeholder — toggled via .show during dragover (CSS owns visibility) */}
        <div className="bd-pg-drop-indicator" aria-hidden="true" />
      </div>
      )}
      {/* Board 139:47668: the footer stays while pages are ticked. */}
      <div className="bd-pg-footer" data-testid="pages-footer">
        <AddPageButton onAddBlank={onAddPage} onFromTemplate={onRequestTemplates} onAddFolder={onAddFolder} />
      </div>
    </div>
  );
};
