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
      className="aqb-layer-ctx-menu"
      style={{ position: "fixed", left: x, top: y, zIndex: 9999 }}
      role="menu"
      aria-label={`Actions for ${nodeName}`}
    >
      <button className="aqb-layer-ctx-item" role="menuitem" onClick={() => act("rename")}>
        <span>Rename</span>
        <span className="aqb-ctx-hint">F2</span>
      </button>
      <button className="aqb-layer-ctx-item" role="menuitem" onClick={() => act("duplicate")}>
        <span>Duplicate</span>
        <span className="aqb-ctx-hint">⌘D</span>
      </button>
      <div className="aqb-layer-ctx-divider" />
      <button
        className="aqb-layer-ctx-item"
        role="menuitem"
        onClick={() => act(isHidden ? "show" : "hide")}
      >
        {isHidden ? "Show" : "Hide"}
      </button>
      <button
        className="aqb-layer-ctx-item"
        role="menuitem"
        onClick={() => act(isLocked ? "unlock" : "lock")}
      >
        {isLocked ? "Unlock" : "Lock"}
      </button>
      <div className="aqb-layer-ctx-divider" />
      {selectedCount > 1 && (
        <button className="aqb-layer-ctx-item" role="menuitem" onClick={() => act("group")}>
          <span>Group {selectedCount} layers</span>
          <span className="aqb-ctx-hint">⌘G</span>
        </button>
      )}
      {childCount > 0 && (
        <button
          className="aqb-layer-ctx-item"
          role="menuitem"
          onClick={() => act("selectChildren")}
        >
          Select children
        </button>
      )}
      <button className="aqb-layer-ctx-item" role="menuitem" onClick={() => act("moveToTop")}>
        <span>Move to top</span>
        <span className="aqb-ctx-hint">⌘⇧]</span>
      </button>
      <button className="aqb-layer-ctx-item" role="menuitem" onClick={() => act("moveToBottom")}>
        <span>Move to bottom</span>
        <span className="aqb-ctx-hint">⌘⇧[</span>
      </button>
      <div className="aqb-layer-ctx-divider" />
      <button
        className="aqb-layer-ctx-item aqb-layer-ctx-item--danger"
        role="menuitem"
        onClick={() => act("delete")}
      >
        <span>
          Delete
          {childCount > 0 ? ` (+ ${childCount} child${childCount === 1 ? "" : "ren"})` : ""}
        </span>
        <span className="aqb-ctx-hint">⌫</span>
      </button>
    </div>
  );
}
