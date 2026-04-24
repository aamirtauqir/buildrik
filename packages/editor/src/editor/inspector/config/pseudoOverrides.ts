/**
 * Pseudo-state override detection — breakpoint-aware.
 *
 * Returns the set of pseudo-states (hover/focus/active/disabled) that have
 * any rule defined for the given element at the active breakpoint. Powers
 * the ProInspector indicator pills so mobile/tablet pseudo overrides light
 * up at the right zoom level.
 */

import type { Composer } from "../../../engine";
import { getBreakpointQuery } from "../../../shared/constants/breakpoints";
import type { PseudoStateId } from "../../../shared/types";
import type { BreakpointId } from "../../../shared/types/breakpoints";

const PSEUDO_STATES = ["hover", "focus", "active", "disabled"] as const;

export function computeStatesWithOverrides(
  elementId: string | null | undefined,
  composer: Composer | null | undefined,
  currentBreakpoint: BreakpointId,
): Set<PseudoStateId> {
  const withOverrides = new Set<PseudoStateId>();
  if (!elementId || !composer?.styles) return withOverrides;

  const mq = currentBreakpoint === "desktop" ? undefined : getBreakpointQuery(currentBreakpoint) ?? undefined;

  for (const state of PSEUDO_STATES) {
    const rule = composer.styles.getRule(`[data-buildrick-id="${elementId}"]:${state}`, mq);
    if (rule && Object.keys(rule.properties ?? {}).length > 0) {
      withOverrides.add(state);
    }
  }

  return withOverrides;
}
