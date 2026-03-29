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
  /** Current device preview */
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

export type DeviceType = "desktop" | "tablet" | "mobile" | "watch";

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
