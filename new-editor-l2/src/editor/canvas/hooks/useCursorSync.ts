/**
 * useCursorSync Hook
 * Tracks local cursor and syncs with collaboration
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useEffect, useCallback, useRef } from "react";
import type { Composer } from "../../../engine/Composer";
import type { CursorPosition } from "../../../shared/types/collaboration";

// ============================================================================
// TYPES
// ============================================================================

export interface UseCursorSyncOptions {
  /** Composer instance */
  composer: Composer | null;
  /** Reference to canvas element for coordinate calculation */
  canvasRef: React.RefObject<HTMLElement>;
  /** Throttle interval in ms (default: 50) */
  throttleMs?: number;
}

export interface UseCursorSyncResult {
  /** Call on mouse move in canvas */
  handleMouseMove: (e: React.MouseEvent) => void;
  /** Call when hovering an element */
  handleElementHover: (elementId: string | null) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook to sync local cursor position with collaboration
 *
 * Tracks cursor movement within the canvas and broadcasts position
 * to other collaborators. Includes throttling to avoid network spam.
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<HTMLDivElement>(null);
 * const { handleMouseMove, handleElementHover } = useCursorSync({
 *   composer,
 *   canvasRef,
 *   throttleMs: 50,
 * });
 *
 * return (
 *   <div
 *     ref={canvasRef}
 *     onMouseMove={handleMouseMove}
 *   >
 *     {elements.map(el => (
 *       <Element
 *         key={el.id}
 *         onMouseEnter={() => handleElementHover(el.id)}
 *         onMouseLeave={() => handleElementHover(null)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useCursorSync({
  composer,
  canvasRef,
  throttleMs = 50,
}: UseCursorSyncOptions): UseCursorSyncResult {
  const lastUpdateRef = useRef<number>(0);
  const currentElementRef = useRef<string | null>(null);

  /**
   * Update cursor position with throttling
   */
  const updateCursor = useCallback(
    (x: number, y: number, elementId: string | null) => {
      if (!composer?.collaboration?.isConnected()) return;

      const now = Date.now();
      if (now - lastUpdateRef.current < throttleMs) return;
      lastUpdateRef.current = now;

      const position: CursorPosition = {
        elementId,
        x,
        y,
      };

      composer.collaboration.updateCursor(position);
    },
    [composer, throttleMs]
  );

  /**
   * Handle mouse move events on the canvas
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      updateCursor(x, y, currentElementRef.current);
    },
    [canvasRef, updateCursor]
  );

  /**
   * Handle element hover state changes
   */
  const handleElementHover = useCallback((elementId: string | null) => {
    currentElementRef.current = elementId;
  }, []);

  /**
   * Clear cursor on unmount or disconnect
   */
  useEffect(() => {
    return () => {
      if (composer?.collaboration?.isConnected()) {
        composer.collaboration.updateCursor({ elementId: null, x: -1, y: -1 });
      }
    };
  }, [composer]);

  return {
    handleMouseMove,
    handleElementHover,
  };
}

export default useCursorSync;
