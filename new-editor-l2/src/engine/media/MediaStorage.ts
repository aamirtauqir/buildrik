/**
 * Aquibra Media Storage
 * IndexedDB-based persistent storage for media assets
 *
 * @module engine/media/MediaStorage
 * @license BSD-3-Clause
 */

import type { MediaAsset, MediaFolder } from "../../shared/types/media";
import { IndexedDBAdapter, DB_CONFIG } from "./IndexedDBAdapter";
import {
  MediaStorageError,
  type StoredAsset,
  type StoredFolder,
  type StoredBlob,
} from "./MediaStorageTypes";

// Re-export error class for external use
export { MediaStorageError } from "./MediaStorageTypes";

/**
 * IndexedDB storage adapter for media assets
 *
 * Provides persistent storage for:
 * - Media asset metadata (images, videos, audio, icons)
 * - Media folders for organization
 * - Binary blob data (stored separately for performance)
 */
export class MediaStorage {
  private adapter = new IndexedDBAdapter();

  private get ASSETS_STORE() {
    return DB_CONFIG.stores.assets;
  }
  private get FOLDERS_STORE() {
    return DB_CONFIG.stores.folders;
  }
  private get BLOBS_STORE() {
    return DB_CONFIG.stores.blobs;
  }

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    try {
      await this.adapter.open();
    } catch (error) {
      throw new MediaStorageError(
        "Failed to initialize media storage",
        "init",
        error instanceof Error ? error : undefined
      );
    }
  }

  // ============================================
  // Asset Operations
  // ============================================

  /**
   * Save a media asset to storage
   */
  async saveAsset(asset: MediaAsset, blob?: Blob): Promise<void> {
    try {
      const storedAsset: StoredAsset = {
        id: asset.id,
        type: asset.type,
        folderId: asset.folderId || null,
        createdAt: asset.createdAt,
        tags: asset.tags || [],
        data: asset,
      };

      const storeNames = blob ? [this.ASSETS_STORE, this.BLOBS_STORE] : [this.ASSETS_STORE];

      await this.adapter.runTransaction(storeNames, "readwrite", (tx) => {
        tx.objectStore(this.ASSETS_STORE).put(storedAsset);
        if (blob) {
          const storedBlob: StoredBlob = { assetId: asset.id, blob };
          tx.objectStore(this.BLOBS_STORE).put(storedBlob);
        }
      });
    } catch (error) {
      throw new MediaStorageError(
        `Failed to save asset: ${asset.id}`,
        "saveAsset",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get a media asset by ID
   */
  async getAsset(id: string): Promise<MediaAsset | null> {
    try {
      const result = await this.adapter.runGetRequest<StoredAsset>(this.ASSETS_STORE, id);
      return result?.data || null;
    } catch (error) {
      throw new MediaStorageError(
        `Failed to get asset: ${id}`,
        "getAsset",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all media assets
   */
  async getAllAssets(): Promise<MediaAsset[]> {
    try {
      const results = await this.adapter.runGetAllRequest<StoredAsset>(this.ASSETS_STORE);
      return results.map((r) => r.data);
    } catch (error) {
      throw new MediaStorageError(
        "Failed to get all assets",
        "getAllAssets",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete a media asset and its associated blob
   */
  async deleteAsset(id: string): Promise<void> {
    try {
      await this.adapter.runTransaction(
        [this.ASSETS_STORE, this.BLOBS_STORE],
        "readwrite",
        (tx) => {
          tx.objectStore(this.ASSETS_STORE).delete(id);
          tx.objectStore(this.BLOBS_STORE).delete(id);
        }
      );
    } catch (error) {
      throw new MediaStorageError(
        `Failed to delete asset: ${id}`,
        "deleteAsset",
        error instanceof Error ? error : undefined
      );
    }
  }

  // ============================================
  // Blob Operations
  // ============================================

  /**
   * Get the binary blob data for an asset
   */
  async getBlob(assetId: string): Promise<Blob | null> {
    try {
      const result = await this.adapter.runGetRequest<StoredBlob>(this.BLOBS_STORE, assetId);
      return result?.blob || null;
    } catch (error) {
      throw new MediaStorageError(
        `Failed to get blob: ${assetId}`,
        "getBlob",
        error instanceof Error ? error : undefined
      );
    }
  }

  // ============================================
  // Folder Operations
  // ============================================

  /**
   * Save a media folder to storage
   */
  async saveFolder(folder: MediaFolder): Promise<void> {
    try {
      const storedFolder: StoredFolder = {
        id: folder.id,
        parentId: folder.parentId,
        data: folder,
      };

      await this.adapter.runTransaction([this.FOLDERS_STORE], "readwrite", (tx) => {
        tx.objectStore(this.FOLDERS_STORE).put(storedFolder);
      });
    } catch (error) {
      throw new MediaStorageError(
        `Failed to save folder: ${folder.id}`,
        "saveFolder",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all media folders
   */
  async getAllFolders(): Promise<MediaFolder[]> {
    try {
      const results = await this.adapter.runGetAllRequest<StoredFolder>(this.FOLDERS_STORE);
      return results.map((r) => r.data);
    } catch (error) {
      throw new MediaStorageError(
        "Failed to get all folders",
        "getAllFolders",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete a media folder
   */
  async deleteFolder(id: string): Promise<void> {
    try {
      await this.adapter.runTransaction([this.FOLDERS_STORE], "readwrite", (tx) => {
        tx.objectStore(this.FOLDERS_STORE).delete(id);
      });
    } catch (error) {
      throw new MediaStorageError(
        `Failed to delete folder: ${id}`,
        "deleteFolder",
        error instanceof Error ? error : undefined
      );
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Clear all data from media storage
   */
  async clear(): Promise<void> {
    try {
      await this.adapter.runTransaction(
        [this.ASSETS_STORE, this.FOLDERS_STORE, this.BLOBS_STORE],
        "readwrite",
        (tx) => {
          tx.objectStore(this.ASSETS_STORE).clear();
          tx.objectStore(this.FOLDERS_STORE).clear();
          tx.objectStore(this.BLOBS_STORE).clear();
        }
      );
    } catch (error) {
      throw new MediaStorageError(
        "Failed to clear storage",
        "clear",
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.adapter.close();
  }
}
