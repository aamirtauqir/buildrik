/**
 * LayerContextMenu - Right-click context menu for layer rows.
 * Props-only, no hook imports. Closes on click-outside + Escape.
 *
 * With two or more rows selected and the clicked row among them, the menu is
 * the selection's (board 6881:71323 "context-menu · 3 selected"): every row
 * that acts on elements says how many — "Cut · 3 elements", "Delete · 3
 * elements" — and Rename stands down, because a rename is one layer's. This
 * replaced the `LayerSelectionBanner` (audit G2-068: same bulk actions in a
 * banner, a menu and the canvas toolbar; the boards keep the count line and
 * the menu).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import type { LayerAction } from "../types";
import { Menu, MenuItem } from "@/editor/chrome-ui";

interface LayerContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
  /** Rows currently selected in the tree. */
  selectedCount: number;
  /** The clicked row is one of them — the menu acts on the whole selection. */
  inSelection: boolean;
  /** composer.clipboard holds an element — enables Paste. */
  hasClipboard: boolean;
  onAction: (action: LayerAction, id: string) => void;
  onClose: () => void;
}

/** "3 elements" — the board's own suffix, singular never shown (N ≥ 2). */
export const elementsLabel = (n: number) => `${n} elements`;

/* chrome-ui's Menu/MenuItem (DQ-018): one roving-focus contract — first row
   focused on open, ↑ ↓ Home End — instead of this file's own. The board's
   geometry (4418:79546: 28h, 12 inset, flush, 13/400 ink) stays in
   layers-v2.css's `.bdc-menu-item`, which is unlayered and so beats
   MenuItem's own row classes property by property. */
const ITEM = "bdc-menu-item";

export function LayerContextMenu({
  x,
  y,
  nodeId,
  nodeName,
  selectedCount,
  inSelection,
  hasClipboard,
  onAction,
  onClose,
}: LayerContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, { closeOnEscape: true });

  const act = (action: LayerAction) => {
    onAction(action, nodeId);
    onClose();
  };

  /* How many elements the rows below act on. */
  const count = inSelection && selectedCount >= 2 ? selectedCount : 1;
  const multi = count >= 2;
  /* 4418:79546 names the target on every row that acts on it ("Cut ·
     Heading"); a selection reads "· 3 elements" (6881:71323). */
  const name = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);
  const suffix = ` · ${multi ? elementsLabel(count) : name}`;

  return (
    <div ref={menuRef} className="bdc-menu" style={{ left: x, top: y, zIndex: 9999 }}>
    <Menu
      className="tw:p-0! tw:min-w-0!"
      data-testid="layer-context-menu"
      data-selection-count={count}
      label={multi ? `Actions for ${elementsLabel(count)}` : `Actions for ${nodeName}`}
    >
      {/* Board 4418:79546 / 6881:71323: Cut · Copy · Paste | Duplicate ·
          Delete | Rename · Group | Move to page… · Copy link. Plain 28h rows,
          no kbd hints, no icons. Hide/Lock live on the row's own eye/lock;
          reordering is drag. */}
      <MenuItem className={ITEM} data-testid="layer-menu-cut"
        onClick={() => act("cut")}>
        Cut{suffix}
      </MenuItem>
      <MenuItem className={ITEM} data-testid="layer-menu-copy"
        onClick={() => act("copy")}>
        Copy{suffix}
      </MenuItem>
      <MenuItem
        className={ITEM}
        disabled={!hasClipboard}
        title={hasClipboard ? undefined : "Copy or cut an element first"}
        data-testid="layer-menu-paste"
        onClick={() => act("paste")}
      >
        Paste
      </MenuItem>
      <div className="bdc-menu-sep" role="separator" data-testid="layer-menu-sep" />
      <MenuItem className={ITEM} data-testid="layer-menu-duplicate"
        onClick={() => act("duplicate")}>
        Duplicate{suffix}
      </MenuItem>
      <MenuItem className={ITEM} data-testid="layer-menu-delete"
        onClick={() => act("delete")}>
        Delete{suffix}
      </MenuItem>
      <div className="bdc-menu-sep" role="separator" />
      <MenuItem
        className={ITEM}
        disabled={multi}
        title={multi ? "Rename one layer at a time" : undefined}
        data-testid="layer-menu-rename"
        onClick={() => act("rename")}
      >
        Rename{multi ? "" : suffix}
      </MenuItem>
      <MenuItem
        className={ITEM}
        data-testid="layer-menu-group"
        onClick={() => act("group")}
      >
        Group{suffix}
      </MenuItem>
      <div className="bdc-menu-sep" role="separator" />
      <MenuItem className={ITEM} data-testid="layer-menu-move-to-page"
        onClick={() => act("moveToPage")}>
        Move to page…{suffix}
      </MenuItem>
      {/* A URL that reopens the editor with the CLICKED element selected —
          one element even inside a selection: a link cannot select three. */}
      <MenuItem className={ITEM} data-testid="layer-menu-copy-link"
        onClick={() => act("copyLink")}>
        Copy link · {name}
      </MenuItem>
    </Menu>
    </div>
  );
}
