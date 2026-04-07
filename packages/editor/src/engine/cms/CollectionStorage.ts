/**
 * CMS Collection Storage
 * IndexedDB operations for CMS collections and content
 * @license BSD-3-Clause
 */

import type { CMSCollection, CMSContentItem } from "../../shared/types/cms";

// ============================================
// Database Configuration
// ============================================

const DB_NAME = "aquibra-cms";
const DB_VERSION = 1;
const COLLECTIONS_STORE = "collections";
const CONTENT_STORE = "content";

// ============================================
// Database Initialization
// ============================================

let dbPromise: Promise<IDBDatabase> | null = null;

function getDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open CMS database"));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create collections store
      if (!db.objectStoreNames.contains(COLLECTIONS_STORE)) {
        const store = db.createObjectStore(COLLECTIONS_STORE, { keyPath: "id" });
        store.createIndex("slug", "slug", { unique: true });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }

      // Create content store
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        const store = db.createObjectStore(CONTENT_STORE, { keyPath: "id" });
        store.createIndex("collectionId", "collectionId", { unique: false });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
  });

  return dbPromise;
}

// ============================================
// Storage Availability
// ============================================

export function isStorageAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

// ============================================
// Collection CRUD Operations
// ============================================

export async function saveCollection(collection: CMSCollection): Promise<void> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COLLECTIONS_STORE], "readwrite");
    const store = transaction.objectStore(COLLECTIONS_STORE);
    const request = store.put(collection);

    request.onerror = () => reject(new Error("Failed to save collection"));
    request.onsuccess = () => resolve();
  });
}

export async function loadCollections(): Promise<CMSCollection[]> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COLLECTIONS_STORE], "readonly");
    const store = transaction.objectStore(COLLECTIONS_STORE);
    const request = store.getAll();

    request.onerror = () => reject(new Error("Failed to load collections"));
    request.onsuccess = () => {
      const collections = request.result as CMSCollection[];
      collections.sort((a, b) => a.name.localeCompare(b.name));
      resolve(collections);
    };
  });
}

export async function loadCollection(id: string): Promise<CMSCollection | null> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COLLECTIONS_STORE], "readonly");
    const store = transaction.objectStore(COLLECTIONS_STORE);
    const request = store.get(id);

    request.onerror = () => reject(new Error("Failed to load collection"));
    request.onsuccess = () => resolve(request.result as CMSCollection | null);
  });
}

export async function loadCollectionBySlug(slug: string): Promise<CMSCollection | null> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COLLECTIONS_STORE], "readonly");
    const store = transaction.objectStore(COLLECTIONS_STORE);
    const index = store.index("slug");
    const request = index.get(slug);

    request.onerror = () => reject(new Error("Failed to load collection by slug"));
    request.onsuccess = () => resolve(request.result as CMSCollection | null);
  });
}

export async function deleteCollection(id: string): Promise<void> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([COLLECTIONS_STORE, CONTENT_STORE], "readwrite");

    // Delete all content items in collection first
    const contentStore = transaction.objectStore(CONTENT_STORE);
    const contentIndex = contentStore.index("collectionId");
    const contentRequest = contentIndex.getAllKeys(id);

    contentRequest.onsuccess = () => {
      const keys = contentRequest.result;
      keys.forEach((key) => contentStore.delete(key));

      // Then delete collection
      const collectionStore = transaction.objectStore(COLLECTIONS_STORE);
      const deleteRequest = collectionStore.delete(id);

      deleteRequest.onerror = () => reject(new Error("Failed to delete collection"));
      deleteRequest.onsuccess = () => resolve();
    };

    contentRequest.onerror = () => reject(new Error("Failed to delete collection content"));
  });
}

// ============================================
// Content CRUD Operations
// ============================================

export async function saveContentItem(item: CMSContentItem): Promise<void> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_STORE], "readwrite");
    const store = transaction.objectStore(CONTENT_STORE);
    const request = store.put(item);

    request.onerror = () => reject(new Error("Failed to save content item"));
    request.onsuccess = () => resolve();
  });
}

export async function loadContentItems(collectionId: string): Promise<CMSContentItem[]> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_STORE], "readonly");
    const store = transaction.objectStore(CONTENT_STORE);
    const index = store.index("collectionId");
    const request = index.getAll(collectionId);

    request.onerror = () => reject(new Error("Failed to load content items"));
    request.onsuccess = () => {
      const items = request.result as CMSContentItem[];
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(items);
    };
  });
}

export async function loadContentItem(id: string): Promise<CMSContentItem | null> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_STORE], "readonly");
    const store = transaction.objectStore(CONTENT_STORE);
    const request = store.get(id);

    request.onerror = () => reject(new Error("Failed to load content item"));
    request.onsuccess = () => resolve(request.result as CMSContentItem | null);
  });
}

export async function deleteContentItem(id: string): Promise<void> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_STORE], "readwrite");
    const store = transaction.objectStore(CONTENT_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(new Error("Failed to delete content item"));
    request.onsuccess = () => resolve();
  });
}

// ============================================
// Bulk Operations
// ============================================

export async function deleteAllContentItems(collectionId: string): Promise<number> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_STORE], "readwrite");
    const store = transaction.objectStore(CONTENT_STORE);
    const index = store.index("collectionId");
    const request = index.getAllKeys(collectionId);

    request.onerror = () => reject(new Error("Failed to delete content items"));
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
          if (deleteCount === keys.length) resolve(deleteCount);
        };
      });
    };
  });
}

// ============================================
// Statistics
// ============================================

export async function getContentCount(collectionId: string): Promise<number> {
  const db = await getDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTENT_STORE], "readonly");
    const store = transaction.objectStore(CONTENT_STORE);
    const index = store.index("collectionId");
    const request = index.count(collectionId);

    request.onerror = () => reject(new Error("Failed to count content items"));
    request.onsuccess = () => resolve(request.result);
  });
}
