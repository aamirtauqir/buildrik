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
// ELEMENT TO TAB MAPPING (Legacy fallback - now uses config/elementProfiles.ts)
// ============================================================================

const ELEMENT_TO_TAB_MAP: Record<string, TabName> = {
  // Text elements -> Design tab (Typography)
  heading: "design",
  text: "design",
  paragraph: "design",
  link: "settings",
  h1: "design",
  h2: "design",
  h3: "design",
  h4: "design",
  h5: "design",
  h6: "design",
  p: "design",
  span: "design",
  a: "settings",
  // Layout/Container elements -> Layout tab
  container: "layout",
  section: "layout",
  div: "layout",
  header: "layout",
  footer: "layout",
  main: "layout",
  article: "layout",
  nav: "layout",
  aside: "layout",
  grid: "layout",
  flex: "layout",
  columns: "layout",
  hero: "layout",
  navbar: "settings",
  // Media elements -> Settings tab (for src/alt)
  image: "settings",
  video: "settings",
  iframe: "layout",
  img: "settings",
  // Form elements -> Settings tab
  input: "settings",
  button: "settings",
  form: "settings",
  textarea: "settings",
  select: "settings",
  checkbox: "settings",
  radio: "settings",
  // Complex components -> Settings tab
  modal: "settings",
  tabs: "settings",
  accordion: "settings",
  slider: "settings",
  // Default
  default: "layout",
};

// ============================================================================
// ELEMENT TO SECTION MAPPING
// ============================================================================

const ELEMENT_TO_SECTION_MAP: Record<string, AutoExpandSection> = {
  // Text elements -> Typography section
  heading: "typography",
  text: "typography",
  paragraph: "typography",
  link: "typography",
  h1: "typography",
  h2: "typography",
  h3: "typography",
  h4: "typography",
  h5: "typography",
  h6: "typography",
  p: "typography",
  span: "typography",
  a: "typography",
  // Layout/Container elements -> Layout section
  container: "layout",
  section: "layout",
  div: "layout",
  header: "layout",
  footer: "layout",
  main: "layout",
  article: "layout",
  nav: "layout",
  aside: "layout",
  grid: "layout",
  flex: "layout",
  columns: "layout",
  hero: "layout",
  navbar: "layout",
  // Media elements -> Size section
  image: "size",
  video: "size",
  iframe: "size",
  img: "size",
  // Form elements -> Element Properties section
  input: "elementProperties",
  button: "elementProperties",
  form: "elementProperties",
  textarea: "elementProperties",
  select: "elementProperties",
  checkbox: "elementProperties",
  radio: "elementProperties",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the recommended tab for an element type (internal helper)
 * Now uses config/elementProfiles.ts as primary source
 */
function getRecommendedTab(elementType: string, tagName?: string): TabName {
  // Try config-based lookup first (from elementProfiles.ts)
  const configTab = getDefaultTab(elementType);
  if (configTab) {
    return configTab;
  }

  // Legacy fallback for tag-based lookups
  if (tagName) {
    const tagLower = tagName.toLowerCase();
    if (ELEMENT_TO_TAB_MAP[tagLower]) {
      return ELEMENT_TO_TAB_MAP[tagLower];
    }
  }
  return ELEMENT_TO_TAB_MAP[elementType] || ELEMENT_TO_TAB_MAP.default;
}

/**
 * Get the recommended section to auto-expand for an element type (internal helper)
 */
function getAutoExpandSection(elementType: string, tagName?: string): AutoExpandSection {
  if (tagName) {
    const tagLower = tagName.toLowerCase();
    if (ELEMENT_TO_SECTION_MAP[tagLower]) {
      return ELEMENT_TO_SECTION_MAP[tagLower];
    }
  }
  return ELEMENT_TO_SECTION_MAP[elementType] || null;
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
