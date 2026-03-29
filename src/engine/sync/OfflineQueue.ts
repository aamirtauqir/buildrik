/**
 * OfflineQueue - Queue operations for offline-first sync
 * @module engine/sync/OfflineQueue
 * @license BSD-3-Clause
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types of sync operations
 */
export type SyncOperationType = "create" | "update" | "delete";

/**
 * A queued sync operation
 */
export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  projectId: string;
  timestamp: number;
  data?: unknown;
  retries: number;
  maxRetries: number;
}

/**
 * Queue storage interface
 */
export interface QueueStorage {
  get(key: string): Promise<SyncOperation[] | null>;
  set(key: string, value: SyncOperation[]): Promise<void>;
  delete(key: string): Promise<void>;
}

// ============================================================================
// INDEXEDDB STORAGE
// ============================================================================

const DB_NAME = "aquibra-sync";
const STORE_NAME = "offline-queue";
const DB_VERSION = 1;

class IndexedDBQueueStorage implements QueueStorage {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  }

  async get(key: string): Promise<SyncOperation[] | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, value: SyncOperation[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// ============================================================================
// OFFLINE QUEUE CLASS
// ============================================================================

/**
 * OfflineQueue
 * Manages a queue of sync operations for offline-first architecture
 */
export class OfflineQueue {
  private storage: QueueStorage;
  private queue: SyncOperation[] = [];
  private isProcessing = false;
  private onProcess: ((op: SyncOperation) => Promise<boolean>) | null = null;
  private listeners: Set<(queue: SyncOperation[]) => void> = new Set();

  constructor(storage?: QueueStorage) {
    this.storage = storage ?? new IndexedDBQueueStorage();
  }

  /**
   * Initialize the queue from storage
   */
  async init(): Promise<void> {
    const stored = await this.storage.get("queue");
    if (stored) {
      this.queue = stored;
      this.notifyListeners();
    }
  }

  /**
   * Set the processor function for queue items
   */
  setProcessor(processor: (op: SyncOperation) => Promise<boolean>): void {
    this.onProcess = processor;
  }

  /**
   * Add an operation to the queue
   */
  async enqueue(
    type: SyncOperationType,
    projectId: string,
    data?: unknown,
    maxRetries = 3
  ): Promise<string> {
    const op: SyncOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      projectId,
      timestamp: Date.now(),
      data,
      retries: 0,
      maxRetries,
    };

    // Deduplicate - remove existing operations for same project/type
    this.queue = this.queue.filter(
      (existing) => !(existing.projectId === projectId && existing.type === type)
    );

    this.queue.push(op);
    await this.persist();
    this.notifyListeners();

    return op.id;
  }

  /**
   * Remove an operation from the queue
   */
  async dequeue(operationId: string): Promise<void> {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Get all queued operations
   */
  getQueue(): SyncOperation[] {
    return [...this.queue];
  }

  /**
   * Get queue length
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  get isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Process all queued operations
   */
  async processAll(): Promise<{ processed: number; failed: number }> {
    if (this.isProcessing || !this.onProcess) {
      return { processed: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let failed = 0;

    // Process in order
    const toProcess = [...this.queue];

    for (const op of toProcess) {
      try {
        const success = await this.onProcess(op);

        if (success) {
          await this.dequeue(op.id);
          processed++;
        } else {
          // Increment retry count
          op.retries++;

          if (op.retries >= op.maxRetries) {
            // Max retries reached - remove from queue
            await this.dequeue(op.id);
            failed++;
          } else {
            // Update in queue with new retry count
            await this.persist();
          }
        }
      } catch {
        op.retries++;

        if (op.retries >= op.maxRetries) {
          await this.dequeue(op.id);
          failed++;
        } else {
          await this.persist();
        }
      }
    }

    this.isProcessing = false;
    return { processed, failed };
  }

  /**
   * Clear all queued operations
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.storage.delete("queue");
    this.notifyListeners();
  }

  /**
   * Subscribe to queue changes
   */
  onChange(callback: (queue: SyncOperation[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async persist(): Promise<void> {
    await this.storage.set("queue", this.queue);
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => cb([...this.queue]));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const offlineQueue = new OfflineQueue();

export default OfflineQueue;
