/**
 * Canvas Resize Handler - Orchestrates resize operations using modular components
 * @module engine/canvas/ResizeHandler
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants";
import type { SelectionBox } from "../../shared/types/canvas";
import { devLog } from "../../shared/utils/devLogger";
import type { Composer } from "../Composer";
import { EventEmitter } from "../EventEmitter";
import { getElementBounds, getElementRotation } from "./canvasGeometry";
import {
  DEFAULT_CONSTRAINTS,
  DEFAULT_SNAP_CONFIG,
  ELEMENT_CONSTRAINTS,
  DEFAULT_HANDLE_HIT_AREA,
  DEFAULT_BORDER_HIT_WIDTH,
  MOVE_THROTTLE_MS,
} from "./resize/constants";
import { getBoundaryConstraints } from "./resize/ConstraintManager";
import {
  applyBoundsToDOM,
  applyMultiResizeToDOM,
  applyBoundsToModel,
  applyMultiResizeToModel,
} from "./resize/DOMUpdater";
import { hitTestHandles, hitTestRotation, hitTestBorder, hitTest } from "./resize/HitTester";
import { ResizeInputManager, InputModifiers } from "./resize/ResizeInputManager";
import { calculateResizeBounds, calculateRotationBounds } from "./resize/ResizeOrchestrator";
import type {
  HandlePosition,
  AnyHandle,
  TransformBounds,
  SizeConstraints,
  SnapConfig,
  ResizeOptions,
  ResizeState,
  ResizeEventData,
} from "./resize/types";
import { getDOMElement, getCursor } from "./resize/utils";

// Re-export types for external consumers
export type {
  HandlePosition,
  AnyHandle,
  Bounds,
  TransformBounds,
  SizeConstraints,
  SnapConfig,
  ResizeOptions,
  ResizeState,
  ResizeEventData,
} from "./resize/types";

/**
 * ResizeHandler - Professional resize management
 * Orchestrates resize operations with Figma-level precision
 */
export class ResizeHandler extends EventEmitter {
  private composer: Composer;
  private resizeState: ResizeState | null = null;
  private inputManager: ResizeInputManager;
  private isResizing = false;
  private isRotating = false;

  // Configuration
  private handleHitArea = DEFAULT_HANDLE_HIT_AREA;
  private borderHitWidth = DEFAULT_BORDER_HIT_WIDTH;

  // Performance
  private lastMoveTime = 0;

  constructor(composer: Composer) {
    super();
    this.composer = composer;

    // Initialize Input Manager with callbacks
    this.inputManager = new ResizeInputManager({
      onMove: (x, y) => this.handleMouseMove(x, y),
      onEnd: (x, y) => this.finishResize(x, y),
      onCancel: () => this.cancelResize(),
      onModifierChange: (mods) => this.handleModifierChange(mods),
    });
  }

  /** Start resize operation */
  startResize(
    elementId: string,
    handle: AnyHandle,
    mouseX: number,
    mouseY: number,
    options: ResizeOptions = {}
  ): boolean {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return false;

    const domElement = getDOMElement(elementId);
    if (!domElement) return false;

    const bounds = getElementBounds(domElement);
    if (!bounds) return false;

    // Get element type for constraints
    const elementType = element.getType?.() || "container";
    const typeConstraints = ELEMENT_CONSTRAINTS[elementType] || {};

    // Merge configurations
    const constraints: SizeConstraints = {
      ...DEFAULT_CONSTRAINTS,
      ...typeConstraints,
      ...options.constraints,
    };

    const snap: SnapConfig = {
      ...DEFAULT_SNAP_CONFIG,
      ...options.snap,
    };

    // Get rotation and center
    const rotation = getElementRotation(domElement);
    const centerPoint = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };

    // Get boundary constraints
    devLog("ResizeHandler", `Calling getBoundaryConstraints for ${elementId}`);
    const boundaryConstraints = getBoundaryConstraints(domElement, bounds);
    devLog("ResizeHandler", "Constraints received:", boundaryConstraints);

