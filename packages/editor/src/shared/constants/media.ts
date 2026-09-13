/**
 * Aquibra Media Constants
 * Centralized constants for media management
 *
 * @module constants/media
 * @license BSD-3-Clause
 */

import { formatBytes } from "../utils/helpers/number";

// ============================================
// File Size Limits
// ============================================

/**
 * Maximum file size limits in bytes
 */
export const MEDIA_SIZE_LIMITS = {
  /** Maximum image file size (10MB) */
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  /** Maximum video file size (100MB) */
  MAX_VIDEO_SIZE: 100 * 1024 * 1024,
  /** Maximum audio file size (50MB) */
  MAX_AUDIO_SIZE: 50 * 1024 * 1024,
  /** Maximum SVG file size (1MB) */
  MAX_SVG_SIZE: 1 * 1024 * 1024,
  /** Maximum font file size (5MB) — a full variable family is ~1MB. */
  MAX_FONT_SIZE: 5 * 1024 * 1024,
  /** Thumbnail max dimension in pixels */
  THUMBNAIL_SIZE: 200,
  /** Maximum image dimension (width or height) */
  MAX_IMAGE_DIMENSION: 4096,
} as const;

// ============================================
// Allowed MIME Types
// ============================================

/**
 * Allowed MIME types for media uploads
 */
export const ALLOWED_MIME_TYPES = {
  /** Allowed image MIME types */
  IMAGE: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/avif",
  ] as const,
  /** Allowed video MIME types */
  VIDEO: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"] as const,
  /** Allowed audio MIME types */
  AUDIO: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/aac"] as const,
  /** Allowed font MIME types. The engine, the server enum and the library's
   *  `fnt` bucket all had a font type; the upload gate never let one in, so
   *  Clone screen 3696:21550 ("Selected · Inter-Var.woff2") was unreachable
   *  and the file input's `.woff2` accept was a promise nothing kept. */
  FONT: ["font/woff2", "font/woff", "font/ttf", "font/otf"] as const,
} as const;

/**
 * All allowed MIME types combined
 */
export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.IMAGE,
  ...ALLOWED_MIME_TYPES.VIDEO,
  ...ALLOWED_MIME_TYPES.AUDIO,
  ...ALLOWED_MIME_TYPES.FONT,
] as const;

// ============================================
// File Extensions
// ============================================

/**
 * File extension mappings
 */
export const MEDIA_EXTENSIONS = {
  IMAGE: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"] as const,
  VIDEO: [".mp4", ".webm", ".ogv", ".mov"] as const,
  AUDIO: [".mp3", ".wav", ".ogg", ".webm", ".aac"] as const,
  FONT: [".woff2", ".woff", ".ttf", ".otf"] as const,
} as const;

/**
 * The formats the library takes, spelled for a person — Clone 3397:18137's
 * drop-zone line and 3437:36027's drawer footer both read it. Derived from
 * `MEDIA_EXTENSIONS`, so a format added there reaches every line that names
 * the list; the drawer used to carry its own hand-typed copy. Audio is left
 * out on purpose: the library has no audio bucket and the server has no
 * schema for it (`toServerAssetType` → null), so naming it would promise a
 * kind the UI cannot show.
 */
const FORMAT_LABEL: Record<string, string> = { webp: "WebP", webm: "WebM" };
export const MEDIA_ACCEPTED_FORMATS_LABEL = [
  ...MEDIA_EXTENSIONS.IMAGE,
  ...MEDIA_EXTENSIONS.VIDEO,
  ...MEDIA_EXTENSIONS.FONT,
]
  .map((ext) => ext.slice(1))
  .filter((ext) => ext !== "jpeg")
  .map((ext) => FORMAT_LABEL[ext] ?? ext.toUpperCase())
  .join(" · ");

/**
 * The code's own per-type limits, one line — the Clone's "up to 50 MB per
 * file" is the board's sample, not a number this code has.
 */
export const MEDIA_SIZE_LIMITS_LABEL =
  `up to ${formatBytes(MEDIA_SIZE_LIMITS.MAX_IMAGE_SIZE, 0)} per image · ` +
  `${formatBytes(MEDIA_SIZE_LIMITS.MAX_SVG_SIZE, 0)} per SVG · ` +
  `${formatBytes(MEDIA_SIZE_LIMITS.MAX_VIDEO_SIZE, 0)} per video · ` +
  `${formatBytes(MEDIA_SIZE_LIMITS.MAX_FONT_SIZE, 0)} per font`;

