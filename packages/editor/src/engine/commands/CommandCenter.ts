/**
 * Aquibra Command Center
 * Coordinates command registration, execution, and keyboard shortcut dispatch.
 *
 * Command definitions → defaultCommands.ts
 * Shortcut index/listeners → KeybindingManager.ts
 * Element operation helpers → commandOperations.ts
 *
 * @module engine/commands/CommandCenter
 * @license BSD-3-Clause
 */

import type { CommandData, CommandOptions, CommandResult } from "../../shared/types";
import { EVENTS } from "../../shared/constants/events";
import type { Composer } from "../Composer";
import { buildDefaultCommands } from "./defaultCommands";
import { KeybindingManager } from "./KeybindingManager";

/**
 * Roles whose ARIA pattern defines what the arrow keys do inside them. A global
 * shortcut that fires here is competing with the widget the user is operating.
 */
const WIDGET_ROLES = [
  "menu",
  "menubar",
  "listbox",
  "combobox",
  "tree",
  "grid",
  "tablist",
  "radiogroup",
  "dialog",
  "slider",
  "spinbutton",
]
  .map((role) => `[role="${role}"]`)
  .join(", ");

/**
 * Canvas commands whose shortcut a focused text field has a stronger claim on.
 * Each of these is a chord the OS/browser already binds to text editing, so
 * when the caret is in a field the user means the text, not the canvas.
 */
const TEXT_OWNED_COMMANDS = new Set(["select-all", "cut", "copy", "paste", "undo", "redo"]);

/**
 * Commands that CHANGE the document. In a read-only composer they must not run,
 * whatever the chord.
 *
 * This list is the one that matters for client view. The chrome withheld the
 * React handlers — inline edit, drop, the context menu, the wrapper's keydown —
 * and the document stayed mutable anyway, because KeybindingManager binds
 * `keydown` on WINDOW in the capture phase. Click-to-select is deliberately
 * left on, so: click an element, press Delete, and it is gone. Measured on a
 * scratch site in client view — 203 elements became 202, and autosave writes
 * that to the server. Gating N React leaves cannot close a window listener; the
 * gate belongs at the gateway.
 */
const MUTATING_COMMANDS = new Set([
  "delete", "duplicate", "cut", "paste", "undo", "redo", "save",
  "group", "ungroup",
  "bring-forward", "send-backward", "bring-to-front", "send-to-back",
  "move-up", "move-down", "nudge-up", "nudge-down", "nudge-left", "nudge-right",
]);

/** Is the keystroke aimed at somewhere the user is typing? */
function isTextEntry(el: HTMLElement | null): boolean {
  if (!el) return false;
  if (el.isContentEditable) return true;
  return typeof el.closest === "function"
    ? !!el.closest("input, textarea, [contenteditable='true']")
    : false;
}

export class CommandCenter {
  private composer: Composer;
  private commands: Map<string, CommandData> = new Map();
  private keybindings: KeybindingManager = new KeybindingManager();
  private activeCommands: Set<string> = new Set();

  constructor(composer: Composer) {
    this.composer = composer;

    // Register all built-in commands
    buildDefaultCommands(composer).forEach((cmd) => this.register(cmd));

    // Wire keybinding dispatch → command execution
    this.keybindings.setup(
      (commandId) => this.run(commandId),
      (event, commandId) => this.shouldHandleShortcut(event, commandId)
    );
  }

  // ─── Registration ───────────────────────────────────────────────────────────

  register(command: CommandData): void {
    this.commands.set(command.id, command);
    this.keybindings.indexCommand(command);
    this.composer.emit(EVENTS.COMMAND_REGISTERED, command);
  }

  unregister(id: string): boolean {
    const existed = this.commands.delete(id);
    if (existed) {
      this.keybindings.removeByCommandId(id);
      this.composer.emit(EVENTS.COMMAND_UNREGISTERED, id);
    }
    return existed;
  }

  // ─── Execution ──────────────────────────────────────────────────────────────

  run(id: string, options?: CommandOptions): CommandResult {
    const command = this.commands.get(id);
    if (!command) return;

    this.composer.emit(EVENTS.COMMAND_BEFORE, { id, options });

    try {
      const result = command.run(this.composer, options);
      this.activeCommands.add(id);
      this.composer.emit(EVENTS.COMMAND_RUN, { id, options, result });
      return result;
    } catch (error) {
      this.composer.emit(EVENTS.COMMAND_ERROR, { id, error });
      throw error;
    }
  }

  stop(id: string, options?: CommandOptions): void {
    const command = this.commands.get(id);
    if (command?.stop) {
      command.stop(this.composer, options);
      this.activeCommands.delete(id);
      this.composer.emit(EVENTS.COMMAND_STOP, { id, options });
    }
  }

  // ─── Query ──────────────────────────────────────────────────────────────────

  isActive(id: string): boolean {
    return this.activeCommands.has(id);
  }
  get(id: string): CommandData | undefined {
    return this.commands.get(id);
  }
  getAll(): CommandData[] {
    return Array.from(this.commands.values());
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  destroy(): void {
    this.keybindings.destroy();
    this.commands.clear();
    this.activeCommands.clear();
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  /**
   * Guard: an unmodified single-key shortcut must not fire when the keystroke
   * belongs to whatever the user is standing in.
   *
   * The listener is global and capture-phase, so it sees every keydown in the
   * document before the widget the user is actually using does — and it calls
   * `preventDefault()`. With `arrowup/down/left/right` and `delete` registered
   * as bare keys, that silently broke arrow navigation inside every menu,
   * listbox, tree and dialog in the editor: the menu's own handler ran, saw
   * `defaultPrevented`, and stood down. Found via the topbar site menu, where
   * ArrowDown did nothing while Home and End (unregistered) worked.
   *
   * Ctrl/Cmd combinations mostly ARE meant to keep working while typing — ⌘S
   * saves mid-sentence — but "mostly" is not "always", and treating every mod
   * chord as ours was a real bug (see the two carve-outs below).
   */
  private shouldHandleShortcut(e: KeyboardEvent, commandId: string): boolean {
    const target = e.target as HTMLElement | null;

    // A read-only composer runs no command that changes the document.
    if (this.composer.readOnly && MUTATING_COMMANDS.has(commandId)) return false;

    if (e.metaKey || e.ctrlKey) {
      // Carve-out 1: the clipboard/undo/select chords belong to the caret.
      // ⌘A, ⌘X, ⌘C, ⌘V, ⌘Z all exist as canvas commands AND as the text
      // editing a user is doing right now. Because this listener is
      // capture-phase on `window` it wins every time and then calls
      // preventDefault(), so before this guard existed, ⌘A in the page-rename
      // field selected every element on the canvas instead of the filename,
      // ⌘Z undid a canvas operation instead of the typo, and ⌘X cut the
      // selected element out of the document. Nothing downstream could stop
      // it — capture on window runs before any element handler.
      if (TEXT_OWNED_COMMANDS.has(commandId) && isTextEntry(target)) return false;

      // Carve-out 2: an open modal owns the keyboard. Same contract the chrome
      // enforces via isModalOpen(); expressed here as a DOM query rather than
      // an import because engine/ must not depend on editor/.
      if (typeof document !== "undefined" && document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return false;
      }

      return true;
    }

    if (!target?.closest) return true;

    // Text entry owns every bare key it receives.
    if (target.closest("input, textarea, select, option")) return false;
    if (target.isContentEditable) return false;
    if (target.closest("[contenteditable='true']")) return false;

    // Widgets with their own keyboard contract own arrows, Home/End and Enter.
    return !target.closest(WIDGET_ROLES);
  }
}
