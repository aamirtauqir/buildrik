/** @deprecated DEAD/SIMULATED — StateReconstructor was never implemented; this module only re-exports history types, there is no state-reconstruction logic — do not build on this; see docs/audits/2026-07-08-editor-deep-audit.md §5c bucket A. */
/**
 * Aquibra History Sub-Module
 * Re-exports all history types and utilities
 *
 * @module engine/history
 * @license BSD-3-Clause
 */

// HistoryFormatter exports functions only (buildHistoryDisplayEntries, etc.) — import directly from ../HistoryFormatter
// StateReconstructor not yet implemented

export type {
  HistoryEntryType,
  BaseHistoryEntry,
  CheckpointEntry,
  PatchEntry,
  HistoryEntry,
  HistoryChange,
  HistoryDisplayEntry,
  HistoryConfig,
} from "../historyTypes";
