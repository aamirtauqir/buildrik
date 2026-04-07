/**
 * Resize Handler Type Definitions
 * All types and interfaces for resize operations
 *
 * @module engine/canvas/resize/types
 * @license BSD-3-Clause
 */

// =============================================================================
// HANDLE TYPES
// =============================================================================

/** Handle positions for resize */
export type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

/** Rotation handle */
export type RotationHandle = "rotation";

/** All handle types */
export type AnyHandle = HandlePosition | RotationHandle;

// =============================================================================
// BOUNDS & GEOMETRY
// =============================================================================

/** Bounds rectangle */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Extended bounds with rotation */
export interface TransformBounds extends Bounds {
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

/** Snapped edges for visual feedback */
export interface SnappedEdges {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  centerX?: number;
  centerY?: number;
}

/** Edge positions for an element */
export interface EdgePositions {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

// =============================================================================
// CONSTRAINTS
// =============================================================================

/** Size constraints for elements */
export interface SizeConstraints {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  /** Lock aspect ratio */
  lockAspectRatio?: boolean;
  /** Preferred aspect ratio (width/height) */
  aspectRatio?: number;
}

/** Parent/Canvas boundary constraints */
export interface BoundaryConstraints {
  /** Parent element bounds (null if element is direct child of canvas) */
  parentBounds: Bounds | null;
  /** Parent element ID for auto-expand */
  parentElementId: string | null;
  /** Parent DOM element reference */
  parentElement: HTMLElement | null;
  /** Canvas bounds (fixed width/height) */
  canvasBounds: Bounds;
  /** Element's offset within parent */
  offsetInParent: { x: number; y: number };
}

// =============================================================================
// SNAP CONFIGURATION
// =============================================================================

/** Snap configuration */
export interface SnapConfig {
  /** Enable snap to grid */
  snapToGrid: boolean;
  /** Grid size in pixels */
  gridSize: number;
  /** Enable snap to elements */
  snapToElements: boolean;
  /** Snap threshold in pixels */
  snapThreshold: number;
  /** Enable snap to guides */
  snapToGuides: boolean;
  /** Rotation snap angles (degrees) */
  rotationSnapAngles: number[];
}

/** Snap result with bounds and edges */
export interface SnapResult {
  bounds: TransformBounds;
  edges: SnappedEdges;
}

// =============================================================================
// MODIFIER KEYS
// =============================================================================

/** Modifier keys state */
export interface ModifierKeys {
  shift: boolean;
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
}

// =============================================================================
// RESIZE OPTIONS & STATE
// =============================================================================

/** Resize options */
export interface ResizeOptions {
  /** Size constraints */
  constraints?: Partial<SizeConstraints>;
  /** Snap configuration */
  snap?: Partial<SnapConfig>;
  /** Enable rotation */
  allowRotation?: boolean;
  /** Enable multi-element resize */
  multiSelect?: boolean;
  /** Preserve corner radius ratio */
  preserveCornerRadius?: boolean;
  /** Use transaction for undo */
  useTransaction?: boolean;
  /** Transaction label */
  transactionLabel?: string;
  /** Initial modifier keys state (from mouse event) */
  initialModifiers?: Partial<ModifierKeys>;
}

/** Resize state during operation */
export interface ResizeState {
  /** Element ID being resized */
  elementId: string;
  /** Additional elements for multi-select */
  additionalElementIds: string[];
  /** Active handle */
  handle: AnyHandle;
  /** Starting bounds */
  startBounds: TransformBounds;
  /** Additional element start bounds */
  additionalStartBounds: Map<string, TransformBounds>;
  /** Starting mouse position */
  startMouse: { x: number; y: number };
  /** Current mouse position */
  currentMouse: { x: number; y: number };
  /** Original aspect ratio */
  aspectRatio: number;
  /** Keyboard modifiers */
  modifiers: ModifierKeys;
  /** Size constraints */
  constraints: SizeConstraints;
  /** Snap configuration */
  snap: SnapConfig;
  /** Center point for center-based resize */
  centerPoint: { x: number; y: number };
  /** Starting rotation angle */
  startRotation: number;
  /** Current rotation angle */
  currentRotation: number;
  /** Options */
  options: ResizeOptions;
  /** Snapped edges for visual feedback */
  snappedEdges: SnappedEdges;
  /** Last applied bounds (for RAF throttling) */
  lastAppliedBounds: TransformBounds | null;
  /** Animation frame ID */
  rafId: number | null;
  /** Parent and canvas boundary constraints */
  boundaryConstraints: BoundaryConstraints;
}

// =============================================================================
// EVENTS
// =============================================================================

/** Resize event data */
export interface ResizeEventData {
  elementId: string;
  additionalElementIds?: string[];
  oldBounds: TransformBounds;
  newBounds: TransformBounds;
  handle: AnyHandle;
  modifiers: ModifierKeys;
  snappedEdges?: SnappedEdges;
}
