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
import { computeEffectiveStyles } from "../config/cssContext";

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
  // Compute the agreed style view across the selection using EFFECTIVE styles
  // (base + breakpoint overlay + pseudo layer), not base styles alone — so the
  // panel reflects what the user sees under the active responsive context.
  // Refreshes on both `element:updated` (emitted by Element.setStyle etc) and
  // `style:changed` (emitted by StyleEngine.setRule / setBreakpointStyle) so
  // responsive + pseudo writes from any panel keep the batch view in sync.
  const [{ styles, mixed }, setView] = React.useState<{
    styles: Record<string, string>;
    mixed: Set<string>;
  }>({ styles: {}, mixed: new Set() });

  // Ref-stable compute closure — updated every render so the event handler and
  // handleBatchStyleChange always use the latest selection/breakpoint/pseudo.
  const computeRef = React.useRef<() => void>(() => { /* noop until first effect */ });
  computeRef.current = () => {
    if (!composer || selectedIds.length === 0) {
      setView({ styles: {}, mixed: new Set() });
      return;
    }
    const allStyles = selectedIds
      .map((id) => composer.elements.getElement(id))
      .filter((el): el is NonNullable<typeof el> => !!el)
      .map((el) => computeEffectiveStyles(el, composer, currentBreakpoint, currentPseudoState));
    if (allStyles.length === 0) {
      setView({ styles: {}, mixed: new Set() });
      return;
    }
    const allProps = new Set<string>();
    allStyles.forEach((s) => Object.keys(s).forEach((p) => allProps.add(p)));
    const merged: Record<string, string> = {};
    const mixedProps = new Set<string>();
    for (const prop of allProps) {
      const first = allStyles[0][prop] ?? "";
      const allAgree = allStyles.every((s) => (s[prop] ?? "") === first);
      if (allAgree) {
        if (first) merged[prop] = first;
      } else {
        mixedProps.add(prop);
      }
    }
    setView({ styles: merged, mixed: mixedProps });
  };

  React.useEffect(() => {
    computeRef.current();
    if (!composer) return;

    const selectedSet = new Set(selectedIds);
    // Try to extract a target element id from any payload shape the composer
    // emits for element:updated / style:changed. Unknown shape → recompute.
    const payloadId = (payload: unknown): string | null => {
      if (!payload || typeof payload !== "object") return null;
      const p = payload as Record<string, unknown>;
      // Element instance from element:updated
      if (typeof p.getId === "function") return (p.getId as () => string)();
      // StyleEngine.setBreakpointStyle emits { elementId, breakpoint, styles }
      if (typeof p.elementId === "string") return p.elementId;
      // StyleEngine.setRule emits StyleData { selector, ... }; parse the id
      // from the bracket attribute selector.
      if (typeof p.selector === "string") {
        const m = p.selector.match(/data-buildrick-id="([^"]+)"/);
        return m?.[1] ?? null;
      }
      return null;
    };

    const handler = (payload: unknown) => {
      const id = payloadId(payload);
      // Unknown shape → recompute (conservative). Known shape → only refresh
      // when the mutation targets one of our selected elements.
      if (id === null || selectedSet.has(id)) computeRef.current();
    };
    composer.on?.("element:updated", handler);
    composer.on?.("style:changed", handler);
    return () => {
      composer.off?.("element:updated", handler);
      composer.off?.("style:changed", handler);
    };
    // selectedIds identity can change per-render even when contents are stable
    // (parent closures recreate the array). Depend on a derived key instead so
    // the effect only re-runs when the actual selection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composer, selectedIds.join(","), currentBreakpoint, currentPseudoState]);

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
      // Force synchronous refresh — event listeners will also fire, but calling
      // compute directly means the panel reflects the new values within the
      // same commit instead of waiting for React to process the event.
      computeRef.current();
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
