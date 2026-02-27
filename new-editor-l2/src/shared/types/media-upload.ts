/**
 * Aquibra Media Upload, Library, Export & Event Types
 * Type definitions for media upload, library state, image export,
 * media events, and utility types
 *
 * @module types/media-upload
 * @license BSD-3-Clause
 */

import type { MediaAsset, MediaAssetType, MediaFolder, MediaMimeType } from "./media-assets";
import type { ImageAdjustments, ImageFilters } from "./media-image-editor";

// ============================================
// Media Library State Types
// ============================================

/**
 * Sort options for media library
 */
export type MediaSortBy = "name" | "date" | "size" | "type";

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Media library view modes
 */
export type MediaViewMode = "grid" | "list";

/**
 * Media library state
 */
export interface MediaLibraryState {
  /** All media assets */
  assets: MediaAsset[];

  /** All folders */
  folders: MediaFolder[];

  /** Currently selected asset IDs */
  selectedAssetIds: string[];

  /** Current folder ID (null for root) */
  currentFolderId: string | null;

  /** View mode */
  viewMode: MediaViewMode;

  /** Sort field */
  sortBy: MediaSortBy;

  /** Sort direction */
  sortDirection: SortDirection;

  /** Search query */
  searchQuery: string;

  /** Filter by tags */
  filterTags: string[];

  /** Filter by asset type */
  filterType: MediaAssetType | null;

  /** Is loading */
  isLoading: boolean;

  /** Has more assets to load (pagination) */
  hasMore: boolean;

  /** Current page for pagination */
  page: number;

  /** Items per page */
  pageSize: number;
}

// ============================================
// Media Upload Types
// ============================================

/**
 * Upload configuration options
 */
export interface MediaUploadConfig {
  /** Maximum file size in bytes */
  readonly maxFileSize: number;

  /** Allowed MIME types */
  readonly allowedTypes: readonly MediaMimeType[];

  /** Auto-compress images on upload */
  readonly autoCompress: boolean;

  /** Compression quality (0-1) for JPEG/WebP */
  readonly compressionQuality: number;

  /** Generate thumbnail on upload */
  readonly generateThumbnail: boolean;

  /** Thumbnail max dimension */
  readonly thumbnailSize: number;

  /** Maximum image dimension (resize larger images) */
  readonly maxImageDimension?: number;

  /** Convert to WebP on upload */
  readonly convertToWebP?: boolean;

  /** Preserve EXIF data */
  readonly preserveExif?: boolean;

  /** Allow multiple file selection */
  readonly multiple: boolean;

  /** Enable drag and drop */
  readonly enableDragDrop: boolean;
}

/**
 * Default upload configuration
 */
export const DEFAULT_UPLOAD_CONFIG: Readonly<MediaUploadConfig> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  autoCompress: true,
  compressionQuality: 0.85,
  generateThumbnail: true,
  thumbnailSize: 200,
  maxImageDimension: 4096,
  convertToWebP: false,
  preserveExif: false,
  multiple: true,
  enableDragDrop: true,
};

/**
 * Upload progress state
 */
export interface UploadProgress {
  /** File being uploaded */
  readonly fileName: string;

  /** Upload progress (0-100) */
  progress: number;

  /** Current status */
  status: "pending" | "uploading" | "processing" | "complete" | "error";

  /** Error message if failed */
  error?: string;

  /** Resulting asset ID on success */
  assetId?: string;
}

/**
 * Upload result
 */
export interface UploadResult {
  /** Upload was successful */
  readonly success: boolean;

  /** Created asset (on success) */
  readonly asset?: MediaAsset;

  /** Error message (on failure) */
  readonly error?: string;

  /** Original file name */
  readonly fileName: string;
}

// ============================================
// Export Types
// ============================================

/**
 * Image export format
 */
export type ImageExportFormat = "jpeg" | "png" | "webp" | "avif";

/**
 * Image export options
 */
export interface ImageExportOptions {
  /** Export format */
  readonly format: ImageExportFormat;

