/**
 * Shared Block Types
 * Consolidated interface definitions for block configurations
 * @license BSD-3-Clause
 */

import type { Composer } from "../engine";
import type { BlockData, ElementType } from "../shared/types";

/**
 * Build function signature for blocks that need programmatic element creation.
 * Returns the root element ID for auto-selection after insertion.
 */
export type BlockBuildFunction = (
  composer: Composer,
  parentId: string,
  dropIndex?: number
) => string | undefined;

/**
 * Extended block configuration with element type and optional build function.
 * Use this interface for all block config exports.
 */
export interface BlockBuildConfig extends BlockData {
  /** The canonical element type this block creates */
  elementType: ElementType;
  /**
   * Optional builder for blocks that need structured children or custom setup.
   * When provided, this takes precedence over the content property.
   * Must return the root element ID for auto-selection.
   */
  build?: BlockBuildFunction;
}

// Re-export commonly used types for convenience
export type { Composer } from "../engine";
export type { BlockData, ElementType } from "../shared/types";
