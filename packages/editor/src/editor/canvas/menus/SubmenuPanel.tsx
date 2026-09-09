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
        /* Vertical only — 1176:4867 / 1176:4902 give the surface `py-[6px]` and
           put the 12px inset on the ROWS, so a highlight runs the full 200.
           `padding: 6` inset the rows twice and left a white gutter each side
           of every hover. */
        padding: "6px 0",
        /* 8, not PANEL_STYLE's 10 (1176:4867 / 4902). Overridden here rather
           than in PANEL_STYLE, which twenty-six other canvas surfaces read.
           Through the token, not the literal: both files are on the
           green-panel allowlist, where a raw radius is a hard zero. */
        borderRadius: "var(--bk-radius-lg)",
        zIndex: Z_INDEX.contextMenu + 1,
        minWidth: MENU_WIDTH,
        color: CANVAS_COLORS.textPrimary,
      }}
      role="menu"
      data-testid="canvas-ctx-submenu"
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
