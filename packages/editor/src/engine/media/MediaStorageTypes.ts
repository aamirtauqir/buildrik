/**
 * Media Storage Types and Error Classes
 * @license BSD-3-Clause
 */

import type { MediaAsset, MediaFolder } from "../../shared/types/media";

// ============================================
// Error Classes
// ============================================

/**
 * Rescue actions the UI can take when a MediaError is thrown. Surfaced via
 * the `rescueAction` field so callers don't string-match on message text.
 */
export type MediaRescueAction =
  | "retry"
  | "show-quota-banner"
  | "show-validation-toast"
  | "prompt-select-page"
  | "show-partial-failure-dialog"
  | "none";

/**
 * Base class for every typed media error. Inherit to add a specific rescue
 * action. `cause` is the lower-level error (I/O, validation, etc.), kept for
 * logging but not shown to users.
 */
export class MediaError extends Error {
  readonly rescueAction: MediaRescueAction;
  readonly cause?: unknown;

  constructor(message: string, rescueAction: MediaRescueAction, cause?: unknown) {
    super(message);
    this.name = "MediaError";
    this.rescueAction = rescueAction;
    this.cause = cause;
  }
}

/**
 * Custom error class for media storage operations.
 * Kept separate from MediaError for backward compatibility with code that
 * expects an `operation` field.
 */
export class MediaStorageError extends Error {
  readonly operation: string;
  readonly cause?: Error;

  constructor(message: string, operation: string, cause?: Error) {
    super(message);
    this.name = "MediaStorageError";
    this.operation = operation;
    this.cause = cause;
  }
}

/** Upload rejected because storage quota would be exceeded. */
export class MediaQuotaError extends MediaError {
  readonly usedBytes: number;
  readonly quotaBytes: number;
  readonly attemptedBytes: number;

  constructor(usedBytes: number, quotaBytes: number, attemptedBytes: number) {
    super(
      `Storage quota exceeded: ${Math.round(usedBytes / 1024 / 1024)}MB used of ${Math.round(quotaBytes / 1024 / 1024)}MB`,
      "show-quota-banner",
    );
    this.name = "MediaQuotaError";
    this.usedBytes = usedBytes;
    this.quotaBytes = quotaBytes;
    this.attemptedBytes = attemptedBytes;
  }
}

/** Upload rejected during pre-write validation (MIME, size, filename, SVG content). */
export class MediaValidationError extends MediaError {
  readonly field: "mime" | "size" | "filename" | "content";

  constructor(message: string, field: MediaValidationError["field"], cause?: unknown) {
    super(message, "show-validation-toast", cause);
    this.name = "MediaValidationError";
    this.field = field;
  }
}

/** Insert attempted with no active page in the composer. */
export class MediaNoActivePageError extends MediaError {
  constructor() {
    super("Select a page first", "prompt-select-page");
    this.name = "MediaNoActivePageError";
  }
}

/** replaceAcross committed but some elements failed — dialog should surface them. */
export class MediaReplacePartialError extends MediaError {
  readonly failed: ReadonlyArray<{ elementId: string; error: string }>;
  readonly succeeded: number;

  constructor(
    failed: ReadonlyArray<{ elementId: string; error: string }>,
    succeeded: number,
  ) {
    super(
      `Replaced ${succeeded} element${succeeded === 1 ? "" : "s"}, ${failed.length} failed`,
      "show-partial-failure-dialog",
    );
    this.name = "MediaReplacePartialError";
    this.failed = failed;
    this.succeeded = succeeded;
  }
}

// ============================================
// Stored Record Types
// ============================================

/** Stored asset record in IndexedDB */
export interface StoredAsset {
  readonly id: string;
  readonly type: string;
  readonly folderId: string | null;
  readonly createdAt: string;
  readonly tags: readonly string[];
  readonly data: MediaAsset;
}

/** Stored folder record in IndexedDB */
export interface StoredFolder {
  readonly id: string;
  readonly parentId: string | null;
  readonly data: MediaFolder;
}

/** Stored blob record in IndexedDB */
export interface StoredBlob {
  readonly assetId: string;
  readonly blob: Blob;
}
