/**
 * Geometry Type Definitions
 * Centralized types for points, rectangles, and spatial operations
 *
 * @module types/geometry
 * @license BSD-3-Clause
 */

/**
 * 2D point with x and y coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Rectangle with position and dimensions
 * Uses x/y for top-left corner (canvas coordinate system)
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Edge insets (margin/padding)
 */
export interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Transform properties
 */
export interface Transform {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number;
  skewX?: number;
  skewY?: number;
}

/**
 * Constraint bounds for resize/drag operations
 */
export interface Bounds {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

/**
 * Extended rect with element info (for drag-drop)
 */
export interface ElementRect extends Rect {
  elementId: string;
  elementType: string;
}

/**
 * Line segment
 */
export interface Line {
  start: Point;
  end: Point;
}

/**
 * Anchor position
 */
export type AnchorPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/**
 * Direction
 */
export type Direction = "up" | "down" | "left" | "right";

/**
 * Axis
 */
export type Axis = "horizontal" | "vertical" | "both";
