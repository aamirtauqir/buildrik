import { Button } from "@/shared/ui/Button";
/**
 * InspectorElementMenu — three-dot overflow menu for element actions.
 *
 * Groups Duplicate / Copy styles / Paste styles / Delete under a single
 * affordance in the inspector header. Replaces the old absolutely-positioned
 * delete button so the corner isn't competing with the binding popover for
 * attention. Uses a module-level style clipboard so "Copy styles" on one
 * element works when you later paste onto another selection — a single
 * in-memory clipboard is enough for the common case.
 *
 * The menu uses a simple click-outside handler rather than a full Popover
 * primitive to keep the dependency surface small and avoid coupling header
 * chrome to the popover infrastructure.
 *
 * @license BSD-3-Clause
 */

import { Copy, ClipboardPaste, CopyPlus, MoreHorizontal, Trash2 } from "lucide-react";
import * as React from "react";
import type { Composer } from "../../../engine";

// ============================================================================
// STYLE CLIPBOARD — module-level so it survives across element selections
// ============================================================================

let styleClipboard: Record<string, string> | null = null;

// ============================================================================
// TYPES
// ============================================================================

export interface InspectorElementMenuProps {
  composer: Composer | null | undefined;
  selectedElementId: string;
  /** Called after the user confirms delete (triggers existing delete flow). */
  onRequestDelete: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  trigger: {
    position: "absolute" as const,
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    padding: 0,
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 6,
    color: "var(--buildrick-text-tertiary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, color 0.15s, border-color 0.15s",
  },
  triggerHover: {
    background: "var(--bd-border)",
    color: "var(--buildrick-text-primary)",
    borderColor: "var(--buildrick-border)",
  },
  menu: {
    position: "absolute" as const,
    top: 40,
    right: 8,
    minWidth: 180,
    background: "var(--buildrick-surface-3)",
    border: "1px solid var(--buildrick-border)",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    padding: 4,
    zIndex: 100,
    display: "flex",
    flexDirection: "column" as const,
    gap: 1,
  },
  item: (danger: boolean, disabled: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    background: "transparent",
    border: "none",
    borderRadius: 4,
    color: disabled
      ? "var(--buildrick-text-muted)"
      : danger
        ? "var(--buildrick-error, #ef4444)"
        : "var(--buildrick-text-primary)",
    fontSize: 12,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: "left" as const,
    width: "100%",
    opacity: disabled ? 0.5 : 1,
    transition: "background 0.12s",
  }),
  divider: {
    height: 1,
    background: "var(--buildrick-border-subtle)",
    margin: "4px 0",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const InspectorElementMenu: React.FC<InspectorElementMenuProps> = ({
  composer,
  selectedElementId,
  onRequestDelete,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  // Close on outside click and on Escape — standard menu semantics.
  React.useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Reset clipboard feedback when the menu closes so the next open starts fresh.
  const handleDuplicate = () => {
    if (!composer) return;
    composer.beginTransaction?.("duplicate-element");
    try {
      const clone = composer.elements.duplicateElement?.(selectedElementId);
      if (clone) {
        composer.selection?.select?.(clone);
      }
    } finally {
      composer.endTransaction?.();
    }
    setIsOpen(false);
  };

  const handleCopyStyles = () => {
    if (!composer) return;
    const el = composer.elements.getElement(selectedElementId);
    if (!el) return;
    // Clone the styles object so subsequent edits to the source element
    // don't mutate the clipboard snapshot.
    const snapshot = el.getStyles?.() ?? {};
    styleClipboard = { ...snapshot };
    setIsOpen(false);
  };

  const handlePasteStyles = () => {
    if (!composer || !styleClipboard) return;
    const el = composer.elements.getElement(selectedElementId);
    if (!el) return;
    composer.beginTransaction?.("paste-styles");
    try {
      el.setStyles?.(styleClipboard);
    } finally {
      composer.endTransaction?.();
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    onRequestDelete();
    setIsOpen(false);
  };

  const items: MenuItem[] = [
    {
      id: "duplicate",
      label: "Duplicate",
      icon: <CopyPlus size={14} aria-hidden="true" />,
      onClick: handleDuplicate,
    },
    {
      id: "copy-styles",
      label: "Copy styles",
      icon: <Copy size={14} aria-hidden="true" />,
      onClick: handleCopyStyles,
    },
    {
      id: "paste-styles",
      label: "Paste styles",
      icon: <ClipboardPaste size={14} aria-hidden="true" />,
      onClick: handlePasteStyles,
      disabled: !styleClipboard,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 size={14} aria-hidden="true" />,
      onClick: handleDelete,
      danger: true,
    },
  ];

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
        aria-label="Element actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Element actions"
        style={{
          ...styles.trigger,
          ...(isTriggerHovered || isOpen ? styles.triggerHover : {}),
        }}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </Button>
      {isOpen && (
        <div ref={menuRef} role="menu" style={styles.menu}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {index === items.length - 1 && <div style={styles.divider} />}
              <Button
                type="button"
                role="menuitem"
                onClick={item.onClick}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                disabled={item.disabled}
                style={{
                  ...styles.item(!!item.danger, !!item.disabled),
                  background:
                    hoveredItem === item.id && !item.disabled
                      ? item.danger
                        ? "rgba(239,68,68,0.12)"
                        : "var(--bd-border)"
                      : "transparent",
                }}
              >
                {item.icon}
                {item.label}
              </Button>
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
};

export default InspectorElementMenu;
