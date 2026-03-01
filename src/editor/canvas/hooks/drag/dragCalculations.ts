/**
 * Drag Calculations - Pure functions for drag position and validation
 * Extracted from useCanvasDragDrop to reduce file size
 *
 * @module components/Canvas/hooks/drag/dragCalculations
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { ElementType } from "../../../../shared/types";
import { validateElementDrop } from "../../../../shared/utils/dragDrop";
import type { InvalidDropReason } from "../../../../shared/utils/dragDrop/dropValidation";
import {
  isHorizontalLayout,
  calculateDropPosition2D,
} from "../../../../shared/utils/dragDrop/positioning";
import { canNestElement } from "../../../../shared/utils/nesting";
import type { DropPosition, DropSlotRect, BreadcrumbItem } from "../useDragSession";

// =============================================================================
// DROP POSITION CALCULATION
// =============================================================================

export interface DropPositionResult {
  position: DropPosition;
  isParentHorizontal: boolean;
}

/**
 * Calculate drop position (before/after/inside) based on cursor position
 */
export function calculateDropPositionFromCursor(
  clientX: number,
  clientY: number,
  targetRect: DOMRect,
  parentElement: HTMLElement | null
): DropPositionResult {
  const isParentHorizontal = parentElement ? isHorizontalLayout(parentElement) : false;

  const position = calculateDropPosition2D(
    clientX,
    clientY,
    targetRect,
    isParentHorizontal,
    0.25 // 25% threshold
  ) as DropPosition;

  return { position, isParentHorizontal };
}

// =============================================================================
// DROP SLOT RECT CALCULATION
// =============================================================================

export interface DropSlotCalculationInput {
  position: DropPosition;
  targetRect: DOMRect;
  canvasRect: DOMRect;
  isParentHorizontal: boolean;
}

/**
 * Calculate animated drop slot preview rectangle
 */
export function calculateDropSlotRect(input: DropSlotCalculationInput): DropSlotRect | null {
  const { position, targetRect, canvasRect, isParentHorizontal } = input;

  // Only show slot for before/after positions
  if (position !== "before" && position !== "after") {
    return null;
  }

  const slotHeight = 48; // Animated slot height in pixels
  const slotWidth = 48; // Animated slot width for horizontal layouts

  if (isParentHorizontal) {
    // Horizontal layout: slot appears on left/right side
    return {
      x:
        position === "before"
          ? targetRect.left - canvasRect.left - slotWidth / 2
          : targetRect.right - canvasRect.left - slotWidth / 2,
      y: targetRect.top - canvasRect.top,
      width: slotWidth,
      height: targetRect.height,
      isHorizontal: true,
    };
  }

  // Vertical layout: slot appears on top/bottom
  return {
    x: targetRect.left - canvasRect.left,
    y:
      position === "before"
        ? targetRect.top - canvasRect.top - slotHeight / 2
        : targetRect.bottom - canvasRect.top - slotHeight / 2,
    width: targetRect.width,
    height: slotHeight,
    isHorizontal: false,
  };
}

// =============================================================================
// DROP VALIDATION
// =============================================================================

export interface DropValidationInput {
  composer: Composer;
  draggingElementId: string | null;
  targetId: string;
  position: DropPosition;
  dataTransferTypes: readonly string[];
}

export interface DropValidationResult {
  isValid: boolean;
  reason: InvalidDropReason;
}

/**
 * Validate if drop is allowed for dragging elements or blocks
 */
