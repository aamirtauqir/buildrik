/**
 * PageContextMenu — portal context menu for page actions.
 *
 * Rules:
 * - Renders through <Portal> into the shared chrome overlay root
 * - "Delete page" is DISABLED (not hidden) when: page is homepage OR only page
 * - Keyboard: Escape closes here; <Menu> owns ↑↓/Home/End roving and, unlike
 *   the hand-rolled version this replaced, SKIPS the disabled Delete item
 * - design-2l9 board 63:13820 draws the menu bare: no chord hints (F2, ⌘D,
 *   ⌥↑/⌥↓, ⌫ still work on the row), no rule, "Page settings ›", and Delete
 *   page in the menu's own ink.
 * - design-2l9 boards 63:13820 / 131:41791 / 137:55343: Save as template… ·
 *   Move to folder… · Move up ⌥↑ / Move down ⌥↓ join the menu in the board's
 *   order; a move that cannot happen is disabled and says why (137:56060,
 *   137:56781, 127:39528).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";
import { Menu, MenuItem, POPOVER_BASE_CLASS, Portal } from "@/editor/chrome-ui";

/* A disabled row shows no tooltip, so its reason is a line in the menu. */
const MENU_NOTE = "tw:m-0 tw:px-2 tw:pt-1 tw:pb-1.5 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

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
  /** Board 6883:69504 — "Replace layout with template…" (audit G2-078). */
  onReplaceLayout: (id: string) => void;
  onCopyLink: (id: string) => void;
  onSettings: (id: string) => void;
  /** The folder this page sits in, if any — offers "Remove from <folder>".
   *  It was a hover × on the row's left edge; v3 7069:79370 gives that spot
   *  to the ⠿ handle. */
  folderName?: string;
  onRemoveFromFolder: (id: string) => void;
  /** Board 63:13820 "Save as template…" — the page, as a reusable template. */
  onSaveAsTemplate: (id: string) => void;
  /** Board 131:41791 "Move to folder…" — opens the one-page Move dialog. */
  onMoveToFolder: (id: string) => void;
  /** Board 137:55343 — one place up or down among the top-level pages. */
  onMove: (id: string, direction: -1 | 1) => void;
  /** Where the page sits among the top-level pages (folder members: null). */
  rootPosition: { index: number; count: number } | null;
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
  onReplaceLayout,
  onCopyLink,
  onSettings,
  folderName,
  onRemoveFromFolder,
  onSaveAsTemplate,
  onMoveToFolder,
  onMove,
  rootPosition,
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

  const name = page?.name ?? "This page";
  const isFirst = rootPosition !== null && rootPosition.index === 0;
  const isLast = rootPosition !== null && rootPosition.index === rootPosition.count - 1;
  /* One line under the pair, as boards 137:56060 / 137:56781 / 127:39528 draw it. */
  const moveReason =
    rootPosition === null
      ? "Pages in a folder can’t be reordered."
      : rootPosition.count === 1
        ? `${name} is the only top-level page.`
        : isFirst
          ? `${name} is the first top-level page.`
          : isLast
            ? `${name} is the last top-level page.`
            : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(y, window.innerHeight - 420),
    left: Math.min(x, window.innerWidth - 288),
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
    <div
      ref={menuRef}
      /* design-2l9 63:13820 / 131:41791 — the menu is 280 wide (224 wrapped
         "Replace layout with template…" onto two lines). */
      className={`bd-pg-menu ${POPOVER_BASE_CLASS} tw:!fixed tw:w-70`}
      style={style}
      data-testid="pages-context-menu"
    >
      <Menu label={`Options for ${page?.name ?? "page"}`} onKeyDown={handleKeyDown}>
        {/* design-2l9 63:13820: bare labels, in the board's order. */}
        <MenuItem data-testid="pages-menu-rename" onClick={() => act(() => onRename(pageId))}>
          Rename…
        </MenuItem>
        <MenuItem data-testid="pages-menu-duplicate" onClick={() => act(() => onDuplicate(pageId))}>
          Duplicate
        </MenuItem>
        {!isHome && (
          <MenuItem data-testid="pages-menu-homepage" onClick={() => act(() => onSetHomepage(pageId))}>
            Set as homepage
          </MenuItem>
        )}
        <MenuItem data-testid="pages-menu-replace-layout" onClick={() => act(() => onReplaceLayout(pageId))}>
          Replace layout with template…
        </MenuItem>
        <MenuItem data-testid="pages-menu-save-template" onClick={() => act(() => onSaveAsTemplate(pageId))}>
          Save as template…
        </MenuItem>
        <MenuItem data-testid="pages-menu-move-folder" onClick={() => act(() => onMoveToFolder(pageId))}>
          Move to folder…
        </MenuItem>
        <MenuItem
          disabled={rootPosition === null || isFirst}
          data-testid="pages-menu-move-up"
          onClick={() => act(() => onMove(pageId, -1))}
        >
          Move up
        </MenuItem>
        <MenuItem
          disabled={rootPosition === null || isLast}
          data-testid="pages-menu-move-down"
          onClick={() => act(() => onMove(pageId, 1))}
        >
          Move down
        </MenuItem>
        {moveReason && (
          <p className={MENU_NOTE} data-testid="pages-menu-move-reason">
            {moveReason}
          </p>
        )}
        <MenuItem data-testid="pages-menu-copy-link" onClick={() => act(() => onCopyLink(pageId))}>
          Copy link
        </MenuItem>
        <MenuItem data-testid="pages-menu-settings" onClick={() => act(() => onSettings(pageId))}>
          Page settings ›
        </MenuItem>
        {folderName && (
          <MenuItem data-testid="pages-menu-remove-folder" onClick={() => act(() => onRemoveFromFolder(pageId))}>
            Remove from {folderName}
          </MenuItem>
        )}
        <MenuItem
          disabled={deleteDisabled}
          title={deleteTooltip}
          data-testid="pages-menu-delete"
          onClick={() => act(() => onDelete(pageId))}
        >
          Delete page
        </MenuItem>
        {/* 6883:69130 — why Delete is off, said in the menu (a disabled row
            shows no tooltip). */}
        {deleteDisabled && (
          <p className={MENU_NOTE} data-testid="pages-menu-delete-reason">
            {isHome ? "Homepage can’t be deleted" : "A site needs at least one page"}
          </p>
        )}
      </Menu>
    </div>
  );

  return <Portal>{menu}</Portal>;
};
