/**
 * MediaContextMenu — right-click menu for an asset in the library grid.
 * Positioned at (x, y) in viewport coords; clamps to stay on-screen.
 *
 * Layout follows board 1163:13695 — ONE list, ONE divider before Delete:
 *   Insert to canvas · Select · Rename… · Move to folder › (nested picker) ·
 *   Copy URL · Edit image… ── Delete
 * Two items are ours and have no board slot; they sit beside their kin:
 * "Copy alt text" after Copy URL, "Replace across pages…" after Edit image.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside } from "../../../../../shared/hooks/useClickOutside";
import type { LibraryItem, MediaFolder } from "../data/mediaTypes";
import { Button } from "@/editor/chrome-ui";

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

// Board 1163:13931 — the menu is 180 wide, one divider, 11px rows.
const MENU_WIDTH = 180;

/*
  Board 1163:13695, as `tw:` utilities rather than a companion stylesheet.

  This shipped as MediaContextMenu.css with a note claiming real CSS was needed
  because "flowbite's Button theme (h-10, justify-center, font-medium) beats
  `tw:` overrides". That is not true here, and the repo proves it: the contract
  test at chrome-ui/__tests__/className-precedence.test.tsx asserts a caller's
  `tw:h-[22px] tw:px-1` on a flowbite Button both survives AND removes
  flowbite's conflicting `px-5`/`text-sm` — twMerge runs on our own `tw` prefix,
  so the caller wins by design. The cited precedent (.bdc-menu-item in the
  Layers menu) is older code, not evidence.

  `font: inherit` does not survive the move, so the item spells its own type out:
  flowbite Button ships text-sm/font-medium and something has to displace them.
*/
const ITEM_BASE =
  "tw:flex tw:items-center tw:justify-start tw:w-full tw:h-[28px] " +
  "tw:px-[var(--bk-space-12)] tw:border-0 tw:rounded-none tw:bg-transparent " +
  "tw:text-left tw:cursor-pointer tw:text-[13px] tw:leading-[18px] " +
  "tw:font-normal tw:[font-family:var(--bk-font-ui)] tw:text-[var(--bk-ink)]";

/* Button rows: real <button>, so :enabled / :disabled are live. */
const ITEM =
  `${ITEM_BASE} tw:enabled:hover:bg-[var(--bk-bg-subtle)] ` +
  "tw:disabled:text-[var(--bk-ink-muted)] tw:disabled:cursor-not-allowed " +
  "tw:focus-visible:outline-none tw:focus-visible:shadow-[var(--bk-shadow-focus)]";

/* The board draws Delete in error ink, under its own divider. */
const ITEM_DANGER =
  `${ITEM} tw:text-[var(--bk-error)] tw:enabled:hover:bg-[var(--bk-error-tint)]`;

/* "Move to folder ›" is a <div role="menuitem">, where :enabled never matches —
   it takes a plain hover. `relative` because the submenu is nested INSIDE this
   row, so this row is the positioning context it flies out from. */
const ITEM_SUBMENU =
  `${ITEM_BASE} tw:justify-between tw:relative tw:hover:bg-[var(--bk-bg-subtle)]`;

const MENU_SURFACE =
  "tw:bg-[var(--bk-bg-card)] tw:rounded-[var(--bk-radius-lg)] " +
  "tw:shadow-[var(--bk-shadow-overlay)] tw:py-[var(--bk-space-4)]";
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
      <div className="tw:fixed tw:inset-0 tw:z-[199]" onClick={onClose} aria-hidden="true" />
      <div
        ref={menuRef}
        className={`${MENU_SURFACE} tw:text-[13px] tw:leading-[18px] tw:font-normal tw:[font-family:var(--bk-font-ui)] tw:text-[var(--bk-ink)]`}
        role="menu"
        aria-label="Asset actions"
        style={{ position: "fixed", left, top, width: MENU_WIDTH, zIndex: 200 }}
      >
        {/*
          Order and copy come from board 1163:13695, which draws ONE list and
          one divider: Insert to canvas · Select · Rename… · Move to folder › ·
          Copy URL · Edit image… ── Delete. The two items the board has no slot
          for are ours, not its — "Replace across pages…" and "Copy alt text"
          sit next to their own kin (the image op, the other copy) rather than
          being dropped, per the codebase-only rule.
        */}
        <Button
          role="menuitem"
          className={ITEM}
          onClick={act(() => onInsert(item))}
        >
          Insert to canvas
        </Button>
        <Button
          role="menuitem"
          className={ITEM}
          onClick={act(() => onSelect(item))}
        >
          Select
        </Button>
        <Button
          role="menuitem"
          className={ITEM}
          onClick={act(() => onRename(item))}
        >
          Rename…
        </Button>
        <div
          role="menuitem"
          className={ITEM_SUBMENU}
          onMouseEnter={() => setMoveOpen(true)}
          onMouseLeave={() => setMoveOpen(false)}
        >
          Move to folder ›
          {moveOpen ? (
            <div className={`${MENU_SURFACE} tw:absolute tw:left-full tw:top-0 tw:min-w-[160px] tw:z-[1]`} role="menu">
              <Button
                role="menuitem"
                className={ITEM}
                onClick={act(() => onMove(item, null))}
                style={{ paddingLeft: 8 }}
              >
                (Root)
              </Button>
              {folderTree.map(({ folder, depth }) => (
                <Button
                  key={folder.id}
                  role="menuitem"
                  className={ITEM}
                  onClick={act(() => onMove(item, folder.id))}
                  style={{ paddingLeft: 8 + (depth + 1) * 12 }}
                >
                  {folder.name}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <Button
          role="menuitem"
          className={ITEM}
          onClick={act(() => onCopyUrl(item))}
        >
          Copy URL
        </Button>
        {item.type === "img" && item.altText ? (
          <Button
            role="menuitem"
            className={ITEM}
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
        {item.type === "img" ? (
          <Button
            role="menuitem"
            className={ITEM}
            onClick={act(() => onEditImage(item))}
          >
            Edit image…
          </Button>
        ) : null}
        {onReplaceAcross && (item.type === "img" || item.type === "vid") ? (
          <Button
            role="menuitem"
            className={ITEM}
            onClick={act(() => onReplaceAcross(item))}
          >
            Replace across pages…
          </Button>
        ) : null}

        <div className="tw:h-px tw:my-[var(--bk-space-4)] tw:bg-[var(--bk-border)]" role="separator" />

        <Button
          role="menuitem"
          className={ITEM_DANGER}
          onClick={act(() => onDelete(item))}
        >
          Delete
        </Button>
      </div>
    </>
  );
}
