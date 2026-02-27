/**
 * Keyboard Shortcuts Cheat Sheet
 * Floating overlay triggered by '?' key showing all available shortcuts
 *
 * Design: Figma-inspired modal with grouped shortcuts
 * Accessibility: Focus trap, Escape to close, screen reader support
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { tokens } from "../shared/tokens";

export interface KeyboardCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: {
    keys: string[];
    description: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Selection",
    shortcuts: [
      { keys: ["Click"], description: "Select element" },
      { keys: ["Double-click"], description: "Select child / deep select" },
      { keys: ["Triple-click"], description: "Select innermost element" },
      { keys: ["⌘", "Click"], description: "Cycle through overlapping" },
      { keys: ["⇧", "Click"], description: "Add to selection" },
      { keys: ["⌘", "A"], description: "Select all elements" },
      { keys: ["Escape"], description: "Clear selection" },
      { keys: ["Tab"], description: "Next element" },
      { keys: ["⇧", "Tab"], description: "Previous element" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["↑"], description: "Select previous sibling" },
      { keys: ["↓"], description: "Select next sibling" },
      { keys: ["←"], description: "Select parent" },
      { keys: ["→"], description: "Select first child" },
      { keys: ["Home"], description: "Select first sibling" },
      { keys: ["End"], description: "Select last sibling" },
    ],
  },
  {
    title: "Positioning",
    shortcuts: [
      { keys: ["⇧", "↑/↓/←/→"], description: "Move element 10px" },
      { keys: ["⌘", "↑/↓/←/→"], description: "Move element 1px" },
      { keys: ["⌥", "↑"], description: "Reorder up in DOM" },
      { keys: ["⌥", "↓"], description: "Reorder down in DOM" },
      { keys: ["⌥", "Home"], description: "Move to first position" },
      { keys: ["⌥", "End"], description: "Move to last position" },
    ],
  },
  {
    title: "Editing",
    shortcuts: [
      { keys: ["⌘", "C"], description: "Copy element" },
      { keys: ["⌘", "⌥", "C"], description: "Copy styles only" },
      { keys: ["⌘", "V"], description: "Paste element" },
      { keys: ["⌘", "⌥", "V"], description: "Paste styles" },
      { keys: ["⌘", "X"], description: "Cut element" },
      { keys: ["⌘", "D"], description: "Duplicate element" },
      { keys: ["Delete"], description: "Delete element" },
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { keys: ["⌘", "+"], description: "Zoom in" },
      { keys: ["⌘", "-"], description: "Zoom out" },
      { keys: ["⌘", "0"], description: "Zoom to fit" },
      { keys: ["⌘", "⇧", "P"], description: "Command palette" },
      { keys: ["?"], description: "Show this cheat sheet" },
    ],
  },
  {
    title: "Context Menu",
    shortcuts: [
      { keys: ["Right-click"], description: "Open context menu" },
      { keys: ["⇧", "F10"], description: "Open context menu (a11y)" },
    ],
  },
];

/**
 * Renders a single keyboard key badge
 */
const KeyBadge: React.FC<{ keyName: string }> = ({ keyName }) => (
  <kbd
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 24,
      height: 24,
      padding: "0 6px",
      background: tokens.colors.surface3,
      borderRadius: tokens.radius.sm,
      border: `1px solid ${tokens.colors.borderSubtle}`,
      fontSize: tokens.typography.fontXs,
      fontFamily: tokens.typography.fontFamily,
      fontWeight: 500,
      color: tokens.colors.textPrimary,
      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
    }}
  >
    {keyName}
  </kbd>
);

/**
 * Renders a shortcut row with keys and description
 */
const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({ keys, description }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 0",
      gap: 12,
    }}
  >
    <span
      style={{
        flex: 1,
        fontSize: tokens.typography.fontSm,
        color: tokens.colors.textSecondary,
      }}
    >
      {description}
    </span>
    <div style={{ display: "flex", gap: 4 }}>
      {keys.map((key, i) => (
        <KeyBadge key={i} keyName={key} />
      ))}
    </div>
  </div>
);

/**
 * Main Keyboard Cheat Sheet component
 */
export const KeyboardCheatSheet: React.FC<KeyboardCheatSheetProps> = ({ isOpen, onClose }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  React.useEffect(() => {
    if (isOpen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-cheatsheet-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: tokens.zIndex.modal,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        animation: "aqb-fade-in 0.15s ease",
      }}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(900px, 90vw)",
          maxHeight: "85vh",
          background: tokens.colors.surface1,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.colors.borderSubtle}`,
          boxShadow: tokens.shadows.lg,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "aqb-scale-in 0.2s ease",
          outline: "none",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: `1px solid ${tokens.colors.borderSubtle}`,
          }}
        >
          <h2
            id="keyboard-cheatsheet-title"
            style={{
              margin: 0,
              fontSize: tokens.typography.fontXl,
              fontWeight: 600,
              color: tokens.colors.textPrimary,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>⌨️</span>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              background: "transparent",
              border: "none",
              borderRadius: tokens.radius.sm,
              cursor: "pointer",
              color: tokens.colors.textSecondary,
              transition: tokens.transitions.fast,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = tokens.colors.surface3)}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: 18 }}>✕</span>
          </button>
        </div>

        {/* Content - Scrollable grid of shortcut groups */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: 20,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 24,
            }}
          >
            {SHORTCUT_GROUPS.map((group) => (
              <div
                key={group.title}
                style={{
                  background: tokens.colors.surface2,
                  borderRadius: tokens.radius.md,
                  padding: 16,
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: tokens.typography.fontMd,
                    fontWeight: 600,
                    color: tokens.colors.primary,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {group.title}
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {group.shortcuts.map((shortcut, i) => (
                    <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${tokens.colors.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: tokens.typography.fontSm,
            color: tokens.colors.textTertiary,
          }}
        >
          <span>
            Press <KeyBadge keyName="?" /> or <KeyBadge keyName="Esc" /> to close
          </span>
          <span>
            Pro tip: <KeyBadge keyName="⌘" /> <KeyBadge keyName="⇧" /> <KeyBadge keyName="P" />{" "}
            opens command palette
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to manage cheat sheet state and keyboard trigger
 */
export function useKeyboardCheatSheet(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input or editing
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      // '?' key opens cheat sheet (Shift+/)
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    open: React.useCallback(() => setIsOpen(true), []),
    close: React.useCallback(() => setIsOpen(false), []),
    toggle: React.useCallback(() => setIsOpen((prev) => !prev), []),
  };
}

export default KeyboardCheatSheet;
