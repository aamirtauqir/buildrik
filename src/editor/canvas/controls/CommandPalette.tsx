/**
 * Command Palette Component
 * Searchable action list triggered by Cmd+Shift+P (like VS Code)
 *
 * Features:
 * - Fuzzy search through all actions
 * - Recent commands shown first
 * - Keyboard navigation (arrows + enter)
 * - Shows shortcuts for each action
 *
 * Note: Cmd+K → AI Copilot, Cmd+P → browser print
 *
 * @module components/Canvas/controls/CommandPalette
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CANVAS_COLORS, PANEL_STYLE, Z_INDEX } from "../shared";

// =============================================================================
// TYPES
// =============================================================================

export interface CommandAction {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Category for grouping */
  category: string;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Icon (emoji or name) */
  icon?: string;
  /** Action handler */
  handler: () => void;
  /** Search keywords */
  keywords?: string[];
  /**
   * When true, this command requires a selected element to execute.
   * The palette renders it as visually disabled (with a hint) when
   * selectedId === null, but keeps it visible so users know it exists.
   */
  requiresSelection?: boolean;
}

export interface CommandPaletteProps {
  /** Whether palette is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Available commands */
  commands: CommandAction[];
  /**
   * The currently selected element ID.
   * Commands with requiresSelection=true are shown as disabled when this is null.
   */
  selectedId: string | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = "aqb-recent-commands";
const MAX_RECENT = 5;

// =============================================================================
// HOOK: useCommandPalette
// =============================================================================

export interface UseCommandPaletteResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Hook to manage command palette state with Cmd+Shift+P shortcut
 * (Cmd+K is reserved for AI Copilot, Cmd+P is browser print)
 */
export function useCommandPalette(): UseCommandPaletteResult {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Cmd+Shift+P or Ctrl+Shift+P opens palette (like VS Code)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      // Escape closes palette
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  selectedId,
}) => {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Load recent commands from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setRecentIds(JSON.parse(stored));
        } catch {
          setRecentIds([]);
        }
      }
    }
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter and sort commands
  const filteredCommands = React.useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();

    // Filter by query
    const filtered = lowerQuery
      ? commands.filter((cmd) => {
          const searchText = [cmd.label, cmd.category, ...(cmd.keywords || [])]
            .join(" ")
            .toLowerCase();
          return searchText.includes(lowerQuery);
        })
      : commands;

    // Sort: recent first, then alphabetically
    return filtered.sort((a, b) => {
      const aRecent = recentIds.indexOf(a.id);
      const bRecent = recentIds.indexOf(b.id);

      // Both recent: sort by recency
      if (aRecent !== -1 && bRecent !== -1) {
        return aRecent - bRecent;
      }
      // Only a is recent
      if (aRecent !== -1) return -1;
      // Only b is recent
      if (bRecent !== -1) return 1;
      // Neither recent: alphabetical
      return a.label.localeCompare(b.label);
    });
  }, [commands, query, recentIds]);

  // Reset selection when filtered list changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement;
    if (selected && typeof selected.scrollIntoView === "function") {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Execute command — no-op when the command requires selection and none is active
  const executeCommand = React.useCallback(
    (cmd: CommandAction) => {
      if (cmd.requiresSelection && selectedId === null) return;

      // Update recent commands
      const newRecent = [cmd.id, ...recentIds.filter((id) => id !== cmd.id)].slice(0, MAX_RECENT);
      setRecentIds(newRecent);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent));

      // Execute and close
      cmd.handler();
      onClose();
    },
    [recentIds, onClose, selectedId]
  );

  // Keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, executeCommand, onClose]
  );

  if (!isOpen) return null;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandAction[]>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: Z_INDEX.modal - 1,
        }}
        onClick={onClose}
      />

      {/* Palette */}
      <div
        style={{
          ...PANEL_STYLE,
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 520,
          maxWidth: "90vw",
          maxHeight: "60vh",
          zIndex: Z_INDEX.modal,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "aqb-slide-down 0.15s ease-out",
        }}
        role="dialog"
        aria-label="Command Palette"
      >
        {/* Search Input */}
        <div style={{ padding: 12, borderBottom: `1px solid ${CANVAS_COLORS.border}` }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: CANVAS_COLORS.bgInput,
              border: `1px solid ${CANVAS_COLORS.border}`,
              borderRadius: 8,
              color: CANVAS_COLORS.textPrimary,
              fontSize: 15,
              outline: "none",
            }}
          />
        </div>

        {/* Command List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 12px",
          }}
        >
          {filteredCommands.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                color: CANVAS_COLORS.textMuted,
                fontSize: 13,
              }}
            >
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} style={{ marginBottom: 12 }}>
                {/* Category Header */}
                <div
                  style={{
                    padding: "6px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: CANVAS_COLORS.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {category}
                </div>

                {/* Commands */}
                {cmds.map((cmd) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  const isSelected = globalIndex === selectedIndex;
                  const isRecent = recentIds.includes(cmd.id);
                  const isDisabled = Boolean(cmd.requiresSelection && selectedId === null);

                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "10px 12px",
                        background:
                          isSelected && !isDisabled ? CANVAS_COLORS.bgHover : "transparent",
                        border: "none",
                        borderRadius: 6,
                        color: CANVAS_COLORS.textPrimary,
                        fontSize: 13,
                        cursor: isDisabled ? "default" : "pointer",
                        textAlign: "left",
                        transition: "background 0.1s",
                        opacity: isDisabled ? 0.4 : 1,
                      }}
                      onMouseEnter={() => !isDisabled && setSelectedIndex(globalIndex)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {cmd.icon && <span style={{ fontSize: 16, opacity: 0.8 }}>{cmd.icon}</span>}
                        <span>{cmd.label}</span>
                        {isRecent && !isDisabled && (
                          <span
                            style={{
                              fontSize: 10,
                              color: CANVAS_COLORS.textMuted,
                              background: "rgba(255,255,255,0.06)",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            Recent
                          </span>
                        )}
                        {isDisabled && (
                          <span
                            data-testid="selection-hint"
                            style={{
                              fontSize: 11,
                              color: CANVAS_COLORS.textMuted,
                              fontStyle: "italic",
                            }}
                          >
                            (Select an element first)
                          </span>
                        )}
                      </div>

                      {cmd.shortcut && !isDisabled && <ShortcutBadge shortcut={cmd.shortcut} />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            padding: "8px 12px",
            borderTop: `1px solid ${CANVAS_COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: CANVAS_COLORS.textMuted,
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </>
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const ShortcutBadge: React.FC<{ shortcut: string }> = ({ shortcut }) => {
  const isMac = typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const display = shortcut
    .replace(/Cmd/g, isMac ? "⌘" : "Ctrl")
    .replace(/Alt/g, isMac ? "⌥" : "Alt")
    .replace(/Shift/g, isMac ? "⇧" : "Shift")
    .replace(/Del/g, isMac ? "⌫" : "Del")
    .replace(/\+/g, " ");

  return (
    <span
      style={{
        fontSize: 11,
        color: CANVAS_COLORS.textMuted,
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "rgba(255,255,255,0.06)",
        padding: "3px 8px",
        borderRadius: 4,
      }}
    >
      {display}
    </span>
  );
};

export default CommandPalette;
