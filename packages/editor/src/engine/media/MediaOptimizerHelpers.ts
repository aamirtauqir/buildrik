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
 * Convert data URL to Blob.
 *
 * Decoded here rather than through `fetch(dataUrl)`. A data: URL is bytes the
 * page already holds, but fetching one is still a network request as far as the
 * browser is concerned, so the dashboard's CSP refused it — "Fetch API cannot
 * load data:image/webp", observed live — and image optimization failed with
 * nothing on screen to say why. Decoding needs no permission from anybody.
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const comma = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || comma === -1) {
    throw new Error("Not a data URL");
  }
  const meta = dataUrl.slice(5, comma);
  const body = dataUrl.slice(comma + 1);
  const mimeType = meta.split(";")[0] || "application/octet-stream";

  if (!meta.includes("base64")) {
    return new Blob([decodeURIComponent(body)], { type: mimeType });
  }
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
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
 * Get compression savings as percentage
 */
export function getCompressionSavings(originalSize: number, optimizedSize: number): string {
  if (originalSize <= 0) return "0%";
  const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
  return `${savings}%`;
}
