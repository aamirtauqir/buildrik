/**
 * Media Storage Types and Error Classes
 * @license BSD-3-Clause
 */

import type { MediaAsset, MediaFolder } from "../../shared/types/media";

// ============================================
// Error Classes
// ============================================

/**
 * Custom error class for media storage operations
 */
export class MediaStorageError extends Error {
  readonly operation: string;
  readonly cause?: Error;

  constructor(message: string, operation: string, cause?: Error) {
    super(message);
    this.name = "MediaStorageError";
    this.operation = operation;
    this.cause = cause;
  }
}

// ============================================
// Stored Record Types
// ============================================

/** Stored asset record in IndexedDB */
export interface StoredAsset {
  readonly id: string;
  readonly type: string;
  readonly folderId: string | null;
  readonly createdAt: string;
  readonly tags: readonly string[];
  readonly data: MediaAsset;
}

/** Stored folder record in IndexedDB */
export interface StoredFolder {
  readonly id: string;
  readonly parentId: string | null;
  readonly data: MediaFolder;
}

/** Stored blob record in IndexedDB */
export interface StoredBlob {
  readonly assetId: string;
  readonly blob: Blob;
}
