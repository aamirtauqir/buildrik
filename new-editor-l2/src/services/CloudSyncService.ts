/**
 * CloudSyncService - Handle cloud storage synchronization
 * @module services/CloudSyncService
 * @license BSD-3-Clause
 */

import type { ProjectData } from "../shared/types";

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valid project ID pattern: alphanumeric, hyphens, underscores only
 */
const VALID_PROJECT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate project ID to prevent path traversal attacks
 * Only allows alphanumeric characters, hyphens, and underscores
 * @throws Error if projectId contains invalid characters or path traversal patterns
 */
export function validateProjectId(projectId: string): void {
  // Check for empty string
  if (!projectId || projectId.length === 0) {
    throw new Error("Invalid project ID: cannot be empty");
  }

  // Check for path traversal patterns
  if (projectId.includes("..")) {
    throw new Error("Invalid project ID: path traversal detected");
  }

  // Only allow alphanumeric, hyphens, underscores
  if (!VALID_PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error("Invalid project ID: contains invalid characters");
  }
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported cloud storage providers
 */
export type CloudProvider = "supabase" | "firebase" | "aws" | "custom";

/**
 * Cloud provider configuration
 */
export interface CloudProviderConfig {
  provider: CloudProvider;
  /** API endpoint or project URL */
  endpoint: string;
  /** API key or access token */
  apiKey: string;
  /** Storage bucket name */
  bucket?: string;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * Sync status for a project
 */
export interface SyncStatus {
  /** Whether sync is in progress */
  isSyncing: boolean;
  /** Last successful sync timestamp */
  lastSyncedAt: number | null;
  /** Whether there are local changes to sync */
  hasLocalChanges: boolean;
  /** Whether there are remote changes to pull */
  hasRemoteChanges: boolean;
  /** Current error if any */
  error: string | null;
}

/**
 * Conflict between local and remote versions
 */
export interface SyncConflict {
  projectId: string;
  localVersion: ProjectData;
  remoteVersion: ProjectData;
  localModifiedAt: number;
  remoteModifiedAt: number;
}

/**
 * Resolution strategy for conflicts
 */
export type ConflictResolution = "keep-local" | "keep-remote" | "merge";

/**
 * Result of a sync operation
 */
export interface SyncResult {
  success: boolean;
  projectId: string;
  syncedAt?: number;
  conflict?: SyncConflict;
  error?: string;
}

/**
 * Remote project metadata
 */
export interface RemoteProject {
  id: string;
  name: string;
  modifiedAt: number;
  createdAt: number;
  size: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * CloudSyncService
 * Manages cloud storage synchronization for projects
 */
export class CloudSyncService {
  private config: CloudProviderConfig | null = null;
  private syncStatus: Map<string, SyncStatus> = new Map();
  private listeners: Set<(status: SyncStatus, projectId: string) => void> = new Set();

  /**
   * Configure the cloud sync service
   */
  configure(config: CloudProviderConfig): void {
    this.config = config;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Get current provider
   */
  getProvider(): CloudProvider | null {
    return this.config?.provider ?? null;
  }

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Push local project to cloud
   */
  async push(projectId: string, data: ProjectData): Promise<SyncResult> {
    try {
      validateProjectId(projectId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid project ID";
      return { success: false, projectId, error: errorMessage };
    }

    if (!this.config) {
      return { success: false, projectId, error: "Cloud sync not configured" };
    }

    this.updateStatus(projectId, { isSyncing: true, error: null });

    try {
      // Check for conflicts first
      const remoteData = await this.fetchRemote(projectId);
      if (remoteData) {
        const localModified = data.metadata?.updatedAt
          ? new Date(data.metadata.updatedAt).getTime()
          : Date.now();
        const remoteModified = remoteData.metadata?.updatedAt
          ? new Date(remoteData.metadata.updatedAt).getTime()
          : 0;

        if (remoteModified > localModified) {
          // Remote is newer - conflict
          const conflict: SyncConflict = {
            projectId,
            localVersion: data,
            remoteVersion: remoteData,
            localModifiedAt: localModified,
            remoteModifiedAt: remoteModified,
          };
          this.updateStatus(projectId, { isSyncing: false });
          return { success: false, projectId, conflict };
        }
      }

      // Upload to cloud
      await this.uploadToCloud(projectId, data);

      const syncedAt = Date.now();
      this.updateStatus(projectId, {
        isSyncing: false,
        lastSyncedAt: syncedAt,
        hasLocalChanges: false,
      });

      return { success: true, projectId, syncedAt };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.updateStatus(projectId, { isSyncing: false, error: errorMessage });
      return { success: false, projectId, error: errorMessage };
    }
  }

  /**
   * Pull remote project from cloud
   */
  async pull(projectId: string): Promise<{ success: boolean; data?: ProjectData; error?: string }> {
    try {
      validateProjectId(projectId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid project ID";
      return { success: false, error: errorMessage };
    }

    if (!this.config) {
      return { success: false, error: "Cloud sync not configured" };
    }

    this.updateStatus(projectId, { isSyncing: true, error: null });

    try {
      const data = await this.fetchRemote(projectId);
      if (!data) {
        this.updateStatus(projectId, { isSyncing: false });
        return { success: false, error: "Project not found in cloud" };
      }

      this.updateStatus(projectId, {
        isSyncing: false,
        lastSyncedAt: Date.now(),
        hasRemoteChanges: false,
      });

      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.updateStatus(projectId, { isSyncing: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sync project (push if local changes, pull if remote changes)
   */
  async sync(projectId: string, localData: ProjectData): Promise<SyncResult> {
    try {
      validateProjectId(projectId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid project ID";
      return { success: false, projectId, error: errorMessage };
    }

    const status = this.getStatus(projectId);

    if (status.hasLocalChanges) {
      return this.push(projectId, localData);
    }

    if (status.hasRemoteChanges) {
      const result = await this.pull(projectId);
      return {
        success: result.success,
        projectId,
        error: result.error,
      };
    }

    return { success: true, projectId, syncedAt: status.lastSyncedAt ?? undefined };
  }

  /**
   * Resolve a sync conflict
   */
  async resolveConflict(
    conflict: SyncConflict,
    resolution: ConflictResolution
  ): Promise<SyncResult> {
    switch (resolution) {
      case "keep-local":
        // Force push local version
        return this.forcePush(conflict.projectId, conflict.localVersion);

      case "keep-remote":
        // Just return success - caller should use remote version
        return { success: true, projectId: conflict.projectId, syncedAt: Date.now() };

      case "merge":
        // Merge is complex - for now, just keep local
        // In future, could implement smart merging
        return this.forcePush(conflict.projectId, conflict.localVersion);

      default:
        return { success: false, projectId: conflict.projectId, error: "Unknown resolution" };
    }
  }

  /**
   * Force push without conflict check
   */
  private async forcePush(projectId: string, data: ProjectData): Promise<SyncResult> {
    if (!this.config) {
      return { success: false, projectId, error: "Cloud sync not configured" };
    }

    try {
      await this.uploadToCloud(projectId, data);
      const syncedAt = Date.now();
      this.updateStatus(projectId, {
        isSyncing: false,
        lastSyncedAt: syncedAt,
        hasLocalChanges: false,
      });
      return { success: true, projectId, syncedAt };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, projectId, error: errorMessage };
    }
  }

  // ============================================================================
  // PROJECT LISTING
  // ============================================================================

  /**
   * List all remote projects
   */
  async listRemoteProjects(): Promise<RemoteProject[]> {
    if (!this.config) return [];

    try {
      return await this.fetchProjectList();
    } catch {
      return [];
    }
  }

  /**
   * Delete a remote project
   */
  async deleteRemote(projectId: string): Promise<boolean> {
    try {
      validateProjectId(projectId);
    } catch {
      return false;
    }

    if (!this.config) return false;

    try {
      await this.deleteFromCloud(projectId);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  /**
   * Get sync status for a project
   */
  getStatus(projectId: string): SyncStatus {
    return this.syncStatus.get(projectId) ?? this.createInitialStatus();
  }

  /**
   * Mark project as having local changes
   */
  markLocalChanges(projectId: string): void {
    const current = this.getStatus(projectId);
    this.updateStatus(projectId, { ...current, hasLocalChanges: true });
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: SyncStatus, projectId: string) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private updateStatus(projectId: string, updates: Partial<SyncStatus>): void {
    const current = this.getStatus(projectId);
    const newStatus = { ...current, ...updates };
    this.syncStatus.set(projectId, newStatus);
    this.listeners.forEach((cb) => cb(newStatus, projectId));
  }

  private createInitialStatus(): SyncStatus {
    return {
      isSyncing: false,
      lastSyncedAt: null,
      hasLocalChanges: false,
      hasRemoteChanges: false,
      error: null,
    };
  }

  // ============================================================================
  // PROVIDER IMPLEMENTATIONS
  // ============================================================================

  /**
   * Fetch remote project data
   */
  private async fetchRemote(projectId: string): Promise<ProjectData | null> {
    if (!this.config) return null;

    const { provider, endpoint, apiKey, bucket } = this.config;

    switch (provider) {
      case "supabase": {
        const url = `${endpoint}/storage/v1/object/${bucket ?? "projects"}/${projectId}.json`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}`, apikey: apiKey },
        });
        if (!res.ok) return null;
        return res.json();
      }

      case "firebase": {
        const url = `${endpoint}/${projectId}.json?auth=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return res.json();
      }

      case "custom": {
        const url = `${endpoint}/projects/${projectId}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return null;
        return res.json();
      }

      default:
        return null;
    }
  }

  /**
   * Upload project to cloud
   */
  private async uploadToCloud(projectId: string, data: ProjectData): Promise<void> {
    if (!this.config) throw new Error("Not configured");

    const { provider, endpoint, apiKey, bucket } = this.config;
    const body = JSON.stringify(data);

    switch (provider) {
      case "supabase": {
        const url = `${endpoint}/storage/v1/object/${bucket ?? "projects"}/${projectId}.json`;
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            apikey: apiKey,
            "Content-Type": "application/json",
          },
          body,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        break;
      }

      case "firebase": {
        const url = `${endpoint}/${projectId}.json?auth=${apiKey}`;
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        break;
      }

      case "custom": {
        const url = `${endpoint}/projects/${projectId}`;
        const res = await fetch(url, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body,
        });
        if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
        break;
      }

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Fetch project list from cloud
   */
  private async fetchProjectList(): Promise<RemoteProject[]> {
    if (!this.config) return [];

    const { provider, endpoint, apiKey, bucket } = this.config;

    switch (provider) {
      case "supabase": {
        const url = `${endpoint}/storage/v1/object/list/${bucket ?? "projects"}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}`, apikey: apiKey },
        });
        if (!res.ok) return [];
        const files = await res.json();
        return files.map(
          (f: {
            name: string;
            metadata: { size: number };
            created_at: string;
            updated_at: string;
          }) => ({
            id: f.name.replace(".json", ""),
            name: f.name.replace(".json", ""),
            modifiedAt: new Date(f.updated_at).getTime(),
            createdAt: new Date(f.created_at).getTime(),
            size: f.metadata?.size ?? 0,
          })
        );
      }

      case "custom": {
        const url = `${endpoint}/projects`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return [];
        return res.json();
      }

      default:
        return [];
    }
  }

  /**
   * Delete project from cloud
   */
  private async deleteFromCloud(projectId: string): Promise<void> {
    if (!this.config) throw new Error("Not configured");

    const { provider, endpoint, apiKey, bucket } = this.config;

    switch (provider) {
      case "supabase": {
        const url = `${endpoint}/storage/v1/object/${bucket ?? "projects"}/${projectId}.json`;
        const res = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}`, apikey: apiKey },
        });
        if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
        break;
      }

      case "firebase": {
        const url = `${endpoint}/${projectId}.json?auth=${apiKey}`;
        const res = await fetch(url, { method: "DELETE" });
        if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
        break;
      }

      case "custom": {
        const url = `${endpoint}/projects/${projectId}`;
        const res = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
        break;
      }

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const cloudSyncService = new CloudSyncService();

export default CloudSyncService;
