/**
 * Aquibra Media System Types
 * Type definitions for media assets, image editing, and icon management
 *
 * @module types/media
 * @license BSD-3-Clause
 */

// ============================================
// Media Asset Types
// ============================================

/**
 * Supported media asset types
 */
export type MediaAssetType = "image" | "video" | "audio" | "icon" | "svg" | "font";

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

// ============================================
// Image Editor Types
// ============================================

/**
 * Crop configuration
 */
export interface CropConfig {
  /** X position (pixels or percentage) */
  readonly x: number;

  /** Y position (pixels or percentage) */
  readonly y: number;

  /** Crop width */
  readonly width: number;

  /** Crop height */
  readonly height: number;

  /** Aspect ratio constraint (e.g., 16/9, 4/3, 1) */
  readonly aspectRatio?: number;

  /** Unit type */
  readonly unit: "pixels" | "percent";
}

/**
 * Rotation values (clockwise degrees)
 */
export type RotationDegrees = 0 | 90 | 180 | 270;

/**
 * Flip configuration
 */
export interface FlipConfig {
  /** Flip horizontally */
  readonly horizontal: boolean;

  /** Flip vertically */
  readonly vertical: boolean;
}

/**
 * Image filter presets
 */
export interface ImageFilters {
  /** Grayscale (0-100) */
  readonly grayscale: number;

  /** Sepia (0-100) */
  readonly sepia: number;

  /** Blur in pixels (0-20) */
  readonly blur: number;

  /** Sharpen intensity (0-100) */
  readonly sharpen: number;

  /** Invert colors (true/false) */
  readonly invert: boolean;
}

/**
 * Image color adjustments
 */
export interface ImageAdjustments {
  /** Brightness (-100 to 100) */
  readonly brightness: number;

  /** Contrast (-100 to 100) */
  readonly contrast: number;

  /** Saturation (-100 to 100) */
  readonly saturation: number;

  /** Hue rotation (0 to 360) */
  readonly hue: number;

  /** Exposure (-100 to 100) */
  readonly exposure: number;

  /** Highlights (-100 to 100) */
  readonly highlights: number;

  /** Shadows (-100 to 100) */
  readonly shadows: number;

  /** Temperature (-100 to 100, cool to warm) */
  readonly temperature: number;

  /** Tint (-100 to 100, green to magenta) */
  readonly tint: number;

  /** Vibrance (-100 to 100) */
  readonly vibrance: number;
}

/**
 * Default image adjustments
 */
export const DEFAULT_IMAGE_ADJUSTMENTS: Readonly<ImageAdjustments> = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
};

/**
 * Default image filters
 */
export const DEFAULT_IMAGE_FILTERS: Readonly<ImageFilters> = {
  grayscale: 0,
  sepia: 0,
  blur: 0,
  sharpen: 0,
  invert: false,
};

/**
 * Image edit operation types
 */
export type ImageEditOperation =
  | { readonly type: "crop"; readonly config: CropConfig }
  | { readonly type: "rotate"; readonly degrees: RotationDegrees }
  | { readonly type: "flip"; readonly config: FlipConfig }
  | { readonly type: "filters"; readonly filters: Partial<ImageFilters> }
  | { readonly type: "adjustments"; readonly adjustments: Partial<ImageAdjustments> }
  | { readonly type: "resize"; readonly width: number; readonly height: number };

/**
 * Image edit history entry
 */
export interface ImageEditHistoryEntry {
  /** Unique identifier */
  readonly id: string;

  /** Timestamp of the edit */
  readonly timestamp: string;

  /** Operation performed */
  readonly operation: ImageEditOperation;

  /** Image data URL after this operation */
  readonly resultSrc: string;
}

/**
 * Image editor state
 */
export interface ImageEditState {
  /** Original image source (never modified) */
  readonly originalSrc: string;

  /** Current edited image source */
  currentSrc: string;

  /** Current crop configuration */
  crop: CropConfig | null;

  /** Current rotation */
  rotation: RotationDegrees;

  /** Current flip state */
  flip: FlipConfig;

  /** Current filters */
  filters: ImageFilters;

  /** Current adjustments */
  adjustments: ImageAdjustments;

  /** Edit history for undo */
  readonly history: readonly ImageEditHistoryEntry[];

  /** Current position in history (for redo) */
  historyIndex: number;

  /** Is currently processing */
  isProcessing: boolean;

  /** Zoom level for preview (1 = 100%) */
  previewZoom: number;

  /** Preview pan offset */
  previewOffset: {
    x: number;
    y: number;
  };
}

// ============================================
// Icon Picker Types
// ============================================

/**
 * Icon library sources
 */
export type IconLibrary = "lucide" | "heroicons" | "phosphor" | "tabler" | "custom";

/**
 * Icon configuration for elements
 */
export interface IconConfig {
  /** Icon library source */
  readonly library: IconLibrary;

  /** Icon name from the library */
  readonly name: string;

  /** Icon size in pixels */
  size: number;

  /** Icon color (CSS color value) */
  color: string;

  /** Stroke width (1-3 for stroke-based icons) */
  strokeWidth: number;

  /** Fill color (for filled variants) */
  fill?: string;

  /** Custom CSS class */
  className?: string;

  /** Rotation in degrees */
  rotation?: number;

  /** Flip horizontal */
  flipX?: boolean;

  /** Flip vertical */
  flipY?: boolean;
}

/**
 * Icon category for organization
 */
export interface IconCategory {
  /** Category ID */
  readonly id: string;

  /** Category display name */
  readonly label: string;

  /** Category description */
  readonly description?: string;

  /** Icon names in this category */
  readonly icons: readonly string[];
}

/**
 * Icon picker state
 */
export interface IconPickerState {
  /** Search query */
  searchQuery: string;

  /** Selected category */
  selectedCategory: string | null;

  /** Recently used icons */
  recentIcons: readonly string[];

  /** Favorite icons */
  favoriteIcons: readonly string[];

  /** Selected icon library */
  selectedLibrary: IconLibrary;

  /** View mode */
  viewMode: "grid" | "list";

  /** Icon size for preview */
  previewSize: number;
}

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
