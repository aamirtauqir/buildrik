/**
 * Canvas Indicators Manager - Facade for all visual canvas indicators
 * @module engine/canvas/indicators/CanvasIndicators
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../shared/constants";
import type {
  SpacingIndicator,
  ElementBadge,
  CanvasOverlay,
  CanvasGuide,
  SnapPoint,
  SmartGuide,
  DistanceMeasurement,
  RulerConfig,
  DimensionOverlay,
  EqualSpacingIndicator,
  SelectionBox,
  ParentBoundaryGuide,
  HoverHighlight,
  GapHighlight,
  AutoLayoutIndicator,
} from "../../../shared/types/canvas";
import type { Composer } from "../../Composer";
import { EventEmitter } from "../../EventEmitter";
import { AutoLayoutManager } from "./AutoLayoutManager";
import { BoundsCalculator } from "./BoundsCalculator";
import { GuideManager } from "./GuideManager";
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
  private guideManager: GuideManager;
  private autoLayoutManager: AutoLayoutManager;

  constructor(composer: Composer) {
    super();
    this.boundsCalculator = new BoundsCalculator(composer);
    this.spacingCalculator = new SpacingCalculator(composer, this.boundsCalculator);
    this.snapCalculator = new SnapCalculator(composer, this.boundsCalculator);
    this.selectionManager = new SelectionIndicatorManager(composer, this.boundsCalculator);
    this.measurementManager = new MeasurementManager(composer, this.boundsCalculator);
    this.guideManager = new GuideManager(composer, this.boundsCalculator);
    this.autoLayoutManager = new AutoLayoutManager(composer, this.boundsCalculator);
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
  updateOverlay(updates: Partial<CanvasOverlay>): void {
    Object.assign(this.overlay, updates);
    this.emit(EVENTS.OVERLAY_UPDATED, this.overlay);
  }
  toggleSpacing(show?: boolean): void {
    this.overlay.showSpacing = show !== undefined ? show : !this.overlay.showSpacing;
    if (this.overlay.showSpacing) this.updateSpacingIndicators();
    else this.spacingCalculator.clear();
    this.emit(EVENTS.SPACING_TOGGLED, { show: this.overlay.showSpacing });
  }
  toggleBadges(show?: boolean): void {
    this.overlay.showBadges = show !== undefined ? show : !this.overlay.showBadges;
    this.emit(EVENTS.BADGES_TOGGLED, { show: this.overlay.showBadges });
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
  getAllSpacingIndicators(): SpacingIndicator[] {
    return this.spacingCalculator.getAllSpacingIndicators();
  }

  // Element Badges
  setBadge(badge: ElementBadge): void {
    this.badges.set(badge.elementId, badge);
    this.emit(EVENTS.BADGE_SET, { badge });
  }
  removeBadge(elementId: string): void {
    if (this.badges.delete(elementId)) this.emit(EVENTS.BADGE_REMOVED, { elementId });
  }
  getBadge(elementId: string): ElementBadge | undefined {
    return this.badges.get(elementId);
  }
  getAllBadges(): ElementBadge[] {
    return Array.from(this.badges.values());
  }

  // Guides
  addGuide(guide: CanvasGuide): void {
    this.guideManager.addGuide(guide);
    this.emit(EVENTS.GUIDE_ADDED, { guide });
  }
  removeGuide(guideId: string): void {
    if (this.guideManager.removeGuide(guideId)) this.emit(EVENTS.GUIDE_REMOVED, { guideId });
  }
  getGuides(): CanvasGuide[] {
    return this.guideManager.getGuides();
  }
  clearGuides(): void {
    this.guideManager.clearGuides();
    this.emit(EVENTS.GUIDES_CLEARED, {});
  }

  // Snap Points
  calculateSnapPoints(elementId: string): SnapPoint[] {
    return this.snapCalculator.calculateSnapPoints(elementId, this.guideManager.getGuidesMap());
  }
  getSnapPoints(): SnapPoint[] {
    return this.snapCalculator.getSnapPoints();
  }

  // Smart Guides
  calculateSmartGuides(draggedElementId: string, draggedBounds: SimpleBounds): SmartGuide[] {
    const guides = this.snapCalculator.calculateSmartGuides(draggedElementId, draggedBounds);
    this.emit(EVENTS.OVERLAY_UPDATED, { smartGuides: guides });
    return guides;
  }
  getSmartGuides(): SmartGuide[] {
    return this.snapCalculator.getSmartGuides();
  }
  clearSmartGuides(): void {
    this.snapCalculator.clearSmartGuides();
    this.emit(EVENTS.OVERLAY_UPDATED, { smartGuides: [] });
  }

  // Distance Measurements
  calculateDistanceMeasurements(
    elementId: string,
    targetElementId?: string
  ): DistanceMeasurement[] {
    const m = this.measurementManager.calculateDistanceMeasurements(elementId, targetElementId);
    this.emit(EVENTS.OVERLAY_UPDATED, { distanceMeasurements: m });
    return m;
  }
  getDistanceMeasurements(): DistanceMeasurement[] {
    return this.measurementManager.getDistanceMeasurements();
  }
  clearDistanceMeasurements(): void {
    this.measurementManager.clearDistanceMeasurements();
    this.emit(EVENTS.OVERLAY_UPDATED, { distanceMeasurements: [] });
  }

  // Rulers
  toggleRulers(show?: boolean): void {
    this.overlay.showRulers = this.guideManager.toggleRulers(show);
    this.emit(EVENTS.OVERLAY_UPDATED, { rulers: this.guideManager.getRulerConfig() });
  }
  updateRulerConfig(updates: Partial<RulerConfig>): void {
    this.guideManager.updateRulerConfig(updates);
    this.emit(EVENTS.OVERLAY_UPDATED, { rulers: this.guideManager.getRulerConfig() });
  }
  getRulerConfig(): RulerConfig {
    return this.guideManager.getRulerConfig();
  }
  updateRulerScroll(scrollOffset: { x: number; y: number }): void {
    this.guideManager.updateRulerScroll(scrollOffset);
    this.emit(EVENTS.OVERLAY_UPDATED, { rulers: this.guideManager.getRulerConfig() });
  }
  updateRulerZoom(zoom: number): void {
    this.guideManager.updateRulerZoom(zoom);
    this.emit(EVENTS.OVERLAY_UPDATED, { rulers: this.guideManager.getRulerConfig() });
  }

  // Dimension Overlays
  showDimensionOverlay(elementId: string): DimensionOverlay | null {
    const o = this.measurementManager.showDimensionOverlay(elementId);
    this.emit(EVENTS.OVERLAY_UPDATED, {
      dimensions: this.measurementManager.getAllDimensionOverlays(),
    });
    return o;
  }
  hideDimensionOverlay(elementId: string): void {
    if (this.measurementManager.hideDimensionOverlay(elementId))
      this.emit(EVENTS.OVERLAY_UPDATED, {
        dimensions: this.measurementManager.getAllDimensionOverlays(),
      });
  }
  getDimensionOverlay(elementId: string): DimensionOverlay | undefined {
    return this.measurementManager.getDimensionOverlay(elementId);
  }
  getAllDimensionOverlays(): DimensionOverlay[] {
    return this.measurementManager.getAllDimensionOverlays();
  }
  clearDimensionOverlays(): void {
    this.measurementManager.clearDimensionOverlays();
    this.emit(EVENTS.OVERLAY_UPDATED, { dimensions: [] });
  }

  // Equal Spacing
  detectEqualSpacing(elementIds: string[]): EqualSpacingIndicator[] {
    const i = this.autoLayoutManager.detectEqualSpacing(elementIds);
    this.emit(EVENTS.OVERLAY_UPDATED, { equalSpacing: i });
    return i;
  }
  getEqualSpacingIndicators(): EqualSpacingIndicator[] {
    return this.autoLayoutManager.getEqualSpacingIndicators();
  }
  clearEqualSpacingIndicators(): void {
    this.autoLayoutManager.clearEqualSpacingIndicators();
    this.emit(EVENTS.OVERLAY_UPDATED, { equalSpacing: [] });
  }

  // Selection Boxes
  createSelectionBox(elementId: string, isMultiSelect = false): SelectionBox | null {
    const b = this.selectionManager.createSelectionBox(elementId, isMultiSelect);
    this.emit(EVENTS.OVERLAY_UPDATED, {
      selectionBoxes: this.selectionManager.getAllSelectionBoxes(),
    });
    return b;
  }
  createMultiSelectionBox(elementIds: string[]): SelectionBox | null {
    const b = this.selectionManager.createMultiSelectionBox(elementIds);
    this.emit(EVENTS.OVERLAY_UPDATED, {
      selectionBoxes: this.selectionManager.getAllSelectionBoxes(),
    });
    return b;
  }
  getSelectionBox(elementId: string): SelectionBox | undefined {
    return this.selectionManager.getSelectionBox(elementId);
  }
  getAllSelectionBoxes(): SelectionBox[] {
    return this.selectionManager.getAllSelectionBoxes();
  }
  clearSelectionBox(elementId: string): void {
    if (this.selectionManager.clearSelectionBox(elementId))
      this.emit(EVENTS.OVERLAY_UPDATED, {
        selectionBoxes: this.selectionManager.getAllSelectionBoxes(),
      });
  }
  clearAllSelectionBoxes(): void {
    this.selectionManager.clearAllSelectionBoxes();
    this.emit(EVENTS.OVERLAY_UPDATED, { selectionBoxes: [] });
  }

  // Parent Boundary Guides
  calculateParentBoundaryGuides(elementId: string): ParentBoundaryGuide | null {
    const g = this.guideManager.calculateParentBoundaryGuides(elementId);
    this.emit(EVENTS.OVERLAY_UPDATED, {
      parentBoundaryGuides: this.guideManager.getParentBoundaryGuides(),
    });
    return g;
  }
  getParentBoundaryGuides(): ParentBoundaryGuide[] {
    return this.guideManager.getParentBoundaryGuides();
  }
  clearParentBoundaryGuides(): void {
    this.guideManager.clearParentBoundaryGuides();
    this.emit(EVENTS.OVERLAY_UPDATED, { parentBoundaryGuides: [] });
  }

  // Hover Highlight
  showHoverHighlight(elementId: string): HoverHighlight | null {
    const h = this.selectionManager.showHoverHighlight(elementId);
    this.emit(EVENTS.OVERLAY_UPDATED, { hoverHighlight: h });
    return h;
  }
  getHoverHighlight(): HoverHighlight | null {
    return this.selectionManager.getHoverHighlight();
  }
  clearHoverHighlight(): void {
    this.selectionManager.clearHoverHighlight();
    this.emit(EVENTS.OVERLAY_UPDATED, { hoverHighlight: null });
  }

  // Gap Highlights
  highlightGaps(parentId: string): GapHighlight[] {
    const g = this.autoLayoutManager.highlightGaps(parentId);
    this.emit(EVENTS.OVERLAY_UPDATED, { gapHighlights: g });
    return g;
  }
  getGapHighlights(): GapHighlight[] {
    return this.autoLayoutManager.getGapHighlights();
  }
  clearGapHighlights(): void {
    this.autoLayoutManager.clearGapHighlights();
    this.emit(EVENTS.OVERLAY_UPDATED, { gapHighlights: [] });
  }

  // Auto-Layout Indicators
  showAutoLayoutIndicator(elementId: string): AutoLayoutIndicator | null {
    const i = this.autoLayoutManager.showAutoLayoutIndicator(elementId);
    this.emit(EVENTS.OVERLAY_UPDATED, {
      autoLayoutIndicators: this.autoLayoutManager.getAllAutoLayoutIndicators(),
    });
    return i;
  }
  getAutoLayoutIndicator(elementId: string): AutoLayoutIndicator | undefined {
    return this.autoLayoutManager.getAutoLayoutIndicator(elementId);
  }
  getAllAutoLayoutIndicators(): AutoLayoutIndicator[] {
    return this.autoLayoutManager.getAllAutoLayoutIndicators();
  }
  clearAutoLayoutIndicator(elementId: string): void {
    if (this.autoLayoutManager.clearAutoLayoutIndicator(elementId))
      this.emit(EVENTS.OVERLAY_UPDATED, {
        autoLayoutIndicators: this.autoLayoutManager.getAllAutoLayoutIndicators(),
      });
  }
  clearAllAutoLayoutIndicators(): void {
    this.autoLayoutManager.clearAllAutoLayoutIndicators();
    this.emit(EVENTS.OVERLAY_UPDATED, { autoLayoutIndicators: [] });
  }

  // Clear All & Cleanup
  clearAll(): void {
    this.clearSmartGuides();
    this.clearDistanceMeasurements();
    this.clearDimensionOverlays();
    this.clearEqualSpacingIndicators();
    this.clearAllSelectionBoxes();
    this.clearParentBoundaryGuides();
    this.clearHoverHighlight();
    this.clearGapHighlights();
    this.clearAllAutoLayoutIndicators();
    this.spacingCalculator.clear();
    this.emit(EVENTS.OVERLAY_UPDATED, { cleared: true });
  }

  destroy(): void {
    this.spacingCalculator.clear();
    this.badges.clear();
    this.guideManager.clearGuides();
    this.snapCalculator.clearSmartGuides();
    this.measurementManager.clearDistanceMeasurements();
    this.measurementManager.clearDimensionOverlays();
    this.autoLayoutManager.clearEqualSpacingIndicators();
    this.selectionManager.clearAllSelectionBoxes();
    this.guideManager.clearParentBoundaryGuides();
    this.selectionManager.clearHoverHighlight();
    this.autoLayoutManager.clearGapHighlights();
    this.autoLayoutManager.clearAllAutoLayoutIndicators();
    this.removeAllListeners();
  }
}
