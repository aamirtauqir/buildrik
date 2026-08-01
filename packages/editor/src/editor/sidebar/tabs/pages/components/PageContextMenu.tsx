/**
 * PageContextMenu — portal context menu for page actions.
 *
 * Rules:
 * - Renders through <Portal> into the shared chrome overlay root
 * - "Delete Page" is DISABLED (not hidden) when: page is homepage OR only page
 * - Keyboard: Escape closes here; <Menu> owns ↑↓/Home/End roving and, unlike
 *   the hand-rolled version this replaced, SKIPS the disabled Delete item
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";
import { Menu, MenuItem, MenuSeparator, Portal } from "@/editor/chrome-ui";

interface Props {
  pageId: string;
  x: number;
  y: number;
  pages: PageItem[];
  onClose: () => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSetHomepage: (id: string) => void;
  onCopyLink: (id: string) => void;
  onSettings: (id: string) => void;
}

export const PageContextMenu: React.FC<Props> = ({
  pageId,
  x,
  y,
  pages,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onSetHomepage,
  onCopyLink,
  onSettings,
}) => {
  const page = pages.find((p) => p.id === pageId);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const isHome = page?.isHome ?? false;
  const isOnly = pages.length <= 1;
  const deleteDisabled = isHome || isOnly;
  const deleteTooltip = isHome
    ? "Set another page as Homepage before deleting this one"
    : isOnly
      ? "A site needs at least 1 page. Add another page first."
      : undefined;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(y, window.innerHeight - 260),
    left: Math.min(x, window.innerWidth - 220),
    zIndex: 9999,
  };

  const act = (fn: () => void) => {
    fn();
    onClose();
  };

  const menu = (
    <div ref={menuRef} style={style}>
      <Menu label={`Options for ${page?.name ?? "page"}`} onKeyDown={handleKeyDown}>
        <MenuItem kbd="F2" onClick={() => act(() => onRename(pageId))}>
          Rename
        </MenuItem>
        <MenuItem kbd="⌘D" onClick={() => act(() => onDuplicate(pageId))}>
          Duplicate
        </MenuItem>
        {!isHome && (
          <MenuItem onClick={() => act(() => onSetHomepage(pageId))}>Set as Homepage</MenuItem>
        )}
        <MenuItem onClick={() => act(() => onCopyLink(pageId))}>Copy Page Link</MenuItem>
        <MenuItem kbd="⌘," onClick={() => act(() => onSettings(pageId))}>
          Page Settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          danger
          disabled={deleteDisabled}
          title={deleteTooltip}
          onClick={() => act(() => onDelete(pageId))}
        >
          Delete Page
        </MenuItem>
      </Menu>
    </div>
  );

  return <Portal>{menu}</Portal>;
};
