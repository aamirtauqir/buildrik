/**
 * PageFolder — Collapsible folder row in the pages list.
 *
 * Renders the folder header (chevron + name + count + actions) and,
 * when expanded, its child PageRow items.
 *
 * Drag-and-drop: the folder header acts as a drop target.
 * Pages dragged over a folder header are moved into it on drop.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { FolderItem, PageItem } from "../types";
import { PageRow } from "./PageRow";

interface Props {
  folder: FolderItem;
  pages: PageItem[];
  allPages: PageItem[];
  composer: Composer | null;
  renamingPageId: string | null;
  nameError: string | null;
  openContextMenuPageId: string | null;
  onToggle: () => void;
  onFolderRename: (name: string) => void;
  onFolderDelete: () => void;
  onSelectPage: (id: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
  onSettingsClick: (id: string) => void;
  onRenameStart: (id: string) => void;
  onRenameCommit: (id: string, name: string) => void;
  onRenameCancel: () => void;
  onDrop: (pageId: string) => void;
  onPageRemove: (pageId: string) => void;
}

export const PageFolder: React.FC<Props> = ({
  folder,
  pages,
  allPages,
  composer,
  renamingPageId,
  nameError,
  openContextMenuPageId,
  onToggle,
  onFolderRename,
  onFolderDelete,
  onSelectPage,
  onContextMenu,
  onSettingsClick,
  onRenameStart,
  onRenameCommit,
  onRenameCancel,
  onDrop,
  onPageRemove,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
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

  return (
    <div className={`pg-folder${isDragOver ? " pg-folder--dragover" : ""}`} role="group" aria-label={`Folder: ${folder.name}`}>
      {/* Folder header */}
      <div
        className="pg-folder__header"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Chevron toggle */}
        <button
          className="pg-folder__toggle"
          onClick={onToggle}
          aria-expanded={!folder.collapsed}
          aria-label={folder.collapsed ? `Expand folder ${folder.name}` : `Collapse folder ${folder.name}`}
        >
          <svg
            viewBox="0 0 24 24"
            width="10"
            height="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={`pg-folder__chevron${folder.collapsed ? "" : " pg-folder__chevron--open"}`}
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Folder icon */}
        <svg
          className="pg-folder__icon"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>

        {/* Folder name (or inline rename) */}
        {isRenamingFolder ? (
          <input
            ref={renameInputRef}
            className="pg-folder__rename"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitFolderRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitFolderRename(); }
              if (e.key === "Escape") { e.preventDefault(); setIsRenamingFolder(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label="Rename folder"
          />
        ) : (
          <span
            className="pg-folder__name"
            onDoubleClick={(e) => { e.stopPropagation(); setIsRenamingFolder(true); }}
          >
            {folder.name}
          </span>
        )}

        {/* Page count badge */}
        <span className="pg-folder__count">{pages.length}</span>

        {/* Actions */}
        <div className="pg-folder__actions">
          <button
            className="pg-folder__act"
            title="Rename folder"
            aria-label={`Rename folder ${folder.name}`}
            onClick={(e) => { e.stopPropagation(); setIsRenamingFolder(true); }}
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            className="pg-folder__act pg-folder__act--danger"
            title="Delete folder (pages kept)"
            aria-label={`Delete folder ${folder.name}`}
            onClick={(e) => { e.stopPropagation(); onFolderDelete(); }}
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Child page rows */}
      {!folder.collapsed && pages.length > 0 && (
        <div className="pg-folder__pages">
          {pages.map((page) => (
            <div key={page.id} className="pg-folder__page-wrap">
              <button
                className="pg-folder__eject"
                title="Remove from folder"
                aria-label={`Remove ${page.name} from folder`}
                onClick={() => onPageRemove(page.id)}
              >
                <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <PageRow
                page={page}
                pages={allPages}
                composer={composer}
                isRenaming={renamingPageId === page.id}
                nameError={renamingPageId === page.id ? nameError : null}
                isContextMenuOpen={openContextMenuPageId === page.id}
                onSelect={() => onSelectPage(page.id)}
                onRenameStart={() => onRenameStart(page.id)}
                onRenameCommit={(name) => onRenameCommit(page.id, name)}
                onRenameCancel={onRenameCancel}
                onContextMenu={(x, y) => onContextMenu(page.id, x, y)}
                onSettingsClick={() => onSettingsClick(page.id)}
                draggable
              />
            </div>
          ))}
        </div>
      )}

      {!folder.collapsed && pages.length === 0 && (
        <div className="pg-folder__empty-drop" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          Drag pages here
        </div>
      )}
    </div>
  );
};

PageFolder.displayName = "PageFolder";
