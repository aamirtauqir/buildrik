/**
 * State Types
 * Types for composer state and device configuration
 *
 * @module types/state
 * @license BSD-3-Clause
 */

// ============================================
// State Types
// ============================================

export interface ComposerState {
  /** Editor is ready */
  ready: boolean;
  /** Project has unsaved changes */
  dirty: boolean;
  /** Current device preview. Computed from `viewport.getDevice()` at
   *  `getState()` time (E-004 SSOT — viewport is authoritative; this field
   *  is not stored on the internal state). Mutate via `composer.setDevice(...)`. */
  device: DeviceType;
  /** Current zoom level */
  zoom: number;
  /** Active page ID */
  activePageId: string | null;
  /** Snap to grid enabled */
  snapToGrid: boolean;
  /** Grid size in pixels */
  gridSize: number;
  /** Is composer in preview mode */
  isPreviewMode: boolean;
}

export type DeviceType = "desktop" | "tablet" | "mobile" | "wide";

/** Why the document is not editable right now. Several can hold at once;
 *  the composer is read-only while any does (`Composer.editLocks`). */
export type EditLockReason = "view" | "time-travel" | "not-loaded";

/**
 * Device configuration for viewport preview
 */
export interface DeviceConfig {
  /** Device display name */
  name: string;
  /** Viewport width in pixels */
  width: number;
  /** Viewport height in pixels (optional for desktop) */
  height?: number;
  /** Device icon */
  icon?: string;
}
