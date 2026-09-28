/**
 * useFieldOverrides — which properties of the selected element are
 * overridden HERE, and by what (R-DD-14). Feeds the field context the shared
 * controls read, the section headers' dots and notes, and the context row's
 * counts. Three kinds:
 *
 *   breakpoint — the current non-Desktop layer's own properties (board 28).
 *                Reported only on Base: while a :state is edited the fields
 *                show that state's values, not the layer's.
 *   pseudo     — the `:state` rule at the current breakpoint (board 27).
 *   master     — the component instance's own style edits over its master
 *                (board 26). The variant's styles are the master's, not an
 *                override.
 *
 * Everything is read from the engine and re-read on the engine's events: the
 * panel's optimistic `styles` updates before the debounced write lands, so a
 * memo on it went stale. Resets go through the lock gate (P-1), one undo step
 * each.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { BREAKPOINTS, getBreakpointQuery } from "@/shared/constants/breakpoints";
import { EVENTS } from "@/shared/constants/events";
import type { PseudoStateId } from "@/shared/types";
import type { BreakpointId } from "@/shared/types/breakpoints";
import { writeElement } from "@/engine/commands/commandOperations";
import type { OverrideKind } from "../shared/controls/InspectorFieldContext";

export interface FieldOverrides {
  overrides: ReadonlyMap<string, readonly OverrideKind[]>;
  /** What each kind's dot names: "Tablet", ":hover", the component's name. */
  labels: Readonly<Partial<Record<OverrideKind, string>>>;
  /** The context row's "Tablet · N overrides" and "N :hover overrides". */
  counts: { breakpoint: number; pseudo: number };
  resetOverride: (property: string, kind: OverrideKind) => void;
  /** Drop every override of this breakpoint at once ("Revert"). */
  revertBreakpoint: () => void;
  /** Clear the current :state's rule ("Reset"). */
  resetPseudo: () => void;
}

interface Read {
  breakpoint: string[];
  pseudo: string[];
  master: string[];
  masterName: string | null;
}

const EMPTY: Read = { breakpoint: [], pseudo: [], master: [], masterName: null };

/** Engine events after which any of the three kinds can have changed. */
const REREAD_ON = [
  EVENTS.STYLE_CHANGED,
  EVENTS.STYLE_REMOVED,
  EVENTS.ELEMENT_UPDATED,
  EVENTS.INSTANCE_OVERRIDE,
  EVENTS.INSTANCE_SYNCED,
  EVENTS.INSTANCE_DETACHED,
  EVENTS.INSTANCE_VARIANT_CHANGED,
  /* An undo / redo restores the style rules without a STYLE_CHANGED. */
  EVENTS.HISTORY_UNDO,
  EVENTS.HISTORY_REDO,
] as const;

const selectorOf = (elementId: string) => `[data-buildrick-id="${elementId}"]`;
const mediaOf = (bp: BreakpointId) => (bp === "desktop" ? undefined : getBreakpointQuery(bp) ?? undefined);

function readMaster(composer: Composer, elementId: string): Pick<Read, "master" | "masterName"> {
  const components = composer.components;
  const instance = components?.findInstanceContainingElement?.(elementId);
  if (!instance || instance.isDetached) return { master: [], masterName: null };
  const all = components.getOverridesForElement(elementId);
  const variant = components.getVariantStylesForElement(elementId) ?? {};
  return {
    master: Object.keys(all).filter((p) => !(p in variant) || variant[p] !== all[p]),
    masterName: components.getComponent(instance.componentId)?.name ?? null,
  };
}

const sameRead = (a: Read, b: Read) =>
  a.masterName === b.masterName &&
  a.breakpoint.join() === b.breakpoint.join() &&
  a.pseudo.join() === b.pseudo.join() &&
  a.master.join() === b.master.join();

