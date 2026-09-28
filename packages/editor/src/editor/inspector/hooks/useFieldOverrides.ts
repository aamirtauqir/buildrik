/**
 * useFieldOverrides — which properties of the selected element are
 * overridden HERE, and by what (R-DD-14). Feeds the field context the shared
 * controls read, and the section headers' dots.
 *
 * W1: the breakpoint kind — the properties the current (non-Desktop)
 * breakpoint's layer sets, read from the engine and kept current by
 * STYLE_CHANGED, with a reset that drops one through the lock gate. Lane L2-D2
 * adds :state (StyleEngine pseudo rule) and master
 * (ComponentManager.getOverridesForElement).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import type { BreakpointId } from "@/shared/types/breakpoints";
import { writeElement } from "@/engine/commands/commandOperations";
import type { OverrideKind } from "../shared/controls/InspectorFieldContext";

export interface FieldOverrides {
  overrides: ReadonlyMap<string, readonly OverrideKind[]>;
  resetOverride: (property: string, kind: OverrideKind) => void;
  /** Drop every override of this breakpoint at once ("Revert"). */
  revertBreakpoint: () => void;
}

export function useFieldOverrides(
  composer: Composer | null | undefined,
  elementId: string | null | undefined,
  breakpoint: BreakpointId,
): FieldOverrides {
  const read = React.useCallback((): string[] => {
    if (!composer?.styles || !elementId || breakpoint === "desktop") return [];
    return Object.keys(composer.styles.getBreakpointStyle(elementId, breakpoint));
  }, [composer, elementId, breakpoint]);

  /* Read from the engine, not from the panel's optimistic `styles`: that
     updates before the debounced write lands, so a memo on it went stale. */
  const [props, setProps] = React.useState<string[]>(read);
  React.useEffect(() => {
    setProps(read());
    if (typeof composer?.on !== "function") return;
    const onChange = () => setProps(read());
    composer.on(EVENTS.STYLE_CHANGED, onChange);
    return () => {
      composer.off(EVENTS.STYLE_CHANGED, onChange);
    };
  }, [composer, read]);

  const overrides = React.useMemo(() => {
    const map = new Map<string, readonly OverrideKind[]>();
    for (const p of props) map.set(p, ["breakpoint"]);
    return map;
  }, [props]);

  const drop = React.useCallback(
    (label: string, properties: readonly string[]) => {
      if (!composer || !elementId || breakpoint === "desktop" || properties.length === 0) return;
      /* P-1: through the lock gate — a locked element keeps its overrides. */
      writeElement(composer, composer.elements.getElement(elementId), label, () => {
        for (const p of properties) composer.styles.removeBreakpointStyleProperty(elementId, breakpoint, p);
      });
    },
    [composer, elementId, breakpoint],
  );

  const resetOverride = React.useCallback(
    (property: string, kind: OverrideKind) => {
      if (kind === "breakpoint") drop(`revert-${property}-${breakpoint}`, [property]);
    },
    [drop, breakpoint],
  );

  const revertBreakpoint = React.useCallback(() => drop(`revert-all-${breakpoint}`, props), [drop, breakpoint, props]);

  return { overrides, resetOverride, revertBreakpoint };
}
