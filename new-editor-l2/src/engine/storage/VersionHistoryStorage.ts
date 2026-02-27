/**
 * Version History Storage
 * IndexedDB operations for persistent version history
 *
 * @module engine/storage/VersionHistoryStorage
 * @license BSD-3-Clause
 */

import type {
  NamedVersion,
  StoredVersion,
  VersionHistoryExport,
} from "../../shared/types/versions";

// ============================================
// Constants
// ============================================

const DB_NAME = "aquibra-versions";
const DB_VERSION = 1;
const STORE_NAME = "versions";

// ============================================
// Database Initialization
// ============================================

/**
 * Opens the version history database
 */
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
        store.createIndex("createdAt", "data.createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
  });
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Save a version to IndexedDB
 */
export async function saveVersion(version: NamedVersion): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const storedVersion: StoredVersion = {
      id: version.id,
      projectId: version.projectId || "default",
      data: version,
      updatedAt: Date.now(),
    };

    store.put(storedVersion);

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

/**
 * Load all versions for a project, sorted by creation date (newest first)
 */
export async function loadVersions(projectId: string = "default"): Promise<NamedVersion[]> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("projectId");
    const request = index.getAll(projectId);

    request.onsuccess = () => {
      const stored = request.result as StoredVersion[];
      const versions = stored.map((s) => s.data).sort((a, b) => b.createdAt - a.createdAt);
      db.close();
      resolve(versions);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Load a single version by ID
 */
export async function loadVersion(versionId: string): Promise<NamedVersion | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(versionId);

    request.onsuccess = () => {
      const stored = request.result as StoredVersion | undefined;
      db.close();
      resolve(stored?.data || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Delete a version by ID
 */
export async function deleteVersion(versionId: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(versionId);

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

/**
 * Delete all versions for a project
 */
export async function deleteAllVersions(projectId: string = "default"): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("projectId");
    const request = index.getAllKeys(projectId);

    request.onsuccess = () => {
      const keys = request.result;
      keys.forEach((key) => store.delete(key));
    };

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
// Version Pruning
// ============================================

/**
 * Prune old versions to stay under the limit
 * Keeps the N most recent versions
 */
export async function pruneVersions(
  projectId: string = "default",
  maxVersions: number = 50
): Promise<number> {
  const versions = await loadVersions(projectId);

  if (versions.length <= maxVersions) {
    return 0;
  }

  // Versions are sorted newest first
  const toDelete = versions.slice(maxVersions);
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    toDelete.forEach((v) => store.delete(v.id));

    tx.oncomplete = () => {
      db.close();
      resolve(toDelete.length);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// ============================================
// Export / Import
// ============================================

/**
 * Export all versions for a project as a JSON file
 */
export async function exportVersions(projectId: string = "default"): Promise<VersionHistoryExport> {
  const versions = await loadVersions(projectId);

  return {
    version: "1.0.0",
    projectId,
    exportedAt: new Date().toISOString(),
    versions,
  };
}

/**
 * Import versions from an export file
 * Optionally clears existing versions first
 */
export async function importVersions(
  data: VersionHistoryExport,
  clearExisting: boolean = false
): Promise<number> {
  if (clearExisting) {
    await deleteAllVersions(data.projectId);
  }

  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    data.versions.forEach((version) => {
      const storedVersion: StoredVersion = {
        id: version.id,
        projectId: data.projectId,
        data: { ...version, projectId: data.projectId },
        updatedAt: Date.now(),
      };
      store.put(storedVersion);
    });

    tx.oncomplete = () => {
      db.close();
      resolve(data.versions.length);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/**
 * Download versions as a JSON file
 */
export function downloadVersionsFile(data: VersionHistoryExport, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `versions-${data.projectId}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if IndexedDB is available
 */
export function isStorageAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

/**
 * Get storage statistics
 */
export async function getStorageStats(projectId: string = "default"): Promise<{
  count: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}> {
  const versions = await loadVersions(projectId);

  if (versions.length === 0) {
    return { count: 0, oldestDate: null, newestDate: null };
  }

  return {
    count: versions.length,
    newestDate: new Date(versions[0].createdAt),
    oldestDate: new Date(versions[versions.length - 1].createdAt),
  };
}
