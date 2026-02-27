/**
 * GridOverlay - Shows grid lines on canvas
 * @license BSD-3-Clause
 */

import * as React from "react";
import { GridPattern } from "../styled";

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
  return <GridPattern aria-hidden gridSize={gridSize} />;
};

export default GridOverlay;
