/**
 * useStyleHandlers Hook
 * Manages style change handlers with breakpoint and pseudo-state awareness
 *
 * @license BSD-3-Clause
 */

import { useCallback, useState, useEffect, useRef } from "react";
import type { Composer } from "../../../engine";
import { getDefaultStyles } from "../../../shared/constants/defaultStyles";
import type { PseudoStateId } from "../../../shared/types";
import type { BreakpointId } from "../../../shared/types/breakpoints";
import { devLogger } from "../../../shared/utils/devLogger";

// ============================================================================
// TYPES
// ============================================================================

export interface SelectedElement {
  id: string;
  type: string;
  tagName?: string;
}

export interface StyleHandlers {
  /** Current styles for the element */
  styles: Record<string, string>;
  /** Handler for single style property changes */
  handleStyleChange: (property: string, value: string) => void;
  /** Handler for batch style changes */
  handleBatchStyleChange: (changes: Record<string, string>) => void;
  /** Set of properties overridden in the current breakpoint */
  overriddenProperties: Set<string>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to manage style changes with breakpoint and pseudo-state awareness
 */
export function useStyleHandlers(
  selectedElement: SelectedElement | null,
  composer: Composer | null | undefined,
  currentBreakpoint: BreakpointId,
  currentPseudoState: PseudoStateId
): StyleHandlers {
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [overriddenProperties, setOverriddenProperties] = useState<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush any pending debounced style change when element/breakpoint changes
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [selectedElement?.id, currentBreakpoint]);

  // Load styles when element or breakpoint changes
  useEffect(() => {
    if (!selectedElement?.id || !composer) {
      setStyles({});
      return;
    }

    const el = composer.elements.getElement(selectedElement.id);
    if (!el) {
      setStyles({});
      return;
    }

    // Get element's actual styles
    const elementStyles = el.getStyles ? el.getStyles() : {};

    // Get default styles based on element type and tagName
    // This ensures Inspector always shows values even for new elements
    const defaultStyles = getDefaultStyles(selectedElement.type, selectedElement.tagName);

    // Merge: defaults first, then element styles take precedence
    // This way user-set styles always override defaults
    const baseStyles = { ...defaultStyles, ...elementStyles };

    if (currentBreakpoint !== "desktop" && composer.styles) {
      const breakpointStyles = composer.styles.getBreakpointStyle(
        selectedElement.id,
        currentBreakpoint
      );
      setStyles({ ...baseStyles, ...breakpointStyles });
      setOverriddenProperties(new Set(Object.keys(breakpointStyles)));
    } else {
      setStyles(baseStyles);
      setOverriddenProperties(new Set());
    }
  }, [selectedElement, composer, currentBreakpoint]);

  // Style change handler - breakpoint and pseudo-state aware
  // Immediate visual update + 300ms debounced history entry to prevent keystroke spam
  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      if (!selectedElement?.id) return;

      const el = composer?.elements.getElement(selectedElement.id);
      if (!el) return;

      const selector = `[data-aqb-id="${selectedElement.id}"]`;

      // 1. Immediate local state update — live preview without waiting for debounce
      setStyles((prev) => {
        if (value === "" || value == null) {
          const next = { ...prev };
          delete next[property];
          return next;
        }
        return { ...prev, [property]: value };
      });

      // Trace style change for debugging
      devLogger.style("change", {
        elementId: selectedElement.id,
        property,
        value: value || "(removed)",
        breakpoint: currentBreakpoint,
        pseudoState: currentPseudoState,
      });

      // 2. Debounced engine mutation — batches rapid typing into one history entry
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        composer?.beginTransaction?.("style-change");
        try {
          if (currentPseudoState !== "normal" && composer?.styles) {
            // Handle pseudo-state styling
            if (value === "" || value == null) {
              const existingRule = composer.styles.getRule(selector, undefined);
              if (existingRule) {
                const props = { ...existingRule.properties };
                delete props[property];
                composer.styles.setRule(selector, props, {
                  pseudo: `:${currentPseudoState}`,
                });
              }
            } else {
              composer.styles.setRule(
                selector,
                { [property]: value },
                { pseudo: `:${currentPseudoState}` }
              );
            }
          } else if (value === "" || value == null) {
            // Remove style (normal state)
            if (currentBreakpoint === "desktop") {
              el.removeStyle?.(property);
            } else if (composer?.styles) {
              composer.styles.removeBreakpointStyleProperty(
                selectedElement.id,
                currentBreakpoint,
                property
              );
            }
          } else {
            // Set style (normal state)
            if (currentBreakpoint === "desktop") {
              el.setStyle?.(property, value);
            } else if (composer?.styles) {
              composer.styles.setBreakpointStyle(selectedElement.id, currentBreakpoint, {
                [property]: value,
              });
            }
          }
        } finally {
          composer?.endTransaction?.();
        }
      }, 300);
    },
    [selectedElement, composer, currentBreakpoint, currentPseudoState]
  );

  // Batch style change handler
  const handleBatchStyleChange = useCallback(
    (changes: Record<string, string>) => {
      if (!selectedElement?.id) return;

      const el = composer?.elements.getElement(selectedElement.id);
      if (!el) return;

      // Trace batch style change for debugging
      devLogger.style("batch-change", {
        elementId: selectedElement.id,
        properties: Object.keys(changes),
        count: Object.keys(changes).length,
        breakpoint: currentBreakpoint,
      });

      composer?.beginTransaction?.("style-batch");
      try {
        const next: Record<string, string> = {};
        const toSet: Record<string, string> = {};

        Object.entries(changes).forEach(([prop, val]) => {
          if (val === "" || val == null) {
            if (currentBreakpoint === "desktop") {
              el.removeStyle?.(prop);
            } else if (composer?.styles) {
              composer.styles.removeBreakpointStyleProperty(
                selectedElement.id,
                currentBreakpoint,
                prop
              );
            }
          } else {
            toSet[prop] = val;
            next[prop] = val;
          }
        });

        if (Object.keys(toSet).length > 0) {
          if (currentBreakpoint === "desktop") {
            Object.entries(toSet).forEach(([prop, val]) => {
              el.setStyle?.(prop, val);
            });
          } else if (composer?.styles) {
            composer.styles.setBreakpointStyle(selectedElement.id, currentBreakpoint, toSet);
          }
        }

        setStyles((prev) => {
          const merged = { ...prev, ...next };
          Object.entries(changes).forEach(([prop, val]) => {
            if (val === "" || val == null) delete merged[prop];
          });
          return merged;
        });
      } finally {
        composer?.endTransaction?.();
      }
    },
    [selectedElement, composer, currentBreakpoint]
  );

  return {
    styles,
    handleStyleChange,
    handleBatchStyleChange,
    overriddenProperties,
  };
}