    // Create resize state
    this.resizeState = {
      elementId,
      additionalElementIds: [],
      handle,
      startBounds: { ...bounds, rotation },
      additionalStartBounds: new Map(),
      startMouse: { x: mouseX, y: mouseY },
      currentMouse: { x: mouseX, y: mouseY },
      aspectRatio: bounds.width / (bounds.height || 1),
      modifiers: {
        shift: options.initialModifiers?.shift ?? false,
        alt: options.initialModifiers?.alt ?? false,
        ctrl: options.initialModifiers?.ctrl ?? false,
        meta: options.initialModifiers?.meta ?? false,
      },
      constraints,
      snap,
      centerPoint,
      startRotation: rotation,
      currentRotation: rotation,
      options,
      snappedEdges: {},
      lastAppliedBounds: null,
      rafId: null,
      boundaryConstraints,
    };

    this.isResizing = true;
    this.isRotating = handle === "rotation";

    // Begin transaction for undo
    if (options.useTransaction !== false) {
      this.composer.beginTransaction?.(options.transactionLabel || "resize-element");
    }

    // Setup
    this.inputManager.attach();
    document.body.style.userSelect = "none";
    document.body.style.cursor = getCursor(handle);

    // Emit start event
    this.emitResizeEvent(EVENTS.RESIZE_START, bounds, bounds);

