/**
 * SyncManager - Orchestrate cloud sync with offline support
 * @module engine/sync/SyncManager
 * @license BSD-3-Clause
 */

import {
  cloudSyncService,
  type SyncStatus,
  type SyncConflict,
  type ConflictResolution,
} from "../../services/CloudSyncService";
import { EVENTS } from "../../shared/constants";
import type { ProjectData } from "../../shared/types";
import type { Composer } from "../Composer";
import { offlineQueue, type SyncOperation } from "./OfflineQueue";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Sync manager configuration
 */
export interface SyncManagerConfig {
  /** Auto-sync interval in milliseconds (0 = disabled) */
  autoSyncInterval: number;
  /** Sync on project save */
  syncOnSave: boolean;
  /** Sync when coming online */
  syncOnOnline: boolean;
  /** Maximum queue size before forcing sync */
  maxQueueSize: number;
}

/**
 * Sync manager state
 */
export interface SyncManagerState {
  isOnline: boolean;
  isConfigured: boolean;
  pendingOperations: number;
  activeConflict: SyncConflict | null;
}

// ============================================================================
// SYNC MANAGER CLASS
// ============================================================================

/**
 * SyncManager
 * Manages synchronization between local and cloud storage
 */
export class SyncManager {
  private composer: Composer;
  private config: SyncManagerConfig;
  private state: SyncManagerState;
  private autoSyncTimer: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: SyncManagerState) => void> = new Set();
  private initialized = false;

  constructor(composer: Composer, config?: Partial<SyncManagerConfig>) {
    this.composer = composer;
    this.config = {
      autoSyncInterval: config?.autoSyncInterval ?? 60000, // 1 minute
      syncOnSave: config?.syncOnSave ?? true,
      syncOnOnline: config?.syncOnOnline ?? true,
      maxQueueSize: config?.maxQueueSize ?? 10,
    };

    this.state = {
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      isConfigured: cloudSyncService.isConfigured(),
      pendingOperations: 0,
      activeConflict: null,
    };
  }

  /**
   * Initialize the sync manager
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Initialize offline queue
    await offlineQueue.init();
    this.state.pendingOperations = offlineQueue.length;

    // Set up queue processor
    offlineQueue.setProcessor(async (op) => this.processOperation(op));

    // Subscribe to queue changes
    offlineQueue.onChange((queue) => {
      this.updateState({ pendingOperations: queue.length });
    });

    // Set up online/offline listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }

    // Set up project save listener
    if (this.config.syncOnSave) {
      this.composer.on(EVENTS.PROJECT_SAVED, this.handleProjectSave);
    }

    // Start auto-sync if configured
    if (this.config.autoSyncInterval > 0) {
      this.startAutoSync();
    }

    this.initialized = true;
    this.notifyListeners();
  }

  /**
   * Destroy the sync manager
   */
  destroy(): void {
    this.stopAutoSync();

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }

    this.composer.off(EVENTS.PROJECT_SAVED, this.handleProjectSave);
    this.listeners.clear();
    this.initialized = false;
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Sync current project
   */
  async syncCurrentProject(): Promise<boolean> {
    if (!this.state.isOnline || !this.state.isConfigured) {
      return false;
    }

    const projectData = this.composer.exportProject();
    const projectId = projectData.metadata?.name ?? "default";

    const result = await cloudSyncService.sync(projectId, projectData);

    if (result.conflict) {
      this.updateState({ activeConflict: result.conflict });
      this.composer.emit(EVENTS.SYNC_CONFLICT, { conflict: result.conflict });
      return false;
    }

    if (result.success) {
      this.composer.emit(EVENTS.SYNC_COMPLETED, { projectId, syncedAt: result.syncedAt });
    } else {
      this.composer.emit(EVENTS.SYNC_ERROR, { projectId, error: result.error });
    }

    return result.success;
  }

  /**
   * Push current project to cloud
   */
  async push(): Promise<boolean> {
    const projectData = this.composer.exportProject();
    const projectId = projectData.metadata?.name ?? "default";

    if (!this.state.isOnline) {
      // Queue for later
      await offlineQueue.enqueue("update", projectId, projectData);
      return true;
    }

    const result = await cloudSyncService.push(projectId, projectData);

    if (result.conflict) {
      this.updateState({ activeConflict: result.conflict });
      return false;
    }

    return result.success;
  }

  /**
   * Pull latest from cloud
   */
  async pull(): Promise<ProjectData | null> {
    if (!this.state.isOnline || !this.state.isConfigured) {
      return null;
    }

    const projectData = this.composer.exportProject();
    const projectId = projectData.metadata?.name ?? "default";

    const result = await cloudSyncService.pull(projectId);

    if (result.success && result.data) {
      return result.data;
    }

    return null;
  }

  /**
   * Resolve active conflict
   */
  async resolveConflict(resolution: ConflictResolution): Promise<boolean> {
    const conflict = this.state.activeConflict;
    if (!conflict) return false;

    const result = await cloudSyncService.resolveConflict(conflict, resolution);

    if (result.success) {
      this.updateState({ activeConflict: null });
      this.composer.emit(EVENTS.SYNC_CONFLICT_RESOLVED, { resolution });

      // If keeping remote, import the remote data
      if (resolution === "keep-remote") {
        this.composer.importProject(conflict.remoteVersion);
      }
    }

    return result.success;
  }

  /**
   * Process queued operations
   */
  async processQueue(): Promise<{ processed: number; failed: number }> {
    if (!this.state.isOnline) {
      return { processed: 0, failed: 0 };
    }

    return offlineQueue.processAll();
  }

  // ============================================================================
  // STATE & CONFIGURATION
  // ============================================================================

  /**
   * Get current state
   */
  getState(): SyncManagerState {
    return { ...this.state };
  }

  /**
   * Get sync status for current project
   */
  getSyncStatus(): SyncStatus {
    const projectData = this.composer.exportProject();
    return cloudSyncService.getStatus(projectData.metadata?.name ?? "default");
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: SyncManagerState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SyncManagerConfig>): void {
    this.config = { ...this.config, ...updates };

    // Restart auto-sync with new interval
    if (updates.autoSyncInterval !== undefined) {
      this.stopAutoSync();
      if (this.config.autoSyncInterval > 0) {
        this.startAutoSync();
      }
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private handleOnline = (): void => {
    this.updateState({ isOnline: true });
    this.composer.emit(EVENTS.NETWORK_ONLINE, {});

    if (this.config.syncOnOnline) {
      this.processQueue();
    }
  };

  private handleOffline = (): void => {
    this.updateState({ isOnline: false });
    this.composer.emit(EVENTS.NETWORK_OFFLINE, {});
  };

  private handleProjectSave = (): void => {
    if (this.state.isOnline && this.state.isConfigured) {
      this.push();
    } else {
      // Queue the save for later
      const projectData = this.composer.exportProject();
      const projectId = projectData.metadata?.name ?? "default";
      offlineQueue.enqueue("update", projectId, projectData);
    }
  };

  private async processOperation(op: SyncOperation): Promise<boolean> {
    switch (op.type) {
      case "create":
      case "update": {
        if (!op.data) return false;
        const result = await cloudSyncService.push(op.projectId, op.data as ProjectData);
        return result.success;
      }

      case "delete": {
        return cloudSyncService.deleteRemote(op.projectId);
      }

      default:
        return false;
    }
  }

  private startAutoSync(): void {
    if (this.autoSyncTimer) return;

    this.autoSyncTimer = setInterval(() => {
      if (this.state.isOnline && this.state.isConfigured) {
        this.syncCurrentProject();
      }
    }, this.config.autoSyncInterval);
  }

  private stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  private updateState(updates: Partial<SyncManagerState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb({ ...this.state }));
  }
}

export default SyncManager;
