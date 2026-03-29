/**
 * Element Context Menu
 * Right-click context menu with nested submenus and keyboard hints
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside, CANVAS_COLORS, PANEL_STYLE, Z_INDEX } from "../shared";
import type { ContextAction, ActionContext } from "./contextMenuRegistry";
import { MenuItem } from "./MenuItem";
import { SubmenuItem } from "./SubmenuItem";

interface ElementContextMenuProps {
  x: number;
  y: number;
  actions: ContextAction[];
  context: ActionContext;
  onClose: () => void;
}

const MENU_WIDTH = 200;

export const ElementContextMenu: React.FC<ElementContextMenuProps> = ({
  x,
  y,
  actions,
  context,
  onClose,
}) => {
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(0);
  const submenuTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  useClickOutside(menuRef, onClose);

  // Flatten actions into ordered list for keyboard navigation
  const mainItems = React.useMemo(() => actions.filter((a) => a.group === "main"), [actions]);
  const standaloneItems = React.useMemo(
    () => actions.filter((a) => a.group === "standalone"),
    [actions]
  );
  const allItems = React.useMemo(
    () => [...mainItems, ...standaloneItems],
    [mainItems, standaloneItems]
  );

  // Focus menu on mount for keyboard capture
  React.useEffect(() => {
    menuRef.current?.focus();
  }, []);

  // Centralized submenu activation - prevents race conditions
  const handleSubmenuActivate = React.useCallback((id: string) => {
    // Clear any pending deactivation
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    setActiveSubmenu(id);
  }, []);

  // Centralized submenu deactivation with delay
  const handleSubmenuDeactivate = React.useCallback(() => {
    // Clear any pending deactivation
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    // Delay deactivation to allow smooth transitions
    submenuTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 150);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
    };
  }, []);

  // Full keyboard navigation: Arrow keys, Enter, Escape
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems = allItems.length;
      if (totalItems === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % totalItems);
          setActiveSubmenu(null);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          setActiveSubmenu(null);
          break;
        case "ArrowRight": {
          e.preventDefault();
          const focusedAction = allItems[focusedIndex];
          if (focusedAction?.submenu?.length) {
            handleSubmenuActivate(focusedAction.id);
          }
          break;
        }
        case "ArrowLeft":
          e.preventDefault();
          setActiveSubmenu(null);
          break;
        case "Enter": {
          e.preventDefault();
          const focusedAction = allItems[focusedIndex];
          if (!focusedAction) return;
          // If has submenu, open it
          if (focusedAction.submenu?.length) {
            handleSubmenuActivate(focusedAction.id);
          } else {
            // Execute standalone action
            const enabled = focusedAction.isEnabled ? focusedAction.isEnabled(context) : true;
            if (enabled && focusedAction.handler) {
              focusedAction.handler(context);
              onClose();
            }
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          if (activeSubmenu) {
            setActiveSubmenu(null);
          } else {
            onClose();
          }
          break;
      }
    },
    [allItems, focusedIndex, activeSubmenu, context, onClose, handleSubmenuActivate]
  );

  if (!actions.length) return null;

  return (
    <div
      ref={menuRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        ...PANEL_STYLE,
        position: "fixed",
        top: y,
        left: x,
        padding: 6,
        zIndex: Z_INDEX.contextMenu,
        minWidth: MENU_WIDTH,
        color: CANVAS_COLORS.textPrimary,
        outline: "none", // Remove focus outline - we show focus via item highlight
      }}
      role="menu"
      aria-label="Element context menu"
      aria-activedescendant={allItems[focusedIndex]?.id}
    >
      {/* Main items with submenus */}
      {mainItems.map((action, index) => (
        <SubmenuItem
          key={action.id}
          action={action}
          context={context}
          isActive={activeSubmenu === action.id}
          isFocused={focusedIndex === index}
          onActivate={() => handleSubmenuActivate(action.id)}
          onDeactivate={handleSubmenuDeactivate}
          onClose={onClose}
        />
      ))}

      {/* Divider */}
      {mainItems.length > 0 && standaloneItems.length > 0 && (
        <div
          style={{
            height: 1,
            background: CANVAS_COLORS.borderLight,
            margin: "6px 0",
          }}
        />
      )}

      {/* Standalone items */}
      {standaloneItems.map((action, index) => {
        const enabled = action.isEnabled ? action.isEnabled(context) : true;
        const globalIndex = mainItems.length + index;
        return (
          <MenuItem
            key={action.id}
            action={action}
            enabled={enabled}
            isHighlighted={focusedIndex === globalIndex}
            onClick={() => {
              if (enabled && action.handler) {
                action.handler(context);
                onClose();
              }
            }}
          />
        );
      })}
    </div>
  );
};

export default ElementContextMenu;
