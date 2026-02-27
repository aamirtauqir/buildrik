/**
 * Floating Helper Component
 * Context-aware help panel showing available actions and shortcuts
 *
 * Location: Bottom-right corner of canvas
 * Shows: Available actions + keyboard shortcuts for current selection
 *
 * @module components/Canvas/controls/FloatingHelper
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CANVAS_COLORS, SIZES, Z_INDEX } from "../shared";

// =============================================================================
// TYPES
// =============================================================================

export interface HelperAction {
  /** Action identifier */
  id: string;
  /** Display label */
  label: string;
  /** Keyboard shortcut (e.g., "Cmd+C") */
  shortcut?: string;
  /** Icon (emoji or character) */
  icon?: string;
  /** Action handler */
  onClick?: () => void;
  /** Whether action is disabled */
  disabled?: boolean;
}

export interface FloatingHelperProps {
  /** Current selection context for context-aware actions */
  selectionContext?: "none" | "single" | "multiple" | "text";
  /** Custom actions to display */
  actions?: HelperAction[];
  /** Whether helper is initially expanded */
  defaultExpanded?: boolean;
  /** Callback when action is triggered */
  onActionClick?: (actionId: string) => void;
  /** Optional CSS class */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Default actions shown based on context */
const DEFAULT_ACTIONS: Record<string, HelperAction[]> = {
  none: [
    { id: "select-all", label: "Select All", shortcut: "Cmd+A", icon: "☐" },
    { id: "undo", label: "Undo", shortcut: "Cmd+Z", icon: "↩" },
    { id: "redo", label: "Redo", shortcut: "Cmd+Shift+Z", icon: "↪" },
    { id: "inspector", label: "Toggle Inspector", shortcut: "I", icon: "👁" },
  ],
  single: [
    { id: "delete", label: "Delete", shortcut: "Del", icon: "🗑" },
    { id: "duplicate", label: "Duplicate", shortcut: "Cmd+D", icon: "⧉" },
    { id: "copy", label: "Copy", shortcut: "Cmd+C", icon: "📋" },
    { id: "cut", label: "Cut", shortcut: "Cmd+X", icon: "✂" },
    { id: "move-up", label: "Move Up", shortcut: "↑", icon: "▲" },
    { id: "move-down", label: "Move Down", shortcut: "↓", icon: "▼" },
    { id: "nest-out", label: "Un-nest", shortcut: "←", icon: "◀" },
    { id: "nest-in", label: "Nest Into", shortcut: "→", icon: "▶" },
  ],
  multiple: [
    { id: "group", label: "Group", shortcut: "Cmd+G", icon: "⬚" },
    { id: "align-left", label: "Align Left", shortcut: "Cmd+Shift+L", icon: "⬅" },
    { id: "align-center", label: "Align Center", shortcut: "Cmd+Shift+C", icon: "⬌" },
    { id: "delete", label: "Delete All", shortcut: "Del", icon: "🗑" },
    { id: "duplicate", label: "Duplicate All", shortcut: "Cmd+D", icon: "⧉" },
  ],
  text: [
    { id: "edit", label: "Edit Text", shortcut: "Enter", icon: "✏" },
    { id: "bold", label: "Bold", shortcut: "Cmd+B", icon: "B" },
    { id: "italic", label: "Italic", shortcut: "Cmd+I", icon: "I" },
    { id: "link", label: "Add Link", shortcut: "Cmd+K", icon: "🔗" },
  ],
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Floating helper button with expandable action panel
 * Shows context-aware actions and keyboard shortcuts
 */
export const FloatingHelper: React.FC<FloatingHelperProps> = ({
  selectionContext = "none",
  actions,
  defaultExpanded = false,
  onActionClick,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Get actions for current context
  const contextActions = React.useMemo(() => {
    if (actions && actions.length > 0) {
      return actions;
    }
    return DEFAULT_ACTIONS[selectionContext] || DEFAULT_ACTIONS.none;
  }, [actions, selectionContext]);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
      // '?' key opens helper
      if (e.key === "?" && !isExpanded) {
        e.preventDefault();
        setIsExpanded(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  const handleActionClick = (action: HelperAction) => {
    if (action.disabled) return;
    action.onClick?.();
    onActionClick?.(action.id);
    setIsExpanded(false);
  };

  return (
    <div
      ref={panelRef}
      className={`aqb-floating-helper ${className || ""}`}
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        zIndex: Z_INDEX.floatingPanel,
      }}
    >
      {/* Expanded Panel */}
      {isExpanded && (
        <div
          style={{
            position: "absolute",
            bottom: 44,
            right: 0,
            minWidth: 220,
            background: CANVAS_COLORS.bgPanel,
            border: `1px solid ${CANVAS_COLORS.border}`,
            borderRadius: SIZES.borderRadius.lg,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            overflow: "hidden",
            animation: "aqb-slide-up 0.15s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: `${SIZES.padding.sm}px ${SIZES.padding.md}px`,
              borderBottom: `1px solid ${CANVAS_COLORS.border}`,
              fontSize: 11,
              fontWeight: 600,
              color: CANVAS_COLORS.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {selectionContext === "none" && "Canvas Actions"}
            {selectionContext === "single" && "Element Actions"}
            {selectionContext === "multiple" && "Multi-Select Actions"}
            {selectionContext === "text" && "Text Actions"}
          </div>

          {/* Actions List */}
          <div style={{ padding: SIZES.padding.xs }}>
            {contextActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: `${SIZES.padding.sm}px ${SIZES.padding.md}px`,
                  background: "transparent",
                  border: "none",
                  borderRadius: SIZES.borderRadius.sm,
                  color: action.disabled ? CANVAS_COLORS.textMuted : CANVAS_COLORS.textPrimary,
                  fontSize: 12,
                  cursor: action.disabled ? "not-allowed" : "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!action.disabled) {
                    e.currentTarget.style.background = CANVAS_COLORS.bgHover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {action.icon && <span style={{ fontSize: 14 }}>{action.icon}</span>}
                  {action.label}
                </span>
                {action.shortcut && (
                  <span
                    style={{
                      fontSize: 10,
                      color: CANVAS_COLORS.textMuted,
                      background: "rgba(255,255,255,0.06)",
                      padding: "2px 6px",
                      borderRadius: 3,
                      fontFamily: "monospace",
                    }}
                  >
                    {action.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        title="Help & Shortcuts (Press ?)"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: isExpanded ? CANVAS_COLORS.primary : CANVAS_COLORS.bgPanel,
          border: `1px solid ${isExpanded ? CANVAS_COLORS.primary : CANVAS_COLORS.border}`,
          color: isExpanded ? "#fff" : CANVAS_COLORS.textPrimary,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          transition: "all 0.15s ease",
        }}
      >
        ?
      </button>
    </div>
  );
};

export default FloatingHelper;
