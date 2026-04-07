/**
 * Canvas Indicators Type Definitions
 * Types for visual canvas indicators and overlays
 *
 * FRESH IMPLEMENTATION for Aquibra
 *
 * @module types/canvas
 * @license BSD-3-Clause
 */

/**
 * Spacing indicator configuration
 */
export interface SpacingIndicator {
  /** Element ID */
  elementId: string;

  /** Spacing type */
  type: "margin" | "padding";

  /** Side */
  side: "top" | "right" | "bottom" | "left";

  /** Value in pixels */
  value: number;

  /** Position on screen */
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Drag target highlight
 */
export interface DragTarget {
  /** Target element ID */
  elementId: string;

  /** Drop position */
  position: "before" | "after" | "inside";

  /** Target bounds */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** Is this a valid drop target? */
  valid: boolean;
}

/**
 * Element badge configuration
 */
export interface ElementBadge {
  /** Element ID */
  elementId: string;

  /** Badge type */
  type: "tag" | "id" | "class" | "data" | "custom";

  /** Badge content */
  content: string;

  /** Badge position */
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";

  /** Badge color */
  color?: string;

  /** Is badge visible? */
  visible: boolean;
}

/**
 * Canvas overlay configuration
 */
export interface CanvasOverlay {
  /** Show spacing indicators? */
  showSpacing: boolean;

  /** Show drag targets? */
  showDragTargets: boolean;

  /** Show element badges? */
  showBadges: boolean;

  /** Show grid? */
  showGrid: boolean;

  /** Grid size in pixels */
  gridSize: number;

  /** Show rulers? */
  showRulers: boolean;

  /** Show guides? */
  showGuides: boolean;
}

/**
 * Canvas guide
 */
export interface CanvasGuide {
  /** Guide ID */
  id: string;

  /** Guide type */
  type: "horizontal" | "vertical";

  /** Position in pixels */
  position: number;

  /** Is guide locked? */
  locked: boolean;

  /** Guide color */
  color?: string;
}

/**
 * Element bounds
 */
export interface ElementBounds {
  /** Element ID */
  elementId: string;

  /** X position */
  x: number;

  /** Y position */
  y: number;

  /** Width */
  width: number;

  /** Height */
  height: number;

  /** Computed margins */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Computed padding */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Snap point for alignment
 */
export interface SnapPoint {
  /** Snap type */
  type: "edge" | "center" | "guide";

  /** Axis */
  axis: "horizontal" | "vertical";

  /** Position */
  position: number;

  /** Source element ID (if edge/center snap) */
  sourceElementId?: string;

  /** Guide ID (if guide snap) */
  guideId?: string;
}

// ============================================
// Figma-level Pro Features
// ============================================

/**
 * Smart Guide - alignment line that appears during drag
 * Shows when elements align with each other
 */
export interface SmartGuide {
  /** Unique ID for this guide */
  id: string;

  /** Guide axis */
  axis: "horizontal" | "vertical";

  /** Position in pixels */
  position: number;

  /** Start point of the guide line */
  start: number;

  /** End point of the guide line */
  end: number;

  /** Type of alignment */
  alignType: "edge-top" | "edge-bottom" | "edge-left" | "edge-right" | "center-x" | "center-y";

  /** Source element that the dragged element is aligning to */
  sourceElementId: string;

  /** Target element being dragged */
  targetElementId: string;

  /** Guide color (default: magenta/pink like Figma) */
  color?: string;
}

/**
 * Distance Measurement - shows distance between elements
 * Appears when holding Alt/Option key or when elements are near
 */
export interface DistanceMeasurement {
  /** Unique ID */
  id: string;

  /** From element ID */
  fromElementId: string;

  /** To element ID (or canvas edge) */
  toElementId: string | "canvas-top" | "canvas-bottom" | "canvas-left" | "canvas-right";

  /** Distance in pixels */
  distance: number;

  /** Direction of measurement */
  direction: "horizontal" | "vertical";

  /** Line start point */
  lineStart: { x: number; y: number };

  /** Line end point */
  lineEnd: { x: number; y: number };

  /** Label position */
  labelPosition: { x: number; y: number };
}

/**
 * Ruler Configuration
 * Horizontal and vertical rulers like Figma/Sketch
 */
export interface RulerConfig {
  /** Show horizontal ruler */
  showHorizontal: boolean;

  /** Show vertical ruler */
  showVertical: boolean;

  /** Ruler size in pixels */
  size: number;

  /** Major tick interval (e.g., 100px) */
  majorTickInterval: number;

  /** Minor tick interval (e.g., 10px) */
  minorTickInterval: number;

  /** Show numbers on major ticks */
  showNumbers: boolean;

