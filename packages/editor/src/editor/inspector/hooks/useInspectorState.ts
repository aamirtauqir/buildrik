/**
 * useInspectorState Hook
 * Manages inspector panel UI state: tabs and pseudo-states
 *
 * @license BSD-3-Clause
 */

import { useState, useEffect, useCallback } from "react";
import type { PseudoStateId } from "../../../shared/types";
import { getDefaultTab } from "../config";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tab ids — renamed in the Phase 6 restructure from CSS-category axis
 * (Layout / Appearance / Effects) to concept axis (Style / Element / Effects).
 * Any persisted old value is migrated once at hook mount.
 */
export type TabName = "style" | "element" | "effects";

export interface SelectedElement {
  id: string;
  type: string;
  tagName?: string;
}

export interface InspectorState {
  /** Currently active tab */
  activeTab: TabName;
  /** Current pseudo-state for styling (hover, focus, etc.) */
  currentPseudoState: PseudoStateId;
  /** Whether developer mode is enabled (shows All CSS, raw CSS editor) */
  devMode: boolean;
  /** Set active tab */
  setActiveTab: (tab: TabName) => void;
  /** Set pseudo-state */
  setCurrentPseudoState: (state: PseudoStateId) => void;
  /** Toggle developer mode */
  setDevMode: (enabled: boolean) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the recommended tab for an element type (internal helper)
 * Uses config/elementProfiles.ts as sole source (ARCH-02 fix: ELEMENT_TO_TAB_MAP deleted)
 */
function getRecommendedTab(elementType: string, _tagName?: string): TabName {
  return getDefaultTab(elementType) ?? "style";
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to manage inspector panel UI state
 * Handles tab navigation and pseudo-state selection
 */
export function useInspectorState(selectedElement: SelectedElement | null): InspectorState {
  const [activeTab, setActiveTab] = useState<TabName>("style");
  const [currentPseudoState, setCurrentPseudoState] = useState<PseudoStateId>("normal");
  const [devMode, setDevMode] = useState<boolean>(false);

  // Extract element ID for dependency tracking
  const elementId = selectedElement?.id;

  // Smart Tab Auto-Expand: Update when element selection changes
  useEffect(() => {
    if (!selectedElement) return;

    const recommendedTab = getRecommendedTab(selectedElement.type, selectedElement.tagName);
    setActiveTab(recommendedTab);
  }, [elementId, selectedElement]);

  // Reset pseudo-state when element changes — :hover on element A
  // must not persist onto element B's edit session.
  useEffect(() => {
    setCurrentPseudoState("normal");
  }, [elementId]);

  const handleSetActiveTab = useCallback((tab: TabName) => {
    setActiveTab(tab);
  }, []);

  const handleSetPseudoState = useCallback((state: PseudoStateId) => {
    setCurrentPseudoState(state);
  }, []);

  const handleSetDevMode = useCallback((enabled: boolean) => {
    setDevMode(enabled);
  }, []);

  return {
    activeTab,
    currentPseudoState,
    devMode,
    setActiveTab: handleSetActiveTab,
    setCurrentPseudoState: handleSetPseudoState,
    setDevMode: handleSetDevMode,
  };
}