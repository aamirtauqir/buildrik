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
  onActivate: () => void;
  onDeactivate: () => void;
  onClose: () => void;
}

export const SubmenuItem: React.FC<SubmenuItemProps> = ({
  action,
  context,
  isActive,
  isFocused = false,
  onActivate,
  onDeactivate,
  onClose,
}) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const [submenuPosition, setSubmenuPosition] = React.useState({ x: 0, y: 0 });
  const activateTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    // Clear any pending activation
    if (activateTimeoutRef.current) {
      clearTimeout(activateTimeoutRef.current);
    }
    // Short delay for activation - matches deactivation timeout (150ms) to prevent jitter
    activateTimeoutRef.current = setTimeout(() => {
      if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Determine if submenu should appear on left or right
        const rightSpace = viewportWidth - rect.right;
        const shouldShowLeft = rightSpace < MENU_WIDTH + 20;

        // Estimate submenu height and check bottom space
        const estimatedSubmenuHeight = 300;
        const bottomSpace = viewportHeight - rect.top;
        const shouldShowAbove = bottomSpace < estimatedSubmenuHeight;

        setSubmenuPosition({
          x: shouldShowLeft ? rect.left - MENU_WIDTH - SUBMENU_OFFSET : rect.right + SUBMENU_OFFSET,
          y: shouldShowAbove ? Math.max(8, rect.bottom - estimatedSubmenuHeight) : rect.top - 6, // Align with padding
        });
        onActivate();
      }
    }, 150);
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
        onClick={() => {}} // Submenus open on hover
      />

      {/* Submenu portal */}
      {isActive && hasVisibleSubmenu && action.submenu && (
        <Submenu
          actions={action.submenu}
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
