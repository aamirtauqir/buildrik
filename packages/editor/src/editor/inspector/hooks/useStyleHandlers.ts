/**
 * useStyleHandlers Hook
 * Manages style change handlers with breakpoint and pseudo-state awareness
 *
 * `reachPeerIds` is board 160:412's "All like this" mode, applied at the one
 * place every single-element inspector edit already passes through. The mode
 * used to be a one-shot in ScopeDropdown that copied this element's WHOLE
 * style map onto its peers; here only the property being edited moves, to the
 * same breakpoint and pseudo-state, inside the same transaction — so one ⌘Z
 * takes the whole fan-out back.
 *
 * @license BSD-3-Clause
 */

import { useCallback, useState, useEffect, useRef } from "react";
import type { Composer } from "../../../engine";
import { getBreakpointQuery } from "../../../shared/constants/breakpoints";
import { getDefaultStyles } from "../../../shared/constants/defaultStyles";
import { EVENTS } from "../../../shared/constants";
import { getDOMElement } from "../../../engine/canvas/resize/utils";
import type { PseudoStateId } from "../../../shared/types";
import type { BreakpointId } from "../../../shared/types/breakpoints";
import { devLogger } from "../../../shared/utils/devLogger";
import { computeEffectiveStyles } from "../config/cssContext";

// ============================================================================
// TYPES
// ============================================================================

import type { SelectedElementInfo as SelectedElement } from "@/shared/types";
export type { SelectedElement };

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
/**
 * What the element ACTUALLY renders, for the properties it has no value of its
 * own. Keeps the panel honest without changing which rows it shows.
 *
 * Colours are skipped: `getComputedStyle` returns `rgb(...)` and the colour
 * controls expect a hex string, so a computed colour would be shown as a
 * broken value rather than a truer one. They keep the type default until the
 * controls speak both.
 */
function readRenderedValues(
  elementId: string,
  keys: string[],
  authored: Record<string, string>,
): Record<string, string> {
  const node = getDOMElement(elementId);
  if (!node) return {};
  const cs = window.getComputedStyle(node);
  const out: Record<string, string> = {};
  for (const key of keys) {
    if (authored[key]) continue;
    if (key === "color" || key.endsWith("-color")) continue;
    const value = cs.getPropertyValue(key);
    if (value) out[key] = value.trim();
  }
  return out;
}

