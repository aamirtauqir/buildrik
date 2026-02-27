/**
 * Drag & Drop Core Types
 * Core type definitions for drag & drop system
 *
 * @module utils/dragDrop/types
 * @license BSD-3-Clause
 */

import type { Element } from "../../../engine/elements/Element";
import type { ElementType, Point, Rect } from "../../types";

// Re-export geometry types for convenience
export type { Point, Rect } from "../../types";

// =============================================================================
// CORE TYPES
// =============================================================================

/** Drop position relative to target */
export type DropPosition = "before" | "after" | "inside" | "first" | "last";

/** Drag operation state */
export type DragState =
  | "idle"
  | "pending"
  | "dragging"
  | "over-valid"
  | "over-invalid"
  | "dropping"
  | "cancelled";

/** Drag source type */
export type DragSourceType = "element" | "block" | "external" | "multi";

/** Axis constraint */
export type AxisConstraint = "none" | "x" | "y";

// =============================================================================
// DRAG DATA TYPES
// =============================================================================

/** Base drag data */
interface DragDataBase {
  /** Unique drag session ID */
  sessionId: string;
  /** Timestamp when drag started */
  startTime: number;
  /** Starting mouse/touch position */
  startPosition: Point;
}

/** Drag data for existing element */
export interface DragDataElement extends DragDataBase {
  type: "element";
  elementId: string;
  elementType: ElementType;
  /** Original parent ID (for undo) */
  originalParentId?: string;
  /** Original index (for undo) */
  originalIndex?: number;
}

/** Drag data for new block from panel */
export interface DragDataBlock extends DragDataBase {
  type: "block";
  block: Partial<import("../../types").ElementData>;
}

/** Multi-element drag item */
export interface MultiDragElement {
  elementId: string;
  elementType: ElementType;
  originalParentId?: string;
  originalIndex?: number;
}

/** Drag data for multiple elements */
export interface DragDataMulti extends DragDataBase {
  type: "multi";
  elements: MultiDragElement[];
}

/** Drag data for external content */
export interface DragDataExternal extends DragDataBase {
  type: "external";
  files?: File[];
  text?: string;
  html?: string;
  url?: string;
}

/** Unknown drag data */
export interface DragDataUnknown {
  type: "unknown";
  sessionId?: string;
}

export type DragData =
  | DragDataElement
  | DragDataBlock
  | DragDataMulti
  | DragDataExternal
  | DragDataUnknown;

// =============================================================================
// EXTENDED GEOMETRY TYPES
// =============================================================================

/** Extended rect with element info */
export interface ElementRect extends Rect {
  elementId: string;
  elementType: ElementType;
}

// =============================================================================
// OPTIONS & RESULTS
// =============================================================================

/** Options for finding drop targets */
export interface FindDropTargetOptions {
  /** Element ID to skip (usually the source element being moved) */
  skipElementId?: string;
  /** Set of descendant IDs to skip (prevents circular nesting) */
  skipDescendantIds?: Set<string>;
  /** Whether to skip the current parent */
  skipCurrentParent?: boolean;
  /** Current parent element ID */
  currentParentId?: string;
  /** Preferred drop position */
  preferredPosition?: DropPosition;
  /** Edge threshold for position calculation (0-0.5) */
  edgeThreshold?: number;
}

/** Result of drop target search */
export interface DropTargetResult {
  /** Parent element where the child should be placed */
  parent: Element;
  /** Index within parent's children (undefined = append to end) */
  index?: number;
  /** Drop position that was used */
  position: DropPosition;
  /** Distance from drop point (for sorting candidates) */
  distance?: number;
}

/** Detailed result with failure info */
export interface DropTargetSearchResult {
  success: boolean;
  result?: DropTargetResult;
  /** Reason for failure (if success is false) */
  failureReason?: string;
  /** Number of elements checked */
  elementsChecked: number;
  /** All valid candidates found */
  candidates?: DropTargetResult[];
}

/** Drop indicator style info */
export interface DropIndicatorStyle {
  position: "top" | "bottom" | "left" | "right" | "overlay";
  rect: Rect;
  /** CSS class name suggestion */
  className?: string;
}

// =============================================================================
// DRAG SESSION TYPES
// =============================================================================

/** Drag constraints */
export interface DragConstraints {
  /** Lock to axis */
  axis: AxisConstraint;
  /** Boundary rect (container bounds) */
  bounds?: Rect;
  /** Snap to grid size */
  gridSize?: number;
  /** Minimum drag distance to start */
  minDistance?: number;
  /** Elements that cannot be drop targets */
  invalidTargets?: Set<string>;
  /** Elements that are valid drop targets (whitelist) */
  validTargets?: Set<string>;
}

/** Complete drag session state */
export interface DragSession {
  /** Unique session ID */
  id: string;
  /** Current state */
  state: DragState;
  /** Drag data */
  data: DragData;
  /** Starting position */
  startPosition: Point;
  /** Current position */
  currentPosition: Point;
  /** Delta from start */
  delta: Point;
  /** Current drop target element */
  dropTarget: HTMLElement | null;
  /** Current drop position */
  dropPosition: DropPosition | null;
  /** Is this a valid drop target? */
  isValidDrop: boolean;
  /** Ghost/preview element */
  ghostElement: HTMLElement | null;
  /** Auto-scroll timer */
  autoScrollTimer: number | null;
  /** Keyboard mode active */
  isKeyboardDrag: boolean;
  /** Touch mode active */
  isTouchDrag: boolean;
  /** Constraints */
  constraints: DragConstraints;
  /** Start time */
  startTime: number;
  /** Custom metadata */
  metadata: Record<string, unknown>;
}

// Re-export from config types
export type {
  DragEventType,
  DragEvent,
  DragEventHandler,
  DropZone,
  DropZoneRegistry,
  TouchDragState,
  KeyboardDragConfig,
  DragGhostOptions,
  AutoScrollConfig,
} from "./configTypes";
