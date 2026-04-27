import { TextInput } from "@/shared/ui/TextInput";
import { Button } from "@/shared/ui/Button";
/**
 * CommandPalette — Studio-level Command Palette
 * Triggered by Ctrl+K / ⌘+K
 * PRD §17.1
 *
 * @module editor/shell/modals/CommandPalette
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import { GROUPED_TABS_CONFIG } from "../../rail/tabsConfig";

// =============================================================================
// TYPES
// =============================================================================

interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  icon?: string;
  handler: () => void;
}

export interface CommandPaletteProps {
  onClose: () => void;
  composer: Composer | null;
}

// =============================================================================
// HELPERS
// =============================================================================

function buildCommands(composer: Composer | null, onClose: () => void): PaletteCommand[] {
  const commands: PaletteCommand[] = [];

  // 1. Navigation — from GROUPED_TABS_CONFIG
  for (const tab of GROUPED_TABS_CONFIG) {
    if (!tab.shortcut) continue;
    commands.push({
      id: `nav-${tab.id}`,
      label: `Open ${tab.label} panel`,
      group: "Navigation",
      shortcut: tab.shortcut,
      handler: () => {
        if (composer) {
          composer.emit(EVENTS.UI_PANEL_OPEN, { panel: tab.id });
        }
        onClose();
      },
    });
  }

  if (!composer) return commands;

  // 2. Edit
  commands.push(
    {
      id: "edit-undo",
      label: "Undo",
      group: "Edit",
      shortcut: "Ctrl+Z",
      handler: () => { composer.history.undo(); onClose(); },
    },
    {
      id: "edit-redo",
      label: "Redo",
      group: "Edit",
      shortcut: "Ctrl+Y",
      handler: () => { composer.history.redo(); onClose(); },
    },
    {
      id: "edit-copy",
      label: "Copy",
      group: "Edit",
      shortcut: "Ctrl+C",
      handler: () => { document.execCommand("copy"); onClose(); },
    },
    {
      id: "edit-paste",
      label: "Paste",
      group: "Edit",
      shortcut: "Ctrl+V",
      handler: () => { document.execCommand("paste"); onClose(); },
    },
    {
      id: "edit-delete",
      label: "Delete element",
      group: "Edit",
      shortcut: "Del",
      handler: () => {
        const ids = composer.selection?.getSelectedIds?.();
        if (ids && ids.length > 0) composer.elements.removeElement(ids[0]);
        onClose();
      },
    }
  );

  // 3. View
  commands.push(
    {
      id: "view-preview",
      label: "Preview",
      group: "View",
      shortcut: "Ctrl+P",
      handler: () => { composer.emit(EVENTS.UI_TOGGLE_PREVIEW, {}); onClose(); },
    },
    {
      id: "view-zoom-in",
      label: "Zoom In",
      group: "View",
      shortcut: "Ctrl++",
      handler: () => { composer.emit(EVENTS.ZOOM_IN, {}); onClose(); },
    },
    {
      id: "view-zoom-out",
      label: "Zoom Out",
      group: "View",
      shortcut: "Ctrl+-",
      handler: () => { composer.emit(EVENTS.ZOOM_OUT, {}); onClose(); },
    },
    {
      id: "view-fit",
      label: "Fit to View",
      group: "View",
      shortcut: "Ctrl+0",
      handler: () => { composer.emit(EVENTS.ZOOM_FIT, {}); onClose(); },
    }
  );

  // 4. History
  commands.push(
    {
      id: "history-undo",
      label: "Undo last action",
      group: "History",
      shortcut: "Ctrl+Z",
      handler: () => { composer.history.undo(); onClose(); },
    },
    {
      id: "history-clear",
      label: "Clear History",
      group: "History",
      handler: () => { composer.emit(EVENTS.HISTORY_CLEARED, undefined); onClose(); },
    }
  );

  return commands;
}

// =============================================================================
// SHORTCUT BADGE
// =============================================================================

const ShortcutBadge: React.FC<{ shortcut: string }> = ({ shortcut }) => {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const display = shortcut
    .replace(/Ctrl/g, isMac ? "⌘" : "Ctrl")
    .replace(/Shift/g, isMac ? "⇧" : "Shift")
    .replace(/Alt/g, isMac ? "⌥" : "Alt");

  return (
    <span
      style={{
        fontSize: 11,
        color: "var(--buildrick-text-muted)",
        background: "var(--buildrick-surface-4)",
        borderRadius: "var(--buildrick-radius-sm)",
        padding: "2px 6px",
        fontFamily: "var(--buildrick-font-family-mono)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {display}
    </span>
  );
};

// =============================================================================
// COMPONENT
// =============================================================================

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, composer }) => {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const commands = React.useMemo(
    () => buildCommands(composer, onClose),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [composer]
  );

  // Focus input on open
  React.useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, []);

  // Filtered commands
  const filteredCommands = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commands;
    return commands.filter((cmd) =>
      (cmd.label + " " + cmd.group).toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Reset selection when query changes
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector(`[data-idx="${selectedIndex}"]`) as HTMLElement | null;
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Group filtered commands
  const grouped = React.useMemo(() => {
    const groups: Record<string, PaletteCommand[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

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
          filteredCommands[selectedIndex]?.handler();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          zIndex: "calc(var(--buildrick-z-modal) - 1)",
        }}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-label="Command Palette"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 560,
          maxWidth: "90vw",
          background: "var(--buildrick-surface-3)",
          border: "1px solid var(--buildrick-border-light)",
          borderRadius: "var(--buildrick-radius-xl)",
          boxShadow: "var(--buildrick-shadow-2xl)",
          zIndex: "var(--buildrick-z-modal)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Search row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 52,
            padding: "0 16px",
            gap: 10,
            borderBottom: "1px solid var(--buildrick-border)",
          }}
        >
          {/* Search icon */}
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--buildrick-text-muted)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <circle cx={11} cy={11} r={8} />
            <line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>

          <TextInput
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              height: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 16,
              color: "var(--buildrick-text-primary)",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          style={{
            maxHeight: 360,
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--buildrick-surface-5) transparent",
          }}
        >
          {filteredCommands.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--buildrick-text-muted)",
                fontSize: 13,
              }}
            >
              No commands found
            </div>
          ) : (
            Object.entries(grouped).map(([group, cmds]) => {
              return (
                <div key={group}>
                  {/* Section header */}
                  <div
                    style={{
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      padding: "0 16px",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--buildrick-text-muted)",
                      background: "var(--buildrick-surface-2)",
                    }}
                  >
                    {group}
                  </div>
                  {/* Items */}
                  {cmds.map((cmd) => {
                    const globalIdx = filteredCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <Button
                        key={cmd.id}
                        data-idx={globalIdx}
                        onClick={cmd.handler}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          height: 44,
                          padding: "0 16px",
                          gap: 10,
                          background: isSelected
                            ? "var(--buildrick-accent-tint)"
                            : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.1s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          {cmd.icon && (
                            <span
                              aria-hidden="true"
                              style={{
                                width: 16,
                                height: 16,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--buildrick-text-muted)",
                                flexShrink: 0,
                                fontSize: 14,
                              }}
                            >
                              {cmd.icon}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 14,
                              color: "var(--buildrick-text-primary)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cmd.label}
                          </span>
                        </div>
                        {cmd.shortcut && <ShortcutBadge shortcut={cmd.shortcut} />}
                      </Button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderTop: "1px solid var(--buildrick-border)",
            fontSize: 11,
            color: "var(--buildrick-text-muted)",
            gap: 16,
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ run</span>
          <span>Esc close</span>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
