/**
 * Submenu Item Component
 * Menu item with hover-triggered submenu
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ContextAction, ActionContext } from "./contextMenuRegistry";
import { MenuItem } from "./MenuItem";
import { Submenu } from "./SubmenuPanel";

const MENU_WIDTH = 200;
const SUBMENU_OFFSET = 4;

interface SubmenuItemProps {
  action: ContextAction;
  context: ActionContext;
  isActive: boolean;
  isFocused?: boolean; // Keyboard navigation focus state
  focusedChildIndex?: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onClose: () => void;
}

export const SubmenuItem: React.FC<SubmenuItemProps> = ({
  action,
  context,
  isActive,
  isFocused = false,
  focusedChildIndex = 0,
  onActivate,
  onDeactivate,
  onClose,
}) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const [submenuPosition, setSubmenuPosition] = React.useState({ x: 0, y: 0 });
  const activateTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure for every activation, including keyboard and click, before paint.
  React.useLayoutEffect(() => {
    if (!isActive || !itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const height = (action.submenu?.length ?? 0) * 30 + 12;
    setSubmenuPosition({
      x: Math.max(8, window.innerWidth - rect.right < MENU_WIDTH + 20
        ? rect.left - MENU_WIDTH - SUBMENU_OFFSET : rect.right + SUBMENU_OFFSET),
      y: Math.max(8, Math.min(rect.top - 6, window.innerHeight - height - 8)),
    });
  }, [isActive, action.submenu]);

  const handleMouseEnter = () => {
    if (activateTimeoutRef.current) clearTimeout(activateTimeoutRef.current);
    activateTimeoutRef.current = setTimeout(onActivate, 150);
  };

  const handleMouseLeave = () => {
    // Clear any pending activation
    if (activateTimeoutRef.current) {
      clearTimeout(activateTimeoutRef.current);
    }
    // Deactivation is handled by parent's centralized timeout
    onDeactivate();
  };

  React.useEffect(() => {
    return () => {
      if (activateTimeoutRef.current) {
        clearTimeout(activateTimeoutRef.current);
      }
    };
  }, []);

  const hasVisibleSubmenu = action.submenu && action.submenu.length > 0;
  // Check if action is enabled (for top-level items with submenus)
  const isActionEnabled = action.isEnabled ? action.isEnabled(context) : true;
  const enabled = Boolean(hasVisibleSubmenu) && isActionEnabled;

  return (
    <div
      ref={itemRef}
      onMouseEnter={enabled ? handleMouseEnter : undefined}
      onMouseLeave={enabled ? handleMouseLeave : undefined}
      style={{ position: "relative" }}
    >
      <MenuItem
        action={action}
        enabled={enabled}
        hasSubmenu={true}
        isHighlighted={(isActive || isFocused) && enabled}
        isExpanded={isActive}
        onClick={enabled ? onActivate : () => {}}
      />

      {/* Submenu portal */}
      {isActive && hasVisibleSubmenu && action.submenu && (
        <Submenu
          actions={action.submenu}
          focusedIndex={focusedChildIndex}
          context={context}
          x={submenuPosition.x}
          y={submenuPosition.y}
          onClose={onClose}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
};

export default SubmenuItem;
