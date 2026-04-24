/**
 * useBatchStyleHandler — apply style changes to every selected element.
 *
 * Counterpart to `useStyleHandlers` for the multi-select case. Where the
 * single-element hook targets `selectedElement` and writes per-breakpoint
 * styles through the composer's style manager, this hook targets every id
 * in `selectedIds` and writes desktop styles via `el.setStyle` / `removeStyle`
 * directly. All writes for a single change are wrapped in one composer
 * transaction so the batch lands as one undo step and one canvas rerender.
 *
 * Read side: surfaces the styles of the FIRST selected element as the
 * "representative" value shown in the batch panel. When elements in the
 * selection disagree on a property, the panel still shows the first element's
 * value — committing a new value overwrites all of them, which is the
 * expected multi-edit semantic.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { getBreakpointQuery } from "../../../shared/constants/breakpoints";
import type { PseudoStateId } from "../../../shared/types";
import type { BreakpointId } from "../../../shared/types/breakpoints";

// ============================================================================
// TYPES
// ============================================================================

export interface UseBatchStyleHandlerResult {
  /**
   * Merged style view across the selection: each property is present iff every
   * selected element has the same value for it. Properties where the selection
   * disagrees are omitted here and listed in `mixed` instead.
   */
  styles: Record<string, string>;
  /**
   * Set of property names where at least two selected elements have different
   * values. Consumers show a "Mixed" placeholder for these so users aren't
   * tricked into thinking a representative value is canonical.
   */
  mixed: Set<string>;
  /** Apply one property to every selected element. */
  handleStyleChange: (property: string, value: string) => void;
  /** Apply many properties to every selected element in one transaction. */
  handleBatchStyleChange: (changes: Record<string, string>) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useBatchStyleHandler(
  composer: Composer | null | undefined,
  selectedIds: string[],
  currentBreakpoint: BreakpointId = "desktop",
  currentPseudoState: PseudoStateId = "normal"
): UseBatchStyleHandlerResult {
  // Compute the agreed style view across the selection. For every property
  // that appears on any selected element, check whether all selected elements
  // have the same value. If they agree, the property lands in `styles`. If
  // they disagree, it lands in `mixed` and is omitted from `styles` so the
  // panel doesn't display one element's value as canonical.
  const { styles, mixed } = React.useMemo<{
    styles: Record<string, string>;
    mixed: Set<string>;
  }>(() => {
    if (!composer || selectedIds.length === 0) {
      return { styles: {}, mixed: new Set() };
    }

    const allStyles = selectedIds
      .map((id) => composer.elements.getElement(id)?.getStyles?.() ?? {})
      .filter(Boolean) as Record<string, string>[];
    if (allStyles.length === 0) return { styles: {}, mixed: new Set() };

    // Union of every property anyone in the selection has set. Using Set
    // avoids duplicate work when elements share the same prop list.
    const allProps = new Set<string>();
    allStyles.forEach((s) => Object.keys(s).forEach((p) => allProps.add(p)));

    const merged: Record<string, string> = {};
    const mixedProps = new Set<string>();
    for (const prop of allProps) {
      const first = allStyles[0][prop] ?? "";
      const allAgree = allStyles.every((s) => (s[prop] ?? "") === first);
      if (allAgree) {
        // Only emit non-empty values — an empty string means "not set on any"
        // which is the same as absent from the record.
        if (first) merged[prop] = first;
      } else {
        mixedProps.add(prop);
      }
    }

    return { styles: merged, mixed: mixedProps };
  }, [composer, selectedIds]);

  const handleBatchStyleChange = React.useCallback(
    (changes: Record<string, string>) => {
      if (!composer || selectedIds.length === 0) return;

      composer.beginTransaction?.("batch-multi-style");
      try {
        const mq =
          currentBreakpoint === "desktop"
            ? undefined
            : getBreakpointQuery(currentBreakpoint) ?? undefined;

        selectedIds.forEach((id) => {
          const el = composer.elements.getElement(id);
          if (!el) return;

          if (currentPseudoState !== "normal" && composer.styles) {
            // Pseudo-state: merge new values into the element's :state rule.
            const selector = `[data-buildrick-id="${id}"]`;
            const pseudoSelector = `${selector}:${currentPseudoState}`;
            const existingRule = composer.styles.getRule(pseudoSelector, mq);
            const existing = existingRule ? { ...existingRule.properties } : {};

            Object.entries(changes).forEach(([prop, val]) => {
              if (val === "" || val == null) {
                delete existing[prop];
              } else {
                existing[prop] = val;
              }
            });
            composer.styles.setRule(selector, existing, {
              pseudo: `:${currentPseudoState}`,
              mediaQuery: mq,
            });
            return;
          }

          if (currentBreakpoint !== "desktop" && composer.styles) {
            // Breakpoint overlay: partition changes into set/remove per bp.
            const toSet: Record<string, string> = {};
            Object.entries(changes).forEach(([prop, val]) => {
              if (val === "" || val == null) {
                composer.styles!.removeBreakpointStyleProperty(id, currentBreakpoint, prop);
              } else {
                toSet[prop] = val;
              }
            });
            if (Object.keys(toSet).length > 0) {
              composer.styles.setBreakpointStyle(id, currentBreakpoint, toSet);
            }
            return;
          }

          // Desktop base — existing behavior.
          Object.entries(changes).forEach(([prop, val]) => {
            if (val === "" || val == null) {
              el.removeStyle?.(prop);
            } else {
              el.setStyle?.(prop, val);
            }
          });
        });
      } finally {
        composer.endTransaction?.();
      }
    },
    [composer, selectedIds, currentBreakpoint, currentPseudoState]
  );

  const handleStyleChange = React.useCallback(
    (property: string, value: string) => {
      handleBatchStyleChange({ [property]: value });
    },
    [handleBatchStyleChange]
  );

  return { styles, mixed, handleStyleChange, handleBatchStyleChange };
}

export default useBatchStyleHandler;
