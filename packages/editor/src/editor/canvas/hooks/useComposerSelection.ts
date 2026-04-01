/**
 * Composer Selection Hook
 * Single source of truth for selection state - derived exclusively from Composer.SelectionManager
 *
 * @module components/Canvas/hooks/useComposerSelection
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { Element } from "../../../engine/elements/Element";
import { EVENTS } from "../../../shared/constants/events";
import { devLogger } from "../../../shared/utils/devLogger";

export interface UseComposerSelectionOptions {
  composer: Composer | null;
}

export interface UseComposerSelectionResult {
  /** Currently selected element ID (derived from Composer) - primary selection */
  selectedId: string | null;
  /** Currently selected element (full Element object) - primary selection */
  selectedElement: Element | null;
  /** All selected element IDs (for multi-select) */
  selectedIds: string[];
  /** All selected elements (for multi-select) */
  selectedElements: Element[];
  /** Whether multiple elements are selected */
  isMultiSelect: boolean;
  /** Select an element by ID or Element object */
  select: (elementOrId: Element | string | null) => void;
  /** Clear selection */
  clear: () => void;
  /** Check if specific element is selected */
  isSelected: (elementOrId: Element | string) => boolean;
}

/**
 * Hook to derive selection state from Composer
 * This is the SINGLE SOURCE OF TRUTH for selection in Canvas
 */
export function useComposerSelection({
  composer,
}: UseComposerSelectionOptions): UseComposerSelectionResult {
  // State derived from Composer - this is the ONLY source
  const [selectedElement, setSelectedElement] = React.useState<Element | null>(null);
  const [selectedElements, setSelectedElements] = React.useState<Element[]>([]);

  // Sync with Composer on mount and listen for changes
  React.useEffect(() => {
    if (!composer) {
      setSelectedElement(null);
      setSelectedElements([]);
      return;
    }

    // Initial sync
    const current = composer.selection.getSelected();
    const all = composer.selection.getAllSelected();
    setSelectedElement(current);
    setSelectedElements(all);

    // Listen for selection changes from ANY source (click, keyboard, programmatic)
    const handleSelect = (element: Element | null) => {
      devLogger.selection("select", {
        elementId: element?.getId?.() || null,
        type: element?.getType?.() || null,
      });
      setSelectedElement(element);
      setSelectedElements(composer.selection.getAllSelected());
    };

    const handleCleared = () => {
      devLogger.selection("cleared");
      setSelectedElement(null);
      setSelectedElements([]);
    };

    const handleMultiSelect = (elements: Element[]) => {
      devLogger.selection("multi-select", {
        count: elements.length,
        ids: elements.map((el) => el.getId?.()).filter(Boolean),
      });
      if (elements.length > 0) {
        setSelectedElement(elements[0]);
      }
      setSelectedElements(elements);
    };

    // Unified handler for selection changes (add/remove use same logic)
    const handleSelectionChanged = () => {
      setSelectedElement(composer.selection.getSelected());
      setSelectedElements(composer.selection.getAllSelected());
    };

    composer.on(EVENTS.ELEMENT_SELECTED, handleSelect);
    composer.on(EVENTS.SELECTION_CLEARED, handleCleared);
    composer.on(EVENTS.SELECTION_MULTIPLE, handleMultiSelect);
    composer.on(EVENTS.SELECTION_ADDED, handleSelectionChanged);
    composer.on(EVENTS.SELECTION_REMOVED, handleSelectionChanged);

    return () => {
      composer.off(EVENTS.ELEMENT_SELECTED, handleSelect);
      composer.off(EVENTS.SELECTION_CLEARED, handleCleared);
      composer.off(EVENTS.SELECTION_MULTIPLE, handleMultiSelect);
      composer.off(EVENTS.SELECTION_ADDED, handleSelectionChanged);
      composer.off(EVENTS.SELECTION_REMOVED, handleSelectionChanged);
    };
  }, [composer]);

  // Derived selectedId for convenience
  const selectedId = React.useMemo(() => {
    return selectedElement?.getId?.() ?? null;
  }, [selectedElement]);

  // Derived selectedIds for convenience
  const selectedIds = React.useMemo(() => {
    return selectedElements.map((el) => el.getId?.() ?? "").filter(Boolean);
  }, [selectedElements]);

  // Check if multi-select is active
  const isMultiSelect = React.useMemo(() => {
    return selectedElements.length > 1;
  }, [selectedElements]);

  // Action: Select element
  const select = React.useCallback(
    (elementOrId: Element | string | null) => {
      if (!composer) return;

      if (elementOrId === null) {
        composer.selection.clear();
        return;
      }

      if (typeof elementOrId === "string") {
        const element = composer.elements.getElement(elementOrId);
        if (element) {
          composer.selection.select(element);
        }
      } else {
        composer.selection.select(elementOrId);
      }
    },
    [composer]
  );

  // Action: Clear selection
  const clear = React.useCallback(() => {
    composer?.selection.clear();
  }, [composer]);

  // Check if element is selected
  const isSelected = React.useCallback(
    (elementOrId: Element | string): boolean => {
      if (!composer || selectedElements.length === 0) return false;

      const checkId = typeof elementOrId === "string" ? elementOrId : elementOrId?.getId?.();

      return selectedIds.includes(checkId || "");
    },
    [composer, selectedElements, selectedIds]
  );

  return {
    selectedId,
    selectedElement,
    selectedIds,
    selectedElements,
    isMultiSelect,
    select,
    clear,
    isSelected,
  };
}
