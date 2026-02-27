/**
 * useCanvasSize
 * Tracks canvas container dimensions via ResizeObserver.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DeviceType } from "../../../shared/types";

interface UseCanvasSizeOptions {
  canvasRef: React.RefObject<HTMLDivElement>;
  content: string;
  device: DeviceType;
  zoom: number;
}

interface UseCanvasSizeResult {
  canvasSize: { width: number; height: number };
}

/**
 * Tracks the canvas container size. Re-measures on content/device/zoom changes
 * and via ResizeObserver for panel resize events.
 */
export function useCanvasSize({
  canvasRef,
  content,
  device,
  zoom,
}: UseCanvasSizeOptions): UseCanvasSizeResult {
  const [canvasSize, setCanvasSize] = React.useState({ width: 0, height: 0 });

  React.useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const updateSize = (): void => {
      const rect = el.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    };
    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(el);

    window.addEventListener("resize", updateSize, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [canvasRef, content, device, zoom]);

  return { canvasSize };
}
