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
import { Z_INDEX } from "../shared";
import { Button, TextInput } from "@/editor/chrome-ui";
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

const STORAGE_KEY = "buildrick-recent-commands";
const MAX_RECENT = 5;

/*
  `useCommandPalette` lived here — open/close/toggle state plus its own ⌘⇧P and
  Escape listeners. Nothing imported it, not even the barrel: Canvas.tsx drives
  this palette through `useCanvasCommandPalette`, which registers the identical
  shortcut. Two listeners for one key, one of them unreachable. Its docstring
  also still claimed "Cmd+K is reserved for AI Copilot", which stopped being
  true when the shell palette took ⌘K. Deleted 2026-08-16 — the first thing the
  newly-wired dead-export gate surfaced that was pure duplication.
*/

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Board 1177:4804 fixes the group order: EDIT, VIEW, INSERT, TOOLS. Grouping
 * by first appearance instead let the recency sort reorder the headings —
 * running one Insert command moved the whole INSERT block to the top, so the
 * palette never looked the same twice.
 */
const CATEGORY_ORDER = ["Edit", "View", "Insert", "Tools"];

const orderedGroups = (grouped: Record<string, CommandAction[]>): [string, CommandAction[]][] =>
  Object.entries(grouped).sort(([a], [b]) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? CATEGORY_ORDER.length : ai) - (bi === -1 ? CATEGORY_ORDER.length : bi);
  });

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
        className="tw:flex tw:flex-col tw:gap-0"
        style={{
          position: "fixed",
          background: "var(--bk-bg-card)",
          border: "1px solid var(--bk-border)",
          borderRadius: 12,
          boxShadow: "var(--bk-shadow-overlay)",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 520,
          maxWidth: "90vw",
          maxHeight: "60vh",
          zIndex: Z_INDEX.modal,
          overflow: "hidden",
        }}
        role="dialog"
        aria-label="Command Palette"
      >
        {/* Search Input */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--bk-border)" }}>
          <TextInput
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              padding: 0,
              background: "transparent",
              border: "none",
              color: "var(--bk-ink)",
              fontSize: 12,
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
                color: "var(--bk-ink-muted)",
                fontSize: 12,
              }}
            >
              No commands found
            </div>
          ) : (
            orderedGroups(groupedCommands).map(([category, cmds]) => (
              <div key={category} style={{ marginBottom: 12 }}>
                {/* Category Header */}
                <div
                  style={{
                    padding: "8px 2px 3px",
                    fontSize: 9,
                    fontWeight: 600,
                    color: "var(--bk-ink-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.54px",
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
                    <Button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      disabled={isDisabled}
                      aria-disabled={isDisabled}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "7px 2px",
                        background:
                          isSelected && !isDisabled ? "var(--bk-accent-tint)" : "transparent",
                        border: "none",
                        borderRadius: 4,
                        color:
                          isSelected && !isDisabled
                            ? "var(--bk-accent-text)"
                            : "var(--bk-ink-soft)",
                        fontSize: 11,
                        cursor: isDisabled ? "default" : "pointer",
                        textAlign: "left",
                        transition: "background 0.1s",
                        opacity: isDisabled ? 0.45 : 1,
                      }}
                      onMouseEnter={() => !isDisabled && setSelectedIndex(globalIndex)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Board 1177:4804 draws rows as plain text — no icon
                            column. Live check showed ours carrying emoji
                            glyphs the board does not have. */}
                        <span>{cmd.label}</span>
                        {isRecent && !isDisabled && (
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 500,
                              color: "var(--bk-ink-muted)",
                              background: "var(--bk-bg-subtle)",
                              padding: "1px 5px",
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
                              fontSize: 9,
                              color: "var(--bk-gray-400)",
                            }}
                          >
                            (Select an element first)
                          </span>
                        )}
                      </div>
                      {cmd.shortcut && !isDisabled && <ShortcutBadge shortcut={cmd.shortcut} />}
                    </Button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div
          style={{
            padding: "8px 14px",
            borderTop: "1px solid var(--bk-border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 9,
            color: "var(--bk-ink-muted)",
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
          {/* Board 1177:4853 carries the count and the disambiguation from the
              shell's own ⌘K palette — two palettes, two key chords. */}
          <span style={{ marginLeft: "auto", color: "var(--bk-gray-400)" }}>
            {commands.length} commands · distinct from shell ⌘K
          </span>
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

  /* "+" is both the separator and a key. Replacing every one of them with a
     space turned "Cmd++" (zoom in) into a lone "⌘" — the palette printed a
     modifier with no key for it. Pull the trailing key out first. */
  const literalKey = /\+\+$/.test(shortcut) ? "+" : /\+-$/.test(shortcut) ? "−" : null;
  const body = literalKey ? shortcut.slice(0, -1) : shortcut;

  const display =
    body
      .replace(/Cmd/g, isMac ? "⌘" : "Ctrl")
      .replace(/Alt/g, isMac ? "⌥" : "Alt")
      .replace(/Shift/g, isMac ? "⇧" : "Shift")
      .replace(/Del/g, isMac ? "⌫" : "Del")
      .replace(/\+/g, " ") + (literalKey ?? "");

  return (
    <span
      style={{
        fontSize: 9,
        color: "var(--bk-gray-400)",
        fontFamily: "var(--bk-font-ui)",
      }}
    >
      {display}
    </span>
  );
};

export default CommandPalette;
