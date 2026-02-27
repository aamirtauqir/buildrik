/**
 * Submenu Panel Component
 * Displays nested submenu items with hover support
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CANVAS_COLORS, PANEL_STYLE, Z_INDEX } from "../shared";
import type { ContextAction, ActionContext } from "./contextMenuRegistry";
import { MenuItem } from "./MenuItem";

const MENU_WIDTH = 200;

interface SubmenuProps {
  actions: ContextAction[];
  context: ActionContext;
  x: number;
  y: number;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const Submenu: React.FC<SubmenuProps> = ({
  actions,
  context,
  x,
  y,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <div
      style={{
        ...PANEL_STYLE,
        position: "fixed",
        top: y,
        left: x,
        padding: 6,
        zIndex: Z_INDEX.contextMenu + 1,
        minWidth: MENU_WIDTH,
        color: CANVAS_COLORS.textPrimary,
      }}
      role="menu"
      aria-label="Submenu"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {actions.map((action) => {
        const enabled = action.isEnabled ? action.isEnabled(context) : true;
        return (
          <MenuItem
            key={action.id}
            action={action}
            enabled={enabled}
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

export default Submenu;
