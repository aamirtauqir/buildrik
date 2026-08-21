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
import { Button, TextInput } from "@/editor/chrome-ui";
// =============================================================================
// TYPES
// =============================================================================

/** How many commands the opening list offers before the rest fall under their
 *  own bands — board 166:2 shows a short "Suggested" head, not the catalogue. */
const SUGGESTED_COUNT = 5;

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
      /* Board 166:58: "A command you cannot run is still worth seeing — hiding
         it means the shortcut someone memorised silently vanishes." With
         nothing selected this used to close the palette and do nothing at
         all; now it says why it cannot run, like Undo already did. */
      disabled: (composer.selection?.getSelectedIds?.() ?? []).length === 0,
      disabledReason: "nothing selected",
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
  const selectedCount = composer.selection?.getSelectedIds?.().length ?? 0;
  const selectedType = composer.selection?.getSelected?.()?.getType?.();
  /* Registry commands that quietly return when the selection is wrong. Walked
     the palette command by command: Group with one element selected, Ungroup
     with a non-container, and every nudge/reorder with nothing selected all
     looked perfectly available, ran, and did nothing. The engine cannot carry
     this — its command list is built once at startup, while the selection
     changes under it — so the reason is computed here, where the list is built
     each time the palette opens. Same treatment Undo and Delete already got. */
  const registryGuard = (id: string): string | undefined => {
    if (id === "group") return selectedCount < 2 ? "select two or more" : undefined;
    if (id === "ungroup") return selectedType !== "container" ? "select a group" : undefined;
    if (
      id === "duplicate" ||
      id === "cut" ||
      id.startsWith("nudge-") ||
      id === "bring-forward" ||
      id === "send-backward" ||
      id === "bring-to-front" ||
      id === "send-to-back"
    ) {
      return selectedCount === 0 ? "nothing selected" : undefined;
    }
    return undefined;
  };
  for (const cmd of registry) {
    const label = cmd.label ?? cmd.id;
    if (seenLabels.has(label.toLowerCase())) continue;
    seenLabels.add(label.toLowerCase());
    const reason = registryGuard(cmd.id);
    commands.push({
      id: `cmd-${cmd.id}`,
      label,
      group: "Commands",
      shortcut: cmd.shortcut,
      disabled: reason !== undefined,
      disabledReason: reason,
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
    /* gray-700 on the gray-200 chip: gray-500 measured 3.9:1 there (axe). */
    <span className="tw:flex-none tw:whitespace-nowrap tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-gray-200 tw:text-[11px] tw:text-gray-700 tw:[font-family:var(--bk-font-mono)]">
      {display}
    </span>
  );
};

// =============================================================================
// COMPONENT
// =============================================================================

/** One id for the listbox, so the input can point at it and at its rows. */
const LIST_ID = "bk-cmdk-list";

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, composer }) => {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const commands = React.useMemo(
    () => buildCommands(composer, onClose),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // The palette unmounts on close (StudioHeader renders it conditionally), so
    // this list — and every "cannot run" reason in it — is rebuilt on each open
    // against the selection of that moment.
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
    /* UI_PANEL_OPEN is allow-listed to real LEFT tabs and "ai" is not one —
       this offer has been a no-op since it shipped. AI opens over the
       inspector (boards 170:*), which is what ui:switch-tab now routes. */
    composer?.emit("ui:switch-tab", { tab: "ai" });
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

  /* Boards 166:2 and 166:27 group by what a row DOES, not by which part of the
     editor owns it: RECENT · SUGGESTED before you type, ACTIONS · GO TO once
     you do. The internal groups (Navigation · Edit · View · History ·
     Commands) are the palette's own taxonomy and mean nothing to the person
     reading the list. */
  const bandFor = React.useCallback((cmd: PaletteCommand, index: number): string => {
    if (cmd.group === "Recent") return "Recent";
    if (!query.trim()) return index < SUGGESTED_COUNT ? "Suggested" : cmd.group === "Navigation" ? "Go to" : "Actions";
    return cmd.group === "Navigation" ? "Go to" : "Actions";
  }, [query]);

  const grouped = React.useMemo(() => {
    const groups: Record<string, PaletteCommand[]> = {};
    let nonRecent = 0;
    for (const cmd of displayCommands) {
      const band = bandFor(cmd, cmd.group === "Recent" ? -1 : nonRecent++);
      if (!groups[band]) groups[band] = [];
      groups[band].push(cmd);
    }
    return groups;
  }, [displayCommands, bandFor]);

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
        className="tw:fixed tw:inset-0 tw:bg-black/60 tw:[z-index:calc(var(--bk-z-modal)-1)]"
      />
      {/* Panel */}
      {/* The key handling lived on the search input alone, so it only worked
          while focus sat there: one Tab moved focus to a result button and
          Escape stopped closing the palette — measured, twice in a row, with
          the dialog still open. Arrow keys and Enter had the same reach. On
          the panel it covers everything inside, and the input still receives
          it by bubbling. */}
      <div
        role="dialog"
        aria-label="Command Palette"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        className="tw:flex tw:flex-col tw:gap-0 tw:fixed tw:top-1/5 tw:left-1/2 tw:-translate-x-1/2 tw:w-140 tw:max-w-[90vw] tw:overflow-hidden tw:rounded-lg tw:border tw:border-gray-200 tw:bg-[var(--bk-bg-subtle)] tw:[box-shadow:var(--bk-shadow-overlay)] tw:[z-index:var(--bk-z-modal)]"
      >
        {/* Search row */}
        <div
          className="tw:flex tw:items-center tw:h-13 tw:px-4 tw:gap-2.5 tw:border-b tw:border-gray-200"
        >
          {/* Search icon */}
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--bk-ink-muted)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="tw:flex-none"
          >
            <circle cx={11} cy={11} r={8} />
            <line x1={21} y1={21} x2={16.65} y2={16.65} />
          </svg>

          <TextInput
            ref={inputRef}
            type="text"
            /* Board 166:2's own words — the palette does both. */
            placeholder="Type a command or search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            /* The arrow keys move a highlight that assistive tech could not
               see: this was an input and a list of plain buttons, with no
               combobox, no listbox and no activedescendant, so a screen-reader
               user typing here heard the results change not at all. The list
               below carries role=listbox and each row role=option. */
            role="combobox"
            aria-expanded
            aria-controls={LIST_ID}
            aria-autocomplete="list"
            aria-activedescendant={
              displayCommands[selectedIndex] ? `${LIST_ID}-${selectedIndex}` : undefined
            }
            aria-label="Type a command or search"
            className="tw:flex-1 tw:[&_input]:h-full tw:[&_input]:border-0 tw:[&_input]:bg-transparent tw:[&_input]:text-base"
          />
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          id={LIST_ID}
          role="listbox"
          aria-label="Commands"
          className="tw:max-h-90 tw:overflow-y-auto tw:[scrollbar-width:thin] tw:[scrollbar-color:var(--bk-gray-200)_transparent]"
        >
          {displayCommands.length === 0 ? (
            query.trim() ? (
              // Boards 166:45 / 166:51 — a garbage query gets "nothing
              // matches"; a natural-language one gets the AI hand-off with the
              // diff-not-direct-writes explainer. Both route to the AI panel.
              <div className="tw:px-4 tw:py-3.5" data-testid="cmdk-no-results">
                {query.trim().split(/\s+/).length > 1 ? (
                  <>
                    <div className="tw:text-[13px] tw:text-gray-900">
                      That isn&rsquo;t a command — send it to AI?
                    </div>
                    <div className="tw:mt-1.5 tw:mb-2.5 tw:text-xs tw:text-gray-500">
                      AI proposes a diff and never writes directly. Apply lands as one undo step.
                    </div>
                  </>
                ) : (
                  <div className="tw:mb-2.5 tw:text-[13px] tw:text-gray-900">
                    Nothing matches &lsquo;{query.trim()}&rsquo;.
                  </div>
                )}
                <Button
                  onClick={askAI}
                  data-idx={0}
                  className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:rounded tw:border-0 tw:bg-[var(--bk-accent-tint)] tw:text-[13px] tw:font-semibold tw:text-blue-700"
                >
                  <span aria-hidden="true">✨</span>
                  {query.trim().split(/\s+/).length > 1 ? "Ask AI ›" : "Ask AI instead ›"}
                </Button>
              </div>
            ) : (
              <div className="tw:px-4 tw:py-6 tw:text-center tw:text-[13px] tw:text-gray-500">
                No commands found
              </div>
            )
          ) : (
            Object.entries(grouped).map(([group, cmds]) => {
              return (
                <div key={group}>
                  {/* Section header */}
                  <div
                    /* A listbox may only own options and groups, so the band
                       label is the group's own name rather than a loose div. */
                    role="presentation"
                    /* gray-600: these band labels are 11px on
                       --bk-bg-subtle, where gray-500 measures 4.39:1 — under
                       AA (axe, 6 nodes in this palette). */
                    className="tw:flex tw:items-center tw:h-7 tw:px-4 tw:text-[11px] tw:uppercase tw:tracking-[0.5px] tw:text-gray-600 tw:bg-[var(--bk-bg-subtle)]"
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
                        id={`${LIST_ID}-${globalIdx}`}
                        data-idx={globalIdx}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => runCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        aria-disabled={cmd.disabled || undefined}
                        className={`tw:flex tw:items-center tw:justify-between tw:w-full tw:h-11 tw:px-4 tw:gap-2.5 tw:rounded-none tw:border-0 tw:text-left ${
                          isSelected ? "tw:bg-[var(--bk-accent-tint)]" : "tw:bg-transparent"
                        } ${cmd.disabled ? "tw:opacity-55 tw:cursor-default" : ""}`}
                      >
                        <div className="tw:flex tw:items-center tw:gap-2.5 tw:min-w-0">
                          {cmd.icon && (
                            <span
                              aria-hidden="true"
                              className="tw:flex tw:flex-none tw:items-center tw:justify-center tw:size-4 tw:text-sm tw:text-gray-500"
                            >
                              {cmd.icon}
                            </span>
                          )}
                          <span className="tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:text-sm tw:text-gray-900">
                            {cmd.label}
                          </span>
                          {cmd.disabled && cmd.disabledReason && (
                            <span className="tw:flex-none tw:whitespace-nowrap tw:text-[11px] tw:text-gray-500">
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
          className="tw:flex tw:items-center tw:justify-center tw:h-9 tw:gap-4 tw:border-t tw:border-gray-200 tw:text-[11px] tw:text-gray-600"
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
