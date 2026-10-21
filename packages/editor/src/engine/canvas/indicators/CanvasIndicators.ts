/**
 * Canvas Indicators Manager - Facade for all visual canvas indicators
 * @module engine/canvas/indicators/CanvasIndicators
 * @license BSD-3-Clause
 */

import { EVENTS } from "@/shared/constants";
import type {
  SpacingIndicator,
  ElementBadge,
  CanvasOverlay,
  SnapPoint,
  SmartGuide,
  DimensionOverlay,
  SelectionBox,
} from "@/shared/types/canvas";
import type { Composer } from "@/engine/Composer";
import { EventEmitter } from "@/engine/EventEmitter";
import { BoundsCalculator } from "./BoundsCalculator";
import { MeasurementManager } from "./MeasurementManager";
import { SelectionIndicatorManager } from "./SelectionIndicatorManager";
import { SnapCalculator } from "./SnapCalculator";
import { SpacingCalculator } from "./SpacingCalculator";
import type { SimpleBounds } from "./types";

/** Canvas Indicators Manager - Manages all visual indicators on the canvas */
export class CanvasIndicators extends EventEmitter {
  private overlay: CanvasOverlay;
  private badges: Map<string, ElementBadge> = new Map();
  private boundsCalculator: BoundsCalculator;
  private spacingCalculator: SpacingCalculator;
  private snapCalculator: SnapCalculator;
  private selectionManager: SelectionIndicatorManager;
  private measurementManager: MeasurementManager;

  constructor(composer: Composer) {
    super();
    this.boundsCalculator = new BoundsCalculator(composer);
    this.spacingCalculator = new SpacingCalculator(composer, this.boundsCalculator);
    this.snapCalculator = new SnapCalculator(composer, this.boundsCalculator);
    this.selectionManager = new SelectionIndicatorManager(composer, this.boundsCalculator);
    this.measurementManager = new MeasurementManager(composer, this.boundsCalculator);
    this.overlay = {
      showSpacing: false,
      showDragTargets: false,
      showBadges: false,
      showGrid: false,
      gridSize: 10,
      showRulers: false,
      showGuides: true,
    };
  }

  // Overlay Configuration
  getOverlay(): CanvasOverlay {
    return { ...this.overlay };
  }
  toggleSpacing(show?: boolean): void {
    this.overlay.showSpacing = show !== undefined ? show : !this.overlay.showSpacing;
    if (this.overlay.showSpacing) this.updateSpacingIndicators();
    else this.spacingCalculator.clear();
    this.emit(EVENTS.SPACING_TOGGLED, { show: this.overlay.showSpacing });
  }
  toggleGrid(show?: boolean): void {
    this.overlay.showGrid = show !== undefined ? show : !this.overlay.showGrid;
    this.emit(EVENTS.GRID_TOGGLED, { show: this.overlay.showGrid });
  }
  toggleGuides(show?: boolean): void {
    this.overlay.showGuides = show !== undefined ? show : !this.overlay.showGuides;
    this.emit(EVENTS.GUIDES_TOGGLED, { show: this.overlay.showGuides });
  }

  // Spacing Indicators
  updateSpacingIndicators(): void {
    if (!this.overlay.showSpacing) return;
    this.spacingCalculator.updateSpacingIndicators();
    this.emit(EVENTS.SPACING_UPDATED, {
      count: this.spacingCalculator.getAllSpacingIndicators().length,
    });
  }
  getSpacingIndicators(elementId: string): SpacingIndicator[] {
    return this.spacingCalculator.getSpacingIndicators(elementId);
  }

  // Element Badges
  setBadge(badge: ElementBadge): void {
    this.badges.set(badge.elementId, badge);
    this.emit(EVENTS.BADGE_SET, { badge });
  }
  getBadge(elementId: string): ElementBadge | undefined {
    return this.badges.get(elementId);
  }

  // Snap Points (no custom guides are ever added, so the guide map is empty)
  calculateSnapPoints(elementId: string): SnapPoint[] {
    return this.snapCalculator.calculateSnapPoints(elementId, new Map());
  }

  // Smart Guides
  calculateSmartGuides(draggedElementId: string, draggedBounds: SimpleBounds): SmartGuide[] {
    const guides = this.snapCalculator.calculateSmartGuides(draggedElementId, draggedBounds);
    this.emit(EVENTS.OVERLAY_UPDATED, { smartGuides: guides });
    return guides;
  }

  // Dimension Overlays
  showDimensionOverlay(elementId: string): DimensionOverlay | null {
    const o = this.measurementManager.showDimensionOverlay(elementId);
    this.emit(EVENTS.OVERLAY_UPDATED, {
      dimensions: this.measurementManager.getAllDimensionOverlays(),
    });
    return o;
  }

  // Selection Boxes
  createSelectionBox(elementId: string, isMultiSelect = false): SelectionBox | null {
    const b = this.selectionManager.createSelectionBox(elementId, isMultiSelect);
    this.emit(EVENTS.OVERLAY_UPDATED, {
      selectionBoxes: this.selectionManager.getAllSelectionBoxes(),
    });
    return b;
  }

  destroy(): void {
    this.spacingCalculator.clear();
    this.badges.clear();
    this.snapCalculator.clearSmartGuides();
    this.measurementManager.clearDimensionOverlays();
    this.selectionManager.clearAllSelectionBoxes();
    this.removeAllListeners();
  }
}
