import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * MediaContextMenu — right-click menu for an asset in the library grid.
 * Positioned at (x, y) in viewport coords; clamps to stay on-screen.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { LibraryItem, MediaFolder } from "../data/mediaTypes";

interface MediaContextMenuProps {
  x: number;
  y: number;
  item: LibraryItem;
  folders: MediaFolder[];
  onRename(item: LibraryItem): void;
  onMove(item: LibraryItem, folderId: string | null): void;
  onDelete(item: LibraryItem): void;
  onCopyUrl(item: LibraryItem): void;
  onEditImage(item: LibraryItem): void;
  onClose(): void;
}

const MENU_WIDTH = 140;
const MENU_ITEM_HEIGHT = 28;

export function MediaContextMenu({
  x,
  y,
  item,
  folders,
  onRename,
  onMove,
  onDelete,
  onCopyUrl,
  onEditImage,
  onClose,
}: MediaContextMenuProps) {
  const [moveOpen, setMoveOpen] = React.useState(false);

  // Close on outside click or Escape.
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".med-ctx-menu")) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Clamp so the menu stays on-screen.
  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const top = Math.min(y, window.innerHeight - MENU_ITEM_HEIGHT * 6 - 8);

  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <>
      <div className="med-ctx-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="med-ctx-menu"
        role="menu"
        aria-label="Asset actions"
        style={{ position: "fixed", left, top, width: MENU_WIDTH, zIndex: 200 }}
      >
        <Button role="menuitem" className="med-ctx-item" onClick={act(() => onRename(item))}>
          Rename
        </Button>
        {item.type === "img" ? (
          <Button role="menuitem" className="med-ctx-item" onClick={act(() => onEditImage(item))}>
            Edit image
          </Button>
        ) : null}
        <Button role="menuitem" className="med-ctx-item" onClick={act(() => onCopyUrl(item))}>
          Copy URL
        </Button>
        <div
          role="menuitem"
          className="med-ctx-item med-ctx-item--submenu"
          onMouseEnter={() => setMoveOpen(true)}
          onMouseLeave={() => setMoveOpen(false)}
        >
          Move to ▸
          {moveOpen && folders.length > 0 ? (
            <div className="med-ctx-submenu" role="menu">
              <Button
                role="menuitem"
                className="med-ctx-item"
                onClick={act(() => onMove(item, null))}
              >
                (Root)
              </Button>
              {folders.map((f) => (
                <Button
                  key={f.id}
                  role="menuitem"
                  className="med-ctx-item"
                  onClick={act(() => onMove(item, f.id))}
                >
                  {f.name}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="med-ctx-sep" aria-hidden="true" />
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
