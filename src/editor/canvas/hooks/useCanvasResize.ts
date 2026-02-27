/**
 * useCanvasResize Hook
 * Connects ResizeHandler engine to React components
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { HandlePosition, TransformBounds } from "../../../engine/canvas/ResizeHandler";
import { devLog, devError } from "../../../shared/utils/devLogger";

export interface UseCanvasResizeOptions {
  onResizeStart?: () => void;
  onResize?: (bounds: TransformBounds) => void;
  onResizeEnd?: (bounds: TransformBounds) => void;
}

export interface UseCanvasResizeReturn {
  /** Start resize operation on a handle */
  startResize: (handle: HandlePosition, e: React.MouseEvent) => void;
  /** Start rotation operation */
  startRotation: (e: React.MouseEvent) => void;
  /** Current resize state */
  isResizing: boolean;
  /** Current rotation state */
  isRotating: boolean;
  /** Current bounds during resize */
  currentBounds: TransformBounds | null;
}

/**
 * Hook for connecting ResizeHandler to React components
 */
export function useCanvasResize(
  composer: Composer | null,
  elementId: string | null,
  options: UseCanvasResizeOptions = {}
): UseCanvasResizeReturn {
  const [isResizing, setIsResizing] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);
  const [currentBounds, setCurrentBounds] = React.useState<TransformBounds | null>(null);

  const { onResizeStart, onResize, onResizeEnd } = options;

  // Subscribe to resize events
  React.useEffect(() => {
    if (!composer?.resizeHandler) return;

    const handler = composer.resizeHandler;

    const handleStart = () => {
      setIsResizing(true);
      onResizeStart?.();
    };

    const handleMove = (data: { newBounds: TransformBounds }) => {
      setCurrentBounds(data.newBounds);
      onResize?.(data.newBounds);
    };

    const handleEnd = (data: { newBounds: TransformBounds }) => {
      setIsResizing(false);
      setIsRotating(false);
      setCurrentBounds(null);
      onResizeEnd?.(data.newBounds);
    };

    const handleCancel = () => {
      setIsResizing(false);
      setIsRotating(false);
      setCurrentBounds(null);
    };

    handler.on("resize:start", handleStart);
    handler.on("resize:move", handleMove);
    handler.on("resize:end", handleEnd);
    handler.on("resize:cancel", handleCancel);

    return () => {
      handler.off("resize:start", handleStart);
      handler.off("resize:move", handleMove);
      handler.off("resize:end", handleEnd);
      handler.off("resize:cancel", handleCancel);
    };
  }, [composer, onResizeStart, onResize, onResizeEnd]);

  // Start resize function
  const startResize = React.useCallback(
    (handle: HandlePosition, e: React.MouseEvent) => {
      devLog("useCanvasResize", `startResize hook triggered for ${elementId}`);
      if (!composer?.resizeHandler || !elementId) {
        devError("useCanvasResize", "❌ Missing composer or resizeHandler!", {
          composer: !!composer,
          handler: !!composer?.resizeHandler,
          elementId,
        });
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      devLog("useCanvasResize", "Calling engine resizeHandler.startResize...");
      composer.resizeHandler.startResize(elementId, handle, e.clientX, e.clientY, {
        useTransaction: true,
        initialModifiers: {
          shift: e.shiftKey,
          alt: e.altKey,
          ctrl: e.ctrlKey,
          meta: e.metaKey,
        },
      });
    },
    [composer, elementId]
  );

  // Start rotation function
  const startRotation = React.useCallback(
    (e: React.MouseEvent) => {
      if (!composer?.resizeHandler || !elementId) return;

      e.preventDefault();
      e.stopPropagation();

      setIsRotating(true);
      composer.resizeHandler.startRotation(elementId, e.clientX, e.clientY, {
        useTransaction: true,
        initialModifiers: {
          shift: e.shiftKey,
          alt: e.altKey,
          ctrl: e.ctrlKey,
          meta: e.metaKey,
        },
      });
    },
    [composer, elementId]
  );

  return {
    startResize,
    startRotation,
    isResizing,
    isRotating,
    currentBounds,
  };
}

export default useCanvasResize;
