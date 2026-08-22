/**
 * InspectorElementMenu — three-dot overflow menu for element actions.
 *
 * Groups Duplicate / Copy styles / Paste styles / Delete under a single
 * affordance in the inspector header. Replaces the old absolutely-positioned
 * delete button so the corner isn't competing with the binding popover for
 * Copy styles / Paste styles read and write `composer.styleClipboard`, the
 * same slot the canvas keyboard (⌘⌥C / ⌘⌥V) and the right-click menu use.
 * This menu kept its own module-level clipboard until 2026-08-22, which meant
 * two controls with the same name and icon shared nothing: copying here left
 * ⌘⌥V with nothing to paste, and a module-level `let` also outlived the
 * project, so a freshly opened site offered a paste from the previous one.
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
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { Button } from "@/editor/chrome-ui";
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
  root: {
    position: "relative" as const,
    display: "flex",
  },
  trigger: {
    width: 28,
    height: 28,
    padding: 0,
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 6,
    color: "var(--bk-ink-muted)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, color 0.15s, border-color 0.15s",
  },
  triggerHover: {
    background: "var(--bk-border)",
    color: "var(--bk-ink)",
    borderColor: "var(--bk-border)",
  },
  menu: {
    position: "absolute" as const,
    top: 32,
    right: 0,
    minWidth: 180,
    background: "var(--bk-bg-subtle)",
    border: "1px solid var(--bk-border)",
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
      ? "var(--bk-ink-muted)"
      : danger
        ? "var(--bk-error)"
        : "var(--bk-ink)",
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
    background: "var(--bk-border)",
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
  // excludeRefs memoized so the hook's effect doesn't re-attach each render.
  const closeMenu = React.useCallback(() => setIsOpen(false), []);
  const excludeTrigger = React.useMemo(() => [triggerRef], []);
  useClickOutside(menuRef, closeMenu, {
    enabled: isOpen,
    excludeRefs: excludeTrigger,
    closeOnEscape: true,
  });

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
    composer.styleClipboard = { ...snapshot };
    setIsOpen(false);
  };

  const handlePasteStyles = () => {
    if (!composer?.styleClipboard) return;
    const el = composer.elements.getElement(selectedElementId);
    if (!el) return;
    composer.beginTransaction?.("paste-styles");
    try {
      el.setStyles?.(composer.styleClipboard);
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
      disabled: !composer?.styleClipboard,
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
    <div style={styles.root}>
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
                        : "var(--bk-border)"
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
    </div>
  );
};

export default InspectorElementMenu;
