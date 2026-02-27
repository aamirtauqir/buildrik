/**
 * useInspectorSections — manages section expand/collapse state in ProInspector
 * Extracted from ProInspector.tsx to reduce file size below 500-line limit.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_DEFAULT_EXPANDED = 3;
const SECTION_PREFS_KEY = "aqb-inspector-sections";

/** Approximate total section count per tab (for progress display) */
export const TOTAL_SECTIONS = 6;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseInspectorSectionsOptions {
  selectedElement: { id: string; type: string } | null;
  composer?: Composer | null;
}

export interface UseInspectorSectionsResult {
  expandedSections: Set<string>;
  expandedCount: number;
  collapseAll: () => void;
  expandAll: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useInspectorSections({
  selectedElement,
  composer,
}: UseInspectorSectionsOptions): UseInspectorSectionsResult {
  // ── Persist user preferences ──────────────────────────────────────────────
  const loadUserPreferences = React.useCallback((): Set<string> | null => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(SECTION_PREFS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);

  const saveUserPreferences = React.useCallback((sections: Set<string>) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SECTION_PREFS_KEY, JSON.stringify(Array.from(sections)));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // ── Smart defaults by element type ───────────────────────────────────────
  const getDefaultExpandedSections = React.useCallback(
    (elementType: string): Set<string> => {
      const textTypes = ["text", "heading", "paragraph", "button", "link", "span"];
      const containerTypes = ["container", "section", "div", "cell", "grid-item", "flex"];
      const mediaTypes = ["image", "video", "icon", "lottie"];
      const formTypes = ["input", "textarea", "select", "checkbox", "radio", "form"];

      let prioritySections: string[];

      if (textTypes.includes(elementType)) {
        prioritySections = ["typography", "layout", "size", "spacing"];
      } else if (containerTypes.includes(elementType)) {
        prioritySections = ["layout", "size", "spacing", "background"];
      } else if (mediaTypes.includes(elementType)) {
        prioritySections = ["size", "layout", "border"];
      } else if (formTypes.includes(elementType)) {
        prioritySections = ["layout", "size", "typography"];
      } else {
        prioritySections = ["layout", "size", "spacing"];
      }

      // Elevate variants for component instances
      if (composer?.elements.getElement(selectedElement?.id || "")?.isComponentInstance?.()) {
        prioritySections = ["variants", ...prioritySections];
      }

      return new Set(prioritySections.slice(0, MAX_DEFAULT_EXPANDED));
    },
    [composer, selectedElement?.id]
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(() => {
    const userPrefs = loadUserPreferences();
    if (userPrefs && userPrefs.size > 0) return userPrefs;
    return getDefaultExpandedSections(selectedElement?.type || "default");
  });

  const userHasModifiedRef = React.useRef(false);

  // Reset to smart defaults when element type changes (if user hasn't customized)
  React.useEffect(() => {
    if (selectedElement?.type && !userHasModifiedRef.current) {
      setExpandedSections(getDefaultExpandedSections(selectedElement.type));
    }
  }, [selectedElement?.type, getDefaultExpandedSections]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const collapseAll = React.useCallback(() => {
    const emptySet = new Set<string>();
    setExpandedSections(emptySet);
    userHasModifiedRef.current = true;
    saveUserPreferences(emptySet);
  }, [saveUserPreferences]);

  const expandAll = React.useCallback(() => {
    const allSections = new Set([
      "layout",
      "size",
      "spacing",
      "typography",
      "background",
      "border",
      "effects",
    ]);
    setExpandedSections(allSections);
    userHasModifiedRef.current = true;
    saveUserPreferences(allSections);
  }, [saveUserPreferences]);

  return {
    expandedSections,
    expandedCount: expandedSections.size,
    collapseAll,
    expandAll,
  };
}