/** "pasta-2-small.jpg" → "JPG": the file's own extension, the way the Clone's lines spell it. */
export function fileExtensionLabel(fileName: string): string {
  return (fileName.match(/\.([a-z0-9]+)$/i)?.[1] ?? "").toUpperCase();
}

/**
 * The MIME a file should be handled as. Browsers fill `File.type` from the
 * OS registry, and macOS Chromium has no entry for `.woff2` — the type comes
 * back "" and the upload was refused as "Unsupported file type: " (measured
 * 2026-09-13 with the Clone fixture). Only the font extensions are inferred:
 * images and video always arrive typed, and inferring those would let a
 * renamed file past the sniffer.
 */
export function mimeTypeForFile(file: Pick<File, "name" | "type">): string {
  if (file.type) return file.type;
  const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  switch (ext) {
    case "woff2": return "font/woff2";
    case "woff": return "font/woff";
    case "ttf": return "font/ttf";
    case "otf": return "font/otf";
    default: return "";
  }
}

// ============================================
// Media Events
// ============================================

/**
 * Media-related event names
 */
export const MEDIA_EVENTS = {
  /**
   * Emitted once `MediaManager.init()` has finished reading storage. Until it
   * fires the library is not empty — it is unknown, and the two look identical
   * on screen. Figma draws them as different screens (`777:4093` skeletons vs
   * `145:359` "Your library is empty"), and nothing in the code could tell them
   * apart before this event existed.
   */
  INITIALIZED: "media:initialized",
  /**
   * `init()` could not read storage — IndexedDB blocked in a private window,
   * a quota refusal, a corrupt store. Before this existed the failure resolved
   * to an empty array and the drawer said "Your library is empty", which is a
   * lie the user cannot act on: their assets are still there. Figma draws the
   * two differently (`453:3931` "Couldn't load your media." + Try again).
   */
  INIT_FAILED: "media:init-failed",
  /**
   * The server's paging edges moved — a page landed, or the last one did.
   * Carries `{ nextCursor, total }`. The drawer needs both to say how much of
   * the library it is actually showing; before this the cursor was fetched at
   * boot and thrown away, so nothing downstream could know a library had been
   * truncated at all.
   */
  SERVER_PAGE_CHANGED: "media:server-page",
  /** Emitted when a media asset is added */
  MEDIA_ADDED: "media:added",
  /* A new session rebuilt the object URLs for locally-stored assets. blob: URLs
     die with the window that made them, so the library re-creates them on
     load — and anything already placed on a page still points at the dead one.
     The payload maps old src → new src so those can be repaired. */
  LOCAL_URLS_REBUILT: "media:local-urls-rebuilt",
  /** Emitted when a media asset is updated */
  MEDIA_UPDATED: "media:updated",
  /** Emitted when a media asset is deleted */
  MEDIA_DELETED: "media:deleted",
  /** Emitted when a folder is created */
  FOLDER_CREATED: "media:folder:created",
  /** Emitted when a folder is deleted */
  FOLDER_DELETED: "media:folder:deleted",
  /** Emitted when a folder is updated */
  FOLDER_UPDATED: "media:folder:updated",
  /** Emitted when upload starts */
  UPLOAD_START: "media:upload:start",
  /** Emitted on upload progress */
  UPLOAD_PROGRESS: "media:upload:progress",
  /** Emitted when upload completes */
  UPLOAD_COMPLETE: "media:upload:complete",
  /** Emitted on upload error */
  UPLOAD_ERROR: "media:upload:error",
  /** Emitted after insertMediaAt creates or mutates an element. Payload: { src, type, elementId, path: 'click' | 'drag' } */
  INSERT_SUCCEEDED: "media:insert:succeeded",
  /** Emitted when insertMediaAt rejects. Payload: { reason: 'no-active-page' | 'invalid-type' | 'no-text-selected', src, type } */
  INSERT_FAILED: "media:insert:failed",
  /** Emitted when the replace-across dialog opens. Payload: { oldSrc, usageCount } */
  REPLACE_OPENED: "media:replace:opened",
  /** Emitted when replace-across commits (whole batch succeeded). Payload: { oldSrc, newSrc, count } */
  REPLACE_COMMITTED: "media:replace:committed",
  /** Emitted when replace-across committed with partial failures. Payload: { oldSrc, newSrc, succeeded, failed } */
  REPLACE_PARTIAL: "media:replace:partial",
  /** Emitted when replace-across rolled back entirely. Payload: { oldSrc, reason } */
  REPLACE_ROLLED_BACK: "media:replace:rolled_back",
  /** Emitted when storage quota is hit. Payload: { usedBytes, quotaBytes, attemptedBytes } */
  QUOTA_EXCEEDED: "media:quota:exceeded",
  /** Emitted when the library opens. Payload: { source: 'slim_launcher' | 'shortcut' | 'context_menu', folderId? } */
  LIBRARY_OPENED: "media:library:opened",
} as const;

