/**
 * Quick Actions Toolbar Component
 * Floating toolbar below selected element with common actions
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { Z_INDEX } from "../../../shared/constants/canvas";
import { useToast } from "../../../shared/ui/Toast";
import { canvasTokens } from "../../../styles/tokens";
import { getElementNameFromType } from "../utils/elementInfo";
import { BlockPickerModal } from "./BlockPickerModal";

// Extract token values for cleaner usage
const { colors, shadows } = canvasTokens;

export interface QuickActionsToolbarProps {
  composer: Composer;
  elementId: string;
  canvasRef: React.RefObject<HTMLDivElement>;
  onOpenAddMenu?: () => void;
}

interface ToolbarPosition {
  left: number;
  top: number;
  width: number;
}

interface AddMenuOption {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

export const QuickActionsToolbar: React.FC<QuickActionsToolbarProps> = ({
  composer,
  elementId,
  canvasRef,
}) => {
  const [position, setPosition] = React.useState<ToolbarPosition | null>(null);
  const [showAddMenu, setShowAddMenu] = React.useState(false);
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [insertionPosition, setInsertionPosition] = React.useState<
    "child" | "before" | "after" | null
  >(null);
  const addMenuRef = React.useRef<HTMLDivElement>(null);
  const moreMenuRef = React.useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Track element position
  React.useEffect(() => {
    if (!canvasRef.current) return;

    const updatePosition = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const el = canvas.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement;
      if (!el) return;

      const canvasRect = canvas.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft || 0;
      const scrollTop = canvas.scrollTop || 0;

      setPosition({
        left: elRect.left - canvasRect.left + scrollLeft,
        top: elRect.top - canvasRect.top + scrollTop + elRect.height,
        width: elRect.width,
      });
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    const el = canvasRef.current.querySelector(`[data-aqb-id="${elementId}"]`);
    if (el) observer.observe(el);

    window.addEventListener("scroll", updatePosition, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updatePosition, {
        capture: true,
      } as EventListenerOptions);
    };
  }, [elementId, canvasRef]);

  // Close menus on click outside
  React.useEffect(() => {
    if (!showAddMenu && !showMoreMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (showAddMenu && addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
      if (showMoreMenu && moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddMenu, showMoreMenu]);

  if (!position) return null;

  // Get element info for context-aware actions
  const element = composer.elements.getElement(elementId);
  const canHaveChildren = element?.getType?.() !== "image" && element?.getType?.() !== "video";
  const parent = element?.getParent();

  // Add menu options
  const addOptions: AddMenuOption[] = [];

  if (canHaveChildren) {
    addOptions.push({
      label: "Add Child",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      ),
      action: () => {
        setInsertionPosition("child");
        setPickerOpen(true);
        setShowAddMenu(false);
      },
    });
  }

  if (parent) {
    addOptions.push({
      label: "Add Before",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 19V5M5 12l7-7" />
        </svg>
      ),
      action: () => {
        setInsertionPosition("before");
        setPickerOpen(true);
        setShowAddMenu(false);
      },
    });

    addOptions.push({
      label: "Add After",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7 7" />
        </svg>
      ),
      action: () => {
        setInsertionPosition("after");
        setPickerOpen(true);
        setShowAddMenu(false);
      },
    });
  }

  addOptions.push({
    label: "Wrap with Container",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </svg>
    ),
    action: () => {
      // Use element's wrap method
      element?.wrap?.("container");
      setShowAddMenu(false);
    },
  });

  // Helper for delete toast
  const showDeleteToast = (action: "deleted" | "cut") => {
    const elType = element?.getType?.() || "element";
    const elName = getElementNameFromType(elType);
    const childCount = element?.getChildren?.()?.length || 0;

    const actionText = action === "cut" ? "cut" : "deleted";
    const message =
      childCount > 0
        ? `${elName} (${childCount} ${childCount === 1 ? "child" : "children"}) ${actionText}`
        : `${elName} ${actionText}`;

    addToast({
      message,
      variant: "info",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => composer.history.undo(),
      },
    });
  };

  // Action handlers
  const handleCut = () => {
    // Copy to clipboard and delete
    if (element) {
      composer.clipboard = element.toJSON?.() || null;
      composer.beginTransaction("cut-element");
      composer.elements.removeElement(elementId);
      composer.endTransaction();
      showDeleteToast("cut");
    }
  };

  const handleDuplicate = () => {
    composer.elements.duplicateElement?.(elementId);
  };

  const handleDelete = () => {
    composer.beginTransaction("delete-element");
    composer.elements.removeElement(elementId);
    composer.endTransaction();
    showDeleteToast("deleted");
  };

  const handleCopy = () => {
    if (element) {
      composer.clipboard = element.toJSON?.() || null;
    }
    setShowMoreMenu(false);
  };

  const handleMoveUp = () => {
    composer.commands.run("bring-forward");
    setShowMoreMenu(false);
  };

  const handleMoveDown = () => {
    composer.commands.run("send-backward");
    setShowMoreMenu(false);
  };

  const handleSelectParent = () => {
    const parentEl = element?.getParent();
    if (parentEl) {
      composer.selection.select(parentEl);
    }
    setShowMoreMenu(false);
  };

  // More menu options
  const moreOptions: AddMenuOption[] = [
    {
      label: "Copy",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      ),
      action: handleCopy,
    },
    {
      label: "Move Up",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      ),
      action: handleMoveUp,
    },
    {
      label: "Move Down",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      ),
      action: handleMoveDown,
    },
  ];

  if (parent) {
    moreOptions.push({
      label: "Select Parent",
      icon: (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      ),
      action: handleSelectParent,
    });
  }

  // Position toolbar centered below element
  const toolbarLeft = Math.max(8, position.left + position.width / 2);
  const toolbarTop = position.top + 8;

  return (
    <div
      className="aqb-quick-actions"
      style={{
        position: "absolute",
        left: toolbarLeft,
        top: toolbarTop,
        transform: "translateX(-50%)",
        zIndex: Z_INDEX.floatingToolbar,
        pointerEvents: "auto",
      }}
    >
      {/* Main toolbar */}
      <div style={toolbarStyles}>
        {/* Add button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={{
              ...actionBtnStyles,
              background: showAddMenu ? colors.action.addBgActive : colors.action.addBg,
              color: colors.action.add,
            }}
            title="Add element"
            aria-label="Add element"
            aria-expanded={showAddMenu}
            aria-haspopup="menu"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>

          {/* Add menu dropdown */}
          {showAddMenu && (
            <div
              ref={addMenuRef}
              style={addMenuStyles}
              role="menu"
              aria-label="Add element options"
            >
              {addOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={option.action}
                  style={addMenuItemStyles}
                  role="menuitem"
                  aria-label={option.label}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={dividerStyles} />

        {/* Cut */}
        <button
          onClick={handleCut}
          style={actionBtnStyles}
          title="Cut (Cmd+X)"
          aria-label="Cut element (Cmd+X)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        </button>

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          style={actionBtnStyles}
          title="Duplicate (Cmd+D)"
          aria-label="Duplicate element (Cmd+D)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        <div style={dividerStyles} />

        {/* Delete */}
        <button
          onClick={handleDelete}
          style={{
            ...actionBtnStyles,
            color: colors.action.delete,
          }}
          title="Delete (Del)"
          aria-label="Delete element (Del)"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>

        <div style={dividerStyles} />

        {/* More button */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            style={{
              ...actionBtnStyles,
              background: showMoreMenu ? "rgba(205, 214, 244, 0.2)" : "transparent",
            }}
            title="More options"
            aria-label="More options"
            aria-expanded={showMoreMenu}
            aria-haspopup="menu"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>

          {/* More menu dropdown */}
          {showMoreMenu && (
            <div
              ref={moreMenuRef}
              style={moreMenuStyles}
              role="menu"
              aria-label="More element options"
            >
              {moreOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={option.action}
                  style={addMenuItemStyles}
                  role="menuitem"
                  aria-label={option.label}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Block Picker Modal */}
      {pickerOpen && insertionPosition && (
        <BlockPickerModal
          composer={composer}
          isOpen={pickerOpen}
          onClose={() => {
            setPickerOpen(false);
            setInsertionPosition(null);
          }}
          insertionContext={{
            targetElementId: elementId,
            position: insertionPosition,
          }}
        />
      )}
    </div>
  );
};

// Styles - using design tokens from canvasTokens
const toolbarStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: "4px 6px",
  background: colors.surface.background,
  borderRadius: 8,
  boxShadow: shadows.lg,
};

const actionBtnStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  background: "transparent",
  border: "none",
  borderRadius: 4,
  color: colors.text.primary,
  cursor: "pointer",
  transition: "background 0.15s, color 0.15s",
};

const dividerStyles: React.CSSProperties = {
  width: 1,
  height: 20,
  background: colors.border.subtle,
  margin: "0 2px",
};

const addMenuStyles: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  marginTop: 4,
  background: colors.surface.background,
  borderRadius: 8,
  boxShadow: shadows.xl,
  overflow: "hidden",
  minWidth: 160,
  zIndex: 10,
};

const addMenuItemStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "10px 14px",
  background: "transparent",
  border: "none",
  color: colors.text.primary,
  fontSize: 12,
  textAlign: "left",
  cursor: "pointer",
  transition: "background 0.15s",
};

const moreMenuStyles: React.CSSProperties = {
  position: "absolute",
  top: "100%",
  right: 0,
  marginTop: 4,
  background: colors.surface.background,
  borderRadius: 8,
  boxShadow: shadows.xl,
  overflow: "hidden",
  minWidth: 160,
  zIndex: 10,
};

export default QuickActionsToolbar;
