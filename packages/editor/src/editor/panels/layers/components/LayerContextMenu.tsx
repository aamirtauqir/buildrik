import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * LayerContextMenu - Right-click context menu for layer rows.
 * Props-only, no hook imports. Closes on click-outside + Escape.
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { LayerAction } from "../types";

interface LayerContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodeName: string;
  isHidden: boolean;
  isLocked: boolean;
  childCount: number;
  selectedCount: number;
  onAction: (action: LayerAction, id: string) => void;
  onClose: () => void;
}

export function LayerContextMenu({
  x,
  y,
  nodeId,
  nodeName,
  isHidden,
  isLocked,
  childCount,
  selectedCount,
  onAction,
  onClose,
}: LayerContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Focus first menu item on mount (WCAG 2.1 — focus moves into menu when opened)
  React.useEffect(() => {
    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus();
  }, []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

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
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("rename")}>
        <span className="bdc-menu-lbl">Rename</span>
        <span className="bdc-menu-kbd">F2</span>
      </Button>
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("duplicate")}>
        <span className="bdc-menu-lbl">Duplicate</span>
        <span className="bdc-menu-kbd">⌘D</span>
      </Button>
      <div className="bdc-menu-sep" />
      <Button
        className="bdc-menu-item"
        role="menuitem"
        onClick={() => act(isHidden ? "show" : "hide")}
      >
        {isHidden ? "Show" : "Hide"}
      </Button>
      <Button
        className="bdc-menu-item"
        role="menuitem"
        onClick={() => act(isLocked ? "unlock" : "lock")}
      >
        {isLocked ? "Unlock" : "Lock"}
      </Button>
      <div className="bdc-menu-sep" />
      {selectedCount > 1 && (
        <Button className="bdc-menu-item" role="menuitem" onClick={() => act("group")}>
          <span className="bdc-menu-lbl">Group {selectedCount} layers</span>
          <span className="bdc-menu-kbd">⌘G</span>
        </Button>
      )}
      {childCount > 0 && (
        <Button
          className="bdc-menu-item"
          role="menuitem"
          onClick={() => act("selectChildren")}
        >
          Select children
        </Button>
      )}
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("moveToTop")}>
        <span className="bdc-menu-lbl">Move to top</span>
        <span className="bdc-menu-kbd">⌘⇧]</span>
      </Button>
      <Button className="bdc-menu-item" role="menuitem" onClick={() => act("moveToBottom")}>
        <span className="bdc-menu-lbl">Move to bottom</span>
        <span className="bdc-menu-kbd">⌘⇧[</span>
      </Button>
      <div className="bdc-menu-sep" />
      <Button
        className="bdc-menu-item bdc-menu-danger"
        role="menuitem"
        onClick={() => act("delete")}
      >
        <span className="bdc-menu-lbl">
          Delete
          {childCount > 0 ? ` (+ ${childCount} child${childCount === 1 ? "" : "ren"})` : ""}
        </span>
        <span className="bdc-menu-kbd">⌫</span>
      </Button>
    </div>
  );
}
