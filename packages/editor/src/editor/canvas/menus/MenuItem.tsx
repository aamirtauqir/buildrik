/**
 * Menu Item Component
 * Individual menu item with keyboard hint support
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CANVAS_COLORS } from "../shared";
import type { ContextAction } from "./contextMenuRegistry";
import { MenuIcon } from "./MenuIcon";
import { Button } from "@/editor/chrome-ui";

interface MenuItemProps {
  action: ContextAction;
  enabled: boolean;
  hasSubmenu?: boolean;
  isHighlighted?: boolean;
  onClick: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  action,
  enabled,
  hasSubmenu = false,
  isHighlighted = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Button
      /* The menu points `aria-activedescendant` at the focused action's id, so
         the id has to exist on the item — it did not, and axe read the
         reference as invalid (critical): the menu announced a focused item
         that, to an AT, was not there. */
      id={action.id}
      data-testid={`canvas-ctx-item-${action.id}`}
      onClick={onClick}
      disabled={!enabled && !hasSubmenu}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        width: "100%",
        /* 6/12 and 11px in `--color/ink-soft` — 1176:4868 / 4869 and their
           twenty siblings on board 1176:4866. It shipped `8px 10px` at 13px in
           full ink, which made every row of a twelve-row menu four pixels
           taller and a size louder than the board draws it. */
        padding: "6px 12px",
        /* `--color/bg-selected` (1176:4872), not the accent at 15% alpha. The
           two are close and not the same, and the board names a token. */
        background: (isHovered || isHighlighted) && enabled ? "var(--bk-accent-tint)" : "transparent",
        border: "none",
        color: enabled ? CANVAS_COLORS.textSecondary : CANVAS_COLORS.textMuted,
        fontSize: 11,
        cursor: enabled ? "pointer" : "not-allowed",
        /* 0: the board's rows are full-bleed 200-wide highlights inside a menu
           whose own padding is vertical only, so a rounded row inside a
           square-edged surface has nothing to round against. */
        borderRadius: 0,
        textAlign: "left",
        transition: "background 0.12s ease",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="menuitem"
      aria-haspopup={hasSubmenu ? "menu" : undefined}
      aria-expanded={hasSubmenu ? isHighlighted : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <MenuIcon name={action.icon} />
        <span>{action.label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Keyboard shortcut */}
        {action.shortcut && <KeyboardHint shortcut={action.shortcut} />}

        {/* Submenu arrow */}
        {hasSubmenu && (
          <span
            style={{
              color: CANVAS_COLORS.textMuted,
              fontSize: 12,
              marginLeft: 4,
            }}
          >
            {">"}
          </span>
        )}
      </div>
    </Button>
  );
};

// Keyboard shortcut hint
interface KeyboardHintProps {
  shortcut: string;
}

const KeyboardHint: React.FC<KeyboardHintProps> = ({ shortcut }) => {
  // Convert shortcut text to display format
  const displayShortcut = shortcut
    .replace(/Cmd/g, isMac() ? "\u2318" : "Ctrl")
    .replace(/Alt/g, isMac() ? "\u2325" : "Alt")
    .replace(/Shift/g, isMac() ? "\u21E7" : "Shift")
    .replace(/Del/g, isMac() ? "\u232B" : "Del")
    .replace(/Up/g, "\u2191")
    .replace(/Down/g, "\u2193")
    .replace(/Left/g, "\u2190")
    .replace(/Right/g, "\u2192")
    .replace(/\+/g, "");

  return (
    <span
      style={{
        fontSize: 12,
        color: CANVAS_COLORS.textMuted,
        fontFamily: "var(--bk-font-ui)",
        letterSpacing: 0.5,
      }}
    >
      {displayShortcut}
    </span>
  );
};

// Utility to detect Mac
function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

export default MenuItem;
