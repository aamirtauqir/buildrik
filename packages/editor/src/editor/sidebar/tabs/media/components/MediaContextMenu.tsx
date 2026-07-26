/**
 * MediaContextMenu — right-click menu for an asset in the library grid.
 * Positioned at (x, y) in viewport coords; clamps to stay on-screen.
 *
 * Layout (prototype-v3 §16): 4 groups separated by dividers.
 *   1. Primary actions: Insert · Edit image (img) · Replace across (img/vid)
 *   2. Organize:        Select · Rename · Move to ▸ (nested folder picker)
 *   3. Copy:            Copy URL · Copy alt-text (img + altText)
 *   4. Danger:          Delete
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/ui";
import { useClickOutside } from "../../../../../shared/hooks/useClickOutside";
import type { LibraryItem, MediaFolder } from "../data/mediaTypes";

interface MediaContextMenuProps {
  x: number;
  y: number;
  item: LibraryItem;
  /** @deprecated use allFolders. Kept for backwards-compat at older mount sites. */
  folders: MediaFolder[];
  /** §16 — full flat folder tree for nested Move submenu w/ indentation. */
  allFolders?: MediaFolder[];
  onInsert(item: LibraryItem): void;
  onRename(item: LibraryItem): void;
  onMove(item: LibraryItem, folderId: string | null): void;
  onDelete(item: LibraryItem): void;
  onCopyUrl(item: LibraryItem): void;
  onEditImage(item: LibraryItem): void;
  onSelect(item: LibraryItem): void;
  onReplaceAcross?(item: LibraryItem): void;
  onClose(): void;
}

const MENU_WIDTH = 160;
const MENU_ITEM_HEIGHT = 28;

/**
 * Sort folders depth-first so nested children render directly under
 * their parent. Returns array of { folder, depth } pairs.
 */
function flattenFolderTree(
  folders: ReadonlyArray<MediaFolder>,
): Array<{ folder: MediaFolder; depth: number }> {
  const byParent = new Map<string | null, MediaFolder[]>();
  for (const f of folders) {
    const list = byParent.get(f.parentId) ?? [];
    list.push(f);
    byParent.set(f.parentId, list);
  }
  const out: Array<{ folder: MediaFolder; depth: number }> = [];
  const walk = (parentId: string | null, depth: number) => {
    const children = byParent.get(parentId) ?? [];
    for (const f of children) {
      out.push({ folder: f, depth });
      walk(f.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

export function MediaContextMenu({
  x,
  y,
  item,
  folders,
  allFolders,
  onInsert,
  onRename,
  onMove,
  onDelete,
  onCopyUrl,
  onEditImage,
  onSelect,
  onReplaceAcross,
  onClose,
}: MediaContextMenuProps) {
  const [moveOpen, setMoveOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, { closeOnEscape: true });

  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const top = Math.min(y, window.innerHeight - MENU_ITEM_HEIGHT * 8 - 8);

  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const folderTree = React.useMemo(
    () => flattenFolderTree(allFolders ?? folders),
    [allFolders, folders],
  );

  return (
    <>
      <div className="med-ctx-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={menuRef}
        className="med-ctx-menu"
        role="menu"
        aria-label="Asset actions"
        style={{ position: "fixed", left, top, width: MENU_WIDTH, zIndex: 200 }}
      >
        {/* Group 1 — Primary actions */}
        <Button
          role="menuitem"
          className="med-ctx-item"
          onClick={act(() => onInsert(item))}
        >
          Insert
        </Button>
        {item.type === "img" ? (
          <Button
            role="menuitem"
            className="med-ctx-item"
            onClick={act(() => onEditImage(item))}
          >
            Edit image
          </Button>
        ) : null}
        {onReplaceAcross && (item.type === "img" || item.type === "vid") ? (
          <Button
            role="menuitem"
            className="med-ctx-item"
            onClick={act(() => onReplaceAcross(item))}
          >
            Replace across pages…
          </Button>
        ) : null}

        <div className="med-ctx-sep" role="separator" />

        {/* Group 2 — Organize */}
        <Button
          role="menuitem"
          className="med-ctx-item"
          onClick={act(() => onSelect(item))}
        >
          Select
        </Button>
        <Button
          role="menuitem"
          className="med-ctx-item"
          onClick={act(() => onRename(item))}
        >
          Rename
        </Button>
        <div
          role="menuitem"
          className="med-ctx-item med-ctx-item--submenu"
          onMouseEnter={() => setMoveOpen(true)}
          onMouseLeave={() => setMoveOpen(false)}
        >
          Move to ▸
          {moveOpen ? (
            <div className="med-ctx-submenu" role="menu">
              <Button
                role="menuitem"
                className="med-ctx-item"
                onClick={act(() => onMove(item, null))}
                style={{ paddingLeft: 8 }}
              >
                (Root)
              </Button>
              {folderTree.map(({ folder, depth }) => (
                <Button
                  key={folder.id}
                  role="menuitem"
                  className="med-ctx-item"
                  onClick={act(() => onMove(item, folder.id))}
                  style={{ paddingLeft: 8 + (depth + 1) * 12 }}
                >
                  {folder.name}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="med-ctx-sep" role="separator" />

        {/* Group 3 — Copy */}
        <Button
          role="menuitem"
          className="med-ctx-item"
          onClick={act(() => onCopyUrl(item))}
        >
          Copy URL
        </Button>
        {item.type === "img" && item.altText ? (
          <Button
            role="menuitem"
            className="med-ctx-item"
            onClick={act(() => {
              try {
                navigator.clipboard.writeText(item.altText ?? "");
              } catch {
                /* clipboard API unavailable — silent no-op */
              }
            })}
          >
            Copy alt text
          </Button>
        ) : null}

        <div className="med-ctx-sep" role="separator" />

        {/* Group 4 — Danger */}
        <Button
          role="menuitem"
          className="med-ctx-item med-ctx-item--danger"
          onClick={act(() => onDelete(item))}
        >
          Delete
        </Button>
      </div>
    </>
  );
}
