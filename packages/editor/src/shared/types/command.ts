/**
 * Command Types
 * Types for editor commands and keyboard shortcuts
 *
 * @module types/command
 * @license BSD-3-Clause
 */

import type { Composer } from "../../engine/Composer";

// ============================================
// Command Types
// ============================================

/** Command execution result */
export type CommandResult = void | boolean | unknown;

/** Command options record */
export type CommandOptions = Record<string, unknown>;

export interface CommandData {
  /** Command ID */
  id: string;
  /** Command label */
  label?: string;
  /** Command icon */
  icon?: string;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Alternate keyboard shortcuts */
  shortcuts?: string[];
  /** Run command */
  run: (composer: Composer, options?: CommandOptions) => CommandResult;
  /** Stop command */
  stop?: (composer: Composer, options?: CommandOptions) => void;
}
