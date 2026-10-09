/**
 * useStyleHandlers Hook
 * Manages style change handlers with breakpoint and pseudo-state awareness
 *
 * `extraTargetIds` is the rest of a multi-selection (DD-12): every edit lands
 * on the primary element AND those, only the property being edited, at the
 * same breakpoint and pseudo-state, inside one transaction — so one ⌘Z takes
 * the whole selection back. Locked members are skipped by the lock gate.
 * `blocked` (a pending save conflict, Q4) refuses every write.
 *
 * @license BSD-3-Clause
 */

import { useCallback, useState, useEffect, useRef } from "react";
import type { Composer } from "../../../engine";
import type { Element } from "@/engine/elements/Element";
import { getBreakpointQuery } from "../../../shared/constants/breakpoints";
import { getDefaultStyles } from "../../../shared/constants/defaultStyles";
import { EVENTS } from "../../../shared/constants";
import { getDOMElement } from "../../../engine/canvas/resize/utils";
import type { PseudoStateId } from "../../../shared/types";
import type { BreakpointId } from "../../../shared/types/breakpoints";
import { devLogger } from "../../../shared/utils/devLogger";
import { computeEffectiveStyles } from "../config/cssContext";
import { activeBreakpoint, canWrite, setStyleAt, writableElements } from "@/engine/commands/commandOperations";

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
  /** Run a discrete action (a segment, a select choice, a toggle, Reset /
   *  Revert) as its OWN undo step, written now. See the hook body. */
  runDiscrete: (action: () => void) => void;
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
  /** The rest of the selection each edit also lands on (DD-12). */
  extraTargetIds: readonly string[] = [],
  /** Refuse every write (a save conflict is pending). */
  blocked = false
): StyleHandlers {
  const [styles, setStyles] = useState<Record<string, string>>({});
  const [overriddenProperties, setOverriddenProperties] = useState<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The debounced single write not yet committed, and the property it writes. */
  const pendingFlushRef = useRef<{ property: string; run: () => void } | null>(null);

  /** Commit the pending debounced write NOW. Any write that must not be
   *  overtaken by it — another property, a batch, a selection change — calls
   *  this first; dropping it lost the edit, deferring it let it land late. */
  const flushPending = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
    const pending = pendingFlushRef.current;
    pendingFlushRef.current = null;
    pending?.run();
  }, []);

  /* Typing and scrubbing coalesce: the 300 ms debounce here and the engine's
     ~500 ms history window turn a run of keystrokes into one undo step. A
     discrete action must not ride along — Align then Reset 0.4 s later undid
     as ONE step, and a Reset fired inside the debounce was even overtaken by
     the Align it followed (QA 2026-10-02). So a discrete action commits
     what is pending first (in order, as its own step), writes at once, and
     closes its own step before anything else can join it (engine/AGENTS.md:
     `history.flushPending()`). */
  const runDiscrete = useCallback(
    (action: () => void) => {
      flushPending();
      composer?.history?.flushPending?.();
      action();
      flushPending();
      composer?.history?.flushPending?.();
    },
    [composer, flushPending],
  );

  // Flush any pending debounced style change when element/breakpoint/pseudoState changes.
  // Prior: cleanup silently dropped the last keystroke. Now we commit it first.
  useEffect(() => flushPending, [selectedElement?.id, currentBreakpoint, currentPseudoState, flushPending]);

  // Load styles when element or breakpoint changes. Cascade (base → breakpoint
  // overlay → pseudo) is delegated to computeEffectiveStyles so there's ONE
  // source of truth for the layering logic — shared with deriveCssContext.
  // Only the default-style layer and the overriddenKeys indicator stay local
  // to this hook.
  /* Re-read trigger for the computed fallback below. Bumped by any event that
     can repaint the selected element without changing what is selected. */
  const [bump, setBump] = useState(0);
  useEffect(() => {
    /* Optional because the panel is mounted against partial composers in
       several suites, and a missing bus must degrade to "no re-read", never to
       a crash inside the inspector. */
    if (typeof composer?.on !== "function" || typeof composer?.off !== "function") return;
    const onRepaint = () => setBump((n) => n + 1);
    /* A device switch re-renders the canvas sheet on the next frame
       (StyleEngine), so the rendered read waits for it. */
    let frame = 0;
    const onDeviceSwitch = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(onRepaint);
    };
    composer.on(EVENTS.STYLE_CHANGED, onRepaint);
    composer.on(EVENTS.PROJECT_LOADED, onRepaint);
    composer.on(EVENTS.BREAKPOINT_CHANGED, onDeviceSwitch);
    return () => {
      cancelAnimationFrame(frame);
      composer.off(EVENTS.STYLE_CHANGED, onRepaint);
      composer.off(EVENTS.PROJECT_LOADED, onRepaint);
      composer.off(EVENTS.BREAKPOINT_CHANGED, onDeviceSwitch);
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

    const effective = computeEffectiveStyles(el, composer, currentBreakpoint, currentPseudoState);
    const defaultStyles = getDefaultStyles(selectedElement.type, selectedElement.tagName);
    /* An authored `background` shorthand carries the fill; the type's default
       `background-color` would otherwise mask it — Fill read the default blue
       on a button the shorthand made translucent (L2-011). */
    if (effective.background && !effective["background-color"]) delete defaultStyles["background-color"];
    /* For a property the element does not carry, the panel used to print the
       TYPE's default — so a legacy heading with no font-size of its own read
       "36" while it rendered at 24. Measured live at 1440×900 on a heading that
       predates `applyTypeDefaults`.

       The default is still the base, because it decides WHICH rows appear.
       What each unset row SHOWS is now what the element actually renders, read
       off the canvas node. Authored values are untouched — `effective` is
       applied last and still wins.

       Only keys the defaults already name are read, so the row set does not
       change; and only while the canvas shows the breakpoint being edited
       (L2-018): the canvas re-emits the active device's breakpoint rules, so
       on Tablet its computed value IS the value cascading from the base. Off
       that device it describes another breakpoint and is not read. A
       pseudo-state reads it too: for a row its rule does not set, the normal
       state's rendered value is what the state inherits. */
    const rendered =
      currentBreakpoint === activeBreakpoint(composer)
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
      if (!selectedElement?.id || blocked) return;

      /* P-1: a locked element is read-only; the lock gate refuses and says so. */
      if (!composer || !canWrite(composer, selectedElement.id)) return;

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
      // Rapid writes to the SAME property coalesce (the pending one is
      // superseded); a pending write to another property is committed first.
      if (pendingFlushRef.current && pendingFlushRef.current.property !== property) flushPending();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      const writeOne = (el: Element) => {
        const id = el.getId();
        const sel = `[data-buildrick-id="${id}"]`;
        /* P-8: a device-hide flag (`--hide-tablet`) names its own device, so it
           always goes on the base styles — the one place the canvas
           (Canvas.css `[style*="--hide-<bp>: true"]`) and the export
           (ExportEngine hideRulesFor) read it. Written into the tablet rule
           while the canvas was on Tablet, it hid nothing anywhere. */
        const baseOnly = property.startsWith("--hide-");
        const bp = baseOnly ? "desktop" : currentBreakpoint;
        const pseudo = baseOnly ? "normal" : currentPseudoState;
        if (pseudo !== "normal" && composer?.styles) {
          const mq = bp === "desktop" ? undefined : getBreakpointQuery(bp) ?? undefined;
          const pseudoSelector = `${sel}:${pseudo}`;
          if (value === "" || value == null) {
            const existingRule = composer.styles.getRule(pseudoSelector, mq);
            if (existingRule) {
              const props = { ...existingRule.properties };
              delete props[property];
              composer.styles.setRule(sel, props, {
                pseudo: `:${pseudo}`,
                mediaQuery: mq,
                replace: true,
              });
            }
          } else {
            composer.styles.setRule(
              sel,
              { [property]: value },
              { pseudo: `:${pseudo}`, mediaQuery: mq }
            );
          }
        } else {
          /* The base on desktop, the breakpoint override elsewhere — the same
             branch the canvas-direct writes use (engine setStyleAt). */
          setStyleAt(composer, el, bp, property, value ?? "");
        }
      };

      const flush = () => {
        if (!composer?.elements.getElement(selectedElement.id)) return;
        /* Re-read inside the flush — avoids a stale closure if an element was
           replaced. P-1: a locked member of the selection is skipped by the
           lock gate, which says so. */
        const targets = writableElements(
          composer,
          [selectedElement.id, ...extraTargetIds].map((id) => composer.elements.getElement(id)),
        );
        if (targets.length === 0) return;
        /* One transaction around the whole selection, so an edit to three
           headings is one undo step rather than three. */
        composer.beginTransaction?.("style-change");
        try {
          for (const el of targets) writeOne(el);
        } finally {
          composer?.endTransaction?.();
        }
      };
      pendingFlushRef.current = { property, run: flush };
      debounceTimerRef.current = setTimeout(flushPending, 300);
    },
    [selectedElement, composer, currentBreakpoint, currentPseudoState, extraTargetIds, blocked, flushPending]
  );

  // Batch style change handler
  const handleBatchStyleChange = useCallback(
    (changes: Record<string, string>) => {
      if (!selectedElement?.id || blocked) return;

      if (!composer) return;
      /* The whole selection, like a single edit (DD-12, board 22 "Edits apply
         to all N"). P-1: locked members are skipped by the lock gate, which
         says so. */
      const targets = writableElements(
        composer,
        [selectedElement.id, ...extraTargetIds].map((id) => composer.elements.getElement(id)),
      );
      if (targets.length === 0) return;

      /* A pending single write (a gradient being dragged) would otherwise fire
         AFTER this batch and undo it — the Fill switch to Color came back as
         the gradient. Commit it first so the batch has the last word. */
      flushPending();

      // Trace batch style change for debugging
      devLogger.style("batch-change", {
        elementId: selectedElement.id,
        properties: Object.keys(changes),
        count: Object.keys(changes).length,
        breakpoint: currentBreakpoint,
      });

      const mq = currentBreakpoint === "desktop" ? undefined : getBreakpointQuery(currentBreakpoint) ?? undefined;
      const writeOne = (el: Element) => {
        const id = el.getId();
        // Pseudo-state batch changes: each element's OWN rule.
        if (currentPseudoState !== "normal" && composer.styles) {
          const selector = `[data-buildrick-id="${id}"]`;
          const existingRule = composer.styles.getRule(`${selector}:${currentPseudoState}`, mq);
          const existing = existingRule ? { ...existingRule.properties } : {};
          Object.entries(changes).forEach(([prop, val]) => {
            if (val === "" || val == null) delete existing[prop];
            else existing[prop] = val;
          });
          composer.styles.setRule(selector, existing, { pseudo: `:${currentPseudoState}`, mediaQuery: mq, replace: true });
          return;
        }

        const toSet: Record<string, string> = {};
        Object.entries(changes).forEach(([prop, val]) => {
          if (val === "" || val == null) {
            if (currentBreakpoint === "desktop") {
              el.removeStyle?.(prop);
            } else if (composer.styles) {
              composer.styles.removeBreakpointStyleProperty(id, currentBreakpoint, prop);
            }
          } else {
            toSet[prop] = val;
          }
        });
        if (Object.keys(toSet).length > 0) {
          if (currentBreakpoint === "desktop") {
            Object.entries(toSet).forEach(([prop, val]) => el.setStyle?.(prop, val));
          } else if (composer.styles) {
            composer.styles.setBreakpointStyle(id, currentBreakpoint, toSet);
          }
        }
      };

      /* One transaction around the whole selection — one undo step. */
      composer.beginTransaction?.("style-batch");
      try {
        for (const el of targets) writeOne(el);
        setStyles((prev) => {
          const merged = { ...prev };
          Object.entries(changes).forEach(([prop, val]) => {
            if (val === "" || val == null) delete merged[prop];
            else merged[prop] = val;
          });
          return merged;
        });
      } finally {
        composer.endTransaction?.();
      }
    },
    [selectedElement, composer, currentBreakpoint, currentPseudoState, extraTargetIds, blocked, flushPending]
  );

  return {
    styles,
    handleStyleChange,
    handleBatchStyleChange,
    overriddenProperties,
    runDiscrete,
  };
}