  /** Quality (0-1 for lossy formats) */
  readonly quality: number;

  /** Maximum width (maintains aspect ratio) */
  readonly maxWidth?: number;

  /** Maximum height (maintains aspect ratio) */
  readonly maxHeight?: number;

  /** Exact width (ignores aspect ratio if both set) */
  readonly width?: number;

  /** Exact height (ignores aspect ratio if both set) */
  readonly height?: number;

  /** Background color for transparent images */
  readonly backgroundColor?: string;

  /** Include metadata in export */
  readonly includeMetadata?: boolean;

  /** Progressive encoding (for JPEG) */
  readonly progressive?: boolean;
}

/**
 * Default export options
 */
export const DEFAULT_EXPORT_OPTIONS: Readonly<ImageExportOptions> = {
  format: "png",
  quality: 0.92,
  includeMetadata: false,
  progressive: true,
};

/**
 * Export result
 */
export interface ImageExportResult {
  /** Export was successful */
  readonly success: boolean;

  /** Exported image as data URL */
  readonly dataUrl?: string;

  /** Exported image as Blob */
  readonly blob?: Blob;

  /** Exported dimensions */
  readonly width?: number;
  readonly height?: number;

  /** File size in bytes */
  readonly size?: number;

  /** Error message on failure */
  readonly error?: string;
}

// ============================================
// Media Manager Events
// ============================================

/**
 * Media manager event types
 */
export type MediaEventType =
  | "asset:created"
  | "asset:updated"
  | "asset:deleted"
  | "asset:selected"
  | "folder:created"
  | "folder:updated"
  | "folder:deleted"
  | "upload:start"
  | "upload:progress"
  | "upload:complete"
  | "upload:error";

/**
 * Media event payloads
 */
export type MediaEventPayload = {
  "asset:created": MediaAsset;
  "asset:updated": { asset: MediaAsset; changes: Partial<MediaAsset> };
  "asset:deleted": { id: string };
  "asset:selected": { ids: string[] };
  "folder:created": MediaFolder;
  "folder:updated": { folder: MediaFolder; changes: Partial<MediaFolder> };
  "folder:deleted": { id: string };
  "upload:start": { fileName: string };
  "upload:progress": UploadProgress;
  "upload:complete": UploadResult;
  "upload:error": { fileName: string; error: string };
};

// ============================================
// Media Utility Types
// ============================================

/**
 * Image dimensions
 */
export interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * Aspect ratio preset
 */
export interface AspectRatioPreset {
  readonly id: string;
  readonly label: string;
  readonly ratio: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Common aspect ratio presets
 */
export const ASPECT_RATIO_PRESETS: readonly AspectRatioPreset[] = [
  { id: "free", label: "Free", ratio: 0, width: 0, height: 0 },
  { id: "1:1", label: "Square (1:1)", ratio: 1, width: 1, height: 1 },
  { id: "4:3", label: "Standard (4:3)", ratio: 4 / 3, width: 4, height: 3 },
  { id: "3:2", label: "Photo (3:2)", ratio: 3 / 2, width: 3, height: 2 },
  { id: "16:9", label: "Widescreen (16:9)", ratio: 16 / 9, width: 16, height: 9 },
  { id: "21:9", label: "Ultrawide (21:9)", ratio: 21 / 9, width: 21, height: 9 },
  { id: "9:16", label: "Portrait (9:16)", ratio: 9 / 16, width: 9, height: 16 },
  { id: "4:5", label: "Instagram (4:5)", ratio: 4 / 5, width: 4, height: 5 },
  { id: "2:3", label: "Pinterest (2:3)", ratio: 2 / 3, width: 2, height: 3 },
] as const;

/**
 * Filter preset
 */
export interface FilterPreset {
  readonly id: string;
  readonly name: string;
  readonly filters: Partial<ImageFilters>;
  readonly adjustments: Partial<ImageAdjustments>;
  readonly thumbnail?: string;
}
