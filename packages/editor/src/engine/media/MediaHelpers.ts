/**
 * Media Helper Functions
 * File reading, validation, and thumbnail generation
 * @license BSD-3-Clause
 */

import { MEDIA_SIZE_LIMITS, getMaxFileSize, isAllowedMimeType } from "../../shared/constants/media";

/**
 * Validate a file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isAllowedMimeType(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }

  const maxSize = getMaxFileSize(file.type);
  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max: ${Math.round(maxSize / 1024 / 1024)}MB` };
  }

  return { valid: true };
}

/**
 * Read a file as a data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get dimensions of an image file
 */
export async function getMediaDimensions(
  file: File,
  src: string
): Promise<{ width: number; height: number } | undefined> {
  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(undefined);
      img.src = src;
    });
  }
  return undefined;
}

/**
 * Generate a thumbnail from an image source
 */
export async function generateThumbnail(
  src: string,
  dimensions?: { width: number; height: number }
): Promise<string | undefined> {
  if (!dimensions) return undefined;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxSize = MEDIA_SIZE_LIMITS.THUMBNAIL_SIZE;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(undefined);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(undefined);
    img.src = src;
  });
}

/**
 * Generate a unique media ID
 */
export function generateMediaId(): string {
  return `media_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
