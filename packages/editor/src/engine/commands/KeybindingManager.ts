/**
 * Keybinding Manager
 * Handles keyboard shortcut registration, normalization, and event dispatch
 *
 * @module engine/commands/KeybindingManager
 * @license BSD-3-Clause
 */

import type { CommandData } from "../../shared/types";

/** Stored DOM listener for cleanup */
interface StoredListener {
  target: EventTarget;
  handler: EventListener;
  options?: boolean | AddEventListenerOptions;
}

/**
 * Manages keyboard shortcut index and event listeners.
 * Translates raw keyboard events into normalized shortcut strings
 * and resolves them to command IDs.
 */
export class KeybindingManager {
  /** Map from normalized shortcut string to command ID */
  private shortcutIndex: Map<string, string> = new Map();
  /** Active DOM listeners (for cleanup) */
  private listeners: StoredListener[] = [];

  /**
   * Attach a keydown listener to the global target.
   * @param onShortcut - callback receiving (commandId) when a registered shortcut fires
   * @param shouldHandle - predicate (event, commandId) => boolean; returning false skips handling
   */
  setup(
    onShortcut: (commandId: string, event: KeyboardEvent) => void,
    shouldHandle: (event: KeyboardEvent, commandId: string) => boolean
  ): void {
    const target =
      typeof window !== "undefined" ? window : typeof document !== "undefined" ? document : null;

    if (!target) return;

    const handler = (e: KeyboardEvent) => {
      const shortcut = this.getShortcutString(e);
      if (!shortcut) return;

      const commandId = this.shortcutIndex.get(shortcut);
      if (!commandId) return;

      if (!shouldHandle(e, commandId)) return;

      e.preventDefault();
      onShortcut(commandId, e);
    };

    target.addEventListener("keydown", handler as EventListener, {
      capture: true,
    });
    this.listeners.push({
      target,
      handler: handler as EventListener,
      options: { capture: true },
    });
  }

  /**
   * Index all shortcuts for a command so they resolve to its ID.
   * Removes any stale shortcuts for the same command first.
   */
  indexCommand(command: CommandData): void {
    this.removeByCommandId(command.id);

    const shortcuts = this.getCommandShortcuts(command);
    shortcuts.forEach((shortcut) => {
      this.shortcutIndex.set(shortcut, command.id);
    });
  }

  /**
   * Remove all shortcut entries pointing to the given command ID.
   */
  removeByCommandId(commandId: string): void {
    for (const [shortcut, id] of Array.from(this.shortcutIndex.entries())) {
      if (id === commandId) {
        this.shortcutIndex.delete(shortcut);
      }
    }
  }

  /**
   * Resolve a command from a registered shortcut string.
   */
  findCommandId(shortcut: string): string | undefined {
    return this.shortcutIndex.get(shortcut);
  }

  /**
   * Tear down all listeners and clear the index.
   */
  destroy(): void {
    this.listeners.forEach(({ target, handler, options }) =>
      target.removeEventListener("keydown", handler, options)
    );
    this.listeners = [];
    this.shortcutIndex.clear();
  }

  // --------------------------------------------------
  // Internal helpers
  // --------------------------------------------------

  /**
   * Build a normalized shortcut string from a KeyboardEvent.
   */
  private getShortcutString(e: KeyboardEvent): string {
    const parts: string[] = [];

    if (e.ctrlKey || e.metaKey) parts.push("ctrl");
    if (e.shiftKey) parts.push("shift");
    if (e.altKey) parts.push("alt");

    const key = e.key.toLowerCase();
    if (!["control", "shift", "alt", "meta"].includes(key)) {
      parts.push(key);
    }

    return this.normalizeShortcut(parts.join("+"));
  }

  /**
   * Normalize a shortcut string to a consistent, comparable format.
   * Example: "Meta+Shift+Z" -> "ctrl+shift+z"
   */
  normalizeShortcut(shortcut: string): string {
    const rawParts = shortcut
      .toLowerCase()
      .split("+")
      .map((p) => p.trim())
      .filter(Boolean);

    const mods: string[] = [];
    let key = "";

    rawParts.forEach((part) => {
      if (["meta", "cmd", "command", "control", "ctrl"].includes(part)) {
        if (!mods.includes("ctrl")) mods.push("ctrl");
      } else if (part === "shift") {
        if (!mods.includes("shift")) mods.push("shift");
      } else if (["alt", "option"].includes(part)) {
        if (!mods.includes("alt")) mods.push("alt");
      } else {
        key = part;
      }
    });

    return [...mods, key].filter(Boolean).join("+");
  }

  /**
   * Collect all shortcut strings (primary + aliases) for a command.
   */
  private getCommandShortcuts(command: CommandData): string[] {
    const shortcuts: string[] = [];

    if (command.shortcut) {
      shortcuts.push(command.shortcut);
    }

    const aliases = command.shortcuts;
    if (Array.isArray(aliases)) {
      shortcuts.push(...aliases);
    }

    return shortcuts.map((s) => this.normalizeShortcut(s)).filter((s) => s.length > 0);
  }
}
