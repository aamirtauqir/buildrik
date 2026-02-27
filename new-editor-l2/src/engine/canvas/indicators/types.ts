/**
 * Indicator Types
 * Internal types for canvas indicators module
 *
 * @module engine/canvas/indicators/types
 * @license BSD-3-Clause
 */

import type { ElementBounds } from "../../../shared/types/canvas";
import type { Composer } from "../../Composer";

/**
 * Simple bounds interface without spacing info
 */
export interface SimpleBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Context passed to sub-managers for accessing shared resources
 */
export interface IndicatorContext {
  composer: Composer;
  getElementBounds: (elementId: string) => ElementBounds | null;
  collectElementBounds: (excludeId: string) => ElementBounds[];
}
