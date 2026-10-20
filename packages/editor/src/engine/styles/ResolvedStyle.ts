/**
 * ResolvedStyle — the value a property actually has at a breakpoint and
 * state, by the one precedence contract canvas, Preview and publish share
 * (plan D10). The published stylesheet is desktop-first:
 *
 *   base (desktop)                      [data-buildrick-id] / .buildrick-<id>   (0,1,0)
 *   base :state                         [data-buildrick-id]:hover               (0,2,0)
 *   @media (max-width: 1023px)  tablet, then tablet :state
 *   @media (max-width: 767px)   mobile, then mobile :state
 *
 * At a breakpoint every wider layer still applies (a mobile viewport also
 * matches the tablet query), later layers win among equals, and a state rule
 * outranks every plain rule by specificity — so the desktop :hover beats a
 * tablet base value while hovering on tablet. Resolution mirrors exactly
 * that: plain layers widest → narrowest, then state layers widest → narrowest.
 *
 * Reading only through `StyleLayerSource` keeps this pure (no composer, no
 * DOM), so the inspector, the resize/keyboard nudges and tests share it.
 */
import { BREAKPOINT_ORDER } from "@/shared/constants/breakpoints";
import type { PseudoStateId } from "@/shared/types";
import type { BreakpointId } from "@/shared/types/breakpoints";

export interface StyleLayerSource {
  /** The element's base (desktop) styles. */
  base(): Record<string, string>;
  /** The element's own override at a non-desktop breakpoint. */
  breakpoint(breakpoint: Exclude<BreakpointId, "desktop">): Record<string, string>;
  /** The element's rule for `state` at `breakpoint` (desktop = no media query). */
  state(state: Exclude<PseudoStateId, "normal">, breakpoint: BreakpointId): Record<string, string>;
}

/** The breakpoints whose rules apply at `breakpoint`, widest first. */
function layersAt(breakpoint: BreakpointId): BreakpointId[] {
  const end = BREAKPOINT_ORDER.indexOf(breakpoint);
  return BREAKPOINT_ORDER.slice(0, end < 0 ? 1 : end + 1);
}

export function resolveStyle(
  source: StyleLayerSource,
  breakpoint: BreakpointId,
  state: PseudoStateId = "normal",
): Record<string, string> {
  const layers = layersAt(breakpoint);
  const out: Record<string, string> = {};
  for (const bp of layers) {
    Object.assign(out, bp === "desktop" ? source.base() : source.breakpoint(bp));
  }
  if (state !== "normal") {
    for (const bp of layers) Object.assign(out, source.state(state, bp));
  }
  return out;
}
