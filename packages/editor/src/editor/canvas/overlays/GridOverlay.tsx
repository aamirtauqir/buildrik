/**
 * GridOverlay - Shows grid lines on canvas
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

interface GridOverlayProps {
  gridSize?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const GridOverlay: React.FC<GridOverlayProps> = ({ gridSize = 10 }) => {
  return (
    <div
      aria-hidden
      data-testid="canvas-grid-overlay"
      className="bd-canvas-grid tw:absolute tw:inset-0 tw:pointer-events-none tw:z-10"
      style={{ backgroundSize: `${gridSize}px ${gridSize}px` }}
    />
  );
};

export default GridOverlay;