export type MediaEventName = (typeof MEDIA_EVENTS)[keyof typeof MEDIA_EVENTS];

// ============================================
// Storage Quota
// ============================================

/** Total storage quota per user — single source of truth */
export const STORAGE_QUOTA_BYTES = 1_073_741_824; // 1 GB
// ============================================
// Default Values
// ============================================

/**
 * Default media manager configuration
 */
export const MEDIA_DEFAULTS = {
  /** Default root folder ID */
  ROOT_FOLDER_ID: "root",
  /** Default compression quality (0-1) */
  COMPRESSION_QUALITY: 0.85,
  /** Auto-generate thumbnails */
  AUTO_THUMBNAIL: true,
  /** Maximum assets per page for pagination */
  PAGE_SIZE: 50,
  /** Default sort field */
  DEFAULT_SORT: "date" as const,
  /** Default sort direction */
  DEFAULT_SORT_DIR: "desc" as const,
} as const;

// ============================================
// Utility Functions
// ============================================

/**
 * Check if a MIME type is allowed for images
 */
export function isAllowedImageType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES.IMAGE as readonly string[]).includes(mimeType);
}

/**
 * Check if a MIME type is allowed for videos
 */
export function isAllowedVideoType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES.VIDEO as readonly string[]).includes(mimeType);
}

/**
 * Check if a MIME type is allowed for audio
 */
export function isAllowedAudioType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES.AUDIO as readonly string[]).includes(mimeType);
}

/**
 * Check if a MIME type is allowed for fonts
 */
function isAllowedFontType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES.FONT as readonly string[]).includes(mimeType);
}

/**
 * Check if a MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return (ALL_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Get the maximum file size for a given MIME type
 */
export function getMaxFileSize(mimeType: string): number {
  if (isAllowedImageType(mimeType)) {
    return mimeType === "image/svg+xml"
      ? MEDIA_SIZE_LIMITS.MAX_SVG_SIZE
      : MEDIA_SIZE_LIMITS.MAX_IMAGE_SIZE;
  }
  if (isAllowedVideoType(mimeType)) {
    return MEDIA_SIZE_LIMITS.MAX_VIDEO_SIZE;
  }
  if (isAllowedAudioType(mimeType)) {
    return MEDIA_SIZE_LIMITS.MAX_AUDIO_SIZE;
  }
  if (isAllowedFontType(mimeType)) {
    return MEDIA_SIZE_LIMITS.MAX_FONT_SIZE;
  }
  return MEDIA_SIZE_LIMITS.MAX_IMAGE_SIZE; // Default fallback
}

/**
 * Get media asset type from MIME type
 */
export function getAssetTypeFromMime(
  mimeType: string
): "image" | "video" | "audio" | "svg" | "icon" | "font" | null {
  if (mimeType === "image/svg+xml") return "svg";
  if (isAllowedImageType(mimeType)) return "image";
  if (isAllowedVideoType(mimeType)) return "video";
  if (isAllowedAudioType(mimeType)) return "audio";
  if (isAllowedFontType(mimeType)) return "font";
  return null;
}

// ============================================
// Placeholder Image
// ============================================

/**
 * Inline SVG placeholder for block templates that need a visible default
 * image. Replaces the dead via.placeholder.com service (shut down 2024 —
 * its URLs render the browser broken-image icon and fail network requests).
 */
export function placeholderImageSrc(width: number, height: number): string {
  const cx = Math.round(width * 0.38);
  const cy = Math.round(height * 0.35);
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>` +
    `<rect width='${width}' height='${height}' fill='#E2E8F0'/>` +
    `<circle cx='${cx}' cy='${cy}' r='${Math.round(height * 0.07)}' fill='#94A3B8'/>` +
    `<path d='M${width * 0.18} ${height * 0.78} L${width * 0.38} ${height * 0.5} L${width * 0.52} ${height * 0.66} L${width * 0.64} ${height * 0.54} L${width * 0.82} ${height * 0.78} Z' fill='#94A3B8'/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
