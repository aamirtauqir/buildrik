import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
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
    <div className="bd-pg-folder" role="group" aria-label={`Folder: ${folder.name}`}>
      <div className="bd-pg-row-wrap">
        <div
          className={folderRowClasses}
          role="treeitem"
          aria-expanded={isExpanded}
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
        >
          <Button
            className="bd-pg-row-disclosure"
            type="button"
            aria-label={isExpanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </Button>

          <span className="bd-pg-row-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </span>

          {isRenamingFolder ? (
            <Input
              ref={renameInputRef}
              className="bd-pg-row-rename"
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
            <span
              className="bd-pg-row-name"
              title={folder.name}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsRenamingFolder(true);
              }}
            >
              {folder.name}
            </span>
          )}

          <span className="bd-pg-folder-count" aria-label={`${pages.length} pages in folder`}>
            {pages.length}
          </span>

          <span style={{ flex: 1 }} aria-hidden="true" />

          <div className="bd-pg-folder-actions">
            <Button
              className="bd-pg-folder-act"
              type="button"
              title="Rename folder"
              aria-label={`Rename folder ${folder.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsRenamingFolder(true);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </Button>
            <Button
              className="bd-pg-folder-act danger"
              type="button"
              title="Delete folder (pages kept)"
              aria-label={`Delete folder ${folder.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onFolderDelete();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
      {isExpanded && pages.length > 0 && (
        <div className="bd-pg-folder-children">
          {pages.map((page) => (
            <div key={page.id} className="bd-pg-page-wrap">
              <Button
                className="bd-pg-page-eject"
                type="button"
                title="Remove from folder"
                aria-label={`Remove ${page.name} from folder`}
                onClick={() => onPageRemove(page.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Button>
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
