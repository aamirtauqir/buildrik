/**
 * Canvas Indicators Module
 * @license BSD-3-Clause
 */

// Main facade export
export { CanvasIndicators } from "./CanvasIndicators";

// Sub-managers (for testing and advanced usage)
export { BoundsCalculator } from "./BoundsCalculator";
export { SpacingCalculator } from "./SpacingCalculator";
export { SnapCalculator } from "./SnapCalculator";
export { SelectionIndicatorManager } from "./SelectionIndicatorManager";
export { MeasurementManager } from "./MeasurementManager";
export { GuideManager } from "./GuideManager";
export { AutoLayoutManager } from "./AutoLayoutManager";

// Types
export type { SimpleBounds, IndicatorContext } from "./types";
