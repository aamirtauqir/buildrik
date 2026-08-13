/**
 * LayerContextMenu - Right-click context menu for layer rows.
 * Props-only, no hook imports. Closes on click-outside + Escape.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useClickOutside } from "../../../../shared/hooks/useClickOutside";
import type { LayerAction } from "../types";
import { Button } from "@/editor/chrome-ui";

interface LayerContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
  selectedCount: number;
  /** composer.clipboard holds an element — enables Paste. */
  hasClipboard: boolean;
  onAction: (action: LayerAction, id: string) => void;
  onClose: () => void;
}

export function LayerContextMenu({
  x,
  y,
  nodeId,
  nodeName,
  selectedCount,
  hasClipboard,
  onAction,
  onClose,
}: LayerContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Focus first menu item on mount (WCAG 2.1 — focus moves into menu when opened)
  React.useEffect(() => {
    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus();
  }, []);

  useClickOutside(menuRef, onClose, { closeOnEscape: true });

  const act = (action: LayerAction) => {
    onAction(action, nodeId);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="bdc-menu"
      style={{ position: "fixed", left: x, top: y, zIndex: 9999 }}
      role="menu"
      aria-label={`Actions for ${nodeName}`}
    >
      {/* Board 1082:4527: Cut · Copy · Paste | Duplicate · Delete |
          Rename · Group selection. Plain 28h rows, no kbd hints, no icons.
          Hide/Lock live on the row's own 👁🔒; reordering is drag. Move to
          page… and Copy link wait for real backing — a dead item is worse
          than a missing one. */}
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("cut")}>
        Cut
      </Button>
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("copy")}>
        Copy
      </Button>
      <Button
        className="bdc-menu-item"
        role="menuitem"
        disabled={!hasClipboard}
        title={hasClipboard ? undefined : "Copy or cut an element first"}
        onClick={() => act("paste")}
      >
        Paste
      </Button>
      <div className="bdc-menu-sep" />
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("duplicate")}>
        Duplicate
      </Button>
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("delete")}>
        Delete
      </Button>
      <div className="bdc-menu-sep" />
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("rename")}>
        Rename
      </Button>
      <Button
        className="bdc-menu-item"
        role="menuitem"
        disabled={selectedCount < 2}
        title={selectedCount < 2 ? "Select 2 or more layers first" : undefined}
        onClick={() => act("group")}
      >
        Group selection
      </Button>
    </div>
  );
}
