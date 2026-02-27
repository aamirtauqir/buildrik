/**
 * Media Optimizer Helper Functions
 * @license BSD-3-Clause
 */

import type { ImageExportFormat } from "../../shared/types/media";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OptimizationOptions {
  format: ImageExportFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  preserveTransparency?: boolean;
}

export interface OptimizationResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  originalSize: number;
  optimizedSize?: number;
  compressionRatio?: number;
  dimensions?: { width: number; height: number };
  error?: string;
}

export interface FormatSupport {
  webp: boolean;
  avif: boolean;
  jpeg: boolean;
  png: boolean;
}

// ============================================================================
// IMAGE UTILITIES
// ============================================================================

/**
 * Load image from source
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

/**
 * Convert data URL to Blob
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Get MIME type for format
 */
export function getMimeType(format: ImageExportFormat): string {
  const mimeTypes: Record<ImageExportFormat, string> = {
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  return mimeTypes[format];
}

/**
 * Estimate file size from data URL
 */
export async function estimateSize(dataUrl: string): Promise<number> {
  if (dataUrl.startsWith("data:")) {
    const base64Length = dataUrl.split(",")[1]?.length || 0;
    return Math.round((base64Length * 3) / 4);
  }

  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return blob.size;
  } catch {
    return 0;
  }
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get compression savings as percentage
 */
export function getCompressionSavings(originalSize: number, optimizedSize: number): string {
  if (originalSize <= 0) return "0%";
  const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
  return `${savings}%`;
}
