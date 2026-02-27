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
import type { Composer } from "../Composer";
import { buildDefaultCommands } from "./defaultCommands";
import { KeybindingManager } from "./KeybindingManager";

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
    this.composer.emit("command:registered", command);
  }

  unregister(id: string): boolean {
    const existed = this.commands.delete(id);
    if (existed) {
      this.keybindings.removeByCommandId(id);
      this.composer.emit("command:unregistered", id);
    }
    return existed;
  }

  // ─── Execution ──────────────────────────────────────────────────────────────

  run(id: string, options?: CommandOptions): CommandResult {
    const command = this.commands.get(id);
    if (!command) return;

    this.composer.emit("command:before", { id, options });

    try {
      const result = command.run(this.composer, options);
      this.activeCommands.add(id);
      this.composer.emit("command:run", { id, options, result });
      return result;
    } catch (error) {
      this.composer.emit("command:error", { id, error });
      throw error;
    }
  }

  stop(id: string, options?: CommandOptions): void {
    const command = this.commands.get(id);
    if (command?.stop) {
      command.stop(this.composer, options);
      this.activeCommands.delete(id);
      this.composer.emit("command:stop", { id, options });
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
   * Guard: prevent "delete" shortcut from firing when editing text in inputs.
   */
  private shouldHandleShortcut(e: KeyboardEvent, commandId: string): boolean {
    if (commandId !== "delete") return true;

    const target = e.target as HTMLElement | null;
    if (!target) return true;
    if (target.closest("input, textarea, select, option")) return false;
    if (target.isContentEditable) return false;
    if (target.closest("[contenteditable='true']")) return false;

    return true;
  }
}
