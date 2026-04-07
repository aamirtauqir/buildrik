/**
 * Drag & Drop Config Types
 * Configuration and auxiliary type definitions
 *
 * @module utils/dragDrop/configTypes
 * @license BSD-3-Clause
 */

import type { ElementType, Point } from "../../types";

// Forward declare types to avoid circular imports
// These are defined in types.ts which re-exports them from here
type DragData = import("./types").DragData;
type DragSession = import("./types").DragSession;

// =============================================================================
// EVENTS
// =============================================================================

/** Drag event types */
export type DragEventType =
  | "drag:start"
  | "drag:move"
  | "drag:enter"
  | "drag:leave"
  | "drag:over"
  | "drag:drop"
  | "drag:end"
  | "drag:cancel";

/** Drag event payload */
export interface DragEvent {
  type: DragEventType;
  session: DragSession;
  /** Original DOM event */
  originalEvent?: MouseEvent | TouchEvent | KeyboardEvent;
  /** Prevent default drop behavior */
  preventDefault: () => void;
  /** Whether default was prevented */
  defaultPrevented: boolean;
}

/** Drag event handler */
export type DragEventHandler = (event: DragEvent) => void;

// =============================================================================
// DROP ZONES
// =============================================================================

/** Drop zone configuration */
export interface DropZone {
  /** Unique zone ID */
  id: string;
  /** Zone element or selector */
  element: HTMLElement | string;
  /** Accepted element types */
  accepts?: ElementType[];
  /** Rejected element types */
  rejects?: ElementType[];
  /** Custom validation function */
  validate?: (data: DragData) => boolean;
  /** Priority (higher = checked first) */
  priority?: number;
  /** Zone is currently active */
  active?: boolean;
  /** Custom data */
  data?: Record<string, unknown>;
}

/** Drop zone registry */
export interface DropZoneRegistry {
  zones: Map<string, DropZone>;
  register: (zone: DropZone) => void;
  unregister: (id: string) => void;
  findZone: (point: Point) => DropZone | null;
  validateDrop: (zone: DropZone, data: DragData) => boolean;
}

// =============================================================================
// TOUCH SUPPORT
// =============================================================================

/** Touch drag state */
export interface TouchDragState {
  /** Touch identifier */
  touchId: number;
  /** Starting position */
  startPosition: Point;
  /** Current position */
  currentPosition: Point;
  /** Long press timer */
  longPressTimer: number | null;
  /** Is long press triggered */
  isLongPress: boolean;
  /** Touch start time */
  startTime: number;
  /** Target element */
  targetElement: HTMLElement | null;
}

// =============================================================================
// KEYBOARD SUPPORT
// =============================================================================

/** Keyboard drag step sizes */
export interface KeyboardDragConfig {
  /** Small step (arrow keys) */
  smallStep: number;
  /** Large step (arrow + shift) */
  largeStep: number;
  /** Index step (for list reordering) */
  indexStep: number;
}

// =============================================================================
// DRAG GHOST OPTIONS
// =============================================================================

/** Options for creating drag ghost */
export interface DragGhostOptions {
  /** Scale factor for ghost */
  scale?: number;
  /** Opacity */
  opacity?: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Custom styles */
  styles?: Partial<CSSStyleDeclaration>;
  /** Clone the element or use custom content */
  clone?: boolean;
  /** Custom content (if not cloning) */
  content?: string | HTMLElement;
  /** Offset from cursor */
  offset?: Point;
}

/** Auto-scroll configuration */
export interface AutoScrollConfig {
  /** Container to scroll */
  container: HTMLElement;
  /** Threshold distance from edge to start scrolling */
  threshold?: number;
  /** Scroll speed in pixels per frame */
  speed?: number;
  /** Maximum scroll speed */
  maxSpeed?: number;
  /** Acceleration factor */
  acceleration?: number;
}
