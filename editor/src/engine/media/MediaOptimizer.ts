/**
 * Media Optimizer
 * Image format conversion, compression, and optimization
 * @license BSD-3-Clause
 */

import type { ImageExportFormat } from "../../shared/types/media";
import {
  type OptimizationOptions,
  type OptimizationResult,
  type FormatSupport,
  loadImage,
  dataUrlToBlob,
  getMimeType,
  estimateSize,
  formatBytes,
  getCompressionSavings,
} from "./MediaOptimizerHelpers";

// Re-export types and utilities
export type { OptimizationOptions, OptimizationResult, FormatSupport };
export { formatBytes, getCompressionSavings };

// ============================================================================
// MEDIA OPTIMIZER CLASS
// ============================================================================

export class MediaOptimizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private formatSupport: FormatSupport | null = null;

  constructor() {
    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to create canvas context");
    }
    this.ctx = ctx;
  }

  /**
   * Check browser support for various formats
   */
  async checkFormatSupport(): Promise<FormatSupport> {
    if (this.formatSupport) return this.formatSupport;

    const testCanvas = document.createElement("canvas");
    testCanvas.width = 1;
    testCanvas.height = 1;

    this.formatSupport = {
      webp: testCanvas.toDataURL("image/webp").startsWith("data:image/webp"),
      avif: testCanvas.toDataURL("image/avif").startsWith("data:image/avif"),
      jpeg: true,
      png: true,
    };

    return this.formatSupport;
  }

  /**
   * Optimize an image with given options
   */
  async optimize(imageSrc: string, options: OptimizationOptions): Promise<OptimizationResult> {
    try {
      const img = await loadImage(imageSrc);
      const originalSize = await estimateSize(imageSrc);

      // Calculate dimensions
      let { width, height } = img;
      if (options.maxWidth && width > options.maxWidth) {
        const ratio = options.maxWidth / width;
        width = options.maxWidth;
        height = Math.round(height * ratio);
      }
      if (options.maxHeight && height > options.maxHeight) {
        const ratio = options.maxHeight / height;
        height = options.maxHeight;
        width = Math.round(width * ratio);
      }

      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx.clearRect(0, 0, width, height);

      // Handle transparency
      if (!options.preserveTransparency && options.format === "jpeg") {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0, 0, width, height);
      }

      this.ctx.drawImage(img, 0, 0, width, height);

      const mimeType = getMimeType(options.format);
      const dataUrl = this.canvas.toDataURL(mimeType, options.quality);
      const blob = await dataUrlToBlob(dataUrl);
      const optimizedSize = blob.size;

      return {
        success: true,
        dataUrl,
        blob,
        originalSize,
        optimizedSize,
        compressionRatio: originalSize > 0 ? optimizedSize / originalSize : 1,
        dimensions: { width, height },
      };
    } catch (error) {
      return {
        success: false,
        originalSize: 0,
        error: error instanceof Error ? error.message : "Optimization failed",
      };
    }
  }

  /**
   * Convert image to WebP format
   */
  async convertToWebP(imageSrc: string, quality = 0.85): Promise<OptimizationResult> {
    const support = await this.checkFormatSupport();
    if (!support.webp) {
      return {
        success: false,
        originalSize: 0,
        error: "WebP format not supported in this browser",
      };
    }

    return this.optimize(imageSrc, { format: "webp", quality, preserveTransparency: true });
  }

  /**
   * Compress JPEG with progressive encoding simulation
   */
  async compressJpeg(imageSrc: string, quality = 0.85): Promise<OptimizationResult> {
    return this.optimize(imageSrc, { format: "jpeg", quality, preserveTransparency: false });
  }

  /**
   * Preview compression at different quality levels
   */
  async previewCompression(
    imageSrc: string,
    format: ImageExportFormat = "jpeg"
  ): Promise<Array<{ quality: number; result: OptimizationResult }>> {
    const qualities = [0.3, 0.5, 0.7, 0.85, 0.95];
    const results: Array<{ quality: number; result: OptimizationResult }> = [];

    for (const quality of qualities) {
      const result = await this.optimize(imageSrc, {
        format,
        quality,
        preserveTransparency: format !== "jpeg",
      });
      results.push({ quality, result });
    }

    return results;
  }

  /**
   * Batch optimize multiple images
   */
  async batchOptimize(
    images: Array<{ id: string; src: string }>,
    options: OptimizationOptions,
    onProgress?: (id: string, progress: number) => void
  ): Promise<Array<{ id: string; result: OptimizationResult }>> {
    const results: Array<{ id: string; result: OptimizationResult }> = [];

    for (let i = 0; i < images.length; i++) {
      const { id, src } = images[i];
      onProgress?.(id, (i / images.length) * 100);
      const result = await this.optimize(src, options);
      results.push({ id, result });
    }

    return results;
  }

  /**
   * Get best format for browser and image type
   */
  async getBestFormat(hasTransparency: boolean): Promise<ImageExportFormat> {
    const support = await this.checkFormatSupport();

    if (hasTransparency) {
      return support.webp ? "webp" : "png";
    }

    return support.webp ? "webp" : "jpeg";
  }
}

export default MediaOptimizer;
