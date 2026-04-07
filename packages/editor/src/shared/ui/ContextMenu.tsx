/**
 * Aquibra Context Menu Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface ContextMenuItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
  children?: ContextMenuItem[];
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, x, y, onClose }) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const adjustedPosition = React.useMemo(() => {
    const menuWidth = 200;
    const menuHeight = items.length * 36;

    return {
      x: x + menuWidth > window.innerWidth ? x - menuWidth : x,
      y: y + menuHeight > window.innerHeight ? y - menuHeight : y,
    };
  }, [x, y, items.length]);

  return (
    <div
      ref={menuRef}
      className="aqb-context-menu"
      data-aqb-context-menu="true"
      style={{
        position: "fixed",
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        background: "var(--aqb-bg-panel)",
        borderRadius: 8,
        boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        border: "1px solid var(--aqb-border)",
        minWidth: 180,
        padding: "4px 0",
        zIndex: 2000,
        animation: "aqb-menu-in 0.15s ease",
      }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={index}
              style={{
                height: 1,
                background: "var(--aqb-border)",
                margin: "4px 0",
              }}
            />
          );
        }

        return (
          <button
            key={item.id}
            data-action={item.id}
            onClick={() => {
              if (!item.disabled) {
                item.onClick?.();
                onClose();
              }
            }}
            disabled={item.disabled}
            style={{
              width: "100%",
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "transparent",
              border: "none",
              color: item.danger ? "var(--aqb-error)" : "var(--aqb-text-primary)",
              cursor: item.disabled ? "not-allowed" : "pointer",
              fontSize: 13,
              textAlign: "left",
              opacity: item.disabled ? 0.5 : 1,
              transition: "background 0.1s ease",
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.background = "var(--aqb-bg-panel-secondary)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ width: 16, display: "flex", justifyContent: "center" }}>
              {item.icon}
            </span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.shortcut && (
              <span style={{ color: "var(--aqb-text-muted)", fontSize: 12 }}>{item.shortcut}</span>
            )}
            {item.children && <span>▶</span>}
          </button>
        );
      })}
    </div>
  );
};

// Hook for context menu
export function useContextMenu() {
  const [menu, setMenu] = React.useState<{
    items: ContextMenuItem[];
    x: number;
    y: number;
  } | null>(null);

  const show = React.useCallback((items: ContextMenuItem[], x: number, y: number) => {
    setMenu({ items, x, y });
  }, []);

  const hide = React.useCallback(() => {
    setMenu(null);
  }, []);

  const ContextMenuComponent = menu ? (
    <ContextMenu items={menu.items} x={menu.x} y={menu.y} onClose={hide} />
  ) : null;

  return { show, hide, ContextMenu: ContextMenuComponent };
}

export default ContextMenu;
