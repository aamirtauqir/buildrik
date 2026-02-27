/**
 * Aquibra Storage Adapter
 * Handles project persistence
 *
 * @module engine/storage/StorageAdapter
 * @license BSD-3-Clause
 */

/* eslint-disable no-useless-catch */

import { EVENTS, THRESHOLDS } from "../../shared/constants";
import type { StorageConfig, ProjectData } from "../../shared/types";
import { debounce } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";

/**
 * Storage adapter for project persistence
 */
export class StorageAdapter {
  private composer: Composer;
  private config: StorageConfig;
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
  private storageKey: string;
  private debouncedSaveHandler: (() => void) | null = null;

  constructor(composer: Composer, config?: StorageConfig) {
    this.composer = composer;
    this.config = {
      type: "local",
      autoSave: true,
      autoSaveInterval: THRESHOLDS.AUTOSAVE_INTERVAL,
      keyPrefix: "aquibra",
      ...config,
    };
    this.storageKey = `${this.config.keyPrefix}-project`;

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Start auto-save
   */
  private startAutoSave(): void {
    if (this.debouncedSaveHandler) return;

    this.debouncedSaveHandler = debounce(() => {
      if (this.composer.isDirty()) {
        this.save(this.composer.exportProject()).catch((error) => {
          this.composer.emit(EVENTS.STORAGE_ERROR, { error, operation: "auto-save" });
        });
      }
    }, this.config.autoSaveInterval!);

    this.composer.on(EVENTS.PROJECT_CHANGED, this.debouncedSaveHandler);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    if (this.debouncedSaveHandler) {
      this.composer.off(EVENTS.PROJECT_CHANGED, this.debouncedSaveHandler);
      this.debouncedSaveHandler = null;
    }
  }

  // ============================================
  // Storage Operations
  // ============================================

  /**
   * Load project from storage
   */
  async load(id?: string): Promise<ProjectData | null> {
    const key = id ? `${this.config.keyPrefix}-${id}` : this.storageKey;

    switch (this.config.type) {
      case "local":
        return this.loadFromLocalStorage(key);

      case "session":
        return this.loadFromSessionStorage(key);

      case "indexeddb":
        return this.loadFromIndexedDB(key);

      case "remote":
        return this.loadFromRemote(key);

      case "none":
        return null;

      default:
        // Custom handler
        if (this.config.handlers?.load) {
          return this.config.handlers.load(id);
        }
        return null;
    }
  }

  /**
   * Save project to storage
   */
  async save(data: ProjectData, id?: string): Promise<void> {
    const key = id ? `${this.config.keyPrefix}-${id}` : this.storageKey;

    switch (this.config.type) {
      case "local":
        return this.saveToLocalStorage(key, data);

      case "session":
        return this.saveToSessionStorage(key, data);

      case "indexeddb":
        return this.saveToIndexedDB(key, data);

      case "remote":
        return this.saveToRemote(key, data);

      case "none":
        return;

      default:
        // Custom handler
        if (this.config.handlers?.save) {
          return this.config.handlers.save(data);
        }
    }
  }

  /**
   * Delete project from storage
   */
  async delete(id?: string): Promise<void> {
    const key = id ? `${this.config.keyPrefix}-${id}` : this.storageKey;

    switch (this.config.type) {
      case "local":
        localStorage.removeItem(key);
        break;

      case "session":
        sessionStorage.removeItem(key);
        break;

      case "indexeddb":
        await this.deleteFromIndexedDB(key);
        break;

      case "remote":
        await this.deleteFromRemote(key);
        break;
    }
  }

  // ============================================
  // Local Storage
  // ============================================

  private loadFromLocalStorage(key: string): ProjectData | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveToLocalStorage(key: string, data: ProjectData): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Session Storage
  // ============================================

  private loadFromSessionStorage(key: string): ProjectData | null {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveToSessionStorage(key: string, data: ProjectData): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // IndexedDB
  // ============================================

  /**
   * Shared IndexedDB database opener
   * Eliminates code duplication across load/save/delete operations
   */
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("aquibra-storage", 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("projects")) {
          db.createObjectStore("projects", { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  private async loadFromIndexedDB(key: string): Promise<ProjectData | null> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction("projects", "readonly");
      const store = tx.objectStore("projects");
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        const result = getRequest.result?.data || null;
        db.close();
        resolve(result);
      };
      getRequest.onerror = () => {
        db.close();
        reject(getRequest.error);
      };
    });
  }

  private async saveToIndexedDB(key: string, data: ProjectData): Promise<void> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction("projects", "readwrite");
      const store = tx.objectStore("projects");
      store.put({ id: key, data, updatedAt: Date.now() });

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    const db = await this.openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction("projects", "readwrite");
      const store = tx.objectStore("projects");
      store.delete(key);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  // ============================================
  // Remote Storage
  // ============================================

  private async loadFromRemote(key: string): Promise<ProjectData | null> {
    if (!this.config.endpoint) {
      throw new Error("Remote endpoint not configured");
    }

    try {
      const response = await fetch(`${this.config.endpoint}/${key}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      throw error;
    }
  }

  private async saveToRemote(key: string, data: ProjectData): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error("Remote endpoint not configured");
    }

    try {
      const response = await fetch(`${this.config.endpoint}/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  private async deleteFromRemote(key: string): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error("Remote endpoint not configured");
    }

    try {
      const response = await fetch(`${this.config.endpoint}/${key}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get storage type
   */
  getType(): StorageConfig["type"] {
    return this.config.type;
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    switch (this.config.type) {
      case "local":
        return typeof localStorage !== "undefined";
      case "session":
        return typeof sessionStorage !== "undefined";
      case "indexeddb":
        return typeof indexedDB !== "undefined";
      case "remote":
        return !!this.config.endpoint;
      case "none":
        return false;
      default:
        return !!this.config.handlers;
    }
  }

  /**
   * Get storage quota information
   * Returns storage usage data for monitoring
   */
  async getStorageQuota(): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> {
    // For browser storage APIs, try to get actual quota
    if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? used / quota : 0;

        return { used, quota, percentage };
      } catch {
        // Fall through to default values
      }
    }

    // Default fallback (no quota information available)
    return {
      used: 0,
      quota: 0,
      percentage: 0,
    };
  }

  /**
   * Destroy storage adapter
   */
  destroy(): void {
    this.stopAutoSave();
  }
}