export function useFieldOverrides(
  composer: Composer | null | undefined,
  elementId: string | null | undefined,
  breakpoint: BreakpointId,
  pseudoState: PseudoStateId = "normal",
): FieldOverrides {
  const read = React.useCallback((): Read => {
    if (!composer?.styles || !elementId) return EMPTY;
    const pseudoRule =
      pseudoState === "normal" ? null : composer.styles.getRule(`${selectorOf(elementId)}:${pseudoState}`, mediaOf(breakpoint));
    return {
      breakpoint: breakpoint === "desktop" ? [] : Object.keys(composer.styles.getBreakpointStyle(elementId, breakpoint)),
      pseudo: Object.keys(pseudoRule?.properties ?? {}),
      ...readMaster(composer, elementId),
    };
  }, [composer, elementId, breakpoint, pseudoState]);

  const [state, setState] = React.useState<Read>(read);
  React.useEffect(() => {
    const reread = () => setState((prev) => {
      const next = read();
      return sameRead(prev, next) ? prev : next;
    });
    reread();
    if (typeof composer?.on !== "function") return;
    for (const e of REREAD_ON) composer.on(e, reread);
    return () => {
      for (const e of REREAD_ON) composer.off(e, reread);
    };
  }, [composer, read]);

  const overrides = React.useMemo(() => {
    const map = new Map<string, OverrideKind[]>();
    const add = (props: readonly string[], kind: OverrideKind) => {
      for (const p of props) map.set(p, [...(map.get(p) ?? []), kind]);
    };
    if (pseudoState === "normal") add(state.breakpoint, "breakpoint");
    add(state.pseudo, "pseudo");
    add(state.master, "master");
    return map as ReadonlyMap<string, readonly OverrideKind[]>;
  }, [state, pseudoState]);

  const labels = React.useMemo(() => {
    const out: Partial<Record<OverrideKind, string>> = {};
    if (breakpoint !== "desktop") out.breakpoint = BREAKPOINTS[breakpoint]?.name ?? breakpoint;
    if (pseudoState !== "normal") out.pseudo = `:${pseudoState}`;
    if (state.masterName) out.master = state.masterName;
    return out;
  }, [breakpoint, pseudoState, state.masterName]);

  const write = React.useCallback(
    (label: string, run: (id: string) => void) => {
      if (!composer || !elementId) return;
      writeElement(composer, composer.elements.getElement(elementId), label, () => run(elementId));
    },
    [composer, elementId],
  );

  const dropBreakpoint = React.useCallback(
    (label: string, properties: readonly string[]) => {
      if (breakpoint === "desktop" || properties.length === 0) return;
      write(label, (id) => {
        for (const p of properties) composer?.styles.removeBreakpointStyleProperty(id, breakpoint, p);
      });
    },
    [write, breakpoint, composer],
  );

  /* P-9: `replace`, not merge — a merge keeps the key the reset took out. */
  const rewritePseudo = React.useCallback(
    (label: string, keep: (property: string) => boolean) => {
      if (pseudoState === "normal") return;
      write(label, (id) => {
        const mediaQuery = mediaOf(breakpoint);
        const current = composer?.styles.getRule(`${selectorOf(id)}:${pseudoState}`, mediaQuery)?.properties ?? {};
        const kept = Object.fromEntries(Object.entries(current).filter(([p]) => keep(p)));
        composer?.styles.setRule(selectorOf(id), kept, { pseudo: `:${pseudoState}`, mediaQuery, replace: true });
      });
    },
    [write, pseudoState, breakpoint, composer],
  );

  const resetOverride = React.useCallback(
    (property: string, kind: OverrideKind) => {
      if (kind === "breakpoint") dropBreakpoint(`revert-${property}-${breakpoint}`, [property]);
      else if (kind === "pseudo") rewritePseudo(`reset-${property}-${pseudoState}`, (p) => p !== property);
      /* master: the engine has no per-property "take the master's value"
         (ComponentManager only resets the whole instance), so a master dot
         announces and offers no reset — see OverrideDot. */
    },
    [dropBreakpoint, rewritePseudo, breakpoint, pseudoState],
  );

  const revertBreakpoint = React.useCallback(
    () => dropBreakpoint(`revert-all-${breakpoint}`, state.breakpoint),
    [dropBreakpoint, breakpoint, state.breakpoint],
  );
  const resetPseudo = React.useCallback(() => rewritePseudo(`reset-${pseudoState}`, () => false), [rewritePseudo, pseudoState]);

  const counts = React.useMemo(
    () => ({ breakpoint: state.breakpoint.length, pseudo: state.pseudo.length }),
    [state.breakpoint.length, state.pseudo.length],
  );

  return { overrides, labels, counts, resetOverride, revertBreakpoint, resetPseudo };
}
