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
  /** Project ID this version belongs to */
  projectId?: string;
}

/**
 * Version history export format
 * Used for import/export of version history
 */
export interface VersionHistoryExport {
  /** Export format version */
  version: "1.0.0";
  /** Project ID */
  projectId: string;
  /** Export timestamp (ISO string) */
  exportedAt: string;
  /** All exported versions */
  versions: NamedVersion[];
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
  autoCheckpointEvents: ["project:loaded", "template:applied"],
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
}

/**
 * Version deleted event payload
 */
export interface VersionDeletedPayload {
  versionId: string;
  versionName: string;
}

/**
 * Version export/import payload
 */
export interface VersionExportPayload {
  projectId: string;
  count: number;
  filename?: string;
}
