/**
 * MediaContextMenu — the asset menu in the library grid: a right-click on a
 * card or row, or the card's `···` (Clone 3721:43552), which anchors it to
 * the button. Positioned at (x, y) in viewport coords; clamps to stay
 * on-screen.
 *
 * ONE list, ONE divider before Delete (board 1163:13695). The order of the
 * Clone's own items is 3721:43552's — Select · Rename… · Edit image… ·
 * Move to folder… ── Delete — with Insert to canvas first (Phase 1's V1
 * rule). `Move to folder…` opens the orchestrator's Move modal for this one
 * file (3721:45952); the nested folder submenu it replaced is gone with it.
 * Three items are ours and have no board slot; they sit beside their kin:
 * Copy URL, "Copy alt text" after it, "Replace across pages…" after them.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside } from "../../../../../shared/hooks/useClickOutside";
import type { LibraryItem } from "../data/mediaTypes";
import { Button } from "@/editor/chrome-ui";

interface MediaContextMenuProps {
  x: number;
  y: number;
  item: LibraryItem;
  onInsert(item: LibraryItem): void;
  onRename(item: LibraryItem): void;
  /** Clone 3721:45952 — asks the orchestrator for the Move modal on this file. */
  onMoveToFolder(item: LibraryItem): void;
  onDelete(item: LibraryItem): void;
  onCopyUrl(item: LibraryItem): void;
  onEditImage(item: LibraryItem): void;
  onSelect(item: LibraryItem): void;
  onReplaceAcross?(item: LibraryItem): void;
  onClose(): void;
}

// Board 1163:13931 — the menu is 180 wide, one divider, 11px rows.
/* 182, so the ROWS are the board's 180. 1163:13932 gives each item w-180 and
   1163:13931 gives the surface a --color/border stroke; Figma strokes do not
   consume layout and a CSS border does, so a 180 box with a border leaves 178
   inside it. */
const MENU_WIDTH = 182;

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
/* 1163:13932 — rows HUG on a 12/7 pad at 11px in ink-soft. The fixed
   `--bk-size-row-dense` height is why the board's 7 had never been applied: a
   set height and a padding are different properties, so nothing conflicted and
   nothing won. */
const ITEM_BASE =
  "tw:flex tw:items-center tw:justify-start tw:w-full tw:min-h-0 tw:py-1.75 " +
  "tw:px-[var(--bk-space-12)] tw:border-0 tw:rounded-none tw:bg-transparent " +
  "tw:text-left tw:cursor-pointer tw:text-[11px] tw:leading-[18px] " +
  "tw:font-normal tw:[font-family:var(--bk-font-ui)] tw:text-[var(--bk-ink-soft)]";

/* Button rows: real <button>, so :enabled / :disabled are live. */
const ITEM =
  `${ITEM_BASE} tw:enabled:hover:bg-[var(--bk-bg-subtle)] ` +
  "tw:disabled:text-[var(--bk-ink-muted)] tw:disabled:cursor-not-allowed " +
  "tw:focus-visible:outline-none tw:focus-visible:shadow-[var(--bk-shadow-focus)]";

/* The board draws Delete in error ink, under its own divider. */
const ITEM_DANGER =
  `${ITEM} tw:text-[var(--bk-error)] tw:enabled:hover:bg-[var(--bk-error-tint)]`;

/* 1163:13931 — bg-elevated on a --color/border edge, 8 radius, 6 top/bottom.
   The edge was missing entirely, so the menu's only separation from what it
   covers was its shadow. */
const MENU_SURFACE =
  "tw:bg-[var(--bk-bg-elevated)] tw:rounded-[var(--bk-radius-lg)] " +
  "tw:border tw:border-[var(--bk-border)] " +
  "tw:shadow-[var(--bk-shadow-overlay)] tw:py-1.5";
const MENU_ITEM_HEIGHT = 28;

export function MediaContextMenu({
  x,
  y,
  item,
  onInsert,
  onRename,
  onMoveToFolder,
  onDelete,
  onCopyUrl,
  onEditImage,
  onSelect,
  onReplaceAcross,
  onClose,
}: MediaContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose);

  /* Escape belongs to the menu, not to the surface underneath it. The hook
     closed on a document-BUBBLE listener that stopped nothing, so the same
     keystroke also reached LibraryManager's window listener and shut the
     whole fullpage manager (measured, board 1163:13695). Closing at document
     CAPTURE and stopping the event there is the pattern the drill-in
     overlays already use. */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const left = Math.min(x, window.innerWidth - MENU_WIDTH - 8);
  const top = Math.min(y, window.innerHeight - MENU_ITEM_HEIGHT * 8 - 8);

  const act = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <>
      <div className="tw:fixed tw:inset-0 tw:z-[199]" onClick={onClose} aria-hidden="true" />
      <div
        ref={menuRef}
        className={`${MENU_SURFACE} tw:text-[11px] tw:leading-[18px] tw:font-normal tw:[font-family:var(--bk-font-ui)] tw:text-[var(--bk-ink-soft)]`}
        role="menu"
        aria-label="Asset actions"
        data-testid="media-ctx-menu"
        style={{ position: "fixed", left, top, width: MENU_WIDTH, zIndex: 200 }}
      >
        {/*
          ONE list and one divider (board 1163:13695); the Clone's items in
          3721:43552's order — Select · Rename… · Edit image… · Move to
          folder… ── Delete — under Insert to canvas. The three items no board
          has a slot for are ours, not its — Copy URL, "Copy alt text" and
          "Replace across pages…" sit together after Move rather than being
          dropped, per the codebase-only rule.
        */}
        <Button
          role="menuitem"
          className={ITEM}
          data-testid="media-ctx-insert"
          onClick={act(() => onInsert(item))}
        >
          Insert to canvas
        </Button>
        <Button
          role="menuitem"
          className={ITEM}
          data-testid="media-ctx-select"
          onClick={act(() => onSelect(item))}
        >
          Select
        </Button>
        <Button
          role="menuitem"
          className={ITEM}
          data-testid="media-ctx-rename"
          onClick={act(() => onRename(item))}
        >
          Rename…
        </Button>
        {item.type === "img" ? (
          <Button
            role="menuitem"
            className={ITEM}
            data-testid="media-ctx-edit"
            onClick={act(() => onEditImage(item))}
          >
            Edit image…
          </Button>
        ) : null}
        {/* Clone 3721:45952 — the Move modal for this one file (`Move 1
            asset`), the same one the bulk bar opens; the (Root) + every-folder
            submenu that flew out here is displaced. */}
        <Button
          role="menuitem"
          className={ITEM}
          data-testid="media-ctx-move"
          onClick={act(() => onMoveToFolder(item))}
        >
          Move to folder…
        </Button>

        <Button
          role="menuitem"
          className={ITEM}
          data-testid="media-ctx-copy-url"
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
          data-testid="media-ctx-delete"
          onClick={act(() => onDelete(item))}
        >
          Delete
        </Button>
      </div>
    </>
  );
}
