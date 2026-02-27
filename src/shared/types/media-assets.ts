/**
 * Aquibra Media Asset Types
 * Core type definitions for media assets, MIME types, metadata, and folders
 *
 * @module types/media-assets
 * @license BSD-3-Clause
 */

// ============================================
// Media Asset Types
// ============================================

/**
 * Supported media asset types
 */
export type MediaAssetType = "image" | "video" | "audio" | "icon" | "svg";

/**
 * Supported image MIME types
 */
export type ImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "image/svg+xml"
  | "image/avif";

/**
 * Supported video MIME types
 */
export type VideoMimeType = "video/mp4" | "video/webm" | "video/ogg" | "video/quicktime";

/**
 * Supported audio MIME types
 */
export type AudioMimeType = "audio/mpeg" | "audio/wav" | "audio/ogg" | "audio/webm" | "audio/aac";

/**
 * All supported media MIME types
 */
export type MediaMimeType = ImageMimeType | VideoMimeType | AudioMimeType;

/**
 * Extended metadata for media assets
 */
export interface MediaMetadata {
  /** Alt text for accessibility */
  readonly alt?: string;

  /** Caption or description */
  readonly caption?: string;

  /** Image focal point (0-1 range) */
  readonly focalPoint?: {
    readonly x: number;
    readonly y: number;
  };

  /** Video/audio duration in seconds */
  readonly duration?: number;

  /** Color palette extracted from image */
  readonly colors?: readonly string[];

  /** EXIF data for photos */
  readonly exif?: {
    readonly camera?: string;
    readonly lens?: string;
    readonly iso?: number;
    readonly aperture?: string;
    readonly shutterSpeed?: string;
    readonly dateTaken?: string;
    readonly location?: {
      readonly latitude: number;
      readonly longitude: number;
    };
  };

  /** AI-generated description */
  readonly aiDescription?: string;

  /** AI-generated tags */
  readonly aiTags?: readonly string[];
}

/**
 * Main media asset interface
 */
export interface MediaAsset {
  /** Unique identifier */
  readonly id: string;

  /** Asset type */
  readonly type: MediaAssetType;

  /** Display name */
  name: string;

  /** Original file name */
  readonly originalName: string;

  /** Asset source (Base64, blob URL, or remote URL) */
  src: string;

  /** Compressed thumbnail for preview */
  thumbnailSrc?: string;

  /** MIME type of the asset */
  readonly mimeType: string;

  /** File size in bytes */
  readonly size: number;

  /** Width in pixels (for images/videos) */
  readonly width?: number;

  /** Height in pixels (for images/videos) */
  readonly height?: number;

  /** User-defined tags for organization */
  tags: string[];

  /** Folder ID for organization */
  folderId?: string;

  /** Creation timestamp (ISO 8601) */
  readonly createdAt: string;

  /** Last update timestamp (ISO 8601) */
  updatedAt: string;

  /** Extended metadata */
  metadata?: MediaMetadata;
}

/**
 * Media folder for organization
 */
export interface MediaFolder {
  /** Unique identifier */
  readonly id: string;

  /** Folder name */
  name: string;

  /** Parent folder ID (null for root) */
  parentId: string | null;

  /** Folder color for visual organization */
  color?: string;

  /** Folder icon */
  icon?: string;

  /** Creation timestamp (ISO 8601) */
  readonly createdAt: string;

  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}
