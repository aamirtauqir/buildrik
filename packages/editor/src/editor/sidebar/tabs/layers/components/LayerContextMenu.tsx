/**
 * LayerContextMenu — Right-click context menu for layer tree rows
 * Per .pen Screen 11: Delete, Group, Rename, Lock/Unlock actions.
 * Positioned absolutely at click coordinates.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Trash2, Group, Edit3, Lock, Unlock } from "lucide-react";

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

  // Close on click outside
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

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
      <button style={itemStyles} role="menuitem" onClick={() => handleAction(onRename)}>
        <Edit3 size={14} />
        <span>Rename</span>
      </button>
      <button style={itemStyles} role="menuitem" onClick={() => handleAction(onGroup)}>
        <Group size={14} />
        <span>Group</span>
      </button>
      <button style={itemStyles} role="menuitem" onClick={() => handleAction(onToggleLock)}>
        {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
        <span>{isLocked ? "Unlock" : "Lock"}</span>
      </button>
      <div style={dividerStyles} />
      <button style={{ ...itemStyles, color: "var(--aqb-error, #ef4444)" }} role="menuitem" onClick={() => handleAction(onDelete)}>
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
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
      background: variant === "error" ? "var(--aqb-error, #ef4444)" : "var(--aqb-surface-4, #2e2e38)",
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
  background: "var(--aqb-surface-3, #1e1e2e)",
  border: "1px solid var(--aqb-border, rgba(255, 255, 255, 0.08))",
  borderRadius: 8,
  padding: "4px 0",
  minWidth: 160,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
};

const itemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  border: "none",
  background: "transparent",
  color: "var(--aqb-text-primary, #F5F5F0)",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit",
  textAlign: "left" as const,
};

const dividerStyles: React.CSSProperties = {
  height: 1,
  background: "var(--aqb-border, rgba(255, 255, 255, 0.08))",
  margin: "4px 0",
};

const tooltipStyles: React.CSSProperties = {
  position: "fixed",
  zIndex: 10001,
  padding: "6px 10px",
  borderRadius: 6,
  color: "#fff",
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: "nowrap" as const,
  pointerEvents: "none" as const,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
};