  /** Ruler background color */
  backgroundColor?: string;

  /** Tick color */
  tickColor?: string;

  /** Current zoom level for scaling */
  zoom: number;

  /** Current scroll offset */
  scrollOffset: { x: number; y: number };
}

/**
 * Dimension Overlay - shows element dimensions on hover/select
 * Displays width x height badge
 */
export interface DimensionOverlay {
  /** Element ID */
  elementId: string;

  /** Width in pixels */
  width: number;

  /** Height in pixels */
  height: number;

  /** Position for the dimension label */
  labelPosition: "top" | "bottom" | "right" | "left";

  /** Coordinates for the label */
  labelCoords: { x: number; y: number };

  /** Show width dimension */
  showWidth: boolean;

  /** Show height dimension */
  showHeight: boolean;

  /** Format: "100 x 50" or "100px × 50px" */
  format: "compact" | "full";
}

// ============================================
// Advanced Figma-level Pro Features
// ============================================

/**
 * Equal Spacing Indicator - Shows when elements are equally spaced
 * Red/pink lines connecting elements with equal gaps
 */
export interface EqualSpacingIndicator {
  /** Unique ID */
  id: string;

  /** Direction of spacing */
  direction: "horizontal" | "vertical";

  /** The equal spacing value in pixels */
  spacing: number;

  /** Element IDs involved (in order) */
  elementIds: string[];

  /** Gap lines to render (between each pair) */
  gapLines: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    midpoint: { x: number; y: number };
  }>;

  /** Is this a valid equal spacing (all gaps equal)? */
  isEqual: boolean;
}

/**
 * Selection Box - Blue selection outline with handles
 * Shows when element is selected
 */
export interface SelectionBox {
  /** Element ID */
  elementId: string;

  /** Bounding box */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** Resize handles (8 points around the box) */
  handles: Array<{
    position: "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
    x: number;
    y: number;
    cursor: string;
  }>;

  /** Rotation handle (above center top) */
  rotationHandle?: {
    x: number;
    y: number;
    angle: number;
  };

  /** Selection color */
  color: string;

  /** Is multi-selected? */
  isMultiSelect: boolean;

  /** Is locked? */
  isLocked: boolean;
}

/**
 * Parent Boundary Guide - Shows alignment to parent edges
 */
export interface ParentBoundaryGuide {
  /** Element ID being aligned */
  elementId: string;

  /** Parent element ID */
  parentId: string;

  /** Which edges are aligned */
  alignedEdges: Array<{
    edge: "top" | "right" | "bottom" | "left" | "center-x" | "center-y";
    position: number;
    lineStart: { x: number; y: number };
    lineEnd: { x: number; y: number };
  }>;

  /** Distance to each parent edge */
  edgeDistances: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Constraint Indicator - Shows how element is constrained
 * Visual indicators for responsive constraints
 */
export interface ConstraintIndicator {
  /** Element ID */
  elementId: string;

  /** Horizontal constraint */
  horizontal: "left" | "right" | "center" | "scale" | "left-right";

  /** Vertical constraint */
  vertical: "top" | "bottom" | "center" | "scale" | "top-bottom";

  /** Visual lines showing constraints */
  constraintLines: Array<{
    type: "fixed" | "flexible";
    direction: "horizontal" | "vertical";
    start: { x: number; y: number };
    end: { x: number; y: number };
  }>;
}

/**
 * Hover Highlight - Subtle highlight on hover (before selection)
 */
export interface HoverHighlight {
  /** Element ID */
  elementId: string;

  /** Bounding box */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** Element tag name for label */
  tagName: string;

  /** Element label (class or id) */
  label?: string;

  /** Highlight color (usually light blue) */
  color: string;
}

/**
 * Gap Highlight - Visual gap between elements
 * Shows spacing when hovering between elements
 */
export interface GapHighlight {
  /** Unique ID */
  id: string;

  /** Gap direction */
  direction: "horizontal" | "vertical";

  /** Gap size in pixels */
  size: number;

  /** Gap area */
  area: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** Adjacent element IDs */
  betweenElements: [string, string];
}

/**
 * Auto-Layout Indicator - Shows flexbox/grid layout info
 */
export interface AutoLayoutIndicator {
  /** Container element ID */
  elementId: string;

  /** Layout type */
  layoutType: "flex" | "grid" | "none";

  /** Flex direction (if flex) */
  flexDirection?: "row" | "column";

  /** Gap between items */
  gap: number;

  /** Padding */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Child indicators showing spacing */
  childSpacing: Array<{
    afterElementId: string;
    gapLine: {
      start: { x: number; y: number };
      end: { x: number; y: number };
    };
  }>;
}
