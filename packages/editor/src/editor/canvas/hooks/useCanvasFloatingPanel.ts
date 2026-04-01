/**
 * useCanvasFloatingPanel Hook
 * Manages floating properties panel state
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface FloatingPanelState {
  elementId: string;
  elementType: string;
  position: { x: number; y: number };
}

interface UseCanvasFloatingPanelProps {
  selectedId: string | null;
}

interface UseCanvasFloatingPanelReturn {
  floatingPanel: FloatingPanelState | null;
  setFloatingPanel: React.Dispatch<React.SetStateAction<FloatingPanelState | null>>;
  showFloatingPanel: (elementId: string, elementType: string, rect: DOMRect) => void;
  closeFloatingPanel: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useCanvasFloatingPanel({
  selectedId,
}: UseCanvasFloatingPanelProps): UseCanvasFloatingPanelReturn {
  const [floatingPanel, setFloatingPanel] = React.useState<FloatingPanelState | null>(null);

  // Close floating panel when selection changes to null
  React.useEffect(() => {
    if (!selectedId) {
      setFloatingPanel(null);
    }
  }, [selectedId]);

  const showFloatingPanel = React.useCallback(
    (elementId: string, elementType: string, rect: DOMRect) => {
      setFloatingPanel({
        elementId,
        elementType,
        position: { x: rect.right + 10, y: rect.top },
      });
    },
    []
  );

  const closeFloatingPanel = React.useCallback(() => {
    setFloatingPanel(null);
  }, []);

  return {
    floatingPanel,
    setFloatingPanel,
    showFloatingPanel,
    closeFloatingPanel,
  };
}

export default useCanvasFloatingPanel;