    return true;
  }

  /** Start rotation operation */
  startRotation(
    elementId: string,
    mouseX: number,
    mouseY: number,
    options: ResizeOptions = {}
  ): boolean {
    return this.startResize(elementId, "rotation", mouseX, mouseY, {
      ...options,
      allowRotation: true,
    });
  }

  /** Start multi-element resize (reserved for future) */
  startMultiResize(
    elementIds: string[],
    handle: HandlePosition,
    mouseX: number,
    mouseY: number,
    options: ResizeOptions = {}
  ): boolean {
    if (!elementIds?.length) return false;
    return this.startResize(elementIds[0], handle, mouseX, mouseY, {
      ...options,
      multiSelect: true,
    });
  }

  /** Keyboard resize */
  keyboardResize(
    elementId: string,
    direction: "up" | "down" | "left" | "right",
    amount = 1
  ): boolean {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return false;

    const domElement = getDOMElement(elementId);
    if (!domElement) return false;

    const bounds = getElementBounds(domElement);
    if (!bounds) return false;

    const newBounds = { ...bounds };

    switch (direction) {
      case "up":
        newBounds.height = Math.max(10, bounds.height - amount);
        break;
      case "down":
        newBounds.height = bounds.height + amount;
        break;
      case "left":
        newBounds.width = Math.max(10, bounds.width - amount);
        break;
      case "right":
        newBounds.width = bounds.width + amount;
        break;
    }

    applyBoundsToModel(elementId, newBounds, this.composer);
    applyBoundsToDOM(elementId, newBounds);
    this.composer.canvasIndicators?.createSelectionBox(elementId);

    return true;
  }

  /** Cancel resize and restore original bounds */
  cancelResize(): void {
    if (!this.resizeState) return;

    const state = this.resizeState;

    if (state.rafId !== null) cancelAnimationFrame(state.rafId);

    applyBoundsToDOM(state.elementId, state.startBounds);
    for (const [elId, bounds] of state.additionalStartBounds) applyBoundsToDOM(elId, bounds);

    if (state.options.useTransaction !== false) {
      try {
        this.composer.endTransaction?.();
        this.composer.history?.undo?.();
      } catch {
        /* ignore */
      }
    }
    this.composer.canvasIndicators?.createSelectionBox(state.elementId);
    this.emit("resize:cancel", { elementId: state.elementId });
    this.composer.emit?.("resize:cancel", { elementId: state.elementId });

    this.cleanup();
  }

  // Hit testing delegation
  hitTestHandles(
    selectionBox: SelectionBox,
    mouseX: number,
    mouseY: number
  ): HandlePosition | null {
    return hitTestHandles(selectionBox, mouseX, mouseY, this.handleHitArea);
  }

  hitTestRotation(selectionBox: SelectionBox, mouseX: number, mouseY: number): boolean {
    return hitTestRotation(selectionBox, mouseX, mouseY, this.handleHitArea);
  }

  hitTestBorder(selectionBox: SelectionBox, mouseX: number, mouseY: number): HandlePosition | null {
    return hitTestBorder(selectionBox, mouseX, mouseY, this.borderHitWidth);
  }

  hitTest(selectionBox: SelectionBox, mouseX: number, mouseY: number): AnyHandle | null {
    return hitTest(selectionBox, mouseX, mouseY, this.handleHitArea, this.borderHitWidth);
  }

  // Event handlers
  private handleMouseMove(mouseX: number, mouseY: number): void {
    if (!this.resizeState) return;

    const now = performance.now();
    if (now - this.lastMoveTime < MOVE_THROTTLE_MS) return;
    this.lastMoveTime = now;

    this.processMove(mouseX, mouseY);
  }

  private handleModifierChange(modifiers: InputModifiers): void {
    const state = this.resizeState;
    if (!state) return;

    state.modifiers = { ...modifiers };
    this.processMove(state.currentMouse.x, state.currentMouse.y);
  }

  // Core resize logic
  private processMove(mouseX: number, mouseY: number): void {
    if (!this.resizeState) return;

    const state = this.resizeState;
    state.currentMouse = { x: mouseX, y: mouseY };

    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    state.rafId = requestAnimationFrame(() => {
      if (!this.resizeState || this.resizeState !== state) return;
      state.rafId = null;

      const newBounds = this.isRotating
        ? calculateRotationBounds(state, mouseX, mouseY)
        : calculateResizeBounds(state, mouseX, mouseY, this.composer);

      applyBoundsToDOM(state.elementId, newBounds);

      if (state.additionalElementIds.length > 0) {
        applyMultiResizeToDOM(state, newBounds);
      }

      this.updateIndicators(state.elementId);
      state.lastAppliedBounds = newBounds;

      this.emitResizeEvent(EVENTS.RESIZE_MOVE, state.startBounds, newBounds);
    });
  }

  private finishResize(mouseX: number, mouseY: number): void {
    if (!this.resizeState) return;

    const state = this.resizeState;

    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId);
    }

    const finalBounds = this.isRotating
      ? calculateRotationBounds(state, mouseX, mouseY)
      : calculateResizeBounds(state, mouseX, mouseY, this.composer);

    applyBoundsToModel(state.elementId, finalBounds, this.composer);

    if (state.additionalElementIds.length > 0) {
      applyMultiResizeToModel(state, finalBounds, this.composer);
    }

    if (state.options.useTransaction !== false) {
      this.composer.endTransaction?.();
    }

    this.emitResizeEvent(EVENTS.RESIZE_END, state.startBounds, finalBounds);
    this.cleanup();
  }

  private updateIndicators(elementId: string): void {
    const indicators = this.composer.canvasIndicators;
    if (!indicators) return;

    indicators.createSelectionBox?.(elementId);
    indicators.showDimensionOverlay?.(elementId);
  }

  private cleanup(): void {
    this.inputManager.detach();
    document.body.style.userSelect = "";
    document.body.style.cursor = "";

    if (this.resizeState?.rafId != null) {
      cancelAnimationFrame(this.resizeState.rafId);
      this.resizeState.rafId = null;
    }

    this.resizeState = null;
    this.isResizing = false;
    this.isRotating = false;
  }

  private emitResizeEvent(
    event: string,
    oldBounds: TransformBounds,
    newBounds: TransformBounds
  ): void {
    if (!this.resizeState) return;

    const data: ResizeEventData = {
      elementId: this.resizeState.elementId,
      additionalElementIds: this.resizeState.additionalElementIds,
      oldBounds,
      newBounds,
      handle: this.resizeState.handle,
      modifiers: { ...this.resizeState.modifiers },
      snappedEdges: { ...this.resizeState.snappedEdges },
    };

    this.emit(event, data);
    this.composer.emit?.(event, data);
  }

  // Public getters & config
  isCurrentlyResizing(): boolean {
    return this.isResizing;
  }
  isCurrentlyRotating(): boolean {
    return this.isRotating;
  }
  getResizeState(): ResizeState | null {
    return this.resizeState;
  }
  getCurrentBounds(): TransformBounds | null {
    return this.resizeState?.lastAppliedBounds || null;
  }
  setHandleHitArea(area: number): void {
    this.handleHitArea = area;
  }
  setBorderHitWidth(width: number): void {
    this.borderHitWidth = width;
  }

  destroy(): void {
    if (this.isResizing || this.isRotating) this.cancelResize();
    this.removeAllListeners();
  }
}

export default ResizeHandler;
