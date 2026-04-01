/**
 * Drag Manager Types
 * Type definitions for the DragManager engine component
 *
 * @module engine/drag/types
 * @license BSD-3-Clause
 */

import type { Point } from "../../shared/types";
import type { DragData, DropPosition } from "../../shared/utils/dragDrop/types";

// =============================================================================
// STATE MACHINE
// =============================================================================

/** Drag operation lifecycle states */
export type DragPhase = "idle" | "pending" | "dragging" | "idle";

/** Complete drag operation state snapshot */
export interface DragOperation {
  /** Unique session ID */
  sessionId: string;
  /** Current phase */
  phase: Exclude<DragPhase, "idle">;
  /** Structured drag payload */
  data: DragData;
  /** Where the drag originated */
  source: DragSource;
  /** Current mouse/touch position */
  currentPosition: Point;
  /** Current drop target (if any) */
  targetId: string | null;
  /** Drop position relative to target */
  dropPosition: DropPosition | null;
  /** Whether current target is valid */
  isValidTarget: boolean;
  /** Timestamp when drag started */
  startedAt: number;
}

/** Where a drag operation started from */
export type DragSource = "canvas" | "panel" | "external";

// =============================================================================
// EVENT PAYLOADS
// =============================================================================

export interface DragStartPayload {
  sessionId: string;
  data: DragData;
  source: DragSource;
  startPosition: Point;
}

export interface DragMovePayload {
  sessionId: string;
  currentPosition: Point;
  targetId: string | null;
  dropPosition: DropPosition | null;
  isValidTarget: boolean;
}

export interface DragEndPayload {
  sessionId: string;
  targetId: string | null;
  dropPosition: DropPosition | null;
  success: boolean;
}

export interface DragCancelPayload {
  sessionId: string;
  reason?: string;
}
