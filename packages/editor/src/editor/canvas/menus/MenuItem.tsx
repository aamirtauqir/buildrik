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
        /* Board 4428:43928 (the v3 ⋯ More menu): 13px ink rows on a 30 pitch.
           The archived 1176:4866 drew 11px ink-soft. */
        padding: "0 12px",
        height: 30,
        minHeight: 30,
        /* `--color/bg-selected` (1176:4872), not the accent at 15% alpha. The
           two are close and not the same, and the board names a token. */
        background: (isHovered || isHighlighted) && enabled ? "var(--bk-accent-tint)" : "transparent",
        border: "none",
        color: enabled ? "var(--bk-ink)" : CANVAS_COLORS.textMuted,
        fontSize: 13,
        fontWeight: 400,
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
        {/* 4428:43928 draws text rows; only the AI row keeps its ✦ mark. */}
        {action.icon === "sparkles" ? <MenuIcon name={action.icon} /> : null}
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

/** "Cmd+Alt+C" → "⌘⌥C" on a Mac, "Ctrl+Alt+C" elsewhere. The "+" is dropped
 *  only on a Mac, where the glyphs separate themselves — Windows read
 *  "CtrlAltC" (G2-050). */
export function formatShortcutHint(shortcut: string, mac: boolean): string {
  const shown = shortcut
    .replace(/Cmd/g, mac ? "\u2318" : "Ctrl")
    .replace(/Alt/g, mac ? "\u2325" : "Alt")
    .replace(/Shift/g, mac ? "\u21E7" : "Shift")
    .replace(/Del/g, mac ? "\u232B" : "Del")
    .replace(/Up/g, "\u2191")
    .replace(/Down/g, "\u2193")
    .replace(/Left/g, "\u2190")
    .replace(/Right/g, "\u2192");
  return mac ? shown.replace(/\+/g, "") : shown;
}

const KeyboardHint: React.FC<KeyboardHintProps> = ({ shortcut }) => {
  const displayShortcut = formatShortcutHint(shortcut, isMac());

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
