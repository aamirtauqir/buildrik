/**
 * Aquibra Drag Manager
 * SSOT for drag & drop operations — state machine + event emitter
 *
 * Enforces the drag lifecycle: IDLE → PENDING → DRAGGING → IDLE
 * Emits canonical drag events defined in constants/events.ts
 *
 * @module engine/drag/DragManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants";
import type { Point } from "../../shared/types";
import type { DragData, DropPosition } from "../../shared/utils/dragDrop/types";
import type { Composer } from "../Composer";
import type {
  DragCancelPayload,
  DragEndPayload,
  DragMovePayload,
  DragOperation,
  DragSource,
  DragStartPayload,
} from "./types";

// =============================================================================
// THROTTLE HELPER
// =============================================================================

const MOVE_THROTTLE_MS = 16; // ~60fps

// =============================================================================
// DRAG MANAGER
// =============================================================================

/**
 * Manages drag operation state as SSOT.
 *
 * Invariants:
 * 1. Only ONE drag operation active at any time
 * 2. `start()` MUST precede any `move()`
 * 3. `end()` OR `cancel()` MUST terminate every drag
 */
export class DragManager {
  private composer: Composer;
  private operation: DragOperation | null = null;
  private sessionCounter = 0;
  private lastMoveEmit = 0;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Start a new drag operation
   * @throws if a drag is already active (invariant 1)
   */
  start(data: DragData, source: DragSource, startPosition: Point): void {
    if (this.operation) {
      // Enforce single-drag invariant: auto-cancel stale drag
      this.cancel("Replaced by new drag");
    }

    const sessionId = this.nextSessionId();

    this.operation = {
      sessionId,
      phase: "pending",
      data,
      source,
      currentPosition: startPosition,
      targetId: null,
      dropPosition: null,
      isValidTarget: false,
      startedAt: Date.now(),
    };

    const payload: DragStartPayload = {
      sessionId,
      data,
      source,
      startPosition,
    };

    this.composer.emit(EVENTS.DRAG_START, payload);
  }

  /**
   * Update drag position and target
   * Throttled to ~60fps for event emission
   */
  move(
    currentPosition: Point,
    targetId: string | null = null,
    dropPosition: DropPosition | null = null,
    isValidTarget = false
  ): void {
    if (!this.operation) return;

    // Transition pending → dragging on first move
    if (this.operation.phase === "pending") {
      this.operation.phase = "dragging";
    }

    this.operation.currentPosition = currentPosition;
    this.operation.targetId = targetId;
    this.operation.dropPosition = dropPosition;
    this.operation.isValidTarget = isValidTarget;

    // Throttle event emission
    const now = Date.now();
    if (now - this.lastMoveEmit < MOVE_THROTTLE_MS) return;
    this.lastMoveEmit = now;

    const payload: DragMovePayload = {
      sessionId: this.operation.sessionId,
      currentPosition,
      targetId,
      dropPosition,
      isValidTarget,
    };

    this.composer.emit(EVENTS.DRAG_MOVE, payload);
  }

  /**
   * Complete the drag operation
   */
  end(success: boolean): void {
    if (!this.operation) return;

    const payload: DragEndPayload = {
      sessionId: this.operation.sessionId,
      targetId: this.operation.targetId,
      dropPosition: this.operation.dropPosition,
      success,
    };

    this.operation = null;
    this.lastMoveEmit = 0;

    this.composer.emit(EVENTS.DRAG_END, payload);

    if (success && payload.targetId) {
      this.composer.emit(EVENTS.DROP_ZONE_DROP, payload);
    }
  }

  /**
   * Cancel the current drag operation
   */
  cancel(reason?: string): void {
    if (!this.operation) return;

    const payload: DragCancelPayload = {
      sessionId: this.operation.sessionId,
      reason,
    };

    this.operation = null;
    this.lastMoveEmit = 0;

    this.composer.emit(EVENTS.DRAG_CANCEL, payload);
  }

  // ---------------------------------------------------------------------------
  // QUERY API
  // ---------------------------------------------------------------------------

  /** Get current drag operation snapshot (or null if idle) */
  getOperation(): Readonly<DragOperation> | null {
    return this.operation;
  }

  /** Whether a drag is currently active */
  isDragging(): boolean {
    return this.operation !== null;
  }

  /** Get the phase of the current operation */
  getPhase(): "idle" | "pending" | "dragging" {
    return this.operation?.phase ?? "idle";
  }

  /** Get the current drop target ID */
  getTargetId(): string | null {
    return this.operation?.targetId ?? null;
  }

  // ---------------------------------------------------------------------------
  // LIFECYCLE
  // ---------------------------------------------------------------------------

  /**
   * Clean up any active drag (called during Composer.destroy)
   */
  destroy(): void {
    if (this.operation) {
      this.cancel("Composer destroyed");
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE
  // ---------------------------------------------------------------------------

  private nextSessionId(): string {
    this.sessionCounter += 1;
    return `drag-${this.sessionCounter}-${Date.now()}`;
  }
}
