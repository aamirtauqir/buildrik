/**
 * Image Processor Helper Functions
 * Filter strings, export utilities, data conversion
 * @license BSD-3-Clause
 */

import type { ImageAdjustments, ImageFilters, ImageExportOptions } from "../../shared/types/media";

// ============================================
// Filter String Builders
// ============================================

/**
 * Build CSS filter string from filter config
 */
export function buildFilterString(filters: ImageFilters): string {
  const parts: string[] = [];

  if (filters.grayscale > 0) {
    parts.push(`grayscale(${filters.grayscale}%)`);
  }
  if (filters.sepia > 0) {
    parts.push(`sepia(${filters.sepia}%)`);
  }
  if (filters.blur > 0) {
    parts.push(`blur(${filters.blur}px)`);
  }
  if (filters.invert) {
    parts.push("invert(100%)");
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}

/**
 * Build CSS filter string from adjustments
 */
export function buildAdjustmentString(adj: ImageAdjustments): string {
  const parts: string[] = [];

  // Brightness: -100 to 100 maps to 0 to 200%
  if (adj.brightness !== 0) {
    parts.push(`brightness(${100 + adj.brightness}%)`);
  }

  // Contrast: -100 to 100 maps to 0 to 200%
  if (adj.contrast !== 0) {
    parts.push(`contrast(${100 + adj.contrast}%)`);
  }

  // Saturation: -100 to 100 maps to 0 to 200%
  if (adj.saturation !== 0) {
    parts.push(`saturate(${100 + adj.saturation}%)`);
  }

  // Hue rotation: 0 to 360 degrees
  if (adj.hue !== 0) {
    parts.push(`hue-rotate(${adj.hue}deg)`);
  }

  return parts.length > 0 ? parts.join(" ") : "none";
}

// ============================================
// Export Utilities
// ============================================

/**
 * Calculate export dimensions based on options
 */
export function calculateExportDimensions(
  imgWidth: number,
  imgHeight: number,
  opts: ImageExportOptions
): { width: number; height: number } {
  let width = imgWidth;
  let height = imgHeight;

  // Exact dimensions override
  if (opts.width && opts.height) {
    return { width: opts.width, height: opts.height };
  }

  // Max dimensions with aspect ratio
  if (opts.maxWidth || opts.maxHeight) {
    const aspectRatio = width / height;

    if (opts.maxWidth && width > opts.maxWidth) {
      width = opts.maxWidth;
      height = Math.round(width / aspectRatio);
    }

    if (opts.maxHeight && height > opts.maxHeight) {
      height = opts.maxHeight;
      width = Math.round(height * aspectRatio);
    }
  }

  return { width, height };
}

/**
 * Get MIME type from format
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  return mimeTypes[format] || "image/png";
}

/**
 * Convert data URL to Blob
 */
export function dataURLToBlob(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const parts = dataUrl.split(",");
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (!mimeMatch || !parts[1]) {
        throw new Error("Invalid data URL format");
      }
      const mime = mimeMatch[1];
      const data = atob(parts[1]);
      const array = new Uint8Array(data.length);

      for (let i = 0; i < data.length; i++) {
        array[i] = data.charCodeAt(i);
      }

      resolve(new Blob([array], { type: mime }));
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Failed to convert data URL to Blob"));
    }
  });
}

/**
 * Load an image from a source URL or data URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}
