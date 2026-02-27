/**
 * History Type Definitions
 * Shared types for HistoryManager, HistoryFormatter
 *
 * @module engine/historyTypes
 * @license BSD-3-Clause
 */

import type { ProjectData } from "../shared/types";
import type { Patch } from "./utils/JsonPatch";

/**
 * History entry types
 */
export type HistoryEntryType = "checkpoint" | "patch";

/**
 * Base history entry
 */
export interface BaseHistoryEntry {
  /** When this entry was created */
  timestamp: number;
  /** Optional label describing this action */
  label?: string;
  /** Entry type */
  type: HistoryEntryType;
}

/**
 * Checkpoint entry - stores full project state
 */
export interface CheckpointEntry extends BaseHistoryEntry {
  type: "checkpoint";
  /** Full project snapshot */
  snapshot: ProjectData;
}

/**
 * Patch entry - stores only the diff from previous state
 */
export interface PatchEntry extends BaseHistoryEntry {
  type: "patch";
  /** Forward patch (to go from previous to this state) */
  patch: Patch;
  /** Reverse patch (to go from this state to previous) */
  reversePatch: Patch;
}

/**
 * Union type for history entries
 */
export type HistoryEntry = CheckpointEntry | PatchEntry;

/**
 * Public type for a single change in history (for UI display)
 */
export interface HistoryChange {
  /** Property name that changed */
  property: string;
  /** Operation type */
  operation: "add" | "remove" | "replace" | "info";
  /** Old value (for replace/remove) */
  oldValue?: unknown;
  /** New value (for add/replace) */
  newValue?: unknown;
  /** Human-readable description */
  description: string;
}

/**
 * Public type for history entry display (for UI)
 */
export interface HistoryDisplayEntry {
  /** Unique identifier */
  id: string;
  /** Index in the undo stack */
  index: number;
  /** When this entry was created */
  timestamp: number;
  /** Label describing this action */
  label: string;
  /** Entry type */
  type: "checkpoint" | "patch";
  /** Formatted changes (for patch entries) */
  changes: HistoryChange[];
}

/**
 * Configuration for diff-based history
 */
export interface HistoryConfig {
  /** Maximum number of history entries */
  maxHistory: number;
  /** Create a checkpoint every N entries (for faster reconstruction) */
  checkpointInterval: number;
  /** Debounce delay in ms for coalescing rapid changes */
  coalesceDelay: number;
}
