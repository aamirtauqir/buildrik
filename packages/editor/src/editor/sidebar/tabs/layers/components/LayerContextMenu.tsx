/**
 * LayerContextMenu — Right-click context menu for layer tree rows
 * Per .pen Screen 11: Delete, Group, Rename, Lock/Unlock actions.
 * Positioned absolutely at click coordinates.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Trash2, Group, Edit3, Lock, Unlock } from "lucide-react";
import { useClickOutside } from "@/shared/hooks";
import { Button } from "@/editor/chrome-ui";

export interface LayerContextMenuProps {
  /** Screen coordinates where the menu should appear */
  position: { x: number; y: number };
  /** Whether the target element is locked */
  isLocked: boolean;
  /** Callbacks for each action */
  onDelete: () => void;
  onGroup: () => void;
  onRename: () => void;
  onToggleLock: () => void;
  /** Close the menu */
  onClose: () => void;
}

export const LayerContextMenu: React.FC<LayerContextMenuProps> = ({
  position,
  isLocked,
  onDelete,
  onGroup,
  onRename,
  onToggleLock,
  onClose,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, onClose, { closeOnEscape: true });

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        ...menuStyles,
        left: position.x,
        top: position.y,
      }}
      role="menu"
      aria-label="Layer actions"
    >
      <Button style={itemStyles} role="menuitem" onClick={() => handleAction(onRename)}>
        <Edit3 size={14} />
        <span>Rename</span>
      </Button>
      <Button style={itemStyles} role="menuitem" onClick={() => handleAction(onGroup)}>
        <Group size={14} />
        <span>Group</span>
      </Button>
      <Button style={itemStyles} role="menuitem" onClick={() => handleAction(onToggleLock)}>
        {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
        <span>{isLocked ? "Unlock" : "Lock"}</span>
      </Button>
      <div style={dividerStyles} />
      <Button style={{ ...itemStyles, color: "var(--bk-error)" }} role="menuitem" onClick={() => handleAction(onDelete)}>
        <Trash2 size={14} />
        <span>Delete</span>
      </Button>
    </div>
  );
};

// ============================================
// DragTooltip — Shows validation message during drag operations
// ============================================

export interface DragTooltipProps {
  /** Tooltip message */
  message: string;
  /** Screen coordinates (follows cursor) */
  position: { x: number; y: number };
  /** Variant affects styling */
  variant?: "error" | "info";
}

export const DragTooltip: React.FC<DragTooltipProps> = ({
  message,
  position,
  variant = "error",
}) => (
  <div
    style={{
      ...tooltipStyles,
      left: position.x + 12,
      top: position.y + 12,
      background: variant === "error" ? "var(--bk-error)" : "var(--bk-bg-subtle)",
    }}
    role="tooltip"
  >
    {message}
  </div>
);

// ============================================
// Styles
// ============================================

const menuStyles: React.CSSProperties = {
  position: "fixed",
  zIndex: 10000,
  background: "var(--bk-bg-card)",
  border: "1px solid var(--bk-border)",
  borderRadius: "var(--bk-radius-sm)",
  padding: "4px 0",
  minWidth: 160,
  boxShadow: "var(--bk-shadow-drag)",
};

const itemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  border: "none",
  background: "transparent",
  color: "var(--bk-ink)",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left" as const,
};

const dividerStyles: React.CSSProperties = {
  height: 1,
  background: "var(--bk-border, rgba(255, 255, 255, 0.08))",
  margin: "4px 0",
};

const tooltipStyles: React.CSSProperties = {
  position: "fixed",
  zIndex: 10001,
  padding: "6px 10px",
  borderRadius: "var(--bk-radius-sm)",
  color: "var(--bk-accent-on)",
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: "nowrap" as const,
  pointerEvents: "none" as const,
  boxShadow: "var(--bk-shadow-drag)",
};
