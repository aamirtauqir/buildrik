/**
 * Media Helper Functions
 * File reading, validation, and thumbnail generation
 * @license BSD-3-Clause
 */

import { MEDIA_SIZE_LIMITS, getMaxFileSize, isAllowedMimeType } from "../../shared/constants/media";
import { formatBytes } from "../../shared/utils/helpers/number";

/**
 * Validate a file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!isAllowedMimeType(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type}` };
  }

  const maxSize = getMaxFileSize(file.type);
  if (file.size > maxSize) {
    // Board 145:148 names BOTH numbers: "Upload failed — file is 24 MB, limit
    // is 10 MB". The old copy ("File too large. Max: 10MB") named only the
    // limit, so the one fact the user needs to act on — how far over they are —
    // was the fact it left out.
    return {
      valid: false,
      error: `Upload failed — file is ${formatBytes(file.size, 0)}, limit is ${formatBytes(maxSize, 0)}`,
    };
  }

  return { valid: true };
}

/**
 * Validate a src URL for safety. Blocks dangerous schemes (javascript:,
 * vbscript:, file:, about:) and characters that could break out of url(...)
 * in CSS or attribute contexts. Allows http/https, blob:, data:image, and
 * relative URLs (no scheme).
 */
export function isSafeSrc(src: unknown): boolean {
  if (!src || typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  // Reject characters that break CSS url(...) parsing or quote attributes
  if (/[)"']/.test(trimmed)) return false;
  // Check scheme if present
  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    // Explicit blocklist of dangerous schemes
    if (
      scheme === "javascript" ||
      scheme === "vbscript" ||
      scheme === "file" ||
      scheme === "about"
    ) {
      return false;
    }
    // data: URLs only allowed for images
    if (scheme === "data") {
      return /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);/i.test(trimmed);
    }
    // http/https/blob and any other scheme: allow (rely on URL semantics)
    return true;
  }
  // No scheme = relative URL or bare filename — safe
  return true;
}

/**
 * Sniff the actual MIME type from file content magic bytes. The browser-supplied
 * `file.type` is set from the file extension and can be spoofed (e.g. SVG renamed
 * to .png served as image/png). Returns the detected MIME or null if unknown.
 *
 * Detects: image/svg+xml, image/png, image/jpeg, image/gif, image/webp.
 */
export async function sniffMimeType(file: File): Promise<string | null> {
  const head = await file.slice(0, 256).arrayBuffer();
  const bytes = new Uint8Array(head);

  // SVG: starts with "<?xml" or "<svg" (allow leading whitespace + BOM)
  const text = new TextDecoder().decode(bytes).trimStart().toLowerCase();
  if (text.startsWith("<?xml") || text.startsWith("<svg") || /^<!doctype svg/i.test(text)) {
    return "image/svg+xml";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // GIF: "GIF87a" or "GIF89a"
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
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
