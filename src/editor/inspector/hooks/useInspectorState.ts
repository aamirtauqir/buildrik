/**
 * useInspectorState Hook
 * Manages inspector panel UI state: tabs, pseudo-states, and section expansion
 *
 * @license BSD-3-Clause
 */

import { useState, useEffect, useCallback } from "react";
import type { PseudoStateId } from "../../../shared/types";
import { getDefaultTab } from "../config";

// ============================================================================
// TYPES
// ============================================================================

export type TabName = "layout" | "design" | "settings";

export type AutoExpandSection =
  | "typography"
  | "layout"
  | "size"
  | "elementProperties"
  | "variants" // GAP-FIX: Auto-expand variant section for component instances
  | null;

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
  /** Section to auto-expand based on element type */
  autoExpandSection: AutoExpandSection;
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
  return getDefaultTab(elementType) ?? "layout";
}

/**
 * Get the recommended section to auto-expand for an element type (internal helper)
 * Section auto-expand is handled by elementProfiles.ts defaultOpenGroups
 * ELEMENT_TO_SECTION_MAP was deleted (ARCH-02 fix) — see design doc backlog BL-01
 */
function getAutoExpandSection(_elementType: string, _tagName?: string): AutoExpandSection {
  return null;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to manage inspector panel UI state
 * Handles tab navigation, pseudo-state selection, and smart section auto-expand
 */
export function useInspectorState(selectedElement: SelectedElement | null): InspectorState {
  const [activeTab, setActiveTab] = useState<TabName>("layout");
  const [currentPseudoState, setCurrentPseudoState] = useState<PseudoStateId>("normal");
  const [autoExpandSection, setAutoExpandSection] = useState<AutoExpandSection>(null);
  const [devMode, setDevMode] = useState<boolean>(false);

  // Extract element ID for dependency tracking
  const elementId = selectedElement?.id;

  // Smart Tab & Section Auto-Expand: Update when element selection changes
  useEffect(() => {
    if (!selectedElement) return;

    const recommendedTab = getRecommendedTab(selectedElement.type, selectedElement.tagName);
    setActiveTab(recommendedTab);

    const sectionToExpand = getAutoExpandSection(selectedElement.type, selectedElement.tagName);
    setAutoExpandSection(sectionToExpand);
  }, [elementId, selectedElement]);

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
    autoExpandSection,
    devMode,
    setActiveTab: handleSetActiveTab,
    setCurrentPseudoState: handleSetPseudoState,
    setDevMode: handleSetDevMode,
  };
}
