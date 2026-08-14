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
import { Menu, MenuItem, MenuSeparator, POPOVER_BASE_CLASS, Portal } from "@/editor/chrome-ui";

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
    /* bd-pg-menu is LOAD-BEARING: usePages' outside-mousedown close guard
       checks closest(".bd-pg-menu") — without it every item's mousedown
       unmounted the menu before its click could fire. It carries no styling
       of its own, which is why this box needs POPOVER_BASE_CLASS: chrome-ui's
       Menu is padding and roving focus only, and every other caller gets the
       surface from the Popover wrapping it. Without it this menu painted
       transparent — six items floating over the page list, its rows legible
       straight through them.
       `tw:!fixed` because the shared class is `absolute` and the position is
       computed from the click, not from an anchor. */
    <div ref={menuRef} className={`bd-pg-menu ${POPOVER_BASE_CLASS} tw:!fixed`} style={style}>
      <Menu label={`Options for ${page?.name ?? "page"}`} onKeyDown={handleKeyDown}>
        {/* Board 1171:4753 labels — sentence case, ellipsis on the two that
            open something. It draws no shortcut hints; the shortcuts still
            work from the row (F2 / ⌘D / ⌘,). */}
        <MenuItem onClick={() => act(() => onRename(pageId))}>Rename…</MenuItem>
        <MenuItem onClick={() => act(() => onDuplicate(pageId))}>Duplicate</MenuItem>
        {!isHome && (
          <MenuItem onClick={() => act(() => onSetHomepage(pageId))}>Set as homepage</MenuItem>
        )}
        <MenuItem onClick={() => act(() => onCopyLink(pageId))}>Copy link</MenuItem>
        <MenuItem onClick={() => act(() => onSettings(pageId))}>Page settings…</MenuItem>
        <MenuSeparator />
        <MenuItem
          danger
          disabled={deleteDisabled}
          title={deleteTooltip}
          onClick={() => act(() => onDelete(pageId))}
        >
          Delete page
        </MenuItem>
      </Menu>
    </div>
  );

  return <Portal>{menu}</Portal>;
};
