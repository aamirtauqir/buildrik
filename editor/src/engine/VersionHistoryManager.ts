/**
 * Version History Manager
 * Manages named version snapshots for persistent version history
 *
 * @module engine/VersionHistoryManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../shared/constants";
import type { ProjectData } from "../shared/types";
import type {
  NamedVersion,
  VersionHistoryConfig,
  VersionHistoryExport,
} from "../shared/types/versions";
import { DEFAULT_VERSION_HISTORY_CONFIG } from "../shared/types/versions";
import { deepClone } from "../shared/utils/helpers";
import type { Composer } from "./Composer";
import {
  saveVersion,
  loadVersions,
  loadVersion,
  deleteVersion as deleteVersionFromStorage,
  pruneVersions,
  exportVersions as exportVersionsFromStorage,
  importVersions as importVersionsToStorage,
  downloadVersionsFile,
  isStorageAvailable,
  getStorageStats,
} from "./storage/VersionHistoryStorage";

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique version ID
 */
function generateVersionId(): string {
  return `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Version History Manager
// ============================================

/**
 * Manages persistent named version snapshots
 */
export class VersionHistoryManager {
  private composer: Composer;
  private config: VersionHistoryConfig;
  private versions: NamedVersion[] = [];
  private projectId: string = "default";
  private isLoading: boolean = false;
  private autoCheckpointHandlers: Map<string, () => void> = new Map();

  constructor(composer: Composer, config?: Partial<VersionHistoryConfig>) {
    this.composer = composer;
    this.config = { ...DEFAULT_VERSION_HISTORY_CONFIG, ...config };

    // Initialize if storage available
    if (isStorageAvailable() && this.config.enabled) {
      this.initialize();
    }
  }

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize the version history manager
   */
  private async initialize(): Promise<void> {
    await this.loadVersionsFromStorage();
    this.setupAutoCheckpoints();
  }

  /**
   * Load versions from storage
   */
  private async loadVersionsFromStorage(): Promise<void> {
    this.isLoading = true;
    this.versions = await loadVersions(this.projectId);
    this.isLoading = false;

    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });
  }

  /**
   * Set up auto-checkpoint event listeners
   */
  private setupAutoCheckpoints(): void {
    this.config.autoCheckpointEvents.forEach((eventName) => {
      const handler = () => {
        if (!this.isLoading) {
          this.autoCheckpoint(`Auto: ${eventName}`);
        }
      };
      this.autoCheckpointHandlers.set(eventName, handler);
      this.composer.on(eventName, handler);
    });
  }

  // ============================================
  // Public API - Version CRUD
  // ============================================

  /**
   * Create a new named version
   */
  async createVersion(name: string, description?: string): Promise<NamedVersion> {
    const snapshot = this.captureSnapshot();

    const version: NamedVersion = {
      id: generateVersionId(),
      name,
      description,
      snapshot,
      createdAt: Date.now(),
      isAutoCheckpoint: false,
      projectId: this.projectId,
    };

    await saveVersion(version);
    this.versions.unshift(version);
    await this.pruneIfNeeded();

    this.composer.emit(EVENTS.VERSION_CREATED, {
      version,
      isAuto: false,
    });
    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });

    return version;
  }

  /**
   * Create an auto-checkpoint
   */
  async autoCheckpoint(label: string): Promise<NamedVersion | null> {
    if (!this.config.enabled) return null;

    const snapshot = this.captureSnapshot();

    const version: NamedVersion = {
      id: generateVersionId(),
      name: label,
      snapshot,
      createdAt: Date.now(),
      isAutoCheckpoint: true,
      projectId: this.projectId,
    };

    await saveVersion(version);
    this.versions.unshift(version);
    await this.pruneIfNeeded();

    this.composer.emit(EVENTS.VERSION_CREATED, {
      version,
      isAuto: true,
    });
    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });

    return version;
  }

  /**
   * Get all versions
   */
  getVersions(): NamedVersion[] {
    return [...this.versions];
  }

  /**
   * Get a single version by ID
   */
  async getVersion(versionId: string): Promise<NamedVersion | null> {
    // Check cache first
    const cached = this.versions.find((v) => v.id === versionId);
    if (cached) return cached;

    // Load from storage
    return loadVersion(versionId);
  }

  /**
   * Restore to a named version
   */
  async restoreVersion(versionId: string): Promise<boolean> {
    const version = await this.getVersion(versionId);
    if (!version) return false;

    const previousVersionId = this.versions[0]?.id;

    // Import the snapshot
    this.composer.importProject(deepClone(version.snapshot));

    this.composer.emit(EVENTS.VERSION_RESTORED, {
      version,
      previousVersionId,
    });

    return true;
  }

  /**
   * Delete a version
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    const version = this.versions.find((v) => v.id === versionId);
    if (!version) return false;

    await deleteVersionFromStorage(versionId);
    this.versions = this.versions.filter((v) => v.id !== versionId);

    this.composer.emit(EVENTS.VERSION_DELETED, {
      versionId,
      versionName: version.name,
    });
    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });

    return true;
  }

  /**
   * Update version metadata (name, description, tags)
   */
  async updateVersion(
    versionId: string,
    updates: Partial<Pick<NamedVersion, "name" | "description" | "tags">>
  ): Promise<boolean> {
    const version = this.versions.find((v) => v.id === versionId);
    if (!version) return false;

    Object.assign(version, updates);
    await saveVersion(version);

    this.composer.emit(EVENTS.VERSION_LIST_UPDATED, { versions: this.versions });
    return true;
  }

  // ============================================
  // Export / Import
  // ============================================

  /**
   * Export all versions to a file
   */
  async exportVersions(download: boolean = true): Promise<VersionHistoryExport> {
    const data = await exportVersionsFromStorage(this.projectId);

    if (download) {
      downloadVersionsFile(data);
    }

    this.composer.emit(EVENTS.VERSION_EXPORTED, {
      projectId: this.projectId,
      count: data.versions.length,
    });

    return data;
  }

  /**
   * Import versions from a file
   */
  async importVersions(file: File, clearExisting: boolean = false): Promise<number> {
    const text = await file.text();
    const data = JSON.parse(text) as VersionHistoryExport;

    const count = await importVersionsToStorage(data, clearExisting);
    await this.loadVersionsFromStorage();

    this.composer.emit(EVENTS.VERSION_IMPORTED, {
      projectId: this.projectId,
      count,
      filename: file.name,
    });

    return count;
  }

  // ============================================
  // Configuration
  // ============================================

  /**
   * Set project ID (call when project changes)
   */
  async setProjectId(projectId: string): Promise<void> {
    this.projectId = projectId;
    await this.loadVersionsFromStorage();
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<VersionHistoryConfig>): void {
    this.config = { ...this.config, ...config };

    // Re-setup auto-checkpoints if events changed
    if (config.autoCheckpointEvents) {
      this.removeAutoCheckpoints();
      this.setupAutoCheckpoints();
    }
  }

  /**
   * Enable/disable version history
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (enabled) {
      this.setupAutoCheckpoints();
    } else {
      this.removeAutoCheckpoints();
    }
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get version history statistics
   */
  async getStats(): Promise<{
    count: number;
    oldestDate: Date | null;
    newestDate: Date | null;
    autoCount: number;
    manualCount: number;
  }> {
    const baseStats = await getStorageStats(this.projectId);
    const autoCount = this.versions.filter((v) => v.isAutoCheckpoint).length;

    return {
      ...baseStats,
      autoCount,
      manualCount: this.versions.length - autoCount,
    };
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return isStorageAvailable() && this.config.enabled;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Capture current project snapshot
   */
  private captureSnapshot(): ProjectData {
    return deepClone(this.composer.exportProject());
  }

  /**
   * Prune old versions if over limit
   */
  private async pruneIfNeeded(): Promise<void> {
    const pruned = await pruneVersions(this.projectId, this.config.maxVersions);
    if (pruned > 0) {
      this.versions = this.versions.slice(0, this.config.maxVersions);
    }
  }

  /**
   * Remove auto-checkpoint event listeners
   */
  private removeAutoCheckpoints(): void {
    this.autoCheckpointHandlers.forEach((handler, eventName) => {
      this.composer.off(eventName, handler);
    });
    this.autoCheckpointHandlers.clear();
  }

  // ============================================
  // Lifecycle
  // ============================================

  /**
   * Destroy the manager
   */
  destroy(): void {
    this.removeAutoCheckpoints();
    this.versions = [];
  }
}