export function validateDropOperation(input: DropValidationInput): DropValidationResult {
  const { composer, draggingElementId, targetId, position, dataTransferTypes } = input;

  // Element drag validation
  if (draggingElementId) {
    const draggingEl = composer.elements.getElement(draggingElementId);
    const targetElement = composer.elements.getElement(targetId);

    if (draggingEl && targetElement) {
      const parentElement = position !== "inside" ? targetElement.getParent?.() || null : null;

      const validation = validateElementDrop(draggingEl, targetElement, position, parentElement);

      return {
        isValid: validation.isValid,
        reason: validation.reason,
      };
    }
  }

  // Block drag validation
  if (dataTransferTypes.includes("block")) {
    const targetElement = composer.elements.getElement(targetId);
    if (targetElement) {
      const targetType = targetElement.getType() as ElementType;
      const targetCanContainChildren = canNestElement("container", targetType);

      if (!targetCanContainChildren && position === "inside") {
        const hasParent = Boolean(targetElement.getParent?.());
        if (!hasParent) {
          return {
            isValid: false,
            reason: "CANNOT_NEST_IN_TARGET",
          };
        }
      }
    }
  }

  return { isValid: true, reason: null };
}

// =============================================================================
// BREADCRUMB PATH CALCULATION
// =============================================================================

/**
 * Build breadcrumb path by walking up parent chain
 */
export function buildBreadcrumbPath(composer: Composer, targetId: string): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [];
  let currentElement = composer.elements.getElement(targetId);

  while (currentElement) {
    const elementId = currentElement.getId();
    const elementType = (currentElement.getType() as string) || "element";
    const customName = currentElement.getAttributes?.()?.["data-name"] as string | undefined;
    const label = customName || elementType.charAt(0).toUpperCase() + elementType.slice(1);

    path.unshift({
      id: elementId,
      type: elementType,
      label,
      isCurrent: elementId === targetId,
    });

    currentElement = currentElement.getParent?.() ?? undefined;
  }

  return path;
}

// =============================================================================
// FRESH DROP TARGET CALCULATION
// =============================================================================

export interface FreshDropTargetResult {
  targetId: string | null;
  targetElement: HTMLElement | null;
  dropPosition: DropPosition;
}

/**
 * Calculate fresh drop target at drop time (avoids stale state from throttling)
 */
export function calculateFreshDropTarget(
  clientX: number,
  clientY: number,
  composer: Composer,
  canvasRef: React.RefObject<HTMLDivElement>,
  findDropTargetElement: (x: number, y: number) => HTMLElement | null
): FreshDropTargetResult {
  let freshDropTarget = findDropTargetElement(clientX, clientY);
  let freshTargetId = freshDropTarget?.getAttribute("data-aqb-id") || null;

  // Validate target exists in composer (DOM may have been recreated)
  if (freshTargetId && !composer.elements.getElement(freshTargetId)) {
    let currentEl = freshDropTarget?.parentElement;
    while (currentEl && !currentEl.hasAttribute("data-aqb-canvas")) {
      const parentId = currentEl.getAttribute("data-aqb-id");
      if (parentId && composer.elements.getElement(parentId)) {
        freshTargetId = parentId;
        freshDropTarget = currentEl;
        break;
      }
      currentEl = currentEl.parentElement;
    }
    // If still not found, reset to null
    if (freshTargetId && !composer.elements.getElement(freshTargetId)) {
      freshTargetId = null;
      freshDropTarget = null;
    }
  }

  // Fallback to root if no target found
  if (!freshTargetId) {
    const page = composer.elements.getActivePage();
    freshTargetId = page?.root?.id || null;
  }

  // Calculate fresh drop position.
  // Both clientX/clientY and rect (from getBoundingClientRect) are in viewport
  // space — already scroll-invariant. No scroll offset correction needed.
  let freshDropPosition: DropPosition = "inside";
  if (freshTargetId && canvasRef.current) {
    const targetDomEl = canvasRef.current.querySelector(
      `[data-aqb-id="${freshTargetId}"]`
    ) as HTMLElement | null;

    if (targetDomEl) {
      const rect = targetDomEl.getBoundingClientRect();
      const result = calculateDropPositionFromCursor(
        clientX,
        clientY,
        rect,
        targetDomEl.parentElement
      );
      freshDropPosition = result.position;
    }
  }

  return {
    targetId: freshTargetId,
    targetElement: freshDropTarget,
    dropPosition: freshDropPosition,
  };
}
