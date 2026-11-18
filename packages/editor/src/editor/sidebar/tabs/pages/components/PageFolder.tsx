/**
 * PageFolder — collapsible folder row + flat list of child PageRows.
 *
 * Class namespace: `.bd-pg-folder` + `.bd-pg-row.folder-row` for the header.
 * `.expanded-folder` is added to the row when not collapsed (CSS rotates the
 * chevron via that parent class). Children are wrapped in `.bd-pg-folder-children`
 * and each PageRow gets `nested` to pick up `.bd-pg-row.nested` left-padding.
 *
 * Drop target: the folder row itself accepts pages dragged from the ungrouped
 * list. While drag is over, `.dragover` is added.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton, Menu, MenuItem, Popover, TextInput } from "@/editor/chrome-ui";
import { listNames } from "@shared/utils/helpers/string";
import type { Composer } from "@/engine";
import type { FolderItem, PageItem } from "../types";
import { PageRow, ROW_SUB, ROW_TAG } from "./PageRow";

/* v3 7069:78978 "folders tooltip (ⓘ)". The board says "This browser only";
   folders now live on the server per user (useFolders), so the copy says who
   sees them instead of where they are kept. */

interface Props {
  folder: FolderItem;
  pages: PageItem[];
  allPages: PageItem[];
  composer: Composer | null;
  renamingPageId: string | null;
  nameError: string | null;
  openContextMenuPageId: string | null;
  selectedIds: Set<string>;
  dirtyPages?: ReadonlySet<string>;
  onToggleSelect: (id: string, e: React.MouseEvent | React.KeyboardEvent) => void;
  onToggle: () => void;
  onFolderRename: (name: string) => void;
  onFolderDelete: () => void;
  onSelectPage: (id: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  /** BK-28: ⌘D / ⌫ on a focused page row act on that PAGE (not the canvas). */
  onPageShortcut?: (id: string, action: "duplicate" | "delete") => void;
  onRenameStart: (id: string) => void;
  onRenameCommit: (id: string, name: string, updateUrl?: boolean) => void;
  onRenameCancel: () => void;
  onDrop: (pageId: string) => void;
}

export const PageFolder: React.FC<Props> = ({
  folder,
  pages,
  allPages,
  composer,
  renamingPageId,
  nameError,
  openContextMenuPageId,
  selectedIds,
  dirtyPages,
  onToggleSelect,
  onToggle,
  onFolderRename,
  onFolderDelete,
  onSelectPage,
  onContextMenu,
    onPageShortcut,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onDrop,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isRenamingFolder, setIsRenamingFolder] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(folder.name);
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isRenamingFolder) {
      setRenameValue(folder.name);
      requestAnimationFrame(() => {
        renameInputRef.current?.select();
        renameInputRef.current?.focus();
      });
    }
  }, [isRenamingFolder, folder.name]);

  const commitFolderRename = () => {
    onFolderRename(renameValue);
    setIsRenamingFolder(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const pageId = e.dataTransfer.getData("text/plain");
    if (pageId) onDrop(pageId);
  };

  const selCount = pages.filter((p) => selectedIds.has(p.id)).length;
  const toggleAllMembers = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (selCount === pages.length) {
      pages.forEach((p) => onToggleSelect(p.id, e));
    } else {
      pages.forEach((p) => {
        if (!selectedIds.has(p.id)) onToggleSelect(p.id, e);
      });
    }
  };

  const isExpanded = !folder.collapsed;
  const folderRowClasses = [
    "bd-pg-row",
    "folder-row",
    isExpanded ? "expanded-folder" : "",
    isDragOver ? "dragover" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div role="group" aria-label={`Folder: ${folder.name}`}>
      <div>
        <div
          className={folderRowClasses}
          role="treeitem"
          aria-expanded={isExpanded}
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          /* design-2l9 63:6393 draws no disclosure: the folder row itself
             opens and closes (aria-expanded carries the state). */
          onClick={() => {
            if (!isRenamingFolder) onToggle();
          }}
          onKeyDown={(e) => {
            /* Not while renaming: the folder's rename input sits inside this
               row, so its keystrokes bubble here. Without the guard a space
               typed into a folder name was swallowed (and the folder toggled),
               and Enter collapsed the folder on the way to committing. Same
               fault as PageRow's, one component over. */
            if ((e.key === "Enter" || e.key === " ") && !isRenamingFolder) {
              e.preventDefault();
              onToggle();
            }
          }}
        >
          {/* Board 140:11-12: folder row carries the same 16px checkbox as
              page rows — mixed when only some members are selected (the
              Checkbox 12:26 doc's parent-row rule). */}
          <div
            className={`bd-pg-row-checkbox${selCount === pages.length && pages.length > 0 ? " on" : selCount > 0 ? " mixed" : ""}`}
            role="checkbox"
            aria-checked={selCount === pages.length && pages.length > 0 ? "true" : selCount > 0 ? "mixed" : "false"}
            aria-label={`Select all pages in ${folder.name}`}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              toggleAllMembers(e);
            }}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                toggleAllMembers(e);
              }
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>


          <span className="bd-pg-row-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </span>

          {isRenamingFolder ? (
            <TextInput
              ref={renameInputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitFolderRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitFolderRename();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setIsRenamingFolder(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Rename folder"
            />
          ) : (
            /* Board 63:6393: the folder's name over its page count. */
            <span className="tw:flex tw:min-w-0 tw:flex-col">
              <span
                className="bd-pg-row-name bd-pg-folder-name"
                title={folder.name}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsRenamingFolder(true);
                }}
              >
                {folder.name}
              </span>
              <span className={ROW_SUB} aria-label={`${pages.length} pages in folder`}>
                {pages.length} page{pages.length === 1 ? "" : "s"}
              </span>
            </span>
          )}
          <span className="tw:flex-1" aria-hidden="true" />
          <span className={ROW_TAG}>Folder</span>

          {/* Board 137:57493: the folder's ⋯ menu — what deleting it does,
              then the action (Rename is the code's, kept). */}
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            placement="bottom-end"
            label={`${folder.name} options`}
            trigger={
              <IconButton
                className="bd-pg-row-overflow"
                size="sm"
                label={`More options for ${folder.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                data-testid={`pages-folder-menu-${folder.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ width: 14, height: 14 }}>
                  <circle cx="5" cy="12" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="19" cy="12" r="1.6" />
                </svg>
              </IconButton>
            }
          >
            <Menu label={`${folder.name} options`} className="tw:w-64">
              {/* Titled like the page menu (131:41791), not a small-caps label. */}
              <div className="tw:px-2 tw:pt-1 tw:text-[12px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]" data-testid={`pages-folder-menu-title-${folder.id}`}>
                {folder.name}
              </div>
              <p className="tw:m-0 tw:px-2 tw:pt-1 tw:pb-1.5 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)] tw:whitespace-normal">
                {`Only you see this folder. Deleting it keeps ${pages.length ? listNames(pages.map((p) => p.name)) : "nothing"} at the top level.`}
              </p>
              <MenuItem
                data-testid={`pages-folder-rename-${folder.id}`}
                onClick={() => {
                  setMenuOpen(false);
                  setIsRenamingFolder(true);
                }}
              >
                Rename folder…
              </MenuItem>
              <MenuItem
                danger
                data-testid={`pages-folder-delete-${folder.id}`}
                onClick={() => {
                  setMenuOpen(false);
                  onFolderDelete();
                }}
              >
                {`Delete folder · keep ${pages.length === 1 ? "page" : "pages"}`}
              </MenuItem>
              <MenuItem data-testid={`pages-folder-menu-close-${folder.id}`} onClick={() => setMenuOpen(false)}>
                Close menu
              </MenuItem>
            </Menu>
          </Popover>
        </div>
      </div>
      {isExpanded && pages.length > 0 && (
        <div>
          {pages.map((page) => (
            <div key={page.id} className="bd-pg-page-wrap">
              <PageRow
                page={page}
                pages={allPages}
                composer={composer}
                isRenaming={renamingPageId === page.id}
                nameError={renamingPageId === page.id ? nameError : null}
                isContextMenuOpen={openContextMenuPageId === page.id}
                isSelected={selectedIds.has(page.id)}
                isDirty={dirtyPages?.has(page.id) ?? false}
                onSelect={() => onSelectPage(page.id)}
                onToggleSelect={(e) => onToggleSelect(page.id, e)}
                onRenameStart={() => onRenameStart(page.id)}
                onRenameCommit={(name, updateUrl) => onRenameCommit(page.id, name, updateUrl)}
                onRenameCancel={onRenameCancel}
                onContextMenu={(x, y) => onContextMenu(page.id, x, y)}
                searchContext={folder.name}
                onShortcut={onPageShortcut ? (action) => onPageShortcut(page.id, action) : undefined}
                draggable
                nested
              />
            </div>
          ))}
        </div>
      )}
      {isExpanded && pages.length === 0 && (
        <div
          className="bd-pg-row--empty-folder"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          Drag pages here
        </div>
      )}
    </div>
  );
};

PageFolder.displayName = "PageFolder";
