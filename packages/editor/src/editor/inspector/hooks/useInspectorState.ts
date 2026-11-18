/**
 * useInspectorState Hook
 * Manages inspector panel UI state: pseudo-state selection.
 *
 * S3.9: the inspector flattened to one scrolling column (no Look/Layout/Effects
 * tab strip), so tab state was drained — this hook now owns pseudo-state only.
 *
 * @license BSD-3-Clause
 */

import { useState, useEffect, useCallback } from "react";
import type { PseudoStateId } from "@/shared/types";
import type { Composer } from "@/engine";

// ============================================================================
// TYPES
// ============================================================================

import type { SelectedElementInfo as SelectedElement } from "@/shared/types";
export type { SelectedElement };

export interface InspectorState {
  /** Current pseudo-state for styling (hover, focus, etc.) */
  currentPseudoState: PseudoStateId;
  /** Set pseudo-state */
  setCurrentPseudoState: (state: PseudoStateId) => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to manage inspector panel UI state (pseudo-state selection).
 */
export function useInspectorState(
  selectedElement: SelectedElement | null,
  composer?: Pick<Composer, "stylePseudoState"> | null,
): InspectorState {
  const [currentPseudoState, setCurrentPseudoState] = useState<PseudoStateId>("normal");

  const elementId = selectedElement?.id;

  // Reset pseudo-state when element changes — :hover on element A
  // must not persist onto element B's edit session.
  useEffect(() => {
    setCurrentPseudoState("normal");
  }, [elementId]);

  /* BD-36: copy-style / paste-style use the layer the Inspector shows, so the
     state is published on the composer; back to normal once no Inspector
     shows one. */
  useEffect(() => {
    if (!composer) return;
    composer.stylePseudoState = currentPseudoState;
    return () => {
      composer.stylePseudoState = "normal";
    };
  }, [composer, currentPseudoState]);

  const handleSetPseudoState = useCallback((state: PseudoStateId) => {
    setCurrentPseudoState(state);
  }, []);

  return {
    currentPseudoState,
    setCurrentPseudoState: handleSetPseudoState,
  };
}
