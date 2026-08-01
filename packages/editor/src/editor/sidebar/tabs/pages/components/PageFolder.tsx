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
import { IconButton, TextInput } from "@/editor/chrome-ui";
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
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
        >
          <IconButton
            size="sm"
            label={isExpanded ? `Collapse ${folder.name}` : `Expand ${folder.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{ width: 12, height: 12, display: "grid", placeItems: "center", color: "var(--bk-ink-muted)", flexShrink: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ width: 10, height: 10, transition: "transform 120ms", transform: isExpanded ? "rotate(90deg)" : undefined }}>
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </IconButton>

          <span style={{ flexShrink: 0, color: "var(--bk-warning)", display: "grid", placeItems: "center" }} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 12, height: 12 }}>
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
            <span
              style={{ flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", font: "400 13px var(--bk-font-ui)" }}
              title={folder.name}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsRenamingFolder(true);
              }}
            >
              {folder.name}
            </span>
          )}

          <span style={{ display: "inline-flex", alignItems: "center", height: 16, padding: "0 6px", marginLeft: "var(--bk-space-4)", borderRadius: 4, background: "rgba(15, 23, 42, 0.06)", color: "var(--bk-ink-muted)", font: "500 10.5px var(--bk-font-ui)", fontVariantNumeric: "tabular-nums" }} aria-label={`${pages.length} pages in folder`}>
            {pages.length}
          </span>

          <span style={{ flex: 1 }} aria-hidden="true" />

          <div className="bd-pg-folder-actions">
            <IconButton
              className="bd-pg-folder-act"
              size="sm"
              title="Rename folder"
              label={`Rename folder ${folder.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsRenamingFolder(true);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ width: 12, height: 12 }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </IconButton>
            <IconButton
              className="bd-pg-folder-act danger"
              size="sm"
              title="Delete folder (pages kept)"
              label={`Delete folder ${folder.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onFolderDelete();
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ width: 12, height: 12 }}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </IconButton>
          </div>
        </div>
      </div>
      {isExpanded && pages.length > 0 && (
        <div>
          {pages.map((page) => (
            <div key={page.id} className="bd-pg-page-wrap">
              <IconButton
                className="bd-pg-page-eject"
                size="sm"
                title="Remove from folder"
                label={`Remove ${page.name} from folder`}
                onClick={() => onPageRemove(page.id)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true" style={{ width: 8, height: 8 }}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </IconButton>
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
