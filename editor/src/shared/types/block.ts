/**
 * Block Types
 * Types for editor blocks and block categories
 *
 * @module types/block
 * @license BSD-3-Clause
 */

import type { ElementData } from "./element";

// ============================================
// Block Types
// ============================================

export interface BlockData {
  /** Block ID */
  id: string;
  /** Block label */
  label: string;
  /** Block category */
  category?: string;
  /** Block icon */
  icon?: string;
  /** Block content (HTML or ElementData). Optional when build function is provided. */
  content?: string | ElementData;
  /** Block preview image */
  preview?: string;
  /** Block description */
  description?: string;
  /** Block tags for search */
  tags?: string[];
}

export interface BlockCategory {
  /** Category ID */
  id: string;
  /** Category label */
  label: string;
  /** Category icon */
  icon?: string;
  /** Sort order */
  order?: number;
  /** Is open by default */
  open?: boolean;
}
