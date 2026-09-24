/**
 * Version History Type Definitions
 * Types for persistent version history and snapshots
 *
 * @module types/versions
 * @license BSD-3-Clause
 */

import type { ProjectData } from "./index";

// ============================================
// Version Types
// ============================================

/**
 * Named version snapshot
 * Represents a saved state of the project that users can revert to
 */
export interface NamedVersion {
  /** Unique version ID */
  id: string;
  /** User-provided name for the version */
  name: string;
  /** Optional description/notes about this version */
  description?: string;
  /** Full project snapshot at this point in time */
  snapshot: ProjectData;
  /** Creation timestamp (ms since epoch) */
  createdAt: number;
  /** Optional tags for organization */
  tags?: string[];
  /** Whether this was auto-created or manually saved */
  isAutoCheckpoint: boolean;
  /** What an auto-version marks, shown in place of "Auto-save" — the
   *  template backup's `Before template "<name>"` (C4 #25). Plain auto-saves
   *  carry none. */
  title?: string;
  /** Project ID this version belongs to */
  projectId?: string;
  /** Base64 JPEG visual snapshot of the canvas at save time */
  visualSnapshot?: string | null;
  /** Cached AI-generated summary */
  aiSummary?: string | null;
  /** User ID of who created this version */
  userId?: string | null;
}

// ============================================
// Configuration Types
// ============================================

/**
 * Version history configuration
 */
export interface VersionHistoryConfig {
  /** Maximum versions to keep in IndexedDB (default: 50) */
  maxVersions: number;
  /** Auto-checkpoint interval in ms (default: 0 = disabled) */
  autoCheckpointInterval: number;
  /** Events that trigger auto-checkpoint */
  autoCheckpointEvents: string[];
  /** Whether to enable version history (default: true) */
  enabled: boolean;
}

/**
 * Default configuration for version history
 */
export const DEFAULT_VERSION_HISTORY_CONFIG: VersionHistoryConfig = {
  maxVersions: 50,
  autoCheckpointInterval: 0,
  /* `project:loaded` was in here, so merely OPENING a site minted a version —
     one nobody made, first in the list, and the reason Saves·empty (163:64)
     was unreachable on every healthy site. Founder call G7 (2026-09-02): the
     first checkpoint waits for a real edit.
     `template:applied` was here too, and fired AFTER the apply — a version of
     the page the user already has, listed beside the real backup as a second
     "Auto-save" at the same minute (QA 2026-09-24). The template backup is
     the version the Templates panel takes BEFORE it replaces (#25). */
  autoCheckpointEvents: [],
  enabled: true,
};

// ============================================
// Storage Types
// ============================================

/**
 * IndexedDB stored version entry
 */
export interface StoredVersion {
  /** Version ID (used as key) */
  id: string;
  /** Project ID for indexing */
  projectId: string;
  /** Version data */
  data: NamedVersion;
  /** Last updated timestamp for pruning */
  updatedAt: number;
}

// ============================================
// Event Payload Types
// ============================================

/**
 * Version created event payload
 */
export interface VersionCreatedPayload {
  version: NamedVersion;
  isAuto: boolean;
}

/**
 * Version restored event payload
 */
export interface VersionRestoredPayload {
  version: NamedVersion;
  previousVersionId?: string;
  /** The version the work on screen was saved as before the restore — what
   *  "Undo restore" restores (G1-071). */
  safetyVersionId?: string;
}

/**
 * Version deleted event payload
 */
export interface VersionDeletedPayload {
  versionId: string;
  versionName: string;
}

// ============================================
// Compare Result Types
// ============================================

import type { ChangeType } from "../../engine/historyTypes";

/**
 * A single change detected between two versions
 */
export interface VersionChange {
  type: ChangeType;
  property: string;
  before: string;
  after: string;
}

/**
 * Summary counts of changes by type
 */
export interface CompareSummary {
  style: number;
  text: number;
  layout: number;
  content: number;
  other: number;
  /** Count of pages present in target but not in current (spec §2.3) */
  pagesAdded: number;
  /** Count of pages present in current but not in target (spec §2.3) */
  pagesDeleted: number;
}

/**
 * Result of comparing two version snapshots
 */
export interface CompareResult {
  elementName: string;
  changes: VersionChange[];
  summary: CompareSummary;
}
