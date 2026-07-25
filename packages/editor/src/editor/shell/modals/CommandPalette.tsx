import { Input } from "@/editor/shared/vibcoder/Input";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Stack } from "@/editor/shared/vibcoder/Stack";
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
import { getRecentCommandIds, recordCommandRun } from "./commandRecents";

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
  /** Board 166:58 — a command you cannot run is still worth seeing. Disabled
   *  rows render muted with the reason and don't close the palette. */
  disabled?: boolean;
  disabledReason?: string;
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
      disabled: !composer.history.canUndo(),
      disabledReason: "nothing to undo",
      handler: () => { composer.history.undo(); onClose(); },
    },
    {
      id: "edit-redo",
      label: "Redo",
      group: "Edit",
      shortcut: "Ctrl+Y",
      disabled: !composer.history.canRedo(),
      disabledReason: "nothing to redo",
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
      disabled: !composer.history.canUndo(),
      disabledReason: "nothing to undo",
      handler: () => { composer.history.undo(); onClose(); },
    },
    {
      id: "history-clear",
      label: "Clear History",
      group: "History",
      handler: () => { composer.emit(EVENTS.HISTORY_CLEARED, undefined); onClose(); },
    }
  );

  // 5. Registry-backed commands (S3.14 B8 fix). The CommandCenter holds ~39
  // commands the hardcoded list never surfaced — Export HTML/JSON, Open
  // Exporter, device switches — so ⌘K couldn't reach them. Append the ones not
  // already covered (dedup by label), run through the registry. Additive: the
  // hardcoded commands above keep their exact behavior.
  const registry = composer.commands?.getAll?.() ?? [];
  const seenLabels = new Set(commands.map((c) => c.label.toLowerCase()));
  for (const cmd of registry) {
    const label = cmd.label ?? cmd.id;
    if (seenLabels.has(label.toLowerCase())) continue;
    seenLabels.add(label.toLowerCase());
    commands.push({
      id: `cmd-${cmd.id}`,
      label,
      group: "Commands",
      shortcut: cmd.shortcut,
      handler: () => { composer.commands.run(cmd.id); onClose(); },
    });
  }

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

  // Run a command AND record it as recent (S3.14), so the next ⌘K surfaces it.
  const runCommand = React.useCallback((cmd: PaletteCommand) => {
    if (cmd.disabled) return; // board 166:58 — visible, not runnable
    recordCommandRun(cmd.id);
    cmd.handler();
  }, []);

  // Opens the AI panel when the query matches no command (ai-offer). Read once
  // per open — recents don't change mid-session in a way the palette must track.
  const recentIds = React.useMemo(() => getRecentCommandIds(), []);

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

  // What actually renders: on an empty query, a "Recent" group of the last-run
  // commands is prepended (S3.14). Recents are clones (distinct object identity)
  // so list indexing stays correct even though they repeat a real command.
  const displayCommands = React.useMemo(() => {
    if (query.trim()) return filteredCommands;
    if (recentIds.length === 0) return commands;
    const recents = recentIds
      .map((id) => commands.find((c) => c.id === id))
      .filter((c): c is PaletteCommand => Boolean(c))
      .map((c) => ({ ...c, group: "Recent" }));
    return [...recents, ...commands];
  }, [query, filteredCommands, commands, recentIds]);

  // ai-offer: a query that matches nothing → offer the AI panel instead of a
  // dead end (contracts §2, no-results never a nothing-state).
  const askAI = React.useCallback(() => {
    composer?.emit(EVENTS.UI_PANEL_OPEN, { panel: "ai" });
    onClose();
  }, [composer, onClose]);

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

  // Group display commands (recents first when present)
  const grouped = React.useMemo(() => {
    const groups: Record<string, PaletteCommand[]> = {};
    for (const cmd of displayCommands) {
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, [displayCommands]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, displayCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (displayCommands.length === 0 && query.trim()) askAI();
          else {
            const cmd = displayCommands[selectedIndex];
            if (cmd) runCommand(cmd);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [displayCommands, selectedIndex, onClose, query, askAI, runCommand]
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
      <Stack
        role="dialog"
        aria-label="Command Palette"
        aria-modal="true"
        style={{
          gap: 0,
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

          <Input
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
          {displayCommands.length === 0 ? (
            query.trim() ? (
              // Boards 166:45 / 166:51 — a garbage query gets "nothing
              // matches"; a natural-language one gets the AI hand-off with the
              // diff-not-direct-writes explainer. Both route to the AI panel.
              <div style={{ padding: "14px 16px" }} data-testid="cmdk-no-results">
                {query.trim().split(/\s+/).length > 1 ? (
                  <>
                    <div style={{ fontSize: 13, color: "var(--buildrick-text-primary)" }}>
                      That isn&rsquo;t a command — send it to AI?
                    </div>
                    <div style={{ fontSize: 12, color: "var(--buildrick-text-muted)", margin: "6px 0 10px" }}>
                      AI proposes a diff and never writes directly. Apply lands as one undo step.
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--buildrick-text-primary)", marginBottom: 10 }}>
                    Nothing matches &lsquo;{query.trim()}&rsquo;.
                  </div>
                )}
                <Button
                  onClick={askAI}
                  data-idx={0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: "var(--buildrick-accent-tint)",
                    border: "none",
                    borderRadius: "var(--buildrick-radius-sm)",
                    cursor: "pointer",
                    color: "var(--buildrick-accent)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <span aria-hidden="true">✨</span>
                  {query.trim().split(/\s+/).length > 1 ? "Ask AI ›" : "Ask AI instead ›"}
                </Button>
              </div>
            ) : (
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
            )
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
                    const globalIdx = displayCommands.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <Button
                        key={`${group}-${cmd.id}`}
                        data-idx={globalIdx}
                        onClick={() => runCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        aria-disabled={cmd.disabled || undefined}
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
                          cursor: cmd.disabled ? "default" : "pointer",
                          opacity: cmd.disabled ? 0.55 : 1,
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
                          {cmd.disabled && cmd.disabledReason && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--buildrick-text-muted)",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                              }}
                            >
                              {cmd.disabledReason}
                            </span>
                          )}
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
      </Stack>
    </>
  );
};

export default CommandPalette;
