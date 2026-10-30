/**
 * History Type Definitions
 * Shared types for HistoryManager, HistoryFormatter
 *
 * @module engine/historyTypes
 * @license BSD-3-Clause
 */

import type { ProjectData } from "../shared/types";
import type { Patch } from "./utils/JsonPatch";

// ============================================
// Change Classification Types
// ============================================

/**
 * Classification categories for version comparisons
 */
export type ChangeType = "style" | "text" | "layout" | "content" | "other";

/**
 * History entry types
 */
export type HistoryEntryType = "checkpoint" | "patch" | "custom";

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
  /** User ID of who created this entry (team attribution, spec §2.10) */
  userId?: string | null;
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
 * Custom entry — a step whose state lives OUTSIDE the project snapshot (page
 * folders, a per-user organisation), recorded with `history.recordCustom`.
 * It changes no project data, so state reconstruction passes over it; undo
 * and redo run its own functions instead of restoring a snapshot.
 */
export interface CustomEntry extends BaseHistoryEntry {
  type: "custom";
  label: string;
  undo: () => void;
  redo: () => void;
}

/** What `history.recordCustom` takes. */
export interface CustomStep {
  /** User-facing, as the History panel and receipts say it. */
  label: string;
  undo: () => void;
  redo: () => void;
}

/**
 * Union type for history entries
 */
export type HistoryEntry = CheckpointEntry | PatchEntry | CustomEntry;

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
  type: HistoryEntryType;
  /** Formatted changes (for patch entries) */
  changes: HistoryChange[];
  /** User ID of who created this entry (for team attribution, spec §2.10) */
  userId: string | null;
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
