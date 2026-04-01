/**
 * Aquibra Image Processor
 * Canvas-based image editing operations
 *
 * @module engine/media/ImageProcessor
 * @license BSD-3-Clause
 */

import type {
  CropConfig,
  FlipConfig,
  ImageAdjustments,
  ImageEditState,
  ImageExportOptions,
  ImageExportResult,
  ImageFilters,
  RotationDegrees,
} from "../../shared/types/media";
import {
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_IMAGE_FILTERS,
  DEFAULT_EXPORT_OPTIONS,
} from "../../shared/types/media";
import {
  buildFilterString,
  buildAdjustmentString,
  calculateExportDimensions,
  getMimeType,
  dataURLToBlob,
  loadImage,
} from "./ImageProcessorHelpers";

// ============================================
// ImageProcessor Class
// ============================================

/**
 * Canvas-based image processor
 *
 * Provides:
 * - Crop, rotate, flip operations
 * - Filter effects (grayscale, sepia, blur, etc.)
 * - Color adjustments (brightness, contrast, saturation, etc.)
 * - Export to various formats
 */
export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas 2D context");
    this.ctx = ctx;
  }

  // ============================================
  // Basic Operations
  // ============================================

  /**
   * Crop an image to specified region
   */
  async crop(src: string, config: CropConfig): Promise<string> {
    const img = await loadImage(src);

    // Convert percentage to pixels if needed
    const x = config.unit === "percent" ? (config.x / 100) * img.width : config.x;
    const y = config.unit === "percent" ? (config.y / 100) * img.height : config.y;
    const width = config.unit === "percent" ? (config.width / 100) * img.width : config.width;
    const height = config.unit === "percent" ? (config.height / 100) * img.height : config.height;

    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

    return this.canvas.toDataURL("image/png");
  }

  /**
   * Rotate an image by specified degrees (clockwise)
   */
  async rotate(src: string, degrees: RotationDegrees): Promise<string> {
    const img = await loadImage(src);

    // Swap dimensions for 90/270 degree rotations
    const isVertical = degrees === 90 || degrees === 270;
    this.canvas.width = isVertical ? img.height : img.width;
    this.canvas.height = isVertical ? img.width : img.height;

    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.rotate((degrees * Math.PI) / 180);
    this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
    this.ctx.restore();

    return this.canvas.toDataURL("image/png");
  }

  /**
   * Flip an image horizontally and/or vertically
   */
  async flip(src: string, config: FlipConfig): Promise<string> {
    const img = await loadImage(src);

    this.canvas.width = img.width;
    this.canvas.height = img.height;

    this.ctx.save();
    this.ctx.translate(config.horizontal ? img.width : 0, config.vertical ? img.height : 0);
    this.ctx.scale(config.horizontal ? -1 : 1, config.vertical ? -1 : 1);
    this.ctx.drawImage(img, 0, 0);
    this.ctx.restore();

    return this.canvas.toDataURL("image/png");
  }

  /**
   * Resize an image to specified dimensions
   */
  async resize(src: string, width: number, height: number): Promise<string> {
    const img = await loadImage(src);

    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(img, 0, 0, width, height);

    return this.canvas.toDataURL("image/png");
  }

  // ============================================
  // Filters & Adjustments
  // ============================================

  /**
   * Apply CSS filters to an image
   */
  async applyFilters(src: string, filters: Partial<ImageFilters>): Promise<string> {
    const img = await loadImage(src);

    this.canvas.width = img.width;
    this.canvas.height = img.height;

    const filterStr = buildFilterString({ ...DEFAULT_IMAGE_FILTERS, ...filters });
    this.ctx.filter = filterStr;
    this.ctx.drawImage(img, 0, 0);
    this.ctx.filter = "none";

    return this.canvas.toDataURL("image/png");
  }

  /**
   * Apply color adjustments to an image
   */
  async applyAdjustments(src: string, adjustments: Partial<ImageAdjustments>): Promise<string> {
    const img = await loadImage(src);

    this.canvas.width = img.width;
    this.canvas.height = img.height;

    const adj = { ...DEFAULT_IMAGE_ADJUSTMENTS, ...adjustments };
    const filterStr = buildAdjustmentString(adj);
    this.ctx.filter = filterStr;
    this.ctx.drawImage(img, 0, 0);
    this.ctx.filter = "none";

    return this.canvas.toDataURL("image/png");
  }

  // ============================================
  // Combined Processing
  // ============================================

  /**
   * Apply all edits from an ImageEditState
   */
  async applyEditState(state: ImageEditState): Promise<string> {
    let result = state.originalSrc;

    if (state.crop) {
      result = await this.crop(result, state.crop);
    }

    if (state.rotation !== 0) {
      result = await this.rotate(result, state.rotation);
    }

    if (state.flip.horizontal || state.flip.vertical) {
      result = await this.flip(result, state.flip);
    }

    const hasFilters = Object.entries(state.filters).some(
      ([key, value]) => value !== DEFAULT_IMAGE_FILTERS[key as keyof ImageFilters]
    );
    if (hasFilters) {
      result = await this.applyFilters(result, state.filters);
    }

    const hasAdjustments = Object.entries(state.adjustments).some(
      ([key, value]) => value !== DEFAULT_IMAGE_ADJUSTMENTS[key as keyof ImageAdjustments]
    );
    if (hasAdjustments) {
      result = await this.applyAdjustments(result, state.adjustments);
    }

    return result;
  }

  // ============================================
  // Export
  // ============================================

  /**
   * Export an image with specified options
   */
  async export(src: string, options: Partial<ImageExportOptions> = {}): Promise<ImageExportResult> {
    const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };

    try {
      const img = await loadImage(src);
      const { width, height } = calculateExportDimensions(img.width, img.height, opts);

      this.canvas.width = width;
      this.canvas.height = height;

      if (opts.backgroundColor) {
        this.ctx.fillStyle = opts.backgroundColor;
        this.ctx.fillRect(0, 0, width, height);
      }

      this.ctx.drawImage(img, 0, 0, width, height);

      const mimeType = getMimeType(opts.format);
      const dataUrl = this.canvas.toDataURL(mimeType, opts.quality);
      const blob = await dataURLToBlob(dataUrl);

      return {
        success: true,
        dataUrl,
        blob,
        width,
        height,
        size: blob.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Export failed",
      };
    }
  }
}
