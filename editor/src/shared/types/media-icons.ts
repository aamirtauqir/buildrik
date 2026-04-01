/**
 * Aquibra Icon Picker Types
 * Type definitions for icon libraries, icon configuration, and icon picker state
 *
 * @module types/media-icons
 * @license BSD-3-Clause
 */

// ============================================
// Icon Picker Types
// ============================================

/**
 * Icon library sources
 */
export type IconLibrary = "lucide" | "heroicons" | "phosphor" | "tabler" | "custom";

/**
 * Icon configuration for elements
 */
export interface IconConfig {
  /** Icon library source */
  readonly library: IconLibrary;

  /** Icon name from the library */
  readonly name: string;

  /** Icon size in pixels */
  size: number;

  /** Icon color (CSS color value) */
  color: string;

  /** Stroke width (1-3 for stroke-based icons) */
  strokeWidth: number;

  /** Fill color (for filled variants) */
  fill?: string;

  /** Custom CSS class */
  className?: string;

  /** Rotation in degrees */
  rotation?: number;

  /** Flip horizontal */
  flipX?: boolean;

  /** Flip vertical */
  flipY?: boolean;
}

/**
 * Icon category for organization
 */
export interface IconCategory {
  /** Category ID */
  readonly id: string;

  /** Category display name */
  readonly label: string;

  /** Category description */
  readonly description?: string;

  /** Icon names in this category */
  readonly icons: readonly string[];
}

/**
 * Icon picker state
 */
export interface IconPickerState {
  /** Search query */
  searchQuery: string;

  /** Selected category */
  selectedCategory: string | null;

  /** Recently used icons */
  recentIcons: readonly string[];

  /** Favorite icons */
  favoriteIcons: readonly string[];

  /** Selected icon library */
  selectedLibrary: IconLibrary;

  /** View mode */
  viewMode: "grid" | "list";

  /** Icon size for preview */
  previewSize: number;
}
