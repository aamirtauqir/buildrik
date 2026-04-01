/**
 * IndexedDB Adapter
 * Low-level IndexedDB operations for media storage
 * @license BSD-3-Clause
 */

import { MediaStorageError } from "./MediaStorageTypes";

// ============================================
// Database Configuration
// ============================================

export const DB_CONFIG = {
  name: "aquibra-media",
  version: 1,
  stores: {
    assets: "assets",
    folders: "folders",
    blobs: "blobs",
  },
} as const;

// ============================================
// IndexedDB Adapter
// ============================================

/**
 * Low-level IndexedDB adapter for transaction management
 */
export class IndexedDBAdapter {
  private db: IDBDatabase | null = null;

  get database(): IDBDatabase | null {
    return this.db;
  }

  /**
   * Open or create the IndexedDB database
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        reject(new Error(request.error?.message || "Failed to open database"));
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
    });
  }

  /**
   * Create object stores and indexes
   */
  private createStores(db: IDBDatabase): void {
    // Assets store with indexes
    if (!db.objectStoreNames.contains(DB_CONFIG.stores.assets)) {
      const assetsStore = db.createObjectStore(DB_CONFIG.stores.assets, { keyPath: "id" });
      assetsStore.createIndex("type", "type", { unique: false });
      assetsStore.createIndex("folderId", "folderId", { unique: false });
      assetsStore.createIndex("createdAt", "createdAt", { unique: false });
      assetsStore.createIndex("tags", "tags", { unique: false, multiEntry: true });
    }

    // Folders store with indexes
    if (!db.objectStoreNames.contains(DB_CONFIG.stores.folders)) {
      const foldersStore = db.createObjectStore(DB_CONFIG.stores.folders, { keyPath: "id" });
      foldersStore.createIndex("parentId", "parentId", { unique: false });
    }

    // Blobs store (keyed by asset ID)
    if (!db.objectStoreNames.contains(DB_CONFIG.stores.blobs)) {
      db.createObjectStore(DB_CONFIG.stores.blobs, { keyPath: "assetId" });
    }
  }

  /**
   * Ensure database is initialized
   */
  ensureDb(): IDBDatabase {
    if (!this.db) {
      throw new MediaStorageError("Database not initialized. Call open() first.", "ensureDb");
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Run a transaction with automatic promise handling
   */
  runTransaction(
    storeNames: string[],
    mode: IDBTransactionMode,
    callback: (tx: IDBTransaction) => void
  ): Promise<void> {
    const db = this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeNames, mode);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error("Transaction aborted"));

      callback(tx);
    });
  }

  /**
   * Run a get request and return the result
   */
  runGetRequest<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Run a getAll request and return the results
   */
  runGetAllRequest<T>(storeName: string): Promise<T[]> {
    const db = this.ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }
}
