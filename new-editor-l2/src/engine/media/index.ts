/**
 * Aquibra Media Module
 * Barrel exports for media management system
 *
 * @module engine/media
 * @license BSD-3-Clause
 */

// Core classes
export { MediaManager } from "./MediaManager";
export { MediaStorage, MediaStorageError } from "./MediaStorage";
export { ImageProcessor } from "./ImageProcessor";
export { MediaOptimizer, formatBytes, getCompressionSavings } from "./MediaOptimizer";
export type { OptimizationOptions, OptimizationResult, FormatSupport } from "./MediaOptimizer";

// Re-export types from types/media.ts for convenience
export type {
  // Asset types
  MediaAsset,
  MediaAssetType,
  MediaFolder,
  MediaMetadata,
  MediaMimeType,
  ImageMimeType,
  VideoMimeType,
  AudioMimeType,
  // Image editing types
  CropConfig,
  FlipConfig,
  ImageFilters,
  ImageAdjustments,
  ImageEditOperation,
  ImageEditHistoryEntry,
  ImageEditState,
  RotationDegrees,
  // Icon types
  IconLibrary,
  IconConfig,
  IconCategory,
  IconPickerState,
  // Library state types
  MediaLibraryState,
  MediaSortBy,
  SortDirection,
  MediaViewMode,
  // Upload types
  MediaUploadConfig,
  UploadProgress,
  UploadResult,
  // Export types
  ImageExportFormat,
  ImageExportOptions,
  ImageExportResult,
  // Event types
  MediaEventType,
  MediaEventPayload,
  // Utility types
  ImageDimensions,
  AspectRatioPreset,
  FilterPreset,
} from "../../shared/types/media";

// Re-export constants
export {
  MEDIA_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
  ALL_ALLOWED_MIME_TYPES,
  MEDIA_EXTENSIONS,
  MEDIA_EVENTS,
  MEDIA_DEFAULTS,
  isAllowedImageType,
  isAllowedVideoType,
  isAllowedAudioType,
  isAllowedMimeType,
  getMaxFileSize,
  getAssetTypeFromMime,
} from "../../shared/constants/media";

// Re-export defaults from types
export {
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_IMAGE_FILTERS,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_EXPORT_OPTIONS,
  ASPECT_RATIO_PRESETS,
} from "../../shared/types/media";
