/**
 * Aquibra Image Editor Types
 * Type definitions for image editing: crop, rotation, flip, filters,
 * adjustments, edit operations, and editor state
 *
 * @module types/media-image-editor
 * @license BSD-3-Clause
 */

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
