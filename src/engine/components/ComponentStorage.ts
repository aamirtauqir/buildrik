/**
 * Component Storage
 * IndexedDB operations for reusable components
 *
 * @module engine/components/ComponentStorage
 * @license BSD-3-Clause
 */

import type { ComponentDefinition, StoredComponent } from "../../shared/types/components";

// ============================================
// Database Configuration
// ============================================

const DB_NAME = "aquibra-components";
const DB_VERSION = 1;
const STORE_NAME = "components";

// ============================================
// Database Initialization
// ============================================

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Get or create the database connection
 */
function getDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open components database"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create components store with projectId index
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
  });

  return dbPromise;
}

// ============================================
// Storage Availability
// ============================================

/**
 * Check if IndexedDB is available
 */
export function isStorageAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

// ============================================
// Component CRUD Operations
// ============================================

/**
 * Save a component to storage
 */
export async function saveComponent(
  component: ComponentDefinition,
  projectId: string = "default"
): Promise<void> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const storedComponent: StoredComponent = {
      id: component.id,
      projectId,
      data: component,
      updatedAt: Date.now(),
    };

    const request = store.put(storedComponent);

    request.onerror = () => {
      reject(new Error("Failed to save component"));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Load all components for a project
 */
export async function loadComponents(
  projectId: string = "default"
): Promise<ComponentDefinition[]> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("projectId");
    const request = index.getAll(projectId);

    request.onerror = () => {
      reject(new Error("Failed to load components"));
    };

    request.onsuccess = () => {
      const storedComponents = request.result as StoredComponent[];
      // Sort by updatedAt descending (most recent first)
      storedComponents.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(storedComponents.map((sc) => sc.data));
    };
  });
}

/**
 * Load a single component by ID
 */
export async function loadComponent(componentId: string): Promise<ComponentDefinition | null> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(componentId);

    request.onerror = () => {
      reject(new Error("Failed to load component"));
    };

    request.onsuccess = () => {
      const stored = request.result as StoredComponent | undefined;
      resolve(stored ? stored.data : null);
    };
  });
}

/**
 * Delete a component from storage
 */
export async function deleteComponent(componentId: string): Promise<void> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(componentId);

    request.onerror = () => {
      reject(new Error("Failed to delete component"));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * Delete all components for a project
 */
export async function deleteAllComponents(projectId: string = "default"): Promise<number> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("projectId");
    const request = index.getAllKeys(projectId);

    request.onerror = () => {
      reject(new Error("Failed to delete components"));
    };

    request.onsuccess = () => {
      const keys = request.result;
      let deleteCount = 0;

      if (keys.length === 0) {
        resolve(0);
        return;
      }

      keys.forEach((key) => {
        const deleteRequest = store.delete(key);
        deleteRequest.onsuccess = () => {
          deleteCount++;
          if (deleteCount === keys.length) {
            resolve(deleteCount);
          }
        };
      });
    };
  });
}

// ============================================
// Export / Import
// ============================================

/**
 * Export format for components
 */
export interface ComponentExport {
  version: "1.0.0";
  projectId: string;
  exportedAt: string;
  components: ComponentDefinition[];
}

/**
 * Export all components for a project
 */
export async function exportComponents(projectId: string = "default"): Promise<ComponentExport> {
  const components = await loadComponents(projectId);

  return {
    version: "1.0.0",
    projectId,
    exportedAt: new Date().toISOString(),
    components,
  };
}

/**
 * Import components into storage
 */
export async function importComponents(
  data: ComponentExport,
  clearExisting: boolean = false
): Promise<number> {
  if (clearExisting) {
    await deleteAllComponents(data.projectId);
  }

  let imported = 0;

  for (const component of data.components) {
    await saveComponent(component, data.projectId);
    imported++;
  }

  return imported;
}

/**
 * Download components as JSON file
 */
export function downloadComponentsFile(data: ComponentExport): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aquibra-components-${data.projectId}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// Statistics
// ============================================

/**
 * Get storage statistics for a project
 */
export async function getStorageStats(projectId: string = "default"): Promise<{
  count: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}> {
  const components = await loadComponents(projectId);

  if (components.length === 0) {
    return { count: 0, oldestDate: null, newestDate: null };
  }

  const dates = components.map((c) => c.createdAt);
  const oldest = Math.min(...dates);
  const newest = Math.max(...dates);

  return {
    count: components.length,
    oldestDate: new Date(oldest),
    newestDate: new Date(newest),
  };
}
