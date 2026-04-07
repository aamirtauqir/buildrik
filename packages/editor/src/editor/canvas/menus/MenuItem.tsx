/**
 * Menu Item Component
 * Individual menu item with keyboard hint support
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CANVAS_COLORS } from "../shared";
import type { ContextAction } from "./contextMenuRegistry";
import { MenuIcon } from "./MenuIcon";

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
    <button
      onClick={onClick}
      disabled={!enabled && !hasSubmenu}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        width: "100%",
        padding: "8px 10px",
        background: (isHovered || isHighlighted) && enabled ? CANVAS_COLORS.bgHover : "transparent",
        border: "none",
        color: enabled ? CANVAS_COLORS.textPrimary : CANVAS_COLORS.textMuted,
        fontSize: 13,
        cursor: enabled ? "pointer" : "not-allowed",
        borderRadius: 6,
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
    </button>
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
        fontFamily: "system-ui, -apple-system, sans-serif",
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