export function useStyleHandlers(
  selectedElement: SelectedElement | null,
  composer: Composer | null | undefined,
  currentBreakpoint: BreakpointId,
  currentPseudoState: PseudoStateId,
  /** Same-type peers each edit also lands on. Empty unless "All like this". */
  reachPeerIds: string[] = []
): StyleHandlers {
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [overriddenProperties, setOverriddenProperties] = useState<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingFlushRef = useRef<(() => void) | null>(null);

  // Flush any pending debounced style change when element/breakpoint/pseudoState changes.
  // Prior: cleanup silently dropped the last keystroke. Now we commit it first.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        if (pendingFlushRef.current) {
          pendingFlushRef.current();
          pendingFlushRef.current = null;
        }
      }
    };
  }, [selectedElement?.id, currentBreakpoint, currentPseudoState]);

  // Load styles when element or breakpoint changes. Cascade (base → breakpoint
  // overlay → pseudo) is delegated to computeEffectiveStyles so there's ONE
  // source of truth for the layering logic — shared with useBatchStyleHandler
  // and deriveCssContext. Only the default-style layer and the overriddenKeys
  // indicator stay local to this hook.
  /* Re-read trigger for the computed fallback below. Bumped by any event that
     can repaint the selected element without changing what is selected. */
  const [bump, setBump] = useState(0);
  useEffect(() => {
    /* Optional because the panel is mounted against partial composers in
       several suites, and a missing bus must degrade to "no re-read", never to
       a crash inside the inspector. */
    if (typeof composer?.on !== "function" || typeof composer?.off !== "function") return;
    const onRepaint = () => setBump((n) => n + 1);
    composer.on(EVENTS.STYLE_CHANGED, onRepaint);
    composer.on(EVENTS.PROJECT_LOADED, onRepaint);
    return () => {
      composer.off(EVENTS.STYLE_CHANGED, onRepaint);
      composer.off(EVENTS.PROJECT_LOADED, onRepaint);
    };
  }, [composer]);

  useEffect(() => {
    if (!selectedElement?.id || !composer) {
      setStyles({});
      setOverriddenProperties(new Set());
      return;
    }

    const el = composer.elements.getElement(selectedElement.id);
    if (!el) {
      setStyles({});
      setOverriddenProperties(new Set());
      return;
    }

    const defaultStyles = getDefaultStyles(selectedElement.type, selectedElement.tagName);
    const effective = computeEffectiveStyles(el, composer, currentBreakpoint, currentPseudoState);
    /* For a property the element does not carry, the panel used to print the
       TYPE's default — so a legacy heading with no font-size of its own read
       "36" while it rendered at 24. Measured live at 1440×900 on a heading that
       predates `applyTypeDefaults`.

       The default is still the base, because it decides WHICH rows appear.
       What each unset row SHOWS is now what the element actually renders, read
       off the canvas node. Authored values are untouched — `effective` is
       applied last and still wins.

       Only keys the defaults already name are read, so the row set does not
       change; and only on desktop/base, because a computed value describes the
       live canvas, not the breakpoint or pseudo-state being edited. */
    const rendered =
      currentBreakpoint === "desktop" && currentPseudoState === "normal"
        ? readRenderedValues(selectedElement.id, Object.keys(defaultStyles), effective)
        : {};
    setStyles({ ...defaultStyles, ...rendered, ...effective });

    // Overridden-keys indicator — which keys come from the breakpoint layer
    // specifically (not pseudo or base). Separate from the effective map
    // because the UI needs to highlight these differently.
    if (currentBreakpoint !== "desktop" && composer.styles) {
      const bpStyles = composer.styles.getBreakpointStyle(selectedElement.id, currentBreakpoint);
      setOverriddenProperties(new Set(Object.keys(bpStyles)));
    } else {
      setOverriddenProperties(new Set());
    }
    /* The computed fallback above is a SAMPLE of the canvas, and the canvas
       moves without the selection moving. A token edit in Brand, an imported
       stylesheet, a starter applied — all repaint the element while this panel
       keeps showing the value it read on selection. Review caught it: the
       effect was keyed on selection alone, so the fix that made unset rows
       honest could go stale and quietly become a new lie.

       `bump` re-runs it. It is deliberately coarse — any style write anywhere
       is enough of a reason to re-read the one selected element. */
  }, [selectedElement, composer, currentBreakpoint, currentPseudoState, bump]);

  // Style change handler - breakpoint and pseudo-state aware
  // Immediate visual update + 300ms debounced history entry to prevent keystroke spam
  const handleStyleChange = useCallback(
    (property: string, value: string) => {
      if (!selectedElement?.id) return;

      const el = composer?.elements.getElement(selectedElement.id);
      if (!el) return;

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

      // 2. Debounced engine mutation — batches rapid typing into one history entry.
      // Stores the flush closure in pendingFlushRef so the cleanup effect can
      // commit it when element/breakpoint/pseudo changes before the timer fires.
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      const writeOne = (id: string) => {
        // Re-read element inside the flush — avoids stale closure if element was replaced.
        const el = composer?.elements.getElement(id);
        if (!el) return;
        const sel = `[data-buildrick-id="${id}"]`;
        if (currentPseudoState !== "normal" && composer?.styles) {
          const mq = currentBreakpoint === "desktop" ? undefined : getBreakpointQuery(currentBreakpoint) ?? undefined;
          const pseudoSelector = `${sel}:${currentPseudoState}`;
          if (value === "" || value == null) {
            const existingRule = composer.styles.getRule(pseudoSelector, mq);
            if (existingRule) {
              const props = { ...existingRule.properties };
              delete props[property];
              composer.styles.setRule(sel, props, {
                pseudo: `:${currentPseudoState}`,
                mediaQuery: mq,
              });
            }
          } else {
            composer.styles.setRule(
              sel,
              { [property]: value },
              { pseudo: `:${currentPseudoState}`, mediaQuery: mq }
            );
          }
        } else if (value === "" || value == null) {
          if (currentBreakpoint === "desktop") {
            el.removeStyle?.(property);
          } else if (composer?.styles) {
            composer.styles.removeBreakpointStyleProperty(id, currentBreakpoint, property);
          }
        } else {
          if (currentBreakpoint === "desktop") {
            el.setStyle?.(property, value);
          } else if (composer?.styles) {
            composer.styles.setBreakpointStyle(id, currentBreakpoint, { [property]: value });
          }
        }
      };

      const flush = () => {
        if (!composer?.elements.getElement(selectedElement.id)) return;
        /* One transaction around the selected element AND its reach, so a
           fan-out to twelve buttons is one undo step rather than twelve. */
        composer?.beginTransaction?.("style-change");
        try {
          writeOne(selectedElement.id);
          for (const peerId of reachPeerIds) writeOne(peerId);
        } finally {
          composer?.endTransaction?.();
        }
      };
      pendingFlushRef.current = flush;
      debounceTimerRef.current = setTimeout(() => {
        flush();
        pendingFlushRef.current = null;
      }, 300);
    },
    [selectedElement, composer, currentBreakpoint, currentPseudoState, reachPeerIds]
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
        // Pseudo-state batch changes
        if (currentPseudoState !== "normal" && composer?.styles) {
          const selector = `[data-buildrick-id="${selectedElement.id}"]`;
          const pseudoSelector = `${selector}:${currentPseudoState}`;
          const mq =
            currentBreakpoint === "desktop"
              ? undefined
              : getBreakpointQuery(currentBreakpoint) ?? undefined;
          const existingRule = composer.styles.getRule(pseudoSelector, mq);
          const existing = existingRule ? { ...existingRule.properties } : {};

          Object.entries(changes).forEach(([prop, val]) => {
            if (val === "" || val == null) {
              delete existing[prop];
            } else {
              existing[prop] = val;
            }
          });

          composer.styles.setRule(selector, existing, { pseudo: `:${currentPseudoState}`, mediaQuery: mq });
          setStyles((prev) => {
            const merged = { ...prev };
            Object.entries(changes).forEach(([prop, val]) => {
              if (val === "" || val == null) delete merged[prop];
              else merged[prop] = val;
            });
            return merged;
          });
          return;
        }

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
    [selectedElement, composer, currentBreakpoint, currentPseudoState]
  );

  return {
    styles,
    handleStyleChange,
    handleBatchStyleChange,
    overriddenProperties,
  };
}
