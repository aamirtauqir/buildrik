/**
 * Drag Visual Feedback Hook
 * Manages visual indicators during drag operations
 * Professional minimalist approach - no infinite animations
 *
 * @module components/Canvas/hooks/useDragVisuals
 * @license BSD-3-Clause
 */

import * as React from "react";
import { cleanupDropIndicators } from "../../../shared/utils/dragDrop";
import type { DropPosition } from "./useDragSession";

// =============================================================================
// TYPES
// =============================================================================

export interface UseDragVisualsOptions {
  canvasRef: React.RefObject<HTMLDivElement>;
}

export interface UseDragVisualsResult {
  /** Set drop target indicator on element */
  showDropTarget: (targetEl: HTMLElement, position: DropPosition) => void;
  /** Set invalid drop indicator on element */
  showInvalidTarget: (targetEl: HTMLElement) => void;
  /** Clear all visual indicators */
  clearAllIndicators: () => void;
  /** Clear drop target indicator only */
  clearDropTarget: () => void;
  /** Clear invalid indicator only */
  clearInvalidTarget: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to manage visual feedback during drag operations
 * Handles drop indicators and invalid indicators with professional styling
 */
export function useDragVisuals({ canvasRef }: UseDragVisualsOptions): UseDragVisualsResult {
  // Cache refs for indicator elements (avoid repeated DOM queries)
  const dropTargetElRef = React.useRef<HTMLElement | null>(null);
  const invalidTargetElRef = React.useRef<HTMLElement | null>(null);

  /**
   * Show drop target indicator on element
   */
  const showDropTarget = React.useCallback((targetEl: HTMLElement, position: DropPosition) => {
    // Clear previous drop target
    if (dropTargetElRef.current && dropTargetElRef.current !== targetEl) {
      dropTargetElRef.current.removeAttribute("data-drop-target");
    }

    targetEl.setAttribute("data-drop-target", "true");
    if (position) {
      targetEl.setAttribute("data-drop-position", position);
    }
    dropTargetElRef.current = targetEl;
  }, []);

  /**
   * Show invalid drop indicator on element
   */
  const showInvalidTarget = React.useCallback((targetEl: HTMLElement) => {
    // Clear previous invalid target
    if (invalidTargetElRef.current) {
      invalidTargetElRef.current.removeAttribute("data-drop-invalid");
    }

    targetEl.setAttribute("data-drop-invalid", "true");
    targetEl.removeAttribute("data-drop-target");
    invalidTargetElRef.current = targetEl;

    // Also clear from drop target ref if same element
    if (dropTargetElRef.current === targetEl) {
      dropTargetElRef.current = null;
    }
  }, []);

  /**
   * Clear drop target indicator
   */
  const clearDropTarget = React.useCallback(() => {
    if (dropTargetElRef.current) {
      dropTargetElRef.current.removeAttribute("data-drop-target");
      dropTargetElRef.current.removeAttribute("data-drop-position");
      dropTargetElRef.current = null;
    }
  }, []);

  /**
   * Clear invalid target indicator
   */
  const clearInvalidTarget = React.useCallback(() => {
    if (invalidTargetElRef.current) {
      invalidTargetElRef.current.removeAttribute("data-drop-invalid");
      invalidTargetElRef.current = null;
    }
  }, []);

  /**
   * Clear all visual indicators
   */
  const clearAllIndicators = React.useCallback(() => {
    // Use unified cleanup from utils
    cleanupDropIndicators(canvasRef.current);

    // Reset refs
    dropTargetElRef.current = null;
    invalidTargetElRef.current = null;
  }, [canvasRef]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      clearAllIndicators();
    };
  }, [clearAllIndicators]);

  return {
    showDropTarget,
    showInvalidTarget,
    clearAllIndicators,
    clearDropTarget,
    clearInvalidTarget,
  };
}
